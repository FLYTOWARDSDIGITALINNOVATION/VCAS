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

// @desc   Staff Login
// @route  POST /api/auth/staff/login
// Body: { email, password }
exports.staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find staff by email or staffId
    const query = email.toLowerCase().trim();
    const staff = await Staff.findOne({
      $or: [
        { email: query },
        { staffId: query.toUpperCase() }
      ]
    });

    if (!staff) {
      return res.status(401).json({ success: false, message: 'Invalid email/ID or password.' });
    }

    // Check password
    if (staff.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid email/ID or password.' });
    }

    // Check if profile is already considered complete (e.g. if qualification & phone exist)
    const isCompleted = Boolean(staff.isProfileCompleted || (staff.qualification && staff.phone && staff.address));

    // Return complete staff profile
    res.status(200).json({
      success: true,
      message: `Welcome back, ${staff.name}!`,
      staff: {
        _id:                staff._id,
        staffId:            staff.staffId,
        name:               staff.name,
        email:              staff.email,
        designation:        staff.designation,
        department:         staff.department,
        employmentType:     staff.employmentType,
        status:             staff.status,
        joiningDate:        staff.joiningDate,
        phone:              staff.phone || '',
        qualification:      staff.qualification || '',
        experience:         staff.experience || '',
        bloodGroup:         staff.bloodGroup || 'O+',
        dob:                staff.dob || '',
        address:            staff.address || '',
        emergencyContact:   staff.emergencyContact || '',
        avatarBg:           staff.avatarBg || 'bg-purple-600',
        avatarText:         staff.avatarText || getInitials(staff.name),
        classTeacherOf:     staff.classTeacherOf || '',
        isProfileCompleted: isCompleted,
        classes:            staff.classes || [],
        achievements:       staff.achievements || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   First-Time Profile Setup by Staff Member
// @route  POST /api/auth/staff/:staffId/complete-profile
exports.completeProfile = async (req, res) => {
  try {
    const { staffId } = req.params;
    const {
      phone,
      qualification,
      experience,
      bloodGroup,
      dob,
      address,
      emergencyContact,
      newPassword
    } = req.body;

    let staff = await Staff.findOne({ staffId });
    if (!staff && staffId.match(/^[0-9a-fA-F]{24}$/)) {
      staff = await Staff.findById(staffId);
    }

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    if (phone !== undefined)            staff.phone = phone.trim();
    if (qualification !== undefined)    staff.qualification = qualification.trim();
    if (experience !== undefined)       staff.experience = experience.trim();
    if (bloodGroup !== undefined)       staff.bloodGroup = bloodGroup;
    if (dob !== undefined)              staff.dob = dob;
    if (address !== undefined)          staff.address = address.trim();
    if (emergencyContact !== undefined) staff.emergencyContact = emergencyContact.trim();
    if (newPassword && newPassword.trim()) {
      staff.password = newPassword.trim();
    }

    staff.isProfileCompleted = true;
    await staff.save();

    res.status(200).json({
      success: true,
      message: 'Profile completed successfully!',
      staff: {
        _id:                staff._id,
        staffId:            staff.staffId,
        name:               staff.name,
        email:              staff.email,
        designation:        staff.designation,
        department:         staff.department,
        employmentType:     staff.employmentType,
        status:             staff.status,
        joiningDate:        staff.joiningDate,
        phone:              staff.phone,
        qualification:      staff.qualification,
        experience:         staff.experience,
        bloodGroup:         staff.bloodGroup,
        dob:                staff.dob,
        address:            staff.address,
        emergencyContact:   staff.emergencyContact,
        avatarBg:           staff.avatarBg,
        avatarText:         staff.avatarText,
        classTeacherOf:     staff.classTeacherOf,
        isProfileCompleted: true,
        classes:            staff.classes || [],
        achievements:       staff.achievements || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Register / Self-Register a staff member
// @route  POST /api/auth/staff/register
exports.staffRegister = async (req, res) => {
  try {
    const {
      staffId,
      name,
      email,
      password,
      designation,
      department,
      phone,
      qualification,
      experience,
      bloodGroup,
      dob,
      address,
      emergencyContact
    } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({
        success: false,
        message: 'Name, Email, Password, and Department are required.'
      });
    }

    let finalStaffId = (staffId || '').trim().toUpperCase();
    if (!finalStaffId) {
      let unique = false;
      while (!unique) {
        const candidate = `STF${Math.floor(1000 + Math.random() * 9000)}`;
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
          message: 'A staff member with this Staff ID already exists.'
        });
      }
    }

    const existingEmail = await Staff.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'A staff member with this email already exists.'
      });
    }

    const isCompleted = Boolean(qualification && phone && address);

    const newStaff = new Staff({
      staffId:            finalStaffId,
      name:               name.trim(),
      email:              email.toLowerCase().trim(),
      password:           password.trim(),
      designation:        designation || 'Assistant Professor',
      department:         department.trim(),
      phone:              phone ? phone.trim() : '',
      qualification:      qualification ? qualification.trim() : '',
      experience:         experience ? experience.trim() : '',
      bloodGroup:         bloodGroup || 'O+',
      dob:                dob || '',
      address:            address ? address.trim() : '',
      emergencyContact:   emergencyContact ? emergencyContact.trim() : '',
      avatarBg:           'bg-purple-600',
      avatarText:         getInitials(name),
      isProfileCompleted: isCompleted,
      classes:            []
    });

    await newStaff.save();

    res.status(201).json({
      success: true,
      message: `Staff member "${name}" registered successfully.`,
      staff: newStaff
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update staff profile
// @route  PATCH /api/auth/staff/:staffId/profile
exports.updateProfile = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { phone, address, emergencyContact, bio, qualification, experience, bloodGroup, dob } = req.body;

    const staff = await Staff.findOne({ staffId });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found.' });

    if (phone !== undefined)            staff.phone = phone.trim();
    if (address !== undefined)          staff.address = address.trim();
    if (emergencyContact !== undefined) staff.emergencyContact = emergencyContact.trim();
    if (bio !== undefined)              staff.bio = bio.trim();
    if (qualification !== undefined)    staff.qualification = qualification.trim();
    if (experience !== undefined)       staff.experience = experience.trim();
    if (bloodGroup !== undefined)       staff.bloodGroup = bloodGroup;
    if (dob !== undefined)              staff.dob = dob;

    staff.isProfileCompleted = true;
    await staff.save();
    res.status(200).json({ success: true, message: 'Profile updated successfully in database.', staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Add an achievement to a staff member's profile
// @route  POST /api/auth/staff/:staffId/achievements
exports.addAchievement = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { title, category, year, issuedBy, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Achievement title is required.' });
    }

    const staff = await Staff.findOne({ staffId });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found.' });

    staff.achievements.push({
      title:       title.trim(),
      category:    category || 'Award',
      year:        year || '',
      issuedBy:    issuedBy ? issuedBy.trim() : '',
      description: description ? description.trim() : ''
    });

    await staff.save();

    const added = staff.achievements[staff.achievements.length - 1];
    res.status(201).json({
      success: true,
      message: 'Achievement added successfully.',
      achievement: added
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete an achievement from a staff member's profile
// @route  DELETE /api/auth/staff/:staffId/achievements/:achievementId
exports.deleteAchievement = async (req, res) => {
  try {
    const { staffId, achievementId } = req.params;

    const staff = await Staff.findOne({ staffId });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found.' });

    const initialLength = staff.achievements.length;
    staff.achievements = staff.achievements.filter(
      (a) => a._id.toString() !== achievementId
    );

    if (staff.achievements.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Achievement not found.' });
    }

    await staff.save();
    res.status(200).json({ success: true, message: 'Achievement deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

