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
  { slot: 1, time: '09:30 AM - 10:30 AM' },
  { slot: 2, time: '10:30 AM - 11:20 AM' },
  { slot: 'B', time: '11:20 AM - 11:30 AM', isBreak: true, label: 'Break' },
  { slot: 3, time: '11:30 AM - 12:20 PM' },
  { slot: 4, time: '12:20 PM - 01:00 PM' },
  { slot: 'L', time: '01:00 PM - 01:30 PM', isBreak: true, label: 'Lunch' },
  { slot: 5, time: '01:30 PM - 02:15 PM' },
  { slot: 6, time: '02:15 PM - 03:00 PM' },
];

const COLOR_MAP = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200/70',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/70',
  purple: 'bg-purple-50 text-purple-700 border-purple-200/70',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
  amber: 'bg-amber-50 text-amber-700 border-amber-200/70',
  rose: 'bg-rose-50 text-rose-700 border-rose-200/70',
  orange: 'bg-orange-50 text-orange-700 border-orange-200/70',
  violet: 'bg-violet-50 text-violet-700 border-violet-200/70',
};

const BADGE_COLOR_MAP = {
  blue: 'bg-blue-600',
  indigo: 'bg-indigo-600',
  purple: 'bg-purple-600',
  emerald: 'bg-emerald-600',
  amber: 'bg-amber-600',
  rose: 'bg-rose-600',
  orange: 'bg-orange-600',
  violet: 'bg-violet-600',
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
  const [allClasses, setAllClasses] = useState([]);
  const [allTimetables, setAllTimetables] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit / Assign Slot Modal State
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isSavingSlot, setIsSavingSlot] = useState(false);
  const [slotModalError, setSlotModalError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const currentStaffId = staffUser?.staffId || staffUser?.employeeId || '';

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
    continuousHours: 3,
    partTimeSchedule: 'before-break',
    combinedDept: '',
    combinedYear: '',
    staffId: currentStaffId
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

  const [selectedStaffId, setSelectedStaffId] = useState(currentStaffId);
  const [departmentStaffList, setDepartmentStaffList] = useState([]);
  const [allStaffList, setAllStaffList] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(staffUser?.department || '');
  const departmentOptions = Array.from(new Set(allStaffList.map(staff => staff?.department?.trim()).filter(Boolean))).sort();
  const staffForSelectedDepartment = allStaffList.filter(staff =>
    (staff?.department || '').trim().toLowerCase() === selectedDepartment.trim().toLowerCase()
  );
  const assignedStaffId = slotForm.staffId || selectedStaffId || currentStaffId;

  // Derive list of real classrooms from database classes, timetables, and custom venues (matching admin side)
  const allVenues = useMemo(() => {
    const set = new Set();
    // 1. From database classes & rooms
    availableRooms.forEach(r => {
      if (r && typeof r === 'string' && r.trim()) set.add(r.trim());
    });
    // 2. From allTimetables (assigned across staff/admin)
    allTimetables.forEach(t => {
      const sched = t.schedule instanceof Map ? Object.fromEntries(t.schedule) : (t.schedule || {});
      Object.values(sched).forEach(day => {
        if (day && typeof day === 'object') {
          Object.values(day).forEach(slot => {
            if (slot?.room && typeof slot.room === 'string' && slot.room.trim()) {
              set.add(slot.room.trim());
            }
          });
        }
      });
    });
    // 3. From custom added venues in localStorage
    try {
      const custom = JSON.parse(localStorage.getItem('vcas_custom_venues') || '[]');
      if (Array.isArray(custom)) {
        custom.forEach(v => {
          if (v && typeof v === 'string' && v.trim()) set.add(v.trim());
        });
      }
    } catch (_) {}

    const result = Array.from(set);
    return result.length > 0 ? result : ['LH-101', 'LH-102', 'Computer Lab 1', 'Seminar Hall 1'];
  }, [availableRooms, allTimetables]);

  // Combined classes available for assigning timetable: staff classes + department classes + all added classes
  const availableClassesForStaff = useMemo(() => {
    const list = [...classes];
    const seenCodes = new Set(classes.map(c => c.code));

    const myDept = (selectedDepartment || staffUser?.department || '').trim().toLowerCase();

    // First add department classes
    allClasses.forEach(c => {
      if (c && c.code && !seenCodes.has(c.code)) {
        const cDept = (c.dept || c.department || '').trim().toLowerCase();
        if (myDept && (cDept === myDept || cDept.includes(myDept) || myDept.includes(cDept))) {
          seenCodes.add(c.code);
          list.push(c);
        }
      }
    });

    // Then any remaining added classes
    allClasses.forEach(c => {
      if (c && c.code && !seenCodes.has(c.code)) {
        seenCodes.add(c.code);
        list.push(c);
      }
    });

    return list;
  }, [classes, allClasses, selectedDepartment, staffUser?.department]);

  // Fetch timetable and classes from backend API for selected staff, plus all classes & venues
  const fetchData = async (targetId = selectedStaffId) => {
    const idToFetch = targetId || currentStaffId;
    try {
      setLoading(true);
      const [tRes, cRes, allCRes, allTRes] = await Promise.all([
        idToFetch ? fetch(`${API_BASE}/timetable/staff/${idToFetch}`).catch(() => null) : Promise.resolve(null),
        idToFetch ? fetch(`${API_BASE}/classes/staff/${idToFetch}`).catch(() => null) : Promise.resolve(null),
        fetch(`${API_BASE}/classes`).catch(() => null),
        fetch(`${API_BASE}/timetable`).catch(() => null)
      ]);

      if (tRes && tRes.ok) {
        const tData = await tRes.json();
        if (tData.success && tData.schedule) {
          setSchedule(tData.schedule);
        }
      }

      if (cRes && cRes.ok) {
        const cData = await cRes.json();
        if (cData.success && Array.isArray(cData.classes)) {
          setClasses(cData.classes);
        }
      }

      let roomList = [];
      if (allCRes && allCRes.ok) {
        const allCData = await allCRes.json();
        const rawClasses = allCData?.classes || allCData?.data || (Array.isArray(allCData) ? allCData : []);
        setAllClasses(rawClasses);
        const classRooms = rawClasses.map(c => c.room).filter(Boolean);
        roomList = [...roomList, ...classRooms];
      }

      if (allTRes && allTRes.ok) {
        const allTData = await allTRes.json();
        const rawTimetables = allTData?.timetables || allTData?.data || (Array.isArray(allTData) ? allTData : []);
        setAllTimetables(rawTimetables);
      }

      try {
        const customHalls = localStorage.getItem('vcas_custom_exam_halls');
        if (customHalls) {
          const parsed = JSON.parse(customHalls);
          const hallNames = parsed.map(h => typeof h === 'string' ? h : (h?.name || h?.hallName || h?.room)).filter(Boolean);
          roomList = [...roomList, ...hallNames];
        }
      } catch (_) {}

      const uniqueRooms = Array.from(new Set(roomList.map(r => typeof r === 'string' ? r.trim() : '').filter(Boolean)));
      setAvailableRooms(uniqueRooms);
    } catch (err) {
      console.error('Error fetching timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all staff members from department so normal staff & HOD can view department timetables
  useEffect(() => {
    fetch(`${API_BASE}/staff`)
      .then(r => r.json())
      .then(data => {
        const rows = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.staff)
            ? data.staff
            : [];

        setAllStaffList(rows);

        if (rows.length > 0) {
          const myDept = (staffUser?.department || '').trim().toLowerCase();
          const deptStaff = rows.filter(s => {
            const sDept = (s?.department || '').trim().toLowerCase();
            return !myDept || sDept === myDept || sDept.includes(myDept) || myDept.includes(sDept);
          });
          setDepartmentStaffList(deptStaff.length > 0 ? deptStaff : rows);
        } else {
          setDepartmentStaffList([]);
        }
      })
      .catch(() => {
        setAllStaffList([]);
        setDepartmentStaffList([]);
      });
  }, [staffUser?.department]);

  useEffect(() => {
    fetchData(selectedStaffId);
  }, [selectedStaffId]);

  useEffect(() => {
    const currentStaff = allStaffList.find(staff =>
      String(staff.staffId || staff.employeeId || staff._id) === String(selectedStaffId)
    );
    if (currentStaff?.department) setSelectedDepartment(currentStaff.department);
  }, [allStaffList, selectedStaffId]);

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
        room: existing.room || (allVenues[0] || 'LH-101'),
        type: (existing.type || 'theory').toLowerCase(),
        color: (existing.color || (existing.type === 'lab' ? 'emerald' : existing.type === 'part-time' ? 'orange' : existing.type === 'combined' ? 'violet' : 'blue')).toLowerCase(),
        isContinuousLab: Boolean(existing.isContinuousLab || existing.type === 'lab'),
        continuousHours: matching.length > 0 ? matching.length : (Number(existing.labHours) || 3),
        partTimeSchedule: existing.partTimeSchedule || 'before-break',
        combinedDept: existing.combinedDept || '',
        combinedYear: existing.combinedYear || '',
        staffId: selectedStaffId || currentStaffId
      });
    } else {
      // Default to first class if available
      const firstClass = (availableClassesForStaff && availableClassesForStaff[0]) || classes[0] || null;
      const isLab = Boolean(firstClass && (firstClass.labHours > 0 || firstClass.type === 'lab' || firstClass.name?.toLowerCase().includes('lab')));
      setSlotForm({
        day,
        slot: Number(slot),
        typedPeriods: String(slot),
        code: firstClass ? firstClass.code : '',
        name: firstClass ? firstClass.name : '',
        room: firstClass?.room || (allVenues[0] || 'LH-101'),
        type: isLab ? 'lab' : 'theory',
        color: isLab ? 'emerald' : 'blue',
        isContinuousLab: isLab,
        continuousHours: firstClass?.labHours || 3,
        partTimeSchedule: 'before-break',
        combinedDept: '',
        combinedYear: '',
        staffId: selectedStaffId || currentStaffId
      });
    }
    setIsSlotModalOpen(true);
  };

  // When user picks a class from dropdown, auto-fill code, name, room, and continuous lab hours
  const handleSelectClass = (classCode) => {
    const selected = availableClassesForStaff.find(c => c.code === classCode) || classes.find(c => c.code === classCode);
    if (selected) {
      const isLab = Boolean(selected.labHours > 0 || selected.type === 'lab' || selected.name?.toLowerCase().includes('lab'));
      const hrs = Number(selected.theoryHours || selected.labHours) || 3;
      const defaultSlots = [];
      for (let i = 1; i <= Math.min(8, hrs); i++) defaultSlots.push(i);

      setSlotForm(prev => ({
        ...prev,
        code: selected.code,
        name: selected.name,
        room: selected.room || prev.room || (isLab ? 'Computer Lab 1' : (allVenues[0] || 'LH-101')),
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

  const roomConflictWarning = useMemo(() => {
    if (!isSlotModalOpen || !slotForm.room) return null;
    const targetRoom = (slotForm.room || '').trim().toLowerCase();
    if (!targetRoom) return null;

    const targetStaffId = slotForm.staffId || selectedStaffId || currentStaffId;

    // Check across other faculty timetables
    if (allTimetables && allTimetables.length > 0) {
      const clash = allTimetables.find(t => {
        if (t.staffId === targetStaffId) return false;
        const sched = t.schedule instanceof Map ? Object.fromEntries(t.schedule) : (t.schedule || {});
        const daySlots = sched[slotForm.day] || {};
        const existing = daySlots[String(slotForm.slot)];
        return existing && existing.room && existing.room.trim().toLowerCase() === targetRoom;
      });
      if (clash) {
        const sched = clash.schedule instanceof Map ? Object.fromEntries(clash.schedule) : (clash.schedule || {});
        const existing = sched[slotForm.day]?.[String(slotForm.slot)];
        const staffObj = allStaffList.find(s => s.staffId === clash.staffId || s.employeeId === clash.staffId);
        return {
          room: slotForm.room,
          facultyName: staffObj?.name || clash.staffName || clash.staffId,
          code: existing?.code || 'Another subject',
          name: existing?.name || '',
          day: slotForm.day,
          slot: slotForm.slot
        };
      }
    }

    // Check current schedule for room clash
    for (const day of DAYS) {
      const daySlots = schedule[day] || {};
      for (const periodKey of Object.keys(daySlots)) {
        const occupied = daySlots[periodKey];
        if (!occupied || !occupied.room) continue;
        if (day === slotForm.day && String(periodKey) === String(slotForm.slot)) continue;
        if (occupied.room.trim().toLowerCase() === targetRoom) {
          return {
            room: slotForm.room,
            facultyName: occupied.staffName || occupied.faculty || staffUser?.name || 'Faculty',
            code: occupied.code,
            name: occupied.name,
            day,
            slot: periodKey
          };
        }
      }
    }
    return null;
  }, [isSlotModalOpen, schedule, allTimetables, allStaffList, slotForm.day, slotForm.slot, slotForm.room, slotForm.staffId, selectedStaffId, currentStaffId, staffUser?.name]);

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
          room: slotForm.room?.trim() || (allVenues[0] || 'Classroom'),
          type: slotForm.type,
          color: slotForm.type === 'lab' ? 'emerald' : slotForm.type === 'part-time' ? 'orange' : slotForm.type === 'combined' ? 'violet' : slotForm.color,
          isContinuousLab: isLabContinuous,
          labHours: parsedPeriods.length,
          continuousSlots: parsedPeriods,
          periods: parsedPeriods,
          clearOtherDays: true,
          partTimeSchedule: slotForm.type === 'part-time' ? (slotForm.partTimeSchedule || 'before-break') : undefined,
          combinedDept: slotForm.type === 'combined' ? (slotForm.combinedDept || '') : undefined,
          combinedYear: slotForm.type === 'combined' ? (slotForm.combinedYear || '') : undefined
        }
      };

      const targetStaffId = slotForm.staffId || selectedStaffId || staffUser.staffId;
      if (targetStaffId) setSelectedStaffId(targetStaffId);
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

      const slotMsg = parsedPeriods.length > 1
        ? `Assigned ${payload.slotData.code} to Continuous Periods ${parsedPeriods.join(', ')} on ${slotForm.day} (${parsedPeriods.length} Hours)!`
        : `Assigned ${payload.slotData.code} to Period ${slotForm.slot} on ${slotForm.day}!`;

      showToast(data.warning ? `${slotMsg} ${data.warning}` : slotMsg);
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
      const targetStaffId = slotForm.staffId || selectedStaffId || staffUser.staffId;
      if (targetStaffId) setSelectedStaffId(targetStaffId);
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

  const matrixDayHoursMap = dayHoursMap;
  const matrixWeeklyTotal = totalAssignedSlots;
  const viewedStaff = allStaffList.find(staff =>
    String(staff.staffId || staff.employeeId || staff._id) === String(selectedStaffId)
  ) || departmentStaffList.find(staff => String(staff.staffId || staff.employeeId || staff._id) === String(selectedStaffId));
  const viewedStaffName = viewedStaff?.name || (String(selectedStaffId) === String(currentStaffId) ? staffUser?.name : selectedStaffId);

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

      {/* Full Week Matrix */}
      <div className="grid grid-cols-1 gap-6">
        {/* Full Week Matrix Overview */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Weekly Timetable Matrix</h3>
              <p className="text-[11px] text-slate-500">
                {isHod ? 'Click on any period cell to assign or edit the selected faculty timetable' : 'View-only timetable matrix scheduled by HOD'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
                Weekly Total: {matrixWeeklyTotal} Hours
              </span>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="p-3 text-left w-24">Day</th>
                  {slotTimes.map(slotItem => (
                    <th key={slotItem.isBreak ? slotItem.slot : slotItem.slot} className={`p-2 text-center min-w-[92px] ${slotItem.isBreak ? 'bg-amber-50/70 text-amber-700' : ''}`}>
                      <div>{slotItem.isBreak ? slotItem.label : `P${slotItem.slot}`}</div>
                      <div className="mt-1 text-[9px] font-medium normal-case tracking-normal text-slate-400 whitespace-nowrap">
                        {slotItem.time}
                      </div>
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
                  const dayCount = matrixDayHoursMap[day] || 0;
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
                      {slotTimes.map((slotItem, idx) => {
                        if (slotItem.isBreak) {
                          return (
                            <td key={`break-${idx}`} className="p-2 text-center bg-amber-50/40 text-[9px] font-bold uppercase text-amber-700 whitespace-nowrap">
                              {slotItem.label}
                            </td>
                          );
                        }
                        const slot = slotItem.slot;
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
                            title={`${cell.name || cell.code} - ${viewedStaffName}`}
                          >
                            <div className={`p-1.5 rounded-lg border text-[11px] font-bold transition-all ${isHod ? 'hover:scale-[1.02]' : ''} ${COLOR_MAP[cell.color] || 'bg-slate-50'}`}>
                              <div className="font-extrabold text-slate-900 leading-tight">{cell.name || cell.code}</div>
                              {cell.code && cell.name && cell.code !== cell.name && (
                                <div className="text-[9px] font-mono text-slate-500 uppercase">{cell.code}</div>
                              )}
                              {cell.type === 'part-time' && (
                                <div className="text-[8px] font-black text-orange-600 uppercase tracking-tight mt-0.5">
                                  ⏰ Part-Time · {cell.partTimeSchedule === 'before-lunch' ? 'Pre-Lunch' : 'Pre-Break'}
                                </div>
                              )}
                              {cell.type === 'combined' && (
                                <div className="text-[8px] font-black text-violet-600 uppercase tracking-tight mt-0.5" title={`Combined with ${cell.combinedDept || ''}`}>
                                  🏫 Combined · {cell.combinedDept ? cell.combinedDept.split(' ')[0] : 'Multi-Dept'}
                                </div>
                              )}
                              {cell.room && (
                                <div className="text-[9px] font-semibold text-slate-600 truncate mt-0.5" title={`Venue: ${cell.room}`}>
                                  📍 {cell.room}
                                </div>
                              )}
                              <div className="text-[9px] opacity-75 font-normal truncate mt-0.5 text-slate-600">{viewedStaffName}</div>
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
                  <td colSpan={slotTimes.length} className="p-3 text-right text-slate-500 font-medium">
                    Total Weekly Teaching Hours:
                  </td>
                  <td className="p-3 text-center text-blue-700 font-black border-l border-slate-200 bg-blue-50/50">
                    {matrixWeeklyTotal} hrs
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
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 sm:p-7 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95">
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

            <form onSubmit={handleSaveSlot} className="space-y-4 overflow-y-auto pr-1 flex-1 mt-1">
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
                  {[1, 2, 3, 4, 5, 6].map(p => {
                    const currentParts = (slotForm.typedPeriods || '')
                      .split(/[,\s-]+/)
                      .map(Number)
                      .filter(Boolean);
                    const isSelected = currentParts.includes(p);
                    const isAssigned = Boolean(schedule[slotForm.day]?.[String(p)]);
                    const isPartTimeRestricted = slotForm.type === 'part-time' && (
                      (slotForm.partTimeSchedule === 'before-break' && p > 2) ||
                      (slotForm.partTimeSchedule === 'before-lunch' && p > 4)
                    );
                    const isDisabled = isAssigned || isPartTimeRestricted;
                    return (
                      <button
                        key={p}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          let next;
                          if (isSelected) {
                            next = currentParts.filter(x => x !== p);
                          } else {
                            next = [...currentParts, p].sort((a, b) => a - b);
                          }
                          setSlotForm({ ...slotForm, typedPeriods: next.join(', ') || String(p) });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                          isPartTimeRestricted
                            ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-50'
                            : isAssigned
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
                            : isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer'
                        }`}
                        title={isPartTimeRestricted ? 'Restricted by Part-Time schedule' : isAssigned ? 'Already assigned' : `Select Period ${p}`}
                      >
                        P{p}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {slotForm.type === 'part-time'
                    ? slotForm.partTimeSchedule === 'before-break'
                      ? '⏰ Part-Time (Before Break): Only Period 1 and Period 2 can be assigned.'
                      : '⏰ Part-Time (Before Lunch): Only Periods 1 to 4 can be assigned.'
                    : '💡 Periods are scheduled continuously (1, 2, 3..) on ' + slotForm.day + ' and not scattered across other days.'}
                </p>
              </div>

              {isHod && (
                <div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                      <select
                        value={selectedDepartment}
                        onChange={(e) => {
                          const nextDepartment = e.target.value;
                          const firstStaff = allStaffList.find(staff =>
                            (staff?.department || '').trim().toLowerCase() === nextDepartment.trim().toLowerCase()
                          );
                          const nextStaffId = firstStaff ? (firstStaff.staffId || firstStaff.employeeId || firstStaff._id) : '';
                          setSelectedDepartment(nextDepartment);
                          setSlotForm(prev => ({ ...prev, staffId: nextStaffId }));
                          setSelectedStaffId(nextStaffId);
                        }}
                        className="w-full bg-indigo-50/60 border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-900 focus:outline-none focus:border-indigo-600"
                      >
                        <option value="">-- Choose Department --</option>
                        {departmentOptions.map(department => (
                          <option key={department} value={department}>{department}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Staff Name</label>
                      <select
                        value={assignedStaffId}
                        onChange={(e) => {
                          const nextStaffId = e.target.value;
                          const nextStaff = staffForSelectedDepartment.find(staff =>
                            String(staff.staffId || staff.employeeId || staff._id) === String(nextStaffId)
                          );
                          setSlotForm(prev => ({ ...prev, staffId: nextStaffId }));
                          setSelectedStaffId(nextStaffId);
                          if (nextStaff?.department) setSelectedDepartment(nextStaff.department);
                        }}
                        className="w-full bg-indigo-50/60 border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-900 focus:outline-none focus:border-indigo-600"
                      >
                        <option value="">-- Choose Staff --</option>
                        {staffForSelectedDepartment.map(staff => {
                          const staffId = staff.staffId || staff.employeeId || staff._id;
                          return <option key={staffId} value={staffId}>{staff.name}</option>;
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBJECT / CLASS SELECTION */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Title / Class *</label>
                <select
                  value={availableClassesForStaff.find(c => c.name === slotForm.name || c.code === slotForm.code)?.code || ''}
                  onChange={(e) => handleSelectClass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 mb-1.5 cursor-pointer"
                >
                  <option value="">-- Choose Subject / Class from Dropdown --</option>
                  {availableClassesForStaff.length === 0 ? (
                    <option value="" disabled>No added classes found</option>
                  ) : (
                    availableClassesForStaff.map(c => (
                      <option key={c.code || c._id} value={c.code}>
                        {c.code ? `${c.code} — ` : ''}{c.name} {c.room ? `[${c.room}]` : ''} {c.section ? `(Sec ${c.section})` : ''}
                      </option>
                    ))
                  )}
                </select>
                <input
                  type="text"
                  required
                  placeholder="Or enter subject / class name"
                  value={slotForm.name}
                  onChange={(e) => setSlotForm({ ...slotForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                {/* CLASSROOM OR LAB VENUE DROPDOWN */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Classroom / Lab Venue <span className="text-[11px] font-normal text-blue-600">(Dropdown Option)</span>
                  </label>
                  <select
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
                    className="w-full bg-blue-50/60 border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-900 focus:bg-white focus:border-blue-600 focus:outline-none cursor-pointer transition-all mb-1.5"
                  >
                    <option value="">-- Choose Classroom / Lab Venue --</option>
                    {allVenues.length === 0 ? (
                      <option value="" disabled>No added classrooms found</option>
                    ) : (
                      allVenues.map(venue => (
                        <option key={venue} value={venue}>{venue}</option>
                      ))
                    )}
                    {slotForm.room && !allVenues.includes(slotForm.room) && (
                      <option value={slotForm.room}>{slotForm.room}</option>
                    )}
                  </select>
                  <input
                    type="text"
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
                    placeholder="Or type custom classroom / lab room"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={slotForm.type}
                    onChange={(e) => {
                      const t = e.target.value;
                      let updatedTypedPeriods = slotForm.typedPeriods;
                      if (t === 'part-time') {
                        const parts = (slotForm.typedPeriods || '').split(/[,\s-]+/).map(Number).filter(Boolean);
                        const limit = slotForm.partTimeSchedule === 'before-break' ? 2 : 4;
                        const validParts = parts.filter(p => p <= limit);
                        updatedTypedPeriods = validParts.length > 0 ? validParts.join(', ') : '1';
                      }
                      setSlotForm({
                        ...slotForm,
                        type: t,
                        typedPeriods: updatedTypedPeriods,
                        color: t === 'part-time' ? 'orange' : t === 'combined' ? 'violet' : t === 'lab' ? 'emerald' : slotForm.color
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="theory">Theory Session</option>
                    <option value="lab">Practical / Lab</option>
                    <option value="part-time">Part-Time Class</option>
                    <option value="combined">Combined Class (Multi-Dept)</option>
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
                    <option value="orange">Orange</option>
                    <option value="violet">Violet</option>
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

              {/* Part-Time Class Configuration */}
              {slotForm.type === 'part-time' && (
                <div className="p-3.5 bg-orange-50/80 border border-orange-300 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-orange-950">Part-Time Staff Teaching Period:</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-200 text-orange-900 border border-orange-300">
                      Part-Time
                    </span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-orange-900 mb-1">Teaching Shift Window</label>
                    <select
                      value={slotForm.partTimeSchedule}
                      onChange={(e) => {
                        const val = e.target.value;
                        const parts = (slotForm.typedPeriods || '').split(/[,\s-]+/).map(Number).filter(Boolean);
                        const limit = val === 'before-break' ? 2 : 4;
                        const valid = parts.filter(p => p <= limit);
                        setSlotForm(prev => ({
                          ...prev,
                          partTimeSchedule: val,
                          typedPeriods: valid.length > 0 ? valid.join(', ') : '1'
                        }));
                      }}
                      className="w-full bg-white border border-orange-300 rounded-xl px-3 py-2 text-xs font-bold text-orange-950 focus:outline-none focus:border-orange-500"
                    >
                      <option value="before-break">Before Break Alone (Periods 1 &amp; 2)</option>
                      <option value="before-lunch">Before Lunch Alone (Periods 1 to 4)</option>
                    </select>
                  </div>
                  <div className="text-[11px] font-medium text-orange-800 bg-white/80 p-2.5 rounded-xl border border-orange-200">
                    {slotForm.partTimeSchedule === 'before-break'
                      ? '⏰ Staff will be assigned only before tea break (Period 1 to Period 2). Periods after break are disabled.'
                      : '⏰ Staff will be assigned only before lunch break (Period 1 to Period 4). Afternoon periods (P5, P6) are disabled.'}
                  </div>
                </div>
              )}

              {/* Combined Class (2 Departments Combined) */}
              {slotForm.type === 'combined' && (
                <div className="p-3.5 bg-violet-50/80 border border-violet-300 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-violet-950">Combined Class (Two Departments Merged):</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-200 text-violet-900 border border-violet-300">
                      Multi-Dept
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-violet-900 mb-1">Second Department *</label>
                      <select
                        value={slotForm.combinedDept}
                        onChange={(e) => setSlotForm({ ...slotForm, combinedDept: e.target.value })}
                        className="w-full bg-white border border-violet-300 rounded-xl px-3 py-2 text-xs font-bold text-violet-950 focus:outline-none focus:border-violet-500"
                        required
                      >
                        <option value="">-- Choose 2nd Department --</option>
                        {departmentOptions.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-violet-900 mb-1">2nd Dept Year / Sem</label>
                      <input
                        type="text"
                        value={slotForm.combinedYear}
                        onChange={(e) => setSlotForm({ ...slotForm, combinedYear: e.target.value })}
                        placeholder="e.g. 2nd Year / Sem 3"
                        className="w-full bg-white border border-violet-300 rounded-xl px-3 py-2 text-xs font-medium text-violet-950 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                  {slotForm.combinedDept && (
                    <div className="text-[11px] font-medium text-violet-800 bg-white/80 p-2.5 rounded-xl border border-violet-200">
                      🏫 <strong>Joint Department Class:</strong> Students from <strong>{slotForm.combinedDept}</strong> {slotForm.combinedYear ? `(${slotForm.combinedYear})` : ''} and this department are combined for this session.
                    </div>
                  )}
                </div>
              )}

              {/* Period Conflict Warning */}
              {(staffPeriodConflict || roomConflictWarning) && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs shadow-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">⚠️ Warning: Allocation Conflict!</strong>
                    <p className="mt-0.5 text-amber-800">
                      {roomConflictWarning
                        ? `Room "${roomConflictWarning.room}" is already allocated on ${roomConflictWarning.day} Period ${roomConflictWarning.slot} to ${roomConflictWarning.facultyName} for ${roomConflictWarning.code}.`
                        : `Period ${slotForm.slot} on ${slotForm.day} is already allocated to ${staffPeriodConflict.code} (${staffPeriodConflict.name}). Saving will overwrite and re-allocate this period.`}
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
