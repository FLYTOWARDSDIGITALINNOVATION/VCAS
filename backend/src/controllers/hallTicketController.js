const HallTicket = require('../models/HallTicket');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Department = require('../models/Department');
const Course = require('../models/Course');
const { Exam, ExamHall } = require('../models/Exam');

// Helper: Normalize & deduplicate subjects array
const deduplicateSubjects = (subjects = []) => {
  if (!Array.isArray(subjects)) return [];
  const seen = new Set();
  const result = [];
  for (const s of subjects) {
    const code = (s.code || '').trim().toUpperCase();
    if (code && !seen.has(code)) {
      seen.add(code);
      const resolvedTime = (s.time !== undefined && s.time !== null) ? s.time.trim() : '09:30 AM - 12:30 PM';
      result.push({
        code,
        name: (s.name || '').trim(),
        date: (s.date && s.date.trim()) ? s.date.trim() : 'TBA',
        session: (s.session || 'Forenoon (FN)').trim(),
        time: resolvedTime
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

      // Student's subjects or use default subjects if empty
      let rawSubs = [];
      if (Array.isArray(st.subjects) && st.subjects.length > 0) {
        rawSubs = st.subjects;
      } else if (Array.isArray(defaultSubjects) && defaultSubjects.length > 0) {
        rawSubs = defaultSubjects;
      }

      // Ensure each subject has valid date, session, and timing from defaultSubjects
      const cleanSubs = rawSubs.map(s => {
        const code = (s.code || '').trim().toUpperCase();
        const match = Array.isArray(defaultSubjects)
          ? defaultSubjects.find(ds => (ds.code || '').toUpperCase() === code)
          : null;
        const resolvedTime = (s.time !== undefined && s.time !== null && s.time !== '')
          ? s.time.trim()
          : ((match?.time !== undefined && match?.time !== null) ? match.time.trim() : (s.time || ''));
        return {
          code,
          name: (s.name || match?.name || code || '').trim(),
          date: (s.date && s.date.trim() && s.date !== 'TBA') ? s.date.trim() : (match?.date && match.date !== 'TBA' ? match.date.trim() : (s.date || '')),
          session: (s.session || match?.session || 'Forenoon (FN)').trim(),
          time: resolvedTime
        };
      }).filter(s => s.code && !['CS2003', 'CS2006', 'SF76'].includes(s.code));

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
        subjects: deduplicateSubjects(cleanSubs)
      });
    }
  }
  return result;
};

