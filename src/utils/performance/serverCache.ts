// Browser-compatible cache implementation
class BrowserCache {
  private cache: Map<string, { value: any; expires: number }>;
  private maxKeys: number;

  constructor(options: { stdTTL?: number; maxKeys?: number }) {
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
      expires: ttl ? Date.now() + (ttl * 1000) : 0
    });
  }

  flushAll(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      hits: 0,
      misses: 0,
      keys: this.cache.size,
      ksize: this.cache.size,
      vsize: this.cache.size
    };
  }
}

const cache = new BrowserCache({ 
  stdTTL: 3600,
  maxKeys: 1000
});

// Monitor cache usage
setInterval(() => {
  const stats = cache.getStats();
  console.log('📊 Cache Stats:', stats);
  
  if (stats.keys > 800) {
    console.warn('⚠️ Cache reaching capacity, cleaning old entries');
    cache.flushAll();
  }
}, 300000);

export const cacheMiddleware = (req: any, res: any, next: any) => {
  const key = req.originalUrl;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    console.log('🎯 Cache Hit:', key);
    return res.send(cachedResponse);
  }

  console.log('❌ Cache Miss:', key);
  res.sendResponse = res.send;
  res.send = (body: any) => {
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

export const clearCache = () => {
  cache.flushAll();
  console.log('🧹 Cache limpo manualmente');
};