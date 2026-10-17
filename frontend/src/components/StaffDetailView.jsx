import React, { useState, useEffect } from 'react';
import { API_BASE, BACKEND_URL } from '../apiConfig';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
  Phone,
  Building2,
  Briefcase,
  GraduationCap,
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  MapPin,
  Heart,
  Pencil,
  Download,
  Check,
  ChevronRight,
  TrendingUp,
  FileText,
  Star,
  Trophy,
  ShieldCheck,
  Mic,
  FlaskConical,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Key,
  Printer,
  FileCheck,
  Eye,
  X,
  CreditCard,
  Users,
  Plus,
  Trash2
} from 'lucide-react';
import ModalPortal from './ModalPortal';
import StaffApplicationView from './staff/StaffApplicationView';

const CATEGORY_CONFIG = {
  Award:         { label: 'Award',         color: 'bg-amber-50 text-amber-700 border-amber-200',     badge: 'bg-amber-100 text-amber-800',  icon: Trophy },
  Certification: { label: 'Certification', color: 'bg-blue-50 text-blue-700 border-blue-200',        badge: 'bg-blue-100 text-blue-800',    icon: ShieldCheck },
  Publication:   { label: 'Publication',   color: 'bg-violet-50 text-violet-700 border-violet-200',  badge: 'bg-violet-100 text-violet-800',icon: FileText },
  Conference:    { label: 'Conference',    color: 'bg-teal-50 text-teal-700 border-teal-200',        badge: 'bg-teal-100 text-teal-800',    icon: Mic },
  Research:      { label: 'Research',      color: 'bg-rose-50 text-rose-700 border-rose-200',        badge: 'bg-rose-100 text-rose-800',    icon: FlaskConical },
  Other:         { label: 'Other',         color: 'bg-slate-50 text-slate-600 border-slate-200',     badge: 'bg-slate-100 text-slate-700',  icon: Sparkles },
};

