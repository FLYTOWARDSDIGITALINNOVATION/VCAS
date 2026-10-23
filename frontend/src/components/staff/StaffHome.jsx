import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE, BACKEND_URL } from '../../apiConfig';
import {
  CheckSquare, BookMarked, BookOpen, Bell, UserCheck,
  ChevronRight, TrendingUp, Clock, AlertCircle, CalendarCheck2,
  Users, GraduationCap, Zap, Calendar, FileSpreadsheet, Ticket,
  ClipboardList, RefreshCw, Sparkles, UserPlus, Building2, Receipt
} from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StaffHome({ staffUser, onNavigate }) {
  const today = DAYS[new Date().getDay()];
  const [dbClasses, setDbClasses] = useState([]);
  const [dbHistory, setDbHistory] = useState([]);
  const [dbTimetable, setDbTimetable] = useState({});
  const [dbNotices, setDbNotices] = useState([]);
  const [dbAssignments, setDbAssignments] = useState([]);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStaffData = () => {
    if (!staffUser?.staffId) return;
    setRefreshing(true);
    Promise.allSettled([
      fetch(`${API_BASE}/classes/staff/${staffUser.staffId}`).then(r => r.json()),
      fetch(`${API_BASE}/attendance/staff/${staffUser.staffId}`).then(r => r.json()),
      fetch(`${API_BASE}/timetable/staff/${staffUser.staffId}`).then(r => r.json()),
      fetch(`${API_BASE}/notices`).then(r => r.json()),
      fetch(`${API_BASE}/assignments/${staffUser.staffId}`).then(r => r.json()),
      fetch(`${API_BASE}/leave/staff/${staffUser.staffId}`).then(r => r.json())
    ]).then(([resClasses, resAtt, resTt, resNotices, resAssign, resLeave]) => {
      if (resClasses.status === 'fulfilled' && resClasses.value?.success) setDbClasses(resClasses.value.classes || []);
      if (resAtt.status === 'fulfilled' && resAtt.value?.success) setDbHistory(resAtt.value.sessions || []);
      if (resTt.status === 'fulfilled' && resTt.value?.success && resTt.value.schedule) setDbTimetable(resTt.value.schedule);
      if (resNotices.status === 'fulfilled' && resNotices.value?.success) setDbNotices(resNotices.value.notices || []);
      if (resAssign.status === 'fulfilled' && resAssign.value?.success) setDbAssignments(resAssign.value.assignments || []);
      if (resLeave.status === 'fulfilled' && resLeave.value?.success && resLeave.value.summary) {
        setPendingLeaveCount(resLeave.value.summary.pendingCount || 0);
      }
      setRefreshing(false);
    }).catch(() => {
      setRefreshing(false);
    });
  };

  useEffect(() => {
    fetchStaffData();
  }, [staffUser?.staffId]);

  const todayClasses = useMemo(() => {
    const slots = dbTimetable[today] || {};
    const classesList = [];
    const slotTimes = { 1: '8:30 AM', 2: '9:20 AM', 3: '10:10 AM', 4: '11:15 AM', 5: '12:05 PM', 6: '1:45 PM', 7: '2:35 PM', 8: '3:25 PM' };
    Object.entries(slots).forEach(([slot, cls]) => {
      if (cls && cls.code) {
        classesList.push({ ...cls, slot: Number(slot), time: slotTimes[slot] || `Period ${slot}` });
      }
    });
    return classesList.sort((a, b) => a.slot - b.slot);
  }, [dbTimetable, today]);

  const mySubjects = dbClasses;
  const history = dbHistory;
  const assignments = dbAssignments;
  const activeAssignments = assignments.filter(a => a.status === 'Active');

  const colorMap = {
    blue: 'bg-blue-500', indigo: 'bg-indigo-500', purple: 'bg-purple-500',
    emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500',
    teal: 'bg-teal-500',
  };

  const pillClass = (c) => ({
    blue: 'bg-blue-50/70 text-blue-700 border-blue-100',
    indigo: 'bg-indigo-50/70 text-indigo-700 border-indigo-100',
    purple: 'bg-purple-50/70 text-purple-700 border-purple-100',
    emerald: 'bg-emerald-50/70 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50/70 text-amber-700 border-amber-100',
    rose: 'bg-rose-50/70 text-rose-700 border-rose-100',
  }[c] || 'bg-slate-50 text-slate-700 border-slate-100');

  // 8 Metric Cards Matching Admin Exactly
  const metricCards = [
    {
      title: 'SUBJECTS HANDLED',
      value: String(mySubjects.length),
      change: 'Active this semester',
      isUp: true,
      icon: BookOpen,
      bg: 'bg-blue-500',
      navTarget: 'My Classes'
    },
    {
      title: 'SESSIONS TAKEN',
      value: String(history.length),
      change: 'Attendance recorded',
      isUp: true,
      icon: CalendarCheck2,
      bg: 'bg-emerald-500',
      navTarget: 'Attendance'
    },
    {
      title: 'ACTIVE ASSIGNMENTS',
      value: String(activeAssignments.length),
      change: `${assignments.length} total assignments`,
      isUp: true,
      icon: BookMarked,
      bg: 'bg-purple-500',
      navTarget: 'Assignments'
    },
    {
      title: 'LEAVE REQUESTS',
      value: String(pendingLeaveCount),
      change: pendingLeaveCount > 0 ? `${pendingLeaveCount} pending approval` : '0 pending review',
      isUp: pendingLeaveCount === 0,
      icon: UserCheck,
      bg: 'bg-amber-500',
      navTarget: 'Leave'
    },
    {
      title: "TODAY'S SCHEDULE",
      value: today === 'Sunday' || today === 'Saturday' ? 'Holiday' : `${todayClasses.length} Classes`,
      change: today,
      isUp: true,
      icon: Clock,
      bg: 'bg-teal-500',
      navTarget: 'Timetable'
    },
    {
      title: 'INTERNAL MARKS',
      value: 'Active',
      change: 'Continuous evaluation',
      isUp: true,
      icon: FileSpreadsheet,
      bg: 'bg-indigo-500',
      navTarget: 'Internal Marks'
    },
    {
      title: 'HALL TICKETS',
      value: 'Generated',
      change: 'University exams',
      isUp: true,
      icon: Ticket,
      bg: 'bg-rose-500',
      navTarget: 'Hall Tickets'
    },
    {
      title: 'NOTICES & CIRCULARS',
      value: String(dbNotices.length),
      change: `${dbNotices.length} published notice(s)`,
      isUp: true,
      icon: Bell,
      bg: 'bg-blue-600',
      navTarget: 'Notices'
    }
  ];

  const isFinanceStaff = staffUser?.role === 'Accountant' || 
    staffUser?.role === 'Office Staff' || 
    staffUser?.designation === 'Accountant' || 
    staffUser?.canViewFees === true || 
    staffUser?.department?.toLowerCase()?.includes('account');

  // Quick actions matching Admin quick actions grid
  const quickActions = isFinanceStaff ? [
    { label: 'Record Expense', icon: Receipt, bg: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700', navTarget: 'Expenses' },
    { label: 'Fee Structure', icon: Building2, bg: 'bg-amber-50 hover:bg-amber-100 text-amber-700', navTarget: 'Fee Structure' },
    { label: 'Student Attendance', icon: CheckSquare, bg: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700', navTarget: 'Student Attendance' },
    { label: 'Apply Leave', icon: UserCheck, bg: 'bg-teal-50 hover:bg-teal-100 text-teal-700', navTarget: 'Leave' },
    { label: 'Notices', icon: Bell, bg: 'bg-purple-50 hover:bg-purple-100 text-purple-700', navTarget: 'Notices' }
  ] : [
    { label: 'Mark Attendance', icon: CheckSquare, bg: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700', navTarget: 'Attendance' },
    { label: 'Student', icon: GraduationCap, bg: 'bg-blue-50 hover:bg-blue-100 text-blue-700', navTarget: 'Student' },
    { label: 'Hall Allocation & Tickets', icon: Ticket, bg: 'bg-rose-50 hover:bg-rose-100 text-rose-700', navTarget: 'Hall Allocation & Tickets' },
    { label: 'Internal Marks', icon: FileSpreadsheet, bg: 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700', navTarget: 'Internal Marks' },
    { label: 'New Assignment', icon: BookMarked, bg: 'bg-purple-50 hover:bg-purple-100 text-purple-700', navTarget: 'Assignments' },
    { label: 'View Timetable', icon: Calendar, bg: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700', navTarget: 'Timetable' },
    { label: 'Task Allocation', icon: CheckSquare, bg: 'bg-amber-50 hover:bg-amber-100 text-amber-700', navTarget: 'Task Allocation' },
    { label: 'Apply Leave', icon: UserCheck, bg: 'bg-teal-50 hover:bg-teal-100 text-teal-700', navTarget: 'Leave' }
  ];

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto animate-fadeIn">
      
      {/* Title Header Matching Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Staff Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Welcome back, {staffUser?.name || 'Faculty Member'}. Here is your live teaching schedule and institutional overview today.
          </p>
        </div>
      </div>

      {/* Light Banner Matching Super Admin banner style in Dashboard.jsx */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
            {isFinanceStaff ? '💰' : '👨‍🏫'}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-blue-900 flex items-center gap-2">
              {isFinanceStaff ? 'Finance & Administration Portal' : 'Faculty Academic Session Active'}
              <span className="text-[10px] bg-blue-200/80 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                {isFinanceStaff ? 'Accounts & Operations' : 'MSU Affiliated Faculty'}
              </span>
            </h3>
            <p className="text-[11px] text-blue-700 font-medium mt-0.5">
              {staffUser?.designation || 'Faculty'} • {staffUser?.department || 'Department'} • Staff ID: <span className="font-mono font-bold text-slate-900">{staffUser?.staffId || '—'}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isFinanceStaff ? (
            <>
              <button 
                onClick={() => onNavigate('Expenses')}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Expenses Module →
              </button>
              <button 
                onClick={() => onNavigate('Fee Structure')}
                className="px-3.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 shadow-xs transition-all cursor-pointer"
              >
                Fee Structure →
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => onNavigate('Hall Allocation & Tickets')}
                className="px-3.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 shadow-xs transition-all cursor-pointer"
              >
                Hall Allocation &amp; Tickets →
              </button>
              <button 
                onClick={() => onNavigate('Student')}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Student →
              </button>
            </>
          )}
        </div>
      </div>

      {/* 8 Metric Cards Grid Matching Admin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              onClick={() => card.navTarget && onNavigate(card.navTarget)}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex items-start justify-between cursor-pointer hover:border-blue-300"
            >
              <div>
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                  {card.title}
                </p>
                <p className="text-2xl font-extrabold text-slate-900 leading-none mb-2">
                  {card.value}
                </p>
                <p className={`text-xs font-semibold flex items-center gap-1 ${card.isUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {card.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
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

      {/* Quick Actions Grid Matching Admin */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Quick Faculty Actions
          </h3>
          <span className="text-xs font-medium text-slate-400">Instant Access</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => onNavigate(action.navTarget)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border border-transparent font-bold text-xs transition-all cursor-pointer ${action.bg}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-Column Layout: Schedule & Recent Notices Matching Admin */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Schedule Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">Today's Schedule</h3>
              <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                {today}
              </span>
            </div>
            <button 
              onClick={() => onNavigate('Timetable')} 
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              Full Timetable <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-4 space-y-2.5">
            {todayClasses.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-slate-400">
                <CheckSquare className="w-10 h-10 mb-2 text-slate-200" />
                <p className="text-sm font-semibold text-slate-600">No classes scheduled today</p>
                <p className="text-xs text-slate-400 mt-0.5">Enjoy your free time or prepare lesson plans</p>
              </div>
            ) : (
              todayClasses.map((cls, i) => (
                <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${pillClass(cls.color)}`}>
                  <div className={`w-2 h-10 rounded-full shrink-0 ${colorMap[cls.color] || 'bg-slate-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold leading-tight text-slate-900 truncate">{cls.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">{cls.code} · Room: {cls.room}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-900">{cls.time}</p>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5 ${cls.type === 'lab' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {cls.type.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Notices Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">Recent Notices</h3>
            </div>
            <button 
              onClick={() => onNavigate('Notices')} 
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {dbNotices.length === 0 ? (
              <div className="px-5 py-10 text-center text-xs text-slate-400 font-medium">
                No recent notices published.
              </div>
            ) : (
              dbNotices.slice(0, 4).map(n => (
                <div key={n._id || n.id} className="px-5 py-3.5 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.urgent ? 'bg-red-500' : 'bg-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 leading-tight truncate">{n.title}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{n.postedBy || n.author || 'Academic Cell'} · {n.date}</p>
                    </div>
                    {n.urgent && (
                      <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full border border-red-200 shrink-0">
                        Urgent
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

