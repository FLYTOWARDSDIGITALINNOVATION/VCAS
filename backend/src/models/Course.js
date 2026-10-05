const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Course / Program code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Course / Program name is required'],
    trim: true
  },
  degreeLevel: {
    type: String,
    default: 'Undergraduate (UG)',
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  regulation: {
    type: String,
    default: 'Regulation 2024 (R24)',
    trim: true
  },
  durationYears: {
    type: Number,
    default: 3,
    min: 1,
    max: 6
  },
  totalSemesters: {
    type: Number,
    default: 6
  },
  totalCredits: {
    type: Number,
    default: 140
  },
  enrolledStudents: {
    type: Number,
    default: 0
  },
  totalSubjects: {
    type: Number,
    default: 0
  },
  coordinator: {
    type: String,
    default: '',
    trim: true
  },
  coordinatorEmail: {
    type: String,
    default: '',
    lowercase: true,
    trim: true
  },
  establishedYear: {
    type: String,
    default: () => new Date().getFullYear().toString(),
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true,
  collection: 'courses',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

courseSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Course', courseSchema, 'courses');
