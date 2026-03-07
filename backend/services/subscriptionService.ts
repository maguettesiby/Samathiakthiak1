import pool from '../database/config';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Interface pour les transactions
interface RiderTransactionRow extends RowDataPacket {
  id: number;
  rider_id: number;
  amount: number;
  type: 'credit' | 'debit' | 'renewal' | 'refund';
  description: string;
  created_at: string;
}

// Interface pour les renouvellements
interface SubscriptionRenewalRow extends RowDataPacket {
  id: number;
  rider_id: number;
  renewal_date: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'insufficient_balance';
  error_message: string | null;
  created_at: string;
}

// Interface pour les riders avec solde
interface RiderWithBalanceRow extends RowDataPacket {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  balance: number;
  auto_renewal: boolean;
  subscription_expires_at: string | null;
  last_renewal_attempt: string | null;
  renewal_failed: boolean;
}

class SubscriptionService {
  // Créditer le compte d'un livreur
  async creditRiderAccount(riderId: number, amount: number, description: string): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Mettre à jour le solde
      await connection.execute(
        'UPDATE riders SET balance = balance + ? WHERE id = ?',
        [amount, riderId]
      );

      // Enregistrer la transaction
      await connection.execute(
        `INSERT INTO rider_transactions (rider_id, amount, type, description) 
         VALUES (?, ?, 'credit', ?)`,
        [riderId, amount, description]
      );

      await connection.commit();
      console.log(`[SUBSCRIPTION] Crédit de ${amount}F pour le livreur ${riderId}: ${description}`);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Débiter le compte d'un livreur
  async debitRiderAccount(riderId: number, amount: number, description: string): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Vérifier le solde disponible
      interface BalanceCheckRow extends RowDataPacket {
        balance: number;
      }
      
      const [balanceCheck] = await connection.execute<BalanceCheckRow[]>(
        'SELECT balance FROM riders WHERE id = ? FOR UPDATE',
        [riderId]
      );

      if (balanceCheck.length === 0 || balanceCheck[0].balance < amount) {
        await connection.rollback();
        console.log(`[SUBSCRIPTION] Solde insuffisant pour le livreur ${riderId}: ${balanceCheck[0]?.balance || 0}F < ${amount}F`);
        return false;
      }

      // Mettre à jour le solde
      await connection.execute(
        'UPDATE riders SET balance = balance - ? WHERE id = ?',
        [amount, riderId]
      );

      // Enregistrer la transaction
      await connection.execute(
        `INSERT INTO rider_transactions (rider_id, amount, type, description) 
         VALUES (?, ?, 'debit', ?)`,
        [riderId, amount, description]
      );

      await connection.commit();
      console.log(`[SUBSCRIPTION] Débit de ${amount}F pour le livreur ${riderId}: ${description}`);
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Obtenir le solde d'un livreur
  async getRiderBalance(riderId: number): Promise<number> {
    interface BalanceRow extends RowDataPacket {
      balance: number;
    }
    
    const [rows] = await pool.execute<BalanceRow[]>(
      'SELECT balance FROM riders WHERE id = ?',
      [riderId]
    );
    return rows.length > 0 ? rows[0].balance : 0;
  }

  // Activer/désactiver le renouvellement automatique
  async setAutoRenewal(riderId: number, enabled: boolean): Promise<void> {
    await pool.execute(
      'UPDATE riders SET auto_renewal = ?, renewal_failed = FALSE WHERE id = ?',
      [enabled, riderId]
    );
    console.log(`[SUBSCRIPTION] Renouvellement automatique ${enabled ? 'activé' : 'désactivé'} pour le livreur ${riderId}`);
  }

