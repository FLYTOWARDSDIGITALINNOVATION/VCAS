const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  unit: { type: String, default: '' },
  title: { type: String, default: '' },
  hours: { type: Number, default: 9 }
}, { _id: false });

const subjectSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  year: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  sem: {
    type: String,
    default: 'Sem 1',
    trim: true
  },
  credits: {
    type: Number,
    default: 3,
    min: 1,
    max: 10
  },
  type: {
    type: String,
    default: 'Core Theory',
    trim: true
  },
  faculty: {
    type: String,
    default: '',
    trim: true
  },
  ltp: {
    type: String,
    default: '3-0-0',
    trim: true
  },
  hours: {
    type: String,
    default: '3 hrs/wk',
    trim: true
  },
  prerequisite: {
    type: String,
    default: 'None',
    trim: true
  },
  textbooks: {
    type: String,
    default: '',
    trim: true
  },
  studentsEnrolled: {
    type: Number,
    default: 0
  },
  units: [unitSchema],
  evaluation: {
    internal: { type: Number, default: 40 },
    external: { type: Number, default: 60 }
  }
}, {
  timestamps: true,
  collection: 'subjects',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

subjectSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Subject', subjectSchema, 'subjects');
