require('dotenv').config();
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

const app  = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// API Routes
app.use('/api/auth',       authRoutes);
app.use('/api/staff',      staffRoutes);
app.use('/api/classes',    classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timetable',        timetableRoutes);
app.use('/api/internal-marks',   internalMarksRoutes);
app.use('/api/assignments',      assignmentRoutes);
app.use('/api/notices',          noticeRoutes);
app.use('/api/leave',            leaveRoutes);
app.use('/api/question-papers',  questionPaperRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 VCAS Backend Server running on port ${PORT}`);
  console.log(`🌐 Health:     http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth:       http://localhost:${PORT}/api/auth/staff/login`);
  console.log(`📚 Classes:    http://localhost:${PORT}/api/classes`);
  console.log(`📋 Attendance: http://localhost:${PORT}/api/attendance`);
  console.log(`📅 Timetable:      http://localhost:${PORT}/api/timetable`);
  console.log(`📝 InternalMarks: http://localhost:${PORT}/api/internal-marks`);
  console.log(`📌 Assignments:   http://localhost:${PORT}/api/assignments`);
  console.log(`📢 Notices:       http://localhost:${PORT}/api/notices`);
  console.log(`🏖️ Leave:         http://localhost:${PORT}/api/leave`);
  console.log(`=================================================`);
});
