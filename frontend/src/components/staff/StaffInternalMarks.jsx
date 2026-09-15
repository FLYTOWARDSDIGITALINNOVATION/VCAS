import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileSpreadsheet,
  Search,
  Save,
  Lock,
  Unlock,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Plus,
  X,
  SlidersHorizontal,
  Edit3,
  Award,
} from "lucide-react";

const API = "http://localhost:5000/api";

export const ASSESSMENT_COMPONENTS = [
  { id: "cia1",         label: "Cycle Test 1 (CIA 1)", shortLabel: "Cycle Test 1", defaultMax: 50, defaultPass: 20 },
  { id: "cia2",         label: "Cycle Test 2 (CIA 2)", shortLabel: "Cycle Test 2", defaultMax: 50, defaultPass: 20 },
  { id: "model",        label: "Model Exam",           shortLabel: "Model Exam",   defaultMax: 75, defaultPass: 30 },
  { id: "assignment",   label: "Assignment / Seminar", shortLabel: "Assignment",   defaultMax: 20, defaultPass: 8  },
  { id: "attendance",   label: "Attendance Score",     shortLabel: "Attendance",   defaultMax: 5,  defaultPass: 2  },
  { id: "consolidated", label: "Consolidated Final",   shortLabel: "Final CIA",    defaultMax: 25, defaultPass: 10 },
];

