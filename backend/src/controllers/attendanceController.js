const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const Staff = require('../models/Staff');

// Helper to compute counts from records array
function computeCounts(records = []) {
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;

  const normalizedRecords = records.map(r => {
    const rawStatus = (r.status || 'Present').trim();
    let status = 'Present';
    if (rawStatus.toLowerCase() === 'absent') status = 'Absent';
    else if (rawStatus.toLowerCase() === 'late') status = 'Late';

    if (status === 'Present') presentCount++;
    else if (status === 'Absent') absentCount++;
    else if (status === 'Late') lateCount++;

    return {
      rollNo: (r.rollNo || '').trim().toUpperCase(),
      name: (r.name || '').trim(),
      status,
      remarks: (r.remarks || '').trim()
    };
  });

  return {
    records: normalizedRecords,
    totalStudents: normalizedRecords.length,
    presentCount,
    absentCount,
    lateCount
  };
}

// @desc    Get all attendance sessions (with optional query filters)
// @route   GET /api/attendance
exports.getAllAttendance = async (req, res) => {
  try {
    const { staffId, classCode, date, startDate, endDate } = req.query;
    const filter = {};

    if (staffId) filter.staffId = staffId.trim();
    if (classCode) filter.classCode = classCode.trim().toUpperCase();
    if (date) filter.date = date.trim();

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate.trim();
      if (endDate) filter.date.$lte = endDate.trim();
    }

    const sessions = await Attendance.find(filter).sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance sessions for a specific staff member
// @route   GET /api/attendance/staff/:staffId
exports.getStaffSessions = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { classCode, date } = req.query;
    const filter = { staffId: staffId.trim() };

    if (classCode) filter.classCode = classCode.trim().toUpperCase();
    if (date) filter.date = date.trim();

    const sessions = await Attendance.find(filter).sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single attendance session by ID
// @route   GET /api/attendance/:id
exports.getSessionById = async (req, res) => {
  try {
    const session = await Attendance.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Attendance session not found.' });
    }
    res.status(200).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save or Upsert an attendance session
// @route   POST /api/attendance
// @route   POST /api/attendance/staff/:staffId
exports.saveSession = async (req, res) => {
  try {
    const staffIdParam = req.params.staffId;
    const {
      classId,
      classCode,
      className,
      staffId,
      staffName,
      date,
      slot,
      topic,
      records
    } = req.body;

    const finalStaffId = (staffId || staffIdParam || '').trim();
    const finalClassCode = (classCode || '').trim().toUpperCase();
    const finalDate = (date || '').trim();
    const finalSlot = (slot || '').trim();

    if (!finalStaffId || !finalClassCode || !finalDate || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'staffId, classCode, date (YYYY-MM-DD), and records array are required.'
      });
    }

    // Lookup metadata if className or staffName missing
    let resolvedClassName = className ? className.trim() : '';
    let resolvedStaffName = staffName ? staffName.trim() : '';
    let resolvedClassId = classId || null;

    if (!resolvedClassName || !resolvedClassId) {
      const cls = await Class.findOne({ code: finalClassCode });
      if (cls) {
        if (!resolvedClassName) resolvedClassName = cls.name;
        if (!resolvedClassId) resolvedClassId = cls._id;
      }
    }

    if (!resolvedStaffName) {
      const staff = await Staff.findOne({ staffId: finalStaffId });
      if (staff) resolvedStaffName = staff.name;
    }

    const computed = computeCounts(records);

    const filter = {
      staffId: finalStaffId,
      classCode: finalClassCode,
      date: finalDate,
      slot: finalSlot
    };

    const update = {
      classId: resolvedClassId,
      className: resolvedClassName,
      staffName: resolvedStaffName,
      topic: (topic || '').trim(),
      records: computed.records,
      totalStudents: computed.totalStudents,
      presentCount: computed.presentCount,
      absentCount: computed.absentCount,
      lateCount: computed.lateCount
    };

    const options = { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true };

    const session = await Attendance.findOneAndUpdate(filter, update, options);

    res.status(201).json({
      success: true,
      message: 'Attendance saved successfully.',
      session
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An attendance record for this class, date, and slot already exists.'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an existing session by ID
// @route   PUT /api/attendance/:id
exports.updateSession = async (req, res) => {
  try {
    const session = await Attendance.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Attendance session not found.' });
    }

    const { date, slot, topic, records, className } = req.body;

    if (date) session.date = date.trim();
    if (slot !== undefined) session.slot = slot.trim();
    if (topic !== undefined) session.topic = topic.trim();
    if (className !== undefined) session.className = className.trim();

    if (Array.isArray(records)) {
      const computed = computeCounts(records);
      session.records = computed.records;
      session.totalStudents = computed.totalStudents;
      session.presentCount = computed.presentCount;
      session.absentCount = computed.absentCount;
      session.lateCount = computed.lateCount;
    }

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Attendance session updated.',
      session
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an attendance session by ID
// @route   DELETE /api/attendance/:id
exports.deleteSession = async (req, res) => {
  try {
    const session = await Attendance.findByIdAndDelete(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Attendance session not found.' });
    }
    res.status(200).json({
      success: true,
      message: 'Attendance session deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance summary for a class (per-student percentage & breakdown)
// @route   GET /api/attendance/summary/:classCode
// @route   GET /api/attendance/staff/:staffId/summary/:classCode
exports.getClassSummary = async (req, res) => {
  try {
    const { classCode } = req.params;
    const staffId = req.params.staffId || req.query.staffId;

    const filter = { classCode: classCode.trim().toUpperCase() };
    if (staffId) filter.staffId = staffId.trim();

    const sessions = await Attendance.find(filter).sort({ date: 1 });

    // Aggregate stats per student roll number
    const studentMap = {};

    for (const session of sessions) {
      for (const record of session.records) {
        const rollNo = record.rollNo;
        if (!studentMap[rollNo]) {
          studentMap[rollNo] = {
            rollNo,
            name: record.name,
            present: 0,
            absent: 0,
            late: 0,
            total: 0
          };
        }
        const st = (record.status || '').toLowerCase();
        if (st === 'present') studentMap[rollNo].present++;
        else if (st === 'absent') studentMap[rollNo].absent++;
        else if (st === 'late') studentMap[rollNo].late++;
        studentMap[rollNo].total++;
      }
    }

    const studentSummaries = Object.values(studentMap).map(s => {
      const percentage = s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 100) : 0;
      return {
        ...s,
        percentage
      };
    });

    res.status(200).json({
      success: true,
      classCode: classCode.toUpperCase(),
      totalSessions: sessions.length,
      studentsCount: studentSummaries.length,
      summary: studentSummaries
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance history for an individual student across classes
// @route   GET /api/attendance/student/:rollNo
exports.getStudentAttendance = async (req, res) => {
  try {
    const rollNo = req.params.rollNo.trim().toUpperCase();

    // Find all sessions containing this student roll number
    const sessions = await Attendance.find({ 'records.rollNo': rollNo }).sort({ date: -1 });

    let total = 0;
    let present = 0;
    let absent = 0;
    let late = 0;

    const history = sessions.map(sess => {
      const rec = sess.records.find(r => r.rollNo === rollNo);
      const status = rec ? rec.status : 'Absent';
      const st = status.toLowerCase();

      total++;
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'late') late++;

      return {
        sessionId: sess._id,
        classCode: sess.classCode,
        className: sess.className,
        date: sess.date,
        slot: sess.slot,
        staffName: sess.staffName,
        status,
        remarks: rec ? rec.remarks : ''
      };
    });

    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    res.status(200).json({
      success: true,
      rollNo,
      totalClasses: total,
      present,
      absent,
      late,
      percentage,
      history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
