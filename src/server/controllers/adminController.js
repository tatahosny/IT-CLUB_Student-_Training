const adminService = require('../services/adminService');
const prisma = require('../config/db');
const xlsx = require('xlsx');

const getUsers = async (req, res, next) => {
  try {
    const result = await adminService.getUsers(req.query);
    res.json({ success: true, data: result.users, meta: { total: result.total, page: parseInt(req.query.page || 1), limit: parseInt(req.query.limit || 20) } });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await adminService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await adminService.updateUser(req.params.id, req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await adminService.deleteUser(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

const blockUser = async (req, res, next) => {
  try {
    const { block, hours } = req.body;
    const user = await adminService.blockUser(req.user.id, req.params.id, block, hours);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const importStudents = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const results = await adminService.importStudents(req.user.id, req.file.buffer);
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

const downloadTemplate = async (req, res, next) => {
  try {
    const headers = [['Student Name', 'Academic Number', 'Phone', 'National ID', 'Group', 'Level']];
    const ws = xlsx.utils.aoa_to_sheet(headers);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Students');
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=students_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const result = await adminService.getAnalytics(req.user);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getSecurityLogs = async (req, res, next) => {
  try {
    const result = await adminService.getSecurityLogs(req.user, req.query);
    res.json({ success: true, data: result.logs, meta: { total: result.total, page: parseInt(req.query.page || 1), limit: parseInt(req.query.limit || 30) } });
  } catch (error) {
    next(error);
  }
};

const getActivityLogs = async (req, res, next) => {
  try {
    const result = await adminService.getActivityLogs(req.user, req.query);
    res.json({ success: true, data: result.logs, meta: { total: result.total, page: parseInt(req.query.page || 1), limit: parseInt(req.query.limit || 30) } });
  } catch (error) {
    next(error);
  }
};

const getDetailedStudentAnalytics = async (req, res, next) => {
  try {
    const data = await adminService.getDetailedStudentAnalytics(req.query.group);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getUserFullHistory = async (req, res, next) => {
  try {
    const data = await adminService.getUserFullHistory(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getGlobalAttendance = async (req, res, next) => {
  try {
    const result = await adminService.getGlobalAttendance(req.query);
    res.json({ success: true, data: result.attendances, meta: { total: result.total, page: parseInt(req.query.page || 1), limit: parseInt(req.query.limit || 50) } });
  } catch (error) {
    next(error);
  }
};

const getGroups = async (req, res) => {
  try {
    const groups = await prisma.group.findMany({ include: { _count: { select: { users: true } } } });
    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createGroup = async (req, res) => {
  try {
    const group = await prisma.group.create({ data: req.body });
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    await prisma.notification.update({ where: { id: parseInt(req.params.id) }, data: { is_read: true } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getLevels = async (req, res) => {
  try {
    const levels = await prisma.level.findMany();
    res.json({ success: true, data: levels });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany();
    res.json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const logActivity = async (req, res, next) => {
  try {
    const { action, description } = req.body;
    await prisma.activityLog.create({
      data: {
        user_id: req.user.id,
        action,
        description,
      },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers, createUser, updateUser, deleteUser, blockUser,
  importStudents, downloadTemplate, getAnalytics, getSecurityLogs, getActivityLogs,
  getGroups, createGroup, getNotifications, markNotificationRead,
  getLevels, getRoles, getDetailedStudentAnalytics, getUserFullHistory,
  getGlobalAttendance, logActivity,
};
