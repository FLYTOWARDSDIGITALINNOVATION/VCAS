const mongoose = require('mongoose');

const staffOverrideSchema = new mongoose.Schema({
  staffId: { type: String, required: true, trim: true },
  staffName: { type: String, default: '' },
  annualQuota: { type: Number, required: true },
  casualLeaves: { type: Number, default: 0 },
  specialCasualLeaves: { type: Number, default: 0 },
  medicalLeaves: { type: Number, default: 0 },
  notes: { type: String, default: '' }
}, { _id: false });

const leavePolicySchema = new mongoose.Schema({
  policyName: { 
    type: String, 
    default: 'Faculty Annual Leave Policy',
    trim: true 
  },
  academicYear: { 
    type: String, 
    default: '2025-2026', 
    trim: true 
  },
  annualQuota: { 
    type: Number, 
    required: true, 
    default: 15 
  },
  casualLeaves: { 
    type: Number, 
    required: true, 
    default: 12 
  },
  specialCasualLeaves: { 
    type: Number, 
    required: true, 
    default: 3 
  },
  medicalLeaves: { 
    type: Number, 
    default: 5 
  },
  onDutyLeaves: { 
    type: Number, 
    default: 5 
  },
  description: { 
    type: String, 
    default: '12 Casual + 3 Special',
    trim: true 
  },
  staffOverrides: [staffOverrideSchema],
  updatedBy: {
    type: String,
    default: 'Admin'
  }
}, {
  timestamps: true,
  collection: 'LeavePolicies'
});

module.exports = mongoose.model('LeavePolicy', leavePolicySchema, 'LeavePolicies');
