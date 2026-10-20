import React, { useState, useEffect } from 'react';
import { API_BASE, BACKEND_URL } from '../apiConfig';
import {
  ArrowLeft,
  IdCard,
  Users,
  CreditCard,
  GraduationCap,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Printer,
  BookOpen,
  Save,
  UserPlus,
  Key,
  Loader2
} from 'lucide-react';
import ModalPortal from './ModalPortal';
import CollegeLogo, { getCollegeLogoHtml } from './CollegeLogo';

const COMMUNITY_OPTIONS = ['OC', 'BC', 'BC(M)', 'MBC', 'DNC', 'SC', 'ST', 'SCA'];

export default function AddStudentWizard({ onBack, onComplete, isSaving = false, user }) {
  const [departmentsList, setDepartmentsList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreatedModal, setShowCreatedModal] = useState(null);

  // Fetch real departments and courses added in the database
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/departments`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setDepartmentsList(data.data);
        }
      })
      .catch(() => { });

    fetch(`${BACKEND_URL}/api/courses`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setCoursesList(data.data);
        }
      })
      .catch(() => { });
  }, []);

  // All initial fields start completely untyped / blank
  const initialForm = {
    regNo: '',
    rollNo: '',
    year: '',
    sem: '',
    loginId: '',
    name: '',
    gender: '',
    dob: '',
    course: '',
    department: '',
    batch: '',
    courseDurationFrom: '',
    courseDurationTo: '',
    dateOfAdmission: '',
    nationality: '',
    religion: '',
    community: '',
    caste: '',
    communityCertNo: '',
    phone: '',
    email: '',
    emisNumber: '',
    umisNumber: '',
    // Family & Guardian Details (Sheet 2)
    fatherName: '',
    fatherQualification: '',
    fatherOccupation: '',
    fatherMobile: '',
    motherName: '',
    motherQualification: '',
    motherOccupation: '',
    motherMobile: '',
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
    // Bank Account Details (Sheet 2)
    bankName: '',
    bankAccountNo: '',
    ifscCode: '',
    bankBranch: '',
    micrNo: '',
    // Siblings Details (Sheet 2)
    sibling1Name: '',
    sibling1Age: '',
    sibling1Status: '',
    sibling2Name: '',
    sibling2Age: '',
    sibling2Status: '',
    sibling3Name: '',
    sibling3Age: '',
    sibling3Status: '',
    // Previous Academic Record (Sheet 3)
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
    // Extra-Curricular & Personal Metrics (Sheet 3)
    nssNccOthers: '',
    sports: '',
    fineArts: '',
    aimInLife: '',
    hobbies: '',
    // Medical Record (Sheet 3)
    height: '',
    weight: '',
    bloodGroup: '',
    idMark1: '',
    idMark2: '',
    healthProblemsAllergies: '',
    // Languages Known (Sheet 3)
    langTamilRead: false,
    langTamilWrite: false,
    langTamilSpeak: false,
    langTamilPercent: '',
    langEnglishRead: false,
    langEnglishWrite: false,
    langEnglishSpeak: false,
    langEnglishPercent: '',
    langOtherName: '',
    langOtherRead: false,
    langOtherWrite: false,
    langOtherSpeak: false,
    langOtherPercent: '',
    // Transportation Details (Sheet 3)
    transportI_Bus: '',
    transportI_Own: '',
    transportI_Details: '',
    transportII_Bus: '',
    transportII_Own: '',
    transportII_Details: '',
    transportIII_Bus: '',
    transportIII_Own: '',
    transportIII_Details: '',
    // Mentor & Monitoring Records (Sheets 4 & 5)
    mentorName: '',
    mentorDesignation: '',
    mentorDepartment: '',
    counsellingNotes: '',
    coCurricularActivities: '',
    extraCurricularProgrammes: '',
    valueAddedCourses: '',
    industrialVisits: '',
    disciplinaryActions: '',
    totalWorkingHours: '',
    hoursAbsent: '',
    totalArrearsTillLastSem: '',
    arrearsClearedThisSem: '',
    arrearsYetToBeCleared: '',
    donation: '',
    drivingLicense: '',
    address: '',
    feeStatus: '',
    attendance: ''
  };

  const [formData, setFormData] = useState(initialForm);

  // Handle Form Change with Login ID auto-sync
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const val = type === 'checkbox' ? checked : value;
      const updated = { ...prev, [name]: val };
      if (name === 'rollNo') {
        updated.loginId = (value || '').toUpperCase();
      } else if (name === 'regNo' && !prev.rollNo) {
        updated.loginId = (value || '').toUpperCase();
      } else if (name === 'courseDurationFrom' && prev.courseDurationTo && !prev.batch) {
        updated.batch = `${value}-${prev.courseDurationTo}`;
      } else if (name === 'courseDurationTo' && prev.courseDurationFrom && !prev.batch) {
        updated.batch = `${prev.courseDurationFrom}-${value}`;
      }
      return updated;
    });
  };

  // Submit Handler: Add New Student
  const handleSubmitNewStudent = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Student Name is required.');
    if (!formData.dob) return alert('Date of Birth is required (used as initial password).');

    setIsSubmitting(true);
    try {
      const cleanRollNo = (formData.rollNo || '').trim().toUpperCase();
      const cleanRegNo = (formData.regNo || '').trim().toUpperCase();
      const effectiveBatch = (formData.batch || (formData.courseDurationFrom && formData.courseDurationTo ? `${formData.courseDurationFrom}-${formData.courseDurationTo}` : '2022-2026')).trim();
      const payload = {
        ...formData,
        batch: effectiveBatch,
        regNo: cleanRegNo,
        rollNo: cleanRollNo,
        loginId: cleanRollNo || cleanRegNo,
        year: formData.year || '1st Year',
        sem: formData.sem || '1st Sem',
        gender: formData.gender || 'Male',
        feeStatus: formData.feeStatus || 'Pending',
        attendance: formData.attendance !== '' ? Number(formData.attendance) : 100,
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
      } else {
        alert(data.message || 'Failed to create student.');
      }
    } catch (err) {
      alert('Network error while saving student.');
    } finally {
      setIsSubmitting(false);
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
              <div class="title">Vivekananda College of Arts & Science</div>
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

  const handleModalDone = () => {
    const student = showCreatedModal;
    setShowCreatedModal(null);
    if (onComplete && student) {
      onComplete(student);
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto font-sans animate-fadeIn">

      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Students Directory</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* ADD NEW STUDENT FORM (EXACT 5-SHEET MENTOR DIARY & PORTFOLIO)      */}
      {/* ───────────────────────────────────────────────────────────────── */}
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
            <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
              🛡️ Super Admin Enrollment Access
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
                  placeholder="Enter Student Full Name"
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
                  placeholder="e.g. REG2026001"
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
                  placeholder="e.g. 24BCS01"
                  value={formData.rollNo}
                  onChange={handleChange}
                  className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 font-mono font-bold text-purple-800 uppercase focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="">-- Select Department --</option>
                  {departmentsList.map((d, i) => {
                    const dName = typeof d === 'string' ? d : (d.name || '');
                    if (!dName) return null;
                    return (
                      <option key={d._id || `dept-${i}`} value={dName}>
                        {dName}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Course / Degree</label>
                <input
                  type="text"
                  name="course"
                  placeholder="Select or enter Course / Degree"
                  value={formData.course}
                  onChange={handleChange}
                  list="courseRealOptionsList"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 uppercase focus:outline-none"
                />
                <datalist id="courseRealOptionsList">
                  {coursesList.map((c, i) => (
                    <option key={c._id || `c-${i}`} value={c.name} />
                  ))}
                  {departmentsList.map((d, i) => {
                    const dName = typeof d === 'string' ? d : (d.name || '');
                    return dName ? <option key={`dept-course-${i}`} value={`B.Sc. ${dName.toUpperCase()}`} /> : null;
                  })}
                </datalist>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Course Duration (From Year to Year)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="courseDurationFrom"
                    maxLength={4}
                    placeholder="YYYY"
                    value={formData.courseDurationFrom}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-center font-bold focus:outline-none"
                  />
                  <span className="text-slate-500 font-bold">to</span>
                  <input
                    type="text"
                    name="courseDurationTo"
                    maxLength={4}
                    placeholder="YYYY"
                    value={formData.courseDurationTo}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-center font-bold focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Batch (e.g. 2022-2026) *
                </label>
                <input
                  type="text"
                  name="batch"
                  list="batch-suggestions"
                  placeholder="e.g. 2022-2026"
                  value={formData.batch}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-rose-500"
                />
                <datalist id="batch-suggestions">
                  <option value="2022-2026" />
                  <option value="2023-2027" />
                  <option value="2024-2028" />
                  <option value="2025-2029" />
                  <option value="2021-2025" />
                </datalist>
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
                    <option value="">Select Year</option>
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
                    <option value="">Select Sem</option>
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
                  <option value="">Select Gender</option>
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
                  placeholder="e.g. Hindu / Muslim / Christian"
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
                  placeholder="Enter Sub-caste"
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
                  const isSelected = formData.community && (formData.community || '').toUpperCase() === comm.toUpperCase();
                  return (
                    <button
                      type="button"
                      key={comm}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        community: prev.community === comm ? '' : comm
                      }))}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer border ${isSelected
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
                  placeholder="Certificate No"
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
                  placeholder="student@example.com"
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
                  placeholder="10-digit mobile"
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
                  placeholder="EMIS No"
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
                  placeholder="UMIS No"
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
                  placeholder="e.g. Nil or amount"
                  value={formData.donation}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold focus:outline-none"
                />
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
                        placeholder="Father Name"
                        value={formData.fatherName}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="motherName"
                        placeholder="Mother Name"
                        value={formData.motherName}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="guardianName"
                        placeholder="Guardian Name"
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
                        placeholder="Qualification"
                        value={formData.fatherQualification}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="motherQualification"
                        placeholder="Qualification"
                        value={formData.motherQualification}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="guardianQualification"
                        placeholder="Qualification"
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
                        placeholder="Occupation"
                        value={formData.fatherOccupation}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="motherOccupation"
                        placeholder="Occupation"
                        value={formData.motherOccupation}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="guardianOccupation"
                        placeholder="Occupation"
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
                        placeholder="Mobile No"
                        value={formData.fatherMobile}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="motherMobile"
                        placeholder="Mobile No"
                        value={formData.motherMobile}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="guardianPhone"
                        placeholder="Mobile No"
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
                  placeholder="Enter present address..."
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
                  placeholder="Enter permanent address..."
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
                  placeholder="Residence phone"
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
                  placeholder="Office phone"
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
                  placeholder="parent@example.com"
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
                  placeholder="e.g. ₹1,50,000"
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
                  placeholder="12-digit Aadhaar"
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
                  placeholder="10-digit PAN"
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
                  placeholder="Income cert no"
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
                  placeholder="DL No"
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
                    placeholder="Guardian Name"
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
                    placeholder="e.g. Uncle"
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
                    placeholder="Mobile No"
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
                    placeholder="Address"
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
                    placeholder="e.g. SBI"
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
                    placeholder="Account Number"
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
                    placeholder="IFSC Code"
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
                    placeholder="Branch Name"
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
                    placeholder="MICR No"
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
                        placeholder="School name & place"
                        value={formData.tenthInstitution}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="tenthPassingYear"
                        placeholder="Year"
                        value={formData.tenthPassingYear}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="tenthBoard"
                        placeholder="State Board / CBSE"
                        value={formData.tenthBoard}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="tenthMarks"
                        placeholder="Marks / %"
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
                        placeholder="School name & place"
                        value={formData.twelfthInstitution}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="twelfthPassingYear"
                        placeholder="Year"
                        value={formData.twelfthPassingYear}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="twelfthBoard"
                        placeholder="State Board / CBSE"
                        value={formData.twelfthBoard}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="twelfthMarks"
                        placeholder="Marks / %"
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
                        placeholder="College name & place"
                        value={formData.degreeInstitution}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="degreePassingYear"
                        placeholder="Year"
                        value={formData.degreePassingYear}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="degreeBoard"
                        placeholder="University"
                        value={formData.degreeBoard}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        name="degreeMarks"
                        placeholder="CGPA / %"
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
                    placeholder="Details"
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
                    placeholder="Details"
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
                    placeholder="Details"
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
                    placeholder="e.g. Software Engineer"
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
                    placeholder="e.g. Reading, Coding"
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
                    placeholder="e.g. 165"
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
                    placeholder="e.g. 60"
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
                    <option value="">Select Blood Group</option>
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
                    placeholder="A mole on left arm"
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
                    placeholder="A scar on forehead"
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
                  placeholder="None / specify allergies"
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
                          placeholder="e.g. 100%"
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
                          placeholder="e.g. 80%"
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
                          placeholder="%"
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
                            <option value="">Select</option>
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
                            <option value="">Select</option>
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            name={row.det}
                            placeholder="Bus route / vehicle details"
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
                  placeholder="Enter counselling records..."
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
                  placeholder="Enter co-curricular activities..."
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
                  placeholder="Enter extra-curricular programmes..."
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
                  placeholder="Enter value added courses..."
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
                  placeholder="Enter industrial visits..."
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
                  placeholder="Enter disciplinary actions..."
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
                  placeholder="Enter Mentor Full Name"
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
                  placeholder="e.g. Assistant Professor"
                  value={formData.mentorDesignation}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mentor Department</label>
                <select
                  name="mentorDepartment"
                  value={formData.mentorDepartment}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="">-- Select Mentor Department --</option>
                  {departmentsList.map((d, i) => {
                    const dName = typeof d === 'string' ? d : (d.name || '');
                    if (!dName) return null;
                    return (
                      <option key={d._id || `mdept-${i}`} value={dName}>
                        {dName}
                      </option>
                    );
                  })}
                </select>
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
                    placeholder="e.g. 450"
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
                    placeholder="e.g. 0"
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
                    placeholder="e.g. 85"
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
                    placeholder="0"
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
                    placeholder="0"
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
                    placeholder="0"
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
              onClick={onBack}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSaving}
              className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-60 inline-flex items-center gap-2"
            >
              {(isSubmitting || isSaving) && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSubmitting || isSaving ? 'Registering Student...' : 'Register Student & Save Full Portfolio'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* MODAL: NEWLY CREATED STUDENT CREDENTIALS SLIP                    */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {showCreatedModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={handleModalDone} />
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
                  <strong className="text-slate-800">{showCreatedModal.year || '1st Year'} • {showCreatedModal.course || '—'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">Login ID:</span>
                  <strong className="text-purple-700 font-mono">{showCreatedModal.loginId || showCreatedModal.rollNo || showCreatedModal.regNo}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-bold">Initial Password:</span>
                  <strong className="text-emerald-700 font-mono text-sm">{showCreatedModal.dob || 'DOB on record'}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintStudentSlip(showCreatedModal)}
                  className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={handleModalDone}
                  className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
