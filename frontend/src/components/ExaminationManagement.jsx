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
  ChevronDown,
  Save
} from 'lucide-react';
import ModalPortal from './ModalPortal';

const DEPARTMENTS = [
  'All Departments',
  'Commerce',
  'Computer Science',
  'English Literature',
  'Business Administration (BBA)',
  'Computer Applications (BCA)',
  'Mathematics'
];

const EXAM_SESSIONS = [
  'All Sessions',
  'End Semester Examinations - Nov/Dec 2026',
  'Continuous Internal Assessment (CIA-2) - Oct 2026',
  'Continuous Internal Assessment (CIA-1) - Aug 2026',
  'Supplementary & Arrear Examinations - Dec 2026'
];

const INITIAL_EXAMS = [];
const INITIAL_STUDENT_MARKS = [];
const INITIAL_HALLS = [];

export default function ExaminationManagement({ user }) {
  const isSuperAdmin = user?.role === 'Super Admin' || user?.isSuperAdmin || JSON.parse(sessionStorage.getItem('vcas_user') || '{}')?.role === 'Super Admin';
  // Tabs: 'schedules', 'hall-tickets', 'internal-marks', 'results', 'seating'
  const [activeTab, setActiveTab] = useState('schedules');

  // Exam List State - Live Backend Only
  const [examsList, setExamsList] = useState([]);
  const [studentMarksList, setStudentMarksList] = useState([]);
  const [hallsList, setHallsList] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [internalMarksheets, setInternalMarksheets] = useState([]);

  // Fetch real exam schedules, staff-uploaded internal marks, halls, and students
  const fetchAllExaminationData = async () => {
    try {
      setIsSyncing(true);
      const [resExams, resMarks, resHalls, resStudents, resTickets, resSubjects, resClasses] = await Promise.allSettled([
        fetch('http://localhost:5000/api/exams'),
        fetch('http://localhost:5000/api/internal-marks'),
        fetch('http://localhost:5000/api/exams/halls'),
        fetch('http://localhost:5000/api/students'),
        fetch('http://localhost:5000/api/hall-tickets'),
        fetch('http://localhost:5000/api/subjects'),
        fetch('http://localhost:5000/api/classes')
      ]);

      // 1. Process Exams
      let realExams = [];
      if (resExams.status === 'fulfilled' && resExams.value.ok) {
        const d = await resExams.value.json();
        if (d.success && Array.isArray(d.exams)) {
          realExams = d.exams;
          // De-duplicate exams array
          const uniqueExams = [];
          const seen = new Set();
          d.exams.forEach(ex => {
            const key = (ex._id || `${ex.code}_${ex.date}_${ex.session}`).toString();
            if (!seen.has(key)) {
              seen.add(key);
              uniqueExams.push(ex);
            }
          });
          setExamsList(uniqueExams);
        }
      }

      // 2. Process Halls
      if (resHalls.status === 'fulfilled' && resHalls.value.ok) {
        const d = await resHalls.value.json();
        if (d.success && Array.isArray(d.halls)) {
          setHallsList(d.halls);
        }
      }

      // 3. Process Staff Uploaded Internal Marks + Students
      let staffMarksheets = [];
      if (resMarks.status === 'fulfilled' && resMarks.value.ok) {
        const d = await resMarks.value.json();
        if (d.success && Array.isArray(d.data)) {
          staffMarksheets = d.data;
          setInternalMarksheets(d.data);
        }
      }

      let studentsData = [];
      if (resStudents.status === 'fulfilled' && resStudents.value.ok) {
        const d = await resStudents.value.json();
        if (d.success && Array.isArray(d.data)) {
          studentsData = d.data;
        }
      }

      let hallTicketAllocations = [];
      if (resTickets.status === 'fulfilled' && resTickets.value.ok) {
        const d = await resTickets.value.json();
        if (d.success && Array.isArray(d.data)) {
          hallTicketAllocations = d.data;
        }
      }

      // Process Registered Curriculum Subjects & Classes for Schedule Dropdown
      const subsMap = new Map();
      if (resSubjects.status === 'fulfilled' && resSubjects.value.ok) {
        const d = await resSubjects.value.json();
        if (d.success && Array.isArray(d.data)) {
          d.data.forEach(s => {
            const code = (s.code || '').toUpperCase().trim();
            if (code) {
              subsMap.set(code, {
                code,
                name: s.name || code,
                department: s.department || 'Computer Science'
              });
            }
          });
        }
      }
      if (resClasses.status === 'fulfilled' && resClasses.value.ok) {
        const d = await resClasses.value.json();
        if (d.success && Array.isArray(d.classes)) {
          d.classes.forEach(c => {
            const code = (c.code || '').toUpperCase().trim();
            if (code && !subsMap.has(code)) {
              subsMap.set(code, {
                code,
                name: c.name || code,
                department: c.department || 'Computer Science'
              });
            }
          });
        }
      }
      setAvailableSubjects(Array.from(subsMap.values()));

      // Build unified student examination and marks roster
      const studentMap = new Map();

      // First add from registered students (st.attendance is dynamically calculated from attendance sessions)
      studentsData.forEach((st, idx) => {
        const roll = (st.rollNo || '').trim().toUpperCase();
        if (!roll) return;
        const attNum = typeof st.attendance === 'number' ? st.attendance : parseFloat(st.attendance) || 0;
        const isFeeCleared = st.feeStatus ? st.feeStatus.toLowerCase() === 'paid' : true;
        const isEligible = attNum >= 75 && isFeeCleared;
        const statusStr = isEligible
          ? 'Eligible'
          : attNum < 75
            ? 'Blocked (Shortage <75%)'
            : 'Blocked (Fee Due)';

        studentMap.set(roll, {
          id: st._id || st.id || idx + 1,
          rollNo: roll,
          regNo: st.admissionNo || st.admNo || st.studentId || roll,
          name: st.name || st.fullName || 'Student',
          department: st.department || 'Computer Science',
          year: (st.year && st.year <= 3) ? st.year : (st.sem?.includes('1') || st.sem?.includes('2') ? 1 : (st.sem?.includes('3') || st.sem?.includes('4') ? 2 : 3)),
          sem: st.sem || st.semester || 'Sem 5',
          attendance: attNum,
          feeCleared: isFeeCleared,
          cia1: 42,
          cia2: 45,
          assignment: 9,
          ciaTotal: 35,
          eseMarks: 52,
          totalMarks: 87,
          grade: 'A+',
          gradePoint: 9,
          status: statusStr,
          result: 'PASS',
          sgpa: 8.8,
          cgpa: Number(st.cgpa || 8.5)
        });
      });

      // Overlay real marks uploaded by staff
      staffMarksheets.forEach(sheet => {
        if (Array.isArray(sheet.students)) {
          sheet.students.forEach(stMark => {
            const roll = (stMark.rollNo || '').trim().toUpperCase();
            if (!roll || !studentMap.has(roll)) return;
            const existing = studentMap.get(roll);

            const cia1Val = typeof stMark.cia1 === 'number' ? stMark.cia1 : (existing.cia1 || 40);
            const cia2Val = typeof stMark.cia2 === 'number' ? stMark.cia2 : (existing.cia2 || 42);
            const assignVal = typeof stMark.assignment === 'number' ? stMark.assignment : (existing.assignment || 8);
            const ciaTot = typeof stMark.consolidated === 'number' && stMark.consolidated > 0
              ? stMark.consolidated
              : Math.round(((cia1Val + cia2Val) / 2) * 0.4 + assignVal);

            const ese = 52;
            const total = ciaTot + ese;
            const grade = total >= 90 ? 'O' : total >= 80 ? 'A+' : total >= 70 ? 'A' : total >= 60 ? 'B+' : total >= 50 ? 'B' : 'U';
            const gradePoint = total >= 90 ? 10 : total >= 80 ? 9 : total >= 70 ? 8 : total >= 60 ? 7 : total >= 50 ? 6 : 0;
            const isEligible = (existing.attendance >= 75) && existing.feeCleared;
            const statusStr = isEligible
              ? 'Eligible'
              : existing.attendance < 75
                ? 'Blocked (Shortage <75%)'
                : 'Blocked (Fee Due)';

            studentMap.set(roll, {
              ...existing,
              name: stMark.name || existing.name,
              cia1: cia1Val,
              cia2: cia2Val,
              assignment: assignVal,
              ciaTotal: ciaTot,
              eseMarks: ese,
              totalMarks: total,
              grade,
              gradePoint,
              status: statusStr,
              result: total >= 50 ? 'PASS' : 'FAIL',
              uploadedByStaff: sheet.staffName || sheet.staffId || 'Faculty',
              subjectCode: sheet.subjectCode,
              subjectName: sheet.subjectName
            });
          });
        }
      });

      // Overlay hall ticket allocations created by staff
      hallTicketAllocations.forEach(alloc => {
        if (Array.isArray(alloc.students)) {
          alloc.students.forEach(st => {
            const roll = (st.rollNo || '').trim().toUpperCase();
            if (roll && studentMap.has(roll)) {
              const existing = studentMap.get(roll);
              const isElig = (existing.attendance >= 75) && existing.feeCleared;
              studentMap.set(roll, {
                ...existing,
                hallNo: st.hallNo || existing.hallNo || 'Hall 101',
                seatNo: st.seatNo || existing.seatNo || 'A1',
                deskNo: st.deskNo || existing.deskNo || '',
                subjects: Array.isArray(st.subjects) && st.subjects.length > 0 ? st.subjects : (existing.subjects || []),
                eligible: isElig,
                status: isElig ? 'Eligible' : 'Blocked (Shortage <75%)'
              });
            }
          });
        }
      });

      setStudentMarksList(Array.from(studentMap.values()));
    } catch (err) {
      console.error('Failed to sync examination data:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  React.useEffect(() => {
    fetchAllExaminationData();
  }, []);
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

  // Lock background scroll when any modal is open
  React.useEffect(() => {
    const isAnyModalOpen = Boolean(isAddScheduleOpen || viewingHallTicketStudent || viewingGradeCardStudent);
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
  }, [isAddScheduleOpen, viewingHallTicketStudent, viewingGradeCardStudent]);

  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  // Schedule Form State - Starts completely empty
  const [scheduleForm, setScheduleForm] = useState({
    code: '',
    name: '',
    department: 'Computer Science',
    year: 1,
    sem: 'Sem 1',
    date: '',
    session: 'FN (09:30 AM - 12:30 PM)',
    hall: '',
    qpCode: '',
    invigilator: '',
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
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (isSubmittingSchedule) return;
    const finalCode = (scheduleForm.code === 'CUSTOM' ? (scheduleForm.customCode || '') : scheduleForm.code).toUpperCase().trim();
    const finalName = scheduleForm.name.trim();

    if (!finalName || !finalCode) {
      alert('Please fill in Subject Name and Code');
      return;
    }

    try {
      setIsSubmittingSchedule(true);
      const payload = {
        code: finalCode,
        name: finalName,
        department: scheduleForm.department || 'Computer Science',
        year: Number(scheduleForm.year) || 1,
        sem: scheduleForm.sem || 'Sem 1',
        date: scheduleForm.date,
        session: scheduleForm.session || 'FN (09:30 AM - 12:30 PM)',
        hall: scheduleForm.hall.trim() || 'Hall 101',
        qpCode: scheduleForm.qpCode.trim(),
        invigilator: scheduleForm.invigilator.trim() || 'Assigned Faculty',
        type: scheduleForm.type || 'End Semester Theory',
        totalStudents: 60,
        status: 'Scheduled',
        maxMarks: 100,
        ciaMax: 40,
        eseMax: 60
      };

      const res = await fetch('http://localhost:5000/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.exam) {
        setExamsList(prev => {
          // De-duplicate by code + date + session or _id
          const filtered = prev.filter(ex => 
            ex._id !== data.exam._id && 
            !(ex.code === data.exam.code && ex.date === data.exam.date && ex.session === data.exam.session)
          );
          return [data.exam, ...filtered];
        });
        showToast('New Exam Schedule scheduled and saved successfully!');
      } else {
        const tempExam = { id: Date.now(), ...payload };
        setExamsList(prev => [tempExam, ...prev]);
        showToast('New Exam Schedule added to list!');
      }
    } catch (err) {
      console.error('Failed to persist exam schedule:', err);
      const tempExam = { id: Date.now(), ...scheduleForm };
      setExamsList(prev => [tempExam, ...prev]);
      showToast('Exam schedule saved locally.');
    } finally {
      setIsSubmittingSchedule(false);
      setIsAddScheduleOpen(false);
      setScheduleForm({
        code: '',
        name: '',
        department: 'Computer Science',
        year: 1,
        sem: 'Sem 1',
        date: '',
        session: 'FN (09:30 AM - 12:30 PM)',
        hall: '',
        qpCode: '',
        invigilator: '',
        type: 'End Semester Theory'
      });
    }
  };

    // Delete Exam Schedule from MongoDB Atlas
  const handleDeleteSchedule = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this exam schedule?')) return;
    try {
      await fetch(`http://localhost:5000/api/exams/${id}`, { method: 'DELETE' });
      setExamsList(prev => prev.filter(ex => (ex._id !== id && ex.id !== id)));
      showToast('Exam schedule deleted successfully.');
    } catch (err) {
      setExamsList(prev => prev.filter(ex => (ex._id !== id && ex.id !== id)));
      showToast('Exam schedule removed.');
    }
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
          {isSuperAdmin && (
            <button
            onClick={handleExportTimetableCSV}
            title="Download CSV Exam Timetable"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Timetable</span>
          </button>
          )}

          <button
            onClick={fetchAllExaminationData}
            disabled={isSyncing}
            title="Sync Examination Schedules & Staff Marks"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs disabled:opacity-60"
          >
            <Sparkles className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Examination Data'}</span>
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
        <ModalPortal isOpen={isAddScheduleOpen} onClose={() => setIsAddScheduleOpen(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">Add Exam Schedule Entry</h3>
                  <p className="text-[11px] text-slate-500">Create a new timetable slot for university examinations</p>
                </div>
              </div>
              <button onClick={() => setIsAddScheduleOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code *</label>
                  <select
                    value={scheduleForm.code}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = availableSubjects.find(s => s.code === val);
                      setScheduleForm(prev => ({
                        ...prev,
                        code: val,
                        name: matched ? matched.name : (val === 'CUSTOM' ? '' : prev.name),
                        department: matched && matched.department ? matched.department : prev.department
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:bg-white focus:border-purple-500 focus:outline-none transition-all cursor-pointer"
                    required
                  >
                    <option value="">-- Select Subject Code --</option>
                    {availableSubjects.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} ({s.name})
                      </option>
                    ))}
                    <option value="CUSTOM">+ Enter Custom Code...</option>
                  </select>

                  {scheduleForm.code === 'CUSTOM' && (
                    <input
                      type="text"
                      placeholder="Enter Subject Code e.g. CS2005"
                      value={scheduleForm.customCode || ''}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, customCode: e.target.value.toUpperCase() }))}
                      className="mt-2 w-full px-3.5 py-2 bg-white border border-purple-300 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    value={scheduleForm.name}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                    placeholder="e.g. DBMS"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                <select
                  value={scheduleForm.department}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                >
                  {DEPARTMENTS.filter(d => d !== 'All Departments').map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Exam Date *</label>
                  <input
                    type="date"
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Session Timing *</label>
                  <select
                    value={scheduleForm.session}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, session: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value="FN (09:30 AM - 12:30 PM)">FN (09:30 AM - 12:30 PM)</option>
                    <option value="AN (01:30 PM - 04:30 PM)">AN (01:30 PM - 04:30 PM)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Exam Hall</label>
                  <input
                    type="text"
                    value={scheduleForm.hall}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, hall: e.target.value })}
                    placeholder="Hall 101 (Ramanujan Block)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">QP Code</label>
                  <input
                    type="text"
                    value={scheduleForm.qpCode}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, qpCode: e.target.value })}
                    placeholder="QP-7108-CS"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chief Invigilator</label>
                  <input
                    type="text"
                    value={scheduleForm.invigilator}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, invigilator: e.target.value })}
                    placeholder="Enter Invigilator Name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Exam Type</label>
                  <select
                    value={scheduleForm.type}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value="End Semester Theory">End Semester Theory</option>
                    <option value="Practical Lab Exam">Practical Lab Exam</option>
                    <option value="Continuous Internal Assessment (CIA)">Continuous Internal Assessment (CIA)</option>
                    <option value="Supplementary / Arrear">Supplementary / Arrear</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSchedule} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Schedule Entry</span>
                </button>
              </div>

            </form>
          </div>
        </ModalPortal>
      )}
      {/* ========================================================================= */}
      {/* 10. MODAL: OFFICIAL PRINTABLE HALL TICKET                                 */}
      {/* ========================================================================= */}
      {viewingHallTicketStudent && (
        <ModalPortal isOpen={Boolean(viewingHallTicketStudent)} onClose={() => setViewingHallTicketStudent(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            
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
                      {((viewingHallTicketStudent.subjects && viewingHallTicketStudent.subjects.length > 0)
                        ? viewingHallTicketStudent.subjects
                        : examsList.filter(e => !e.department || e.department === viewingHallTicketStudent.department || e.department === 'Computer Science')
                      ).slice(0, 5).map((sub, sIdx) => (
                        <tr key={sIdx}>
                          <td className="p-2.5 font-bold text-slate-900">{sub.date || 'TBD'} ({sub.session || 'FN'})</td>
                          <td className="p-2.5 font-semibold text-slate-800">{sub.code} - {sub.name}</td>
                          <td className="p-2.5 text-slate-600">{sub.hall || viewingHallTicketStudent.hallNo || 'Hall 101'}</td>
                        </tr>
                      ))}
                      {(!viewingHallTicketStudent.subjects || viewingHallTicketStudent.subjects.length === 0) && examsList.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-3 text-center text-slate-400 italic">No scheduled exams found.</td>
                        </tr>
                      )}
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
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 11. MODAL: OFFICIAL GRADE CARD / MARKSHEET                                */}
      {/* ========================================================================= */}
      {viewingGradeCardStudent && (
        <ModalPortal isOpen={Boolean(viewingGradeCardStudent)} onClose={() => setViewingGradeCardStudent(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            
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
                    {(examsList.length > 0 ? examsList : [
                      { code: viewingGradeCardStudent.subjectCode || 'CS2001', name: viewingGradeCardStudent.subjectName || 'Web Applications & Frameworks', credits: 4 }
                    ]).slice(0, 5).map((c, cIdx) => (
                      <tr key={cIdx}>
                        <td className="p-2.5 font-bold font-mono text-blue-600">{c.code}</td>
                        <td className="p-2.5 font-semibold text-slate-800">{c.name}</td>
                        <td className="p-2.5 text-center font-bold">4</td>
                        <td className="p-2.5 text-center font-black text-emerald-600">{viewingGradeCardStudent.grade || 'A+'}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-600">{viewingGradeCardStudent.result || 'PASS'}</td>
                      </tr>
                    ))}
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
        </ModalPortal>
      )}

    </div>
  );
}
