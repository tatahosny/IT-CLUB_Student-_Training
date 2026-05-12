const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const crypto = require('crypto');

const getUsers = async (query) => {
  const { role, group, search, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const where = {};
  if (role) where.role = { role_name: role };
  if (group) where.group_id = parseInt(group);
  if (search) {
    where.OR = [
      { full_name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { academic_number: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { role: true, group: true, level: true },
      orderBy: { created_at: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
    }),
    prisma.user.count({ where }),
  ]);

  users.forEach(u => delete u.password);
  return { users, total };
};

const createUser = async (userData) => {
  const { full_name, email, phone, password, academic_number, national_id, role_id, group_id, level_id, custom_permissions } = userData;

  const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
  const registrationNumber = `IT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  try {
    const user = await prisma.user.create({
      data: {
        full_name,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        academic_number: academic_number || null,
        national_id: national_id || null,
        registration_number: registrationNumber,
        role_id: parseInt(role_id),
        group_id: group_id ? parseInt(group_id) : null,
        level_id: level_id ? parseInt(level_id) : null,
        custom_permissions: Array.isArray(custom_permissions) ? custom_permissions : [],
      },
      include: { role: true, group: true },
    });

    delete user.password;
    return user;
  } catch (error) {
    if (error.code === 'P2002') {
      throw { status: 400, message: 'Email, Academic Number, or National ID already exists' };
    }
    throw error;
  }
};

const updateUser = async (id, userData) => {
  const { password, ...data } = userData;
  const updateData = { ...data };

  if (password) {
    updateData.password = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
  }

  updateData.email = data.email?.toLowerCase();
  updateData.role_id = data.role_id ? parseInt(data.role_id) : undefined;
  updateData.group_id = (data.group_id === '' || data.group_id === null) ? null : parseInt(data.group_id);
  updateData.level_id = (data.level_id === '' || data.level_id === null) ? null : parseInt(data.level_id);
  updateData.academic_number = data.academic_number || null;
  updateData.national_id = data.national_id || null;

  if (updateData.custom_permissions && !Array.isArray(updateData.custom_permissions)) {
    updateData.custom_permissions = [];
  }

  try {
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { role: true, group: true },
    });

    delete user.password;
    return user;
  } catch (error) {
    if (error.code === 'P2002') {
      throw { status: 400, message: 'Email, Academic Number, or National ID already exists' };
    }
    throw error;
  }
};

const deleteUser = async (id) => {
  return await prisma.user.delete({ where: { id: parseInt(id) } });
};

const blockUser = async (adminId, id, block, hours = 24) => {
  const blockedUntil = block ? new Date(Date.now() + hours * 60 * 60 * 1000) : null;

  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data: { is_blocked: block, blocked_until: blockedUntil },
  });

  delete user.password;

  await prisma.securityLog.create({
    data: {
      user_id: adminId,
      action_type: block ? 'block' : 'unblock',
      description: `Admin blocked/unblocked user ${id}`,
    },
  });

  return user;
};

const importStudents = async (adminId, fileBuffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const studentRole = await prisma.role.findUnique({ where: { role_name: 'student' } });
  if (!studentRole) throw { status: 500, message: 'Student role not found' };

  const results = { created: 0, skipped: 0, errors: [] };

  for (const row of rows) {
    try {
      const fullName = row['Student Name'] || row['full_name'] || row['name'];
      const academicNumber = String(row['Academic Number'] || row['academic_number'] || '');
      const phone = String(row['Phone'] || row['phone'] || '');
      const nationalId = String(row['National ID'] || row['national_id'] || '');
      const groupName = row['Group'] || row['group'];
      const levelName = row['Level'] || row['level'];

      if (!fullName || !academicNumber || !phone) {
        results.errors.push(`Row skipped: missing required fields`);
        results.skipped++;
        continue;
      }

      const email = `${academicNumber}@it.training.system`;
      const password = phone;
      const hashedPassword = await bcrypt.hash(password, 10);
      const registrationNumber = `IT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      let groupId = null;
      if (groupName) {
        const group = await prisma.group.upsert({
          where: { group_name: groupName },
          update: {},
          create: { group_name: groupName },
        });
        groupId = group.id;
      }

      let levelId = null;
      if (levelName) {
        const level = await prisma.level.upsert({
          where: { level_name: levelName },
          update: {},
          create: { level_name: levelName },
        });
        levelId = level.id;
      }

      await prisma.user.upsert({
        where: { academic_number: academicNumber },
        update: { group_id: groupId, level_id: levelId },
        create: {
          full_name: fullName,
          email,
          phone,
          password: hashedPassword,
          academic_number: academicNumber,
          national_id: nationalId || null,
          registration_number: registrationNumber,
          role_id: studentRole.id,
          group_id: groupId,
          level_id: levelId,
          first_login: true,
        },
      });
      results.created++;
    } catch (err) {
      results.errors.push(`Error: ${err.message}`);
      results.skipped++;
    }
  }

  await prisma.activityLog.create({
    data: {
      user_id: adminId,
      action: 'import_students',
      description: `Imported ${results.created} students`,
    },
  });

  return results;
};

