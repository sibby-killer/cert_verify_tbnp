/**
 * withRole(allowedRoles) — returns a middleware that enforces role-based access.
 * Must be placed after withAuth so req.user is populated.
 *
 * Usage: compose(withAuth, withRole(['superadmin']), handler)
 */
export const withRole = (allowedRoles) => async (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Forbidden: requires one of [${allowedRoles.join(', ')}]`,
    });
  }
  return next();
};
