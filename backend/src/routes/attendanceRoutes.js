const express = require('express');
const router = express.Router();
const {
  getAllAttendance,
  getStaffSessions,
  getSessionById,
  saveSession,
  updateSession,
  deleteSession,
  getClassSummary,
  getStudentAttendance
} = require('../controllers/attendanceController');

// ── General Attendance Routes ─────────────────────────────
router.get('/', getAllAttendance);
router.post('/', saveSession);

// ── Summary & Student Analytics ───────────────────────────
router.get('/summary/:classCode', getClassSummary);
router.get('/student/:rollNo', getStudentAttendance);

// ── Staff-Scoped Attendance Routes ────────────────────────
router.get('/staff/:staffId', getStaffSessions);
router.post('/staff/:staffId', saveSession);
router.get('/staff/:staffId/summary/:classCode', getClassSummary);

// ── Session Operations by ID ──────────────────────────────
router.get('/:id', getSessionById);
router.put('/:id', updateSession);
router.delete('/:id', deleteSession);

module.exports = router;
