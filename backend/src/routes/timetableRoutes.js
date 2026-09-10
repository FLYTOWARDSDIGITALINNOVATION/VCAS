const express = require('express');
const router = express.Router();
const {
  getStaffTimetable,
  saveStaffTimetable,
  updateSlot,
  clearSlot
} = require('../controllers/timetableController');

router.get('/staff/:staffId', getStaffTimetable);
router.post('/staff/:staffId', saveStaffTimetable);
router.put('/staff/:staffId/slot', updateSlot);
router.delete('/staff/:staffId/slot/:day/:slot', clearSlot);

module.exports = router;
