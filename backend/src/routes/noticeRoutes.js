const express = require('express');
const router = express.Router();
const {
  getNotices,
  createNotice,
  deleteNotice
} = require('../controllers/noticeController');

// GET    /api/notices      - List all notices (optional ?tag=)
router.get('/', getNotices);

// POST   /api/notices      - Publish a new notice
router.post('/', createNotice);

// DELETE /api/notices/:id  - Delete a notice
router.delete('/:id', deleteNotice);

module.exports = router;
