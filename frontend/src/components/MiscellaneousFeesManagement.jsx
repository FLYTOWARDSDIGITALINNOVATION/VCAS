import React, { useState, useEffect } from 'react';
import { API_BASE } from '../apiConfig';
import { getCollegeLogoHtml } from './CollegeLogo';
import { FileText, Save, User, CreditCard, Clock, AlertCircle, Search, Download, Printer, Layers } from 'lucide-react';

export default function MiscellaneousFeesManagement({
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
  const [tableSemFilter, setTableSemFilter] = useState('All');
  const [tableBatchFilter, setTableBatchFilter] = useState('All');

  // List of miscellaneous fee types
  const miscFeeOptions = [
    'Lab Fees',
    'Library Fees',
    'Sports & Culturals Fees',
    'Special Amenities Fees',
    'ID Card / Badge Fees',
    'Registration / Admission Fees',
    'Certificate / Verification Fees',
    'Seminar & Workshop Fees',
    'Hostel Maintenance Fees',
    'Other / Custom Fees'
  ];

  useEffect(() => {
    fetch(`${API_BASE}/departments`)
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setAdminDepartments(json.data);
        }
      })
      .catch(err => console.warn('Could not fetch admin departments:', err));
  }, []);

  const normalizeDeptText = (value = '') => String(value || '').trim().toLowerCase().replace(/[^a-z]/g, '');

  const departmentMatches = (actualValue, expectedValue) => {
    const actual = normalizeDeptText(actualValue);
    const expected = normalizeDeptText(expectedValue);
    if (!actual || !expected) return false;
    return actual === expected || actual.includes(expected) || expected.includes(actual);
  };

  const getCourseCodeFromDepartment = (selectedDepartment) => {
    const departmentValue = String(selectedDepartment || '').trim();
    if (!departmentValue) return 'B.Com';

    const normalized = normalizeDeptText(departmentValue);
    if (normalized.includes('computer') || normalized.includes('cs')) return 'CS';
    if (normalized.includes('ai')) return 'AI';
    if (normalized.includes('cfs') || normalized.includes('forensic')) return 'CFS';
    if (normalized.includes('bba')) return 'BBA';
    if (normalized.includes('commerce')) return 'B.Com';

    const matchedDept = (adminDepartments || []).find(d => {
      const code = String(d.code || '').trim();
      const name = String(d.name || '').trim();
      return normalizeDeptText(code) === normalized || normalizeDeptText(name) === normalized;
    });

    return matchedDept?.code || departmentValue;
  };

  const handleStudentSelect = (selectedKey) => {
    if (!selectedKey) {
      setEntryFormData(prev => ({
        ...prev,
        studentName: '',
        rollNo: '',
        studentKey: '',
        studentMongoId: ''
      }));
      return;
    }

    const found = (studentOptions || []).find(s =>
      s.mongoId === selectedKey || s._id === selectedKey || s.rollNo === selectedKey || s.id === selectedKey || s.name === selectedKey
    );

    if (found) {
      const rawDept = found.department || found.course || 'B.Com';
      const matchingDepartment = (adminDepartments || []).find(d => {
        const deptName = String(d.name || '').trim();
        const deptCode = String(d.code || '').trim();
        const candidate = String(rawDept || '').trim();
        return departmentMatches(deptName, candidate) || departmentMatches(deptCode, candidate);
      });
      const fallbackDepartment = String(rawDept || '').trim() || 'B.Com';
      const departmentValue = matchingDepartment ? (matchingDepartment.name || matchingDepartment.code || fallbackDepartment) : fallbackDepartment;
      const courseValue = getCourseCodeFromDepartment(departmentValue);
      const baseAmt = parseFloat(entryFormData.amount) || 1000;
      const fineAmt = parseFloat(entryFormData.fine) || 0;
      const total = baseAmt + fineAmt;

      setEntryFormData(prev => ({
        ...prev,
        feeType: 'Miscellaneous Fees',
        miscFeeName: prev.miscFeeName || 'Lab Fees',
        studentName: found.name,
        rollNo: found.rollNo || found.id,
        studentKey: found.mongoId || found._id || found.rollNo || found.id,
        studentMongoId: found.mongoId || found._id || '',
        course: courseValue,
        department: departmentValue,
        batch: found.batch || found.academicYear || prev.batch || '2025-2028',
        year: found.year || prev.year || 'I',
        academicYear: found.academicYear || prev.academicYear || '2024 - 2025',
        amount: prev.amount || '1000',
        totalAmount: String(total),
        paidAmount: prev.paidAmount && prev.paidAmount !== '0' ? String(prev.paidAmount) : String(baseAmt),
        balance: String(Math.max(0, total - (prev.paidAmount && prev.paidAmount !== '0' ? parseFloat(prev.paidAmount) : baseAmt)))
      }));
    }
  };

  const matchesFeeSection = (record) => {
    if (!record) return false;
    const feeType = String(record.feeType || record.feeCategory || '').toLowerCase();
    const breakdown = record.feeBreakdown || {};
    return feeType.includes('misc') || !!breakdown.misc || Number(breakdown.misc?.paid || 0) > 0;
  };

  const miscRecords = (recordsList || []).filter(r => matchesFeeSection(r));

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

  const searchedMiscRecords = miscRecords.filter(r => {
    const term = (tableSearchTerm || '').toLowerCase().trim();
    const matchesSearch = !term || (
      (r.name && r.name.toLowerCase().includes(term)) ||
      (r.rollNo && r.rollNo.toLowerCase().includes(term)) ||
      (r.id && r.id.toLowerCase().includes(term)) ||
      (r.course && r.course.toLowerCase().includes(term)) ||
      (r.department && r.department.toLowerCase().includes(term)) ||
      (r.status && r.status.toLowerCase().includes(term)) ||
      (r.receiptNo && r.receiptNo.toLowerCase().includes(term))
    );
    let matchesDept = true;
    if (tableDeptFilter !== 'All') {
      const fDept = String(tableDeptFilter || '').trim();
      const rCourse = String(r.course || '').trim();
      const rDept = String(r.department || '').trim();
      matchesDept = departmentMatches(rDept, fDept) || departmentMatches(rCourse, fDept);
    }
    return matchesSearch && matchesDept;
  });

  const handleDownloadReceipt = (r) => {
    if (!r) return;
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to download or print receipt.');
      return;
    }

    const studentName = r.name || 'Student';
    const rollNo = r.rollNo || r.id || 'N/A';
    const dept = r.department || r.course || 'UG Program';
    const breakdown = r.feeBreakdown || {};
    const miscData = breakdown.misc || {};
    const totalFee = Number(miscData.total || r.totalFee || 0);
    const paidFee = Number(miscData.paid || r.paidFee || 0);
    const pendingFee = Math.max(0, totalFee - paidFee);
    const feeName = miscData.name || r.miscFeeName || 'Miscellaneous Fees';
    const receiptNo = r.receiptNo || '';
    const txnRef = r.referenceNo || r.paymentRef || '';
    const payDate = r.lastPaymentDate || r.paymentDate || new Date().toISOString().split('T')[0];

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Miscellaneous Fee Bill - ${studentName} (${rollNo})</title>
          <style>
            @page { size: A6 portrait; margin: 6mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 8px; }
            .receipt-box { border: 1.5px solid #0f172a; border-radius: 10px; padding: 12px; max-width: 100%; margin: 0 auto; }
            .header { text-align: center; border-bottom: 1px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px; }
            .college-title { font-size: 12px; font-weight: 900; letter-spacing: 0.2px; text-transform: uppercase; margin: 0; }
            .college-sub { font-size: 8px; font-weight: 700; color: #475569; margin: 2px 0 0 0; }
            .badge { display: inline-block; background: #0284c7; color: white; font-size: 8px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; margin-top: 6px; letter-spacing: 0.3px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; font-size: 9px; margin-bottom: 10px; padding: 8px; background: #f8fafc; border-radius: 6px; }
            .meta-item span { color: #64748b; font-weight: 500; }
            .meta-item strong { color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9px; }
            th { background: #0f172a; color: white; padding: 5px 6px; text-align: left; font-size: 8px; text-transform: uppercase; }
            td { padding: 5px 6px; border-bottom: 1px solid #e2e8f0; }
            .total-row td { font-weight: bold; background: #f1f5f9; }
            .paid-row td { font-weight: bold; color: #047857; background: #ecfdf5; }
            .due-row td { font-weight: bold; color: #b91c1c; background: #fef2f2; }
            .footer-sign { display: flex; justify-content: space-between; margin-top: 14px; padding-top: 8px; }
            .sign-box { text-align: center; min-width: 90px; }
            .sign-line { border-top: 1px dashed #0f172a; margin-top: 18px; padding-top: 3px; font-size: 8px; font-weight: bold; color: #475569; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              ${getCollegeLogoHtml(44)}
              <h1 class="college-title">VIVEKANANDA COLLEGE OF ARTS AND SCIENCE</h1>
              <p class="college-sub">Vellalankulam, Sivakasi • Official Fee Receipt</p>
              <div class="badge">${feeName.toUpperCase()} RECEIPT</div>
            </div>
            <div class="meta-grid">
              ${receiptNo ? `<div class="meta-item"><span>Receipt No:</span> <strong>${receiptNo}</strong></div>` : ''}
              ${txnRef ? `<div class="meta-item"><span>Transaction Ref:</span> <strong>${txnRef}</strong></div>` : ''}
              <div class="meta-item"><span>Payment Date:</span> <strong>${payDate}</strong></div>
              <div class="meta-item"><span>Student Name:</span> <strong>${studentName}</strong></div>
              <div class="meta-item"><span>Roll / ID No:</span> <strong>${rollNo}</strong></div>
              <div class="meta-item"><span>Department:</span> <strong>${dept}</strong></div>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 10%;">S.No</th>
                  <th>Fee Description / Particulars</th>
                  <th style="text-align: right; width: 25%;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="text-align: center;">1</td>
                  <td><strong>${feeName}</strong></td>
                  <td style="text-align: right;">₹${paidFee.toLocaleString('en-IN')}</td>
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
                <div class="sign-line">Cashier / Office Seal</div>
              </div>
            </div>
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
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0 border border-cyan-200">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Add Miscellaneous Fees Entry
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select student, choose the specific fee name (Lab, Library, Sports, Amenities, etc.), and collect payment.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveEntrySubmit} className="space-y-6 text-xs">
          {/* ROW 1: Student, Roll No., Department, Year, Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-slate-800 font-bold">
                  Student <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomStudent(!isCustomStudent)}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
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
                      placeholder="Search student..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-[11px] placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                    />
                    {studentSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setStudentSearchTerm('')}
                        className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <select
                    value={entryFormData.studentKey || entryFormData.studentMongoId || entryFormData.rollNo || ''}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full p-2.5 bg-blue-50/50 border border-blue-300 rounded-xl text-slate-900 font-bold focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
                    required
                  >
                    <option value="">-- Select Student ({filteredStudentOptions.length} available) --</option>
                    {filteredStudentOptions.map((s, idx) => (
                      <option key={s.mongoId || s._id || idx} value={s.mongoId || s._id || s.rollNo || s.id}>
                        {s.name} ({s.rollNo || s.id}) • {s.course}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <input
                  type="text"
                  value={entryFormData.studentName}
                  onChange={(e) => setEntryFormData({ ...entryFormData, studentName: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                  placeholder="Enter student name"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Roll No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={entryFormData.rollNo}
                onChange={(e) => setEntryFormData({ ...entryFormData, rollNo: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:border-blue-500 focus:outline-none shadow-2xs"
                placeholder="Auto-filled"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={entryFormData.department || entryFormData.course || ''}
                onChange={(e) => {
                  const nextDepartment = e.target.value;
                  setEntryFormData({
                    ...entryFormData,
                    department: nextDepartment,
                    course: getCourseCodeFromDepartment(nextDepartment)
                  });
                }}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
                required
              >
                <option value="">Select dept...</option>
                {adminDepartments.length > 0 ? (
                  adminDepartments.map((dept) => {
                    const val = dept.name || dept.code || dept._id || '';
                    return (
                      <option key={dept._id || val} value={val}>
                        {dept.name} {dept.code ? `(${dept.code})` : ''}
                      </option>
                    );
                  })
                ) : (
                  <option value={entryFormData.department || entryFormData.course || 'B.Com'}>{entryFormData.department || entryFormData.course || 'B.Com'}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Year <span className="text-rose-500">*</span></label>
              <select
                value={entryFormData.year || 'I'}
                onChange={(e) => setEntryFormData({ ...entryFormData, year: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="I">I Year</option>
                <option value="II">II Year</option>
                <option value="III">III Year</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Batch <span className="text-rose-500">*</span></label>
              <select
                value={entryFormData.batch || '2025-2028'}
                onChange={(e) => setEntryFormData({ ...entryFormData, batch: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="2025-2028">2025–2028</option>
                <option value="2024-2027">2024–2027</option>
                <option value="2023-2026">2023–2026</option>
                <option value="2022-2025">2022–2025</option>
              </select>
            </div>
          </div>

          {/* ROW 2: Name of the fees selection, Amount, Due Date, Fine */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Miscellaneous Fee Name Selector (in Type Mode) */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Name of the Fees (Fee Type) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                list="miscFeeOptionsList"
                value={entryFormData.miscFeeName !== undefined ? entryFormData.miscFeeName : 'Lab Fees'}
                onChange={(e) => setEntryFormData({ ...entryFormData, miscFeeName: e.target.value })}
                placeholder="Type fee name (e.g. Lab Fees, Library, ID Card...)"
                className="w-full p-2.5 bg-cyan-50/60 border border-cyan-300 rounded-xl text-slate-900 font-bold focus:border-cyan-500 focus:outline-none shadow-2xs"
                required
              />
              <datalist id="miscFeeOptionsList">
                {miscFeeOptions.map(opt => (
                  <option key={opt} value={opt} />
                ))}
              </datalist>
            </div>

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
                placeholder="e.g. 1500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={entryFormData.dueDate || ''}
                onChange={(e) => setEntryFormData({ ...entryFormData, dueDate: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                <span>Fine / Late Fee (₹)</span>
                <span className="text-[10px] text-rose-500 font-bold">+ Auto-adds</span>
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
            </div>
          </div>

          {/* ROW 3: Paid Amount, Balance, Payment Mode, Payment Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                placeholder="e.g. 1500"
                required
              />
            </div>

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
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Payment Mode <span className="text-rose-500">*</span>
              </label>
              <select
                value={entryFormData.paymentMode || 'UPI'}
                onChange={(e) => setEntryFormData({ ...entryFormData, paymentMode: e.target.value })}
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

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={entryFormData.paymentDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => setEntryFormData({ ...entryFormData, paymentDate: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Receipt No.</label>
              <input
                type="text"
                value={entryFormData.receiptNo || ''}
                onChange={(e) => setEntryFormData({ ...entryFormData, receiptNo: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                placeholder="REC-MISC-1001"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Transaction Ref No.</label>
              <input
                type="text"
                value={entryFormData.referenceNo || ''}
                onChange={(e) => setEntryFormData({ ...entryFormData, referenceNo: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                placeholder="TXN1234567890"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save & Record Payment</span>
            </button>
          </div>
        </form>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Miscellaneous Fee Records</h3>
            <p className="text-xs text-slate-500">Student collections for Lab, Library, Sports & other special fees.</p>
          </div>
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search records..."
              value={tableSearchTerm}
              onChange={(e) => setTableSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-3">Student</th>
                <th className="p-3">Roll No</th>
                <th className="p-3">Course</th>
                <th className="p-3">Fee Type</th>
                <th className="p-3">Paid (₹)</th>
                <th className="p-3">Total (₹)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {searchedMiscRecords.length > 0 ? (
                searchedMiscRecords.map((r, idx) => {
                  const mData = r.feeBreakdown?.misc || {};
                  const paid = Number(mData.paid || r.paidFee || 0);
                  const total = Number(mData.total || r.totalFee || paid);
                  const fName = mData.name || r.miscFeeName || 'Miscellaneous Fees';
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900">{r.name}</td>
                      <td className="p-3 text-slate-600">{r.rollNo || r.id}</td>
                      <td className="p-3 text-slate-600">{r.course}</td>
                      <td className="p-3 font-bold text-cyan-700">{fName}</td>
                      <td className="p-3 font-bold text-emerald-600">₹{paid.toLocaleString('en-IN')}</td>
                      <td className="p-3 font-bold text-slate-800">₹{total.toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          {r.status || 'Paid'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(r)}
                          className="p-1 hover:text-blue-600 text-slate-500 cursor-pointer"
                          title="Print / Download Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-slate-400">
                    No miscellaneous fee records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

