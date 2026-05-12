const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const taskRoutes = require('./routes/taskRoutes');
const gradingRoutes = require('./routes/gradingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// ─── SECURITY ─────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://*"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com", "data:", "https://*"],
      imgSrc: ["'self'", "data:", "blob:", "https://*"],
      connectSrc: ["'self'", "https://*", "wss://*", "ws://*"],
    },
  },
}));

// ─── CORS ─────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://it-clubstudent-training-production.up.railway.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

// ─── RATE LIMITING ────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later' },
});

app.use(globalLimiter);

// ─── BODY PARSING ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── LOGGING ──────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── STATIC FILES ─────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Serve React static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  
  app.get('*splat', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    
    const indexPath = path.join(process.cwd(), 'dist', 'index.html');
    if (require('fs').existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(500).send('Frontend build (dist/index.html) not found. Please ensure "npm run build" completed successfully.');
    }
  });
} else {
  app.get('/', (req, res) => {
    res.send('IT Training System API is running. Visit /api/health for status.');
  });
}

// ─── HEALTH CHECK ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'IT Training System API is running', timestamp: new Date() });
});

// ─── ROUTES ───────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/grades', gradingRoutes);
app.use('/api/admin', adminRoutes);

// ─── 404 ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found` });
});

// ─── ERROR HANDLER ────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
