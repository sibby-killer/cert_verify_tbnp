import { db } from '../../../../../lib/db/index.js';
import { certificates } from '../../../../../lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { compose } from '../../../../../lib/middleware/compose.js';
import { withRateLimit } from '../../../../../lib/middleware/rateLimit.js';
import { withAuth } from '../../../../../lib/middleware/auth.js';
import { withRole } from '../../../../../lib/middleware/role.js';
import { withValidation } from '../../../../../lib/middleware/validate.js';
import { RevokeCertificateSchema } from '../../../../../lib/validation/certificate.schema.js';

export default compose(
  withRateLimit(20, 60_000),
  withAuth,
  withRole(['superadmin']), // Only superadmin can revoke
  withValidation(RevokeCertificateSchema),
  async (req, res) => {
    if (req.method !== 'PUT') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: 'Certificate ID is required' });

    const [existing] = await db
      .select({ id: certificates.id, status: certificates.status })
      .from(certificates)
      .where(eq(certificates.id, id));

    if (!existing) return res.status(404).json({ success: false, message: 'Certificate not found' });
    if (existing.status === 'revoked') {
      return res.status(409).json({ success: false, message: 'Certificate is already revoked' });
    }

    const [updated] = await db
      .update(certificates)
      .set({
        status: 'revoked',
        revokedAt: new Date(),
        revokeReason: req.body.reason,
      })
      .where(eq(certificates.id, id))
      .returning();

    return res.status(200).json({ success: true, data: { certificate: updated } });
  }
);
