const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer memory storage for Excel file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentCredentials,
  bulkImportStudents,
  uploadExcelStudents
} = require('../controllers/studentController');

router.route('/')
  .get(getAllStudents)
  .post(createStudent);

// Bulk student operations
router.post('/bulk', bulkImportStudents);
router.post('/upload-excel', upload.single('file'), uploadExcelStudents);

router.route('/:id/credentials')
  .get(getStudentCredentials);

router.route('/:id')
  .get(getStudentById)
  .put(updateStudent)
  .delete(deleteStudent);

module.exports = router;

