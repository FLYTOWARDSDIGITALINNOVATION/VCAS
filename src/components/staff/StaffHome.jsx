import React, { useMemo } from 'react';
import {
  CheckSquare, BookMarked, BookOpen, Bell, UserCheck,
  ChevronRight, TrendingUp, Clock, AlertCircle, CalendarCheck2,
  Users, GraduationCap, Zap, Calendar
} from 'lucide-react';
import { SUBJECTS, TIMETABLE, ATTENDANCE_HISTORY, ASSIGNMENTS_DATA, NOTICES_DATA, LEAVE_DATA } from './staffData';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function StatCard({ label, value, sub, icon: Icon, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-3 p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all text-left group w-full`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900 leading-tight">{value}</p>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </button>
  );
}

export default function StaffHome({ staffUser, onNavigate }) {
  const today = DAYS[new Date().getDay()];
  const todaySlots = TIMETABLE[staffUser.staffId]?.[today] || {};

  const todayClasses = useMemo(() => {
    const slots = TIMETABLE[staffUser.staffId]?.[today] || {};
    const classes = [];
    const slotTimes = { 1: '8:30 AM', 2: '9:20 AM', 3: '10:10 AM', 4: '11:15 AM', 5: '12:05 PM', 6: '1:45 PM', 7: '2:35 PM', 8: '3:25 PM' };
    Object.entries(slots).forEach(([slot, cls]) => {
      if (cls) classes.push({ ...cls, slot: Number(slot), time: slotTimes[slot] });
    });
    return classes.sort((a, b) => a.slot - b.slot);
  }, [staffUser.staffId, today]);

  const mySubjects = staffUser.subjects.map(s => SUBJECTS[s]).filter(Boolean);
  const history = ATTENDANCE_HISTORY[staffUser.staffId] || [];
  const assignments = ASSIGNMENTS_DATA[staffUser.staffId] || [];
  const activeAssignments = assignments.filter(a => a.status === 'Active');
  const pendingLeave = (LEAVE_DATA[staffUser.staffId] || []).filter(l => l.status === 'Pending');

  const colorMap = {
    blue: 'bg-blue-500', indigo: 'bg-indigo-500', purple: 'bg-purple-500',
    emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500',
    teal: 'bg-teal-500',
  };

  const pillClass = (c) => ({
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  }[c] || 'bg-slate-50 text-slate-700 border-slate-100');

  return (
    <div className="p-5 sm:p-7 space-y-7 max-w-6xl mx-auto">
      {/* Greeting Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f1e3c] via-[#1a3a6b] to-[#1e4db7] p-6 text-white shadow-xl">
        <div className="absolute right-0 top-0 w-64 h-64 opacity-5 rotate-12 translate-x-16 -translate-y-16">
          <GraduationCap className="w-full h-full" />
        </div>
        <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-1">Welcome Back</p>
        <h1 className="text-2xl font-extrabold leading-tight">{staffUser.name}</h1>
        <p className="text-blue-200 text-sm mt-1">{staffUser.designation} · {staffUser.department}</p>
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-blue-300" />
            {today === 'Sunday' || today === 'Saturday' ? 'No classes today 🎉' : `${todayClasses.length} class${todayClasses.length !== 1 ? 'es' : ''} today`}
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-blue-300" />
            {mySubjects.length} subjects handled
          </div>
          {pendingLeave.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-500/20 rounded-xl px-3 py-1.5 text-xs font-semibold text-amber-200">
              <AlertCircle className="w-3.5 h-3.5" />
              {pendingLeave.length} leave pending approval
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Subjects Handled" value={mySubjects.length} sub="This semester" icon={BookOpen} color="bg-blue-500" onClick={() => onNavigate('My Classes')} />
        <StatCard label="Sessions Taken" value={history.length} sub="This month" icon={CalendarCheck2} color="bg-emerald-500" onClick={() => onNavigate('Attendance')} />
        <StatCard label="Active Assignments" value={activeAssignments.length} sub="Pending evaluation" icon={BookMarked} color="bg-purple-500" onClick={() => onNavigate('Assignments')} />
        <StatCard label="Leave Pending" value={pendingLeave.length} sub="Awaiting approval" icon={UserCheck} color="bg-amber-500" onClick={() => onNavigate('Leave')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">Today's Schedule</h3>
              <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">{today}</span>
            </div>
            <button onClick={() => onNavigate('Timetable')} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              Full Timetable <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-4 space-y-2">
            {todayClasses.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-slate-400">
                <CheckSquare className="w-10 h-10 mb-2 text-slate-200" />
                <p className="text-sm font-medium">No classes scheduled today</p>
              </div>
            ) : (
              todayClasses.map((cls, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${pillClass(cls.color)}`}>
                  <div className={`w-2 h-10 rounded-full shrink-0 ${colorMap[cls.color] || 'bg-slate-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold leading-tight truncate">{cls.name}</p>
                    <p className="text-[11px] opacity-70 font-medium">{cls.code} · {cls.room}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold">{cls.time}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${cls.type === 'lab' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {cls.type.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="font-extrabold text-slate-900 text-sm">Quick Actions</h3>
          </div>
          <div className="p-4 space-y-2">
            {[
              { label: 'Mark Attendance', icon: CheckSquare, color: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-100', nav: 'Attendance' },
              { label: 'New Assignment', icon: BookMarked, color: 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-100', nav: 'Assignments' },
              { label: 'View Timetable', icon: Calendar, color: 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-100', nav: 'Timetable' },
              { label: 'Apply Leave', icon: UserCheck, color: 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-100', nav: 'Leave' },
              { label: 'View Notices', icon: Bell, color: 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-100', nav: 'Notices' },
              { label: 'My Profile', icon: Users, color: 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-100', nav: 'My Profile' },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <button key={a.nav} onClick={() => onNavigate(a.nav)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${a.color}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {a.label}
                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Notices */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">Recent Notices</h3>
          </div>
          <button onClick={() => onNavigate('Notices')} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {NOTICES_DATA.slice(0, 3).map(n => (
            <div key={n.id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.urgent ? 'bg-red-500' : 'bg-slate-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{n.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{n.postedBy} · {n.date}</p>
                </div>
                {n.urgent && <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full border border-red-100 shrink-0">Urgent</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
