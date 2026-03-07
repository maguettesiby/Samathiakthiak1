// Système de batching des requêtes API pour optimiser les performances
import React from 'react';

interface BatchedRequest<T> {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  resolve: (response: T) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface BatchConfig {
  maxBatchSize: number;
  batchInterval: number; // en millisecondes
  maxWaitTime: number; // temps d'attente maximum
}

class APIBatcher {
  private pendingRequests: Map<string, BatchedRequest<any>[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: BatchConfig;

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      maxBatchSize: config.maxBatchSize || 10,
      batchInterval: config.batchInterval || 100,
      maxWaitTime: config.maxWaitTime || 1000
    };
  }

  // Ajouter une requête au batch
  addRequest<T>(url: string, method: string = 'GET', data?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const key = this.getBatchKey(url, method);
      const request: BatchedRequest<T> = {
        id: this.generateId(),
        url,
        method: method as any,
        data,
        resolve,
        reject,
        timestamp: Date.now()
      };

      if (!this.pendingRequests.has(key)) {
        this.pendingRequests.set(key, []);
      }

      const batch = this.pendingRequests.get(key)!;
      batch.push(request);

      // Démarrer ou redémarrer le timer
      this.scheduleBatch(key);
    });
  }

  // Obtenir la clé de batch
  private getBatchKey(url: string, method: string): string {
    // Grouper les requêtes similaires (même endpoint et méthode)
    const baseUrl = url.split('?')[0];
    return `${method}:${baseUrl}`;
  }

  // Générer un ID unique
  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Programmer l'exécution du batch
  private scheduleBatch(key: string): void {
    // Annuler le timer existant
    if (this.batchTimers.has(key)) {
      clearTimeout(this.batchTimers.get(key)!);
    }

    // Programmer le nouveau timer
    const timer = setTimeout(() => {
      this.executeBatch(key);
    }, this.config.batchInterval);

    this.batchTimers.set(key, timer);

    // Forcer l'exécution si on atteint la taille maximale
    const batch = this.pendingRequests.get(key);
    if (batch && batch.length >= this.config.maxBatchSize) {
      this.executeBatch(key);
    }

    // Forcer l'exécution si on dépasse le temps d'attente maximum
    setTimeout(() => {
      if (this.pendingRequests.has(key) && this.pendingRequests.get(key)!.length > 0) {
        this.executeBatch(key);
      }
    }, this.config.maxWaitTime);
  }

  // Exécuter un batch de requêtes
  private async executeBatch(key: string): Promise<void> {
    const batch = this.pendingRequests.get(key);
    if (!batch || batch.length === 0) return;

    // Nettoyer le timer et les requêtes en attente
    if (this.batchTimers.has(key)) {
      clearTimeout(this.batchTimers.get(key)!);
      this.batchTimers.delete(key);
    }
    this.pendingRequests.delete(key);

    try {
      // Construire la requête batch
      const batchRequest = this.buildBatchRequest(batch);
      
      // Exécuter la requête batch
      const response = await fetch(batchRequest.url, batchRequest.options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Distribuer les réponses
      this.distributeResponses(batch, result);
      
    } catch (error) {
      // Rejeter toutes les requêtes du batch
      batch.forEach(request => {
        request.reject(error as Error);
      });
    }
  }

  // Construire la requête batch
  private buildBatchRequest(batch: BatchedRequest<any>[]) {
    if (batch.length === 1) {
      // Requête simple
      return {
        url: batch[0].url,
        options: {
          method: batch[0].method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: batch[0].data ? JSON.stringify(batch[0].data) : undefined
        }
      };
    }

    // Requête batch (pour les GET multiples)
    const isGetBatch = batch.every(req => req.method === 'GET');
    
    if (isGetBatch) {
      // Combiner les URLs pour les GET
      const urls = batch.map(req => req.url);
      return {
        url: '/api/batch',
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: urls.map(url => ({ url, method: 'GET' })),
            batch: true
          })
        }
      };
    }

    // Pour les méthodes mixtes, utiliser un endpoint batch générique
    return {
      url: '/api/batch',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: batch.map(req => ({
            id: req.id,
            url: req.url,
            method: req.method,
            data: req.data
          })),
          batch: true
        })
      }
    };
  }

  // Distribuer les réponses aux requêtes individuelles
  private distributeResponses(batch: BatchedRequest<any>[], result: any): void {
    if (Array.isArray(result.results)) {
      // Réponses batchées
      result.results.forEach((response: any, index: number) => {
        const request = batch.find(req => req.id === response.id);
        if (request) {
          if (response.error) {
            request.reject(new Error(response.error));
          } else {
            request.resolve(response.data);
          }
        }
      });
    } else {
      // Réponse unique
      if (batch.length === 1) {
        batch[0].resolve(result);
      }
    }
  }

  // Nettoyer les anciennes requêtes
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, timer] of this.batchTimers.entries()) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();

    for (const [key, batch] of this.pendingRequests.entries()) {
      const expiredRequests = batch.filter(req => now - req.timestamp > this.config.maxWaitTime);
      expiredRequests.forEach(req => {
        req.reject(new Error('Request timeout'));
      });
      
      if (expiredRequests.length > 0) {
        const remainingRequests = batch.filter(req => now - req.timestamp <= this.config.maxWaitTime);
        if (remainingRequests.length > 0) {
          this.pendingRequests.set(key, remainingRequests);
        } else {
          this.pendingRequests.delete(key);
        }
      }
    }
  }

  // Obtenir des statistiques
  getStats() {
    const totalPending = Array.from(this.pendingRequests.values())
      .reduce((sum, batch) => sum + batch.length, 0);
    
    return {
      pendingBatches: this.pendingRequests.size,
      totalPendingRequests: totalPending,
      activeTimers: this.batchTimers.size,
      config: this.config
    };
  }
}

// Instance globale du batcher
export const apiBatcher = new APIBatcher({
  maxBatchSize: 10,
  batchInterval: 50, // 50ms pour les réponses rapides
  maxWaitTime: 500 // 500ms maximum
});

// Hook React pour utiliser le batching
export const useBatchedAPI = () => {
  const request = React.useCallback(<T>(url: string, method?: string, data?: any): Promise<T> => {
    return apiBatcher.addRequest<T>(url, method, data);
  }, []);

  const batchedGet = React.useCallback(<T>(url: string): Promise<T> => {
    return request(url, 'GET');
  }, [request]);

  const batchedPost = React.useCallback(<T>(url: string, data?: any): Promise<T> => {
    return request(url, 'POST', data);
  }, [request]);

  const batchedPut = React.useCallback(<T>(url: string, data?: any): Promise<T> => {
    return request(url, 'PUT', data);
  }, [request]);

  const batchedDelete = React.useCallback(<T>(url: string): Promise<T> => {
    return request(url, 'DELETE');
  }, [request]);

  return {
    request,
    batchedGet,
    batchedPost,
    batchedPut,
    batchedDelete,
    getStats: apiBatcher.getStats.bind(apiBatcher),
    cleanup: apiBatcher.cleanup.bind(apiBatcher)
  };
};

// Nettoyer périodiquement
setInterval(() => {
  apiBatcher.cleanup();
}, 30000); // Toutes les 30 secondes

export default APIBatcher;
