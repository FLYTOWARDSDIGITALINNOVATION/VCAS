import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { API_BASE, BACKEND_URL, getKnownDepartments } from '../../apiConfig';
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
      if (stored && !['CS2001', 'CS2005', 'CS2003', 'CS2006', 'SF76'].includes(stored.toUpperCase())) {
        return stored;
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
  const [downloadBatch, setDownloadBatch] = useState('2022-2026');
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

  const isAdminUser = roleKey.includes('ADMIN') && !roleKey.includes('SUPERADMIN');
  const isSuperAdminUser = roleKey.includes('SUPERADMIN') ||
    roleKey.includes('SUPERADMINISTRATOR') ||
    roleKey.includes('MANAGINGDIRECTOR') ||
    roleKey.includes('MD') ||
    designationKey.includes('MANAGINGDIRECTOR') ||
    designationKey.includes('MD');

  const isHod = looksLikeHod(staffUser?.role) ||
    looksLikeHod(staffUser?.designation) ||
    staffUser?.isHod === true;
  const isPrincipal = roleKey.includes('PRINCIPAL') ||
    designationKey.includes('PRINCIPAL');
  const isMD = isSuperAdminUser;

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
    if (componentId === "all") return 100;
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
    const legacyExclusions = ['CS2001', 'CS2005', 'CS2003', 'CS2006', 'SF76', 'CS001', 'CSDA1', 'CSS004'];
    const list = staffSubjects.filter(s => {
      const code = (s.code || '').toUpperCase().trim();
      // If this subject is in official subjects, keep it; else if it's legacy exclusion, drop it
      return !legacyExclusions.includes(code);
    });
    if (subjectCode && !list.some((s) => s.code === subjectCode) && !['CS2001', 'CS2005', 'CS2003', 'CS2006', 'SF76'].includes(subjectCode.toUpperCase())) {
      list.unshift({ code: subjectCode, name: (subjectName && subjectName !== 'Course') ? subjectName : subjectCode });
    }
    return list;
  }, [staffSubjects, subjectCode, subjectName]);

  // Filter dropdown lists
  const departmentsList = useMemo(() => {
    const set = new Set();

    adminDepartments.forEach(d => {
      const name = typeof d === 'string' ? d : d?.name;
      if (name && String(name).trim()) set.add(String(name).trim());
    });

    if (staffUser?.department && String(staffUser.department).trim()) {
      set.add(String(staffUser.department).trim());
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [adminDepartments, staffUser?.department]);

  const yearsList = useMemo(() => {
    const set = new Set(['I Year', 'II Year', 'III Year', 'IV Year']);
    allRegisteredStudents.forEach(s => {
      if (s.year) set.add(s.year);
    });
    students.forEach(s => {
      if (s.year) set.add(s.year);
    });
    return Array.from(set);
  }, [allRegisteredStudents, students]);

  const batchesList = useMemo(() => {
    const set = new Set(['2025-2028', '2024-2027', '2023-2026', '2022-2026', '2021-2025']);
    allRegisteredStudents.forEach(s => {
      if (s.batch) set.add(s.batch);
      if (s.academicYear) set.add(s.academicYear);
    });
    students.forEach(s => {
      if (s.batch) set.add(s.batch);
    });
    return Array.from(set).sort().reverse();
  }, [allRegisteredStudents, students]);

  const semestersList = useMemo(() => {
    const set = new Set(['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6']);
    allRegisteredStudents.forEach(s => {
      const semNum = Number(String(s.sem || '').replace(/\D/g, '')) || (s.semester ? Number(s.semester) : 0);
      if (semNum >= 1 && semNum <= 6) set.add(`Semester ${semNum}`);
    });
    return Array.from(set).sort((a, b) => {
      const na = Number(a.replace(/\D/g, ''));
      const nb = Number(b.replace(/\D/g, ''));
      return na - nb;
    });
  }, [allRegisteredStudents]);

  // Merge each student with metadata from registered students collection
  const studentsWithMeta = useMemo(() => {
    const metaMap = new Map();
    allRegisteredStudents.forEach(st => {
      const key = (st.rollNo || st.regNo || st.studentId || '').toUpperCase().trim();
      if (key) metaMap.set(key, st);
    });

    return students.map(s => {
      const key = (s.rollNo || '').toUpperCase().trim();
      const meta = metaMap.get(key) || {};
      return {
        ...s,
        department: s.department || meta.department || meta.course || currentMarksheetMeta?.department || '',
        year: s.year || meta.year || currentMarksheetMeta?.year || '',
        batch: s.batch || meta.batch || meta.academicYear || currentMarksheetMeta?.academicYear || '',
        sem: s.sem || (s.semester ? `Semester ${s.semester}` : '') || meta.sem || (meta.semester ? `Semester ${meta.semester}` : '') || (currentMarksheetMeta?.semester ? `Semester ${currentMarksheetMeta.semester}` : '') || ''
      };
    });
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

      // Department filter
      if (filterDept && filterDept !== 'All') {
        const d = (s.department || '').toLowerCase().trim();
        const target = filterDept.toLowerCase().trim();
        if (d !== target && !d.includes(target) && !target.includes(d)) return false;
      }

      // Year filter
      if (filterYear && filterYear !== 'All') {
        const romanYearMap = { 'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', '1': '1', '2': '2', '3': '3', '4': '4' };
        const y = String(s.year || '').toLowerCase().trim();
        const target = filterYear.toLowerCase().trim();
        const normY = romanYearMap[y.replace(/year/g, '').replace(/[^a-z0-9]/g, '')] || y.replace(/\D/g, '') || y;
        const normT = romanYearMap[target.replace(/year/g, '').replace(/[^a-z0-9]/g, '')] || target.replace(/\D/g, '') || target;
        if (normY !== normT && !y.includes(target) && !target.includes(y)) return false;
      }

      // Batch filter
      if (filterBatch && filterBatch !== 'All') {
        const b = String(s.batch || '').toLowerCase().trim();
        const target = filterBatch.toLowerCase().trim();
        if (b !== target && !b.includes(target)) return false;
      }

      // Semester filter
      if (filterSem && filterSem !== 'All') {
        const sVal = String(s.sem || s.semester || '').toLowerCase().trim();
        const target = filterSem.toLowerCase().trim();
        const numS = sVal.replace(/[^0-9]/g, '');
        const numT = target.replace(/[^0-9]/g, '');
        if (numS && numT && numS === numT) {
          // match
        } else if (!sVal.includes(target) && !target.includes(sVal)) {
          return false;
        }
      }

      // Subject filter
      if (filterSubject && filterSubject !== 'All') {
        const subjectValue = String(s.subjectCode || s.subject || subjectCode || '').toLowerCase().trim();
        const target = filterSubject.toLowerCase().trim();
        if (!subjectValue || (subjectValue !== target && !subjectValue.includes(target) && !target.includes(subjectValue))) {
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
      const [staffClsData, allClassesData, subjectsData, asgtsData, marksData] = await Promise.all([
        fetch(`${API}/classes/staff/${effectiveStaffId}`).then(r => r.json()).catch(() => null),
        fetch(`${API}/classes`).then(r => r.json()).catch(() => null),
        fetch(`${API}/subjects`).then(r => r.json()).catch(() => null),
        fetch(`${API}/assignments/${effectiveStaffId}`).then(r => r.json()).catch(() => null),
        fetch(`${API}/internal-marks/${effectiveStaffId}`).then(r => r.json()).catch(() => null),
      ]);

      const subs = [];
      const seen = new Set();
      const allSubjects = subjectsData?.data || (Array.isArray(subjectsData) ? subjectsData : []);
      const officialSubjectCodes = new Set(allSubjects.map(s => (s.code || '').toUpperCase().trim()));
      const legacyExclusions = new Set(['CS2001', 'CS2005', 'CS2003', 'CS2006', 'SF76', 'CS001', 'CSDA1', 'CSS004']);
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
      const isHodUser = staffUser?.isHod === true || looksLikeHodUser(staffUser?.role) || looksLikeHodUser(staffUser?.designation);
      const isPrincipalOrAdmin = roleKey.includes('PRINCIPAL') || roleKey.includes('ADMIN') || designationKey.includes('PRINCIPAL') || designationKey.includes('ADMIN');

      const addSub = (code, name) => {
        const c = (code || '').trim().toUpperCase();
        if (!c || c.length < 3 || seen.has(c)) return;
        if (legacyExclusions.has(c) && !officialSubjectCodes.has(c)) return;
        seen.add(c);
        subs.push({ code: c, name: (name && name !== 'Course' && name !== c) ? name : c });
      };

      allSubjects
        .filter(s => {
          if (!s.code) return false;
          if (!effectiveStaffId && !staffUser?.name) return true;

          const facultyName = (s.faculty || '').trim().toLowerCase();
          const staffName = (staffUser?.name || '').trim().toLowerCase();
          const staffIdLower = String(effectiveStaffId || '').trim().toLowerCase();
          const subjectDept = (s.department || '').trim().toLowerCase();
          const userDept = (staffUser?.department || '').trim().toLowerCase();

          const matchFaculty = facultyName && (
            facultyName === staffIdLower ||
            facultyName === staffName ||
            facultyName.includes(staffName)
          );
          const matchDept = subjectDept && userDept && subjectDept === userDept;

          if (isHodUser || isPrincipalOrAdmin || !userDept) {
            return true;
          }

          return matchFaculty || matchDept || !s.faculty;
        })
        .forEach(s => addSub(s.code, s.name));

      const staffClasses = staffClsData?.classes || (Array.isArray(staffClsData?.data) ? staffClsData.data : []);
      staffClasses.forEach(c => addSub(c.code || c.classCode, c.name || c.className));

      const allClasses = allClassesData?.classes || (Array.isArray(allClassesData?.data) ? allClassesData.data : (Array.isArray(allClassesData) ? allClassesData : []));
      allClasses
        .filter(c => c.staffId && c.staffId.trim().toLowerCase() === String(effectiveStaffId || '').trim().toLowerCase())
        .forEach(c => addSub(c.code || c.classCode, c.name || c.className));

      if (asgtsData?.success && Array.isArray(asgtsData.data)) {
        asgtsData.data.forEach(a => addSub(a.subjectCode, a.subjectName || a.title));
      }

      if (marksData?.success && Array.isArray(marksData.data)) {
        marksData.data.forEach(m => addSub(m.subjectCode, m.subjectName));
      }

      setStaffSubjects(subs);

      if (subs.length > 0) {
        const stored = localStorage.getItem('vcas_internal_subject');
        const match = subs.find(s => s.code === stored || s.code === subjectCode);
        const target = match ? match.code : subs[0].code;
        const targetName = match ? match.name : subs[0].name;
        setSubjectCode(target);
        setSearchInput(target);
        setSubjectName(targetName);
        if (!subjectCode || subjectCode !== target) {
          fetchMarksheet(target);
        }
      }
    } catch (error) {
      console.error('Failed to refresh staff subjects:', error);
    }
  }, [effectiveStaffId, staffUser, subjectCode, fetchMarksheet]);

  // Load available staff subjects, all students, and departments on mount
  useEffect(() => {
    // Clear legacy dummy CS2001 from storage
    try {
      if (localStorage.getItem('vcas_internal_subject') === 'CS2001') {
        localStorage.removeItem('vcas_internal_subject');
      }
      if (sessionStorage.getItem('vcas_internal_subject') === 'CS2001') {
        sessionStorage.removeItem('vcas_internal_subject');
      }
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
        setIsLocked(true);
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

  const canSubmitToHod = Boolean(subjectCode) && !isHod && !isPrincipal && !isMD;
  const canSubmitToPrincipal = Boolean(subjectCode) && isHod && !isPrincipal && !isMD;
  const canUnlockMarks = Boolean(subjectCode) && isLocked && (canSubmitToHod || canSubmitToPrincipal);

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

              {canSubmitToHod && (
                <button
                  onClick={handleSubmitForApproval}
                  disabled={isSubmittingApproval || students.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  title="Submit marksheet to the HOD"
                >
                  {isSubmittingApproval ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Submit to HOD</span>
                </button>
              )}

              {canSubmitToPrincipal && (
                <button
                  onClick={() => handleStageApprovalAction('HOD', 'Approved')}
                  disabled={isProcessingStage || students.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  title="Forward the approved marksheet to the Principal"
                >
                  {isProcessingStage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Submit to the Principal</span>
                </button>
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

      {/* Subject Input & Component Selector */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 space-y-4">
        {subjectCode && (
          <>
            {/* Multi-Filter Bar: Department, Year, Batch, Semester & Search */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                  <span>Filter Students List</span>
                  {(filterDept !== 'All' || filterYear !== 'All' || filterBatch !== 'All' || filterSem !== 'All' || filterSubject !== 'All' || searchQuery) && (
                    <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                      Filters Active
                    </span>
                  )}
                </div>
                {(filterDept !== 'All' || filterYear !== 'All' || filterBatch !== 'All' || filterSem !== 'All' || filterSubject !== 'All' || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterDept('All');
                      setFilterYear('All');
                      setFilterBatch('All');
                      setFilterSem('All');
                      setFilterSubject('All');
                      setSearchQuery('');
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <X className="w-3 h-3" /> Reset Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Department Filter */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Department (Dep)
                  </label>
                  <select
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                  >
                    <option value="All">All Departments</option>
                    {departmentsList.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Year Filter */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Year (Yr)
                  </label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                  >
                    <option value="All">All Years</option>
                    {yearsList.map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                {/* Batch Filter */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Batch
                  </label>
                  <select
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                  >
                    <option value="All">All Batches</option>
                    {batchesList.map(batch => (
                      <option key={batch} value={batch}>{batch}</option>
                    ))}
                  </select>
                </div>

                {/* Semester Filter */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Semester (Sem)
                  </label>
                  <select
                    value={filterSem}
                    onChange={(e) => setFilterSem(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                  >
                    <option value="All">All Semesters</option>
                    {semestersList.map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>

                {/* Subject Filter */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                  >
                    <option value="All">All Subjects</option>
                    {dropdownSubjects.map(sub => (
                      <option key={sub.code} value={sub.code}>{sub.code}{sub.name && sub.name !== sub.code ? ` — ${sub.name}` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative pt-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-[calc(50%+2px)] -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by student name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                />
              </div>
            </div>

            {/* Assessment Tabs with Live Max & Pass Marks Display */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Assessment View
                </label>
                {!isLocked && (
                  <button
                    onClick={openConfigModal}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
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
                      className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap flex flex-col items-center justify-center gap-0.5 ${isSelected ? "bg-white text-blue-600 shadow-xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"}`}
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
          </>
        )}
      </div>

      {!subjectCode ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-sm font-semibold">Enter a subject code above to load or create a marksheet.</p>
          <p className="text-xs mt-1">e.g., CS2001, CS2005, CS101</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /><span className="text-sm font-medium">Loading register sheet...</span>
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
                        <tr key={s.rollNo} className="hover:bg-blue-50/40 transition-colors">
                          <td className="px-2 py-2 text-center font-bold text-slate-500 border-r border-slate-200">{idx + 1}</td>
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
                        <option value="IV Year">IV Year (Fourth Year)</option>
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
                      value={downloadBatch}
                      onChange={(e) => setDownloadBatch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="2021-2025">Batch 2021-2025</option>
                      <option value="2022-2026">Batch 2022-2026</option>
                      <option value="2023-2027">Batch 2023-2027</option>
                      <option value="2024-2028">Batch 2024-2028</option>
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
