import React, { useState, useEffect } from 'react';
import { API_BASE, BACKEND_URL } from '../../apiConfig';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  Calendar, 
  Heart, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Building2,
  BookOpen,
  Users,
  Trophy,
  Award,
  Star,
  FileText,
  Mic,
  FlaskConical,
  Sparkles,
  Plus,
  Trash2,
  X,
  ChevronDown,
  Camera,
  Upload,
  Image as ImageIcon,
  FileCheck,
  Download,
  Eye,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import StaffApplicationView from './StaffApplicationView';

const CATEGORY_CONFIG = {
  Award:         { label: 'Award',         color: 'bg-amber-50 text-amber-700 border-amber-200',     icon: Trophy },
  Certification: { label: 'Certification', color: 'bg-blue-50 text-blue-700 border-blue-200',        icon: ShieldCheck },
  Publication:   { label: 'Publication',   color: 'bg-violet-50 text-violet-700 border-violet-200',  icon: FileText },
  Conference:    { label: 'Conference',    color: 'bg-teal-50 text-teal-700 border-teal-200',        icon: Mic },
  Research:      { label: 'Research',      color: 'bg-rose-50 text-rose-700 border-rose-200',        icon: FlaskConical },
  Other:         { label: 'Other',         color: 'bg-slate-50 text-slate-600 border-slate-200',     icon: Sparkles },
};

const CATEGORIES = Object.keys(CATEGORY_CONFIG);

const EMPTY_FORM = { title: '', category: 'Award', year: '', issuedBy: '', description: '' };

const NET_SET_STATUS_OPTIONS = [
  'Qualified UGC-NET',
  'Qualified CSIR-NET',
  'Qualified SET / SLET',
  'Qualified NET & SET',
  'Qualified NET with JRF',
  'Appeared / Awaiting Results',
  'Not Applicable'
];

