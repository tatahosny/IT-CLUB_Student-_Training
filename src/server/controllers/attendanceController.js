const prisma = require('../config/db');
const crypto = require('crypto');

/**
 * SCAN QR — Main attendance recording endpoint
 * Handles: personal QR scan, workshop shared QR, cheating detection
 */
const scanQR = async (req, res) => {
  try {
    const { qrCode, sessionId, attendanceType, fingerprint } = req.body;
    const scannerRole = req.user.role.role_name;
    const ipAddress = req.ip;

    // 1. Validate QR token
    const qrToken = await prisma.qrToken.findUnique({ where: { qr_code: qrCode } });

    if (!qrToken || !qrToken.is_active) {
      return res.status(400).json({ success: false, message: 'Invalid or expired QR code' });
    }
    if (new Date() > qrToken.expires_at) {
      await prisma.qrToken.update({ where: { id: qrToken.id }, data: { is_active: false } });
      return res.status(400).json({ success: false, message: 'QR code has expired' });
    }

    // 2. Get session
    const parsedSessionId = sessionId ? parseInt(sessionId) : qrToken.session_id;
    
    if (isNaN(parsedSessionId)) {
      return res.status(400).json({ success: false, message: 'Invalid Session ID' });
    }

    const session = await prisma.session.findUnique({
      where: { id: parsedSessionId },
      include: { group: true, instructors: { select: { full_name: true } } },
    });

    if (!session || !session.is_active) {
      return res.status(400).json({ success: false, message: 'Session is not active' });
    }

    // 3. Determine student
    let studentId;
    if (scannerRole === 'student') {
      studentId = req.user.id;
    } else {
      // If staff is scanning, try to get studentId from request body first, 
      // otherwise fallback to the user_id associated with the QR token (for personal QRs)
      studentId = req.body.studentId ? parseInt(req.body.studentId) : qrToken.user_id;
    }

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID not identified' });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: { role: true },
    });

    if (!student || student.role.role_name !== 'student') {
      return res.status(400).json({ success: false, message: 'Student not found or invalid role' });
    }

    // 4. Check fraud detection flag from deviceGuard middleware
    if (req.fraudDetected && scannerRole === 'student') {
      const blockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const currentUserId = req.fraudDetected.currentUserId;
      const suspectUserId = req.fraudDetected.suspectUserId;

      // Record the Fraud in Attendance Table for both users (mark as NOT present with fraud note)
      const fraudRecordData = (uid, partnerId) => ({
        where: {
          session_id_student_id_attendance_type: {
            session_id: session.id,
            student_id: uid,
            attendance_type: attendanceType || 'first',
          },
        },
        update: {
          is_present: false,
          scanner_role: 'FRAUD_ATTEMPT',
          device_id: 'SYSTEM_BLOCKED',
          ip_address: `PARTNER_ID:${partnerId}`,
          scanned_at: new Date(),
        },
        create: {
          session_id: session.id,
          student_id: uid,
          attendance_type: attendanceType || 'first',
          is_present: false,
          scanner_role: 'FRAUD_ATTEMPT',
          device_id: 'SYSTEM_BLOCKED',
          ip_address: `PARTNER_ID:${partnerId}`,
          scanned_at: new Date(),
        },
      });

      await prisma.attendance.upsert(fraudRecordData(currentUserId, suspectUserId));
      await prisma.attendance.upsert(fraudRecordData(suspectUserId, currentUserId));

      // Block both accounts
      await prisma.user.updateMany({
        where: { id: { in: [currentUserId, suspectUserId] } },
        data: { is_blocked: true, blocked_until: blockUntil },
      });

      // Record Fraud in Security Logs for Super Admin
      await prisma.securityLog.createMany({
        data: [
          {
            user_id: currentUserId,
            device_id: fingerprint,
            ip_address: ipAddress,
            action_type: 'fraud',
            description: `FRAUD ATTEMPT: Student ${currentUserId} tried to use device already registered to student ${suspectUserId}. BOTH BLOCKED.`,
          },
          {
            user_id: suspectUserId,
            device_id: fingerprint,
            ip_address: ipAddress,
            action_type: 'fraud',
            description: `FRAUD ATTEMPT: Account used on device by student ${currentUserId}. BOTH BLOCKED.`,
          }
        ]
      });

      // Notify via socket
      const io = req.app.get('io');
      if (io) {
        io.to('admin_room').emit('fraud_detected', {
          users: [currentUserId, suspectUserId],
          fingerprint: fingerprint,
          sessionId: session.id,
          message: `Fraud attempt detected! Users ${currentUserId} and ${suspectUserId} have been blocked for 24h.`
        });
      }

      return res.status(403).json({
        success: false,
        fraud: true,
        blockedUntil: blockUntil,
        message: `You are blocked until ${blockUntil.toLocaleString()}. Reason: attendance fraud (Multiple accounts on same device). Both involved accounts have been suspended for 24h.`,
      });
    }

    // 5. Check if attendance already recorded
    const existing = await prisma.attendance.findUnique({
      where: {
        session_id_student_id_attendance_type: {
          session_id: session.id,
          student_id: studentId,
          attendance_type: attendanceType || 'first',
        },
      },
    });

    if (existing && existing.is_present) {
      return res.status(200).json({
        success: false,
        message: 'Attendance already recorded',
        data: {
          student: { full_name: student.full_name, academic_number: student.academic_number },
          session: { title: session.title }
        }
      });
    }

    // ─── PREVIEW MODE FOR STAFF ───
    // If it's a staff member scanning and 'confirm' is not true, return preview data
    if (scannerRole !== 'student' && !req.body.confirm) {
      return res.json({
        success: true,
        preview: true,
        data: {
          student: {
            id: student.id,
            full_name: student.full_name,
            academic_number: student.academic_number,
            avatar: student.avatar
          },
          session: {
            id: session.id,
            title: session.title,
            type: session.session_type,
            room: session.room_number,
            instructors: session.instructors?.map(i => i.full_name).join(', ') || 'N/A'
          },
          attendanceType: attendanceType || 'first'
        }
      });
    }

    // 6. Record attendance
    const attendance = await prisma.attendance.upsert({
      where: {
        session_id_student_id_attendance_type: {
          session_id: session.id,
          student_id: studentId,
          attendance_type: attendanceType || 'first',
        },
      },
      update: {
        is_present: true,
        scanned_at: new Date(),
        scanner_role: scannerRole,
        device_id: fingerprint,
        ip_address: ipAddress,
      },
      create: {
        session_id: session.id,
        student_id: studentId,
        attendance_type: attendanceType || 'first',
        is_present: true,
        scanned_at: new Date(),
        scanner_role: scannerRole,
        device_id: fingerprint,
        ip_address: ipAddress,
      },
    });

    // 7. Invalidate personal QR (rotate) for next scan
    if (qrToken.user_id) {
      await prisma.qrToken.update({ where: { id: qrToken.id }, data: { is_active: false } });
    }

    // 8. Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`session_${session.id}`).emit('attendance_update', {
        studentId,
        studentName: student.full_name,
        academicNumber: student.academic_number,
        attendanceType: attendance.attendance_type,
        scannedAt: attendance.scanned_at,
      });
    }

    res.json({
      success: true,
      message: 'Attendance recorded successfully',
      data: {
        student: {
          full_name: student.full_name,
          academic_number: student.academic_number,
          avatar: student.avatar,
        },
        attendance_type: attendance.attendance_type,
        scanned_at: attendance.scanned_at,
      },
    });
  } catch (error) {
    console.error('ScanQR error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET STUDENT PERSONAL QR ──────────────────────────────
const getMyQR = async (req, res) => {
  try {
    const studentId = req.user.id;
    console.log(`[DEBUG] getMyQR request for Student: ${studentId}, Session: ${req.params.sessionId}`);
    const { sessionId: rawSessionId } = req.params;
    const sessionId = parseInt(rawSessionId);

    if (isNaN(sessionId)) {
      return res.status(400).json({ success: false, message: 'Invalid Session ID provided' });
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found (ID: ' + sessionId + ')' });

    // ─── FRAUD DETECTION ───
    if (req.fraudDetected) {
      const blockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Remove attendance from both accounts
      await prisma.attendance.deleteMany({
        where: {
          session_id: sessionId,
          student_id: { in: [req.fraudDetected.currentUserId, req.fraudDetected.suspectUserId] },
        },
      });

      // Block both accounts
      await prisma.user.updateMany({
        where: { id: { in: [req.fraudDetected.currentUserId, req.fraudDetected.suspectUserId] } },
        data: { is_blocked: true, blocked_until: blockUntil },
      });

      // Notify admins via socket
      const io = req.app.get('io');
      if (io) {
        io.to('admin_room').emit('fraud_detected', {
          users: [req.fraudDetected.currentUserId, req.fraudDetected.suspectUserId],
          fingerprint: req.fraudDetected.fingerprint,
          sessionId: sessionId,
        });
      }

      return res.status(403).json({
        success: false,
        message: 'You are blocked for 24 hours due to attendance fraud attempt (Multiple accounts on same device).',
      });
    }

    // Generate or get active QR for this student+session
    const qrCode = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Deactivate old personal QR for this student+session
    await prisma.qrToken.updateMany({
      where: { session_id: sessionId, user_id: studentId, is_active: true },
      data: { is_active: false },
    });

    const qrToken = await prisma.qrToken.create({
      data: {
        session_id: sessionId,
        user_id: studentId,
        qr_code: qrCode,
        expires_at: expiresAt,
        is_active: true,
      },
    });

    if (!qrToken) {
      throw new Error('Failed to create QR token in database');
    }

    return res.json({ success: true, data: qrToken });
  } catch (error) {
    console.error('[CRITICAL] getMyQR Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + (error.message || 'Unknown database error'),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ─── GET SESSION ATTENDANCE ───────────────────────────────
const getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await prisma.session.findUnique({
      where: { id: parseInt(sessionId) },
      include: { group: true },
    });

    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    // Get all attendances recorded so far
    const attendances = await prisma.attendance.findMany({
      where: { session_id: session.id },
      include: {
        student: {
          select: { id: true, full_name: true, academic_number: true, phone: true, group: true, avatar: true },
        },
      },
    });

    // If session has a group, get all group members to find who is absent
    let result = attendances;
    if (session.group_id) {
      const allStudents = await prisma.user.findMany({
        where: { group_id: session.group_id, role: { role_name: 'student' } },
        select: { id: true, full_name: true, academic_number: true, phone: true, avatar: true },
      });

      const attendedIds = new Set(attendances.map(a => a.student_id));
      const absentStudents = allStudents
        .filter(s => !attendedIds.has(s.id))
        .map(s => ({
          id: `absent-${s.id}`,
          session_id: session.id,
          student_id: s.id,
          student: s,
          is_present: false,
          scanned_at: null,
          attendance_type: 'none',
        }));

      result = [...attendances, ...absentStudents];
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('getSessionAttendance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET STUDENT ATTENDANCE HISTORY ──────────────────────
const getStudentHistory = async (req, res) => {
  try {
    const studentId = req.user.role.role_name === 'student' ? req.user.id : parseInt(req.params.studentId);

    const attendances = await prisma.attendance.findMany({
      where: { student_id: studentId },
      include: {
        session: { include: { instructors: { select: { full_name: true } }, group: true } },
      },
      orderBy: { session: { start_time: 'desc' } },
    });

    res.json({ success: true, data: attendances });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── MANUAL MARK ATTENDANCE ───────────────────────────────
const markAttendanceManual = async (req, res) => {
  try {
    const { sessionId, studentId, attendanceType, isPresent } = req.body;
    const userId = req.user.id;
    const roleName = req.user.role.role_name;

    // 1. Check if user is Super Admin
    const isSuperAdmin = req.user.role.role_name === 'super_admin';

    // 2. If not Super Admin, check if they are an instructor assigned to this session
    if (!isSuperAdmin) {
      const session = await prisma.session.findUnique({
        where: { id: parseInt(sessionId) },
        include: { instructors: { select: { id: true } } }
      });

      if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

      const isAssigned = session.instructors.some(inst => inst.id === userId);
      if (!isAssigned) {
        return res.status(403).json({ 
          success: false, 
          message: 'Permission Denied: You can only manage attendance for sessions assigned to you.' 
        });
      }
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        session_id_student_id_attendance_type: {
          session_id: parseInt(sessionId),
          student_id: parseInt(studentId),
          attendance_type: attendanceType,
        },
      },
      update: { is_present: isPresent, scanner_role: roleName },
      create: {
        session_id: parseInt(sessionId),
        student_id: parseInt(studentId),
        attendance_type: attendanceType,
        is_present: isPresent,
        scanner_role: roleName,
      },
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('markAttendanceManual error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET WORKSHOP SHARED QR ───────────────────────────────
const getWorkshopQR = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session_id = parseInt(sessionId);
    if (isNaN(session_id)) return res.status(400).json({ success: false, message: 'Invalid session ID' });

    const duration = parseInt(req.query.duration) || 60; // default 60 mins
    const session = await prisma.session.findUnique({ where: { id: session_id } });

    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!session.is_active) return res.status(400).json({ success: false, message: 'Session is not active' });

    // Generate or get existing workshop QR (null user_id)
    const expiresAt = new Date(Date.now() + duration * 60 * 1000); 
    
    // Deactivate any existing active workshop QR for this session to respect the new duration
    await prisma.qrToken.updateMany({
        where: { session_id: session_id, user_id: null, is_active: true },
        data: { is_active: false }
    });

    const qrCode = `WORKSHOP-${session.id}-${crypto.randomBytes(16).toString('hex')}`;
    const qrToken = await prisma.qrToken.create({
        data: {
            session_id: session_id,
            user_id: null,
            qr_code: qrCode,
            expires_at: expiresAt,
            is_active: true,
        }
    });

    res.json({ 
        success: true, 
        data: {
            ...qrToken,
            timeLeftSeconds: Math.floor((qrToken.expires_at.getTime() - Date.now()) / 1000)
        } 
    });
  } catch (error) {
    console.error('Error in getWorkshopQR:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

module.exports = { scanQR, getMyQR, getWorkshopQR, getSessionAttendance, getStudentHistory, markAttendanceManual };
