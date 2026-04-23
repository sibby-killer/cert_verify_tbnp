import { getDashboardStats, flagSuspicious } from '../../../lib/services/log.service.js';
import { compose } from '../../../lib/middleware/compose.js';
import { withRateLimit } from '../../../lib/middleware/rateLimit.js';
import { withAuth } from '../../../lib/middleware/auth.js';

export default compose(
  withRateLimit(60, 60_000),
  withAuth,
  async (req, res) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const [stats, suspicious] = await Promise.all([
      getDashboardStats(),
      flagSuspicious(),
    ]);

    return res.status(200).json({ success: true, data: { stats, suspicious } });
  }
);
