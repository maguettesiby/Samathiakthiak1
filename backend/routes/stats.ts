import { Router, Response } from 'express';
import pool from '../database/config';
import { RowDataPacket } from 'mysql2';

const router = Router();

// GET /api/stats - Statistiques publiques pour la home (temps réel)
router.get('/', async (_req, res: Response) => {
  try {
    interface CountRow extends RowDataPacket {
      count: number;
    }

    const [activeRows] = await pool.query<CountRow[]>(
      `SELECT COUNT(*) AS count
       FROM riders
       WHERE status = 'active'
         AND subscription_expires_at IS NOT NULL
         AND subscription_expires_at > NOW()
         AND availability <> 'offline'`
    );

    const [satisfiedRows] = await pool.query<CountRow[]>(
      `SELECT COUNT(DISTINCT user_id) AS count
       FROM rider_reviews
       WHERE rating >= 4`
    );

    const [coverageRows] = await pool.query<CountRow[]>(
      `SELECT COUNT(DISTINCT LOWER(TRIM(SUBSTRING_INDEX(address, ',', 1)))) AS count
       FROM riders
       WHERE status = 'active'
         AND subscription_expires_at IS NOT NULL
         AND subscription_expires_at > NOW()
         AND address IS NOT NULL
         AND TRIM(address) <> ''`
    );

    const [clientsRows] = await pool.query<CountRow[]>(
      `SELECT COUNT(*) AS count
       FROM users
       WHERE role = 'user'`
    );

    const activeRiders = Number(activeRows?.[0]?.count ?? 0);
    const satisfiedClients = Number(satisfiedRows?.[0]?.count ?? 0);
    const coverageZones = Number(coverageRows?.[0]?.count ?? 0);
    const registeredClients = Number(clientsRows?.[0]?.count ?? 0);

    res.json({
      activeRiders,
      satisfiedClients,
      registeredClients,
      coverageZones,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[STATS] Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
