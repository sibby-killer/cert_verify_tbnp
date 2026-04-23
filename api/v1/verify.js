import { db } from '../../lib/db/index.js';
import { certificates, students, courses, institutions, verificationLogs } from '../../lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { compose } from '../../lib/middleware/compose.js';
import { withRateLimit } from '../../lib/middleware/rateLimit.js';
import crypto from 'crypto';

export default compose(
  withRateLimit(30, 60_000),
  async (req, res) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { cert } = req.query;
    if (!cert || typeof cert !== 'string' || cert.length > 100) {
      return res.status(400).json({ success: false, message: 'Certificate number is required' });
    }

    const safeQuery = cert.trim().replace(/[^\w\-]/g, '');
    const ipAddress =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      'unknown';

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
      .where(eq(certificates.securityNumber, safeQuery));

    const certRecord = results[0] || null;
    const verificationResult = certRecord
      ? (certRecord.certificate.status === 'valid' ? 'valid' : 'revoked')
      : 'invalid';

    // Log attempt (non-fatal)
    db.insert(verificationLogs)
      .values({
        id: crypto.randomUUID(),
        certId: certRecord?.certificate.id || null,
        verifiedAt: new Date(),
        verifierIp: ipAddress,
        result: verificationResult,
        method: 'security_number',
      })
      .catch((e) => console.warn('[verify] Log failed:', e.message));

    if (!certRecord) {
      return res.status(404).json({ success: false, message: 'Certificate not found or invalid security number.' });
    }

    return res.status(200).json({ success: true, data: certRecord });
  }
);
