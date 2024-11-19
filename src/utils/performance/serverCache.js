import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
});

export const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl || req.url;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    return res.send(cachedResponse);
  }

  const originalSend = res.send;
  res.send = function(body) {
    cache.set(key, body);
    originalSend.call(this, body);
  };

  next();
};