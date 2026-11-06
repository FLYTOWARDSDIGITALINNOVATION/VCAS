import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE, BACKEND_URL, getKnownDepartments } from '../../apiConfig';
import {
  CheckSquare, Calendar as CalendarIcon, Clock, Users,
  CheckCircle2, XCircle, History, Save, AlertCircle,
  Search, BookOpen, ChevronRight, Plus, UploadCloud, Download,
  FileSpreadsheet, Loader2, Filter, Layers, X, Building2, GraduationCap
} from 'lucide-react';
import ModalPortal from '../ModalPortal';
import ExcelAttendanceUploadModal from './ExcelAttendanceUploadModal';

// Dynamic loader for SheetJS
const getSheetJS = () => {
  if (typeof window !== 'undefined' && window.XLSX) {
    return Promise.resolve(window.XLSX);
  }
  return new Promise((resolve) => {
    try {
      const script = document.createElement('script');
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
      script.async = true;
      script.onload = () => resolve(window.XLSX || null);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    } catch (_) {
      resolve(null);
    }
  });
};

export default function StaffAttendance({ staffUser }) {
  const isHodUser = Boolean(
    staffUser?.isHod ||
    staffUser?.role?.toUpperCase?.().includes('HOD') ||
    staffUser?.designation?.toUpperCase?.().includes('HOD')
  );

  const [activeTab, setActiveTab] = useState('mark'); // 'mark' | 'history'

  // Department Selection & Available Departments
  const [selectedDepartment, setSelectedDepartment] = useState(() => staffUser?.department || 'All');
  const [adminDepartments, setAdminDepartments] = useState([]);

  // Year Selection ('All' | '1st Year' | '2nd Year' | '3rd Year' | '4th Year')
  const [selectedYear, setSelectedYear] = useState('All');

  // Classes & Student Roster
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedClassCode, setSelectedClassCode] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sessionSlot, setSessionSlot] = useState('8:30 AM');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Attendance state: rollNo -> 'Present' | 'Absent' | 'Late'
  const [attendanceState, setAttendanceState] = useState({});

  // Real Attendance History from database
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyDeptFilter, setHistoryDeptFilter] = useState('All');
  const [historyYearFilter, setHistoryYearFilter] = useState('All');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Quick Student Add & Auto-Import state
  const [allRegisteredStudents, setAllRegisteredStudents] = useState([]);
  const [selectedQuickAddRoll, setSelectedQuickAddRoll] = useState('');
  const [showQuickAddDropdown, setShowQuickAddDropdown] = useState(false);
  const [isSyncingRoster, setIsSyncingRoster] = useState(false);

  // Bulk Upload Modal & Filtered Download Modal states
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadMode, setDownloadMode] = useState('department'); // 'department' | 'year' | 'batch' | 'semester' | 'all'
  const [downloadDept, setDownloadDept] = useState(() => staffUser?.department || 'Computer Science');
  const [downloadYear, setDownloadYear] = useState('I Year');
  const [downloadBatch, setDownloadBatch] = useState('2022-2026');
  const [downloadSemester, setDownloadSemester] = useState('1');

  // Quick date range state — visible directly in the header for fast download
  const todayStr = new Date().toISOString().split('T')[0];
  const firstOfMonthStr = (() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; })();
  const [downloadStartDate, setDownloadStartDate] = useState(firstOfMonthStr);
  const [downloadEndDate, setDownloadEndDate] = useState(todayStr);

  const [downloadFormat, setDownloadFormat] = useState('excel'); // 'excel' | 'csv'
  const [isExporting, setIsExporting] = useState(false);

  // Download Attendance Data Handler
  const handleDownloadAttendanceData = async () => {
    try {
      if (downloadStartDate && downloadEndDate && downloadStartDate > downloadEndDate) {
        alert('From date cannot be later than To date.');
        return;
      }

      setIsExporting(true);
      const params = new URLSearchParams();

      if (downloadMode === 'department') {
        params.append('department', downloadDept);
      } else if (downloadMode === 'year') {
        params.append('year', downloadYear);
      } else if (downloadMode === 'batch') {
        params.append('batch', downloadBatch);
      } else if (downloadMode === 'semester') {
        params.append('semester', downloadSemester);
      } else if (downloadMode === 'all') {
        if (downloadDept && downloadDept !== 'All') params.append('department', downloadDept);
        if (downloadYear && downloadYear !== 'All') params.append('year', downloadYear);
        if (downloadBatch && downloadBatch !== 'All') params.append('batch', downloadBatch);
        if (downloadSemester && downloadSemester !== 'All') params.append('semester', downloadSemester);
      }

      if (downloadStartDate) params.append('startDate', downloadStartDate);
      if (downloadEndDate) params.append('endDate', downloadEndDate);

      const res = await fetch(`${API_BASE}/attendance/export/filtered?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch attendance data for export.');
      }

      const summaries = data.studentSummaries || [];
      const sessions = data.sessions || [];

      if (summaries.length === 0 && sessions.length === 0) {
        alert(`No attendance records found for ${downloadMode} selection.`);
        setIsExporting(false);
        return;
      }

      const dateStamp = new Date().toISOString().split('T')[0];
      const rangeSuffix = downloadStartDate || downloadEndDate
        ? `_${downloadStartDate || 'start'}_to_${downloadEndDate || 'end'}`
        : '';
      const filename = `Attendance_${downloadMode}_${downloadMode === 'department' ? downloadDept.replace(/\s+/g, '_') : downloadMode === 'batch' ? downloadBatch : downloadMode === 'year' ? downloadYear.replace(/\s+/g, '_') : 'Sem' + downloadSemester}${rangeSuffix}_${dateStamp}`;

      const rowsToExport = summaries.length > 0 ? summaries.map((s, idx) => ({
        'S.No': idx + 1,
        'Roll No': s.rollNo,
        'Register No': s.regNo || '',
        'Student Name': s.name,
        'Department': s.department || downloadDept || '',
        'Batch': s.batch || downloadBatch || '',
        'Semester': s.semester || downloadSemester || '',
        'Total Sessions': s.totalClasses,
        'Present': s.present,
        'Absent': s.absent,
        'Late': s.late,
        'Attendance %': `${s.percentage}%`
      })) : sessions.flatMap((sess, sIdx) => 
        (sess.records || []).map((r, rIdx) => ({
          'S.No': `${sIdx + 1}.${rIdx + 1}`,
          'Date': sess.date,
          'Slot': sess.slot,
          'Class Code': sess.classCode,
          'Roll No': r.rollNo,
          'Student Name': r.name,
          'Status': r.status,
          'Remarks': r.remarks || ''
        }))
      );

      if (downloadFormat === 'excel') {
        const XLSX = await getSheetJS();
        if (XLSX) {
          const ws = XLSX.utils.json_to_sheet(rowsToExport);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
          XLSX.writeFile(wb, `${filename}.xlsx`);
        } else {
          downloadAsCsv(rowsToExport, filename);
        }
      } else {
        downloadAsCsv(rowsToExport, filename);
      }

      setSavedSuccessMsg(`Attendance data downloaded successfully (${downloadMode}-wise)!`);
      setShowDownloadModal(false);
    } catch (err) {
      console.error('Export error:', err);
      alert('Error downloading attendance: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadAsCsv = (rows, filename) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    let csv = headers.join(',') + '\n';
    rows.forEach(r => {
      csv += headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick Download — triggered by the inline From/To date header button
  // Downloads the current department's attendance within the selected date range directly
  const handleQuickDownload = async () => {
    try {
      if (downloadStartDate && downloadEndDate && downloadStartDate > downloadEndDate) {
        alert('From date cannot be later than To date.');
        return;
      }
      setIsExporting(true);
      const params = new URLSearchParams();
      const deptToUse = selectedDepartment && selectedDepartment !== 'All'
        ? selectedDepartment
        : (staffUser?.department || downloadDept || '');
      if (deptToUse) params.append('department', deptToUse);
      if (selectedYear && selectedYear !== 'All') params.append('year', selectedYear);
      if (downloadStartDate) params.append('startDate', downloadStartDate);
      if (downloadEndDate) params.append('endDate', downloadEndDate);

      const res = await fetch(`${API_BASE}/attendance/export/filtered?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch attendance data for export.');
      }

      const summaries = data.studentSummaries || [];
      const sessions = data.sessions || [];

      if (summaries.length === 0 && sessions.length === 0) {
        alert(`No attendance records found for ${deptToUse || 'selected'}${selectedYear !== 'All' ? ` (${selectedYear})` : ''} between ${downloadStartDate} and ${downloadEndDate}.`);
        return;
      }

      const rangeSuffix = `_${downloadStartDate}_to_${downloadEndDate}`;
      const yrSuffix = selectedYear && selectedYear !== 'All' ? `_${selectedYear.replace(/\s+/g, '_')}` : '';
      const filename = `Attendance_${(deptToUse || 'All').replace(/\s+/g, '_')}${yrSuffix}${rangeSuffix}`;

      const rowsToExport = summaries.length > 0
        ? summaries.map((s, idx) => ({
            'S.No': idx + 1,
            'Roll No': s.rollNo,
            'Register No': s.regNo || '',
            'Student Name': s.name,
            'Department': s.department || deptToUse || '',
            'Batch': s.batch || '',
            'Semester': s.semester || '',
            'Total Sessions': s.totalClasses,
            'Present': s.present,
            'Absent': s.absent,
            'Late': s.late,
            'Attendance %': `${s.percentage}%`
          }))
        : sessions.flatMap((sess, sIdx) =>
            (sess.records || []).map((r, rIdx) => ({
              'S.No': `${sIdx + 1}.${rIdx + 1}`,
              'Date': sess.date,
              'Slot': sess.slot,
              'Class Code': sess.classCode,
              'Roll No': r.rollNo,
              'Student Name': r.name,
              'Status': r.status,
              'Remarks': r.remarks || ''
            }))
          );

      const XLSX = await getSheetJS();
      if (XLSX) {
        const ws = XLSX.utils.json_to_sheet(rowsToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
        XLSX.writeFile(wb, `${filename}.xlsx`);
      } else {
        downloadAsCsv(rowsToExport, filename);
      }

      setSavedSuccessMsg(`✓ Attendance downloaded for ${deptToUse || 'All'} (${downloadStartDate} → ${downloadEndDate})`);
      setTimeout(() => setSavedSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Quick download error:', err);
      alert('Error downloading attendance: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Fetch classes from backend API (including HOD-added department subjects)
  const fetchClasses = async () => {
    if (!staffUser?.staffId) return;
    try {
      setLoadingClasses(true);

      let allDeptClasses = [];
      if (isHodUser && staffUser?.department) {
        // Load all classes for this department
        const deptRes = await fetch(`${API_BASE}/classes?dept=${encodeURIComponent(staffUser.department)}`);
        const deptData = await deptRes.json();
        if (deptData.success && Array.isArray(deptData.classes)) {
          allDeptClasses = deptData.classes;
        }

        // Also load subjects added by HOD from /subjects endpoint and convert to class-like shape
        try {
          const subRes = await fetch(`${API_BASE}/subjects`);
          const subData = await subRes.json();
          const rawSubs = subData?.subjects || subData?.data || (Array.isArray(subData) ? subData : []);
          const deptLower = staffUser.department.trim().toLowerCase();
          const hodSubjectsAsClasses = rawSubs
            .filter(s => {
              if (!s || !s.code) return false;
              const subDept = (s.department || s.dept || '').trim().toLowerCase();
              return subDept && (subDept === deptLower || subDept.includes(deptLower) || deptLower.includes(subDept));
            })
            .map(s => ({
              code: (s.code || '').trim().toUpperCase(),
              name: s.name || s.code,
              dept: s.department || s.dept || staffUser.department,
              year: Number(s.year) || 1,
              semester: s.sem ? (parseInt(String(s.sem).replace(/\D/g, ''), 10) || 1) : 1,
              section: s.section || 'A',
              credits: Number(s.credits) || 3,
              theoryHours: Number(s.theoryHours) || 3,
              labHours: Number(s.labHours) || 0,
              staffId: s.faculty || s.staffId || staffUser.staffId,
              staffName: s.staffName || s.faculty || staffUser.name || '',
              students: s.students || [],
              _fromSubjectsAPI: true
            }));
          allDeptClasses = [...allDeptClasses, ...hodSubjectsAsClasses];
        } catch (_) {}
      }

      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}`);
      const data = await res.json();
      const staffClasses = data.success && Array.isArray(data.classes) ? data.classes : [];

      // For non-HOD staff, also load their own subjects from /subjects so their own subjects appear
      let ownSubjectsAsClasses = [];
      if (!isHodUser) {
        try {
          const subRes = await fetch(`${API_BASE}/subjects`);
          const subData = await subRes.json();
          const rawSubs = subData?.subjects || subData?.data || (Array.isArray(subData) ? subData : []);
          const staffIdLower = (staffUser.staffId || '').trim().toLowerCase();
          const staffNameLower = (staffUser.name || '').trim().toLowerCase();
          ownSubjectsAsClasses = rawSubs
            .filter(s => {
              if (!s || !s.code) return false;
              const faculty = (s.faculty || s.staffName || s.staffId || '').trim().toLowerCase();
              const createdBy = (s.createdBy || s.createdByName || '').trim().toLowerCase();
              return (
                faculty === staffIdLower ||
                faculty === staffNameLower ||
                faculty.includes(staffNameLower) ||
                createdBy === staffIdLower ||
                createdBy === staffNameLower
              );
            })
            .map(s => ({
              code: (s.code || '').trim().toUpperCase(),
              name: s.name || s.code,
              dept: s.department || s.dept || staffUser.department || '',
              year: Number(s.year) || 1,
              semester: s.sem ? (parseInt(String(s.sem).replace(/\D/g, ''), 10) || 1) : 1,
              section: s.section || 'A',
              credits: Number(s.credits) || 3,
              theoryHours: Number(s.theoryHours) || 3,
              labHours: Number(s.labHours) || 0,
              staffId: staffUser.staffId,
              staffName: staffUser.name || '',
              students: s.students || [],
              _fromSubjectsAPI: true
            }));
        } catch (_) {}
      }

      const mergedClasses = isHodUser && staffUser?.department
        ? [...allDeptClasses, ...staffClasses]
        : [...staffClasses, ...ownSubjectsAsClasses];

      // Deduplicate by subject code (keep existing class record over subjects-API stub)
      const seen = new Set();
      const uniqueClasses = mergedClasses.filter(cls => {
        const key = (cls.code || '').trim().toUpperCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const departmentScopedClasses = isHodUser && staffUser?.department
        ? uniqueClasses.filter(cls => {
            const clsDept = (cls.dept || '').trim().toLowerCase();
            const userDept = (staffUser.department || '').trim().toLowerCase();
            return !clsDept || !userDept || clsDept === userDept;
          })
        : uniqueClasses;

      setClasses(departmentScopedClasses);
      if (departmentScopedClasses.length > 0 && !selectedClassCode) {
        setSelectedClassCode(departmentScopedClasses[0].code);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoadingClasses(false);
    }
  };

  // Fetch real attendance history from database
  const fetchHistory = async () => {
    if (!staffUser?.staffId) return;
    try {
      setLoadingHistory(true);
      const res = await fetch(`${API_BASE}/attendance/staff/${staffUser.staffId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.sessions)) {
        setHistoryList(data.sessions);
      }
    } catch (err) {
      console.error('Error fetching attendance history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch registered students — optionally filtered by dept+year for efficiency
  const fetchRegisteredStudents = async (dept = null, yr = null) => {
    try {
      const params = new URLSearchParams();
      if (dept && dept !== 'All') params.set('department', dept);
      if (yr && yr !== 'All') params.set('year', yr);
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_BASE}/students${query}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAllRegisteredStudents(data.data);
      }
    } catch (err) {
      console.error('Error fetching registered students:', err);
    }
  };

  // Fetch admin departments
  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/departments`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAdminDepartments(data.data);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchHistory();
    fetchRegisteredStudents(); // fetch all on initial load
    fetchDepartments();
  }, [staffUser?.staffId]);

  // Re-fetch students whenever dept or year filter changes (server-side filter = exact match)
  useEffect(() => {
    if (selectedDepartment && selectedDepartment !== 'All') {
      fetchRegisteredStudents(
        selectedDepartment !== 'All' ? selectedDepartment : null,
        selectedYear !== 'All' ? selectedYear : null
      );
    } else {
      // When "All" dept — fetch everything
      fetchRegisteredStudents();
    }
  }, [selectedDepartment, selectedYear]);

  // Derived available departments
  const availableDepartments = useMemo(() => {
    const set = new Set();
    getKnownDepartments().forEach(d => { if (d) set.add(d); });
    adminDepartments.forEach(d => {
      const name = typeof d === 'string' ? d : d?.name;
      if (name) set.add(name);
    });
    allRegisteredStudents.forEach(s => {
      if (s.department) set.add(s.department);
    });
    classes.forEach(c => {
      if (c.dept) set.add(c.dept);
    });
    if (staffUser?.department) set.add(staffUser.department);
    return Array.from(set).sort();
  }, [adminDepartments, allRegisteredStudents, classes, staffUser?.department]);

  // Quick Add a registered student directly to this class
  const handleQuickAddStudentToClass = async (roll) => {
    if (!roll || !currentClass) return;
    const student = allRegisteredStudents.find(s => (s.rollNo || s.regNo || s.studentId) === roll);
    if (!student) return;

    try {
      setIsSyncingRoster(true);
      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}/${currentClass.code}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNo: student.rollNo || student.regNo || student.studentId,
          name: student.name,
          phone: student.phone || '',
          email: student.email || ''
        })
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccessMsg(`Added ${student.name} (${student.rollNo || student.regNo}) to roster! You can now mark attendance.`);
        setSelectedQuickAddRoll('');
        setShowQuickAddDropdown(false);
        fetchClasses();
      } else {
        setSubmitError(data.message || 'Failed to add student to class.');
      }
    } catch (err) {
      setSubmitError('Error adding student: ' + err.message);
    } finally {
      setIsSyncingRoster(false);
    }
  };

  // 1-Click Auto Import all department students into class roster
  const handleAutoImportDeptStudents = async () => {
    if (!currentClass) return;
    try {
      setIsSyncingRoster(true);
      setSubmitError('');
      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}/${currentClass.code}/auto-enroll`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccessMsg(data.message || 'Department students imported successfully!');
        fetchClasses();
      } else {
        setSubmitError(data.message || 'Auto-import failed.');
      }
    } catch (err) {
      setSubmitError('Error importing students: ' + err.message);
    } finally {
      setIsSyncingRoster(false);
    }
  };

  // Year & Department Normalization Helpers
  const extractYearNumber = (value) => {
    if (!value && value !== 0) return null;
    const str = String(value).trim().toLowerCase();
    if (!str || str === 'all') return null;

    if (str === 'iv' || str.startsWith('iv ') || str.includes('4th') || str.includes('fourth')) return 4;
    if (str === 'iii' || str.startsWith('iii ') || str.includes('3rd') || str.includes('third')) return 3;
    if (str === 'ii' || str.startsWith('ii ') || str.includes('2nd') || str.includes('second')) return 2;
    if (str === 'i' || str.startsWith('i ') || str.includes('1st') || str.includes('first')) return 1;

    const digits = str.match(/\d+/);
    if (digits) {
      const num = parseInt(digits[0], 10);
      if (num >= 1 && num <= 6) return num;
    }
    return null;
  };

  const getStudentYearNumber = (stu) => {
    if (!stu) return null;
    const yrNum = extractYearNumber(stu.year);
    if (yrNum !== null) return yrNum;

    const semStr = String(stu.sem || stu.semester || '').trim().toLowerCase();
    const semDigits = semStr.match(/\d+/);
    if (semDigits) {
      const semNum = parseInt(semDigits[0], 10);
      if (semNum >= 1 && semNum <= 10) {
        return Math.ceil(semNum / 2);
      }
    }
    return null;
  };

  const matchesStudentYear = (stu, targetYear) => {
    if (!targetYear || targetYear === 'All' || targetYear === 'ALL') return true;
    const targetYearNum = extractYearNumber(targetYear);
    if (!targetYearNum) return true;
    const stuYearNum = getStudentYearNumber(stu);
    if (stuYearNum !== null) {
      return stuYearNum === targetYearNum;
    }
    return false;
  };

  const matchesStudentDept = (stu, targetDept) => {
    if (!targetDept || targetDept === 'All' || targetDept === 'ALL') return true;
    const cleanTarget = targetDept.toLowerCase().trim();
    const d = String(stu?.department || '').toLowerCase().trim();
    const c = String(stu?.course || '').toLowerCase().trim();
    const ca = String(stu?.courseAdmitted || '').toLowerCase().trim();

    // Exact match first
    if (d && d === cleanTarget) return true;
    if (c && c === cleanTarget) return true;
    if (ca && ca === cleanTarget) return true;

    // Normalize (remove spaces, punctuation)
    const normTarget = cleanTarget.replace(/[^a-z0-9]/g, '');
    const normD = d.replace(/[^a-z0-9]/g, '');
    const normC = c.replace(/[^a-z0-9]/g, '');
    const normCA = ca.replace(/[^a-z0-9]/g, '');

    // Exact normalized match
    if (normD && normD === normTarget) return true;
    if (normC && normC === normTarget) return true;
    if (normCA && normCA === normTarget) return true;

    // Longer value contains shorter — only if target is a meaningful substring (len >= 3)
    if (normTarget.length >= 3) {
      if (normD && normD.includes(normTarget)) return true;
      if (normC && normC.includes(normTarget)) return true;
    }

    // Abbreviation aliases — strict word-boundary approach
    // Map full names → canonical abbreviation
    const abbrevMap = {
      computerscience: 'cs', compsci: 'cs', bsc: 'bsc',
      informationtechnology: 'it', infotech: 'it',
      businessadministration: 'bba', commerceaccounts: 'bcom',
      bca: 'bca', mca: 'mca', mba: 'mba',
    };
    const resolveAbbrev = (val) => {
      const v = val.replace(/[^a-z0-9]/g, '');
      return abbrevMap[v] || v;
    };
    const tResolved = resolveAbbrev(normTarget);
    const dResolved = resolveAbbrev(normD);
    const cResolved = resolveAbbrev(normC);

    if (tResolved && tResolved === dResolved) return true;
    if (tResolved && tResolved === cResolved) return true;

    return false;
  };

  // Filter classes according to selected department AND selected year
  const filteredClasses = useMemo(() => {
    let list = classes;
    if (selectedDepartment && selectedDepartment !== 'All') {
      const deptNorm = selectedDepartment.toLowerCase().trim();
      list = list.filter(c => {
        const d = (c.dept || '').toLowerCase().trim();
        return Boolean(d && (d === deptNorm || d.includes(deptNorm) || deptNorm.includes(d)));
      });
    }
    if (selectedYear && selectedYear !== 'All') {
      const targetYr = extractYearNumber(selectedYear);
      if (targetYr) {
        list = list.filter(c => {
          if (!c.year) return true;
          const classYr = extractYearNumber(c.year);
          return classYr ? classYr === targetYr : true;
        });
      }
    }
    return list;
  }, [classes, selectedDepartment, selectedYear]);

  // Current active class object
  const currentClass = useMemo(() => {
    if (selectedClassCode === 'ALL_DEPT') {
      const deptLabel = selectedDepartment !== 'All' ? selectedDepartment : 'Department';
      const yrLabel = selectedYear !== 'All' ? ` (${selectedYear})` : '';
      return {
        code: 'ALL_DEPT',
        name: `All ${deptLabel}${yrLabel} Students (General Attendance)`,
        dept: selectedDepartment !== 'All' ? selectedDepartment : '',
        year: selectedYear !== 'All' ? selectedYear : '',
        isAllDept: true
      };
    }
    if (filteredClasses.length === 0) return null;
    return filteredClasses.find(c => c.code === selectedClassCode) || filteredClasses[0] || null;
  }, [filteredClasses, selectedClassCode, selectedDepartment, selectedYear]);

  const handleDepartmentChange = (newDept) => {
    setSelectedDepartment(newDept);
    setSearchQuery('');
    const deptNorm = (newDept && newDept !== 'All') ? newDept.toLowerCase().trim() : '';
    const targetYr = extractYearNumber(selectedYear);

    const matched = classes.filter(c => {
      const d = (c.dept || '').toLowerCase().trim();
      const matchDept = !deptNorm || Boolean(d && (d === deptNorm || d.includes(deptNorm) || deptNorm.includes(d)));
      const classYr = extractYearNumber(c.year);
      const matchYr = !targetYr || !classYr || classYr === targetYr;
      return matchDept && matchYr;
    });

    if (matched.length > 0) {
      setSelectedClassCode(matched[0].code);
    } else {
      setSelectedClassCode('ALL_DEPT');
    }
  };

  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);
    setSearchQuery('');
    const deptNorm = (selectedDepartment && selectedDepartment !== 'All') ? selectedDepartment.toLowerCase().trim() : '';
    const targetYr = extractYearNumber(newYear);

    const matched = classes.filter(c => {
      const d = (c.dept || '').toLowerCase().trim();
      const matchDept = !deptNorm || Boolean(d && (d === deptNorm || d.includes(deptNorm) || deptNorm.includes(d)));
      const classYr = extractYearNumber(c.year);
      const matchYr = !targetYr || !classYr || classYr === targetYr;
      return matchDept && matchYr;
    });

    if (matched.length > 0) {
      setSelectedClassCode(matched[0].code);
    } else {
      setSelectedClassCode('ALL_DEPT');
    }
  };

  // Effective students list: applies BOTH department and year filters accurately.
  const effectiveStudents = useMemo(() => {
    const isAllDept = selectedClassCode === 'ALL_DEPT' || currentClass?.isAllDept;

    // 1. If "All Department Students" (General Attendance) is selected:
    if (isAllDept || !currentClass) {
      return allRegisteredStudents.filter(s => {
        const matchDept = matchesStudentDept(s, selectedDepartment);
        const matchYear = matchesStudentYear(s, selectedYear);
        return matchDept && matchYear;
      }).map(s => {
        const yrNum = getStudentYearNumber(s);
        const yrLabel = yrNum ? `${yrNum}st Year`.replace('1st Year', '1st Year').replace('2st Year', '2nd Year').replace('3st Year', '3rd Year').replace('4st Year', '4th Year') : (selectedYear !== 'All' ? selectedYear : '1st Year');
        return {
          rollNo: (s.rollNo || s.regNo || s.studentId || '').toUpperCase(),
          name: s.name,
          department: s.department || selectedDepartment || 'General',
          year: s.year || yrLabel,
          phone: s.phone || '',
          email: s.email || ''
        };
      });
    }

    // 2. If a specific class is selected and has an enrolled roster:
    const classRoster = currentClass?.students || currentClass?.enrolledStudents || [];
    if (classRoster.length > 0) {
      const filteredRoster = classRoster.filter(s => {
        if (!selectedYear || selectedYear === 'All') return true;
        const regStudent = allRegisteredStudents.find(
          r => (r.rollNo || r.regNo || r.studentId || '').toUpperCase() === (s.rollNo || '').toUpperCase()
        );
        return matchesStudentYear(regStudent || s, selectedYear);
      });

      return (filteredRoster.length > 0 ? filteredRoster : classRoster).map(s => {
        const regStudent = allRegisteredStudents.find(
          r => (r.rollNo || r.regNo || r.studentId || '').toUpperCase() === (s.rollNo || '').toUpperCase()
        );
        const yrNum = getStudentYearNumber(regStudent || s);
        const yrLabel = yrNum
          ? `${yrNum}st Year`.replace('1st Year', '1st Year').replace('2st Year', '2nd Year').replace('3st Year', '3rd Year').replace('4st Year', '4th Year')
          : (currentClass?.year ? `${currentClass.year}st Year`.replace('1st Year', '1st Year').replace('2st Year', '2nd Year').replace('3st Year', '3rd Year').replace('4st Year', '4th Year') : (selectedYear !== 'All' ? selectedYear : ''));
        return {
          rollNo: (s.rollNo || '').toUpperCase(),
          name: s.name,
          department: currentClass?.dept || s.department || regStudent?.department || selectedDepartment || 'General',
          year: s.year || regStudent?.year || yrLabel,
          phone: s.phone || regStudent?.phone || '',
          email: s.email || regStudent?.email || ''
        };
      });
    }

    // 3. Class has no pre-enrolled roster -> match registered students by class dept, class year, section, and selectedYear
    const targetDept = currentClass.dept || selectedDepartment;
    const targetYear = selectedYear !== 'All' ? selectedYear : (currentClass.year ? `${currentClass.year} Year` : 'All');
    const classSection = (currentClass.section || '').trim().toUpperCase();

    const matchedReg = allRegisteredStudents.filter(s => {
      const matchDept = matchesStudentDept(s, targetDept);
      const matchYear = matchesStudentYear(s, targetYear);
      const matchSection = !classSection || !s.section || String(s.section).trim().toUpperCase() === classSection;
      return matchDept && matchYear && matchSection;
    }).map(s => {
      const yrNum = getStudentYearNumber(s);
      const yrLabel = yrNum ? `${yrNum}st Year`.replace('1st Year', '1st Year').replace('2st Year', '2nd Year').replace('3st Year', '3rd Year').replace('4st Year', '4th Year') : '1st Year';
      return {
        rollNo: (s.rollNo || s.regNo || s.studentId || '').toUpperCase(),
        name: s.name,
        department: s.department || targetDept || 'General',
        year: s.year || yrLabel,
        phone: s.phone || '',
        email: s.email || ''
      };
    });

    if (matchedReg.length > 0) {
      return matchedReg;
    }

    // Fallback: match by selectedDepartment & selectedYear
    return allRegisteredStudents.filter(s => {
      const matchDept = matchesStudentDept(s, selectedDepartment);
      const matchYear = matchesStudentYear(s, selectedYear);
      return matchDept && matchYear;
    }).map(s => {
      const yrNum = getStudentYearNumber(s);
      const yrLabel = yrNum ? `${yrNum}st Year`.replace('1st Year', '1st Year').replace('2st Year', '2nd Year').replace('3st Year', '3rd Year').replace('4st Year', '4th Year') : (selectedYear !== 'All' ? selectedYear : '1st Year');
      return {
        rollNo: (s.rollNo || s.regNo || s.studentId || '').toUpperCase(),
        name: s.name,
        department: s.department || selectedDepartment || 'General',
        year: s.year || yrLabel,
        phone: s.phone || '',
        email: s.email || ''
      };
    });
  }, [selectedDepartment, selectedYear, selectedClassCode, currentClass, allRegisteredStudents]);

  // Check if an existing session is in historyList
  const existingSession = useMemo(() => {
    const isAllDept = selectedClassCode === 'ALL_DEPT' || currentClass?.isAllDept;
    const yrDigits = (selectedYear && selectedYear !== 'All') ? selectedYear.match(/\d+/)?.[0] : null;
    const yrSuffix = yrDigits ? `-Y${yrDigits}` : '';
    const deptPrefix = (selectedDepartment !== 'All' ? selectedDepartment : 'ALL').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
    const activeCode = isAllDept ? `${deptPrefix}${yrSuffix}-ALL` : (currentClass?.code || selectedClassCode);

    if (!activeCode || !selectedDate || !sessionSlot) return null;
    const cleanSlot = (sessionSlot || '').trim().toLowerCase();
    return historyList.find(s =>
      (s.classCode === activeCode || s.classCode === selectedClassCode || (isAllDept && s.classCode?.startsWith(deptPrefix) && s.classCode?.endsWith('-ALL'))) &&
      s.date === selectedDate &&
      ((s.slot || '').trim().toLowerCase() === cleanSlot || cleanSlot.includes((s.slot || '').trim().toLowerCase()))
    ) || null;
  }, [historyList, currentClass, selectedClassCode, selectedDepartment, selectedYear, selectedDate, sessionSlot]);

  // Sync attendance state whenever class, date, slot, effectiveStudents, or historyList changes
  useEffect(() => {
    if (effectiveStudents.length === 0) {
      setAttendanceState({});
      return;
    }

    const cleanSlot = (sessionSlot || '').trim().toLowerCase();
    const activeCode = currentClass?.code || selectedClassCode;
    const existing = historyList.find(s =>
      (s.classCode === activeCode || s.classCode === selectedClassCode) &&
      s.date === selectedDate &&
      ((s.slot || '').trim().toLowerCase() === cleanSlot || cleanSlot.includes((s.slot || '').trim().toLowerCase()))
    );

    const newMap = {};
    if (existing && Array.isArray(existing.records) && existing.records.length > 0) {
      const savedMap = {};
      existing.records.forEach(r => {
        if (r && r.rollNo) {
          savedMap[r.rollNo.toUpperCase()] = r.status || 'Present';
        }
      });

      effectiveStudents.forEach(s => {
        const rollUpper = (s.rollNo || '').toUpperCase();
        newMap[s.rollNo] = savedMap[rollUpper] || 'Present';
      });
    } else {
      effectiveStudents.forEach(s => {
        newMap[s.rollNo] = 'Present';
      });
    }

    setAttendanceState(newMap);
    setSavedSuccessMsg('');
    setSubmitError('');
  }, [selectedClassCode, currentClass, selectedDepartment, selectedYear, selectedDate, sessionSlot, effectiveStudents, historyList]);

  // Filter students based on search query
  const displayedStudents = useMemo(() => {
    if (!searchQuery.trim()) return effectiveStudents;
    const q = searchQuery.toLowerCase().trim();
    return effectiveStudents.filter(s =>
      String(s.name || '').toLowerCase().includes(q) || String(s.rollNo || '').toLowerCase().includes(q)
    );
  }, [effectiveStudents, searchQuery]);

  // Quick tally counts
  const totalCount = effectiveStudents.length;
  const isOnDutyStatus = (value) => value === 'OD' || value === 'On Duty';

  const presentCount = useMemo(() => {
    return effectiveStudents.filter(s => attendanceState[s.rollNo] === 'Present').length;
  }, [effectiveStudents, attendanceState]);

  const absentCount = useMemo(() => {
    return effectiveStudents.filter(s => attendanceState[s.rollNo] === 'Absent').length;
  }, [effectiveStudents, attendanceState]);

  const lateCount = useMemo(() => {
    return effectiveStudents.filter(s => attendanceState[s.rollNo] === 'Late').length;
  }, [effectiveStudents, attendanceState]);

  const odCount = useMemo(() => {
    return effectiveStudents.filter(s => isOnDutyStatus(attendanceState[s.rollNo])).length;
  }, [effectiveStudents, attendanceState]);

  // Filtered History List by Department, Year, and Search
  const filteredHistoryList = useMemo(() => {
    return historyList.filter(record => {
      if (historyDeptFilter && historyDeptFilter !== 'All') {
        const cleanDept = historyDeptFilter.toLowerCase().trim();
        const rDept = String(record.department || '').toLowerCase().trim();
        const rName = String(record.className || '').toLowerCase().trim();
        const rCode = String(record.classCode || '').toLowerCase().trim();
        const match = rDept.includes(cleanDept) || cleanDept.includes(rDept) || rName.includes(cleanDept) || rCode.includes(cleanDept.slice(0, 4));
        if (!match) return false;
      }
      if (historyYearFilter && historyYearFilter !== 'All') {
        const targetYr = extractYearNumber(historyYearFilter);
        const rYr = extractYearNumber(record.year || record.className || record.classCode);
        if (targetYr && rYr && targetYr !== rYr) return false;
      }
      if (historySearchQuery && historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase().trim();
        const matchesClass = String(record.classCode || '').toLowerCase().includes(q);
        const matchesName = String(record.className || '').toLowerCase().includes(q);
        const matchesDate = String(record.date || '').toLowerCase().includes(q);
        const matchesSlot = String(record.slot || '').toLowerCase().includes(q);
        if (!matchesClass && !matchesName && !matchesDate && !matchesSlot) return false;
      }
      return true;
    });
  }, [historyList, historyDeptFilter, historyYearFilter, historySearchQuery]);

  const handleMarkAll = (status) => {
    const updated = { ...attendanceState };
    effectiveStudents.forEach(s => {
      updated[s.rollNo] = status;
    });
    setAttendanceState(updated);
  };

  const toggleStudentStatus = (rollNo, status) => {
    setAttendanceState(prev => ({
      ...prev,
      [rollNo]: status
    }));
  };

  const handleLoadSession = (record) => {
    setSelectedClassCode(record.classCode);
    setSelectedDate(record.date);
    if (record.slot) {
      setSessionSlot(record.slot);
    }
    if (record.department) {
      setSelectedDepartment(record.department);
    }
    if (record.year) {
      setSelectedYear(record.year);
    } else {
      const codeOrName = `${record.classCode || ''} ${record.className || ''}`.toLowerCase();
      if (codeOrName.includes('-y1') || codeOrName.includes('1st year') || codeOrName.includes('year 1')) {
        setSelectedYear('1st Year');
      } else if (codeOrName.includes('-y2') || codeOrName.includes('2nd year') || codeOrName.includes('year 2')) {
        setSelectedYear('2nd Year');
      } else if (codeOrName.includes('-y3') || codeOrName.includes('3rd year') || codeOrName.includes('year 3')) {
        setSelectedYear('3rd Year');
      } else if (codeOrName.includes('-y4') || codeOrName.includes('4th year') || codeOrName.includes('year 4')) {
        setSelectedYear('4th Year');
      }
    }
    setActiveTab('mark');
  };

  // Submit or update session attendance
  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSavedSuccessMsg('');

    if (effectiveStudents.length === 0) {
      setSubmitError('No students found for this department/year. Please add or import students.');
      return;
    }

    const isAllDept = selectedClassCode === 'ALL_DEPT' || currentClass?.isAllDept;
    const yrDigits = (selectedYear && selectedYear !== 'All') ? selectedYear.match(/\d+/)?.[0] : null;
    const yrSuffix = yrDigits ? `-Y${yrDigits}` : '';
    const deptPrefix = (selectedDepartment !== 'All' ? selectedDepartment : 'ALL').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();

    const activeCode = isAllDept
      ? `${deptPrefix}${yrSuffix}-ALL`
      : (currentClass?.code || selectedClassCode || `${deptPrefix}${yrSuffix}101`);

    const deptTitle = selectedDepartment !== 'All' ? selectedDepartment : 'Department';
    const yrTitle = (selectedYear && selectedYear !== 'All') ? ` - ${selectedYear}` : '';
    const activeName = isAllDept
      ? `${deptTitle}${yrTitle} - All Students Attendance`
      : (currentClass?.name || `${deptTitle}${yrTitle} Attendance`);

    try {
      setIsSubmitting(true);
      const records = effectiveStudents.map(s => ({
        rollNo: s.rollNo,
        name: s.name,
        department: s.department || selectedDepartment,
        status: attendanceState[s.rollNo] || 'Present'
      }));

      const payload = {
        staffId: staffUser?.staffId || staffUser?.employeeId || 'STAFF',
        staffName: staffUser?.name || 'Staff',
        classCode: activeCode,
        className: activeName,
        department: selectedDepartment !== 'All' ? selectedDepartment : (currentClass?.dept || staffUser?.department || ''),
        year: selectedYear !== 'All' ? selectedYear : (currentClass?.year ? `${currentClass.year} Year` : ''),
        date: selectedDate,
        slot: sessionSlot,
        records
      };

      const res = await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitError(data.message || 'Failed to save attendance.');
        return;
      }

      const saved = data.session;
      setSavedSuccessMsg(`Attendance for ${activeCode} on ${selectedDate} (${sessionSlot}) recorded successfully! (Present: ${saved?.presentCount ?? presentCount}, Absent: ${saved?.absentCount ?? absentCount}, Late: ${saved?.lateCount ?? lateCount}, OD: ${saved?.odCount ?? odCount})`);

      // Update local historyList immediately so existingSession is immediately recognized
      if (saved) {
        setHistoryList(prev => {
          const idx = prev.findIndex(s =>
            s._id === saved._id ||
            (s.classCode === saved.classCode && s.date === saved.date && (s.slot || '').trim().toLowerCase() === (saved.slot || '').trim().toLowerCase())
          );
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = saved;
            return copy;
          }
          return [saved, ...prev];
        });
      }

      fetchHistory();
      setTimeout(() => setSavedSuccessMsg(''), 6000);
    } catch (err) {
      setSubmitError('Network error connecting to backend: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-6xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Attendance Management</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Mark daily attendance, bulk import spreadsheets, and export department/batch-wise reports
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bulk Upload Button */}
          <button
            type="button"
            onClick={() => setShowBulkUploadModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold border border-teal-200 transition-all cursor-pointer shadow-2xs"
            title="Bulk Upload Attendance via Excel or CSV"
          >
            <UploadCloud className="w-4 h-4 text-teal-600" />
            <span>Bulk Upload Attendance</span>
          </button>

          {/* Quick Date Range + Download — visible inline for fast access */}
          <div className="flex items-center gap-2 bg-indigo-50/80 border border-indigo-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <span className="text-indigo-600 text-[10px] font-extrabold uppercase tracking-wide mr-0.5">From</span>
              <input
                type="date"
                value={downloadStartDate}
                max={downloadEndDate || undefined}
                onChange={e => setDownloadStartDate(e.target.value)}
                className="bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 cursor-pointer"
                title="Attendance From Date"
              />
              <span className="text-indigo-400 font-extrabold">→</span>
              <span className="text-indigo-600 text-[10px] font-extrabold uppercase tracking-wide">To</span>
              <input
                type="date"
                value={downloadEndDate}
                min={downloadStartDate || undefined}
                onChange={e => setDownloadEndDate(e.target.value)}
                className="bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 cursor-pointer"
                title="Attendance To Date"
              />
            </div>
            <button
              type="button"
              disabled={isExporting}
              onClick={() => {
                handleQuickDownload();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              title="Download attendance within selected date range"
            >
              {isExporting
                ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> Exporting…</>
                : <><Download className="w-3.5 h-3.5" /> Download</>
              }
            </button>
          </div>

          {/* Advanced filters modal trigger */}
          <button
            type="button"
            onClick={() => setShowDownloadModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border border-slate-200 transition-all cursor-pointer shadow-2xs"
            title="Advanced filters: department, year, batch, semester wise"
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Advanced Filters</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
            <button
              onClick={() => setActiveTab('mark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'mark'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Mark Attendance
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                fetchHistory();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              History ({historyList.length})
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {savedSuccessMsg && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {submitError && (
        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold shadow-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {activeTab === 'mark' ? (
        <div className="space-y-6">
          {/* Controls Bar - Department, Year of Study, Subject, Date, Slot */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {/* Department Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Select Department</span>
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
                >
                  <option value="All">All Departments</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Year of Study</span>
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer font-bold text-indigo-900"
                >
                  <option value="All">All Years</option>
                  <option value="1st Year">1st Year (I Year)</option>
                  <option value="2nd Year">2nd Year (II Year)</option>
                  <option value="3rd Year">3rd Year (III Year)</option>
                  <option value="4th Year">4th Year (IV Year)</option>
                </select>
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Select Subject</span>
                </label>
                <select
                  value={selectedClassCode}
                  onChange={(e) => setSelectedClassCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all cursor-pointer"
                >
                  <option value="ALL_DEPT">
                    ★ All {selectedDepartment !== 'All' ? selectedDepartment : 'Department'} {selectedYear !== 'All' ? `(${selectedYear}) ` : ''}Students
                  </option>
                  {filteredClasses.length > 0 ? (
                    filteredClasses.map(cls => (
                      <option key={cls.code} value={cls.code}>
                        {cls.code} – {cls.name} (Year {cls.year}, Sem {cls.semester})
                      </option>
                    ))
                  ) : null}
                </select>
              </div>

              {/* Date Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-600" />
                  <span>Session Date</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all cursor-pointer"
                />
              </div>

              {/* Time Slot Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span>Session Slot</span>
                </label>
                <select
                  value={sessionSlot}
                  onChange={(e) => setSessionSlot(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all cursor-pointer"
                >
                  <option value="9:30 AM">Period 1 (09:30 AM - 10:30 AM)</option>
                  <option value="10:30 AM">Period 2 (10:30 AM - 11:20 AM)</option>
                  <option value="11:20 AM">Break (11:20 AM - 11:30 AM)</option>
                  <option value="11:30 AM">Period 3 (11:30 AM - 12:20 PM)</option>
                  <option value="12:20 PM">Period 4 (12:20 PM - 01:00 PM)</option>
                  <option value="1:00 PM">Lunch (01:00 PM - 01:30 PM)</option>
                  <option value="1:30 PM">Period 5 (01:30 PM - 02:15 PM)</option>
                  <option value="2:15 PM">Period 6 (02:15 PM - 03:00 PM)</option>
                </select>
              </div>
            </div>

            {/* Active Filter Summary Strip */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2 text-slate-600">
                <span className="font-bold text-slate-500">Active Roster Filter:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200/60">
                  <Building2 className="w-3 h-3 text-blue-600" />
                  <span>{selectedDepartment !== 'All' ? selectedDepartment : 'All Departments'}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60">
                  <GraduationCap className="w-3 h-3 text-indigo-600" />
                  <span>{selectedYear !== 'All' ? selectedYear : 'All Years'}</span>
                </span>
                <span className="text-slate-400 font-medium">
                  • Matching: <strong className="text-slate-800">{totalCount} student{totalCount === 1 ? '' : 's'}</strong>
                </span>
              </div>

              {(selectedDepartment !== 'All' || selectedYear !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDepartment('All');
                    setSelectedYear('All');
                    if (classes.length > 0) setSelectedClassCode(classes[0].code);
                    else setSelectedClassCode('ALL_DEPT');
                  }}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Reset to All Depts & Years
                </button>
              )}
            </div>
          </div>

          {loadingClasses ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-400 font-bold">Loading your classes and students...</p>
            </div>
          ) : (classes.length === 0 && effectiveStudents.length === 0 && (!selectedDepartment || selectedDepartment === 'All') && (!selectedYear || selectedYear === 'All')) ? (
            /* Empty classes banner — no classes AND no dept/year selected */
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">No Students or Subjects Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Please add subjects in <strong>My Classes</strong> or select a department with registered students to mark attendance.
                </p>
              </div>
            </div>
          ) : (effectiveStudents.length === 0 && (selectedDepartment !== 'All' || selectedYear !== 'All')) ? (
            /* Department or Year selected but no students registered under it */
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">No Students Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  No students are registered under <strong>{selectedDepartment !== 'All' ? selectedDepartment : 'the selected criteria'}</strong>{selectedYear !== 'All' ? ` (${selectedYear})` : ''}.
                  Please select another department/year or add students to this roster.
                </p>
              </div>
            </div>
          ) : (
            <>

            {/* Active Session Status Banner */}
            {existingSession ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 bg-emerald-50/90 border border-emerald-200 text-emerald-900 rounded-2xl text-xs shadow-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">
                    Saved Session Active: <span className="font-semibold text-emerald-700">{existingSession.presentCount} Present, {existingSession.absentCount} Absent{existingSession.lateCount ? `, ${existingSession.lateCount} Late` : ''}</span>
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-xs self-start sm:self-auto">
                  Saved Record Loaded
                </span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>No attendance record saved yet for this session slot. Mark students and save to record.</span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-xs self-start sm:self-auto">
                  New Session
                </span>
              </div>
            )}

            {/* Quick Metrics & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 mr-1">Roster Stats:</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                  Total: {totalCount}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                  Present: {presentCount}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">
                  Absent: {absentCount}
                </span>
                {lateCount > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold">
                    Late: {lateCount}
                  </span>
                )}
                {odCount > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs font-bold">
                    OD: {odCount}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleMarkAll('Present')}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('Absent')}
                  className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Mark All Absent
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('OD')}
                  className="px-3 py-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Mark All OD
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || effectiveStudents.length === 0}
                  onClick={handleSaveAttendance}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-extrabold shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Saving...' : existingSession ? 'Save Update' : 'Save Attendance'}
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowQuickAddDropdown(prev => !prev)}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Student</span>
                  </button>

                  {showQuickAddDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-30 space-y-2 animate-in zoom-in-95 text-left">
                      <p className="text-[11px] font-extrabold text-slate-800">Quick Add Registered Student</p>
                      <select
                        value={selectedQuickAddRoll}
                        onChange={(e) => {
                          setSelectedQuickAddRoll(e.target.value);
                          if (e.target.value) handleQuickAddStudentToClass(e.target.value);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="">-- Choose student --</option>
                        {allRegisteredStudents.map(st => {
                          const roll = st.rollNo || st.regNo || st.studentId;
                          return (
                            <option key={st._id || roll} value={roll}>
                              {roll} - {st.name}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowQuickAddDropdown(false)}
                        className="w-full text-center text-[10px] text-slate-400 hover:text-slate-600 font-bold pt-1 cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Student Roster Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {effectiveStudents.length === 0 ? (
                <div className="p-10 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">
                      No students found for <strong>{currentClass ? currentClass.name : (selectedDepartment !== 'All' ? selectedDepartment : 'this selection')}</strong> yet.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      You can add registered students to this roster using the button below.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowQuickAddDropdown(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Student to Class</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100">
                          <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider w-12">#</th>
                          <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Roll No.</th>
                          <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                          <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Dept & Year</th>
                          <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                          <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {displayedStudents.map((student, idx) => {
                          const status = attendanceState[student.rollNo] || 'Present';
                          const normalizedStatus = status === 'On Duty' ? 'OD' : status;
                          return (
                            <tr key={student.rollNo} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-5 py-3 text-slate-400 font-medium">{idx + 1}</td>
                              <td className="px-5 py-3 font-bold text-slate-700">{student.rollNo}</td>
                              <td className="px-5 py-3 font-semibold text-slate-900">{student.name}</td>
                              <td className="px-5 py-3 text-slate-600 hidden md:table-cell font-medium">
                                <div className="font-semibold text-slate-800">{student.department || selectedDepartment || '—'}</div>
                                {student.year && (
                                  <span className="inline-block mt-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.5 rounded-md">
                                    {student.year}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">{student.phone || '—'}</td>
                              <td className="px-5 py-3 text-center">
                                <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl flex-wrap justify-center">
                                  <button
                                    type="button"
                                    onClick={() => toggleStudentStatus(student.rollNo, 'Present')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${normalizedStatus === 'Present'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                  >
                                    Present
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleStudentStatus(student.rollNo, 'Absent')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${normalizedStatus === 'Absent'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                  >
                                    Absent
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleStudentStatus(student.rollNo, 'Late')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${normalizedStatus === 'Late'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                  >
                                    Late
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleStudentStatus(student.rollNo, 'OD')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${normalizedStatus === 'OD'
                                        ? 'bg-violet-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                  >
                                    OD
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Submit Bar */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      {presentCount + lateCount + odCount} of {totalCount} students marked present, late, or OD
                    </span>
                    <button
                      type="button"
                      disabled={isSubmitting || effectiveStudents.length === 0}
                      onClick={handleSaveAttendance}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      {isSubmitting
                        ? 'Saving Attendance...'
                        : existingSession
                          ? 'Update Attendance Session'
                          : 'Submit Session Attendance'}
                    </button>
                  </div>
                </>
              )}
            </div>
            </>
          )}
        </div>
      ) : (
        /* Attendance History View */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Past Submitted Attendance Sessions</h3>
              <p className="text-[11px] text-slate-500 font-medium">Filter past records by department and year, or click Load & Edit to modify</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={historyDeptFilter}
                onChange={(e) => setHistoryDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="All">All Departments</option>
                {availableDepartments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={historyYearFilter}
                onChange={(e) => setHistoryYearFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="All">All Years</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>

              <input
                type="text"
                placeholder="Search history..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none w-36"
              />

              <button
                onClick={fetchHistory}
                className="text-xs font-bold text-blue-600 hover:underline px-1 py-1"
              >
                Refresh
              </button>
            </div>
          </div>

          {loadingHistory ? (
            <div className="p-10 text-center">
              <p className="text-xs text-slate-400 font-bold">Loading attendance history...</p>
            </div>
          ) : filteredHistoryList.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-xs font-bold text-slate-700">No attendance sessions found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {historyList.length === 0
                  ? 'Once you mark and submit attendance for a class, your logs will appear here directly.'
                  : 'No records match the selected department/year filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Slot / Time</th>
                    <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Subject & Year</th>
                    <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Total</th>
                    <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Present</th>
                    <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Absent</th>
                    <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Attendance %</th>
                    <th className="text-right px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredHistoryList.map(record => {
                    const total = record.totalStudents || (record.records ? record.records.length : 0);
                    const present = record.presentCount || 0;
                    const late = record.lateCount || 0;
                    const absent = record.absentCount || 0;
                    const pct = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

                    return (
                      <tr key={record._id || record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-800">{record.date}</td>
                        <td className="px-5 py-3 text-slate-600">{record.slot || '—'}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900">
                          <div>
                            <span className="font-extrabold text-blue-600 mr-1.5">[{record.classCode}]</span>
                            {record.className}
                          </div>
                          {(record.department || record.year) && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {record.department && (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">{record.department}</span>
                              )}
                              {record.year && (
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.5 rounded-md">{record.year}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center text-slate-700 font-bold">{total}</td>
                        <td className="px-5 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">
                            {present}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold">
                            {absent}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md font-extrabold ${pct >= 85 ? 'bg-emerald-50 text-emerald-700' : pct >= 75 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleLoadSession(record)}
                            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-all border border-blue-200"
                          >
                            Load & Edit
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
      )}
      {/* Excel Attendance Upload Modal (Exact match to Super Admin format) */}
      {showBulkUploadModal && (
        <ExcelAttendanceUploadModal
          isOpen={showBulkUploadModal}
          onClose={() => setShowBulkUploadModal(false)}
          staffUser={staffUser}
          classes={classes}
          currentClassCode={currentClass?.code || selectedClassCode}
          currentClassName={currentClass?.name || ''}
          currentRoster={effectiveStudents}
          onSuccess={() => {
            fetchClasses();
            fetchHistory();
          }}
        />
      )}

      {/* Download Filtered Attendance Modal (Dep, Yr, Batch, Sem wise) */}
      {showDownloadModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
              
              {/* Header */}
              <div className="px-6 py-4.5 bg-gradient-to-r from-indigo-700 via-blue-700 to-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base">Download Attendance Records</h3>
                    <p className="text-[11px] text-white/80 font-medium">Export Department, Year, Batch, or Semester data</p>
                  </div>
                </div>
                <button
                  onClick={() => !isExporting && setShowDownloadModal(false)}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 bg-slate-50/50">
                {/* Mode Selector Tabs */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-2">
                    Select Filter Mode:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'department', label: 'Department' },
                      { id: 'year', label: 'Year-wise' },
                      { id: 'batch', label: 'Batch-wise' },
                      { id: 'semester', label: 'Sem-wise' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDownloadMode(tab.id)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
                          downloadMode === tab.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Filter Controls based on Mode */}
                {downloadMode === 'department' && (
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Choose Department</label>
                    <select
                      value={downloadDept}
                      onChange={(e) => setDownloadDept(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {availableDepartments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400">Downloads student attendance records belonging to {downloadDept}.</p>
                  </div>
                )}

                {downloadMode === 'year' && (
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Choose Academic Year</label>
                    <select
                      value={downloadYear}
                      onChange={(e) => setDownloadYear(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="I Year">I Year (1st & 2nd Sem)</option>
                      <option value="II Year">II Year (3rd & 4th Sem)</option>
                      <option value="III Year">III Year (5th & 6th Sem)</option>
                    </select>
                    <p className="text-[10px] text-slate-400">Downloads all attendance sessions and roster for {downloadYear}.</p>
                  </div>
                )}

                {downloadMode === 'batch' && (
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Choose Batch</label>
                    <select
                      value={downloadBatch}
                      onChange={(e) => setDownloadBatch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="2021-2025">Batch 2021-2025</option>
                      <option value="2022-2026">Batch 2022-2026</option>
                      <option value="2023-2027">Batch 2023-2027</option>
                      <option value="2024-2028">Batch 2024-2028</option>
                    </select>
                    <p className="text-[10px] text-slate-400">Downloads student attendance summaries strictly for Batch {downloadBatch}.</p>
                  </div>
                )}

                {downloadMode === 'semester' && (
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Choose Semester</label>
                    <select
                      value={downloadSemester}
                      onChange={(e) => setDownloadSemester(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {[1, 2, 3, 4, 5, 6].map(s => (
                        <option key={s} value={String(s)}>Semester {s}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400">Downloads attendance records for Semester {downloadSemester}.</p>
                  </div>
                )}

                {/* Date Range Filter */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-slate-700">Date Range</label>
                    <span className="text-[10px] font-semibold text-slate-400">Optional</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">From</label>
                      <input
                        type="date"
                        value={downloadStartDate}
                        onChange={(e) => setDownloadStartDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">To</label>
                      <input
                        type="date"
                        value={downloadEndDate}
                        min={downloadStartDate || undefined}
                        onChange={(e) => setDownloadEndDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Download records only within the selected date range.</p>
                </div>

                {/* Format selection */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">File Format:</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="radio"
                        name="attDownloadFormat"
                        value="excel"
                        checked={downloadFormat === 'excel'}
                        onChange={() => setDownloadFormat('excel')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Microsoft Excel (.xlsx)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="radio"
                        name="attDownloadFormat"
                        value="csv"
                        checked={downloadFormat === 'csv'}
                        onChange={() => setDownloadFormat('csv')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Comma Separated (.csv)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDownloadModal(false)}
                  disabled={isExporting}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDownloadAttendanceData}
                  disabled={isExporting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-extrabold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>{isExporting ? 'Generating Download...' : `Download ${downloadMode === 'department' ? 'Dept' : downloadMode === 'batch' ? 'Batch' : downloadMode === 'year' ? 'Year' : 'Sem'} Data`}</span>
                </button>
              </div>

            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
