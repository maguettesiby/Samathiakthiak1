import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import subscriptionService from '../services/subscriptionService';
import pool from '../database/config';
import { RowDataPacket } from 'mysql2';

const router = Router();

// GET /api/subscription/balance - Obtenir le solde du livreur connecté
router.get('/balance', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    interface BalanceRow extends RowDataPacket {
      balance: number;
      auto_renewal: boolean;
    }
    
    const [rows] = await pool.execute<BalanceRow[]>(
      'SELECT balance, auto_renewal FROM riders WHERE user_id = ?',
      [req.user!.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Compte livreur introuvable' });
    }

    res.json({
      balance: rows[0].balance,
      autoRenewal: rows[0].auto_renewal
    });
  } catch (error: any) {
    console.error('Erreur get balance:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/subscription/auto-renewal - Activer/désactiver le renouvellement automatique
router.put('/auto-renewal', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'Le champ "enabled" doit être un booléen' });
    }

    // Obtenir l'ID du rider
    interface RiderIdRow extends RowDataPacket {
      id: number;
    }
    
    const [riderRows] = await pool.execute<RiderIdRow[]>(
      'SELECT id FROM riders WHERE user_id = ?',
      [req.user!.id]
    );

    if (riderRows.length === 0) {
      return res.status(404).json({ message: 'Compte livreur introuvable' });
    }

    await subscriptionService.setAutoRenewal(riderRows[0].id, enabled);

    res.json({ 
      message: `Renouvellement automatique ${enabled ? 'activé' : 'désactivé'} avec succès`,
      autoRenewal: enabled
    });
  } catch (error: any) {
    console.error('Erreur set auto renewal:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/subscription/renew - Renouveler manuellement l'abonnement (gratuit)
router.post('/renew', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Obtenir l'ID du rider
    interface RiderIdRow extends RowDataPacket {
      id: number;
    }
    
    const [riderRows] = await pool.execute<RiderIdRow[]>(
      'SELECT id FROM riders WHERE user_id = ?',
      [req.user!.id]
    );

    if (riderRows.length === 0) {
      return res.status(404).json({ message: 'Compte livreur introuvable' });
    }

    const riderId = riderRows[0].id;
    const RENEWAL_DAYS = 30; // 30 jours

    // Calculer la nouvelle date d'expiration
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Obtenir la date d'expiration actuelle
      interface CurrentRiderRow extends RowDataPacket {
        subscription_expires_at: string | null;
      }
      
      const [currentRider] = await connection.execute<CurrentRiderRow[]>(
        'SELECT subscription_expires_at FROM riders WHERE id = ?',
        [riderId]
      );

      const current = currentRider[0];
      const now = new Date();
      const baseDate =
        current.subscription_expires_at &&
        new Date(current.subscription_expires_at).getTime() > now.getTime()
          ? new Date(current.subscription_expires_at)
          : now;

      const newExpiry = new Date(baseDate.getTime() + RENEWAL_DAYS * 24 * 60 * 60 * 1000);

      // Mettre à jour l'abonnement
      await connection.execute(
        'UPDATE riders SET subscription_expires_at = ?, renewal_failed = FALSE WHERE id = ?',
        [newExpiry, riderId]
      );

      // Enregistrer le renouvellement réussi
      await connection.execute(
        `INSERT INTO subscription_renewals (rider_id, renewal_date, amount, status) 
         VALUES (?, CURDATE(), 0.00, 'success')`,
        [riderId]
      );

      await connection.commit();
      console.log(`[SUBSCRIPTION] Renouvellement gratuit réussi pour le livreur ${riderId}: nouvelle expiration: ${newExpiry.toISOString()}`);
      
      return res.json({ 
        message: `Abonnement renouvelé avec succès. Nouvelle expiration: ${newExpiry.toLocaleDateString('fr-FR')}`,
        success: true,
        subscriptionExpiresAt: newExpiry.toISOString()
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Erreur renew subscription:', error);
    res.status(500).json({ message: 'Erreur serveur lors du renouvellement' });
  }
});

// GET /api/subscription/transactions - Obtenir l'historique des transactions
router.get('/transactions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    // Obtenir l'ID du rider
    interface RiderIdRow extends RowDataPacket {
      id: number;
    }
    
    const [riderRows] = await pool.execute<RiderIdRow[]>(
      'SELECT id FROM riders WHERE user_id = ?',
      [req.user!.id]
    );

    if (riderRows.length === 0) {
      return res.status(404).json({ message: 'Compte livreur introuvable' });
    }

    const transactions = await subscriptionService.getTransactionHistory(riderRows[0].id, limit);

    res.json({
      transactions: transactions.map(t => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        date: t.created_at
      }))
    });
  } catch (error: any) {
    console.error('Erreur get transactions:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/subscription/renewals - Obtenir l'historique des renouvellements
router.get('/renewals', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    // Obtenir l'ID du rider
    interface RiderIdRow extends RowDataPacket {
      id: number;
    }
    
    const [riderRows] = await pool.execute<RiderIdRow[]>(
      'SELECT id FROM riders WHERE user_id = ?',
      [req.user!.id]
    );

    if (riderRows.length === 0) {
      return res.status(404).json({ message: 'Compte livreur introuvable' });
    }

    const renewals = await subscriptionService.getRenewalHistory(riderRows[0].id, limit);

    res.json({
      renewals: renewals.map(r => ({
        id: r.id,
        renewalDate: r.renewal_date,
        amount: r.amount,
        status: r.status,
        errorMessage: r.error_message,
        date: r.created_at
      }))
    });
  } catch (error: any) {
    console.error('Erreur get renewals:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
