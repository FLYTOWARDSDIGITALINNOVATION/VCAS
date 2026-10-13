const mongoose = require('mongoose');

const feeClusterSchema = new mongoose.Schema({
  cluster: {
    type: String,
    required: true,
    trim: true
  },
  departments: [{
    type: String,
    trim: true
  }],
  deptNames: [{
    type: String,
    trim: true
  }],
  registrationFee: {
    type: Number,
    required: true,
    default: 0
  },
  sem1Fee: {
    type: Number,
    required: true,
    default: 0
  },
  sem2Fee: {
    type: Number,
    required: true,
    default: 0
  },
  totalAnnualFee: {
    type: Number,
    required: true,
    default: 0
  },
  color: {
    type: String,
    default: 'from-blue-600 to-indigo-600'
  },
  borderColor: {
    type: String,
    default: 'border-blue-200'
  },
  bgColor: {
    type: String,
    default: 'bg-blue-50/50'
  },
  badge: {
    type: String,
    default: ''
  }
}, { _id: true });

const scholarshipSlabSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  criteria: {
    type: String,
    required: true
  },
  detail: {
    type: String,
    default: ''
  },
  discountPercent: {
    type: Number,
    default: null
  },
  sem1: {
    type: Number,
    default: null
  },
  sem2: {
    type: Number,
    default: null
  },
  sem1Display: {
    type: String,
    default: ''
  },
  sem2Display: {
    type: String,
    default: ''
  },
  savings: {
    type: mongoose.Schema.Types.Mixed,
    default: 0
  },
  badgeColor: {
    type: String,
    default: 'bg-blue-100 text-blue-800 border-blue-300'
  }
}, { _id: true });

const feeStructureSchema = new mongoose.Schema({
  academicYear: {
    type: String,
    default: '2025–2026',
    trim: true
  },
  clusters: [feeClusterSchema],
  scholarships: [scholarshipSlabSchema],
  lastUpdatedBy: {
    type: String,
    default: 'Super Admin'
  },
  lastUpdatedRole: {
    type: String,
    default: 'Super Admin'
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
