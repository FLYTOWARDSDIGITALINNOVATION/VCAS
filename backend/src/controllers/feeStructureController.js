const FeeStructure = require('../models/FeeStructure');

const DEFAULT_CLUSTERS = [
  {
    cluster: 'Commerce & Management',
    departments: ['B.Com', 'BBA'],
    deptNames: ['Bachelor of Commerce (B.Com)', 'Bachelor of Business Administration (BBA)'],
    registrationFee: 7000,
    sem1Fee: 10000,
    sem2Fee: 10000,
    totalAnnualFee: 27000,
    color: 'from-blue-600 to-indigo-600',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50/50',
    badge: '₹27,000 / Year'
  },
  {
    cluster: 'Computer Science, AI & CFS',
    departments: ['CS', 'AI', 'CFS'],
    deptNames: [
      'B.Sc Computer Science (CS)',
      'B.Sc Artificial Intelligence (AI)',
      'B.Sc Criminology & Forensic Science (CFS)'
    ],
    registrationFee: 8000,
    sem1Fee: 10000,
    sem2Fee: 10000,
    totalAnnualFee: 28000,
    color: 'from-purple-600 to-indigo-600',
    borderColor: 'border-purple-200',
    bgColor: 'bg-purple-50/50',
    badge: '₹28,000 / Year'
  }
];

const DEFAULT_SCHOLARSHIPS = [
  {
    id: 'marks_550',
    criteria: 'Marks > 550',
    detail: 'Outstanding Merit (Score > 550 / 600)',
    discountPercent: 100,
    sem1: 0,
    sem2: 0,
    sem1Display: '₹0 (Free)',
    sem2Display: '₹0 (Free)',
    savings: 20000,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    id: 'marks_500',
    criteria: 'Marks > 500',
    detail: 'High Merit (Score > 500 / 600)',
    discountPercent: 75,
    sem1: 2500,
    sem2: 2500,
    sem1Display: '₹2,500',
    sem2Display: '₹2,500',
    savings: 15000,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    id: 'marks_450',
    criteria: 'Marks > 450',
    detail: 'First Class Merit (Score > 450 / 600)',
    discountPercent: 50,
    sem1: 5000,
    sem2: 5000,
    sem1Display: '₹5,000',
    sem2Display: '₹5,000',
    savings: 10000,
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  },
  {
    id: 'marks_400',
    criteria: 'Marks > 400',
    detail: 'Standard Merit (Score > 400 / 600)',
    discountPercent: 25,
    sem1: 7500,
    sem2: 7500,
    sem1Display: '₹7,500',
    sem2Display: '₹7,500',
    savings: 5000,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  {
    id: 'single_parent',
    criteria: 'Single Parent',
    detail: 'Welfare Concession for single-parent students',
    discountPercent: 25,
    sem1: 7500,
    sem2: 7500,
    sem1Display: '₹7,500',
    sem2Display: '₹7,500',
    savings: 5000,
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-300'
  },
  {
    id: 'disabled',
    criteria: 'Disabled',
    detail: 'Differently Abled Students Welfare Concession',
    discountPercent: 25,
    sem1: 7500,
    sem2: 7500,
    sem1Display: '₹7,500',
    sem2Display: '₹7,500',
    savings: 5000,
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300'
  },
  {
    id: 'special_scholar',
    criteria: 'Special Scholar',
    detail: 'Sports, Trust, or Special Management Quota',
    discountPercent: null,
    sem1: null,
    sem2: null,
    sem1Display: 'Discretionary (?)',
    sem2Display: 'Discretionary (?)',
    savings: 'Variable',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300'
  }
];

const DEFAULT_MISC_FEES = [
  { feeType: 'Lab Fees', amount: 2500 },
  { feeType: 'Library Fees', amount: 1000 },
  { feeType: 'Sports & Culturals Fees', amount: 1500 },
  { feeType: 'Special Amenities Fees', amount: 1200 },
  { feeType: 'ID Card / Badge Fees', amount: 300 },
  { feeType: 'Registration / Admission Fees', amount: 2000 },
  { feeType: 'Certificate / Verification Fees', amount: 500 },
  { feeType: 'Seminar & Workshop Fees', amount: 800 },
  { feeType: 'Hostel Maintenance Fees', amount: 5000 },
  { feeType: 'Other / Custom Fees', amount: 1000 }
];

// @desc    Get current Fee Structure
// @route   GET /api/fee-structure
exports.getFeeStructure = async (req, res) => {
  try {
    let feeDoc = await FeeStructure.findOne().sort({ updatedAt: -1 });
    if (!feeDoc) {
      feeDoc = await FeeStructure.create({
        academicYear: '2025–2026',
        clusters: DEFAULT_CLUSTERS,
        scholarships: DEFAULT_SCHOLARSHIPS,
        miscellaneousFees: DEFAULT_MISC_FEES,
        lastUpdatedBy: 'System Default',
        lastUpdatedRole: 'Super Admin',
        lastUpdatedAt: new Date()
      });
    }

    let modified = false;
    if (feeDoc && Array.isArray(feeDoc.clusters)) {
      const hasTech = feeDoc.clusters.some(c =>
        (c.cluster || '').toLowerCase().includes('cs') ||
        (c.cluster || '').toLowerCase().includes('computer') ||
        (c.departments || []).some(d => ['cs', 'ai', 'cfs'].includes(d.toLowerCase()))
      );
      if (!hasTech) {
        feeDoc.clusters = DEFAULT_CLUSTERS;
        modified = true;
      }
    }

    if (!feeDoc.miscellaneousFees || feeDoc.miscellaneousFees.length === 0) {
      feeDoc.miscellaneousFees = DEFAULT_MISC_FEES;
      modified = true;
    }

    if (modified) {
      await feeDoc.save();
    }

    return res.status(200).json({
      success: true,
      data: feeDoc
    });
  } catch (err) {
    console.error('getFeeStructure error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve fee structure',
      error: err.message
    });
  }
};