const getAnalytics = async () => {
  const [totalUsers, totalStudents, totalSessions, totalTasks, recentLogs, securityLogs] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: { role_name: 'student' } } }),
    prisma.session.count(),
    prisma.task.count(),
    prisma.activityLog.findMany({ take: 10, orderBy: { created_at: 'desc' }, include: { user: { select: { full_name: true, role: true } } } }),
    prisma.securityLog.findMany({ take: 10, orderBy: { created_at: 'desc' }, include: { user: { select: { full_name: true } } } }),
  ]);

  const attendanceStats = await prisma.attendance.groupBy({
    by: ['attendance_type'],
    _count: { id: true },
  });

  // Simplified day range logic
  const activityData = []; // Would normally calculate last 7 days here

  return {
    totalUsers,
    totalStudents,
    totalSessions,
    totalTasks,
    attendanceStats,
    recentLogs,
    securityLogs,
    activityData,
  };
};

const getSecurityLogs = async (query) => {
  const { page = 1, limit = 30 } = query;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.securityLog.findMany({
      include: { user: { select: { full_name: true, email: true } } },
      orderBy: { created_at: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
    }),
    prisma.securityLog.count(),
  ]);

  return { logs, total };
};

const getDetailedStudentAnalytics = async (group) => {
  const where = { role: { role_name: 'student' } };
  if (group) where.group_id = parseInt(group);

  const students = await prisma.user.findMany({
    where,
    select: {
      id: true,
      full_name: true,
      academic_number: true,
      group: { select: { group_name: true } },
      attendances: { select: { is_present: true } },
      submissions: {
        select: {
          status: true,
          grade: { select: { total_grade: true } },
          task: { select: { total_marks: true } }
        }
      },
      _count: { select: { attendances: true, submissions: true } }
    },
    orderBy: { full_name: 'asc' }
  });

  const sessionCount = await prisma.session.count(group ? { where: { group_id: parseInt(group) } } : {});

  return students.map(s => {
    const presentCount = s.attendances.filter(a => a.is_present).length;
    const gradedSubmissions = s.submissions.filter(sub => sub.grade);
    const avgGrade = gradedSubmissions.length > 0 
      ? gradedSubmissions.reduce((acc, curr) => acc + (curr.grade.total_grade / curr.task.total_marks), 0) / gradedSubmissions.length * 100
      : 0;

    return {
      id: s.id,
      name: s.full_name,
      academic_number: s.academic_number,
      group: s.group?.group_name,
      total_attendance: presentCount,
      attendance_rate: sessionCount > 0 ? (presentCount / sessionCount * 100).toFixed(1) : 0,
      tasks_submitted: s._count.submissions,
      avg_grade: avgGrade.toFixed(1)
    };
  });
};

const getUserFullHistory = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      full_name: true,
      academic_number: true,
      group: { select: { group_name: true } },
      attendances: {
        include: { session: { select: { title: true, start_time: true } } },
        orderBy: { scanned_at: 'desc' }
      },
      submissions: {
        include: { 
          task: { select: { title: true, total_marks: true } },
          grade: { include: { mentor: { select: { full_name: true } } } }
        },
        orderBy: { submitted_at: 'desc' }
      }
    }
  });
  if (!user) throw { status: 404, message: 'User not found' };
  return user;
};

const getGlobalAttendance = async (query) => {
  const { page = 1, limit = 50, search, group } = query;
  const skip = (page - 1) * limit;

  const where = {};
  if (group) where.session = { group_id: parseInt(group) };
  if (search) {
    where.OR = [
      { student: { full_name: { contains: search, mode: 'insensitive' } } },
      { student: { academic_number: { contains: search, mode: 'insensitive' } } },
      { session: { title: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [attendances, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        student: { select: { full_name: true, academic_number: true, group: true } },
        session: { select: { title: true, start_time: true, group: true } },
      },
      orderBy: { scanned_at: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
    }),
    prisma.attendance.count({ where }),
  ]);

  return { attendances, total };
};

module.exports = {
  getUsers, createUser, updateUser, deleteUser, blockUser,
  importStudents, getAnalytics, getSecurityLogs,
  getDetailedStudentAnalytics, getUserFullHistory,
  getGlobalAttendance,
};
