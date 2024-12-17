import { logger } from '../logging/logger';

class Cache {
  private cache: Map<string, { value: any; expires: number | null }>;
  private maxKeys: number;

  constructor(options: { maxKeys?: number } = {}) {
    this.cache = new Map();
    this.maxKeys = options.maxKeys || 1000;
  }

  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expires && item.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  set(key: string, value: any, ttl?: number): void {
    if (this.cache.size >= this.maxKeys) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expires: ttl ? Date.now() + (ttl * 1000) : null
    });
  }

  flushAll(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      keys: this.cache.size,
      ksize: this.cache.size,
      vsize: this.cache.size
    };
  }
}

// Prediction Cache Configuration
const predictionCache = new Cache({ maxKeys: 1000 });
const modelCache = new Cache({ maxKeys: 100 });
const staticDataCache = new Cache({ maxKeys: 500 });
const playerPredictionsCache = new Cache({ maxKeys: 200 });

// Monitor cache usage
setInterval(() => {
  const stats = predictionCache.getStats();
  logger.info('Cache Stats:', stats);
  
  if (stats.keys > 800) {
    logger.warn('Cache reaching capacity, cleaning old entries');
    predictionCache.flushAll();
  }
}, 300000); // Every 5 minutes

export const cacheManager = {
  setPrediction: (key: string, data: any) => {
    try {
      predictionCache.set(key, data);
      logger.debug(`Prediction cached: ${key}`);
    } catch (error) {
      logger.error('Error caching prediction:', error);
    }
  },

  getPrediction: (key: string) => {
    return predictionCache.get(key);
  },

  setModel: (key: string, model: any) => {
    try {
      modelCache.set(key, model);
      logger.debug(`Model cached: ${key}`);
    } catch (error) {
      logger.error('Error caching model:', error);
    }
  },

  getModel: (key: string) => {
    return modelCache.get(key);
  },

  setStaticData: (key: string, data: any) => {
    try {
      staticDataCache.set(key, data);
      logger.debug(`Static data cached: ${key}`);
    } catch (error) {
      logger.error('Error caching static data:', error);
    }
  },

  getStaticData: (key: string) => {
    return staticDataCache.get(key);
  },

  setPlayerPrediction: (playerId: string, prediction: any) => {
    try {
      const key = `player_prediction_${playerId}`;
      playerPredictionsCache.set(key, prediction);
      logger.debug(`Player prediction cached: ${key}`);
    } catch (error) {
      logger.error('Error caching player prediction:', error);
    }
  },

  getPlayerPrediction: (playerId: string) => {
    const key = `player_prediction_${playerId}`;
    return playerPredictionsCache.get(key);
  },

  clearAll: () => {
    predictionCache.flushAll();
    modelCache.flushAll();
    staticDataCache.flushAll();
    playerPredictionsCache.flushAll();
    logger.info('All caches cleared');
  }
};

export const cacheMiddleware = (req: any, res: any, next: any) => {
  const key = req.originalUrl;
  
  if (req.method !== 'GET') {
    return next();
  }

  const cachedResponse = cacheManager.getStaticData(key);

  if (cachedResponse) {
    logger.debug('Cache hit:', key);
    return res.send(cachedResponse);
  }

  const originalSend = res.send;
  res.send = function(body: any) {
    if (res.statusCode === 200 && body) {
      try {
        cacheManager.setStaticData(key, body);
        logger.debug('Cached response:', key);
      } catch (error) {
        logger.error('Error caching response:', error);
      }
    }
    
    originalSend.call(this, body);
  };

  next();
};

export const clearCache = () => {
  cacheManager.clearAll();
  logger.info('Cache cleared manually');
};