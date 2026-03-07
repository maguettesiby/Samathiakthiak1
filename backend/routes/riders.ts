import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/config';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth';

const router = Router();

// Interface pour les riders
interface RiderRow extends RowDataPacket {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  gender: string;
  rider_function: string;
  status: string;
  availability: string;
  availability_since?: string | null;
  subscription_expires_at?: string;
  profile_photo?: string;
  id_card?: string;
  license?: string;
  verification_note?: string | null;
  joined_at: string;
}

interface NotificationRow extends RowDataPacket {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
}

// Configuration de Multer pour stocker les images
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.fieldname}${path.extname(file.originalname)}`);
  }
});

// GET /api/riders/me/notifications - Notifications du livreur connecté
router.get('/me/notifications', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.query<NotificationRow[]>(
      `SELECT id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user!.id]
    );

    res.json(
      rows.map((n) => ({
        id: n.id.toString(),
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: Boolean(n.is_read),
        createdAt: n.created_at,
      }))
    );
  } catch (error: any) {
    console.error('Erreur get notifications:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/riders/me/notifications/:id/read - Marquer une notification comme lue
router.put('/me/notifications/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, req.user!.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    res.json({ message: 'Notification marquée comme lue' });
  } catch (error: any) {
    console.error('Erreur mark notification read:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Seules les images sont autorisées'));
  }
});

