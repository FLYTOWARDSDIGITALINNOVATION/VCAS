import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, BookOpen, CheckSquare, Calendar, BookMarked,
  Bell, UserCheck, User, LogOut, Menu, X, GraduationCap, Clock,
  ChevronRight, Shield
} from 'lucide-react';
import StaffHome from './StaffHome';
import StaffMyClasses from './StaffMyClasses';
import StaffAttendance from './StaffAttendance';
import StaffTimetable from './StaffTimetable';
import StaffAssignments from './StaffAssignments';
import StaffNotices from './StaffNotices';
import StaffLeave from './StaffLeave';
import StaffProfile from './StaffProfile';

const NAV_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, section: 'MAIN' },
  { name: 'My Classes', icon: BookOpen, section: 'ACADEMIC' },
  { name: 'Attendance', icon: CheckSquare, section: 'ACADEMIC' },
  { name: 'Timetable', icon: Calendar, section: 'ACADEMIC' },
  { name: 'Assignments', icon: BookMarked, section: 'ACADEMIC' },
  { name: 'Notices', icon: Bell, section: 'COMMUNICATION' },
  { name: 'Leave', icon: UserCheck, section: 'HR' },
  { name: 'My Profile', icon: User, section: 'ACCOUNT' },
];

export default function StaffDashboard({ staffUser, onLogout }) {
  const [activeNav, setActiveNav] = useState(() => sessionStorage.getItem('vcas_staff_nav') || 'Dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    sessionStorage.setItem('vcas_staff_nav', activeNav);
  }, [activeNav]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.body.style.overflow = showLogoutModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showLogoutModal]);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const todayStr = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  const grouped = NAV_ITEMS.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const renderPage = () => {
    switch (activeNav) {
      case 'Dashboard':   return <StaffHome staffUser={staffUser} onNavigate={setActiveNav} />;
      case 'My Classes':  return <StaffMyClasses staffUser={staffUser} />;
      case 'Attendance':  return <StaffAttendance staffUser={staffUser} />;
      case 'Timetable':   return <StaffTimetable staffUser={staffUser} />;
      case 'Assignments': return <StaffAssignments staffUser={staffUser} />;
      case 'Notices':     return <StaffNotices staffUser={staffUser} />;
      case 'Leave':       return <StaffLeave staffUser={staffUser} />;
      case 'My Profile':  return <StaffProfile staffUser={staffUser} />;
      default:            return <StaffHome staffUser={staffUser} onNavigate={setActiveNav} />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="sticky top-0 z-20 bg-[#0f1e3c] border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-lg shadow-lg">🏛️</div>
          <div>
            <p className="text-white font-extrabold text-[11px] leading-tight">Vivekananda College</p>
            <p className="text-blue-300 text-[10px] font-medium leading-tight">Staff Portal</p>
          </div>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Staff Identity Card */}
      <div className="mx-4 my-4 p-4 rounded-2xl bg-white/5 border border-white/10">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${staffUser.avatarColor} flex items-center justify-center text-white font-bold text-base shadow-lg mb-3`}>
          {staffUser.avatarInitials}
        </div>
        <p className="text-white font-bold text-sm leading-tight">{staffUser.name}</p>
        <p className="text-blue-300 text-[11px] font-medium mt-0.5">{staffUser.designation}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
          <p className="text-slate-400 text-[10px]">{staffUser.department} · {staffUser.staffId}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5 scrollbar-thin">
        {Object.entries(grouped).map(([section, items]) => (
          <div key={section}>
            <p className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">{section}</p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => { setActiveNav(item.name); setMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    {item.name}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-[#0f1e3c] overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-[#0f1e3c] h-full overflow-hidden flex flex-col z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="shrink-0 bg-white border-b border-slate-100 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">{activeNav}</h2>
              <p className="text-[11px] text-slate-400 hidden sm:block">{todayStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-600">
                {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${staffUser.avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
                {staffUser.avatarInitials}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">{staffUser.name.split(' ').slice(0, 2).join(' ')}</p>
                <p className="text-[10px] text-slate-400">{staffUser.department}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {renderPage()}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center z-10">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg mb-1">Sign Out?</h3>
            <p className="text-slate-500 text-sm mb-5">You will be redirected to the login page.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={onLogout} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-bold text-white shadow-md transition-all">Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
