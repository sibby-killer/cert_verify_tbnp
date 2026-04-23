/**
 * GET /api/v1/health — production-safe health check.
 *
 * Uses a minimal SELECT 1 ping to verify DB connectivity without exposing
 * any schema information. Rate-limited and wrapped in compose() for consistent
 * security headers.
 */
import { db } from '../../lib/db/index.js';
import { sql } from 'drizzle-orm';
import { compose } from '../../lib/middleware/compose.js';
import { withRateLimit } from '../../lib/middleware/rateLimit.js';
import { env } from '../../lib/config/env.js';
import { createRequire } from 'module';

// Read version from package.json without a full import chain
const require  = createRequire(import.meta.url);
const pkg      = require('../../package.json');

export default compose(
  withRateLimit(60, 60_000), // 60 health checks per minute per IP
  async (req, res) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    res.setHeader('Cache-Control', 'no-store');

    try {
      const start = Date.now();
      await db.run(sql`SELECT 1`); // minimal ping — no table exposure
      const latencyMs = Date.now() - start;

      return res.status(200).json({
        status:    'ok',
        version:   pkg.version,
        env:       env.NODE_ENV,
        uptime:    process.uptime(),
        timestamp: new Date().toISOString(),
        db:        { status: 'connected', latencyMs },
      });
    } catch (err) {
      return res.status(503).json({
        status:    'error',
        version:   pkg.version,
        env:       env.NODE_ENV,
        uptime:    process.uptime(),
        timestamp: new Date().toISOString(),
        db:        { status: 'disconnected', error: 'DB connectivity check failed' },
      });
    }
  }
);
