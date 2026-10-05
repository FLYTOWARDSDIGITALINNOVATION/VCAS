const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

// @desc   Get all students
// @route  GET /api/students
exports.getAllStudents = async (req, res) => {
  try {

    const { department, feeStatus, status, search } = req.query;
    const filter = {};

    if (department && department !== 'All Departments') {
      filter.department = department;
    }
    if (feeStatus && feeStatus !== 'All Statuses') {
      filter.feeStatus = feeStatus;
    }
    if (status && status !== 'All Status') {
      filter.status = status;
    }
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { studentId: regex },
        { admNo: regex },
        { phone: regex },
        { email: regex }
      ];
    }

    const students = await Student.find(filter).sort({ createdAt: -1 });

    // Calculate real-time session attendance
    let enrichedStudents = students;
    try {
      const sessions = await Attendance.find().lean();
      const attMap = new Map();
      sessions.forEach(sess => {
        if (Array.isArray(sess.records)) {
          sess.records.forEach(r => {
            const roll = (r.rollNo || '').trim().toUpperCase();
            if (!roll) return;
            if (!attMap.has(roll)) attMap.set(roll, { total: 0, attended: 0 });
            const st = attMap.get(roll);
            st.total++;
            if (r.status === 'Present' || r.status === 'Late' || r.status === 'present' || r.status === 'late') {
              st.attended++;
            }
          });
        }
      });

      enrichedStudents = students.map(s => {
        const obj = s.toObject ? s.toObject() : { ...s };
        const roll = (obj.rollNo || '').trim().toUpperCase();
        if (attMap.has(roll)) {
          const { total, attended } = attMap.get(roll);
          if (total > 0) {
            obj.attendance = parseFloat(((attended / total) * 100).toFixed(1));
            obj.attendedClasses = attended;
            obj.totalClasses = total;
          }
        }
        return obj;
      });
    } catch (attErr) {
      console.error('Error enriching student attendance:', attErr.message);
    }

    res.status(200).json({
      success: true,
      count: enrichedStudents.length,
      data: enrichedStudents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single student by ID (MongoDB _id, studentId, or admNo)
// @route  GET /api/students/:id
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    let student = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      student = await Student.findById(id);
    }
    if (!student) {
      student = await Student.findOne({
        $or: [
          { studentId: id.toUpperCase() },
          { admNo: id.toUpperCase() }
        ]
      });
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const obj = student.toObject ? student.toObject() : { ...student };
    const roll = (obj.rollNo || '').trim().toUpperCase();
    try {
      const sessions = await Attendance.find().lean();
      let total = 0;
      let attended = 0;
      sessions.forEach(sess => {
        if (Array.isArray(sess.records)) {
          const rec = sess.records.find(r => (r.rollNo || '').trim().toUpperCase() === roll);
          if (rec) {
            total++;
            if (rec.status === 'Present' || rec.status === 'Late' || rec.status === 'present' || rec.status === 'late') {
              attended++;
            }
          }
        }
      });
      if (total > 0) {
        obj.attendance = parseFloat(((attended / total) * 100).toFixed(1));
        obj.attendedClasses = attended;
        obj.totalClasses = total;
      }
    } catch (attErr) {
      console.error('Error enriching student profile attendance:', attErr.message);
    }

    res.status(200).json({
      success: true,
      data: obj
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Create new student
// @route  POST /api/students
exports.createStudent = async (req, res) => {
  try {
    const body = req.body;

    const studentName = body.name || body.fullName;
    const studentDept = body.department;
    const studentCourse = body.course;

    if (!studentName || !studentDept || !studentCourse) {
      return res.status(400).json({
        success: false,
        message: 'Name, Department, and Course are required fields.'
      });
    }

    // Determine student ID
    let finalStudentId = (body.studentId || body.id || '').trim();
    if (!finalStudentId || finalStudentId.toLowerCase().includes('auto-generated')) {
      const count = await Student.countDocuments();
      let nextNum = count + 1;
      let candidate = `STU${String(nextNum).padStart(3, '0')}`;
      while (await Student.findOne({ studentId: candidate })) {
        nextNum++;
        candidate = `STU${String(nextNum).padStart(3, '0')}`;
      }
      finalStudentId = candidate;
    } else {
      finalStudentId = finalStudentId.toUpperCase();
      const existing = await Student.findOne({ studentId: finalStudentId });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Student with ID "${finalStudentId}" already exists.`
        });
      }
    }

    // Determine Admission Number
    let finalAdmNo = (body.admNo || body.admissionNo || '').trim();
    if (!finalAdmNo) {
      const count = await Student.countDocuments();
      let nextNum = count + 1;
      let candidate = `ADM2024${String(nextNum).padStart(3, '0')}`;
      while (await Student.findOne({ admNo: candidate })) {
        nextNum++;
        candidate = `ADM2024${String(nextNum).padStart(3, '0')}`;
      }
      finalAdmNo = candidate;
    } else {
      finalAdmNo = finalAdmNo.toUpperCase();
      const existing = await Student.findOne({ admNo: finalAdmNo });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Student with Admission No "${finalAdmNo}" already exists.`
        });
      }
    }

    const newStudent = new Student({
      studentId: finalStudentId,
      admNo: finalAdmNo,
      rollNo: body.rollNo || '',
      name: studentName.trim(),
      sem: body.sem || body.semester || '1st Sem',
      department: studentDept.trim(),
      course: studentCourse.trim(),
      phone: (body.phone || body.mobile || '').trim(),
      email: (body.email || `${finalStudentId.toLowerCase()}@student.edu`).toLowerCase().trim(),
      attendance: Number(body.attendance) >= 0 ? Number(body.attendance) : 100,
      feeStatus: body.feeStatus || 'Pending',
      status: body.status || 'Active',
      gender: body.gender || 'Male',
      dob: body.dob || '',
      bloodGroup: body.bloodGroup || 'O+',
      address: body.address || '',
      city: body.city || '',
      state: body.state || 'Tamil Nadu',
      pinCode: body.pinCode || '',
      country: body.country || 'India',
      batch: body.batch || body.academicYear || '2026-2027',
      academicYear: body.academicYear || '2026-2027',
      section: body.section || 'A',
      cgpa: body.cgpa || '8.0',
      rank: body.rank || '',
      fatherName: body.fatherName || '',
      motherName: body.motherName || '',
      fatherMobile: body.fatherMobile || body.parentMobile || '',
      motherMobile: body.motherMobile || '',
      parentOccupation: body.parentOccupation || '',
      parentEmail: body.parentEmail || '',
      emergencyContact: body.emergencyContact || '',
      doc10th: body.doc10th || '',
      doc12th: body.doc12th || '',
      docTc: body.docTc || '',
      docAadhaar: body.docAadhaar || '',
      password: `${finalStudentId.toLowerCase()}@2026`
    });

    const saved = await newStudent.save();

    res.status(201).json({
      success: true,
      message: `Student "${saved.name}" registered successfully.`,
      data: saved
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update student
// @route  PUT /api/students/:id
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    let student = null;

    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      student = await Student.findById(id);
    }
    
    if (!student) {
      const trimmedId = (id || '').trim();
      student = await Student.findOne({
        $or: [
          { studentId: trimmedId },
          { studentId: trimmedId.toUpperCase() },
          { admNo: trimmedId },
          { admNo: trimmedId.toUpperCase() },
          { rollNo: trimmedId },
          { rollNo: trimmedId.toUpperCase() }
        ]
      });
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const updates = req.body || {};

    // Name
    if (updates.name || updates.fullName) {
      student.name = (updates.name || updates.fullName).trim();
    }

    // Student ID
    const newStudentId = updates.studentId || updates.id;
    if (newStudentId && !newStudentId.match(/^[0-9a-fA-F]{24}$/)) {
      student.studentId = newStudentId.trim().toUpperCase();
    }

    // Admission No
    const newAdmNo = updates.admNo || updates.admissionNo;
    if (newAdmNo) {
      student.admNo = newAdmNo.trim().toUpperCase();
    }

    // Roll No
    if (updates.rollNo !== undefined) {
      student.rollNo = (updates.rollNo || '').trim().toUpperCase();
    }

    // Department & Course
    if (updates.department) student.department = updates.department.trim();
    if (updates.course) student.course = updates.course.trim();

    // Semester
    if (updates.sem || updates.semester) {
      student.sem = updates.sem || updates.semester;
    }

    // Phone / Mobile
    if (updates.phone !== undefined || updates.mobile !== undefined) {
      student.phone = (updates.phone !== undefined ? updates.phone : updates.mobile).trim();
    }

    // Email
    if (updates.email !== undefined) {
      student.email = (updates.email || '').trim().toLowerCase();
    }

    // Attendance
    if (updates.attendance !== undefined && updates.attendance !== null && updates.attendance !== '') {
      student.attendance = Math.min(100, Math.max(0, Number(updates.attendance)));
    }

    // Statuses
    if (updates.feeStatus) student.feeStatus = updates.feeStatus;
    if (updates.status) student.status = updates.status;

    // Personal & Parent details
    if (updates.gender) student.gender = updates.gender;
    if (updates.dob) student.dob = updates.dob;
    if (updates.bloodGroup) student.bloodGroup = updates.bloodGroup;
    if (updates.address) student.address = updates.address;
    if (updates.city) student.city = updates.city;
    if (updates.state) student.state = updates.state;
    if (updates.pinCode) student.pinCode = updates.pinCode;
    if (updates.country) student.country = updates.country;
    if (updates.batch) student.batch = updates.batch;
    if (updates.academicYear) student.academicYear = updates.academicYear;
    if (updates.section) student.section = updates.section;
    if (updates.cgpa) student.cgpa = updates.cgpa;
    if (updates.rank) student.rank = updates.rank;
    if (updates.fatherName) student.fatherName = updates.fatherName;
    if (updates.motherName) student.motherName = updates.motherName;
    if (updates.fatherMobile) student.fatherMobile = updates.fatherMobile;
    if (updates.motherMobile) student.motherMobile = updates.motherMobile;
    if (updates.parentOccupation) student.parentOccupation = updates.parentOccupation;
    if (updates.emergencyContact) student.emergencyContact = updates.emergencyContact;

    const updated = await student.save();

    res.status(200).json({
      success: true,
      message: `Student "${updated.name}" updated successfully.`,
      data: updated
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({ 
        success: false, 
        message: `A student with this ${field === 'studentId' ? 'Student ID' : field === 'admNo' ? 'Admission No.' : field} already exists.` 
      });
    }
    res.status(500).json({ success: false, message: error.message || 'Server error while updating student.' });
  }
};

// @desc   Delete student
// @route  DELETE /api/students/:id
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      deleted = await Student.findByIdAndDelete(id);
    }
    if (!deleted) {
      deleted = await Student.findOneAndDelete({
        $or: [
          { studentId: id.toUpperCase() },
          { admNo: id.toUpperCase() }
        ]
      });
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Student "${deleted.name}" (${deleted.studentId}) deleted successfully.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get student credentials (Super Admin Exclusive)
// @route  GET /api/students/:id/credentials
exports.getStudentCredentials = async (req, res) => {
  try {
    const { id } = req.params;
    let student = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      student = await Student.findById(id);
    }
    if (!student) {
      student = await Student.findOne({
        $or: [
          { studentId: id.toUpperCase() },
          { admNo: id.toUpperCase() }
        ]
      });
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    res.status(200).json({
      success: true,
      credentials: {
        studentId: student.studentId,
        admNo: student.admNo,
        name: student.name,
        department: student.department,
        course: student.course,
        sem: student.sem,
        phone: student.phone,
        email: student.email,
        loginUsername: student.admNo,
        alternateLogin: student.studentId,
        defaultPasscode: `${student.studentId.toLowerCase()}@2026`,
        attendance: student.attendance,
        feeStatus: student.feeStatus,
        status: student.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
