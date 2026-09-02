import React, { useState, useMemo } from 'react';
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
  Pencil
} from 'lucide-react';
import ModalPortal from './ModalPortal';

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

const INITIAL_SCHEDULES = {
  'Computer Science': {
    3: { // Year 3 (Sem 5)
      Monday: {
        1: { code: 'CS401', name: 'Database Management Systems', faculty: 'Dr. Sunita Rao (HOD)', room: 'LH-201 (Smart Class)', type: 'theory', color: 'blue' },
        2: { code: 'CS501', name: 'Operating Systems', faculty: 'Dr. Neeraj Gupta', room: 'LH-201 (Smart Class)', type: 'theory', color: 'indigo' },
        3: { code: 'CS502', name: 'AI & Machine Learning', faculty: 'Prof. Arvind Menon', room: 'LH-201 (Smart Class)', type: 'theory', color: 'purple' },
        4: { code: 'CS402', name: 'DBMS & SQL Laboratory (Batch 1 & 2)', faculty: 'Dr. Sunita Rao / Dr. Priya Sharma', room: 'Computer Lab 3', type: 'lab', color: 'emerald' },
        5: { code: 'CS402', name: 'DBMS & SQL Laboratory (Batch 1 & 2)', faculty: 'Dr. Sunita Rao / Dr. Priya Sharma', room: 'Computer Lab 3', type: 'lab', color: 'emerald' },
        6: { code: 'CS402', name: 'DBMS & SQL Laboratory (Batch 1 & 2)', faculty: 'Dr. Sunita Rao / Dr. Priya Sharma', room: 'Computer Lab 3', type: 'lab', color: 'emerald' }
      },
      Tuesday: {
        1: { code: 'CS502', name: 'AI & Machine Learning', faculty: 'Prof. Arvind Menon', room: 'LH-201 (Smart Class)', type: 'theory', color: 'purple' },
        2: { code: 'CS401', name: 'Database Management Systems', faculty: 'Dr. Sunita Rao (HOD)', room: 'LH-201 (Smart Class)', type: 'theory', color: 'blue' },
        3: { code: 'MA501', name: 'Discrete Mathematics & Graph Theory', faculty: 'Dr. S. Ramanujan', room: 'LH-201 (Smart Class)', type: 'theory', color: 'amber' },
        4: { code: 'CS501', name: 'Operating Systems', faculty: 'Dr. Neeraj Gupta', room: 'LH-201 (Smart Class)', type: 'theory', color: 'indigo' },
        5: { code: 'PE501', name: 'Professional Elective: Cloud Computing', faculty: 'Dr. Priya Sharma', room: 'LH-201 (Smart Class)', type: 'elective', color: 'rose' },
        6: { code: 'LIB', name: 'Library & Online Research Hour', faculty: 'Dr. Neeraj Gupta', room: 'Central Digital Library', type: 'library', color: 'teal' }
      },
      Wednesday: {
        1: { code: 'CS501', name: 'Operating Systems', faculty: 'Dr. Neeraj Gupta', room: 'LH-201 (Smart Class)', type: 'theory', color: 'indigo' },
        2: { code: 'MA501', name: 'Discrete Mathematics & Graph Theory', faculty: 'Dr. S. Ramanujan', room: 'LH-201 (Smart Class)', type: 'theory', color: 'amber' },
        3: { code: 'CS401', name: 'Database Management Systems', faculty: 'Dr. Sunita Rao (HOD)', room: 'LH-201 (Smart Class)', type: 'theory', color: 'blue' },
        4: { code: 'CS503', name: 'AI & Neural Networks Lab (Batch 1 & 2)', faculty: 'Prof. Arvind Menon / Dr. Neeraj Gupta', room: 'AI & Robotics Lab 2', type: 'lab', color: 'emerald' },
        5: { code: 'CS503', name: 'AI & Neural Networks Lab (Batch 1 & 2)', faculty: 'Prof. Arvind Menon / Dr. Neeraj Gupta', room: 'AI & Robotics Lab 2', type: 'lab', color: 'emerald' },
        6: { code: 'CS503', name: 'AI & Neural Networks Lab (Batch 1 & 2)', faculty: 'Prof. Arvind Menon / Dr. Neeraj Gupta', room: 'AI & Robotics Lab 2', type: 'lab', color: 'emerald' }
      },
      Thursday: {
        1: { code: 'PE501', name: 'Professional Elective: Cloud Computing', faculty: 'Dr. Priya Sharma', room: 'LH-201 (Smart Class)', type: 'elective', color: 'rose' },
        2: { code: 'CS502', name: 'AI & Machine Learning', faculty: 'Prof. Arvind Menon', room: 'LH-201 (Smart Class)', type: 'theory', color: 'purple' },
        3: { code: 'CS401', name: 'Database Management Systems', faculty: 'Dr. Sunita Rao (HOD)', room: 'LH-201 (Smart Class)', type: 'theory', color: 'blue' },
        4: { code: 'MA501', name: 'Discrete Mathematics & Graph Theory', faculty: 'Dr. S. Ramanujan', room: 'LH-201 (Smart Class)', type: 'theory', color: 'amber' },
        5: { code: 'CS501', name: 'Operating Systems', faculty: 'Dr. Neeraj Gupta', room: 'LH-201 (Smart Class)', type: 'theory', color: 'indigo' },
        6: { code: 'TUT', name: 'Tutorial & Doubts Remedial Session', faculty: 'Dr. Sunita Rao (HOD)', room: 'LH-201 (Smart Class)', type: 'tutorial', color: 'cyan' }
      },
      Friday: {
        1: { code: 'MA501', name: 'Discrete Mathematics & Graph Theory', faculty: 'Dr. S. Ramanujan', room: 'LH-201 (Smart Class)', type: 'theory', color: 'amber' },
        2: { code: 'CS501', name: 'Operating Systems', faculty: 'Dr. Neeraj Gupta', room: 'LH-201 (Smart Class)', type: 'theory', color: 'indigo' },
        3: { code: 'PE501', name: 'Professional Elective: Cloud Computing', faculty: 'Dr. Priya Sharma', room: 'LH-201 (Smart Class)', type: 'elective', color: 'rose' },
        4: { code: 'CS502', name: 'AI & Machine Learning', faculty: 'Prof. Arvind Menon', room: 'LH-201 (Smart Class)', type: 'theory', color: 'purple' },
        5: { code: 'PROJ', name: 'Mini-Project / Capstone Guidance', faculty: 'Dr. Sunita Rao / Prof. Arvind Menon', room: 'Innovation Lab', type: 'project', color: 'purple' },
        6: { code: 'SPT', name: 'Sports, NCC & Physical Wellness', faculty: 'Prof. Physical Director', room: 'Sports Complex / Ground', type: 'sports', color: 'emerald' }
      },
      Saturday: {
        1: { code: 'CS401', name: 'Database Management Systems', faculty: 'Dr. Sunita Rao (HOD)', room: 'LH-201 (Smart Class)', type: 'theory', color: 'blue' },
        2: { code: 'CS502', name: 'AI & Machine Learning', faculty: 'Prof. Arvind Menon', room: 'LH-201 (Smart Class)', type: 'theory', color: 'purple' },
        3: { code: 'SEM', name: 'Technical Seminar & Paper Presentation', faculty: 'Dr. Priya Sharma', room: 'Seminar Hall 1', type: 'seminar', color: 'amber' },
        4: { code: 'CLUB', name: 'Coding Club & Hackathon Practice', faculty: 'Prof. Arvind Menon', room: 'Computer Lab 3', type: 'club', color: 'indigo' },
        5: { code: 'FREE', name: 'Self-Study & Mentorship Consultation', faculty: 'Faculty Mentors', room: 'LH-201', type: 'free', color: 'slate' },
        6: { code: 'FREE', name: 'Weekend Wrap-up', faculty: '--', room: '--', type: 'free', color: 'slate' }
      }
    }
  }
};

