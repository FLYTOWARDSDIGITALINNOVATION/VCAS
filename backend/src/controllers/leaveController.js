const Leave = require('../models/Leave');
const LeavePolicy = require('../models/LeavePolicy');

// Helper to get or initialize active leave policy
const getActivePolicy = async () => {
  let policy = await LeavePolicy.findOne().sort({ updatedAt: -1 });
  if (!policy) {
    policy = await LeavePolicy.create({
      policyName: 'Faculty Annual Leave Policy',
      academicYear: '2025-2026',
      annualQuota: 15,
      casualLeaves: 12,
      specialCasualLeaves: 3,
      medicalLeaves: 5,
      onDutyLeaves: 5,
      description: '12 Casual + 3 Special',
      updatedBy: 'Admin (System Default)'
    });
  }
  return policy;
};

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
    const pendingCount = await Leave.countDocuments({ status: { $regex: /^pending/i } });
    const pendingHodCount = await Leave.countDocuments({ status: 'Pending HOD' });
    const pendingPrincipalCount = await Leave.countDocuments({ status: 'Pending Principal' });
    const pendingMdCount = await Leave.countDocuments({ status: 'Pending MD' });
    const approvedCount = await Leave.countDocuments({ status: { $regex: /^approved$/i } });
    const rejectedCount = await Leave.countDocuments({ status: { $regex: /^rejected/i } });

    // Also fetch the current active policy to return in summary
    const policy = await getActivePolicy();

    res.status(200).json({
      success: true,
      count: allLeaves.length,
      leaves: allLeaves,
      summary: {
        totalApplications,
        pendingCount,
        pendingHodCount,
        pendingPrincipalCount,
        pendingMdCount,
        approvedCount,
        rejectedCount,
        activePolicy: {
          annualQuota: policy.annualQuota,
          casualLeaves: policy.casualLeaves,
          specialCasualLeaves: policy.specialCasualLeaves,
          medicalLeaves: policy.medicalLeaves,
          description: policy.description,
          academicYear: policy.academicYear
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all leaves for admin:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/leave/quota-settings
// @desc   Get current college-wide leave policy and quota configuration
exports.getQuotaSettings = async (req, res) => {
  try {
    const policy = await getActivePolicy();
    res.status(200).json({
      success: true,
      policy
    });
  } catch (error) {
    console.error('Error fetching quota settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  PUT /api/leave/quota-settings
// @desc   Update annual leave quota & policy settings (Admin / HoD)
exports.updateQuotaSettings = async (req, res) => {
  try {
    const {
      policyName,
      academicYear,
      annualQuota,
      casualLeaves,
      specialCasualLeaves,
      medicalLeaves,
      onDutyLeaves,
      description,
      updatedBy
    } = req.body;

    let policy = await LeavePolicy.findOne().sort({ updatedAt: -1 });
    if (!policy) {
      policy = new LeavePolicy({});
    }

    if (policyName !== undefined) policy.policyName = policyName;
    if (academicYear !== undefined) policy.academicYear = academicYear;
    if (annualQuota !== undefined) policy.annualQuota = Number(annualQuota);
    if (casualLeaves !== undefined) policy.casualLeaves = Number(casualLeaves);
    if (specialCasualLeaves !== undefined) policy.specialCasualLeaves = Number(specialCasualLeaves);
    if (medicalLeaves !== undefined) policy.medicalLeaves = Number(medicalLeaves);
    if (onDutyLeaves !== undefined) policy.onDutyLeaves = Number(onDutyLeaves);

    if (description !== undefined && description.trim()) {
      policy.description = description.trim();
    } else if (casualLeaves !== undefined && specialCasualLeaves !== undefined) {
      policy.description = `${casualLeaves} Casual + ${specialCasualLeaves} Special`;
    }

    if (updatedBy !== undefined) policy.updatedBy = updatedBy;

    await policy.save();

    res.status(200).json({
      success: true,
      message: 'Leave quota policy updated successfully!',
      policy
    });
  } catch (error) {
    console.error('Error updating quota settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  PUT /api/leave/quota-settings/staff/:staffId
// @desc   Set custom leave quota override for a specific staff member
exports.updateStaffOverrideQuota = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { annualQuota, casualLeaves, specialCasualLeaves, medicalLeaves, notes, staffName } = req.body;

    const policy = await getActivePolicy();
    const existingIndex = policy.staffOverrides.findIndex(o => o.staffId === staffId);

    const overrideData = {
      staffId,
      staffName: staffName || '',
      annualQuota: Number(annualQuota),
      casualLeaves: Number(casualLeaves || 0),
      specialCasualLeaves: Number(specialCasualLeaves || 0),
      medicalLeaves: Number(medicalLeaves || 0),
      notes: notes || ''
    };

    if (existingIndex >= 0) {
      policy.staffOverrides[existingIndex] = overrideData;
    } else {
      policy.staffOverrides.push(overrideData);
    }

    await policy.save();

    res.status(200).json({
      success: true,
      message: `Custom quota configured for staff ${staffId}.`,
      policy
    });
  } catch (error) {
    console.error('Error updating staff override quota:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/leave/staff/:staffId
// @desc   Get all leave records and quota summary for a staff member
exports.getStaffLeaves = async (req, res) => {
  try {
    const { staffId } = req.params;
    const leaves = await Leave.find({ staffId }).sort({ createdAt: -1 });

    const policy = await getActivePolicy();
    const staffOverride = policy.staffOverrides?.find(o => o.staffId === staffId);

    const totalQuota = staffOverride ? staffOverride.annualQuota : policy.annualQuota;
    const casualLeaves = staffOverride ? staffOverride.casualLeaves : policy.casualLeaves;
    const specialCasualLeaves = staffOverride ? staffOverride.specialCasualLeaves : policy.specialCasualLeaves;
    const medicalLeaves = staffOverride ? staffOverride.medicalLeaves : (policy.medicalLeaves || 5);
    const onDutyLeaves = policy.onDutyLeaves || 5;
    const quotaBreakdown = staffOverride?.notes || policy.description || `${casualLeaves} Casual + ${specialCasualLeaves} Special`;

    const approvedDays = leaves
      .filter(l => l.status === 'Approved')
      .reduce((sum, l) => sum + (l.days || 0), 0);

    const casualApprovedDays = leaves
      .filter(l => l.status === 'Approved' && l.leaveType === 'Casual Leave')
      .reduce((sum, l) => sum + (l.days || 0), 0);

    const specialApprovedDays = leaves
      .filter(l => l.status === 'Approved' && l.leaveType === 'Special Casual Leave')
      .reduce((sum, l) => sum + (l.days || 0), 0);

    const medicalApprovedDays = leaves
      .filter(l => l.status === 'Approved' && l.leaveType === 'Medical Leave')
      .reduce((sum, l) => sum + (l.days || 0), 0);

    const onDutyApprovedDays = leaves
      .filter(l => l.status === 'Approved' && l.leaveType === 'On Duty')
      .reduce((sum, l) => sum + (l.days || 0), 0);

    const pendingCount = leaves.filter(l => l.status === 'Pending').length;
    const remainingDays = Math.max(0, totalQuota - approvedDays);
    const remainingCasual = Math.max(0, casualLeaves - casualApprovedDays);
    const remainingSpecial = Math.max(0, specialCasualLeaves - specialApprovedDays);

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
      summary: {
        totalQuota,
        casualLeaves,
        specialCasualLeaves,
        medicalLeaves,
        onDutyLeaves,
        quotaBreakdown,
        approvedDays,
        casualApprovedDays,
        specialApprovedDays,
        medicalApprovedDays,
        onDutyApprovedDays,
        pendingCount,
        remainingDays,
        remainingCasual,
        remainingSpecial,
        academicYear: policy.academicYear,
        isCustomQuota: !!staffOverride
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
      status: 'Pending HOD',
      currentStage: 'HOD',
      hodApproval: { status: 'Pending', approvedBy: '', remarks: '' },
      principalApproval: { status: 'Pending', approvedBy: '', remarks: '' },
      mdApproval: { status: 'Pending', approvedBy: '', remarks: '' },
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
    if (status === 'Approved') {
      leave.currentStage = 'Completed';
      leave.hodApproval = { status: 'Approved', approvedBy: approvedBy || 'Admin', approvedAt: new Date(), remarks: remarks || 'Direct Institutional Approval' };
      leave.principalApproval = { status: 'Approved', approvedBy: approvedBy || 'Principal', approvedAt: new Date(), remarks: remarks || 'Direct Institutional Approval' };
      leave.mdApproval = { status: 'Approved', approvedBy: approvedBy || 'MD', approvedAt: new Date(), remarks: remarks || 'Direct Institutional Approval' };
    } else if (status === 'Rejected') {
      leave.currentStage = 'Rejected';
    }
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

// @route  PATCH /api/leave/:id/stage-approval
// @desc   Multi-level stage approval (HOD -> Principal -> MD)
exports.approveLeaveStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, action, approvedBy, remarks } = req.body; // stage: 'HOD' | 'Principal' | 'MD', action: 'Approved' | 'Rejected'

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave record not found.' });
    }

    const reviewerName = approvedBy || stage;
    const reviewRemarks = remarks || '';

    if (action === 'Rejected') {
      if (stage === 'HOD') {
        leave.hodApproval = { status: 'Rejected', approvedBy: reviewerName, approvedAt: new Date(), remarks: reviewRemarks };
      } else if (stage === 'Principal') {
        leave.principalApproval = { status: 'Rejected', approvedBy: reviewerName, approvedAt: new Date(), remarks: reviewRemarks };
      } else if (stage === 'MD') {
        leave.mdApproval = { status: 'Rejected', approvedBy: reviewerName, approvedAt: new Date(), remarks: reviewRemarks };
      }
      leave.status = 'Rejected';
      leave.currentStage = 'Rejected';
      leave.remarks = reviewRemarks ? `Rejected by ${stage}: ${reviewRemarks}` : `Rejected by ${stage}`;
    } else {
      // Stage Approved
      if (stage === 'HOD') {
        leave.hodApproval = { status: 'Approved', approvedBy: reviewerName, approvedAt: new Date(), remarks: reviewRemarks };
        leave.status = 'Pending Principal';
        leave.currentStage = 'Principal';
      } else if (stage === 'Principal') {
        leave.principalApproval = { status: 'Approved', approvedBy: reviewerName, approvedAt: new Date(), remarks: reviewRemarks };
        leave.status = 'Pending MD';
        leave.currentStage = 'MD';
      } else if (stage === 'MD') {
        leave.mdApproval = { status: 'Approved', approvedBy: reviewerName, approvedAt: new Date(), remarks: reviewRemarks };
        leave.status = 'Approved';
        leave.currentStage = 'Completed';
        leave.approvedBy = reviewerName;
      }
    }

    await leave.save();

    res.status(200).json({
      success: true,
      message: `Leave ${action === 'Rejected' ? 'rejected' : 'approved'} by ${stage}. Current status: ${leave.status}.`,
      leave
    });
  } catch (error) {
    console.error('Error in approveLeaveStage:', error);
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
