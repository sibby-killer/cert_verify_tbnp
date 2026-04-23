import { getLogs } from '../../../lib/services/log.service.js';
import { compose } from '../../../lib/middleware/compose.js';
import { withRateLimit } from '../../../lib/middleware/rateLimit.js';
import { withAuth } from '../../../lib/middleware/auth.js';
import { parsePagination, buildPaginatedResponse } from '../../../lib/utils/pagination.js';
import { db } from '../../../lib/db/index.js';
import { verificationLogs } from '../../../lib/db/schema.js';
import { sql, eq, gte, and } from 'drizzle-orm';

export default compose(
  withRateLimit(60, 60_000),
  withAuth,
  async (req, res) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { page, limit, offset } = parsePagination(req.query, [], 'verifiedAt');
    const { result, dateFrom } = req.query;

    const conditions = [];
    if (result && ['valid', 'invalid', 'revoked'].includes(result)) {
      conditions.push(eq(verificationLogs.result, result));
    }
    if (dateFrom) {
      const d = new Date(dateFrom);
      if (!isNaN(d)) conditions.push(gte(verificationLogs.verifiedAt, d));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = await db
      .select({ total: sql`COUNT(*)` })
      .from(verificationLogs)
      .where(where);

    const data = await getLogs({ result, dateFrom, limit, offset });

    return res.status(200).json({
      success: true,
      ...buildPaginatedResponse(data, Number(total), page, limit),
    });
  }
);
