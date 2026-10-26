const express = require("express");
const router  = express.Router();
const {
  getMarksheet,
  saveMarksheet,
  updateMaxMarks,
  toggleLock,
  listMarksheets,
  syncAssignmentsToInternalMarks,
  getAllInternalMarks,
  getStudentInternalMarks,
  submitMarksheetForApproval,
  approveMarksheetStage,
  getFilteredInternalMarks,
  bulkSaveInternalMarks,
  deleteMarksheet
} = require("../controllers/internalMarksController");

// GET  /api/internal-marks/export/filtered               - filter marks by subject, dept, year, batch, sem for download
router.get("/export/filtered",                     getFilteredInternalMarks);

// POST /api/internal-marks/bulk                          - bulk save student marks via Excel import
router.post("/bulk",                               bulkSaveInternalMarks);

// GET  /api/internal-marks                              - get all marksheets for Admin & Super-Admin
router.get("/",                                   getAllInternalMarks);

// GET  /api/internal-marks/student/:identifier           - get all internal marks for a specific student
router.get("/student/:identifier",                 getStudentInternalMarks);

// GET  /api/internal-marks/:staffId                     - list all marksheets (no students)
router.get("/:staffId",                           listMarksheets);

// GET  /api/internal-marks/:staffId/:subjectCode        - get full marksheet
router.get("/:staffId/:subjectCode",              getMarksheet);

// POST /api/internal-marks/:staffId/:subjectCode/sync-assignments - pull & sync marks from assignments
router.post("/:staffId/:subjectCode/sync-assignments", syncAssignmentsToInternalMarks);

// POST /api/internal-marks/:staffId/:subjectCode/save   - upsert marks & max marks
router.post("/:staffId/:subjectCode/save",        saveMarksheet);

// POST /api/internal-marks/:staffId/:subjectCode/submit-approval - submit marksheet for approval (HOD stage)
router.post("/:staffId/:subjectCode/submit-approval", submitMarksheetForApproval);

// PATCH /api/internal-marks/:staffId/:subjectCode/stage-approval - multi-tier stage approval (HOD -> Principal -> MD)
router.patch("/:staffId/:subjectCode/stage-approval", approveMarksheetStage);

// PATCH /api/internal-marks/:staffId/:subjectCode/max-marks - update max marks settings
router.patch("/:staffId/:subjectCode/max-marks",  updateMaxMarks);

// PATCH /api/internal-marks/:staffId/:subjectCode/lock  - lock/unlock
router.patch("/:staffId/:subjectCode/lock",       toggleLock);

// DELETE /api/internal-marks/:subjectCode               - delete marksheet by subjectCode
router.delete("/:subjectCode",                    deleteMarksheet);

module.exports = router;
