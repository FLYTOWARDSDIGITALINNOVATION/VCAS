const express = require('express');
const router = express.Router();
const {
  getPlansByStaff,
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} = require('../controllers/coursePlanController');

router.get('/', getAllPlans);
router.get('/detail/:id', getPlanById);
router.get('/:staffId', getPlansByStaff);
router.post('/', createPlan);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

module.exports = router;
