import { db } from '../../lib/db/index.js';
import { certificates, students, courses, verificationLogs, institutions } from '../../lib/db/schema.js';
import { sql, eq } from 'drizzle-orm';
import { compose } from '../../lib/middleware/compose.js';
import { withRateLimit } from '../../lib/middleware/rateLimit.js';
import { withAuth } from '../../lib/middleware/auth.js';
import { InstitutionSchema } from '../../lib/validation/report.schema.js';
import crypto from 'crypto';

export default compose(
  withRateLimit(30, 60_000),
  withAuth,
  async (req, res) => {
    const { mode } = req.query;

    switch (req.method) {
      case 'GET': {
        // ── Settings mode ──────────────────────────────────────────────────
        if (mode === 'settings') {
          const [inst] = await db.select().from(institutions).limit(1);
          return res.status(200).json({ success: true, data: inst || null });
        }

        // ── Default: Dashboard Stats ───────────────────────────────────────
        const [stats] = await db.select({
          totalCerts:    sql`COUNT(DISTINCT ${certificates.id})`,
          totalStudents: sql`COUNT(DISTINCT ${students.id})`,
          totalCourses:  sql`COUNT(DISTINCT ${courses.id})`,
          totalVerifs:   sql`COUNT(DISTINCT ${verificationLogs.id})`,
        })
        .from(certificates)
        .leftJoin(students, eq(students.id, certificates.studentId))
        .leftJoin(courses, eq(courses.id, certificates.courseId))
        .leftJoin(verificationLogs, sql`1=1`); // simplified count for verifs

        // Refined counts for others
        const [{ sCount }] = await db.select({ sCount: sql`COUNT(*)` }).from(students);
        const [{ cCount }] = await db.select({ cCount: sql`COUNT(*)` }).from(courses);
        const [{ vCount }] = await db.select({ vCount: sql`COUNT(*)` }).from(verificationLogs);
        const [{ certCount }] = await db.select({ certCount: sql`COUNT(*)` }).from(certificates);

        return res.status(200).json({
          success: true,
          data: {
            certificates: certCount,
            students: sCount,
            courses: cCount,
            verifications: vCount,
          }
        });
      }

      case 'PUT': {
        // Only settings supports PUT
        if (mode !== 'settings') return res.status(400).json({ success: false, message: 'Invalid mode' });
        if (req.user.role !== 'superadmin') return res.status(403).json({ success: false, message: 'Forbidden' });

        const parsed = InstitutionSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed' });

        const [existing] = await db.select({ id: institutions.id }).from(institutions).limit(1);
        let result;
        if (existing) {
          [result] = await db.update(institutions).set(parsed.data).where(eq(institutions.id, existing.id)).returning();
        } else {
          [result] = await db.insert(institutions).values({ id: crypto.randomUUID(), ...parsed.data }).returning();
        }
        return res.status(200).json({ success: true, data: result });
      }

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  }
);
