import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Printer, 
  Plus, 
  DollarSign, 
  AlertCircle, 
  TrendingUp, 
  XCircle, 
  Eye, 
  CheckCircle2, 
  Search, 
  Filter, 
  X,
  CreditCard,
  Calendar,
  User,
  BookOpen,
  Receipt,
  Download,
  ArrowLeft,
  Save,
  RotateCcw,
  Info,
  FileText
} from 'lucide-react';
import ExamFeesManagement from './ExamFeesManagement';
import TuitionFeesManagement from './TuitionFeesManagement';
import TransportFeesManagement from './TransportFeesManagement';

export default function FeeManagement({ defaultFeeType = 'All' }) {
  // Mode state: 'list' or 'form'
  const [viewMode, setViewMode] = useState('list');
  const [activeTab, setActiveTab] = useState('Exam Fees');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [courseFilter, setCourseFilter] = useState('All');
  const [feeTypeFilter, setFeeTypeFilter] = useState('All');
  
  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);

  // Success Confirmation Card/Modal state
  const [savedSuccessData, setSavedSuccessData] = useState(null);
  
  // Modals state for List View
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedStudentForPay, setSelectedStudentForPay] = useState(null);
  const [selectedStudentForView, setSelectedStudentForView] = useState(null);
  const [selectedReceiptStudent, setSelectedReceiptStudent] = useState(null);

  // Blank initial form state for own typing
  const emptyEntryForm = {
    studentId: '',
    studentName: '',
    rollNo: '',
    course: '',
    academicYear: '',
    feeType: 'Exam Fees',
    routeStop: '',
    vehicleNo: '',
    amount: '',
    dueDate: '',
    fine: '0',
    totalAmount: '',
    paymentMode: 'UPI',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNo: '',
    balance: '0'
  };

  const [entryFormData, setEntryFormData] = useState(emptyEntryForm);

  // Sync prop changes with active view/tab
  useEffect(() => {
    if (defaultFeeType && defaultFeeType !== 'All') {
      setViewMode('form');
      setActiveTab(defaultFeeType);
      setFeeTypeFilter(defaultFeeType);
      setEntryFormData(prev => ({
        ...emptyEntryForm,
        feeType: defaultFeeType
      }));
    } else {
      setViewMode('list');
      setFeeTypeFilter('All');
    }
  }, [defaultFeeType]);

  // Form state for Record Payment Modal (List View)
  const [payFormData, setPayFormData] = useState({
    studentId: '',
    amount: '',
    feeType: 'Exam Fees',
    paymentMethod: 'UPI / Online',
    referenceNo: '',
    remarks: ''
  });

  // Sample student fee records
  const [feeRecords, setFeeRecords] = useState([
    {
      id: 'STU001',
      name: 'Arjun Sharma',
      avatar: 'A',
      course: 'B.Tech CS',
      feeType: 'Tuition Fees',
      totalFee: 120000,
      totalFeeDisplay: '₹120K',
      paidFee: 120000,
      paidFeeDisplay: '₹120K',
      pendingFee: 0,
      pendingFeeDisplay: '-',
      dueDate: '2024-12-15',
      status: 'Paid',
      phone: '9876543210',
      email: 'arjun.s@vcas.edu'
    },
    {
      id: 'STU002',
      name: 'Priya Mehta',
      avatar: 'P',
      course: 'B.Tech ECE',
      feeType: 'Exam Fees',
      totalFee: 115000,
      totalFeeDisplay: '₹115K',
      paidFee: 60000,
      paidFeeDisplay: '₹60K',
      pendingFee: 55000,
      pendingFeeDisplay: '₹55K',
      dueDate: '2024-11-30',
      status: 'Pending',
      phone: '9876543211',
      email: 'priya.m@vcas.edu'
    },
    {
      id: 'STU003',
      name: 'Rahul Verma',
      avatar: 'R',
      course: 'MBA',
      feeType: 'Transport Fees',
      totalFee: 180000,
      totalFeeDisplay: '₹180K',
      paidFee: 90000,
      paidFeeDisplay: '₹90K',
      pendingFee: 90000,
      pendingFeeDisplay: '₹90K',
      dueDate: '2024-11-15',
      status: 'Overdue',
      phone: '9876543212',
      email: 'rahul.v@vcas.edu'
    },
    {
      id: 'STU004',
      name: 'Sneha Nair',
      avatar: 'S',
      course: 'MCA',
      feeType: 'Tuition Fees',
      totalFee: 95000,
      totalFeeDisplay: '₹95K',
      paidFee: 95000,
      paidFeeDisplay: '₹95K',
      pendingFee: 0,
      pendingFeeDisplay: '-',
      dueDate: '2024-12-20',
      status: 'Paid',
      phone: '9876543213',
      email: 'sneha.n@vcas.edu'
    },
    {
      id: 'STU005',
      name: 'Karthik Rajan',
      avatar: 'K',
      course: 'B.Tech Mech',
      feeType: 'Exam Fees',
      totalFee: 110000,
      totalFeeDisplay: '₹110K',
      paidFee: 40000,
      paidFeeDisplay: '₹40K',
      pendingFee: 70000,
      pendingFeeDisplay: '₹70K',
      dueDate: '2024-10-31',
      status: 'Overdue',
      phone: '9876543214',
      email: 'karthik.r@vcas.edu'
    }
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTabSwitch = (tabName) => {
    setActiveTab(tabName);
    setEntryFormData(prev => ({
      ...prev,
      feeType: tabName
    }));
  };

  // Form Submission -> Triggers Confirmation Modal with Print & OK buttons
  const handleSaveEntrySubmit = (e) => {
    e.preventDefault();
    const amountNum = parseFloat(entryFormData.amount || entryFormData.totalAmount) || 5000;
    const feeTypeName = entryFormData.feeType || activeTab || 'Exam Fees';
    const formattedAmount = `₹${amountNum.toLocaleString('en-IN')}`;

    setSavedSuccessData({
      message: `${feeTypeName} entry of ${formattedAmount} saved successfully!`,
      studentName: entryFormData.studentName || 'Priya Mehta',
      rollNo: entryFormData.rollNo || 'STU002',
      course: entryFormData.course || 'B.Tech ECE',
      feeType: feeTypeName,
      amount: formattedAmount,
      date: entryFormData.dueDate || entryFormData.paymentDate || new Date().toISOString().split('T')[0],
      referenceNo: entryFormData.referenceNo || 'TXN1234567890',
      paymentMode: entryFormData.paymentMode || 'Online'
    });
  };

  const handleOpenPayModal = (student) => {
    setSelectedStudentForPay(student);
    setPayFormData({
      studentId: student ? student.id : '',
      amount: student && student.pendingFee > 0 ? student.pendingFee : '',
      feeType: student ? student.feeType : 'Exam Fees',
      paymentMethod: 'UPI / Online',
      referenceNo: 'PAY' + Math.floor(100000 + Math.random() * 900000),
      remarks: ''
    });
  };

  const handleRecordPaymentSubmit = (e) => {
    e.preventDefault();
    const targetStudentId = selectedStudentForPay ? selectedStudentForPay.id : payFormData.studentId;
    const amountNum = parseFloat(payFormData.amount) || 0;

    if (!targetStudentId || amountNum <= 0) {
      alert('Please select a valid student and enter payment amount.');
      return;
    }

    setFeeRecords(prev => prev.map(rec => {
      if (rec.id === targetStudentId) {
        const newPaid = rec.paidFee + amountNum;
        const newPending = Math.max(0, rec.totalFee - newPaid);
        const newStatus = newPending === 0 ? 'Paid' : 'Pending';
        
        return {
          ...rec,
          paidFee: newPaid,
          paidFeeDisplay: `₹${(newPaid / 1000).toFixed(0)}K`,
          pendingFee: newPending,
          pendingFeeDisplay: newPending === 0 ? '-' : `₹${(newPending / 1000).toFixed(0)}K`,
          status: newStatus
        };
      }
      return rec;
    }));

    showToast(`Payment of ₹${amountNum.toLocaleString()} successfully recorded!`);
    setShowRecordModal(false);
    setSelectedStudentForPay(null);
  };

  // Filter students based on search, status, course, feeType
  const filteredRecords = feeRecords.filter(rec => {
    const matchesSearch = rec.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          rec.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rec.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || rec.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesCourse = courseFilter === 'All' || rec.course.toLowerCase().includes(courseFilter.toLowerCase());
    const matchesFeeType = feeTypeFilter === 'All' || rec.feeType === feeTypeFilter;
    return matchesSearch && matchesStatus && matchesCourse && matchesFeeType;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {viewMode === 'form' ? `${activeTab} Management` : 'Fee Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">Track and manage student fee payments</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Back to List Button */}
          {viewMode === 'form' ? (
            <button 
              onClick={() => {
                setViewMode('list');
                setFeeTypeFilter('All');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Back to List</span>
            </button>
          ) : (
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-all"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print</span>
            </button>
          )}
        </div>
      </div>

      {/* RENDER FORM VIEW (WHEN VIEW MODE IS 'form' or FEE TAB IS CLICKED) */}
      {viewMode === 'form' ? (
        <div className="space-y-6">
          {activeTab === 'Transport Fees' ? (
            <TransportFeesManagement 
              entryFormData={entryFormData}
              setEntryFormData={setEntryFormData}
              handleSaveEntrySubmit={handleSaveEntrySubmit}
            />
          ) : activeTab === 'Tuition Fees' ? (
            <TuitionFeesManagement 
              entryFormData={entryFormData}
              setEntryFormData={setEntryFormData}
              handleSaveEntrySubmit={handleSaveEntrySubmit}
            />
          ) : (
            <ExamFeesManagement 
              entryFormData={entryFormData}
              setEntryFormData={setEntryFormData}
              handleSaveEntrySubmit={handleSaveEntrySubmit}
            />
          )}
        </div>
      ) : (
        /* RENDER MAIN LIST VIEW (TABLE & CARDS) */
        <div className="space-y-6">

          {/* 4 SUMMARY STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            
            {/* 1. TOTAL COLLECTION */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                  TOTAL COLLECTION
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">
                  ₹48.6L
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center font-bold shrink-0">
                <span className="text-base font-medium">$</span>
              </div>
            </div>

            {/* 2. PENDING FEES */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                  PENDING FEES
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-500 leading-none">
                  ₹4.8L
                </p>
              </div>
              <div className="w-9 h-9 rounded-full border border-amber-300 bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            {/* 3. TODAY'S COLLECTION */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                  TODAY'S COLLECTION
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 leading-none">
                  ₹2.1L
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl text-emerald-500 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* 4. OVERDUE PAYMENTS */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                  OVERDUE PAYMENTS
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 leading-none">
                  42
                </p>
              </div>
              <div className="w-9 h-9 rounded-full border border-rose-300 bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* FILTER & SEARCH BAR */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search student, course, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Fee Type Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500 font-medium">Fee Type:</span>
                <select
                  value={feeTypeFilter}
                  onChange={(e) => setFeeTypeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 py-1.5 px-3 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="All">All Fee Types</option>
                  <option value="Tuition Fees">Tuition Fees</option>
                  <option value="Exam Fees">Exam Fees</option>
                  <option value="Transport Fees">Transport Fees</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 py-1.5 px-3 focus:outline-none focus:border-blue-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Course:</span>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 py-1.5 px-3 focus:outline-none focus:border-blue-500"
                >
                  <option value="All">All Courses</option>
                  <option value="B.Tech">B.Tech</option>
                  <option value="MBA">MBA</option>
                  <option value="MCA">MCA</option>
                </select>
              </div>
            </div>
          </div>

          {/* STUDENT FEES TABLE */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                    <th className="py-3.5 px-5">STUDENT</th>
                    <th className="py-3.5 px-5">COURSE</th>
                    <th className="py-3.5 px-5">FEE TYPE</th>
                    <th className="py-3.5 px-5">TOTAL FEE</th>
                    <th className="py-3.5 px-5">PAID</th>
                    <th className="py-3.5 px-5">PENDING</th>
                    <th className="py-3.5 px-5">DUE DATE</th>
                    <th className="py-3.5 px-5">STATUS</th>
                    <th className="py-3.5 px-5 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-all">
                        {/* Student Info */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-200/90 text-slate-600 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-300/50">
                              {row.avatar}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">{row.name}</p>
                              <p className="text-[11px] text-slate-400 font-medium">{row.id}</p>
                            </div>
                          </div>
                        </td>

                        {/* Course */}
                        <td className="py-4 px-5 text-slate-800 font-medium">
                          {row.course}
                        </td>

                        {/* Fee Type */}
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 select-none">
                            {row.feeType}
                          </span>
                        </td>

                        {/* Total Fee */}
                        <td className="py-4 px-5 font-bold text-slate-900">
                          {row.totalFeeDisplay}
                        </td>

                        {/* Paid */}
                        <td className="py-4 px-5 font-bold text-emerald-600">
                          {row.paidFeeDisplay}
                        </td>

                        {/* Pending */}
                        <td className="py-4 px-5 font-bold text-rose-500">
                          {row.pendingFeeDisplay}
                        </td>

                        {/* Due Date */}
                        <td className="py-4 px-5 text-slate-500 font-medium">
                          {row.dueDate}
                        </td>

                        {/* Status Pill */}
                        <td className="py-4 px-5">
                          {row.status === 'Paid' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                              Paid
                            </span>
                          ) : row.status === 'Pending' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                              Overdue
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5">
                          <div className="flex items-center justify-center gap-3 text-slate-400">
                            {/* Eye icon */}
                            <button 
                              onClick={() => setSelectedStudentForView(row)}
                              title="View Fee Details"
                              className="hover:text-slate-700 transition-colors p-1"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Pay Button */}
                            <button 
                              onClick={() => {
                                handleOpenPayModal(row);
                                setShowRecordModal(true);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold border border-slate-200 text-slate-700 rounded-md hover:bg-slate-100 transition-all shadow-2xs"
                            >
                              Pay
                            </button>

                            {/* Printer Icon */}
                            <button 
                              onClick={() => setSelectedReceiptStudent(row)}
                              title="Print Receipt"
                              className="hover:text-slate-700 transition-colors p-1"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-slate-400 text-xs font-medium">
                        No fee records found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SAVE ENTRY SUCCESS CONFIRMATION MODAL WITH PRINT & OK BUTTONS */}
      {savedSuccessData && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-xl w-full border border-slate-200 shadow-2xl space-y-7 text-center transform transition-all">
            
            {/* Success Checkmark Circle Icon */}
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
              <CheckCircle2 className="w-11 h-11" />
            </div>

            {/* Requested Exact Title Text */}
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {savedSuccessData.message}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                The fee payment entry has been successfully recorded.
              </p>
            </div>

            {/* Detailed Transaction Summary Card */}
            <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200/80 space-y-3 text-xs sm:text-sm text-left">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Student:</span>
                <span className="font-bold text-slate-900">{savedSuccessData.studentName}</span>
              </div>
              {savedSuccessData.rollNo && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Roll No:</span>
                  <span className="font-bold text-slate-800">{savedSuccessData.rollNo}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Course:</span>
                <span className="font-bold text-slate-800">{savedSuccessData.course}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Fee Category:</span>
                <span className="font-bold text-blue-600">{savedSuccessData.feeType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Amount Saved:</span>
                <span className="font-extrabold text-emerald-600 text-base">{savedSuccessData.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Date:</span>
                <span className="font-bold text-slate-800">{savedSuccessData.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Payment Mode:</span>
                <span className="font-semibold text-slate-700">{savedSuccessData.paymentMode}</span>
              </div>
              {savedSuccessData.referenceNo && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Reference No:</span>
                  <span className="font-mono font-medium text-slate-700">{savedSuccessData.referenceNo}</span>
                </div>
              )}
            </div>

            {/* 2 BUTTONS: PRINT AND OK */}
            <div className="flex items-center gap-4 pt-2">
              {/* Print Button */}
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3.5 px-6 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl text-sm transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print</span>
              </button>

              {/* OK Button */}
              <button
                type="button"
                onClick={() => {
                  setSavedSuccessData(null);
                  setEntryFormData(emptyEntryForm);
                  setViewMode('list');
                }}
                className="flex-1 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-blue-500/25"
              >
                OK
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* MODAL 1: RECORD / PAY PAYMENT MODAL */}
      {showRecordModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  {selectedStudentForPay ? `Record Payment – ${selectedStudentForPay.name}` : 'Record Fee Payment'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Submit student transaction details</p>
              </div>
              <button 
                onClick={() => setShowRecordModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs font-medium">
              
              {/* Select Student if none pre-selected */}
              {!selectedStudentForPay && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select Student</label>
                  <select
                    value={payFormData.studentId}
                    onChange={(e) => {
                      const st = feeRecords.find(r => r.id === e.target.value);
                      setPayFormData(prev => ({
                        ...prev,
                        studentId: e.target.value,
                        amount: st && st.pendingFee > 0 ? st.pendingFee : ''
                      }));
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-blue-500"
                    required
                  >
                    <option value="">Select a student...</option>
                    {feeRecords.map(rec => (
                      <option key={rec.id} value={rec.id}>
                        {rec.name} ({rec.id}) - Pending: {rec.pendingFeeDisplay}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fee Type Dropdown */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Fee Category / Type</label>
                <select
                  value={payFormData.feeType}
                  onChange={(e) => setPayFormData({...payFormData, feeType: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-blue-500"
                >
                  <option value="Exam Fees">Exam Fees</option>
                  <option value="Tuition Fees">Tuition Fees</option>
                  <option value="Transport Fees">Transport Fees</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Payment Amount (₹)</label>
                <input 
                  type="number"
                  placeholder="Enter amount (e.g. 50000)"
                  value={payFormData.amount}
                  onChange={(e) => setPayFormData({...payFormData, amount: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-blue-500 text-sm font-semibold"
                  required
                />
              </div>

              {/* Payment Mode & Ref No */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Mode</label>
                  <select
                    value={payFormData.paymentMethod}
                    onChange={(e) => setPayFormData({...payFormData, paymentMethod: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-blue-500"
                  >
                    <option value="UPI / Online">UPI / Online</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Transaction Ref No.</label>
                  <input 
                    type="text"
                    value={payFormData.referenceNo}
                    onChange={(e) => setPayFormData({...payFormData, referenceNo: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20"
                >
                  Confirm Payment
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: VIEW STUDENT FEE DETAILS */}
      {selectedStudentForView && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                  {selectedStudentForView.avatar}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">{selectedStudentForView.name}</h3>
                  <p className="text-xs text-slate-500">{selectedStudentForView.id} • {selectedStudentForView.course}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudentForView(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Fee Type:</span>
                <span className="font-extrabold text-blue-600">{selectedStudentForView.feeType}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Total Course Fee:</span>
                <span className="font-extrabold text-slate-900">₹{selectedStudentForView.totalFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Amount Paid:</span>
                <span className="font-extrabold text-emerald-600">₹{selectedStudentForView.paidFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Pending Balance:</span>
                <span className="font-extrabold text-rose-500">₹{selectedStudentForView.pendingFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Due Date:</span>
                <span className="font-bold text-slate-800">{selectedStudentForView.dueDate}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="font-bold text-slate-800">{selectedStudentForView.status}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Email / Phone:</span>
                <span className="font-medium text-slate-700">{selectedStudentForView.email}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedStudentForView(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: PRINT RECEIPT PREVIEW */}
      {selectedReceiptStudent && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Fee Payment Receipt</h3>
              </div>
              <button 
                onClick={() => setSelectedReceiptStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Card */}
            <div className="p-5 border border-slate-200 bg-slate-50 rounded-2xl space-y-4 text-xs">
              <div className="text-center border-b border-slate-200 pb-3">
                <h2 className="font-extrabold text-sm text-slate-900 uppercase">VIVEKANANDA COLLEGE OF ARTS AND SCIENCE</h2>
                <p className="text-[11px] text-slate-600 font-bold">Vellalankulam</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Official Fee Receipt</p>
                <p className="text-[10px] text-slate-400 mt-1">Receipt #: REC-2024-00{selectedReceiptStudent.id.slice(-3)}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div><span className="font-bold">Student Name:</span> {selectedReceiptStudent.name}</div>
                <div><span className="font-bold">Student ID:</span> {selectedReceiptStudent.id}</div>
                <div><span className="font-bold">Course:</span> {selectedReceiptStudent.course}</div>
                <div><span className="font-bold">Fee Category:</span> {selectedReceiptStudent.feeType}</div>
                <div><span className="font-bold">Date:</span> {new Date().toLocaleDateString()}</div>
              </div>

              <div className="border-t border-b border-slate-200 py-3 space-y-1">
                <div className="flex justify-between">
                  <span>Total Course Fee:</span>
                  <span className="font-bold">₹{selectedReceiptStudent.totalFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Amount Paid:</span>
                  <span>₹{selectedReceiptStudent.paidFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-500 font-bold">
                  <span>Remaining Balance:</span>
                  <span>₹{selectedReceiptStudent.pendingFee.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 italic">
                This is a computer-generated receipt and requires no physical signature.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedReceiptStudent(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
