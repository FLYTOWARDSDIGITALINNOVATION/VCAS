import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Users,
  Search,
  Plus,
  Save,
  Printer,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  CreditCard,
  ShieldCheck,
  Building2,
  Calendar,
  Lock,
  IdCard,
  FileText,
  UserPlus,
  ChevronRight,
  Download,
  KeyRound,
  BookOpen,
  CheckSquare
} from 'lucide-react';
import ModalPortal from '../ModalPortal';
import CollegeLogo, { getCollegeLogoHtml } from '../CollegeLogo';

const API_BASE = 'http://localhost:5000/api';

const DEFAULT_COURSES = [
  'B.Sc. COMPUTER SCIENCE',
  'B.Sc. INFORMATION TECHNOLOGY',
  'B.C.A. COMPUTER APPLICATIONS',
  'B.Com. COMMERCE',
  'B.B.A. BUSINESS ADMINISTRATION',
  'B.Sc. MATHEMATICS',
  'B.Sc. PHYSICS',
  'B.Sc. CHEMISTRY',
  'B.A. ENGLISH'
];

const COMMUNITY_OPTIONS = ['OC', 'BC', 'BC(M)', 'MBC', 'DNC', 'SC', 'ST', 'SCA'];

export default function StaffStudentModule({ staffUser, onNavigate }) {
  const isAccountant = Boolean(
    staffUser?.role === 'Accountant' || 
    staffUser?.designation === 'Accountant' || 
    staffUser?.department?.toLowerCase().includes('account') || 
    staffUser?.canViewFees === true
  );

  // Sub-tabs: 'directory' | 'add'
  const [activeTab, setActiveTab] = useState('directory');

  // Directory Filters & Search
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [feeFilter, setFeeFilter] = useState('All');

  // Modals
  const [viewingStudent, setViewingStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showCreatedModal, setShowCreatedModal] = useState(null); // Newly created student credentials modal
  const [editModalTab, setEditModalTab] = useState('sheet1');
  const [viewModalTab, setViewModalTab] = useState('sheet1');

  // Assign Subjects Modal State
  const [assigningStudent, setAssigningStudent] = useState(null);
  const [staffClasses, setStaffClasses] = useState([]);
  const [loadingStaffClasses, setLoadingStaffClasses] = useState(false);
  const [selectedClassCodes, setSelectedClassCodes] = useState(new Set());
  const [savingClasses, setSavingClasses] = useState(false);

  // Form State for Adding / Editing Student
  const initialForm = {
    regNo: '',
    rollNo: '',
    year: '1st Year',
    sem: '1st Sem',
    loginId: '',
    name: '',
    gender: 'Male',
    dob: '',
    course: staffUser?.department ? `B.Sc. ${staffUser.department.toUpperCase()}` : 'B.Sc. COMPUTER SCIENCE',
    department: staffUser?.department || 'Computer Science',
    courseDurationFrom: '2024',
    courseDurationTo: '2027',
    dateOfAdmission: new Date().toISOString().split('T')[0],
    nationality: 'Indian',
    religion: 'Hindu',
    community: 'BC',
    caste: 'BC',
    communityCertNo: '',
    phone: '',
    email: '',
    emisNumber: '',
    umisNumber: '',
    // Family & Guardian Details (Page 2)
    fatherName: '',
    fatherQualification: '',
    fatherOccupation: '',
    fatherMobile: '',
    motherName: '',
    motherQualification: '',
    motherOccupation: '',
    guardianName: '',
    guardianQualification: '',
    guardianOccupation: '',
    guardianPhone: '',
    presentAddress: '',
    permanentAddress: '',
    residencePhone: '',
    officePhone: '',
    parentEmail: '',
    aadhaar: '',
    pan: '',
    annualIncome: '',
    incomeCertNo: '',
    localGuardianName: '',
    localGuardianRelationship: '',
    localGuardianAddress: '',
    localGuardianPhone: '',
    // Bank Account Details (Page 2)
    bankName: '',
    bankAccountNo: '',
    ifscCode: '',
    bankBranch: '',
    micrNo: '',
    // Siblings Details (Page 2)
    sibling1Name: '',
    sibling1Age: '',
    sibling1Status: '',
    sibling2Name: '',
    sibling2Age: '',
    sibling2Status: '',
    sibling3Name: '',
    sibling3Age: '',
    sibling3Status: '',
    // Previous Academic Record (Page 3)
    tenthInstitution: '',
    tenthPassingYear: '',
    tenthBoard: '',
    tenthMarks: '',
    twelfthInstitution: '',
    twelfthPassingYear: '',
    twelfthBoard: '',
    twelfthMarks: '',
    degreeMajor: '',
    degreeInstitution: '',
    degreePassingYear: '',
    degreeBoard: '',
    degreeMarks: '',
    // Extra-Curricular & Personal Metrics (Page 3)
    nssNccOthers: '',
    sports: '',
    fineArts: '',
    aimInLife: '',
    hobbies: '',
    // Medical Record (Page 3)
    height: '',
    weight: '',
    bloodGroup: 'O+',
    idMark1: '',
    idMark2: '',
    healthProblemsAllergies: '',
    // Languages Known (Page 3)
    langTamilRead: true,
    langTamilWrite: true,
    langTamilSpeak: true,
    langTamilPercent: '100%',
    langEnglishRead: true,
    langEnglishWrite: true,
    langEnglishSpeak: true,
    langEnglishPercent: '80%',
    langOtherName: '',
    langOtherRead: false,
    langOtherWrite: false,
    langOtherSpeak: false,
    langOtherPercent: '',
    // Transportation Details (Page 3)
    transportI_Bus: 'No',
    transportI_Own: 'No',
    transportI_Details: '',
    transportII_Bus: 'No',
    transportII_Own: 'No',
    transportII_Details: '',
    transportIII_Bus: 'No',
    transportIII_Own: 'No',
    transportIII_Details: '',
    // Mentor & Monitoring Records (Pages 4 & 5)
    mentorName: staffUser?.name || '',
    mentorDesignation: staffUser?.designation || 'Assistant Professor',
    mentorDepartment: staffUser?.department || 'Computer Science',
    counsellingNotes: '',
    coCurricularActivities: '',
    extraCurricularProgrammes: '',
    valueAddedCourses: '',
    industrialVisits: '',
    disciplinaryActions: '',
    totalWorkingHours: '450',
    hoursAbsent: '0',
    totalArrearsTillLastSem: '0',
    arrearsClearedThisSem: '0',
    arrearsYetToBeCleared: '0',
    donation: 'Nil',
    drivingLicense: '',
    address: '',
    feeStatus: 'Pending',
    attendance: 85
  };

  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Fetch all students
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/students`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setStudents(data.data);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Open modal to assign subjects for a student
  const handleOpenAssignModal = async (student) => {
    setAssigningStudent(student);
    setLoadingStaffClasses(true);
    try {
      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.classes)) {
        setStaffClasses(data.classes);
        const rollUpper = (student.rollNo || student.regNo || '').toUpperCase();
        const activeSet = new Set();
        data.classes.forEach(c => {
          const isEnrolled = (c.students || []).some(s => s.rollNo.toUpperCase() === rollUpper);
          if (isEnrolled) activeSet.add(c.code);
        });
        setSelectedClassCodes(activeSet);
      }
    } catch (err) {
      console.error('Error fetching staff classes:', err);
    } finally {
      setLoadingStaffClasses(false);
    }
  };

  const handleToggleClass = (classCode) => {
    setSelectedClassCodes(prev => {
      const next = new Set(prev);
      if (next.has(classCode)) next.delete(classCode);
      else next.add(classCode);
      return next;
    });
  };

  const handleSaveStudentClasses = async () => {
    if (!assigningStudent) return;
    setSavingClasses(true);
    const rollNo = (assigningStudent.rollNo || assigningStudent.regNo || '').toUpperCase();
    try {
      for (const cls of staffClasses) {
        const isCurrentlyEnrolled = (cls.students || []).some(s => s.rollNo.toUpperCase() === rollNo);
        const shouldBeEnrolled = selectedClassCodes.has(cls.code);

        if (shouldBeEnrolled && !isCurrentlyEnrolled) {
          await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}/${cls.code}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rollNo,
              name: assigningStudent.name,
              phone: assigningStudent.phone || '',
              email: assigningStudent.email || ''
            })
          });
        } else if (!shouldBeEnrolled && isCurrentlyEnrolled) {
          await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}/${cls.code}/students/${rollNo}`, {
            method: 'DELETE'
          });
        }
      }
      showToast(`Subjects updated for ${assigningStudent.name}!`);
      setAssigningStudent(null);
    } catch (err) {
      alert('Error saving subjects: ' + err.message);
    } finally {
      setSavingClasses(false);
    }
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        s.name?.toLowerCase().includes(q) ||
        s.regNo?.toLowerCase().includes(q) ||
        s.rollNo?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.aadhaar?.includes(q)
      );

      const matchesDept = deptFilter === 'All' || s.department === deptFilter || s.course?.toLowerCase().includes(deptFilter.toLowerCase());
      const matchesYear = yearFilter === 'All' || s.year === yearFilter;
      const matchesFee = feeFilter === 'All' || s.feeStatus === feeFilter;

      return matchesSearch && matchesDept && matchesYear && matchesFee;
    });
  }, [students, searchQuery, deptFilter, yearFilter, feeFilter]);

  // Handle Form Change with Login ID auto-sync
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const val = type === 'checkbox' ? checked : value;
      const updated = { ...prev, [name]: val };
      if (name === 'regNo' && !prev.rollNo) {
        updated.loginId = (value || '').toUpperCase();
      }
      return updated;
    });
  };

  // Handle Edit Modal Form Change
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingStudent(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
    });
  };

  // Submit Handler: Add New Student
  const handleSubmitNewStudent = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Student Name is required.');
    if (!formData.dob) return alert('Date of Birth is required (used as initial password).');

    setIsSubmitting(true);
    try {
      const cleanRollNo = formData.rollNo.trim().toUpperCase();
      const cleanRegNo = formData.regNo.trim().toUpperCase();
      const payload = {
        ...formData,
        regNo: cleanRegNo,
        rollNo: cleanRollNo,
        loginId: cleanRollNo || cleanRegNo,
        feeStatus: 'Pending',
        password: formData.dob // Set Date of Birth as Password
      };

      const res = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowCreatedModal(data.data);
        setFormData(initialForm);
        fetchStudents();
        setActiveTab('directory');
      } else {
        alert(data.message || 'Failed to create student.');
      }
    } catch (err) {
      alert('Network error while saving student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Handler: Update Existing Student
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsSubmitting(true);
    try {
      const originalSt = students.find(s => (s._id && s._id === editingStudent._id) || (s.regNo && s.regNo === editingStudent.regNo));
      const studentToSave = {
        ...editingStudent,
        // Fee Status must only be updated by the Accountant, not by teaching staff
        feeStatus: isAccountant 
          ? (editingStudent.feeStatus || 'Pending') 
          : (originalSt?.feeStatus || editingStudent.feeStatus || 'Pending')
      };
      const res = await fetch(`${API_BASE}/students/${editingStudent._id || editingStudent.regNo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentToSave)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Student "${editingStudent.name}" updated successfully.`);
        setEditingStudent(null);
        fetchStudents();
      } else {
        alert(data.message || 'Failed to update student.');
      }
    } catch (err) {
      alert('Error updating student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Student
  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete student "${studentName}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/students/${studentId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Student "${studentName}" deleted.`);
        fetchStudents();
      }
    } catch (err) {
      alert('Failed to delete student.');
    }
  };

  // Print Official Student Slip
  const handlePrintStudentSlip = (st) => {
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) return alert('Please allow popups to print Student Slip.');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Slip - ${st.name} (${st.regNo || st.rollNo})</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 11.5px; }
          .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 18px; font-weight: 900; color: #0f1e3c; text-transform: uppercase; }
          .sub { font-size: 11px; color: #475569; font-weight: 600; margin-top: 2px; }
          .badge { display: inline-block; background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 800; padding: 3px 12px; border-radius: 9999px; margin-top: 6px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
          .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #ffffff; }
          .box-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 3.5px 5px; font-size: 11px; vertical-align: top; }
          td.lbl { width: 44%; font-weight: 600; color: #64748b; }
          td.val { width: 56%; font-weight: 700; color: #0f172a; }
          .auth-box { background: #faf5ff; border: 1px dashed #9333ea; border-radius: 8px; padding: 10px; margin-bottom: 14px; }
          .auth-title { font-size: 11px; font-weight: 800; color: #7e22ce; text-transform: uppercase; margin-bottom: 6px; }
          .auth-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 11px; }
          .auth-item span { display: block; font-size: 9px; font-weight: 700; color: #6b21a8; }
          .auth-item strong { font-family: monospace; font-size: 12px; color: #0f172a; }
          .signatures { display: flex; justify-content: space-between; margin-top: 35px; padding: 0 20px; font-size: 11px; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:6px;">
            ${getCollegeLogoHtml(44)}
            <div>
              <div class="title">Vivekanandha College of Arts and Sciences</div>
              <div class="sub">Affiliated with Manonmaniam Sundaranar University • VCAS</div>
            </div>
          </div>
          <div class="badge">Official Student Registration &amp; Information Slip</div>
        </div>

        <div class="auth-box">
          <div class="auth-title">🔐 Student Portal Credentials (Login ID &amp; Password)</div>
          <div class="auth-grid">
            <div class="auth-item">
              <span>ROLL NUMBER (LOGIN ID):</span>
              <strong>${st.rollNo || st.regNo || '—'}</strong>
            </div>
            <div class="auth-item">
              <span>PASSWORD (DATE OF BIRTH):</span>
              <strong>${st.dob || 'DOB on record'}</strong>
            </div>
            <div class="auth-item">
              <span>REGISTER NUMBER:</span>
              <strong>${st.regNo || '—'}</strong>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="box">
            <div class="box-title">Academic &amp; Enrollment Particulars</div>
            <table>
              <tr><td class="lbl">Register Number:</td><td class="val">${st.regNo || '—'}</td></tr>
              <tr><td class="lbl">Roll Number:</td><td class="val">${st.rollNo || '—'}</td></tr>
              <tr><td class="lbl">Year of Study:</td><td class="val">${st.year || '1st Year'}</td></tr>
              <tr><td class="lbl">Current Semester:</td><td class="val">${st.sem || '1st Sem'}</td></tr>
              <tr><td class="lbl">Degree / Course:</td><td class="val">${st.course || '—'}</td></tr>
              <tr><td class="lbl">Department:</td><td class="val">${st.department || '—'}</td></tr>
              <tr><td class="lbl">Date of Admission:</td><td class="val">${st.dateOfAdmission || '—'}</td></tr>
              <tr><td class="lbl">Institutional Donation:</td><td class="val">${st.donation || 'Nil'}</td></tr>
            </table>
          </div>

          <div class="box">
            <div class="box-title">Personal &amp; Demographic Data</div>
            <table>
              <tr><td class="lbl">Full Name:</td><td class="val">${st.name || '—'}</td></tr>
              <tr><td class="lbl">Gender:</td><td class="val">${st.gender || '—'}</td></tr>
              <tr><td class="lbl">Date of Birth (DOB):</td><td class="val">${st.dob || '—'}</td></tr>
              <tr><td class="lbl">Father's Name:</td><td class="val">${st.fatherName || '—'}</td></tr>
              <tr><td class="lbl">Mother's Name:</td><td class="val">${st.motherName || '—'}</td></tr>
              <tr><td class="lbl">Nationality:</td><td class="val">${st.nationality || 'Indian'}</td></tr>
              <tr><td class="lbl">Religion:</td><td class="val">${st.religion || 'Hindu'}</td></tr>
              <tr><td class="lbl">Caste / Community:</td><td class="val">${st.caste || '—'}</td></tr>
            </table>
          </div>
        </div>

        <div class="grid-2">
          <div class="box">
            <div class="box-title">Statutory Identity &amp; Verification</div>
            <table>
              <tr><td class="lbl">Aadhaar Card No:</td><td class="val">${st.aadhaar || '—'}</td></tr>
              <tr><td class="lbl">PAN Card No:</td><td class="val">${st.pan || '—'}</td></tr>
              <tr><td class="lbl">Driving License No:</td><td class="val">${st.drivingLicense || '—'}</td></tr>
              <tr><td class="lbl">EMIS Number:</td><td class="val">${st.emisNumber || '—'}</td></tr>
              <tr><td class="lbl">10th Standard Marks:</td><td class="val">${st.tenthMarks || '—'}</td></tr>
              <tr><td class="lbl">12th Standard Marks:</td><td class="val">${st.twelfthMarks || '—'}</td></tr>
            </table>
          </div>

          <div class="box">
            <div class="box-title">Bank Account Details (Scholarship/Fee)</div>
            <table>
              <tr><td class="lbl">Bank Account No:</td><td class="val">${st.bankAccountNo || '—'}</td></tr>
              <tr><td class="lbl">Bank Name:</td><td class="val">${st.bankName || '—'}</td></tr>
              <tr><td class="lbl">IFSC Code:</td><td class="val">${st.ifscCode || '—'}</td></tr>
              <tr><td class="lbl">Branch Name:</td><td class="val">${st.bankBranch || '—'}</td></tr>
              <tr><td class="lbl">Primary Mobile:</td><td class="val">${st.phone || '—'}</td></tr>
              <tr><td class="lbl">Email Address:</td><td class="val">${st.email || '—'}</td></tr>
            </table>
          </div>
        </div>

        <div class="signatures">
          <div>Candidate Signature</div>
          <div>Faculty Advisor</div>
          <div>Head of Department</div>
          <div>Principal</div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto font-sans animate-fadeIn">
      
      {/* 1. Top Header Bar Matching Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage comprehensive student enrollments, Aadhaar, PAN, Bank Details, and create student portal credentials.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStudents}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Students</span>
          </button>
          <button
            onClick={() => setActiveTab(activeTab === 'add' ? 'directory' : 'add')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
          >
            {activeTab === 'add' ? <Users className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            <span>{activeTab === 'add' ? 'Browse Directory' : '+ Add New Student'}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Soft Pastel Summary Banner Matching Admin */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
            🎓
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-blue-950">
              Student Information &amp; Credential Directory
            </h3>
            <p className="text-[11px] text-blue-800 font-medium mt-0.5">
              Reg No, Year of Study, Date of Birth as Password, Statutory &amp; Banking Records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-white/90 border border-blue-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs">
            <span className="text-slate-400 block text-[9.5px] uppercase">Total Enrolled</span>
            <span className="text-blue-700 font-extrabold text-sm">{students.length} Students</span>
          </div>
          <div className="px-3 py-1.5 bg-white/90 border border-blue-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs">
            <span className="text-slate-400 block text-[9.5px] uppercase">Fee Cleared</span>
            <span className="text-emerald-700 font-extrabold text-sm">
              {students.filter(s => (s.feeStatus || '').toLowerCase() === 'paid').length}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'directory'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Directory &amp; Slips ({filteredStudents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('add')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'add'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Student (All Statutory Fields)</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 1: STUDENT DIRECTORY                                      */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'directory' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name, Reg No, Roll No, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="All">All Years</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
              </select>

              <select
                value={feeFilter}
                onChange={(e) => setFeeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="All">All Fee Status</option>
                <option value="Paid">Fee Cleared (Paid)</option>
                <option value="Pending">Fee Due (Pending)</option>
              </select>
            </div>
          </div>

          {/* Student Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-4">Reg No / Roll No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Year &amp; Course</th>
                    <th className="py-3 px-4">Aadhaar / PAN</th>
                    <th className="py-3 px-4">Bank Account</th>
                    <th className="py-3 px-4 text-center">Fee Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((st) => (
                      <tr key={st._id || st.regNo} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                          {st.regNo || st.studentId || '—'}
                          <span className="block font-sans text-[10px] text-slate-400">Roll: {st.rollNo || '—'}</span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">
                          {st.name}
                          <span className="block text-[10px] text-slate-400 font-medium">{st.phone || '—'}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] border border-amber-200">
                            {st.year || '1st Year'}
                          </span>
                          <span className="block text-[10.5px] text-slate-500 font-medium truncate max-w-xs mt-0.5">
                            {st.course || st.department}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <span className="text-slate-800">{st.aadhaar || '—'}</span>
                          <span className="block text-slate-400 text-[10px]">{st.pan ? `PAN: ${st.pan}` : ''}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                          <span>{st.bankAccountNo || '—'}</span>
                          <span className="block text-[10px] text-slate-400 font-sans">{st.bankName || ''}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            (st.feeStatus || '').toLowerCase() === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {st.feeStatus || 'Pending'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              onClick={() => handleOpenAssignModal(st)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer border border-indigo-200"
                              title="Assign Subjects / Classes"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Subjects</span>
                            </button>
                            {onNavigate && (
                              <button
                                onClick={() => onNavigate('Attendance')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                                title="Mark Attendance"
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Attendance</span>
                              </button>
                            )}
                            <button
                              onClick={() => handlePrintStudentSlip(st)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Print Official Student Slip"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setViewingStudent(st)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="View Full Profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingStudent({ ...st })}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Student"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(st._id, st.name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400 font-medium">
                        No students found matching your search and filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 2: ADD NEW STUDENT (5-SHEET MENTOR DIARY & PORTFOLIO)     */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-6 animate-fadeIn">
          
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Vivekananda College of Arts and Science
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Tenkasi • MSU Affiliated
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                Mentor Diary &amp; Student Portfolio — Student Enrollment
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All statutory and institutional fields from Sheets 1 to 5. Student credentials: Roll No (Login ID) + Date of Birth (Password).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
                🔑 Credentials: Roll No + DOB
              </span>
              <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                🔒 Fees: Managed by Accountant
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmitNewStudent} className="space-y-6 text-xs">
            
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SHEET 1: COVER / CORE IDENTIFICATION & STATUTORY DETAILS         */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="p-4 sm:p-5 bg-blue-50/40 rounded-2xl border border-blue-200/80 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                <h4 className="text-xs font-black uppercase text-blue-900 tracking-wider flex items-center gap-2">
                  <IdCard className="w-4 h-4 text-blue-600" />
                  Sheet 1: Core Academic &amp; Community Identification
                </h4>
                <span className="text-[10px] font-black px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                  Page 1 of Portfolio
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Name of the Student *
                  </label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 uppercase focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    University / Reg. No. *
                  </label>
                  <input
                    type="text"
                    required
                    name="regNo"
                    value={formData.regNo}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-blue-700 uppercase focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Roll Number *</span>
                    <span className="text-[9px] text-purple-700 font-extrabold uppercase">Login ID</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="rollNo"
                    value={formData.rollNo}
                    onChange={handleChange}
                    className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 font-mono font-bold text-purple-800 uppercase focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Course / Degree</label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    list="courseOptionsList"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 uppercase focus:outline-none"
                  />
                  <datalist id="courseOptionsList">
                    {DEFAULT_COURSES.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Course Duration (From Year to Year)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold">20</span>
                    <input
                      type="text"
                      name="courseDurationFrom"
                      maxLength={4}
                      value={formData.courseDurationFrom}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-center font-bold focus:outline-none"
                    />
                    <span className="text-slate-500 font-bold">to 20</span>
                    <input
                      type="text"
                      name="courseDurationTo"
                      maxLength={4}
                      value={formData.courseDurationTo}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-center font-bold focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Year of Study &amp; Sem</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 font-bold focus:outline-none"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                    </select>
                    <select
                      name="sem"
                      value={formData.sem}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 font-bold focus:outline-none"
                    >
                      <option value="1st Sem">1st Sem</option>
                      <option value="2nd Sem">2nd Sem</option>
                      <option value="3rd Sem">3rd Sem</option>
                      <option value="4th Sem">4th Sem</option>
                      <option value="5th Sem">5th Sem</option>
                      <option value="6th Sem">6th Sem</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Date of Birth (DOB) *</span>
                    <span className="text-[9px] text-emerald-600 font-extrabold uppercase">Password</span>
                  </label>
                  <input
                    type="date"
                    required
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full bg-amber-50/70 border border-amber-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Religion</label>
                  <input
                    type="text"
                    name="religion"
                    value={formData.religion}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Caste</label>
                  <input
                    type="text"
                    name="caste"
                    value={formData.caste}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Community Badges Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Community (As per Official Statutory Category)
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMUNITY_OPTIONS.map(comm => {
                    const isSelected = (formData.community || '').toUpperCase() === comm.toUpperCase();
                    return (
                      <button
                        type="button"
                        key={comm}
                        onClick={() => setFormData(prev => ({ ...prev, community: comm }))}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {comm} {isSelected ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Community Certificate No.</label>
                  <input
                    type="text"
                    name="communityCertNo"
                    value={formData.communityCertNo}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono uppercase focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student Email ID</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 lowercase focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student Mobile No</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Admission</label>
                  <input
                    type="date"
                    name="dateOfAdmission"
                    value={formData.dateOfAdmission}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">EMIS No.</label>
                  <input
                    type="text"
                    name="emisNumber"
                    value={formData.emisNumber}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">UMIS No.</label>
                  <input
                    type="text"
                    name="umisNumber"
                    value={formData.umisNumber}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Institutional Donation / Quota</label>
                  <input
                    type="text"
                    name="donation"
                    value={formData.donation}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fee Status</label>
                  <div className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-600 flex items-center justify-between">
                    <span>{formData.feeStatus || 'Pending'}</span>
                    <span className="text-[10px] text-amber-700 font-extrabold">Accountant Only</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SHEET 2: FAMILY PARTICULARS, ADDRESS, BANKING & SIBLINGS       */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="p-4 sm:p-5 bg-emerald-50/40 rounded-2xl border border-emerald-200/80 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                <h4 className="text-xs font-black uppercase text-emerald-950 tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Sheet 2: Family Particulars, Address, Banking &amp; Siblings
                </h4>
                <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  Page 2 of Portfolio
                </span>
              </div>

              {/* Parents Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-black">
                      <th className="p-2.5">Field</th>
                      <th className="p-2.5">Father</th>
                      <th className="p-2.5">Mother</th>
                      <th className="p-2.5">Guardian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2 font-bold text-slate-600">Name</td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="fatherName"
                          value={formData.fatherName}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="motherName"
                          value={formData.motherName}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="guardianName"
                          value={formData.guardianName}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-600">Educational Qualification</td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="fatherQualification"
                          value={formData.fatherQualification}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="motherQualification"
                          value={formData.motherQualification}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="guardianQualification"
                          value={formData.guardianQualification}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-600">Occupation</td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="fatherOccupation"
                          value={formData.fatherOccupation}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="motherOccupation"
                          value={formData.motherOccupation}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="guardianOccupation"
                          value={formData.guardianOccupation}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-600">Phone / Mobile No.</td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="fatherMobile"
                          value={formData.fatherMobile}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="motherMobile"
                          value={formData.motherMobile}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="guardianPhone"
                          value={formData.guardianPhone}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Present Residential Address</label>
                  <textarea
                    rows={2}
                    name="presentAddress"
                    value={formData.presentAddress}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Permanent Residential Address</label>
                  <textarea
                    rows={2}
                    name="permanentAddress"
                    value={formData.permanentAddress}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone No (Res)</label>
                  <input
                    type="text"
                    name="residencePhone"
                    value={formData.residencePhone}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone No (Office)</label>
                  <input
                    type="text"
                    name="officePhone"
                    value={formData.officePhone}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parent E-mail</label>
                  <input
                    type="email"
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 lowercase focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Annual Income</label>
                  <input
                    type="text"
                    name="annualIncome"
                    value={formData.annualIncome}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Aadhar Card No.</label>
                  <input
                    type="text"
                    name="aadhaar"
                    maxLength={14}
                    value={formData.aadhaar}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PAN Card No.</label>
                  <input
                    type="text"
                    name="pan"
                    maxLength={10}
                    value={formData.pan}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold uppercase focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Income Certificate No.</label>
                  <input
                    type="text"
                    name="incomeCertNo"
                    value={formData.incomeCertNo}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Driving Licence No.</label>
                  <input
                    type="text"
                    name="drivingLicense"
                    value={formData.drivingLicense}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono uppercase focus:outline-none"
                  />
                </div>
              </div>

              {/* Local Guardian */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <span className="font-extrabold text-slate-800 text-xs block">Local Guardian Particulars</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Local Guardian Name</label>
                    <input
                      type="text"
                      name="localGuardianName"
                      value={formData.localGuardianName}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Relationship</label>
                    <input
                      type="text"
                      name="localGuardianRelationship"
                      value={formData.localGuardianRelationship}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Local Guardian Phone</label>
                    <input
                      type="text"
                      name="localGuardianPhone"
                      value={formData.localGuardianPhone}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Local Guardian Address</label>
                    <input
                      type="text"
                      name="localGuardianAddress"
                      value={formData.localGuardianAddress}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <span className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Bank Account Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Bank Name</label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">A/c Number</label>
                    <input
                      type="text"
                      name="bankAccountNo"
                      value={formData.bankAccountNo}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={formData.ifscCode}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono uppercase focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Branch</label>
                    <input
                      type="text"
                      name="bankBranch"
                      value={formData.bankBranch}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">MICR No.</label>
                    <input
                      type="text"
                      name="micrNo"
                      value={formData.micrNo}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Details of Brothers / Sisters */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <span className="font-extrabold text-slate-800 text-xs block">Details of Brothers / Sisters</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { num: 1, name: 'sibling1Name', age: 'sibling1Age', status: 'sibling1Status' },
                    { num: 2, name: 'sibling2Name', age: 'sibling2Age', status: 'sibling2Status' },
                    { num: 3, name: 'sibling3Name', age: 'sibling3Age', status: 'sibling3Status' }
                  ].map(sib => (
                    <div key={sib.num} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700">Sibling {sib.num}</span>
                      <input
                        type="text"
                        name={sib.name}
                        placeholder="Name"
                        value={formData[sib.name]}
                        onChange={handleChange}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          name={sib.age}
                          placeholder="Age"
                          value={formData[sib.age]}
                          onChange={handleChange}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                        />
                        <input
                          type="text"
                          name={sib.status}
                          placeholder="Present Status"
                          value={formData[sib.status]}
                          onChange={handleChange}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SHEET 3: PREVIOUS ACADEMIC, METRICS, MEDICAL & TRANSPORT        */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="p-4 sm:p-5 bg-purple-50/40 rounded-2xl border border-purple-200/80 space-y-4">
              <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                <h4 className="text-xs font-black uppercase text-purple-950 tracking-wider flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  Sheet 3: Previous Academic Record, Metrics, Medical &amp; Transport
                </h4>
                <span className="text-[10px] font-black px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                  Page 3 of Portfolio
                </span>
              </div>

              {/* Previous Academic Record Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-black">
                      <th className="p-2.5">Std / Dip / Deg.</th>
                      <th className="p-2.5">Name of the Institution &amp; Place</th>
                      <th className="p-2.5">Year of Passing</th>
                      <th className="p-2.5">Board / University</th>
                      <th className="p-2.5">Marks Obtained</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2 font-bold text-slate-700">X Std</td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="tenthInstitution"
                          value={formData.tenthInstitution}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="tenthPassingYear"
                          value={formData.tenthPassingYear}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="tenthBoard"
                          value={formData.tenthBoard}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="tenthMarks"
                          value={formData.tenthMarks}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold focus:outline-none"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-700">XII Std</td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="twelfthInstitution"
                          value={formData.twelfthInstitution}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="twelfthPassingYear"
                          value={formData.twelfthPassingYear}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="twelfthBoard"
                          value={formData.twelfthBoard}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="twelfthMarks"
                          value={formData.twelfthMarks}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold focus:outline-none"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-700">
                        Degree in (major):
                        <input
                          type="text"
                          name="degreeMajor"
                          placeholder="e.g. CS"
                          value={formData.degreeMajor}
                          onChange={handleChange}
                          className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="degreeInstitution"
                          value={formData.degreeInstitution}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="degreePassingYear"
                          value={formData.degreePassingYear}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="degreeBoard"
                          value={formData.degreeBoard}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          name="degreeMarks"
                          value={formData.degreeMarks}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold focus:outline-none"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Extra-Curricular Activities & Personal Metrics */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3">
                <span className="font-extrabold text-slate-800 text-xs block">
                  Extra-Curricular Activities &amp; Personal Metrics
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">(i) NSS / NCC / Others (if any)</label>
                    <input
                      type="text"
                      name="nssNccOthers"
                      value={formData.nssNccOthers}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">(ii) Sports</label>
                    <input
                      type="text"
                      name="sports"
                      value={formData.sports}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">(iii) Fine Arts</label>
                    <input
                      type="text"
                      name="fineArts"
                      value={formData.fineArts}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Aim in Life</label>
                    <input
                      type="text"
                      name="aimInLife"
                      value={formData.aimInLife}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Hobbies</label>
                    <input
                      type="text"
                      name="hobbies"
                      value={formData.hobbies}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Record */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3">
                <span className="font-extrabold text-slate-800 text-xs block">Medical Record</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Height (Cms)</label>
                    <input
                      type="text"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Weight (Kgs)</label>
                    <input
                      type="text"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Blood Group</label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold focus:outline-none"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Identification Mark 1</label>
                    <input
                      type="text"
                      name="idMark1"
                      value={formData.idMark1}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Identification Mark 2</label>
                    <input
                      type="text"
                      name="idMark2"
                      value={formData.idMark2}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Health Problems / Drug &amp; Food Allergies (if any)</label>
                  <input
                    type="text"
                    name="healthProblemsAllergies"
                    value={formData.healthProblemsAllergies}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
              </div>

              {/* Languages Known */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <span className="font-extrabold text-slate-800 text-xs block">Languages Known</span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 font-bold">
                        <th className="p-2">Language</th>
                        <th className="p-2 text-center">Read</th>
                        <th className="p-2 text-center">Write</th>
                        <th className="p-2 text-center">Speak</th>
                        <th className="p-2">Knowledge %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2 font-bold text-slate-800">Tamil</td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            name="langTamilRead"
                            checked={Boolean(formData.langTamilRead)}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            name="langTamilWrite"
                            checked={Boolean(formData.langTamilWrite)}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            name="langTamilSpeak"
                            checked={Boolean(formData.langTamilSpeak)}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            name="langTamilPercent"
                            value={formData.langTamilPercent}
                            onChange={handleChange}
                            className="w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-800">English</td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            name="langEnglishRead"
                            checked={Boolean(formData.langEnglishRead)}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            name="langEnglishWrite"
                            checked={Boolean(formData.langEnglishWrite)}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            name="langEnglishSpeak"
                            checked={Boolean(formData.langEnglishSpeak)}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            name="langEnglishPercent"
                            value={formData.langEnglishPercent}
                            onChange={handleChange}
                            className="w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2">
                          <input
                            type="text"
                            name="langOtherName"
                            placeholder="Others (Specify)"
                            value={formData.langOtherName}
                            onChange={handleChange}
                            className="w-32 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            name="langOtherRead"
                            checked={Boolean(formData.langOtherRead)}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            name="langOtherWrite"
                            checked={Boolean(formData.langOtherWrite)}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            name="langOtherSpeak"
                            checked={Boolean(formData.langOtherSpeak)}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            name="langOtherPercent"
                            value={formData.langOtherPercent}
                            onChange={handleChange}
                            className="w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transportation Details */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <span className="font-extrabold text-slate-800 text-xs block">Transportation Details</span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 font-bold">
                        <th className="p-2">Year</th>
                        <th className="p-2">College Bus</th>
                        <th className="p-2">Own Vehicle</th>
                        <th className="p-2">College Bus No. &amp; Route / DL &amp; Own Vehicle Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { yr: 'I', bus: 'transportI_Bus', own: 'transportI_Own', det: 'transportI_Details' },
                        { yr: 'II', bus: 'transportII_Bus', own: 'transportII_Own', det: 'transportII_Details' },
                        { yr: 'III', bus: 'transportIII_Bus', own: 'transportIII_Own', det: 'transportIII_Details' }
                      ].map(row => (
                        <tr key={row.yr}>
                          <td className="p-2 font-black text-slate-800">{row.yr}</td>
                          <td className="p-2">
                            <select
                              name={row.bus}
                              value={formData[row.bus]}
                              onChange={handleChange}
                              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold"
                            >
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <select
                              name={row.own}
                              value={formData[row.own]}
                              onChange={handleChange}
                              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold"
                            >
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              name={row.det}
                              value={formData[row.det]}
                              onChange={handleChange}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SHEET 4: COUNSELLING, CO-CURRICULAR & DISCIPLINARY              */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="p-4 sm:p-5 bg-amber-50/40 rounded-2xl border border-amber-200/80 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                <h4 className="text-xs font-black uppercase text-amber-950 tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  Sheet 4: Counselling, Activities, Value-Added &amp; Disciplinary Records
                </h4>
                <span className="text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                  Page 4 of Portfolio
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Counselling &amp; Parent Interactions (Semesters I–VI Particulars)
                  </label>
                  <textarea
                    rows={2}
                    name="counsellingNotes"
                    value={formData.counsellingNotes}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Co-Curricular Activities (Paper Presentation, Seminar Attended etc.)
                  </label>
                  <textarea
                    rows={2}
                    name="coCurricularActivities"
                    value={formData.coCurricularActivities}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Extra-Curricular Activities (Sports, Cultural Programmes etc.)
                  </label>
                  <textarea
                    rows={2}
                    name="extraCurricularProgrammes"
                    value={formData.extraCurricularProgrammes}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Value Added Courses Undergone (Course Name, Institution, Period)
                  </label>
                  <textarea
                    rows={2}
                    name="valueAddedCourses"
                    value={formData.valueAddedCourses}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Industrial Visit / In-Plan Training (Organisation, Dates From/To)
                  </label>
                  <textarea
                    rows={2}
                    name="industrialVisits"
                    value={formData.industrialVisits}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Disciplinary Action Taken (if any, with Date and Reason)
                  </label>
                  <textarea
                    rows={2}
                    name="disciplinaryActions"
                    value={formData.disciplinaryActions}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SHEET 5: STUDENT MONITORING SHEET & MENTOR ASSIGNMENT           */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="p-4 sm:p-5 bg-sky-50/40 rounded-2xl border border-sky-200/80 space-y-4">
              <div className="flex items-center justify-between border-b border-sky-200/60 pb-2">
                <h4 className="text-xs font-black uppercase text-sky-950 tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  Sheet 5: Student Monitoring Sheet (Mentor &amp; Academic Records)
                </h4>
                <span className="text-[10px] font-black px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full">
                  Page 5 of Portfolio
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Name of the Mentor</label>
                  <input
                    type="text"
                    name="mentorName"
                    value={formData.mentorName}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mentor Designation</label>
                  <input
                    type="text"
                    name="mentorDesignation"
                    value={formData.mentorDesignation}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mentor Department</label>
                  <input
                    type="text"
                    name="mentorDepartment"
                    value={formData.mentorDepartment}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              {/* Leave & Absence Records */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <span className="font-extrabold text-slate-800 text-xs block">Leave &amp; Absence Records</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Total Working Hours</label>
                    <input
                      type="text"
                      name="totalWorkingHours"
                      value={formData.totalWorkingHours}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Hours Absent</label>
                    <input
                      type="text"
                      name="hoursAbsent"
                      value={formData.hoursAbsent}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Attendance Percentage (%)</label>
                    <input
                      type="number"
                      name="attendance"
                      min="0"
                      max="100"
                      value={formData.attendance}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-blue-700 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Arrear Records */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <span className="font-extrabold text-slate-800 text-xs block">Arrear Records (if any)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Total Arrears till last Semester</label>
                    <input
                      type="text"
                      name="totalArrearsTillLastSem"
                      value={formData.totalArrearsTillLastSem}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Arrears Cleared in this Semester</label>
                    <input
                      type="text"
                      name="arrearsClearedThisSem"
                      value={formData.arrearsClearedThisSem}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Arrears yet to be cleared</label>
                    <input
                      type="text"
                      name="arrearsYetToBeCleared"
                      value={formData.arrearsYetToBeCleared}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-rose-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setFormData(initialForm);
                  setActiveTab('directory');
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? 'Registering Student...' : 'Register Student & Save Full Portfolio'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* MODAL: NEWLY CREATED STUDENT CREDENTIALS SLIP                    */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {showCreatedModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowCreatedModal(null)} />
            <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-lg z-10 border border-slate-200 animate-scaleUp text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Student Registered Successfully!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Official student login credentials have been generated and saved.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">Register Number (Reg No):</span>
                  <strong className="text-blue-700 font-mono text-sm">{showCreatedModal.regNo}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">Student Name:</span>
                  <strong className="text-slate-900">{showCreatedModal.name}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">Year / Course:</span>
                  <strong className="text-slate-800">{showCreatedModal.year} • {showCreatedModal.course}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">Login ID:</span>
                  <strong className="text-purple-700 font-mono">{showCreatedModal.loginId || showCreatedModal.regNo}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-bold">Initial Password:</span>
                  <strong className="text-emerald-700 font-mono text-sm">{showCreatedModal.dob || 'DOB on record'}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const st = showCreatedModal;
                    setShowCreatedModal(null);
                    handleOpenAssignModal(st);
                  }}
                  className="py-2.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Assign Subjects</span>
                </button>
                <button
                  onClick={() => handlePrintStudentSlip(showCreatedModal)}
                  className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setShowCreatedModal(null)}
                  className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* MODAL: ASSIGN SUBJECTS TO STUDENT                                */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {assigningStudent && (
        <ModalPortal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => !savingClasses && setAssigningStudent(null)} />
            <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-7 w-full max-w-lg z-10 border border-slate-200 animate-scaleUp space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Assign Subjects to Student</h3>
                    <p className="text-[11px] text-blue-600 font-bold">
                      {assigningStudent.name} ({assigningStudent.rollNo || assigningStudent.regNo})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAssigningStudent(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Check the subjects taught by you to enroll this student. Click "Save Subjects" to finalize.
              </p>

              {loadingStaffClasses ? (
                <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Loading your subjects...</span>
                </div>
              ) : staffClasses.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs">
                  You have not created any classes/subjects yet. Please create a class in "My Classes" first.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {staffClasses.map(cls => {
                    const isChecked = selectedClassCodes.has(cls.code);
                    return (
                      <div
                        key={cls._id || cls.code}
                        onClick={() => handleToggleClass(cls.code)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-blue-50/80 border-blue-300 text-blue-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div>
                          <span className="font-mono text-xs font-black text-blue-700 mr-2">{cls.code}</span>
                          <span className="text-xs font-extrabold">{cls.name}</span>
                          <p className="text-[10px] text-slate-400 font-normal">
                            {cls.dept} · Sem {cls.semester} · Sec {cls.section} · {(cls.students || []).length} enrolled
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningStudent(null)}
                  className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingClasses || staffClasses.length === 0}
                  onClick={handleSaveStudentClasses}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {savingClasses ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Subjects</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* MODAL: VIEW STUDENT DETAILS                                       */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {viewingStudent && (
        <ModalPortal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setViewingStudent(null)} />
            <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl z-10 border border-slate-200 animate-scaleUp overflow-y-auto max-h-[90vh] space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
                    {viewingStudent.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{viewingStudent.name}</h3>
                    <p className="text-xs text-blue-700 font-mono font-bold">Reg No: {viewingStudent.regNo} • {viewingStudent.year}</p>
                  </div>
                </div>
                <button onClick={() => setViewingStudent(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="font-extrabold text-blue-900 block text-[11px] uppercase">Academic Particulars</span>
                  <div className="flex justify-between"><span className="text-slate-500">Course:</span><strong>{viewingStudent.course}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Roll No:</span><strong>{viewingStudent.rollNo}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Year / Sem:</span><strong>{viewingStudent.year} ({viewingStudent.sem})</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Donation:</span><strong>{viewingStudent.donation || 'Nil'}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Fee Status:</span><strong className="text-emerald-700">{viewingStudent.feeStatus}</strong></div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="font-extrabold text-blue-900 block text-[11px] uppercase">Statutory &amp; Identity</span>
                  <div className="flex justify-between"><span className="text-slate-500">Aadhaar:</span><strong className="font-mono">{viewingStudent.aadhaar || '—'}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">PAN Card:</span><strong className="font-mono">{viewingStudent.pan || '—'}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">Driving License:</span><strong>{viewingStudent.drivingLicense || '—'}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">EMIS No:</span><strong>{viewingStudent.emisNumber || '—'}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">10th / 12th:</span><strong>{viewingStudent.tenthMarks} / {viewingStudent.twelfthMarks}</strong></div>
                </div>

                <div className="sm:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="font-extrabold text-emerald-900 block text-[11px] uppercase">Bank Account &amp; Contact Details</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex justify-between"><span className="text-slate-500">Account No:</span><strong className="font-mono">{viewingStudent.bankAccountNo || '—'}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Bank Name:</span><strong>{viewingStudent.bankName || '—'}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">IFSC Code:</span><strong className="font-mono">{viewingStudent.ifscCode || '—'}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Branch:</span><strong>{viewingStudent.bankBranch || '—'}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Phone:</span><strong>{viewingStudent.phone || '—'}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Date of Birth:</span><strong>{viewingStudent.dob || '—'}</strong></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handlePrintStudentSlip(viewingStudent)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setViewingStudent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* MODAL: EDIT STUDENT DETAILS                                       */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {editingStudent && (
        <ModalPortal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setEditingStudent(null)} />
            <div className="relative bg-white rounded-3xl shadow-2xl p-5 sm:p-7 w-full max-w-4xl z-10 border border-slate-200 animate-scaleUp overflow-y-auto max-h-[92vh] space-y-5 text-xs font-sans">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Edit Student Profile</span>
                    <span className="text-blue-600 font-mono text-sm">({editingStudent.name})</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Update complete student biodata, statutory documents, and academic particulars.
                  </p>
                </div>
                <button 
                  onClick={() => setEditingStudent(null)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sheet Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
                {[
                  { id: 'sheet1', label: '1. Core & Identity' },
                  { id: 'sheet2', label: '2. Family & Banking' },
                  { id: 'sheet3', label: '3. Academics & Medical' },
                  { id: 'sheet4', label: '4. Activities & Training' },
                  { id: 'sheet5', label: '5. Mentor & Monitoring' },
                  { id: 'fees', label: 'Fee Clearance' }
                ].map(tab => (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setEditModalTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                      editModalTab === tab.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleUpdateStudent} className="space-y-4">
                
                {/* ─────────────────────────────────────────────────────────── */}
                {/* TAB 1: SHEET 1 - CORE ACADEMIC & STATUTORY IDENTITY         */}
                {/* ─────────────────────────────────────────────────────────── */}
                {editModalTab === 'sheet1' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Student Full Name *</label>
                        <input
                          type="text"
                          required
                          name="name"
                          value={editingStudent.name || ''}
                          onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value.toUpperCase() })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold uppercase focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                          <span>Roll Number *</span>
                          <span className="text-[9px] text-purple-700 font-black uppercase">Login ID</span>
                        </label>
                        <input
                          type="text"
                          required
                          name="rollNo"
                          value={editingStudent.rollNo || ''}
                          onChange={(e) => setEditingStudent({ ...editingStudent, rollNo: e.target.value.toUpperCase() })}
                          className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 font-mono font-bold text-purple-800 uppercase focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                          <span>Date of Birth *</span>
                          <span className="text-[9px] text-emerald-600 font-black uppercase">Password</span>
                        </label>
                        <input
                          type="date"
                          required
                          name="dob"
                          value={editingStudent.dob || ''}
                          onChange={(e) => setEditingStudent({ ...editingStudent, dob: e.target.value })}
                          className="w-full bg-amber-50/80 border border-amber-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">University / Reg No.</label>
                        <input
                          type="text"
                          name="regNo"
                          value={editingStudent.regNo || ''}
                          onChange={(e) => setEditingStudent({ ...editingStudent, regNo: e.target.value.toUpperCase() })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold uppercase focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Degree / Course</label>
                        <input
                          type="text"
                          name="course"
                          value={editingStudent.course || ''}
                          onChange={(e) => setEditingStudent({ ...editingStudent, course: e.target.value.toUpperCase() })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold uppercase focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Department</label>
                        <input
                          type="text"
                          name="department"
                          value={editingStudent.department || ''}
                          onChange={handleEditChange}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Gender</label>
                        <select
                          name="gender"
                          value={editingStudent.gender || 'Male'}
                          onChange={handleEditChange}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold focus:outline-none"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Course Duration (From - To)</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            name="courseDurationFrom"
                            placeholder="2024"
                            value={editingStudent.courseDurationFrom || ''}
                            onChange={handleEditChange}
                            className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-center font-bold"
                          />
                          <span>-</span>
                          <input
                            type="text"
                            name="courseDurationTo"
                            placeholder="2027"
                            value={editingStudent.courseDurationTo || ''}
                            onChange={handleEditChange}
                            className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-center font-bold"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Year &amp; Semester</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <select
                            name="year"
                            value={editingStudent.year || '1st Year'}
                            onChange={handleEditChange}
                            className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 font-bold"
                          >
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                          </select>
                          <select
                            name="sem"
                            value={editingStudent.sem || '1st Sem'}
                            onChange={handleEditChange}
                            className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 font-bold"
                          >
                            <option value="1st Sem">1st Sem</option>
                            <option value="2nd Sem">2nd Sem</option>
                            <option value="3rd Sem">3rd Sem</option>
                            <option value="4th Sem">4th Sem</option>
                            <option value="5th Sem">5th Sem</option>
                            <option value="6th Sem">6th Sem</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Religion</label>
                        <input
                          type="text"
                          name="religion"
                          value={editingStudent.religion || 'Hindu'}
                          onChange={handleEditChange}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Caste</label>
                        <input
                          type="text"
                          name="caste"
                          value={editingStudent.caste || ''}
                          onChange={handleEditChange}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Community (Statutory)</label>
                      <div className="flex flex-wrap gap-1.5">
                        {COMMUNITY_OPTIONS.map(c => {
                          const isSel = (editingStudent.community || '').toUpperCase() === c.toUpperCase();
                          return (
                            <button
                              type="button"
                              key={c}
                              onClick={() => setEditingStudent({ ...editingStudent, community: c })}
                              className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                                isSel ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {c} {isSel ? '✓' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Community Cert No.</label>
                        <input
                          type="text"
                          name="communityCertNo"
                          value={editingStudent.communityCertNo || ''}
                          onChange={handleEditChange}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono uppercase"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">EMIS No.</label>
                        <input
                          type="text"
                          name="emisNumber"
                          value={editingStudent.emisNumber || ''}
                          onChange={handleEditChange}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">UMIS No.</label>
                        <input
                          type="text"
                          name="umisNumber"
                          value={editingStudent.umisNumber || ''}
                          onChange={handleEditChange}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Donation / Quota</label>
                        <input
                          type="text"
                          name="donation"
                          value={editingStudent.donation || 'Nil'}
                          onChange={handleEditChange}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Student Email</label>
                        <input
                          type="email"
                          name="email"
                          value={editingStudent.email || ''}
                          onChange={handleEditChange}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 lowercase"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Student Mobile</label>
                        <input
                          type="text"
                          name="phone"
                          value={editingStudent.phone || ''}
                          onChange={handleEditChange}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ─────────────────────────────────────────────────────────── */}
                {/* TAB 2: SHEET 2 - FAMILY PARTICULARS, BANKING & SIBLINGS     */}
                {/* ─────────────────────────────────────────────────────────── */}
                {editModalTab === 'sheet2' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                            <th className="p-2">Field</th>
                            <th className="p-2">Father</th>
                            <th className="p-2">Mother</th>
                            <th className="p-2">Guardian</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="p-2 font-bold text-slate-600">Name</td>
                            <td className="p-2">
                              <input
                                type="text"
                                name="fatherName"
                                value={editingStudent.fatherName || ''}
                                onChange={handleEditChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                name="motherName"
                                value={editingStudent.motherName || ''}
                                onChange={handleEditChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                name="guardianName"
                                value={editingStudent.guardianName || ''}
                                onChange={handleEditChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold text-slate-600">Qualification</td>
                            <td className="p-2">
                              <input
                                type="text"
                                name="fatherQualification"
                                value={editingStudent.fatherQualification || ''}
                                onChange={handleEditChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                name="motherQualification"
                                value={editingStudent.motherQualification || ''}
                                onChange={handleEditChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                name="guardianQualification"
                                value={editingStudent.guardianQualification || ''}
                                onChange={handleEditChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold text-slate-600">Occupation</td>
                            <td className="p-2">
                              <input
                                type="text"
                                name="fatherOccupation"
                                value={editingStudent.fatherOccupation || ''}
                                onChange={handleEditChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                name="motherOccupation"
                                value={editingStudent.motherOccupation || ''}
                                onChange={handleEditChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                name="guardianOccupation"
                                value={editingStudent.guardianOccupation || ''}
                                onChange={handleEditChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold text-slate-600">Mobile</td>
                            <td className="p-2">
                              <input
                                type="text"
                                name="fatherMobile"
                                value={editingStudent.fatherMobile || ''}
                                onChange={handleEditChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                name="motherMobile"
                                value={editingStudent.motherMobile || ''}
                                onChange={handleEditChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                name="guardianPhone"
                                value={editingStudent.guardianPhone || ''}
                                onChange={handleEditChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono"
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Present Address</label>
                        <textarea
                          rows={2}
                          name="presentAddress"
                          value={editingStudent.presentAddress || ''}
                          onChange={handleEditChange}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Permanent Address</label>
                        <textarea
                          rows={2}
                          name="permanentAddress"
                          value={editingStudent.permanentAddress || editingStudent.address || ''}
                          onChange={(e) => setEditingStudent({ ...editingStudent, permanentAddress: e.target.value, address: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Phone (Res)</label>
                        <input
                          type="text"
                          name="residencePhone"
                          value={editingStudent.residencePhone || ''}
                          onChange={handleEditChange}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Phone (Office)</label>
                        <input
                          type="text"
                          name="officePhone"
                          value={editingStudent.officePhone || ''}
                          onChange={handleEditChange}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Annual Income</label>
                        <input
                          type="text"
                          name="annualIncome"
                          value={editingStudent.annualIncome || ''}
                          onChange={handleEditChange}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Income Cert No.</label>
                        <input
                          type="text"
                          name="incomeCertNo"
                          value={editingStudent.incomeCertNo || ''}
                          onChange={handleEditChange}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Aadhaar Card No</label>
                        <input
                          type="text"
                          name="aadhaar"
                          value={editingStudent.aadhaar || ''}
                          onChange={handleEditChange}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">PAN Card No</label>
                        <input
                          type="text"
                          name="pan"
                          value={editingStudent.pan || ''}
                          onChange={(e) => setEditingStudent({ ...editingStudent, pan: e.target.value.toUpperCase() })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold uppercase"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Driving License</label>
                        <input
                          type="text"
                          name="drivingLicense"
                          value={editingStudent.drivingLicense || ''}
                          onChange={(e) => setEditingStudent({ ...editingStudent, drivingLicense: e.target.value.toUpperCase() })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono uppercase"
                        />
                      </div>
                    </div>

                    {/* Bank Details */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <span className="font-extrabold text-slate-800 text-xs block">Bank Account Particulars</span>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Bank Name</label>
                          <input
                            type="text"
                            name="bankName"
                            value={editingStudent.bankName || ''}
                            onChange={handleEditChange}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">A/c Number</label>
                          <input
                            type="text"
                            name="bankAccountNo"
                            value={editingStudent.bankAccountNo || ''}
                            onChange={handleEditChange}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">IFSC Code</label>
                          <input
                            type="text"
                            name="ifscCode"
                            value={editingStudent.ifscCode || ''}
                            onChange={(e) => setEditingStudent({ ...editingStudent, ifscCode: e.target.value.toUpperCase() })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Branch</label>
                          <input
                            type="text"
                            name="bankBranch"
                            value={editingStudent.bankBranch || ''}
                            onChange={handleEditChange}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">MICR No.</label>
                          <input
                            type="text"
                            name="micrNo"
                            value={editingStudent.micrNo || ''}
                            onChange={handleEditChange}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─────────────────────────────────────────────────────────── */}
                {/* TAB 3: SHEET 3 - ACADEMIC HISTORY, MEDICAL & TRANSPORT      */}
                {/* ─────────────────────────────────────────────────────────── */}
                {editModalTab === 'sheet3' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                            <th className="p-2">Exam</th>
                            <th className="p-2">Institution</th>
                            <th className="p-2">Year</th>
                            <th className="p-2">Board / University</th>
                            <th className="p-2">Marks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="p-2 font-bold text-slate-700">X Std</td>
                            <td className="p-2"><input type="text" name="tenthInstitution" value={editingStudent.tenthInstitution || ''} onChange={handleEditChange} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1" /></td>
                            <td className="p-2"><input type="text" name="tenthPassingYear" value={editingStudent.tenthPassingYear || ''} onChange={handleEditChange} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1" /></td>
                            <td className="p-2"><input type="text" name="tenthBoard" value={editingStudent.tenthBoard || ''} onChange={handleEditChange} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1" /></td>
                            <td className="p-2"><input type="text" name="tenthMarks" value={editingStudent.tenthMarks || ''} onChange={handleEditChange} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-bold" /></td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold text-slate-700">XII Std</td>
                            <td className="p-2"><input type="text" name="twelfthInstitution" value={editingStudent.twelfthInstitution || ''} onChange={handleEditChange} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1" /></td>
                            <td className="p-2"><input type="text" name="twelfthPassingYear" value={editingStudent.twelfthPassingYear || ''} onChange={handleEditChange} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1" /></td>
                            <td className="p-2"><input type="text" name="twelfthBoard" value={editingStudent.twelfthBoard || ''} onChange={handleEditChange} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1" /></td>
                            <td className="p-2"><input type="text" name="twelfthMarks" value={editingStudent.twelfthMarks || ''} onChange={handleEditChange} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-bold" /></td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold text-slate-700">Degree</td>
                            <td className="p-2"><input type="text" name="degreeInstitution" value={editingStudent.degreeInstitution || ''} onChange={handleEditChange} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1" /></td>
                            <td className="p-2"><input type="text" name="degreePassingYear" value={editingStudent.degreePassingYear || ''} onChange={handleEditChange} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1" /></td>
                            <td className="p-2"><input type="text" name="degreeBoard" value={editingStudent.degreeBoard || ''} onChange={handleEditChange} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1" /></td>
                            <td className="p-2"><input type="text" name="degreeMarks" value={editingStudent.degreeMarks || ''} onChange={handleEditChange} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-bold" /></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Medical Particulars */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <span className="font-extrabold text-slate-800 text-xs block">Medical Record</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Height (Cms)</label>
                          <input type="text" name="height" value={editingStudent.height || ''} onChange={handleEditChange} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Weight (Kgs)</label>
                          <input type="text" name="weight" value={editingStudent.weight || ''} onChange={handleEditChange} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Blood Group</label>
                          <select name="bloodGroup" value={editingStudent.bloodGroup || 'O+'} onChange={handleEditChange} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold">
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">ID Mark 1</label>
                          <input type="text" name="idMark1" value={editingStudent.idMark1 || ''} onChange={handleEditChange} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">ID Mark 2</label>
                          <input type="text" name="idMark2" value={editingStudent.idMark2 || ''} onChange={handleEditChange} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─────────────────────────────────────────────────────────── */}
                {/* TAB 4: SHEET 4 - ACTIVITIES, COUNSELLING & TRAINING         */}
                {/* ─────────────────────────────────────────────────────────── */}
                {editModalTab === 'sheet4' && (
                  <div className="space-y-3 animate-fadeIn">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Counselling &amp; Parent Interactions</label>
                      <textarea rows={2} name="counsellingNotes" value={editingStudent.counsellingNotes || ''} onChange={handleEditChange} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Co-Curricular Activities</label>
                      <textarea rows={2} name="coCurricularActivities" value={editingStudent.coCurricularActivities || ''} onChange={handleEditChange} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Value Added Courses Undergone</label>
                      <textarea rows={2} name="valueAddedCourses" value={editingStudent.valueAddedCourses || ''} onChange={handleEditChange} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Industrial Visit / In-Plan Training</label>
                      <textarea rows={2} name="industrialVisits" value={editingStudent.industrialVisits || ''} onChange={handleEditChange} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Disciplinary Actions Taken</label>
                      <textarea rows={2} name="disciplinaryActions" value={editingStudent.disciplinaryActions || ''} onChange={handleEditChange} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2" />
                    </div>
                  </div>
                )}

                {/* ─────────────────────────────────────────────────────────── */}
                {/* TAB 5: SHEET 5 - MENTOR & MONITORING SHEET                  */}
                {/* ─────────────────────────────────────────────────────────── */}
                {editModalTab === 'sheet5' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Name of the Mentor</label>
                        <input type="text" name="mentorName" value={editingStudent.mentorName || ''} onChange={handleEditChange} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Mentor Designation</label>
                        <input type="text" name="mentorDesignation" value={editingStudent.mentorDesignation || ''} onChange={handleEditChange} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Mentor Department</label>
                        <input type="text" name="mentorDepartment" value={editingStudent.mentorDepartment || ''} onChange={handleEditChange} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Total Working Hours</label>
                        <input type="text" name="totalWorkingHours" value={editingStudent.totalWorkingHours || '450'} onChange={handleEditChange} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Hours Absent</label>
                        <input type="text" name="hoursAbsent" value={editingStudent.hoursAbsent || '0'} onChange={handleEditChange} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Attendance Percentage (%)</label>
                        <input type="number" name="attendance" min="0" max="100" value={editingStudent.attendance || 85} onChange={handleEditChange} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-blue-700" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Total Arrears till Last Sem</label>
                        <input type="text" name="totalArrearsTillLastSem" value={editingStudent.totalArrearsTillLastSem || '0'} onChange={handleEditChange} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Arrears Cleared in this Sem</label>
                        <input type="text" name="arrearsClearedThisSem" value={editingStudent.arrearsClearedThisSem || '0'} onChange={handleEditChange} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Arrears Yet to be Cleared</label>
                        <input type="text" name="arrearsYetToBeCleared" value={editingStudent.arrearsYetToBeCleared || '0'} onChange={handleEditChange} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-rose-600" />
                      </div>
                    </div>
                  </div>
                )}

                {/* ─────────────────────────────────────────────────────────── */}
                {/* TAB 6: FEE CLEARANCE (ACCOUNTANT ONLY)                      */}
                {/* ─────────────────────────────────────────────────────────── */}
                {editModalTab === 'fees' && (
                  <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-amber-600" />
                        Fee Status &amp; Clearance Verification
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${isAccountant ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'}`}>
                        {isAccountant ? 'Accountant Mode (Editable)' : 'Locked for Teaching Staff'}
                      </span>
                    </div>

                    {isAccountant ? (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Fee Clearance Status</label>
                        <select
                          value={editingStudent.feeStatus || 'Pending'}
                          onChange={(e) => setEditingStudent({ ...editingStudent, feeStatus: e.target.value })}
                          className="w-full sm:w-64 bg-white border border-amber-300 rounded-xl px-3 py-2 font-bold focus:outline-none"
                        >
                          <option value="Pending">Pending (Due)</option>
                          <option value="Paid">Paid (No Due)</option>
                        </select>
                        <p className="text-[11px] text-amber-800 font-medium mt-1">
                          As an Accountant, you can update this student's fee clearance status.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-200">
                        <div>
                          <span className="text-slate-500 font-bold block text-[11px]">Current Fee Status:</span>
                          <strong className={`text-sm ${(editingStudent.feeStatus || 'Pending').toLowerCase() === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {editingStudent.feeStatus || 'Pending'}
                          </strong>
                        </div>
                        <span className="text-[11px] text-slate-500 font-semibold italic text-right">
                          🔒 Fee status must be updated only by the Accountant.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
