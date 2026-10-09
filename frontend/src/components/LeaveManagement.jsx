import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  FileText,
  Sliders,
  Settings,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Info,
  Layers,
  UserCog
} from 'lucide-react';

const DEPARTMENTS = [
  'All Departments',
  'Commerce',
  'Computer Science',
  'English Literature',
  'Business Administration (BBA)',
  'Computer Applications (BCA)',
  'Mathematics'
];

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState({
    totalApplications: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0
  });
  const [quotaPolicy, setQuotaPolicy] = useState({
    annualQuota: 15,
    casualLeaves: 12,
    specialCasualLeaves: 3,
    medicalLeaves: 5,
    onDutyLeaves: 5,
    academicYear: '2025-2026',
    description: '12 Casual + 3 Special',
    updatedBy: 'Admin',
    staffOverrides: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [rejectModalLeave, setRejectModalLeave] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Quota Modal State
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [savingQuota, setSavingQuota] = useState(false);
  const [quotaFormData, setQuotaFormData] = useState({
    annualQuota: 15,
    casualLeaves: 12,
    specialCasualLeaves: 3,
    medicalLeaves: 5,
    onDutyLeaves: 5,
    academicYear: '2025-2026',
    description: '12 Casual + 3 Special',
    policyName: 'Faculty Annual Leave Policy'
  });

  // Custom Staff Quota Override State
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffOverride, setSelectedStaffOverride] = useState('');
  const [overrideQuota, setOverrideQuota] = useState(15);
  const [overrideNotes, setOverrideNotes] = useState('');
  const [savingOverride, setSavingOverride] = useState(false);
  const [quotaModalTab, setQuotaModalTab] = useState('global'); // 'global' or 'staff'

  const fetchQuotaSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/leave/quota-settings');
      const data = await res.json();
      if (res.ok && data.success && data.policy) {
        setQuotaPolicy(data.policy);
        setQuotaFormData({
          annualQuota: data.policy.annualQuota ?? 15,
          casualLeaves: data.policy.casualLeaves ?? 12,
          specialCasualLeaves: data.policy.specialCasualLeaves ?? 3,
          medicalLeaves: data.policy.medicalLeaves ?? 5,
          onDutyLeaves: data.policy.onDutyLeaves ?? 5,
          academicYear: data.policy.academicYear ?? '2025-2026',
          description: data.policy.description ?? '12 Casual + 3 Special',
          policyName: data.policy.policyName ?? 'Faculty Annual Leave Policy'
        });
      }
    } catch (err) {
      console.error('Failed to load quota settings:', err);
    }
  };

  const fetchStaffList = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/staff');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setStaffList(data.data);
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    }
  };

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
          if (data.summary.activePolicy) {
            setQuotaPolicy((prev) => ({ ...prev, ...data.summary.activePolicy }));
          }
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
    fetchQuotaSettings();
    fetchStaffList();
  }, [selectedStatus, selectedDept]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchLeaves();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Client-side filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter((item) => {
      const q = (searchTerm || '').toLowerCase().trim();
      const matchSearch = !q || (
        String(item.staffName || '').toLowerCase().includes(q) ||
        String(item.staffId || '').toLowerCase().includes(q) ||
        String(item.reason || '').toLowerCase().includes(q) ||
        String(item.leaveType || '').toLowerCase().includes(q) ||
        String(item.department || '').toLowerCase().includes(q)
      );
      const matchStatus = selectedStatus === 'All' || (item.status || '').toLowerCase() === selectedStatus.toLowerCase();
      const matchDept = selectedDept === 'All' || selectedDept === 'All Departments' || item.department === selectedDept;
      return matchSearch && matchStatus && matchDept;
    });
  }, [leaves, searchTerm, selectedStatus, selectedDept]);

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

  const handleSaveQuotaSettings = async (e) => {
    e.preventDefault();
    setSavingQuota(true);

    try {
      const res = await fetch('http://localhost:5000/api/leave/quota-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quotaFormData,
          updatedBy: 'Admin (Principal / HoD)'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Faculty Leave Quota & Policy updated! Live on staff portal.');
        setQuotaPolicy(data.policy);
        setShowQuotaModal(false);
        fetchLeaves();
      } else {
        alert(data.message || 'Failed to update leave quota policy.');
      }
    } catch (err) {
      alert('Unable to connect to backend.');
    } finally {
      setSavingQuota(false);
    }
  };

  const handleSaveStaffOverride = async (e) => {
    e.preventDefault();
    if (!selectedStaffOverride) return;

    setSavingOverride(true);
    const staffObj = staffList.find((s) => s.staffId === selectedStaffOverride);

    try {
      const res = await fetch(`http://localhost:5000/api/leave/quota-settings/staff/${selectedStaffOverride}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffName: staffObj?.name || '',
          annualQuota: overrideQuota,
          notes: overrideNotes.trim() || `${overrideQuota} Days Custom Quota`
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Custom quota assigned to ${staffObj?.name || selectedStaffOverride}!`);
        setQuotaPolicy(data.policy);
        setSelectedStaffOverride('');
        setOverrideNotes('');
      } else {
        alert(data.message || 'Failed to set staff override quota.');
      }
    } catch (err) {
      alert('Unable to save staff custom quota.');
    } finally {
      setSavingOverride(false);
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
      {toastMsg && typeof document !== 'undefined' && createPortal(
        <div className="fixed top-5 right-5 z-[99999] flex items-center gap-2 p-3 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-3 border border-emerald-500 pointer-events-auto">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>,
        document.body
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
                Review faculty leave applications, approve or reject requests, and manage leave quota policies
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          {/* Configure Quotas Button */}
          <button
            onClick={() => {
              setQuotaFormData({
                annualQuota: quotaPolicy.annualQuota ?? 15,
                casualLeaves: quotaPolicy.casualLeaves ?? 12,
                specialCasualLeaves: quotaPolicy.specialCasualLeaves ?? 3,
                medicalLeaves: quotaPolicy.medicalLeaves ?? 5,
                onDutyLeaves: quotaPolicy.onDutyLeaves ?? 5,
                academicYear: quotaPolicy.academicYear ?? '2025-2026',
                description: quotaPolicy.description ?? '12 Casual + 3 Special',
                policyName: quotaPolicy.policyName ?? 'Faculty Annual Leave Policy'
              });
              setShowQuotaModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all"
          >
            <Sliders className="w-4 h-4" />
            <span>Manage Leave Quota</span>
          </button>

          <button
            onClick={() => {
              fetchLeaves();
              fetchQuotaSettings();
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Admin Policy Overview Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/30 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                Active Leave Policy
              </span>
              <span className="text-xs text-slate-400 font-medium">AY {quotaPolicy.academicYear}</span>
            </div>
            <h2 className="text-lg font-black text-white mt-1">
              Annual Quota: {quotaPolicy.annualQuota} Days / Year
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              Policy Breakdown: <span className="text-blue-300 font-bold">{quotaPolicy.description || `${quotaPolicy.casualLeaves} Casual + ${quotaPolicy.specialCasualLeaves} Special`}</span>
              {' • '}Medical: {quotaPolicy.medicalLeaves || 5} Days {' • '}On-Duty: {quotaPolicy.onDutyLeaves || 5} Days
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-2 border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Enforced For</span>
              <span className="text-sm font-extrabold text-white">All Faculty</span>
            </div>
            <button
              onClick={() => {
                setQuotaFormData({
                  annualQuota: quotaPolicy.annualQuota ?? 15,
                  casualLeaves: quotaPolicy.casualLeaves ?? 12,
                  specialCasualLeaves: quotaPolicy.specialCasualLeaves ?? 3,
                  medicalLeaves: quotaPolicy.medicalLeaves ?? 5,
                  onDutyLeaves: quotaPolicy.onDutyLeaves ?? 5,
                  academicYear: quotaPolicy.academicYear ?? '2025-2026',
                  description: quotaPolicy.description ?? '12 Casual + 3 Special',
                  policyName: quotaPolicy.policyName ?? 'Faculty Annual Leave Policy'
                });
                setShowQuotaModal(true);
              }}
              className="px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-100 active:scale-95 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-blue-600" />
              Adjust Quota
            </button>
          </div>
        </div>
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
            Faculty Leave Applications ({filteredLeaves.length})
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Active Records
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            <p className="text-xs font-semibold">Loading leave records...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <UserCheck className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No leave applications found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm 
                ? `No leave records matching "${searchTerm}".`
                : selectedStatus !== 'All' 
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
                {filteredLeaves.map((item) => {
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

      {/* Manage Leave Quota & Policy Modal */}
      {showQuotaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => !savingQuota && setShowQuotaModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-7 w-full max-w-xl z-10 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Configure Leave Quotas & Policy
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Values set here immediately update all staff leave balances and display cards
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQuotaModal(false)}
                disabled={savingQuota}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-100 mb-5">
              <button
                onClick={() => setQuotaModalTab('global')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
                  quotaModalTab === 'global'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                College-wide Quota (All Faculty)
              </button>
              <button
                onClick={() => setQuotaModalTab('staff')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
                  quotaModalTab === 'staff'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Individual Staff Overrides ({quotaPolicy.staffOverrides?.length || 0})
              </button>
            </div>

            {quotaModalTab === 'global' ? (
              <form onSubmit={handleSaveQuotaSettings} className="space-y-4">
                {/* Academic Year & Policy Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      required
                      value={quotaFormData.academicYear}
                      onChange={(e) => setQuotaFormData({ ...quotaFormData, academicYear: e.target.value })}
                      placeholder="e.g. 2025-2026"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Annual Leave Quota (Total Days)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={quotaFormData.annualQuota}
                      onChange={(e) => setQuotaFormData({ ...quotaFormData, annualQuota: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Quota Breakdown inputs */}
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Leave Sub-Categories Quota
                  </p>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Casual Leaves (CL)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={quotaFormData.casualLeaves}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setQuotaFormData((prev) => ({
                            ...prev,
                            casualLeaves: val,
                            description: `${val} Casual + ${prev.specialCasualLeaves} Special`
                          }));
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Special Casual (SCL)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={quotaFormData.specialCasualLeaves}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setQuotaFormData((prev) => ({
                            ...prev,
                            specialCasualLeaves: val,
                            description: `${prev.casualLeaves} Casual + ${val} Special`
                          }));
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Medical Leaves (ML)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={quotaFormData.medicalLeaves}
                        onChange={(e) => setQuotaFormData({ ...quotaFormData, medicalLeaves: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Subtitle / Policy Breakdown Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Card Breakdown Text (Staff Side Display)
                    </label>
                    <button
                      type="button"
                      onClick={() => setQuotaFormData({
                        ...quotaFormData,
                        description: `${quotaFormData.casualLeaves} Casual + ${quotaFormData.specialCasualLeaves} Special`
                      })}
                      className="text-[10px] text-blue-600 hover:underline font-bold"
                    >
                      Reset to "{quotaFormData.casualLeaves} Casual + {quotaFormData.specialCasualLeaves} Special"
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={quotaFormData.description}
                    onChange={(e) => setQuotaFormData({ ...quotaFormData, description: e.target.value })}
                    placeholder="e.g. 12 Casual + 3 Special"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    This exact line will be shown under the Annual Leave Quota card on every faculty's portal.
                  </p>
                </div>

                {/* Live Preview on Staff Portal */}
                <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div className="flex items-center justify-between text-[11px] font-bold text-blue-900 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Live Staff Portal Preview
                    </span>
                    <span className="text-[10px] text-blue-600">Staff Portal View</span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Annual Leave Quota
                    </p>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-2xl font-black text-slate-900">
                        {quotaFormData.annualQuota}
                      </span>
                      <span className="text-xs text-slate-400">days / year</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">
                      {quotaFormData.description}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    disabled={savingQuota}
                    onClick={() => setShowQuotaModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingQuota}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    {savingQuota && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {savingQuota ? 'Saving Policy...' : 'Save & Publish Quota'}
                  </button>
                </div>
              </form>
            ) : (
              /* Tab 2: Individual Staff Custom Overrides */
              <div className="space-y-4">
                <form onSubmit={handleSaveStaffOverride} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCog className="w-3.5 h-3.5 text-blue-600" />
                    Assign Custom Quota to a Specific Faculty
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Select Staff Member
                      </label>
                      <select
                        required
                        value={selectedStaffOverride}
                        onChange={(e) => setSelectedStaffOverride(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">-- Choose Faculty --</option>
                        {staffList.map((s) => (
                          <option key={s.staffId} value={s.staffId}>
                            {s.name} ({s.staffId}) - {s.department}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Custom Annual Quota (Days)
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="60"
                        value={overrideQuota}
                        onChange={(e) => setOverrideQuota(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Custom Note / Breakdown (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 15 Casual + 5 Special (HoD Allowance)"
                      value={overrideNotes}
                      onChange={(e) => setOverrideNotes(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingOverride || !selectedStaffOverride}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl text-xs font-bold text-white shadow-xs flex items-center justify-center gap-2"
                  >
                    {savingOverride && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Assign Custom Quota
                  </button>
                </form>

                {/* Overrides List */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Existing Custom Quotas ({quotaPolicy.staffOverrides?.length || 0})
                  </p>
                  {!quotaPolicy.staffOverrides?.length ? (
                    <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No custom overrides yet. All faculty currently inherit the default {quotaPolicy.annualQuota} days quota.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {quotaPolicy.staffOverrides.map((ov) => (
                        <div key={ov.staffId} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-extrabold text-slate-900">{ov.staffName || ov.staffId}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              Staff ID: {ov.staffId} • {ov.notes || `${ov.annualQuota} Days Quota`}
                            </p>
                          </div>
                          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                            {ov.annualQuota} Days
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
