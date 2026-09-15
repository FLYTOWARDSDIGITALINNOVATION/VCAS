const express = require("express");
const router  = express.Router();
const {
  getMarksheet,
  saveMarksheet,
  updateMaxMarks,
  toggleLock,
  listMarksheets,
} = require("../controllers/internalMarksController");

// GET  /api/internal-marks/:staffId                     - list all marksheets (no students)
router.get("/:staffId",                           listMarksheets);

// GET  /api/internal-marks/:staffId/:subjectCode        - get full marksheet
router.get("/:staffId/:subjectCode",              getMarksheet);

// POST /api/internal-marks/:staffId/:subjectCode/save   - upsert marks & max marks
router.post("/:staffId/:subjectCode/save",        saveMarksheet);

// PATCH /api/internal-marks/:staffId/:subjectCode/max-marks - update max marks settings
router.patch("/:staffId/:subjectCode/max-marks",  updateMaxMarks);

// PATCH /api/internal-marks/:staffId/:subjectCode/lock  - lock/unlock
router.patch("/:staffId/:subjectCode/lock",       toggleLock);

module.exports = router;
