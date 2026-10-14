import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../apiConfig';
import { 
  ArrowLeft, 
  UserPlus, 
  CheckCircle2, 
  Loader2, 
  Save, 
  GraduationCap,
  CreditCard,
  Building2,
  FileText,
  User,
  ShieldCheck,
  Calendar,
  Award,
  Hash
} from 'lucide-react';
import CollegeLogo from './CollegeLogo';

const API_BASE = BACKEND_URL;

export default function AddStudentWizard({ onBack, onComplete, isSaving = false }) {
  const [departmentsList, setDepartmentsList] = useState([]);
  const [activeTab, setActiveTab] = useState('academic'); // 'academic' | 'personal' | 'statutory' | 'bank' | 'previous'

  // Fetch departments for course suggestion dropdown
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

  // Generate suggested Reg No based on current year
  const currentYearDigits = new Date().getFullYear().toString();
  const defaultSuggestedReg = `REG${currentYearDigits}${Math.floor(1000 + Math.random() * 9000)}`;

  // Form state containing all required fields
  const [formData, setFormData] = useState({
    // Academic & Portal Identity
    regNo: defaultSuggestedReg,
    rollNo: `ROL${Math.floor(100 + Math.random() * 900)}`,
    year: '1st Year',
    courseAdmitted: 'B.Sc. COMPUTER SCIENCE',
    dateOfAdmission: new Date().toISOString().split('T')[0],

    // Personal Information
    name: '',
    gender: 'Male',
    dob: '2005-06-15', // Sets default password
    fatherName: '',
    nationality: 'INDIAN',
    religion: 'HINDU',
    caste: 'BC',
    casteCommunity: 'BC',
    nationalityReligion: 'INDIAN & HINDU',

    // Statutory & Identity Proofs
    aadhaar: '',
    pan: '',
    drivingLicense: '',
    emisNumber: '',

    // Bank Account Details
    bankName: 'State Bank of India',
    bankAccountNo: '',
    ifscCode: 'SBIN0001234',
    bankBranch: 'Tiruchengode',

    // Academic Prior Records
    tenthMarks: '',
    twelfthMarks: '',

    // Donation / Admission Details
    donation: '0'
  });

  const [formErrors, setFormErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Student Name is required';
    if (!formData.regNo.trim()) errors.regNo = 'Register Number (Reg No) is required';
    if (!formData.dob) errors.dob = 'Date of Birth (Password) is required';
    if (!formData.year) errors.year = 'Year is required';
    if (!formData.courseAdmitted.trim()) errors.courseAdmitted = 'Course is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      // Switch to first tab with error
      if (!formData.name.trim() || !formData.dob) {
        setActiveTab('personal');
      } else if (!formData.regNo.trim() || !formData.year || !formData.courseAdmitted.trim()) {
        setActiveTab('academic');
      }
      return;
    }

    if (onComplete) {
      onComplete({
        ...formData,
        fullName: formData.name,
        department: formData.courseAdmitted,
        course: formData.courseAdmitted,
        loginId: formData.regNo,
        password: formData.dob,
        nationalityReligion: `${formData.nationality || 'INDIAN'} & ${formData.religion || 'HINDU'}`
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12 font-sans">
      
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students List</span>
        </button>

        <div className="flex items-center gap-2 text-right">
          <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
            Reg No & DOB Authentication System
          </span>
          <span className="text-[11px] font-extrabold text-purple-700 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200">
            VCAS Official Portal
          </span>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#0f1e3c] via-[#162a52] to-[#1e3a6f] text-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-1 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 shrink-0">
                <CollegeLogo size="sm" showText={false} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">Student Admission & Registration</h2>
                <p className="text-xs text-blue-200 mt-1">
                  Vivekanandha College of Arts and Sciences (Affiliated with Manonmaniam Sundaranar University) • Student Profile Creation
                </p>
              </div>
            </div>

            <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-xs backdrop-blur-xs">
              <span className="text-blue-200 block text-[10px] uppercase font-bold tracking-wider">Default Login Credential</span>
              <span className="font-mono font-bold text-amber-300">Reg No + DOB Password</span>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('academic')}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'academic' ? 'bg-white text-slate-900 shadow-md' : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>1. Reg No & Academic</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'personal' ? 'bg-white text-slate-900 shadow-md' : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>2. Personal & DOB (Password)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('statutory')}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'statutory' ? 'bg-white text-slate-900 shadow-md' : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>3. Aadhaar, PAN & IDs</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bank')}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'bank' ? 'bg-white text-slate-900 shadow-md' : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>4. Bank Details</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('previous')}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'previous' ? 'bg-white text-slate-900 shadow-md' : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>5. 10th, 12th & Donation</span>
            </button>
          </div>
        </div>

        {/* Multi-Section Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">

          {/* TAB 1: ACADEMIC & PORTAL IDENTITY */}
          {activeTab === 'academic' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Academic & Portal Identity</h3>
                  <p className="text-xs text-slate-500">Register Number replaces ID as primary key. Student year and course settings.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                  Step 1 of 5
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Reg No */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    Register Number (Reg No) * <span className="text-[10px] text-blue-600 font-bold">(Used as Login ID)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.regNo}
                    onChange={(e) => setFormData({ ...formData, regNo: e.target.value.toUpperCase() })}
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-black text-blue-900 uppercase font-mono focus:bg-white focus:outline-none transition-all ${
                      formErrors.regNo ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.regNo && <p className="text-[10px] text-rose-500 font-bold">{formErrors.regNo}</p>}
                </div>

                {/* Roll Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Year */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Year of Study *
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                {/* Course Admitted */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Course in Which Admitted *
                  </label>
                  <input
                    type="text"
                    list="courses-preset-list"
                    value={formData.courseAdmitted}
                    onChange={(e) => setFormData({ ...formData, courseAdmitted: e.target.value.toUpperCase() })}
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 uppercase focus:bg-white focus:outline-none transition-all ${
                      formErrors.courseAdmitted ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  <datalist id="courses-preset-list">
                    {departmentsList.map(dept => (
                      <option key={dept._id || dept.code} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                    <option value="B.Sc. COMPUTER SCIENCE" />
                    <option value="BCA" />
                    <option value="B.Com." />
                    <option value="B.B.A." />
                    <option value="B.Sc. (CRIMINOLOGY AND FORENSIC SCIENCE)" />
                    <option value="M.Sc. COMPUTER SCIENCE" />
                    <option value="M.Com." />
                  </datalist>
                </div>

                {/* Date of Admission */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Date of Admission
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfAdmission}
                    onChange={(e) => setFormData({ ...formData, dateOfAdmission: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONAL & DOB (PASSWORD) */}
          {activeTab === 'personal' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Personal Information & DOB Password</h3>
                  <p className="text-xs text-slate-500">Student Date of Birth is automatically set as the Student Login Password.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                  Step 2 of 5
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Student Name */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Name of the Student *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 uppercase focus:bg-white focus:outline-none transition-all ${
                      formErrors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.name && <p className="text-[10px] text-rose-500 font-bold">{formErrors.name}</p>}
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Gender *
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
                </div>

                {/* Date of Birth - SETS PASSWORD */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-emerald-800 uppercase tracking-wider">
                    Date of Birth * <span className="text-[10px] text-emerald-600 font-bold">(Sets Student Password)</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-4 py-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 focus:bg-white focus:outline-none focus:border-emerald-600 transition-all"
                  />
                  <p className="text-[10px] text-slate-500">Student will log in with Reg No and this Date of Birth.</p>
                </div>

                {/* Father's Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Father's Name
                  </label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Nationality */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Religion */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Religion
                  </label>
                  <input
                    type="text"
                    value={formData.religion}
                    onChange={(e) => setFormData({ ...formData, religion: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Caste / Community */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Caste & Community
                  </label>
                  <input
                    type="text"
                    value={formData.caste}
                    onChange={(e) => setFormData({ ...formData, caste: e.target.value.toUpperCase(), casteCommunity: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STATUTORY & GOVT IDENTIFIERS */}
          {activeTab === 'statutory' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Government Identifiers & Statutory Records</h3>
                  <p className="text-xs text-slate-500">Aadhaar, PAN Card, EMIS Number, and Driving License.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
                  Step 3 of 5
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Aadhaar Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={formData.aadhaar}
                    onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value.trim() })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* PAN Card */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    PAN Card Number
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase().trim() })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* EMIS Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    EMIS Number (School Education)
                  </label>
                  <input
                    type="text"
                    value={formData.emisNumber}
                    onChange={(e) => setFormData({ ...formData, emisNumber: e.target.value.trim() })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Driving License */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Driving License (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.drivingLicense}
                    onChange={(e) => setFormData({ ...formData, drivingLicense: e.target.value.toUpperCase().trim() })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BANK ACCOUNT DETAILS */}
          {activeTab === 'bank' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Bank Account Details</h3>
                  <p className="text-xs text-slate-500">Disbursement for scholarships, stipends, and refund management.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                  Step 4 of 5
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Bank Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Bank Account Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountNo}
                    onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value.trim() })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* IFSC Code */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase().trim() })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Bank Branch */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Bank Branch
                  </label>
                  <input
                    type="text"
                    value={formData.bankBranch}
                    onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: 10TH, 12TH MARKS & DONATION */}
          {activeTab === 'previous' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Academic Records (10th / 12th) & Donation</h3>
                  <p className="text-xs text-slate-500">Secondary/Higher secondary performance records and institution donation details.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                  Step 5 of 5
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 10th Record / Marks */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    10th Record / Marks (%)
                  </label>
                  <input
                    type="text"
                    value={formData.tenthMarks}
                    onChange={(e) => setFormData({ ...formData, tenthMarks: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* 12th Record / Marks */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    12th Record / Marks (%)
                  </label>
                  <input
                    type="text"
                    value={formData.twelfthMarks}
                    onChange={(e) => setFormData({ ...formData, twelfthMarks: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Donation */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Donation / Special Endowment (₹)
                  </label>
                  <input
                    type="text"
                    value={formData.donation}
                    onChange={(e) => setFormData({ ...formData, donation: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-500">Enter Nil or donation contribution amount if applicable.</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Navigation & Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {activeTab !== 'academic' && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['academic', 'personal', 'statutory', 'bank', 'previous'];
                    const idx = tabs.indexOf(activeTab);
                    if (idx > 0) setActiveTab(tabs[idx - 1]);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Previous Tab
                </button>
              )}
              {activeTab !== 'previous' && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['academic', 'personal', 'statutory', 'bank', 'previous'];
                    const idx = tabs.indexOf(activeTab);
                    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
                  }}
                  className="px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all cursor-pointer"
                >
                  Next Tab →
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Register Student & Generate Slip</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
