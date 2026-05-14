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

  if (!role_id || isNaN(parseInt(role_id))) {
    throw { status: 400, message: 'Role is required' };
  }

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

  if (updateData.role_id !== undefined && (isNaN(parseInt(updateData.role_id)) || !updateData.role_id)) {
    throw { status: 400, message: 'Invalid Role selected' };
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

  // Helper to get value from row with multiple possible header names
  const getValue = (row, possibilities) => {
    const key = Object.keys(row).find(k => 
      possibilities.some(p => k.toLowerCase().trim() === p.toLowerCase().trim())
    );
    return key ? row[key] : null;
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const fullName = getValue(row, ['Student Name', 'full_name', 'name', 'Student']);
      let academicNumber = getValue(row, ['Academic Number', 'academic_number', 'id', 'academic_id']);
      let phone = getValue(row, ['Phone', 'phone_number', 'mobile']);
      const nationalId = getValue(row, ['National ID', 'national_id', 'id_number']);
      const groupName = getValue(row, ['Group', 'group_name', 'class']);
      const levelName = getValue(row, ['Level', 'level_name', 'grade']);

      // Convert numbers to strings and trim
      academicNumber = academicNumber ? String(academicNumber).trim() : '';
      phone = phone ? String(phone).trim() : '';

      if (!fullName || !academicNumber || !phone) {
        results.errors.push(`Row ${i + 2}: Missing required fields (Name: ${fullName||'N/A'}, Academic #: ${academicNumber||'N/A'}, Phone: ${phone||'N/A'})`);
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
          where: { group_name: String(groupName).trim() },
          update: {},
          create: { group_name: String(groupName).trim() },
        });
        groupId = group.id;
      }

      let levelId = null;
      if (levelName) {
        const level = await prisma.level.upsert({
          where: { level_name: String(levelName).trim() },
          update: {},
          create: { level_name: String(levelName).trim() },
        });
        levelId = level.id;
      }

      await prisma.user.upsert({
        where: { academic_number: academicNumber },
        update: { 
          group_id: groupId || undefined, 
          level_id: levelId || undefined,
          phone: phone, 
          full_name: fullName,
          role_id: studentRole.id // Ensure they are always student role
        },
        create: {
          full_name: fullName,
          email,
          phone,
          password: hashedPassword,
          academic_number: academicNumber,
          national_id: nationalId ? String(nationalId).trim() : null,
          registration_number: registrationNumber,
          role_id: studentRole.id,
          group_id: groupId,
          level_id: levelId,
          first_login: true,
        },
      });
      results.created++;
    } catch (err) {
      results.errors.push(`Row ${i + 2} (${getValue(row, ['Student Name', 'name']) || 'Unknown'}): ${err.message}`);
      results.skipped++;
    }
  }

  await prisma.activityLog.create({
    data: {
      user_id: adminId,
      action: 'import_students',
      description: `Imported ${results.created} students, skipped ${results.skipped}`,
    },
  });

  return results;
};

const getAnalytics = async (requestingUser) => {
  const logFilter = requestingUser?.email === 'admin@it.training.system' 
    ? {} 
    : { user: { NOT: { email: 'admin@it.training.system' } } };

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [totalUsers, totalStudents, totalSessions, totalTasks, recentLogs, securityLogs, activeSessionsList, roles, activityRaw] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: { role_name: 'student' } } }),
    prisma.session.count(),
    prisma.task.count(),
    prisma.activityLog.findMany({ 
      where: logFilter,
      take: 15, 
      orderBy: { created_at: 'desc' }, 
      include: { user: { select: { full_name: true, email: true, role: true } } } 
    }),
    prisma.securityLog.findMany({ 
      where: logFilter,
      take: 15, 
      orderBy: { created_at: 'desc' }, 
      include: { user: { select: { full_name: true, email: true } } } 
    }),
    prisma.session.findMany({
      where: { is_active: true },
      include: { 
        instructors: { select: { full_name: true }, take: 1 },
        _count: { select: { attendances: true } }
      },
      take: 5
    }),
    prisma.role.findMany({
      include: { _count: { select: { users: true } } }
    }),
    // Single query for last 7 days activity — replaces 7 sequential queries
    prisma.activityLog.findMany({
      where: { created_at: { gte: sevenDaysAgo } },
      select: { created_at: true },
    }),
  ]);

  const roleData = roles.map(r => ({ 
    name: r.role_name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '), 
    value: r._count.users 
  }));

  const activeSessionsMapped = activeSessionsList.map(s => ({
    id: s.id,
    session_name: s.title,
    instructor: s.instructors[0] || { full_name: 'Unknown' },
    attendance_count: s._count.attendances
  }));

  // Build activity trend from the single raw query result
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const countsByDay = {};
  activityRaw.forEach(log => {
    const day = new Date(log.created_at).toISOString().split('T')[0];
    countsByDay[day] = (countsByDay[day] || 0) + 1;
  });

  const activityData = last7Days.map(date => ({
    name: date.split('-').slice(1).join('/'),
    value: countsByDay[date] || 0,
  }));

  return {
    totalUsers,
    totalStudents,
    totalSessions,
    totalTasks,
    recentLogs,
    securityLogs,
    activeSessionsList: activeSessionsMapped,
    roleData,
    activityData,
  };
};

const getSecurityLogs = async (requestingUser, query) => {
  const { page = 1, limit = 30 } = query;
  const skip = (page - 1) * limit;

  const logFilter = requestingUser?.email === 'admin@it.training.system' 
    ? {} 
    : { user: { NOT: { email: 'admin@it.training.system' } } };

  const [logs, total] = await Promise.all([
    prisma.securityLog.findMany({
      where: logFilter,
      include: { user: { select: { full_name: true, email: true } } },
      orderBy: { created_at: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
    }),
    prisma.securityLog.count({ where: logFilter }),
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

const getActivityLogs = async (requestingUser, query) => {
  const { page = 1, limit = 30 } = query;
  const skip = (page - 1) * limit;

  const logFilter = requestingUser?.email === 'admin@it.training.system' 
    ? {} 
    : { user: { NOT: { email: 'admin@it.training.system' } } };

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: logFilter,
      include: { user: { select: { full_name: true, email: true, role: true } } },
      orderBy: { created_at: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
    }),
    prisma.activityLog.count({ where: logFilter }),
  ]);

  return { logs, total };
};

module.exports = {
  getUsers, createUser, updateUser, deleteUser, blockUser,
  importStudents, getAnalytics, getSecurityLogs, getActivityLogs,
  getDetailedStudentAnalytics, getUserFullHistory,
  getGlobalAttendance,
};
