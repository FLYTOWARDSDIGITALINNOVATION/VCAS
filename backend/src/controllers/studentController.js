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
        { regNo: regex },
        { studentId: regex },
        { admNo: regex },
        { rollNo: regex },
        { emisNumber: regex },
        { aadhaar: regex },
        { pan: regex },
        { phone: regex },
        { email: regex },
        { course: regex }
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
    const studentCourseAdmitted = (body.courseAdmitted || body.course || '').trim();
    const studentDept = (body.department || studentCourseAdmitted || 'General').trim();
    const studentCourse = (body.course || studentCourseAdmitted || 'Undergraduate').trim();

    if (!studentName || !studentName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Student Name is required.'
      });
    }

    // Determine Student ID and Register Number (Instead of ID, place it as Reg No)
    let finalRegNo = (body.regNo || body.registerNo || body.studentId || body.id || '').trim();
    if (!finalRegNo || finalRegNo.toLowerCase().includes('auto-generated')) {
      const count = await Student.countDocuments();
      let nextNum = count + 1;
      let candidate = `REG2026${String(nextNum).padStart(3, '0')}`;
      while (await Student.findOne({ $or: [{ regNo: candidate }, { studentId: candidate }] })) {
        nextNum++;
        candidate = `REG2026${String(nextNum).padStart(3, '0')}`;
      }
      finalRegNo = candidate;
    } else {
      finalRegNo = finalRegNo.toUpperCase();
    }

    let finalStudentId = (body.studentId || finalRegNo).trim().toUpperCase();

    // Determine Admission Number
    let finalAdmNo = (body.admNo || body.admissionNo || '').trim();
    if (!finalAdmNo) {
      const count = await Student.countDocuments();
      let nextNum = count + 1;
      let candidate = `ADM2026${String(nextNum).padStart(3, '0')}`;
      while (await Student.findOne({ admNo: candidate })) {
        nextNum++;
        candidate = `ADM2026${String(nextNum).padStart(3, '0')}`;
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

    const studentDob = (body.dob || '').trim();
    // Set Student Date of Birth as Password
    const studentPassword = studentDob ? studentDob : (body.password || `${finalRegNo.toLowerCase()}@2026`);

    const newStudent = new Student({
      ...body,
      studentId: finalStudentId,
      regNo: finalRegNo,
      admNo: finalAdmNo || finalRegNo,
      rollNo: (body.rollNo || '').trim().toUpperCase(),
      year: body.year || '1st Year',
      loginId: (body.loginId || finalRegNo).trim().toUpperCase(),
      name: studentName.trim(),
      sem: body.sem || body.semester || '1st Sem',
      department: studentDept,
      course: studentCourse,
      courseAdmitted: studentCourseAdmitted,
      dateOfAdmission: (body.dateOfAdmission || body.admissionDate || '').trim(),
      nationalityReligion: (body.nationalityReligion || `${body.nationality || 'INDIAN'} & ${body.religion || 'HINDU'}`).trim(),
      casteCommunity: (body.casteCommunity || body.caste || '').trim(),
      phone: (body.phone || body.mobile || '').trim(),
      email: (body.email || '').toLowerCase().trim(),
      attendance: Number(body.attendance) >= 0 ? Number(body.attendance) : 100,
      feeStatus: body.feeStatus || 'Pending',
      status: body.status || 'Active',
      gender: body.gender || 'Male',
      dob: studentDob,
      bloodGroup: body.bloodGroup || 'O+',
      password: studentPassword
    });

    const saved = await newStudent.save();

    res.status(201).json({
      success: true,
      message: `Student "${saved.name}" registered successfully with Reg No "${saved.regNo}".`,
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
          { regNo: trimmedId },
          { regNo: trimmedId.toUpperCase() },
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

    // Apply all portfolio and statutory fields from updates
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        student.set(key, updates[key]);
      }
    });

    // Name
    if (updates.name || updates.fullName) {
      student.name = (updates.name || updates.fullName).trim();
    }

    // Reg No / Student ID
    if (updates.regNo) {
      student.regNo = updates.regNo.trim().toUpperCase();
      student.studentId = student.regNo;
    } else if (updates.studentId || updates.id) {
      const newId = (updates.studentId || updates.id).trim().toUpperCase();
      if (!newId.match(/^[0-9a-fA-F]{24}$/)) {
        student.studentId = newId;
        if (!student.regNo) student.regNo = newId;
      }
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

    // Year
    if (updates.year !== undefined) {
      student.year = updates.year.trim();
    }

    // Login ID
    if (updates.loginId !== undefined) {
      student.loginId = updates.loginId.trim();
    }

    // Student Information Fields
    if (updates.aadhaar !== undefined) student.aadhaar = updates.aadhaar.trim();
    if (updates.pan !== undefined) student.pan = updates.pan.trim().toUpperCase();
    if (updates.bankAccountNo !== undefined) student.bankAccountNo = updates.bankAccountNo.trim();
    if (updates.bankName !== undefined) student.bankName = updates.bankName.trim();
    if (updates.ifscCode !== undefined) student.ifscCode = updates.ifscCode.trim().toUpperCase();
    if (updates.bankBranch !== undefined) student.bankBranch = updates.bankBranch.trim();
    if (updates.drivingLicense !== undefined) student.drivingLicense = updates.drivingLicense.trim().toUpperCase();
    if (updates.emisNumber !== undefined) student.emisNumber = updates.emisNumber.trim();
    if (updates.tenthMarks !== undefined) student.tenthMarks = updates.tenthMarks.trim();
    if (updates.tenthPercentage !== undefined) student.tenthPercentage = updates.tenthPercentage.trim();
    if (updates.tenthBoard !== undefined) student.tenthBoard = updates.tenthBoard.trim();
    if (updates.twelfthMarks !== undefined) student.twelfthMarks = updates.twelfthMarks.trim();
    if (updates.twelfthPercentage !== undefined) student.twelfthPercentage = updates.twelfthPercentage.trim();
    if (updates.twelfthBoard !== undefined) student.twelfthBoard = updates.twelfthBoard.trim();
    if (updates.nationality !== undefined) student.nationality = updates.nationality.trim();
    if (updates.caste !== undefined) student.caste = updates.caste.trim();
    if (updates.religion !== undefined) student.religion = updates.religion.trim();
    if (updates.donation !== undefined) student.donation = updates.donation.trim();

    // Department, Course & 1-8 Fields
    if (updates.department) student.department = updates.department.trim();
    if (updates.course) student.course = updates.course.trim();
    if (updates.courseAdmitted !== undefined) {
      student.courseAdmitted = updates.courseAdmitted.trim();
      if (!student.course || student.course === 'Undergraduate') student.course = updates.courseAdmitted.trim();
      if (!student.department || student.department === 'General') student.department = updates.courseAdmitted.trim();
    }
    if (updates.dateOfAdmission !== undefined) student.dateOfAdmission = updates.dateOfAdmission.trim();
    if (updates.nationalityReligion !== undefined) student.nationalityReligion = updates.nationalityReligion.trim();
    if (updates.casteCommunity !== undefined) student.casteCommunity = updates.casteCommunity.trim();

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
    if (updates.dob) {
      student.dob = updates.dob;
      // Also update default password if not custom-set
      if (!updates.password && (!student.password || student.password.includes('@2026'))) {
        student.password = updates.dob;
      }
    }
    if (updates.password) student.password = updates.password;

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
        message: `A student with this ${field === 'studentId' ? 'Student ID' : field === 'admNo' ? 'Admission No.' : field === 'regNo' ? 'Reg No' : field} already exists.` 
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
          { regNo: id.toUpperCase() },
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
      message: `Student "${deleted.name}" (${deleted.regNo || deleted.studentId}) deleted successfully.`
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
          { regNo: id.toUpperCase() },
          { studentId: id.toUpperCase() },
          { admNo: id.toUpperCase() }
        ]
      });
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const regNo = student.regNo || student.studentId;
    const loginId = regNo;
    const password = student.dob || `${regNo.toLowerCase()}@2026`;

    res.status(200).json({
      success: true,
      credentials: {
        regNo: regNo,
        studentId: regNo,
        rollNo: student.rollNo || '—',
        year: student.year || '1st Year',
        loginId: loginId,
        admNo: student.admNo,
        name: student.name,
        department: student.department,
        course: student.course,
        sem: student.sem,
        dob: student.dob,
        phone: student.phone,
        email: student.email,
        loginUsername: loginId,
        alternateLogin: student.rollNo || student.admNo,
        defaultPasscode: password,
        attendance: student.attendance,
        feeStatus: student.feeStatus,
        status: student.status,
        aadhaar: student.aadhaar || '—',
        pan: student.pan || '—',
        bankAccountNo: student.bankAccountNo || '—',
        bankName: student.bankName || '—',
        ifscCode: student.ifscCode || '—',
        bankBranch: student.bankBranch || '—',
        drivingLicense: student.drivingLicense || '—',
        emisNumber: student.emisNumber || '—',
        tenthMarks: student.tenthMarks || '—',
        twelfthMarks: student.twelfthMarks || '—',
        nationality: student.nationality || 'Indian',
        caste: student.caste || '—',
        religion: student.religion || 'Hindu',
        donation: student.donation || 'Nil'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
