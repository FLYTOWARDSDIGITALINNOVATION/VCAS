import React, { useState, useEffect, useRef } from 'react';
import { BACKEND_URL } from '../apiConfig';
import CollegeLogo, { getCollegeLogoHtml } from './CollegeLogo';
import {
  LayoutDashboard,
  User,
  BookOpen,
  Calendar,
  CheckSquare,
  Award,
  CreditCard,
  Building2,
  FileText,
  Printer,
  Download,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Lock,
  Layers,
  FileCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Ticket,
  BookMarked,
  FileSpreadsheet,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  IdCard,
  IndianRupee,
  GraduationCap,
  Search,
  Upload,
  FileUp,
  Send,
  Check,
  RefreshCw,
  FolderOpen,
  ExternalLink
} from 'lucide-react';

const API_BASE = BACKEND_URL;

const NAV_SECTIONS = [
  {
    title: 'MAIN',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'ACADEMIC',
    items: [
      { name: 'Student Information', icon: User },
      { name: 'Attendance', icon: CheckSquare },
      { name: 'Internal Marks', icon: FileSpreadsheet },
      { name: 'Timetable', icon: Calendar },
      { name: 'Assignments', icon: BookMarked }
    ]
  },
  {
    title: 'EXAMINATION & SLIPS',
    items: [
      { name: 'Student Slip', icon: FileText },
      { name: 'Hall Ticket', icon: Ticket }
    ]
  }
];

