import { verifyJWT } from '../services/security.service.js';

export const withAuth = (handler) => async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyJWT(token);

  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }

  req.user = decoded;
  return handler(req, res);
};
