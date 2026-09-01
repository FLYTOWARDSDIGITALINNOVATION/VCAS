import React, { useState, useMemo } from 'react';
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
  CheckSquare
} from 'lucide-react';

const DEPARTMENTS = [
  'All Departments',
  'Computer Science',
  'Electronics',
  'MBA',
  'Mechanical',
  'Civil',
  'BCA'
];

const INITIAL_ASSIGNMENTS = [
  {
    id: 1,
    title: 'B+ Tree Indexing & SQL Query Optimization',
    code: 'CS401',
    subject: 'Database Management Systems',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    faculty: 'Dr. Sunita Rao (HOD)',
    dueDate: '2026-09-15',
    dueTime: '11:59 PM',
    maxMarks: 25,
    weightage: '10% CIA',
    totalStudents: 60,
    submittedCount: 56,
    gradedCount: 52,
    status: 'Active',
    description: 'Implement B+ Tree index simulation and analyze query execution plan cost for joins on 100k records.',
    attachedDoc: 'CS401_Assignment_1_Guidelines.pdf',
    type: 'Practical & Theory'
  },
  {
    id: 2,
    title: 'Neural Networks & Deep Learning CNN Architecture for Image Classification',
    code: 'CS502',
    subject: 'AI & Machine Learning',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    faculty: 'Prof. Arvind Menon',
    dueDate: '2026-09-18',
    dueTime: '05:00 PM',
    maxMarks: 25,
    weightage: '10% CIA',
    totalStudents: 60,
    submittedCount: 48,
    gradedCount: 30,
    status: 'Active',
    description: 'Build a Convolutional Neural Network (CNN) in PyTorch/TensorFlow for CIFAR-10 classification with >85% test accuracy.',
    attachedDoc: 'CS502_CNN_Project_Brief.pdf',
    type: 'Code & Report'
  },
  {
    id: 3,
    title: 'CPU Scheduling & Memory Paging Algorithms Case Study',
    code: 'CS501',
    subject: 'Operating Systems',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    faculty: 'Dr. Neeraj Gupta',
    dueDate: '2026-09-10',
    dueTime: '11:59 PM',
    maxMarks: 20,
    weightage: '5% CIA',
    totalStudents: 60,
    submittedCount: 60,
    gradedCount: 60,
    status: 'Completed',
    description: 'Comparative analysis of Round Robin, Multilevel Feedback Queue, and LRU Page Replacement in Linux Kernel.',
    attachedDoc: 'CS501_OS_Assignment.pdf',
    type: 'Research Report'
  },
  {
    id: 4,
    title: 'Operational Amplifiers & Filter Design Simulation in SPICE',
    code: 'EC201',
    subject: 'Electronic Circuits & Design',
    department: 'Electronics',
    year: 2,
    sem: 'Sem 3',
    faculty: 'Prof. Ramesh Kumar',
    dueDate: '2026-09-20',
    dueTime: '11:59 PM',
    maxMarks: 25,
    weightage: '10% CIA',
    totalStudents: 55,
    submittedCount: 42,
    gradedCount: 20,
    status: 'Active',
    description: 'Design a 4th-order Butterworth Low-Pass Filter with 10kHz cut-off frequency using LTSpice simulation.',
    attachedDoc: 'EC201_OpAmp_Design.pdf',
    type: 'Simulation'
  },
  {
    id: 5,
    title: 'Strategic Corporate Leadership & Business Valuation Case Study',
    code: 'MB101',
    subject: 'Principles of Management',
    department: 'MBA',
    year: 1,
    sem: 'Sem 1',
    faculty: 'Dr. Anita Desai',
    dueDate: '2026-09-16',
    dueTime: '06:00 PM',
    maxMarks: 50,
    weightage: '15% CIA',
    totalStudents: 45,
    submittedCount: 44,
    gradedCount: 40,
    status: 'Active',
    description: 'Comprehensive financial and organizational turnaround analysis of Tata Motors and EV transformation.',
    attachedDoc: 'MB101_CaseStudy_Brief.pdf',
    type: 'Case Study'
  },
  {
    id: 6,
    title: 'Finite Element Analysis (FEA) of Cantilever Structural Beam',
    code: 'ME401',
    subject: 'CAD/CAM Modeling & Robotics',
    department: 'Mechanical',
    year: 3,
    sem: 'Sem 5',
    faculty: 'Dr. Pradeep Joshi',
    dueDate: '2026-09-22',
    dueTime: '11:59 PM',
    maxMarks: 25,
    weightage: '10% CIA',
    totalStudents: 50,
    submittedCount: 35,
    gradedCount: 15,
    status: 'Active',
    description: 'Stress distribution and thermal load simulation on structural aerospace alloy using ANSYS Mechanical.',
    attachedDoc: 'ME401_FEA_Guidance.pdf',
    type: 'Engineering Simulation'
  }
];

