import React, { useState } from 'react';
import { 
  BookMarked, 
  Plus, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle2, 
  X, 
  AlertCircle,
  Eye,
  Trash2,
  Filter
} from 'lucide-react';
import { SUBJECTS, ASSIGNMENTS_DATA } from './staffData';

export default function StaffAssignments({ staffUser }) {
  const mySubjects = (staffUser.subjects || []).map(code => SUBJECTS[code]).filter(Boolean);

  const [assignments, setAssignments] = useState(() => {
    return ASSIGNMENTS_DATA[staffUser.staffId] || [];
  });

  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  // New assignment form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState(mySubjects[0]?.code || '');
  const [newDueDate, setNewDueDate] = useState('');
  const [newMarks, setNewMarks] = useState('20');
  const [newDescription, setNewDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const filteredAssignments = assignments.filter(item => {
    if (filterSubject !== 'ALL' && item.subjectCode !== filterSubject) return false;
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    return true;
  });

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) return;

    const sub = SUBJECTS[newSubjectCode];
    const newEntry = {
      id: `ASGT-${Date.now()}`,
      subjectCode: newSubjectCode,
      subjectName: sub ? sub.name : newSubjectCode,
      title: newTitle.trim(),
      description: newDescription.trim(),
      dueDate: newDueDate,
      totalMarks: Number(newMarks) || 20,
      status: 'Active',
      submissions: 0
    };

    setAssignments(prev => [newEntry, ...prev]);
    setShowModal(false);
    setNewTitle('');
    setNewDescription('');
    setNewDueDate('');
    setSuccessMsg('Assignment created and published to students successfully!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const toggleStatus = (id) => {
    setAssignments(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: a.status === 'Active' ? 'Closed' : 'Active' };
      }
      return a;
    }));
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      setAssignments(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Assignments Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Create homework, track submissions, and evaluate assignments for your subjects
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Assignment
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter By:</span>
        </div>

        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
        >
          <option value="ALL">All Subjects</option>
          {mySubjects.map(sub => (
            <option key={sub.code} value={sub.code}>{sub.code} – {sub.name}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Closed">Closed</option>
        </select>

        <span className="text-xs text-slate-400 font-medium ml-auto">
          Showing {filteredAssignments.length} assignments
        </span>
      </div>

      {/* Assignment Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssignments.map((asgt) => {
          const isActive = asgt.status === 'Active';
          return (
            <div key={asgt.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                    {asgt.subjectCode}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {asgt.status}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                  {asgt.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {asgt.description || 'No detailed instructions provided.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: {asgt.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Max Marks: {asgt.totalMarks} | Submissions: <b>{asgt.submissions}</b></span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleStatus(asgt.id)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    {isActive ? 'Mark Closed' : 'Reopen'}
                  </button>
                  <button
                    onClick={() => handleDelete(asgt.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    title="Delete Assignment"
                  >
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
          <p className="text-sm font-medium">No assignments found matching current filter.</p>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-slate-900 text-base">Create New Assignment</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <select
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {mySubjects.map(sub => (
                    <option key={sub.code} value={sub.code}>{sub.code} – {sub.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Unit 3 Case Study & Problem Set"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Submission Deadline</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={newMarks}
                    onChange={(e) => setNewMarks(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructions / Description</label>
                <textarea
                  rows="3"
                  placeholder="Provide assignment guidelines, expected format, deliverables..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white shadow-md shadow-blue-500/20"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
