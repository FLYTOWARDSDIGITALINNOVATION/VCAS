import React, { useState, useEffect } from "react";
import {
  FileText, Plus, Trash2, Edit3, Eye, Save, CheckCircle,
  ChevronDown, ChevronRight, BookOpen, Layers, X, AlertCircle,
  Archive, Send, RotateCcw, List, Clock, Award, Download
} from "lucide-react";

const API = "http://localhost:5000/api/question-papers";

const EXAM_TYPES = ["Internal Test 1", "Internal Test 2", "Model Exam", "Semester Exam", "Retest"];
const QUESTION_TYPES = ["Short", "Long", "Essay", "MCQ"];
const STATUS_COLORS = {
  Draft:     "bg-amber-100 text-amber-700 border-amber-200",
  Published: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Archived:  "bg-slate-100 text-slate-500 border-slate-200"
};
const STATUS_ICONS = { Draft: Edit3, Published: CheckCircle, Archived: Archive };

const blankSection = () => ({
  sectionLabel: "Section A",
  instructions: "Answer all questions.",
  totalMarks: 0,
  questions: [blankQuestion(1)]
});

const blankQuestion = (no) => ({
  questionNo: no,
  text: "",
  marks: 5,
  unit: "",
  type: "Short",
  options: [],
  answer: ""
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
  const staffSubjects = staffUser?.classes || [];

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
    // Validate required fields
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
      updated.totalMarks = updated.sections.reduce((a, s) => a + s.totalMarks, 0);

      const method = updated._id ? "PUT" : "POST";
      const url = updated._id ? `${API}/${updated._id}` : API;

      console.log("[QP] Saving to:", url, "Method:", method);
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
      const d = await r.json();
      console.log("[QP] Response:", d);

      if (d.success) { showToast("Paper saved successfully!"); await fetchPapers(); setView("list"); }
      else showToast(d.message || "Save failed", "error");
    } catch (err) {
      console.error("[QP] Save error:", err);
      showToast("Network error: " + (err.message || "Cannot reach server"), "error");
    }
    setSaving(false);
  };

  const changeStatus = async (id, status) => {
    try {
      const r = await fetch(`${API}/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const d = await r.json();
      if (d.success) { showToast(`Status updated to ${status}`); fetchPapers(); }
    } catch { showToast("Failed", "error"); }
  };

  const deletePaper = async (id) => {
    try {
      const r = await fetch(`${API}/${id}`, { method: "DELETE" });
      const d = await r.json();
      if (d.success) { showToast("Paper deleted"); fetchPapers(); }
    } catch { showToast("Failed", "error"); }
    setDeleteId(null);
  };

  const updateField = (path, value) => {
    const keys = path.split(".");
    setCurrent(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const addSection = () => {
    setCurrent(prev => ({ ...prev, sections: [...prev.sections, { sectionLabel: `Section ${String.fromCharCode(65 + prev.sections.length)}`, instructions: "", totalMarks: 0, questions: [blankQuestion(1)] }] }));
    setExpandedSection((current?.sections?.length) || 0);
  };

  const removeSection = (si) => {
    setCurrent(prev => ({ ...prev, sections: prev.sections.filter((_, i) => i !== si) }));
    setExpandedSection(0);
  };

  const addQuestion = (si) => {
    setCurrent(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.sections[si].questions.push(blankQuestion(next.sections[si].questions.length + 1));
      return next;
    });
  };

  const removeQuestion = (si, qi) => {
    setCurrent(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.sections[si].questions.splice(qi, 1);
      next.sections[si].questions.forEach((q, i) => { q.questionNo = i + 1; });
      return next;
    });
  };

  const updateQuestion = (si, qi, field, value) => {
    setCurrent(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.sections[si].questions[qi][field] = value;
      return next;
    });
  };

  const fillFromSubject = (s) => setCurrent(prev => ({ ...prev, subjectCode: s.code, subjectName: s.name, semester: s.semester, year: s.year, section: s.section || "A" }));

  if (view === "preview" && current) return <PreviewView paper={current} onBack={() => setView("list")} />;

  if (view === "editor" && current) return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("list")} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-all"><X className="w-5 h-5" /></button>
          <div>
            <h2 className="font-bold text-slate-900 text-base">{current._id ? "Edit Question Paper" : "New Question Paper"}</h2>
            <p className="text-xs text-slate-500">{current.subjectName || "Configure below"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openPreview(current)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"><Eye className="w-4 h-4" /> Preview</button>
          <button onClick={savePaper} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-60"><Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Paper"}</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {staffSubjects.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-700 mb-2">Quick Fill from My Subjects</p>
            <div className="flex flex-wrap gap-2">
              {staffSubjects.map((s, i) => (
                <button key={i} onClick={() => fillFromSubject(s)} className="px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-xs font-semibold text-blue-700 hover:bg-blue-600 hover:text-white transition-all shadow-sm">{s.code} – {s.name}</button>
              ))}
            </div>
          </div>
        )}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-600" /> Paper Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[{label:"Subject Code",field:"subjectCode"},{label:"Subject Name",field:"subjectName"},{label:"Academic Year",field:"academicYear"},{label:"Duration",field:"duration"}].map(({label,field}) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
                <input value={current[field]} onChange={e => updateField(field, e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Exam Type</label>
              <select value={current.examType} onChange={e => updateField("examType", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition">
                {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Semester</label>
              <select value={current.semester} onChange={e => updateField("semester", Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition">
                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1">General Instructions</label>
            <textarea value={current.instructions} onChange={e => updateField("instructions", e.target.value)} rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition resize-none" />
          </div>
        </div>
        <div className="space-y-4">
          {current.sections.map((sec, si) => {
            const sectionTotal = sec.questions.reduce((a, q) => a + Number(q.marks || 0), 0);
            const isOpen = expandedSection === si;
            return (
              <div key={si} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-all" onClick={() => setExpandedSection(isOpen ? -1 : si)}>
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center"><Layers className="w-4 h-4 text-indigo-600" /></div>
                  <input value={sec.sectionLabel} onClick={e => e.stopPropagation()} onChange={e => updateField(`sections.${si}.sectionLabel`, e.target.value)} className="font-bold text-slate-800 text-sm bg-transparent border-none outline-none focus:bg-slate-100 rounded-lg px-2 py-0.5 transition" />
                  <span className="ml-auto text-xs font-semibold text-slate-500">{sec.questions.length} Qs · {sectionTotal} Marks</span>
                  {current.sections.length > 1 && <button onClick={e => { e.stopPropagation(); removeSection(si); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all ml-1"><Trash2 className="w-3.5 h-3.5" /></button>}
                  {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 ml-1" /> : <ChevronRight className="w-4 h-4 text-slate-400 ml-1" />}
                </div>
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-slate-100">
                    <div className="mt-3 mb-4">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Section Instructions</label>
                      <input value={sec.instructions} onChange={e => updateField(`sections.${si}.instructions`, e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
                    </div>
                    <div className="space-y-3">
                      {sec.questions.map((q, qi) => (
                        <div key={qi} className="border border-slate-100 rounded-xl p-4 bg-slate-50 hover:border-blue-200 transition-all group">
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">{q.questionNo}</div>
                            <div className="flex-1 space-y-2">
                              <textarea value={q.text} onChange={e => updateQuestion(si, qi, "text", e.target.value)} placeholder="Enter question text..." rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none transition" />
                              <div className="flex flex-wrap gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Type</label>
                                  <select value={q.type} onChange={e => updateQuestion(si, qi, "type", e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                    {QUESTION_TYPES.map(t => <option key={t}>{t}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Marks</label>
                                  <input type="number" min={1} value={q.marks} onChange={e => updateQuestion(si, qi, "marks", Number(e.target.value))} className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Unit</label>
                                  <input value={q.unit} onChange={e => updateQuestion(si, qi, "unit", e.target.value)} placeholder="Unit I" className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                                </div>
                              </div>
                              {q.type === "MCQ" && (
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Options (one per line)</label>
                                  <textarea value={(q.options || []).join("\n")} onChange={e => updateQuestion(si, qi, "options", e.target.value.split("\n"))} rows={4} placeholder="a) Option 1" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none" />
                                </div>
                              )}
                            </div>
                            {sec.questions.length > 1 && <button onClick={() => removeQuestion(si, qi)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => addQuestion(si)} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 text-xs font-semibold hover:border-blue-400 hover:bg-blue-50 transition-all w-full justify-center"><Plus className="w-3.5 h-3.5" /> Add Question</button>
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={addSection} className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-dashed border-indigo-200 text-indigo-600 text-sm font-semibold hover:border-indigo-400 hover:bg-indigo-50 transition-all w-full justify-center"><Plus className="w-4 h-4" /> Add Section</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg text-sm font-semibold ${toast.type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}>
          {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}{toast.msg}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Question Papers</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create and manage question papers for your subjects</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/25 transition-all"><Plus className="w-4 h-4" /> New Paper</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          {label:"Total Papers",value:papers.length,icon:FileText,color:"text-blue-600",bg:"bg-blue-50"},
          {label:"Published",value:papers.filter(p=>p.status==="Published").length,icon:CheckCircle,color:"text-emerald-600",bg:"bg-emerald-50"},
          {label:"Drafts",value:papers.filter(p=>p.status==="Draft").length,icon:Edit3,color:"text-amber-600",bg:"bg-amber-50"},
          {label:"Archived",value:papers.filter(p=>p.status==="Archived").length,icon:Archive,color:"text-slate-500",bg:"bg-slate-100"}
        ].map(({label,value,icon:Icon,color,bg}) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${color}`} /></div>
            <div><p className="text-xl font-extrabold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
          </div>
        ))}
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : papers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><FileText className="w-8 h-8 text-blue-500" /></div>
          <h3 className="font-bold text-slate-700 text-lg mb-1">No Question Papers Yet</h3>
          <p className="text-slate-400 text-sm mb-5">Start by creating your first question paper</p>
          <button onClick={openNew} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all">Create First Paper</button>
        </div>
      ) : (
        <div className="space-y-4">
          {papers.map(paper => {
            const StatusIcon = STATUS_ICONS[paper.status] || Edit3;
            const totalQ = (paper.sections || []).reduce((a, s) => a + s.questions.length, 0);
            return (
              <div key={paper._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0"><FileText className="w-6 h-6 text-white" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-base truncate">{paper.subjectName || "Untitled"}</h3>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${STATUS_COLORS[paper.status]}`}><StatusIcon className="w-3 h-3 inline mr-1" />{paper.status}</span>
                      </div>
                      <p className="text-sm text-slate-500">{paper.subjectCode} · {paper.examType} · Semester {paper.semester}</p>
                      <div className="flex flex-wrap gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs text-slate-400"><Clock className="w-3 h-3" />{paper.duration}</span>
                        <span className="flex items-center gap-1 text-xs text-slate-400"><Award className="w-3 h-3" />{paper.totalMarks} Marks</span>
                        <span className="flex items-center gap-1 text-xs text-slate-400"><List className="w-3 h-3" />{totalQ} Questions</span>
                        <span className="flex items-center gap-1 text-xs text-slate-400"><Layers className="w-3 h-3" />{(paper.sections || []).length} Sections</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => openPreview(paper)} title="Preview" className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-all"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => openEdit(paper)} title="Edit" className="p-2 rounded-xl hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-all"><Edit3 className="w-4 h-4" /></button>
                    {paper.status === "Draft" && <button onClick={() => changeStatus(paper._id, "Published")} title="Publish" className="p-2 rounded-xl hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-all"><Send className="w-4 h-4" /></button>}
                    {paper.status === "Published" && <button onClick={() => changeStatus(paper._id, "Archived")} title="Archive" className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-600 transition-all"><Archive className="w-4 h-4" /></button>}
                    {paper.status === "Archived" && <button onClick={() => changeStatus(paper._id, "Draft")} title="Restore" className="p-2 rounded-xl hover:bg-amber-50 text-slate-500 hover:text-amber-600 transition-all"><RotateCcw className="w-4 h-4" /></button>}
                    <button onClick={() => setDeleteId(paper._id)} title="Delete" className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center z-10">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 className="w-7 h-7 text-red-600" /></div>
            <h3 className="font-extrabold text-slate-900 text-lg mb-1">Delete Paper?</h3>
            <p className="text-slate-500 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={() => deletePaper(deleteId)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-bold text-white transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewView({ paper, onBack }) {
  const handlePrint = () => {
    const w = window.open("", "_blank");
    const secs = (paper.sections || []).map(sec => {
      const tot = sec.questions.reduce((a, q) => a + Number(q.marks || 0), 0);
      const qs = sec.questions.map(q => {
        const opts = q.type === "MCQ" && q.options?.length ? "<br/>" + q.options.map((o,i) => `${String.fromCharCode(97+i)}) ${o}`).join("&nbsp;&nbsp;") : "";
        return `<div class="question"><span class="q-num">${q.questionNo}.</span><span>${q.text}${opts}</span><span class="marks">[${q.marks}M]</span></div>`;
      }).join("");
      return `<div class="section"><div class="section-title">${sec.sectionLabel}${sec.instructions ? " – " + sec.instructions : ""} (${tot} Marks)</div>${qs}</div>`;
    }).join("");
    const inst = paper.instructions ? `<div class="instructions"><b>Instructions:</b><br/>${paper.instructions.replace(/\n/g,"<br/>")}</div>` : "";
    w.document.write(`<html><head><title>${paper.subjectName} - ${paper.examType}</title><style>body{font-family:'Times New Roman',serif;margin:40px;color:#111}h1{text-align:center;font-size:20px;margin:0}h2{text-align:center;font-size:16px;margin:4px 0}.meta{text-align:center;font-size:13px;margin:6px 0 16px}.instructions{border:1px solid #333;padding:10px;margin:10px 0;font-size:13px}.section{margin:20px 0}.section-title{font-weight:bold;font-size:15px;border-bottom:1px solid #333;padding-bottom:4px;margin-bottom:10px}.question{margin:10px 0;font-size:14px;display:flex;gap:10px}.q-num{font-weight:bold;min-width:30px}.marks{margin-left:auto;font-style:italic}</style></head><body><h1>Vivekananda College of Arts and Sciences</h1><h2>${paper.examType} Examination</h2><div class="meta">${paper.subjectCode} - ${paper.subjectName} | Semester ${paper.semester} | Time: ${paper.duration} | Max Marks: ${paper.totalMarks}</div>${inst}${secs}</body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-all"><X className="w-5 h-5" /></button>
          <div>
            <h2 className="font-bold text-slate-900 text-base">Preview – {paper.subjectName}</h2>
            <p className="text-xs text-slate-500">{paper.examType}</p>
          </div>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md transition-all"><Download className="w-4 h-4" /> Print / Download</button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white max-w-4xl mx-auto rounded-2xl shadow-lg border border-slate-200 p-10 font-serif">
          <div className="text-center mb-6 border-b-2 border-slate-800 pb-4">
            <h1 className="text-xl font-extrabold text-slate-900 mb-1">Vivekananda College of Arts and Sciences</h1>
            <h2 className="text-base font-bold text-slate-700">{paper.examType} Examination — {paper.academicYear}</h2>
            <div className="flex justify-center flex-wrap gap-6 mt-3 text-sm text-slate-600">
              <span><b>Subject:</b> {paper.subjectCode} – {paper.subjectName}</span>
              <span><b>Semester:</b> {paper.semester}</span>
              <span><b>Duration:</b> {paper.duration}</span>
              <span><b>Max Marks:</b> {paper.totalMarks}</span>
            </div>
          </div>
          {paper.instructions && (
            <div className="border border-slate-300 rounded-lg p-3 mb-6 text-sm bg-slate-50">
              <b>Instructions:</b><br />{paper.instructions.split("\n").map((l, i) => <span key={i}>{l}<br /></span>)}
            </div>
          )}
          {(paper.sections || []).map((sec, si) => {
            const tot = sec.questions.reduce((a, q) => a + Number(q.marks || 0), 0);
            return (
              <div key={si} className="mb-8">
                <div className="border-b border-slate-800 mb-3 pb-1 flex justify-between items-end">
                  <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-wider">
                    {sec.sectionLabel}
                    {sec.instructions && <span className="font-normal normal-case text-slate-500 ml-2 text-sm">– {sec.instructions}</span>}
                  </h3>
                  <span className="text-sm font-semibold text-slate-600">({tot} Marks)</span>
                </div>
                <div className="space-y-4">
                  {sec.questions.map((q, qi) => (
                    <div key={qi} className="flex gap-3">
                      <span className="font-bold text-slate-800 shrink-0 w-6">{q.questionNo}.</span>
                      <div className="flex-1">
                        <span className="text-slate-800 text-sm">{q.text || <span className="italic text-slate-400">No question text</span>}</span>
                        {q.type === "MCQ" && q.options?.length > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-1">{q.options.map((opt, oi) => <span key={oi} className="text-sm text-slate-600">{String.fromCharCode(97+oi)}) {opt}</span>)}</div>
                        )}
                        {q.unit && <p className="text-xs text-slate-400 mt-1">Unit: {q.unit}</p>}
                      </div>
                      <span className="text-sm font-semibold text-slate-500 shrink-0 self-start">[{q.marks}M]</span>
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
