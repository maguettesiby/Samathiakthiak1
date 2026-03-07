import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extension du type Request pour inclure l'utilisateur
export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
    email?: string;
    phone?: string;
  };
}

// Middleware d'authentification JWT
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token d\'authentification requis' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key') as any;
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      phone: decoded.phone
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

// Middleware pour vérifier le rôle admin
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
  }
  next();
};

// Middleware pour vérifier le rôle rider
export const requireRider = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'rider' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: 'Accès réservé aux livreurs' });
  }
  next();
};