  // Renouveler l'abonnement avec débit du solde
  async renewSubscriptionWithBalance(riderId: number): Promise<{ success: boolean; message: string }> {
    const RENEWAL_AMOUNT = 500; // 500 FCFA
    const RENEWAL_DAYS = 30; // 30 jours

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Obtenir les informations du livreur
      const [riders] = await connection.execute<RiderWithBalanceRow[]>(
        `SELECT id, balance, subscription_expires_at, auto_renewal 
         FROM riders WHERE id = ? FOR UPDATE`,
        [riderId]
      );

      if (riders.length === 0) {
        await connection.rollback();
        return { success: false, message: 'Livreur introuvable' };
      }

      const rider = riders[0];

      // Vérifier si le solde est suffisant
      if (rider.balance < RENEWAL_AMOUNT) {
        // Marquer comme échec de renouvellement
        await connection.execute(
          `UPDATE riders SET renewal_failed = TRUE, last_renewal_attempt = CURDATE() 
           WHERE id = ?`,
          [riderId]
        );

        // Enregistrer la tentative échouée
        await connection.execute(
          `INSERT INTO subscription_renewals (rider_id, renewal_date, amount, status, error_message) 
           VALUES (?, CURDATE(), ?, 'insufficient_balance', 'Solde insuffisant')`,
          [riderId, RENEWAL_AMOUNT]
        );

        await connection.rollback();
        return { success: false, message: `Solde insuffisant. Montant requis: ${RENEWAL_AMOUNT}F, Solde disponible: ${rider.balance}F` };
      }

      // Débiter le compte
      await connection.execute(
        'UPDATE riders SET balance = balance - ? WHERE id = ?',
        [RENEWAL_AMOUNT, riderId]
      );

      // Enregistrer la transaction de renouvellement
      await connection.execute(
        `INSERT INTO rider_transactions (rider_id, amount, type, description) 
         VALUES (?, ?, 'renewal', 'Renouvellement abonnement mensuel')`,
        [riderId, RENEWAL_AMOUNT]
      );

      // Calculer la nouvelle date d'expiration
      const now = new Date();
      const baseDate = rider.subscription_expires_at && new Date(rider.subscription_expires_at).getTime() > now.getTime()
        ? new Date(rider.subscription_expires_at)
        : now;
      const newExpiry = new Date(baseDate.getTime() + RENEWAL_DAYS * 24 * 60 * 60 * 1000);

      // Mettre à jour l'abonnement
      await connection.execute(
        `UPDATE riders SET 
         subscription_expires_at = ?, 
         renewal_failed = FALSE, 
         last_renewal_attempt = CURDATE() 
         WHERE id = ?`,
        [newExpiry, riderId]
      );

      // Enregistrer le renouvellement réussi
      await connection.execute(
        `INSERT INTO subscription_renewals (rider_id, renewal_date, amount, status) 
         VALUES (?, CURDATE(), ?, 'success')`,
        [riderId, RENEWAL_AMOUNT]
      );

      await connection.commit();
      console.log(`[SUBSCRIPTION] Renouvellement réussi pour le livreur ${riderId}: ${RENEWAL_AMOUNT}F débités, nouvelle expiration: ${newExpiry.toISOString()}`);
      
      return { 
        success: true, 
        message: `Abonnement renouvelé avec succès. ${RENEWAL_AMOUNT}F débités de votre compte. Nouvelle expiration: ${newExpiry.toLocaleDateString('fr-FR')}` 
      };
    } catch (error) {
      await connection.rollback();
      console.error('[SUBSCRIPTION] Erreur lors du renouvellement:', error);
      
      // Enregistrer l'erreur
      try {
        await connection.execute(
          `INSERT INTO subscription_renewals (rider_id, renewal_date, amount, status, error_message) 
           VALUES (?, CURDATE(), ?, 'failed', ?)`,
          [riderId, RENEWAL_AMOUNT, error instanceof Error ? error.message : 'Erreur inconnue']
        );
      } catch (logError) {
        console.error('[SUBSCRIPTION] Erreur lors de l\'enregistrement de l\'erreur:', logError);
      }
      
      return { success: false, message: 'Erreur lors du renouvellement de l\'abonnement' };
    } finally {
      connection.release();
    }
  }

  // Traitement automatique des renouvellements (à exécuter quotidiennement)
  async processAutoRenewals(): Promise<void> {
    console.log('[SUBSCRIPTION] Début du traitement automatique des renouvellements...');
    
    const connection = await pool.getConnection();
    try {
      // Trouver les riders éligibles au renouvellement automatique
      // (3 jours avant la fin du mois OU abonnement expiré depuis moins de 7 jours)
      const [riders] = await connection.execute<RiderWithBalanceRow[]>(
        `SELECT id, balance, subscription_expires_at, auto_renewal, last_renewal_attempt
         FROM riders 
         WHERE auto_renewal = TRUE 
         AND status = 'active'
         AND (
           -- Abonnement expirant dans les 3 prochains jours
           (subscription_expires_at IS NOT NULL 
            AND DATE(subscription_expires_at) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY))
           OR
           -- Abonnement expiré depuis moins de 7 jours (pour les retards de traitement)
           (subscription_expires_at IS NOT NULL 
            AND subscription_expires_at < NOW() 
            AND DATEDIFF(CURDATE(), subscription_expires_at) <= 7
            AND (last_renewal_attempt IS NULL OR last_renewal_attempt < CURDATE()))
         )`
      );

      console.log(`[SUBSCRIPTION] ${riders.length} livreurs éligibles au renouvellement automatique`);

      for (const rider of riders) {
        try {
          const result = await this.renewSubscriptionWithBalance(rider.id);
          console.log(`[SUBSCRIPTION] Renouvellement livreur ${rider.id}: ${result.success ? 'SUCCÈS' : 'ÉCHEC'} - ${result.message}`);
        } catch (error) {
          console.error(`[SUBSCRIPTION] Erreur lors du renouvellement du livreur ${rider.id}:`, error);
        }
      }

      console.log('[SUBSCRIPTION] Traitement automatique des renouvellements terminé');
    } catch (error) {
      console.error('[SUBSCRIPTION] Erreur lors du traitement automatique:', error);
    } finally {
      connection.release();
    }
  }

  // Obtenir l'historique des transactions
  async getTransactionHistory(riderId: number, limit: number = 50): Promise<RiderTransactionRow[]> {
    const [rows] = await pool.execute<RiderTransactionRow[]>(
      `SELECT id, amount, type, description, created_at 
       FROM rider_transactions 
       WHERE rider_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [riderId, limit]
    );
    return rows;
  }

  // Obtenir l'historique des renouvellements
  async getRenewalHistory(riderId: number, limit: number = 20): Promise<SubscriptionRenewalRow[]> {
    const [rows] = await pool.execute<SubscriptionRenewalRow[]>(
      `SELECT id, renewal_date, amount, status, error_message, created_at 
       FROM subscription_renewals 
       WHERE rider_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [riderId, limit]
    );
    return rows;
  }
}

export default new SubscriptionService();
