import { db } from '../../../lib/db/index.js';
import { adminUsers } from '../../../lib/db/schema.js';
import { hashPassword } from '../../../lib/services/security.service.js';
import { compose } from '../../../lib/middleware/compose.js';
import { withRateLimit } from '../../../lib/middleware/rateLimit.js';
import { withValidation } from '../../../lib/middleware/validate.js';
import { SetupSchema } from '../../../lib/validation/auth.schema.js';
import crypto from 'crypto';

export default compose(
  withRateLimit(5, 60_000), // Very strict — setup should only happen once
  withValidation(SetupSchema),
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Only allow setup if no admin users exist
    const existing = await db.select({ id: adminUsers.id }).from(adminUsers).limit(1);
    if (existing.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Setup already completed. Please log in.',
      });
    }

    const { username, password, email } = req.body;
    const hashedPassword = await hashPassword(password);

    const [newUser] = await db
      .insert(adminUsers)
      .values({
        id: crypto.randomUUID(),
        username,
        password: hashedPassword,
        email: email || null,
        role: 'superadmin',
        isActive: true,
      })
      .returning({ id: adminUsers.id, username: adminUsers.username, role: adminUsers.role });

    return res.status(201).json({
      success: true,
      data: { message: 'Super admin created successfully', user: newUser },
    });
  }
);
