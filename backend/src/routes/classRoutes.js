const express = require('express');
const router = express.Router();
const {
  getAllClasses,
  getStaffClasses,
  getClassDetails,
  addClass,
  updateClass,
  deleteClass,
  enrollStudent,
  removeStudent
} = require('../controllers/classController');

// ── General Class Routes ─────────────────────────────────
router.get('/', getAllClasses);
router.post('/', addClass);

// ── Staff-scoped Class Routes (used by Staff portal) ─────
router.get('/staff/:staffId', getStaffClasses);
router.get('/staff/:staffId/:classCode', getClassDetails);
router.post('/staff/:staffId', addClass);
router.put('/staff/:staffId/:classCode', updateClass);
router.delete('/staff/:staffId/:classCode', deleteClass);

// Student Enrollment in Staff-scoped routes
router.post('/staff/:staffId/:classCode/students', enrollStudent);
router.delete('/staff/:staffId/:classCode/students/:rollNo', removeStudent);

// ── Specific Class Routes by Code / ID ───────────────────
router.get('/code/:classCode', getClassDetails);
router.get('/:idOrCode', getClassDetails);
router.put('/:idOrCode', updateClass);
router.delete('/:idOrCode', deleteClass);

// Student Enrollment by ID or Code
router.post('/:idOrCode/students', enrollStudent);
router.delete('/:idOrCode/students/:rollNo', removeStudent);

module.exports = router;
