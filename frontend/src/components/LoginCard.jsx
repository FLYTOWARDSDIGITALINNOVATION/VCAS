import React, { useState } from 'react';
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Building2,
  Users,
  AlertCircle,
  UserPlus,
  LogIn,
  IdCard,
  BookOpen,
  ChevronDown
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

const DEPARTMENTS = [
  'Computer Science',
  'Electronics',
  'MBA',
  'Mechanical',
  'Civil',
  'BCA',
  'Information Technology',
  'Mathematics',
  'Physics',
  'English'
];

const DESIGNATIONS = [
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'HOD',
  'Lecturer',
  'Lab Assistant',
  'Visiting Professor'
];

export default function LoginCard({ onLoginSuccess }) {
  const [activeRole, setActiveRole] = useState('Admin');
  // 'login' | 'signup'  — only relevant when activeRole === 'Staff'
  const [staffMode, setStaffMode] = useState('login');

  // ── Login form state ──────────────────────────────────────────
  const [email, setEmail] = useState('admin@vcas.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // ── Signup form state ─────────────────────────────────────────
  const [signup, setSignup] = useState({
    name: '',
    staffId: '',
    email: '',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    password: '',
    confirmPassword: ''
  });
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showSignupCPw, setShowSignupCPw] = useState(false);

  // ── Shared state ──────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const roles = [
    { id: 'Admin', label: 'Admin', icon: Building2, defaultEmail: 'admin@vcas.edu', defaultPassword: '••••••••••••' },
    { id: 'Staff', label: 'Staff', icon: Users, defaultEmail: '', defaultPassword: '' }
  ];

  const handleRoleSelect = (role) => {
    setActiveRole(role.id);
    setEmail(role.defaultEmail);
    setPassword(role.defaultPassword);
    setErrorMsg('');
    setSuccessMsg('');
    setStaffMode('login');
  };

  const switchStaffMode = (mode) => {
    setStaffMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
    setSignup({ name: '', staffId: '', email: '', department: 'Computer Science', designation: 'Assistant Professor', password: '', confirmPassword: '' });
  };

  // ── Staff Login ───────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both Email and Password.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (activeRole === 'Staff') {
        const response = await fetch(`${API_BASE}/api/auth/staff/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password })
        });
        const data = await response.json();

        if (response.ok && data.success) {
          const s = data.staff;
          const initials = s.name
            ? s.name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim().split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
            : 'ST';
          onLoginSuccess({
            ...s,
            role: 'Staff',
            subjects: s.subjects || (s.classes ? s.classes.map(c => c.code) : []),
            avatarColor: s.avatarBg || 'from-blue-600 to-indigo-600',
            avatarInitials: s.avatarText || initials
          });
        } else {
          setErrorMsg(data.message || 'Invalid email or password.');
        }
      } else {
        // Admin — simple local auth for now
        setTimeout(() => {
          onLoginSuccess({
            role: 'Admin',
            email: email.trim(),
            name: 'Dr. Arunkumar S (Principal)'
          });
        }, 300);
      }
    } catch (err) {
      setErrorMsg('Unable to connect to VCAS server. Please make sure the backend is running on port 5000.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Staff Sign Up ─────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validate
    if (!signup.name.trim()) return setErrorMsg('Full name is required.');
    if (!signup.email.trim()) return setErrorMsg('Email address is required.');
    if (!signup.password) return setErrorMsg('Password is required.');
    if (signup.password.length < 6) return setErrorMsg('Password must be at least 6 characters.');
    if (signup.password !== signup.confirmPassword) return setErrorMsg('Passwords do not match.');

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/staff/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: signup.staffId.trim() ? signup.staffId.trim().toUpperCase() : undefined,
          name: signup.name.trim(),
          email: signup.email.trim().toLowerCase(),
          password: signup.password,
          department: signup.department,
          designation: signup.designation
        })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        // Auto-login after successful registration → goes to first-time setup
        const s = data.staff;
        const initials = s.name
          ? s.name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim().split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
          : 'ST';
        onLoginSuccess({
          ...s,
          role: 'Staff',
          isProfileCompleted: false,
          subjects: [],
          avatarColor: s.avatarBg || 'from-blue-600 to-indigo-600',
          avatarInitials: s.avatarText || initials
        });
      } else {
        setErrorMsg(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Unable to connect to VCAS server. Please make sure the backend is running on port 5000.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-200/80 p-6 sm:p-7 text-slate-800 transition-all duration-300">
      
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-4">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-md shadow-blue-500/20 mb-2">
          <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 leading-tight">
          Vivekananda College of Arts and Science
        </h1>
        <p className="text-[11px] text-blue-600 font-bold mt-0.5">Vellalankulam Campus Automation</p>
      </div>

      {/* Header text — changes based on mode */}
      <div className="text-center mb-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {activeRole === 'Staff' && staffMode === 'signup' ? 'Create Staff Account' : 'Welcome Back'}
        </h2>
        <p className="text-slate-500 text-xs mt-0.5">
          {activeRole === 'Staff' && staffMode === 'signup'
            ? 'Register yourself as a staff member'
            : 'Sign in to access your portal dashboard'}
        </p>
      </div>

      {/* Role Tabs */}
      <div className="mb-4">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 text-center">
          Select Role
        </label>
        <div className="flex justify-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200">
          {roles.map((role) => {
            const Icon = role.icon;
            const isActive = activeRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {role.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Staff Sign In / Sign Up toggle — only shown when Staff role is active */}
      {activeRole === 'Staff' && (
        <div className="flex gap-1.5 mb-4 p-1 bg-blue-50 rounded-xl border border-blue-100">
          <button
            type="button"
            onClick={() => switchStaffMode('login')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              staffMode === 'login'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-blue-700 hover:bg-blue-100/60'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchStaffMode('signup')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              staffMode === 'signup'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-blue-700 hover:bg-blue-100/60'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Sign Up
          </button>
        </div>
      )}

      {/* Error / Success Message */}
      {errorMsg && (
        <div className="mb-3 p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200 font-medium flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-3 p-3 text-xs bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 font-medium flex items-start gap-2">
          <span>✓ {successMsg}</span>
        </div>
      )}

      {/* ── SIGN-UP FORM (Staff only) ────────────────────────────── */}
      {activeRole === 'Staff' && staffMode === 'signup' ? (
        <form onSubmit={handleSignup} className="space-y-3">

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Users className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={signup.name}
                onChange={(e) => setSignup({ ...signup, name: e.target.value })}
                placeholder="e.g. Dr. Ravi Kumar"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Staff ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Staff ID <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <IdCard className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={signup.staffId}
                onChange={(e) => setSignup({ ...signup, staffId: e.target.value.toUpperCase() })}
                placeholder="e.g. EMP005 (auto-generated if empty)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium uppercase tracking-wider"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Optional - Admin ID (auto-generated if left blank)</p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={signup.email}
                onChange={(e) => setSignup({ ...signup, email: e.target.value })}
                placeholder="e.g. ravi.kumar@vcas.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Department & Designation — side by side */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
              <div className="relative">
                <select
                  value={signup.department}
                  onChange={(e) => setSignup({ ...signup, department: e.target.value })}
                  className="w-full appearance-none pl-3 pr-7 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Designation *</label>
              <div className="relative">
                <select
                  value={signup.designation}
                  onChange={(e) => setSignup({ ...signup, designation: e.target.value })}
                  className="w-full appearance-none pl-3 pr-7 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showSignupPw ? 'text' : 'password'}
                value={signup.password}
                onChange={(e) => setSignup({ ...signup, password: e.target.value })}
                placeholder="Min. 6 characters"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                required
              />
              <button type="button" onClick={() => setShowSignupPw(!showSignupPw)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                {showSignupPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showSignupCPw ? 'text' : 'password'}
                value={signup.confirmPassword}
                onChange={(e) => setSignup({ ...signup, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                required
              />
              <button type="button" onClick={() => setShowSignupCPw(!showSignupCPw)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                {showSignupCPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account & Continue</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>

          {/* Switch to Sign In */}
          <p className="text-center text-[11px] text-slate-500 mt-1">
            Already have an account?{' '}
            <button type="button" onClick={() => switchStaffMode('login')} className="text-blue-600 font-bold hover:underline cursor-pointer">
              Sign In
            </button>
          </p>
        </form>

      ) : (
        /* ── SIGN-IN FORM ────────────────────────────────────────── */
        <form onSubmit={handleLogin} className="space-y-3.5">

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {activeRole === 'Staff' ? 'Staff Email Address' : 'User ID / Email Address'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeRole === 'Staff' ? 'e.g. staff.name@vcas.edu' : 'admin@vcas.edu'}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors"
              />
              <span className="text-xs text-slate-600 group-hover:text-slate-800 transition-colors">Remember me</span>
            </label>
            <a
              href="#forgot-password"
              onClick={(e) => { e.preventDefault(); alert('Please contact the campus system administrator to reset credentials.'); }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline transition-all"
            >
              Forgot password?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to {activeRole} Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>

          {/* Switch to Sign Up (Staff only) */}
          {activeRole === 'Staff' && (
            <p className="text-center text-[11px] text-slate-500 mt-1">
              New staff member?{' '}
              <button type="button" onClick={() => switchStaffMode('signup')} className="text-blue-600 font-bold hover:underline cursor-pointer">
                Create your account
              </button>
            </p>
          )}

        </form>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 text-center">
        <p className="text-[11px] text-slate-400">
          Need help signing in? <span className="text-slate-600 font-medium">Contact Administrator</span>
        </p>
        <p className="text-[10px] text-slate-300 mt-0.5">VCAS Campus Automation Portal © 2026</p>
      </div>

    </div>
  );
}
