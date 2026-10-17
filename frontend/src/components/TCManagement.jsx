import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../apiConfig';
import {
  FileText, Award, Save, Printer, Download, Eye, RotateCcw,
  Search, CheckCircle2, AlertCircle, Upload, X, Trash2, Edit3,
  Calendar, User, BookOpen, Clock, ShieldCheck, FileCheck,
  ChevronDown, Sparkles, Filter, RefreshCw, Check, ArrowRight,
  HelpCircle, Image as ImageIcon
} from 'lucide-react';
import CollegeLogo from './CollegeLogo';
import TCCertificatePreview, { openTCPrintWindow } from './TCCertificatePreview';
import { convertDateToWords } from '../utils/dateToWords';

export default function TCManagement({ user }) {
  // Main view mode: 'form' | 'records'
  const [activeTab, setActiveTab] = useState('form');

  // Currently editing TC ID (null if creating fresh TC)
  const [editingId, setEditingId] = useState(null);

  // Form State holding all 23 fields + images + footer
  const [formData, setFormData] = useState({
    regNo: '',
    tcNumber: '',
    umisNumber: '',
    studentName: '',
    photo: '',
    gender: 'Male',
    dob: '',
    dobWords: '',
    fatherName: '',
    nationality: 'Indian',
    religion: 'Hindu',
    casteCommunity: '',
    dateOfAdmission: '',
    courseAdmitted: '',
    subjectStudiedPart1: 'Tamil',
    subjectStudiedPart2: 'English',
    subjectStudiedPart3: '',
    mediumOfInstruction: 'English',
    classAtLeaving: '',
    qualifiedForPromotion: 'Yes, Qualified',
    idMark1: '',
    idMark2: '',
    tcDate: new Date().toISOString().split('T')[0],
    conduct: 'Good',
    collegeSeal: '',
    principalSignature: '',
    studentSignature: '',
    parentSignature: '',
    declarationText: 'I hereby declare that the particulars recorded above are correct and no change will be demanded in future.',
    status: 'Draft',
    remarks: ''
  });

  // UI status messages & loaders
  const [validationErrors, setValidationErrors] = useState({});
  const [feedbackMsg, setFeedbackMsg] = useState(null); // { type: 'success' | 'error' | 'info', text: '' }
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingLookup, setIsLoadingLookup] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // Students list for quick lookup & autocomplete
  const [studentsList, setStudentsList] = useState([]);
  const [regNoInput, setRegNoInput] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // Saved TC records state
  const [tcRecords, setTcRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsSearchQuery, setRecordsSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [tcToDelete, setTcToDelete] = useState(null);

  // Helper toast notification
  const showToast = (type, text) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg(prev => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Fetch initial data: Next TC Number, Students Catalog, and Saved TC Records
  useEffect(() => {
    fetchNextTCNumber();
    fetchStudentsCatalog();
    fetchSavedTCs();
  }, []);

  // Fetch next sequential unique TC number from backend
  const fetchNextTCNumber = async () => {
    try {
      const res = await fetch(`${API_BASE}/tc/next-number`);
      const data = await res.json();
      if (res.ok && data.success && data.tcNumber) {
        setFormData(prev => ({
          ...prev,
          tcNumber: prev.tcNumber && editingId ? prev.tcNumber : data.tcNumber
        }));
      }
    } catch (err) {
      console.error('Error fetching next TC number:', err);
    }
  };

  // Fetch students catalog for quick auto-fill dropdown
  const fetchStudentsCatalog = async () => {
    try {
      const res = await fetch(`${API_BASE}/students`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        setStudentsList(list);
      }
    } catch (err) {
      console.error('Error fetching students catalog:', err);
    }
  };

  // Fetch saved TC records for Registry tab
  const fetchSavedTCs = async () => {
    setRecordsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tc`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTcRecords(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching saved TCs:', err);
    } finally {
      setRecordsLoading(false);
    }
  };

  // Auto-convert Date of Birth to words whenever DOB changes (unless manually overridden)
  const handleDobChange = (e) => {
    const newDob = e.target.value;
    const words = convertDateToWords(newDob);
    setFormData(prev => ({
      ...prev,
      dob: newDob,
      dobWords: words || prev.dobWords
    }));
    if (validationErrors.dob) {
      setValidationErrors(prev => ({ ...prev, dob: null }));
    }
  };

  // Handle generic field change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Generic Image upload handler converting file to Base64
  const handleImageUpload = (field, file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please upload a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'File size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (base64) {
        setFormData(prev => ({ ...prev, [field]: base64 }));
        showToast('success', `${field.replace(/([A-Z])/g, ' $1')} uploaded successfully.`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove uploaded image
  const handleRemoveImage = (field) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
  };

  // Auto-fill student details by Register Number
  const handleLookupStudent = async (inputRegNo) => {
    const regToQuery = (inputRegNo || regNoInput || formData.regNo || '').trim();
    if (!regToQuery) {
      showToast('error', 'Please enter a Student Register Number to look up.');
      return;
    }

    setIsLoadingLookup(true);
    setShowStudentDropdown(false);

    try {
      const res = await fetch(`${API_BASE}/tc/student/${encodeURIComponent(regToQuery)}`);
      const result = await res.json();

      if (res.ok && result.success && result.foundStudent && result.data) {
        const st = result.data;
        const words = st.dob ? convertDateToWords(st.dob) : '';

        setFormData(prev => ({
          ...prev,
          regNo: st.regNo || regToQuery.toUpperCase(),
          umisNumber: st.umisNumber || st.umis || prev.umisNumber || '',
          studentName: st.studentName || prev.studentName,
          gender: st.gender || prev.gender,
          dob: st.dob || prev.dob,
          dobWords: words || prev.dobWords,
          fatherName: st.fatherName || prev.fatherName,
          nationality: st.nationality || prev.nationality,
          religion: st.religion || prev.religion,
          casteCommunity: st.casteCommunity || prev.casteCommunity,
          dateOfAdmission: st.dateOfAdmission || prev.dateOfAdmission,
          courseAdmitted: st.courseAdmitted || prev.courseAdmitted,
          classAtLeaving: st.classAtLeaving || prev.classAtLeaving,
          idMark1: st.idMark1 || prev.idMark1,
          idMark2: st.idMark2 || prev.idMark2,
          subjectStudiedPart3: prev.subjectStudiedPart3 || (st.courseAdmitted ? `Major: ${st.courseAdmitted}` : '')
        }));

        setRegNoInput(st.regNo || regToQuery.toUpperCase());

        if (result.existingTC) {
          showToast('info', `Found existing Transfer Certificate (${result.existingTC.tcNumber} - ${result.existingTC.status}) for this student.`);
        } else {
          showToast('success', `Student details loaded successfully for ${st.studentName || st.regNo}! You may review and edit any field.`);
        }
      } else {
        showToast('info', `No student found with Register Number "${regToQuery}". You can enter student details manually.`);
        setFormData(prev => ({ ...prev, regNo: regToQuery.toUpperCase() }));
      }
    } catch (err) {
      console.error('Error during student lookup:', err);
      showToast('error', 'Unable to connect to server for student lookup.');
    } finally {
      setIsLoadingLookup(false);
    }
  };

  // Validate fields for final Save TC (Issued status)
  const validateForm = () => {
    const errors = {};
    if (!formData.regNo || !formData.regNo.trim()) {
      errors.regNo = 'Register Number is required.';
    }
    if (!formData.tcNumber || !formData.tcNumber.trim()) {
      errors.tcNumber = 'TC Number is required.';
    }
    if (!formData.studentName || !formData.studentName.trim()) {
      errors.studentName = 'Student Name is required.';
    }
    if (!formData.dob) {
      errors.dob = 'Date of Birth is required.';
    }
    if (!formData.fatherName || !formData.fatherName.trim()) {
      errors.fatherName = "Father's / Guardian's Name is required.";
    }
    if (!formData.courseAdmitted || !formData.courseAdmitted.trim()) {
      errors.courseAdmitted = 'Course in which admitted is required.';
    }
    if (!formData.tcDate) {
      errors.tcDate = 'Date of Transfer Certificate is required.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save TC to backend (Draft or Issued)
  const handleSave = async (targetStatus = 'Issued') => {
    if (targetStatus === 'Issued') {
      const isValid = validateForm();
      if (!isValid) {
        showToast('error', 'Please fill in all mandatory fields before issuing the Transfer Certificate.');
        // Scroll to top of form
        window.scrollTo({ top: 150, behavior: 'smooth' });
        return;
      }
    }

    setIsSaving(true);
    const payload = {
      ...formData,
      status: targetStatus
    };

    try {
      const endpoint = editingId ? `${API_BASE}/tc/${editingId}` : `${API_BASE}/tc`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setFormData(prev => ({ ...prev, status: targetStatus }));
        if (!editingId && result.data?._id) {
          setEditingId(result.data._id);
        }
        showToast('success', result.message || `Transfer Certificate ${targetStatus === 'Issued' ? 'issued & saved' : 'saved as draft'} successfully!`);
        fetchSavedTCs();
      } else {
        showToast('error', result.message || 'Failed to save Transfer Certificate.');
      }
    } catch (err) {
      console.error('Error saving TC:', err);
      showToast('error', 'Server error: Unable to save Transfer Certificate.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form with confirmation
  const handleResetForm = () => {
    setFormData({
      regNo: '',
      tcNumber: '',
      studentName: '',
      photo: '',
      gender: 'Male',
      dob: '',
      dobWords: '',
      fatherName: '',
      nationality: 'Indian',
      religion: 'Hindu',
      casteCommunity: '',
      dateOfAdmission: '',
      courseAdmitted: '',
      subjectStudiedPart1: 'Tamil',
      subjectStudiedPart2: 'English',
      subjectStudiedPart3: '',
      mediumOfInstruction: 'English',
      classAtLeaving: '',
      qualifiedForPromotion: 'Yes, Qualified',
      idMark1: '',
      idMark2: '',
      tcDate: new Date().toISOString().split('T')[0],
      conduct: 'Good',
      collegeSeal: '',
      principalSignature: '',
      studentSignature: '',
      parentSignature: '',
      declarationText: 'I hereby declare that the particulars recorded above are correct and no change will be demanded in future.',
      status: 'Draft',
      remarks: ''
    });
    setEditingId(null);
    setRegNoInput('');
    setValidationErrors({});
    setShowResetConfirmModal(false);
    fetchNextTCNumber();
    showToast('info', 'Form has been reset to defaults.');
  };

  // Load a saved TC for editing
  const handleEditRecord = (record) => {
    setFormData({
      regNo: record.regNo || '',
      tcNumber: record.tcNumber || '',
      studentName: record.studentName || '',
      photo: record.photo || '',
      gender: record.gender || 'Male',
      dob: record.dob || '',
      dobWords: record.dobWords || '',
      fatherName: record.fatherName || '',
      nationality: record.nationality || 'Indian',
      religion: record.religion || 'Hindu',
      casteCommunity: record.casteCommunity || '',
      dateOfAdmission: record.dateOfAdmission || '',
      courseAdmitted: record.courseAdmitted || '',
      subjectStudiedPart1: record.subjectStudiedPart1 || 'Tamil',
      subjectStudiedPart2: record.subjectStudiedPart2 || 'English',
      subjectStudiedPart3: record.subjectStudiedPart3 || '',
      mediumOfInstruction: record.mediumOfInstruction || 'English',
      classAtLeaving: record.classAtLeaving || '',
      qualifiedForPromotion: record.qualifiedForPromotion || 'Yes, Qualified',
      idMark1: record.idMark1 || '',
      idMark2: record.idMark2 || '',
      tcDate: record.tcDate || new Date().toISOString().split('T')[0],
      conduct: record.conduct || 'Good',
      collegeSeal: record.collegeSeal || '',
      principalSignature: record.principalSignature || '',
      studentSignature: record.studentSignature || '',
      parentSignature: record.parentSignature || '',
      declarationText: record.declarationText || 'I hereby declare that the particulars recorded above are correct and no change will be demanded in future.',
      status: record.status || 'Draft',
      remarks: record.remarks || ''
    });
    setEditingId(record._id);
    setRegNoInput(record.regNo || '');
    setActiveTab('form');
    showToast('info', `Editing Transfer Certificate ${record.tcNumber}.`);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  // Delete saved TC
  const handleDeleteRecord = async () => {
    if (!tcToDelete) return;
    try {
      const res = await fetch(`${API_BASE}/tc/${tcToDelete._id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', data.message || 'Transfer Certificate deleted successfully.');
        if (editingId === tcToDelete._id) {
          handleResetForm();
        }
        fetchSavedTCs();
      } else {
        showToast('error', data.message || 'Failed to delete Transfer Certificate.');
      }
    } catch (err) {
      console.error('Error deleting TC:', err);
      showToast('error', 'Server error while deleting TC.');
    } finally {
      setTcToDelete(null);
    }
  };

  // Filtered saved TC records for Registry
  const filteredRecords = tcRecords.filter(rec => {
    const matchesSearch =
      rec.tcNumber?.toLowerCase().includes(recordsSearchQuery.toLowerCase()) ||
      rec.regNo?.toLowerCase().includes(recordsSearchQuery.toLowerCase()) ||
      rec.studentName?.toLowerCase().includes(recordsSearchQuery.toLowerCase()) ||
      rec.courseAdmitted?.toLowerCase().includes(recordsSearchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-16">
      
      {/* Toast Alert Banner */}
      {feedbackMsg && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md border animate-in fade-in slide-in-from-top-2 duration-200 ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : feedbackMsg.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : 'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            {feedbackMsg.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {feedbackMsg.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            {feedbackMsg.type === 'info' && <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button 
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Module Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                Transfer Certificate (TC)
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  MSU Format
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Issue, preview, save, and print official college Transfer Certificates for Vivekanandha College students.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xs gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'form'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{editingId ? 'Edit Certificate Form' : 'New Certificate Form'}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('records');
              fetchSavedTCs();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'records'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Saved TC Registry</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-700">
              {tcRecords.length}
            </span>
          </button>
        </div>
      </div>

      {/* ===================== VIEW 1: DATA-ENTRY FORM ===================== */}
      {activeTab === 'form' && (
        <div className="space-y-6">

          {/* Quick Auto-Fill Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-visible">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Smart Student Database Integration</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Auto-Fill Student Particulars from Existing Database
              </h2>
              <p className="text-xs text-blue-200 mt-1 leading-relaxed">
                Enter or search a Student Register Number or Roll No below. All demographic, admission, and course records will be automatically fetched and populated into this certificate.
              </p>

              {/* Search Bar with Autocomplete Dropdown */}
              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 relative">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regNoInput}
                    onChange={(e) => {
                      setRegNoInput(e.target.value);
                      setShowStudentDropdown(true);
                    }}
                    onFocus={() => setShowStudentDropdown(true)}
                    placeholder="Enter Student Reg No (e.g. STU008, 22UCS123) or Name..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-blue-200/70 border border-white/20 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                  />
                  
                  {/* Dropdown suggestions */}
                  {showStudentDropdown && regNoInput && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 max-h-60 overflow-y-auto z-40 py-2">
                      {studentsList
                        .filter(st => {
                          const q = regNoInput.toLowerCase();
                          return (
                            (st.regNo || st.studentId || st.rollNo || '').toLowerCase().includes(q) ||
                            (st.name || st.fullName || '').toLowerCase().includes(q) ||
                            (st.course || st.department || '').toLowerCase().includes(q)
                          );
                        })
                        .slice(0, 8)
                        .map((st, i) => {
                          const id = st.regNo || st.studentId || st.rollNo;
                          return (
                            <div
                              key={i}
                              onClick={() => {
                                setRegNoInput(id);
                                handleLookupStudent(id);
                              }}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs border-b border-slate-100 last:border-b-0"
                            >
                              <div>
                                <span className="font-extrabold text-blue-700">{id}</span>
                                <span className="font-bold text-slate-800 ml-2">{st.name || st.fullName}</span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {st.course || st.department} • {st.sem || st.year || 'Student'}
                              </span>
                            </div>
                          );
                        })}
                      {studentsList.filter(st => {
                        const q = regNoInput.toLowerCase();
                        return (
                          (st.regNo || st.studentId || st.rollNo || '').toLowerCase().includes(q) ||
                          (st.name || st.fullName || '').toLowerCase().includes(q)
                        );
                      }).length === 0 && (
                        <div className="px-4 py-3 text-xs text-slate-500 text-center italic">
                          No matching student found. You can still fetch or type details manually.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLookupStudent(regNoInput)}
                    disabled={isLoadingLookup}
                    className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    {isLoadingLookup ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Auto-Fill Student</span>
                      </>
                    )}
                  </button>

                  {editingId && (
                    <button
                      onClick={handleResetForm}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 transition-all cursor-pointer shrink-0"
                      title="Clear editing and start a new certificate"
                    >
                      New Form
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Container with Clearly Organized Sections */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-8 shadow-xs space-y-8">
            
            {/* Header Identity of Certificate */}
            <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CollegeLogo size="lg" showText={false} />
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                    Vivekanandha College of Arts & Science
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Affiliated to Manonmaniam Sundaranar University • Vellalankulam, Tenkasi District – 627857
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start md:self-auto">
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status</span>
                  <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
                    formData.status === 'Issued' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {formData.status === 'Issued' ? '● Officially Issued' : '○ Draft Mode'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 1: Institutional & TC Identifiers */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Certificate Identifiers & Date
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                
                {/* 1. Register Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    1. Register Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.regNo}
                      onChange={(e) => handleChange('regNo', e.target.value.toUpperCase())}
                      placeholder="e.g. STU008 / 22UCS123"
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        validationErrors.regNo ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {validationErrors.regNo && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">{validationErrors.regNo}</p>
                  )}
                </div>

                {/* 1b. UMIS Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    UMIS Number (University MIS)
                  </label>
                  <input
                    type="text"
                    value={formData.umisNumber}
                    onChange={(e) => handleChange('umisNumber', e.target.value.toUpperCase())}
                    placeholder="e.g. UMIS/2026/08912"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold font-mono text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* 2. TC Number */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      2. TC Number <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={fetchNextTCNumber}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                      title="Generate next sequential number"
                    >
                      Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.tcNumber}
                    onChange={(e) => handleChange('tcNumber', e.target.value.toUpperCase())}
                    placeholder="e.g. TC/VCAS/2026/0001"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      validationErrors.tcNumber ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                    }`}
                  />
                  {validationErrors.tcNumber && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">{validationErrors.tcNumber}</p>
                  )}
                </div>

                {/* 22. Date of Transfer Certificate */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    22. Date of Transfer Certificate <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.tcDate}
                    onChange={(e) => handleChange('tcDate', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  {validationErrors.tcDate && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">{validationErrors.tcDate}</p>
                  )}
                </div>

              </div>
            </div>

            {/* SECTION 2: Student Identity & Photograph */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Student Identity, Photo & Date of Birth
                </h4>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Photo Upload Box (Item 4) */}
                <div className="lg:col-span-1 flex flex-col items-center p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    4. Student Photograph
                  </label>
                  
                  <div className="w-28 h-36 bg-white border-2 border-dashed border-slate-300 rounded-xl overflow-hidden relative flex flex-col items-center justify-center shadow-2xs group mb-3">
                    {formData.photo ? (
                      <>
                        <img 
                          src={formData.photo} 
                          alt="Student" 
                          className="w-full h-full object-cover" 
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('photo')}
                          className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-lg shadow-md cursor-pointer transition-all"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2 text-slate-400">
                        <ImageIcon className="w-8 h-8 mb-1 text-slate-300" />
                        <span className="text-[10px] font-bold">Affix Passport Photo</span>
                      </div>
                    )}
                  </div>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-2xs cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>{formData.photo ? 'Change Photo' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('photo', e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-400 mt-1">JPG / PNG / WEBP</span>
                </div>

                {/* Personal Information Inputs */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  
                  {/* 3. Student Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      3. Student Name (in Block Letters) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.studentName}
                      onChange={(e) => handleChange('studentName', e.target.value.toUpperCase())}
                      placeholder="e.g. S. LATHA"
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        validationErrors.studentName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                      }`}
                    />
                    {validationErrors.studentName && (
                      <p className="text-[11px] text-rose-500 font-semibold mt-1">{validationErrors.studentName}</p>
                    )}
                  </div>

                  {/* 5. Gender */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      5. Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Transgender">Transgender</option>
                    </select>
                  </div>

                  {/* 8. Father's Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      8. Father's / Guardian's Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fatherName}
                      onChange={(e) => handleChange('fatherName', e.target.value.toUpperCase())}
                      placeholder="Father or Guardian Name"
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        validationErrors.fatherName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                      }`}
                    />
                    {validationErrors.fatherName && (
                      <p className="text-[11px] text-rose-500 font-semibold mt-1">{validationErrors.fatherName}</p>
                    )}
                  </div>

                  {/* 6. Date of Birth */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      6. Date of Birth (in figures) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={handleDobChange}
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        validationErrors.dob ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                      }`}
                    />
                    {validationErrors.dob && (
                      <p className="text-[11px] text-rose-500 font-semibold mt-1">{validationErrors.dob}</p>
                    )}
                  </div>

                  {/* 7. Date of Birth in Words (Auto-converted, editable) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        7. Date of Birth (in words)
                      </label>
                      <span className="text-[10px] text-blue-600 font-semibold">Auto-converted / Editable</span>
                    </div>
                    <input
                      type="text"
                      value={formData.dobWords}
                      onChange={(e) => handleChange('dobWords', e.target.value)}
                      placeholder="e.g. Fifteenth August Two Thousand Three"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 capitalize focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                </div>

              </div>
            </div>

            {/* SECTION 3: Community & Demographics */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Nationality, Religion & Community
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                
                {/* 9. Nationality */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    9. Nationality
                  </label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => handleChange('nationality', e.target.value)}
                    placeholder="Indian"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* 10. Religion */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    10. Religion
                  </label>
                  <input
                    type="text"
                    value={formData.religion}
                    onChange={(e) => handleChange('religion', e.target.value)}
                    placeholder="Hindu / Muslim / Christian"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* 11. Caste and Community */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    11. Caste and Community
                  </label>
                  <input
                    type="text"
                    value={formData.casteCommunity}
                    onChange={(e) => handleChange('casteCommunity', e.target.value)}
                    placeholder="e.g. BC - Nadar / MBC / SC / OC"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

              </div>
            </div>

            {/* SECTION 4: Academic Details & Subjects */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Academic Curriculum, Courses & Medium
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                
                {/* 12. Date of Admission */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    12. Date of Admission
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfAdmission}
                    onChange={(e) => handleChange('dateOfAdmission', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* 13. Course in Which Admitted */}
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    13. Course in Which Admitted <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.courseAdmitted}
                    onChange={(e) => handleChange('courseAdmitted', e.target.value)}
                    placeholder="e.g. B.Sc. Computer Science / B.Com. Professional"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      validationErrors.courseAdmitted ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                    }`}
                  />
                  {validationErrors.courseAdmitted && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">{validationErrors.courseAdmitted}</p>
                  )}
                </div>

                {/* 17. Medium of Instruction */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    17. Medium of Instruction
                  </label>
                  <select
                    value={formData.mediumOfInstruction}
                    onChange={(e) => handleChange('mediumOfInstruction', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Tamil">Tamil</option>
                  </select>
                </div>

                {/* 14. Subject Studied - Part I */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    14. Subject Studied – Part I
                  </label>
                  <input
                    type="text"
                    value={formData.subjectStudiedPart1}
                    onChange={(e) => handleChange('subjectStudiedPart1', e.target.value)}
                    placeholder="e.g. Tamil / Hindi / French"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* 15. Subject Studied - Part II */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    15. Subject Studied – Part II
                  </label>
                  <input
                    type="text"
                    value={formData.subjectStudiedPart2}
                    onChange={(e) => handleChange('subjectStudiedPart2', e.target.value)}
                    placeholder="e.g. English"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* 16. Subject Studied - Part III */}
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    16. Subject Studied – Part III (Major & Allied)
                  </label>
                  <input
                    type="text"
                    value={formData.subjectStudiedPart3}
                    onChange={(e) => handleChange('subjectStudiedPart3', e.target.value)}
                    placeholder="e.g. Major: Computer Science, Allied: Mathematics & Physics"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* 18. Class/Year at Leaving */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    18. Class / Year at the Time of Leaving
                  </label>
                  <input
                    type="text"
                    value={formData.classAtLeaving}
                    onChange={(e) => handleChange('classAtLeaving', e.target.value)}
                    placeholder="e.g. III Year B.Sc. Computer Science (Sixth Semester)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* 19. Qualified for Promotion */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    19. Whether Qualified for Promotion to Higher Studies
                  </label>
                  <input
                    type="text"
                    value={formData.qualifiedForPromotion}
                    onChange={(e) => handleChange('qualifiedForPromotion', e.target.value)}
                    placeholder="e.g. Yes, Refer to Mark Sheet / Completed the Course"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

              </div>
            </div>

            {/* SECTION 5: Identification Marks & Conduct */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
                  5
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Personal Marks of Identification & Conduct
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                
                {/* 20. ID Mark 1 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    20. Personal Marks / Identification – First
                  </label>
                  <input
                    type="text"
                    value={formData.idMark1}
                    onChange={(e) => handleChange('idMark1', e.target.value)}
                    placeholder="e.g. A mole on the right cheek"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* 21. ID Mark 2 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    21. Personal Marks / Identification – Second
                  </label>
                  <input
                    type="text"
                    value={formData.idMark2}
                    onChange={(e) => handleChange('idMark2', e.target.value)}
                    placeholder="e.g. A scar on the left forehead"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* 23. Conduct and Character */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    23. Conduct and Character
                  </label>
                  <input
                    type="text"
                    value={formData.conduct}
                    onChange={(e) => handleChange('conduct', e.target.value)}
                    placeholder="e.g. Good / Exemplary"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

              </div>
            </div>

            {/* SECTION 6: Signatures, Seal & Declaration */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                  6
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  College Seal, Signatures & Parent Declaration
                </h4>
              </div>

              {/* 4 Signature/Seal Upload Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
                
                {/* College Seal */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-slate-800 mb-2">College Seal</span>
                  <div className="w-36 h-20 bg-white border border-slate-300 rounded-xl flex items-center justify-center p-2 mb-2 relative overflow-hidden shadow-2xs">
                    {formData.collegeSeal ? (
                      <>
                        <img src={formData.collegeSeal} alt="Seal" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('collegeSeal')}
                          className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full shadow-xs cursor-pointer hover:bg-rose-700 transition-all z-10"
                          title="Remove Seal"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">Affix Seal</span>
                    )}
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg shadow-2xs cursor-pointer transition-all">
                    <Upload className="w-3 h-3 text-blue-600" />
                    <span>Upload Seal</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('collegeSeal', e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Principal Signature */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-slate-800 mb-2">Principal's Signature</span>
                  <div className="w-36 h-20 bg-white border border-slate-300 rounded-xl flex items-center justify-center p-2 mb-2 relative overflow-hidden shadow-2xs">
                    {formData.principalSignature ? (
                      <>
                        <img src={formData.principalSignature} alt="Principal Signature" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('principalSignature')}
                          className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full shadow-xs cursor-pointer"
                          title="Remove Signature"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">Sign Here</span>
                    )}
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg shadow-2xs cursor-pointer transition-all">
                    <Upload className="w-3 h-3 text-blue-600" />
                    <span>Upload Signature</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('principalSignature', e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Student Signature */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-slate-800 mb-2">Student's Signature</span>
                  <div className="w-36 h-20 bg-white border border-slate-300 rounded-xl flex items-center justify-center p-2 mb-2 relative overflow-hidden shadow-2xs">
                    {formData.studentSignature ? (
                      <>
                        <img src={formData.studentSignature} alt="Student Signature" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('studentSignature')}
                          className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full shadow-xs cursor-pointer"
                          title="Remove Signature"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">Sign Here</span>
                    )}
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg shadow-2xs cursor-pointer transition-all">
                    <Upload className="w-3 h-3 text-blue-600" />
                    <span>Upload Signature</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('studentSignature', e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Parent/Guardian Signature */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-slate-800 mb-2">Parent / Guardian Sign</span>
                  <div className="w-36 h-20 bg-white border border-slate-300 rounded-xl flex items-center justify-center p-2 mb-2 relative overflow-hidden shadow-2xs">
                    {formData.parentSignature ? (
                      <>
                        <img src={formData.parentSignature} alt="Parent Signature" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('parentSignature')}
                          className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full shadow-xs cursor-pointer"
                          title="Remove Signature"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">Sign Here</span>
                    )}
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg shadow-2xs cursor-pointer transition-all">
                    <Upload className="w-3 h-3 text-blue-600" />
                    <span>Upload Signature</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('parentSignature', e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                </div>

              </div>

              {/* Declaration Text Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Declaration by the Parent / Guardian
                  </label>
                  <span className="text-[11px] text-slate-400">Statutory Certificate Text</span>
                </div>
                <textarea
                  rows="2"
                  value={formData.declarationText}
                  onChange={(e) => handleChange('declarationText', e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-serif italic text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

            </div>

            {/* ACTION BUTTONS BAR (All 6 Required Buttons) */}
            <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 p-4 rounded-2xl">
              
              {/* Reset Form Button */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Reset Form</span>
                </button>
              </div>

              {/* Action Buttons Group */}
              <div className="flex flex-wrap items-center gap-2.5">
                
                {/* 1. Save as Draft */}
                <button
                  type="button"
                  onClick={() => handleSave('Draft')}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-amber-300 hover:bg-amber-50 text-amber-800 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  title="Save incomplete TC and edit later"
                >
                  <Save className="w-4 h-4 text-amber-600" />
                  <span>Save as Draft</span>
                </button>

                {/* 2. Save TC (Final Issued) */}
                <button
                  type="button"
                  onClick={() => handleSave('Issued')}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  title="Validate required fields and save TC officially"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save TC</span>
                </button>

                {/* 3. Preview TC */}
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                  title="Preview original certificate layout"
                >
                  <Eye className="w-4 h-4 text-slate-300" />
                  <span>Preview TC</span>
                </button>

                {/* 4. Generate PDF */}
                <button
                  type="button"
                  onClick={() => openTCPrintWindow(formData)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  title="Generate formatted A4 PDF certificate"
                >
                  <Download className="w-4 h-4" />
                  <span>Generate PDF</span>
                </button>

                {/* 5. Print TC */}
                <button
                  type="button"
                  onClick={() => openTCPrintWindow(formData)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  title="Print only the certificate without sidebar/forms"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print TC</span>
                </button>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* ===================== VIEW 2: SAVED TC REGISTRY ===================== */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          
          {/* Filter & Search Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={recordsSearchQuery}
                onChange={(e) => setRecordsSearchQuery(e.target.value)}
                placeholder="Search by TC No, Reg No, Student Name, or Course..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Status:</span>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                {['All', 'Issued', 'Draft'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === st 
                        ? 'bg-white text-slate-900 shadow-2xs' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchSavedTCs}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer"
                title="Refresh Records"
              >
                <RefreshCw className={`w-4 h-4 ${recordsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

          </div>

          {/* Records Table */}
          <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4">TC Number</th>
                    <th className="p-4">Register No</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Course</th>
                    <th className="p-4">TC Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {recordsLoading ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                        <span>Loading Transfer Certificate records...</span>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400 italic">
                        No Transfer Certificate records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => (
                      <tr key={rec._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-bold text-blue-700">
                          {rec.tcNumber}
                        </td>
                        <td className="p-4 font-extrabold text-slate-900">
                          {rec.regNo}
                        </td>
                        <td className="p-4 font-bold text-slate-900 uppercase">
                          {rec.studentName}
                        </td>
                        <td className="p-4 text-slate-600">
                          {rec.courseAdmitted || '—'}
                        </td>
                        <td className="p-4 text-slate-500">
                          {rec.tcDate || '—'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${
                            rec.status === 'Issued' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {rec.status || 'Draft'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEditRecord(rec)}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-xs transition-all cursor-pointer"
                              title="Edit TC Form"
                            >
                              <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                setFormData(rec);
                                setShowPreviewModal(true);
                              }}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                              title="Preview Certificate"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openTCPrintWindow(rec)}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-lg cursor-pointer"
                              title="Print Certificate"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setTcToDelete(rec)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                              title="Delete TC"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ===================== PREVIEW MODAL ===================== */}
      {showPreviewModal && (
        <TCCertificatePreview
          data={formData}
          onClose={() => setShowPreviewModal(false)}
          onEdit={() => {
            setShowPreviewModal(false);
            setActiveTab('form');
          }}
        />
      )}

      {/* ===================== RESET CONFIRMATION MODAL ===================== */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Reset TC Form?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to clear all entered student fields, photos, and signatures? Any unsaved edits will be discarded.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResetForm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Yes, Reset Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      {tcToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Delete Certificate?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete Transfer Certificate <strong>{tcToDelete.tcNumber}</strong> for student <strong>{tcToDelete.studentName}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setTcToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRecord}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
