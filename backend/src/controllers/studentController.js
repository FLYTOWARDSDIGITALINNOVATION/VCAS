const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const xlsx = require('xlsx');
const ExcelJS = require('exceljs');
const AdmZip = require('adm-zip');

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
      umisNumber: (body.umisNumber || body.umis || '').trim().toUpperCase(),
      year: body.year || '1st Year',
      batch: (body.batch || '2022-2026').replace('–', '-').trim(),
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
    if (updates.batch) student.batch = String(updates.batch).replace('–', '-').trim();
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

// Helper: Format Excel dates properly (handles serial numbers, strings, and Date objects)
function formatExcelDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'number') {
    try {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch (_) { }
  }
  return String(val).trim();
}

// Helper: Normalize Excel / CSV row data with ultra-flexible column names
function normalizeStudentRow(rawRow) {
  if (!rawRow || typeof rawRow !== 'object') return null;
  const norm = {};
  for (const [key, val] of Object.entries(rawRow)) {
    if (val === undefined || val === null) continue;
    const cleanKey = key.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    norm[cleanKey] = val;
  }

  const getVal = (...keys) => {
    for (const k of keys) {
      const clean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (norm[clean] !== undefined && norm[clean] !== null && String(norm[clean]).trim() !== '') {
        return norm[clean];
      }
    }
    // Partial substring fallback search on keys
    for (const k of keys) {
      const clean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const [actualKey, actualVal] of Object.entries(norm)) {
        if (actualKey.includes(clean) && actualVal !== undefined && actualVal !== null && String(actualVal).trim() !== '') {
          return actualVal;
        }
      }
    }
    return '';
  };

  // Ultra-wide student name recognition
  let name = String(getVal(
    'name', 'studentname', 'fullname', 'nameofstudent', 'nameofthestudent',
    'student', 'candidatename', 'nameofcandidate', 'pupilname', 'personname'
  )).trim();

  // If still empty, check if any column header has "name" in it
  if (!name) {
    for (const [k, v] of Object.entries(norm)) {
      if (k.includes('name') && !k.includes('father') && !k.includes('mother') && !k.includes('parent') && !k.includes('bank') && !k.includes('college')) {
        if (v && String(v).trim()) {
          name = String(v).trim();
          break;
        }
      }
    }
  }

  // Skip title banners or empty rows
  if (!name || name.toLowerCase().includes('college') || name.toLowerCase().includes('university') || name.toLowerCase().includes('department of')) {
    return null;
  }

  const regNo = String(getVal('regno', 'registerno', 'registernumber', 'registrationno', 'registrationnumber', 'studentid', 'id', 'regn', 'register', 'admnumber', 'admissionno')).trim().toUpperCase();
  const rollNo = String(getVal('rollno', 'rollnumber', 'roll', 'classrollno', 'rno', 'sno', 'slno', 'serialno', 'seatno')).trim().toUpperCase();
  
  // Date of Admission vs Admission Number: never let admission date be captured as admNo
  const dateOfAdmission = formatExcelDate(getVal('dateofadmission', 'admissiondate', 'doa', 'doadm', 'admissionyear'));
  let admNo = String(getVal('admno', 'admissionno', 'admissionnumber', 'admissionid', 'admnumber')).trim().toUpperCase();
  // If admNo was mistakenly assigned a date string like "15/06/2024", clear it
  if (admNo.includes('/') || (admNo.includes('-') && admNo.length === 10)) {
    admNo = '';
  }

  const umisNumber = String(getVal('umisnumber', 'umis', 'emis', 'emisnumber')).trim().toUpperCase();
  const department = String(getVal('department', 'dept', 'branch', 'major', 'course', 'stream') || 'General').trim();
  const course = String(getVal('course', 'degree', 'programme', 'prog') || 'Undergraduate').trim();
  const courseAdmitted = String(getVal('courseadmitted', 'admittedcourse') || course).trim();
  const sem = String(getVal('sem', 'semester', 'currentsem') || '1st Sem').trim();
  const year = String(getVal('year', 'classyear', 'academicsem') || '1st Year').trim();
  const batch = String(getVal('batch', 'batchyear') || '2022-2026').replace('–', '-').trim();
  const academicYear = String(getVal('academicyear', 'session') || '2025-2026').replace('–', '-').trim();
  const section = String(getVal('section', 'sec') || 'A').trim();
  const rawGender = String(getVal('gender', 'sex') || '').trim();
  let gender = 'Male';
  if (rawGender) {
    if (rawGender.toLowerCase().startsWith('f') || rawGender.toLowerCase() === 'w') {
      gender = 'Female';
    } else {
      gender = 'Male';
    }
  }
  const dobRaw = getVal('dob', 'dateofbirth', 'birthdate', 'birth', 'd.o.b', 'date_of_birth', 'borndate');
  const dob = formatExcelDate(dobRaw);
  const bloodGroup = String(getVal('bloodgroup', 'blood', 'bg') || 'O+').trim();
  const phone = String(getVal('phone', 'mobile', 'mobileno', 'phonenumber', 'contact', 'contactno', 'cell', 'studentmobile', 'parentphone', 'fathermobile', 'tel', 'whatsapp')).trim();
  const email = String(getVal('email', 'emailid', 'mail')).trim().toLowerCase();
  const fatherName = String(getVal('fathername', 'fathersname', 'father')).trim();
  const motherName = String(getVal('mothername', 'mothersname', 'mother')).trim();
  const fatherMobile = String(getVal('fathermobile', 'fatherphone', 'parentphone', 'parentmobile', 'parentsphone')).trim();
  const motherMobile = String(getVal('mothermobile', 'motherphone')).trim();
  const parentOccupation = String(getVal('parentoccupation', 'fatheroccupation')).trim();
  const parentEmail = String(getVal('parentemail')).trim();
  const address = String(getVal('address', 'permanentaddress', 'commaddress', 'street')).trim();
  const city = String(getVal('city', 'town', 'native')).trim();
  const state = String(getVal('state') || 'Tamil Nadu').trim();
  const pinCode = String(getVal('pincode', 'pin', 'postalcode', 'zip')).trim();
  const caste = String(getVal('caste')).trim();
  const community = String(getVal('community', 'castecommunity') || 'BC').trim();
  const religion = String(getVal('religion') || 'Hindu').trim();
  const nationality = String(getVal('nationality') || 'Indian').trim();
  const tenthMarks = String(getVal('tenthmarks', '10thmarks', 'sslcmarks', '10th')).trim();
  const tenthPercentage = String(getVal('tenthpercentage', '10thpercentage', '10thpercent')).trim();
  const twelfthMarks = String(getVal('twelfthmarks', '12thmarks', 'hscmarks', '12th')).trim();
  const twelfthPercentage = String(getVal('twelfthpercentage', '12thpercentage', '12thpercent')).trim();
  const cgpa = String(getVal('cgpa', 'gpa') || '8.0').trim();
  const rawAtt = getVal('attendance', 'attendancepercent');
  const attendance = rawAtt !== '' && !isNaN(Number(rawAtt)) ? Number(rawAtt) : 85;
  const rawFeeStatus = String(getVal('feestatus', 'feesstatus') || 'Pending').trim().toLowerCase();
  let feeStatus = 'Pending';
  if (rawFeeStatus.includes('paid') || rawFeeStatus === 'cleared' || rawFeeStatus === 'yes' || rawFeeStatus === 'done') {
    feeStatus = 'Paid';
  } else if (rawFeeStatus.includes('partial')) {
    feeStatus = 'Partial';
  } else if (rawFeeStatus.includes('overdue')) {
    feeStatus = 'Overdue';
  }

  // Sanitize student status (ignore unrelated columns like Parent Status, Occupation, Working, School, College, etc.)
  const rawStatus = String(getVal('studentstatus', 'enrollmentstatus', 'academicstatus', 'status') || 'Active').trim().toLowerCase();
  let status = 'Active';
  if (rawStatus === 'inactive' || rawStatus === 'discontinued' || rawStatus === 'dropped') {
    status = 'Inactive';
  } else if (rawStatus === 'suspended') {
    status = 'Suspended';
  } else {
    // If the Excel column contained values like "Working", "School", "College", "Not Applicable", default to Active student!
    status = 'Active';
  }

  const cleanTextNo = (val) => {
    if (!val || typeof val !== 'string') return '';
    const s = val.trim();
    if (s.startsWith('data:image/') || s.startsWith('http://') || s.startsWith('https://') || s.startsWith('DATA:IMAGE/')) return '';
    return s;
  };

  const aadhaar = cleanTextNo(String(getVal('aadhaarno', 'aadharno', 'aadhaar', 'aadhar', 'uid')));
  const pan = cleanTextNo(String(getVal('panno', 'pan'))).toUpperCase();
  const incomeCertNo = cleanTextNo(String(getVal('incomecertno', 'incomecert', 'incomecertificate', 'incomeno', 'annualincomecert')));
  const drivingLicense = cleanTextNo(String(getVal('drivinglicenseno', 'drivinglicenceno', 'dlno', 'drivinglicense', 'drivinglicence', 'license', 'licence'))).toUpperCase();

  const isImageValue = (v) => {
    if (!v || typeof v !== 'string') return false;
    const s = v.trim();
    return s.startsWith('data:image/') || s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/uploads/') || s.startsWith('blob:');
  };

  const getDocImage = (key, ...aliases) => {
    // 1. Direct rawRow properties (populated by extractStudentsWithImages)
    if (isImageValue(rawRow[key])) return rawRow[key].trim();
    for (const a of aliases) {
      if (isImageValue(rawRow[a])) return rawRow[a].trim();
    }

    // 2. Check getVal ONLY if the value is a valid image URI
    for (const a of [key, ...aliases]) {
      const v = getVal(a);
      if (isImageValue(v)) return String(v).trim();
    }

    return '';
  };

  // Document Images (Base64 data URIs or image URLs only)
  const photo = getDocImage('photo', 'studentphoto', 'photoimage', 'passportphoto', 'image', 'profilephoto');
  const docAadhaar = getDocImage('docAadhaar', 'aadhaarcardimage', 'aadhaarimage', 'aadhardocument', 'aadhaardoc', 'aadharimage');
  const docPan = getDocImage('docPan', 'pancardimage', 'panimage', 'pandocument', 'pandoc');
  const docIncomeCert = getDocImage('docIncomeCert', 'incomecertificateimage', 'incomecertimage', 'incomecertificatedoc', 'incomecertdoc');
  const docDrivingLicense = getDocImage('docDrivingLicense', 'drivinglicenceimage', 'drivinglicenseimage', 'drivinglicencedoc', 'drivinglicensedoc', 'dlimage', 'dldoc');
  const doc10th = getDocImage('doc10th', '10thmarksheetimage', '10thmarksheet', '10thimage', '10thdoc', 'sslcimage', 'sslcdoc');
  const doc12th = getDocImage('doc12th', '12thmarksheetimage', '12thmarksheet', '12thimage', '12thdoc', 'hscimage', 'hscdoc');

  return {
    name,
    regNo,
    rollNo,
    admNo,
    umisNumber,
    department,
    course,
    courseAdmitted,
    dateOfAdmission: dateOfAdmission || '',
    sem,
    year,
    batch,
    academicYear,
    section,
    gender,
    dob,
    bloodGroup,
    phone,
    email,
    fatherName,
    motherName,
    fatherMobile,
    motherMobile,
    parentOccupation,
    parentEmail,
    address,
    city,
    state,
    pinCode,
    caste,
    community,
    casteCommunity: community,
    religion,
    nationality,
    nationalityReligion: `${nationality} & ${religion}`,
    tenthMarks,
    tenthPercentage,
    twelfthMarks,
    twelfthPercentage,
    cgpa,
    attendance,
    feeStatus,
    status,
    aadhaar,
    pan,
    incomeCertNo,
    drivingLicense,
    photo,
    docAadhaar,
    docPan,
    docIncomeCert,
    docDrivingLicense,
    doc10th,
    doc12th
  };
}

