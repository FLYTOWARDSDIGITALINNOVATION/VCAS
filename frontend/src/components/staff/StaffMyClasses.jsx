import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE, BACKEND_URL } from '../../apiConfig';
import {
  BookOpen, Users, ChevronDown, ChevronUp, GraduationCap,
  Hash, Layers, Plus, X, Trash2, CheckCircle2, UserPlus,
  AlertCircle, Building2, MapPin, Pencil, Check, SlidersHorizontal,
  Send, ShieldCheck, Lock, Unlock, Clock, Save, Loader2, UserCheck,
  Award, RefreshCw, Search
} from 'lucide-react';
import ModalPortal from '../ModalPortal';

// API_BASE imported from apiConfig

export default function StaffMyClasses({ staffUser }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);

  // Department, Year, Sem Subject-side filters
  const [filterDept, setFilterDept] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [filterSem, setFilterSem] = useState('All');
  const [adminDepartments, setAdminDepartments] = useState([]);

  // Student selection & Subject Assignment state
  const [selectedStudentsToAssign, setSelectedStudentsToAssign] = useState(new Set());
  const [targetSubjectToAssign, setTargetSubjectToAssign] = useState('');
  const [isAssigningStudents, setIsAssigningStudents] = useState(false);
  const [showAssignRoster, setShowAssignRoster] = useState(true);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Class marksheet & approval state per subject: { [code]: marksheetDoc }
  const [marksheetData, setMarksheetData] = useState({});
  const [loadingMarks, setLoadingMarks] = useState({});
  const [savingMarks, setSavingMarks] = useState({});
  const [processingApproval, setProcessingApproval] = useState({});
  const [classActiveTab, setClassActiveTab] = useState({}); // { [code]: 'students' | 'marks' }

  // Add Class Modal State
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);
  const [classError, setClassError] = useState('');
  const [newClass, setNewClass] = useState({
    name: '',
    code: '',
    semester: 4,
    year: 2,
    section: 'A',
    credits: 3,
    room: ''
  });

  // Enroll Student Modal State
  const [enrollingClassCode, setEnrollingClassCode] = useState(null);
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [studentError, setStudentError] = useState('');
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [selectedRegisteredRoll, setSelectedRegisteredRoll] = useState('');
  const [enrollMode, setEnrollMode] = useState('select'); // 'select' | 'manual'
  const [newStudent, setNewStudent] = useState({
    rollNo: '',
    name: '',
    phone: '',
    email: ''
  });

  // Edit Class Modal State
  const [editingClass, setEditingClass] = useState(null); // holds cls object being edited
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    name: '', section: '', year: 2, semester: 4, credits: 3, room: ''
  });

  // Success Feedback
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 4500);
  };

  // Roles determination
  const normalizeRole = (value) => String(value || '').toUpperCase().replace(/[^A-Z]/g, '');
  const looksLikeHod = (value) => {
    const normalized = normalizeRole(value);
    return normalized.includes('HOD') ||
      normalized.includes('HEADOFDEPARTMENT') ||
      (normalized.includes('HEAD') && normalized.includes('DEPARTMENT')) ||
      normalized.includes('HEADOFDEPT') ||
      normalized.includes('DEPARTMENTHEAD');
  };

  const roleKey = normalizeRole(staffUser?.role);
  const designationKey = normalizeRole(staffUser?.designation);

  const isSuperAdminUser = roleKey.includes('SUPERADMIN') ||
    roleKey.includes('SUPERADMINISTRATOR') ||
    roleKey.includes('MANAGINGDIRECTOR') ||
    roleKey.includes('MD') ||
    designationKey.includes('MANAGINGDIRECTOR') ||
    designationKey.includes('MD');

  const isAdminUser = !isSuperAdminUser && (
    roleKey.includes('ADMIN') ||
    roleKey.includes('ADMINISTRATOR') ||
    roleKey.includes('PRINCIPAL') ||
    designationKey.includes('PRINCIPAL')
  );

  const isHod = !isSuperAdminUser && !isAdminUser && (
    looksLikeHod(staffUser?.role) ||
    looksLikeHod(staffUser?.designation) ||
    staffUser?.isHod === true
  );

  const isPrincipal = roleKey.includes('PRINCIPAL') || designationKey.includes('PRINCIPAL');
  const isMD = isSuperAdminUser;
  const isStaffOnly = !isSuperAdminUser && !isAdminUser && !isHod;

  // Fetch classes from backend API
  const fetchClasses = async () => {
    if (!staffUser?.staffId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}`);
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes || []);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch registered students from main Student database
  const fetchRegisteredStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/students`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRegisteredStudents(data.data);
      }
    } catch (err) {
      console.error('Error fetching registered students:', err);
    }
  };

  // Fetch departments list
  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/departments`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAdminDepartments(data.data);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  // Fetch marksheet for a class
  const fetchMarksheetForClass = async (classCode) => {
    if (!classCode) return;
    const cleanCode = classCode.trim().toUpperCase();
    const effectiveStaffId = staffUser?.staffId || 'EMP001';
    setLoadingMarks(prev => ({ ...prev, [cleanCode]: true }));
    try {
      const res = await fetch(`${API_BASE}/internal-marks/${effectiveStaffId}/${encodeURIComponent(cleanCode)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setMarksheetData(prev => ({ ...prev, [cleanCode]: data.data }));
      }
    } catch (err) {
      console.error('Error fetching marksheet for class:', err);
    } finally {
      setLoadingMarks(prev => ({ ...prev, [cleanCode]: false }));
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchRegisteredStudents();
    fetchDepartments();
  }, [staffUser?.staffId]);

  // Load marksheet when a class is expanded
  useEffect(() => {
    if (expandedSubject && !marksheetData[expandedSubject]) {
      fetchMarksheetForClass(expandedSubject);
    }
  }, [expandedSubject]);

  // Department dropdown options
  const departmentsList = useMemo(() => {
    const set = new Set();
    adminDepartments.forEach(d => {
      const name = typeof d === 'string' ? d : d?.name;
      if (name && String(name).trim()) set.add(String(name).trim());
    });
    classes.forEach(c => {
      if (c.dept && String(c.dept).trim()) set.add(String(c.dept).trim());
    });
    if (staffUser?.department && String(staffUser.department).trim()) {
      set.add(String(staffUser.department).trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [adminDepartments, classes, staffUser?.department]);

  const yearsList = ['1st Year', '2nd Year', '3rd Year'];

  const semestersList = useMemo(() => {
    const yr = String(filterYear || '').toLowerCase();
    if (yr.includes('1') || yr.includes('i')) return ['Semester 1', 'Semester 2'];
    if (yr.includes('2') || yr.includes('ii')) return ['Semester 3', 'Semester 4'];
    if (yr.includes('3') || yr.includes('iii')) return ['Semester 5', 'Semester 6'];
    return ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6'];
  }, [filterYear]);

  // Filtered classes matching Department, Year, Semester
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      // Dept filter
      if (filterDept && filterDept !== 'All') {
        const d = String(cls.dept || '').toLowerCase().trim();
        const target = filterDept.toLowerCase().trim();
        if (d !== target && !d.includes(target) && !target.includes(d)) return false;
      }
      // Year filter
      if (filterYear && filterYear !== 'All') {
        const getYearNum = (v) => {
          const str = String(v || '').toLowerCase();
          if (str.includes('3') || str.includes('iii')) return 3;
          if (str.includes('2') || str.includes('ii')) return 2;
          if (str.includes('1') || str.includes('i')) return 1;
          const m = str.match(/\d+/);
          return m ? parseInt(m[0], 10) : 0;
        };
        const clsYr = Number(cls.year) || 0;
        const targetYr = getYearNum(filterYear);
        if (targetYr && clsYr !== targetYr) return false;
      }
      // Sem filter
      if (filterSem && filterSem !== 'All') {
        const numS = Number(cls.semester) || 0;
        const numT = parseInt(String(filterSem).replace(/\D/g, ''), 10) || 0;
        if (numT && numS !== numT) return false;
      }
      return true;
    });
  }, [classes, filterDept, filterYear, filterSem]);

  // Active target subject to assign students to
  const activeAssignClass = useMemo(() => {
    if (targetSubjectToAssign) {
      return classes.find(c => c.code === targetSubjectToAssign) || null;
    }
    return filteredClasses.length > 0 ? filteredClasses[0] : (classes.length > 0 ? classes[0] : null);
  }, [classes, filteredClasses, targetSubjectToAssign]);

  // Enrolled student roll numbers in the currently active assign class
  const enrolledInActiveClassRolls = useMemo(() => {
    if (!activeAssignClass) return new Set();
    const students = activeAssignClass.students || activeAssignClass.enrolledStudents || [];
    return new Set(students.map(s => String(s.rollNo || '').toUpperCase().trim()));
  }, [activeAssignClass]);

  // Eligible students from registered students matching Department, Year, and Semester filters
  // Deduplicated: prefer students with rollNo set; use MongoDB _id as tiebreaker
  const eligibleStudentsToAssign = useMemo(() => {
    const filtered = registeredStudents.filter(s => {
      // Dept match
      if (filterDept && filterDept !== 'All') {
        const d = String(s.department || s.course || '').toLowerCase().trim();
        const target = filterDept.toLowerCase().trim();
        if (d !== target && !d.includes(target) && !target.includes(d)) return false;
      }
      // Year match
      if (filterYear && filterYear !== 'All') {
        const getYearNum = (v) => {
          const str = String(v || '').toLowerCase().trim();
          if (str.includes('3') || str.includes('iii') || str.startsWith('third')) return 3;
          if (str.includes('2') || str.includes('ii') || str.startsWith('second')) return 2;
          if (str.includes('1') || str.includes('i') || str.startsWith('first')) return 1;
          const m = str.match(/\d+/);
          return m ? parseInt(m[0], 10) : 0;
        };
        const yNum = getYearNum(s.year) || Math.ceil((parseInt(String(s.sem || s.semester || '').replace(/\D/g, ''), 10) || 0) / 2);
        const targetNum = getYearNum(filterYear);
        if (targetNum && yNum !== targetNum) return false;
      }
      // Sem match
      if (filterSem && filterSem !== 'All') {
        const numS = parseInt(String(s.sem || s.semester || '').replace(/\D/g, ''), 10) || 0;
        const numT = parseInt(String(filterSem).replace(/\D/g, ''), 10) || 0;
        if (numT && numS !== numT) return false;
      }
      // Search query inside student roster
      if (studentSearchQuery.trim()) {
        const q = studentSearchQuery.toLowerCase().trim();
        const r = String(s.rollNo || s.regNo || s.studentId || '').toLowerCase();
        const n = String(s.name || s.fullName || '').toLowerCase();
        if (!r.includes(q) && !n.includes(q)) return false;
      }
      return true;
    });

    // Deduplicate by rollNo — when two students share the same rollNo (data entry error),
    // prefer the one whose regNo/studentId matches the rollNo (i.e. the real match), else keep first.
    const seenRolls = new Map();
    const seenIds = new Set();
    const deduped = [];
    for (const s of filtered) {
      const roll = String(s.rollNo || '').toUpperCase().trim();
      const uid = String(s._id || s.studentId || s.regNo || '').trim();
      if (uid && seenIds.has(uid)) continue;
      if (uid) seenIds.add(uid);
      if (roll) {
        if (!seenRolls.has(roll)) {
          seenRolls.set(roll, deduped.length);
          deduped.push(s);
        } else {
          // If this student's regNo/studentId matches their rollNo, they are the "primary" owner — replace
          const prevIdx = seenRolls.get(roll);
          const prev = deduped[prevIdx];
          const prevMatch = (prev.regNo || prev.studentId || '').toUpperCase().trim() === roll;
          const thisMatch = (s.regNo || s.studentId || '').toUpperCase().trim() === roll;
          if (thisMatch && !prevMatch) {
            deduped[prevIdx] = s;
          }
          // else keep the previously-seen one, skip this duplicate
        }
      } else {
        deduped.push(s);
      }
    }
    return deduped;
  }, [registeredStudents, filterDept, filterYear, filterSem, studentSearchQuery]);

  const handleSelectAllEligible = () => {
    const unassigned = eligibleStudentsToAssign
      .filter(s => !enrolledInActiveClassRolls.has(String(s.rollNo || s.regNo || s.studentId || '').toUpperCase().trim()))
      .map(s => String(s.rollNo || s.regNo || s.studentId || '').toUpperCase().trim());
    setSelectedStudentsToAssign(new Set(unassigned));
  };

  const handleClearSelectedStudents = () => {
    setSelectedStudentsToAssign(new Set());
  };

  const handleToggleStudentSelect = (rollNo) => {
    const cleanRoll = String(rollNo || '').toUpperCase().trim();
    setSelectedStudentsToAssign(prev => {
      const next = new Set(prev);
      if (next.has(cleanRoll)) next.delete(cleanRoll);
      else next.add(cleanRoll);
      return next;
    });
  };

  // Bulk assign selected students to the active class
  const handleAssignSelectedStudentsToClass = async () => {
    if (!activeAssignClass) {
      alert('Please select or create a subject/class first.');
      return;
    }
    if (selectedStudentsToAssign.size === 0) {
      alert('Please select at least one student from the list to assign.');
      return;
    }

    const studentsToAssign = eligibleStudentsToAssign.filter(s =>
      selectedStudentsToAssign.has(String(s.rollNo || s.regNo || s.studentId || '').toUpperCase().trim()) &&
      !enrolledInActiveClassRolls.has(String(s.rollNo || s.regNo || s.studentId || '').toUpperCase().trim())
    );

    if (studentsToAssign.length === 0) {
      alert('All selected students are already enrolled in this class.');
      return;
    }

    setIsAssigningStudents(true);
    try {
      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}/${activeAssignClass.code}/bulk-enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          students: studentsToAssign.map(s => ({
            rollNo: s.rollNo || s.regNo || s.studentId,
            name: s.name || s.fullName || s.rollNo,
            phone: s.phone || '',
            email: s.email || ''
          }))
        })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Successfully assigned ${studentsToAssign.length} student(s) to ${activeAssignClass.code}!`);
        setSelectedStudentsToAssign(new Set());
        fetchClasses();
        fetchMarksheetForClass(activeAssignClass.code);
      } else {
        alert(data.message || 'Failed to assign students.');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setIsAssigningStudents(false);
    }
  };

  // Role-based visibility check for marks
  // Staff & HOD can always view and edit marks, even after submitting
  const canViewClassMarks = (approvalStatus) => {
    if (isSuperAdminUser) {
      return ['Pending MD', 'Approved'].includes(approvalStatus);
    }
    if (isAdminUser || isPrincipal) {
      return ['Pending Principal', 'Pending MD', 'Approved'].includes(approvalStatus);
    }
    // Staff and HOD can always view marks without locking
    return true;
  };

  const getClassRestrictedNotice = (approvalStatus) => {
    if (isStaffOnly) {
      return {
        badge: 'Submitted & Locked',
        title: 'Marksheet Submitted to HOD',
        desc: 'Marks have been submitted to the Head of Department (HOD) for review. As per exam guidelines, marks cannot be viewed or edited after submission.',
        stage: approvalStatus === 'Pending HOD' ? 'Awaiting HOD Review' : approvalStatus === 'Pending Principal' ? 'Forwarded to Admin' : 'Under Final Review',
        theme: 'bg-blue-50/90 border-blue-200 text-blue-900',
        badgeTheme: 'bg-blue-100 text-blue-800 border border-blue-300'
      };
    }
    if (isHod) {
      return {
        badge: 'Pending Staff Entry',
        title: 'Awaiting Staff Submission',
        desc: 'Marks are still being entered by the subject staff and have not been submitted to the HOD yet. HOD can only view marks after staff submission.',
        stage: 'Pending Staff Entry',
        theme: 'bg-amber-50/90 border-amber-200 text-amber-900',
        badgeTheme: 'bg-amber-100 text-amber-800 border border-amber-300'
      };
    }
    if (isAdminUser || isPrincipal) {
      return {
        badge: 'Pending HOD Approval',
        title: 'Awaiting HOD Submission',
        desc: 'Marks have not yet been approved and submitted by the HOD. Admin can only view marks after the HOD submits.',
        stage: approvalStatus === 'Pending HOD' ? 'With HOD for Review' : 'With Staff for Entry',
        theme: 'bg-amber-50/90 border-amber-200 text-amber-900',
        badgeTheme: 'bg-amber-100 text-amber-800 border border-amber-300'
      };
    }
    if (isSuperAdminUser) {
      return {
        badge: 'Pending Admin Approval',
        title: 'Awaiting Admin Submission',
        desc: 'Marks have not yet been approved and submitted by the Admin. Super Admin can only view marks after the Admin submits.',
        stage: approvalStatus === 'Pending Principal' ? 'With Admin for Review' : approvalStatus === 'Pending HOD' ? 'With HOD for Review' : 'With Staff for Entry',
        theme: 'bg-amber-50/90 border-amber-200 text-amber-900',
        badgeTheme: 'bg-amber-100 text-amber-800 border border-amber-300'
      };
    }
    return {
      badge: 'Access Restricted',
      title: 'Marks Unavailable at Current Stage',
      desc: 'You do not have permission to view marks at this approval stage.',
      stage: approvalStatus || 'Draft',
      theme: 'bg-slate-50 border-slate-200 text-slate-800',
      badgeTheme: 'bg-slate-100 text-slate-800 border border-slate-300'
    };
  };

  const handleMarkChange = (classCode, rollNo, field, val) => {
    setMarksheetData(prev => {
      const current = prev[classCode];
      if (!current) return prev;
      const updatedStudents = (current.students || []).map(s => {
        if (s.rollNo !== rollNo) return s;
        const numVal = val === '' ? null : val === 'AB' || val === 'A' ? 'AB' : Number(val);
        const upd = { ...s, [field]: numVal };
        if (field === 'it1') upd.cia1 = numVal;
        if (field === 'it2') upd.cia2 = numVal;
        // calculate consolidated
        const it1 = (upd.it1 === 'AB' || upd.it1 == null) ? 0 : Number(upd.it1) || 0;
        const it2 = (upd.it2 === 'AB' || upd.it2 == null) ? 0 : Number(upd.it2) || 0;
        const mod = (upd.model === 'AB' || upd.model == null) ? 0 : Number(upd.model) || 0;
        const asg = (upd.assignment == null) ? 0 : Number(upd.assignment) || 0;
        const scaledIT = ((it1 + it2) / 50) * 10;
        const scaledMod = (mod / 75) * 10;
        const scaledAsg = (asg / 20) * 5;
        upd.consolidated = Math.min(25, Math.round(scaledIT + scaledMod + scaledAsg));
        return upd;
      });
      return { ...prev, [classCode]: { ...current, students: updatedStudents } };
    });
  };

  const handleSaveMarks = async (classCode) => {
    const ms = marksheetData[classCode];
    if (!ms) return;
    const effectiveStaffId = staffUser?.staffId || 'EMP001';
    setSavingMarks(prev => ({ ...prev, [classCode]: true }));
    try {
      const res = await fetch(`${API_BASE}/internal-marks/${effectiveStaffId}/${encodeURIComponent(classCode)}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffName: staffUser?.name || '',
          subjectName: ms.subjectName || classCode,
          department: ms.department || staffUser?.department || '',
          year: ms.year || 'I Year',
          semester: ms.semester || 1,
          academicYear: staffUser?.academicYear || '2025-2026',
          students: ms.students || []
        })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Marks saved successfully for ${classCode}!`);
      } else {
        alert(data.message || 'Failed to save marks.');
      }
    } catch (err) {
      alert('Error saving marks: ' + err.message);
    } finally {
      setSavingMarks(prev => ({ ...prev, [classCode]: false }));
    }
  };

  const handleSubmitMarksToHod = async (classCode) => {
    const effectiveStaffId = staffUser?.staffId || 'EMP001';
    setProcessingApproval(prev => ({ ...prev, [classCode]: true }));
    try {
      await handleSaveMarks(classCode);
      const res = await fetch(`${API_BASE}/internal-marks/${effectiveStaffId}/${encodeURIComponent(classCode)}/submit-approval`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setMarksheetData(prev => ({
          ...prev,
          [classCode]: {
            ...(prev[classCode] || {}),
            approvalStatus: 'Pending HOD',
            currentApprovalStage: 'HOD',
            isLocked: false
          }
        }));
        showFeedback(`Marks for ${classCode} submitted to HOD! Marks remain accessible for edits.`);
      } else {
        alert(data.message || 'Failed to submit marks to HOD.');
      }
    } catch (err) {
      alert('Error submitting marks to HOD: ' + err.message);
    } finally {
      setProcessingApproval(prev => ({ ...prev, [classCode]: false }));
    }
  };

  const handleStageApproval = async (classCode, stage, action) => {
    const remarks = window.prompt(`Enter remarks for ${stage} ${action}:`, action === 'Approved' ? 'Verified and approved' : '');
    if (remarks === null) return;
    const effectiveStaffId = staffUser?.staffId || 'EMP001';
    setProcessingApproval(prev => ({ ...prev, [classCode]: true }));
    try {
      const res = await fetch(`${API_BASE}/internal-marks/${effectiveStaffId}/${encodeURIComponent(classCode)}/stage-approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage,
          action,
          approvedBy: staffUser?.name || stage,
          remarks: remarks || ''
        })
      });
      const data = await res.json();
      if (data.success) {
        setMarksheetData(prev => ({
          ...prev,
          [classCode]: data.data
        }));
        showFeedback(data.message);
      } else {
        alert(data.message || 'Stage approval failed.');
      }
    } catch (err) {
      alert('Error processing approval: ' + err.message);
    } finally {
      setProcessingApproval(prev => ({ ...prev, [classCode]: false }));
    }
  };

  // Handle selecting an already registered student
  const handleSelectRegisteredStudent = (roll) => {
    setSelectedRegisteredRoll(roll);
    setStudentError('');
    const found = registeredStudents.find(s => (s.rollNo || s.regNo || s.studentId) === roll);
    if (found) {
      setNewStudent({
        rollNo: found.rollNo || found.regNo || found.studentId || '',
        name: found.name || '',
        phone: found.phone || '',
        email: found.email || ''
      });
    }
  };

  // 1-Click Auto Enroll all matching department students
  const handleAutoEnrollDept = async (classCode) => {
    if (!classCode) return;
    try {
      setIsSubmittingStudent(true);
      setStudentError('');
      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}/${classCode}/auto-enroll`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message || `Students auto-enrolled successfully!`);
        fetchClasses();
        setEnrollingClassCode(null);
        setSelectedRegisteredRoll('');
      } else {
        setStudentError(data.message || 'Auto-enroll failed.');
      }
    } catch (err) {
      setStudentError('Network error: ' + err.message);
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  // Handle Add Class
  const handleCreateClass = async (e) => {
    e.preventDefault();
    setClassError('');
    if (!newClass.name.trim()) {
      setClassError('Please enter subject name.');
      return;
    }

    try {
      setIsSubmittingClass(true);
      const payload = {
        code: newClass.code.trim().toUpperCase(),
        name: newClass.name.trim(),
        dept: staffUser.department || 'General',
        semester: Number(newClass.semester),
        year: Number(newClass.year),
        section: (newClass.section || 'A').trim().toUpperCase(),
        credits: Number(newClass.credits) || 3,
        room: (newClass.room || '').trim(),
        staffId: staffUser.staffId,
        staffName: staffUser.name,
        students: []
      };

      const res = await fetch(`${API_BASE}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setClassError(data.message || 'Failed to add class.');
        return;
      }

      showFeedback(`Subject ${data.class.code} – "${data.class.name}" added successfully!`);
      setIsAddClassOpen(false);
      setNewClass({
        name: '',
        code: '',
        semester: 4,
        year: 2,
        section: 'A',
        credits: 3,
        room: ''
      });
      fetchClasses();
    } catch (err) {
      setClassError('Network error connecting to backend: ' + err.message);
    } finally {
      setIsSubmittingClass(false);
    }
  };

  // Handle Edit Class — open modal and pre-fill
  const openEditModal = (cls, e) => {
    e.stopPropagation();
    setEditError('');
    setEditForm({
      name: cls.name || '',
      section: cls.section || 'A',
      year: cls.year || 2,
      semester: cls.semester || 4,
      credits: cls.credits || 3,
      room: cls.room || '',
    });
    setEditingClass(cls);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!editForm.name.trim()) { setEditError('Subject name is required.'); return; }
    try {
      setIsSubmittingEdit(true);
      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}/${editingClass.code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          section: editForm.section.trim().toUpperCase(),
          year: Number(editForm.year),
          semester: Number(editForm.semester),
          credits: Number(editForm.credits),
          room: editForm.room.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setEditError(data.message || 'Update failed.'); return; }
      showFeedback(`Class ${editingClass.code} updated successfully!`);
      setEditingClass(null);
      fetchClasses();
    } catch (err) {
      setEditError('Network error: ' + err.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Delete confirmation modal states
  const [classToDelete, setClassToDelete] = useState(null);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Trigger Delete Class Modal (Centered)
  const handleDeleteClass = (classCode, e) => {
    if (e) e.stopPropagation();
    setClassToDelete(classCode);
  };

  const executeDeleteClass = async () => {
    if (!classToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}/${classToDelete}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Class ${classToDelete} removed.`);
        fetchClasses();
        setClassToDelete(null);
      } else {
        alert(data.message || 'Failed to delete class.');
      }
    } catch (err) {
      alert('Error deleting class: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Enroll Student
  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    setStudentError('');
    if (!newStudent.rollNo.trim() || !newStudent.name.trim()) {
      setStudentError('Roll No and Student Name are required.');
      return;
    }

    try {
      setIsSubmittingStudent(true);
      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}/${enrollingClassCode}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setStudentError(data.message || 'Failed to enroll student.');
        return;
      }

      showFeedback(`Student ${data.student.name} enrolled in ${enrollingClassCode}!`);
      setEnrollingClassCode(null);
      setNewStudent({ rollNo: '', name: '', phone: '', email: '' });
      fetchClasses();
    } catch (err) {
      setStudentError('Network error: ' + err.message);
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  // Trigger Remove Student Modal (Centered)
  const handleRemoveStudent = (classCode, rollNo) => {
    setStudentToRemove({ classCode, rollNo });
  };

  const executeRemoveStudent = async () => {
    if (!studentToRemove) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}/${studentToRemove.classCode}/students/${studentToRemove.rollNo}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Student ${studentToRemove.rollNo} removed.`);
        fetchClasses();
        setStudentToRemove(null);
      } else {
        alert(data.message || 'Failed to remove student.');
      }
    } catch (err) {
      alert('Error removing student: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalStudentsCount = classes.reduce((sum, c) => {
    const list = c.students || c.enrolledStudents || [];
    return sum + list.length;
  }, 0);

  const totalCreditsCount = classes.reduce((sum, c) => sum + (c.credits || 3), 0);

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-5xl mx-auto">
      {/* Centered Feedback Popup */}
      {feedbackMsg && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none p-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-3 px-6 py-4 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl text-sm font-bold border border-slate-700 pointer-events-auto">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {isHod ? `${staffUser?.department || ''} Department � All Classes & Subjects` : 'My Classes & Subjects'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isHod ? 'Showing all subjects added by all staff in your department' : 'Manage your teaching subjects, assign students, and enter marks for examination approval'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setClassError('');
            setIsAddClassOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Subject / Class
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Subjects Added', value: classes.length, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Students', value: totalStudentsCount, icon: Users, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Credits', value: totalCreditsCount, icon: Layers, color: 'text-purple-600 bg-purple-50' },
        ].map(stat => (
          <div key={stat.label} className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section 1: Department, Year & Semester Subject-Side Filter & Student Assignment ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/20 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Subject Side Filters (Department • Year • Semester)
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Filter subjects and select students to assign them to your subject
                </p>
              </div>
            </div>

            {(filterDept !== 'All' || filterYear !== 'All' || filterSem !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setFilterDept('All');
                  setFilterYear('All');
                  setFilterSem('All');
                  setStudentSearchQuery('');
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <X className="w-3 h-3" /> Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Department Filter */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 tracking-wider mb-1">
                1. Department (Dep)
              </label>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
              >
                <option value="All">All Departments</option>
                {departmentsList.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 tracking-wider mb-1">
                2. Year (Yr)
              </label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
              >
                <option value="All">All Years</option>
                {yearsList.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Semester Filter */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 tracking-wider mb-1">
                3. Semester (Sem)
              </label>
              <select
                value={filterSem}
                onChange={(e) => setFilterSem(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
              >
                <option value="All">All Semesters</option>
                {semestersList.map(sem => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Section 2: Student Roster & Subject Assignment Panel ── */}
        <div className="rounded-xl border border-blue-200/90 bg-blue-50/30 p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Assign Subject to Filtered Students
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Select students from {filterDept !== 'All' ? filterDept : 'all departments'} ({filterYear !== 'All' ? filterYear : 'all years'} • {filterSem !== 'All' ? filterSem : 'all sems'}) to assign them to your subject
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAssignRoster(!showAssignRoster)}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
              >
                {showAssignRoster ? "Collapse Roster" : "Expand Roster"}
              </button>
            </div>
          </div>

          {showAssignRoster && (
            <div className="space-y-3">
              {/* Choose Target Subject & Quick Search */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-600 tracking-wider mb-1">
                    Select Target Subject to Assign
                  </label>
                  <select
                    value={targetSubjectToAssign || (activeAssignClass ? activeAssignClass.code : '')}
                    onChange={(e) => setTargetSubjectToAssign(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs cursor-pointer"
                  >
                    {filteredClasses.length === 0 && classes.length === 0 && (
                      <option value="">No subjects created yet — click Add Subject</option>
                    )}
                    {filteredClasses.length === 0 && classes.length > 0 && (
                      <option value="">-- No subjects match Dept/Yr/Sem filters --</option>
                    )}
                    {(filteredClasses.length > 0 ? filteredClasses : classes).map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name} ({c.dept || staffUser.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by student roll no or name..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                  />
                </div>
              </div>

              {/* Stats & Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-700">
                    Eligible: <span className="text-blue-600 font-bold">{eligibleStudentsToAssign.length}</span>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-emerald-700">
                    Enrolled: {eligibleStudentsToAssign.filter(s => enrolledInActiveClassRolls.has(String(s.rollNo || s.regNo || s.studentId || '').toUpperCase().trim())).length}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-500">
                    To Assign: {eligibleStudentsToAssign.filter(s => !enrolledInActiveClassRolls.has(String(s.rollNo || s.regNo || s.studentId || '').toUpperCase().trim())).length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllEligible}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-blue-600 cursor-pointer shadow-2xs"
                  >
                    Select All Unassigned
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelectedStudents}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 cursor-pointer shadow-2xs"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Eligible Students List Box */}
              {eligibleStudentsToAssign.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                  No registered students found matching Department: {filterDept}, Year: {filterYear}, Semester: {filterSem}.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-2xs">
                  {eligibleStudentsToAssign.map(st => {
                    const cleanRoll = String(st.rollNo || st.regNo || st.studentId || '').toUpperCase().trim();
                    const isEnrolled = enrolledInActiveClassRolls.has(cleanRoll);
                    const isSelected = selectedStudentsToAssign.has(cleanRoll);

                    return (
                      <div
                        key={st._id || cleanRoll}
                        onClick={() => {
                          if (!isEnrolled) handleToggleStudentSelect(cleanRoll);
                        }}
                        className={`flex items-center gap-3 px-3.5 py-2.5 transition-colors ${isEnrolled
                            ? 'bg-slate-50/70 text-slate-400 cursor-default'
                            : isSelected
                              ? 'bg-blue-50/60 cursor-pointer'
                              : 'hover:bg-slate-50/80 cursor-pointer'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isEnrolled || isSelected}
                          disabled={isEnrolled}
                          onChange={() => {
                            if (!isEnrolled) handleToggleStudentSelect(cleanRoll);
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                        />
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 flex-1 min-w-0">
                          <span className="font-mono font-bold text-xs text-slate-700 min-w-[140px] sm:w-44 shrink-0 select-all" title={cleanRoll}>
                            {cleanRoll}
                          </span>
                          <span className="font-extrabold text-xs text-slate-900 truncate">
                            {st.name || st.fullName}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 hidden sm:inline truncate max-w-[120px]">
                          {st.department || filterDept}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono hidden md:inline shrink-0">
                          {st.year || filterYear} • {st.sem || filterSem}
                        </span>

                        <div className="ml-auto flex items-center gap-2 shrink-0">
                          {isEnrolled ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3" /> Enrolled in Subject
                            </span>
                          ) : (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                              {isSelected ? 'Selected' : 'Click to Select'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Primary Assignment Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="text-xs text-slate-600 font-medium">
                  {selectedStudentsToAssign.size > 0 ? (
                    <span className="text-blue-700 font-bold">
                      {selectedStudentsToAssign.size} student(s) selected to assign to {activeAssignClass ? activeAssignClass.code : 'subject'}
                    </span>
                  ) : (
                    <span>Check unassigned students above to assign them to {activeAssignClass ? activeAssignClass.code : 'subject'}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAssignSelectedStudentsToClass}
                  disabled={selectedStudentsToAssign.size === 0 || !activeAssignClass || isAssigningStudents}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                >
                  {isAssigningStudents ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                  <span>Assign {selectedStudentsToAssign.size > 0 ? selectedStudentsToAssign.size : ''} Students to {activeAssignClass ? activeAssignClass.code : 'Subject'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Staff Classes List with Enrolled Students & Marks Entry ── */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-bold">Loading classes...</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        /* Empty State */
        <div className="p-10 sm:p-14 text-center bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {classes.length === 0 ? 'No Subjects Added Yet' : 'No Subjects Match Filters'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {classes.length === 0
                ? 'You have not added any subjects or classes to your profile. Click below to add your first subject and enroll your students.'
                : 'No classes match your selected Department, Year, and Semester filter. Try resetting filters or add a new subject.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setClassError('');
              setIsAddClassOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Subject / Class
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClasses.map((cls) => {
            const enrolledStudents = cls.students || cls.enrolledStudents || [];
            const isExpanded = expandedSubject === cls.code;
            const ms = marksheetData[cls.code] || null;
            const msStatus = ms?.approvalStatus || 'Draft';
            const isCanViewMarks = canViewClassMarks(msStatus);
            const activeTab = classActiveTab[cls.code] || 'students';
            const isLockedMarks = ms?.isLocked || false;

            return (
              <div key={cls.code || cls._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                  onClick={() => setExpandedSubject(isExpanded ? null : cls.code)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        {cls.code}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                        {cls.dept || staffUser.department}
                      </span>
                      {ms && (
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${msStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            msStatus.includes('Pending') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                          {msStatus}
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{cls.name}</h3>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" /> Year {cls.year} · Sem {cls.semester} · Sec {cls.section || 'A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {enrolledStudents.length} students
                      </span>
                      <span className="flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" /> {cls.credits || 3} credits
                      </span>
                      {cls.room && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3.5 h-3.5" /> {cls.room}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      title="Enroll a student"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStudentError('');
                        setEnrollingClassCode(cls.code);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      title="Edit class details"
                      onClick={(e) => openEditModal(cls, e)}
                      className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      title="Delete class"
                      onClick={(e) => handleDeleteClass(cls.code, e)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="p-1 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details: Tab between Enrolled Students & Marks Entry */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {/* Inner Tabs */}
                    <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setClassActiveTab(prev => ({ ...prev, [cls.code]: 'students' }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'students'
                              ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                              : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                          👥 Enrolled Students ({enrolledStudents.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setClassActiveTab(prev => ({ ...prev, [cls.code]: 'marks' }));
                            if (!marksheetData[cls.code]) fetchMarksheetForClass(cls.code);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'marks'
                              ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                              : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Marks & Stage Approval</span>
                          {msStatus !== 'Draft' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800">
                              {msStatus}
                            </span>
                          )}
                        </button>
                      </div>

                      {activeTab === 'students' && (
                        <button
                          type="button"
                          onClick={() => {
                            setStudentError('');
                            setEnrollingClassCode(cls.code);
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 hover:border-blue-500 text-blue-600 text-[11px] font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Enroll Student
                        </button>
                      )}
                    </div>

                    {/* Content 1: Enrolled Students List */}
                    {activeTab === 'students' && (
                      enrolledStudents.length === 0 ? (
                        <div className="p-8 text-center bg-white space-y-2">
                          <p className="text-xs text-slate-400 font-semibold">
                            No students enrolled in this class yet.
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Use the Subject Side Filter above to select and assign students directly, or click below.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setStudentError('');
                              setEnrollingClassCode(cls.code);
                            }}
                            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            + Enroll student now
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="text-left px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider w-8">#</th>
                                <th className="text-left px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Roll No.</th>
                                <th className="text-left px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                                <th className="text-left px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                                <th className="text-right px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider w-16">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {enrolledStudents.map((stu, idx) => (
                                <tr key={stu.rollNo || idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-5 py-2.5 text-slate-400 font-medium">{idx + 1}</td>
                                  <td className="px-5 py-2.5 font-bold text-slate-700">{stu.rollNo}</td>
                                  <td className="px-5 py-2.5 font-semibold text-slate-900">{stu.name}</td>
                                  <td className="px-5 py-2.5 text-slate-500 hidden sm:table-cell">{stu.phone || '—'}</td>
                                  <td className="px-5 py-2.5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveStudent(cls.code, stu.rollNo)}
                                      title="Remove student"
                                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    )}

                    {/* Content 2: Marks Entry & Multi-Tier Approval Workflow */}
                    {activeTab === 'marks' && (
                      <div className="p-4 sm:p-5 bg-white space-y-4">
                        {loadingMarks[cls.code] ? (
                          <div className="py-10 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <span>Loading marks register for {cls.code}...</span>
                          </div>
                        ) : !isCanViewMarks ? (
                          /* Role-based Visibility Guard: Marks hidden until preceding stage submits */
                          (() => {
                            const notice = getClassRestrictedNotice(msStatus);
                            return (
                              <div className={`p-6 sm:p-8 rounded-2xl border text-center space-y-3 ${notice.theme}`}>
                                <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center mx-auto">
                                  <Lock className="w-6 h-6 text-slate-700" />
                                </div>
                                <span className={`inline-block text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full ${notice.badgeTheme}`}>
                                  {notice.badge}
                                </span>
                                <h4 className="text-base font-extrabold text-slate-900">{notice.title}</h4>
                                <p className="text-xs text-slate-600 max-w-md mx-auto">{notice.desc}</p>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/90 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Stage: <b>{notice.stage}</b></span>
                                  <span>•</span>
                                  <span>Status: <b>{msStatus}</b></span>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          /* Marks View & Actions */
                          <div className="space-y-4">
                            {/* Actions Header */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                              <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                                  Internal Assessment Register — {cls.code}
                                </h4>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  Enter IT-1 (25), IT-2 (25), Model Exam (75), and Assignments (20)
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {/* Staff & HOD Actions: Always allow saving marks even after submitting */}
                                {(isStaffOnly || isHod) && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={savingMarks[cls.code]}
                                      onClick={() => handleSaveMarks(cls.code)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                                    >
                                      {savingMarks[cls.code] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                      <span>Save Marks</span>
                                    </button>
                                    {isStaffOnly && !isHod ? (
                                     <button
                                       type="button"
                                       disabled={processingApproval[cls.code] || (ms?.students || []).length === 0}
                                       onClick={() => handleSubmitMarksToHod(cls.code)}
                                       className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                                       title="Submit marksheet to the HOD for verification"
                                     >
                                       {processingApproval[cls.code] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                       <span>{msStatus && msStatus !== 'Draft' ? 'Update & Re-Submit' : 'Submit to HOD'}</span>
                                     </button>
                                   ) : null}
                                  </>
                                )}

                                {/* HOD Actions (stays visible after clicking & popup) */}
                                 {isHod && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={processingApproval[cls.code]}
                                      onClick={() => handleStageApproval(cls.code, 'HOD', 'Rejected')}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" /> Return to Staff
                                    </button>
                                    <button
                                      type="button"
                                      disabled={processingApproval[cls.code]}
                                      onClick={() => handleStageApproval(cls.code, 'HOD', 'Approved')}
                                       className={`flex items-center gap-1.5 px-3.5 py-1.5 ${['Pending Principal', 'Pending MD', 'Approved'].includes(msStatus) ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer`}
                                     >
                                       {processingApproval[cls.code] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                       <span>{['Pending Principal', 'Pending MD', 'Approved'].includes(msStatus) ? 'Submitted to Admin' : 'Submit to Admin'}</span>
                                    </button>
                                  </>
                                )}

                                {/* Admin Actions */}
                                {(isAdminUser || isPrincipal) && msStatus === 'Pending Principal' && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={processingApproval[cls.code]}
                                      onClick={() => handleStageApproval(cls.code, 'Principal', 'Rejected')}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" /> Return to HOD
                                    </button>
                                    <button
                                      type="button"
                                      disabled={processingApproval[cls.code]}
                                      onClick={() => handleStageApproval(cls.code, 'Principal', 'Approved')}
                                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                                    >
                                      {processingApproval[cls.code] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                      <span>Approve & Submit to Super Admin</span>
                                    </button>
                                  </>
                                )}

                                {/* Super Admin Actions */}
                                {isSuperAdminUser && msStatus === 'Pending MD' && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={processingApproval[cls.code]}
                                      onClick={() => handleStageApproval(cls.code, 'MD', 'Rejected')}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" /> Return to Admin
                                    </button>
                                    <button
                                      type="button"
                                      disabled={processingApproval[cls.code]}
                                      onClick={() => handleStageApproval(cls.code, 'MD', 'Approved')}
                                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                                    >
                                      {processingApproval[cls.code] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                      <span>Final Approve & Publish</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Marks Entry Table */}
                            {(!ms?.students || ms.students.length === 0) ? (
                              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-400">
                                No students found in this marksheet register. Assign students to this subject above first.
                              </div>
                            ) : (
                              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px]">
                                      <th className="px-3 py-2 text-center w-8">#</th>
                                      <th className="px-4 py-2 text-left min-w-[150px]">Student</th>
                                      <th className="px-2 py-2 text-center">Internal 1 (25)</th>
                                      <th className="px-2 py-2 text-center">Internal 2 (25)</th>
                                      <th className="px-2 py-2 text-center">Model (75)</th>
                                      <th className="px-2 py-2 text-center">Assignment (20)</th>
                                      <th className="px-3 py-2 text-center bg-blue-50 text-blue-900 font-black">Final CIA (25)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {(ms.students || []).map((st, idx) => {
                                      const it1Val = st.it1 !== null && st.it1 !== undefined ? st.it1 : st.cia1;
                                      const it2Val = st.it2 !== null && st.it2 !== undefined ? st.it2 : st.cia2;
                                      const isEditable = (isStaffOnly || isHod);

                                      return (
                                        <tr key={st.rollNo || idx} className="hover:bg-blue-50/30">
                                          <td className="px-3 py-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                                          <td className="px-4 py-2 text-left">
                                            <div className="font-extrabold text-slate-900">{st.name}</div>
                                            <div className="text-[10px] font-mono font-bold text-slate-400">{st.rollNo}</div>
                                          </td>
                                          <td className="px-2 py-2 text-center">
                                            <input
                                              type="text"
                                              disabled={!isEditable}
                                              value={it1Val !== null && it1Val !== undefined ? it1Val : ''}
                                              onChange={(e) => handleMarkChange(cls.code, st.rollNo, 'it1', e.target.value)}
                                              className="w-12 text-center py-1 bg-white border border-slate-200 rounded-md font-bold text-xs disabled:bg-slate-50 disabled:cursor-not-allowed"
                                              placeholder="-"
                                            />
                                          </td>
                                          <td className="px-2 py-2 text-center">
                                            <input
                                              type="text"
                                              disabled={!isEditable}
                                              value={it2Val !== null && it2Val !== undefined ? it2Val : ''}
                                              onChange={(e) => handleMarkChange(cls.code, st.rollNo, 'it2', e.target.value)}
                                              className="w-12 text-center py-1 bg-white border border-slate-200 rounded-md font-bold text-xs disabled:bg-slate-50 disabled:cursor-not-allowed"
                                              placeholder="-"
                                            />
                                          </td>
                                          <td className="px-2 py-2 text-center">
                                            <input
                                              type="text"
                                              disabled={!isEditable}
                                              value={st.model !== null && st.model !== undefined ? st.model : ''}
                                              onChange={(e) => handleMarkChange(cls.code, st.rollNo, 'model', e.target.value)}
                                              className="w-12 text-center py-1 bg-white border border-slate-200 rounded-md font-bold text-xs disabled:bg-slate-50 disabled:cursor-not-allowed"
                                              placeholder="-"
                                            />
                                          </td>
                                          <td className="px-2 py-2 text-center">
                                            <input
                                              type="text"
                                              disabled={!isEditable}
                                              value={st.assignment !== null && st.assignment !== undefined ? st.assignment : ''}
                                              onChange={(e) => handleMarkChange(cls.code, st.rollNo, 'assignment', e.target.value)}
                                              className="w-12 text-center py-1 bg-white border border-slate-200 rounded-md font-bold text-xs disabled:bg-slate-50 disabled:cursor-not-allowed"
                                              placeholder="-"
                                            />
                                          </td>
                                          <td className="px-3 py-2 text-center bg-blue-50/50 font-black text-xs text-blue-900">
                                            <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 font-extrabold">
                                              {st.consolidated ?? '-'}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: ADD SUBJECT / CLASS */}
      {/* ============================================================ */}
      {isAddClassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 sm:p-7 max-w-md w-full space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Add New Subject</h3>
                  <p className="text-xs text-slate-500">Saves directly to your academic class records</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddClassOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {classError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{classError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Computing & Distributed Systems"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    placeholder="e.g. CS401 (optional)"
                    value={newClass.code}
                    onChange={(e) => setNewClass({ ...newClass, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold uppercase text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    placeholder="A"
                    value={newClass.section}
                    onChange={(e) => setNewClass({ ...newClass, section: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Year</label>
                  <select
                    value={newClass.year}
                    onChange={(e) => setNewClass({ ...newClass, year: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                  <select
                    value={newClass.semester}
                    onChange={(e) => setNewClass({ ...newClass, semester: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    {[1, 2, 3, 4, 5, 6].map(s => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newClass.credits}
                    onChange={(e) => setNewClass({ ...newClass, credits: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Classroom / Lab Venue (Optional)
                  <span className="ml-1 text-[11px] font-normal text-slate-400">— Type your college room or lab</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 204, Lecture Hall 1, Computer Lab 2, Physics Lab"
                  value={newClass.room}
                  onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 transition-all"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddClassOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClass}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {isSubmittingClass ? 'Saving...' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: EDIT CLASS */}
      {/* ============================================================ */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 sm:p-7 max-w-md w-full space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Edit Class Details</h3>
                  <p className="text-xs text-blue-600 font-bold">{editingClass.code} — {editingClass.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subject Code
                  <span className="ml-2 text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">Read-only</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={editingClass.code}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-extrabold text-slate-500 cursor-not-allowed tracking-wider uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    value={editForm.section}
                    onChange={(e) => setEditForm({ ...editForm, section: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editForm.credits}
                    onChange={(e) => setEditForm({ ...editForm, credits: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Year</label>
                  <select
                    value={editForm.year}
                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                  >
                    {[1, 2, 3].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                  <select
                    value={editForm.semester}
                    onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Classroom / Lab Venue (Optional)
                  <span className="ml-1 text-[11px] font-normal text-slate-400">— Type your college room or lab</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 204, Lecture Hall 1, Computer Lab 2, Physics Lab"
                  value={editForm.room}
                  onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md shadow-amber-400/30 disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: ENROLL STUDENT */}
      {/* ============================================================ */}
      {enrollingClassCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-md w-full space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Enroll Student into Subject</h3>
                <p className="text-[11px] text-blue-600 font-bold">Class: {enrollingClassCode}</p>
              </div>
              <button
                type="button"
                onClick={() => { setEnrollingClassCode(null); setSelectedRegisteredRoll(''); }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 1-Click Auto Enroll Action Banner */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex items-center justify-between gap-2">
              <div>
                <p className="text-[11.5px] font-extrabold text-blue-950">⚡ 1-Click Auto Enroll</p>
                <p className="text-[10px] text-blue-800">Enroll all registered department students automatically.</p>
              </div>
              <button
                type="button"
                disabled={isSubmittingStudent}
                onClick={() => handleAutoEnrollDept(enrollingClassCode)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shrink-0 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                Auto-Enroll All
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setEnrollMode('select')}
                className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${enrollMode === 'select'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                ✓ Pick Existing Student ({registeredStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setEnrollMode('manual')}
                className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${enrollMode === 'manual'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                + Manual Entry
              </button>
            </div>

            {studentError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-semibold">
                {studentError}
              </div>
            )}

            <form onSubmit={handleEnrollStudent} className="space-y-3">
              {enrollMode === 'select' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Select Registered Student <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedRegisteredRoll}
                    onChange={(e) => handleSelectRegisteredStudent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="">-- Choose a registered student --</option>
                    {registeredStudents.map(st => {
                      const roll = st.rollNo || st.regNo || st.studentId;
                      return (
                        <option key={st._id || roll} value={roll}>
                          {roll} — {st.name} ({st.department || st.course || 'Dept'})
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Selecting a student automatically pulls their credentials without re-entering anything.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Roll Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 21CS001"
                  value={newStudent.rollNo}
                  onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="9876543210"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setEnrollingClassCode(null); setSelectedRegisteredRoll(''); }}
                  className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStudent || !newStudent.rollNo || !newStudent.name}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingStudent ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Centered Modal: Confirm Delete Class */}
      {classToDelete && (
        <ModalPortal isOpen={Boolean(classToDelete)} onClose={() => !isDeleting && setClassToDelete(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 my-auto text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Delete Class Confirmation</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to delete class <strong className="text-slate-800 font-mono font-bold">{classToDelete}</strong>? This will remove it from your active class schedule.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setClassToDelete(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDeleteClass}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Class'}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Centered Modal: Confirm Remove Student */}
      {studentToRemove && (
        <ModalPortal isOpen={Boolean(studentToRemove)} onClose={() => !isDeleting && setStudentToRemove(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 my-auto text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Remove Student from Class</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to remove roll no <strong className="text-slate-800 font-mono font-bold">{studentToRemove.rollNo}</strong> from class <strong className="text-slate-800 font-mono">{studentToRemove.classCode}</strong>?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setStudentToRemove(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeRemoveStudent}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                {isDeleting ? 'Removing...' : 'Remove Student'}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
