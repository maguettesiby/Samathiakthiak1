// Système de cache intelligent pour performances optimisées
import React from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en millisecondes
  hits: number;
}

interface CacheOptions {
  ttl?: number; // Durée de vie par défaut (5 minutes)
  maxSize?: number; // Taille maximale du cache (100 items)
  persistToStorage?: boolean; // Persister dans localStorage
  storageKey?: string; // Clé pour localStorage
}

class SmartCache<T = any> {
  private cache: Map<string, CacheItem<T>> = new Map();
  private options: Required<CacheOptions>;
  private storageKey: string;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes par défaut
      maxSize: options.maxSize || 100,
      persistToStorage: options.persistToStorage || false,
      storageKey: options.storageKey || 'app_cache'
    };
    this.storageKey = this.options.storageKey;

    // Charger depuis localStorage si persistant
    if (this.options.persistToStorage) {
      this.loadFromStorage();
    }
  }

  // Stocker une valeur dans le cache
  set(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.options.ttl;
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    };

    // Nettoyer les anciennes entrées si nécessaire
    if (this.cache.size >= this.options.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, item);

    // Persister dans localStorage
    if (this.options.persistToStorage) {
      this.saveToStorage();
    }
  }

  // Récupérer une valeur du cache
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Vérifier si l'item est expiré
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      if (this.options.persistToStorage) {
        this.saveToStorage();
      }
      return null;
    }

    // Incrémenter le compteur de hits
    item.hits++;
    
    return item.data;
  }

  // Vérifier si une clé existe et n'est pas expirée
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Supprimer une clé
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted && this.options.persistToStorage) {
      this.saveToStorage();
    }
    return deleted;
  }

  // Vider tout le cache
  clear(): void {
    this.cache.clear();
    if (this.options.persistToStorage) {
      localStorage.removeItem(this.storageKey);
    }
  }

  // Nettoyer les entrées expirées
  cleanup(): void {
    const now = Date.now();
    let deleted = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        deleted++;
      }
    }

    // Si toujours trop grand, supprimer les moins utilisés
    if (this.cache.size >= this.options.maxSize) {
      const sorted = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.hits - b.hits);
      
      const toDelete = sorted.slice(0, sorted.length - this.options.maxSize + 1);
      toDelete.forEach(([key]) => this.cache.delete(key));
      deleted += toDelete.length;
    }

    if (deleted > 0 && this.options.persistToStorage) {
      this.saveToStorage();
    }
  }

  // Obtenir des statistiques sur le cache
  getStats() {
    const now = Date.now();
    let expired = 0;
    let totalHits = 0;

    for (const [, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expired++;
      }
      totalHits += item.hits;
    }

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      expired,
      totalHits,
      hitRate: totalHits > 0 ? totalHits / this.cache.size : 0,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // Estimer l'utilisation mémoire
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    for (const [key, item] of this.cache.entries()) {
      totalSize += key.length * 2; // Estimation taille clé
      totalSize += JSON.stringify(item.data).length * 2; // Estimation taille données
    }
    return totalSize;
  }

  // Sauvegarder dans localStorage
  private saveToStorage(): void {
    try {
      const serialized = JSON.stringify(Array.from(this.cache.entries()));
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.warn('Impossible de sauvegarder le cache dans localStorage:', error);
    }
  }

  // Charger depuis localStorage
  private loadFromStorage(): void {
    try {
      const serialized = localStorage.getItem(this.storageKey);
      if (serialized) {
        const entries = JSON.parse(serialized);
        this.cache = new Map(entries);
      }
    } catch (error) {
      console.warn('Impossible de charger le cache depuis localStorage:', error);
    }
  }
}

// Caches préconfigurés pour différents usages
export const apiCache = new SmartCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 50,
  persistToStorage: true,
  storageKey: 'samathiak_api_cache'
});

export const imageCache = new SmartCache({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 100,
  persistToStorage: true,
  storageKey: 'samathiak_image_cache'
});

export const userCache = new SmartCache({
  ttl: 60 * 60 * 1000, // 1 heure
  maxSize: 20,
  persistToStorage: true,
  storageKey: 'samathiak_user_cache'
});

// Hook React pour utiliser le cache
export const useCache = <T>(key: string, fetcher: () => Promise<T>, options?: CacheOptions) => {
  const cache = new SmartCache<T>(options);
  
  const [data, setData] = React.useState<T | null>(() => cache.get(key));
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      // Vérifier d'abord le cache
      const cachedData = cache.get(key);
      if (cachedData) {
        setData(cachedData);
        return;
      }

      // Si pas dans le cache, fetcher
      try {
        setLoading(true);
        setError(null);
        const result = await fetcher();
        cache.set(key, result);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [key]);

  const refetch = React.useCallback(() => {
    cache.delete(key);
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetcher();
        cache.set(key, result);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [key, fetcher]);

  return { data, loading, error, refetch };
};

export default SmartCache;
