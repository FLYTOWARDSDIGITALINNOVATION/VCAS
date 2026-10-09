const express = require('express');
const router  = express.Router();
const {
  staffLogin,
  staffRegister,
  completeProfile,
  updateProfile,
  addAchievement,
  deleteAchievement,
  adminLogin,
  studentLogin,
  studentRegister
} = require('../controllers/authController');

// POST /api/auth/student/login
router.post('/student/login', studentLogin);

// POST /api/auth/student/register
router.post('/student/register', studentRegister);

// POST /api/auth/admin/login
router.post('/admin/login', adminLogin);

// POST /api/auth/staff/login
router.post('/staff/login', staffLogin);

// POST /api/auth/staff/register
router.post('/staff/register', staffRegister);

// POST /api/auth/staff/:staffId/complete-profile
router.post('/staff/:staffId/complete-profile', completeProfile);

// PATCH /api/auth/staff/:staffId/profile
router.patch('/staff/:staffId/profile', updateProfile);

// POST /api/auth/staff/:staffId/achievements
router.post('/staff/:staffId/achievements', addAchievement);

// DELETE /api/auth/staff/:staffId/achievements/:achievementId
router.delete('/staff/:staffId/achievements/:achievementId', deleteAchievement);

module.exports = router;

