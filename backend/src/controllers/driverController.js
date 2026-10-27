const Driver = require('../models/Driver');

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({}).sort({ driverName: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: drivers.length, data: drivers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving drivers', error: error.message });
  }
};

exports.createDriver = async (req, res) => {
  try {
    const {
      driverName,
      phoneNumber,
      address,
      aadharNumber,
      panNumber,
      aadharDocument,
      panDocument,
      drivingLicenseDocument,
      status
    } = req.body;

    if (!driverName || !normalizeString(driverName)) {
      return res.status(400).json({ success: false, message: 'Driver name is required.' });
    }

    const existing = await Driver.findOne({
      driverName: { $regex: new RegExp(`^${normalizeString(driverName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Driver already exists with the same name.' });
    }

    const driver = new Driver({
      driverName: normalizeString(driverName),
      phoneNumber: normalizeString(phoneNumber),
      address: normalizeString(address),
      aadharNumber: normalizeString(aadharNumber),
      panNumber: normalizeString(panNumber),
      aadharDocument: normalizeString(aadharDocument),
      panDocument: normalizeString(panDocument),
      drivingLicenseDocument: normalizeString(drivingLicenseDocument),
      status: status || 'Active'
    });

    await driver.save();
    res.status(201).json({ success: true, message: 'Driver created successfully.', data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating driver', error: error.message });
  }
};

exports.updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.driverName) updateData.driverName = normalizeString(updateData.driverName);
    if (updateData.phoneNumber !== undefined) updateData.phoneNumber = normalizeString(updateData.phoneNumber);
    if (updateData.address !== undefined) updateData.address = normalizeString(updateData.address);
    if (updateData.aadharNumber !== undefined) updateData.aadharNumber = normalizeString(updateData.aadharNumber);
    if (updateData.panNumber !== undefined) updateData.panNumber = normalizeString(updateData.panNumber);
    if (updateData.aadharDocument !== undefined) updateData.aadharDocument = normalizeString(updateData.aadharDocument);
    if (updateData.panDocument !== undefined) updateData.panDocument = normalizeString(updateData.panDocument);
    if (updateData.drivingLicenseDocument !== undefined) updateData.drivingLicenseDocument = normalizeString(updateData.drivingLicenseDocument);
    if (updateData.status) updateData.status = updateData.status;

    const driver = await Driver.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }

    res.status(200).json({ success: true, message: 'Driver updated successfully.', data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating driver', error: error.message });
  }
};

exports.addDailyRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, driverName, busNo, mileage, petrolCharge, remarks, addedBy } = req.body;

    if (!driverName || !normalizeString(driverName)) {
      return res.status(400).json({ success: false, message: 'Driver name is required for the daily record.' });
    }

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }

    const record = {
      date: date ? new Date(date) : new Date(),
      driverName: normalizeString(driverName),
      busNo: normalizeString(busNo),
      mileage: Number(mileage) || 0,
      petrolCharge: Number(petrolCharge) || 0,
      remarks: normalizeString(remarks),
      addedBy: normalizeString(addedBy)
    };

    driver.dailyRecords.unshift(record);
    await driver.save();

    res.status(200).json({ success: true, message: 'Daily driver record saved successfully.', data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error saving daily driver record', error: error.message });
  }
};

exports.deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findByIdAndDelete(id);

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }

    res.status(200).json({ success: true, message: 'Driver deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting driver', error: error.message });
  }
};
