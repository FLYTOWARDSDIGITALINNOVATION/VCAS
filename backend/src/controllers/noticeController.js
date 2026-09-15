const Notice = require('../models/Notice');

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

// @route  PUT /api/notices/:id
// @desc   Update an existing notice
exports.updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, tag, urgent } = req.body;

    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found.' });
    }

    if (title && title.trim()) notice.title = title.trim();
    if (body && body.trim())   notice.body  = body.trim();
    if (tag)                   notice.tag   = tag;
    if (urgent !== undefined)  notice.urgent = Boolean(urgent);

    await notice.save();
    res.status(200).json({ success: true, message: 'Notice updated successfully.', notice });
  } catch (error) {
    console.error('Error updating notice:', error);
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
