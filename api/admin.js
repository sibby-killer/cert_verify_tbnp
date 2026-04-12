import { db } from '../lib/db/index.js';
import { adminUsers, students, courses, certificates, verificationLogs, forgeryReports } from '../lib/db/schema.js';
import { eq, desc, like } from 'drizzle-orm';
import { comparePassword, generateJWT, hashPassword } from '../lib/services/security.service.js';
import { getDashboardStats, flagSuspicious } from '../lib/services/log.service.js';
import { success, error, unauthorized } from '../lib/utils/responseHelper.js';
import { authenticate } from '../lib/middleware/auth.js';
import { generateQR } from '../lib/services/qrcode.service.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  const { url, method } = req;
  console.log(`[AdminAPI] ${method} ${url}`);

  // 0. Setup Logic (Admin Initialization)
  if (url.includes('/setup') && method === 'POST') {
    try {
      const existing = await db.select().from(adminUsers);
      if (existing.length > 0) {
        return error(res, 'Setup already completed. Please log in.', 403);
      }

      const { username, password, email } = req.body;
      const hashedPassword = await hashPassword(password);
      
      const [newUser] = await db.insert(adminUsers).values({
        id: crypto.randomUUID(),
        username,
        password: hashedPassword,
        email,
        role: 'admin',
        isActive: true
      }).returning();

      return success(res, { message: 'Admin created successfully!', user: newUser.username }, 201);
    } catch (err) {
      console.error('[Setup Error]:', err);
      return error(res, `Setup failed: ${err.message}`, 500);
    }
  }

  // 1. Auth Logic... (already updated in previous step)
  if (url.includes('/auth/login') && method === 'POST') {
    try {
      const { username, password } = req.body || {};
      if (!username || !password) {
        return error(res, 'Username and password are required', 400);
      }

      console.log(`[Auth] Attempting login for: ${username}`);
      const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
      
      if (!user) {
        console.log(`[Auth] User not found: ${username}`);
        return unauthorized(res);
      }

      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        console.log(`[Auth] Password mismatch for: ${username}`);
        return unauthorized(res);
      }

      if (!user.isActive) return error(res, 'Account is deactivated', 403);

      const token = generateJWT({ id: user.id, username: user.username, role: user.role });
      return success(res, { token, user: { username: user.username, role: user.role } });
    } catch (err) {
      console.error('[Auth Error]:', err);
      return error(res, `Login error: ${err.message || 'Unknown error'}`, 500);
    }
  }

  // 2. Protected Logic Start
  const auth = await authenticate(req);
  if (!auth.authenticated) return unauthorized(res);

  try {
    // 3. Dashboard
    if (url.includes('/dashboard')) {
      const stats = await getDashboardStats();
      const suspicious = await flagSuspicious(5);
      return success(res, { stats, suspicious });
    }

    // 4. Students
    if (url.includes('/students')) {
      if (method === 'GET') {
        const data = await db.select().from(students).orderBy(desc(students.createdAt));
        return success(res, data);
      }

      if (auth.user.role !== 'superadmin') return unauthorized(res);

      if (method === 'POST') {
        const [student] = await db.insert(students).values({ ...req.body, id: crypto.randomUUID() }).returning();
        return success(res, student);
      }
      if (method === 'PUT') {
        const id = url.split('/').pop();
        const [student] = await db.update(students).set(req.body).where(eq(students.id, id)).returning();
        return success(res, student);
      }
      if (method === 'DELETE') {
        const id = url.split('/').pop();
        await db.delete(students).where(eq(students.id, id));
        return success(res, { message: 'Student deleted' });
      }
    }

    // 5. Courses
    if (url.includes('/courses')) {
      if (method === 'GET') {
        const data = await db.select().from(courses).orderBy(courses.name);
        return success(res, data);
      }

      if (auth.user.role !== 'superadmin') return unauthorized(res);

      if (method === 'POST') {
        const [course] = await db.insert(courses).values({ ...req.body, id: crypto.randomUUID() }).returning();
        return success(res, course);
      }
      if (method === 'PUT') {
        const id = url.split('/').pop();
        const [course] = await db.update(courses).set(req.body).where(eq(courses.id, id)).returning();
        return success(res, course);
      }
      if (method === 'DELETE') {
        const id = url.split('/').pop();
        await db.delete(courses).where(eq(courses.id, id));
        return success(res, { message: 'Course deleted' });
      }
    }

    // 6. Logs
    if (url.includes('/logs')) {
      const data = await db.select().from(verificationLogs).orderBy(desc(verificationLogs.verifiedAt)).limit(100);
      return success(res, data);
    }

    // 7. Reports
    if (url.includes('/reports')) {
      if (method === 'GET') {
        const data = await db.select().from(forgeryReports).orderBy(desc(forgeryReports.createdAt));
        return success(res, data);
      }
      if (method === 'PUT') {
        const id = url.split('/').pop();
        await db.update(forgeryReports).set({ status: req.body.status }).where(eq(forgeryReports.id, id));
        return success(res, { message: 'Report updated' });
      }
    }

    // 8. Certificates (Issue/Revoke)
    if (url.includes('/certificates')) {
       // Minimal cert retrieval
       if (method === 'GET') {
         const data = await db.select().from(certificates).orderBy(desc(certificates.issuedDate)).limit(50);
         return success(res, data);
       }
       if (method === 'POST' && url.includes('/issue')) {
         const { studentId, courseId, graduationYear } = req.body;
         const institutionRec = await db.select().from(institutions).limit(1);
         if (!institutionRec.length) return error(res, 'Institution not configured', 500);
         
         const securityNumber = `BNP-${graduationYear}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
         const { base64, dataUrl } = await generateQR(securityNumber);
         
         const [newCert] = await db.insert(certificates).values({
           id: crypto.randomUUID(),
           studentId,
           courseId,
           institutionId: institutionRec[0].id,
           securityNumber,
           qrCodeUrl: dataUrl,
           issuedDate: new Date(),
           graduationYear: parseInt(graduationYear, 10),
           status: 'valid'
         }).returning();
         
         return success(res, { certificate: newCert });
       }
    }

    // 9. User Management (Superadmin only)
    if (url.includes('/users')) {
      if (auth.user.role !== 'superadmin') return unauthorized(res);
      
      if (method === 'GET') {
        const users = await db.select({ id: adminUsers.id, username: adminUsers.username, email: adminUsers.email, role: adminUsers.role, isActive: adminUsers.isActive, createdAt: adminUsers.createdAt }).from(adminUsers);
        return success(res, users);
      }
      if (method === 'POST') {
        const { username, password, email, role } = req.body;
        const hashedPassword = await hashPassword(password);
        const [newUser] = await db.insert(adminUsers).values({
          id: crypto.randomUUID(),
          username,
          password: hashedPassword,
          email,
          role: role || 'admin',
          isActive: true
        }).returning({ id: adminUsers.id, username: adminUsers.username, role: adminUsers.role });
        return success(res, newUser, 201);
      }
      if (method === 'PUT') {
        const id = url.split('/').pop();
        const [updatedUser] = await db.update(adminUsers).set(req.body).where(eq(adminUsers.id, id)).returning({ id: adminUsers.id, username: adminUsers.username, role: adminUsers.role, isActive: adminUsers.isActive });
        return success(res, updatedUser);
      }
      if (method === 'DELETE') {
        const id = url.split('/').pop();
        await db.delete(adminUsers).where(eq(adminUsers.id, id));
        return success(res, { message: 'User deleted' });
      }
    }

    return error(res, 'Resource not found', 404);
  } catch (err) {
    console.error('Admin API Master Error:', err);
    return error(res, 'Internal server error', 500);
  }
}
