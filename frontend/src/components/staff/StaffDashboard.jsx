import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, BookOpen, CheckSquare, Calendar, BookMarked,
  Bell, UserCheck, User, LogOut, Menu, X, GraduationCap,
  ChevronRight, Shield, FileSpreadsheet, ClipboardList, Ticket, Award, UserPlus,
  Search, Clock, Sparkles, Building2
} from 'lucide-react';
import StaffHome from './StaffHome';
import StaffMyClasses from './StaffMyClasses';
import StaffAttendance from './StaffAttendance';
import StaffTimetable from './StaffTimetable';
import StaffAssignments from './StaffAssignments';
import StaffInternalMarks from './StaffInternalMarks';
import StaffNotices from './StaffNotices';
import StaffLeave from './StaffLeave';
import StaffProfile from './StaffProfile';
import StaffQuestionPaper from './StaffQuestionPaper';
import StaffHallTicket from './StaffHallTicket';
import StaffStudentEntry from './StaffStudentEntry';
import StaffStudentModule from './StaffStudentModule';
import StaffExamSchedule from './StaffExamSchedule';
import CollegeLogo from '../CollegeLogo';

const NAV_SECTIONS = [
  {
    title: 'MAIN',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'ACADEMIC',
    items: [
      { name: 'Student', icon: GraduationCap },
      { name: 'My Classes', icon: BookOpen },
      { name: 'Attendance', icon: CheckSquare },
      { name: 'Internal Marks', icon: FileSpreadsheet },
      { name: 'Timetable', icon: Calendar },
      { name: 'Hall Allocation Setup', icon: Building2 },
      { name: 'Assignments', icon: BookMarked },
      { name: 'Question Papers', icon: ClipboardList },
      { name: 'Hall Tickets', icon: Ticket }
    ]
  },
  {
    title: 'PROFILE & LEAVE',
    items: [
      { name: 'My Profile', icon: User },
      { name: 'Leave Management', icon: UserCheck },
      { name: 'Notices', icon: Bell }
    ]
  }
];

export default function StaffDashboard({ staffUser, onLogout }) {
  const [activeNav, setActiveNav] = useState(() => sessionStorage.getItem('vcas_staff_nav') || 'Dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('vcas_staff_nav', activeNav);
  }, [activeNav]);

  useEffect(() => {
    document.body.style.overflow = showLogoutModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showLogoutModal]);

  const renderPage = () => {
    switch (activeNav) {
      case 'Dashboard':            return <StaffHome staffUser={staffUser} onNavigate={setActiveNav} />;
      case 'Student':
      case 'Student Module':
      case 'Student Entry':        return <StaffStudentModule staffUser={staffUser} onNavigate={setActiveNav} />;
      case 'My Classes':           return <StaffMyClasses staffUser={staffUser} />;
      case 'Attendance':           return <StaffAttendance staffUser={staffUser} />;
      case 'Internal Marks':       return <StaffInternalMarks staffUser={staffUser} />;
      case 'Timetable':            return <StaffTimetable staffUser={staffUser} />;
      case 'Hall Allocation Setup':
      case 'Hall Allocation':
      case 'Exam Schedule':        return <StaffExamSchedule staffUser={staffUser} onNavigate={setActiveNav} />;
      case 'Assignments':          return <StaffAssignments staffUser={staffUser} />;
      case 'Question Papers':      return <StaffQuestionPaper staffUser={staffUser} />;
      case 'Hall Tickets':         return <StaffHallTicket staffUser={staffUser} onNavigate={setActiveNav} />;
      case 'My Profile':           return <StaffProfile staffUser={staffUser} />;
      case 'Notices':              return <StaffNotices staffUser={staffUser} />;
      case 'Leave Management':
      case 'Leave':                return <StaffLeave staffUser={staffUser} />;
      default:                     return <StaffHome staffUser={staffUser} onNavigate={setActiveNav} />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col justify-between h-full bg-white">
      <div>
        {/* Sticky Header Matching Admin */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 py-4 sm:px-5 sm:py-5 flex items-center justify-between shadow-2xs min-w-0">
          <CollegeLogo size="md" showText={true} />
          <button 
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Staff Quick Profile Card in Sidebar */}
        <div 
          onClick={() => { setActiveNav('My Profile'); setMobileOpen(false); }}
          className="mx-4 my-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 transition-all cursor-pointer group shadow-2xs"
          title="View Faculty Profile"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl overflow-hidden ${!staffUser?.profileImage ? `bg-gradient-to-br ${staffUser?.avatarColor || 'from-blue-600 to-indigo-600'}` : 'bg-slate-100'} flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0 group-hover:scale-105 transition-transform`}>
              {staffUser?.profileImage ? (
                <img src={staffUser.profileImage} alt={staffUser?.name || 'Staff'} className="w-full h-full object-cover" />
              ) : (
                staffUser?.avatarInitials || staffUser?.avatarText || staffUser?.name?.substring(0, 2)?.toUpperCase() || 'ST'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-slate-900 font-extrabold text-xs truncate group-hover:text-blue-600 transition-colors">
                {staffUser?.name || 'Faculty Member'}
              </p>
              <p className="text-slate-500 text-[10px] font-semibold truncate">
                {staffUser?.designation || 'Assistant Professor'}
              </p>
              <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-100 text-blue-700 mt-1">
                {staffUser?.department || 'Faculty'}
              </span>
            </div>
          </div>
        </div>

        {/* Categorized Navigation Links Matching Admin */}
        <nav className="p-4 space-y-6">
          {NAV_SECTIONS.map((section, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.name || (item.name === 'Leave Management' && activeNav === 'Leave');
                  return (
                    <button
                      key={item.name}
                      onClick={() => { setActiveNav(item.name); setMobileOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-extrabold'
                          : 'text-slate-900 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-700'}`} />
                        <span>{item.name}</span>
                      </div>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Sticky Bottom Sign Out Matching Admin */}
      <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0">
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-900 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-slate-700 group-hover:text-rose-600" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full max-w-full overflow-hidden bg-slate-50 text-slate-800 flex font-sans">
      {/* Desktop Sidebar (White & Crisp) */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-white border-r border-slate-200 shadow-xs overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-white h-full overflow-y-auto flex flex-col z-10 border-r border-slate-200 shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div id="staff-content-scroll-container" className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Top Header Bar Matching Admin */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-3 flex-1 max-w-md mr-4">
            <button 
              onClick={() => setMobileOpen(true)} 
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Header Search Bar Matching Admin */}
            <div className="relative w-full hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search classes, timetable, notices..."
                className="w-full pl-10 pr-9 py-2 bg-slate-100 border border-transparent rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all shadow-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>

            {/* User Avatar & Role Badge Matching Admin */}
            <div 
              onClick={() => setActiveNav('My Profile')}
              className="flex items-center gap-2.5 cursor-pointer group"
              title="Faculty Profile"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs text-white ring-2 ring-blue-300 bg-gradient-to-tr from-blue-600 to-indigo-600">
                {staffUser?.profileImage ? (
                  <img src={staffUser.profileImage} alt={staffUser.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  staffUser?.avatarInitials || staffUser?.avatarText || staffUser?.name?.substring(0, 2)?.toUpperCase() || 'ST'
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                  {staffUser?.name || 'Faculty Member'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-700 border border-blue-200">
                    👨‍🏫 Faculty (Staff)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
          {renderPage()}
        </main>
      </div>

      {/* Logout Confirmation Modal Matching Admin */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowLogoutModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-sm text-center z-10 border border-slate-200 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Sign Out Confirmation</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Are you sure you want to exit your Staff session?
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md shadow-red-500/20 transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
