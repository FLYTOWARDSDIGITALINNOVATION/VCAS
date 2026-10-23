const BonafideCertificate = require('../models/BonafideCertificate');
const Student = require('../models/Student');

// Helper to generate next Reference Number, e.g. VC202651
async function generateRefNo() {
  const currentYear = new Date().getFullYear();
  const prefix = `VC${currentYear}`;
  
  // Find highest refNo starting with prefix
  const lastCert = await BonafideCertificate.findOne({
    refNo: new RegExp(`^${prefix}`)
  }).sort({ createdAt: -1 });

  if (lastCert && lastCert.refNo) {
    const numPart = lastCert.refNo.replace(prefix, '');
    const nextNum = parseInt(numPart, 10) + 1;
    if (!isNaN(nextNum)) {
      return `${prefix}${nextNum}`;
    }
  }
  return `${prefix}51`; // Default starting sequence from the official paper
}

// @desc    Get all Bonafide Certificates
// @route   GET /api/bonafide
exports.getAllBonafides = async (req, res) => {
  try {
    const { search, department, academicYear } = req.query;
    const filter = {};

    if (department && department !== 'All' && department !== 'All Departments') {
      filter.department = department;
    }
    if (academicYear) {
      filter.academicYear = academicYear;
    }
    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { refNo: regex },
        { studentName: regex },
        { rollNo: regex },
        { regNo: regex },
        { parentName: regex },
        { course: regex },
        { purpose: regex }
      ];
    }

    const certificates = await BonafideCertificate.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: certificates.length,
      data: certificates
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single Bonafide Certificate
// @route   GET /api/bonafide/:id
exports.getBonafideById = async (req, res) => {
  try {
    const { id } = req.params;
    let cert = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      cert = await BonafideCertificate.findById(id);
    }
    if (!cert) {
      cert = await BonafideCertificate.findOne({ refNo: id.toUpperCase() });
    }
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    res.status(200).json({ success: true, data: cert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Issue a new Bonafide Certificate (by Accountant)
// @route   POST /api/bonafide
exports.issueBonafide = async (req, res) => {
  try {
    const {
      refNo,
      date,
      rollNo,
      regNo,
      studentName,
      gender,
      prefix,
      parentRelation,
      parentName,
      address,
      year,
      course,
      department,
      academicYear,
      conduct,
      purpose,
      issuedBy
    } = req.body;

    if (!studentName || !parentName || !address || !course) {
      return res.status(400).json({
        success: false,
        message: 'Student Name, Parent Name, Address, and Course are required.'
      });
    }

    const finalRefNo = (refNo && refNo.trim()) ? refNo.trim().toUpperCase() : await generateRefNo();

    // Check duplicate refNo
    const existing = await BonafideCertificate.findOne({ refNo: finalRefNo });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Reference Number ${finalRefNo} already exists. Please provide a unique number.`
      });
    }

    const isFemale = (gender || '').toLowerCase() === 'female' || (prefix || '').includes('Ms');
    const autoConduct = conduct || (isFemale ? 'Her conduct and character are good.' : 'His conduct and character are good.');

    const cert = await BonafideCertificate.create({
      refNo: finalRefNo,
      date: date || undefined,
      rollNo: (rollNo || '').toUpperCase().trim(),
      regNo: (regNo || '').toUpperCase().trim(),
      studentName: studentName.trim(),
      gender: gender || (isFemale ? 'Female' : 'Male'),
      prefix: prefix || (isFemale ? 'Ms.' : 'Mr.'),
      parentRelation: parentRelation || (isFemale ? 'D/o' : 'S/o'),
      parentName: parentName.trim(),
      address: address.trim(),
      year: year || 'I Year',
      course: course.trim(),
      department: department || 'General',
      academicYear: academicYear || '2026–2027',
      conduct: autoConduct,
      purpose: (purpose || 'applying scholarship under Beedi Workers scheme').trim(),
      issuedBy: issuedBy || 'Accountant',
      status: 'Issued'
    });

    res.status(201).json({
      success: true,
      message: `Bonafide Certificate ${cert.refNo} issued successfully!`,
      data: cert
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a Bonafide Certificate
// @route   PUT /api/bonafide/:id
exports.updateBonafide = async (req, res) => {
  try {
    const cert = await BonafideCertificate.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    res.status(200).json({ success: true, message: 'Certificate updated', data: cert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete or Cancel Bonafide Certificate
// @route   DELETE /api/bonafide/:id
exports.deleteBonafide = async (req, res) => {
  try {
    const cert = await BonafideCertificate.findByIdAndDelete(req.params.id);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    res.status(200).json({ success: true, message: 'Certificate removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
