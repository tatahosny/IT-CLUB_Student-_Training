/**
 * Role-based access control middleware
 * Usage: roleMiddleware('super_admin', 'instructor')
 */
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!allowedRoles.includes(req.user.role.role_name)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
