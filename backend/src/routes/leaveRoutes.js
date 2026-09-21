const express = require('express');
const router = express.Router();
const {
  getAllLeaves,
  getStaffLeaves,
  getQuotaSettings,
  updateQuotaSettings,
  updateStaffOverrideQuota,
  applyLeave,
  updateLeaveStatus,
  cancelLeave
} = require('../controllers/leaveController');

// GET    /api/leave                           - Get all leave applications for Admin portal
router.get('/', getAllLeaves);

// GET    /api/leave/quota-settings            - Get active college leave policy & quota settings
router.get('/quota-settings', getQuotaSettings);

// PUT    /api/leave/quota-settings            - Update active college leave policy & quota settings (Admin)
router.put('/quota-settings', updateQuotaSettings);

// PUT    /api/leave/quota-settings/staff/:staffId - Override custom leave quota for a specific staff
router.put('/quota-settings/staff/:staffId', updateStaffOverrideQuota);

// GET    /api/leave/staff/:staffId            - Get staff leave history and dynamic balance summary
router.get('/staff/:staffId', getStaffLeaves);

// POST   /api/leave/staff/:staffId            - Apply for leave
router.post('/staff/:staffId', applyLeave);

// PATCH  /api/leave/:id/status                - Approve or Reject leave (HoD / Admin)
router.patch('/:id/status', updateLeaveStatus);

// DELETE /api/leave/:id                       - Cancel a pending leave application
router.delete('/:id', cancelLeave);

module.exports = router;
