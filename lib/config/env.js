/**
 * lib/config/env.js — Centralised environment validation.
 *
 * Import this module FIRST in any entry point. It validates all required
 * environment variables at startup and crashes with a clear, actionable
 * error message listing every missing variable.
 *
 * Usage:
 *   import { env } from '../config/env.js';
 *   const secret = env.JWT_SECRET;
 */
import dotenv from 'dotenv';
dotenv.config();

const REQUIRED = [
  'JWT_SECRET',
  'TURSO_DATABASE_URL',
  'TURSO_AUTH_TOKEN',
];

const OPTIONAL_DEFAULTS = {
  ACCESS_TOKEN_TTL:  '15m',
  REFRESH_TOKEN_TTL: '7d',
  NODE_ENV:          'development',
  CLIENT_URL:        'http://localhost:3000',
};

// ── Validate required vars ─────────────────────────────────────────────────────
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length > 0) {
  throw new Error(
    `\n\n❌ STARTUP FAILURE: Missing required environment variables:\n` +
    missing.map((k) => `   • ${k}`).join('\n') +
    `\n\nCopy .env.example → .env and populate all required values.\n`
  );
}

// ── Export typed env object ────────────────────────────────────────────────────
export const env = {
  // Required
  JWT_SECRET:           process.env.JWT_SECRET,
  TURSO_DATABASE_URL:   process.env.TURSO_DATABASE_URL,
  TURSO_AUTH_TOKEN:     process.env.TURSO_AUTH_TOKEN,

  // Optional with defaults
  ACCESS_TOKEN_TTL:     process.env.ACCESS_TOKEN_TTL  || OPTIONAL_DEFAULTS.ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL:    process.env.REFRESH_TOKEN_TTL || OPTIONAL_DEFAULTS.REFRESH_TOKEN_TTL,
  NODE_ENV:             process.env.NODE_ENV          || OPTIONAL_DEFAULTS.NODE_ENV,
  CLIENT_URL:           process.env.CLIENT_URL        || OPTIONAL_DEFAULTS.CLIENT_URL,

  // Email (optional — email sending is non-critical)
  GMAIL_USER:           process.env.GMAIL_USER         || null,
  GMAIL_APP_PASSWORD:   process.env.GMAIL_APP_PASSWORD || null,

  // Computed helpers
  get isProduction() { return this.NODE_ENV === 'production'; },

  /**
   * Parse a TTL string like '7d', '15m', '24h' into milliseconds.
   */
  parseTTLms(ttl) {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) throw new Error(`Invalid TTL format: "${ttl}". Use e.g. 15m, 7d, 24h.`);
    const [, num, unit] = match;
    const n = parseInt(num, 10);
    return { s: n * 1000, m: n * 60_000, h: n * 3_600_000, d: n * 86_400_000 }[unit];
  },
};
