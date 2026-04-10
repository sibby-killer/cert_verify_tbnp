import { issueCertificate } from '../../../lib/services/certificate.service.js';
import { success, error } from '../../../lib/utils/responseHelper.js';
import { authenticate } from '../../../lib/middleware/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json(error('Method not allowed'));

  try {
    const auth = await authenticate(req);
    if (!auth.authenticated) return res.status(401).json(error('Unauthorized'));

    const result = await issueCertificate(req.body);
    
    if (!result.success) {
      return res.status(400).json(error(result.message));
    }

    return res.status(201).json(success(result.data, 'Certificate issued successfully'));
  } catch (err) {
    console.error('Issue error:', err);
    return res.status(500).json(error('Internal server error'));
  }
}
