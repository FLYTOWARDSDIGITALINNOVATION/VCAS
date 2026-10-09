const { Exam, ExamHall } = require('../models/Exam');
const InternalMarks = require('../models/InternalMarks');
const HallTicket = require('../models/HallTicket');

// @desc    Get all exam schedules
// @route   GET /api/exams
exports.getAllExams = async (req, res) => {
  try {
    const { department, session, type, search } = req.query;
    const filter = {};

    if (department && department !== 'All Departments') {
      filter.department = department;
    }
    if (session && session !== 'All Sessions') {
      filter.session = { $regex: session, $options: 'i' };
    }
    if (type && type !== 'ALL') {
      filter.type = type;
    }
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { hall: { $regex: search, $options: 'i' } },
        { qpCode: { $regex: search, $options: 'i' } },
        { invigilator: { $regex: search, $options: 'i' } }
      ];
    }

    const exams = await Exam.find(filter).sort({ date: 1, session: 1 });
    return res.status(200).json({
      success: true,
      count: exams.length,
      exams
    });
  } catch (err) {
    console.error('getAllExams error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve exams',
      error: err.message
    });
  }
};

// @desc    Create exam schedule
// @route   POST /api/exams
exports.createExam = async (req, res) => {
  try {
    const newExam = await Exam.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Exam schedule published successfully',
      exam: newExam
    });
  } catch (err) {
    console.error('createExam error:', err);
    return res.status(400).json({
      success: false,
      message: 'Failed to create exam schedule',
      error: err.message
    });
  }
};

// @desc    Update exam schedule
// @route   PUT /api/exams/:id
exports.updateExam = async (req, res) => {
  try {
    const updated = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Exam schedule updated successfully',
      exam: updated
    });
  } catch (err) {
    console.error('updateExam error:', err);
    return res.status(400).json({
      success: false,
      message: 'Failed to update exam schedule',
      error: err.message
    });
  }
};

// @desc    Delete exam schedule
// @route   DELETE /api/exams/:id
exports.deleteExam = async (req, res) => {
  try {
    const deleted = await Exam.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Exam schedule removed successfully'
    });
  } catch (err) {
    console.error('deleteExam error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete exam schedule',
      error: err.message
    });
  }
};

// @desc    Get all exam halls (synced from real staff seating allocations & registered halls)
// @route   GET /api/exams/halls
exports.getHalls = async (req, res) => {
  try {
    // Automatically sync real halls configured by staff in HallTicket allocations
    try {
      const tickets = await HallTicket.find();
      for (const t of tickets) {
        if (Array.isArray(t.halls)) {
          for (const h of t.halls) {
            const hallName = `Hall ${h.hallNo}`;
            const studentsInHall = (t.students || []).filter(s => (s.hallNo || '').trim().toUpperCase() === (h.hallNo || '').trim().toUpperCase());
            const rolls = studentsInHall.map(s => s.rollNo).filter(Boolean).sort();
            const rollRange = rolls.length > 1 ? `${rolls[0]} - ${rolls[rolls.length - 1]}` : rolls.length === 1 ? rolls[0] : 'No candidates assigned';

            const existing = await ExamHall.findOne({ hallName });
            if (!existing) {
              await ExamHall.create({
                hallName,
                capacity: Number(h.capacity) || 30,
                allocatedStudents: studentsInHall.length,
                departments: `${t.department || 'Computer Science'} (Sem ${t.semester || 1})`,
                rollRange,
                invigilator: t.allocatedByStaffName || 'Staff In-Charge',
                invigilatorDept: t.department || 'Computer Science',
                status: studentsInHall.length >= (h.capacity || 30) ? 'Fully Allocated' : 'Allocated'
              });
            } else {
              existing.allocatedStudents = studentsInHall.length;
              existing.rollRange = rollRange;
              if (t.allocatedByStaffName) existing.invigilator = t.allocatedByStaffName;
              if (t.department) existing.invigilatorDept = t.department;
              await existing.save();
            }
          }
        }
      }
    } catch (syncErr) {
      console.warn('Error syncing halls from HallTicket:', syncErr.message);
    }

    const halls = await ExamHall.find().sort({ hallName: 1 });
    return res.status(200).json({
      success: true,
      count: halls.length,
      halls
    });
  } catch (err) {
    console.error('getHalls error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve examination halls',
      error: err.message
    });
  }
};

// @desc    Create / Add exam hall
// @route   POST /api/exams/halls
exports.createHall = async (req, res) => {
  try {
    const newHall = await ExamHall.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Examination hall registered successfully',
      hall: newHall
    });
  } catch (err) {
    console.error('createHall error:', err);
    return res.status(400).json({
      success: false,
      message: 'Failed to register examination hall',
      error: err.message
    });
  }
};

// @desc    Update exam hall
// @route   PUT /api/exams/halls/:id
exports.updateHall = async (req, res) => {
  try {
    const updated = await ExamHall.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Exam hall not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Exam hall updated successfully',
      hall: updated
    });
  } catch (err) {
    console.error('updateHall error:', err);
    return res.status(400).json({
      success: false,
      message: 'Failed to update exam hall',
      error: err.message
    });
  }
};

// @desc    Delete exam hall
// @route   DELETE /api/exams/halls/:id
exports.deleteHall = async (req, res) => {
  try {
    const deleted = await ExamHall.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Exam hall not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Exam hall removed successfully'
    });
  } catch (err) {
    console.error('deleteHall error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete exam hall',
      error: err.message
    });
  }
};
