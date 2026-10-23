const mongoose = require('mongoose');

const bonafideCertificateSchema = new mongoose.Schema({
  refNo: {
    type: String,
    required: [true, 'Reference Number is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  date: {
    type: String,
    required: true,
    default: () => {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }
  },
  rollNo: {
    type: String,
    default: '',
    uppercase: true,
    trim: true
  },
  regNo: {
    type: String,
    default: '',
    uppercase: true,
    trim: true
  },
  studentName: {
    type: String,
    required: [true, 'Student Name is required'],
    trim: true
  },
  gender: {
    type: String,
    default: 'Female',
    enum: ['Female', 'Male', 'Other']
  },
  prefix: {
    type: String,
    default: 'Ms.' // 'Ms.' or 'Mr.'
  },
  parentRelation: {
    type: String,
    default: 'D/o' // 'D/o' or 'S/o'
  },
  parentName: {
    type: String,
    required: [true, 'Parent Name is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  year: {
    type: String,
    default: 'I Year'
  },
  course: {
    type: String,
    required: [true, 'Course / Programme is required'],
    trim: true
  },
  department: {
    type: String,
    default: 'Computer Science',
    trim: true
  },
  academicYear: {
    type: String,
    default: '2026–2027',
    trim: true
  },
  conduct: {
    type: String,
    default: 'Her conduct and character are good.'
  },
  purpose: {
    type: String,
    required: [true, 'Purpose is required'],
    default: 'applying scholarship under Beedi Workers scheme',
    trim: true
  },
  issuedBy: {
    type: String,
    default: 'Accountant'
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Issued', 'Cancelled'],
    default: 'Issued'
  }
}, { timestamps: true });

module.exports = mongoose.model('BonafideCertificate', bonafideCertificateSchema);
