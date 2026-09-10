const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  rollNo:  { type: String, required: true, uppercase: true, trim: true },
  name:    { type: String, required: true, trim: true },
  status:  {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'present', 'absent', 'late'],
    default: 'Present'
  },
  remarks: { type: String, default: '', trim: true }
}, { _id: true });

const attendanceSessionSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: null
  },
  classCode: {
    type: String,
    required: [true, 'Class code is required'],
    uppercase: true,
    trim: true,
    index: true
  },
  className: {
    type: String,
    default: '',
    trim: true
  },
  staffId: {
    type: String,
    required: [true, 'Staff ID is required'],
    trim: true,
    index: true
  },
  staffName: {
    type: String,
    default: '',
    trim: true
  },
  date: {
    type: String,
    required: [true, 'Date (YYYY-MM-DD) is required'],
    trim: true,
    index: true
  },
  slot: {
    type: String,
    default: '',
    trim: true
  },
  topic: {
    type: String,
    default: '',
    trim: true
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  presentCount: {
    type: Number,
    default: 0
  },
  absentCount: {
    type: Number,
    default: 0
  },
  lateCount: {
    type: Number,
    default: 0
  },
  records: [attendanceRecordSchema]
}, {
  timestamps: true,
  collection: 'attendance' // Exact match for Atlas collection
});

// Compound index to prevent duplicate attendance sessions for the same class/slot/date
attendanceSessionSchema.index(
  { staffId: 1, classCode: 1, date: 1, slot: 1 },
  { unique: true }
);

// Auto-tally attendance counts before save
attendanceSessionSchema.pre('save', function (next) {
  if (this.records && Array.isArray(this.records)) {
    this.totalStudents = this.records.length;
    let p = 0;
    let a = 0;
    let l = 0;
    for (const r of this.records) {
      const s = (r.status || '').toLowerCase();
      if (s === 'present') p++;
      else if (s === 'absent') a++;
      else if (s === 'late') l++;
    }
    this.presentCount = p;
    this.absentCount = a;
    this.lateCount = l;
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSessionSchema, 'attendance');
