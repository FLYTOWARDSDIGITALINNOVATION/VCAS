const mongoose = require('mongoose');

const leaveApprovalTierSchema = new mongoose.Schema({
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
  approvedBy: { type: String, default: '' },
  approvedAt: { type: Date },
  remarks: { type: String, default: '' }
}, { _id: false });

const leaveSchema = new mongoose.Schema({
  staffId:     { type: String, required: true, trim: true, index: true },
  staffName:   { type: String, default: '', trim: true },
  department:  { type: String, default: '', trim: true },
  leaveType:   { 
    type: String, 
    enum: ['Casual Leave', 'Medical Leave', 'On Duty', 'Special Casual Leave'], 
    default: 'Casual Leave' 
  },
  fromDate:    { type: String, required: true, trim: true },
  toDate:      { type: String, required: true, trim: true },
  days:        { type: Number, required: true, default: 1 },
  reason:      { type: String, required: true, trim: true },
  status:      { 
    type: String, 
    default: 'Pending HOD',
    index: true
  },
  currentStage: {
    type: String,
    enum: ['HOD', 'Principal', 'MD', 'Completed', 'Rejected'],
    default: 'HOD'
  },
  hodApproval: {
    type: leaveApprovalTierSchema,
    default: () => ({ status: 'Pending', approvedBy: '', remarks: '' })
  },
  principalApproval: {
    type: leaveApprovalTierSchema,
    default: () => ({ status: 'Pending', approvedBy: '', remarks: '' })
  },
  mdApproval: {
    type: leaveApprovalTierSchema,
    default: () => ({ status: 'Pending', approvedBy: '', remarks: '' })
  },
  approvedBy:  { type: String, default: '-' },
  remarks:     { type: String, default: '' }
}, {
  timestamps: true,
  collection: 'Leaves'
});

module.exports = mongoose.model('Leave', leaveSchema, 'Leaves');
