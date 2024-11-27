import NodeCache from 'node-cache';
import { logger } from '../logging/logger';

// Configuração dos caches com diferentes TTLs
const predictionCache = new NodeCache({ stdTTL: 300 }); // 5 minutos
const modelCache = new NodeCache({ stdTTL: 86400 }); // 24 horas
const staticDataCache = new NodeCache({ stdTTL: 604800 }); // 1 semana

// Monitor de uso de memória
const monitorCacheUsage = () => {
  const usage = process.memoryUsage();
  logger.info('Cache Memory Usage:', {
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`
  });
};

// Monitorar uso de memória a cada 5 minutos
setInterval(monitorCacheUsage, 300000);

export const cacheManager = {
  // Cache para previsões
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

  // Cache para modelos
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

  // Cache para dados estáticos
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

  // Limpar caches
  clearAll: () => {
    predictionCache.flushAll();
    modelCache.flushAll();
    staticDataCache.flushAll();
    logger.info('All caches cleared');
  }
};