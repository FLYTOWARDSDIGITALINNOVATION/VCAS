import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
} from "lucide-react";
import ModalPortal from "../ModalPortal";

const API = "http://localhost:5000/api";

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
  project: 20,
  assignment1: 5,
  assignment2: 5,
  assignment3: 5,
  assignment4: 5,
  assignment: 20,
  attendance: 5,
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
  project: 8,
  assignment1: 2,
  assignment2: 2,
  assignment3: 2,
  assignment4: 2,
  assignment: 8,
  attendance: 2,
  consolidated: 10,
};

export const ASSESSMENT_COMPONENTS = [
  { id: "all",          label: "College Register Sheet (Official Layout)", shortLabel: "📋 Full Register Sheet", defaultMax: 100, defaultPass: 40 },
  { id: "st",           label: "Snap Tests (ST 1 - 4)",                    shortLabel: "Snap Tests (ST1-4)",    defaultMax: 20,  defaultPass: 8  },
  { id: "it",           label: "Internal Tests (IT 1 & IT 2)",             shortLabel: "Internal (IT1-2)",      defaultMax: 25,  defaultPass: 10 },
  { id: "model",        label: "Model Examination",                        shortLabel: "Model Exam",            defaultMax: 75,  defaultPass: 30 },
  { id: "project",      label: "Project / Seminar",                        shortLabel: "Project / Seminar",     defaultMax: 20,  defaultPass: 8  },
  { id: "assignment",   label: "Assignments (1 to 4)",                     shortLabel: "Assignments (1-4)",     defaultMax: 5,   defaultPass: 2  },
  { id: "consolidated", label: "Consolidated Internal Marks",              shortLabel: "Final CIA Summary",     defaultMax: 25,  defaultPass: 10 },
];

