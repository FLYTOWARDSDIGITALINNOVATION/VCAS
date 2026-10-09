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
  ChevronDown,
  Save,
  UserPlus,
  CheckCircle2,
  GraduationCap,
  Heart,
  MapPin,
  ShieldCheck,
  Award,
  Download,
  Key,
  Copy,
  Lock,
  FileText,
  Printer,
  Upload,
  FileCheck,
  ExternalLink
} from 'lucide-react';
import StaffDetailView from './StaffDetailView';
import ModalPortal from './ModalPortal';

const API_BASE = 'http://localhost:5000';

const NET_SET_STATUS_OPTIONS = [
  'Qualified UGC-NET',
  'Qualified CSIR-NET',
  'Qualified SET / SLET',
  'Qualified NET & SET',
  'Qualified NET with JRF',
  'Appeared / Awaiting Results',
  'Not Applicable'
];

function normalizeStaff(s) {
  if (!s) return null;
  return {
    ...s,
    id: s._id || s.staffId || s.id,
    empId: s.staffId || s.empId || '',
    avatarBg: s.avatarBg || 'bg-purple-600',
    avatarText: s.avatarText || getInitials(s.name),
    profileImage: s.profileImage || '',
    netSetExamStatus: s.netSetExamStatus || 'Not Applicable',
    netSetExamCertificate: s.netSetExamCertificate || '',
    netSetCertificateName: s.netSetCertificateName || '',
    aadhaar: s.aadhaar || '',
    pan: s.pan || '',
    bankAccountNo: s.bankAccountNo || '',
    bankName: s.bankName || '',
    ifscCode: s.ifscCode || '',
    bankBranch: s.bankBranch || ''
  };
}

const INITIAL_STAFF = [];

const DEPARTMENTS = [
  'All Departments',
  'Commerce',
  'Computer Science',
  'English Literature',
  'Business Administration (BBA)',
  'Computer Applications (BCA)',
  'Mathematics'
];

const DESIGNATIONS = [
  'All Designations',
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'HOD',
  'Lecturer',
  'Lab Assistant',
  'Visiting Professor'
];

const EMPLOYMENT_TYPES = [
  'Permanent / Full-Time',
  'Contract / Full-Time',
  'Part-Time',
  'Visiting Faculty',
  'Adjunct Professor'
];

const STATUSES = [
  'All Status',
  'Active',
  'On Leave',
  'Inactive'
];

