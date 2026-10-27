const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');

router.get('/', driverController.getDrivers);
router.post('/', driverController.createDriver);
router.post('/:id/daily-record', driverController.addDailyRecord);
router.put('/:id', driverController.updateDriver);
router.delete('/:id', driverController.deleteDriver);

module.exports = router;
