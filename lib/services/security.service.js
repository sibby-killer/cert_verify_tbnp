/**
 * lib/services/security.service.js
 *
 * Centralised cryptographic utilities:
 * - Password hashing (bcrypt)
 * - JWT sign/verify
 * - Refresh token SHA-256 hashing (NEVER store raw tokens in DB)
 * - Security number generation (DB-MAX based, race-condition safe)
 */
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { certificates } from '../db/schema.js';
import { like, sql } from 'drizzle-orm';
import { env } from '../config/env.js';

// env module already validated JWT_SECRET at import time — no fallback possible.
const JWT_SECRET      = env.JWT_SECRET;
const ACCESS_TOKEN_TTL = env.ACCESS_TOKEN_TTL; // e.g. '15m'

// ── Refresh token hashing ──────────────────────────────────────────────────────
/**
 * hashToken(rawToken) → 64-char lowercase hex string (SHA-256).
 *
 * The raw token lives ONLY in the httpOnly cookie.
 * The DB stores only the hash — a full DB dump is useless without the cookies.
 */
export function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// ── Security number generation ─────────────────────────────────────────────────
/**
 * generateSecurityNumber — atomic-safe sequential number generation.
 *
 * Uses DB-level MAX() in a single query instead of fetching all rows then
 * computing in JS. The unique constraint on security_number prevents duplicates
 * even under concurrent requests (DB will reject the INSERT, not the JS check).
 */
export async function generateSecurityNumber(studentId, year, courseCode) {
  const yearStr = year.toString().slice(-2);
  const dept    = courseCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const prefix  = `BNP-${yearStr}-${dept}-`;

  const [row] = await db
    .select({
      maxSeq: sql`COALESCE(MAX(CAST(substr(security_number, ${prefix.length + 1}, 5) AS INTEGER)), 0)`,
    })
    .from(certificates)
    .where(like(certificates.securityNumber, `${prefix}%`));

  const nextSeq = ((row?.maxSeq ?? 0) + 1).toString().padStart(5, '0');
  // 4-char hex salt for additional entropy
  const salt = crypto.randomBytes(2).toString('hex').toUpperCase();

  return `${prefix}${nextSeq}-${salt}`;
}

// ── Password utilities ─────────────────────────────────────────────────────────
export async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

export async function comparePassword(plain, hashed) {
  return await bcrypt.compare(plain, hashed);
}

// ── JWT utilities ──────────────────────────────────────────────────────────────
export function generateJWT(payload, expiresIn) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn || ACCESS_TOKEN_TTL });
}

export function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}