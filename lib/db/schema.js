import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

export const institutions = sqliteTable('institutions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const students = sqliteTable('students', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  regNumber: text('reg_number').unique(),
  email: text('email'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const courses = sqliteTable('courses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  deptCode: text('dept_code').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const certificates = sqliteTable('certificates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  institutionId: text('institution_id').notNull().references(() => institutions.id, { onDelete: 'cascade' }),
  securityNumber: text('security_number').notNull(),
  qrCodeUrl: text('qr_code_url'),
  issuedDate: integer('issued_date', { mode: 'timestamp' }).notNull(),
  graduationYear: integer('graduation_year').notNull(),
  status: text('status').notNull().default('valid'),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  revokeReason: text('revoke_reason'),
  emailSent: integer('email_sent', { mode: 'boolean' }).default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => ({
  securityNumberIdx: uniqueIndex('certificates_security_number_idx').on(table.securityNumber),
}));

export const verificationLogs = sqliteTable('verification_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  certId: text('cert_id').references(() => certificates.id),
  verifiedAt: integer('verified_at', { mode: 'timestamp' }).notNull(),
  verifierIp: text('verifier_ip'),
  result: text('result').notNull(),
  method: text('method').notNull(),
});

export const forgeryReports = sqliteTable('forgery_reports', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  securityNumber: text('security_number'),
  details: text('details'),
  reportedIp: text('reported_ip'),
  status: text('status').default('pending'),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const adminUsers = sqliteTable('admin_users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email'),
  role: text('role').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(1),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});