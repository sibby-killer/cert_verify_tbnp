import { db } from '../../../../lib/db/index.js';
import { courses } from '../../../../lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { compose } from '../../../../lib/middleware/compose.js';
import { withRateLimit } from '../../../../lib/middleware/rateLimit.js';
import { withAuth } from '../../../../lib/middleware/auth.js';
import { UpdateCourseSchema } from '../../../../lib/validation/course.schema.js';

export default compose(
  withRateLimit(30, 60_000),
  withAuth,
  async (req, res) => {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Forbidden: superadmin required' });
    }

    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: 'Course ID is required' });

    if (req.method === 'PUT') {
      const parsed = UpdateCourseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues.map(i => i.message) });
      }
      const [updated] = await db.update(courses).set(parsed.data).where(eq(courses.id, id)).returning();
      if (!updated) return res.status(404).json({ success: false, message: 'Course not found' });
      return res.status(200).json({ success: true, data: updated });
    }

    if (req.method === 'DELETE') {
      const [existing] = await db.select({ id: courses.id }).from(courses).where(eq(courses.id, id));
      if (!existing) return res.status(404).json({ success: false, message: 'Course not found' });
      await db.delete(courses).where(eq(courses.id, id));
      return res.status(200).json({ success: true, data: { message: 'Course deleted' } });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
);