// Helper: Smart Excel sheet parser that finds the header row automatically
function extractRowsFromWorksheet(worksheet) {
  const rawMatrix = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!rawMatrix || rawMatrix.length === 0) return [];

  let headerRowIndex = 0;
  for (let r = 0; r < Math.min(rawMatrix.length, 12); r++) {
    const row = rawMatrix[r];
    if (Array.isArray(row)) {
      const rowStr = row.map(c => String(c).toLowerCase().replace(/[^a-z0-9]/g, '')).join(' ');
      if (
        (rowStr.includes('name') && (rowStr.includes('reg') || rowStr.includes('roll') || rowStr.includes('adm') || rowStr.includes('dept') || rowStr.includes('gender') || rowStr.includes('photo') || rowStr.includes('aadhaar'))) ||
        (rowStr.includes('student') && (rowStr.includes('roll') || rowStr.includes('reg') || rowStr.includes('name')))
      ) {
        headerRowIndex = r;
        break;
      }
    }
  }

  const rows = xlsx.utils.sheet_to_json(worksheet, {
    range: headerRowIndex,
    defval: ''
  });

  return rows;
}

// Helper: Extract student rows along with embedded drawings, cell images, and media
async function extractStudentsWithImages(workbookBuffer) {
  const workbook = xlsx.read(workbookBuffer, { type: 'buffer', cellDates: true });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) return [];

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const rawMatrix = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!rawMatrix || rawMatrix.length === 0) return [];

  let headerRowIndex = 0;
  for (let r = 0; r < Math.min(rawMatrix.length, 12); r++) {
    const row = rawMatrix[r];
    if (Array.isArray(row)) {
      const rowStr = row.map(c => String(c).toLowerCase().replace(/[^a-z0-9]/g, '')).join(' ');
      if (
        (rowStr.includes('name') && (rowStr.includes('reg') || rowStr.includes('roll') || rowStr.includes('adm') || rowStr.includes('dept') || rowStr.includes('gender') || rowStr.includes('photo') || rowStr.includes('aadhaar'))) ||
        (rowStr.includes('student') && (rowStr.includes('roll') || rowStr.includes('reg') || rowStr.includes('name')))
      ) {
        headerRowIndex = r;
        break;
      }
    }
  }

  const headerColumns = Array.isArray(rawMatrix[headerRowIndex]) 
    ? rawMatrix[headerRowIndex].map(c => String(c || '').trim()) 
    : [];

  const rows = xlsx.utils.sheet_to_json(worksheet, {
    range: headerRowIndex,
    defval: ''
  });

  if (!rows || rows.length === 0) return [];

  // Extract embedded images by row and column
  const imagesByRowCol = {};
  const setImg = (r, c, dataUri) => {
    if (!imagesByRowCol[r]) imagesByRowCol[r] = {};
    imagesByRowCol[r][c] = dataUri;
  };

  // 1. Primary: AdmZip parser for media, drawing XML & cell images
  try {
    const zip = new AdmZip(workbookBuffer);
    const zipEntries = zip.getEntries();
    
    const mediaMap = {};
    for (const entry of zipEntries) {
      if (entry.entryName.startsWith('xl/media/')) {
        const fileName = entry.entryName.split('/').pop();
        const ext = fileName.split('.').pop().toLowerCase();
        const mime = ext === 'png' ? 'image/png' : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : (ext === 'webp' ? 'image/webp' : 'application/octet-stream');
        const base64Data = entry.getData().toString('base64');
        mediaMap[fileName] = `data:${mime};base64,${base64Data}`;
      }
    }

    if (Object.keys(mediaMap).length > 0) {
      const drawingRels = {};
      for (const entry of zipEntries) {
        if (entry.entryName.startsWith('xl/drawings/_rels/')) {
          const text = entry.getData().toString('utf8');
          const relTagRegex = /<Relationship\b([^>]+)\/?>/g;
          let rMatch;
          while ((rMatch = relTagRegex.exec(text)) !== null) {
            const attrs = rMatch[1];
            const idM = attrs.match(/Id="([^"]+)"/);
            const targetM = attrs.match(/Target="([^"]+)"/);
            if (idM && targetM) {
              const id = idM[1];
              const fileName = targetM[1].split('/').pop();
              drawingRels[id] = fileName;
            }
          }
        }
      }

      for (const entry of zipEntries) {
        if (entry.entryName.startsWith('xl/drawings/') && entry.entryName.endsWith('.xml') && !entry.entryName.includes('/_rels/')) {
          const xml = entry.getData().toString('utf8');
          const anchorRegex = /<(?:xdr:)?(?:oneCellAnchor|twoCellAnchor)[^>]*>([\s\S]*?)<\/(?:xdr:)?(?:oneCellAnchor|twoCellAnchor)>/g;
          let aMatch;
          while ((aMatch = anchorRegex.exec(xml)) !== null) {
            const block = aMatch[1];
            const colMatch = block.match(/<(?:xdr:)?col>(\d+)<\/(?:xdr:)?col>/);
            const rowMatch = block.match(/<(?:xdr:)?row>(\d+)<\/(?:xdr:)?row>/);
            const blipMatch = block.match(/(?:<a:blip|<blip)[^>]+(?:r:embed|embed)="([^"]+)"/);

            if (colMatch && rowMatch && blipMatch) {
              const col = parseInt(colMatch[1], 10);
              const row = parseInt(rowMatch[1], 10);
              const rId = blipMatch[1];
              const fileName = drawingRels[rId];
              if (fileName && mediaMap[fileName] && (!imagesByRowCol[row] || !imagesByRowCol[row][col])) {
                setImg(row, col, mediaMap[fileName]);
              }
            }
          }
        }
      }
    }
  } catch (zipErr) {
    console.warn('AdmZip parser error:', zipErr.message);
  }

  // 2. Secondary: ExcelJS parser for drawings & anchored images (safe fallback)
  try {
    const ejWb = new ExcelJS.Workbook();
    await ejWb.xlsx.load(workbookBuffer);
    const ejWs = ejWb.worksheets[0];
    if (ejWs && typeof ejWs.getImages === 'function') {
      const ejImages = ejWs.getImages();
      for (const img of ejImages) {
        try {
          const imgObj = ejWb.getImage(img.imageId);
          if (imgObj && imgObj.buffer) {
            const ext = (imgObj.extension || 'png').toLowerCase();
            const mime = ext === 'png' ? 'image/png' : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : (ext === 'webp' ? 'image/webp' : 'application/octet-stream');
            const dataUri = `data:${mime};base64,${imgObj.buffer.toString('base64')}`;

            const r = (img.range?.tl?.nativeRow !== undefined) ? img.range.tl.nativeRow : (img.range?.tl?.row !== undefined ? Math.floor(img.range.tl.row) : -1);
            const c = (img.range?.tl?.nativeCol !== undefined) ? img.range.tl.nativeCol : (img.range?.tl?.col !== undefined ? Math.floor(img.range.tl.col) : -1);

            if (r >= 0 && c >= 0 && (!imagesByRowCol[r] || !imagesByRowCol[r][c])) {
              setImg(r, c, dataUri);
            }
          }
        } catch (e) {
          // ignore single image read error
        }
      }
    }
  } catch (ejErr) {
    // ExcelJS error caught safely
  }

  // Map column index to student document field name
  const colDocFieldMap = {};
  
  // Pass 1: Prioritize explicit image columns
  headerColumns.forEach((colName, cIdx) => {
    if (!colName) return;
    const clean = colName.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (clean.includes('photo') || clean.includes('avatar') || clean.includes('passport') || clean.includes('profilepic') || clean.includes('profilephoto')) {
      colDocFieldMap[cIdx] = 'photo';
    } else if ((clean.includes('aadhaar') || clean.includes('aadhar')) && clean.includes('image')) {
      colDocFieldMap[cIdx] = 'docAadhaar';
    } else if (clean.includes('pan') && clean.includes('image')) {
      colDocFieldMap[cIdx] = 'docPan';
    } else if (clean.includes('income') && clean.includes('image')) {
      colDocFieldMap[cIdx] = 'docIncomeCert';
    } else if ((clean.includes('driving') || clean.includes('licence') || clean.includes('license') || clean.includes('dl')) && clean.includes('image')) {
      colDocFieldMap[cIdx] = 'docDrivingLicense';
    } else if ((clean.includes('10th') || clean.includes('sslc') || clean.includes('tenth') || clean.includes('xstd')) && clean.includes('image')) {
      colDocFieldMap[cIdx] = 'doc10th';
    } else if ((clean.includes('12th') || clean.includes('hsc') || clean.includes('twelfth') || clean.includes('xiistd') || clean.includes('plus2')) && clean.includes('image')) {
      colDocFieldMap[cIdx] = 'doc12th';
    }
  });

  // Pass 2: Fallback for sheets without explicit 'image' in the header title
  const mappedFields = new Set(Object.values(colDocFieldMap));
  headerColumns.forEach((colName, cIdx) => {
    if (!colName || colDocFieldMap[cIdx]) return;
    const clean = colName.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!mappedFields.has('docAadhaar') && (clean.includes('aadhaar') || clean.includes('aadhar')) && !clean.includes('no') && !clean.includes('num')) {
      colDocFieldMap[cIdx] = 'docAadhaar';
      mappedFields.add('docAadhaar');
    } else if (!mappedFields.has('docPan') && clean.includes('pan') && !clean.includes('no') && !clean.includes('num')) {
      colDocFieldMap[cIdx] = 'docPan';
      mappedFields.add('docPan');
    } else if (!mappedFields.has('docIncomeCert') && clean.includes('income') && !clean.includes('no') && !clean.includes('num')) {
      colDocFieldMap[cIdx] = 'docIncomeCert';
      mappedFields.add('docIncomeCert');
    } else if (!mappedFields.has('docDrivingLicense') && (clean.includes('driving') || clean.includes('licence') || clean.includes('license') || clean.includes('dl')) && !clean.includes('no') && !clean.includes('num')) {
      colDocFieldMap[cIdx] = 'docDrivingLicense';
      mappedFields.add('docDrivingLicense');
    } else if (!mappedFields.has('doc10th') && (clean.includes('10th') || clean.includes('sslc') || clean.includes('tenth')) && (clean.includes('sheet') || clean.includes('upload') || clean.includes('doc'))) {
      colDocFieldMap[cIdx] = 'doc10th';
      mappedFields.add('doc10th');
    } else if (!mappedFields.has('doc12th') && (clean.includes('12th') || clean.includes('hsc') || clean.includes('twelfth')) && (clean.includes('sheet') || clean.includes('upload') || clean.includes('doc'))) {
      colDocFieldMap[cIdx] = 'doc12th';
      mappedFields.add('doc12th');
    }
  });

  // Prepare ordered list per column for fallback row-sequence matching
  const colOrderedList = {};
  for (const [rStr, cols] of Object.entries(imagesByRowCol)) {
    const r = parseInt(rStr, 10);
    if (r <= headerRowIndex) continue;
    for (const [cStr, dataUri] of Object.entries(cols)) {
      const c = parseInt(cStr, 10);
      if (!colOrderedList[c]) colOrderedList[c] = [];
      colOrderedList[c].push({ row: r, dataUri });
    }
  }
  for (const c of Object.keys(colOrderedList)) {
    colOrderedList[c].sort((a, b) => a.row - b.row);
  }

  // Attach images to student rows
  const enrichedRows = rows.map((rowObj, rowIdx) => {
    const sheetRow = headerRowIndex + 1 + rowIdx;
    const enriched = { ...rowObj };

    const directImages = imagesByRowCol[sheetRow] || imagesByRowCol[sheetRow + 1] || imagesByRowCol[sheetRow - 1];

    for (const [cStr, docField] of Object.entries(colDocFieldMap)) {
      const colIdx = parseInt(cStr, 10);
      let imgData = directImages ? directImages[colIdx] : null;

      if (!imgData && colOrderedList[colIdx] && colOrderedList[colIdx][rowIdx]) {
        imgData = colOrderedList[colIdx][rowIdx].dataUri;
      }

      if (imgData) {
        enriched[docField] = imgData;
        const colHeader = headerColumns[colIdx];
        if (colHeader) {
          enriched[colHeader] = imgData;
        }
      }
    }

    return enriched;
  });

  return enrichedRows;
}

