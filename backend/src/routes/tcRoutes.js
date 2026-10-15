const express = require('express');
const router = express.Router();
const {
  getAllTCs,
  getNextTCNumber,
  getStudentForTC,
  getTCById,
  createTC,
  updateTC,
  deleteTC
} = require('../controllers/tcController');

router.get('/next-number', getNextTCNumber);
router.get('/student/:regNo', getStudentForTC);

router.route('/')
  .get(getAllTCs)
  .post(createTC);

router.route('/:id')
  .get(getTCById)
  .put(updateTC)
  .delete(deleteTC);

module.exports = router;
