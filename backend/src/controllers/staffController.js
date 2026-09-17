const Staff = require('../models/Staff');

// Helper to compute initials
function getInitials(name) {
  if (!name) return 'ST';
  const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase();
}

// @desc   Get all staff members
// @route  GET /api/staff
exports.getAllStaff = async (req, res) => {
  try {
    const staffMembers = await Staff.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: staffMembers.length,
      data: staffMembers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single staff by ID (mongo _id or staffId)
// @route  GET /api/staff/:id
exports.getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    let staff = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      staff = await Staff.findById(id).select('-password');
    }
    if (!staff) {
      staff = await Staff.findOne({ staffId: id }).select('-password');
    }

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Create new staff member
// @route  POST /api/staff
exports.createStaff = async (req, res) => {
  try {
    const {
      empId,
      staffId,
      name,
      email,
      phone,
      department,
      designation,
      employmentType,
      status,
      joiningDate,
      qualification,
      experience,
      bloodGroup,
      dob,
      address,
      emergencyContact,
      avatarBg,
      password,
      classTeacherOf
    } = req.body;

    let finalStaffId = (empId || staffId || '').trim().toUpperCase();

    if (!name || !email || !department) {
      return res.status(400).json({
        success: false,
        message: 'Name, Email, and Department are required.'
      });
    }

    if (!finalStaffId) {
      let unique = false;
      while (!unique) {
        const candidate = `EMP${Math.floor(1000 + Math.random() * 9000)}`;
        const exists = await Staff.findOne({ staffId: candidate });
        if (!exists) {
          finalStaffId = candidate;
          unique = true;
        }
      }
    } else {
      const existingId = await Staff.findOne({ staffId: finalStaffId });
      if (existingId) {
        return res.status(400).json({
          success: false,
          message: `Staff member with ID "${finalStaffId}" already exists.`
        });
      }
    }

    const existingEmail = await Staff.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: `Staff member with email "${email}" already exists.`
      });
    }

    const newStaff = new Staff({
      staffId: finalStaffId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password || 'vcas@2026',
      phone: phone ? phone.trim() : '',
      department: department.trim(),
      designation: designation || 'Assistant Professor',
      employmentType: employmentType || 'Permanent / Full-Time',
      status: status || 'Active',
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      qualification: qualification || '',
      experience: experience || '',
      bloodGroup: bloodGroup || 'O+',
      dob: dob || '',
      address: address || '',
      emergencyContact: emergencyContact || '',
      avatarBg: avatarBg || 'bg-purple-600',
      avatarText: getInitials(name),
      classTeacherOf: classTeacherOf || '',
      classes: []
    });

    const savedStaff = await newStaff.save();
    const staffData = savedStaff.toObject();
    delete staffData.password;

    res.status(201).json({
      success: true,
      message: `Staff member "${savedStaff.name}" created successfully.`,
      data: staffData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update staff member
// @route  PUT /api/staff/:id
exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    let staff = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      staff = await Staff.findById(id);
    }
    if (!staff) {
      staff = await Staff.findOne({ staffId: id });
    }

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    const allowedUpdates = [
      'name', 'phone', 'department', 'designation', 'employmentType', 
      'status', 'joiningDate', 'qualification', 'experience', 'bloodGroup', 
      'dob', 'address', 'emergencyContact', 'avatarBg', 'classTeacherOf', 'password'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        staff[field] = req.body[field];
      }
    });

    if (req.body.name) {
      staff.avatarText = getInitials(req.body.name);
    }

    const updated = await staff.save();
    const staffData = updated.toObject();
    delete staffData.password;

    res.status(200).json({
      success: true,
      message: `Staff member "${updated.name}" updated successfully.`,
      data: staffData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete staff member
// @route  DELETE /api/staff/:id
exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      deleted = await Staff.findByIdAndDelete(id);
    }
    if (!deleted) {
      deleted = await Staff.findOneAndDelete({ staffId: id });
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Staff member "${deleted.name}" deleted successfully.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
