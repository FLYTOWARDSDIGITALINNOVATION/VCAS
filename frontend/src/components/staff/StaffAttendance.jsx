import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE, BACKEND_URL, getKnownDepartments } from '../../apiConfig';
import {
  CheckSquare, Calendar as CalendarIcon, Clock, Users,
  CheckCircle2, XCircle, History, Save, AlertCircle,
  Search, BookOpen, ChevronRight, Plus, UploadCloud, Download,
  FileSpreadsheet, Loader2, Filter, Layers, X
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
  const [activeTab, setActiveTab] = useState('mark'); // 'mark' | 'history'

  // Department Selection & Available Departments
  const [selectedDepartment, setSelectedDepartment] = useState(() => staffUser?.department || 'All');
  const [adminDepartments, setAdminDepartments] = useState([]);

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
  const [downloadFormat, setDownloadFormat] = useState('excel'); // 'excel' | 'csv'
  const [isExporting, setIsExporting] = useState(false);

  // Download Attendance Data Handler
  const handleDownloadAttendanceData = async () => {
    try {
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
      const filename = `Attendance_${downloadMode}_${downloadMode === 'department' ? downloadDept.replace(/\s+/g, '_') : downloadMode === 'batch' ? downloadBatch : downloadMode === 'year' ? downloadYear.replace(/\s+/g, '_') : 'Sem' + downloadSemester}_${dateStamp}`;

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

  // Fetch classes from backend API
  const fetchClasses = async () => {
    if (!staffUser?.staffId) return;
    try {
      setLoadingClasses(true);
      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.classes)) {
        setClasses(data.classes);
        if (data.classes.length > 0 && !selectedClassCode) {
          setSelectedClassCode(data.classes[0].code);
        }
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

  // Fetch all registered students
  const fetchRegisteredStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/students`);
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
    fetchRegisteredStudents();
    fetchDepartments();
  }, [staffUser?.staffId]);

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

  // Filter classes according to selected department
  const filteredClasses = useMemo(() => {
    if (!selectedDepartment || selectedDepartment === 'All') return classes;
    const deptNorm = selectedDepartment.toLowerCase().trim();
    return classes.filter(c => {
      const d = (c.dept || '').toLowerCase().trim();
      return Boolean(d && (d === deptNorm || d.includes(deptNorm) || deptNorm.includes(d)));
    });
  }, [classes, selectedDepartment]);

  // Current active class object
  const currentClass = useMemo(() => {
    if (filteredClasses.length === 0) return null;
    return filteredClasses.find(c => c.code === selectedClassCode) || filteredClasses[0] || null;
  }, [filteredClasses, selectedClassCode]);

  const handleDepartmentChange = (newDept) => {
    setSelectedDepartment(newDept);
    setSearchQuery('');
    if (!newDept || newDept === 'All') {
      if (classes.length > 0) setSelectedClassCode(classes[0].code);
    } else {
      const deptNorm = newDept.toLowerCase().trim();
      const matched = classes.filter(c => {
        const d = (c.dept || '').toLowerCase().trim();
        return Boolean(d && (d === deptNorm || d.includes(deptNorm) || deptNorm.includes(d)));
      });
      if (matched.length > 0) {
        setSelectedClassCode(matched[0].code);
      } else {
        setSelectedClassCode('');
      }
    }
  };

  // Effective students list: if a department is selected, only return students from that department
  const effectiveStudents = useMemo(() => {
    if (selectedDepartment && selectedDepartment !== 'All') {
      const deptNormalized = selectedDepartment.toLowerCase().trim();
      // Match all registered students strictly under the selected department
      const matchedReg = allRegisteredStudents.filter(s => {
        const d = (s.department || '').toLowerCase().trim();
        const c = (s.course || '').toLowerCase().trim();
        const matchesDept = Boolean(d && (d === deptNormalized || d.includes(deptNormalized) || deptNormalized.includes(d)));
        const matchesCourse = Boolean(c && (c === deptNormalized || c.includes(deptNormalized) || deptNormalized.includes(c)));
        return matchesDept || matchesCourse;
      }).map(s => ({
        rollNo: (s.rollNo || s.regNo || s.studentId || '').toUpperCase(),
        name: s.name,
        department: s.department || selectedDepartment,
        phone: s.phone || '',
        email: s.email || ''
      }));

      // Match any extra students enrolled in classes under this department
      const extraFromClasses = [];
      filteredClasses.forEach(cls => {
        (cls.students || cls.enrolledStudents || []).forEach(st => {
          const r = (st.rollNo || '').toUpperCase();
          if (r && !matchedReg.some(x => x.rollNo === r) && !extraFromClasses.some(x => x.rollNo === r)) {
            extraFromClasses.push({
              rollNo: r,
              name: st.name,
              department: cls.dept || selectedDepartment,
              phone: st.phone || '',
              email: st.email || ''
            });
          }
        });
      });

      // Return only matched students — empty if none registered under this dept
      return [...matchedReg, ...extraFromClasses];
    }

    // If 'All' is selected, fall back to current class students if any, or all registered students
    const cStudents = currentClass?.students || currentClass?.enrolledStudents || [];
    if (cStudents.length > 0) {
      return cStudents.map(s => ({
        rollNo: (s.rollNo || '').toUpperCase(),
        name: s.name,
        department: currentClass?.dept || s.department || 'General',
        phone: s.phone || '',
        email: s.email || ''
      }));
    }

    return allRegisteredStudents.map(s => ({
      rollNo: (s.rollNo || s.regNo || s.studentId || '').toUpperCase(),
      name: s.name,
      department: s.department || 'General',
      phone: s.phone || '',
      email: s.email || ''
    }));
  }, [selectedDepartment, allRegisteredStudents, filteredClasses, currentClass]);

  // Check if an existing session is in historyList
  const existingSession = useMemo(() => {
    const activeCode = currentClass?.code || selectedClassCode || (selectedDepartment !== 'All' ? selectedDepartment : '');
    if (!activeCode || !selectedDate || !sessionSlot) return null;
    const cleanSlot = (sessionSlot || '').trim().toLowerCase();
    return historyList.find(s =>
      (s.classCode === activeCode || s.classCode === selectedClassCode) &&
      s.date === selectedDate &&
      ((s.slot || '').trim().toLowerCase() === cleanSlot || cleanSlot.includes((s.slot || '').trim().toLowerCase()))
    ) || null;
  }, [historyList, currentClass, selectedClassCode, selectedDepartment, selectedDate, sessionSlot]);

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
  }, [selectedClassCode, currentClass, selectedDepartment, selectedDate, sessionSlot, effectiveStudents, historyList]);

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
  const presentCount = useMemo(() => {
    return effectiveStudents.filter(s => attendanceState[s.rollNo] === 'Present').length;
  }, [effectiveStudents, attendanceState]);

  const absentCount = useMemo(() => {
    return effectiveStudents.filter(s => attendanceState[s.rollNo] === 'Absent').length;
  }, [effectiveStudents, attendanceState]);

  const lateCount = useMemo(() => {
    return effectiveStudents.filter(s => attendanceState[s.rollNo] === 'Late').length;
  }, [effectiveStudents, attendanceState]);

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
    setActiveTab('mark');
  };

  // Submit or update session attendance
  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSavedSuccessMsg('');

    if (effectiveStudents.length === 0) {
      setSubmitError('No students found for this department. Please add or import students.');
      return;
    }

    const activeCode = currentClass?.code || selectedClassCode || (selectedDepartment !== 'All' ? `${selectedDepartment.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}101` : 'ATT101');
    const activeName = currentClass?.name || (selectedDepartment !== 'All' ? `${selectedDepartment} Attendance` : 'General Attendance');

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
      setSavedSuccessMsg(`Attendance for ${activeCode} on ${selectedDate} (${sessionSlot}) recorded successfully! (Present: ${saved?.presentCount ?? presentCount}, Absent: ${saved?.absentCount ?? absentCount})`);
      
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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

          {/* Download Filtered Attendance Button */}
          <button
            type="button"
            onClick={() => setShowDownloadModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all cursor-pointer shadow-2xs"
            title="Download department, year, batch, or semester-wise attendance"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Download Data</span>
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
          {/* Controls Bar - Always rendered so the user can freely switch departments */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Department Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="All">All Departments</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Subject</label>
                <select
                  value={selectedClassCode}
                  onChange={(e) => setSelectedClassCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  {filteredClasses.length > 0 ? (
                    filteredClasses.map(cls => (
                      <option key={cls.code} value={cls.code}>
                        {cls.code} – {cls.name} (Year {cls.year}, Sem {cls.semester})
                      </option>
                    ))
                  ) : (
                    <option value="">
                      {selectedDepartment !== 'All' ? `No subjects in ${selectedDepartment}` : (currentClass?.code || "GENERAL")}
                    </option>
                  )}
                </select>
              </div>

              {/* Date Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Session Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Time Slot Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Session Slot</label>
                <select
                  value={sessionSlot}
                  onChange={(e) => setSessionSlot(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="8:30 AM">Period 1 (8:30 AM – 9:20 AM)</option>
                  <option value="9:20 AM">Period 2 (9:20 AM – 10:10 AM)</option>
                  <option value="10:10 AM">Period 3 (10:10 AM – 11:00 AM)</option>
                  <option value="11:15 AM">Period 4 (11:15 AM – 12:05 PM)</option>
                  <option value="12:05 PM">Period 5 (12:05 PM – 12:55 PM)</option>
                  <option value="1:45 PM">Period 6 (1:45 PM – 2:35 PM)</option>
                  <option value="2:35 PM">Period 7 (2:35 PM – 3:25 PM)</option>
                  <option value="3:25 PM">Period 8 (3:25 PM – 4:15 PM)</option>
                </select>
              </div>
            </div>
          </div>

          {loadingClasses ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-400 font-bold">Loading your classes and students...</p>
            </div>
          ) : (classes.length === 0 && effectiveStudents.length === 0 && (!selectedDepartment || selectedDepartment === 'All')) ? (
            /* Empty classes banner — no classes AND no dept selected */
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
          ) : (effectiveStudents.length === 0 && selectedDepartment && selectedDepartment !== 'All') ? (
            /* Department selected but no students registered under it */
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">No Students Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  No students are registered under <strong>{selectedDepartment}</strong>. Please select another department or add students to this department.
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
                          <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Department</th>
                          <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                          <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {displayedStudents.map((student, idx) => {
                          const status = attendanceState[student.rollNo] || 'Present';
                          return (
                            <tr key={student.rollNo} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-5 py-3 text-slate-400 font-medium">{idx + 1}</td>
                              <td className="px-5 py-3 font-bold text-slate-700">{student.rollNo}</td>
                              <td className="px-5 py-3 font-semibold text-slate-900">{student.name}</td>
                              <td className="px-5 py-3 text-slate-600 hidden md:table-cell font-medium">{student.department || selectedDepartment || '—'}</td>
                              <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">{student.phone || '—'}</td>
                              <td className="px-5 py-3 text-center">
                                <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                                  <button
                                    type="button"
                                    onClick={() => toggleStudentStatus(student.rollNo, 'Present')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${status === 'Present'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                  >
                                    Present
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleStudentStatus(student.rollNo, 'Absent')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${status === 'Absent'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                  >
                                    Absent
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleStudentStatus(student.rollNo, 'Late')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${status === 'Late'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                  >
                                    Late
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
                      {presentCount + lateCount} of {totalCount} students marked present or late
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
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">Past Submitted Attendance Sessions</h3>
            <button
              onClick={fetchHistory}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Refresh Logs
            </button>
          </div>

          {loadingHistory ? (
            <div className="p-10 text-center">
              <p className="text-xs text-slate-400 font-bold">Loading attendance history...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-xs font-bold text-slate-700">No attendance sessions recorded yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Once you mark and submit attendance for a class, your logs will appear here directly.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Slot / Time</th>
                    <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                    <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Total</th>
                    <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Present</th>
                    <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Absent</th>
                    <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Attendance %</th>
                    <th className="text-right px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {historyList.map(record => {
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
                          <span className="font-extrabold text-blue-600 mr-1.5">[{record.classCode}]</span>
                          {record.className}
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
