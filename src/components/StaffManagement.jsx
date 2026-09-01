import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Eye, 
  Pencil, 
  Trash2, 
  Filter, 
  X, 
  Check, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  Calendar, 
  User, 
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import StaffDetailView from './StaffDetailView';

const INITIAL_STAFF = [
  {
    id: 1,
    name: 'Dr. Sunita Rao',
    empId: 'EMP001',
    department: 'Computer Science',
    designation: 'Professor',
    email: 'sunita.rao@college.edu',
    phone: '9811223344',
    joiningDate: '2018-06-01',
    status: 'Active',
    avatarBg: 'bg-purple-600',
    avatarText: 'DS',
    qualification: 'Ph.D. in Computer Science (IIT Madras)',
    experience: '12 Years (6 Years at Vidyapeeth)'
  },
  {
    id: 2,
    name: 'Prof. Ramesh Kumar',
    empId: 'EMP002',
    department: 'Electronics',
    designation: 'Associate Professor',
    email: 'ramesh.k@college.edu',
    phone: '9811223345',
    joiningDate: '2020-07-15',
    status: 'Active',
    avatarBg: 'bg-purple-600',
    avatarText: 'PR',
    qualification: 'Ph.D. in VLSI Systems, M.E.',
    experience: '9 Years (4 Years at Vidyapeeth)'
  },
  {
    id: 3,
    name: 'Dr. Anita Desai',
    empId: 'EMP003',
    department: 'MBA',
    designation: 'HOD',
    email: 'anita.d@college.edu',
    phone: '9811223346',
    joiningDate: '2015-01-10',
    status: 'Active',
    avatarBg: 'bg-purple-600',
    avatarText: 'DA',
    qualification: 'Ph.D. in Business Management, MBA (IIM)',
    experience: '15 Years (9 Years at Vidyapeeth)'
  },
  {
    id: 4,
    name: 'Mr. Vijay Nair',
    empId: 'EMP004',
    department: 'Mechanical',
    designation: 'Lecturer',
    email: 'vijay.n@college.edu',
    phone: '9811223347',
    joiningDate: '2022-08-01',
    status: 'Active',
    avatarBg: 'bg-purple-600',
    avatarText: 'MV',
    qualification: 'M.Tech in Thermal Engineering, B.Tech',
    experience: '4 Years (2 Years at Vidyapeeth)'
  },
  {
    id: 5,
    name: 'Dr. Priya Sharma',
    empId: 'EMP005',
    department: 'Civil',
    designation: 'Assistant Professor',
    email: 'priya.s@college.edu',
    phone: '9811223348',
    joiningDate: '2023-01-15',
    status: 'Active',
    avatarBg: 'bg-indigo-600',
    avatarText: 'PS',
    qualification: 'Ph.D. in Structural Engineering',
    experience: '5 Years (2 Years at Vidyapeeth)'
  }
];

const DEPARTMENTS = [
  'All Departments',
  'Computer Science',
  'Electronics',
  'MBA',
  'Mechanical',
  'Civil',
  'BCA',
  'Information Technology'
];

const DESIGNATIONS = [
  'All Designations',
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'HOD',
  'Lecturer',
  'Lab Assistant'
];

const STATUSES = [
  'All Status',
  'Active',
  'On Leave',
  'Inactive'
];

const AVATAR_COLORS = [
  'bg-purple-600',
  'bg-indigo-600',
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-teal-600'
];

function getInitials(name) {
  if (!name) return 'ST';
  const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase();
}

