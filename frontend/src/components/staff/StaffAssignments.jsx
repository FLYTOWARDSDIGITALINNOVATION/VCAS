import React, { useState, useEffect, useRef, useMemo } from "react";
import { API_BASE, BACKEND_URL } from '../../apiConfig';
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
  FileText,
  UploadCloud,
  Download,
  Paperclip,
  Eye,
  File,
  FileCheck,
  Users,
  Search,
  UserPlus,
  CheckSquare,
  Sparkles
} from "lucide-react";

const API = API_BASE;

export default function StaffAssignments({ staffUser }) {
  const staffId = staffUser?.staffId || staffUser?.employeeId || "";

  const [assignments, setAssignments]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filterSubject, setFilterSubject] = useState("ALL");
  const [filterStatus, setFilterStatus]   = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [showModal, setShowModal]         = useState(false);
  const [successMsg, setSuccessMsg]       = useState("");
  const [errorMsg, setErrorMsg]           = useState("");
  const [saving, setSaving]               = useState(false);

  const [editingId, setEditingId]         = useState(null);
  const [viewingDoc, setViewingDoc]       = useState(null);

  // Submissions & Students Management Modal state
  const [submissionsModalAsgt, setSubmissionsModalAsgt] = useState(null);
  const [submissionsSearch, setSubmissionsSearch]       = useState("");
  const [submissionsFilter, setSubmissionsFilter]       = useState("ALL");
  const [showAddStudentForm, setShowAddStudentForm]     = useState(false);
  const [newStudentRoll, setNewStudentRoll]             = useState("");
  const [newStudentName, setNewStudentName]             = useState("");
  const [newStudentReg, setNewStudentReg]               = useState("");
  const [newStudentStatus, setNewStudentStatus]         = useState("Not Submitted");
  const [newStudentMarks, setNewStudentMarks]           = useState("");
  const [quickCountInput, setQuickCountInput]           = useState("");
  const [isUpdatingSubmissions, setIsUpdatingSubmissions] = useState(false);

  // Form state (shared for create + edit)
  const [newTitle, setNewTitle]               = useState("");
  const [newCategory, setNewCategory]         = useState("Regular"); // Regular | Project
  const [newProjectPhase, setNewProjectPhase] = useState("Phase 1 - Topic & Problem Statement");
  const [newSubjectCode, setNewSubjectCode]   = useState("");
  const [newSubjectName, setNewSubjectName]   = useState("");
  const [newDueDate, setNewDueDate]           = useState("");
  const [newMarks, setNewMarks]               = useState("");
  const [newDescription, setNewDescription]   = useState("");

  // Attachment state
  const [attachmentName, setAttachmentName]   = useState("");
  const [attachmentData, setAttachmentData]   = useState("");
  const [attachmentSize, setAttachmentSize]   = useState("");
  const [attachmentType, setAttachmentType]   = useState("");
  const [isDragging, setIsDragging]           = useState(false);

  const fileInputRef = useRef(null);

  const fetchAssignments = async () => {
    if (!staffId) {
      setLoading(false);
      return;
    }
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
    if (filterCategory === "Project" && item.category !== "Project") return false;
    if (filterCategory === "Regular" && item.category === "Project") return false;
    return true;
  });

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    // Check size limit: 15MB
    if (file.size > 15 * 1024 * 1024) {
      toast("File size exceeds 15MB limit. Please upload a smaller document.", true);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentName(file.name);
      setAttachmentData(reader.result);
      setAttachmentSize(formatFileSize(file.size));
      setAttachmentType(file.type || "application/octet-stream");
      toast(`File "${file.name}" attached successfully!`);
    };
    reader.onerror = () => {
      toast("Error reading file. Please try again.", true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const removeAttachment = () => {
    setAttachmentName("");
    setAttachmentData("");
    setAttachmentSize("");
    setAttachmentType("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Lock background scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(showModal || viewingDoc || submissionsModalAsgt);
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
  }, [showModal, viewingDoc, submissionsModalAsgt]);

  const handleDownloadAttachment = (asgt) => {
    if (!asgt?.attachmentData) return;
    const link = document.createElement("a");
    link.href = asgt.attachmentData;
    link.download = asgt.attachmentName || "assignment_brief.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewDocument = (asgt) => {
    if (!asgt?.attachmentData) {
      toast("No document data attached to view.", true);
      return;
    }
    setViewingDoc({
      name: asgt.attachmentName || "Assignment Document.pdf",
      data: asgt.attachmentData,
      size: asgt.attachmentSize || "",
      type: asgt.attachmentType || ""
    });
  };

  // Open modal for creating
  const openCreateModal = (presetCategory = "Regular") => {
    setEditingId(null);
    setNewCategory(presetCategory);
    setNewProjectPhase("Phase 1 - Topic & Problem Statement");
    setNewTitle(""); setNewSubjectCode(""); setNewSubjectName("");
    setNewDescription(""); setNewDueDate(""); 
    setNewMarks(presetCategory === "Project" ? "50" : "20");
    setAttachmentName(""); setAttachmentData(""); setAttachmentSize(""); setAttachmentType("");
    setErrorMsg("");
    setShowModal(true);
  };

  // Open modal pre-filled for editing
  const openEditModal = (asgt) => {
    setEditingId(asgt._id);
    setNewCategory(asgt.category || "Regular");
    setNewProjectPhase(asgt.projectPhase || "Phase 1 - Topic & Problem Statement");
    setNewTitle(asgt.title || "");
    setNewSubjectCode(asgt.subjectCode || "");
    setNewSubjectName(asgt.subjectName || "");
    setNewDueDate(asgt.dueDate || "");
    setNewMarks(String(asgt.totalMarks || (asgt.category === "Project" ? "50" : "20")));
    setNewDescription(asgt.description || "");
    setAttachmentName(asgt.attachmentName || "");
    setAttachmentData(asgt.attachmentData || "");
    setAttachmentSize(asgt.attachmentSize || "");
    setAttachmentType(asgt.attachmentType || "");
    setErrorMsg("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setNewCategory("Regular");
    setNewProjectPhase("Phase 1 - Topic & Problem Statement");
    setNewTitle(""); setNewSubjectCode(""); setNewSubjectName("");
    setNewDescription(""); setNewDueDate(""); setNewMarks("");
    setAttachmentName(""); setAttachmentData(""); setAttachmentSize(""); setAttachmentType("");
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) return;
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
          totalMarks:  Number(newMarks) || (newCategory === "Project" ? 50 : 20),
          category:    newCategory,
          projectPhase: newCategory === "Project" ? newProjectPhase : "",
          attachmentName,
          attachmentData,
          attachmentSize,
          attachmentType,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAssignments((prev) => [json.data, ...prev]);
        closeModal();
        toast(newCategory === "Project" ? "Project Assignment created and published!" : "Assignment created and published successfully!");
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
    if (!newTitle.trim() || !newDueDate) return;
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
          totalMarks:  Number(newMarks) || (newCategory === "Project" ? 50 : 20),
          category:    newCategory,
          projectPhase: newCategory === "Project" ? newProjectPhase : "",
          attachmentName,
          attachmentData,
          attachmentSize,
          attachmentType,
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

  // Open Submissions & Students Modal
  const openSubmissionsModal = (asgt) => {
    setSubmissionsModalAsgt(asgt);
    setQuickCountInput(String(asgt.submissions || 0));
    setSubmissionsSearch("");
    setSubmissionsFilter("ALL");
    setShowAddStudentForm(false);
    setNewStudentMarks("");
  };

  // Add a student to the assignment
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentRoll.trim() || !newStudentName.trim() || !submissionsModalAsgt) return;
    setIsUpdatingSubmissions(true);
    try {
      const parsedMarks = newStudentMarks.trim() !== "" ? Number(newStudentMarks) : null;
      const res = await fetch(`${API}/assignments/${submissionsModalAsgt._id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollNo: newStudentRoll.trim(),
          studentName: newStudentName.trim(),
          regNo: newStudentReg.trim() || newStudentRoll.trim(),
          status: parsedMarks !== null ? "Graded" : newStudentStatus,
          marksAwarded: parsedMarks
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        toast(data.message || "Student added successfully!");
        setSubmissionsModalAsgt(data.data);
        setAssignments(prev => prev.map(a => a._id === data.data._id ? data.data : a));
        setNewStudentRoll("");
        setNewStudentName("");
        setNewStudentReg("");
        setNewStudentMarks("");
        setShowAddStudentForm(false);
      } else {
        toast(data.message || "Failed to add student.", true);
      }
    } catch (err) {
      toast("Error adding student: " + err.message, true);
    } finally {
      setIsUpdatingSubmissions(false);
    }
  };

  // Directly update or award marks for a student in this assignment
  const handleUpdateStudentMarks = async (studentId, rawMarks) => {
    if (!submissionsModalAsgt) return;
    const maxAllowed = submissionsModalAsgt.totalMarks || 20;
    if (rawMarks === "" || rawMarks === null || rawMarks === undefined) {
      setIsUpdatingSubmissions(true);
      try {
        const res = await fetch(`${API}/assignments/${submissionsModalAsgt._id}/students/${studentId}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marksAwarded: null })
        });
        const data = await res.json();
        if (data.success && data.data) {
          setSubmissionsModalAsgt(data.data);
          setAssignments(prev => prev.map(a => a._id === data.data._id ? data.data : a));
          toast("Marks cleared and synced to Internal Marks.");
        }
      } catch (err) {
        toast("Error clearing marks: " + err.message, true);
      } finally {
        setIsUpdatingSubmissions(false);
      }
      return;
    }

    const num = Number(rawMarks);
    if (isNaN(num) || num < 0 || num > maxAllowed) {
      toast(`Marks must be between 0 and ${maxAllowed}.`, true);
      return;
    }

    setIsUpdatingSubmissions(true);
    try {
      const res = await fetch(`${API}/assignments/${submissionsModalAsgt._id}/students/${studentId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marksAwarded: num,
          status: "Graded"
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSubmissionsModalAsgt(data.data);
        setAssignments(prev => prev.map(a => a._id === data.data._id ? data.data : a));
        toast(`Awarded ${num}/${maxAllowed} marks (synced to Internal Marks)!`);
      } else {
        toast(data.message || "Failed to update marks.", true);
      }
    } catch (err) {
      toast("Error updating marks: " + err.message, true);
    } finally {
      setIsUpdatingSubmissions(false);
    }
  };

  // Toggle or set a student's submission status
  const handleToggleStudentStatus = async (studentId, currentStatus) => {
    if (!submissionsModalAsgt) return;
    const newStatus = currentStatus === "Submitted" || currentStatus === "Graded" ? "Not Submitted" : "Submitted";
    setIsUpdatingSubmissions(true);
    try {
      const res = await fetch(`${API}/assignments/${submissionsModalAsgt._id}/students/${studentId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSubmissionsModalAsgt(data.data);
        setAssignments(prev => prev.map(a => a._id === data.data._id ? data.data : a));
        toast(data.message || "Status updated.");
      } else {
        toast(data.message || "Failed to update status.", true);
      }
    } catch (err) {
      toast("Error updating status: " + err.message, true);
    } finally {
      setIsUpdatingSubmissions(false);
    }
  };

  // Quick set submission count (e.g., set 18 of 25 submitted)
  const handleQuickSetCount = async (targetCount, allSubmitted = null) => {
    if (!submissionsModalAsgt) return;
    setIsUpdatingSubmissions(true);
    try {
      const payload = allSubmitted !== null ? { allSubmitted } : { count: Number(targetCount) };
      const res = await fetch(`${API}/assignments/${submissionsModalAsgt._id}/submissions/quick-set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSubmissionsModalAsgt(data.data);
        setAssignments(prev => prev.map(a => a._id === data.data._id ? data.data : a));
        toast(data.message || "Submissions count updated!");
      } else {
        toast(data.message || "Failed to update submissions count.", true);
      }
    } catch (err) {
      toast("Error setting submissions: " + err.message, true);
    } finally {
      setIsUpdatingSubmissions(false);
    }
  };

  // Remove a student from this assignment
  const handleRemoveStudent = async (studentId, studentName) => {
    if (!window.confirm(`Remove ${studentName} from this assignment?`)) return;
    if (!submissionsModalAsgt) return;
    setIsUpdatingSubmissions(true);
    try {
      const res = await fetch(`${API}/assignments/${submissionsModalAsgt._id}/students/${studentId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSubmissionsModalAsgt(data.data);
        setAssignments(prev => prev.map(a => a._id === data.data._id ? data.data : a));
        toast("Student removed from assignment.");
      } else {
        toast(data.message || "Failed to remove student.", true);
      }
    } catch (err) {
      toast("Error removing student: " + err.message, true);
    } finally {
      setIsUpdatingSubmissions(false);
    }
  };

  // Import registered class students into assignment
  const handleImportClassRoster = async () => {
    if (!submissionsModalAsgt) return;
    setIsUpdatingSubmissions(true);
    try {
      const res = await fetch(`${API}/assignments/${submissionsModalAsgt._id}/students/import-class`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSubmissionsModalAsgt(data.data);
        setAssignments(prev => prev.map(a => a._id === data.data._id ? data.data : a));
        toast(data.message);
      } else {
        toast(data.message || "No class roster found for this subject.", true);
      }
    } catch (err) {
      toast("Error importing class: " + err.message, true);
    } finally {
      setIsUpdatingSubmissions(false);
    }
  };

  // Filtered submissions list for the active assignment modal
  const filteredSubmissionsList = useMemo(() => {
    if (!submissionsModalAsgt) return [];
    const list = Array.isArray(submissionsModalAsgt.studentSubmissions) ? submissionsModalAsgt.studentSubmissions : [];
    return list.filter(std => {
      if (submissionsFilter === "Submitted" && std.status !== "Submitted" && std.status !== "Graded") return false;
      if (submissionsFilter === "Not Submitted" && (std.status === "Submitted" || std.status === "Graded")) return false;
      if (submissionsSearch.trim()) {
        const q = submissionsSearch.toLowerCase().trim();
        return String(std.studentName || '').toLowerCase().includes(q) ||
          String(std.rollNo || '').toLowerCase().includes(q) ||
          String(std.regNo || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [submissionsModalAsgt, submissionsFilter, submissionsSearch]);

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Assignments Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Create homework, attach question PDFs / docs, and manage assignments for your classes
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
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />{successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />{errorMsg}
        </div>
      )}

      {/* Category Pills & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterCategory === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            All ({assignments.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory("Regular")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterCategory === "Regular" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            📝 Regular Assignments ({assignments.filter(a => a.category !== "Project").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory("Project")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterCategory === "Project" ? "bg-purple-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            🚀 Project Assignments ({assignments.filter(a => a.category === "Project").length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none">
            <option value="ALL">All Subjects</option>
            {subjects.map((code) => (<option key={code} value={code}>{code}</option>))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none">
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
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
              const isPdf = asgt.attachmentName?.toLowerCase().endsWith(".pdf");
              const isDoc = asgt.attachmentName?.toLowerCase().match(/\.(doc|docx)$/i);

              return (
                <div key={asgt._id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">{asgt.subjectCode || 'General'}</span>
                        {asgt.category === "Project" ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            🚀 Project {asgt.projectPhase ? `• ${asgt.projectPhase}` : ''}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Assignment
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOverdue ? "bg-red-50 text-red-700 border border-red-100" : isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-600"}`}>
                        {isOverdue ? "Overdue" : asgt.status}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{asgt.title}</h3>
                    {asgt.subjectName && (
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">{asgt.subjectName}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{asgt.description || "No detailed instructions provided."}</p>

                    {/* Attached Document or PDF Badge */}
                    {asgt.attachmentName && (
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 hover:bg-slate-100/70 transition-colors">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {isPdf ? (
                            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-black text-[10px] shrink-0">
                              PDF
                            </div>
                          ) : isDoc ? (
                            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-black text-[10px] shrink-0">
                              DOC
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-black text-[10px] shrink-0">
                              FILE
                            </div>
                          )}
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-800 truncate" title={asgt.attachmentName}>
                              {asgt.attachmentName}
                            </p>
                            {asgt.attachmentSize && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                {asgt.attachmentSize}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleViewDocument(asgt)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 bg-white border border-blue-200 rounded-lg shadow-2xs transition-all shrink-0 active:scale-95 cursor-pointer"
                          title="View document on screen"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Doc</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2.5 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /><span>Due: {asgt.dueDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /><span>Max Marks: {asgt.totalMarks}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-50">
                      <button
                        onClick={() => openSubmissionsModal(asgt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200/80 transition-all cursor-pointer shadow-2xs"
                        title="Manage students and set submission status"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {asgt.submissions} / {asgt.studentSubmissions?.length || asgt.submissions} Submitted
                          {asgt.studentSubmissions?.length ? ` (${Math.round((asgt.submissions / asgt.studentSubmissions.length) * 100)}%)` : ''}
                        </span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(asgt)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-all cursor-pointer"
                          title="Edit Assignment & Attachment"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggleStatus(asgt._id)} className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer">
                          {isActive ? "Mark Closed" : "Reopen"}
                        </button>
                        <button onClick={() => handleDelete(asgt._id)} className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                {assignments.length === 0 ? "No assignments yet. Create your first assignment with question brief or PDF!" : "No assignments match the current filter."}
              </p>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={closeModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-7 w-full max-w-lg z-10 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${editingId ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                  {editingId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {editingId ? "Edit Assignment" : "Create New Assignment"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Provide instructions and attach question papers, problem sheets, or notes
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={editingId ? handleUpdateAssignment : handleCreateAssignment} className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Assignment Type</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setNewCategory("Regular"); if (newMarks === "50") setNewMarks("20"); }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      newCategory === "Regular" ? "bg-white text-blue-600 shadow-xs font-black" : "text-slate-600"
                    }`}
                  >
                    📝 Regular Assignment
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewCategory("Project"); if (!newMarks || newMarks === "20") setNewMarks("50"); }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      newCategory === "Project" ? "bg-purple-600 text-white shadow-xs font-black" : "text-slate-600"
                    }`}
                  >
                    🚀 Project Assignment
                  </button>
                </div>
              </div>

              {newCategory === "Project" && (
                <div>
                  <label className="block text-xs font-bold text-purple-900 mb-1">Project Phase / Milestone *</label>
                  <select
                    value={newProjectPhase}
                    onChange={(e) => setNewProjectPhase(e.target.value)}
                    className="w-full bg-purple-50 border border-purple-200 text-purple-900 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  >
                    <option value="Phase 1 - Topic & Problem Statement">Phase 1 - Topic & Problem Statement</option>
                    <option value="Phase 2 - Architecture & Design Methodology">Phase 2 - Architecture & Design Methodology</option>
                    <option value="Phase 3 - Code & Implementation Review">Phase 3 - Code & Implementation Review</option>
                    <option value="Phase 4 - Final Project Report & Viva">Phase 4 - Final Project Report & Viva</option>
                    <option value="Mini Project Submission">Mini Project Submission</option>
                    <option value="Capstone Project Review">Capstone Project Review</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input type="text" placeholder="e.g., CS401 (optional)" value={newSubjectCode} onChange={(e) => setNewSubjectCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name</label>
                  <input type="text" placeholder="e.g., Data Structures" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assignment Title *</label>
                <input type="text" required placeholder="e.g., Unit 3 Case Study & Lab Exercise" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Submission Deadline *</label>
                  <input type="date" required value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Marks</label>
                  <input type="number" min="5" max="100" placeholder="e.g. 20" value={newMarks} onChange={(e) => setNewMarks(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructions / Description</label>
                <textarea rows="3" placeholder="Provide assignment guidelines, questions, or deliverables..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"></textarea>
              </div>

              {/* Upload Document / PDF Section */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                    Attach Document / PDF (Optional)
                  </span>
                  {attachmentName && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Document Ready
                    </span>
                  )}
                </label>

                {attachmentName ? (
                  /* Attached File Card */
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {attachmentName.toLowerCase().endsWith('.pdf') ? (
                        <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center shrink-0 border border-rose-200">
                          PDF
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 border border-blue-200">
                          DOC
                        </div>
                      )}
                      <div className="truncate">
                        <p className="text-xs font-extrabold text-slate-900 truncate" title={attachmentName}>
                          {attachmentName}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {attachmentSize || "Uploaded"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {attachmentData && (
                        <button
                          type="button"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = attachmentData;
                            link.download = attachmentName;
                            link.click();
                          }}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100/60 rounded-lg transition-colors"
                          title="Download / Preview"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={removeAttachment}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Dropzone / Upload Trigger */
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-blue-500 bg-blue-50/60"
                        : "border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-blue-400"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                      className="hidden"
                    />
                    <UploadCloud className={`w-7 h-7 mx-auto mb-1 ${isDragging ? "text-blue-600 scale-110" : "text-slate-400"} transition-all`} />
                    <p className="text-xs font-bold text-slate-700">
                      Click to upload or drag & drop document
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Supported: PDF, Word (DOC / DOCX), Text (Max 15MB)
                    </p>
                  </div>
                )}
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

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setViewingDoc(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-5 sm:p-6 w-full max-w-4xl z-10 animate-in fade-in zoom-in-95 flex flex-col h-[88vh] max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                  viewingDoc.name?.toLowerCase().endsWith('.pdf')
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {viewingDoc.name?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC'}
                </div>
                <div className="truncate">
                  <h3 className="font-extrabold text-slate-900 text-sm truncate" title={viewingDoc.name}>
                    {viewingDoc.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {viewingDoc.size && `${viewingDoc.size} • `}Assignment Document Viewer
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = viewingDoc.data;
                    link.download = viewingDoc.name || "assignment_document.pdf";
                    link.click();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  title="Download a copy"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded Document Frame */}
            <div className="flex-1 min-h-0 bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 relative flex flex-col">
              {viewingDoc.name?.toLowerCase().endsWith('.pdf') || viewingDoc.data?.startsWith('data:application/pdf') ? (
                <iframe
                  src={viewingDoc.data}
                  className="w-full h-full border-0 rounded-2xl"
                  title={viewingDoc.name}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-base">{viewingDoc.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    {viewingDoc.size && `File Size: ${viewingDoc.size}. `}
                    This document format is best viewed with your device's word processor.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = viewingDoc.data;
                      link.download = viewingDoc.name || "document.docx";
                      link.click();
                    }}
                    className="mt-4 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Open / Download Document
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. MODAL: MANAGE STUDENTS & SUBMISSIONS                     */}
      {/* ============================================================ */}
      {submissionsModalAsgt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-extrabold bg-blue-100 text-blue-800">
                      {submissionsModalAsgt.subjectCode}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                      {submissionsModalAsgt.title}
                    </h3>
                    <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold ml-1">
                      <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span>Syncs with Internal Marks ({submissionsModalAsgt.subjectCode})</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage enrolled students, record assignment marks, and synchronize grades directly to Internal Marks
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSubmissionsModalAsgt(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Students</span>
                    <p className="text-xl font-black text-slate-900 mt-0.5">
                      {submissionsModalAsgt.studentSubmissions?.length || 0}
                    </p>
                  </div>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Submitted</span>
                    <p className="text-xl font-black text-emerald-700 mt-0.5">
                      {submissionsModalAsgt.submissions || 0}
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Not Submitted</span>
                    <p className="text-xl font-black text-rose-700 mt-0.5">
                      {Math.max(0, (submissionsModalAsgt.studentSubmissions?.length || 0) - (submissionsModalAsgt.submissions || 0))}
                    </p>
                  </div>
                  <Clock className="w-4 h-4 text-rose-600" />
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Submission Rate</span>
                    <p className="text-xl font-black text-blue-700 mt-0.5">
                      {submissionsModalAsgt.studentSubmissions?.length
                        ? Math.round((submissionsModalAsgt.submissions / submissionsModalAsgt.studentSubmissions.length) * 100)
                        : 0}%
                    </p>
                  </div>
                  <BookMarked className="w-4 h-4 text-blue-600" />
                </div>
              </div>

              {/* Action Bar: Quick Set Submissions + Add Student */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/90 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Quick count setter */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-700">Quick Set Submissions:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max={submissionsModalAsgt.studentSubmissions?.length || 0}
                        value={quickCountInput}
                        onChange={(e) => setQuickCountInput(e.target.value)}
                        placeholder="Count"
                        className="w-16 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-800 text-center focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-xs text-slate-400 font-bold">/ {submissionsModalAsgt.studentSubmissions?.length || 0}</span>
                      <button
                        type="button"
                        onClick={() => handleQuickSetCount(quickCountInput)}
                        disabled={isUpdatingSubmissions}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        Set Count
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
                      <button
                        type="button"
                        onClick={() => handleQuickSetCount(0, true)}
                        disabled={isUpdatingSubmissions}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      >
                        All Submitted
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickSetCount(0, false)}
                        disabled={isUpdatingSubmissions}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 font-bold text-[11px] rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      >
                        All Pending
                      </button>
                    </div>
                  </div>

                  {/* Right: Add Student & Import */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddStudentForm(prev => !prev)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 font-bold text-xs rounded-xl transition-all cursor-pointer ${
                        showAddStudentForm
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs shadow-blue-500/20'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddStudentForm ? 'Cancel' : 'Add Student'}</span>
                    </button>
                  </div>
                </div>

                {/* Inline Add Student Form with Marks */}
                {showAddStudentForm && (
                  <form onSubmit={handleAddStudent} className="pt-3 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-5 gap-2.5 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Roll No *</label>
                      <input
                        type="text"
                        value={newStudentRoll}
                        onChange={(e) => setNewStudentRoll(e.target.value)}
                        placeholder="e.g. CS105"
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold uppercase focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Student Name *</label>
                      <input
                        type="text"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        placeholder="e.g. Priya Nair"
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Register No (Optional)</label>
                      <input
                        type="text"
                        value={newStudentReg}
                        onChange={(e) => setNewStudentReg(e.target.value)}
                        placeholder="e.g. 2026CS105"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
                        Marks (Max {submissionsModalAsgt.totalMarks || 20})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={submissionsModalAsgt.totalMarks || 20}
                        value={newStudentMarks}
                        onChange={(e) => {
                          setNewStudentMarks(e.target.value);
                          if (e.target.value !== "" && newStudentStatus === "Not Submitted") {
                            setNewStudentStatus("Submitted");
                          }
                        }}
                        placeholder={`0-${submissionsModalAsgt.totalMarks || 20}`}
                        className="w-full bg-indigo-50/40 border border-indigo-200 rounded-xl px-3 py-1.5 text-xs font-bold text-indigo-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                        <select
                          value={newStudentStatus}
                          onChange={(e) => setNewStudentStatus(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold focus:outline-none focus:border-blue-500"
                        >
                          <option value="Not Submitted">Not Submitted</option>
                          <option value="Submitted">Submitted</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={isUpdatingSubmissions}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={submissionsSearch}
                    onChange={(e) => setSubmissionsSearch(e.target.value)}
                    placeholder="Search by student name or roll no..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Status:</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs">
                    {['ALL', 'Submitted', 'Not Submitted'].map(f => (
                      <button
                        key={f}
                        onClick={() => setSubmissionsFilter(f)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                          submissionsFilter === f
                            ? 'bg-white text-blue-600 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Student Submissions List Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-3">Register No</th>
                        <th className="py-3 px-3 text-center">Submission Status</th>
                        <th className="py-3 px-3 text-center">Marks (Max: {submissionsModalAsgt.totalMarks || 20})</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSubmissionsList.map(std => {
                        const isSubmitted = std.status === 'Submitted' || std.status === 'Graded';
                        const hasMarks = std.marksAwarded !== null && std.marksAwarded !== undefined;
                        return (
                          <tr key={std._id || std.rollNo} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-800">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] px-2 py-0.5 bg-slate-100 rounded-md text-slate-700 font-extrabold">
                                  {std.rollNo}
                                </span>
                                <span>{std.studentName}</span>
                              </div>
                              {std.fileName && std.fileName !== '--' && (
                                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-indigo-700 font-medium">
                                  <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                  <span className="truncate max-w-[200px]" title={std.fileName}>{std.fileName}</span>
                                  {std.fileData ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const link = document.createElement("a");
                                        link.href = std.fileData;
                                        link.download = std.fileName;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }}
                                      className="text-[11px] text-blue-600 hover:text-blue-800 underline font-bold ml-1 cursor-pointer flex items-center gap-0.5"
                                      title="Download student solution file"
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>Download</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-normal">({std.fileSize || 'PDF'})</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                              {std.regNo || std.rollNo}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black ${
                                std.status === 'Graded'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : isSubmitted
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {isSubmitted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                <span>{std.status}</span>
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="inline-flex items-center justify-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max={submissionsModalAsgt.totalMarks || 20}
                                  disabled={isUpdatingSubmissions}
                                  defaultValue={hasMarks ? std.marksAwarded : ""}
                                  key={`${std._id || std.rollNo}-${std.marksAwarded}`}
                                  placeholder="--"
                                  onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    if (val !== String(std.marksAwarded ?? "")) {
                                      handleUpdateStudentMarks(std._id || std.rollNo, val);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.target.blur();
                                    }
                                  }}
                                  title="Enter marks and press Enter or click away to save"
                                  className={`w-14 text-center py-1 px-1.5 rounded-lg text-xs font-black border transition-all ${
                                    hasMarks
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                      : "bg-slate-50 text-slate-800 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                  }`}
                                />
                                <span className="text-[10px] text-slate-400 font-bold">
                                  / {submissionsModalAsgt.totalMarks || 20}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-500 text-[11px]">
                              {std.submittedAt || '--'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStudentStatus(std._id || std.rollNo, std.status)}
                                  disabled={isUpdatingSubmissions}
                                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    isSubmitted
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                  }`}
                                >
                                  {isSubmitted ? 'Mark Unsubmitted' : 'Mark Submitted'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStudent(std._id || std.rollNo, std.studentName)}
                                  disabled={isUpdatingSubmissions}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Remove student from assignment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredSubmissionsList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No students found. Click "Add Student" or "Sync Class Roster" above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Showing {filteredSubmissionsList.length} of {submissionsModalAsgt.studentSubmissions?.length || 0} students
              </span>
              <button
                type="button"
                onClick={() => setSubmissionsModalAsgt(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
