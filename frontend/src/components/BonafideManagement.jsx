import React, { useState, useEffect, useRef } from 'react';
import { API_BASE, BACKEND_URL } from '../apiConfig';
import {
  Award,
  Plus,
  Search,
  Filter,
  Printer,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Building2,
  RefreshCw,
  X,
  Sparkles,
  Download,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import CollegeLogo from './CollegeLogo';

export default function BonafideManagement({ user = {} }) {
  const isAccountant = user?.role === 'Accountant' || user?.designation === 'Accountant' || user?.canViewFees === true;
  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin' || user?.role === 'Super Admin' || user?.isSuperAdmin;

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  
  // Modal states
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [viewingCert, setViewingCert] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Student auto-complete search state
  const [studentQuery, setStudentQuery] = useState('');
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);

  // Issue Form state
  const [formData, setFormData] = useState({
    refNo: '',
    date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
    rollNo: '',
    regNo: '',
    studentName: '',
    gender: 'Female',
    prefix: 'Ms.',
    parentRelation: 'D/o',
    parentName: '',
    address: '',
    year: 'I Year',
    course: 'B.Sc. (Criminology and Forensic Science)',
    department: 'Criminology and Forensic Science',
    academicYear: '2026–2027',
    conduct: 'Her conduct and character are good.',
    purpose: 'applying scholarship under Beedi Workers scheme'
  });

  const showToast = (msg, isError = false) => {
    setToastMsg({ text: msg, isError });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch all certificates
  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bonafide`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCertificates(json.data);
      }
    } catch (err) {
      console.error('Error fetching bonafide certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  // Live student auto-completion search
  useEffect(() => {
    if (!studentQuery.trim() || studentQuery.length < 2) {
      setStudentSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingStudents(true);
      try {
        const res = await fetch(`${API_BASE}/students?search=${encodeURIComponent(studentQuery.trim())}`);
        const data = await res.json();
        const list = Array.isArray(data.students) ? data.students : (Array.isArray(data.data) ? data.data : []);
        setStudentSuggestions(list.slice(0, 6));
      } catch (err) {
        setStudentSuggestions([]);
      } finally {
        setSearchingStudents(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [studentQuery]);

  // When a student is selected from autocomplete, populate form fields
  const handleSelectStudent = (std) => {
    const isFemale = (std.gender || '').toLowerCase() === 'female';
    const prefix = isFemale ? 'Ms.' : 'Mr.';
    const parentRelation = isFemale ? 'D/o' : 'S/o';
    const parentName = std.motherName ? `Mrs.${std.motherName}` : (std.fatherName ? `Mr.${std.fatherName}` : '');
    const conduct = isFemale ? 'Her conduct and character are good.' : 'His conduct and character are good.';
    
    // Format year string
    let yrStr = 'I Year';
    if (String(std.year).includes('2') || String(std.sem).includes('3') || String(std.sem).includes('4')) yrStr = 'II Year';
    if (String(std.year).includes('3') || String(std.sem).includes('5') || String(std.sem).includes('6')) yrStr = 'III Year';

    setFormData(prev => ({
      ...prev,
      rollNo: std.rollNo || '',
      regNo: std.regNo || '',
      studentName: std.name || '',
      gender: isFemale ? 'Female' : 'Male',
      prefix,
      parentRelation,
      parentName: parentName || prev.parentName,
      address: std.permanentAddress || std.address || prev.address,
      year: yrStr,
      course: std.courseAdmitted || std.course || `${std.degree || 'B.Sc.'} (${std.department || 'Computer Science'})`,
      department: std.department || prev.department,
      conduct
    }));
    setStudentSuggestions([]);
    setStudentQuery('');
    showToast(`Loaded details for ${std.name}!`);
  };

  // Gender change handler - auto-adjusts prefix, relation, conduct
  const handleGenderChange = (val) => {
    const isFemale = val === 'Female';
    setFormData(prev => ({
      ...prev,
      gender: val,
      prefix: isFemale ? 'Ms.' : 'Mr.',
      parentRelation: isFemale ? 'D/o' : 'S/o',
      conduct: isFemale ? 'Her conduct and character are good.' : 'His conduct and character are good.'
    }));
  };

  // Quick purpose selection
  const popularPurposes = [
    'applying scholarship under Beedi Workers scheme',
    'applying for National Scholarship Portal (NSP)',
    'State Transport Bus Pass application',
    'Bank Education Loan application',
    'Passport verification application',
    'Higher education admission'
  ];

  // Submit Issue Certificate
  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    if (!formData.studentName.trim() || !formData.parentName.trim() || !formData.address.trim() || !formData.course.trim()) {
      showToast('Student Name, Parent Name, Address, and Course are required.', true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/bonafide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          issuedBy: user?.name || (isAccountant ? 'Accountant' : 'Office Staff')
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        showToast(json.message);
        setCertificates(prev => [json.data, ...prev]);
        setViewingCert(json.data);
        setShowIssueModal(false);
      } else {
        showToast(json.message || 'Failed to issue certificate', true);
      }
    } catch (err) {
      showToast('Server connection error. Please try again.', true);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete certificate
  const handleDeleteCert = async (id, refNo) => {
    if (!window.confirm(`Are you sure you want to cancel / remove Bonafide Certificate ${refNo}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/bonafide/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Certificate removed successfully.');
        setCertificates(prev => prev.filter(c => c._id !== id));
      }
    } catch (err) {
      showToast('Failed to remove certificate', true);
    }
  };

  // Filtered list
  const filteredCertificates = certificates.filter(c => {
    if (deptFilter !== 'All' && c.department !== deptFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = (c.studentName || '').toLowerCase().includes(term);
      const matchRef = (c.refNo || '').toLowerCase().includes(term);
      const matchRoll = (c.rollNo || '').toLowerCase().includes(term);
      const matchReg = (c.regNo || '').toLowerCase().includes(term);
      const matchPurp = (c.purpose || '').toLowerCase().includes(term);
      return matchName || matchRef || matchRoll || matchReg || matchPurp;
    }
    return true;
  });

  const departments = ['All', ...new Set(certificates.map(c => c.department).filter(Boolean))];

  return (
    <div className="p-4 sm:p-7 max-w-7xl mx-auto space-y-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 p-4 rounded-2xl text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-3 ${
          toastMsg.isError ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {toastMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-purple-50 text-purple-700 border border-purple-200">
              OFFICIAL STUDENT CERTIFICATION
            </span>
            <span className="text-xs text-slate-400 font-bold">•</span>
            <span className="text-xs font-semibold text-slate-500">
              {isAccountant ? 'Accountant & Finance Portal' : 'Admin & Verification Console'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-600" />
            Bonafide Certificate Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Issue, verify, search, and print official college Bonafide Certificates for scholarships, bus pass, bank loans & passport
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchCertificates}
            className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Issue Button (Accountant & Admin) */}
          <button
            type="button"
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
              }));
              setShowIssueModal(true);
            }}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-md shadow-purple-500/20 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Issue New Bonafide Certificate
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by student name, Ref No (VC202651), Roll No, or purpose..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
          </select>
          <span className="text-xs text-slate-400 font-bold ml-1">
            {filteredCertificates.length} Issued
          </span>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden print:hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600" />
            <p className="text-xs font-semibold">Loading certificates...</p>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Award className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-extrabold text-slate-700">No Bonafide Certificates found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click "Issue New Bonafide Certificate" above to generate the first official certificate for a student.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-black text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ref No & Date</th>
                  <th className="py-3 px-4">Student & Parent Details</th>
                  <th className="py-3 px-4">Course & Academic Year</th>
                  <th className="py-3 px-4">Certificate Purpose</th>
                  <th className="py-3 px-3 text-center">Issued By</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCertificates.map((cert) => (
                  <tr key={cert._id} className="hover:bg-purple-50/20 transition-colors">
                    
                    {/* Ref No & Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 block w-fit">
                        {cert.refNo}
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold mt-1 block">
                        📅 {cert.date}
                      </span>
                    </td>

                    {/* Student & Parent */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 text-sm">
                        {cert.prefix} {cert.studentName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        {cert.parentRelation} {cert.parentName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5" title={cert.address}>
                        📍 {cert.address}
                      </div>
                    </td>

                    {/* Course */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">
                        {cert.year} {cert.course}
                      </div>
                      <div className="text-[11px] text-blue-600 font-bold mt-0.5">
                        AY {cert.academicYear}
                      </div>
                    </td>

                    {/* Purpose */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200">
                        {cert.purpose}
                      </span>
                    </td>

                    {/* Issued By */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="text-[11px] font-bold text-slate-600">
                        {cert.issuedBy || 'Accountant'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingCert(cert)}
                          className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-bold text-xs flex items-center gap-1 transition cursor-pointer border border-purple-200"
                          title="View & Print Official Certificate"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View / Print
                        </button>
                        
                        {(isAccountant || isAdmin) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCert(cert._id, cert.refNo)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: ISSUE NEW BONAFIDE CERTIFICATE (ACCOUNTANT SIDE)       */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-scaleUp border border-slate-100 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <span>Issue Official Bonafide Certificate</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Search student to auto-populate or enter details manually
                </p>
              </div>
              <button
                onClick={() => setShowIssueModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Student Auto-Fill Search Bar */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                🔍 Fast Student Auto-Fill (Search by Roll No, Reg No, or Name)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type roll number or student name to auto-fill..."
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-purple-50/60 border border-purple-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-purple-400 focus:bg-white focus:outline-none focus:border-purple-600"
                />
                {searchingStudents && (
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-600 absolute right-3 top-3" />
                )}
              </div>

              {/* Suggestions Popup */}
              {studentSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                  {studentSuggestions.map((std) => (
                    <div
                      key={std._id || std.rollNo}
                      onClick={() => handleSelectStudent(std)}
                      className="p-2.5 hover:bg-purple-50 transition cursor-pointer border-b border-slate-100 last:border-b-0 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-extrabold text-slate-900">{std.name}</span>
                        <span className="text-[11px] text-purple-700 font-bold ml-2">({std.rollNo || std.regNo})</span>
                        <p className="text-[10px] text-slate-500">{std.department} • {std.year || 'I Year'}</p>
                      </div>
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                        Select ➔
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleIssueCertificate} className="space-y-4 text-xs">
              
              {/* Row 1: Ref No & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Reference Number <span className="text-slate-400 font-normal">(Auto if empty)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VC202651"
                    value={formData.refNo}
                    onChange={(e) => setFormData({ ...formData, refNo: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold uppercase focus:bg-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Issue Date *</label>
                  <input
                    type="text"
                    required
                    placeholder="DD-MM-YYYY"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Row 2: Prefix, Student Name, Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Prefix</label>
                  <select
                    value={formData.prefix}
                    onChange={(e) => {
                      const p = e.target.value;
                      handleGenderChange(p === 'Ms.' ? 'Female' : 'Male');
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Ms.">Ms.</option>
                    <option value="Mr.">Mr.</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Briskilla A"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleGenderChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Parent Relation & Parent Name */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Relation</label>
                  <select
                    value={formData.parentRelation}
                    onChange={(e) => setFormData({ ...formData, parentRelation: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="D/o">D/o (Daughter of)</option>
                    <option value="S/o">S/o (Son of)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Parent / Guardian Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mrs.Velkani A or Mr.Arulappan"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Row 4: Residential Address */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Permanent Residential Address *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. 3/182, North Street, Muthukrishnaperi - 627861, Tamil Nadu"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold leading-relaxed focus:bg-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Row 5: Year, Course, Academic Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Year of Study *</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="I Year">I Year</option>
                    <option value="II Year">II Year</option>
                    <option value="III Year">III Year</option>
                    <option value="IV Year">IV Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Degree & Course *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B.Sc. (Criminology and Forensic Science)"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Academic Year *</label>
                  <input
                    type="text"
                    required
                    placeholder="2026–2027"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Row 6: Purpose */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Purpose of Certificate *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. applying scholarship under Beedi Workers scheme"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:border-purple-500"
                />

                {/* Popular Purpose Quick Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {popularPurposes.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, purpose: p })}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-purple-100 hover:text-purple-800 text-slate-600 transition cursor-pointer"
                    >
                      + {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black shadow-md shadow-purple-500/20 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Award className="w-4 h-4" />
                  {submitting ? 'Issuing...' : 'Issue Bonafide Certificate'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: OFFICIAL BONAFIDE CERTIFICATE (PRINT / PREVIEW)       */}
      {/* EXACTLY MATCHING USER'S PHYSICAL CERTIFICATE IMAGE             */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {viewingCert && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-10 shadow-2xl my-auto animate-scaleUp print:p-0 print:m-0 print:shadow-none print:border-none print:max-w-none">
            
            {/* Action Bar (Hidden when printing) */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-xl text-sm border border-purple-200">
                  {viewingCert.refNo}
                </span>
                <span className="text-xs text-slate-500 font-bold">• Bonafide Certificate</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Certificate
                </button>
                <button
                  type="button"
                  onClick={() => setViewingCert(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════ */}
            {/* OFFICIAL PRINTABLE CERTIFICATE SHEET                          */}
            {/* ═════════════════════════════════════════════════════════════ */}
            <div className="border-4 border-slate-900 p-6 sm:p-10 font-serif text-slate-900 relative bg-white">
              
              {/* College Header */}
              <div className="flex items-center justify-between gap-4 pb-3 border-b-2 border-slate-900">
                <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                  <CollegeLogo size="lg" showText={false} />
                </div>
                
                <div className="text-center flex-1 space-y-0.5">
                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-950 font-sans">
                    VIVEKANANDA
                  </h1>
                  <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-widest text-slate-900 font-sans">
                    COLLEGE OF ARTS AND SCIENCE
                  </h2>
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-700 italic">
                    Affiliated to Manonmaniam Sundaranar University, Tirunelveli - 627 012
                  </p>
                  <p className="text-[11px] sm:text-xs font-black uppercase text-slate-900">
                    VELLALANKULAM, TENKASI (Dt) - 627 857
                  </p>
                  <p className="text-[10px] text-slate-800 font-sans pt-0.5">
                    Email: <span className="font-bold">vivekanandacas@gmail.com</span> &nbsp;•&nbsp; Ph: 04636 245198 &nbsp;•&nbsp; Mobile: 70944 62393 / 70944 62394
                  </p>
                </div>

                <div className="w-16 shrink-0 text-right">
                  <span className="inline-block border-2 border-slate-900 font-sans font-black text-xs px-2 py-1">
                    VCAS
                  </span>
                </div>
              </div>

              {/* Reference & Date Bar */}
              <div className="flex items-center justify-between font-sans text-xs sm:text-sm font-bold pt-4 pb-6">
                <div>
                  Ref No: <span className="font-extrabold">{viewingCert.refNo}</span>
                </div>
                <div>
                  Date: <span className="font-extrabold">{viewingCert.date}</span>
                </div>
              </div>

              {/* Certificate Title */}
              <div className="text-center my-4">
                <h3 className="text-base sm:text-xl font-black uppercase tracking-widest underline decoration-2 underline-offset-8">
                  BONAFIDE CERTIFICATE
                </h3>
              </div>

              {/* Certificate Official Paragraph Matching Image */}
              <div className="my-8 text-sm sm:text-base leading-relaxed text-justify space-y-5 px-2">
                <p className="indent-8 leading-8">
                  This is to certify that <span className="font-bold">{viewingCert.prefix} {viewingCert.studentName}</span>, <span className="font-bold">{viewingCert.parentRelation} {viewingCert.parentName}</span>, residing at <span className="font-bold">{viewingCert.address}</span>, is a bonafide student of <span className="font-bold">{viewingCert.year} {viewingCert.course}</span> at <span className="font-bold">Vivekananda College of Arts and Science, Vellalankulam</span> for the academic year <span className="font-bold">{viewingCert.academicYear}</span>. {viewingCert.conduct || (viewingCert.gender === 'Female' ? 'Her conduct and character are good.' : 'His conduct and character are good.')}
                </p>

                <p className="leading-8">
                  This certificate is issued at {viewingCert.gender === 'Female' ? 'her' : 'his'} request for <span className="font-bold">{viewingCert.purpose}</span>.
                </p>
              </div>

              {/* Signatures & Seal Block Matching Image */}
              <div className="flex items-end justify-between pt-16 pb-4 font-sans">
                {/* Empty left block for manual seal if needed */}
                <div></div>

                {/* Principal Signature Block (Without pre-printed name/stamp) */}
                <div className="text-center flex flex-col items-center">
                  <div className="h-14"></div>
                  <div className="border-t-2 border-slate-900 pt-1 text-center font-sans min-w-[220px]">
                    <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950">
                      PRINCIPAL
                    </p>
                    <p className="text-[10px] font-black uppercase text-blue-900 leading-tight">
                      VIVEKANANDA COLLEGE OF ARTS & SCIENCE
                    </p>
                    <p className="text-[9px] font-bold text-slate-700 uppercase">
                      VELLALANKULAM. TENKASI (DT) - 627857
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
