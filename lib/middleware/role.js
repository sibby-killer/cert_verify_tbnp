export const withRole = (allowedRoles, handler) => async (req, res) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
  }
  return handler(req, res);
};
