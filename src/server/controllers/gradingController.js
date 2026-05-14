const prisma = require('../config/db');

// ─── GRADE SUBMISSION ─────────────────────────────────────
const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { feedback, details } = req.body; // details: [{criteria_id, student_grade, notes}]
    const mentorId = req.user.id;

    // Calculate total grade from details
    const totalGrade = details.reduce((sum, d) => sum + parseFloat(d.student_grade), 0);

    const grade = await prisma.taskGrade.upsert({
      where: { submission_id: parseInt(submissionId) },
      update: {
        mentor_id: mentorId,
        reviewer_name: req.user.full_name,
        total_grade: totalGrade,
        feedback,
        graded_at: new Date(),
        details: {
          deleteMany: {},
          create: details.map((d) => ({
            criteria_id: parseInt(d.criteria_id),
            student_grade: parseFloat(d.student_grade),
            notes: d.notes,
          })),
        },
      },
      create: {
        submission_id: parseInt(submissionId),
        mentor_id: mentorId,
        reviewer_name: req.user.full_name,
        total_grade: totalGrade,
        feedback,
        details: {
          create: details.map((d) => ({
            criteria_id: parseInt(d.criteria_id),
            student_grade: parseFloat(d.student_grade),
            notes: d.notes,
          })),
        },
      },
      include: { details: { include: { criteria: true } } },
    });

    // Update submission status
    await prisma.taskSubmission.update({
      where: { id: parseInt(submissionId) },
      data: { status: 'reviewed' },
    });

    // Notify student
    const submission = await prisma.taskSubmission.findUnique({
      where: { id: parseInt(submissionId) },
      include: { task: true },
    });

    if (submission) {
      await prisma.notification.create({
        data: {
          user_id: submission.student_id,
          title: 'Task Graded',
          message: `Your submission for "${submission.task.title}" has been graded. Score: ${totalGrade}`,
        },
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user_${submission.student_id}`).emit('notification', {
          title: 'Task Graded',
          message: `Your submission for "${submission.task.title}" has been graded. Score: ${totalGrade}`,
        });
      }
    }

    res.json({ success: true, data: grade });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET GRADING QUEUE (Mentor) ───────────────────────────
const getGradingQueue = async (req, res) => {
  try {
    const submissions = await prisma.taskSubmission.findMany({
      where: { status: 'pending' },
      include: {
        task: {
          include: {
            criteria: true,
            instructor: { select: { full_name: true } },
          },
        },
        student: { select: { id: true, full_name: true, academic_number: true, group: true } },
      },
      orderBy: { submitted_at: 'asc' },
    });
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET SUBMISSION DETAIL ────────────────────────────────
const getSubmissionDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await prisma.taskSubmission.findUnique({
      where: { id: parseInt(id) },
      include: {
        task: { include: { criteria: true, instructor: { select: { full_name: true } } } },
        student: { select: { id: true, full_name: true, academic_number: true, group: true, avatar: true } },
        grade: {
          include: {
            details: { include: { criteria: true } },
            mentor: { select: { full_name: true } },
          },
        },
      },
    });

    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
    res.json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { gradeSubmission, getGradingQueue, getSubmissionDetail };
