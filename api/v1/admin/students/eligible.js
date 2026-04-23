/**
 * GET /api/v1/admin/students/eligible?courseId=<uuid>&search=<string>
 *
 * Returns students who do NOT yet have a certificate for the given course.
 * Uses a DB-level NOT EXISTS subquery — no client-side filtering required.
 *
 * This feeds the IssuePage dropdown so only eligible students appear.
 */
import { db } from '../../../../lib/db/index.js';
import { students, certificates } from '../../../../lib/db/schema.js';
import { like, or, asc, sql } from 'drizzle-orm';
import { compose } from '../../../../lib/middleware/compose.js';
import { withRateLimit } from '../../../../lib/middleware/rateLimit.js';
import { withAuth } from '../../../../lib/middleware/auth.js';

export default compose(
  withRateLimit(60, 60_000),
  withAuth,
  async (req, res) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { courseId, search } = req.query;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'courseId query parameter is required',
      });
    }

    // Build the NOT EXISTS subquery inline via sql template literal.
    // Drizzle's ORM-level notExists() needs a correlated subquery builder;
    // using sql`` is cleaner and more readable here.
    const notAlreadyCertified = sql`NOT EXISTS (
      SELECT 1 FROM ${certificates}
      WHERE ${certificates.studentId} = ${students.id}
        AND ${certificates.courseId}  = ${courseId}
    )`;

    const searchCondition = search
      ? sql`AND (${students.name} LIKE ${'%' + search + '%'}
               OR ${students.regNumber} LIKE ${'%' + search + '%'})`
      : sql``;

    const data = await db
      .select({
        id:        students.id,
        name:      students.name,
        regNumber: students.regNumber,
        email:     students.email,
      })
      .from(students)
      .where(sql`${notAlreadyCertified} ${searchCondition}`)
      .orderBy(asc(students.name))
      .limit(500); // practical upper bound for a dropdown

    return res.status(200).json({ success: true, data });
  }
);
