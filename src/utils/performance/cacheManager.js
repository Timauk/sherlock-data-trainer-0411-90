import NodeCache from 'node-cache';
import { logger } from '../logging/logger.js';

// Configuração dos caches com diferentes TTLs
const predictionCache = new NodeCache({ stdTTL: 300 }); // 5 minutos
const modelCache = new NodeCache({ stdTTL: 3600 }); // 1 hora
const staticDataCache = new NodeCache({ stdTTL: 604800 }); // 1 semana
const playerPredictionsCache = new NodeCache({ stdTTL: 1800 }); // 30 minutos

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
  setPrediction: (key, data) => {
    try {
      predictionCache.set(key, data);
      logger.debug(`Prediction cached: ${key}`);
    } catch (error) {
      logger.error('Error caching prediction:', error);
    }
  },

  getPrediction: (key) => {
    return predictionCache.get(key);
  },

  // Cache para modelos
  setModel: (key, model) => {
    try {
      modelCache.set(key, model);
      logger.debug(`Model cached: ${key}`);
    } catch (error) {
      logger.error('Error caching model:', error);
    }
  },

  getModel: (key) => {
    return modelCache.get(key);
  },

  // Cache para dados estáticos
  setStaticData: (key, data) => {
    try {
      staticDataCache.set(key, data);
      logger.debug(`Static data cached: ${key}`);
    } catch (error) {
      logger.error('Error caching static data:', error);
    }
  },

  getStaticData: (key) => {
    return staticDataCache.get(key);
  },

  // Cache para previsões dos jogadores
  setPlayerPrediction: (playerId, prediction) => {
    try {
      const key = `player_prediction_${playerId}`;
      playerPredictionsCache.set(key, prediction);
      logger.debug(`Player prediction cached: ${key}`);
    } catch (error) {
      logger.error('Error caching player prediction:', error);
    }
  },

  getPlayerPrediction: (playerId) => {
    const key = `player_prediction_${playerId}`;
    return playerPredictionsCache.get(key);
  },

  // Limpar caches
  clearAll: () => {
    predictionCache.flushAll();
    modelCache.flushAll();
    staticDataCache.flushAll();
    playerPredictionsCache.flushAll();
    logger.info('All caches cleared');
  }
};