const Timetable = require('../models/Timetable');
const Staff = require('../models/Staff');

// Helper to ensure clean default schedule structure
function getDefaultSchedule() {
  return {
    Monday: {},
    Tuesday: {},
    Wednesday: {},
    Thursday: {},
    Friday: {},
    Saturday: {}
  };
}

function toPlainSchedule(schedule) {
  return schedule instanceof Map
    ? Object.fromEntries(schedule)
    : (schedule ? JSON.parse(JSON.stringify(schedule)) : getDefaultSchedule());
}

function getScopedSchedule(timetable, academicYear, department, year) {
  return timetable.yearSchedules?.[academicYear]?.[department]?.[String(year)] || getDefaultSchedule();
}

function setScopedSchedule(timetable, academicYear, department, year, schedule) {
  const yearSchedules = timetable.yearSchedules
    ? JSON.parse(JSON.stringify(timetable.yearSchedules))
    : {};
  yearSchedules[academicYear] = yearSchedules[academicYear] || {};
  yearSchedules[academicYear][department] = yearSchedules[academicYear][department] || {};
  yearSchedules[academicYear][department][String(year)] = schedule;
  timetable.yearSchedules = yearSchedules;
  timetable.markModified('yearSchedules');
}

function hasScheduleSlots(schedule) {
  return Object.values(schedule || {}).some(day => day && Object.keys(day).length > 0);
}

function departmentsMatch(first, second) {
  const normalize = value => {
    const department = String(value || '').trim().toLowerCase();
    return department === 'ai' || department === 'artificial intelligence'
      ? 'artificial intelligence'
      : department;
  };
  const a = normalize(first);
  const b = normalize(second);
  return Boolean(a && b && (a === b || a.includes(b) || b.includes(a)));
}

function getTimetableEntries(timetable) {
  const entries = [];
  const legacySchedule = toPlainSchedule(timetable.schedule);
  if (hasScheduleSlots(legacySchedule)) {
    entries.push({
      ...timetable.toObject(),
      schedule: legacySchedule,
      year: null,
      isLegacy: true
    });
  }

  Object.entries(timetable.yearSchedules || {}).forEach(([academicYear, departments]) => {
    Object.entries(departments || {}).forEach(([department, years]) => {
      Object.entries(years || {}).forEach(([year, schedule]) => {
        entries.push({
          ...timetable.toObject(),
          academicYear,
          department,
          year: Number(year),
          isLegacy: false,
          schedule: toPlainSchedule(schedule)
        });
      });
    });
  });

  if (entries.length === 0) {
    entries.push({ ...timetable.toObject(), schedule: legacySchedule, year: null, isLegacy: true });
  }
  return entries;
}

function getMergedScopedSchedule(timetable, { department, year, academicYear } = {}) {
  const result = getDefaultSchedule();
  const yearSchedules = timetable.yearSchedules || {};

  Object.entries(yearSchedules).forEach(([session, departments]) => {
    if (academicYear && session !== academicYear) return;
    Object.entries(departments || {}).forEach(([dept, years]) => {
      if (department && !departmentsMatch(dept, department)) return;
      Object.entries(years || {}).forEach(([studyYear, schedule]) => {
        if (year && String(studyYear) !== String(year)) return;
        const plainSchedule = toPlainSchedule(schedule);
        Object.keys(result).forEach(day => {
          result[day] = { ...result[day], ...(plainSchedule[day] || {}) };
        });
      });
    });
  });

  return result;
}

