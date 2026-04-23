import { db } from '../lib/db/index.js';
import { certificates } from '../lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAllCertificates, issueCertificate } from '../lib/services/certificate.service.js';
import { compose } from '../lib/middleware/compose.js';
import { withRateLimit } from '../lib/middleware/rateLimit.js';
import { withAuth } from '../lib/middleware/auth.js';
import { IssueCertificateSchema, RevokeCertificateSchema } from '../lib/validation/certificate.schema.js';

export default compose(
  withRateLimit(60, 60_000),
  withAuth,
  async (req, res) => {
    const { id, action } = req.query;

    switch (req.method) {
      case 'GET': {
        const result = await getAllCertificates(req.query);
        return res.status(200).json({ success: true, ...result });
      }

      case 'POST': {
        // action=issue
        if (action !== 'issue') return res.status(400).json({ success: false, message: 'Invalid action' });
        const parsed = IssueCertificateSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed' });
        try {
          const result = await issueCertificate(parsed.data);
          return res.status(201).json({ success: true, data: result });
        } catch (err) {
          return res.status(err.status || 500).json({ success: false, message: err.message });
        }
      }

      case 'PUT': {
        // action=revoke, needs id
        if (action !== 'revoke' || !id) return res.status(400).json({ success: false, message: 'ID and action=revoke required' });
        if (req.user.role !== 'superadmin') return res.status(403).json({ success: false, message: 'Forbidden' });
        
        const parsed = RevokeCertificateSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed' });

        const [existing] = await db.select({ id: certificates.id, status: certificates.status }).from(certificates).where(eq(certificates.id, id));
        if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
        if (existing.status === 'revoked') return res.status(409).json({ success: false, message: 'Already revoked' });

        const [updated] = await db.update(certificates).set({ status: 'revoked', revokedAt: new Date(), revokeReason: parsed.data.reason }).where(eq(certificates.id, id)).returning();
        return res.status(200).json({ success: true, data: { certificate: updated } });
      }

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  }
);
