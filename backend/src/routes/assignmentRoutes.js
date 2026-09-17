const express = require("express");
const router  = express.Router();
const {
  getAllAssignments,
  listAssignments,
  createAssignment,
  toggleStatus,
  updateAssignment,
  deleteAssignment,
} = require("../controllers/assignmentController");

// Admin routes
// GET    /api/assignments                         - list all across all staff
router.get("/",                             getAllAssignments);

// POST   /api/assignments                         - create
router.post("/",                            createAssignment);

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

// DELETE /api/assignments/:staffId/:id            - delete
router.delete("/:staffId/:id",              deleteAssignment);

module.exports = router;
