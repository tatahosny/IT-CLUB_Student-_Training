const express = require('express');
const router = express.Router();
const { gradeSubmission, getGradingQueue, getSubmissionDetail } = require('../controllers/gradingController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware('super_admin', 'instructor', 'mentor', 'mentor_manager'));

router.get('/queue', getGradingQueue);
router.get('/submission/:id', getSubmissionDetail);
router.post('/submission/:submissionId', gradeSubmission);

module.exports = router;
