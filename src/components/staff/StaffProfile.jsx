import React, { useState } from 'react';
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
  Users
} from 'lucide-react';
import { SUBJECTS } from './staffData';

export default function StaffProfile({ staffUser }) {
  const [phone, setPhone] = useState(staffUser.phone || '');
  const [altPhone, setAltPhone] = useState(staffUser.altPhone || '');
  const [address, setAddress] = useState(staffUser.address || '');
  const [emergencyContact, setEmergencyContact] = useState(staffUser.emergencyContact || '');
  const [isSaved, setIsSaved] = useState(false);

  const mySubjects = (staffUser.subjects || []).map(code => SUBJECTS[code]).filter(Boolean);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 4000);
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
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${staffUser.avatarColor} flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shrink-0`}>
            {staffUser.avatarInitials}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-xl font-extrabold text-slate-900">{staffUser.name}</h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                {staffUser.staffId}
              </span>
            </div>
            <p className="text-xs font-semibold text-blue-600 mt-1">
              {staffUser.designation} – Department of {staffUser.department}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {staffUser.qualification}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                {staffUser.experience} Experience
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Joined: {staffUser.joiningDate}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Blood Group: {staffUser.bloodGroup}
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
                {staffUser.classTeacherOf || 'N/A'}
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
            Contact & Address Details (Editable)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Email (Read-only)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={staffUser.email}
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
    </div>
  );
}
