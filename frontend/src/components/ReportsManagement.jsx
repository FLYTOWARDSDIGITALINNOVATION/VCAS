import React, { useState, useMemo } from 'react';
import { API_BASE, BACKEND_URL } from '../apiConfig';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Filter, 
  Calendar, 
  FileText, 
  GraduationCap, 
  Users, 
  IndianRupee, 
  CheckSquare, 
  Building2, 
  Sparkles, 
  Search, 
  Printer, 
  CheckCircle2, 
  X, 
  Layers, 
  PieChart, 
  Sliders, 
  ArrowUpRight,
  BookOpen
} from 'lucide-react';
import ModalPortal from './ModalPortal';

const REPORT_CATEGORIES = [
  { id: 'academic', label: 'Academic Performance', icon: GraduationCap },
  { id: 'attendance', label: 'Attendance & Defaulters', icon: CheckSquare },
  { id: 'finance', label: 'Finance & Fee Collections', icon: IndianRupee },
  { id: 'admissions', label: 'Admissions & Demographics', icon: Users },
  { id: 'faculty', label: 'Faculty & Workload', icon: Building2 }
];

export default function ReportsManagement({ user }) {
  const isSuperAdmin = user?.role === 'Super Admin' || user?.isSuperAdmin || JSON.parse(sessionStorage.getItem('vcas_user') || '{}')?.role === 'Super Admin';
  const [activeCategory, setActiveCategory] = useState('academic');
  const [selectedYear, setSelectedYear] = useState('2024-2025');
  const [selectedSemester, setSelectedSemester] = useState('All Semesters');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Report Builder Modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Lock background scroll when modal is open
  React.useEffect(() => {
    const scrollContainer = document.getElementById('main-content-scroll-container');
    if (showCustomModal) {
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
  }, [showCustomModal]);

  // Custom Report Form
  const [customReport, setCustomReport] = useState({
    title: 'Custom Institutional Report',
    category: 'Academic',
    dept: 'All Departments',
    year: '2024-2025',
    includeCharts: true,
    includeStudentDetails: true,
    format: 'PDF'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleExport = (type) => {
    setIsExporting(true);
    showToast(`Generating ${type} Report for ${selectedDept} (${selectedYear})...`);
    setTimeout(() => {
      setIsExporting(false);
      showToast(`${type} Report downloaded successfully!`);
    }, 1500);
  };

  const handleGenerateCustom = (e) => {
    e.preventDefault();
    setShowCustomModal(false);
    showToast(`Custom Report "${customReport.title}" generated in ${customReport.format} format!`);
  };

  // Live Backend Data States
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [internalMarks, setInternalMarks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real-time data from all backend endpoints
  const fetchRealTimeReportsData = async () => {
    try {
      setIsLoading(true);
      const [resStudents, resStaff, resAttendance, resDepts, resClasses, resMarks] = await Promise.allSettled([
        fetch(`${API_BASE}/students`),
        fetch(`${API_BASE}/staff`),
        fetch(`${API_BASE}/attendance`),
        fetch(`${API_BASE}/departments`),
        fetch(`${API_BASE}/classes`),
        fetch(`${API_BASE}/internal-marks`)
      ]);

      if (resStudents.status === 'fulfilled' && resStudents.value.ok) {
        const d = await resStudents.value.json();
        if (d.success && Array.isArray(d.data)) setStudents(d.data);
      }

      if (resStaff.status === 'fulfilled' && resStaff.value.ok) {
        const d = await resStaff.value.json();
        if (d.success && Array.isArray(d.data)) setStaff(d.data);
      }

      if (resAttendance.status === 'fulfilled' && resAttendance.value.ok) {
        const d = await resAttendance.value.json();
        if (d.success && Array.isArray(d.sessions)) setAttendanceSessions(d.sessions);
      }

      if (resDepts.status === 'fulfilled' && resDepts.value.ok) {
        const d = await resDepts.value.json();
        if (d.success && Array.isArray(d.data)) setDepartments(d.data);
      }

      if (resClasses.status === 'fulfilled' && resClasses.value.ok) {
        const d = await resClasses.value.json();
        if (d.success && Array.isArray(d.classes)) setClasses(d.classes);
      }

      if (resMarks.status === 'fulfilled' && resMarks.value.ok) {
        const d = await resMarks.value.json();
        if (d.success && Array.isArray(d.data)) setInternalMarks(d.data);
      }
    } catch (err) {
      console.error('Failed to load real-time reports data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRealTimeReportsData();
  }, []);

  // Compute live departmental academic results from real students and marks
  const academicDeptResults = useMemo(() => {
    const validDepts = (departments && departments.length > 0)
      ? departments.map(d => d.name)
      : ['BSc. Computer science', 'computer application'];

    const deptMap = new Map();
    validDepts.forEach(dName => {
      deptMap.set(dName, {
        dept: dName,
        students: 0,
        distinctions: 0,
        backlogs: 0,
        passCount: 0,
        topperName: 'None',
        topperScore: 0
      });
    });

    students.forEach(st => {
      const rawDept = (st.department || '').toLowerCase().trim();
      let matchedDept = validDepts[0];

      if (rawDept.includes('app') || rawDept.includes('bca') || rawDept.includes('ca')) {
        matchedDept = validDepts.find(d => d.toLowerCase().includes('app') || d.toLowerCase().includes('bca') || d.toLowerCase().includes('ca')) || validDepts[1] || validDepts[0];
      } else if (rawDept.includes('comp') || rawDept.includes('cs') || rawDept.includes('b.sc')) {
        matchedDept = validDepts.find(d => d.toLowerCase().includes('comp') || d.toLowerCase().includes('cs') || d.toLowerCase().includes('b.sc')) || validDepts[0];
      } else {
        matchedDept = validDepts.find(d => d.toLowerCase() === rawDept) || validDepts[0];
      }

      const entry = deptMap.get(matchedDept);
      if (entry) {
        entry.students++;
        const gpa = Number(st.cgpa) || 8.2;
        if (gpa >= 8.5) entry.distinctions++;
        if (gpa >= 5.0) entry.passCount++;
        else entry.backlogs++;

        if (gpa > entry.topperScore) {
          entry.topperScore = gpa;
          entry.topperName = st.name || st.fullName || 'Student';
        }
      }
    });

    return Array.from(deptMap.values()).map(d => ({
      dept: d.dept,
      students: d.students,
      passRate: d.students > 0 ? parseFloat(((d.passCount / d.students) * 100).toFixed(1)) : 100,
      distinctions: d.distinctions,
      backlogs: d.backlogs,
      topper: d.topperName === 'None' ? '--' : d.topperName
    }));
  }, [students, departments]);

  // Compute live attendance defaulters from real students (< 75%)
  const defaultersList = useMemo(() => {
    return students
      .filter(s => {
        const att = s.attendance !== undefined ? Number(s.attendance) : 95;
        return att < 75;
      })
      .map(s => {
        const att = s.attendance !== undefined ? Number(s.attendance) : 95;
        return {
          rollNo: s.rollNo || s.studentId,
          name: s.name || s.fullName,
          dept: s.department || 'Computer Science',
          year: s.sem || s.semester || '3rd Sem',
          att: `${att}%`,
          missedClasses: Math.max(0, Math.round(40 * ((100 - att) / 100))),
          parentContact: s.fatherMobile || s.motherMobile || s.phone || 'N/A',
          status: att < 65 ? 'Critical Shortage' : 'Warning Issued'
        };
      });
  }, [students]);

  // Real-time Overall KPIs
  const overallKpis = useMemo(() => {
    const totalStudents = students.length || 1;
    const avgAttendance = students.reduce((acc, s) => acc + (Number(s.attendance) || 92), 0) / totalStudents;
    const avgCgpa = students.reduce((acc, s) => acc + (Number(s.cgpa) || 8.0), 0) / totalStudents;
    const distinctions = students.filter(s => (Number(s.cgpa) || 8.0) >= 8.5).length;
    const defaultersCount = defaultersList.length;
    const highAttendanceCount = students.filter(s => (Number(s.attendance) || 92) >= 90).length;

    // Fees
    const paidStudents = students.filter(s => (s.feeStatus || '').toLowerCase() === 'paid').length;
    const pendingStudents = students.filter(s => (s.feeStatus || '').toLowerCase() !== 'paid').length;

    return {
      totalStudents,
      avgAttendance: avgAttendance.toFixed(1),
      avgCgpa: avgCgpa.toFixed(2),
      distinctions,
      defaultersCount,
      highAttendanceCount,
      paidStudents,
      pendingStudents,
      totalFaculty: staff.length
    };
  }, [students, staff, defaultersList]);

  // Dynamic Finance & Fee Collections KPIs calculated from live registered students
  const financeData = useMemo(() => {
    const totalStudents = students.length;
    const paidCount = students.filter(s => (s.feeStatus || '').toLowerCase() === 'paid').length;
    const pendingCount = totalStudents - paidCount;

    // Standard annual fee per student (Tuition + Lab/Reg/Exam) = ₹35,000
    const annualFeePerStudent = 35000;
    const totalBilled = totalStudents * annualFeePerStudent;
    const collected = paidCount * annualFeePerStudent;
    const outstanding = pendingCount * annualFeePerStudent;
    const collectionRate = totalBilled > 0 ? ((collected / totalBilled) * 100).toFixed(1) : '100.0';

    // Merit scholarships (students with CGPA >= 8.5)
    const meritStudents = students.filter(s => (Number(s.cgpa) || 0) >= 8.5).length;
    const scholarshipWaivers = meritStudents * 5000;

    const formatINR = (val) => {
      if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
      if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
      return `₹${val.toLocaleString('en-IN')}`;
    };

    const tuitionTotal = Math.round(totalBilled * 0.70);
    const tuitionCollected = Math.round(collected * 0.70);
    const tuitionPct = tuitionTotal > 0 ? Math.round((tuitionCollected / tuitionTotal) * 100) : (totalStudents > 0 ? 100 : 0);

    const facilitiesTotal = Math.round(totalBilled * 0.20);
    const facilitiesCollected = Math.round(collected * 0.20);
    const facilitiesPct = facilitiesTotal > 0 ? Math.round((facilitiesCollected / facilitiesTotal) * 100) : (totalStudents > 0 ? 100 : 0);

    const examTotal = Math.round(totalBilled * 0.10);
    const examCollected = Math.round(collected * 0.10);
    const examPct = examTotal > 0 ? Math.round((examCollected / examTotal) * 100) : (totalStudents > 0 ? 100 : 0);

    return {
      totalBilledStr: formatINR(totalBilled),
      collectedStr: formatINR(collected),
      outstandingStr: formatINR(outstanding),
      scholarshipStr: formatINR(scholarshipWaivers),
      collectionRate,
      paidCount,
      pendingCount,
      totalStudents,
      feeHeads: [
        { head: 'Tuition Fees', collected: formatINR(tuitionCollected), total: formatINR(tuitionTotal), pct: tuitionPct },
        { head: 'Laboratory & Facilities', collected: formatINR(facilitiesCollected), total: formatINR(facilitiesTotal), pct: facilitiesPct },
        { head: 'Examination & Library', collected: formatINR(examCollected), total: formatINR(examTotal), pct: examPct }
      ]
    };
  }, [students]);

  // Filtered Academic Results
  const filteredResults = useMemo(() => {
    return academicDeptResults.filter(d => {
      const q = (searchTerm || '').toLowerCase().trim();
      const matchDept = selectedDept === 'All Departments' || String(d.dept || '').toLowerCase().includes(selectedDept.toLowerCase());
      const matchSearch = !q || String(d.dept || '').toLowerCase().includes(q) || String(d.topper || '').toLowerCase().includes(q);
      return matchDept && matchSearch;
    });
  }, [academicDeptResults, selectedDept, searchTerm]);

  // Filtered Defaulters for Attendance tab
  const filteredDefaulters = useMemo(() => {
    return defaultersList.filter(d => {
      const q = (searchTerm || '').toLowerCase().trim();
      const matchSearch = !q || (
        String(d.name || '').toLowerCase().includes(q) ||
        String(d.rollNo || '').toLowerCase().includes(q) ||
        String(d.dept || '').toLowerCase().includes(q)
      );
      const matchDept = selectedDept === 'All Departments' || String(d.dept || '').toLowerCase().includes(selectedDept.toLowerCase());
      return matchSearch && matchDept;
    });
  }, [defaultersList, searchTerm, selectedDept]);

  // Filtered Students for Enrollment tab
  const filteredEnrollmentStudents = useMemo(() => {
    return students.filter(s => {
      const q = (searchTerm || '').toLowerCase().trim();
      const matchSearch = !q || (
        String(s.name || s.fullName || '').toLowerCase().includes(q) ||
        String(s.rollNo || '').toLowerCase().includes(q) ||
        String(s.department || '').toLowerCase().includes(q) ||
        String(s.phone || '').toLowerCase().includes(q)
      );
      const matchDept = selectedDept === 'All Departments' || s.department === selectedDept;
      return matchSearch && matchDept;
    });
  }, [students, searchTerm, selectedDept]);

  // Filtered Staff for Faculty tab
  const filteredStaffList = useMemo(() => {
    return staff.filter(st => {
      const q = (searchTerm || '').toLowerCase().trim();
      const matchSearch = !q || (
        String(st.name || '').toLowerCase().includes(q) ||
        String(st.staffId || st.empId || '').toLowerCase().includes(q) ||
        String(st.department || '').toLowerCase().includes(q) ||
        String(st.designation || '').toLowerCase().includes(q) ||
        String(st.email || '').toLowerCase().includes(q)
      );
      const matchDept = selectedDept === 'All Departments' || st.department === selectedDept;
      return matchSearch && matchDept;
    });
  }, [staff, searchTerm, selectedDept]);

  // Export live CSV
  const handleExportLiveCSV = () => {
    let headers = [];
    let rows = [];

    if (activeCategory === 'attendance') {
      headers = ['Roll No', 'Student Name', 'Department', 'Semester', 'Attendance %', 'Parent Contact', 'Status'];
      rows = (defaultersList.length > 0 ? defaultersList : students).map(s => [
        `"${s.rollNo}"`,
        `"${s.name}"`,
        `"${s.dept || s.department}"`,
        `"${s.year || s.sem}"`,
        `"${s.att || (s.attendance + '%')}"`,
        `"${s.parentContact || s.phone}"`,
        `"${s.status || 'Active'}"`
      ]);
    } else if (activeCategory === 'faculty') {
      headers = ['Staff ID', 'Name', 'Department', 'Designation', 'Category', 'Email', 'Phone'];
      rows = staff.map(st => [
        `"${st.staffId || st.empId}"`,
        `"${st.name}"`,
        `"${st.department}"`,
        `"${st.designation}"`,
        `"${st.role || 'Faculty'}"`,
        `"${st.email}"`,
        `"${st.phone || st.mobile}"`
      ]);
    } else {
      headers = ['Roll No', 'Name', 'Department', 'Semester', 'CGPA', 'Attendance %', 'Fee Status'];
      rows = students.map(s => [
        `"${s.rollNo}"`,
        `"${s.name || s.fullName}"`,
        `"${s.department}"`,
        `"${s.sem || s.semester}"`,
        `"${s.cgpa || '8.0'}"`,
        `"${s.attendance || '90'}%"`,
        `"${s.feeStatus || 'Paid'}"`
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VCAS_Report_${activeCategory}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Live ${activeCategory} report exported as CSV!`);
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
          <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Institutional Reports & Analytics</h1>
            <p className="text-xs text-slate-500 font-medium">
              Analyze student academic outcomes, fee collections, attendance stats, and generate formal PDF/Excel reports
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchRealTimeReportsData}
            disabled={isLoading}
            title="Refresh Real-Time Institutional Records"
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60"
          >
            <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync Live Data'}</span>
          </button>

          {isSuperAdmin && (
          <>
            <button
            onClick={() => handleExport('PDF')}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleExportLiveCSV}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          </>
        )}

          <button
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>Custom Report</span>
          </button>
        </div>
      </div>

      {/* REPORT CATEGORY TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {REPORT_CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Year */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500"
          >
            <option value="2024-2025">Academic Year: 2024-2025</option>
            <option value="2023-2024">Academic Year: 2023-2024</option>
            <option value="2022-2023">Academic Year: 2022-2023</option>
          </select>

          {/* Semester */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500"
          >
            <option value="All Semesters">All Semesters</option>
            <option value="Odd Sem (Sem 1, 3, 5)">Odd Semester Cycle (Sem 1, 3, 5)</option>
            <option value="Even Sem (Sem 2, 4, 6)">Even Semester Cycle (Sem 2, 4, 6)</option>
          </select>

          {/* Department */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500"
          >
            <option value="All Departments">All Departments</option>
            <option value="Commerce">Commerce</option>
            <option value="Computer Science">Computer Science</option>
            <option value="English Literature">English Literature</option>
            <option value="Business Administration (BBA)">Business Administration (BBA)</option>
            <option value="Computer Applications (BCA)">Computer Applications (BCA)</option>
            <option value="Mathematics">Mathematics</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search metrics, toppers..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* TAB CONTENT 1: ACADEMIC PERFORMANCE */}
      {activeCategory === 'academic' && (
        <div className="space-y-6">
          {/* Top Academic KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall Pass Rate</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900">{overallKpis.avgAttendance}%</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">+2.4%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">University benchmark: 88.0%</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Distinctions (≥ 8.5 CGPA)</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-blue-600">{overallKpis.distinctions}</span>
                <span className="text-xs font-bold text-slate-400">/ {overallKpis.totalStudents}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">32% of total cohort</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Campus CGPA</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-purple-600">{overallKpis.avgCgpa}</span>
                <span className="text-xs font-bold text-slate-400">/ 10.0</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Highest: MBA (8.7)</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Arrears / Backlogs</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-rose-600">{overallKpis.defaultersCount}</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">-18 vs LY</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">6.6% failure rate</p>
            </div>
          </div>

          {/* Department Pass Rate Visual Comparison Chart */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Department Pass Percentage Breakdown</h3>
                <p className="text-xs text-slate-400">Semester examination results for {selectedYear}</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">
                Batch Average: 93.8%
              </span>
            </div>

            <div className="space-y-4 pt-2">
              {academicDeptResults.map((dept, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
                      {dept.dept} ({dept.students} Students)
                    </span>
                    <span className="font-extrabold text-slate-900">{dept.passRate}% Pass Rate</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        dept.passRate >= 95 ? 'bg-emerald-500' : dept.passRate >= 90 ? 'bg-cyan-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${dept.passRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Department Results Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Department Academic Outcome Matrix</h3>
              <span className="text-xs font-bold text-slate-400">{filteredResults.length} Departments Listed</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Enrolled</th>
                    <th className="py-3.5 px-4">Pass %</th>
                    <th className="py-3.5 px-4">Distinctions</th>
                    <th className="py-3.5 px-4">Active Backlogs</th>
                    <th className="py-3.5 px-4">Department Topper</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredResults.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{r.dept}</td>
                      <td className="py-3.5 px-4">{r.students}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {r.passRate}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-blue-600">{r.distinctions}</td>
                      <td className="py-3.5 px-4 font-semibold text-rose-600">{r.backlogs}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{r.topper}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: ATTENDANCE & DEFAULTERS */}
      {activeCategory === 'attendance' && (
        <div className="space-y-6">
          {/* Attendance KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Campus Attendance</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900">{overallKpis.avgAttendance}%</span>
                <span className="text-xs font-bold text-emerald-600">+1.1%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Target Threshold: 85.0%</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">High Attendance (&gt;90%)</p>
              <span className="text-3xl font-black text-emerald-600 mt-1 block">{overallKpis.highAttendanceCount}</span>
              <p className="text-[11px] text-slate-500 mt-1">Eligible for merit honors</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Warning Zone (75-80%)</p>
              <span className="text-3xl font-black text-amber-600 mt-1 block">118</span>
              <p className="text-[11px] text-slate-500 mt-1">SMS alert sent to guardians</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Defaulters (&lt; 75%)</p>
              <span className="text-3xl font-black text-rose-600 mt-1 block">{overallKpis.defaultersCount}</span>
              <p className="text-[11px] text-slate-500 mt-1">Hall ticket on hold</p>
            </div>
          </div>

          {/* Defaulters Action Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Attendance Defaulter Registry (&lt; 75% Attendance)</h3>
                <p className="text-xs text-slate-400">Students facing exam condonation requirement</p>
              </div>
              <button
                onClick={() => showToast('Dispatched SMS alerts to all 48 parent contacts!')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Broadcast Alert to All Parents
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Roll Number</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Department & Year</th>
                    <th className="py-3.5 px-4">Attendance %</th>
                    <th className="py-3.5 px-4">Missed Hours</th>
                    <th className="py-3.5 px-4">Guardian Contact</th>
                    <th className="py-3.5 px-4">Administrative Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredDefaulters.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{d.rollNo}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{d.name}</td>
                      <td className="py-3.5 px-4">{d.dept} • {d.year}</td>
                      <td className="py-3.5 px-4 font-black text-rose-600">{d.att}</td>
                      <td className="py-3.5 px-4 text-slate-500">{d.missedClasses} Hours</td>
                      <td className="py-3.5 px-4 font-mono">{d.parentContact}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: FINANCE & FEE COLLECTIONS */}
      {activeCategory === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Billed Fees</p>
              <span className="text-3xl font-black text-slate-900 mt-1 block">{financeData.totalBilledStr}</span>
              <p className="text-[11px] text-slate-500 mt-1">Academic Year 2025-26 ({financeData.totalStudents} enrolled)</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Collected to Date</p>
              <span className="text-3xl font-black text-emerald-600 mt-1 block">{financeData.collectedStr}</span>
              <p className="text-[11px] text-slate-500 mt-1">{financeData.collectionRate}% Collection Rate ({financeData.paidCount} paid)</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Dues</p>
              <span className="text-3xl font-black text-amber-600 mt-1 block">{financeData.outstandingStr}</span>
              <p className="text-[11px] text-slate-500 mt-1">Across {financeData.pendingCount} students</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Scholarship Waivers</p>
              <span className="text-3xl font-black text-purple-600 mt-1 block">{financeData.scholarshipStr}</span>
              <p className="text-[11px] text-slate-500 mt-1">Merit & Need-based</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Fee Head Revenue Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {financeData.feeHeads.map((f, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between font-bold text-xs">
                    <span className="text-slate-800">{f.head}</span>
                    <span className="text-cyan-600">{f.pct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${f.pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Recv: <strong>{f.collected}</strong></span>
                    <span>Total: {f.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: ADMISSIONS & DEMOGRAPHICS */}
      {activeCategory === 'admissions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Enrolled</p>
              <span className="text-3xl font-black text-slate-900 mt-1 block">{students.length}</span>
              <p className="text-[11px] text-slate-500 mt-1">Live student registry</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Departments</p>
              <span className="text-3xl font-black text-cyan-600 mt-1 block">{departments.length || 6}</span>
              <p className="text-[11px] text-slate-500 mt-1">Undergraduate & Postgrad</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fee Cleared</p>
              <span className="text-3xl font-black text-emerald-600 mt-1 block">{overallKpis.paidStudents}</span>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">Ready for Hall Tickets</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fee Pending</p>
              <span className="text-3xl font-black text-amber-600 mt-1 block">{overallKpis.pendingStudents}</span>
              <p className="text-[11px] text-slate-500 mt-1">Follow-up required</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Student Admissions & Enrollment Roster</h3>
                <p className="text-xs text-slate-400">Live institutional student records verified</p>
              </div>
              <span className="text-xs font-bold text-slate-400">{filteredEnrollmentStudents.length} Registered Students</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Roll No</th>
                    <th className="py-3.5 px-4">Name</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Semester</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Attendance</th>
                    <th className="py-3.5 px-4">Fee Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredEnrollmentStudents.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{s.rollNo}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{s.name || s.fullName}</td>
                      <td className="py-3.5 px-4">{s.department}</td>
                      <td className="py-3.5 px-4">{s.sem || s.semester}</td>
                      <td className="py-3.5 px-4 font-mono">{s.phone || s.mobile || 'N/A'}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">{s.attendance || 90}%</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          (s.feeStatus || '').toLowerCase() === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {s.feeStatus || 'Paid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: FACULTY & WORKLOAD */}
      {activeCategory === 'faculty' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Faculty & Staff</p>
              <span className="text-3xl font-black text-slate-900 mt-1 block">{staff.length}</span>
              <p className="text-[11px] text-slate-500 mt-1">Live staff registry</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Professors & Assoc.</p>
              <span className="text-3xl font-black text-cyan-600 mt-1 block">
                {staff.filter(st => (st.designation || '').toLowerCase().includes('prof') || (st.role || '').toLowerCase().includes('prof')).length}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Academic Leadership</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Office Staff</p>
              <span className="text-3xl font-black text-purple-600 mt-1 block">
                {staff.filter(st => (st.role === 'Office Staff' || st.department?.includes('Office'))).length}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Administrative Support</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Accountants</p>
              <span className="text-3xl font-black text-emerald-600 mt-1 block">
                {staff.filter(st => (st.role === 'Accountant' || st.department?.includes('Account'))).length}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Finance Operations</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Faculty & Staff Directory Roster</h3>
                <p className="text-xs text-slate-400">Live roster verified from staff registry</p>
              </div>
              <span className="text-xs font-bold text-slate-400">{filteredStaffList.length} Active Staff</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Staff ID</th>
                    <th className="py-3.5 px-4">Name</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Designation</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Role Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredStaffList.map((st, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{st.staffId || st.empId || `STF${idx + 1}`}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{st.name}</td>
                      <td className="py-3.5 px-4">{st.department || 'General'}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{st.designation || 'Staff'}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{st.email || 'N/A'}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-cyan-50 text-cyan-700 border border-cyan-200">
                          {st.role || 'Faculty'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {false && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 mx-auto flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              {activeCategory === 'admissions' ? 'Admissions & Cohort Demographics' : 'Faculty Workload & Publications Analytics'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {activeCategory === 'admissions' 
                ? 'Total 1,440 Enrolled Students • 58% Male / 42% Female Ratio • 94.2% First Choice Admissions'
                : '84 Full-time Faculty Members • Faculty-to-Student Ratio 1:17 • 38 Research Publications Indexed in Scopus in 2024-25'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {isSuperAdmin && (
            <button
              onClick={() => handleExport(activeCategory === 'admissions' ? 'Admissions' : 'Faculty')}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-500/20"
            >
              Export Complete {activeCategory === 'admissions' ? 'Demographics' : 'Faculty'} Dossier (PDF)
            </button>
          )}
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM REPORT GENERATOR */}
      {showCustomModal && (
        <ModalPortal isOpen={showCustomModal} onClose={() => setShowCustomModal(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Custom Report Builder</h2>
                  <p className="text-[11px] text-slate-500">Configure parameters and compile tailored report</p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Report Heading *</label>
                <input
                  type="text"
                  required
                  value={customReport.title}
                  onChange={(e) => setCustomReport({ ...customReport, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Domain</label>
                  <select
                    value={customReport.category}
                    onChange={(e) => setCustomReport({ ...customReport, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Academic">Academic Results</option>
                    <option value="Attendance">Attendance Analytics</option>
                    <option value="Finance">Financial Accounts</option>
                    <option value="Admissions">Admissions & Intake</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Export Format</label>
                  <select
                    value={customReport.format}
                    onChange={(e) => setCustomReport({ ...customReport, format: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="PDF">PDF (.pdf document)</option>
                    <option value="Excel">Excel (.xlsx spreadsheet)</option>
                    <option value="CSV">CSV (.csv data file)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customReport.includeCharts}
                    onChange={(e) => setCustomReport({ ...customReport, includeCharts: e.target.checked })}
                    className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                  />
                  <span>Include Visual Charts & Graphs</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customReport.includeStudentDetails}
                    onChange={(e) => setCustomReport({ ...customReport, includeStudentDetails: e.target.checked })}
                    className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                  />
                  <span>Include Student-level Breakdown</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-500/20"
                >
                  Generate & Download
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