// @desc    Get all staff timetables for Admin portal
// @route   GET /api/timetable
exports.getAllTimetables = async (req, res) => {
  try {
    const records = await Timetable.find({}).sort({ staffName: 1, staffId: 1 });
    const timetables = records.flatMap(getTimetableEntries);
    res.status(200).json({
      success: true,
      count: timetables.length,
      timetables
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get timetable for a specific staff member
// @route   GET /api/timetable/staff/:staffId
exports.getStaffTimetable = async (req, res) => {
  try {
    const { staffId } = req.params;
    let timetable = await Timetable.findOne({ staffId: staffId.trim() });

    if (!timetable) {
      return res.status(200).json({
        success: true,
        staffId,
        department: req.query.department || '',
        academicYear: req.query.academicYear || '2025-2026',
        year: req.query.year ? Number(req.query.year) : null,
        schedule: getDefaultSchedule()
      });
    }

    const { department, year, academicYear } = req.query;
    const scopedRequest = Boolean(department || year || academicYear);
    const schedule = scopedRequest
      ? getMergedScopedSchedule(timetable, { department, year, academicYear })
      : getMergedScopedSchedule(timetable);
    if (!scopedRequest || !hasScheduleSlots(schedule)) {
      const legacySchedule = toPlainSchedule(timetable.schedule);
      if (!scopedRequest || Object.keys(timetable.yearSchedules || {}).length === 0) {
        Object.keys(schedule).forEach(day => {
          schedule[day] = { ...schedule[day], ...(legacySchedule[day] || {}) };
        });
      }
    }

    res.status(200).json({
      success: true,
      staffId: timetable.staffId,
      staffName: timetable.staffName,
      department: department || timetable.department,
      academicYear: academicYear || timetable.academicYear,
      year: year ? Number(year) : null,
      schedule
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save or overwrite full weekly timetable for a staff member
// @route   POST /api/timetable/staff/:staffId
exports.saveStaffTimetable = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { schedule, academicYear } = req.body;

    const staff = await Staff.findOne({ staffId: staffId.trim() });

    const filter = { staffId: staffId.trim() };
    const update = {
      staffName: staff ? staff.name : '',
      department: staff ? staff.department : '',
      academicYear: academicYear || '2025-2026',
      schedule: schedule || getDefaultSchedule()
    };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    const timetable = await Timetable.findOneAndUpdate(filter, update, options);

    res.status(200).json({
      success: true,
      message: 'Timetable saved successfully.',
      timetable
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign or update a single timetable slot
// @route   PUT /api/timetable/staff/:staffId/slot
exports.updateSlot = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { day, slot, slotData, academicYear } = req.body;

    if (!day || !slot) {
      return res.status(400).json({ success: false, message: 'day and slot are required.' });
    }

    let timetable = await Timetable.findOne({ staffId: staffId.trim() });
    const session = academicYear || '2025-2026';

    if (!timetable) {
      const staff = await Staff.findOne({ staffId: staffId.trim() });
      timetable = new Timetable({
        staffId: staffId.trim(),
        staffName: staff ? staff.name : '',
        department: staff ? staff.department : '',
        academicYear: session,
        schedule: getDefaultSchedule(),
        yearSchedules: {}
      });
    }

    const targetYear = Number(req.body.year || slotData?.year || 1);
    const targetDept = (req.body.department || slotData?.department || timetable.department || 'General').trim();
    const scopedAssignment = Boolean(targetDept && targetYear);

    // Convert Mongoose Map or object to plain object for editing
    const currentSchedule = scopedAssignment
      ? toPlainSchedule(getScopedSchedule(timetable, session, targetDept, targetYear))
      : toPlainSchedule(timetable.schedule);

    if (!currentSchedule[day]) {
      currentSchedule[day] = {};
    }

    let roomConflictWarning = null;

    if (slotData && slotData.code) {
      const slotObj = {
        code: (slotData.code || '').trim().toUpperCase(),
        name: (slotData.name || '').trim(),
        room: (slotData.room || '').trim(),
        type: (slotData.type || 'theory').toLowerCase(),
        color: (slotData.color || 'blue').toLowerCase(),
        isContinuousLab: Boolean(slotData.isContinuousLab || slotData.type === 'lab'),
        labHours: Number(slotData.labHours) || 0,
        partTimeSchedule: slotData.partTimeSchedule || undefined,
        combinedDept: slotData.combinedDept || undefined,
        combinedYear: slotData.combinedYear || undefined,
        year: targetYear,
        department: targetDept
      };

      currentSchedule[day][String(slot)] = slotObj;

      // Check if multiple / continuous periods were specified (e.g. 1, 2, 3 or typed periods)
      let targetSlots = [slot];
      if (Array.isArray(slotData.continuousSlots) && slotData.continuousSlots.length > 0) {
        targetSlots = slotData.continuousSlots;
      } else if (slotData.periods) {
        if (Array.isArray(slotData.periods)) {
          targetSlots = slotData.periods.map(Number).filter(p => !isNaN(p) && p >= 1 && p <= 6);
        } else if (typeof slotData.periods === 'string') {
          targetSlots = slotData.periods.split(/[,\s-]+/).map(Number).filter(p => !isNaN(p) && p >= 1 && p <= 6);
        }
      } else if (slotData.isContinuousLab && Number(slotData.labHours) > 1) {
        const startPeriod = Number(slot);
        const totalContinuous = Number(slotData.labHours);
        targetSlots = [];
        for (let i = 0; i < totalContinuous; i++) {
          const targetSlot = startPeriod + i;
          if (targetSlot <= 6) targetSlots.push(targetSlot);
        }
      }

      // Only clear other days if explicitly requested by client (never by default)
      if (slotData.clearOtherDays === true) {
        Object.keys(currentSchedule).forEach(d => {
          if (d !== day && currentSchedule[d]) {
            Object.keys(currentSchedule[d]).forEach(sl => {
              if (currentSchedule[d][sl]?.code === slotObj.code) {
                delete currentSchedule[d][sl];
              }
            });
          }
        });
      }

      targetSlots.forEach(s => {
        currentSchedule[day][String(s)] = { ...slotObj };
      });

      // Check if room/hall is already occupied by someone else at this day and period
      if (slotObj.room) {
        try {
          const others = await Timetable.find({ staffId: { $ne: staffId.trim() } });
          for (const other of others) {
            for (const otherEntry of getTimetableEntries(other)) {
              const daySlots = otherEntry.schedule?.[day] || {};
              for (const sNum of targetSlots) {
                const occupied = daySlots[String(sNum)];
                if (occupied && occupied.room && occupied.room.trim().toLowerCase() === slotObj.room.toLowerCase()) {
                  roomConflictWarning = `⚠️ Warning: Room/Hall "${slotObj.room}" is already allocated to ${other.staffName || other.staffId} on ${day} Period ${sNum}.`;
                  break;
                }
              }
              if (roomConflictWarning) break;
            }
            if (roomConflictWarning) break;
          }
        } catch (_) {}
      }
    } else {
      // Clear slot
      delete currentSchedule[day][String(slot)];
    }

    if (scopedAssignment) {
      setScopedSchedule(timetable, session, targetDept, targetYear, currentSchedule);
      // Synchronize top-level schedule
      const legacySchedule = toPlainSchedule(timetable.schedule);
      if (!legacySchedule[day]) legacySchedule[day] = {};
      if (slotData && slotData.code) {
        const targetSlots = Array.isArray(slotData.continuousSlots) && slotData.continuousSlots.length > 0
          ? slotData.continuousSlots
          : [slot];
        targetSlots.forEach(s => {
          legacySchedule[day][String(s)] = {
            code: (slotData.code || '').trim().toUpperCase(),
            name: (slotData.name || '').trim(),
            room: (slotData.room || '').trim(),
            type: (slotData.type || 'theory').toLowerCase(),
            color: (slotData.color || 'blue').toLowerCase(),
            isContinuousLab: Boolean(slotData.isContinuousLab || slotData.type === 'lab'),
            labHours: Number(slotData.labHours) || 0,
            partTimeSchedule: slotData.partTimeSchedule || undefined,
            combinedDept: slotData.combinedDept || undefined,
            combinedYear: slotData.combinedYear || undefined,
            year: targetYear,
            department: targetDept
          };
        });
      } else {
        delete legacySchedule[day][String(slot)];
      }
      timetable.schedule = legacySchedule;
      timetable.markModified('schedule');
    } else {
      timetable.schedule = currentSchedule;
      timetable.markModified('schedule');
    }
    await timetable.save();

    res.status(200).json({
      success: true,
      message: roomConflictWarning ? `Slot updated with warning: ${roomConflictWarning}` : `Slot ${slot} on ${day} updated successfully for Year ${targetYear}.`,
      warning: roomConflictWarning,
      schedule: currentSchedule
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear / remove a slot
// @route   DELETE /api/timetable/staff/:staffId/slot/:day/:slot
exports.clearSlot = async (req, res) => {
  try {
    const { staffId, day, slot } = req.params;
    const { department, year, academicYear } = req.query;

    let timetable = await Timetable.findOne({ staffId: staffId.trim() });
    if (!timetable) {
      return res.status(200).json({ success: true, message: 'Slot is already empty.' });
    }

    const targetYear = year ? Number(year) : null;
    const targetDept = (department || timetable.department || '').trim();
    const scopedAssignment = Boolean(targetDept && targetYear);
    const session = academicYear || '2025-2026';
    const currentSchedule = scopedAssignment
      ? toPlainSchedule(getScopedSchedule(timetable, session, targetDept, targetYear))
      : toPlainSchedule(timetable.schedule);

    if (currentSchedule[day] && currentSchedule[day][String(slot)]) {
      delete currentSchedule[day][String(slot)];
      if (scopedAssignment) {
        setScopedSchedule(timetable, session, targetDept, targetYear, currentSchedule);
        if (timetable.schedule && timetable.schedule[day]) {
          const legacy = toPlainSchedule(timetable.schedule);
          if (legacy[day]) {
            delete legacy[day][String(slot)];
            timetable.schedule = legacy;
            timetable.markModified('schedule');
          }
        }
      } else {
        timetable.schedule = currentSchedule;
        timetable.markModified('schedule');
      }
      await timetable.save();
    }

    res.status(200).json({
      success: true,
      message: `Slot ${slot} on ${day} cleared.`,
      schedule: currentSchedule
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get complete weekly timetable for a student
// @route   GET /api/timetable/student/:identifier
exports.getStudentTimetable = async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Student identifier required.' });
    }
    const idClean = identifier.trim();
    const idRegex = new RegExp('^' + idClean + '$', 'i');

    const Student = require('../models/Student');
    const Class = require('../models/Class');

    const student = await Student.findOne({
      $or: [
        { rollNo: idRegex },
        { regNo: idRegex },
        { studentId: idRegex },
        { loginId: idRegex },
        { admNo: idRegex }
      ]
    });

    const rollNo = student ? (student.rollNo || idClean) : idClean;
    const regNo = student ? (student.regNo || idClean) : idClean;
    const dept = student ? (student.department || student.course || '') : '';
    const semester = student ? (student.sem || student.semester || '1st Sem') : '1st Sem';
    const course = student ? (student.course || dept) : dept;

    // 1. Find classes student is strictly enrolled in
    const enrolledClasses = await Class.find({
      $or: [
        { 'students.rollNo': new RegExp('^' + rollNo + '$', 'i') },
        { 'students.rollNo': new RegExp('^' + regNo + '$', 'i') },
        { 'students.studentId': new RegExp('^' + rollNo + '$', 'i') },
        { 'students.studentId': new RegExp('^' + regNo + '$', 'i') }
      ]
    });

    const enrolledClassMap = {};
    enrolledClasses.forEach(c => {
      if (c.code) enrolledClassMap[c.code.toUpperCase().trim()] = c;
    });

    // 2. Fetch all staff timetables
    const timetableEntries = (await Timetable.find({}))
      .flatMap(getTimetableEntries)
      .sort((a, b) => Number(a.isLegacy) - Number(b.isLegacy));

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const slotTimes = {
      1: '09:30 – 10:30 AM',
      2: '10:30 – 11:20 AM',
      3: '11:30 AM – 12:20 PM',
      4: '12:20 – 01:00 PM',
      5: '01:30 – 02:15 PM',
      6: '02:15 – 03:00 PM'
    };

    const studentSchedule = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: []
    };

    days.forEach(day => {
      for (let s = 1; s <= 6; s++) {
        const slotKey = String(s);
        let foundSlot = null;

        for (const tt of timetableEntries) {
          const sched = toPlainSchedule(tt.schedule);
          const daySched = sched[day] || {};
          const slotItem = daySched[slotKey];

          if (slotItem && (slotItem.code || slotItem.name)) {
            const itemCode = (slotItem.code || '').toUpperCase().trim();
            const matchedClass = enrolledClassMap[itemCode];
            const isEnrolled = Boolean(matchedClass);

            // Only display timetable slot if student is explicitly enrolled in this subject
            if (isEnrolled) {
              foundSlot = {
                slot: s,
                time: slotTimes[s] || `Period ${s}`,
                code: matchedClass ? matchedClass.code : (slotItem.code || itemCode),
                subject: (matchedClass && matchedClass.name) ? matchedClass.name : (slotItem.name || slotItem.code || 'Core Course'),
                faculty: (matchedClass && matchedClass.staffName) ? matchedClass.staffName : (tt.staffName || 'Faculty'),
                room: (matchedClass && matchedClass.room && matchedClass.room.trim()) ? matchedClass.room : (slotItem.room || 'LH-101'),
                type: (slotItem.type || 'theory').toLowerCase(),
                color: (slotItem.color || 'blue').toLowerCase()
              };
              break;
            }
          }
        }

        if (foundSlot) {
          studentSchedule[day].push(foundSlot);
        }
      }
    });

    res.status(200).json({
      success: true,
      student: {
        rollNo,
        regNo,
        name: student ? (student.name || student.fullName) : '',
        course,
        department: dept,
        semester
      },
      schedule: studentSchedule
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Automatically schedule a subject/class into staff timetable based on configured hours
//          Hours are scheduled as CONTINUOUS periods (1, 2, 3...) on the assigned day.
exports.autoGenerateTimetableSchedule = async ({
  code,
  name,
  dept,
  year,
  sem,
  theoryHours,
  labHours,
  isContinuousLab,
  staffId,
  staffName,
  room,
  day,
  periods,
  classCategory,
  partTimeSchedule,
  combinedDept,
  combinedYear,
  academicYear
}) => {
  try {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) return null;

    // 1. Identify staff to assign to
    let targetStaffId = (staffId || '').trim();
    let staffDoc = null;
    if (targetStaffId) {
      staffDoc = await Staff.findOne({
        $or: [
          { staffId: targetStaffId },
          { name: new RegExp('^' + targetStaffId + '$', 'i') }
        ]
      });
      if (staffDoc) {
        targetStaffId = staffDoc.staffId;
      }
    }
    
    if (!staffDoc && staffName) {
      staffDoc = await Staff.findOne({ name: new RegExp('^' + staffName.trim() + '$', 'i') });
      if (staffDoc) {
        targetStaffId = staffDoc.staffId;
      }
    }

    if (!staffDoc) {
      if (dept) {
        staffDoc = await Staff.findOne({ department: dept });
      }
      if (!staffDoc) staffDoc = await Staff.findOne({});
      if (staffDoc) targetStaffId = staffDoc.staffId;
    }

    if (!targetStaffId) return null;

    let timetable = await Timetable.findOne({ staffId: targetStaffId });
    const session = academicYear || '2025-2026';
    const targetDepartment = dept || staffDoc?.department || '';
    const targetYear = Number(year) || 1;
    if (!timetable) {
      timetable = new Timetable({
        staffId: targetStaffId,
        staffName: staffDoc ? staffDoc.name : (staffName || ''),
        department: targetDepartment,
        academicYear: session,
        schedule: getDefaultSchedule()
      });
    }

    const currentSchedule = toPlainSchedule(
      getScopedSchedule(timetable, session, targetDepartment, targetYear)
    );

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    days.forEach(d => { if (!currentSchedule[d]) currentSchedule[d] = {}; });

    const numTheory = Number(theoryHours) >= 0 ? Number(theoryHours) : 3;
    const numLab = Number(labHours) >= 0 ? Number(labHours) : 0;
    const targetDay = day || 'Monday';

    // Do not clear other days so subjects taught across multiple days are preserved

    // 2. Schedule CONTINUOUS LAB HOURS if labHours > 0
    if (numLab > 0) {
      const continuousCount = Math.min(5, numLab);
      const daySlots = currentSchedule[targetDay] || {};
      for (let s = 1; s <= continuousCount; s++) {
        daySlots[String(s)] = {
          code: cleanCode,
          name: (name || cleanCode).trim(),
          room: room && room.toLowerCase().includes('lab') ? room.trim() : 'Computer Lab 1',
          type: 'lab',
          color: 'emerald',
          isContinuousLab: true,
          labHours: continuousCount
        };
      }
      currentSchedule[targetDay] = daySlots;
    }

    // 3. Schedule CONTINUOUS THEORY HOURS (e.g. 1, 2, 3...) on the target day
    if (numTheory > 0) {
      const daySlots = currentSchedule[targetDay] || {};

      // If explicit typed periods provided (e.g. "1, 2, 3" or [1, 2, 3])
      let periodsToAssign = [];
      if (periods) {
        if (Array.isArray(periods)) {
          periodsToAssign = periods.map(Number).filter(p => !isNaN(p) && p >= 1 && p <= 6);
        } else if (typeof periods === 'string') {
          periodsToAssign = periods.split(/[,\s-]+/).map(Number).filter(p => !isNaN(p) && p >= 1 && p <= 6);
        }
      }

      if (periodsToAssign.length === 0) {
        // Continuous periods 1, 2, 3...
        let maxAllowedPeriod = 6;
        if (classCategory === 'part-time') {
          if (partTimeSchedule === 'before-break') maxAllowedPeriod = 2;
          else if (partTimeSchedule === 'before-lunch') maxAllowedPeriod = 4;
        }
        const totalContinuous = Math.min(maxAllowedPeriod, numTheory);
        for (let p = 1; p <= totalContinuous; p++) {
          periodsToAssign.push(p);
        }
      }

      const assignedType = classCategory === 'part-time' ? 'part-time' : classCategory === 'combined' ? 'combined' : 'theory';
      const assignedColor = classCategory === 'part-time' ? 'orange' : classCategory === 'combined' ? 'violet' : 'blue';

      periodsToAssign.forEach(period => {
        daySlots[String(period)] = {
          code: cleanCode,
          name: (name || cleanCode).trim(),
          room: (room && !room.toLowerCase().includes('lab')) ? room.trim() : 'LH-101',
          type: assignedType,
          color: assignedColor,
          isContinuousLab: false,
          labHours: 0,
          partTimeSchedule: classCategory === 'part-time' ? partTimeSchedule : undefined,
          combinedDept: classCategory === 'combined' ? combinedDept : undefined,
          combinedYear: classCategory === 'combined' ? combinedYear : undefined
        };
      });

      currentSchedule[targetDay] = daySlots;
    }

    setScopedSchedule(timetable, session, targetDepartment, targetYear, currentSchedule);
    await timetable.save();

    return timetable;
  } catch (err) {
    console.error('Error auto-generating timetable schedule:', err);
    return null;
  }
};

