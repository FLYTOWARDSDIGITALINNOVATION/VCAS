const { Exam, ExamHall } = require('../models/Exam');
const InternalMarks = require('../models/InternalMarks');
const HallTicket = require('../models/HallTicket');

// @desc    Get all exam schedules
// @route   GET /api/exams
exports.getAllExams = async (req, res) => {
  try {
    const { department, session, type, search, sem } = req.query;
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
    if (sem && sem !== 'ALL') {
      filter.sem = { $regex: sem.replace(/\s+/g, ''), $options: 'i' };
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
exports.createExam = async (req, res) => {
  try {
    const { date, session, hall, invigilator } = req.body;
    let conflictWarning = null;

    if (date && session) {
      if (invigilator && invigilator !== 'Assigned Faculty') {
        const invClash = await Exam.findOne({
          date: date.trim(),
          session: { $regex: (session || '').includes('AN') ? 'AN' : 'FN', $options: 'i' },
          invigilator: { $regex: `^${invigilator.trim()}$`, $options: 'i' }
        });
        if (invClash) {
          conflictWarning = `⚠️ Warning: Invigilator "${invigilator}" is already allocated to ${invClash.code} in ${invClash.hall} on ${date} (${session}).`;
        }
      }
      if (hall) {
        const hallClash = await Exam.findOne({
          date: date.trim(),
          session: { $regex: (session || '').includes('AN') ? 'AN' : 'FN', $options: 'i' },
          hall: { $regex: `^${hall.trim()}$`, $options: 'i' }
        });
        if (hallClash) {
          const hallWarn = `⚠️ Warning: Hall "${hall}" is already allocated to ${hallClash.code} on ${date} (${session}).`;
          conflictWarning = conflictWarning ? `${conflictWarning} ${hallWarn}` : hallWarn;
        }
      }
    }

    const newExam = await Exam.create(req.body);
    return res.status(201).json({
      success: true,
      message: conflictWarning ? `Exam scheduled with warning: ${conflictWarning}` : 'Exam schedule published successfully',
      warning: conflictWarning,
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
exports.updateExam = async (req, res) => {
  try {
    const { date, session, hall, invigilator } = req.body;
    let conflictWarning = null;

    if (date && session) {
      if (invigilator && invigilator !== 'Assigned Faculty') {
        const invClash = await Exam.findOne({
          _id: { $ne: req.params.id },
          date: date.trim(),
          session: { $regex: (session || '').includes('AN') ? 'AN' : 'FN', $options: 'i' },
          invigilator: { $regex: `^${invigilator.trim()}$`, $options: 'i' }
        });
        if (invClash) {
          conflictWarning = `⚠️ Warning: Invigilator "${invigilator}" is already allocated to ${invClash.code} in ${invClash.hall} on ${date} (${session}).`;
        }
      }
      if (hall) {
        const hallClash = await Exam.findOne({
          _id: { $ne: req.params.id },
          date: date.trim(),
          session: { $regex: (session || '').includes('AN') ? 'AN' : 'FN', $options: 'i' },
          hall: { $regex: `^${hall.trim()}$`, $options: 'i' }
        });
        if (hallClash) {
          const hallWarn = `⚠️ Warning: Hall "${hall}" is already allocated to ${hallClash.code} on ${date} (${session}).`;
          conflictWarning = conflictWarning ? `${conflictWarning} ${hallWarn}` : hallWarn;
        }
      }
    }

    const updated = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found' });
    }
    return res.status(200).json({
      success: true,
      message: conflictWarning ? `Exam schedule updated with warning: ${conflictWarning}` : 'Exam schedule updated successfully',
      warning: conflictWarning,
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
            const rawNo = (h.hallNo || '').trim();
            if (!rawNo) continue;
            const hallName = rawNo.toLowerCase().startsWith('hall') ? rawNo : `Hall ${rawNo}`;
            const cleanNo = rawNo.toUpperCase();
            const studentsInHall = (t.students || []).filter(s => {
              const sHNo = (s.hallNo || '').trim().toUpperCase();
              return sHNo === cleanNo || sHNo === hallName.toUpperCase();
            });
            const rolls = studentsInHall.map(s => s.rollNo).filter(Boolean).sort();
            const rollRange = rolls.length > 1 ? `${rolls[0]} - ${rolls[rolls.length - 1]}` : (rolls[0] || 'No candidates assigned');

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
                status: studentsInHall.length >= (Number(h.capacity) || 30) ? 'Fully Allocated' : (studentsInHall.length > 0 ? 'Allocated' : 'Available')
              });
            } else {
              existing.allocatedStudents = studentsInHall.length;
              existing.rollRange = rollRange;
              if (h.capacity) existing.capacity = Number(h.capacity);
              if (t.allocatedByStaffName) existing.invigilator = t.allocatedByStaffName;
              if (t.department) existing.invigilatorDept = t.department;
              existing.departments = `${t.department || 'Computer Science'} (Sem ${t.semester || 1})`;
              existing.status = studentsInHall.length >= (Number(existing.capacity) || 30) ? 'Fully Allocated' : (studentsInHall.length > 0 ? 'Allocated' : 'Available');
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
    const { invigilator, hallName } = req.body;
    let conflictWarning = null;

    if (invigilator && invigilator.trim() && invigilator !== 'Faculty Assigned' && invigilator !== 'Staff In-Charge') {
      const existing = await ExamHall.findOne({
        invigilator: { $regex: `^${invigilator.trim()}$`, $options: 'i' }
      });
      if (existing) {
        conflictWarning = `⚠️ Warning: Chief Invigilator "${invigilator}" is already allocated to "${existing.hallName}".`;
      }
    }

    const newHall = await ExamHall.create(req.body);
    return res.status(201).json({
      success: true,
      message: conflictWarning ? `Exam hall created with warning: ${conflictWarning}` : 'Examination hall registered successfully',
      warning: conflictWarning,
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
    const { invigilator } = req.body;
    let conflictWarning = null;

    if (invigilator && invigilator.trim() && invigilator !== 'Faculty Assigned' && invigilator !== 'Staff In-Charge') {
      const existing = await ExamHall.findOne({
        _id: { $ne: req.params.id },
        invigilator: { $regex: `^${invigilator.trim()}$`, $options: 'i' }
      });
      if (existing) {
        conflictWarning = `⚠️ Warning: Chief Invigilator "${invigilator}" is already allocated to "${existing.hallName}".`;
      }
    }

    const updated = await ExamHall.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Exam hall not found' });
    }
    return res.status(200).json({
      success: true,
      message: conflictWarning ? `Exam hall updated with warning: ${conflictWarning}` : 'Exam hall updated successfully',
      warning: conflictWarning,
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
