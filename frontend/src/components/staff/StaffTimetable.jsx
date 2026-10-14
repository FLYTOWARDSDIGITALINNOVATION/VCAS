import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE, BACKEND_URL } from '../../apiConfig';
import {
  Calendar as CalendarIcon, Clock, Building2, BookOpen,
  ChevronRight, Info, CalendarDays, Plus, Edit2, Trash2,
  X, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';

// API_BASE imported from apiConfig

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SLOT_TIMES = [
  { slot: 1, time: '8:30 – 9:20 AM' },
  { slot: 2, time: '9:20 – 10:10 AM' },
  { slot: 3, time: '10:10 – 11:00 AM' },
  { slot: 'B', time: '11:00 – 11:15 AM', isBreak: true, label: 'Break' },
  { slot: 4, time: '11:15 AM – 12:05 PM' },
  { slot: 5, time: '12:05 – 12:55 PM' },
  { slot: 'L', time: '12:55 – 1:45 PM', isBreak: true, label: 'Lunch' },
  { slot: 6, time: '1:45 – 2:35 PM' },
  { slot: 7, time: '2:35 – 3:25 PM' },
  { slot: 8, time: '3:25 – 4:15 PM' },
];

const COLOR_MAP = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200/70',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/70',
  purple: 'bg-purple-50 text-purple-700 border-purple-200/70',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
  amber: 'bg-amber-50 text-amber-700 border-amber-200/70',
  rose: 'bg-rose-50 text-rose-700 border-rose-200/70',
};

const BADGE_COLOR_MAP = {
  blue: 'bg-blue-600',
  indigo: 'bg-indigo-600',
  purple: 'bg-purple-600',
  emerald: 'bg-emerald-600',
  amber: 'bg-amber-600',
  rose: 'bg-rose-600',
};

