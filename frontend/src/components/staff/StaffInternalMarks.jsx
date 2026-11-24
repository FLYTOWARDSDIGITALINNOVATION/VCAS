import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { API_BASE, BACKEND_URL, getKnownDepartments } from '../../apiConfig';
import { useStudentBatches, mergeBatches } from '../../utils/useStudentBatches';
import {
  FileSpreadsheet,
  Search,
  Save,
  Lock,
  Unlock,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Plus,
  X,
  SlidersHorizontal,
  Edit3,
  Award,
  Sparkles,
  BookMarked,
  ChevronDown,
  Send,
  Check,
  ShieldCheck,
  Clock,
  ArrowRight,
  UploadCloud,
  Users,
  UserCheck,
  Trash2,
} from "lucide-react";
import ModalPortal from "../ModalPortal";
import ExcelMarksUploadModal from "./ExcelMarksUploadModal";

// Dynamic loader for SheetJS
const getSheetJS = () => {
  if (typeof window !== 'undefined' && window.XLSX) {
    return Promise.resolve(window.XLSX);
  }
  return new Promise((resolve) => {
    try {
      const script = document.createElement('script');
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
      script.async = true;
      script.onload = () => resolve(window.XLSX || null);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    } catch (_) {
      resolve(null);
    }
  });
};

const API = API_BASE;

export const DEFAULT_MAX_CONFIG = {
  st1: 20,
  st2: 20,
  st3: 20,
  st4: 20,
  it1: 25,
  it2: 25,
  cia1: 50,
  cia2: 50,
  model: 75,
  semester: 100,
  seminar: 10,
  project: 20,
  assignment1: 5,
  assignment2: 5,
  assignment3: 5,
  assignment4: 5,
  assignment: 20,
  attendance: 5,
  grade: 100,
  consolidated: 25,
};

export const DEFAULT_PASS_CONFIG = {
  st1: 8,
  st2: 8,
  st3: 8,
  st4: 8,
  it1: 10,
  it2: 10,
  cia1: 20,
  cia2: 20,
  model: 30,
  semester: 40,
  seminar: 4,
  project: 8,
  assignment1: 2,
  assignment2: 2,
  assignment3: 2,
  assignment4: 2,
  assignment: 8,
  attendance: 2,
  grade: 40,
  consolidated: 10,
};

export const ASSESSMENT_COMPONENTS = [
  { id: "all", label: "College Register Sheet (Official Layout)", shortLabel: "📋 Full Register Sheet", defaultMax: 100, defaultPass: 40 },
  { id: "it", label: "Internal 1 (Internal 1)", shortLabel: "Internal 1", defaultMax: 25, defaultPass: 10 },
  { id: "it2", label: "Internal 2 (Internal 2)", shortLabel: "Internal 2", defaultMax: 25, defaultPass: 10 },
  { id: "model", label: "Model (Model Examination)", shortLabel: "Model", defaultMax: 75, defaultPass: 30 },
  { id: "semester", label: "Semester (Semester Examination)", shortLabel: "Semester", defaultMax: 100, defaultPass: 40 },
  { id: "seminar", label: "Seminar (Seminar Presentation)", shortLabel: "Seminar", defaultMax: 10, defaultPass: 4 },
  { id: "project", label: "Project (Project Work)", shortLabel: "Project", defaultMax: 20, defaultPass: 8 },
  { id: "st", label: "Snap Tests (ST 1 - 4)", shortLabel: "Snap Tests (ST1-4)", defaultMax: 20, defaultPass: 8 },
  { id: "assignment", label: "Assignments (1 to 4)", shortLabel: "Assignments (1-4)", defaultMax: 5, defaultPass: 2 },
  { id: "grade", label: "Grade (Overall Grade)", shortLabel: "Grade", defaultMax: 100, defaultPass: 40 },
  { id: "consolidated", label: "Consolidated Internal Marks", shortLabel: "Final CIA Summary", defaultMax: 25, defaultPass: 10 },
];

