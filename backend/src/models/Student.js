const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  admNo: {
    type: String,
    required: [true, 'Admission number is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  rollNo: {
    type: String,
    default: '',
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  sem: {
    type: String,
    default: '1st Sem',
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  course: {
    type: String,
    required: [true, 'Course is required'],
    trim: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  email: {
    type: String,
    default: '',
    lowercase: true,
    trim: true
  },
  attendance: {
    type: Number,
    default: 85,
    min: 0,
    max: 100
  },
  feeStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Partial', 'Overdue'],
    default: 'Pending'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  gender: {
    type: String,
    default: 'Male'
  },
  dob: {
    type: String,
    default: ''
  },
  bloodGroup: {
    type: String,
    default: 'O+'
  },
  address: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  pinCode: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: 'India'
  },
  batch: {
    type: String,
    default: '2024-2027'
  },
  academicYear: {
    type: String,
    default: '2025-2026'
  },
  section: {
    type: String,
    default: 'A'
  },
  cgpa: {
    type: String,
    default: '8.0'
  },
  rank: {
    type: String,
    default: ''
  },
  fatherName: {
    type: String,
    default: ''
  },
  motherName: {
    type: String,
    default: ''
  },
  fatherMobile: {
    type: String,
    default: ''
  },
  motherMobile: {
    type: String,
    default: ''
  },
  parentOccupation: {
    type: String,
    default: ''
  },
  parentEmail: {
    type: String,
    default: ''
  },
  emergencyContact: {
    type: String,
    default: ''
  },
  doc10th: {
    type: String,
    default: ''
  },
  doc12th: {
    type: String,
    default: ''
  },
  docTc: {
    type: String,
    default: ''
  },
  docAadhaar: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'students',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual aliases for frontend compatibility
studentSchema.virtual('id').get(function () {
  return this.studentId;
}).set(function (v) {
  this.studentId = v;
});

studentSchema.virtual('admissionNo').get(function () {
  return this.admNo;
}).set(function (v) {
  this.admNo = v;
});

studentSchema.virtual('fullName').get(function () {
  return this.name;
}).set(function (v) {
  this.name = v;
});

studentSchema.virtual('mobile').get(function () {
  return this.phone;
}).set(function (v) {
  this.phone = v;
});

studentSchema.virtual('semester').get(function () {
  return this.sem;
}).set(function (v) {
  this.sem = v;
});

module.exports = mongoose.model('Student', studentSchema, 'students');
