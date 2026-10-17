const express = require('express');
const router = express.Router();
const {
  getAllHallTickets,
  getHallTicketById,
  getEligibleStudents,
  getHallTicketMeta,
  getStudentHallTicket,
  createOrUpdateAllocation,
  cleanupDuplicates,
  deleteAllocation,
  updateSubjectSchedule
} = require('../controllers/hallTicketController');

router.get('/', getAllHallTickets);
router.get('/meta', getHallTicketMeta);
router.get('/eligible-students', getEligibleStudents);
router.get('/student/:identifier', getStudentHallTicket);
router.get('/:id', getHallTicketById);
router.post('/allocate', createOrUpdateAllocation);
router.post('/update-subject-schedule', updateSubjectSchedule);
router.post('/cleanup-duplicates', cleanupDuplicates);
router.delete('/:id', deleteAllocation);

module.exports = router;
