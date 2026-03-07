import { Router, Response } from 'express';
import pool from '../database/config';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = Router();

// GET /api/users/clients - Liste des clients inscrits (admin seulement)
router.get('/clients', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    interface ClientRow extends RowDataPacket {
      id: number;
      name: string | null;
      email: string | null;
      phone: string | null;
      role: string;
      created_at: string;
    }

    const [rows] = await pool.query<ClientRow[]>(
      `SELECT id, name, email, phone, role, created_at
       FROM users
       WHERE role = 'user'
       ORDER BY created_at DESC
       LIMIT 1000`
    );

    res.json({
      count: rows.length,
      clients: rows.map((u) => ({
        id: u.id.toString(),
        name: u.name || undefined,
        email: u.email || undefined,
        phone: u.phone || undefined,
        createdAt: u.created_at,
      })),
    });
  } catch (error: any) {
    console.error('[USERS] Erreur list clients:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
