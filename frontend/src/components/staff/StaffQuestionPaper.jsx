import React, { useState, useEffect } from "react";
import { API_BASE, BACKEND_URL } from '../../apiConfig';
import {
  FileText, Plus, Trash2, Edit3, Eye, Save, CheckCircle,
  ChevronDown, ChevronRight, BookOpen, Layers, X, AlertCircle,
  Archive, Send, RotateCcw, List, Clock, Award, Download,
  Table as TableIcon, Image as ImageIcon, UploadCloud, Check,
  MinusCircle, PlusCircle
} from "lucide-react";

const API = `${API_BASE}/question-papers`;

const EXAM_TYPES = ["Internal Test 1", "Internal Test 2", "Model Exam", "Semester Exam", "Retest"];
const QUESTION_TYPES = ["MCQ", "5 Mark", "8 Mark"];
const STATUS_COLORS = {
  Draft:     "bg-amber-100 text-amber-700 border-amber-200",
  Published: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Archived:  "bg-slate-100 text-slate-500 border-slate-200"
};
const STATUS_ICONS = { Draft: Edit3, Published: CheckCircle, Archived: Archive };

const blankQuestion = (no, type = "MCQ") => ({
  questionNo: no,
  text: "",
  marks: type === "MCQ" ? 1 : (type === "8 Mark" ? 8 : 5),
  unit: "",
  type: type,
  options: type === "MCQ" ? ["Option A", "Option B", "Option C", "Option D"] : [],
  answer: "",
  hasTable: false,
  tableData: {
    headers: ["Parameter", "Description / Value"],
    rows: [["Row 1", "Data 1"], ["Row 2", "Data 2"]]
  },
  hasImage: false,
  imageUrl: "",
  imageCaption: ""
});

const blankSection = () => ({
  sectionLabel: "Section A",
  instructions: "Answer all questions.",
  totalMarks: 0,
  questions: [blankQuestion(1, "MCQ")]
});

const blankPaper = (staffUser) => ({
  staffId: staffUser?.staffId || "",
  staffName: staffUser?.name || "",
  department: staffUser?.department || "",
  subjectCode: "",
  subjectName: "",
  semester: 1,
  year: 1,
  section: "A",
  examType: "Internal Test 1",
  duration: "3 Hours",
  totalMarks: 100,
  instructions: "1. Answer all questions.\n2. Use blue/black ink pen.",
  status: "Draft",
  sections: [blankSection()],
  academicYear: "2025-2026"
});