// @desc    Get metadata (available departments, semesters, sections from classes)
// @route   GET /api/hall-tickets/meta
exports.getHallTicketMeta = async (req, res) => {
  try {
    const depts = new Set();
    const semesters = new Set([1, 2, 3, 4, 5, 6, 7, 8]);
    const sections = new Set(['A', 'B', 'C', 'All']);

    // Fetch ONLY official departments added by Admin in Department collection
    try {
      const dbDepts = await Department.find({}, 'name code');
      dbDepts.forEach(d => {
        if (d.name && d.name.trim()) depts.add(d.name.trim());
      });
    } catch (e) {
      console.warn('Could not fetch Department collection:', e.message);
    }

    // Fallback only if no departments exist in database
    if (depts.size === 0) {
      depts.add('Computer Science');
    }

    // Fetch classes for semesters and sections only (do NOT pull unverified depts)
    try {
      const classes = await Class.find({}, 'semester section');
      classes.forEach(c => {
        if (c.semester) semesters.add(Number(c.semester));
        if (c.section && c.section.trim()) sections.add(c.section.trim());
      });
    } catch (_) { }

    res.status(200).json({
      success: true,
      departments: Array.from(depts).sort((a, b) => a.localeCompare(b)),
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

    // Flexible regex for Computer Science / CS matching
    let deptRegex = null;
    if (department && department !== 'All') {
      if (/computer|cs/i.test(department)) {
        deptRegex = /(computer|cs|bsc\s*cs|b\.sc\s*cs)/i;
      } else {
        deptRegex = new RegExp(department.trim().split(' ')[0], 'i');
      }
    }

    const query = {};
    if (deptRegex) query.dept = deptRegex;

    // If a specific subject is requested
    if (subjectCode && subjectCode !== 'All' && subjectCode !== 'ALL') {
      query.code = subjectCode.trim().toUpperCase();
    } else {
      if (semester && semester !== 'All') query.semester = Number(semester);
      if (section && section !== 'All') query.section = section;
    }

    const classes = await Class.find(query);

    // Also fetch all classes in department
    const allDeptClasses = await Class.find(deptRegex ? { dept: deptRegex } : {});

    // Retrieve any saved timetable configurations from HallTicket and Exam to retain customized dates, sessions and times
    const customTimingsMap = new Map();
    let savedTickets = [];
    try {
      savedTickets = await HallTicket.find(deptRegex ? { department: deptRegex } : {}).lean();
      savedTickets.forEach(t => {
        (t.commonSubjects || []).forEach(sub => {
          const c = (sub.code || '').trim().toUpperCase();
          if (c && !customTimingsMap.has(c)) {
            customTimingsMap.set(c, {
              name: sub.name,
              date: sub.date,
              session: sub.session,
              time: (sub.time !== undefined && sub.time !== null) ? sub.time : ''
            });
          }
        });
      });
    } catch (_) { }

    try {
      const savedExams = await Exam.find(deptRegex ? { department: deptRegex } : {}).lean();
      savedExams.forEach(ex => {
        const c = (ex.code || '').trim().toUpperCase();
        if (c && !customTimingsMap.has(c)) {
          customTimingsMap.set(c, {
            name: ex.name,
            date: ex.date,
            session: ex.session,
            time: (ex.time !== undefined && ex.time !== null) ? ex.time : ''
          });
        }
      });
    } catch (_) { }

    const subjectsMap = new Map();
    allDeptClasses.forEach(cls => {
      const code = (cls.code || '').trim().toUpperCase();
      if (code && cls.name) {
        // Exclude dummy test/legacy subjects
        if (['SF76', 'CS2003', 'CS2006'].includes(code)) return;
        if (!subjectsMap.has(code)) {
          const savedInfo = customTimingsMap.get(code);
          subjectsMap.set(code, {
            code,
            name: savedInfo?.name || cls.name.trim(),
            date: savedInfo?.date || (code === 'CS2001' ? '2026-04-15' : (code === 'CS2005' ? '2026-04-18' : '2026-04-20')),
            session: savedInfo?.session || 'Forenoon (FN)',
            time: (savedInfo?.time !== undefined && savedInfo?.time !== null) ? savedInfo.time : '09:30 AM - 12:30 PM'
          });
        }
      }
    });

    // Also include any subjects saved in HallTicket that were not in Class collection
    customTimingsMap.forEach((info, c) => {
      if (!subjectsMap.has(c) && !['SF76', 'CS2003', 'CS2006'].includes(c)) {
        subjectsMap.set(c, {
          code: c,
          name: info.name || c,
          date: info.date || '2026-04-20',
          session: info.session || 'Forenoon (FN)',
          time: info.time !== undefined ? info.time : '09:30 AM - 12:30 PM'
        });
      }
    });

    const studentMap = new Map();
    classes.forEach(cls => {
      const code = (cls.code || '').trim().toUpperCase();
      if (Array.isArray(cls.students)) {
        cls.students.forEach(st => {
          const rollNo = (st.rollNo || '').trim().toUpperCase();
          if (rollNo) {
            const existing = studentMap.get(rollNo) || {
              rollNo,
              name: (st.name || '').trim(),
              dept: cls.dept || department || 'Computer Science',
              semester: cls.semester || Number(semester) || 1,
              section: (cls.section || 'A').toUpperCase(),
              subjects: []
            };

            if (code && subjectsMap.has(code) && !existing.subjects.some(s => s.code === code)) {
              existing.subjects.push({
                code,
                name: subjectsMap.get(code)?.name || (cls.name || '').trim(),
                date: subjectsMap.get(code)?.date || '2026-04-18',
                session: subjectsMap.get(code)?.session || 'Forenoon (FN)',
                time: subjectsMap.get(code)?.time || ''
              });
            }
            studentMap.set(rollNo, existing);
          }
        });
      }
    });

    // Also include students registered in the main Student collection and enrich feeStatus & attendance
    try {
      let stuFilter = {};
      if (deptRegex) {
        const genRegex = /^general$/i;
        stuFilter = {
          $or: [
            { department: deptRegex },
            { course: deptRegex },
            { courseAdmitted: deptRegex },
            { department: genRegex },
            { department: '' },
            { department: null },
            { department: { $exists: false } }
          ]
        };
      }
      const registeredStudents = await Student.find(stuFilter);
      registeredStudents.forEach(st => {
        const rollNo = (st.rollNo || st.studentId || st.regNo || '').trim().toUpperCase();
        if (rollNo && !studentMap.has(rollNo)) {
          studentMap.set(rollNo, {
            rollNo,
            regNo: st.regNo || rollNo,
            name: (st.name || '').trim(),
            dept: st.department || department || 'Computer Science',
            semester: st.sem ? parseInt(st.sem) || 1 : (st.semester ? parseInt(st.semester) || 1 : 1),
            section: st.section || 'A',
            feeStatus: st.feeStatus || 'Pending',
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
          val.feeStatus = match.feeStatus || 'Pending';
          val.attendance = match.attendance !== undefined ? match.attendance : 85;
          val.regNo = match.regNo || key;
        } else {
          val.feeStatus = val.feeStatus || 'Pending';
          val.attendance = val.attendance !== undefined ? val.attendance : 85;
          val.regNo = val.regNo || key;
        }
      });
      // Enrich with previously allocated hall and seat from savedTickets
      savedTickets.forEach(t => {
        (t.students || []).forEach(allocatedSt => {
          const r = (allocatedSt.rollNo || '').trim().toUpperCase();
          if (r && studentMap.has(r)) {
            const cur = studentMap.get(r);
            if (allocatedSt.hallNo && allocatedSt.hallNo !== 'Unassigned' && allocatedSt.hallNo !== 'TBA') {
              cur.hallNo = allocatedSt.hallNo;
            }
            if (allocatedSt.seatNo && allocatedSt.seatNo !== '—' && allocatedSt.seatNo !== 'TBA') {
              cur.seatNo = allocatedSt.seatNo;
            }
            if (Array.isArray(allocatedSt.subjects) && allocatedSt.subjects.length > 0 && (!cur.subjects || cur.subjects.length === 0)) {
              cur.subjects = allocatedSt.subjects;
            }
          }
        });
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

    const cleanCommonSubjects = deduplicateSubjects(commonSubjects)
      .filter(s => !['CS2003', 'CS2006', 'SF76'].includes((s.code || '').toUpperCase()));
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
      ]).filter(s => !['CS2003', 'CS2006', 'SF76'].includes((s.code || '').toUpperCase()));

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

          // Merge subjects with latest date and session details
          const subMap = new Map();
          (current.subjects || []).forEach(s => {
            if (s && s.code) subMap.set(s.code.trim().toUpperCase(), s);
          });
          (newSt.subjects || []).forEach(s => {
            if (s && s.code) subMap.set(s.code.trim().toUpperCase(), s);
          });
          let mergedSubs = Array.from(subMap.values());
          if (mergedSubs.length === 0 && cleanCommonSubjects.length > 0) {
            mergedSubs = [...cleanCommonSubjects];
          }
          mergedSubs = mergedSubs.map(s => {
            const match = cleanCommonSubjects.find(cs => cs.code.toUpperCase() === (s.code || '').toUpperCase());
            return {
              code: (s.code || '').toUpperCase(),
              name: s.name || match?.name || s.code,
              date: (s.date && s.date !== 'TBA') ? s.date : (match?.date || (s.code === 'CS2001' ? '2026-04-15' : '2026-04-18')),
              session: s.session || match?.session || 'Forenoon (FN)',
              time: (s.time !== undefined && s.time !== null && s.time !== '') ? s.time : (match?.time || s.time || '')
            };
          }).filter(s => !['CS2003', 'CS2006', 'SF76'].includes(s.code));

          current.subjects = mergedSubs;
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
      const deptPattern = new RegExp(`^${payload.department.trim()}$`, 'i');
      const existingExam = await HallTicket.findOne({
        $or: [
          { department: { $regex: deptPattern }, semester: payload.semester },
          { examName: payload.examName, department: payload.department, semester: payload.semester }
        ]
      }).sort({ updatedAt: -1 });

      if (existingExam) {
        mergeWithExisting(existingExam);
        allocation = await HallTicket.findByIdAndUpdate(existingExam._id, payload, { new: true, runValidators: true });
      } else {
        allocation = await HallTicket.create(payload);
      }
    }

    // Automatically synchronize staff-assigned halls into ExamHall collection
    try {
      const activeHallsList = payload.halls && payload.halls.length > 0 ? payload.halls : cleanHalls;
      for (const h of activeHallsList) {
        const rawNo = (h.hallNo || '').trim();
        if (!rawNo) continue;
        const hallName = rawNo.toLowerCase().startsWith('hall') ? rawNo : `Hall ${rawNo}`;
        const studentsInHall = (payload.students || []).filter(s => {
          const sHNo = (s.hallNo || '').trim().toUpperCase();
          return sHNo === rawNo.toUpperCase() || sHNo === hallName.toUpperCase();
        });
        const rolls = studentsInHall.map(s => s.rollNo).filter(Boolean).sort();
        const rollRange = rolls.length > 1 ? `${rolls[0]} - ${rolls[rolls.length - 1]}` : (rolls[0] || 'No candidates assigned');

        let existingHall = await ExamHall.findOne({ hallName });
        if (!existingHall) {
          await ExamHall.create({
            hallName,
            capacity: Number(h.capacity) || 30,
            allocatedStudents: studentsInHall.length,
            departments: `${payload.department} (Sem ${payload.semester})`,
            rollRange,
            invigilator: payload.allocatedByStaffName || 'Staff In-Charge',
            invigilatorDept: payload.department,
            status: studentsInHall.length >= (Number(h.capacity) || 30) ? 'Fully Allocated' : (studentsInHall.length > 0 ? 'Allocated' : 'Available')
          });
        } else {
          existingHall.capacity = Number(h.capacity) || existingHall.capacity;
          existingHall.allocatedStudents = studentsInHall.length;
          existingHall.rollRange = rollRange;
          existingHall.departments = `${payload.department} (Sem ${payload.semester})`;
          if (payload.allocatedByStaffName) existingHall.invigilator = payload.allocatedByStaffName;
          if (payload.department) existingHall.invigilatorDept = payload.department;
          existingHall.status = studentsInHall.length >= (Number(existingHall.capacity) || 30) ? 'Fully Allocated' : (studentsInHall.length > 0 ? 'Allocated' : 'Available');
          await existingHall.save();
        }
      }
    } catch (hallSyncErr) {
      console.warn('Error syncing ExamHall in allocateHallTickets:', hallSyncErr.message);
    }

    // Automatically synchronize common exam subjects into Exam collection so Admin Timetable reflects assigned halls & timings
    try {
      const activeHallsList = payload.halls && payload.halls.length > 0 ? payload.halls : cleanHalls;
      const assignedHallNames = activeHallsList.map(h => {
        const rawNo = (h.hallNo || '').trim();
        return rawNo.toLowerCase().startsWith('hall') ? rawNo : `Hall ${rawNo}`;
      }).join(', ') || 'Hall 101';

      for (const sub of (payload.commonSubjects || cleanCommonSubjects)) {
        const subCode = (sub.code || '').trim().toUpperCase();
        if (!subCode) continue;

        let examDoc = await Exam.findOne({ code: subCode });
        const subSessionStr = sub.time ? `${sub.session || 'Forenoon (FN)'} (${sub.time})` : (sub.session || 'Forenoon (FN)');

        if (examDoc) {
          examDoc.hall = assignedHallNames;
          if (sub.date && sub.date !== 'TBA') examDoc.date = sub.date;
          if (sub.session) examDoc.session = sub.session;
          if (sub.time !== undefined) examDoc.time = sub.time;
          if (payload.department) examDoc.department = payload.department;
          if (payload.semester) examDoc.sem = `Sem ${payload.semester}`;
          if (payload.allocatedByStaffName) examDoc.invigilator = payload.allocatedByStaffName;
          examDoc.status = 'Scheduled';
          await examDoc.save();
        } else {
          await Exam.create({
            code: subCode,
            name: sub.name || subCode,
            department: payload.department,
            year: Math.ceil(Number(payload.semester) / 2) || 1,
            sem: `Sem ${payload.semester}`,
            date: (sub.date && sub.date !== 'TBA') ? sub.date : '2026-05-15',
            session: sub.session || 'Forenoon (FN)',
            time: sub.time !== undefined ? sub.time : '09:30 AM - 12:30 PM',
            hall: assignedHallNames,
            qpCode: `QP-${subCode}-2026`,
            invigilator: payload.allocatedByStaffName || 'Assigned Faculty',
            status: 'Scheduled',
            type: 'End Semester Theory'
          });
        }
      }
    } catch (examSyncErr) {
      console.warn('Error syncing Exam in allocateHallTickets:', examSyncErr.message);
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

// @desc    Get real hall ticket for a specific student
// @route   GET /api/hall-tickets/student/:identifier
exports.getStudentHallTicket = async (req, res) => {
  try {
    const identifier = (req.params.identifier || '').trim().toLowerCase();
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Identifier is required' });
    }

    // Look up registered student
    const student = await Student.findOne({
      $or: [
        { rollNo: { $regex: new RegExp(`^${identifier}$`, 'i') } },
        { regNo: { $regex: new RegExp(`^${identifier}$`, 'i') } },
        { studentId: { $regex: new RegExp(`^${identifier}$`, 'i') } },
        { loginId: { $regex: new RegExp(`^${identifier}$`, 'i') } }
      ]
    });

    const rollNo = (student?.rollNo || identifier).toLowerCase();
    const regNo = (student?.regNo || identifier).toLowerCase();

    // Find all hall ticket allocations
    const allAllocations = await HallTicket.find().sort({ createdAt: -1 });

    let matchedTicket = null;
    let studentAllocation = null;

    // 1. Look for explicit student allocation match
    for (const ht of allAllocations) {
      const match = (ht.students || []).find(s => {
        const sRoll = (s.rollNo || '').trim().toLowerCase();
        return sRoll === rollNo || sRoll === regNo;
      });
      if (match) {
        matchedTicket = ht;
        studentAllocation = match;
        break;
      }
    }

    // Check if the student has genuinely been assigned a hall and seat
    const hasValidHall = studentAllocation?.hallNo &&
      studentAllocation.hallNo !== 'TBA' &&
      studentAllocation.hallNo !== 'Unassigned' &&
      studentAllocation.hallNo.trim() !== '';
    const hasValidSeat = studentAllocation?.seatNo &&
      studentAllocation.seatNo !== 'TBA' &&
      studentAllocation.seatNo !== '-' &&
      studentAllocation.seatNo.trim() !== '';

    if (!matchedTicket || !studentAllocation || !hasValidHall || !hasValidSeat) {
      return res.status(200).json({
        success: true,
        data: {
          allocated: false,
          message: 'Hall ticket has not yet been allocated by the Examination Cell.',
          allocatedHall: null,
          allocatedSeat: null,
          subjects: []
        }
      });
    }

    // Real subjects assigned to this student
    let subjects = [];
    if (studentAllocation.subjects && studentAllocation.subjects.length > 0) {
      subjects = studentAllocation.subjects;
    } else if (matchedTicket.commonSubjects && matchedTicket.commonSubjects.length > 0) {
      subjects = matchedTicket.commonSubjects;
    }

    // Filter out dummy legacy flutter or test subjects
    const cleanSubjects = deduplicateSubjects(subjects)
      .filter(s => s.code && !['CS2003', 'CS2006', 'SF76'].includes(s.code.toUpperCase()));

    // Ensure every subject has its exam date, session and timing
    cleanSubjects.forEach(s => {
      if (!s.date || s.date === 'TBA') {
        s.date = s.code === 'CS2001' ? '2026-04-15' : (s.code === 'CS2005' ? '2026-04-18' : '2026-04-20');
      }
      if (s.time === undefined || s.time === null) {
        s.time = '09:30 AM - 12:30 PM';
      }
      if (!s.session) {
        s.session = 'Forenoon (FN)';
      }
    });

    const instructions = (matchedTicket.instructions && matchedTicket.instructions.length > 0)
      ? matchedTicket.instructions
      : [
        'Candidates must bring this Hall Ticket along with their official College ID Card to every examination session.',
        'Candidates should occupy their allotted seats at least 15 minutes prior to the commencement of the examination.',
        'Possession of mobile phones, smartwatches, programmable calculators, or unauthorized study materials inside the hall is strictly prohibited.',
        'No candidate will be allowed to enter the exam hall 30 minutes after commencement or leave before closing.'
      ];

    res.status(200).json({
      success: true,
      data: {
        allocated: true,
        examName: matchedTicket.examName,
        examType: matchedTicket.examType,
        academicYear: matchedTicket.academicYear,
        department: matchedTicket.department,
        semester: matchedTicket.semester,
        allocatedHall: studentAllocation.hallNo,
        allocatedSeat: studentAllocation.seatNo,
        deskNo: studentAllocation.deskNo || '',
        eligible: studentAllocation.eligible !== false,
        remarks: studentAllocation.remarks || 'Eligible for Examination',
        subjects: cleanSubjects,
        instructions,
        allocatedByStaffName: matchedTicket.allocatedByStaffName || 'Chief Superintendent',
        allocatedByStaffId: matchedTicket.allocatedByStaffId || ''
      }
    });
  } catch (error) {
    console.error('Error fetching student hall ticket:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving hall ticket', error: error.message });
  }
};

// @desc    Update subject date, session, timing or name across all hall tickets & exams
// @route   POST /api/hall-tickets/update-subject-schedule
exports.updateSubjectSchedule = async (req, res) => {
  try {
    const { originalCode, code, name, date, session, time, department, semester, allocationId } = req.body;
    const lookupCode = (originalCode || code || '').trim().toUpperCase();
    const cleanCode = (code || originalCode || '').trim().toUpperCase();
    if (!cleanCode) {
      return res.status(400).json({ success: false, message: 'Subject code is required' });
    }

    const cleanDate = date && date.trim() ? date.trim() : '2026-04-20';
    const cleanSession = session && session.trim() ? session.trim() : 'Forenoon (FN)';
    const cleanTime = (time !== undefined && time !== null) ? time.trim() : '';
    const cleanName = name ? name.trim() : '';

    console.log(`[HallTicket] Updating subject schedule for ${lookupCode} -> ${cleanCode}, Time: "${cleanTime}", Session: "${cleanSession}", Date: "${cleanDate}"`);

    // 1. Update all HallTickets that reference this subject code or match allocationId
    const ticketFilter = {};
    if (allocationId) {
      ticketFilter._id = allocationId;
    } else if (department) {
      ticketFilter.$or = [
        { 'commonSubjects.code': lookupCode },
        { 'students.subjects.code': lookupCode },
        { department: new RegExp(department.trim().split(' ')[0], 'i') }
      ];
    } else {
      ticketFilter.$or = [
        { 'commonSubjects.code': lookupCode },
        { 'students.subjects.code': lookupCode }
      ];
    }

    const matchingTickets = await HallTicket.find(ticketFilter);
    for (const ticket of matchingTickets) {
      let changed = false;

      // Update in commonSubjects
      let subFoundInCommon = false;
      ticket.commonSubjects = (ticket.commonSubjects || []).map(s => {
        if ((s.code || '').toUpperCase() === lookupCode) {
          subFoundInCommon = true;
          changed = true;
          return {
            ...s.toObject(),
            code: cleanCode,
            name: cleanName || s.name,
            date: cleanDate,
            session: cleanSession,
            time: cleanTime
          };
        }
        return s;
      });

      if (!subFoundInCommon && cleanName) {
        ticket.commonSubjects.push({
          code: cleanCode,
          name: cleanName,
          date: cleanDate,
          session: cleanSession,
          time: cleanTime
        });
        changed = true;
      }

      // Update in student records
      (ticket.students || []).forEach(st => {
        if (Array.isArray(st.subjects)) {
          st.subjects.forEach(sub => {
            if ((sub.code || '').toUpperCase() === lookupCode) {
              changed = true;
              sub.code = cleanCode;
              if (cleanName) sub.name = cleanName;
              sub.date = cleanDate;
              sub.session = cleanSession;
              sub.time = cleanTime;
            }
          });
        }
      });

      if (changed) {
        ticket.markModified('commonSubjects');
        ticket.markModified('students');
        await ticket.save();
      }
    }

    // If no existing ticket was found, create draft so MongoDB retains it
    if (matchingTickets.length === 0 && department && semester) {
      try {
        await HallTicket.create({
          examName: 'End Semester Theory Examinations - April/May 2026',
          department: department.trim(),
          semester: Number(semester) || 1,
          section: 'All',
          halls: [{ hallNo: 'Hall 101', capacity: 30 }],
          commonSubjects: [{
            code: cleanCode,
            name: cleanName || cleanCode,
            date: cleanDate,
            session: cleanSession,
            time: cleanTime
          }],
          students: []
        });
      } catch (createErr) {
        console.warn('Could not create draft ticket in updateSubjectSchedule:', createErr.message);
      }
    }

    // 2. Synchronize with Exam collection
    try {
      let examDoc = await Exam.findOne({ code: lookupCode });
      if (examDoc) {
        examDoc.code = cleanCode;
        if (cleanName) examDoc.name = cleanName;
        examDoc.date = cleanDate;
        examDoc.session = cleanSession;
        examDoc.time = cleanTime;
        if (department) examDoc.department = department;
        if (semester) examDoc.sem = `Sem ${semester}`;
        await examDoc.save();
      } else if (cleanName && department) {
        await Exam.create({
          code: cleanCode,
          name: cleanName,
          department: department,
          year: Math.ceil(Number(semester) / 2) || 1,
          sem: `Sem ${semester || 1}`,
          date: cleanDate,
          session: cleanSession,
          time: cleanTime,
          hall: 'Main Examination Hall',
          qpCode: `QP-${cleanCode}-2026`,
          status: 'Scheduled',
          type: 'End Semester Theory'
        });
      }
    } catch (exErr) {
      console.warn('Could not sync Exam in updateSubjectSchedule:', exErr.message);
    }

    // 3. Synchronize with Class collection
    try {
      const cls = await Class.findOne({ code: lookupCode });
      if (cls) {
        if (cleanCode !== lookupCode) cls.code = cleanCode;
        if (cleanName) cls.name = cleanName;
        await cls.save();
      }
    } catch (clsErr) {
      console.warn('Could not sync Class in updateSubjectSchedule:', clsErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Updated timetable for ${cleanCode} successfully`,
      subject: {
        code: cleanCode,
        name: cleanName,
        date: cleanDate,
        session: cleanSession,
        time: cleanTime
      }
    });
  } catch (error) {
    console.error('updateSubjectSchedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update subject schedule: ' + error.message
    });
  }
};

// @desc    Remove subject schedule from hall tickets and exams
// @route   POST /api/hall-tickets/remove-subject-schedule
exports.removeSubjectSchedule = async (req, res) => {
  try {
    const { code, department, semester } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Subject code is required' });
    }
    const cleanCode = code.trim().toUpperCase();

    const filter = {};
    if (department && department !== 'All') {
      filter.department = new RegExp(department.trim().split(' ')[0], 'i');
    }
    if (semester && semester !== 'All') {
      filter.semester = Number(semester);
    }

    // Pull from commonSubjects and students.subjects
    await HallTicket.updateMany(
      filter,
      {
        $pull: {
          commonSubjects: { code: cleanCode },
          'students.$[].subjects': { code: cleanCode }
        }
      }
    );

    // Also remove from Exam collection
    const examFilter = { code: cleanCode };
    if (department && department !== 'All') {
      examFilter.department = new RegExp(department.trim().split(' ')[0], 'i');
    }
    await Exam.deleteMany(examFilter);

    return res.status(200).json({
      success: true,
      message: `Subject ${cleanCode} removed from schedule successfully.`
    });
  } catch (error) {
    console.error('removeSubjectSchedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove subject schedule: ' + error.message
    });
  }
};



