const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Subject/Course code is required'],
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Subject/Exam title is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  year: {
    type: Number,
    default: 1
  },
  sem: {
    type: String,
    default: 'Sem 1',
    trim: true
  },
  date: {
    type: String,
    required: [true, 'Exam date is required'],
    trim: true
  },
  session: {
    type: String,
    default: 'Forenoon (FN)',
    trim: true
  },
  hall: {
    type: String,
    default: 'Hall 101 (Main Block)',
    trim: true
  },
  qpCode: {
    type: String,
    default: '',
    trim: true
  },
  invigilator: {
    type: String,
    default: 'Assigned Faculty',
    trim: true
  },
  invigilatorDept: {
    type: String,
    default: '',
    trim: true
  },
  totalStudents: {
    type: Number,
    default: 60
  },
  type: {
    type: String,
    enum: ['End Semester Theory', 'Continuous Internal Assessment (CIA)', 'Practical Lab Examination', 'Supplementary / Arrear'],
    default: 'End Semester Theory'
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Postponed'],
    default: 'Scheduled'
  },
  maxMarks: {
    type: Number,
    default: 100
  },
  ciaMax: {
    type: Number,
    default: 40
  },
  eseMax: {
    type: Number,
    default: 60
  }
}, {
  timestamps: true,
  collection: 'exams'
});

const examHallSchema = new mongoose.Schema({
  hallName: {
    type: String,
    required: [true, 'Hall name is required'],
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    default: 50
  },
  allocatedStudents: {
    type: Number,
    default: 0
  },
  departments: {
    type: String,
    default: '',
    trim: true
  },
  rollRange: {
    type: String,
    default: '',
    trim: true
  },
  invigilator: {
    type: String,
    default: '',
    trim: true
  },
  invigilatorDept: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    default: 'Available',
    trim: true
  },
  allocatedSubjects: {
    type: Array,
    default: []
  }
}, {
  timestamps: true,
  collection: 'exam_halls'
});

const Exam = mongoose.model('Exam', examSchema);
const ExamHall = mongoose.model('ExamHall', examHallSchema);

module.exports = { Exam, ExamHall };
