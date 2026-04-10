import { db } from '../lib/db/index.js';
import { adminUsers, students, courses, certificates, verificationLogs, forgeryReports } from '../lib/db/schema.js';
import { eq, desc, like } from 'drizzle-orm';
import { comparePassword, generateJWT } from '../lib/services/security.service.js';
import { getGeneralStats, getSuspiciousActivity } from '../lib/services/log.service.js';
import { success, error, unauthorized } from '../lib/utils/responseHelper.js';
import { authenticate } from '../lib/middleware/auth.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  const { url, method } = req;

  // 1. Auth Logic (Public-ish)
  if (url.includes('/auth/login') && method === 'POST') {
    const { username, password } = req.body;
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    if (!user || !(await comparePassword(password, user.password))) return unauthorized(res);
    if (!user.isActive) return error(res, 'Account is deactivated', 403);
    const token = generateJWT({ id: user.id, username: user.username, role: user.role });
    return success(res, { token, user: { username: user.username, role: user.role } });
  }

  // 2. Protected Logic Start
  const auth = await authenticate(req);
  if (!auth.authenticated) return unauthorized(res);

  try {
    // 3. Dashboard
    if (url.includes('/dashboard')) {
      const stats = await getGeneralStats();
      const suspicious = await getSuspiciousActivity(5);
      return success(res, { stats, suspicious });
    }

    // 4. Students
    if (url.includes('/students')) {
      if (method === 'GET') {
        const data = await db.select().from(students).orderBy(desc(students.createdAt));
        return success(res, data);
      }
      if (method === 'POST') {
        const [student] = await db.insert(students).values({ ...req.body, id: crypto.randomUUID() }).returning();
        return success(res, student);
      }
    }

    // 5. Courses
    if (url.includes('/courses')) {
      if (method === 'GET') {
        const data = await db.select().from(courses).orderBy(courses.name);
        return success(res, data);
      }
      if (method === 'POST') {
        const [course] = await db.insert(courses).values({ ...req.body, id: crypto.randomUUID() }).returning();
        return success(res, course);
      }
    }

    // 6. Logs
    if (url.includes('/logs')) {
      const data = await db.select().from(verificationLogs).orderBy(desc(verificationLogs.timestamp)).limit(100);
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
         const data = await db.select().from(certificates).orderBy(desc(certificates.issuedAt)).limit(50);
         return success(res, data);
       }
    }

    return error(res, 'Resource not found', 404);
  } catch (err) {
    console.error('Admin API Master Error:', err);
    return error(res, 'Internal server error', 500);
  }
}
