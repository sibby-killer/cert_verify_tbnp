import { db } from '../../../lib/db/index.js';
import { institutions } from '../../../lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { compose } from '../../../lib/middleware/compose.js';
import { withRateLimit } from '../../../lib/middleware/rateLimit.js';
import { withAuth } from '../../../lib/middleware/auth.js';
import { withRole } from '../../../lib/middleware/role.js';
import { withValidation } from '../../../lib/middleware/validate.js';
import { InstitutionSchema } from '../../../lib/validation/report.schema.js';
import crypto from 'crypto';

export default compose(
  withRateLimit(30, 60_000),
  withAuth,
  async (req, res) => {
    // ── GET — any authenticated user can read institution details ───────────
    if (req.method === 'GET') {
      const [inst] = await db.select().from(institutions).limit(1);
      return res.status(200).json({ success: true, data: inst || null });
    }

    // ── PUT — only superadmin can update ────────────────────────────────────
    if (req.method === 'PUT') {
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({ success: false, message: 'Forbidden: superadmin required' });
      }

      const parsed = InstitutionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.issues.map(i => i.message) });
      }

      const [existing] = await db.select({ id: institutions.id }).from(institutions).limit(1);

      let result;
      if (existing) {
        [result] = await db
          .update(institutions)
          .set(parsed.data)
          .where(eq(institutions.id, existing.id))
          .returning();
      } else {
        [result] = await db
          .insert(institutions)
          .values({ id: crypto.randomUUID(), ...parsed.data })
          .returning();
      }

      return res.status(200).json({ success: true, data: result });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
);
