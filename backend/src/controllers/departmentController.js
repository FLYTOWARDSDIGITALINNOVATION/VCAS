const Department = require('../models/Department');

// @desc    Get all departments
// @route   GET /api/departments
exports.getAllDepartments = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { code: regex },
        { hod: regex }
      ];
    }

    const departments = await Department.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single department by ID or Code
// @route   GET /api/departments/:id
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    let dept = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      dept = await Department.findById(id);
    }
    if (!dept) {
      dept = await Department.findOne({ code: id.toUpperCase().trim() });
    }

    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    res.status(200).json({
      success: true,
      data: dept
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new department
// @route   POST /api/departments
exports.createDepartment = async (req, res) => {
  try {
    const {
      name,
      code,
      hod,
      hodEmail,
      hodPhone,
      totalYears,
      totalSemesters,
      facultyCount,
      studentCount,
      courseCount,
      establishedYear,
      description,
      labs,
      yearBreakdown,
      coursesList
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Department Name and Department Code are required.'
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Department.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Department with code "${cleanCode}" already exists.`
      });
    }

    const years = Number(totalYears) || 3;
    const sems = Number(totalSemesters) || (years * 2);

    const newDept = new Department({
      name: name.trim(),
      code: cleanCode,
      hod: (hod || '').trim(),
      hodEmail: (hodEmail || '').trim().toLowerCase(),
      hodPhone: (hodPhone || '').trim(),
      totalYears: years,
      totalSemesters: sems,
      facultyCount: Number(facultyCount) || 0,
      studentCount: Number(studentCount) || 0,
      courseCount: Array.isArray(coursesList) ? coursesList.length : (Number(courseCount) || 0),
      establishedYear: establishedYear || new Date().getFullYear().toString(),
      description: (description || '').trim(),
      labs: Array.isArray(labs) ? labs : [],
      yearBreakdown: Array.isArray(yearBreakdown) ? yearBreakdown : [],
      coursesList: Array.isArray(coursesList) ? coursesList : []
    });

    const saved = await newDept.save();

    res.status(201).json({
      success: true,
      message: `Department "${saved.name}" (${saved.code}) created successfully.`,
      data: saved
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    let dept = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      dept = await Department.findById(id);
    }
    if (!dept) {
      dept = await Department.findOne({ code: id.toUpperCase().trim() });
    }

    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    const updates = req.body;
    const allowedFields = [
      'name', 'code', 'hod', 'hodEmail', 'hodPhone', 'totalYears',
      'totalSemesters', 'facultyCount', 'studentCount', 'courseCount',
      'establishedYear', 'description', 'labs', 'yearBreakdown', 'coursesList'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'code') {
          dept[field] = updates[field].trim().toUpperCase();
        } else if (typeof updates[field] === 'string') {
          dept[field] = updates[field].trim();
        } else {
          dept[field] = updates[field];
        }
      }
    });

    if (Array.isArray(dept.coursesList)) {
      dept.courseCount = dept.coursesList.length;
    }

    const updated = await dept.save();

    res.status(200).json({
      success: true,
      message: `Department "${updated.name}" updated successfully.`,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      deleted = await Department.findByIdAndDelete(id);
    }
    if (!deleted) {
      deleted = await Department.findOneAndDelete({ code: id.toUpperCase().trim() });
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Department "${deleted.name}" (${deleted.code}) deleted successfully.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
