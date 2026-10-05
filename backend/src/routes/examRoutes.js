const express = require('express');
const router = express.Router();
const {
  getAllExams,
  createExam,
  updateExam,
  deleteExam,
  getHalls,
  createHall,
  updateHall,
  deleteHall
} = require('../controllers/examController');

// Halls
router.get('/halls', getHalls);
router.post('/halls', createHall);
router.put('/halls/:id', updateHall);
router.delete('/halls/:id', deleteHall);

// Exam Schedules
router.get('/', getAllExams);
router.post('/', createExam);
router.put('/:id', updateExam);
router.delete('/:id', deleteExam);

module.exports = router;
