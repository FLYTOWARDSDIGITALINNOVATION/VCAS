import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Edit, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  AlertTriangle,
  BookOpen, 
  Award, 
  FileText, 
  Calendar,
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  GraduationCap, 
  Key, 
  Printer,
  Clock,
  Check,
  FileCheck,
  ShieldCheck,
  Layers,
  Loader2
} from 'lucide-react';
import { API_BASE } from '../apiConfig';

export default function StudentProfileView({ 
  student, 
  onBack, 
  user, 
  canViewFees = (user?.role === 'Accountant' || user?.role === 'Office Staff' || user?.role === 'Super Admin' || user?.isSuperAdmin), 
  onDownloadCredentials, 
  onPrintCredentials, 
  onEdit 
}) {
  const isSuperAdmin = user?.role === 'Super Admin' || user?.isSuperAdmin;
  const [activeTab, setActiveTab] = useState('Overview');
  const [previewModalDoc, setPreviewModalDoc] = useState(null);

  // Helper to ensure ONLY real entered data is shown, displaying '—' for empty/unspecified fields
  const val = (v) => (v !== null && v !== undefined && String(v).trim() !== '' ? String(v).trim() : '—');

  const studentData = {
    name: student?.name || student?.fullName || 'Student',
    id: student?.regNo || student?.studentId || student?.id || '—',
    regNo: student?.regNo || student?.studentId || student?.id || '—',
    admNo: student?.admNo || student?.admissionNo || '—',
    rollNo: student?.rollNo || '—',
    year: val(student?.year || '1st Year'),
    loginId: val(student?.loginId || student?.regNo || student?.studentId || student?.id),
    course: val(student?.course),
    department: val(student?.department),
    sem: val(student?.sem || student?.semester),
    status: student?.status || 'Active',
    attendance: student?.attendance !== null && student?.attendance !== undefined ? student.attendance : null,
    feeStatus: student?.feeStatus || '—',
    cgpa: val(student?.cgpa),
    rank: val(student?.rank),

    // Personal Info - ONLY real entered data
    dob: val(student?.dob),
    gender: val(student?.gender),
    bloodGroup: val(student?.bloodGroup),
    email: val(student?.email),
    mobile: val(student?.mobile || student?.phone),

    // Statutory and Government IDs
    aadhaar: val(student?.aadhaar),
    pan: val(student?.pan),
    drivingLicense: val(student?.drivingLicense),
    emisNumber: val(student?.emisNumber),
    nationality: val(student?.nationality || 'Indian'),
    caste: val(student?.caste || student?.casteCommunity),
    religion: val(student?.religion || 'Hindu'),
    donation: val(student?.donation || 'Nil'),

    // Academic Qualifications
    tenthMarks: val(student?.tenthMarks || student?.tenthPercentage ? `${student?.tenthMarks || ''} (${student?.tenthPercentage || ''}%)` : student?.doc10th),
    twelfthMarks: val(student?.twelfthMarks || student?.twelfthPercentage ? `${student?.twelfthMarks || ''} (${student?.twelfthPercentage || ''}%)` : student?.doc12th),

    // Bank Account Details
    bankName: val(student?.bankName),
    bankAccountNo: val(student?.bankAccountNo),
    ifscCode: val(student?.ifscCode),
    bankBranch: val(student?.bankBranch),

    // Academic Info - ONLY real entered data
    section: val(student?.section),
    batch: val(student?.batch || student?.academicYear),

    // Parent Info - ONLY real entered data
    fatherName: val(student?.fatherName),
    motherName: val(student?.motherName),
    fatherMobile: val(student?.fatherMobile || student?.parentMobile),
    motherMobile: val(student?.motherMobile),
    parentOccupation: val(student?.parentOccupation),
    parentEmail: val(student?.parentEmail),

    // Official Certificate 1-8 Fields
    nationalityReligion: val(student?.nationalityReligion || `${student?.nationality || 'INDIAN'} & ${student?.religion || 'HINDU'}`),
    casteCommunity: val(student?.casteCommunity || student?.caste),
    dateOfAdmission: val(student?.dateOfAdmission || student?.admissionDate),
    courseAdmitted: val(student?.courseAdmitted || student?.course || student?.department),

    // Address - ONLY real entered data
    address: val(student?.address),
    city: val(student?.city),
    pinCode: val(student?.pinCode),
    state: val(student?.state),
    country: val(student?.country)
  };

  const tabs = ['Overview', 'Attendance', ...(canViewFees ? ['Fees'] : []), 'Examination', 'Assignments', 'Documents'];

  const subjectCodes = (() => {
    const values = [];
    const entries = Array.isArray(student?.subjects) ? student.subjects : [];
    entries.forEach(item => {
      const code = typeof item === 'string' ? item : (item?.code || item?.subjectCode || '');
      if (code && !values.includes(code)) values.push(code);
    });
    const extras = [
      student?.subjectCode,
      student?.subjectCodes,
      student?.assignedSubjectCode,
      student?.currentSubjectCode,
      student?.subject?.code,
      student?.courseCode,
      student?.examSubjectCode
    ];
    extras.forEach(value => {
      if (value && typeof value === 'string') {
        const split = value.split(/[|,;]+/).map(s => s.trim()).filter(Boolean);
        split.forEach(code => {
          if (!values.includes(code)) values.push(code);
        });
      }
    });
    if (Array.isArray(student?.subjectsList)) {
      student.subjectsList.forEach(item => {
        const code = typeof item === 'string' ? item : (item?.code || item?.subjectCode || '');
        if (code && !values.includes(code)) values.push(code);
      });
    }
    return values;
  })();

  const arrearCount = Number(student?.totalArrearsTillLastSem || student?.totalArrears || student?.arrearsYetToBeCleared || student?.backlogs || 0);
  const clearedArrears = Number(student?.arrearsClearedThisSem || student?.arrearsCleared || 0);
  const pendingArrears = Math.max(0, arrearCount - clearedArrears);

  // State for fetched tab records
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [marksRecords, setMarksRecords] = useState([]);
  const [scheduledExams, setScheduledExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Student identifier matching helper
  const studentRoll = (student?.rollNo || '').trim().toLowerCase();
  const studentAdm = (student?.admNo || student?.admissionNo || '').trim().toLowerCase();
  const studentIdStr = (student?.studentId || student?.id || '').trim().toLowerCase();
  const studentNameStr = (student?.name || student?.fullName || '').trim().toLowerCase();

  const isMatchingStudent = (identifier, name) => {
    const id = (identifier || '').trim().toLowerCase();
    const nm = (name || '').trim().toLowerCase();
    if (studentRoll && id === studentRoll) return true;
    if (studentAdm && id === studentAdm) return true;
    if (studentIdStr && id === studentIdStr) return true;
    if (studentNameStr && nm && (nm === studentNameStr || nm.includes(studentNameStr) || studentNameStr.includes(nm))) return true;
    return false;
  };

  // 1. Fetch Real Attendance Records for this Student
  useEffect(() => {
    if (activeTab === 'Attendance' || activeTab === 'Overview') {
      setAttendanceLoading(true);
      fetch(`${API_BASE}/attendance`)
        .then(res => res.json())
        .then(data => {
          const sessions = data.sessions || (Array.isArray(data) ? data : (data.data || []));
          const matched = [];
          sessions.forEach(sess => {
            const records = Array.isArray(sess.records) ? sess.records : [];
            const studentEntry = records.find(r => isMatchingStudent(r.rollNo, r.name));
            if (studentEntry) {
              matched.push({
                date: sess.date || '—',
                slot: sess.slot || '8:30 AM',
                classCode: sess.classCode || sess.className || 'General',
                className: sess.className || sess.classCode || 'General',
                staffName: sess.staffName || 'Faculty',
                status: studentEntry.status || 'Present',
                remarks: studentEntry.remarks || '—'
              });
            }
          });
          setAttendanceRecords(matched);
        })
        .catch(err => console.error('Error fetching student attendance:', err))
        .finally(() => setAttendanceLoading(false));
    }
  }, [activeTab, student]);

  // 2. Fetch Real Examination / Marks Records for this Student
  useEffect(() => {
    if (activeTab === 'Examination') {
      setExamsLoading(true);
      Promise.all([
        fetch(`${API_BASE}/internal-marks`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE}/exams`).then(r => r.json()).catch(() => ({ exams: [] }))
      ]).then(([marksData, examsData]) => {
        // Process marks
        const sheets = Array.isArray(marksData?.data)
          ? marksData.data
          : Array.isArray(marksData?.marksheets)
            ? marksData.marksheets
            : Array.isArray(marksData)
              ? marksData
              : [];
        const matchedMarks = [];
        sheets.forEach(sheet => {
          const list = Array.isArray(sheet.students) ? sheet.students : [];
          const studentEntry = list.find(s => isMatchingStudent(s.rollNo, s.name));
          if (studentEntry) {
            matchedMarks.push({
              subjectCode: sheet.subjectCode || '—',
              subjectName: sheet.subjectName || 'Coursework',
              semester: sheet.semester || '—',
              staffName: sheet.staffName || 'Faculty',
              maxMarks: sheet.maxMarks || {},
              passMarks: sheet.passMarks || {},
              marks: studentEntry
            });
          }
        });
        setMarksRecords(matchedMarks);

        // Process exams
        const allExams = examsData.exams || (Array.isArray(examsData) ? examsData : (examsData.data || []));
        const filteredExams = allExams.filter(e => {
          if (!e.department || e.department === 'All Departments') return true;
          return e.department.toLowerCase() === (student?.department || '').toLowerCase();
        });
        setScheduledExams(filteredExams);
      }).finally(() => setExamsLoading(false));
    }
  }, [activeTab, student]);

  // 3. Fetch Real Assignments
  useEffect(() => {
    if (activeTab === 'Assignments') {
      setAssignmentsLoading(true);
      fetch(`${API_BASE}/assignments`)
        .then(res => res.json())
        .then(data => {
          const list = data.assignments || (Array.isArray(data) ? data : []);
          const dept = (student?.department || '').trim().toLowerCase();
          const filtered = list.filter(a => {
            if (!a.department || a.department === 'All Departments') return true;
            return a.department.trim().toLowerCase() === dept;
          });
          setAssignmentsList(filtered);
        })
        .catch(err => console.error('Error fetching assignments:', err))
        .finally(() => setAssignmentsLoading(false));
    }
  }, [activeTab, student]);

  // Compute live attendance rate
  const totalAttendedSessions = attendanceRecords.filter(r => r.status === 'Present').length;
  const liveAttendanceRate = attendanceRecords.length > 0 
    ? Math.round((totalAttendedSessions / attendanceRecords.length) * 100) 
    : (studentData.attendance !== null ? studentData.attendance : null);

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      
      {/* Back Navigation Link */}
      <button 
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </button>

      {/* HERO PROFILE HEADER CARD */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Avatar & Student Name Header */}
          <div className="flex items-start md:items-center gap-5">
            {student?.photo || studentData?.photo ? (
              <img
                src={student?.photo || studentData?.photo}
                alt={studentData.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-200 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-600 font-extrabold text-3xl flex items-center justify-center border border-blue-200 shadow-sm shrink-0 uppercase">
                {studentData.name.charAt(0)}
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900">{studentData.name}</h1>
                <span className="text-xs text-blue-700 font-bold font-mono">
                  Reg No: {studentData.regNo} 
                  {studentData.rollNo !== '—' ? ` • Roll: ${studentData.rollNo}` : ''}
                  {studentData.year !== '—' ? ` • ${studentData.year}` : ''}
                </span>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                {studentData.course !== '—' && (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                    {studentData.course}
                  </span>
                )}
                {studentData.department !== '—' && (
                  <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
                    {studentData.department}
                  </span>
                )}
                {studentData.sem !== '—' && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                    {studentData.sem}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-mono font-bold">
                  Batch: {student?.batch || studentData.batch || '2022-2026'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                  {studentData.status}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            {isSuperAdmin && (
              <>
                <button 
                  onClick={() => {
                    if (onDownloadCredentials) onDownloadCredentials(student || studentData);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  <span>Download Credentials & Data</span>
                </button>
                <button 
                  onClick={() => {
                    if (onPrintCredentials) onPrintCredentials(student || studentData);
                  }}
                  className="px-4 py-2.5 bg-white hover:bg-purple-50 text-purple-700 font-bold rounded-xl text-xs border border-purple-200 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-purple-600" />
                  <span>Print Slip</span>
                </button>
              </>
            )}
            <button 
              onClick={() => {
                if (onEdit) {
                  onEdit({
                    ...student,
                    _id: student?._id || student?.id,
                    studentId: student?.studentId || student?.id || studentData.id,
                    id: student?.studentId || student?.id || studentData.id,
                    name: student?.name || studentData.name,
                    admNo: student?.admNo || studentData.admNo,
                    phone: student?.phone || student?.mobile || studentData.mobile,
                    sem: student?.sem || studentData.sem,
                    department: student?.department || studentData.department,
                    course: student?.course || studentData.course
                  });
                }
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Edit className="w-4 h-4 text-slate-400" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Key Stats Row */}
        <div className={`grid grid-cols-2 ${canViewFees ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 pt-6 border-t border-slate-100 text-center md:text-left`}>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Attendance</span>
            <span className="text-xl font-extrabold text-emerald-600">
              {liveAttendanceRate !== null ? `${liveAttendanceRate}%` : '—'}
            </span>
          </div>

          {canViewFees && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fee Status</span>
              <span className={`text-xl font-extrabold ${studentData.feeStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {studentData.feeStatus}
              </span>
            </div>
          )}

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">CGPA</span>
            <span className="text-xl font-extrabold text-slate-900">{studentData.cgpa}</span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Rank</span>
            <span className="text-xl font-extrabold text-slate-900">{studentData.rank}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Department</p>
            <p className="mt-2 text-sm font-extrabold text-slate-900">{studentData.department}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Year / Semester</p>
            <p className="mt-2 text-sm font-extrabold text-slate-900">{studentData.year} • {studentData.sem}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Arrears</p>
            <p className="mt-2 text-sm font-extrabold text-rose-600">{pendingArrears} pending / {arrearCount} total</p>
          </div>
        </div>

        {subjectCodes.length > 0 && (
          <div className="mt-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Subject Codes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {subjectCodes.map(code => (
                <span key={code} className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold border border-indigo-200 bg-white text-indigo-700">
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SUB TABS NAVIGATION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm inline-flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW TAB: REAL ENTERED DATA ONLY */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          
          {/* Transfer Certificate Details (Fields 1–8) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 md:col-span-2">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Transfer Certificate Details (Fields 1–8)</span>
              </span>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
                Official College Record
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1">1. Student Name</span>
                <span className="font-extrabold text-slate-900 uppercase">{studentData.name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1">2. Gender</span>
                <span className="font-bold text-slate-800">{studentData.gender}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1">3. Date of Birth</span>
                <span className="font-bold text-slate-800">{studentData.dob}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1">4. Father's Name</span>
                <span className="font-bold text-slate-800 uppercase">{studentData.fatherName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1">5. Nationality & Religion</span>
                <span className="font-bold text-slate-800">{studentData.nationalityReligion}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1">6. Caste & Community</span>
                <span className="font-bold text-slate-800 uppercase">{studentData.casteCommunity}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1">7. Date of Admission</span>
                <span className="font-bold text-slate-800">{studentData.dateOfAdmission}</span>
              </div>
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
                <span className="text-blue-500 font-bold block mb-1">8. Course in Which Admitted</span>
                <span className="font-extrabold text-blue-900">{studentData.courseAdmitted}</span>
              </div>
            </div>
          </div>
          
          {/* Personal Information */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Personal Information</span>
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <span className="text-slate-400 font-medium">Full Name</span>
              <span className="font-bold text-slate-800">{studentData.name}</span>

              <span className="text-slate-400 font-medium">Date of Birth</span>
              <span className="font-bold text-slate-800">{studentData.dob}</span>

              <span className="text-slate-400 font-medium">Gender</span>
              <span className="font-bold text-slate-800">{studentData.gender}</span>

              <span className="text-slate-400 font-medium">Blood Group</span>
              <span className="font-bold text-slate-800">{studentData.bloodGroup}</span>

              <span className="text-slate-400 font-medium">Email</span>
              <span className="font-bold text-blue-600 font-mono">{studentData.email}</span>

              <span className="text-slate-400 font-medium">Mobile</span>
              <span className="font-bold text-slate-800 font-mono">{studentData.mobile}</span>
            </div>
          </div>

          {/* Academic Information */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span>Academic & Portal Identity</span>
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <span className="text-slate-400 font-medium">Register Number (Reg No)</span>
              <span className="font-bold text-purple-700 font-mono text-sm">{studentData.regNo}</span>

              <span className="text-slate-400 font-medium">Roll No.</span>
              <span className="font-bold text-slate-800 font-mono">{studentData.rollNo}</span>

              <span className="text-slate-400 font-medium">Year of Study</span>
              <span className="font-bold text-slate-800">{studentData.year}</span>

              <span className="text-slate-400 font-medium">Portal Login ID</span>
              <span className="font-bold text-slate-900 font-mono">{studentData.loginId}</span>

              <span className="text-slate-400 font-medium">Password (Date of Birth)</span>
              <span className="font-bold text-emerald-700 font-mono">{studentData.dob}</span>

              <span className="text-slate-400 font-medium">Admission No.</span>
              <span className="font-bold text-slate-800 font-mono">{studentData.admNo}</span>

              <span className="text-slate-400 font-medium">Course</span>
              <span className="font-bold text-slate-800">{studentData.course}</span>

              <span className="text-slate-400 font-medium">Department</span>
              <span className="font-bold text-slate-800">{studentData.department}</span>

              <span className="text-slate-400 font-medium">Semester</span>
              <span className="font-bold text-slate-800">{studentData.sem}</span>

              <span className="text-slate-400 font-medium">Donation</span>
              <span className="font-bold text-slate-800">{studentData.donation}</span>
            </div>
          </div>

          {/* Statutory and Government IDs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Government & Statutory Particulars</span>
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <span className="text-slate-400 font-medium">Aadhaar Number</span>
              <span className="font-bold text-slate-800 font-mono">{studentData.aadhaar}</span>

              <span className="text-slate-400 font-medium">PAN Number</span>
              <span className="font-bold text-slate-800 font-mono">{studentData.pan}</span>

              <span className="text-slate-400 font-medium">EMIS Number</span>
              <span className="font-bold text-slate-800 font-mono">{studentData.emisNumber}</span>

              <span className="text-slate-400 font-medium">Driving License</span>
              <span className="font-bold text-slate-800 font-mono">{studentData.drivingLicense}</span>

              <span className="text-slate-400 font-medium">10th Std Qualification</span>
              <span className="font-bold text-slate-800">{studentData.tenthMarks}</span>

              <span className="text-slate-400 font-medium">12th Std Qualification</span>
              <span className="font-bold text-slate-800">{studentData.twelfthMarks}</span>
            </div>
          </div>

          {/* Bank Account Details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>Student Bank Account Details</span>
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <span className="text-slate-400 font-medium">Bank Name</span>
              <span className="font-bold text-slate-800">{studentData.bankName}</span>

              <span className="text-slate-400 font-medium">Account Number</span>
              <span className="font-bold text-slate-800 font-mono">{studentData.bankAccountNo}</span>

              <span className="text-slate-400 font-medium">IFSC Code</span>
              <span className="font-bold text-slate-800 font-mono">{studentData.ifscCode}</span>

              <span className="text-slate-400 font-medium">Branch</span>
              <span className="font-bold text-slate-800">{studentData.bankBranch}</span>
            </div>
          </div>

          {/* Parent Information */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Parent / Guardian Information</span>
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <span className="text-slate-400 font-medium">Father Name</span>
              <span className="font-bold text-slate-800">{studentData.fatherName}</span>

              <span className="text-slate-400 font-medium">Mother Name</span>
              <span className="font-bold text-slate-800">{studentData.motherName}</span>

              <span className="text-slate-400 font-medium">Father Mobile</span>
              <span className="font-bold text-slate-800 font-mono">{studentData.fatherMobile}</span>

              <span className="text-slate-400 font-medium">Mother Mobile</span>
              <span className="font-bold text-slate-800 font-mono">{studentData.motherMobile}</span>

              <span className="text-slate-400 font-medium">Occupation</span>
              <span className="font-bold text-slate-800">{studentData.parentOccupation}</span>

              <span className="text-slate-400 font-medium">Parent Email</span>
              <span className="font-bold text-blue-600 font-mono">{studentData.parentEmail}</span>
            </div>
          </div>

          {/* Contact / Address */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>Contact / Residential Address</span>
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <span className="text-slate-400 font-medium">Address</span>
              <span className="font-bold text-slate-800">{studentData.address}</span>

              <span className="text-slate-400 font-medium">City</span>
              <span className="font-bold text-slate-800">{studentData.city}</span>

              <span className="text-slate-400 font-medium">Pin Code</span>
              <span className="font-bold text-slate-800 font-mono">{studentData.pinCode}</span>

              <span className="text-slate-400 font-medium">State</span>
              <span className="font-bold text-slate-800">{studentData.state}</span>

              <span className="text-slate-400 font-medium">Country</span>
              <span className="font-bold text-slate-800">{studentData.country}</span>
            </div>
          </div>

          {/* Super Admin Attached Statutory Documents */}
          {isSuperAdmin && (
            <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 shadow-sm space-y-4 md:col-span-2">
              <h3 className="font-extrabold text-sm text-indigo-950 border-b border-indigo-100 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Statutory Identity &amp; Uploaded Documents (Super Admin)</span>
                </span>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                  Authorized Verification
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {[
                  { label: 'Aadhar Card', no: student?.aadhaar, doc: student?.docAadhaar },
                  { label: 'PAN Card', no: student?.pan, doc: student?.docPan },
                  { label: 'Income Certificate', no: student?.incomeCertNo, doc: student?.docIncomeCert },
                  { label: 'Driving Licence', no: student?.drivingLicense, doc: student?.docDrivingLicense },
                  { label: '10th Mark Sheet', no: student?.tenthMarks, doc: student?.doc10th },
                  { label: '12th Mark Sheet', no: student?.twelfthMarks, doc: student?.doc12th },
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 flex flex-col justify-between hover:border-indigo-300 transition-all">
                    <div>
                      <span className="text-slate-500 font-bold block mb-0.5">{item.label}</span>
                      <span className="font-mono font-bold text-slate-800 text-xs block truncate">
                        {item.no || '—'}
                      </span>
                    </div>

                    {/* Document Thumbnail Preview if Attached */}
                    {typeof item.doc === 'string' && (item.doc.startsWith('data:image/') || item.doc.startsWith('http') || item.doc.startsWith('/')) && (
                      <div 
                        onClick={() => setPreviewModalDoc({ title: item.label, src: item.doc, no: item.no })}
                        className="my-2.5 p-1 bg-white rounded-lg border border-indigo-200/80 shadow-xs cursor-pointer group hover:border-indigo-400 transition-all overflow-hidden"
                        title="Click to view full document"
                      >
                        <img
                          src={item.doc}
                          alt={item.label}
                          className="w-full h-24 object-contain rounded group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="text-[9px] text-center font-bold text-indigo-600 pt-1 group-hover:underline">
                          🔍 Click to Preview Full Document
                        </div>
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-indigo-100/60 flex items-center justify-between">
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${typeof item.doc === 'string' && (item.doc.startsWith('data:image/') || item.doc.startsWith('http') || item.doc.startsWith('/')) ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {typeof item.doc === 'string' && (item.doc.startsWith('data:image/') || item.doc.startsWith('http') || item.doc.startsWith('/')) ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            ✓ Document Attached
                          </>
                        ) : 'Not Attached'}
                      </span>
                      {typeof item.doc === 'string' && (item.doc.startsWith('data:image/') || item.doc.startsWith('http') || item.doc.startsWith('/')) && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewModalDoc({ title: item.label, src: item.doc, no: item.no })}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                          >
                            View
                          </button>
                          <span className="text-slate-300">•</span>
                          <a
                            href={item.doc}
                            download={`${item.label.replace(/\s+/g, '_')}_document`}
                            className="text-[10px] text-slate-600 hover:text-indigo-800 font-bold underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Document Full View Modal */}
              {previewModalDoc && (
                <div 
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
                  onClick={() => setPreviewModalDoc(null)}
                >
                  <div 
                    className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900">{previewModalDoc.title}</h4>
                        {previewModalDoc.no && previewModalDoc.no !== '—' && (
                          <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">ID / No: {previewModalDoc.no}</p>
                        )}
                      </div>
                      <button 
                        onClick={() => setPreviewModalDoc(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="max-h-[65vh] overflow-auto flex items-center justify-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <img 
                        src={previewModalDoc.src} 
                        alt={previewModalDoc.title} 
                        className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-500 font-medium">Verified Student Document Record</span>
                      <div className="flex items-center gap-3">
                        <a 
                          href={previewModalDoc.src} 
                          download={`${previewModalDoc.title.replace(/\s+/g, '_')}_document`}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                        >
                          Download Document
                        </a>
                        <button 
                          onClick={() => setPreviewModalDoc(null)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* 2. ATTENDANCE TAB: REAL SESSIONS & SUMMARY */}
      {activeTab === 'Attendance' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Attendance Percentage
              </span>
              <span className="text-2xl font-black text-emerald-600 font-mono">
                {liveAttendanceRate !== null ? `${liveAttendanceRate}%` : '—'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block mt-1">Calculated from registered sessions</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Classes Marked
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono">
                {attendanceRecords.length}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block mt-1">Recorded sessions</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Attended (Present)
              </span>
              <span className="text-2xl font-black text-emerald-600 font-mono">
                {attendanceRecords.filter(r => r.status === 'Present').length}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Present in lecture</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Absences / Leave
              </span>
              <span className="text-2xl font-black text-rose-600 font-mono">
                {attendanceRecords.filter(r => r.status === 'Absent').length}
              </span>
              <span className="text-[10px] text-rose-500 font-semibold block mt-1">Absences recorded</span>
            </div>
          </div>

          {/* Session Attendance Ledger Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Attendance Session History</h3>
                <p className="text-xs text-slate-500 mt-0.5">Individual lecture session logs for {studentData.name}</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-700">
                {attendanceRecords.length} Records
              </span>
            </div>

            {attendanceLoading ? (
              <div className="py-12 flex items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-xs font-semibold">Loading attendance records...</span>
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Calendar className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-700">No attendance sessions recorded yet</p>
                <p className="text-[11px] max-w-sm mx-auto">
                  When faculty marks attendance for classes containing {studentData.name}, session logs will be visible here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 rounded-l-xl">Date</th>
                      <th className="py-3 px-4">Subject / Course</th>
                      <th className="py-3 px-4">Time Slot</th>
                      <th className="py-3 px-4">Faculty</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 rounded-r-xl">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceRecords.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{rec.date}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{rec.className}</td>
                        <td className="py-3.5 px-4 text-slate-500">{rec.slot}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{rec.staffName}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            rec.status === 'Present' 
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                              : rec.status === 'Absent' 
                              ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}>
                            {rec.status === 'Present' ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 italic">{rec.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. FEES TAB */}
      {activeTab === 'Fees' && canViewFees && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Official Fee Ledger</span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  Academic Fee Structure &amp; Clearances
                </h3>
                <p className="text-xs text-slate-500">
                  Department: <strong>{studentData.department}</strong> ({studentData.course})
                </p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                studentData.feeStatus === 'Paid' 
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                  : 'bg-amber-100 text-amber-700 border border-amber-300'
              }`}>
                {studentData.feeStatus}
              </span>
            </div>

            {/* 3 Fee Components Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Registration Fee
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {['CS', 'B.Sc CS', 'AI', 'CFS'].includes(studentData.course) ? '₹8,000' : '₹7,000'}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 block mt-1">Cleared at Admission</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Semester I Fee
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  ₹10,000
                </span>
                <span className="text-[10px] font-bold text-emerald-600 block mt-1">Tuition Dues</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Semester II Fee
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  ₹10,000
                </span>
                <span className="text-[10px] font-bold text-slate-500 block mt-1">Tuition Dues</span>
              </div>
            </div>

            {/* Total Summary */}
            <div className="p-5 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-900">Total Program Fee (Full Year):</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {['CS', 'B.Sc CS', 'AI', 'CFS'].includes(studentData.course) 
                    ? 'Computing Cluster Rate: ₹8,000 Reg + ₹10,000 Sem I + ₹10,000 Sem II' 
                    : 'Commerce Cluster Rate: ₹7,000 Reg + ₹10,000 Sem I + ₹10,000 Sem II'}
                </p>
              </div>
              <span className="text-xl font-black text-blue-900 font-mono">
                {['CS', 'B.Sc CS', 'AI', 'CFS'].includes(studentData.course) ? '₹28,000' : '₹27,000'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. EXAMINATION TAB: REAL INTERNAL MARKS & SCHEDULE */}
      {activeTab === 'Examination' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Internal Marks (CIA) Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>Continuous Internal Assessment (CIA) & Marks</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Academic marksheets and evaluated test scores</p>
              </div>
              <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold">
                {marksRecords.length} Subjects Evaluated
              </span>
            </div>

            {examsLoading ? (
              <div className="py-12 flex items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                <span className="text-xs font-semibold">Loading examination records...</span>
              </div>
            ) : marksRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Award className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-700">No evaluation records available yet</p>
                <p className="text-[11px] max-w-sm mx-auto">
                  When faculty enters CIA, Assignment, or Model test marks for {studentData.name}, they will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 rounded-l-xl min-w-[180px]">Subject</th>
                      <th className="py-3 px-2 text-center">ST 1</th>
                      <th className="py-3 px-2 text-center">ST 2</th>
                      <th className="py-3 px-2 text-center">ST 3</th>
                      <th className="py-3 px-2 text-center">ST 4</th>
                      <th className="py-3 px-2 text-center">Internal 1</th>
                      <th className="py-3 px-2 text-center">Internal 2</th>
                      <th className="py-3 px-2 text-center">Model</th>
                      <th className="py-3 px-2 text-center">Semester</th>
                      <th className="py-3 px-2 text-center">Seminar</th>
                      <th className="py-3 px-2 text-center">Project</th>
                      <th className="py-3 px-2 text-center">A1</th>
                      <th className="py-3 px-2 text-center">A2</th>
                      <th className="py-3 px-2 text-center">A3</th>
                      <th className="py-3 px-2 text-center">A4</th>
                      <th className="py-3 px-3 text-center font-black text-blue-900">Final CIA</th>
                      <th className="py-3 px-3 text-center rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {marksRecords.map((rec, idx) => {
                      const m = rec.marks || {};
                      const max = rec.maxMarks || {};
                      const it1Value = m.it1 !== null && m.it1 !== undefined ? m.it1 : m.cia1;
                      const it2Value = m.it2 !== null && m.it2 !== undefined ? m.it2 : m.cia2;
                      const cellValue = (value) => value !== null && value !== undefined && String(value).trim() !== '' ? value : '—';
                      const isPass = (m.consolidated ?? 0) >= (rec.passMarks?.consolidated || 10);

                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors align-top">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{rec.subjectName}</div>
                            <span className="text-[10px] font-mono text-slate-400 font-normal">{rec.subjectCode} • {rec.staffName}</span>
                          </td>
                          {['st1', 'st2', 'st3', 'st4'].map((field) => (
                            <td key={`${idx}-${field}`} className="py-3.5 px-2 text-center font-mono font-semibold text-slate-700">
                              {cellValue(m[field])}
                            </td>
                          ))}
                          <td className="py-3.5 px-2 text-center font-mono font-semibold text-slate-700">
                            {cellValue(it1Value)}
                          </td>
                          <td className="py-3.5 px-2 text-center font-mono font-semibold text-slate-700">
                            {cellValue(it2Value)}
                          </td>
                          <td className="py-3.5 px-2 text-center font-mono font-semibold text-slate-700">
                            {cellValue(m.model)}
                          </td>
                          <td className="py-3.5 px-2 text-center font-mono font-semibold text-slate-700">
                            {cellValue(m.semester)}
                          </td>
                          <td className="py-3.5 px-2 text-center font-mono font-semibold text-slate-700">
                            {cellValue(m.seminar)}
                          </td>
                          <td className="py-3.5 px-2 text-center font-mono font-semibold text-slate-700">
                            {cellValue(m.project)}
                          </td>
                          {['assignment1', 'assignment2', 'assignment3', 'assignment4'].map((field) => (
                            <td key={`${idx}-${field}`} className="py-3.5 px-2 text-center font-mono font-semibold text-slate-700">
                              {cellValue(m[field])}
                            </td>
                          ))}
                          <td className="py-3.5 px-3 text-center font-mono font-black text-blue-900 text-sm">
                            {m.consolidated !== null && m.consolidated !== undefined ? `${m.consolidated}/${max.consolidated || 25}` : '—'}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            {m.consolidated !== null && m.consolidated !== undefined ? (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                isPass
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-100 text-rose-700 border border-rose-200'
                              }`}>
                                {isPass ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                {isPass ? 'Passed' : 'Needs Retake'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Scheduled Semester Examinations */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span>Upcoming Semester / End-Term Examinations</span>
            </h3>

            {scheduledExams.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <p className="text-xs font-semibold text-slate-600">No scheduled exams currently pending</p>
                <p className="text-[11px]">Timetables and hall allotments will appear here once officially published by Controller of Examinations.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {scheduledExams.map((ex, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{ex.title || ex.examName}</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold rounded text-[10px]">{ex.subjectCode}</span>
                    </div>
                    <p className="text-xs text-slate-600">{ex.subjectName}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>📅 {ex.date}</span>
                      <span>⏰ {ex.time}</span>
                      {ex.hall && <span>📍 {ex.hall}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 5. ASSIGNMENTS TAB: REAL COURSEWORK */}
      {activeTab === 'Assignments' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Department Coursework &amp; Assignments</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Assigned projects, lab submissions, and homework for {studentData.department}</p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold">
              {assignmentsList.length} Active
            </span>
          </div>

          {assignmentsLoading ? (
            <div className="py-12 flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <span className="text-xs font-semibold">Loading assignments...</span>
            </div>
          ) : assignmentsList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-700">No assignments active for this department</p>
              <p className="text-[11px] max-w-sm mx-auto">
                When faculty publishes assignments in {studentData.department}, students can download details here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {assignmentsList.map((a, idx) => (
                <div key={idx} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{a.title}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded">
                        {a.subjectCode || 'General'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{a.description || a.subjectName}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                      <span>Faculty: {a.facultyName || 'Staff'}</span>
                      <span>•</span>
                      <span>Due: <strong className="text-slate-700">{a.dueDate || 'Open'}</strong></span>
                      {a.totalMarks && <span>• Max Marks: {a.totalMarks}</span>}
                    </div>
                  </div>

                  {a.attachmentName && (
                    <div className="shrink-0">
                      <a 
                        href={`/uploads/${a.attachmentName}`} 
                        download 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Attachment ({a.attachmentSize || 'PDF'})</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. DOCUMENTS TAB: REAL INSTITUTIONAL VERIFICATION */}
      {activeTab === 'Documents' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fadeIn">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Official Verification Documents &amp; Certificates</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Institutional certificates and identity documentation submitted at admission</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: '10th / Secondary School Marksheet',
                key: 'doc10th',
                file: student?.doc10th,
                desc: 'Proof of date of birth and secondary examination scores'
              },
              {
                title: '12th / Higher Secondary (HSC) Marksheet',
                key: 'doc12th',
                file: student?.doc12th,
                desc: 'Qualifying pre-university certificate for degree admission'
              },
              {
                title: 'Transfer Certificate (TC) & Conduct Slip',
                key: 'docTc',
                file: student?.docTc,
                desc: 'Institutional transfer verification from previous school/college'
              },
              {
                title: 'Aadhaar Card / National Identity Proof',
                key: 'docAadhaar',
                file: student?.docAadhaar,
                desc: 'Government identification card and demographic verification'
              }
            ].map((doc, idx) => {
              const isUploaded = Boolean(doc.file && String(doc.file).trim());
              return (
                <div key={idx} className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/70 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-900">{doc.title}</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isUploaded 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                          : 'bg-slate-200/80 text-slate-600 border border-slate-300'
                      }`}>
                        {isUploaded ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {isUploaded ? 'Verified & On File' : 'Not Uploaded'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{doc.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    {isUploaded ? (
                      <>
                        <span className="font-mono text-[11px] text-slate-600 truncate max-w-[180px]">
                          {typeof doc.file === 'string' ? doc.file : 'Document_File.pdf'}
                        </span>
                        <a 
                          href={typeof doc.file === 'string' && doc.file.startsWith('http') ? doc.file : `#`} 
                          download
                          className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-blue-600 font-bold inline-flex items-center gap-1 transition-all"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </a>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Not provided by staff during registration.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
