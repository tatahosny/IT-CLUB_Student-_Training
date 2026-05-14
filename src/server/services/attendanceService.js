const prisma = require('../config/db');

const scanQR = async (userId, qrCode, ip, userAgent) => {
  // Logic from attendanceController
  // ...
};

const getHistory = async (userId) => {
  return await prisma.attendance.findMany({
    where: { student_id: userId },
    include: { session: true },
    orderBy: { scanned_at: 'desc' },
  });
};

module.exports = { scanQR, getHistory };
