import { db } from '../../../../lib/db/index.js';
import { forgeryReports } from '../../../../lib/db/schema.js';
import { desc, eq, like, sql } from 'drizzle-orm';
import { compose } from '../../../../lib/middleware/compose.js';
import { withRateLimit } from '../../../../lib/middleware/rateLimit.js';
import { withAuth } from '../../../../lib/middleware/auth.js';
import { parsePagination, buildPaginatedResponse } from '../../../../lib/utils/pagination.js';

export default compose(
  withRateLimit(60, 60_000),
  withAuth,
  async (req, res) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { page, limit, offset, search } = parsePagination(req.query, [], 'createdAt');
    const { status } = req.query;

    const conditions = [];
    if (status && ['pending', 'reviewed', 'dismissed'].includes(status)) {
      conditions.push(eq(forgeryReports.status, status));
    }
    if (search) conditions.push(like(forgeryReports.securityNumber, `%${search}%`));

    const where = conditions.length > 0
      ? conditions.reduce((a, b) => sql`${a} AND ${b}`)
      : undefined;

    const [{ total }] = await db.select({ total: sql`COUNT(*)` }).from(forgeryReports).where(where);

    const data = await db
      .select()
      .from(forgeryReports)
      .where(where)
      .orderBy(desc(forgeryReports.createdAt))
      .limit(limit)
      .offset(offset);

    return res.status(200).json({
      success: true,
      ...buildPaginatedResponse(data, Number(total), page, limit),
    });
  }
);
