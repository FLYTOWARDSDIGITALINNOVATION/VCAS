const Course = require('../models/Course');
const Subject = require('../models/Subject');

// ==========================================
// COURSE / PROGRAM CONTROLLERS
// ==========================================

exports.getCourses = async (req, res) => {
  try {
    let courses = await Course.find().sort({ code: 1 });

    // Auto-ensure B.Sc. Computer Science program exists in catalog
    const hasBscCS = courses.some(c => c.code && c.code.toUpperCase() === 'BSC-CS');
    if (!hasBscCS) {
      try {
        const bscCS = await Course.create({
          code: 'BSC-CS',
          name: 'B.Sc. Computer Science',
          degreeLevel: 'Undergraduate (UG)',
          department: 'Computer Science',
          regulation: 'Regulation 2024 (R24)',
          durationYears: 3,
          totalSemesters: 6,
          totalCredits: 140,
          enrolledStudents: 3,
          totalSubjects: 2,
          coordinator: 'Latha V',
          coordinatorEmail: 'latha.v@vcas.edu.in',
          description: 'Bachelor of Science in Computer Science with focus on Cloud Architecture and Database Systems.'
        });
        courses.push(bscCS);
      } catch (_) {}
    }

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
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Course "${deleted.name}" removed successfully.`,
      data: deleted
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
    let subjects = await Subject.find().sort({ department: 1, year: 1, sem: 1, code: 1 });

    // Auto-ensure CS2001 (Cloud) exists
    const hasCS2001 = subjects.some(s => s.code && s.code.toUpperCase() === 'CS2001');
    if (!hasCS2001) {
      try {
        const cs2001 = await Subject.create({
          code: 'CS2001',
          name: 'Cloud',
          department: 'Computer Science',
          year: 1,
          sem: 'Sem 1',
          credits: 4,
          type: 'Core Theory',
          faculty: 'Latha V',
          ltp: '3-1-0',
          hours: '4 hrs/wk (3L + 1T)',
          prerequisite: 'None',
          studentsEnrolled: 3
        });
        subjects.push(cs2001);
      } catch (_) {}
    }

    // Auto-ensure CS2005 (DBMS) exists
    const hasCS2005 = subjects.some(s => s.code && s.code.toUpperCase() === 'CS2005');
    if (!hasCS2005) {
      try {
        const cs2005 = await Subject.create({
          code: 'CS2005',
          name: 'DBMS',
          department: 'Computer Science',
          year: 1,
          sem: 'Sem 1',
          credits: 4,
          type: 'Core Theory',
          faculty: 'Latha V',
          ltp: '3-1-0',
          hours: '4 hrs/wk (3L + 1T)',
          prerequisite: 'None',
          studentsEnrolled: 3
        });
        subjects.push(cs2005);
      } catch (_) {}
    }

    // Auto-ensure CS401 (Operating Systems) exists
    const hasCS401 = subjects.some(s => s.code && s.code.toUpperCase() === 'CS401');
    if (!hasCS401) {
      try {
        const cs401 = await Subject.create({
          code: 'CS401',
          name: 'Operating Systems',
          department: 'Computer Science',
          year: 2,
          sem: 'Sem 4',
          credits: 4,
          type: 'Core Theory',
          faculty: 'Dr. Ramesh Kumar',
          ltp: '3-1-0',
          hours: '4 hrs/wk (3L + 1T)',
          prerequisite: 'CS2001',
          studentsEnrolled: 60
        });
        subjects.push(cs401);
      } catch (_) {}
    }

    // Auto-ensure CS402 (Design and Analysis of Algorithms) exists
    const hasCS402 = subjects.some(s => s.code && s.code.toUpperCase() === 'CS402');
    if (!hasCS402) {
      try {
        const cs402 = await Subject.create({
          code: 'CS402',
          name: 'Design and Analysis of Algorithms',
          department: 'Computer Science',
          year: 2,
          sem: 'Sem 4',
          credits: 4,
          type: 'Core Theory',
          faculty: 'Dr. Ananya Sharma',
          ltp: '3-1-0',
          hours: '4 hrs/wk (3L + 1T)',
          prerequisite: 'CS2005',
          studentsEnrolled: 60
        });
        subjects.push(cs402);
      } catch (_) {}
    }

    // Filter out dummy/test subjects
    subjects = subjects.filter(s => s.code && s.code.toUpperCase() !== 'SF76');

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const { code, name, department, year, sem, credits, type, faculty, ltp, hours, prerequisite, textbooks, studentsEnrolled, units, evaluation } = req.body;
    if (!code || !name || !department) {
      return res.status(400).json({ success: false, message: 'Code, name, and department are required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Subject.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ success: false, message: `Subject with code "${cleanCode}" already exists.` });
    }

    const subject = await Subject.create({
      code: cleanCode,
      name: name.trim(),
      department: department.trim(),
      year: Number(year) || 1,
      sem: sem || 'Sem 1',
      credits: Number(credits) || 3,
      type: type || 'Core Theory',
      faculty: faculty ? faculty.trim() : '',
      ltp: ltp || '3-0-0',
      hours: hours || '3 hrs/wk',
      prerequisite: prerequisite || 'None',
      textbooks: textbooks || '',
      studentsEnrolled: Number(studentsEnrolled) || 0,
      units: Array.isArray(units) && units.length > 0 ? units : [
        { unit: 'Unit 1', title: 'Foundational Principles & Core Concepts', hours: 9 },
        { unit: 'Unit 2', title: 'Theoretical Framework & Analytical Methods', hours: 9 },
        { unit: 'Unit 3', title: 'Applied Methodology & System Implementation', hours: 9 },
        { unit: 'Unit 4', title: 'Real-world Architecture & Case Studies', hours: 9 },
        { unit: 'Unit 5', title: 'Emerging Paradigms & Industry Standards', hours: 9 }
      ],
      evaluation: evaluation || { internal: 40, external: 60 }
    });

    res.status(201).json({
      success: true,
      message: `Subject "${subject.name}" added to catalog.`,
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
    if (req.body.prerequisite !== undefined) subject.prerequisite = req.body.prerequisite.trim();
    if (req.body.textbooks !== undefined) subject.textbooks = req.body.textbooks.trim();
    if (req.body.studentsEnrolled !== undefined) subject.studentsEnrolled = Number(req.body.studentsEnrolled);
    if (Array.isArray(req.body.units)) subject.units = req.body.units;
    if (req.body.evaluation) subject.evaluation = req.body.evaluation;

    await subject.save();

    res.status(200).json({
      success: true,
      message: `Subject "${subject.name}" updated successfully.`,
      data: subject
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { code: id.toUpperCase() };

    const deleted = await Subject.findOneAndDelete(query);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Subject "${deleted.name}" removed successfully.`,
      data: deleted
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
