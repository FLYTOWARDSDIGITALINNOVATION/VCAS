import React, { useState, useEffect, useMemo } from 'react';
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

const DEPARTMENTS = [
  'All Departments',
  'Computer Science',
  'Electronics',
  'MBA',
  'Mechanical',
  'Civil',
  'BCA'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const FACULTY_PERIODS = [
  { slot: 1, time: '8:30 – 9:20 AM' },
  { slot: 2, time: '9:20 – 10:10 AM' },
  { slot: 3, time: '10:10 – 11:00 AM' },
  { slot: 4, time: '11:15 AM – 12:05 PM' },
  { slot: 5, time: '12:05 – 12:55 PM' },
  { slot: 6, time: '1:45 – 2:35 PM' },
  { slot: 7, time: '2:35 – 3:25 PM' },
  { slot: 8, time: '3:25 – 4:15 PM' },
];

const INITIAL_SCHEDULES = {
  'Computer Science': {
    3: { // Year 3 (Sem 5)
      Monday: {
        1: { code: 'CS401', name: 'Database Management Systems', faculty: 'Dr. Sunita Rao (HOD)', room: 'LH-201', type: 'theory', color: 'blue' },
        2: { code: 'CS501', name: 'Operating Systems', faculty: 'Dr. Neeraj Gupta', room: 'LH-201', type: 'theory', color: 'indigo' },
        3: { code: 'CS502', name: 'AI & Machine Learning', faculty: 'Prof. Arvind Menon', room: 'LH-201', type: 'theory', color: 'purple' },
        4: { code: 'CS402', name: 'DBMS & SQL Laboratory', faculty: 'Dr. Sunita Rao / Dr. Priya Sharma', room: 'Computer Lab 3', type: 'lab', color: 'emerald' },
        5: { code: 'CS402', name: 'DBMS & SQL Laboratory', faculty: 'Dr. Sunita Rao / Dr. Priya Sharma', room: 'Computer Lab 3', type: 'lab', color: 'emerald' },
        6: { code: 'CS402', name: 'DBMS & SQL Laboratory', faculty: 'Dr. Sunita Rao / Dr. Priya Sharma', room: 'Computer Lab 3', type: 'lab', color: 'emerald' }
      },
      Tuesday: {
        1: { code: 'CS502', name: 'AI & Machine Learning', faculty: 'Prof. Arvind Menon', room: 'LH-201', type: 'theory', color: 'purple' },
        2: { code: 'CS401', name: 'Database Management Systems', faculty: 'Dr. Sunita Rao (HOD)', room: 'LH-201', type: 'theory', color: 'blue' },
        3: { code: 'MA501', name: 'Discrete Mathematics & Graph Theory', faculty: 'Dr. S. Ramanujan', room: 'LH-201', type: 'theory', color: 'amber' },
        4: { code: 'CS501', name: 'Operating Systems', faculty: 'Dr. Neeraj Gupta', room: 'LH-201', type: 'theory', color: 'indigo' },
        5: { code: 'PE501', name: 'Professional Elective: Cloud Computing', faculty: 'Dr. Priya Sharma', room: 'LH-201', type: 'elective', color: 'rose' },
        6: { code: 'LIB', name: 'Library & Online Research Hour', faculty: 'Dr. Neeraj Gupta', room: 'Room 101', type: 'library', color: 'teal' }
      },
      Wednesday: {
        1: { code: 'CS501', name: 'Operating Systems', faculty: 'Dr. Neeraj Gupta', room: 'LH-201', type: 'theory', color: 'indigo' },
        2: { code: 'MA501', name: 'Discrete Mathematics & Graph Theory', faculty: 'Dr. S. Ramanujan', room: 'LH-201', type: 'theory', color: 'amber' },
        3: { code: 'CS401', name: 'Database Management Systems', faculty: 'Dr. Sunita Rao (HOD)', room: 'LH-201', type: 'theory', color: 'blue' },
        4: { code: 'CS503', name: 'AI & Neural Networks Lab', faculty: 'Prof. Arvind Menon / Dr. Neeraj Gupta', room: 'AI & ML Lab', type: 'lab', color: 'emerald' },
        5: { code: 'CS503', name: 'AI & Neural Networks Lab', faculty: 'Prof. Arvind Menon / Dr. Neeraj Gupta', room: 'AI & ML Lab', type: 'lab', color: 'emerald' },
        6: { code: 'CS503', name: 'AI & Neural Networks Lab', faculty: 'Prof. Arvind Menon / Dr. Neeraj Gupta', room: 'AI & ML Lab', type: 'lab', color: 'emerald' }
      },
      Thursday: {
        1: { code: 'PE501', name: 'Professional Elective: Cloud Computing', faculty: 'Dr. Priya Sharma', room: 'LH-201', type: 'elective', color: 'rose' },
        2: { code: 'CS502', name: 'AI & Machine Learning', faculty: 'Prof. Arvind Menon', room: 'LH-201', type: 'theory', color: 'purple' },
        3: { code: 'CS401', name: 'Database Management Systems', faculty: 'Dr. Sunita Rao (HOD)', room: 'LH-201', type: 'theory', color: 'blue' },
        4: { code: 'MA501', name: 'Discrete Mathematics & Graph Theory', faculty: 'Dr. S. Ramanujan', room: 'LH-201', type: 'theory', color: 'amber' },
        5: { code: 'CS501', name: 'Operating Systems', faculty: 'Dr. Neeraj Gupta', room: 'LH-201', type: 'theory', color: 'indigo' },
        6: { code: 'TUT', name: 'Tutorial Remedial Session', faculty: 'Dr. Sunita Rao (HOD)', room: 'LH-201', type: 'tutorial', color: 'cyan' }
      },
      Friday: {
        1: { code: 'MA501', name: 'Discrete Mathematics & Graph Theory', faculty: 'Dr. S. Ramanujan', room: 'LH-201', type: 'theory', color: 'amber' },
        2: { code: 'CS501', name: 'Operating Systems', faculty: 'Dr. Neeraj Gupta', room: 'LH-201', type: 'theory', color: 'indigo' },
        3: { code: 'PE501', name: 'Professional Elective: Cloud Computing', faculty: 'Dr. Priya Sharma', room: 'LH-201', type: 'elective', color: 'rose' },
        4: { code: 'CS502', name: 'AI & Machine Learning', faculty: 'Prof. Arvind Menon', room: 'LH-201', type: 'theory', color: 'purple' },
        5: { code: 'PROJ', name: 'Mini-Project Guidance', faculty: 'Dr. Sunita Rao / Prof. Arvind Menon', room: 'Project Lab', type: 'project', color: 'purple' },
        6: { code: 'SPT', name: 'Sports & Wellness', faculty: 'Prof. Physical Director', room: 'Seminar Hall 1', type: 'sports', color: 'emerald' }
      },
      Saturday: {
        1: { code: 'CS401', name: 'Database Management Systems', faculty: 'Dr. Sunita Rao (HOD)', room: 'LH-201', type: 'theory', color: 'blue' },
        2: { code: 'CS502', name: 'AI & Machine Learning', faculty: 'Prof. Arvind Menon', room: 'LH-201', type: 'theory', color: 'purple' },
        3: { code: 'SEM', name: 'Technical Seminar', faculty: 'Dr. Priya Sharma', room: 'Seminar Hall 1', type: 'seminar', color: 'amber' },
        4: { code: 'CLUB', name: 'Coding Club Practice', faculty: 'Prof. Arvind Menon', room: 'Computer Lab 3', type: 'club', color: 'indigo' },
        5: { code: 'FREE', name: 'Self-Study & Consultation', faculty: 'Faculty Mentors', room: 'LH-201', type: 'free', color: 'slate' },
        6: { code: 'FREE', name: 'Weekend Wrap-up', faculty: '--', room: '--', type: 'free', color: 'slate' }
      }
    }
  }
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

export default function TimetableManagement() {
  // Navigation: 'faculty' (Assigned Faculty Timetable in DB) vs 'class' (Class / Section View)
  const [viewMode, setViewMode] = useState('faculty');

  // Live Database Timetables & Staff State
  const [staffList, setStaffList] = useState([]);
  const [allTimetables, setAllTimetables] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [facultySchedule, setFacultySchedule] = useState({});
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [isSavingSlot, setIsSavingSlot] = useState(false);

  // Class Schedules Matrix State
  const [schedules, setSchedules] = useState(INITIAL_SCHEDULES);
  const [selectedDept, setSelectedDept] = useState('Computer Science');
  const [selectedYear, setSelectedYear] = useState(3);
  const [selectedSem, setSelectedSem] = useState('Sem 5');
  const [selectedSection, setSelectedSection] = useState('Section A');

  // Modals & Notifications
  const [isEditSlotOpen, setIsEditSlotOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Slot Form State
  const [slotForm, setSlotForm] = useState({
    day: 'Monday',
    period: 1,
    code: 'CS401',
    name: 'Database Management Systems',
    faculty: '',
    room: 'LH-101',
    type: 'theory'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Lock background scroll when modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(isEditSlotOpen || isPrintModalOpen);
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
  }, [isEditSlotOpen, isPrintModalOpen]);

  // Fetch all staff members & live timetables on mount
  const fetchStaffAndTimetables = async () => {
    try {
      const [sRes, tRes] = await Promise.all([
        fetch(`${API_BASE}/staff`),
        fetch(`${API_BASE}/timetable`)
      ]);
      const sData = await sRes.json();
      const tData = await tRes.json();

      const staffArr = sData?.data || [];
      setStaffList(staffArr);

      const timetablesArr = tData?.timetables || [];
      setAllTimetables(timetablesArr);

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

  // Get active schedule for Class View
  const activeClassSchedule = useMemo(() => {
    if (schedules[selectedDept] && schedules[selectedDept][selectedYear]) {
      return schedules[selectedDept][selectedYear];
    }
    return schedules['Computer Science']?.[3] || {};
  }, [schedules, selectedDept, selectedYear]);

  // Open Edit Slot Modal (supports both Faculty Mode and Class Mode)
  const handleOpenEditSlot = (day, periodNum, currentSlot) => {
    const defaultFaculty = viewMode === 'faculty'
      ? (currentStaff?.name ? `${currentStaff.name} (${currentStaff.staffId})` : selectedStaffId)
      : (currentSlot?.faculty || 'Dr. Sunita Rao (HOD)');

    setSlotForm({
      day,
      period: periodNum,
      code: currentSlot?.code || 'CS2005',
      name: currentSlot?.name || 'Database Management Systems',
      faculty: currentSlot?.faculty || defaultFaculty,
      room: currentSlot?.room || 'LH-101',
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
        showToast('Failed to save slot to database.');
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
        showToast('Failed to clear slot in database.');
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
      const headers = ['Day', ...FACULTY_PERIODS.map(p => `P${p.slot} (${p.time})`)];
      const rows = DAYS.map(day => {
        const d = facultySchedule[day] || {};
        return [
          `"${day}"`,
          ...FACULTY_PERIODS.map(p => {
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
      const headers = ['Day', 'Period 1 (9-10 AM)', 'Period 2 (10-11 AM)', 'Period 3 (11:15-12:15)', 'Period 4 (1:15-2:15)', 'Period 5 (2:15-3:15)', 'Period 6 (3:15-4:15)'];
      const rows = DAYS.map(day => {
        const d = activeClassSchedule[day] || {};
        return [
          `"${day}"`,
          `"${d[1]?.name || '--'} (${d[1]?.faculty || ''})"`,
          `"${d[2]?.name || '--'} (${d[2]?.faculty || ''})"`,
          `"${d[3]?.name || '--'} (${d[3]?.faculty || ''})"`,
          `"${d[4]?.name || '--'} (${d[4]?.faculty || ''})"`,
          `"${d[5]?.name || '--'} (${d[5]?.faculty || ''})"`,
          `"${d[6]?.name || '--'} (${d[6]?.faculty || ''})"`
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
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. TOP HEADER & VIEW MODE TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
              Academic Schedule Planner
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-semibold">Live Database Timetable System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>{viewMode === 'faculty' ? 'Assigned Faculty Timetable' : 'Class Weekly Timetable'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {viewMode === 'faculty'
              ? 'View and manage real-time weekly timetable assigned to faculty members in MongoDB.'
              : 'Master weekly classroom schedule matrix, period timings, subject allocations, and faculty assignments.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              fetchStaffAndTimetables();
              if (selectedStaffId) fetchSelectedStaffTimetable(selectedStaffId);
              showToast('Refreshed timetable data from database.');
            }}
            title="Reload from Database"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={handleExportCSV}
            title="Download CSV Timetable"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs shadow-indigo-500/20 transition-all"
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
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
            {allTimetables.length} in DB
          </span>
        </button>

        <button
          onClick={() => setViewMode('class')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
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
                <p className="text-[11px] text-slate-500 font-semibold mt-1">Live from MongoDB</p>
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
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <span>Weekly Matrix: {currentStaff?.name || selectedStaffId || 'Faculty'}</span>
                  {loadingSchedule && <span className="text-xs text-indigo-600 font-semibold animate-pulse">(Loading...)</span>}
                </h3>
                <p className="text-xs text-slate-500">
                  Click any cell to edit or assign a period. Changes save directly to the database.
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
                Periods 1 to 8
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider text-center">
                    <th className="py-3 px-3 text-left w-24 bg-slate-100/70 border-r border-slate-200">DAY</th>
                    <th className="py-3 px-2 w-32">
                      <span>P1</span>
                      <span className="block text-[8.5px] text-slate-400 font-mono font-normal">8:30-9:20 AM</span>
                    </th>
                    <th className="py-3 px-2 w-32">
                      <span>P2</span>
                      <span className="block text-[8.5px] text-slate-400 font-mono font-normal">9:20-10:10 AM</span>
                    </th>
                    <th className="py-3 px-2 w-32">
                      <span>P3</span>
                      <span className="block text-[8.5px] text-slate-400 font-mono font-normal">10:10-11:00 AM</span>
                    </th>
                    <th className="py-3 px-1 w-8 bg-amber-50/60 text-amber-800 border-x border-amber-100 text-[9px]">
                      <Coffee className="w-3 h-3 mx-auto mb-0.5 text-amber-600" />
                      <span>TEA</span>
                    </th>
                    <th className="py-3 px-2 w-32">
                      <span>P4</span>
                      <span className="block text-[8.5px] text-slate-400 font-mono font-normal">11:15-12:05 PM</span>
                    </th>
                    <th className="py-3 px-2 w-32">
                      <span>P5</span>
                      <span className="block text-[8.5px] text-slate-400 font-mono font-normal">12:05-12:55 PM</span>
                    </th>
                    <th className="py-3 px-1 w-8 bg-emerald-50/60 text-emerald-800 border-x border-emerald-100 text-[9px]">
                      <Utensils className="w-3 h-3 mx-auto mb-0.5 text-emerald-600" />
                      <span>LUNCH</span>
                    </th>
                    <th className="py-3 px-2 w-32">
                      <span>P6</span>
                      <span className="block text-[8.5px] text-slate-400 font-mono font-normal">1:45-2:35 PM</span>
                    </th>
                    <th className="py-3 px-2 w-32">
                      <span>P7</span>
                      <span className="block text-[8.5px] text-slate-400 font-mono font-normal">2:35-3:25 PM</span>
                    </th>
                    <th className="py-3 px-2 w-32">
                      <span>P8</span>
                      <span className="block text-[8.5px] text-slate-400 font-mono font-normal">3:25-4:15 PM</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {DAYS.map(day => {
                    const dayData = facultySchedule[day] || {};
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* ========================================================================= */
        /* 4. CLASS / DEPARTMENT MODE VIEW                                           */
        /* ========================================================================= */
        <>
          {/* STATS SUMMARY CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Weekly Periods</span>
                <p className="text-2xl font-black text-indigo-600">36 Hours</p>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">6 Periods / Day × 6 Days</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Smart Classrooms</span>
                <p className="text-2xl font-black text-emerald-600">18 Rooms</p>
                <p className="text-[11px] text-emerald-600 font-bold mt-1">Projector Enabled</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Active Labs</span>
                <p className="text-2xl font-black text-blue-600">8 Labs</p>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Hardware & Software</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Faculty Conflicts</span>
                <p className="text-2xl font-black text-emerald-600">0 Clashes</p>
                <p className="text-[11px] text-emerald-600 font-bold mt-1">100% Conflict-Free</p>
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
                  {DEPARTMENTS.filter(d => d !== 'All Departments').map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
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
                  <option value={1}>1st Year (Sem 1)</option>
                  <option value={2}>2nd Year (Sem 3)</option>
                  <option value={3}>3rd Year (Sem 5)</option>
                  <option value={4}>4th Year (Sem 7)</option>
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
                    <th className="py-4 px-3 w-40">
                      <span>P1</span>
                      <span className="block text-[9px] text-slate-400 font-mono font-normal">09:00 - 10:00 AM</span>
                    </th>
                    <th className="py-4 px-3 w-40">
                      <span>P2</span>
                      <span className="block text-[9px] text-slate-400 font-mono font-normal">10:00 - 11:00 AM</span>
                    </th>
                    <th className="py-4 px-1.5 w-10 bg-amber-50/60 text-amber-800 border-x border-amber-100 text-[10px]">
                      <Coffee className="w-3.5 h-3.5 mx-auto mb-0.5 text-amber-600" />
                      <span>TEA</span>
                    </th>
                    <th className="py-4 px-3 w-40">
                      <span>P3</span>
                      <span className="block text-[9px] text-slate-400 font-mono font-normal">11:15 - 12:15 PM</span>
                    </th>
                    <th className="py-4 px-1.5 w-10 bg-emerald-50/60 text-emerald-800 border-x border-emerald-100 text-[10px]">
                      <Utensils className="w-3.5 h-3.5 mx-auto mb-0.5 text-emerald-600" />
                      <span>LUNCH</span>
                    </th>
                    <th className="py-4 px-3 w-40">
                      <span>P4</span>
                      <span className="block text-[9px] text-slate-400 font-mono font-normal">01:15 - 02:15 PM</span>
                    </th>
                    <th className="py-4 px-3 w-40">
                      <span>P5</span>
                      <span className="block text-[9px] text-slate-400 font-mono font-normal">02:15 - 03:15 PM</span>
                    </th>
                    <th className="py-4 px-3 w-40">
                      <span>P6</span>
                      <span className="block text-[9px] text-slate-400 font-mono font-normal">03:15 - 04:15 PM</span>
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
                    {slotForm.day} • Period {slotForm.period} {viewMode === 'faculty' && currentStaff ? `• ${currentStaff.name}` : ''}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsEditSlotOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  value={slotForm.name}
                  onChange={(e) => setSlotForm({ ...slotForm, name: e.target.value })}
                  placeholder="e.g. Database Management Systems"
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

              {/* CLASSROOM OR LAB VENUE DROPDOWN SELECTOR */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Classroom / Lab Venue *
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">-- Choose Classroom or Lab --</option>
                  <optgroup label="Classrooms / Lecture Halls">
                    <option value="LH-101">LH-101 (Lecture Hall 1)</option>
                    <option value="LH-102">LH-102 (Lecture Hall 2)</option>
                    <option value="LH-201">LH-201 (Lecture Hall 3)</option>
                    <option value="LH-202">LH-202 (Lecture Hall 4)</option>
                    <option value="LH-301">LH-301 (Lecture Hall 5)</option>
                    <option value="LH-302">LH-302 (Lecture Hall 6)</option>
                    <option value="Room 101">Room 101</option>
                    <option value="Room 102">Room 102</option>
                    <option value="Room 201">Room 201</option>
                    <option value="Room 202">Room 202</option>
                    <option value="Seminar Hall 1">Seminar Hall 1</option>
                    <option value="Seminar Hall 2">Seminar Hall 2</option>
                  </optgroup>
                  <optgroup label="Laboratories">
                    <option value="Computer Lab 1">Computer Lab 1</option>
                    <option value="Computer Lab 2">Computer Lab 2</option>
                    <option value="Computer Lab 3">Computer Lab 3</option>
                    <option value="AI & ML Lab">AI & ML Lab</option>
                    <option value="Data Science Lab">Data Science Lab</option>
                    <option value="IoT & Embedded Lab">IoT & Embedded Lab</option>
                    <option value="Electronics Lab">Electronics Lab</option>
                    <option value="Hardware Lab">Hardware Lab</option>
                    <option value="Network Lab">Network Lab</option>
                    <option value="Project Lab">Project Lab</option>
                  </optgroup>
                  {slotForm.room && !['LH-101','LH-102','LH-201','LH-202','LH-301','LH-302','Room 101','Room 102','Room 201','Room 202','Seminar Hall 1','Seminar Hall 2','Computer Lab 1','Computer Lab 2','Computer Lab 3','AI & ML Lab','Data Science Lab','IoT & Embedded Lab','Electronics Lab','Hardware Lab','Network Lab','Project Lab'].includes(slotForm.room) && (
                    <optgroup label="Current Assigned Venue">
                      <option value={slotForm.room}>{slotForm.room}</option>
                    </optgroup>
                  )}
                </select>
              </div>

              {viewMode === 'class' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Faculty</label>
                  <input
                    type="text"
                    value={slotForm.faculty}
                    onChange={(e) => setSlotForm({ ...slotForm, faculty: e.target.value })}
                    placeholder="e.g. Dr. Sunita Rao (HOD)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>
              )}

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
                        {FACULTY_PERIODS.map(p => (
                          <th key={p.slot} className="p-1 border border-slate-300 text-[9.5px]">
                            P{p.slot} ({p.time.split('–')[0]})
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
                            {FACULTY_PERIODS.map(p => {
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
                        <th className="p-2 border border-slate-300">P1 (9-10)</th>
                        <th className="p-2 border border-slate-300">P2 (10-11)</th>
                        <th className="p-2 border border-slate-300">P3 (11:15-12:15)</th>
                        <th className="p-2 border border-slate-300">P4 (1:15-2:15)</th>
                        <th className="p-2 border border-slate-300">P5 (2:15-3:15)</th>
                        <th className="p-2 border border-slate-300">P6 (3:15-4:15)</th>
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
                className="px-5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Timetable Sheet</span>
              </button>
            </div>
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
