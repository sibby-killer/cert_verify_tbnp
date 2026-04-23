import { db } from '../../lib/db/index.js';
import { courses } from '../../lib/db/schema.js';
import { eq, like, or, desc, asc, sql } from 'drizzle-orm';
import { compose } from '../../lib/middleware/compose.js';
import { withRateLimit } from '../../lib/middleware/rateLimit.js';
import { withAuth } from '../../lib/middleware/auth.js';
import { CreateCourseSchema, UpdateCourseSchema } from '../../lib/validation/course.schema.js';
import { parsePagination, buildPaginatedResponse } from '../../lib/utils/pagination.js';
import crypto from 'crypto';

const SORTABLE = ['name', 'code', 'createdAt'];

export default compose(
  withRateLimit(60, 60_000),
  withAuth,
  async (req, res) => {
    const { id } = req.query;

    switch (req.method) {
      case 'GET': {
        if (id) {
          const [course] = await db.select().from(courses).where(eq(courses.id, id));
          if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
          return res.status(200).json({ success: true, data: course });
        }
        const { page, limit, offset, search, sort, order } = parsePagination(req.query, SORTABLE, 'createdAt');
        const conditions = search ? [or(like(courses.name, `%${search}%`), like(courses.code, `%${search}%`))] : [];
        const where = conditions.length > 0 ? conditions[0] : undefined;
        const [{ total }] = await db.select({ total: sql`COUNT(*)` }).from(courses).where(where);
        const sortCol = { name: courses.name, code: courses.code, createdAt: courses.createdAt }[sort] || courses.createdAt;
        const data = await db.select().from(courses).where(where).orderBy(order === 'asc' ? asc(sortCol) : desc(sortCol)).limit(limit).offset(offset);
        return res.status(200).json({ success: true, ...buildPaginatedResponse(data, Number(total), page, limit) });
      }

      case 'POST': {
        if (req.user.role !== 'superadmin') return res.status(403).json({ success: false, message: 'Forbidden' });
        const parsed = CreateCourseSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed' });
        const [course] = await db.insert(courses).values({ id: crypto.randomUUID(), ...parsed.data }).returning();
        return res.status(201).json({ success: true, data: course });
      }

      case 'PUT': {
        if (!id) return res.status(400).json({ success: false, message: 'ID required' });
        if (req.user.role !== 'superadmin') return res.status(403).json({ success: false, message: 'Forbidden' });
        const parsed = UpdateCourseSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed' });
        const [updated] = await db.update(courses).set(parsed.data).where(eq(courses.id, id)).returning();
        if (!updated) return res.status(404).json({ success: false, message: 'Course not found' });
        return res.status(200).json({ success: true, data: updated });
      }

      case 'DELETE': {
        if (!id) return res.status(400).json({ success: false, message: 'ID required' });
        if (req.user.role !== 'superadmin') return res.status(403).json({ success: false, message: 'Forbidden' });
        await db.delete(courses).where(eq(courses.id, id));
        return res.status(200).json({ success: true, data: { message: 'Course deleted' } });
      }

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  }
);
