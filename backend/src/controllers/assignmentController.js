const Assignment = require("../models/Assignment");

// GET /api/assignments - list all assignments across all staff (for admin)
const getAllAssignments = async (req, res) => {
  try {
    const { department, status, search, staffId } = req.query;
    const query = {};
    if (staffId) {
      query.staffId = staffId;
    }
    if (department && department !== 'All Departments') {
      query.department = department;
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { subjectCode: regex },
        { subjectName: regex },
        { staffName: regex },
        { staffId: regex }
      ];
    }
    const records = await Assignment.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/assignments/:staffId  - list all assignments for a staff
const listAssignments = async (req, res) => {
  try {
    const { staffId } = req.params;
    const records = await Assignment.find({ staffId }).sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/assignments or /api/assignments/:staffId  - create a new assignment
const createAssignment = async (req, res) => {
  try {
    const staffId = req.params.staffId || req.body.staffId || "ADMIN";
    const { staffName, subjectCode, subjectName, department, semester, academicYear,
            title, description, dueDate, totalMarks, dueTime, weightage, type } = req.body;

    if (!title || !dueDate || !subjectCode) {
      return res.status(400).json({ success: false, message: "title, dueDate and subjectCode are required." });
    }

    const assignment = await Assignment.create({
      staffId,
      staffName: staffName || "Admin / Faculty",
      subjectCode: subjectCode.trim().toUpperCase(),
      subjectName: subjectName || "",
      department: department || "",
      semester: semester ? Number(semester) : 1,
      academicYear: academicYear || "",
      title: title.trim(),
      description: description || "",
      dueDate,
      totalMarks: Number(totalMarks) || 20,
      status: "Active",
      submissions: 0,
    });
    res.status(201).json({ success: true, data: assignment, message: "Assignment created." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/assignments/:id/status or /api/assignments/:staffId/:id/status  - toggle Active/Closed
const toggleStatus = async (req, res) => {
  try {
    const { staffId, id } = req.params;
    const targetId = id || staffId;
    const query = { _id: targetId };
    if (staffId && id) query.staffId = staffId;

    const assignment = await Assignment.findOne(query);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });

    assignment.status = assignment.status === "Active" ? "Closed" : "Active";
    await assignment.save();
    res.json({ success: true, data: assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/assignments/:id or /api/assignments/:staffId/:id  - update assignment fields
const updateAssignment = async (req, res) => {
  try {
    const { staffId, id } = req.params;
    const targetId = id || staffId;
    const query = { _id: targetId };
    if (staffId && id) query.staffId = staffId;

    const { subjectCode, subjectName, title, description, dueDate, totalMarks, status, department, semester, academicYear, staffName } = req.body;
    const assignment = await Assignment.findOne(query);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });

    if (subjectCode)               assignment.subjectCode  = subjectCode.trim().toUpperCase();
    if (subjectName !== undefined) assignment.subjectName  = subjectName;
    if (title)                     assignment.title        = title.trim();
    if (description !== undefined) assignment.description  = description;
    if (dueDate)                   assignment.dueDate      = dueDate;
    if (totalMarks)                assignment.totalMarks   = Number(totalMarks);
    if (status)                    assignment.status       = status;
    if (department)                assignment.department   = department;
    if (semester)                  assignment.semester     = Number(semester);
    if (academicYear)              assignment.academicYear = academicYear;
    if (staffName)                 assignment.staffName    = staffName;

    await assignment.save();
    res.json({ success: true, data: assignment, message: "Assignment updated." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/assignments/:id or /api/assignments/:staffId/:id  - delete an assignment
const deleteAssignment = async (req, res) => {
  try {
    const { staffId, id } = req.params;
    const targetId = id || staffId;
    const query = { _id: targetId };
    if (staffId && id) query.staffId = staffId;

    const result = await Assignment.findOneAndDelete(query);
    if (!result) return res.status(404).json({ success: false, message: "Assignment not found." });
    res.json({ success: true, message: "Assignment deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllAssignments, listAssignments, createAssignment, toggleStatus, updateAssignment, deleteAssignment };

