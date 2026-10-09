import React, { useState, useEffect } from 'react';
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
  TrendingUp,
  IdCard,
  IndianRupee,
  GraduationCap,
  Search
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

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
  const [showPassword, setShowPassword] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [marksData, setMarksData] = useState([]);
  const [allocatedHall, setAllocatedHall] = useState('Exam Hall 101 (Main Block)');
  const [allocatedSeat, setAllocatedSeat] = useState('H101-14');
  const [liveExams, setLiveExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [submittedAssignmentIds, setSubmittedAssignmentIds] = useState(new Set());

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
  const attendance = student?.attendance !== undefined ? student.attendance : 85;
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

  // Fetch student's real internal marks & attendance if available
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/attendance`).then(r => r.json()).catch(() => ({ sessions: [] })),
      fetch(`${API_BASE}/api/internal-marks`).then(r => r.json()).catch(() => ({ data: [] }))
    ]).then(([attRes, marksRes]) => {
      // Find matching attendance
      const sessions = attRes.sessions || attRes.data || [];
      const myAtt = [];
      const rLower = (rollNo || '').toLowerCase();
      const regLower = (regNo || '').toLowerCase();
      sessions.forEach(sess => {
        (sess.records || []).forEach(r => {
          const recRoll = (r.rollNo || '').toLowerCase();
          if (recRoll && (recRoll === rLower || recRoll === regLower)) {
            myAtt.push({
              date: sess.date || '—',
              slot: sess.slot || 'Hour 1',
              classCode: sess.classCode || sess.className || 'CS-101',
              status: r.status || 'Present'
            });
          }
        });
      });
      setAttendanceData(myAtt);

      // Find matching marks
      const allMarks = marksRes.data || marksRes.marks || [];
      const myMarks = [];
      allMarks.forEach(record => {
        (record.students || []).forEach(st => {
          const stRoll = (st.rollNo || '').toLowerCase();
          const stReg = (st.regNo || '').toLowerCase();
          if ((stRoll && stRoll === rLower) || (stReg && stReg === regLower)) {
            myMarks.push({
              subject: record.subjectName || record.classCode || 'Core Course',
              examType: record.examType || 'Continuous Assessment',
              maxMarks: record.maxMarks || 50,
              marksObtained: st.marksObtained !== undefined ? st.marksObtained : 42,
              status: st.status || 'Pass'
            });
          }
        });
      });
      setMarksData(myMarks);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // Fetch live hall ticket allocation for seating and room
    fetch(`${API_BASE}/api/hall-tickets`)
      .then(r => r.json())
      .then(htRes => {
        if (htRes.success && Array.isArray(htRes.data)) {
          const rLower = (rollNo || '').toLowerCase();
          const regLower = (regNo || '').toLowerCase();
          for (const plan of htRes.data) {
            const match = (plan.students || []).find(s => {
              const sRoll = (s.rollNo || '').toLowerCase();
              return sRoll && (sRoll === rLower || sRoll === regLower);
            });
            if (match && match.hallNo && match.hallNo !== 'Unassigned') {
              setAllocatedHall(match.hallNo);
              if (match.seatNo && match.seatNo !== '—') setAllocatedSeat(match.seatNo);
              break;
            }
          }
        }
      })
      .catch(() => {});

    // Fetch live exam schedules
    fetch(`${API_BASE}/api/exams`)
      .then(r => r.json())
      .then(exRes => {
        if (exRes.success && Array.isArray(exRes.exams) && exRes.exams.length > 0) {
          setLiveExams(exRes.exams);
        }
      })
      .catch(() => {});
  }, [rollNo, regNo]);

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
              <div class="title">Vivekanandha College of Arts and Sciences</div>
              <div class="sub">Autonomous Institution • Vellalankulam Campus</div>
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
VIVEKANANDHA COLLEGE OF ARTS AND SCIENCES (AUTONOMOUS)
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

  // Print Hall Ticket Handler
  const handlePrintHallTicket = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      alert('Please allow popups to view and print your Hall Ticket.');
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Autonomous Examination Hall Ticket - ${name} (${regNo})</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 12px; }
          .border-box { border: 2px solid #1e3a8a; padding: 16px; border-radius: 8px; }
          .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 15px; }
          .title { font-size: 18px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; }
          .sub { font-size: 12px; font-weight: 700; color: #475569; margin-top: 3px; }
          .badge { display: inline-block; background: #1e3a8a; color: white; padding: 4px 16px; border-radius: 4px; font-weight: 800; font-size: 11px; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
          .details-grid { display: grid; grid-template-columns: 3fr 1fr; gap: 15px; margin-bottom: 15px; }
          table.details { width: 100%; border-collapse: collapse; }
          table.details td { padding: 4px 6px; font-size: 11.5px; }
          table.details td.lbl { width: 35%; font-weight: 700; color: #475569; }
          table.details td.val { width: 65%; font-weight: 800; color: #0f172a; }
          .photo-box { border: 1.5px solid #cbd5e1; border-radius: 6px; height: 130px; display: flex; align-items: center; justify-content: center; text-align: center; background: #f8fafc; font-size: 11px; font-weight: 700; color: #64748b; }
          table.timetable { width: 100%; border-collapse: collapse; margin-top: 15px; }
          table.timetable th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #1e3a8a; }
          table.timetable td { border: 1px solid #cbd5e1; padding: 7px 6px; font-size: 11px; text-align: center; }
          .instructions { margin-top: 15px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 10px; color: #64748b; }
          .instructions ul { margin: 4px 0 0 16px; padding: 0; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 20px; font-size: 11px; font-weight: 800; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="border-box">
          <div class="header">
            <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:6px;">
              ${getCollegeLogoHtml(46)}
              <div>
                <div class="title">Vivekanandha College of Arts and Sciences</div>
                <div class="sub">Autonomous Institution • Affiliated to Periyar University</div>
              </div>
            </div>
            <div class="badge">End Semester Autonomous Examination Hall Ticket</div>
          </div>

          <div class="details-grid">
            <table class="details">
              <tr><td class="lbl">Register Number (Reg No):</td><td class="val" style="font-family:monospace;font-size:13px;color:#1e3a8a;">${regNo}</td></tr>
              <tr><td class="lbl">Student Name:</td><td class="val">${name}</td></tr>
              <tr><td class="lbl">Roll Number:</td><td class="val">${rollNo}</td></tr>
              <tr><td class="lbl">Course / Degree:</td><td class="val">${course}</td></tr>
              <tr><td class="lbl">Department:</td><td class="val">${department}</td></tr>
              <tr><td class="lbl">Year / Semester:</td><td class="val">${year} / ${sem}</td></tr>
              <tr><td class="lbl">Examination Hall:</td><td class="val"><strong>${allocatedHall}</strong></td></tr>
              <tr><td class="lbl">Allotted Seat Number:</td><td class="val" style="font-family:monospace;font-weight:900;color:#1e3a8a;font-size:13px;">${allocatedSeat}</td></tr>
            </table>
            <div class="photo-box">
              <div>
                <div style="font-size:24px;margin-bottom:4px;">🎓</div>
                <span>Candidate Photo Verified</span>
              </div>
            </div>
          </div>

          <table class="timetable">
            <thead>
              <tr>
                <th>Date</th>
                <th>Session</th>
                <th>Subject Code</th>
                <th>Course / Subject Title</th>
                <th>Invigilator Sign</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>12/10/2026</td>
                <td>FN (10:00 AM - 01:00 PM)</td>
                <td>26CS301</td>
                <td style="text-align:left;font-weight:700;">Data Structures & Algorithms</td>
                <td></td>
              </tr>
              <tr>
                <td>14/10/2026</td>
                <td>FN (10:00 AM - 01:00 PM)</td>
                <td>26CS302</td>
                <td style="text-align:left;font-weight:700;">Database Management Systems</td>
                <td></td>
              </tr>
              <tr>
                <td>16/10/2026</td>
                <td>FN (10:00 AM - 01:00 PM)</td>
                <td>26CS303</td>
                <td style="text-align:left;font-weight:700;">Operating Systems & Architecture</td>
                <td></td>
              </tr>
              <tr>
                <td>18/10/2026</td>
                <td>FN (10:00 AM - 01:00 PM)</td>
                <td>26CS304</td>
                <td style="text-align:left;font-weight:700;">Web Technology & Full Stack Lab</td>
                <td></td>
              </tr>
              <tr>
                <td>20/10/2026</td>
                <td>FN (10:00 AM - 01:00 PM)</td>
                <td>26CS305</td>
                <td style="text-align:left;font-weight:700;">Software Engineering & Testing</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div class="instructions">
            <strong>Important Instructions for Candidate:</strong>
            <ul>
              <li>Candidates must bring this Hall Ticket along with their College ID Card for every exam session.</li>
              <li>Entry into the examination hall is prohibited after 30 minutes of commencement.</li>
              <li>Possession of mobile phones, smartwatches, or programmable calculators inside the hall is strictly prohibited.</li>
            </ul>
          </div>

          <div class="signatures">
            <div>Signature of Candidate</div>
            <div>Chief Superintendent</div>
            <div>Controller of Examinations</div>
          </div>
        </div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const weeklyTimetable = {
    'Monday': [
      { slot: 1, time: '8:30 - 9:20 AM', code: 'CS301', subject: 'Data Structures & Algorithms', faculty: 'Dr. K. Ramesh', room: 'LH-102', type: 'theory' },
      { slot: 2, time: '9:20 - 10:10 AM', code: 'CS302', subject: 'Database Management Systems', faculty: 'Prof. M. Priya', room: 'LH-102', type: 'theory' },
      { slot: 3, time: '10:10 - 11:00 AM', code: 'MAT201', subject: 'Discrete Mathematics', faculty: 'Dr. S. Anand', room: 'LH-102', type: 'theory' },
      { slot: 4, time: '11:15 - 12:05 PM', code: 'CS303L', subject: 'Data Structures Lab', faculty: 'Dr. K. Ramesh', room: 'CS Lab 2', type: 'lab' },
      { slot: 5, time: '12:05 - 12:55 PM', code: 'CS303L', subject: 'Data Structures Lab', faculty: 'Dr. K. Ramesh', room: 'CS Lab 2', type: 'lab' },
      { slot: 6, time: '1:45 - 2:35 PM', code: 'ENG102', subject: 'Professional Communication', faculty: 'Mrs. L. Vani', room: 'LH-102', type: 'theory' }
    ],
    'Tuesday': [
      { slot: 1, time: '8:30 - 9:20 AM', code: 'CS304', subject: 'Operating Systems & Architecture', faculty: 'Dr. R. Suresh', room: 'LH-102', type: 'theory' },
      { slot: 2, time: '9:20 - 10:10 AM', code: 'CS301', subject: 'Data Structures & Algorithms', faculty: 'Dr. K. Ramesh', room: 'LH-102', type: 'theory' },
      { slot: 3, time: '10:10 - 11:00 AM', code: 'CS302', subject: 'Database Management Systems', faculty: 'Prof. M. Priya', room: 'LH-102', type: 'theory' },
      { slot: 4, time: '11:15 - 12:05 PM', code: 'CS305L', subject: 'RDBMS & SQL Lab', faculty: 'Prof. M. Priya', room: 'CS Lab 1', type: 'lab' },
      { slot: 5, time: '12:05 - 12:55 PM', code: 'CS305L', subject: 'RDBMS & SQL Lab', faculty: 'Prof. M. Priya', room: 'CS Lab 1', type: 'lab' },
      { slot: 6, time: '1:45 - 2:35 PM', code: 'EVS101', subject: 'Environmental Studies', faculty: 'Dr. G. Lakshmi', room: 'LH-102', type: 'theory' }
    ],
    'Wednesday': [
      { slot: 1, time: '8:30 - 9:20 AM', code: 'MAT201', subject: 'Discrete Mathematics', faculty: 'Dr. S. Anand', room: 'LH-102', type: 'theory' },
      { slot: 2, time: '9:20 - 10:10 AM', code: 'CS304', subject: 'Operating Systems & Architecture', faculty: 'Dr. R. Suresh', room: 'LH-102', type: 'theory' },
      { slot: 3, time: '10:10 - 11:00 AM', code: 'CS306', subject: 'Web Technology & Design', faculty: 'Mr. P. Vijay', room: 'LH-102', type: 'theory' },
      { slot: 4, time: '11:15 - 12:05 PM', code: 'CS301', subject: 'Data Structures & Algorithms', faculty: 'Dr. K. Ramesh', room: 'LH-102', type: 'theory' },
      { slot: 5, time: '12:05 - 12:55 PM', code: 'CS302', subject: 'Database Management Systems', faculty: 'Prof. M. Priya', room: 'LH-102', type: 'theory' },
      { slot: 6, time: '1:45 - 2:35 PM', code: 'LIB101', subject: 'Library & Research Hour', faculty: 'Librarian', room: 'Central Library', type: 'theory' }
    ],
    'Thursday': [
      { slot: 1, time: '8:30 - 9:20 AM', code: 'CS306', subject: 'Web Technology & Design', faculty: 'Mr. P. Vijay', room: 'LH-102', type: 'theory' },
      { slot: 2, time: '9:20 - 10:10 AM', code: 'MAT201', subject: 'Discrete Mathematics', faculty: 'Dr. S. Anand', room: 'LH-102', type: 'theory' },
      { slot: 3, time: '10:10 - 11:00 AM', code: 'CS304', subject: 'Operating Systems & Architecture', faculty: 'Dr. R. Suresh', room: 'LH-102', type: 'theory' },
      { slot: 4, time: '11:15 - 12:05 PM', code: 'CS307L', subject: 'Web Development Lab', faculty: 'Mr. P. Vijay', room: 'CS Lab 3', type: 'lab' },
      { slot: 5, time: '12:05 - 12:55 PM', code: 'CS307L', subject: 'Web Development Lab', faculty: 'Mr. P. Vijay', room: 'CS Lab 3', type: 'lab' },
      { slot: 6, time: '1:45 - 2:35 PM', code: 'SEM101', subject: 'Student Seminar & Presentation', faculty: 'Dr. K. Ramesh', room: 'LH-102', type: 'theory' }
    ],
    'Friday': [
      { slot: 1, time: '8:30 - 9:20 AM', code: 'CS301', subject: 'Data Structures & Algorithms', faculty: 'Dr. K. Ramesh', room: 'LH-102', type: 'theory' },
      { slot: 2, time: '9:20 - 10:10 AM', code: 'CS302', subject: 'Database Management Systems', faculty: 'Prof. M. Priya', room: 'LH-102', type: 'theory' },
      { slot: 3, time: '10:10 - 11:00 AM', code: 'CS306', subject: 'Web Technology & Design', faculty: 'Mr. P. Vijay', room: 'LH-102', type: 'theory' },
      { slot: 4, time: '11:15 - 12:05 PM', code: 'CS304', subject: 'Operating Systems & Architecture', faculty: 'Dr. R. Suresh', room: 'LH-102', type: 'theory' },
      { slot: 5, time: '12:05 - 12:55 PM', code: 'MAT201', subject: 'Discrete Mathematics', faculty: 'Dr. S. Anand', room: 'LH-102', type: 'theory' },
      { slot: 6, time: '1:45 - 2:35 PM', code: 'SPO101', subject: 'Physical Education / Sports', faculty: 'Director of PE', room: 'Sports Ground', type: 'theory' }
    ]
  };

  const studentAssignments = [
    { id: 'as-1', code: 'CS301', subject: 'Data Structures', title: 'Binary Search Tree & Graph Traversal Implementation', dueDate: '15/10/2026', maxMarks: 20, defaultStatus: 'Submitted', score: '19/20' },
    { id: 'as-2', code: 'CS302', subject: 'Database Management', title: 'Normalization up to BCNF & Schema Design Project', dueDate: '18/10/2026', maxMarks: 20, defaultStatus: 'Submitted', score: '18/20' },
    { id: 'as-3', code: 'CS304', subject: 'Operating Systems', title: 'Process Scheduling Algorithms Simulation in C', dueDate: '22/10/2026', maxMarks: 25, defaultStatus: 'Pending', score: 'Pending' },
    { id: 'as-4', code: 'CS306', subject: 'Web Technology', title: 'Responsive Portfolio with HTML5, CSS & React', dueDate: '26/10/2026', maxMarks: 25, defaultStatus: 'Pending', score: 'Pending' }
  ];

  const examTimetable = [
    { date: '12/10/2026', session: 'FN (10:00 AM - 01:00 PM)', code: '26CS301', subject: 'Data Structures & Algorithms', hall: 'Main Exam Hall (Hall 2)' },
    { date: '14/10/2026', session: 'FN (10:00 AM - 01:00 PM)', code: '26CS302', subject: 'Database Management Systems', hall: 'Main Exam Hall (Hall 2)' },
    { date: '16/10/2026', session: 'FN (10:00 AM - 01:00 PM)', code: '26CS303', subject: 'Operating Systems & Architecture', hall: 'Main Exam Hall (Hall 2)' },
    { date: '18/10/2026', session: 'FN (10:00 AM - 01:00 PM)', code: '26CS304', subject: 'Web Technology & Design', hall: 'Main Exam Hall (Hall 2)' },
    { date: '20/10/2026', session: 'FN (10:00 AM - 01:00 PM)', code: '26CS305', subject: 'Discrete Mathematics', hall: 'Main Exam Hall (Hall 2)' }
  ];

  // Sidebar Component Matching Admin Style Exactly
  const SidebarContent = () => (
    <div className="flex flex-col justify-between h-full bg-white">
      <div>
        {/* Sticky Header Matching Admin */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-100 p-5 sm:p-6 flex items-center justify-between shadow-2xs">
          <CollegeLogo size="md" showText={true} />
          <button 
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Quick Profile Card in Sidebar */}
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

        {/* Categorized Navigation Links Matching Admin */}
        <nav className="p-4 space-y-6">
          {NAV_SECTIONS.map((section, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.name;
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

      {/* Sticky Bottom Sign Out Matching Admin */}
      <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0">
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
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-slate-200 shadow-xs overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-white h-full overflow-y-auto flex flex-col z-10 border-r border-slate-200 shadow-2xl">
            <SidebarContent />
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

            {/* User Avatar & Role Badge Matching Admin */}
            <div 
              onClick={() => setActiveNav('Student Information')}
              className="flex items-center gap-2.5 cursor-pointer group"
              title="Student Particulars"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs text-white ring-2 ring-blue-300 bg-gradient-to-tr from-blue-600 to-indigo-600">
                {name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                  {name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-700 border border-blue-200">
                    🎓 Student
                  </span>
                </div>
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
                    <p className="text-2xl font-extrabold text-slate-900 leading-none mb-2">{attendance}%</p>
                    <p className="text-xs font-semibold flex items-center gap-1 text-emerald-600">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {attendance >= 75 ? 'Eligibility Cleared' : 'Shortage Alert'}
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
                      Autonomous Exams Cleared
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
                    <p className="text-2xl font-extrabold text-slate-900 leading-none mb-2">Active</p>
                    <p className="text-xs font-semibold flex items-center gap-1 text-indigo-600">
                      Continuous Assessment
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-xs shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                </div>

                {/* 6. Current Semester */}
                <div 
                  onClick={() => setActiveNav('Timetable')}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex items-start justify-between cursor-pointer hover:border-blue-300"
                >
                  <div>
                    <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">TIMETABLE</p>
                    <p className="text-2xl font-extrabold text-slate-900 leading-none mb-2">6 Periods</p>
                    <p className="text-xs font-semibold flex items-center gap-1 text-teal-600">
                      Monday to Friday
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
                    <p className="text-2xl font-extrabold text-slate-900 leading-none mb-2">4 Active</p>
                    <p className="text-xs font-semibold flex items-center gap-1 text-purple-600">
                      2 Submitted · 2 Pending
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
                      Autonomous Exam Ready
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
                  <span className="text-xs font-medium text-slate-400">Autonomous Self-Service</span>
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
                      <h4 className="text-base font-black text-slate-900 uppercase">Vivekanandha College of Arts and Sciences</h4>
                      <p className="text-xs text-slate-500">Autonomous Institution • Vellalankulam Campus</p>
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
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Student Attendance Tracker</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Verified class hour attendance records for current semester.</p>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black">
                    Current Rate: {attendance}%
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Hour / Period</th>
                        <th className="py-3 px-4">Course / Class</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendanceData.length > 0 ? (
                        attendanceData.map((att, i) => (
                          <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-medium text-slate-800">{att.date}</td>
                            <td className="py-3 px-4 text-slate-600">{att.slot}</td>
                            <td className="py-3 px-4 font-bold text-blue-700">{att.classCode}</td>
                            <td className="py-3 px-4 text-right">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                att.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {att.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-slate-400 font-medium">
                            No attendance discrepancies recorded. Total estimated attendance: {attendance}%.
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
          {/* TAB 5: INTERNAL MARKS                                       */}
          {/* ─────────────────────────────────────────────────────────── */}
          {activeNav === 'Internal Marks' && (
            <div className="space-y-6 w-full max-w-7xl mx-auto animate-fadeIn">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Internal Assessment Marks & Continuous Evaluation</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Verified scores registered by faculty members.</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
                    Reg No: {regNo}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Exam Type</th>
                        <th className="py-3 px-4 text-center">Max Marks</th>
                        <th className="py-3 px-4 text-center">Marks Obtained</th>
                        <th className="py-3 px-4 text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {marksData.length > 0 ? (
                        marksData.map((m, i) => (
                          <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">{m.subject}</td>
                            <td className="py-3 px-4 text-slate-600">{m.examType}</td>
                            <td className="py-3 px-4 text-center font-mono">{m.maxMarks}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-blue-700">{m.marksObtained}</td>
                            <td className="py-3 px-4 text-right">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">
                            Internal examination scores are updated periodically by your department.
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
          {/* TAB 6: TIMETABLE VIEW                                       */}
          {/* ─────────────────────────────────────────────────────────── */}
          {activeNav === 'Timetable' && (
            <div className="space-y-6 w-full max-w-7xl mx-auto animate-fadeIn">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
                
                {/* Header matching Admin */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Weekly Academic Timetable</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Class schedule for {course} ({year} • {sem})
                    </p>
                  </div>
                  
                  {/* Day Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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

                {/* Timetable Table Matching Admin */}
                <div className="overflow-x-auto">
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
                      {(weeklyTimetable[selectedDay] || []).map((slot, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-800">Hour {slot.slot}</td>
                          <td className="py-3.5 px-4 text-slate-500 font-medium">{slot.time}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{slot.code}</td>
                          <td className="py-3.5 px-4 font-extrabold text-slate-900">{slot.subject}</td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">{slot.faculty}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-700">{slot.room}</td>
                          <td className="py-3.5 px-4 text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              slot.type === 'lab' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {slot.type.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
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
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
                
                {/* Header matching Admin */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Assignments & Course Projects</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Assigned coursework, continuous assessment submissions, and project status.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
                    {studentAssignments.length} Continuous Coursework(s)
                  </span>
                </div>

                {/* Assignments Table Matching Admin */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Assignment Title</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4 text-center">Max Marks</th>
                        <th className="py-3 px-4 text-center">Score / Grade</th>
                        <th className="py-3 px-4 text-right">Submission Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentAssignments.map((a) => {
                        const isSubmitted = submittedAssignmentIds.has(a.id) || a.defaultStatus === 'Submitted';
                        return (
                          <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                              {a.code} · <span className="font-sans font-medium text-slate-600">{a.subject}</span>
                            </td>
                            <td className="py-3.5 px-4 font-extrabold text-slate-900 max-w-xs">{a.title}</td>
                            <td className="py-3.5 px-4 font-medium text-slate-600">{a.dueDate}</td>
                            <td className="py-3.5 px-4 text-center font-mono font-bold">{a.maxMarks}</td>
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-purple-700">
                              {isSubmitted ? (a.score === 'Pending' ? 'Under Review' : a.score) : '—'}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {isSubmitted ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Submitted
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSubmittedAssignmentIds(prev => new Set([...prev, a.id]));
                                    alert(`Assignment "${a.title}" marked as submitted!`);
                                  }}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition-all cursor-pointer"
                                >
                                  Submit Solution
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
                    <h3 className="text-lg font-black text-slate-900">Autonomous Examination Hall Ticket</h3>
                    <p className="text-xs text-slate-500">Official admit card for End Semester Autonomous Examinations.</p>
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
                          Autonomous Exam Eligibility Clearance &amp; Seating Allotment
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

                {/* Printable Hall Ticket Preview Card */}
                <div className="border-2 border-blue-900/40 rounded-2xl p-6 sm:p-8 bg-white space-y-6 shadow-xs">
                  
                  {/* College Header */}
                  <div className="text-center border-b-2 border-blue-900 pb-4">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <CollegeLogo size="sm" showText={false} />
                      <div>
                        <h4 className="text-base font-black text-blue-950 uppercase tracking-wide">Vivekanandha College of Arts and Sciences</h4>
                        <p className="text-[11px] font-bold text-slate-600">Autonomous Institution • Affiliated to Periyar University</p>
                      </div>
                    </div>
                    <span className="inline-block bg-blue-900 text-white px-4 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider mt-1">
                      End Semester Autonomous Examination Hall Ticket
                    </span>
                  </div>

                  {/* Candidate Particulars & Photo Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Register Number (Reg No)</span>
                        <strong className="text-blue-800 font-mono text-sm">{regNo}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Student Name</span>
                        <strong className="text-slate-900 text-sm">{name}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Course / Degree</span>
                        <strong className="text-slate-800">{course}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Department</span>
                        <strong className="text-slate-800">{department}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Year / Semester</span>
                        <strong className="text-amber-800">{year} / {sem}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Examination Hall &amp; Seat No</span>
                        <strong className="text-blue-900 font-mono font-bold">{allocatedHall} ({allocatedSeat})</strong>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 text-center">
                      <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl mb-2">
                        {name.charAt(0)}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">Candidate Photo</span>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-200">
                        Verified Pass
                      </span>
                    </div>
                  </div>

                  {/* Examination Timetable Table */}
                  <div>
                    <h5 className="text-xs font-extrabold uppercase text-slate-900 mb-2">Examination Schedule</h5>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-[10px] font-extrabold uppercase text-blue-900 border-b border-slate-200">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Session & Time</th>
                            <th className="py-2.5 px-3">Subject Code</th>
                            <th className="py-2.5 px-3">Subject Title</th>
                            <th className="py-2.5 px-3 text-right">Invigilator Sign</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {examTimetable.map((e, idx) => (
                            <tr key={idx}>
                              <td className="py-2.5 px-3 font-bold text-slate-800">{e.date}</td>
                              <td className="py-2.5 px-3 text-slate-600 font-medium">{e.session}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{e.code}</td>
                              <td className="py-2.5 px-3 font-extrabold text-slate-900">{e.subject}</td>
                              <td className="py-2.5 px-3 text-right text-slate-300">__________</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Rules and Signatures */}
                  <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-600 space-y-4">
                    <div>
                      <strong className="text-slate-800">Important Instructions:</strong>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        1. Candidate must produce this hall ticket and college identity card at every examination session. 2. Electronic devices, smartwatches, and study notes are strictly forbidden.
                      </p>
                    </div>
                    <div className="flex justify-between pt-6 px-4 font-bold text-xs text-slate-800">
                      <div>Signature of Candidate</div>
                      <div>Chief Superintendent</div>
                      <div>Controller of Examinations</div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

        </main>
      </div>

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
