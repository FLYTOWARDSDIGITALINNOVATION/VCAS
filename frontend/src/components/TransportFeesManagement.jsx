import React from 'react';
import { Bus, Save, Info } from 'lucide-react';

export default function TransportFeesManagement({ 
  entryFormData, 
  setEntryFormData, 
  handleSaveEntrySubmit 
}) {
  return (
    <div className="w-full">
      
      {/* TRANSPORT FEE ENTRY FORM */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Add Transport Fee Entry
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter the details to record transport fee payment.
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
                placeholder="e.g., STU008"
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
                <option value="B.Com">B.Com</option>
                <option value="B.Sc CS">B.Sc CS</option>
                <option value="B.A. English">B.A. English</option>
                <option value="BBA">BBA</option>
                <option value="BCA">BCA</option>
                <option value="M.Com">M.Com</option>
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
                value="Transport Fees"
                readOnly
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold shadow-2xs cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* ROW 2: Route / Stop, Transport Vehicle / No., Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Route / Stop <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={entryFormData.routeStop}
                onChange={(e) => setEntryFormData({...entryFormData, routeStop: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                placeholder="e.g., Adyar - Main Campus"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Transport Vehicle / No. <span className="text-rose-500">*</span>
              </label>
              <select
                value={entryFormData.vehicleNo}
                onChange={(e) => setEntryFormData({...entryFormData, vehicleNo: e.target.value})}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                required
              >
                <option value="">Select vehicle...</option>
                <option value="TN 09 AB 1234">TN 09 AB 1234</option>
                <option value="TN 09 AB 5678">TN 09 AB 5678</option>
                <option value="TN 09 AB 9012">TN 09 AB 9012</option>
              </select>
            </div>

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
          </div>

          {/* ROW 3: Amount, Fine, Total Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={entryFormData.amount}
                onChange={(e) => {
                  const val = e.target.value;
                  setEntryFormData(prev => ({
                    ...prev,
                    amount: val,
                    totalAmount: val
                  }));
                }}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:border-blue-500 focus:outline-none shadow-2xs"
                placeholder="800"
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

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                Total Amount (₹)
              </label>
              <input
                type="number"
                value={entryFormData.totalAmount || entryFormData.amount}
                onChange={(e) => setEntryFormData({...entryFormData, totalAmount: e.target.value})}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:border-blue-500 focus:outline-none shadow-2xs"
                placeholder="800"
                readOnly
              />
              <p className="text-[10px] text-slate-400 mt-1">Auto calculated</p>
            </div>
          </div>

          {/* ROW 4: Payment Mode, Payment Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* BOTTOM BLUE NOTE BANNER FOR TRANSPORT */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center gap-3 text-xs text-blue-800 font-medium">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span><strong>Note:</strong> Transport fee is usually collected monthly or term-wise based on the route.</span>
        </div>

      </div>
    </div>
  );
}
