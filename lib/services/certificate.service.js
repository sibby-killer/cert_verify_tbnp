import crypto from 'crypto';
import { db } from '../db/index.js';
import { certificates, students, courses, institutions, verificationLogs } from '../db/schema.js';
import { eq, like, sql, and, desc, asc, or } from 'drizzle-orm';
import { generateSecurityNumber } from './security.service.js';
import { generateQR } from './qrcode.service.js';
import { sendCertificateEmail } from './email.service.js';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js';
import { log } from '../utils/logger.js';

/**
 * issueCertificate — transaction-based issuance.
 *
 * The composite unique index on (studentId, courseId) means the DB itself
 * will reject duplicates with a constraint error — no JS duplicate check needed.
 * The security number unique index handles the race condition for concurrent
 * requests: if two requests generate the same number simultaneously, only one
 * INSERT will succeed; the other gets a constraint error and can be retried.
 */
export async function issueCertificate({ studentId, courseId, graduationYear }) {
  // ── 1. Pre-flight validation outside the transaction ──────────────────────
  const [student] = await db.select().from(students).where(eq(students.id, studentId));
  if (!student) throw Object.assign(new Error('Student not found'), { status: 404 });

  const [course] = await db.select().from(courses).where(eq(courses.id, courseId));
  if (!course) throw Object.assign(new Error('Course not found'), { status: 404 });

  const [institution] = await db.select().from(institutions).limit(1);
  if (!institution) throw Object.assign(new Error('Institution not configured'), { status: 500 });

  // ── 2. Generate security number (DB-MAX based, safe against races) ─────────
  const securityNumber = await generateSecurityNumber(studentId, graduationYear, course.deptCode);
  const verifyUrl = `${process.env.CLIENT_URL || 'https://cert-verify-tbnp.vercel.app'}/verify?cert=${securityNumber}`;

  // ── 3. Generate QR code before the transaction (non-DB work) ──────────────
  const { dataUrl: qrCodeUrl } = await generateQR(verifyUrl);

  // ── 4. Insert inside a transaction — DB constraint rejects duplicates ───────
  let newCert;
  try {
    await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(certificates)
        .values({
          id: crypto.randomUUID(),
          studentId,
          courseId,
          institutionId: institution.id,
          securityNumber,
          qrCodeUrl,
          issuedDate: new Date(),
          graduationYear: parseInt(graduationYear, 10),
          status: 'valid',
        })
        .returning();
      newCert = inserted;
    });
  } catch (err) {
    // SQLite unique constraint violation code
    if (err.message?.includes('UNIQUE constraint failed')) {
      throw Object.assign(
        new Error('Student already has a certificate for this course.'),
        { status: 409 }
      );
    }
    throw err;
  }

  // ── 5. Send email asynchronously (non-blocking, non-critical) ─────────────
  if (student.email) {
    sendCertificateEmail(student.email, {
      studentName: student.name,
      securityNumber,
      courseName: course.name,
      qrCodeDataUrl: qrCodeUrl,
    }).catch((e) => log.warn('Certificate email failed (non-fatal)', { error: e.message, studentId, securityNumber }));
  }

  log.info('Certificate issued', { securityNumber, studentId, courseId, graduationYear });

  return { certificate: newCert, student, course };
}

/**
 * getAllCertificates — paginated, searchable, sortable.
 */
export async function getAllCertificates(query = {}) {
  const { page, limit, offset, search, sort, order } =
    parsePagination(query, ['createdAt', 'issuedDate', 'graduationYear', 'status'], 'createdAt');

  const conditions = [];
  if (query.status) conditions.push(eq(certificates.status, query.status));
  if (search) {
    conditions.push(
      or(
        like(students.name, `%${search}%`),
        like(certificates.securityNumber, `%${search}%`)
      )
    );
  }

  const baseQuery = db
    .select({
      certificate: certificates,
      student: students,
      course: courses,
    })
    .from(certificates)
    .innerJoin(students, eq(certificates.studentId, students.id))
    .innerJoin(courses, eq(certificates.courseId, courses.id));

  const filtered = conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

  // Count total for pagination
  const [{ total }] = await db
    .select({ total: sql`COUNT(*)` })
    .from(certificates)
    .innerJoin(students, eq(certificates.studentId, students.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Map sort field to actual column
  const sortCol = {
    createdAt: certificates.createdAt,
    issuedDate: certificates.issuedDate,
    graduationYear: certificates.graduationYear,
    status: certificates.status,
  }[sort] || certificates.createdAt;

  const data = await filtered
    .orderBy(order === 'asc' ? asc(sortCol) : desc(sortCol))
    .limit(limit)
    .offset(offset);

  return buildPaginatedResponse(data, Number(total), page, limit);
}

/**
 * getCertificateBySecurity — single cert lookup with full join.
 */
export async function getCertificateBySecurity(securityNumber) {
  const results = await db
    .select({
      certificate: certificates,
      student: students,
      course: courses,
      institution: institutions,
    })
    .from(certificates)
    .innerJoin(students, eq(certificates.studentId, students.id))
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .innerJoin(institutions, eq(certificates.institutionId, institutions.id))
    .where(eq(certificates.securityNumber, securityNumber));

  return results[0] || null;
}
