const HallTicket = require('../models/HallTicket');
const Class = require('../models/Class');
const Student = require('../models/Student');

// Helper: Normalize & deduplicate subjects array
const deduplicateSubjects = (subjects = []) => {
  if (!Array.isArray(subjects)) return [];
  const seen = new Set();
  const result = [];
  for (const s of subjects) {
    const code = (s.code || '').trim().toUpperCase();
    if (code && !seen.has(code)) {
      seen.add(code);
      result.push({
        code,
        name: (s.name || '').trim(),
        date: (s.date && s.date.trim()) ? s.date.trim() : 'TBA',
        session: (s.session || 'Forenoon (FN)').trim(),
        time: (s.time || '09:30 AM - 12:30 PM').trim()
      });
    }
  }
  return result;
};

// Helper: Normalize & deduplicate students array
const deduplicateStudents = (students = [], defaultSubjects = []) => {
  if (!Array.isArray(students)) return [];
  const seenRolls = new Set();
  const result = [];

  for (const st of students) {
    const rollNo = (st.rollNo || '').trim().toUpperCase();
    if (rollNo && !seenRolls.has(rollNo)) {
      seenRolls.add(rollNo);

      // Deduplicate student's subjects or use default subjects
      const rawSubs = (st.subjects && st.subjects.length > 0) ? st.subjects : defaultSubjects;
      const cleanSubs = deduplicateSubjects(rawSubs);

      result.push({
        rollNo,
        name: (st.name || '').trim(),
        dept: (st.dept || '').trim(),
        semester: Number(st.semester) || 1,
        section: (st.section || 'A').trim().toUpperCase(),
        hallNo: (st.hallNo || '').trim(),
        seatNo: (st.seatNo || '').trim(),
        deskNo: (st.deskNo || '').trim(),
        eligible: st.eligible !== false,
        remarks: (st.remarks || 'Eligible for Examination').trim(),
        subjects: cleanSubs
      });
    }
  }
  return result;
};

// @desc    Get metadata (available departments, semesters, sections from classes)
// @route   GET /api/hall-tickets/meta
exports.getHallTicketMeta = async (req, res) => {
  try {
    const classes = await Class.find({}, 'dept semester section code name students');
    const depts = new Set(['Computer Science', 'Information Technology', 'Commerce', 'Mathematics']);
    const semesters = new Set([1, 2, 3, 4, 5, 6, 7, 8]);
    const sections = new Set(['A', 'B', 'C', 'All']);

    classes.forEach(c => {
      if (c.dept) depts.add(c.dept);
      if (c.semester) semesters.add(Number(c.semester));
      if (c.section) sections.add(c.section);
    });

    res.status(200).json({
      success: true,
      departments: Array.from(depts),
      semesters: Array.from(semesters).sort((a, b) => a - b),
      sections: Array.from(sections)
    });
  } catch (error) {
    console.error('Error fetching meta:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all hall tickets / exam allocations
// @route   GET /api/hall-tickets
exports.getAllHallTickets = async (req, res) => {
  try {
    const { department, semester, staffId } = req.query;
    const filter = {};
    if (department && department !== 'All') {
      filter.department = { $regex: new RegExp(department.trim(), 'i') };
    }
    if (semester && semester !== 'All') filter.semester = Number(semester);
    if (staffId) filter.allocatedByStaffId = staffId;

    const allocations = await HallTicket.find(filter).sort({ createdAt: -1 });

    const seenPlans = new Set();
    const cleanList = [];

    for (const item of allocations) {
      const key = `${(item.examName || '').trim().toLowerCase()}_${(item.department || '').trim().toLowerCase()}_${item.semester}`;
      if (!seenPlans.has(key)) {
        seenPlans.add(key);
        item.students = deduplicateStudents(item.students, item.commonSubjects);
        item.commonSubjects = deduplicateSubjects(item.commonSubjects);
        cleanList.push(item);
      }
    }

    res.status(200).json({
      success: true,
      count: cleanList.length,
      data: cleanList
    });
  } catch (error) {
    console.error('Error in getAllHallTickets:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving hall tickets', error: error.message });
  }
};

// @desc    Get single hall ticket allocation by ID
// @route   GET /api/hall-tickets/:id
exports.getHallTicketById = async (req, res) => {
  try {
    const allocation = await HallTicket.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Hall allocation not found' });
    }
    allocation.students = deduplicateStudents(allocation.students, allocation.commonSubjects);
    allocation.commonSubjects = deduplicateSubjects(allocation.commonSubjects);
    res.status(200).json({ success: true, data: allocation });
  } catch (error) {
    console.error('Error in getHallTicketById:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving allocation', error: error.message });
  }
};

