import React, { useState, useEffect } from 'react';
import { API_BASE, BACKEND_URL } from '../../apiConfig';
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Clock3, 
  XCircle, 
  Plus, 
  X, 
  ShieldCheck,
  AlertCircle,
  Trash2,
  Loader2,
  Info,
  CalendarCheck,
  Sparkles
} from 'lucide-react';

export default function StaffLeave({ staffUser = {} }) {
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState({
    totalQuota: 15,
    casualLeaves: 12,
    specialCasualLeaves: 3,
    medicalLeaves: 5,
    quotaBreakdown: '12 Casual + 3 Special',
    approvedDays: 0,
    pendingCount: 0,
    remainingDays: 15,
    remainingCasual: 12,
    remainingSpecial: 3,
    academicYear: '2025-2026',
    isCustomQuota: false
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const staffId = staffUser?.staffId;

  // Check if current user is HOD or Admin
  const isHod = staffUser?.designation?.toUpperCase()?.includes('HOD') || 
                staffUser?.role?.toUpperCase()?.includes('HOD') || 
                staffUser?.role?.toUpperCase()?.includes('ADMIN') || 
                staffUser?.isHod === true ||
                staffUser?.canHandleLeaves === true;

  const [activeTab, setActiveTab] = useState(isHod ? 'staff_requests' : 'my_leaves');
  const [departmentLeaves, setDepartmentLeaves] = useState([]);
  const [loadingDeptLeaves, setLoadingDeptLeaves] = useState(false);
  const [reviewModalLeave, setReviewModalLeave] = useState(null);
  const [reviewAction, setReviewAction] = useState('Approved');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // Fetch leaves from MongoDB
  const fetchLeaves = async () => {
    if (!staffId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/leave/staff/${staffId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setLeaves(data.leaves || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all staff leave requests for HOD
  const fetchDepartmentLeaves = async () => {
    try {
      setLoadingDeptLeaves(true);
      const dept = staffUser?.department || '';
      const url = (dept && dept !== 'All' && dept !== 'All Departments')
        ? `${API_BASE}/leave?department=${encodeURIComponent(dept)}`
        : `${API_BASE}/leave`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setDepartmentLeaves(data.leaves || []);
      }
    } catch (err) {
      console.error('Failed to load department leaves for HOD:', err);
    } finally {
      setLoadingDeptLeaves(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
    if (isHod) {
      fetchDepartmentLeaves();
    }
  }, [staffId, isHod]);

  const handleStageApproval = async (leaveId, action, remarks = '') => {
    try {
      setIsProcessingApproval(true);
      const res = await fetch(`${API_BASE}/leave/${leaveId}/stage-approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'HOD',
          action,
          approvedBy: staffUser?.name || 'HOD',
          remarks
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || `Leave ${action === 'Rejected' ? 'rejected' : 'approved (forwarded to Principal)'} successfully!`);
        setTimeout(() => setSuccessMsg(''), 4000);
        setReviewModalLeave(null);
        setReviewRemarks('');
        fetchDepartmentLeaves();
        fetchLeaves();
      } else {
        alert(data.message || 'Approval action failed.');
      }
    } catch (err) {
      alert('Unable to connect to backend server.');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const calculateDays = () => {
    if (!fromDate || !toDate) return 1;
    const d1 = new Date(fromDate);
    const d2 = new Date(toDate);
    if (d2 < d1) return 1;
    const diff = Math.abs(d2 - d1);
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate || !reason.trim()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/leave/staff/${staffId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffName: staffUser?.name || 'Staff Member',
          department: staffUser?.department || '',
          leaveType,
          fromDate,
          toDate,
          reason: reason.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowModal(false);
        setReason('');
        setFromDate('');
        setToDate('');
        setSuccessMsg(data.message || 'Leave application submitted successfully!');
        setTimeout(() => setSuccessMsg(''), 5000);
        fetchLeaves();
      } else {
        setErrorMsg(data.message || 'Failed to submit leave application.');
      }
    } catch (err) {
      setErrorMsg('Unable to connect to the backend server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave application?')) return;

    try {
      const res = await fetch(`${API_BASE}/leave/${leaveId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Leave application cancelled successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchLeaves();
      } else {
        alert(data.message || 'Unable to cancel leave.');
      }
    } catch (err) {
      alert('Unable to connect to server.');
    }
  };

  const statusBadge = (item) => {
    const status = item?.status || 'Pending';
    if (status === 'Approved') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Fully Approved (MD)
        </span>
      );
    }
    if (status === 'Pending MD') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60">
          <Clock3 className="w-3.5 h-3.5 text-purple-600" />
          Pending MD
        </span>
      );
    }
    if (status === 'Pending Principal') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
          <Clock3 className="w-3.5 h-3.5 text-blue-600" />
          Pending Principal
        </span>
      );
    }
    if (status === 'Pending HOD' || status === 'Pending') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 animate-pulse">
          <Clock3 className="w-3.5 h-3.5 text-amber-600" />
          Pending HOD
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200/60">
        <XCircle className="w-3.5 h-3.5 text-rose-600" />
        Rejected
      </span>
    );
  };

  const selectedDays = calculateDays();

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Leave Management (HOD / Admin)</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Apply for leave, track approval status, and manage leave quota
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setErrorMsg(''); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* HOD Tabs */}
      {isHod && (
        <div className="flex border-b border-slate-200 gap-2 mb-2">
          <button
            onClick={() => setActiveTab('staff_requests')}
            className={`pb-3 px-4 text-xs font-black transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'staff_requests'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-purple-600" />
            <span>Staff Leave Requests (HOD Stage)</span>
            {departmentLeaves.filter(l => l.status === 'Pending HOD' || l.status === 'Pending').length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                {departmentLeaves.filter(l => l.status === 'Pending HOD' || l.status === 'Pending').length} Pending
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('my_leaves')}
            className={`pb-3 px-4 text-xs font-black transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'my_leaves'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>My Leave Applications</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
              {leaves.length}
            </span>
          </button>
        </div>
      )}

      {/* Leave Summary Cards (Remaining leave count removed per user request) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Applications */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {activeTab === 'staff_requests' ? 'Dept Staff Requests' : 'Total Applications'}
            </p>
            {summary.academicYear && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                AY {summary.academicYear}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900">
              {activeTab === 'staff_requests' ? departmentLeaves.length : leaves.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">applications submitted</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2.5 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            {activeTab === 'staff_requests' ? `Department: ${staffUser?.department || 'College'}` : 'Institutional Leave Records'}
          </p>
        </div>

        {/* Card 2: Leaves Availed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved Leaves</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              Live Approved
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-600">
              {activeTab === 'staff_requests'
                ? departmentLeaves.filter(l => l.status === 'Approved').length
                : (summary.approvedDays ?? 0)}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {activeTab === 'staff_requests' ? 'approved requests' : 'days approved'}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2.5 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Total leaves availed
          </p>
        </div>

        {/* Card 3: Pending Multi-Level Approvals */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Multi-Level</p>
            {(activeTab === 'staff_requests' ? departmentLeaves.filter(l => l.status === 'Pending HOD' || l.status === 'Pending').length : summary.pendingCount) > 0 ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                In Review
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                All Cleared
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-amber-600">
              {activeTab === 'staff_requests'
                ? departmentLeaves.filter(l => l.status === 'Pending HOD' || l.status === 'Pending').length
                : (summary.pendingCount ?? 0)}
            </span>
            <span className="text-xs text-slate-400 font-medium">requests</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2.5 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Workflow: HOD ➔ Principal ➔ MD
          </p>
        </div>
      </div>

      {/* TAB 1: STAFF LEAVE REQUESTS (HOD PORTAL) */}
      {isHod && activeTab === 'staff_requests' && (
        <div className="bg-white rounded-2xl border border-purple-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-purple-100 flex items-center justify-between bg-purple-50/30">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-700" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Staff Leave Approval Portal (HOD Stage)</h3>
                <p className="text-[11px] text-slate-500">Review faculty leave applications from your department and recommend/forward to Principal</p>
              </div>
            </div>
            <button
              onClick={fetchDepartmentLeaves}
              className="text-xs font-bold text-purple-700 hover:text-purple-800 px-3 py-1.5 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 flex items-center gap-1 cursor-pointer"
            >
              <span>↻ Refresh</span>
            </button>
          </div>

          {loadingDeptLeaves ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <p className="text-xs font-medium">Loading staff leave requests...</p>
            </div>
          ) : departmentLeaves.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <UserCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No staff leave requests found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">When staff in your department apply for leave, they will appear here for your review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="text-left px-5 py-3">Faculty / Staff</th>
                    <th className="text-left px-5 py-3">Leave Type</th>
                    <th className="text-left px-5 py-3">Dates</th>
                    <th className="text-center px-4 py-3">Days</th>
                    <th className="text-left px-5 py-3">Reason</th>
                    <th className="text-center px-5 py-3">Stage Status</th>
                    <th className="text-center px-5 py-3">HOD Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departmentLeaves.map((item) => {
                    const isPendingMyStage = item.status === 'Pending HOD' || item.status === 'Pending';
                    return (
                      <tr key={item._id || item.id} className="hover:bg-purple-50/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-extrabold text-slate-800">{item.staffName || 'Faculty Member'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{item.staffId} • {item.department}</div>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-700">{item.leaveType}</td>
                        <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap font-medium">
                          {item.fromDate} {item.toDate && item.toDate !== item.fromDate ? `➔ ${item.toDate}` : ''}
                        </td>
                        <td className="px-4 py-3.5 text-center font-extrabold text-slate-700">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {item.days}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 max-w-xs font-medium" title={item.reason}>
                          {item.reason}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="space-y-1">
                            <div>{statusBadge(item)}</div>
                            <div className="text-[10px] text-slate-400">
                              Order: <span className="font-bold">HOD ➔ Principal ➔ MD</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {isPendingMyStage ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setReviewModalLeave(item);
                                  setReviewAction('Approved');
                                  setReviewRemarks('Recommended and forwarded to Principal');
                                }}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-[11px] shadow-xs flex items-center gap-1 cursor-pointer"
                              >
                                <span>✓ Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setReviewModalLeave(item);
                                  setReviewAction('Rejected');
                                  setReviewRemarks('');
                                }}
                                className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-[11px] cursor-pointer"
                              >
                                <span>✕ Reject</span>
                              </button>
                            </div>
                          ) : (
                            <div className="text-[11px] font-semibold text-slate-500">
                              {item.hodApproval?.status === 'Approved' ? (
                                <span className="text-emerald-700 font-bold">✓ Recommended</span>
                              ) : item.hodApproval?.status === 'Rejected' ? (
                                <span className="text-rose-700 font-bold">✕ Rejected</span>
                              ) : (
                                <span>Passed to {item.currentStage || 'Next Stage'}</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY LEAVE APPLICATIONS */}
      {(!isHod || activeTab === 'my_leaves') && (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-blue-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">Leave History & Applications</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">{leaves.length} total records</span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs font-medium">Loading leave records...</p>
          </div>
        ) : leaves.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">No leave applications yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click "Apply for Leave" above to submit a new leave request.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Leave Type</th>
                  <th className="text-left px-5 py-3">Duration</th>
                  <th className="text-center px-5 py-3">Days</th>
                  <th className="text-left px-5 py-3">Reason</th>
                  <th className="text-center px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Approver</th>
                  <th className="text-center px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leaves.map((item) => (
                  <tr key={item._id || item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-800">{item.leaveType || item.type}</td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap font-medium">
                      {item.fromDate || item.from} {item.toDate && item.toDate !== item.fromDate ? `→ ${item.toDate}` : ''}
                    </td>
                    <td className="px-5 py-3.5 text-center font-extrabold text-slate-700">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {item.days}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate font-medium" title={item.reason}>
                      {item.reason}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        <div>{statusBadge(item)}</div>
                        {/* Multi-Tier Approval Pipeline Tracker */}
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 pt-0.5">
                          <span className={`px-1.5 py-0.5 rounded ${item.hodApproval?.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 font-extrabold' : item.hodApproval?.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                            HOD {item.hodApproval?.status === 'Approved' ? '✓' : item.hodApproval?.status === 'Rejected' ? '✕' : '⏳'}
                          </span>
                          <span>➔</span>
                          <span className={`px-1.5 py-0.5 rounded ${item.principalApproval?.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 font-extrabold' : item.principalApproval?.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-500'}`}>
                            Principal {item.principalApproval?.status === 'Approved' ? '✓' : item.principalApproval?.status === 'Rejected' ? '✕' : (item.status === 'Pending Principal' ? '⏳' : '○')}
                          </span>
                          <span>➔</span>
                          <span className={`px-1.5 py-0.5 rounded ${item.mdApproval?.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 font-extrabold' : item.mdApproval?.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-500'}`}>
                            MD {item.mdApproval?.status === 'Approved' ? '✓' : item.mdApproval?.status === 'Rejected' ? '✕' : (item.status === 'Pending MD' ? '⏳' : '○')}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-medium">
                      <div>{item.approvedBy || 'In Review'}</div>
                      {item.remarks && (
                        <p className="text-[10px] text-slate-400 italic mt-0.5">"{item.remarks}"</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {item.status === 'Pending' ? (
                        <button
                          onClick={() => handleCancelLeave(item._id)}
                          title="Cancel Application"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* HOD Review & Stage Approval Modal */}
      {reviewModalLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => !isProcessingApproval && setReviewModalLeave(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg text-white font-bold text-xs ${reviewAction === 'Approved' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                  {reviewAction === 'Approved' ? '✓' : '✕'}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {reviewAction === 'Approved' ? 'Recommend & Forward to Principal' : 'Reject Staff Leave Application'}
                </h3>
              </div>
              <button 
                onClick={() => setReviewModalLeave(null)} 
                disabled={isProcessingApproval}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl mb-4 text-xs space-y-1.5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Faculty Member:</span>
                <span className="font-bold text-slate-900">{reviewModalLeave.staffName} ({reviewModalLeave.staffId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Leave Type & Duration:</span>
                <span className="font-bold text-slate-900">{reviewModalLeave.leaveType} ({reviewModalLeave.days} Days)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Dates:</span>
                <span className="font-semibold text-slate-800">{reviewModalLeave.fromDate} ➔ {reviewModalLeave.toDate}</span>
              </div>
              <div className="pt-1 text-slate-600 italic">
                Reason: "{reviewModalLeave.reason}"
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  HOD Remarks / Recommendation Notes
                </label>
                <textarea
                  rows="3"
                  placeholder={reviewAction === 'Approved' ? 'e.g. Work adjusted with alternate faculty. Recommended for approval.' : 'Reason for rejection...'}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isProcessingApproval}
                  onClick={() => setReviewModalLeave(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessingApproval}
                  onClick={() => handleStageApproval(reviewModalLeave._id, reviewAction, reviewRemarks)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                    reviewAction === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isProcessingApproval && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {reviewAction === 'Approved' ? 'Confirm & Pass to Principal' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Application Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Apply for Leave (HOD ➔ Principal ➔ MD)</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Approval workflow: HOD Recommendation ➔ Principal Review ➔ MD Final Approval
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-2.5 mb-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Casual Leave">Casual Leave (CL)</option>
                  <option value="Medical Leave">Medical Leave (ML)</option>
                  <option value="On Duty">On Duty (OD) / Conference</option>
                  <option value="Special Casual Leave">Special Casual Leave</option>
                </select>
                <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Policy allowance: {summary.quotaBreakdown || '12 Casual + 3 Special'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">From Date</label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">To Date</label>
                  <input
                    type="date"
                    required
                    value={toDate}
                    min={fromDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {fromDate && toDate && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Calculated Leave Duration:</span>
                  <span className="font-extrabold text-blue-600">{selectedDays} Day{selectedDays > 1 ? 's' : ''}</span>
                </div>
              )}


              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Leave</label>
                <textarea
                  rows="3"
                  required
                  placeholder="State the reason clearly for HoD recommendation..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {submitting ? 'Submitting...' : 'Submit to HoD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
