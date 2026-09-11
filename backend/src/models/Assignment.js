const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  staffId:      { type: String, required: true },
  staffName:    { type: String, default: "" },
  subjectCode:  { type: String, required: true },
  subjectName:  { type: String, default: "" },
  department:   { type: String, default: "" },
  semester:     { type: Number, default: 1 },
  academicYear: { type: String, default: "" },
  title:        { type: String, required: true },
  description:  { type: String, default: "" },
  dueDate:      { type: String, required: true },
  totalMarks:   { type: Number, default: 20 },
  status:       { type: String, enum: ["Active", "Closed"], default: "Active" },
  submissions:  { type: Number, default: 0 },
}, { timestamps: true, collection: "Assignments" });

module.exports = mongoose.model("Assignment", assignmentSchema, "Assignments");
