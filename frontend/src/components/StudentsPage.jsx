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
  AlertTriangle,
  Key,
  Copy,
  Printer
} from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function StudentsPage({ user, canViewFees = (user?.role === 'Accountant' || user?.role === 'Office Staff') }) {
  const isSuperAdmin = user?.role === 'Super Admin' || user?.isSuperAdmin;
  const [credentialModalStudent, setCredentialModalStudent] = useState(null);
  const [copiedStudentCred, setCopiedStudentCred] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedFeeStatus, setSelectedFeeStatus] = useState('All Statuses');
  const [selectedRows, setSelectedRows] = useState([]);
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteModalStudent, setDeleteModalStudent] = useState(null);

  // Ensure main scroll container is active and unlocked for students page, wizard, and profile views
  React.useEffect(() => {
    const scrollContainer = document.getElementById('main-content-scroll-container');
    document.body.style.overflow = 'unset';
    if (scrollContainer) {
      scrollContainer.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'unset';
      if (scrollContainer) {
        scrollContainer.style.overflow = 'auto';
      }
    };
  }, []);

  // Initial 7 students matching Arts and Science college curriculum
  const [students, setStudents] = useState([
    {
      id: 'STU001',
      admNo: 'ADM2024001',
      name: 'Arjun Sharma',
      sem: '4th Sem',
      department: 'Computer Science',
      course: 'B.Sc CS',
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
      department: 'Commerce',
      course: 'B.Com',
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
      department: 'Business Administration (BBA)',
      course: 'BBA',
      phone: '9876543212',
      attendance: 65,
      feeStatus: 'Partial',
      status: 'Active'
    },
    {
      id: 'STU004',
      admNo: 'ADM2024004',
      name: 'Sneha Nair',
      sem: '2nd Sem',
      department: 'Commerce',
      course: 'M.Com',
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
      department: 'English Literature',
      course: 'B.A. English',
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
      department: 'Mathematics',
      course: 'B.Sc Maths',
      phone: '9876543215',
      attendance: 83,
      feeStatus: 'Paid',
      status: 'Active'
    },
    {
      id: 'STU007',
      admNo: 'ADM2024007',
      name: 'Amit Patel',
      sem: '6th Sem',
      department: 'Computer Applications (BCA)',
      course: 'BCA',
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
    department: 'Commerce',
    course: 'B.Com',
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
    const matchesFee = !canViewFees || selectedFeeStatus === 'All Statuses' || student.feeStatus === selectedFeeStatus;

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
      department: 'Commerce',
      course: 'B.Com',
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

  const handleDownloadStudentCredentials = (student) => {
    const content = `
================================================================================
          VIVEKANANDA COLLEGE OF ARTS AND SCIENCE (AUTONOMOUS)
                      VELLALANKULAM, TAMIL NADU
             CONFIDENTIAL STUDENT CREDENTIAL & DATA SLIP
================================================================================
Generated On        : ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Issued By           : Super Administrator (VCAS Master Auth Controller)
Security Level      : RESTRICTED / STUDENT ACCESS
--------------------------------------------------------------------------------
STUDENT PARTICULARS:
  Student Name      : ${student.name}
  Student ID (Roll) : ${student.id}
  Admission No.     : ${student.admNo}
  Department        : ${student.department}
  Degree / Course   : ${student.course}
  Current Semester  : ${student.sem}
  Contact Phone     : ${student.phone}
  Attendance Rate   : ${student.attendance}%
  Fee Clearance     : ${student.feeStatus}
  Enrollment Status : ${student.status}

PORTAL ACCESS CREDENTIALS:
  Portal Login URL  : http://localhost:5173/login
  Role              : Student
  Login Username    : ${student.admNo}
  Alternate Login   : ${student.id}
  Initial Passcode  : ${(student.id || 'student').toLowerCase()}@2026
  Registered Mobile : ${student.phone}

ACADEMIC & ENROLLMENT METRICS:
  Institution Code  : VCAS-TN-048
  Academic Year     : 2025-2026
  Campus            : Vellalankulam Main Campus
--------------------------------------------------------------------------------
CONFIDENTIALITY NOTICE:
This credential document is issued under the authorization of the Super Administrator.
Unauthorized reproduction or distribution is strictly prohibited.
================================================================================
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${student.id}_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}_Credentials.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Super Admin Exclusive: Print Student Credentials Slip
  const handlePrintStudentCredentials = (student) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Please allow popups to print credential slips.');
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Credential Slip - ${student.name} (${student.id})</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #7c3aed; padding-bottom: 20px; margin-bottom: 25px; }
          .title { font-size: 20px; font-weight: bold; color: #5b21b6; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 14px; color: #475569; margin: 5px 0 0 0; }
          .badge { display: inline-block; background: #faf5ff; color: #6b21a8; font-size: 11px; padding: 4px 10px; border-radius: 9999px; font-weight: 600; margin-top: 10px; border: 1px solid #e9d5ff; }
          .meta-bar { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 16px; font-size: 12px; margin-bottom: 25px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #7c3aed; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          td { padding: 8px 12px; vertical-align: top; }
          td.label { width: 35%; font-weight: 600; color: #64748b; }
          td.value { width: 65%; color: #0f172a; font-weight: 500; }
          .cred-box { background: #faf5ff; border: 1px solid #d8b4fe; border-radius: 8px; padding: 14px 18px; margin-top: 10px; }
          .cred-title { font-size: 13px; font-weight: bold; color: #6b21a8; margin-bottom: 10px; }
          .cred-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .cred-item { font-size: 13px; }
          .cred-item span { color: #64748b; font-size: 11px; display: block; font-weight: 600; }
          .cred-item strong { color: #0f172a; font-family: monospace; font-size: 14px; }
          .footer { margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 20px; font-size: 11px; color: #64748b; text-align: center; }
          .stamp-row { display: flex; justify-content: space-between; margin-top: 50px; padding: 0 30px; font-size: 12px; font-weight: 600; }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Vivekananda College of Arts and Science</div>
          <div class="subtitle">Autonomous Institution • Affiliated with MS University • Vellalankulam</div>
          <div class="badge">Official Student Access Pass & Academic Credentials</div>
        </div>
        <div class="meta-bar">
          <div><strong>Generated On:</strong> ${new Date().toLocaleString('en-IN')}</div>
          <div><strong>Authorized By:</strong> Super Administrator</div>
          <div><strong>Ref:</strong> VCAS-STU-${student.id}</div>
        </div>
        <div class="section">
          <div class="section-title">Student Particulars</div>
          <table>
            <tr><td class="label">Student Name</td><td class="value"><strong>${student.name}</strong></td></tr>
            <tr><td class="label">Roll / Student ID</td><td class="value">${student.id}</td></tr>
            <tr><td class="label">Admission Number</td><td class="value">${student.admNo}</td></tr>
            <tr><td class="label">Department</td><td class="value">${student.department}</td></tr>
            <tr><td class="label">Degree & Program</td><td class="value">${student.course} (${student.sem || 'N/A'})</td></tr>
            <tr><td class="label">Registered Phone</td><td class="value">${student.phone}</td></tr>
            <tr><td class="label">Enrollment Status</td><td class="value">${student.status}</td></tr>
          </table>
        </div>
        <div class="section">
          <div class="section-title">Confidential Login Credentials</div>
          <div class="cred-box">
            <div class="cred-title">Digital Portal Authentication Details</div>
            <div class="cred-grid">
              <div class="cred-item">
                <span>PORTAL LOGIN ID (ADMISSION NO)</span>
                <strong>${student.admNo}</strong>
              </div>
              <div class="cred-item">
                <span>ALTERNATE ID (ROLL NO)</span>
                <strong>${student.id}</strong>
              </div>
              <div class="cred-item">
                <span>INITIAL PASSCODE</span>
                <strong>${(student.id || 'student').toLowerCase()}@2026</strong>
              </div>
              <div class="cred-item">
                <span>PORTAL ADDRESS</span>
                <strong>vcas.edu/login</strong>
              </div>
            </div>
          </div>
        </div>
        <div class="stamp-row">
          <div>Verified by Academic Section</div>
          <div>Authorized Signatory (Super Admin)</div>
        </div>
        <div class="footer">
          Notice: This document contains confidential system credentials. Issued under authorization of Super Admin.
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExportAllStudentsCSV = () => {
    const headers = ['Student ID', 'Admission No', 'Name', 'Department', 'Course', 'Semester', 'Phone', 'Attendance %', 'Fee Status', 'Status', 'Default Password'];
    const rows = filteredStudents.map(s => [
      `"${s.id}"`,
      `"${s.admNo}"`,
      `"${s.name}"`,
      `"${s.department}"`,
      `"${s.course}"`,
      `"${s.sem}"`,
      `"${s.phone}"`,
      `"${s.attendance}%"`,
      `"${s.feeStatus}"`,
      `"${s.status}"`,
      `"${s.id.toLowerCase()}@2026"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VCAS_Student_Credentials_Master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      department: newStudentData.department || 'Commerce',
      course: newStudentData.course || 'B.Com',
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
        user={user}
        canViewFees={canViewFees}
        onDownloadCredentials={handleDownloadStudentCredentials}
        onPrintCredentials={handlePrintStudentCredentials}
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Students</h1>
            {isSuperAdmin && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 shadow-2xs">
                <Key className="w-3.5 h-3.5" />
                <span>Super Admin Credentials Access</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {students.length} total students enrolled {isSuperAdmin ? '• Credentials download authorized' : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <button 
              onClick={handleExportAllStudentsCSV}
              className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs border border-purple-200 shadow-xs flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4 text-purple-600" />
              <span>Export Student CSV</span>
            </button>
          )}
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
              <option value="Commerce">Commerce</option>
              <option value="Computer Science">Computer Science</option>
              <option value="English Literature">English Literature</option>
              <option value="Business Administration (BBA)">Business Administration (BBA)</option>
              <option value="Computer Applications (BCA)">Computer Applications (BCA)</option>
              <option value="Mathematics">Mathematics</option>
            </select>

            {/* Courses Filter */}
            <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer h-10">
              <option value="All Courses">All Courses</option>
              <option value="B.Com">B.Com</option>
              <option value="B.Sc CS">B.Sc CS</option>
              <option value="B.A. English">B.A. English</option>
              <option value="BBA">BBA</option>
              <option value="BCA">BCA</option>
              <option value="B.Sc Maths">B.Sc Maths</option>
              <option value="M.Com">M.Com</option>
            </select>

            {/* Semesters Filter */}
            <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer h-10">
              <option value="All Semesters">All Semesters</option>
              <option value="1st Sem">1st Sem</option>
              <option value="2nd Sem">2nd Sem</option>
              <option value="3rd Sem">3rd Sem</option>
              <option value="4th Sem">4th Sem</option>
              <option value="5th Sem">5th Sem</option>
              <option value="6th Sem">6th Sem</option>
            </select>

            {/* Fee Statuses Filter (Accountant & Office Staff Only) */}
            {canViewFees && (
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
            )}
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
                {canViewFees && <th className="py-3.5 px-4 text-center">FEES</th>}
                <th className="py-3.5 px-4 text-center">STATUS</th>
                {isSuperAdmin && <th className="py-3.5 px-4 text-center">CREDENTIALS</th>}
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={canViewFees ? "10" : "9"} className="py-12 text-center text-slate-400 font-normal">
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

                      {/* Fee Status Badge (Accountant & Office Staff Only) */}
                      {canViewFees && (
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center justify-center min-w-[72px] px-2.5 py-1 rounded-full text-[11px] font-bold ${getFeeBadgeClass(student.feeStatus)}`}>
                            {student.feeStatus}
                          </span>
                        </td>
                      )}

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

                      {/* Credentials Slip (Super Admin only) */}
                      {isSuperAdmin && (
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCredentialModalStudent(student);
                            }}
                            title="Download & View Student Credentials"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all shadow-2xs"
                          >
                            <Key className="w-3.5 h-3.5 text-purple-600" />
                            <span>Download Slip</span>
                          </button>
                        </td>
                      )}

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isSuperAdmin && (
                            <>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadStudentCredentials(student);
                                }}
                                title="Download Student Credentials & Data"
                                className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintStudentCredentials(student);
                                }}
                                title="Print Student Credentials Slip"
                                className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </>
                          )}
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
                    <option value="Commerce">Commerce</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="English Literature">English Literature</option>
                    <option value="Business Administration (BBA)">Business Administration (BBA)</option>
                    <option value="Computer Applications (BCA)">Computer Applications (BCA)</option>
                    <option value="Mathematics">Mathematics</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Course</label>
                  <select 
                    value={editingStudent.course}
                    onChange={(e) => setEditingStudent({ ...editingStudent, course: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="B.Com">B.Com</option>
                    <option value="B.Sc CS">B.Sc CS</option>
                    <option value="B.A. English">B.A. English</option>
                    <option value="BBA">BBA</option>
                    <option value="BCA">BCA</option>
                    <option value="B.Sc Maths">B.Sc Maths</option>
                    <option value="M.Com">M.Com</option>
                    <option value="M.Sc CS">M.Sc CS</option>
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

      {/* SUPER ADMIN STUDENT CREDENTIAL MODAL */}
      {credentialModalStudent && (
        <ModalPortal isOpen={Boolean(credentialModalStudent)} onClose={() => setCredentialModalStudent(null)}>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn" onClick={() => setCredentialModalStudent(null)}>
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-scaleUp" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold">Student Credentials & Data Pass</h3>
                      <p className="text-xs text-purple-200">Super Administrator Exclusive Access</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCredentialModalStudent(null)}
                    className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">Student Name:</span>
                    <span className="font-bold text-slate-900 font-sans">{credentialModalStudent.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">Student ID:</span>
                    <span className="font-bold text-purple-700">{credentialModalStudent.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">Admission No:</span>
                    <span className="font-semibold text-slate-800">{credentialModalStudent.admNo}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">Department / Course:</span>
                    <span className="font-medium text-slate-700 font-sans">{credentialModalStudent.department} ({credentialModalStudent.course})</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">Login ID / Username:</span>
                    <span className="font-bold text-slate-900">{credentialModalStudent.admNo}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">Default Passcode:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">{(credentialModalStudent.id || 'student').toLowerCase()}@2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Registered Phone:</span>
                    <span className="text-slate-800 font-semibold">{credentialModalStudent.phone}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  🛡️ <strong>Security Clearance:</strong> As Super Administrator, you have privilege to download student authentication and academic data slips.
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`VCAS Student Credentials\nName: ${credentialModalStudent.name}\nID: ${credentialModalStudent.id}\nAdmission No: ${credentialModalStudent.admNo}\nLogin Username: ${credentialModalStudent.admNo}\nPassword: ${(credentialModalStudent.id || 'student').toLowerCase()}@2026\nPortal: http://localhost:5173/login`);
                      setCopiedStudentCred(true);
                      setTimeout(() => setCopiedStudentCred(false), 2000);
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Check className={`w-3.5 h-3.5 ${copiedStudentCred ? 'text-emerald-600' : 'hidden'}`} />
                    <span>{copiedStudentCred ? 'Copied!' : 'Copy Info'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handlePrintStudentCredentials(credentialModalStudent);
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4 text-purple-600" />
                    <span>Print Slip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadStudentCredentials(credentialModalStudent);
                      setCredentialModalStudent(null);
                    }}
                    className="px-5 py-2.5 text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Credential Slip</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
