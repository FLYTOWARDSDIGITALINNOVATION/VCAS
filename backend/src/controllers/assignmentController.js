const Assignment = require("../models/Assignment");

// GET /api/assignments/:staffId  — list all assignments for a staff
const listAssignments = async (req, res) => {
  try {
    const { staffId } = req.params;
    const records = await Assignment.find({ staffId }).sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/assignments/:staffId  — create a new assignment
const createAssignment = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { staffName, subjectCode, subjectName, department, semester, academicYear,
            title, description, dueDate, totalMarks } = req.body;

    if (!title || !dueDate || !subjectCode) {
      return res.status(400).json({ success: false, message: "title, dueDate and subjectCode are required." });
    }

    const assignment = await Assignment.create({
      staffId, staffName, subjectCode, subjectName,
      department, semester, academicYear,
      title, description, dueDate, totalMarks: totalMarks || 20,
      status: "Active", submissions: 0,
    });
    res.status(201).json({ success: true, data: assignment, message: "Assignment created." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/assignments/:staffId/:id/status  — toggle Active/Closed
const toggleStatus = async (req, res) => {
  try {
    const { staffId, id } = req.params;
    const assignment = await Assignment.findOne({ _id: id, staffId });
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });

    assignment.status = assignment.status === "Active" ? "Closed" : "Active";
    await assignment.save();
    res.json({ success: true, data: assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/assignments/:staffId/:id  — delete an assignment
const deleteAssignment = async (req, res) => {
  try {
    const { staffId, id } = req.params;
    const result = await Assignment.findOneAndDelete({ _id: id, staffId });
    if (!result) return res.status(404).json({ success: false, message: "Assignment not found." });
    res.json({ success: true, message: "Assignment deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { listAssignments, createAssignment, toggleStatus, deleteAssignment };
