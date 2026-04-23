import { db } from '../../lib/db/index.js';
import { forgeryReports } from '../../lib/db/schema.js';
import { compose } from '../../lib/middleware/compose.js';
import { withRateLimit } from '../../lib/middleware/rateLimit.js';
import { withValidation } from '../../lib/middleware/validate.js';
import { ForgeryReportSchema } from '../../lib/validation/report.schema.js';
import crypto from 'crypto';

export default compose(
  withRateLimit(5, 60_000), // Very strict — prevent abuse
  withValidation(ForgeryReportSchema),
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { securityNumber, details } = req.body;
    const reportedIp =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    await db.insert(forgeryReports).values({
      id: crypto.randomUUID(),
      securityNumber,
      details,
      reportedIp,
      status: 'pending',
    });

    return res.status(201).json({ success: true, data: { message: 'Report submitted successfully' } });
  }
);