// Helper: Process array of student rows (from Excel or JSON)
async function processStudentsBatch(rawRows) {
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors = [];
  const processedRecords = [];

  let currentCount = await Student.countDocuments();

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rowNum = i + 1;

    try {
      const normalized = normalizeStudentRow(row);
      if (!normalized || !normalized.name) {
        skippedCount++;
        continue;
      }

      // Check existing student ONLY by explicit unique regNo or rollNo (NEVER by admNo to prevent date collisions)
      let existingStudent = null;
      if (normalized.regNo && !normalized.regNo.toLowerCase().includes('auto') && !normalized.regNo.toLowerCase().includes('tba') && !normalized.regNo.includes('/')) {
        existingStudent = await Student.findOne({
          $or: [
            { regNo: normalized.regNo },
            { studentId: normalized.regNo }
          ]
        });
      }
      if (!existingStudent && normalized.rollNo && normalized.rollNo.length >= 3 && !normalized.rollNo.includes('/') && normalized.department && normalized.department !== 'General') {
        existingStudent = await Student.findOne({
          rollNo: normalized.rollNo,
          department: normalized.department
        });
      }

      if (existingStudent) {
        // Update existing student record with non-empty incoming values
        for (const [k, v] of Object.entries(normalized)) {
          if (v !== '' && v !== undefined && v !== null) {
            existingStudent[k] = v;
          }
        }
        if (normalized.dob) {
          existingStudent.password = normalized.dob;
        }
        await existingStudent.save();
        updatedCount++;
        processedRecords.push({
          row: rowNum,
          name: existingStudent.name,
          regNo: existingStudent.regNo,
          action: 'updated'
        });
        continue;
      }

      // Determine regNo
      let finalRegNo = normalized.regNo;
      if (!finalRegNo || finalRegNo.toLowerCase().includes('auto')) {
        currentCount++;
        let candidate = `REG2026${String(currentCount).padStart(3, '0')}`;
        while (await Student.findOne({ $or: [{ regNo: candidate }, { studentId: candidate }] })) {
          currentCount++;
          candidate = `REG2026${String(currentCount).padStart(3, '0')}`;
        }
        finalRegNo = candidate;
      }

      // Determine admNo
      let finalAdmNo = normalized.admNo;
      if (!finalAdmNo) {
        let candidate = `ADM2026${String(currentCount).padStart(3, '0')}`;
        while (await Student.findOne({ admNo: candidate })) {
          currentCount++;
          candidate = `ADM2026${String(currentCount).padStart(3, '0')}`;
        }
        finalAdmNo = candidate;
      }

      const finalStudentId = finalRegNo;
      const finalPassword = normalized.dob ? normalized.dob : `${finalRegNo.toLowerCase()}@2026`;

      const newStudent = new Student({
        ...normalized,
        studentId: finalStudentId,
        regNo: finalRegNo,
        admNo: finalAdmNo,
        loginId: finalRegNo,
        password: finalPassword
      });

      const saved = await newStudent.save();
      createdCount++;
      processedRecords.push({
        row: rowNum,
        name: saved.name,
        regNo: saved.regNo,
        action: 'created'
      });
    } catch (rowErr) {
      console.error(`Error saving student row #${rowNum}:`, rowErr.message);
      errors.push({
        row: rowNum,
        error: rowErr.message || 'Failed to save student record'
      });
    }
  }

  return {
    totalRows: rawRows.length,
    createdCount,
    updatedCount,
    skippedCount,
    errorsCount: errors.length,
    errors,
    processedRecords
  };
}

