import React, { useState, useEffect } from 'react';
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
  Star
} from 'lucide-react';

export default function StaffDetailView({ staff, onBack, onEdit }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'attendance', 'classes', 'timetable', 'leaves'
  const [selectedMonth, setSelectedMonth] = useState('August 2026');
  const [markedToday, setMarkedToday] = useState(false);
  const [staffLeaves, setStaffLeaves] = useState([]);
  const [staffLeaveSummary, setStaffLeaveSummary] = useState({ totalQuota: 15, approvedDays: 0, pendingCount: 0, remainingDays: 15 });
  const [staffSchedule, setStaffSchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const staffId = staff.staffId || staff.empId || staff.id || '';

  const [staffCourses, setStaffCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const fetchStaffClasses = () => {
    if (!staffId) return;
    setLoadingCourses(true);
    fetch(`http://localhost:5000/api/classes/staff/${staffId}`)
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

  const fetchStaffLeaves = () => {
    if (!staffId) return;
    fetch(`http://localhost:5000/api/leave/staff/${staffId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setStaffLeaves(d.leaves || []);
          if (d.summary) setStaffLeaveSummary(d.summary);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStaffLeaves();
    fetchStaffClasses();
    if (staffId) {
      setLoadingSchedule(true);
      fetch(`http://localhost:5000/api/timetable/staff/${staffId}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.schedule) setStaffSchedule(d.schedule);
        })
        .catch(() => {})
        .finally(() => setLoadingSchedule(false));
    }
  }, [staffId]);

  const handleAdminLeaveAction = async (leaveId, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/leave/${leaveId}/status`, {
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
  const qualification = staff.qualification || 'Pending staff first-time setup';
  const experience = staff.experience || 'Pending staff first-time setup';
  const employmentType = staff.employmentType || 'Permanent / Full-Time';
  const bloodGroup = staff.bloodGroup || 'Not specified';
  const dob = staff.dob || 'Not specified';
  const address = staff.address || 'Pending staff first-time setup';
  const emergencyContact = staff.emergencyContact || 'Pending staff first-time setup';

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
    return { day, status: 'Present (Checked in 08:52 AM)', label: 'P', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' };
  });

  const presentCount = 19;
  const leaveCount = 1;
  const absentCount = 0;
  const holidayCount = 9; // weekends + holiday
  const totalWorking = presentCount + leaveCount + absentCount;
  const attendancePercentage = Math.round((presentCount / totalWorking) * 100);

  const tabs = [
    { id: 'overview', label: 'Overview & Profile', icon: User },
    { id: 'attendance', label: 'Attendance & Leaves', icon: Calendar, badge: `${attendancePercentage}%` },
    { id: 'classes', label: 'Courses & Classes', icon: BookOpen, badge: `${courses.length}` },
    { id: 'timetable', label: 'Weekly Timetable', icon: Clock },
    { id: 'performance', label: 'Achievements & Ratings', icon: Award }
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

          <button
            onClick={() => onEdit && onEdit(staff)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs shadow-blue-500/20 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* 2. HERO PROFILE HEADER CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Avatar and Basic Details */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl ${staff.avatarBg || 'bg-purple-600'} text-white font-black text-2xl sm:text-3xl flex items-center justify-center shrink-0 shadow-md ring-4 ring-slate-50`}>
              {staff.avatarText}
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

          </div>

        </div>
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
              <p className="text-xs text-slate-500 font-medium mt-1">Remaining out of 15</p>
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
                    {staffLeaves.map((l) => (
                      <tr key={l._id} className="hover:bg-slate-50/50">
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
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">Assigned Courses & Lecture Modules</h3>
            <span className="text-xs text-slate-500 font-medium">Academic Semester 2026-27</span>
          </div>

          {loadingCourses ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              Loading courses and classes...
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-400">
              <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No Courses or Classes Assigned Yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Classes created or assigned to {staff.name} will appear here.
              </p>
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
            {staffSchedule && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 self-start sm:self-auto">
                {Object.values(staffSchedule).reduce((total, daySlots) => total + Object.keys(daySlots || {}).length, 0)} Total Assigned Slots
              </span>
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
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              slot.type === 'lab' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {slot.type || 'Theory'}
                            </span>
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
      {/* TAB 5: ACHIEVEMENTS & RATINGS */}
      {/* ========================================================================= */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* Student Feedback Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Student Evaluation & Feedback
              </h3>

              <div className="flex items-center gap-6 p-4 bg-amber-50/60 rounded-2xl border border-amber-100">
                <div className="text-center">
                  <span className="text-3xl font-black text-amber-600">4.8</span>
                  <span className="text-xs font-bold text-slate-500 block">/ 5.0 Rating</span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-900">Excellent Teaching & Clarity</p>
                  <p>Based on feedback submitted by 142 students across all batches.</p>
                </div>
              </div>
            </div>

            {/* Research & Publications */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Research Papers & Publications
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase">IEEE Journal (2025)</span>
                  <p className="font-bold text-slate-900">"Scalable Architectures for Distributed Machine Learning Systems"</p>
                  <p className="text-slate-500">Co-authored with IIT Research Labs</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase">ACM Conference (2024)</span>
                  <p className="font-bold text-slate-900">"Optimizing Edge Inference for Low-Power Microcontrollers"</p>
                  <p className="text-slate-500">Presented at ACM SIGBED, Bengaluru</p>
                </div>
              </div>
            </div>

          </div>

          {/* Badges / Department Awards */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900">Faculty Honors</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
                    🏆
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Best Faculty Award 2024</p>
                    <p className="text-slate-500">For Academic Excellence</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                    📜
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">NPTEL Elite Gold Certified</p>
                    <p className="text-slate-500">Advanced Algorithms Course</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
