import crypto from 'crypto';
import { db } from '../db/index.js';
import { verificationLogs, forgeryReports, certificates, students } from '../db/schema.js';
import { eq, sql, gte, and, desc } from 'drizzle-orm';

export async function logVerification(data) {
  const { certId, verifierIp, result, method } = data;
  await db.insert(verificationLogs).values({
    id: crypto.randomUUID(),
    certId: certId || null,
    verifiedAt: new Date(),
    verifierIp,
    result,
    method
  });
}

export async function getLogs(filters = {}) {
  let query = db.select({
    log: verificationLogs,
    certificate: certificates,
    student: students
  }).from(verificationLogs)
    .leftJoin(certificates, eq(verificationLogs.certId, certificates.id))
    .leftJoin(students, eq(certificates.studentId, students.id));

  const conditions = [];
  if (filters.dateFrom) conditions.push(gte(verificationLogs.verifiedAt, new Date(filters.dateFrom)));
  if (filters.result) conditions.push(eq(verificationLogs.result, filters.result));
  if (filters.method) conditions.push(eq(verificationLogs.method, filters.method));

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  return await query.orderBy(desc(verificationLogs.verifiedAt));
}

export async function flagSuspicious() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find certs verified 20+ times today
  const results = await db.select({
    certId: verificationLogs.certId,
    count: sql`count(*)`
  }).from(verificationLogs)
    .where(and(
      sql`${verificationLogs.certId} IS NOT NULL`,
      gte(verificationLogs.verifiedAt, today)
    ))
    .groupBy(verificationLogs.certId)
    .having(sql`count(*) >= 20`);

  return results;
}

export async function getDashboardStats() {
  const [certs] = await db.select({ count: sql`count(*)` }).from(certificates);
  const [studs] = await db.select({ count: sql`count(*)` }).from(students);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [verifs] = await db.select({ count: sql`count(*)` }).from(verificationLogs).where(gte(verificationLogs.verifiedAt, today));
  
  const [reports] = await db.select({ count: sql`count(*)` }).from(forgeryReports).where(eq(forgeryReports.status, 'pending'));

  return {
    totalCertificates: certs.count,
    totalStudents: studs.count,
    verificationsToday: verifs.count,
    pendingReports: reports.count
  };
}
