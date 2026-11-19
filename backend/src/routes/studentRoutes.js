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
  bulkDeleteStudents,
  getStudentCredentials,
  bulkImportStudents,
  uploadExcelStudents,
  getSemesterInfo,
  migrateBatchFields,
  fixBatchFromAcademicYear
} = require('../controllers/studentController');

router.route('/')
  .get(getAllStudents)
  .post(createStudent);

// Bulk student operations
router.post('/bulk', bulkImportStudents);
router.post('/bulk-delete', bulkDeleteStudents);
router.delete('/bulk', bulkDeleteStudents);
router.post('/upload-excel', upload.single('file'), uploadExcelStudents);

// One-time migration: backfill batch fields for existing students
// Supports both GET (browser-friendly) and POST
router.get('/migrate-batch-fields', migrateBatchFields);
router.post('/migrate-batch-fields', migrateBatchFields);

// One-time fix: recalculate batch from academicYear + year columns (Excel-sourced)
router.get('/fix-batch-from-academic-year', fixBatchFromAcademicYear);
router.post('/fix-batch-from-academic-year', fixBatchFromAcademicYear);

router.route('/:id/credentials')
  .get(getStudentCredentials);

router.route('/:id/semester-info')
  .get(getSemesterInfo);

router.route('/:id')
  .get(getStudentById)
  .put(updateStudent)
  .delete(deleteStudent);

module.exports = router;

