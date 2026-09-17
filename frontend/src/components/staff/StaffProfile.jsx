import React, { useState, useEffect } from 'react';
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
  ChevronDown
} from 'lucide-react';

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

export default function StaffProfile({ staffUser = {} }) {
  const [phone, setPhone] = useState(staffUser?.phone || '');
  const [altPhone, setAltPhone] = useState(staffUser?.altPhone || '');
  const [address, setAddress] = useState(staffUser?.address || '');
  const [emergencyContact, setEmergencyContact] = useState(staffUser?.emergencyContact || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mySubjects, setMySubjects] = useState([]);

  // Achievements state
  const [achievements, setAchievements] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isAddingAchievement, setIsAddingAchievement] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [achievementMsg, setAchievementMsg] = useState(null); // { type: 'success'|'error', text }

  useEffect(() => {
    if (staffUser) {
      if (staffUser.phone) setPhone(staffUser.phone);
      if (staffUser.altPhone) setAltPhone(staffUser.altPhone);
      if (staffUser.address) setAddress(staffUser.address);
      if (staffUser.emergencyContact) setEmergencyContact(staffUser.emergencyContact);
      if (Array.isArray(staffUser.achievements)) setAchievements(staffUser.achievements);
    }
  }, [staffUser]);

  useEffect(() => {
    if (!staffUser?.staffId) return;
    fetch(`http://localhost:5000/api/classes/staff/${staffUser.staffId}`)
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
      const res = await fetch(`http://localhost:5000/api/auth/staff/${staffUser.staffId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, altPhone, address, emergencyContact })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsSaved(true);
        try {
          const stored = JSON.parse(sessionStorage.getItem('vcas_user') || '{}');
          sessionStorage.setItem('vcas_user', JSON.stringify({ ...stored, phone, altPhone, address, emergencyContact }));
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
      const res = await fetch(`http://localhost:5000/api/auth/staff/${staffUser.staffId}/achievements`, {
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
        `http://localhost:5000/api/auth/staff/${staffUser.staffId}/achievements/${achievementId}`,
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
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Faculty Profile</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          View your employment details and keep your contact information up to date
        </p>
      </div>

      {isSaved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${staffUser?.avatarColor || 'from-blue-600 to-indigo-700'} flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shrink-0`}>
            {staffUser?.avatarInitials || staffUser?.name?.substring(0, 2)?.toUpperCase() || 'ST'}
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
    </div>
  );
}


