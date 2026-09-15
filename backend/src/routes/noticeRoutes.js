const express = require('express');
const router = express.Router();
const {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice
} = require('../controllers/noticeController');

// GET    /api/notices      - List all notices (optional ?tag=)
router.get('/', getNotices);

// POST   /api/notices      - Publish a new notice
router.post('/', createNotice);

// PUT    /api/notices/:id  - Update a notice
router.put('/:id', updateNotice);

// DELETE /api/notices/:id  - Delete a notice
router.delete('/:id', deleteNotice);

module.exports = router;