// @desc    Update Fee Structure (Synchronized across Superadmin, Accountant & Office Staff)
// @route   PUT /api/fee-structure
exports.updateFeeStructure = async (req, res) => {
  try {
    const { clusters, scholarships, miscellaneousFees, academicYear, updatedBy, updatedRole } = req.body;

    // Shared fee structure should be visible and editable across admin + finance roles.
    let feeDoc = await FeeStructure.findOne().sort({ updatedAt: -1 });

    const updateData = {
      lastUpdatedBy: updatedBy || 'Authorized Administrator',
      lastUpdatedRole: updatedRole || 'Admin',
      lastUpdatedAt: new Date()
    };

    if (academicYear) updateData.academicYear = academicYear;
    if (Array.isArray(clusters)) {
      // Recompute badges and totals for safety
      updateData.clusters = clusters.map(c => {
        const reg = Number(c.registrationFee) || 0;
        const s1 = Number(c.sem1Fee) || 0;
        const s2 = Number(c.sem2Fee) || 0;
        const total = reg + s1 + s2;
        return {
          ...c,
          registrationFee: reg,
          sem1Fee: s1,
          sem2Fee: s2,
          totalAnnualFee: total,
          badge: `₹${total.toLocaleString('en-IN')} / Year`
        };
      });
    }
    if (Array.isArray(scholarships)) {
      updateData.scholarships = scholarships;
    }
    if (Array.isArray(miscellaneousFees)) {
      updateData.miscellaneousFees = miscellaneousFees
        .map(m => ({
          feeType: String(m.feeType || '').trim(),
          amount: Math.max(0, Number(m.amount) || 0)
        }))
        .filter(m => m.feeType.length > 0);
    }

    if (!feeDoc) {
      feeDoc = new FeeStructure({
        academicYear: academicYear || '2025–2026',
        clusters: updateData.clusters || DEFAULT_CLUSTERS,
        scholarships: updateData.scholarships || DEFAULT_SCHOLARSHIPS,
        miscellaneousFees: updateData.miscellaneousFees || DEFAULT_MISC_FEES,
        ...updateData
      });
      await feeDoc.save();
    } else {
      Object.assign(feeDoc, updateData);
      await feeDoc.save();
    }

    return res.status(200).json({
      success: true,
      message: `Fee structure successfully updated by ${feeDoc.lastUpdatedRole} (${feeDoc.lastUpdatedBy})!`,
      data: feeDoc
    });
  } catch (err) {
    console.error('updateFeeStructure error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update fee structure',
      error: err.message
    });
  }
};

