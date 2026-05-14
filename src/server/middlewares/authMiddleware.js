const { verifyAccessToken } = require('../config/jwt');
const prisma = require('../config/db');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.is_blocked) {
      const now = new Date();
      if (user.blocked_until && user.blocked_until > now) {
        return res.status(403).json({
          success: false,
          message: `You are blocked until ${user.blocked_until.toISOString()}. Reason: attendance fraud.`,
        });
      } else {
        // Auto-unblock if time expired
        await prisma.user.update({
          where: { id: user.id },
          data: { is_blocked: false, blocked_until: null },
        });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
