import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { API_BASE } from '../apiConfig';
import { getCollegeLogoHtml } from './CollegeLogo';
import { 
  FileText, 
  Save, 
  User, 
  CreditCard, 
  Clock, 
  AlertCircle, 
  Search, 
  Download, 
  Printer, 
  Layers, 
  Trash2,
  Plus,
  CheckCircle2,
  Shield,
  RotateCcw,
  Sparkles,
  DollarSign,
  Eye,
  X
} from 'lucide-react';
import { getStudentBatch } from '../utils/studentFeeUtils';

const DEFAULT_MISC_FEES = [
  { feeType: 'Lab Fees', amount: 2500 },
  { feeType: 'Library Fees', amount: 1000 },
  { feeType: 'Sports & Culturals Fees', amount: 1500 },
  { feeType: 'Special Amenities Fees', amount: 1200 },
  { feeType: 'ID Card / Badge Fees', amount: 300 },
  { feeType: 'Registration / Admission Fees', amount: 2000 },
  { feeType: 'Certificate / Verification Fees', amount: 500 },
  { feeType: 'Seminar & Workshop Fees', amount: 800 },
  { feeType: 'Hostel Maintenance Fees', amount: 5000 },
  { feeType: 'Other / Custom Fees', amount: 1000 }
];

export const getAllFeeItems = (record, feeStructure = DEFAULT_MISC_FEES) => {
  if (!record) return [];
  const breakdown = record.feeBreakdown || {};
  const items = [];

  // 1. Tuition Fees
  const tPaid = Number(breakdown.tuition?.paid || 0);
  const tTotal = Number(breakdown.tuition?.total || 0);
  if (tPaid > 0 || (tTotal > 0 && String(record.feeType || '').toLowerCase().includes('tuition'))) {
    items.push({
      section: 'Tuition Fees',
      feeType: 'Tuition Fees',
      amount: tTotal > 0 ? tTotal : tPaid,
      paid: tPaid,
      balance: Math.max(0, (tTotal > 0 ? tTotal : tPaid) - tPaid),
      status: tPaid >= tTotal && tTotal > 0 ? 'Paid' : (tPaid > 0 ? 'Partial' : 'Pending')
    });
  }

  // 2. Exam Fees
  const ePaid = Number(breakdown.exam?.paid || 0);
  const eTotal = Number(breakdown.exam?.total || 0);
  if (ePaid > 0 || (eTotal > 0 && String(record.feeType || '').toLowerCase().includes('exam'))) {
    items.push({
      section: 'Exam Fees',
      feeType: 'Exam Fees',
      amount: eTotal > 0 ? eTotal : ePaid,
      paid: ePaid,
      balance: Math.max(0, (eTotal > 0 ? eTotal : ePaid) - ePaid),
      status: ePaid >= eTotal && eTotal > 0 ? 'Paid' : (ePaid > 0 ? 'Partial' : 'Pending')
    });
  }

  // 3. Transport Fees
  const trPaid = Number(breakdown.transport?.paid || 0);
  const trTotal = Number(breakdown.transport?.total || 0);
  if (trPaid > 0 || (trTotal > 0 && String(record.feeType || '').toLowerCase().includes('transport'))) {
    items.push({
      section: 'Transport Fees',
      feeType: 'Transport Fees' + (record.routeStop ? ` (${record.routeStop})` : ''),
      amount: trTotal > 0 ? trTotal : trPaid,
      paid: trPaid,
      balance: Math.max(0, (trTotal > 0 ? trTotal : trPaid) - trPaid),
      status: trPaid >= trTotal && trTotal > 0 ? 'Paid' : (trPaid > 0 ? 'Partial' : 'Pending')
    });
  }

  // 4. Miscellaneous Fees & Individual items
  const mData = breakdown.misc || {};
  const rawPaid = mData.paid !== undefined && mData.paid !== null && mData.paid !== ''
    ? Number(mData.paid)
    : (String(record.feeType || '').toLowerCase().includes('misc')
        ? Number(record.paidAmount !== undefined && record.paidAmount !== '' ? record.paidAmount : (record.baseAmount || record.paidFee || 0))
        : 0);
  const rawTotal = mData.total !== undefined && mData.total !== null && mData.total !== ''
    ? Number(mData.total)
    : (String(record.feeType || '').toLowerCase().includes('misc') ? Number(record.totalFee || rawPaid) : rawPaid);

  const storedMisc = (record.allMiscItems && record.allMiscItems.length > 0)
    ? record.allMiscItems
    : (mData.items && mData.items.length > 0 ? mData.items : null);

  if (storedMisc && storedMisc.length > 0) {
    storedMisc.forEach(item => {
      const iPaid = Number(item.paid ?? item.amount ?? 0);
      const iTotal = Number(item.amount ?? item.total ?? iPaid);
      items.push({
        section: 'Miscellaneous Fees',
        feeType: item.feeType || item.name || 'Miscellaneous Fees',
        amount: iTotal,
        paid: iPaid,
        balance: Math.max(0, iTotal - iPaid),
        status: iPaid >= iTotal && iTotal > 0 ? 'Paid' : (iPaid > 0 ? 'Partial' : 'Pending')
      });
    });
  } else if (rawPaid > 0 || rawTotal > 0) {
    const rawName = mData.name || record.miscFeeName || 'Miscellaneous Fees';
    const isIdCard = rawName.toLowerCase().includes('id card') || rawName.toLowerCase().includes('badge');

    if (isIdCard) {
      const idCardAssessed = 300;
      const idCardPaid = Math.min(300, rawPaid > 0 ? rawPaid : 300);
      items.push({
        section: 'Miscellaneous Fees',
        feeType: 'ID Card / Badge Fees',
        amount: idCardAssessed,
        paid: idCardPaid,
        balance: Math.max(0, idCardAssessed - idCardPaid),
        status: idCardPaid >= idCardAssessed ? 'Paid' : (idCardPaid > 0 ? 'Partial' : 'Pending')
      });

      const remainderPaid = rawPaid - idCardPaid;
      if (remainderPaid > 0) {
        const remainderTotal = Math.max(remainderPaid, rawTotal - idCardAssessed);
        items.push({
          section: 'Miscellaneous Fees',
          feeType: 'Other Miscellaneous Fees',
          amount: remainderTotal,
          paid: remainderPaid,
          balance: Math.max(0, remainderTotal - remainderPaid),
          status: remainderPaid >= remainderTotal ? 'Paid' : 'Partial'
        });
      }
    } else {
      items.push({
        section: 'Miscellaneous Fees',
        feeType: rawName,
        amount: rawTotal > 0 ? rawTotal : rawPaid,
        paid: rawPaid,
        balance: Math.max(0, (rawTotal > 0 ? rawTotal : rawPaid) - rawPaid),
        status: rawPaid >= rawTotal && rawTotal > 0 ? 'Paid' : (rawPaid > 0 ? 'Partial' : 'Pending')
      });
    }
  }

  if (items.length === 0) {
    const pAmt = Number(record.paidAmount || record.paidFee || 0);
    const tAmt = Number(record.totalAmount || record.totalFee || pAmt);
    items.push({
      section: record.feeType || 'Miscellaneous Fees',
      feeType: record.miscFeeName || record.feeType || 'General Fee',
      amount: tAmt,
      paid: pAmt,
      balance: Math.max(0, tAmt - pAmt),
      status: pAmt >= tAmt && tAmt > 0 ? 'Paid' : (pAmt > 0 ? 'Partial' : 'Pending')
    });
  }

  return items;
};