// @desc    Get enrolled students and subjects from classes
// @route   GET /api/hall-tickets/eligible-students
exports.getEligibleStudents = async (req, res) => {
  try {
    const { department, semester, section, subjectCode } = req.query;
    const query = {};
    if (department && department !== 'All') {
      query.dept = { $regex: new RegExp(department.trim().split(' ')[0], 'i') };
    }
    // If a specific subject is requested, query by code directly (preventing semester mismatch)
    if (subjectCode && subjectCode !== 'All') {
      query.code = subjectCode.trim().toUpperCase();
    } else {
      if (semester && semester !== 'All') query.semester = Number(semester);
      if (section && section !== 'All') query.section = section;
    }

    const classes = await Class.find(query);

    // Also fetch all classes in department (or college) so full subject list is always discovered
    const allDeptClasses = await Class.find(department && department !== 'All' ? { dept: query.dept } : {});

    const subjectsMap = new Map();
    allDeptClasses.forEach(cls => {
      const code = (cls.code || '').trim().toUpperCase();
      if (code && cls.name) {
        if (!subjectsMap.has(code)) {
          subjectsMap.set(code, {
            code,
            name: cls.name.trim(),
            date: '',
            session: 'Forenoon (FN)',
            time: '09:30 AM - 12:30 PM'
          });
        }
      }
    });

    const studentMap = new Map();
    classes.forEach(cls => {
      const code = (cls.code || '').trim().toUpperCase();
      // If a specific subject filter is requested, only take students enrolled in that subject
      if (subjectCode && subjectCode !== 'All' && code !== subjectCode.trim().toUpperCase()) {
        return;
      }

      if (Array.isArray(cls.students)) {
        cls.students.forEach(st => {
          const rollNo = (st.rollNo || '').trim().toUpperCase();
          if (rollNo) {
            const existing = studentMap.get(rollNo) || {
              rollNo,
              name: (st.name || '').trim(),
              dept: cls.dept || department || '',
              semester: cls.semester || Number(semester) || 1,
              section: (cls.section || 'A').toUpperCase(),
              subjects: []
            };

            if (code && !existing.subjects.some(s => s.code === code)) {
              existing.subjects.push({
                code,
                name: (cls.name || '').trim(),
                date: '',
                session: 'Forenoon (FN)',
                time: '09:30 AM - 12:30 PM'
              });
            }
            studentMap.set(rollNo, existing);
          }
        });
      }
    });

    // Also include students registered in the main Student collection and enrich feeStatus & attendance
    try {
      const stuFilter = {};
      if (department && department !== 'All') {
        stuFilter.department = { $regex: new RegExp(department.trim().split(' ')[0], 'i') };
      }
      const registeredStudents = await Student.find(stuFilter);
      registeredStudents.forEach(st => {
        const rollNo = (st.rollNo || st.studentId || st.regNo || '').trim().toUpperCase();
        if (rollNo && !studentMap.has(rollNo)) {
          studentMap.set(rollNo, {
            rollNo,
            regNo: st.regNo || rollNo,
            name: (st.name || '').trim(),
            dept: st.department || department || '',
            semester: st.sem ? parseInt(st.sem) || 1 : 1,
            section: st.section || 'A',
            feeStatus: st.feeStatus || 'Paid',
            attendance: st.attendance !== undefined ? st.attendance : 85,
            subjects: []
          });
        }
      });

      // Enrich all students in studentMap with feeStatus & attendance from registered records
      const allRegistered = await Student.find();
      const regMap = new Map();
      allRegistered.forEach(r => {
        const k1 = (r.rollNo || '').trim().toUpperCase();
        const k2 = (r.regNo || '').trim().toUpperCase();
        if (k1) regMap.set(k1, r);
        if (k2) regMap.set(k2, r);
      });

      studentMap.forEach((val, key) => {
        const match = regMap.get(key);
        if (match) {
          val.feeStatus = match.feeStatus || 'Paid';
          val.attendance = match.attendance !== undefined ? match.attendance : 85;
          val.regNo = match.regNo || key;
        } else {
          val.feeStatus = val.feeStatus || 'Paid';
          val.attendance = val.attendance !== undefined ? val.attendance : 85;
          val.regNo = val.regNo || key;
        }
      });
    } catch (sErr) {
      console.error('Error fetching registered students for exam eligibility:', sErr.message);
    }

    const students = Array.from(studentMap.values()).sort((a, b) => a.rollNo.localeCompare(b.rollNo));
    const availableSubjects = Array.from(subjectsMap.values());

    res.status(200).json({
      success: true,
      count: students.length,
      students,
      subjects: availableSubjects
    });
  } catch (error) {
    console.error('Error fetching eligible students:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students', error: error.message });
  }
};

