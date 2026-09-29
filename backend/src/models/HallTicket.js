const mongoose = require('mongoose');

const subjectScheduleSchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  date: { type: String, default: 'TBA', trim: true }, // Optional/defaults to TBA so it never crashes validation
  session: { type: String, enum: ['Forenoon (FN)', 'Afternoon (AN)', 'FN', 'AN'], default: 'Forenoon (FN)' },
  time: { type: String, default: '09:30 AM - 12:30 PM', trim: true }
}, { _id: false });

const studentAllocationSchema = new mongoose.Schema({
  rollNo: { type: String, required: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  dept: { type: String, default: '', trim: true },
  semester: { type: Number, default: 1 },
  section: { type: String, default: 'A', uppercase: true, trim: true },
  hallNo: { type: String, default: 'TBA', trim: true }, // Room / Hall Name
  seatNo: { type: String, default: 'TBA', trim: true }, // e.g. R101-01
  deskNo: { type: String, default: '', trim: true },
  eligible: { type: Boolean, default: true },
  remarks: { type: String, default: 'Eligible for Examination' },
  subjects: [subjectScheduleSchema]
}, { _id: true, timestamps: true });

const hallTicketSchema = new mongoose.Schema({
  examName: {
    type: String,
    required: [true, 'Examination title is required'],
    trim: true
  },
  examType: {
    type: String,
    enum: ['Semester End Examination', 'Internal Assessment', 'Model Examination', 'Special Supplementary'],
    default: 'Semester End Examination'
  },
  academicYear: {
    type: String,
    default: '2025-2026',
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required']
  },
  section: {
    type: String,
    default: 'All',
    trim: true
  },
  halls: [{
    hallNo: { type: String, trim: true },
    capacity: { type: Number, default: 30 }
  }],
  allocatedByStaffId: {
    type: String,
    default: 'STAFF',
    trim: true
  },
  allocatedByStaffName: {
    type: String,
    default: 'Faculty In-Charge',
    trim: true
  },
  commonSubjects: [subjectScheduleSchema],
  students: [studentAllocationSchema],
  instructions: [{
    type: String,
    default: [
      'Candidates must bring this Hall Ticket along with their College ID Card to every examination.',
      'Possession of mobile phones, smartwatches, or any unauthorized electronic items inside the hall is strictly prohibited.',
      'Candidates must occupy their designated seats at least 15 minutes before the scheduled commencement.',
      'No candidate will be permitted to enter the hall after 30 minutes from the commencement of the exam.'
    ]
  }]
}, {
  timestamps: true,
  collection: 'hall_tickets'
});

module.exports = mongoose.model('HallTicket', hallTicketSchema);