// Miscellaneous-fee-only view for the miscellaneous fee slip / receipt.
// Tuition, exam and transport sections are intentionally excluded so the
// slip lists each miscellaneous item separately and totals only those items.
export const getMiscFeeItems = (record, feeStructure = DEFAULT_MISC_FEES) =>
  getAllFeeItems(record, feeStructure).filter((item) =>
    String(item.section || '').toLowerCase().includes('misc')
  );

export default function MiscellaneousFeesManagement({
  entryFormData,
  setEntryFormData,
  handleSaveEntrySubmit,
  studentOptions = [],
  recordsList = [],
  onDeleteRecord,
  user
}) {
  const [isCustomStudent, setIsCustomStudent] = useState(false);
  const [adminDepartments, setAdminDepartments] = useState([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [tableDeptFilter, setTableDeptFilter] = useState('All');
  const [tableYearFilter, setTableYearFilter] = useState('All');
  const [tableSemFilter, setTableSemFilter] = useState('All');
  const [tableBatchFilter, setTableBatchFilter] = useState('All');
  const [viewRecord, setViewRecord] = useState(null);

  // Super Admin vs Accountant Role detection
  const currentUser = user || (typeof window !== 'undefined' && JSON.parse(sessionStorage.getItem('vcas_user') || '{}'));
  const effectiveRole = (currentUser?.role || currentUser?.designation || 'Accountant')
    .toString()
    .trim();
  const normalizedRole = effectiveRole.toLowerCase();
  const isSuperAdmin = currentUser?.isSuperAdmin === true ||
    ['super admin', 'superadmin', 'super-admin', 'super administrator', 'superadministrator'].includes(normalizedRole) ||
    normalizedRole.includes('superadmin') ||
    normalizedRole.includes('super admin');

  // Master fee schedule state (rows & columns: feeType and amount)
  const [miscFeeStructure, setMiscFeeStructure] = useState(DEFAULT_MISC_FEES);
  const [isStructureLoading, setIsStructureLoading] = useState(false);
  const [isSavingStructure, setIsSavingStructure] = useState(false);
  const [structureToast, setStructureToast] = useState(null);
  const [autoFilledNotice, setAutoFilledNotice] = useState(null);

  // Fetch configured miscellaneous fees from backend
  const fetchMiscFees = async () => {
    try {
      setIsStructureLoading(true);
      const res = await fetch(`${API_BASE}/fee-structure/miscellaneous-fees`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setMiscFeeStructure(json.data);
      }
    } catch (err) {
      console.warn('Could not fetch miscellaneous fees structure:', err);
    } finally {
      setIsStructureLoading(false);
    }
  };

  useEffect(() => {
    fetchMiscFees();
    fetch(`${API_BASE}/departments`)
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setAdminDepartments(json.data);
        }
      })
      .catch(err => console.warn('Could not fetch admin departments:', err));

    const handleSync = () => fetchMiscFees();
    window.addEventListener('vcas_feestructure_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('vcas_feestructure_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Auto-fill initial fee amount when structure loads if empty
  useEffect(() => {
    if (miscFeeStructure.length > 0) {
      const activeFeeName = entryFormData.miscFeeName || miscFeeStructure[0].feeType;
      const matched = miscFeeStructure.find(f => f.feeType?.toLowerCase() === activeFeeName?.toLowerCase());
      if (matched && (!entryFormData.amount || entryFormData.amount === '1000' || entryFormData.amount === '0')) {
        const amtStr = String(matched.amount);
        const fineAmt = parseFloat(entryFormData.fine) || 0;
        const total = matched.amount + fineAmt;
        setEntryFormData(prev => ({
          ...prev,
          feeType: 'Miscellaneous Fees',
          miscFeeName: activeFeeName,
          amount: amtStr,
          totalAmount: String(total),
          paidAmount: prev.paidAmount && prev.paidAmount !== '0' && prev.paidAmount !== '1000' ? prev.paidAmount : amtStr,
          balance: String(Math.max(0, total - (prev.paidAmount && prev.paidAmount !== '0' && prev.paidAmount !== '1000' ? parseFloat(prev.paidAmount) : matched.amount)))
        }));
      }
    }
  }, [miscFeeStructure]);

  // Handle Super Admin rows & columns modification
  const handleAddFeeRow = () => {
    setMiscFeeStructure(prev => [
      ...prev,
      { feeType: '', amount: 0 }
    ]);
  };

  const handleFeeRowChange = (index, field, value) => {
    setMiscFeeStructure(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: field === 'amount' ? (value === '' ? '' : Math.max(0, parseFloat(value) || 0)) : value
      };
      return next;
    });
  };

  const handleDeleteFeeRow = (index) => {
    if (miscFeeStructure.length <= 1) {
      alert('At least one miscellaneous fee row is required.');
      return;
    }
    setMiscFeeStructure(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleResetMiscDefaults = async () => {
    if (!window.confirm('Reset miscellaneous fees structure to standard defaults? This will also save the defaults to the server and sync with the Accountant portal.')) return;

    setMiscFeeStructure(DEFAULT_MISC_FEES);
    setIsSavingStructure(true);
    try {
      const res = await fetch(`${API_BASE}/fee-structure/miscellaneous-fees`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          miscellaneousFees: DEFAULT_MISC_FEES,
          updatedBy: currentUser?.name || 'Super Admin',
          updatedRole: effectiveRole
        })
      });
      const json = await res.json();
      if (json.success) {
        setMiscFeeStructure(json.data || DEFAULT_MISC_FEES);
        setStructureToast('Fee structure reset to standard defaults and synced with Accountant portal.');
        setTimeout(() => setStructureToast(null), 4000);
        window.dispatchEvent(new Event('vcas_feestructure_updated'));
      } else {
        // Local state already reset; notify that server sync failed
        setStructureToast('Defaults restored locally. Server sync failed — click "Save Fee Structure" to persist.');
        setTimeout(() => setStructureToast(null), 5000);
      }
    } catch (err) {
      setStructureToast('Defaults restored locally. Server unreachable — click "Save Fee Structure" to persist.');
      setTimeout(() => setStructureToast(null), 5000);
    } finally {
      setIsSavingStructure(false);
    }
  };

  // Save fee schedule to backend (Super Admin exclusive)
  const handleSaveMiscStructure = async () => {
    const validFees = miscFeeStructure
      .map(f => ({ feeType: String(f.feeType || '').trim(), amount: Number(f.amount) || 0 }))
      .filter(f => f.feeType.length > 0);

    if (validFees.length === 0) {
      alert('Please provide at least one fee type and price amount.');
      return;
    }

    setIsSavingStructure(true);
    try {
      const res = await fetch(`${API_BASE}/fee-structure/miscellaneous-fees`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          miscellaneousFees: validFees,
          updatedBy: currentUser?.name || 'Super Admin',
          updatedRole: effectiveRole
        })
      });
      const json = await res.json();
      if (json.success) {
        setMiscFeeStructure(json.data || validFees);
        setStructureToast('Miscellaneous Fee Structure saved successfully! Auto-synced with Accountant portal.');
        setTimeout(() => setStructureToast(null), 4000);
        window.dispatchEvent(new Event('vcas_feestructure_updated'));
      } else {
        alert(json.message || 'Failed to save miscellaneous fee structure.');
      }
    } catch (err) {
      alert('Error saving fee structure: ' + err.message);
    } finally {
      setIsSavingStructure(false);
    }
  };

  // Accountant fee type selection & auto-fill amount
  const handleFeeTypeSelection = (selectedType) => {
    const matched = miscFeeStructure.find(
      f => f.feeType?.trim().toLowerCase() === selectedType?.trim().toLowerCase()
    );
    const priceAmount = matched ? matched.amount : (parseFloat(entryFormData.amount) || 0);
    const fineAmt = parseFloat(entryFormData.fine) || 0;
    const total = priceAmount + fineAmt;
    const currentPaid = priceAmount; // Auto-fills full payment by default

    setEntryFormData(prev => ({
      ...prev,
      feeType: 'Miscellaneous Fees',
      miscFeeName: selectedType,
      amount: String(priceAmount),
      totalAmount: String(total),
      paidAmount: String(currentPaid),
      balance: String(Math.max(0, total - currentPaid))
    }));

    if (matched) {
      setAutoFilledNotice(`✓ Auto-filled ₹${Number(priceAmount).toLocaleString('en-IN')} for ${selectedType}`);
      setTimeout(() => setAutoFilledNotice(null), 3500);
    }
  };

  const normalizeDeptText = (value = '') => String(value || '').trim().toLowerCase().replace(/[^a-z]/g, '');

  const departmentMatches = (actualValue, expectedValue) => {
    const actual = normalizeDeptText(actualValue);
    const expected = normalizeDeptText(expectedValue);
    if (!actual || !expected) return false;
    if (actual === expected) return true;
    if (actual.length >= 4 && expected.length >= 4) {
      return actual.includes(expected) || expected.includes(actual);
    }
    return false;
  };

  const getDepartmentSelectionValue = (selectedDepartment) => {
    const raw = String(selectedDepartment || '').trim();
    if (!raw) return '';

    const normalizedRaw = normalizeDeptText(raw);
    if (normalizedRaw.includes('cfs') || normalizedRaw.includes('cafs') || normalizedRaw.includes('criminology') || normalizedRaw.includes('forensic')) {
      const cfsDept = (adminDepartments || []).find(d => {
        const n = normalizeDeptText(d.name);
        const c = normalizeDeptText(d.code);
        return n.includes('criminology') || n.includes('forensic') || c === 'cfs' || c === 'cafs';
      });
      return cfsDept?.name || cfsDept?.code || 'Criminology and Forensic Science';
    }

    const canonicalMap = {
      commerce: 'Commerce',
      bcom: 'Commerce',
      'b.com': 'Commerce',
      'b com': 'Commerce',
      computerscience: 'Computer Science',
      cs: 'Computer Science',
      'bsc computerscience': 'Computer Science',
      'bsc cs': 'Computer Science',
      artificialintelligence: 'Artificial Intelligence',
      ai: 'Artificial Intelligence',
      'bsc artificialintelligence': 'Artificial Intelligence',
      criminologyandforensicscience: 'Criminology and Forensic Science',
      criminology: 'Criminology and Forensic Science',
      forensicscience: 'Criminology and Forensic Science',
      cfs: 'Criminology and Forensic Science',
      cafs: 'Criminology and Forensic Science',
      'bsc criminology': 'Criminology and Forensic Science',
      'bsc criminology and forensic science': 'Criminology and Forensic Science',
      criminologyandcomputerscience: 'Criminology and Forensic Science',
      management: 'Management',
      bba: 'Management',
      'business administration': 'Management',
      english: 'English',
      mathematics: 'Mathematics',
      math: 'Mathematics',
      physics: 'Physics',
      chemistry: 'Chemistry'
    };

    const explicitCanonical = canonicalMap[normalizedRaw];
    if (explicitCanonical) {
      const adminMatch = (adminDepartments || []).find(d =>
        normalizeDeptText(d.name) === normalizeDeptText(explicitCanonical) ||
        normalizeDeptText(d.code) === normalizeDeptText(explicitCanonical)
      );
      return adminMatch?.name || adminMatch?.code || explicitCanonical;
    }

    const directMatch = (adminDepartments || []).find(d => {
      const code = normalizeDeptText(d.code);
      const name = normalizeDeptText(d.name);
      return code === normalizedRaw || name === normalizedRaw;
    });
    if (directMatch) return directMatch.name || directMatch.code;

    const partialMatch = (adminDepartments || []).find(d => {
      const name = normalizeDeptText(d.name);
      return name.length > 3 && (name.includes(normalizedRaw) || normalizedRaw.includes(name));
    });
    if (partialMatch) return partialMatch.name || partialMatch.code;

    return raw;
  };

  const getCourseCodeFromDepartment = (selectedDepartment) => {
    const departmentValue = String(selectedDepartment || '').trim();
    if (!departmentValue) return 'B.Com';

    const normalized = normalizeDeptText(departmentValue);
    if (normalized.includes('criminology') || normalized.includes('forensic') || normalized === 'cfs' || normalized === 'cafs') return 'CFS';
    if (normalized.includes('computer') || normalized === 'cs') return 'CS';
    if (normalized.includes('artificial') || normalized.includes('ai')) return 'AI';
    if (normalized.includes('management') || normalized.includes('bba') || normalized === 'm') return 'BBA';
    if (normalized.includes('commerce') || normalized.includes('bcom') || normalized === 'c') return 'B.Com';

    const matchedDept = (adminDepartments || []).find(d => {
      const code = String(d.code || '').trim();
      const name = String(d.name || '').trim();
      return normalizeDeptText(code) === normalized || normalizeDeptText(name) === normalized;
    });

    return matchedDept?.code || departmentValue;
  };

  // Unique batches dynamically fetched from student details section
  const availableBatches = useMemo(() => {
    const set = new Set(['2026-2027', '2025-2026', '2024-2025']);
    [...(studentOptions || []), ...(recordsList || [])].forEach(s => {
      const b = String(s.batch || s.academicYear || '').trim().replace('–', '-');
      if (b && b !== 'All' && !b.toLowerCase().includes('batch')) {
        set.add(b);
      }
    });
    return Array.from(set).sort().reverse();
  }, [studentOptions, recordsList]);

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
      const rawDept = String(found.department || found.course || '').trim();
      const departmentValue = getDepartmentSelectionValue(rawDept) || rawDept || (normalizeDeptText(rawDept).includes('cfs') ? 'Criminology and Forensic Science' : 'Commerce');
      const courseValue = getCourseCodeFromDepartment(departmentValue);

      // Auto-fill amount based on currently active fee name
      const activeFeeName = entryFormData.miscFeeName || (miscFeeStructure[0]?.feeType || 'Lab Fees');
      const matchedFee = miscFeeStructure.find(f => f.feeType?.toLowerCase() === activeFeeName?.toLowerCase());
      const baseAmt = matchedFee ? matchedFee.amount : (parseFloat(entryFormData.amount) || 1000);
      const fineAmt = parseFloat(entryFormData.fine) || 0;
      const total = baseAmt + fineAmt;

      const studentBatch = (found.batch || getStudentBatch(found) || found.academicYear || availableBatches[0] || '').trim();

      setEntryFormData(prev => ({
        ...prev,
        feeType: 'Miscellaneous Fees',
        miscFeeName: activeFeeName,
        studentName: found.name,
        rollNo: found.rollNo || found.id,
        studentKey: found.mongoId || found._id || found.rollNo || found.id,
        studentMongoId: found.mongoId || found._id || '',
        course: courseValue,
        department: departmentValue,
        batch: studentBatch,
        year: found.year || prev.year || 'I',
        academicYear: found.academicYear || prev.academicYear || '2024 - 2025',
        amount: String(baseAmt),
        totalAmount: String(total),
        paidAmount: String(baseAmt),
        balance: '0'
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
    if (!r) return false;
    const term = (tableSearchTerm || '').toLowerCase().trim();
    const feeName = String(r.feeBreakdown?.misc?.name || r.miscFeeName || r.feeType || '').toLowerCase();
    const paidVal = String(r.feeBreakdown?.misc?.paid || r.paidFee || r.paidAmount || '');
    const totalVal = String(r.feeBreakdown?.misc?.total || r.totalFee || '');
    const matchesSearch = !term || (
      (r.name && r.name.toLowerCase().includes(term)) ||
      (r.rollNo && r.rollNo.toLowerCase().includes(term)) ||
      (r.id && r.id.toLowerCase().includes(term)) ||
      (r.course && r.course.toLowerCase().includes(term)) ||
      (r.department && r.department.toLowerCase().includes(term)) ||
      (r.status && r.status.toLowerCase().includes(term)) ||
      (r.receiptNo && r.receiptNo.toLowerCase().includes(term)) ||
      feeName.includes(term) ||
      paidVal.includes(term) ||
      totalVal.includes(term)
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
    const feeItems = getMiscFeeItems(r, miscFeeStructure);
    
    let totalFee = feeItems.reduce((acc, it) => acc + Number(it.amount || it.paid || 0), 0);
    let paidFee = feeItems.reduce((acc, it) => acc + Number(it.paid || 0), 0);
    if (paidFee > totalFee) totalFee = paidFee;
    const pendingFee = Math.max(0, totalFee - paidFee);
    const receiptNo = r.receiptNo || '';
    const txnRef = r.referenceNo || r.paymentRef || '';
    const payDate = r.lastPaymentDate || r.paymentDate || new Date().toISOString().split('T')[0];

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fee Bill Receipt - ${studentName} (${rollNo})</title>
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
              <div class="badge">MISCELLANEOUS FEES RECEIPT</div>
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
                  <th style="width: 8%;">#</th>
                  <th>Miscellaneous Fee Particulars</th>
                  <th style="text-align: right; width: 22%;">Assessed (₹)</th>
                  <th style="text-align: right; width: 22%;">Paid (₹)</th>
                  <th style="text-align: center; width: 14%;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${feeItems.map((item, idx) => `
                  <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td>
                      <strong>${item.feeType}</strong>
                      ${item.section && item.section !== item.feeType ? `<div style="font-size: 7.5px; color: #64748b;">${item.section}</div>` : ''}
                    </td>
                    <td style="text-align: right;">₹${Number(item.amount || item.paid || 0).toLocaleString('en-IN')}</td>
                    <td style="text-align: right; font-weight: bold; color: #047857;">₹${Number(item.paid || 0).toLocaleString('en-IN')}</td>
                    <td style="text-align: center; font-size: 7.5px; font-weight: bold;">${item.status}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="2" style="text-align: right;">Total Miscellaneous Fees:</td>
                  <td colspan="3" style="text-align: right;">₹${totalFee.toLocaleString('en-IN')}</td>
                </tr>
                <tr class="paid-row">
                  <td colspan="2" style="text-align: right;">Total Amount Paid:</td>
                  <td colspan="3" style="text-align: right;">₹${paidFee.toLocaleString('en-IN')}</td>
                </tr>
                ${pendingFee > 0 ? `
                <tr class="due-row">
                  <td colspan="2" style="text-align: right;">Balance Outstanding:</td>
                  <td colspan="3" style="text-align: right;">₹${pendingFee.toLocaleString('en-IN')}</td>
                </tr>` : ''}
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

      {/* ========================================================================= */}
      {/* 1. SUPER ADMIN EXCLUSIVE: MISCELLANEOUS FEES MASTER SCHEDULE CONFIGURATION */}
      {/* ========================================================================= */}
      {isSuperAdmin && (
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-200/60 pb-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-300">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Miscellaneous Fees Master Configuration
                  </h2>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 tracking-wide uppercase">
                    Super Admin Only
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Add and configure the type of fees and the price amount in rows and columns below. Rows can be added one below another. On the <strong>Accountant side</strong>, these fee types alone will be fetched and the price amount will be auto-filled.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetMiscDefaults}
                disabled={isSavingStructure}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                title="Reset to official standard fee list"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
              <button
                type="button"
                onClick={handleSaveMiscStructure}
                disabled={isSavingStructure}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingStructure ? 'Saving...' : 'Save Fee Structure'}</span>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {structureToast && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{structureToast}</span>
            </div>
          )}

          {/* Table of Rows and Columns */}
          <div className="overflow-x-auto bg-white rounded-2xl border border-purple-200/80 shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-purple-100/60 text-purple-950 font-black border-b border-purple-200 uppercase text-[11px] tracking-wider">
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">Fee Type / Category Name</th>
                  <th className="p-3 w-48">Price Amount (₹)</th>
                  <th className="p-3 w-20 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {miscFeeStructure.map((fee, idx) => (
                  <tr key={idx} className="hover:bg-purple-50/30 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-500 font-mono">
                      {idx + 1}
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={fee.feeType}
                        onChange={(e) => handleFeeRowChange(idx, 'feeType', e.target.value)}
                        placeholder="e.g. Lab Fees, Library Fees, Special Amenities..."
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-purple-500 focus:outline-none shadow-2xs"
                        required
                      />
                    </td>
                    <td className="p-3">
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={fee.amount}
                          onChange={(e) => handleFeeRowChange(idx, 'amount', e.target.value)}
                          placeholder="0"
                          className="w-full pl-6 pr-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black focus:bg-white focus:border-purple-500 focus:outline-none shadow-2xs font-mono"
                          required
                        />
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteFeeRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove this fee row"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Row Button - Adds rows one below another */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleAddFeeRow}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-purple-50 text-purple-700 font-extrabold text-xs rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-500 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Fee Row (One Below Another)</span>
            </button>

            <span className="text-[11px] text-slate-500 font-medium">
              Total configured fees: <strong className="text-purple-700">{miscFeeStructure.length} categories</strong>
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ACCOUNTANT VIEW: APPROVED MASTER RATE REFERENCE BANNER                   */}
      {/* ========================================================================= */}
      {!isSuperAdmin && (
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <span>Approved Miscellaneous Fees Schedule</span>
                <span className="text-[9px] px-2 py-0.2 bg-emerald-100 text-emerald-700 rounded-full font-bold">
                  Auto-fill Enabled
                </span>
              </h4>
              <p className="text-[11px] text-slate-600">
                Fee types and price amounts are approved by <strong>Super Admin</strong>. Selecting any fee type in the collection form will automatically auto-fill the approved price amount.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 max-w-md">
            {miscFeeStructure.slice(0, 4).map((f, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 bg-white border border-blue-200 rounded-lg font-bold text-slate-700 font-mono">
                {f.feeType}: <strong className="text-blue-700">₹{Number(f.amount).toLocaleString('en-IN')}</strong>
              </span>
            ))}
            {miscFeeStructure.length > 4 && (
              <span className="text-[10px] text-blue-600 font-bold">
                +{miscFeeStructure.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FEE COLLECTION / ENTRY FORM (ACCOUNTANT & FINANCE)                     */}
      {/* ========================================================================= */}
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
              Select student, choose fee type (price amount auto-fills from Super Admin schedule), and record payment.
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
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 z-10 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={entryFormData.studentName ? entryFormData.studentName : `Search by name or roll no… (${(studentOptions||[]).length} students)`}
                    value={studentSearchTerm}
                    onChange={(e) => { setStudentSearchTerm(e.target.value); }}
                    onFocus={(e) => { if (!studentSearchTerm && entryFormData.studentName) e.target.placeholder = 'Type to search…'; }}
                    className="w-full pl-8 pr-7 py-2 bg-white border border-blue-300 rounded-xl text-slate-800 text-[11px] placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                  {studentSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setStudentSearchTerm('')}
                      className="absolute right-2 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold z-10"
                    >✕</button>
                  )}
                  {/* Autocomplete dropdown */}
                  {studentSearchTerm.trim() && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-blue-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                      {filteredStudentOptions.length === 0 ? (
                        <div className="px-3 py-2 text-[11px] text-slate-400 italic">No students match "{studentSearchTerm}"</div>
                      ) : (
                        filteredStudentOptions.map((s, idx) => (
                          <button
                            key={s.mongoId || s._id || idx}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); handleStudentSelect(s.mongoId || s._id || s.rollNo || s.id); setStudentSearchTerm(''); }}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-[11px] border-b border-slate-100 last:border-0 cursor-pointer"
                          >
                            <span className="font-bold text-slate-800">{s.name}</span>
                            <span className="text-slate-500 ml-1">({s.rollNo || s.id})</span>
                            <span className="text-slate-400 ml-1">• {s.course}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {/* Show selected student pill */}
                  {!studentSearchTerm && entryFormData.studentName && (
                    <div className="mt-1.5 flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="text-[11px] font-bold text-blue-800">{entryFormData.studentName}</span>
                      <span className="text-[10px] text-blue-500">({entryFormData.rollNo})</span>
                      <button type="button" onClick={() => { handleStudentSelect(''); setStudentSearchTerm(''); }} className="ml-auto text-blue-400 hover:text-red-500 text-xs font-bold">✕</button>
                    </div>
                  )}
                  {!studentSearchTerm && !entryFormData.studentName && (
                    <div className="mt-1 text-[10px] text-slate-400 pl-1">Type a name or roll number to search all {(studentOptions||[]).length} students</div>
                  )}
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
                value={entryFormData.batch || availableBatches[0] || ''}
                onChange={(e) => setEntryFormData({ ...entryFormData, batch: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="">Select Batch</option>
                {availableBatches.map(b => (
                  <option key={b} value={b}>{b.replace('-', '–')}</option>
                ))}
                {entryFormData.batch && !availableBatches.includes(entryFormData.batch) && (
                  <option value={entryFormData.batch}>{entryFormData.batch.replace('-', '–')}</option>
                )}
              </select>
            </div>
          </div>

          {/* ROW 2: Name of the fees (Fetched from Super Admin schedule), Amount (Auto-filled), Due Date, Fine */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Miscellaneous Fee Name Selector (Fetched from Super Admin schedule) */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                <span>Fee Type <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-cyan-600 font-bold">Fetched from Super Admin</span>
              </label>
              <select
                value={entryFormData.miscFeeName || (miscFeeStructure[0]?.feeType || '')}
                onChange={(e) => handleFeeTypeSelection(e.target.value)}
                className="w-full p-2.5 bg-cyan-50/60 border border-cyan-300 rounded-xl text-slate-900 font-bold focus:border-cyan-500 focus:outline-none shadow-2xs cursor-pointer"
                required
              >
                <option value="">-- Select Fee Type ({miscFeeStructure.length} types) --</option>
                {miscFeeStructure.map((opt, idx) => (
                  <option key={opt._id || opt.feeType || idx} value={opt.feeType}>
                    {opt.feeType} (₹{Number(opt.amount).toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            {/* Price Amount Field (Auto-filled from Super Admin Schedule) */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                <span>Amount (₹) <span className="text-rose-500">*</span></span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded-md font-bold">
                  ✓ Auto-filled
                </span>
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
                className="w-full p-2.5 bg-emerald-50/30 border border-emerald-300 rounded-xl text-slate-900 font-black focus:border-blue-500 focus:outline-none shadow-2xs font-mono"
                placeholder="e.g. 1500"
                required
              />
              {autoFilledNotice && (
                <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                  {autoFilledNotice}
                </p>
              )}
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

      {/* ========================================================================= */}
      {/* 4. MISCELLANEOUS FEE RECORDS TABLE                                        */}
      {/* ========================================================================= */}
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
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {searchedMiscRecords.length > 0 ? (
                searchedMiscRecords.map((r, idx) => {
                  const mData = r.feeBreakdown?.misc || {};
                  const mBase = Number(r.baseAmount || 0);
                  let total = Number(
                    (mData.total !== undefined && mData.total !== null && mData.total !== '')
                      ? mData.total
                      : (mBase > 0 ? mBase : (r.totalFee || 0))
                  );
                  let paid = Number(
                    (mData.paid !== undefined && mData.paid !== null && mData.paid !== '')
                      ? mData.paid
                      : (r.feeType?.toLowerCase().includes('misc')
                          ? (r.paidAmount !== undefined && r.paidAmount !== '' ? r.paidAmount : (r.baseAmount || r.paidFee || 0))
                          : (r.paidAmount || 0))
                  );
                  if (paid > total) {
                    total = paid;
                  }
                  const fName = mData.name || r.miscFeeName || (r.feeType === 'Miscellaneous Fees' ? (r.miscFeeName || 'Lab Fees') : 'Miscellaneous Fees');
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
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewRecord(r)}
                            className="p-1 hover:text-indigo-600 text-slate-500 cursor-pointer"
                            title="View Fee Breakdown"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(r)}
                            className="p-1 hover:text-blue-600 text-slate-500 cursor-pointer"
                            title="Print / Download Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {onDeleteRecord && (
                            <button
                              type="button"
                              onClick={() => onDeleteRecord(r)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Collection Record"
                            >
                              <Trash2 className="w-4 h-4 text-rose-500 hover:text-rose-600" />
                            </button>
                          )}
                        </div>
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
      {/* ======================================================== */}
      {/* VIEW FEE BREAKDOWN MODAL                                  */}
      {/* ======================================================== */}
      {viewRecord && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-cyan-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center border border-indigo-200">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">Miscellaneous Fees Breakdown</h3>
                  <p className="text-[11px] text-slate-500">Individual miscellaneous fee items paid for this student</p>
                </div>
              </div>
              <button type="button" onClick={() => setViewRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student Info */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div><span className="text-slate-500 font-medium">Student: </span><span className="font-bold text-slate-800">{viewRecord.name}</span></div>
              <div><span className="text-slate-500 font-medium">Roll No: </span><span className="font-bold text-slate-800">{viewRecord.rollNo || viewRecord.id}</span></div>
              <div><span className="text-slate-500 font-medium">Course: </span><span className="font-bold text-slate-800">{viewRecord.course}</span></div>
              <div><span className="text-slate-500 font-medium">Dept: </span><span className="font-bold text-slate-800">{viewRecord.department || viewRecord.course}</span></div>
              {viewRecord.receiptNo && (
                <div><span className="text-slate-500 font-medium">Receipt No: </span><span className="font-bold text-slate-800">{viewRecord.receiptNo}</span></div>
              )}
              <div><span className="text-slate-500 font-medium">Date: </span><span className="font-bold text-slate-800">{viewRecord.lastPaymentDate || viewRecord.paymentDate || '—'}</span></div>
            </div>

            {/* Fee Items Table */}
            <div className="px-6 py-5 space-y-3 max-h-80 overflow-y-auto">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Miscellaneous Fees & Item Breakdown</h4>
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="px-4 py-2.5 text-left font-bold w-8">#</th>
                      <th className="px-4 py-2.5 text-left font-bold">Miscellaneous Fee / Description</th>
                      <th className="px-4 py-2.5 text-right font-bold">Amount (₹)</th>
                      <th className="px-4 py-2.5 text-center font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const allItems = getMiscFeeItems(viewRecord, miscFeeStructure);

                      return allItems.map((item, i) => {
                        const itemPaid = Number(item.paid ?? item.amount ?? 0);
                        const itemTotal = Number(item.amount ?? item.total ?? 0);
                        const itemStatus = item.status || (itemPaid >= itemTotal && itemTotal > 0 ? 'Paid' : (itemPaid > 0 ? 'Partial' : 'Pending'));
                        return (
                          <tr key={i} className="hover:bg-slate-50/80">
                            <td className="px-4 py-2.5 text-slate-400 font-mono text-center">{i + 1}</td>
                            <td className="px-4 py-2.5 font-semibold text-slate-800">
                              <div>{item.feeType || item.name}</div>
                              {item.section && item.section !== item.feeType && (
                                <div className="text-[10px] text-slate-400 font-normal">{item.section}</div>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span className="font-bold text-emerald-700">₹{itemPaid.toLocaleString('en-IN')}</span>
                              {itemTotal > 0 && itemPaid !== itemTotal && (
                                <span className="text-slate-400 ml-1">/ ₹{itemTotal.toLocaleString('en-IN')}</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                itemStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : itemStatus === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>{itemStatus}</span>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const allItems = getMiscFeeItems(viewRecord, miscFeeStructure);
                      const paidTotal = allItems.reduce((acc, it) => acc + Number(it.paid || 0), 0);
                      let feeTotal = allItems.reduce((acc, it) => acc + Number(it.amount || it.paid || 0), 0);
                      if (paidTotal > feeTotal) feeTotal = paidTotal;
                      const balanceTotal = Math.max(0, feeTotal - paidTotal);
                      return (
                        <>
                          <tr className="bg-slate-50 border-t border-slate-200">
                            <td colSpan="2" className="px-4 py-2.5 text-right font-bold text-slate-600 text-xs">Total Miscellaneous Fees:</td>
                            <td className="px-4 py-2.5 text-right font-black text-slate-800">₹{feeTotal.toLocaleString('en-IN')}</td>
                            <td />
                          </tr>
                          <tr className="bg-emerald-50/60 border-t border-emerald-100">
                            <td colSpan="2" className="px-4 py-2.5 text-right font-bold text-emerald-700 text-xs">Amount Paid:</td>
                            <td className="px-4 py-2.5 text-right font-black text-emerald-700">₹{paidTotal.toLocaleString('en-IN')}</td>
                            <td />
                          </tr>
                          {balanceTotal > 0 && (
                            <tr className="bg-rose-50/60 border-t border-rose-100">
                              <td colSpan="2" className="px-4 py-2.5 text-right font-bold text-rose-700 text-xs">Balance Outstanding:</td>
                              <td className="px-4 py-2.5 text-right font-black text-rose-700">₹{balanceTotal.toLocaleString('en-IN')}</td>
                              <td />
                            </tr>
                          )}
                        </>
                      );
                    })()}
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => { setViewRecord(null); handleDownloadReceipt(viewRecord); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setViewRecord(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-md"
              >
                Close
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