const FACULTY_MEMBERS = [
  'Dr. Sunita Rao (HOD - CSE)',
  'Prof. Ramesh Kumar (HOD - ECE)',
  'Dr. Anita Desai (HOD - MBA)',
  'Dr. Pradeep Joshi (HOD - MECH)',
  'Dr. Kavitha Singh (HOD - CIVIL)',
  'Prof. Meena Iyer (HOD - BCA)',
  'Dr. Neeraj Gupta (CSE)',
  'Prof. Arvind Menon (CSE)',
  'Dr. Priya Sharma (CSE)'
];

export default function TimetableManagement() {
  // Schedules Matrix State (Editable & Persistent per Dept/Year)
  const [schedules, setSchedules] = useState(INITIAL_SCHEDULES);

  // Filters State
  const [selectedDept, setSelectedDept] = useState('Computer Science');
  const [selectedYear, setSelectedYear] = useState(3);
  const [selectedSem, setSelectedSem] = useState('Sem 5');
  const [selectedSection, setSelectedSection] = useState('Section A');

  // Modals & Notifications
  const [isEditSlotOpen, setIsEditSlotOpen] = useState(false);
  const [selectedSlotData, setSelectedSlotData] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Lock background scroll when any modal is open
  React.useEffect(() => {
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

  // Slot Form State
  const [slotForm, setSlotForm] = useState({
    day: 'Monday',
    period: 1,
    code: 'CS401',
    name: 'Database Management Systems',
    faculty: 'Dr. Sunita Rao (HOD - CSE)',
    room: 'LH-201 (Smart Class)',
    type: 'theory'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Get active schedule for selected department and year
  const activeWeekSchedule = useMemo(() => {
    if (schedules[selectedDept] && schedules[selectedDept][selectedYear]) {
      return schedules[selectedDept][selectedYear];
    }
    // Fallback template if not yet defined
    return schedules['Computer Science']?.[3] || {};
  }, [schedules, selectedDept, selectedYear]);

  // Open Edit Slot Modal
  const handleOpenEditSlot = (day, periodNum, currentSlot) => {
    setSelectedSlotData({ day, periodNum, currentSlot });
    setSlotForm({
      day,
      period: periodNum,
      code: currentSlot?.code || 'CS401',
      name: currentSlot?.name || 'Database Management Systems',
      faculty: currentSlot?.faculty || 'Dr. Sunita Rao (HOD - CSE)',
      room: currentSlot?.room || 'LH-201 (Smart Class)',
      type: currentSlot?.type || 'theory'
    });
    setIsEditSlotOpen(true);
  };

  // Save Slot Edit into React State
  const handleSaveSlot = (e) => {
    e.preventDefault();

    const colorMap = {
      theory: 'blue',
      lab: 'emerald',
      elective: 'rose',
      tutorial: 'amber',
      library: 'teal',
      project: 'purple',
      sports: 'emerald'
    };

    const updatedSlot = {
      code: slotForm.code.trim().toUpperCase(),
      name: slotForm.name.trim(),
      faculty: slotForm.faculty,
      room: slotForm.room.trim() || 'LH-201 (Smart Class)',
      type: slotForm.type,
      color: colorMap[slotForm.type] || 'blue'
    };

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
  };

  // Clear / Remove Slot from Timetable
  const handleClearSlot = () => {
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
  };

  // Export Timetable CSV
  const handleExportCSV = () => {
    const headers = ['Day', 'Period 1 (9-10 AM)', 'Period 2 (10-11 AM)', 'Period 3 (11:15-12:15)', 'Period 4 (1:15-2:15)', 'Period 5 (2:15-3:15)', 'Period 6 (3:15-4:15)'];
    const rows = DAYS.map(day => {
      const d = activeWeekSchedule[day] || {};
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
  };

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

      {/* 1. TOP HEADER & QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
              Academic Schedule Planner
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-semibold">Odd Semester 2026-2027 (R24 Regulations)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Class Weekly Timetable</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Master weekly class schedule matrix, period timings, subject allocations, and faculty assignments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            title="Download CSV Class Timetable"
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
            <span>Print Official Timetable</span>
          </button>
        </div>
      </div>

      {/* 2. STATS SUMMARY CARDS */}
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

      {/* 3. CLASS SELECTORS BAR */}
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
            Venue: LH-201 (Smart Class)
          </span>
        </div>
      </div>

      {/* 4. MASTER TIMETABLE MATRIX GRID */}
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
                const daySchedule = activeWeekSchedule[day] || {};
                return (
                  <tr key={day} className="hover:bg-slate-50/40 transition-colors">
                    {/* Day Label */}
                    <td className="py-4 px-4 font-black text-slate-900 bg-slate-50/50 border-r border-slate-200 text-left">
                      {day}
                    </td>

                    {/* P1 */}
                    <td className="p-2 align-top">
                      <SlotCell slot={daySchedule[1]} onEdit={() => handleOpenEditSlot(day, 1, daySchedule[1])} />
                    </td>

                    {/* P2 */}
                    <td className="p-2 align-top">
                      <SlotCell slot={daySchedule[2]} onEdit={() => handleOpenEditSlot(day, 2, daySchedule[2])} />
                    </td>

                    {/* Tea Break Column */}
                    <td className="p-1 bg-amber-50/30 border-x border-amber-100 text-center text-[10px] font-bold text-amber-700 writing-vertical">
                      15m
                    </td>

                    {/* P3 */}
                    <td className="p-2 align-top">
                      <SlotCell slot={daySchedule[3]} onEdit={() => handleOpenEditSlot(day, 3, daySchedule[3])} />
                    </td>

                    {/* Lunch Break Column */}
                    <td className="p-1 bg-emerald-50/30 border-x border-emerald-100 text-center text-[10px] font-bold text-emerald-700 writing-vertical">
                      1h
                    </td>

                    {/* P4 */}
                    <td className="p-2 align-top">
                      <SlotCell slot={daySchedule[4]} onEdit={() => handleOpenEditSlot(day, 4, daySchedule[4])} />
                    </td>

                    {/* P5 */}
                    <td className="p-2 align-top">
                      <SlotCell slot={daySchedule[5]} onEdit={() => handleOpenEditSlot(day, 5, daySchedule[5])} />
                    </td>

                    {/* P6 */}
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

      {/* 5. LEGEND FOR SUBJECT TYPES */}
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
      {/* 6. MODAL: EDIT TIMETABLE SLOT                                             */}
      {/* ========================================================================= */}
      {isEditSlotOpen && (
        <ModalPortal isOpen={isEditSlotOpen} onClose={() => setIsEditSlotOpen(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">Edit Class Timetable Slot</h3>
                  <p className="text-[11px] text-slate-500">{slotForm.day} • Period {slotForm.period}</p>
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
                    placeholder="CS304"
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
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Faculty</label>
                <select
                  value={slotForm.faculty}
                  onChange={(e) => setSlotForm({ ...slotForm, faculty: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                >
                  {FACULTY_MEMBERS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Classroom / Lab Venue</label>
                <input
                  type="text"
                  value={slotForm.room}
                  onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
                  placeholder="LH-201 (Smart Class)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClearSlot}
                  className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold rounded-xl text-xs transition-all"
                >
                  Clear / Remove Slot
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditSlotOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Slot</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: PRINT OFFICIAL CLASS TIMETABLE                                   */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <ModalPortal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">Official Class Timetable Sheet</h3>
                <p className="text-xs text-slate-500">Vidya Campus Automation System • Academic Year 2026-2027</p>
              </div>
              <button onClick={() => setIsPrintModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-50/80 rounded-2xl border-2 border-slate-200 space-y-4 text-center">
              <div>
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block">DEPARTMENT OF {selectedDept.toUpperCase()}</span>
                <h4 className="text-base font-black text-slate-900 mt-0.5">
                  Class Timetable — Year {selectedYear} ({selectedSem}) • {selectedSection}
                </h4>
                <p className="text-xs text-slate-500 font-semibold">Room: LH-201 (Smart Class) • Effective from: 01-Aug-2026</p>
              </div>

              {/* Matrix Preview */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-center">
                    <tr>
                      <th className="p-2 border">Day</th>
                      <th className="p-2 border">P1 (9-10)</th>
                      <th className="p-2 border">P2 (10-11)</th>
                      <th className="p-2 border">P3 (11:15-12:15)</th>
                      <th className="p-2 border">P4 (1:15-2:15)</th>
                      <th className="p-2 border">P5 (2:15-3:15)</th>
                      <th className="p-2 border">P6 (3:15-4:15)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {DAYS.map(day => {
                      const d = activeWeekSchedule[day] || {};
                      return (
                        <tr key={day} className="text-center">
                          <td className="p-2 font-bold bg-slate-50 border text-left">{day}</td>
                          <td className="p-1.5 border">{d[1]?.code || '--'}</td>
                          <td className="p-1.5 border">{d[2]?.code || '--'}</td>
                          <td className="p-1.5 border">{d[3]?.code || '--'}</td>
                          <td className="p-1.5 border">{d[4]?.code || '--'}</td>
                          <td className="p-1.5 border">{d[5]?.code || '--'}</td>
                          <td className="p-1.5 border">{d[6]?.code || '--'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs font-bold text-slate-700">
                <div>
                  <div className="h-8"></div>
                  <span className="border-t border-slate-300 block pt-1">Timetable Coordinator</span>
                </div>
                <div>
                  <div className="h-8 font-serif italic text-indigo-900">Dr. Sunita Rao</div>
                  <span className="border-t border-slate-300 block pt-1">Head of Department (HOD)</span>
                </div>
                <div>
                  <div className="h-8"></div>
                  <span className="border-t border-slate-300 block pt-1">Principal / Dean</span>
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
              <button
                onClick={() => showToast('Printing Official Timetable Sheet...')}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Timetable</span>
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
        className="h-24 rounded-2xl border-2 border-dashed border-slate-200/80 p-2.5 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all cursor-pointer group"
      >
        <span className="text-[11px] font-bold group-hover:text-indigo-600">+ Add Slot</span>
      </div>
    );
  }

  const colorStyles = {
    blue: 'bg-blue-50/80 border-blue-200/90 text-blue-900 hover:border-blue-400',
    indigo: 'bg-indigo-50/80 border-indigo-200/90 text-indigo-900 hover:border-indigo-400',
    purple: 'bg-purple-50/80 border-purple-200/90 text-purple-900 hover:border-purple-400',
    emerald: 'bg-emerald-50/80 border-emerald-200/90 text-emerald-900 hover:border-emerald-400',
    amber: 'bg-amber-50/80 border-amber-200/90 text-amber-900 hover:border-amber-400',
    rose: 'bg-rose-50/80 border-rose-200/90 text-rose-900 hover:border-rose-400',
    cyan: 'bg-cyan-50/80 border-cyan-200/90 text-cyan-900 hover:border-cyan-400',
    teal: 'bg-teal-50/80 border-teal-200/90 text-teal-900 hover:border-teal-400',
    slate: 'bg-slate-50 border-slate-200 text-slate-600'
  };

  const style = colorStyles[slot.color] || colorStyles.blue;

  return (
    <div
      onClick={onEdit}
      className={`h-24 rounded-2xl border p-2.5 flex flex-col justify-between transition-all cursor-pointer shadow-xs hover:shadow-md ${style}`}
    >
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-mono font-black text-[10px] bg-white/80 px-1.5 py-0.5 rounded shadow-xs">
            {slot.code}
          </span>
          <span className="text-[9px] uppercase font-bold opacity-75">{slot.type}</span>
        </div>
        <p className="font-extrabold text-[11px] leading-tight line-clamp-2 mt-1">
          {slot.name}
        </p>
      </div>

      <div className="pt-1 border-t border-black/5 flex items-center justify-between text-[10px] opacity-85">
        <span className="truncate font-semibold max-w-[90px]">{slot.faculty}</span>
        <span className="font-mono font-bold shrink-0">{slot.room.split(' ')[0]}</span>
      </div>
    </div>
  );
}
