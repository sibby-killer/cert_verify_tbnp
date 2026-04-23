import { verifyJWT } from '../services/security.service.js';

/**
 * withAuth — validates the Bearer access token from the Authorization header.
 * Attaches decoded payload to req.user.
 */
export const withAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyJWT(token);

  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
  }

  req.user = decoded;
  return next();
};

/**
 * parseCookies — parses the Cookie header into a key/value map.
 */
export function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie;
  if (!header) return cookies;
  header.split(';').forEach((part) => {
    const [key, ...vals] = part.trim().split('=');
    if (key) cookies[key.trim()] = decodeURIComponent(vals.join('='));
  });
  return cookies;
}
