import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { certificates } from '../db/schema.js';
import { eq, like } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export async function generateSecurityNumber(studentId, year, courseCode) {
  const yearStr = year.toString().slice(-2);
  const dept = courseCode.toUpperCase();
  const prefix = `BNP-${yearStr}-${dept}-`;

  // Find max sequence for this year/dept
  const existing = await db.select({ securityNumber: certificates.securityNumber })
    .from(certificates)
    .where(like(certificates.securityNumber, `${prefix}%`));
  
  let maxSeq = 0;
  existing.forEach(cert => {
    const parts = cert.securityNumber.split('-');
    if (parts.length >= 4) {
      const seq = parseInt(parts[3]);
      if (!isNaN(seq)) maxSeq = Math.max(maxSeq, seq);
    }
  });

  const nextSeq = (maxSeq + 1).toString().padStart(5, '0');
  const salt = crypto.randomBytes(2).toString('hex').toUpperCase();
  
  return `${prefix}${nextSeq}-${salt}`;
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(plain, hashed) {
  return await bcrypt.compare(plain, hashed);
}

export function generateJWT(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}