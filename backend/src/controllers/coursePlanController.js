const CoursePlan = require('../models/CoursePlan');

// GET /api/course-plans/:staffId
exports.getPlansByStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const plans = await CoursePlan.find({ staffId }).sort({ updatedAt: -1 });
    res.json({ success: true, count: plans.length, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/course-plans
exports.getAllPlans = async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    const plans = await CoursePlan.find(filter).sort({ department: 1, subjectName: 1 });
    res.json({ success: true, count: plans.length, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/course-plans/detail/:id
exports.getPlanById = async (req, res) => {
  try {
    const plan = await CoursePlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Course Plan not found' });
    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/course-plans
exports.createPlan = async (req, res) => {
  try {
    const {
      staffId,
      staffName,
      department,
      subjectName,
      subjectCode,
      academicYear,
      yearSemester,
      topics
    } = req.body;

    if (!staffId || !subjectName) {
      return res.status(400).json({ success: false, message: 'Staff ID and Subject Name are required' });
    }

    const newPlan = await CoursePlan.create({
      staffId,
      staffName: staffName || '',
      department: department || '',
      subjectName,
      subjectCode: subjectCode || '',
      academicYear: academicYear || '2026-2027',
      yearSemester: yearSemester || 'I / I',
      topics: Array.isArray(topics) ? topics : []
    });

    res.status(201).json({ success: true, data: newPlan, message: 'Course Plan created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/course-plans/:id
exports.updatePlan = async (req, res) => {
  try {
    const updated = await CoursePlan.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Course Plan not found' });
    res.json({ success: true, data: updated, message: 'Course Plan updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/course-plans/:id
exports.deletePlan = async (req, res) => {
  try {
    const deleted = await CoursePlan.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Course Plan not found' });
    res.json({ success: true, message: 'Course Plan deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
