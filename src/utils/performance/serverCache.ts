import NodeCache from 'node-cache';
import { systemLogger } from '../logging/systemLogger';

const cache = new NodeCache({ 
  stdTTL: 3600, // 1 hora
  checkperiod: 120, // Checa a cada 2 minutos
  maxKeys: 1000, // Limite máximo de chaves
  useClones: false // Desativa clonagem para economizar memória
});

// Monitor de uso do cache
setInterval(() => {
  const stats = cache.getStats();
  systemLogger.log('system', 'Cache stats', stats);
  
  if (stats.keys > 800) { // 80% do limite
    systemLogger.log('system', 'Cache reaching capacity, cleaning old entries');
    cache.prune();
  }
}, 300000); // A cada 5 minutos

export const cacheMiddleware = (req: any, res: any, next: any) => {
  const key = req.originalUrl;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    return res.send(cachedResponse);
  }

  res.sendResponse = res.send;
  res.send = (body: any) => {
    // Não armazena respostas muito grandes
    if (JSON.stringify(body).length < 50000) {
      cache.set(key, body);
    }
    res.sendResponse(body);
  };
  next();
};

// Função para limpar cache manualmente
export const clearCache = () => {
  cache.flushAll();
  if (global.gc) {
    global.gc();
  }
};