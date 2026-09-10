const mongoose = require('mongoose');

const internalMarkSchema = new mongoose.Schema({
  rollNo:  { type: String, required: true },
  name:    { type: String, required: true },
  ia1:     { type: Number, default: null, min: 0, max: 25 },
  ia2:     { type: Number, default: null, min: 0, max: 25 },
  ia3:     { type: Number, default: null, min: 0, max: 25 },
  average: { type: Number, default: null }
});

const internalMarksSchema = new mongoose.Schema({
  staffId:   { type: String, required: true },
  classCode: { type: String, required: true },
  className: { type: String, default: '' },
  dept:      { type: String, default: '' },
  semester:  { type: Number, default: 1 },
  students:  [internalMarkSchema]
}, { timestamps: true, collection: 'InternalMarks' });

internalMarksSchema.index({ staffId: 1, classCode: 1 }, { unique: true });

module.exports = mongoose.model('InternalMarks', internalMarksSchema, 'InternalMarks');
