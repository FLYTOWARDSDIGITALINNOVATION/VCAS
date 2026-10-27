import React, { useState, useEffect } from 'react';
import { API_BASE } from '../apiConfig';
import { Bus, Save, User, CreditCard, Clock, AlertCircle, Search, Gauge, Fuel, Download, Printer } from 'lucide-react';

export default function TransportFeesManagement({ 
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
      .catch(err => console.warn('Could not fetch admin departments in transport fees:', err));
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
      const baseAmt = parseFloat(entryFormData.amount) || 800;
      const fineAmt = parseFloat(entryFormData.fine) || 0;
      const total = baseAmt + fineAmt;

      setEntryFormData(prev => ({
        ...prev,
        studentName: found.name,
        rollNo: found.rollNo || found.id,
        course: found.course || prev.course || 'B.Com',
        academicYear: found.academicYear || prev.academicYear || '2024 - 2025',
        amount: prev.amount || '800',
        totalAmount: String(total),
        paidAmount: prev.paidAmount !== undefined ? prev.paidAmount : String(total),
        balance: String(Math.max(0, total - (parseFloat(prev.paidAmount !== undefined ? prev.paidAmount : total) || 0)))
      }));
    }
  };

  // Filter transport fee records to list added students
  const transportRecords = (recordsList || []).filter(r => 
    (r.feeType || '').toLowerCase().includes('transport')
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

  // Filtered transport records based on table search query and filters
  const searchedTransportRecords = transportRecords.filter(r => {
    const term = (tableSearchTerm || '').toLowerCase().trim();
    const matchesSearch = !term || (
      (r.name && r.name.toLowerCase().includes(term)) ||
      (r.rollNo && r.rollNo.toLowerCase().includes(term)) ||
      (r.id && r.id.toLowerCase().includes(term)) ||
      (r.course && r.course.toLowerCase().includes(term)) ||
      (r.vehicleNo && r.vehicleNo.toLowerCase().includes(term)) ||
      (r.routeStop && r.routeStop.toLowerCase().includes(term)) ||
      (r.status && r.status.toLowerCase().includes(term))
    );
    let matchesDept = true;
    if (tableDeptFilter !== 'All') {
      const fDept = tableDeptFilter.toLowerCase().trim();
      const rCourse = String(r.course || '').toLowerCase().trim();
      const rDept = String(r.department || '').toLowerCase().trim();

      const isCommerceFilter = fDept.includes('commerce') || fDept === 'b.com' || fDept === 'c';
      const isCSFilter = fDept.includes('computer') || fDept === 'cs' || fDept.includes('science');

      const isCommerceStudent = rDept.includes('commerce') || rCourse.includes('commerce') || rDept.includes('b.com') || rCourse.includes('b.com');
      const isCSStudent = (rDept.includes('computer') || rCourse.includes('computer') || rDept.includes('cs') || rCourse.includes('cs')) && !isCommerceStudent;

      if (isCommerceFilter) {
        matchesDept = isCommerceStudent;
      } else if (isCSFilter) {
        matchesDept = isCSStudent;
      } else {
        matchesDept = rDept.includes(fDept) || rCourse.includes(fDept) || (fDept.length >= 4 && (fDept.includes(rDept) || fDept.includes(rCourse)));
      }
    }
    const matchesYear = tableYearFilter === 'All' || String(r.year || '').toLowerCase() === tableYearFilter.toLowerCase();
    const matchesBatch = tableBatchFilter === 'All' || String(r.batch || r.academicYear || '').toLowerCase().includes(tableBatchFilter.toLowerCase());
    return matchesSearch && matchesDept && matchesYear && matchesBatch;
  });

  const handleDownloadReceipt = (r) => {
    if (!r) return;
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to download or print the transport fee bill receipt.');
      return;
    }
    const studentName = r.name || 'Student';
    const rollNo = r.rollNo || r.id || 'N/A';
    const dept = r.course || r.department || 'Degree';
    const totalFee = Number(r.totalFee) || (Number(r.paidFee) || 0) + (Number(r.pendingFee) || 0) || 15000;
    const paidFee = Number(r.paidFee) || totalFee;
    const pendingFee = Number(r.pendingFee) || Math.max(0, totalFee - paidFee);
    const receiptNo = 'REC-TRP-' + (r.id ? String(r.id).replace(/\D/g, '').slice(-4) : Math.floor(1000 + Math.random() * 9000));
    const payDate = r.lastPaymentDate || r.paymentDate || new Date().toISOString().split('T')[0];

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transport Fee Bill - ${studentName} (${rollNo})</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 20px; }
            .receipt-box { border: 2px solid #0f172a; border-radius: 12px; padding: 24px; max-width: 720px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
            .college-title { font-size: 18px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; margin: 0; }
            .college-sub { font-size: 12px; font-weight: 700; color: #475569; margin: 2px 0 0 0; }
            .badge { display: inline-block; background: #047857; color: white; font-size: 11px; font-weight: 800; padding: 3px 12px; border-radius: 9999px; margin-top: 8px; letter-spacing: 0.5px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; font-size: 12px; margin-bottom: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; }
            .meta-item span { color: #64748b; font-weight: 500; }
            .meta-item strong { color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
            th { background: #0f172a; color: white; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
            td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
            .total-row td { font-weight: bold; background: #f1f5f9; }
            .paid-row td { font-weight: bold; color: #047857; background: #ecfdf5; }
            .due-row td { font-weight: bold; color: #b91c1c; background: #fef2f2; }
            .footer-sign { display: flex; justify-content: space-between; margin-top: 36px; padding-top: 12px; }
            .sign-box { text-align: center; min-width: 160px; }
            .sign-line { border-top: 1px dashed #0f172a; margin-top: 40px; padding-top: 4px; font-size: 11px; font-weight: bold; color: #475569; }
            .note { text-align: center; font-size: 10px; color: #94a3b8; font-style: italic; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <h1 class="college-title">VIVEKANANDA COLLEGE OF ARTS AND SCIENCE</h1>
              <p class="college-sub">Vellalankulam, Sivakasi • Official Fee Receipt</p>
              <div class="badge">TRANSPORT FEE OFFICIAL RECEIPT</div>
            </div>
            <div class="meta-grid">
              <div class="meta-item"><span>Receipt No:</span> <strong>${receiptNo}</strong></div>
              <div class="meta-item"><span>Payment Date:</span> <strong>${payDate}</strong></div>
              <div class="meta-item"><span>Student Name:</span> <strong>${studentName}</strong></div>
              <div class="meta-item"><span>Roll / ID No:</span> <strong>${rollNo}</strong></div>
                <div class="meta-item"><span>Status:</span> <strong>${pendingFee === 0 ? 'Fully Paid' : 'Pending'}</strong></div>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 10%;">S.No</th>
                  <th>Particulars</th>
                  <th style="text-align: right; width: 25%;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="text-align: center;">1</td>
                  <td><strong>College Bus Transport Fee</strong></td>
                  <td style="text-align: right;">₹${totalFee.toLocaleString('en-IN')}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="2" style="text-align: right;">Total Assessed:</td>
                  <td style="text-align: right;">₹${totalFee.toLocaleString('en-IN')}</td>
                </tr>
                <tr class="paid-row">
                  <td colspan="2" style="text-align: right;">Amount Paid:</td>
                  <td style="text-align: right;">₹${paidFee.toLocaleString('en-IN')}</td>
                </tr>
                <tr class="due-row">
                  <td colspan="2" style="text-align: right;">Balance Outstanding:</td>
                  <td style="text-align: right;">₹${pendingFee.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
            <div class="footer-sign">
              <div class="sign-box"><div class="sign-line">Student Signature</div></div>
              <div class="sign-box">
                <div style="font-size: 11px; font-weight: bold; color: #047857; margin-bottom: 4px;">✓ VERIFIED & RECORDED</div>
                <div class="sign-line">Transport In-Charge</div>
              </div>
            </div>
            <div class="note">Computer-generated official receipt issued by Vivekananda College of Arts & Science Finance System.</div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* FORM CARD */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Add Transport Fee Entry
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select student from dropdown to auto-fill details, route assignment, fine additions, and balance.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveEntrySubmit} className="space-y-5 text-xs">
          
          {/* ROW 1: Student, Roll No., Department, Year, Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            
            {/* Student Dropdown */}
            <div className="lg:col-span-2">
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
                      className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-[11px] placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
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
                    className="w-full p-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-slate-900 font-bold focus:border-emerald-500 focus:outline-none shadow-2xs cursor-pointer"
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

          <div className="pt-2">
            <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between sm:w-64">
              <span>Due Date</span>
              <span className="text-[10px] text-slate-400 font-normal">Optional</span>
            </label>
            <input
              type="date"
              value={entryFormData.dueDate || ''}
              onChange={(e) => setEntryFormData({...entryFormData, dueDate: e.target.value})}
              className="w-full sm:w-64 p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-emerald-500 focus:outline-none shadow-2xs cursor-pointer"
            />
          </div>

          {/* ROW 3: Base Amount, Fine, Paid Amount, Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
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
                placeholder="e.g. 800"
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
                placeholder="e.g. 800"
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

          </div>

          {/* ROW 4: Payment Mode, Payment Date, UPI optional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <option value="Cash">Cash at Bus Office</option>
                <option value="Bank">Bank Challan</option>
              </select>
            </div>

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

          {/* UPI ID & Account Holder Name (Optional) */}
          {['UPI', 'Online', 'Bank'].includes(entryFormData.paymentMode) && (
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

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all text-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Transport Entry</span>
            </button>
          </div>

        </form>

      </div>

      {/* BELOW: ADDED STUDENTS & COLLECTIONS LIST */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>📋 Added Transport Fee Students & Collections</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">
                {searchedTransportRecords.length} / {transportRecords.length} Records
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live list of all students with transport collections recorded, route details, fuel usage, and mileage.
            </p>
          </div>

          {/* Search and Filters: Department, Year, Batch */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student, route, or vehicle..."
                value={tableSearchTerm}
                onChange={(e) => setTableSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all shadow-2xs"
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
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="All">All Depts</option>
              {adminDepartments.map(d => (
                <option key={d._id || d.code || d.name} value={d.name}>
                  {d.name} {d.code ? `(${d.code})` : ''}
                </option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={tableYearFilter}
              onChange={(e) => setTableYearFilter(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none cursor-pointer"
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
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="All">All Batches</option>
              <option value="2025-2028">2025–2028</option>
              <option value="2024-2027">2024–2027</option>
              <option value="2023-2026">2023–2026</option>
              <option value="2022-2025">2022–2025</option>
            </select>
          </div>
        </div>

        {searchedTransportRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            <User className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
            <p className="text-xs font-semibold text-slate-600">
              {tableSearchTerm ? 'No students match your search query' : 'No transport entries added yet'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {tableSearchTerm ? 'Try typing a different name, roll no, or vehicle' : 'Select a student above and click "Save Transport Entry" to record collections.'}
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
                  <th className="py-3 px-3">Daily Petrol</th>
                  <th className="py-3 px-3">Mileage</th>
                  <th className="py-3 px-3 text-right">Base Amount</th>
                  <th className="py-3 px-3 text-right">Fine</th>
                  <th className="py-3 px-3 text-right">Total Payable</th>
                  <th className="py-3 px-3 text-right">Paid Amount</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Payment Date</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {searchedTransportRecords.map((r, i) => {
                  const fineVal = Number(r.fine) || 0;
                  const totalVal = Number(r.totalFee) || (Number(r.paidFee) || 0) + (Number(r.pendingFee) || 0);
                  const baseVal = r.baseAmount !== undefined ? Number(r.baseAmount) : (totalVal - fineVal);
                  const paidVal = Number(r.paidFee) || 0;
                  const pendVal = Number(r.pendingFee) || Math.max(0, totalVal - paidVal);

                  return (
                    <tr key={i} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[11px] shrink-0">
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
                      <td className="py-3 px-3">
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold text-[11px] border border-emerald-200/60">
                          {r.dailyPetrol || '18 L / day'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold text-[11px] border border-blue-200/60">
                          {r.mileage || '12.5 km/l'}
                        </span>
                      </td>
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
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(r)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-1 mx-auto transition-all cursor-pointer shadow-2xs"
                          title="Download / Print Bill"
                        >
                          <Download className="w-3 h-3" />
                          <span>Bill</span>
                        </button>
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
