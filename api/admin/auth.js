import { db } from '../../lib/db/index.js';
import { adminUsers } from '../../lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { comparePassword, generateJWT } from '../../lib/services/security.service.js';
import { success, error, unauthorized } from '../../lib/utils/responseHelper.js';

export default async function handler(req, res) {
  const { url, method } = req;

  if (method === 'POST') {
    if (url.includes('/login')) {
      const { username, password } = req.body;
      const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));

      if (!user || !(await comparePassword(password, user.password))) {
        return unauthorized(res);
      }

      if (!user.isActive) return error(res, 'Account is deactivated', 403);

      const token = generateJWT({ id: user.id, username: user.username, role: user.role });
      return success(res, { token, user: { username: user.username, role: user.role } });
    }

    if (url.includes('/logout')) {
      return success(res, { message: 'Logged out' });
    }
  }

  return error(res, 'Invalid auth endpoint', 400);
}
