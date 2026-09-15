const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionNo: { type: Number, required: true },
  text: { type: String, required: true },
  marks: { type: Number, required: true },
  unit: { type: String, default: "" },
  type: { type: String, enum: ["MCQ","Short","Long","Essay"], default: "Short" },
  options: [{ type: String }],
  answer: { type: String, default: "" }
}, { _id: true });

const sectionSchema = new mongoose.Schema({
  sectionLabel: { type: String, required: true },
  instructions: { type: String, default: "" },
  totalMarks: { type: Number, default: 0 },
  questions: [questionSchema]
}, { _id: true });

const questionPaperSchema = new mongoose.Schema({
  staffId: { type: String, required: true },
  staffName: { type: String, required: true },
  department: { type: String, required: true },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  semester: { type: Number, required: true },
  year: { type: Number, required: true },
  section: { type: String, default: "A" },
  examType: { type: String, enum: ["Internal Test 1","Internal Test 2","Model Exam","Semester Exam","Retest"], default: "Internal Test 1" },
  duration: { type: String, default: "3 Hours" },
  totalMarks: { type: Number, default: 100 },
  instructions: { type: String, default: "" },
  status: { type: String, enum: ["Draft","Published","Archived"], default: "Draft" },
  sections: [sectionSchema],
  academicYear: { type: String, default: "" }
}, { timestamps: true, collection: "QuestionPapers" });

module.exports = mongoose.model("QuestionPaper", questionPaperSchema, "QuestionPapers");
