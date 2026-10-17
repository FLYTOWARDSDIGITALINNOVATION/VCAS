import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../../apiConfig';
import { 
  GraduationCap, 
  Briefcase, 
  Phone, 
  MapPin, 
  Heart, 
  Calendar, 
  Save, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  UserCheck, 
  LogOut,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Camera,
  Upload,
  X,
  FileCheck,
  Award,
  BookOpen,
  FileText,
  Users,
  DollarSign,
  Plus,
  Trash2,
  Check,
  Building2,
  Eye,
  EyeOff,
  CreditCard
} from 'lucide-react';
import CollegeLogo from '../CollegeLogo';

const API_BASE = BACKEND_URL;

const COMMUNITIES = ['OC', 'BC', 'BCM', 'MBC / DNC', 'SC', 'SCA', 'ST'];
const GENDERS = ['Male', 'Female'];
const MARITAL_STATUSES = ['Single', 'Married'];
const STUDY_MODES = ['Full time', 'Part time', 'Distance mode'];

const NET_SET_STATUS_OPTIONS = [
  'Qualified UGC-NET',
  'Qualified CSIR-NET',
  'Qualified SET / SLET',
  'Qualified NET & SET',
  'Qualified NET with JRF',
  'Appeared / Awaiting Results',
  'Not Applicable'
];

const INITIAL_QUALIFICATIONS = [
  { degree: 'NET / SET', specialization: '', institution: '', mode: 'Full time', marksOrCgpa: 'NA', yearOfPassing: '' },
  { degree: 'Ph.D', specialization: '', institution: '', mode: 'Full time', marksOrCgpa: '', yearOfPassing: '' },
  { degree: 'M.Phil', specialization: '', institution: '', mode: 'Full time', marksOrCgpa: '', yearOfPassing: '' },
  { degree: 'Post-graduate (PG)', specialization: '', institution: '', mode: 'Full time', marksOrCgpa: '', yearOfPassing: '' },
  { degree: 'Under graduate (UG)', specialization: '', institution: '', mode: 'Full time', marksOrCgpa: '', yearOfPassing: '' },
  { degree: 'HSC (12th)', specialization: '', institution: '', mode: 'Full time', marksOrCgpa: '', yearOfPassing: '' },
  { degree: 'SSLC (10th)', specialization: '', institution: '', mode: 'Full time', marksOrCgpa: '', yearOfPassing: '' }
];

