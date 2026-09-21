import React, { useState, useEffect } from 'react';
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

  // Fetch leaves from MongoDB
  const fetchLeaves = async () => {
    if (!staffId) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/leave/staff/${staffId}`);
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

  useEffect(() => {
    fetchLeaves();
  }, [staffId]);

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
      const res = await fetch(`http://localhost:5000/api/leave/staff/${staffId}`, {
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
      const res = await fetch(`http://localhost:5000/api/leave/${leaveId}`, {
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

  const statusBadge = (status) => {
    if (status === 'Approved') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Approved
        </span>
      );
    }
    if (status === 'Pending') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 animate-pulse">
          <Clock3 className="w-3.5 h-3.5 text-amber-600" />
          Pending
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200/60">
        <XCircle className="w-3.5 h-3.5 text-rose-600" />
        Rejected
      </span>
    );
  };

  const selectedDays = calculateDays();
  const isOverQuota = selectedDays > (summary.remainingDays || 0);

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

      {/* Quota Cards (Dynamic Admin-Configured Quota) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Annual Leave Quota */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Annual Leave Quota</p>
            {summary.academicYear && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                AY {summary.academicYear}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900">{summary.totalQuota ?? 15}</span>
            <span className="text-xs text-slate-400 font-medium">days / year</span>
            {summary.isCustomQuota && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 ml-auto">
                Custom Quota
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 mt-2.5 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            {summary.quotaBreakdown || `${summary.casualLeaves || 12} Casual + ${summary.specialCasualLeaves || 3} Special`}
          </p>
        </div>

        {/* Card 2: Leaves Availed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Leaves Availed</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              Live Approved
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-blue-600">{summary.approvedDays ?? 0}</span>
            <span className="text-xs text-slate-400 font-medium">days approved</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2.5 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-slate-800">{summary.remainingDays ?? 0} days</span> remaining
          </p>
        </div>

        {/* Card 3: Pending Approvals */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</p>
            {summary.pendingCount > 0 ? (
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
            <span className="text-3xl font-black text-amber-600">{summary.pendingCount ?? 0}</span>
            <span className="text-xs text-slate-400 font-medium">requests</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2.5 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Under review by HoD / Principal
          </p>
        </div>
      </div>

      {/* Leave Application Records */}
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
                    <td className="px-5 py-3.5 text-center">
                      {statusBadge(item.status)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-medium">
                      <div>{item.approvedBy || '—'}</div>
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

      {/* Leave Application Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Apply for Leave (HoD Approval)</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Quota remaining: <strong className="text-slate-700">{summary.remainingDays} days</strong>
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

              {isOverQuota && (
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px] font-semibold">
                  <Info className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Notice: Applying for {selectedDays} days will exceed your remaining annual quota ({summary.remainingDays} days).</span>
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
