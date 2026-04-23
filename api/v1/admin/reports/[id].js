import { db } from '../../../../lib/db/index.js';
import { forgeryReports } from '../../../../lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { compose } from '../../../../lib/middleware/compose.js';
import { withRateLimit } from '../../../../lib/middleware/rateLimit.js';
import { withAuth } from '../../../../lib/middleware/auth.js';
import { withValidation } from '../../../../lib/middleware/validate.js';
import { UpdateReportSchema } from '../../../../lib/validation/report.schema.js';

export default compose(
  withRateLimit(30, 60_000),
  withAuth,
  withValidation(UpdateReportSchema),
  async (req, res) => {
    if (req.method !== 'PUT') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: 'Report ID is required' });

    const [existing] = await db.select({ id: forgeryReports.id }).from(forgeryReports).where(eq(forgeryReports.id, id));
    if (!existing) return res.status(404).json({ success: false, message: 'Report not found' });

    const updateData = {
      status: req.body.status,
      reviewedAt: req.body.status !== 'pending' ? new Date() : null,
    };

    const [updated] = await db
      .update(forgeryReports)
      .set(updateData)
      .where(eq(forgeryReports.id, id))
      .returning();

    return res.status(200).json({ success: true, data: updated });
  }
);
