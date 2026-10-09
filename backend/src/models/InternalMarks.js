const mongoose = require('mongoose');

// Per-student marks record matching official college marksheet register
const studentMarkSchema = new mongoose.Schema({
  rollNo:       { type: String, required: true },
  name:         { type: String, required: true },
  // SNAP TEST (ST1, ST2, ST3, ST4)
  st1:          { type: mongoose.Schema.Types.Mixed, default: null }, // Number or 'AB' / 'A'
  st2:          { type: mongoose.Schema.Types.Mixed, default: null },
  st3:          { type: mongoose.Schema.Types.Mixed, default: null },
  st4:          { type: mongoose.Schema.Types.Mixed, default: null },
  // INTERNAL (IT1, IT2)
  it1:          { type: mongoose.Schema.Types.Mixed, default: null },
  it2:          { type: mongoose.Schema.Types.Mixed, default: null },
  cia1:         { type: mongoose.Schema.Types.Mixed, default: null },
  cia2:         { type: mongoose.Schema.Types.Mixed, default: null },
  // MODEL (Model Examination)
  model:        { type: mongoose.Schema.Types.Mixed, default: null },
  // PROJECT / SEMINAR
  project:      { type: mongoose.Schema.Types.Mixed, default: null },
  // ASSIGNMENT (1, 2, 3, 4)
  assignment1:  { type: mongoose.Schema.Types.Mixed, default: null },
  assignment2:  { type: mongoose.Schema.Types.Mixed, default: null },
  assignment3:  { type: mongoose.Schema.Types.Mixed, default: null },
  assignment4:  { type: mongoose.Schema.Types.Mixed, default: null },
  // Legacy / Consolidated fields
  assignment:   { type: mongoose.Schema.Types.Mixed, default: null },
  attendance:   { type: mongoose.Schema.Types.Mixed, default: null },
  consolidated: { type: mongoose.Schema.Types.Mixed, default: null },
}, { _id: false, strict: false });

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
  maxMarks: {
    st1:          { type: Number, default: 20 },
    st2:          { type: Number, default: 20 },
    st3:          { type: Number, default: 20 },
    st4:          { type: Number, default: 20 },
    it1:          { type: Number, default: 25 },
    it2:          { type: Number, default: 25 },
    cia1:         { type: Number, default: 50 },
    cia2:         { type: Number, default: 50 },
    model:        { type: Number, default: 75 },
    project:      { type: Number, default: 20 },
    assignment1:  { type: Number, default: 5 },
    assignment2:  { type: Number, default: 5 },
    assignment3:  { type: Number, default: 5 },
    assignment4:  { type: Number, default: 5 },
    assignment:   { type: Number, default: 20 },
    attendance:   { type: Number, default: 5 },
    consolidated: { type: Number, default: 25 },
  },
  passMarks: {
    st1:          { type: Number, default: 8 },
    st2:          { type: Number, default: 8 },
    st3:          { type: Number, default: 8 },
    st4:          { type: Number, default: 8 },
    it1:          { type: Number, default: 10 },
    it2:          { type: Number, default: 10 },
    cia1:         { type: Number, default: 20 },
    cia2:         { type: Number, default: 20 },
    model:        { type: Number, default: 30 },
    project:      { type: Number, default: 8 },
    assignment1:  { type: Number, default: 2 },
    assignment2:  { type: Number, default: 2 },
    assignment3:  { type: Number, default: 2 },
    assignment4:  { type: Number, default: 2 },
    assignment:   { type: Number, default: 8 },
    attendance:   { type: Number, default: 2 },
    consolidated: { type: Number, default: 10 },
  },
  students:     [studentMarkSchema],
}, { timestamps: true, collection: 'InternalMarks' });

// One record per staff + subject combination
internalMarksSchema.index({ staffId: 1, subjectCode: 1 }, { unique: true });

module.exports = mongoose.model('InternalMarks', internalMarksSchema, 'InternalMarks');
