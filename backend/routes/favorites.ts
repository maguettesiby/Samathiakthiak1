import { Router, Response } from 'express';
import pool from '../database/config';
import { authenticate, AuthRequest } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// GET /api/favorites - Lister mes favoris
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    interface FavoriteRow extends RowDataPacket {
      rider_id: number;
      created_at: string;
    }

    const [rows] = await pool.query<FavoriteRow[]>(
      `SELECT rider_id, created_at
       FROM rider_favorites
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user!.id]
    );

    res.json({ favorites: rows.map(r => r.rider_id.toString()) });
  } catch (error: any) {
    console.error('[FAVORITES] Erreur list:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/favorites/:riderId - Ajouter un favori
router.post('/:riderId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const riderId = Number(req.params.riderId);
    if (!Number.isFinite(riderId) || riderId <= 0) {
      return res.status(400).json({ message: 'riderId invalide' });
    }

    // Vérifier que le rider existe
    interface RiderExistsRow extends RowDataPacket { id: number }
    const [riderRows] = await pool.query<RiderExistsRow[]>('SELECT id FROM riders WHERE id = ?', [riderId]);
    if (riderRows.length === 0) {
      return res.status(404).json({ message: 'Livreur non trouvé' });
    }

    await pool.query<ResultSetHeader>(
      'INSERT IGNORE INTO rider_favorites (user_id, rider_id) VALUES (?, ?)',
      [req.user!.id, riderId]
    );

    res.status(201).json({ message: 'Ajouté aux favoris' });
  } catch (error: any) {
    console.error('[FAVORITES] Erreur add:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /api/favorites/:riderId - Retirer un favori
router.delete('/:riderId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const riderId = Number(req.params.riderId);
    if (!Number.isFinite(riderId) || riderId <= 0) {
      return res.status(400).json({ message: 'riderId invalide' });
    }

    await pool.query<ResultSetHeader>(
      'DELETE FROM rider_favorites WHERE user_id = ? AND rider_id = ?',
      [req.user!.id, riderId]
    );

    res.json({ message: 'Retiré des favoris' });
  } catch (error: any) {
    console.error('[FAVORITES] Erreur remove:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
