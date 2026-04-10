import { verifyJWT } from '../services/security.service.js';

export const authenticate = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false };
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyJWT(token);

  if (!decoded) {
    return { authenticated: false };
  }

  return { authenticated: true, user: decoded };
};

export const withAuth = (handler) => async (req, res) => {
  const auth = await authenticate(req);
  if (!auth.authenticated) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  req.user = auth.user;
  return handler(req, res);
};
