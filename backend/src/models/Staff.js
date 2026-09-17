const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

const achievementSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  category:    { type: String, default: 'Award', enum: ['Award', 'Certification', 'Publication', 'Conference', 'Research', 'Other'] },
  year:        { type: String, default: '' },
  issuedBy:    { type: String, default: '', trim: true },
  description: { type: String, default: '', trim: true }
}, { _id: true, timestamps: true });

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
  classes:            [classSubjectSchema],
  achievements:       [achievementSchema]
}, {
  timestamps: true,
  collection: 'Staff'
});

// Hash password with bcrypt before saving if modified
staffSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // If already hashed (e.g. bcrypt prefix $2a$ or $2b$), skip
  if (this.password && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$'))) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password supporting both hashed and legacy unhashed passwords
staffSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password || !enteredPassword) return false;
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return await bcrypt.compare(enteredPassword, this.password);
  }
  return this.password === enteredPassword;
};

module.exports = mongoose.model('Staff', staffSchema, 'Staff');
