/**
 * compose(...middlewares) → Vercel serverless handler
 *
 * Each middleware has the signature: async (req, res, next) => void
 * Call next() to pass control to the next middleware.
 * Sending a response (res.json / res.status) stops the chain automatically.
 *
 * Security headers applied to EVERY response:
 *   - X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
 *   - Strict-Transport-Security (HSTS) in production
 *   - Content-Security-Policy (restrictive default)
 *   - Referrer-Policy, Permissions-Policy
 *
 * Usage:
 *   export default compose(
 *     withRateLimit(20, 60_000),
 *     withAuth,
 *     withRole(['admin', 'superadmin']),
 *     async (req, res) => { ... }
 *   );
 */
import { log } from '../utils/logger.js';

export function compose(...middlewares) {
  return async (req, res) => {
    // ── Security headers ───────────────────────────────────────────────────
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // HSTS — only in production (browsers enforce HTTPS for 1 year)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // CSP — restrictive by default; allows same-origin resources and inline
    // styles for the Vite-built frontend. Adjust if using external CDNs.
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
    );

    // ── CORS ───────────────────────────────────────────────────────────────
    const origin  = req.headers.origin || '';
    const allowed = process.env.CLIENT_URL || 'http://localhost:3000';
    if (origin === allowed || process.env.NODE_ENV !== 'production') {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    }
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // ── Middleware chain ───────────────────────────────────────────────────
    const run = async (index) => {
      if (res.headersSent || index >= middlewares.length) return;
      await middlewares[index](req, res, () => run(index + 1));
    };

    try {
      await run(0);
    } catch (err) {
      log.error('Unhandled error in compose chain', {
        error: err.message,
        stack: err.stack,
        path:  req.url,
        method: req.method,
      });
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    }
  };
}
