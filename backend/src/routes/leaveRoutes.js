const express = require('express');
const router = express.Router();
const {
  getAllLeaves,
  getStaffLeaves,
  applyLeave,
  updateLeaveStatus,
  cancelLeave
} = require('../controllers/leaveController');

// GET    /api/leave                 - Get all leave applications for Admin portal
router.get('/', getAllLeaves);

// GET    /api/leave/staff/:staffId  - Get staff leave history and balance summary
router.get('/staff/:staffId', getStaffLeaves);

// POST   /api/leave/staff/:staffId  - Apply for leave
router.post('/staff/:staffId', applyLeave);

// PATCH  /api/leave/:id/status      - Approve or Reject leave (HoD / Admin)
router.patch('/:id/status', updateLeaveStatus);

// DELETE /api/leave/:id             - Cancel a pending leave application
router.delete('/:id', cancelLeave);

module.exports = router;
