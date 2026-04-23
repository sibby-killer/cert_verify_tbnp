import { db } from '../lib/db/index.js';
import { adminUsers } from '../lib/db/schema.js';
import { eq, desc, asc, sql } from 'drizzle-orm';
import { compose } from '../lib/middleware/compose.js';
import { withRateLimit } from '../lib/middleware/rateLimit.js';
import { withAuth } from '../lib/middleware/auth.js';
import { CreateUserSchema, UpdateUserSchema } from '../lib/validation/user.schema.js';
import { hashPassword } from '../lib/services/security.service.js';
import { parsePagination, buildPaginatedResponse } from '../lib/utils/pagination.js';
import crypto from 'crypto';

const SORTABLE = ['username', 'createdAt'];

export default compose(
  withRateLimit(60, 60_000),
  withAuth,
  async (req, res) => {
    // Only superadmin can manage users
    if (req.user.role !== 'superadmin') return res.status(403).json({ success: false, message: 'Forbidden' });

    const { id } = req.query;

    switch (req.method) {
      case 'GET': {
        if (id) {
          const [user] = await db.select({ id: adminUsers.id, username: adminUsers.username, email: adminUsers.email, role: adminUsers.role, isActive: adminUsers.isActive, createdAt: adminUsers.createdAt }).from(adminUsers).where(eq(adminUsers.id, id));
          if (!user) return res.status(404).json({ success: false, message: 'User not found' });
          return res.status(200).json({ success: true, data: user });
        }
        const { page, limit, offset, sort, order } = parsePagination(req.query, SORTABLE, 'username');
        const [{ total }] = await db.select({ total: sql`COUNT(*)` }).from(adminUsers);
        const sortCol = adminUsers[sort] || adminUsers.username;
        const data = await db.select({ id: adminUsers.id, username: adminUsers.username, email: adminUsers.email, role: adminUsers.role, isActive: adminUsers.isActive, createdAt: adminUsers.createdAt }).from(adminUsers).orderBy(order === 'asc' ? asc(sortCol) : desc(sortCol)).limit(limit).offset(offset);
        return res.status(200).json({ success: true, ...buildPaginatedResponse(data, Number(total), page, limit) });
      }

      case 'POST': {
        const parsed = CreateUserSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed' });
        const { username, password, email, role } = parsed.data;
        const hashedPassword = await hashPassword(password);
        const [user] = await db.insert(adminUsers).values({ id: crypto.randomUUID(), username, password: hashedPassword, email: email || null, role, isActive: true }).returning({ id: adminUsers.id, username: adminUsers.username, role: adminUsers.role });
        return res.status(201).json({ success: true, data: user });
      }

      case 'PUT': {
        if (!id) return res.status(400).json({ success: false, message: 'ID required' });
        const parsed = UpdateUserSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed' });
        const updateData = { ...parsed.data };
        if (updateData.password) updateData.password = await hashPassword(updateData.password);
        const [updated] = await db.update(adminUsers).set(updateData).where(eq(adminUsers.id, id)).returning({ id: adminUsers.id, username: adminUsers.username, role: adminUsers.role });
        if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
        return res.status(200).json({ success: true, data: updated });
      }

      case 'DELETE': {
        if (!id) return res.status(400).json({ success: false, message: 'ID required' });
        if (id === req.user.id) return res.status(400).json({ success: false, message: 'Cannot delete self' });
        await db.delete(adminUsers).where(eq(adminUsers.id, id));
        return res.status(200).json({ success: true, data: { message: 'User deleted' } });
      }

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  }
);