const BLOOD_GROUPS = [
  'O+',
  'A+',
  'B+',
  'AB+',
  'O-',
  'A-',
  'B-',
  'AB-'
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

export default function StaffManagement({ user }) {
  const isSuperAdmin = user?.role === 'Super Admin' || user?.isSuperAdmin;
  const [credentialModalStaff, setCredentialModalStaff] = useState(null);
  const [copiedCredential, setCopiedCredential] = useState(false);

  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedDesignation, setSelectedDesignation] = useState('All Designations');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedNetSetFilter, setSelectedNetSetFilter] = useState('All');

  // Selected staff for full detailed view
  const [selectedStaffForDetails, setSelectedStaffForDetails] = useState(null);

  // Selected staff for direct NET/SET Certificate view modal
  const [selectedStaffForCertModal, setSelectedStaffForCertModal] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [modalError, setModalError] = useState('');

  // Super Admin Exclusive: Download Staff Credentials
  const handleDownloadStaffCredentials = (staff) => {
    const slipText = `
================================================================================
          VIVEKANANDA COLLEGE OF ARTS AND SCIENCE (AUTONOMOUS)
                      VELLALANKULAM, TAMIL NADU
                 CONFIDENTIAL STAFF CREDENTIAL SLIP
================================================================================
Generated On        : ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Issued By           : Super Administrator (VCAS Master Auth Controller)
Security Level      : RESTRICTED / LEVEL-1 ACCESS
--------------------------------------------------------------------------------
STAFF DETAILS:
  Full Name         : ${staff.name}
  Employee ID       : ${staff.empId || staff.staffId}
  Department        : ${staff.department}
  Designation       : ${staff.designation || 'Faculty Member'}
  Official Email    : ${staff.email}
  Contact Phone     : ${staff.phone || 'Pending setup'}
  Employment Type   : ${staff.employmentType || 'Permanent / Full-Time'}
  Status            : ${staff.status || 'Active'}
  Joining Date      : ${staff.joiningDate || 'N/A'}

PORTAL ACCESS CREDENTIALS:
  Portal Login URL  : http://localhost:5173/login
  Role              : Staff
  Login Username    : ${staff.email}
  Initial Password  : vcas@2026
  Account Security  : ${staff.isProfileCompleted ? 'Completed by Staff' : 'Pending First Sign-in (Default Password Active)'}

INSTRUCTIONS FOR STAFF:
  1. Navigate to the VCAS Portal Login URL.
  2. Select 'Staff' role and input the above email and default password.
  3. You will be prompted to complete first-time profile configuration.
  4. For any credential issues, contact the Super Administration Desk.
--------------------------------------------------------------------------------
CONFIDENTIALITY NOTICE:
This document contains sensitive authentication details. Only the Super Administrator
is authorized to export or issue this credential sheet.
================================================================================
`.trim();

    const blob = new Blob([slipText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(staff.empId || staff.staffId || 'STAFF')}_${staff.name.replace(/[^a-zA-Z0-9]/g, '_')}_Credentials.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastMessage(`Credentials downloaded for ${staff.name}`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Super Admin Exclusive: Print Staff Credentials Slip
  const handlePrintStaffCredentials = (staff) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Please allow popups to print credential slips.');
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Staff Credential Slip - ${staff.name} (${staff.empId || staff.staffId})</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #7c3aed; padding-bottom: 20px; margin-bottom: 25px; }
          .title { font-size: 20px; font-weight: bold; color: #5b21b6; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 14px; color: #475569; margin: 5px 0 0 0; }
          .badge { display: inline-block; background: #faf5ff; color: #6b21a8; font-size: 11px; padding: 4px 10px; border-radius: 9999px; font-weight: 600; margin-top: 10px; border: 1px solid #e9d5ff; }
          .meta-bar { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 16px; font-size: 12px; margin-bottom: 25px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #7c3aed; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          td { padding: 8px 12px; vertical-align: top; }
          td.label { width: 35%; font-weight: 600; color: #64748b; }
          td.value { width: 65%; color: #0f172a; font-weight: 500; }
          .cred-box { background: #faf5ff; border: 1px solid #d8b4fe; border-radius: 8px; padding: 14px 18px; margin-top: 10px; }
          .cred-title { font-size: 13px; font-weight: bold; color: #6b21a8; margin-bottom: 10px; }
          .cred-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .cred-item { font-size: 13px; }
          .cred-item span { color: #64748b; font-size: 11px; display: block; font-weight: 600; }
          .cred-item strong { color: #0f172a; font-family: monospace; font-size: 14px; }
          .footer { margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 20px; font-size: 11px; color: #64748b; text-align: center; }
          .stamp-row { display: flex; justify-content: space-between; margin-top: 50px; padding: 0 30px; font-size: 12px; font-weight: 600; }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Vivekananda College of Arts and Science</div>
          <div class="subtitle">Autonomous Institution • Affiliated with MS University • Vellalankulam</div>
          <div class="badge">Official Staff Access Pass & Security Credentials</div>
        </div>
        <div class="meta-bar">
          <div><strong>Generated On:</strong> ${new Date().toLocaleString('en-IN')}</div>
          <div><strong>Authorized By:</strong> Super Administrator</div>
          <div><strong>Ref:</strong> VCAS-STAFF-${staff.empId || staff.staffId}</div>
        </div>
        <div class="section">
          <div class="section-title">Staff Details</div>
          <table>
            <tr><td class="label">Full Name</td><td class="value"><strong>${staff.name}</strong></td></tr>
            <tr><td class="label">Employee ID</td><td class="value">${staff.empId || staff.staffId}</td></tr>
            <tr><td class="label">Department</td><td class="value">${staff.department}</td></tr>
            <tr><td class="label">Designation</td><td class="value">${staff.designation || 'Faculty Member'}</td></tr>
            <tr><td class="label">Official Email</td><td class="value">${staff.email}</td></tr>
            <tr><td class="label">Phone</td><td class="value">${staff.phone || 'Pending setup'}</td></tr>
            <tr><td class="label">Joining Date</td><td class="value">${staff.joiningDate || 'N/A'}</td></tr>
          </table>
        </div>
        <div class="section">
          <div class="section-title">Portal Access Credentials</div>
          <div class="cred-box">
            <div class="cred-title">Digital Portal Authentication Details</div>
            <div class="cred-grid">
              <div class="cred-item">
                <span>LOGIN USERNAME / EMAIL</span>
                <strong>${staff.email}</strong>
              </div>
              <div class="cred-item">
                <span>INITIAL PASSWORD</span>
                <strong>vcas@2026</strong>
              </div>
              <div class="cred-item">
                <span>SECURITY STATUS</span>
                <strong>${staff.isProfileCompleted ? 'Configured by Staff' : 'Default Password Active'}</strong>
              </div>
              <div class="cred-item">
                <span>PORTAL ADDRESS</span>
                <strong>vcas.edu/login</strong>
              </div>
            </div>
          </div>
        </div>
        <div class="stamp-row">
          <div>Verified by HR & Admin</div>
          <div>Authorized Signatory (Super Admin)</div>
        </div>
        <div class="footer">
          Notice: This document contains confidential system credentials. Issued under authorization of Super Admin.
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Super Admin Exclusive: Bulk export CSV
  const handleDownloadAllStaffSummary = () => {
    const headers = ['Employee ID', 'Name', 'Email', 'Department', 'Designation', 'Phone', 'Status', 'Default Password', 'Profile Setup'];
    const rows = staffList.map(s => [
      `"${s.empId || s.staffId}"`,
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.department}"`,
      `"${s.designation || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.status || 'Active'}"`,
      `"vcas@2026"`,
      `"${s.isProfileCompleted ? 'Completed' : 'Pending'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VCAS_Staff_Credentials_Master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage('Exported master staff credentials CSV');
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Fetch staff list from MongoDB on mount
  const fetchStaffList = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/staff`);
      const result = await res.json();
      if (res.ok && result.success) {
        const normalized = (result.data || []).map(normalizeStaff);
        setStaffList(normalized);
      } else {
        console.error('Failed to fetch staff:', result.message);
      }
    } catch (err) {
      console.error('Error connecting to backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStaffList();
  }, []);

  // Lock background scroll when any modal is open
  React.useEffect(() => {
    const isAnyModalOpen = Boolean(isAddModalOpen || editingStaff || deletingStaff);
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
  }, [isAddModalOpen, editingStaff, deletingStaff]);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    empId: '',
    department: 'Computer Science',
    designation: 'Professor',
    employmentType: 'Permanent / Full-Time',
    email: '',
    password: 'vcas@2026',
    phone: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    qualification: '',
    experience: '',
    bloodGroup: 'O+',
    dob: '1985-05-15',
    address: '',
    emergencyContact: '',
    netSetExamStatus: 'Not Applicable',
    netSetExamCertificate: '',
    netSetCertificateName: ''
  });

  const [formErrors, setFormErrors] = useState({});

  const handleModalCertificateUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png|webp)$/i)) {
      alert('Please upload a valid document or image (PDF, PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }
    const fileName = file.name;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (base64) {
        setFormData(prev => ({
          ...prev,
          netSetExamCertificate: base64,
          netSetCertificateName: fileName,
          netSetExamStatus: prev.netSetExamStatus === 'Not Applicable' ? 'Qualified UGC-NET' : prev.netSetExamStatus
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleModalRemoveCertificate = () => {
    setFormData(prev => ({
      ...prev,
      netSetExamCertificate: '',
      netSetCertificateName: ''
    }));
  };

  // Reset form
  const resetForm = () => {
    const nextIdNumber = staffList.length + 1;
    const nextEmpId = `EMP${String(nextIdNumber).padStart(3, '0')}`;
    setFormData({
      name: '',
      empId: nextEmpId,
      department: 'Computer Science',
      designation: 'Assistant Professor',
      employmentType: 'Permanent / Full-Time',
      email: '',
      password: 'vcas@2026',
      phone: '',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      qualification: '',
      experience: '',
      bloodGroup: 'O+',
      dob: '1988-06-20',
      address: '',
      emergencyContact: '',
      netSetExamStatus: 'Not Applicable',
      netSetExamCertificate: '',
      netSetCertificateName: ''
    });
    setFormErrors({});
    setModalError('');
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
      name: staff.name || '',
      empId: staff.empId || staff.staffId || '',
      department: staff.department || 'Computer Science',
      designation: staff.designation || 'Professor',
      employmentType: staff.employmentType || 'Permanent / Full-Time',
      email: staff.email || '',
      password: staff.password || 'vcas@2026',
      phone: staff.phone || '',
      joiningDate: staff.joiningDate || new Date().toISOString().split('T')[0],
      status: staff.status || 'Active',
      qualification: staff.qualification || '',
      experience: staff.experience || '',
      bloodGroup: staff.bloodGroup || 'O+',
      dob: staff.dob || '1984-05-18',
      address: staff.address || '',
      emergencyContact: staff.emergencyContact || '',
      netSetExamStatus: staff.netSetExamStatus || 'Not Applicable',
      netSetExamCertificate: staff.netSetExamCertificate || '',
      netSetCertificateName: staff.netSetCertificateName || ''
    });
    setFormErrors({});
    setModalError('');
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Staff name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Show Toast helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Save new staff to MongoDB Atlas
  const handleSaveAdd = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setModalError('');

    try {
      const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      const payload = {
        ...formData,
        staffId: formData.empId.trim(),
        avatarBg: randomColor
      };

      const res = await fetch(`${API_BASE}/api/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const newStaff = normalizeStaff(result.data);
        setStaffList(prev => [newStaff, ...prev]);
        setIsAddModalOpen(false);
        showToast(`Staff member "${newStaff.name}" added successfully!`);
      } else {
        setModalError(result.message || 'Failed to save staff member.');
      }
    } catch (err) {
      setModalError('Unable to connect to server. Please ensure backend is running.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save edited staff
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setModalError('');

    try {
      const targetId = editingStaff._id || editingStaff.staffId || editingStaff.id;
      const payload = {
        ...formData,
        staffId: formData.empId.trim()
      };

      const res = await fetch(`${API_BASE}/api/staff/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const updatedItem = normalizeStaff(result.data);

        setStaffList(prev => prev.map(item => {
          if (item.id === editingStaff.id || item._id === editingStaff._id) {
            return updatedItem;
          }
          return item;
        }));

        if (selectedStaffForDetails && (selectedStaffForDetails.id === editingStaff.id || selectedStaffForDetails._id === editingStaff._id)) {
          setSelectedStaffForDetails(updatedItem);
        }

        setEditingStaff(null);
        showToast(`Staff profile for "${updatedItem.name}" updated successfully!`);
      } else {
        setModalError(result.message || 'Failed to update staff member.');
      }
    } catch (err) {
      setModalError('Unable to connect to server.');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm delete staff
  const handleConfirmDelete = async () => {
    if (!deletingStaff) return;
    setIsSaving(true);

    try {
      const targetId = deletingStaff._id || deletingStaff.staffId || deletingStaff.id;
      const res = await fetch(`${API_BASE}/api/staff/${targetId}`, {
        method: 'DELETE'
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setStaffList(prev => prev.filter(item => item.id !== deletingStaff.id && item._id !== deletingStaff._id));
        if (selectedStaffForDetails && (selectedStaffForDetails.id === deletingStaff.id || selectedStaffForDetails._id === deletingStaff._id)) {
          setSelectedStaffForDetails(null);
        }
        showToast(`Staff member "${deletingStaff.name}" deleted successfully.`);
        setDeletingStaff(null);
      } else {
        alert(result.message || 'Failed to delete staff member.');
      }
    } catch (err) {
      alert('Unable to connect to server.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter(item => {
      const q = (searchQuery || '').toLowerCase().trim();
      const matchesSearch = !q || (
        String(item.name || '').toLowerCase().includes(q) ||
        String(item.empId || item.staffId || '').toLowerCase().includes(q) ||
        String(item.email || '').toLowerCase().includes(q) ||
        String(item.phone || '').includes(q) ||
        String(item.department || '').toLowerCase().includes(q) ||
        String(item.designation || '').toLowerCase().includes(q)
      );

      const matchesDept = selectedDept === 'All Departments' || item.department === selectedDept;
      const matchesDesignation = selectedDesignation === 'All Designations' || item.designation === selectedDesignation;
      const matchesStatus = selectedStatus === 'All Status' || item.status === selectedStatus;
      const matchesNetSet = selectedNetSetFilter === 'All'
        || (selectedNetSetFilter === 'Uploaded' && Boolean(item.netSetExamCertificate))
        || (selectedNetSetFilter === 'Pending' && !item.netSetExamCertificate);

      return matchesSearch && matchesDept && matchesDesignation && matchesStatus && matchesNetSet;
    });
  }, [staffList, searchQuery, selectedDept, selectedDesignation, selectedStatus, selectedNetSetFilter]);

  return (
    <>
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage('')}
            className="ml-2 p-1 text-slate-400 hover:text-white rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* RENDER VIEW: EITHER FULL STAFF DETAIL VIEW OR MAIN TABLE */}
      {selectedStaffForDetails ? (
        <StaffDetailView
          staff={selectedStaffForDetails}
          onBack={() => setSelectedStaffForDetails(null)}
          onEdit={(staff) => handleOpenEditModal(staff)}
          user={user}
          onDownloadCredentials={handleDownloadStaffCredentials}
          onPrintCredentials={handlePrintStaffCredentials}
        />
      ) : (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans animate-fadeIn">

          {/* 1. TOP HEADER ROW */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Staff Management
                </h1>
                {isSuperAdmin && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 shadow-2xs">
                    <Key className="w-3.5 h-3.5" />
                    <span>Super Admin Credentials Access</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isSuperAdmin 
                  ? 'Master Directory: Manage faculty records and download individual or master login credentials.' 
                  : 'Institutional faculty records, course allocations, and profile verifications.'}
              </p>
            </div>
            
            <div className="flex items-center gap-2.5">
              {isSuperAdmin && (
                <button
                  onClick={handleDownloadAllStaffSummary}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Download className="w-4 h-4 text-purple-600" />
                  <span>Export Staff CSV</span>
                </button>
              )}
            </div>
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
                placeholder="Search by name, employee ID, email, department..."
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">

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

              {/* NET / SET Certificate Filter */}
              <div className="relative">
                <select
                  value={selectedNetSetFilter}
                  onChange={(e) => setSelectedNetSetFilter(e.target.value)}
                  className="w-full appearance-none bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-200 rounded-xl px-3.5 py-2.5 pr-8 text-xs sm:text-sm font-semibold text-indigo-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none cursor-pointer transition-all"
                >
                  <option value="All">All NET/SET Status</option>
                  <option value="Uploaded">📜 Certificate Uploaded</option>
                  <option value="Pending">⏳ Pending Certificate</option>
                </select>
                <ChevronDown className="w-4 h-4 text-indigo-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

            </div>
          </div>

          {/* 3. STAFF TABLE CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">

            {/* DESKTOP & TABLET VIEW */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">STAFF MEMBER</th>
                    <th className="py-4 px-4">EMP ID</th>
                    <th className="py-4 px-4">DEPARTMENT</th>
                    <th className="py-4 px-4">DESIGNATION</th>
                    <th className="py-4 px-4">EMAIL</th>
                    <th className="py-4 px-4">PHONE</th>
                    <th className="py-4 px-4">JOINING</th>
                    <th className="py-4 px-4">STATUS</th>
                    <th className="py-4 px-4 text-center">NET / SET CERTIFICATE</th>
                    <th className="py-4 px-4">PROFILE SETUP</th>
                    {isSuperAdmin && <th className="py-4 px-4 text-center">CREDENTIALS</th>}
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
                            <div className={`w-9 h-9 rounded-xl ${!staff.profileImage ? (staff.avatarBg || 'bg-purple-600') : 'bg-slate-100'} overflow-hidden text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                              {staff.profileImage ? (
                                <img src={staff.profileImage} alt={staff.name} className="w-full h-full object-cover" />
                              ) : (
                                staff.avatarText || getInitials(staff.name)
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                                {staff.name}
                              </p>
                              <span className="text-[10px] text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                Click to view full profile & details →
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* EMP ID */}
                        <td className="py-4 px-4 font-semibold text-slate-700 text-xs font-mono">
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
                          {staff.phone || <span className="text-slate-400 font-normal italic">Pending setup</span>}
                        </td>

                        {/* JOINING */}
                        <td className="py-4 px-4 text-slate-500 text-xs">
                          {staff.joiningDate}
                        </td>

                        {/* STATUS BADGE */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${staff.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : staff.status === 'On Leave'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                            {staff.status}
                          </span>
                        </td>

                        {/* NET / SET CERTIFICATE */}
                        <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          {staff.netSetExamCertificate ? (
                            <button
                              onClick={() => setSelectedStaffForCertModal(staff)}
                              title="Click to View & Verify NET/SET Certificate"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all shadow-2xs hover:scale-105 cursor-pointer"
                            >
                              <Award className="w-3.5 h-3.5 text-indigo-600" />
                              <span>View Certificate</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-200">
                              {staff.netSetExamStatus && staff.netSetExamStatus !== 'Not Applicable' ? staff.netSetExamStatus : 'Not Uploaded'}
                            </span>
                          )}
                        </td>

                        {/* PROFILE SETUP STATUS */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${staff.isProfileCompleted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${staff.isProfileCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                            {staff.isProfileCompleted ? 'Completed by Staff' : 'Pending First Sign-in'}
                          </span>
                        </td>

                        {/* CREDENTIALS COLUMN (Super Admin Exclusive) */}
                        {isSuperAdmin && (
                          <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setCredentialModalStaff(staff)}
                              title="Download & View Staff Credentials Slip"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all shadow-2xs"
                            >
                              <Key className="w-3.5 h-3.5 text-purple-600" />
                              <span>Download Slip</span>
                            </button>
                          </td>
                        )}

                        {/* ACTIONS */}
                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5 text-slate-400">
                            {staff.netSetExamCertificate && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStaffForCertModal(staff);
                                }}
                                title="View NET / SET Certificate"
                                className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all"
                              >
                                <Award className="w-4 h-4" />
                              </button>
                            )}
                            {isSuperAdmin && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadStaffCredentials(staff);
                                  }}
                                  title="Quick Download Credentials File"
                                  className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrintStaffCredentials(staff);
                                  }}
                                  title="Print Staff Credentials Slip"
                                  className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                              </>
                            )}
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
                              title="Edit Staff Profile"
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
                  ) : isLoading ? (
                    <tr>
                      <td colSpan={11} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                          <p className="text-xs font-semibold text-slate-600">Loading staff members...</p>
                        </div>
                      </td>
                    </tr>
                  ) : staffList.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-16 text-center text-slate-400">
                        <div className="max-w-sm mx-auto space-y-3">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                            <User className="w-6 h-6" />
                          </div>
                          <p className="text-base font-bold text-slate-800">No Staff Members Found</p>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            No staff records currently found in the system directory.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <div className="max-w-xs mx-auto space-y-2">
                          <User className="w-8 h-8 mx-auto text-slate-300" />
                          <p className="text-sm font-semibold text-slate-600">No matching staff found</p>
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
                      <div className={`w-10 h-10 rounded-xl ${!staff.profileImage ? (staff.avatarBg || 'bg-purple-600') : 'bg-slate-100'} overflow-hidden text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}>
                        {staff.profileImage ? (
                          <img src={staff.profileImage} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                          staff.avatarText || getInitials(staff.name)
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{staff.name}</h4>
                        <p className="text-xs text-slate-500 font-medium">{staff.designation} • {staff.department}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${staff.status === 'Active'
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

                  {staff.netSetExamCertificate && (
                    <div className="flex items-center justify-between p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-indigo-600" />
                        <span>NET / SET Certificate</span>
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStaffForCertModal(staff);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                      >
                        View Certificate
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[11px] font-bold text-blue-600">
                      Tap to view profile →
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isSuperAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadStaffCredentials(staff);
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg flex items-center gap-1 border border-purple-200 transition-all"
                        >
                          <Key className="w-3.5 h-3.5" /> Credentials
                        </button>
                      )}
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

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: ADD NEW STAFF */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <ModalPortal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">Add New Staff Member</h3>
                  <p className="text-xs text-slate-500">Fill in faculty credentials, academic qualification, and personal details</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-6">

              {modalError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
                  {modalError}
                </div>
              )}

              {/* SECTION 1: BASIC & EMPLOYMENT INFO */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-500" /> Basic & Employment Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Prof. Faculty Name"
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none transition-all ${formErrors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                        }`}
                    />
                    {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Employee ID <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.empId}
                      onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
                      placeholder="e.g. EMP001 (auto-generated if empty)"
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold font-mono text-slate-800 focus:bg-white focus:outline-none transition-all ${formErrors.empId ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                        }`}
                    />
                    {formErrors.empId && <p className="text-[11px] text-rose-500 mt-1">{formErrors.empId}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      {DEPARTMENTS.filter(d => d !== 'All Departments').map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Designation *</label>
                    <select
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      {DESIGNATIONS.filter(des => des !== 'All Designations').map(des => (
                        <option key={des} value={des}>{des}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Employment Type</label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      {EMPLOYMENT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      {BLOOD_GROUPS.map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: ACADEMIC & QUALIFICATIONS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-500" /> Academic & Qualifications
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Qualification</label>
                    <input
                      type="text"
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      placeholder="e.g. Ph.D. in Commerce, M.Phil, NET/SET"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Experience</label>
                    <input
                      type="text"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      placeholder="e.g. 5+ Years Teaching Experience"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NET / SET Exam Qualification
                    </label>
                    <select
                      value={formData.netSetExamStatus}
                      onChange={(e) => setFormData({ ...formData, netSetExamStatus: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      {NET_SET_STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NET / SET Exam Certificate Upload
                    </label>
                    {formData.netSetExamCertificate ? (
                      <div className="flex items-center justify-between p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="text-xs font-bold text-indigo-900 truncate">
                            {formData.netSetCertificateName || 'Certificate Attached'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleModalRemoveCertificate}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 transition-all cursor-pointer">
                        <Upload className="w-4 h-4 text-slate-400" />
                        <span>Upload Certificate (PDF / Image up to 10MB)</span>
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/webp"
                          onChange={handleModalCertificateUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: CONTACT & LOGIN DETAILS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-500" /> Contact & Login Credentials
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Official Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@college.edu"
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none transition-all ${formErrors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                        }`}
                    />
                    {formErrors.email && <p className="text-[11px] text-rose-500 mt-1">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="9811223344"
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none transition-all ${formErrors.phone ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                        }`}
                    />
                    {formErrors.phone && <p className="text-[11px] text-rose-500 mt-1">{formErrors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Staff Portal Password
                    </label>
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="vcas@2026"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Default is vcas@2026</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder="e.g. Spouse / Parent - 9840123456"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. 42, Faculty Quarters, Vidyapeeth Campus, Chennai"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSaving ? 'Saving...' : 'Save Staff Member'}</span>
                </button>
              </div>

            </form>

          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: EDIT STAFF PROFILE (Triggered by Edit Profile button or Table) */}
      {/* ========================================================================= */}
      {editingStaff && (
        <ModalPortal isOpen={Boolean(editingStaff)} onClose={() => setEditingStaff(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900 leading-tight">Edit Staff Profile</h3>
                    <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      {String(editingStaff.empId || editingStaff.staffId || '')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Updating details for <strong className="text-slate-800">{String(editingStaff.name || '')}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6">

              {modalError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
                  {modalError}
                </div>
              )}

              {/* SECTION 1: BASIC & EMPLOYMENT INFO */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-500" /> Basic & Employment Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none transition-all ${formErrors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                        }`}
                    />
                    {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Employee ID <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.empId}
                      onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
                      placeholder="e.g. EMP001"
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold font-mono text-slate-800 focus:bg-white focus:outline-none transition-all ${formErrors.empId ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                        }`}
                    />
                    {formErrors.empId && <p className="text-[11px] text-rose-500 mt-1">{formErrors.empId}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      {DEPARTMENTS.filter(d => d !== 'All Departments').map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Designation *</label>
                    <select
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      {DESIGNATIONS.filter(des => des !== 'All Designations').map(des => (
                        <option key={des} value={des}>{des}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Employment Type</label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      {EMPLOYMENT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      {BLOOD_GROUPS.map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: ACADEMIC & QUALIFICATIONS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-500" /> Academic & Qualifications
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Qualification</label>
                    <input
                      type="text"
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      placeholder="e.g. Ph.D. in English Literature (Madras University), M.Phil"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Experience</label>
                    <input
                      type="text"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      placeholder="e.g. 10 Years Teaching Experience"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NET / SET Exam Qualification
                    </label>
                    <select
                      value={formData.netSetExamStatus}
                      onChange={(e) => setFormData({ ...formData, netSetExamStatus: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      {NET_SET_STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NET / SET Exam Certificate Upload
                    </label>
                    {formData.netSetExamCertificate ? (
                      <div className="flex items-center justify-between p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="text-xs font-bold text-indigo-900 truncate">
                            {formData.netSetCertificateName || 'Certificate Attached'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleModalRemoveCertificate}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 transition-all cursor-pointer">
                        <Upload className="w-4 h-4 text-slate-400" />
                        <span>Upload Certificate (PDF / Image up to 10MB)</span>
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/webp"
                          onChange={handleModalCertificateUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: CONTACT & EMERGENCY */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-500" /> Contact & Emergency Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Official Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none transition-all ${formErrors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                        }`}
                    />
                    {formErrors.email && <p className="text-[11px] text-rose-500 mt-1">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none transition-all ${formErrors.phone ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                        }`}
                    />
                    {formErrors.phone && <p className="text-[11px] text-rose-500 mt-1">{formErrors.phone}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setEditingStaff(null)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSaving ? 'Updating...' : 'Update Staff Profile'}</span>
                </button>
              </div>

            </form>

          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      {deletingStaff && (
        <ModalPortal isOpen={Boolean(deletingStaff)} onClose={() => setDeletingStaff(null)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
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
        </ModalPortal>
      )}

      {/* SUPER ADMIN CREDENTIAL PREVIEW & DOWNLOAD MODAL */}
      {credentialModalStaff && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn" onClick={() => setCredentialModalStaff(null)}>
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-scaleUp" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold">Confidential Staff Credentials</h3>
                      <p className="text-xs text-purple-200">Super Administrator Authorization</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCredentialModalStaff(null)}
                    className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Credential Card */}
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">Staff Member:</span>
                    <span className="font-bold text-slate-800 font-sans">{credentialModalStaff.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">Employee ID:</span>
                    <span className="font-bold text-purple-700">{credentialModalStaff.empId || credentialModalStaff.staffId}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">Department:</span>
                    <span className="font-semibold text-slate-700 font-sans">{credentialModalStaff.department}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">Login Username:</span>
                    <span className="font-bold text-slate-900">{credentialModalStaff.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-sans">Default Password:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">vcas@2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Portal URL:</span>
                    <span className="text-blue-600 font-sans text-[11px]">http://localhost:5173/login</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  🛡️ <strong>Master Authorization:</strong> As Super Administrator, you are exclusively authorized to download or issue this security pass.
                </p>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`VCAS Staff Credentials\nName: ${credentialModalStaff.name}\nEmp ID: ${credentialModalStaff.empId || credentialModalStaff.staffId}\nEmail: ${credentialModalStaff.email}\nPassword: vcas@2026\nPortal: http://localhost:5173/login`);
                      setCopiedCredential(true);
                      setTimeout(() => setCopiedCredential(false), 2000);
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Check className={`w-3.5 h-3.5 ${copiedCredential ? 'text-emerald-600' : 'hidden'}`} />
                    <span>{copiedCredential ? 'Copied!' : 'Copy Info'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handlePrintStaffCredentials(credentialModalStaff);
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4 text-purple-600" />
                    <span>Print Slip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadStaffCredentials(credentialModalStaff);
                      setCredentialModalStaff(null);
                    }}
                    className="px-5 py-2.5 text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Credential Slip</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 8. NET / SET CERTIFICATE VERIFICATION MODAL FOR ADMIN */}
      {selectedStaffForCertModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base leading-tight truncate">
                        {selectedStaffForCertModal.name}
                      </h3>
                      <span className="text-xs font-mono font-bold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md shrink-0">
                        {selectedStaffForCertModal.empId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {selectedStaffForCertModal.department} • {selectedStaffForCertModal.designation} • <span className="font-semibold text-indigo-600">{selectedStaffForCertModal.netSetExamStatus}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedStaffForCertModal.netSetExamCertificate && (
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = selectedStaffForCertModal.netSetExamCertificate;
                        link.download = selectedStaffForCertModal.netSetCertificateName || `${selectedStaffForCertModal.empId}_NET_SET_Certificate`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      title="Download Certificate File"
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedStaffForCertModal(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body / Certificate Preview */}
              <div className="p-4 sm:p-6 bg-slate-100 flex-1 overflow-auto flex items-center justify-center min-h-[420px]">
                {selectedStaffForCertModal.netSetExamCertificate ? (
                  selectedStaffForCertModal.netSetExamCertificate.startsWith('data:application/pdf') || selectedStaffForCertModal.netSetCertificateName?.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={selectedStaffForCertModal.netSetExamCertificate}
                      title="NET/SET Certificate"
                      className="w-full h-[65vh] rounded-2xl border border-slate-300 bg-white shadow-inner"
                    />
                  ) : (
                    <div className="max-w-full max-h-[65vh] flex items-center justify-center p-2 bg-slate-900 rounded-2xl overflow-hidden shadow-lg">
                      <img
                        src={selectedStaffForCertModal.netSetExamCertificate}
                        alt="NET/SET Certificate"
                        className="max-w-full max-h-[60vh] object-contain rounded-lg"
                      />
                    </div>
                  )
                ) : (
                  <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 text-slate-500">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="font-bold text-sm">No Certificate Document Found</p>
                    <p className="text-xs text-slate-400 mt-1">This faculty member has not uploaded their certificate file.</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
                  <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-700 truncate">
                    {selectedStaffForCertModal.netSetCertificateName || 'NET / SET Exam Certificate'}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  {selectedStaffForCertModal.netSetExamCertificate && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const w = window.open();
                          if (w) {
                            if (selectedStaffForCertModal.netSetExamCertificate.startsWith('data:application/pdf')) {
                              w.document.write(`<html><head><title>${selectedStaffForCertModal.netSetCertificateName || 'NET/SET Certificate'}</title><style>html,body{margin:0;padding:0;height:100%;overflow:hidden;background:#1e293b;}</style></head><body><iframe src="${selectedStaffForCertModal.netSetExamCertificate}" frameborder="0" style="width:100%;height:100%;border:none;" allowfullscreen></iframe></body></html>`);
                            } else {
                              w.document.write(`<html><head><title>${selectedStaffForCertModal.netSetCertificateName || 'NET/SET Certificate'}</title><style>html,body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#0f172a;}</style></head><body><img src="${selectedStaffForCertModal.netSetExamCertificate}" style="max-width:92%;max-height:92vh;border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,0.6);" /></body></html>`);
                            }
                          }
                        }}
                        className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in New Tab</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedStaffForCertModal.netSetExamCertificate;
                          link.download = selectedStaffForCertModal.netSetCertificateName || `${selectedStaffForCertModal.empId}_NET_SET_Certificate`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedStaffForCertModal(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

    </>
  );
}
