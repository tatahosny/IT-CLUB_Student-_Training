const express = require('express');
const router = express.Router();
const {
  getSubmissionStats,
  getGradingLogs,
  getEngagementStats
} = require('../controllers/hrController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware('super_admin', 'hr'));

router.get('/submission-stats', getSubmissionStats);
router.get('/grading-logs', getGradingLogs);
router.get('/engagement-stats', getEngagementStats);

module.exports = router;
