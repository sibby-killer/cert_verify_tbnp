import { db } from '../../../lib/db/index.js';
import { adminUsers, refreshTokens } from '../../../lib/db/schema.js';
import { eq, and, gt } from 'drizzle-orm';
import { generateJWT, hashToken } from '../../../lib/services/security.service.js';
import { compose } from '../../../lib/middleware/compose.js';
import { withRateLimit } from '../../../lib/middleware/rateLimit.js';
import { parseCookies } from '../../../lib/middleware/auth.js';
import { env } from '../../../lib/config/env.js';
import { log } from '../../../lib/utils/logger.js';
import crypto from 'crypto';

const REFRESH_TOKEN_TTL_MS = env.parseTTLms(env.REFRESH_TOKEN_TTL);

export default compose(
  withRateLimit(30, 60_000),
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const cookies       = parseCookies(req);
    const rawToken      = cookies.refreshToken;

    if (!rawToken) {
      return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }

    // Hash the incoming cookie value → compare against stored hash
    const incomingHash = hashToken(rawToken);

    const [tokenRecord] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, incomingHash),
          gt(refreshTokens.expiresAt, new Date())
        )
      );

    if (!tokenRecord) {
      log.warn('Refresh failed: invalid or expired token hash');
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, tokenRecord.userId));

    if (!user || !user.isActive) {
      await db.delete(refreshTokens).where(eq(refreshTokens.token, incomingHash));
      log.warn('Refresh failed: user inactive or deleted', { userId: tokenRecord.userId });
      return res.status(401).json({ success: false, message: 'User account is inactive' });
    }

    // ── Rotate: delete old hash, insert new hash ────────────────────────────
    const newRawToken    = crypto.randomUUID();
    const newHashedToken = hashToken(newRawToken);
    const expiresAt      = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await db.transaction(async (tx) => {
      await tx.delete(refreshTokens).where(eq(refreshTokens.token, incomingHash));
      await tx.insert(refreshTokens).values({
        id:        crypto.randomUUID(),
        token:     newHashedToken,
        userId:    user.id,
        expiresAt,
      });
    });

    const accessToken = generateJWT(
      { id: user.id, username: user.username, role: user.role },
      env.ACCESS_TOKEN_TTL
    );

    const cookieOptions = [
      `refreshToken=${newRawToken}`, // raw new token in cookie
      'HttpOnly',
      env.isProduction ? 'Secure' : '',
      'SameSite=Strict',
      'Path=/api/v1/auth',
      `Max-Age=${Math.floor(REFRESH_TOKEN_TTL_MS / 1000)}`,
    ]
      .filter(Boolean)
      .join('; ');

    res.setHeader('Set-Cookie', cookieOptions);

    log.info('Token refreshed', { userId: user.id, username: user.username });

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: { id: user.id, username: user.username, role: user.role },
      },
    });
  }
);
