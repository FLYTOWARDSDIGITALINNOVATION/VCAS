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
