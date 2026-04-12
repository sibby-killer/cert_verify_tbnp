import { db } from '../lib/db/index.js';
import { certificates, students, courses, institutions, verificationLogs } from '../lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { success, error } from '../lib/utils/responseHelper.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const { cert } = req.query;
    if (!cert) return res.status(400).json({ success: false, message: 'Certificate number is required' });

    const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const method = req.query.method || 'security_number';

    // Look up the certificate with all joined details
    const results = await db.select({
      certificate: certificates,
      student: students,
      course: courses,
      institution: institutions,
    })
      .from(certificates)
      .innerJoin(students, eq(certificates.studentId, students.id))
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .innerJoin(institutions, eq(certificates.institutionId, institutions.id))
      .where(eq(certificates.securityNumber, cert));

    const certRecord = results[0];
    const verificationResult = certRecord
      ? (certRecord.certificate.status === 'valid' ? 'valid' : 'revoked')
      : 'invalid';

    // Log the verification attempt
    try {
      await db.insert(verificationLogs).values({
        id: crypto.randomUUID(),
        certId: certRecord ? certRecord.certificate.id : null,
        verifiedAt: new Date(),
        verifierIp: ipAddress,
        result: verificationResult,
        method,
      });
    } catch (logErr) {
      console.warn('Log insertion failed (non-fatal):', logErr.message);
    }

    if (!certRecord) {
      return res.status(404).json({ success: false, message: 'Certificate not found or invalid security number.' });
    }

    return res.status(200).json({ success: true, data: certRecord });
  } catch (err) {
    console.error('Verification error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
