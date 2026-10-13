const express = require("express");
const router  = express.Router();
const {
  getAllAssignments,
  listAssignments,
  createAssignment,
  toggleStatus,
  updateAssignment,
  deleteAssignment,
  gradeSubmission,
  addStudentToAssignment,
  updateStudentSubmissionStatus,
  quickSetSubmissionsCount,
  removeStudentFromAssignment,
  importStudentsFromClass,
  getStudentAssignments,
  submitStudentAssignment
} = require("../controllers/assignmentController");

// Student-scoped routes (Registered before :staffId to prevent greedy param matching)
// GET    /api/assignments/student/:identifier     - list assignments for student
router.get("/student/:identifier",                 getStudentAssignments);

// POST   /api/assignments/:id/student/:identifier/submit - student submits assignment
router.post("/:id/student/:identifier/submit",     submitStudentAssignment);
router.post("/:id/submit",                         submitStudentAssignment);

// Admin routes
// GET    /api/assignments                         - list all across all staff
router.get("/",                             getAllAssignments);

// POST   /api/assignments                         - create
router.post("/",                            createAssignment);

// PUT    /api/assignments/:id/grade               - grade a student submission
router.put("/:id/grade",                    gradeSubmission);

// Student Roster & Submissions Management (Admin & Staff)
// POST   /api/assignments/:id/students            - add a student to assignment
router.post("/:id/students",                 addStudentToAssignment);

// PUT    /api/assignments/:id/students/:studentId/status - toggle/set submission status
router.put("/:id/students/:studentId/status", updateStudentSubmissionStatus);

// POST   /api/assignments/:id/submissions/quick-set - quick-set submission count / mark all
router.post("/:id/submissions/quick-set",    quickSetSubmissionsCount);

// DELETE /api/assignments/:id/students/:studentId - remove student from assignment
router.delete("/:id/students/:studentId",    removeStudentFromAssignment);

// POST   /api/assignments/:id/students/import-class - import roster from matching class
router.post("/:id/students/import-class",     importStudentsFromClass);

// PATCH  /api/assignments/:id/status              - toggle Active/Closed by ID
router.patch("/:id/status",                 toggleStatus);

// PUT    /api/assignments/:id                     - update fields by ID
router.put("/:id",                          updateAssignment);

// DELETE /api/assignments/:id                     - delete by ID
router.delete("/:id",                       deleteAssignment);

// Staff-scoped routes
// GET    /api/assignments/:staffId                - list all for staff
router.get("/:staffId",                     listAssignments);

// POST   /api/assignments/:staffId                - create
router.post("/:staffId",                    createAssignment);

// PATCH  /api/assignments/:staffId/:id/status     - toggle Active/Closed
router.patch("/:staffId/:id/status",        toggleStatus);

// PUT    /api/assignments/:staffId/:id            - update fields
router.put("/:staffId/:id",                 updateAssignment);

// PUT    /api/assignments/:staffId/:id/grade      - grade submission
router.put("/:staffId/:id/grade",           gradeSubmission);

// DELETE /api/assignments/:staffId/:id            - delete
router.delete("/:staffId/:id",              deleteAssignment);

module.exports = router;
