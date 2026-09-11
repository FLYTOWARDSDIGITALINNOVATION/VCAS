const mongoose = require('mongoose');

// Per-student marks record
const studentMarkSchema = new mongoose.Schema({
  rollNo:       { type: String, required: true },
  name:         { type: String, required: true },
  cia1:         { type: mongoose.Schema.Types.Mixed, default: null }, // Number or 'A'
  cia2:         { type: mongoose.Schema.Types.Mixed, default: null },
  model:        { type: mongoose.Schema.Types.Mixed, default: null },
  assignment:   { type: Number, default: null },
  attendance:   { type: Number, default: null },
  consolidated: { type: Number, default: null },
}, { _id: false });

const internalMarksSchema = new mongoose.Schema({
  staffId:      { type: String, required: true },
  staffName:    { type: String, default: '' },
  subjectCode:  { type: String, required: true },
  subjectName:  { type: String, default: '' },
  department:   { type: String, default: '' },
  semester:     { type: Number, default: 1 },
  academicYear: { type: String, default: '' },
  isLocked:     { type: Boolean, default: false },
  lockedAt:     { type: Date, default: null },
  students:     [studentMarkSchema],
}, { timestamps: true, collection: 'InternalMarks' });

// One record per staff + subject combination
internalMarksSchema.index({ staffId: 1, subjectCode: 1 }, { unique: true });

module.exports = mongoose.model('InternalMarks', internalMarksSchema, 'InternalMarks');
