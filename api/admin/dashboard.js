import { getGeneralStats, getSuspiciousActivity } from '../../lib/services/log.service.js';
import { success, error } from '../../lib/utils/responseHelper.js';
import { authenticate } from '../../lib/middleware/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json(error('Method not allowed'));

  try {
    // Authenticate admin
    const auth = await authenticate(req);
    if (!auth.authenticated) return res.status(401).json(error('Unauthorized'));

    const stats = await getGeneralStats();
    const suspicious = await getSuspiciousActivity(5);

    return res.status(200).json(success({ stats, suspicious }));
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json(error('Internal server error'));
  }
}
