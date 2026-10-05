const InternalMarks = require("../models/InternalMarks");
const Class = require("../models/Class");
const { syncSubjectAssignmentMarksToInternal } = require("../services/internalMarksSyncService");

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
    if (!subjectCode) {
      return res.status(400).json({ success: false, message: "Subject code is required." });
    }

    const cleanSub = subjectCode.trim();
    const cleanNoSpaces = cleanSub.replace(/\s+/g, "");
    const subRegex = new RegExp('^(?:' + cleanSub + '|' + cleanNoSpaces + ')$', 'i');
    const nameRegex = new RegExp(cleanSub, 'i');
    const staffRegex = (staffId && staffId !== "undefined" && staffId !== "null")
      ? new RegExp('^' + staffId.trim() + '$', 'i')
      : null;

    // 1. Try finding by staffId + (subjectCode OR subjectName)
    let record = null;
    if (staffRegex) {
      record = await InternalMarks.findOne({
        staffId: staffRegex,
        $or: [{ subjectCode: subRegex }, { subjectName: nameRegex }]
      });
    }
    // 2. If not found by staffId, fallback to subjectCode or subjectName alone across all staff
    if (!record) {
      record = await InternalMarks.findOne({
        $or: [{ subjectCode: subRegex }, { subjectName: nameRegex }]
      });
    }

    // If the found record is an empty test record (e.g. code length < 3 and 0 students), treat as null to search deeper
    if (record && record.subjectCode && record.subjectCode.length < 3 && (!record.students || record.students.length === 0)) {
      record = null;
    }

    // 3. If record doesn't exist or has no students, attempt to sync from assignments
    if (!record || !record.students || record.students.length === 0) {
      const synced = await syncSubjectAssignmentMarksToInternal(record?.staffId || staffId, cleanSub);
      if (synced) {
        record = synced;
      }
    }

    if (!record) {
      // Check if Class exists with students roster
      const classDoc = await Class.findOne({
        $or: [{ code: subRegex }, { name: nameRegex }]
      });
      const classStudents = (classDoc && Array.isArray(classDoc.students))
        ? classDoc.students.map(s => ({
            rollNo: s.rollNo,
            name: s.name,
            cia1: null,
            cia2: null,
            model: null,
            assignment: null,
            attendance: null,
            consolidated: null
          }))
        : [];

      const canonicalCode = classDoc ? classDoc.code : cleanSub.toUpperCase();
      const canonicalName = classDoc ? classDoc.name : cleanSub;

      record = {
        staffId: classDoc?.staffId || staffId || "EMP001",
        subjectCode: canonicalCode,
        subjectName: canonicalName,
        department: classDoc ? classDoc.dept : "",
        semester: classDoc ? classDoc.semester : 1,
        students: classStudents,
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

// POST /api/internal-marks/:staffId/:subjectCode/sync-assignments
// Manually / explicitly sync marks from Assignment portal for this subject into InternalMarks
const syncAssignmentsToInternalMarks = async (req, res) => {
  try {
    const { staffId, subjectCode } = req.params;
    if (!subjectCode) {
      return res.status(400).json({ success: false, message: "Subject code is required." });
    }
    const cleanSub = subjectCode.trim();
    const record = await syncSubjectAssignmentMarksToInternal(staffId, cleanSub);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: `No assignments or submissions found for subject "${cleanSub}".`
      });
    }

    const studentsWithMarks = (record.students || []).filter(s => s.assignment !== null && s.assignment !== undefined);

    res.json({
      success: true,
      data: record,
      message: `Synced assignment marks for ${studentsWithMarks.length} student(s) for "${cleanSub}".`
    });
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

    const cleanSub = (subjectCode || "").trim().toUpperCase();
    const cleanNoSpaces = cleanSub.replace(/\s+/g, "");
    const subRegex = new RegExp('^(?:' + cleanSub + '|' + cleanNoSpaces + ')$', 'i');
    const staffRegex = (staffId && staffId !== "undefined" && staffId !== "null")
      ? new RegExp('^' + staffId.trim() + '$', 'i')
      : null;

    let targetStaffId = (staffId && staffId !== "undefined" && staffId !== "null") ? staffId.trim() : "EMP001";
    let existing = null;
    if (staffRegex) {
      existing = await InternalMarks.findOne({ staffId: staffRegex, subjectCode: subRegex });
    }
    if (!existing) {
      existing = await InternalMarks.findOne({ subjectCode: subRegex });
    }
    if (existing && existing.staffId) {
      targetStaffId = existing.staffId;
    }

    const updateFields = {
      staffId:      targetStaffId,
      subjectCode:  cleanSub,
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

    const updateFilter = existing ? { _id: existing._id } : { staffId: targetStaffId, subjectCode: cleanSub };
    const record = await InternalMarks.findOneAndUpdate(
      updateFilter,
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

    const cleanSub = (subjectCode || "").trim().toUpperCase();
    const cleanNoSpaces = cleanSub.replace(/\s+/g, "");
    const subRegex = new RegExp('^(?:' + cleanSub + '|' + cleanNoSpaces + ')$', 'i');

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

    const existing = await InternalMarks.findOne({
      $or: [{ subjectCode: subRegex }, { subjectCode: cleanSub }]
    });

    const filter = existing ? { _id: existing._id } : { subjectCode: cleanSub };
    const record = await InternalMarks.findOneAndUpdate(
      filter,
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

    const cleanSub = (subjectCode || "").trim().toUpperCase();
    const cleanNoSpaces = cleanSub.replace(/\s+/g, "");
    const subRegex = new RegExp('^(?:' + cleanSub + '|' + cleanNoSpaces + ')$', 'i');

    const existing = await InternalMarks.findOne({
      $or: [{ subjectCode: subRegex }, { subjectCode: cleanSub }]
    });

    if (!existing) return res.status(404).json({ success: false, message: "Marksheet not found." });

    const record = await InternalMarks.findOneAndUpdate(
      { _id: existing._id },
      { $set: { isLocked: lock, lockedAt: lock ? new Date() : null } },
      { new: true }
    );
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
    const records = await InternalMarks.find({
      staffId,
      $or: [
        { subjectCode: { $regex: /^.{3,}$/ } },
        { "students.0": { $exists: true } }
      ]
    }).select("-students");
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/internal-marks
// List all marksheets with students for admin/super-admin view
const getAllInternalMarks = async (req, res) => {
  try {
    const { department, semester, subjectCode } = req.query;
    const filter = {};
    if (department && department !== 'All Departments') filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (subjectCode) filter.subjectCode = subjectCode.trim();

    const marksheets = await InternalMarks.find(filter).sort({ department: 1, subjectCode: 1 });
    res.json({ success: true, count: marksheets.length, data: marksheets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { 
  getMarksheet, 
  saveMarksheet, 
  updateMaxMarks, 
  toggleLock, 
  listMarksheets,
  syncAssignmentsToInternalMarks,
  getAllInternalMarks
};

