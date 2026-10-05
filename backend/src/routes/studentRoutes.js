const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentCredentials
} = require('../controllers/studentController');

router.route('/')
  .get(getAllStudents)
  .post(createStudent);

router.route('/:id/credentials')
  .get(getStudentCredentials);

router.route('/:id')
  .get(getStudentById)
  .put(updateStudent)
  .delete(deleteStudent);

module.exports = router;
