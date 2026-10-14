import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../../apiConfig';
import { 
  UserPlus, 
  Users, 
  Search, 
  Save, 
  Loader2, 
  CheckCircle2, 
  GraduationCap, 
  RefreshCw, 
  Calendar,
  Eye,
  Edit,
  X
} from 'lucide-react';
import ModalPortal from '../ModalPortal';

const API_BASE = BACKEND_URL;

export default function StaffStudentEntry({ staffUser }) {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentsList, setDepartmentsList] = useState([]);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form State: Exactly 1–8 Fields from College Transfer Certificate
  const [formData, setFormData] = useState({
    name: '',                    // 1. NAME
    gender: 'Male',              // 2. GENDER
    dob: '',                     // 3. DATE OF BIRTH
    fatherName: '',              // 4. FATHER'S NAME
    nationalityReligion: 'INDIAN & HINDU', // 5. NATIONALITY & RELIGION
    casteCommunity: '',          // 6. CASTE AND COMMUNITY
    dateOfAdmission: new Date().toISOString().split('T')[0], // 7. DATE OF ADMISSION
    courseAdmitted: ''           // 8. COURSE IN WHICH ADMITTED
  });

  const [formErrors, setFormErrors] = useState({});

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Fetch departments for course suggestions
  useEffect(() => {
    fetch(`${API_BASE}/api/departments`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setDepartmentsList(data.data);
          if (data.data.length > 0 && !formData.courseAdmitted) {
            setFormData(prev => ({ ...prev, courseAdmitted: data.data[0].name }));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch students from MongoDB backend
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/students`);
      const data = await res.json();
      if (res.ok && data.success) {
        setStudents(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = '1. Student Name is required';
    if (!formData.gender) errors.gender = '2. Gender is required';
    if (!formData.dob) errors.dob = '3. Date of Birth is required';
    if (!formData.fatherName.trim()) errors.fatherName = "4. Father's Name is required";
    if (!formData.nationalityReligion.trim()) errors.nationalityReligion = '5. Nationality & Religion is required';
    if (!formData.casteCommunity.trim()) errors.casteCommunity = '6. Caste and Community is required';
    if (!formData.dateOfAdmission) errors.dateOfAdmission = '7. Date of Admission is required';
    if (!formData.courseAdmitted.trim()) errors.courseAdmitted = '8. Course in Which Admitted is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim().toUpperCase(),
        gender: formData.gender,
        dob: formData.dob,
        fatherName: formData.fatherName.trim().toUpperCase(),
        nationalityReligion: formData.nationalityReligion.trim().toUpperCase(),
        casteCommunity: formData.casteCommunity.trim().toUpperCase(),
        dateOfAdmission: formData.dateOfAdmission,
        courseAdmitted: formData.courseAdmitted.trim().toUpperCase(),
        department: formData.courseAdmitted.trim(),
        course: formData.courseAdmitted.trim(),
        status: 'Active',
        attendance: 100,
        feeStatus: 'Paid'
      };

      const res = await fetch(`${API_BASE}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`Student "${payload.name}" registered successfully!`);
        // Reset form
        setFormData({
          name: '',
          gender: 'Male',
          dob: '',
          fatherName: '',
          nationalityReligion: 'INDIAN & HINDU',
          casteCommunity: '',
          dateOfAdmission: new Date().toISOString().split('T')[0],
          courseAdmitted: departmentsList[0]?.name || ''
        });
        setFormErrors({});
        fetchStudents();
      } else {
        alert(data.message || 'Failed to register student.');
      }
    } catch (err) {
      console.error('Error saving student:', err);
      alert('Network error connecting to backend: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (st) => {
    setEditingStudent({
      _id: st._id,
      id: st.id || st.studentId || st._id,
      studentId: st.studentId || st.id || st._id,
      name: st.name || st.fullName || '',
      gender: st.gender || 'Male',
      dob: st.dob || '',
      fatherName: st.fatherName || '',
      nationalityReligion: st.nationalityReligion || 'INDIAN & HINDU',
      casteCommunity: st.casteCommunity || '',
      dateOfAdmission: st.dateOfAdmission || '',
      courseAdmitted: st.courseAdmitted || st.course || st.department || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!editingStudent.name.trim()) {
      alert('1. Name of the Student is required');
      return;
    }
    setIsUpdating(true);
    try {
      const targetId = editingStudent._id || editingStudent.studentId || editingStudent.id;
      const payload = {
        name: editingStudent.name.trim().toUpperCase(),
        gender: editingStudent.gender,
        dob: editingStudent.dob,
        fatherName: (editingStudent.fatherName || '').trim().toUpperCase(),
        nationalityReligion: (editingStudent.nationalityReligion || 'INDIAN & HINDU').trim().toUpperCase(),
        casteCommunity: (editingStudent.casteCommunity || '').trim().toUpperCase(),
        dateOfAdmission: editingStudent.dateOfAdmission,
        courseAdmitted: (editingStudent.courseAdmitted || '').trim().toUpperCase(),
        department: (editingStudent.courseAdmitted || '').trim(),
        course: (editingStudent.courseAdmitted || '').trim()
      };

      const res = await fetch(`${API_BASE}/api/students/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Student "${payload.name}" updated successfully!`);
        setEditingStudent(null);
        fetchStudents();
      } else {
        alert(data.message || 'Failed to update student.');
      }
    } catch (err) {
      console.error('Error updating student:', err);
      alert('Network error updating student: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredStudents = students.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.fatherName || '').toLowerCase().includes(q) ||
      (s.courseAdmitted || s.course || '').toLowerCase().includes(q) ||
      (s.casteCommunity || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full font-sans animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-extrabold text-xs rounded-xl border border-blue-200">
              Staff Portal
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200">
              Synced with Admin & Super Admin
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            Student Details Entry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Official Transfer Certificate format • Enter fields 1 to 8 alone
          </p>
        </div>

        <button
          onClick={fetchStudents}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* 1–8 Fields Entry Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border-b border-blue-200/80 text-slate-900 p-6 sm:p-7 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">New Student Admission Entry</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter 1 to 8 fields alone • Automatically visible on Admin & Super-Admin sides
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 bg-white text-blue-700 text-xs font-bold rounded-xl border border-blue-200 shadow-xs">
            Fields 1–8 Alone
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* 1. NAME */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Name of the Student *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 uppercase focus:bg-white focus:outline-none transition-all ${
                  formErrors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {formErrors.name && <p className="text-[10px] text-rose-500 font-bold">{formErrors.name}</p>}
            </div>

            {/* 2. GENDER */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Male">MALE</option>
                <option value="Female">FEMALE</option>
                <option value="Transgender">TRANSGENDER</option>
              </select>
              {formErrors.gender && <p className="text-[10px] text-rose-500 font-bold">{formErrors.gender}</p>}
            </div>

            {/* 3. DATE OF BIRTH */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Date of Birth *
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none transition-all ${
                  formErrors.dob ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {formErrors.dob && <p className="text-[10px] text-rose-500 font-bold">{formErrors.dob}</p>}
            </div>

            {/* 4. FATHER'S NAME */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                4. Father's Name *
              </label>
              <input
                type="text"
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value.toUpperCase() })}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 uppercase focus:bg-white focus:outline-none transition-all ${
                  formErrors.fatherName ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {formErrors.fatherName && <p className="text-[10px] text-rose-500 font-bold">{formErrors.fatherName}</p>}
            </div>

            {/* 5. NATIONALITY & RELIGION */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                5. Nationality & Religion *
              </label>
              <input
                type="text"
                value={formData.nationalityReligion}
                onChange={(e) => setFormData({ ...formData, nationalityReligion: e.target.value.toUpperCase() })}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 uppercase focus:bg-white focus:outline-none transition-all ${
                  formErrors.nationalityReligion ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {formErrors.nationalityReligion && <p className="text-[10px] text-rose-500 font-bold">{formErrors.nationalityReligion}</p>}
            </div>

            {/* 6. CASTE AND COMMUNITY */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                6. Caste and Community *
              </label>
              <input
                type="text"
                value={formData.casteCommunity}
                onChange={(e) => setFormData({ ...formData, casteCommunity: e.target.value.toUpperCase() })}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 uppercase focus:bg-white focus:outline-none transition-all ${
                  formErrors.casteCommunity ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {formErrors.casteCommunity && <p className="text-[10px] text-rose-500 font-bold">{formErrors.casteCommunity}</p>}
            </div>

            {/* 7. DATE OF ADMISSION */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                7. Date of Admission *
              </label>
              <input
                type="date"
                value={formData.dateOfAdmission}
                onChange={(e) => setFormData({ ...formData, dateOfAdmission: e.target.value })}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none transition-all ${
                  formErrors.dateOfAdmission ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {formErrors.dateOfAdmission && <p className="text-[10px] text-rose-500 font-bold">{formErrors.dateOfAdmission}</p>}
            </div>

            {/* 8. COURSE IN WHICH ADMITTED */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                8. Course in Which Admitted *
              </label>
              <input
                type="text"
                list="staff-courses-preset-list"
                value={formData.courseAdmitted}
                onChange={(e) => setFormData({ ...formData, courseAdmitted: e.target.value.toUpperCase() })}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 uppercase focus:bg-white focus:outline-none transition-all ${
                  formErrors.courseAdmitted ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              <datalist id="staff-courses-preset-list">
                {departmentsList.map(dept => (
                  <option key={dept._id || dept.code} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
                <option value="B.Sc. (CRIMINOLOGY AND FORENSIC SCIENCE)" />
                <option value="B.Sc. COMPUTER SCIENCE" />
                <option value="B.Com." />
                <option value="B.B.A." />
                <option value="B.A. ENGLISH" />
              </datalist>
              {formErrors.courseAdmitted && <p className="text-[10px] text-rose-500 font-bold">{formErrors.courseAdmitted}</p>}
            </div>

          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save & Register Student</span>
            </button>
          </div>
        </form>
      </div>

      {/* Table: Registered Students with Exact 1–8 Fields */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Registered Students ({filteredStudents.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live records synced directly with Admin and Super-Admin
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse min-w-[950px] text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase border-b border-slate-200 text-center">
                <th className="py-2.5 px-2 border-r border-slate-200 w-10">S.No</th>
                <th className="py-2.5 px-3 text-left border-r border-slate-200 min-w-[150px]">1. Name</th>
                <th className="py-2.5 px-2 border-r border-slate-200 w-20">2. Gender</th>
                <th className="py-2.5 px-2 border-r border-slate-200 w-28">3. Date of Birth</th>
                <th className="py-2.5 px-3 text-left border-r border-slate-200 min-w-[140px]">4. Father's Name</th>
                <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">5. Nationality & Religion</th>
                <th className="py-2.5 px-3 border-r border-slate-200 min-w-[130px]">6. Caste & Community</th>
                <th className="py-2.5 px-2 border-r border-slate-200 w-28">7. Date of Admission</th>
                <th className="py-2.5 px-3 text-left border-r border-slate-200 min-w-[180px]">8. Course Admitted</th>
                <th className="py-2.5 px-3 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 text-xs">
                    {searchQuery ? 'No students matched your search.' : 'No students registered yet. Fill the form above to add a student.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => (
                  <tr key={st._id || st.studentId || idx} className="hover:bg-slate-50/70">
                    <td className="py-2 px-2 text-center font-bold text-slate-500 border-r border-slate-100">{idx + 1}</td>
                    <td className="py-2 px-3 font-extrabold text-slate-900 border-r border-slate-100 uppercase">{st.name || st.fullName}</td>
                    <td className="py-2 px-2 text-center border-r border-slate-100">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {st.gender || 'MALE'}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center font-medium text-slate-700 border-r border-slate-100">{st.dob || '—'}</td>
                    <td className="py-2 px-3 text-slate-800 font-bold border-r border-slate-100 uppercase">{st.fatherName || '—'}</td>
                    <td className="py-2 px-3 text-center text-slate-700 font-semibold border-r border-slate-100">{st.nationalityReligion || 'INDIAN & HINDU'}</td>
                    <td className="py-2 px-3 text-center text-slate-700 font-bold border-r border-slate-100">{st.casteCommunity || '—'}</td>
                    <td className="py-2 px-2 text-center font-medium text-slate-700 border-r border-slate-100">{st.dateOfAdmission || '—'}</td>
                    <td className="py-2 px-3 text-slate-800 font-bold border-r border-slate-100">{st.courseAdmitted || st.course || st.department || '—'}</td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingStudent(st)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          title="View Full Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(st)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                          title="Edit Student"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Student Modal */}
      {viewingStudent && (
        <ModalPortal isOpen={Boolean(viewingStudent)} onClose={() => setViewingStudent(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Student Details (Fields 1–8)</h3>
              <button onClick={() => setViewingStudent(null)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex justify-between">
                <span className="font-bold text-slate-500">1. Name:</span>
                <span className="font-extrabold text-slate-900 uppercase">{viewingStudent.name || viewingStudent.fullName}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="font-bold text-slate-500">2. Gender:</span>
                <span className="font-bold text-slate-800">{viewingStudent.gender || 'MALE'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="font-bold text-slate-500">3. Date of Birth:</span>
                <span className="font-bold text-slate-800">{viewingStudent.dob || '—'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="font-bold text-slate-500">4. Father's Name:</span>
                <span className="font-bold text-slate-800 uppercase">{viewingStudent.fatherName || '—'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="font-bold text-slate-500">5. Nationality & Religion:</span>
                <span className="font-bold text-slate-800">{viewingStudent.nationalityReligion || 'INDIAN & HINDU'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="font-bold text-slate-500">6. Caste & Community:</span>
                <span className="font-bold text-slate-800 uppercase">{viewingStudent.casteCommunity || '—'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="font-bold text-slate-500">7. Date of Admission:</span>
                <span className="font-bold text-slate-800">{viewingStudent.dateOfAdmission || '—'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="font-bold text-slate-500">8. Course in Which Admitted:</span>
                <span className="font-extrabold text-blue-700">{viewingStudent.courseAdmitted || viewingStudent.course || viewingStudent.department || '—'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const target = viewingStudent;
                  setViewingStudent(null);
                  handleOpenEdit(target);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Student</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Edit Student Modal (Fields 1–8, Zero Placeholders) */}
      {editingStudent && (
        <ModalPortal isOpen={Boolean(editingStudent)} onClose={() => setEditingStudent(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Edit Student Details</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update Transfer Certificate fields 1 to 8 • Synced across all portals
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingStudent(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Name */}
                <div className="space-y-1 md:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    1. Name of the Student *
                  </label>
                  <input 
                    type="text" 
                    required
                    value={editingStudent.name}
                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold uppercase focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* 2. Gender */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    2. Gender *
                  </label>
                  <select 
                    value={editingStudent.gender || 'Male'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Male">MALE</option>
                    <option value="Female">FEMALE</option>
                    <option value="Transgender">TRANSGENDER</option>
                  </select>
                </div>

                {/* 3. DOB */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    3. Date of Birth *
                  </label>
                  <input 
                    type="date" 
                    value={editingStudent.dob || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* 4. Father's Name */}
                <div className="space-y-1 md:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    4. Father's Name *
                  </label>
                  <input 
                    type="text" 
                    value={editingStudent.fatherName || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, fatherName: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold uppercase focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* 5. Nationality & Religion */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    5. Nationality & Religion *
                  </label>
                  <input 
                    type="text" 
                    value={editingStudent.nationalityReligion || 'INDIAN & HINDU'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, nationalityReligion: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold uppercase focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* 6. Caste & Community */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    6. Caste and Community *
                  </label>
                  <input 
                    type="text" 
                    value={editingStudent.casteCommunity || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, casteCommunity: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold uppercase focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* 7. Date of Admission */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    7. Date of Admission *
                  </label>
                  <input 
                    type="date" 
                    value={editingStudent.dateOfAdmission || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, dateOfAdmission: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* 8. Course Admitted */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    8. Course in Which Admitted *
                  </label>
                  <input 
                    type="text" 
                    list="staff-edit-courses-preset-list"
                    value={editingStudent.courseAdmitted || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, courseAdmitted: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold uppercase focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                  <datalist id="staff-edit-courses-preset-list">
                    {departmentsList.map(dept => (
                      <option key={dept._id || dept.code} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                    <option value="B.Sc. (CRIMINOLOGY AND FORENSIC SCIENCE)" />
                    <option value="B.Sc. COMPUTER SCIENCE" />
                    <option value="B.Com." />
                    <option value="B.B.A." />
                    <option value="B.A. ENGLISH" />
                  </datalist>
                </div>

              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 animate-slideUp text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
