import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Clock3, 
  XCircle, 
  Search, 
  Filter, 
  Check, 
  X, 
  AlertCircle, 
  Loader2, 
  Building2, 
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';

const DEPARTMENTS = [
  'All Departments',
  'Computer Science',
  'Electronics',
  'MBA',
  'Mechanical',
  'Civil',
  'BCA'
];

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState({
    totalApplications: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [rejectModalLeave, setRejectModalLeave] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      if (selectedDept !== 'All Departments') params.append('department', selectedDept);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`http://localhost:5000/api/leave?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setLeaves(data.leaves || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load leaves for admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [selectedStatus, selectedDept]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchLeaves();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleUpdateStatus = async (leaveId, status, remarks = '') => {
    setActionLoadingId(leaveId);
    try {
      const res = await fetch(`http://localhost:5000/api/leave/${leaveId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          approvedBy: 'Admin (Principal / HoD)',
          remarks
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Leave application marked as ${status} successfully.`);
        setRejectModalLeave(null);
        setRejectReason('');
        fetchLeaves();
      } else {
        alert(data.message || 'Failed to update leave status.');
      }
    } catch (err) {
      alert('Unable to connect to backend server.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const statusBadge = (status) => {
    if (status === 'Approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Approved
        </span>
      );
    }
    if (status === 'Pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
          <Clock3 className="w-3.5 h-3.5 text-amber-600" />
          Pending Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3.5 h-3.5 text-rose-600" />
        Rejected
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-7xl mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 p-3 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Staff Leave Management & Approvals
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Review faculty leave applications, approve or reject requests, and keep records synced with database
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchLeaves}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Applications</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{summary.totalApplications}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">All department requests</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Action</p>
            {summary.pendingCount > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 bg-amber-500 text-white rounded-full">
                Action Required
              </span>
            )}
          </div>
          <p className="text-2xl font-black text-amber-600 mt-1">{summary.pendingCount}</p>
          <p className="text-[11px] text-amber-700/70 mt-0.5">Awaiting HoD / Admin approval</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approved Leaves</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{summary.approvedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Granted and recorded</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Rejected Requests</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{summary.rejectedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Declined applications</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by staff name, EMP ID, or leave reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedStatus === status
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Department Filter */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Leave Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-slate-900 text-sm">
            Faculty Leave Applications ({leaves.length})
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Live MongoDB Records
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            <p className="text-xs font-semibold">Loading leave records from database...</p>
          </div>
        ) : leaves.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <UserCheck className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No leave applications found</p>
            <p className="text-xs text-slate-400 mt-1">
              {selectedStatus !== 'All' 
                ? `There are currently no ${selectedStatus} leave applications.` 
                : 'Faculty leave submissions will appear here automatically for review.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Staff Member</th>
                  <th className="py-3.5 px-4">Leave Type</th>
                  <th className="py-3.5 px-4">Duration & Dates</th>
                  <th className="py-3.5 px-5">Reason</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-5">Approval Info</th>
                  <th className="py-3.5 px-5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((item) => {
                  const isActioning = actionLoadingId === item._id;
                  return (
                    <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Staff */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs">
                            {item.staffName ? item.staffName.substring(0, 2).toUpperCase() : 'ST'}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs leading-tight">
                              {item.staffName || 'Staff Member'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                {item.staffId}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {item.department}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Leave Type */}
                      <td className="py-4 px-4 font-bold text-slate-800">
                        {item.leaveType}
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {item.fromDate} {item.toDate && item.toDate !== item.fromDate ? `→ ${item.toDate}` : ''}
                        </div>
                        <span className="inline-block mt-0.5 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {item.days} Day{item.days > 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="py-4 px-5 max-w-xs text-slate-600 leading-relaxed font-medium">
                        <div className="truncate" title={item.reason}>
                          {item.reason}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {statusBadge(item.status)}
                      </td>

                      {/* Approver */}
                      <td className="py-4 px-5 text-slate-500 whitespace-nowrap">
                        <div className="font-medium text-slate-700 text-xs">
                          {item.approvedBy && item.approvedBy !== '-' ? item.approvedBy : '—'}
                        </div>
                        {item.remarks && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5">
                            "{item.remarks}"
                          </p>
                        )}
                      </td>

                      {/* Review Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        {isActioning ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600 inline-block" />
                        ) : item.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            {/* Accept Button */}
                            <button
                              onClick={() => handleUpdateStatus(item._id, 'Approved')}
                              title="Accept / Approve Leave"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>

                            {/* Reject Button */}
                            <button
                              onClick={() => {
                                setRejectModalLeave(item);
                                setRejectReason('');
                              }}
                              title="Reject Leave"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 active:scale-95 font-bold text-xs rounded-xl border border-rose-200 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {item.status === 'Approved' ? (
                              <button
                                onClick={() => handleUpdateStatus(item._id, 'Rejected', 'Status revised by admin')}
                                className="text-[11px] font-bold text-slate-400 hover:text-rose-600 px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                              >
                                Revoke Approval
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(item._id, 'Approved', 'Approved on reconsideration')}
                                className="text-[11px] font-bold text-slate-400 hover:text-emerald-600 px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                              >
                                Approve Request
                              </button>
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

      {/* Reject Remarks Modal */}
      {rejectModalLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-xs" 
            onClick={() => setRejectModalLeave(null)} 
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-slate-900 text-base">
                Reject Leave Application
              </h3>
              <button 
                onClick={() => setRejectModalLeave(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              You are rejecting the leave request for <strong className="text-slate-900">{rejectModalLeave.staffName}</strong> ({rejectModalLeave.days} days from {rejectModalLeave.fromDate}).
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason / Remarks for Rejection (Optional)
              </label>
              <textarea
                rows="3"
                placeholder="e.g. Critical academic session scheduled, please reschedule..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setRejectModalLeave(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(rejectModalLeave._id, 'Rejected', rejectReason)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold text-white shadow-md shadow-rose-500/20"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
