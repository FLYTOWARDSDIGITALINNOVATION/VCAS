const express = require("express");
const router  = express.Router();
const {
  listAssignments,
  createAssignment,
  toggleStatus,
  deleteAssignment,
} = require("../controllers/assignmentController");

// GET    /api/assignments/:staffId                — list all
router.get("/:staffId",                     listAssignments);

// POST   /api/assignments/:staffId                — create
router.post("/:staffId",                    createAssignment);

// PATCH  /api/assignments/:staffId/:id/status     — toggle Active/Closed
router.patch("/:staffId/:id/status",        toggleStatus);

// DELETE /api/assignments/:staffId/:id            — delete
router.delete("/:staffId/:id",              deleteAssignment);

module.exports = router;
