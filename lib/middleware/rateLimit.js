const cache = new Map();

/**
 * withRateLimit(limit, windowMs) — returns a middleware that limits requests per IP.
 * Uses an in-memory Map (resets on cold start, which is acceptable for serverless).
 *
 * Usage: compose(withRateLimit(20, 60_000), ...)
 */
export const withRateLimit = (limit, windowMs) => async (req, res, next) => {
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  const now = Date.now();

  if (!cache.has(ip)) {
    cache.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    const data = cache.get(ip);
    if (now > data.resetTime) {
      data.count = 1;
      data.resetTime = now + windowMs;
    } else {
      data.count += 1;
    }

    if (data.count > limit) {
      res.setHeader('Retry-After', Math.ceil((data.resetTime - now) / 1000));
      return res.status(429).json({ success: false, message: 'Too many requests — please slow down.' });
    }
  }

  return next();
};
