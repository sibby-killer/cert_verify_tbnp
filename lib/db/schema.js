import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
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
}, (table) => ({
  nameIdx: index('students_name_idx').on(table.name),
}));

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
  // DB-level enforcement: one certificate per student per course
  studentCourseIdx: uniqueIndex('certificates_student_course_idx').on(table.studentId, table.courseId),
  studentIdIdx: index('certificates_student_id_idx').on(table.studentId),
  courseIdIdx: index('certificates_course_id_idx').on(table.courseId),
  statusIdx: index('certificates_status_idx').on(table.status),
}));

export const verificationLogs = sqliteTable('verification_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  certId: text('cert_id').references(() => certificates.id),
  verifiedAt: integer('verified_at', { mode: 'timestamp' }).notNull(),
  verifierIp: text('verifier_ip'),
  result: text('result').notNull(),
  method: text('method').notNull(),
}, (table) => ({
  certIdIdx: index('vlog_cert_id_idx').on(table.certId),
  verifiedAtIdx: index('vlog_verified_at_idx').on(table.verifiedAt),
  resultIdx: index('vlog_result_idx').on(table.result),
}));

export const forgeryReports = sqliteTable('forgery_reports', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  securityNumber: text('security_number'),
  details: text('details'),
  reportedIp: text('reported_ip'),
  status: text('status').default('pending'),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => ({
  statusIdx: index('freport_status_idx').on(table.status),
}));

export const adminUsers = sqliteTable('admin_users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email'),
  role: text('role').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(1),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// ── NEW: Refresh token table for secure JWT rotation ──────────────────────────
export const refreshTokens = sqliteTable('refresh_tokens', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  token: text('token').notNull().unique(),
  userId: text('user_id').notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => ({
  tokenIdx: uniqueIndex('refresh_tokens_token_idx').on(table.token),
  userIdIdx: index('refresh_tokens_user_id_idx').on(table.userId),
}));