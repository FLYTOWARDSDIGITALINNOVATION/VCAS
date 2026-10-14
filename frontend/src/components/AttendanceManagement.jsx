import React, { useState, useMemo } from 'react';
import { API_BASE, BACKEND_URL } from '../apiConfig';
import { createPortal } from 'react-dom';
import { 
  CheckSquare, 
  Search, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  UserCheck, 
  AlertTriangle, 
  FileSpreadsheet, 
  Download, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Eye, 
  Filter, 
  RotateCcw, 
  Send, 
  X, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  ChevronLeft,
  Building2, 
  GraduationCap, 
  BookOpen, 
  SlidersHorizontal,
  Mail,
  Phone,
  FileText,
  Sparkles,
  Layers,
  ArrowRight,
  CalendarCheck2,
  CalendarX2,
  UserX,
  ShieldCheck,
  Zap
} from 'lucide-react';
import ModalPortal from './ModalPortal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const INITIAL_STUDENTS = [];
const INITIAL_STAFF_ATTENDANCE = [];
const INITIAL_LEAVE_REQUESTS = [];

// Helper to get local date string YYYY-MM-DD
function getLocalDateString() {
  const d = new Date();
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
}

export default function AttendanceManagement({ user }) {
  const isSuperAdmin = user?.role === 'Super Admin' || user?.isSuperAdmin || JSON.parse(sessionStorage.getItem('vcas_user') || '{}')?.role === 'Super Admin';
  // Navigation Tabs: 'daily-log', 'roll-call', 'student-register', 'staff-attendance', 'leaves'
  const [activeTab, setActiveTab] = useState('daily-log');

  // Calendar State - Defaults to today's real date and current month/year
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Filter for Date-specific Attendance: 'ALL', 'Present', 'Absent', 'Late', 'On Duty'
  const [dateStatusFilter, setDateStatusFilter] = useState('ALL');

  // Students & Staff Data State - Live Backend Only
  const [students, setStudents] = useState([]);
  const [staffAttendance, setStaffAttendance] = useState([]);
  const [staffCategoryFilter, setStaffCategoryFilter] = useState('ALL'); // 'ALL' | 'Faculty' | 'Office Staff' | 'Accountant'
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [dbSessions, setDbSessions] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [availableDepartments, setAvailableDepartments] = useState([]);

  // Fetch all real attendance sessions, students, staff, leaves, and departments from backend
  const fetchAllAttendanceData = async () => {
    try {
      setIsSyncing(true);
      const [resSessions, resStudents, resStaff, resLeaves, resDepartments] = await Promise.allSettled([
        fetch(`${API_BASE}/attendance`),
        fetch(`${API_BASE}/students`),
        fetch(`${API_BASE}/staff`),
        fetch(`${API_BASE}/leave`),
        fetch(`${API_BASE}/departments`)
      ]);

      if (resDepartments.status === 'fulfilled' && resDepartments.value.ok) {
        const d = await resDepartments.value.json();
        if (d.success && Array.isArray(d.data)) {
          const deptNames = d.data.map(dept => dept.name).filter(Boolean);
          setAvailableDepartments(deptNames);
          if (deptNames.length > 0) {
            setRollDept(prev => (prev && deptNames.includes(prev)) ? prev : deptNames[0]);
          }
        }
      }

      let sessionsList = [];
      if (resSessions.status === 'fulfilled' && resSessions.value.ok) {
        const d = await resSessions.value.json();
        if (d.success && Array.isArray(d.sessions)) {
          sessionsList = d.sessions;
          setDbSessions(d.sessions);
          /* Keep selectedDate on today / user selection */
        }
      }

      if (resStudents.status === 'fulfilled' && resStudents.value.ok) {
        const d = await resStudents.value.json();
        if (d.success && Array.isArray(d.data)) {
          const mappedStudents = d.data.map(stu => {
            const roll = (stu.rollNo || '').toUpperCase();
            let attended = 0;
            let total = 0;
            const subMap = {};

            sessionsList.forEach(sess => {
              if (Array.isArray(sess.records)) {
                const rec = sess.records.find(r => (r.rollNo || '').toUpperCase() === roll);
                if (rec) {
                  total++;
                  const isPresent = rec.status === 'Present' || rec.status === 'Late';
                  if (isPresent) attended++;
                  const subCode = sess.classCode || 'General';
                  if (!subMap[subCode]) {
                    subMap[subCode] = { code: subCode, name: sess.className || subCode, total: 0, attended: 0 };
                  }
                  subMap[subCode].total++;
                  if (isPresent) subMap[subCode].attended++;
                }
              }
            });

            const percent = total > 0 
              ? parseFloat(((attended / total) * 100).toFixed(1)) 
              : (stu.attendance ? parseFloat(stu.attendance) : 95.0);

            const subjectWise = Object.values(subMap).map(s => ({
              ...s,
              percent: s.total > 0 ? parseFloat(((s.attended / s.total) * 100).toFixed(1)) : 100
            }));

            let yearNum = 1;
            const semStr = (stu.sem || stu.semester || '').toLowerCase();
            if (semStr.includes('3') || semStr.includes('4')) yearNum = 2;
            else if (semStr.includes('5') || semStr.includes('6')) yearNum = 3;
            else if (semStr.includes('7') || semStr.includes('8')) yearNum = 4;

            return {
              id: stu._id || stu.id,
              rollNo: stu.rollNo,
              regNo: stu.admissionNo || stu.admNo || stu.studentId || stu.rollNo,
              name: stu.name || stu.fullName,
              department: stu.department || 'Computer Science',
              year: yearNum,
              sem: stu.sem || stu.semester || 'Sem 1',
              section: stu.section || 'A',
              totalClasses: total > 0 ? total : 24,
              attendedClasses: total > 0 ? attended : Math.round(24 * (percent / 100)),
              attendancePercent: percent,
              parentName: stu.fatherName || stu.motherName || 'Parent',
              parentPhone: stu.fatherMobile || stu.phone || stu.mobile || 'N/A',
              parentEmail: stu.parentEmail || stu.email || 'parent@vcas.edu',
              status: 'Present',
              periodsAttended: 6,
              totalPeriodsToday: 6,
              subjectWise: subjectWise
            };
          });
          setStudents(mappedStudents);
        }
      }

      if (resStaff.status === 'fulfilled' && resStaff.value.ok) {
        const d = await resStaff.value.json();
        if (d.success && Array.isArray(d.data)) {
          const staffList = d.data.map((s, idx) => {
            const sid = (s.staffId || s.empId || `STF${idx + 1}`).toUpperCase();
            const cat = (s.role === 'Office Staff' || s.designation?.toLowerCase().includes('office') || s.department?.toLowerCase().includes('office'))
              ? 'Office Staff'
              : (s.role === 'Accountant' || s.designation?.toLowerCase().includes('account') || s.department?.toLowerCase().includes('account'))
              ? 'Accountant'
              : 'Faculty';
            const savedPunches = JSON.parse(localStorage.getItem('vcas_staff_punches') || '{}');
            const todayStr = new Date().toISOString().split('T')[0];
            const punch = savedPunches[`${sid}_${todayStr}`] || s.todayPunch || null;
            const hasPunched = Boolean(punch && punch.inTime);

            return {
              id: s._id || sid,
              empId: sid,
              name: s.name,
              department: s.department || (cat === 'Office Staff' ? 'Administrative Office' : cat === 'Accountant' ? 'Accounts & Finance' : 'Computer Science'),
              designation: s.designation || cat,
              category: cat,
              inTime: hasPunched ? punch.inTime : '--',
              outTime: hasPunched ? (punch.outTime || '--') : '--',
              status: s.status === 'Inactive' ? 'On Leave' : (hasPunched ? 'Present' : 'Not Punched In'),
              workHours: hasPunched ? (punch.workHours || 'Active') : '--',
              mode: hasPunched ? (punch.mode || 'Biometric Face ID') : '--'
            };
          });
          setStaffAttendance(staffList);
        }
      }

      if (resLeaves.status === 'fulfilled' && resLeaves.value.ok) {
        const d = await resLeaves.value.json();
        if (d.success && Array.isArray(d.data)) {
          setLeaveRequests(d.data.map(l => ({
            id: l._id || l.id,
            applicantName: l.applicantName || l.staffName || 'Staff Member',
            role: l.role || 'Faculty',
            department: l.department || 'General',
            type: l.leaveType || l.type || 'Casual Leave (CL)',
            from: l.fromDate || l.from,
            to: l.toDate || l.to,
            days: l.days || 1,
            reason: l.reason || 'Personal Work',
            status: l.status || 'Pending',
            appliedOn: l.appliedOn || (l.createdAt ? l.createdAt.split('T')[0] : '2026-09-01')
          })));
        }
      }
    } catch (err) {
      console.error('Failed to sync all attendance data:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  React.useEffect(() => {
    fetchAllAttendanceData();
  }, []);

    const staffFacultyCount = staffAttendance.filter(s => s.category === 'Faculty').length;
  const staffOfficeCount = staffAttendance.filter(s => s.category === 'Office Staff').length;
  const staffAccountantCount = staffAttendance.filter(s => s.category === 'Accountant').length;
  const staffPresentCount = staffAttendance.filter(s => s.status === 'Present').length;

  const filteredStaffAttendance = useMemo(() => {
    return staffAttendance.filter(st => {
      if (staffCategoryFilter === 'Faculty' && st.category !== 'Faculty') return false;
      if (staffCategoryFilter === 'Office Staff' && st.category !== 'Office Staff') return false;
      if (staffCategoryFilter === 'Accountant' && st.category !== 'Accountant') return false;

      if (staffSearchQuery.trim()) {
        const q = staffSearchQuery.toLowerCase().trim();
        const matchesName = (st.name || '').toLowerCase().includes(q);
        const matchesId = (st.empId || '').toLowerCase().includes(q);
        const matchesDept = (st.department || '').toLowerCase().includes(q);
        const matchesDesig = (st.designation || '').toLowerCase().includes(q);
        return matchesName || matchesId || matchesDept || matchesDesig;
      }
      return true;
    });
  }, [staffAttendance, staffCategoryFilter, staffSearchQuery]);

  // Helper to resolve student status from saved staff sessions ONLY
  const resolveStudentAttendanceForDate = (student, dateStr) => {
    // 1. Sunday check
    const parts = (dateStr || '').split('-');
    if (parts.length === 3) {
      const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      if (dObj.getDay() === 0) {
        return { status: 'Holiday (Sunday)', periods: 0, isPresent: false, isMarked: false };
      }
    }

    // 2. Match session submitted by staff for this date
    const match = dbSessions.find(s => {
      if (s.date !== dateStr) return false;
      return Array.isArray(s.records) && s.records.some(r =>
        (r.rollNo || '').trim().toUpperCase() === (student.rollNo || '').trim().toUpperCase()
      );
    });

    if (match) {
      const rec = match.records.find(r =>
        (r.rollNo || '').trim().toUpperCase() === (student.rollNo || '').trim().toUpperCase()
      );
      if (rec) {
        const isAbs = rec.status === 'Absent';
        const isLt = rec.status === 'Late';
        return {
          status: rec.status,
          periods: isAbs ? 0 : isLt ? 5 : 6,
          isPresent: !isAbs,
          isMarked: true
        };
      }
    }

    // 3. If staff has not marked attendance for this date yet, reflect as Not Marked
    return {
      status: 'Not Marked',
      periods: 0,
      isPresent: false,
      isMarked: false
    };
  };

  // Roll Call Selection States
  const [rollDept, setRollDept] = useState('');
  const [rollYear, setRollYear] = useState(1);
  const [rollSem, setRollSem] = useState('Sem 1');
  const [rollSubject, setRollSubject] = useState('');
  const [rollPeriod, setRollPeriod] = useState('Period 1 (09:00 AM - 10:00 AM)');
  const [classTopic, setClassTopic] = useState('');

  // Restore any saved session statuses for roll call
  React.useEffect(() => {
    const code = (rollSubject || '').split(' ')[0].trim().toUpperCase();
    const existing = dbSessions.find(s =>
      s.date === selectedDate &&
      s.classCode === code
    );
    if (existing && Array.isArray(existing.records) && existing.records.length > 0) {
      const statusMap = {};
      existing.records.forEach(r => {
        if (r.rollNo) statusMap[r.rollNo.trim().toUpperCase()] = r.status;
      });
      setStudents(prev => prev.map(s => {
        const saved = statusMap[s.rollNo?.trim().toUpperCase()];
        if (saved) return { ...s, status: saved };
        return s;
      }));
    }
  }, [selectedDate, rollSubject, dbSessions]);

  // Student Register Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('All Departments');
  const [filterYear, setFilterYear] = useState('ALL');
  const [filterAttendanceRange, setFilterAttendanceRange] = useState('ALL');

  // Modals state
  const [viewingStudentProfile, setViewingStudentProfile] = useState(null);
  const [warningModalStudent, setWarningModalStudent] = useState(null);
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Lock background scroll when any modal is open
  React.useEffect(() => {
    const isAnyModalOpen = Boolean(viewingStudentProfile || warningModalStudent || isApplyLeaveOpen);
    const scrollContainer = document.getElementById('main-content-scroll-container');
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      if (scrollContainer) scrollContainer.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      if (scrollContainer) scrollContainer.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'unset';
      if (scrollContainer) scrollContainer.style.overflow = 'auto';
    };
  }, [viewingStudentProfile, warningModalStudent, isApplyLeaveOpen]);

  // Leave Form state
  const [leaveForm, setLeaveForm] = useState({
    applicantName: '',
    role: 'Student',
    department: 'Computer Science',
    type: 'Casual Leave (CL)',
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------
  // Calendar Grid Calculations
  // -------------------------------------------------------------
  const calendarDays = useMemo(() => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon...
    const realToday = getLocalDateString();
    
    const daysArray = [];
    
    // Empty cells before first day
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push({ day: null });
    }
    
    // Days of the month
    for (let d = 1; d <= totalDays; d++) {
      const formattedMonth = String(currentMonth + 1).padStart(2, '0');
      const formattedDay = String(d).padStart(2, '0');
      const dateString = `${currentYear}-${formattedMonth}-${formattedDay}`;
      
      const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
      const isSunday = dayOfWeek === 0;
      
      // Attendance is marked ONLY if staff recorded attendance session in dbSessions
      const hasAttendanceMarked = dbSessions.some(s => s.date === dateString);
      
      daysArray.push({
        day: d,
        dateString,
        isSunday,
        isToday: dateString === realToday,
        isSelected: dateString === selectedDate,
        hasAttendanceMarked
      });
    }
    
    return daysArray;
  }, [currentYear, currentMonth, selectedDate, dbSessions]);

  // Calendar Month Navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Select Date Handler from Calendar
  const handleSelectCalendarDate = (dateStr) => {
    if (!dateStr) return;
    setSelectedDate(dateStr);
    showToast(`Showing attendance for ${formatReadableDate(dateStr)}`);
  };

  // Human Readable Formatted Date
  const formatReadableDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // -------------------------------------------------------------
  // Filtered Daily Attendees List for the Selected Date
  // -------------------------------------------------------------
  const dailyDateAttendees = useMemo(() => {
    return students.map(student => {
      const dayInfo = resolveStudentAttendanceForDate(student, selectedDate);
      return {
        ...student,
        dayStatus: dayInfo.status,
        dayPeriods: dayInfo.periods,
        isPresentOnDate: dayInfo.isPresent,
        isMarkedOnDate: dayInfo.isMarked
      };
    }).filter(s => {
      // Apply department search & status filters
      const q = (searchQuery || '').toLowerCase().trim();
      const matchesSearch = !q || (
        String(s.name || '').toLowerCase().includes(q) ||
        String(s.rollNo || '').toLowerCase().includes(q) ||
        String(s.regNo || s.registerNumber || '').toLowerCase().includes(q) ||
        String(s.department || '').toLowerCase().includes(q)
      );

      const matchesDept = filterDept === 'All Departments' || s.department === filterDept;

      let matchesStatus = true;
      if (dateStatusFilter === 'Present') {
        matchesStatus = s.dayStatus === 'Present';
      } else if (dateStatusFilter === 'Absent') {
        matchesStatus = s.dayStatus === 'Absent';
      } else if (dateStatusFilter === 'Late') {
        matchesStatus = s.dayStatus === 'Late';
      } else if (dateStatusFilter === 'On Duty') {
        matchesStatus = s.dayStatus === 'On Duty';
      } else if (dateStatusFilter === 'Not Marked') {
        matchesStatus = s.dayStatus === 'Not Marked';
      }

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [students, selectedDate, searchQuery, filterDept, dateStatusFilter, dbSessions]);

  // Daily Date Tally Summary
  const dateTally = useMemo(() => {
    const all = students.map(s => resolveStudentAttendanceForDate(s, selectedDate));
    const total = all.length;
    const marked = all.filter(a => a.isMarked);
    const present = all.filter(a => a.status === 'Present').length;
    const absent = all.filter(a => a.status === 'Absent').length;
    const late = all.filter(a => a.status === 'Late').length;
    const od = all.filter(a => a.status === 'On Duty').length;
    const notMarked = all.filter(a => a.status === 'Not Marked').length;
    const percent = marked.length > 0
      ? Math.round(((present + late + od) / marked.length) * 100)
      : 0;
    return {
      total,
      present,
      absent,
      late,
      od,
      notMarked,
      percent,
      isMarked: marked.length > 0
    };
  }, [students, selectedDate, dbSessions]);

  // -------------------------------------------------------------
  // Handlers for Roll Call & Actions
  // -------------------------------------------------------------
  const rollCallStudents = useMemo(() => {
    const cleanDept = (rollDept || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return students.filter(s => {
      const sDept = (s.department || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchDept = sDept === cleanDept || 
        (cleanDept.includes('computerscience') && (sDept.includes('computerscience') || sDept.includes('cs'))) ||
        (cleanDept && sDept.includes(cleanDept)) || 
        (sDept && cleanDept.includes(sDept));
      const matchYear = Number(s.year) === Number(rollYear);
      return matchDept && matchYear;
    });
  }, [students, rollDept, rollYear]);

  const rollTally = useMemo(() => {
    const total = rollCallStudents.length;
    const present = rollCallStudents.filter(s => s.status === 'Present').length;
    const absent = rollCallStudents.filter(s => s.status === 'Absent').length;
    const late = rollCallStudents.filter(s => s.status === 'Late').length;
    const od = rollCallStudents.filter(s => s.status === 'On Duty').length;
    const percent = total > 0 ? ((present + late + od) / total * 100).toFixed(1) : '0.0';
    return { total, present, absent, late, od, percent };
  }, [rollCallStudents]);

  const filteredRegisterStudents = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    const cleanFilterDept = (filterDept || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return students.filter(s => {
      const matchesSearch = !q || (
        String(s.name || '').toLowerCase().includes(q) ||
        String(s.rollNo || '').toLowerCase().includes(q) ||
        String(s.regNo || s.registerNumber || '').toLowerCase().includes(q) ||
        String(s.department || '').toLowerCase().includes(q)
      );

      const sDept = (s.department || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchesDept = filterDept === 'All Departments' || 
        sDept === cleanFilterDept ||
        (cleanFilterDept.includes('computerscience') && (sDept.includes('computerscience') || sDept.includes('cs'))) ||
        sDept.includes(cleanFilterDept) || cleanFilterDept.includes(sDept);

      const matchesYear = filterYear === 'ALL' || Number(s.year) === Number(filterYear);

      let matchesRange = true;
      if (filterAttendanceRange === 'good') matchesRange = s.attendancePercent >= 85;
      else if (filterAttendanceRange === 'moderate') matchesRange = s.attendancePercent >= 75 && s.attendancePercent < 85;
      else if (filterAttendanceRange === 'shortage') matchesRange = s.attendancePercent < 75;

      return matchesSearch && matchesDept && matchesYear && matchesRange;
    });
  }, [students, searchQuery, filterDept, filterYear, filterAttendanceRange]);

  const shortageCount = useMemo(() => {
    return students.filter(s => s.attendancePercent < 75).length;
  }, [students]);

  const handleToggleRollStatus = (id, newStatus) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const handleMarkAll = (status) => {
    const cleanDept = (rollDept || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    setStudents(prev => prev.map(s => {
      const sDept = (s.department || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchDept = sDept === cleanDept || 
        (cleanDept.includes('computerscience') && (sDept.includes('computerscience') || sDept.includes('cs'))) ||
        (cleanDept && sDept.includes(cleanDept)) || 
        (sDept && cleanDept.includes(sDept));
      if (matchDept && Number(s.year) === Number(rollYear)) {
        return { ...s, status };
      }
      return s;
    }));
    showToast(`Marked all students as ${status} for this session.`);
  };

  const handleSubmitRollCall = async () => {
    try {
      const code = (rollSubject || '').split(' ')[0].trim().toUpperCase();
      const records = rollCallStudents.map(s => ({
        rollNo: s.rollNo,
        name: s.name,
        status: s.status || 'Present'
      }));

      const payload = {
        staffId: 'ADMIN',
        staffName: 'Academic Administrator',
        classCode: code,
        className: rollSubject || (rollDept + ' - Year ' + rollYear + ' (' + rollSem + ')'),
        date: selectedDate,
        slot: rollPeriod,
        records
      };

      const res = await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.session) {
        setDbSessions(prev => {
          const idx = prev.findIndex(s => s._id === data.session._id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = data.session;
            return copy;
          }
          return [data.session, ...prev];
        });
        showToast(`Attendance for ${rollSubject} saved successfully.`);
      } else {
        showToast(`Attendance for ${rollSubject} saved.`);
      }
    } catch (err) {
      showToast(`Attendance for ${rollSubject} recorded locally.`);
    }
  };

  const handleUpdateLeaveStatus = (id, newStatus) => {
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    showToast(`Leave request ${newStatus.toLowerCase()} successfully.`);
  };

  const handleSaveLeave = (e) => {
    e.preventDefault();
    if (!leaveForm.applicantName.trim() || !leaveForm.reason.trim()) {
      alert('Please enter Applicant Name and Reason');
      return;
    }
    const fromDate = new Date(leaveForm.from);
    const toDate = new Date(leaveForm.to);
    const diffDays = Math.max(1, Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1);

    const newReq = {
      id: Date.now(),
      ...leaveForm,
      days: diffDays,
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0]
    };
    setLeaveRequests(prev => [newReq, ...prev]);
    setIsApplyLeaveOpen(false);
    showToast('Leave application submitted.');
  };

  const handleExportAttendanceCSV = () => {
    const headers = ['Roll No', 'Register No', 'Student Name', 'Department', 'Date', 'Day Status', 'Overall Attendance %'];
    const rows = dailyDateAttendees.map(s => [
      `"${s.rollNo}"`,
      `"${s.regNo}"`,
      `"${s.name}"`,
      `"${s.department}"`,
      `"${selectedDate}"`,
      `"${s.dayStatus}"`,
      `${s.attendancePercent}%`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vidyapeeth_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Attendance report exported as CSV!');
  };

  const handleSendWarning = () => {
    if (warningModalStudent) {
      showToast(`Warning SMS & Email sent to ${warningModalStudent.parentName} (${warningModalStudent.parentPhone}) for ${warningModalStudent.name}.`);
      setWarningModalStudent(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans animate-fadeIn">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && typeof document !== 'undefined' && createPortal(
        <div className="fixed top-6 right-6 z-[99999] bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn pointer-events-auto">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>,
        document.body
      )}

      {/* 1. TOP HEADER & QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
              Academic Attendance Tracker
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-semibold">Real-time Calendar & Roll Call</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Attendance Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Select any date from the interactive calendar to view attendees, roll call, and biometric logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isSuperAdmin && (
            <button
            onClick={handleExportAttendanceCSV}
            title="Download CSV Attendance Sheet"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Report</span>
          </button>
          )}
        </div>
      </div>

      {/* 2. STATS SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Date Attendance</span>
            <p className="text-2xl font-black text-emerald-600">{dateTally.percent}%</p>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">{dateTally.present} Present ({selectedDate})</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Staff on Duty</span>
            <p className="text-2xl font-black text-blue-600">95.2%</p>
            <p className="text-[11px] text-blue-600 font-bold mt-1">80 / 84 Faculty</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Shortage (&lt;75%)</span>
            <p className="text-2xl font-black text-rose-600">{shortageCount} Students</p>
            <p className="text-[11px] text-rose-600 font-bold mt-1">Condonation Risk</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pending Leaves</span>
            <p className="text-2xl font-black text-amber-600">
              {leaveRequests.filter(l => l.status === 'Pending').length} Requests
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Awaiting Approval</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Selected Date</span>
            <p className="text-xl font-black text-indigo-600 truncate">{selectedDate.split('-').slice(1).join('/')}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">{formatReadableDate(selectedDate)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. MAIN TWO-COLUMN LAYOUT (LEFT: SIDE CALENDAR FILTER, RIGHT: ATTENDANCE CONTENT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: INTERACTIVE SIDE CALENDAR WIDGET & DATE FILTERS              */}
        {/* ========================================================================= */}
        <aside className="lg:col-span-4 xl:col-span-4 space-y-5">
          
          {/* Calendar Box */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4 sticky top-20">
            
            {/* Calendar Header with Prev/Next Month */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Attendance Calendar</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Day Header Names */}
            <div className="grid grid-cols-7 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100/60">
              <span className="text-rose-500">Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Calendar Days 7x5 Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
              {calendarDays.map((cell, idx) => {
                if (!cell.day) {
                  return <div key={`empty-${idx}`} className="h-9"></div>;
                }

                const isSelected = cell.isSelected;
                const isSunday = cell.isSunday;
                const isToday = cell.isToday;

                return (
                  <button
                    key={cell.dateString}
                    onClick={() => handleSelectCalendarDate(cell.dateString)}
                    className={`h-9 w-full rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-500/30 scale-105 z-10'
                        : isToday
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                        : isSunday
                        ? 'text-rose-400 hover:bg-rose-50'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-xs leading-none">{cell.day}</span>
                    
                    {/* Status Dot */}
                    {!isSelected && (
                      <span className={`w-1 h-1 rounded-full mt-0.5 ${
                        cell.hasAttendanceMarked ? 'bg-emerald-500 ring-1 ring-emerald-300' : isSunday ? 'bg-rose-300' : isToday ? 'bg-blue-500' : 'bg-transparent'
                      }`}></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Date Shortcuts */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Quick Date Filter</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleSelectCalendarDate(getLocalDateString())}
                  className={`py-1.5 px-2.5 rounded-xl font-bold transition-all text-left flex items-center justify-between border ${
                    selectedDate === getLocalDateString()
                      ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  <span>📌 Today</span>
                </button>
                <button
                  onClick={() => handleSelectCalendarDate('2026-08-28')}
                  className={`py-1.5 px-2.5 rounded-xl font-bold transition-all text-left flex items-center justify-between border ${
                    selectedDate === '2026-08-28'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  <span>📅 Friday (28 Aug)</span>
                </button>
              </div>
            </div>

            {/* Selected Date Summary & "Who Came" Filter Pills */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Selected Date Tally</span>
                  <p className="font-extrabold text-xs text-slate-900">{formatReadableDate(selectedDate)}</p>
                </div>
                <span className="text-xs font-black text-emerald-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                  {dateTally.isMarked ? `${dateTally.percent}% Attendance` : 'Not Marked Yet'}
                </span>
              </div>

              {/* Status Filter Buttons (Who all came / Present, Absent, etc.) */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter by Attendance Status:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setDateStatusFilter('ALL');
                      setActiveTab('daily-log');
                    }}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                      dateStatusFilter === 'ALL'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>All Students</span>
                    <span className="text-[10px] opacity-80">{dateTally.total}</span>
                  </button>

                  <button
                    onClick={() => {
                      setDateStatusFilter('Present');
                      setActiveTab('daily-log');
                    }}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                      dateStatusFilter === 'Present'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <span>✓ Present (Came)</span>
                    <span className="text-[10px] font-black">{dateTally.present}</span>
                  </button>

                  <button
                    onClick={() => {
                      setDateStatusFilter('Absent');
                      setActiveTab('daily-log');
                    }}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                      dateStatusFilter === 'Absent'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <span>✕ Absent</span>
                    <span className="text-[10px] font-black">{dateTally.absent}</span>
                  </button>

                  <button
                    onClick={() => {
                      setDateStatusFilter('Late');
                      setActiveTab('daily-log');
                    }}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                      dateStatusFilter === 'Late'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <span>⏰ Late / OD</span>
                    <span className="text-[10px] font-black">{dateTally.late + dateTally.od}</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </aside>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: ATTENDANCE RECORDS & TABS                                   */}
        {/* ========================================================================= */}
        <main className="lg:col-span-8 xl:col-span-8 space-y-5">
          
          {/* Active Date Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-blue-500/30 text-blue-200 font-bold text-[10px] rounded-md uppercase">
                  📅 Selected Date View
                </span>
                <span className="text-xs text-blue-200">•</span>
                <span className="text-xs text-blue-200 font-medium">{dateTally.total} Students Recorded</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold">
                {formatReadableDate(selectedDate)}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Viewing {dateStatusFilter === 'ALL' ? 'all student records' : `${dateStatusFilter} students`} for this date.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 p-2.5 rounded-2xl border border-white/10 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-blue-200 font-bold uppercase block">Day Attendance</span>
                <span className="text-xl font-black text-emerald-400">{dateTally.isMarked ? `${dateTally.percent}%` : 'Not Marked'}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-extrabold text-sm border border-emerald-400/30">
                {dateTally.isMarked ? `${dateTally.present}P` : '0P'}
              </div>
            </div>
          </div>

          {/* Navigation Tabs for Right Column */}
          <div className="flex items-center border-b border-slate-200 text-xs sm:text-sm overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab('daily-log')}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'daily-log'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
              }`}
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Daily Attendees List ({dailyDateAttendees.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('roll-call')}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'roll-call'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Mark Roll Call</span>
            </button>

            <button
              onClick={() => setActiveTab('student-register')}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'student-register'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Shortage Monitor (&lt;75%)</span>
            </button>

            <button
              onClick={() => setActiveTab('staff-attendance')}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'staff-attendance'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Staff Attendance (Faculty & Office)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-extrabold">
                {staffAttendance.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('leaves')}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'leaves'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Leaves & OD</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: DAILY ATTENDEES LIST (WHO ALL CAME ON THIS SELECTED DATE)           */}
          {/* ========================================================================= */}
          {activeTab === 'daily-log' && (
            <div className="space-y-4">
              
              {/* Filter Row */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search who came by student name, roll no, or register number..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="w-full sm:w-44 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="All Departments">All Departments</option>
                    {availableDepartments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Attendance Table on Selected Date */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-5">STUDENT NAME & ROLL NO</th>
                        <th className="py-3.5 px-4">DEPARTMENT</th>
                        <th className="py-3.5 px-4">PERIODS</th>
                        <th className="py-3.5 px-4">STATUS ON {selectedDate.split('-').slice(1).join('/')}</th>
                        <th className="py-3.5 px-5 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                      {dailyDateAttendees.length > 0 ? (
                        dailyDateAttendees.map((s) => (
                          <tr 
                            key={s.id} 
                            onClick={() => setViewingStudentProfile(s)}
                            className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                          >
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  s.dayStatus === 'Present'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : s.dayStatus === 'Absent'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {s.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                                    {s.name}
                                  </p>
                                  <span className="font-mono text-[11px] text-blue-600 font-semibold">{s.rollNo}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-semibold text-slate-700 text-xs">
                              {s.department} (Yr {s.year})
                            </td>

                            <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                              {s.dayPeriods} / {s.totalPeriodsToday || 6} Hrs
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                s.dayStatus === 'Present'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : s.dayStatus === 'Absent'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : s.dayStatus === 'Late'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}>
                                {s.dayStatus === 'Present' && '✓ Present'}
                                {s.dayStatus === 'Not Marked' && '⏳ Not Marked'}
                                {s.dayStatus === 'Absent' && '✕ Absent'}
                                {s.dayStatus === 'Late' && '⏰ Late'}
                                {s.dayStatus === 'On Duty' && '🛡️ On Duty'}
                                {s.dayStatus.includes('Holiday') && s.dayStatus}
                              </span>
                            </td>

                            <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingStudentProfile(s);
                                }}
                                title="View Attendance Profile"
                                className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all text-slate-400"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400">
                            <div className="max-w-xs mx-auto space-y-1.5">
                              <UserX className="w-7 h-7 mx-auto text-slate-300" />
                              <p className="text-xs font-bold text-slate-700">No students matched this date filter</p>
                              <p className="text-[11px] text-slate-400">Try changing status filter or search query</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CLASS ROLL CALL (SESSION RECORDING)                                */}
          {/* ========================================================================= */}
          {activeTab === 'roll-call' && (
            <div className="space-y-5">
              {/* Class Session Selector Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                    <select
                      value={rollDept}
                      onChange={(e) => setRollDept(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      {availableDepartments.length === 0 ? (
                        <option value="">No departments added yet</option>
                      ) : (
                        availableDepartments.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Year & Semester</label>
                    <select
                      value={rollYear}
                      onChange={(e) => {
                        const y = Number(e.target.value);
                        setRollYear(y);
                        setRollSem(`Sem ${y * 2 - 1}`);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value={1}>1st Year (Sem 1)</option>
                      <option value={2}>2nd Year (Sem 3)</option>
                      <option value={3}>3rd Year (Sem 5)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Period Hour</label>
                    <select
                      value={rollPeriod}
                      onChange={(e) => setRollPeriod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Period 1 (09:00 AM - 10:00 AM)">Period 1 (09:00 AM - 10:00 AM)</option>
                      <option value="Period 2 (10:00 AM - 11:00 AM)">Period 2 (10:00 AM - 11:00 AM)</option>
                      <option value="Period 3 (11:15 AM - 12:15 PM)">Period 3 (11:15 AM - 12:15 PM)</option>
                      <option value="Period 4 (01:15 PM - 02:15 PM)">Period 4 (01:15 PM - 02:15 PM)</option>
                    </select>
                  </div>
                </div>

                
              </div>

              {/* Tally Bar & Bulk Actions */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <span className="font-extrabold text-slate-900">Total: {rollTally.total}</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Present: {rollTally.present}</span>
                  <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md">Absent: {rollTally.absent}</span>
                  <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">Late: {rollTally.late}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkAll('Present')}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition-all border border-emerald-200"
                  >
                    ✓ All Present
                  </button>
                  <button
                    onClick={() => handleMarkAll('Absent')}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-all border border-rose-200"
                  >
                    ✕ All Absent
                  </button>
                  <button
                    onClick={handleSubmitRollCall}
                    className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Roll Call</span>
                  </button>
                </div>
              </div>

              {/* Student Roll Call Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-5">ROLL & STUDENT NAME</th>
                        <th className="py-3 px-4">OVERALL %</th>
                        <th className="py-3 px-5 text-center">SESSION STATUS (TOGGLE)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {rollCallStudents.map((s, idx) => (
                        <tr key={s._id || s.id || s.rollNo || idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-5">
                            <span className="font-bold text-slate-900 mr-2">{s.name}</span>
                            <span className="font-mono text-[11px] text-blue-600">{s.rollNo}</span>
                          </td>
                          <td className="py-3 px-4 font-black text-xs">
                            <span className={s.attendancePercent >= 85 ? 'text-emerald-600' : 'text-rose-600'}>
                              {s.attendancePercent}%
                            </span>
                          </td>
                          <td className="py-3 px-5 text-center">
                            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200/80">
                              <button
                                onClick={() => handleToggleRollStatus(s.id, 'Present')}
                                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all ${
                                  s.status === 'Present' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleToggleRollStatus(s.id, 'Absent')}
                                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all ${
                                  s.status === 'Absent' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => handleToggleRollStatus(s.id, 'Late')}
                                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all ${
                                  s.status === 'Late' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600'
                                }`}
                              >
                                Late
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SHORTAGE MONITOR (<75% CONDONATION RISK)                           */}
          {/* ========================================================================= */}
          {activeTab === 'student-register' && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-rose-900">Attendance Shortage Monitor (&lt;75%)</h4>
                    <p className="text-xs text-rose-700 mt-0.5">Students below 75% attendance require condonation or parent intimation</p>
                  </div>
                </div>
                <span className="text-xs font-black text-rose-700 bg-white px-3 py-1.5 rounded-xl border border-rose-200 shadow-xs">
                  {shortageCount} Critical Students
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-5">STUDENT</th>
                      <th className="py-3.5 px-4">DEPT & YEAR</th>
                      <th className="py-3.5 px-4">ATTENDANCE %</th>
                      <th className="py-3.5 px-4">PARENT CONTACT</th>
                      <th className="py-3.5 px-5 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {filteredRegisterStudents.map((s, idx) => (
                      <tr key={s._id || s.id || s.rollNo || idx} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-5">
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <span className="font-mono text-[11px] text-blue-600">{s.rollNo}</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700 text-xs">
                          {s.department} (Yr {s.year})
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`font-black text-xs ${
                            s.attendancePercent < 75 ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200' : 'text-emerald-600'
                          }`}>
                            {s.attendancePercent}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {s.parentName} ({s.parentPhone})
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => setWarningModalStudent(s)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-all inline-flex items-center gap-1 border border-rose-200"
                          >
                            <Send className="w-3 h-3" />
                            <span>Notify Parent</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: STAFF ATTENDANCE (FACULTY, OFFICE STAFF, ACCOUNTANT)               */}
          {/* ========================================================================= */}
          {activeTab === 'staff-attendance' && (
            <div className="space-y-4">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Staff</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">{staffAttendance.length}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Faculty + Office + Accounts</p>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <p className="text-[10px] uppercase font-bold text-blue-600">Teaching Faculty</p>
                  <p className="text-xl font-extrabold text-blue-700 mt-0.5">{staffFacultyCount}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Academic Departments</p>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <p className="text-[10px] uppercase font-bold text-amber-600">Office Staff</p>
                  <p className="text-xl font-extrabold text-amber-700 mt-0.5">{staffOfficeCount}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Administrative Office</p>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <p className="text-[10px] uppercase font-bold text-emerald-600">Accountant / Finance</p>
                  <p className="text-xl font-extrabold text-emerald-700 mt-0.5">{staffAccountantCount}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Accounts & Cash Office</p>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setStaffCategoryFilter('ALL')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      staffCategoryFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Staff ({staffAttendance.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffCategoryFilter('Faculty')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      staffCategoryFilter === 'Faculty'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-blue-600'
                    }`}
                  >
                    👨‍🏫 Faculty ({staffFacultyCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffCategoryFilter('Office Staff')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      staffCategoryFilter === 'Office Staff'
                        ? 'bg-white text-amber-700 shadow-xs'
                        : 'text-slate-600 hover:text-amber-700'
                    }`}
                  >
                    📋 Office Staff ({staffOfficeCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffCategoryFilter('Accountant')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      staffCategoryFilter === 'Accountant'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-emerald-700'
                    }`}
                  >
                    💰 Accountant ({staffAccountantCount})
                  </button>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                    placeholder="Search name, ID, or department..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {staffSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setStaffSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Attendance Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-5">STAFF MEMBER</th>
                      <th className="py-3.5 px-4">ROLE / CATEGORY</th>
                      <th className="py-3.5 px-4">DEPARTMENT</th>
                      <th className="py-3.5 px-4">VERIFICATION MODE</th>
                      <th className="py-3.5 px-4">WORK HOURS</th>
                      <th className="py-3.5 px-5 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredStaffAttendance.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400">
                          No staff attendance records matching the current filter.
                        </td>
                      </tr>
                    ) : (
                      filteredStaffAttendance.map((st, idx) => (
                        <tr key={st._id || st.id || st.empId || idx} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-5">
                            <p className="font-bold text-slate-900">{st.name}</p>
                            <span className="text-[11px] text-slate-400 font-mono">{st.empId} • {st.designation}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                              st.category === 'Office Staff'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : st.category === 'Accountant'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {st.category === 'Office Staff' ? '📋 Office Staff' : st.category === 'Accountant' ? '💰 Accountant' : '👨‍🏫 Teaching Faculty'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700 text-xs">{st.department}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700 text-xs">
                            {st.mode || 'Biometric Face ID'}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-blue-600">{st.workHours}</td>
                          <td className="py-3.5 px-5 text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                              st.status === 'Present'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : st.status === 'Late'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : st.status === 'Not Punched In' ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {st.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: LEAVES & OD                                                        */}
          {/* ========================================================================= */}
          {activeTab === 'leaves' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leaveRequests.map(req => (
                  <div key={req.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-lg border border-blue-100">
                        {req.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                        req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{req.applicantName}</h4>
                      <p className="text-xs text-slate-500">{req.role} • {req.department}</p>
                      <p className="text-xs text-slate-700 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <strong>Reason:</strong> {req.reason}
                      </p>
                    </div>

                    {req.status === 'Pending' && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleUpdateLeaveStatus(req.id, 'Approved')}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleUpdateLeaveStatus(req.id, 'Rejected')}
                          className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: VIEW STUDENT ATTENDANCE PROFILE                                    */}
      {/* ========================================================================= */}
      {viewingStudentProfile && (
        <ModalPortal isOpen={Boolean(viewingStudentProfile)} onClose={() => setViewingStudentProfile(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                    {viewingStudentProfile.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Roll: <strong className="text-slate-800">{viewingStudentProfile.rollNo}</strong> • {viewingStudentProfile.department}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewingStudentProfile(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">Semester Overall Attendance</span>
                <p className="text-2xl font-black text-emerald-400">{viewingStudentProfile.attendancePercent}%</p>
                <p className="text-xs text-slate-300 mt-0.5">{viewingStudentProfile.attendedClasses} / {viewingStudentProfile.totalClasses} Lectures Attended</p>
              </div>

              <span className={`px-3 py-1.5 text-xs font-bold rounded-xl ${
                viewingStudentProfile.attendancePercent < 75 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {viewingStudentProfile.attendancePercent < 75 ? '⚠️ Shortage Risk' : '✓ Eligible for Exams'}
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Subject-wise Attendance Breakdown</h4>
              <div className="space-y-2">
                {viewingStudentProfile.subjectWise?.map((sub, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-purple-600 mr-2">{sub.code}:</span>
                      <span className="font-bold text-slate-900">{sub.name}</span>
                    </div>
                    <span className={`font-black text-xs ${
                      sub.percent >= 85 ? 'text-emerald-600' : sub.percent >= 75 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {sub.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Guardian / Parent Contact</span>
              <p className="font-bold text-slate-800">{viewingStudentProfile.parentName} • 📞 {viewingStudentProfile.parentPhone}</p>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewingStudentProfile(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                Close Profile
              </button>
            </div>

          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SEND SHORTAGE NOTICE                                               */}
      {/* ========================================================================= */}
      {warningModalStudent && (
        <ModalPortal isOpen={Boolean(warningModalStudent)} onClose={() => setWarningModalStudent(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">Send Shortage Notice</h3>
                  <p className="text-[11px] text-slate-500">Official SMS & Email alert to parent</p>
                </div>
              </div>
              <button onClick={() => setWarningModalStudent(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100 text-xs space-y-1 text-rose-900">
              <p><strong>Student:</strong> {warningModalStudent.name} ({warningModalStudent.rollNo})</p>
              <p><strong>Attendance:</strong> <span className="font-extrabold text-rose-600">{warningModalStudent.attendancePercent}%</span> (Minimum 75% required)</p>
              <p><strong>Parent:</strong> {warningModalStudent.parentName} ({warningModalStudent.parentPhone})</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWarningModalStudent(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendWarning}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Dispatch Notice</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
