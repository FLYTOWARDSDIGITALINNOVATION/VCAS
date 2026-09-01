import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Search,
  Calendar,
  Clock,
  Users,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Printer,
  Plus,
  Eye,
  Filter,
  Edit,
  Trash2,
  Send,
  X,
  Check,
  Building2,
  GraduationCap,
  BookOpen,
  QrCode,
  ShieldCheck,
  Lock,
  Unlock,
  FileText,
  Layers,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

const DEPARTMENTS = [
  'All Departments',
  'Computer Science',
  'Electronics',
  'MBA',
  'Mechanical',
  'Civil',
  'BCA'
];

const EXAM_SESSIONS = [
  'All Sessions',
  'End Semester Examinations - Nov/Dec 2026',
  'Continuous Internal Assessment (CIA-2) - Oct 2026',
  'Continuous Internal Assessment (CIA-1) - Aug 2026',
  'Supplementary & Arrear Examinations - Dec 2026'
];

const INITIAL_EXAMS = [
  {
    id: 1,
    code: 'CS401',
    name: 'Database Management Systems',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    date: '2026-11-18',
    session: 'FN (09:30 AM - 12:30 PM)',
    hall: 'Hall 101 (Ramanujan Block)',
    qpCode: 'QP-7104-CS',
    invigilator: 'Prof. Ramesh Kumar (ECE)',
    totalStudents: 60,
    type: 'End Semester Theory',
    status: 'Scheduled',
    maxMarks: 100,
    ciaMax: 40,
    eseMax: 60
  },
  {
    id: 2,
    code: 'CS502',
    name: 'Artificial Intelligence & Machine Learning',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    date: '2026-11-20',
    session: 'FN (09:30 AM - 12:30 PM)',
    hall: 'Hall 102 (Turing Block)',
    qpCode: 'QP-7105-CS',
    invigilator: 'Dr. Anita Desai (MBA)',
    totalStudents: 60,
    type: 'End Semester Theory',
    status: 'Scheduled',
    maxMarks: 100,
    ciaMax: 40,
    eseMax: 60
  },
  {
    id: 3,
    code: 'CS402',
    name: 'DBMS & SQL Laboratory Practical',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    date: '2026-11-24',
    session: 'AN (01:30 PM - 04:30 PM)',
    hall: 'Lab 3 (Advanced Computing)',
    qpCode: 'QP-7106-PR',
    invigilator: 'Dr. Sunita Rao (CSE)',
    totalStudents: 60,
    type: 'Practical Lab Exam',
    status: 'Scheduled',
    maxMarks: 100,
    ciaMax: 40,
    eseMax: 60
  },
  {
    id: 4,
    code: 'EC201',
    name: 'Electronic Circuits & Design',
    department: 'Electronics',
    year: 2,
    sem: 'Sem 3',
    date: '2026-11-19',
    session: 'FN (09:30 AM - 12:30 PM)',
    hall: 'Hall 201 (Bose Block)',
    qpCode: 'QP-7201-EC',
    invigilator: 'Dr. Pradeep Joshi (MECH)',
    totalStudents: 55,
    type: 'End Semester Theory',
    status: 'Scheduled',
    maxMarks: 100,
    ciaMax: 40,
    eseMax: 60
  },
  {
    id: 5,
    code: 'MB101',
    name: 'Principles of Management & Organizational Behavior',
    department: 'MBA',
    year: 1,
    sem: 'Sem 1',
    date: '2026-11-18',
    session: 'AN (01:30 PM - 04:30 PM)',
    hall: 'Hall 301 (Management Wing)',
    qpCode: 'QP-7301-MB',
    invigilator: 'Dr. Kavitha Singh (CIVIL)',
    totalStudents: 45,
    type: 'End Semester Theory',
    status: 'Scheduled',
    maxMarks: 100,
    ciaMax: 40,
    eseMax: 60
  },
  {
    id: 6,
    code: 'ME401',
    name: 'CAD/CAM Modeling & Robotics',
    department: 'Mechanical',
    year: 3,
    sem: 'Sem 5',
    date: '2026-11-21',
    session: 'FN (09:30 AM - 12:30 PM)',
    hall: 'Hall 104 (Visvesvaraya Block)',
    qpCode: 'QP-7401-ME',
    invigilator: 'Prof. Meena Iyer (BCA)',
    totalStudents: 50,
    type: 'End Semester Theory',
    status: 'Scheduled',
    maxMarks: 100,
    ciaMax: 40,
    eseMax: 60
  }
];

