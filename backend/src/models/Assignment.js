const mongoose = require("mongoose");

const studentSubmissionSchema = new mongoose.Schema({
  rollNo:       { type: String, required: true },
  studentName:  { type: String, required: true },
  regNo:        { type: String, default: "" },
  department:   { type: String, default: "" },
  submittedAt:  { type: String, default: "--" },
  fileName:     { type: String, default: "--" },
  fileSize:     { type: String, default: "--" },
  fileData:     { type: String, default: "" },
  fileType:     { type: String, default: "" },
  status:       { type: String, default: "Not Submitted" },
  marksAwarded: { type: Number, default: null },
  feedback:     { type: String, default: "" }
}, { _id: true, timestamps: true });

const assignmentSchema = new mongoose.Schema({
  staffId:      { type: String, required: true },
  staffName:    { type: String, default: "" },
  subjectCode:  { type: String, default: "" },
  subjectName:  { type: String, default: "" },
  department:   { type: String, default: "" },
  semester:     { type: Number, default: 1 },
  academicYear: { type: String, default: "" },
  title:        { type: String, required: true },
  description:  { type: String, default: "" },
  dueDate:      { type: String, required: true },
  totalMarks:   { type: Number, default: 20 },
  category:     { type: String, enum: ["Regular", "Project"], default: "Regular" },
  projectPhase: { type: String, default: "" },
  status:       { type: String, enum: ["Active", "Closed"], default: "Active" },
  submissions:  { type: Number, default: 0 },
  attachmentName: { type: String, default: "" },
  attachmentData: { type: String, default: "" },
  attachmentSize: { type: String, default: "" },
  attachmentType: { type: String, default: "" },
  studentSubmissions: [studentSubmissionSchema],
}, { timestamps: true, collection: "Assignments" });

module.exports = mongoose.model("Assignment", assignmentSchema, "Assignments");