const INITIAL_SUBMISSIONS = [
  {
    id: 101,
    assignmentId: 1,
    studentName: 'Aadhavan Kumar',
    rollNo: '22CS001',
    regNo: '710022104001',
    department: 'Computer Science',
    submittedAt: '2026-09-02 04:30 PM',
    fileName: '22CS001_Aadhavan_BTree_Assignment.pdf',
    fileSize: '2.4 MB',
    plagiarism: 3,
    status: 'Graded',
    marksAwarded: 24,
    maxMarks: 25,
    feedback: 'Excellent implementation of B+ Tree splitting and query indexing diagrams. Great job!'
  },
  {
    id: 102,
    assignmentId: 1,
    studentName: 'Abinaya Sundaram',
    rollNo: '22CS002',
    regNo: '710022104002',
    department: 'Computer Science',
    submittedAt: '2026-09-02 06:15 PM',
    fileName: '22CS002_Abinaya_DBMS_Task.pdf',
    fileSize: '1.9 MB',
    plagiarism: 5,
    status: 'Graded',
    marksAwarded: 23,
    maxMarks: 25,
    feedback: 'Very thorough SQL cost execution plan. Good explanations.'
  },
  {
    id: 103,
    assignmentId: 1,
    studentName: 'Deepika Ramanathan',
    rollNo: '22CS004',
    regNo: '710022104004',
    department: 'Computer Science',
    submittedAt: '2026-09-01 09:10 PM',
    fileName: '22CS004_Deepika_BPlusTree_Complete.pdf',
    fileSize: '3.1 MB',
    plagiarism: 2,
    status: 'Graded',
    marksAwarded: 25,
    maxMarks: 25,
    feedback: 'Outstanding submission! Clean code, complete test cases, and comprehensive report.'
  },
  {
    id: 104,
    assignmentId: 1,
    studentName: 'Harini Jayaraman',
    rollNo: '22CS006',
    regNo: '710022104006',
    department: 'Computer Science',
    submittedAt: '2026-09-03 11:20 AM',
    fileName: '22CS006_Harini_Database_Indexing.pdf',
    fileSize: '2.1 MB',
    plagiarism: 4,
    status: 'Graded',
    marksAwarded: 22,
    maxMarks: 25,
    feedback: 'Good work on indexing structures. Include more benchmarks next time.'
  },
  {
    id: 105,
    assignmentId: 1,
    studentName: 'Balaji Venkatesh',
    rollNo: '22CS003',
    regNo: '710022104003',
    department: 'Computer Science',
    submittedAt: '2026-09-04 02:45 PM',
    fileName: '22CS003_Balaji_BTree.pdf',
    fileSize: '1.2 MB',
    plagiarism: 12,
    status: 'Submitted (Pending Review)',
    marksAwarded: 0,
    maxMarks: 25,
    feedback: ''
  },
  {
    id: 106,
    assignmentId: 1,
    studentName: 'Dinesh Karthik',
    rollNo: '22CS005',
    regNo: '710022104005',
    department: 'Computer Science',
    submittedAt: '--',
    fileName: '--',
    fileSize: '--',
    plagiarism: 0,
    status: 'Not Submitted (Overdue)',
    marksAwarded: 0,
    maxMarks: 25,
    feedback: 'Pending submission'
  }
];