export default function StaffQuestionPaper({ staffUser }) {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [current, setCurrent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [expandedSection, setExpandedSection] = useState(0);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { fetchPapers(); }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/staff/${staffUser?.staffId}`);
      const d = await r.json();
      if (d.success) setPapers(d.data);
    } catch { showToast("Failed to fetch papers", "error"); }
    setLoading(false);
  };

  const openNew = () => { setCurrent(blankPaper(staffUser)); setExpandedSection(0); setView("editor"); };
  const openEdit = (paper) => { setCurrent(JSON.parse(JSON.stringify(paper))); setExpandedSection(0); setView("editor"); };
  const openPreview = (paper) => { setCurrent(JSON.parse(JSON.stringify(paper))); setView("preview"); };

  const savePaper = async () => {
    if (!current.subjectCode?.trim()) { showToast("Subject Code is required", "error"); return; }
    if (!current.subjectName?.trim()) { showToast("Subject Name is required", "error"); return; }
    if (!current.staffId?.trim()) { showToast("Staff ID missing – please re-login", "error"); return; }

    setSaving(true);
    try {
      const updated = {
        ...current,
        staffId: current.staffId || staffUser?.staffId || "",
        staffName: current.staffName || staffUser?.name || "",
        department: current.department || staffUser?.department || "",
        sections: current.sections.map(s => ({
          ...s,
          totalMarks: s.questions.reduce((a, q) => a + Number(q.marks || 0), 0)
        }))
      };
      const url = updated._id ? `${API}/${updated._id}` : API;
      const method = updated._id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (data.success) {
        showToast("Question paper saved successfully!");
        fetchPapers();
        setView("list");
      } else { showToast(data.message || "Failed to save paper", "error"); }
    } catch { showToast("Network error saving paper", "error"); }
    setSaving(false);
  };

  const changeStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Status updated to ${status}`);
        fetchPapers();
      }
    } catch { showToast("Failed to update status", "error"); }
  };

  const deletePaper = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Paper deleted");
        setDeleteId(null);
        fetchPapers();
      }
    } catch { showToast("Failed to delete paper", "error"); }
  };

  const updateField = (path, val) => {
    const keys = path.split(".");
    setCurrent(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      let cur = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = val;
      return copy;
    });
  };

  const updateQuestion = (si, qi, field, val) => {
    setCurrent(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.sections[si].questions[qi][field] = val;
      return copy;
    });
  };

  const handleTypeSelect = (si, qi, newType) => {
    const defaultMarks = newType === "MCQ" ? 1 : (newType === "8 Mark" ? 8 : 5);
    setCurrent(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const q = copy.sections[si].questions[qi];
      q.type = newType;
      q.marks = defaultMarks;
      if (newType === "MCQ" && (!q.options || q.options.length === 0)) {
        q.options = ["Option A", "Option B", "Option C", "Option D"];
      }
      return copy;
    });
  };

  const addQuestion = (si) => {
    setCurrent(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const nextNo = copy.sections[si].questions.length + 1;
      copy.sections[si].questions.push(blankQuestion(nextNo, "MCQ"));
      return copy;
    });
  };

  const removeQuestion = (si, qi) => {
    setCurrent(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.sections[si].questions.splice(qi, 1);
      copy.sections[si].questions.forEach((q, i) => { q.questionNo = i + 1; });
      return copy;
    });
  };

  const addSection = () => {
    setCurrent(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const letter = String.fromCharCode(65 + copy.sections.length);
      copy.sections.push({
        sectionLabel: `Section ${letter}`,
        instructions: "Answer all questions.",
        totalMarks: 0,
        questions: [blankQuestion(1, "5 Mark")]
      });
      return copy;
    });
    setExpandedSection(current?.sections ? current.sections.length : 0);
  };

  const removeSection = (si) => {
    setCurrent(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.sections.splice(si, 1);
      return copy;
    });
    setExpandedSection(0);
  };

  // Table manipulation helpers
  const toggleTable = (si, qi) => {
    setCurrent(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const q = copy.sections[si].questions[qi];
      q.hasTable = !q.hasTable;
      if (q.hasTable && (!q.tableData || !q.tableData.headers || q.tableData.headers.length === 0)) {
        q.tableData = {
          headers: ["Column 1", "Column 2"],
          rows: [["Data 1", "Data 2"]]
        };
      }
      return copy;
    });
  };

  const addTableColumn = (si, qi) => {
    setCurrent(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const q = copy.sections[si].questions[qi];
      const colNum = (q.tableData.headers.length || 0) + 1;
      q.tableData.headers.push(`Column ${colNum}`);
      q.tableData.rows.forEach(r => r.push(`Data`));
      return copy;
    });
  };

  const addTableRow = (si, qi) => {
    setCurrent(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const q = copy.sections[si].questions[qi];
      const newRow = new Array(q.tableData.headers.length).fill("");
      q.tableData.rows.push(newRow);
      return copy;
    });
  };

  const removeTableRow = (si, qi, ri) => {
    setCurrent(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const q = copy.sections[si].questions[qi];
      q.tableData.rows.splice(ri, 1);
      return copy;
    });
  };

  // Image manipulation helpers
  const handleImageUpload = (si, qi, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image is larger than 2MB. Please upload a smaller image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target.result;
      setCurrent(prev => {
        const copy = JSON.parse(JSON.stringify(prev));
        const q = copy.sections[si].questions[qi];
        q.hasImage = true;
        q.imageUrl = dataUrl;
        return copy;
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (si, qi) => {
    setCurrent(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const q = copy.sections[si].questions[qi];
      q.hasImage = false;
      q.imageUrl = "";
      q.imageCaption = "";
      return copy;
    });
  };

  if (view === "preview" && current) {
    return <PreviewView paper={current} onBack={() => setView(papers.length ? "list" : "editor")} />;
  }

  if (view === "editor" && current) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 animate-fadeIn pb-16">
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold ${toast.type === "error" ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setView("list")} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer">
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {current._id ? "Edit Question Paper" : "Create Question Paper"}
              </h2>
              <p className="text-xs text-slate-500">Method: MCQ, 5 Mark & 8 Mark Questions with Tables & Diagrams</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openPreview(current)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer">
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button onClick={savePaper} disabled={saving} className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer">
              <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Paper"}
            </button>
          </div>
        </div>

        {/* Paper Metadata Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Exam Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Subject Code *</label>
              <input value={current.subjectCode} onChange={e => updateField("subjectCode", e.target.value.toUpperCase())} placeholder="e.g. CS301" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase" required />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Subject Name *</label>
              <input value={current.subjectName} onChange={e => updateField("subjectName", e.target.value)} placeholder="e.g. Data Structures & Algorithms" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold" required />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Exam Type</label>
              <select value={current.examType} onChange={e => updateField("examType", e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer">
                {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Department</label>
              <input value={current.department} onChange={e => updateField("department", e.target.value)} placeholder="e.g. Computer Science" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Semester</label>
              <select value={current.semester} onChange={e => updateField("semester", Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer">
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Duration</label>
              <input value={current.duration} onChange={e => updateField("duration", e.target.value)} placeholder="3 Hours" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Maximum Marks</label>
              <input type="number" value={current.totalMarks} onChange={e => updateField("totalMarks", Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Academic Year</label>
              <input value={current.academicYear} onChange={e => updateField("academicYear", e.target.value)} placeholder="2025-2026" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold" />
            </div>
          </div>
        </div>

        {/* Sections & Questions Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Exam Sections & Questions (MCQ, 5 Mark, 8 Mark)</span>
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {(current.sections || []).length} Sections
            </span>
          </div>

          {(current.sections || []).map((sec, si) => {
            const isOpen = expandedSection === si;
            const secMarks = (sec.questions || []).reduce((a, q) => a + Number(q.marks || 0), 0);

            return (
              <div key={si} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                {/* Section Header */}
                <div 
                  className="p-4 sm:p-5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition cursor-pointer border-b border-slate-100"
                  onClick={() => setExpandedSection(isOpen ? -1 : si)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-black flex items-center justify-center text-xs shrink-0">
                      {si + 1}
                    </div>
                    <div>
                      <input 
                        value={sec.sectionLabel} 
                        onClick={e => e.stopPropagation()} 
                        onChange={e => updateField(`sections.${si}.sectionLabel`, e.target.value)} 
                        className="font-extrabold text-slate-900 text-sm bg-transparent border-none outline-none focus:bg-white px-2 py-0.5 rounded-lg" 
                      />
                      <span className="text-xs text-slate-500 font-medium block ml-2">
                        {sec.questions.length} Questions · Total {secMarks} Marks
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {current.sections.length > 1 && (
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); removeSection(si); }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Section Questions */}
                {isOpen && (
                  <div className="p-5 sm:p-6 space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Section Instructions
                      </label>
                      <input 
                        value={sec.instructions} 
                        onChange={e => updateField(`sections.${si}.instructions`, e.target.value)} 
                        placeholder="e.g. Answer all questions. Each carries 5 marks." 
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium" 
                      />
                    </div>

                    <div className="space-y-4 pt-2">
                      {sec.questions.map((q, qi) => (
                        <div key={qi} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3.5 hover:border-blue-200 transition">
                          
                          {/* Question Top Row: Q Number, Type Selector, Marks, Unit, Delete */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                                {q.questionNo}
                              </span>
                              <span className="text-xs font-bold text-slate-700">Question {q.questionNo}</span>
                            </div>

                            {/* Method Selector: MCQ, 5 Mark, 8 Mark */}
                            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                              {QUESTION_TYPES.map(t => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => handleTypeSelect(si, qi, t)}
                                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                                    q.type === t 
                                      ? 'bg-blue-600 text-white shadow-2xs' 
                                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>

                            {/* Marks & Unit */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Marks:</span>
                                <input
                                  type="number"
                                  min={1}
                                  value={q.marks}
                                  onChange={e => updateQuestion(si, qi, "marks", Number(e.target.value))}
                                  className="w-14 p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Unit:</span>
                                <input
                                  type="text"
                                  placeholder="Unit I"
                                  value={q.unit}
                                  onChange={e => updateQuestion(si, qi, "unit", e.target.value)}
                                  className="w-16 p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-center"
                                />
                              </div>
                              {sec.questions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeQuestion(si, qi)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                  title="Remove Question"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Question Text */}
                          <div>
                            <textarea
                              rows={2}
                              value={q.text}
                              onChange={e => updateQuestion(si, qi, "text", e.target.value)}
                              placeholder={`Type your ${q.type} question statement here...`}
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs resize-none"
                            />
                          </div>

                          {/* MCQ Options (Shown when MCQ is selected) */}
                          {q.type === "MCQ" && (
                            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                Multiple Choice Options
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {["A", "B", "C", "D"].map((optLetter, optIdx) => (
                                  <div key={optIdx} className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                                      {optLetter}
                                    </span>
                                    <input
                                      type="text"
                                      placeholder={`Option ${optLetter}`}
                                      value={q.options?.[optIdx] || ""}
                                      onChange={(e) => {
                                        const newOpts = [...(q.options || ["", "", "", ""])];
                                        newOpts[optIdx] = e.target.value;
                                        updateQuestion(si, qi, "options", newOpts);
                                      }}
                                      className="flex-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* TABLE FORMAT BUILDER (Requirement 2) */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => toggleTable(si, qi)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                  q.hasTable 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' 
                                    : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                                }`}
                              >
                                <TableIcon className="w-3.5 h-3.5" />
                                <span>{q.hasTable ? "Table Format Included ✓" : "+ Add Table Format"}</span>
                              </button>

                              {/* IMAGE FORMAT UPLOAD (Requirement 2) */}
                              <div className="flex items-center gap-2">
                                <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                  q.hasImage 
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-2xs' 
                                    : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'
                                }`}>
                                  <ImageIcon className="w-3.5 h-3.5" />
                                  <span>{q.hasImage ? "Diagram / Image Attached ✓" : "+ Upload Image Format"}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(si, qi, e)}
                                  />
                                </label>
                              </div>
                            </div>

                            {/* Active Table Editor */}
                            {q.hasTable && q.tableData && (
                              <div className="p-3 bg-white rounded-xl border border-indigo-200 space-y-3">
                                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                                  <span className="text-[11px] font-extrabold text-indigo-900 flex items-center gap-1.5">
                                    <TableIcon className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Interactive Question Table</span>
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => addTableColumn(si, qi)}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold cursor-pointer"
                                    >
                                      <PlusCircle className="w-3 h-3" /> Add Column
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => addTableRow(si, qi)}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold cursor-pointer"
                                    >
                                      <PlusCircle className="w-3 h-3" /> Add Row
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => toggleTable(si, qi)}
                                      className="text-slate-400 hover:text-rose-600 text-[10px] font-bold cursor-pointer ml-1"
                                    >
                                      Remove Table
                                    </button>
                                  </div>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs border border-indigo-100 rounded-lg">
                                    <thead>
                                      <tr className="bg-indigo-50/70 border-b border-indigo-200">
                                        {(q.tableData.headers || []).map((head, hi) => (
                                          <th key={hi} className="p-2">
                                            <input
                                              type="text"
                                              value={head}
                                              onChange={(e) => {
                                                const newH = [...q.tableData.headers];
                                                newH[hi] = e.target.value;
                                                updateQuestion(si, qi, "tableData", { ...q.tableData, headers: newH });
                                              }}
                                              className="w-full p-1 bg-white border border-indigo-200 rounded text-xs font-bold text-slate-800 text-center"
                                              placeholder={`Header ${hi + 1}`}
                                            />
                                          </th>
                                        ))}
                                        <th className="w-8"></th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-indigo-50">
                                      {(q.tableData.rows || []).map((row, ri) => (
                                        <tr key={ri}>
                                          {row.map((cell, ci) => (
                                            <td key={ci} className="p-1.5">
                                              <input
                                                type="text"
                                                value={cell}
                                                onChange={(e) => {
                                                  const newR = JSON.parse(JSON.stringify(q.tableData.rows));
                                                  newR[ri][ci] = e.target.value;
                                                  updateQuestion(si, qi, "tableData", { ...q.tableData, rows: newR });
                                                }}
                                                className="w-full p-1 bg-white border border-slate-200 rounded text-xs text-slate-800 text-center"
                                                placeholder="Cell value"
                                              />
                                            </td>
                                          ))}
                                          <td className="p-1.5 text-center">
                                            {q.tableData.rows.length > 1 && (
                                              <button
                                                type="button"
                                                onClick={() => removeTableRow(si, qi, ri)}
                                                className="text-slate-300 hover:text-rose-600"
                                                title="Delete Row"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Active Image Attachment Preview */}
                            {q.hasImage && q.imageUrl && (
                              <div className="p-3 bg-white rounded-xl border border-purple-200 flex items-start gap-4">
                                <img
                                  src={q.imageUrl}
                                  alt="Question diagram"
                                  className="w-24 h-24 object-contain rounded-lg border border-purple-100 bg-slate-50 shrink-0"
                                />
                                <div className="flex-1 space-y-2">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                      Diagram / Figure Caption (Optional)
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Figure 1: Circuit diagram / Entity Relationship Schema"
                                      value={q.imageCaption || ""}
                                      onChange={(e) => updateQuestion(si, qi, "imageCaption", e.target.value)}
                                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeImage(si, qi)}
                                    className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" /> Remove Image
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addQuestion(si)}
                      className="mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 text-xs font-bold hover:bg-blue-50 transition w-full cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Question (MCQ / 5M / 8M)
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={addSection}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border-2 border-dashed border-indigo-200 text-indigo-600 text-xs font-extrabold hover:bg-indigo-50 transition w-full cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Another Section
          </button>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 animate-fadeIn pb-16">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold ${toast.type === "error" ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"}`}>
          {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Question Papers</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create and manage exam question papers with MCQ, 5 Mark, 8 Mark, formatted tables, and diagrams
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Question Paper</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Papers", value: papers.length, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Published", value: papers.filter(p => p.status === "Published").length, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Drafts", value: papers.filter(p => p.status === "Draft").length, icon: Edit3, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Archived", value: papers.filter(p => p.status === "Archived").length, icon: Archive, color: "text-slate-500", bg: "bg-slate-100" }
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 font-semibold">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Papers List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <Clock className="w-7 h-7 mx-auto animate-spin text-blue-500" />
          <p className="text-xs font-bold text-slate-600 mt-2">Loading question papers...</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <FileText className="w-12 h-12 mx-auto text-blue-500/40" />
          <h3 className="text-base font-bold text-slate-800">No Question Papers Created Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Get started by creating your first exam paper with MCQ, 5 Mark, 8 Mark questions, tabular problems, and figures.
          </p>
          <button
            onClick={openNew}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
          >
            Create Question Paper
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {papers.map(paper => {
            const StatusIcon = STATUS_ICONS[paper.status] || Edit3;
            const totalQ = (paper.sections || []).reduce((a, s) => a + s.questions.length, 0);

            return (
              <div key={paper._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-200 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 text-white">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-extrabold text-slate-900 text-sm truncate">{paper.subjectName || "Untitled"}</h3>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${STATUS_COLORS[paper.status]}`}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {paper.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {paper.subjectCode} · {paper.examType} · Semester {paper.semester}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{paper.duration}</span>
                        <span className="flex items-center gap-1"><Award className="w-3 h-3" />{paper.totalMarks} Marks</span>
                        <span className="flex items-center gap-1"><List className="w-3 h-3" />{totalQ} Questions</span>
                        <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{(paper.sections || []).length} Sections</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <button onClick={() => openPreview(paper)} title="Preview & Print" className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition cursor-pointer">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEdit(paper)} title="Edit Paper" className="p-2 rounded-xl hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition cursor-pointer">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {paper.status === "Draft" && (
                      <button onClick={() => changeStatus(paper._id, "Published")} title="Publish" className="p-2 rounded-xl hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition cursor-pointer">
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    {paper.status === "Published" && (
                      <button onClick={() => changeStatus(paper._id, "Archived")} title="Archive" className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-600 transition cursor-pointer">
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                    {paper.status === "Archived" && (
                      <button onClick={() => changeStatus(paper._id, "Draft")} title="Restore to Draft" className="p-2 rounded-xl hover:bg-amber-50 text-slate-500 hover:text-amber-600 transition cursor-pointer">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => setDeleteId(paper._id)} title="Delete Paper" className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Delete Question Paper?</h3>
              <p className="text-xs text-slate-500 mt-1">This paper and its questions will be permanently deleted.</p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => deletePaper(deleteId)} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold text-white shadow-md shadow-rose-600/20">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// PREVIEW & PRINT COMPONENT
function PreviewView({ paper, onBack }) {
  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) {
      alert("Please allow popups to print question paper.");
      return;
    }

    const sectionsHtml = (paper.sections || []).map(sec => {
      const tot = sec.questions.reduce((a, q) => a + Number(q.marks || 0), 0);
      const qsHtml = sec.questions.map(q => {
        let extraContent = "";
        
        // MCQ Options
        if (q.type === "MCQ" && q.options?.length) {
          extraContent += `<div class="mcq-grid">${q.options.map((opt, oi) => `<span>(${String.fromCharCode(97+oi)}) ${opt}</span>`).join("")}</div>`;
        }

        // Table
        if (q.hasTable && q.tableData?.headers?.length) {
          extraContent += `
            <table class="q-table">
              <thead>
                <tr>${q.tableData.headers.map(h => `<th>${h}</th>`).join("")}</tr>
              </thead>
              <tbody>
                ${(q.tableData.rows || []).map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}
              </tbody>
            </table>
          `;
        }

        // Image
        if (q.hasImage && q.imageUrl) {
          extraContent += `
            <div class="q-image-box">
              <img src="${q.imageUrl}" class="q-img" />
              ${q.imageCaption ? `<div class="q-caption">${q.imageCaption}</div>` : ""}
            </div>
          `;
        }

        return `
          <div class="question-row">
            <span class="q-no">${q.questionNo}.</span>
            <div class="q-body">
              <div class="q-text">${q.text}</div>
              ${extraContent}
            </div>
            <span class="q-marks">[${q.marks}M]</span>
          </div>
        `;
      }).join("");

      return `
        <div class="section-block">
          <div class="section-heading">${sec.sectionLabel}${sec.instructions ? " — " + sec.instructions : ""} (${tot} Marks)</div>
          ${qsHtml}
        </div>
      `;
    }).join("");

    const instHtml = paper.instructions ? `<div class="instructions-box"><strong>Instructions:</strong><br/>${paper.instructions.replace(/\n/g,"<br/>")}</div>` : "";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${paper.subjectCode} - ${paper.subjectName} (${paper.examType})</title>
        <style>
          body { font-family: 'Times New Roman', serif; margin: 40px; color: #111; line-height: 1.4; }
          .inst-header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 18px; }
          .college-name { font-size: 20px; font-weight: bold; text-transform: uppercase; margin: 0; }
          .exam-title { font-size: 16px; font-weight: bold; margin: 4px 0; }
          .meta-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; font-weight: bold; }
          .meta-table td { padding: 4px; }
          .instructions-box { border: 1px solid #333; padding: 10px; margin: 15px 0; font-size: 12.5px; }
          .section-block { margin: 25px 0; }
          .section-heading { font-weight: bold; font-size: 14.5px; border-bottom: 1px solid #333; padding-bottom: 4px; margin-bottom: 14px; text-transform: uppercase; }
          .question-row { display: flex; gap: 10px; margin-bottom: 16px; font-size: 14px; }
          .q-no { font-weight: bold; min-width: 25px; }
          .q-body { flex: 1; }
          .q-text { font-size: 14px; }
          .q-marks { font-weight: bold; font-style: italic; min-width: 45px; text-align: right; }
          .mcq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; font-size: 13px; }
          .q-table { width: auto; min-width: 60%; margin: 10px 0; border-collapse: collapse; font-size: 12.5px; }
          .q-table th, .q-table td { border: 1px solid #333; padding: 5px 10px; text-align: center; }
          .q-table th { background: #f2f2f2; }
          .q-image-box { margin: 10px 0; }
          .q-img { max-width: 320px; max-height: 220px; object-fit: contain; border: 1px solid #ccc; }
          .q-caption { font-size: 11.5px; font-style: italic; color: #555; margin-top: 4px; }
          @media print { body { margin: 25px; } }
        </style>
      </head>
      <body>
        <div class="inst-header">
          <div class="college-name">Vivekananda College of Arts and Science</div>
          <div class="exam-title">${paper.examType} Examination — ${paper.academicYear || "2025-2026"}</div>
          <table class="meta-table">
            <tr>
              <td>Subject: ${paper.subjectCode} – ${paper.subjectName}</td>
              <td style="text-align: right;">Semester: ${paper.semester}</td>
            </tr>
            <tr>
              <td>Duration: ${paper.duration}</td>
              <td style="text-align: right;">Max. Marks: ${paper.totalMarks}</td>
            </tr>
          </table>
        </div>
        ${instHtml}
        ${sectionsHtml}
      </body>
      </html>
    `;
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); }, 250);
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 overflow-hidden pb-12">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-extrabold text-slate-900 text-base">{paper.subjectName}</h2>
            <p className="text-xs text-slate-500">{paper.subjectCode} · {paper.examType}</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Visual Paper Sheet */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white max-w-4xl mx-auto rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-12 font-serif text-slate-900 space-y-6">
          
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1">
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
              Vivekananda College of Arts and Science
            </h1>
            <h2 className="text-base font-bold text-slate-700">
              {paper.examType} Examination — {paper.academicYear || "2025-2026"}
            </h2>
            <div className="flex flex-wrap items-center justify-between pt-3 text-xs font-bold text-slate-700 border-t border-slate-200 mt-3 font-sans">
              <span>Subject: {paper.subjectCode} – {paper.subjectName}</span>
              <span>Semester: {paper.semester}</span>
              <span>Duration: {paper.duration}</span>
              <span>Max Marks: {paper.totalMarks}</span>
            </div>
          </div>

          {paper.instructions && (
            <div className="border border-slate-300 rounded-xl p-3.5 text-xs bg-slate-50/70 font-sans">
              <strong className="block mb-1">Instructions:</strong>
              {paper.instructions.split("\n").map((l, i) => <span key={i} className="block text-slate-700">{l}</span>)}
            </div>
          )}

          {/* Sections */}
          {(paper.sections || []).map((sec, si) => {
            const tot = sec.questions.reduce((a, q) => a + Number(q.marks || 0), 0);
            return (
              <div key={si} className="space-y-4 pt-2">
                <div className="border-b border-slate-800 pb-1 flex justify-between items-end">
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">
                    {sec.sectionLabel} {sec.instructions && <span className="font-normal normal-case text-slate-500 text-xs">— {sec.instructions}</span>}
                  </h3>
                  <span className="text-xs font-bold text-slate-700">({tot} Marks)</span>
                </div>

                <div className="space-y-4">
                  {sec.questions.map((q, qi) => (
                    <div key={qi} className="flex items-start gap-3 text-xs leading-relaxed">
                      <span className="font-black text-slate-900 shrink-0 w-6">{q.questionNo}.</span>
                      <div className="flex-1 space-y-2">
                        <div className="text-slate-900 font-medium">
                          {q.text || <span className="italic text-slate-400">Empty question statement</span>}
                        </div>

                        {/* MCQ Options Display */}
                        {q.type === "MCQ" && q.options?.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-1.5 text-xs text-slate-700">
                                <span className="font-bold">({String.fromCharCode(97+oi)})</span>
                                <span>{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Table Display */}
                        {q.hasTable && q.tableData?.headers?.length > 0 && (
                          <div className="pt-2 font-sans overflow-x-auto">
                            <table className="border-collapse border border-slate-400 text-xs">
                              <thead>
                                <tr className="bg-slate-100">
                                  {q.tableData.headers.map((h, hi) => (
                                    <th key={hi} className="border border-slate-400 px-3 py-1 font-bold text-slate-800">
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(q.tableData.rows || []).map((row, ri) => (
                                  <tr key={ri}>
                                    {row.map((cell, ci) => (
                                      <td key={ci} className="border border-slate-400 px-3 py-1 text-center text-slate-700">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Image / Diagram Display */}
                        {q.hasImage && q.imageUrl && (
                          <div className="pt-2 font-sans">
                            <img src={q.imageUrl} alt="Diagram" className="max-w-xs max-h-48 border border-slate-300 rounded-lg p-1 bg-white" />
                            {q.imageCaption && (
                              <p className="text-[11px] text-slate-500 italic mt-1 font-sans">{q.imageCaption}</p>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="font-bold italic text-slate-600 shrink-0 self-start ml-2">[{q.marks}M]</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
