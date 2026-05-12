// taskService.js
const prisma = require('../config/db');

const getAllTasks = async () => {
  return await prisma.task.findMany({
    include: { _count: { select: { submissions: true } } },
    orderBy: { created_at: 'desc' },
  });
};

const submitTask = async (userId, taskId, files) => {
  // Logic here
};

module.exports = { getAllTasks, submitTask };
