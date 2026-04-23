import { db } from '../../../../lib/db/index.js';
import { courses } from '../../../../lib/db/schema.js';
import { like, or, desc, asc, sql } from 'drizzle-orm';
import { compose } from '../../../../lib/middleware/compose.js';
import { withRateLimit } from '../../../../lib/middleware/rateLimit.js';
import { withAuth } from '../../../../lib/middleware/auth.js';
import { withValidation } from '../../../../lib/middleware/validate.js';
import { CreateCourseSchema } from '../../../../lib/validation/course.schema.js';
import { parsePagination, buildPaginatedResponse } from '../../../../lib/utils/pagination.js';
import crypto from 'crypto';

const SORTABLE = ['name', 'deptCode', 'createdAt'];

export default compose(
  withRateLimit(60, 60_000),
  withAuth,
  async (req, res) => {
    // ── GET /api/v1/admin/courses ───────────────────────────────────────────
    if (req.method === 'GET') {
      const { page, limit, offset, search, sort, order } = parsePagination(req.query, SORTABLE, 'name');

      const where = search
        ? or(like(courses.name, `%${search}%`), like(courses.deptCode, `%${search}%`))
        : undefined;

      const [{ total }] = await db.select({ total: sql`COUNT(*)` }).from(courses).where(where);

      const sortCol = { name: courses.name, deptCode: courses.deptCode, createdAt: courses.createdAt }[sort] || courses.name;

      const data = await db
        .select()
        .from(courses)
        .where(where)
        .orderBy(order === 'asc' ? asc(sortCol) : desc(sortCol))
        .limit(limit)
        .offset(offset);

      return res.status(200).json({ success: true, ...buildPaginatedResponse(data, Number(total), page, limit) });
    }

    // ── POST /api/v1/admin/courses ──────────────────────────────────────────
    if (req.method === 'POST') {
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({ success: false, message: 'Forbidden: superadmin required' });
      }
      const parsed = CreateCourseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues.map(i => i.message) });
      }
      const [course] = await db
        .insert(courses)
        .values({ id: crypto.randomUUID(), ...parsed.data })
        .returning();
      return res.status(201).json({ success: true, data: course });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
);
