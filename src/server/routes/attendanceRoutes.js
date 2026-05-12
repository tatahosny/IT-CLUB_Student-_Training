const express = require('express');
const router = express.Router();
const {
  scanQR, getMyQR, getSessionAttendance, getStudentHistory, markAttendanceManual, getWorkshopQR
} = require('../controllers/attendanceController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const deviceGuard = require('../middlewares/deviceGuard');

router.use(authMiddleware);

router.post('/scan', deviceGuard, scanQR);
router.get('/my-qr/:sessionId', roleMiddleware('student'), deviceGuard, getMyQR);
router.get('/workshop-qr/:sessionId', roleMiddleware('super_admin', 'instructor', 'mentor_manager', 'mentor'), getWorkshopQR);
router.get('/session/:sessionId', roleMiddleware('super_admin', 'instructor', 'mentor_manager', 'mentor', 'oc'), getSessionAttendance);
router.get('/history', getStudentHistory);
router.get('/history/:studentId', roleMiddleware('super_admin', 'instructor'), getStudentHistory);
router.post('/manual', roleMiddleware('super_admin', 'instructor', 'oc'), markAttendanceManual);

module.exports = router;
