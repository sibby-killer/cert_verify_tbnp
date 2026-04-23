import { db } from '../../lib/db/index.js';
import { verificationLogs } from '../../lib/db/schema.js';
import { desc, asc, sql, eq } from 'drizzle-orm';
import { compose } from '../../lib/middleware/compose.js';
import { withRateLimit } from '../../lib/middleware/rateLimit.js';
import { withAuth } from '../../lib/middleware/auth.js';
import { parsePagination, buildPaginatedResponse } from '../../lib/utils/pagination.js';

const SORTABLE = ['verifiedAt', 'result'];
const VALID_RESULTS = ['valid', 'invalid', 'revoked'];

export default compose(
  withRateLimit(60, 60_000),
  withAuth,
  async (req, res) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { page, limit, offset, sort, order } = parsePagination(req.query, SORTABLE, 'verifiedAt');
    const { result } = req.query;

    const where = result && VALID_RESULTS.includes(result) 
      ? eq(verificationLogs.result, result) 
      : undefined;

    const [{ total }] = await db
      .select({ total: sql`COUNT(*)` })
      .from(verificationLogs)
      .where(where);

    const sortCol = verificationLogs[sort] || verificationLogs.verifiedAt;

    const data = await db
      .select()
      .from(verificationLogs)
      .where(where)
      .orderBy(order === 'asc' ? asc(sortCol) : desc(sortCol))
      .limit(limit)
      .offset(offset);

    return res.status(200).json({
      success: true,
      ...buildPaginatedResponse(data, Number(total), page, limit),
    });
  }
);
