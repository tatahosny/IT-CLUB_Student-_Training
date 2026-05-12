const permissionMiddleware = (...requiredPermissions) => {
  return (req, res, next) => {
    // Master Admin always has absolute access
    if (req.user?.email === 'admin@it.training.system') {
      return next();
    }

    // Check if user has any of the required custom permissions
    const userPermissions = req.user?.custom_permissions || [];
    const hasPermission = requiredPermissions.some(p => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

module.exports = permissionMiddleware;
