const express = require('express');
const router = express.Router();
const {
  getTasks, createTask, updateTask, deleteTask, submitTask, getTaskSubmissions, getMySubmissions, deleteSubmissionFile,
} = require('../controllers/taskController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { uploadTaskFiles } = require('../config/multer');

router.use(authMiddleware);

router.get('/', getTasks);
router.post('/', roleMiddleware('super_admin', 'instructor'), createTask);
router.put('/:id', roleMiddleware('super_admin', 'instructor'), updateTask);
router.delete('/:id', roleMiddleware('super_admin', 'instructor'), deleteTask);
router.post('/:taskId/submit', roleMiddleware('student'), uploadTaskFiles.array('files', 10), submitTask);
router.get('/my/submissions', roleMiddleware('student'), getMySubmissions);
router.get('/:taskId/submissions', roleMiddleware('super_admin', 'instructor', 'mentor', 'mentor_manager', 'hr'), getTaskSubmissions);
router.delete('/:taskId/submissions/files/:fileName', roleMiddleware('student'), deleteSubmissionFile);

module.exports = router;
