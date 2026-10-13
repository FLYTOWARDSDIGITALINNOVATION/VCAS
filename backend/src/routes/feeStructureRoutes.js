const express = require('express');
const router = express.Router();
const {
  getFeeStructure,
  updateFeeStructure,
  resetFeeStructure
} = require('../controllers/feeStructureController');

router.get('/', getFeeStructure);
router.put('/', updateFeeStructure);
router.post('/reset', resetFeeStructure);

module.exports = router;
