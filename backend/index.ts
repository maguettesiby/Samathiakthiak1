import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth';
import riderRoutes from './routes/riders';
import paymentRoutes from './routes/payments';
import testRoutes from './routes/test';
import subscriptionRoutes from './routes/subscription';
import favoritesRoutes from './routes/favorites';
import reviewsRoutes from './routes/reviews';
import statsRoutes from './routes/stats';
import usersRoutes from './routes/users';
import cronService from './services/cronService';
import { testConnection } from './database/config';
import { 
  corsOptions, 
  corsOptionsForStatic,
  helmetConfig, 
  generalLimiter, 
  authLimiter, 
  paymentLimiter,
  sanitizeInput,
  validateInput,
  securityLogger
} from './middleware/security';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_PATH = path.join(__dirname, '..', 'frontend');

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware de sécurité - ORDRE IMPORTANT
app.use(helmetConfig);
app.use(securityLogger);

// CORS sécurisé
app.use(cors(corsOptions));

// Body parsing avec limites de taille
app.use(express.json({ 
  limit: '10mb',
  strict: true
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000
}));

// Validation et nettoyage des entrées
app.use(sanitizeInput);
app.use(validateInput);

// Rate limiting général
app.use(generalLimiter);

// Servir les fichiers téléchargés (photos de profil, etc.)
app.use('/uploads', cors(corsOptions), express.static(uploadsDir, {
  maxAge: NODE_ENV === 'production' ? '1d' : '0',
  etag: true,
  lastModified: true
}));

// Routes API avec rate limiting spécifique
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/riders', riderRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/test', testRoutes);

// Route API info
app.get('/api', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\'API SamaThiakThiak',
    version: '1.0.0',
    database: 'MySQL',
    endpoints: {
      auth: '/api/auth',
      riders: '/api/riders',
      payments: '/api/payments',
      test: '/api/test'
    }
  });
});

// En production, servir le frontend
if (NODE_ENV === 'production') {
  app.use(express.static(FRONTEND_PATH));
  
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Route API non trouvée' });
    }
    res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      message: 'Bienvenue sur l\'API SamaThiakThiak',
      version: '1.0.0',
      mode: 'development',
      database: 'MySQL',
      note: 'Le frontend doit être lancé séparément.',
      endpoints: {
        auth: '/api/auth',
        riders: '/api/riders',
        apiInfo: '/api'
      }
    });
  });
}

// Démarrer le serveur
const startServer = async () => {
  // Tester la connexion à la base de données
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.log('⚠️  La base de données n\'est pas connectée.');
    console.log('📋 Pour initialiser la base de données, exécutez: npm run init-db');
    console.log('📋 Assurez-vous que MySQL est démarré et que les identifiants dans .env sont corrects.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`� Environnement: ${NODE_ENV}`);
    console.log(`� API disponible sur: http://localhost:${PORT}/api`);
    console.log(`📁 Fichiers statiques: http://localhost:${PORT}/uploads`);
    
    // Démarrer le service de traitement automatique des renouvellements
    cronService.start();
    
    // Gérer l'arrêt gracieux
    process.on('SIGINT', () => {
      console.log('\n� Arrêt du serveur...');
      cronService.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Arrêt du serveur...');
      cronService.stop();
      process.exit(0);
    });
  });
};

startServer();
