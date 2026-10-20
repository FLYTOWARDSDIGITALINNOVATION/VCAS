const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    default: '',
    uppercase: true,
    trim: true,
    sparse: true
  },
  regNo: {
    type: String,
    default: '',
    uppercase: true,
    trim: true,
    sparse: true,
    index: true
  },
  admNo: {
    type: String,
    default: '',
    uppercase: true,
    trim: true,
    sparse: true
  },
  rollNo: {
    type: String,
    default: '',
    uppercase: true,
    trim: true
  },
  umisNumber: {
    type: String,
    default: '',
    uppercase: true,
    trim: true,
    sparse: true
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
    default: 'General',
    trim: true
  },
  course: {
    type: String,
    default: 'Undergraduate',
    trim: true
  },
  courseAdmitted: {
    type: String,
    default: '',
    trim: true
  },
  dateOfAdmission: {
    type: String,
    default: '',
    trim: true
  },
  nationalityReligion: {
    type: String,
    default: 'INDIAN & HINDU',
    trim: true
  },
  casteCommunity: {
    type: String,
    default: '',
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
    default: '2022-2026'
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
  regNo: {
    type: String,
    default: '',
    uppercase: true,
    trim: true,
    index: true
  },
  year: {
    type: String,
    default: '1st Year',
    trim: true
  },
  loginId: {
    type: String,
    default: '',
    trim: true
  },
  aadhaar: {
    type: String,
    default: '',
    trim: true
  },
  pan: {
    type: String,
    default: '',
    uppercase: true,
    trim: true
  },
  bankAccountNo: {
    type: String,
    default: '',
    trim: true
  },
  bankName: {
    type: String,
    default: '',
    trim: true
  },
  ifscCode: {
    type: String,
    default: '',
    uppercase: true,
    trim: true
  },
  bankBranch: {
    type: String,
    default: '',
    trim: true
  },
  drivingLicense: {
    type: String,
    default: '',
    uppercase: true,
    trim: true
  },
  emisNumber: {
    type: String,
    default: '',
    trim: true
  },
  tenthMarks: {
    type: String,
    default: '',
    trim: true
  },
  tenthPercentage: {
    type: String,
    default: '',
    trim: true
  },
  tenthBoard: {
    type: String,
    default: '',
    trim: true
  },
  twelfthMarks: {
    type: String,
    default: '',
    trim: true
  },
  twelfthPercentage: {
    type: String,
    default: '',
    trim: true
  },
  twelfthBoard: {
    type: String,
    default: '',
    trim: true
  },
  nationality: {
    type: String,
    default: 'Indian',
    trim: true
  },
  caste: {
    type: String,
    default: '',
    trim: true
  },
  religion: {
    type: String,
    default: 'Hindu',
    trim: true
  },
  donation: {
    type: String,
    default: 'Nil',
    trim: true
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
  },
  // Mentor Diary & Student Portfolio Statutory & Profile Fields
  courseDurationFrom: { type: String, default: '' },
  courseDurationTo: { type: String, default: '' },
  community: { type: String, default: 'BC' },
  communityCertNo: { type: String, default: '' },
  umisNumber: { type: String, default: '' },
  presentAddress: { type: String, default: '' },
  permanentAddress: { type: String, default: '' },
  residencePhone: { type: String, default: '' },
  officePhone: { type: String, default: '' },
  fatherQualification: { type: String, default: '' },
  fatherOccupation: { type: String, default: '' },
  motherQualification: { type: String, default: '' },
  motherOccupation: { type: String, default: '' },
  guardianName: { type: String, default: '' },
  guardianQualification: { type: String, default: '' },
  guardianOccupation: { type: String, default: '' },
  guardianPhone: { type: String, default: '' },
  annualIncome: { type: String, default: '' },
  incomeCertNo: { type: String, default: '' },
  localGuardianName: { type: String, default: '' },
  localGuardianRelationship: { type: String, default: '' },
  localGuardianAddress: { type: String, default: '' },
  localGuardianPhone: { type: String, default: '' },
  micrNo: { type: String, default: '' },
  sibling1Name: { type: String, default: '' },
  sibling1Age: { type: String, default: '' },
  sibling1Status: { type: String, default: '' },
  sibling2Name: { type: String, default: '' },
  sibling2Age: { type: String, default: '' },
  sibling2Status: { type: String, default: '' },
  sibling3Name: { type: String, default: '' },
  sibling3Age: { type: String, default: '' },
  sibling3Status: { type: String, default: '' },
  tenthInstitution: { type: String, default: '' },
  tenthPassingYear: { type: String, default: '' },
  twelfthInstitution: { type: String, default: '' },
  twelfthPassingYear: { type: String, default: '' },
  degreeMajor: { type: String, default: '' },
  degreeInstitution: { type: String, default: '' },
  degreePassingYear: { type: String, default: '' },
  degreeBoard: { type: String, default: '' },
  degreeMarks: { type: String, default: '' },
  nssNccOthers: { type: String, default: '' },
  sports: { type: String, default: '' },
  fineArts: { type: String, default: '' },
  aimInLife: { type: String, default: '' },
  hobbies: { type: String, default: '' },
  height: { type: String, default: '' },
  weight: { type: String, default: '' },
  idMark1: { type: String, default: '' },
  idMark2: { type: String, default: '' },
  healthProblemsAllergies: { type: String, default: '' },
  langTamilRead: { type: Boolean, default: false },
  langTamilWrite: { type: Boolean, default: false },
  langTamilSpeak: { type: Boolean, default: false },
  langTamilPercent: { type: String, default: '' },
  langEnglishRead: { type: Boolean, default: false },
  langEnglishWrite: { type: Boolean, default: false },
  langEnglishSpeak: { type: Boolean, default: false },
  langEnglishPercent: { type: String, default: '' },
  langOtherName: { type: String, default: '' },
  langOtherRead: { type: Boolean, default: false },
  langOtherWrite: { type: Boolean, default: false },
  langOtherSpeak: { type: Boolean, default: false },
  langOtherPercent: { type: String, default: '' },
  transportI_Bus: { type: String, default: 'No' },
  transportI_Own: { type: String, default: 'No' },
  transportI_Details: { type: String, default: '' },
  transportII_Bus: { type: String, default: 'No' },
  transportII_Own: { type: String, default: 'No' },
  transportII_Details: { type: String, default: '' },
  transportIII_Bus: { type: String, default: 'No' },
  transportIII_Own: { type: String, default: 'No' },
  transportIII_Details: { type: String, default: '' },
  mentorName: { type: String, default: '' },
  mentorDesignation: { type: String, default: '' },
  mentorDepartment: { type: String, default: '' },
  counsellingNotes: { type: String, default: '' },
  coCurricularActivities: { type: String, default: '' },
  extraCurricularProgrammes: { type: String, default: '' },
  valueAddedCourses: { type: String, default: '' },
  industrialVisits: { type: String, default: '' },
  disciplinaryActions: { type: String, default: '' },
  totalWorkingHours: { type: String, default: '' },
  hoursAbsent: { type: String, default: '' },
  totalArrearsTillLastSem: { type: String, default: '' },
  arrearsClearedThisSem: { type: String, default: '' },
  arrearsYetToBeCleared: { type: String, default: '' }
}, {
  timestamps: true,
  collection: 'students',
  strict: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure regNo, studentId, and admNo are always synced and never null
studentSchema.pre('validate', function(next) {
  const primaryId = this.regNo || this.studentId || this.admNo;
  if (primaryId) {
    if (!this.regNo) this.regNo = primaryId;
    if (!this.studentId) this.studentId = primaryId;
    if (!this.admNo) this.admNo = primaryId;
  }
  next();
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

studentSchema.virtual('registerNo').get(function () {
  return this.regNo || this.studentId;
}).set(function (v) {
  this.regNo = v;
});

module.exports = mongoose.model('Student', studentSchema, 'students');
