const express = require('express');
const router = express.Router();
const staffTaskController = require('../controllers/staffTaskController');

router.get('/', staffTaskController.getAllTasks);
router.get('/staff/:staffId', staffTaskController.getTasksForStaff);
router.get('/hod/:hodStaffId', staffTaskController.getTasksByHod);
router.post('/', staffTaskController.createTask);
router.patch('/:id/status', staffTaskController.updateTaskStatus);
router.put('/:id', staffTaskController.updateTask);
router.delete('/:id', staffTaskController.deleteTask);

module.exports = router;
