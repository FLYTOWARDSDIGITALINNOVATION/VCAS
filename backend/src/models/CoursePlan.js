const mongoose = require('mongoose');

const topicEntrySchema = new mongoose.Schema({
  sNo:            { type: Number, default: 1 },
  plannedDate:    { type: String, default: '' },
  noOfHours:      { type: Number, default: 1 },
  topic:          { type: String, required: true },
  executionDate:  { type: String, default: '' },
  executionHours: { type: Number, default: 0 },
  deviation:      { type: String, default: '' },
  sign:           { type: String, default: 'Pending' }
}, { _id: true });

const coursePlanSchema = new mongoose.Schema({
  staffId:      { type: String, required: true },
  staffName:    { type: String, default: '' },
  department:   { type: String, default: '' },
  subjectName:  { type: String, required: true },
  subjectCode:  { type: String, default: '' },
  academicYear: { type: String, default: '2026-2027' },
  yearSemester: { type: String, default: 'I / I' },
  topics:       [topicEntrySchema]
}, { timestamps: true });

module.exports = mongoose.model('CoursePlan', coursePlanSchema);
