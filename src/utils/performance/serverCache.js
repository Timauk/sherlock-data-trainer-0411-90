import { cacheManager } from './cacheManager.js';
import { logger } from '../logging/logger.js';

export const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl;
  
  // Skip cache for certain routes
  if (req.method !== 'GET' || req.path.includes('/api/status')) {
    return next();
  }

  // Try to get from cache
  const cachedResponse = cacheManager.getStaticData(key);

  if (cachedResponse) {
    logger.debug('Cache hit:', key);
    return res.send(cachedResponse);
  }

  // If not in cache, store the response
  const originalSend = res.send;
  res.send = function(body) {
    // Only cache successful responses
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

// Função para limpar o cache
export const clearCache = () => {
  cacheManager.clearAll();
  logger.info('Cache cleared manually');
};