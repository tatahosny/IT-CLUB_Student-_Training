const prisma = require('../config/db');

// ─── GET TASKS ────────────────────────────────────────────
const getTasks = async (req, res) => {
  try {
    const role = req.user.role.role_name;
    const where = {};
    if (role === 'student') where.is_active = true;
    else if (role === 'instructor') where.instructor_id = req.user.id;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        instructor: { select: { id: true, full_name: true } },
        criteria: true,
        _count: { select: { submissions: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── CREATE TASK ──────────────────────────────────────────
const createTask = async (req, res) => {
  try {
    const { title, description, deadline, max_files, allowed_types, total_marks, criteria } = req.body;
    const task = await prisma.task.create({
      data: {
        instructor_id: req.user.id,
        title,
        description,
        deadline: new Date(deadline),
        max_files: parseInt(max_files) || 3,
        allowed_types: allowed_types || ['pdf', 'zip', 'jpg'],
        total_marks: parseInt(total_marks) || 100,
        criteria: criteria ? {
          create: criteria.map((c) => ({ title: c.title, max_grade: parseFloat(c.max_grade) })),
        } : undefined,
      },
      include: { criteria: true },
    });
    await prisma.activityLog.create({
      data: { user_id: req.user.id, action: 'create_task', description: `Created task: ${title}` },
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── UPDATE TASK ──────────────────────────────────────────
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: req.body,
      include: { criteria: true },
    });
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── DELETE TASK ──────────────────────────────────────────
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── SUBMIT TASK ──────────────────────────────────────────
const submitTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const studentId = req.user.id;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const task = await prisma.task.findUnique({ 
      where: { id: parseInt(taskId) },
      include: { submissions: { where: { student_id: studentId } } }
    });

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (new Date() > task.deadline) {
      return res.status(400).json({ success: false, message: 'Task deadline has passed' });
    }

    const existingSubmission = task.submissions[0];
    const existingCount = existingSubmission ? existingSubmission.uploaded_files.length : 0;
    
    if (existingCount + req.files.length > task.max_files) {
      return res.status(400).json({ success: false, message: `Total files would exceed limit of ${task.max_files}` });
    }

    const newFilePaths = req.files.map(file => file.path);
    const finalFilePaths = existingSubmission ? [...existingSubmission.uploaded_files, ...newFilePaths] : newFilePaths;

    const submission = await prisma.taskSubmission.upsert({
      where: { task_id_student_id: { task_id: parseInt(taskId), student_id: studentId } },
      update: { uploaded_files: finalFilePaths, submitted_at: new Date(), status: 'pending' },
      create: { task_id: parseInt(taskId), student_id: studentId, uploaded_files: finalFilePaths },
    });

    res.json({ success: true, data: submission });
  } catch (error) {
    console.error('Submission Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// ─── GET TASK SUBMISSIONS ─────────────────────────────────
const getTaskSubmissions = async (req, res) => {
  try {
    const { taskId } = req.params;
    const submissions = await prisma.taskSubmission.findMany({
      where: { task_id: parseInt(taskId) },
      include: {
        student: { select: { id: true, full_name: true, academic_number: true, group: true } },
        grade: { include: { details: { include: { criteria: true } } } },
      },
      orderBy: { submitted_at: 'desc' },
    });
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET MY SUBMISSIONS ───────────────────────────────────
const getMySubmissions = async (req, res) => {
  try {
    const submissions = await prisma.taskSubmission.findMany({
      where: { student_id: req.user.id },
      include: {
        task: { include: { instructor: { select: { full_name: true } }, criteria: true } },
        grade: { include: { details: { include: { criteria: true } }, mentor: { select: { full_name: true } } } },
      },
      orderBy: { submitted_at: 'desc' },
    });
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── DELETE SUBMISSION FILE ───────────────────────────────
const deleteSubmissionFile = async (req, res) => {
  try {
    const { taskId, fileName } = req.params;
    const studentId = req.user.id;

    const submission = await prisma.taskSubmission.findUnique({
      where: { task_id_student_id: { task_id: parseInt(taskId), student_id: studentId } }
    });

    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
    if (submission.status === 'reviewed') return res.status(400).json({ success: false, message: 'Cannot edit graded submission' });

    const updatedFiles = submission.uploaded_files.filter(f => !f.endsWith(fileName));
    
    const updated = await prisma.taskSubmission.update({
      where: { id: submission.id },
      data: { uploaded_files: updatedFiles }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, submitTask, getTaskSubmissions, getMySubmissions, deleteSubmissionFile };
