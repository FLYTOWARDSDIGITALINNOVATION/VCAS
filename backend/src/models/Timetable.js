const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  staffName: {
    type: String,
    default: '',
    trim: true
  },
  department: {
    type: String,
    default: '',
    trim: true
  },
  academicYear: {
    type: String,
    default: '2025-2026',
    trim: true
  },
  schedule: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({
      Monday: {},
      Tuesday: {},
      Wednesday: {},
      Thursday: {},
      Friday: {},
      Saturday: {}
    })
  }
}, {
  timestamps: true,
  collection: 'timetable'
});

module.exports = mongoose.model('Timetable', timetableSchema, 'timetable');
