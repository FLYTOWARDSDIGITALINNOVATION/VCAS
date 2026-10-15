const TransferCertificate = require('../models/TransferCertificate');
const Student = require('../models/Student');

// Helper to generate the next unique TC number
const generateNextTCNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `TC/VCAS/${currentYear}/`;
  
  // Find all TCs for the current year prefix
  const regex = new RegExp(`^TC/VCAS/${currentYear}/(\\d+)`, 'i');
  const tcs = await TransferCertificate.find({ tcNumber: regex }).select('tcNumber').lean();
  
  let maxSeq = 0;
  tcs.forEach(doc => {
    const match = doc.tcNumber.match(/(\d+)$/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  let nextSeq = maxSeq + 1;
  let candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  
  // Guard against any collision
  while (await TransferCertificate.findOne({ tcNumber: candidate })) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }
  
  return candidate;
};

// @desc    Get all TCs (with optional search and status filter)
// @route   GET /api/tc
exports.getAllTCs = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { tcNumber: regex },
        { regNo: regex },
        { studentName: regex },
        { courseAdmitted: regex },
        { fatherName: regex }
      ];
    }

    const records = await TransferCertificate.find(filter)
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error('Error fetching TCs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate next suggested TC number
// @route   GET /api/tc/next-number
exports.getNextTCNumber = async (req, res) => {
  try {
    const nextNumber = await generateNextTCNumber();
    res.status(200).json({
      success: true,
      tcNumber: nextNumber
    });
  } catch (error) {
    console.error('Error generating TC number:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student details pre-mapped for TC creation
// @route   GET /api/tc/student/:regNo
exports.getStudentForTC = async (req, res) => {
  try {
    const { regNo } = req.params;
    if (!regNo || !regNo.trim()) {
      return res.status(400).json({ success: false, message: 'Register Number is required' });
    }

    const cleanId = regNo.trim().toUpperCase();
    
    // Look up student in students collection
    const student = await Student.findOne({
      $or: [
        { regNo: cleanId },
        { studentId: cleanId },
        { rollNo: cleanId },
        { admNo: cleanId }
      ]
    }).lean();

    // Check if an existing TC exists for this student
    const existingTC = await TransferCertificate.findOne({
      regNo: cleanId
    }).lean();

    if (!student) {
      return res.status(200).json({
        success: true,
        foundStudent: false,
        existingTC: existingTC || null,
        message: 'No student found with this Register Number'
      });
    }

    // Map student fields to TC form fields
    const mappedData = {
      regNo: student.regNo || student.studentId || student.rollNo || cleanId,
      studentName: student.name || student.fullName || '',
      gender: student.gender || 'Male',
      dob: student.dob || '',
      fatherName: student.fatherName || '',
      nationality: student.nationality || 'Indian',
      religion: student.religion || 'Hindu',
      casteCommunity: student.casteCommunity || [student.caste, student.community].filter(Boolean).join(' - ') || '',
      dateOfAdmission: student.dateOfAdmission || '',
      courseAdmitted: student.courseAdmitted || student.course || student.department || '',
      classAtLeaving: student.year ? `${student.year} (${student.sem || ''})` : (student.sem || ''),
      idMark1: student.idMark1 || '',
      idMark2: student.idMark2 || '',
      studentId: student._id
    };

    res.status(200).json({
      success: true,
      foundStudent: true,
      data: mappedData,
      existingTC: existingTC || null
    });
  } catch (error) {
    console.error('Error fetching student for TC:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single TC by ID or TC Number
// @route   GET /api/tc/:id
exports.getTCById = async (req, res) => {
  try {
    const { id } = req.params;
    let tc = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      tc = await TransferCertificate.findById(id);
    }
    if (!tc) {
      tc = await TransferCertificate.findOne({ tcNumber: id.toUpperCase() });
    }

    if (!tc) {
      return res.status(404).json({ success: false, message: 'Transfer Certificate record not found.' });
    }

    res.status(200).json({
      success: true,
      data: tc
    });
  } catch (error) {
    console.error('Error retrieving TC:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new Transfer Certificate
// @route   POST /api/tc
exports.createTC = async (req, res) => {
  try {
    const data = req.body;

    let tcNumber = (data.tcNumber || '').trim().toUpperCase();
    if (!tcNumber) {
      tcNumber = await generateNextTCNumber();
    }

    // Verify uniqueness of tcNumber
    const existingTC = await TransferCertificate.findOne({ tcNumber });
    if (existingTC) {
      return res.status(400).json({
        success: false,
        message: `TC Number "${tcNumber}" is already in use. Please use a unique TC Number.`
      });
    }

    // Validation for Issued certificates
    const isIssued = data.status === 'Issued';
    if (isIssued) {
      if (!data.regNo || !data.regNo.trim()) {
        return res.status(400).json({ success: false, message: 'Register Number is required to save TC.' });
      }
      if (!data.studentName || !data.studentName.trim()) {
        return res.status(400).json({ success: false, message: 'Student Name is required to save TC.' });
      }
    }

    // Auto-link studentId if not provided
    let studentId = data.studentId;
    if (!studentId && data.regNo) {
      const regUpper = data.regNo.trim().toUpperCase();
      const st = await Student.findOne({
        $or: [{ regNo: regUpper }, { studentId: regUpper }, { rollNo: regUpper }]
      }).select('_id');
      if (st) studentId = st._id;
    }

    const newTC = new TransferCertificate({
      ...data,
      tcNumber,
      regNo: (data.regNo || '').trim().toUpperCase(),
      studentName: (data.studentName || '').trim(),
      status: data.status || 'Draft',
      studentId: studentId || null
    });

    const saved = await newTC.save();

    res.status(201).json({
      success: true,
      message: isIssued ? 'Transfer Certificate issued and saved successfully!' : 'Transfer Certificate saved as draft successfully!',
      data: saved
    });
  } catch (error) {
    console.error('Error creating TC:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate TC Number error: This TC Number already exists in the system.'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update existing Transfer Certificate
// @route   PUT /api/tc/:id
exports.updateTC = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const tc = await TransferCertificate.findById(id);
    if (!tc) {
      return res.status(404).json({ success: false, message: 'Transfer Certificate record not found.' });
    }

    // If changing tcNumber, ensure uniqueness
    if (data.tcNumber && data.tcNumber.trim().toUpperCase() !== tc.tcNumber) {
      const newTcNum = data.tcNumber.trim().toUpperCase();
      const duplicate = await TransferCertificate.findOne({ tcNumber: newTcNum, _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `TC Number "${newTcNum}" is already in use by another certificate.`
        });
      }
      tc.tcNumber = newTcNum;
    }

    // Validation for Issued certificates
    const isIssued = data.status === 'Issued';
    if (isIssued) {
      const reg = data.regNo || tc.regNo;
      const name = data.studentName || tc.studentName;
      if (!reg || !reg.trim()) {
        return res.status(400).json({ success: false, message: 'Register Number is required to save TC.' });
      }
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Student Name is required to save TC.' });
      }
    }

    // Update fields
    const allowedFields = [
      'regNo', 'studentName', 'photo', 'gender', 'dob', 'dobWords',
      'fatherName', 'nationality', 'religion', 'casteCommunity',
      'dateOfAdmission', 'courseAdmitted', 'subjectStudiedPart1',
      'subjectStudiedPart2', 'subjectStudiedPart3', 'mediumOfInstruction',
      'classAtLeaving', 'qualifiedForPromotion', 'idMark1', 'idMark2',
      'tcDate', 'conduct', 'collegeSeal', 'principalSignature',
      'studentSignature', 'parentSignature', 'declarationText',
      'status', 'remarks'
    ];

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        tc[field] = data[field];
      }
    });

    if (data.regNo) {
      tc.regNo = data.regNo.trim().toUpperCase();
    }

    const updated = await tc.save();

    res.status(200).json({
      success: true,
      message: isIssued ? 'Transfer Certificate updated and officially saved!' : 'Draft updated successfully!',
      data: updated
    });
  } catch (error) {
    console.error('Error updating TC:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate TC Number error: This TC Number already exists in the system.'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Transfer Certificate
// @route   DELETE /api/tc/:id
exports.deleteTC = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TransferCertificate.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Transfer Certificate not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Transfer Certificate ${deleted.tcNumber} deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting TC:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
