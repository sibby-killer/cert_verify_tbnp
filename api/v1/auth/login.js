import { db } from '../../../lib/db/index.js';
import { adminUsers, refreshTokens } from '../../../lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { comparePassword, generateJWT, hashToken } from '../../../lib/services/security.service.js';
import { compose } from '../../../lib/middleware/compose.js';
import { withRateLimit } from '../../../lib/middleware/rateLimit.js';
import { withValidation } from '../../../lib/middleware/validate.js';
import { LoginSchema } from '../../../lib/validation/auth.schema.js';
import { env } from '../../../lib/config/env.js';
import { log } from '../../../lib/utils/logger.js';
import crypto from 'crypto';

const REFRESH_TOKEN_TTL_MS = env.parseTTLms(env.REFRESH_TOKEN_TTL); // e.g. 7d → ms

export default compose(
  withRateLimit(10, 60_000), // 10 login attempts per minute per IP
  withValidation(LoginSchema),
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { username, password } = req.body;

    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));

    if (!user) {
      log.warn('Login failed: user not found', { username });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      log.warn('Login failed: wrong password', { username });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      log.warn('Login failed: account deactivated', { username });
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // ── Access token (short-lived, memory-only on client) ────────────────────
    const accessToken = generateJWT(
      { id: user.id, username: user.username, role: user.role },
      env.ACCESS_TOKEN_TTL
    );

    // ── Refresh token: raw UUID in cookie, SHA-256 hash in DB ────────────────
    const rawRefreshToken    = crypto.randomUUID();
    const hashedRefreshToken = hashToken(rawRefreshToken);
    const expiresAt          = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await db.insert(refreshTokens).values({
      id:        crypto.randomUUID(),
      token:     hashedRefreshToken, // ONLY the hash is persisted
      userId:    user.id,
      expiresAt,
    });

    const cookieOptions = [
      `refreshToken=${rawRefreshToken}`, // raw token in cookie
      'HttpOnly',
      env.isProduction ? 'Secure' : '',
      'SameSite=Strict',
      'Path=/api/v1/auth',
      `Max-Age=${Math.floor(REFRESH_TOKEN_TTL_MS / 1000)}`,
    ]
      .filter(Boolean)
      .join('; ');

    res.setHeader('Set-Cookie', cookieOptions);

    log.info('Login successful', { userId: user.id, username: user.username, role: user.role });

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: { id: user.id, username: user.username, role: user.role },
      },
    });
  }
);
