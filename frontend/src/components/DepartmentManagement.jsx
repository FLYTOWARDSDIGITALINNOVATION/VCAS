import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE as ROOT_API } from '../apiConfig';
import { 
  Building2, 
  Plus, 
  Eye, 
  Pencil, 
  Trash2, 
  Search, 
  X, 
  Check, 
  Users, 
  GraduationCap, 
  BookOpen, 
  AlertTriangle,
  Layers,
  Save,
  Loader2,
  CheckCircle2,
  Download
} from 'lucide-react';
import ModalPortal from './ModalPortal';

const API_BASE = `${ROOT_API}/departments`;

function formatHodEmail(name) {
  if (!name) return 'hod@college.edu';
  const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim().toLowerCase();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]}.${parts[parts.length - 1][0]}@college.edu`;
  }
  return `${clean}@college.edu`;
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState(() => {
    try {
      const cached = localStorage.getItem('vcas_departments_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast notification helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Fetch departments from MongoDB backend
  const fetchDepartments = async () => {
    setErrorMessage('');
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      if (res.ok && data.success) {
        setDepartments(data.data || []);
        try {
          localStorage.setItem('vcas_departments_cache', JSON.stringify(data.data || []));
        } catch (_) {}
      } else {
        setErrorMessage(data.message || 'Failed to fetch departments from server.');
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      setErrorMessage('Unable to connect to backend server. Please verify backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Selected department for viewing modal
  const [viewingDept, setViewingDept] = useState(null);

  // Selected department for editing modal
  const [editingDept, setEditingDept] = useState(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingDept, setDeletingDept] = useState(null);

  // Lock background scroll when any modal is open
  React.useEffect(() => {
    const isAnyModalOpen = Boolean(viewingDept || editingDept || isAddModalOpen || deletingDept);
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
  }, [viewingDept, editingDept, isAddModalOpen, deletingDept]);

  // Form state for basic fields and subjects
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    hod: '',
    totalYears: 3,
    totalSemesters: 6,
    facultyCount: 0,
    studentCount: 0,
    description: '',
    coursesList: []
  });

  // State for editing Courses inside Edit Modal
  const [editCoursesList, setEditCoursesList] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Department Name is required';
    if (!formData.hod.trim()) errors.hod = 'HOD Name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      code: '',
      hod: '',
      totalYears: 3,
      totalSemesters: 6,
      facultyCount: 0,
      studentCount: 0,
      description: '',
      coursesList: [
        { sNo: 1, code: '', title: '', name: '', handledStaff: '', appeared: '', pass: '', passPct: 0, reappear: '-' }
      ]
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name || '',
      code: dept.code || '',
      hod: dept.hod || '',
      totalYears: dept.totalYears || 3,
      totalSemesters: dept.totalSemesters || 6,
      facultyCount: dept.facultyCount || 0,
      studentCount: dept.studentCount || 0,
      description: dept.description || ''
    });

    const existingCourses = (dept.coursesList || []).map((c, idx) => ({
      sNo: c.sNo || idx + 1,
      code: c.code || '',
      title: c.title || c.name || '',
      name: c.title || c.name || '',
      handledStaff: c.handledStaff || '',
      appeared: c.appeared !== undefined ? c.appeared : (c.appearedCount !== undefined ? c.appearedCount : ''),
      pass: c.pass !== undefined ? c.pass : (c.passCount !== undefined ? c.passCount : ''),
      passPct: c.passPct !== undefined ? c.passPct : (c.passPercentage !== undefined ? c.passPercentage : 0),
      reappear: c.reappear !== undefined ? c.reappear : (c.reappearCount !== undefined ? c.reappearCount : '-')
    }));

    setEditCoursesList(existingCourses.length > 0 ? existingCourses : [
      { sNo: 1, code: '', title: '', name: '', handledStaff: '', appeared: '', pass: '', passPct: 0, reappear: '-' }
    ]);
    setFormErrors({});
  };

  const handleOpenViewModal = (dept) => {
    setViewingDept(dept);
  };

  // Add subject row
  const handleAddSubjectRow = (isEdit = false) => {
    const currentList = isEdit ? editCoursesList : formData.coursesList;
    const nextNo = (currentList?.length || 0) + 1;

    const newSub = {
      sNo: nextNo,
      code: '',
      title: '',
      name: '',
      handledStaff: '',
      appeared: '',
      pass: '',
      passPct: 0,
      reappear: '-'
    };

    if (isEdit) {
      setEditCoursesList(prev => [...prev, newSub]);
    } else {
      setFormData(prev => ({
        ...prev,
        coursesList: [...(prev.coursesList || []), newSub]
      }));
    }
  };

  // Remove subject row
  const handleRemoveSubjectRow = (index, isEdit = false) => {
    if (isEdit) {
      setEditCoursesList(prev => prev.filter((_, i) => i !== index).map((s, idx) => ({ ...s, sNo: idx + 1 })));
    } else {
      setFormData(prev => ({
        ...prev,
        coursesList: (prev.coursesList || []).filter((_, i) => i !== index).map((s, idx) => ({ ...s, sNo: idx + 1 }))
      }));
    }
  };

  // Update subject field with real-time pass percentage & reappear calculations
  const handleSubjectFieldChange = (index, field, value, isEdit = false) => {
    const updater = (prevList) => {
      const copy = [...prevList];
      const item = { ...copy[index] };
      item[field] = value;
      if (field === 'title') item.name = value;
      if (field === 'name') item.title = value;

      if (field === 'appeared' || field === 'pass') {
        const app = Number(field === 'appeared' ? value : item.appeared) || 0;
        const p = Number(field === 'pass' ? value : item.pass) || 0;
        item.passPct = app > 0 ? Math.round((p / app) * 100) : 0;
        const diff = app - p;
        item.reappear = diff > 0 ? String(diff) : '-';
      }

      copy[index] = item;
      return copy;
    };

    if (isEdit) {
      setEditCoursesList(updater);
    } else {
      setFormData(prev => ({ ...prev, coursesList: updater(prev.coursesList || []) }));
    }
  };

  // Save new department
  const handleSaveAdd = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newCode = (formData.code && formData.code.trim()) 
      ? formData.code.trim().toUpperCase() 
      : (formData.name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 5) || 'DEPT');
    const newHod = formData.hod.trim();
    const years = Number(formData.totalYears) || 3;
    const sems = years * 2;

    const sanitizedCourses = (formData.coursesList || [])
      .filter(s => (s.code && s.code.trim()) || (s.title && s.title.trim()) || (s.handledStaff && s.handledStaff.trim()))
      .map((s, idx) => {
        const app = Number(s.appeared) || 0;
        const pass = Number(s.pass) || 0;
        const pct = app > 0 ? Math.round((pass / app) * 100) : (Number(s.passPct) || 0);
        const reap = app - pass > 0 ? String(app - pass) : (s.reappear || '-');
        return {
          sNo: idx + 1,
          code: (s.code || '').trim().toUpperCase(),
          title: (s.title || s.name || `Subject ${idx + 1}`).trim(),
          name: (s.title || s.name || `Subject ${idx + 1}`).trim(),
          handledStaff: (s.handledStaff || '').trim(),
          appeared: app,
          appearedCount: app,
          pass: pass,
          passCount: pass,
          passPct: pct,
          passPercentage: pct,
          reappear: reap,
          reappearCount: reap,
          credits: 4,
          year: 1,
          sem: 'Sem 1'
        };
      });

    const payload = {
      name: formData.name.trim(),
      code: newCode,
      hod: newHod,
      hodEmail: formatHodEmail(newHod),
      hodPhone: formData.hodPhone || '',
      totalYears: years,
      totalSemesters: sems,
      facultyCount: Number(formData.facultyCount) || 0,
      studentCount: Number(formData.studentCount) || 0,
      courseCount: sanitizedCourses.length,
      description: formData.description.trim() || '',
      establishedYear: new Date().getFullYear().toString(),
      labs: [],
      coursesList: sanitizedCourses
    };

    setIsSaving(true);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Department "${payload.name}" created successfully!`);
        setIsAddModalOpen(false);
        fetchDepartments();
      } else {
        alert(data.message || 'Failed to create department.');
      }
    } catch (err) {
      console.error('Error creating department:', err);
      alert('Network error connecting to backend: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Save edited department
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!editingDept) return;

    const newCode = (formData.code && formData.code.trim()) 
      ? formData.code.trim().toUpperCase() 
      : (editingDept.code || formData.name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 5) || 'DEPT');
    const newHod = formData.hod.trim();
    const years = Number(formData.totalYears) || editingDept.totalYears || 3;

    const sanitizedCourses = (editCoursesList || [])
      .filter(s => (s.code && s.code.trim()) || (s.title && s.title.trim()) || (s.handledStaff && s.handledStaff.trim()))
      .map((s, idx) => {
        const app = Number(s.appeared) || 0;
        const pass = Number(s.pass) || 0;
        const pct = app > 0 ? Math.round((pass / app) * 100) : (Number(s.passPct) || 0);
        const reap = app - pass > 0 ? String(app - pass) : (s.reappear || '-');
        return {
          sNo: idx + 1,
          code: (s.code || '').trim().toUpperCase(),
          title: (s.title || s.name || `Subject ${idx + 1}`).trim(),
          name: (s.title || s.name || `Subject ${idx + 1}`).trim(),
          handledStaff: (s.handledStaff || '').trim(),
          appeared: app,
          appearedCount: app,
          pass: pass,
          passCount: pass,
          passPct: pct,
          passPercentage: pct,
          reappear: reap,
          reappearCount: reap,
          credits: 4,
          year: 1,
          sem: 'Sem 1'
        };
      });

    const payload = {
      name: formData.name.trim(),
      code: newCode,
      hod: newHod,
      hodEmail: formatHodEmail(newHod),
      hodPhone: formData.hodPhone || editingDept.hodPhone || '',
      totalYears: years,
      totalSemesters: years * 2,
      facultyCount: Number(formData.facultyCount) || 0,
      studentCount: Number(formData.studentCount) || 0,
      courseCount: sanitizedCourses.length,
      description: formData.description.trim(),
      coursesList: sanitizedCourses
    };

    const targetId = editingDept._id || editingDept.id || editingDept.code;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Department "${payload.name}" updated successfully!`);
        if (viewingDept && (viewingDept._id === targetId || viewingDept.id === targetId)) {
          setViewingDept(data.data);
        }
        setEditingDept(null);
        fetchDepartments();
      } else {
        alert(data.message || 'Failed to update department.');
      }
    } catch (err) {
      console.error('Error updating department:', err);
      alert('Network error connecting to backend: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete department
  const handleConfirmDelete = async () => {
    if (!deletingDept) return;
    const targetId = deletingDept._id || deletingDept.id || deletingDept.code;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/${targetId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Department "${deletingDept.name}" removed successfully.`);
        setDeletingDept(null);
        fetchDepartments();
      } else {
        alert(data.message || 'Failed to delete department.');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    const q = searchQuery.toLowerCase().trim();
    return departments.filter(
      d =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.hod.toLowerCase().includes(q)
    );
  }, [departments, searchQuery]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans animate-fadeIn">
      
      {/* 1. TOP HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Departments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Manage academic departments, faculty allocation, student counts, and examination subject results
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Department</span>
        </button>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search departments by name, code, or HOD..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-700 font-medium">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            onClick={fetchDepartments} 
            className="px-3 py-1 bg-white border border-rose-200 rounded-lg font-bold text-rose-700 hover:bg-rose-100 cursor-pointer transition-all"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 3. DEPARTMENT CARDS GRID */}
      {isLoading && departments.length === 0 ? (
        <div className="py-16 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 bg-white border border-slate-200/90 rounded-3xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {searchQuery ? 'No departments match your search' : 'No departments added yet'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery 
                ? `No departments found matching "${searchQuery}". Try clearing search filter.`
                : 'Get started by creating your institution’s first academic department.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={handleOpenAddModal}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Department</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((dept) => (
            <div
              key={dept._id || dept.id || dept.code}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 font-semibold text-[11px] rounded-lg">
                      {dept.totalYears || 3} Yrs • {dept.totalSemesters || 6} Sems
                    </span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl border border-blue-100/80">
                      {dept.code}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  {dept.name}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  HOD: <span className="text-slate-700">{dept.hod}</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 text-center">
                <div>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900 block leading-tight">
                    {dept.facultyCount}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Faculty
                  </span>
                </div>
                <div className="border-x border-slate-200/80">
                  <span className="text-base sm:text-lg font-extrabold text-slate-900 block leading-tight">
                    {dept.studentCount}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Students
                  </span>
                </div>
                <div>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900 block leading-tight">
                    {dept.coursesList?.length || dept.courseCount || 0}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Subjects
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenViewModal(dept)}
                  className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>

                <button
                  onClick={() => handleOpenEditModal(dept)}
                  className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => setDeletingDept(dept)}
                  className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl border border-rose-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: ADD DEPARTMENT (WITH REQUESTED SUBJECT FIELDS)                   */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <ModalPortal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">Add New Department</h3>
                  <p className="text-[11px] text-slate-500">Configure department details and examination subjects</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-5">
              {/* General Department Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">General Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Computer Science"
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none transition-all ${
                        formErrors.name ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                    {formErrors.name && <p className="text-[10px] text-rose-500 mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Head of Department (HOD) *
                    </label>
                    <input
                      type="text"
                      value={formData.hod || ''}
                      onChange={(e) => setFormData({ ...formData, hod: e.target.value })}
                      placeholder="e.g. Dr. Meenakshi C"
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none transition-all ${
                        formErrors.hod ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                    {formErrors.hod && <p className="text-[10px] text-rose-500 mt-1">{formErrors.hod}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Program Duration</label>
                    <select
                      value={formData.totalYears || 3}
                      onChange={(e) => setFormData({ ...formData, totalYears: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
                    >
                      <option value={3}>3 Years (6 Semesters - UG)</option>
                      <option value={2}>2 Years (4 Semesters - PG)</option>
                      <option value={4}>4 Years (8 Semesters - Honors)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Faculty Count</label>
                    <input
                      type="number"
                      value={formData.facultyCount ?? ''}
                      onChange={(e) => setFormData({ ...formData, facultyCount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Students</label>
                    <input
                      type="number"
                      value={formData.studentCount ?? ''}
                      onChange={(e) => setFormData({ ...formData, studentCount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Exact Requested Fields: S.No, Subject Code, Subject Title, Handled Staff, Total no of Students Appear in the Examination, Pass, Pass (%), Reappear */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600" /> Department Subjects & Examination Results
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Specify subjects with staff and pass percentage stats
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddSubjectRow(false)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subject</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left border-collapse min-w-[800px] text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase border-b border-slate-200 text-center">
                        <th className="py-2.5 px-2 border-r border-slate-200 w-10">S.No</th>
                        <th className="py-2.5 px-2 border-r border-slate-200 w-28">Subject Code</th>
                        <th className="py-2.5 px-3 text-left border-r border-slate-200 min-w-[170px]">Subject Title</th>
                        <th className="py-2.5 px-3 text-left border-r border-slate-200 min-w-[150px]">Handled Staff</th>
                        <th className="py-2.5 px-2 border-r border-slate-200 min-w-[160px] leading-tight">Total no of Students Appear in the Examination</th>
                        <th className="py-2.5 px-2 border-r border-slate-200 w-16">Pass</th>
                        <th className="py-2.5 px-2 border-r border-slate-200 w-20">Pass (%)</th>
                        <th className="py-2.5 px-2 border-r border-slate-200 w-20">Reappear</th>
                        <th className="py-2.5 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(formData.coursesList || []).map((sub, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2 px-2 text-center font-bold text-slate-500 border-r border-slate-100">{idx + 1}</td>
                          <td className="py-1.5 px-1.5 border-r border-slate-100">
                            <input
                              type="text"
                              value={sub.code || ''}
                              onChange={(e) => handleSubjectFieldChange(idx, 'code', e.target.value.toUpperCase(), false)}
                              placeholder="e.g. CS101"
                              className="w-full font-mono font-bold text-blue-700 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="py-1.5 px-2 border-r border-slate-100">
                            <input
                              type="text"
                              value={sub.title || sub.name || ''}
                              onChange={(e) => handleSubjectFieldChange(idx, 'title', e.target.value, false)}
                              placeholder="e.g. Programming in C"
                              className="w-full font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="py-1.5 px-2 border-r border-slate-100">
                            <input
                              type="text"
                              value={sub.handledStaff || ''}
                              onChange={(e) => handleSubjectFieldChange(idx, 'handledStaff', e.target.value, false)}
                              placeholder="e.g. Dr. Ramesh K"
                              className="w-full text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="py-1.5 px-1.5 text-center border-r border-slate-100">
                            <input
                              type="number"
                              min="0"
                              value={sub.appeared ?? ''}
                              onChange={(e) => handleSubjectFieldChange(idx, 'appeared', e.target.value, false)}
                              placeholder="0"
                              className="w-20 text-center font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="py-1.5 px-1.5 text-center border-r border-slate-100">
                            <input
                              type="number"
                              min="0"
                              value={sub.pass ?? ''}
                              onChange={(e) => handleSubjectFieldChange(idx, 'pass', e.target.value, false)}
                              placeholder="0"
                              className="w-20 text-center font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-center border-r border-slate-100 font-black">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                              {sub.passPct || 0}%
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-center border-r border-slate-100 font-bold">
                            <span className={`px-2 py-0.5 rounded-md ${sub.reappear === '-' ? 'text-slate-400' : 'bg-rose-50 text-rose-700'}`}>
                              {sub.reappear || '-'}
                            </span>
                          </td>
                          <td className="py-1.5 px-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveSubjectRow(idx, false)}
                              className="p-1 text-slate-300 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                              title="Delete subject"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(formData.coursesList || []).length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-6 text-center text-slate-400 text-xs">
                            No subjects added yet. Click "+ Add Subject" above to register subjects.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Department</span>
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: EDIT DEPARTMENT                                                  */}
      {/* ========================================================================= */}
      {editingDept && (
        <ModalPortal isOpen={Boolean(editingDept)} onClose={() => setEditingDept(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                    Edit Department & Subjects
                  </h3>
                  <p className="text-[11px] text-slate-500">Update {editingDept.name} ({editingDept.code})</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingDept(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">General Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">HOD Name *</label>
                    <input
                      type="text"
                      value={formData.hod || ''}
                      onChange={(e) => setFormData({ ...formData, hod: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Faculty Count</label>
                    <input
                      type="number"
                      value={formData.facultyCount ?? ''}
                      onChange={(e) => setFormData({ ...formData, facultyCount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Students Enrolled</label>
                    <input
                      type="number"
                      value={formData.studentCount ?? ''}
                      onChange={(e) => setFormData({ ...formData, studentCount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Years)</label>
                    <input
                      type="number"
                      value={formData.totalYears || 3}
                      onChange={(e) => setFormData({ ...formData, totalYears: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Exact Requested Fields for Edit */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600" /> Department Subjects & Examination Results
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Manage subjects, staff handling, and pass percentage results
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddSubjectRow(true)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subject</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left border-collapse min-w-[800px] text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase border-b border-slate-200 text-center">
                        <th className="py-2.5 px-2 border-r border-slate-200 w-10">S.No</th>
                        <th className="py-2.5 px-2 border-r border-slate-200 w-28">Subject Code</th>
                        <th className="py-2.5 px-3 text-left border-r border-slate-200 min-w-[170px]">Subject Title</th>
                        <th className="py-2.5 px-3 text-left border-r border-slate-200 min-w-[150px]">Handled Staff</th>
                        <th className="py-2.5 px-2 border-r border-slate-200 min-w-[160px] leading-tight">Total no of Students Appear in the Examination</th>
                        <th className="py-2.5 px-2 border-r border-slate-200 w-16">Pass</th>
                        <th className="py-2.5 px-2 border-r border-slate-200 w-20">Pass (%)</th>
                        <th className="py-2.5 px-2 border-r border-slate-200 w-20">Reappear</th>
                        <th className="py-2.5 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editCoursesList.map((sub, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2 px-2 text-center font-bold text-slate-500 border-r border-slate-100">{idx + 1}</td>
                          <td className="py-1.5 px-1.5 border-r border-slate-100">
                            <input
                              type="text"
                              value={sub.code || ''}
                              onChange={(e) => handleSubjectFieldChange(idx, 'code', e.target.value.toUpperCase(), true)}
                              placeholder="e.g. CS101"
                              className="w-full font-mono font-bold text-blue-700 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="py-1.5 px-2 border-r border-slate-100">
                            <input
                              type="text"
                              value={sub.title || sub.name || ''}
                              onChange={(e) => handleSubjectFieldChange(idx, 'title', e.target.value, true)}
                              placeholder="e.g. Programming in C"
                              className="w-full font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="py-1.5 px-2 border-r border-slate-100">
                            <input
                              type="text"
                              value={sub.handledStaff || ''}
                              onChange={(e) => handleSubjectFieldChange(idx, 'handledStaff', e.target.value, true)}
                              placeholder="e.g. Dr. Ramesh K"
                              className="w-full text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="py-1.5 px-1.5 text-center border-r border-slate-100">
                            <input
                              type="number"
                              min="0"
                              value={sub.appeared ?? ''}
                              onChange={(e) => handleSubjectFieldChange(idx, 'appeared', e.target.value, true)}
                              placeholder="0"
                              className="w-20 text-center font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="py-1.5 px-1.5 text-center border-r border-slate-100">
                            <input
                              type="number"
                              min="0"
                              value={sub.pass ?? ''}
                              onChange={(e) => handleSubjectFieldChange(idx, 'pass', e.target.value, true)}
                              placeholder="0"
                              className="w-20 text-center font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-center border-r border-slate-100 font-black">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                              {sub.passPct || 0}%
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-center border-r border-slate-100 font-bold">
                            <span className={`px-2 py-0.5 rounded-md ${sub.reappear === '-' ? 'text-slate-400' : 'bg-rose-50 text-rose-700'}`}>
                              {sub.reappear || '-'}
                            </span>
                          </td>
                          <td className="py-1.5 px-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveSubjectRow(idx, true)}
                              className="p-1 text-slate-300 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                              title="Delete subject"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Update Department</span>
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: VIEW DEPARTMENT (EXACT REQUESTED FIELDS SHOWN IN TABLE)          */}
      {/* ========================================================================= */}
      {viewingDept && (
        <ModalPortal isOpen={Boolean(viewingDept)} onClose={() => setViewingDept(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 gap-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl border border-blue-100/90 shadow-2xs">
                  {viewingDept.code}
                </span>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                    {viewingDept.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {viewingDept.totalYears || 3} Years Curriculum • {viewingDept.facultyCount} Faculty • {viewingDept.studentCount} Students
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setViewingDept(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100/80 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Department Head (HOD) Banner */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                  {viewingDept.hod ? viewingDept.hod.split(' ').map(n => n[0]).join('').substring(0, 2) : 'HD'}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    DEPARTMENT LEADERSHIP
                  </span>
                  <p className="text-sm font-bold text-slate-900">{viewingDept.hod}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-white text-slate-600 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs hidden sm:inline-block">
                {formatHodEmail(viewingDept.hod)}
              </span>
            </div>

            {/* Exact Requested Fields: S.No, Subject Code, Subject Title, Handled Staff, Total Appear, Pass, Pass (%), Reappear */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" /> DEPARTMENT EXAMINATION RESULTS & SUBJECTS
              </h4>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse min-w-[760px] text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-black text-[10px] uppercase border-b border-slate-200 text-center">
                      <th className="py-2.5 px-2 border-r border-slate-200 w-12">S.No</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 w-28">Subject Code</th>
                      <th className="py-2.5 px-3 text-left border-r border-slate-200 min-w-[180px]">Subject Title</th>
                      <th className="py-2.5 px-3 text-left border-r border-slate-200 min-w-[150px]">Handled Staff</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 w-32">
                        Total no of Students Appear in the Examination
                      </th>
                      <th className="py-2.5 px-2 border-r border-slate-200 w-20">Pass</th>
                      <th className="py-2.5 px-2 border-r border-slate-200 w-24">Pass (%)</th>
                      <th className="py-2.5 px-2 w-24">Reappear</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(viewingDept.coursesList && viewingDept.coursesList.length > 0) ? (
                      viewingDept.coursesList.map((sub, idx) => {
                        const appearVal = sub.appeared !== undefined ? sub.appeared : (sub.appearedCount !== undefined ? sub.appearedCount : (viewingDept.studentCount || 28));
                        const passVal = sub.pass !== undefined ? sub.pass : (sub.passCount !== undefined ? sub.passCount : (viewingDept.studentCount || 28));
                        const pctVal = sub.passPct !== undefined ? sub.passPct : (sub.passPercentage !== undefined ? sub.passPercentage : 100);
                        const reapVal = sub.reappear !== undefined ? sub.reappear : (sub.reappearCount !== undefined ? sub.reappearCount : '-');

                        return (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-2 text-center font-bold text-slate-500 border-r border-slate-100">{sub.sNo || idx + 1}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-700 border-r border-slate-100">{sub.code}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-100">{sub.title || sub.name}</td>
                            <td className="py-2.5 px-3 text-slate-700 border-r border-slate-100">{sub.handledStaff || 'Faculty Member'}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-800 border-r border-slate-100">{appearVal}</td>
                            <td className="py-2.5 px-2 text-center font-bold text-slate-900 border-r border-slate-100">{passVal}</td>
                            <td className="py-2.5 px-2 text-center font-black border-r border-slate-100">
                              <span className={`px-2 py-0.5 rounded-md ${pctVal >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                                {pctVal}%
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center font-bold">
                              <span className={`px-2 py-0.5 rounded-md ${reapVal === '-' ? 'text-slate-400' : 'bg-rose-50 text-rose-700 font-black'}`}>
                                {reapVal}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                          No subjects registered for this department. Edit this department to add subjects.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Bottom: Close Button */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingDept(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deletingDept && (
        <ModalPortal isOpen={Boolean(deletingDept)} onClose={() => setDeletingDept(null)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">Delete Department</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to remove <strong className="text-slate-800">{deletingDept.name}</strong> ({deletingDept.code})?
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-700 font-medium">
              This will remove this department from active academic listings.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDept(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* FLOATING SUCCESS TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 animate-slideUp text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
