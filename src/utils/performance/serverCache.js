import NodeCache from 'node-cache';
import { systemLogger } from '../logging/systemLogger.js';

const cache = new NodeCache({ 
  stdTTL: 3600, // 1 hora
  checkperiod: 120, // Checa a cada 2 minutos
  maxKeys: 1000, // Limite máximo de chaves
  useClones: false // Desativa clonagem para economizar memória
});

// Monitor de uso do cache
setInterval(() => {
  const stats = cache.getStats();
  const cacheInfo = {
    hits: stats.hits,
    misses: stats.misses,
    keys: stats.keys,
    ksize: stats.ksize,
    vsize: stats.vsize
  };
  
  systemLogger.log('system', 'Cache stats', cacheInfo);
  console.log('📊 Cache Stats:', cacheInfo);
  
  if (stats.keys > 800) { // 80% do limite
    systemLogger.log('system', 'Cache reaching capacity, cleaning old entries');
    console.warn('⚠️ Cache atingindo capacidade máxima, limpando entradas antigas');
    cache.flushAll();
  }
}, 300000); // A cada 5 minutos

export const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    console.log('🎯 Cache Hit:', key);
    return res.send(cachedResponse);
  }

  console.log('❌ Cache Miss:', key);
  res.sendResponse = res.send;
  res.send = (body) => {
    // Não armazena respostas muito grandes
    if (JSON.stringify(body).length < 50000) {
      cache.set(key, body);
      console.log('💾 Cache Stored:', key);
    } else {
      console.log('⚠️ Response too large to cache:', key);
    }
    res.sendResponse(body);
  };
  next();
};

// Função para limpar cache manualmente
export const clearCache = () => {
  cache.flushAll();
  console.log('🧹 Cache limpo manualmente');
  if (global.gc) {
    global.gc();
    console.log('🗑️ Garbage collection executada');
  }
};