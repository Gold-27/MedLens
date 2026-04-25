import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Cleanup interval to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (now > record.resetTime) {
      memoryStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export const rateLimiter = (windowMs: number, maxRequests: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${ip as string}_${req.path}`;
    const now = Date.now();

    let record = memoryStore.get(key);

    if (!record) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      memoryStore.set(key, record);
      return next();
    }

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      memoryStore.set(key, record);
      return next();
    }

    record.count += 1;
    memoryStore.set(key, record);

    if (record.count > maxRequests) {
      console.warn(`[RateLimit] Blocked IP: ${ip} on path: ${req.path}`);
      return res.status(429).json({
        error: 'Too many requests',
        message: 'You have exceeded the allowed frequency. Please slow down and try again later.',
      });
    }

    next();
  };
};
