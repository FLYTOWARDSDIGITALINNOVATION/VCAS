const Course = require('../models/Course');
const Subject = require('../models/Subject');

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
