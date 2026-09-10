const Class = require('../models/Class');
const Staff = require('../models/Staff');

// Helper to find a class by ID or Code
async function findClassByIdOrCode(identifier, staffId = null) {
  const query = {};
  if (staffId) query.staffId = staffId;

  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    // Valid ObjectId
    query._id = identifier;
  } else {
    // Treat as class code (e.g. CS401)
    query.code = identifier.trim().toUpperCase();
  }
  return await Class.findOne(query);
}

// @desc    Get all classes (with optional filters)
// @route   GET /api/classes
exports.getAllClasses = async (req, res) => {
  try {
    const { dept, semester, year, staffId, section, search } = req.query;
    const filter = {};

    if (dept) filter.dept = dept;
    if (semester) filter.semester = Number(semester);
    if (year) filter.year = Number(year);
    if (staffId) filter.staffId = staffId.trim();
    if (section) filter.section = section.toUpperCase();

    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { staffName: { $regex: search, $options: 'i' } }
      ];
    }

    const classes = await Class.find(filter).sort({ code: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: classes.length,
      classes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all classes for a specific staff member
// @route   GET /api/classes/staff/:staffId
exports.getStaffClasses = async (req, res) => {
  try {
    const { staffId } = req.params;
    const staff = await Staff.findOne({ staffId });

    // Query Class collection directly
    let classes = await Class.find({ staffId }).sort({ code: 1 });

    // Fallback: If no classes in Class collection but staff has embedded classes, return them
    if (classes.length === 0 && staff && staff.classes && staff.classes.length > 0) {
      classes = staff.classes;
    }

    res.status(200).json({
      success: true,
      staffId: staff ? staff.staffId : staffId,
      staffName: staff ? staff.name : '',
      department: staff ? staff.department : '',
      classTeacherOf: staff ? staff.classTeacherOf : '',
      classes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single class by ID or Code
// @route   GET /api/classes/:idOrCode
// @route   GET /api/classes/code/:classCode
exports.getClassDetails = async (req, res) => {
  try {
    const identifier = req.params.classCode || req.params.idOrCode || req.params.id;
    const staffId = req.params.staffId || null;

    let targetClass = await findClassByIdOrCode(identifier, staffId);

    // Fallback check in Staff.classes if not found in Class collection
    if (!targetClass && staffId) {
      const staff = await Staff.findOne({ staffId });
      if (staff && staff.classes) {
        targetClass = staff.classes.find(c => c.code.toUpperCase() === identifier.toUpperCase());
      }
    }

    if (!targetClass) {
      return res.status(404).json({
        success: false,
        message: `Class "${identifier}" not found.`
      });
    }

    res.status(200).json({ success: true, class: targetClass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add / Create a new class
// @route   POST /api/classes
// @route   POST /api/classes/staff/:staffId
exports.addClass = async (req, res) => {
  try {
    const staffIdParam = req.params.staffId;
    const {
      code,
      name,
      dept,
      semester,
      year,
      section,
      credits,
      staffId,
      staffName,
      room,
      academicYear,
      students
    } = req.body;

    const finalCode = (code || '').trim().toUpperCase();
    const finalStaffId = (staffId || staffIdParam || '').trim();

    if (!finalCode || !name || !semester || !year) {
      return res.status(400).json({
        success: false,
        message: 'code, name, semester, and year are required.'
      });
    }

    if (!finalStaffId) {
      return res.status(400).json({
        success: false,
        message: 'staffId is required to associate this class.'
      });
    }

    // Check if class with this code already exists
    const existing = await Class.findOne({ code: finalCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Class with code "${finalCode}" already exists.`
      });
    }

    // Lookup staff to get department and name if missing
    const staff = await Staff.findOne({ staffId: finalStaffId });
    const finalStaffName = staffName || (staff ? staff.name : '');
    const finalDept = dept || (staff ? staff.department : '');

    const newClass = new Class({
      code: finalCode,
      name: name.trim(),
      dept: finalDept,
      semester: Number(semester),
      year: Number(year),
      section: (section || 'A').trim().toUpperCase(),
      credits: Number(credits) || 3,
      staffId: finalStaffId,
      staffName: finalStaffName,
      room: (room || '').trim(),
      academicYear: (academicYear || '2025-2026').trim(),
      students: Array.isArray(students) ? students : []
    });

    await newClass.save();

    // Optionally sync into staff.classes array for backwards-compatibility
    if (staff) {
      const alreadyInStaff = staff.classes.some(c => c.code.toUpperCase() === finalCode);
      if (!alreadyInStaff) {
        staff.classes.push({
          code: newClass.code,
          name: newClass.name,
          dept: newClass.dept,
          semester: newClass.semester,
          year: newClass.year,
          section: newClass.section,
          credits: newClass.credits,
          totalStudents: newClass.totalStudents,
          enrolledStudents: newClass.students
        });
        await staff.save();
      }
    }

    res.status(201).json({
      success: true,
      message: `Class ${newClass.code} created successfully.`,
      class: newClass
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a class
// @route   PUT /api/classes/:idOrCode
// @route   PUT /api/classes/staff/:staffId/:classCode
exports.updateClass = async (req, res) => {
  try {
    const identifier = req.params.classCode || req.params.idOrCode || req.params.id;
    const staffId = req.params.staffId || null;

    const targetClass = await findClassByIdOrCode(identifier, staffId);
    if (!targetClass) {
      return res.status(404).json({ success: false, message: `Class "${identifier}" not found.` });
    }

    const {
      name,
      dept,
      semester,
      year,
      section,
      credits,
      staffId: newStaffId,
      staffName,
      room,
      academicYear
    } = req.body;

    if (name) targetClass.name = name.trim();
    if (dept) targetClass.dept = dept.trim();
    if (semester !== undefined) targetClass.semester = Number(semester);
    if (year !== undefined) targetClass.year = Number(year);
    if (section) targetClass.section = section.trim().toUpperCase();
    if (credits !== undefined) targetClass.credits = Number(credits);
    if (newStaffId) targetClass.staffId = newStaffId.trim();
    if (staffName !== undefined) targetClass.staffName = staffName.trim();
    if (room !== undefined) targetClass.room = room.trim();
    if (academicYear !== undefined) targetClass.academicYear = academicYear.trim();

    await targetClass.save();

    res.status(200).json({
      success: true,
      message: `Class ${targetClass.code} updated successfully.`,
      class: targetClass
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:idOrCode
// @route   DELETE /api/classes/staff/:staffId/:classCode
exports.deleteClass = async (req, res) => {
  try {
    const identifier = req.params.classCode || req.params.idOrCode || req.params.id;
    const staffId = req.params.staffId || null;

    const targetClass = await findClassByIdOrCode(identifier, staffId);
    if (!targetClass) {
      return res.status(404).json({ success: false, message: `Class "${identifier}" not found.` });
    }

    await Class.findByIdAndDelete(targetClass._id);

    // Also remove from Staff.classes if present
    if (targetClass.staffId) {
      const staff = await Staff.findOne({ staffId: targetClass.staffId });
      if (staff && staff.classes) {
        staff.classes = staff.classes.filter(c => c.code.toUpperCase() !== targetClass.code.toUpperCase());
        await staff.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Class ${targetClass.code} deleted successfully.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Enroll a student into a class
// @route   POST /api/classes/:idOrCode/students
// @route   POST /api/classes/staff/:staffId/:classCode/students
exports.enrollStudent = async (req, res) => {
  try {
    const identifier = req.params.classCode || req.params.idOrCode;
    const staffId = req.params.staffId || null;
    const { rollNo, name, phone, email } = req.body;

    if (!rollNo || !name) {
      return res.status(400).json({ success: false, message: 'rollNo and name are required.' });
    }

    const cleanRollNo = rollNo.trim().toUpperCase();
    const targetClass = await findClassByIdOrCode(identifier, staffId);

    if (!targetClass) {
      return res.status(404).json({ success: false, message: `Class "${identifier}" not found.` });
    }

    const exists = targetClass.students.some(s => s.rollNo.toUpperCase() === cleanRollNo);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: `Student with Roll No ${cleanRollNo} is already enrolled in this class.`
      });
    }

    const newStudent = {
      rollNo: cleanRollNo,
      name: name.trim(),
      phone: (phone || '').trim(),
      email: (email || '').trim(),
      present: true
    };

    targetClass.students.push(newStudent);
    await targetClass.save();

    // Sync to staff embedded classes if exists
    if (targetClass.staffId) {
      const staff = await Staff.findOne({ staffId: targetClass.staffId });
      if (staff && staff.classes) {
        const staffCls = staff.classes.find(c => c.code.toUpperCase() === targetClass.code);
        if (staffCls) {
          const sExists = staffCls.enrolledStudents.some(s => s.rollNo.toUpperCase() === cleanRollNo);
          if (!sExists) {
            staffCls.enrolledStudents.push(newStudent);
            staffCls.totalStudents = staffCls.enrolledStudents.length;
            await staff.save();
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `Student ${name} enrolled in ${targetClass.code}.`,
      student: newStudent,
      totalStudents: targetClass.students.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a student from a class
// @route   DELETE /api/classes/:idOrCode/students/:rollNo
// @route   DELETE /api/classes/staff/:staffId/:classCode/students/:rollNo
exports.removeStudent = async (req, res) => {
  try {
    const identifier = req.params.classCode || req.params.idOrCode;
    const staffId = req.params.staffId || null;
    const { rollNo } = req.params;

    const cleanRollNo = rollNo.trim().toUpperCase();
    const targetClass = await findClassByIdOrCode(identifier, staffId);

    if (!targetClass) {
      return res.status(404).json({ success: false, message: `Class "${identifier}" not found.` });
    }

    const initialLen = targetClass.students.length;
    targetClass.students = targetClass.students.filter(s => s.rollNo.toUpperCase() !== cleanRollNo);

    if (targetClass.students.length === initialLen) {
      return res.status(404).json({
        success: false,
        message: `Student with Roll No "${cleanRollNo}" not found in class ${targetClass.code}.`
      });
    }

    await targetClass.save();

    // Sync to staff embedded classes
    if (targetClass.staffId) {
      const staff = await Staff.findOne({ staffId: targetClass.staffId });
      if (staff && staff.classes) {
        const staffCls = staff.classes.find(c => c.code.toUpperCase() === targetClass.code);
        if (staffCls) {
          staffCls.enrolledStudents = staffCls.enrolledStudents.filter(
            s => s.rollNo.toUpperCase() !== cleanRollNo
          );
          staffCls.totalStudents = staffCls.enrolledStudents.length;
          await staff.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Student ${cleanRollNo} removed from ${targetClass.code}.`,
      totalStudents: targetClass.students.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