export default function StaffInternalMarks({ staffUser }) {
  const staffId   = staffUser?.staffId || staffUser?.employeeId || "";
  const staffName = staffUser?.name || "";

  // -- State ----------------------------------------------------------
  const [subjectCode,   setSubjectCode]   = useState("");
  const [subjectName,   setSubjectName]   = useState("");
  const [componentId,   setComponentId]   = useState("cia1");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [students,      setStudents]      = useState([]); // raw from DB
  const [isLocked,      setIsLocked]      = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [successMsg,    setSuccessMsg]    = useState("");
  const [errorMsg,      setErrorMsg]      = useState("");

  // Configurable Max & Pass Marks per component
  const [maxMarksConfig, setMaxMarksConfig] = useState({
    cia1: 50,
    cia2: 50,
    model: 75,
    assignment: 20,
    attendance: 5,
    consolidated: 25,
  });

  const [passMarksConfig, setPassMarksConfig] = useState({
    cia1: 20,
    cia2: 20,
    model: 30,
    assignment: 8,
    attendance: 2,
    consolidated: 10,
  });

  // Modal to configure criteria
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempMaxConfig,   setTempMaxConfig]   = useState({ ...maxMarksConfig });
  const [tempPassConfig,  setTempPassConfig]  = useState({ ...passMarksConfig });
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

  const currentMax  = maxMarksConfig[componentId]  ?? activeComp.defaultMax;
  const currentPass = passMarksConfig[componentId] ?? activeComp.defaultPass;

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) => s.name?.toLowerCase().includes(q) || s.rollNo?.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const stats = useMemo(() => {
    let totalScore = 0, count = 0, absentCount = 0, passCount = 0, highest = -1, lowest = 9999;
    students.forEach((s) => {
      const m = s[componentId];
      if (m === "A") { absentCount++; return; }
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
    if (!code) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/internal-marks/${staffId}/${encodeURIComponent(code)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setStudents(json.data.students || []);
        setIsLocked(json.data.isLocked || false);
        setSubjectName(json.data.subjectName || "");
        if (json.data.maxMarks) {
          const loadedMax = {
            cia1:         Number(json.data.maxMarks.cia1) || 50,
            cia2:         Number(json.data.maxMarks.cia2) || 50,
            model:        Number(json.data.maxMarks.model) || 75,
            assignment:   Number(json.data.maxMarks.assignment) || 20,
            attendance:   Number(json.data.maxMarks.attendance) || 5,
            consolidated: Number(json.data.maxMarks.consolidated) || 25,
          };
          setMaxMarksConfig(loadedMax);
          setTempMaxConfig(loadedMax);
        }
        if (json.data.passMarks) {
          const loadedPass = {
            cia1:         Number(json.data.passMarks.cia1) >= 0 ? Number(json.data.passMarks.cia1) : 20,
            cia2:         Number(json.data.passMarks.cia2) >= 0 ? Number(json.data.passMarks.cia2) : 20,
            model:        Number(json.data.passMarks.model) >= 0 ? Number(json.data.passMarks.model) : 30,
            assignment:   Number(json.data.passMarks.assignment) >= 0 ? Number(json.data.passMarks.assignment) : 8,
            attendance:   Number(json.data.passMarks.attendance) >= 0 ? Number(json.data.passMarks.attendance) : 2,
            consolidated: Number(json.data.passMarks.consolidated) >= 0 ? Number(json.data.passMarks.consolidated) : 10,
          };
          setPassMarksConfig(loadedPass);
          setTempPassConfig(loadedPass);
        }
      } else {
        setStudents([]); setIsLocked(false);
      }
    } catch {
      toast("Could not reach server.", true);
    } finally {
      setLoading(false);
    }
  }, [staffId, toast]);

  useEffect(() => { if (subjectCode) fetchMarksheet(subjectCode); }, [subjectCode, fetchMarksheet]);

  // Recalculate consolidated marks for a student based on current/given config
  const calculateConsolidated = (student, config = maxMarksConfig) => {
    const c1  = student.cia1  === "A" || student.cia1  == null ? 0 : Number(student.cia1);
    const c2  = student.cia2  === "A" || student.cia2  == null ? 0 : Number(student.cia2);
    const mod = student.model === "A" || student.model == null ? 0 : Number(student.model);
    const asg = student.assignment != null ? Number(student.assignment) : 0;
    const att = student.attendance != null ? Number(student.attendance) : 0;

    const c1Max  = Number(config.cia1) || 50;
    const c2Max  = Number(config.cia2) || 50;
    const modMax = Number(config.model) || 75;
    const asgMax = Number(config.assignment) || 20;
    const attMax = Number(config.attendance) || 5;
    const consMax = Number(config.consolidated) || 25;

    // Scale CIA tests to 10 marks total
    const ciaScaled = ((c1 + c2) / ((c1Max + c2Max) || 100)) * 10;
    // Scale Model exam to 5 marks
    const modelScaled = modMax > 0 ? (mod / modMax) * 5 : 0;
    // Scale Assignment to 5 marks
    const asgScaled = asgMax > 0 ? (asg / asgMax) * 5 : 0;
    // Scale Attendance to 5 marks
    const attScaled = attMax > 0 ? (att / attMax) * 5 : 0;

    const total = Math.round(ciaScaled + modelScaled + asgScaled + attScaled);
    return Math.min(consMax, total);
  };

  // -- Save marks ------------------------------------------------------
  const handleSave = async () => {
    if (!subjectCode) return;
    setSaving(true);
    try {
      const res  = await fetch(`${API}/internal-marks/${staffId}/${encodeURIComponent(subjectCode)}/save`, {
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
      if (json.success) toast("Marks and evaluation criteria saved successfully!");
      else toast(json.message, true);
    } catch {
      toast("Server error while saving.", true);
    } finally {
      setSaving(false);
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
      cia1:         Math.max(1, Number(tempMaxConfig.cia1) || 50),
      cia2:         Math.max(1, Number(tempMaxConfig.cia2) || 50),
      model:        Math.max(1, Number(tempMaxConfig.model) || 75),
      assignment:   Math.max(1, Number(tempMaxConfig.assignment) || 20),
      attendance:   Math.max(1, Number(tempMaxConfig.attendance) || 5),
      consolidated: Math.max(1, Number(tempMaxConfig.consolidated) || 25),
    };

    const validatedPass = {
      cia1:         Math.min(validatedMax.cia1, Math.max(0, Number(tempPassConfig.cia1) || 20)),
      cia2:         Math.min(validatedMax.cia2, Math.max(0, Number(tempPassConfig.cia2) || 20)),
      model:        Math.min(validatedMax.model, Math.max(0, Number(tempPassConfig.model) || 30)),
      assignment:   Math.min(validatedMax.assignment, Math.max(0, Number(tempPassConfig.assignment) || 8)),
      attendance:   Math.min(validatedMax.attendance, Math.max(0, Number(tempPassConfig.attendance) || 2)),
      consolidated: Math.min(validatedMax.consolidated, Math.max(0, Number(tempPassConfig.consolidated) || 10)),
    };

    setSavingCriteria(true);
    try {
      // Recalculate consolidated marks for all existing students with new criteria
      const updatedStudents = students.map((s) => ({
        ...s,
        consolidated: calculateConsolidated(s, validatedMax),
      }));

      setMaxMarksConfig(validatedMax);
      setPassMarksConfig(validatedPass);
      setStudents(updatedStudents);

      // Save to backend
      const res = await fetch(`${API}/internal-marks/${staffId}/${encodeURIComponent(subjectCode)}/save`, {
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
        toast("Max & Pass Marks updated! Student pass/fail statuses and grades refreshed.");
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
    if (!isLocked && !window.confirm(`Freeze and submit marks for ${subjectCode}? Modifications will be restricted.`)) return;
    if (!isLocked) await handleSave();
    try {
      const res  = await fetch(`${API}/internal-marks/${staffId}/${encodeURIComponent(subjectCode)}/lock`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ lock: !isLocked }),
      });
      const json = await res.json();
      if (json.success) {
        setIsLocked(json.data.isLocked);
        toast(json.data.isLocked ? "Marks locked & submitted to CoE!" : "Marks unlocked for editing.");
      } else toast(json.message, true);
    } catch { toast("Server error.", true); }
  };

  // -- Mark change -----------------------------------------------------
  const handleMarkChange = (rollNo, val) => {
    if (isLocked) return;
    setErrorMsg("");
    if (val === "") return updateMark(rollNo, null);
    if (val.toUpperCase() === "A") return updateMark(rollNo, "A");

    const numVal = Number(val);
    if (isNaN(numVal)) { setErrorMsg('Enter a valid number or "A" for absent.'); return; }
    if (numVal < 0 || numVal > currentMax) {
      setErrorMsg(`Marks for ${activeComp.label} must be between 0 and ${currentMax}.`);
      return;
    }
    updateMark(rollNo, numVal);
  };

  const updateMark = (rollNo, value) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.rollNo !== rollNo) return s;
        const updated = { ...s, [componentId]: value };
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

  // -- Export CSV ------------------------------------------------------
  const handleExport = () => {
    let csv = `Roll No,Student Name,Cycle Test 1 (Max ${maxMarksConfig.cia1} | Pass ${passMarksConfig.cia1}),Cycle Test 2 (Max ${maxMarksConfig.cia2} | Pass ${passMarksConfig.cia2}),Model Exam (Max ${maxMarksConfig.model} | Pass ${passMarksConfig.model}),Assignment (Max ${maxMarksConfig.assignment} | Pass ${passMarksConfig.assignment}),Attendance (Max ${maxMarksConfig.attendance} | Pass ${passMarksConfig.attendance}),Consolidated (Max ${maxMarksConfig.consolidated} | Pass ${passMarksConfig.consolidated})\n`;
    students.forEach((s) => {
      csv += `"${s.rollNo}","${s.name}",${s.cia1 ?? "-"},${s.cia2 ?? "-"},${s.model ?? "-"},${s.assignment ?? "-"},${s.attendance ?? "-"},${s.consolidated ?? "-"}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `InternalMarks_${subjectCode}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const openConfigModal = () => {
    setTempMaxConfig({ ...maxMarksConfig });
    setTempPassConfig({ ...passMarksConfig });
    setShowConfigModal(true);
  };

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-slate-900">Internal Marks & Assessment</h2>
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
            Manage Cycle Tests, Model Exams, Assignments, and configure custom Max Marks & Pass Marks
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {subjectCode && (
            <>
              <button
                onClick={openConfigModal}
                disabled={isLocked}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50 rounded-xl text-xs font-bold text-indigo-700 shadow-xs transition-all"
                title="Configure Max Marks and Pass Marks for all exams and assignments"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" /> Set Max & Pass Marks
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

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />{successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />{errorMsg}
        </div>
      )}

      {/* Subject Input & Component Selector */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., CS401"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <button
                onClick={() => fetchMarksheet(subjectCode)}
                disabled={!subjectCode || loading}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Load
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name (optional)</label>
            <input
              type="text"
              placeholder="e.g., Data Structures"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
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
                  Assessment Component
                </label>
                {!isLocked && (
                  <button
                    onClick={openConfigModal}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" /> Set Max ({currentMax}) & Pass ({currentPass})
                  </button>
                )}
              </div>
              <div className="flex overflow-x-auto gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70">
                {ASSESSMENT_COMPONENTS.map((comp) => {
                  const compMax  = maxMarksConfig[comp.id]  ?? comp.defaultMax;
                  const compPass = passMarksConfig[comp.id] ?? comp.defaultPass;
                  const isSelected = componentId === comp.id;
                  return (
                    <button
                      key={comp.id}
                      onClick={() => setComponentId(comp.id)}
                      className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap flex flex-col items-center justify-center gap-0.5 ${isSelected ? "bg-white text-blue-600 shadow-xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"}`}
                    >
                      <span>{comp.shortLabel}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${isSelected ? "bg-blue-50 text-blue-700" : "bg-slate-200/60 text-slate-500"}`}>
                        Max: {compMax} | Pass: {compPass}
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
          <p className="text-xs mt-1">e.g., CS401, EC301, MB201</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /><span className="text-sm font-medium">Loading marksheet...</span>
        </div>
      ) : (
        <>
          {/* Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total Students", value: stats.total,    sub: `${stats.absent} Absent`,      color: "text-slate-900" },
              { label: "Class Average",  value: stats.average,  sub: `/ ${currentMax}`,             color: "text-blue-600" },
              { label: "Pass %",         value: `${stats.passPct}%`, sub: `${stats.passCount} passed (Min: ${currentPass})`, color: stats.passPct >= 75 ? "text-emerald-600" : "text-amber-600" },
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

          {/* Marksheet Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {subjectCode}{subjectName ? ` - ${subjectName}` : ""} • {activeComp.label}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>Max Marks: <b className="text-slate-800 font-extrabold">{currentMax}</b></span>
                    <span>•</span>
                    <span>Min Pass Mark: <b className="text-indigo-600 font-extrabold">{currentPass}</b></span>
                    <span>•</span>
                    <span>Enter <b>A</b> for Absent</span>
                  </div>
                </div>

                {!isLocked && (
                  <button
                    onClick={openConfigModal}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 rounded-lg text-xs font-semibold shadow-2xs transition-all"
                    title="Change Max and Pass Marks for this subject"
                  >
                    <Edit3 className="w-3 h-3 text-indigo-500" />
                    <span>Change Criteria (Max: {currentMax}, Pass: {currentPass})</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isLocked && (
                  <button onClick={() => setShowAddStudent(true)} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700">
                    <Plus className="w-3.5 h-3.5" /> Add Student
                  </button>
                )}
                {!isLocked && (
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-[0.99]">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {saving ? "Saving..." : "Save Marks"}
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              {componentId === "consolidated" ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="text-left px-4 py-3 w-10">#</th>
                      <th className="text-left px-4 py-3">Roll No.</th>
                      <th className="text-left px-4 py-3">Student Name</th>
                      <th className="text-center px-3 py-3">CT-1 ({maxMarksConfig.cia1} / {passMarksConfig.cia1})</th>
                      <th className="text-center px-3 py-3">CT-2 ({maxMarksConfig.cia2} / {passMarksConfig.cia2})</th>
                      <th className="text-center px-3 py-3">Model ({maxMarksConfig.model} / {passMarksConfig.model})</th>
                      <th className="text-center px-3 py-3">Asgt ({maxMarksConfig.assignment} / {passMarksConfig.assignment})</th>
                      <th className="text-center px-3 py-3">Attd ({maxMarksConfig.attendance} / {passMarksConfig.attendance})</th>
                      <th className="text-center px-4 py-3 bg-blue-50/60 text-blue-800">Final CIA ({maxMarksConfig.consolidated} / Pass: {passMarksConfig.consolidated})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredStudents.map((s, idx) => {
                      const consScore = s.consolidated;
                      const hasCons = consScore !== null && consScore !== undefined;
                      const isConsPassed = hasCons && consScore >= passMarksConfig.consolidated;
                      return (
                        <tr key={s.rollNo} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-bold text-slate-700">{s.rollNo}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                          <td className="px-3 py-3 text-center text-slate-700">{s.cia1 ?? "-"}</td>
                          <td className="px-3 py-3 text-center text-slate-700">{s.cia2 ?? "-"}</td>
                          <td className="px-3 py-3 text-center text-slate-700">{s.model ?? "-"}</td>
                          <td className="px-3 py-3 text-center text-slate-700">{s.assignment ?? "-"}</td>
                          <td className="px-3 py-3 text-center text-slate-700">{s.attendance ?? "-"}</td>
                          <td className="px-4 py-3 text-center bg-blue-50/30">
                            <span className={`font-extrabold text-sm px-2 py-0.5 rounded-lg ${!hasCons ? 'text-slate-400' : isConsPassed ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                              {s.consolidated ?? "-"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
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
                      const isAbsent = current === "A";
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
                                onChange={(e) => handleMarkChange(s.rollNo, e.target.value)}
                                className={`w-16 text-center py-1 px-2 rounded-xl text-xs font-extrabold border transition-all ${isLocked ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed" : isAbsent ? "bg-amber-50 text-amber-700 border-amber-300" : isNum && !isPassed ? "bg-rose-50 text-rose-700 border-rose-300" : "bg-slate-50 text-slate-900 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"}`}
                                placeholder={`0-${currentMax}`}
                              />
                              {!isLocked && (
                                <button
                                  onClick={() => handleMarkChange(s.rollNo, isAbsent ? 0 : "A")}
                                  className={`p-1 rounded-lg text-[10px] font-bold border transition-all ${isAbsent ? "bg-amber-100 text-amber-800 border-amber-300" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-transparent"}`}
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

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>Showing {filteredStudents.length} of {students.length} students</span>
              {!isLocked && (
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-[0.99]">
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
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg z-10 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Set Max & Pass Marks</h3>
                  <p className="text-[11px] text-slate-500">Subject: {subjectCode}</p>
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
                Staff can customize both the <b>Maximum Achievable Marks</b> and the <b>Minimum Passing Mark</b> for each exam component. Student PASS/FAIL results and consolidated grades will recalculate automatically.
              </p>

              <div className="space-y-3">
                {[
                  { id: "cia1",         name: "Cycle Test 1 (CIA 1)", defaultM: 50, defaultP: 20 },
                  { id: "cia2",         name: "Cycle Test 2 (CIA 2)", defaultM: 50, defaultP: 20 },
                  { id: "model",        name: "Model Exam",           defaultM: 75, defaultP: 30 },
                  { id: "assignment",   name: "Assignment / Seminar", defaultM: 20, defaultP: 8  },
                  { id: "attendance",   name: "Attendance Score",     defaultM: 5,  defaultP: 2  },
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
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCriteria}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl text-xs font-bold text-white shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
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
              <h3 className="font-extrabold text-slate-900 text-base">Add Student</h3>
              <button onClick={() => setShowAddStudent(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number *</label>
                <input type="text" required placeholder="e.g., CS21001" value={newRollNo} onChange={(e) => setNewRollNo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student Name *</label>
                <input type="text" required placeholder="Full name" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddStudent(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white shadow-md shadow-blue-500/20">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
