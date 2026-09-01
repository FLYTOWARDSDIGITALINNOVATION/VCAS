import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Users, 
  Building2, 
  BookOpen, 
  CheckSquare, 
  FileSpreadsheet, 
  Calendar, 
  BookMarked, 
  IndianRupee, 
  Library, 
  Home, 
  Bus, 
  UserCheck, 
  Bell, 
  Sparkles, 
  BarChart3, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Search, 
  Plus, 
  UserPlus, 
  DollarSign, 
  FileText, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import StaffManagement from './StaffManagement';
import DepartmentManagement from './DepartmentManagement';
import CourseSubjectManagement from './CourseSubjectManagement';
import AttendanceManagement from './AttendanceManagement';
import ExaminationManagement from './ExaminationManagement';
import TimetableManagement from './TimetableManagement';
import AssignmentManagement from './AssignmentManagement';

export default function Dashboard({ user, onLogout, onSwitchPortal }) {
  const [activePortal, setActivePortal] = useState(user?.role || 'Admin');
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePortalSwitch = (portal) => {
    setActivePortal(portal);
    if (onSwitchPortal) onSwitchPortal(portal);
  };

  const handleNavClick = (navName) => {
    setActiveNav(navName);
    setMobileMenuOpen(false);
  };

  // Nav categories
  const navSections = [
    {
      title: 'MAIN',
      items: [
        { name: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'ACADEMIC',
      items: [
        { name: 'Students', icon: GraduationCap },
        { name: 'Staff', icon: Users },
        { name: 'Departments', icon: Building2 },
        { name: 'Courses & Subjects', icon: BookOpen },
        { name: 'Attendance', icon: CheckSquare },
        { name: 'Examinations', icon: FileSpreadsheet },
        { name: 'Timetable', icon: Calendar },
        { name: 'Assignments', icon: BookMarked }
      ]
    },
    {
      title: 'FINANCE',
      items: [
        { name: 'Fees', icon: IndianRupee }
      ]
    },
    {
      title: 'CAMPUS',
      items: [
        { name: 'Library', icon: Library },
        { name: 'Hostel', icon: Home },
        { name: 'Transport', icon: Bus }
      ]
    },
    {
      title: 'HR',
      items: [
        { name: 'Leave Management', icon: UserCheck }
      ]
    },
    {
      title: 'COMMUNICATION',
      items: [
        { name: 'Notices', icon: Bell },
        { name: 'Events', icon: Sparkles }
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { name: 'Reports', icon: BarChart3 },
        { name: 'Users & Roles', icon: ShieldCheck },
        { name: 'Settings', icon: Settings }
      ]
    }
  ];

  // 8 Metric cards exact as Figma
  const metricCards = [
    { title: 'TOTAL STUDENTS', value: '1,248', change: '+12% vs last month', isUp: true, icon: GraduationCap, bg: 'bg-blue-500', textColor: 'text-blue-600' },
    { title: 'TOTAL STAFF', value: '84', change: '+3% vs last month', isUp: true, icon: Users, bg: 'bg-emerald-500', textColor: 'text-emerald-600', navTarget: 'Staff' },
    { title: 'DEPARTMENTS', value: '6', change: '0% vs last month', isUp: true, icon: Building2, bg: 'bg-purple-500', textColor: 'text-purple-600', navTarget: 'Departments' },
    { title: 'TOTAL COURSES', value: '24', change: '+2 vs last month', isUp: true, icon: BookOpen, bg: 'bg-indigo-500', textColor: 'text-indigo-600', navTarget: 'Courses & Subjects' },
    { title: 'TODAY\'S ATTENDANCE', value: '89.2%', change: '+1.4% vs last month', isUp: true, icon: CheckSquare, bg: 'bg-teal-500', textColor: 'text-teal-600', navTarget: 'Attendance' },
    { title: 'PENDING FEES', value: '₹4.8L', change: '-8% vs last month', isUp: false, icon: IndianRupee, bg: 'bg-amber-500', textColor: 'text-amber-600' },
    { title: 'LEAVE REQUESTS', value: '7', change: '+3 vs last month', isUp: true, icon: Calendar, bg: 'bg-orange-500', textColor: 'text-orange-600', navTarget: 'Attendance' },
    { title: 'UPCOMING EXAMS', value: '3', change: 'this week vs last month', isUp: true, icon: FileSpreadsheet, bg: 'bg-rose-500', textColor: 'text-rose-600', navTarget: 'Examinations' }
  ];

  // Recent activity entries
  const recentActivities = [
    { title: 'New student registered', detail: 'Aditya Kapoor – CS Dept', time: '5 min ago', bg: 'bg-blue-100 text-blue-600', icon: UserPlus },
    { title: 'Fee payment received', detail: '₹45,000 – Priya Mehta', time: '22 min ago', bg: 'bg-emerald-100 text-emerald-600', icon: DollarSign },
    { title: 'Staff member added', detail: 'Dr. Neeraj Gupta – ECE', time: '1 hr ago', bg: 'bg-purple-100 text-purple-600', icon: Users, navTarget: 'Staff' },
    { title: 'Leave request submitted', detail: 'Prof. Ramesh Kumar', time: '2 hr ago', bg: 'bg-amber-100 text-amber-600', icon: Calendar, navTarget: 'Attendance' },
    { title: 'Exam created', detail: 'Mid-Semester – CS 4th Sem', time: '3 hr ago', bg: 'bg-rose-100 text-rose-600', icon: FileText, navTarget: 'Examinations' },
    { title: 'Notice published', detail: 'Diwali holiday – All students', time: '4 hr ago', bg: 'bg-indigo-100 text-indigo-600', icon: Bell }
  ];

  // Quick actions grid
  const quickActions = [
    { label: 'Add Student', icon: UserPlus, bg: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
    { label: 'Staff Directory', icon: Users, bg: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700', navTarget: 'Staff' },
    { label: 'Mark Attendance', icon: CheckSquare, bg: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700', navTarget: 'Attendance' },
    { label: 'Collect Fee', icon: DollarSign, bg: 'bg-amber-50 hover:bg-amber-100 text-amber-700' },
    { label: 'Post Notice', icon: Bell, bg: 'bg-purple-50 hover:bg-purple-100 text-purple-700' },
    { label: 'View Reports', icon: BarChart3, bg: 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700' }
  ];

  const SidebarContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Logo / Title Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
              🏛️
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-base leading-tight">Vidyapeeth</h1>
              <p className="text-[11px] text-slate-500 font-medium">Management System</p>
            </div>
          </div>
          {/* Close button on mobile */}
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavClick(item.name)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-bold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer Logout */}
      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={() => {
            setMobileMenuOpen(false);
            setShowLogoutModal(true);
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* MOBILE SIDEBAR DRAWER & BACKDROP */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col overflow-y-auto z-10 animate-slideRight">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* TOP HEADER BAR */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
          
          <div className="flex items-center gap-3 flex-1 max-w-md mr-4">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search bar */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students, staff, courses..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Right Header Items */}
          <div className="flex items-center gap-3 sm:gap-6">
            
            {/* Demo Portal Switcher */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">Switch portal</span>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                {['Admin', 'Faculty', 'Student'].map((portal) => (
                  <button
                    key={portal}
                    onClick={() => handlePortalSwitch(portal)}
                    className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all ${
                      activePortal === portal
                        ? 'bg-white text-blue-600 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {portal}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification & User Avatar */}
            <div className="flex items-center gap-3 sm:gap-4 sm:pl-4 sm:border-l border-slate-200">
              <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs border border-slate-300 shadow-xs">
                  A
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">Admin User</p>
                  <p className="text-[10px] font-medium text-slate-500">Admin</p>
                </div>
              </div>
            </div>

          </div>
        </header>

        {/* CONDITIONALLY RENDER CONTENT BASED ON ACTIVE NAV */}
        {activeNav === 'Staff' ? (
          <main className="flex-1">
            <StaffManagement />
          </main>
        ) : activeNav === 'Departments' ? (
          <main className="flex-1">
            <DepartmentManagement />
          </main>
        ) : activeNav === 'Courses & Subjects' ? (
          <main className="flex-1">
            <CourseSubjectManagement />
          </main>
        ) : activeNav === 'Attendance' || activeNav === 'Leave Management' ? (
          <main className="flex-1">
            <AttendanceManagement />
          </main>
        ) : activeNav === 'Examinations' ? (
          <main className="flex-1">
            <ExaminationManagement />
          </main>
        ) : activeNav === 'Timetable' ? (
          <main className="flex-1">
            <TimetableManagement />
          </main>
        ) : activeNav === 'Assignments' ? (
          <main className="flex-1">
            <AssignmentManagement />
          </main>
        ) : (
          /* DEFAULT DASHBOARD VIEW */
          <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
            
            {/* Dashboard Title Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                Welcome back, Admin. Here's what's happening today.
              </p>
            </div>

            {/* 8 METRIC CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {metricCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div 
                    key={idx} 
                    onClick={() => card.navTarget && handleNavClick(card.navTarget)}
                    className={`bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex items-start justify-between ${
                      card.navTarget ? 'cursor-pointer hover:border-blue-300' : ''
                    }`}
                  >
                    <div>
                      <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                        {card.title}
                      </p>
                      <p className="text-2xl font-extrabold text-slate-900 leading-none mb-2">
                        {card.value}
                      </p>
                      <p className={`text-xs font-semibold flex items-center gap-1 ${card.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {card.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {card.change}
                      </p>
                    </div>
                    
                    <div className={`w-10 h-10 rounded-xl ${card.bg} text-white flex items-center justify-center shadow-xs shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CHARTS ROW 1: Enrollment Trend Line Chart + Attendance Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Student Enrollment Trend */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-6">Student Enrollment Trend</h3>
                
                <div className="h-64 w-full relative">
                  {/* SVG Line Chart */}
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
                    {/* Grid Lines */}
                    <line x1="0" y1="0" x2="700" y2="0" stroke="#f1f5f9" strokeDasharray="4 4" />
                    <line x1="0" y1="50" x2="700" y2="50" stroke="#f1f5f9" strokeDasharray="4 4" />
                    <line x1="0" y1="100" x2="700" y2="100" stroke="#f1f5f9" strokeDasharray="4 4" />
                    <line x1="0" y1="150" x2="700" y2="150" stroke="#f1f5f9" strokeDasharray="4 4" />

                    {/* Gradient Area under curve */}
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    <path 
                      d="M 0 110 Q 100 80, 200 70 T 400 90 T 600 60 T 700 50 L 700 200 L 0 200 Z" 
                      fill="url(#areaGradient)" 
                    />

                    {/* Main Line */}
                    <path 
                      d="M 0 110 Q 100 80, 200 70 T 400 90 T 600 60 T 700 50" 
                      fill="none" 
                      stroke="#3b82f6" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                    />
                  </svg>

                  {/* X Axis Labels */}
                  <div className="flex justify-between text-xs font-semibold text-slate-400 mt-4 border-t border-slate-100 pt-2">
                    <span>Aug</span>
                    <span>Sep</span>
                    <span>Oct</span>
                    <span>Nov</span>
                    <span>Dec</span>
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                  </div>
                </div>
              </div>

              {/* Right 1 Col: Attendance Overview Donut Chart */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Attendance Overview</h3>
                
                <div className="relative w-44 h-44 sm:w-48 sm:h-48 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background Circle */}
                    <path
                      className="text-slate-100"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Present 79% (Blue) */}
                    <path
                      className="text-blue-600"
                      strokeDasharray="79, 100"
                      strokeWidth="4"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Absent 15% (Red) */}
                    <path
                      className="text-rose-500"
                      strokeDasharray="15, 100"
                      strokeDashoffset="-79"
                      strokeWidth="4"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* On Leave 6% (Amber) */}
                    <path
                      className="text-amber-500"
                      strokeDasharray="6, 100"
                      strokeDashoffset="-94"
                      strokeWidth="4"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  
                  <div className="absolute text-center">
                    <span className="text-2xl font-black text-slate-900">79%</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Present</p>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex justify-around text-xs font-semibold text-slate-600 border-t border-slate-100 pt-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Present
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Absent
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> On Leave
                  </div>
                </div>
              </div>

            </div>

            {/* CHARTS ROW 2: Horizontal Bar + Monthly Fees + Subject Attendance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Department Students Horizontal Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Department Enrolments</h3>
                <div className="space-y-3 text-xs">
                  {[
                    { dept: 'ECE', count: 340, width: '90%' },
                    { dept: 'MBA', count: 270, width: '75%' },
                    { dept: 'Mech', count: 220, width: '60%' },
                    { dept: 'Civil', count: 180, width: '50%' },
                    { dept: 'BCA', count: 150, width: '40%' }
                  ].map((d, i) => (
                    <div key={i}>
                      <div className="flex justify-between font-semibold text-slate-700 mb-1">
                        <span>{d.dept}</span>
                        <span className="font-bold text-slate-900">{d.count}</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: d.width }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Fee Collection Vertical Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Monthly Fee Collection</h3>
                <div className="flex items-end justify-between h-40 gap-2 px-2">
                  {[
                    { month: 'Aug', height: '60%' },
                    { month: 'Sep', height: '75%' },
                    { month: 'Oct', height: '70%' },
                    { month: 'Nov', height: '85%' },
                    { month: 'Dec', height: '50%' },
                    { month: 'Jan', height: '95%' }
                  ].map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full bg-amber-500 rounded-t-lg transition-all" style={{ height: m.height }}></div>
                      <span className="text-[11px] font-semibold text-slate-400">{m.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Attendance Vertical Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Subject Attendance</h3>
                <div className="flex items-end justify-between h-40 gap-2 px-2">
                  {[
                    { subj: 'Math', height: '85%' },
                    { subj: 'Physics', height: '78%' },
                    { subj: 'CS', height: '95%' },
                    { subj: 'English', height: '90%' },
                    { subj: 'Chem', height: '75%' }
                  ].map((s, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full bg-purple-600 rounded-t-lg transition-all" style={{ height: s.height }}></div>
                      <span className="text-[11px] font-semibold text-slate-400">{s.subj}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* BOTTOM ROW: Recent Activity + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Recent Activity */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-6">Recent Activity</h3>
                <div className="divide-y divide-slate-100">
                  {recentActivities.map((act, i) => {
                    const Icon = act.icon;
                    return (
                      <div 
                        key={i} 
                        onClick={() => act.navTarget && handleNavClick(act.navTarget)}
                        className={`py-3.5 flex items-center justify-between first:pt-0 last:pb-0 ${
                          act.navTarget ? 'cursor-pointer hover:bg-slate-50/80 px-2 -mx-2 rounded-xl transition-all' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-9 h-9 rounded-xl ${act.bg} flex items-center justify-center font-bold shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{act.title}</p>
                            <p className="text-xs text-slate-500">{act.detail}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-slate-400">{act.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 1 Col: Quick Actions */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action, i) => {
                    const Icon = action.icon;
                    return (
                      <button 
                        key={i}
                        onClick={() => {
                          if (action.navTarget) {
                            handleNavClick(action.navTarget);
                          } else {
                            alert(`${action.label} action clicked!`);
                          }
                        }}
                        className={`p-4 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-2 border border-transparent hover:border-slate-200 transition-all ${action.bg}`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

          </main>
        )}

      </div>

      {/* Logout Confirmation Warning Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 transform transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">Confirm Logout</h3>
                <p className="text-xs text-slate-500 mt-1">Are you sure you want to log out of Vidyapeeth Management System?</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
              <p>You will need to enter your login credentials again to access the portal dashboard.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout();
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 transition-all"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