// POST /api/riders/register - Inscription d'un livreur
router.post('/register', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'idCard', maxCount: 1 },
  { name: 'license', maxCount: 1 }
]), async (req: any, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { firstName, lastName, phone, email, address, password, confirmPassword, riderFunction, gender } = req.body;
    const files = req.files || {};

    console.log('[Riders/Register] Données reçues:', { firstName, lastName, phone, email, address, password: '***', riderFunction, gender, filesCount: Object.keys(files).length });

    // Validation
    if (!firstName || !lastName || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
    }

    if (!files.profilePhoto || !files.idCard || !files.license) {
      return res
        .status(400)
        .json({
          message:
            "Photo de profil, carte d'identité et permis de conduire sont obligatoires",
        });
    }

    if (gender && !['male', 'female'].includes(gender)) {
      return res.status(400).json({ message: 'Genre invalide' });
    }

    // Vérifier si l'utilisateur existe déjà
    const [existing] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? OR phone = ?',
      [email || '', phone.replace(/\s/g, '')]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Un compte existe déjà avec cet email ou téléphone' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const [userResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO users (email, phone, password, name, role) VALUES (?, ?, ?, ?, ?)',
      [email || null, phone.replace(/\s/g, ''), hashedPassword, `${firstName} ${lastName}`, 'rider']
    );

    const userId = userResult.insertId;

    // Créer le rider avec un abonnement initial (par ex. 30 jours)
    const subscriptionDurationDays = 30;
    const subscriptionExpiresAt = new Date(Date.now() + subscriptionDurationDays * 24 * 60 * 60 * 1000);
    const profilePhoto = `/uploads/${files.profilePhoto[0].filename}`;
    const idCard = `/uploads/${files.idCard[0].filename}`;
    const license = `/uploads/${files.license[0].filename}`;

    const [riderResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO riders (
         user_id, first_name, last_name, phone, address, gender,
         rider_function, status, availability, subscription_expires_at,
         profile_photo, id_card, license
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'offline', ?, ?, ?, ?)`,
      [
        userId,
        firstName,
        lastName,
        phone.replace(/\s/g, ''),
        address || '',
        gender || 'male',
        riderFunction || 'Livreur moto',
        subscriptionExpiresAt,
        profilePhoto,
        idCard,
        license
      ]
    );

    await connection.commit();

    console.log('[Riders/Register] Inscription réussie pour:', { firstName, lastName, phone, userId, riderId: riderResult.insertId });

    res.status(201).json({
      message: 'Inscription réussie! Votre compte est en attente de validation par un administrateur.',
      rider: {
        id: riderResult.insertId.toString(),
        firstName,
        lastName,
        phone,
        address,
        gender: gender || 'male',
        riderFunction: riderFunction || 'Livreur moto',
        status: 'pending',
        availability: 'offline',
        profile_photo: profilePhoto,
        id_card: idCard,
        license: license,
        joined_at: new Date().toISOString()
      }
    });

  } catch (error: any) {
    await connection.rollback();
    console.error('[Riders/Register] Erreur inscription rider:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    connection.release();
  }
});

// GET /api/riders/public - Liste publique des livreurs actifs (avec abonnement valide)
router.get('/public', async (req, res) => {
  try {
    const [riders] = await pool.query<RiderRow[]>(
      `SELECT id, first_name, last_name, phone, address, gender, rider_function, 
              status, availability, subscription_expires_at, profile_photo, id_card, license, joined_at
       FROM riders 
       WHERE status = 'active'
         AND subscription_expires_at IS NOT NULL
         AND subscription_expires_at > NOW()
       ORDER BY availability = 'online' DESC, joined_at DESC`
    );

    // Formater les données pour le frontend
    const formattedRiders = riders.map(rider => ({
      id: rider.id.toString(),
      firstName: rider.first_name,
      lastName: rider.last_name,
      phone: rider.phone,
      address: rider.address,
      gender: rider.gender,
      riderFunction: rider.rider_function,
      status: rider.status,
      availability: rider.availability,
      subscription_expires_at: rider.subscription_expires_at,
      profile_photo: rider.profile_photo,
      id_card: rider.id_card,
      license: rider.license,
      joined_at: rider.joined_at
    }));

    res.json(formattedRiders);

  } catch (error: any) {
    console.error('Erreur get public riders:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/riders/me - Récupérer mon profil
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [riders] = await pool.query<RiderRow[]>(
      `SELECT r.*, u.email 
       FROM riders r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.user_id = ?`,
      [req.user!.id]
    );

    if (riders.length === 0) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }

    const rider = riders[0];
    const isSubscriptionActive =
      rider.subscription_expires_at &&
      new Date(rider.subscription_expires_at).getTime() > Date.now();
    res.json({
      id: rider.id.toString(),
      firstName: rider.first_name,
      lastName: rider.last_name,
      phone: rider.phone,
      address: rider.address,
      gender: rider.gender,
      riderFunction: rider.rider_function,
      status: rider.status,
      availability: rider.availability,
      availabilitySince: rider.availability_since,
      subscriptionExpiresAt: rider.subscription_expires_at,
      subscriptionActive: isSubscriptionActive,
      subscription_expires_at: rider.subscription_expires_at,
      profile_photo: rider.profile_photo,
      id_card: rider.id_card,
      license: rider.license,
      verificationNote: rider.verification_note,
      joined_at: rider.joined_at
    });

  } catch (error: any) {
    console.error('Erreur get me:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/riders/me/subscription/renew - Renouveler l'abonnement d'un livreur connecté
router.put('/me/subscription/renew', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const durationDays = 30; // 30 jours pour 500 F

    const [rows] = await pool.query<RiderRow[]>(
      'SELECT * FROM riders WHERE user_id = ?',
      [req.user!.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }

    const current = rows[0];
    const now = new Date();
    const baseDate =
      current.subscription_expires_at &&
      new Date(current.subscription_expires_at).getTime() > now.getTime()
        ? new Date(current.subscription_expires_at)
        : now;

    const newExpiry = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await pool.query(
      'UPDATE riders SET subscription_expires_at = ? WHERE user_id = ?',
      [newExpiry, req.user!.id]
    );

    res.json({
      subscriptionExpiresAt: newExpiry.toISOString()
    });

  } catch (error: any) {
    console.error('Erreur renew subscription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/riders/me/profile - Mettre à jour nom et photo de profil du livreur connecté
router.put(
  '/me/profile',
  authenticate,
  upload.single('profilePhoto'),
  async (req: AuthRequest, res: Response) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const { firstName, lastName } = req.body;

      if (!firstName || !lastName) {
        return res
          .status(400)
          .json({ message: 'Prénom et nom sont obligatoires' });
      }

      const [rows] = await connection.query<RiderRow[]>(
        'SELECT * FROM riders WHERE user_id = ?',
        [req.user!.id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Profil non trouvé' });
      }

      const current = rows[0];

      // Nouveau chemin de photo si un fichier est envoyé, sinon conserver l'existant
      const newProfilePhoto = req.file
        ? `/uploads/${req.file.filename}`
        : current.profile_photo;

      // Mettre à jour le rider
      await connection.query(
        'UPDATE riders SET first_name = ?, last_name = ?, profile_photo = ? WHERE user_id = ?',
        [firstName, lastName, newProfilePhoto, req.user!.id]
      );

      // Mettre aussi à jour le nom dans users
      await connection.query(
        'UPDATE users SET name = ? WHERE id = ?',
        [`${firstName} ${lastName}`, req.user!.id]
      );

      await connection.commit();

      res.json({
        id: current.id.toString(),
        firstName,
        lastName,
        phone: current.phone,
        address: current.address,
        gender: current.gender,
        riderFunction: current.rider_function,
        status: current.status,
        availability: current.availability,
        profile_photo: newProfilePhoto,
        id_card: current.id_card,
        license: current.license,
        joined_at: current.joined_at
      });
    } catch (error: any) {
      await connection.rollback();
      console.error('Erreur update profile:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    } finally {
      connection.release();
    }
  }
);

// PUT /api/riders/availability - Mettre à jour la disponibilité
router.put('/availability', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['offline', 'online', 'busy'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const [rows] = await pool.query<RiderRow[]>(
      'SELECT availability, availability_since FROM riders WHERE user_id = ?',
      [req.user!.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }

    const current = rows[0];
    let nextSince: Date | null = null;

    if (status === 'online') {
      nextSince = null;
    } else if (status === 'busy' || status === 'offline') {
      const sameStatus = current.availability === status;
      const hasSince = Boolean(current.availability_since);
      nextSince = sameStatus && hasSince ? null : new Date();
    }

    if (nextSince === null) {
      await pool.query(
        'UPDATE riders SET availability = ?, availability_since = NULL WHERE user_id = ?',
        [status, req.user!.id]
      );
    } else {
      await pool.query(
        'UPDATE riders SET availability = ?, availability_since = ? WHERE user_id = ?',
        [status, nextSince, req.user!.id]
      );
    }

    res.json({ message: 'Disponibilité mise à jour', availability: status });

  } catch (error: any) {
    console.error('Erreur update availability:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/riders - Liste de tous les livreurs (admin seulement)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [riders] = await pool.query<RiderRow[]>(
      `SELECT r.*, u.email 
       FROM riders r 
       JOIN users u ON r.user_id = u.id 
       ORDER BY r.joined_at DESC`
    );

    const formattedRiders = riders.map(rider => ({
      id: rider.id.toString(),
      firstName: rider.first_name,
      lastName: rider.last_name,
      phone: rider.phone,
      address: rider.address,
      gender: rider.gender,
      riderFunction: rider.rider_function,
      status: rider.status,
      availability: rider.availability,
      profile_photo: rider.profile_photo,
      id_card: rider.id_card,
      license: rider.license,
      verificationNote: rider.verification_note,
      joined_at: rider.joined_at
    }));

    res.json(formattedRiders);

  } catch (error: any) {
    console.error('Erreur get all riders:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/riders/:id/status - Mettre à jour le statut d'un livreur (admin)
router.put('/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { status, verificationNote } = req.body as { status: string; verificationNote?: unknown };
    const validStatuses = ['pending', 'documents_required', 'active', 'rejected', 'banned'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const requiresNote = status === 'documents_required' || status === 'rejected';
    const noteValue = typeof verificationNote === 'string' ? verificationNote.trim() : '';
    const noteToStore = requiresNote ? (noteValue ? noteValue : null) : null;

    if (requiresNote && !noteToStore) {
      return res.status(400).json({ message: 'Le motif est obligatoire pour ce statut' });
    }

    await connection.beginTransaction();

    const [riderRows] = await connection.query<RiderRow[]>(
      'SELECT user_id, status FROM riders WHERE id = ?',
      [id]
    );

    if (riderRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Livreur non trouvé' });
    }

    const previousStatus = riderRows[0].status;
    const riderUserId = riderRows[0].user_id;

    const [result] = await connection.query<ResultSetHeader>(
      'UPDATE riders SET status = ?, verification_note = ? WHERE id = ?',
      [status, noteToStore, id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Livreur non trouvé' });
    }

    if (previousStatus !== 'active' && status === 'active') {
      const title = 'Dossier accepté';
      const message =
        "Votre dossier a été traité et accepté. Vous pouvez commencer votre aventure maintenant, vous êtes parti de SamaThiakThiak.";

      await connection.query<ResultSetHeader>(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [riderUserId, title, message, 'success']
      );
    }

    await connection.commit();

    res.json({ message: 'Statut mis à jour', status, verificationNote: noteToStore });

  } catch (error: any) {
    try {
      await connection.rollback();
    } catch {
      // ignore
    }
    console.error('Erreur update status:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    connection.release();
  }
});

// DELETE /api/riders/:id - Supprimer un livreur (admin)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Récupérer le user_id du rider
    const [riders] = await connection.query<RiderRow[]>(
      'SELECT user_id FROM riders WHERE id = ?',
      [id]
    );

    if (riders.length === 0) {
      return res.status(404).json({ message: 'Livreur non trouvé' });
    }

    const userId = riders[0].user_id;

    // Supprimer le rider (la cascade supprimera automatiquement via FK)
    await connection.query('DELETE FROM riders WHERE id = ?', [id]);

    // Supprimer l'utilisateur associé
    await connection.query('DELETE FROM users WHERE id = ?', [userId]);

    await connection.commit();

    res.json({ message: 'Livreur supprimé' });

  } catch (error: any) {
    await connection.rollback();
    console.error('Erreur delete rider:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    connection.release();
  }
});

// GET /api/riders/:id - Récupérer un livreur par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [riders] = await pool.query<RiderRow[]>(
      `SELECT id, first_name, last_name, phone, address, gender, rider_function, 
              status, availability, subscription_expires_at, profile_photo, joined_at
       FROM riders 
       WHERE id = ? AND status = 'active'
         AND subscription_expires_at IS NOT NULL
         AND subscription_expires_at > NOW()`,
      [id]
    );

    if (riders.length === 0) {
      return res.status(404).json({ message: 'Livreur non trouvé' });
    }

    const rider = riders[0];
    res.json({
      id: rider.id.toString(),
      firstName: rider.first_name,
      lastName: rider.last_name,
      phone: rider.phone,
      address: rider.address,
      gender: rider.gender,
      riderFunction: rider.rider_function,
      status: rider.status,
      availability: rider.availability,
      subscription_expires_at: rider.subscription_expires_at,
      profile_photo: rider.profile_photo,
      joined_at: rider.joined_at
    });

  } catch (error: any) {
    console.error('Erreur get rider:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
