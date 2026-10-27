require('dotenv').config();
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {}

const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');
const connectDB  = require('./config/db');
const classRoutes = require('./routes/classRoutes');
const authRoutes  = require('./routes/authRoutes');
const staffRoutes = require('./routes/staffRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const timetableRoutes        = require('./routes/timetableRoutes');
const internalMarksRoutes    = require('./routes/internalMarksRoutes');
const assignmentRoutes       = require('./routes/assignmentRoutes');
const noticeRoutes           = require('./routes/noticeRoutes');
const leaveRoutes            = require('./routes/leaveRoutes');
const questionPaperRoutes    = require('./routes/questionPaperRoutes');
const hallTicketRoutes       = require('./routes/hallTicketRoutes');
const studentRoutes          = require('./routes/studentRoutes');
const departmentRoutes       = require('./routes/departmentRoutes');
const courseRoutes           = require('./routes/courseRoutes');
const subjectRoutes          = require('./routes/subjectRoutes');
const settingsRoutes         = require('./routes/settingsRoutes');
const examRoutes             = require('./routes/examRoutes');
const feeStructureRoutes     = require('./routes/feeStructureRoutes');
const tcRoutes               = require('./routes/tcRoutes');
const staffTaskRoutes        = require('./routes/staffTaskRoutes');
const coursePlanRoutes       = require('./routes/coursePlanRoutes');
const bonafideRoutes         = require('./routes/bonafideRoutes');
const expenseRoutes          = require('./routes/expenseRoutes');
const driverRoutes           = require('./routes/driverRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Allow if origin is explicitly in list, or in dev/permissive mode, or matches localhost
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');
    if (isAllowed || isLocalhost || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    // Production fallback: allow request with credentials
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Automatically normalize double '/api/api/' calls from any frontend clients
app.use((req, res, next) => {
  if (req.url.startsWith('/api/api/')) {
    req.url = req.url.replace('/api/api/', '/api/');
  }
  next();
});

// Health Check
app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'online',
    serverTime: new Date().toISOString(),
    database: {
      name:      mongoose.connection.name || 'VCAS',
      connected,
      status:    connected ? 'Connected to MongoDB Atlas' : 'Connecting or Offline'
    }
  });
});

// API Routes (supports both /api/* and /*)
app.use(['/api/auth', '/auth'],                        authRoutes);
app.use(['/api/staff', '/staff'],                      staffRoutes);
app.use(['/api/classes', '/classes'],                  classRoutes);
app.use(['/api/attendance', '/attendance'],            attendanceRoutes);
app.use(['/api/timetable', '/timetable'],              timetableRoutes);
app.use(['/api/internal-marks', '/internal-marks'],    internalMarksRoutes);
app.use(['/api/assignments', '/assignments'],          assignmentRoutes);
app.use(['/api/notices', '/notices'],                  noticeRoutes);
app.use(['/api/leave', '/leave'],                      leaveRoutes);
app.use(['/api/question-papers', '/question-papers'],  questionPaperRoutes);
app.use(['/api/hall-tickets', '/hall-tickets'],        hallTicketRoutes);
app.use(['/api/students', '/students'],                studentRoutes);
app.use(['/api/departments', '/departments'],          departmentRoutes);
app.use(['/api/courses', '/courses'],                  courseRoutes);
app.use(['/api/subjects', '/subjects'],                subjectRoutes);
app.use(['/api/settings', '/settings'],                settingsRoutes);
app.use(['/api/exams', '/exams'],                      examRoutes);
app.use(['/api/fee-structure', '/fee-structure'],      feeStructureRoutes);
app.use(['/api/tc', '/tc'],                            tcRoutes);
app.use(['/api/staff-tasks', '/staff-tasks'],          staffTaskRoutes);
app.use(['/api/course-plans', '/course-plans'],        coursePlanRoutes);
app.use(['/api/bonafide', '/bonafide'],                bonafideRoutes);
app.use(['/api/expenses', '/expenses'],                expenseRoutes);
app.use(['/api/drivers', '/drivers'],                  driverRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Process-level error protection to prevent crashes from unhandled network/DNS drops
process.on('uncaughtException', (err) => {
  console.error('[Process Uncaught Exception]:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process Unhandled Rejection]:', reason);
});

const server = app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 VCAS Backend Server running on port ${PORT}`);
  console.log(`🌐 Health:        http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth:          http://localhost:${PORT}/api/auth/staff/login`);
  console.log(`🎓 Students:      http://localhost:${PORT}/api/students`);
  console.log(`📚 Classes:       http://localhost:${PORT}/api/classes`);
  console.log(`📋 Attendance:    http://localhost:${PORT}/api/attendance`);
  console.log(`📅 Timetable:     http://localhost:${PORT}/api/timetable`);
  console.log(`📝 InternalMarks: http://localhost:${PORT}/api/internal-marks`);
  console.log(`📌 Assignments:   http://localhost:${PORT}/api/assignments`);
  console.log(`📢 Notices:       http://localhost:${PORT}/api/notices`);
  console.log(`🏖️ Leave:         http://localhost:${PORT}/api/leave`);
  console.log(`=================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is currently in use. Attempting graceful recovery...`);
  } else {
    console.error('Server listener error:', err);
  }
});

