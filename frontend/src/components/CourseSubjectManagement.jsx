import React, { useState, useMemo } from 'react';
import { API_BASE, BACKEND_URL, getKnownDepartments } from '../apiConfig';
import { createPortal } from 'react-dom';
import { 
  BookOpen, 
  Plus, 
  Eye, 
  Pencil, 
  Trash2, 
  Search, 
  X, 
  Check, 
  GraduationCap, 
  Building2, 
  Layers, 
  Calendar, 
  Clock, 
  Award, 
  FileText, 
  Download, 
  Filter, 
  Users, 
  ChevronRight, 
  AlertTriangle,
  Sparkles,
  BookMarked,
  LayoutGrid,
  List,
  Printer,
  CheckCircle2,
  Share2,
  BarChart2,
  SlidersHorizontal,
  RotateCcw,
  ArrowRight,
  BookCopy,
  Save
} from 'lucide-react';
import ModalPortal from './ModalPortal';

const INITIAL_PROGRAMS = [];

const INITIAL_SUBJECTS = [];

// Subject Types are dynamically derived from real database subjects

const SEMESTERS = [
  'All Semesters',
  'Sem 1',
  'Sem 2',
  'Sem 3',
  'Sem 4',
  'Sem 5',
  'Sem 6'
];

export const DEPARTMENT_HEADS = {};
export const DEPARTMENT_FACULTY_MEMBERS = {};

