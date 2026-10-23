import React, { useState, useMemo, useEffect } from 'react';
import { API_BASE, BACKEND_URL, getKnownDepartments } from '../apiConfig';
import { createPortal } from 'react-dom';
import {
  FileText,
  Search,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  Send,
  X,
  Check,
  Building2,
  GraduationCap,
  BookOpen,
  Award,
  ShieldCheck,
  FileCheck,
  Upload,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Layers,
  ArrowRight,
  UserX,
  FileCode,
  CheckSquare,
  ChevronDown,
  Filter,
  Save,
  RefreshCw,
  Loader2,
  UserPlus
} from 'lucide-react';
import ModalPortal from './ModalPortal';

// API_BASE imported from apiConfig

const DEPARTMENTS = [
  'All Departments',
  ...getKnownDepartments()
];

const INITIAL_ASSIGNMENTS = [];
const INITIAL_SUBMISSIONS = [];

export default function AssignmentManagement({ user }) {
  const isSuperAdmin = user?.role === 'Super Admin' || user?.isSuperAdmin || JSON.parse(sessionStorage.getItem('vcas_user') || '{}')?.role === 'Super Admin';
  // Tabs: 'assignments', 'submissions', 'analytics'
  const [activeTab, setActiveTab] = useState('assignments');

  // State
  const [assignmentsList, setAssignmentsList] = useState(INITIAL_ASSIGNMENTS);
  const [submissionsList, setSubmissionsList] = useState(INITIAL_SUBMISSIONS);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState(() => getKnownDepartments());
  const [loading, setLoading] = useState(false);

  // Selected Assignment for Submissions view
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(1);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedFaculty, setSelectedFaculty] = useState('All Faculty');

  // Student roster & quick submissions management state for Tab 2
  const [showAdminAddStudentForm, setShowAdminAddStudentForm] = useState(false);
  const [adminStudentRoll, setAdminStudentRoll] = useState('');
  const [adminStudentName, setAdminStudentName] = useState('');
  const [adminStudentReg, setAdminStudentReg] = useState('');
  const [adminStudentStatus, setAdminStudentStatus] = useState('Submitted');
  const [adminStudentMarks, setAdminStudentMarks] = useState('');
  const [adminQuickCount, setAdminQuickCount] = useState('');
  const [isUpdatingAdminSubs, setIsUpdatingAdminSubs] = useState(false);
  const [adminSubFilter, setAdminSubFilter] = useState('ALL');
  const [adminSubSearch, setAdminSubSearch] = useState('');

  // Modals State
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null); // null = create mode, object = edit mode
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);

  const handleViewDocument = (a) => {
    if (!a.attachmentData) {
      setToastMessage('No preview data attached to this document.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setViewingDoc({
      name: a.attachmentName || a.attachedDoc || 'Assignment_Document.pdf',
      data: a.attachmentData,
      size: a.attachmentSize || '',
      type: a.attachmentType || ''
    });
  };

  const handleViewSubmissionDoc = (sub) => {
    if (sub.fileData) {
      setViewingDoc({
        name: sub.fileName || `${sub.rollNo}_Submission.pdf`,
        data: sub.fileData,
        size: sub.fileSize || '',
        type: sub.fileType || 'application/pdf'
      });
    } else {
      setToastMessage(`Viewing submission info for ${sub.studentName}: ${sub.fileName || 'Submission.pdf'}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Normalize DB assignment to component format
  const normalizeAssignment = (a) => {
    const rawSubmissions = Array.isArray(a.studentSubmissions) ? a.studentSubmissions : [];
    const submittedCount = rawSubmissions.filter(s => s.status === 'Graded' || s.status === 'Submitted').length || (a.submissions !== undefined ? a.submissions : (a.submittedCount || 0));
    const gradedCount = rawSubmissions.filter(s => s.status === 'Graded').length || (a.gradedCount || 0);

    return {
      id: a._id || a.id,
      _id: a._id,
      title: a.title || '',
      code: a.subjectCode || a.code || 'GEN',
      subject: a.subjectName || a.subject || a.subjectCode || 'Coursework',
      department: a.department || 'Computer Science',
      year: a.year || (a.semester ? Math.ceil(a.semester / 2) : 3),
      sem: a.sem || (a.semester ? `Sem ${a.semester}` : 'Sem 5'),
      faculty: a.staffName || (a.staffId ? `Staff (${a.staffId})` : 'Faculty'),
      staffId: a.staffId || '',
      staffName: a.staffName || '',
      dueDate: a.dueDate || '',
      dueTime: a.dueTime || '11:59 PM',
      maxMarks: a.totalMarks !== undefined ? a.totalMarks : (a.maxMarks || 20),
      weightage: a.weightage || '10% CIA',
      totalStudents: rawSubmissions.length > 0 ? rawSubmissions.length : (a.totalStudents || 0),
      submittedCount,
      gradedCount,
      status: a.status || 'Active',
      description: a.description || '',
      attachedDoc: a.attachmentName || a.attachedDoc || `${a.subjectCode || 'Assignment'}_Brief.pdf`,
      attachmentName: a.attachmentName || '',
      attachmentData: a.attachmentData || '',
      attachmentSize: a.attachmentSize || '',
      attachmentType: a.attachmentType || '',
      type: a.type || 'Practical & Theory',
      isDbRecord: Boolean(a._id),
      createdAt: a.createdAt || null,
      studentSubmissions: rawSubmissions
    };
  };

  // Fetch all assignments and classes across all staff from backend
  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const [resAsgts, resClasses, resDepts] = await Promise.all([
        fetch(`${API_BASE}/assignments`).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch(`${API_BASE}/classes`).then(r => r.json()).catch(() => ({ success: false, classes: [] })),
        fetch(`${API_BASE}/departments`).then(r => r.json()).catch(() => ({ success: false, data: [] }))
      ]);

      if (resDepts.success && Array.isArray(resDepts.data) && resDepts.data.length > 0) {
        const dNames = resDepts.data.map(d => d.name).filter(Boolean);
        setAvailableDepartments(dNames.length > 0 ? dNames : getKnownDepartments());
      }

      const classesList = resClasses.classes || resClasses.data || [];
      setAvailableClasses(Array.isArray(classesList) ? classesList : []);
      const classMap = new Map();
      if (Array.isArray(classesList)) {
        classesList.forEach(c => {
          if (c.code) classMap.set(c.code.toUpperCase(), c);
        });
      }

      if (resAsgts.success && Array.isArray(resAsgts.data)) {
        const dbItems = resAsgts.data.map(a => {
          const norm = normalizeAssignment(a);
          const matchingClass = classMap.get((norm.code || '').toUpperCase());
          if (matchingClass && (!norm.studentSubmissions || norm.studentSubmissions.length === 0)) {
            const classStudents = matchingClass.students || [];
            if (classStudents.length > 0) {
              const isPastDue = norm.dueDate ? new Date(norm.dueDate + 'T23:59:59') < new Date() : false;
              norm.totalStudents = classStudents.length;
              norm.studentSubmissions = classStudents.map(std => ({
                rollNo: std.rollNo,
                studentName: std.name,
                regNo: std.rollNo,
                department: norm.department || matchingClass.dept || '',
                submittedAt: '--',
                fileName: '--',
                fileSize: '--',
                status: isPastDue ? 'Not Submitted (Overdue)' : 'Pending Submission',
                marksAwarded: null,
                feedback: ''
              }));
            }
          }
          return norm;
        });

        setAssignmentsList(dbItems);

        // Populate complete submissionsList
        const allSubs = [];
        dbItems.forEach(asgt => {
          if (Array.isArray(asgt.studentSubmissions)) {
            asgt.studentSubmissions.forEach(sub => {
              allSubs.push({
                id: sub._id || `${asgt.id}_${sub.rollNo}`,
                _id: sub._id,
                assignmentId: asgt.id,
                assignmentDbId: asgt._id,
                rollNo: sub.rollNo,
                regNo: sub.regNo || sub.rollNo,
                studentName: sub.studentName,
                department: sub.department || asgt.department,
                submittedAt: sub.submittedAt || '--',
                fileName: sub.fileName || '--',
                fileSize: sub.fileSize || '--',
                fileData: sub.fileData || sub.attachmentData || null,
                fileType: sub.fileType || sub.attachmentType || '',
                status: sub.status || 'Pending Submission',
                marksAwarded: sub.marksAwarded,
                maxMarks: asgt.maxMarks,
                feedback: sub.feedback || ''
              });
            });
          }
        });
        setSubmissionsList(allSubs);

        if (dbItems.length > 0) {
          setSelectedAssignmentId(prev => {
            if (prev && dbItems.some(d => String(d.id) === String(prev))) return prev;
            return dbItems[0].id;
          });
        } else {
          setSelectedAssignmentId(null);
        }
      }
    } catch (err) {
      console.warn('Could not fetch assignments from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Lock background scroll when any modal is open
  React.useEffect(() => {
    const isAnyModalOpen = Boolean(isAddAssignmentOpen || gradingSubmission);
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
  }, [isAddAssignmentOpen, gradingSubmission]);

  // New Assignment Form State
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    code: '',
    subject: '',
    department: '',
    year: 1,
    sem: 'Sem 1',
    faculty: '',
    dueDate: '',
    dueTime: '',
    maxMarks: '',
    weightage: '',
    description: '',
    type: 'Code & Report'
  });

  // Grading form state inside modal
  const [gradeInput, setGradeInput] = useState(0);
  const [feedbackInput, setFeedbackInput] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Distinct Faculty List for Filter Dropdown
  const facultyOptions = useMemo(() => {
    const list = new Set();
    assignmentsList.forEach(a => {
      if (a.faculty) list.add(a.faculty);
      if (a.staffName) list.add(a.staffName);
    });
    return ['All Faculty', ...Array.from(list)];
  }, [assignmentsList]);

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    return assignmentsList.filter(a => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.code && a.code.toLowerCase().includes(q)) ||
        (a.subject && a.subject.toLowerCase().includes(q)) ||
        (a.faculty && a.faculty.toLowerCase().includes(q)) ||
        (a.staffName && a.staffName.toLowerCase().includes(q)) ||
        (a.staffId && a.staffId.toLowerCase().includes(q))
      );

      const matchesDept = selectedDept === 'All Departments' || a.department === selectedDept;
      const matchesStatus = selectedStatus === 'ALL' || a.status === selectedStatus;
      const matchesFaculty = selectedFaculty === 'All Faculty' || a.faculty === selectedFaculty || a.staffName === selectedFaculty;

      return matchesSearch && matchesDept && matchesStatus && matchesFaculty;
    });
  }, [assignmentsList, searchQuery, selectedDept, selectedStatus, selectedFaculty]);

  // Selected Assignment Details
  const currentAssignment = useMemo(() => {
    return assignmentsList.find(a => String(a.id) === String(selectedAssignmentId)) || assignmentsList[0];
  }, [assignmentsList, selectedAssignmentId]);

  // Check if current assignment was created by staff (view-only mode for Admin)
  const isStaffAssigned = useMemo(() => {
    if (!currentAssignment) return false;
    const sId = currentAssignment.staffId;
    return Boolean(sId && String(sId).trim() !== '' && String(sId).toUpperCase() !== 'ADMIN');
  }, [currentAssignment]);

  // Submissions for Selected Assignment
  const currentSubmissions = useMemo(() => {
    return submissionsList.filter(s => String(s.assignmentId) === String(selectedAssignmentId));
  }, [submissionsList, selectedAssignmentId]);

  // Key Stats
  const totalSubmissions = useMemo(() => {
    return assignmentsList.reduce((acc, curr) => acc + curr.submittedCount, 0);
  }, [assignmentsList]);

  const totalMaxSubmissions = useMemo(() => {
    return assignmentsList.reduce((acc, curr) => acc + curr.totalStudents, 0);
  }, [assignmentsList]);

  const totalPendingGrading = useMemo(() => {
    return submissionsList.filter(s => s.status.includes('Pending')).length;
  }, [submissionsList]);

  // Real Average Score computed from all graded submissions
  const avgScoreStats = useMemo(() => {
    const graded = submissionsList.filter(s => s.status === 'Graded' && s.marksAwarded != null && s.maxMarks > 0);
    if (graded.length === 0) return { pct: null, avgMarks: null, maxMarks: null };
    const totalAwarded = graded.reduce((a, s) => a + Number(s.marksAwarded), 0);
    const totalMax = graded.reduce((a, s) => a + Number(s.maxMarks), 0);
    const avgAwarded = totalAwarded / graded.length;
    const avgMax = totalMax / graded.length;
    const pct = totalMax > 0 ? ((totalAwarded / totalMax) * 100).toFixed(1) : null;
    return { pct, avgMarks: avgAwarded.toFixed(1), maxMarks: avgMax.toFixed(1) };
  }, [submissionsList]);

  // Real Overdue (Defaulters): students who have NOT submitted on overdue assignments
  const overdueCount = useMemo(() => {
    const today = new Date();
    let count = 0;
    assignmentsList.forEach(asgt => {
      if (!asgt.dueDate) return;
      const due = new Date(asgt.dueDate + 'T23:59:59');
      if (due >= today) return; // not overdue
      if (Array.isArray(asgt.studentSubmissions)) {
        count += asgt.studentSubmissions.filter(s =>
          s.status !== 'Graded' && s.status !== 'Submitted' && s.status !== 'Pending Grading'
        ).length;
      }
    });
    return count;
  }, [assignmentsList]);

  // Real Submission Rate
  const submissionRate = useMemo(() => {
    const totalStudents = submissionsList.length;
    if (totalStudents === 0) return null;
    const submitted = submissionsList.filter(s => s.status === 'Graded' || s.status === 'Submitted').length;
    return ((submitted / totalStudents) * 100).toFixed(1);
  }, [submissionsList]);

  const BLANK_FORM = {
    title: '',
    code: '',
    subject: '',
    department: '',
    year: 1,
    sem: 'Sem 1',
    faculty: '',
    dueDate: '',
    dueTime: '',
    maxMarks: '',
    weightage: '',
    description: '',
    type: 'Code & Report'
  };

  // Open modal for editing an existing assignment
  const handleOpenEdit = (a) => {
    setEditingAssignment(a);
    setAssignmentForm({
      title: a.title,
      code: a.code,
      subject: a.subject,
      department: a.department,
      year: a.year,
      sem: a.sem,
      faculty: a.faculty,
      dueDate: a.dueDate,
      dueTime: a.dueTime,
      maxMarks: a.maxMarks,
      weightage: a.weightage,
      description: a.description,
      type: a.type
    });
    setIsAddAssignmentOpen(true);
  };

  // Close & reset the assignment modal
  const handleCloseAssignmentModal = () => {
    setIsAddAssignmentOpen(false);
    setEditingAssignment(null);
    setAssignmentForm(BLANK_FORM);
  };

  // Save New or Edited Assignment
  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentForm.title.trim()) {
      alert('Please enter Assignment Title');
      return;
    }

    if (editingAssignment) {
      // Update existing
      try {
        if (editingAssignment._id) {
          await fetch(`${API_BASE}/assignments/${editingAssignment._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: assignmentForm.title,
              subjectCode: assignmentForm.code,
              subjectName: assignmentForm.subject,
              department: assignmentForm.department,
              semester: assignmentForm.sem ? parseInt(String(assignmentForm.sem).replace(/\D/g, '')) || 1 : 1,
              dueDate: assignmentForm.dueDate,
              totalMarks: assignmentForm.maxMarks,
              description: assignmentForm.description,
              staffName: assignmentForm.faculty
            })
          });
        }
      } catch (err) {
        console.warn('Error updating assignment in backend:', err);
      }
      setAssignmentsList(prev => prev.map(a =>
        a.id === editingAssignment.id
          ? { ...a, ...assignmentForm }
          : a
      ));
      handleCloseAssignmentModal();
      showToast('Assignment updated successfully!');
      fetchAssignments();
    } else {
      // Create new
      try {
        const res = await fetch(`${API_BASE}/assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: assignmentForm.title,
            subjectCode: assignmentForm.code,
            subjectName: assignmentForm.subject,
            department: assignmentForm.department,
            semester: assignmentForm.sem ? parseInt(String(assignmentForm.sem).replace(/\D/g, '')) || 1 : 1,
            dueDate: assignmentForm.dueDate,
            totalMarks: assignmentForm.maxMarks,
            description: assignmentForm.description,
            staffName: assignmentForm.faculty || 'Admin'
          })
        });
        const json = await res.json();
        if (json.success && json.data) {
          fetchAssignments();
        } else {
          const newAssignment = {
            id: Date.now(),
            ...assignmentForm,
            totalStudents: 60,
            submittedCount: 0,
            gradedCount: 0,
            status: 'Active',
            attachedDoc: `${assignmentForm.code}_Brief.pdf`
          };
          setAssignmentsList(prev => [newAssignment, ...prev]);
        }
      } catch (err) {
        const newAssignment = {
          id: Date.now(),
          ...assignmentForm,
          totalStudents: 60,
          submittedCount: 0,
          gradedCount: 0,
          status: 'Active',
          attachedDoc: `${assignmentForm.code}_Brief.pdf`
        };
        setAssignmentsList(prev => [newAssignment, ...prev]);
      }
      handleCloseAssignmentModal();
      showToast('New Assignment published successfully to student portal!');
    }
  };

  // Toggle Status (Active / Closed)
  const handleToggleStatus = async (a) => {
    try {
      if (a._id) {
        await fetch(`${API_BASE}/assignments/${a._id}/status`, {
          method: 'PATCH'
        });
      }
      const newStatus = a.status === 'Active' ? 'Closed' : 'Active';
      setAssignmentsList(prev => prev.map(item =>
        item.id === a.id ? { ...item, status: newStatus } : item
      ));
      showToast(`Status changed to ${newStatus}`);
    } catch (err) {
      showToast('Failed to toggle status', true);
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (a) => {
    if (!window.confirm(`Are you sure you want to delete "${a.title}"?`)) return;
    try {
      if (a._id) {
        await fetch(`${API_BASE}/assignments/${a._id}`, {
          method: 'DELETE'
        });
      }
      setAssignmentsList(prev => prev.filter(item => item.id !== a.id));
      showToast('Assignment deleted successfully.');
    } catch (err) {
      showToast('Failed to delete assignment', true);
    }
  };

  // Open Grading Modal
  const handleOpenGrading = (sub) => {
    if (isStaffAssigned) {
      showToast('Marks for staff-assigned assignments are view-only and evaluated by faculty.');
      return;
    }
    setGradingSubmission(sub);
    setGradeInput(sub.marksAwarded || 20);
    setFeedbackInput(sub.feedback || 'Good attempt. Check comments on code efficiency.');
  };

  // Save Grade - persist to backend and update local state
  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    const assignmentDbId = gradingSubmission.assignmentDbId;
    if (assignmentDbId) {
      try {
        await fetch(`${API_BASE}/assignments/${assignmentDbId}/grade`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId: gradingSubmission._id,
            rollNo: gradingSubmission.rollNo,
            marksAwarded: Number(gradeInput),
            feedback: feedbackInput,
            studentName: gradingSubmission.studentName,
            regNo: gradingSubmission.regNo
          })
        });
      } catch (err) {
        console.warn('Could not save grade to backend:', err);
      }
    }

    setSubmissionsList(prev => prev.map(s => {
      if (s.id === gradingSubmission.id) {
        return {
          ...s,
          marksAwarded: Number(gradeInput),
          feedback: feedbackInput,
          status: 'Graded',
          fileName: s.fileName === '--' ? `${gradingSubmission.rollNo}_Submission.pdf` : s.fileName
        };
      }
      return s;
    }));

    setAssignmentsList(prev => prev.map(asgt => {
      if (String(asgt.id) === String(gradingSubmission.assignmentId)) {
        const updatedSubs = (asgt.studentSubmissions || []).map(sub =>
          sub.rollNo === gradingSubmission.rollNo
            ? { ...sub, marksAwarded: Number(gradeInput), feedback: feedbackInput, status: 'Graded' }
            : sub
        );
        return { ...asgt, studentSubmissions: updatedSubs, gradedCount: updatedSubs.filter(s => s.status === 'Graded').length };
      }
      return asgt;
    }));

    setGradingSubmission(null);
    showToast(`Marks (${gradeInput}/${gradingSubmission.maxMarks}) & feedback saved for ${gradingSubmission.studentName}!`);
  };

  // Export Submissions CSV
  const handleExportSubmissionsCSV = () => {
    const headers = ['Roll No', 'Register No', 'Student Name', 'Department', 'Assignment', 'Submission Date', 'Status', 'Marks Awarded', 'Max Marks', 'Feedback'];
    const rows = currentSubmissions.map(s => [
      `"${s.rollNo}"`,
      `"${s.regNo}"`,
      `"${s.studentName}"`,
      `"${s.department}"`,
      `"${currentAssignment?.title}"`,
      `"${s.submittedAt}"`,
      `"${s.status}"`,
      s.marksAwarded,
      s.maxMarks,
      `"${s.feedback}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vidyapeeth_Assignment_${currentAssignment?.code}_Submissions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Submissions report exported as CSV!');
  };

  // Filtered Submissions for Display in Tab 2
  const displayedSubmissions = useMemo(() => {
    return currentSubmissions.filter(s => {
      const isSub = s.status === 'Submitted' || s.status === 'Graded';
      if (adminSubFilter === 'SUBMITTED' && !isSub) return false;
      if (adminSubFilter === 'PENDING' && isSub) return false;
      if (adminSubFilter === 'GRADED' && s.status !== 'Graded') return false;
      if (adminSubSearch.trim()) {
        const q = adminSubSearch.toLowerCase().trim();
        const matchName = s.studentName && s.studentName.toLowerCase().includes(q);
        const matchRoll = s.rollNo && s.rollNo.toLowerCase().includes(q);
        const matchReg = s.regNo && s.regNo.toLowerCase().includes(q);
        if (!matchName && !matchRoll && !matchReg) return false;
      }
      return true;
    });
  }, [currentSubmissions, adminSubFilter, adminSubSearch]);

  // Admin: Add Student to Assignment Roster
  const handleAdminAddStudent = async (e) => {
    e?.preventDefault();
    if (!currentAssignment) return;
    if (isStaffAssigned) {
      showToast('Roster and student records for staff-assigned coursework are managed by faculty.');
      return;
    }
    if (!adminStudentRoll.trim() || !adminStudentName.trim()) {
      showToast('Please enter both Roll No and Student Name');
      return;
    }
    setIsUpdatingAdminSubs(true);
    try {
      const asgtId = currentAssignment._id || currentAssignment.id;
      const parsedMarks = adminStudentMarks.trim() !== '' ? Number(adminStudentMarks) : null;
      const res = await fetch(`${API_BASE}/assignments/${asgtId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNo: adminStudentRoll.trim(),
          studentName: adminStudentName.trim(),
          regNo: adminStudentReg.trim() || adminStudentRoll.trim(),
          status: parsedMarks !== null ? 'Graded' : adminStudentStatus,
          marksAwarded: parsedMarks,
          department: currentAssignment.department || 'Computer Science'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Student ${adminStudentName} added to roster successfully!`);
        setAdminStudentRoll('');
        setAdminStudentName('');
        setAdminStudentReg('');
        setAdminStudentMarks('');
        setShowAdminAddStudentForm(false);
        await fetchAssignments();
      } else {
        showToast(data.message || 'Failed to add student');
      }
    } catch (err) {
      showToast('Error adding student to assignment');
    } finally {
      setIsUpdatingAdminSubs(false);
    }
  };

  // Admin: Toggle Submission Status
  const handleAdminToggleStatus = async (sub) => {
    if (!currentAssignment) return;
    if (isStaffAssigned) {
      showToast('Submission status for staff-assigned coursework is view-only.');
      return;
    }
    const isSubmitted = sub.status === 'Submitted' || sub.status === 'Graded';
    const newStatus = isSubmitted ? 'Pending Submission' : 'Submitted';
    setIsUpdatingAdminSubs(true);
    try {
      const asgtId = currentAssignment._id || currentAssignment.id;
      const targetId = sub._id || sub.rollNo;
      const res = await fetch(`${API_BASE}/assignments/${asgtId}/students/${targetId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Updated ${sub.studentName} to "${newStatus}"`);
        await fetchAssignments();
      } else {
        showToast(data.message || 'Failed to update status');
      }
    } catch (err) {
      showToast('Error updating submission status');
    } finally {
      setIsUpdatingAdminSubs(false);
    }
  };

  // Admin: Quick Set Submissions Count
  const handleAdminQuickSet = async (countVal) => {
    if (!currentAssignment) return;
    if (isStaffAssigned) {
      showToast('Submissions for staff-assigned coursework are managed by faculty in Staff Portal.');
      return;
    }
    const num = parseInt(countVal, 10);
    if (isNaN(num) || num < 0) {
      showToast('Please enter a valid non-negative number');
      return;
    }
    setIsUpdatingAdminSubs(true);
    try {
      const asgtId = currentAssignment._id || currentAssignment.id;
      const res = await fetch(`${API_BASE}/assignments/${asgtId}/submissions/quick-set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: num })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Set submissions to ${num} students!`);
        setAdminQuickCount('');
        await fetchAssignments();
      } else {
        showToast(data.message || 'Failed to quick set submissions');
      }
    } catch (err) {
      showToast('Error updating submissions count');
    } finally {
      setIsUpdatingAdminSubs(false);
    }
  };

  // Admin: 1-Click Import Class Roster
  const handleAdminImportClass = async () => {
    if (!currentAssignment) return;
    if (isStaffAssigned) {
      showToast('Class roster for staff coursework is managed by faculty.');
      return;
    }
    setIsUpdatingAdminSubs(true);
    try {
      const asgtId = currentAssignment._id || currentAssignment.id;
      const res = await fetch(`${API_BASE}/assignments/${asgtId}/students/import-class`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Class roster imported successfully!');
        await fetchAssignments();
      } else {
        showToast(data.message || 'No matching class or students found');
      }
    } catch (err) {
      showToast('Error syncing class roster');
    } finally {
      setIsUpdatingAdminSubs(false);
    }
  };

  // Admin: Remove Student from Roster
  const handleAdminRemoveStudent = async (sub) => {
    if (!currentAssignment) return;
    if (isStaffAssigned) {
      showToast('Cannot remove student from staff-assigned coursework.');
      return;
    }
    if (!window.confirm(`Remove ${sub.studentName} (${sub.rollNo}) from this assignment?`)) return;
    setIsUpdatingAdminSubs(true);
    try {
      const asgtId = currentAssignment._id || currentAssignment.id;
      const targetId = sub._id || sub.rollNo;
      const res = await fetch(`${API_BASE}/assignments/${asgtId}/students/${targetId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Removed ${sub.studentName} from roster`);
        await fetchAssignments();
      } else {
        showToast(data.message || 'Failed to remove student');
      }
    } catch (err) {
      showToast('Error removing student');
    } finally {
      setIsUpdatingAdminSubs(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans animate-fadeIn">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && typeof document !== 'undefined' && createPortal(
        <div className="fixed top-6 right-6 z-[99999] bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn pointer-events-auto">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>,
        document.body
      )}

      {/* 1. TOP HEADER & QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
              Coursework & Homework Portal
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-semibold">Continuous Assessment (CIA) Tasks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Assignment Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Post homework assignments, track digital PDF submissions, check plagiarism, and record grading feedback.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          

          {isSuperAdmin && (
            <button
            onClick={handleExportSubmissionsCSV}
            title="Download CSV Submissions"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Submissions</span>
          </button>
          )}

          <button
            onClick={() => setIsAddAssignmentOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>
        </div>
      </div>

      {/* 2. TOP STATS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Active Tasks</span>
            <p className="text-2xl font-black text-blue-600">{assignmentsList.length}</p>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">Across 6 Departments</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Submissions</span>
            <p className="text-2xl font-black text-emerald-600">{totalSubmissions}</p>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">
              {submissionRate != null ? `${submissionRate}% Submission Rate` : 'Submission Rate'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pending Review</span>
            <p className="text-2xl font-black text-amber-600">{totalPendingGrading}</p>
            <p className="text-[11px] text-amber-600 font-bold mt-1">Awaiting Marks</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Average Score</span>
            <p className="text-2xl font-black text-indigo-600">
              {avgScoreStats.pct != null ? `${avgScoreStats.pct}%` : '--'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {avgScoreStats.avgMarks != null
                ? `${avgScoreStats.avgMarks} / ${avgScoreStats.maxMarks} Marks Avg`
                : 'No Graded Submissions Yet'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Overdue Students</span>
            <p className="text-2xl font-black text-rose-600">{overdueCount}</p>
            <p className="text-[11px] text-rose-600 font-bold mt-1">
              {overdueCount > 0 ? 'Defaulters Alert' : 'No Overdue'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex items-center border-b border-slate-200 text-xs sm:text-sm overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'assignments'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Assignments Catalog ({filteredAssignments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'submissions'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Student Submissions & Grading Desk ({currentSubmissions.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB 1: ASSIGNMENTS CATALOG                                              */}
      {/* ========================================================================= */}
      {activeTab === 'assignments' && (
        <div className="space-y-5">
          
          {/* Filters Row */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assignments by title, subject code, or professor name..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="All Departments">All Departments</option>
                  {availableDepartments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active (Open for Submission)</option>
                  <option value="Closed">Closed</option>
                  <option value="Completed">Completed & Graded</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Staff / Faculty</label>
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  {facultyOptions.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Assignments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {loading ? (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
                <Loader2 className="w-8 h-8 mx-auto text-blue-600 animate-spin mb-3" />
                <p className="text-xs font-semibold text-slate-500">Loading assignments from server...</p>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Assignments Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {searchQuery || selectedDept !== 'All Departments' || selectedStatus !== 'ALL' || selectedFaculty !== 'All Faculty'
                    ? 'No assignments match your filter criteria. Try resetting filters.'
                    : 'No assignments have been created yet. Assignments set by individual staff will appear here.'}
                </p>
                <button
                  onClick={() => setIsAddAssignmentOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Assignment</span>
                </button>
              </div>
            ) : (
              filteredAssignments.map((a) => {
              const submissionRate = ((a.submittedCount / a.totalStudents) * 100).toFixed(0);
              const isAdminCreated = !a.staffId || a.staffId === 'ADMIN' || a.staffId.toUpperCase() === 'ADMIN';

              return (
                <div 
                  key={a.id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all group"
                >
                  <div>
                    {/* Top Row Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono font-black text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                          {a.code}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {a.department} • {a.sem}
                        </span>
                        {a.staffId && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200">
                            <Users className="w-3 h-3 text-purple-500" />
                            Staff: {a.staffName || a.faculty} ({a.staffId})
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleStatus(a)}
                        title="Click to toggle Active / Closed"
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          a.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {a.status}
                      </button>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                      {a.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Subject: <strong className="text-slate-800">{a.subject}</strong> • Faculty: <strong className="text-slate-800">{a.faculty}</strong>
                    </p>
                    <p className="text-xs text-slate-600 mt-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-100 line-clamp-2">
                      {a.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Submission Progress & Due Date */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        <span>Due: <strong className="text-slate-900">{a.dueDate} ({a.dueTime})</strong></span>
                      </span>
                      <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        Max: {a.maxMarks} Marks ({a.weightage})
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium">Submissions Received:</span>
                        <strong className="text-slate-900">{a.submittedCount} / {a.totalStudents} ({submissionRate}%)</strong>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all"
                          style={{ width: `${submissionRate}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Attached Document or PDF Badge */}
                    {a.attachmentName || a.attachmentData ? (
                      <div className="flex items-center justify-between p-2.5 bg-blue-50/60 border border-blue-200/70 rounded-2xl">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[9px] shrink-0 ${
                            a.attachmentName?.toLowerCase().endsWith('.pdf')
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            {a.attachmentName?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC'}
                          </div>
                          <div className="truncate max-w-[170px] sm:max-w-[240px]">
                            <p className="text-xs font-extrabold text-slate-800 truncate" title={a.attachmentName}>
                              {a.attachmentName}
                            </p>
                            {a.attachmentSize && (
                              <span className="text-[10px] text-slate-400 font-medium block leading-none mt-0.5">
                                {a.attachmentSize}
                              </span>
                            )}
                          </div>
                        </div>

                        {a.attachmentData && (
                          <button
                            onClick={() => handleViewDocument(a)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-600 font-bold text-xs rounded-xl border border-blue-200 shadow-2xs transition-all shrink-0 cursor-pointer"
                            title="View document on screen"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Doc</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium py-1">
                        <FileText className="w-3.5 h-3.5 text-slate-300" />
                        <span>{a.attachedDoc || 'No file attached'}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        {!isAdminCreated && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                            Staff Assigned
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isAdminCreated && (
                          <button
                            onClick={() => handleOpenEdit(a)}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-xl border border-amber-200 transition-all flex items-center gap-1 cursor-pointer"
                            title="Edit assignment details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAssignment(a)}
                          title="Delete assignment"
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl border border-rose-200 transition-all flex items-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAssignmentId(a.id);
                            setActiveTab('submissions');
                          }}
                          className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          {isAdminCreated ? (
                            <>
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Grade Submissions</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 text-purple-600" />
                              <span>View Submissions</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 2: STUDENT SUBMISSIONS & GRADING DESK                               */}
      {/* ========================================================================= */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          
          {/* Assignment Selector Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              {isStaffAssigned ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200 uppercase tracking-wider">
                  <Eye className="w-3 h-3 text-purple-600" />
                  Staff Assigned Coursework (View-Only Mode)
                </span>
              ) : (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  Currently Selected Task:
                </span>
              )}
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                {currentAssignment?.code} — {currentAssignment?.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {currentAssignment?.department} (Year {currentAssignment?.year} - {currentAssignment?.sem}) • Max: {currentAssignment?.maxMarks} Marks
                {currentAssignment?.staffId && ` • Staff ID: ${currentAssignment?.staffId}`}
                {currentAssignment?.dueDate && ` • Due: ${currentAssignment.dueDate}`}
              </p>
            </div>

            <div className="w-full md:w-80">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Switch Assignment</label>
              <select
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                {assignmentsList.map(a => (
                  <option key={a.id} value={a.id}>{a.code} - {(a.title || '').substring(0, 35)}...</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submission Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>Enrolled Students</span>
              </div>
              <p className="text-xl font-extrabold text-slate-900">
                {currentAssignment?.totalStudents || currentSubmissions.length}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Submitted</span>
              </div>
              <p className="text-xl font-extrabold text-emerald-600">
                {currentAssignment?.submittedCount || currentSubmissions.filter(s => s.status === 'Submitted' || s.status === 'Graded').length}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>Pending / Overdue</span>
              </div>
              <p className="text-xl font-extrabold text-rose-600">
                {Math.max(0, (currentAssignment?.totalStudents || currentSubmissions.length) - (currentAssignment?.submittedCount || currentSubmissions.filter(s => s.status === 'Submitted' || s.status === 'Graded').length))}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Submission Rate</span>
              </div>
              <p className="text-xl font-extrabold text-indigo-600">
                {(currentAssignment?.totalStudents || currentSubmissions.length) > 0
                  ? Math.round(((currentAssignment?.submittedCount || currentSubmissions.filter(s => s.status === 'Submitted' || s.status === 'Graded').length) / (currentAssignment?.totalStudents || currentSubmissions.length)) * 100)
                  : 0}%
              </p>
            </div>
          </div>

          {/* Quick-Set Submissions & Roster Controls (Admin Created) OR Read-Only Banner (Staff Assigned) */}
          {isStaffAssigned ? (
            <div className="bg-gradient-to-r from-purple-50/90 via-indigo-50/70 to-slate-50 border border-purple-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0 mt-0.5 sm:mt-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-purple-950 flex flex-wrap items-center gap-2">
                    <span>Staff Assigned Coursework — View-Only Mode</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-200/60 text-purple-800 rounded-md border border-purple-300/60">
                      Faculty: {currentAssignment?.staffName || currentAssignment?.faculty} {currentAssignment?.staffId ? `(${currentAssignment.staffId})` : ''}
                    </span>
                  </h4>
                  <p className="text-[11px] text-purple-800/80 font-medium mt-0.5">
                    Student roster, submission status, and awarded marks are evaluated directly by the course faculty in the Staff Portal. Marks sync automatically with Internal Marks. In this desk, all records are strictly view-only.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-purple-700 text-xs font-bold rounded-xl border border-purple-200 shadow-2xs">
                  <Eye className="w-3.5 h-3.5 text-purple-600" />
                  <span>View Mode Active</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Submission Count & Roster Controls</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Directly set how many students submitted, sync from registered classes, or add individual students.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdminAddStudentForm(!showAdminAddStudentForm)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{showAdminAddStudentForm ? 'Cancel Add' : '+ Add Student'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Set Submissions Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-blue-100/70">
                <span className="text-xs font-bold text-slate-700">Quick Set Submitted Count:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max={currentAssignment?.totalStudents || 100}
                    value={adminQuickCount}
                    onChange={(e) => setAdminQuickCount(e.target.value)}
                    placeholder={`0 - ${currentAssignment?.totalStudents || 60}`}
                    className="w-24 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAdminQuickSet(adminQuickCount)}
                    disabled={isUpdatingAdminSubs || adminQuickCount === ''}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-40"
                  >
                    Set Count
                  </button>
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => handleAdminQuickSet(currentSubmissions.length || currentAssignment?.totalStudents || 0)}
                    disabled={isUpdatingAdminSubs}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[11px] rounded-lg border border-emerald-200 transition-all cursor-pointer disabled:opacity-50"
                  >
                    All Submitted ({currentSubmissions.length || currentAssignment?.totalStudents || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminQuickSet(0)}
                    disabled={isUpdatingAdminSubs}
                    className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[11px] rounded-lg border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
                  >
                    All Pending (0)
                  </button>
                </div>
              </div>

              {/* Inline Add Student Form */}
              {showAdminAddStudentForm && (
                <form onSubmit={handleAdminAddStudent} className="pt-3 border-t border-blue-200/80 mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5 bg-white p-3.5 rounded-xl border border-blue-200 animate-fadeIn">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Roll No *</label>
                    <input
                      type="text"
                      value={adminStudentRoll}
                      onChange={(e) => setAdminStudentRoll(e.target.value)}
                      placeholder="e.g. 21CS045"
                      className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Student Name *</label>
                    <input
                      type="text"
                      value={adminStudentName}
                      onChange={(e) => setAdminStudentName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Register No</label>
                    <input
                      type="text"
                      value={adminStudentReg}
                      onChange={(e) => setAdminStudentReg(e.target.value)}
                      placeholder="Optional (defaults to Roll)"
                      className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
                      Marks (Max {currentAssignment?.maxMarks || 20})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={currentAssignment?.maxMarks || 20}
                      value={adminStudentMarks}
                      onChange={(e) => {
                        setAdminStudentMarks(e.target.value);
                        if (e.target.value !== '' && adminStudentStatus === 'Pending Submission') {
                          setAdminStudentStatus('Submitted');
                        }
                      }}
                      placeholder={`0-${currentAssignment?.maxMarks || 20}`}
                      className="w-full px-2.5 py-1.5 text-xs font-bold text-indigo-900 bg-indigo-50/40 border border-indigo-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Initial Status</label>
                    <select
                      value={adminStudentStatus}
                      onChange={(e) => setAdminStudentStatus(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Pending Submission">Pending Submission</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-1.5">
                    <button
                      type="submit"
                      disabled={isUpdatingAdminSubs}
                      className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUpdatingAdminSubs ? 'Adding...' : 'Add Student'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAdminAddStudentForm(false)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Submissions Search, Filter & Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={adminSubSearch}
                  onChange={(e) => setAdminSubSearch(e.target.value)}
                  placeholder="Search student or roll no..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {['ALL', 'SUBMITTED', 'PENDING', 'GRADED'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAdminSubFilter(mode)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      adminSubFilter === mode
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {mode === 'ALL' ? 'All' : mode === 'SUBMITTED' ? 'Submitted' : mode === 'PENDING' ? 'Pending' : 'Graded'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 justify-between sm:justify-end">
              <span className="text-xs text-slate-400 font-medium">
                Showing {displayedSubmissions.length} of {currentSubmissions.length} students
              </span>
              <button
                type="button"
                onClick={handleExportSubmissionsCSV}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">STUDENT ROLL & NAME</th>
                    <th className="py-4 px-4">SUBMISSION STATUS</th>
                    <th className="py-4 px-4 text-center">MARKS AWARDED</th>
                    <th className="py-4 px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {displayedSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400 text-xs font-semibold">
                        {currentSubmissions.length === 0
                          ? 'No students found on this assignment roster. Click "Sync Class Roster" or "+ Add Student" to populate students.'
                          : 'No students match the selected filter or search.'}
                      </td>
                    </tr>
                  ) : (
                    displayedSubmissions.map((sub, idx) => {
                      const isSubmitted = sub.status === 'Submitted' || sub.status === 'Graded';

                      return (
                        <tr key={sub._id || sub.id || sub.rollNo || idx} className="hover:bg-slate-50/50">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                                {sub.rollNo}
                              </span>
                              <div>
                                <p className="font-bold text-slate-900">{sub.studentName}</p>
                                <span className="text-[11px] text-slate-400 font-mono">Reg: {sub.regNo}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              {sub.status === 'Graded' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" /> Graded
                                </span>
                              ) : isSubmitted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                  <CheckCircle2 className="w-3 h-3" /> Submitted
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                  <AlertTriangle className="w-3 h-3" /> Not Submitted
                                </span>
                              )}
                              <p className="text-[10px] text-slate-400">{sub.submittedAt}</p>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-center">
                            {sub.status === 'Graded' || (sub.marksAwarded !== null && sub.marksAwarded !== undefined && sub.marksAwarded !== '') ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="font-black text-sm text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                                  {sub.marksAwarded} / {sub.maxMarks || currentAssignment?.maxMarks || 25}
                                </span>
                                {isStaffAssigned && (
                                  <span className="text-[9px] font-bold text-slate-400 mt-0.5">Faculty Graded</span>
                                )}
                              </div>
                            ) : isSubmitted ? (
                              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                {isStaffAssigned ? 'Pending Faculty Grading' : 'Needs Grading'}
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                                --
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-6 text-right">
                            {isStaffAssigned ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg border border-slate-200" title="Marks and submissions are view-only for staff assignments">
                                  <Eye className="w-3.5 h-3.5 text-purple-600" />
                                  <span>View Only</span>
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Quick Toggle Submission Status Button */}
                                <button
                                  type="button"
                                  onClick={() => handleAdminToggleStatus(sub)}
                                  disabled={isUpdatingAdminSubs}
                                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                    isSubmitted
                                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                  }`}
                                  title={isSubmitted ? 'Mark as Not Submitted / Pending' : 'Mark as Submitted'}
                                >
                                  {isSubmitted ? 'Mark Pending' : 'Mark Submitted'}
                                </button>

                                {/* Grade Button */}
                                {isSubmitted && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenGrading(sub)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-all cursor-pointer"
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>{sub.status === 'Graded' ? 'Edit Grade' : 'Grade'}</span>
                                  </button>
                                )}

                                {/* Delete Student Button */}
                                <button
                                  type="button"
                                  onClick={() => handleAdminRemoveStudent(sub)}
                                  disabled={isUpdatingAdminSubs}
                                  className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 transition-all cursor-pointer"
                                  title="Remove student from assignment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: CREATE NEW ASSIGNMENT                                           */}
      {/* ========================================================================= */}
      {isAddAssignmentOpen && (
        <ModalPortal isOpen={isAddAssignmentOpen} onClose={handleCloseAssignmentModal}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${editingAssignment ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-600'}`}>
                  {editingAssignment ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                    {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingAssignment
                      ? `Editing: ${editingAssignment.code} — ${(editingAssignment.title || '').substring(0, 40)}...`
                      : 'Publish a coursework homework task with instructions for students'}
                  </p>
                </div>
              </div>
              <button onClick={handleCloseAssignmentModal} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assignment Title *</label>
                <input
                  type="text"
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  placeholder="e.g. B-Tree Indexing and Query Optimization"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Quick Select from Registered Classes */}
              {availableClasses.length > 0 && !editingAssignment && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Select Class / Course (Auto-fills Code & Subject)
                  </label>
                  <select
                    onChange={(e) => {
                      const selectedCode = e.target.value;
                      if (!selectedCode) return;
                      const matched = availableClasses.find(c => c.code === selectedCode);
                      if (matched) {
                        setAssignmentForm(prev => ({
                          ...prev,
                          code: matched.code || prev.code,
                          subject: matched.name || prev.subject,
                          department: matched.dept || prev.department,
                          sem: matched.semester ? `Sem ${matched.semester}` : prev.sem,
                          year: matched.year || prev.year,
                          faculty: matched.staffName || prev.faculty
                        }));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs font-semibold text-blue-900 focus:bg-white focus:outline-none cursor-pointer"
                    defaultValue=""
                  >
                    <option value="">-- Choose a Registered Class (Optional) --</option>
                    {availableClasses.map(c => (
                      <option key={c._id || c.code} value={c.code}>
                        {c.code} – {c.name} ({c.dept || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={assignmentForm.code}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = availableClasses.find(c => (c.code || '').toUpperCase() === val.trim().toUpperCase());
                      setAssignmentForm(prev => ({
                        ...prev,
                        code: val,
                        ...(matched && !prev.subject ? { subject: matched.name, department: matched.dept || prev.department } : {})
                      }));
                    }}
                    placeholder="e.g. CS401 (optional)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    value={assignmentForm.subject}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, subject: e.target.value })}
                    placeholder="e.g. Cloud Computing & DevOps"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                <select
                  value={assignmentForm.department}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                >
                  {availableDepartments.length === 0 ? (
                    <option value="">No departments added yet</option>
                  ) : (
                    availableDepartments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Marks *</label>
                  <input
                    type="number"
                    value={assignmentForm.maxMarks}
                    placeholder="e.g. 25"
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, maxMarks: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-purple-500 focus:outline-none placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assignment Description & Instructions</label>
                <textarea
                  rows={3}
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  placeholder="Provide instructions, problem statement, or submission guidelines..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseAssignmentModal}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 ${
                    editingAssignment
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                      : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{editingAssignment ? 'Save Changes' : 'Publish Assignment'}</span>
                </button>
              </div>

            </form>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: GRADE STUDENT SUBMISSION                                        */}
      {/* ========================================================================= */}
      {gradingSubmission && (
        <ModalPortal isOpen={Boolean(gradingSubmission)} onClose={() => setGradingSubmission(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">Grade Student Submission</h3>
                  <p className="text-[11px] text-slate-500">
                    {gradingSubmission.studentName} ({gradingSubmission.rollNo})
                  </p>
                </div>
              </div>
              <button onClick={() => setGradingSubmission(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document details */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-600" />
                  {gradingSubmission.fileName}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {gradingSubmission.fileSize}
                </span>
              </div>
              <p className="text-slate-500">Submitted on {gradingSubmission.submittedAt}</p>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Awarded Marks (Out of {gradingSubmission.maxMarks}) *
                </label>
                <input
                  type="number"
                  max={gradingSubmission.maxMarks}
                  min={0}
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-emerald-600 focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Faculty Feedback / Comments</label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Provide feedback on code quality, diagrams, or areas to improve..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Grade & Feedback</span>
                </button>
              </div>

            </form>

          </div>
        </ModalPortal>
      )}

      {/* Document Viewer Modal for Staff Uploaded PDF / DOC */}
      {viewingDoc && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setViewingDoc(null)} />
            <div className="relative bg-white rounded-3xl shadow-2xl p-5 sm:p-6 w-full max-w-4xl z-10 animate-in fade-in zoom-in-95 flex flex-col h-[88vh] max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    viewingDoc.name?.toLowerCase().endsWith('.pdf')
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {viewingDoc.name?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC'}
                  </div>
                  <div className="truncate">
                    <h3 className="font-extrabold text-slate-900 text-sm truncate" title={viewingDoc.name}>
                      {viewingDoc.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {viewingDoc.size && `${viewingDoc.size} • `}Staff Assignment Attachment Viewer
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = viewingDoc.data;
                      link.download = viewingDoc.name || "assignment_document.pdf";
                      link.click();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    title="Download a copy"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingDoc(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Embedded Document Frame */}
              <div className="flex-1 min-h-0 bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 relative flex flex-col">
                {viewingDoc.name?.toLowerCase().endsWith('.pdf') || viewingDoc.data?.startsWith('data:application/pdf') ? (
                  <iframe
                    src={viewingDoc.data}
                    className="w-full h-full border-0 rounded-2xl"
                    title={viewingDoc.name}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-base">{viewingDoc.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      {viewingDoc.size && `File Size: ${viewingDoc.size}. `}
                      This document format is best viewed with your device's word processor.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = viewingDoc.data;
                        link.download = viewingDoc.name || "document.docx";
                        link.click();
                      }}
                      className="mt-4 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Open / Download Document
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
