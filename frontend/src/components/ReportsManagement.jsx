import React, { useState, useMemo } from 'react';
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

export default function ReportsManagement() {
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

  // Mock Data for Academic Results
  const academicDeptResults = [
    { dept: 'Computer Science', students: 340, passRate: 96.2, avgGpa: 8.4, distinctions: 112, backlogs: 13, topper: 'Aditya Kapoor (9.82 CGPA)' },
    { dept: 'Electronics & Comm', students: 280, passRate: 92.8, avgGpa: 7.9, distinctions: 78, backlogs: 20, topper: 'Ananya Deshmukh (9.75 CGPA)' },
    { dept: 'Mechanical Engg', students: 220, passRate: 88.5, avgGpa: 7.5, distinctions: 54, backlogs: 25, topper: 'Rohan Verma (9.60 CGPA)' },
    { dept: 'Civil Engineering', students: 180, passRate: 86.4, avgGpa: 7.3, distinctions: 38, backlogs: 24, topper: 'Siddharth Nair (9.48 CGPA)' },
    { dept: 'Business Admin (MBA)', students: 270, passRate: 98.1, avgGpa: 8.7, distinctions: 135, backlogs: 5, topper: 'Sneha Patel (9.90 CGPA)' },
    { dept: 'Computer Apps (BCA)', students: 150, passRate: 94.0, avgGpa: 8.1, distinctions: 45, backlogs: 9, topper: 'Karthik Raja (9.65 CGPA)' }
  ];

  // Mock Data for Attendance Defaulters (< 75%)
  const defaultersList = [
    { rollNo: 'VCAS23CS045', name: 'Vikramaditya Rao', dept: 'CS', year: '3rd Year', att: '64.2%', missedClasses: 42, parentContact: '98401 99001', status: 'Warning Issued' },
    { rollNo: 'VCAS23EC019', name: 'Deepak Chandran', dept: 'ECE', year: '2nd Year', att: '68.0%', missedClasses: 38, parentContact: '98401 99002', status: 'Parent Called' },
    { rollNo: 'VCAS22ME088', name: 'Gautam Singhania', dept: 'Mech', year: '4th Year', att: '61.5%', missedClasses: 48, parentContact: '98401 99003', status: 'Notice Sent' },
    { rollNo: 'VCAS24CS102', name: 'Pooja Sundaram', dept: 'CS', year: '1st Year', att: '71.4%', missedClasses: 28, parentContact: '98401 99004', status: 'Counseled' },
    { rollNo: 'VCAS23CV031', name: 'Harish Krishnamurthy', dept: 'Civil', year: '2nd Year', att: '59.8%', missedClasses: 52, parentContact: '98401 99005', status: 'Exam Blocked' }
  ];

  // Filtered Academic Results
  const filteredResults = useMemo(() => {
    return academicDeptResults.filter(d => {
      const matchDept = selectedDept === 'All Departments' || d.dept.toLowerCase().includes(selectedDept.toLowerCase());
      const matchSearch = d.dept.toLowerCase().includes(searchTerm.toLowerCase()) || d.topper.toLowerCase().includes(searchTerm.toLowerCase());
      return matchDept && matchSearch;
    });
  }, [academicDeptResults, selectedDept, searchTerm]);

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
            onClick={() => handleExport('PDF')}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => handleExport('Excel')}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

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
            <option value="Odd Sem (Sem 1, 3, 5, 7)">Odd Semester Cycle</option>
            <option value="Even Sem (Sem 2, 4, 6, 8)">Even Semester Cycle</option>
          </select>

          {/* Department */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500"
          >
            <option value="All Departments">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electronics & Comm">Electronics & Comm</option>
            <option value="Mechanical Engg">Mechanical Engg</option>
            <option value="Civil Engineering">Civil Engineering</option>
            <option value="Business Admin">Business Admin (MBA)</option>
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
                <span className="text-3xl font-black text-slate-900">93.8%</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">+2.4%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">University benchmark: 88.0%</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Distinctions (≥ 8.5 CGPA)</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-blue-600">462</span>
                <span className="text-xs font-bold text-slate-400">/ 1,440</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">32% of total cohort</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Campus CGPA</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-purple-600">8.05</span>
                <span className="text-xs font-bold text-slate-400">/ 10.0</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Highest: MBA (8.7)</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Arrears / Backlogs</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-rose-600">96</span>
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
                    <span className="font-extrabold text-slate-900">{dept.passRate}% Pass Rate • Avg CGPA {dept.avgGpa}</span>
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
                    <th className="py-3.5 px-4">Avg CGPA</th>
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
                      <td className="py-3.5 px-4 font-bold text-slate-800">{r.avgGpa}</td>
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
                <span className="text-3xl font-black text-slate-900">89.2%</span>
                <span className="text-xs font-bold text-emerald-600">+1.1%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Target Threshold: 85.0%</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">High Attendance (&gt;90%)</p>
              <span className="text-3xl font-black text-emerald-600 mt-1 block">842</span>
              <p className="text-[11px] text-slate-500 mt-1">Eligible for merit honors</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Warning Zone (75-80%)</p>
              <span className="text-3xl font-black text-amber-600 mt-1 block">118</span>
              <p className="text-[11px] text-slate-500 mt-1">SMS alert sent to guardians</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Defaulters (&lt; 75%)</p>
              <span className="text-3xl font-black text-rose-600 mt-1 block">48</span>
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
                  {defaultersList.map((d, i) => (
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
              <span className="text-3xl font-black text-slate-900 mt-1 block">₹8.42 Cr</span>
              <p className="text-[11px] text-slate-500 mt-1">Academic Year 2024-25</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Collected to Date</p>
              <span className="text-3xl font-black text-emerald-600 mt-1 block">₹7.22 Cr</span>
              <p className="text-[11px] text-slate-500 mt-1">85.7% Collection Rate</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Dues</p>
              <span className="text-3xl font-black text-amber-600 mt-1 block">₹1.20 Cr</span>
              <p className="text-[11px] text-slate-500 mt-1">Across 184 students</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Scholarship Waivers</p>
              <span className="text-3xl font-black text-purple-600 mt-1 block">₹45.6 L</span>
              <p className="text-[11px] text-slate-500 mt-1">Merit & Need-based</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Fee Head Revenue Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { head: 'Tuition Fees', collected: '₹5.60 Cr', total: '₹6.20 Cr', pct: 90 },
                { head: 'Hostel & Mess', collected: '₹1.10 Cr', total: '₹1.35 Cr', pct: 81 },
                { head: 'Transport & Bus', collected: '₹52.0 L', total: '₹65.0 L', pct: 80 }
              ].map((f, i) => (
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

      {/* TAB CONTENT 4 & 5: ADMISSIONS & FACULTY */}
      {(activeCategory === 'admissions' || activeCategory === 'faculty') && (
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
            <button
              onClick={() => handleExport(activeCategory === 'admissions' ? 'Admissions' : 'Faculty')}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-500/20"
            >
              Export Complete {activeCategory === 'admissions' ? 'Demographics' : 'Faculty'} Dossier (PDF)
            </button>
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
