import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../database/config';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Interface pour les utilisateurs
interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  phone: string;
  password: string;
  name: string;
  role: string;
  email_verified: boolean;
}

// Interface pour les riders
interface RiderRow extends RowDataPacket {
  id: number;
  user_id: number;
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

// POST /api/auth/login - Connexion
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    console.log('[AUTH] ===== TENTATIVE DE CONNEXION =====');
    console.log('[AUTH] Données reçues:', {
      identifier: identifier ? identifier.replace(/(.{2}).*(@.*)/, '$1***$2') : 'undefined',
      hasPassword: !!password,
      passwordLength: password ? password.length : 0,
      timestamp: new Date().toISOString()
    });

    if (!identifier || !password) {
      console.log('[AUTH] Échec connexion: identifiant ou mot de passe manquant');
      return res.status(400).json({ message: 'Email/téléphone et mot de passe requis' });
    }

    // Nettoyer l'identifiant (supprimer les espaces pour les numéros de téléphone)
    const cleanIdentifier = identifier.replace(/\s/g, '');
    console.log('[AUTH] Identifiant nettoyé:', cleanIdentifier.replace(/(.{3}).*/, '$1***'));
    
    // Rechercher d'abord dans la table users
    console.log('[AUTH] 🔍 Recherche dans table users...');
    const [userRows] = await pool.query<UserRow[]>(
      'SELECT * FROM users WHERE email = ? OR phone = ?',
      [identifier, cleanIdentifier]
    );

    console.log('[AUTH] Résultat table users:', {
      found: userRows.length > 0,
      count: userRows.length
    });

    // Si pas trouvé dans users, chercher dans riders
    let user = null;
    let isRider = false;

    if (userRows.length > 0) {
      user = userRows[0];
      console.log('[AUTH] Utilisateur trouvé dans table users:', {
        id: user.id,
        email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        phone: user.phone.replace(/(.{3}).*/, '$1***'),
        role: user.role,
        emailVerified: user.email_verified
      });
    } else {
      console.log('[AUTH] 🔍 Recherche dans table riders...');
      // Chercher dans la table riders
      const [riderRows] = await pool.query<RiderRow[]>(
        'SELECT * FROM riders WHERE email = ? OR phone = ?',
        [identifier, cleanIdentifier]
      );

      console.log('[AUTH] Résultat table riders:', {
        found: riderRows.length > 0,
        count: riderRows.length
      });

      if (riderRows.length > 0) {
        const rider = riderRows[0];
        console.log('[AUTH] ✅ Rider brut trouvé:', {
          id: rider.id,
          userId: rider.user_id,
          email: rider.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          phone: rider.phone.replace(/(.{3}).*/, '$1***'),
          firstName: rider.firstName,
          lastName: rider.lastName,
          hasPassword: !!rider.password
        });
        
        // Convertir le rider en format user pour la réponse
        user = {
          id: rider.user_id,
          email: rider.email,
          phone: rider.phone,
          password: rider.password,
          name: `${rider.firstName} ${rider.lastName}`,
          role: rider.role || 'rider',
          email_verified: true // Riders considérés comme vérifiés
        };
        isRider = true;
        
        console.log('[AUTH] ✅ Utilisateur converti depuis rider:', {
          id: user.id,
          email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          phone: user.phone.replace(/(.{3}).*/, '$1***'),
          role: user.role,
          isRider: true,
          hasPassword: !!user.password
        });
      }
    }

    if (!user) {
      console.log('[AUTH] Échec connexion: utilisateur non trouvé dans les deux tables');
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('[AUTH] Vérification mot de passe:', {
      userId: user.id,
      match: isMatch,
      isRider
    });

    if (!isMatch) {
      console.log('[AUTH] Échec connexion: mot de passe incorrect');
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        email: user.email,
        phone: user.phone
      },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '7d' }
    );

    console.log('[AUTH] Connexion réussie:', {
      userId: user.id,
      role: user.role,
      isRider,
      timestamp: new Date().toISOString()
    });

    res.json({
      token,
      user: {
        id: user.id.toString(),
        email: user.email,
        phone: user.phone,
        role: user.role,
        name: user.name,
        emailVerified: user.email_verified
      }
    });

  } catch (error: any) {
    console.error('[AUTH] Erreur login:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/auth/register - Inscription utilisateur simple
router.post('/register', async (req, res) => {
  try {
    const { email, phone, password, name } = req.body;

    console.log('[AUTH] Tentative d\'inscription:', {
      email: email ? email.replace(/(.{2}).*(@.*)/, '$1***$2') : 'undefined',
      phone: phone ? phone.replace(/(.{3}).*/, '$1***') : 'undefined',
      name: name || 'undefined',
      timestamp: new Date().toISOString()
    });

    if (!password || (!email && !phone)) {
      console.log('[AUTH] Échec inscription: email ou téléphone et mot de passe requis');
      return res.status(400).json({ message: 'Email ou téléphone et mot de passe requis' });
    }

    // Vérifier si l'utilisateur existe déjà
    const [existing] = await pool.query<UserRow[]>(
      'SELECT id FROM users WHERE email = ? OR phone = ?',
      [email || '', phone || '']
    );

    console.log('[AUTH] Vérification utilisateur existant:', {
      email: email ? email.replace(/(.{2}).*(@.*)/, '$1***$2') : 'undefined',
      phone: phone ? phone.replace(/(.{3}).*/, '$1***') : 'undefined',
      exists: existing.length > 0
    });

    if (existing.length > 0) {
      console.log('[AUTH] Échec inscription: utilisateur existe déjà');
      return res.status(400).json({ message: 'Un compte existe déjà avec cet email ou téléphone' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('[AUTH] Mot de passe hashé avec succès');

    // Créer l'utilisateur
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (email, phone, password, name, role) VALUES (?, ?, ?, ?, ?)',
      [email || null, phone || null, hashedPassword, name || null, 'user']
    );

    console.log('[AUTH] Utilisateur créé avec succès:', {
      userId: result.insertId,
      email: email ? email.replace(/(.{2}).*(@.*)/, '$1***$2') : 'null',
      phone: phone ? phone.replace(/(.{3}).*/, '$1***') : 'null',
      role: 'user',
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Inscription réussie',
      user: {
        id: result.insertId.toString(),
        email,
        phone,
        name,
        role: 'user'
      }
    });

  } catch (error: any) {
    console.error('[AUTH] Erreur register:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/auth/forgot-password - Mot de passe oublié (simulé)
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;

    // Vérifier si l'utilisateur existe
    const [rows] = await pool.query<UserRow[]>(
      'SELECT id, email, phone FROM users WHERE email = ? OR phone = ?',
      [identifier, identifier]
    );

    if (rows.length === 0) {
      // Ne pas révéler si l'utilisateur existe ou non
      return res.json({ message: 'Si un compte existe, un email/SMS de réinitialisation sera envoyé' });
    }

    // TODO: Envoyer un vrai email/SMS avec un token de réinitialisation
    res.json({ message: 'Instructions de réinitialisation envoyées' });

  } catch (error: any) {
    console.error('Erreur forgot-password:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;

// PUT /api/auth/change-password - Changer de mot de passe (authentifié)
router.put('/change-password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'Les nouveaux mots de passe ne correspondent pas' });
    }

    // Récupérer l'utilisateur
    const [rows] = await pool.query<UserRow[]>(
      'SELECT * FROM users WHERE id = ?',
      [req.user!.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const user = rows[0];

    // Vérifier l'ancien mot de passe
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
    }

    // Mettre à jour avec le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Mot de passe mis à jour avec succès' });

  } catch (error: any) {
    console.error('Erreur change-password:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
