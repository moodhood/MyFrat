// src/middleware/requirePermission.js

/**
 * Middleware: ensure the current authenticated user has a given permission.
 * Expects authMiddleware to have already run, setting req.user.permissions.
 */
export default function requirePermission(permission) {
  return (req, res, next) => {
    const perms = req.user?.permissions;
    if (!Array.isArray(perms) || !perms.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}
