import crypto from 'crypto';
import { db } from '../db/index.js';
import { certificates, students, courses, institutions, verificationLogs, forgeryReports } from '../db/schema.js';
import { eq, like, sql, and, gte, desc } from 'drizzle-orm';
import { generateSecurityNumber } from './security.service.js';
import { generateQR } from './qrcode.service.js';
import { sendCertificateEmail } from './email.service.js';
import { logVerification } from './log.service.js';

export async function getCertificateBySecurity(securityNumber) {
  const results = await db.select({
    certificate: certificates,
    student: students,
    course: courses,
    institution: institutions,
  }).from(certificates)
    .innerJoin(students, eq(certificates.studentId, students.id))
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .innerJoin(institutions, eq(certificates.institutionId, institutions.id))
    .where(eq(certificates.securityNumber, securityNumber));
  return results[0];
}

export async function issueSingle(data) {
  const { studentId, courseId, institutionId, issuedDate, graduationYear, studentEmail } = data;
  
  const course = (await db.select().from(courses).where(eq(courses.id, courseId)))[0];
  if (!course) throw new Error('Course not found');
  
  const securityNumber = await generateSecurityNumber(studentId, graduationYear, course.deptCode);
  
  const qrData = await generateQR(securityNumber);
  
  const certId = crypto.randomUUID();
  await db.insert(certificates).values({
    id: certId,
    studentId,
    courseId,
    institutionId,
    securityNumber,
    qrCodeUrl: qrData.dataUrl,
    issuedDate: new Date(issuedDate),
    graduationYear: parseInt(graduationYear),
    status: 'valid'
  });

  const cert = await getCertificateBySecurity(securityNumber);
  await sendCertificateEmail(studentEmail, {
    studentName: cert.student.name,
    securityNumber,
    courseName: cert.course.name,
    qrCodeDataUrl: qrData.dataUrl
  });

  return cert;
}

export async function issueBatch(csvData) {
  const results = [];
  for (const row of csvData) {
    try {
      const cert = await issueSingle(row);
      results.push({ success: true, securityNumber: cert.certificate.securityNumber });
    } catch (error) {
      results.push({ success: false, error: error.message, row });
    }
  }
  return results;
}

export async function verifyCertificate(securityNumber, logData) {
  const cert = await getCertificateBySecurity(securityNumber);
  
  const result = cert ? cert.certificate.status : 'invalid';
  
  await logVerification({
    certId: cert ? cert.certificate.id : null,
    verifierIp: logData.ip,
    result,
    method: logData.method
  });

  return cert;
}

export async function revokeCertificate(securityNumber, reason) {
  await db.update(certificates)
    .set({ 
      status: 'revoked', 
      revokedAt: new Date(), 
      revokeReason: reason 
    })
    .where(eq(certificates.securityNumber, securityNumber));
}

export async function getCertificateDetails(id) {
  const results = await db.select({
    certificate: certificates,
    student: students,
    course: courses,
    institution: institutions,
  }).from(certificates)
    .innerJoin(students, eq(certificates.studentId, students.id))
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .innerJoin(institutions, eq(certificates.institutionId, institutions.id))
    .where(eq(certificates.id, id));
  return results[0];
}

export async function getAllCertificates(filters = {}) {
  let query = db.select({
    certificate: certificates,
    student: students,
    course: courses,
  }).from(certificates)
    .innerJoin(students, eq(certificates.studentId, students.id))
    .innerJoin(courses, eq(certificates.courseId, courses.id));

  const conditions = [];
  if (filters.status) conditions.push(eq(certificates.status, filters.status));
  if (filters.search) {
    conditions.push(sql`(${students.name} LIKE ${'%' + filters.search + '%'} OR ${certificates.securityNumber} LIKE ${'%' + filters.search + '%'})`);
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  return await query.orderBy(desc(certificates.createdAt));
}
