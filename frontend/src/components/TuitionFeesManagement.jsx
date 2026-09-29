import React, { useState } from 'react';
import { FileText, Save, Info, Award, Building2, CheckCircle2, Sparkles } from 'lucide-react';

export default function TuitionFeesManagement({ 
  entryFormData, 
  setEntryFormData, 
  handleSaveEntrySubmit 
}) {
  const [feeComponent, setFeeComponent] = useState('Sem1');
  const [concessionCategory, setConcessionCategory] = useState('none');

  // Auto-calculate fee based on department, component, and scholarship slab
  const handleCalculateFee = (selectedCourse, component, concession) => {
    const isTech = ['CS', 'AI', 'CFS'].includes(selectedCourse);
    const regFee = isTech ? 8000 : 7000;
    const baseSemFee = 10000;

    let semPayable = baseSemFee;
    if (concession === 'marks_550') semPayable = 0;
    else if (concession === 'marks_500') semPayable = 2500;
    else if (concession === 'marks_450') semPayable = 5000;
    else if (concession === 'marks_400') semPayable = 7500;
    else if (concession === 'single_parent') semPayable = 7500;
    else if (concession === 'disabled') semPayable = 7500;
    else if (concession === 'special') semPayable = 5000;

    let total = 0;
    if (component === 'Reg') total = regFee;
    else if (component === 'Sem1') total = semPayable;
    else if (component === 'Sem2') total = semPayable;
    else if (component === 'FullYear') total = regFee + (semPayable * 2);

    setEntryFormData(prev => ({
      ...prev,
      course: selectedCourse,
      amount: String(total),
      balance: '0'
    }));
  };

  const onCourseChange = (e) => {
    const course = e.target.value;
    handleCalculateFee(course, feeComponent, concessionCategory);
  };

  const onComponentChange = (e) => {
    const comp = e.target.value;
    setFeeComponent(comp);
    handleCalculateFee(entryFormData.course || 'B.Com', comp, concessionCategory);
  };

  const onConcessionChange = (e) => {
    const conc = e.target.value;
    setConcessionCategory(conc);
    handleCalculateFee(entryFormData.course || 'B.Com', feeComponent, conc);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      
      {/* LEFT 3 COLS: TUITION FEE ENTRY FORM */}
      <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Add Tuition Fee Entry (UG 5 Departments)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record tuition and registration fee payments aligned with the 2025–2026 institutional matrix.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveEntrySubmit} className="space-y-5 text-xs">
          
          {/* ROW 1: Student, Roll No., Course, Academic Year, Fee Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Student <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={entryFormData.studentName}
                onChange={(e) => setEntryFormData({...entryFormData, studentName: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                placeholder="Enter student name"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Roll No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={entryFormData.rollNo}
                onChange={(e) => setEntryFormData({...entryFormData, rollNo: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                placeholder="e.g., STU002"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                UG Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={entryFormData.course}
                onChange={onCourseChange}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
                required
              >
                <option value="">Select department...</option>
                <option value="B.Com">B.Com (Commerce) - Standard ₹27,000</option>
                <option value="BBA">BBA (Management) - Standard ₹27,000</option>
                <option value="CS">CS (Computer Science) - Standard ₹28,000</option>
                <option value="AI">AI (Artificial Intelligence) - Standard ₹28,000</option>
                <option value="CFS">CFS (Cyber Forensic) - Standard ₹28,000</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Academic Year <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={entryFormData.academicYear || '2025 - 2026'}
                onChange={(e) => setEntryFormData({...entryFormData, academicYear: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                placeholder="2025 - 2026"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Fee Type
              </label>
              <input
                type="text"
                value="Tuition Fees"
                readOnly
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold shadow-2xs cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* ROW 2: Fee Component & Scholarship Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
            <div>
              <label className="block text-slate-800 font-bold mb-1.5">
                Fee Component
              </label>
              <select
                value={feeComponent}
                onChange={onComponentChange}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-semibold focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="Sem1">Semester I Fee (Base ₹10,000)</option>
                <option value="Sem2">Semester II Fee (Base ₹10,000)</option>
                <option value="Reg">Registration Fee (B.Com/BBA: ₹7K, CS/AI/CFS: ₹8K)</option>
                <option value="FullYear">Full Academic Year (Reg + Sem I + Sem II)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1.5 flex items-center justify-between">
                <span>Scholarship / Concession Slab</span>
                <span className="text-[10px] text-blue-600 font-bold">Auto-discount applied</span>
              </label>
              <select
                value={concessionCategory}
                onChange={onConcessionChange}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-semibold focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="none">No Scholarship (Full Base Fee)</option>
                <option value="marks_550">Marks &gt; 550 (100% Scholarship - Free Tuition ₹0)</option>
                <option value="marks_500">Marks &gt; 500 (75% Scholarship - Sem Fee ₹2,500)</option>
                <option value="marks_450">Marks &gt; 450 (50% Scholarship - Sem Fee ₹5,000)</option>
                <option value="marks_400">Marks &gt; 400 (25% Scholarship - Sem Fee ₹7,500)</option>
                <option value="single_parent">Single Parent Quota (25% Concession - Sem Fee ₹7,500)</option>
                <option value="disabled">Disabled / Inclusion Quota (25% Concession - Sem Fee ₹7,500)</option>
                <option value="special">Special Scholar (Discretionary Allowance)</option>
              </select>
            </div>
          </div>

          {/* ROW 3: Due Date, Amount, Fine */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={entryFormData.dueDate || ''}
                onChange={(e) => setEntryFormData({...entryFormData, dueDate: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                <span>Calculated Amount (₹) <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-emerald-600 font-bold">From Fee Matrix</span>
              </label>
              <input
                type="number"
                value={entryFormData.amount || ''}
                onChange={(e) => setEntryFormData({...entryFormData, amount: e.target.value})}
                className="w-full p-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-emerald-950 font-black text-sm focus:border-emerald-500 focus:outline-none shadow-2xs"
                placeholder="10000"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Fine (₹)
              </label>
              <input
                type="number"
                value={entryFormData.fine || '0'}
                onChange={(e) => setEntryFormData({...entryFormData, fine: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                placeholder="0"
              />
              <p className="text-[10px] text-slate-400 mt-1">Enter late fee fine if any</p>
            </div>
          </div>

          {/* ROW 4: Payment Mode, Payment Date, Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Payment Mode <span className="text-rose-500">*</span>
              </label>
              <select
                value={entryFormData.paymentMode || 'UPI'}
                onChange={(e) => setEntryFormData({...entryFormData, paymentMode: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
                required
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Cash">Cash at Counter</option>
                <option value="Online">Online NetBanking</option>
                <option value="Bank">Bank Challan / NEFT</option>
                <option value="Card">Debit / Credit Card</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={entryFormData.paymentDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => setEntryFormData({...entryFormData, paymentDate: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Balance (₹)
              </label>
              <input
                type="number"
                value={entryFormData.balance || '0'}
                onChange={(e) => setEntryFormData({...entryFormData, balance: e.target.value})}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:border-blue-500 focus:outline-none shadow-2xs"
                placeholder="0"
                readOnly
              />
              <p className="text-[10px] text-slate-400 mt-1">Auto calculated</p>
            </div>
          </div>

          {/* BOTTOM ROW: Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all text-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Tuition Entry</span>
            </button>
          </div>

        </form>

      </div>

      {/* RIGHT 1 COL: OFFICIAL FEE MATRIX REFERENCE PANEL */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
          <Building2 className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            UG Fee Matrix (5 Depts)
          </h3>
        </div>
        
        {/* Department Cluster Quick Summary */}
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-1">
            <div className="flex justify-between font-bold text-slate-900">
              <span>B.Com &amp; BBA</span>
              <span className="text-blue-600">₹27,000 / yr</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Reg: ₹7,000 • Sem I: ₹10,000 • Sem II: ₹10,000
            </p>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-1">
            <div className="flex justify-between font-bold text-slate-900">
              <span>CS, AI &amp; CFS</span>
              <span className="text-purple-600">₹28,000 / yr</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Reg: ₹8,000 • Sem I: ₹10,000 • Sem II: ₹10,000
            </p>
          </div>
        </div>

        {/* Scholarship Slab Quick Reference */}
        <div className="pt-2 border-t border-slate-200 space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
            Scholarship Slabs (Sem Fee)
          </span>
          <div className="space-y-1.5 text-[11px] text-slate-600">
            <div className="flex justify-between">
              <span>Marks &gt; 550 (100%):</span>
              <strong className="text-emerald-600">₹0 (Free)</strong>
            </div>
            <div className="flex justify-between">
              <span>Marks &gt; 500 (75%):</span>
              <strong className="text-slate-900">₹2,500</strong>
            </div>
            <div className="flex justify-between">
              <span>Marks &gt; 450 (50%):</span>
              <strong className="text-slate-900">₹5,000</strong>
            </div>
            <div className="flex justify-between">
              <span>Marks &gt; 400 (25%):</span>
              <strong className="text-slate-900">₹7,500</strong>
            </div>
            <div className="flex justify-between">
              <span>Single Parent (25%):</span>
              <strong className="text-slate-900">₹7,500</strong>
            </div>
            <div className="flex justify-between">
              <span>Disabled Quota (25%):</span>
              <strong className="text-slate-900">₹7,500</strong>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center gap-2 text-[10px] text-slate-500 font-medium">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>Select department and slab in the form to auto-compute amounts.</span>
        </div>
      </div>

    </div>
  );
}
