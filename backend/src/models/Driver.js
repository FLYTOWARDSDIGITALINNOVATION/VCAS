const mongoose = require('mongoose');

const dailyRecordSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  driverName: {
    type: String,
    required: true,
    trim: true
  },
  busNo: {
    type: String,
    default: '',
    trim: true
  },
  mileage: {
    type: Number,
    default: 0
  },
  petrolCharge: {
    type: Number,
    default: 0
  },
  remarks: {
    type: String,
    default: '',
    trim: true
  },
  addedBy: {
    type: String,
    default: '',
    trim: true
  }
}, { _id: true, timestamps: true });

const driverSchema = new mongoose.Schema({
  driverName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    default: '',
    trim: true
  },
  address: {
    type: String,
    default: '',
    trim: true
  },
  aadharNumber: {
    type: String,
    default: '',
    trim: true
  },
  panNumber: {
    type: String,
    default: '',
    trim: true
  },
  aadharDocument: {
    type: String,
    default: ''
  },
  panDocument: {
    type: String,
    default: ''
  },
  drivingLicenseDocument: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'Active',
    enum: ['Active', 'Inactive', 'On Leave']
  },
  dailyRecords: [dailyRecordSchema]
}, {
  timestamps: true,
  collection: 'drivers'
});

module.exports = mongoose.model('Driver', driverSchema, 'drivers');
