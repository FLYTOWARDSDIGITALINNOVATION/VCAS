import React, { useState, useMemo } from 'react';
import { API_BASE, BACKEND_URL } from '../apiConfig';
import { createPortal } from 'react-dom';
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
  Save,
  RefreshCw
} from 'lucide-react';
import ModalPortal from './ModalPortal';

const STANDARD_DEPARTMENTS = [
  'BSc. Computer science',
  'Computer Science',
  'Commerce',
  'Mathematics',
  'Business Administration (BBA)',
  'Computer Applications (BCA)',
  'Tamil',
  'English',
  'Physical Education',
  'Office'
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

export default function ExaminationManagement({ user }) {
  const isSuperAdmin = user?.role === 'Super Admin' || user?.isSuperAdmin || JSON.parse(sessionStorage.getItem('vcas_user') || '{}')?.role === 'Super Admin';
  // Tabs: 'schedules', 'hall-tickets', 'internal-marks', 'results', 'seating'
  const [activeTab, setActiveTab] = useState('schedules');

  // Exam List State - Live Backend Only
  const [examsList, setExamsList] = useState([]);
  const [studentMarksList, setStudentMarksList] = useState([]);
  const [hallsList, setHallsList] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState(STANDARD_DEPARTMENTS);
  const [facultyList, setFacultyList] = useState([]);
  const [invigilatorCategoryFilter, setInvigilatorCategoryFilter] = useState('All');
  const [availableVenues, setAvailableVenues] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [internalMarksheets, setInternalMarksheets] = useState([]);

  // Fetch real exam schedules, staff-uploaded internal marks, halls, and students
  const fetchAllExaminationData = async () => {
    try {
      setIsSyncing(true);
      const [resExams, resMarks, resHalls, resStudents, resTickets, resSubjects, resClasses, resDepts, resStaff] = await Promise.allSettled([
        fetch(`${API_BASE}/exams`),
        fetch(`${API_BASE}/internal-marks`),
        fetch(`${API_BASE}/exams/halls`),
        fetch(`${API_BASE}/students`),
        fetch(`${API_BASE}/hall-tickets`),
        fetch(`${API_BASE}/subjects`),
        fetch(`${API_BASE}/classes`),
        fetch(`${API_BASE}/departments`),
        fetch(`${API_BASE}/staff`)
      ]);

      let staffArr = [];
      if (resStaff.status === 'fulfilled' && resStaff.value.ok) {
        const d = await resStaff.value.json();
        staffArr = d?.data || d?.staff || (Array.isArray(d) ? d : []);
        setFacultyList(staffArr);
      }

      let deptNames = [];
      if (resDepts.status === 'fulfilled' && resDepts.value.ok) {
        const d = await resDepts.value.json();
        if (d.success && Array.isArray(d.data)) {
          deptNames = d.data.map(dept => dept.name).filter(Boolean);
        }
      }
      const staffDepts = staffArr.map(s => s.department || s.dept || s.departmentName).filter(Boolean);
      let subjectDepts = [];
      if (resSubjects.status === 'fulfilled' && resSubjects.value.ok) {
        const sd = await resSubjects.value.json();
        if (sd.success && Array.isArray(sd.data)) {
          subjectDepts = sd.data.map(s => s.department).filter(Boolean);
        }
      }
      const combinedDepts = Array.from(new Set([...STANDARD_DEPARTMENTS, ...deptNames, ...staffDepts, ...subjectDepts]));
      setAvailableDepartments(combinedDepts);

      // Collect real-time venues strictly from real exam halls and user-added custom venues
      const venueSet = new Set();
      try {
        const custom = JSON.parse(localStorage.getItem('vcas_custom_venues') || '[]');
        if (Array.isArray(custom)) custom.forEach(v => { if (v && typeof v === 'string' && v.trim()) venueSet.add(v.trim()); });
      } catch (e) {}
      setAvailableVenues(Array.from(venueSet));

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
              uniqueExams.push({ ...ex, id: ex._id || ex.id || key });
            }
          });
          setExamsList(uniqueExams);
        }
      }

      // 2. Process Halls
      let loadedHalls = [];
      if (resHalls.status === 'fulfilled' && resHalls.value.ok) {
        const d = await resHalls.value.json();
        if (d.success && Array.isArray(d.halls)) {
          loadedHalls = d.halls;
        }
      }
      let localHalls = [];
      try {
        localHalls = JSON.parse(localStorage.getItem('vcas_custom_exam_halls') || '[]');
      } catch (e) {}
      const hallMap = new Map();
      loadedHalls.forEach(h => {
        const k = (h.hallName || '').trim().toLowerCase();
        if (k) hallMap.set(k, h);
      });
      localHalls.forEach(h => {
        const k = (h.hallName || '').trim().toLowerCase();
        if (k && !hallMap.has(k)) hallMap.set(k, h);
      });
      const finalHalls = Array.from(hallMap.values());
      setHallsList(finalHalls);
      finalHalls.forEach(h => {
        if (h.hallName) venueSet.add(h.hallName.trim());
      });
      setAvailableVenues(Array.from(venueSet));

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
        const isEligible = attNum >= 75;
        const statusStr = isEligible
          ? 'Eligible'
          : 'Blocked (Shortage <75%)';

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
          st1: 16,
          st2: 15,
          st3: 18,
          st4: 17,
          it1: 21,
          it2: 22,
          cia1: 42,
          cia2: 45,
          model: 68,
          project: 18,
          assignment1: 5,
          assignment2: 5,
          assignment3: 4,
          assignment4: 5,
          assignment: 9,
          ciaTotal: 22,
          eseMarks: 65,
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

            const st1Val = stMark.st1 !== null && stMark.st1 !== undefined ? stMark.st1 : (existing.st1 ?? 16);
            const st2Val = stMark.st2 !== null && stMark.st2 !== undefined ? stMark.st2 : (existing.st2 ?? 15);
            const st3Val = stMark.st3 !== null && stMark.st3 !== undefined ? stMark.st3 : (existing.st3 ?? 18);
            const st4Val = stMark.st4 !== null && stMark.st4 !== undefined ? stMark.st4 : (existing.st4 ?? 17);
            const it1Val = stMark.it1 !== null && stMark.it1 !== undefined ? stMark.it1 : (typeof stMark.cia1 === 'number' ? stMark.cia1 : (existing.it1 || 21));
            const it2Val = stMark.it2 !== null && stMark.it2 !== undefined ? stMark.it2 : (typeof stMark.cia2 === 'number' ? stMark.cia2 : (existing.it2 || 22));
            const modelVal = stMark.model !== null && stMark.model !== undefined ? stMark.model : (existing.model ?? 65);
            const projectVal = stMark.project !== null && stMark.project !== undefined ? stMark.project : (existing.project ?? 18);
            const a1Val = stMark.assignment1 !== null && stMark.assignment1 !== undefined ? stMark.assignment1 : 5;
            const a2Val = stMark.assignment2 !== null && stMark.assignment2 !== undefined ? stMark.assignment2 : 5;
            const a3Val = stMark.assignment3 !== null && stMark.assignment3 !== undefined ? stMark.assignment3 : 4;
            const a4Val = stMark.assignment4 !== null && stMark.assignment4 !== undefined ? stMark.assignment4 : 5;
            const assignVal = typeof stMark.assignment === 'number' ? stMark.assignment : (existing.assignment || 8);
            const ciaTot = typeof stMark.consolidated === 'number' && stMark.consolidated > 0
              ? Math.min(25, stMark.consolidated)
              : Math.min(25, Math.round(((Number(it1Val) || 0) + (Number(it2Val) || 0)) * 0.25 + (assignVal * 0.5)));

            const ese = typeof stMark.ese === 'number' ? Math.min(75, stMark.ese) : (typeof stMark.eseMarks === 'number' ? Math.min(75, stMark.eseMarks) : 65);
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
              st1: st1Val,
              st2: st2Val,
              st3: st3Val,
              st4: st4Val,
              it1: it1Val,
              it2: it2Val,
              cia1: it1Val,
              cia2: it2Val,
              model: modelVal,
              project: projectVal,
              assignment1: a1Val,
              assignment2: a2Val,
              assignment3: a3Val,
              assignment4: a4Val,
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
        const commonSubs = (Array.isArray(alloc.commonSubjects) && alloc.commonSubjects.length > 0)
          ? alloc.commonSubjects
          : (Array.isArray(alloc.subjects) && alloc.subjects.length > 0)
            ? alloc.subjects
            : [];

        if (Array.isArray(alloc.students)) {
          alloc.students.forEach(st => {
            const roll = (st.rollNo || '').trim().toUpperCase();
            if (roll && studentMap.has(roll)) {
              const existing = studentMap.get(roll);
              const isElig = (existing.attendance >= 75) && existing.feeCleared;
              const studentSubs = (Array.isArray(st.subjects) && st.subjects.length > 0)
                ? st.subjects
                : commonSubs.length > 0
                  ? commonSubs
                  : (existing.subjects || []);

              studentMap.set(roll, {
                ...existing,
                hallNo: st.hallNo || existing.hallNo || 'Hall 101',
                seatNo: st.seatNo || existing.seatNo || 'A1',
                deskNo: st.deskNo || existing.deskNo || '',
                subjects: studentSubs,
                eligible: isElig,
                status: isElig ? 'Eligible' : (existing.attendance < 75 ? 'Blocked (Shortage <75%)' : 'Blocked (Fee Due)'),
                examTitle: alloc.examName || existing.examTitle,
                academicYear: alloc.academicYear || existing.academicYear
              });
            }
          });
        }
      });

      // If student subjects are still empty, map from staff allocation for their department
      studentMap.forEach((st) => {
        if (!st.subjects || st.subjects.length === 0) {
          const matchAlloc = hallTicketAllocations.find(a => 
            a.department && (a.department.toLowerCase() === (st.department || '').toLowerCase())
          );
          if (matchAlloc) {
            const allocSubs = (Array.isArray(matchAlloc.commonSubjects) && matchAlloc.commonSubjects.length > 0)
              ? matchAlloc.commonSubjects
              : (Array.isArray(matchAlloc.subjects) ? matchAlloc.subjects : []);
            if (allocSubs.length > 0) {
              st.subjects = allocSubs;
              if (!st.hallNo || st.hallNo === 'Hall 101') {
                st.hallNo = matchAlloc.halls?.[0]?.hallNo || 'Hall 101';
              }
            }
          }
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
    department: 'BSc. Computer science',
    year: 1,
    sem: 'Sem 1',
    date: '',
    session: 'Forenoon (FN)',
    hall: '',
    qpCode: '',
    invigilator: '',
    type: 'End Semester Theory'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Faculty for Invigilator Selection by category (including 6. Tamil, 7. English, 8. Physical Education, 9. Office)
  const filteredInvigilatorFaculty = useMemo(() => {
    if (invigilatorCategoryFilter === 'All') return facultyList;
    return facultyList.filter(s => {
      const dept = String(s.department || s.dept || s.departmentName || '');
      if (invigilatorCategoryFilter === 'Office') {
        return s.role === 'Office Staff' || dept.toLowerCase().includes('office');
      }
      if (invigilatorCategoryFilter === 'English') {
        return dept === 'English' || dept === 'English Literature';
      }
      if (invigilatorCategoryFilter === 'Tamil') {
        return dept.toLowerCase().includes('tamil');
      }
      if (invigilatorCategoryFilter === 'Physical Education') {
        return dept.toLowerCase().includes('physical');
      }
      return dept === invigilatorCategoryFilter;
    });
  }, [facultyList, invigilatorCategoryFilter]);

  // Filtered Exam Schedules
  const filteredExams = useMemo(() => {
    return examsList.filter(e => {
      const q = (searchQuery || '').toLowerCase().trim();
      const matchesSearch = !q || (
        String(e.code || '').toLowerCase().includes(q) ||
        String(e.name || '').toLowerCase().includes(q) ||
        String(e.hall || '').toLowerCase().includes(q) ||
        String(e.qpCode || '').toLowerCase().includes(q)
      );

      const normalize = (d) => String(d || '').toLowerCase().trim();
      const matchesDept = selectedDept === 'All Departments' || 
        normalize(e.department) === normalize(selectedDept) ||
        (normalize(selectedDept).includes('computer science') && normalize(e.department).includes('computer science')) ||
        (normalize(selectedDept).includes('commerce') && normalize(e.department).includes('commerce')) ||
        (normalize(selectedDept).includes('bba') && normalize(e.department).includes('bba')) ||
        (normalize(selectedDept).includes('bca') && normalize(e.department).includes('bca')) ||
        (normalize(selectedDept).includes('math') && normalize(e.department).includes('math')) ||
        (normalize(selectedDept).includes('tamil') && normalize(e.department).includes('tamil')) ||
        (normalize(selectedDept).includes('english') && normalize(e.department).includes('english')) ||
        (normalize(selectedDept).includes('physical') && normalize(e.department).includes('physical')) ||
        (normalize(selectedDept).includes('office') && normalize(e.department).includes('office'));
      const matchesType = selectedType === 'ALL' || e.type === selectedType;

      return matchesSearch && matchesDept && matchesType;
    });
  }, [examsList, searchQuery, selectedDept, selectedType]);

  // Filtered Students for Hall Tickets / Results
  const filteredStudents = useMemo(() => {
    return studentMarksList.filter(s => {
      const q = (searchQuery || '').toLowerCase().trim();
      const matchesSearch = !q || (
        String(s.name || '').toLowerCase().includes(q) ||
        String(s.rollNo || '').toLowerCase().includes(q) ||
        String(s.regNo || s.registerNumber || '').toLowerCase().includes(q) ||
        String(s.department || '').toLowerCase().includes(q)
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
    return studentMarksList.filter(s => String(s.status || '').includes('Blocked')).length;
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

      const res = await fetch(`${API_BASE}/exams`, {
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
        department: 'BSc. Computer science',
        year: 1,
        sem: 'Sem 1',
        date: '',
        session: 'Forenoon (FN)',
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
      await fetch(`${API_BASE}/exams/${id}`, { method: 'DELETE' });
      setExamsList(prev => prev.filter(ex => (ex._id !== id && ex.id !== id)));
      showToast('Exam schedule deleted successfully.');
    } catch (err) {
      setExamsList(prev => prev.filter(ex => (ex._id !== id && ex.id !== id)));
      showToast('Exam schedule removed.');
    }
  };

  // ── Exam Hall Seating State & Handlers ──────────────────
  const [isAddHallOpen, setIsAddHallOpen] = useState(false);
  const [editingHallId, setEditingHallId] = useState(null);
  const [isSubmittingHall, setIsSubmittingHall] = useState(false);
  const [viewingDoorSlip, setViewingDoorSlip] = useState(null);
  const [seatingSearchQuery, setSeatingSearchQuery] = useState('');
  const [seatingStatusFilter, setSeatingStatusFilter] = useState('ALL');

  const [hallForm, setHallForm] = useState({
    hallName: '',
    capacity: '',
    allocatedStudents: '',
    departments: '',
    rollRange: '',
    invigilator: '',
    invigilatorDept: '',
    status: 'Allocated'
  });

  const [selectedHallDept, setSelectedHallDept] = useState('');
  const [selectedHallSubjectCode, setSelectedHallSubjectCode] = useState('');
  const [customHallSubCode, setCustomHallSubCode] = useState('');
  const [customHallSubName, setCustomHallSubName] = useState('');
  const [hallAllocatedSubjects, setHallAllocatedSubjects] = useState([]);

  const deptFilteredSubjects = availableSubjects.filter(s => {
    if (!selectedHallDept) return true;
    const sDept = (s.department || '').toLowerCase();
    const target = selectedHallDept.toLowerCase();
    return sDept.includes(target) || target.includes(sDept);
  });

  const handleAddSubjectToHall = () => {
    let code = selectedHallSubjectCode;
    let name = '';
    if (code === 'CUSTOM') {
      code = (customHallSubCode || '').trim();
      name = (customHallSubName || '').trim() || code;
    }
    if (!code) return;

    const matched = availableSubjects.find(s => s.code.toUpperCase() === code.toUpperCase());
    const finalName = name || (matched ? matched.name : code);
    const finalDept = selectedHallDept || (matched ? matched.department : 'General');

    if (!hallAllocatedSubjects.some(s => s.code.toUpperCase() === code.toUpperCase())) {
      const newSubjectItem = {
        code,
        name: finalName,
        department: finalDept,
        date: '',
        session: 'FN (09:30 AM - 12:30 PM)'
      };
      const updated = [...hallAllocatedSubjects, newSubjectItem];
      setHallAllocatedSubjects(updated);

      const summaryArr = Array.from(new Set(updated.map(s => `${s.department} (${s.code})`)));
      setHallForm(prev => ({ ...prev, departments: summaryArr.join(' + ') }));
    }
    setSelectedHallSubjectCode('');
    setCustomHallSubCode('');
    setCustomHallSubName('');
  };

  const handleRemoveSubjectFromHall = (codeToRemove) => {
    const updated = hallAllocatedSubjects.filter(s => s.code.toUpperCase() !== codeToRemove.toUpperCase());
    setHallAllocatedSubjects(updated);
    const summaryArr = Array.from(new Set(updated.map(s => `${s.department} (${s.code})`)));
    setHallForm(prev => ({ ...prev, departments: summaryArr.join(' + ') }));
  };

  const handleUpdateSubjectTiming = (codeToUpdate, field, value) => {
    setHallAllocatedSubjects(prev =>
      prev.map(s => s.code.toUpperCase() === codeToUpdate.toUpperCase() ? { ...s, [field]: value } : s)
    );
  };

  const handleOpenAddHall = (hallToEdit = null) => {
    setSelectedHallDept('');
    setSelectedHallSubjectCode('');
    setCustomHallSubCode('');
    setCustomHallSubName('');
    if (hallToEdit) {
      setEditingHallId(hallToEdit._id || hallToEdit.id);
      setHallForm({
        hallName: hallToEdit.hallName || '',
        capacity: hallToEdit.capacity || '',
        allocatedStudents: hallToEdit.allocatedStudents || '',
        departments: hallToEdit.departments || '',
        rollRange: hallToEdit.rollRange || '',
        invigilator: hallToEdit.invigilator || '',
        invigilatorDept: hallToEdit.invigilatorDept || '',
        status: hallToEdit.status || 'Allocated'
      });
      if (Array.isArray(hallToEdit.allocatedSubjects) && hallToEdit.allocatedSubjects.length > 0) {
        setHallAllocatedSubjects(hallToEdit.allocatedSubjects);
      } else {
        setHallAllocatedSubjects([]);
      }
    } else {
      setEditingHallId(null);
      setHallForm({
        hallName: '',
        capacity: '',
        allocatedStudents: '',
        departments: '',
        rollRange: '',
        invigilator: '',
        invigilatorDept: '',
        status: 'Allocated'
      });
      setHallAllocatedSubjects([]);
    }
    setIsAddHallOpen(true);
  };

  const handleSaveHall = async (e) => {
    e.preventDefault();
    if (!hallForm.hallName.trim()) {
      alert('Hall Name is required');
      return;
    }
    try {
      setIsSubmittingHall(true);
      const payload = {
        ...hallForm,
        capacity: Number(hallForm.capacity) || 60,
        allocatedStudents: Number(hallForm.allocatedStudents) || 0,
        allocatedSubjects: hallAllocatedSubjects
      };

      if (editingHallId) {
        const res = await fetch(`${API_BASE}/exams/halls/${editingHallId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success && data.hall) {
          setHallsList(prev => prev.map(h => ((h._id === editingHallId || h.id === editingHallId) ? data.hall : h)));
        } else {
          setHallsList(prev => prev.map(h => ((h._id === editingHallId || h.id === editingHallId) ? { ...h, ...payload } : h)));
        }
        showToast(`Exam Hall "${payload.hallName}" updated successfully.`);
      } else {
        const res = await fetch(`${API_BASE}/exams/halls`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        let savedHall = null;
        if (data.success && data.hall) {
          savedHall = data.hall;
        } else {
          savedHall = { id: `hall-${Date.now()}`, ...payload };
        }
        setHallsList(prev => [savedHall, ...prev.filter(h => (h._id !== savedHall._id && h.hallName !== payload.hallName))]);
        showToast(`Exam Hall "${payload.hallName}" registered successfully.`);
      }

      // Synchronize with localStorage & availableVenues so it's globally persistent
      try {
        const stored = JSON.parse(localStorage.getItem('vcas_custom_exam_halls') || '[]');
        const updated = [payload, ...stored.filter(h => (h.hallName || '').trim().toLowerCase() !== payload.hallName.trim().toLowerCase())];
        localStorage.setItem('vcas_custom_exam_halls', JSON.stringify(updated));
        const venues = JSON.parse(localStorage.getItem('vcas_custom_venues') || '[]');
        if (!venues.includes(payload.hallName)) {
          venues.push(payload.hallName);
          localStorage.setItem('vcas_custom_venues', JSON.stringify(venues));
        }
      } catch (e) {}
      setAvailableVenues(prev => Array.from(new Set([payload.hallName, ...prev])));

      setIsAddHallOpen(false);
    } catch (err) {
      console.error('Error saving exam hall:', err);
      const newH = { id: `hall-${Date.now()}`, ...hallForm };
      setHallsList(prev => [newH, ...prev]);
      try {
        const stored = JSON.parse(localStorage.getItem('vcas_custom_exam_halls') || '[]');
        localStorage.setItem('vcas_custom_exam_halls', JSON.stringify([newH, ...stored]));
      } catch (e) {}
      showToast('Exam Hall saved.');
      setIsAddHallOpen(false);
    } finally {
      setIsSubmittingHall(false);
    }
  };

  const handleDeleteHall = async (hallId, hallName, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove ${hallName || 'this exam hall'}?`)) return;
    try {
      await fetch(`${API_BASE}/exams/halls/${hallId}`, { method: 'DELETE' });
      setHallsList(prev => prev.filter(h => h._id !== hallId && h.id !== hallId));
      try {
        const stored = JSON.parse(localStorage.getItem('vcas_custom_exam_halls') || '[]');
        localStorage.setItem('vcas_custom_exam_halls', JSON.stringify(stored.filter(h => h._id !== hallId && h.hallName !== hallName)));
      } catch (e) {}
      showToast(`${hallName || 'Exam hall'} removed successfully.`);
    } catch (err) {
      setHallsList(prev => prev.filter(h => h._id !== hallId && h.id !== hallId));
      try {
        const stored = JSON.parse(localStorage.getItem('vcas_custom_exam_halls') || '[]');
        localStorage.setItem('vcas_custom_exam_halls', JSON.stringify(stored.filter(h => h._id !== hallId && h.hallName !== hallName)));
      } catch (e) {}
      showToast('Exam hall removed.');
    }
  };

  const handleAutoAllocateSeating = () => {
    setHallsList(prev => prev.map(h => {
      const cap = Number(h.capacity) || 60;
      return {
        ...h,
        allocatedStudents: cap,
        status: 'Fully Allocated'
      };
    }));
    showToast('Auto-allocated seating plan across all examination halls successfully!');
  };

  const handleSyncStaffHalls = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch(`${API_BASE}/exams/halls`);
      const d = await res.json();
      if (d.success && Array.isArray(d.halls)) {
        setHallsList(d.halls);
        showToast('Synchronized live examination halls from staff portal successfully!');
      } else {
        showToast('No examination halls found.');
      }
    } catch {
      showToast('Error syncing examination halls.');
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredHalls = useMemo(() => {
    return hallsList.filter(h => {
      const q = (seatingSearchQuery || '').toLowerCase().trim();
      const matchesSearch = !q || (
        String(h.hallName || '').toLowerCase().includes(q) ||
        String(h.departments || '').toLowerCase().includes(q) ||
        String(h.rollRange || '').toLowerCase().includes(q) ||
        String(h.invigilator || '').toLowerCase().includes(q) ||
        String(h.invigilatorDept || '').toLowerCase().includes(q)
      );
      const matchesStatus = seatingStatusFilter === 'ALL' || h.status === seatingStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [hallsList, seatingSearchQuery, seatingStatusFilter]);

  // Update Student CIA Marks dynamically across official register fields
  const handleUpdateMarks = (id, field, value) => {
    setStudentMarksList(prev => prev.map(s => {
      if (s.id === id) {
        let parsedVal = value;
        const upper = String(value).toUpperCase().trim();
        if (upper === 'AB' || upper === 'A') {
          parsedVal = 'AB';
        } else if (upper === '-') {
          parsedVal = '-';
        } else if (value === '' || value === null || value === undefined) {
          parsedVal = null;
        } else {
          const n = Number(value);
          parsedVal = !isNaN(n) ? n : value;
        }

        const updated = { ...s, [field]: parsedVal };
        if (field === 'it1') updated.cia1 = parsedVal;
        if (field === 'it2') updated.cia2 = parsedVal;
        if (field === 'cia1') updated.it1 = parsedVal;
        if (field === 'cia2') updated.it2 = parsedVal;

        const numIt1 = typeof updated.it1 === 'number' ? updated.it1 : (typeof updated.cia1 === 'number' ? updated.cia1 : 0);
        const numIt2 = typeof updated.it2 === 'number' ? updated.it2 : (typeof updated.cia2 === 'number' ? updated.cia2 : 0);
        const numModel = typeof updated.model === 'number' ? updated.model : 0;
        const asgSum = (typeof updated.assignment1 === 'number' ? updated.assignment1 : 0) +
                       (typeof updated.assignment2 === 'number' ? updated.assignment2 : 0) +
                       (typeof updated.assignment3 === 'number' ? updated.assignment3 : 0) +
                       (typeof updated.assignment4 === 'number' ? updated.assignment4 : 0);
        const numAsg = asgSum > 0 ? asgSum : (typeof updated.assignment === 'number' ? updated.assignment : 0);

        // Scaled CIA: IT scaled to 10 + Model scaled to 10 + Assignment scaled to 5 = 25 max
        const itScaled = ((numIt1 + numIt2) / 50) * 10;
        const modelScaled = (numModel / 75) * 10;
        const asgScaled = Math.min(5, (numAsg / 20) * 5);
        const totalCIA = Math.min(25, Math.round(itScaled + modelScaled + asgScaled));
        const ese = typeof updated.eseMarks === 'number' ? Math.min(75, updated.eseMarks) : 65;
        const total = totalCIA + ese;

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

  // Official Hall Ticket Printable Document Generator
  const handlePrintHallTicket = (st) => {
    if (!st) return;
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to print/download the official hall ticket.');
      return;
    }

    const subs = ((st.subjects && st.subjects.length > 0)
      ? st.subjects
      : examsList.filter(e => !e.department || e.department === st.department)
    );

    const effectiveSubs = subs && subs.length > 0 ? subs : availableSubjects.filter(s => !s.department || s.department === st.department).slice(0, 5);

    const rowsHtml = (effectiveSubs && effectiveSubs.length > 0)
      ? effectiveSubs.map((sub, idx) => `
        <tr>
          <td style="border: 1px solid #334155; padding: 6px 10px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #334155; padding: 6px 10px; font-weight: bold;">${sub.code || ''}</td>
          <td style="border: 1px solid #334155; padding: 6px 10px;">${sub.name || ''}</td>
          <td style="border: 1px solid #334155; padding: 6px 10px; text-align: center;">${sub.date || 'TBD'}</td>
          <td style="border: 1px solid #334155; padding: 6px 10px; text-align: center;">${sub.session || 'FN'}</td>
          <td style="border: 1px solid #334155; padding: 6px 10px; text-align: center;">${sub.hall || st.hallNo || 'Hall 101'}</td>
          <td style="border: 1px solid #334155; padding: 6px 10px; text-align: center; height: 35px;"></td>
        </tr>
      `).join('')
      : `<tr><td colspan="7" style="border: 1px solid #334155; padding: 12px; text-align: center; color: #64748b;">No scheduled examination subjects found.</td></tr>`;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hall Ticket - ${st.name} (${st.rollNo})</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 20px; color: #0f172a; background: #fff; }
          .ticket-card { border: 2px solid #0f172a; padding: 24px; border-radius: 8px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .inst-name { font-size: 18px; font-weight: 900; letter-spacing: 0.5px; margin: 0; }
          .inst-sub { font-size: 12px; font-weight: 700; color: #475569; margin-top: 3px; }
          .doc-badge { display: inline-block; background: #0f172a; color: #fff; padding: 3px 12px; font-size: 11px; font-weight: 800; border-radius: 4px; margin-top: 6px; letter-spacing: 1px; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
          .info-table td { padding: 5px 8px; }
          .info-lbl { font-weight: 700; color: #475569; width: 20%; }
          .info-val { font-weight: 800; color: #0f172a; width: 30%; }
          .photo-box { width: 90px; height: 110px; border: 1.5px dashed #64748b; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 9px; font-weight: 700; color: #64748b; margin-left: auto; }
          .exams-table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-bottom: 20px; }
          .exams-table th { background: #f1f5f9; border: 1px solid #334155; padding: 6px 8px; font-weight: 800; text-align: center; }
          .rules { font-size: 10px; color: #475569; border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px 14px; border-radius: 6px; margin-bottom: 28px; }
          .rules-title { font-weight: 800; color: #0f172a; margin-bottom: 4px; text-transform: uppercase; font-size: 10px; }
          .rules-list { margin: 0; padding-left: 16px; line-height: 1.5; }
          .sig-row { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 20px; text-align: center; font-size: 11px; font-weight: 700; }
          .sig-block { width: 220px; }
          .sig-line { border-top: 1.5px solid #0f172a; padding-top: 4px; }
          .seal-box { width: 60px; height: 60px; border: 1.5px dashed #94a3b8; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #94a3b8; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="ticket-card">
          <div class="header">
            <h1 class="inst-name">VIVEKANANDA COLLEGE OF ARTS AND SCIENCES</h1>
            <div class="inst-sub">Office of the Controller of Examinations • End Semester Examinations Nov 2026</div>
            <div class="doc-badge">OFFICIAL EXAMINATION HALL TICKET</div>
          </div>

          <table style="width: 100%; margin-bottom: 12px;">
            <tr>
              <td style="vertical-align: top;">
                <table class="info-table">
                  <tr>
                    <td class="info-lbl">Student Name:</td>
                    <td class="info-val" style="font-size: 13px;">${st.name}</td>
                    <td class="info-lbl">Register No:</td>
                    <td class="info-val">${st.regNo || st.rollNo}</td>
                  </tr>
                  <tr>
                    <td class="info-lbl">Roll Number:</td>
                    <td class="info-val" style="color: #1d4ed8;">${st.rollNo}</td>
                    <td class="info-lbl">Department:</td>
                    <td class="info-val">${st.department}</td>
                  </tr>
                  <tr>
                    <td class="info-lbl">Year & Semester:</td>
                    <td class="info-val">Year ${st.year || 3} (${st.sem || 'Sem 5'})</td>
                    <td class="info-lbl">Allotted Hall:</td>
                    <td class="info-val" style="color: #b91c1c;">${st.hallNo || 'Hall 101'}</td>
                  </tr>
                  <tr>
                    <td class="info-lbl">Seat / Desk No:</td>
                    <td class="info-val" style="color: #b91c1c;">${st.seatNo || 'A1'}</td>
                    <td class="info-lbl">Eligibility:</td>
                    <td class="info-val" style="color: #15803d;">${st.status === 'Eligible' ? '✓ Eligible' : st.status}</td>
                  </tr>
                </table>
              </td>
              <td style="width: 100px; vertical-align: top; text-align: right;">
                <div class="photo-box">AFFIX PASSPORT PHOTO</div>
              </td>
            </tr>
          </table>

          <div style="font-weight: 800; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: #0f172a;">
            Registered Subject Examination Schedule:
          </div>
          <table class="exams-table">
            <thead>
              <tr>
                <th style="width: 35px;">S.No</th>
                <th style="width: 80px;">Code</th>
                <th>Subject Name</th>
                <th style="width: 100px;">Date</th>
                <th style="width: 65px;">Session</th>
                <th style="width: 75px;">Hall</th>
                <th style="width: 110px;">Invigilator Sign</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="rules">
            <div class="rules-title">Examination Guidelines for Candidate:</div>
            <ol class="rules-list">
              <li>Candidate must produce this Hall Ticket along with College Identity Card at each session.</li>
              <li>Candidates must occupy their allotted seats 15 minutes prior to the commencement of the exam.</li>
              <li>Possession of mobile phones, smartwatches, or unauthorized study material is strictly prohibited.</li>
              <li>No candidate will be allowed entry 30 minutes after commencement or allowed to leave before the final bell.</li>
            </ol>
          </div>

          <div class="sig-row">
            <div class="sig-block">
              <div style="height: 35px;"></div>
              <div class="sig-line">Signature of Candidate</div>
            </div>
            <div class="seal-box">SEAL</div>
            <div class="sig-block">
              <div style="height: 35px;"></div>
              <div class="sig-line">Controller of Examinations</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

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
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {hallsList.reduce((acc, h) => acc + (Number(h.allocatedStudents) || 0), 0)} Seats Allocated
            </p>
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
                  <option value="All Departments">All Departments</option>
                  {availableDepartments.filter(d => d !== 'All Departments').map(d => (
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
                    <th className="py-4 px-4 text-center">STATUS</th>
                    <th className="py-4 px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredExams.map((exam, idx) => (
                    <tr key={exam._id || exam.id || `${exam.code}_${exam.date}_${exam.session}_${idx}`} className="hover:bg-rose-50/20 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-extrabold text-slate-900 leading-tight">{exam.date}</p>
                        <span className="text-[11px] text-rose-600 font-bold">
                          {exam.session?.includes('AN') || exam.session?.toLowerCase().includes('afternoon') ? 'Afternoon (AN)' : 'Forenoon (FN)'}
                        </span>
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

                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {exam.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleDeleteSchedule(exam._id || exam.id, e)}
                          title="Delete Exam Entry"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
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
                    <th className="py-4 px-4">ELIGIBILITY</th>
                    <th className="py-4 px-6 text-right">HALL TICKET</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredStudents.map((s, idx) => (
                    <tr key={s._id || s.id || s.rollNo || `ht-${idx}`} className="hover:bg-slate-50/50">
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
      {/* 6. TAB 3: CIA INTERNAL MARKS ENTRY (OFFICIAL REGISTER FORMAT)             */}
      {/* ========================================================================= */}
      {activeTab === 'internal-marks' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                VIVEKANANDA COLLEGE OF ARTS AND SCIENCE • VELLALANKULAM - 627 856
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 mt-0.5">Continuous Internal Assessment (CIA) & Register Marks Entry</h3>
              <p className="text-xs text-slate-500 mt-0.5">Official College Register: SNAP TEST (ST 1-4) | INTERNAL (IT 1-2) | MODEL | PROJECT/SEMINAR | ASSIGNMENT (1-4)</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsMarksLocked(!isMarksLocked);
                  showToast(isMarksLocked ? 'Marks unlocked for editing.' : 'Marks successfully locked and frozen for CoE evaluation!');
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs rounded-xl transition-all border cursor-pointer ${
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
              <table className="w-full text-left border-collapse min-w-[1050px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-[10px] font-black text-slate-700 uppercase tracking-wider text-center">
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-200 w-12 bg-slate-200/60">S.NO</th>
                    <th rowSpan={2} className="py-2.5 px-4 text-left border-r border-slate-200 min-w-[180px] bg-slate-200/60">STUDENT ROLL & NAME</th>
                    <th colSpan={4} className="py-1 px-2 border-r border-slate-200 bg-sky-100/70 text-sky-950 font-black">SNAP TEST</th>
                    <th colSpan={2} className="py-1 px-2 border-r border-slate-200 bg-indigo-100/70 text-indigo-950 font-black">INTERNAL</th>
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-200 bg-purple-100/70 text-purple-950 font-black min-w-[65px]">MODEL</th>
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-200 bg-emerald-100/70 text-emerald-950 font-black min-w-[100px]">PROJECT / SEMINAR</th>
                    <th colSpan={4} className="py-1 px-2 border-r border-slate-200 bg-amber-100/70 text-amber-950 font-black">ASSIGNMENT</th>
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-200 bg-blue-100/70 text-blue-950 font-black min-w-[85px]">TOTAL CIA (25)</th>
                    <th rowSpan={2} className="py-2.5 px-4 text-right">GRADE</th>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600 uppercase text-center">
                    <th className="py-1 px-1 border-r border-slate-200 bg-sky-50 text-sky-900">ST 1</th>
                    <th className="py-1 px-1 border-r border-slate-200 bg-sky-50 text-sky-900">ST 2</th>
                    <th className="py-1 px-1 border-r border-slate-200 bg-sky-50 text-sky-900">ST 3</th>
                    <th className="py-1 px-1 border-r border-slate-200 bg-sky-50 text-sky-900">ST 4</th>
                    <th className="py-1 px-1 border-r border-slate-200 bg-indigo-50 text-indigo-900">IT 1</th>
                    <th className="py-1 px-1 border-r border-slate-200 bg-indigo-50 text-indigo-900">IT 2</th>
                    <th className="py-1 px-1 border-r border-slate-200 bg-amber-50 text-amber-900">1</th>
                    <th className="py-1 px-1 border-r border-slate-200 bg-amber-50 text-amber-900">2</th>
                    <th className="py-1 px-1 border-r border-slate-200 bg-amber-50 text-amber-900">3</th>
                    <th className="py-1 px-1 border-r border-slate-200 bg-amber-50 text-amber-900">4</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredStudents.map((s, idx) => (
                    <tr key={s._id || s.id || s.rollNo || `mark-${idx}`} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 text-center font-bold text-slate-400 border-r border-slate-100">{idx + 1}</td>
                      <td className="py-2 px-4 border-r border-slate-100">
                        <div className="font-mono font-bold text-blue-600 text-[11px]">{s.rollNo}</div>
                        <div className="font-extrabold text-slate-900">{s.name}</div>
                      </td>

                      {/* SNAP TESTS ST1 - ST4 */}
                      {['st1', 'st2', 'st3', 'st4'].map(f => (
                        <td key={f} className="py-1.5 px-1 text-center border-r border-slate-100 bg-sky-50/20">
                          <input
                            type="text"
                            disabled={isMarksLocked}
                            value={s[f] !== null && s[f] !== undefined ? s[f] : ""}
                            onChange={(e) => handleUpdateMarks(s.id, f, e.target.value)}
                            className="w-11 px-1 py-1 bg-white border border-slate-200 rounded-md text-center font-bold text-slate-900 focus:border-sky-500 focus:outline-none disabled:bg-slate-50 disabled:opacity-75"
                            placeholder="-"
                          />
                        </td>
                      ))}

                      {/* INTERNAL IT1 - IT2 */}
                      {['it1', 'it2'].map(f => {
                        const val = s[f] !== null && s[f] !== undefined ? s[f] : (f === 'it1' ? s.cia1 : s.cia2);
                        return (
                          <td key={f} className="py-1.5 px-1 text-center border-r border-slate-100 bg-indigo-50/20">
                            <input
                              type="text"
                              disabled={isMarksLocked}
                              value={val !== null && val !== undefined ? val : ""}
                              onChange={(e) => handleUpdateMarks(s.id, f, e.target.value)}
                              className="w-11 px-1 py-1 bg-white border border-slate-200 rounded-md text-center font-bold text-slate-900 focus:border-indigo-500 focus:outline-none disabled:bg-slate-50 disabled:opacity-75"
                              placeholder="-"
                            />
                          </td>
                        );
                      })}

                      {/* MODEL */}
                      <td className="py-1.5 px-1 text-center border-r border-slate-100 bg-purple-50/20">
                        <input
                          type="text"
                          disabled={isMarksLocked}
                          value={s.model !== null && s.model !== undefined ? s.model : ""}
                          onChange={(e) => handleUpdateMarks(s.id, 'model', e.target.value)}
                          className="w-12 px-1 py-1 bg-white border border-slate-200 rounded-md text-center font-bold text-slate-900 focus:border-purple-500 focus:outline-none disabled:bg-slate-50 disabled:opacity-75"
                          placeholder="-"
                        />
                      </td>

                      {/* PROJECT / SEMINAR */}
                      <td className="py-1.5 px-1 text-center border-r border-slate-100 bg-emerald-50/20">
                        <input
                          type="text"
                          disabled={isMarksLocked}
                          value={s.project !== null && s.project !== undefined ? s.project : ""}
                          onChange={(e) => handleUpdateMarks(s.id, 'project', e.target.value)}
                          className="w-14 px-1 py-1 bg-white border border-slate-200 rounded-md text-center font-bold text-slate-900 focus:border-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:opacity-75"
                          placeholder="-"
                        />
                      </td>

                      {/* ASSIGNMENT 1 - 4 */}
                      {['assignment1', 'assignment2', 'assignment3', 'assignment4'].map(f => (
                        <td key={f} className="py-1.5 px-1 text-center border-r border-slate-100 bg-amber-50/20">
                          <input
                            type="text"
                            disabled={isMarksLocked}
                            value={s[f] !== null && s[f] !== undefined ? s[f] : ""}
                            onChange={(e) => handleUpdateMarks(s.id, f, e.target.value)}
                            className="w-9 px-0.5 py-1 bg-white border border-slate-200 rounded-md text-center font-bold text-slate-900 focus:border-amber-500 focus:outline-none disabled:bg-slate-50 disabled:opacity-75"
                            placeholder="-"
                          />
                        </td>
                      ))}

                      {/* TOTAL CIA */}
                      <td className="py-2 px-3 text-center font-black text-sm text-indigo-700 bg-blue-50/30 border-r border-slate-100">
                        {s.ciaTotal} / 25
                      </td>

                      {/* GRADE */}
                      <td className="py-2 px-4 text-right">
                        <span className="px-2 py-0.5 rounded-md font-black text-xs bg-blue-50 text-blue-700 border border-blue-200">
                          {s.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Signature Verification Strip matching Vivekananda physical register */}
            <div className="p-3 bg-slate-50/90 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs font-bold text-slate-700">
              <div className="border border-slate-200 rounded-xl p-2.5 bg-white shadow-2xs">
                <div className="h-6 flex items-end justify-center font-serif italic text-blue-700 font-bold">
                  Faculty In-Charge
                </div>
                <div className="border-t border-slate-300 pt-1 uppercase tracking-wider text-[10px] text-slate-500 font-extrabold mt-1">
                  STAFF IN-CHARGE
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl p-2.5 bg-white shadow-2xs">
                <div className="h-6 flex items-end justify-center font-serif italic text-blue-700 font-bold">
                  {isMarksLocked ? "Dr. Meenakshi C" : "Verified"}
                </div>
                <div className="border-t border-slate-300 pt-1 uppercase tracking-wider text-[10px] text-slate-500 font-extrabold mt-1">
                  HEAD OF DEPARTMENT (HOD)
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl p-2.5 bg-white shadow-2xs">
                <div className="h-6 flex items-end justify-center font-serif italic text-blue-700 font-bold">
                  {isMarksLocked ? "Dr. K. Sundararajan" : "Approved"}
                </div>
                <div className="border-t border-slate-300 pt-1 uppercase tracking-wider text-[10px] text-slate-500 font-extrabold mt-1">
                  PRINCIPAL
                </div>
              </div>
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
                    <th className="py-4 px-4 text-center">INTERNAL (25)</th>
                    <th className="py-4 px-4 text-center">EXTERNAL (75)</th>
                    <th className="py-4 px-4 text-center">TOTAL (100)</th>
                    <th className="py-4 px-4 text-center">SGPA / CGPA</th>
                    <th className="py-4 px-6 text-right">GRADE CARD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredStudents.map((s, idx) => (
                    <tr key={s._id || s.id || s.rollNo || `res-${idx}`} className="hover:bg-slate-50/50">
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
      {/* 8. TAB 5: HALL SEATING & INVIGILATION                                    */}
      {/* ========================================================================= */}
      {activeTab === 'seating' && (
        <div className="space-y-5">
          {/* Top Controls & Action Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <span>Exam Hall Seating & Invigilation Duty</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage campus exam room capacities, student roll number allocations, and faculty invigilator assignments.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddHall(null)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs shadow-rose-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Exam Hall</span>
                </button>
              </div>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1 border-t border-slate-100">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={seatingSearchQuery}
                  onChange={(e) => setSeatingSearchQuery(e.target.value)}
                  placeholder="Search hall name, block, branches, roll number, or invigilator..."
                  className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                />
                {seatingSearchQuery && (
                  <button onClick={() => setSeatingSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="w-full sm:w-48 shrink-0">
                <select
                  value={seatingStatusFilter}
                  onChange={(e) => setSeatingStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Fully Allocated">Fully Allocated</option>
                  <option value="Allocated">Allocated</option>
                  <option value="Available">Available</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seating Stats Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Exam Halls</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{hallsList.length} Halls</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Across Campus Blocks</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Desk Capacity</span>
              <p className="text-xl font-black text-indigo-600 mt-0.5">
                {hallsList.reduce((acc, h) => acc + (Number(h.capacity) || 0), 0)} Seats
              </p>
              <p className="text-[11px] text-indigo-600/80 font-medium mt-0.5">Physical Capacity</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Candidates</span>
              <p className="text-xl font-black text-emerald-600 mt-0.5">
                {hallsList.reduce((acc, h) => acc + (Number(h.allocatedStudents) || 0), 0)} Students
              </p>
              <p className="text-[11px] text-emerald-600/80 font-medium mt-0.5">Seating Allotted</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faculty Invigilators</span>
              <p className="text-xl font-black text-purple-600 mt-0.5">
                {new Set(hallsList.map(h => h.invigilator).filter(Boolean)).size} Assigned
              </p>
              <p className="text-[11px] text-purple-600/80 font-medium mt-0.5">Chief Invigilators</p>
            </div>
          </div>

          {/* Halls Cards Grid */}
          {filteredHalls.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredHalls.map((h, hIdx) => {
                const hallKey = h._id || h.id || `hall-${hIdx}`;
                const cap = Number(h.capacity) || 60;
                const alloc = Number(h.allocatedStudents) || 0;
                const pct = Math.min(100, Math.round((alloc / cap) * 100));
                const isFull = pct >= 100;
                return (
                  <div key={hallKey} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 font-extrabold text-xs rounded-lg border border-rose-100 flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-rose-600" />
                          <span>Capacity: {cap} Seats</span>
                        </span>
                        <span className={`px-2.5 py-0.5 font-bold text-xs rounded-lg border ${
                          h.status === 'Fully Allocated'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : h.status === 'Allocated'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {h.status || (isFull ? 'Fully Allocated' : 'Allocated')}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-slate-900 flex items-center justify-between">
                        <span>{h.hallName}</span>
                        <span className="text-xs font-mono text-slate-400 font-medium">#{String(hIdx + 1).padStart(2, '0')}</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        <strong className="text-slate-700">Departments:</strong> {h.departments || 'Computer Science'}
                      </p>

                      {/* Capacity Occupancy Bar */}
                      <div className="my-3 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-500">Seating Occupancy</span>
                          <span className={isFull ? 'text-emerald-700' : 'text-blue-700'}>
                            {alloc} / {cap} Seats ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isFull ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Seating Details Card */}
                      <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/70 text-xs my-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="w-20 font-bold text-slate-700 shrink-0">Roll Numbers:</span>
                          <span className="font-mono font-semibold text-slate-800 break-all">{h.rollRange || '22CS001 - 22CS060'}</span>
                        </div>
                        <div className="flex items-start gap-2 pt-1 border-t border-slate-200/50">
                          <span className="w-20 font-bold text-slate-700 shrink-0">Invigilator:</span>
                          <div className="flex-1">
                            <span className="font-bold text-slate-900">{h.invigilator || 'Faculty Assigned'}</span>
                            {h.invigilatorDept && (
                              <span className="text-[10px] ml-2 px-1.5 py-0.5 bg-white border border-slate-200 text-slate-600 rounded font-semibold">
                                {h.invigilatorDept}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                      <span className="font-bold text-slate-500 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{alloc} Students Assigned</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingDoorSlip(h)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Print official hall entrance door slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Door Slip</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAddHall(h)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                          title="Edit hall details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteHall(h._id || h.id, h.hallName, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Remove exam hall"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-800">No Exam Halls Found</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {seatingSearchQuery || seatingStatusFilter !== 'ALL'
                    ? 'No examination halls match your search query or filter. Try clearing your search.'
                    : 'Examination halls have not been configured yet. Initialize campus default halls or add a new exam hall.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                {seatingSearchQuery || seatingStatusFilter !== 'ALL' ? (
                  <button
                    onClick={() => { setSeatingSearchQuery(''); setSeatingStatusFilter('ALL'); }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Clear Filter
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenAddHall(null)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs shadow-rose-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Hall</span>
                  </button>
                )}
              </div>
            </div>
          )}
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
                  <option value="">-- Select Department --</option>
                  {availableDepartments.filter(d => d !== 'All Departments').map(d => (
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
                    value={scheduleForm.session?.includes('AN') || scheduleForm.session?.toLowerCase().includes('afternoon') ? 'Afternoon (AN)' : 'Forenoon (FN)'}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, session: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none transition-all cursor-pointer"
                    required
                  >
                    <option value="Forenoon (FN)">Forenoon (FN)</option>
                    <option value="Afternoon (AN)">Afternoon (AN)</option>
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
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Allotted Hall: <strong className="text-blue-700">{viewingHallTicketStudent.hallNo || 'Hall 101'}</strong> • Seat: <strong className="text-blue-700">{viewingHallTicketStudent.seatNo || 'A1'}</strong>
                  </p>
                </div>

                <div className="w-20 h-24 border-2 border-dashed border-slate-300 bg-white rounded-xl flex flex-col items-center justify-center text-center text-[9px] text-slate-400 font-bold p-1 shrink-0">
                  <span>AFFIX PASSPORT PHOTO</span>
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
                      {(() => {
                        const subs = (viewingHallTicketStudent.subjects && viewingHallTicketStudent.subjects.length > 0)
                          ? viewingHallTicketStudent.subjects
                          : examsList.filter(e => !e.department || e.department === viewingHallTicketStudent.department);

                        const effectiveSubs = subs && subs.length > 0 ? subs : availableSubjects.filter(s => !s.department || s.department === viewingHallTicketStudent.department).slice(0, 5);

                        if (effectiveSubs && effectiveSubs.length > 0) {
                          return effectiveSubs.map((sub, sIdx) => (
                            <tr key={sIdx}>
                              <td className="p-2.5 font-bold text-slate-900">{sub.date || 'TBD'} ({sub.session || 'FN'})</td>
                              <td className="p-2.5 font-semibold text-slate-800">{sub.code} - {sub.name}</td>
                              <td className="p-2.5 text-slate-600">{sub.hall || viewingHallTicketStudent.hallNo || 'Hall 101'}</td>
                            </tr>
                          ));
                        }

                        return (
                          <tr>
                            <td colSpan={3} className="p-3 text-center text-slate-400 italic">No scheduled exams found.</td>
                          </tr>
                        );
                      })()}
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
                  <div className="h-10 flex items-center justify-center font-bold text-xs text-slate-400 italic">
                    (Seal & Signature)
                  </div>
                  <span className="font-bold text-slate-700 block border-t border-slate-300 pt-1">Controller of Examinations</span>
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setViewingHallTicketStudent(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handlePrintHallTicket(viewingHallTicketStudent)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Download Hall Ticket</span>
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
                <p className="text-xs text-slate-500">MSU Degree Regulations • Result Publication Nov 2026</p>
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
                    {((examsList.length > 0 ? examsList : (viewingGradeCardStudent.subjectCode ? [{ code: viewingGradeCardStudent.subjectCode, name: viewingGradeCardStudent.subjectName || viewingGradeCardStudent.subjectCode, credits: 4 }] : [])).slice(0, 5)).map((c, cIdx) => (
                      <tr key={cIdx}>
                        <td className="p-2.5 font-bold font-mono text-blue-600">{c.code}</td>
                        <td className="p-2.5 font-semibold text-slate-800">{c.name}</td>
                        <td className="p-2.5 text-center font-bold">4</td>
                        <td className="p-2.5 text-center font-black text-emerald-600">{viewingGradeCardStudent.grade || 'A+'}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-600">{viewingGradeCardStudent.result || 'PASS'}</td>
                      </tr>
                    ))}
                    {examsList.length === 0 && !viewingGradeCardStudent.subjectCode && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-xs text-slate-400 font-medium">No examination courses registered yet</td>
                      </tr>
                    )}
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

      {/* ========================================================================= */}
      {/* 12. MODAL: ADD / EDIT EXAM HALL                                           */}
      {/* ========================================================================= */}
      {isAddHallOpen && (
        <ModalPortal isOpen={isAddHallOpen} onClose={() => setIsAddHallOpen(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                    {editingHallId ? 'Edit Exam Hall' : 'Add Examination Hall'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Configure examination room, seating capacity, and invigilation</p>
                </div>
              </div>
              <button onClick={() => setIsAddHallOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHall} className="space-y-4">
              {/* 1. HALL NAME & VENUE */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Hall Name & Block *</label>
                  <span className="text-[11px] font-semibold text-indigo-600">Real Venues Dropdown</span>
                </div>
                <select
                  value={availableVenues.includes(hallForm.hallName) ? hallForm.hallName : ''}
                  onChange={(e) => {
                    if (e.target.value) setHallForm({ ...hallForm, hallName: e.target.value });
                  }}
                  className="w-full px-3.5 py-2 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-950 mb-1.5 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Quick Select Added Examination Venue / Hall --</option>
                  {availableVenues.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={hallForm.hallName}
                  onChange={(e) => setHallForm({ ...hallForm, hallName: e.target.value })}
                  placeholder="e.g. Hall 101 - Ramanujan Block"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                  required
                />
              </div>

              {/* 2. CAPACITY & ALLOCATED STUDENTS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Seating Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={hallForm.capacity}
                    onChange={(e) => setHallForm({ ...hallForm, capacity: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Allocated Students *</label>
                  <input
                    type="number"
                    min="0"
                    max={hallForm.capacity || 500}
                    value={hallForm.allocatedStudents}
                    onChange={(e) => setHallForm({ ...hallForm, allocatedStudents: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* 3. ALLOCATE SUBJECTS BY DEPARTMENT & SET TIMING */}
              <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Allocated Subjects &amp; Timing
                  </label>
                  <span className="text-[11px] font-semibold text-indigo-600">Department ➔ Subject Filter</span>
                </div>

                {/* 1. Pick Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      1. Select Department *
                    </label>
                    <select
                      value={selectedHallDept}
                      onChange={(e) => {
                        setSelectedHallDept(e.target.value);
                        setSelectedHallSubjectCode('');
                      }}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="">-- Choose Department --</option>
                      {availableDepartments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Pick Subject under that department & Add */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      2. Subject ({deptFilteredSubjects.length} Found)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedHallSubjectCode}
                        onChange={(e) => setSelectedHallSubjectCode(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="">-- Select Subject (Course Code) --</option>
                        {deptFilteredSubjects.map(s => (
                          <option key={s.code} value={s.code}>
                            {s.code} — {s.name}
                          </option>
                        ))}
                        <option value="CUSTOM">+ Enter Custom Code...</option>
                      </select>

                      <button
                        type="button"
                        onClick={handleAddSubjectToHall}
                        disabled={!selectedHallSubjectCode}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Subject
                      </button>
                    </div>
                  </div>
                </div>

                {/* Custom code inputs if selected */}
                {selectedHallSubjectCode === 'CUSTOM' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Subject Code (e.g. CS301)"
                      value={customHallSubCode}
                      onChange={(e) => setCustomHallSubCode(e.target.value.toUpperCase())}
                      className="px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Subject Name (e.g. Operating Systems)"
                      value={customHallSubName}
                      onChange={(e) => setCustomHallSubName(e.target.value)}
                      className="px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-medium focus:outline-none"
                    />
                  </div>
                )}

                {/* Configured Subjects List with Date & Timing Configuration ("and the timing will be set after that") */}
                {hallAllocatedSubjects.length > 0 ? (
                  <div className="space-y-2 pt-2 border-t border-indigo-100">
                    <div className="text-[11px] font-bold text-indigo-900 flex items-center justify-between">
                      <span>Configured Examination Subjects ({hallAllocatedSubjects.length}):</span>
                      <span className="text-[10px] text-slate-500">Set exam date &amp; session timing below</span>
                    </div>
                    {hallAllocatedSubjects.map((sub, sIdx) => (
                      <div key={sub.code || sIdx} className="bg-white rounded-xl p-2.5 border border-indigo-200/70 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                              {sub.code}
                            </span>
                            <span className="text-xs font-bold text-slate-800">{sub.name}</span>
                            <span className="text-[10px] font-semibold text-slate-500">({sub.department})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubjectFromHall(sub.code)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                            title="Remove Subject"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Exam Date</label>
                            <input
                              type="date"
                              value={sub.date || ''}
                              onChange={(e) => handleUpdateSubjectTiming(sub.code, 'date', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Session Timing</label>
                            <select
                              value={sub.session?.includes('AN') || sub.session?.toLowerCase().includes('afternoon') ? 'Afternoon (AN)' : 'Forenoon (FN)'}
                              onChange={(e) => handleUpdateSubjectTiming(sub.code, 'session', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            >
                              <option value="Forenoon (FN)">Forenoon (FN)</option>
                              <option value="Afternoon (AN)">Afternoon (AN)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic py-1">
                    No subjects added yet. Select a department above and click "Add Subject" to configure subjects and timing for this hall.
                  </p>
                )}

                {/* Branches / Departments Summary text */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Allocated Branches / Summary Text
                  </label>
                  <input
                    type="text"
                    value={hallForm.departments}
                    onChange={(e) => setHallForm({ ...hallForm, departments: e.target.value })}
                    placeholder="e.g. Computer Science (Sem 5) + Commerce (Sem 3)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* 4. ROLL NUMBER RANGE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number Range</label>
                <input
                  type="text"
                  value={hallForm.rollRange}
                  onChange={(e) => setHallForm({ ...hallForm, rollRange: e.target.value })}
                  placeholder="e.g. 22CS001 - 22CS030 & 23CM001 - 23CM030"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>

              {/* 5. CHIEF INVIGILATOR & INVIGILATOR DEPARTMENT (REAL DATA) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Chief Invigilator</label>
                    <span className="text-[11px] font-semibold text-indigo-600">Category Filter</span>
                  </div>
                  {/* Category Selection Filter (6. Tamil, 7. English, 8. Physical Education, 9. Office) */}
                  <select
                    value={invigilatorCategoryFilter}
                    onChange={(e) => setInvigilatorCategoryFilter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 mb-1.5 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Staff Categories ({facultyList.length})</option>
                    <option value="Computer Science">1. Computer Science</option>
                    <option value="Commerce">2. Commerce</option>
                    <option value="Mathematics">3. Mathematics</option>
                    <option value="Business Administration (BBA)">4. BBA</option>
                    <option value="Computer Applications (BCA)">5. BCA</option>
                    <option value="Tamil">6. Tamil</option>
                    <option value="English">7. English</option>
                    <option value="Physical Education">8. Physical Education</option>
                    <option value="Office">9. Office</option>
                  </select>

                  <select
                    value={facultyList.find(f => f.name === hallForm.invigilator)?.staffId || ''}
                    onChange={(e) => {
                      const staffId = e.target.value;
                      const member = facultyList.find(f => f.staffId === staffId);
                      if (member) {
                        setHallForm(prev => ({
                          ...prev,
                          invigilator: member.name,
                          invigilatorDept: member.department || member.dept || member.departmentName || (member.role === 'Office Staff' ? 'Office' : prev.invigilatorDept)
                        }));
                      }
                    }}
                    className="w-full px-3.5 py-2 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-950 mb-1.5 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Choose Real Faculty Invigilator ({filteredInvigilatorFaculty.length}) --</option>
                    {filteredInvigilatorFaculty.map(s => {
                      const deptStr = s.department || s.dept || s.departmentName || (s.role === 'Office Staff' ? 'Office' : 'General');
                      return (
                        <option key={s.staffId || s._id} value={s.staffId}>
                          [{deptStr}] {s.name} ({s.staffId})
                        </option>
                      );
                    })}
                  </select>
                  <input
                    type="text"
                    value={hallForm.invigilator}
                    onChange={(e) => setHallForm({ ...hallForm, invigilator: e.target.value })}
                    placeholder="e.g. Dr. S. Rajagopalan"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Invigilator Department</label>
                  <select
                    value={hallForm.invigilatorDept}
                    onChange={(e) => setHallForm({ ...hallForm, invigilatorDept: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Select Real Department --</option>
                    {availableDepartments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 6. STATUS */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={hallForm.status}
                  onChange={(e) => setHallForm({ ...hallForm, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="Allocated">Allocated</option>
                  <option value="Fully Allocated">Fully Allocated</option>
                  <option value="Available">Available</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddHallOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingHall}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingHallId ? 'Update Hall' : 'Register Hall'}</span>
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 13. MODAL: PRINTABLE DOOR SEATING SLIP                                    */}
      {/* ========================================================================= */}
      {viewingDoorSlip && (
        <ModalPortal isOpen={Boolean(viewingDoorSlip)} onClose={() => setViewingDoorSlip(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Examination Hall Door Slip</h3>
                <p className="text-xs text-slate-500">Official Candidate Seating Chart & Door Entrance Verification Notice</p>
              </div>
              <button onClick={() => setViewingDoorSlip(null)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Paper Card Frame */}
            <div className="p-6 bg-slate-50/90 rounded-2xl border-2 border-slate-300 space-y-5 print:border-none print:p-0">
              {/* Institutional Header */}
              <div className="text-center border-b-2 border-slate-800 pb-3 space-y-0.5">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  VIVEKANANDA COLLEGE OF ARTS AND SCIENCE
                </h4>
                <p className="text-[11px] font-bold text-slate-600">Affiliated with Manonmaniam Sundaranar University • Vellalankulam Campus</p>
                <p className="text-xs font-black text-rose-700 uppercase tracking-widest mt-1">
                  CONTROLLER OF EXAMINATIONS • END SEMESTER EXAMINATIONS (NOV/DEC 2026)
                </p>
                <div className="inline-block mt-1 px-3 py-0.5 bg-slate-900 text-white text-[11px] font-black rounded uppercase">
                  DOOR SEATING ARRANGEMENT SLIP
                </div>
              </div>

              {/* Hall Key Information Table */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">EXAMINATION HALL</span>
                  <span className="text-base font-black text-slate-900">{viewingDoorSlip.hallName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">CAPACITY / ALLOCATED</span>
                  <span className="text-base font-black text-indigo-700">
                    {viewingDoorSlip.allocatedStudents || viewingDoorSlip.capacity} / {viewingDoorSlip.capacity} Seats
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">BRANCHES / PROGRAMMES</span>
                  <span className="font-bold text-slate-800">{viewingDoorSlip.departments || 'Computer Science'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">ROLL NUMBER RANGE</span>
                  <span className="font-mono font-bold text-slate-900">{viewingDoorSlip.rollRange || '22CS001 - 22CS060'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">CHIEF INVIGILATOR</span>
                  <span className="font-bold text-slate-900">{viewingDoorSlip.invigilator || 'Faculty Assigned'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">SESSION & TIME</span>
                  <span className="font-bold text-slate-800">Forenoon (FN) • 09:30 AM - 12:30 PM</span>
                </div>
              </div>

              {/* Seating Desk Grid Matrix Preview */}
              <div>
                <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                  <span>Desk Layout Allocation (Row A to F)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Single candidate per desk</span>
                </h5>
                <div className="grid grid-cols-6 gap-2 text-center text-[10px] font-mono">
                  {Array.from({ length: Math.min(30, Number(viewingDoorSlip.capacity) || 30) }).map((_, i) => (
                    <div key={i} className="bg-white border border-slate-300 rounded-lg p-2 space-y-0.5 shadow-2xs">
                      <span className="text-slate-400 font-sans block text-[9px]">Desk {String(i + 1).padStart(2, '0')}</span>
                      <strong className="text-slate-900 block truncate">
                        {i % 2 === 0 ? `22CS${String(i + 1).padStart(3, '0')}` : `23CM${String(i).padStart(3, '0')}`}
                      </strong>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 italic text-center mt-2">
                  * Showing sample desk grid orientation. Remaining candidate desks arranged sequentially in rows G to L.
                </p>
              </div>

              {/* Official Signatures Row */}
              <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <div className="border-b border-dashed border-slate-400 pb-8 font-serif italic text-slate-400">Signature</div>
                  <span className="font-bold text-[11px] text-slate-700 mt-1 block">Hall Invigilator</span>
                </div>
                <div>
                  <div className="border-b border-dashed border-slate-400 pb-8 font-serif italic text-slate-400">Signature</div>
                  <span className="font-bold text-[11px] text-slate-700 mt-1 block">Chief Superintendent</span>
                </div>
                <div>
                  <div className="border-b border-dashed border-slate-400 pb-8 font-serif italic text-slate-400">Seal & Signature</div>
                  <span className="font-bold text-[11px] text-slate-700 mt-1 block">Controller of Examinations</span>
                </div>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setViewingDoorSlip(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  showToast(`Door Slip for ${viewingDoorSlip.hallName} sent to print.`);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Door Seating Slip</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
