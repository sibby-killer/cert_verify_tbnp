import { db } from '../../lib/db/index.js';
import { students } from '../../lib/db/schema.js';
import { success, error } from '../../lib/utils/responseHelper.js';
import { authenticate } from '../../lib/middleware/auth.js';

export default async function handler(req, res) {
  try {
    const auth = await authenticate(req);
    if (!auth.authenticated) return res.status(401).json(error('Unauthorized'));

    if (req.method === 'GET') {
      const data = await db.select().from(students);
      return res.status(200).json(success(data));
    }
    
    return res.status(405).json(error('Method not allowed'));
  } catch (err) {
    console.error('students error:', err);
    return res.status(500).json(error('Internal server error'));
  }
}