// @desc    Create or update hall ticket allocation
// @route   POST /api/hall-tickets/allocate
exports.createOrUpdateAllocation = async (req, res) => {
  try {
    const {
      _id,
      examName,
      examType,
      academicYear,
      department,
      semester,
      section,
      halls,
      allocatedByStaffId,
      allocatedByStaffName,
      commonSubjects,
      students,
      instructions
    } = req.body;

    console.log('[HallTicket] Saving allocation:', {
      examName,
      department,
      semester,
      studentsCount: students ? students.length : 0
    });

    if (!examName || !examName.trim()) {
      return res.status(400).json({ success: false, message: 'Examination Title is required.' });
    }
    if (!department || !department.trim()) {
      return res.status(400).json({ success: false, message: 'Department is required.' });
    }
    if (!semester) {
      return res.status(400).json({ success: false, message: 'Semester is required.' });
    }
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one student must be added to the allocation matrix before saving.'
      });
    }

    const cleanCommonSubjects = deduplicateSubjects(commonSubjects);
    const cleanStudents = deduplicateStudents(students, cleanCommonSubjects);

    const seenHalls = new Set();
    const cleanHalls = (halls || []).filter(h => {
      const name = (h.hallNo || '').trim().toLowerCase();
      if (!name || seenHalls.has(name)) return false;
      seenHalls.add(name);
      return true;
    });

    const payload = {
      examName: examName.trim(),
      examType: examType || 'Semester End Examination',
      academicYear: (academicYear || '2025-2026').trim(),
      department: department.trim(),
      semester: Number(semester),
      section: (section || 'All').trim(),
      halls: cleanHalls,
      allocatedByStaffId: allocatedByStaffId || 'STAFF',
      allocatedByStaffName: allocatedByStaffName || 'Faculty In-Charge',
      commonSubjects: cleanCommonSubjects,
      students: cleanStudents,
      instructions: instructions && instructions.length > 0 ? instructions : [
        'Candidates must bring this Hall Ticket along with their official College ID Card to every examination.',
        'Possession of mobile phones, smartwatches, or any unauthorized electronic items inside the hall is strictly prohibited.',
        'Candidates must occupy their designated seats at least 15 minutes before the scheduled commencement.',
        'No candidate will be permitted to enter the hall after 30 minutes from the commencement of the exam.'
      ]
    };

    // Helper to merge existing allocation students with new incoming students
    const mergeWithExisting = (existingDoc) => {
      // 1. Merge common subjects
      const combinedSubjects = deduplicateSubjects([
        ...(existingDoc.commonSubjects || []),
        ...cleanCommonSubjects
      ]);

      // 2. Merge halls
      const hallMap = new Map();
      (existingDoc.halls || []).forEach(h => {
        if (h && h.hallNo) hallMap.set(h.hallNo.trim().toLowerCase(), h);
      });
      cleanHalls.forEach(h => {
        if (h && h.hallNo) hallMap.set(h.hallNo.trim().toLowerCase(), h);
      });
      const combinedHalls = Array.from(hallMap.values());

      // 3. Merge students by rollNo
      const studentMap = new Map();
      // Put all existing students first
      (existingDoc.students || []).forEach(st => {
        const roll = (st.rollNo || '').trim().toUpperCase();
        if (roll) {
          studentMap.set(roll, {
            rollNo: roll,
            name: st.name,
            dept: st.dept || existingDoc.department,
            semester: st.semester || existingDoc.semester,
            section: st.section || 'A',
            hallNo: st.hallNo,
            seatNo: st.seatNo,
            deskNo: st.deskNo,
            eligible: st.eligible !== false,
            remarks: st.remarks || 'Eligible for Examination',
            subjects: Array.isArray(st.subjects) ? [...st.subjects] : []
          });
        }
      });

      // Merge incoming students
      cleanStudents.forEach(newSt => {
        const roll = (newSt.rollNo || '').trim().toUpperCase();
        if (!roll) return;
        if (studentMap.has(roll)) {
          const current = studentMap.get(roll);
          // Update hall/seat if newly provided and valid
          if (newSt.hallNo && newSt.hallNo !== 'TBA' && newSt.hallNo !== 'Unassigned') {
            current.hallNo = newSt.hallNo;
          }
          if (newSt.seatNo && newSt.seatNo !== 'TBA') {
            current.seatNo = newSt.seatNo;
          }
          if (newSt.deskNo) current.deskNo = newSt.deskNo;
          if (newSt.name) current.name = newSt.name;

          // Merge subjects for this student across different subjects
          const subMap = new Map();
          (current.subjects || []).forEach(s => {
            if (s && s.code) subMap.set(s.code.trim().toUpperCase(), s);
          });
          (newSt.subjects || []).forEach(s => {
            if (s && s.code) subMap.set(s.code.trim().toUpperCase(), s);
          });
          current.subjects = Array.from(subMap.values());
          studentMap.set(roll, current);
        } else {
          studentMap.set(roll, newSt);
        }
      });

      payload.commonSubjects = combinedSubjects;
      payload.halls = combinedHalls;
      payload.students = Array.from(studentMap.values());
    };

    let allocation;
    if (_id) {
      const existingById = await HallTicket.findById(_id);
      if (existingById) {
        mergeWithExisting(existingById);
        allocation = await HallTicket.findByIdAndUpdate(_id, payload, { new: true, runValidators: true });
      } else {
        allocation = await HallTicket.create(payload);
      }
    } else {
      const existingExam = await HallTicket.findOne({
        examName: payload.examName,
        department: payload.department,
        semester: payload.semester
      });

      if (existingExam) {
        mergeWithExisting(existingExam);
        allocation = await HallTicket.findByIdAndUpdate(existingExam._id, payload, { new: true, runValidators: true });
      } else {
        allocation = await HallTicket.create(payload);
      }
    }

    console.log('[HallTicket] Allocation saved successfully! Total students:', payload.students.length);

    res.status(200).json({
      success: true,
      message: 'Hall allocation saved successfully with all student hall tickets!',
      data: allocation
    });
  } catch (error) {
    console.error('Error saving hall allocation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save hall allocation: ' + error.message,
      error: error.message
    });
  }
};