export default function StudentDashboard({ student, onLogout }) {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('vcas_sidebar_collapsed') === 'true';
  });
  const [hoveredTooltip, setHoveredTooltip] = useState(null);
  const activeTooltipRef = useRef(null);

  const showTooltipFor = (name, targetElement, allowInExpanded = false) => {
    if ((!sidebarCollapsed && !allowInExpanded) || !targetElement) {
      setHoveredTooltip(null);
      return;
    }
    const button = targetElement.tagName === 'BUTTON' 
      ? targetElement 
      : (targetElement.querySelector('button') || targetElement);
    
    const rect = button.getBoundingClientRect();
    if (rect.bottom < 30 || rect.top > window.innerHeight - 30) {
      setHoveredTooltip(null);
      return;
    }

    activeTooltipRef.current = { name, button, allowInExpanded };
    setHoveredTooltip({
      name,
      top: rect.top + rect.height / 2,
      left: Math.max(rect.right + 12, 88)
    });
  };

  const hideTooltip = () => {
    activeTooltipRef.current = null;
    setHoveredTooltip(null);
  };

  useEffect(() => {
    const handleScroll = () => {
      // During active scroll, immediately hide tooltip so scrolling stays 100% fluid and never drops frames
      activeTooltipRef.current = null;
      setHoveredTooltip(null);
    };

    const handleResize = () => {
      activeTooltipRef.current = null;
      setHoveredTooltip(null);
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('vcas_sidebar_collapsed', sidebarCollapsed ? 'true' : 'false');
  }, [sidebarCollapsed]);
  const [showPassword, setShowPassword] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attSummary, setAttSummary] = useState({ totalClasses: 0, present: 0, absent: 0, late: 0, percentage: 85, subjectBreakdown: [] });
  const [marksData, setMarksData] = useState([]);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [liveTimetable, setLiveTimetable] = useState({});
  const [allocatedHall, setAllocatedHall] = useState('Exam Hall 101');
  const [allocatedSeat, setAllocatedSeat] = useState('A1');
  const [hallTicketInfo, setHallTicketInfo] = useState(null);
  const [hallTicketSubjects, setHallTicketSubjects] = useState([]);
  const [hallTicketInstructions, setHallTicketInstructions] = useState([]);
  const [allocatedStaffName, setAllocatedStaffName] = useState('Chief Superintendent');
  const [liveExams, setLiveExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(() => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = dayNames[new Date().getDay()];
    return (today === 'Sunday' || today === 'Saturday') ? 'Monday' : today;
  });
  const [submittedAssignmentIds, setSubmittedAssignmentIds] = useState(new Set());
  const [assignmentFilter, setAssignmentFilter] = useState('ALL');
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [submissionFile, setSubmissionFile] = useState('');
  const [submissionComment, setSubmissionComment] = useState('');
  const [selectedFileObj, setSelectedFileObj] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState('');
  const [uploadedFileType, setUploadedFileType] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Student fields with safe defaults
  const regNo = student?.regNo || student?.studentId || student?.id || 'REG2026001';
  const rollNo = student?.rollNo || '—';
  const year = student?.year || '1st Year';
  const loginId = student?.loginId || regNo;
  const name = student?.name || student?.fullName || 'Student Name';
  const dob = student?.dob || '—';
  const department = student?.department || student?.course || 'Computer Science';
  const course = student?.course || 'B.Sc. COMPUTER SCIENCE';
  const sem = student?.sem || student?.semester || '1st Sem';
  const status = student?.status || 'Active';
  const fallbackAttendance = student?.attendance !== undefined ? student.attendance : 85;
  const attendance = attSummary.totalClasses > 0 ? attSummary.percentage : fallbackAttendance;
  const feeStatus = student?.feeStatus || 'Paid';

  // Detailed student statutory & demographic information
  const aadhaar = student?.aadhaar || '—';
  const pan = student?.pan || '—';
  const bankAccountNo = student?.bankAccountNo || '—';
  const bankName = student?.bankName || '—';
  const ifscCode = student?.ifscCode || '—';
  const bankBranch = student?.bankBranch || '—';
  const drivingLicense = student?.drivingLicense || '—';
  const emisNumber = student?.emisNumber || '—';
  const tenthMarks = student?.tenthMarks || student?.tenthPercentage ? `${student?.tenthMarks || ''} (${student?.tenthPercentage || ''}%)` : (student?.doc10th || '—');
  const twelfthMarks = student?.twelfthMarks || student?.twelfthPercentage ? `${student?.twelfthMarks || ''} (${student?.twelfthPercentage || ''}%)` : (student?.doc12th || '—');
  const nationality = student?.nationality || 'INDIAN';
  const caste = student?.caste || student?.casteCommunity || '—';
  const religion = student?.religion || 'HINDU';
  const donation = student?.donation || '0';
  const phone = student?.phone || student?.mobile || '—';
  const email = student?.email || '—';
  const address = student?.address || '—';

  // Fetch all student details live from staff side: Attendance, Marks, Timetable, Assignments
  const fetchAllStudentData = () => {
    setLoading(true);
    const idToFetch = (rollNo && rollNo !== '—') ? rollNo : regNo;

    Promise.all([
      // 1. Live Attendance marked by Staff
      fetch(`${API_BASE}/api/attendance/student/${encodeURIComponent(idToFetch)}`)
        .then(r => r.json())
        .catch(() => null),

      // 2. Live Internal Marks entered by Staff
      fetch(`${API_BASE}/api/internal-marks/student/${encodeURIComponent(idToFetch)}`)
        .then(r => r.json())
        .catch(() => null),

      // 3. Live Assignments created by Staff
      fetch(`${API_BASE}/api/assignments/student/${encodeURIComponent(idToFetch)}`)
        .then(r => r.json())
        .catch(() => null),

      // 4. Live Timetable configured by Staff
      fetch(`${API_BASE}/api/timetable/student/${encodeURIComponent(idToFetch)}`)
        .then(r => r.json())
        .catch(() => null),

      // 5. Real Hall Ticket allocated by Staff
      fetch(`${API_BASE}/api/hall-tickets/student/${encodeURIComponent(idToFetch)}`)
        .then(r => r.json())
        .catch(() => null),

      // 6. Live Exams
      fetch(`${API_BASE}/api/exams`)
        .then(r => r.json())
        .catch(() => null)
    ]).then(([attRes, marksRes, assignRes, ttRes, htRes, exRes]) => {
      // 1. Process Attendance
      if (attRes && attRes.success) {
        setAttendanceData(attRes.history || []);
        setAttSummary({
          totalClasses: attRes.totalClasses || 0,
          present: attRes.present || 0,
          absent: attRes.absent || 0,
          late: attRes.late || 0,
          percentage: attRes.percentage !== undefined ? attRes.percentage : fallbackAttendance,
          subjectBreakdown: attRes.subjectBreakdown || []
        });
      }

      // 2. Process Internal Marks
      if (marksRes && marksRes.success && Array.isArray(marksRes.marksheets)) {
        setMarksData(marksRes.marksheets);
      }

      // 3. Process Assignments
      if (assignRes && assignRes.success && Array.isArray(assignRes.assignments)) {
        setAssignmentsList(assignRes.assignments);
      }

      // 4. Process Timetable
      if (ttRes && ttRes.success && ttRes.schedule) {
        setLiveTimetable(ttRes.schedule);
      }

      // 5. Process Real Hall Ticket Data from Staff
      if (htRes && htRes.success && htRes.data) {
        const d = htRes.data;
        setHallTicketInfo(d);
        if (d.allocated && d.allocatedHall) {
          setAllocatedHall(d.allocatedHall);
          setAllocatedSeat(d.allocatedSeat);
        } else {
          setAllocatedHall('Unassigned');
          setAllocatedSeat('TBA');
        }
        if (d.allocatedByStaffName) setAllocatedStaffName(d.allocatedByStaffName);
        if (d.allocated && Array.isArray(d.subjects) && d.subjects.length > 0) {
          setHallTicketSubjects(d.subjects.map(s => ({
            date: s.date || 'TBA',
            session: s.session ? `${s.session} (${s.time || '09:30 AM - 12:30 PM'})` : (s.time || '09:30 AM - 12:30 PM'),
            code: s.code,
            subject: s.name,
            hall: d.allocatedHall || 'Hall TBA'
          })));
        } else {
          setHallTicketSubjects([]);
        }
        if (Array.isArray(d.instructions) && d.instructions.length > 0) {
          setHallTicketInstructions(d.instructions);
        }
      } else {
        setHallTicketInfo(null);
        setAllocatedHall('Unassigned');
        setAllocatedSeat('TBA');
        setHallTicketSubjects([]);
      }

      // 6. Process Live Exams
      if (exRes && exRes.success && Array.isArray(exRes.exams) && exRes.exams.length > 0) {
        setLiveExams(exRes.exams);
      }

      setLoading(false);
    }).catch(err => {
      console.error('Error fetching live student data:', err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAllStudentData();
  }, [rollNo, regNo]);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Handle student assignment submission
  const handleOpenSubmitModal = (assignment) => {
    setSubmittingAssignment(assignment);
    const subCode = assignment.subjectCode || assignment.code || 'ASG';
    const idToUse = (rollNo && rollNo !== '—') ? rollNo : regNo;
    setSubmissionFile(`${idToUse}_${subCode}_Submission.pdf`);
    setSelectedFileObj(null);
    setFileBase64('');
    setUploadedFileSize('');
    setUploadedFileType('');
    setSubmissionComment('');
  };

  const handleSelectedFile = (file) => {
    if (!file) return;
    // Limit to 25MB
    if (file.size > 25 * 1024 * 1024) {
      alert('Selected file exceeds 25MB limit. Please upload a smaller document.');
      return;
    }
    setSelectedFileObj(file);
    setSubmissionFile(file.name);
    const sizeStr = formatBytes(file.size);
    setUploadedFileSize(sizeStr);
    setUploadedFileType(file.type || 'application/octet-stream');

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result);
    };
    reader.onerror = () => {
      alert('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitAssignmentSolution = async (e) => {
    e.preventDefault();
    if (!submittingAssignment) return;
    setIsSubmitting(true);

    try {
      const idToUse = (rollNo && rollNo !== '—') ? rollNo : regNo;
      const targetId = submittingAssignment._id || submittingAssignment.id;
      const finalFileName = submissionFile || (selectedFileObj ? selectedFileObj.name : 'submission_file.pdf');
      const finalFileSize = uploadedFileSize || (selectedFileObj ? formatBytes(selectedFileObj.size) : '1.2 MB');

      const res = await fetch(`${API_BASE}/api/assignments/${targetId}/student/${encodeURIComponent(idToUse)}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: finalFileName,
          fileSize: finalFileSize,
          fileData: fileBase64 || '',
          fileType: uploadedFileType || selectedFileObj?.type || '',
          comment: submissionComment,
          studentName: name
        })
      });
      const data = await res.json();
      if (data.success) {
        setAssignmentsList(prev => prev.map(a => {
          if ((a._id && a._id === targetId) || (a.id && a.id === targetId)) {
            return {
              ...a,
              submissionStatus: 'Submitted',
              submittedAt: new Date().toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
              fileName: finalFileName,
              fileSize: finalFileSize,
              fileData: fileBase64 || a.fileData,
              fileType: uploadedFileType || a.fileType
            };
          }
          return a;
        }));
        setSubmittedAssignmentIds(prev => new Set([...prev, targetId]));
        setToastMsg(`Assignment "${submittingAssignment.title}" submitted successfully!`);
        setTimeout(() => setToastMsg(''), 4000);
        setSubmittingAssignment(null);
      } else {
        alert(data.message || 'Failed to submit assignment.');
      }
    } catch (err) {
      alert('Error submitting solution: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Print Student Slip Handler
  const handlePrintStudentSlip = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) {
      alert('Please allow popups to print your Student Slip.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Slip - ${name} (${regNo})</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 12px; }
          .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 16px; position: relative; }
          .logo-bar { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 8px; }
          .title { font-size: 18px; font-weight: 900; color: #0f1e3c; text-transform: uppercase; letter-spacing: 0.5px; }
          .sub { font-size: 11px; color: #475569; font-weight: 600; margin-top: 2px; }
          .badge { display: inline-block; background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 800; padding: 3px 12px; border-radius: 9999px; margin-top: 6px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
          .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #ffffff; }
          .box-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 4px 6px; font-size: 11.5px; vertical-align: top; }
          td.lbl { width: 42%; font-weight: 600; color: #64748b; }
          td.val { width: 58%; font-weight: 700; color: #0f172a; }
          .auth-box { background: #faf5ff; border: 1px dashed #9333ea; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
          .auth-title { font-size: 11px; font-weight: 800; color: #7e22ce; text-transform: uppercase; margin-bottom: 6px; }
          .auth-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 11px; }
          .auth-item span { display: block; font-size: 9.5px; font-weight: 700; color: #6b21a8; }
          .auth-item strong { font-family: monospace; font-size: 13px; color: #0f172a; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 20px; font-size: 11px; font-weight: 700; }
          .footer { text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8; margin-top: 25px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-bar">
            ${getCollegeLogoHtml(48)}
            <div>
              <div class="title">Vivekananda College of Arts & Science</div>
              <div class="sub">Affiliated with Manonmaniam Sundaranar University • Vellalankulam</div>
            </div>
          </div>
          <div class="badge">Official Student Slip & Academic Pass</div>
        </div>

        <div class="auth-box">
          <div class="auth-title">Student Authentication & Portal Pass</div>
          <div class="auth-grid">
            <div class="auth-item">
              <span>REGISTER NUMBER (REG NO)</span>
              <strong>${regNo}</strong>
            </div>
            <div class="auth-item">
              <span>LOGIN ID</span>
              <strong>${loginId}</strong>
            </div>
            <div class="auth-item">
              <span>PASSWORD (DATE OF BIRTH)</span>
              <strong>${dob}</strong>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="box">
            <div class="box-title">1. Academic Particulars</div>
            <table>
              <tr><td class="lbl">Student Name</td><td class="val">${name}</td></tr>
              <tr><td class="lbl">Reg No</td><td class="val">${regNo}</td></tr>
              <tr><td class="lbl">Roll Number</td><td class="val">${rollNo}</td></tr>
              <tr><td class="lbl">Year of Study</td><td class="val">${year}</td></tr>
              <tr><td class="lbl">Course / Degree</td><td class="val">${course}</td></tr>
              <tr><td class="lbl">Department</td><td class="val">${department}</td></tr>
              <tr><td class="lbl">Semester</td><td class="val">${sem}</td></tr>
              <tr><td class="lbl">Status</td><td class="val">${status}</td></tr>
            </table>
          </div>

          <div class="box">
            <div class="box-title">2. Personal & Statutory Particulars</div>
            <table>
              <tr><td class="lbl">Date of Birth (DOB)</td><td class="val">${dob}</td></tr>
              <tr><td class="lbl">Aadhaar Number</td><td class="val">${aadhaar}</td></tr>
              <tr><td class="lbl">PAN Number</td><td class="val">${pan}</td></tr>
              <tr><td class="lbl">EMIS Number</td><td class="val">${emisNumber}</td></tr>
              <tr><td class="lbl">Driving License</td><td class="val">${drivingLicense}</td></tr>
              <tr><td class="lbl">Nationality</td><td class="val">${nationality}</td></tr>
              <tr><td class="lbl">Religion / Caste</td><td class="val">${religion} / ${caste}</td></tr>
              <tr><td class="lbl">Donation Status</td><td class="val">${donation}</td></tr>
            </table>
          </div>
        </div>

        <div class="grid-2">
          <div class="box">
            <div class="box-title">3. Bank Account Details</div>
            <table>
              <tr><td class="lbl">Bank Name</td><td class="val">${bankName}</td></tr>
              <tr><td class="lbl">Account Number</td><td class="val">${bankAccountNo}</td></tr>
              <tr><td class="lbl">IFSC Code</td><td class="val">${ifscCode}</td></tr>
              <tr><td class="lbl">Branch</td><td class="val">${bankBranch}</td></tr>
            </table>
          </div>

          <div class="box">
            <div class="box-title">4. Prior Qualifications & Contact</div>
            <table>
              <tr><td class="lbl">10th Std Marks</td><td class="val">${tenthMarks}</td></tr>
              <tr><td class="lbl">12th Std Marks</td><td class="val">${twelfthMarks}</td></tr>
              <tr><td class="lbl">Mobile</td><td class="val">${phone}</td></tr>
              <tr><td class="lbl">Email</td><td class="val">${email}</td></tr>
            </table>
          </div>
        </div>

        <div class="signatures">
          <div>Verified: Academic Cell</div>
          <div>Controller of Examinations</div>
        </div>

        <div class="footer">
          Official Student Slip issued by VCAS. Keep this credential pass confidential.
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

  const handleDownloadStudentSlip = () => {
    const text = `
================================================================================
VIVEKANANDA COLLEGE OF ARTS & SCIENCE
(AFFILIATED TO MANONMANIAM SUNDARANAR UNIVERSITY)
OFFICIAL STUDENT CREDENTIAL SLIP & RECORD PASS
================================================================================

PORTAL AUTHENTICATION DETAILS:
  Register Number (Reg No) : ${regNo}
  Roll Number              : ${rollNo}
  Year of Study            : ${year}
  Login ID                 : ${loginId}
  Password (Date of Birth) : ${dob}

ACADEMIC PARTICULARS:
  Student Name             : ${name}
  Course / Degree          : ${course}
  Department               : ${department}
  Current Semester         : ${sem}
  Enrollment Status        : ${status}

STUDENT INFORMATION & IDENTITY:
  Date of Birth (DOB)      : ${dob}
  Aadhaar Number           : ${aadhaar}
  PAN Number               : ${pan}
  EMIS Number              : ${emisNumber}
  Driving License          : ${drivingLicense}
  Nationality              : ${nationality}
  Caste                    : ${caste}
  Religion                 : ${religion}
  Donation                 : ${donation}

ACADEMIC QUALIFICATIONS:
  10th Std Record          : ${tenthMarks}
  12th Std Record          : ${twelfthMarks}

BANK ACCOUNT DETAILS:
  Bank Name                : ${bankName}
  Account Number           : ${bankAccountNo}
  IFSC Code                : ${ifscCode}
  Branch                   : ${bankBranch}

CONTACT:
  Mobile                   : ${phone}
  Email                    : ${email}
================================================================================
    `.trim();

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Student_Slip_${regNo}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print Hall Ticket Handler matching physical Vivekananda College Hall Ticket
  const handlePrintHallTicket = () => {
    const printWindow = window.open('', '_blank', 'width=950,height=950');
    if (!printWindow) {
      alert('Please allow popups to view and print your Hall Ticket.');
      return;
    }

    const toRoman = (num) => {
      const map = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII' };
      return map[Number(num)] || (num ? String(num).toUpperCase() : 'I');
    };
    const semNum = Number(sem?.replace(/\D/g, '')) || 1;
    const yearRoman = toRoman(Math.ceil(semNum / 2));
    const semRoman = toRoman(semNum);

    const rows = (activeExamTimetable || []).map((e, idx) => `
      <tr>
        <td style="text-align: center; font-weight: 700; border: 1px solid #000; padding: 6px 4px;">${idx + 1}</td>
        <td style="text-align: center; font-weight: 700; border: 1px solid #000; padding: 6px 4px;">${e.date || '21.10.26'}</td>
        <td style="text-align: center; font-weight: 700; border: 1px solid #000; padding: 6px 4px;">${String(e.session || 'FN').toUpperCase().includes('AN') ? 'AN' : 'FN'}</td>
        <td style="text-align: left; font-weight: 700; border: 1px solid #000; padding: 6px 8px; text-transform: uppercase;">${e.subject}</td>
        <td style="text-align: center; font-weight: 700; border: 1px solid #000; padding: 6px 4px;">${e.code || ''}</td>
        <td style="text-align: center; border: 1px solid #000; padding: 6px 4px; height: 32px;"></td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hall Ticket - ${name} (${regNo})</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: "Times New Roman", Times, Georgia, serif; }
          body { background: #f8fafc; padding: 20px; color: #000; }
          .hall-ticket-container {
            width: 195mm;
            margin: 0 auto;
            background: #ffffff;
            padding: 8px;
          }
          .hall-ticket-border {
            border: 1.5px solid #000000;
            padding: 12px 16px 24px 16px;
          }
          @media print {
            body { background: white; padding: 0; margin: 0; }
            .hall-ticket-container {
              width: 100%;
              max-width: 190mm;
              margin: 0 auto;
              padding: 6mm 4mm;
            }
          }
          .header-wrap {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            position: relative;
          }
          .logo-wrap {
            width: 65px;
            text-align: left;
            flex-shrink: 0;
          }
          .college-logo {
            width: 58px;
            height: 58px;
            object-fit: contain;
          }
          .title-wrap {
            flex: 1;
            text-align: center;
            padding-right: 65px;
          }
          .college-name {
            font-size: 16px;
            font-weight: 900;
            color: #000;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            line-height: 1.2;
          }
          .college-loc {
            font-size: 11.5px;
            font-weight: 600;
            color: #111;
            margin-top: 1px;
          }
          .college-contact {
            font-size: 9px;
            font-weight: 700;
            color: #222;
            margin-top: 2px;
          }
          .exam-title {
            font-size: 12px;
            font-weight: 900;
            color: #000;
            text-transform: uppercase;
            margin-top: 6px;
            letter-spacing: 0.3px;
          }
          .ticket-badge {
            font-size: 13px;
            font-weight: 900;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-top: 3px;
            text-decoration: underline;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #000;
            margin: 10px 0 6px 0;
            padding: 0 4px;
          }
          .student-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            margin-bottom: 8px;
          }
          .student-table td {
            padding: 5px 8px;
            font-size: 11.5px;
            border: 1px solid #000;
          }
          .st-lbl {
            width: 22%;
            font-weight: 700;
            color: #000;
            white-space: nowrap;
          }
          .st-val {
            width: 78%;
            font-weight: 700;
            color: #000;
          }
          .tt-heading {
            text-align: center;
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-decoration: underline;
            margin: 6px 0 4px 0;
          }
          .schedule-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            margin-bottom: 30px;
          }
          .schedule-table th {
            border: 1px solid #000;
            padding: 4px 4px;
            font-size: 10.5px;
            font-weight: 900;
            text-align: center;
            color: #000;
            background: #fafafa;
          }
          .schedule-table td {
            border: 1px solid #000;
            padding: 6px 6px;
            font-size: 10.5px;
            color: #000;
            height: 28px;
          }
          .signatures-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 0 16px;
            margin-top: 45px;
          }
          .sig-col {
            text-align: center;
            font-size: 11.5px;
            font-weight: 800;
            color: #000;
            min-width: 70px;
          }
        </style>
      </head>
      <body>
        <div class="hall-ticket-container">
          <div class="hall-ticket-border">
            <!-- Header Section -->
            <div class="header-wrap">
              <div class="logo-wrap">
                <img src="/vcas-logo.png" class="college-logo" alt="Crest Logo" />
              </div>
              <div class="title-wrap">
                <div class="college-name">VIVEKANANDA COLLEGE OF ARTS AND SCIENCE</div>
                <div class="college-loc">Vellalankulam, Tenkasi Dist</div>
                <div class="college-contact">PHONE: 04636298128, 7094462393, 7094462394 &nbsp;&nbsp; EMAIL: vivekanandacas@gmail.com</div>
                <div class="exam-title">${(hallTicketInfo?.examName || 'MODEL SEMESTER EXAMINATION - NOVEMBER 2026').toUpperCase()}</div>
                <div class="ticket-badge">HALL TICKET</div>
              </div>
            </div>

            <!-- Dept / Year / Semester Meta Row -->
            <div class="meta-row">
              <div><strong>DEPARTMENT:</strong> ${(department || 'CFS').toUpperCase()}</div>
              <div><strong>YEAR:</strong> ${yearRoman}</div>
              <div><strong>SEMESTER:</strong> ${semRoman}</div>
            </div>

            <!-- Student Particulars Table -->
            <table class="student-table">
              <tr>
                <td class="st-lbl">Student Name:</td>
                <td class="st-val">${(name || '').toUpperCase()}</td>
              </tr>
              <tr>
                <td class="st-lbl">Register No :</td>
                <td class="st-val font-bold">${regNo || rollNo || ''}</td>
              </tr>
            </table>

            <!-- Time Table Title -->
            <div class="tt-heading">TIME TABLE</div>

            <!-- Time Table Schedule -->
            <table class="schedule-table">
              <thead>
                <tr>
                  <th style="width: 5%;">NO</th>
                  <th style="width: 17%;">DATE</th>
                  <th style="width: 10%;">FN<br/>AN</th>
                  <th style="width: 44%;">SUBJECT</th>
                  <th style="width: 14%;">Sub. Code</th>
                  <th style="width: 10%;">Sign</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <!-- Signatures Row -->
            <div class="signatures-row">
              <div class="sig-col">Office</div>
              <div class="sig-col">HOD</div>
              <div class="sig-col">Principal</div>
              <div class="sig-col">MD</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // 5 Hours Timetable Structure:
  // Periods 1, 2 -> Morning Break -> Period 3 -> Lunch Break -> Periods 4, 5
  const DEFAULT_WEEKLY_TIMETABLE = {
    'Monday': [
      { slot: 1, time: '09:30 – 10:30 AM', code: 'CS301', subject: 'Data Structures & Algorithms', faculty: 'Dr. K. Ramesh', room: 'LH-102', type: 'theory', color: 'blue' },
      { slot: 2, time: '10:30 – 11:30 AM', code: 'CS302', subject: 'Database Management Systems', faculty: 'Prof. M. Priya', room: 'LH-102', type: 'theory', color: 'indigo' },
      { slot: 3, time: '11:45 AM – 12:45 PM', code: 'MAT201', subject: 'Discrete Mathematics', faculty: 'Dr. S. Anand', room: 'LH-102', type: 'theory', color: 'purple' },
      { slot: 4, time: '01:30 – 02:30 PM', code: 'CS303L', subject: 'Data Structures Lab', faculty: 'Dr. K. Ramesh', room: 'CS Lab 2', type: 'lab', color: 'emerald' },
      { slot: 5, time: '02:30 – 03:30 PM', code: 'ENG102', subject: 'Professional Communication', faculty: 'Mrs. L. Vani', room: 'LH-102', type: 'theory', color: 'amber' }
    ],
    'Tuesday': [
      { slot: 1, time: '09:30 – 10:30 AM', code: 'CS304', subject: 'Operating Systems & Architecture', faculty: 'Dr. R. Suresh', room: 'LH-102', type: 'theory', color: 'rose' },
      { slot: 2, time: '10:30 – 11:30 AM', code: 'CS301', subject: 'Data Structures & Algorithms', faculty: 'Dr. K. Ramesh', room: 'LH-102', type: 'theory', color: 'blue' },
      { slot: 3, time: '11:45 AM – 12:45 PM', code: 'CS302', subject: 'Database Management Systems', faculty: 'Prof. M. Priya', room: 'LH-102', type: 'theory', color: 'indigo' },
      { slot: 4, time: '01:30 – 02:30 PM', code: 'CS305L', subject: 'RDBMS & SQL Lab', faculty: 'Prof. M. Priya', room: 'CS Lab 1', type: 'lab', color: 'emerald' },
      { slot: 5, time: '02:30 – 03:30 PM', code: 'EVS101', subject: 'Environmental Studies', faculty: 'Dr. G. Lakshmi', room: 'LH-102', type: 'theory', color: 'amber' }
    ],
    'Wednesday': [
      { slot: 1, time: '09:30 – 10:30 AM', code: 'MAT201', subject: 'Discrete Mathematics', faculty: 'Dr. S. Anand', room: 'LH-102', type: 'theory', color: 'purple' },
      { slot: 2, time: '10:30 – 11:30 AM', code: 'CS304', subject: 'Operating Systems & Architecture', faculty: 'Dr. R. Suresh', room: 'LH-102', type: 'theory', color: 'rose' },
      { slot: 3, time: '11:45 AM – 12:45 PM', code: 'CS306', subject: 'Web Technology & Design', faculty: 'Mr. P. Vijay', room: 'LH-102', type: 'theory', color: 'indigo' },
      { slot: 4, time: '01:30 – 02:30 PM', code: 'CS301', subject: 'Data Structures & Algorithms', faculty: 'Dr. K. Ramesh', room: 'LH-102', type: 'theory', color: 'blue' },
      { slot: 5, time: '02:30 – 03:30 PM', code: 'LIB101', subject: 'Library & Research Hour', faculty: 'Librarian', room: 'Central Library', type: 'theory', color: 'amber' }
    ],
    'Thursday': [
      { slot: 1, time: '09:30 – 10:30 AM', code: 'CS306', subject: 'Web Technology & Design', faculty: 'Mr. P. Vijay', room: 'LH-102', type: 'theory', color: 'indigo' },
      { slot: 2, time: '10:30 – 11:30 AM', code: 'MAT201', subject: 'Discrete Mathematics', faculty: 'Dr. S. Anand', room: 'LH-102', type: 'theory', color: 'purple' },
      { slot: 3, time: '11:45 AM – 12:45 PM', code: 'CS304', subject: 'Operating Systems & Architecture', faculty: 'Dr. R. Suresh', room: 'LH-102', type: 'theory', color: 'rose' },
      { slot: 4, time: '01:30 – 02:30 PM', code: 'CS307L', subject: 'Web Development Lab', faculty: 'Mr. P. Vijay', room: 'CS Lab 3', type: 'lab', color: 'emerald' },
      { slot: 5, time: '02:30 – 03:30 PM', code: 'SEM101', subject: 'Student Seminar & Presentation', faculty: 'Dr. K. Ramesh', room: 'LH-102', type: 'theory', color: 'amber' }
    ],
    'Friday': [
      { slot: 1, time: '09:30 – 10:30 AM', code: 'CS301', subject: 'Data Structures & Algorithms', faculty: 'Dr. K. Ramesh', room: 'LH-102', type: 'theory', color: 'blue' },
      { slot: 2, time: '10:30 – 11:30 AM', code: 'CS302', subject: 'Database Management Systems', faculty: 'Prof. M. Priya', room: 'LH-102', type: 'theory', color: 'indigo' },
      { slot: 3, time: '11:45 AM – 12:45 PM', code: 'CS306', subject: 'Web Technology & Design', faculty: 'Mr. P. Vijay', room: 'LH-102', type: 'theory', color: 'indigo' },
      { slot: 4, time: '01:30 – 02:30 PM', code: 'CS304', subject: 'Operating Systems & Architecture', faculty: 'Dr. R. Suresh', room: 'LH-102', type: 'theory', color: 'rose' },
      { slot: 5, time: '02:30 – 03:30 PM', code: 'MAT201', subject: 'Discrete Mathematics', faculty: 'Dr. S. Anand', room: 'LH-102', type: 'theory', color: 'purple' }
    ],
    'Saturday': [
      { slot: 1, time: '09:30 – 10:30 AM', code: 'CS308', subject: 'Cloud Computing & DevOps', faculty: 'Dr. K. Ramesh', room: 'LH-102', type: 'theory', color: 'blue' },
      { slot: 2, time: '10:30 – 11:30 AM', code: 'CS309', subject: 'Technical Soft Skills & Aptitude', faculty: 'Mrs. L. Vani', room: 'LH-102', type: 'theory', color: 'amber' },
      { slot: 3, time: '11:45 AM – 12:45 PM', code: 'CS310', subject: 'Mentorship & Project Lab', faculty: 'Dr. R. Suresh', room: 'CS Lab 1', type: 'lab', color: 'emerald' },
      { slot: 4, time: '01:30 – 02:30 PM', code: 'SPO101', subject: 'Physical Education / Sports', faculty: 'Director of PE', room: 'Sports Ground', type: 'theory', color: 'emerald' },
      { slot: 5, time: '02:30 – 03:30 PM', code: 'LIB102', subject: 'Digital Library & Self-Study', faculty: 'Librarian', room: 'Central Library', type: 'theory', color: 'amber' }
    ]
  };

  const DEFAULT_STUDENT_ASSIGNMENTS = [
    { id: 'as-1', _id: 'as-1', code: 'CS301', subject: 'Data Structures', title: 'Binary Search Tree & Graph Traversal Implementation', dueDate: '15/10/2026', maxMarks: 20, defaultStatus: 'Submitted', submissionStatus: 'Submitted', score: '19/20', marksAwarded: 19, staffName: 'Dr. K. Ramesh' },
    { id: 'as-2', _id: 'as-2', code: 'CS302', subject: 'Database Management', title: 'Normalization up to BCNF & Schema Design Project', dueDate: '18/10/2026', maxMarks: 20, defaultStatus: 'Submitted', submissionStatus: 'Submitted', score: '18/20', marksAwarded: 18, staffName: 'Prof. M. Priya' },
    { id: 'as-3', _id: 'as-3', code: 'CS304', subject: 'Operating Systems', title: 'Process Scheduling Algorithms Simulation in C', dueDate: '22/10/2026', maxMarks: 25, defaultStatus: 'Pending Submission', submissionStatus: 'Pending Submission', score: 'Pending', marksAwarded: null, staffName: 'Dr. R. Suresh' },
    { id: 'as-4', _id: 'as-4', code: 'CS306', subject: 'Web Technology', title: 'Responsive Portfolio with HTML5, CSS & React', dueDate: '26/10/2026', maxMarks: 25, defaultStatus: 'Pending Submission', submissionStatus: 'Pending Submission', score: 'Pending', marksAwarded: null, staffName: 'Mr. P. Vijay' }
  ];

  // Helper getters strictly using live staff records (only real enrolled classes)
  const currentDaySlots = (liveTimetable && Array.isArray(liveTimetable[selectedDay]))
    ? liveTimetable[selectedDay]
    : [];

  const weeklyTimetable = liveTimetable || {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: []
  };

  const studentAssignments = assignmentsList.length > 0
    ? assignmentsList.map(a => ({
        id: a._id || a.id,
        _id: a._id || a.id,
        code: a.subjectCode || 'GEN101',
        subject: a.subjectName || a.subjectCode || 'General Subject',
        title: a.title,
        description: a.description || '',
        dueDate: a.dueDate,
        maxMarks: a.totalMarks || 20,
        staffName: a.staffName || 'Faculty',
        defaultStatus: a.submissionStatus || 'Pending Submission',
        submissionStatus: a.submissionStatus || 'Pending Submission',
        score: a.marksAwarded !== null && a.marksAwarded !== undefined ? `${a.marksAwarded}/${a.totalMarks || 20}` : (a.submissionStatus === 'Submitted' ? 'Under Review' : 'Pending'),
        marksAwarded: a.marksAwarded,
        submittedAt: a.submittedAt || '--',
        fileName: a.fileName || '--',
        fileSize: a.fileSize || '--',
        fileData: a.fileData || '',
        fileType: a.fileType || '',
        attachmentName: a.attachmentName || '',
        attachmentData: a.attachmentData || '',
        isOverdue: a.isOverdue
      }))
    : DEFAULT_STUDENT_ASSIGNMENTS;

  const effectiveAttendance = attendance;

  // Real examination timetable only populated after staff allocates hall ticket
  const activeExamTimetable = (hallTicketInfo?.allocated && hallTicketSubjects.length > 0)
    ? hallTicketSubjects
    : [];

  const activeInstructions = hallTicketInstructions.length > 0 ? hallTicketInstructions : [
    'Candidate must produce this Hall Ticket along with College Identity Card at each session.',
    'Candidates should occupy their allotted seats at least 15 minutes prior to commencement.',
    'Possession of mobile phones, smartwatches, programmable calculators, or study materials inside the hall is strictly prohibited.',
    'No candidate will be allowed to enter the exam hall 30 minutes after commencement or leave before closing.'
  ];

  // Sidebar Component Matching Admin Style Exactly
  const SidebarContent = ({ isCollapsed = false }) => (
    <div className="flex flex-col justify-between h-full bg-white select-none min-h-0">
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 overscroll-contain">
        {/* Sticky Header Matching Admin */}
        <div className={`sticky top-0 z-20 bg-white border-b border-slate-100 ${isCollapsed ? 'py-3 px-2 flex flex-col items-center justify-center gap-2' : 'px-4 py-4 sm:px-5 sm:py-5 flex items-center justify-between'} shadow-2xs min-w-0 transition-all`}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <button
                onClick={() => setSidebarCollapsed(false)}
                onMouseEnter={(e) => showTooltipFor('Expand Sidebar', e.currentTarget)}
                onMouseMove={(e) => showTooltipFor('Expand Sidebar', e.currentTarget)}
                onMouseLeave={hideTooltip}
                className="cursor-pointer hover:scale-105 transition-transform p-1 rounded-xl hover:bg-slate-50"
                aria-label="Expand sidebar"
              >
                <CollegeLogo size="xs" showText={false} />
              </button>
              <button
                onClick={() => setSidebarCollapsed(false)}
                onMouseEnter={(e) => showTooltipFor('Expand Sidebar', e.currentTarget)}
                onMouseMove={(e) => showTooltipFor('Expand Sidebar', e.currentTarget)}
                onMouseLeave={hideTooltip}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center min-w-0 flex-1 overflow-hidden">
                <CollegeLogo size="md" showText={true} />
              </div>
              {/* Collapse button on Desktop */}
              <button 
                onClick={() => setSidebarCollapsed(true)}
                onMouseEnter={(e) => showTooltipFor('Collapse Sidebar', e.currentTarget, true)}
                onMouseMove={(e) => showTooltipFor('Collapse Sidebar', e.currentTarget, true)}
                onMouseLeave={hideTooltip}
                className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              {/* Close button on mobile */}
              <button 
                onClick={() => setMobileOpen(false)}
                className="lg:hidden p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Student Quick Profile Card in Sidebar */}
        {isCollapsed ? (
          <div 
            className="w-full flex justify-center my-2 cursor-pointer"
            onMouseEnter={(e) => showTooltipFor(`${name} (Student Profile)`, e.currentTarget)}
            onMouseMove={(e) => showTooltipFor(`${name} (Student Profile)`, e.currentTarget)}
            onMouseLeave={hideTooltip}
          >
            <div 
              onClick={() => { setActiveNav('Student Information'); setMobileOpen(false); }}
              className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 flex items-center justify-center cursor-pointer group shadow-2xs relative"
              aria-label="View Student Profile"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0 group-hover:scale-105 transition-transform pointer-events-none">
                {name.charAt(0)}
              </div>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => { setActiveNav('Student Information'); setMobileOpen(false); }}
            className="mx-4 my-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 transition-all cursor-pointer group shadow-2xs"
            title="View Student Profile"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                {name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-slate-900 font-extrabold text-xs truncate group-hover:text-blue-600 transition-colors">
                  {name}
                </p>
                <p className="text-blue-700 font-mono text-[10px] font-bold truncate">
                  Reg: {regNo}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                    {year}
                  </span>
                  <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 text-slate-700">
                    {sem}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categorized Navigation Links Matching Admin */}
        <nav className={`${isCollapsed ? 'py-3 px-2 space-y-1' : 'p-4 space-y-6'}`}>
          {NAV_SECTIONS.map((section, idx) => (
            <div key={idx} className={isCollapsed ? 'space-y-1' : ''}>
              {!isCollapsed && (
                <h3 className="px-3 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.name;

                  if (isCollapsed) {
                    return (
                      <div 
                        key={item.name} 
                        className="w-full flex justify-center py-1 cursor-pointer"
                        onMouseEnter={(e) => showTooltipFor(item.name, e.currentTarget)}
                        onMouseMove={(e) => showTooltipFor(item.name, e.currentTarget)}
                        onMouseLeave={hideTooltip}
                      >
                        <button
                          onClick={() => { setActiveNav(item.name); setMobileOpen(false); }}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 font-extrabold shadow-xs border border-blue-200/80'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 border border-transparent'
                          }`}
                          aria-label={item.name}
                        >
                          <Icon className={`w-5 h-5 shrink-0 stroke-[2] pointer-events-none ${isActive ? 'text-blue-700' : 'text-slate-700'}`} />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={item.name}
                      onClick={() => { setActiveNav(item.name); setMobileOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-extrabold'
                          : 'text-slate-900 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-700'}`} />
                        <span>{item.name}</span>
                      </div>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Mobile Drawer Logout Only */}
      <div className="lg:hidden p-4 border-t border-slate-100 bg-white">
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-900 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-slate-700 group-hover:text-rose-600" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full max-w-full overflow-hidden bg-slate-50 text-slate-800 flex font-sans">
      {/* Desktop Sidebar (Crisp White Layout Matching Admin) */}
      <aside className={`hidden lg:flex flex-col ${sidebarCollapsed ? 'w-20' : 'w-72'} shrink-0 bg-white border-r border-slate-200 shadow-xs overflow-hidden transition-[width] duration-300 ease-in-out`}>
        <SidebarContent isCollapsed={sidebarCollapsed} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-white h-full overflow-hidden flex flex-col z-10 border-r border-slate-200 shadow-2xl">
            <SidebarContent isCollapsed={false} />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div id="student-content-scroll-container" className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        
        {/* Top Header Bar Matching Admin */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-3 flex-1 max-w-md mr-4">
            <button 
              onClick={() => setMobileOpen(true)} 
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Header Search Bar Matching Admin */}
            <div className="relative w-full hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subjects, attendance, marks, slips..."
                className="w-full pl-10 pr-9 py-2 bg-slate-100 border border-transparent rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all shadow-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={handlePrintStudentSlip}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>

            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>

            {/* Header Logout Button matching Image 2 */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-rose-50/90 hover:bg-rose-100 text-rose-600 font-bold text-xs sm:text-sm rounded-2xl border border-rose-200/90 transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-rose-600 stroke-[2.3]" />
              <span className="font-bold">Logout</span>
            </button>

            {/* User Avatar & Role Badge (Pill Container matching Image 2) */}
            <div 
              onClick={() => setActiveNav('Student Information')}
              className="flex items-center gap-2.5 bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/80 rounded-2xl p-1 sm:p-1.5 sm:pr-3.5 cursor-pointer transition-all shadow-2xs group"
              title="Student Particulars"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                {name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block min-w-0">
                <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors truncate">
                  {name}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  STUDENT
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">

          {/* ─────────────────────────────────────────────────────────── */}
          {/* TAB 1: MAIN DASHBOARD                                       */}
          {/* ─────────────────────────────────────────────────────────── */}
          {activeNav === 'Dashboard' && (
            <div className="space-y-6 w-full max-w-7xl mx-auto animate-fadeIn">
              
              {/* Dashboard Title Header Matching Admin */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Student Dashboard</h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                    Welcome back, {name}. Here is your live academic standing, timetable, and attendance today.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintStudentSlip}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-600" />
                    <span>Print Official Slip</span>
                  </button>
                </div>
              </div>

              {/* Light Academic Pass Banner Matching Super Admin in Dashboard.jsx */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-sm">
                    🎓
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-extrabold text-blue-950">
                        {name}
                      </h3>
                      <span className="text-[10px] bg-blue-200/80 text-blue-800 px-2 py-0.5 rounded-full font-extrabold">
                        Official Academic Pass
                      </span>
                    </div>
                    <p className="text-xs text-blue-800 font-medium mt-0.5">
                      {course} • {department} • <span className="font-bold">{year} ({sem})</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 bg-white/90 border border-blue-200/60 rounded-xl p-2.5 text-xs font-mono shadow-xs">
                  <div className="px-2">
                    <span className="block text-[9.5px] font-sans font-extrabold text-slate-400 uppercase">Register No</span>
                    <span className="font-bold text-blue-700">{regNo}</span>
                  </div>
                  <div className="border-l border-slate-200 pl-3 pr-2">
                    <span className="block text-[9.5px] font-sans font-extrabold text-slate-400 uppercase">Password (DOB)</span>
                    <div className="flex items-center gap-1.5 font-bold text-amber-700">
                      <span>{showPassword ? dob : '••••••••'}</span>
                      <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="border-l border-slate-200 pl-3 pr-2">
                    <span className="block text-[9.5px] font-sans font-extrabold text-slate-400 uppercase">Login ID</span>
                    <span className="font-bold text-slate-800">{loginId}</span>
                  </div>
                </div>
              </div>

              {/* 8 Metric Cards Grid Matching Admin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                
                {/* 1. Attendance Rate */}
                <div 
                  onClick={() => setActiveNav('Attendance')}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex items-start justify-between cursor-pointer hover:border-blue-300"
                >
                  <div>
                    <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">ATTENDANCE RATE</p>
                    <p className="text-2xl font-extrabold text-slate-900 leading-none mb-2">{effectiveAttendance}%</p>
                    <p className="text-xs font-semibold flex items-center gap-1 text-emerald-600">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {attSummary.totalClasses > 0 
                        ? `${attSummary.present + attSummary.late}/${attSummary.totalClasses} classes attended` 
                        : (effectiveAttendance >= 75 ? 'Eligibility Cleared' : 'Shortage Alert')}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-xs shrink-0">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                </div>

                {/* 2. Register Number */}
                <div 
                  onClick={() => setActiveNav('Student Information')}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex items-start justify-between cursor-pointer hover:border-blue-300"
                >
                  <div>
                    <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">REGISTER NUMBER</p>
                    <p className="text-xl font-extrabold text-blue-700 font-mono leading-none mb-2">{regNo}</p>
                    <p className="text-xs font-semibold flex items-center gap-1 text-slate-500">
                      Roll: {rollNo}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
                    <IdCard className="w-5 h-5" />
                  </div>
                </div>

                {/* 3. Year of Study */}
                <div 
                  onClick={() => setActiveNav('Student Information')}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex items-start justify-between cursor-pointer hover:border-blue-300"
                >
                  <div>
                    <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">YEAR OF STUDY</p>
                    <p className="text-2xl font-extrabold text-slate-900 leading-none mb-2">{year}</p>
                    <p className="text-xs font-semibold flex items-center gap-1 text-purple-600">
                      Current: {sem}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-xs shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                </div>

                {/* 4. Fee Clearance */}
                <div 
                  onClick={() => setActiveNav('Student Information')}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex items-start justify-between cursor-pointer hover:border-blue-300"
                >
                  <div>
                    <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">FEE CLEARANCE</p>
                    <p className="text-2xl font-extrabold text-emerald-600 leading-none mb-2">{feeStatus}</p>
                    <p className="text-xs font-semibold flex items-center gap-1 text-emerald-600">
                      Exam Clearance Verified
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                </div>

                {/* 5. Internal Marks */}
                <div 
                  onClick={() => setActiveNav('Internal Marks')}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex items-start justify-between cursor-pointer hover:border-blue-300"
                >
                  <div>
                    <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">INTERNAL MARKS</p>
                    <p className="text-2xl font-extrabold text-slate-900 leading-none mb-2">
                      {marksData.length > 0 ? `${marksData.length} Subjects` : 'Active'}
                    </p>
                    <p className="text-xs font-semibold flex items-center gap-1 text-indigo-600">
                      {marksData.length > 0 ? 'Faculty Verified' : 'Continuous Assessment'}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-xs shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                </div>

                {/* 6. Timetable */}
                <div 
                  onClick={() => setActiveNav('Timetable')}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex items-start justify-between cursor-pointer hover:border-blue-300"
                >
                  <div>
                    <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">TIMETABLE</p>
                    <p className="text-2xl font-extrabold text-slate-900 leading-none mb-2">
                      {currentDaySlots.length} Periods
                    </p>
                    <p className="text-xs font-semibold flex items-center gap-1 text-teal-600">
                      {selectedDay} Schedule
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>

                {/* 7. Assignments */}
                <div 
                  onClick={() => setActiveNav('Assignments')}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex items-start justify-between cursor-pointer hover:border-blue-300"
                >
                  <div>
                    <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">ASSIGNMENTS</p>
                    <p className="text-2xl font-extrabold text-slate-900 leading-none mb-2">
                      {studentAssignments.length} Assigned
                    </p>
                    <p className="text-xs font-semibold flex items-center gap-1 text-purple-600">
                      {studentAssignments.filter(a => a.submissionStatus === 'Submitted' || a.submissionStatus === 'Graded').length} Submitted · {studentAssignments.filter(a => a.submissionStatus !== 'Submitted' && a.submissionStatus !== 'Graded').length} Pending
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <BookMarked className="w-5 h-5" />
                  </div>
                </div>

                {/* 8. Hall Ticket */}
                <div 
                  onClick={() => setActiveNav('Hall Ticket')}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex items-start justify-between cursor-pointer hover:border-blue-300"
                >
                  <div>
                    <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">HALL TICKET</p>
                    <p className="text-2xl font-extrabold text-slate-900 leading-none mb-2">Issued</p>
                    <p className="text-xs font-semibold flex items-center gap-1 text-rose-600">
                      University Exam Ready
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Ticket className="w-5 h-5" />
                  </div>
                </div>

              </div>

              {/* Quick Student Actions Grid Matching Admin */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Quick Student Services
                  </h3>
                  <span className="text-xs font-medium text-slate-400">Student Self-Service</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Print Student Slip', icon: Printer, bg: 'bg-blue-50 hover:bg-blue-100 text-blue-700', action: handlePrintStudentSlip },
                    { label: 'Student Particulars', icon: User, bg: 'bg-purple-50 hover:bg-purple-100 text-purple-700', nav: 'Student Information' },
                    { label: 'Attendance Tracker', icon: CheckSquare, bg: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700', nav: 'Attendance' },
                    { label: 'Internal Marks', icon: FileSpreadsheet, bg: 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700', nav: 'Internal Marks' },
                    { label: 'Weekly Timetable', icon: Calendar, bg: 'bg-teal-50 hover:bg-teal-100 text-teal-700', nav: 'Timetable' },
                    { label: 'Assignments', icon: BookMarked, bg: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700', nav: 'Assignments' },
                    { label: 'Exam Hall Ticket', icon: Ticket, bg: 'bg-rose-50 hover:bg-rose-100 text-rose-700', nav: 'Hall Ticket' },
                    { label: 'Download Data (.txt)', icon: Download, bg: 'bg-amber-50 hover:bg-amber-100 text-amber-700', action: handleDownloadStudentSlip }
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={item.action ? item.action : () => setActiveNav(item.nav)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border border-transparent font-bold text-xs transition-all cursor-pointer ${item.bg}`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Two Column Grid: Academic Credentials & Statutory Particulars Matching Admin */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Academic Particulars Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <h3 className="font-extrabold text-slate-900 text-sm">Academic Enrollment Summary</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      Verified
                    </span>
                  </div>
                  <div className="p-5 space-y-3 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-bold">Register Number:</span>
                      <strong className="text-blue-700 font-mono text-sm">{regNo}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-bold">Roll Number:</span>
                      <strong className="text-slate-800">{rollNo}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-bold">Current Year:</span>
                      <strong className="text-amber-700 font-bold">{year}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-bold">Current Semester:</span>
                      <strong className="text-slate-800">{sem}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-bold">Degree / Course:</span>
                      <strong className="text-slate-900">{course}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-bold">Department:</span>
                      <strong className="text-slate-800">{department}</strong>
                    </div>
                  </div>
                </div>

                {/* Personal & Statutory Summary Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-extrabold text-slate-900 text-sm">Statutory & Identity Record</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active Pass
                    </span>
                  </div>
                  <div className="p-5 space-y-3 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-bold">Date of Birth (DOB):</span>
                      <strong className="text-slate-800 font-mono">{dob}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-bold">Aadhaar Card:</span>
                      <strong className="text-slate-800 font-mono">{aadhaar}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-bold">PAN Card:</span>
                      <strong className="text-slate-800 font-mono">{pan}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-bold">Bank Name & Acc:</span>
                      <strong className="text-slate-800">{bankName} ({bankAccountNo})</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-bold">EMIS Number:</span>
                      <strong className="text-slate-800 font-mono">{emisNumber}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-bold">Nationality / Religion:</span>
                      <strong className="text-slate-800">{nationality} · {religion}</strong>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* TAB 2: STUDENT INFORMATION & STATUTORY PARTICULARS          */}
          {/* ─────────────────────────────────────────────────────────── */}
          {activeNav === 'Student Information' && (
            <div className="space-y-6 w-full max-w-7xl mx-auto animate-fadeIn">
              
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Official Student Particulars & Record</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Comprehensive statutory, banking, qualification, and portal identity records.</p>
                  </div>
                  <button
                    onClick={handlePrintStudentSlip}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Student Slip</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                  
                  {/* Card 1: Portal & Academic Identity */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center gap-2 text-blue-900 font-black uppercase text-[11px] border-b border-slate-200 pb-2">
                      <GraduationCap className="w-4 h-4 text-blue-700" />
                      <span>1. Portal & Enrollment</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">Register Number:</span><strong className="text-blue-800 font-mono">{regNo}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">Roll Number:</span><strong>{rollNo}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">Year of Study:</span><strong className="text-amber-800">{year}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">Login ID:</span><strong className="font-mono">{loginId}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">Password (DOB):</span><strong className="text-emerald-700 font-mono">{dob}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">Course / Degree:</span><strong className="text-right">{course}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">Semester:</span><strong>{sem}</strong></div>
                    </div>
                  </div>

                  {/* Card 2: Government & Statutory Identifiers */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center gap-2 text-purple-900 font-black uppercase text-[11px] border-b border-slate-200 pb-2">
                      <ShieldCheck className="w-4 h-4 text-purple-700" />
                      <span>2. Statutory Identifiers</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">Aadhaar Number:</span><strong className="font-mono">{aadhaar}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">PAN Card Number:</span><strong className="font-mono">{pan}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">EMIS Number:</span><strong className="font-mono">{emisNumber}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">Driving License:</span><strong className="font-mono">{drivingLicense}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">Nationality:</span><strong>{nationality}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">Religion:</span><strong>{religion}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">Caste / Community:</span><strong>{caste}</strong></div>
                    </div>
                  </div>

                  {/* Card 3: Bank Account & Donations */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-900 font-black uppercase text-[11px] border-b border-slate-200 pb-2">
                      <Building2 className="w-4 h-4 text-emerald-700" />
                      <span>3. Banking & Records</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">Bank Name:</span><strong>{bankName}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">Account Number:</span><strong className="font-mono">{bankAccountNo}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">IFSC Code:</span><strong className="font-mono">{ifscCode}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">Branch:</span><strong>{bankBranch}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">10th Std Record:</span><strong>{tenthMarks}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">12th Std Record:</span><strong>{twelfthMarks}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-bold">Donation (₹):</span><strong className="text-emerald-800">{donation}</strong></div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* TAB 3: STUDENT SLIP VIEW                                    */}
          {/* ─────────────────────────────────────────────────────────── */}
          {activeNav === 'Student Slip' && (
            <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                
                <div className="flex items-center justify-between border-b border-slate-200 pb-5 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Official Student Slip & Academic Pass</h3>
                    <p className="text-xs text-slate-500">Includes Register Number (Reg No), Roll Number, Year, and all personal details.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePrintStudentSlip}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Slip</span>
                    </button>
                    <button
                      onClick={handleDownloadStudentSlip}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                {/* Printable Slip Preview Card */}
                <div className="border border-slate-300 rounded-2xl p-6 sm:p-8 bg-white space-y-6">
                  <div className="flex items-center justify-center gap-4 text-center border-b border-blue-900/20 pb-4">
                    <CollegeLogo size="sm" showText={false} />
                    <div>
                      <h4 className="text-base font-black text-slate-900 uppercase">Vivekananda College of Arts & Science</h4>
                      <p className="text-xs text-slate-500">Affiliated with Manonmaniam Sundaranar University • Vellalankulam Campus</p>
                    </div>
                  </div>

                  <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 uppercase block">Register Number (Reg No)</span>
                      <strong className="text-slate-900 font-mono text-sm">{regNo}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 uppercase block">Login ID</span>
                      <strong className="text-slate-900 font-mono text-sm">{loginId}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 uppercase block">Password (Date of Birth)</span>
                      <strong className="text-slate-900 font-mono text-sm">{dob}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <h5 className="font-extrabold text-blue-900 uppercase text-[11px] border-b pb-1">Academic Info</h5>
                      <p><span className="text-slate-500 font-semibold">Student Name:</span> <strong>{name}</strong></p>
                      <p><span className="text-slate-500 font-semibold">Roll Number:</span> <strong>{rollNo}</strong></p>
                      <p><span className="text-slate-500 font-semibold">Year of Study:</span> <strong className="text-amber-800">{year}</strong></p>
                      <p><span className="text-slate-500 font-semibold">Degree / Course:</span> <strong>{course}</strong></p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <h5 className="font-extrabold text-blue-900 uppercase text-[11px] border-b pb-1">Statutory Info</h5>
                      <p><span className="text-slate-500 font-semibold">Aadhaar:</span> <strong className="font-mono">{aadhaar}</strong></p>
                      <p><span className="text-slate-500 font-semibold">PAN:</span> <strong className="font-mono">{pan}</strong></p>
                      <p><span className="text-slate-500 font-semibold">EMIS:</span> <strong className="font-mono">{emisNumber}</strong></p>
                      <p><span className="text-slate-500 font-semibold">Bank Name:</span> <strong>{bankName}</strong></p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* TAB 4: ATTENDANCE                                           */}
          {/* ─────────────────────────────────────────────────────────── */}
          {activeNav === 'Attendance' && (
            <div className="space-y-6 w-full max-w-7xl mx-auto animate-fadeIn">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-black text-slate-900">Live Student Attendance Tracker</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hour-by-hour classroom and laboratory attendance verified by faculty.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-4 py-1.5 rounded-xl text-xs font-black border ${
                      effectiveAttendance >= 75 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      Current Rate: {effectiveAttendance}% ({effectiveAttendance >= 75 ? 'Eligible' : 'Shortage'})
                    </div>
                  </div>
                </div>

                {/* 4 Attendance Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">TOTAL SESSIONS</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{attSummary.totalClasses || attendanceData.length}</p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Class Hours Conducted</p>
                  </div>
                  <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4">
                    <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">PRESENT</p>
                    <p className="text-2xl font-black text-emerald-800 mt-1">{attSummary.present}</p>
                    <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Sessions Attended</p>
                  </div>
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4">
                    <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">LATE / PERMITTED</p>
                    <p className="text-2xl font-black text-amber-800 mt-1">{attSummary.late}</p>
                    <p className="text-[11px] text-amber-600 font-medium mt-0.5">With Permission</p>
                  </div>
                  <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-4">
                    <p className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider">ABSENT</p>
                    <p className="text-2xl font-black text-rose-800 mt-1">{attSummary.absent}</p>
                    <p className="text-[11px] text-rose-600 font-medium mt-0.5">Leave / Unexcused</p>
                  </div>
                </div>

                {/* Subject-Wise Breakdown if available */}
                {attSummary.subjectBreakdown && attSummary.subjectBreakdown.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Subject-Wise Attendance Breakdown
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {attSummary.subjectBreakdown.map((sub, i) => (
                        <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-xs text-blue-700">{sub.code}</span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              sub.percentage >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {sub.percentage}%
                            </span>
                          </div>
                          <p className="font-extrabold text-xs text-slate-900 truncate">{sub.name}</p>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${sub.percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                              style={{ width: `${Math.min(100, sub.percentage)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500 font-medium pt-0.5">
                            <span>Attended: {sub.present + sub.late}/{sub.total}</span>
                            <span>{sub.staffName ? `Prof. ${sub.staffName}` : ''}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attendance Log Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Detailed Attendance Register Log
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Hour / Slot</th>
                          <th className="py-3 px-4">Course / Class</th>
                          <th className="py-3 px-4">Faculty In-Charge</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceData.length > 0 ? (
                          attendanceData.map((att, i) => (
                            <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-slate-800">{att.date}</td>
                              <td className="py-3 px-4 text-slate-600 font-medium">{att.slot || 'Period 1'}</td>
                              <td className="py-3 px-4">
                                <span className="font-mono font-bold text-blue-700">{att.classCode}</span>
                                {att.className && <span className="text-slate-500 ml-1.5 font-medium">· {att.className}</span>}
                              </td>
                              <td className="py-3 px-4 text-slate-600 font-medium">{att.staffName || 'Staff Member'}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                  (att.status || '').toLowerCase() === 'present' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : (att.status || '').toLowerCase() === 'late'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {att.status || 'Present'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-slate-500 italic">
                                {att.remarks || 'Regular Hour'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                              No attendance sessions registered for this student yet. Overall standing: {effectiveAttendance}%.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* TAB 5: INTERNAL MARKS                                       */}
          {/* ─────────────────────────────────────────────────────────── */}
          {activeNav === 'Internal Marks' && (
            <div className="space-y-6 w-full max-w-7xl mx-auto animate-fadeIn">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-black text-slate-900">Internal Continuous Assessment Register</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Snap Tests (ST), Continuous Internal Assessments (CIA), Model Examinations & Consolidated Marks.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-3.5 py-1.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-200 font-mono">
                      Reg No: {regNo}
                    </span>
                  </div>
                </div>

                {/* Marksheets Table / Cards */}
                {marksData.length > 0 ? (
                  <div className="space-y-4">
                    {marksData.map((ms, idx) => {
                      const m = ms.marks || {};
                      const max = ms.maxMarks || {};
                      const pass = ms.passMarks || {};

                      const scoreList = [
                        { name: 'ST 1', val: m.st1, max: max.st1 || 20, pass: pass.st1 || 8 },
                        { name: 'ST 2', val: m.st2, max: max.st2 || 20, pass: pass.st2 || 8 },
                        { name: 'ST 3', val: m.st3, max: max.st3 || 20, pass: pass.st3 || 8 },
                        { name: 'ST 4', val: m.st4, max: max.st4 || 20, pass: pass.st4 || 8 },
                        { name: 'CIA 1 / IT 1', val: m.cia1 ?? m.it1, max: max.cia1 || max.it1 || 50, pass: pass.cia1 || pass.it1 || 20 },
                        { name: 'CIA 2 / IT 2', val: m.cia2 ?? m.it2, max: max.cia2 || max.it2 || 50, pass: pass.cia2 || pass.it2 || 20 },
                        { name: 'Model Exam', val: m.model, max: max.model || 75, pass: pass.model || 30 },
                        { name: 'Assignment', val: m.assignment ?? m.assignment1, max: max.assignment || 20, pass: pass.assignment || 8 },
                        { name: 'Attendance', val: m.attendance, max: max.attendance || 5, pass: pass.attendance || 2 },
                        { name: 'Consolidated', val: m.consolidated, max: max.consolidated || 25, pass: pass.consolidated || 10, isHighlight: true }
                      ];

                      return (
                        <div key={idx} className="border border-slate-200/90 rounded-2xl overflow-hidden bg-slate-50/30 shadow-2xs">
                          {/* Subject Header */}
                          <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-md">
                                  {ms.subjectCode}
                                </span>
                                <h4 className="font-extrabold text-sm text-slate-900">{ms.subjectName || ms.subjectCode}</h4>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                Faculty: <strong className="text-slate-700">{ms.staffName || 'Department Faculty'}</strong> • Sem: {ms.semester || '1'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {ms.isLocked && (
                                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> Locked & Verified
                                </span>
                              )}
                              <span className="text-xs font-black bg-purple-100 text-purple-800 px-3 py-1 rounded-xl">
                                Consolidated: {m.consolidated !== null && m.consolidated !== undefined ? `${m.consolidated}/${max.consolidated || 25}` : 'In Progress'}
                              </span>
                            </div>
                          </div>

                          {/* Scores Grid */}
                          <div className="p-4 grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5 text-center">
                            {scoreList.map((sc, sIdx) => {
                              const hasScore = sc.val !== null && sc.val !== undefined && sc.val !== '';
                              const isNum = !isNaN(Number(sc.val));
                              const numVal = isNum ? Number(sc.val) : null;
                              const isPassed = numVal !== null ? numVal >= sc.pass : true;

                              return (
                                <div 
                                  key={sIdx} 
                                  className={`p-2.5 rounded-xl border transition-all ${
                                    sc.isHighlight 
                                      ? 'bg-purple-50/80 border-purple-200 font-bold' 
                                      : 'bg-white border-slate-200/80'
                                  }`}
                                >
                                  <p className="text-[9.5px] font-extrabold text-slate-400 uppercase truncate" title={sc.name}>
                                    {sc.name}
                                  </p>
                                  <p className={`text-sm font-black my-0.5 ${
                                    hasScore 
                                      ? (isPassed ? 'text-slate-900' : 'text-rose-600') 
                                      : 'text-slate-300'
                                  }`}>
                                    {hasScore ? sc.val : '—'}
                                  </p>
                                  <p className="text-[9px] text-slate-400 font-mono">
                                    Max: {sc.max}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-4">Evaluation Type</th>
                          <th className="py-3 px-4 text-center">Max Marks</th>
                          <th className="py-3 px-4 text-center">Marks Obtained</th>
                          <th className="py-3 px-4 text-right">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-3 px-4 font-bold text-slate-900">CS301 · Data Structures & Algorithms</td>
                          <td className="py-3 px-4 text-slate-600">Continuous Assessment (CIA)</td>
                          <td className="py-3 px-4 text-center font-mono">25</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-blue-700">22</td>
                          <td className="py-3 px-4 text-right"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Pass</span></td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-slate-900">CS302 · Database Management Systems</td>
                          <td className="py-3 px-4 text-slate-600">Continuous Assessment (CIA)</td>
                          <td className="py-3 px-4 text-center font-mono">25</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-blue-700">21</td>
                          <td className="py-3 px-4 text-right"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Pass</span></td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-bold text-slate-900">MAT201 · Discrete Mathematics</td>
                          <td className="py-3 px-4 text-slate-600">Continuous Assessment (CIA)</td>
                          <td className="py-3 px-4 text-center font-mono">25</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-blue-700">20</td>
                          <td className="py-3 px-4 text-right"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Pass</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* TAB 6: TIMETABLE VIEW                                       */}
          {/* ─────────────────────────────────────────────────────────── */}
          {activeNav === 'Timetable' && (
            <div className="space-y-6 w-full max-w-7xl mx-auto animate-fadeIn">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-teal-600" />
                      <h3 className="text-lg font-black text-slate-900">Weekly Academic Timetable</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Class schedule for {course} ({year} • {sem}) — Synchronized with Faculty Timetable.
                    </p>
                  </div>
                  
                  {/* Day Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedDay === day
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timetable Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                        <th className="py-3 px-4">Period</th>
                        <th className="py-3 px-4">Time</th>
                        <th className="py-3 px-4">Course Code</th>
                        <th className="py-3 px-4">Subject Title</th>
                        <th className="py-3 px-4">Faculty In-charge</th>
                        <th className="py-3 px-4">Room / Lab</th>
                        <th className="py-3 px-4 text-right">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentDaySlots.length > 0 ? (
                        currentDaySlots.map((slot, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-800">Hour {slot.slot}</td>
                            <td className="py-3.5 px-4 text-slate-500 font-medium">{slot.time}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{slot.code}</td>
                            <td className="py-3.5 px-4 font-extrabold text-slate-900">{slot.subject}</td>
                            <td className="py-3.5 px-4 text-slate-600 font-medium">{slot.faculty}</td>
                            <td className="py-3.5 px-4 font-medium text-slate-700">{slot.room}</td>
                            <td className="py-3.5 px-4 text-right">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                (slot.type || '').toLowerCase() === 'lab' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {(slot.type || 'theory').toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                            No scheduled classes for {selectedDay}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* TAB 7: ASSIGNMENTS VIEW                                     */}
          {/* ─────────────────────────────────────────────────────────── */}
          {activeNav === 'Assignments' && (
            <div className="space-y-6 w-full max-w-7xl mx-auto animate-fadeIn">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <BookMarked className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-lg font-black text-slate-900">Assignments & Coursework Submissions</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Coursework assigned by your subject faculty. Submit solutions and review marks.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {/* Status filter pills */}
                    {['ALL', 'PENDING', 'SUBMITTED'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setAssignmentFilter(filter)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          assignmentFilter === filter
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                    <span className="text-xs font-bold px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
                      {studentAssignments.length} Task(s)
                    </span>
                  </div>
                </div>

                {/* Toast Notification */}
                {toastMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{toastMsg}</span>
                  </div>
                )}

                {/* Assignments Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Assignment Title & Instructions</th>
                        <th className="py-3 px-4">Faculty</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4 text-center">Max Marks</th>
                        <th className="py-3 px-4 text-center">Score Awarded</th>
                        <th className="py-3 px-4 text-right">Status & Submission</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentAssignments
                        .filter(a => {
                          if (assignmentFilter === 'ALL') return true;
                          const isSub = a.submissionStatus === 'Submitted' || a.submissionStatus === 'Graded';
                          if (assignmentFilter === 'SUBMITTED') return isSub;
                          if (assignmentFilter === 'PENDING') return !isSub;
                          return true;
                        })
                        .map((a) => {
                          const isSubmitted = a.submissionStatus === 'Submitted' || a.submissionStatus === 'Graded' || submittedAssignmentIds.has(a.id);
                          const isGraded = a.submissionStatus === 'Graded' || (a.marksAwarded !== null && a.marksAwarded !== undefined);

                          return (
                            <tr key={a._id || a.id || idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-4">
                                <span className="font-mono font-bold text-blue-700">{a.code}</span>
                                <p className="text-[11px] text-slate-600 font-medium mt-0.5">{a.subject}</p>
                              </td>
                              <td className="py-3.5 px-4 max-w-sm">
                                <p className="font-extrabold text-slate-900">{a.title}</p>
                                {a.description && (
                                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{a.description}</p>
                                )}
                                {a.attachmentName && (
                                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md w-fit">
                                    <FolderOpen className="w-3 h-3" />
                                    <span>Faculty Material: {a.attachmentName}</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 font-medium">{a.staffName || 'Faculty'}</td>
                              <td className="py-3.5 px-4">
                                <span className={`font-mono font-medium ${a.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                                  {a.dueDate}
                                </span>
                                {a.isOverdue && (
                                  <span className="block text-[10px] text-rose-500 font-bold">Past Due</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">{a.maxMarks}</td>
                              <td className="py-3.5 px-4 text-center font-mono font-bold">
                                {isGraded ? (
                                  <span className="text-purple-700 text-sm font-black">{a.marksAwarded}/{a.maxMarks}</span>
                                ) : isSubmitted ? (
                                  <span className="text-amber-600 text-[11px]">Under Review</span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {isSubmitted ? (
                                  <div className="inline-flex flex-col items-end gap-1">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3" />
                                      {isGraded ? 'Graded' : 'Submitted'}
                                    </span>
                                    {a.fileName && a.fileName !== '--' && (
                                      <div className="flex items-center gap-1 text-[10px] font-mono font-medium text-slate-600 max-w-[170px] truncate" title={a.fileName}>
                                        <FileText className="w-3 h-3 text-indigo-500 shrink-0" />
                                        <span className="truncate">{a.fileName}</span>
                                        {a.fileData && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const link = document.createElement("a");
                                              link.href = a.fileData;
                                              link.download = a.fileName;
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
                                            }}
                                            className="text-indigo-600 hover:text-indigo-800 ml-0.5 underline font-bold cursor-pointer"
                                            title="Download submitted file"
                                          >
                                            <Download className="w-3 h-3 inline" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                    {a.submittedAt && a.submittedAt !== '--' && (
                                      <span className="text-[9.5px] text-slate-400 font-mono">
                                        {a.submittedAt}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleOpenSubmitModal(a)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                                  >
                                    <FileUp className="w-3.5 h-3.5" />
                                    <span>Submit Solution</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* TAB 8: HALL TICKET VIEW                                     */}
          {/* ─────────────────────────────────────────────────────────── */}
          {activeNav === 'Hall Ticket' && (
            <div className="space-y-6 w-full max-w-5xl mx-auto animate-fadeIn">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                
                {/* Header matching Admin */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 mb-6 gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">University Examination Hall Ticket</h3>
                    <p className="text-xs text-slate-500">Official admit card for End Semester University Examinations.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePrintHallTicket}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Hall Ticket</span>
                    </button>
                    <button
                      onClick={handlePrintStudentSlip}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Student Slip</span>
                    </button>
                  </div>
                </div>

                {/* Exam Eligibility based on No Due & Attendance & Hall Seating */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        ✓
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-blue-950">
                          University Exam Eligibility Clearance &amp; Seating Allotment
                        </h4>
                        <p className="text-[11px] text-blue-800">
                          Verified automatically based on Institutional No Due (Fees) and Attendance records.
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black ${
                      (feeStatus || '').toLowerCase() === 'paid' && attendance >= 75
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {(feeStatus || '').toLowerCase() === 'paid' && attendance >= 75 ? '✓ Exam Cleared (Eligible)' : '⚠️ Condonation Verified'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 bg-white/90 rounded-xl border border-blue-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">1. No Due Clearance (Fees)</span>
                      <strong className={`text-xs ${(feeStatus || '').toLowerCase() === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {(feeStatus || '').toLowerCase() === 'paid' ? 'Zero Dues (Cleared)' : `Status: ${feeStatus}`}
                      </strong>
                    </div>

                    <div className="p-2.5 bg-white/90 rounded-xl border border-blue-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">2. Attendance Requirement (&ge;75%)</span>
                      <strong className={`text-xs ${attendance >= 75 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {attendance}% ({attendance >= 75 ? 'Eligibility Cleared' : 'Condoned on file'})
                      </strong>
                    </div>

                    <div className="p-2.5 bg-white/90 rounded-xl border border-blue-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">3. Allocated Exam Hall &amp; Seat</span>
                      <strong className="text-xs text-blue-800 font-mono">
                        {allocatedHall} • Seat: {allocatedSeat}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Printable Hall Ticket Preview Card or Pending Notice */}
                {!hallTicketInfo?.allocated || activeExamTimetable.length === 0 ? (
                  <div className="border-2 border-dashed border-amber-300 rounded-2xl p-8 bg-amber-50/60 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h4 className="font-extrabold text-base text-amber-950">Hall Ticket Allocation Pending</h4>
                    <p className="text-xs text-amber-800 max-w-md mx-auto">
                      Your examination hall, seat allotment, and course schedule have not yet been allocated by the Department Examination Cell. Please check back after faculty in-charge completes your hall ticket allocation.
                    </p>
                  </div>
                ) : (
                <div className="border-2 border-black p-5 sm:p-7 bg-white text-black font-serif max-w-2xl mx-auto shadow-md">
                  {/* College Header */}
                  <div className="flex items-center gap-3 pb-2">
                    <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                      <img src="/vcas-logo.png" alt="Crest Logo" className="w-14 h-14 object-contain" />
                    </div>
                    <div className="text-center flex-1 pr-14">
                      <h4 className="text-base font-black text-black uppercase tracking-wide leading-tight">
                        VIVEKANANDA COLLEGE OF ARTS AND SCIENCE
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-800 mt-0.5">Vellalankulam, Tenkasi Dist</p>
                      <p className="text-[9px] font-bold text-slate-700 mt-0.5">
                        PHONE: 04636298128, 7094462393, 7094462394 &nbsp;&nbsp; EMAIL: vivekanandacas@gmail.com
                      </p>
                      <p className="font-extrabold text-xs uppercase tracking-wide mt-1.5 text-black">
                        {(hallTicketInfo?.examName || 'MODEL SEMESTER EXAMINATION - NOVEMBER 2026').toUpperCase()}
                      </p>
                      <p className="font-black text-xs uppercase tracking-widest underline mt-1 text-black">
                        HALL TICKET
                      </p>
                    </div>
                  </div>

                  {/* Dept / Year / Sem Meta Row */}
                  <div className="flex items-center justify-between text-xs font-bold py-2 px-1 text-black">
                    <div><span>DEPARTMENT:</span> {(department || 'CFS').toUpperCase()}</div>
                    <div><span>YEAR:</span> {(() => {
                      const s = Number(sem?.replace(/\D/g, '')) || 1;
                      const map = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
                      return map[Math.ceil(s / 2)] || 'I';
                    })()}</div>
                    <div><span>SEMESTER:</span> {(() => {
                      const s = Number(sem?.replace(/\D/g, '')) || 1;
                      const map = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII' };
                      return map[s] || 'I';
                    })()}</div>
                  </div>

                  {/* Candidate Info 2-Row Box */}
                  <table className="w-full border-collapse border border-black text-xs mb-2">
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="w-28 font-bold p-1.5 border-r border-black bg-slate-50">Student Name:</td>
                        <td className="font-bold p-1.5 uppercase text-black">{name}</td>
                      </tr>
                      <tr>
                        <td className="w-28 font-bold p-1.5 border-r border-black bg-slate-50">Register No :</td>
                        <td className="font-bold p-1.5 font-mono text-black">{regNo || rollNo}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Time Table Heading */}
                  <div className="text-center font-black text-xs uppercase tracking-wider underline my-2 text-black">
                    TIME TABLE
                  </div>

                  {/* Examination Timetable Table */}
                  <table className="w-full border-collapse border border-black text-[11px] text-left">
                    <thead>
                      <tr className="border-b border-black bg-slate-50 text-center font-bold">
                        <th className="border border-black px-1.5 py-1.5 w-8">NO</th>
                        <th className="border border-black px-2 py-1.5 w-24">DATE</th>
                        <th className="border border-black px-1.5 py-1.5 w-12">FN<br/>AN</th>
                        <th className="border border-black px-2.5 py-1.5">SUBJECT</th>
                        <th className="border border-black px-2 py-1.5 w-20">Sub. Code</th>
                        <th className="border border-black px-1.5 py-1.5 w-12">Sign</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeExamTimetable || []).map((e, idx) => (
                        <tr key={idx} className="border-b border-black">
                          <td className="border border-black px-1.5 py-2 text-center font-bold">{idx + 1}</td>
                          <td className="border border-black px-2 py-2 text-center font-bold">{e.date || '21.10.26'}</td>
                          <td className="border border-black px-1.5 py-2 text-center font-bold">
                            {String(e.session || 'FN').toUpperCase().includes('AN') ? 'AN' : 'FN'}
                          </td>
                          <td className="border border-black px-2.5 py-2 font-bold uppercase">{e.subject}</td>
                          <td className="border border-black px-2 py-2 text-center font-bold">{e.code || ''}</td>
                          <td className="border border-black px-1.5 py-2 text-center h-8"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Signatures */}
                  <div className="pt-10 pb-2 flex items-center justify-between text-center text-xs font-bold px-4">
                    <div>Office</div>
                    <div>HOD</div>
                    <div>Principal</div>
                    <div>MD</div>
                  </div>

                </div>
                )}

              </div>
            </div>
          )}

        </main>
      </div>

      {/* Interactive Assignment Submission Modal */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => !isSubmitting && setSubmittingAssignment(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-7 w-full max-w-lg z-10 border border-slate-200 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Submit Assignment Solution</h3>
                  <p className="text-xs text-slate-500">{submittingAssignment.code || submittingAssignment.subjectCode} · {submittingAssignment.subject}</p>
                </div>
              </div>
              <button 
                onClick={() => setSubmittingAssignment(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignmentSolution} className="space-y-4 text-xs">
              {/* Assignment Details Overview */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 text-sm">{submittingAssignment.title}</span>
                  <span className="font-mono text-purple-700 font-bold bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                    Max: {submittingAssignment.maxMarks} Marks
                  </span>
                </div>
                {submittingAssignment.description && (
                  <p className="text-slate-600 text-xs leading-relaxed">{submittingAssignment.description}</p>
                )}
                <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-medium">
                  <span>Faculty: <strong>{submittingAssignment.staffName || 'Department Faculty'}</strong></span>
                  <span>Due: <strong className={submittingAssignment.isOverdue ? 'text-rose-600' : 'text-slate-800'}>{submittingAssignment.dueDate}</strong></span>
                </div>
              </div>

              {/* Solution File Upload (PDF / DOCX) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-800 font-bold text-xs">
                    Upload Solution Document (PDF / DOCX) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Max 25MB</span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleSelectedFile(f);
                  }}
                  accept=".pdf,.doc,.docx,.zip,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                />

                {selectedFileObj ? (
                  /* Selected File Card */
                  <div className="p-3 bg-indigo-50/60 border-2 border-indigo-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        selectedFileObj.name.toLowerCase().endsWith('.pdf')
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : selectedFileObj.name.toLowerCase().match(/\.(docx?|doc)$/)
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}>
                        {selectedFileObj.name.toLowerCase().endsWith('.pdf') ? 'PDF' : selectedFileObj.name.toLowerCase().match(/\.(docx?|doc)$/) ? 'DOCX' : 'DOC'}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-800 text-xs truncate" title={selectedFileObj.name}>
                          {selectedFileObj.name}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{uploadedFileSize || formatBytes(selectedFileObj.size)} • Ready to submit</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-[11px] font-bold bg-white text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFileObj(null);
                          setFileBase64('');
                          setUploadedFileSize('');
                          setUploadedFileType('');
                          const subCode = submittingAssignment?.subjectCode || submittingAssignment?.code || 'ASG';
                          const idToUse = (rollNo && rollNo !== '—') ? rollNo : regNo;
                          setSubmissionFile(`${idToUse}_${subCode}_Submission.pdf`);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove attached file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Drag & Drop Upload Zone */
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleSelectedFile(f);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
                      isDraggingFile
                        ? 'border-indigo-500 bg-indigo-50/70 scale-[1.01]'
                        : 'border-slate-300 bg-slate-50/70 hover:bg-indigo-50/30 hover:border-indigo-400'
                    }`}
                  >
                    <div className="w-10 h-10 mx-auto mb-2 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-indigo-600">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Click to browse or drag & drop solution file
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Upload your PDF or Word document (.pdf, .docx, .doc)
                    </p>
                    <div className="flex items-center justify-center gap-1.5 mt-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">.PDF</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">.DOCX</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold">.DOC</span>
                    </div>
                  </div>
                )}

                {/* Submission File Name / Label Field */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-600">Submission File / Report Name</span>
                    <span className="text-[10px] text-slate-400 font-mono">Format: RollNo_Course_Solution</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={submissionFile}
                      onChange={(e) => setSubmissionFile(e.target.value)}
                      placeholder="e.g. 24BCS001_DataStructures_Assignment.pdf"
                      className="w-full pl-3.5 pr-20 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:border-indigo-500 focus:outline-none shadow-2xs"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase">
                      {submissionFile?.split('.').pop() || 'PDF'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Optional Comments / Notes */}
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">
                  Submission Notes or Online Solution (Optional)
                </label>
                <textarea
                  rows="3"
                  value={submissionComment}
                  onChange={(e) => setSubmissionComment(e.target.value)}
                  placeholder="Add any notes for your faculty evaluator or paste solution summary..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-indigo-500 focus:outline-none shadow-2xs resize-none"
                />
              </div>

              {/* Student Identity Confirmation */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 text-blue-900 font-medium">
                  <IdCard className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Submitting as: <strong>{name}</strong> ({rollNo && rollNo !== '—' ? rollNo : regNo})</span>
                </div>
                <span className="text-[10px] bg-blue-200/70 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                  Verified
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setSubmittingAssignment(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Solution</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Tooltip for Sidebar Icons */}
      {hoveredTooltip && (
        <div
          className="fixed z-[9999] pointer-events-none px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-2xl transition-opacity duration-150 whitespace-nowrap flex items-center select-none"
          style={{
            top: `${hoveredTooltip.top}px`,
            left: `${hoveredTooltip.left}px`,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-slate-900" />
          <span>{hoveredTooltip.name}</span>
        </div>
      )}

      {/* Logout Confirmation Modal Matching Admin */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowLogoutModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-sm text-center z-10 border border-slate-200 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Sign Out Confirmation</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Are you sure you want to end your Student session?
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md shadow-red-500/20 transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
