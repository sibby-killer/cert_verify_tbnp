import { db } from '../../../../lib/db/index.js';
import { students } from '../../../../lib/db/schema.js';
import { eq, like, or, desc, asc, sql } from 'drizzle-orm';
import { compose } from '../../../../lib/middleware/compose.js';
import { withRateLimit } from '../../../../lib/middleware/rateLimit.js';
import { withAuth } from '../../../../lib/middleware/auth.js';
import { withRole } from '../../../../lib/middleware/role.js';
import { withValidation } from '../../../../lib/middleware/validate.js';
import { CreateStudentSchema } from '../../../../lib/validation/student.schema.js';
import { parsePagination, buildPaginatedResponse } from '../../../../lib/utils/pagination.js';
import crypto from 'crypto';

const SORTABLE = ['name', 'regNumber', 'createdAt'];

export default compose(
  withRateLimit(60, 60_000),
  withAuth,
  async (req, res) => {
    // ── GET /api/v1/admin/students ─────────────────────────────────────────
    if (req.method === 'GET') {
      const { page, limit, offset, search, sort, order } = parsePagination(req.query, SORTABLE, 'createdAt');

      const conditions = [];
      if (search) {
        conditions.push(
          or(like(students.name, `%${search}%`), like(students.regNumber, `%${search}%`))
        );
      }

      const where = conditions.length > 0 ? conditions[0] : undefined;

      const [{ total }] = await db
        .select({ total: sql`COUNT(*)` })
        .from(students)
        .where(where);

      const sortCol = { name: students.name, regNumber: students.regNumber, createdAt: students.createdAt }[sort] || students.createdAt;

      const data = await db
        .select()
        .from(students)
        .where(where)
        .orderBy(order === 'asc' ? asc(sortCol) : desc(sortCol))
        .limit(limit)
        .offset(offset);

      return res.status(200).json({
        success: true,
        ...buildPaginatedResponse(data, Number(total), page, limit),
      });
    }

    // ── POST /api/v1/admin/students ─────────────────────────────────────────
    if (req.method === 'POST') {
      // Only superadmin can create students
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({ success: false, message: 'Forbidden: superadmin required' });
      }

      const parsed = CreateStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues.map(i => i.message) });
      }

      const { name, regNumber, email } = parsed.data;

      try {
        const [student] = await db
          .insert(students)
          .values({ id: crypto.randomUUID(), name, regNumber, email: email || null })
          .returning();
        return res.status(201).json({ success: true, data: student });
      } catch (err) {
        if (err.message?.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ success: false, message: 'Registration number already exists' });
        }
        throw err;
      }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
);