export default function CourseSubjectManagement({ user }) {
  const isSuperAdmin = user?.role === 'Super Admin' || user?.isSuperAdmin || JSON.parse(sessionStorage.getItem('vcas_user') || '{}')?.role === 'Super Admin';
  // Tabs: 'subjects', 'programs', 'matrix', 'allocation'
  const [activeTab, setActiveTab] = useState('subjects');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  const [departmentsList, setDepartmentsList] = useState([]);

  const [programsList, setProgramsList] = useState(() => {
    try {
      const cached = localStorage.getItem('vcas_programs_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [];
  });

  const [subjectsList, setSubjectsList] = useState(() => {
    try {
      const cached = localStorage.getItem('vcas_subjects_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .filter(s => s && s.code !== 'CS101' && s._id !== '6ad345945892adbcf3013478')
            .map(s => {
              if (Array.isArray(s.units) && s.units.some(u => u && u.title && u.title.includes('Foundational Principles'))) {
                return { ...s, units: [] };
              }
              return s;
            });
        }
      }
    } catch (_) {}
    return [];
  });

  const [facultyList, setFacultyList] = useState([]);
  const [totalEnrolledStudents, setTotalEnrolledStudents] = useState(0);

  // Fetch real data from backend API
  const fetchCoursesAndSubjects = async () => {
    try {
      const [resCourses, resSubjects, resStaff, resStudents, resDepts, resClasses] = await Promise.allSettled([
        fetch(`${API_BASE}/courses`),
        fetch(`${API_BASE}/subjects`),
        fetch(`${API_BASE}/staff`),
        fetch(`${API_BASE}/students`),
        fetch(`${API_BASE}/departments`),
        fetch(`${API_BASE}/classes`).catch(() => null)
      ]);

      let realDepts = [];
      if (resDepts.status === 'fulfilled' && resDepts.value.ok) {
        const dData = await resDepts.value.json();
        if (dData.success && Array.isArray(dData.data)) {
          realDepts = dData.data;
          setDepartmentsList(dData.data);
        }
      }

      if (resCourses.status === 'fulfilled' && resCourses.value.ok) {
        const cData = await resCourses.value.json();
        if (cData.success && Array.isArray(cData.data)) {
          const list = cData.data.filter(c => Boolean(c.code));
          setProgramsList(list);
          try { localStorage.setItem('vcas_programs_cache', JSON.stringify(list)); } catch (_) {}
        }
      }

      let clean = [];
      if (resSubjects.status === 'fulfilled' && resSubjects.value.ok) {
        const sData = await resSubjects.value.json();
        const subjectRows = Array.isArray(sData?.data)
          ? sData.data
          : Array.isArray(sData?.subjects)
            ? sData.subjects
            : [];

        if (subjectRows.length > 0) {
          clean = subjectRows
            .filter(s => Boolean(s.code) && s.code !== 'CS101')
            .map(s => {
              if (Array.isArray(s.units) && s.units.some(u => u && u.title && u.title.includes('Foundational Principles'))) {
                return { ...s, units: [] };
              }
              return s;
            });
        }
      }

      if (resClasses.status === 'fulfilled' && resClasses.value && resClasses.value.ok) {
        const cData = await resClasses.value.json();
        const classList = cData?.classes || cData?.data || (Array.isArray(cData) ? cData : []);
        const seen = new Set(clean.map(s => (s.code || '').trim().toUpperCase()));
        classList.forEach(cls => {
          const code = (cls.code || cls.classCode || '').trim().toUpperCase();
          if (!code || seen.has(code)) return;
          seen.add(code);
          clean.push({
            code,
            name: cls.name || cls.className || code,
            department: cls.dept || cls.department || 'General',
            year: Number(cls.year) || 1,
            sem: cls.semester ? `Sem ${cls.semester}` : 'Sem 1',
            credits: Number(cls.credits) || 3,
            type: Number(cls.labHours) > 0 ? 'Practical / Lab' : 'Theory',
            faculty: cls.staffName || 'Unassigned',
            theoryHours: Number(cls.theoryHours) || 3,
            labHours: Number(cls.labHours) || 0,
            hours: Number(cls.labHours) > 0 ? `${Number(cls.theoryHours) || 3}h Theory + ${Number(cls.labHours) || 0}h Continuous Lab` : `${Number(cls.theoryHours) || 3} hrs/wk`,
            isContinuousLab: Boolean(cls.isContinuousLab || Number(cls.labHours) > 0)
          });
        });
      }

      if (clean.length === 0) {
        try {
          const cached = JSON.parse(localStorage.getItem('vcas_subjects_cache') || '[]');
          if (Array.isArray(cached) && cached.length > 0) {
            clean = cached.filter(s => Boolean(s.code) && s.code !== 'CS101');
          }
        } catch (_) {}
      }

      setSubjectsList(clean);
      try { localStorage.setItem('vcas_subjects_cache', JSON.stringify(clean)); } catch (_) {}

      if (resStudents.status === 'fulfilled' && resStudents.value.ok) {
        const stuData = await resStudents.value.json();
        if (stuData.success && Array.isArray(stuData.data)) {
          setTotalEnrolledStudents(stuData.data.length);
        }
      }

      if (resStaff.status === 'fulfilled' && resStaff.value.ok) {
        const stData = await resStaff.value.json();
        if (stData.success && Array.isArray(stData.data)) {
          setFacultyList(stData.data);
        }
      }
    } catch (err) {
      console.error('Error fetching courses/subjects/staff/departments from backend:', err);
    }
  };

  React.useEffect(() => {
    fetchCoursesAndSubjects();
  }, []);

  // Selected Program for Curriculum Matrix View
  const [matrixSelectedProgramCode, setMatrixSelectedProgramCode] = useState('');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedSem, setSelectedSem] = useState('All Semesters');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedCredits, setSelectedCredits] = useState('ALL');

  // Dynamic Subject Types from real database subjects
  const dynamicSubjectTypes = useMemo(() => {
    const typesSet = new Set();
    subjectsList.forEach(s => {
      if (s.type && String(s.type).trim()) {
        typesSet.add(String(s.type).trim());
      }
    });
    return ['All Types', ...Array.from(typesSet)];
  }, [subjectsList]);

  // Modals state
  const [viewingSubject, setViewingSubject] = useState(null);
  const [viewingProgram, setViewingProgram] = useState(null);

  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false);

  const [editingSubject, setEditingSubject] = useState(null);
  const [editingProgram, setEditingProgram] = useState(null);

  const [deletingSubject, setDeletingSubject] = useState(null);
  const [deletingProgram, setDeletingProgram] = useState(null);

  // Lock background scroll when any modal is open
  React.useEffect(() => {
    const isAnyModalOpen = Boolean(
      viewingSubject || viewingProgram || isAddSubjectOpen || isAddProgramOpen ||
      editingSubject || editingProgram || deletingSubject || deletingProgram
    );
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
  }, [
    viewingSubject, viewingProgram, isAddSubjectOpen, isAddProgramOpen,
    editingSubject, editingProgram, deletingSubject, deletingProgram
  ]);

  // Reallocate Faculty Modal
  const [reallocatingSubject, setReallocatingSubject] = useState(null);
  const [newFacultyName, setNewFacultyName] = useState('');

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    const text = typeof msg === 'string'
      ? msg
      : (msg?.message || (msg && typeof msg === 'object' && !msg._reactName ? JSON.stringify(msg) : 'Action completed'));
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Department name normalization helper
  const normalizeDeptName = (deptName) => {
    if (!deptName) return '';
    const trimmed = String(deptName).trim();
    // 1. Direct match with a department name or code
    const exact = departmentsList.find(d => 
      d.name?.trim().toLowerCase() === trimmed.toLowerCase() ||
      d.code?.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exact) return exact.name;

    // 2. Map legacy default 'Computer Science' to real department 'BSc. Computer science'
    if (trimmed.toLowerCase() === 'computer science') {
      const cs = departmentsList.find(d => 
        d.name?.toLowerCase().includes('computer science') ||
        d.code?.toUpperCase() === 'BCS'
      );
      if (cs) return cs.name;
    }

    // 3. Map 'BCA' to 'computer application'
    if (trimmed.toLowerCase() === 'bca' || trimmed.toLowerCase() === 'computer applications') {
      const ca = departmentsList.find(d => 
        d.name?.toLowerCase().includes('computer application') ||
        d.code?.toUpperCase() === 'CA'
      );
      if (ca) return ca.name;
    }

    return trimmed;
  };

  // Only exact real departments added in DB
  const realDepartmentNames = useMemo(() => {
    const list = departmentsList.map(d => d.name?.trim()).filter(Boolean);
    const unique = Array.from(new Set(list));
    return unique.length > 0 ? unique : getKnownDepartments();
  }, [departmentsList]);

  // Form State for Subject Add / Edit
  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name: '',
    department: 'Computer Science',
    year: 1,
    sem: 'Sem 1',
    credits: 4,
    type: 'Theory',
    faculty: '',
    ltp: '3-0-0',
    theoryHours: 3,
    labHours: 0,
    isContinuousLab: true,
    hours: '3 hrs/wk',
    prerequisite: 'None',
    textbooks: ''
  });

  // Form State for Program Add / Edit
  const [programForm, setProgramForm] = useState({
    code: '',
    name: '',
    degreeLevel: 'Undergraduate (UG)',
    department: 'Computer Science',
    regulation: 'Regulation 2024 (R24)',
    durationYears: 3,
    totalCredits: 140,
    coordinator: '',
    coordinatorEmail: '',
    description: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // -------------------------------------------------------------
  // Filtered lists
  // -------------------------------------------------------------
  const filteredSubjects = useMemo(() => {
    return subjectsList.filter(s => {
      const q = (searchQuery || '').toLowerCase().trim();
      const sDept = normalizeDeptName(s.department);
      const matchesSearch = !q || (
        String(s.name || '').toLowerCase().includes(q) ||
        String(s.code || '').toLowerCase().includes(q) ||
        String(s.faculty || '').toLowerCase().includes(q) ||
        String(sDept || '').toLowerCase().includes(q) ||
        (s.textbooks && String(s.textbooks).toLowerCase().includes(q))
      );

      const matchesDept = selectedDept === 'All Departments' || 
        sDept.toLowerCase() === selectedDept.toLowerCase() ||
        String(s.department || '').toLowerCase() === selectedDept.toLowerCase();

      const matchesYear = selectedYear === 'ALL' || Number(s.year) === Number(selectedYear);

      const sSemClean = String(s.sem || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const selSemClean = String(selectedSem || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchesSem = selectedSem === 'All Semesters' || sSemClean === selSemClean;

      const matchesType = selectedType === 'All Types' || String(s.type || '').trim().toLowerCase() === String(selectedType || '').trim().toLowerCase();
      
      let matchesCredits = true;
      const cNum = Number(s.credits) || 0;
      if (selectedCredits === '1-2') matchesCredits = cNum <= 2;
      else if (selectedCredits === '3') matchesCredits = cNum === 3;
      else if (selectedCredits === '4') matchesCredits = cNum === 4;
      else if (selectedCredits === '5+') matchesCredits = cNum >= 5;

      return matchesSearch && matchesDept && matchesYear && matchesSem && matchesType && matchesCredits;
    });
  }, [subjectsList, searchQuery, selectedDept, selectedYear, selectedSem, selectedType, selectedCredits, departmentsList]);

  const filteredPrograms = useMemo(() => {
    return programsList.filter(p => {
      const q = (searchQuery || '').toLowerCase().trim();
      const pDept = normalizeDeptName(p.department);
      const matchesSearch = !q || (
        String(p.name || '').toLowerCase().includes(q) ||
        String(p.code || '').toLowerCase().includes(q) ||
        String(p.coordinator || '').toLowerCase().includes(q) ||
        String(pDept || '').toLowerCase().includes(q) ||
        String(p.regulation || '').toLowerCase().includes(q)
      );

      const matchesDept = selectedDept === 'All Departments' || 
        pDept.toLowerCase() === selectedDept.toLowerCase() ||
        String(p.department || '').toLowerCase() === selectedDept.toLowerCase();

      return matchesSearch && matchesDept;
    });
  }, [programsList, searchQuery, selectedDept, departmentsList]);

  // Distinct Faculty Teaching Workload
  const facultyWorkload = useMemo(() => {
    const map = {};
    const fakeFaculty = ['Dr. Ramesh Kumar', 'Dr. Ananya Sharma'];
    subjectsList.forEach(sub => {
      const fac = (sub.faculty || '').trim();
      if (!fac || fac === 'Unassigned' || fakeFaculty.includes(fac)) return;
      if (!map[fac]) {
        map[fac] = {
          name: fac,
          department: sub.department,
          subjects: [],
          totalCredits: 0,
          totalStudents: 0
        };
      }
      map[fac].subjects.push(sub);
      map[fac].totalCredits += sub.credits;
    });

    Object.values(map).forEach(f => {
      const maxSubStudents = Math.max(0, ...f.subjects.map(s => Number(s.studentsEnrolled) || 0));
      f.totalStudents = totalEnrolledStudents > 0 
        ? Math.min(totalEnrolledStudents, maxSubStudents || totalEnrolledStudents) 
        : (maxSubStudents || 3);
    });

    return Object.values(map);
  }, [subjectsList, totalEnrolledStudents]);

  // Selected Program for Matrix
  const activeMatrixProgram = useMemo(() => {
    const list = programsList && programsList.length > 0 ? programsList : [];
    if (!list.length) return null;
    return list.find(p => p.code === matrixSelectedProgramCode) || list[0] || null;
  }, [programsList, matrixSelectedProgramCode]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDept('All Departments');
    setSelectedYear('ALL');
    setSelectedSem('All Semesters');
    setSelectedType('All Types');
    setSelectedCredits('ALL');
  };

  // -------------------------------------------------------------
  // CSV Export Handler
  // -------------------------------------------------------------
  const handleExportCSV = () => {
    const headers = ['Subject Code', 'Subject Name', 'Department', 'Year', 'Semester', 'Credits', 'Type', 'Faculty In-Charge', 'L-T-P', 'Prerequisites'];
    const rows = filteredSubjects.map(s => [
      `"${s.code}"`,
      `"${s.name}"`,
      `"${s.department}"`,
      `"Year ${s.year}"`,
      `"${s.sem}"`,
      s.credits,
      `"${s.type}"`,
      `"${s.faculty}"`,
      `"${s.ltp || '3-1-0'}"`,
      `"${s.prerequisite || 'None'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vidyapeeth_Curriculum_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Curriculum catalog exported as CSV successfully!');
  };

  // -------------------------------------------------------------
  // Subject Handlers
  // -------------------------------------------------------------
  const handleOpenAddSubject = (defaultSem) => {
    const initialDept = selectedDept !== 'All Departments' ? selectedDept : (realDepartmentNames[0] || 'Computer Science');
    const deptObj = departmentsList.find(d => d.name === initialDept);
    const prefix = deptObj?.code || (initialDept.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 3)) || 'CS';
    const initialYear = selectedYear !== 'ALL' ? Number(selectedYear) : 1;
    const semValue = (typeof defaultSem === 'string' && defaultSem.trim())
      ? defaultSem.trim()
      : (selectedSem !== 'All Semesters' ? selectedSem : `Sem ${initialYear * 2 - 1}`);

    setSubjectForm({
      code: `${prefix}${initialYear}01`,
      name: '',
      department: initialDept,
      year: initialYear,
      sem: semValue,
      credits: 4,
      type: 'Theory',
      faculty: deptObj?.hod || '',
      ltp: '3-0-0',
      theoryHours: 3,
      labHours: 0,
      isContinuousLab: true,
      hours: '3 hrs/wk',
      prerequisite: 'None',
      textbooks: '',
      studentsEnrolled: 0
    });
    setFormErrors({});
    setIsAddSubjectOpen(true);
  };

  const handleSubjectDeptChange = (newDept) => {
    const deptObj = departmentsList.find(d => d.name === newDept);
    const prefix = deptObj?.code || (newDept.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 3)) || 'CS';
    let newCode = subjectForm.code;
    if (!editingSubject) {
      const year = subjectForm.year || 1;
      newCode = `${prefix}${year}01`;
    }

    setSubjectForm(prev => ({
      ...prev,
      department: newDept,
      faculty: deptObj?.hod || prev.faculty || '',
      code: newCode
    }));
  };

  const handleSubjectYearChange = (newYear) => {
    const yearNum = Number(newYear);
    const deptObj = departmentsList.find(d => d.name === subjectForm.department);
    const prefix = deptObj?.code || (String(subjectForm.department || '').split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 3)) || 'CS';
    
    setSubjectForm(prev => ({
      ...prev,
      year: yearNum,
      sem: `Sem ${yearNum * 2 - 1}`,
      code: editingSubject ? prev.code : `${prefix}${yearNum}01`
    }));
  };

  const handleOpenEditSubject = (subj) => {
    setEditingSubject(subj);
    setSubjectForm({
      code: subj.code,
      name: subj.name,
      department: normalizeDeptName(subj.department),
      year: subj.year,
      sem: subj.sem,
      credits: subj.credits,
      type: subj.type,
      faculty: subj.faculty,
      ltp: subj.ltp || '3-0-0',
      theoryHours: subj.theoryHours !== undefined ? subj.theoryHours : 3,
      labHours: subj.labHours !== undefined ? subj.labHours : (subj.type === 'Practical / Lab' ? 3 : 0),
      isContinuousLab: true,
      hours: subj.hours || '3 hrs/wk',
      prerequisite: subj.prerequisite || 'None',
      textbooks: subj.textbooks || '',
      studentsEnrolled: subj.studentsEnrolled || 0
    });
    setFormErrors({});
  };

  const handleSaveSubject = (e) => {
    e.preventDefault();
    const errors = {};
    if (!subjectForm.name.trim()) errors.name = 'Subject name is required';
    if (!subjectForm.code.trim()) {
      subjectForm.code = `SUB-${Date.now().toString(36).toUpperCase()}`;
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingSubject) {
      // Update
      const targetId = editingSubject._id || editingSubject.id || editingSubject.code;
      const tHours = Number(subjectForm.theoryHours) >= 0 ? Number(subjectForm.theoryHours) : 3;
      const lHours = Number(subjectForm.labHours) >= 0 ? Number(subjectForm.labHours) : 0;
      const computedHours = lHours > 0 ? `${tHours}h Theory + ${lHours}h Continuous Lab` : `${tHours} hrs/wk`;

      const updated = {
        ...editingSubject,
        ...subjectForm,
        code: subjectForm.code.trim().toUpperCase(),
        theoryHours: tHours,
        labHours: lHours,
        hours: computedHours,
        isContinuousLab: true,
        type: lHours > 0 && (subjectForm.type === 'Core Theory' || subjectForm.type === 'Theory') ? 'Practical / Lab' : subjectForm.type,
        studentsEnrolled: Number(subjectForm.studentsEnrolled) || 0
      };
      setSubjectsList(prev => prev.map(s => (s.id === editingSubject.id || s._id === editingSubject._id) ? updated : s));
      if (viewingSubject && (viewingSubject.id === editingSubject.id || viewingSubject._id === editingSubject._id)) {
        setViewingSubject(updated);
      }
      setEditingSubject(null);
      showToast(`Subject ${updated.code} updated. Hall Ticket & Timetable synchronized.`);

      // Sync with MongoDB backend
      fetch(`${API_BASE}/subjects/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).then(r => r.json()).then(async (data) => {
        if (data.success && data.data) {
          setSubjectsList(prev => prev.map(s => (s.code === updated.code) ? data.data : s));
        }
        await fetchCoursesAndSubjects();
      }).catch(async (err) => {
        console.error('Error updating subject in backend:', err);
        await fetchCoursesAndSubjects();
      });

    } else {
      // Create new
      const semStr = (typeof subjectForm.sem === 'string' && subjectForm.sem.trim())
        ? subjectForm.sem.trim()
        : `Sem ${(Number(subjectForm.year) || 1) * 2 - 1}`;
      const tHours = Number(subjectForm.theoryHours) >= 0 ? Number(subjectForm.theoryHours) : 3;
      const lHours = Number(subjectForm.labHours) >= 0 ? Number(subjectForm.labHours) : 0;
      const computedHours = lHours > 0 ? `${tHours}h Theory + ${lHours}h Continuous Lab` : `${tHours} hrs/wk`;

      const newSubj = {
        id: Date.now(),
        ...subjectForm,
        code: subjectForm.code.trim().toUpperCase(),
        sem: semStr,
        theoryHours: tHours,
        labHours: lHours,
        hours: computedHours,
        isContinuousLab: true,
        type: lHours > 0 && (subjectForm.type === 'Core Theory' || subjectForm.type === 'Theory') ? 'Practical / Lab' : (subjectForm.type || 'Theory'),
        studentsEnrolled: Number(subjectForm.studentsEnrolled) || 0,
        units: Array.isArray(subjectForm.units) ? subjectForm.units : [],
        evaluation: { internal: 40, external: 60 }
      };
      setSubjectsList(prev => {
        const next = [newSubj, ...prev];
        try { localStorage.setItem('vcas_subjects_cache', JSON.stringify(next)); } catch (_) {}
        return next;
      });
      setIsAddSubjectOpen(false);
      showToast(`Class & Subject ${newSubj.code} added. Weekly timetable automatically generated with continuous lab hours!`);

      // Sync with MongoDB backend
      fetch(`${API_BASE}/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubj)
      }).then(r => r.json()).then(async (data) => {
        if (data.success && data.data) {
          setSubjectsList(prev => {
            const next = prev.map(s => s.code === newSubj.code ? data.data : s);
            try { localStorage.setItem('vcas_subjects_cache', JSON.stringify(next)); } catch (_) {}
            return next;
          });
        }
        await fetchCoursesAndSubjects();
      }).catch(async (err) => {
        console.error('Error creating subject in backend:', err);
        await fetchCoursesAndSubjects();
      });
    }
  };

  const handleConfirmDeleteSubject = () => {
    if (deletingSubject) {
      const targetId = deletingSubject._id || deletingSubject.id || deletingSubject.code;
      const codeToDelete = (deletingSubject.code || '').trim().toUpperCase();
      setSubjectsList(prev => {
        const next = prev.filter(s => s.id !== deletingSubject.id && s._id !== deletingSubject._id && (s.code || '').toUpperCase() !== codeToDelete);
        try { localStorage.setItem('vcas_subjects_cache', JSON.stringify(next)); } catch (_) {}
        return next;
      });
      // Purge from custom timing caches
      try {
        const timings = JSON.parse(localStorage.getItem('vcas_staff_custom_subjects_timing') || '{}');
        if (timings[codeToDelete]) {
          delete timings[codeToDelete];
          localStorage.setItem('vcas_staff_custom_subjects_timing', JSON.stringify(timings));
        }
      } catch (_) {}

      // Dispatch event so other components immediately know a subject was removed
      try {
        window.dispatchEvent(new CustomEvent('vcas_subject_removed', { detail: { code: codeToDelete, id: targetId } }));
      } catch (_) {}

      if (viewingSubject && (viewingSubject.id === deletingSubject.id || viewingSubject._id === deletingSubject._id)) {
        setViewingSubject(null);
      }
      showToast(`Subject ${deletingSubject.code} removed from catalog and all exam schedules.`);

      // Sync with MongoDB backend
      fetch(`${API_BASE}/subjects/${targetId}`, {
        method: 'DELETE'
      }).then(async () => {
        await fetchCoursesAndSubjects();
      }).catch(async (err) => {
        console.error('Error deleting subject in backend:', err);
        await fetchCoursesAndSubjects();
      });

      setDeletingSubject(null);
    }
  };

  // -------------------------------------------------------------
  // Program Handlers
  // -------------------------------------------------------------
  const handleOpenAddProgram = (defaultDept) => {
    const chosenDept = (typeof defaultDept === 'string' && defaultDept.trim())
      ? defaultDept.trim()
      : (selectedDept !== 'All Departments' ? selectedDept : (realDepartmentNames[0] || 'Computer Science'));
    const deptObj = departmentsList.find(d => d.name === chosenDept);
    const prefix = deptObj?.code || (chosenDept.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 3)) || 'BSC';
    setProgramForm({
      code: `${prefix}-PROG`,
      name: '',
      degreeLevel: 'Undergraduate (UG)',
      department: chosenDept,
      regulation: 'Regulation 2024 (R24)',
      durationYears: 3,
      totalCredits: 140,
      coordinator: '',
      coordinatorEmail: '',
      description: ''
    });
    setFormErrors({});
    setIsAddProgramOpen(true);
  };

  const handleOpenEditProgram = (prog) => {
    setEditingProgram(prog);
    setProgramForm({
      code: prog.code,
      name: prog.name,
      degreeLevel: prog.degreeLevel,
      department: normalizeDeptName(prog.department),
      regulation: prog.regulation || 'Regulation 2024 (R24)',
      durationYears: prog.durationYears,
      totalCredits: prog.totalCredits,
      coordinator: prog.coordinator,
      coordinatorEmail: prog.coordinatorEmail || `${prog.coordinator?.toLowerCase().replace(/[^a-z]/g, '')}@vcas.edu`,
      description: prog.description || ''
    });
    setFormErrors({});
  };

  const handleSaveProgram = (e) => {
    e.preventDefault();
    const errors = {};
    if (!programForm.name.trim()) errors.name = 'Program name is required';
    if (!programForm.code.trim()) errors.code = 'Program code is required';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingProgram) {
      const targetId = editingProgram._id || editingProgram.id || editingProgram.code;
      const updated = {
        ...editingProgram,
        ...programForm,
        code: programForm.code.trim().toUpperCase(),
        totalSemesters: programForm.durationYears * 2
      };
      setProgramsList(prev => prev.map(p => (p.id === editingProgram.id || p._id === editingProgram._id) ? updated : p));
      if (viewingProgram && (viewingProgram.id === editingProgram.id || viewingProgram._id === editingProgram._id)) {
        setViewingProgram(updated);
      }
      setEditingProgram(null);
      showToast(`Degree Program ${updated.code} updated.`);

      // Sync with MongoDB backend
      fetch(`${API_BASE}/courses/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).then(r => r.json()).then(data => {
        if (data.success && data.data) {
          setProgramsList(prev => prev.map(p => p.code === updated.code ? data.data : p));
        }
      }).catch(err => console.error('Error updating program in backend:', err));

    } else {
      const newProg = {
        id: Date.now(),
        ...programForm,
        code: programForm.code.trim().toUpperCase(),
        totalSemesters: programForm.durationYears * 2,
        enrolledStudents: 60,
        totalSubjects: programForm.durationYears * 10,
        establishedYear: new Date().getFullYear().toString()
      };
      setProgramsList(prev => [...prev, newProg]);
      setIsAddProgramOpen(false);
      showToast(`New Degree Program ${newProg.code} registered.`);

      // Sync with MongoDB backend
      fetch(`${API_BASE}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProg)
      }).then(r => r.json()).then(data => {
        if (data.success && data.data) {
          setProgramsList(prev => prev.map(p => p.code === newProg.code ? data.data : p));
        }
      }).catch(err => console.error('Error creating program in backend:', err));
    }
  };

  const handleConfirmDeleteProgram = () => {
    if (deletingProgram) {
      const targetId = deletingProgram._id || deletingProgram.id || deletingProgram.code;
      setProgramsList(prev => {
        const next = prev.filter(p => p.id !== deletingProgram.id && p._id !== deletingProgram._id && p.code !== deletingProgram.code);
        try { localStorage.setItem('vcas_programs_cache', JSON.stringify(next)); } catch (_) {}
        return next;
      });
      if (viewingProgram && (viewingProgram.id === deletingProgram.id || viewingProgram._id === deletingProgram._id)) {
        setViewingProgram(null);
      }
      showToast(`Degree Program ${deletingProgram.code} removed.`);

      // Sync with MongoDB backend
      if (targetId) {
        fetch(`${API_BASE}/courses/${targetId}`, {
          method: 'DELETE'
        }).catch(err => console.error('Error deleting program in backend:', err));
      }

      setDeletingProgram(null);
    }
  };

  // Reallocate Faculty
  const handleSaveReallocation = () => {
    if (reallocatingSubject && newFacultyName.trim()) {
      const targetId = reallocatingSubject._id || reallocatingSubject.id || reallocatingSubject.code;
      const updated = { ...reallocatingSubject, faculty: newFacultyName.trim() };
      setSubjectsList(prev => prev.map(s => (s.id === reallocatingSubject.id || s._id === reallocatingSubject._id) ? updated : s));
      showToast(`Reallocated ${reallocatingSubject.code} to ${newFacultyName.trim()}`);

      // Sync with MongoDB backend
      fetch(`${API_BASE}/subjects/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faculty: newFacultyName.trim() })
      }).catch(err => console.error('Error reallocating faculty in backend:', err));

      setReallocatingSubject(null);
      setNewFacultyName('');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans animate-fadeIn">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && typeof document !== 'undefined' && createPortal(
        <div className="fixed top-5 right-5 z-[99999] bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-fadeIn pointer-events-auto">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{typeof toastMessage === 'string' ? toastMessage : String(toastMessage || '')}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>,
        document.body
      )}

      {/* 1. TOP HEADER & ACTION BUTTONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
              Academic ERP
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-semibold">NEP 2020 Aligned</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Subjects</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Configure degree programs, semester curriculum matrix, syllabus units, prerequisites, and faculty allocations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isSuperAdmin && (
            <button
            onClick={handleExportCSV}
            title="Download CSV Catalog"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          )}

          <button
            onClick={() => handleOpenAddProgram()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all border border-slate-200"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span>Add Program</span>
          </button>

          <button
            onClick={() => handleOpenAddSubject()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* 2. STATS SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Programs</span>
            <p className="text-2xl font-black text-slate-900">{programsList.length}</p>
            <p className="text-[11px] text-blue-600 font-bold mt-1">UG & PG Degrees</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Active Subjects</span>
            <p className="text-2xl font-black text-indigo-600">{subjectsList.length}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Across 6 Semesters</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Enrolled</span>
            <p className="text-2xl font-black text-emerald-600">{totalEnrolledStudents > 0 ? totalEnrolledStudents.toLocaleString() : '3'}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">1 Active Batch</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Grad Credits</span>
            <p className="text-2xl font-black text-purple-600">
              {subjectsList.length > 0
                ? subjectsList.reduce((acc, s) => acc + (Number(s.credits) || 0), 0)
                : 0}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Total Curriculum Credits</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Faculty Leads</span>
            <p className="text-2xl font-black text-amber-600">{facultyWorkload.length}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Assigned Teachers</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex items-center justify-between border-b border-slate-200 text-xs sm:text-sm overflow-x-auto gap-2">
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'subjects'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Subjects Catalog ({filteredSubjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('programs')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'programs'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Degree Programs ({filteredPrograms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Curriculum Matrix (Roadmap)</span>
          </button>

          <button
            onClick={() => setActiveTab('allocation')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'allocation'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Faculty Teaching Load</span>
          </button>
        </div>

        {/* View mode toggle (Table / Grid) for Subjects Tab */}
        {activeTab === 'subjects' && (
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 mb-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 4. SEARCH & MULTI-FILTER BAR (Visible on Subjects & Programs Tab) */}
      {(activeTab === 'subjects' || activeTab === 'programs') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
          
          {/* Search row */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'subjects' ? "Search subjects by name, code CS101, faculty, or topic..." : "Search degree programs by name, code, or coordinator..."}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {(searchQuery || selectedDept !== 'All Departments' || selectedYear !== 'ALL' || selectedSem !== 'All Semesters' || selectedType !== 'All Types' || selectedCredits !== 'ALL') && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition-all shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Dropdowns (Department, Year, Semester, Type, Credits) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
            {/* Department Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="All Departments">All Departments</option>
                {realDepartmentNames.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            {activeTab === 'subjects' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Academic Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Academic Years</option>
                  <option value="1">1st Year (Fresher)</option>
                  <option value="2">2nd Year (Sophomore)</option>
                  <option value="3">3rd Year (Junior)</option>
                </select>
              </div>
            )}

            {/* Semester Filter */}
            {activeTab === 'subjects' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Semester</label>
                <select
                  value={selectedSem}
                  onChange={(e) => setSelectedSem(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  {SEMESTERS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Subject Type Filter - Only shown when multiple distinct types exist */}
            {activeTab === 'subjects' && dynamicSubjectTypes.length > 2 && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  {dynamicSubjectTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Credits Filter */}
            {activeTab === 'subjects' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Credits</label>
                <select
                  value={selectedCredits}
                  onChange={(e) => setSelectedCredits(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Credits</option>
                  <option value="1-2">1 - 2 Credits (Labs)</option>
                  <option value="3">3 Credits</option>
                  <option value="4">4 Credits (Core)</option>
                  <option value="5+">5+ Credits (Projects)</option>
                </select>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 1: SUBJECTS CATALOG (TABLE & GRID)                                */}
      {/* ========================================================================= */}
      {activeTab === 'subjects' && (
        viewMode === 'table' ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">SUBJECT CODE & NAME</th>
                    <th className="py-4 px-4">DEPARTMENT</th>
                    <th className="py-4 px-4">YEAR & SEM</th>
                    <th className="py-4 px-4">TYPE</th>
                    <th className="py-4 px-4">CREDITS & LOAD</th>
                    <th className="py-4 px-4">FACULTY IN CHARGE</th>
                    <th className="py-4 px-4">PREREQUISITE</th>
                    <th className="py-4 px-6 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map((subj) => (
                      <tr 
                        key={subj.id}
                        onClick={() => setViewingSubject(subj)}
                        className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      >
                        {/* Code & Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono font-extrabold text-xs border border-blue-100 shrink-0">
                              {subj.code}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                                {subj.name}
                              </p>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {subj.hours || '4 hrs/week'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-4 px-4 font-semibold text-slate-700 text-xs">
                          {normalizeDeptName(subj.department)}
                        </td>

                        {/* Year & Semester */}
                        <td className="py-4 px-4 text-xs font-semibold text-slate-600">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                            Year {subj.year} • {typeof subj.sem === 'string' ? subj.sem : (subj.sem?.name || `Sem ${(Number(subj.year) || 1) * 2 - 1}`)}
                          </span>
                        </td>

                        {/* Type Badge */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            subj.type === 'Core Theory' || subj.type === 'Theory'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : subj.type === 'Practical / Lab'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : subj.type === 'Professional Elective' || subj.type === 'Elective'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : subj.type === 'Open Elective'
                              ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {subj.type}
                          </span>
                        </td>

                        {/* Credits & LTP */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-blue-600 text-xs">
                              {subj.credits} Credits
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              L-T-P: {subj.ltp || '3-1-0'}
                            </span>
                          </div>
                        </td>

                        {/* Faculty */}
                        <td className="py-4 px-4 text-xs font-medium text-slate-700">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                              {subj.faculty ? (subj.faculty.charAt(subj.faculty.indexOf('.') > -1 ? subj.faculty.indexOf('.') + 2 : 0) || 'F') : 'F'}
                            </div>
                            <span>{subj.faculty || 'Unassigned'}</span>
                          </div>
                        </td>

                        {/* Prerequisite */}
                        <td className="py-4 px-4 text-xs text-slate-500">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono">
                            {subj.prerequisite || 'None'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5 text-slate-400">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingSubject(subj);
                              }}
                              title="View Syllabus & Units"
                              className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditSubject(subj);
                              }}
                              title="Edit Subject"
                              className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingSubject(subj);
                              }}
                              title="Delete Subject"
                              className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-14 text-center text-slate-400">
                        <div className="max-w-sm mx-auto space-y-2">
                          <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                          <p className="text-sm font-semibold text-slate-700">
                            {searchQuery || selectedDept !== 'All Departments' ? 'No subjects found matching your filters' : 'No subjects added yet'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {searchQuery || selectedDept !== 'All Departments' ? 'Try changing your search terms or filter selections.' : 'Get started by adding your institution’s academic subjects and curriculum modules.'}
                          </p>
                          {searchQuery || selectedDept !== 'All Departments' ? (
                            <button
                              onClick={handleResetFilters}
                              className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                            >
                              Clear all filters
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenAddSubject()}
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Subject</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* GRID CARD VIEW */
          filteredSubjects.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 bg-white border border-slate-200/90 rounded-3xl p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {searchQuery || selectedDept !== 'All Departments' ? 'No subjects found matching your filters' : 'No subjects added yet'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery || selectedDept !== 'All Departments' ? 'Try changing your search terms or filter selections.' : 'Get started by adding your institution’s academic subjects and curriculum modules.'}
                </p>
              </div>
              {searchQuery || selectedDept !== 'All Departments' ? (
                <button
                  onClick={handleResetFilters}
                  className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              ) : (
                <button
                  onClick={() => handleOpenAddSubject()}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSubjects.map(subj => (
                <div 
                  key={subj.id} 
                  onClick={() => setViewingSubject(subj)}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono font-extrabold text-xs border border-blue-100">
                        {subj.code}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        (subj.type === 'Core Theory' || subj.type === 'Theory') ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {subj.type}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                      {subj.name}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                      <span className="font-semibold text-slate-700">{normalizeDeptName(subj.department)}</span>
                      <span>•</span>
                      <span>Year {subj.year} ({typeof subj.sem === 'string' ? subj.sem : (subj.sem?.name || 'Sem 1')})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center text-xs">
                    <div>
                      <span className="text-sm font-extrabold text-blue-600 block">{subj.credits}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Credits</span>
                    </div>
                    <div className="border-x border-slate-200">
                      <span className="text-sm font-extrabold text-slate-800 block">{subj.units?.length || 5}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Units</span>
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-emerald-600 block">{subj.studentsEnrolled || 0}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Enrolled</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-600 font-medium truncate max-w-[160px]">
                      👨‍🏫 {subj.faculty}
                    </span>

                    <div className="flex items-center gap-1 text-slate-400" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEditSubject(subj)}
                        className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingSubject(subj)}
                        className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 2: DEGREE PROGRAMS & REGULATIONS                                    */}
      {/* ========================================================================= */}
      {activeTab === 'programs' && (
        filteredPrograms.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 bg-white border border-slate-200/90 rounded-3xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {searchQuery || selectedDept !== 'All Departments' ? 'No degree programs match your filters' : 'No degree programs added yet'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery || selectedDept !== 'All Departments' ? 'Try clearing your search filter.' : 'Get started by registering your institution’s academic degree programs.'}
              </p>
            </div>
            {searchQuery || selectedDept !== 'All Departments' ? (
              <button
                onClick={handleResetFilters}
                className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            ) : (
              <button
                onClick={() => handleOpenAddProgram()}
                className="mt-2 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Degree Program</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((prog) => (
              <div
                key={prog.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-100">
                      {prog.code}
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-lg">
                      {prog.degreeLevel}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {prog.name}
                  </h3>
                  <p className="text-xs font-bold text-blue-700 mt-1">
                    🏢 {normalizeDeptName(prog.department)}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-semibold text-[10px] rounded-md border border-indigo-100">
                      {prog.regulation}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Est. {prog.establishedYear}</span>
                  </div>

                  <p className="text-xs text-slate-500 font-semibold mt-2.5">
                    Lead Coordinator: <span className="text-slate-800">{prog.coordinator}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {prog.description}
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-base font-extrabold text-slate-900 block leading-tight">
                      {prog.durationYears} Yrs
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{prog.totalSemesters} Sems</span>
                  </div>
                  <div className="border-x border-slate-200">
                    <span className="text-base font-extrabold text-blue-600 block leading-tight">
                      {prog.totalCredits}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Credits</span>
                  </div>
                  <div>
                    <span className="text-base font-extrabold text-purple-600 block leading-tight">
                      {prog.enrolledStudents}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Students</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setMatrixSelectedProgramCode(prog.code);
                      setActiveTab('matrix');
                    }}
                    className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-blue-200/80"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Semester Matrix</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditProgram(prog)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-all"
                    title="Edit Program"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeletingProgram(prog)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 transition-all"
                    title="Delete Program"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 3: CURRICULUM MATRIX & SEMESTER ROADMAP                            */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        programsList.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 bg-white border border-slate-200/90 rounded-3xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">No Degree Programs Added Yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Add your degree programs and curriculum subjects to view the semester curriculum progression matrix.
              </p>
            </div>
            <button
              onClick={() => handleOpenAddProgram()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Degree Program</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Program Switcher Banner */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block mb-1">
                  Curriculum Structure & Semester Progression
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold leading-tight">
                  {activeMatrixProgram?.name || 'Academic Degree Program'}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  {activeMatrixProgram?.regulation || 'Regulation 2024 (R24)'} • {activeMatrixProgram?.durationYears || 3} Years ({activeMatrixProgram?.totalSemesters || 6} Semesters) • Total {activeMatrixProgram?.totalCredits || 140} Credits
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-300">Select Degree:</label>
                <select
                  value={matrixSelectedProgramCode || activeMatrixProgram?.code || ''}
                  onChange={(e) => setMatrixSelectedProgramCode(e.target.value)}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:bg-slate-900 cursor-pointer transition-all"
                >
                  {programsList.map(p => (
                    <option key={p.id || p.code} value={p.code} className="text-slate-900 bg-white">{p.code} - {p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Semesters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: Number(activeMatrixProgram?.totalSemesters) || (Number(activeMatrixProgram?.durationYears) ? Number(activeMatrixProgram.durationYears) * 2 : 6) }).map((_, idx) => {
                const semNumber = idx + 1;
                const semLabel = `Sem ${semNumber}`;
                const allSubjects = subjectsList;
                const semSubjects = allSubjects.filter(s => {
                  const sDept = normalizeDeptName(s.department);
                  const progDept = normalizeDeptName(activeMatrixProgram?.department);
                  const deptMatch = !progDept || sDept.toLowerCase() === progDept.toLowerCase() || 
                    String(s.department || '').toLowerCase() === String(activeMatrixProgram?.department || '').toLowerCase() ||
                    String(s.course || '').toLowerCase() === String(activeMatrixProgram?.code || '').toLowerCase();
                  const sSemClean = String(s.sem || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                  const semLabelClean = semLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
                  const semMatch = sSemClean === semLabelClean || Number(s.semester) === semNumber || Number(s.year) === Math.ceil(semNumber / 2);
                  return deptMatch && semMatch;
                });
                const totalSemCredits = semSubjects.reduce((acc, curr) => acc + (Number(curr.credits) || 0), 0);

                return (
                  <div key={semLabel} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
                          S{semNumber}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">Semester {semNumber}</h4>
                          <p className="text-[11px] text-slate-400 font-medium">Year {Math.ceil(semNumber / 2)} Curriculum</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                          {totalSemCredits} Credits
                        </span>
                      </div>
                    </div>

                    {/* Subjects list in semester */}
                    <div className="space-y-2">
                      {semSubjects.length > 0 ? (
                        semSubjects.map(sub => (
                          <div 
                            key={sub.id} 
                            onClick={() => setViewingSubject(sub)}
                            className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-100 text-xs flex items-center justify-between cursor-pointer transition-all group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono font-bold text-[11px] text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                                {sub.code}
                              </span>
                              <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                                {sub.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                sub.type === 'Practical / Lab' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {sub.credits}C
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-xs font-semibold text-slate-500">No subjects assigned for Semester {semNumber}</p>
                          <button
                            onClick={() => handleOpenAddSubject(semLabel)}
                            className="mt-2 text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Subject to Sem {semNumber}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* 8. TAB 4: FACULTY TEACHING ALLOCATION                                     */}
      {/* ========================================================================= */}
      {activeTab === 'allocation' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Faculty Course Load & Teaching Allocations</h3>
                <p className="text-xs text-slate-500 mt-0.5">Summary of subjects, weekly lecture credits, and student intake per teacher</p>
              </div>
            </div>

            {facultyWorkload.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No Faculty Allocations Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Faculty course loads and assigned subjects will appear here once subjects are added and allocated to faculty.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {facultyWorkload.map((fac, idx) => (
                  <div key={idx} className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                            {fac.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{fac.name}</h4>
                            <span className="text-[11px] font-semibold text-slate-500">{normalizeDeptName(fac.department)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-200/70 text-center text-xs my-3">
                        <div>
                          <span className="font-black text-blue-600 text-base leading-none block">{fac.totalCredits}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Teaching Credits</span>
                        </div>
                        <div>
                          <span className="font-black text-emerald-600 text-base leading-none block">{fac.totalStudents}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Enrolled</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Subjects:</span>
                        {fac.subjects.map(s => (
                          <div key={s.id} className="text-xs p-2 bg-white rounded-lg border border-slate-100 flex items-center justify-between">
                            <span className="font-bold text-slate-800 truncate mr-2">{s.code} - {s.name}</span>
                            <button
                              onClick={() => {
                                setReallocatingSubject(s);
                                setNewFacultyName(s.faculty);
                              }}
                              title="Reallocate Faculty"
                              className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline shrink-0"
                            >
                              Reassign
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL: VIEW SUBJECT SYLLABUS & UNITS                                   */}
      {/* ========================================================================= */}
      {viewingSubject && (
        <ModalPortal isOpen={Boolean(viewingSubject)} onClose={() => setViewingSubject(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 gap-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 font-mono font-extrabold text-xs rounded-xl border border-blue-100">
                  {viewingSubject.code}
                </span>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                    {viewingSubject.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {normalizeDeptName(viewingSubject.department)} • Year {viewingSubject.year} ({typeof viewingSubject.sem === 'string' ? viewingSubject.sem : (viewingSubject.sem?.name || 'Sem 1')}) • {viewingSubject.credits} Credits
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setViewingSubject(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100/80 hover:bg-slate-200 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subject Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Course Type</span>
                <span className="font-extrabold text-slate-800">{viewingSubject.type}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Credits & LTP</span>
                <span className="font-extrabold text-blue-600">{viewingSubject.credits} Credits ({viewingSubject.ltp || '3-1-0'})</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Faculty Lead</span>
                <span className="font-extrabold text-slate-800">{viewingSubject.faculty}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Prerequisite</span>
                <span className="font-semibold text-slate-700">{viewingSubject.prerequisite || 'None'}</span>
              </div>
            </div>

            {/* Units & Syllabus Breakdown */}
            {viewingSubject.units && viewingSubject.units.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" /> Syllabus Modules & Units
                </h4>
                <div className="space-y-2.5">
                  {viewingSubject.units.map((unit, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-blue-600 mr-2">{unit.unit}:</span>
                        <span className="font-bold text-slate-900">{unit.title}</span>
                      </div>
                      {unit.hours && (
                        <span className="text-[11px] font-semibold text-slate-400 shrink-0 ml-2">{unit.hours} Hours</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Textbooks & References */}
            {viewingSubject.textbooks && (
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs space-y-1">
                <span className="font-bold text-blue-700 block text-[11px] uppercase">Recommended Textbooks & References:</span>
                <p className="text-slate-700 font-medium">{viewingSubject.textbooks}</p>
              </div>
            )}

            {/* Modal Bottom Close & Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Syllabus</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const cur = viewingSubject;
                    setViewingSubject(null);
                    handleOpenEditSubject(cur);
                  }}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-all"
                >
                  Edit Subject
                </button>
                <button
                  type="button"
                  onClick={() => setViewingSubject(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 10. MODAL: ADD / EDIT SUBJECT                                             */}
      {/* ========================================================================= */}
      {(isAddSubjectOpen || editingSubject) && (
        <ModalPortal 
          isOpen={Boolean(isAddSubjectOpen || editingSubject)} 
          onClose={() => {
            setIsAddSubjectOpen(false);
            setEditingSubject(null);
          }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  {editingSubject ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                    {editingSubject ? 'Edit Subject Details' : 'Register New Curriculum Subject'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingSubject ? `Update curriculum syllabus and faculty for ${editingSubject.code}` : 'Add course details, syllabus modules, credits, and instructor'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsAddSubjectOpen(false);
                  setEditingSubject(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              
              {/* Subject Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="e.g. Artificial Intelligence & Machine Learning"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none transition-all ${
                    formErrors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-purple-500'
                  }`}
                />
                {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
              </div>

              {/* Code & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subject Code <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    placeholder="CS502"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-mono font-bold focus:bg-white focus:outline-none uppercase transition-all ${
                      formErrors.code ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-purple-500'
                    }`}
                  />
                  {formErrors.code && <p className="text-[11px] text-rose-500 mt-1">{formErrors.code}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={subjectForm.department}
                    onChange={(e) => handleSubjectDeptChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    {realDepartmentNames.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Year, Semester & Credits */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Year</label>
                  <select
                    value={subjectForm.year}
                    onChange={(e) => handleSubjectYearChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                  <select
                    value={subjectForm.sem}
                    onChange={(e) => setSubjectForm({ ...subjectForm, sem: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    {SEMESTERS.filter(s => s !== 'All Semesters').map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Credits</label>
                  <select
                    value={subjectForm.credits}
                    onChange={(e) => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-purple-600 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value={1}>1 Credit</option>
                    <option value={2}>2 Credits</option>
                    <option value={3}>3 Credits</option>
                    <option value={4}>4 Credits</option>
                    <option value={5}>5 Credits</option>
                    <option value={6}>6 Credits</option>
                  </select>
                </div>
              </div>

              {/* Separate Theory & Lab Hours (Continuous Lab) */}
              <div className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Teaching Hours Allocation (Separate Theory &amp; Lab) *
                  </label>
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    Continuous Lab Block Enabled
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Theory Hours (per week) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={subjectForm.theoryHours}
                      onChange={(e) => {
                        const th = Number(e.target.value);
                        setSubjectForm(prev => ({
                          ...prev,
                          theoryHours: th,
                          ltp: `${th}-0-${prev.labHours || 0}`
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Lab Hours (per week) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={subjectForm.labHours}
                      onChange={(e) => {
                        const lh = Number(e.target.value);
                        setSubjectForm(prev => ({
                          ...prev,
                          labHours: lh,
                          type: lh > 0 ? 'Practical / Lab' : prev.type,
                          ltp: `${prev.theoryHours || 3}-0-${lh}`
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>

                {Number(subjectForm.labHours) > 0 && (
                  <div className="p-2.5 bg-white rounded-xl border border-purple-200 text-xs text-purple-900 font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>
                      <strong>⚡ Continuous Lab:</strong> The <strong>{subjectForm.labHours} lab hours</strong> will be allocated as a single continuous block in timetable scheduling (e.g. 3 continuous hours without breaks).
                    </span>
                  </div>
                )}

                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>📅 Automatic Timetable Generation:</strong> Setting hours for this subject/class automatically generates the weekly timetable. Theory hours are distributed across days, and lab hours (e.g. 3 hrs) are scheduled as continuous, uninterrupted periods.
                  </span>
                </div>
              </div>

              {/* Type, LTP & Faculty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Type</label>
                  <input
                    type="text"
                    list="availableSubjectTypesList"
                    value={subjectForm.type}
                    onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })}
                    placeholder="e.g. Theory"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none"
                  />
                  <datalist id="availableSubjectTypesList">
                    {dynamicSubjectTypes.filter(t => t !== 'All Types').map(t => (
                      <option key={t} value={t} />
                    ))}
                    <option value="Theory" />
                    <option value="Practical / Lab" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">L-T-P Structure</label>
                  <input
                    type="text"
                    value={subjectForm.ltp}
                    onChange={(e) => setSubjectForm({ ...subjectForm, ltp: e.target.value })}
                    placeholder="e.g. 3-0-3"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Faculty & Prerequisite */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Faculty In-Charge *
                    </label>
                  </div>
                  <select
                    value={subjectForm.faculty}
                    onChange={(e) => setSubjectForm({ ...subjectForm, faculty: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- Select Faculty In-Charge --</option>
                    {facultyList && facultyList.length > 0 ? (
                      facultyList.map((fac) => (
                        <option key={fac._id || fac.staffId || fac.name} value={fac.name}>
                          {fac.name} {fac.designation ? `(${fac.designation})` : fac.department ? `(${fac.department})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="Assigned Faculty">Assigned Department Faculty</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prerequisite Course</label>
                  <input
                    type="text"
                    value={subjectForm.prerequisite}
                    onChange={(e) => setSubjectForm({ ...subjectForm, prerequisite: e.target.value })}
                    placeholder="e.g. CS101 or None"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Students Enrolled</label>
                  <input
                    type="number"
                    min="0"
                    value={subjectForm.studentsEnrolled ?? 0}
                    onChange={(e) => setSubjectForm({ ...subjectForm, studentsEnrolled: Math.max(0, parseInt(e.target.value) || 0) })}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Textbooks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recommended Textbooks & References</label>
                <input
                  type="text"
                  value={subjectForm.textbooks}
                  onChange={(e) => setSubjectForm({ ...subjectForm, textbooks: e.target.value })}
                  placeholder="e.g. AI: A Modern Approach by Russell & Norvig"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddSubjectOpen(false);
                    setEditingSubject(null);
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingSubject ? 'Update Subject' : 'Save Subject'}</span>
                </button>
              </div>

            </form>

          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 11. MODAL: ADD / EDIT DEGREE PROGRAM                                      */}
      {/* ========================================================================= */}
      {(isAddProgramOpen || editingProgram) && (
        <ModalPortal 
          isOpen={Boolean(isAddProgramOpen || editingProgram)} 
          onClose={() => {
            setIsAddProgramOpen(false);
            setEditingProgram(null);
          }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  {editingProgram ? <Pencil className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                    {editingProgram ? 'Edit Degree Program' : 'Add New Degree Program'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure academic curriculum degree structure, duration, and credit rules
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsAddProgramOpen(false);
                  setEditingProgram(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-4">
              {/* Program Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Program Name *</label>
                <input
                  type="text"
                  required
                  value={programForm.name}
                  onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                  placeholder="e.g. B.Sc Computer Science or B.Com Professional"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>

              {/* Code + Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Program Code *</label>
                  <input
                    type="text"
                    required
                    value={programForm.code}
                    onChange={(e) => setProgramForm({ ...programForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. BSC-CS or BCOM-GEN"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold font-mono focus:bg-white focus:border-purple-500 focus:outline-none uppercase transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                  <select
                    value={programForm.department}
                    onChange={(e) => setProgramForm({ ...programForm, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    {realDepartmentNames.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Degree Level + Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Degree Level</label>
                  <select
                    value={programForm.degreeLevel || 'Undergraduate (UG)'}
                    onChange={(e) => setProgramForm({ ...programForm, degreeLevel: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Undergraduate (UG)">Undergraduate (UG)</option>
                    <option value="Postgraduate (PG)">Postgraduate (PG)</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Duration</label>
                  <select
                    value={programForm.durationYears}
                    onChange={(e) => {
                      const years = parseInt(e.target.value);
                      setProgramForm({ 
                        ...programForm, 
                        durationYears: years,
                        totalSemesters: years * 2
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value={3}>3 Years (6 Semesters - B.A. / B.Sc / B.Com / BBA / BCA)</option>
                    <option value={2}>2 Years (4 Semesters - M.A. / M.Sc / M.Com / MCA)</option>
                    <option value={1}>1 Year (2 Semesters - PG Diploma / Certificate)</option>
                  </select>
                </div>
              </div>

              {/* Total Credits Required */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Credits for Degree Award *</label>
                <input
                  type="number"
                  min="60"
                  max="240"
                  value={programForm.totalCredits}
                  onChange={(e) => setProgramForm({ ...programForm, totalCredits: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddProgramOpen(false);
                    setEditingProgram(null);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingProgram ? 'Update Program' : 'Save Degree Program'}</span>
                </button>
              </div>
            </form>

          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 12. MODAL: REALLOCATE FACULTY                                             */}
      {/* ========================================================================= */}
      {reallocatingSubject && (
        <ModalPortal 
          isOpen={Boolean(reallocatingSubject)} 
          onClose={() => setReallocatingSubject(null)}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">Reassign Course Faculty</h3>
                  <p className="text-[11px] text-slate-500">Update instructor assignment for this course</p>
                </div>
              </div>
              <button onClick={() => setReallocatingSubject(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-100 text-xs">
              <p className="font-extrabold text-purple-950">{reallocatingSubject.code}: {reallocatingSubject.name}</p>
              <p className="text-purple-700 mt-0.5 font-medium">Department: {normalizeDeptName(reallocatingSubject.department)} • {reallocatingSubject.credits} Credits</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select New Faculty In-Charge *</label>
              <input
                type="text"
                value={newFacultyName}
                onChange={(e) => setNewFacultyName(e.target.value)}
                placeholder="e.g. Prof. Ramesh Kumar"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReallocatingSubject(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReallocation}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Allocation</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 13. MODAL: DELETE CONFIRMATION                                            */}
      {/* ========================================================================= */}
      {(deletingSubject || deletingProgram) && (
        <ModalPortal 
          isOpen={Boolean(deletingSubject || deletingProgram)} 
          onClose={() => {
            setDeletingSubject(null);
            setDeletingProgram(null);
          }}
        >
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  Delete {deletingSubject ? 'Subject' : 'Degree Program'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to remove <strong className="text-slate-800">{deletingSubject?.name || deletingProgram?.name}</strong>?
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-700 font-medium">
              This will permanently remove this item from the curriculum syllabus catalog.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeletingSubject(null);
                  setDeletingProgram(null);
                }}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deletingSubject ? handleConfirmDeleteSubject : handleConfirmDeleteProgram}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
