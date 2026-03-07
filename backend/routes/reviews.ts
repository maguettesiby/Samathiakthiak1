import { Router, Response } from 'express';
import pool from '../database/config';
import { authenticate, AuthRequest } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// POST /api/reviews/:riderId - Créer ou mettre à jour mon avis (1 avis max par user et par rider)
router.post('/:riderId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const riderId = Number(req.params.riderId);
    if (!Number.isFinite(riderId) || riderId <= 0) {
      return res.status(400).json({ message: 'riderId invalide' });
    }

    const rating = Number(req.body?.rating);
    const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'rating invalide (1 à 5)' });
    }

    if (comment.length > 255) {
      return res.status(400).json({ message: 'commentaire trop long (max 255 caractères)' });
    }

    // Vérifier que le rider existe
    interface RiderExistsRow extends RowDataPacket { id: number }
    const [riderRows] = await pool.query<RiderExistsRow[]>('SELECT id FROM riders WHERE id = ?', [riderId]);
    if (riderRows.length === 0) {
      return res.status(404).json({ message: 'Livreur non trouvé' });
    }

    // Upsert via UNIQUE(user_id, rider_id)
    await pool.query<ResultSetHeader>(
      `INSERT INTO rider_reviews (user_id, rider_id, rating, comment)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), created_at = CURRENT_TIMESTAMP`,
      [req.user!.id, riderId, rating, comment ? comment : null]
    );

    res.status(201).json({ message: 'Avis enregistré' });
  } catch (error: any) {
    console.error('[REVIEWS] Erreur upsert:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/reviews/me - Lister mes avis
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    interface MyReviewRow extends RowDataPacket {
      id: number;
      rider_id: number;
      rating: number;
      comment: string | null;
      created_at: string;
      first_name: string;
      last_name: string;
      rider_function: string;
      address: string;
      phone: string;
      profile_photo: string | null;
    }

    const [rows] = await pool.query<MyReviewRow[]>(
      `SELECT rr.id, rr.rider_id, rr.rating, rr.comment, rr.created_at,
              r.first_name, r.last_name, r.rider_function, r.address, r.phone, r.profile_photo
       FROM rider_reviews rr
       JOIN riders r ON r.id = rr.rider_id
       WHERE rr.user_id = ?
       ORDER BY rr.created_at DESC`,
      [req.user!.id]
    );

    res.json({
      reviews: rows.map(r => ({
        id: r.id.toString(),
        riderId: r.rider_id.toString(),
        rating: r.rating,
        comment: r.comment || undefined,
        createdAt: r.created_at,
        rider: {
          id: r.rider_id.toString(),
          firstName: r.first_name,
          lastName: r.last_name,
          riderFunction: r.rider_function,
          address: r.address,
          phone: r.phone,
          profile_photo: r.profile_photo
        }
      }))
    });
  } catch (error: any) {
    console.error('[REVIEWS] Erreur my reviews:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/reviews/public - Témoignages publics (avis récents)
router.get('/public', async (req, res: Response) => {
  try {
    const limitRaw = Number((req.query as any)?.limit);
    const limit = Number.isFinite(limitRaw) ? Math.min(50, Math.max(1, Math.floor(limitRaw))) : 12;

    interface PublicReviewRow extends RowDataPacket {
      id: number;
      rating: number;
      comment: string | null;
      created_at: string;
      user_name: string | null;
      rider_id: number;
      first_name: string;
      last_name: string;
      rider_function: string;
    }

    const [rows] = await pool.query<PublicReviewRow[]>(
      `SELECT rr.id, rr.rating, rr.comment, rr.created_at,
              u.name AS user_name,
              r.id AS rider_id, r.first_name, r.last_name, r.rider_function
       FROM rider_reviews rr
       JOIN users u ON u.id = rr.user_id
       JOIN riders r ON r.id = rr.rider_id
       WHERE rr.rating >= 4
       ORDER BY rr.created_at DESC
       LIMIT ?`,
      [limit]
    );

    res.json({
      reviews: rows.map((r) => ({
        id: r.id.toString(),
        rating: r.rating,
        comment: r.comment || undefined,
        createdAt: r.created_at,
        reviewerName: r.user_name || undefined,
        rider: {
          id: r.rider_id.toString(),
          firstName: r.first_name,
          lastName: r.last_name,
          riderFunction: r.rider_function,
        },
      })),
    });
  } catch (error: any) {
    console.error('[REVIEWS] Erreur public:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/reviews/rider/:riderId - Stats + derniers avis publics
router.get('/rider/:riderId', async (req, res: Response) => {
  try {
    const riderId = Number(req.params.riderId);
    if (!Number.isFinite(riderId) || riderId <= 0) {
      return res.status(400).json({ message: 'riderId invalide' });
    }

    interface StatsRow extends RowDataPacket {
      avg_rating: number | null;
      review_count: number;
    }

    const [statsRows] = await pool.query<StatsRow[]>(
      `SELECT AVG(rating) AS avg_rating, COUNT(*) AS review_count
       FROM rider_reviews
       WHERE rider_id = ?`,
      [riderId]
    );

    interface ReviewRow extends RowDataPacket {
      id: number;
      rating: number;
      comment: string | null;
      created_at: string;
      user_name: string | null;
    }

    const [rows] = await pool.query<ReviewRow[]>(
      `SELECT rr.id, rr.rating, rr.comment, rr.created_at, u.name AS user_name
       FROM rider_reviews rr
       JOIN users u ON u.id = rr.user_id
       WHERE rr.rider_id = ?
       ORDER BY rr.created_at DESC
       LIMIT 50`,
      [riderId]
    );

    const avg = statsRows[0]?.avg_rating ?? null;
    const count = statsRows[0]?.review_count ?? 0;

    res.json({
      riderId: riderId.toString(),
      avgRating: avg === null ? 0 : Math.round(Number(avg) * 10) / 10,
      reviewCount: count,
      reviews: rows.map(r => ({
        id: r.id.toString(),
        rating: r.rating,
        comment: r.comment || undefined,
        createdAt: r.created_at,
        reviewerName: r.user_name || undefined
      }))
    });
  } catch (error: any) {
    console.error('[REVIEWS] Erreur rider reviews:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
