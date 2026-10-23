const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Events & Functions',
      'Student Supplies & Welfare',
      'Sports & Culturals',
      'Books & Stationery',
      'Lab & Equipment',
      'Refreshments & Food',
      'Maintenance & Operations',
      'Miscellaneous'
    ],
    default: 'Events & Functions'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  spentBy: {
    type: String,
    trim: true,
    default: 'Office Staff'
  },
  department: {
    type: String,
    trim: true,
    default: 'General'
  },
  recordedBy: {
    type: String,
    trim: true,
    default: 'Accountant'
  },
  recordedByRole: {
    type: String,
    trim: true,
    default: 'Office Staff'
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque'],
    default: 'Cash'
  },
  receiptNo: {
    type: String,
    trim: true,
    default: ''
  },
  vendor: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Paid', 'Pending Approval', 'Approved'],
    default: 'Paid'
  },
  academicYear: {
    type: String,
    default: '2025–2026'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
