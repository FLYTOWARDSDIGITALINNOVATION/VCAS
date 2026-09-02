import React, { useState } from 'react';
import { 
  GraduationCap, 
  UserCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Building2,
  Users
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
    { id: 'Staff', label: 'Staff', icon: Users, defaultEmail: 'staff@vcas.edu' }
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
        name: activeRole === 'Admin' ? 'Dr. Arunkumar S' : 'Meenakshi N (Staff)'
      });
    }, 900);
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

      {/* Centered Welcome Back Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
        <p className="text-slate-500 text-xs mt-0.5">
          Sign in to access your portal dashboard
        </p>
      </div>

      {/* Role Pills / Tabs */}
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
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        
        {errorMsg && (
          <div className="p-2.5 text-xs bg-red-50 text-red-600 rounded-xl border border-red-200 font-medium text-center">
            {errorMsg}
          </div>
        )}

        {/* Email / User ID field */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
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
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              required
            />
          </div>
        </div>

        {/* Password field */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
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
              className="w-full pl-10 pr-11 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
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
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            Remember me
          </label>
          <button 
            type="button" 
            onClick={(e) => { e.preventDefault(); alert('Please contact system administrator to reset password.'); }}
            className="text-blue-600 font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer text-xs"
          >
            Forgot password?
          </button>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-1.5 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-70 active:scale-[0.99]"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              Sign In to {activeRole} Portal
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-5 text-center border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-500 font-medium">
          Need help signing in?{' '}
          <button 
            type="button" 
            onClick={(e) => { e.preventDefault(); alert('Administrator Contact: admin@vcas.edu'); }}
            className="text-blue-600 font-bold hover:underline bg-transparent border-none p-0 cursor-pointer text-xs"
          >
            Contact Administrator
          </button>
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          VCAS Campus Automation Portal &copy; 2026. All rights reserved.
        </p>
      </div>

    </div>
  );
}
