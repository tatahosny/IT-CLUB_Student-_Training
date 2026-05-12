const express = require('express');
const router = express.Router();
const {
  getSessions, createSession, updateSession, deleteSession,
  openAttendanceWindow, closeAttendanceWindow, generateSessionQR, getSessionById,
} = require('../controllers/sessionController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

router.get('/', getSessions);
router.get('/:id', getSessionById);
router.post('/', permissionMiddleware('can_create_sessions'), createSession);
router.put('/:id', permissionMiddleware('can_edit_sessions'), updateSession);
router.delete('/:id', permissionMiddleware('can_delete_sessions'), deleteSession);
router.post('/:id/attendance/open', roleMiddleware('super_admin', 'instructor', 'oc'), openAttendanceWindow);
router.post('/:id/attendance/close', roleMiddleware('super_admin', 'instructor', 'oc'), closeAttendanceWindow);
router.post('/:id/qr', roleMiddleware('super_admin', 'instructor', 'mentor_manager'), generateSessionQR);

module.exports = router;
