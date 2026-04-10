import { db } from '../../lib/db/index.js';
import { certificates, students, courses } from '../../lib/db/schema.js';
import { eq, or, like, and } from 'drizzle-orm';
import { success, error } from '../../lib/utils/responseHelper.js';
import { authenticate } from '../../lib/middleware/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json(error('Method not allowed'));

  try {
    const auth = await authenticate(req);
    if (!auth.authenticated) return res.status(401).json(error('Unauthorized'));

    const { search, status } = req.query;

    let query = db.select({
      certificate: certificates,
      student: students,
      course: courses
    })
    .from(certificates)
    .innerJoin(students, eq(certificates.studentId, students.id))
    .innerJoin(courses, eq(certificates.courseId, courses.id));

    const conditions = [];
    if (search) {
      conditions.push(or(
        like(students.name, `%${search}%`),
        like(students.regNumber, `%${search}%`),
        like(certificates.securityNumber, `%${search}%`)
      ));
    }
    if (status) {
      conditions.push(eq(certificates.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const data = await query;
    return res.status(200).json(success(data));
  } catch (err) {
    console.error('Certificates fetch error:', err);
    return res.status(500).json(error('Internal server error'));
  }
}
