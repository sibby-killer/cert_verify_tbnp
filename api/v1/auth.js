import { db } from '../lib/db/index.js';
import { adminUsers, refreshTokens } from '../lib/db/schema.js';
import { eq, and, gt } from 'drizzle-orm';
import { comparePassword, generateJWT, hashToken, hashPassword } from '../lib/services/security.service.js';
import { compose } from '../lib/middleware/compose.js';
import { withRateLimit } from '../lib/middleware/rateLimit.js';
import { withValidation } from '../lib/middleware/validate.js';
import { parseCookies } from '../lib/middleware/auth.js';
import { LoginSchema, SetupSchema } from '../lib/validation/auth.schema.js';
import { env } from '../lib/config/env.js';
import { log } from '../lib/utils/logger.js';
import crypto from 'crypto';

const REFRESH_TOKEN_TTL_MS = env.parseTTLms(env.REFRESH_TOKEN_TTL);

export default compose(
  withRateLimit(30, 60_000),
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { action } = req.query;

    switch (action) {
      case 'login': {
        const parsed = LoginSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues.map(i => i.message) });
        }

        const { username, password } = parsed.data;
        const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));

        if (!user || !(await comparePassword(password, user.password))) {
          log.warn('Login failed: invalid credentials', { username });
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.isActive) {
          log.warn('Login failed: account deactivated', { username });
          return res.status(403).json({ success: false, message: 'Account is deactivated' });
        }

        const accessToken = generateJWT({ id: user.id, username: user.username, role: user.role }, env.ACCESS_TOKEN_TTL);
        const rawRefreshToken = crypto.randomUUID();
        const hashedRefreshToken = hashToken(rawRefreshToken);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

        await db.insert(refreshTokens).values({ id: crypto.randomUUID(), token: hashedRefreshToken, userId: user.id, expiresAt });

        const cookieOptions = [
          `refreshToken=${rawRefreshToken}`,
          'HttpOnly',
          env.isProduction ? 'Secure' : '',
          'SameSite=Strict',
          'Path=/api/v1/auth',
          `Max-Age=${Math.floor(REFRESH_TOKEN_TTL_MS / 1000)}`,
        ].filter(Boolean).join('; ');

        res.setHeader('Set-Cookie', cookieOptions);
        log.info('Login successful', { userId: user.id, username: user.username });
        return res.status(200).json({ success: true, data: { accessToken, user: { id: user.id, username: user.username, role: user.role } } });
      }

      case 'logout': {
        const cookies = parseCookies(req);
        const rawToken = cookies.refreshToken;
        if (rawToken) {
          const hashedToken = hashToken(rawToken);
          await db.delete(refreshTokens).where(eq(refreshTokens.token, hashedToken)).catch(() => {});
          log.info('Logout: refresh token revoked');
        }
        const clearCookie = [
          'refreshToken=',
          'HttpOnly',
          env.isProduction ? 'Secure' : '',
          'SameSite=Strict',
          'Path=/api/v1/auth',
          'Max-Age=0',
        ].filter(Boolean).join('; ');
        res.setHeader('Set-Cookie', clearCookie);
        return res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
      }

      case 'refresh': {
        const cookies = parseCookies(req);
        const rawToken = cookies.refreshToken;
        if (!rawToken) return res.status(401).json({ success: false, message: 'No refresh token provided' });

        const incomingHash = hashToken(rawToken);
        const [tokenRecord] = await db.select().from(refreshTokens).where(and(eq(refreshTokens.token, incomingHash), gt(refreshTokens.expiresAt, new Date())));
        if (!tokenRecord) {
          log.warn('Refresh failed: invalid or expired token hash');
          return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
        }

        const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, tokenRecord.userId));
        if (!user || !user.isActive) {
          await db.delete(refreshTokens).where(eq(refreshTokens.token, incomingHash));
          return res.status(401).json({ success: false, message: 'User account is inactive' });
        }

        const newRawToken = crypto.randomUUID();
        const newHashedToken = hashToken(newRawToken);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

        await db.transaction(async (tx) => {
          await tx.delete(refreshTokens).where(eq(refreshTokens.token, incomingHash));
          await tx.insert(refreshTokens).values({ id: crypto.randomUUID(), token: newHashedToken, userId: user.id, expiresAt });
        });

        const accessToken = generateJWT({ id: user.id, username: user.username, role: user.role }, env.ACCESS_TOKEN_TTL);
        const cookieOptions = [
          `refreshToken=${newRawToken}`,
          'HttpOnly',
          env.isProduction ? 'Secure' : '',
          'SameSite=Strict',
          'Path=/api/v1/auth',
          `Max-Age=${Math.floor(REFRESH_TOKEN_TTL_MS / 1000)}`,
        ].filter(Boolean).join('; ');

        res.setHeader('Set-Cookie', cookieOptions);
        log.info('Token refreshed', { userId: user.id, username: user.username });
        return res.status(200).json({ success: true, data: { accessToken, user: { id: user.id, username: user.username, role: user.role } } });
      }

      case 'setup': {
        const parsed = SetupSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues.map(i => i.message) });

        const existing = await db.select({ id: adminUsers.id }).from(adminUsers).limit(1);
        if (existing.length > 0) return res.status(403).json({ success: false, message: 'Setup already completed' });

        const { username, password, email } = parsed.data;
        const hashedPassword = await hashPassword(password);
        const [newUser] = await db.insert(adminUsers).values({ id: crypto.randomUUID(), username, password: hashedPassword, email: email || null, role: 'superadmin', isActive: true }).returning({ id: adminUsers.id, username: adminUsers.username, role: adminUsers.role });

        return res.status(201).json({ success: true, data: { message: 'Super admin created', user: newUser } });
      }

      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }
  }
);