// @desc   Bulk import students from JSON array
// @route  POST /api/students/bulk
exports.bulkImportStudents = async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No student records provided. Please provide an array of students.'
      });
    }

    const result = await processStudentsBatch(students);
    res.status(200).json({
      success: true,
      message: `Processed ${result.totalRows} student rows (${result.createdCount} added, ${result.updatedCount} updated, ${result.errorsCount} errors).`,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Upload and parse Excel file for student bulk import
// @route  POST /api/students/upload-excel
exports.uploadExcelStudents = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is required. Please upload a .xlsx, .xls, or .csv file.'
      });
    }

    // Extract student rows WITH embedded images!
    const rawRows = await extractStudentsWithImages(req.file.buffer);

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data rows found in the uploaded Excel file.'
      });
    }

    // Apply optional department/batch from req.body if supplied
    const finalRows = rawRows.map(r => {
      const obj = { ...r };
      if (req.body.department) {
        obj.department = req.body.department;
        obj.Department = req.body.department;
      }
      if (req.body.batch) {
        obj.batch = req.body.batch;
        obj.Batch = req.body.batch;
      }
      return obj;
    });

    const result = await processStudentsBatch(finalRows);
    res.status(200).json({
      success: true,
      message: `Excel processed: ${result.createdCount} students created, ${result.updatedCount} updated, ${result.errorsCount} errors.`,
      data: result
    });
  } catch (error) {
    console.error('Error in uploadExcelStudents:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

