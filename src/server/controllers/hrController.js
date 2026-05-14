const prisma = require('../config/db');

const getSubmissionStats = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        _count: {
          select: { submissions: true }
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                full_name: true,
                academic_number: true,
                group: { select: { group_name: true } }
              }
            },
            grade: {
              select: {
                total_grade: true,
                reviewer_name: true,
                graded_at: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getGradingLogs = async (req, res) => {
  try {
    const logs = await prisma.taskGrade.findMany({
      include: {
        mentor: {
          select: { full_name: true, role: { select: { role_name: true } } }
        },
        submission: {
          include: {
            student: {
              select: { full_name: true, academic_number: true }
            },
            task: {
              select: { title: true }
            }
          }
        }
      },
      orderBy: { graded_at: 'desc' },
      take: 100
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getEngagementStats = async (req, res) => {
  try {
    // Basic engagement: Total students, Average attendance, Average submissions
    const totalStudents = await prisma.user.count({
      where: { role: { role_name: 'student' } }
    });

    const totalSubmissions = await prisma.taskSubmission.count();
    const totalAttendances = await prisma.attendance.count({
      where: { is_present: true }
    });

    // Submissions per task
    const tasks = await prisma.task.findMany({
      select: {
        title: true,
        _count: { select: { submissions: true } }
      }
    });

    // Attendance per session
    const sessions = await prisma.session.findMany({
      select: {
        title: true,
        _count: { select: { attendances: { where: { is_present: true } } } }
      },
      take: 10,
      orderBy: { start_time: 'desc' }
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        totalSubmissions,
        totalAttendances,
        avgSubmissions: totalStudents ? (totalSubmissions / totalStudents).toFixed(2) : 0,
        taskSubmissions: tasks,
        sessionAttendances: sessions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getSubmissionStats,
  getGradingLogs,
  getEngagementStats
};
