const prisma = require('../config/db');
const crypto = require('crypto');

// ─── GET ALL SESSIONS ─────────────────────────────────────
const getSessions = async (req, res) => {
  try {
    const { groupId, type, instructorId, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (groupId) where.group_id = parseInt(groupId);
    if (type) where.session_type = type;
    if (instructorId) {
      where.instructors = {
        some: { id: parseInt(instructorId) }
      };
    }

    // Students only see their group sessions
    if (req.user.role.role_name === 'student' && req.user.group_id) {
      where.group_id = req.user.group_id;
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        include: {
          instructors: { select: { id: true, full_name: true, avatar: true, role: { select: { role_name: true } } } },
          group: true,
          _count: { select: { attendances: true } },
        },
        orderBy: { start_time: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit),
      }),
      prisma.session.count({ where }),
    ]);

    res.json({ success: true, data: sessions, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── CREATE SESSION ───────────────────────────────────────
const createSession = async (req, res) => {
  try {
    const { title, room_number, group_id, start_time, end_time, session_type, instructor_ids } = req.body;

    // Convert instructor_ids to array of integers
    let ids = [];
    if (Array.isArray(instructor_ids)) {
      ids = instructor_ids.map(id => parseInt(id));
    } else if (instructor_ids) {
      ids = [parseInt(instructor_ids)];
    } else {
      ids = [req.user.id];
    }

    const session = await prisma.session.create({
      data: {
        title,
        room_number,
        group_id: group_id ? parseInt(group_id) : null,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        session_type: session_type || 'lecture',
        instructors: {
          connect: ids.map(id => ({ id }))
        }
      },
      include: { 
        instructors: { select: { id: true, full_name: true, avatar: true } }, 
        group: true 
      },
    });

    await prisma.activityLog.create({
      data: { user_id: req.user.id, action: 'create_session', description: `Created session: ${title}` },
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── UPDATE SESSION ───────────────────────────────────────
const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { instructor_ids, ...data } = req.body;
    
    const updateData = { ...data };
    if (data.group_id) updateData.group_id = parseInt(data.group_id);
    if (data.start_time) updateData.start_time = new Date(data.start_time);
    if (data.end_time) updateData.end_time = new Date(data.end_time);

    if (instructor_ids) {
      let ids = Array.isArray(instructor_ids) ? instructor_ids : [instructor_ids];
      updateData.instructors = {
        set: ids.map(uid => ({ id: parseInt(uid) }))
      };
    }

    const session = await prisma.session.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { 
        instructors: { select: { id: true, full_name: true, avatar: true } },
        group: true
      },
    });
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── DELETE SESSION ───────────────────────────────────────
const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.session.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── OPEN ATTENDANCE WINDOW ───────────────────────────────
const openAttendanceWindow = async (req, res) => {
  try {
    const { id } = req.params;
    const { window } = req.body; // 'first' | 'second'
    const now = new Date();

    const updateData = {};
    if (window === 'first') updateData.attendance_one_open = now;
    if (window === 'second') updateData.attendance_two_open = now;

    const session = await prisma.session.update({
      where: { id: parseInt(id) },
      data: { ...updateData, is_active: true },
    });

    // Emit via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`session_${id}`).emit('attendance_window_opened', { sessionId: id, window, openedAt: now });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── CLOSE ATTENDANCE WINDOW ──────────────────────────────
const closeAttendanceWindow = async (req, res) => {
  try {
    const { id } = req.params;
    const { window } = req.body;
    const now = new Date();

    const updateData = {};
    if (window === 'first') updateData.attendance_one_close = now;
    if (window === 'second') updateData.attendance_two_close = now;

    const session = await prisma.session.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`session_${id}`).emit('attendance_window_closed', { sessionId: id, window });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GENERATE SESSION QR ──────────────────────────────────
const generateSessionQR = async (req, res) => {
  try {
    const { id } = req.params;
    const qrCode = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Deactivate old QR tokens
    await prisma.qrToken.updateMany({
      where: { session_id: parseInt(id), is_active: true },
      data: { is_active: false },
    });

    const qrToken = await prisma.qrToken.create({
      data: {
        session_id: parseInt(id),
        qr_code: qrCode,
        expires_at: expiresAt,
        is_active: true,
      },
    });

    // Update session qr_token
    await prisma.session.update({
      where: { id: parseInt(id) },
      data: { qr_token: qrCode },
    });

    res.json({ success: true, data: qrToken });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET SESSION BY ID ────────────────────────────────────
const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await prisma.session.findUnique({
      where: { id: parseInt(id) },
      include: {
        instructors: { select: { id: true, full_name: true, avatar: true, phone: true, role: { select: { role_name: true } } } },
        group: {
          include: {
            users: {
              where: {
                role: {
                  role_name: {
                    in: ['mentor', 'mentor_manager', 'hr']
                  }
                }
              },
              select: {
                id: true,
                full_name: true,
                avatar: true,
                phone: true,
                role: {
                  select: { role_name: true }
                }
              }
            }
          }
        },
        attendances: {
          include: { student: { select: { id: true, full_name: true, academic_number: true, avatar: true } } },
        },
      },
    });

    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  openAttendanceWindow,
  closeAttendanceWindow,
  generateSessionQR,
  getSessionById,
};
