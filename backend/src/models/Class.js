const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  rollNo:  { type: String, required: true, uppercase: true, trim: true },
  name:    { type: String, required: true, trim: true },
  phone:   { type: String, default: '', trim: true },
  email:   { type: String, default: '', lowercase: true, trim: true },
  present: { type: Boolean, default: true }
}, { _id: true, timestamps: true });

const classSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Class / Subject code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Class / Subject name is required'],
    trim: true
  },
  dept: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 10
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 1,
    max: 5
  },
  section: {
    type: String,
    default: 'A',
    uppercase: true,
    trim: true
  },
  credits: {
    type: Number,
    default: 3,
    min: 1,
    max: 10
  },
  staffId: {
    type: String,
    required: [true, 'Assigned staff ID is required'],
    trim: true,
    index: true
  },
  staffName: {
    type: String,
    default: '',
    trim: true
  },
  room: {
    type: String,
    default: '',
    trim: true
  },
  academicYear: {
    type: String,
    default: '2025-2026',
    trim: true
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  students: [studentSchema]
}, {
  timestamps: true,
  collection: 'class', // Exact match for Atlas collection
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual aliases for compatibility
classSchema.virtual('classCode').get(function () {
  return this.code;
}).set(function (v) {
  this.code = v;
});

classSchema.virtual('className').get(function () {
  return this.name;
}).set(function (v) {
  this.name = v;
});

classSchema.virtual('department').get(function () {
  return this.dept;
}).set(function (v) {
  this.dept = v;
});

classSchema.virtual('enrolledStudents').get(function () {
  return this.students;
}).set(function (v) {
  this.students = v;
});

// Auto-update totalStudents count before saving
classSchema.pre('save', function (next) {
  if (this.students && Array.isArray(this.students)) {
    this.totalStudents = this.students.length;
  }
  next();
});

module.exports = mongoose.model('Class', classSchema, 'class');
