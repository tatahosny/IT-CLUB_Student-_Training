// Placeholder for sessionService.js
const prisma = require('../config/db');

const getAllSessions = async (query) => {
  const { group, search } = query;
  const where = {};
  if (group) where.group_id = parseInt(group);
  if (search) where.title = { contains: search, mode: 'insensitive' };
  
  return await prisma.session.findMany({
    where,
    include: { group: true, _count: { select: { attendances: true } } },
    orderBy: { start_time: 'desc' },
  });
};

const createSession = async (data) => {
  return await prisma.session.create({
    data: {
      ...data,
      group_id: data.group_id ? parseInt(data.group_id) : null,
      start_time: new Date(data.start_time),
      end_time: new Date(data.end_time),
    }
  });
};

module.exports = { getAllSessions, createSession };