export default function StaffProfile({ staffUser = {} }) {
  const [profileImage, setProfileImage] = useState(staffUser?.profileImage || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [phone, setPhone] = useState(staffUser?.phone || '');
  const [altPhone, setAltPhone] = useState(staffUser?.altPhone || '');
  const [address, setAddress] = useState(staffUser?.address || '');
  const [emergencyContact, setEmergencyContact] = useState(staffUser?.emergencyContact || '');
  const [aadhaar, setAadhaar] = useState(staffUser?.aadhaar || '');
  const [pan, setPan] = useState(staffUser?.pan || '');
  const [bankAccountNo, setBankAccountNo] = useState(staffUser?.bankAccountNo || '');
  const [bankName, setBankName] = useState(staffUser?.bankName || '');
  const [ifscCode, setIfscCode] = useState(staffUser?.ifscCode || '');
  const [bankBranch, setBankBranch] = useState(staffUser?.bankBranch || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mySubjects, setMySubjects] = useState([]);

  // NET / SET Certificate state
  const [netSetExamStatus, setNetSetExamStatus] = useState(staffUser?.netSetExamStatus || 'Not Applicable');
  const [netSetExamCertificate, setNetSetExamCertificate] = useState(staffUser?.netSetExamCertificate || '');
  const [netSetCertificateName, setNetSetCertificateName] = useState(staffUser?.netSetCertificateName || '');
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [certMsg, setCertMsg] = useState(null);
  const [showCertPreviewModal, setShowCertPreviewModal] = useState(false);

  // Achievements state
  const [achievements, setAchievements] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isAddingAchievement, setIsAddingAchievement] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [achievementMsg, setAchievementMsg] = useState(null); // { type: 'success'|'error', text }

  // Application Modal state & full staff data
  const [fullStaffData, setFullStaffData] = useState(staffUser);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  useEffect(() => {
    if (staffUser) {
      setFullStaffData(staffUser);
      if (staffUser.profileImage) setProfileImage(staffUser.profileImage);
      if (staffUser.phone) setPhone(staffUser.phone);
      if (staffUser.altPhone) setAltPhone(staffUser.altPhone);
      if (staffUser.address) setAddress(staffUser.address);
      if (staffUser.emergencyContact) setEmergencyContact(staffUser.emergencyContact);
      if (staffUser.aadhaar) setAadhaar(staffUser.aadhaar);
      if (staffUser.pan) setPan(staffUser.pan);
      if (staffUser.bankAccountNo) setBankAccountNo(staffUser.bankAccountNo);
      if (staffUser.bankName) setBankName(staffUser.bankName);
      if (staffUser.ifscCode) setIfscCode(staffUser.ifscCode);
      if (staffUser.bankBranch) setBankBranch(staffUser.bankBranch);
      if (staffUser.netSetExamStatus) setNetSetExamStatus(staffUser.netSetExamStatus);
      if (staffUser.netSetExamCertificate) setNetSetExamCertificate(staffUser.netSetExamCertificate);
      if (staffUser.netSetCertificateName) setNetSetCertificateName(staffUser.netSetCertificateName);
      if (Array.isArray(staffUser.achievements)) setAchievements(staffUser.achievements);
    }

    if (staffUser?.staffId) {
      fetch(`${API_BASE}/staff/${staffUser.staffId}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) {
            setFullStaffData(d.data);
            if (Array.isArray(d.data.achievements)) {
              setAchievements(d.data.achievements);
            }
          }
        })
        .catch(() => {});
    }
  }, [staffUser]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, JPEG, WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size exceeds 10MB limit. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result;
      if (base64) {
        setProfileImage(base64);
        if (staffUser?.staffId) {
          setIsUploadingPhoto(true);
          try {
            const res = await fetch(`${API_BASE}/auth/staff/${staffUser.staffId}/profile`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profileImage: base64 })
            });
            const data = await res.json();
            if (res.ok && data.success) {
              const stored = JSON.parse(sessionStorage.getItem('vcas_user') || '{}');
              sessionStorage.setItem('vcas_user', JSON.stringify({ ...stored, profileImage: base64 }));
              setIsSaved(true);
              setTimeout(() => setIsSaved(false), 3000);
            }
          } catch (err) {
            console.error('Error saving uploaded photo:', err);
          } finally {
            setIsUploadingPhoto(false);
          }
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Remove profile photo and restore initials avatar?')) return;
    setProfileImage('');
    if (staffUser?.staffId) {
      setIsUploadingPhoto(true);
      try {
        await fetch(`${API_BASE}/auth/staff/${staffUser.staffId}/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileImage: '' })
        });
        const stored = JSON.parse(sessionStorage.getItem('vcas_user') || '{}');
        sessionStorage.setItem('vcas_user', JSON.stringify({ ...stored, profileImage: '' }));
      } catch (err) {
        console.error('Error removing photo:', err);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleCertificateSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png|webp)$/i)) {
      alert('Please upload a valid certificate file (PDF, PNG, JPG, or WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Certificate size exceeds 10MB limit. Please upload a smaller file.');
      return;
    }

    const fileName = file.name;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result;
      if (base64) {
        setNetSetExamCertificate(base64);
        setNetSetCertificateName(fileName);
        const autoStatus = netSetExamStatus === 'Not Applicable' ? 'Qualified UGC-NET' : netSetExamStatus;
        if (netSetExamStatus === 'Not Applicable') setNetSetExamStatus('Qualified UGC-NET');

        if (staffUser?.staffId) {
          setIsUploadingCert(true);
          try {
            const res = await fetch(`${API_BASE}/auth/staff/${staffUser.staffId}/profile`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                netSetExamCertificate: base64,
                netSetCertificateName: fileName,
                netSetExamStatus: autoStatus
              })
            });
            const data = await res.json();
            if (res.ok && data.success) {
              const stored = JSON.parse(sessionStorage.getItem('vcas_user') || '{}');
              sessionStorage.setItem('vcas_user', JSON.stringify({
                ...stored,
                netSetExamCertificate: base64,
                netSetCertificateName: fileName,
                netSetExamStatus: autoStatus
              }));
              setCertMsg({ type: 'success', text: 'NET/SET Certificate uploaded & saved successfully!' });
              setTimeout(() => setCertMsg(null), 4000);
            } else {
              setCertMsg({ type: 'error', text: data.message || 'Failed to save certificate.' });
            }
          } catch (err) {
            console.error('Error saving certificate:', err);
            setCertMsg({ type: 'error', text: 'Unable to connect to server.' });
          } finally {
            setIsUploadingCert(false);
          }
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCertificate = async () => {
    if (!window.confirm('Are you sure you want to remove your uploaded NET/SET exam certificate?')) return;
    setNetSetExamCertificate('');
    setNetSetCertificateName('');
    if (staffUser?.staffId) {
      setIsUploadingCert(true);
      try {
        await fetch(`${API_BASE}/auth/staff/${staffUser.staffId}/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            netSetExamCertificate: '',
            netSetCertificateName: ''
          })
        });
        const stored = JSON.parse(sessionStorage.getItem('vcas_user') || '{}');
        sessionStorage.setItem('vcas_user', JSON.stringify({
          ...stored,
          netSetExamCertificate: '',
          netSetCertificateName: ''
        }));
        setCertMsg({ type: 'success', text: 'Certificate removed successfully.' });
        setTimeout(() => setCertMsg(null), 4000);
      } catch (err) {
        console.error('Error removing certificate:', err);
      } finally {
        setIsUploadingCert(false);
      }
    }
  };

  const handleStatusChange = async (newStatus) => {
    setNetSetExamStatus(newStatus);
    if (staffUser?.staffId) {
      try {
        await fetch(`${API_BASE}/auth/staff/${staffUser.staffId}/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ netSetExamStatus: newStatus })
        });
        const stored = JSON.parse(sessionStorage.getItem('vcas_user') || '{}');
        sessionStorage.setItem('vcas_user', JSON.stringify({ ...stored, netSetExamStatus: newStatus }));
        setCertMsg({ type: 'success', text: 'NET/SET qualification status updated.' });
        setTimeout(() => setCertMsg(null), 3000);
      } catch (err) {
        console.error('Error updating status:', err);
      }
    }
  };

  const handleViewCertificate = () => {
    if (!netSetExamCertificate) return;
    setShowCertPreviewModal(true);
  };

  const handleDownloadCertificate = () => {
    if (!netSetExamCertificate) return;
    const a = document.createElement('a');
    a.href = netSetExamCertificate;
    a.download = netSetCertificateName || 'NET_SET_Exam_Certificate';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    if (!staffUser?.staffId) return;
    fetch(`${API_BASE}/classes/staff/${staffUser.staffId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.classes)) {
          setMySubjects(d.classes);
        }
      })
      .catch(() => {});
  }, [staffUser?.staffId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!staffUser?.staffId) {
      alert('Staff ID not found.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/staff/${staffUser.staffId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          altPhone,
          address,
          emergencyContact,
          profileImage,
          netSetExamStatus,
          netSetExamCertificate,
          netSetCertificateName,
          aadhaar,
          pan,
          bankAccountNo,
          bankName,
          ifscCode,
          bankBranch
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsSaved(true);
        try {
          const stored = JSON.parse(sessionStorage.getItem('vcas_user') || '{}');
          sessionStorage.setItem('vcas_user', JSON.stringify({
            ...stored,
            phone,
            altPhone,
            address,
            emergencyContact,
            profileImage,
            netSetExamStatus,
            netSetExamCertificate,
            netSetCertificateName,
            aadhaar,
            pan,
            bankAccountNo,
            bankName,
            ifscCode,
            bankBranch
          }));
        } catch (_) {}
        setTimeout(() => setIsSaved(false), 4000);
      } else {
        alert(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      alert('Unable to connect to server.');
    } finally {
      setIsSaving(false);
    }
  };

  const showAchievementMsg = (type, text) => {
    setAchievementMsg({ type, text });
    setTimeout(() => setAchievementMsg(null), 4000);
  };

  const handleAddAchievement = async (e) => {
    e.preventDefault();
    if (!staffUser?.staffId) return;
    if (!form.title.trim()) return;
    setIsAddingAchievement(true);
    try {
      const res = await fetch(`${API_BASE}/auth/staff/${staffUser.staffId}/achievements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAchievements(prev => [...prev, data.achievement]);
        setForm(EMPTY_FORM);
        setShowAddForm(false);
        showAchievementMsg('success', 'Achievement added successfully!');
        // Update sessionStorage
        try {
          const stored = JSON.parse(sessionStorage.getItem('vcas_user') || '{}');
          const updated = [...(stored.achievements || []), data.achievement];
          sessionStorage.setItem('vcas_user', JSON.stringify({ ...stored, achievements: updated }));
        } catch (_) {}
      } else {
        showAchievementMsg('error', data.message || 'Failed to add achievement.');
      }
    } catch {
      showAchievementMsg('error', 'Unable to connect to server.');
    } finally {
      setIsAddingAchievement(false);
    }
  };

  const handleDeleteAchievement = async (achievementId) => {
    if (!staffUser?.staffId) return;
    if (!window.confirm('Remove this achievement from your profile?')) return;
    setDeletingId(achievementId);
    try {
      const res = await fetch(
        `${API_BASE}/auth/staff/${staffUser.staffId}/achievements/${achievementId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setAchievements(prev => prev.filter(a => a._id !== achievementId));
        showAchievementMsg('success', 'Achievement removed.');
        // Update sessionStorage
        try {
          const stored = JSON.parse(sessionStorage.getItem('vcas_user') || '{}');
          const updated = (stored.achievements || []).filter(a => a._id !== achievementId);
          sessionStorage.setItem('vcas_user', JSON.stringify({ ...stored, achievements: updated }));
        } catch (_) {}
      } else {
        showAchievementMsg('error', data.message || 'Failed to delete achievement.');
      }
    } catch {
      showAchievementMsg('error', 'Unable to connect to server.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Faculty Profile</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            View your employment details and keep your contact information up to date
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowApplicationModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <FileText className="w-4 h-4" />
          <span>View / Print College Application Form (2-Page A4)</span>
        </button>
      </div>

      {isSaved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100">
          
          {/* Profile Photo / Initials Avatar Box */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="relative group">
              <div className={`w-24 h-24 rounded-2xl overflow-hidden ${!profileImage ? `bg-gradient-to-br ${staffUser?.avatarColor || 'from-blue-600 to-indigo-700'}` : 'bg-slate-100'} flex items-center justify-center text-white font-extrabold text-2xl shadow-lg ring-4 ring-slate-100`}>
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={staffUser?.name || 'Staff Member'} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span>{staffUser?.avatarInitials || staffUser?.avatarText || staffUser?.name?.substring(0, 2)?.toUpperCase() || 'ST'}</span>
                )}
              </div>

              {/* Hover overlay to change photo */}
              <label 
                htmlFor="staff-profile-upload" 
                className="absolute inset-0 bg-slate-900/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-2xs"
                title="Click to upload profile photo"
              >
                <Camera className="w-6 h-6 mb-1 text-white" />
                <span className="text-[10px] font-bold">Change</span>
              </label>

              <input 
                id="staff-profile-upload" 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoSelect} 
                className="hidden" 
              />

              {profileImage && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  title="Remove photo & use initials"
                  className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-md transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Direct Upload Button for easy access */}
            <div className="flex items-center gap-1.5">
              <label 
                htmlFor="staff-profile-upload" 
                className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 border border-slate-200"
              >
                <Upload className="w-3 h-3" />
                <span>{profileImage ? 'Change Photo' : 'Upload Photo'}</span>
              </label>
              {profileImage && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
            {isUploadingPhoto && (
              <span className="text-[10px] text-blue-600 font-bold animate-pulse">Saving photo...</span>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-xl font-extrabold text-slate-900">{staffUser?.name || 'Faculty Member'}</h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                {staffUser?.staffId || 'EMP---'}
              </span>
            </div>
            <p className="text-xs font-semibold text-blue-600 mt-1">
              {staffUser?.designation || 'Faculty'} – Department of {staffUser?.department || 'General'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {staffUser?.qualification || 'Not Specified'}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                {staffUser?.experience || '0 Years'} Experience
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Joined: {staffUser?.joiningDate || 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Blood Group: {staffUser?.bloodGroup || 'O+'}
              </span>
            </div>
          </div>
        </div>

        {/* Academic Responsibilities */}
        <div className="py-5 border-b border-slate-100">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Academic Responsibilities
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Class In-charge / Mentorship</p>
              <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                {staffUser?.classTeacherOf || 'N/A'}
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Subjects Handled Currently</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {mySubjects.map(s => (
                  <span key={s.code} className="text-[11px] font-bold px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-700">
                    {s.code} ({s.name})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Academic Qualifications & College Application Summary */}
        {Array.isArray(fullStaffData?.academicQualifications) && fullStaffData.academicQualifications.length > 0 && (
          <div className="py-5 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                Academic Qualifications (Official Record)
              </h4>
              <button
                type="button"
                onClick={() => setShowApplicationModal(true)}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Application</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <th className="p-2.5">Exam / Degree</th>
                    <th className="p-2.5">Specialization</th>
                    <th className="p-2.5">Institution / University</th>
                    <th className="p-2.5 text-center">Mode</th>
                    <th className="p-2.5 text-center">% / CGPA</th>
                    <th className="p-2.5 text-center">Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {fullStaffData.academicQualifications.map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-bold text-slate-800">{q.degree}</td>
                      <td className="p-2.5 text-slate-700">{q.specialization || '—'}</td>
                      <td className="p-2.5 text-slate-600">{q.institution || '—'}</td>
                      <td className="p-2.5 text-center text-slate-600">{q.mode || 'Regular'}</td>
                      <td className="p-2.5 text-center font-bold text-slate-800">{q.percentageOrCgpa || '—'}</td>
                      <td className="p-2.5 text-center font-mono text-slate-600">{q.yearOfPassing || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Experience Details Table */}
        {Array.isArray(fullStaffData?.experienceDetails) && fullStaffData.experienceDetails.length > 0 && (
          <div className="py-5 border-b border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Prior &amp; Current Experience Details
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <th className="p-2.5">Institution / Industry</th>
                    <th className="p-2.5">Designation</th>
                    <th className="p-2.5 text-center">From</th>
                    <th className="p-2.5 text-center">To</th>
                    <th className="p-2.5 text-center">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {fullStaffData.experienceDetails.map((exp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-medium text-slate-800">{exp.institutionOrIndustry || '—'}</td>
                      <td className="p-2.5 font-bold text-slate-700">{exp.position || '—'}</td>
                      <td className="p-2.5 text-center font-mono text-slate-600">{exp.from || '—'}</td>
                      <td className="p-2.5 text-center font-mono text-slate-600">{exp.to || '—'}</td>
                      <td className="p-2.5 text-center font-semibold text-slate-800">{exp.duration || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NET / SET Exam Qualification & Certificate Section */}
        <div className="py-5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  NET / SET Exam Qualification &amp; Certificate
                  {netSetExamStatus && netSetExamStatus !== 'Not Applicable' && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {netSetExamStatus}
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-slate-500">
                  National / State Eligibility Test qualification details and document verification
                </p>
              </div>
            </div>
            {isUploadingCert && (
              <span className="text-xs font-bold text-indigo-600 animate-pulse flex items-center gap-1.5 self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                Saving certificate...
              </span>
            )}
          </div>

          {/* Alert Message for Certificate Operations */}
          {certMsg && (
            <div className={`mb-4 flex items-center gap-2 p-3 rounded-xl text-xs font-semibold border ${
              certMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${certMsg.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`} />
              {certMsg.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Qualification Status Selection */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Exam Qualification Status
              </label>
              <select
                value={netSetExamStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs cursor-pointer"
              >
                {NET_SET_STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Select your qualifying examination (UGC-NET, CSIR-NET, SET/SLET) for higher education faculty eligibility.
              </p>
            </div>

            {/* Certificate Upload & Preview Area */}
            <div className="p-4 bg-gradient-to-br from-indigo-50/40 to-purple-50/30 rounded-2xl border border-indigo-100/80 flex flex-col justify-between">
              <div>
                <span className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Official Exam Certificate Document
                </span>

                {netSetExamCertificate ? (
                  <div className="p-3 bg-white rounded-xl border border-indigo-200/80 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {netSetCertificateName || 'NET_SET_Certificate'}
                          </p>
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Uploaded &amp; Available
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                        {netSetExamCertificate.startsWith('data:application/pdf') ? 'PDF' : 'IMAGE'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleViewCertificate}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadCertificate}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                      <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all cursor-pointer">
                        <Upload className="w-3 h-3" />
                        Replace
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/webp"
                          onChange={handleCertificateSelect}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveCertificate}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold transition-all cursor-pointer ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white/70 hover:bg-white rounded-xl p-4 text-center transition-all">
                    <input
                      type="file"
                      id="net-set-file-upload"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={handleCertificateSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="net-set-file-upload"
                      className="flex flex-col items-center justify-center cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 text-indigo-600 flex items-center justify-center mb-2 transition-colors">
                        <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                        Upload NET / SET Certificate
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        PDF or Image (PNG, JPG) up to 10MB
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Editable Contact Information Form */}
        <form onSubmit={handleSave} className="pt-5 space-y-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Contact &amp; Address Details (Editable)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Email (Read-only)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={staffUser?.email || ''}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Primary Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Alternate Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Optional alternate phone number"
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact</label>
              <input
                type="text"
                required
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows="2"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              ></textarea>
            </div>
          </div>

          {/* Statutory & Banking Details */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Statutory &amp; Banking Details (Aadhaar, PAN &amp; Bank Account)
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold">Payroll &amp; Institutional Verification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Aadhaar Card Number</label>
                <input
                  type="text"
                  maxLength={14}
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PAN Card Number</label>
                <input
                  type="text"
                  maxLength={10}
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  maxLength={11}
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  value={bankBranch}
                  onChange={(e) => setBankBranch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              Save Profile Updates
            </button>
          </div>
        </form>
      </div>

      {/* ─── Achievements Section ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">Achievements &amp; Recognition</h4>
              <p className="text-[11px] text-slate-400 font-medium">
                {achievements.length} {achievements.length === 1 ? 'entry' : 'entries'} — awards, certifications, publications &amp; more
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setShowAddForm(v => !v); setForm(EMPTY_FORM); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
              showAddForm
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'
            }`}
          >
            {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showAddForm ? 'Cancel' : 'Add Achievement'}
          </button>
        </div>

        {/* Status message */}
        {achievementMsg && (
          <div className={`mx-6 mt-4 flex items-center gap-2 p-3 rounded-xl text-xs font-semibold border ${
            achievementMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${achievementMsg.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`} />
            {achievementMsg.text}
          </div>
        )}

        {/* Add Achievement Form */}
        {showAddForm && (
          <form onSubmit={handleAddAchievement} className="mx-6 mt-4 mb-2 p-5 rounded-2xl border border-blue-100 bg-blue-50/40 space-y-4">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">New Achievement</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Title <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Best Paper Award, AWS Certified Developer…"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Year</label>
                <input
                  type="text"
                  placeholder="e.g. 2024"
                  maxLength={4}
                  value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Issued By */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Issued By / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. IEEE, Amazon Web Services, National Conference on AI…"
                  value={form.issuedBy}
                  onChange={e => setForm(f => ({ ...f, issuedBy: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea
                  rows={2}
                  placeholder="Brief description of the achievement…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isAddingAchievement || !form.title.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
              >
                {isAddingAchievement ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isAddingAchievement ? 'Saving…' : 'Save Achievement'}
              </button>
            </div>
          </form>
        )}

        {/* Achievements List */}
        <div className="p-6 space-y-3">
          {achievements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Trophy className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-400">No achievements added yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Click <strong>Add Achievement</strong> to showcase your awards, certifications, and publications.
              </p>
            </div>
          ) : (
            achievements.map((ach) => {
              const cfg = CATEGORY_CONFIG[ach.category] || CATEGORY_CONFIG.Other;
              const Icon = cfg.icon;
              return (
                <div
                  key={ach._id}
                  className="group flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all"
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-sm font-extrabold text-slate-900 leading-tight">{ach.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cfg.color}`}>
                        {ach.category}
                      </span>
                      {ach.year && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                          {ach.year}
                        </span>
                      )}
                    </div>
                    {ach.issuedBy && (
                      <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        {ach.issuedBy}
                      </p>
                    )}
                    {ach.description && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ach.description}</p>
                    )}
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteAchievement(ach._id)}
                    disabled={deletingId === ach._id}
                    className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all disabled:opacity-50 shrink-0"
                    title="Remove achievement"
                  >
                    {deletingId === ach._id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* NET / SET Exam Certificate In-Page Preview Modal */}
      {showCertPreviewModal && netSetExamCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scaleUp">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="font-extrabold text-sm block">Faculty NET / SET Exam Certificate</span>
                  <span className="text-[11px] text-slate-300 font-mono">{netSetCertificateName || 'NET_SET_Certificate'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCertificate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setShowCertPreviewModal(false)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-950 p-4 flex items-center justify-center overflow-auto">
              {netSetExamCertificate.startsWith('data:application/pdf') ? (
                <iframe
                  src={netSetExamCertificate}
                  title="Faculty NET/SET Exam Certificate Preview"
                  className="w-full h-full rounded-xl bg-white border-0"
                />
              ) : (
                <img
                  src={netSetExamCertificate}
                  alt={netSetCertificateName || 'NET SET Certificate'}
                  className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* College Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-100 rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-purple-400" />
                <span className="font-extrabold text-sm">Official College Application Form (2-Page Format)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowApplicationModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <StaffApplicationView 
                staff={fullStaffData || staffUser} 
                onClose={() => setShowApplicationModal(false)} 
                showCloseButton={true} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


