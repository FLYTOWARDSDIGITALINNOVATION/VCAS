const Notice = require('../models/Notice');

const INITIAL_NOTICES = [
  {
    title: 'Semester End Examination Schedule Released',
    body: 'The end semester theory examinations will commence from November 15, 2026. Faculty members are requested to complete syllabus and internal assessment compilation by October 25, 2026.',
    tag: 'Exam',
    postedBy: 'Controller of Examinations',
    department: 'All',
    date: '2026-09-02',
    urgent: false,
    pinned: true
  },
  {
    title: 'Department Faculty Meeting – Curriculum Revision',
    body: 'All faculty members are requested to attend the curriculum review meeting on Friday at 3:30 PM in the Conference Hall.',
    tag: 'Academic',
    postedBy: 'Dean Academics',
    department: 'All',
    date: '2026-09-01',
    urgent: false,
    pinned: false
  }
];

// @route  GET /api/notices
// @desc   Get all notices (with optional search and tag/category filter)
exports.getNotices = async (req, res) => {
  try {
    const { tag, search } = req.query;

    const filter = {};
    if (tag && tag !== 'ALL' && tag !== 'All') {
      filter.tag = tag;
    }

    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { body: { $regex: search.trim(), $options: 'i' } },
        { postedBy: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const notices = await Notice.find(filter).sort({ pinned: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: notices.length, notices });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  POST /api/notices
// @desc   Publish a new notice
exports.createNotice = async (req, res) => {
  try {
    const { title, body, tag, postedBy, postedByStaffId, department, urgent, pinned } = req.body;

    if (!title || !title.trim() || !body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Notice title and body are required.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const notice = await Notice.create({
      title: title.trim(),
      body: body.trim(),
      tag: tag || 'Academic',
      postedBy: postedBy || 'Faculty Member',
      postedByStaffId: postedByStaffId || '',
      department: department || 'All',
      date: todayStr,
      urgent: Boolean(urgent),
      pinned: Boolean(pinned)
    });

    res.status(201).json({ success: true, message: 'Notice published successfully.', notice });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  DELETE /api/notices/:id
// @desc   Delete a notice
exports.deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Notice.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notice not found.' });
    }
    res.status(200).json({ success: true, message: 'Notice deleted successfully.' });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
