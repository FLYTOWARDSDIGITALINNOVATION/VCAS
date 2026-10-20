const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Department = require('../models/Department');
const Class = require('../models/Class');
const Student = require('../models/Student');
const HallTicket = require('../models/HallTicket');
const { Exam } = require('../models/Exam');
const { autoGenerateTimetableSchedule } = require('./timetableController');

// ==========================================
// COURSE / PROGRAM CONTROLLERS
// ==========================================

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ code: 1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { code, name, degreeLevel, department, regulation, durationYears, totalCredits, coordinator, coordinatorEmail, description } = req.body;
    if (!code || !name || !department) {
      return res.status(400).json({ success: false, message: 'Code, name, and department are required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Course.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ success: false, message: `Course with code "${cleanCode}" already exists.` });
    }

    const years = Number(durationYears) || 3;
    const course = await Course.create({
      code: cleanCode,
      name: name.trim(),
      degreeLevel: degreeLevel || 'Undergraduate (UG)',
      department: department.trim(),
      regulation: regulation || 'Regulation 2024 (R24)',
      durationYears: years,
      totalSemesters: years * 2,
      totalCredits: Number(totalCredits) || 140,
      enrolledStudents: Number(req.body.enrolledStudents) || 0,
      totalSubjects: Number(req.body.totalSubjects) || 0,
      coordinator: coordinator ? coordinator.trim() : '',
      coordinatorEmail: coordinatorEmail ? coordinatorEmail.trim().toLowerCase() : '',
      description: description ? description.trim() : ''
    });

    res.status(201).json({
      success: true,
      message: `Course "${course.name}" registered successfully.`,
      data: course
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { code: id.toUpperCase() };

    let course = await Course.findOne(query);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    if (req.body.code) course.code = req.body.code.trim().toUpperCase();
    if (req.body.name) course.name = req.body.name.trim();
    if (req.body.degreeLevel) course.degreeLevel = req.body.degreeLevel.trim();
    if (req.body.department) course.department = req.body.department.trim();
    if (req.body.regulation) course.regulation = req.body.regulation.trim();
    if (req.body.durationYears) {
      const years = Number(req.body.durationYears);
      course.durationYears = years;
      course.totalSemesters = years * 2;
    }
    if (req.body.totalCredits) course.totalCredits = Number(req.body.totalCredits);
    if (req.body.enrolledStudents !== undefined) course.enrolledStudents = Number(req.body.enrolledStudents);
    if (req.body.totalSubjects !== undefined) course.totalSubjects = Number(req.body.totalSubjects);
    if (req.body.coordinator !== undefined) course.coordinator = req.body.coordinator.trim();
    if (req.body.coordinatorEmail !== undefined) course.coordinatorEmail = req.body.coordinatorEmail.trim().toLowerCase();
    if (req.body.description !== undefined) course.description = req.body.description.trim();

    await course.save();

    res.status(200).json({
      success: true,
      message: `Course "${course.name}" updated successfully.`,
      data: course
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { code: id.toUpperCase() };

    const deleted = await Course.findOneAndDelete(query);

    res.status(200).json({
      success: true,
      message: deleted ? `Course "${deleted.name}" removed successfully.` : 'Course removed successfully.',
      data: deleted || { _id: id }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// SUBJECT CONTROLLERS
// ==========================================

exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ department: 1, year: 1, sem: 1, code: 1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helper: Automatically create Exam Schedule and Hall Ticket allocations when subject hours are configured
const autoGenerateExamAndHallTickets = async (subjectDoc) => {
  try {
    const { code, name, department, year, sem, type, theoryHours, labHours } = subjectDoc;
    const cleanCode = (code || '').toUpperCase().trim();
    const isLab = (type && type.toLowerCase().includes('lab')) || (Number(labHours) > 0);

    // 1. Automatically register into Examination Schedule
    let exam = await Exam.findOne({ code: cleanCode });
    if (!exam) {
      exam = await Exam.create({
        code: cleanCode,
        name: name,
        department: department,
        year: Number(year) || 1,
        sem: sem || 'Sem 1',
        date: '2026-05-15',
        session: isLab ? 'Afternoon (AN)' : 'Forenoon (FN)',
        hall: isLab ? 'Computer Lab 1' : 'Hall 101 (Main Block)',
        type: isLab ? 'End Semester Practical' : 'End Semester Theory',
        qpCode: `QP-${cleanCode}-2026`
      });
    }

    // 2. Automatically sync to Class collection
    let cls = await Class.findOne({ code: cleanCode });
    if (!cls) {
      cls = await Class.create({
        code: cleanCode,
        name: name,
        dept: department,
        semester: Number(String(sem).replace(/\D/g, '')) || 1,
        year: Number(year) || 1,
        section: 'A',
        credits: Number(subjectDoc.credits) || 3,
        staffId: subjectDoc.faculty || 'FAC001',
        staffName: subjectDoc.faculty || 'Faculty In-Charge',
        theoryHours: Number(theoryHours) || 3,
        labHours: Number(labHours) || 0,
        isContinuousLab: true
      });
    }

    // 3. Automatically sync into HallTicket collection
    const semesterNum = Number(String(sem).replace(/\D/g, '')) || 1;
    const subjectEntry = {
      code: cleanCode,
      name: name,
      date: exam.date || '2026-05-15',
      session: exam.session || (isLab ? 'Afternoon (AN)' : 'Forenoon (FN)'),
      time: isLab ? '01:30 PM - 04:30 PM' : '09:30 AM - 12:30 PM'
    };

    const deptRegex = new RegExp(department.trim(), 'i');
    const students = await Student.find({
      $or: [
        { department: deptRegex },
        { course: deptRegex }
      ]
    }).lean();

    const studentRoster = students.map((st, sIdx) => ({
      rollNo: st.rollNo || st.studentId || `STU${sIdx + 1}`,
      name: st.name || st.fullName || 'Student',
      dept: st.department || department,
      semester: semesterNum,
      section: 'A',
      hallNo: exam.hall || 'Hall 101',
      seatNo: `S-${String(sIdx + 1).padStart(2, '0')}`,
      eligible: true,
      remarks: 'Auto-Generated upon Class Hours Setup',
      subjects: [subjectEntry]
    }));

    const existingHT = await HallTicket.findOne({
      department: department.trim(),
      semester: semesterNum
    });

    if (existingHT) {
      const existingCommon = existingHT.commonSubjects || [];
      if (!existingCommon.some(s => (s.code || '').toUpperCase() === cleanCode)) {
        existingHT.commonSubjects.push(subjectEntry);
      }
      (existingHT.students || []).forEach(st => {
        if (!st.subjects) st.subjects = [];
        if (!st.subjects.some(s => (s.code || '').toUpperCase() === cleanCode)) {
          st.subjects.push(subjectEntry);
        }
      });
      studentRoster.forEach(newSt => {
        if (!existingHT.students.some(s => s.rollNo === newSt.rollNo)) {
          existingHT.students.push(newSt);
        }
      });
      await existingHT.save();
    } else {
      await HallTicket.create({
        examName: 'Semester End Examination',
        examType: 'Semester End Examination',
        academicYear: '2025-2026',
        department: department.trim(),
        semester: semesterNum,
        section: 'A',
        halls: [{ hallNo: exam.hall || 'Hall 101', capacity: 60, allocatedCount: studentRoster.length }],
        allocatedByStaffId: 'ADMIN',
        allocatedByStaffName: 'Super Administrator',
        commonSubjects: [subjectEntry],
        students: studentRoster
      });
    }
  } catch (htErr) {
    console.error('Error auto-generating exam and hall tickets:', htErr);
  }
};

exports.createSubject = async (req, res) => {
  try {
    const { code, name, department, year, sem, credits, type, faculty, ltp, hours, theoryHours, labHours, prerequisite, textbooks, studentsEnrolled, units, evaluation } = req.body;
    if (!code || !name || !department) {
      return res.status(400).json({ success: false, message: 'Code, name, and department are required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Subject.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ success: false, message: `Subject with code "${cleanCode}" already exists.` });
    }

    const tHours = Number(theoryHours) >= 0 ? Number(theoryHours) : 3;
    const lHours = Number(labHours) >= 0 ? Number(labHours) : 0;
    const computedHours = hours || (lHours > 0 ? `${tHours}h Theory + ${lHours}h Continuous Lab` : `${tHours} hrs/wk`);

    const subject = await Subject.create({
      code: cleanCode,
      name: name.trim(),
      department: department.trim(),
      year: Number(year) || 1,
      sem: sem || 'Sem 1',
      credits: Number(credits) || 3,
      type: type || (lHours > 0 ? 'Practical / Lab' : 'Core Theory'),
      faculty: faculty ? faculty.trim() : '',
      ltp: ltp || (lHours > 0 ? `${tHours}-0-${lHours}` : `${tHours}-0-0`),
      hours: computedHours,
      theoryHours: tHours,
      labHours: lHours,
      isContinuousLab: true,
      prerequisite: prerequisite || 'None',
      textbooks: textbooks || '',
      studentsEnrolled: Number(studentsEnrolled) || 0,
      units: Array.isArray(units) ? units : [],
      evaluation: evaluation || { internal: 40, external: 60 }
    });

    // Automatically schedule weekly timetable (with continuous lab hours)
    try {
      await autoGenerateTimetableSchedule({
        code: subject.code,
        name: subject.name,
        dept: subject.department,
        year: subject.year,
        sem: subject.sem,
        theoryHours: subject.theoryHours,
        labHours: subject.labHours,
        isContinuousLab: true,
        staffName: subject.faculty
      });
    } catch (ttErr) {
      console.error('Auto timetable generation failed in createSubject:', ttErr.message);
    }

    res.status(201).json({
      success: true,
      message: `Class & Subject "${subject.name}" added to catalog with automatic Timetable generation.`,
      data: subject
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { code: id.toUpperCase() };

    let subject = await Subject.findOne(query);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    if (req.body.code) subject.code = req.body.code.trim().toUpperCase();
    if (req.body.name) subject.name = req.body.name.trim();
    if (req.body.department) subject.department = req.body.department.trim();
    if (req.body.year !== undefined) subject.year = Number(req.body.year);
    if (req.body.sem) subject.sem = req.body.sem.trim();
    if (req.body.credits !== undefined) subject.credits = Number(req.body.credits);
    if (req.body.type) subject.type = req.body.type.trim();
    if (req.body.faculty !== undefined) subject.faculty = req.body.faculty.trim();
    if (req.body.ltp) subject.ltp = req.body.ltp.trim();
    if (req.body.hours) subject.hours = req.body.hours.trim();
    if (req.body.theoryHours !== undefined) subject.theoryHours = Number(req.body.theoryHours);
    if (req.body.labHours !== undefined) subject.labHours = Number(req.body.labHours);
    if (req.body.theoryHours !== undefined || req.body.labHours !== undefined) {
      const th = Number(subject.theoryHours) || 0;
      const lh = Number(subject.labHours) || 0;
      subject.hours = req.body.hours || (lh > 0 ? `${th}h Theory + ${lh}h Continuous Lab` : `${th} hrs/wk`);
    }
    if (req.body.prerequisite !== undefined) subject.prerequisite = req.body.prerequisite.trim();
    if (req.body.textbooks !== undefined) subject.textbooks = req.body.textbooks.trim();
    if (req.body.studentsEnrolled !== undefined) subject.studentsEnrolled = Number(req.body.studentsEnrolled);
    if (Array.isArray(req.body.units)) subject.units = req.body.units;
    if (req.body.evaluation) subject.evaluation = req.body.evaluation;

    await subject.save();

    // Automatically update weekly timetable schedule
    try {
      await autoGenerateTimetableSchedule({
        code: subject.code,
        name: subject.name,
        dept: subject.department,
        year: subject.year,
        sem: subject.sem,
        theoryHours: subject.theoryHours,
        labHours: subject.labHours,
        isContinuousLab: true,
        staffName: subject.faculty
      });
    } catch (ttErr) {
      console.error('Auto timetable generation failed in updateSubject:', ttErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Subject "${subject.name}" updated successfully with automatic Timetable synchronization.`,
      data: subject
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    let codeToDelete = id.toUpperCase();
    if (id.startsWith('dept_')) {
      const parts = id.split('_');
      codeToDelete = parts[parts.length - 1].toUpperCase();
    }

    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { code: codeToDelete };
    const deleted = await Subject.findOneAndDelete(query);
    const actualCode = (deleted?.code || codeToDelete).trim().toUpperCase();

    // 1. Remove from any Department coursesList if present
    await Department.updateMany(
      {},
      {
        $pull: {
          coursesList: {
            $or: [
              { code: actualCode },
              { code: new RegExp(`^${actualCode}$`, 'i') },
              { code: id }
            ]
          }
        }
      }
    ).catch(() => {});

    // 2. Remove from Exam schedule collections
    if (actualCode) {
      await Exam.deleteMany({
        $or: [
          { code: actualCode },
          { code: new RegExp(`^${actualCode}$`, 'i') }
        ]
      }).catch(() => {});

      // 3. Remove from HallTicket commonSubjects & student subject lists
      await HallTicket.updateMany(
        {},
        {
          $pull: {
            commonSubjects: {
              $or: [
                { code: actualCode },
                { code: new RegExp(`^${actualCode}$`, 'i') }
              ]
            },
            'students.$[].subjects': {
              $or: [
                { code: actualCode },
                { code: new RegExp(`^${actualCode}$`, 'i') }
              ]
            }
          }
        }
      ).catch(() => {});

      // 4. Remove from Class if present
      await Class.deleteMany({
        $or: [
          { code: actualCode },
          { code: new RegExp(`^${actualCode}$`, 'i') }
        ]
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: deleted ? `Subject "${deleted.name}" (${actualCode}) removed everywhere.` : `Subject ${actualCode} removed successfully.`,
      data: deleted || { code: actualCode }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.autoGenerateExamAndHallTickets = autoGenerateExamAndHallTickets;

