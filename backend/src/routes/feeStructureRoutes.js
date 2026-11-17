const express = require('express');
const router = express.Router();
const {
  getFeeStructure,
  updateFeeStructure,
  resetFeeStructure,
  getMiscellaneousFees,
  updateMiscellaneousFees
} = require('../controllers/feeStructureController');

router.get('/miscellaneous-fees', getMiscellaneousFees);
router.put('/miscellaneous-fees', updateMiscellaneousFees);
router.get('/', getFeeStructure);
router.put('/', updateFeeStructure);
router.post('/reset', resetFeeStructure);

module.exports = router;
