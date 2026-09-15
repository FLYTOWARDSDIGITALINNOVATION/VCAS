const InternalMarks = require("../models/InternalMarks");

const DEFAULT_MAX_MARKS = {
  cia1: 50,
  cia2: 50,
  model: 75,
  assignment: 20,
  attendance: 5,
  consolidated: 25,
};

const DEFAULT_PASS_MARKS = {
  cia1: 20,
  cia2: 20,
  model: 30,
  assignment: 8,
  attendance: 2,
  consolidated: 10,
};

// GET /api/internal-marks/:staffId/:subjectCode
// Fetch or initialise a marksheet for the staff+subject pair
const getMarksheet = async (req, res) => {
  try {
    const { staffId, subjectCode } = req.params;
    let record = await InternalMarks.findOne({ staffId, subjectCode });
    if (!record) {
      record = {
        staffId,
        subjectCode,
        students: [],
        isLocked: false,
        maxMarks: DEFAULT_MAX_MARKS,
        passMarks: DEFAULT_PASS_MARKS,
      };
    } else {
      if (!record.maxMarks) record.maxMarks = DEFAULT_MAX_MARKS;
      if (!record.passMarks) record.passMarks = DEFAULT_PASS_MARKS;
    }
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/internal-marks/:staffId/:subjectCode/save
// Upsert student marks array + maxMarks & passMarks
const saveMarksheet = async (req, res) => {
  try {
    const { staffId, subjectCode } = req.params;
    const { staffName, subjectName, department, semester, academicYear, students, maxMarks, passMarks } = req.body;

    const updateFields = {
      staffName:    staffName    || "",
      subjectName:  subjectName  || "",
      department:   department   || "",
      semester:     semester     || 1,
      academicYear: academicYear || "",
      students:     students     || [],
    };

    if (maxMarks) {
      updateFields.maxMarks = {
        cia1: Number(maxMarks.cia1) > 0 ? Number(maxMarks.cia1) : 50,
        cia2: Number(maxMarks.cia2) > 0 ? Number(maxMarks.cia2) : 50,
        model: Number(maxMarks.model) > 0 ? Number(maxMarks.model) : 75,
        assignment: Number(maxMarks.assignment) > 0 ? Number(maxMarks.assignment) : 20,
        attendance: Number(maxMarks.attendance) > 0 ? Number(maxMarks.attendance) : 5,
        consolidated: Number(maxMarks.consolidated) > 0 ? Number(maxMarks.consolidated) : 25,
      };
    }

    if (passMarks) {
      updateFields.passMarks = {
        cia1: Number(passMarks.cia1) >= 0 ? Number(passMarks.cia1) : 20,
        cia2: Number(passMarks.cia2) >= 0 ? Number(passMarks.cia2) : 20,
        model: Number(passMarks.model) >= 0 ? Number(passMarks.model) : 30,
        assignment: Number(passMarks.assignment) >= 0 ? Number(passMarks.assignment) : 8,
        attendance: Number(passMarks.attendance) >= 0 ? Number(passMarks.attendance) : 2,
        consolidated: Number(passMarks.consolidated) >= 0 ? Number(passMarks.consolidated) : 10,
      };
    }

    const record = await InternalMarks.findOneAndUpdate(
      { staffId, subjectCode },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: record, message: "Marks and configurations saved successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/internal-marks/:staffId/:subjectCode/max-marks
// Update maxMarks and passMarks configurations
const updateMaxMarks = async (req, res) => {
  try {
    const { staffId, subjectCode } = req.params;
    const { maxMarks, passMarks } = req.body;

    const $set = {};

    if (maxMarks) {
      $set.maxMarks = {
        cia1: Number(maxMarks?.cia1) > 0 ? Number(maxMarks.cia1) : 50,
        cia2: Number(maxMarks?.cia2) > 0 ? Number(maxMarks.cia2) : 50,
        model: Number(maxMarks?.model) > 0 ? Number(maxMarks.model) : 75,
        assignment: Number(maxMarks?.assignment) > 0 ? Number(maxMarks.assignment) : 20,
        attendance: Number(maxMarks?.attendance) > 0 ? Number(maxMarks.attendance) : 5,
        consolidated: Number(maxMarks?.consolidated) > 0 ? Number(maxMarks.consolidated) : 25,
      };
    }

    if (passMarks) {
      $set.passMarks = {
        cia1: Number(passMarks?.cia1) >= 0 ? Number(passMarks.cia1) : 20,
        cia2: Number(passMarks?.cia2) >= 0 ? Number(passMarks.cia2) : 20,
        model: Number(passMarks?.model) >= 0 ? Number(passMarks.model) : 30,
        assignment: Number(passMarks?.assignment) >= 0 ? Number(passMarks.assignment) : 8,
        attendance: Number(passMarks?.attendance) >= 0 ? Number(passMarks.attendance) : 2,
        consolidated: Number(passMarks?.consolidated) >= 0 ? Number(passMarks.consolidated) : 10,
      };
    }

    const record = await InternalMarks.findOneAndUpdate(
      { staffId, subjectCode },
      { $set },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: record, message: "Marks grading criteria updated successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/internal-marks/:staffId/:subjectCode/lock
// Toggle lock/unlock a marksheet
const toggleLock = async (req, res) => {
  try {
    const { staffId, subjectCode } = req.params;
    const { lock } = req.body; // boolean

    const record = await InternalMarks.findOneAndUpdate(
      { staffId, subjectCode },
      { $set: { isLocked: lock, lockedAt: lock ? new Date() : null } },
      { new: true }
    );
    if (!record) return res.status(404).json({ success: false, message: "Marksheet not found." });
    res.json({ success: true, data: record, message: lock ? "Marks locked & submitted." : "Marks unlocked." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/internal-marks/:staffId
// List all subjects with marks for this staff
const listMarksheets = async (req, res) => {
  try {
    const { staffId } = req.params;
    const records = await InternalMarks.find({ staffId }).select("-students");
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getMarksheet, saveMarksheet, updateMaxMarks, toggleLock, listMarksheets };
