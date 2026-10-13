import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Clock,
  Building2,
  Users,
  BookOpen,
  Download,
  Printer,
  Plus,
  Edit,
  Search,
  CheckCircle2,
  X,
  Layers,
  Coffee,
  Utensils,
  ShieldCheck,
  Save,
  Pencil,
  GraduationCap,
  Sparkles,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import ModalPortal from './ModalPortal';

const API_BASE = 'http://localhost:5000/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_FACULTY_PERIODS = [
  { slot: 1, time: '8:30 – 9:20 AM' },
  { slot: 2, time: '9:20 – 10:10 AM' },
  { slot: 3, time: '10:10 – 11:00 AM' },
  { slot: 4, time: '11:15 AM – 12:05 PM' },
  { slot: 5, time: '12:05 – 12:55 PM' },
  { slot: 6, time: '1:45 – 2:35 PM' },
  { slot: 7, time: '2:35 – 3:25 PM' },
  { slot: 8, time: '3:25 – 4:15 PM' },
];

const DEFAULT_CLASS_PERIODS = [
  { slot: 1, time: '09:00 - 10:00 AM' },
  { slot: 2, time: '10:00 - 11:00 AM' },
  { slot: 3, time: '11:15 - 12:15 PM' },
  { slot: 4, time: '01:15 - 02:15 PM' },
  { slot: 5, time: '02:15 - 03:15 PM' },
  { slot: 6, time: '03:15 - 04:15 PM' },
];

const DEFAULT_BREAK_TIMINGS = {
  tea: '11:00 - 11:15 AM (15m)',
  lunch: '12:55 - 1:45 PM (50m)'
};

const FACULTY_PERIODS = DEFAULT_FACULTY_PERIODS;

const INITIAL_SCHEDULES = {};

const DEFAULT_CLASS_METRICS = {
  weeklyPeriods: '36 Hours',
  weeklyPeriodsSub: '6 Periods / Day × 6 Days',
  smartClassrooms: '18 Rooms',
  smartClassroomsSub: 'Projector Enabled',
  activeLabs: '8 Labs',
  activeLabsSub: 'Hardware & Software',
  facultyConflicts: '0 Clashes',
  facultyConflictsSub: '100% Conflict-Free'
};

const COLOR_MAP = {
  theory: 'blue',
  lab: 'emerald',
  elective: 'rose',
  tutorial: 'amber',
  library: 'teal',
  project: 'purple',
  sports: 'emerald'
};

