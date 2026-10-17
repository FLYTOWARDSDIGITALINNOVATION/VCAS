import React, { useState, useEffect } from 'react';
import { API_BASE, BACKEND_URL } from '../apiConfig';
import { 
  Building2, 
  Award, 
  CheckCircle2, 
  Printer, 
  Calculator, 
  FileText, 
  GraduationCap, 
  Sparkles, 
  HeartHandshake, 
  ShieldCheck, 
  HelpCircle,
  IndianRupee,
  Layers,
  ArrowRight,
  Edit3,
  Save,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  X,
  Clock,
  UserCheck
} from 'lucide-react';
import ModalPortal from './ModalPortal';

export const UG_FEE_STRUCTURE = [
  {
    cluster: 'Commerce & Management',
    departments: ['B.Com', 'BBA'],
    deptNames: ['Bachelor of Commerce (B.Com)', 'Bachelor of Business Administration (BBA)'],
    registrationFee: 7000,
    sem1Fee: 10000,
    sem2Fee: 10000,
    totalAnnualFee: 27000,
    color: 'from-blue-600 to-indigo-600',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50/50',
    badge: '₹27,000 / Year'
  },
  {
    cluster: 'Computing & Advanced Technology',
    departments: ['CS', 'AI', 'CFS'],
    deptNames: [
      'B.Sc Computer Science (CS)', 
      'B.Sc Artificial Intelligence (AI)', 
      'B.Sc Criminology and Forensic Science (CFS)'
    ],
    registrationFee: 8000,
    sem1Fee: 10000,
    sem2Fee: 10000,
    totalAnnualFee: 28000,
    color: 'from-purple-600 to-indigo-600',
    borderColor: 'border-purple-200',
    bgColor: 'bg-purple-50/50',
    badge: '₹28,000 / Year'
  }
];

