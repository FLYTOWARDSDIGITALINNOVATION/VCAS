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
  { slot: 1, time: '09:30 – 10:30 AM' },
  { slot: 2, time: '10:30 – 11:30 AM' },
  { slot: 'B', time: '11:30 – 11:45 AM', isBreak: true, label: 'Break' },
  { slot: 3, time: '11:45 AM – 12:45 PM' },
  { slot: 'L', time: '12:45 – 01:30 PM', isBreak: true, label: 'Lunch' },
  { slot: 4, time: '01:30 – 02:30 PM' },
  { slot: 5, time: '02:30 – 03:30 PM' },
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

  // Derive real-time added venues from classes & localStorage
  const allVenues = useMemo(() => {
    const set = new Set();
    classes.forEach(c => {
      if (c.room && typeof c.room === 'string' && c.room.trim()) set.add(c.room.trim());
    });
    try {
      const custom = JSON.parse(localStorage.getItem('vcas_custom_venues') || '[]');
      if (Array.isArray(custom)) {
        custom.forEach(v => {
          if (v && typeof v === 'string' && v.trim()) set.add(v.trim());
        });
      }
    } catch (e) {}
    try {
      const halls = JSON.parse(localStorage.getItem('vcas_custom_exam_halls') || '[]');
      if (Array.isArray(halls)) {
        halls.forEach(h => {
          const name = typeof h === 'string' ? h : (h.name || h.room || h.hallName);
          if (name && typeof name === 'string' && name.trim()) set.add(name.trim());
        });
      }
    } catch (e) {}
    return Array.from(set);
  }, [classes]);

  // Edit / Assign Slot Modal State
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isSavingSlot, setIsSavingSlot] = useState(false);
  const [slotModalError, setSlotModalError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const [slotForm, setSlotForm] = useState({
    day: 'Monday',
    slot: 1,
    typedPeriods: '1, 2, 3',
    code: '',
    name: '',
    room: '',
    type: 'theory',
    color: 'blue',
    isContinuousLab: false,
    continuousHours: 3
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Check if current staff user is HOD or Admin
  const isHod = staffUser?.designation?.toUpperCase()?.includes('HOD') || 
                staffUser?.role?.toUpperCase()?.includes('HOD') || 
                staffUser?.role?.toUpperCase()?.includes('ADMIN') || 
                staffUser?.isHod === true ||
                staffUser?.canAllocateTasks === true;

  const currentStaffId = staffUser?.staffId || staffUser?.employeeId || '';
  const [selectedStaffId, setSelectedStaffId] = useState(currentStaffId);
  const [departmentStaffList, setDepartmentStaffList] = useState([]);

  // Fetch timetable and classes from backend API for selected staff
  const fetchData = async (targetId = selectedStaffId) => {
    const idToFetch = targetId || currentStaffId;
    if (!idToFetch) return;
    try {
      setLoading(true);
      const [tRes, cRes] = await Promise.all([
        fetch(`${API_BASE}/timetable/staff/${idToFetch}`),
        fetch(`${API_BASE}/classes/staff/${idToFetch}`)
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

  // Fetch all staff members from department so normal staff & HOD can view department timetables
  useEffect(() => {
    fetch(`${API_BASE}/api/staff`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.staff)) {
          const myDept = (staffUser?.department || '').trim().toLowerCase();
          const deptStaff = data.staff.filter(s => {
            const sDept = (s.department || '').trim().toLowerCase();
            return !myDept || sDept === myDept || sDept.includes(myDept) || myDept.includes(sDept);
          });
          setDepartmentStaffList(deptStaff.length > 0 ? deptStaff : data.staff);
        }
      })
      .catch(() => {});
  }, [staffUser?.department]);

  useEffect(() => {
    fetchData(selectedStaffId);
  }, [selectedStaffId]);

  // Open modal to assign or edit a specific day & slot (Only HOD has permission)
  const handleOpenSlotModal = (day, slot) => {
    if (!isHod) return; // Non-HOD staff can only view, not edit or add
    setSlotModalError('');
    const existing = schedule[day]?.[String(slot)] || null;

    if (existing) {
      // Find all periods on this day assigned to this same subject
      const matching = Object.keys(schedule[day] || {})
        .filter(k => schedule[day][k]?.code === existing.code)
        .map(Number)
        .sort((a, b) => a - b);

      const periodStr = matching.length > 0 ? matching.join(', ') : String(slot);

      setSlotForm({
        day,
        slot: Number(slot),
        typedPeriods: periodStr,
        code: existing.code || '',
        name: existing.name || '',
        room: existing.room || '',
        type: (existing.type || 'theory').toLowerCase(),
        color: (existing.color || (existing.type === 'lab' ? 'emerald' : 'blue')).toLowerCase(),
        isContinuousLab: Boolean(existing.isContinuousLab || existing.type === 'lab'),
        continuousHours: matching.length > 0 ? matching.length : (Number(existing.labHours) || 3)
      });
    } else {
      // Default to first class if available
      const firstClass = classes[0] || null;
      const isLab = Boolean(firstClass && (firstClass.labHours > 0 || firstClass.type === 'lab' || firstClass.name?.toLowerCase().includes('lab')));
      setSlotForm({
        day,
        slot: Number(slot),
        typedPeriods: '1, 2, 3',
        code: firstClass ? firstClass.code : '',
        name: firstClass ? firstClass.name : '',
        room: firstClass?.room || (isLab ? 'Computer Lab 1' : (allVenues[0] || '')),
        type: isLab ? 'lab' : 'theory',
        color: isLab ? 'emerald' : 'blue',
        isContinuousLab: isLab,
        continuousHours: firstClass?.labHours || 3
      });
    }
    setIsSlotModalOpen(true);
  };

  // When user picks a class from dropdown, auto-fill code, name, room, and continuous lab hours
  const handleSelectClass = (classCode) => {
    const selected = classes.find(c => c.code === classCode);
    if (selected) {
      const isLab = Boolean(selected.labHours > 0 || selected.type === 'lab' || selected.name?.toLowerCase().includes('lab'));
      const hrs = Number(selected.theoryHours || selected.labHours) || 3;
      const defaultSlots = [];
      for (let i = 1; i <= Math.min(8, hrs); i++) defaultSlots.push(i);

      setSlotForm(prev => ({
        ...prev,
        code: selected.code,
        name: selected.name,
        room: selected.room || prev.room || (isLab ? 'Computer Lab 1' : (allVenues[0] || '')),
        type: isLab ? 'lab' : prev.type,
        color: isLab ? 'emerald' : prev.color,
        isContinuousLab: isLab ? true : prev.isContinuousLab,
        continuousHours: hrs,
        typedPeriods: defaultSlots.join(', ')
      }));
    } else {
      setSlotForm(prev => ({ ...prev, code: classCode }));
    }
  };

  // Real-time conflict check for Period Already Allocated
  const staffPeriodConflict = useMemo(() => {
    if (!isSlotModalOpen) return null;
    const currentAssigned = schedule[slotForm.day]?.[String(slotForm.slot)];
    if (currentAssigned && currentAssigned.code && currentAssigned.code.toUpperCase() !== (slotForm.code || '').trim().toUpperCase()) {
      return {
        code: currentAssigned.code,
        name: currentAssigned.name,
        room: currentAssigned.room
      };
    }
    return null;
  }, [isSlotModalOpen, schedule, slotForm.day, slotForm.slot, slotForm.code]);

  // Save slot to database
  const handleSaveSlot = async (e) => {
    e.preventDefault();
    setSlotModalError('');

    if (!slotForm.name.trim()) {
      setSlotModalError('Subject Name is required.');
      return;
    }

    if (staffPeriodConflict) {
      const proceed = window.confirm(`⚠️ Period Already Allocated Warning:\n\nPeriod ${slotForm.slot} on ${slotForm.day} is already allocated to ${staffPeriodConflict.code} (${staffPeriodConflict.name}) in ${staffPeriodConflict.room || 'Room'}.\n\nDo you want to re-allocate this period to ${slotForm.code.trim().toUpperCase()}?`);
      if (!proceed) return;
    }

    try {
      setIsSavingSlot(true);
      const isLabContinuous = Boolean(slotForm.type === 'lab' && slotForm.isContinuousLab);

      // Parse continuous periods from typedPeriods string (e.g. "1, 2, 3" or "1-3" or "1,2,3")
      let parsedPeriods = [];
      if (slotForm.typedPeriods && slotForm.typedPeriods.trim()) {
        const parts = slotForm.typedPeriods.split(/[,\s]+/);
        parts.forEach(part => {
          if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end)) {
              for (let p = Math.min(start, end); p <= Math.max(start, end); p++) {
                if (p >= 1 && p <= 8) parsedPeriods.push(p);
              }
            }
          } else {
            const p = Number(part);
            if (!isNaN(p) && p >= 1 && p <= 8) parsedPeriods.push(p);
          }
        });
      }

      if (parsedPeriods.length === 0) {
        parsedPeriods = [Number(slotForm.slot) || 1];
      }

      // Deduplicate and sort periods
      parsedPeriods = Array.from(new Set(parsedPeriods)).sort((a, b) => a - b);

      const payload = {
        day: slotForm.day,
        slot: parsedPeriods[0] || Number(slotForm.slot) || 1,
        slotData: {
          code: slotForm.code.trim().toUpperCase(),
          name: slotForm.name.trim(),
          room: (slotForm.room || '').trim(),
          type: slotForm.type,
          color: slotForm.type === 'lab' ? 'emerald' : slotForm.color,
          isContinuousLab: isLabContinuous,
          labHours: parsedPeriods.length,
          continuousSlots: parsedPeriods,
          periods: parsedPeriods,
          clearOtherDays: true
        }
      };

      const targetStaffId = selectedStaffId || staffUser.staffId;
      const res = await fetch(`${API_BASE}/timetable/staff/${targetStaffId}/slot`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setSlotModalError(data.message || 'Failed to save timetable slot.');
        return;
      }

      if (payload.slotData.room) {
        try {
          const custom = JSON.parse(localStorage.getItem('vcas_custom_venues') || '[]');
          if (!custom.includes(payload.slotData.room)) {
            custom.push(payload.slotData.room);
            localStorage.setItem('vcas_custom_venues', JSON.stringify(custom));
          }
        } catch (_) {}
      }

      const slotMsg = continuousSlots.length > 1
        ? `Assigned ${payload.slotData.code} to Continuous Lab Periods ${continuousSlots.join(', ')} on ${slotForm.day} (${continuousSlots.length} Continuous Hours)!`
        : `Assigned ${payload.slotData.code} to Period ${slotForm.slot} on ${slotForm.day}!`;

      showToast(slotMsg);
      setIsSlotModalOpen(false);
      if (data.schedule) setSchedule(data.schedule);
      fetchData(targetStaffId);
    } catch (err) {
      setSlotModalError('Network error: ' + err.message);
    } finally {
      setIsSavingSlot(false);
    }
  };

  // Clear a slot (Only HOD has permission)
  const handleClearSlot = async (day, slot) => {
    if (!isHod) return;
    if (!window.confirm(`Clear Period ${slot} on ${day}?`)) return;

    try {
      const targetStaffId = selectedStaffId || staffUser.staffId;
      const res = await fetch(`${API_BASE}/timetable/staff/${targetStaffId}/slot/${day}/${slot}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Period ${slot} on ${day} cleared.`);
        setIsSlotModalOpen(false);
        if (data.schedule) setSchedule(data.schedule);
        fetchData(targetStaffId);
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

      {/* Department Faculty Timetable Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
              Department Faculty Timetable Viewer
            </h3>
            <p className="text-[11px] text-slate-500">
              Department: <span className="font-bold text-slate-700">{staffUser?.department || 'College'}</span> • Viewing:{' '}
              <span className="font-bold text-indigo-600">
                {selectedStaffId === currentStaffId
                  ? `${staffUser?.name || 'My Timetable'} (You)`
                  : (departmentStaffList.find(s => (s.staffId || s.employeeId) === selectedStaffId)?.name || selectedStaffId)
                }
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600 whitespace-nowrap">View Faculty:</label>
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value={currentStaffId}>👤 My Timetable ({staffUser?.name || 'Me'})</option>
            {departmentStaffList
              .filter(s => (s.staffId || s.employeeId) && (s.staffId || s.employeeId) !== currentStaffId)
              .map(s => (
                <option key={s.staffId || s._id} value={s.staffId || s.employeeId}>
                  👤 {s.name} ({s.designation || 'Faculty'} - {s.staffId || s.employeeId})
                </option>
              ))
            }
          </select>
        </div>
      </div>

      {/* Permission banner */}
      {!isHod ? (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-medium">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            🔒 <strong>View-Only Mode:</strong> Timetables are scheduled &amp; managed exclusively by the Head of Department (HOD). You can view the timetable of any faculty member in your department.
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs font-medium">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              ⭐ <strong>HOD Timetable Management:</strong> You have full rights to allocate, edit continuous lab periods, and manage timetable slots for all faculty in your department.
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200/60 text-purple-800">
            HOD Access
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {selectedStaffId === currentStaffId ? 'Personal Faculty Timetable' : `Faculty Timetable: ${departmentStaffList.find(s => (s.staffId || s.employeeId) === selectedStaffId)?.name || selectedStaffId}`}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Weekly academic schedule and classroom assignments
          </p>
        </div>

        {isHod && (
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
        )}
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
                    onClick={() => isHod && handleOpenSlotModal(selectedDay, slotItem.slot)}
                    className={`flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs transition-colors ${
                      isHod ? 'hover:border-blue-400 hover:bg-blue-50/20 cursor-pointer group' : 'bg-slate-50/50 cursor-default'
                    }`}
                  >
                    <span className="font-semibold text-slate-500">Period {slotItem.slot}</span>
                    <span className="text-[11px]">{slotItem.time}</span>
                    {isHod ? (
                      <span className="text-[11px] text-blue-600 opacity-0 group-hover:opacity-100 font-bold flex items-center gap-0.5">
                        <Plus className="w-3 h-3" /> Assign
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No Class</span>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  onClick={() => isHod && handleOpenSlotModal(selectedDay, slotItem.slot)}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isHod ? 'cursor-pointer hover:shadow-sm' : 'cursor-default'
                  } ${COLOR_MAP[cls.color] || 'bg-slate-50 border-slate-200'}`}
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
                      <Building2 className="w-3 h-3" /> {cls.room || 'Classroom'}
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
              <p className="text-[11px] text-slate-500">
                {isHod ? 'Click on any period cell to assign or edit the subject' : 'View-only timetable matrix scheduled by HOD'}
              </p>
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
                              onClick={() => isHod && handleOpenSlotModal(day, slot)}
                              className={`p-2 text-center text-slate-300 transition-colors ${
                                isHod ? 'hover:bg-blue-50/40 hover:text-blue-600 cursor-pointer' : 'cursor-default font-mono'
                              }`}
                              title={isHod ? `Click to assign Period ${slot} on ${day}` : 'No class scheduled'}
                            >
                              {isHod ? '+' : '—'}
                            </td>
                          );
                        }
                        return (
                          <td
                            key={slot}
                            onClick={() => isHod && handleOpenSlotModal(day, slot)}
                            className={`p-1.5 text-center ${isHod ? 'cursor-pointer' : 'cursor-default'}`}
                            title={`${cell.code} - ${cell.name} (${cell.room})`}
                          >
                            <div className={`p-1.5 rounded-lg border text-[11px] font-bold truncate transition-all ${
                              isHod ? 'hover:scale-[1.02]' : ''
                            } ${COLOR_MAP[cell.color] || 'bg-slate-50'}`}>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Continuous Periods <span className="text-[10px] text-blue-600 font-normal">(e.g. 1, 2, 3)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={slotForm.typedPeriods}
                    onChange={(e) => setSlotForm({ ...slotForm, typedPeriods: e.target.value })}
                    placeholder="e.g. 1, 2, 3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Quick Select Period Pills */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Quick Select Periods on {slotForm.day}:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(p => {
                    const currentParts = (slotForm.typedPeriods || '')
                      .split(/[,\s-]+/)
                      .map(Number)
                      .filter(Boolean);
                    const isSelected = currentParts.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          let next;
                          if (isSelected) {
                            next = currentParts.filter(x => x !== p);
                          } else {
                            next = [...currentParts, p].sort((a, b) => a - b);
                          }
                          setSlotForm({ ...slotForm, typedPeriods: next.join(', ') || String(p) });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        P{p}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Periods are scheduled continuously (1, 2, 3..) on {slotForm.day} and not scattered across other days.
                </p>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    placeholder="e.g. CS401 (optional)"
                    value={slotForm.code}
                    onChange={(e) => setSlotForm({ ...slotForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Classroom / Lab Venue
                    <span className="ml-1 text-[11px] font-normal text-blue-600">(Dropdown Option)</span>
                  </label>
                  <select
                    value={allVenues.includes(slotForm.room) ? slotForm.room : (slotForm.room ? '__custom__' : (allVenues[0] || ''))}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== '__custom__') {
                        const isLab = val.toLowerCase().includes('lab');
                        setSlotForm(prev => ({
                          ...prev,
                          room: val,
                          type: isLab ? 'lab' : (prev.type === 'lab' ? 'theory' : prev.type)
                        }));
                      }
                    }}
                    className="w-full bg-blue-50/60 border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-900 focus:outline-none focus:border-blue-600 mb-1.5 cursor-pointer"
                  >
                    <option value="">-- Choose Added Venue --</option>
                    {allVenues.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                    <option value="__custom__">-- Type Custom Venue Below --</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Or type custom classroom / lab venue"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition-all"
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

              {/* Continuous Lab Hours Block Config (if lab type) */}
              {slotForm.type === 'lab' && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-extrabold text-emerald-950">
                      <input
                        type="checkbox"
                        checked={slotForm.isContinuousLab}
                        onChange={(e) => setSlotForm({ ...slotForm, isContinuousLab: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span>Continuous Lab Hours Block</span>
                    </label>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                      Lab Hours Continuous
                    </span>
                  </div>

                  {slotForm.isContinuousLab && (
                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-1/2">
                        <label className="block text-[11px] font-bold text-emerald-800 mb-0.5">Continuous Hours (e.g. 3)</label>
                        <select
                          value={slotForm.continuousHours}
                          onChange={(e) => setSlotForm({ ...slotForm, continuousHours: Number(e.target.value) })}
                          className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-black text-emerald-950 focus:outline-none focus:border-emerald-600"
                        >
                          <option value={2}>2 Continuous Hours (2 Periods)</option>
                          <option value={3}>3 Continuous Hours (3 Periods)</option>
                          <option value={4}>4 Continuous Hours (4 Periods)</option>
                        </select>
                      </div>
                      <div className="w-1/2 text-[11px] font-bold text-emerald-900 bg-emerald-100/60 p-2 rounded-xl border border-emerald-200">
                        ⚡ Will occupy Period {slotForm.slot} to Period {Math.min(5, Number(slotForm.slot) + Number(slotForm.continuousHours) - 1)} consecutively.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Period Conflict Warning */}
              {staffPeriodConflict && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs shadow-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">⚠️ Warning: Period Already Allocated!</strong>
                    <p className="mt-0.5 text-amber-800">
                      Period {slotForm.slot} on {slotForm.day} is already allocated to <strong>{staffPeriodConflict.code}</strong> ({staffPeriodConflict.name}). Saving will overwrite and re-allocate this period.
                    </p>
                  </div>
                </div>
              )}

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
