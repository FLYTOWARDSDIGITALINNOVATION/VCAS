import React, { useState, useEffect } from 'react';
import LoginCard from './components/LoginCard';
import Dashboard from './components/Dashboard';
import StaffDashboard from './components/staff/StaffDashboard';
import StaffFirstTimeSetup from './components/staff/StaffFirstTimeSetup';
import StudentDashboard from './components/StudentDashboard';
import CollegeLogo from './components/CollegeLogo';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('VCAS Application Caught Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-white p-6 font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
              ⚠️
            </div>
            <h2 className="text-xl font-extrabold text-white">Temporary View Issue</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              A temporary issue occurred while rendering this view. You can reload or reset to resume.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  sessionStorage.clear();
                  localStorage.removeItem('vcas_user');
                  window.location.href = '/login';
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
              >
                Reset Session & Login
              </button>
            </div>
            {this.state.error && (
              <p className="text-[10px] font-mono text-rose-300/80 bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/60 max-h-24 overflow-auto text-left">
                {this.state.error.toString()}
              </p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Restore user and login state from sessionStorage on page refresh
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = sessionStorage.getItem('vcas_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [viewMode, setViewMode] = useState(() => {
    const isLoggedIn = sessionStorage.getItem('vcas_isLoggedIn');
    const savedUser = sessionStorage.getItem('vcas_user');
    return (isLoggedIn === 'true' && savedUser) ? 'dashboard' : 'login';
  });

  // Sync browser URL with viewMode state
  useEffect(() => {
    if (viewMode === 'login') {
      window.history.replaceState(null, '', '/login');
    } else if (viewMode === 'dashboard') {
      if (window.location.pathname !== '/dashboard') {
        window.history.replaceState(null, '', '/dashboard');
      }
    }
  }, [viewMode]);

  // Handle browser popstate navigation
  useEffect(() => {
    const handlePopState = () => {
      const isLoggedIn = sessionStorage.getItem('vcas_isLoggedIn');
      const savedUser = sessionStorage.getItem('vcas_user');
      if (isLoggedIn === 'true' && savedUser) {
        setViewMode('dashboard');
      } else {
        setViewMode('login');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLoginSuccess = (userData) => {
    sessionStorage.setItem('vcas_isLoggedIn', 'true');
    sessionStorage.setItem('vcas_user', JSON.stringify(userData));
    setCurrentUser(userData);
    setViewMode('dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('vcas_isLoggedIn');
    sessionStorage.removeItem('vcas_user');
    sessionStorage.removeItem('vcas_activeNav');
    sessionStorage.removeItem('vcas_selectedFeeType');
    sessionStorage.removeItem('vcas_staff_nav');
    setCurrentUser(null);
    setViewMode('login');
  };

  const handleSwitchPortal = (newRole) => {
    setCurrentUser(prev => ({
      ...prev,
      role: newRole,
      name: newRole === 'Admin' ? 'Admin User' : 'Staff User'
    }));
  };

  return (
    <ErrorBoundary>
      <div className="h-full w-full overflow-auto bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white">
        {viewMode === 'dashboard' ? (
          currentUser?.role === 'Student' ? (
            <StudentDashboard
              student={currentUser}
              onLogout={handleLogout}
            />
          ) : currentUser?.role === 'Staff' ? (
            !currentUser?.isProfileCompleted ? (
              <StaffFirstTimeSetup 
                staffUser={currentUser} 
                onComplete={handleLoginSuccess}
                onLogout={handleLogout}
              />
            ) : (
              <StaffDashboard 
                staffUser={currentUser} 
                onLogout={handleLogout} 
              />
            )
          ) : (
            <Dashboard 
              user={currentUser} 
              onLogout={handleLogout} 
              onSwitchPortal={handleSwitchPortal} 
            />
          )
        ) : (
          <div className="min-h-screen w-full overflow-y-auto bg-[#070f1e] flex flex-col items-center py-8 px-4 sm:px-6">
            <div className="flex flex-col items-center text-center mb-4 sm:mb-5 mt-2">
              <CollegeLogo size="xl" showText={false} className="mb-2" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white text-center">VIVEKANANDA COLLEGE OF ARTS & SCIENCE</h1>
              <p className="text-xs text-blue-300 font-semibold mt-1">Vellalankulam • Campus Automation System • VCAS Portal</p>
            </div>
            <LoginCard onLoginSuccess={handleLoginSuccess} />
            <div className="pb-8" />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
