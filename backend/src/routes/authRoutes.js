const express = require('express');
const router  = express.Router();
const {
  staffLogin,
  staffRegister,
  completeProfile,
  updateProfile
} = require('../controllers/authController');

// POST /api/auth/staff/login
router.post('/staff/login', staffLogin);

// POST /api/auth/staff/register
router.post('/staff/register', staffRegister);

// POST /api/auth/staff/:staffId/complete-profile
router.post('/staff/:staffId/complete-profile', completeProfile);

// PATCH /api/auth/staff/:staffId/profile
router.patch('/staff/:staffId/profile', updateProfile);

module.exports = router;