// @desc    Purge all duplicate hall tickets and students across database
// @route   POST /api/hall-tickets/cleanup-duplicates
exports.cleanupDuplicates = async (req, res) => {
  try {
    const allHallTickets = await HallTicket.find({});
    const seenExams = new Map();
    const duplicateIds = [];
    let updatedExamsCount = 0;

    for (const ht of allHallTickets) {
      const key = `${(ht.examName || '').trim().toLowerCase()}_${(ht.department || '').trim().toLowerCase()}_${ht.semester}`;
      if (seenExams.has(key)) {
        duplicateIds.push(ht._id);
      } else {
        seenExams.set(key, ht._id);
        const originalCount = ht.students ? ht.students.length : 0;
        const cleanStudents = deduplicateStudents(ht.students, ht.commonSubjects);
        const cleanSubjects = deduplicateSubjects(ht.commonSubjects);

        if (cleanStudents.length !== originalCount) {
          ht.students = cleanStudents;
          ht.commonSubjects = cleanSubjects;
          await ht.save();
          updatedExamsCount++;
        }
      }
    }

    if (duplicateIds.length > 0) {
      await HallTicket.deleteMany({ _id: { $in: duplicateIds } });
    }

    res.status(200).json({
      success: true,
      message: `Cleaned up ${duplicateIds.length} duplicate exam(s) and sanitized ${updatedExamsCount} student records.`
    });
  } catch (error) {
    console.error('Error in cleanupDuplicates:', error);
    res.status(500).json({ success: false, message: 'Cleanup failed', error: error.message });
  }
};

// @desc    Delete hall ticket allocation
// @route   DELETE /api/hall-tickets/:id
exports.deleteAllocation = async (req, res) => {
  try {
    const allocation = await HallTicket.findByIdAndDelete(req.params.id);
    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }
    res.status(200).json({ success: true, message: 'Allocation deleted successfully' });
  } catch (error) {
    console.error('Error deleting allocation:', error);
    res.status(500).json({ success: false, message: 'Failed to delete allocation', error: error.message });
  }
};