export default function StaffInternalMarks({ staffUser }) {
  const staffId = staffUser?.staffId || staffUser?.employeeId || "";
  const staffName = staffUser?.name || "";
  const effectiveStaffId = staffId || staffUser?.staffId || staffUser?.employeeId || "EMP001";

  const getStoredSubject = () => {
    try {
      const stored = localStorage.getItem('vcas_internal_subject') || sessionStorage.getItem('vcas_internal_subject');
      if (stored && stored.trim()) {
        return stored.trim();
      }
      return "";
    } catch {
      return "";
    }
  };

  // -- State ----------------------------------------------------------
  const [subjectCode, setSubjectCode] = useState(getStoredSubject);
  const [searchInput, setSearchInput] = useState(getStoredSubject);
  const [subjectName, setSubjectName] = useState("");
  const [staffSubjects, setStaffSubjects] = useState([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [componentId, setComponentId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState([]); // raw from DB
  const [isLocked, setIsLocked] = useState(false);

  // Department, Year, Batch, Semester filter options
  const [filterDept, setFilterDept] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [filterBatch, setFilterBatch] = useState("All");
  const [filterSem, setFilterSem] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [allRegisteredStudents, setAllRegisteredStudents] = useState([]);
  const [adminDepartments, setAdminDepartments] = useState([]);
  const [currentMarksheetMeta, setCurrentMarksheetMeta] = useState({});

  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [isFreezing, setIsFreezing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncingAssignments, setSyncingAssignments] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const reqIdRef = useRef(0);

  // Multi-tier stage approval (Order: HOD -> Principal -> MD)
  const [approvalStatus, setApprovalStatus] = useState("Draft");
  const [currentApprovalStage, setCurrentApprovalStage] = useState("Staff");
  const [hodApproval, setHodApproval] = useState(null);
  const [principalApproval, setPrincipalApproval] = useState(null);
  const [mdApproval, setMdApproval] = useState(null);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [isProcessingStage, setIsProcessingStage] = useState(false);

  // Bulk marks upload modal state
  const [showBulkUploadMarksModal, setShowBulkUploadMarksModal] = useState(false);

  // Download filtered marks modal (Subject, Dept, Year, Batch, Sem)
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFilterType, setDownloadFilterType] = useState('subject');
  const [downloadDept, setDownloadDept] = useState(staffUser?.department || 'Computer Science');
  const [downloadYear, setDownloadYear] = useState('I Year');
  const [downloadBatch, setDownloadBatch] = useState('');
  const [downloadSemester, setDownloadSemester] = useState('1');
  const [downloadFormat, setDownloadFormat] = useState('excel'); // 'excel' | 'csv'
  const [isExporting, setIsExporting] = useState(false);

  const normalizeRole = (value) => String(value || '').toUpperCase().replace(/[^A-Z]/g, '');
  const looksLikeHod = (value) => {
    const normalized = normalizeRole(value);
    return normalized.includes('HOD') ||
      normalized.includes('HEADOFDEPARTMENT') ||
      (normalized.includes('HEAD') && normalized.includes('DEPARTMENT')) ||
      normalized.includes('HEADOFDEPT') ||
      normalized.includes('DEPARTMENTHEAD');
  };

  const roleKey = normalizeRole(staffUser?.role);
  const designationKey = normalizeRole(staffUser?.designation);

  const isSuperAdminUser = roleKey.includes('SUPERADMIN') ||
    roleKey.includes('SUPERADMINISTRATOR') ||
    roleKey.includes('MANAGINGDIRECTOR') ||
    roleKey.includes('MD') ||
    designationKey.includes('MANAGINGDIRECTOR') ||
    designationKey.includes('MD');

  const isAdminUser = !isSuperAdminUser && (
    roleKey.includes('ADMIN') ||
    roleKey.includes('ADMINISTRATOR') ||
    roleKey.includes('PRINCIPAL') ||
    designationKey.includes('PRINCIPAL')
  );

  const isHod = !isSuperAdminUser && !isAdminUser && (
    looksLikeHod(staffUser?.role) ||
    looksLikeHod(staffUser?.designation) ||
    staffUser?.isHod === true ||
    staffUser?.canAllocateTasks === true
  );

  const isPrincipal = roleKey.includes('PRINCIPAL') || designationKey.includes('PRINCIPAL');
  const isMD = isSuperAdminUser;
  const isStaffOnly = !isSuperAdminUser && !isAdminUser && !isHod;

  // Student selection & assignment state
  const [selectedStudentsToAssign, setSelectedStudentsToAssign] = useState(new Set());
  const [showAssignPanel, setShowAssignPanel] = useState(true);

  // Configurable Max & Pass Marks per component
  const [maxMarksConfig, setMaxMarksConfig] = useState({ ...DEFAULT_MAX_CONFIG });
  const [passMarksConfig, setPassMarksConfig] = useState({ ...DEFAULT_PASS_CONFIG });

  // Modal to configure criteria
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempMaxConfig, setTempMaxConfig] = useState({ ...DEFAULT_MAX_CONFIG });
  const [tempPassConfig, setTempPassConfig] = useState({ ...DEFAULT_PASS_CONFIG });
  const [savingCriteria, setSavingCriteria] = useState(false);

  // Modal to add student
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newRollNo, setNewRollNo] = useState("");
  const [newStudentName, setNewStudentName] = useState("");

  // -- Computed --------------------------------------------------------
  const activeComp = useMemo(
    () => ASSESSMENT_COMPONENTS.find((c) => c.id === componentId) || ASSESSMENT_COMPONENTS[0],
    [componentId]
  );

  const currentMax = useMemo(() => {
    if (componentId === "all") return maxMarksConfig.consolidated || 25;
    if (componentId === "st") return maxMarksConfig.st1 || 20;
    if (componentId === "it") return maxMarksConfig.it1 || 25;
    if (componentId === "assignment") return maxMarksConfig.assignment1 || 5;
    if (componentId === "grade") return 100;
    return maxMarksConfig[componentId] ?? activeComp.defaultMax;
  }, [componentId, maxMarksConfig, activeComp]);

  const currentPass = useMemo(() => {
    if (componentId === "all") return 40;
    if (componentId === "st") return passMarksConfig.st1 || 8;
    if (componentId === "it") return passMarksConfig.it1 || 10;
    if (componentId === "assignment") return passMarksConfig.assignment1 || 2;
    if (componentId === "grade") return passMarksConfig.grade || 75;
    return passMarksConfig[componentId] ?? activeComp.defaultPass;
  }, [componentId, passMarksConfig, activeComp]);

  const dropdownSubjects = useMemo(() => {
    let list = staffSubjects;

    // For HOD or regular staff (non-SuperAdmin), restrict subjects strictly to their own department
    const staffDept = String(staffUser?.department || '').trim().toLowerCase();
    if ((isHod || isStaffOnly) && staffDept) {
      list = list.filter(s => {
        const d = String(s.dept || s.department || '').trim().toLowerCase();
        return !d || d === staffDept || d.includes(staffDept) || staffDept.includes(d);
      });
    }

    // Filter by department if a specific department is selected
    if (filterDept && filterDept !== 'All') {
      const target = filterDept.trim().toLowerCase();
      const deptFiltered = list.filter(s => {
        const d = String(s.dept || s.department || '').trim().toLowerCase();
        return d === target || d.includes(target) || target.includes(d);
      });
      if (deptFiltered.length > 0) {
        list = deptFiltered;
      }
    }

    // Filter by year if selected
    if (filterYear && filterYear !== 'All') {
      const parseYearNum = (val) => {
        const s = String(val || '').toLowerCase();
        if (s.includes('3') || s.includes('iii')) return 3;
        if (s.includes('2') || s.includes('ii')) return 2;
        if (s.includes('1') || s.includes('i')) return 1;
        return null;
      };
      const targetYear = parseYearNum(filterYear);
      if (targetYear) {
        const yearFiltered = list.filter(s => {
          if (!s.year) return true;
          const yNum = parseYearNum(s.year);
          return yNum === null || yNum === targetYear;
        });
        if (yearFiltered.length > 0) {
          list = yearFiltered;
        }
      }
    }

    // Filter by semester if selected
    if (filterSem && filterSem !== 'All') {
      const parseSemNum = (val) => {
        const s = String(val || '').replace(/\D/g, '');
        return s ? parseInt(s, 10) : null;
      };
      const targetSem = parseSemNum(filterSem);
      if (targetSem) {
        const semFiltered = list.filter(s => {
          if (!s.semester) return true;
          const sNum = parseSemNum(s.semester);
          return sNum === null || sNum === targetSem;
        });
        if (semFiltered.length > 0) {
          list = semFiltered;
        }
      }
    }

    // Deduplicate by unique subject code (never skip different codes that share similar names)
    const seenCodes = new Set();
    const deduplicated = [];
    list.forEach(sub => {
      const cleanCode = (sub.code || '').trim().toUpperCase();
      if (!cleanCode || seenCodes.has(cleanCode)) {
        return;
      }
      seenCodes.add(cleanCode);
      deduplicated.push(sub);
    });

    // Sort: Staff's own department subjects first, then alphabetically by code
    deduplicated.sort((a, b) => {
      const aDept = String(a.dept || a.department || '').trim().toLowerCase();
      const bDept = String(b.dept || b.department || '').trim().toLowerCase();
      const aMatch = staffDept && aDept && (aDept === staffDept || aDept.includes(staffDept) || staffDept.includes(aDept));
      const bMatch = staffDept && bDept && (bDept === staffDept || bDept.includes(staffDept) || staffDept.includes(bDept));
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return (a.code || '').localeCompare(b.code || '');
    });

    if (subjectCode && !deduplicated.some((s) => s.code === subjectCode)) {
      deduplicated.unshift({
        code: subjectCode,
        name: (subjectName && subjectName !== 'Course') ? subjectName : subjectCode,
        dept: currentMarksheetMeta?.department || staffUser?.department || ''
      });
    }
    return deduplicated;
  }, [staffSubjects, subjectCode, subjectName, filterDept, filterYear, filterSem, staffUser?.department, currentMarksheetMeta?.department, isHod, isStaffOnly]);

  // Filter dropdown lists
  const departmentsList = useMemo(() => {
    if ((isHod || isStaffOnly) && staffUser?.department) {
      return [staffUser.department];
    }
    const set = new Set();

    adminDepartments.forEach(d => {
      const name = typeof d === 'string' ? d : d?.name;
      if (name && String(name).trim()) set.add(String(name).trim());
    });

    if (staffUser?.department && String(staffUser.department).trim()) {
      set.add(String(staffUser.department).trim());
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [adminDepartments, staffUser?.department, isHod, isStaffOnly]);

  const yearsList = useMemo(() => {
    return ['1st Year', '2nd Year', '3rd Year'];
  }, []);

  const studentBatches = useStudentBatches();
  const batchesList = useMemo(() => {
    const fromRecords = [];
    allRegisteredStudents.forEach(s => {
      fromRecords.push(s.batch || s.academicYear);
    });
    students.forEach(s => {
      fromRecords.push(s.batch || s.academicYear);
    });
    return mergeBatches(studentBatches, fromRecords);
  }, [allRegisteredStudents, students, studentBatches]);

  const semestersList = useMemo(() => {
    const yr = String(filterYear || '').toLowerCase();
    if (yr.includes('1') || yr.includes('i')) return ['Semester 1', 'Semester 2'];
    if (yr.includes('2') || yr.includes('ii')) return ['Semester 3', 'Semester 4'];
    if (yr.includes('3') || yr.includes('iii')) return ['Semester 5', 'Semester 6'];
    return ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6'];
  }, [filterYear]);

  const handleYearFilterChange = (newYear) => {
    setFilterYear(newYear);
    if (filterSem && filterSem !== 'All') {
      const num = parseInt(filterSem.replace(/\D/g, ''), 10) || 0;
      if (newYear.includes('1') && (num < 1 || num > 2)) setFilterSem('All');
      else if (newYear.includes('2') && (num < 3 || num > 4)) setFilterSem('All');
      else if (newYear.includes('3') && (num < 5 || num > 6)) setFilterSem('All');
    }
  };

  // Merge each student with metadata from registered students collection
  const studentsWithMeta = useMemo(() => {
    const metaMap = new Map();
    allRegisteredStudents.forEach(st => {
      const key = (st.rollNo || st.regNo || st.studentId || '').toUpperCase().trim();
      if (key) metaMap.set(key, st);
    });

    const enrolledRolls = new Set();
    const list = students.map(s => {
      const key = (s.rollNo || '').toUpperCase().trim();
      if (key) enrolledRolls.add(key);
      const meta = metaMap.get(key) || {};
      const deptVal = s.department || meta.department || meta.course || meta.courseAdmitted || meta.dept || meta.programme || currentMarksheetMeta?.department || '';
      return {
        ...s,
        department: deptVal,
        year: s.year || meta.year || currentMarksheetMeta?.year || '',
        batch: s.batch || meta.batch || meta.academicYear || currentMarksheetMeta?.academicYear || '',
        sem: s.sem || (s.semester ? `Semester ${s.semester}` : '') || meta.sem || (meta.semester ? `Semester ${meta.semester}` : '') || (currentMarksheetMeta?.semester ? `Semester ${currentMarksheetMeta.semester}` : '') || ''
      };
    });

    // Include any registered students in system not yet saved into marksheet so full class is shown
    allRegisteredStudents.forEach(st => {
      const key = (st.rollNo || st.regNo || st.studentId || '').toUpperCase().trim();
      if (!key || enrolledRolls.has(key)) return;
      const deptVal = st.department || st.course || st.courseAdmitted || st.dept || st.programme || '';
      list.push({
        rollNo: st.rollNo || st.regNo,
        name: st.name || st.fullName || key,
        department: deptVal,
        year: st.year || '',
        batch: st.batch || st.academicYear || '',
        sem: st.sem || (st.semester ? `Semester ${st.semester}` : '') || '',
        st1: null, st2: null, st3: null, st4: null,
        it1: null, it2: null, cia1: null, cia2: null,
        model: null, project: null,
        assignment1: null, assignment2: null, assignment3: null, assignment4: null,
        assignment: null, attendance: null, consolidated: null
      });
    });

    return list;
  }, [students, allRegisteredStudents, currentMarksheetMeta]);

  // Multi-attribute filter: dep, yr, batch, sem and search query
  const filteredStudents = useMemo(() => {
    return studentsWithMeta.filter((s) => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSearch = String(s.name || '').toLowerCase().includes(q) || String(s.rollNo || '').toLowerCase().includes(q);
        if (!matchSearch) return false;
      }

      // Department filter (robust match supporting CS <-> Computer Science aliases)
      if (filterDept && filterDept !== 'All') {
        const d = (s.department || '').toLowerCase().trim();
        const target = filterDept.toLowerCase().trim();
        const isCsTarget = target === 'cs' || target.includes('computer');
        const isCsStudent = d === 'cs' || d.includes('computer') || d.includes('cse') || d.includes('bsc cs') || d.includes('b sc cs');
        const deptMatched = (d === target || d.includes(target) || target.includes(d) || (isCsTarget && isCsStudent));
        if (!deptMatched) return false;
      }

      // Year filter (1st, 2nd, 3rd Year)
      if (filterYear && filterYear !== 'All') {
        const getYearNum = (v) => {
          const str = String(v || '').toLowerCase().trim();
          if (str.includes('3') || str.includes('iii') || str.startsWith('third')) return 3;
          if (str.includes('2') || str.includes('ii') || str.startsWith('second')) return 2;
          if (str.includes('1') || str.includes('i') || str.startsWith('first')) return 1;
          const m = str.match(/\d+/);
          return m ? parseInt(m[0], 10) : 0;
        };
        const semNum = parseInt(String(s.sem || s.semester || '').replace(/\D/g, ''), 10) || 0;
        const yNum = getYearNum(s.year) || (semNum > 0 ? Math.ceil(semNum / 2) : 0);
        const targetNum = getYearNum(filterYear);
        if (targetNum && yNum && yNum !== targetNum) return false;
      }

      // Batch filter
      if (filterBatch && filterBatch !== 'All') {
        const b = String(s.batch || '').toLowerCase().trim();
        const target = filterBatch.toLowerCase().trim();
        if (b !== target && !b.includes(target)) return false;
      }

      // Semester filter (1 to 6)
      if (filterSem && filterSem !== 'All') {
        const numS = parseInt(String(s.sem || s.semester || '').replace(/\D/g, ''), 10) || 0;
        const numT = parseInt(String(filterSem).replace(/\D/g, ''), 10) || 0;
        if (numT && numS && numS !== numT) return false;
      }

      // Subject filter
      if (filterSubject && filterSubject !== 'All') {
        const subjectValue = String(s.subjectCode || s.subject || subjectCode || '').toLowerCase().trim();
        const target = filterSubject.toLowerCase().trim();
        if (subjectValue && subjectValue !== target && !subjectValue.includes(target) && !target.includes(subjectValue)) {
          return false;
        }
      }

      return true;
    });
  }, [studentsWithMeta, searchQuery, filterDept, filterYear, filterBatch, filterSem, filterSubject, subjectCode]);

  const stats = useMemo(() => {
    let totalScore = 0, count = 0, absentCount = 0, passCount = 0, highest = -1, lowest = 9999;
    filteredStudents.forEach((s) => {
      let m = null;
      if (componentId === "all" || componentId === "consolidated") {
        m = s.consolidated;
      } else if (componentId === "st") {
        m = s.st1;
      } else if (componentId === "it") {
        m = s.it1 !== null && s.it1 !== undefined ? s.it1 : s.cia1;
      } else if (componentId === "assignment") {
        m = s.assignment1 !== null && s.assignment1 !== undefined ? s.assignment1 : s.assignment;
      } else {
        m = s[componentId];
      }

      if (m === "A" || m === "AB") { absentCount++; return; }
      if (typeof m === "number" && !isNaN(m)) {
        totalScore += m; count++;
        if (m >= currentPass) passCount++;
        if (m > highest) highest = m;
        if (m < lowest) lowest = m;
      }
    });
    return {
      total: filteredStudents.length,
      appeared: count,
      absent: absentCount,
      passCount,
      passPct: count > 0 ? Math.round((passCount / count) * 100) : 0,
      average: count > 0 ? (totalScore / count).toFixed(1) : 0,
      highest: highest === -1 ? "-" : highest,
      lowest: lowest === 9999 ? "-" : lowest,
    };
  }, [filteredStudents, componentId, currentPass]);

  // -- Toast helper ----------------------------------------------------
  const toast = useCallback((msg, isError = false) => {
    if (isError) { setErrorMsg(msg); setSuccessMsg(""); }
    else { setSuccessMsg(msg); setErrorMsg(""); }
    setTimeout(() => { setSuccessMsg(""); setErrorMsg(""); }, 4500);
  }, []);

  // -- Fetch marksheet -------------------------------------------------
  const fetchMarksheet = useCallback(async (code) => {
    if (!code || !code.trim()) return;
    const cleanCode = code.trim().toUpperCase();
    const currentReqId = ++reqIdRef.current;
    setLoading(true);
    // Immediately reset locked & approval state so changing subjects does not retain previous locked state
    setIsLocked(false);
    setApprovalStatus('Draft');
    setCurrentApprovalStage('Staff');
    setHodApproval(null);
    setPrincipalApproval(null);
    setMdApproval(null);
    try {
      const res = await fetch(`${API}/internal-marks/${effectiveStaffId}/${encodeURIComponent(cleanCode)}`);
      const json = await res.json();
      if (currentReqId !== reqIdRef.current) return;

      if (json.success && json.data) {
        const canonicalCode = (json.data.subjectCode || cleanCode).toUpperCase();
        setStudents(json.data.students || []);
        setIsLocked(json.data.isLocked || false);
        setSubjectName(json.data.subjectName || "");
        setSubjectCode(canonicalCode);
        setFilterSubject(canonicalCode);
        setSearchInput(canonicalCode);
        try {
          localStorage.setItem('vcas_internal_subject', canonicalCode);
          sessionStorage.setItem('vcas_internal_subject', canonicalCode);
        } catch {
          // ignore
        }
        setApprovalStatus(json.data.approvalStatus || (json.data.isLocked ? 'Pending HOD' : 'Draft'));
        setCurrentApprovalStage(json.data.currentApprovalStage || 'Staff');
        setHodApproval(json.data.hodApproval || null);
        setPrincipalApproval(json.data.principalApproval || null);
        setMdApproval(json.data.mdApproval || null);
        setCurrentMarksheetMeta({
          department: json.data.department || "",
          year: json.data.year || "",
          semester: json.data.semester || "",
          academicYear: json.data.academicYear || ""
        });
        if (json.data.maxMarks) {
          const loadedMax = { ...DEFAULT_MAX_CONFIG, ...json.data.maxMarks };
          setMaxMarksConfig(loadedMax);
          setTempMaxConfig(loadedMax);
        }
        if (json.data.passMarks) {
          const loadedPass = { ...DEFAULT_PASS_CONFIG, ...json.data.passMarks };
          setPassMarksConfig(loadedPass);
          setTempPassConfig(loadedPass);
        }
      } else {
        setStudents([]);
        setIsLocked(false);
        setApprovalStatus('Draft');
        setCurrentApprovalStage('Staff');
        setHodApproval(null);
        setPrincipalApproval(null);
        setMdApproval(null);
      }
    } catch {
      if (currentReqId === reqIdRef.current) {
        toast("Could not reach server.", true);
      }
    } finally {
      if (currentReqId === reqIdRef.current) {
        setLoading(false);
      }
    }
  }, [effectiveStaffId, toast, filterDept, filterYear]);

  const fetchStaffSubjects = useCallback(async () => {
    try {
      // Build the marks list URL — for HOD/Admin include dept so backend returns pending marksheets too
      const marksRoleParam = (isHod || isAdminUser || isSuperAdminUser)
        ? `?role=${encodeURIComponent(staffUser?.role || (isHod ? 'HOD' : isAdminUser ? 'Admin' : 'SuperAdmin'))}&dept=${encodeURIComponent(staffUser?.department || '')}`
        : '';
      const [staffClsData, allClassesData, subjectsData, asgtsData, marksData, departmentsData, departmentClassesData] = await Promise.all([
        fetch(`${API}/classes/staff/${effectiveStaffId}`).then(r => r.json()).catch(() => null),
        fetch(`${API}/classes`).then(r => r.json()).catch(() => null),
        fetch(`${API}/subjects`).then(r => r.json()).catch(() => null),
        fetch(`${API}/assignments/${effectiveStaffId}`).then(r => r.json()).catch(() => null),
        fetch(`${API}/internal-marks/${effectiveStaffId}${marksRoleParam}`).then(r => r.json()).catch(() => null),
        fetch(`${API}/departments`).then(r => r.json()).catch(() => null),
        fetch(`${API}/classes?dept=${encodeURIComponent(staffUser?.department || '')}`).then(r => r.json()).catch(() => null),
      ]);

      const subs = [];
      const seen = new Set();
      const seenNamesByDept = new Set();

      // Load official subjects from backend /subjects API and admin subjects cache
      let cachedAdminSubjects = [];
      try {
        const cached = JSON.parse(localStorage.getItem('vcas_subjects_cache') || '[]');
        if (Array.isArray(cached)) cachedAdminSubjects = cached;
      } catch (_) { }

      let scheduledSubjects = [];
      try {
        const sched = JSON.parse(localStorage.getItem('vcas_admin_ht_subjects_schedule') || '[]');
        if (Array.isArray(sched)) scheduledSubjects = sched;
      } catch (_) { }

      const rawBackendSubjects = Array.isArray(subjectsData?.data)
        ? subjectsData.data
        : Array.isArray(subjectsData?.subjects)
          ? subjectsData.subjects
          : Array.isArray(subjectsData)
            ? subjectsData
            : [];
      const allSubjects = [...rawBackendSubjects, ...cachedAdminSubjects, ...scheduledSubjects];
      const officialSubjectCodes = new Set(allSubjects.map(s => (s.code || '').toUpperCase().trim()).filter(Boolean));
      const roleKey = String(staffUser?.role || '').toUpperCase();
      const designationKey = String(staffUser?.designation || '').toUpperCase();
      const looksLikeHodUser = (value) => {
        const normalized = String(value || '').toUpperCase();
        return normalized.includes('HOD') ||
          normalized.includes('HEAD OF DEPARTMENT') ||
          normalized.includes('HEADOFDEPARTMENT') ||
          (normalized.includes('HEAD') && normalized.includes('DEPARTMENT')) ||
          normalized.includes('DEPARTMENT HEAD');
      };
      const normalizeIdentity = (value) => String(value || '').trim().toLowerCase().replace(/^(dr|prof|mr|mrs|ms|miss)\.?\s+/i, '').replace(/[^a-z0-9]/g, '');
      const departmentList = departmentsData?.data || (Array.isArray(departmentsData) ? departmentsData : []);
      const staffDepartment = String(staffUser?.department || '').trim().toLowerCase();
      const staffIdentifiers = [staffUser?.name, staffUser?.fullName, staffUser?.email, staffUser?._id, effectiveStaffId]
        .map(normalizeIdentity).filter(Boolean);
      const isDepartmentHod = departmentList.some(department => {
        if (String(department?.name || '').trim().toLowerCase() !== staffDepartment) return false;
        return [department?.hod, department?.hodEmail].map(normalizeIdentity).some(identity => identity && staffIdentifiers.includes(identity));
      });
      const isHodUser = staffUser?.isHod === true || staffUser?.canAllocateTasks === true ||
        looksLikeHodUser(staffUser?.role) || looksLikeHodUser(staffUser?.designation) || isDepartmentHod;
      const isPrincipalOrAdmin = roleKey.includes('PRINCIPAL') || roleKey.includes('ADMIN') || designationKey.includes('PRINCIPAL') || designationKey.includes('ADMIN');

      const isGenericSubjectEntry = (value) => {
        const normalized = String(value || '').trim();
        if (!normalized) return true;
        const candidate = normalized.toUpperCase();
        return ['GENERAL', 'COURSE', 'ALL SUBJECTS', 'UNASSIGNED', 'N/A', 'NA', 'DEFAULT', '-- SELECT --'].includes(candidate);
      };

      const addSub = (code, name, meta = {}) => {
        const c = (code || '').trim().toUpperCase();
        const n = String(name || '').trim();
        if (!c || c.length < 2 || seen.has(c)) return;
        if (isGenericSubjectEntry(c) || isGenericSubjectEntry(n)) return;
        if (['CS1001', 'CS101', 'CS123', 'CS2001'].includes(c)) return;

        // SuperAdmin/Admin sees everything. HOD sees all subjects in their dept (from ALL staff).
        // Regular staff sees only their dept subjects.
        // If subject has no department set, always include it.
        if (!isSuperAdminUser && !isAdminUser && staffDepartment) {
          const sDept = String(meta.dept || meta.department || '').trim().toLowerCase();
          if (sDept && sDept !== staffDepartment && !sDept.includes(staffDepartment) && !staffDepartment.includes(sDept)) {
            return;
          }
        }

        seen.add(c);

        subs.push({
          code: c,
          name: (n && !isGenericSubjectEntry(n) && n !== c) ? n : c,
          dept: meta.dept || meta.department || '',
          year: meta.year || null,
          semester: meta.semester || meta.sem || null,
          staffId: meta.staffId || '',
          staffName: meta.staffName || '',
        });
      };

      const matchesStaffIdentity = (value) => {
        const candidate = String(value || '').trim();
        if (!candidate) return false;
        const candidateNorm = normalizeIdentity(candidate);
        const staffNameNorm = normalizeIdentity(staffUser?.name || '');
        const staffIdNorm = normalizeIdentity(effectiveStaffId || '');
        if (!candidateNorm) return false;
        return candidateNorm === staffNameNorm ||
          candidateNorm === staffIdNorm ||
          candidateNorm.includes(staffNameNorm) ||
          candidateNorm.includes(staffIdNorm) ||
          staffNameNorm.includes(candidateNorm) ||
          staffIdNorm.includes(candidateNorm);
      };

      // 1. Official subjects from Admin Course & Subject Management
      allSubjects.forEach(s => addSub(s.code, s.name, {
        ...s,
        dept: s.department || s.dept,
        isOfficial: true
      }));

      // 2. Official department courses configured by Admin in Department Management
      departmentList.forEach(dept => {
        const deptName = dept?.name || '';
        (dept?.coursesList || []).forEach(c => {
          addSub(c.code, c.name || c.title, {
            ...c,
            dept: deptName,
            isOfficial: true
          });
        });
      });

      // 3. Staff's directly assigned classes
      const staffClasses = staffClsData?.classes || (Array.isArray(staffClsData?.data) ? staffClsData.data : []);
      staffClasses.forEach(c => addSub(c.code || c.classCode, c.name || c.className, c));

      // 4. Department classes for this staff member (both Staff and HOD)
      const departmentClasses = departmentClassesData?.classes || (Array.isArray(departmentClassesData?.data) ? departmentClassesData.data : []);
      departmentClasses.forEach(c => addSub(c.code || c.classCode, c.name || c.className, c));

      // 5. Classes from allClasses matching department or staff identity
      const allClasses = allClassesData?.classes || (Array.isArray(allClassesData?.data) ? allClassesData.data : (Array.isArray(allClassesData) ? allClassesData : []));
      if (staffDepartment) {
        allClasses
          .filter(c => {
            const cDept = String(c.dept || c.department || '').trim().toLowerCase();
            return cDept && (cDept === staffDepartment || cDept.includes(staffDepartment) || staffDepartment.includes(cDept));
          })
          .forEach(c => addSub(c.code || c.classCode, c.name || c.className, c));
      }

      allClasses
        .filter(c => matchesStaffIdentity(c.staffId) || matchesStaffIdentity(c.staffName) || matchesStaffIdentity(c.faculty))
        .forEach(c => addSub(c.code || c.classCode, c.name || c.className, c));

      // 6. Existing marks and assignments (only official active subjects, not obsolete/removed codes)
      if (marksData?.success && Array.isArray(marksData.data)) {
        marksData.data.forEach(m => {
          const mCode = (m.subjectCode || '').toUpperCase().trim();
          if (!officialSubjectCodes.has(mCode)) return;
          addSub(m.subjectCode, m.subjectName || m.subjectCode, m);
        });
      }

      if (asgtsData?.success && Array.isArray(asgtsData.data)) {
        asgtsData.data.forEach(a => {
          addSub(a.subjectCode, a.subjectName || a.title || a.subjectCode, a);
        });
      }

      // 7. If still empty, include remaining institution classes
      if (subs.length === 0) {
        allClasses.forEach(c => addSub(c.code || c.classCode, c.name || c.className, c));
      }

      // Sort subjects so staff's own department and assigned subjects appear at the top
      subs.sort((a, b) => {
        const aDeptMatch = staffDepartment && String(a.dept || '').trim().toLowerCase() === staffDepartment;
        const bDeptMatch = staffDepartment && String(b.dept || '').trim().toLowerCase() === staffDepartment;
        if (aDeptMatch && !bDeptMatch) return -1;
        if (!aDeptMatch && bDeptMatch) return 1;
        return (a.code || '').localeCompare(b.code || '');
      });

      const stored = localStorage.getItem('vcas_internal_subject') || sessionStorage.getItem('vcas_internal_subject');
      const storedCode = stored ? stored.trim().toUpperCase() : '';
      const availableSubs = subs;
      setStaffSubjects(availableSubs);

      if (storedCode && !availableSubs.some(s => s.code === storedCode)) {
        localStorage.removeItem('vcas_internal_subject');
        sessionStorage.removeItem('vcas_internal_subject');
        // Only clear if no other subject is currently selected by user
        if (!subjectCode) {
          setSubjectCode('');
          setSearchInput('');
          setSubjectName('');
        }
      }

      // Only auto-select on initial load (when no subject is currently selected).
      // If the user has already picked a subject from the dropdown, don't override it.
      if (availableSubs.length > 0 && !subjectCode) {
        const match = availableSubs.find(s => s.code === storedCode);
        const target = match ? match.code : availableSubs[0].code;
        const targetName = match ? match.name : availableSubs[0].name;
        setSubjectCode(target);
        setSearchInput(target);
        setSubjectName(targetName);
        fetchMarksheet(target);
      }
    } catch (error) {
      console.error('Failed to refresh staff subjects:', error);
    }
  }, [effectiveStaffId, staffUser, fetchMarksheet, isHod, isAdminUser, isSuperAdminUser]);

  // Load available staff subjects, all students, and departments on mount
  useEffect(() => {
    // Clear legacy dummy codes from storage
    try {
      ['CS2001', 'CS1001', 'CS101', 'CS123'].forEach(c => {
        if (localStorage.getItem('vcas_internal_subject') === c) localStorage.removeItem('vcas_internal_subject');
        if (sessionStorage.getItem('vcas_internal_subject') === c) sessionStorage.removeItem('vcas_internal_subject');
      });
    } catch { }

    // Fetch registered students and departments for filtering
    fetch(`${API}/students`)
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setAllRegisteredStudents(res.data);
        }
      })
      .catch(() => { });

    fetch(`${API}/departments`)
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setAdminDepartments(res.data);
        }
      })
      .catch(() => { });

    fetchStaffSubjects();

    const handleSubjectsUpdated = () => {
      fetchStaffSubjects();
    };
    window.addEventListener('vcas_subjects_updated', handleSubjectsUpdated);
    window.addEventListener('storage', handleSubjectsUpdated);

    return () => {
      window.removeEventListener('vcas_subjects_updated', handleSubjectsUpdated);
      window.removeEventListener('storage', handleSubjectsUpdated);
    };
  }, [fetchStaffSubjects]);

  // Always load initial/stored subject on mount
  useEffect(() => {
    const target = getStoredSubject();
    if (target) {
      fetchMarksheet(target);
    }
  }, [fetchMarksheet]);

  const handleLoadSubject = (codeToLoad) => {
    const target = (codeToLoad !== undefined ? codeToLoad : searchInput).trim().toUpperCase();
    if (!target) return;
    try {
      localStorage.setItem('vcas_internal_subject', target);
      sessionStorage.setItem('vcas_internal_subject', target);
    } catch {}
    setSubjectCode(target);
    setFilterSubject(target);
    setSearchInput(target);
    fetchMarksheet(target);
  };

  // Recalculate consolidated marks for a student based on current/given config
  const calculateConsolidated = (student, config = maxMarksConfig) => {
    const it1Val = student.it1 !== null && student.it1 !== undefined ? student.it1 : student.cia1;
    const it2Val = student.it2 !== null && student.it2 !== undefined ? student.it2 : student.cia2;

    const it1 = (it1Val === "AB" || it1Val === "A" || it1Val == null) ? 0 : Number(it1Val) || 0;
    const it2 = (it2Val === "AB" || it2Val === "A" || it2Val == null) ? 0 : Number(it2Val) || 0;
    const mod = (student.model === "AB" || student.model === "A" || student.model == null) ? 0 : Number(student.model) || 0;

    // Assignment calculation: sum of assignment 1..4 (or fallback to student.assignment)
    let asgTotal = 0;
    const hasAssignments = [student.assignment1, student.assignment2, student.assignment3, student.assignment4].some(a => a !== null && a !== undefined);
    if (hasAssignments) {
      asgTotal = (Number(student.assignment1) || 0) + (Number(student.assignment2) || 0) + (Number(student.assignment3) || 0) + (Number(student.assignment4) || 0);
    } else if (student.assignment != null) {
      asgTotal = Number(student.assignment) || 0;
    }

    const it1Max = Number(config.it1) || Number(config.cia1) || 25;
    const it2Max = Number(config.it2) || Number(config.cia2) || 25;
    const modMax = Number(config.model) || 75;
    const asgMax = Number(config.assignment) || 20;
    const consMax = Number(config.consolidated) || 25;

    // Scale Internal Tests to 10 marks total
    const itScaled = ((it1 + it2) / ((it1Max + it2Max) || 50)) * 10;
    // Scale Model exam to 10 marks
    const modelScaled = modMax > 0 ? (mod / modMax) * 10 : 0;
    // Scale Assignment to 5 marks
    const asgScaled = asgMax > 0 ? (asgTotal / asgMax) * 5 : 0;

    const total = Math.round(itScaled + modelScaled + asgScaled);
    return Math.min(consMax, total);
  };

  const calculateStudentGrade = (student, config = maxMarksConfig) => {
    if (student?.grade !== null && student?.grade !== undefined && String(student.grade).trim() !== "") {
      return String(student.grade).trim().toUpperCase();
    }

    const consolidated = Number(student?.consolidated ?? 0);
    if (!Number.isFinite(consolidated) || consolidated <= 0) return "-";

    const maxValue = Math.max(1, Number(config?.consolidated) || 25);
    const percentage = (consolidated / maxValue) * 100;

    const gradeThresholds = [
      ["A+", 95],
      ["A", 85],
      ["B+", 75],
      ["B", 65],
      ["C", 55],
      ["D", 45],
      ["F", 0]
    ];

    for (const [grade, threshold] of gradeThresholds) {
      if (percentage >= threshold) return grade;
    }

    return "F";
  };

  // -- Save marks ------------------------------------------------------
  const handleSave = async () => {
    if (!subjectCode) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/internal-marks/${effectiveStaffId}/${encodeURIComponent(subjectCode)}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffName, subjectName,
          department: staffUser?.department || "",
          academicYear: staffUser?.academicYear || "2025-2026",
          students,
          maxMarks: maxMarksConfig,
          passMarks: passMarksConfig,
        }),
      });
      const json = await res.json();
      if (json.success) toast("Official marksheet register and evaluation criteria saved successfully!");
      else toast(json.message, true);
    } catch {
      toast("Server error while saving marks.", true);
    } finally {
      setSaving(false);
    }
  };

  // -- Sync assignment marks from Assignments portal ------------------
  const handleSyncAssignments = async () => {
    if (!subjectCode) return;
    setSyncingAssignments(true);
    try {
      const res = await fetch(`${API}/internal-marks/${effectiveStaffId}/${encodeURIComponent(subjectCode)}/sync-assignments`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success && json.data) {
        setStudents(json.data.students || []);
        if (json.data.subjectName && !subjectName) setSubjectName(json.data.subjectName);
        toast(json.message || "Assignment marks synchronized successfully!");
      } else {
        toast(json.message || "Could not sync assignment marks.", true);
      }
    } catch {
      toast("Error syncing assignment marks. Make sure backend is running.", true);
    } finally {
      setSyncingAssignments(false);
    }
  };

  // -- Apply Max & Pass Marks from Modal -------------------------------
  const handleApplyCriteria = async (e) => {
    e.preventDefault();
    if (isLocked) {
      toast("Cannot modify criteria because marksheet is locked.", true);
      return;
    }

    const gradeThresholdMap = { "A+": 95, A: 85, "B+": 75, B: 65, C: 55, D: 45, F: 0 };

    const validatedMax = {
      ...tempMaxConfig,
      st1: Math.max(1, Number(tempMaxConfig.st1) || 20),
      st2: Math.max(1, Number(tempMaxConfig.st2) || 20),
      st3: Math.max(1, Number(tempMaxConfig.st3) || 20),
      st4: Math.max(1, Number(tempMaxConfig.st4) || 20),
      it1: Math.max(1, Number(tempMaxConfig.it1) || 25),
      it2: Math.max(1, Number(tempMaxConfig.it2) || 25),
      cia1: Math.max(1, Number(tempMaxConfig.cia1) || 50),
      cia2: Math.max(1, Number(tempMaxConfig.cia2) || 50),
      model: Math.max(1, Number(tempMaxConfig.model) || 75),
      semester: Math.max(1, Number(tempMaxConfig.semester) || 100),
      seminar: Math.max(1, Number(tempMaxConfig.seminar) || 10),
      project: Math.max(1, Number(tempMaxConfig.project) || 20),
      assignment1: Math.max(1, Number(tempMaxConfig.assignment1) || 5),
      assignment2: Math.max(1, Number(tempMaxConfig.assignment2) || 5),
      assignment3: Math.max(1, Number(tempMaxConfig.assignment3) || 5),
      assignment4: Math.max(1, Number(tempMaxConfig.assignment4) || 5),
      assignment: Math.max(1, Number(tempMaxConfig.assignment) || 20),
      attendance: Math.max(1, Number(tempMaxConfig.attendance) || 5),
      grade: Math.max(1, Number(tempMaxConfig.grade) || 100),
      consolidated: Math.max(1, Number(tempMaxConfig.consolidated) || 25),
    };

    const rawGradePass = String(tempPassConfig.grade || "B").trim().toUpperCase();
    const validatedPass = {
      ...tempPassConfig,
      st1: Math.min(validatedMax.st1, Math.max(0, Number(tempPassConfig.st1) || 8)),
      st2: Math.min(validatedMax.st2, Math.max(0, Number(tempPassConfig.st2) || 8)),
      st3: Math.min(validatedMax.st3, Math.max(0, Number(tempPassConfig.st3) || 8)),
      st4: Math.min(validatedMax.st4, Math.max(0, Number(tempPassConfig.st4) || 8)),
      it1: Math.min(validatedMax.it1, Math.max(0, Number(tempPassConfig.it1) || 10)),
      it2: Math.min(validatedMax.it2, Math.max(0, Number(tempPassConfig.it2) || 10)),
      cia1: Math.min(validatedMax.cia1, Math.max(0, Number(tempPassConfig.cia1) || 20)),
      cia2: Math.min(validatedMax.cia2, Math.max(0, Number(tempPassConfig.cia2) || 20)),
      model: Math.min(validatedMax.model, Math.max(0, Number(tempPassConfig.model) || 30)),
      semester: Math.min(validatedMax.semester, Math.max(0, Number(tempPassConfig.semester) || 40)),
      seminar: Math.min(validatedMax.seminar, Math.max(0, Number(tempPassConfig.seminar) || 4)),
      project: Math.min(validatedMax.project, Math.max(0, Number(tempPassConfig.project) || 8)),
      assignment1: Math.min(validatedMax.assignment1, Math.max(0, Number(tempPassConfig.assignment1) || 2)),
      assignment2: Math.min(validatedMax.assignment2, Math.max(0, Number(tempPassConfig.assignment2) || 2)),
      assignment3: Math.min(validatedMax.assignment3, Math.max(0, Number(tempPassConfig.assignment3) || 2)),
      assignment4: Math.min(validatedMax.assignment4, Math.max(0, Number(tempPassConfig.assignment4) || 2)),
      assignment: Math.min(validatedMax.assignment, Math.max(0, Number(tempPassConfig.assignment) || 8)),
      attendance: Math.min(validatedMax.attendance, Math.max(0, Number(tempPassConfig.attendance) || 2)),
      grade: gradeThresholdMap[rawGradePass] ?? 65,
      consolidated: Math.min(validatedMax.consolidated, Math.max(0, Number(tempPassConfig.consolidated) || 10)),
    };

    setSavingCriteria(true);
    try {
      const updatedStudents = students.map((s) => {
        const updated = { ...s, consolidated: calculateConsolidated(s, validatedMax), grade: null };
        updated.grade = calculateStudentGrade(updated, validatedMax);
        return updated;
      });

      setMaxMarksConfig(validatedMax);
      setPassMarksConfig(validatedPass);
      setStudents(updatedStudents);

      const res = await fetch(`${API}/internal-marks/${effectiveStaffId}/${encodeURIComponent(subjectCode)}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffName,
          subjectName,
          department: staffUser?.department || "",
          academicYear: staffUser?.academicYear || "2025-2026",
          students: updatedStudents,
          maxMarks: validatedMax,
          passMarks: validatedPass,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast("Criteria updated! Student pass/fail statuses and Final CIA marks refreshed.");
        setShowConfigModal(false);
      } else {
        toast(json.message || "Failed to update criteria.", true);
      }
    } catch {
      toast("Error saving exam criteria.", true);
    } finally {
      setSavingCriteria(false);
    }
  };

  // -- Multi-Tier Approval Handlers (Order: HOD -> Principal -> MD) ---
  const handleSubmitForApproval = async () => {
    if (!subjectCode) return;
    setIsSubmittingApproval(true);
    try {
      await handleSave();
      const res = await fetch(`${API}/internal-marks/${effectiveStaffId}/${encodeURIComponent(subjectCode)}/submit-approval`, {
        method: "POST"
      });
      const json = await res.json();
      if (json.success) {
        setApprovalStatus(json.data?.approvalStatus || 'Pending HOD');
        setCurrentApprovalStage(json.data?.currentApprovalStage || 'HOD');
        setIsLocked(false);
        if (json.data?.hodApproval) setHodApproval(json.data.hodApproval);
        if (json.data?.principalApproval) setPrincipalApproval(json.data.principalApproval);
        if (json.data?.mdApproval) setMdApproval(json.data.mdApproval);
        toast("Marksheet submitted for approval! Stage 1: HOD Review & Recommendation.");
      } else {
        toast(json.message || "Failed to submit for approval.", true);
      }
    } catch {
      toast("Server error submitting for approval.", true);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleStageApprovalAction = async (stage, action) => {
    if (!subjectCode) return;
    const remarks = window.prompt(`Enter remarks for ${stage} ${action}:`, action === 'Approved' ? 'Verified and approved' : '');
    if (remarks === null) return;

    setIsProcessingStage(true);
    try {
      const res = await fetch(`${API}/internal-marks/${effectiveStaffId}/${encodeURIComponent(subjectCode)}/stage-approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          action,
          approvedBy: staffUser?.name || stage,
          remarks: remarks || ''
        })
      });
      const json = await res.json();
      if (json.success) {
        setApprovalStatus(json.data.approvalStatus);
        setCurrentApprovalStage(json.data.currentApprovalStage);
        if (json.data.isLocked !== undefined) setIsLocked(json.data.isLocked);
        if (json.data.hodApproval) setHodApproval(json.data.hodApproval);
        if (json.data.principalApproval) setPrincipalApproval(json.data.principalApproval);
        if (json.data.mdApproval) setMdApproval(json.data.mdApproval);
        toast(json.message);
      } else {
        toast(json.message || "Stage approval failed.", true);
      }
    } catch {
      toast("Server error processing stage approval.", true);
    } finally {
      setIsProcessingStage(false);
    }
  };

  // -- Marks Download Handler (Subject-wise, Department-wise, Year-wise, Batch-wise, Sem-wise) --
  const handleDownloadMarks = async (type = 'subject') => {
    setIsExporting(true);
    try {
      let marksheetsToExport = [];
      let filename = '';

      if (type === 'subject') {
        if (!subjectCode) {
          toast("Please select a subject to download marks.", true);
          setIsExporting(false);
          return;
        }
        marksheetsToExport = [{
          subjectCode,
          subjectName,
          department: staffUser?.department || filterDept || '',
          students
        }];
        filename = `Internal_Marks_${subjectCode}_${new Date().toISOString().slice(0, 10)}`;
      } else {
        let queryUrl = `${API}/internal-marks/export/filtered?`;
        if (type === 'department') {
          queryUrl += `department=${encodeURIComponent(downloadDept)}`;
          filename = `Internal_Marks_Dept_${downloadDept.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
        } else if (type === 'year') {
          queryUrl += `year=${encodeURIComponent(downloadYear)}&semester=${encodeURIComponent(downloadSemester)}`;
          filename = `Internal_Marks_${downloadYear.replace(/\s+/g, '_')}_Sem${downloadSemester}_${new Date().toISOString().slice(0, 10)}`;
        } else if (type === 'batch') {
          queryUrl += `batch=${encodeURIComponent(downloadBatch)}`;
          filename = `Internal_Marks_Batch_${downloadBatch.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
        } else if (type === 'semester') {
          queryUrl += `semester=${encodeURIComponent(downloadSemester)}`;
          filename = `Internal_Marks_Sem_${downloadSemester}_${new Date().toISOString().slice(0, 10)}`;
        }

        const res = await fetch(queryUrl);
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          marksheetsToExport = json.data;
        } else {
          toast(`No marks records found for this ${type} selection.`, true);
          setIsExporting(false);
          return;
        }
      }

      // Prepare structured rows for Export
      const exportRows = [];
      marksheetsToExport.forEach(ms => {
        (ms.students || []).forEach((s, idx) => {
          const it1 = s.it1 !== null && s.it1 !== undefined ? s.it1 : (s.cia1 ?? "-");
          const it2 = s.it2 !== null && s.it2 !== undefined ? s.it2 : (s.cia2 ?? "-");
          const grade = calculateStudentGrade(s, ms.maxMarks || maxMarksConfig);
          exportRows.push({
            'Department': ms.department || '',
            'Subject Code': ms.subjectCode || '',
            'Subject Name': ms.subjectName || '',
            'Semester': ms.semester || 1,
            'S.NO': idx + 1,
            'Roll No': s.rollNo,
            'Student Name': s.name,
            'Internal 1': it1,
            'Internal 2': it2,
            'Model': s.model ?? "-",
            'Semester Exam': s.semester ?? "-",
            'Seminar': s.seminar ?? "-",
            'Project': s.project ?? "-",
            'ST 1': s.st1 ?? "-",
            'ST 2': s.st2 ?? "-",
            'ST 3': s.st3 ?? "-",
            'ST 4': s.st4 ?? "-",
            'Assignment 1': s.assignment1 ?? "-",
            'Assignment 2': s.assignment2 ?? "-",
            'Assignment 3': s.assignment3 ?? "-",
            'Assignment 4': s.assignment4 ?? "-",
            'Final CIA': s.consolidated ?? "-",
            'Grade': grade
          });
        });
      });

      if (downloadFormat === 'excel') {
        const XLSX = await getSheetJS();
        if (XLSX && exportRows.length > 0) {
          const ws = XLSX.utils.json_to_sheet(exportRows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Marks');
          XLSX.writeFile(wb, `${filename}.xlsx`);
        } else {
          // Fallback to CSV
          downloadMarksAsCsv(exportRows, filename);
        }
      } else {
        downloadMarksAsCsv(exportRows, filename);
      }

      toast(`Marks downloaded successfully (${type}-wise)!`);
      setShowDownloadModal(false);
    } catch (err) {
      toast("Error downloading marks: " + err.message, true);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadMarksAsCsv = (rows, filename) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    let csv = headers.join(',') + '\n';
    rows.forEach(r => {
      csv += headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -- Lock / Unlock ---------------------------------------------------
  const handleToggleLock = async () => {
    if (!isLocked) {
      setShowFreezeModal(true);
      return;
    }
    try {
      const res = await fetch(`${API}/internal-marks/${effectiveStaffId}/${encodeURIComponent(subjectCode)}/lock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lock: false }),
      });
      const json = await res.json();
      if (json.success) {
        setIsLocked(false);
        toast("Marks register unlocked for editing.");
      } else toast(json.message, true);
    } catch {
      toast("Server error.", true);
    }
  };

  const executeFreezeAndSubmit = async () => {
    setIsFreezing(true);
    try {
      await handleSave();
      const res = await fetch(`${API}/internal-marks/${effectiveStaffId}/${encodeURIComponent(subjectCode)}/lock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lock: true }),
      });
      const json = await res.json();
      if (json.success) {
        setIsLocked(json.data?.isLocked ?? true);
        toast("Marks register locked & submitted to MD!");
        setShowFreezeModal(false);
      } else {
        toast(json.message || "Failed to submit marks to MD.", true);
      }
    } catch {
      toast("Server error while freezing marks.", true);
    } finally {
      setIsFreezing(false);
    }
  };

  // -- Generic Cell Change (supports numbers, decimals, letter grades like A/B, "AB", "-") -----
  const handleCellChange = (rollNo, field, val) => {
    if (isLocked && !(isHod || isAdminUser || isSuperAdminUser)) return;
    if (isLocked) return;
    setErrorMsg("");

    if (val === "" || val === null || val === undefined) {
      updateStudentCell(rollNo, field, null);
      return;
    }

    const strVal = String(val).trim();
    const upper = strVal.toUpperCase();

    if (field === "grade") {
      const validGrades = ["A+", "A", "B+", "B", "C", "D", "F", "AB", "ABS", "-", "NA"];
      if (validGrades.includes(upper)) {
        updateStudentCell(rollNo, field, upper === "ABS" ? "AB" : upper === "NA" ? "AB" : upper);
        return;
      }
      setErrorMsg("Grade must be one of A+, A, B+, B, C, D, F, AB.");
      return;
    }

    if (upper === "A" || upper === "AB" || upper === "ABS") {
      updateStudentCell(rollNo, field, "AB");
      return;
    }
    if (upper === "-") {
      updateStudentCell(rollNo, field, "-");
      return;
    }

    const numVal = Number(strVal);
    if (!isNaN(numVal)) {
      const maxAllowed = maxMarksConfig[field] ?? 100;
      if (numVal < 0 || numVal > maxAllowed) {
        setErrorMsg(`Marks for ${field.toUpperCase()} must be between 0 and ${maxAllowed}.`);
        return;
      }
      updateStudentCell(rollNo, field, numVal);
    } else {
      updateStudentCell(rollNo, field, strVal);
    }
  };

  const updateStudentCell = (rollNo, field, value) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.rollNo !== rollNo) return s;
        const updated = { ...s, [field]: value };
        // Bi-directional sync between IT1/CIA1 and IT2/CIA2
        if (field === "it1") updated.cia1 = value;
        if (field === "it2") updated.cia2 = value;
        if (field === "cia1") updated.it1 = value;
        if (field === "cia2") updated.it2 = value;

        updated.consolidated = calculateConsolidated(updated, maxMarksConfig);
        if (field !== "grade") {
          updated.grade = calculateStudentGrade({ ...updated, grade: null }, maxMarksConfig);
        }
        return updated;
      })
    );
  };

  // -- Add student -----------------------------------------------------
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newRollNo.trim() || !newStudentName.trim()) return;
    const cleanRoll = newRollNo.trim().toUpperCase();
    const cleanName = newStudentName.trim();
    const exists = students.some((s) => (s.rollNo || '').toUpperCase() === cleanRoll);
    if (exists) { toast("Student with this roll number already exists.", true); return; }
    const newStudentObj = {
      rollNo: cleanRoll,
      name: cleanName,
      st1: null, st2: null, st3: null, st4: null,
      it1: null, it2: null, cia1: null, cia2: null,
      model: null, seminar: null, project: null,
      assignment1: null, assignment2: null, assignment3: null, assignment4: null,
      assignment: null, attendance: null, grade: null, consolidated: null
    };
    const nextStudents = [...students, newStudentObj];
    setStudents(nextStudents);
    setNewRollNo(""); setNewStudentName(""); setShowAddStudent(false);
    toast(`Added student ${cleanName} (${cleanRoll})`);

    // Auto-persist immediately to backend marksheet
    if (subjectCode) {
      try {
        await fetch(`${API}/internal-marks/${effectiveStaffId}/${encodeURIComponent(subjectCode)}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subjectName: subjectName || subjectCode,
            students: nextStudents,
            maxMarks: maxMarksConfig,
            passMarks: passMarksConfig
          })
        });
      } catch (err) {
        console.warn("Auto-save new student error:", err);
      }
    }
  };

  // -- Export CSV with all register columns ---------------------------
  const handleExport = () => {
    let csv = `S.NO,Roll No,Student Name,Internal 1,Internal 2,Model,Semester,Seminar,Project,ST 1,ST 2,ST 3,ST 4,Assignment 1,Assignment 2,Assignment 3,Assignment 4,Final CIA,Grade\n`;
    students.forEach((s, idx) => {
      const it1 = s.it1 !== null && s.it1 !== undefined ? s.it1 : (s.cia1 ?? "-");
      const it2 = s.it2 !== null && s.it2 !== undefined ? s.it2 : (s.cia2 ?? "-");
      const grade = calculateStudentGrade(s, maxMarksConfig);
      csv += `${idx + 1},"${s.rollNo}","${s.name}",${it1},${it2},${s.model ?? "-"},${s.semester ?? "-"},${s.seminar ?? "-"},${s.project ?? "-"},${s.st1 ?? "-"},${s.st2 ?? "-"},${s.st3 ?? "-"},${s.st4 ?? "-"},${s.assignment1 ?? "-"},${s.assignment2 ?? "-"},${s.assignment3 ?? "-"},${s.assignment4 ?? "-"},${s.consolidated ?? "-"},"${grade}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Official_Mark_Register_${subjectCode}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -- Official College Register Printable Document Generator --------
  const handlePrintRegisterSheet = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to print the official college register marksheet.');
      return;
    }

    const rowsHtml = students.map((s, idx) => {
      const it1 = s.it1 !== null && s.it1 !== undefined ? s.it1 : (s.cia1 !== null && s.cia1 !== undefined ? s.cia1 : '');
      const it2 = s.it2 !== null && s.it2 !== undefined ? s.it2 : (s.cia2 !== null && s.cia2 !== undefined ? s.cia2 : '');
      return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="text-align: left; font-weight: 600; padding-left: 6px;">
            ${s.name || '-'}
            <div style="font-size: 8px; color: #555; font-family: monospace;">${s.rollNo}</div>
          </td>
          <td style="text-align: center;">${it1}</td>
          <td style="text-align: center;">${it2}</td>
          <td style="text-align: center;">${s.model !== null && s.model !== undefined ? s.model : ''}</td>
          <td style="text-align: center;">${s.semester !== null && s.semester !== undefined ? s.semester : ''}</td>
          <td style="text-align: center;">${s.seminar !== null && s.seminar !== undefined ? s.seminar : ''}</td>
          <td style="text-align: center;">${s.project !== null && s.project !== undefined ? s.project : ''}</td>
          <td style="text-align: center;">${s.st1 !== null && s.st1 !== undefined ? s.st1 : ''}</td>
          <td style="text-align: center;">${s.st2 !== null && s.st2 !== undefined ? s.st2 : ''}</td>
          <td style="text-align: center;">${s.st3 !== null && s.st3 !== undefined ? s.st3 : ''}</td>
          <td style="text-align: center;">${s.st4 !== null && s.st4 !== undefined ? s.st4 : ''}</td>
          <td style="text-align: center;">${s.assignment1 !== null && s.assignment1 !== undefined ? s.assignment1 : ''}</td>
          <td style="text-align: center;">${s.assignment2 !== null && s.assignment2 !== undefined ? s.assignment2 : ''}</td>
          <td style="text-align: center;">${s.assignment3 !== null && s.assignment3 !== undefined ? s.assignment3 : ''}</td>
          <td style="text-align: center;">${s.assignment4 !== null && s.assignment4 !== undefined ? s.assignment4 : ''}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>VIVEKANANDA COLLEGE - OFFICIAL MARK ENTRY REGISTER - ${subjectCode}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #111;
            margin: 0;
            padding: 8px;
            font-size: 10px;
          }
          .header {
            text-align: center;
            margin-bottom: 8px;
            border-bottom: 1.5px solid #000;
            padding-bottom: 6px;
          }
          .college-title {
            font-size: 14pt;
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .college-loc {
            font-size: 10pt;
            font-weight: bold;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 9pt;
            font-weight: bold;
            margin-top: 6px;
            padding: 2px 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
          }
          th, td {
            border: 1px solid #000;
            padding: 3px 2px;
            height: 22px;
          }
          th {
            background-color: #f2f2f2;
            text-align: center;
            font-weight: bold;
            font-size: 8.5pt;
          }
          .signatures {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 9.5pt;
            padding: 0 20px;
          }
          .sig-box {
            text-align: center;
            width: 160px;
            border-top: 1px solid #000;
            padding-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="college-title">VIVEKANANDA COLLEGE OF ARTS AND SCIENCE</div>
          <div class="college-loc">VELLALANKULAM - 627 856.</div>
          <div class="meta-row">
            <span>I B.SC(CS) MARK ENTRY - I SEM - 2026-27</span>
            <span>SUBJECT : ${subjectCode} ${subjectName ? `(${subjectName})` : ''}</span>
            <span>STAFF NAME : ${staffName || 'P. KALARANI'}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th rowspan="2" style="width: 32px;">S.NO</th>
              <th rowspan="2" style="width: 170px;">STUDENTS NAME</th>
              <th colspan="2">INTERNAL</th>
              <th rowspan="2" style="width: 45px;">MODEL</th>
              <th rowspan="2" style="width: 45px;">SEMESTER</th>
              <th rowspan="2" style="width: 45px;">SEMINAR</th>
              <th rowspan="2" style="width: 45px;">PROJECT</th>
              <th colspan="4">SNAP TEST</th>
              <th colspan="4">ASSIGNMENT</th>
            </tr>
            <tr>
              <th style="width: 44px;">Internal 1</th>
              <th style="width: 44px;">Internal 2</th>
              <th style="width: 38px;">ST 1</th>
              <th style="width: 38px;">ST 2</th>
              <th style="width: 38px;">ST 3</th>
              <th style="width: 38px;">ST 4</th>
              <th style="width: 35px;">1</th>
              <th style="width: 35px;">2</th>
              <th style="width: 35px;">3</th>
              <th style="width: 35px;">4</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-box">STAFF IN-CHARGE</div>
          <div class="sig-box">HOD</div>
          <div class="sig-box">PRINCIPAL</div>
          <div class="sig-box">MANAGING DIRECTOR (MD)</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  const openConfigModal = () => {
    setTempMaxConfig({ ...maxMarksConfig });
    setTempPassConfig({ ...passMarksConfig });
    setShowConfigModal(true);
  };

  // Only staff submit to HOD - HOD does not submit to HOD
  const canSubmitToHod = Boolean(subjectCode) && isStaffOnly && !isHod;
  // HOD submit to admin: must stay visible after clicking and after popup (never disappear)
  const isHodSubmitted = hodApproval?.status === 'Approved' || ['Pending Principal', 'Pending MD', 'Approved'].includes(approvalStatus);
  const canHodApprove = Boolean(subjectCode) && (isHod || (isAdminUser && approvalStatus === 'Pending HOD'));
  const canAdminApprove = Boolean(subjectCode) && (isAdminUser || isPrincipal) && approvalStatus === 'Pending Principal';
  const canSuperAdminApprove = Boolean(subjectCode) && isSuperAdminUser && approvalStatus === 'Pending MD';
  const canUnlockMarks = Boolean(subjectCode) && isLocked && (isHod || isAdminUser || isSuperAdminUser);

  // Role-based marks visibility:
  // - Regular Staff: Can view & edit marks in 'Draft' / 'Rejected'. Once submitted ("after the staff entry itself it should not viewed"), marks are hidden & locked.
  // - HOD: Can ONLY view marks after staff submits ('Pending HOD', 'Pending Principal', 'Pending MD', 'Approved').
  // - Admin: Can ONLY view marks after HOD submits ('Pending Principal', 'Pending MD', 'Approved').
  // - Super Admin: Can ONLY view marks after Admin submits ('Pending MD', 'Approved').
  const canViewMarks = useMemo(() => {
    if (isSuperAdminUser) {
      return ['Pending MD', 'Approved'].includes(approvalStatus);
    }
    if (isAdminUser || isPrincipal) {
      return ['Pending Principal', 'Pending MD', 'Approved'].includes(approvalStatus);
    }
    // Both Staff and HOD can always view marks without locking
    return true;
  }, [isSuperAdminUser, isAdminUser, isPrincipal, approvalStatus]);

  const restrictedNotice = useMemo(() => {
    if (canViewMarks) return null;

    if (isStaffOnly) {
      return {
        badge: 'Submitted & Locked',
        title: 'Marksheet Submitted to HOD',
        desc: 'Your marks entry has been successfully submitted to the Head of Department (HOD) for review. As per college examination rules, marks cannot be viewed or edited after submission until reviewed.',
        stage: approvalStatus === 'Pending HOD' ? 'Awaiting HOD Review' : approvalStatus === 'Pending Principal' ? 'Forwarded to Admin' : 'Under Final Review by Super Admin',
        theme: 'bg-blue-50/90 border-blue-200 text-blue-900',
        badgeTheme: 'bg-blue-100 text-blue-800 border border-blue-300'
      };
    }

    if (isHod) {
      // HOD who teaches this subject: they are in Draft — no restriction message
      if (approvalStatus === 'Draft' || approvalStatus === 'Rejected' || !approvalStatus) {
        return null; // HOD can view and edit marks they teach
      }
      return {
        badge: 'Not Yet Submitted',
        title: 'Awaiting Staff Submission',
        desc: 'This marksheet is currently being prepared by the subject staff and has not been submitted yet. HOD can only view marks after the staff submits the entry.',
        stage: 'Pending Staff Entry',
        theme: 'bg-amber-50/90 border-amber-200 text-amber-900',
        badgeTheme: 'bg-amber-100 text-amber-800 border border-amber-300'
      };
    }

    if (isAdminUser || isPrincipal) {
      return {
        badge: 'Pending HOD Approval',
        title: 'Awaiting HOD Submission',
        desc: 'This marksheet has not yet been submitted by the Head of Department (HOD). The Admin can only view marks after the HOD has verified and submitted them.',
        stage: approvalStatus === 'Pending HOD' ? 'With HOD for Review' : 'With Staff for Entry',
        theme: 'bg-amber-50/90 border-amber-200 text-amber-900',
        badgeTheme: 'bg-amber-100 text-amber-800 border border-amber-300'
      };
    }

    if (isSuperAdminUser) {
      return {
        badge: 'Pending Admin Approval',
        title: 'Awaiting Admin Submission',
        desc: 'This marksheet has not yet been submitted by the College Admin. The Super Admin can only view marks after the Admin has verified and submitted them.',
        stage: approvalStatus === 'Pending Principal' ? 'With Admin for Review' : approvalStatus === 'Pending HOD' ? 'With HOD for Review' : 'With Staff for Entry',
        theme: 'bg-amber-50/90 border-amber-200 text-amber-900',
        badgeTheme: 'bg-amber-100 text-amber-800 border border-amber-300'
      };
    }

    return {
      badge: 'Access Restricted',
      title: 'Marks Unavailable at Current Stage',
      desc: 'You do not have permission to view marks at this approval stage.',
      stage: approvalStatus || 'Draft',
      theme: 'bg-slate-50 border-slate-200 text-slate-800',
      badgeTheme: 'bg-slate-100 text-slate-800 border border-slate-300'
    };
  }, [canViewMarks, isStaffOnly, isHod, isAdminUser, isPrincipal, isSuperAdminUser, approvalStatus]);

  // Set of roll numbers already enrolled in the marksheet
  const enrolledRollSet = useMemo(() => {
    return new Set(students.map(s => String(s.rollNo || '').toUpperCase().trim()));
  }, [students]);

  // Students eligible to assign based on current Department, Year, and Semester filters
  // Deduplicates by _id first, then by rollNo (prefers student whose regNo === rollNo)
  const eligibleStudentsToAssign = useMemo(() => {
    const filtered = allRegisteredStudents.filter(s => {
      // Dept filter
      if (filterDept && filterDept !== 'All') {
        const d = String(s.department || s.course || '').toLowerCase().trim();
        const target = filterDept.toLowerCase().trim();
        if (d !== target && !d.includes(target) && !target.includes(d)) return false;
      }
      // Year filter (1st, 2nd, 3rd Year)
      if (filterYear && filterYear !== 'All') {
        const getYearNum = (v) => {
          const str = String(v || '').toLowerCase().trim();
          if (str.includes('3') || str.includes('iii') || str.startsWith('third')) return 3;
          if (str.includes('2') || str.includes('ii') || str.startsWith('second')) return 2;
          if (str.includes('1') || str.includes('i') || str.startsWith('first')) return 1;
          const m = str.match(/\d+/);
          return m ? parseInt(m[0], 10) : 0;
        };
        const yNum = getYearNum(s.year) || Math.ceil((parseInt(String(s.sem || s.semester || '').replace(/\D/g, ''), 10) || 0) / 2);
        const targetNum = getYearNum(filterYear);
        if (targetNum && yNum !== targetNum) return false;
      }
      // Semester filter
      if (filterSem && filterSem !== 'All') {
        const numS = parseInt(String(s.sem || s.semester || '').replace(/\D/g, ''), 10) || 0;
        const numT = parseInt(String(filterSem).replace(/\D/g, ''), 10) || 0;
        if (numT && numS !== numT) return false;
      }
      return true;
    });

    // Deduplicate: prefer student whose regNo/studentId matches their rollNo (true rollNo owner)
    const seenRolls = new Map();
    const seenIds = new Set();
    const deduped = [];
    for (const s of filtered) {
      const uid = String(s._id || s.studentId || s.regNo || '').trim();
      if (uid && seenIds.has(uid)) continue;
      if (uid) seenIds.add(uid);
      const roll = String(s.rollNo || '').toUpperCase().trim();
      if (roll) {
        if (!seenRolls.has(roll)) {
          seenRolls.set(roll, deduped.length);
          deduped.push(s);
        } else {
          // If this student's regNo/studentId matches their rollNo, they are the primary — replace
          const prevIdx = seenRolls.get(roll);
          const prev = deduped[prevIdx];
          const prevMatch = (prev.regNo || prev.studentId || '').toUpperCase().trim() === roll;
          const thisMatch = (s.regNo || s.studentId || '').toUpperCase().trim() === roll;
          if (thisMatch && !prevMatch) {
            deduped[prevIdx] = s;
          }
        }
      } else {
        deduped.push(s);
      }
    }
    return deduped;
  }, [allRegisteredStudents, filterDept, filterYear, filterSem]);

  const handleSelectAllEligible = () => {
    const unassigned = eligibleStudentsToAssign
      .filter(s => !enrolledRollSet.has(String(s.rollNo || '').toUpperCase().trim()))
      .map(s => String(s.rollNo || '').toUpperCase().trim());
    setSelectedStudentsToAssign(new Set(unassigned));
  };

  const handleClearSelectedStudents = () => {
    setSelectedStudentsToAssign(new Set());
  };

  const handleToggleStudentSelect = (rollNo) => {
    const cleanRoll = String(rollNo || '').toUpperCase().trim();
    setSelectedStudentsToAssign(prev => {
      const next = new Set(prev);
      if (next.has(cleanRoll)) next.delete(cleanRoll);
      else next.add(cleanRoll);
      return next;
    });
  };

  const handleAssignSelectedStudents = async () => {
    if (!subjectCode) {
      toast("Please select a subject first.", true);
      return;
    }
    if (selectedStudentsToAssign.size === 0) {
      toast("Please select at least one student to assign.", true);
      return;
    }

    const studentsToAdd = eligibleStudentsToAssign.filter(s =>
      selectedStudentsToAssign.has(String(s.rollNo || '').toUpperCase().trim()) &&
      !enrolledRollSet.has(String(s.rollNo || '').toUpperCase().trim())
    );

    if (studentsToAdd.length === 0) {
      toast("All selected students are already in the marksheet.", true);
      return;
    }

    const newStudentObjects = studentsToAdd.map(s => ({
      rollNo: String(s.rollNo || '').toUpperCase().trim(),
      name: s.name || s.fullName || s.rollNo,
      department: s.department || (filterDept !== 'All' ? filterDept : staffUser?.department || ''),
      year: s.year || (filterYear !== 'All' ? filterYear : 'I Year'),
      sem: s.sem || (filterSem !== 'All' ? filterSem : 'Semester 1'),
      batch: s.batch || (filterBatch !== 'All' ? filterBatch : '2026-2027'),
      st1: null, st2: null, st3: null, st4: null,
      it1: null, it2: null, cia1: null, cia2: null,
      model: null, semester: null, seminar: null, project: null,
      assignment1: null, assignment2: null, assignment3: null, assignment4: null,
      assignment: null, attendance: null, grade: null, consolidated: null
    }));

    const updatedStudentsList = [...students, ...newStudentObjects];
    setStudents(updatedStudentsList);
    setSelectedStudentsToAssign(new Set());

    try {
      setSaving(true);
      const res = await fetch(`${API}/internal-marks/${effectiveStaffId}/${encodeURIComponent(subjectCode)}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffName,
          subjectName: subjectName || subjectCode,
          department: filterDept !== 'All' ? filterDept : (staffUser?.department || ""),
          year: filterYear !== 'All' ? filterYear : 'I Year',
          semester: filterSem !== 'All' ? (parseInt(filterSem.replace(/\D/g, ''), 10) || 1) : 1,
          academicYear: staffUser?.academicYear || "2025-2026",
          students: updatedStudentsList,
          maxMarks: maxMarksConfig,
          passMarks: passMarksConfig,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast(`Successfully assigned ${studentsToAdd.length} student(s) to ${subjectCode}!`);
      } else {
        toast(json.message || "Saved locally.", true);
      }
    } catch {
      toast("Error saving assigned students to database.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveStudentFromMarksheet = async (rollNoToRemove) => {
    if (isLocked) return;
    if (!window.confirm(`Are you sure you want to remove ${rollNoToRemove} from this subject marksheet?`)) return;
    const cleanRoll = String(rollNoToRemove || '').toUpperCase().trim();
    const updated = students.filter(s => String(s.rollNo || '').toUpperCase().trim() !== cleanRoll);
    setStudents(updated);
    toast(`Removed student ${cleanRoll} from marksheet.`);
    try {
      await fetch(`${API}/internal-marks/${effectiveStaffId}/${encodeURIComponent(subjectCode)}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffName, subjectName,
          department: staffUser?.department || "",
          students: updated,
          maxMarks: maxMarksConfig,
          passMarks: passMarksConfig,
        }),
      });
    } catch (_) { }
  };

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-slate-900">Official Mark Entry Register</h2>
            {subjectCode && (
              isLocked ? (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Lock className="w-3 h-3" /> Locked & Submitted
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Unlock className="w-3 h-3" /> Draft (Editable)
                </span>
              )
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Vivekananda College Official Marks Register Format — Snap Tests, Internals, Model, Seminar & Assignments
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Bulk Upload Marks via Excel Button (Super Admin format) */}
          <button
            type="button"
            onClick={() => setShowBulkUploadMarksModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold text-emerald-700 shadow-xs transition-all cursor-pointer"
            title="Bulk upload marks spreadsheet (.xlsx, .xls, .csv)"
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bulk Upload Marks</span>
          </button>

          {/* Download Marks (Dep / Yr / Batch / Sem) */}
          <button
            type="button"
            onClick={() => setShowDownloadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-bold text-indigo-700 shadow-xs transition-all cursor-pointer"
            title="Download marks by Department, Year, Batch, or Semester"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Download</span>
          </button>

          {subjectCode && (
            <>
              <button
                onClick={handlePrintRegisterSheet}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-xl text-xs font-bold text-purple-700 shadow-xs transition-all cursor-pointer"
                title="Print Official Vivekananda College Mark Entry Register Sheet"
              >
                <Printer className="w-3.5 h-3.5 text-purple-600" />
                <span>Print Register Sheet</span>
              </button>

              <button
                onClick={openConfigModal}
                disabled={isLocked}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50 rounded-xl text-xs font-bold text-indigo-700 shadow-xs transition-all"
                title="Configure Max Marks and Pass Marks for all exams and assignments"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" /> Set Max & Pass
              </button>

              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-xs transition-all"
                title="Download CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
              </button>

              {/* 1. Staff: Submit to HOD */}
              {canSubmitToHod && (
                <button
                  onClick={handleSubmitForApproval}
                  disabled={isSubmittingApproval || students.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  title="Submit marksheet to the Head of Department (HOD)"
                >
                  {isSubmittingApproval ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Submit to HOD</span>
                </button>
              )}

              {/* 2. HOD: Approve & Submit to Admin OR Reject to Staff (stays visible after clicking) */}
              {canHodApprove && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStageApprovalAction('HOD', 'Rejected')}
                    disabled={isProcessingStage}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 disabled:opacity-60 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Reject marksheet and return to staff for correction"
                  >
                    <X className="w-3.5 h-3.5 text-rose-600" />
                    <span>Return to Staff</span>
                  </button>
                  <button
                    onClick={() => handleStageApprovalAction('HOD', 'Approved')}
                    disabled={isProcessingStage || students.length === 0}
                    className={`flex items-center gap-1.5 px-3.5 py-2 ${
                      isHodSubmitted ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                    } disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer`}
                    title="HOD verifies and forwards marksheet to Admin"
                  >
                    {isProcessingStage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isHodSubmitted ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{isHodSubmitted ? 'Submitted to Admin' : 'Submit to Admin'}</span>
                  </button>
                </div>
              )}

              {/* 3. Admin: Approve to Super Admin OR Reject to HOD */}
              {canAdminApprove && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStageApprovalAction('Principal', 'Rejected')}
                    disabled={isProcessingStage}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 disabled:opacity-60 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Reject marksheet and return to HOD"
                  >
                    <X className="w-3.5 h-3.5 text-rose-600" />
                    <span>Return to HOD</span>
                  </button>
                  <button
                    onClick={() => handleStageApprovalAction('Principal', 'Approved')}
                    disabled={isProcessingStage || students.length === 0}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                    title="Admin verifies and forwards marksheet to Super Admin"
                  >
                    {isProcessingStage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Approve & Submit to Super Admin</span>
                  </button>
                </div>
              )}

              {/* 4. Super Admin: Final Approve & Publish OR Reject to Admin */}
              {canSuperAdminApprove && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStageApprovalAction('MD', 'Rejected')}
                    disabled={isProcessingStage}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 disabled:opacity-60 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Reject marksheet and return to Admin"
                  >
                    <X className="w-3.5 h-3.5 text-rose-600" />
                    <span>Return to Admin</span>
                  </button>
                  <button
                    onClick={() => handleStageApprovalAction('MD', 'Approved')}
                    disabled={isProcessingStage || students.length === 0}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                    title="Super Admin final approval and publication"
                  >
                    {isProcessingStage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>Final Approve & Publish</span>
                  </button>
                </div>
              )}

              {canUnlockMarks && (
                <button
                  type="button"
                  onClick={handleToggleLock}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-xl text-xs font-bold text-amber-700 shadow-xs transition-all cursor-pointer"
                  title="Unlock marks for editing and resubmission"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock for Editing</span>
                </button>
              )}

            </>
          )}
        </div>
      </div>

      {/* Centered Notifications Popup */}
      {(successMsg || errorMsg) && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none p-4 animate-in fade-in zoom-in-95">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold border pointer-events-auto ${errorMsg
            ? 'bg-rose-950/95 border-rose-700 text-rose-100 shadow-rose-900/40'
            : 'bg-slate-900/95 border-slate-700 text-white shadow-slate-900/40'
            }`}>
            {errorMsg ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span>{errorMsg || successMsg}</span>
          </div>
        </div>
      )}

      {/* Subject & Student Assignment Master Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
        {/* Section 1: Department, Year & Semester Filter for Subject & Students */}
        <div className="bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/20 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Subject Side Filters (Department • Year • Semester)
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Select criteria to filter subjects and populate the eligible student roster
                </p>
              </div>
            </div>

            {(filterDept !== 'All' || filterYear !== 'All' || filterSem !== 'All' || filterBatch !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setFilterDept('All');
                  setFilterYear('All');
                  setFilterSem('All');
                  setFilterBatch('All');
                  setSearchQuery('');
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <X className="w-3 h-3" /> Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Department Filter */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 tracking-wider mb-1">
                1. Department (Dep)
              </label>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
              >
                <option value="All">All Departments</option>
                {departmentsList.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 tracking-wider mb-1">
                2. Year (Yr)
              </label>
              <select
                value={filterYear}
                onChange={(e) => handleYearFilterChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
              >
                <option value="All">All Years</option>
                {yearsList.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Semester Filter */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 tracking-wider mb-1">
                3. Semester (Sem)
              </label>
              <select
                value={filterSem}
                onChange={(e) => setFilterSem(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
              >
                <option value="All">All Semesters</option>
                {semestersList.map(sem => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>

            {/* Batch Filter */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 tracking-wider mb-1">
                4. Batch
              </label>
              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
              >
                <option value="All">All Batches</option>
                {batchesList.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Subject Selector Bar (Filtered by Dept / Yr / Sem) */}
        <div className="pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <BookMarked className="w-4 h-4 text-blue-600" />
              <span>Select Subject to Assign & Enter Marks</span>
              {loading && (
                <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1 ml-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                {showCustomInput ? "Switch to Subject Dropdown" : "+ Enter Custom Subject Code"}
              </button>
            </div>
          </div>

          {!showCustomInput ? (
            <div className="relative">
              <select
                value={subjectCode}
                onChange={(e) => {
                  if (e.target.value) handleLoadSubject(e.target.value);
                }}
                className="w-full bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer appearance-none pr-10 shadow-xs"
              >
                <option value="" disabled>-- Select Subject Code --</option>
                {dropdownSubjects.map((sub) => (
                  <option key={sub.code} value={sub.code}>
                    {sub.code} — {sub.name && sub.name !== 'Course' ? sub.name : sub.code}{sub.dept ? ` (${sub.dept})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                list="availableStaffSubjectsDatalist"
                placeholder="Enter subject code, e.g. BCS101..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLoadSubject(); }}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 uppercase shadow-xs"
              />
              <datalist id="availableStaffSubjectsDatalist">
                {staffSubjects.map(sub => (
                  <option key={sub.code} value={sub.code}>
                    {sub.code} — {sub.name}
                  </option>
                ))}
              </datalist>
              <button
                type="button"
                onClick={() => handleLoadSubject()}
                disabled={!searchInput.trim() || loading}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm shadow-blue-500/20 shrink-0"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Load Subject</span>
              </button>
            </div>
          )}

          {/* Quick Select Subject Pills */}
          {dropdownSubjects.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 mr-1">
                Quick Select:
              </span>
              {dropdownSubjects.slice(0, 8).map((sub) => {
                const isSelected = subjectCode === sub.code;
                return (
                  <button
                    key={sub.code}
                    type="button"
                    onClick={() => {
                      setShowCustomInput(false);
                      handleLoadSubject(sub.code);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${isSelected
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20 scale-[1.02]"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                      }`}
                  >
                    <span>{sub.code}</span>
                    {sub.name && sub.name !== sub.code && (
                      <span className="text-[10px] font-medium opacity-80">• {sub.name}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>




        {/* Section 5: Assessment Tabs with Live Max & Pass Marks Display */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Assessment View
            </label>
            {!isLocked && (
              <button
                onClick={openConfigModal}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" /> Set Max & Pass Criteria
              </button>
            )}
          </div>
          <div className="flex overflow-x-auto gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70">
            {ASSESSMENT_COMPONENTS.map((comp) => {
              const isSelected = componentId === comp.id;
              return (
                <button
                  key={comp.id}
                  onClick={() => setComponentId(comp.id)}
                  className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap flex flex-col items-center justify-center gap-0.5 cursor-pointer ${isSelected ? "bg-white text-blue-600 shadow-xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"}`}
                >
                  <span>{comp.shortLabel}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${isSelected ? "bg-blue-50 text-blue-700" : "bg-slate-200/60 text-slate-500"}`}>
                    {comp.id === "all" ? "College Register" : `Max: ${maxMarksConfig[comp.id] ?? comp.defaultMax} | Pass: ${passMarksConfig[comp.id] ?? comp.defaultPass}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area: Subject prompt / Loading / Role Restricted Guard / Marksheet Table */}
      {!subjectCode ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-sm font-semibold">Select a subject from the dropdown above to load or create a marksheet.</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /><span className="text-sm font-medium">Loading register sheet...</span>
        </div>
      ) : !canViewMarks ? (
        /* Role-Based Visibility Guard: Hide marks until preceding stage submits */
        <div className={`rounded-3xl border p-8 sm:p-12 text-center shadow-xs ${restrictedNotice.theme}`}>
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-slate-700" />
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2.5 ${restrictedNotice.badgeTheme}`}>
            {restrictedNotice.badge}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">{restrictedNotice.title}</h3>
          <p className="text-xs sm:text-sm font-medium text-slate-600 max-w-xl mx-auto mb-5 leading-relaxed">{restrictedNotice.desc}</p>
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Workflow Stage: <b className="text-slate-900">{restrictedNotice.stage}</b></span>
            <span>•</span>
            <span>Approval Status: <b className="text-slate-900">{approvalStatus || 'Draft'}</b></span>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total Students", value: stats.total, sub: `${stats.absent} Absent`, color: "text-slate-900" },
              { label: "Class Average", value: stats.average, sub: `/ ${currentMax}`, color: "text-blue-600" },
              { label: "Pass %", value: `${stats.passPct}%`, sub: `${stats.passCount} passed`, color: stats.passPct >= 75 ? "text-emerald-600" : "text-amber-600" },
              { label: "Highest", value: stats.highest, sub: `/ ${currentMax}`, color: "text-emerald-600" },
              { label: "Lowest", value: stats.lowest, sub: `/ ${currentMax}`, color: "text-rose-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">{s.label}</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-xl font-extrabold ${s.color}`}>{s.value}</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{s.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Marksheet Register Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
            {/* College Header Banner matching Physical Register */}
            <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    VIVEKANANDA COLLEGE OF ARTS AND SCIENCE • VELLALANKULAM - 627 856
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base mt-0.5">
                    {subjectCode}{subjectName ? ` - ${subjectName}` : ""} • {activeComp.label}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span>Staff: <b className="text-slate-800 font-extrabold">{staffName || "P. KALARANI"}</b></span>
                    <span>•</span>
                    <span>Format: <b>INTERNAL (Internal 1, Internal 2) | MODEL | SEMESTER | SEMINAR | PROJECT | SNAP TEST (1-4) | ASSIGNMENT (1-4)</b></span>
                    <span>•</span>
                    <span>Enter <b>AB</b> for Absent, <b>-</b> for Exempt</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isLocked && (
                    <button onClick={() => setShowAddStudent(true)} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700">
                      <Plus className="w-3.5 h-3.5" /> Add Student
                    </button>
                  )}
                  {!isLocked && (
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-[0.99] cursor-pointer">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      {saving ? "Saving..." : "Save Register"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* TABLE CONTAINER */}
            <div className="overflow-x-auto">
              {componentId === "all" ? (
                /* OFFICIAL COLLEGE REGISTER SHEET FULL GRID */
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-black uppercase text-[11px] border-b border-slate-300">
                      <th rowSpan={2} className="px-3 py-2 text-center border-r border-slate-300 w-12 bg-slate-200/80">S.NO</th>
                      <th rowSpan={2} className="px-4 py-2 text-left border-r border-slate-300 min-w-[190px] bg-slate-200/80">STUDENTS NAME</th>
                      <th colSpan={2} className="px-2 py-1.5 text-center border-r border-slate-300 bg-indigo-100/80 text-indigo-950 font-black tracking-wider">
                        INTERNAL
                      </th>
                      <th rowSpan={2} className="px-2 py-2 text-center border-r border-slate-300 bg-purple-100/80 text-purple-950 font-black min-w-[65px]">
                        MODEL
                      </th>
                      <th rowSpan={2} className="px-2 py-2 text-center border-r border-slate-300 bg-rose-100/80 text-rose-950 font-black min-w-[65px]">
                        SEMESTER
                      </th>
                      <th rowSpan={2} className="px-2 py-2 text-center border-r border-slate-300 bg-teal-100/80 text-teal-950 font-black min-w-[65px]">
                        SEMINAR
                      </th>
                      <th rowSpan={2} className="px-2 py-2 text-center border-r border-slate-300 bg-emerald-100/80 text-emerald-950 font-black min-w-[65px]">
                        PROJECT
                      </th>
                      <th colSpan={4} className="px-2 py-1.5 text-center border-r border-slate-300 bg-sky-100/80 text-sky-950 font-black tracking-wider">
                        SNAP TEST
                      </th>
                      <th colSpan={4} className="px-2 py-1.5 text-center border-r border-slate-300 bg-amber-100/80 text-amber-950 font-black tracking-wider">
                        ASSIGNMENT
                      </th>
                      <th rowSpan={2} className="px-3 py-2 text-center bg-blue-100/80 text-blue-950 font-black min-w-[85px]">
                        FINAL CIA
                      </th>
                      <th rowSpan={2} className="px-3 py-2 text-center bg-emerald-100/80 text-emerald-950 font-black min-w-[80px]">
                        GRADE
                      </th>
                    </tr>
                    <tr className="bg-slate-50 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-300">
                      <th className="px-2 py-1.5 text-center border-r border-slate-300 bg-indigo-50 text-indigo-900">Internal 1</th>
                      <th className="px-2 py-1.5 text-center border-r border-slate-300 bg-indigo-50 text-indigo-900">Internal 2</th>
                      <th className="px-2 py-1.5 text-center border-r border-slate-300 bg-sky-50 text-sky-900">ST 1</th>
                      <th className="px-2 py-1.5 text-center border-r border-slate-300 bg-sky-50 text-sky-900">ST 2</th>
                      <th className="px-2 py-1.5 text-center border-r border-slate-300 bg-sky-50 text-sky-900">ST 3</th>
                      <th className="px-2 py-1.5 text-center border-r border-slate-300 bg-sky-50 text-sky-900">ST 4</th>
                      <th className="px-2 py-1.5 text-center border-r border-slate-300 bg-amber-50 text-amber-900">1</th>
                      <th className="px-2 py-1.5 text-center border-r border-slate-300 bg-amber-50 text-amber-900">2</th>
                      <th className="px-2 py-1.5 text-center border-r border-slate-300 bg-amber-50 text-amber-900">3</th>
                      <th className="px-2 py-1.5 text-center border-r border-slate-300 bg-amber-50 text-amber-900">4</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredStudents.map((s, idx) => {
                      const it1Val = s.it1 !== null && s.it1 !== undefined ? s.it1 : s.cia1;
                      const it2Val = s.it2 !== null && s.it2 !== undefined ? s.it2 : s.cia2;
                      const overallGrade = calculateStudentGrade(s, maxMarksConfig);
                      const gradeStyle = overallGrade === "A+" || overallGrade === "A" || overallGrade === "B+" || overallGrade === "B"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : overallGrade === "C" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-rose-50 text-rose-700 border border-rose-200";
                      return (
                        <tr key={s.rollNo} className="hover:bg-blue-50/40 transition-colors group">
                          <td className="px-1.5 py-2 text-center font-bold text-slate-500 border-r border-slate-200">
                            <div className="flex items-center justify-center gap-1">
                              <span>{idx + 1}</span>
                              {!isLocked && isStaffOnly && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStudentFromMarksheet(s.rollNo)}
                                  title={`Remove ${s.rollNo} from this subject`}
                                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600 transition-opacity p-0.5 cursor-pointer"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-left border-r border-slate-200">
                            <div className="font-extrabold text-slate-900">{s.name}</div>
                            <div className="text-[10px] font-mono font-semibold text-slate-400">{s.rollNo}</div>
                          </td>
                          {/* INTERNAL IT1 - IT2 */}
                          <td className="p-1 text-center border-r border-slate-200 bg-indigo-50/20">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={it1Val !== null && it1Val !== undefined ? it1Val : ""}
                              onChange={(e) => handleCellChange(s.rollNo, 'it1', e.target.value)}
                              className={`w-12 text-center py-1 px-1 rounded-md text-xs font-bold border transition-all ${it1Val === "AB" || it1Val === "A"
                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                : "border-slate-200 bg-white text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                } disabled:bg-slate-100 disabled:cursor-not-allowed`}
                              placeholder="-"
                            />
                          </td>
                          <td className="p-1 text-center border-r border-slate-200 bg-indigo-50/20">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={it2Val !== null && it2Val !== undefined ? it2Val : ""}
                              onChange={(e) => handleCellChange(s.rollNo, 'it2', e.target.value)}
                              className={`w-12 text-center py-1 px-1 rounded-md text-xs font-bold border transition-all ${it2Val === "AB" || it2Val === "A"
                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                : "border-slate-200 bg-white text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                } disabled:bg-slate-100 disabled:cursor-not-allowed`}
                              placeholder="-"
                            />
                          </td>
                          {/* MODEL */}
                          <td className="p-1 text-center border-r border-slate-200 bg-purple-50/20">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={s.model !== null && s.model !== undefined ? s.model : ""}
                              onChange={(e) => handleCellChange(s.rollNo, 'model', e.target.value)}
                              className="w-12 text-center py-1 px-1 rounded-md text-xs font-bold border border-slate-200 bg-white text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                              placeholder="-"
                            />
                          </td>
                          {/* SEMESTER */}
                          <td className="p-1 text-center border-r border-slate-200 bg-rose-50/20">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={s.semester !== null && s.semester !== undefined ? s.semester : ""}
                              onChange={(e) => handleCellChange(s.rollNo, 'semester', e.target.value)}
                              className="w-12 text-center py-1 px-1 rounded-md text-xs font-bold border border-slate-200 bg-white text-slate-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                              placeholder="-"
                            />
                          </td>
                          {/* SEMINAR */}
                          <td className="p-1 text-center border-r border-slate-200 bg-teal-50/20">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={s.seminar !== null && s.seminar !== undefined ? s.seminar : ""}
                              onChange={(e) => handleCellChange(s.rollNo, 'seminar', e.target.value)}
                              className="w-12 text-center py-1 px-1 rounded-md text-xs font-bold border border-slate-200 bg-white text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                              placeholder="-"
                            />
                          </td>
                          {/* PROJECT */}
                          <td className="p-1 text-center border-r border-slate-200 bg-emerald-50/20">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={s.project !== null && s.project !== undefined ? s.project : ""}
                              onChange={(e) => handleCellChange(s.rollNo, 'project', e.target.value)}
                              className="w-12 text-center py-1 px-1 rounded-md text-xs font-bold border border-slate-200 bg-white text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                              placeholder="-"
                            />
                          </td>
                          {/* SNAP TESTS ST1 - ST4 */}
                          {['st1', 'st2', 'st3', 'st4'].map((f) => (
                            <td key={f} className="p-1 text-center border-r border-slate-200 bg-sky-50/20">
                              <input
                                type="text"
                                disabled={isLocked}
                                value={s[f] !== null && s[f] !== undefined ? s[f] : ""}
                                onChange={(e) => handleCellChange(s.rollNo, f, e.target.value)}
                                className={`w-12 text-center py-1 px-1 rounded-md text-xs font-bold border transition-all ${s[f] === "AB" || s[f] === "A"
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : "border-slate-200 bg-white text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                  } disabled:bg-slate-100 disabled:cursor-not-allowed`}
                                placeholder="-"
                              />
                            </td>
                          ))}
                          {/* ASSIGNMENT 1 - 4 */}
                          {['assignment1', 'assignment2', 'assignment3', 'assignment4'].map((f) => (
                            <td key={f} className="p-1 text-center border-r border-slate-200 bg-amber-50/20">
                              <input
                                type="text"
                                disabled={isLocked}
                                value={s[f] !== null && s[f] !== undefined ? s[f] : ""}
                                onChange={(e) => handleCellChange(s.rollNo, f, e.target.value)}
                                className="w-10 text-center py-1 px-0.5 rounded-md text-xs font-bold border border-slate-200 bg-white text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                placeholder="-"
                              />
                            </td>
                          ))}
                          {/* FINAL CIA */}
                          <td className="px-2 py-2 text-center bg-blue-50/30 font-black text-xs text-blue-900">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 font-extrabold shadow-2xs">
                              {s.consolidated ?? "-"}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center bg-emerald-50/30 font-black text-xs text-emerald-900">
                            <span className={`px-2.5 py-1 rounded-lg font-extrabold ${gradeStyle}`}>
                              {overallGrade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={18} className="py-12 text-center text-slate-500 text-xs">
                          <p className="font-bold text-slate-800 text-sm">No students in marksheet for {subjectCode}</p>
                          <p className="text-slate-400 mt-1">Use "Add Student" above to populate the student list.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : componentId === "st" ? (
                /* SNAP TESTS FOCUSED VIEW */
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="text-left px-4 py-3 w-10">#</th>
                      <th className="text-left px-4 py-3">Roll No.</th>
                      <th className="text-left px-4 py-3">Student Name</th>
                      <th className="text-center px-3 py-3">ST 1 (Max {maxMarksConfig.st1})</th>
                      <th className="text-center px-3 py-3">ST 2 (Max {maxMarksConfig.st2})</th>
                      <th className="text-center px-3 py-3">ST 3 (Max {maxMarksConfig.st3})</th>
                      <th className="text-center px-3 py-3">ST 4 (Max {maxMarksConfig.st4})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s, idx) => (
                      <tr key={s.rollNo} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-700">{s.rollNo}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                        {['st1', 'st2', 'st3', 'st4'].map(f => (
                          <td key={f} className="px-3 py-3 text-center">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={s[f] !== null && s[f] !== undefined ? s[f] : ""}
                              onChange={(e) => handleCellChange(s.rollNo, f, e.target.value)}
                              className="w-16 text-center py-1 px-2 rounded-xl text-xs font-extrabold border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500"
                              placeholder={`0-${maxMarksConfig[f]}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : componentId === "it" ? (
                /* INTERNAL TESTS FOCUSED VIEW */
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="text-left px-4 py-3 w-10">#</th>
                      <th className="text-left px-4 py-3">Roll No.</th>
                      <th className="text-left px-4 py-3">Student Name</th>
                      <th className="text-center px-3 py-3">IT 1 / CIA 1 (Max {maxMarksConfig.it1})</th>
                      <th className="text-center px-3 py-3">IT 2 / CIA 2 (Max {maxMarksConfig.it2})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s, idx) => {
                      const it1Val = s.it1 !== null && s.it1 !== undefined ? s.it1 : s.cia1;
                      const it2Val = s.it2 !== null && s.it2 !== undefined ? s.it2 : s.cia2;
                      return (
                        <tr key={s.rollNo} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-bold text-slate-700">{s.rollNo}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={it1Val !== null && it1Val !== undefined ? it1Val : ""}
                              onChange={(e) => handleCellChange(s.rollNo, 'it1', e.target.value)}
                              className="w-16 text-center py-1 px-2 rounded-xl text-xs font-extrabold border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500"
                              placeholder={`0-${maxMarksConfig.it1}`}
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={it2Val !== null && it2Val !== undefined ? it2Val : ""}
                              onChange={(e) => handleCellChange(s.rollNo, 'it2', e.target.value)}
                              className="w-16 text-center py-1 px-2 rounded-xl text-xs font-extrabold border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500"
                              placeholder={`0-${maxMarksConfig.it2}`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : componentId === "assignment" ? (
                /* ASSIGNMENTS FOCUSED VIEW */
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="text-left px-4 py-3 w-10">#</th>
                      <th className="text-left px-4 py-3">Roll No.</th>
                      <th className="text-left px-4 py-3">Student Name</th>
                      <th className="text-center px-3 py-3">Assignment 1 (Max {maxMarksConfig.assignment1})</th>
                      <th className="text-center px-3 py-3">Assignment 2 (Max {maxMarksConfig.assignment2})</th>
                      <th className="text-center px-3 py-3">Assignment 3 (Max {maxMarksConfig.assignment3})</th>
                      <th className="text-center px-3 py-3">Assignment 4 (Max {maxMarksConfig.assignment4})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s, idx) => (
                      <tr key={s.rollNo} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-700">{s.rollNo}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                        {['assignment1', 'assignment2', 'assignment3', 'assignment4'].map(f => (
                          <td key={f} className="px-3 py-3 text-center">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={s[f] !== null && s[f] !== undefined ? s[f] : ""}
                              onChange={(e) => handleCellChange(s.rollNo, f, e.target.value)}
                              className="w-16 text-center py-1 px-2 rounded-xl text-xs font-extrabold border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500"
                              placeholder={`0-${maxMarksConfig[f]}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : componentId === "consolidated" ? (
                /* CONSOLIDATED BREAKDOWN VIEW */
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="text-left px-4 py-3 w-10">#</th>
                      <th className="text-left px-4 py-3">Roll No.</th>
                      <th className="text-left px-4 py-3">Student Name</th>
                      <th className="text-center px-3 py-3">IT-1</th>
                      <th className="text-center px-3 py-3">IT-2</th>
                      <th className="text-center px-3 py-3">Model</th>
                      <th className="text-center px-3 py-3">Assignments</th>
                      <th className="text-center px-4 py-3 bg-blue-50/60 text-blue-800">Final CIA ({maxMarksConfig.consolidated})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredStudents.map((s, idx) => {
                      const consScore = s.consolidated;
                      const hasCons = consScore !== null && consScore !== undefined;
                      const isConsPassed = hasCons && consScore >= passMarksConfig.consolidated;
                      const it1Val = s.it1 !== null && s.it1 !== undefined ? s.it1 : (s.cia1 ?? "-");
                      const it2Val = s.it2 !== null && s.it2 !== undefined ? s.it2 : (s.cia2 ?? "-");
                      const asgVal = s.assignment1 !== null && s.assignment1 !== undefined
                        ? (Number(s.assignment1) || 0) + (Number(s.assignment2) || 0) + (Number(s.assignment3) || 0) + (Number(s.assignment4) || 0)
                        : (s.assignment ?? "-");

                      return (
                        <tr key={s.rollNo} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-bold text-slate-700">{s.rollNo}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                          <td className="px-3 py-3 text-center text-slate-700">{it1Val}</td>
                          <td className="px-3 py-3 text-center text-slate-700">{it2Val}</td>
                          <td className="px-3 py-3 text-center text-slate-700">{s.model ?? "-"}</td>
                          <td className="px-3 py-3 text-center text-slate-700">{asgVal}</td>
                          <td className="px-4 py-3 text-center bg-blue-50/30">
                            <span className={`font-extrabold text-sm px-2.5 py-1 rounded-lg ${!hasCons ? 'text-slate-400' : isConsPassed ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                              {s.consolidated ?? "-"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                /* SINGLE COMPONENT EDIT VIEW (MODEL / PROJECT) */
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="text-left px-5 py-3 w-12">#</th>
                      <th className="text-left px-5 py-3">Roll No.</th>
                      <th className="text-left px-5 py-3">Student Name</th>
                      <th className="text-center px-5 py-3 w-48">
                        Marks (Max: {currentMax} | Pass: {currentPass})
                      </th>
                      <th className="text-center px-5 py-3">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredStudents.map((s, idx) => {
                      const current = s[componentId];
                      const isAbsent = current === "A" || current === "AB";
                      const isNum = typeof current === "number";
                      const isPassed = isNum && current >= currentPass;
                      const isGradeField = componentId === "grade";
                      return (
                        <tr key={s.rollNo} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3 text-slate-400">{idx + 1}</td>
                          <td className="px-5 py-3 font-bold text-slate-700">{s.rollNo}</td>
                          <td className="px-5 py-3 font-semibold text-slate-900">{s.name}</td>
                          <td className="px-5 py-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <input
                                type="text"
                                disabled={isLocked}
                                value={current !== undefined && current !== null ? current : ""}
                                onChange={(e) => handleCellChange(s.rollNo, componentId, e.target.value)}
                                className={`w-16 text-center py-1 px-2 rounded-xl text-xs font-extrabold border transition-all ${isLocked ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed" : isAbsent ? "bg-amber-50 text-amber-700 border-amber-300" : isGradeField ? "bg-slate-50 text-slate-900 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" : isNum && !isPassed ? "bg-rose-50 text-rose-700 border-rose-300" : "bg-slate-50 text-slate-900 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"}`}
                                placeholder={isGradeField ? "A/B" : `0-${currentMax}`}
                              />
                              {!isLocked && !isGradeField && (
                                <button
                                  onClick={() => handleCellChange(s.rollNo, componentId, isAbsent ? 0 : "AB")}
                                  className={`p-1 rounded-lg text-[10px] font-bold border transition-all ${isAbsent ? "bg-amber-100 text-amber-800 border-amber-300" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-transparent cursor-pointer"}`}
                                  title={isAbsent ? "Unmark Absent" : "Mark Absent"}
                                >ABS</button>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center">
                            {isAbsent ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">ABSENT</span>
                            ) : isGradeField ? (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${current && ["A+", "A", "B+", "B", "C", "D", "F"].includes(String(current).toUpperCase()) ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "text-slate-300"}`}>
                                {current ? String(current).toUpperCase() : "-"}
                              </span>
                            ) : isNum ? (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${isPassed ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                                {isPassed ? "PASS" : "FAIL"}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-[10px]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bottom Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>Showing {filteredStudents.length} of {students.length} students enrolled</span>
              {!isLocked && (
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-[0.99] cursor-pointer">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saving ? "Saving..." : "Save All Changes"}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Configure Max & Pass Marks Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => !savingCriteria && setShowConfigModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xl z-10 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Set Max & Pass Marks Criteria</h3>
                  <p className="text-[11px] text-slate-500">Subject: {subjectCode} ({subjectName || "Course"})</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                disabled={savingCriteria}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyCriteria} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                Configure both the <b>Maximum Marks</b> and <b>Passing Marks</b> for each assessment component. Student results will recalculate automatically across the register sheet.
              </p>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {[
                  { id: "it1", name: "Internal 1", defaultM: 25, defaultP: 10 },
                  { id: "it2", name: "Internal 2", defaultM: 25, defaultP: 10 },
                  { id: "model", name: "Model", defaultM: 75, defaultP: 30 },
                  { id: "semester", name: "Semester", defaultM: 100, defaultP: 40 },
                  { id: "seminar", name: "Seminar", defaultM: 10, defaultP: 4 },
                  { id: "project", name: "Project", defaultM: 20, defaultP: 8 },
                  { id: "st1", name: "Snap Test 1", defaultM: 20, defaultP: 8 },
                  { id: "st2", name: "Snap Test 2", defaultM: 20, defaultP: 8 },
                  { id: "st3", name: "Snap Test 3", defaultM: 20, defaultP: 8 },
                  { id: "st4", name: "Snap Test 4", defaultM: 20, defaultP: 8 },
                  { id: "assignment1", name: "Assignment 1", defaultM: 5, defaultP: 2 },
                  { id: "assignment2", name: "Assignment 2", defaultM: 5, defaultP: 2 },
                  { id: "assignment3", name: "Assignment 3", defaultM: 5, defaultP: 2 },
                  { id: "assignment4", name: "Assignment 4", defaultM: 5, defaultP: 2 },
                  { id: "grade", name: "Grade", defaultM: 100, defaultP: "B" },
                  { id: "consolidated", name: "Consolidated Final CIA", defaultM: 25, defaultP: 10 },
                ].map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{item.name}</span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Default: Max {item.defaultM} | Pass {item.defaultP}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Maximum Marks</label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          required
                          value={tempMaxConfig[item.id] ?? item.defaultM}
                          onChange={(e) => setTempMaxConfig({ ...tempMaxConfig, [item.id]: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          placeholder={String(item.defaultM)}
                          readOnly={item.id === "grade" && false}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">{item.id === "grade" ? "Pass Grade" : "Minimum Pass Marks"}</label>
                        {item.id === "grade" ? (
                          <select
                            value={String(tempPassConfig[item.id] ?? item.defaultP).toUpperCase()}
                            onChange={(e) => setTempPassConfig({ ...tempPassConfig, [item.id]: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="A+">A+</option>
                            <option value="A">A</option>
                            <option value="B+">B+</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="F">F</option>
                          </select>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            max={tempMaxConfig[item.id] || item.defaultM}
                            required
                            value={tempPassConfig[item.id] ?? item.defaultP}
                            onChange={(e) => setTempPassConfig({ ...tempPassConfig, [item.id]: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder={String(item.defaultP)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={savingCriteria}
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCriteria}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl text-xs font-bold text-white shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {savingCriteria && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {savingCriteria ? "Applying..." : "Apply & Save Criteria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowAddStudent(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-slate-900 text-base">Add Student to Register</h3>
              <button onClick={() => setShowAddStudent(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number *</label>
                <input type="text" required placeholder="e.g., 22CS001" value={newRollNo} onChange={(e) => setNewRollNo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student Name *</label>
                <input type="text" required placeholder="Full name, e.g., ARUNA DEVI J" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddStudent(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white shadow-md shadow-blue-500/20 cursor-pointer">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit to MD Centered Confirmation Modal */}
      {showFreezeModal && (
        <ModalPortal isOpen={showFreezeModal} onClose={() => !isFreezing && setShowFreezeModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-7 max-w-md w-full animate-in fade-in zoom-in-95 text-left my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 shadow-xs">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Submit to MD</h3>
                  <p className="text-xs text-slate-500 font-medium">Finalize internal assessment marks</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isFreezing && setShowFreezeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-5 space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Course Information</div>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {subjectCode} {subjectName ? `— ${subjectName}` : ""}
                </div>
                <div className="text-xs text-slate-600 font-medium mt-1">
                  Enrolled Students: <span className="font-bold text-slate-800">{students.length}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 font-medium leading-relaxed">
                <span className="font-bold">Notice:</span> Submitting will automatically save all internal marks and forward them to the <b>Managing Director (MD)</b>. After submission, marks editing will be locked.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isFreezing}
                onClick={() => setShowFreezeModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isFreezing}
                onClick={executeFreezeAndSubmit}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isFreezing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting to MD...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Confirm & Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Bulk Upload Marks Modal (Exact match to Super Admin format) */}
      {showBulkUploadMarksModal && (
        <ExcelMarksUploadModal
          isOpen={showBulkUploadMarksModal}
          onClose={() => setShowBulkUploadMarksModal(false)}
          staffUser={staffUser}
          currentSubjectCode={subjectCode}
          currentSubjectName={subjectName}
          currentDepartment={staffUser?.department || filterDept || 'Computer Science'}
          currentSemester={filterSem !== 'All' ? Number(filterSem) : 1}
          enrolledStudents={students}
          onSuccess={() => {
            fetchStudents(subjectCode);
            fetchStaffSubjects();
          }}
        />
      )}

      {/* Download Filtered Marks Modal (Subject-wise, Department-wise, Year-wise, Batch-wise, Sem-wise) */}
      {showDownloadModal && (
        <ModalPortal isOpen={showDownloadModal} onClose={() => !isExporting && setShowDownloadModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-7 max-w-lg w-full animate-in fade-in zoom-in-95 text-left my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/70 flex items-center justify-center text-indigo-600 shadow-xs">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Download Internal Marks</h3>
                  <p className="text-xs text-slate-500 font-medium">Export official marks registers in Excel (.xlsx) or CSV format</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isExporting && setShowDownloadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Mode Selector */}
            <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-xl my-4 text-xs font-bold">
              {[
                { id: 'department', label: 'Dept' },
                { id: 'year', label: 'Year' },
                { id: 'batch', label: 'Batch' },
                { id: 'semester', label: 'Sem' },
                { id: 'subject', label: 'Subject' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDownloadFilterType(tab.id)}
                  className={`py-2 px-1.5 rounded-lg transition-all text-center cursor-pointer text-[11px] ${downloadFilterType === tab.id
                    ? 'bg-white text-indigo-700 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content for each tab */}
            <div className="space-y-4 my-2">
              {downloadFilterType === 'subject' && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">Active Subject Export</div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {subjectCode ? `${subjectCode} — ${subjectName || 'Course Register'}` : 'No subject loaded currently'}
                  </div>
                  <p className="text-xs text-slate-500">
                    Includes all 16 register columns: Snap Tests (1-4), Internal Tests (1-2), Model Exam, Seminar Presentation, Project Work, Assignments (1-4), and Final Scaled CIA marks.
                  </p>
                  {!subjectCode && (
                    <div className="text-xs text-rose-600 font-semibold mt-1">
                      ⚠️ Please select or load a subject first, or switch to Department/Batch/Year-wise download.
                    </div>
                  )}
                </div>
              )}

              {downloadFilterType === 'department' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Select Department
                    </label>
                    <select
                      value={downloadDept}
                      onChange={(e) => setDownloadDept(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {['Computer Science', 'Computer Applications (BCA)', 'Commerce', 'Mathematics', 'English', 'Business Administration (BBA)', 'Physics', 'Chemistry'].map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-500">
                    Exports marksheets for <b>all subjects and classes</b> registered under {downloadDept}.
                  </div>
                </div>
              )}

              {downloadFilterType === 'year' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Academic Year
                      </label>
                      <select
                        value={downloadYear}
                        onChange={(e) => setDownloadYear(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="I Year">I Year (First Year)</option>
                        <option value="II Year">II Year (Second Year)</option>
                        <option value="III Year">III Year (Third Year)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Semester
                      </label>
                      <select
                        value={downloadSemester}
                        onChange={(e) => setDownloadSemester(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {[1, 2, 3, 4, 5, 6].map(s => (
                          <option key={s} value={String(s)}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-500">
                    Exports marks records for all students matching <b>{downloadYear} • Semester {downloadSemester}</b> across all subjects.
                  </div>
                </div>
              )}

              {downloadFilterType === 'batch' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Choose Student Batch
                    </label>
                    <select
                      value={downloadBatch || batchesList[0] || ''}
                      onChange={(e) => setDownloadBatch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {batchesList.map(b => (
                        <option key={b} value={b}>Batch {b}</option>
                      ))}
                      {downloadBatch && !batchesList.includes(downloadBatch) && (
                        <option value={downloadBatch}>Batch {downloadBatch}</option>
                      )}
                    </select>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-500">
                    Exports marks for all students admitted in <b>Batch {downloadBatch}</b> across all academic records.
                  </div>
                </div>
              )}

              {downloadFilterType === 'semester' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Choose Semester
                    </label>
                    <select
                      value={downloadSemester}
                      onChange={(e) => setDownloadSemester(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {[1, 2, 3, 4, 5, 6].map(s => (
                        <option key={s} value={String(s)}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-500">
                    Exports internal marks for all courses taught in <b>Semester {downloadSemester}</b>.
                  </div>
                </div>
              )}

              {/* File format */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">
                  File Format:
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="radio"
                      name="marksDownloadFormat"
                      value="excel"
                      checked={downloadFormat === 'excel'}
                      onChange={() => setDownloadFormat('excel')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Microsoft Excel (.xlsx)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="radio"
                      name="marksDownloadFormat"
                      value="csv"
                      checked={downloadFormat === 'csv'}
                      onChange={() => setDownloadFormat('csv')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Comma Separated (.csv)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setShowDownloadModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isExporting || (downloadFilterType === 'subject' && !subjectCode)}
                onClick={() => handleDownloadMarks(downloadFilterType)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing Download...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download {downloadFilterType === 'subject' ? 'Subject' : downloadFilterType === 'department' ? 'Dept' : downloadFilterType === 'batch' ? 'Batch' : downloadFilterType === 'semester' ? 'Sem' : 'Year'} {downloadFormat === 'excel' ? 'Excel' : 'CSV'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