export default function StaffTimetable({ staffUser }) {
  const currentDayName = DAYS[new Date().getDay() - 1] || 'Monday';
  const [selectedDay, setSelectedDay] = useState(currentDayName);

  // Sync period timings with admin custom timings if configured
  const slotTimes = useMemo(() => {
    try {
      const saved = localStorage.getItem('vcas_faculty_period_timings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const map = {};
          parsed.forEach(p => { map[p.slot] = p.time; });
          return SLOT_TIMES.map(s => {
            if (map[s.slot]) {
              return { ...s, time: map[s.slot] };
            }
            return s;
          });
        }
      }
    } catch {
      // fallback to defaults
    }
    return SLOT_TIMES;
  }, []);

  // Timetable schedule & classes from database
  const [schedule, setSchedule] = useState({});
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit / Assign Slot Modal State
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isSavingSlot, setIsSavingSlot] = useState(false);
  const [slotModalError, setSlotModalError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const [slotForm, setSlotForm] = useState({
    day: 'Monday',
    slot: 1,
    code: '',
    name: '',
    room: '',
    type: 'theory',
    color: 'blue'
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Fetch timetable and classes from backend API
  const fetchData = async () => {
    if (!staffUser?.staffId) return;
    try {
      setLoading(true);
      const [tRes, cRes] = await Promise.all([
        fetch(`${API_BASE}/timetable/staff/${staffUser.staffId}`),
        fetch(`${API_BASE}/classes/staff/${staffUser.staffId}`)
      ]);

      const tData = await tRes.json();
      const cData = await cRes.json();

      if (tData.success && tData.schedule) {
        setSchedule(tData.schedule);
      }
      if (cData.success && Array.isArray(cData.classes)) {
        setClasses(cData.classes);
      }
    } catch (err) {
      console.error('Error fetching timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [staffUser?.staffId]);

  // Open modal to assign or edit a specific day & slot
  const handleOpenSlotModal = (day, slot) => {
    setSlotModalError('');
    const existing = schedule[day]?.[String(slot)] || null;

    if (existing) {
      setSlotForm({
        day,
        slot: Number(slot),
        code: existing.code || '',
        name: existing.name || '',
        room: existing.room || '',
        type: (existing.type || 'theory').toLowerCase(),
        color: (existing.color || 'blue').toLowerCase()
      });
    } else {
      // Default to first class if available
      const firstClass = classes[0] || null;
      setSlotForm({
        day,
        slot: Number(slot),
        code: firstClass ? firstClass.code : '',
        name: firstClass ? firstClass.name : '',
        room: firstClass ? (firstClass.room || 'LH-101') : 'LH-101',
        type: 'theory',
        color: 'blue'
      });
    }
    setIsSlotModalOpen(true);
  };

  // When user picks a class from dropdown, auto-fill code, name, room
  const handleSelectClass = (classCode) => {
    const selected = classes.find(c => c.code === classCode);
    if (selected) {
      setSlotForm(prev => ({
        ...prev,
        code: selected.code,
        name: selected.name,
        room: selected.room || prev.room || 'LH-101'
      }));
    } else {
      setSlotForm(prev => ({ ...prev, code: classCode }));
    }
  };

  // Save slot to database
  const handleSaveSlot = async (e) => {
    e.preventDefault();
    setSlotModalError('');

    if (!slotForm.code.trim() || !slotForm.name.trim()) {
      setSlotModalError('Subject Code and Subject Name are required.');
      return;
    }

    try {
      setIsSavingSlot(true);
      const payload = {
        day: slotForm.day,
        slot: Number(slotForm.slot),
        slotData: {
          code: slotForm.code.trim().toUpperCase(),
          name: slotForm.name.trim(),
          room: (slotForm.room || '').trim(),
          type: slotForm.type,
          color: slotForm.color
        }
      };

      const res = await fetch(`${API_BASE}/timetable/staff/${staffUser.staffId}/slot`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setSlotModalError(data.message || 'Failed to save timetable slot.');
        return;
      }

      showToast(`Assigned ${payload.slotData.code} to Period ${slotForm.slot} on ${slotForm.day}!`);
      setIsSlotModalOpen(false);
      if (data.schedule) setSchedule(data.schedule);
      fetchData();
    } catch (err) {
      setSlotModalError('Network error: ' + err.message);
    } finally {
      setIsSavingSlot(false);
    }
  };

  // Clear a slot
  const handleClearSlot = async (day, slot) => {
    if (!window.confirm(`Clear Period ${slot} on ${day}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/timetable/staff/${staffUser.staffId}/slot/${day}/${slot}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Period ${slot} on ${day} cleared.`);
        setIsSlotModalOpen(false);
        if (data.schedule) setSchedule(data.schedule);
        fetchData();
      } else {
        alert(data.message || 'Failed to clear slot.');
      }
    } catch (err) {
      alert('Error clearing slot: ' + err.message);
    }
  };

  // Calculate lecture and lab counts dynamically from schedule
  const { weeklyLectures, weeklyLabs, totalAssignedSlots, dayHoursMap } = useMemo(() => {
    let lectures = 0;
    let labs = 0;
    let total = 0;
    const hoursMap = {};

    DAYS.forEach(d => {
      hoursMap[d] = 0;
      const daySlots = schedule[d] || {};
      Object.values(daySlots).forEach(val => {
        if (val && val.code) {
          total++;
          hoursMap[d]++;
          if ((val.type || '').toLowerCase() === 'lab') labs++;
          else lectures++;
        }
      });
    });

    return { 
      weeklyLectures: lectures, 
      weeklyLabs: labs, 
      totalAssignedSlots: total,
      dayHoursMap: hoursMap 
    };
  }, [schedule]);

  const dailyHoursForSelectedDay = dayHoursMap[selectedDay] || 0;
  const todayHours = dayHoursMap[currentDayName] || 0;

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-6xl mx-auto">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Personal Faculty Timetable</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Weekly academic schedule and classroom assignments for {staffUser.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleOpenSlotModal(selectedDay, 1)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Assign Timetable Slot
          </button>
        </div>
      </div>

      {/* Metric badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Daily Hours Taken Card */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-indigo-100/80 shadow-xs p-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Daily Hours Taken
            </span>
            <p className="text-2xl font-black text-indigo-600">
              {dailyHoursForSelectedDay} {dailyHoursForSelectedDay === 1 ? 'Hour' : 'Hours'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {selectedDay} • {dailyHoursForSelectedDay} of 8 Periods
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Theory Sessions */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-xs p-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Theory Classes
            </span>
            <p className="text-2xl font-black text-blue-600">{weeklyLectures} Hours</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Theory Sessions / wk</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Lab Sessions */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-xs p-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Lab Practical
            </span>
            <p className="text-2xl font-black text-emerald-600">{weeklyLabs} Hours</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Lab Sessions / wk</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>

        {/* Total Weekly Hours */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-xs p-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Weekly Teaching Load
            </span>
            <p className="text-2xl font-black text-purple-600">{totalAssignedSlots} Hours</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Total Teaching Hours / wk</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Day Selector Pills */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-200/60 rounded-2xl">
        {DAYS.map(day => {
          const isSelected = selectedDay === day;
          const isToday = currentDayName === day;
          const dayHours = dayHoursMap[day] || 0;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 min-w-[105px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                isSelected
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span>{day}</span>
                {isToday && (
                  <span className="text-[8.5px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full font-black uppercase tracking-wide">
                    Today
                  </span>
                )}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                isSelected ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-500'
              }`}>
                {dayHours} {dayHours === 1 ? 'Hour Taken' : 'Hours Taken'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid: Selected Day Detail View + Full Week Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selected Day Timeline */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {selectedDay}'s Classes
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Daily Hours Taken: <span className="font-bold text-indigo-600">{dailyHoursForSelectedDay} Hours</span> ({dailyHoursForSelectedDay} of 8 periods)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 text-xs font-black bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
                {dailyHoursForSelectedDay} {dailyHoursForSelectedDay === 1 ? 'Hr Taken' : 'Hrs Taken'}
              </span>
              {selectedDay === currentDayName && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-600 rounded-full">
                  Active Day
                </span>
              )}
            </div>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[520px]">
            {slotTimes.map((slotItem, idx) => {
              if (slotItem.isBreak) {
                return (
                  <div key={idx} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 text-xs font-medium">
                    <span className="text-[10px] font-bold uppercase">{slotItem.label}</span>
                    <span className="text-[10px]">({slotItem.time})</span>
                  </div>
                );
              }

              const cls = schedule[selectedDay]?.[String(slotItem.slot)];

              if (!cls) {
                return (
                  <div
                    key={idx}
                    onClick={() => handleOpenSlotModal(selectedDay, slotItem.slot)}
                    className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs hover:border-blue-400 hover:bg-blue-50/20 cursor-pointer transition-colors group"
                  >
                    <span className="font-semibold text-slate-500">Period {slotItem.slot}</span>
                    <span className="text-[11px]">{slotItem.time}</span>
                    <span className="text-[11px] text-blue-600 opacity-0 group-hover:opacity-100 font-bold flex items-center gap-0.5">
                      <Plus className="w-3 h-3" /> Assign
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  onClick={() => handleOpenSlotModal(selectedDay, slotItem.slot)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${COLOR_MAP[cls.color] || 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-white/80 border border-black/5">
                        {cls.code}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                        Period {slotItem.slot}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-white/60">
                      {cls.type || 'theory'}
                    </span>
                  </div>

                  <p className="font-bold text-xs mt-1.5 line-clamp-1">{cls.name}</p>

                  <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between text-[11px] opacity-85 font-medium">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {cls.room || 'LH-101'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {slotItem.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Full Week Matrix Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Weekly Timetable Matrix</h3>
              <p className="text-[11px] text-slate-500">Click on any period cell to assign or edit the subject</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
                Weekly Total: {totalAssignedSlots} Hours
              </span>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="p-3 text-left w-24">Day</th>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(slot => (
                    <th key={slot} className="p-2.5 text-center min-w-[85px]">
                      P{slot}
                    </th>
                  ))}
                  <th className="p-2.5 text-center min-w-[95px] bg-slate-100/80 border-l border-slate-200 text-slate-700">
                    Hours Taken
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DAYS.map(day => {
                  const isCurrent = day === currentDayName;
                  const dayCount = dayHoursMap[day] || 0;
                  return (
                    <tr
                      key={day}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isCurrent ? 'bg-blue-50/30 font-semibold' : ''
                      }`}
                    >
                      <td className="p-3 font-bold text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                          <span>{day.substring(0, 3)}</span>
                        </div>
                      </td>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(slot => {
                        const cell = schedule[day]?.[String(slot)];
                        if (!cell) {
                          return (
                            <td
                              key={slot}
                              onClick={() => handleOpenSlotModal(day, slot)}
                              className="p-2 text-center text-slate-300 hover:bg-blue-50/40 hover:text-blue-600 cursor-pointer transition-colors"
                              title={`Click to assign Period ${slot} on ${day}`}
                            >
                              +
                            </td>
                          );
                        }
                        return (
                          <td
                            key={slot}
                            onClick={() => handleOpenSlotModal(day, slot)}
                            className="p-1.5 text-center cursor-pointer"
                            title={`${cell.code} - ${cell.name} (${cell.room})`}
                          >
                            <div className={`p-1.5 rounded-lg border text-[11px] font-bold truncate transition-all hover:scale-[1.02] ${COLOR_MAP[cell.color] || 'bg-slate-50'}`}>
                              <div>{cell.code}</div>
                              <div className="text-[9px] opacity-75 font-normal truncate">{cell.room}</div>
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-2 text-center border-l border-slate-100 bg-slate-50/40">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                          dayCount > 0
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-slate-400 font-medium'
                        }`}>
                          {dayCount} {dayCount === 1 ? 'hr' : 'hrs'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/80 font-bold text-slate-700 text-[11px] border-t border-slate-200">
                  <td className="p-3 text-left">Weekly Total</td>
                  <td colSpan={8} className="p-3 text-right text-slate-500 font-medium">
                    Total Weekly Teaching Hours:
                  </td>
                  <td className="p-3 text-center text-blue-700 font-black border-l border-slate-200 bg-blue-50/50">
                    {totalAssignedSlots} hrs
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: ASSIGN / EDIT TIMETABLE SLOT */}
      {/* ============================================================ */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 sm:p-7 max-w-md w-full space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Assign Timetable Slot</h3>
                  <p className="text-xs text-slate-500">Configure lecture or lab for your weekly schedule</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSlotModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {slotModalError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{slotModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Day</label>
                  <select
                    value={slotForm.day}
                    onChange={(e) => setSlotForm({ ...slotForm, day: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    {DAYS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Period Slot</label>
                  <select
                    value={slotForm.slot}
                    onChange={(e) => setSlotForm({ ...slotForm, slot: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Period {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Class Quick Selection */}
              {classes.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select From Your Registered Classes
                  </label>
                  <select
                    value={slotForm.code}
                    onChange={(e) => handleSelectClass(e.target.value)}
                    className="w-full bg-blue-50/60 border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="">-- Choose Subject --</option>
                    {classes.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} – {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS401"
                    value={slotForm.code}
                    onChange={(e) => setSlotForm({ ...slotForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Classroom / Lab Venue
                    <span className="ml-1 text-[11px] font-normal text-slate-400">— Type venue</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 102, LH-1, Lab 2"
                    value={slotForm.room}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isLab = val.toLowerCase().includes('lab');
                      setSlotForm(prev => ({
                        ...prev,
                        room: val,
                        type: isLab ? 'lab' : (prev.type === 'lab' ? 'theory' : prev.type)
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Computing & Distributed Systems"
                  value={slotForm.name}
                  onChange={(e) => setSlotForm({ ...slotForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={slotForm.type}
                    onChange={(e) => setSlotForm({ ...slotForm, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="theory">Theory Session</option>
                    <option value="lab">Practical / Lab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Color Theme</label>
                  <select
                    value={slotForm.color}
                    onChange={(e) => setSlotForm({ ...slotForm, color: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="blue">Blue</option>
                    <option value="indigo">Indigo</option>
                    <option value="purple">Purple</option>
                    <option value="emerald">Emerald Green</option>
                    <option value="amber">Amber / Orange</option>
                    <option value="rose">Rose Red</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                {schedule[slotForm.day]?.[String(slotForm.slot)] && (
                  <button
                    type="button"
                    onClick={() => handleClearSlot(slotForm.day, slotForm.slot)}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear Slot
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingSlot}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
                >
                  {isSavingSlot ? 'Saving...' : 'Save to Timetable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
