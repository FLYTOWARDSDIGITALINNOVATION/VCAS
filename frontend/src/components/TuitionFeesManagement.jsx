import React from 'react';
import { FileText, Save, Info } from 'lucide-react';

export default function TuitionFeesManagement({ 
  entryFormData, 
  setEntryFormData, 
  handleSaveEntrySubmit 
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      
      {/* LEFT 3 COLS: TUITION FEE ENTRY FORM */}
      <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Add Tuition Fee Entry
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter the details to record tuition fee payment.
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
                placeholder="e.g., STU004"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Course <span className="text-rose-500">*</span>
              </label>
              <select
                value={entryFormData.course}
                onChange={(e) => setEntryFormData({...entryFormData, course: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                required
              >
                <option value="">Select course...</option>
                <option value="B.Tech Mech">B.Tech Mech</option>
                <option value="B.Tech ECE">B.Tech ECE</option>
                <option value="B.Tech CS">B.Tech CS</option>
                <option value="MBA">MBA</option>
                <option value="MCA">MCA</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Academic Year <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={entryFormData.academicYear}
                onChange={(e) => setEntryFormData({...entryFormData, academicYear: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                placeholder="e.g., 2024 - 2025"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Fee Type <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value="Tuition Fees"
                readOnly
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold shadow-2xs cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* ROW 2: Due Date, Amount, Fine */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={entryFormData.dueDate}
                onChange={(e) => setEntryFormData({...entryFormData, dueDate: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={entryFormData.amount}
                onChange={(e) => setEntryFormData({...entryFormData, amount: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:border-blue-500 focus:outline-none shadow-2xs"
                placeholder="5000"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Fine (₹)
              </label>
              <input
                type="number"
                value={entryFormData.fine}
                onChange={(e) => setEntryFormData({...entryFormData, fine: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                placeholder="0"
              />
              <p className="text-[10px] text-slate-400 mt-1">Enter fine amount if any</p>
            </div>
          </div>

          {/* ROW 3: Payment Mode, Payment Date, Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Payment Mode <span className="text-rose-500">*</span>
              </label>
              <select
                value={entryFormData.paymentMode}
                onChange={(e) => setEntryFormData({...entryFormData, paymentMode: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                required
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
                <option value="Bank">Bank</option>
                <option value="Card">Card</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={entryFormData.paymentDate}
                onChange={(e) => setEntryFormData({...entryFormData, paymentDate: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Balance (₹)
              </label>
              <input
                type="number"
                value={entryFormData.balance}
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
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all text-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Entry</span>
            </button>
          </div>

        </form>

      </div>

      {/* RIGHT 1 COL: FIELD EXPLANATION SIDEBAR PANEL */}
      <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-6 space-y-4 shadow-xs">
        <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-3">
          FIELD EXPLANATION
        </h3>
        
        <ul className="space-y-2.5 text-[11px] text-slate-600 leading-relaxed">
          <li>
            <strong className="text-slate-900 font-bold">• Student <span className="text-rose-500">*</span></strong>: Select the student.
          </li>
          <li>
            <strong className="text-slate-900 font-bold">• Roll No. <span className="text-rose-500">*</span></strong>: Enter student roll number.
          </li>
          <li>
            <strong className="text-slate-900 font-bold">• Course <span className="text-rose-500">*</span></strong>: Select the student's course.
          </li>
          <li>
            <strong className="text-slate-900 font-bold">• Academic Year <span className="text-rose-500">*</span></strong>: Enter the academic year.
          </li>
          <li>
            <strong className="text-slate-900 font-bold">• Due Date <span className="text-rose-500">*</span></strong>: Due date for the payment.
          </li>
          <li>
            <strong className="text-slate-900 font-bold">• Amount (₹) <span className="text-rose-500">*</span></strong>: Enter tuition fee if applicable.
          </li>
          <li>
            <strong className="text-slate-900 font-bold">• Fine (₹)</strong>: Fine if applicable.
          </li>
          <li>
            <strong className="text-slate-900 font-bold">• Payment Mode <span className="text-rose-500">*</span></strong>: Cash / UPI / Online / Bank / Card
          </li>
          <li>
            <strong className="text-slate-900 font-bold">• Payment Date <span className="text-rose-500">*</span></strong>: Date of payment.
          </li>
          <li>
            <strong className="text-slate-900 font-bold">• Balance (₹)</strong>: Remaining balance (auto calculated).
          </li>
        </ul>

        <div className="pt-4 border-t border-blue-100 flex items-center gap-2 text-[10px] text-slate-500 font-medium">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span><strong>Note:</strong> Fields marked with <span className="text-rose-500 font-bold">*</span> are mandatory.</span>
        </div>
      </div>

    </div>
  );
}
