const express = require('express');
const router = express.Router();
const {
  getAllTimetables,
  getStaffTimetable,
  saveStaffTimetable,
  updateSlot,
  clearSlot
} = require('../controllers/timetableController');

// GET /api/timetable - Get all staff timetables for Admin portal
router.get('/', getAllTimetables);

router.get('/staff/:staffId', getStaffTimetable);
router.post('/staff/:staffId', saveStaffTimetable);
router.put('/staff/:staffId/slot', updateSlot);
router.delete('/staff/:staffId/slot/:day/:slot', clearSlot);

module.exports = router;
