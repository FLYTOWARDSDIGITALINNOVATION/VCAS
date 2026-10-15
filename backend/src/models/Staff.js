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

const qualificationItemSchema = new mongoose.Schema({
  degree:          { type: String, default: '' },
  specialization:  { type: String, default: '' },
  institution:     { type: String, default: '' },
  mode:            { type: String, default: 'Full time' },
  marksOrCgpa:     { type: String, default: '' },
  yearOfPassing:   { type: String, default: '' }
}, { _id: false });

const experienceItemSchema = new mongoose.Schema({
  sNo:             { type: Number },
  institution:     { type: String, default: '' },
  designation:     { type: String, default: '' },
  fromDate:        { type: String, default: '' },
  toDate:          { type: String, default: '' },
  duration:        { type: String, default: '' }
}, { _id: false });

const projectFundSchema = new mongoose.Schema({
  agency:          { type: String, default: '' },
  amountLakhs:     { type: String, default: '' },
  scheme:          { type: String, default: '' },
  title:           { type: String, default: '' },
  duration:        { type: String, default: '' }
}, { _id: false });

const referenceSchema = new mongoose.Schema({
  name:            { type: String, default: '' },
  designation:     { type: String, default: '' },
  institution:     { type: String, default: '' },
  contactNo:       { type: String, default: '' },
  email:           { type: String, default: '' }
}, { _id: false });

const staffSchema = new mongoose.Schema({
  staffId:            { type: String, required: true, unique: true, trim: true },
  name:               { type: String, required: true, trim: true },
  email:              { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:           { type: String, default: 'vcas@2026' },
  phone:              { type: String, default: '' },
  department:         { type: String, required: true, trim: true },
  designation:        { type: String, default: 'Assistant Professor' },
  role:               { type: String, default: 'Staff', enum: ['Staff', 'Accountant', 'Office Staff'] },
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
  profileImage:       { type: String, default: '' },
  classTeacherOf:     { type: String, default: '' },
  isProfileCompleted: { type: Boolean, default: false },
  netSetExamStatus:      { type: String, default: 'Not Applicable' },
  netSetExamCertificate: { type: String, default: '' },
  netSetCertificateName: { type: String, default: '' },
  aadhaar:            { type: String, default: '', trim: true },
  pan:                { type: String, default: '', uppercase: true, trim: true },
  bankAccountNo:      { type: String, default: '', trim: true },
  bankName:           { type: String, default: '', trim: true },
  ifscCode:           { type: String, default: '', uppercase: true, trim: true },
  bankBranch:         { type: String, default: '', trim: true },

  // College Application Form Details (Matching Official 2-Page Paper Form)
  postAppliedFor:         { type: String, default: '' },
  age:                    { type: String, default: '' },
  gender:                 { type: String, default: 'Male' },
  maritalStatus:          { type: String, default: 'Single' },
  fatherOrSpouseName:     { type: String, default: '' },
  nationality:            { type: String, default: 'Indian' },
  religion:               { type: String, default: 'Hindu' },
  community:              { type: String, default: 'BC' },
  caste:                  { type: String, default: '' },
  permanentAddress:       { type: String, default: '' },
  communicationAddress:   { type: String, default: '' },
  whatsapp:               { type: String, default: '' },

  academicQualifications: [qualificationItemSchema],
  experienceDetails:      [experienceItemSchema],

  publications: {
    nationalConferences:      { type: Number, default: 0 },
    nationalJournals:         { type: Number, default: 0 },
    internationalConferences: { type: Number, default: 0 },
    internationalJournals:    { type: Number, default: 0 },
    patentsFiled:             { type: String, default: '' },
    patentsGranted:           { type: String, default: '' }
  },

  programmes: {
    organizedConferences:     { type: Number, default: 0 },
    organizedWorkshops:       { type: Number, default: 0 },
    organizedFdp:             { type: Number, default: 0 },
    attendedConferences:      { type: Number, default: 0 },
    attendedWorkshops:        { type: Number, default: 0 },
    attendedFdp:              { type: Number, default: 0 }
  },

  projectFunds:           [projectFundSchema],
  otherInformation:       { type: String, default: '' },
  references:             [referenceSchema],

  payExpected:                { type: String, default: '' },
  payLastObtained:            { type: String, default: '' },
  lastPayCertificate:         { type: String, default: '' },
  place:                      { type: String, default: 'Tenkasi' },
  applicationDate:            { type: String, default: '' },
  educationalCertificatesDoc: { type: String, default: '' },
  experienceCertificatesDoc:  { type: String, default: '' },

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
