import React, { useState, useEffect } from 'react';
import { API_BASE, BACKEND_URL } from '../../apiConfig';
import {
  BookOpen, Users, ChevronDown, ChevronUp, GraduationCap,
  Hash, Layers, Plus, X, Trash2, CheckCircle2, UserPlus,
  AlertCircle, Building2, MapPin, Pencil
} from 'lucide-react';
import ModalPortal from '../ModalPortal';

// API_BASE imported from apiConfig

export default function StaffMyClasses({ staffUser }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);

  // Add Class Modal State
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);
  const [classError, setClassError] = useState('');
  const [newClass, setNewClass] = useState({
    name: '',
    code: '',
    semester: 4,
    year: 2,
    section: 'A',
    credits: 3,
    room: ''
  });

  // Enroll Student Modal State
  const [enrollingClassCode, setEnrollingClassCode] = useState(null);
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [studentError, setStudentError] = useState('');
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [selectedRegisteredRoll, setSelectedRegisteredRoll] = useState('');
  const [enrollMode, setEnrollMode] = useState('select'); // 'select' | 'manual'
  const [newStudent, setNewStudent] = useState({
    rollNo: '',
    name: '',
    phone: '',
    email: ''
  });

  // Edit Class Modal State
  const [editingClass, setEditingClass] = useState(null); // holds cls object being edited
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    name: '', section: '', year: 2, semester: 4, credits: 3, room: ''
  });

  // Success Feedback
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  // Fetch classes from backend API
  const fetchClasses = async () => {
    if (!staffUser?.staffId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}`);
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes || []);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch registered students from main Student database
  const fetchRegisteredStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/students`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRegisteredStudents(data.data);
      }
    } catch (err) {
      console.error('Error fetching registered students:', err);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchRegisteredStudents();
  }, [staffUser?.staffId]);

  // Handle selecting an already registered student
  const handleSelectRegisteredStudent = (roll) => {
    setSelectedRegisteredRoll(roll);
    setStudentError('');
    const found = registeredStudents.find(s => (s.rollNo || s.regNo || s.studentId) === roll);
    if (found) {
      setNewStudent({
        rollNo: found.rollNo || found.regNo || found.studentId || '',
        name: found.name || '',
        phone: found.phone || '',
        email: found.email || ''
      });
    }
  };

  // 1-Click Auto Enroll all matching department students
  const handleAutoEnrollDept = async (classCode) => {
    if (!classCode) return;
    try {
      setIsSubmittingStudent(true);
      setStudentError('');
      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}/${classCode}/auto-enroll`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message || `Students auto-enrolled successfully!`);
        fetchClasses();
        setEnrollingClassCode(null);
        setSelectedRegisteredRoll('');
      } else {
        setStudentError(data.message || 'Auto-enroll failed.');
      }
    } catch (err) {
      setStudentError('Network error: ' + err.message);
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  // Handle Add Class
  const handleCreateClass = async (e) => {
    e.preventDefault();
    setClassError('');
    if (!newClass.name.trim()) {
      setClassError('Please enter subject name.');
      return;
    }

    try {
      setIsSubmittingClass(true);
      const payload = {
        code: newClass.code.trim().toUpperCase(),
        name: newClass.name.trim(),
        dept: staffUser.department || 'General',
        semester: Number(newClass.semester),
        year: Number(newClass.year),
        section: (newClass.section || 'A').trim().toUpperCase(),
        credits: Number(newClass.credits) || 3,
        room: (newClass.room || '').trim(),
        staffId: staffUser.staffId,
        staffName: staffUser.name,
        students: []
      };

      const res = await fetch(`${API_BASE}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setClassError(data.message || 'Failed to add class.');
        return;
      }

      showFeedback(`Subject ${data.class.code} – "${data.class.name}" added successfully!`);
      setIsAddClassOpen(false);
      setNewClass({
        name: '',
        code: '',
        semester: 4,
        year: 2,
        section: 'A',
        credits: 3,
        room: ''
      });
      fetchClasses();
    } catch (err) {
      setClassError('Network error connecting to backend: ' + err.message);
    } finally {
      setIsSubmittingClass(false);
    }
  };

  // Handle Edit Class — open modal and pre-fill
  const openEditModal = (cls, e) => {
    e.stopPropagation();
    setEditError('');
    setEditForm({
      name: cls.name || '',
      section: cls.section || 'A',
      year: cls.year || 2,
      semester: cls.semester || 4,
      credits: cls.credits || 3,
      room: cls.room || '',
    });
    setEditingClass(cls);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!editForm.name.trim()) { setEditError('Subject name is required.'); return; }
    try {
      setIsSubmittingEdit(true);
      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}/${editingClass.code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          section: editForm.section.trim().toUpperCase(),
          year: Number(editForm.year),
          semester: Number(editForm.semester),
          credits: Number(editForm.credits),
          room: editForm.room.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setEditError(data.message || 'Update failed.'); return; }
      showFeedback(`Class ${editingClass.code} updated successfully!`);
      setEditingClass(null);
      fetchClasses();
    } catch (err) {
      setEditError('Network error: ' + err.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Delete confirmation modal states
  const [classToDelete, setClassToDelete] = useState(null);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Trigger Delete Class Modal (Centered)
  const handleDeleteClass = (classCode, e) => {
    if (e) e.stopPropagation();
    setClassToDelete(classCode);
  };

  const executeDeleteClass = async () => {
    if (!classToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}/${classToDelete}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Class ${classToDelete} removed.`);
        fetchClasses();
        setClassToDelete(null);
      } else {
        alert(data.message || 'Failed to delete class.');
      }
    } catch (err) {
      alert('Error deleting class: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Enroll Student
  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    setStudentError('');
    if (!newStudent.rollNo.trim() || !newStudent.name.trim()) {
      setStudentError('Roll No and Student Name are required.');
      return;
    }

    try {
      setIsSubmittingStudent(true);
      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}/${enrollingClassCode}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setStudentError(data.message || 'Failed to enroll student.');
        return;
      }

      showFeedback(`Student ${data.student.name} enrolled in ${enrollingClassCode}!`);
      setEnrollingClassCode(null);
      setNewStudent({ rollNo: '', name: '', phone: '', email: '' });
      fetchClasses();
    } catch (err) {
      setStudentError('Network error: ' + err.message);
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  // Trigger Remove Student Modal (Centered)
  const handleRemoveStudent = (classCode, rollNo) => {
    setStudentToRemove({ classCode, rollNo });
  };

  const executeRemoveStudent = async () => {
    if (!studentToRemove) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}/${studentToRemove.classCode}/students/${studentToRemove.rollNo}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Student ${studentToRemove.rollNo} removed.`);
        fetchClasses();
        setStudentToRemove(null);
      } else {
        alert(data.message || 'Failed to remove student.');
      }
    } catch (err) {
      alert('Error removing student: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalStudentsCount = classes.reduce((sum, c) => {
    const list = c.students || c.enrolledStudents || [];
    return sum + list.length;
  }, 0);

  const totalCreditsCount = classes.reduce((sum, c) => sum + (c.credits || 3), 0);

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-5xl mx-auto">
      {/* Centered Feedback Popup */}
      {feedbackMsg && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none p-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-3 px-6 py-4 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl text-sm font-bold border border-slate-700 pointer-events-auto">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">My Classes & Subjects</h2>

        </div>
        <button
          type="button"
          onClick={() => {
            setClassError('');
            setIsAddClassOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Subject / Class
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Subjects Added', value: classes.length, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Students', value: totalStudentsCount, icon: Users, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Credits', value: totalCreditsCount, icon: Layers, color: 'text-purple-600 bg-purple-50' },
        ].map(stat => (
          <div key={stat.label} className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Classes List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-bold">Loading classes...</p>
        </div>
      ) : classes.length === 0 ? (
        /* Empty State */
        <div className="p-10 sm:p-14 text-center bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">No Subjects Added Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              You have not added any subjects or classes to your profile. Click below to add your first subject and enroll your students.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setClassError('');
              setIsAddClassOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Your First Subject
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => {
            const students = cls.students || cls.enrolledStudents || [];
            const isExpanded = expandedSubject === cls.code;

            return (
              <div key={cls.code || cls._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                  onClick={() => setExpandedSubject(isExpanded ? null : cls.code)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        {cls.code}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                        {cls.dept || staffUser.department}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{cls.name}</h3>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" /> Year {cls.year} · Sem {cls.semester} · Sec {cls.section || 'A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {students.length} students
                      </span>
                      <span className="flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" /> {cls.credits || 3} credits
                      </span>
                      {cls.room && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3.5 h-3.5" /> {cls.room}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      title="Enroll a student"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStudentError('');
                        setEnrollingClassCode(cls.code);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      title="Edit class details"
                      onClick={(e) => openEditModal(cls, e)}
                      className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      title="Delete class"
                      onClick={(e) => handleDeleteClass(cls.code, e)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="p-1 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded student table */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-700">
                        Enrolled Students ({students.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setStudentError('');
                          setEnrollingClassCode(cls.code);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 hover:border-blue-500 text-blue-600 text-[11px] font-bold rounded-lg shadow-xs transition-all"
                      >
                        <Plus className="w-3 h-3" /> Enroll Student
                      </button>
                    </div>

                    {students.length === 0 ? (
                      <div className="p-8 text-center bg-white space-y-2">
                        <p className="text-xs text-slate-400 font-semibold">
                          No students enrolled in this class yet.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setStudentError('');
                            setEnrollingClassCode(cls.code);
                          }}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          + Enroll student now
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="text-left px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider w-8">#</th>
                              <th className="text-left px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Roll No.</th>
                              <th className="text-left px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                              <th className="text-left px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                              <th className="text-right px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider w-16">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {students.map((stu, idx) => (
                              <tr key={stu.rollNo || idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-2.5 text-slate-400 font-medium">{idx + 1}</td>
                                <td className="px-5 py-2.5 font-bold text-slate-700">{stu.rollNo}</td>
                                <td className="px-5 py-2.5 font-semibold text-slate-900">{stu.name}</td>
                                <td className="px-5 py-2.5 text-slate-500 hidden sm:table-cell">{stu.phone || '—'}</td>
                                <td className="px-5 py-2.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveStudent(cls.code, stu.rollNo)}
                                    title="Remove student"
                                    className="text-slate-400 hover:text-rose-600 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: ADD SUBJECT / CLASS */}
      {/* ============================================================ */}
      {isAddClassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 sm:p-7 max-w-md w-full space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Add New Subject</h3>
                  <p className="text-xs text-slate-500">Saves directly to your academic class records</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddClassOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {classError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{classError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Computing & Distributed Systems"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    placeholder="e.g. CS401 (optional)"
                    value={newClass.code}
                    onChange={(e) => setNewClass({ ...newClass, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold uppercase text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    placeholder="A"
                    value={newClass.section}
                    onChange={(e) => setNewClass({ ...newClass, section: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Year</label>
                  <select
                    value={newClass.year}
                    onChange={(e) => setNewClass({ ...newClass, year: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                  <select
                    value={newClass.semester}
                    onChange={(e) => setNewClass({ ...newClass, semester: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    {[1, 2, 3, 4, 5, 6].map(s => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newClass.credits}
                    onChange={(e) => setNewClass({ ...newClass, credits: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Classroom / Lab Venue (Optional)
                  <span className="ml-1 text-[11px] font-normal text-slate-400">— Type your college room or lab</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 204, Lecture Hall 1, Computer Lab 2, Physics Lab"
                  value={newClass.room}
                  onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition-all"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddClassOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClass}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {isSubmittingClass ? 'Saving...' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: EDIT CLASS */}
      {/* ============================================================ */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 sm:p-7 max-w-md w-full space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Edit Class Details</h3>
                  <p className="text-xs text-blue-600 font-bold">{editingClass.code} — {editingClass.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subject Code
                  <span className="ml-2 text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">Read-only</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={editingClass.code}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-extrabold text-slate-500 cursor-not-allowed tracking-wider uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    value={editForm.section}
                    onChange={(e) => setEditForm({ ...editForm, section: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editForm.credits}
                    onChange={(e) => setEditForm({ ...editForm, credits: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Year</label>
                  <select
                    value={editForm.year}
                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                  >
                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                  <select
                    value={editForm.semester}
                    onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Classroom / Lab Venue (Optional)
                  <span className="ml-1 text-[11px] font-normal text-slate-400">— Type your college room or lab</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 204, Lecture Hall 1, Computer Lab 2, Physics Lab"
                  value={editForm.room}
                  onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md shadow-amber-400/30 disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: ENROLL STUDENT */}
      {/* ============================================================ */}
      {enrollingClassCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-md w-full space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Enroll Student into Subject</h3>
                <p className="text-[11px] text-blue-600 font-bold">Class: {enrollingClassCode}</p>
              </div>
              <button
                type="button"
                onClick={() => { setEnrollingClassCode(null); setSelectedRegisteredRoll(''); }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 1-Click Auto Enroll Action Banner */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex items-center justify-between gap-2">
              <div>
                <p className="text-[11.5px] font-extrabold text-blue-950">⚡ 1-Click Auto Enroll</p>
                <p className="text-[10px] text-blue-800">Enroll all registered department students automatically.</p>
              </div>
              <button
                type="button"
                disabled={isSubmittingStudent}
                onClick={() => handleAutoEnrollDept(enrollingClassCode)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shrink-0 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                Auto-Enroll All
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setEnrollMode('select')}
                className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                  enrollMode === 'select'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ✓ Pick Existing Student ({registeredStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setEnrollMode('manual')}
                className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                  enrollMode === 'manual'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                + Manual Entry
              </button>
            </div>

            {studentError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-semibold">
                {studentError}
              </div>
            )}

            <form onSubmit={handleEnrollStudent} className="space-y-3">
              {enrollMode === 'select' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Select Registered Student <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedRegisteredRoll}
                    onChange={(e) => handleSelectRegisteredStudent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="">-- Choose a registered student --</option>
                    {registeredStudents.map(st => {
                      const roll = st.rollNo || st.regNo || st.studentId;
                      return (
                        <option key={st._id || roll} value={roll}>
                          {roll} — {st.name} ({st.department || st.course || 'Dept'})
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Selecting a student automatically pulls their credentials without re-entering anything.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Roll Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 21CS001"
                  value={newStudent.rollNo}
                  onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="9876543210"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setEnrollingClassCode(null); setSelectedRegisteredRoll(''); }}
                  className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStudent || !newStudent.rollNo || !newStudent.name}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingStudent ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Centered Modal: Confirm Delete Class */}
      {classToDelete && (
        <ModalPortal isOpen={Boolean(classToDelete)} onClose={() => !isDeleting && setClassToDelete(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 my-auto text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Delete Class Confirmation</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to delete class <strong className="text-slate-800 font-mono font-bold">{classToDelete}</strong>? This will remove it from your active class schedule.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setClassToDelete(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDeleteClass}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Class'}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Centered Modal: Confirm Remove Student */}
      {studentToRemove && (
        <ModalPortal isOpen={Boolean(studentToRemove)} onClose={() => !isDeleting && setStudentToRemove(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 my-auto text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Remove Student from Class</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to remove roll no <strong className="text-slate-800 font-mono font-bold">{studentToRemove.rollNo}</strong> from class <strong className="text-slate-800 font-mono">{studentToRemove.classCode}</strong>?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setStudentToRemove(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeRemoveStudent}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                {isDeleting ? 'Removing...' : 'Remove Student'}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
