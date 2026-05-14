const express = require('express');
const router = express.Router();
const {
  getUsers, createUser, updateUser, deleteUser, blockUser,
  importStudents, downloadTemplate, getAnalytics, getSecurityLogs, getActivityLogs,
  getGroups, createGroup, getNotifications, markNotificationRead,
  getLevels, getRoles, getDetailedStudentAnalytics, getUserFullHistory,
  getGlobalAttendance, logActivity,
} = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { uploadExcel, uploadAvatar } = require('../config/multer');

router.use(authMiddleware);

// Analytics
router.get('/analytics', roleMiddleware('super_admin', 'instructor', 'hr'), getAnalytics);
router.get('/detailed-analytics', roleMiddleware('super_admin', 'instructor', 'hr'), getDetailedStudentAnalytics);
router.get('/attendance', roleMiddleware('super_admin', 'hr'), getGlobalAttendance);
router.get('/security-logs', roleMiddleware('super_admin'), getSecurityLogs);
router.get('/activity-logs', roleMiddleware('super_admin'), getActivityLogs);

// Users
router.get('/users', roleMiddleware('super_admin', 'instructor'), getUsers);
router.post('/users', roleMiddleware('super_admin'), createUser);
router.put('/users/:id', roleMiddleware('super_admin'), updateUser);
router.delete('/users/:id', roleMiddleware('super_admin'), deleteUser);
router.post('/users/:id/block', roleMiddleware('super_admin'), blockUser);
router.get('/users/:id/history', roleMiddleware('super_admin'), getUserFullHistory);

// Excel Import
router.get('/users/template', downloadTemplate);
router.post('/users/import', roleMiddleware('super_admin'), uploadExcel.single('file'), importStudents);

// Groups & Levels
router.get('/groups', getGroups);
router.post('/groups', roleMiddleware('super_admin'), createGroup);
router.get('/levels', getLevels);
router.get('/roles', getRoles);

// Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

// Activity Logging
router.post('/log', logActivity);

module.exports = router;
