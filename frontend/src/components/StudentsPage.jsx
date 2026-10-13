import React, { useState, useEffect } from 'react';
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
  Printer,
  Loader2,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import ModalPortal from './ModalPortal';
import CollegeLogo, { getCollegeLogoHtml } from './CollegeLogo';

const API_BASE = 'http://localhost:5000';

function normalizeStudent(s) {
  if (!s) return null;
  const regNo = s.regNo || s.registerNo || s.studentId || s.id || s._id || '';
  return {
    ...s,
    id: regNo,
    regNo: regNo,
    studentId: regNo,
    admNo: s.admNo || s.admissionNo || '',
    admissionNo: s.admNo || s.admissionNo || '',
    rollNo: s.rollNo || '—',
    year: s.year || '1st Year',
    loginId: s.loginId || regNo,
    name: s.name || s.fullName || '',
    fullName: s.name || s.fullName || '',
    sem: s.sem || s.semester || '1st Sem',
    semester: s.sem || s.semester || '1st Sem',
    department: s.department || '',
    course: s.course || '',
    phone: s.phone || s.mobile || '',
    mobile: s.phone || s.mobile || '',
    email: s.email || '',
    attendance: s.attendance !== undefined ? Number(s.attendance) : 85,
    feeStatus: s.feeStatus || 'Paid',
    status: s.status || 'Active',
    gender: s.gender || 'Male',
    dob: s.dob || '',
    bloodGroup: s.bloodGroup || 'O+',
    address: s.address || '',
    city: s.city || '',
    state: s.state || 'Tamil Nadu',
    pinCode: s.pinCode || '',
    batch: s.batch || '2024–2027',
    section: s.section || 'A',
    cgpa: s.cgpa || '8.0',
    rank: s.rank || '',
    fatherName: s.fatherName || '',
    nationality: s.nationality || 'Indian',
    caste: s.caste || s.casteCommunity || '',
    religion: s.religion || 'Hindu',
    nationalityReligion: s.nationalityReligion || `${s.nationality || 'INDIAN'} & ${s.religion || 'HINDU'}`,
    casteCommunity: s.casteCommunity || s.caste || '',
    dateOfAdmission: s.dateOfAdmission || s.admissionDate || '',
    courseAdmitted: s.courseAdmitted || s.course || s.department || '',
    aadhaar: s.aadhaar || '',
    pan: s.pan || '',
    bankAccountNo: s.bankAccountNo || '',
    bankName: s.bankName || '',
    ifscCode: s.ifscCode || '',
    bankBranch: s.bankBranch || '',
    drivingLicense: s.drivingLicense || '',
    emisNumber: s.emisNumber || '',
    tenthMarks: s.tenthMarks || s.tenthPercentage ? `${s.tenthMarks || ''} (${s.tenthPercentage || ''}%)` : (s.doc10th || ''),
    tenthPercentage: s.tenthPercentage || '',
    tenthBoard: s.tenthBoard || '',
    twelfthMarks: s.twelfthMarks || s.twelfthPercentage ? `${s.twelfthMarks || ''} (${s.twelfthPercentage || ''}%)` : (s.doc12th || ''),
    twelfthPercentage: s.twelfthPercentage || '',
    twelfthBoard: s.twelfthBoard || '',
    donation: s.donation || 'Nil',
    motherName: s.motherName || '',
    fatherMobile: s.fatherMobile || s.parentMobile || '',
    parentOccupation: s.parentOccupation || '',
    emergencyContact: s.emergencyContact || ''
  };
}

