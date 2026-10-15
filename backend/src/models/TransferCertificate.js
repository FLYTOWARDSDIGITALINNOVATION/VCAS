const mongoose = require('mongoose');

const transferCertificateSchema = new mongoose.Schema({
  tcNumber: {
    type: String,
    required: [true, 'TC Number is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  regNo: {
    type: String,
    required: [true, 'Register Number is required'],
    uppercase: true,
    trim: true,
    index: true
  },
  studentName: {
    type: String,
    required: [true, 'Student Name is required'],
    trim: true
  },
  photo: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    default: 'Male',
    trim: true
  },
  dob: {
    type: String,
    default: '',
    trim: true
  },
  dobWords: {
    type: String,
    default: '',
    trim: true
  },
  fatherName: {
    type: String,
    default: '',
    trim: true
  },
  nationality: {
    type: String,
    default: 'Indian',
    trim: true
  },
  religion: {
    type: String,
    default: 'Hindu',
    trim: true
  },
  casteCommunity: {
    type: String,
    default: '',
    trim: true
  },
  dateOfAdmission: {
    type: String,
    default: '',
    trim: true
  },
  courseAdmitted: {
    type: String,
    default: '',
    trim: true
  },
  subjectStudiedPart1: {
    type: String,
    default: '',
    trim: true
  },
  subjectStudiedPart2: {
    type: String,
    default: '',
    trim: true
  },
  subjectStudiedPart3: {
    type: String,
    default: '',
    trim: true
  },
  mediumOfInstruction: {
    type: String,
    default: 'English',
    trim: true
  },
  classAtLeaving: {
    type: String,
    default: '',
    trim: true
  },
  qualifiedForPromotion: {
    type: String,
    default: 'Yes',
    trim: true
  },
  idMark1: {
    type: String,
    default: '',
    trim: true
  },
  idMark2: {
    type: String,
    default: '',
    trim: true
  },
  tcDate: {
    type: String,
    default: '',
    trim: true
  },
  conduct: {
    type: String,
    default: 'Good',
    trim: true
  },
  collegeSeal: {
    type: String,
    default: ''
  },
  principalSignature: {
    type: String,
    default: ''
  },
  studentSignature: {
    type: String,
    default: ''
  },
  parentSignature: {
    type: String,
    default: ''
  },
  declarationText: {
    type: String,
    default: 'I hereby declare that the particulars recorded above are correct and no change will be demanded in future.'
  },
  status: {
    type: String,
    enum: ['Draft', 'Issued'],
    default: 'Draft',
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: null
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'transfer_certificates'
});

module.exports = mongoose.model('TransferCertificate', transferCertificateSchema);
