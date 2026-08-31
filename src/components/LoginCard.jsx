import React, { useState } from 'react';
import { 
  GraduationCap, 
  UserCheck, 
  BookOpen, 
  CreditCard, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function LoginCard({ onLoginSuccess }) {
  const [activeRole, setActiveRole] = useState('Admin');
  const [email, setEmail] = useState('admin@vcas.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const roles = [
    { id: 'Admin', label: 'Admin', icon: Building2, defaultEmail: 'admin@vcas.edu' },
    { id: 'Staff', label: 'Staff', icon: Users, defaultEmail: 'staff@vcas.edu' },
    { id: 'Faculty', label: 'Faculty', icon: UserCheck, defaultEmail: 'faculty@vcas.edu' }
  ];

  const handleRoleSelect = (role) => {
    setActiveRole(role.id);
    setEmail(role.defaultEmail);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both User ID / Email and Password.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    
    // Simulate login delay
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        role: activeRole,
        email: email,
        name: activeRole === 'Admin' ? 'Dr. Arunkumar S' :
              activeRole === 'Faculty' ? 'Prof. Sundararajan' :
              activeRole === 'Student' ? 'Praveen Kumar' :
              activeRole === 'Staff' ? 'Meenakshi N' : 'Karthik Raja (Parent)'
      });
    }, 900);
  };

  return (
    <div className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl bg-white flex flex-col md:flex-row border border-slate-700/30 transition-all duration-300">
      
      {/* Left Panel - Dark Navy Theme */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-[#102a45] via-[#0d2238] to-[#081829] p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
        
        {/* Subtle Background Art Blur */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-[#0d2238] rounded-[14px] flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                VidyaVeda <span className="text-cyan-400 text-xs font-semibold uppercase px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/50 ml-1">VCAS</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">Campus Automation System</p>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="my-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-cyan-300 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Educational Portal
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-3">
            Empowering Education <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Through Technology
            </span>
          </h2>
          
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Unified management system for academics, admissions, faculty analytics, and student tracking in one cloud interface.
          </p>

          {/* Features List */}
          <div className="space-y-3">
            {[
              "Student Admission & Records",
              "Staff & Faculty Portal",
              "Attendance & Marks Tracking",
              "Fee & Financial Analytics"
            ].map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs md:text-sm text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Graphic Preview Card */}
        <div className="relative z-10 bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50 shadow-inner flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">256-bit Encrypted Portal</p>
              <p className="text-[11px] text-slate-400">Secure Access for All Campus Stakeholders</p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      </div>

      {/* Right Panel - White Form Theme */}
      <div className="w-full md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-between text-slate-800">
        
        <div>
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
              Sign in to access your portal dashboard
            </p>
          </div>

          {/* Role Pills / Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Role
            </label>
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200">
              {roles.map((role) => {
                const Icon = role.icon;
                const isActive = activeRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60 font-bold'
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {errorMsg && (
              <div className="p-3 text-xs bg-red-50 text-red-600 rounded-xl border border-red-200 font-medium">
                {errorMsg}
              </div>
            )}

            {/* Email / User ID field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                User ID / Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@vcas.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                Remember me
              </label>
              <a href="#forgot" className="text-blue-600 font-semibold hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-70 active:scale-[0.99]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In to {activeRole} Portal
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500 font-medium">
            Need help signing in?{' '}
            <a href="#help" className="text-blue-600 font-bold hover:underline">
              Contact Administrator
            </a>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            VCAS Campus Automation Portal &copy; 2026. All rights reserved.
          </p>
        </div>

      </div>

    </div>
  );
}