const INITIAL_STUDENT_MARKS = [
  {
    id: 1,
    rollNo: '22CS001',
    regNo: '710022104001',
    name: 'Aadhavan Kumar',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    attendance: 93.3,
    feeCleared: true,
    cia1: 45, // out of 50
    cia2: 48, // out of 50
    assignment: 10, // out of 10
    ciaTotal: 38, // scaled to 40
    eseMarks: 54, // out of 60
    totalMarks: 92,
    grade: 'O',
    gradePoint: 10,
    status: 'Eligible',
    result: 'PASS',
    sgpa: 9.42,
    cgpa: 9.28
  },
  {
    id: 2,
    rollNo: '22CS002',
    regNo: '710022104002',
    name: 'Abinaya Sundaram',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    attendance: 90.0,
    feeCleared: true,
    cia1: 42,
    cia2: 44,
    assignment: 9,
    ciaTotal: 35,
    eseMarks: 50,
    totalMarks: 85,
    grade: 'A+',
    gradePoint: 9,
    status: 'Eligible',
    result: 'PASS',
    sgpa: 8.85,
    cgpa: 8.74
  },
  {
    id: 3,
    rollNo: '22CS003',
    regNo: '710022104003',
    name: 'Balaji Venkatesh',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    attendance: 70.0, // SHORTAGE ALERT (<75%)
    feeCleared: true,
    cia1: 28,
    cia2: 30,
    assignment: 6,
    ciaTotal: 24,
    eseMarks: 32,
    totalMarks: 56,
    grade: 'B',
    gradePoint: 6,
    status: 'Blocked (Shortage <75%)',
    result: 'CONDONATION REQ',
    sgpa: 6.80,
    cgpa: 6.95
  },
  {
    id: 4,
    rollNo: '22CS004',
    regNo: '710022104004',
    name: 'Deepika Ramanathan',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    attendance: 98.3,
    feeCleared: true,
    cia1: 49,
    cia2: 50,
    assignment: 10,
    ciaTotal: 40,
    eseMarks: 58,
    totalMarks: 98,
    grade: 'O',
    gradePoint: 10,
    status: 'Eligible',
    result: 'PASS',
    sgpa: 9.85,
    cgpa: 9.72
  },
  {
    id: 5,
    rollNo: '22CS005',
    regNo: '710022104005',
    name: 'Dinesh Karthik',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    attendance: 60.0, // CRITICAL SHORTAGE (<75%)
    feeCleared: false, // FEE DUE
    cia1: 20,
    cia2: 22,
    assignment: 5,
    ciaTotal: 18,
    eseMarks: 0,
    totalMarks: 18,
    grade: 'U',
    gradePoint: 0,
    status: 'Blocked (Shortage & Fee)',
    result: 'DETAINED',
    sgpa: 0.00,
    cgpa: 5.40
  },
  {
    id: 6,
    rollNo: '22CS006',
    regNo: '710022104006',
    name: 'Harini Jayaraman',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    attendance: 91.6,
    feeCleared: true,
    cia1: 44,
    cia2: 45,
    assignment: 9,
    ciaTotal: 36,
    eseMarks: 52,
    totalMarks: 88,
    grade: 'A+',
    gradePoint: 9,
    status: 'Eligible',
    result: 'PASS',
    sgpa: 9.10,
    cgpa: 8.95
  },
  {
    id: 7,
    rollNo: '23EC012',
    regNo: '710023106012',
    name: 'Naveen Chandran',
    department: 'Electronics',
    year: 2,
    sem: 'Sem 3',
    attendance: 92.7,
    feeCleared: true,
    cia1: 43,
    cia2: 46,
    assignment: 9,
    ciaTotal: 36,
    eseMarks: 51,
    totalMarks: 87,
    grade: 'A+',
    gradePoint: 9,
    status: 'Eligible',
    result: 'PASS',
    sgpa: 8.95,
    cgpa: 8.80
  },
  {
    id: 8,
    rollNo: '24MB005',
    regNo: '710024631005',
    name: 'Rahul Mukund',
    department: 'MBA',
    year: 1,
    sem: 'Sem 1',
    attendance: 94.4,
    feeCleared: true,
    cia1: 46,
    cia2: 47,
    assignment: 10,
    ciaTotal: 38,
    eseMarks: 55,
    totalMarks: 93,
    grade: 'O',
    gradePoint: 10,
    status: 'Eligible',
    result: 'PASS',
    sgpa: 9.50,
    cgpa: 9.50
  }
];

