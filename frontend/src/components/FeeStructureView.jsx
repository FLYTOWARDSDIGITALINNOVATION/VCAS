import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';

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
      'B.Sc Cyber Forensic & Security (CFS)'
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

export default function FeeStructureView() {
  // Calculator state
  const [calcDept, setCalcDept] = useState('B.Com');
  const [calcScholarship, setCalcScholarship] = useState('none');
  const [specialAmount, setSpecialAmount] = useState(5000);
  const [calcPeriod, setCalcPeriod] = useState('year'); // 'year', 'sem1', 'sem2'

  // Lookups
  const isClusterTech = ['CS', 'AI', 'CFS'].includes(calcDept);
  const registrationFee = isClusterTech ? 8000 : 7000;
  const baseSem1 = 10000;
  const baseSem2 = 10000;

  let sem1Payable = baseSem1;
  let sem2Payable = baseSem2;
  let scholarshipLabel = 'No Concession (Standard)';
  let totalSavings = 0;

  if (calcScholarship === 'marks_550') {
    sem1Payable = 0;
    sem2Payable = 0;
    scholarshipLabel = '100% Scholarship (Marks > 550)';
    totalSavings = 20000;
  } else if (calcScholarship === 'marks_500') {
    sem1Payable = 2500;
    sem2Payable = 2500;
    scholarshipLabel = '75% Scholarship (Marks > 500)';
    totalSavings = 15000;
  } else if (calcScholarship === 'marks_450') {
    sem1Payable = 5000;
    sem2Payable = 5000;
    scholarshipLabel = '50% Scholarship (Marks > 450)';
    totalSavings = 10000;
  } else if (calcScholarship === 'marks_400') {
    sem1Payable = 7500;
    sem2Payable = 7500;
    scholarshipLabel = '25% Scholarship (Marks > 400)';
    totalSavings = 5000;
  } else if (calcScholarship === 'single_parent') {
    sem1Payable = 7500;
    sem2Payable = 7500;
    scholarshipLabel = '25% Concession (Single Parent)';
    totalSavings = 5000;
  } else if (calcScholarship === 'disabled') {
    sem1Payable = 7500;
    sem2Payable = 7500;
    scholarshipLabel = '25% Concession (Differently Abled)';
    totalSavings = 5000;
  } else if (calcScholarship === 'special_scholar') {
    const customDisc = Math.min(20000, Math.max(0, Number(specialAmount) || 0));
    const perSemDisc = customDisc / 2;
    sem1Payable = Math.max(0, baseSem1 - perSemDisc);
    sem2Payable = Math.max(0, baseSem2 - perSemDisc);
    scholarshipLabel = `Special Scholar Grant (₹${customDisc.toLocaleString()})`;
    totalSavings = customDisc;
  }

  // Calculate Net based on period
  let periodReg = calcPeriod === 'sem2' ? 0 : registrationFee;
  let periodSem1 = calcPeriod === 'sem2' ? 0 : sem1Payable;
  let periodSem2 = calcPeriod === 'sem1' ? 0 : sem2Payable;
  let periodTotalPayable = periodReg + periodSem1 + periodSem2;
  let periodStandardBase = (calcPeriod === 'sem2' ? 0 : registrationFee) + 
                          (calcPeriod === 'sem2' ? 0 : baseSem1) + 
                          (calcPeriod === 'sem1' ? 0 : baseSem2);

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
          <div class="sub">Autonomous Institution • Affiliated with MS University • Vellalankulam</div>
          <div class="badge">Official UG Fee Structure & Scholarship Quotation (2025–2026)</div>
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
            <span>Semester I Tuition Fee (Base ₹10,000)</span>
            <strong>₹${periodSem1.toLocaleString()}</strong>
          </div>
          <div class="quote-row">
            <span>Semester II Tuition Fee (Base ₹10,000)</span>
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
            <tr>
              <td><strong>B.Com, BBA</strong></td>
              <td>₹7,000</td>
              <td>₹10,000</td>
              <td>₹10,000</td>
              <td><strong>₹27,000</strong></td>
            </tr>
            <tr>
              <td><strong>CS, AI, CFS</strong></td>
              <td>₹8,000</td>
              <td>₹10,000</td>
              <td>₹10,000</td>
              <td><strong>₹28,000</strong></td>
            </tr>
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
              <th>Annual Total</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Marks > 550</td><td>100%</td><td>₹0</td><td>₹0</td><td>₹0</td></tr>
            <tr><td>Marks > 500</td><td>75%</td><td>₹2,500</td><td>₹2,500</td><td>₹5,000</td></tr>
            <tr><td>Marks > 450</td><td>50%</td><td>₹5,000</td><td>₹5,000</td><td>₹10,000</td></tr>
            <tr><td>Marks > 400</td><td>25%</td><td>₹7,500</td><td>₹7,500</td><td>₹15,000</td></tr>
            <tr><td>Single Parent Quota</td><td>25%</td><td>₹7,500</td><td>₹7,500</td><td>₹15,000</td></tr>
            <tr><td>Disabled / Inclusion Quota</td><td>25%</td><td>₹7,500</td><td>₹7,500</td><td>₹15,000</td></tr>
            <tr><td>Special Scholar</td><td>Custom</td><td>Variable</td><td>Variable</td><td>Discretionary</td></tr>
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
          This document is generated by Vivekananda College Accounts & Admissions System. Valid for academic year 2025–2026.
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
      
      {/* 1. TOP HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold border border-white/10 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Official Institutional Matrix (2025–2026)</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
            UG Fee Structure & Scholarship Slabs
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Standardised fee schedule across the <strong>5 Undergraduate Departments</strong>, including Registration, Semester I, Semester II, and official Merit & Welfare concessions.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
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
          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            5 Core UG Programs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {UG_FEE_STRUCTURE.map((cluster, i) => (
            <div 
              key={i} 
              className={`bg-white rounded-3xl border ${cluster.borderColor} p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between`}
            >
              <div className="space-y-4">
                {/* Cluster Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {cluster.cluster}
                  </span>
                  <span className="px-3 py-1 rounded-xl text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200">
                    {cluster.badge}
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

                {/* Fee Breakdown Breakdown Grid */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Registration</span>
                    <span className="text-sm font-extrabold text-slate-900">₹{cluster.registrationFee.toLocaleString()}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Semester I</span>
                    <span className="text-sm font-extrabold text-slate-900">₹{cluster.sem1Fee.toLocaleString()}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Semester II</span>
                    <span className="text-sm font-extrabold text-slate-900">₹{cluster.sem2Fee.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Total Card Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Total Annual Payable:</span>
                <span className="text-lg font-black text-slate-900">₹{cluster.totalAnnualFee.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SCHOLARSHIP & FEE CONCESSION SLAB (FROM HANDWRITTEN SHEET) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Scholarship & Fee Concession Slab</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Concessions applied directly to Semester I & Semester II tuition fees (Base: ₹10,000/sem)
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Merit & Social Welfare</span>
          </span>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">MARKS / CATEGORY</th>
                <th className="py-3.5 px-4">ELIGIBILITY CRITERIA</th>
                <th className="py-3.5 px-4 text-center">CONCESSION</th>
                <th className="py-3.5 px-4 text-right">SEM I FEE</th>
                <th className="py-3.5 px-4 text-right">SEM II FEE</th>
                <th className="py-3.5 px-4 text-right">ANNUAL SAVINGS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {SCHOLARSHIP_SLABS.map((slab) => (
                <tr key={slab.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black border ${slab.badgeColor}`}>
                      {slab.criteria}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {slab.detail}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-extrabold text-slate-900">
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
                <option value="B.Com">B.Com (Commerce) - Standard ₹27,000</option>
                <option value="BBA">BBA (Management) - Standard ₹27,000</option>
                <option value="CS">B.Sc Computer Science (CS) - Standard ₹28,000</option>
                <option value="AI">B.Sc Artificial Intelligence (AI) - Standard ₹28,000</option>
                <option value="CFS">B.Sc Cyber Forensic & Security (CFS) - Standard ₹28,000</option>
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
                <option value="marks_550">Marks &gt; 550 (100% Scholarship - Free Tuition)</option>
                <option value="marks_500">Marks &gt; 500 (75% Scholarship - ₹2,500/sem)</option>
                <option value="marks_450">Marks &gt; 450 (50% Scholarship - ₹5,000/sem)</option>
                <option value="marks_400">Marks &gt; 400 (25% Scholarship - ₹7,500/sem)</option>
                <option value="single_parent">Single Parent Quota (25% Concession - ₹7,500/sem)</option>
                <option value="disabled">Disabled / Differently Abled Quota (25% Concession - ₹7,500/sem)</option>
                <option value="special_scholar">Special Scholar (Discretionary Allowance)</option>
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
              {isClusterTech ? 'Computing & Tech Cluster (CS / AI / CFS)' : 'Commerce & Management Cluster (B.Com / BBA)'}
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
                <span className="font-bold text-slate-900 font-mono">₹{registrationFee.toLocaleString()}</span>
              </div>
            )}
            {calcPeriod !== 'sem2' && (
              <div className="flex justify-between text-slate-600">
                <span>Semester I Fee:</span>
                <span className="font-bold text-slate-900 font-mono">₹{sem1Payable.toLocaleString()}</span>
              </div>
            )}
            {calcPeriod !== 'sem1' && (
              <div className="flex justify-between text-slate-600">
                <span>Semester II Fee:</span>
                <span className="font-bold text-slate-900 font-mono">₹{sem2Payable.toLocaleString()}</span>
              </div>
            )}

            {totalSavings > 0 && (
              <div className="flex justify-between text-emerald-700 bg-emerald-100/70 p-2 rounded-xl font-bold border border-emerald-200">
                <span>Scholarship Benefit:</span>
                <span className="font-mono">- ₹{totalSavings.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-blue-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Net Dues</span>
              <span className="text-2xl font-black text-blue-900 font-mono leading-none">
                ₹{periodTotalPayable.toLocaleString()}
              </span>
            </div>
            <button
              onClick={handlePrintStructureSlip}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
              title="Print Calculation Slip"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* 5. ACADEMIC INTERNAL ASSESSMENT SCHEME (FROM SHEET BOTTOM) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Academic Internal Assessment & Evaluation Scheme
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Continuous evaluation framework mapped across semester curriculum</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Standard Pattern
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          
          {/* Continuous Internal Examinations */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900">1. Internal Examination I</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">Intern I</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Mid-term continuous assessment covering initial units with analytical written evaluations.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900">2. Internal Examination II</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">Intern II</span>
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
              Comprehensive full-syllabus simulation before autonomous end-semester university boards.
            </p>
          </div>

          {/* Practical & Continuous Components */}
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

    </div>
  );
}
