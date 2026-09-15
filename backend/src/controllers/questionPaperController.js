const QuestionPaper = require("../models/QuestionPaper");

// GET all papers for a staff member
exports.getMyPapers = async (req, res) => {
  try {
    const { staffId } = req.params;
    const papers = await QuestionPaper.find({ staffId }).sort({ updatedAt: -1 });
    res.json({ success: true, data: papers });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET single paper
exports.getPaper = async (req, res) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id);
    if (!paper) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: paper });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// CREATE paper
exports.createPaper = async (req, res) => {
  try {
    const paper = await QuestionPaper.create(req.body);
    res.status(201).json({ success: true, data: paper });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

// UPDATE paper
exports.updatePaper = async (req, res) => {
  try {
    const paper = await QuestionPaper.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!paper) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: paper });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

// DELETE paper
exports.deletePaper = async (req, res) => {
  try {
    const paper = await QuestionPaper.findByIdAndDelete(req.params.id);
    if (!paper) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// UPDATE status only
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const paper = await QuestionPaper.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!paper) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: paper });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};
