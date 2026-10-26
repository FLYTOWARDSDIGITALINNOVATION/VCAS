const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const Staff = require('../models/Staff');
const Student = require('../models/Student');

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
    const rawId = (req.params.rollNo || '').trim();
    if (!rawId) {
      return res.status(400).json({ success: false, message: 'Student roll number or register number is required.' });
    }
    const idRegex = new RegExp('^' + rawId + '$', 'i');

    const Student = require('../models/Student');
    const student = await Student.findOne({
      $or: [
        { rollNo: idRegex },
        { regNo: idRegex },
        { studentId: idRegex },
        { loginId: idRegex },
        { admNo: idRegex }
      ]
    });

    const sRoll = student ? (student.rollNo || rawId) : rawId;
    const sReg = student ? (student.regNo || rawId) : rawId;
    const sRollLower = sRoll.toLowerCase();
    const sRegLower = sReg.toLowerCase();
    const rawLower = rawId.toLowerCase();

    // Find all sessions containing this student roll number or reg number (case-insensitive)
    const sessions = await Attendance.find({
      $or: [
        { 'records.rollNo': new RegExp('^' + sRoll + '$', 'i') },
        { 'records.rollNo': new RegExp('^' + sReg + '$', 'i') },
        { 'records.rollNo': idRegex }
      ]
    }).sort({ date: -1 });

    let total = 0;
    let present = 0;
    let absent = 0;
    let late = 0;
    const subjectMap = {};

    const history = sessions.map(sess => {
      const rec = (sess.records || []).find(r => {
        const rLower = (r.rollNo || '').toLowerCase();
        return rLower === sRollLower || rLower === sRegLower || rLower === rawLower;
      });
      const status = rec ? rec.status : 'Absent';
      const st = status.toLowerCase();

      total++;
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'late') late++;

      const subKey = sess.classCode || sess.className || 'General';
      if (!subjectMap[subKey]) {
        subjectMap[subKey] = {
          code: sess.classCode,
          name: sess.className || sess.classCode,
          staffName: sess.staffName,
          total: 0,
          present: 0,
          absent: 0,
          late: 0
        };
      }
      subjectMap[subKey].total++;
      if (st === 'present') subjectMap[subKey].present++;
      else if (st === 'absent') subjectMap[subKey].absent++;
      else if (st === 'late') subjectMap[subKey].late++;

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

    const percentage = total > 0 
      ? Math.round(((present + late) / total) * 100) 
      : (student && student.attendance !== undefined ? student.attendance : 85);

    const subjectBreakdown = Object.values(subjectMap).map(sub => ({
      ...sub,
      percentage: sub.total > 0 ? Math.round(((sub.present + sub.late) / sub.total) * 100) : 0
    }));

    res.status(200).json({
      success: true,
      rollNo: sRoll,
      regNo: sReg,
      name: student ? (student.name || student.fullName) : '',
      totalClasses: total,
      present,
      absent,
      late,
      percentage,
      subjectBreakdown,
      history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk Save Attendance sessions from Excel/CSV upload
// @route   POST /api/attendance/bulk
exports.bulkSaveAttendance = async (req, res) => {
  try {
    const { sessions, rows, defaultClassCode, defaultStaffId, defaultStaffName, defaultDate, defaultSlot } = req.body;
    
    let sessionsToProcess = [];

    if (Array.isArray(sessions) && sessions.length > 0) {
      sessionsToProcess = sessions;
    } else if (Array.isArray(rows) && rows.length > 0) {
      // Group flat rows by (classCode, date, slot)
      const groupMap = {};
      rows.forEach(r => {
        const cCode = (r.classCode || defaultClassCode || '').trim().toUpperCase();
        const dDate = (r.date || defaultDate || new Date().toISOString().split('T')[0]).trim();
        const sSlot = (r.slot || defaultSlot || '8:30 AM').trim();
        const key = `${cCode}__${dDate}__${sSlot}`;
        if (!groupMap[key]) {
          groupMap[key] = {
            classCode: cCode,
            date: dDate,
            slot: sSlot,
            staffId: (r.staffId || defaultStaffId || 'EMP001').trim(),
            staffName: (r.staffName || defaultStaffName || '').trim(),
            records: []
          };
        }
        groupMap[key].records.push({
          rollNo: (r.rollNo || r.regNo || '').trim().toUpperCase(),
          name: (r.name || r.studentName || '').trim(),
          status: (r.status || 'Present').trim(),
          remarks: (r.remarks || '').trim()
        });
      });
      sessionsToProcess = Object.values(groupMap);
    }

    if (!sessionsToProcess.length) {
      return res.status(400).json({ success: false, message: 'No attendance records provided for bulk import.' });
    }

    let savedCount = 0;
    const errors = [];

    for (const sess of sessionsToProcess) {
      try {
        const classCode = (sess.classCode || '').trim().toUpperCase();
        const date = (sess.date || '').trim();
        const slot = (sess.slot || '8:30 AM').trim();
        const staffId = (sess.staffId || defaultStaffId || 'EMP001').trim();
        const staffName = (sess.staffName || defaultStaffName || '').trim();

        if (!classCode || !date) {
          errors.push(`Missing classCode or date in session`);
          continue;
        }

        let resolvedClassName = sess.className || '';
        let resolvedClassId = sess.classId || null;
        if (!resolvedClassName || !resolvedClassId) {
          const cls = await Class.findOne({ code: classCode });
          if (cls) {
            resolvedClassName = cls.name;
            resolvedClassId = cls._id;
          }
        }

        const computed = computeCounts(sess.records || []);

        const filter = {
          classCode,
          date,
          slot
        };

        const update = {
          staffId,
          staffName,
          classId: resolvedClassId,
          className: resolvedClassName,
          topic: sess.topic || '',
          records: computed.records,
          totalStudents: computed.totalStudents,
          presentCount: computed.presentCount,
          absentCount: computed.absentCount,
          lateCount: computed.lateCount
        };

        await Attendance.findOneAndUpdate(filter, update, { upsert: true, new: true, setDefaultsOnInsert: true });
        savedCount++;
      } catch (err) {
        errors.push(err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully processed and saved ${savedCount} attendance session(s).`,
      savedSessions: savedCount,
      errors
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export attendance by department, year, batch, semester, or class
// @route   GET /api/attendance/export/filtered
exports.getFilteredAttendance = async (req, res) => {
  try {
    const { department, year, batch, semester, classCode, startDate, endDate } = req.query;

    // 1. Build Student Filter if dept, batch, sem, year are supplied
    const studentFilter = {};
    if (department && department !== 'All' && department !== 'All Departments') {
      studentFilter.department = { $regex: new RegExp(department.trim(), 'i') };
    }
    if (batch && batch !== 'All') {
      studentFilter.batch = { $regex: new RegExp(batch.trim(), 'i') };
    }
    if (semester && semester !== 'All') {
      studentFilter.$or = [
        { sem: { $regex: new RegExp(String(semester).trim(), 'i') } },
        { semester: Number(semester) }
      ];
    }
    if (year && year !== 'All') {
      studentFilter.$or = [
        { year: { $regex: new RegExp(year.trim(), 'i') } },
        { academicYear: { $regex: new RegExp(year.trim(), 'i') } }
      ];
    }

    let targetStudents = [];
    let rollSet = null;
    if (Object.keys(studentFilter).length > 0) {
      targetStudents = await Student.find(studentFilter).select('rollNo regNo name department batch sem academicYear attendance');
      rollSet = new Set(targetStudents.map(s => (s.rollNo || s.regNo || '').toUpperCase().trim()).filter(Boolean));
    }

    // 2. Build attendance session filter
    const sessionFilter = {};
    if (classCode && classCode !== 'All') {
      sessionFilter.classCode = { $regex: new RegExp(classCode.trim(), 'i') };
    }
    if (startDate || endDate) {
      sessionFilter.date = {};
      if (startDate) sessionFilter.date.$gte = startDate.trim();
      if (endDate) sessionFilter.date.$lte = endDate.trim();
    }

    if (department && department !== 'All' && department !== 'All Departments' && (!classCode || classCode === 'All')) {
      const matchingClasses = await Class.find({ dept: { $regex: new RegExp(department.trim(), 'i') } }).select('code');
      const classCodes = matchingClasses.map(c => c.code);
      if (classCodes.length > 0) {
        sessionFilter.classCode = { $in: classCodes };
      }
    }

    const sessions = await Attendance.find(sessionFilter).sort({ date: -1 });

    // 3. Compute student attendance summaries if targetStudents or sessions exist
    const studentMap = {};

    targetStudents.forEach(st => {
      const roll = (st.rollNo || st.regNo || '').toUpperCase().trim();
      if (roll) {
        studentMap[roll] = {
          rollNo: roll,
          regNo: st.regNo || '',
          name: st.name || '',
          department: st.department || '',
          batch: st.batch || '',
          semester: st.sem || '',
          totalClasses: 0,
          present: 0,
          absent: 0,
          late: 0,
          percentage: st.attendance || 0
        };
      }
    });

    sessions.forEach(sess => {
      (sess.records || []).forEach(r => {
        const roll = (r.rollNo || '').toUpperCase().trim();
        if (!roll) return;
        if (rollSet && !rollSet.has(roll)) return;

        if (!studentMap[roll]) {
          studentMap[roll] = {
            rollNo: roll,
            regNo: '',
            name: r.name || '',
            department: department || '',
            batch: batch || '',
            semester: semester || '',
            totalClasses: 0,
            present: 0,
            absent: 0,
            late: 0,
            percentage: 0
          };
        }

        const entry = studentMap[roll];
        entry.totalClasses += 1;
        const st = (r.status || 'Present').toLowerCase();
        if (st === 'present') entry.present += 1;
        else if (st === 'absent') entry.absent += 1;
        else if (st === 'late') entry.late += 1;
      });
    });

    const studentSummaries = Object.values(studentMap).map(s => {
      const pct = s.totalClasses > 0
        ? Math.round(((s.present + s.late) / s.totalClasses) * 100)
        : s.percentage || 85;
      return { ...s, percentage: pct };
    }).sort((a, b) => a.rollNo.localeCompare(b.rollNo));

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
      studentSummaries
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
