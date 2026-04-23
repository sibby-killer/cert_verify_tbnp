import { db } from '../../../../lib/db/index.js';
import { adminUsers } from '../../../../lib/db/schema.js';
import { desc, like, or, sql } from 'drizzle-orm';
import { compose } from '../../../../lib/middleware/compose.js';
import { withRateLimit } from '../../../../lib/middleware/rateLimit.js';
import { withAuth } from '../../../../lib/middleware/auth.js';
import { withRole } from '../../../../lib/middleware/role.js';
import { withValidation } from '../../../../lib/middleware/validate.js';
import { CreateUserSchema } from '../../../../lib/validation/user.schema.js';
import { hashPassword } from '../../../../lib/services/security.service.js';
import { parsePagination, buildPaginatedResponse } from '../../../../lib/utils/pagination.js';
import crypto from 'crypto';

export default compose(
  withRateLimit(30, 60_000),
  withAuth,
  withRole(['superadmin']),
  async (req, res) => {
    // ── GET /api/v1/admin/users ─────────────────────────────────────────────
    if (req.method === 'GET') {
      const { page, limit, offset, search } = parsePagination(req.query, ['username', 'createdAt'], 'createdAt');

      const where = search
        ? or(like(adminUsers.username, `%${search}%`), like(adminUsers.email, `%${search}%`))
        : undefined;

      const [{ total }] = await db.select({ total: sql`COUNT(*)` }).from(adminUsers).where(where);

      const data = await db
        .select({
          id: adminUsers.id,
          username: adminUsers.username,
          email: adminUsers.email,
          role: adminUsers.role,
          isActive: adminUsers.isActive,
          createdAt: adminUsers.createdAt,
        })
        .from(adminUsers)
        .where(where)
        .orderBy(desc(adminUsers.createdAt))
        .limit(limit)
        .offset(offset);

      return res.status(200).json({ success: true, ...buildPaginatedResponse(data, Number(total), page, limit) });
    }

    // ── POST /api/v1/admin/users ────────────────────────────────────────────
    if (req.method === 'POST') {
      const parsed = CreateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues.map(i => i.message) });
      }

      const { username, password, email, role } = parsed.data;
      const hashedPassword = await hashPassword(password);

      try {
        const [newUser] = await db
          .insert(adminUsers)
          .values({ id: crypto.randomUUID(), username, password: hashedPassword, email: email || null, role, isActive: true })
          .returning({ id: adminUsers.id, username: adminUsers.username, role: adminUsers.role });
        return res.status(201).json({ success: true, data: newUser });
      } catch (err) {
        if (err.message?.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ success: false, message: 'Username already exists' });
        }
        throw err;
      }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
);
