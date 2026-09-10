import React from 'react';
import { FileText, Save } from 'lucide-react';

export default function ExamFeesManagement({ 
  entryFormData, 
  setEntryFormData, 
  handleSaveEntrySubmit 
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
      
      {/* Form Header */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            Add Exam Fees Entry
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter the details to record exam fees for the student.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSaveEntrySubmit} className="space-y-6 text-xs">
        
        {/* ROW 1: Student, Roll No., Course, Academic Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Student */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Student <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={entryFormData.studentName}
              onChange={(e) => setEntryFormData({...entryFormData, studentName: e.target.value})}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
              placeholder="Enter student name (e.g., Priya Mehta)"
              required
            />
          </div>

          {/* Roll No */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Roll No. <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={entryFormData.rollNo}
              onChange={(e) => setEntryFormData({...entryFormData, rollNo: e.target.value})}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
              placeholder="Enter Roll No. (e.g., STU002)"
              required
            />
          </div>

          {/* Course */}
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
              <option value="B.Tech ECE">B.Tech ECE</option>
              <option value="B.Tech CS">B.Tech CS</option>
              <option value="MBA">MBA</option>
              <option value="MCA">MCA</option>
              <option value="B.Tech Mech">B.Tech Mech</option>
            </select>
          </div>

          {/* Academic Year */}
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

        </div>

        {/* ROW 2: Fee Type, Amount, Due Date, Fine */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Fee Type */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Fee Type <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value="Exam Fees"
              readOnly
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold shadow-2xs cursor-not-allowed select-none"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={entryFormData.amount}
              onChange={(e) => setEntryFormData({...entryFormData, amount: e.target.value})}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:border-blue-500 focus:outline-none shadow-2xs"
              placeholder="e.g. 5000"
              required
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Due Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={entryFormData.dueDate}
                onChange={(e) => setEntryFormData({...entryFormData, dueDate: e.target.value})}
                className="w-full p-2.5 pr-8 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                required
              />
            </div>
          </div>

          {/* Fine */}
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

        {/* ROW 3: Payment Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Payment Mode */}
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
              <option value="Online">Online</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
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
  );
}
