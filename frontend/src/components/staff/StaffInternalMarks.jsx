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
  BarChart3,
  Award,
  TrendingUp,
  Users,
  Loader2,
  RefreshCw,
  Plus,
  X,
} from "lucide-react";
import { ASSESSMENT_COMPONENTS } from "./staffData";

const API = "http://localhost:5000/api";

/*
  ASSESSMENT_COMPONENTS from staffData.js (config only):
  { id: "cia1"|"cia2"|"model"|"assignment"|"attendance", label, maxMarks, weightage }

  Backend schema per student:
  { rollNo, name, cia1, cia2, model, assignment, attendance, consolidated }
*/

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

  // Modal to add student
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newRollNo,      setNewRollNo]      = useState("");
  const [newStudentName, setNewStudentName] = useState("");

  // -- Computed --------------------------------------------------------
  const activeComp = useMemo(
    () => ASSESSMENT_COMPONENTS.find((c) => c.id === componentId) || ASSESSMENT_COMPONENTS[0],
    [componentId]
  );

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
        if (m >= activeComp.maxMarks * 0.4) passCount++;
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
  }, [students, componentId, activeComp]);

  // -- Toast helper ----------------------------------------------------
  const toast = useCallback((msg, isError = false) => {
    if (isError) { setErrorMsg(msg); setSuccessMsg(""); }
    else         { setSuccessMsg(msg); setErrorMsg(""); }
    setTimeout(() => { setSuccessMsg(""); setErrorMsg(""); }, 4000);
  }, []);

  // -- Fetch marksheet -------------------------------------------------
  const fetchMarksheet = useCallback(async (code) => {
    if (!code) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/internal-marks/${staffId}/${encodeURIComponent(code)}`);
      const json = await res.json();
      if (json.success) {
        setStudents(json.data.students || []);
        setIsLocked(json.data.isLocked || false);
        setSubjectName(json.data.subjectName || "");
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
        }),
      });
      const json = await res.json();
      if (json.success) toast("Marks saved successfully!");
      else toast(json.message, true);
    } catch {
      toast("Server error while saving.", true);
    } finally {
      setSaving(false);
    }
  };

  // -- Lock / Unlock ---------------------------------------------------
  const handleToggleLock = async () => {
    if (!isLocked && !window.confirm(`Freeze and submit marks for ${subjectCode}? Modifications will be restricted.`)) return;
    // Save first, then lock
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
    if (numVal < 0 || numVal > activeComp.maxMarks) {
      setErrorMsg(`Marks for ${activeComp.label} must be 0–${activeComp.maxMarks}.`);
      return;
    }
    updateMark(rollNo, numVal);
  };

  const updateMark = (rollNo, value) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.rollNo !== rollNo) return s;
        const updated = { ...s, [componentId]: value };
        // Recalculate consolidated
        const c1  = updated.cia1  === "A" || updated.cia1  == null ? 0 : Number(updated.cia1);
        const c2  = updated.cia2  === "A" || updated.cia2  == null ? 0 : Number(updated.cia2);
        const mod = updated.model === "A" || updated.model == null ? 0 : Number(updated.model);
        const asg = updated.assignment != null ? Number(updated.assignment) : 0;
        const att = updated.attendance != null ? Number(updated.attendance) : 0;
        const calc = Math.round(((c1 + c2) / 100) * 10 + (mod / 75) * 5 + asg * 0.5 + att);
        updated.consolidated = Math.min(25, calc);
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
    let csv = "Roll No,Student Name,CIA-1,CIA-2,Model,Assignment,Attendance,Consolidated\n";
    students.forEach((s) => {
      csv += `"${s.rollNo}","${s.name}",${s.cia1 ?? "-"},${s.cia2 ?? "-"},${s.model ?? "-"},${s.assignment ?? "-"},${s.attendance ?? "-"},${s.consolidated ?? "-"}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `InternalMarks_${subjectCode}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
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
            Manage CIA marks, evaluate students, and submit to the Examination Controller
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {subjectCode && (
            <>
              <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-xs transition-all" title="Download CSV">
                <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
              </button>
              <button onClick={handleToggleLock} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${isLocked ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"}`}>
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

            {/* Assessment Tabs */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Assessment Component</label>
              <div className="flex overflow-x-auto gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70">
                {ASSESSMENT_COMPONENTS.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => setComponentId(comp.id)}
                    className={`flex-1 min-w-[110px] py-2 px-3 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap ${componentId === comp.id ? "bg-white text-blue-600 shadow-xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"}`}
                  >
                    {comp.label}
                  </button>
                ))}
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
              { label: "Total Students", value: stats.total,    sub: `${stats.absent} Absent`,  color: "text-slate-900" },
              { label: "Class Average",  value: stats.average,  sub: `/ ${activeComp.maxMarks}`, color: "text-blue-600" },
              { label: "Pass %",         value: `${stats.passPct}%`, sub: `${stats.passCount} passed`, color: stats.passPct >= 75 ? "text-emerald-600" : "text-amber-600" },
              { label: "Highest",        value: stats.highest,  sub: `/ ${activeComp.maxMarks}`, color: "text-emerald-600" },
              { label: "Lowest",         value: stats.lowest,   sub: `/ ${activeComp.maxMarks}`, color: "text-rose-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">{s.label}</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-xl font-extrabold ${s.color}`}>{s.value}</span>
                  <span className="text-[10px] text-slate-400">{s.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Marksheet Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {subjectCode}{subjectName ? ` — ${subjectName}` : ""} · {activeComp.label}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Max: <b>{activeComp.maxMarks}</b> | Enter <b>A</b> for Absent
                </p>
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
                      <th className="text-center px-3 py-3">CIA-1</th>
                      <th className="text-center px-3 py-3">CIA-2</th>
                      <th className="text-center px-3 py-3">Model</th>
                      <th className="text-center px-3 py-3">Asgt</th>
                      <th className="text-center px-3 py-3">Attd</th>
                      <th className="text-center px-4 py-3 bg-blue-50/60 text-blue-800">Final (25)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredStudents.map((s, idx) => (
                      <tr key={s.rollNo} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-700">{s.rollNo}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                        <td className="px-3 py-3 text-center text-slate-700">{s.cia1 ?? "-"}</td>
                        <td className="px-3 py-3 text-center text-slate-700">{s.cia2 ?? "-"}</td>
                        <td className="px-3 py-3 text-center text-slate-700">{s.model ?? "-"}</td>
                        <td className="px-3 py-3 text-center text-slate-700">{s.assignment ?? "-"}</td>
                        <td className="px-3 py-3 text-center text-slate-700">{s.attendance ?? "-"}</td>
                        <td className="px-4 py-3 text-center font-extrabold text-blue-700 bg-blue-50/30 text-sm">{s.consolidated ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="text-left px-5 py-3 w-12">#</th>
                      <th className="text-left px-5 py-3">Roll No.</th>
                      <th className="text-left px-5 py-3">Student Name</th>
                      <th className="text-center px-5 py-3 w-44">Marks ({activeComp.maxMarks})</th>
                      <th className="text-center px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredStudents.map((s, idx) => {
                      const current  = s[componentId];
                      const isAbsent = current === "A";
                      const isNum    = typeof current === "number";
                      const isPassed = isNum && current >= activeComp.maxMarks * 0.4;
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
                                placeholder="0"
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
                              <span className="text-slate-300 text-[10px]">—</span>
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