export default function StaffDetailView({ staff, onBack, onEdit, user, onDownloadCredentials, onPrintCredentials }) {
  const isSuperAdmin = user?.role === 'Super Admin' || user?.isSuperAdmin;
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'attendance', 'classes', 'timetable', 'leaves'
  const [selectedMonth, setSelectedMonth] = useState('August 2026');
  const [markedToday, setMarkedToday] = useState(false);
  const [staffLeaves, setStaffLeaves] = useState([]);
  const [staffLeaveSummary, setStaffLeaveSummary] = useState({ totalQuota: 15, approvedDays: 0, pendingCount: 0, remainingDays: 15 });
  const [staffSchedule, setStaffSchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  const staffId = staff.staffId || staff.empId || staff.id || '';

  const [staffCourses, setStaffCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const fetchStaffClasses = () => {
    if (!staffId) return;
    setLoadingCourses(true);
    fetch(`${API_BASE}/classes/staff/${staffId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.classes)) {
          setStaffCourses(d.classes);
        } else if (staff.classes && Array.isArray(staff.classes)) {
          setStaffCourses(staff.classes);
        }
      })
      .catch(() => {
        if (staff.classes && Array.isArray(staff.classes)) {
          setStaffCourses(staff.classes);
        }
      })
      .finally(() => setLoadingCourses(false));
  };

  const [staffAssignments, setStaffAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const fetchStaffAssignments = () => {
    if (!staffId) return;
    setLoadingAssignments(true);
    fetch(`${API_BASE}/assignments/${staffId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) {
          setStaffAssignments(d.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAssignments(false));
  };

  const fetchStaffLeaves = () => {
    if (!staffId) return;
    fetch(`${API_BASE}/leave/staff/${staffId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setStaffLeaves(d.leaves || []);
          if (d.summary) setStaffLeaveSummary(d.summary);
        }
      })
      .catch(() => {});
  };

  const [staffData, setStaffData] = useState(staff);
  const [achievements, setAchievements] = useState(staff.achievements || []);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [achievementFilter, setAchievementFilter] = useState('All');

  useEffect(() => {
    setStaffData(staff);
  }, [staff]);

  const fetchStaffAchievements = () => {
    if (!staffId) return;
    setLoadingAchievements(true);
    fetch(`${API_BASE}/staff/${staffId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setStaffData(prev => ({ ...prev, ...d.data }));
          if (Array.isArray(d.data.achievements)) {
            setAchievements(d.data.achievements);
          }
        } else if (staff.achievements && Array.isArray(staff.achievements)) {
          setAchievements(staff.achievements);
        }
      })
      .catch(() => {
        if (staff.achievements && Array.isArray(staff.achievements)) {
          setAchievements(staff.achievements);
        }
      })
      .finally(() => setLoadingAchievements(false));
  };

  const fetchStaffSchedule = () => {
    if (!staffId) return;
    setLoadingSchedule(true);
    fetch(`${API_BASE}/timetable/staff/${staffId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.schedule) setStaffSchedule(d.schedule);
      })
      .catch(() => {})
      .finally(() => setLoadingSchedule(false));
  };

  const handleClearTimetableSlot = async (day, slotNum) => {
    if (!window.confirm(`Delete / Clear Period ${slotNum} on ${day}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/timetable/staff/${staffId}/slot/${day}/${slotNum}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        if (data.schedule) setStaffSchedule(data.schedule);
        fetchStaffSchedule();
      } else {
        alert(data.message || 'Failed to clear timetable slot');
      }
    } catch (e) {
      alert('Network error clearing timetable slot');
    }
  };

  const handleClearFullTimetable = async () => {
    if (!window.confirm(`Are you sure you want to delete and reset the weekly timetable for ${staff.name}?`)) return;
    try {
      const emptySchedule = {
        Monday: {},
        Tuesday: {},
        Wednesday: {},
        Thursday: {},
        Friday: {},
        Saturday: {}
      };
      const res = await fetch(`${API_BASE}/timetable/staff/${staffId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: emptySchedule })
      });
      if (res.ok) {
        setStaffSchedule(emptySchedule);
        fetchStaffSchedule();
      }
    } catch (e) {
      alert('Network error clearing timetable');
    }
  };

  useEffect(() => {
    fetchStaffLeaves();
    fetchStaffClasses();
    fetchStaffAssignments();
    fetchStaffAchievements();
    fetchStaffSchedule();
    fetchDropdownData();
  }, [staffId]);

  // Real database dropdown options for Add Class modal
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableStaffList, setAvailableStaffList] = useState([]);
  const [availableVenues, setAvailableVenues] = useState([]);
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [savingClass, setSavingClass] = useState(false);
  const [classFormError, setClassFormError] = useState('');
  const [classSuccessToast, setClassSuccessToast] = useState('');

  const [classForm, setClassForm] = useState({
    code: '',
    name: '',
    dept: staff.department || '',
    year: 1,
    semester: 1,
    section: 'A',
    staffId: staff.staffId || staff.empId || '',
    staffName: staff.name || '',
    theoryHours: 3,
    labHours: 0,
    isContinuousLab: false,
    continuousHours: 3,
    room: '',
    credits: 3
  });

  const fetchDropdownData = async () => {
    try {
      const [dRes, subRes, sRes, cRes] = await Promise.all([
        fetch(`${API_BASE}/departments`).catch(() => null),
        fetch(`${API_BASE}/subjects`).catch(() => null),
        fetch(`${API_BASE}/staff`).catch(() => null),
        fetch(`${API_BASE}/classes`).catch(() => null)
      ]);

      if (dRes && dRes.ok) {
        const dData = await dRes.json();
        const rawDepts = dData?.departments || dData?.data || (Array.isArray(dData) ? dData : []);
        const deptNames = rawDepts.map(d => (typeof d === 'string' ? d : d.name || d.departmentName)).filter(Boolean);
        setAvailableDepartments(Array.from(new Set(deptNames)));
      }

      if (subRes && subRes.ok) {
        const subData = await subRes.json();
        const rawSubs = subData?.subjects || subData?.data || (Array.isArray(subData) ? subData : []);
        // Only created subjects, filter out deleted or dummy
        const filteredSubs = rawSubs.filter(s => s && s.code && !['CS401', 'CS402', 'SF76', 'CS2001', 'CS2005'].includes(s.code.toUpperCase()));
        setAvailableSubjects(filteredSubs);
      }

      if (sRes && sRes.ok) {
        const sData = await sRes.json();
        const staffArr = sData?.data || sData?.staff || (Array.isArray(sData) ? sData : []);
        setAvailableStaffList(staffArr);
      }

      let rooms = [];
      if (cRes && cRes.ok) {
        const cData = await cRes.json();
        const clsArr = cData?.classes || cData?.data || (Array.isArray(cData) ? cData : []);
        rooms = clsArr.map(c => c.room).filter(Boolean);
      }
      try {
        const customHalls = JSON.parse(localStorage.getItem('vcas_custom_exam_halls') || '[]');
        const customVenues = JSON.parse(localStorage.getItem('vcas_custom_venues') || '[]');
        const names = [...customHalls, ...customVenues].map(h => typeof h === 'string' ? h : (h?.name || h?.room || h?.hallName)).filter(Boolean);
        rooms = [...rooms, ...names];
      } catch (_) {}
      const uniqueRooms = Array.from(new Set(rooms));
      setAvailableVenues(uniqueRooms.length > 0 ? uniqueRooms : ['LH-101', 'LH-102', 'Computer Lab 1', 'Seminar Hall 1']);
    } catch (e) {
      console.error('Failed to load dropdown options:', e);
    }
  };

  const handleOpenAddClassModal = () => {
    setClassFormError('');
    fetchDropdownData();
    setClassForm({
      code: '',
      name: '',
      dept: availableDepartments.length > 0 ? (availableDepartments.includes(staff.department) ? staff.department : availableDepartments[0]) : '',
      year: 1,
      semester: 1,
      section: 'A',
      staffId: staff.staffId || staff.empId || '',
      staffName: staff.name || '',
      theoryHours: 3,
      labHours: 0,
      isContinuousLab: false,
      continuousHours: 3,
      room: availableVenues[0] || 'LH-101',
      credits: 3
    });
    setIsAddClassModalOpen(true);
  };

  const handleSelectCreatedSubject = (selectedCode) => {
    const sub = availableSubjects.find(s => s.code === selectedCode);
    if (sub) {
      const isLab = Boolean(sub.type === 'lab' || (Number(sub.labHours) > 0) || sub.name?.toLowerCase().includes('lab'));
      const parsedSem = sub.sem ? (parseInt(String(sub.sem).replace(/\D/g, ''), 10) || 1) : 1;
      const matchedDept = availableDepartments.includes(sub.department) ? sub.department : (availableDepartments[0] || '');
      setClassForm(prev => ({
        ...prev,
        code: sub.code,
        name: sub.name,
        dept: matchedDept,
        year: Number(sub.year) || prev.year,
        semester: parsedSem,
        theoryHours: sub.theoryHours !== undefined ? Number(sub.theoryHours) : (isLab ? 0 : 3),
        labHours: sub.labHours !== undefined ? Number(sub.labHours) : (isLab ? 3 : 0),
        isContinuousLab: Boolean(sub.isContinuousLab || isLab),
        continuousHours: Number(sub.labHours) || 3,
        credits: Number(sub.credits) || 3,
        room: isLab ? 'Computer Lab 1' : (prev.room || 'LH-101')
      }));
    } else {
      setClassForm(prev => ({ ...prev, code: selectedCode }));
    }
  };

  const handleSaveAddClass = async (e) => {
    e.preventDefault();
    setClassFormError('');

    if (!classForm.code.trim() || !classForm.name.trim()) {
      setClassFormError('Subject Code and Subject Name are required.');
      return;
    }

    try {
      setSavingClass(true);
      const isLab = Boolean(classForm.isContinuousLab || Number(classForm.labHours) > 0);
      const hoursStr = Number(classForm.labHours) > 0
        ? `${classForm.theoryHours}h Theory + ${classForm.labHours}h Continuous Lab`
        : `${classForm.theoryHours} hrs/wk`;

      const payload = {
        code: classForm.code.trim().toUpperCase(),
        name: classForm.name.trim(),
        dept: classForm.dept || staff.department || '',
        year: Number(classForm.year),
        semester: Number(classForm.semester),
        section: classForm.section || 'A',
        credits: Number(classForm.credits) || 3,
        theoryHours: Number(classForm.theoryHours) || 0,
        labHours: Number(classForm.labHours) || 0,
        isContinuousLab: isLab,
        hours: hoursStr,
        staffId: classForm.staffId || staff.staffId,
        staffName: classForm.staffName || staff.name,
        room: classForm.room || 'LH-101',
        academicYear: '2026-2027'
      };

      const res = await fetch(`${API_BASE}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setClassFormError(data.message || 'Failed to add class.');
        return;
      }

      setIsAddClassModalOpen(false);
      setClassSuccessToast(`✓ Class "${payload.code} - ${payload.name}" added successfully and Weekly Timetable automatically generated with continuous lab hours!`);
      setTimeout(() => setClassSuccessToast(''), 4500);
      fetchStaffClasses();
      fetchStaffSchedule();
    } catch (err) {
      setClassFormError('Network error: ' + err.message);
    } finally {
      setSavingClass(false);
    }
  };

  const handleAdminLeaveAction = async (leaveId, status) => {
    try {
      const res = await fetch(`${API_BASE}/leave/${leaveId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, approvedBy: 'Admin (Principal / HoD)' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchStaffLeaves();
      } else {
        alert(data.message || 'Failed to update leave.');
      }
    } catch (e) {
      alert('Unable to connect to server.');
    }
  };

  // Real staff profile fields filled by staff or admin
  const currentStaff = staffData || staff;
  const qualification = currentStaff.qualification || 'Pending staff first-time setup';
  const experience = currentStaff.experience || 'Pending staff first-time setup';
  const employmentType = currentStaff.employmentType || 'Permanent / Full-Time';
  const bloodGroup = currentStaff.bloodGroup || 'Not specified';
  const dob = currentStaff.dob || 'Not specified';
  const address = currentStaff.permanentAddress || currentStaff.address || 'Pending staff first-time setup';
  const emergencyContact = currentStaff.emergencyContact || 'Pending staff first-time setup';
  const netSetExamStatus = currentStaff.netSetExamStatus || 'Not Applicable';
  const netSetExamCertificate = currentStaff.netSetExamCertificate || '';
  const netSetCertificateName = currentStaff.netSetCertificateName || '';

  const handleViewCertificate = () => {
    if (!netSetExamCertificate) return;
    setShowCertModal(true);
  };

  const handleDownloadCertificate = () => {
    if (!netSetExamCertificate) return;
    const a = document.createElement('a');
    a.href = netSetExamCertificate;
    a.download = netSetCertificateName || 'NET_SET_Exam_Certificate';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Map real staff courses/classes
  const courses = staffCourses.map(c => ({
    code: c.code || c.classCode || '',
    name: c.name || c.className || '',
    sem: c.sem || (c.semester ? `${c.semester}${c.semester === 1 ? 'st' : c.semester === 2 ? 'nd' : c.semester === 3 ? 'rd' : 'th'} Sem${c.section ? ` - Sec ${c.section}` : ''}` : 'Active Sem'),
    students: Array.isArray(c.students) ? c.students.length : (c.totalStudents || (Array.isArray(c.enrolledStudents) ? c.enrolledStudents.length : 0)),
    hours: c.hours || `${c.credits || 3} hrs/wk`,
    room: c.room || 'Classroom / Lab',
    progress: typeof c.progress === 'number' ? c.progress : 0
  }));

  // Calendar Attendance Grid Generator for August 2026 (31 Days)
  // Generates status for each day: 'P' (Present), 'A' (Absent), 'L' (Leave), 'H' (Holiday/Weekend)
  const attendanceDays = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    // Weekends in Aug 2026 (assuming Sat/Sun)
    const dateObj = new Date(2026, 7, day);
    const dayOfWeek = dateObj.getDay(); // 0 is Sun, 6 is Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      return { day, status: 'Weekend', label: 'W', bg: 'bg-slate-100 text-slate-400 border-slate-200' };
    }
    if (day === 15) {
      return { day, status: 'Holiday (Independence Day)', label: 'H', bg: 'bg-indigo-50 text-indigo-600 border-indigo-200 font-bold' };
    }
    if (day === 12) {
      return { day, status: 'Casual Leave (Approved)', label: 'L', bg: 'bg-amber-100 text-amber-800 border-amber-300 font-bold' };
    }
    if (day > 28) {
      return { day, status: 'Upcoming', label: '-', bg: 'bg-slate-50 text-slate-300 border-slate-100' };
    }
    return { day, status: 'Present', label: 'P', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' };
  });

  const presentCount = 19;
  const leaveCount = 1;
  const absentCount = 0;
  const holidayCount = 9; // weekends + holiday
  const totalWorking = presentCount + leaveCount + absentCount;
  const attendancePercentage = Math.round((presentCount / totalWorking) * 100);

  const tabs = [
    { id: 'overview', label: 'Overview & Profile', icon: User },
    { id: 'application', label: 'College Application Form', icon: FileText, badge: 'Official Form' },
    { id: 'attendance', label: 'Attendance & Leaves', icon: Calendar, badge: `${attendancePercentage}%` },
    { id: 'classes', label: 'Courses & Classes', icon: BookOpen, badge: `${courses.length}` },
    { id: 'timetable', label: 'Weekly Timetable', icon: Clock },
    { id: 'assignments', label: 'Assignments Set', icon: FileText, badge: `${staffAssignments.length}` },
    { id: 'performance', label: 'Achievements', icon: Award, badge: `${achievements.length}` }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans animate-fadeIn">
      
      {/* 1. TOP BREADCRUMB & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50/80 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-blue-200 transition-all shadow-xs self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Staff List</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('application')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-xs cursor-pointer ${
              activeTab === 'application'
                ? 'bg-purple-600 text-white border-purple-600 shadow-purple-500/20'
                : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Print College Application</span>
          </button>

          {isSuperAdmin && (
            <>
              <button
                onClick={() => {
                  if (onDownloadCredentials) onDownloadCredentials(staff);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-sm shadow-purple-500/20 transition-all cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>Download Credentials Slip</span>
              </button>
              <button
                onClick={() => {
                  if (onPrintCredentials) onPrintCredentials(staff);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 bg-white hover:bg-purple-50 border border-purple-200 shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-purple-600" />
                <span>Print Slip</span>
              </button>
            </>
          )}
          <button
            onClick={() => {
              setMarkedToday(true);
              alert(`Today's Attendance for ${staff.name} recorded as PRESENT (09:00 AM)`);
            }}
            disabled={markedToday}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-xs ${
              markedToday
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{markedToday ? 'Attendance Marked (Present)' : 'Mark Present Today'}</span>
          </button>
        </div>
      </div>

      {/* 2. HERO PROFILE HEADER CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Avatar and Basic Details */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl ${!staff.profileImage ? (staff.avatarBg || 'bg-purple-600') : 'bg-slate-100'} overflow-hidden text-white font-black text-2xl sm:text-3xl flex items-center justify-center shrink-0 shadow-md ring-4 ring-slate-50`}>
              {staff.profileImage ? (
                <img src={staff.profileImage} alt={staff.name} className="w-full h-full object-cover" />
              ) : (
                staff.avatarText || staff.name?.substring(0, 2)?.toUpperCase() || 'ST'
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                  {staff.name}
                </h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                  staff.status === 'Active' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : staff.status === 'On Leave'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {staff.status}
                </span>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-slate-600 flex flex-wrap items-center gap-2">
                <span>{staff.designation}</span>
                <span className="text-slate-300">•</span>
                <span className="text-blue-600 font-bold">{staff.department}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                  {staff.empId}
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {staff.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {staff.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-50/90 p-3 sm:p-4 rounded-2xl border border-slate-100 shrink-0">
            <div className="text-center px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attendance</span>
              <span className="text-lg sm:text-xl font-extrabold text-emerald-600">{attendancePercentage}%</span>
              <span className="text-[10px] text-slate-500 font-medium block">This Month</span>
            </div>
            <div className="text-center px-2 border-x border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Courses</span>
              <span className="text-lg sm:text-xl font-extrabold text-blue-600">{courses.length}</span>
              <span className="text-[10px] text-slate-500 font-medium block">Assigned</span>
            </div>
            <div className="text-center px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Joined</span>
              <span className="text-sm sm:text-base font-bold text-slate-800 leading-tight block mt-1">{staff.joiningDate?.split('-')[0] || '2020'}</span>
              <span className="text-[10px] text-slate-500 font-medium block">5 yrs tenure</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-2 text-xs sm:text-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENTS */}
      
      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & PERSONAL DETAILS */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1 & 2: Employment & Educational Information */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Academic / Employment Profile */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" /> Academic & Employment Info
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Qualification</span>
                  <span className="font-semibold text-slate-800">{qualification}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Experience</span>
                  <span className="font-semibold text-slate-800">{experience}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Employment Type</span>
                  <span className="font-semibold text-slate-800">{employmentType}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Joining Date</span>
                  <span className="font-semibold text-slate-800">{staff.joiningDate}</span>
                </div>
              </div>
            </div>

            {/* NET / SET Exam Qualification & Certificate Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" /> NET / SET Exam Qualification &amp; Certificate
                </h3>
                <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border self-start sm:self-auto ${
                  netSetExamStatus && netSetExamStatus !== 'Not Applicable' && !netSetExamStatus.includes('Awaiting')
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : netSetExamStatus.includes('Awaiting')
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  {netSetExamStatus}
                </span>
              </div>

              <div className="p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    netSetExamCertificate ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {netSetExamCertificate ? <FileCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {netSetExamCertificate
                        ? (netSetCertificateName || 'NET / SET Exam Certificate')
                        : 'No Certificate Uploaded Yet'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {netSetExamCertificate
                        ? 'Official qualification document is uploaded and verified'
                        : 'Faculty member has not uploaded an exam certificate'}
                    </p>
                  </div>
                </div>

                {netSetExamCertificate && (
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      onClick={handleViewCertificate}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button
                      onClick={handleDownloadCertificate}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Contact & Personal Information */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600" /> Personal & Contact Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Official Email</span>
                  <span className="font-semibold text-slate-800">{staff.email}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Contact Phone</span>
                  <span className="font-semibold text-slate-800">{staff.phone}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Blood Group</span>
                  <span className="font-semibold text-slate-800">{bloodGroup}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Date of Birth</span>
                  <span className="font-semibold text-slate-800">{dob}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Gender / Marital Status</span>
                  <span className="font-semibold text-slate-800">{currentStaff.gender || '—'} / {currentStaff.maritalStatus || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Community &amp; Caste</span>
                  <span className="font-semibold text-slate-800">{currentStaff.community || '—'} {currentStaff.caste ? `(${currentStaff.caste})` : ''}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Father's / Husband's Name</span>
                  <span className="font-semibold text-slate-800">{currentStaff.fatherOrSpouseName || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">WhatsApp Number</span>
                  <span className="font-semibold text-slate-800">{currentStaff.whatsapp || currentStaff.phone || '—'}</span>
                </div>
                <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Residential Address</span>
                  <span className="font-semibold text-slate-800">{address}</span>
                </div>
                <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Emergency Contact</span>
                  <span className="font-semibold text-slate-800">{emergencyContact}</span>
                </div>
              </div>
            </div>

            {/* Statutory & Banking Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" /> Statutory &amp; Bank Account Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Aadhaar Card Number</span>
                  <span className="font-mono font-bold text-slate-800">{currentStaff.aadhaar || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">PAN Card Number</span>
                  <span className="font-mono font-bold text-slate-800">{currentStaff.pan || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Bank Account Number</span>
                  <span className="font-mono font-bold text-blue-700">{currentStaff.bankAccountNo || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Bank Name</span>
                  <span className="font-semibold text-slate-800">{currentStaff.bankName || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">IFSC Code</span>
                  <span className="font-mono font-bold text-slate-800">{currentStaff.ifscCode || '—'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Branch Name</span>
                  <span className="font-semibold text-slate-800">{currentStaff.bankBranch || '—'}</span>
                </div>
              </div>
            </div>

            {/* Academic Qualifications Table */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" /> Academic Qualifications &amp; Degrees
                </h3>
                <span className="text-[11px] font-bold text-indigo-600">Educational History</span>
              </div>

              {Array.isArray(currentStaff.academicQualifications) && currentStaff.academicQualifications.filter(q => q.degree).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Degree</th>
                        <th className="py-2.5 px-3">Specialization</th>
                        <th className="py-2.5 px-3">Institution / University</th>
                        <th className="py-2.5 px-2 text-center">Mode</th>
                        <th className="py-2.5 px-2 text-center">Marks / CGPA</th>
                        <th className="py-2.5 px-2 text-center">Year</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentStaff.academicQualifications.filter(q => q.degree).map((q, qIdx) => (
                        <tr key={qIdx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{q.degree}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">{q.specialization || '—'}</td>
                          <td className="py-2.5 px-3 text-slate-600">{q.institution || '—'}</td>
                          <td className="py-2.5 px-2 text-center text-slate-500">{q.mode || 'Full time'}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-indigo-700">{q.marksOrCgpa || '—'}</td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-700">{q.yearOfPassing || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                  <span className="font-bold text-slate-800">Summary: </span>
                  {currentStaff.qualification || 'Faculty member'}
                </div>
              )}
            </div>

            {/* Experience Details Table */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-600" /> Teaching &amp; Industry Experience
                </h3>
                <span className="text-[11px] font-bold text-amber-600">Service Record</span>
              </div>

              {Array.isArray(currentStaff.experienceDetails) && currentStaff.experienceDetails.filter(e => e.institution).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Institution / Organization</th>
                        <th className="py-2.5 px-3">Designation</th>
                        <th className="py-2.5 px-2 text-center">From Date</th>
                        <th className="py-2.5 px-2 text-center">To Date</th>
                        <th className="py-2.5 px-2 text-center">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentStaff.experienceDetails.filter(e => e.institution).map((exp, eIdx) => (
                        <tr key={eIdx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{exp.institution}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">{exp.designation || 'Lecturer'}</td>
                          <td className="py-2.5 px-2 text-center text-slate-500">{exp.fromDate || '—'}</td>
                          <td className="py-2.5 px-2 text-center text-slate-500">{exp.toDate || '—'}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-amber-700">{exp.duration || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                  <span className="font-bold text-slate-800">Experience Profile: </span>
                  {currentStaff.experience || 'Fresher / Lecturer'}
                </div>
              )}
            </div>

            {/* Research, Publications & Grants */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" /> Research, Publications &amp; Projects
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-center">
                  <span className="text-[10px] font-bold text-purple-600 uppercase block">Int'l Journals</span>
                  <span className="text-base font-black text-purple-900">{currentStaff.publications?.internationalJournals || 0}</span>
                </div>
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-center">
                  <span className="text-[10px] font-bold text-purple-600 uppercase block">National Journals</span>
                  <span className="text-base font-black text-purple-900">{currentStaff.publications?.nationalJournals || 0}</span>
                </div>
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-center">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase block">Conferences</span>
                  <span className="text-base font-black text-indigo-900">
                    {(Number(currentStaff.publications?.internationalConferences) || 0) + (Number(currentStaff.publications?.nationalConferences) || 0)}
                  </span>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">Books Authored</span>
                  <span className="text-base font-black text-amber-900">{currentStaff.publications?.books || 0}</span>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">FDPs &amp; Seminars</span>
                  <span className="text-base font-black text-emerald-900">
                    {(Number(currentStaff.programmes?.attendedFDP) || 0) + (Number(currentStaff.programmes?.organizedFDP) || 0) + (Number(currentStaff.programmes?.attendedSeminars) || 0)}
                  </span>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
                  <span className="text-[10px] font-bold text-blue-700 uppercase block">Funded Projects</span>
                  <span className="text-base font-black text-blue-900">
                    {Array.isArray(currentStaff.projectFunds) ? currentStaff.projectFunds.filter(p => p.agency || p.title).length : 0}
                  </span>
                </div>
              </div>

              {Array.isArray(currentStaff.projectFunds) && currentStaff.projectFunds.filter(p => p.agency || p.title).length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Funded Research Projects:</span>
                  {currentStaff.projectFunds.filter(p => p.agency || p.title).map((proj, pIdx) => (
                    <div key={pIdx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">{proj.title || 'Research Grant'}</span>
                        <span className="block text-[11px] text-slate-500">{proj.agency} • Scheme: {proj.scheme || 'N/A'}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-700">₹{proj.amountLakhs || 0} Lakhs</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Professional References & Application Metadata */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Professional References &amp; Application Info
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Post Applied For</span>
                  <span className="font-semibold text-slate-800">{currentStaff.postAppliedFor || currentStaff.designation || 'Assistant Professor'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Age / Nationality / Religion</span>
                  <span className="font-semibold text-slate-800">
                    {currentStaff.age ? `${currentStaff.age} yrs` : '—'} • {currentStaff.nationality || 'Indian'} • {currentStaff.religion || '—'}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Expected Pay / Last Pay</span>
                  <span className="font-semibold text-slate-800">
                    {currentStaff.payExpected || '—'} / {currentStaff.payLastObtained || '—'}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Application Date &amp; Place</span>
                  <span className="font-semibold text-slate-800">
                    {currentStaff.applicationDate || '—'} • {currentStaff.place || 'Campus'}
                  </span>
                </div>
              </div>

              {Array.isArray(currentStaff.references) && currentStaff.references.filter(r => r.name).length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Designated References:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentStaff.references.filter(r => r.name).map((ref, rIdx) => (
                      <div key={rIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <span className="font-bold text-slate-900 block">{ref.name}</span>
                        <span className="text-[11px] text-slate-500 block">{ref.designation} • {ref.institution}</span>
                        <span className="text-[11px] text-indigo-700 font-mono block mt-1">{ref.contactNo || ''} {ref.email ? `• ${ref.email}` : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Column 3: Quick Summary & Status Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Attendance Widget */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900">Attendance Highlights</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="font-bold text-emerald-800">Present Days</span>
                  <span className="font-extrabold text-emerald-900 text-sm">{presentCount} Days</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="font-bold text-amber-800">Leaves Taken</span>
                  <span className="font-extrabold text-amber-900 text-sm">{leaveCount} Day</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                  <span className="font-bold text-rose-800">Unexcused Absences</span>
                  <span className="font-extrabold text-rose-900 text-sm">{absentCount} Days</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('attendance')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                View Full Attendance Sheet →
              </button>
            </div>

            {/* Courses Overview List */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900">Active Teaching Loads</h3>
              <div className="space-y-2.5 text-xs">
                {courses.map((course, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{course.code}</span>
                      <span className="text-blue-600 font-extrabold">{course.students} Students</span>
                    </div>
                    <p className="text-slate-600 font-medium">{course.name}</p>
                    <p className="text-[11px] text-slate-400">{course.sem} • {course.hours}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements Quick Preview */}
            {achievements.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" /> Recent Achievements
                  </h3>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {achievements.length} Total
                  </span>
                </div>
                <div className="space-y-2">
                  {achievements.slice(0, 3).map((ach) => {
                    const cfg = CATEGORY_CONFIG[ach.category] || CATEGORY_CONFIG.Other;
                    return (
                      <div key={ach._id || ach.title} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-bold text-slate-900 truncate">{ach.title}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${cfg.color}`}>
                            {ach.category}
                          </span>
                        </div>
                        {ach.issuedBy && <p className="text-[11px] text-slate-500 truncate">{ach.issuedBy} {ach.year ? `• ${ach.year}` : ''}</p>}
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => setActiveTab('performance')}
                  className="w-full py-1.5 text-center text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/60 hover:bg-blue-100/60 rounded-xl transition-all"
                >
                  View All Achievements ({achievements.length}) →
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1.5: COLLEGE APPLICATION FORM (2-PAGE OFFICIAL FORMAT)               */}
      {/* ========================================================================= */}
      {activeTab === 'application' && (
        <StaffApplicationView staff={currentStaff} />
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ATTENDANCE & LEAVE RECORD */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          
          {/* Attendance Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Monthly Rate</span>
              <p className="text-2xl font-black text-emerald-600">{attendancePercentage}%</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Target: &gt;90%</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Present</span>
              <p className="text-2xl font-black text-slate-900">{presentCount} Days</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">100% on-time check-in</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Leaves Taken</span>
              <p className="text-2xl font-black text-amber-600">{staffLeaveSummary.approvedDays} Day{staffLeaveSummary.approvedDays !== 1 ? 's' : ''}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Approved for academic year</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Leave Balance</span>
              <p className="text-2xl font-black text-blue-600">{staffLeaveSummary.remainingDays} Days</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Remaining out of {staffLeaveSummary.totalQuota || 15}</p>
            </div>
          </div>

          {/* August 2026 Interactive Calendar Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Attendance Calendar - {selectedMonth}</h3>
                <p className="text-xs text-slate-500 font-medium">Daily check-in and biometric verification history</p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span> Present (P)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span> Leave (L)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-indigo-500 inline-block"></span> Holiday (H)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-300 inline-block"></span> Weekend (W)
                </span>
              </div>
            </div>

            {/* 31-Day Interactive Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
              {attendanceDays.map((item) => (
                <div 
                  key={item.day}
                  title={`Day ${item.day}: ${item.status}`}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-between text-center transition-all hover:scale-105 cursor-pointer min-h-[70px] ${item.bg}`}
                >
                  <span className="text-xs font-bold">{item.day}</span>
                  <span className="text-sm font-black">{item.label}</span>
                  <span className="text-[9px] truncate max-w-full font-medium">{item.status.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Leave History Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Faculty Leave Applications ({staffLeaves.length})</h3>
              <span className="text-xs text-slate-400 font-medium">Live Records</span>
            </div>
            {staffLeaves.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No leave applications recorded for this faculty member yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">LEAVE TYPE</th>
                      <th className="py-3 px-4">FROM</th>
                      <th className="py-3 px-4">TO</th>
                      <th className="py-3 px-4">DAYS</th>
                      <th className="py-3 px-4">REASON</th>
                      <th className="py-3 px-4">STATUS</th>
                      <th className="py-3 px-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffLeaves.map((l, idx) => (
                      <tr key={l._id || l.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{l.leaveType}</td>
                        <td className="py-3.5 px-4 text-slate-600">{l.fromDate}</td>
                        <td className="py-3.5 px-4 text-slate-600">{l.toDate}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{l.days} Day{l.days > 1 ? 's' : ''}</td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={l.reason}>{l.reason}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                            l.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            l.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {l.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleAdminLeaveAction(l._id, 'Approved')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px]"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleAdminLeaveAction(l._id, 'Rejected')}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-[10px]"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">{l.approvedBy || '-'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CLASSES & SUBJECTS TAUGHT */}
      {/* ========================================================================= */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          {classSuccessToast && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold shadow-xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{classSuccessToast}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Assigned Courses & Lecture Modules</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Academic Semester 2026-27 • <span className="font-bold text-blue-600">{courses.length} Courses Assigned</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddClassModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/25 transition-all cursor-pointer self-start sm:self-auto hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class</span>
            </button>
          </div>

          {loadingCourses ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              Loading courses and classes...
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-400 space-y-3">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300" />
              <div>
                <p className="text-base font-bold text-slate-700">No Courses or Classes Assigned Yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Click the button below to add and assign a class / subject to {staff.name}. Only real subjects & departments created in the database will be available.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddClassModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Class to {staff.name}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((c, i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 font-bold">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-800">
                      {c.code}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">{c.name}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">{c.sem}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Enrolled</span>
                      <span className="font-extrabold text-slate-800">{c.students} Students</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Load</span>
                      <span className="font-extrabold text-slate-800">{c.hours}</span>
                    </div>
                    <div className="col-span-2 mt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Classroom</span>
                      <span className="font-semibold text-slate-700">{c.room}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Syllabus Covered</span>
                      <span className="text-blue-600 font-extrabold">{c.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${c.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WEEKLY TIMETABLE */}
      {/* ========================================================================= */}
      {activeTab === 'timetable' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">Faculty Assigned Timetable</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  Active Schedule
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Weekly scheduled lectures and lab allocations for {staff.name} ({staffId})
              </p>
            </div>
            {staffSchedule && Object.values(staffSchedule).some(daySlots => Object.keys(daySlots || {}).length > 0) && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
                  {Object.values(staffSchedule).reduce((total, daySlots) => total + Object.keys(daySlots || {}).length, 0)} Total Assigned Slots
                </span>
                <button
                  type="button"
                  onClick={handleClearFullTimetable}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Clear all assigned slots for this staff member"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Timetable</span>
                </button>
              </div>
            )}
          </div>

          {loadingSchedule ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              Loading timetable schedule...
            </div>
          ) : !staffSchedule || Object.values(staffSchedule).every(daySlots => Object.keys(daySlots || {}).length === 0) ? (
            <div className="py-12 text-center text-slate-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No Timetable Assigned Yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Slots assigned by faculty or administration will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
                const daySlots = staffSchedule[day] || {};
                const activeEntries = Object.entries(daySlots)
                  .filter(([_, s]) => s && s.code)
                  .sort(([a], [b]) => Number(a) - Number(b));

                if (activeEntries.length === 0) return null;

                const SLOT_TIMES = {
                  '1': '8:30 – 9:20 AM',
                  '2': '9:20 – 10:10 AM',
                  '3': '10:10 – 11:00 AM',
                  '4': '11:15 AM – 12:05 PM',
                  '5': '12:05 – 12:55 PM',
                  '6': '1:45 – 2:35 PM',
                  '7': '2:35 – 3:25 PM',
                  '8': '3:25 – 4:15 PM'
                };

                return (
                  <div key={day} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-blue-600" /> {day}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {activeEntries.length} Period{activeEntries.length > 1 ? 's' : ''}
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeEntries.map(([slotNum, slot]) => (
                        <div key={slotNum} className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5 hover:border-blue-300 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-blue-600 font-mono">
                              Period {slotNum} ({SLOT_TIMES[slotNum] || `Slot ${slotNum}`})
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                slot.type === 'lab' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {slot.type || 'Theory'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleClearTimetableSlot(day, slotNum)}
                                title="Delete this period slot"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs font-extrabold text-slate-900 leading-tight">
                            {slot.code}: {slot.name}
                          </p>
                          <div className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-500 font-medium">
                            <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                              📍 {slot.room || 'Classroom / Lab'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ACHIEVEMENTS (REAL STAFF DATA)                                     */}
      {/* ========================================================================= */}
      {activeTab === 'performance' && (() => {
        const filteredAchievements = achievementFilter === 'All'
          ? achievements
          : achievements.filter(a => a.category === achievementFilter);

        const categoryCounts = achievements.reduce((acc, a) => {
          const cat = a.category || 'Other';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {});

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: Real Staff Achievements List */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <span>Faculty Achievements & Recognitions</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Official profile records submitted by {staff.name} • {achievements.length} verified {achievements.length === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>

                  
                </div>

                {/* Category Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {['All', 'Award', 'Certification', 'Publication', 'Conference', 'Research', 'Other'].map(cat => {
                    const count = cat === 'All' ? achievements.length : (categoryCounts[cat] || 0);
                    const isSelected = achievementFilter === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setAchievementFilter(cat)}
                        className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                      >
                        <span>{cat === 'All' ? 'All Categories' : cat}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Achievements List */}
                <div className="space-y-3 pt-1">
                  {loadingAchievements && achievements.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-xs font-semibold">Loading verified achievements...</p>
                    </div>
                  ) : filteredAchievements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                        <Trophy className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-600">
                        {achievementFilter === 'All' ? 'No achievements added yet' : `No ${achievementFilter} achievements found`}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        {achievementFilter === 'All'
                          ? `${staff.name} has not submitted any awards, certifications, or research publications to their profile yet.`
                          : `There are currently no entries under the "${achievementFilter}" category for this staff member.`
                        }
                      </p>
                    </div>
                  ) : (
                    filteredAchievements.map((ach) => {
                      const cfg = CATEGORY_CONFIG[ach.category] || CATEGORY_CONFIG.Other;
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={ach._id || ach.title}
                          className="flex items-start gap-4 p-4.5 rounded-2xl border border-slate-200 bg-white hover:border-blue-200 hover:shadow-xs transition-all"
                        >
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${cfg.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className="text-sm font-extrabold text-slate-900 leading-tight">{ach.title}</h4>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${cfg.color}`}>
                                {ach.category}
                              </span>
                              {ach.year && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                                  {ach.year}
                                </span>
                              )}
                            </div>

                            {ach.issuedBy && (
                              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mt-1">
                                <span className="text-slate-400 font-normal">Issued by / Organization:</span>
                                <span className="text-slate-800 font-bold">{ach.issuedBy}</span>
                              </p>
                            )}

                            {ach.description && (
                              <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                {ach.description}
                              </p>
                            )}

                            {ach.createdAt && (
                              <p className="text-[10px] text-slate-400 mt-2">
                                Submitted on {new Date(ach.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </div>

            {/* Right Column: Achievements Portfolio Breakdown & Faculty Quick Info */}
            <div className="space-y-6">
              
              {/* Category Breakdown Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900">Portfolio Breakdown</h3>
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                    {achievements.length} Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
                    const count = categoryCounts[key] || 0;
                    const Icon = cfg.icon;
                    const isFiltered = achievementFilter === key;
                    return (
                      <div
                        key={key}
                        onClick={() => setAchievementFilter(achievementFilter === key ? 'All' : key)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isFiltered
                            ? 'border-blue-500 bg-blue-50/60 shadow-xs'
                            : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                        }`}
                        title={`Filter by ${cfg.label}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <Icon className="w-4 h-4 text-slate-500" />
                          <span className="text-base font-extrabold text-slate-900">{count}</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 block truncate">{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>

                {achievementFilter !== 'All' && (
                  <button
                    onClick={() => setAchievementFilter('All')}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                  >
                    Clear Filter (Show All)
                  </button>
                )}
              </div>

              {/* Faculty Profile Summary */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900">Faculty Credentials</h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Department & Role</span>
                    <p className="font-bold text-slate-800">{staff.designation}</p>
                    <p className="text-slate-500">{staff.department}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Highest Qualification</span>
                    <p className="font-bold text-slate-800">{staff.qualification || 'Not provided'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Teaching Experience</span>
                    <p className="font-bold text-slate-800">{staff.experience ? `${staff.experience} Years` : 'Not specified'}</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* TAB 6: ASSIGNMENTS SET BY THIS STAFF MEMBER                               */}
      {/* ========================================================================= */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Assignments Created by {staff.name}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total {staffAssignments.length} assignments published for students
              </p>
            </div>
          </div>

          {loadingAssignments ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Loading staff assignments...
            </div>
          ) : staffAssignments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-xs text-slate-600">No assignments created yet by this staff member.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staffAssignments.map((a) => (
                <div key={a._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                        {a.subjectCode}
                      </span>
                      {a.subjectName && (
                        <span className="text-xs font-semibold text-slate-600">{a.subjectName}</span>
                      )}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                      a.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {a.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{a.title}</h4>
                    {a.description && (
                      <p className="text-xs text-slate-500 mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {a.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span>Due: <strong className="text-slate-800">{a.dueDate}</strong></span>
                    </span>
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      Max: {a.totalMarks || 20} Marks
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NET / SET CERTIFICATE MODAL PREVIEW */}
      {showCertModal && netSetExamCertificate && (
        <ModalPortal>
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base leading-tight truncate">
                        {staff.name}
                      </h3>
                      <span className="text-xs font-mono font-bold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md shrink-0">
                        {staff.empId || staff.staffId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {staff.department} • {staff.designation} • <span className="font-semibold text-indigo-600">{netSetExamStatus}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownloadCertificate}
                    title="Download Certificate File"
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowCertModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 bg-slate-100 flex-1 overflow-auto flex items-center justify-center min-h-[420px]">
                {netSetExamCertificate.startsWith('data:application/pdf') || netSetCertificateName?.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={netSetExamCertificate}
                    title="NET/SET Certificate"
                    className="w-full h-[65vh] rounded-2xl border border-slate-300 bg-white shadow-inner"
                  />
                ) : (
                  <div className="max-w-full max-h-[65vh] flex items-center justify-center p-2 bg-slate-900 rounded-2xl overflow-hidden shadow-lg">
                    <img
                      src={netSetExamCertificate}
                      alt="NET/SET Certificate"
                      className="max-w-full max-h-[60vh] object-contain rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
                  <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-700 truncate">
                    {netSetCertificateName || 'NET / SET Exam Certificate'}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const w = window.open();
                      if (w) {
                        if (netSetExamCertificate.startsWith('data:application/pdf')) {
                          w.document.write(`<html><head><title>${netSetCertificateName || 'NET/SET Certificate'}</title><style>html,body{margin:0;padding:0;height:100%;overflow:hidden;background:#1e293b;}</style></head><body><iframe src="${netSetExamCertificate}" frameborder="0" style="width:100%;height:100%;border:none;" allowfullscreen></iframe></body></html>`);
                        } else {
                          w.document.write(`<html><head><title>${netSetCertificateName || 'NET/SET Certificate'}</title><style>html,body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#0f172a;}</style></head><body><img src="${netSetExamCertificate}" style="max-width:92%;max-height:92vh;border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,0.6);" /></body></html>`);
                        }
                      }
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCertificate}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCertModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD CLASS / SUBJECT MODULE FOR STAFF                               */}
      {/* ========================================================================= */}
      {isAddClassModalOpen && (
        <ModalPortal isOpen={isAddClassModalOpen} onClose={() => setIsAddClassModalOpen(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block">
                  Staff Courses &amp; Classes Management
                </span>
                <h3 className="text-lg font-black text-slate-900">Add Class / Subject Module</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assigning to <span className="font-bold text-slate-800">{classForm.staffName || staff.name}</span> ({classForm.staffId || staff.staffId})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddClassModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {classFormError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{classFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddClass} className="space-y-4">
              {/* 1. SUBJECT SELECTION FROM CREATED SUBJECTS */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Created Subject <span className="text-[11px] font-normal text-blue-600">(Dropdown of Added Subjects)</span>
                </label>
                <select
                  value={availableSubjects.some(s => s.code === classForm.code) ? classForm.code : (classForm.code ? '__custom__' : '')}
                  onChange={(e) => handleSelectCreatedSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs sm:text-sm font-bold text-blue-950 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer transition-all"
                >
                  <option value="">-- Choose Subject Created by Admin / Staff --</option>
                  {availableSubjects.length === 0 ? (
                    <option value="" disabled>No subjects created yet in Subjects page</option>
                  ) : (
                    availableSubjects.map(sub => (
                      <option key={sub._id || sub.code} value={sub.code}>
                        [{sub.code}] {sub.name} • {sub.department || 'General'} (Yr {sub.year || 1})
                      </option>
                    ))
                  )}
                  {classForm.code && !availableSubjects.some(s => s.code === classForm.code) && (
                    <option value={classForm.code}>{classForm.code} (Custom)</option>
                  )}
                </select>
              </div>

              {/* Subject Code & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS2001"
                    value={classForm.code}
                    onChange={(e) => setClassForm({ ...classForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Class Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Data Structures & Algorithms"
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Department & Staff In-Charge Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department <span className="text-[11px] font-normal text-blue-600">(Dropdown of Added Departments)</span>
                  </label>
                  <select
                    value={classForm.dept}
                    onChange={(e) => setClassForm({ ...classForm, dept: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Select Created Department --</option>
                    {availableDepartments.length === 0 ? (
                      <option value="" disabled>No departments created yet (Please add department first)</option>
                    ) : (
                      availableDepartments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Faculty / Staff In-Charge <span className="text-[11px] font-normal text-indigo-600">(Signed-up Staff)</span>
                  </label>
                  <select
                    value={classForm.staffId}
                    onChange={(e) => {
                      const sId = e.target.value;
                      const st = availableStaffList.find(s => s.staffId === sId);
                      setClassForm({
                        ...classForm,
                        staffId: sId,
                        staffName: st ? st.name : classForm.staffName
                      });
                    }}
                    className="w-full px-3 py-2 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-950 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Select Staff In-Charge --</option>
                    {availableStaffList.length === 0 ? (
                      <option value="" disabled>No signed-up staff found</option>
                    ) : (
                      availableStaffList.map(st => (
                        <option key={st._id || st.staffId} value={st.staffId}>
                          {st.name} ({st.staffId}) • {st.department || 'General'}
                        </option>
                      ))
                    )}
                    {classForm.staffId && !availableStaffList.some(s => s.staffId === classForm.staffId) && (
                      <option value={classForm.staffId}>{classForm.staffName || classForm.staffId}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Year, Semester & Section */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Year</label>
                  <select
                    value={classForm.year}
                    onChange={(e) => setClassForm({ ...classForm, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 cursor-pointer"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                  <select
                    value={classForm.semester}
                    onChange={(e) => setClassForm({ ...classForm, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6].map(sem => (
                      <option key={sem} value={sem}>Sem {sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                  <select
                    value={classForm.section}
                    onChange={(e) => setClassForm({ ...classForm, section: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 cursor-pointer"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              {/* Theory Hours & Lab Hours (Separate Inputs) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Theory Hours (per week)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={classForm.theoryHours}
                    onChange={(e) => setClassForm({ ...classForm, theoryHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">Standard lecture slots</span>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Lab Hours (per week)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={classForm.labHours}
                    onChange={(e) => {
                      const lh = Number(e.target.value);
                      setClassForm(prev => ({
                        ...prev,
                        labHours: lh,
                        isContinuousLab: lh > 0 ? true : prev.isContinuousLab,
                        continuousHours: lh > 0 ? lh : prev.continuousHours
                      }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">E.g., 3 continuous hours</span>
                </div>
              </div>

              {/* Continuous Lab Hours Block */}
              {Number(classForm.labHours) > 0 && (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-emerald-950">
                      <input
                        type="checkbox"
                        checked={classForm.isContinuousLab}
                        onChange={(e) => setClassForm({ ...classForm, isContinuousLab: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                      <span>Continuous Lab Hours Block</span>
                    </label>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300">
                      {classForm.labHours} Continuous Hours
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    ⚡ If {classForm.labHours} hrs is set for lab, the lab periods will be scheduled continuously on the weekly timetable without breaks.
                  </p>
                </div>
              )}

              {/* Classroom / Venue */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Classroom / Lab Venue</label>
                <select
                  value={classForm.room}
                  onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 cursor-pointer"
                >
                  <option value="">-- Choose Classroom / Lab Room --</option>
                  {availableVenues.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                  {classForm.room && !availableVenues.includes(classForm.room) && (
                    <option value={classForm.room}>{classForm.room}</option>
                  )}
                </select>
              </div>

              {/* Auto Timetable notice */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] font-bold text-blue-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Automatic Timetable Generation: Setting hours for this subject/class automatically generates the weekly timetable schedule. Lab hours are scheduled as continuous consecutive periods without breaks.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  disabled={savingClass}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingClass}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{savingClass ? 'Saving Class...' : 'Add Class & Auto-Generate Timetable'}</span>
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
