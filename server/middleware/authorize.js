// middleware/authorize.js

/**
 * Returns a middleware that checks if the authenticated user
 * has the given permission.
 */
export default function authorize(requiredPerm) {
  return (req, res, next) => {
    // req.user.permissions should have been set by authMiddleware
    const perms = req.user?.permissions || [];
    if (!perms.includes(requiredPerm)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
