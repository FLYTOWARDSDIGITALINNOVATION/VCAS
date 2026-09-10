import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

export default function StaffFirstTimeSetup({ staffUser, onComplete, onLogout }) {
  const [formData, setFormData] = useState({
    phone: staffUser.phone || '',
    qualification: staffUser.qualification || '',
    experience: staffUser.experience || '',
    bloodGroup: staffUser.bloodGroup || 'O+',
    dob: staffUser.dob || '',
    address: staffUser.address || '',
    emergencyContact: staffUser.emergencyContact || '',
    newPassword: '',
    confirmPassword: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const errs = {};
    if (!formData.phone.trim()) {
      errs.phone = 'Mobile phone number is required';
    }
    if (!formData.qualification.trim()) {
      errs.qualification = 'Please enter your academic qualifications (e.g. M.Tech, Ph.D.)';
    }
    if (!formData.experience.trim()) {
      errs.experience = 'Please enter your teaching / professional experience';
    }
    if (!formData.address.trim()) {
      errs.address = 'Residential address is required';
    }
    if (!formData.emergencyContact.trim()) {
      errs.emergencyContact = 'Emergency contact person and phone is required';
    }
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        errs.newPassword = 'Password must be at least 6 characters';
      } else if (formData.newPassword !== formData.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match';
      }
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      const payload = {
        phone: formData.phone.trim(),
        qualification: formData.qualification.trim(),
        experience: formData.experience.trim(),
        bloodGroup: formData.bloodGroup,
        dob: formData.dob,
        address: formData.address.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        newPassword: formData.newPassword ? formData.newPassword.trim() : undefined
      };

      const res = await fetch(`${API_BASE}/api/auth/staff/${staffUser.staffId}/complete-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Callback to App.jsx with updated staff object
        onComplete({
          ...staffUser,
          ...data.staff,
          isProfileCompleted: true
        });
      } else {
        setServerError(data.message || 'Failed to update profile. Please try again.');
      }
    } catch (err) {
      setServerError('Unable to connect to the VCAS server. Please ensure backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full mx-auto space-y-6">
        
        {/* TOP BRAND & WELCOME BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 border border-slate-700 p-5 rounded-3xl backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-white font-extrabold text-base sm:text-lg tracking-tight">
                  Welcome, {staffUser.name}!
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {staffUser.staffId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {staffUser.designation} · Department of {staffUser.department}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-slate-700/60 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* ONBOARDING INSTRUCTION BANNER */}
        <div className="bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-500/30 p-5 rounded-3xl text-blue-100 flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              First-Time Faculty Profile Setup
            </h2>
            <p className="text-xs text-blue-200/90 mt-1 leading-relaxed">
              Your institutional account has been initialized. Because the administration may not know all your personal and academic credentials, please complete the details below. 
              <strong> The information you submit will be stored directly into your MongoDB database profile and will be visible in the Admin Staff section.</strong>
            </p>
          </div>
        </div>

        {/* MAIN SETUP FORM CARD */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-8 text-slate-800">
          
          {serverError && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* SECTION 1: ACADEMIC & QUALIFICATIONS */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Academic & Teaching Qualifications
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Highest Educational Qualifications *
                  </label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g. Ph.D. in Computer Science (IIT Madras), M.Tech in AI"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none transition-all ${
                      formErrors.qualification ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.qualification && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.qualification}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teaching & Professional Experience *
                  </label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="e.g. 8 Years Teaching Experience (4 Years at VCAS)"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none transition-all ${
                      formErrors.experience ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.experience && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.experience}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    {BLOOD_GROUPS.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: CONTACT & RESIDENCE */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Contact & Residential Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Personal Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none transition-all ${
                      formErrors.phone ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Emergency Contact Person & Phone *
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="e.g. Mr. Rajesh (Spouse) - 9840123456"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none transition-all ${
                      formErrors.emergencyContact ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.emergencyContact && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.emergencyContact}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Residential Address *
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 42, Faculty Quarters, VCAS Campus, Vellalankulam"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none transition-all resize-none ${
                      formErrors.address ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.address && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.address}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: OPTIONAL NEW PASSWORD */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Set Private Password (Optional)
                </h3>
              </div>

              <p className="text-[11px] text-slate-500">
                You can replace your initial password with your own private password, or leave blank to keep your current password.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                  />
                  {formErrors.newPassword && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Complete Profile &rarr; Open Dashboard</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}
