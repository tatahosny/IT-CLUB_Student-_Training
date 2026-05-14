const prisma = require('../config/db');

/**
 * Device fingerprint guard + cheating detection
 * Detects: same device fingerprint logging into multiple accounts, then attempting attendance
 */
const deviceGuard = async (req, res, next) => {
  try {
    const fingerprint = req.headers['x-device-fingerprint'] || req.body.fingerprint;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userId = req.user?.id;

    if (!fingerprint || !userId) return next();

    // Check if this fingerprint is registered to a DIFFERENT user
    const existingDevice = await prisma.deviceTracking.findFirst({
      where: {
        fingerprint,
        NOT: { user_id: userId },
      },
      include: { user: { include: { role: true } } },
    });

    if (existingDevice && existingDevice.user.role.role_name === 'student') {
      // Potential fraud: same device, different account
      const suspectUserId = existingDevice.user_id;

      // Log security event for both accounts
      await prisma.securityLog.createMany({
        data: [
          {
            user_id: userId,
            device_id: fingerprint,
            ip_address: ipAddress,
            action_type: 'fraud',
            description: `Device fingerprint ${fingerprint} already registered to user ${suspectUserId}`,
          },
          {
            user_id: suspectUserId,
            device_id: fingerprint,
            ip_address: ipAddress,
            action_type: 'fraud',
            description: `Device fingerprint ${fingerprint} used by user ${userId}`,
          },
        ],
      });

      // Attach fraud info to request for attendance controller to handle
      req.fraudDetected = {
        currentUserId: userId,
        suspectUserId,
        fingerprint,
      };
    }

    // Upsert device tracking
    await prisma.deviceTracking.upsert({
      where: { user_id_fingerprint: { user_id: userId, fingerprint } },
      update: { ip_address: ipAddress, last_login: new Date() },
      create: {
        user_id: userId,
        fingerprint,
        device_name: req.headers['user-agent']?.substring(0, 100),
        browser: req.headers['user-agent']?.substring(0, 50),
        ip_address: ipAddress,
      },
    });

    next();
  } catch (error) {
    console.error('DeviceGuard error:', error);
    next(); // Don't block on device guard errors
  }
};

module.exports = deviceGuard;
