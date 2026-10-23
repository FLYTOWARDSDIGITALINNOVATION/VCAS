const express = require('express');
const router = express.Router();
const {
  getAllBonafides,
  getBonafideById,
  issueBonafide,
  updateBonafide,
  deleteBonafide
} = require('../controllers/bonafideController');

router.get('/', getAllBonafides);
router.get('/:id', getBonafideById);
router.post('/', issueBonafide);
router.put('/:id', updateBonafide);
router.delete('/:id', deleteBonafide);

module.exports = router;