export const SCHOLARSHIP_SLABS = [
  {
    id: 'marks_550',
    criteria: 'Marks > 550',
    detail: 'Outstanding Merit (Score > 550 / 600)',
    discountPercent: 100,
    sem1: 0,
    sem2: 0,
    sem1Display: '₹0 (Free)',
    sem2Display: '₹0 (Free)',
    savings: 20000,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    id: 'marks_500',
    criteria: 'Marks > 500',
    detail: 'High Merit (Score > 500 / 600)',
    discountPercent: 75,
    sem1: 2500,
    sem2: 2500,
    sem1Display: '₹2,500',
    sem2Display: '₹2,500',
    savings: 15000,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    id: 'marks_450',
    criteria: 'Marks > 450',
    detail: 'First Class Merit (Score > 450 / 600)',
    discountPercent: 50,
    sem1: 5000,
    sem2: 5000,
    sem1Display: '₹5,000',
    sem2Display: '₹5,000',
    savings: 10000,
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  },
  {
    id: 'marks_400',
    criteria: 'Marks > 400',
    detail: 'Standard Merit (Score > 400 / 600)',
    discountPercent: 25,
    sem1: 7500,
    sem2: 7500,
    sem1Display: '₹7,500',
    sem2Display: '₹7,500',
    savings: 5000,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  {
    id: 'single_parent',
    criteria: 'Single Parent',
    detail: 'Welfare Concession for single-parent students',
    discountPercent: 25,
    sem1: 7500,
    sem2: 7500,
    sem1Display: '₹7,500',
    sem2Display: '₹7,500',
    savings: 5000,
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-300'
  },
  {
    id: 'disabled',
    criteria: 'Disabled',
    detail: 'Differently Abled Students Welfare Concession',
    discountPercent: 25,
    sem1: 7500,
    sem2: 7500,
    sem1Display: '₹7,500',
    sem2Display: '₹7,500',
    savings: 5000,
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300'
  },
  {
    id: 'special_scholar',
    criteria: 'Special Scholar',
    detail: 'Sports, Trust, or Special Management Quota',
    discountPercent: null,
    sem1: null,
    sem2: null,
    sem1Display: 'Discretionary (?)',
    sem2Display: 'Discretionary (?)',
    savings: 'Variable',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300'
  }
];

export default function FeeStructureView({ user }) {
  // Identify current logged in user & role
  const currentUser = user || (() => {
    try {
      return JSON.parse(sessionStorage.getItem('vcas_user') || '{}');
    } catch {
      return {};
    }
  })();
  const userRole = currentUser?.role || 'Super Admin';
  const canEdit = ['Super Admin', 'Accountant', 'Office Staff', 'Admin'].includes(userRole) || currentUser?.canEditFees;

  // Live Synchronized Fee Structure State
  const [clusters, setClusters] = useState(UG_FEE_STRUCTURE);
  const [scholarships, setScholarships] = useState(SCHOLARSHIP_SLABS);
  const [academicYear, setAcademicYear] = useState('2025–2026');
  const [lastUpdateMeta, setLastUpdateMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Fee Structure Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editClusters, setEditClusters] = useState([]);
  const [editScholarships, setEditScholarships] = useState([]);
  const [editAcademicYear, setEditAcademicYear] = useState('2025–2026');
  const [feedbackToast, setFeedbackToast] = useState(null);

  // Fetch real-time fee structure from backend API
  const fetchFeeStructure = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/fee-structure`);
      const json = await res.json();
      if (json.success && json.data) {
        if (Array.isArray(json.data.clusters) && json.data.clusters.length > 0) {
          setClusters(json.data.clusters);
        }
        if (Array.isArray(json.data.scholarships) && json.data.scholarships.length > 0) {
          setScholarships(json.data.scholarships);
        }
        if (json.data.academicYear) {
          setAcademicYear(json.data.academicYear);
        }
        if (json.data.lastUpdatedBy || json.data.lastUpdatedRole) {
          setLastUpdateMeta({
            by: json.data.lastUpdatedBy,
            role: json.data.lastUpdatedRole,
            at: json.data.lastUpdatedAt
          });
        }
      }
    } catch (err) {
      console.warn('Fee structure API connection notice:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeStructure();
    const handleSync = () => fetchFeeStructure();
    window.addEventListener('vcas_feestructure_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('vcas_feestructure_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Open Edit Modal with cloned state
  const handleOpenEdit = () => {
    setEditClusters(JSON.parse(JSON.stringify(clusters)));
    setEditScholarships(JSON.parse(JSON.stringify(scholarships)));
    setEditAcademicYear(academicYear);
    setIsEditModalOpen(true);
  };

  // Save changes to backend so Super Admin, Office Staff, and Accountant all see it instantly
  const handleSaveFeeStructure = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        clusters: editClusters,
        scholarships: editScholarships,
        academicYear: editAcademicYear,
        updatedBy: currentUser?.name || userRole,
        updatedRole: userRole
      };

      const res = await fetch(`${API_BASE}/fee-structure`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.data) {
        setClusters(data.data.clusters);
        setScholarships(data.data.scholarships);
        setAcademicYear(data.data.academicYear);
        setLastUpdateMeta({
          by: data.data.lastUpdatedBy,
          role: data.data.lastUpdatedRole,
          at: data.data.lastUpdatedAt
        });
        setIsEditModalOpen(false);

        // Broadcast sync event to all portals/tabs
        window.dispatchEvent(new Event('vcas_feestructure_updated'));
        localStorage.setItem('vcas_feestructure_sync', Date.now().toString());

        setFeedbackToast(`Fee structure updated & synchronized across Super Admin, Office, and Accounts!`);
        setTimeout(() => setFeedbackToast(null), 4500);
      } else {
        alert(data.message || 'Failed to update fee structure.');
      }
    } catch (err) {
      alert('Error updating fee structure: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default matrix
  const handleResetToDefault = async () => {
    if (!window.confirm('Reset fee structure to official institutional defaults?')) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/fee-structure/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetBy: currentUser?.name || userRole,
          resetRole: userRole
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setClusters(data.data.clusters);
        setScholarships(data.data.scholarships);
        setAcademicYear(data.data.academicYear);
        setLastUpdateMeta({
          by: data.data.lastUpdatedBy,
          role: data.data.lastUpdatedRole,
          at: data.data.lastUpdatedAt
        });
        setIsEditModalOpen(false);
        window.dispatchEvent(new Event('vcas_feestructure_updated'));
        localStorage.setItem('vcas_feestructure_sync', Date.now().toString());
        setFeedbackToast('Fee structure reset to institutional standard defaults!');
        setTimeout(() => setFeedbackToast(null), 4500);
      }
    } catch (err) {
      alert('Reset error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculator state
  const [calcDept, setCalcDept] = useState('B.Com');
  const [calcScholarship, setCalcScholarship] = useState('none');
  const [specialAmount, setSpecialAmount] = useState(5000);
  const [calcPeriod, setCalcPeriod] = useState('year'); // 'year', 'sem1', 'sem2'

  // Lookups based on live synced clusters
  const isClusterTech = ['CS', 'AI', 'CFS'].includes(calcDept);
  const currentCluster = clusters.find(c => c.departments?.includes(calcDept)) || clusters[0] || {};
  const registrationFee = Number(currentCluster.registrationFee) || (isClusterTech ? 8000 : 7000);
  const baseSem1 = Number(currentCluster.sem1Fee) || 10000;
  const baseSem2 = Number(currentCluster.sem2Fee) || 10000;

  let sem1Payable = baseSem1;
  let sem2Payable = baseSem2;
  let scholarshipLabel = 'No Concession (Standard)';
  let totalSavings = 0;

  const currentSlab = scholarships.find(s => s.id === calcScholarship);
  if (currentSlab) {
    if (currentSlab.discountPercent === 100) {
      sem1Payable = 0;
      sem2Payable = 0;
      scholarshipLabel = currentSlab.detail || `${currentSlab.criteria} (100% Scholarship)`;
      totalSavings = baseSem1 + baseSem2;
    } else if (currentSlab.discountPercent) {
      const discPercent = currentSlab.discountPercent;
      const sem1Disc = (baseSem1 * discPercent) / 100;
      const sem2Disc = (baseSem2 * discPercent) / 100;
      sem1Payable = Math.max(0, baseSem1 - sem1Disc);
      sem2Payable = Math.max(0, baseSem2 - sem2Disc);
      scholarshipLabel = `${discPercent}% Scholarship (${currentSlab.criteria})`;
      totalSavings = sem1Disc + sem2Disc;
    } else if (calcScholarship === 'special_scholar') {
      const customDisc = Math.min(baseSem1 + baseSem2, Math.max(0, Number(specialAmount) || 0));
      const perSemDisc = customDisc / 2;
      sem1Payable = Math.max(0, baseSem1 - perSemDisc);
      sem2Payable = Math.max(0, baseSem2 - perSemDisc);
      scholarshipLabel = `Special Scholar Grant (₹${customDisc.toLocaleString()})`;
      totalSavings = customDisc;
    }
  }

  // Calculate Net based on period
  let periodReg = calcPeriod === 'sem2' ? 0 : registrationFee;
  let periodSem1 = calcPeriod === 'sem2' ? 0 : sem1Payable;
  let periodSem2 = calcPeriod === 'sem1' ? 0 : sem2Payable;
  let periodTotalPayable = periodReg + periodSem1 + periodSem2;

  const handlePrintStructureSlip = () => {
    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) {
      alert('Please allow popups to print fee quotation.');
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>VCAS UG Fee Structure & Concession Quotation</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 35px; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 18px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; margin: 0; }
          .sub { font-size: 13px; color: #475569; margin-top: 4px; }
          .badge { display: inline-block; background: #eff6ff; color: #1d4ed8; font-size: 11px; padding: 4px 12px; border-radius: 9999px; font-weight: 700; margin-top: 8px; border: 1px solid #bfdbfe; }
          .sec-title { font-size: 13px; font-weight: bold; color: #2563eb; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin: 20px 0 12px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-bottom: 15px; }
          th { background: #f8fafc; text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700; }
          td { padding: 8px 10px; border: 1px solid #e2e8f0; }
          .total-row { background: #f0fdf4; font-weight: bold; color: #166534; }
          .quote-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin-top: 15px; }
          .quote-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #cbd5e1; font-size: 13px; }
          .net-row { display: flex; justify-content: space-between; padding: 10px 0 0 0; font-size: 16px; font-weight: bold; color: #1e3a8a; }
          .stamp-row { display: flex; justify-content: space-between; margin-top: 50px; font-size: 12px; font-weight: 600; padding: 0 20px; }
          .footer { margin-top: 35px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 11px; color: #64748b; text-align: center; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Vivekananda College of Arts and Science</div>
          <div class="sub">Affiliated with Manonmaniam Sundaranar University • Vellalankulam</div>
          <div class="badge">Official UG Fee Structure & Scholarship Quotation (${academicYear})</div>
        </div>

        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:15px; background:#f1f5f9; padding:8px 12px; border-radius:6px;">
          <div><strong>Candidate Department:</strong> ${calcDept} (UG 5-Dept Cluster)</div>
          <div><strong>Period:</strong> ${calcPeriod === 'year' ? 'Full Academic Year' : (calcPeriod === 'sem1' ? 'Semester I Only' : 'Semester II Only')}</div>
          <div><strong>Generated:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
        </div>

        <div class="sec-title">Fee Breakdown Quotation</div>
        <div class="quote-box">
          <div class="quote-row">
            <span>Registration Fee (Initial Enrollment)</span>
            <strong>₹${periodReg.toLocaleString()}</strong>
          </div>
          <div class="quote-row">
            <span>Semester I Tuition Fee (Base ₹${baseSem1.toLocaleString()})</span>
            <strong>₹${periodSem1.toLocaleString()}</strong>
          </div>
          <div class="quote-row">
            <span>Semester II Tuition Fee (Base ₹${baseSem2.toLocaleString()})</span>
            <strong>₹${periodSem2.toLocaleString()}</strong>
          </div>
          <div class="quote-row" style="color: #166534;">
            <span>Scholarship / Concession Applied (${scholarshipLabel})</span>
            <strong>- ₹${totalSavings.toLocaleString()}</strong>
          </div>
          <div class="net-row">
            <span>Net Student Payable Amount:</span>
            <span>₹${periodTotalPayable.toLocaleString()}</span>
          </div>
        </div>

        <div class="sec-title">Approved UG Institutional Fee Matrix</div>
        <table>
          <thead>
            <tr>
              <th>Departments</th>
              <th>Registration Fee</th>
              <th>Semester I</th>
              <th>Semester II</th>
              <th>Total Annual Fee</th>
            </tr>
          </thead>
          <tbody>
            ${clusters.map(c => `
              <tr>
                <td><strong>${c.departments.join(', ')}</strong></td>
                <td>₹${Number(c.registrationFee).toLocaleString()}</td>
                <td>₹${Number(c.sem1Fee).toLocaleString()}</td>
                <td>₹${Number(c.sem2Fee).toLocaleString()}</td>
                <td><strong>₹${Number(c.totalAnnualFee).toLocaleString()}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="sec-title">Approved Merit & Welfare Scholarship Slab</div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Discount %</th>
              <th>Sem I Fee</th>
              <th>Sem II Fee</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${scholarships.map(s => `
              <tr>
                <td>${s.criteria}</td>
                <td>${s.discountPercent !== null ? s.discountPercent + '%' : 'Custom'}</td>
                <td>${s.sem1Display}</td>
                <td>${s.sem2Display}</td>
                <td>${typeof s.savings === 'number' ? '₹' + s.savings.toLocaleString() : s.savings}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="sec-title">Academic Assessment Structure</div>
        <p style="font-size:11.5px; color:#475569; margin:0;">
          <strong>Examinations:</strong> Continuous Internal Assessment 1 (Internal I) • Continuous Internal Assessment 2 (Internal II) • Model Examination<br/>
          <strong>Evaluation Components:</strong> Assignment Submission • Seminar Presentation • Term Project
        </p>

        <div class="stamp-row">
          <div>Prepared by Accounts Section</div>
          <div>Approved by Principal / Management</div>
        </div>

        <div class="footer">
          This document is generated by Vivekananda College Accounts & Admissions System. Valid for academic year ${academicYear}.
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    printWin.document.write(html);
    printWin.document.close();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{feedbackToast}</span>
        </div>
      )}
      
      {/* 1. TOP HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold border border-white/10 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Official Institutional Matrix ({academicYear})</span>
            </div>

            {/* Cross-role synchronization status badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Synchronized: Super Admin ⇄ Office ⇄ Accounts</span>
            </div>

            {lastUpdateMeta && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 text-[10px] font-medium border border-slate-700">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Updated by {lastUpdateMeta.role} ({lastUpdateMeta.by})</span>
              </div>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
            UG Fee Structure & Scholarship Slabs
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Standardised fee schedule across the <strong>5 Undergraduate Departments</strong>. Changes made by Super Admin, Office Staff, or Accountant are dynamically saved and synchronized across all portals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10 shrink-0">
          {canEdit && (
            <button
              onClick={handleOpenEdit}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer border border-blue-400/30"
              title="Edit fee amounts for all departments and scholarships"
            >
              <Edit3 className="w-4 h-4 text-white" />
              <span>Edit Fee Structure</span>
            </button>
          )}

          <button
            onClick={handlePrintStructureSlip}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Print Official Structure</span>
          </button>
        </div>

        {/* Subtle geometric circles */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* 2. FIVE UG DEPARTMENTS MATRIX CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>UG 5 Departments Fee Schedule</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Approved annual fees and semester distribution</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              5 Core UG Programs
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clusters.map((cluster, i) => (
            <div 
              key={i} 
              className={`bg-white rounded-3xl border ${cluster.borderColor || 'border-slate-200'} p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between`}
            >
              <div className="space-y-4">
                {/* Cluster Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {cluster.cluster}
                  </span>
                  <span className="px-3 py-1 rounded-xl text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200">
                    ₹{Number(cluster.totalAnnualFee).toLocaleString()} / Year
                  </span>
                </div>

                {/* Department Names Pills */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {cluster.departments.map(dept => (
                    <span 
                      key={dept}
                      className="px-3 py-1.5 rounded-xl font-extrabold text-xs bg-slate-900 text-white shadow-2xs"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  {cluster.deptNames.map((n, idx) => (
                    <p key={idx}>• {n}</p>
                  ))}
                </div>

                {/* Fee Breakdown Grid */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Registration</span>
                    <span className="text-sm font-extrabold text-slate-900 font-mono">₹{Number(cluster.registrationFee).toLocaleString()}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Semester I</span>
                    <span className="text-sm font-extrabold text-slate-900 font-mono">₹{Number(cluster.sem1Fee).toLocaleString()}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Semester II</span>
                    <span className="text-sm font-extrabold text-slate-900 font-mono">₹{Number(cluster.sem2Fee).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Total Card Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Total Annual Payable:</span>
                <span className="text-lg font-black text-slate-900 font-mono">₹{Number(cluster.totalAnnualFee).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MERIT & WELFARE SCHOLARSHIP SLABS TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Official Institutional Scholarship & Concession Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Approved tuition fee fee concessions per semester based on score and social category
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 self-start sm:self-auto">
            Governing Council Approved
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 rounded-l-xl">Eligibility Criteria</th>
                <th className="py-3 px-4">Scholarship Detail</th>
                <th className="py-3 px-4 text-center">Discount %</th>
                <th className="py-3 px-4 text-right">Sem I Fee</th>
                <th className="py-3 px-4 text-right">Sem II Fee</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Annual Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scholarships.map((slab) => (
                <tr key={slab.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold border ${slab.badgeColor || 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {slab.criteria}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {slab.detail}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                      {slab.discountPercent !== null ? `${slab.discountPercent}%` : 'Custom (?)'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                    {slab.sem1Display}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                    {slab.sem2Display}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600">
                    {typeof slab.savings === 'number' ? `₹${slab.savings.toLocaleString()}` : slab.savings}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. INTERACTIVE FEE & CONCESSION CALCULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Cols: Calculator Controls */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Interactive Fee & Concession Calculator
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Select department and eligible quota to determine net student dues</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Department Selection */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Undergraduate Department (5 UG Depts)
              </label>
              <select
                value={calcDept}
                onChange={(e) => setCalcDept(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="B.Com">B.Com (Commerce)</option>
                <option value="BBA">BBA (Management)</option>
                <option value="CS">B.Sc Computer Science (CS)</option>
                <option value="AI">B.Sc Artificial Intelligence (AI)</option>
                <option value="CFS">B.Sc Criminology and Forensic Science (CFS)</option>
              </select>
            </div>

            {/* Scholarship Category Selection */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Scholarship / Concession Category
              </label>
              <select
                value={calcScholarship}
                onChange={(e) => setCalcScholarship(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="none">No Scholarship (Standard Full Fee)</option>
                {scholarships.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.criteria} ({s.discountPercent !== null ? `${s.discountPercent}%` : 'Discretionary'})
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Period */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Payment Period
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'year', label: 'Full Year' },
                  { id: 'sem1', label: 'Semester I' },
                  { id: 'sem2', label: 'Semester II' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCalcPeriod(p.id)}
                    className={`py-2 px-3 rounded-xl font-extrabold text-xs transition-all ${
                      calcPeriod === p.id 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Special scholarship amount input if selected */}
            {calcScholarship === 'special_scholar' && (
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Special Scholar Grant (₹)
                </label>
                <input
                  type="number"
                  value={specialAmount}
                  onChange={(e) => setSpecialAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full p-2.5 bg-white border border-purple-300 rounded-xl text-purple-900 font-bold focus:border-purple-600 focus:outline-none shadow-2xs"
                />
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold">Calculated Department Group:</span>
            <span className="font-bold text-slate-900">
              {currentCluster.cluster || (isClusterTech ? 'Computing & Tech Cluster (CS / AI / CFS)' : 'Commerce & Management Cluster (B.Com / BBA)')}
            </span>
          </div>
        </div>

        {/* Right 1 Col: Live Quotation Summary Card */}
        <div className="bg-gradient-to-b from-blue-50/70 to-indigo-50/70 border border-blue-200 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="border-b border-blue-200 pb-3">
            <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Fee Assessment</span>
            <h4 className="text-base font-extrabold text-slate-900 mt-0.5">{calcDept} Program</h4>
            <p className="text-[11px] text-slate-500 font-medium">{scholarshipLabel}</p>
          </div>

          <div className="space-y-2.5 text-xs">
            {calcPeriod !== 'sem2' && (
              <div className="flex justify-between text-slate-600">
                <span>Registration Fee:</span>
                <span className="font-bold text-slate-900 font-mono">₹{periodReg.toLocaleString()}</span>
              </div>
            )}
            {calcPeriod !== 'sem2' && (
              <div className="flex justify-between text-slate-600">
                <span>Semester I Fee:</span>
                <span className="font-bold text-slate-900 font-mono">₹{periodSem1.toLocaleString()}</span>
              </div>
            )}
            {calcPeriod !== 'sem1' && (
              <div className="flex justify-between text-slate-600">
                <span>Semester II Fee:</span>
                <span className="font-bold text-slate-900 font-mono">₹{periodSem2.toLocaleString()}</span>
              </div>
            )}

            {totalSavings > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span>Scholarship Concession:</span>
                <span className="font-mono font-bold">- ₹{totalSavings.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-blue-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Net Payable ({calcPeriod === 'year' ? 'Annual' : calcPeriod === 'sem1' ? 'Sem 1' : 'Sem 2'}):
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-blue-900 font-mono">
                ₹{periodTotalPayable.toLocaleString()}
              </span>
              <button
                onClick={handlePrintStructureSlip}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Get Slip
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 5. ACADEMIC EVALUATION COMPONENTS */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Academic Evaluation Structure</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal assessments and grading parameters applicable to all enrolled UG candidates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900">1. Internal Examination I</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">Mid-Term</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Continuous assessment covering initial 2 modules of syllabus.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900">2. Internal Examination II</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">Pre-Final</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Advanced continuous assessment covering extended syllabus and practical applications.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900">3. Model Examination</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">Model Exam</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Comprehensive full-syllabus simulation before university end-semester boards.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-amber-900">4. Assignment Submissions</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-800">Assignment</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Case studies, analytical problem sets, and periodic topic writeups assessed per subject.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-rose-900">5. Seminar Presentation</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-800">Seminar</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Oral technical delivery, slide deck evaluation, and peer discussion sessions.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-teal-900">6. Project Work / Viva</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-200 text-teal-800">Project</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Capstone department projects, software development prototypes, or empirical commerce studies.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SYNCHRONIZED EDIT FEE STRUCTURE MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <ModalPortal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6 animate-in zoom-in-95 my-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                    Edit Institutional Fee Structure
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                      Syncs across Super Admin, Office & Accounts
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modifying as: <strong className="text-slate-800">{userRole}</strong> ({currentUser?.name || 'Staff User'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFeeStructure} className="space-y-6">
              {/* Academic Year Field */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-0.5">Academic Session Year</label>
                  <p className="text-[11px] text-slate-500">Current active fee regulation cycle</p>
                </div>
                <input
                  type="text"
                  value={editAcademicYear}
                  onChange={(e) => setEditAcademicYear(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 max-w-xs focus:outline-none focus:border-blue-600"
                  placeholder="2025–2026"
                />
              </div>

              {/* UG Clusters Fees */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>1. Undergraduate Department Cluster Schedules</span>
                </h4>

                <div className="grid grid-cols-1 gap-4">
                  {editClusters.map((cluster, cIdx) => {
                    const reg = Number(cluster.registrationFee) || 0;
                    const s1 = Number(cluster.sem1Fee) || 0;
                    const s2 = Number(cluster.sem2Fee) || 0;
                    const total = reg + s1 + s2;

                    return (
                      <div key={cIdx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black text-slate-900">{cluster.cluster}</span>
                            <span className="ml-2 text-[11px] text-slate-500">({cluster.departments.join(', ')})</span>
                          </div>
                          <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-mono">
                            Total: ₹{total.toLocaleString()} / Year
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Registration Fee (₹)</label>
                            <input
                              type="number"
                              min={0}
                              value={cluster.registrationFee}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditClusters(prev => {
                                  const copy = [...prev];
                                  copy[cIdx].registrationFee = val;
                                  copy[cIdx].totalAnnualFee = val + copy[cIdx].sem1Fee + copy[cIdx].sem2Fee;
                                  return copy;
                                });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Semester I Fee (₹)</label>
                            <input
                              type="number"
                              min={0}
                              value={cluster.sem1Fee}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditClusters(prev => {
                                  const copy = [...prev];
                                  copy[cIdx].sem1Fee = val;
                                  copy[cIdx].totalAnnualFee = copy[cIdx].registrationFee + val + copy[cIdx].sem2Fee;
                                  return copy;
                                });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Semester II Fee (₹)</label>
                            <input
                              type="number"
                              min={0}
                              value={cluster.sem2Fee}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditClusters(prev => {
                                  const copy = [...prev];
                                  copy[cIdx].sem2Fee = val;
                                  copy[cIdx].totalAnnualFee = copy[cIdx].registrationFee + copy[cIdx].sem1Fee + val;
                                  return copy;
                                });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scholarship Slabs */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>2. Merit & Welfare Scholarship Discount Slabs</span>
                </h4>

                <div className="space-y-2.5">
                  {editScholarships.map((slab, sIdx) => (
                    <div key={slab.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900">{slab.criteria}</span>
                        <p className="text-[10.5px] text-slate-500 truncate">{slab.detail}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {slab.discountPercent !== null && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-500">Discount:</span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={slab.discountPercent}
                              onChange={(e) => {
                                const pct = Number(e.target.value);
                                setEditScholarships(prev => {
                                  const copy = [...prev];
                                  copy[sIdx].discountPercent = pct;
                                  return copy;
                                });
                              }}
                              className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 text-center focus:outline-none focus:border-blue-600"
                            />
                            <span className="text-xs font-bold text-slate-600">%</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500">Sem I Display:</span>
                          <input
                            type="text"
                            value={slab.sem1Display}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditScholarships(prev => {
                                const copy = [...prev];
                                copy[sIdx].sem1Display = val;
                                copy[sIdx].sem2Display = val;
                                return copy;
                              });
                            }}
                            className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Reset to Defaults</span>
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Syncing Across Roles...' : 'Save & Sync Changes'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
