import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Key, 
  Lock, 
  Eye, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  X, 
  Shield, 
  Check, 
  AlertTriangle, 
  Smartphone, 
  Clock, 
  UserCheck, 
  Sparkles,
  Layers,
  RefreshCw,
  Mail,
  Phone
} from 'lucide-react';
import ModalPortal from './ModalPortal';

const INITIAL_USERS = [
  {
    id: 1,
    name: 'Dr. Sunita Rao',
    email: 'sunita.rao@vcas.edu',
    empId: 'FAC-CS-001',
    phone: '+91 98112 23344',
    role: 'HOD',
    department: 'Computer Science',
    status: 'Active',
    twoFactorEnabled: true,
    lastLogin: 'Today, 10:45 AM',
    createdDate: '2022-06-15'
  },
  {
    id: 2,
    name: 'Prof. Ramesh Kumar',
    email: 'ramesh.k@vcas.edu',
    empId: 'FAC-EC-004',
    phone: '+91 98112 23345',
    role: 'Faculty',
    department: 'Electronics & Comm',
    status: 'Active',
    twoFactorEnabled: true,
    lastLogin: 'Today, 09:12 AM',
    createdDate: '2021-08-10'
  },
  {
    id: 3,
    name: 'Admin User',
    email: 'admin@vcas.edu',
    empId: 'ADM-SYS-001',
    phone: '+91 98400 11111',
    role: 'Super Admin',
    department: 'Administration',
    status: 'Active',
    twoFactorEnabled: true,
    lastLogin: 'Just now',
    createdDate: '2020-01-01'
  },
  {
    id: 4,
    name: 'Mr. K. Narayanan',
    email: 'accounts@vcas.edu',
    empId: 'STAFF-FIN-002',
    phone: '+91 98401 55667',
    role: 'Accountant',
    department: 'Finance & Accounts',
    status: 'Active',
    twoFactorEnabled: false,
    lastLogin: 'Yesterday, 04:30 PM',
    createdDate: '2023-01-12'
  },
  {
    id: 5,
    name: 'Aditya Kapoor',
    email: 'aditya.k@student.vcas.edu',
    empId: 'VCAS22CS001',
    phone: '+91 98402 77889',
    role: 'Student',
    department: 'Computer Science',
    status: 'Active',
    twoFactorEnabled: true,
    lastLogin: 'Today, 11:20 AM',
    createdDate: '2022-09-01'
  },
  {
    id: 6,
    name: 'Dr. Neeraj Gupta',
    email: 'neeraj.gupta@vcas.edu',
    empId: 'FAC-EC-009',
    phone: '+91 98403 44556',
    role: 'Faculty',
    department: 'Electronics & Comm',
    status: 'Inactive',
    twoFactorEnabled: false,
    lastLogin: '5 days ago',
    createdDate: '2024-02-15'
  }
];

const ROLES_LIST = [
  'Super Admin',
  'Principal / Dean',
  'HOD',
  'Faculty',
  'Student',
  'Accountant',
  'Librarian'
];

const MODULE_PERMISSIONS_MATRIX = [
  { module: 'Students Management', SuperAdmin: ['R', 'W', 'D', 'A'], HOD: ['R', 'W', 'E'], Faculty: ['R', 'W'], Student: ['R'], Accountant: ['R'] },
  { module: 'Staff & Faculty', SuperAdmin: ['R', 'W', 'D', 'A'], HOD: ['R', 'W'], Faculty: ['R'], Student: ['-'], Accountant: ['R'] },
  { module: 'Departments & Courses', SuperAdmin: ['R', 'W', 'D', 'A'], HOD: ['R', 'W', 'E'], Faculty: ['R'], Student: ['R'], Accountant: ['R'] },
  { module: 'Attendance & Leave', SuperAdmin: ['R', 'W', 'D', 'A'], HOD: ['R', 'W', 'D'], Faculty: ['R', 'W'], Student: ['R'], Accountant: ['-'] },
  { module: 'Examinations & Marks', SuperAdmin: ['R', 'W', 'D', 'A'], HOD: ['R', 'W', 'D'], Faculty: ['R', 'W'], Student: ['R'], Accountant: ['-'] },
  { module: 'Fee Collections & Dues', SuperAdmin: ['R', 'W', 'D', 'A'], HOD: ['R'], Faculty: ['-'], Student: ['R', 'Pay'], Accountant: ['R', 'W', 'D'] },
  { module: 'Notices & Circulars', SuperAdmin: ['R', 'W', 'D', 'A'], HOD: ['R', 'W'], Faculty: ['R', 'W'], Student: ['R'], Accountant: ['R'] },
  { module: 'Reports & Analytics', SuperAdmin: ['R', 'W', 'D', 'A'], HOD: ['R', 'W'], Faculty: ['R'], Student: ['-'], Accountant: ['R', 'W'] },
  { module: 'System Settings & RBAC', SuperAdmin: ['R', 'W', 'D', 'A'], HOD: ['-'], Faculty: ['-'], Student: ['-'], Accountant: ['-'] }
];

