import { db } from '../../../../lib/db/index.js';
import { students } from '../../../../lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { compose } from '../../../../lib/middleware/compose.js';
import { withRateLimit } from '../../../../lib/middleware/rateLimit.js';
import { withAuth } from '../../../../lib/middleware/auth.js';
import { withValidation } from '../../../../lib/middleware/validate.js';
import { UpdateStudentSchema } from '../../../../lib/validation/student.schema.js';

export default compose(
  withRateLimit(30, 60_000),
  withAuth,
  async (req, res) => {
    // Only superadmin can modify or delete students
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Forbidden: superadmin required' });
    }

    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: 'Student ID is required' });

    // ── PUT /api/v1/admin/students/:id ──────────────────────────────────────
    if (req.method === 'PUT') {
      const parsed = UpdateStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues.map(i => i.message) });
      }

      const [updated] = await db
        .update(students)
        .set(parsed.data) // Only whitelisted fields from schema
        .where(eq(students.id, id))
        .returning();

      if (!updated) return res.status(404).json({ success: false, message: 'Student not found' });
      return res.status(200).json({ success: true, data: updated });
    }

    // ── DELETE /api/v1/admin/students/:id ───────────────────────────────────
    if (req.method === 'DELETE') {
      const [existing] = await db.select({ id: students.id }).from(students).where(eq(students.id, id));
      if (!existing) return res.status(404).json({ success: false, message: 'Student not found' });

      await db.delete(students).where(eq(students.id, id));
      return res.status(200).json({ success: true, data: { message: 'Student deleted' } });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
);
