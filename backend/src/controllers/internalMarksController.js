const InternalMarks = require("../models/InternalMarks");
const Class = require("../models/Class");
const Student = require("../models/Student");
const { syncSubjectAssignmentMarksToInternal } = require("../services/internalMarksSyncService");

const DEFAULT_MAX_MARKS = {
  st1: 20,
  st2: 20,
  st3: 20,
  st4: 20,
  it1: 25,
  it2: 25,
  cia1: 50,
  cia2: 50,
  model: 75,
  project: 20,
  assignment1: 5,
  assignment2: 5,
  assignment3: 5,
  assignment4: 5,
  assignment: 20,
  attendance: 5,
  consolidated: 25,
};

const DEFAULT_PASS_MARKS = {
  st1: 8,
  st2: 8,
  st3: 8,
  st4: 8,
  it1: 10,
  it2: 10,
  cia1: 20,
  cia2: 20,
  model: 30,
  project: 8,
  assignment1: 2,
  assignment2: 2,
  assignment3: 2,
  assignment4: 2,
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

    const Student = require("../models/Student");
    const Subject = require("../models/Subject");
    const matchingClasses = await Class.find({
      $or: [
        { code: subRegex },
        { name: nameRegex },
        { classCode: subRegex },
        { className: nameRegex }
      ]
    });
    const classDoc = matchingClasses[0] || null;
    const subjectDoc = await Subject.findOne({
      $or: [{ code: subRegex }, { name: nameRegex }]
    });

    // Fetch real registered students from Student collection
    const realStudents = await Student.find({});
    const realRollMap = new Map();
    realStudents.forEach(st => {
      if (st.rollNo) realRollMap.set(st.rollNo.toUpperCase().trim(), st);
      if (st.regNo) realRollMap.set(st.regNo.toUpperCase().trim(), st);
    });

    // Collect all class students across matching classes
    const allEnrolledClassStudents = [];
    matchingClasses.forEach(cls => {
      const cList = (cls.students && cls.students.length > 0) ? cls.students : (cls.enrolledStudents || []);
      cList.forEach(s => {
        if (s.rollNo && s.rollNo.trim()) {
          allEnrolledClassStudents.push(s);
        }
      });
    });

    if (!record) {
      const classStudents = allEnrolledClassStudents.map(s => ({
        rollNo: s.rollNo.toUpperCase().trim(),
        name: realRollMap.get(s.rollNo.toUpperCase().trim())?.name || s.name || s.rollNo,
        st1: null, st2: null, st3: null, st4: null,
        it1: null, it2: null, cia1: null, cia2: null,
        model: null, project: null,
        assignment1: null, assignment2: null, assignment3: null, assignment4: null,
        assignment: null, attendance: null, consolidated: null
      }));

      const canonicalCode = subjectDoc?.code || classDoc?.code || cleanSub.toUpperCase();
      const canonicalName = subjectDoc?.name || classDoc?.name || cleanSub;

      record = {
        staffId: classDoc?.staffId || staffId || "EMP001",
        subjectCode: canonicalCode,
        subjectName: canonicalName,
        department: subjectDoc?.department || classDoc?.dept || "Computer Science",
        semester: subjectDoc ? (Number(String(subjectDoc.sem).replace(/\D/g, '')) || 1) : (classDoc ? classDoc.semester : 1),
        students: classStudents,
        isLocked: false,
        maxMarks: DEFAULT_MAX_MARKS,
        passMarks: DEFAULT_PASS_MARKS,
      };
    } else {
      if (!record.maxMarks) record.maxMarks = DEFAULT_MAX_MARKS;
      if (!record.passMarks) record.passMarks = DEFAULT_PASS_MARKS;

      // 1. Keep ALL existing marksheet students (enrich names from Student collection if available)
      const studentMap = new Map();
      (record.students || []).forEach(s => {
        const roll = (s.rollNo || '').toUpperCase().trim();
        if (!roll) return;
        const realInfo = realRollMap.get(roll);
        studentMap.set(roll, {
          ...(s.toObject ? s.toObject() : s),
          name: realInfo ? realInfo.name : (s.name || roll)
        });
      });

      // 2. Add enrolled class students if not already in marksheet
      allEnrolledClassStudents.forEach(cs => {
        const roll = (cs.rollNo || '').toUpperCase().trim();
        if (roll && !studentMap.has(roll)) {
          studentMap.set(roll, {
            rollNo: cs.rollNo,
            name: realRollMap.get(roll)?.name || cs.name || cs.rollNo,
            st1: null, st2: null, st3: null, st4: null,
            it1: null, it2: null, cia1: null, cia2: null,
            model: null, project: null,
            assignment1: null, assignment2: null, assignment3: null, assignment4: null,
            assignment: null, attendance: null, consolidated: null
          });
        }
      });
      record.students = Array.from(studentMap.values());

      // Save sanitized students back to the marksheet
      if (record._id) {
        await InternalMarks.findByIdAndUpdate(record._id, { 
          students: record.students,
          subjectName: classDoc?.name || record.subjectName
        });
      }
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
      year:         req.body.year || (semester ? (semester <= 2 ? 'I Year' : semester <= 4 ? 'II Year' : 'III Year') : 'I Year'),
      academicYear: academicYear || "",
      students:     students     || [],
    };

    if (maxMarks) {
      updateFields.maxMarks = {
        st1: Number(maxMarks.st1) > 0 ? Number(maxMarks.st1) : 20,
        st2: Number(maxMarks.st2) > 0 ? Number(maxMarks.st2) : 20,
        st3: Number(maxMarks.st3) > 0 ? Number(maxMarks.st3) : 20,
        st4: Number(maxMarks.st4) > 0 ? Number(maxMarks.st4) : 20,
        it1: Number(maxMarks.it1) > 0 ? Number(maxMarks.it1) : 25,
        it2: Number(maxMarks.it2) > 0 ? Number(maxMarks.it2) : 25,
        cia1: Number(maxMarks.cia1) > 0 ? Number(maxMarks.cia1) : 50,
        cia2: Number(maxMarks.cia2) > 0 ? Number(maxMarks.cia2) : 50,
        model: Number(maxMarks.model) > 0 ? Number(maxMarks.model) : 75,
        seminar: Number(maxMarks.seminar) > 0 ? Number(maxMarks.seminar) : 10,
        project: Number(maxMarks.project) > 0 ? Number(maxMarks.project) : 20,
        assignment1: Number(maxMarks.assignment1) > 0 ? Number(maxMarks.assignment1) : 5,
        assignment2: Number(maxMarks.assignment2) > 0 ? Number(maxMarks.assignment2) : 5,
        assignment3: Number(maxMarks.assignment3) > 0 ? Number(maxMarks.assignment3) : 5,
        assignment4: Number(maxMarks.assignment4) > 0 ? Number(maxMarks.assignment4) : 5,
        assignment: Number(maxMarks.assignment) > 0 ? Number(maxMarks.assignment) : 20,
        attendance: Number(maxMarks.attendance) > 0 ? Number(maxMarks.attendance) : 5,
        consolidated: Number(maxMarks.consolidated) > 0 ? Number(maxMarks.consolidated) : 25,
      };
    }

    if (passMarks) {
      updateFields.passMarks = {
        st1: Number(passMarks.st1) >= 0 ? Number(passMarks.st1) : 8,
        st2: Number(passMarks.st2) >= 0 ? Number(passMarks.st2) : 8,
        st3: Number(passMarks.st3) >= 0 ? Number(passMarks.st3) : 8,
        st4: Number(passMarks.st4) >= 0 ? Number(passMarks.st4) : 8,
        it1: Number(passMarks.it1) >= 0 ? Number(passMarks.it1) : 10,
        it2: Number(passMarks.it2) >= 0 ? Number(passMarks.it2) : 10,
        cia1: Number(passMarks.cia1) >= 0 ? Number(passMarks.cia1) : 20,
        cia2: Number(passMarks.cia2) >= 0 ? Number(passMarks.cia2) : 20,
        model: Number(passMarks.model) >= 0 ? Number(passMarks.model) : 30,
        seminar: Number(passMarks.seminar) >= 0 ? Number(passMarks.seminar) : 4,
        project: Number(passMarks.project) >= 0 ? Number(passMarks.project) : 8,
        assignment1: Number(passMarks.assignment1) >= 0 ? Number(passMarks.assignment1) : 2,
        assignment2: Number(passMarks.assignment2) >= 0 ? Number(passMarks.assignment2) : 2,
        assignment3: Number(passMarks.assignment3) >= 0 ? Number(passMarks.assignment3) : 2,
        assignment4: Number(passMarks.assignment4) >= 0 ? Number(passMarks.assignment4) : 2,
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
        st1: Number(maxMarks?.st1) > 0 ? Number(maxMarks.st1) : 20,
        st2: Number(maxMarks?.st2) > 0 ? Number(maxMarks.st2) : 20,
        st3: Number(maxMarks?.st3) > 0 ? Number(maxMarks.st3) : 20,
        st4: Number(maxMarks?.st4) > 0 ? Number(maxMarks.st4) : 20,
        it1: Number(maxMarks?.it1) > 0 ? Number(maxMarks.it1) : 25,
        it2: Number(maxMarks?.it2) > 0 ? Number(maxMarks.it2) : 25,
        cia1: Number(maxMarks?.cia1) > 0 ? Number(maxMarks.cia1) : 50,
        cia2: Number(maxMarks?.cia2) > 0 ? Number(maxMarks.cia2) : 50,
        model: Number(maxMarks?.model) > 0 ? Number(maxMarks.model) : 75,
        project: Number(maxMarks?.project) > 0 ? Number(maxMarks.project) : 20,
        assignment1: Number(maxMarks?.assignment1) > 0 ? Number(maxMarks.assignment1) : 5,
        assignment2: Number(maxMarks?.assignment2) > 0 ? Number(maxMarks.assignment2) : 5,
        assignment3: Number(maxMarks?.assignment3) > 0 ? Number(maxMarks.assignment3) : 5,
        assignment4: Number(maxMarks?.assignment4) > 0 ? Number(maxMarks.assignment4) : 5,
        assignment: Number(maxMarks?.assignment) > 0 ? Number(maxMarks.assignment) : 20,
        attendance: Number(maxMarks?.attendance) > 0 ? Number(maxMarks.attendance) : 5,
        consolidated: Number(maxMarks?.consolidated) > 0 ? Number(maxMarks.consolidated) : 25,
      };
    }

    if (passMarks) {
      $set.passMarks = {
        st1: Number(passMarks?.st1) >= 0 ? Number(passMarks.st1) : 8,
        st2: Number(passMarks?.st2) >= 0 ? Number(passMarks.st2) : 8,
        st3: Number(passMarks?.st3) >= 0 ? Number(passMarks.st3) : 8,
        st4: Number(passMarks?.st4) >= 0 ? Number(passMarks.st4) : 8,
        it1: Number(passMarks?.it1) >= 0 ? Number(passMarks.it1) : 10,
        it2: Number(passMarks?.it2) >= 0 ? Number(passMarks.it2) : 10,
        cia1: Number(passMarks?.cia1) >= 0 ? Number(passMarks.cia1) : 20,
        cia2: Number(passMarks?.cia2) >= 0 ? Number(passMarks.cia2) : 20,
        model: Number(passMarks?.model) >= 0 ? Number(passMarks.model) : 30,
        project: Number(passMarks?.project) >= 0 ? Number(passMarks.project) : 8,
        assignment1: Number(passMarks?.assignment1) >= 0 ? Number(passMarks.assignment1) : 2,
        assignment2: Number(passMarks?.assignment2) >= 0 ? Number(passMarks.assignment2) : 2,
        assignment3: Number(passMarks?.assignment3) >= 0 ? Number(passMarks.assignment3) : 2,
        assignment4: Number(passMarks?.assignment4) >= 0 ? Number(passMarks.assignment4) : 2,
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

// DELETE /api/internal-marks/:subjectCode
// Delete a marksheet by subjectCode
const deleteMarksheet = async (req, res) => {
  try {
    const { subjectCode } = req.params;
    const cleanSub = (subjectCode || "").trim().toUpperCase();
    await InternalMarks.deleteMany({
      $or: [{ subjectCode: cleanSub }, { subjectCode: new RegExp('^' + cleanSub + '$', 'i') }]
    });
    res.json({ success: true, message: `Marksheet ${cleanSub} deleted successfully.` });
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

// @desc    Get all internal marks records for an individual student
// @route   GET /api/internal-marks/student/:identifier
const getStudentInternalMarks = async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({ success: false, message: "Student identifier required." });
    }
    const idClean = identifier.trim();
    const idRegex = new RegExp('^' + idClean + '$', 'i');

    const Student = require("../models/Student");
    const student = await Student.findOne({
      $or: [
        { rollNo: idRegex },
        { regNo: idRegex },
        { studentId: idRegex },
        { loginId: idRegex },
        { admNo: idRegex }
      ]
    });

    const rollNo = student ? (student.rollNo || idClean) : idClean;
    const regNo = student ? (student.regNo || idClean) : idClean;
    const rLower = rollNo.toLowerCase();
    const regLower = regNo.toLowerCase();

    const Subject = require("../models/Subject");
    const name = student ? (student.name || student.fullName || '') : '';
    const nameLower = name.trim().toLowerCase();

    const marksheets = await InternalMarks.find({}).sort({ subjectCode: 1 });
    const studentMarksList = [];
    const processedSubjectCodes = new Set();

    marksheets.forEach(ms => {
      const stRec = (ms.students || []).find(s => {
        const sr = (s.rollNo || '').toLowerCase();
        const srg = (s.regNo || '').toLowerCase();
        const sn = (s.name || s.studentName || '').trim().toLowerCase();
        return sr === rLower || sr === regLower || srg === rLower || srg === regLower || sr === idClean.toLowerCase() || (nameLower && sn && sn === nameLower);
      });

      const isDeptMatch = student && ms.department && (
        ms.department.toLowerCase().includes((student.department || '').toLowerCase()) ||
        (student.department || '').toLowerCase().includes(ms.department.toLowerCase())
      );

      // Include if student record exists or if this subject belongs to student's department
      if (stRec || isDeptMatch) {
        const max = ms.maxMarks || DEFAULT_MAX_MARKS;
        const pass = ms.passMarks || DEFAULT_PASS_MARKS;
        const marks = stRec || {};

        processedSubjectCodes.add((ms.subjectCode || '').toUpperCase().trim());
        studentMarksList.push({
          marksheetId: ms._id,
          subjectCode: ms.subjectCode,
          subjectName: ms.subjectName || ms.subjectCode,
          staffId: ms.staffId,
          staffName: ms.staffName,
          department: ms.department || student?.department || 'Computer Science',
          semester: ms.semester || 1,
          academicYear: ms.academicYear,
          isLocked: ms.isLocked,
          maxMarks: max,
          passMarks: pass,
          marks: {
            st1: marks.st1 ?? null,
            st2: marks.st2 ?? null,
            st3: marks.st3 ?? null,
            st4: marks.st4 ?? null,
            it1: marks.it1 ?? null,
            it2: marks.it2 ?? null,
            cia1: marks.cia1 ?? null,
            cia2: marks.cia2 ?? null,
            model: marks.model ?? null,
            seminar: marks.seminar ?? null,
            project: marks.project ?? null,
            assignment1: marks.assignment1 ?? null,
            assignment2: marks.assignment2 ?? null,
            assignment3: marks.assignment3 ?? null,
            assignment4: marks.assignment4 ?? null,
            assignment: marks.assignment ?? null,
            attendance: marks.attendance ?? null,
            consolidated: marks.consolidated ?? null
          }
        });
      }
    });

    // Also include active subjects from the Subject catalog for the student's department/course
    try {
      const deptRegex = student?.department ? new RegExp(student.department.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
      const query = deptRegex ? { $or: [{ department: deptRegex }, { department: { $exists: false } }] } : {};
      const allSubjects = await Subject.find(query).sort({ code: 1 });

      allSubjects.forEach(sub => {
        const sCode = (sub.code || sub.subjectCode || '').toUpperCase().trim();
        if (sCode && !processedSubjectCodes.has(sCode)) {
          processedSubjectCodes.add(sCode);
          studentMarksList.push({
            marksheetId: sub._id,
            subjectCode: sub.code || sub.subjectCode,
            subjectName: sub.name || sub.subjectName || sub.code,
            staffId: sub.facultyId || '',
            staffName: sub.faculty || 'Department Faculty',
            department: sub.department || student?.department || 'Computer Science',
            semester: sub.sem ? (parseInt(String(sub.sem).replace(/\D/g, '')) || 1) : 1,
            academicYear: student?.academicYear || '2025-2026',
            isLocked: false,
            maxMarks: DEFAULT_MAX_MARKS,
            passMarks: DEFAULT_PASS_MARKS,
            marks: {
              st1: null,
              st2: null,
              st3: null,
              st4: null,
              it1: null,
              it2: null,
              cia1: null,
              cia2: null,
              model: null,
              seminar: null,
              project: null,
              assignment1: null,
              assignment2: null,
              assignment3: null,
              assignment4: null,
              assignment: null,
              attendance: null,
              consolidated: null
            }
          });
        }
      });
    } catch (subErr) {
      console.warn("Could not fetch supplementary subjects:", subErr.message);
    }

    res.json({
      success: true,
      student: {
        rollNo,
        regNo,
        name: student ? (student.name || student.fullName) : ''
      },
      count: studentMarksList.length,
      marksheets: studentMarksList,
      data: studentMarksList
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/internal-marks/:staffId/:subjectCode/submit-approval
// Staff submits marksheet for approval (First stage: HOD)
const submitMarksheetForApproval = async (req, res) => {
  try {
    const { staffId, subjectCode } = req.params;
    const cleanSub = (subjectCode || "").trim().toUpperCase();
    const cleanNoSpaces = cleanSub.replace(/\s+/g, "");
    const subRegex = new RegExp('^(?:' + cleanSub + '|' + cleanNoSpaces + ')$', 'i');

    const marksheet = await InternalMarks.findOne({ subjectCode: subRegex });
    if (!marksheet) {
      return res.status(404).json({ success: false, message: "Marksheet not found." });
    }

    marksheet.approvalStatus = 'Pending HOD';
    marksheet.currentApprovalStage = 'HOD';
    marksheet.isLocked = true;
    marksheet.lockedAt = new Date();
    marksheet.hodApproval = { status: 'Pending', approvedBy: '', approvedAt: null, remarks: '' };
    marksheet.principalApproval = { status: 'Pending', approvedBy: '', approvedAt: null, remarks: '' };
    marksheet.mdApproval = { status: 'Pending', approvedBy: '', approvedAt: null, remarks: '' };

    await marksheet.save();

    res.json({
      success: true,
      message: "Marksheet submitted for approval! First stage: HOD review.",
      data: marksheet
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/internal-marks/:staffId/:subjectCode/stage-approval
// Multi-tier stage approval (Order: HOD -> Principal -> MD)
const approveMarksheetStage = async (req, res) => {
  try {
    const { staffId, subjectCode } = req.params;
    const { stage, action, approvedBy, remarks } = req.body; // stage: 'HOD' | 'Principal' | 'MD', action: 'Approved' | 'Rejected'

    const cleanSub = (subjectCode || "").trim().toUpperCase();
    const cleanNoSpaces = cleanSub.replace(/\s+/g, "");
    const subRegex = new RegExp('^(?:' + cleanSub + '|' + cleanNoSpaces + ')$', 'i');

    const marksheet = await InternalMarks.findOne({ subjectCode: subRegex });
    if (!marksheet) {
      return res.status(404).json({ success: false, message: "Marksheet not found." });
    }

    const reviewerName = approvedBy || stage;
    const reviewRemarks = remarks || '';

    if (action === 'Rejected') {
      if (stage === 'HOD') {
        marksheet.hodApproval = { status: 'Rejected', approvedBy: reviewerName, approvedAt: new Date(), remarks: reviewRemarks };
      } else if (stage === 'Principal') {
        marksheet.principalApproval = { status: 'Rejected', approvedBy: reviewerName, approvedAt: new Date(), remarks: reviewRemarks };
      } else if (stage === 'MD') {
        marksheet.mdApproval = { status: 'Rejected', approvedBy: reviewerName, approvedAt: new Date(), remarks: reviewRemarks };
      }
      marksheet.approvalStatus = 'Rejected';
      marksheet.currentApprovalStage = 'Rejected';
      marksheet.isLocked = false; // unlock so staff can make corrections if rejected
    } else {
      // Stage Approved in order: HOD -> Principal -> MD
      if (stage === 'HOD') {
        marksheet.hodApproval = { status: 'Approved', approvedBy: reviewerName, approvedAt: new Date(), remarks: reviewRemarks };
        marksheet.approvalStatus = 'Pending Principal';
        marksheet.currentApprovalStage = 'Principal';
      } else if (stage === 'Principal') {
        marksheet.principalApproval = { status: 'Approved', approvedBy: reviewerName, approvedAt: new Date(), remarks: reviewRemarks };
        marksheet.approvalStatus = 'Pending MD';
        marksheet.currentApprovalStage = 'MD';
      } else if (stage === 'MD') {
        marksheet.mdApproval = { status: 'Approved', approvedBy: reviewerName, approvedAt: new Date(), remarks: reviewRemarks };
        marksheet.approvalStatus = 'Approved';
        marksheet.currentApprovalStage = 'Completed';
      }
    }

    await marksheet.save();

    res.json({
      success: true,
      message: `Marksheet ${action === 'Rejected' ? 'rejected' : 'approved'} by ${stage}. Current status: ${marksheet.approvalStatus}.`,
      data: marksheet
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/internal-marks/export/filtered
// Subject-wise, Department-wise, Year-wise, Batch-wise, and Sem-wise marks export
const getFilteredInternalMarks = async (req, res) => {
  try {
    const { department, year, semester, subjectCode, academicYear, batch } = req.query;

    const filter = {};
    if (department && department !== 'All' && department !== 'All Departments') {
      filter.department = { $regex: new RegExp(department.trim(), 'i') };
    }
    if (subjectCode && subjectCode !== 'All') {
      filter.subjectCode = { $regex: new RegExp(subjectCode.trim(), 'i') };
    }
    if (semester && semester !== 'All') {
      filter.semester = Number(semester);
    }
    if (year && year !== 'All') {
      filter.$or = [
        { year: { $regex: new RegExp(year.trim(), 'i') } },
        { academicYear: { $regex: new RegExp(year.trim(), 'i') } }
      ];
    }
    if (academicYear && academicYear !== 'All') {
      filter.academicYear = { $regex: new RegExp(academicYear.trim(), 'i') };
    }

    let marksheets = await InternalMarks.find(filter).sort({ department: 1, semester: 1, subjectCode: 1 });

    // If batch filter is provided, filter students inside marksheets
    if (batch && batch !== 'All') {
      const batchStudents = await Student.find({ batch: { $regex: new RegExp(batch.trim(), 'i') } }).select('rollNo regNo');
      const rollSet = new Set(batchStudents.map(s => (s.rollNo || s.regNo || '').toUpperCase().trim()).filter(Boolean));
      
      marksheets = marksheets.map(ms => {
        const obj = ms.toObject ? ms.toObject() : { ...ms };
        if (Array.isArray(obj.students)) {
          obj.students = obj.students.filter(s => rollSet.has(String(s.rollNo || '').toUpperCase().trim()));
        }
        return obj;
      }).filter(ms => (ms.students || []).length > 0);
    }

    res.json({
      success: true,
      count: marksheets.length,
      data: marksheets
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/internal-marks/bulk
// Bulk save or import student marks from Excel/CSV
const bulkSaveInternalMarks = async (req, res) => {
  try {
    const { staffId, subjectCode, subjectName, department, semester, academicYear, students } = req.body;

    const cleanSub = (subjectCode || "").trim().toUpperCase();
    if (!cleanSub) {
      return res.status(400).json({ success: false, message: "Subject code is required." });
    }

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: "Students marks array cannot be empty." });
    }

    const cleanNoSpaces = cleanSub.replace(/\s+/g, "");
    const subRegex = new RegExp('^(?:' + cleanSub + '|' + cleanNoSpaces + ')$', 'i');

    let existing = await InternalMarks.findOne({ subjectCode: subRegex });
    const targetStaffId = (staffId && staffId !== "undefined") ? staffId.trim() : (existing?.staffId || "EMP001");

    // Merge existing students with uploaded students (upsert per rollNo)
    let mergedStudents = existing && Array.isArray(existing.students) ? [...existing.students] : [];
    const rollIndexMap = {};
    mergedStudents.forEach((st, idx) => {
      rollIndexMap[String(st.rollNo || '').toUpperCase().trim()] = idx;
    });

    students.forEach(uploaded => {
      const roll = String(uploaded.rollNo || uploaded.regNo || '').toUpperCase().trim();
      if (!roll) return;

      const newRec = {
        rollNo: roll,
        name: uploaded.name || uploaded.studentName || 'Student',
        it1: uploaded.it1 ?? uploaded.cia1 ?? null,
        it2: uploaded.it2 ?? uploaded.cia2 ?? null,
        cia1: uploaded.cia1 ?? uploaded.it1 ?? null,
        cia2: uploaded.cia2 ?? uploaded.it2 ?? null,
        model: uploaded.model ?? null,
        semester: uploaded.semester ?? null,
        seminar: uploaded.seminar ?? null,
        project: uploaded.project ?? null,
        st1: uploaded.st1 ?? null,
        st2: uploaded.st2 ?? null,
        st3: uploaded.st3 ?? null,
        st4: uploaded.st4 ?? null,
        assignment1: uploaded.assignment1 ?? null,
        assignment2: uploaded.assignment2 ?? null,
        assignment3: uploaded.assignment3 ?? null,
        assignment4: uploaded.assignment4 ?? null,
        assignment: uploaded.assignment ?? null,
        attendance: uploaded.attendance ?? null,
        consolidated: uploaded.consolidated ?? null
      };

      if (rollIndexMap[roll] !== undefined) {
        // Update existing student with non-null values
        const existingRec = mergedStudents[rollIndexMap[roll]];
        mergedStudents[rollIndexMap[roll]] = {
          ...existingRec,
          ...Object.fromEntries(Object.entries(newRec).filter(([_, v]) => v !== null && v !== undefined))
        };
      } else {
        mergedStudents.push(newRec);
        rollIndexMap[roll] = mergedStudents.length - 1;
      }
    });

    const updateFields = {
      staffId: targetStaffId,
      staffName: req.body.staffName || existing?.staffName || '',
      subjectCode: cleanSub,
      subjectName: subjectName || existing?.subjectName || cleanSub,
      department: department || existing?.department || 'General',
      semester: semester || existing?.semester || 1,
      academicYear: academicYear || existing?.academicYear || '2025-2026',
      students: mergedStudents
    };

    const record = await InternalMarks.findOneAndUpdate(
      existing ? { _id: existing._id } : { subjectCode: cleanSub },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: `Successfully imported marks for ${students.length} students!`,
      data: record
    });
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
  getAllInternalMarks,
  getStudentInternalMarks,
  submitMarksheetForApproval,
  approveMarksheetStage,
  getFilteredInternalMarks,
  bulkSaveInternalMarks,
  deleteMarksheet
};