export default function StudentsPage({ user, canViewFees = (user?.role === 'Accountant' || user?.role === 'Office Staff' || user?.role === 'Super Admin' || user?.isSuperAdmin) }) {
  const isSuperAdmin = user?.role === 'Super Admin' || user?.isSuperAdmin;
  const [credentialModalStudent, setCredentialModalStudent] = useState(null);
  const [copiedStudentCred, setCopiedStudentCred] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedFeeStatus, setSelectedFeeStatus] = useState('All Statuses');
  const [selectedRows, setSelectedRows] = useState([]);
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportFields, setSelectedExportFields] = useState(['regNo', 'rollNo', 'name', 'aadhaar']);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteModalStudent, setDeleteModalStudent] = useState(null);

  const [students, setStudents] = useState(() => {
    try {
      const cached = localStorage.getItem('vcas_students_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [departmentsList, setDepartmentsList] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/departments`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setDepartmentsList(data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Toast notification helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Fetch student list from MongoDB Atlas and keep cache fresh
  const fetchStudents = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/students`);
      const result = await res.json();
      if (res.ok && result.success) {
        const normalized = (result.data || []).map(normalizeStudent);
        if (normalized.length > 0) {
          setStudents(normalized);
          try {
            localStorage.setItem('vcas_students_cache', JSON.stringify(normalized));
          } catch (e) {}
        }
      } else {
        console.error('Failed to fetch students:', result.message);
        setErrorMessage(result.message || 'Failed to fetch students from server');
      }
    } catch (err) {
      console.error('Error connecting to backend:', err);
      // Fallback to local cache if offline
      try {
        const cached = localStorage.getItem('vcas_students_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStudents(parsed);
          }
        }
      } catch (e) {}
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

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
    const term = (searchTerm || '').toLowerCase().trim();
    const matchesSearch = !term || (
      String(student.name || '').toLowerCase().includes(term) ||
      String(student.id || '').toLowerCase().includes(term) ||
      String(student.studentId || '').toLowerCase().includes(term) ||
      String(student.rollNo || '').toLowerCase().includes(term) ||
      String(student.regNo || student.registerNumber || '').toLowerCase().includes(term) ||
      String(student.admNo || '').toLowerCase().includes(term) ||
      String(student.email || '').toLowerCase().includes(term) ||
      String(student.phone || '').toLowerCase().includes(term) ||
      String(student.course || '').toLowerCase().includes(term) ||
      String(student.department || '').toLowerCase().includes(term)
    );

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

  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const created = normalizeStudent(result.data);
        setStudents(prev => [created, ...prev]);
        showToast(`Student "${created.name}" added successfully!`);
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
      } else {
        alert(result.message || 'Failed to add student');
      }
    } catch (err) {
      console.error('Error adding student:', err);
      alert('Unable to connect to backend server.');
    } finally {
      setIsSaving(false);
    }
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
    const regNo = student.regNo || student.studentId || student.id;
    const loginId = student.loginId || regNo;
    const dobPw = student.dob || `${regNo.toLowerCase()}@2026`;

    const content = `
================================================================================
          VIVEKANANDHA COLLEGE OF ARTS AND SCIENCES
          (AFFILIATED TO MANONMANIAM SUNDARANAR UNIVERSITY)
                      VELLALANKULAM, TAMIL NADU
                  OFFICIAL STUDENT SLIP & CREDENTIAL PASS
================================================================================
Generated On        : ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Issued By           : Super Administrator (VCAS Master Auth Controller)
Security Level      : RESTRICTED / STUDENT ACCESS
--------------------------------------------------------------------------------
PORTAL ACCESS CREDENTIALS:
  Portal Login URL  : http://localhost:5173/login
  Role              : Student
  Register Number   : ${regNo}
  Login ID          : ${loginId}
  Password (DOB)    : ${dobPw}
  Registered Mobile : ${student.phone}

ACADEMIC PARTICULARS:
  Student Name      : ${student.name}
  Reg No            : ${regNo}
  Roll Number       : ${student.rollNo || '—'}
  Year of Study     : ${student.year || '1st Year'}
  Course / Degree   : ${student.course}
  Department        : ${student.department}
  Current Semester  : ${student.sem}
  Enrollment Status : ${student.status}
  Attendance Rate   : ${student.attendance}%
  Fee Clearance     : ${student.feeStatus}

STUDENT INFORMATION & STATUTORY PARTICULARS:
  Date of Birth     : ${student.dob || '—'}
  Aadhaar Number    : ${student.aadhaar || '—'}
  PAN Number        : ${student.pan || '—'}
  EMIS Number       : ${student.emisNumber || '—'}
  Driving License   : ${student.drivingLicense || '—'}
  Nationality       : ${student.nationality || 'Indian'}
  Caste & Community : ${student.caste || student.casteCommunity || '—'}
  Religion          : ${student.religion || 'Hindu'}
  Course Admitted   : ${student.courseAdmitted || student.course || '—'}
  Donation          : ${student.donation || 'Nil'}

ACADEMIC RECORDS:
  10th Std Record   : ${student.tenthMarks || '—'}
  12th Std Record   : ${student.twelfthMarks || '—'}

BANK ACCOUNT DETAILS:
  Bank Name         : ${student.bankName || '—'}
  Account Number    : ${student.bankAccountNo || '—'}
  IFSC Code         : ${student.ifscCode || '—'}
  Branch            : ${student.bankBranch || '—'}
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
    link.download = `Student_Slip_${regNo}_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Super Admin Exclusive: Print Student Credentials Slip
  const handlePrintStudentCredentials = (student) => {
    const regNo = student.regNo || student.studentId || student.id;
    const loginId = student.loginId || regNo;
    const dobPw = student.dob || `${regNo.toLowerCase()}@2026`;

    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) {
      alert('Please allow popups to print credential slips.');
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Slip - ${student.name} (${regNo})</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; color: #0f172a; font-size: 12px; }
          .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 15px; }
          .header-brand { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 6px; }
          .title { font-size: 18px; font-weight: 900; color: #0f1e3c; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 11px; color: #475569; font-weight: 600; margin: 2px 0 0 0; }
          .badge { display: inline-block; background: #eff6ff; color: #1e40af; font-size: 11px; padding: 3px 12px; border-radius: 9999px; font-weight: 800; margin-top: 6px; border: 1px solid #bfdbfe; }
          .meta-bar { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; font-size: 11px; margin-bottom: 15px; font-weight: 600; }
          .cred-box { background: #faf5ff; border: 1px dashed #9333ea; border-radius: 8px; padding: 12px 16px; margin-bottom: 15px; }
          .cred-title { font-size: 11px; font-weight: 800; color: #7e22ce; margin-bottom: 8px; text-transform: uppercase; }
          .cred-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
          .cred-item span { color: #6b21a8; font-size: 9.5px; display: block; font-weight: 700; }
          .cred-item strong { color: #0f172a; font-family: monospace; font-size: 13px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px; }
          .section { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; background: #fff; }
          .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
          td { padding: 4px 6px; vertical-align: top; }
          td.label { width: 40%; font-weight: 600; color: #64748b; }
          td.value { width: 60%; color: #0f172a; font-weight: 700; }
          .footer { margin-top: 25px; border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 10px; color: #64748b; text-align: center; }
          .stamp-row { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 30px; font-size: 11px; font-weight: 700; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-brand">
            ${getCollegeLogoHtml(44)}
            <div>
              <div class="title">Vivekanandha College of Arts and Sciences</div>
              <div class="subtitle">Affiliated with Manonmaniam Sundaranar University • Vellalankulam</div>
            </div>
          </div>
          <div class="badge">Official Student Slip & Academic Credentials Pass</div>
        </div>

        <div class="meta-bar">
          <div><strong>Generated:</strong> ${new Date().toLocaleString('en-IN')}</div>
          <div><strong>Authorized By:</strong> Super Administrator</div>
          <div><strong>Ref:</strong> VCAS-SLIP-${regNo}</div>
        </div>

        <!-- Credentials Passcode Bar -->
        <div class="cred-box">
          <div class="cred-title">Digital Portal Authentication Particulars</div>
          <div class="cred-grid">
            <div class="cred-item">
              <span>REGISTER NUMBER (REG NO)</span>
              <strong>${regNo}</strong>
            </div>
            <div class="cred-item">
              <span>ROLL NUMBER</span>
              <strong>${student.rollNo || '—'}</strong>
            </div>
            <div class="cred-item">
              <span>LOGIN ID</span>
              <strong>${loginId}</strong>
            </div>
            <div class="cred-item">
              <span>PASSWORD (DOB)</span>
              <strong>${dobPw}</strong>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <!-- Academic Particulars -->
          <div class="section">
            <div class="section-title">1. Academic & Enrollment Details</div>
            <table>
              <tr><td class="label">Student Name</td><td class="value">${student.name}</td></tr>
              <tr><td class="label">Reg No</td><td class="value">${regNo}</td></tr>
              <tr><td class="label">Roll Number</td><td class="value">${student.rollNo || '—'}</td></tr>
              <tr><td class="label">Year of Study</td><td class="value">${student.year || '1st Year'}</td></tr>
              <tr><td class="label">Department</td><td class="value">${student.department}</td></tr>
              <tr><td class="label">Course / Degree</td><td class="value">${student.course} (${student.sem || 'N/A'})</td></tr>
              <tr><td class="label">Attendance Rate</td><td class="value">${student.attendance}%</td></tr>
              <tr><td class="label">Fee Clearance</td><td class="value">${student.feeStatus}</td></tr>
            </table>
          </div>

          <!-- Student Personal Information -->
          <div class="section">
            <div class="section-title">2. Student Personal Information</div>
            <table>
              <tr><td class="label">Date of Birth (DOB)</td><td class="value">${student.dob || '—'}</td></tr>
              <tr><td class="label">Aadhaar Number</td><td class="value">${student.aadhaar || '—'}</td></tr>
              <tr><td class="label">PAN Number</td><td class="value">${student.pan || '—'}</td></tr>
              <tr><td class="label">EMIS Number</td><td class="value">${student.emisNumber || '—'}</td></tr>
              <tr><td class="label">Driving License</td><td class="value">${student.drivingLicense || '—'}</td></tr>
              <tr><td class="label">Nationality</td><td class="value">${student.nationality || 'Indian'}</td></tr>
              <tr><td class="label">Religion / Caste</td><td class="value">${student.religion || 'Hindu'} / ${student.caste || student.casteCommunity || '—'}</td></tr>
              <tr><td class="label">Donation Status</td><td class="value">${student.donation || 'Nil'}</td></tr>
            </table>
          </div>
        </div>

        <div class="grid-2">
          <!-- Prior Qualifications -->
          <div class="section">
            <div class="section-title">3. Prior Qualifications & Contact</div>
            <table>
              <tr><td class="label">10th Std Marks</td><td class="value">${student.tenthMarks || '—'}</td></tr>
              <tr><td class="label">12th Std Marks</td><td class="value">${student.twelfthMarks || '—'}</td></tr>
              <tr><td class="label">Registered Mobile</td><td class="value">${student.phone}</td></tr>
              <tr><td class="label">Registered Email</td><td class="value">${student.email || '—'}</td></tr>
            </table>
          </div>

          <!-- Bank Account Details -->
          <div class="section">
            <div class="section-title">4. Student Bank Account Details</div>
            <table>
              <tr><td class="label">Bank Name</td><td class="value">${student.bankName || '—'}</td></tr>
              <tr><td class="label">Account Number</td><td class="value">${student.bankAccountNo || '—'}</td></tr>
              <tr><td class="label">IFSC Code</td><td class="value">${student.ifscCode || '—'}</td></tr>
              <tr><td class="label">Branch Name</td><td class="value">${student.bankBranch || '—'}</td></tr>
            </table>
          </div>
        </div>

        <div class="stamp-row">
          <div>Verified by Academic Section</div>
          <div>Authorized Signatory (Super Admin)</div>
        </div>

        <div class="footer">
          Official Student Slip issued under authorization of Super Admin. Valid for official verification and portal access.
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

  const EXPORT_COLUMNS_CONFIG = [
    { id: 'aadhaar', label: 'Aadhaar Number', group: 'Statutory / Identity', getVal: s => s.aadhaar || '' },
    { id: 'pan', label: 'PAN Card Number', group: 'Statutory / Identity', getVal: s => s.pan || '' },
    { id: 'emisNumber', label: 'EMIS Number', group: 'Statutory / Identity', getVal: s => s.emisNumber || '' },
    { id: 'drivingLicense', label: 'Driving License', group: 'Statutory / Identity', getVal: s => s.drivingLicense || '' },
    
    { id: 'regNo', label: 'Register Number (Reg No)', group: 'Basic Profile', getVal: s => s.regNo || s.id || '' },
    { id: 'rollNo', label: 'Roll Number', group: 'Basic Profile', getVal: s => s.rollNo || '' },
    { id: 'name', label: 'Student Full Name', group: 'Basic Profile', getVal: s => s.name || s.fullName || '' },
    { id: 'gender', label: 'Gender', group: 'Basic Profile', getVal: s => s.gender || 'Male' },
    { id: 'dob', label: 'Date of Birth (DOB / Password)', group: 'Basic Profile', getVal: s => s.dob || '' },
    { id: 'loginId', label: 'Portal Login ID', group: 'Basic Profile', getVal: s => s.loginId || s.regNo || s.id || '' },

    { id: 'course', label: 'Course Admitted', group: 'Academic Details', getVal: s => s.course || s.courseAdmitted || s.department || '' },
    { id: 'department', label: 'Department', group: 'Academic Details', getVal: s => s.department || '' },
    { id: 'year', label: 'Academic Year', group: 'Academic Details', getVal: s => s.year || '1st Year' },
    { id: 'sem', label: 'Semester', group: 'Academic Details', getVal: s => s.sem || s.semester || '1st Sem' },
    { id: 'dateOfAdmission', label: 'Date of Admission', group: 'Academic Details', getVal: s => s.dateOfAdmission || '' },
    { id: 'status', label: 'Academic Status', group: 'Academic Details', getVal: s => s.status || 'Active' },
    { id: 'attendance', label: 'Attendance %', group: 'Academic Details', getVal: s => `${s.attendance !== undefined ? s.attendance : 85}%` },

    { id: 'bankName', label: 'Bank Name', group: 'Bank & Financials', getVal: s => s.bankName || '' },
    { id: 'bankAccountNo', label: 'Bank Account Number', group: 'Bank & Financials', getVal: s => s.bankAccountNo || '' },
    { id: 'ifscCode', label: 'IFSC Code', group: 'Bank & Financials', getVal: s => s.ifscCode || '' },
    { id: 'bankBranch', label: 'Bank Branch', group: 'Bank & Financials', getVal: s => s.bankBranch || '' },
    { id: 'feeStatus', label: 'Fee Clearance Status', group: 'Bank & Financials', getVal: s => s.feeStatus || 'Pending' },
    { id: 'donation', label: 'Donation / Quota', group: 'Bank & Financials', getVal: s => s.donation || 'Nil' },

    { id: 'fatherName', label: "Father's Name", group: 'Family & Contact', getVal: s => s.fatherName || '' },
    { id: 'motherName', label: "Mother's Name", group: 'Family & Contact', getVal: s => s.motherName || '' },
    { id: 'phone', label: 'Student Mobile / Phone', group: 'Family & Contact', getVal: s => s.phone || s.mobile || '' },
    { id: 'email', label: 'Email Address', group: 'Family & Contact', getVal: s => s.email || '' },
    { id: 'nationality', label: 'Nationality', group: 'Family & Contact', getVal: s => s.nationality || 'Indian' },
    { id: 'religion', label: 'Religion', group: 'Family & Contact', getVal: s => s.religion || 'Hindu' },
    { id: 'caste', label: 'Caste / Community', group: 'Family & Contact', getVal: s => s.caste || s.casteCommunity || '' },
    { id: 'address', label: 'Address', group: 'Family & Contact', getVal: s => s.address || '' },
    { id: 'tenthMarks', label: '10th Marks / Board', group: 'Academic Details', getVal: s => s.tenthMarks || '' },
    { id: 'twelfthMarks', label: '12th Marks / Board', group: 'Academic Details', getVal: s => s.twelfthMarks || '' },
  ];

  const handleExportFields = (fieldIds, customFileName) => {
    if (!fieldIds || fieldIds.length === 0) {
      showToast('Please select at least one field to export.');
      return;
    }
    const selectedCols = EXPORT_COLUMNS_CONFIG.filter(c => fieldIds.includes(c.id));
    const headers = selectedCols.map(c => `"${c.label}"`);
    const rows = filteredStudents.map(s => {
      return selectedCols.map(c => `"${String(c.getVal(s) || '').replace(/"/g, '""')}"`);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${customFileName || 'VCAS_Student_Export'}_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`✓ Downloaded ${rows.length} student records (${selectedCols.length} fields)`);
  };

  const handleQuickExport = (presetKey) => {
    if (presetKey === 'aadhaar_only') {
      handleExportFields(['regNo', 'rollNo', 'name', 'aadhaar'], 'VCAS_Students_Aadhaar_Only');
    } else if (presetKey === 'pan_only') {
      handleExportFields(['regNo', 'rollNo', 'name', 'pan'], 'VCAS_Students_PAN_Only');
    } else if (presetKey === 'bank_only') {
      handleExportFields(['regNo', 'rollNo', 'name', 'bankName', 'bankAccountNo', 'ifscCode', 'bankBranch'], 'VCAS_Students_Bank_Accounts_Only');
    } else if (presetKey === 'fees_only') {
      handleExportFields(['regNo', 'rollNo', 'name', 'course', 'year', 'feeStatus', 'donation'], 'VCAS_Students_Fee_Status_Only');
    } else if (presetKey === 'credentials_only') {
      handleExportFields(['regNo', 'rollNo', 'name', 'loginId', 'dob'], 'VCAS_Students_Portal_Credentials_Only');
    } else if (presetKey === 'all') {
      handleExportFields(EXPORT_COLUMNS_CONFIG.map(c => c.id), 'VCAS_Student_Master_Registry');
    }
  };

  const handleExportAllStudentsCSV = () => {
    handleQuickExport('all');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsSaving(true);
    try {
      const targetId = editingStudent._originalId || editingStudent._id || editingStudent.studentId || editingStudent.id;
      const payload = {
        ...editingStudent,
        regNo: (editingStudent.regNo || editingStudent.registerNo || editingStudent.studentId || editingStudent.id || '').trim().toUpperCase(),
        rollNo: (editingStudent.rollNo || '').trim().toUpperCase(),
        year: editingStudent.year || '1st Year',
        loginId: (editingStudent.loginId || editingStudent.regNo || editingStudent.studentId || '').trim().toUpperCase(),
        password: editingStudent.dob,
        studentId: editingStudent.regNo || editingStudent.studentId || editingStudent.id,
        id: editingStudent.regNo || editingStudent.studentId || editingStudent.id,
        name: (editingStudent.name || editingStudent.fullName || '').trim().toUpperCase(),
        gender: editingStudent.gender || 'Male',
        dob: editingStudent.dob || '',
        fatherName: (editingStudent.fatherName || '').trim().toUpperCase(),
        nationality: (editingStudent.nationality || 'INDIAN').trim().toUpperCase(),
        religion: (editingStudent.religion || 'HINDU').trim().toUpperCase(),
        caste: (editingStudent.caste || editingStudent.casteCommunity || '').trim().toUpperCase(),
        casteCommunity: (editingStudent.casteCommunity || editingStudent.caste || '').trim().toUpperCase(),
        nationalityReligion: (editingStudent.nationalityReligion || `${editingStudent.nationality || 'INDIAN'} & ${editingStudent.religion || 'HINDU'}`).trim().toUpperCase(),
        aadhaar: (editingStudent.aadhaar || '').trim(),
        pan: (editingStudent.pan || '').trim().toUpperCase(),
        bankAccountNo: (editingStudent.bankAccountNo || '').trim(),
        bankName: (editingStudent.bankName || '').trim(),
        ifscCode: (editingStudent.ifscCode || '').trim().toUpperCase(),
        bankBranch: (editingStudent.bankBranch || '').trim(),
        drivingLicense: (editingStudent.drivingLicense || '').trim().toUpperCase(),
        emisNumber: (editingStudent.emisNumber || '').trim(),
        tenthMarks: (editingStudent.tenthMarks || '').trim(),
        twelfthMarks: (editingStudent.twelfthMarks || '').trim(),
        donation: (editingStudent.donation || '').trim(),
        courseAdmitted: (editingStudent.courseAdmitted || editingStudent.course || editingStudent.department || '').trim().toUpperCase(),
        course: (editingStudent.course || editingStudent.courseAdmitted || editingStudent.department || '').trim().toUpperCase(),
        department: (editingStudent.department || editingStudent.courseAdmitted || editingStudent.course || '').trim().toUpperCase(),
        status: editingStudent.status || 'Active',
        attendance: Number(editingStudent.attendance || 100)
      };

      const res = await fetch(`${API_BASE}/api/students/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const updated = normalizeStudent(result.data);
        const originalRef = editingStudent._originalId;
        const originalId = editingStudent._originalStudentId || editingStudent.id;

        setStudents(prev => {
          const next = prev.map(s => {
            if (
              (originalRef && (s._id === originalRef || s.studentId === originalRef || s.id === originalRef)) ||
              (s._id && updated._id && s._id === updated._id) ||
              (s.studentId && updated.studentId && s.studentId === updated.studentId) ||
              (s.id === originalId || s.id === updated.id)
            ) {
              return updated;
            }
            return s;
          });
          try {
            localStorage.setItem('vcas_students_cache', JSON.stringify(next));
          } catch (e) {}
          return next;
        });

        try {
          window.dispatchEvent(new Event('vcas_students_updated'));
        } catch (_) {}

        if (selectedStudentProfile) {
          setSelectedStudentProfile(updated);
        }
        setEditingStudent(null);
        showToast(`Student "${updated.name}" updated successfully!`);
      } else {
        alert(result.message || 'Failed to update student');
      }
    } catch (err) {
      console.error('Error updating student:', err);
      alert('Unable to connect to backend server. Make sure backend is running on port 5000.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalStudent) return;
    setIsSaving(true);
    try {
      const targetId = deleteModalStudent._id || deleteModalStudent.studentId || deleteModalStudent.id;
      const res = await fetch(`${API_BASE}/api/students/${targetId}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setStudents(prev => {
          const next = prev.filter(s => s.id !== deleteModalStudent.id && s._id !== deleteModalStudent._id);
          try {
            localStorage.setItem('vcas_students_cache', JSON.stringify(next));
          } catch (e) {}
          return next;
        });
        try {
          window.dispatchEvent(new Event('vcas_students_updated'));
        } catch (_) {}
        showToast(`Student "${deleteModalStudent.name}" deleted successfully.`);
        setDeleteModalStudent(null);
      } else {
        alert(result.message || 'Failed to delete student');
      }
    } catch (err) {
      console.error('Error deleting student:', err);
      alert('Unable to connect to backend server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteWizard = async (newStudentData) => {
    setIsSaving(true);
    try {
      const payload = {
        name: (newStudentData.name || newStudentData.fullName || 'New Student').trim().toUpperCase(),
        regNo: (newStudentData.regNo || '').trim().toUpperCase(),
        rollNo: (newStudentData.rollNo || '').trim().toUpperCase(),
        year: newStudentData.year || '1st Year',
        loginId: (newStudentData.loginId || newStudentData.regNo || '').trim().toUpperCase(),
        password: newStudentData.dob || '',
        gender: newStudentData.gender || 'Male',
        dob: newStudentData.dob || '',
        fatherName: (newStudentData.fatherName || '').trim().toUpperCase(),
        nationalityReligion: (newStudentData.nationalityReligion || `${newStudentData.nationality || 'INDIAN'} & ${newStudentData.religion || 'HINDU'}`).trim().toUpperCase(),
        nationality: (newStudentData.nationality || 'INDIAN').trim().toUpperCase(),
        religion: (newStudentData.religion || 'HINDU').trim().toUpperCase(),
        caste: (newStudentData.caste || newStudentData.casteCommunity || '').trim().toUpperCase(),
        casteCommunity: (newStudentData.casteCommunity || newStudentData.caste || '').trim().toUpperCase(),
        aadhaar: (newStudentData.aadhaar || '').trim(),
        pan: (newStudentData.pan || '').trim().toUpperCase(),
        bankAccountNo: (newStudentData.bankAccountNo || '').trim(),
        bankName: (newStudentData.bankName || '').trim(),
        ifscCode: (newStudentData.ifscCode || '').trim().toUpperCase(),
        bankBranch: (newStudentData.bankBranch || '').trim(),
        drivingLicense: (newStudentData.drivingLicense || '').trim().toUpperCase(),
        emisNumber: (newStudentData.emisNumber || '').trim(),
        tenthMarks: (newStudentData.tenthMarks || '').trim(),
        twelfthMarks: (newStudentData.twelfthMarks || '').trim(),
        donation: (newStudentData.donation || '0').trim(),
        dateOfAdmission: newStudentData.dateOfAdmission || new Date().toISOString().split('T')[0],
        courseAdmitted: (newStudentData.courseAdmitted || newStudentData.course || newStudentData.department || '').trim().toUpperCase(),
        department: (newStudentData.courseAdmitted || newStudentData.department || '').trim(),
        course: (newStudentData.courseAdmitted || newStudentData.course || '').trim(),
        status: 'Active',
        attendance: 100,
        feeStatus: newStudentData.feeStatus || 'Pending'
      };

      const res = await fetch(`${API_BASE}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const created = normalizeStudent(result.data);
        setStudents(prev => {
          const next = [created, ...prev];
          try {
            localStorage.setItem('vcas_students_cache', JSON.stringify(next));
          } catch (e) {}
          return next;
        });
        try {
          window.dispatchEvent(new Event('vcas_students_updated'));
        } catch (_) {}
        setShowAddWizard(false);
        showToast(`Student "${created.name}" registered successfully!`);
      } else {
        alert(result.message || 'Failed to register student');
      }
    } catch (err) {
      console.error('Error creating student:', err);
      alert('Unable to connect to backend server.');
    } finally {
      setIsSaving(false);
    }
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
        onEdit={(stu) => {
          setSelectedStudentProfile(null);
          setEditingStudent({ 
            ...stu,
            _originalId: stu._id || stu.studentId || stu.id,
            _originalStudentId: stu.studentId || stu.id,
            id: stu.studentId || stu.id,
            studentId: stu.studentId || stu.id,
            admNo: stu.admNo || stu.admissionNo || '',
            sem: stu.sem || stu.semester || '1st Sem'
          });
        }}
      />
    );
  }

  if (showAddWizard) {
    return (
      <AddStudentWizard 
        onBack={() => setShowAddWizard(false)}
        onComplete={handleCompleteWizard}
        isSaving={isSaving}
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
          <button 
            onClick={fetchStudents}
            disabled={isLoading}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 border border-slate-200"
            title="Refresh student records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleQuickExport('aadhaar_only')}
                className="hidden lg:inline-flex px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs border border-emerald-200 shadow-xs items-center gap-1.5 transition-all cursor-pointer"
                title="Download Aadhaar numbers with student identification"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>⚡ Aadhaar Only</span>
              </button>
              <button 
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all cursor-pointer"
                title="Download specific individual fields or configure custom export"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Download / Export Fields</span>
              </button>
            </div>
          )}
          <button 
            onClick={() => setShowAddWizard(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-700 font-medium">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            onClick={fetchStudents} 
            className="px-3 py-1 bg-white border border-rose-200 rounded-lg font-bold text-rose-700 hover:bg-rose-100 cursor-pointer transition-all"
          >
            Retry Connection
          </button>
        </div>
      )}

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
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-all h-10"
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
              {departmentsList.length > 0 ? (
                departmentsList.map(d => (
                  <option key={d._id || d.code} value={d.name}>{d.name}</option>
                ))
              ) : (
                <option value="Computer Science">Computer Science</option>
              )}
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
                <th className="py-3.5 px-3 text-left">STUDENT / REG NO</th>
                <th className="py-3.5 px-2 text-center w-24">YEAR</th>
                <th className="py-3.5 px-2 text-center w-20">2. GENDER</th>
                <th className="py-3.5 px-2 text-center w-28">3. DOB (PWD)</th>
                <th className="py-3.5 px-3 text-left">4. FATHER'S NAME</th>
                <th className="py-3.5 px-3 text-center">ROLL NO</th>
                <th className="py-3.5 px-2 text-center w-28">7. ADM DATE</th>
                <th className="py-3.5 px-3 text-left">8. COURSE ADMITTED</th>
                <th className="py-3.5 px-3 text-center">STATUS</th>
                {isSuperAdmin && <th className="py-3.5 px-4 text-center">STUDENT SLIP</th>}
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={isSuperAdmin ? "12" : "11"} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="text-xs font-semibold text-slate-600">Loading student records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? "12" : "11"} className="py-12 text-center text-slate-400 font-normal">
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

                      {/* 1. Name & Reg No */}
                      <td className="py-3.5 px-3 cursor-pointer" onClick={() => setSelectedStudentProfile(student)}>
                        <div className="flex items-center gap-2.5 group">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            {(student.name || 'S').charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors uppercase">
                              {student.name || student.fullName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-blue-700 font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                Reg No: {student.regNo || student.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Year */}
                      <td className="py-3.5 px-2 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                          {student.year || '1st Year'}
                        </span>
                      </td>

                      {/* 2. Gender */}
                      <td className="py-3.5 px-2 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {student.gender || 'MALE'}
                        </span>
                      </td>

                      {/* 3. Date of Birth (Password) */}
                      <td className="py-3.5 px-2 text-center font-medium text-slate-700">
                        {student.dob || '—'}
                      </td>

                      {/* 4. Father's Name */}
                      <td className="py-3.5 px-3 font-bold text-slate-800 uppercase">
                        {student.fatherName || '—'}
                      </td>

                      {/* Roll Number */}
                      <td className="py-3.5 px-3 text-center text-slate-700 font-mono font-bold">
                        {student.rollNo || '—'}
                      </td>

                      {/* 7. Date of Admission */}
                      <td className="py-3.5 px-2 text-center font-medium text-slate-700">
                        {student.dateOfAdmission || '—'}
                      </td>

                      {/* 8. Course in Which Admitted */}
                      <td className="py-3.5 px-3 font-extrabold text-blue-700">
                        {student.courseAdmitted || student.course || student.department || '—'}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          student.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {student.status || 'Active'}
                        </span>
                      </td>

                      {/* Student Slip (Super Admin only) */}
                      {isSuperAdmin && (
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCredentialModalStudent(student);
                            }}
                            title="Download & View Official Student Slip"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all shadow-2xs"
                          >
                            <Key className="w-3.5 h-3.5 text-purple-600" />
                            <span>Student Slip</span>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingStudent({ 
                                ...student,
                                _originalId: student._id || student.studentId || student.id,
                                _originalStudentId: student.studentId || student.id,
                                id: student.studentId || student.id,
                                studentId: student.studentId || student.id,
                                admNo: student.admNo || student.admissionNo || '',
                                sem: student.sem || student.semester || '1st Sem'
                              });
                            }}
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
                <p className="text-xs text-slate-400 font-mono">Editing Record: {String(editingStudent.id || editingStudent.studentId || '')}</p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
              
              {/* Reg No, Roll No & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                <div>
                  <label className="block font-black text-blue-900 mb-1">Register Number (Reg No) *</label>
                  <input 
                    type="text" 
                    required
                    value={editingStudent.regNo || editingStudent.registerNo || editingStudent.studentId || editingStudent.id || ''}
                    onChange={(e) => setEditingStudent({ 
                      ...editingStudent, 
                      regNo: e.target.value.toUpperCase(),
                      loginId: e.target.value.toUpperCase(),
                      studentId: e.target.value.toUpperCase(),
                      id: e.target.value.toUpperCase()
                    })}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-blue-950 font-black uppercase font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Roll Number</label>
                  <input 
                    type="text" 
                    value={editingStudent.rollNo || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, rollNo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold uppercase focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Year *</label>
                  <select 
                    value={editingStudent.year || '1st Year'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, year: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              {/* Student Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Name *</label>
                <input 
                  type="text" 
                  required
                  value={editingStudent.name || editingStudent.fullName || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold uppercase focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Gender & DOB (Password) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender *</label>
                  <select 
                    value={editingStudent.gender || 'Male'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="Male">MALE</option>
                    <option value="Female">FEMALE</option>
                    <option value="Transgender">TRANSGENDER</option>
                  </select>
                </div>
                <div>
                  <label className="block font-black text-emerald-800 mb-1">Date of Birth (Password) *</label>
                  <input 
                    type="date" 
                    value={editingStudent.dob || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-emerald-950 font-bold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Father's Name & Course */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Father's Name</label>
                  <input 
                    type="text" 
                    value={editingStudent.fatherName || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, fatherName: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold uppercase focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Course Admitted *</label>
                  <input 
                    type="text" 
                    value={editingStudent.courseAdmitted || editingStudent.course || ''}
                    onChange={(e) => setEditingStudent({ 
                      ...editingStudent, 
                      courseAdmitted: e.target.value.toUpperCase(),
                      course: e.target.value.toUpperCase(),
                      department: e.target.value.toUpperCase()
                    })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold uppercase focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Nationality, Religion, Caste */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nationality</label>
                  <input 
                    type="text" 
                    value={editingStudent.nationality || 'INDIAN'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, nationality: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold uppercase focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Religion</label>
                  <input 
                    type="text" 
                    value={editingStudent.religion || 'HINDU'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, religion: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold uppercase focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Caste / Community</label>
                  <input 
                    type="text" 
                    value={editingStudent.caste || editingStudent.casteCommunity || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, caste: e.target.value.toUpperCase(), casteCommunity: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold uppercase focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Statutory Identifiers: Aadhaar, PAN, EMIS, DL */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Aadhaar</label>
                  <input 
                    type="text" 
                    value={editingStudent.aadhaar || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, aadhaar: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PAN Card</label>
                  <input 
                    type="text" 
                    value={editingStudent.pan || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, pan: e.target.value.toUpperCase() })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">EMIS Number</label>
                  <input 
                    type="text" 
                    value={editingStudent.emisNumber || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, emisNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Driving License</label>
                  <input 
                    type="text" 
                    value={editingStudent.drivingLicense || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, drivingLicense: e.target.value.toUpperCase() })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-50/40 p-3 rounded-2xl border border-emerald-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                  <input 
                    type="text" 
                    value={editingStudent.bankName || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, bankName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account No</label>
                  <input 
                    type="text" 
                    value={editingStudent.bankAccountNo || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, bankAccountNo: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IFSC Code</label>
                  <input 
                    type="text" 
                    value={editingStudent.ifscCode || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, ifscCode: e.target.value.toUpperCase() })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch</label>
                  <input 
                    type="text" 
                    value={editingStudent.bankBranch || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, bankBranch: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* 10th, 12th Marks & Donation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">10th Marks / Board</label>
                  <input 
                    type="text" 
                    value={editingStudent.tenthMarks || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, tenthMarks: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">12th Marks / Board</label>
                  <input 
                    type="text" 
                    value={editingStudent.twelfthMarks || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, twelfthMarks: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Donation (₹)</label>
                  <input 
                    type="text" 
                    value={editingStudent.donation || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, donation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Date of Admission & Account Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Admission</label>
                  <input 
                    type="date" 
                    value={editingStudent.dateOfAdmission || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, dateOfAdmission: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                  <select 
                    value={editingStudent.status || 'Active'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
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
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
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
              <p>This action will permanently remove the student record.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setDeleteModalStudent(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
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
                    <span className="text-slate-500 font-sans">Register Number (Reg No):</span>
                    <span className="font-bold text-purple-700">{credentialModalStudent.regNo || credentialModalStudent.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">Roll Number:</span>
                    <span className="font-semibold text-slate-800">{credentialModalStudent.rollNo || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">Year:</span>
                    <span className="font-bold text-amber-700 font-sans">{credentialModalStudent.year || '1st Year'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">Course & Department:</span>
                    <span className="font-medium text-slate-700 font-sans">{credentialModalStudent.course || credentialModalStudent.department}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">Login ID:</span>
                    <span className="font-bold text-slate-900">{credentialModalStudent.loginId || credentialModalStudent.regNo || credentialModalStudent.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">Password (Date of Birth):</span>
                    <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                      {credentialModalStudent.dob || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">Aadhaar / PAN:</span>
                    <span className="text-slate-800 font-semibold">{credentialModalStudent.aadhaar || '—'} • {credentialModalStudent.pan || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">EMIS / Driving License:</span>
                    <span className="text-slate-800 font-semibold">{credentialModalStudent.emisNumber || '—'} • {credentialModalStudent.drivingLicense || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">Bank Account Details:</span>
                    <span className="text-slate-800 font-semibold">{credentialModalStudent.bankName || '—'} ({credentialModalStudent.bankAccountNo || '—'})</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">10th & 12th Records:</span>
                    <span className="text-slate-800 font-semibold">{credentialModalStudent.tenthMarks || '—'} • {credentialModalStudent.twelfthMarks || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Nationality / Caste / Donation:</span>
                    <span className="text-slate-800 font-semibold font-sans">{credentialModalStudent.nationality || 'Indian'} • {credentialModalStudent.caste || '—'} • {credentialModalStudent.donation || 'Nil'}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  🛡️ <strong>Security Clearance:</strong> As Super Administrator, you have privilege to download student authentication and academic data slips.
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `VCAS Official Student Authentication Pass\n` +
                        `Student Name: ${credentialModalStudent.name}\n` +
                        `Register Number (Reg No): ${credentialModalStudent.regNo || credentialModalStudent.id}\n` +
                        `Roll Number: ${credentialModalStudent.rollNo || '—'}\n` +
                        `Year: ${credentialModalStudent.year || '1st Year'}\n` +
                        `Login ID: ${credentialModalStudent.loginId || credentialModalStudent.regNo || credentialModalStudent.id}\n` +
                        `Password (Date of Birth): ${credentialModalStudent.dob || '—'}\n` +
                        `Course: ${credentialModalStudent.course || credentialModalStudent.department || '—'}\n` +
                        `Portal URL: http://localhost:5173/login`
                      );
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

      {/* CUSTOM FIELD EXPORT MODAL */}
      {showExportModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
              
              {/* Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Download className="w-6 h-6 text-purple-300" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight">Custom Student Field Download</h3>
                    <p className="text-xs text-purple-200">
                      Download specific fields separately (Aadhaar alone, PAN alone, Bank details, etc.)
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">

                {/* 1-Click Fast Presets */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      ⚡ Instant 1-Click Field Downloads ({filteredStudents.length} Students)
                    </span>
                    <span className="text-[11px] font-semibold text-purple-600">Direct CSV Download</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        handleQuickExport('aadhaar_only');
                        setShowExportModal(false);
                      }}
                      className="p-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 text-left transition-all group cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-900">Aadhaar Only</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-bold">Govt ID</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 mt-1">Reg No + Roll No + Name + Aadhaar</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleQuickExport('pan_only');
                        setShowExportModal(false);
                      }}
                      className="p-3 rounded-2xl border-2 border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-left transition-all group cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-900">PAN Only</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-200 text-blue-800 font-bold">Tax ID</span>
                      </div>
                      <p className="text-[11px] text-blue-700 mt-1">Reg No + Roll No + Name + PAN</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleQuickExport('bank_only');
                        setShowExportModal(false);
                      }}
                      className="p-3 rounded-2xl border-2 border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 text-left transition-all group cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-900">Bank Accounts</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-800 font-bold">Finance</span>
                      </div>
                      <p className="text-[11px] text-amber-700 mt-1">Account No + IFSC + Bank + Branch</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleQuickExport('fees_only');
                        setShowExportModal(false);
                      }}
                      className="p-3 rounded-2xl border-2 border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 text-left transition-all group cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-purple-900">Fee Status</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-200 text-purple-800 font-bold">Accounts</span>
                      </div>
                      <p className="text-[11px] text-purple-700 mt-1">Paid / Pending Status + Donation</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleQuickExport('credentials_only');
                        setShowExportModal(false);
                      }}
                      className="p-3 rounded-2xl border-2 border-rose-200 bg-rose-50/60 hover:bg-rose-100/80 text-left transition-all group cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-rose-900">Portal Credentials</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-200 text-rose-800 font-bold">Security</span>
                      </div>
                      <p className="text-[11px] text-rose-700 mt-1">Login ID + Default Password (DOB)</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleQuickExport('all');
                        setShowExportModal(false);
                      }}
                      className="p-3 rounded-2xl border-2 border-slate-300 bg-slate-100 hover:bg-slate-200 text-left transition-all group cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">Full Master Sheet</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-300 text-slate-800 font-bold">All 33 Cols</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">Complete Student Master Registry</p>
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
                        Custom Field Selection ({selectedExportFields.length} Selected)
                      </h4>
                      <p className="text-[11px] text-slate-500">Pick any individual fields to include in your customized export.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedExportFields(EXPORT_COLUMNS_CONFIG.map(c => c.id))}
                        className="px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 cursor-pointer"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedExportFields(['regNo', 'rollNo', 'name'])}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 cursor-pointer"
                      >
                        Reset to Basic
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedExportFields([])}
                        className="px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Groups */}
                  <div className="space-y-4">
                    {['Statutory / Identity', 'Basic Profile', 'Academic Details', 'Bank & Financials', 'Family & Contact'].map(groupName => {
                      const groupFields = EXPORT_COLUMNS_CONFIG.filter(c => c.group === groupName);
                      return (
                        <div key={groupName} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
                            {groupName}
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {groupFields.map(field => {
                              const isChecked = selectedExportFields.includes(field.id);
                              return (
                                <label
                                  key={field.id}
                                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                    isChecked
                                      ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold shadow-2xs'
                                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedExportFields(prev => [...prev, field.id]);
                                      } else {
                                        setSelectedExportFields(prev => prev.filter(x => x !== field.id));
                                      }
                                    }}
                                    className="w-3.5 h-3.5 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                                  />
                                  <span className="truncate">{field.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <span className="text-xs font-semibold text-slate-600">
                  Exporting <strong className="text-purple-700">{selectedExportFields.length}</strong> fields for <strong className="text-slate-900">{filteredStudents.length}</strong> students
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowExportModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={selectedExportFields.length === 0}
                    onClick={() => {
                      handleExportFields(selectedExportFields, 'VCAS_Custom_Student_Export');
                      setShowExportModal(false);
                    }}
                    className="px-5 py-2.5 text-xs font-black text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Selected CSV</span>
                  </button>
                </div>
              </div>

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
