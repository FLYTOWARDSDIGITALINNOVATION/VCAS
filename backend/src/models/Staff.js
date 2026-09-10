const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  rollNo:  { type: String, required: true },
  name:    { type: String, required: true },
  phone:   { type: String, default: '' },
  present: { type: Boolean, default: true }
}, { _id: true });

const classSubjectSchema = new mongoose.Schema({
  code:             { type: String, required: true },
  name:             { type: String, required: true },
  dept:             { type: String, required: true },
  semester:         { type: Number, required: true },
  year:             { type: Number, required: true },
  section:          { type: String, default: 'A' },
  credits:          { type: Number, default: 3 },
  totalStudents:    { type: Number, default: 0 },
  enrolledStudents: [studentSchema]
}, { _id: true });

const staffSchema = new mongoose.Schema({
  staffId:            { type: String, required: true, unique: true, trim: true },
  name:               { type: String, required: true, trim: true },
  email:              { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:           { type: String, default: 'vcas@2026' },
  phone:              { type: String, default: '' },
  department:         { type: String, required: true, trim: true },
  designation:        { type: String, default: 'Assistant Professor' },
  employmentType:     { type: String, default: 'Permanent / Full-Time' },
  status:             { type: String, default: 'Active' },
  joiningDate:        { type: String, default: '' },
  qualification:      { type: String, default: '' },
  experience:         { type: String, default: '' },
  bloodGroup:         { type: String, default: 'O+' },
  dob:                { type: String, default: '' },
  address:            { type: String, default: '' },
  emergencyContact:   { type: String, default: '' },
  avatarBg:           { type: String, default: 'bg-purple-600' },
  avatarText:         { type: String, default: '' },
  classTeacherOf:     { type: String, default: '' },
  isProfileCompleted: { type: Boolean, default: false },
  classes:            [classSubjectSchema]
}, {
  timestamps: true,
  collection: 'Staff'
});

module.exports = mongoose.model('Staff', staffSchema, 'Staff');
