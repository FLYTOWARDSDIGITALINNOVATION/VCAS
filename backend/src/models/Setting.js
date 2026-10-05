const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Institutional Profile
  collegeName: {
    type: String,
    default: 'Vidyapeeth College of Arts and Sciences',
    trim: true
  },
  collegeCode: {
    type: String,
    default: 'VCAS-2008',
    trim: true
  },
  accreditation: {
    type: String,
    default: 'NAAC A++ Grade (CGPA 3.82) | Autonomous',
    trim: true
  },
  affiliation: {
    type: String,
    default: 'State Technical & Arts University',
    trim: true
  },
  address: {
    type: String,
    default: '42, Vidyapeeth Knowledge Corridor, Chennai Highway',
    trim: true
  },
  city: {
    type: String,
    default: 'Chennai',
    trim: true
  },
  state: {
    type: String,
    default: 'Tamil Nadu',
    trim: true
  },
  pincode: {
    type: String,
    default: '600044',
    trim: true
  },
  officialEmail: {
    type: String,
    default: 'registrar@vcas.edu',
    trim: true
  },
  helpdeskPhone: {
    type: String,
    default: '+91 44 2855 1200',
    trim: true
  },
  websiteUrl: {
    type: String,
    default: 'https://vcas.edu.in',
    trim: true
  },
  currentAcademicYear: {
    type: String,
    default: '2025-2026',
    trim: true
  },
  currentSemesterCycle: {
    type: String,
    default: 'Even Semester (Sem 2, 4, 6, 8)',
    trim: true
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata (IST +5:30)',
    trim: true
  },

  // Alerts & Notifications
  enableSmsAlerts: {
    type: Boolean,
    default: true
  },
  enableEmailDigest: {
    type: Boolean,
    default: true
  },
  enableParentAttendanceAlerts: {
    type: Boolean,
    default: true
  },
  attendanceThreshold: {
    type: Number,
    default: 75
  },
  enableFeeReminders: {
    type: Boolean,
    default: true
  },
  feeReminderDaysBefore: {
    type: Number,
    default: 7
  },
  enableExamAlerts: {
    type: Boolean,
    default: true
  },
  smsGatewayProvider: {
    type: String,
    default: 'AWS SNS / Twilio Gateway',
    trim: true
  },

  // Security & Access Policy
  enforce2FAAdmins: {
    type: Boolean,
    default: true
  },
  enforce2FAFaculty: {
    type: Boolean,
    default: true
  },
  sessionTimeoutMinutes: {
    type: Number,
    default: 30
  },
  maxLoginAttempts: {
    type: Number,
    default: 5
  },
  passwordMinLength: {
    type: Number,
    default: 8
  },
  passwordRequireSpecialChar: {
    type: Boolean,
    default: true
  },
  enableIpWhitelisting: {
    type: Boolean,
    default: false
  },

  // Appearance & Theme
  themeColor: {
    type: String,
    default: 'blue',
    trim: true
  },
  headerBrandTitle: {
    type: String,
    default: 'Vidyapeeth Management System',
    trim: true
  },
  enableDarkMode: {
    type: Boolean,
    default: false
  },

  // Finance & Payment Gateway
  paymentGateway: {
    type: String,
    default: 'Razorpay PG',
    trim: true
  },
  lateFeePerDay: {
    type: Number,
    default: 50
  },
  currencySymbol: {
    type: String,
    default: 'INR (₹)',
    trim: true
  },

  // Backup & Maintenance info
  lastBackupAt: {
    type: Date,
    default: Date.now
  },
  lastBackupFileName: {
    type: String,
    default: 'vcas_initial_backup.sql'
  },
  lastBackupSizeMB: {
    type: Number,
    default: 44.2
  }
}, {
  timestamps: true,
  collection: 'settings'
});

module.exports = mongoose.model('Setting', settingsSchema);
