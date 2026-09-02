import React, { useState, useEffect } from 'react';
import LoginCard from './components/LoginCard';
import Dashboard from './components/Dashboard';

export default function App() {
  // Restore user and login state from sessionStorage on page refresh
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = sessionStorage.getItem('vcas_user');
    return savedUser ? JSON.parse(savedUser) : {
      name: 'Admin User',
      role: 'Admin',
      email: 'admin@vcas.edu'
    };
  });

  const [viewMode, setViewMode] = useState(() => {
    const isLoggedIn = sessionStorage.getItem('vcas_isLoggedIn');
    return isLoggedIn === 'true' ? 'dashboard' : 'login';
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
      if (isLoggedIn === 'true') {
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
    <div className="h-full w-full overflow-hidden bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white">
      {viewMode === 'dashboard' ? (
        <Dashboard 
          user={currentUser} 
          onLogout={handleLogout} 
          onSwitchPortal={handleSwitchPortal} 
        />
      ) : (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#070f1e] overflow-y-auto">
          <div className="text-center mb-4 sm:mb-5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">VCAS Portal Login</h1>
            <p className="text-xs text-slate-400 mt-0.5">Sign in to access your administrative dashboard</p>
          </div>
          <LoginCard onLoginSuccess={handleLoginSuccess} />
        </div>
      )}
    </div>
  );
}
