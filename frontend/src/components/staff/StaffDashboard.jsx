import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, BookOpen, CheckSquare, Calendar, BookMarked,
  Bell, UserCheck, User, LogOut, Menu, X, GraduationCap,
  ChevronRight, ChevronLeft, Shield, FileSpreadsheet, ClipboardList, Ticket, Award, UserPlus,
  Search, Clock, Sparkles, Building2, IndianRupee, Receipt
} from 'lucide-react';
import FeeStructureView from '../FeeStructureView';
import ExpenseManagement from '../ExpenseManagement';
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
import StaffTaskAllocation from './StaffTaskAllocation';
import StaffCoursePlan from './StaffCoursePlan';
import BonafideManagement from '../BonafideManagement';
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
      { name: 'Hall Allocation & Tickets', icon: Ticket },
      { name: 'Assignments', icon: BookMarked },
      { name: 'Question Papers', icon: ClipboardList },
      { name: 'Task Allocation', icon: CheckSquare }
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('vcas_sidebar_collapsed') === 'true';
  });
  const [hoveredTooltip, setHoveredTooltip] = useState(null);
  const activeTooltipRef = useRef(null);

  const showTooltipFor = (name, targetElement, allowInExpanded = false) => {
    if ((!sidebarCollapsed && !allowInExpanded) || !targetElement) {
      setHoveredTooltip(null);
      return;
    }
    const button = targetElement.tagName === 'BUTTON' 
      ? targetElement 
      : (targetElement.querySelector('button') || targetElement);
    
    const rect = button.getBoundingClientRect();
    if (rect.bottom < 30 || rect.top > window.innerHeight - 30) {
      setHoveredTooltip(null);
      return;
    }

    activeTooltipRef.current = { name, button, allowInExpanded };
    setHoveredTooltip({
      name,
      top: rect.top + rect.height / 2,
      left: Math.max(rect.right + 12, 88)
    });
  };

  const hideTooltip = () => {
    activeTooltipRef.current = null;
    setHoveredTooltip(null);
  };

  useEffect(() => {
    const handleScroll = () => {
      // During active scroll, immediately hide tooltip so scrolling stays 100% fluid and never drops frames
      activeTooltipRef.current = null;
      setHoveredTooltip(null);
    };

    const handleResize = () => {
      activeTooltipRef.current = null;
      setHoveredTooltip(null);
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('vcas_sidebar_collapsed', sidebarCollapsed ? 'true' : 'false');
  }, [sidebarCollapsed]);

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
      case 'Hall Allocation & Tickets':
      case 'Hall Tickets & Allocation':
      case 'Hall Allocation Setup':
      case 'Hall Allocation':
      case 'Exam Schedule':
      case 'Hall Tickets':         return <StaffHallTicket staffUser={staffUser} onNavigate={setActiveNav} />;
      case 'Assignments':          return <StaffAssignments staffUser={staffUser} />;
      case 'Question Papers':      return <StaffQuestionPaper staffUser={staffUser} />;
      case 'Course Plan':          return <StaffCoursePlan staffUser={staffUser} />;
      case 'Task Allocation':
      case 'Staff Tasks':          return <StaffTaskAllocation staffUser={staffUser} />;
      case 'Fee Structure':
      case 'Fees':                 return <FeeStructureView user={staffUser} />;
      case 'Expenses':
      case 'Expense':              return <ExpenseManagement user={staffUser} />;
      case 'Student Attendance':   return <StaffAttendance staffUser={staffUser} isReadOnly={true} />;
      case 'Bonafide Certificate':
      case 'Bonafide':             return <BonafideManagement user={staffUser} />;
      case 'My Profile':           return <StaffProfile staffUser={staffUser} />;
      case 'Notices':              return <StaffNotices staffUser={staffUser} />;
      case 'Leave Management':
      case 'Leave':                return <StaffLeave staffUser={staffUser} />;
      default:                     return <StaffHome staffUser={staffUser} onNavigate={setActiveNav} />;
    }
  };

  const isFinanceStaff = staffUser?.role === 'Accountant' || 
    staffUser?.role === 'Office Staff' || 
    staffUser?.designation === 'Accountant' || 
    staffUser?.canViewFees === true || 
    staffUser?.department?.toLowerCase()?.includes('account');

  // Office Staff gets a restricted sidebar (fees + attendance only, no academic menus)
  const isOfficeStaff = staffUser?.role === 'Office Staff';
  // Accountant-specific (has bonafide too)
  const isAccountantOnly = staffUser?.role === 'Accountant' || staffUser?.designation === 'Accountant';

  const isHodUser = staffUser?.isHod === true || 
    staffUser?.role === 'HOD' || 
    staffUser?.designation?.toUpperCase()?.includes('HOD') ||
    staffUser?.canAllocateTasks === true;

  // Build dynamic academic section based on role - exact order requested:
  // timetable, course plan, assignment, question paper, internal mark, hall allocation, hall ticket
  const academicItems = [
    { name: 'Timetable', icon: Calendar },
    { name: 'Course Plan', icon: FileSpreadsheet },
    { name: 'Assignments', icon: BookMarked },
    { name: 'Question Papers', icon: ClipboardList },
    { name: 'Internal Marks', icon: FileSpreadsheet },
    { name: 'Hall Allocation & Tickets', icon: Ticket },
    { name: 'Attendance', icon: CheckSquare },
    { name: 'My Classes', icon: BookOpen },
    { name: 'Student', icon: GraduationCap },
    ...(isHodUser ? [{ name: 'Task Allocation', icon: CheckSquare }] : [])
  ];

  // Office Staff: Dashboard + restricted finance section + profile only
  const officeStaffNavSections = [
    { title: 'MAIN', items: [{ name: 'Dashboard', icon: LayoutDashboard }] },
    {
      title: 'SERVICES & EXPENSES',
      items: [
        { name: 'Fee Structure', icon: IndianRupee },
        { name: 'Expenses', icon: Receipt },
        { name: 'Student Attendance', icon: CheckSquare }
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

  // Accountant: Dashboard + Finance & Services (fees + expenses + attendance + bonafide) + profile only
  const accountantNavSections = [
    { title: 'MAIN', items: [{ name: 'Dashboard', icon: LayoutDashboard }] },
    {
      title: 'FINANCE & SERVICES',
      items: [
        { name: 'Fee Structure', icon: IndianRupee },
        { name: 'Expenses', icon: Receipt },
        { name: 'Student Attendance', icon: CheckSquare },
        { name: 'Bonafide Certificate', icon: Award }
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

  const navSections = isOfficeStaff
    ? officeStaffNavSections
    : isAccountantOnly
    ? accountantNavSections
    : [
    { title: 'MAIN', items: [{ name: 'Dashboard', icon: LayoutDashboard }] },
    { title: 'ACADEMIC', items: academicItems },
    ...(isFinanceStaff ? [{
      title: 'FINANCE & SERVICES',
      items: [
        { name: 'Fee Structure', icon: IndianRupee },
        { name: 'Expenses', icon: Receipt },
        { name: 'Student Attendance', icon: CheckSquare }
      ]
    }] : []),
    {
      title: 'PROFILE & LEAVE',
      items: [
        { name: 'My Profile', icon: User },
        { name: 'Leave Management', icon: UserCheck },
        { name: 'Notices', icon: Bell }
      ]
    }
  ];

  const SidebarContent = ({ isCollapsed = false }) => (
    <div className="flex flex-col justify-between h-full bg-white select-none min-h-0">
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 overscroll-contain">
        {/* Sticky Header Matching Admin */}
        <div className={`sticky top-0 z-20 bg-white border-b border-slate-100 ${isCollapsed ? 'py-3 px-2 flex flex-col items-center justify-center gap-2' : 'px-4 py-4 sm:px-5 sm:py-5 flex items-center justify-between'} shadow-2xs min-w-0 transition-all`}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <button
                onClick={() => setSidebarCollapsed(false)}
                onMouseEnter={(e) => showTooltipFor('Expand Sidebar', e.currentTarget)}
                onMouseMove={(e) => showTooltipFor('Expand Sidebar', e.currentTarget)}
                onMouseLeave={hideTooltip}
                className="cursor-pointer hover:scale-105 transition-transform p-1 rounded-xl hover:bg-slate-50"
                aria-label="Expand sidebar"
              >
                <CollegeLogo size="xs" showText={false} />
              </button>
              <button
                onClick={() => setSidebarCollapsed(false)}
                onMouseEnter={(e) => showTooltipFor('Expand Sidebar', e.currentTarget)}
                onMouseMove={(e) => showTooltipFor('Expand Sidebar', e.currentTarget)}
                onMouseLeave={hideTooltip}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center min-w-0 flex-1 overflow-hidden">
                <CollegeLogo size="md" showText={true} />
              </div>
              {/* Collapse button on Desktop */}
              <button 
                onClick={() => setSidebarCollapsed(true)}
                onMouseEnter={(e) => showTooltipFor('Collapse Sidebar', e.currentTarget, true)}
                onMouseMove={(e) => showTooltipFor('Collapse Sidebar', e.currentTarget, true)}
                onMouseLeave={hideTooltip}
                className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              {/* Close button on mobile */}
              <button 
                onClick={() => setMobileOpen(false)}
                className="lg:hidden p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Staff Quick Profile Card in Sidebar */}
        {isCollapsed ? (
          <div 
            className="w-full flex justify-center my-2 cursor-pointer"
            onMouseEnter={(e) => showTooltipFor(staffUser?.name || 'Faculty Member', e.currentTarget)}
            onMouseMove={(e) => showTooltipFor(staffUser?.name || 'Faculty Member', e.currentTarget)}
            onMouseLeave={hideTooltip}
          >
            <div 
              onClick={() => { setActiveNav('My Profile'); setMobileOpen(false); }}
              className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 flex items-center justify-center cursor-pointer group shadow-2xs relative"
              aria-label="View Faculty Profile"
            >
              <div className={`w-7 h-7 rounded-lg overflow-hidden ${!staffUser?.profileImage ? `bg-gradient-to-br ${staffUser?.avatarColor || 'from-blue-600 to-indigo-600'}` : 'bg-slate-100'} flex items-center justify-center text-white font-black text-[11px] shadow-xs shrink-0 group-hover:scale-105 transition-transform pointer-events-none`}>
                {staffUser?.profileImage ? (
                  <img src={staffUser.profileImage} alt={staffUser?.name || 'Staff'} className="w-full h-full object-cover" />
                ) : (
                  staffUser?.avatarInitials || staffUser?.avatarText || staffUser?.name?.substring(0, 2)?.toUpperCase() || 'ST'
                )}
              </div>
            </div>
          </div>
        ) : (
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
        )}

        {/* Categorized Navigation Links Matching Admin */}
        <nav className={`${isCollapsed ? 'py-3 px-2 space-y-1' : 'p-4 space-y-6'}`}>
          {navSections.map((section, idx) => (
            <div key={idx} className={isCollapsed ? 'space-y-1' : ''}>
              {!isCollapsed && (
                <h3 className="px-3 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.name || (item.name === 'Leave Management' && activeNav === 'Leave');
                  
                  if (isCollapsed) {
                    return (
                      <div 
                        key={item.name} 
                        className="w-full flex justify-center py-1 cursor-pointer"
                        onMouseEnter={(e) => showTooltipFor(item.name, e.currentTarget)}
                        onMouseMove={(e) => showTooltipFor(item.name, e.currentTarget)}
                        onMouseLeave={hideTooltip}
                      >
                        <button
                          onClick={() => { setActiveNav(item.name); setMobileOpen(false); }}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 font-extrabold shadow-xs border border-blue-200/80'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 border border-transparent'
                          }`}
                          aria-label={item.name}
                        >
                          <Icon className={`w-5 h-5 shrink-0 stroke-[2] pointer-events-none ${isActive ? 'text-blue-700' : 'text-slate-700'}`} />
                        </button>
                      </div>
                    );
                  }

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

      {/* Mobile Drawer Logout Only */}
      <div className="lg:hidden p-4 border-t border-slate-100 bg-white">
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
      <aside className={`hidden lg:flex flex-col ${sidebarCollapsed ? 'w-20' : 'w-72'} shrink-0 bg-white border-r border-slate-200 shadow-xs overflow-hidden transition-[width] duration-300 ease-in-out`}>
        <SidebarContent isCollapsed={sidebarCollapsed} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-white h-full overflow-hidden flex flex-col z-10 border-r border-slate-200 shadow-2xl">
            <SidebarContent isCollapsed={false} />
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

          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>

            {/* Header Logout Button matching Image 2 */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-rose-50/90 hover:bg-rose-100 text-rose-600 font-bold text-xs sm:text-sm rounded-2xl border border-rose-200/90 transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-rose-600 stroke-[2.3]" />
              <span className="font-bold">Logout</span>
            </button>

            {/* User Avatar & Role Badge (Pill Container matching Image 2) */}
            <div 
              onClick={() => setActiveNav('My Profile')}
              className="flex items-center gap-2.5 bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/80 rounded-2xl p-1 sm:p-1.5 sm:pr-3.5 cursor-pointer transition-all shadow-2xs group"
              title="Faculty Profile"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                {staffUser?.profileImage ? (
                  <img src={staffUser.profileImage} alt={staffUser.name} className="w-full h-full rounded-xl object-cover" />
                ) : (
                  staffUser?.avatarInitials || staffUser?.avatarText || staffUser?.name?.substring(0, 2)?.toUpperCase() || 'IB'
                )}
              </div>
              <div className="text-left hidden sm:block min-w-0">
                <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors truncate">
                  {staffUser?.name || 'Faculty Member'}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  EMPLOYEE
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
          {renderPage()}
        </main>
      </div>

      {/* Floating Tooltip for Sidebar Icons */}
      {hoveredTooltip && (
        <div
          className="fixed z-[9999] pointer-events-none px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-2xl transition-opacity duration-150 whitespace-nowrap flex items-center select-none"
          style={{
            top: `${hoveredTooltip.top}px`,
            left: `${hoveredTooltip.left}px`,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-slate-900" />
          <span>{hoveredTooltip.name}</span>
        </div>
      )}

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
