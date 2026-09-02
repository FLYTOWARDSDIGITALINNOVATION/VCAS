import React, { useState } from 'react';
import AddStudentWizard from './AddStudentWizard';
import StudentProfileView from './StudentProfileView';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  ChevronDown, 
  Check, 
  X,
  UserPlus,
  ArrowUpDown,
  AlertTriangle
} from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedFeeStatus, setSelectedFeeStatus] = useState('All Statuses');
  const [selectedRows, setSelectedRows] = useState([]);
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteModalStudent, setDeleteModalStudent] = useState(null);

  // Disable background page scrolling ONLY when popup overlay modals are active
  React.useEffect(() => {
    const isAnyModalOpen = Boolean(editingStudent || deleteModalStudent || showAddWizard || selectedStudentProfile);
    const scrollContainer = document.getElementById('main-content-scroll-container');
    if (isAnyModalOpen) {
    if (editingStudent || deleteModalStudent) {
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
  }, [editingStudent, deleteModalStudent]);

  // Initial 7 students matching exact Figma screenshot data
  const [students, setStudents] = useState([
    {
      id: 'STU001',
      admNo: 'ADM2024001',
      name: 'Arjun Sharma',
      sem: '4th Sem',
      department: 'Computer Science',
      course: 'B.Tech',
      phone: '9876543210',
      attendance: 88,
      feeStatus: 'Paid',
      status: 'Active'
    },
    {
      id: 'STU002',
      admNo: 'ADM2024002',
      name: 'Priya Mehta',
      sem: '4th Sem',
      department: 'Electronics',
      course: 'B.Tech',
      phone: '9876543211',
      attendance: 72,
      feeStatus: 'Pending',
      status: 'Active'
    },
    {
      id: 'STU003',
      admNo: 'ADM2024003',
      name: 'Rahul Verma',
      sem: '2nd Sem',
      department: 'MBA',
      course: 'MBA',
      phone: '9876543212',
      attendance: 65,
      feeStatus: 'Partial',
      status: 'Active'
    },
    {
      id: 'STU004',
      admNo: 'ADM2024004',
      name: 'Sneha Nair',
      sem: '1st Sem',
      department: 'Computer Science',
      course: 'MCA',
      phone: '9876543213',
      attendance: 91,
      feeStatus: 'Paid',
      status: 'Active'
    },
    {
      id: 'STU005',
      admNo: 'ADM2024005',
      name: 'Karthik Rajan',
      sem: '6th Sem',
      department: 'Mechanical',
      course: 'B.Tech',
      phone: '9876543214',
      attendance: 58,
      feeStatus: 'Overdue',
      status: 'Inactive'
    },
    {
      id: 'STU006',
      admNo: 'ADM2024006',
      name: 'Divya Krishnan',
      sem: '2nd Sem',
      department: 'Civil',
      course: 'B.Tech',
      phone: '9876543215',
      attendance: 83,
      feeStatus: 'Paid',
      status: 'Active'
    },
    {
      id: 'STU007',
      admNo: 'ADM2024007',
      name: 'Amit Patel',
      sem: '8th Sem',
      department: 'Electronics',
      course: 'B.Tech',
      phone: '9876543216',
      attendance: 77,
      feeStatus: 'Paid',
      status: 'Active'
    }
  ]);

  // Form state for adding new student
  const [newStudent, setNewStudent] = useState({
    name: '',
    sem: '1st Sem',
    department: 'Computer Science',
    course: 'B.Tech',
    phone: '',
    attendance: 85,
    feeStatus: 'Paid',
    status: 'Active'
  });

  // Filter students based on search and dropdowns
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone.includes(searchTerm);

    const matchesDept = selectedDept === 'All Departments' || student.department === selectedDept;
    const matchesFee = selectedFeeStatus === 'All Statuses' || student.feeStatus === selectedFeeStatus;

    return matchesSearch && matchesDept && matchesFee;
  });

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(filteredStudents.map(s => s.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rId => rId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const handleAddStudentSubmit = (e) => {
    e.preventDefault();
    const count = students.length + 1;
    const createdStudent = {
      ...newStudent,
      id: `STU${String(count).padStart(3, '0')}`,
      admNo: `ADM2024${String(count).padStart(3, '0')}`
    };
    setStudents([...students, createdStudent]);
    setShowAddModal(false);
    setNewStudent({
      name: '',
      sem: '1st Sem',
      department: 'Computer Science',
      course: 'B.Tech',
      phone: '',
      attendance: 85,
      feeStatus: 'Paid',
      status: 'Active'
    });
  };

  const getFeeBadgeClass = (feeStatus) => {
    switch(feeStatus) {
      case 'Paid': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'Pending': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'Partial': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'Overdue': return 'bg-rose-100 text-rose-700 border border-rose-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleDownloadStudent = (student) => {
    const content = `
VIDYAPEETH MANAGEMENT SYSTEM - STUDENT PROFILE REPORT
======================================================
Student Name : ${student.name}
Student ID   : ${student.id}
Admission No : ${student.admNo}
Department   : ${student.department}
Course       : ${student.course}
Semester     : ${student.sem}
Phone        : ${student.phone}
Attendance   : ${student.attendance}%
Fee Status   : ${student.feeStatus}
Status       : ${student.status}
Report Date  : ${new Date().toLocaleString()}
======================================================
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${student.name.replace(/\s+/g, '_')}_Profile.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setStudents(students.map(s => s.id === editingStudent.id ? editingStudent : s));
    setEditingStudent(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteModalStudent) return;
    setStudents(students.filter(s => s.id !== deleteModalStudent.id));
    setDeleteModalStudent(null);
  };

  const handleCompleteWizard = (newStudentData) => {
    const count = students.length + 1;
    const createdStudent = {
      id: `STU${String(count).padStart(3, '0')}`,
      admNo: newStudentData.admissionNo || `ADM2024${String(count).padStart(3, '0')}`,
      name: newStudentData.fullName || 'New Registered Student',
      sem: newStudentData.semester || '1st Sem',
      department: newStudentData.department || 'Computer Science',
      course: newStudentData.course || 'B.Tech',
      phone: newStudentData.mobile || '9876543219',
      attendance: 100,
      feeStatus: 'Paid',
      status: 'Active'
    };
    setStudents([createdStudent, ...students]);
    setShowAddWizard(false);
  };

  if (selectedStudentProfile) {
    return (
      <StudentProfileView 
        student={selectedStudentProfile}
        onBack={() => setSelectedStudentProfile(null)}
      />
    );
  }

  if (showAddWizard) {
    return (
      <AddStudentWizard 
        onBack={() => setShowAddWizard(false)}
        onComplete={handleCompleteWizard}
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-xs text-slate-500 mt-1">
            {students.length} total students
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert("Exporting student list to CSV...")}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 shadow-sm flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export
          </button>
          <button 
            onClick={() => setShowAddWizard(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all h-10"
            />
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Department Dropdown Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer h-10"
            >
              <option value="All Departments">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
              <option value="MBA">MBA</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
            </select>

            {/* Courses Filter */}
            <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer h-10">
              <option value="All Courses">All Courses</option>
              <option value="B.Tech">B.Tech</option>
              <option value="MBA">MBA</option>
              <option value="MCA">MCA</option>
            </select>

            {/* Semesters Filter */}
            <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer h-10">
              <option value="All Semesters">All Semesters</option>
              <option value="1st Sem">1st Sem</option>
              <option value="2nd Sem">2nd Sem</option>
              <option value="4th Sem">4th Sem</option>
              <option value="6th Sem">6th Sem</option>
              <option value="8th Sem">8th Sem</option>
            </select>

            {/* Fee Statuses Filter */}
            <select 
              value={selectedFeeStatus}
              onChange={(e) => setSelectedFeeStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer h-10"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

        </div>
      </div>

      {/* STUDENTS TABLE CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input 
                    type="checkbox"
                    checked={selectedRows.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3.5 px-4">STUDENT</th>
                <th className="py-3.5 px-4">ID / ADM NO.</th>
                <th className="py-3.5 px-4">DEPARTMENT</th>
                <th className="py-3.5 px-4">COURSE</th>
                <th className="py-3.5 px-4">PHONE</th>
                <th className="py-3.5 px-4">ATTENDANCE</th>
                <th className="py-3.5 px-4 text-center">FEES</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400 font-normal">
                    No students match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isChecked = selectedRows.includes(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectRow(student.id)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                      </td>

                      {/* Student Info */}
                      <td className="py-3.5 px-4 cursor-pointer" onClick={() => setSelectedStudentProfile(student)}>
                        <div className="flex items-center gap-3 group">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{student.name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{student.sem}</p>
                          </div>
                        </div>
                      </td>

                      {/* ID / ADM NO */}
                      <td className="py-3.5 px-4 cursor-pointer" onClick={() => setSelectedStudentProfile(student)}>
                        <p className="font-bold text-slate-800">{student.id}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{student.admNo}</p>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {student.department}
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">
                        {student.course}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {student.phone}
                      </td>

                      {/* Attendance */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 min-w-[110px]">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0">
                            <div 
                              className={`h-full rounded-full ${
                                student.attendance >= 80 ? 'bg-emerald-500' :
                                student.attendance >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                              }`} 
                              style={{ width: `${student.attendance}%` }}
                            ></div>
                          </div>
                          <span className={`font-bold text-[11px] ${
                            student.attendance >= 80 ? 'text-emerald-600' :
                            student.attendance >= 65 ? 'text-amber-600' : 'text-rose-600'
                          }`}>
                            {student.attendance}%
                          </span>
                        </div>
                      </td>

                      {/* Fee Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[72px] px-2.5 py-1 rounded-full text-[11px] font-bold ${getFeeBadgeClass(student.feeStatus)}`}>
                          {student.feeStatus}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[72px] px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          student.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {student.status}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => setSelectedStudentProfile(student)}
                            title="View Full Profile"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setEditingStudent({ ...student })}
                            title="Edit Student"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDownloadStudent(student)}
                            title="Download Profile Report"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteModalStudent(student)}
                            title="Delete Student"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span className="font-medium">Showing {filteredStudents.length} of {students.length} students</span>
          
          <div className="flex items-center gap-1.5">
            {['1', '2', '3', '...', '12'].map((page, i) => (
              <button 
                key={i}
                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                  page === '1' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* EDIT STUDENT MODAL (ALL FIELDS EDITABLE) */}
      {editingStudent && (
        <ModalPortal isOpen={Boolean(editingStudent)} onClose={() => setEditingStudent(null)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Student Profile</h3>
                <p className="text-xs text-slate-400 font-mono">Editing Record: {editingStudent.id}</p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              
              {/* Full Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Student ID & Admission No */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student ID</label>
                  <input 
                    type="text" 
                    required
                    value={editingStudent.id}
                    onChange={(e) => setEditingStudent({ ...editingStudent, id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admission No.</label>
                  <input 
                    type="text" 
                    required
                    value={editingStudent.admNo}
                    onChange={(e) => setEditingStudent({ ...editingStudent, admNo: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Department & Course */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select 
                    value={editingStudent.department}
                    onChange={(e) => setEditingStudent({ ...editingStudent, department: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics">Electronics</option>
                    <option value="MBA">MBA</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Course</label>
                  <select 
                    value={editingStudent.course}
                    onChange={(e) => setEditingStudent({ ...editingStudent, course: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="B.Tech">B.Tech</option>
                    <option value="MBA">MBA</option>
                    <option value="MCA">MCA</option>
                  </select>
                </div>
              </div>

              {/* Semester & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester</label>
                  <select 
                    value={editingStudent.sem}
                    onChange={(e) => setEditingStudent({ ...editingStudent, sem: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="1st Sem">1st Sem</option>
                    <option value="2nd Sem">2nd Sem</option>
                    <option value="3rd Sem">3rd Sem</option>
                    <option value="4th Sem">4th Sem</option>
                    <option value="5th Sem">5th Sem</option>
                    <option value="6th Sem">6th Sem</option>
                    <option value="7th Sem">7th Sem</option>
                    <option value="8th Sem">8th Sem</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    required
                    value={editingStudent.phone}
                    onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Attendance % & Fee Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Attendance (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    required
                    value={editingStudent.attendance}
                    onChange={(e) => setEditingStudent({ ...editingStudent, attendance: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fee Status</label>
                  <select 
                    value={editingStudent.feeStatus}
                    onChange={(e) => setEditingStudent({ ...editingStudent, feeStatus: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              {/* Status (Active / Inactive) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                <select 
                  value={editingStudent.status}
                  onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalStudent && (
        <ModalPortal isOpen={Boolean(deleteModalStudent)} onClose={() => setDeleteModalStudent(null)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">Delete Student Record</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete <strong className="text-slate-900">{deleteModalStudent.name}</strong> ({deleteModalStudent.id})?
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
              <p>This action will remove the student record from Vidyapeeth Management System.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalStudent(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
