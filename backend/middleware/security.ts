import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

// Configuration CORS sécurisée
export const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://samathiakthiak.sn', 'https://www.samathiakthiak.sn']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Configuration CORS spécifique pour les fichiers statiques (images)
export const corsOptionsForStatic = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://samathiakthiak.sn', 'https://www.samathiakthiak.sn']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: false,
  optionsSuccessStatus: 200,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
};

// Rate limiting général
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par windowMs
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting pour les requêtes statiques
    return req.url.includes('/images/') || req.url.includes('/css/') || req.url.includes('/js/');
  }
});

// Rate limiting strict pour l'authentification
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives de connexion par IP
  message: {
    error: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Rate limiting pour les paiements
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 tentatives de paiement par minute
  message: {
    error: 'Trop de tentatives de paiement, veuillez réessayer dans 1 minute.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Configuration Helmet pour la sécurité des headers
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.wave.com", "https://api.paytech.sn"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Validation et nettoyage des entrées
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim()
        .replace(/[<>]/g, '') // Supprime les balises HTML
        .replace(/javascript:/gi, '') // Supprime les protocoles javascript
        .replace(/on\w+\s*=/gi, ''); // Supprime les event handlers
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

// Validation des entrées utilisateur
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  
  // Validation basique des emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (body.email && !emailRegex.test(body.email)) {
    return res.status(400).json({ 
      error: 'Format d\'email invalide',
      code: 'INVALID_EMAIL'
    });
  }

  // Validation des numéros de téléphone (format sénégalais)
  const phoneRegex = /^(?:\+221|00221)?(77|76|75|78|70)[0-9]{7}$/;
  if (body.phone && !phoneRegex.test(body.phone.replace(/\s/g, ''))) {
    return res.status(400).json({ 
      error: 'Format de numéro de téléphone invalide',
      code: 'INVALID_PHONE'
    });
  }

  // Validation des mots de passe
  if (body.password) {
    if (body.password.length < 4) {
      return res.status(400).json({ 
        error: 'Le mot de passe doit contenir au moins 4 caractères',
        code: 'PASSWORD_TOO_SHORT'
      });
    }
  }

  // Limitation de la taille des données
  const jsonString = JSON.stringify(body);
  if (jsonString.length > 1024 * 1024) { // 1MB max
    return res.status(413).json({ 
      error: 'Données trop volumineuses',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

  next();
};

// Middleware de logging sécurisé
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log les requêtes sensibles (sans données sensibles)
  const logData: any = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  };

  // Masquer les données sensibles dans les logs
  if ((req as any).body) {
    const sanitizedBody = { ...(req as any).body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
    logData.body = sanitizedBody;
  }

  console.log('SECURITY_LOG:', JSON.stringify(logData));

  // Log la réponse
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log('RESPONSE_LOG:', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });

  next();
};