const INITIAL_HALLS = [
  {
    id: 1,
    hallName: 'Hall 101 - Ramanujan Block',
    capacity: 60,
    allocatedStudents: 60,
    departments: 'CSE (Sem 5) + ECE (Sem 3)',
    rollRange: '22CS001 - 22CS030 & 23EC001 - 23EC030',
    invigilator: 'Prof. Ramesh Kumar',
    invigilatorDept: 'Electronics',
    status: 'Fully Allocated'
  },
  {
    id: 2,
    hallName: 'Hall 102 - Alan Turing Block',
    capacity: 60,
    allocatedStudents: 60,
    departments: 'CSE (Sem 5) + MECH (Sem 5)',
    rollRange: '22CS031 - 22CS060 & 22ME001 - 22ME030',
    invigilator: 'Dr. Anita Desai',
    invigilatorDept: 'MBA',
    status: 'Fully Allocated'
  },
  {
    id: 3,
    hallName: 'Hall 201 - Jagadish Chandra Bose Block',
    capacity: 60,
    allocatedStudents: 55,
    departments: 'ECE (Sem 3) + CIVIL (Sem 5)',
    rollRange: '23EC031 - 23EC060 & 22CE001 - 22CE025',
    invigilator: 'Dr. Pradeep Joshi',
    invigilatorDept: 'Mechanical',
    status: 'Allocated'
  },
  {
    id: 4,
    hallName: 'Hall 301 - Management & MBA Wing',
    capacity: 50,
    allocatedStudents: 45,
    departments: 'MBA (Sem 1) + BCA (Sem 3)',
    rollRange: '24MB001 - 24MB030 & 23BCA001 - 23BCA015',
    invigilator: 'Dr. Kavitha Singh',
    invigilatorDept: 'Civil',
    status: 'Allocated'
  }
];

