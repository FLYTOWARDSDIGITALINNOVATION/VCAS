import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE, BACKEND_URL } from '../apiConfig';
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
import FeeStructureView from './FeeStructureView';
import { Building2 } from 'lucide-react';
import CollegeLogo, { getCollegeLogoHtml } from './CollegeLogo';

export default function FeeManagement({ defaultFeeType = 'All', user }) {
  // Mode state: 'list' or 'form'
  const [viewMode, setViewMode] = useState('list');
  const [activeTab, setActiveTab] = useState('Exam Fees');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [courseFilter, setCourseFilter] = useState('All');
  const [feeTypeFilter, setFeeTypeFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [batchFilter, setBatchFilter] = useState('All');
  
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
    department: '',
    year: 'I',
    batch: '2025-2028',
    academicYear: '2025 - 2026',
    feeType: 'Exam Fees',
    routeStop: '',
    vehicleNo: '',
    driverName: '',
    dailyPetrol: '',
    mileage: '',
    amount: '',
    uniformFee: '0',
    bookFee: '0',
    dueDate: '',
    fine: '0',
    totalAmount: '',
    paymentMode: 'UPI',
    upiId: '',
    accountHolderName: '',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNo: '',
    balance: '0'
  };

  const [entryFormData, setEntryFormData] = useState(emptyEntryForm);
  const [adminDepartments, setAdminDepartments] = useState([]);
  const [editingFeeRecord, setEditingFeeRecord] = useState(null);

  // Fetch only admin-added departments
  useEffect(() => {
    fetch(`${API_BASE}/departments`)
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setAdminDepartments(json.data);
        }
      })
      .catch(e => console.warn('Notice fetching admin departments in FeeManagement:', e));
  }, []);

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

  // Real student fee records populated directly from database (/api/students)
  const [feeRecords, setFeeRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('vcas_real_fee_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Fetch real students from database on mount and merge any locally saved fee records
  useEffect(() => {
    const fetchStudentsForFees = async () => {
      try {
        const savedLocalRecords = (() => {
          try {
            const saved = localStorage.getItem('vcas_real_fee_records');
            if (!saved) return [];
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            return [];
          }
        })();

        const res = await fetch(`${API_BASE}/students`);
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          const savedPayments = JSON.parse(localStorage.getItem('vcas_saved_fee_payments') || '{}');
          const mapped = json.data.map((st, idx) => {
            const sid = (st.rollNo || st.studentId || st.admNo || `STU${idx + 1}`).toUpperCase();
            const savedBreakdown = savedPayments[sid]?.feeBreakdown || {};
            const breakdown = {
              tuition: { total: Number(st.feeBreakdown?.tuition?.total || savedBreakdown.tuition?.total || 0), paid: Number(st.feeBreakdown?.tuition?.paid || savedBreakdown.tuition?.paid || st.paidFee || 0), pending: Number(st.feeBreakdown?.tuition?.pending || savedBreakdown.tuition?.pending || 0) },
              exam: { total: Number(st.feeBreakdown?.exam?.total || savedBreakdown.exam?.total || 0), paid: Number(st.feeBreakdown?.exam?.paid || savedBreakdown.exam?.paid || 0), pending: Number(st.feeBreakdown?.exam?.pending || savedBreakdown.exam?.pending || 0) },
              transport: { total: Number(st.feeBreakdown?.transport?.total || savedBreakdown.transport?.total || 0), paid: Number(st.feeBreakdown?.transport?.paid || savedBreakdown.transport?.paid || 0), pending: Number(st.feeBreakdown?.transport?.pending || savedBreakdown.transport?.pending || 0) }
            };
            const tuitionPaid = Number(breakdown.tuition?.paid || st.paidFee || 0);
            const examPaid = Number(breakdown.exam?.paid || 0);
            const transportPaid = Number(breakdown.transport?.paid || 0);
            const totalPaid = tuitionPaid + examPaid + transportPaid;
            const totalFee = Number(st.totalFee) || (Number(breakdown.tuition?.total || 0) + Number(breakdown.exam?.total || 0) + Number(breakdown.transport?.total || 0) || 25000);
            const pending = Math.max(0, totalFee - totalPaid);
            const status = pending === 0 ? 'Paid' : 'Pending';
            const dbPaid = (st.feeStatus || '').toLowerCase() === 'paid';
            const hasPaymentRecord = savedPayments[sid] !== undefined;
            const isPaid = hasPaymentRecord
              ? (savedPayments[sid]?.status === 'Paid' || (Number(savedPayments[sid]?.paid) || 0) >= totalFee)
              : dbPaid;
            const paid = isPaid ? totalFee : (hasPaymentRecord ? (Number(savedPayments[sid]?.paid) || 0) : totalPaid);
            const finalPending = Math.max(0, totalFee - paid);

            const rawYear = st.year || st.academicYearNum || (st.semester ? Math.ceil(Number(st.semester) / 2) : 1);
            const rawBatch = st.batch || st.academicYear || (rawYear === 1 ? '2025-2028' : rawYear === 2 ? '2024-2027' : '2023-2026');
            const rawDept = st.department || st.course || 'Computer Science';

            return {
              id: sid,
              mongoId: st._id || st.id,
              rollNo: st.rollNo,
              name: st.name || st.fullName || 'Student',
              avatar: (st.name || 'S').charAt(0).toUpperCase(),
              course: rawDept,
              department: rawDept,
              year: rawYear,
              batch: rawBatch,
              academicYear: rawBatch,
              feeType: 'Tuition Fees',
              totalFee: totalFee,
              totalFeeDisplay: `₹${Number(totalFee).toLocaleString('en-IN')}`,
              paidFee: paid,
              paidFeeDisplay: `₹${Number(paid).toLocaleString('en-IN')}`,
              pendingFee: finalPending,
              pendingFeeDisplay: finalPending > 0 ? `₹${Number(finalPending).toLocaleString('en-IN')}` : '₹0',
              dueDate: st.lastPaymentDate || '2026-11-30',
              status: pending === 0 ? 'Paid' : 'Pending',
              feeBreakdown: breakdown,
              phone: st.phone || st.mobile || 'N/A',
              email: st.email || `${sid.toLowerCase()}@vcas.edu`
            };
          });

          const mergedMap = new Map();
          mapped.forEach(rec => {
            const key = String(rec.rollNo || rec.id || rec.name || '').trim().toLowerCase();
            if (key) mergedMap.set(key, rec);
          });

          savedLocalRecords.forEach(rec => {
            const key = String(rec.rollNo || rec.id || rec.name || '').trim().toLowerCase();
            if (!key) return;
            const existing = mergedMap.get(key);
            mergedMap.set(key, existing
              ? { ...existing, ...rec, feeBreakdown: rec.feeBreakdown || existing.feeBreakdown, mongoId: existing.mongoId || rec.mongoId }
              : rec);
          });

          const finalRecords = Array.from(mergedMap.values());
          setFeeRecords(finalRecords);
          try {
            localStorage.setItem('vcas_real_fee_records', JSON.stringify(finalRecords));
          } catch (e) {}
          return;
        }

        if (Array.isArray(savedLocalRecords) && savedLocalRecords.length) {
          setFeeRecords(savedLocalRecords);
        }
      } catch (err) {
        console.error('Failed to load students for fee management:', err);
        try {
          const saved = JSON.parse(localStorage.getItem('vcas_real_fee_records') || '[]');
          if (Array.isArray(saved) && saved.length > 0) {
            setFeeRecords(saved);
          }
        } catch (e) {}
      }
    };
    fetchStudentsForFees();
  }, []);

  // Compute live dashboard metrics strictly from real fee records
  const detailedFeeSummary = useMemo(() => {
    const summary = {
      tuitionPaid: 0,
      examPaid: 0,
      transportPaid: 0,
      totalPaid: 0,
      totalPending: 0
    };

    feeRecords.forEach((rec) => {
      const feeType = String(rec.feeType || '').toLowerCase();
      const paid = Number(rec.paidFee) || 0;
      const pending = Number(rec.pendingFee) || 0;
      const total = Number(rec.totalFee) || paid + pending;

      summary.totalPaid += paid;
      summary.totalPending += Math.max(0, total - paid);

      if (feeType.includes('tuition')) {
        summary.tuitionPaid += paid;
      } else if (feeType.includes('exam')) {
        summary.examPaid += paid;
      } else if (feeType.includes('transport')) {
        summary.transportPaid += paid;
      }
    });

    return summary;
  }, [feeRecords]);

  const totalCollectionSum = useMemo(() => {
    return detailedFeeSummary.totalPaid;
  }, [detailedFeeSummary]);

  const pendingFeesSum = useMemo(() => {
    return detailedFeeSummary.totalPending;
  }, [detailedFeeSummary]);

  const overdueCount = useMemo(() => {
    return feeRecords.filter(r => r.status === 'Pending' || r.pendingFee > 0).length;
  }, [feeRecords]);

  const todayCollectionSum = useMemo(() => {
    return feeRecords.filter(r => r.status === 'Paid').reduce((acc, curr) => acc + (Number(curr.paidFee) || 0), 0);
  }, [feeRecords]);

  const formatINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

  const formatCurrencyL = (val) => {
    if (!val || val === 0) return '₹0';
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val}`;
  };

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

  const handleEditFeeRecord = (row) => {
    if (!row) return;

    setEditingFeeRecord(row);
    setViewMode('form');
    setActiveTab(row.feeType || 'Exam Fees');
    setEntryFormData({
      ...emptyEntryForm,
      studentName: row.name || '',
      studentId: row.id || row.rollNo || '',
      rollNo: row.rollNo || row.id || '',
      course: row.course || '',
      department: row.department || row.course || '',
      year: String(row.year || 'I'),
      batch: row.batch || row.academicYear || '2025-2028',
      academicYear: row.academicYear || row.batch || '2025 - 2026',
      feeType: row.feeType || 'Exam Fees',
      routeStop: row.routeStop || '',
      vehicleNo: row.vehicleNo || '',
      driverName: row.driverName || '',
      dailyPetrol: row.dailyPetrol || '',
      mileage: row.mileage || '',
      amount: String(Number(row.totalFee || row.amount || 0)),
      uniformFee: String(Number(row.uniformFee || 0)),
      bookFee: String(Number(row.bookFee || 0)),
      dueDate: row.dueDate || '',
      fine: String(Number(row.fine || 0)),
      totalAmount: String(Number(row.totalFee || 0)),
      paymentMode: row.paymentMode || 'UPI',
      upiId: row.upiId || '',
      accountHolderName: row.accountHolderName || '',
      paymentDate: row.lastPaymentDate || new Date().toISOString().split('T')[0],
      referenceNo: row.referenceNo || row.paymentRef || '',
      paidAmount: String(Number(row.paidFee || 0)),
      balance: String(Number(row.pendingFee || 0))
    });
  };

  // Form Submission -> Persists entry to feeRecords, localStorage & MongoDB backend, then Triggers Confirmation Modal
  const handleSaveEntrySubmit = async (e) => {
    e.preventDefault();
    const baseAmount = parseFloat(entryFormData.amount || entryFormData.totalAmount) || 0;
    const uniformFee = parseFloat(entryFormData.uniformFee) || 0;
    const bookFee = parseFloat(entryFormData.bookFee) || 0;
    const fineAmount = parseFloat(entryFormData.fine) || 0;
    const totalAmount = baseAmount + uniformFee + bookFee + fineAmount;
    const paidAmount = entryFormData.paidAmount !== undefined && entryFormData.paidAmount !== ''
      ? parseFloat(entryFormData.paidAmount) || 0
      : totalAmount;
    const pendingAmount = Math.max(0, totalAmount - paidAmount);
    const feeStatus = pendingAmount === 0 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Pending');
    const feeTypeName = entryFormData.feeType || activeTab || 'Tuition Fees';
    const rollNo = (entryFormData.rollNo || '').trim();
    const studentName = (entryFormData.studentName || '').trim();
    const department = entryFormData.department || entryFormData.course || 'UG Program';
    const course = entryFormData.course || department;
    const txnRef = entryFormData.referenceNo || 'TXN' + Math.floor(1000000000 + Math.random() * 9000000000);
    const payDate = entryFormData.paymentDate || entryFormData.dueDate || new Date().toISOString().split('T')[0];
    const feeKey = feeTypeName.toLowerCase().includes('exam') ? 'exam' : feeTypeName.toLowerCase().includes('transport') ? 'transport' : 'tuition';

    if (editingFeeRecord) {
      const nextRecords = feeRecords.map(rec => {
        const matchesEditRecord = rec.id === editingFeeRecord.id || rec.rollNo === editingFeeRecord.rollNo || rec.mongoId === editingFeeRecord.mongoId;
        if (!matchesEditRecord) return rec;

        const updated = {
          ...rec,
          name: studentName || rec.name,
          id: rollNo || rec.id,
          rollNo: rollNo || rec.rollNo || rec.id,
          course,
          department,
          year: entryFormData.year || rec.year || 'I',
          batch: entryFormData.batch || rec.batch || '2025-2028',
          academicYear: entryFormData.academicYear || rec.academicYear || '2025 - 2026',
          feeType: feeTypeName,
          baseAmount: baseAmount,
          uniformFee: uniformFee,
          bookFee: bookFee,
          fine: fineAmount,
          routeStop: entryFormData.routeStop || rec.routeStop || '',
          vehicleNo: entryFormData.vehicleNo || rec.vehicleNo || '',
          driverName: entryFormData.driverName || rec.driverName || '',
          dailyPetrol: entryFormData.dailyPetrol || rec.dailyPetrol || '',
          mileage: entryFormData.mileage || rec.mileage || '',
          totalFee: totalAmount,
          paidFee: paidAmount,
          pendingFee: pendingAmount,
          paidFeeDisplay: `₹${Number(paidAmount).toLocaleString('en-IN')}`,
          pendingFeeDisplay: pendingAmount === 0 ? '₹0' : `₹${Number(pendingAmount).toLocaleString('en-IN')}`,
          totalFeeDisplay: `₹${Number(totalAmount).toLocaleString('en-IN')}`,
          status: feeStatus,
          dueDate: entryFormData.dueDate || rec.dueDate || '',
          lastPaymentDate: payDate,
          paymentMode: entryFormData.paymentMode || rec.paymentMode || 'Online / UPI',
          paymentRef: txnRef,
          referenceNo: txnRef,
          feeBreakdown: {
            tuition: { total: feeKey === 'tuition' ? totalAmount : Number(rec.feeBreakdown?.tuition?.total || 0), paid: feeKey === 'tuition' ? paidAmount : Number(rec.feeBreakdown?.tuition?.paid || 0), pending: feeKey === 'tuition' ? pendingAmount : Number(rec.feeBreakdown?.tuition?.pending || 0) },
            exam: { total: feeKey === 'exam' ? totalAmount : Number(rec.feeBreakdown?.exam?.total || 0), paid: feeKey === 'exam' ? paidAmount : Number(rec.feeBreakdown?.exam?.paid || 0), pending: feeKey === 'exam' ? pendingAmount : Number(rec.feeBreakdown?.exam?.pending || 0) },
            transport: { total: feeKey === 'transport' ? totalAmount : Number(rec.feeBreakdown?.transport?.total || 0), paid: feeKey === 'transport' ? paidAmount : Number(rec.feeBreakdown?.transport?.paid || 0), pending: feeKey === 'transport' ? pendingAmount : Number(rec.feeBreakdown?.transport?.pending || 0) }
          }
        };
        return updated;
      });

      setFeeRecords(nextRecords);
      localStorage.setItem('vcas_real_fee_records', JSON.stringify(nextRecords));
      setEditingFeeRecord(null);
      setViewMode('list');
      setFeeTypeFilter('All');
      setActiveTab('Exam Fees');
      showToast(`${feeTypeName} updated successfully`);

      try {
        const studentLookupId = editingFeeRecord?.mongoId || rollNo || studentName;
        if (studentLookupId) {
          await fetch(`${API_BASE}/students/${studentLookupId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              feeStatus,
              totalFee: Number(totalAmount) || 0,
              paidFee: Number(paidAmount) || 0,
              pendingFee: Number(pendingAmount) || 0,
              feeBreakdown: {
                tuition: { total: feeKey === 'tuition' ? totalAmount : 0, paid: feeKey === 'tuition' ? paidAmount : 0, pending: feeKey === 'tuition' ? pendingAmount : 0 },
                exam: { total: feeKey === 'exam' ? totalAmount : 0, paid: feeKey === 'exam' ? paidAmount : 0, pending: feeKey === 'exam' ? pendingAmount : 0 },
                transport: { total: feeKey === 'transport' ? totalAmount : 0, paid: feeKey === 'transport' ? paidAmount : 0, pending: feeKey === 'transport' ? pendingAmount : 0 }
              },
              lastPaymentDate: payDate,
              paymentMode: entryFormData.paymentMode || 'Online / UPI',
              referenceNo: txnRef
            })
          });
        }
      } catch (apiErr) {
        console.warn('Backend sync warning while editing fee record:', apiErr);
      }
      return;
    }

    // Find and update existing student record, or prepend new fee entry
    let matched = false;
    let targetMongoId = null;
    let matchedRecord = null;

    const nextRecords = feeRecords.map(rec => {
      const matchRoll = rollNo && (
        String(rec.rollNo || '').toLowerCase() === rollNo.toLowerCase() ||
        String(rec.id || '').toLowerCase() === rollNo.toLowerCase()
      );
      const matchName = studentName && String(rec.name || '').toLowerCase() === studentName.toLowerCase();

      if (matchRoll || matchName) {
        matched = true;
        targetMongoId = rec.mongoId;
        const newPaid = (rec.paidFee || 0) + paidAmount;
        const existingTotal = Number(rec.totalFee || 0);
        const newTotal = existingTotal + totalAmount;
        const newPending = Math.max(0, newTotal - newPaid);
        const newStatus = newPending === 0 ? 'Paid' : (newPaid > 0 ? 'Partial' : 'Pending');
        const nextBreakdown = {
          ...(rec.feeBreakdown || {
            tuition: { total: 0, paid: 0, pending: 0 },
            exam: { total: 0, paid: 0, pending: 0 },
            transport: { total: 0, paid: 0, pending: 0 }
          })
        };
        const currentType = nextBreakdown[feeKey] || { total: 0, paid: 0, pending: 0 };
        nextBreakdown[feeKey] = {
          total: Number(currentType.total || 0) + Number(totalAmount || 0),
          paid: Number(currentType.paid || 0) + Number(paidAmount || 0),
          pending: Math.max(0, (Number(currentType.total || 0) + Number(totalAmount || 0)) - (Number(currentType.paid || 0) + Number(paidAmount || 0)))
        };

        const updated = {
          ...rec,
          feeType: feeTypeName,
          department: entryFormData.department || entryFormData.course || rec.department || rec.course || '—',
          course: entryFormData.course || rec.course || rec.department || 'UG Program',
          baseAmount: baseAmount,
          uniformFee: uniformFee,
          bookFee: bookFee,
          fine: fineAmount,
          routeStop: entryFormData.routeStop || rec.routeStop || '',
          vehicleNo: entryFormData.vehicleNo || rec.vehicleNo || '',
          driverName: entryFormData.driverName || rec.driverName || '',
          dailyPetrol: entryFormData.dailyPetrol || rec.dailyPetrol || '',
          mileage: entryFormData.mileage || rec.mileage || '',
          paidFee: newPaid,
          paidFeeDisplay: newPaid >= 1000 ? `₹${(newPaid / 1000).toFixed(0)}K` : `₹${newPaid}`,
          totalFee: newTotal,
          pendingFee: newPending,
          pendingFeeDisplay: newPending === 0 ? '-' : (newPending >= 1000 ? `₹${(newPending / 1000).toFixed(0)}K` : `₹${newPending}`),
          status: newStatus,
          lastPaymentDate: payDate,
          paymentMode: entryFormData.paymentMode || rec.paymentMode || 'Online / UPI',
          paymentRef: entryFormData.referenceNo || rec.paymentRef || txnRef,
          referenceNo: entryFormData.referenceNo || rec.referenceNo || txnRef,
          feeBreakdown: nextBreakdown,
        };
        matchedRecord = updated;
        return updated;
      }
      return rec;
    });

    let finalRecords = nextRecords;
    if (matched) {
      const updatedItem = nextRecords.find(r => 
        (rollNo && (String(r.rollNo || '').toLowerCase() === rollNo.toLowerCase() || String(r.id || '').toLowerCase() === rollNo.toLowerCase())) ||
        (studentName && String(r.name || '').toLowerCase() === studentName.toLowerCase())
      );
      if (updatedItem) {
        finalRecords = [updatedItem, ...nextRecords.filter(r => r !== updatedItem)];
      }
    } else {
      const newRec = {
        id: rollNo || `STU${Date.now().toString().slice(-4)}`,
        name: studentName || 'Student',
        rollNo: rollNo || 'STU001',
        course,
        department: department,
        year: entryFormData.year || 'I',
        batch: entryFormData.batch || '2025-2028',
        academicYear: entryFormData.academicYear || '2025 - 2026',
        feeType: feeTypeName,
        routeStop: entryFormData.routeStop || '',
        vehicleNo: entryFormData.vehicleNo || '',
        driverName: entryFormData.driverName || '',
        dailyPetrol: entryFormData.dailyPetrol || '',
        mileage: entryFormData.mileage || '',
        baseAmount: baseAmount,
        uniformFee: uniformFee,
        bookFee: bookFee,
        fine: fineAmount,
        totalFee: totalAmount,
        paidFee: paidAmount,
        pendingFee: pendingAmount,
        paidFeeDisplay: paidAmount >= 1000 ? `₹${(paidAmount / 1000).toFixed(0)}K` : `₹${paidAmount}`,
        pendingFeeDisplay: pendingAmount === 0 ? '-' : (pendingAmount >= 1000 ? `₹${(pendingAmount / 1000).toFixed(0)}K` : `₹${pendingAmount}`),
        status: feeStatus,
        dueDate: entryFormData.dueDate || '',
        lastPaymentDate: payDate,
        paymentMode: entryFormData.paymentMode || 'Online / UPI',
        upiId: entryFormData.upiId || '',
        accountHolderName: entryFormData.accountHolderName || '',
        paymentRef: txnRef,
        referenceNo: txnRef,
        feeBreakdown: {
          tuition: { total: feeKey === 'tuition' ? totalAmount : 0, paid: feeKey === 'tuition' ? paidAmount : 0, pending: feeKey === 'tuition' ? pendingAmount : 0 },
          exam: { total: feeKey === 'exam' ? totalAmount : 0, paid: feeKey === 'exam' ? paidAmount : 0, pending: feeKey === 'exam' ? pendingAmount : 0 },
          transport: { total: feeKey === 'transport' ? totalAmount : 0, paid: feeKey === 'transport' ? paidAmount : 0, pending: feeKey === 'transport' ? pendingAmount : 0 }
        }
      };
      finalRecords = [newRec, ...nextRecords];
      matchedRecord = newRec;
    }

    setFeeRecords(finalRecords);
    setEditingFeeRecord(null);

    // Save to localStorage
    try {
      localStorage.setItem('vcas_real_fee_records', JSON.stringify(finalRecords));
      const savedPayments = JSON.parse(localStorage.getItem('vcas_saved_fee_payments') || '{}');
      savedPayments[rollNo || studentName] = {
        paid: paidAmount,
        pending: pendingAmount,
        status: feeStatus,
        date: payDate,
        feeBreakdown: {
          tuition: { total: feeKey === 'tuition' ? totalAmount : 0, paid: feeKey === 'tuition' ? paidAmount : 0, pending: feeKey === 'tuition' ? pendingAmount : 0 },
          exam: { total: feeKey === 'exam' ? totalAmount : 0, paid: feeKey === 'exam' ? paidAmount : 0, pending: feeKey === 'exam' ? pendingAmount : 0 },
          transport: { total: feeKey === 'transport' ? totalAmount : 0, paid: feeKey === 'transport' ? paidAmount : 0, pending: feeKey === 'transport' ? pendingAmount : 0 }
        }
      };
      localStorage.setItem('vcas_saved_fee_payments', JSON.stringify(savedPayments));
      window.dispatchEvent(new Event('vcas_students_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }

    // Persist to backend MongoDB via PUT /api/students/:id
    try {
      const studentLookupId = targetMongoId || rollNo || studentName;
      if (studentLookupId) {
        const studentBreakdown = {
          tuition: { total: 0, paid: 0, pending: 0 },
          exam: { total: 0, paid: 0, pending: 0 },
          transport: { total: 0, paid: 0, pending: 0 }
        };

        const currentBreakdown = (matchedRecord && matchedRecord.feeBreakdown) || (finalRecords[0] && finalRecords[0].feeBreakdown) || studentBreakdown;
        studentBreakdown.tuition = { ...(studentBreakdown.tuition), ...(currentBreakdown.tuition || {}) };
        studentBreakdown.exam = { ...(studentBreakdown.exam), ...(currentBreakdown.exam || {}) };
        studentBreakdown.transport = { ...(studentBreakdown.transport), ...(currentBreakdown.transport || {}) };

        const currentType = studentBreakdown[feeKey] || { total: 0, paid: 0, pending: 0 };
        studentBreakdown[feeKey] = {
          total: Number(currentType.total || 0) + Number(totalAmount || 0),
          paid: Number(currentType.paid || 0) + Number(paidAmount || 0),
          pending: Math.max(0, (Number(currentType.total || 0) + Number(totalAmount || 0)) - (Number(currentType.paid || 0) + Number(paidAmount || 0)))
        };

        const persistedFeeTotal = Number(matchedRecord?.totalFee ?? finalRecords[0]?.totalFee ?? totalAmount ?? 0);
        const persistedPaidAmount = Number(matchedRecord?.paidFee ?? finalRecords[0]?.paidFee ?? paidAmount ?? 0);
        const persistedPendingAmount = Math.max(0, persistedFeeTotal - persistedPaidAmount);

        await fetch(`${API_BASE}/students/${studentLookupId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feeStatus: persistedPendingAmount === 0 ? 'Paid' : (persistedPaidAmount > 0 ? 'Partial' : 'Pending'),
            totalFee: persistedFeeTotal,
            paidFee: persistedPaidAmount,
            pendingFee: persistedPendingAmount,
            feeBreakdown: studentBreakdown,
            lastPaymentDate: payDate,
            paymentMode: entryFormData.paymentMode || 'Online / UPI',
            referenceNo: txnRef
          })
        });
      }
    } catch (apiErr) {
      console.warn('Backend sync warning (saved locally):', apiErr);
    }

    const formattedAmount = `₹${paidAmount.toLocaleString('en-IN')}`;
    setSavedSuccessData({
      message: `${feeTypeName} collection of ${formattedAmount} saved successfully!`,
      studentName: studentName || 'Student',
      rollNo: rollNo || 'STU001',
      course,
      feeType: feeTypeName,
      amount: formattedAmount,
      balance: `₹${pendingAmount.toLocaleString('en-IN')}`,
      date: payDate,
      referenceNo: txnRef,
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

    const nextRecords = feeRecords.map(rec => {
      if (rec.id === targetStudentId) {
        const newPaid = rec.paidFee + amountNum;
        const newPending = Math.max(0, rec.totalFee - newPaid);
        const newStatus = newPending === 0 ? 'Paid' : 'Pending';
        
        try {
          const savedPayments = JSON.parse(localStorage.getItem('vcas_saved_fee_payments') || '{}');
          savedPayments[targetStudentId] = {
            paid: newPaid,
            status: newStatus
          };
          localStorage.setItem('vcas_saved_fee_payments', JSON.stringify(savedPayments));
          
          if (rec.mongoId) {
            fetch(`${API_BASE}/students/${rec.mongoId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ feeStatus: newStatus })
            }).catch(console.error);
          }
        } catch (err) {}

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
    });

    setFeeRecords(nextRecords);
    try {
      localStorage.setItem('vcas_real_fee_records', JSON.stringify(nextRecords));
      window.dispatchEvent(new Event('vcas_students_updated'));
    } catch (e) {}

    const updatedRec = nextRecords.find(r => r.id === targetStudentId);
    showToast(`Payment of ₹${amountNum.toLocaleString()} successfully recorded!`);
    setShowRecordModal(false);
    setSelectedStudentForPay(null);
    if (updatedRec) {
      setSelectedReceiptStudent(updatedRec);
    }
  };

  const handleToggleFeeStatus = (targetStudentId) => {
    const nextRecords = feeRecords.map(rec => {
      if (rec.id === targetStudentId) {
        const nextStatus = rec.status === 'Paid' ? 'Pending' : 'Paid';
        const nextPaid = nextStatus === 'Paid' ? rec.totalFee : 0;
        const nextPending = nextStatus === 'Paid' ? 0 : rec.totalFee;
        
        try {
          const savedPayments = JSON.parse(localStorage.getItem('vcas_saved_fee_payments') || '{}');
          savedPayments[targetStudentId] = {
            paid: nextPaid,
            status: nextStatus
          };
          localStorage.setItem('vcas_saved_fee_payments', JSON.stringify(savedPayments));

          if (rec.mongoId) {
            fetch(`${API_BASE}/students/${rec.mongoId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ feeStatus: nextStatus })
            }).catch(console.error);
          }
        } catch (err) {}

        return {
          ...rec,
          paidFee: nextPaid,
          paidFeeDisplay: nextPaid > 0 ? `₹${(nextPaid / 1000).toFixed(0)}K` : '₹0',
          pendingFee: nextPending,
          pendingFeeDisplay: nextPending === 0 ? '-' : `₹${(nextPending / 1000).toFixed(0)}K`,
          status: nextStatus
        };
      }
      return rec;
    });

    setFeeRecords(nextRecords);
    try {
      localStorage.setItem('vcas_real_fee_records', JSON.stringify(nextRecords));
      window.dispatchEvent(new Event('vcas_students_updated'));
    } catch (e) {}
    showToast(`Fee status updated by staff for ${targetStudentId}`);
  };

  const handleDownloadReceipt = (studentRec) => {
    if (!studentRec) return;
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to download/print the official fee receipt bill.');
      return;
    }

    const receiptNo = `REC-2026-${String(studentRec.id || '').replace(/[^0-9]/g, '').slice(-4) || Math.floor(1000 + Math.random() * 9000)}`;
    const studentName = studentRec.name || 'Student';
    const rollNo = studentRec.rollNo || studentRec.id || '—';
    const dept = studentRec.department || studentRec.course || '—';
    const batch = studentRec.batch || studentRec.academicYear || '';
    const feeCategory = studentRec.feeType || 'Fee Collection';
    const totalFee = Number(studentRec.totalFee) || 0;
    const paidFee = Number(studentRec.paidFee) || 0;
    const pendingFee = Math.max(0, totalFee - paidFee);
    const payMode = studentRec.paymentMode || 'Online / UPI';
    const txnRef = studentRec.paymentRef || studentRec.referenceNo || '';
    const payDate = studentRec.lastPaymentDate || new Date().toLocaleDateString('en-IN');
    const breakdown = studentRec.feeBreakdown || {
      tuition: { total: 0, paid: 0, pending: 0 },
      exam: { total: 0, paid: 0, pending: 0 },
      transport: { total: 0, paid: 0, pending: 0 }
    };
    const breakdownRows = [
      ['Tuition Fees', Number(breakdown.tuition?.paid || 0)],
      ['Exam Fees', Number(breakdown.exam?.paid || 0)],
      ['Transport Fees', Number(breakdown.transport?.paid || 0)]
    ];

    const metaItems = [
      ['Receipt No', receiptNo],
      ['Payment Date', payDate],
      ['Student Name', studentName],
      ['Roll / Reg No', rollNo],
      ['Department', dept],
      ['Academic Batch', batch],
      ['Payment Mode', payMode],
      ['Transaction Ref', txnRef]
    ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fee_Bill_Receipt_${receiptNo}_${rollNo}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 20px; background: #fff; }
            .receipt-box { max-width: 680px; margin: 0 auto; border: 2px solid #0f172a; border-radius: 12px; padding: 24px; position: relative; }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 16px; }
            .brand-name { font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 8px; }
            .affiliation { font-size: 11px; font-weight: 600; color: #475569; margin-top: 3px; }
            .badge { display: inline-block; background: #0f172a; color: #fff; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 9999px; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; margin-bottom: 16px; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .meta-item { display: flex; justify-content: space-between; }
            .meta-item span { color: #64748b; font-weight: 600; }
            .meta-item strong { color: #0f172a; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th { background: #f1f5f9; color: #334155; font-weight: 800; text-transform: uppercase; padding: 10px 12px; border: 1px solid #cbd5e1; text-align: left; }
            td { padding: 10px 12px; border: 1px solid #cbd5e1; color: #1e293b; }
            .total-row { font-weight: 800; background: #f8fafc; }
            .paid-row { font-weight: 800; color: #047857; background: #ecfdf5; font-size: 13px; }
            .due-row { font-weight: 800; color: #b91c1c; background: #fef2f2; }
            .footer-sign { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; }
            .sign-box { text-align: center; width: 180px; }
            .sign-line { border-top: 1px solid #0f172a; margin-top: 40px; padding-top: 6px; font-size: 11px; font-weight: 700; color: #334155; }
            .note { font-size: 10px; color: #94a3b8; text-align: center; margin-top: 24px; font-style: italic; }
            @media print {
              body { padding: 0; }
              .receipt-box { border: 2px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              ${getCollegeLogoHtml(44)}
              <div class="brand-name">Vivekananda College of Arts & Science</div>
              <div class="affiliation">Affiliated with Manonmaniam Sundaranar University • Vellalankulam, Tamil Nadu</div>
              <div class="badge">Official Fee Payment Receipt & Billing Voucher</div>
            </div>

            <div class="meta-grid">
              ${metaItems.map(([label, value]) => `<div class="meta-item"><span>${label}:</span> <strong>${value}</strong></div>`).join('')}
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
                ${breakdownRows.map(([label, value], index) => `
                  <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td><strong>${label}</strong></td>
                    <td style="text-align: right;">₹${Number(value || 0).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="2" style="text-align: right;">Total Fee Assessed:</td>
                  <td style="text-align: right;">₹${totalFee.toLocaleString('en-IN')}</td>
                </tr>
                <tr class="paid-row">
                  <td colspan="2" style="text-align: right;">Total Amount Received / Paid:</td>
                  <td style="text-align: right;">₹${paidFee.toLocaleString('en-IN')}</td>
                </tr>
                <tr class="due-row">
                  <td colspan="2" style="text-align: right;">Balance Outstanding Dues:</td>
                  <td style="text-align: right;">₹${pendingFee.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>

            <div class="footer-sign">
              <div class="sign-box">
                <div class="sign-line">Student Signature</div>
              </div>
              <div class="sign-box">
                <div style="font-size: 11px; font-weight: bold; color: #047857; margin-bottom: 4px;">✓ VERIFIED & RECORDED</div>
                <div class="sign-line">Accounts Officer / Cashier</div>
              </div>
            </div>

            <div class="note">
              Computer-generated official receipt issued by Vivekananda College of Arts & Science Finance System.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const getFeeBreakdownEntries = (record) => {
    const breakdown = record?.feeBreakdown || {};
    const categories = [
      { key: 'tuition', label: 'Tuition Fees' },
      { key: 'exam', label: 'Exam Fees' },
      { key: 'transport', label: 'Transport Fees' }
    ];

    return categories.map(item => {
      const data = breakdown[item.key] || { total: 0, paid: 0, pending: 0 };
      const total = Number(data.total || 0);
      const paid = Number(data.paid || 0);
      const pending = Number(data.pending || 0);
      return {
        ...item,
        total,
        paid,
        pending
      };
    });
  };

  // Filter students based on search, status, course, feeType, year, batch
  const filteredRecords = feeRecords.filter(rec => {
    const term = (searchTerm || '').toLowerCase().trim();
    const matchesSearch = !term || (
      String(rec.name || '').toLowerCase().includes(term) ||
      String(rec.id || '').toLowerCase().includes(term) ||
      String(rec.rollNo || '').toLowerCase().includes(term) ||
      String(rec.course || '').toLowerCase().includes(term) ||
      String(rec.department || '').toLowerCase().includes(term) ||
      String(rec.feeType || '').toLowerCase().includes(term) ||
      String(rec.driverName || '').toLowerCase().includes(term) ||
      String(rec.vehicleNo || '').toLowerCase().includes(term) ||
      String(rec.routeStop || '').toLowerCase().includes(term)
    );

    let matchesStatus = true;
    if (statusFilter !== 'All') {
      const recStat = String(rec.status || '').toLowerCase();
      const fStat = statusFilter.toLowerCase();
      if (fStat === 'paid') {
        matchesStatus = recStat === 'paid';
      } else if (fStat === 'pending') {
        matchesStatus = recStat === 'pending' || recStat === 'partial' || recStat === 'unpaid';
      } else if (fStat === 'overdue') {
        matchesStatus = recStat === 'overdue' || recStat === 'pending';
      } else {
        matchesStatus = recStat === fStat;
      }
    }

    let matchesCourse = true;
    if (courseFilter !== 'All') {
      const cFilter = courseFilter.toLowerCase().trim();
      const recCourse = String(rec.course || '').toLowerCase().trim();
      const recDept = String(rec.department || '').toLowerCase().trim();

      const isCommerceFilter = cFilter.includes('commerce') || cFilter === 'b.com' || cFilter === 'c';
      const isCSFilter = cFilter.includes('computer') || cFilter === 'cs' || cFilter.includes('science');

      const isCommerceStudent = recDept.includes('commerce') || recCourse.includes('commerce') || recDept.includes('b.com') || recCourse.includes('b.com');
      const isCSStudent = (recDept.includes('computer') || recCourse.includes('computer') || recDept.includes('cs') || recCourse.includes('cs')) && !isCommerceStudent;

      if (isCommerceFilter) {
        matchesCourse = isCommerceStudent;
      } else if (isCSFilter) {
        matchesCourse = isCSStudent;
      } else {
        matchesCourse = recDept.includes(cFilter) || recCourse.includes(cFilter) || (cFilter.length >= 4 && (cFilter.includes(recDept) || cFilter.includes(recCourse)));
      }
    }

    let matchesFeeType = true;
    if (feeTypeFilter !== 'All') {
      matchesFeeType = !rec.feeType || String(rec.feeType).toLowerCase() === feeTypeFilter.toLowerCase();
    }

    let matchesYear = true;
    if (yearFilter !== 'All') {
      const romanMap = { 'i': '1', 'ii': '2', 'iii': '3', 'iv': '4' };
      const fYearNorm = romanMap[yearFilter.toLowerCase()] || yearFilter.replace(/\D/g, '') || yearFilter.toLowerCase();
      const recYearRaw = String(rec.year || '').toLowerCase();
      const recYearNorm = romanMap[recYearRaw] || recYearRaw.replace(/\D/g, '') || recYearRaw;
      matchesYear = recYearRaw === yearFilter.toLowerCase() || 
                    (fYearNorm && recYearNorm && fYearNorm === recYearNorm) ||
                    recYearRaw.includes(yearFilter.toLowerCase());
    }

    let matchesBatch = true;
    if (batchFilter !== 'All') {
      const bFilter = batchFilter.replace(/[^0-9]/g, '');
      const recBatch = String(rec.batch || rec.academicYear || '').replace(/[^0-9]/g, '');
      matchesBatch = !rec.batch || !bFilter || recBatch.includes(bFilter) || bFilter.includes(recBatch) || String(rec.batch || '').toLowerCase().includes(batchFilter.toLowerCase());
    }

    return matchesSearch && matchesStatus && matchesCourse && matchesFeeType && matchesYear && matchesBatch;
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
            {viewMode === 'form' 
              ? (activeTab === 'Fee Structure' ? 'UG Fee Structure & Concessions' : `${activeTab} Management`) 
              : 'Fee Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            {activeTab === 'Fee Structure' && viewMode === 'form'
              ? 'Approved fee schedules for 5 UG departments, registration, semester dues, and scholarship matrix'
              : 'Track and manage student fee collections, dues, and payment transactions'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Back to List Button */}
          {viewMode === 'form' && (
            <button 
              onClick={() => {
                setViewMode('list');
                setFeeTypeFilter('All');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Back to Records</span>
            </button>
          )}
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* FEE SECTIONS NAVIGATION TABS PILLS */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-2xs flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => {
            setViewMode('form');
            setActiveTab('Fee Structure');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'form' && activeTab === 'Fee Structure'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>UG Fee Structure (5 Depts)</span>
        </button>

        <button
          onClick={() => {
            setViewMode('list');
            setFeeTypeFilter('All');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Collections & Records</span>
        </button>

        <button
          onClick={() => {
            setViewMode('form');
            setActiveTab('Tuition Fees');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'form' && activeTab === 'Tuition Fees'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Tuition Fees</span>
        </button>

        <button
          onClick={() => {
            handleTabSwitch('Exam Fees');
            setViewMode('form');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'form' && activeTab === 'Exam Fees'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Exam Fees</span>
        </button>

        <button
          onClick={() => {
            handleTabSwitch('Transport Fees');
            setViewMode('form');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'form' && activeTab === 'Transport Fees'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Transport Fees</span>
        </button>
      </div>

      {/* RENDER FORM VIEW (WHEN VIEW MODE IS 'form' or FEE TAB IS CLICKED) */}
      {viewMode === 'form' ? (
        <div className="space-y-6">
          {activeTab === 'Fee Structure' ? (
            <FeeStructureView user={user} />
          ) : activeTab === 'Transport Fees' ? (
            <TransportFeesManagement 
              entryFormData={entryFormData}
              setEntryFormData={setEntryFormData}
              handleSaveEntrySubmit={handleSaveEntrySubmit}
              studentOptions={feeRecords}
              recordsList={feeRecords}
            />
          ) : activeTab === 'Tuition Fees' ? (
            <TuitionFeesManagement 
              entryFormData={entryFormData}
              setEntryFormData={setEntryFormData}
              handleSaveEntrySubmit={handleSaveEntrySubmit}
              studentOptions={feeRecords}
              recordsList={feeRecords}
            />
          ) : (
            <ExamFeesManagement 
              entryFormData={entryFormData}
              setEntryFormData={setEntryFormData}
              handleSaveEntrySubmit={handleSaveEntrySubmit}
              studentOptions={feeRecords}
              recordsList={feeRecords}
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
                  {formatCurrencyL(totalCollectionSum)}
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
                  {formatCurrencyL(pendingFeesSum)}
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
                  {formatCurrencyL(todayCollectionSum)}
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
                  {overdueCount}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full border border-rose-300 bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Tuition paid</div>
              <div className="mt-2 text-xl font-extrabold text-slate-900">{formatINR(detailedFeeSummary.tuitionPaid)}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Exam paid</div>
              <div className="mt-2 text-xl font-extrabold text-slate-900">{formatINR(detailedFeeSummary.examPaid)}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Transport paid</div>
              <div className="mt-2 text-xl font-extrabold text-slate-900">{formatINR(detailedFeeSummary.transportPaid)}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total paid</div>
              <div className="mt-2 text-xl font-extrabold text-emerald-600">{formatINR(detailedFeeSummary.totalPaid)}</div>
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
                <span className="text-xs text-slate-500 font-medium">Department:</span>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 py-1.5 px-3 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="All">All Departments</option>
                  {adminDepartments.map(d => (
                    <option key={d._id || d.code || d.name} value={d.name}>
                      {d.name} {d.code ? `(${d.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Year:</span>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 py-1.5 px-3 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="All">All Years</option>
                  <option value="I">I Year</option>
                  <option value="II">II Year</option>
                  <option value="III">III Year</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Batch:</span>
                <select
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 py-1.5 px-3 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="All">All Batches</option>
                  <option value="2025-2028">2025–2028</option>
                  <option value="2024-2027">2024–2027</option>
                  <option value="2023-2026">2023–2026</option>
                  <option value="2022-2025">2022–2025</option>
                </select>
              </div>

              {(searchTerm || feeTypeFilter !== 'All' || statusFilter !== 'All' || courseFilter !== 'All' || yearFilter !== 'All' || batchFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setFeeTypeFilter('All');
                    setStatusFilter('All');
                    setCourseFilter('All');
                    setYearFilter('All');
                    setBatchFilter('All');
                  }}
                  className="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Clear all active filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
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
                    filteredRecords.map((row, idx) => (
                      <tr key={row._id || row.id || row.rollNo || idx} className="hover:bg-slate-50/80 transition-all">
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
                          {row.dueDate || '-'}
                        </td>

                        {/* Status Pill */}
                        <td className="py-4 px-5">
                          <button
                            type="button"
                            onClick={() => handleToggleFeeStatus(row.id)}
                            title="Click to mark as Paid or Pending"
                            className="cursor-pointer transition-transform active:scale-95"
                          >
                            {row.status === 'Paid' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100">
                                ✓ Paid
                              </span>
                            ) : row.status === 'Pending' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100">
                                ⏳ Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100">
                                Overdue
                              </span>
                            )}
                          </button>
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

                            {/* Edit Button */}
                            <button 
                              onClick={() => handleEditFeeRecord(row)}
                              title="Edit Fee Record"
                              className="px-2.5 py-1 text-[11px] font-semibold border border-amber-200 text-amber-700 rounded-md hover:bg-amber-50 transition-all shadow-2xs"
                            >
                              Edit
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

                            {/* Download & Print Bill Buttons */}
                            <button 
                              onClick={() => handleDownloadReceipt(row)}
                              title="Download Official Bill (PDF/Print)"
                              className="hover:text-blue-600 text-slate-500 transition-colors p-1 cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            <button 
                              onClick={() => setSelectedReceiptStudent(row)}
                              title="View & Print Receipt"
                              className="hover:text-slate-700 transition-colors p-1 cursor-pointer"
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

            {/* 3 BUTTONS: DOWNLOAD BILL, PRINT AND OK */}
            <div className="flex items-center gap-3 pt-2">
              {/* Download Bill Button */}
              <button
                type="button"
                onClick={() => handleDownloadReceipt(savedSuccessData)}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Bill</span>
              </button>

              {/* Print Button */}
              <button
                type="button"
                onClick={() => handleDownloadReceipt(savedSuccessData)}
                className="flex-1 py-3 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Bill</span>
              </button>

              {/* OK Button */}
              <button
                type="button"
                onClick={() => {
                  setSavedSuccessData(null);
                  setEntryFormData(emptyEntryForm);
                  setViewMode('list');
                }}
                className="py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-lg shadow-blue-500/25 cursor-pointer"
              >
                Done
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

            {(() => {
              const breakdownEntries = getFeeBreakdownEntries(selectedStudentForView);
              const totalSectionFee = breakdownEntries.reduce((sum, section) => sum + (Number(section.total) || 0), 0);
              const totalSectionPaid = breakdownEntries.reduce((sum, section) => sum + (Number(section.paid) || 0), 0);
              const totalSectionPending = breakdownEntries.reduce((sum, section) => sum + (Number(section.pending) || 0), 0);
              const effectiveTotalFee = totalSectionFee || Number(selectedStudentForView.totalFee || 0);
              const effectivePaidFee = totalSectionPaid || Number(selectedStudentForView.paidFee || 0);
              const effectivePendingFee = totalSectionPending || Number(selectedStudentForView.pendingFee || 0);

              return (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Fee Type:</span>
                    <span className="font-extrabold text-blue-600">{selectedStudentForView.feeType}</span>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500 font-bold">Fee breakdown</div>
                    {breakdownEntries.map((section) => (
                      <div key={section.key} className="flex items-center justify-between gap-3 text-[11px]">
                        <span className="text-slate-600 font-medium">{section.label}</span>
                        <span className="text-slate-900 font-bold">₹{Number(section.paid || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-200 pt-2 mt-2 flex items-center justify-between gap-3 text-[11px]">
                      <span className="text-slate-700 font-bold">Total Paid</span>
                      <span className="text-emerald-600 font-extrabold">₹{effectivePaidFee.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Total Course Fee:</span>
                    <span className="font-extrabold text-slate-900">₹{effectiveTotalFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Amount Paid:</span>
                    <span className="font-extrabold text-emerald-600">₹{effectivePaidFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Pending Balance:</span>
                    <span className="font-extrabold text-rose-500">₹{effectivePendingFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Due Date:</span>
                    <span className="font-bold text-slate-800">{selectedStudentForView.dueDate || 'N/A'}</span>
                  </div>
                  {selectedStudentForView.driverName && (
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Driver Name:</span>
                      <span className="font-bold text-slate-800">{selectedStudentForView.driverName}</span>
                    </div>
                  )}
                  {selectedStudentForView.dailyPetrol && (
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Daily Petrol:</span>
                      <span className="font-bold text-emerald-700">{selectedStudentForView.dailyPetrol}</span>
                    </div>
                  )}
                  {selectedStudentForView.mileage && (
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Mileage:</span>
                      <span className="font-bold text-blue-700">{selectedStudentForView.mileage}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500 font-medium">Status:</span>
                    <span className="font-bold text-slate-800">{selectedStudentForView.status}</span>
                  </div>
                </div>
              );
            })()}

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
                {selectedReceiptStudent.driverName && (
                  <div><span className="font-bold">Driver:</span> {selectedReceiptStudent.driverName}</div>
                )}
                {selectedReceiptStudent.dailyPetrol && (
                  <div><span className="font-bold">Daily Petrol:</span> {selectedReceiptStudent.dailyPetrol}</div>
                )}
                {selectedReceiptStudent.mileage && (
                  <div><span className="font-bold">Mileage:</span> {selectedReceiptStudent.mileage}</div>
                )}
                <div><span className="font-bold">Date:</span> {new Date().toLocaleDateString()}</div>
              </div>

              <div className="border-t border-b border-slate-200 py-3 space-y-1">
                {[
                  ['Tuition Fees', Number(selectedReceiptStudent.feeBreakdown?.tuition?.paid || 0)],
                  ['Exam Fees', Number(selectedReceiptStudent.feeBreakdown?.exam?.paid || 0)],
                  ['Transport Fees', Number(selectedReceiptStudent.feeBreakdown?.transport?.paid || 0)]
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-slate-700">
                    <span>{label}:</span>
                    <span className="font-bold">₹{Number(value || 0).toLocaleString('en-IN')}</span>
                  </div>
                ))}
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

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setSelectedReceiptStudent(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadReceipt(selectedReceiptStudent)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Bill</span>
              </button>
              <button
                onClick={() => handleDownloadReceipt(selectedReceiptStudent)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
