const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title:           { type: String, required: true, trim: true },
  body:            { type: String, required: true, trim: true },
  tag:             { type: String, default: 'Academic', trim: true },
  postedBy:        { type: String, required: true, trim: true },
  postedByStaffId: { type: String, default: '', trim: true },
  department:      { type: String, default: 'All', trim: true },
  date:            { type: String, default: () => new Date().toISOString().split('T')[0] },
  urgent:          { type: Boolean, default: false },
  pinned:          { type: Boolean, default: false }
}, {
  timestamps: true,
  collection: 'Notices'
});

module.exports = mongoose.model('Notice', noticeSchema, 'Notices');