export default function StaffInternalMarks({ staffUser }) {
  const staffId   = staffUser?.staffId || staffUser?.employeeId || "";
  const staffName = staffUser?.name || "";
  const effectiveStaffId = staffId || staffUser?.staffId || staffUser?.employeeId || "EMP001";

  const getStoredSubject = () => {
    try {
      return (
        localStorage.getItem('vcas_internal_subject') ||
        sessionStorage.getItem('vcas_internal_subject') ||
        "CS2001"
      );
    } catch {
      return "CS2001";
    }
  };

  // -- State ----------------------------------------------------------
  const [subjectCode,   setSubjectCode]   = useState(getStoredSubject);
  const [searchInput,   setSearchInput]   = useState(getStoredSubject);
  const [subjectName,   setSubjectName]   = useState("");
  const [staffSubjects, setStaffSubjects] = useState([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [componentId,   setComponentId]   = useState("all");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [students,      setStudents]      = useState([]); // raw from DB
  const [isLocked,      setIsLocked]      = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [isFreezing, setIsFreezing] = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [syncingAssignments, setSyncingAssignments] = useState(false);
  const [successMsg,    setSuccessMsg]    = useState("");
  const [errorMsg,      setErrorMsg]      = useState("");
  const reqIdRef = useRef(0);

  // Configurable Max & Pass Marks per component
  const [maxMarksConfig, setMaxMarksConfig] = useState({ ...DEFAULT_MAX_CONFIG });
  const [passMarksConfig, setPassMarksConfig] = useState({ ...DEFAULT_PASS_CONFIG });

  // Modal to configure criteria
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempMaxConfig,   setTempMaxConfig]   = useState({ ...DEFAULT_MAX_CONFIG });
  const [tempPassConfig,  setTempPassConfig]  = useState({ ...DEFAULT_PASS_CONFIG });
  const [savingCriteria,  setSavingCriteria]  = useState(false);

  // Modal to add student
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newRollNo,      setNewRollNo]      = useState("");
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
    return maxMarksConfig[componentId] ?? activeComp.defaultMax;
  }, [componentId, maxMarksConfig, activeComp]);

  const currentPass = useMemo(() => {
    if (componentId === "all") return 40;
    if (componentId === "st") return passMarksConfig.st1 || 8;
    if (componentId === "it") return passMarksConfig.it1 || 10;
    if (componentId === "assignment") return passMarksConfig.assignment1 || 2;
    return passMarksConfig[componentId] ?? activeComp.defaultPass;
  }, [componentId, passMarksConfig, activeComp]);

  const dropdownSubjects = useMemo(() => {
    const list = [...staffSubjects];
    if (subjectCode && !list.some((s) => s.code === subjectCode)) {
      list.unshift({ code: subjectCode, name: subjectName || subjectCode });
    }
    if (list.length === 0) {
      list.push(
        { code: "CS2001", name: "Cloud Computing" },
        { code: "CS2005", name: "DBMS" }
      );
    }
    return list;
  }, [staffSubjects, subjectCode, subjectName]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) => s.name?.toLowerCase().includes(q) || s.rollNo?.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const stats = useMemo(() => {
    let totalScore = 0, count = 0, absentCount = 0, passCount = 0, highest = -1, lowest = 9999;
    students.forEach((s) => {
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
        if (m < lowest)  lowest  = m;
      }
    });
    return {
      total:    students.length,
      appeared: count,
      absent:   absentCount,
      passCount,
      passPct:  count > 0 ? Math.round((passCount / count) * 100) : 0,
      average:  count > 0 ? (totalScore / count).toFixed(1) : 0,
      highest:  highest === -1   ? "-" : highest,
      lowest:   lowest  === 9999 ? "-" : lowest,
    };
  }, [students, componentId, currentPass]);

  // -- Toast helper ----------------------------------------------------
  const toast = useCallback((msg, isError = false) => {
    if (isError) { setErrorMsg(msg); setSuccessMsg(""); }
    else         { setSuccessMsg(msg); setErrorMsg(""); }
    setTimeout(() => { setSuccessMsg(""); setErrorMsg(""); }, 4500);
  }, []);

  // -- Fetch marksheet -------------------------------------------------
  const fetchMarksheet = useCallback(async (code) => {
    if (!code || !code.trim()) return;
    const cleanCode = code.trim().toUpperCase();
    const currentReqId = ++reqIdRef.current;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/internal-marks/${effectiveStaffId}/${encodeURIComponent(cleanCode)}`);
      const json = await res.json();
      if (currentReqId !== reqIdRef.current) return;

      if (json.success && json.data) {
        const canonicalCode = (json.data.subjectCode || cleanCode).toUpperCase();
        setStudents(json.data.students || []);
        setIsLocked(json.data.isLocked || false);
        setSubjectName(json.data.subjectName || "");
        setSubjectCode(canonicalCode);
        setSearchInput(canonicalCode);
        try {
          localStorage.setItem('vcas_internal_subject', canonicalCode);
          sessionStorage.setItem('vcas_internal_subject', canonicalCode);
        } catch {
          // ignore
        }
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
  }, [effectiveStaffId, toast]);

  // Load available staff subjects on mount
  useEffect(() => {
    Promise.all([
      fetch(`${API}/classes/staff/${effectiveStaffId}`).then(r => r.json()).catch(() => null),
      fetch(`${API}/assignments/${effectiveStaffId}`).then(r => r.json()).catch(() => null),
      fetch(`${API}/internal-marks/${effectiveStaffId}`).then(r => r.json()).catch(() => null),
    ]).then(([clsData, asgtsData, marksData]) => {
      const subs = [];
      const seen = new Set();
      const classesList = Array.isArray(clsData?.classes)
        ? clsData.classes
        : (Array.isArray(clsData?.data) ? clsData.data : []);

      if (classesList.length > 0) {
        classesList.forEach(c => {
          const code = (c.code || "").trim().toUpperCase();
          if (code && code.length >= 3 && !seen.has(code)) {
            seen.add(code);
            subs.push({ code, name: c.name || code });
          }
        });
      }
      if (asgtsData?.success && Array.isArray(asgtsData.data)) {
        asgtsData.data.forEach(a => {
          const code = (a.subjectCode || "").trim().toUpperCase();
          if (code && code.length >= 3 && !seen.has(code)) {
            seen.add(code);
            subs.push({ code, name: a.subjectName || a.title || code });
          }
        });
      }
      if (marksData?.success && Array.isArray(marksData.data)) {
        marksData.data.forEach(m => {
          const code = (m.subjectCode || "").trim().toUpperCase();
          if (code && code.length >= 3 && !seen.has(code)) {
            seen.add(code);
            subs.push({ code, name: m.subjectName || code });
          }
        });
      }
      setStaffSubjects(subs);
    });
  }, [effectiveStaffId]);

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

    const it1Max  = Number(config.it1) || Number(config.cia1) || 25;
    const it2Max  = Number(config.it2) || Number(config.cia2) || 25;
    const modMax  = Number(config.model) || 75;
    const asgMax  = Number(config.assignment) || 20;
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

  // -- Save marks ------------------------------------------------------
  const handleSave = async () => {
    if (!subjectCode) return;
    setSaving(true);
    try {
      const res  = await fetch(`${API}/internal-marks/${effectiveStaffId}/${encodeURIComponent(subjectCode)}/save`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          staffName, subjectName,
          department:   staffUser?.department || "",
          academicYear: staffUser?.academicYear || "2025-2026",
          students,
          maxMarks:  maxMarksConfig,
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

    const validatedMax = {
      ...tempMaxConfig,
      st1:          Math.max(1, Number(tempMaxConfig.st1) || 20),
      st2:          Math.max(1, Number(tempMaxConfig.st2) || 20),
      st3:          Math.max(1, Number(tempMaxConfig.st3) || 20),
      st4:          Math.max(1, Number(tempMaxConfig.st4) || 20),
      it1:          Math.max(1, Number(tempMaxConfig.it1) || 25),
      it2:          Math.max(1, Number(tempMaxConfig.it2) || 25),
      cia1:         Math.max(1, Number(tempMaxConfig.cia1) || 50),
      cia2:         Math.max(1, Number(tempMaxConfig.cia2) || 50),
      model:        Math.max(1, Number(tempMaxConfig.model) || 75),
      project:      Math.max(1, Number(tempMaxConfig.project) || 20),
      assignment1:  Math.max(1, Number(tempMaxConfig.assignment1) || 5),
      assignment2:  Math.max(1, Number(tempMaxConfig.assignment2) || 5),
      assignment3:  Math.max(1, Number(tempMaxConfig.assignment3) || 5),
      assignment4:  Math.max(1, Number(tempMaxConfig.assignment4) || 5),
      assignment:   Math.max(1, Number(tempMaxConfig.assignment) || 20),
      attendance:   Math.max(1, Number(tempMaxConfig.attendance) || 5),
      consolidated: Math.max(1, Number(tempMaxConfig.consolidated) || 25),
    };

    const validatedPass = {
      ...tempPassConfig,
      st1:          Math.min(validatedMax.st1, Math.max(0, Number(tempPassConfig.st1) || 8)),
      st2:          Math.min(validatedMax.st2, Math.max(0, Number(tempPassConfig.st2) || 8)),
      st3:          Math.min(validatedMax.st3, Math.max(0, Number(tempPassConfig.st3) || 8)),
      st4:          Math.min(validatedMax.st4, Math.max(0, Number(tempPassConfig.st4) || 8)),
      it1:          Math.min(validatedMax.it1, Math.max(0, Number(tempPassConfig.it1) || 10)),
      it2:          Math.min(validatedMax.it2, Math.max(0, Number(tempPassConfig.it2) || 10)),
      cia1:         Math.min(validatedMax.cia1, Math.max(0, Number(tempPassConfig.cia1) || 20)),
      cia2:         Math.min(validatedMax.cia2, Math.max(0, Number(tempPassConfig.cia2) || 20)),
      model:        Math.min(validatedMax.model, Math.max(0, Number(tempPassConfig.model) || 30)),
      project:      Math.min(validatedMax.project, Math.max(0, Number(tempPassConfig.project) || 8)),
      assignment1:  Math.min(validatedMax.assignment1, Math.max(0, Number(tempPassConfig.assignment1) || 2)),
      assignment2:  Math.min(validatedMax.assignment2, Math.max(0, Number(tempPassConfig.assignment2) || 2)),
      assignment3:  Math.min(validatedMax.assignment3, Math.max(0, Number(tempPassConfig.assignment3) || 2)),
      assignment4:  Math.min(validatedMax.assignment4, Math.max(0, Number(tempPassConfig.assignment4) || 2)),
      assignment:   Math.min(validatedMax.assignment, Math.max(0, Number(tempPassConfig.assignment) || 8)),
      attendance:   Math.min(validatedMax.attendance, Math.max(0, Number(tempPassConfig.attendance) || 2)),
      consolidated: Math.min(validatedMax.consolidated, Math.max(0, Number(tempPassConfig.consolidated) || 10)),
    };

    setSavingCriteria(true);
    try {
      const updatedStudents = students.map((s) => ({
        ...s,
        consolidated: calculateConsolidated(s, validatedMax),
      }));

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
          maxMarks:  validatedMax,
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
        toast("Marks register locked & submitted to CoE!");
        setShowFreezeModal(false);
      } else {
        toast(json.message || "Failed to submit marks to CoE.", true);
      }
    } catch {
      toast("Server error while freezing marks.", true);
    } finally {
      setIsFreezing(false);
    }
  };

  // -- Generic Cell Change (supports numbers, decimals, "AB", "-") -----
  const handleCellChange = (rollNo, field, val) => {
    if (isLocked) return;
    setErrorMsg("");

    if (val === "" || val === null || val === undefined) {
      updateStudentCell(rollNo, field, null);
      return;
    }

    const strVal = String(val).trim();
    const upper = strVal.toUpperCase();
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
        return updated;
      })
    );
  };

  // -- Add student -----------------------------------------------------
  const handleAddStudent = (e) => {
    e.preventDefault();
    if (!newRollNo.trim() || !newStudentName.trim()) return;
    const exists = students.some((s) => s.rollNo === newRollNo.trim().toUpperCase());
    if (exists) { toast("Student with this roll number already exists.", true); return; }
    setStudents((prev) => [...prev, { rollNo: newRollNo.trim().toUpperCase(), name: newStudentName.trim() }]);
    setNewRollNo(""); setNewStudentName(""); setShowAddStudent(false);
  };

  // -- Export CSV with all register columns ---------------------------
  const handleExport = () => {
    let csv = `S.NO,Roll No,Student Name,ST 1,ST 2,ST 3,ST 4,IT 1,IT 2,Model Exam,Project/Seminar,Assignment 1,Assignment 2,Assignment 3,Assignment 4,Final CIA\n`;
    students.forEach((s, idx) => {
      const it1 = s.it1 !== null && s.it1 !== undefined ? s.it1 : (s.cia1 ?? "-");
      const it2 = s.it2 !== null && s.it2 !== undefined ? s.it2 : (s.cia2 ?? "-");
      csv += `${idx + 1},"${s.rollNo}","${s.name}",${s.st1 ?? "-"},${s.st2 ?? "-"},${s.st3 ?? "-"},${s.st4 ?? "-"},${it1},${it2},${s.model ?? "-"},${s.project ?? "-"},${s.assignment1 ?? "-"},${s.assignment2 ?? "-"},${s.assignment3 ?? "-"},${s.assignment4 ?? "-"},${s.consolidated ?? "-"}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Official_Mark_Register_${subjectCode}_${new Date().toISOString().slice(0,10)}.csv`;
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
          <td style="text-align: center;">${s.st1 !== null && s.st1 !== undefined ? s.st1 : ''}</td>
          <td style="text-align: center;">${s.st2 !== null && s.st2 !== undefined ? s.st2 : ''}</td>
          <td style="text-align: center;">${s.st3 !== null && s.st3 !== undefined ? s.st3 : ''}</td>
          <td style="text-align: center;">${s.st4 !== null && s.st4 !== undefined ? s.st4 : ''}</td>
          <td style="text-align: center;">${it1}</td>
          <td style="text-align: center;">${it2}</td>
          <td style="text-align: center;">${s.model !== null && s.model !== undefined ? s.model : ''}</td>
          <td style="text-align: center;">${s.project !== null && s.project !== undefined ? s.project : ''}</td>
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
            padding: 0 30px;
          }
          .sig-box {
            text-align: center;
            width: 180px;
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
              <th colspan="4">SNAP TEST</th>
              <th colspan="2">INTERNAL</th>
              <th rowspan="2" style="width: 50px;">MODEL</th>
              <th rowspan="2" style="width: 80px;">PROJECT /<br/>SEMINAR</th>
              <th colspan="4">ASSIGNMENT</th>
            </tr>
            <tr>
              <th style="width: 38px;">ST 1</th>
              <th style="width: 38px;">ST 2</th>
              <th style="width: 38px;">ST 3</th>
              <th style="width: 38px;">ST 4</th>
              <th style="width: 44px;">IT 1</th>
              <th style="width: 44px;">IT 2</th>
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
                onClick={handleSyncAssignments}
                disabled={syncingAssignments || isLocked}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 rounded-xl text-xs font-bold text-blue-700 shadow-xs transition-all cursor-pointer"
                title="Pull latest graded marks from the Assignments portal for this subject"
              >
                {syncingAssignments ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>{syncingAssignments ? "Syncing..." : "Sync Assignments"}</span>
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

              <button
                onClick={handleToggleLock}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${isLocked ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"}`}
              >
                {isLocked ? <><Unlock className="w-3.5 h-3.5" /> Unlock Marks</> : <><Lock className="w-3.5 h-3.5" /> Freeze & Submit to CoE</>}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Centered Notifications Popup */}
      {(successMsg || errorMsg) && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none p-4 animate-in fade-in zoom-in-95">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold border pointer-events-auto ${
            errorMsg 
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
        {/* Course Code Dropdown Selector */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <BookMarked className="w-4 h-4 text-blue-600" />
              <span>Select Subject / Course Code</span>
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
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                {showCustomInput ? "Switch to Course Dropdown" : "+ Enter Custom Course Code"}
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
                <option value="" disabled>-- Select Course Code --</option>
                {dropdownSubjects.map((sub) => (
                  <option key={sub.code} value={sub.code}>
                    {sub.code} — {sub.name && sub.name !== sub.code ? sub.name : "Course"}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter course code, e.g. CS2001..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLoadSubject(); }}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 uppercase shadow-xs"
              />
              <button
                type="button"
                onClick={() => handleLoadSubject()}
                disabled={!searchInput.trim() || loading}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm shadow-blue-500/20 shrink-0"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Load Course</span>
              </button>
            </div>
          )}

          {/* Quick Clickable Pills */}
          {dropdownSubjects.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Quick Select:
              </span>
              {dropdownSubjects.map((sub) => {
                const isSelected = subjectCode === sub.code;
                return (
                  <button
                    key={sub.code}
                    type="button"
                    onClick={() => {
                      setShowCustomInput(false);
                      handleLoadSubject(sub.code);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
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

        {subjectCode && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
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
              { label: "Total Students", value: stats.total,    sub: `${stats.absent} Absent`,      color: "text-slate-900" },
              { label: "Class Average",  value: stats.average,  sub: `/ ${currentMax}`,             color: "text-blue-600" },
              { label: "Pass %",         value: `${stats.passPct}%`, sub: `${stats.passCount} passed`, color: stats.passPct >= 75 ? "text-emerald-600" : "text-amber-600" },
              { label: "Highest",        value: stats.highest,  sub: `/ ${currentMax}`,             color: "text-emerald-600" },
              { label: "Lowest",         value: stats.lowest,   sub: `/ ${currentMax}`,             color: "text-rose-600" },
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
                    <span>Format: <b>SNAP TEST (1-4) | INTERNAL (1-2) | MODEL | PROJECT | ASSIGNMENT (1-4)</b></span>
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
                      <th colSpan={4} className="px-2 py-1.5 text-center border-r border-slate-300 bg-sky-100/80 text-sky-950 font-black tracking-wider">
                        SNAP TEST
                      </th>
                      <th colSpan={2} className="px-2 py-1.5 text-center border-r border-slate-300 bg-indigo-100/80 text-indigo-950 font-black tracking-wider">
                        INTERNAL
                      </th>
                      <th rowSpan={2} className="px-3 py-2 text-center border-r border-slate-300 bg-purple-100/80 text-purple-950 font-black min-w-[70px]">
                        MODEL
                      </th>
                      <th rowSpan={2} className="px-3 py-2 text-center border-r border-slate-300 bg-emerald-100/80 text-emerald-950 font-black min-w-[110px]">
                        PROJECT / SEMINAR
                      </th>
                      <th colSpan={4} className="px-2 py-1.5 text-center border-r border-slate-300 bg-amber-100/80 text-amber-950 font-black tracking-wider">
                        ASSIGNMENT
                      </th>
                      <th rowSpan={2} className="px-3 py-2 text-center bg-blue-100/80 text-blue-950 font-black min-w-[85px]">
                        FINAL CIA
                      </th>
                    </tr>
                    <tr className="bg-slate-50 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-300">
                      <th className="px-2 py-1.5 text-center border-r border-slate-300 bg-sky-50 text-sky-900">ST 1</th>
                      <th className="px-2 py-1.5 text-center border-r border-slate-300 bg-sky-50 text-sky-900">ST 2</th>
                      <th className="px-2 py-1.5 text-center border-r border-slate-300 bg-sky-50 text-sky-900">ST 3</th>
                      <th className="px-2 py-1.5 text-center border-r border-slate-300 bg-sky-50 text-sky-900">ST 4</th>
                      <th className="px-2 py-1.5 text-center border-r border-slate-300 bg-indigo-50 text-indigo-900">IT 1</th>
                      <th className="px-2 py-1.5 text-center border-r border-slate-300 bg-indigo-50 text-indigo-900">IT 2</th>
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
                      return (
                        <tr key={s.rollNo} className="hover:bg-blue-50/40 transition-colors">
                          <td className="px-2 py-2 text-center font-bold text-slate-500 border-r border-slate-200">{idx + 1}</td>
                          <td className="px-3 py-2 text-left border-r border-slate-200">
                            <div className="font-extrabold text-slate-900">{s.name}</div>
                            <div className="text-[10px] font-mono font-semibold text-slate-400">{s.rollNo}</div>
                          </td>
                          {/* SNAP TESTS ST1 - ST4 */}
                          {['st1', 'st2', 'st3', 'st4'].map((f) => (
                            <td key={f} className="p-1 text-center border-r border-slate-200 bg-sky-50/20">
                              <input
                                type="text"
                                disabled={isLocked}
                                value={s[f] !== null && s[f] !== undefined ? s[f] : ""}
                                onChange={(e) => handleCellChange(s.rollNo, f, e.target.value)}
                                className={`w-12 text-center py-1 px-1 rounded-md text-xs font-bold border transition-all ${
                                  s[f] === "AB" || s[f] === "A"
                                    ? "bg-amber-100 text-amber-900 border-amber-300"
                                    : "border-slate-200 bg-white text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                } disabled:bg-slate-100 disabled:cursor-not-allowed`}
                                placeholder="-"
                              />
                            </td>
                          ))}
                          {/* INTERNAL IT1 - IT2 */}
                          <td className="p-1 text-center border-r border-slate-200 bg-indigo-50/20">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={it1Val !== null && it1Val !== undefined ? it1Val : ""}
                              onChange={(e) => handleCellChange(s.rollNo, 'it1', e.target.value)}
                              className={`w-12 text-center py-1 px-1 rounded-md text-xs font-bold border transition-all ${
                                it1Val === "AB" || it1Val === "A"
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
                              className={`w-12 text-center py-1 px-1 rounded-md text-xs font-bold border transition-all ${
                                it2Val === "AB" || it2Val === "A"
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
                              className="w-14 text-center py-1 px-1 rounded-md text-xs font-bold border border-slate-200 bg-white text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                              placeholder="-"
                            />
                          </td>
                          {/* PROJECT / SEMINAR */}
                          <td className="p-1 text-center border-r border-slate-200 bg-emerald-50/20">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={s.project !== null && s.project !== undefined ? s.project : ""}
                              onChange={(e) => handleCellChange(s.rollNo, 'project', e.target.value)}
                              className="w-14 text-center py-1 px-1 rounded-md text-xs font-bold border border-slate-200 bg-white text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                              placeholder="-"
                            />
                          </td>
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
                        </tr>
                      );
                    })}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={15} className="py-12 text-center text-slate-500 text-xs">
                          <p className="font-bold text-slate-800 text-sm">No students in marksheet for {subjectCode}</p>
                          <p className="text-slate-400 mt-1">Use "Sync Assignments" or "Add Student" above to populate the student list.</p>
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
                        ? (Number(s.assignment1)||0)+(Number(s.assignment2)||0)+(Number(s.assignment3)||0)+(Number(s.assignment4)||0)
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
                      const current  = s[componentId];
                      const isAbsent = current === "A" || current === "AB";
                      const isNum    = typeof current === "number";
                      const isPassed = isNum && current >= currentPass;
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
                                className={`w-16 text-center py-1 px-2 rounded-xl text-xs font-extrabold border transition-all ${isLocked ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed" : isAbsent ? "bg-amber-50 text-amber-700 border-amber-300" : isNum && !isPassed ? "bg-rose-50 text-rose-700 border-rose-300" : "bg-slate-50 text-slate-900 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"}`}
                                placeholder={`0-${currentMax}`}
                              />
                              {!isLocked && (
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

            {/* Official Signature Verification Strip matching physical sheet */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-xs font-bold text-slate-700">
              <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-2xs">
                <div className="h-7 flex items-end justify-center font-serif italic text-blue-700 font-bold text-sm">
                  {staffName || "P. KALARANI"}
                </div>
                <div className="border-t border-slate-300 pt-1 uppercase tracking-wider text-[10px] text-slate-500 font-extrabold mt-1">
                  STAFF IN-CHARGE
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-2xs">
                <div className="h-7 flex items-end justify-center font-serif italic text-blue-700 font-bold text-sm">
                  {isLocked ? "Dr. Meenakshi C" : "Verified"}
                </div>
                <div className="border-t border-slate-300 pt-1 uppercase tracking-wider text-[10px] text-slate-500 font-extrabold mt-1">
                  HEAD OF DEPARTMENT (HOD)
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-2xs">
                <div className="h-7 flex items-end justify-center font-serif italic text-blue-700 font-bold text-sm">
                  {isLocked ? "Dr. K. Sundararajan" : "Approved"}
                </div>
                <div className="border-t border-slate-300 pt-1 uppercase tracking-wider text-[10px] text-slate-500 font-extrabold mt-1">
                  PRINCIPAL
                </div>
              </div>
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
                  { id: "st1",          name: "Snap Test 1 (ST 1)",       defaultM: 20, defaultP: 8 },
                  { id: "st2",          name: "Snap Test 2 (ST 2)",       defaultM: 20, defaultP: 8 },
                  { id: "st3",          name: "Snap Test 3 (ST 3)",       defaultM: 20, defaultP: 8 },
                  { id: "st4",          name: "Snap Test 4 (ST 4)",       defaultM: 20, defaultP: 8 },
                  { id: "it1",          name: "Internal Test 1 (IT 1)",   defaultM: 25, defaultP: 10 },
                  { id: "it2",          name: "Internal Test 2 (IT 2)",   defaultM: 25, defaultP: 10 },
                  { id: "model",        name: "Model Examination",        defaultM: 75, defaultP: 30 },
                  { id: "project",      name: "Project / Seminar",        defaultM: 20, defaultP: 8  },
                  { id: "assignment1",  name: "Assignment 1",             defaultM: 5,  defaultP: 2  },
                  { id: "assignment2",  name: "Assignment 2",             defaultM: 5,  defaultP: 2  },
                  { id: "assignment3",  name: "Assignment 3",             defaultM: 5,  defaultP: 2  },
                  { id: "assignment4",  name: "Assignment 4",             defaultM: 5,  defaultP: 2  },
                  { id: "consolidated", name: "Consolidated Final CIA",   defaultM: 25, defaultP: 10 },
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
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Minimum Pass Marks</label>
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

      {/* Freeze & Submit to CoE Centered Confirmation Modal */}
      {showFreezeModal && (
        <ModalPortal isOpen={showFreezeModal} onClose={() => !isFreezing && setShowFreezeModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-7 max-w-md w-full animate-in fade-in zoom-in-95 text-left my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 shadow-xs">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Freeze & Submit to CoE</h3>
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
                <span className="font-bold">Notice:</span> Freezing will automatically save all internal marks and submit them directly to the <b>Office of Controller of Examinations (CoE)</b>. After submission, marks editing will be locked.
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
                    <span>Submitting to CoE...</span>
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
    </div>
  );
}
