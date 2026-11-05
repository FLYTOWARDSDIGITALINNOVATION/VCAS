const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionNo: { type: Number, required: true },
  // Draft papers can be saved before every question is written.
  text: { type: String, default: "" },
  marks: { type: Number, required: true, default: 5 },
  unit: { type: String, default: "" },
  type: { 
    type: String, 
    enum: ["MCQ", "5 Mark", "8 Mark", "Short", "Long", "Essay"], 
    default: "MCQ" 
  },
  options: [{ type: String }],
  answer: { type: String, default: "" },
  // Table format in questions
  hasTable: { type: Boolean, default: false },
  tableData: {
    headers: [{ type: String }],
    rows: [[{ type: String }]]
  },
  // Image format upload in questions
  hasImage: { type: Boolean, default: false },
  imageUrl: { type: String, default: "" },
  imageCaption: { type: String, default: "" }
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
  subjectCode: { type: String, default: "" },
  subjectName: { type: String, required: true },
  semester: { type: Number, required: true },
  year: { type: Number, required: true },
  section: { type: String, default: "A" },
  examType: { 
    type: String, 
    // Keep the editor's stored values, while accepting labels used by older clients.
    enum: ["internal1", "internal 2", "model", "semester", "seminar", "project", "Internal Test 1", "Internal Test 2", "Model Exam", "Semester Exam", "Retest"],
    default: "internal1"
  },
  duration: { type: String, default: "3 Hours" },
  totalMarks: { type: Number, default: 100 },
  instructions: { type: String, default: "" },
  status: { type: String, enum: ["Draft", "Published", "Archived"], default: "Draft" },
  sections: [sectionSchema],
  academicYear: { type: String, default: "" }
}, { timestamps: true, collection: "QuestionPapers" });

module.exports = mongoose.model("QuestionPaper", questionPaperSchema, "QuestionPapers");
