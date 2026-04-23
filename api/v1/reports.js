import { db } from '../lib/db/index.js';
import { forgeryReports } from '../lib/db/schema.js';
import { desc, eq, like, sql } from 'drizzle-orm';
import { compose } from '../lib/middleware/compose.js';
import { withRateLimit } from '../lib/middleware/rateLimit.js';
import { withAuth } from '../lib/middleware/auth.js';
import { withValidation } from '../lib/middleware/validate.js';
import { ForgeryReportSchema, UpdateReportSchema } from '../lib/validation/report.schema.js';
import { parsePagination, buildPaginatedResponse } from '../lib/utils/pagination.js';
import crypto from 'crypto';

export default compose(
  withRateLimit(30, 60_000),
  async (req, res, next) => {
    // ── PUBLIC: POST /api/v1/reports ────────────────────────────────────────
    if (req.method === 'POST') {
      const parsed = ForgeryReportSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed' });

      const { securityNumber, details } = parsed.data;
      const reportedIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';

      await db.insert(forgeryReports).values({ id: crypto.randomUUID(), securityNumber, details, reportedIp, status: 'pending' });
      return res.status(201).json({ success: true, data: { message: 'Report submitted successfully' } });
    }

    // ── ADMIN: GET/PUT/DELETE ───────────────────────────────────────────────
    // For admin operations, we must verify authentication
    await withAuth(req, res, async () => {
      const { id } = req.query;

      if (req.method === 'GET') {
        const { page, limit, offset, search } = parsePagination(req.query, [], 'createdAt');
        const { status } = req.query;
        const conditions = [];
        if (status && ['pending', 'reviewed', 'dismissed'].includes(status)) conditions.push(eq(forgeryReports.status, status));
        if (search) conditions.push(like(forgeryReports.securityNumber, `%${search}%`));
        const where = conditions.length > 0 ? conditions.reduce((a, b) => sql`${a} AND ${b}`) : undefined;
        const [{ total }] = await db.select({ total: sql`COUNT(*)` }).from(forgeryReports).where(where);
        const data = await db.select().from(forgeryReports).where(where).orderBy(desc(forgeryReports.createdAt)).limit(limit).offset(offset);
        return res.status(200).json({ success: true, ...buildPaginatedResponse(data, Number(total), page, limit) });
      }

      if (req.method === 'PUT') {
        if (!id) return res.status(400).json({ success: false, message: 'ID required' });
        const parsed = UpdateReportSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed' });
        const [updated] = await db.update(forgeryReports).set({ status: parsed.data.status, reviewedAt: parsed.data.status !== 'pending' ? new Date() : null }).where(eq(forgeryReports.id, id)).returning();
        if (!updated) return res.status(404).json({ success: false, message: 'Report not found' });
        return res.status(200).json({ success: true, data: updated });
      }

      return res.status(405).json({ success: false, message: 'Method not allowed' });
    });
  }
);
