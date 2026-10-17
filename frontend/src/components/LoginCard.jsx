import React, { useState, useEffect } from 'react';
import { BACKEND_URL, getKnownDepartments } from '../apiConfig';
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
  ChevronDown,
  ShieldCheck,
  Calendar,
  Sparkles,
  Phone,
  User
} from 'lucide-react';
import CollegeLogo from './CollegeLogo';

const API_BASE = BACKEND_URL;

const DEPARTMENTS = getKnownDepartments();

export default function LoginCard({ onLoginSuccess, initialRole = 'Student' }) {
  // Primary portal selection: 'Student' or staff/admin roles ('SuperAdmin' | 'Admin' | 'Staff')
  const [activeRole, setActiveRole] = useState(initialRole);
  
  // 'login' | 'signup' for Staff
  const [staffMode, setStaffMode] = useState('login');

  // ── Login form state ──────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // ── Staff Signup form state ───────────────────────────────────
  const [signup, setSignup] = useState({
    staffRole: 'Staff',
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
  const [departmentsList, setDepartmentsList] = useState(DEPARTMENTS);

  useEffect(() => {
    fetch(`${API_BASE}/api/departments`)
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data) && d.data.length > 0) {
          const names = d.data.map(item => item.name).filter(Boolean);
          setDepartmentsList(names.length > 0 ? names : getKnownDepartments());
        }
      })
      .catch(() => {});
  }, []);

  // ── Shared state ──────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Faculty and Admin sub-roles
  const facultyRoles = [
    { 
      id: 'SuperAdmin', 
      label: 'Super Admin', 
      icon: ShieldCheck, 
      badge: 'All Access' 
    },
    { 
      id: 'Admin', 
      label: 'Principal', 
      icon: Building2, 
      badge: 'Admin' 
    },
    { 
      id: 'Staff', 
      label: 'Faculty & Staff', 
      icon: Users, 
      badge: 'Teachers & Office' 
    }
  ];

  const handleRoleSelect = (roleId) => {
    setActiveRole(roleId);
    setEmail('');
    setPassword('');
    setErrorMsg('');
    setSuccessMsg('');
    setStaffMode('login');
  };

  // ── Login Handler ─────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanIdentifier = email.trim();
    if (!cleanIdentifier || !password) {
      if (activeRole === 'Student') {
        setErrorMsg('Please enter your Roll Number and Date of Birth.');
      } else {
        setErrorMsg('Please enter your email and password.');
      }
      return;
    }
    setIsLoading(true);
    setErrorMsg('');

    try {
      // 1. Student Portal Authentication
      if (activeRole === 'Student') {
        const studentRes = await fetch(`${API_BASE}/api/auth/student/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loginId: cleanIdentifier,
            password: password.trim()
          })
        });
        const studentData = await studentRes.json();

        if (studentRes.ok && studentData.success) {
          onLoginSuccess(studentData.student);
          return;
        } else {
          setErrorMsg(studentData.message || 'Invalid Register Number or Date of Birth.');
          return;
        }
      }

      // 2. Super Admin Tab Authentication
      if (activeRole === 'SuperAdmin') {
        const adminRes = await fetch(`${API_BASE}/api/auth/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: cleanIdentifier.toLowerCase(), 
            password,
            expectedRole: 'SuperAdmin'
          })
        });
        const adminData = await adminRes.json();

        if (adminRes.ok && adminData.success) {
          onLoginSuccess(adminData.user);
          return;
        } else {
          setErrorMsg(adminData.message || 'Invalid Super Admin credentials.');
          return;
        }
      }

      // 3. Principal / Admin Tab Authentication
      if (activeRole === 'Admin') {
        const adminRes = await fetch(`${API_BASE}/api/auth/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: cleanIdentifier.toLowerCase(), 
            password,
            expectedRole: 'Admin'
          })
        });
        const adminData = await adminRes.json();

        if (adminRes.ok && adminData.success) {
          onLoginSuccess(adminData.user);
          return;
        } else {
          setErrorMsg(adminData.message || 'Invalid Principal credentials.');
          return;
        }
      }

      // 4. Staff Portal Tab Authentication
      if (activeRole === 'Staff') {
        const response = await fetch(`${API_BASE}/api/auth/staff/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanIdentifier.toLowerCase(), password })
        });
        const data = await response.json();

        if (response.ok && data.success) {
          const s = data.staff;
          const initials = s.name
            ? s.name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim().split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
            : 'ST';
          
          const resolvedRole = s.role || (
            s.designation === 'Accountant' || s.department?.includes('Account') ? 'Accountant' :
            s.designation === 'Office Staff' || s.department?.includes('Office') ? 'Office Staff' :
            'Staff'
          );
          const isFinanceStaff = resolvedRole === 'Accountant' || resolvedRole === 'Office Staff';

          onLoginSuccess({
            ...s,
            role: resolvedRole,
            canViewFees: isFinanceStaff,
            subjects: s.subjects || (s.classes ? s.classes.map(c => c.code) : []),
            avatarColor: s.avatarBg || (resolvedRole === 'Accountant' ? 'from-amber-600 to-orange-600' : resolvedRole === 'Office Staff' ? 'from-emerald-600 to-teal-600' : 'from-blue-600 to-indigo-600'),
            avatarInitials: s.avatarText || initials
          });
        } else {
          setErrorMsg(data.message || 'Invalid staff email/ID or password.');
        }
        return;
      }
    } catch (err) {
      setErrorMsg('Unable to connect to VCAS server. Please make sure the backend is running on port 5000.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Staff Self-Registration Handler ───────────────────────────
  const handleStaffSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

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
          role: signup.staffRole,
          department: signup.department,
          designation: signup.designation
        })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        const s = data.staff;
        const initials = s.name
          ? s.name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim().split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
          : (signup.staffRole === 'Accountant' ? 'ACC' : signup.staffRole === 'Office Staff' ? 'OS' : 'ST');
        
        const effectiveRole = signup.staffRole || 'Staff';
        const isFinanceStaff = effectiveRole === 'Accountant' || effectiveRole === 'Office Staff';

        onLoginSuccess({
          ...s,
          role: effectiveRole,
          canViewFees: isFinanceStaff,
          isProfileCompleted: isFinanceStaff ? true : false,
          subjects: [],
          avatarColor: s.avatarBg || (effectiveRole === 'Accountant' ? 'from-amber-600 to-orange-600' : effectiveRole === 'Office Staff' ? 'from-emerald-600 to-teal-600' : 'from-blue-600 to-indigo-600'),
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

  const isStudentPortal = activeRole === 'Student';

  return (
    <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-200/80 p-6 sm:p-8 text-slate-800 transition-all duration-300">
      
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-5">
        <CollegeLogo size="lg" showText={false} className="mb-2" />
        <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 leading-tight uppercase">
          VIVEKANANDA COLLEGE OF ARTS & SCIENCE
        </h1>
        <p className="text-[11px] text-blue-600 font-bold mt-0.5">Vellalankulam Campus Automation • VCAS Portal</p>
      </div>

      {/* ── TOP-LEVEL PORTAL SELECTOR: STUDENT vs FACULTY/ADMIN ──── */}
      <div className="grid grid-cols-2 gap-2 mb-5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => handleRoleSelect('Student')}
          className={`py-3 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isStudentPortal
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>🎓 Student Portal</span>
        </button>
        <button
          type="button"
          onClick={() => handleRoleSelect(activeRole === 'Student' ? 'SuperAdmin' : activeRole)}
          className={`py-3 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            !isStudentPortal
              ? 'bg-[#0f1e3c] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>🏛️ Faculty & Admin</span>
        </button>
      </div>

      {/* ── SUB-HEADER BANNER ─────────────────────────────────────── */}
      <div className="text-center mb-4">
        {isStudentPortal ? (
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200 mb-1.5">
              Official Student Access Portal
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Student Sign In
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Sign In using Roll Number &amp; Date of Birth as Password
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {activeRole === 'Staff' && staffMode === 'signup' ? 'Create Staff Account' : 'Faculty & Admin Sign In'}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {activeRole === 'Staff' && staffMode === 'signup'
                ? 'Register yourself as a staff member'
                : 'Sign in to access your administrative dashboard'}
            </p>
          </div>
        )}
      </div>

      {/* ── FACULTY / ADMIN ROLE TABS (Only shown in Faculty & Admin mode) ──── */}
      {!isStudentPortal && (
        <div className="mb-4">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 text-center">
            Select Administrative Role
          </label>
          <div className="flex justify-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200">
            {facultyRoles.map((role) => {
              const Icon = role.icon;
              const isActive = activeRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleSelect(role.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60 font-black'
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
      )}

      {/* ── STAFF SIGN IN / SIGN UP TOGGLE ───────────────────────── */}
      {activeRole === 'Staff' && (
        <div className="flex gap-1.5 mb-4 p-1 bg-indigo-50/80 rounded-xl border border-indigo-200/80">
          <button
            type="button"
            onClick={() => { setStaffMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              staffMode === 'login'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-700 hover:bg-indigo-100/60'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setStaffMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              staffMode === 'signup'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-700 hover:bg-indigo-100/60'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Sign Up
          </button>
        </div>
      )}

      {/* Error / Success Notifications */}
      {errorMsg && (
        <div className="mb-4 p-3.5 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200 font-semibold flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3.5 text-xs bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 font-semibold flex items-start gap-2.5 animate-fadeIn">
          <span>✓ {successMsg}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. STAFF SIGN-UP FORM                                       */}
      {/* ─────────────────────────────────────────────────────────── */}
      {!isStudentPortal && activeRole === 'Staff' && staffMode === 'signup' && (
        <form onSubmit={handleStaffSignup} className="space-y-3.5 text-xs animate-fadeIn">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={signup.name}
              onChange={(e) => setSignup({ ...signup, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={signup.email}
                onChange={(e) => setSignup({ ...signup, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Staff ID (Optional)</label>
              <input
                type="text"
                value={signup.staffId}
                onChange={(e) => setSignup({ ...signup, staffId: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Department / Category</label>
              <select
                value={signup.department}
                onChange={(e) => {
                  const val = e.target.value;
                  setSignup(prev => ({
                    ...prev,
                    department: val,
                    staffRole: val === 'Office' ? 'Office Staff' : prev.staffRole
                  }));
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none"
              >
                {departmentsList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Role Category</label>
              <select
                value={signup.staffRole}
                onChange={(e) => setSignup({ ...signup, staffRole: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none"
              >
                <option value="Staff">Teaching Faculty</option>
                <option value="Accountant">Accountant</option>
                <option value="Office Staff">Office Staff</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Password *</label>
              <input
                type="password"
                required
                value={signup.password}
                onChange={(e) => setSignup({ ...signup, password: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Confirm Password *</label>
              <input
                type="password"
                required
                value={signup.confirmPassword}
                onChange={(e) => setSignup({ ...signup, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Staff Account</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. PRIMARY SIGN-IN FORM (STUDENT, SUPER ADMIN, PRINCIPAL, STAFF) */}
      {/* ─────────────────────────────────────────────────────────── */}
      {(isStudentPortal || activeRole !== 'Staff' || staffMode === 'login') && (
        <form onSubmit={handleLogin} className="space-y-4 text-xs animate-fadeIn">
          
          {/* Identifier Input (Reg No for Student / Email for Others) */}
          <div>
            <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center justify-between">
              <span>
                {isStudentPortal
                  ? 'Roll Number (Roll No) *'
                  : activeRole === 'Staff'
                  ? 'Staff Email Address or Staff ID *'
                  : activeRole === 'Admin'
                  ? 'Principal Email Address *'
                  : 'Super Admin Email Address *'}
              </span>
              {isStudentPortal && (
                <span className="text-[10px] text-blue-700 font-extrabold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Roll No
                </span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                {isStudentPortal ? <IdCard className="w-4 h-4 text-blue-600" /> : <Mail className="w-4 h-4" />}
              </div>
              <input
                id="login-identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                required
              />
            </div>
          </div>

          {/* Password (Date of Birth for Student) */}
          <div>
            <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center justify-between">
              <span>{isStudentPortal ? 'Password (Date of Birth) *' : 'Password *'}</span>
              {isStudentPortal && (
                <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  DOB as Password
                </span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                {isStudentPortal ? <Calendar className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4" />}
              </div>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {isStudentPortal && (
              <p className="text-[11px] text-slate-500 mt-1 pl-0.5 leading-snug">
                Enter your registered Date of Birth as your password.
              </p>
            )}
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
              <span className="text-xs text-slate-600 group-hover:text-slate-800 transition-colors font-medium">Remember me</span>
            </label>
            <a
              href="#forgot-password"
              onClick={(e) => { 
                e.preventDefault(); 
                alert(isStudentPortal ? 'Please contact the college academic office with your Reg No to verify your Date of Birth.' : 'Please contact the Super Administrator to reset your password.'); 
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all"
            >
              Forgot password?
            </a>
          </div>

          {/* Big Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-2 py-3.5 px-4 text-white rounded-xl text-xs sm:text-sm font-black shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 ${
              isStudentPortal
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20 hover:shadow-blue-500/30'
                : 'bg-gradient-to-r from-[#0f1e3c] to-[#1e3a6f] hover:from-[#162a52] hover:to-[#274887]'
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>
                  {isStudentPortal 
                    ? 'Sign In to Student Portal' 
                    : activeRole === 'Staff' 
                    ? 'Sign In to Staff Portal' 
                    : activeRole === 'Admin' 
                    ? 'Sign In to Principal Portal' 
                    : 'Sign In to Super Admin Portal'}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>
      )}

    </div>
  );
}
