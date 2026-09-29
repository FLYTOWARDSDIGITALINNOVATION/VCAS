const express = require('express');
const router = express.Router();
const {
  getAllStaff,
  getStaffById,
  getStaffCredentials,
  createStaff,
  updateStaff,
  deleteStaff
} = require('../controllers/staffController');

router.route('/')
  .get(getAllStaff)
  .post(createStaff);

router.route('/:id/credentials')
  .get(getStaffCredentials);

router.route('/:id')
  .get(getStaffById)
  .put(updateStaff)
  .delete(deleteStaff);

module.exports = router;
