const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  triggerBackup
} = require('../controllers/settingsController');

router.get('/', getSettings);
router.put('/', updateSettings);
router.post('/', updateSettings);
router.post('/backup', triggerBackup);

module.exports = router;
