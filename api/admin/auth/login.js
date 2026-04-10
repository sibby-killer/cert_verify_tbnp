import { db } from '../../../lib/db/index.js';
import { adminUsers } from '../../../lib/db/schema.js';
import { loginAdmin } from '../../../lib/services/security.service.js';
import { eq } from 'drizzle-orm';
import { success, error } from '../../../lib/utils/responseHelper.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json(error('Method not allowed'));

  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json(error('Username and password are required'));
    }

    const result = await loginAdmin(username, password);
    
    if (!result.success) {
      return res.status(401).json(error(result.message));
    }

    return res.status(200).json(success(result.data, 'Login successful'));
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json(error('Internal server error'));
  }
}