const AUDIT_LOGS = [
  { id: 1, user: 'Admin User (admin@vcas.edu)', action: 'Modified Role Permissions Matrix', ip: '192.168.1.45', time: '10 mins ago', status: 'Success' },
  { id: 2, user: 'Dr. Sunita Rao (sunita.rao@vcas.edu)', action: 'Published Circular CIR/2025/ACAD-114', ip: '192.168.1.88', time: '45 mins ago', status: 'Success' },
  { id: 3, user: 'Mr. K. Narayanan (accounts@vcas.edu)', action: 'Recorded Bulk Fee Receipts (₹45,000)', ip: '192.168.1.102', time: '2 hours ago', status: 'Success' },
  { id: 4, user: 'Unknown IP (103.24.55.19)', action: 'Failed Password Attempt (5 tries - Blocked)', ip: '103.24.55.19', time: '3 hours ago', status: 'Blocked / Warning' },
  { id: 5, user: 'Aditya Kapoor (aditya.k@student.vcas.edu)', action: 'Submitted Assignment #4 CS301', ip: '172.16.4.12', time: '5 hours ago', status: 'Success' }
];

export default function UsersRolesManagement() {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'roles', 'audit'
  const [users, setUsers] = useState(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Lock background scroll when any modal is open
  React.useEffect(() => {
    const isAnyModalOpen = Boolean(showAddModal || showEditModal || showPasswordModal || showDeleteModal);
    const scrollContainer = document.getElementById('main-content-scroll-container');
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      if (scrollContainer) scrollContainer.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      if (scrollContainer) scrollContainer.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'unset';
      if (scrollContainer) scrollContainer.style.overflow = 'auto';
    };
  }, [showAddModal, showEditModal, showPasswordModal, showDeleteModal]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    empId: '',
    phone: '',
    role: 'Faculty',
    department: 'Computer Science',
    status: 'Active',
    twoFactorEnabled: true
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRole = selectedRole === 'All' || u.role === selectedRole;
      const matchStatus = selectedStatus === 'All' || u.status === selectedStatus;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchTerm, selectedRole, selectedStatus]);

  // Handlers
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      empId: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      phone: '+91 ',
      role: 'Faculty',
      department: 'Computer Science',
      status: 'Active',
      twoFactorEnabled: true
    });
    setShowAddModal(true);
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please fill out the name and official email address.');
      return;
    }

    const newUser = {
      ...formData,
      id: Date.now(),
      lastLogin: 'Never',
      createdDate: new Date().toISOString().split('T')[0]
    };

    setUsers([newUser, ...users]);
    setShowAddModal(false);
    showToast(`User account created for ${formData.name}! Activation email sent.`);
  };

  const handleOpenEdit = (user) => {
    setShowEditModal(user);
    setFormData({ ...user });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setUsers(prev => prev.map(u => u.id === showEditModal.id ? { ...formData, id: showEditModal.id } : u));
    setShowEditModal(null);
    showToast('User account updated successfully!');
  };

  const handleToggleStatus = (user) => {
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
    showToast(`Status updated: ${user.name} is now ${nextStatus}`);
  };

  const handleDeleteUser = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setShowDeleteModal(null);
    showToast('User account removed permanently.');
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setShowPasswordModal(null);
    showToast(`Password reset link & temporary OTP dispatched to ${showPasswordModal.email}!`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      
      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Users & Roles Management (RBAC)</h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage system user credentials, configure granular module permissions, and audit security access
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* TOP METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Accounts</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{users.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Users</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {users.filter(u => u.status === 'Active').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">2FA Protected</p>
            <p className="text-2xl font-black text-blue-600 mt-1">
              {Math.round((users.filter(u => u.twoFactorEnabled).length / users.length) * 100)}%
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">System Roles</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{ROLES_LIST.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'roles' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Roles & Permissions Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Security Audit Logs</span>
        </button>
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Role Filter */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user by name, email, employee ID..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Roles</option>
                {ROLES_LIST.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Role Badge</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">2FA Security</th>
                    <th className="py-3.5 px-4">Last Login</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs">{u.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{u.email} • {u.empId}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          u.role === 'Super Admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                          u.role === 'HOD' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                          u.role === 'Faculty' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                          u.role === 'Student' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">{u.department}</td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                          u.twoFactorEnabled ? 'text-emerald-600' : 'text-slate-400'
                        }`}>
                          <Shield className="w-3.5 h-3.5" />
                          <span>{u.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-medium text-[11px]">{u.lastLogin}</td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-all ${
                            u.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-800'
                              : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-800'
                          }`}
                          title="Click to toggle status"
                        >
                          {u.status}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setShowPasswordModal(u)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Reset password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit user"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & PERMISSIONS MATRIX */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Module Privilege Authorization Matrix</h3>
              <p className="text-xs text-slate-400">
                Grant or revoke Read (R), Write/Create (W), Edit (E), Delete (D), and Admin (A) privileges per user role
              </p>
            </div>
            <button
              onClick={() => showToast('Role privileges matrix saved across all active sessions!')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Save Matrix Changes
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">System Module</th>
                  <th className="py-3 px-4">Super Admin</th>
                  <th className="py-3 px-4">HOD</th>
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Accountant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {MODULE_PERMISSIONS_MATRIX.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{row.module}</td>
                    
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-mono font-bold text-[10px]">
                        Full Admin (R,W,D,A)
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-mono font-bold text-[10px]">
                        {row.HOD.join(', ')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-mono font-bold text-[10px]">
                        {row.Faculty.join(', ')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono font-bold text-[10px]">
                        {row.Student.join(', ')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-mono font-bold text-[10px]">
                        {row.Accountant.join(', ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">Security & Authentication Access Trail</h3>
            <button 
              onClick={() => showToast('Audit logs refreshed')}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Log
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {AUDIT_LOGS.map(log => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-xs">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    log.status.includes('Warning') ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {log.status.includes('Warning') ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900">{log.action}</p>
                    <p className="text-[11px] text-slate-500">{log.user} • IP: <span className="font-mono text-slate-700">{log.ip}</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    log.status.includes('Warning') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {log.status}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT USER */}
      {(showAddModal || showEditModal) && (
        <ModalPortal isOpen={Boolean(showAddModal || showEditModal)} onClose={() => { setShowAddModal(false); setShowEditModal(null); }}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  {showAddModal ? <Plus className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {showAddModal ? 'Create New User Account' : 'Edit User Profile'}
                  </h2>
                  <p className="text-[11px] text-slate-500">Configure credentials, role privileges and contact details</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleSaveAdd : handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Sunita Rao"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@vcas.edu"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee / Roll ID</label>
                  <input
                    type="text"
                    value={formData.empId}
                    onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assign Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    {ROLES_LIST.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics & Comm">Electronics & Comm</option>
                    <option value="Mechanical Engg">Mechanical Engg</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Business Admin">Business Admin (MBA)</option>
                    <option value="Administration">Administration</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98401 23456"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.twoFactorEnabled}
                    onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Enforce Two-Factor Authentication (2FA)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(null);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20"
                >
                  {showAddModal ? 'Create Account' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: RESET PASSWORD */}
      {showPasswordModal && (
        <ModalPortal isOpen={Boolean(showPasswordModal)} onClose={() => setShowPasswordModal(null)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-4 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Credentials</h3>
                <p className="text-xs text-slate-500 mt-0.5">Send password reset token to user</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <p className="font-bold text-slate-900">{showPasswordModal.name}</p>
              <p className="text-slate-500 font-mono">{showPasswordModal.email}</p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              A temporary cryptographically secure one-time password (OTP) and login instructions will be dispatched to their official email.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPasswordModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20"
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: DELETE USER */}
      {showDeleteModal && (
        <ModalPortal isOpen={Boolean(showDeleteModal)} onClose={() => setShowDeleteModal(null)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete User Account</h3>
                <p className="text-xs text-slate-500 mt-0.5">Are you sure you want to permanently revoke access?</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-slate-800">
              "{showDeleteModal.name}" ({showDeleteModal.email})
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteModal.id)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20"
              >
                Yes, Revoke & Delete
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
