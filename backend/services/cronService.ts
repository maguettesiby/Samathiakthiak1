import subscriptionService from './subscriptionService';

class CronService {
  private isRunning = false;
  private renewalInterval: NodeJS.Timeout | null = null;

  // Démarrer le service de traitement automatique
  start(): void {
    if (this.isRunning) {
      console.log('[CRON] Service déjà en cours d\'exécution');
      return;
    }

    this.isRunning = true;
    console.log('[CRON] Démarrage du service de traitement automatique...');

    // Exécuter immédiatement au démarrage
    this.processRenewals();

    // Planifier l'exécution toutes les heures (3600000 ms)
    this.renewalInterval = setInterval(() => {
      this.processRenewals();
    }, 60 * 60 * 1000); // Toutes les heures

    console.log('[CRON] Service de traitement automatique démarré (exécution toutes les heures)');
  }

  // Arrêter le service
  stop(): void {
    if (this.renewalInterval) {
      clearInterval(this.renewalInterval);
      this.renewalInterval = null;
    }
    this.isRunning = false;
    console.log('[CRON] Service de traitement automatique arrêté');
  }

  // Traiter les renouvellements
  private async processRenewals(): Promise<void> {
    try {
      console.log('[CRON] Début du traitement des renouvellements automatiques...');
      await subscriptionService.processAutoRenewals();
      console.log('[CRON] Traitement des renouvellements terminé');
    } catch (error) {
      console.error('[CRON] Erreur lors du traitement des renouvellements:', error);
    }
  }

  // Obtenir le statut du service
  getStatus(): { running: boolean; nextRun?: Date } {
    return {
      running: this.isRunning,
      nextRun: this.isRunning ? new Date(Date.now() + 60 * 60 * 1000) : undefined
    };
  }
}

export default new CronService();
