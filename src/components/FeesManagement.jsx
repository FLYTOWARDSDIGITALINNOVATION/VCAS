import React, { useState, useMemo } from 'react';
import { 
  IndianRupee, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Eye, 
  CreditCard,
  Building,
  Users,
  X,
  Printer
} from 'lucide-react';
import ModalPortal from './ModalPortal';

const INITIAL_TRANSACTIONS = [
  { id: 1, receiptNo: 'REC-2025-0891', studentName: 'Aditya Kapoor', rollNo: 'VCAS22CS001', dept: 'CS', amount: 45000, feeType: 'Semester Tuition Fee', mode: 'Online UPI', date: '2025-04-28', status: 'Paid' },
  { id: 2, receiptNo: 'REC-2025-0892', studentName: 'Priya Mehta', rollNo: 'VCAS23EC014', dept: 'ECE', amount: 45000, feeType: 'Semester Tuition Fee', mode: 'NetBanking', date: '2025-04-28', status: 'Paid' },
  { id: 3, receiptNo: 'REC-2025-0893', studentName: 'Rahul Dravid K', rollNo: 'VCAS22ME045', dept: 'Mech', amount: 22500, feeType: 'Hostel & Mess Fee', mode: 'Demand Draft', date: '2025-04-27', status: 'Paid' },
  { id: 4, receiptNo: 'REC-2025-0894', studentName: 'Sneha Patel', rollNo: 'VCAS24MB002', dept: 'MBA', amount: 65000, feeType: 'MBA Trimester Fee', mode: 'Credit Card', date: '2025-04-26', status: 'Paid' },
  { id: 5, receiptNo: 'DUE-2025-0102', studentName: 'Vikramaditya Rao', rollNo: 'VCAS23CS045', dept: 'CS', amount: 35000, feeType: 'Tuition Fee Balance', mode: 'Pending', date: 'Due May 10', status: 'Pending' },
  { id: 6, receiptNo: 'DUE-2025-0103', studentName: 'Harish K', rollNo: 'VCAS23CV031', dept: 'Civil', amount: 45000, feeType: 'Semester Tuition Fee', mode: 'Overdue', date: 'Overdue (Apr 15)', status: 'Overdue' }
];

export default function FeesManagement() {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Lock background scroll when modal is open
  React.useEffect(() => {
    const scrollContainer = document.getElementById('main-content-scroll-container');
    if (showCollectModal) {
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
  }, [showCollectModal]);

  const [collectForm, setCollectForm] = useState({
    studentName: '',
    rollNo: '',
    dept: 'CS',
    amount: '',
    feeType: 'Semester Tuition Fee',
    mode: 'Online UPI'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = t.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.receiptNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = selectedStatus === 'All' || t.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [transactions, searchTerm, selectedStatus]);

  const handleSaveCollect = (e) => {
    e.preventDefault();
    const newTx = {
      ...collectForm,
      id: Date.now(),
      receiptNo: `REC-2025-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: Number(collectForm.amount) || 0,
      date: new Date().toISOString().split('T')[0],
      status: 'Paid'
    };
    setTransactions([newTx, ...transactions]);
    setShowCollectModal(false);
    showToast(`Fee receipt generated for ₹${collectForm.amount.toLocaleString()}!`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Finance & Fee Collection</h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage student fee billings, record counter payments, issue receipts, and track pending dues
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCollectModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Collect / Record Fee</span>
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Total Collected</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">₹7.22 Cr</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Pending Dues</p>
          <p className="text-2xl font-black text-amber-600 mt-1">₹1.20 Cr</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Today's Receipts</p>
          <p className="text-2xl font-black text-blue-600 mt-1">₹1.85 L</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Overdue Students</p>
          <p className="text-2xl font-black text-rose-600 mt-1">42</p>
        </div>
      </div>

      {/* SEARCH AND FILTER */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student, roll number, receipt..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none"
        >
          <option value="All">All Transactions</option>
          <option value="Paid">Paid Receipts</option>
          <option value="Pending">Pending Dues</option>
          <option value="Overdue">Overdue Penalties</option>
        </select>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Receipt / Ref</th>
                <th className="py-3.5 px-4">Student & Dept</th>
                <th className="py-3.5 px-4">Fee Head</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment Mode</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.receiptNo}</td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{t.studentName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{t.rollNo} • {t.dept}</p>
                  </td>
                  <td className="py-3 px-4">{t.feeType}</td>
                  <td className="py-3 px-4 font-black text-slate-900">₹{t.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-600">{t.mode}</td>
                  <td className="py-3 px-4 text-slate-500">{t.date}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                      t.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => showToast(`Printing receipt ${t.receiptNo}...`)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                      title="Print receipt"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* COLLECT FEE MODAL */}
      {showCollectModal && (
        <ModalPortal isOpen={showCollectModal} onClose={() => setShowCollectModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-4 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Record Fee Collection</h3>
              <button onClick={() => setShowCollectModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCollect} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student Name *</label>
                <input
                  type="text"
                  required
                  value={collectForm.studentName}
                  onChange={(e) => setCollectForm({ ...collectForm, studentName: e.target.value })}
                  placeholder="e.g. Aditya Kapoor"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={collectForm.rollNo}
                    onChange={(e) => setCollectForm({ ...collectForm, rollNo: e.target.value })}
                    placeholder="VCAS22CS001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={collectForm.dept}
                    onChange={(e) => setCollectForm({ ...collectForm, dept: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="CS">CS</option>
                    <option value="ECE">ECE</option>
                    <option value="Mech">Mech</option>
                    <option value="MBA">MBA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={collectForm.amount}
                  onChange={(e) => setCollectForm({ ...collectForm, amount: e.target.value })}
                  placeholder="45000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fee Type</label>
                  <select
                    value={collectForm.feeType}
                    onChange={(e) => setCollectForm({ ...collectForm, feeType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Semester Tuition Fee">Semester Tuition</option>
                    <option value="Hostel & Mess Fee">Hostel & Mess</option>
                    <option value="Transport Bus Fee">Transport Bus</option>
                    <option value="Exam Fee">Exam Fee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={collectForm.mode}
                    onChange={(e) => setCollectForm({ ...collectForm, mode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Online UPI">Online UPI</option>
                    <option value="NetBanking">NetBanking</option>
                    <option value="Cash / Counter">Cash Counter</option>
                    <option value="Demand Draft">Demand Draft</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Confirm & Print
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
