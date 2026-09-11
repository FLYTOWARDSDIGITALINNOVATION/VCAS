const InternalMarks = require("../models/InternalMarks");

// GET /api/internal-marks/:staffId/:subjectCode
// Fetch or initialise a marksheet for the staff+subject pair
const getMarksheet = async (req, res) => {
  try {
    const { staffId, subjectCode } = req.params;
    let record = await InternalMarks.findOne({ staffId, subjectCode });
    if (!record) {
      record = { staffId, subjectCode, students: [], isLocked: false };
    }
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/internal-marks/:staffId/:subjectCode/save
// Upsert the student marks array for a given staff + subject
const saveMarksheet = async (req, res) => {
  try {
    const { staffId, subjectCode } = req.params;
    const { staffName, subjectName, department, semester, academicYear, students } = req.body;

    const record = await InternalMarks.findOneAndUpdate(
      { staffId, subjectCode },
      {
        $set: {
          staffName:    staffName    || "",
          subjectName:  subjectName  || "",
          department:   department   || "",
          semester:     semester     || 1,
          academicYear: academicYear || "",
          students:     students     || [],
        }
      },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: record, message: "Marks saved successfully." });
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

module.exports = { getMarksheet, saveMarksheet, toggleLock, listMarksheets };
