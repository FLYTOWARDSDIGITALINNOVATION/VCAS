import React, { useState } from 'react';
import LoginCard from './components/LoginCard';
import Dashboard from './components/Dashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState({
    name: 'Admin User',
    role: 'Admin',
    email: 'admin@vcas.edu'
  });
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' or 'login'

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setViewMode('dashboard');
  };

  const handleLogout = () => {
    setViewMode('login');
  };

  const handleSwitchPortal = (newRole) => {
    setCurrentUser(prev => ({
      ...prev,
      role: newRole,
      name: newRole === 'Admin' ? 'Admin User' : newRole === 'Faculty' ? 'Prof. Ramesh Kumar' : 'Student Demo'
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
        <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-[#070f1e] overflow-y-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white">Vidyapeeth Portal Login</h1>
            <p className="text-xs text-slate-400 mt-1">Sign in to access your administrative dashboard</p>
          </div>
          <LoginCard onLoginSuccess={handleLoginSuccess} />
        </div>
      )}
    </div>
  );
}
