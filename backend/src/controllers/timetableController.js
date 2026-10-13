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

// @desc    Get all staff timetables for Admin portal
// @route   GET /api/timetable
exports.getAllTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find({}).sort({ staffName: 1, staffId: 1 });
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
        schedule: getDefaultSchedule()
      });
    }

    res.status(200).json({
      success: true,
      staffId: timetable.staffId,
      staffName: timetable.staffName,
      department: timetable.department,
      academicYear: timetable.academicYear,
      schedule: timetable.schedule || getDefaultSchedule()
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
    const { day, slot, slotData } = req.body;

    if (!day || !slot) {
      return res.status(400).json({ success: false, message: 'day and slot are required.' });
    }

    let timetable = await Timetable.findOne({ staffId: staffId.trim() });

    if (!timetable) {
      const staff = await Staff.findOne({ staffId: staffId.trim() });
      timetable = new Timetable({
        staffId: staffId.trim(),
        staffName: staff ? staff.name : '',
        department: staff ? staff.department : '',
        schedule: getDefaultSchedule()
      });
    }

    // Convert Mongoose Map or object to plain object for editing
    const currentSchedule = timetable.schedule instanceof Map 
      ? Object.fromEntries(timetable.schedule)
      : (timetable.schedule ? JSON.parse(JSON.stringify(timetable.schedule)) : getDefaultSchedule());

    if (!currentSchedule[day]) {
      currentSchedule[day] = {};
    }

    if (slotData && slotData.code) {
      currentSchedule[day][String(slot)] = {
        code: (slotData.code || '').trim().toUpperCase(),
        name: (slotData.name || '').trim(),
        room: (slotData.room || '').trim(),
        type: (slotData.type || 'theory').toLowerCase(),
        color: (slotData.color || 'blue').toLowerCase()
      };
    } else {
      // Clear slot
      delete currentSchedule[day][String(slot)];
    }

    timetable.schedule = currentSchedule;
    timetable.markModified('schedule');
    await timetable.save();

    res.status(200).json({
      success: true,
      message: `Slot ${slot} on ${day} updated successfully.`,
      schedule: timetable.schedule
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

    let timetable = await Timetable.findOne({ staffId: staffId.trim() });
    if (!timetable) {
      return res.status(200).json({ success: true, message: 'Slot is already empty.' });
    }

    const currentSchedule = timetable.schedule instanceof Map 
      ? Object.fromEntries(timetable.schedule)
      : (timetable.schedule ? JSON.parse(JSON.stringify(timetable.schedule)) : getDefaultSchedule());

    if (currentSchedule[day] && currentSchedule[day][String(slot)]) {
      delete currentSchedule[day][String(slot)];
      timetable.schedule = currentSchedule;
      timetable.markModified('schedule');
      await timetable.save();
    }

    res.status(200).json({
      success: true,
      message: `Slot ${slot} on ${day} cleared.`,
      schedule: timetable.schedule
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
    const allTimetables = await Timetable.find({});

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const slotTimes = {
      1: '8:30 – 9:20 AM',
      2: '9:20 – 10:10 AM',
      3: '10:10 – 11:00 AM',
      4: '11:15 AM – 12:05 PM',
      5: '12:05 – 12:55 PM',
      6: '1:45 – 2:35 PM',
      7: '2:35 – 3:25 PM',
      8: '3:25 – 4:15 PM'
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
      for (let s = 1; s <= 8; s++) {
        const slotKey = String(s);
        let foundSlot = null;

        for (const tt of allTimetables) {
          const sched = tt.schedule instanceof Map ? Object.fromEntries(tt.schedule) : (tt.schedule || {});
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

