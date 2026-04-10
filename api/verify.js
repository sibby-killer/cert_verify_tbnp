import { verifyCertificate } from '../lib/services/certificate.service.js';
import { logVerification } from '../lib/services/log.service.js';
import { success, error } from '../lib/utils/responseHelper.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json(error('Method not allowed'));

  try {
    const { cert } = req.query;
    if (!cert) return res.status(400).json(error('Certificate number is required'));

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const result = await verifyCertificate(cert);

    // Always log the attempt, even if invalid
    await logVerification({
      certificateId: result.success ? result.data.certificate.id : null,
      securityNumber: cert,
      status: result.success ? (result.data.certificate.status === 'valid' ? 'valid' : 'revoked') : 'invalid',
      ipAddress,
      userAgent: req.headers['user-agent']
    });

    if (!result.success) {
      return res.status(404).json(error('Certificate not found'));
    }

    return res.status(200).json(success(result.data));
  } catch (err) {
    console.error('Verification error:', err);
    return res.status(500).json(error('Internal server error'));
  }
}
