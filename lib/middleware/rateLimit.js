const cache = new Map();

export const withRateLimit = (limit, windowMs, handler) => async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  
  if (!cache.has(ip)) {
    cache.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    const data = cache.get(ip);
    if (now > data.resetTime) {
      data.count = 1;
      data.resetTime = now + windowMs;
    } else {
      data.count++;
    }
    
    if (data.count > limit) {
      return res.status(429).json({ success: false, message: 'Too many requests' });
    }
  }

  return handler(req, res);
};