export default function StaffFirstTimeSetup({ staffUser, onComplete, onLogout }) {
  const [activeStep, setActiveStep] = useState(1);
  const [profileImage, setProfileImage] = useState(staffUser?.profileImage || '');

  // Step 1: Personal Details
  const [postAppliedFor, setPostAppliedFor] = useState(staffUser?.designation || staffUser?.postAppliedFor || 'Assistant Professor');
  const [department, setDepartment] = useState(staffUser?.department || '');
  const [name, setName] = useState(staffUser?.name || '');
  const [dob, setDob] = useState(staffUser?.dob || '');
  const [age, setAge] = useState(staffUser?.age || '');
  const [gender, setGender] = useState(staffUser?.gender || 'Male');
  const [maritalStatus, setMaritalStatus] = useState(staffUser?.maritalStatus || 'Single');
  const [fatherOrSpouseName, setFatherOrSpouseName] = useState(staffUser?.fatherOrSpouseName || '');
  const [nationality, setNationality] = useState(staffUser?.nationality || 'Indian');
  const [religion, setReligion] = useState(staffUser?.religion || 'Hindu');
  const [community, setCommunity] = useState(staffUser?.community || 'BC');
  const [caste, setCaste] = useState(staffUser?.caste || '');
  const [permanentAddress, setPermanentAddress] = useState(staffUser?.permanentAddress || staffUser?.address || '');
  const [communicationAddress, setCommunicationAddress] = useState(staffUser?.communicationAddress || staffUser?.address || '');
  const [sameAddress, setSameAddress] = useState(false);
  const [email] = useState(staffUser?.email || '');
  const [phone, setPhone] = useState(staffUser?.phone || '');
  const [whatsapp, setWhatsapp] = useState(staffUser?.whatsapp || staffUser?.phone || '');
  const [sameWhatsapp, setSameWhatsapp] = useState(true);

  // Auto calculate age when DOB changes
  useEffect(() => {
    if (dob) {
      const birthDate = new Date(dob);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        if (calculatedAge >= 0) {
          setAge(String(calculatedAge));
        }
      }
    }
  }, [dob]);

  // Handle same address toggle
  const handleSameAddressChange = (checked) => {
    setSameAddress(checked);
    if (checked) {
      setCommunicationAddress(permanentAddress);
    }
  };

  // Handle same whatsapp toggle
  const handleSameWhatsappChange = (checked) => {
    setSameWhatsapp(checked);
    if (checked) {
      setWhatsapp(phone);
    }
  };

  // Step 2: Academic Qualifications Table
  const [qualifications, setQualifications] = useState(() => {
    if (Array.isArray(staffUser?.academicQualifications) && staffUser.academicQualifications.length > 0) {
      return staffUser.academicQualifications;
    }
    return INITIAL_QUALIFICATIONS;
  });

  const handleQualChange = (index, field, value) => {
    setQualifications(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addCustomQualification = () => {
    setQualifications(prev => [
      ...prev,
      { degree: '', specialization: '', institution: '', mode: 'Full time', marksOrCgpa: '', yearOfPassing: '' }
    ]);
  };

  const removeQualification = (index) => {
    if (qualifications.length <= 1) return;
    setQualifications(prev => prev.filter((_, i) => i !== index));
  };

  // Step 3: Experience Details Table
  const [experiences, setExperiences] = useState(() => {
    if (Array.isArray(staffUser?.experienceDetails) && staffUser.experienceDetails.length > 0) {
      return staffUser.experienceDetails;
    }
    return [
      { sNo: 1, institution: '', designation: '', fromDate: '', toDate: '', duration: '' }
    ];
  });

  const handleExpChange = (index, field, value) => {
    setExperiences(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addExperienceRow = () => {
    setExperiences(prev => [
      ...prev,
      { sNo: prev.length + 1, institution: '', designation: '', fromDate: '', toDate: '', duration: '' }
    ]);
  };

  const removeExperienceRow = (index) => {
    if (experiences.length <= 1) return;
    setExperiences(prev => prev.filter((_, i) => i !== index).map((row, i) => ({ ...row, sNo: i + 1 })));
  };

  // Step 4: Publications, Programmes, Projects & Other Info
  const [publications, setPublications] = useState({
    nationalConferences: staffUser?.publications?.nationalConferences || 0,
    nationalJournals: staffUser?.publications?.nationalJournals || 0,
    internationalConferences: staffUser?.publications?.internationalConferences || 0,
    internationalJournals: staffUser?.publications?.internationalJournals || 0,
    patentsFiled: staffUser?.publications?.patentsFiled || '',
    patentsGranted: staffUser?.publications?.patentsGranted || ''
  });

  const [programmes, setProgrammes] = useState({
    organizedConferences: staffUser?.programmes?.organizedConferences || 0,
    organizedWorkshops: staffUser?.programmes?.organizedWorkshops || 0,
    organizedFdp: staffUser?.programmes?.organizedFdp || 0,
    attendedConferences: staffUser?.programmes?.attendedConferences || 0,
    attendedWorkshops: staffUser?.programmes?.attendedWorkshops || 0,
    attendedFdp: staffUser?.programmes?.attendedFdp || 0
  });

  const [projectFunds, setProjectFunds] = useState(() => {
    if (Array.isArray(staffUser?.projectFunds) && staffUser.projectFunds.length > 0) {
      return staffUser.projectFunds;
    }
    return [
      { agency: '', amountLakhs: '', scheme: '', title: '', duration: '' }
    ];
  });

  const handleProjectFundChange = (index, field, value) => {
    setProjectFunds(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addProjectFundRow = () => {
    setProjectFunds(prev => [
      ...prev,
      { agency: '', amountLakhs: '', scheme: '', title: '', duration: '' }
    ]);
  };

  const removeProjectFundRow = (index) => {
    if (projectFunds.length <= 1) {
      setProjectFunds([{ agency: '', amountLakhs: '', scheme: '', title: '', duration: '' }]);
      return;
    }
    setProjectFunds(prev => prev.filter((_, i) => i !== index));
  };

  const [otherInformation, setOtherInformation] = useState(staffUser?.otherInformation || '');

  // Step 5: References & Pay Details
  const [references, setReferences] = useState(() => {
    if (Array.isArray(staffUser?.references) && staffUser.references.length > 0) {
      return staffUser.references.slice(0, 1);
    }
    return [
      { name: '', designation: '', institution: '', contactNo: '', email: '' }
    ];
  });

  const handleRefChange = (index, field, value) => {
    setReferences(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const [payExpected, setPayExpected] = useState(staffUser?.payExpected || '');
  const [payLastObtained, setPayLastObtained] = useState(staffUser?.payLastObtained || '');
  const [place, setPlace] = useState(staffUser?.place || 'Tenkasi');
  const [applicationDate, setApplicationDate] = useState(() => {
    return staffUser?.applicationDate || new Date().toISOString().split('T')[0];
  });

  // Step 6: Certificate Uploads & Password
  const [netSetExamStatus, setNetSetExamStatus] = useState(staffUser?.netSetExamStatus || 'Not Applicable');
  const [netSetExamCertificate, setNetSetExamCertificate] = useState(staffUser?.netSetExamCertificate || '');
  const [netSetCertificateName, setNetSetCertificateName] = useState(staffUser?.netSetCertificateName || '');
  const [lastPayCertificate, setLastPayCertificate] = useState(staffUser?.lastPayCertificate || '');
  const [lastPayCertName, setLastPayCertName] = useState('');
  const [educationalCertificatesDoc, setEducationalCertificatesDoc] = useState(staffUser?.educationalCertificatesDoc || '');
  const [eduCertName, setEduCertName] = useState('');
  const [experienceCertificatesDoc, setExperienceCertificatesDoc] = useState(staffUser?.experienceCertificatesDoc || '');
  const [expCertName, setExpCertName] = useState('');

  // Statutory & Bank Account Details
  const [aadhaar, setAadhaar] = useState(staffUser?.aadhaar || '');
  const [pan, setPan] = useState(staffUser?.pan || '');
  const [bankAccountNo, setBankAccountNo] = useState(staffUser?.bankAccountNo || '');
  const [bankName, setBankName] = useState(staffUser?.bankName || '');
  const [ifscCode, setIfscCode] = useState(staffUser?.ifscCode || '');
  const [bankBranch, setBankBranch] = useState(staffUser?.bankBranch || '');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Validation
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Handle Photo Upload
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo size exceeds 5MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (base64) setProfileImage(base64);
    };
    reader.readAsDataURL(file);
  };

  // Helper for generic file upload
  const handleDocUpload = (e, setBase64, setFileName) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }
    const name = file.name;
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result;
      if (b64) {
        setBase64(b64);
        setFileName(name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Step Validation
  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!name.trim()) errs.name = 'Full Name is required';
      if (!dob) errs.dob = 'Date of birth is required';
      if (!phone.trim()) errs.phone = 'Mobile number is required';
      if (!permanentAddress.trim()) errs.permanentAddress = 'Permanent address is required';
    }
    if (step === 6) {
      if (newPassword) {
        if (newPassword.length < 6) {
          errs.newPassword = 'Password must be at least 6 characters';
        } else if (newPassword !== confirmPassword) {
          errs.confirmPassword = 'Passwords do not match';
        }
      }
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, 6));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(6)) {
      setActiveStep(1);
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    try {
      // Build summary strings for backward compatibility
      const highestQual = qualifications.find(q => q.degree && q.institution)?.degree || 'Faculty';
      const totalExpString = experiences.filter(e => e.institution).map(e => `${e.designation} at ${e.institution}`).join(', ') || 'Fresher / Lecturer';

      const payload = {
        name: name.trim(),
        postAppliedFor: postAppliedFor.trim(),
        designation: postAppliedFor.trim(),
        department: department.trim(),
        dob,
        age: String(age),
        gender,
        maritalStatus,
        fatherOrSpouseName: fatherOrSpouseName.trim(),
        nationality: nationality.trim(),
        religion: religion.trim(),
        community,
        caste: caste.trim(),
        permanentAddress: permanentAddress.trim(),
        communicationAddress: communicationAddress.trim(),
        address: communicationAddress.trim() || permanentAddress.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        emergencyContact: fatherOrSpouseName ? `${fatherOrSpouseName} (${phone})` : phone,
        profileImage: profileImage || undefined,

        // Academic qualifications
        qualification: highestQual,
        academicQualifications: qualifications.filter(q => q.degree.trim()),

        // Experience
        experience: totalExpString,
        experienceDetails: experiences.filter(e => e.institution.trim()),

        // Publications & Research
        publications,
        programmes,
        projectFunds: projectFunds.filter(p => p.agency.trim() || p.title.trim()),
        otherInformation: otherInformation.trim(),

        // References
        references: references.filter(r => r.name.trim()),

        // Pay & Place
        payExpected: payExpected.trim(),
        payLastObtained: payLastObtained.trim(),
        lastPayCertificate: lastPayCertificate || undefined,
        place: place.trim(),
        applicationDate,

        // Certificates
        netSetExamStatus,
        netSetExamCertificate: netSetExamCertificate || undefined,
        netSetCertificateName: netSetCertificateName || undefined,
        educationalCertificatesDoc: educationalCertificatesDoc || undefined,
        // Statutory & Bank Details
        aadhaar: aadhaar.trim(),
        pan: pan.trim().toUpperCase(),
        bankAccountNo: bankAccountNo.trim(),
        bankName: bankName.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        bankBranch: bankBranch.trim(),

        newPassword: newPassword.trim() ? newPassword.trim() : undefined
      };

      const res = await fetch(`${API_BASE}/api/auth/staff/${staffUser.staffId}/complete-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to complete staff application profile.');
      }

      // Success! Pass updated staff user to onComplete
      onComplete(data.staff);
    } catch (err) {
      console.error('Staff Application Submit Error:', err);
      setServerError(err.message || 'Network error occurred while saving application.');
      setIsSubmitting(false);
    }
  };

  const STEPS = [
    { num: 1, label: 'Personal Details' },
    { num: 2, label: 'Academic Qualifications' },
    { num: 3, label: 'Experience Details' },
    { num: 4, label: 'Research & Publications' },
    { num: 5, label: 'References & Pay' },
    { num: 6, label: 'Documents & Finish' }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-6 px-3 sm:px-6">
      <div className="w-full max-w-5xl">

        {/* HEADER BAR */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <CollegeLogo size="sm" showText={false} />
              <div>
                <h1 className="text-base sm:text-lg font-black text-white tracking-wide">
                  VIVEKANANDA COLLEGE OF ARTS AND SCIENCE
                </h1>
                <p className="text-[11px] text-blue-300 font-medium">
                  Affiliated to Manonmaniam Sundaranar University • VELLALANKULAM, TENKASI - 627 857
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600/30 text-blue-300 border border-blue-500/30">
                    OFFICIAL STAFF APPLICATION FORM
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {staffUser?.staffId}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* STEP PROGRESS NAVIGATION */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-6 pt-5 border-t border-slate-700/60">
            {STEPS.map((s) => {
              const isCurrent = activeStep === s.num;
              const isPast = activeStep > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (validateStep(activeStep)) {
                      setActiveStep(s.num);
                    }
                  }}
                  className={`flex flex-col items-start p-2 rounded-xl text-left transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/25 ring-2 ring-blue-400'
                      : isPast
                      ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40'
                      : 'bg-slate-800/50 border border-slate-700/60 text-slate-400 hover:bg-slate-700/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    {isPast ? <Check className="w-3 h-3 text-emerald-400" /> : <span>Step {s.num}</span>}
                  </div>
                  <span className="text-[11px] font-semibold truncate w-full mt-0.5">
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ERROR NOTIFICATION */}
        {serverError && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="flex-1 font-semibold">{serverError}</div>
          </div>
        )}

        {/* APPLICATION FORM CARD */}
        <form onSubmit={handleSubmit} className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-md">

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 1: PERSONAL DETAILS (IMAGE 2, SECTION 1)                */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-black text-xs border border-blue-500/30">
                    1
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-white">1. Personal Details</h2>
                    <p className="text-[11px] text-slate-400 font-medium">As specified in the College Application Form</p>
                  </div>
                </div>

                {/* Profile Photo Box matching physical form */}
                <div className="flex items-center gap-3">
                  <div className="relative group cursor-pointer">
                    <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl border-2 border-dashed border-slate-600 hover:border-blue-500 bg-slate-900/60 flex flex-col items-center justify-center overflow-hidden transition-all shadow-inner">
                      {profileImage ? (
                        <img src={profileImage} alt="Staff" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-1">
                          <Camera className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                          <span className="text-[9px] font-bold text-slate-400 block leading-tight">Passport Photo</span>
                        </div>
                      )}
                    </div>
                    <label className="absolute inset-0 opacity-0 cursor-pointer">
                      <input type="file" accept="image/*" onChange={handlePhotoSelect} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Application Target: Post & Dept */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-blue-950/30 border border-blue-800/30">
                <div>
                  <label className="block text-xs font-bold text-blue-200 mb-1">
                    Application for the Post of <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={postAppliedFor}
                    onChange={(e) => setPostAppliedFor(e.target.value)}
                    placeholder="e.g. Assistant Professor / Associate Professor"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-200 mb-1">
                    In the Department of <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science / Commerce / English"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Name, DOB, Age, Gender, Marital Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Full Name (with initials) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. K. Ramesh"
                    className={`w-full px-3.5 py-2 rounded-xl bg-slate-900 border ${formErrors.name ? 'border-rose-500' : 'border-slate-700'} text-white text-xs font-semibold focus:border-blue-500 focus:outline-none`}
                    required
                  />
                  {formErrors.name && <p className="text-[10px] text-rose-400 mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Gender <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    {GENDERS.map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => setGender(g)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          gender === g
                            ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Date of Birth <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl bg-slate-900 border ${formErrors.dob ? 'border-rose-500' : 'border-slate-700'} text-white text-xs font-semibold focus:border-blue-500 focus:outline-none`}
                    required
                  />
                  {formErrors.dob && <p className="text-[10px] text-rose-400 mt-1">{formErrors.dob}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Auto-calculated from DOB"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-700 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Marital Status
                  </label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    {MARITAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Father/Spouse, Nationality, Religion, Community, Caste */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Father / Spouse Name
                  </label>
                  <input
                    type="text"
                    value={fatherOrSpouseName}
                    onChange={(e) => setFatherOrSpouseName(e.target.value)}
                    placeholder="Enter Father or Spouse name"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nationality & Religion
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      placeholder="Nationality"
                      className="w-1/2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={religion}
                      onChange={(e) => setReligion(e.target.value)}
                      placeholder="Religion"
                      className="w-1/2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Community & Caste
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={community}
                      onChange={(e) => setCommunity(e.target.value)}
                      className="w-1/2 px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      {COMMUNITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input
                      type="text"
                      value={caste}
                      onChange={(e) => setCaste(e.target.value)}
                      placeholder="Caste"
                      className="w-1/2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Permanent Address & Communication Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Permanent Address <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={permanentAddress}
                    onChange={(e) => {
                      setPermanentAddress(e.target.value);
                      if (sameAddress) setCommunicationAddress(e.target.value);
                    }}
                    placeholder="Door No, Street, Village/Town, District, State, PIN"
                    className={`w-full px-3.5 py-2 rounded-xl bg-slate-900 border ${formErrors.permanentAddress ? 'border-rose-500' : 'border-slate-700'} text-white text-xs font-semibold focus:border-blue-500 focus:outline-none`}
                    required
                  />
                  {formErrors.permanentAddress && <p className="text-[10px] text-rose-400 mt-1">{formErrors.permanentAddress}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">
                      Address for Communication
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-blue-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sameAddress}
                        onChange={(e) => handleSameAddressChange(e.target.checked)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-0"
                      />
                      <span>Same as Permanent</span>
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={communicationAddress}
                    onChange={(e) => setCommunicationAddress(e.target.value)}
                    disabled={sameAddress}
                    placeholder="Address for correspondence/postal"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none disabled:opacity-70"
                  />
                </div>
              </div>

              {/* Email, Mobile No, WhatsApp No */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    E-mail ID
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-400 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Mobile No. <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (sameWhatsapp) setWhatsapp(e.target.value);
                    }}
                    placeholder="10-digit mobile number"
                    className={`w-full px-3.5 py-2 rounded-xl bg-slate-900 border ${formErrors.phone ? 'border-rose-500' : 'border-slate-700'} text-white text-xs font-semibold focus:border-blue-500 focus:outline-none`}
                    required
                  />
                  {formErrors.phone && <p className="text-[10px] text-rose-400 mt-1">{formErrors.phone}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">
                      WhatsApp No.
                    </label>
                    <label className="flex items-center gap-1 text-[10px] text-blue-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sameWhatsapp}
                        onChange={(e) => handleSameWhatsappChange(e.target.checked)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-0"
                      />
                      <span>Same as Mobile</span>
                    </label>
                  </div>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    disabled={sameWhatsapp}
                    placeholder="WhatsApp contact number"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none disabled:opacity-70"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 2: ACADEMIC QUALIFICATIONS (IMAGE 2, SECTION 2)         */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-black text-xs border border-blue-500/30">
                    2
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-white">2. Academic Qualifications</h2>
                    <p className="text-[11px] text-slate-400 font-medium">Please enter degree, specialization, institution, mode, marks/CGPA and passing year</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addCustomQualification}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Degree</span>
                </button>
              </div>

              {/* Responsive Qualifications Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/60 shadow-inner">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 font-black text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3 w-40">Degree</th>
                      <th className="py-3 px-3">Specialization</th>
                      <th className="py-3 px-3">School / College / University</th>
                      <th className="py-3 px-3 w-36">Study Mode</th>
                      <th className="py-3 px-2 text-center w-28">% Marks / CGPA</th>
                      <th className="py-3 px-2 text-center w-24">Year</th>
                      <th className="py-3 px-2 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs">
                    {qualifications.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.degree}
                            onChange={(e) => handleQualChange(idx, 'degree', e.target.value)}
                            placeholder="e.g. B.Sc / M.Sc"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.specialization}
                            onChange={(e) => handleQualChange(idx, 'specialization', e.target.value)}
                            placeholder="e.g. Computer Science"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.institution}
                            onChange={(e) => handleQualChange(idx, 'institution', e.target.value)}
                            placeholder="e.g. Madras University / Govt HSS"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={row.mode || 'Full time'}
                            onChange={(e) => handleQualChange(idx, 'mode', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none cursor-pointer"
                          >
                            {STUDY_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="text"
                            value={row.marksOrCgpa}
                            onChange={(e) => handleQualChange(idx, 'marksOrCgpa', e.target.value)}
                            placeholder="82% / 8.4"
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-center text-xs font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="text"
                            value={row.yearOfPassing}
                            onChange={(e) => handleQualChange(idx, 'yearOfPassing', e.target.value)}
                            placeholder="2020"
                            maxLength={4}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-center text-xs font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          {idx >= 7 && (
                            <button
                              type="button"
                              onClick={() => removeQualification(idx)}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                              title="Remove Degree"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 3: EXPERIENCE DETAILS (IMAGE 2, SECTION 3)              */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-black text-xs border border-blue-500/30">
                    3
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-white">3. Experience Details</h2>
                    <p className="text-[11px] text-slate-400 font-medium">Attach details of teaching or industry experience</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addExperienceRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Experience</span>
                </button>
              </div>

              {/* Dynamic Experience Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/60 shadow-inner">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 font-black text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3 text-center w-12">S.No.</th>
                      <th className="py-3 px-3">Institution / Industry Name</th>
                      <th className="py-3 px-3">Position / Title</th>
                      <th className="py-3 px-2 text-center w-32">From</th>
                      <th className="py-3 px-2 text-center w-32">To</th>
                      <th className="py-3 px-3 w-36">No. of Years & Month</th>
                      <th className="py-3 px-2 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs">
                    {experiences.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 text-center font-bold text-slate-400">
                          {row.sNo || idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.institution}
                            onChange={(e) => handleExpChange(idx, 'institution', e.target.value)}
                            placeholder="e.g. St. Xavier's College / Infosys"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-semibold text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.designation}
                            onChange={(e) => handleExpChange(idx, 'designation', e.target.value)}
                            placeholder="e.g. Assistant Professor / Lecturer"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="text"
                            value={row.fromDate}
                            onChange={(e) => handleExpChange(idx, 'fromDate', e.target.value)}
                            placeholder="MM/YYYY"
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-center text-xs font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="text"
                            value={row.toDate}
                            onChange={(e) => handleExpChange(idx, 'toDate', e.target.value)}
                            placeholder="MM/YYYY or Present"
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-center text-xs font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.duration}
                            onChange={(e) => handleExpChange(idx, 'duration', e.target.value)}
                            placeholder="e.g. 2 Yrs 4 Mos"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeExperienceRow(idx)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            title="Remove Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 4: RESEARCH, PUBLICATIONS & PROGRAMMES (IMAGE 1)         */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-700">
                <span className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-black text-xs border border-blue-500/30">
                  4
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-white">4. Publications, Programmes & Projects</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Matching Sections 4, 5, 6 & 7 of the College Application Form</p>
                </div>
              </div>

              {/* 4. Publication Details Table (Count Only) */}
              <div>
                <h3 className="text-xs font-bold text-blue-200 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>4. Publication Details (Provide only the count)</span>
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/60 shadow-inner">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 font-bold text-[11px]">
                        <th className="py-2.5 px-4 w-48">Category</th>
                        <th className="py-2.5 px-4 text-center">Conferences</th>
                        <th className="py-2.5 px-4 text-center">Journals</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-white">National</td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={publications.nationalConferences}
                            onChange={(e) => setPublications({ ...publications, nationalConferences: parseInt(e.target.value) || 0 })}
                            className="w-24 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-center font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={publications.nationalJournals}
                            onChange={(e) => setPublications({ ...publications, nationalJournals: parseInt(e.target.value) || 0 })}
                            className="w-24 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-center font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-white">International</td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={publications.internationalConferences}
                            onChange={(e) => setPublications({ ...publications, internationalConferences: parseInt(e.target.value) || 0 })}
                            className="w-24 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-center font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={publications.internationalJournals}
                            onChange={(e) => setPublications({ ...publications, internationalJournals: parseInt(e.target.value) || 0 })}
                            className="w-24 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-center font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Patents */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-3.5 rounded-xl bg-slate-900/40 border border-slate-700/60">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Patents Filed (Count / Details)
                    </label>
                    <input
                      type="text"
                      value={publications.patentsFiled}
                      onChange={(e) => setPublications({ ...publications, patentsFiled: e.target.value })}
                      placeholder="e.g. 1 Patent Filed (Application #2024...)"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Patents Granted (Count / Details)
                    </label>
                    <input
                      type="text"
                      value={publications.patentsGranted}
                      onChange={(e) => setPublications({ ...publications, patentsGranted: e.target.value })}
                      placeholder="e.g. 1 Patent Granted (#IN...)"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Programmes Organized / Attended */}
              <div>
                <h3 className="text-xs font-bold text-blue-200 mb-2 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-400" />
                  <span>5. Programmes Organized / Attended (Provide only the count)</span>
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/60 shadow-inner">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 font-bold text-[11px]">
                        <th className="py-2.5 px-4 w-48">Category</th>
                        <th className="py-2.5 px-4 text-center">Conferences</th>
                        <th className="py-2.5 px-4 text-center">Workshops</th>
                        <th className="py-2.5 px-4 text-center">FDP / SDP / STTP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-white">Organized</td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={programmes.organizedConferences}
                            onChange={(e) => setProgrammes({ ...programmes, organizedConferences: parseInt(e.target.value) || 0 })}
                            className="w-20 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-center font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={programmes.organizedWorkshops}
                            onChange={(e) => setProgrammes({ ...programmes, organizedWorkshops: parseInt(e.target.value) || 0 })}
                            className="w-20 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-center font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={programmes.organizedFdp}
                            onChange={(e) => setProgrammes({ ...programmes, organizedFdp: parseInt(e.target.value) || 0 })}
                            className="w-20 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-center font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-white">Attended</td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={programmes.attendedConferences}
                            onChange={(e) => setProgrammes({ ...programmes, attendedConferences: parseInt(e.target.value) || 0 })}
                            className="w-20 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-center font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={programmes.attendedWorkshops}
                            onChange={(e) => setProgrammes({ ...programmes, attendedWorkshops: parseInt(e.target.value) || 0 })}
                            className="w-20 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-center font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={programmes.attendedFdp}
                            onChange={(e) => setProgrammes({ ...programmes, attendedFdp: parseInt(e.target.value) || 0 })}
                            className="w-20 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-center font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 6. Project Funds Received from External Agencies */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-blue-200 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                    <span>6. Project Funds Received from the External Agencies</span>
                  </h3>
                  <button
                    type="button"
                    onClick={addProjectFundRow}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-500/30 transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Project</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/60 shadow-inner">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 font-bold text-[11px]">
                        <th className="py-2.5 px-3">Name of the Agency</th>
                        <th className="py-2.5 px-2 text-center w-28">Amount (Lakhs)</th>
                        <th className="py-2.5 px-3">Scheme Name</th>
                        <th className="py-2.5 px-3">Title of the Project</th>
                        <th className="py-2.5 px-3 w-32">Duration & Period</th>
                        <th className="py-2.5 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {projectFunds.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.agency}
                              onChange={(e) => handleProjectFundChange(idx, 'agency', e.target.value)}
                              placeholder="e.g. UGC / DST / TNSCST"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="text"
                              value={row.amountLakhs}
                              onChange={(e) => handleProjectFundChange(idx, 'amountLakhs', e.target.value)}
                              placeholder="e.g. 5.5"
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-center font-mono text-xs focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.scheme}
                              onChange={(e) => handleProjectFundChange(idx, 'scheme', e.target.value)}
                              placeholder="e.g. Minor Research Project"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.title}
                              onChange={(e) => handleProjectFundChange(idx, 'title', e.target.value)}
                              placeholder="Project title..."
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.duration}
                              onChange={(e) => handleProjectFundChange(idx, 'duration', e.target.value)}
                              placeholder="e.g. 2023-2025"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeProjectFundRow(idx)}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                              title="Remove Project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 7. Any Other Information */}
              <div>
                <h3 className="text-xs font-bold text-blue-200 mb-1.5">
                  7. Any Other Information
                </h3>
                <textarea
                  rows={3}
                  value={otherInformation}
                  onChange={(e) => setOtherInformation(e.target.value)}
                  placeholder="Specify memberships, awards, honours, curriculum development, community service, etc."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 5: REFERENCES & PAY DETAILS (IMAGE 1, SECTIONS 8 & 9)   */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeStep === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-700">
                <span className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-black text-xs border border-blue-500/30">
                  5
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-white">5. References & Pay Details</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Matching Sections 8 & Pay details of the College Application Form</p>
                </div>
              </div>

              {/* 8. References Table / Inputs */}
              <div>
                <h3 className="text-xs font-bold text-blue-200 mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>8. Reference Details</span>
                </h3>

                <div className="max-w-2xl">
                  {references.slice(0, 1).map((ref, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/80 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="text-xs font-bold text-amber-300">Reference Details</span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Name</label>
                        <input
                          type="text"
                          value={ref.name}
                          onChange={(e) => handleRefChange(idx, 'name', e.target.value)}
                          placeholder="e.g. Dr. S. Murugan"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Designation</label>
                          <input
                            type="text"
                            value={ref.designation}
                            onChange={(e) => handleRefChange(idx, 'designation', e.target.value)}
                            placeholder="e.g. Professor & Head"
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Institution</label>
                          <input
                            type="text"
                            value={ref.institution}
                            onChange={(e) => handleRefChange(idx, 'institution', e.target.value)}
                            placeholder="e.g. MSU University"
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Contact Number</label>
                          <input
                            type="tel"
                            value={ref.contactNo}
                            onChange={(e) => handleRefChange(idx, 'contactNo', e.target.value)}
                            placeholder="Mobile / Phone"
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">E-mail ID</label>
                          <input
                            type="email"
                            value={ref.email}
                            onChange={(e) => handleRefChange(idx, 'email', e.target.value)}
                            placeholder="Email address"
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pay Details, Place & Date */}
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-700/60 space-y-4">
                <h3 className="text-xs font-bold text-blue-200">
                  Pay Expected & Previous Pay
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Pay Expected (Rs.)
                    </label>
                    <input
                      type="text"
                      value={payExpected}
                      onChange={(e) => setPayExpected(e.target.value)}
                      placeholder="e.g. Rs. 35,000 / Month"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Pay Last Obtained (Rs.)
                    </label>
                    <input
                      type="text"
                      value={payLastObtained}
                      onChange={(e) => setPayLastObtained(e.target.value)}
                      placeholder="e.g. Rs. 28,000 / Month"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Place
                    </label>
                    <input
                      type="text"
                      value={place}
                      onChange={(e) => setPlace(e.target.value)}
                      placeholder="e.g. Tenkasi"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Application Date
                    </label>
                    <input
                      type="date"
                      value={applicationDate}
                      onChange={(e) => setApplicationDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 6: DOCUMENTS, CREDENTIALS & FINISH                       */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeStep === 6 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-700">
                <span className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-black text-xs border border-blue-500/30">
                  6
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-white">6. Attachments & Security Setup</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Attach photocopies of qualifications, service proof and set your password</p>
                </div>
              </div>

              {/* Document Uploads Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* 1. Educational Qualifications Doc */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/80">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCheck className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">1. Educational Qualifications</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">Consolidated Degree / Marksheet (PDF / Image up to 10MB)</p>
                  
                  {educationalCertificatesDoc ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                      <span className="truncate">{eduCertName || 'Educational_Certificates.pdf'}</span>
                      <button
                        type="button"
                        onClick={() => { setEducationalCertificatesDoc(''); setEduCertName(''); }}
                        className="text-slate-400 hover:text-rose-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-slate-600 hover:border-blue-500 bg-slate-900/40 hover:bg-blue-600/10 text-xs font-semibold text-slate-300 cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      <span>Upload Certificates</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => handleDocUpload(e, setEducationalCertificatesDoc, setEduCertName)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* 2. Proof for Experience */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/80">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">2. Proof for Experience</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">Service certificates / relieving letters (PDF / Image up to 10MB)</p>
                  
                  {experienceCertificatesDoc ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                      <span className="truncate">{expCertName || 'Experience_Proof.pdf'}</span>
                      <button
                        type="button"
                        onClick={() => { setExperienceCertificatesDoc(''); setExpCertName(''); }}
                        className="text-slate-400 hover:text-rose-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-slate-600 hover:border-blue-500 bg-slate-900/40 hover:bg-blue-600/10 text-xs font-semibold text-slate-300 cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      <span>Upload Experience Proof</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => handleDocUpload(e, setExperienceCertificatesDoc, setExpCertName)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Statutory & Bank Account Details */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-700/80 space-y-4 mt-6">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Statutory &amp; Bank Account Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Aadhaar Card Number
                    </label>
                    <input
                      type="text"
                      value={aadhaar}
                      onChange={(e) => setAadhaar(e.target.value)}
                      placeholder="e.g. 1234 5678 9012"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      PAN Card Number
                    </label>
                    <input
                      type="text"
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      placeholder="e.g. ABCDE1234F"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono uppercase focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={bankAccountNo}
                      onChange={(e) => setBankAccountNo(e.target.value)}
                      placeholder="e.g. 987654321012"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0001234"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono uppercase focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                      placeholder="e.g. Tenkasi Main Branch"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Password Setup */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-700/80 space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Update Portal Login Password (Optional)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-bold text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? 'Hide' : 'Show'} Password</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      New Password (Leave blank to keep current)
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className={`w-full px-3.5 py-2 rounded-xl bg-slate-900 border ${formErrors.newPassword ? 'border-rose-500' : 'border-slate-700'} text-white text-xs font-semibold focus:border-blue-500 focus:outline-none`}
                    />
                    {formErrors.newPassword && <p className="text-[10px] text-rose-400 mt-1">{formErrors.newPassword}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className={`w-full px-3.5 py-2 rounded-xl bg-slate-900 border ${formErrors.confirmPassword ? 'border-rose-500' : 'border-slate-700'} text-white text-xs font-semibold focus:border-blue-500 focus:outline-none`}
                    />
                    {formErrors.confirmPassword && <p className="text-[10px] text-rose-400 mt-1">{formErrors.confirmPassword}</p>}
                  </div>
                </div>
              </div>

              {/* Applicant Declaration */}
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-700/60 text-slate-300 text-[11px] leading-relaxed">
                <p className="font-semibold text-white mb-1">Declaration:</p>
                <p>
                  I hereby declare that all the information furnished above is true, complete and correct to the best of my knowledge and belief. I agree to abide by the rules and regulations of Vivekananda College of Arts and Science.
                </p>
                <div className="flex items-center justify-between mt-3 text-slate-400 font-mono text-[10px]">
                  <span>Place: {place}</span>
                  <span>Date: {applicationDate}</span>
                  <span className="font-bold text-blue-300">Signature of the Applicant: {name}</span>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP CONTROLS (PREVIOUS / NEXT / SUBMIT)                     */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-700">
            <div>
              {activeStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-700/80 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {activeStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
                >
                  <span>Save & Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving Application...' : 'Submit & Enter Portal'}</span>
                </button>
              )}
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
