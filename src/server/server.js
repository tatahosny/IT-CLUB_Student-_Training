const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const app = require('./app');
const prisma = require('./config/db');

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'https://it-club-student-training.vercel.app/';

// ─── HTTP + SOCKET.IO ─────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ─── SOCKET.IO EVENTS ─────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Join user-specific room
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`[Socket] User ${userId} joined personal room`);
  });

  // Join session room (for live attendance)
  socket.on('join_session', (sessionId) => {
    socket.join(`session_${sessionId}`);
    console.log(`[Socket] Socket ${socket.id} joined session_${sessionId}`);
  });

  // Join admin room
  socket.on('join_admin', () => {
    socket.join('admin_room');
    console.log(`[Socket] Admin joined admin_room`);
  });

  socket.on('leave_session', (sessionId) => {
    socket.leave(`session_${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Make io accessible in controllers
app.set('io', io);

// ─── START SERVER ─────────────────────────────────────────
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    const serverInstance = server.listen(PORT, () => {
      console.log(`🚀 IT Training System Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO ready`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
    });

    serverInstance.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please kill the process or use another port.`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', e);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// ─── GRACEFUL SHUTDOWN ────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});