export default function TimetableManagement({ user }) {
  const isSuperAdmin = user?.role === 'Super Admin' || user?.isSuperAdmin || JSON.parse(sessionStorage.getItem('vcas_user') || '{}')?.role === 'Super Admin';
  // Navigation: 'faculty' (Assigned Faculty Timetable) vs 'class' (Class / Section View)
  const [viewMode, setViewMode] = useState('faculty');

  // Period Timings State (Admin Configurable & Persistent in localStorage)
  const [facultyPeriods, setFacultyPeriods] = useState(() => {
    try {
      const saved = localStorage.getItem('vcas_faculty_period_timings');
      return saved ? JSON.parse(saved) : DEFAULT_FACULTY_PERIODS;
    } catch {
      return DEFAULT_FACULTY_PERIODS;
    }
  });

  const [classPeriods, setClassPeriods] = useState(() => {
    try {
      const saved = localStorage.getItem('vcas_class_period_timings');
      return saved ? JSON.parse(saved) : DEFAULT_CLASS_PERIODS;
    } catch {
      return DEFAULT_CLASS_PERIODS;
    }
  });

  const [breakTimings, setBreakTimings] = useState(() => {
    try {
      const saved = localStorage.getItem('vcas_break_timings');
      return saved ? JSON.parse(saved) : DEFAULT_BREAK_TIMINGS;
    } catch {
      return DEFAULT_BREAK_TIMINGS;
    }
  });

  // Modal State for Editing Period Timings
  const [isEditTimingsOpen, setIsEditTimingsOpen] = useState(false);
  const [activeTimingTab, setActiveTimingTab] = useState('faculty'); // 'faculty' | 'class' | 'breaks'
  const [tempFacultyPeriods, setTempFacultyPeriods] = useState(DEFAULT_FACULTY_PERIODS);
  const [tempClassPeriods, setTempClassPeriods] = useState(DEFAULT_CLASS_PERIODS);
  const [tempBreakTimings, setTempBreakTimings] = useState(DEFAULT_BREAK_TIMINGS);

  const handleOpenEditTimings = (tab) => {
    setActiveTimingTab(tab || (viewMode === 'faculty' ? 'faculty' : 'class'));
    setTempFacultyPeriods(facultyPeriods);
    setTempClassPeriods(classPeriods);
    setTempBreakTimings(breakTimings);
    setIsEditTimingsOpen(true);
  };

  const handleSavePeriodTimings = (e) => {
    if (e) e.preventDefault();
    setFacultyPeriods(tempFacultyPeriods);
    setClassPeriods(tempClassPeriods);
    setBreakTimings(tempBreakTimings);
    try {
      localStorage.setItem('vcas_faculty_period_timings', JSON.stringify(tempFacultyPeriods));
      localStorage.setItem('vcas_class_period_timings', JSON.stringify(tempClassPeriods));
      localStorage.setItem('vcas_break_timings', JSON.stringify(tempBreakTimings));
    } catch (err) {
      console.error('Failed to save period timings:', err);
    }
    setIsEditTimingsOpen(false);
    showToast('✓ Period timings updated successfully!');
  };

  const handleResetPeriodTimings = () => {
    if (window.confirm('Reset all period timings to college defaults?')) {
      setTempFacultyPeriods(DEFAULT_FACULTY_PERIODS);
      setTempClassPeriods(DEFAULT_CLASS_PERIODS);
      setTempBreakTimings(DEFAULT_BREAK_TIMINGS);
      setFacultyPeriods(DEFAULT_FACULTY_PERIODS);
      setClassPeriods(DEFAULT_CLASS_PERIODS);
      setBreakTimings(DEFAULT_BREAK_TIMINGS);
      localStorage.removeItem('vcas_faculty_period_timings');
      localStorage.removeItem('vcas_class_period_timings');
      localStorage.removeItem('vcas_break_timings');
      setIsEditTimingsOpen(false);
      showToast('Period timings restored to defaults.');
    }
  };

  const getPeriodTime = (slotNum, mode = viewMode) => {
    if (mode === 'faculty') {
      const p = facultyPeriods.find(item => item.slot === Number(slotNum));
      return p ? p.time : '';
    } else {
      const p = classPeriods.find(item => item.slot === Number(slotNum));
      return p ? p.time : '';
    }
  };

  // Live Database Timetables & Staff State
  const [staffList, setStaffList] = useState([]);
  const [allTimetables, setAllTimetables] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [facultySchedule, setFacultySchedule] = useState({});
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [isSavingSlot, setIsSavingSlot] = useState(false);

  // Class Schedules Matrix State
  const [schedules, setSchedules] = useState(() => {
    try {
      const saved = localStorage.getItem('vcas_class_schedules');
      return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
    } catch {
      return INITIAL_SCHEDULES;
    }
  });
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState(3);
  const [selectedSem, setSelectedSem] = useState('Sem 5');
  const [selectedSection, setSelectedSection] = useState('Section A');

  // Class Metrics State (Admin Editable)
  const [classMetrics, setClassMetrics] = useState(() => {
    try {
      const saved = localStorage.getItem('vcas_class_schedule_metrics');
      return saved ? JSON.parse(saved) : DEFAULT_CLASS_METRICS;
    } catch {
      return DEFAULT_CLASS_METRICS;
    }
  });
  const [isEditMetricsOpen, setIsEditMetricsOpen] = useState(false);
  const [tempMetrics, setTempMetrics] = useState(DEFAULT_CLASS_METRICS);

  // Modals & Notifications
  const [isEditSlotOpen, setIsEditSlotOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Slot Form State
  const [slotForm, setSlotForm] = useState({
    day: 'Monday',
    period: 1,
    code: '',
    name: '',
    faculty: '',
    room: '',
    type: 'theory'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Lock background scroll when modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(isEditSlotOpen || isPrintModalOpen || isEditMetricsOpen);
    const scrollContainer = document.getElementById('main-content-scroll-container');
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      if (scrollContainer) scrollContainer.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      if (scrollContainer) scrollContainer.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'unset';
      if (scrollContainer) scrollContainer.style.overflow = 'auto';
    };
  }, [isEditSlotOpen, isPrintModalOpen, isEditMetricsOpen]);

  // Fetch all staff members & live timetables on mount
  const fetchStaffAndTimetables = async () => {
    try {
      const [sRes, tRes, dRes, subRes] = await Promise.all([
        fetch(`${API_BASE}/staff`),
        fetch(`${API_BASE}/timetable`),
        fetch(`${API_BASE}/departments`).catch(() => null),
        fetch(`${API_BASE}/subjects`).catch(() => null)
      ]);
      const sData = await sRes.json();
      const tData = await tRes.json();

      const staffArr = sData?.data || [];
      setStaffList(staffArr);

      const timetablesArr = tData?.timetables || [];
      setAllTimetables(timetablesArr);

      if (dRes && dRes.ok) {
        const dData = await dRes.json();
        const rawDepts = dData?.departments || dData?.data || (Array.isArray(dData) ? dData : []);
        const deptList = rawDepts
          .map(d => (typeof d === 'string' ? d : d.name || d.departmentName))
          .filter(Boolean);
        setAvailableDepartments(deptList);
        if (deptList.length > 0) {
          setSelectedDept(prev => (prev && deptList.includes(prev) ? prev : deptList[0]));
        }
      }

      if (subRes && subRes.ok) {
        const subData = await subRes.json();
        const rawSubs = subData?.subjects || subData?.data || (Array.isArray(subData) ? subData : []);
        setAvailableSubjects(rawSubs);
      }

      // Auto-select staff: prefer one who already has timetable data, or EMP001, or first staff
      if (!selectedStaffId && staffArr.length > 0) {
        const staffWithTimetable = timetablesArr.find(t => {
          if (!t.schedule) return false;
          const s = t.schedule instanceof Map ? Object.fromEntries(t.schedule) : t.schedule;
          return Object.values(s).some(day => day && Object.keys(day).length > 0);
        });

        if (staffWithTimetable) {
          setSelectedStaffId(staffWithTimetable.staffId);
        } else {
          const emp001 = staffArr.find(s => s.staffId === 'EMP001');
          setSelectedStaffId(emp001 ? emp001.staffId : staffArr[0].staffId);
        }
      }
    } catch (err) {
      console.error('Failed to load staff/timetables:', err);
    }
  };

  useEffect(() => {
    fetchStaffAndTimetables();
  }, []);

  // Fetch single staff timetable when selectedStaffId changes
  const fetchSelectedStaffTimetable = async (staffId) => {
    if (!staffId) return;
    try {
      setLoadingSchedule(true);
      const res = await fetch(`${API_BASE}/timetable/staff/${staffId}`);
      const data = await res.json();
      if (data?.success && data?.schedule) {
        const sched = data.schedule instanceof Map ? Object.fromEntries(data.schedule) : data.schedule;
        setFacultySchedule(sched || {});
      } else {
        setFacultySchedule({});
      }
    } catch (err) {
      console.error('Error fetching timetable for staff:', err);
      setFacultySchedule({});
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    if (selectedStaffId) {
      fetchSelectedStaffTimetable(selectedStaffId);
    }
  }, [selectedStaffId]);

  // Current selected staff object
  const currentStaff = useMemo(() => {
    return staffList.find(s => s.staffId === selectedStaffId) || null;
  }, [staffList, selectedStaffId]);

  // Helper to count assigned slots for any staff member
  const getStaffAssignedCount = (staffId) => {
    const t = allTimetables.find(item => item.staffId === staffId);
    if (!t || !t.schedule) return 0;
    const sched = t.schedule instanceof Map ? Object.fromEntries(t.schedule) : t.schedule;
    let count = 0;
    Object.values(sched).forEach(day => {
      if (day && typeof day === 'object') {
        count += Object.keys(day).length;
      }
    });
    return count;
  };

  // Derive list of all known subjects from database and existing timetable records
  // Derive list of ONLY the real added subjects and codes from the database
  const allKnownSubjects = useMemo(() => {
    const list = [];
    const seen = new Set();

    // Strictly from database /api/subjects (only real added subjects)
    availableSubjects.forEach(s => {
      const code = (s.code || s.subjectCode || '').trim().toUpperCase();
      const name = (s.name || s.subjectName || '').trim();
      if (code && !seen.has(code)) {
        seen.add(code);
        list.push({
          code,
          name: name || code,
          type: (s.type && s.type.toLowerCase().includes('lab')) ? 'lab' : 'theory',
          department: s.department || '',
          faculty: s.faculty || ''
        });
      }
    });

    return list;
  }, [availableSubjects]);

  // Get active schedule for Class View: aggregates live assigned slots across faculty + class overrides
  const activeClassSchedule = useMemo(() => {
    const userDeptSchedule = schedules[selectedDept]?.[selectedYear] || {};
    
    // Aggregate live faculty slots from allTimetables
    const aggregated = {};
    DAYS.forEach(day => {
      aggregated[day] = {};
    });

    allTimetables.forEach(t => {
      const staffMember = staffList.find(s => s.staffId === t.staffId);
      const staffLabel = staffMember?.name ? `${staffMember.name} (${t.staffId})` : (t.staffId || 'Faculty');
      const sched = t.schedule instanceof Map ? Object.fromEntries(t.schedule) : (t.schedule || {});
      
      Object.entries(sched).forEach(([day, daySlots]) => {
        if (daySlots && typeof daySlots === 'object') {
          Object.entries(daySlots).forEach(([periodNum, slot]) => {
            if (slot && slot.code) {
              if (!aggregated[day]) aggregated[day] = {};
              aggregated[day][periodNum] = {
                ...slot,
                faculty: slot.faculty || staffLabel,
                color: slot.color || COLOR_MAP[slot.type] || 'blue'
              };
            }
          });
        }
      });
    });

    // Merge: custom class schedule overrides aggregated slots
    const merged = {};
    DAYS.forEach(day => {
      merged[day] = {
        ...(aggregated[day] || {}),
        ...(userDeptSchedule[day] || {})
      };
    });

    return merged;
  }, [schedules, selectedDept, selectedYear, allTimetables, staffList]);

  // Open Edit Slot Modal (supports both Faculty Mode and Class Mode)
  const handleOpenEditSlot = (day, periodNum, currentSlot) => {
    const defaultFaculty = viewMode === 'faculty'
      ? (currentStaff?.name ? `${currentStaff.name} (${currentStaff.staffId})` : selectedStaffId)
      : (currentSlot?.faculty || '');

    setSlotForm({
      day,
      period: periodNum,
      code: currentSlot?.code || '',
      name: currentSlot?.name || '',
      faculty: currentSlot?.faculty || defaultFaculty || '',
      room: currentSlot?.room || '',
      type: currentSlot?.type || 'theory'
    });
    setIsEditSlotOpen(true);
  };

  // Save Slot Edit
  const handleSaveSlot = async (e) => {
    e.preventDefault();

    const updatedSlot = {
      code: slotForm.code.trim().toUpperCase(),
      name: slotForm.name.trim(),
      faculty: slotForm.faculty,
      room: slotForm.room.trim() || 'LH-101',
      type: slotForm.type,
      color: COLOR_MAP[slotForm.type] || 'blue'
    };

    if (viewMode === 'faculty') {
      if (!selectedStaffId) {
        showToast('Please select a faculty member first.');
        return;
      }

      try {
        setIsSavingSlot(true);
        const res = await fetch(`${API_BASE}/timetable/staff/${selectedStaffId}/slot`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            day: slotForm.day,
            slot: slotForm.period,
            slotData: updatedSlot
          })
        });

        const data = await res.json();
        if (res.ok) {
          const sched = data.schedule instanceof Map ? Object.fromEntries(data.schedule) : data.schedule;
          setFacultySchedule(sched || {});
          fetchStaffAndTimetables(); // Sync counts
          setIsEditSlotOpen(false);
          showToast(`✓ Assigned Period ${slotForm.period} on ${slotForm.day} for ${currentStaff?.name || selectedStaffId}`);
        } else {
          showToast(`Error: ${data.message || 'Could not save slot'}`);
        }
      } catch (err) {
        showToast('Failed to save slot.');
      } finally {
        setIsSavingSlot(false);
      }
    } else {
      // Class View: Save into React state
      setSchedules(prev => {
        const deptData = prev[selectedDept] || {};
        const baseYearData = deptData[selectedYear] || prev['Computer Science']?.[3] || {};
        const yearData = JSON.parse(JSON.stringify(baseYearData));
        const dayData = yearData[slotForm.day] || {};

        dayData[slotForm.period] = updatedSlot;
        yearData[slotForm.day] = dayData;

        return {
          ...prev,
          [selectedDept]: {
            ...deptData,
            [selectedYear]: yearData
          }
        };
      });

      setIsEditSlotOpen(false);
      showToast(`✓ Saved! ${slotForm.day} Period ${slotForm.period} updated with ${updatedSlot.code} (${updatedSlot.name})`);
    }
  };

  // Clear / Remove Slot
  const handleClearSlot = async () => {
    if (viewMode === 'faculty') {
      if (!selectedStaffId) return;

      try {
        setIsSavingSlot(true);
        const res = await fetch(`${API_BASE}/timetable/staff/${selectedStaffId}/slot/${slotForm.day}/${slotForm.period}`, {
          method: 'DELETE'
        });

        const data = await res.json();
        if (res.ok) {
          const sched = data.schedule instanceof Map ? Object.fromEntries(data.schedule) : data.schedule;
          setFacultySchedule(sched || {});
          fetchStaffAndTimetables();
          setIsEditSlotOpen(false);
          showToast(`✓ Cleared Period ${slotForm.period} on ${slotForm.day}`);
        } else {
          showToast(`Error: ${data.message || 'Could not clear slot'}`);
        }
      } catch (err) {
        showToast('Failed to clear slot.');
      } finally {
        setIsSavingSlot(false);
      }
    } else {
      setSchedules(prev => {
        const deptData = prev[selectedDept] || {};
        const baseYearData = deptData[selectedYear] || prev['Computer Science']?.[3] || {};
        const yearData = JSON.parse(JSON.stringify(baseYearData));
        const dayData = { ...(yearData[slotForm.day] || {}) };

        delete dayData[slotForm.period];
        yearData[slotForm.day] = dayData;

        return {
          ...prev,
          [selectedDept]: {
            ...deptData,
            [selectedYear]: yearData
          }
        };
      });

      setIsEditSlotOpen(false);
      showToast(`Cleared slot for ${slotForm.day} - Period ${slotForm.period}`);
    }
  };

  // Export Timetable CSV
  const handleExportCSV = () => {
    if (viewMode === 'faculty') {
      const headers = ['Day', ...facultyPeriods.map(p => `P${p.slot} (${p.time})`)];
      const rows = DAYS.map(day => {
        const d = facultySchedule[day] || {};
        return [
          `"${day}"`,
          ...facultyPeriods.map(p => {
            const slot = d[p.slot];
            return slot ? `"${slot.code}: ${slot.name} (${slot.room})"` : `"--"` ;
          })
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Faculty_Timetable_${selectedStaffId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Timetable for ${currentStaff?.name || selectedStaffId} exported as CSV!`);
    } else {
      const headers = ['Day', ...classPeriods.map(p => `Period ${p.slot} (${p.time})`)];
      const rows = DAYS.map(day => {
        const d = activeClassSchedule[day] || {};
        return [
          `"${day}"`,
          ...classPeriods.map(p => {
            const slot = d[p.slot];
            return slot ? `"${slot.name || '--'} (${slot.faculty || ''})"` : `"--"`;
          })
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Vidyapeeth_${selectedDept}_Yr${selectedYear}_Timetable.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Class Timetable exported successfully as CSV!');
    }
  };

  // Calculate stats for Faculty View
  const totalAssignedSlots = useMemo(() => {
    let count = 0;
    Object.values(facultySchedule).forEach(day => {
      if (day && typeof day === 'object') {
        count += Object.keys(day).length;
      }
    });
    return count;
  }, [facultySchedule]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans animate-fadeIn">

      {/* TOAST NOTIFICATION */}
      {toastMessage && typeof document !== 'undefined' && createPortal(
        <div className="fixed top-6 right-6 z-[99999] bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn pointer-events-auto">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>,
        document.body
      )}

      {/* 1. TOP HEADER & VIEW MODE TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
              Academic Schedule Planner
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-semibold">Live Timetable System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>{viewMode === 'faculty' ? 'Assigned Faculty Timetable' : 'Class Weekly Timetable'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {viewMode === 'faculty'
              ? 'View and manage real-time weekly timetable assigned to faculty members.'
              : 'Master weekly classroom schedule matrix, period timings, subject allocations, and faculty assignments.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenEditSlot('Monday', 1, null)}
            title="Assign or Edit Timetable Slot"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Assign / Edit Slot</span>
          </button>

          <button
            onClick={() => handleOpenEditTimings()}
            title="Edit Period Timings"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all border border-indigo-200 shadow-xs cursor-pointer"
          >
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Edit Period Timings</span>
          </button>

          <button
            onClick={() => {
              fetchStaffAndTimetables();
              if (selectedStaffId) fetchSelectedStaffTimetable(selectedStaffId);
              showToast('Refreshed timetable data.');
            }}
            title="Refresh Timetable"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {isSuperAdmin && (
            <button
            onClick={handleExportCSV}
            title="Download CSV Timetable"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>
          )}

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Timetable</span>
          </button>
        </div>
      </div>

      {/* 2. MODE SWITCHER TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setViewMode('faculty')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            viewMode === 'faculty'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Faculty Assigned Timetables</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            viewMode === 'faculty' ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-700'
          }`}>
            {allTimetables.length} Assigned
          </span>
        </button>

        <button
          onClick={() => setViewMode('class')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            viewMode === 'class'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Class / Department Timetable</span>
        </button>
      </div>

      {/* 3. FACULTY MODE CONTROLS & STATS */}
      {viewMode === 'faculty' ? (
        <>
          {/* FACULTY SELECTOR CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 max-w-xl">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Select Faculty Member to View Assigned Schedule</span>
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Choose Faculty Member --</option>
                  {staffList.map(s => {
                    const count = getStaffAssignedCount(s.staffId);
                    return (
                      <option key={s.staffId} value={s.staffId}>
                        {s.name} ({s.staffId}) — {s.department || 'General'} {count > 0 ? `• [${count} Periods Assigned]` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* ACTIVE FACULTY PROFILE SUMMARY */}
              {currentStaff && (
                <div className="flex items-center gap-3 bg-indigo-50/70 border border-indigo-100 px-4 py-2.5 rounded-2xl">
                  <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm uppercase shrink-0 shadow-sm">
                    {currentStaff.name ? currentStaff.name.charAt(0) : 'F'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                      {currentStaff.name}
                    </h3>
                    <p className="text-[11px] text-indigo-700 font-semibold">
                      ID: <span className="font-mono font-bold">{currentStaff.staffId}</span> • {currentStaff.department}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {currentStaff.designation || 'Faculty'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* QUICK SELECTOR PILLS OF ACTIVE FACULTY */}
            {allTimetables.length > 0 && (
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Select Active Timetables:
                </span>
                {allTimetables.map(t => {
                  const isSelected = t.staffId === selectedStaffId;
                  const count = getStaffAssignedCount(t.staffId);
                  return (
                    <button
                      key={t.staffId}
                      onClick={() => setSelectedStaffId(t.staffId)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{t.staffName || t.staffId}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                        isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {count} slots
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SUMMARY STATS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Weekly Assigned</span>
                <p className="text-2xl font-black text-indigo-600">{totalAssignedSlots} Periods</p>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">Live Schedule</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Faculty Status</span>
                <p className="text-2xl font-black text-emerald-600">{currentStaff ? 'Active' : 'Select'}</p>
                <p className="text-[11px] text-emerald-600 font-bold mt-1">{currentStaff?.staffId || '--'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Teaching Days</span>
                <p className="text-2xl font-black text-blue-600">
                  {Object.keys(facultySchedule).filter(d => facultySchedule[d] && Object.keys(facultySchedule[d]).length > 0).length} / 6 Days
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Mon – Sat</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Faculty</span>
                <p className="text-2xl font-black text-purple-600">{staffList.length} Members</p>
                <p className="text-[11px] text-purple-600 font-bold mt-1">{allTimetables.length} Scheduled</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* FACULTY MASTER TIMETABLE GRID */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Weekly Period Matrix</h3>
                <p className="text-xs text-slate-500">Live active classroom hours for {currentStaff?.name || selectedStaffId}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditTimings('faculty')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 shadow-xs transition-all cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Change Period Timings</span>
                </button>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
                  Periods 1 to {facultyPeriods.length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider text-center">
                    <th className="py-3 px-3 text-left w-24 bg-slate-100/70 border-r border-slate-200">DAY</th>
                    <th className="py-3 px-2 w-32 group hover:bg-indigo-50/50 transition-colors cursor-pointer" onClick={() => handleOpenEditTimings('faculty')} title="Click to change period timings">
                      <div className="flex items-center justify-center gap-1">
                        <span>P1</span>
                        <Pencil className="w-2.5 h-2.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="block text-[8.5px] text-slate-500 font-mono font-normal mt-0.5">{getPeriodTime(1, 'faculty')}</span>
                    </th>
                    <th className="py-3 px-2 w-32 group hover:bg-indigo-50/50 transition-colors cursor-pointer" onClick={() => handleOpenEditTimings('faculty')} title="Click to change period timings">
                      <div className="flex items-center justify-center gap-1">
                        <span>P2</span>
                        <Pencil className="w-2.5 h-2.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="block text-[8.5px] text-slate-500 font-mono font-normal mt-0.5">{getPeriodTime(2, 'faculty')}</span>
                    </th>
                    <th className="py-3 px-2 w-32 group hover:bg-indigo-50/50 transition-colors cursor-pointer" onClick={() => handleOpenEditTimings('faculty')} title="Click to change period timings">
                      <div className="flex items-center justify-center gap-1">
                        <span>P3</span>
                        <Pencil className="w-2.5 h-2.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="block text-[8.5px] text-slate-500 font-mono font-normal mt-0.5">{getPeriodTime(3, 'faculty')}</span>
                    </th>
                    <th className="py-3 px-1 w-10 bg-amber-50/60 text-amber-800 border-x border-amber-100 text-[9px] group hover:bg-amber-100/60 transition-colors cursor-pointer" onClick={() => handleOpenEditTimings('breaks')} title="Click to change break timings">
                      <Coffee className="w-3 h-3 mx-auto mb-0.5 text-amber-600" />
                      <span>TEA</span>
                      <span className="block text-[8px] text-amber-700 font-mono font-normal">{breakTimings.tea.split('(')[0].trim()}</span>
                    </th>
                    <th className="py-3 px-2 w-32 group hover:bg-indigo-50/50 transition-colors cursor-pointer" onClick={() => handleOpenEditTimings('faculty')} title="Click to change period timings">
                      <div className="flex items-center justify-center gap-1">
                        <span>P4</span>
                        <Pencil className="w-2.5 h-2.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="block text-[8.5px] text-slate-500 font-mono font-normal mt-0.5">{getPeriodTime(4, 'faculty')}</span>
                    </th>
                    <th className="py-3 px-2 w-32 group hover:bg-indigo-50/50 transition-colors cursor-pointer" onClick={() => handleOpenEditTimings('faculty')} title="Click to change period timings">
                      <div className="flex items-center justify-center gap-1">
                        <span>P5</span>
                        <Pencil className="w-2.5 h-2.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="block text-[8.5px] text-slate-500 font-mono font-normal mt-0.5">{getPeriodTime(5, 'faculty')}</span>
                    </th>
                    <th className="py-3 px-1 w-10 bg-emerald-50/60 text-emerald-800 border-x border-emerald-100 text-[9px] group hover:bg-emerald-100/60 transition-colors cursor-pointer" onClick={() => handleOpenEditTimings('breaks')} title="Click to change break timings">
                      <Utensils className="w-3 h-3 mx-auto mb-0.5 text-emerald-600" />
                      <span>LUNCH</span>
                      <span className="block text-[8px] text-emerald-700 font-mono font-normal">{breakTimings.lunch.split('(')[0].trim()}</span>
                    </th>
                    <th className="py-3 px-2 w-32 group hover:bg-indigo-50/50 transition-colors cursor-pointer" onClick={() => handleOpenEditTimings('faculty')} title="Click to change period timings">
                      <div className="flex items-center justify-center gap-1">
                        <span>P6</span>
                        <Pencil className="w-2.5 h-2.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="block text-[8.5px] text-slate-500 font-mono font-normal mt-0.5">{getPeriodTime(6, 'faculty')}</span>
                    </th>
                    <th className="py-3 px-2 w-32 group hover:bg-indigo-50/50 transition-colors cursor-pointer" onClick={() => handleOpenEditTimings('faculty')} title="Click to change period timings">
                      <div className="flex items-center justify-center gap-1">
                        <span>P7</span>
                        <Pencil className="w-2.5 h-2.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="block text-[8.5px] text-slate-500 font-mono font-normal mt-0.5">{getPeriodTime(7, 'faculty')}</span>
                    </th>
                    <th className="py-3 px-2 w-32 group hover:bg-indigo-50/50 transition-colors cursor-pointer" onClick={() => handleOpenEditTimings('faculty')} title="Click to change period timings">
                      <div className="flex items-center justify-center gap-1">
                        <span>P8</span>
                        <Pencil className="w-2.5 h-2.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="block text-[8.5px] text-slate-500 font-mono font-normal mt-0.5">{getPeriodTime(8, 'faculty')}</span>
                    </th>
                    <th className="py-3 px-2 w-28 bg-slate-100/80 border-l border-slate-200 text-slate-700">
                      <span>Daily Hours</span>
                      <span className="block text-[8.5px] text-slate-500 font-normal">Taken</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {DAYS.map(day => {
                    const dayData = facultySchedule[day] || {};
                    const dayHours = Object.values(dayData).filter(s => s && s.code).length;
                    return (
                      <tr key={day} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3 px-3 font-black text-slate-900 bg-slate-50/50 border-r border-slate-200 text-left">
                          {day}
                        </td>

                        {/* P1 */}
                        <td className="p-1.5 align-top">
                          <SlotCell slot={dayData['1']} onEdit={() => handleOpenEditSlot(day, 1, dayData['1'])} />
                        </td>
                        {/* P2 */}
                        <td className="p-1.5 align-top">
                          <SlotCell slot={dayData['2']} onEdit={() => handleOpenEditSlot(day, 2, dayData['2'])} />
                        </td>
                        {/* P3 */}
                        <td className="p-1.5 align-top">
                          <SlotCell slot={dayData['3']} onEdit={() => handleOpenEditSlot(day, 3, dayData['3'])} />
                        </td>

                        {/* Tea Break */}
                        <td className="p-1 bg-amber-50/30 border-x border-amber-100 text-center text-[9px] font-bold text-amber-700">
                          15m
                        </td>

                        {/* P4 */}
                        <td className="p-1.5 align-top">
                          <SlotCell slot={dayData['4']} onEdit={() => handleOpenEditSlot(day, 4, dayData['4'])} />
                        </td>
                        {/* P5 */}
                        <td className="p-1.5 align-top">
                          <SlotCell slot={dayData['5']} onEdit={() => handleOpenEditSlot(day, 5, dayData['5'])} />
                        </td>

                        {/* Lunch Break */}
                        <td className="p-1 bg-emerald-50/30 border-x border-emerald-100 text-center text-[9px] font-bold text-emerald-700">
                          50m
                        </td>

                        {/* P6 */}
                        <td className="p-1.5 align-top">
                          <SlotCell slot={dayData['6']} onEdit={() => handleOpenEditSlot(day, 6, dayData['6'])} />
                        </td>
                        {/* P7 */}
                        <td className="p-1.5 align-top">
                          <SlotCell slot={dayData['7']} onEdit={() => handleOpenEditSlot(day, 7, dayData['7'])} />
                        </td>
                        {/* P8 */}
                        <td className="p-1.5 align-top">
                          <SlotCell slot={dayData['8']} onEdit={() => handleOpenEditSlot(day, 8, dayData['8'])} />
                        </td>

                        {/* Daily Hours Taken */}
                        <td className="p-2 border-l border-slate-200 bg-slate-50/50 text-center align-middle">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${
                            dayHours > 0
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'text-slate-400 font-medium'
                          }`}>
                            {dayHours} {dayHours === 1 ? 'hr' : 'hrs'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-700">
                    <td className="p-3 text-left">Weekly Total</td>
                    <td colSpan={10} className="p-3 text-right text-slate-500 font-medium">
                      Total Assigned Teaching Hours:
                    </td>
                    <td className="p-3 text-center border-l border-slate-200 text-indigo-700 font-black bg-indigo-50/50">
                      {totalAssignedSlots} hrs
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* ========================================================================= */
        /* 4. CLASS / DEPARTMENT MODE VIEW                                           */
        /* ========================================================================= */
        <>
          {/* STATS SUMMARY CARDS HEADER & CARDS */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Schedule Metrics & Capacity</h2>
            </div>
            <button
              onClick={() => {
                setTempMetrics(classMetrics);
                setIsEditMetricsOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 shadow-xs transition-all cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Metrics</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Weekly Periods</span>
                <p className="text-2xl font-black text-indigo-600">{classMetrics.weeklyPeriods}</p>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">{classMetrics.weeklyPeriodsSub}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Smart Classrooms</span>
                <p className="text-2xl font-black text-emerald-600">{classMetrics.smartClassrooms}</p>
                <p className="text-[11px] text-emerald-600 font-bold mt-1">{classMetrics.smartClassroomsSub}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Active Labs</span>
                <p className="text-2xl font-black text-blue-600">{classMetrics.activeLabs}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-1">{classMetrics.activeLabsSub}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Faculty Conflicts</span>
                <p className="text-2xl font-black text-emerald-600">{classMetrics.facultyConflicts}</p>
                <p className="text-[11px] text-emerald-600 font-bold mt-1">{classMetrics.facultyConflictsSub}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* CLASS SELECTORS BAR */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  {availableDepartments.length === 0 ? (
                    <option value="">No departments added</option>
                  ) : (
                    availableDepartments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Year & Semester</label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    setSelectedYear(y);
                    setSelectedSem(`Sem ${y * 2 - 1}`);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value={1}>1st Year (Sem 1 & 2)</option>
                  <option value={2}>2nd Year (Sem 3 & 4)</option>
                  <option value={3}>3rd Year (Sem 5 & 6)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="Section A">Section A (60 Students)</option>
                  <option value="Section B">Section B (60 Students)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-200">
                Venue: LH-101 (Smart Class)
              </span>
            </div>
          </div>

          {/* MASTER TIMETABLE MATRIX GRID */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider text-center">
                    <th className="py-4 px-4 text-left w-28 bg-slate-100/70 border-r border-slate-200">DAY / PERIOD</th>
                    <th className="py-4 px-3 w-40 group hover:bg-indigo-50/50 transition-colors cursor-pointer" onClick={() => handleOpenEditTimings('class')} title="Click to change period timings">
                      <div className="flex items-center justify-center gap-1">
                        <span>P1</span>
                        <Pencil className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="block text-[9px] text-slate-500 font-mono font-normal mt-0.5">{getPeriodTime(1, 'class')}</span>
                    </th>
                    <th className="py-4 px-3 w-40 group hover:bg-indigo-50/50 transition-colors cursor-pointer" onClick={() => handleOpenEditTimings('class')} title="Click to change period timings">
                      <div className="flex items-center justify-center gap-1">
                        <span>P2</span>
                        <Pencil className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="block text-[9px] text-slate-500 font-mono font-normal mt-0.5">{getPeriodTime(2, 'class')}</span>
                    </th>
                    <th className="py-4 px-1.5 w-10 bg-amber-50/60 text-amber-800 border-x border-amber-100 text-[10px] group hover:bg-amber-100/60 transition-colors cursor-pointer" onClick={() => handleOpenEditTimings('breaks')} title="Click to change break timings">
                      <Coffee className="w-3.5 h-3.5 mx-auto mb-0.5 text-amber-600" />
                      <span>TEA</span>
                      <span className="block text-[8px] text-amber-700 font-mono">{breakTimings.tea.split('(')[0].trim()}</span>
                    </th>
                    <th className="py-4 px-3 w-40 group hover:bg-indigo-50/50 transition-colors cursor-pointer" onClick={() => handleOpenEditTimings('class')} title="Click to change period timings">
                      <div className="flex items-center justify-center gap-1">
                        <span>P3</span>
                        <Pencil className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="block text-[9px] text-slate-500 font-mono font-normal mt-0.5">{getPeriodTime(3, 'class')}</span>
                    </th>
                    <th className="py-4 px-1.5 w-10 bg-emerald-50/60 text-emerald-800 border-x border-emerald-100 text-[10px] group hover:bg-emerald-100/60 transition-colors cursor-pointer" onClick={() => handleOpenEditTimings('breaks')} title="Click to change break timings">
                      <Utensils className="w-3.5 h-3.5 mx-auto mb-0.5 text-emerald-600" />
                      <span>LUNCH</span>
                      <span className="block text-[8px] text-emerald-700 font-mono">{breakTimings.lunch.split('(')[0].trim()}</span>
                    </th>
                    <th className="py-4 px-3 w-40 group hover:bg-indigo-50/50 transition-colors cursor-pointer" onClick={() => handleOpenEditTimings('class')} title="Click to change period timings">
                      <div className="flex items-center justify-center gap-1">
                        <span>P4</span>
                        <Pencil className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="block text-[9px] text-slate-500 font-mono font-normal mt-0.5">{getPeriodTime(4, 'class')}</span>
                    </th>
                    <th className="py-4 px-3 w-40 group hover:bg-indigo-50/50 transition-colors cursor-pointer" onClick={() => handleOpenEditTimings('class')} title="Click to change period timings">
                      <div className="flex items-center justify-center gap-1">
                        <span>P5</span>
                        <Pencil className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="block text-[9px] text-slate-500 font-mono font-normal mt-0.5">{getPeriodTime(5, 'class')}</span>
                    </th>
                    <th className="py-4 px-3 w-40 group hover:bg-indigo-50/50 transition-colors cursor-pointer" onClick={() => handleOpenEditTimings('class')} title="Click to change period timings">
                      <div className="flex items-center justify-center gap-1">
                        <span>P6</span>
                        <Pencil className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="block text-[9px] text-slate-500 font-mono font-normal mt-0.5">{getPeriodTime(6, 'class')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {DAYS.map((day) => {
                    const daySchedule = activeClassSchedule[day] || {};
                    return (
                      <tr key={day} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-4 font-black text-slate-900 bg-slate-50/50 border-r border-slate-200 text-left">
                          {day}
                        </td>

                        <td className="p-2 align-top">
                          <SlotCell slot={daySchedule[1]} onEdit={() => handleOpenEditSlot(day, 1, daySchedule[1])} />
                        </td>
                        <td className="p-2 align-top">
                          <SlotCell slot={daySchedule[2]} onEdit={() => handleOpenEditSlot(day, 2, daySchedule[2])} />
                        </td>

                        <td className="p-1 bg-amber-50/30 border-x border-amber-100 text-center text-[10px] font-bold text-amber-700">
                          15m
                        </td>

                        <td className="p-2 align-top">
                          <SlotCell slot={daySchedule[3]} onEdit={() => handleOpenEditSlot(day, 3, daySchedule[3])} />
                        </td>

                        <td className="p-1 bg-emerald-50/30 border-x border-emerald-100 text-center text-[10px] font-bold text-emerald-700">
                          1h
                        </td>

                        <td className="p-2 align-top">
                          <SlotCell slot={daySchedule[4]} onEdit={() => handleOpenEditSlot(day, 4, daySchedule[4])} />
                        </td>
                        <td className="p-2 align-top">
                          <SlotCell slot={daySchedule[5]} onEdit={() => handleOpenEditSlot(day, 5, daySchedule[5])} />
                        </td>
                        <td className="p-2 align-top">
                          <SlotCell slot={daySchedule[6]} onEdit={() => handleOpenEditSlot(day, 6, daySchedule[6])} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 5. LEGEND */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between flex-wrap gap-3 text-xs">
        <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Timetable Legend:</span>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-3 h-3 rounded bg-blue-500"></span> Core Theory
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-3 h-3 rounded bg-emerald-500"></span> Practical / Lab
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-3 h-3 rounded bg-purple-500"></span> Electives / Project
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-3 h-3 rounded bg-amber-500"></span> Mathematics / Tutorial
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL: EDIT / ASSIGN TIMETABLE SLOT                                    */}
      {/* ========================================================================= */}
      {isEditSlotOpen && (
        <ModalPortal isOpen={isEditSlotOpen} onClose={() => setIsEditSlotOpen(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                    {viewMode === 'faculty' ? 'Assign Faculty Period' : 'Edit Class Timetable Slot'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {slotForm.day} • Period {slotForm.period} {getPeriodTime(slotForm.period) ? `(${getPeriodTime(slotForm.period)})` : ''} {viewMode === 'faculty' && currentStaff ? `• ${currentStaff.name}` : ''}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsEditSlotOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Day of Week *</label>
                  <select
                    value={slotForm.day}
                    onChange={(e) => setSlotForm({ ...slotForm, day: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500 cursor-pointer"
                  >
                    {DAYS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Period Slot *</label>
                  <select
                    value={slotForm.period}
                    onChange={(e) => setSlotForm({ ...slotForm, period: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                      <option key={p} value={p}>Period {p} {getPeriodTime(p) ? `(${getPeriodTime(p)})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SUBJECT SELECTION DROPDOWN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Subject <span className="text-[11px] font-normal text-indigo-600">(Dropdown Option)</span>
                </label>
                <select
                  value={allKnownSubjects.some(s => s.code === slotForm.code) ? slotForm.code : (slotForm.code ? '__custom__' : '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__custom__') {
                      // Keep current values for manual editing
                    } else if (val) {
                      const sel = allKnownSubjects.find(s => s.code === val);
                      if (sel) {
                        setSlotForm(prev => ({
                          ...prev,
                          code: sel.code,
                          name: sel.name,
                          type: sel.type || prev.type,
                          room: prev.room || (sel.type === 'lab' ? 'Computer Lab 1' : 'LH-101')
                        }));
                      }
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs sm:text-sm font-bold text-indigo-950 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer transition-all mb-2"
                >
                  <option value="">-- Choose Subject from Dropdown --</option>
                  {allKnownSubjects.length === 0 ? (
                    <option value="" disabled>No added subjects found</option>
                  ) : (
                    allKnownSubjects.map(sub => (
                      <option key={sub.code} value={sub.code}>
                        {sub.code} — {sub.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  value={slotForm.name}
                  onChange={(e) => setSlotForm({ ...slotForm, name: e.target.value })}
                  placeholder="e.g. Cloud Computing & DevOps"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code *</label>
                  <input
                    type="text"
                    value={slotForm.code}
                    onChange={(e) => setSlotForm({ ...slotForm, code: e.target.value })}
                    placeholder="e.g. CS2005"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Slot Type</label>
                  <select
                    value={slotForm.type}
                    onChange={(e) => setSlotForm({ ...slotForm, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value="theory">Theory Lecture</option>
                    <option value="lab">Practical / Lab</option>
                    <option value="elective">Elective</option>
                    <option value="tutorial">Tutorial</option>
                    <option value="library">Library / Research</option>
                    <option value="project">Project / Capstone</option>
                    <option value="sports">Sports / Activity</option>
                  </select>
                </div>
              </div>

              {/* CLASSROOM OR LAB VENUE TYPING INPUT */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Classroom / Lab Venue
                  <span className="ml-1 text-[11px] font-normal text-slate-400">— Type your college room or lab</span>
                </label>
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
                  placeholder="e.g. Room 101, LH-1, Computer Lab"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>

              {/* FACULTY / STAFF DROPDOWN SELECTION */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Faculty / Staff <span className="text-[11px] font-normal text-indigo-600">(Dropdown Option)</span>
                </label>
                <select
                  value={slotForm.faculty}
                  onChange={(e) => setSlotForm({ ...slotForm, faculty: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs sm:text-sm font-bold text-indigo-950 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer transition-all"
                >
                  <option value="">-- Select Faculty / Staff Member --</option>
                  {staffList.map(s => {
                    const label = `${s.name} (${s.staffId})`;
                    return (
                      <option key={s.staffId || s._id} value={label}>
                        {s.name} — {s.staffId} {s.department ? `• ${s.department}` : ''}
                      </option>
                    );
                  })}
                  {slotForm.faculty && !staffList.some(s => `${s.name} (${s.staffId})` === slotForm.faculty) && (
                    <option value={slotForm.faculty}>{slotForm.faculty} (Current)</option>
                  )}
                </select>
                <input
                  type="text"
                  value={slotForm.faculty}
                  onChange={(e) => setSlotForm({ ...slotForm, faculty: e.target.value })}
                  placeholder="Or type custom faculty name"
                  className="w-full mt-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClearSlot}
                  disabled={isSavingSlot}
                  className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
                >
                  Clear Slot
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditSlotOpen(false)}
                    disabled={isSavingSlot}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSlot}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingSlot ? 'Saving...' : 'Save Slot'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: PRINT OFFICIAL TIMETABLE                                         */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <ModalPortal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {viewMode === 'faculty' ? `Faculty Timetable — ${currentStaff?.name || selectedStaffId}` : 'Official Class Timetable Sheet'}
                </h3>
                <p className="text-xs text-slate-500">Vidya Campus Automation System • Academic Year 2026-2027</p>
              </div>
              <button onClick={() => setIsPrintModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-50/80 rounded-2xl border-2 border-slate-200 space-y-4 text-center">
              <div>
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block">
                  {viewMode === 'faculty'
                    ? `FACULTY SCHEDULE • ${currentStaff?.department?.toUpperCase() || 'GENERAL'}`
                    : `DEPARTMENT OF ${selectedDept.toUpperCase()}`}
                </span>
                <h4 className="text-base font-black text-slate-900 mt-0.5">
                  {viewMode === 'faculty'
                    ? `${currentStaff?.name} (${currentStaff?.staffId || selectedStaffId})`
                    : `Bachelor of Technology • Year ${selectedYear} (${selectedSem}) • ${selectedSection}`}
                </h4>
              </div>

              {viewMode === 'faculty' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-300 text-[11px] bg-white">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-center border-b border-slate-300">
                        <th className="p-2 border border-slate-300">Day</th>
                        {facultyPeriods.map(p => (
                          <th key={p.slot} className="p-1 border border-slate-300 text-[9.5px]">
                            P{p.slot} ({p.time})
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS.map(day => {
                        const d = facultySchedule[day] || {};
                        return (
                          <tr key={day} className="border-b border-slate-200 text-center">
                            <td className="p-2 font-bold bg-slate-50 border border-slate-300">{day}</td>
                            {facultyPeriods.map(p => {
                              const s = d[p.slot];
                              return (
                                <td key={p.slot} className="p-1 border border-slate-300 text-[9px]">
                                  {s ? (
                                    <div>
                                      <span className="font-bold block">{s.code}</span>
                                      <span className="text-slate-500">{s.room}</span>
                                    </div>
                                  ) : '--'}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-300 text-xs bg-white">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-center border-b border-slate-300">
                        <th className="p-2 border border-slate-300">Day</th>
                        {classPeriods.map(p => (
                          <th key={p.slot} className="p-2 border border-slate-300">
                            P{p.slot} ({p.time})
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS.map(day => {
                        const d = activeClassSchedule[day] || {};
                        return (
                          <tr key={day} className="border-b border-slate-200 text-center">
                            <td className="p-2 font-bold bg-slate-50 border border-slate-300">{day}</td>
                            {[1, 2, 3, 4, 5, 6].map(p => (
                              <td key={p} className="p-2 border border-slate-300">
                                {d[p] ? (
                                  <div>
                                    <span className="font-bold block">{d[p].code}</span>
                                    <span className="text-[10px] text-slate-500">{d[p].room}</span>
                                  </div>
                                ) : '--'}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Timetable Sheet</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* EDIT SCHEDULE METRICS MODAL */}
      {isEditMetricsOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Edit Schedule Metrics</h3>
                    <p className="text-xs text-slate-500 font-medium">Customize timetable capacity, classroom, lab, and clash statistics</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditMetricsOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setClassMetrics(tempMetrics);
                  try {
                    localStorage.setItem('vcas_class_schedule_metrics', JSON.stringify(tempMetrics));
                  } catch (err) {
                    console.error(err);
                  }
                  setIsEditMetricsOpen(false);
                  showToast('Schedule metrics updated successfully!');
                }}
                className="p-5 space-y-4"
              >
                {/* Metric 1 */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-extrabold text-slate-800">Weekly Periods Metric</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Value</label>
                      <input
                        type="text"
                        value={tempMetrics.weeklyPeriods}
                        onChange={(e) => setTempMetrics(prev => ({ ...prev, weeklyPeriods: e.target.value }))}
                        placeholder="e.g. 36 Hours"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={tempMetrics.weeklyPeriodsSub}
                        onChange={(e) => setTempMetrics(prev => ({ ...prev, weeklyPeriodsSub: e.target.value }))}
                        placeholder="e.g. 6 Periods / Day × 6 Days"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-extrabold text-slate-800">Smart Classrooms Metric</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Value</label>
                      <input
                        type="text"
                        value={tempMetrics.smartClassrooms}
                        onChange={(e) => setTempMetrics(prev => ({ ...prev, smartClassrooms: e.target.value }))}
                        placeholder="e.g. 18 Rooms"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={tempMetrics.smartClassroomsSub}
                        onChange={(e) => setTempMetrics(prev => ({ ...prev, smartClassroomsSub: e.target.value }))}
                        placeholder="e.g. Projector Enabled"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-extrabold text-slate-800">Active Labs Metric</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Value</label>
                      <input
                        type="text"
                        value={tempMetrics.activeLabs}
                        onChange={(e) => setTempMetrics(prev => ({ ...prev, activeLabs: e.target.value }))}
                        placeholder="e.g. 8 Labs"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={tempMetrics.activeLabsSub}
                        onChange={(e) => setTempMetrics(prev => ({ ...prev, activeLabsSub: e.target.value }))}
                        placeholder="e.g. Hardware & Software"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-extrabold text-slate-800">Faculty Conflicts Metric</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Value</label>
                      <input
                        type="text"
                        value={tempMetrics.facultyConflicts}
                        onChange={(e) => setTempMetrics(prev => ({ ...prev, facultyConflicts: e.target.value }))}
                        placeholder="e.g. 0 Clashes"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={tempMetrics.facultyConflictsSub}
                        onChange={(e) => setTempMetrics(prev => ({ ...prev, facultyConflictsSub: e.target.value }))}
                        placeholder="e.g. 100% Conflict-Free"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditMetricsOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Metrics</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: EDIT PERIOD TIMINGS (ADMIN CUSTOMIZABLE)                       */}
      {/* ========================================================================= */}
      {isEditTimingsOpen && (
        <ModalPortal isOpen={isEditTimingsOpen} onClose={() => setIsEditTimingsOpen(false)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col my-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Customize Period Timings</h3>
                  <p className="text-xs text-slate-500 font-medium">Set period hours and bell timings for classroom timetables</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditTimingsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs inside modal */}
            <div className="px-5 pt-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/30 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTimingTab('faculty')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTimingTab === 'faculty'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Faculty Periods (P1 – P8)
              </button>
              <button
                type="button"
                onClick={() => setActiveTimingTab('class')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTimingTab === 'class'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Class Periods (P1 – P6)
              </button>
              <button
                type="button"
                onClick={() => setActiveTimingTab('breaks')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTimingTab === 'breaks'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Break & Recess Timings
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSavePeriodTimings} className="p-5 space-y-4 overflow-y-auto flex-1">
              {activeTimingTab === 'faculty' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700">8-Period Matrix Timings</span>
                    <span className="text-[11px] text-indigo-600 font-semibold">Reflected across faculty schedule</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tempFacultyPeriods.map((p) => (
                      <div key={p.slot} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                            Period {p.slot}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">P{p.slot} Slot</span>
                        </div>
                        <input
                          type="text"
                          value={p.time}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempFacultyPeriods(prev => prev.map(item => item.slot === p.slot ? { ...item, time: val } : item));
                          }}
                          placeholder="e.g. 8:30 – 9:20 AM"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTimingTab === 'class' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700">6-Period Class Schedule Timings</span>
                    <span className="text-[11px] text-indigo-600 font-semibold">Reflected across department matrix</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tempClassPeriods.map((p) => (
                      <div key={p.slot} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                            Period {p.slot}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">P{p.slot} Slot</span>
                        </div>
                        <input
                          type="text"
                          value={p.time}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempClassPeriods(prev => prev.map(item => item.slot === p.slot ? { ...item, time: val } : item));
                          }}
                          placeholder="e.g. 09:00 - 10:00 AM"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTimingTab === 'breaks' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700">Break & Lunch Intervals</span>
                    <span className="text-[11px] text-amber-600 font-semibold">Displayed in timetable columns</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <Coffee className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-extrabold text-slate-800">Tea Break</span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Timing Description</label>
                        <input
                          type="text"
                          value={tempBreakTimings.tea}
                          onChange={(e) => setTempBreakTimings(prev => ({ ...prev, tea: e.target.value }))}
                          placeholder="e.g. 11:00 - 11:15 AM (15m)"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-extrabold text-slate-800">Lunch Break</span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Timing Description</label>
                        <input
                          type="text"
                          value={tempBreakTimings.lunch}
                          onChange={(e) => setTempBreakTimings(prev => ({ ...prev, lunch: e.target.value }))}
                          placeholder="e.g. 12:55 - 1:45 PM (50m)"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetPeriodTimings}
                  className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Reset Defaults
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditTimingsOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Period Timings</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}

// Subcomponent: Individual Slot Cell
function SlotCell({ slot, onEdit }) {
  if (!slot || slot.type === 'free') {
    return (
      <div
        onClick={onEdit}
        className="h-20 rounded-xl border-2 border-dashed border-slate-200/80 p-2 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all cursor-pointer group"
      >
        <span className="text-[10px] font-bold group-hover:text-indigo-600">+ Assign</span>
      </div>
    );
  }

  const colorStyles = {
    blue: 'bg-blue-50/90 border-blue-200 text-blue-900 hover:border-blue-400',
    indigo: 'bg-indigo-50/90 border-indigo-200 text-indigo-900 hover:border-indigo-400',
    purple: 'bg-purple-50/90 border-purple-200 text-purple-900 hover:border-purple-400',
    emerald: 'bg-emerald-50/90 border-emerald-200 text-emerald-900 hover:border-emerald-400',
    amber: 'bg-amber-50/90 border-amber-200 text-amber-900 hover:border-amber-400',
    rose: 'bg-rose-50/90 border-rose-200 text-rose-900 hover:border-rose-400',
    cyan: 'bg-cyan-50/90 border-cyan-200 text-cyan-900 hover:border-cyan-400',
    teal: 'bg-teal-50/90 border-teal-200 text-teal-900 hover:border-teal-400',
    slate: 'bg-slate-50 border-slate-200 text-slate-600'
  };

  const style = colorStyles[slot.color] || colorStyles.blue;

  return (
    <div
      onClick={onEdit}
      className={`h-20 rounded-xl border p-2 flex flex-col justify-between transition-all cursor-pointer shadow-xs hover:shadow-md ${style}`}
    >
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-mono font-black text-[9px] bg-white/90 px-1 py-0.2 rounded shadow-xs">
            {slot.code}
          </span>
          <span className="text-[8px] uppercase font-bold opacity-75">{slot.type}</span>
        </div>
        <p className="font-extrabold text-[10px] leading-tight line-clamp-1 mt-0.5" title={slot.name}>
          {slot.name}
        </p>
      </div>

      <div className="pt-0.5 border-t border-black/5 flex items-center justify-between text-[9px] opacity-90 font-medium">
        <span className="truncate max-w-[65px]">{slot.faculty || 'Assigned'}</span>
        <span className="font-bold shrink-0 text-slate-700 bg-white/70 px-1 rounded text-[8.5px]">
          {slot.room ? slot.room.split(' ')[0] : 'LH-101'}
        </span>
      </div>
    </div>
  );
}
