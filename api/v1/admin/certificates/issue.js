import { issueCertificate } from '../../../../lib/services/certificate.service.js';
import { compose } from '../../../../lib/middleware/compose.js';
import { withRateLimit } from '../../../../lib/middleware/rateLimit.js';
import { withAuth } from '../../../../lib/middleware/auth.js';
import { withValidation } from '../../../../lib/middleware/validate.js';
import { IssueCertificateSchema } from '../../../../lib/validation/certificate.schema.js';

export default compose(
  withRateLimit(30, 60_000),
  withAuth,
  withValidation(IssueCertificateSchema),
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
      const result = await issueCertificate(req.body);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ success: false, message: err.message });
    }
  }
);
