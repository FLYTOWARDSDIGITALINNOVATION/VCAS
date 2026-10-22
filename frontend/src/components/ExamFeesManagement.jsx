import React, { useState, useEffect } from 'react';
import { API_BASE } from '../apiConfig';
import { FileText, Save, User, CreditCard, Clock, AlertCircle, Search } from 'lucide-react';

export default function ExamFeesManagement({ 
  entryFormData, 
  setEntryFormData, 
  handleSaveEntrySubmit,
  studentOptions = [],
  recordsList = []
}) {
  const [isCustomStudent, setIsCustomStudent] = useState(false);
  const [adminDepartments, setAdminDepartments] = useState([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [tableDeptFilter, setTableDeptFilter] = useState('All');
  const [tableYearFilter, setTableYearFilter] = useState('All');
  const [tableBatchFilter, setTableBatchFilter] = useState('All');

  // Fetch only admin-added departments
  useEffect(() => {
    fetch(`${API_BASE}/departments`)
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setAdminDepartments(json.data);
        }
      })
      .catch(err => console.warn('Could not fetch admin departments in exam fees:', err));
  }, []);

  // Auto-fill student details from dropdown
  const handleStudentSelect = (selectedKey) => {
    if (!selectedKey) {
      setEntryFormData(prev => ({
        ...prev,
        studentName: '',
        rollNo: ''
      }));
      return;
    }

    const found = (studentOptions || []).find(s => 
      s.rollNo === selectedKey || s.id === selectedKey || s.name === selectedKey
    );

    if (found) {
      const baseAmt = parseFloat(entryFormData.amount) || 5000;
      const fineAmt = parseFloat(entryFormData.fine) || 0;
      const total = baseAmt + fineAmt;

      setEntryFormData(prev => ({
        ...prev,
        studentName: found.name,
        rollNo: found.rollNo || found.id,
        course: found.course || prev.course || 'B.Com',
        academicYear: found.academicYear || prev.academicYear || '2024 - 2025',
        amount: prev.amount || '5000',
        totalAmount: String(total),
        paidAmount: prev.paidAmount !== undefined ? prev.paidAmount : String(total),
        balance: String(Math.max(0, total - (parseFloat(prev.paidAmount !== undefined ? prev.paidAmount : total) || 0)))
      }));
    }
  };

  // Filter exam fee records to list added students
  const examRecords = (recordsList || []).filter(r => 
    (r.feeType || '').toLowerCase().includes('exam')
  );

  // Filtered student options based on search query
  const filteredStudentOptions = (studentOptions || []).filter(s => {
    if (!studentSearchTerm.trim()) return true;
    const term = studentSearchTerm.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.rollNo && s.rollNo.toLowerCase().includes(term)) ||
      (s.id && s.id.toLowerCase().includes(term)) ||
      (s.course && s.course.toLowerCase().includes(term))
    );
  });

  // Filtered exam records based on table search query and filters
  const searchedExamRecords = examRecords.filter(r => {
    const term = (tableSearchTerm || '').toLowerCase().trim();
    const matchesSearch = !term || (
      (r.name && r.name.toLowerCase().includes(term)) ||
      (r.rollNo && r.rollNo.toLowerCase().includes(term)) ||
      (r.id && r.id.toLowerCase().includes(term)) ||
      (r.course && r.course.toLowerCase().includes(term)) ||
      (r.status && r.status.toLowerCase().includes(term))
    );
    const matchesDept = tableDeptFilter === 'All' || String(r.course || '').toLowerCase().includes(tableDeptFilter.toLowerCase());
    const matchesYear = tableYearFilter === 'All' || String(r.year || '').toLowerCase() === tableYearFilter.toLowerCase();
    const matchesBatch = tableBatchFilter === 'All' || String(r.batch || r.academicYear || '').toLowerCase().includes(tableBatchFilter.toLowerCase());
    return matchesSearch && matchesDept && matchesYear && matchesBatch;
  });

  return (
    <div className="space-y-6">
      
      {/* FORM CARD */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Form Header */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Add Exam Fees Entry
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select student from dropdown to auto-fill details, auto-calculate fees, fine additions, and balance.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveEntrySubmit} className="space-y-6 text-xs">
          
          {/* ROW 1: Student, Roll No., Department, Year, Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Student Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-slate-800 font-bold">
                  Student <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomStudent(!isCustomStudent)}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold transition-colors cursor-pointer"
                >
                  {isCustomStudent ? '← Dropdown' : '+ Custom'}
                </button>
              </div>

              {!isCustomStudent ? (
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student by name or roll no..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-[11px] placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                    />
                    {studentSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setStudentSearchTerm('')}
                        className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <select
                    value={entryFormData.rollNo || ''}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full p-2.5 bg-blue-50/50 border border-blue-300 rounded-xl text-slate-900 font-bold focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
                    required
                  >
                    <option value="">-- Select Student ({filteredStudentOptions.length} available) --</option>
                    {filteredStudentOptions.map((s, idx) => (
                      <option key={idx} value={s.rollNo || s.id}>
                        {s.name} ({s.rollNo || s.id}) • {s.course}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <input
                  type="text"
                  value={entryFormData.studentName}
                  onChange={(e) => setEntryFormData({...entryFormData, studentName: e.target.value})}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                  placeholder="Enter student name"
                  required
                />
              )}
            </div>

            {/* Roll No */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Roll No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={entryFormData.rollNo}
                onChange={(e) => setEntryFormData({...entryFormData, rollNo: e.target.value})}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:border-blue-500 focus:outline-none shadow-2xs"
                placeholder="Auto-filled"
                required
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={entryFormData.course}
                onChange={(e) => setEntryFormData({...entryFormData, course: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
                required
              >
                <option value="">Select dept...</option>
                {adminDepartments.length > 0 ? (
                  adminDepartments.map((dept) => {
                    const val = dept.code || dept.name;
                    return (
                      <option key={dept._id || val} value={val}>
                        {dept.name} {dept.code ? `(${dept.code})` : ''}
                      </option>
                    );
                  })
                ) : (
                  <option value={entryFormData.course || 'B.Com'}>{entryFormData.course || 'B.Com'}</option>
                )}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Year <span className="text-rose-500">*</span></label>
              <select
                value={entryFormData.year || 'I'}
                onChange={(e) => setEntryFormData({...entryFormData, year: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="I">I Year</option>
                <option value="II">II Year</option>
                <option value="III">III Year</option>
              </select>
            </div>

            {/* Batch */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Batch <span className="text-rose-500">*</span></label>
              <select
                value={entryFormData.batch || '2025-2028'}
                onChange={(e) => setEntryFormData({...entryFormData, batch: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="2025-2028">2025–2028</option>
                <option value="2024-2027">2024–2027</option>
                <option value="2023-2026">2023–2026</option>
                <option value="2022-2025">2022–2025</option>
              </select>
            </div>

          </div>

          {/* ROW 2: Fee Type, Base Amount, Due Date, Fine */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Fee Type */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Fee Type <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value="Exam Fees"
                readOnly
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold shadow-2xs cursor-not-allowed select-none"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={entryFormData.amount || ''}
                onChange={(e) => {
                  const amtVal = e.target.value;
                  const baseAmt = parseFloat(amtVal) || 0;
                  const fineNum = parseFloat(entryFormData.fine) || 0;
                  const total = baseAmt + fineNum;
                  const currentPaid = entryFormData.paidAmount !== undefined && entryFormData.paidAmount !== ''
                    ? parseFloat(entryFormData.paidAmount) || 0
                    : total;
                  setEntryFormData(prev => ({
                    ...prev,
                    amount: amtVal,
                    totalAmount: String(total),
                    balance: String(Math.max(0, total - currentPaid))
                  }));
                }}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:border-blue-500 focus:outline-none shadow-2xs"
                placeholder="e.g. 5000"
                required
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={entryFormData.dueDate || ''}
                onChange={(e) => setEntryFormData({...entryFormData, dueDate: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
                required
              />
            </div>

            {/* Fine (Auto-adds to Total) */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                <span>Fine (₹)</span>
                <span className="text-[10px] text-rose-500 font-bold">+ Auto-adds to Total</span>
              </label>
              <input
                type="number"
                value={entryFormData.fine || ''}
                onChange={(e) => {
                  const fineVal = e.target.value;
                  const fineNum = parseFloat(fineVal) || 0;
                  const baseAmt = parseFloat(entryFormData.amount) || 0;
                  const total = baseAmt + fineNum;
                  const currentPaid = entryFormData.paidAmount !== undefined && entryFormData.paidAmount !== ''
                    ? parseFloat(entryFormData.paidAmount) || 0
                    : baseAmt;
                  setEntryFormData(prev => ({
                    ...prev,
                    fine: fineVal,
                    totalAmount: String(total),
                    balance: String(Math.max(0, total - currentPaid))
                  }));
                }}
                className="w-full p-2.5 bg-white border border-rose-200 focus:border-rose-400 rounded-xl text-slate-800 font-bold focus:outline-none shadow-2xs"
                placeholder="0"
              />
              <div className="mt-1.5 p-1.5 bg-rose-50/80 border border-rose-100 rounded-lg flex items-center justify-between text-[11px]">
                <span className="text-slate-600 font-medium">Total with Fine:</span>
                <span className="text-rose-700 font-black">
                  ₹{((parseFloat(entryFormData.amount) || 0) + (parseFloat(entryFormData.fine) || 0)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

          </div>

          {/* ROW 3: Paid Amount, Balance, Payment Mode, Payment Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Paid Amount */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                <span>Paid Amount (₹) <span className="text-rose-500">*</span></span>
                <button
                  type="button"
                  onClick={() => {
                    const total = (parseFloat(entryFormData.amount) || 0) + (parseFloat(entryFormData.fine) || 0);
                    setEntryFormData(prev => ({
                      ...prev,
                      paidAmount: String(total),
                      balance: '0'
                    }));
                  }}
                  className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer"
                >
                  Pay Full (₹{((parseFloat(entryFormData.amount) || 0) + (parseFloat(entryFormData.fine) || 0)).toLocaleString('en-IN')})
                </button>
              </label>
              <input
                type="number"
                value={entryFormData.paidAmount !== undefined ? entryFormData.paidAmount : (entryFormData.amount || '')}
                onChange={(e) => {
                  const paid = e.target.value;
                  const total = (parseFloat(entryFormData.amount) || 0) + (parseFloat(entryFormData.fine) || 0);
                  const paidVal = paid === '' ? 0 : parseFloat(paid) || 0;
                  const bal = Math.max(0, total - paidVal);
                  setEntryFormData(prev => ({
                    ...prev,
                    paidAmount: paid,
                    balance: String(bal)
                  }));
                }}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:border-blue-500 focus:outline-none shadow-2xs"
                placeholder="e.g. 5000"
                required
              />
            </div>

            {/* Balance */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                <span>Balance Due (₹)</span>
                <span className="text-[10px] text-amber-600 font-bold">Auto-calculated</span>
              </label>
              <input
                type="number"
                value={
                  entryFormData.balance !== undefined
                    ? entryFormData.balance
                    : String(Math.max(0, ((parseFloat(entryFormData.amount) || 0) + (parseFloat(entryFormData.fine) || 0)) - (parseFloat(entryFormData.paidAmount !== undefined ? entryFormData.paidAmount : entryFormData.amount) || 0)))
                }
                readOnly
                className="w-full p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-950 font-black shadow-2xs cursor-not-allowed"
                placeholder="0"
              />
              <p className="text-[10px] text-slate-400 mt-1">Total (Base + Fine) − Paid</p>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Payment Mode <span className="text-rose-500">*</span>
              </label>
              <select
                value={entryFormData.paymentMode || 'UPI'}
                onChange={(e) => setEntryFormData({...entryFormData, paymentMode: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
                required
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Online">Online NetBanking</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={entryFormData.paymentDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => setEntryFormData({...entryFormData, paymentDate: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
                required
              />
            </div>

          </div>

          {/* ROW 3 cont: UPI ID & Account Holder Name optional */}
          {['UPI', 'Online', 'Bank Transfer'].includes(entryFormData.paymentMode) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                  <span>UPI ID</span>
                  <span className="text-[10px] text-indigo-500 font-bold">Optional</span>
                </label>
                <input
                  type="text"
                  value={entryFormData.upiId || ''}
                  onChange={(e) => setEntryFormData({...entryFormData, upiId: e.target.value})}
                  className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-slate-800 font-medium focus:border-indigo-400 focus:outline-none shadow-2xs"
                  placeholder="e.g. student@okicici"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                  <span>Account Holder Name</span>
                  <span className="text-[10px] text-indigo-500 font-bold">Optional</span>
                </label>
                <input
                  type="text"
                  value={entryFormData.accountHolderName || ''}
                  onChange={(e) => setEntryFormData({...entryFormData, accountHolderName: e.target.value})}
                  className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-slate-800 font-medium focus:border-indigo-400 focus:outline-none shadow-2xs"
                  placeholder="Account holder's full name"
                />
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all text-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Exam Entry</span>
            </button>
          </div>

        </form>

      </div>

      {/* BELOW: ADDED STUDENTS & COLLECTIONS LIST */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>📋 Added Exam Fee Students & Collections</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full font-bold">
                {searchedExamRecords.length} / {examRecords.length} Records
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live list of all students with exam fee collections recorded. Newly saved students appear right at the top.
            </p>
          </div>

          {/* Search and Filters: Department, Year, Batch */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student / roll..."
                value={tableSearchTerm}
                onChange={(e) => setTableSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all shadow-2xs"
              />
              {tableSearchTerm && (
                <button
                  type="button"
                  onClick={() => setTableSearchTerm('')}
                  className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Department Filter */}
            <select
              value={tableDeptFilter}
              onChange={(e) => setTableDeptFilter(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="All">All Depts</option>
              {adminDepartments.map(d => (
                <option key={d._id || d.code || d.name} value={d.code || d.name}>
                  {d.name} {d.code ? `(${d.code})` : ''}
                </option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={tableYearFilter}
              onChange={(e) => setTableYearFilter(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="All">All Years</option>
              <option value="I">I Year</option>
              <option value="II">II Year</option>
              <option value="III">III Year</option>
            </select>

            {/* Batch Filter */}
            <select
              value={tableBatchFilter}
              onChange={(e) => setTableBatchFilter(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="All">All Batches</option>
              <option value="2025-2028">2025–2028</option>
              <option value="2024-2027">2024–2027</option>
              <option value="2023-2026">2023–2026</option>
              <option value="2022-2025">2022–2025</option>
            </select>
          </div>
        </div>

        {searchedExamRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            <User className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-500" />
            <p className="text-xs font-semibold text-slate-600">
              {tableSearchTerm ? 'No students match your search query' : 'No exam fee entries added yet'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {tableSearchTerm ? 'Try typing a different name or roll number' : 'Select a student above and click "Save Exam Entry" to record collections.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Roll No</th>
                  <th className="py-3 px-3">Course</th>
                  <th className="py-3 px-3 text-right">Base Amount</th>
                  <th className="py-3 px-3 text-right">Fine</th>
                  <th className="py-3 px-3 text-right">Total Payable</th>
                  <th className="py-3 px-3 text-right">Paid Amount</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Payment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {searchedExamRecords.map((r, i) => {
                  const fineVal = Number(r.fine) || 0;
                  const totalVal = Number(r.totalFee) || (Number(r.paidFee) || 0) + (Number(r.pendingFee) || 0);
                  const baseVal = r.baseAmount !== undefined ? Number(r.baseAmount) : (totalVal - fineVal);
                  const paidVal = Number(r.paidFee) || 0;
                  const pendVal = Number(r.pendingFee) || Math.max(0, totalVal - paidVal);

                  return (
                    <tr key={i} className="hover:bg-purple-50/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                            {(r.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{r.name}</span>
                            <span className="text-[10px] text-slate-400">{r.id || r.rollNo}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{r.rollNo || r.id}</td>
                      <td className="py-3 px-3 text-slate-600">{r.course || 'Degree'}</td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-800">₹{baseVal.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right">
                        {fineVal > 0 ? (
                          <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[11px]">
                            +₹{fineVal.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">₹{totalVal.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600">₹{paidVal.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right font-bold text-amber-600">
                        {pendVal === 0 ? '₹0' : `₹${pendVal.toLocaleString('en-IN')}`}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          r.status === 'Paid' 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : r.status === 'Partial'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                          {r.status || (pendVal === 0 ? 'Paid' : 'Pending')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {r.lastPaymentDate || r.dueDate || 'Recent'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