// @desc    Get Miscellaneous Fees List
// @route   GET /api/fee-structure/miscellaneous-fees
exports.getMiscellaneousFees = async (req, res) => {
  try {
    let feeDoc = await FeeStructure.findOne().sort({ updatedAt: -1 });
    if (!feeDoc) {
      feeDoc = await FeeStructure.create({
        academicYear: '2025–2026',
        clusters: DEFAULT_CLUSTERS,
        scholarships: DEFAULT_SCHOLARSHIPS,
        miscellaneousFees: DEFAULT_MISC_FEES,
        lastUpdatedBy: 'System Default',
        lastUpdatedRole: 'Super Admin',
        lastUpdatedAt: new Date()
      });
    } else if (!feeDoc.miscellaneousFees || feeDoc.miscellaneousFees.length === 0) {
      feeDoc.miscellaneousFees = DEFAULT_MISC_FEES;
      await feeDoc.save();
    }

    return res.status(200).json({
      success: true,
      data: feeDoc.miscellaneousFees
    });
  } catch (err) {
    console.error('getMiscellaneousFees error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve miscellaneous fees',
      error: err.message
    });
  }
};

// @desc    Update Miscellaneous Fees Structure (Super Admin exclusive)
// @route   PUT /api/fee-structure/miscellaneous-fees
exports.updateMiscellaneousFees = async (req, res) => {
  try {
    const { miscellaneousFees, updatedBy, updatedRole } = req.body;
    let feeDoc = await FeeStructure.findOne().sort({ updatedAt: -1 });
    if (!feeDoc) {
      feeDoc = new FeeStructure({
        academicYear: '2025–2026',
        clusters: DEFAULT_CLUSTERS,
        scholarships: DEFAULT_SCHOLARSHIPS,
        miscellaneousFees: DEFAULT_MISC_FEES
      });
    }

    if (Array.isArray(miscellaneousFees)) {
      feeDoc.miscellaneousFees = miscellaneousFees
        .map(m => ({
          feeType: String(m.feeType || '').trim(),
          amount: Math.max(0, Number(m.amount) || 0)
        }))
        .filter(m => m.feeType.length > 0);
    }
    feeDoc.lastUpdatedBy = updatedBy || 'Super Admin';
    feeDoc.lastUpdatedRole = updatedRole || 'Super Admin';
    feeDoc.lastUpdatedAt = new Date();
    await feeDoc.save();

    return res.status(200).json({
      success: true,
      message: 'Miscellaneous fees structure saved successfully',
      data: feeDoc.miscellaneousFees
    });
  } catch (err) {
    console.error('updateMiscellaneousFees error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update miscellaneous fees',
      error: err.message
    });
  }
};

// @desc    Reset Fee Structure to official defaults
// @route   POST /api/fee-structure/reset
exports.resetFeeStructure = async (req, res) => {
  try {
    const { resetBy, resetRole } = req.body;
    let feeDoc = await FeeStructure.findOne().sort({ updatedAt: -1 });

    const defaultData = {
      academicYear: '2025–2026',
      clusters: DEFAULT_CLUSTERS,
      scholarships: DEFAULT_SCHOLARSHIPS,
      miscellaneousFees: DEFAULT_MISC_FEES,
      lastUpdatedBy: resetBy || 'Super Admin',
      lastUpdatedRole: resetRole || 'Super Admin',
      lastUpdatedAt: new Date()
    };

    if (!feeDoc) {
      feeDoc = await FeeStructure.create(defaultData);
    } else {
      Object.assign(feeDoc, defaultData);
      await feeDoc.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Fee structure reset to official standard default.',
      data: feeDoc
    });
  } catch (err) {
    console.error('resetFeeStructure error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset fee structure',
      error: err.message
    });
  }
};
