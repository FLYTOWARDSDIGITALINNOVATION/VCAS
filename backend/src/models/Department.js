const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  credits: { type: Number, default: 3 },
  year: { type: Number, default: 1 },
  sem: { type: String, default: 'Sem 1' }
}, { _id: false });

const yearBreakdownSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  label: { type: String, default: '' },
  students: { type: Number, default: 0 },
  semesters: [{ type: String }]
}, { _id: false });

const departmentSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true
  },
  hod: {
    type: String,
    default: '',
    trim: true
  },
  hodEmail: {
    type: String,
    default: '',
    lowercase: true,
    trim: true
  },
  hodPhone: {
    type: String,
    default: '',
    trim: true
  },
  totalYears: {
    type: Number,
    default: 3,
    min: 1,
    max: 6
  },
  totalSemesters: {
    type: Number,
    default: 6,
    min: 1,
    max: 12
  },
  facultyCount: {
    type: Number,
    default: 0,
    min: 0
  },
  studentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  courseCount: {
    type: Number,
    default: 0,
    min: 0
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
  },
  labs: [{
    type: String,
    trim: true
  }],
  yearBreakdown: [yearBreakdownSchema],
  coursesList: [courseSchema]
}, {
  timestamps: true,
  collection: 'departments',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual alias
departmentSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Department', departmentSchema, 'departments');