export default function ExaminationManagement() {
  // Tabs: 'schedules', 'hall-tickets', 'internal-marks', 'results', 'seating'
  const [activeTab, setActiveTab] = useState('schedules');

  // Exam List State
  const [examsList, setExamsList] = useState(INITIAL_EXAMS);
  const [studentMarksList, setStudentMarksList] = useState(INITIAL_STUDENT_MARKS);
  const [hallsList, setHallsList] = useState(INITIAL_HALLS);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedSession, setSelectedSession] = useState('All Sessions');
  const [selectedType, setSelectedType] = useState('ALL');

  // Modals State
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [viewingHallTicketStudent, setViewingHallTicketStudent] = useState(null);
  const [viewingGradeCardStudent, setViewingGradeCardStudent] = useState(null);
  const [isMarksLocked, setIsMarksLocked] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Schedule Form State
  const [scheduleForm, setScheduleForm] = useState({
    code: 'CS601',
    name: '',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    date: '2026-11-25',
    session: 'FN (09:30 AM - 12:30 PM)',
    hall: 'Hall 101 (Ramanujan Block)',
    qpCode: 'QP-7108-CS',
    invigilator: 'Dr. Sunita Rao',
    type: 'End Semester Theory'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Exam Schedules
  const filteredExams = useMemo(() => {
    return examsList.filter(e => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        e.code.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        e.hall.toLowerCase().includes(q) ||
        e.qpCode.toLowerCase().includes(q)
      );

      const matchesDept = selectedDept === 'All Departments' || e.department === selectedDept;
      const matchesType = selectedType === 'ALL' || e.type === selectedType;

      return matchesSearch && matchesDept && matchesType;
    });
  }, [examsList, searchQuery, selectedDept, selectedType]);

  // Filtered Students for Hall Tickets / Results
  const filteredStudents = useMemo(() => {
    return studentMarksList.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        s.name.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        s.regNo.includes(q) ||
        s.department.toLowerCase().includes(q)
      );

      const matchesDept = selectedDept === 'All Departments' || s.department === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [studentMarksList, searchQuery, selectedDept]);

  // Stats Counters
  const totalEligible = useMemo(() => {
    return studentMarksList.filter(s => s.status === 'Eligible').length;
  }, [studentMarksList]);

  const totalBlocked = useMemo(() => {
    return studentMarksList.filter(s => s.status.includes('Blocked')).length;
  }, [studentMarksList]);

  // Save New Exam Schedule
  const handleSaveSchedule = (e) => {
    e.preventDefault();
    if (!scheduleForm.name.trim() || !scheduleForm.code.trim()) {
      alert('Please fill in Subject Name and Code');
      return;
    }

    const newExam = {
      id: Date.now(),
      ...scheduleForm,
      totalStudents: 60,
      status: 'Scheduled',
      maxMarks: 100,
      ciaMax: 40,
      eseMax: 60
    };

    setExamsList(prev => [newExam, ...prev]);
    setIsAddScheduleOpen(false);
    setScheduleForm({
      code: 'CS601',
      name: '',
      department: 'Computer Science',
      year: 3,
      sem: 'Sem 5',
      date: '2026-11-25',
      session: 'FN (09:30 AM - 12:30 PM)',
      hall: 'Hall 101 (Ramanujan Block)',
      qpCode: 'QP-7108-CS',
      invigilator: 'Dr. Sunita Rao',
      type: 'End Semester Theory'
    });
    showToast('New Exam Schedule added to Timetable!');
  };

  // Update Student CIA Marks dynamically
  const handleUpdateMarks = (id, field, value) => {
    const numVal = Math.max(0, Math.min(field === 'assignment' ? 10 : 50, Number(value) || 0));
    setStudentMarksList(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, [field]: numVal };
        // Recompute Scaled CIA: (CIA1 + CIA2)/100 * 30 + Assignment (out of 10) = 40 max
        const ciaAvg30 = ((updated.cia1 + updated.cia2) / 100) * 30;
        const totalCIA = Math.round(ciaAvg30 + updated.assignment);
        const total = totalCIA + (updated.eseMarks || 0);

        let gr = 'U';
        let gp = 0;
        if (total >= 90) { gr = 'O'; gp = 10; }
        else if (total >= 80) { gr = 'A+'; gp = 9; }
        else if (total >= 70) { gr = 'A'; gp = 8; }
        else if (total >= 60) { gr = 'B+'; gp = 7; }
        else if (total >= 50) { gr = 'B'; gp = 6; }
        else if (total >= 40) { gr = 'C'; gp = 5; }

        return {
          ...updated,
          ciaTotal: totalCIA,
          totalMarks: total,
          grade: gr,
          gradePoint: gp,
          result: total >= 50 ? 'PASS' : 'REAPPEAR'
        };
      }
      return s;
    }));
  };

  // Export Timetable CSV
  const handleExportTimetableCSV = () => {
    const headers = ['Subject Code', 'Subject Name', 'Department', 'Year & Sem', 'Date', 'Session', 'Exam Hall', 'QP Code', 'Invigilator', 'Type'];
    const rows = filteredExams.map(e => [
      `"${e.code}"`,
      `"${e.name}"`,
      `"${e.department}"`,
      `"Year ${e.year} - ${e.sem}"`,
      `"${e.date}"`,
      `"${e.session}"`,
      `"${e.hall}"`,
      `"${e.qpCode}"`,
      `"${e.invigilator}"`,
      `"${e.type}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vidyapeeth_Exam_Timetable_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exam timetable exported successfully as CSV!');
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
            <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
              Controller of Examinations (CoE)
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-semibold">Academic Year 2026-2027 (Odd Sem)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Examination Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Exam schedules, timetable publishing, hall ticket eligibility, CIA internal marks, and End Semester grading.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportTimetableCSV}
            title="Download CSV Exam Timetable"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Timetable</span>
          </button>

          <button
            onClick={() => setIsAddScheduleOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs shadow-rose-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Exam Schedule</span>
          </button>
        </div>
      </div>

      {/* 2. TOP METRIC STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Scheduled Exams</span>
            <p className="text-2xl font-black text-rose-600">{examsList.length}</p>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">Theory & Practical</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Eligible Students</span>
            <p className="text-2xl font-black text-emerald-600">{totalEligible}</p>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">Hall Tickets Ready</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Blocked / Shortage</span>
            <p className="text-2xl font-black text-amber-600">{totalBlocked}</p>
            <p className="text-[11px] text-amber-600 font-bold mt-1">&lt;75% Attendance</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Average SGPA</span>
            <p className="text-2xl font-black text-blue-600">8.92</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Overall College Avg</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Exam Halls Active</span>
            <p className="text-2xl font-black text-indigo-600">{hallsList.length}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">235 Seats Allocated</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex items-center border-b border-slate-200 text-xs sm:text-sm overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'schedules'
              ? 'border-rose-600 text-rose-600 bg-rose-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Exam Schedules & Timetable ({filteredExams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hall-tickets')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'hall-tickets'
              ? 'border-rose-600 text-rose-600 bg-rose-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Hall Ticket & Eligibility ({filteredStudents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('internal-marks')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'internal-marks'
              ? 'border-rose-600 text-rose-600 bg-rose-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <Edit className="w-4 h-4" />
          <span>CIA Internal Marks Entry</span>
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'results'
              ? 'border-rose-600 text-rose-600 bg-rose-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Results & Grade Sheets</span>
        </button>

        <button
          onClick={() => setActiveTab('seating')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'seating'
              ? 'border-rose-600 text-rose-600 bg-rose-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Hall Seating & Invigilation</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB 1: EXAM SCHEDULES & TIMETABLE                                      */}
      {/* ========================================================================= */}
      {activeTab === 'schedules' && (
        <div className="space-y-5">
          {/* Filters Row */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search timetable by subject code, name, hall, or QP code..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-rose-500 focus:outline-none transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-rose-500 focus:outline-none cursor-pointer"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Exam Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-rose-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Exam Types</option>
                  <option value="End Semester Theory">End Semester Theory</option>
                  <option value="Practical Lab Exam">Practical Lab Exam</option>
                  <option value="CIA Midterm">CIA Midterm</option>
                </select>
              </div>
            </div>
          </div>

          {/* Timetable Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">DATE & SESSION</th>
                    <th className="py-4 px-4">SUBJECT CODE & NAME</th>
                    <th className="py-4 px-4">DEPARTMENT</th>
                    <th className="py-4 px-4">EXAM HALL & QP</th>
                    <th className="py-4 px-4">CHIEF INVIGILATOR</th>
                    <th className="py-4 px-6 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredExams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-rose-50/20 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-extrabold text-slate-900 leading-tight">{exam.date}</p>
                        <span className="text-[11px] text-rose-600 font-bold">{exam.session}</span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mr-2 text-xs">
                          {exam.code}
                        </span>
                        <span className="font-bold text-slate-900">{exam.name}</span>
                        <span className="block text-[11px] text-slate-400 mt-0.5">{exam.type}</span>
                      </td>

                      <td className="py-4 px-4 font-semibold text-slate-700 text-xs">
                        {exam.department} • {exam.sem}
                      </td>

                      <td className="py-4 px-4 text-xs">
                        <p className="font-bold text-slate-800">{exam.hall}</p>
                        <span className="font-mono text-[11px] text-slate-400">QP: {exam.qpCode}</span>
                      </td>

                      <td className="py-4 px-4 text-xs font-semibold text-slate-700">
                        {exam.invigilator}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {exam.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 2: HALL TICKET & ELIGIBILITY VERIFICATION                          */}
      {/* ========================================================================= */}
      {activeTab === 'hall-tickets' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Hall Ticket Issuance & Attendance Verification</h3>
              <p className="text-xs text-slate-500 mt-0.5">Students with minimum 75% attendance and fee clearance are eligible</p>
            </div>

            <button
              onClick={() => showToast('All eligible Hall Tickets generated in batch.')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Generate All Hall Tickets</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">STUDENT ROLL & NAME</th>
                    <th className="py-4 px-4">DEPARTMENT</th>
                    <th className="py-4 px-4">ATTENDANCE %</th>
                    <th className="py-4 px-4">FEE STATUS</th>
                    <th className="py-4 px-4">ELIGIBILITY</th>
                    <th className="py-4 px-6 text-right">HALL TICKET</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                            {s.rollNo}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900">{s.name}</p>
                            <span className="text-[11px] text-slate-400 font-mono">Reg: {s.regNo}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-semibold text-slate-700 text-xs">
                        {s.department} (Yr {s.year})
                      </td>

                      <td className="py-4 px-4">
                        <span className={`font-extrabold text-xs ${
                          s.attendance >= 75 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {s.attendance}%
                        </span>
                      </td>

                      <td className="py-4 px-4 text-xs font-bold">
                        {s.feeCleared ? (
                          <span className="text-emerald-600">✓ No Dues</span>
                        ) : (
                          <span className="text-rose-600">✕ Fee Due Pending</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          s.status === 'Eligible'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {s.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        {s.status === 'Eligible' ? (
                          <button
                            onClick={() => setViewingHallTicketStudent(s)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all shadow-xs"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>View Hall Ticket</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold italic">Not Issued</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 3: CIA INTERNAL MARKS ENTRY                                        */}
      {/* ========================================================================= */}
      {activeTab === 'internal-marks' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Continuous Internal Assessment (CIA) Marks Entry</h3>
              <p className="text-xs text-slate-500 mt-0.5">CIA 1 (50) + CIA 2 (50) scaled to 30 + Assignment (10) = 40 Total Internal Marks</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsMarksLocked(!isMarksLocked);
                  showToast(isMarksLocked ? 'Marks unlocked for editing.' : 'Marks successfully locked and frozen for CoE evaluation!');
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs rounded-xl transition-all border ${
                  isMarksLocked
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                {isMarksLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{isMarksLocked ? 'Unlock Marks' : 'Lock & Submit to CoE'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">STUDENT ROLL & NAME</th>
                    <th className="py-4 px-4 text-center">CIA-1 (MAX 50)</th>
                    <th className="py-4 px-4 text-center">CIA-2 (MAX 50)</th>
                    <th className="py-4 px-4 text-center">ASSIGNMENT (10)</th>
                    <th className="py-4 px-4 text-center">SCALED CIA (40)</th>
                    <th className="py-4 px-6 text-right">GRADE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-6">
                        <span className="font-mono font-bold text-blue-600 mr-2">{s.rollNo}</span>
                        <span className="font-bold text-slate-900">{s.name}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          disabled={isMarksLocked}
                          value={s.cia1}
                          onChange={(e) => handleUpdateMarks(s.id, 'cia1', e.target.value)}
                          className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          disabled={isMarksLocked}
                          value={s.cia2}
                          onChange={(e) => handleUpdateMarks(s.id, 'cia2', e.target.value)}
                          className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          disabled={isMarksLocked}
                          value={s.assignment}
                          onChange={(e) => handleUpdateMarks(s.id, 'assignment', e.target.value)}
                          className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                      </td>

                      <td className="py-3.5 px-4 text-center font-black text-sm text-indigo-600">
                        {s.ciaTotal} / 40
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <span className="px-2.5 py-1 rounded-lg font-black text-xs bg-blue-50 text-blue-700 border border-blue-200">
                          Grade: {s.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 4: RESULTS & MARKSHEET PUBLICATION                                 */}
      {/* ========================================================================= */}
      {activeTab === 'results' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">End Semester Exam Results & Grade Cards</h3>
              <p className="text-xs text-slate-500 mt-0.5">Click on any student to view official university marksheet with CGPA</p>
            </div>

            <button
              onClick={() => showToast('Results published to Student Portal successfully!')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              <Award className="w-4 h-4" />
              <span>Publish Results Online</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">STUDENT ROLL & NAME</th>
                    <th className="py-4 px-4">DEPARTMENT</th>
                    <th className="py-4 px-4 text-center">INTERNAL (40)</th>
                    <th className="py-4 px-4 text-center">ESE (60)</th>
                    <th className="py-4 px-4 text-center">TOTAL (100)</th>
                    <th className="py-4 px-4 text-center">SGPA / CGPA</th>
                    <th className="py-4 px-6 text-right">GRADE CARD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-6">
                        <span className="font-mono font-bold text-blue-600 mr-2">{s.rollNo}</span>
                        <span className="font-bold text-slate-900">{s.name}</span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700 text-xs">
                        {s.department}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {s.ciaTotal}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {s.eseMarks}
                      </td>

                      <td className="py-3.5 px-4 text-center font-black text-rose-600">
                        {s.totalMarks}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-black text-emerald-600">{s.sgpa} SGPA</span>
                        <span className="block text-[11px] text-slate-400">CGPA: {s.cgpa}</span>
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => setViewingGradeCardStudent(s)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Marksheet</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. TAB 5: SEATING PLAN & INVIGILATION                                     */}
      {/* ========================================================================= */}
      {activeTab === 'seating' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {hallsList.map((h) => (
              <div key={h.id} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 font-extrabold text-xs rounded-lg border border-rose-100">
                      Capacity: {h.capacity} Seats
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200">
                      {h.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900">{h.hallName}</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Branches: {h.departments}</p>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs my-3 space-y-1.5">
                    <p className="text-slate-600">
                      <strong className="text-slate-800">Roll Numbers:</strong> {h.rollRange}
                    </p>
                    <p className="text-slate-600">
                      <strong className="text-slate-800">Chief Invigilator:</strong> {h.invigilator} ({h.invigilatorDept} Dept)
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="font-bold text-slate-500">{h.allocatedStudents} Students Assigned</span>
                  <button
                    onClick={() => showToast(`Door Seating Chart for ${h.hallName} printed.`)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Door Slip</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL: ADD EXAM SCHEDULE                                               */}
      {/* ========================================================================= */}
      {isAddScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Add Exam Schedule</h3>
                <p className="text-xs text-slate-500 mt-0.5">Create a new timetable entry for university examinations</p>
              </div>
              <button onClick={() => setIsAddScheduleOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject Name</label>
                <input
                  type="text"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                  placeholder="e.g. Distributed Cloud Computing"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject Code</label>
                  <input
                    type="text"
                    value={scheduleForm.code}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, code: e.target.value })}
                    placeholder="CS501"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:bg-white focus:border-rose-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Department</label>
                  <select
                    value={scheduleForm.department}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-rose-500 focus:outline-none"
                  >
                    {DEPARTMENTS.filter(d => d !== 'All Departments').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Exam Date</label>
                  <input
                    type="date"
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Session Hour</label>
                  <select
                    value={scheduleForm.session}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, session: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-rose-500 focus:outline-none"
                  >
                    <option value="FN (09:30 AM - 12:30 PM)">FN (09:30 AM - 12:30 PM)</option>
                    <option value="AN (01:30 PM - 04:30 PM)">AN (01:30 PM - 04:30 PM)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Exam Hall</label>
                  <input
                    type="text"
                    value={scheduleForm.hall}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, hall: e.target.value })}
                    placeholder="Hall 101 (Ramanujan Block)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">QP Code</label>
                  <input
                    type="text"
                    value={scheduleForm.qpCode}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, qpCode: e.target.value })}
                    placeholder="QP-7108-CS"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:bg-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleOpen(false)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Save Schedule
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. MODAL: OFFICIAL PRINTABLE HALL TICKET                                 */}
      {/* ========================================================================= */}
      {viewingHallTicketStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Official University Hall Ticket</h3>
                <p className="text-xs text-slate-500">Controller of Examinations • End Semester Examinations Nov 2026</p>
              </div>
              <button onClick={() => setViewingHallTicketStudent(null)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hall Ticket Card Frame */}
            <div className="p-6 bg-slate-50/80 rounded-2xl border-2 border-slate-200 space-y-5">
              
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block">VIDYA CAMPUS AUTOMATION SYSTEM</span>
                  <h4 className="text-lg font-black text-slate-900">{viewingHallTicketStudent.name}</h4>
                  <p className="text-xs text-slate-600 font-medium">
                    Roll: <strong className="text-slate-900">{viewingHallTicketStudent.rollNo}</strong> • Reg: <strong className="text-slate-900">{viewingHallTicketStudent.regNo}</strong>
                  </p>
                  <p className="text-xs text-slate-600 font-semibold">{viewingHallTicketStudent.department} (Year {viewingHallTicketStudent.year} - {viewingHallTicketStudent.sem})</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col items-center shrink-0">
                  <QrCode className="w-16 h-16 text-slate-800" />
                  <span className="text-[9px] font-mono text-slate-400 mt-1">VERIFIED QR</span>
                </div>
              </div>

              {/* Timetable in Hall Ticket */}
              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Registered Subject Examination Dates</h5>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100/70 text-[10px] font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="p-2.5">DATE & SESSION</th>
                        <th className="p-2.5">CODE & SUBJECT</th>
                        <th className="p-2.5">HALL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 font-bold text-slate-900">18-Nov-2026 (FN)</td>
                        <td className="p-2.5 font-semibold text-slate-800">CS401 - Database Management Systems</td>
                        <td className="p-2.5 text-slate-600">Hall 101</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-900">20-Nov-2026 (FN)</td>
                        <td className="p-2.5 font-semibold text-slate-800">CS502 - Artificial Intelligence & ML</td>
                        <td className="p-2.5 text-slate-600">Hall 102</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-900">24-Nov-2026 (AN)</td>
                        <td className="p-2.5 font-semibold text-slate-800">CS402 - DBMS & SQL Laboratory</td>
                        <td className="p-2.5 text-slate-600">Lab 3</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signature Blocks */}
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-dashed border-slate-300 text-center text-xs">
                <div>
                  <div className="h-10"></div>
                  <span className="font-bold text-slate-700 block border-t border-slate-300 pt-1">Signature of the Student</span>
                </div>
                <div>
                  <div className="h-10 font-serif italic text-blue-800 flex items-center justify-center font-bold text-sm">
                    Dr. S. K. Narayanan
                  </div>
                  <span className="font-bold text-slate-700 block border-t border-slate-300 pt-1">Controller of Examinations</span>
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setViewingHallTicketStudent(null)}
                className="px-5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
              <button
                onClick={() => showToast(`Printing Hall Ticket for ${viewingHallTicketStudent.name}...`)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Hall Ticket</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. MODAL: OFFICIAL GRADE CARD / MARKSHEET                                */}
      {/* ========================================================================= */}
      {viewingGradeCardStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">Official Semester Grade Sheet</h3>
                <p className="text-xs text-slate-500">Autonomous Degree Regulations • Result Publication Nov 2026</p>
              </div>
              <button onClick={() => setViewingGradeCardStudent(null)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Marksheet Frame */}
            <div className="p-6 bg-slate-50/70 rounded-2xl border-2 border-slate-200 space-y-5">
              
              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div>
                  <h4 className="font-black text-slate-900 text-base">{viewingGradeCardStudent.name}</h4>
                  <p className="text-xs text-slate-600">Register No: <strong className="text-slate-900">{viewingGradeCardStudent.regNo}</strong> • Roll: <strong className="text-slate-900">{viewingGradeCardStudent.rollNo}</strong></p>
                  <p className="text-xs text-slate-600 font-semibold">{viewingGradeCardStudent.department} • Semester {viewingGradeCardStudent.sem}</p>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-600">{viewingGradeCardStudent.sgpa} SGPA</span>
                  <p className="text-[11px] text-slate-500 font-bold">CGPA: {viewingGradeCardStudent.cgpa}</p>
                </div>
              </div>

              {/* Table of courses */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="p-2.5">CODE</th>
                      <th className="p-2.5">COURSE NAME</th>
                      <th className="p-2.5 text-center">CREDITS</th>
                      <th className="p-2.5 text-center">GRADE</th>
                      <th className="p-2.5 text-center">RESULT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 font-bold font-mono text-blue-600">CS401</td>
                      <td className="p-2.5 font-semibold text-slate-800">Database Management Systems</td>
                      <td className="p-2.5 text-center font-bold">4</td>
                      <td className="p-2.5 text-center font-black text-emerald-600">{viewingGradeCardStudent.grade}</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">PASS</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold font-mono text-blue-600">CS502</td>
                      <td className="p-2.5 font-semibold text-slate-800">Artificial Intelligence & Machine Learning</td>
                      <td className="p-2.5 text-center font-bold">4</td>
                      <td className="p-2.5 text-center font-black text-emerald-600">A+</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">PASS</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold font-mono text-blue-600">CS402</td>
                      <td className="p-2.5 font-semibold text-slate-800">DBMS & SQL Laboratory</td>
                      <td className="p-2.5 text-center font-bold">2</td>
                      <td className="p-2.5 text-center font-black text-emerald-600">O</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">PASS</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Classification */}
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs flex justify-between items-center text-emerald-900 font-bold">
                <span>Classification: First Class with Distinction</span>
                <span>Controller of Examinations Certified</span>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setViewingGradeCardStudent(null)}
                className="px-5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
              <button
                onClick={() => showToast(`Printing Official Grade Sheet for ${viewingGradeCardStudent.name}...`)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Grade Card</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
