import { db } from '../../../../lib/db/index.js';
import { adminUsers } from '../../../../lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { compose } from '../../../../lib/middleware/compose.js';
import { withRateLimit } from '../../../../lib/middleware/rateLimit.js';
import { withAuth } from '../../../../lib/middleware/auth.js';
import { withRole } from '../../../../lib/middleware/role.js';
import { UpdateUserSchema } from '../../../../lib/validation/user.schema.js';

export default compose(
  withRateLimit(20, 60_000),
  withAuth,
  withRole(['superadmin']),
  async (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: 'User ID is required' });

    // Prevent superadmin from deactivating themselves
    if (id === req.user.id && req.body?.isActive === false) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    if (req.method === 'PUT') {
      const parsed = UpdateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues.map(i => i.message) });
      }
      const [updated] = await db
        .update(adminUsers)
        .set(parsed.data)
        .where(eq(adminUsers.id, id))
        .returning({ id: adminUsers.id, username: adminUsers.username, role: adminUsers.role, isActive: adminUsers.isActive });
      if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
      return res.status(200).json({ success: true, data: updated });
    }

    if (req.method === 'DELETE') {
      if (id === req.user.id) {
        return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
      }
      const [existing] = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.id, id));
      if (!existing) return res.status(404).json({ success: false, message: 'User not found' });
      await db.delete(adminUsers).where(eq(adminUsers.id, id));
      return res.status(200).json({ success: true, data: { message: 'User deleted' } });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
);