export default function AssignmentManagement() {
  // Tabs: 'assignments', 'submissions', 'analytics'
  const [activeTab, setActiveTab] = useState('assignments');

  // State
  const [assignmentsList, setAssignmentsList] = useState(INITIAL_ASSIGNMENTS);
  const [submissionsList, setSubmissionsList] = useState(INITIAL_SUBMISSIONS);

  // Selected Assignment for Submissions view
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(1);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals State
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // New Assignment Form State
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    code: 'CS505',
    subject: 'Cloud Computing & DevOps',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    faculty: 'Dr. Sunita Rao (HOD)',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueTime: '11:59 PM',
    maxMarks: 25,
    weightage: '10% CIA',
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

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    return assignmentsList.filter(a => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        a.title.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.subject.toLowerCase().includes(q) ||
        a.faculty.toLowerCase().includes(q)
      );

      const matchesDept = selectedDept === 'All Departments' || a.department === selectedDept;
      const matchesStatus = selectedStatus === 'ALL' || a.status === selectedStatus;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [assignmentsList, searchQuery, selectedDept, selectedStatus]);

  // Selected Assignment Details
  const currentAssignment = useMemo(() => {
    return assignmentsList.find(a => a.id === selectedAssignmentId) || assignmentsList[0];
  }, [assignmentsList, selectedAssignmentId]);

  // Submissions for Selected Assignment
  const currentSubmissions = useMemo(() => {
    return submissionsList.filter(s => s.assignmentId === selectedAssignmentId);
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

  // Save New Assignment
  const handleSaveAssignment = (e) => {
    e.preventDefault();
    if (!assignmentForm.title.trim()) {
      alert('Please enter Assignment Title');
      return;
    }

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
    setIsAddAssignmentOpen(false);
    setAssignmentForm({
      title: '',
      code: 'CS505',
      subject: 'Cloud Computing & DevOps',
      department: 'Computer Science',
      year: 3,
      sem: 'Sem 5',
      faculty: 'Dr. Sunita Rao (HOD)',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dueTime: '11:59 PM',
      maxMarks: 25,
      weightage: '10% CIA',
      description: '',
      type: 'Code & Report'
    });
    showToast('New Assignment published successfully to student portal!');
  };

  // Open Grading Modal
  const handleOpenGrading = (sub) => {
    setGradingSubmission(sub);
    setGradeInput(sub.marksAwarded || 20);
    setFeedbackInput(sub.feedback || 'Good attempt. Check comments on code efficiency.');
  };

  // Save Grade
  const handleSaveGrade = (e) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    setSubmissionsList(prev => prev.map(s => {
      if (s.id === gradingSubmission.id) {
        return {
          ...s,
          marksAwarded: Number(gradeInput),
          feedback: feedbackInput,
          status: 'Graded'
        };
      }
      return s;
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans animate-fadeIn">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
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
          <button
            onClick={handleExportSubmissionsCSV}
            title="Download CSV Submissions"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Submissions</span>
          </button>

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
            <p className="text-[11px] text-emerald-600 font-bold mt-1">91.2% Submission Rate</p>
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
            <p className="text-2xl font-black text-indigo-600">89.4%</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">22.4 / 25 Marks Avg</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Overdue Students</span>
            <p className="text-2xl font-black text-rose-600">14</p>
            <p className="text-[11px] text-rose-600 font-bold mt-1">Defaulters Alert</p>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  {DEPARTMENTS.map(d => (
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
                  <option value="Completed">Completed & Graded</option>
                </select>
              </div>
            </div>
          </div>

          {/* Assignments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredAssignments.map((a) => {
              const submissionRate = ((a.submittedCount / a.totalStudents) * 100).toFixed(0);
              return (
                <div 
                  key={a.id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all group"
                >
                  <div>
                    {/* Top Row Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                          {a.code}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {a.department} • {a.sem}
                        </span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        a.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {a.status}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                      {a.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Subject: <strong className="text-slate-800">{a.subject}</strong> • Faculty: <strong className="text-slate-800">{a.faculty}</strong>
                    </p>
                    <p className="text-xs text-slate-600 mt-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-100 line-clamp-2">
                      {a.description}
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

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {a.attachedDoc}
                      </span>

                      <button
                        onClick={() => {
                          setSelectedAssignmentId(a.id);
                          setActiveTab('submissions');
                        }}
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all flex items-center gap-1.5"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Grade Submissions</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 2: STUDENT SUBMISSIONS & GRADING DESK                               */}
      {/* ========================================================================= */}
      {activeTab === 'submissions' && (
        <div className="space-y-5">
          
          {/* Assignment Selector Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                Currently Grading Task:
              </span>
              <h3 className="font-extrabold text-base text-slate-900">
                {currentAssignment?.code} — {currentAssignment?.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {currentAssignment?.department} (Year {currentAssignment?.year} - {currentAssignment?.sem}) • Max: {currentAssignment?.maxMarks} Marks
              </p>
            </div>

            <div className="w-full md:w-80">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Switch Assignment</label>
              <select
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                {assignmentsList.map(a => (
                  <option key={a.id} value={a.id}>{a.code} - {a.title.substring(0, 35)}...</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">STUDENT ROLL & NAME</th>
                    <th className="py-4 px-4">SUBMITTED AT</th>
                    <th className="py-4 px-4">ATTACHMENT</th>
                    <th className="py-4 px-4 text-center">MARKS AWARDED</th>
                    <th className="py-4 px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {currentSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/50">
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

                      <td className="py-4 px-4 text-xs font-semibold text-slate-700">
                        {sub.submittedAt}
                      </td>

                      <td className="py-4 px-4">
                        {sub.fileName !== '--' ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-mono font-semibold">
                            <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                            <span className="truncate max-w-[180px]">{sub.fileName}</span>
                            <span className="text-[10px] text-slate-400">({sub.fileSize})</span>
                          </div>
                        ) : (
                          <span className="text-xs text-rose-500 font-semibold italic">No file submitted</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        {sub.status === 'Graded' ? (
                          <span className="font-black text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                            {sub.marksAwarded} / {sub.maxMarks}
                          </span>
                        ) : sub.status.includes('Not Submitted') ? (
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                            Not Submitted
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            Needs Grading
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        {sub.fileName !== '--' ? (
                          <button
                            onClick={() => handleOpenGrading(sub)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>{sub.status === 'Graded' ? 'Edit Grade' : 'Grade Now'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => showToast(`SMS Reminder sent to ${sub.studentName}!`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-all border border-rose-200"
                          >
                            <Send className="w-3 h-3" />
                            <span>Remind</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Create New Assignment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Publish a coursework homework task for students</p>
              </div>
              <button onClick={() => setIsAddAssignmentOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Assignment Title</label>
                <input
                  type="text"
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  placeholder="e.g. B-Tree Indexing and Query Optimization"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject Code</label>
                  <input
                    type="text"
                    value={assignmentForm.code}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, code: e.target.value })}
                    placeholder="CS401"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:bg-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Department</label>
                  <select
                    value={assignmentForm.department}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, department: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    {DEPARTMENTS.filter(d => d !== 'All Departments').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Max Marks</label>
                  <input
                    type="number"
                    value={assignmentForm.maxMarks}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, maxMarks: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Assignment Description & Instructions</label>
                <textarea
                  rows={3}
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  placeholder="Provide instructions, problem statement, or submission guidelines..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddAssignmentOpen(false)}
                  className="px-5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Publish Assignment
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: GRADE STUDENT SUBMISSION                                        */}
      {/* ========================================================================= */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Grade Student Submission</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {gradingSubmission.studentName} ({gradingSubmission.rollNo})
                </p>
              </div>
              <button onClick={() => setGradingSubmission(null)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document details */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-rose-500" />
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Awarded Marks (Out of {gradingSubmission.maxMarks})
                </label>
                <input
                  type="number"
                  max={gradingSubmission.maxMarks}
                  min={0}
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-emerald-600 focus:bg-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Faculty Feedback / Comments</label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Provide feedback on code quality, diagrams, or areas to improve..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Grade & Feedback</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