export default function StaffManagement() {
  const [staffList, setStaffList] = useState(INITIAL_STAFF);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedDesignation, setSelectedDesignation] = useState('All Designations');
  const [selectedStatus, setSelectedStatus] = useState('All Status');

  // Selected staff for full detailed view
  const [selectedStaffForDetails, setSelectedStaffForDetails] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    empId: '',
    department: 'Computer Science',
    designation: 'Professor',
    email: '',
    phone: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  const [formErrors, setFormErrors] = useState({});

  // Reset form
  const resetForm = () => {
    const nextIdNumber = staffList.length + 1;
    const nextEmpId = `EMP${String(nextIdNumber).padStart(3, '0')}`;
    setFormData({
      name: '',
      empId: nextEmpId,
      department: 'Computer Science',
      designation: 'Professor',
      email: '',
      phone: '',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
    setFormErrors({});
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      empId: staff.empId,
      department: staff.department,
      designation: staff.designation,
      email: staff.email,
      phone: staff.phone,
      joiningDate: staff.joiningDate,
      status: staff.status
    });
    setFormErrors({});
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Staff name is required';
    if (!formData.empId.trim()) errors.empId = 'Employee ID is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/[- ]/g, ''))) {
      errors.phone = 'Enter valid 10-digit number';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save new staff
  const handleSaveAdd = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const newStaff = {
      id: Date.now(),
      ...formData,
      avatarBg: randomColor,
      avatarText: getInitials(formData.name)
    };

    setStaffList(prev => [newStaff, ...prev]);
    setIsAddModalOpen(false);
  };

  // Save edited staff
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const updatedItem = {
      ...editingStaff,
      ...formData,
      avatarText: getInitials(formData.name)
    };

    setStaffList(prev => prev.map(item => {
      if (item.id === editingStaff.id) {
        return updatedItem;
      }
      return item;
    }));

    if (selectedStaffForDetails && selectedStaffForDetails.id === editingStaff.id) {
      setSelectedStaffForDetails(updatedItem);
    }

    setEditingStaff(null);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (deletingStaff) {
      setStaffList(prev => prev.filter(item => item.id !== deletingStaff.id));
      if (selectedStaffForDetails && selectedStaffForDetails.id === deletingStaff.id) {
        setSelectedStaffForDetails(null);
      }
      setDeletingStaff(null);
    }
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        item.name.toLowerCase().includes(q) ||
        item.empId.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.phone.includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.designation.toLowerCase().includes(q)
      );

      const matchesDept = selectedDept === 'All Departments' || item.department === selectedDept;
      const matchesDesignation = selectedDesignation === 'All Designations' || item.designation === selectedDesignation;
      const matchesStatus = selectedStatus === 'All Status' || item.status === selectedStatus;

      return matchesSearch && matchesDept && matchesDesignation && matchesStatus;
    });
  }, [staffList, searchQuery, selectedDept, selectedDesignation, selectedStatus]);

  // If a specific staff member is selected for viewing, render their full details & attendance page
  if (selectedStaffForDetails) {
    return (
      <StaffDetailView 
        staff={selectedStaffForDetails}
        onBack={() => setSelectedStaffForDetails(null)}
        onEdit={(staff) => handleOpenEditModal(staff)}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans animate-fadeIn">
      
      {/* 1. TOP HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Staff Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {filteredStaff.length} staff member{filteredStaff.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-xs sm:text-sm rounded-xl border border-blue-200 hover:border-blue-600 transition-all duration-150 shadow-xs self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Staff</span>
        </button>
      </div>

      {/* 2. SEARCH & FILTER BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs space-y-3 lg:space-y-0 lg:flex lg:items-center lg:gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
          
          {/* Department */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full appearance-none bg-slate-50/80 hover:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 pr-8 text-xs sm:text-sm font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none cursor-pointer transition-all"
            >
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Designation */}
          <div className="relative">
            <select
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              className="w-full appearance-none bg-slate-50/80 hover:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 pr-8 text-xs sm:text-sm font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none cursor-pointer transition-all"
            >
              {DESIGNATIONS.map(des => (
                <option key={des} value={des}>{des}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full appearance-none bg-slate-50/80 hover:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 pr-8 text-xs sm:text-sm font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none cursor-pointer transition-all"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

        </div>
      </div>

      {/* 3. STAFF TABLE CARD (Clickable rows with quick feedback) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* DESKTOP & TABLET VIEW (TABLE WITH HORIZONTAL SCROLL) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">STAFF</th>
                <th className="py-4 px-4">EMP ID</th>
                <th className="py-4 px-4">DEPARTMENT</th>
                <th className="py-4 px-4">DESIGNATION</th>
                <th className="py-4 px-4">EMAIL</th>
                <th className="py-4 px-4">PHONE</th>
                <th className="py-4 px-4">JOINING</th>
                <th className="py-4 px-4">STATUS</th>
                <th className="py-4 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => (
                  <tr 
                    key={staff.id} 
                    onClick={() => setSelectedStaffForDetails(staff)}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                  >
                    {/* STAFF (Avatar + Name) */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${staff.avatarBg || 'bg-purple-600'} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                          {staff.avatarText || getInitials(staff.name)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                            {staff.name}
                          </p>
                          <span className="text-[10px] text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to view full details →
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* EMP ID */}
                    <td className="py-4 px-4 font-semibold text-slate-700 text-xs">
                      {staff.empId}
                    </td>

                    {/* DEPARTMENT */}
                    <td className="py-4 px-4 font-medium text-slate-600 text-xs">
                      {staff.department}
                    </td>

                    {/* DESIGNATION */}
                    <td className="py-4 px-4 font-medium text-slate-600 text-xs">
                      {staff.designation}
                    </td>

                    {/* EMAIL */}
                    <td className="py-4 px-4 font-normal text-slate-500 text-xs">
                      <span className="truncate max-w-[180px] inline-block">{staff.email}</span>
                    </td>

                    {/* PHONE */}
                    <td className="py-4 px-4 font-semibold text-slate-700 text-xs">
                      {staff.phone}
                    </td>

                    {/* JOINING */}
                    <td className="py-4 px-4 text-slate-500 text-xs">
                      {staff.joiningDate}
                    </td>

                    {/* STATUS BADGE */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        staff.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : staff.status === 'On Leave'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {staff.status}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5 text-slate-400">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStaffForDetails(staff);
                          }}
                          title="View Details & Attendance"
                          className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(staff);
                          }}
                          title="Edit Staff"
                          className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingStaff(staff);
                          }}
                          title="Delete Staff"
                          className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <User className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">No staff members found</p>
                      <p className="text-xs text-slate-400">Try changing your search terms or filter selections</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW FOR VERY NARROW SCREENS (< 640px) */}
        <div className="block md:hidden border-t border-slate-100 divide-y divide-slate-100">
          {filteredStaff.map((staff) => (
            <div 
              key={staff.id} 
              onClick={() => setSelectedStaffForDetails(staff)}
              className="p-4 space-y-3 cursor-pointer hover:bg-blue-50/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${staff.avatarBg || 'bg-purple-600'} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}>
                    {staff.avatarText || getInitials(staff.name)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{staff.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{staff.designation} • {staff.department}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${
                  staff.status === 'Active' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : staff.status === 'On Leave'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {staff.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Emp ID</span>
                  <span className="font-semibold text-slate-800">{staff.empId}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone</span>
                  <span className="font-semibold text-slate-800">{staff.phone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Email</span>
                  <span className="font-medium text-slate-700 truncate block">{staff.email}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                <span className="text-[11px] font-bold text-blue-600">
                  Tap to view profile & attendance →
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(staff);
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingStaff(staff);
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: ADD STAFF */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">Add New Staff</h3>
                <p className="text-xs text-slate-500 mt-0.5">Enter the new faculty or staff member details</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4">
              
              {/* Full Name & Emp ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Sunita Rao"
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none transition-all ${
                      formErrors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Employee ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.empId}
                    onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
                    placeholder="e.g. EMP006"
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none transition-all ${
                      formErrors.empId ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.empId && <p className="text-[11px] text-rose-500 mt-1">{formErrors.empId}</p>}
                </div>
              </div>

              {/* Department & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    {DEPARTMENTS.filter(d => d !== 'All Departments').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Designation</label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    {DESIGNATIONS.filter(des => des !== 'All Designations').map(des => (
                      <option key={des} value={des}>{des}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@college.edu"
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none transition-all ${
                      formErrors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.email && <p className="text-[11px] text-rose-500 mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9811223344"
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none transition-all ${
                      formErrors.phone ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.phone && <p className="text-[11px] text-rose-500 mt-1">{formErrors.phone}</p>}
                </div>
              </div>

              {/* Joining Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Staff</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: EDIT STAFF */}
      {/* ========================================================================= */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">Edit Staff Member</h3>
                <p className="text-xs text-slate-500 mt-0.5">Update {editingStaff.name}'s information</p>
              </div>
              <button 
                onClick={() => setEditingStaff(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {/* Full Name & Emp ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none transition-all ${
                      formErrors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Employee ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.empId}
                    onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none transition-all ${
                      formErrors.empId ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.empId && <p className="text-[11px] text-rose-500 mt-1">{formErrors.empId}</p>}
                </div>
              </div>

              {/* Department & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    {DEPARTMENTS.filter(d => d !== 'All Departments').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Designation</label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    {DESIGNATIONS.filter(des => des !== 'All Designations').map(des => (
                      <option key={des} value={des}>{des}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none transition-all ${
                      formErrors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.email && <p className="text-[11px] text-rose-500 mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none transition-all ${
                      formErrors.phone ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.phone && <p className="text-[11px] text-rose-500 mt-1">{formErrors.phone}</p>}
                </div>
              </div>

              {/* Joining Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Update Changes</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">Delete Staff Member</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to remove <strong className="text-slate-800">{deletingStaff.name}</strong> ({deletingStaff.empId})?
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-700 font-medium">
              This will permanently delete this staff member's record from the system.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
