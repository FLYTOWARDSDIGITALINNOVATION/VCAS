import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { LEAVE_DATA } from './staffData';

export default function StaffLeave({ staffUser }) {
  const [leaves, setLeaves] = useState(() => {
    return LEAVE_DATA[staffUser.staffId] || [];
  });

  const [showModal, setShowModal] = useState(false);
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Calculate used leave
  const approvedCount = leaves.filter(l => l.status === 'Approved').reduce((acc, l) => acc + l.days, 0);
  const pendingCount = leaves.filter(l => l.status === 'Pending').length;

  const handleApplyLeave = (e) => {
    e.preventDefault();
    if (!fromDate || !toDate || !reason.trim()) return;

    // calculate days approx
    const d1 = new Date(fromDate);
    const d2 = new Date(toDate);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newRecord = {
      id: `LV-${Date.now()}`,
      type: leaveType,
      from: fromDate,
      to: toDate,
      days: diffDays > 0 ? diffDays : 1,
      reason: reason.trim(),
      status: 'Pending',
      approvedBy: '-'
    };

    setLeaves(prev => [newRecord, ...prev]);
    setShowModal(false);
    setReason('');
    setFromDate('');
    setToDate('');
    setSuccessMsg('Leave application submitted successfully! It is pending HoD/Principal approval.');
    setTimeout(() => setSuccessMsg(''), 5000);
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
        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60">
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

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Leave Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Apply for leave, track approval status, and manage leave balance
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {/* Quota Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Annual Leave Quota</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-900">15</span>
            <span className="text-xs text-slate-400">days / year</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">12 Casual + 3 Special</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Leaves Availed</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-blue-600">{approvedCount}</span>
            <span className="text-xs text-slate-400">days approved</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">{Math.max(0, 15 - approvedCount)} days remaining</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-amber-600">{pendingCount}</span>
            <span className="text-xs text-slate-400">requests</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Under review by Administration</p>
        </div>
      </div>

      {/* Leave Application Records */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-sm">Leave History & Applications</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Leave Type</th>
                <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Days</th>
                <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Approver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leaves.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-800">{item.type}</td>
                  <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                    {item.from} {item.to !== item.from && `to ${item.to}`}
                  </td>
                  <td className="px-5 py-3.5 text-center font-extrabold text-slate-700">
                    {item.days}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">
                    {item.reason}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {statusBadge(item.status)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-medium">
                    {item.approvedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Application Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-slate-900 text-base">Apply for Leave</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

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
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

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
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white shadow-md shadow-blue-500/20"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
