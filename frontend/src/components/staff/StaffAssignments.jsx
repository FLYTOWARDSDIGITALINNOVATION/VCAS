import React, { useState, useEffect } from "react";
import {
  BookMarked,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  Trash2,
  Filter,
  Loader2,
  RefreshCw,
  Edit,
  Save,
} from "lucide-react";

const API = "http://localhost:5000/api";

export default function StaffAssignments({ staffUser }) {
  const staffId = staffUser?.staffId || staffUser?.employeeId || "";

  const [assignments, setAssignments]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filterSubject, setFilterSubject] = useState("ALL");
  const [filterStatus, setFilterStatus]   = useState("ALL");
  const [showModal, setShowModal]         = useState(false);
  const [successMsg, setSuccessMsg]       = useState("");
  const [errorMsg, setErrorMsg]           = useState("");
  const [saving, setSaving]               = useState(false);

  // Edit mode state
  const [editingId, setEditingId]         = useState(null); // _id of assignment being edited

  // Form state (shared for create + edit)
  const [newTitle, setNewTitle]               = useState("");
  const [newSubjectCode, setNewSubjectCode]   = useState("");
  const [newSubjectName, setNewSubjectName]   = useState("");
  const [newDueDate, setNewDueDate]           = useState("");
  const [newMarks, setNewMarks]               = useState("20");
  const [newDescription, setNewDescription]   = useState("");

  const fetchAssignments = async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/assignments/${staffId}`);
      const json = await res.json();
      if (json.success) setAssignments(json.data);
      else toast(json.message, true);
    } catch {
      toast("Failed to connect to server. Make sure the backend is running.", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, [staffId]);

  const toast = (msg, isError = false) => {
    if (isError) { setErrorMsg(msg); setSuccessMsg(""); }
    else         { setSuccessMsg(msg); setErrorMsg(""); }
    setTimeout(() => { setSuccessMsg(""); setErrorMsg(""); }, 4000);
  };

  const subjects = [...new Set(assignments.map((a) => a.subjectCode))].filter(Boolean);

  const filteredAssignments = assignments.filter((item) => {
    if (filterSubject !== "ALL" && item.subjectCode !== filterSubject) return false;
    if (filterStatus  !== "ALL" && item.status      !== filterStatus)  return false;
    return true;
  });

  // Open modal for creating
  const openCreateModal = () => {
    setEditingId(null);
    setNewTitle(""); setNewSubjectCode(""); setNewSubjectName("");
    setNewDescription(""); setNewDueDate(""); setNewMarks("20");
    setErrorMsg("");
    setShowModal(true);
  };

  // Open modal pre-filled for editing
  const openEditModal = (asgt) => {
    setEditingId(asgt._id);
    setNewTitle(asgt.title || "");
    setNewSubjectCode(asgt.subjectCode || "");
    setNewSubjectName(asgt.subjectName || "");
    setNewDueDate(asgt.dueDate || "");
    setNewMarks(String(asgt.totalMarks || "20"));
    setNewDescription(asgt.description || "");
    setErrorMsg("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setNewTitle(""); setNewSubjectCode(""); setNewSubjectName("");
    setNewDescription(""); setNewDueDate(""); setNewMarks("20");
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate || !newSubjectCode.trim()) return;
    setSaving(true);
    try {
      const res  = await fetch(`${API}/assignments/${staffId}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          staffName:   staffUser?.name || "",
          subjectCode: newSubjectCode.trim().toUpperCase(),
          subjectName: newSubjectName.trim(),
          department:  staffUser?.department || "",
          title:       newTitle.trim(),
          description: newDescription.trim(),
          dueDate:     newDueDate,
          totalMarks:  Number(newMarks) || 20,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAssignments((prev) => [json.data, ...prev]);
        closeModal();
        toast("Assignment created and published successfully!");
      } else {
        toast(json.message, true);
      }
    } catch {
      toast("Server error. Please try again.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate || !newSubjectCode.trim()) return;
    setSaving(true);
    try {
      const res  = await fetch(`${API}/assignments/${staffId}/${editingId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          subjectCode: newSubjectCode.trim().toUpperCase(),
          subjectName: newSubjectName.trim(),
          title:       newTitle.trim(),
          description: newDescription.trim(),
          dueDate:     newDueDate,
          totalMarks:  Number(newMarks) || 20,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAssignments((prev) => prev.map((a) => (a._id === editingId ? json.data : a)));
        closeModal();
        toast("Assignment updated successfully!");
      } else {
        toast(json.message, true);
      }
    } catch {
      toast("Server error. Please try again.", true);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id) => {
    try {
      const res  = await fetch(`${API}/assignments/${staffId}/${id}/status`, { method: "PATCH" });
      const json = await res.json();
      if (json.success) setAssignments((prev) => prev.map((a) => (a._id === id ? json.data : a)));
      else toast(json.message, true);
    } catch { toast("Failed to update status.", true); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this assignment? This cannot be undone.")) return;
    try {
      const res  = await fetch(`${API}/assignments/${staffId}/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) { setAssignments((prev) => prev.filter((a) => a._id !== id)); toast("Assignment deleted."); }
      else toast(json.message, true);
    } catch { toast("Failed to delete. Please try again.", true); }
  };

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Assignments Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Create homework, track submissions, and manage assignments for your subjects
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={fetchAssignments} className="p-2 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all">
            <Plus className="w-4 h-4" /> Create New Assignment
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />{successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />{errorMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter By:</span>
        </div>
        <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none">
          <option value="ALL">All Subjects</option>
          {subjects.map((code) => (<option key={code} value={code}>{code}</option>))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none">
          <option value="ALL">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Closed">Closed</option>
        </select>
        <span className="text-xs text-slate-400 font-medium ml-auto">Showing {filteredAssignments.length} assignments</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm font-medium">Loading assignments...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssignments.map((asgt) => {
              const isActive  = asgt.status === "Active";
              const isOverdue = isActive && new Date(asgt.dueDate) < new Date();
              return (
                <div key={asgt._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">{asgt.subjectCode}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOverdue ? "bg-red-50 text-red-700 border border-red-100" : isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-600"}`}>
                        {isOverdue ? "Overdue" : asgt.status}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{asgt.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{asgt.description || "No detailed instructions provided."}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /><span>Due: {asgt.dueDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /><span>Max Marks: {asgt.totalMarks} | Submissions: <b>{asgt.submissions}</b></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(asgt)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-all"
                        title="Edit Assignment"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleStatus(asgt._id)} className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
                        {isActive ? "Mark Closed" : "Reopen"}
                      </button>
                      <button onClick={() => handleDelete(asgt._id)} className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAssignments.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
              <BookMarked className="w-10 h-10 mx-auto mb-2 text-slate-200" />
              <p className="text-sm font-medium">
                {assignments.length === 0 ? "No assignments yet. Create your first assignment!" : "No assignments match the current filter."}
              </p>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${editingId ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                  {editingId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingId ? "Edit Assignment" : "Create New Assignment"}
                </h3>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={editingId ? handleUpdateAssignment : handleCreateAssignment} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code *</label>
                  <input type="text" required placeholder="e.g., CS401" value={newSubjectCode} onChange={(e) => setNewSubjectCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name</label>
                  <input type="text" placeholder="e.g., Data Structures" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assignment Title *</label>
                <input type="text" required placeholder="e.g., Unit 3 Case Study" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Submission Deadline *</label>
                  <input type="date" required value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Marks</label>
                  <input type="number" min="5" max="100" value={newMarks} onChange={(e) => setNewMarks(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructions / Description</label>
                <textarea rows="3" placeholder="Provide assignment guidelines, expected format, deliverables..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"></textarea>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-1 py-2.5 disabled:opacity-60 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 ${editingId ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'}`}
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {saving ? (editingId ? "Saving..." : "Publishing...") : (editingId ? "Save Changes" : "Publish Assignment")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
