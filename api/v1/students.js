import { db } from '../../lib/db/index.js';
import { students, certificates } from '../../lib/db/schema.js';
import { eq, like, or, desc, asc, sql } from 'drizzle-orm';
import { compose } from '../../lib/middleware/compose.js';
import { withRateLimit } from '../../lib/middleware/rateLimit.js';
import { withAuth } from '../../lib/middleware/auth.js';
import { withValidation } from '../../lib/middleware/validate.js';
import { CreateStudentSchema, UpdateStudentSchema } from '../../lib/validation/student.schema.js';
import { parsePagination, buildPaginatedResponse } from '../../lib/utils/pagination.js';
import crypto from 'crypto';

const SORTABLE = ['name', 'regNumber', 'createdAt', 'gender', 'yearStarted'];

export default compose(
  withRateLimit(60, 60_000),
  withAuth,
  async (req, res) => {
    const { id, mode } = req.query;

    switch (req.method) {
      case 'GET': {
        // ── Eligible Students mode ──────────────────────────────────────────
        if (mode === 'eligible') {
          const { courseId, search } = req.query;
          if (!courseId) return res.status(400).json({ success: false, message: 'courseId is required' });
          const notAlreadyCertified = sql`NOT EXISTS (SELECT 1 FROM ${certificates} WHERE ${certificates.studentId} = ${students.id} AND ${certificates.courseId} = ${courseId})`;
          const searchCondition = search ? sql`AND (${students.name} LIKE ${'%' + search + '%'} OR ${students.regNumber} LIKE ${'%' + search + '%'})` : sql``;
          const data = await db.select({ 
            id: students.id, 
            name: students.name, 
            regNumber: students.regNumber, 
            email: students.email,
            gender: students.gender,
            yearStarted: students.yearStarted
          }).from(students).where(sql`${notAlreadyCertified} ${searchCondition}`).orderBy(asc(students.name)).limit(500);
          return res.status(200).json({ success: true, data });
        }

        // ── Single Student by ID ────────────────────────────────────────────
        if (id) {
          const [student] = await db.select().from(students).where(eq(students.id, id));
          if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
          return res.status(200).json({ success: true, data: student });
        }

        // ── List Students (with pagination/search) ──────────────────────────
        const { page, limit, offset, search, sort, order } = parsePagination(req.query, SORTABLE, 'createdAt');
        const conditions = search ? [or(like(students.name, `%${search}%`), like(students.regNumber, `%${search}%`))] : [];
        const where = conditions.length > 0 ? conditions[0] : undefined;
        const [{ total }] = await db.select({ total: sql`COUNT(*)` }).from(students).where(where);
        
        let sortCol;
        if (sort === 'gender') {
          sortCol = sql`CASE 
            WHEN ${students.gender} = 'male' THEN 1 
            WHEN ${students.gender} = 'female' THEN 2 
            ELSE 3 
          END`;
        } else {
          sortCol = { 
            name: students.name, 
            regNumber: students.regNumber, 
            createdAt: students.createdAt,
            yearStarted: students.yearStarted
          }[sort] || students.createdAt;
        }

        const data = await db.select().from(students).where(where).orderBy(order === 'asc' ? asc(sortCol) : desc(sortCol)).limit(limit).offset(offset);
        return res.status(200).json({ success: true, ...buildPaginatedResponse(data, Number(total), page, limit) });
      }

      case 'POST': {
        if (req.user.role !== 'superadmin') return res.status(403).json({ success: false, message: 'Forbidden: superadmin required' });
        const parsed = CreateStudentSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues.map(i => i.message) });
        
        const { name, regNumber, email, gender, yearStarted } = parsed.data;
        try {
          const [student] = await db.insert(students).values({ 
            id: crypto.randomUUID(), 
            name, 
            regNumber, 
            email: email || null,
            gender: gender || null,
            yearStarted: yearStarted || null
          }).returning();
          return res.status(201).json({ success: true, data: student });
        } catch (err) {
          if (err.message?.includes('UNIQUE constraint failed')) return res.status(409).json({ success: false, message: 'Registration number already exists' });
          throw err;
        }
      }

      case 'PUT': {
        if (!id) return res.status(400).json({ success: false, message: 'ID is required' });
        if (req.user.role !== 'superadmin') return res.status(403).json({ success: false, message: 'Forbidden: superadmin required' });
        const parsed = UpdateStudentSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues.map(i => i.message) });
        const [updated] = await db.update(students).set(parsed.data).where(eq(students.id, id)).returning();
        if (!updated) return res.status(404).json({ success: false, message: 'Student not found' });
        return res.status(200).json({ success: true, data: updated });
      }

      case 'DELETE': {
        if (!id) return res.status(400).json({ success: false, message: 'ID is required' });
        if (req.user.role !== 'superadmin') return res.status(403).json({ success: false, message: 'Forbidden: superadmin required' });
        const [existing] = await db.select({ id: students.id }).from(students).where(eq(students.id, id));
        if (!existing) return res.status(404).json({ success: false, message: 'Student not found' });
        await db.delete(students).where(eq(students.id, id));
        return res.status(200).json({ success: true, data: { message: 'Student deleted' } });
      }

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  }
);
