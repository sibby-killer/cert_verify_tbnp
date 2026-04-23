import { db } from '../../../lib/db/index.js';
import { refreshTokens } from '../../../lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { compose } from '../../../lib/middleware/compose.js';
import { withRateLimit } from '../../../lib/middleware/rateLimit.js';
import { parseCookies } from '../../../lib/middleware/auth.js';
import { hashToken } from '../../../lib/services/security.service.js';
import { env } from '../../../lib/config/env.js';
import { log } from '../../../lib/utils/logger.js';

export default compose(
  withRateLimit(20, 60_000),
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const cookies  = parseCookies(req);
    const rawToken = cookies.refreshToken;

    if (rawToken) {
      // Hash the cookie value → delete matching hash from DB
      const hashedToken = hashToken(rawToken);
      await db.delete(refreshTokens).where(eq(refreshTokens.token, hashedToken)).catch(() => {});
      log.info('Logout: refresh token revoked');
    }

    // Clear the httpOnly cookie
    const clearCookie = [
      'refreshToken=',
      'HttpOnly',
      env.isProduction ? 'Secure' : '',
      'SameSite=Strict',
      'Path=/api/v1/auth',
      'Max-Age=0',
    ]
      .filter(Boolean)
      .join('; ');

    res.setHeader('Set-Cookie', clearCookie);
    return res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
  }
);
