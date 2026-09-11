const Leave = require('../models/Leave');

// @route  GET /api/leave
// @desc   Get all leave applications across all faculty for Admin portal
exports.getAllLeaves = async (req, res) => {
  try {
    const { status, department, search } = req.query;

    const filter = {};
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (department && department !== 'All' && department !== 'All Departments') {
      filter.department = department;
    }
    if (search && search.trim()) {
      filter.$or = [
        { staffName: { $regex: search.trim(), $options: 'i' } },
        { staffId: { $regex: search.trim(), $options: 'i' } },
        { reason: { $regex: search.trim(), $options: 'i' } },
        { leaveType: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const allLeaves = await Leave.find(filter).sort({ createdAt: -1 });

    const totalApplications = await Leave.countDocuments();
    const pendingCount = await Leave.countDocuments({ status: 'Pending' });
    const approvedCount = await Leave.countDocuments({ status: 'Approved' });
    const rejectedCount = await Leave.countDocuments({ status: 'Rejected' });

    res.status(200).json({
      success: true,
      count: allLeaves.length,
      leaves: allLeaves,
      summary: {
        totalApplications,
        pendingCount,
        approvedCount,
        rejectedCount
      }
    });
  } catch (error) {
    console.error('Error fetching all leaves for admin:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/leave/staff/:staffId
// @desc   Get all leave records and quota summary for a staff member
exports.getStaffLeaves = async (req, res) => {
  try {
    const { staffId } = req.params;
    const leaves = await Leave.find({ staffId }).sort({ createdAt: -1 });

    const totalQuota = 15;
    const approvedDays = leaves
      .filter(l => l.status === 'Approved')
      .reduce((sum, l) => sum + (l.days || 0), 0);

    const pendingCount = leaves.filter(l => l.status === 'Pending').length;
    const remainingDays = Math.max(0, totalQuota - approvedDays);

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
      summary: {
        totalQuota,
        approvedDays,
        pendingCount,
        remainingDays
      }
    });
  } catch (error) {
    console.error('Error fetching staff leaves:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  POST /api/leave/staff/:staffId
// @desc   Submit a new leave application
exports.applyLeave = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { 
      staffName, 
      department, 
      leaveType, 
      fromDate, 
      toDate, 
      reason 
    } = req.body;

    if (!fromDate || !toDate || !reason || !reason.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'From Date, To Date, and Reason are required.' 
      });
    }

    // Calculate duration days
    const d1 = new Date(fromDate);
    const d2 = new Date(toDate);
    const diffTime = Math.abs(d2 - d1);
    const calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const leave = await Leave.create({
      staffId,
      staffName: staffName || '',
      department: department || '',
      leaveType: leaveType || 'Casual Leave',
      fromDate,
      toDate,
      days: calculatedDays,
      reason: reason.trim(),
      status: 'Pending',
      approvedBy: '-'
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully! It is pending HoD approval.',
      leave
    });
  } catch (error) {
    console.error('Error applying for leave:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  PATCH /api/leave/:id/status
// @desc   Update leave status (Approve / Reject) by HoD / Admin
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvedBy, remarks } = req.body;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave record not found.' });
    }

    leave.status = status;
    if (approvedBy !== undefined) leave.approvedBy = approvedBy;
    if (remarks !== undefined) leave.remarks = remarks;

    await leave.save();

    res.status(200).json({
      success: true,
      message: `Leave status updated to ${status}.`,
      leave
    });
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  DELETE /api/leave/:id
// @desc   Cancel a pending leave application
exports.cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave record not found.' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a leave application that has already been ${leave.status}.`
      });
    }

    await Leave.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Leave application cancelled successfully.'
    });
  } catch (error) {
    console.error('Error cancelling leave:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
