import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../apiConfig';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Printer, 
  Receipt, 
  Trash2, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Tag, 
  User, 
  Building2, 
  Sparkles, 
  X, 
  Download, 
  ShoppingBag,
  PartyPopper,
  GraduationCap,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';

const CATEGORIES = [
  'Events & Functions',
  'Student Supplies & Welfare',
  'Sports & Culturals',
  'Books & Stationery',
  'Lab & Equipment',
  'Refreshments & Food',
  'Maintenance & Operations',
  'Miscellaneous'
];

const CATEGORY_COLORS = {
  'Events & Functions': 'bg-purple-100 text-purple-800 border-purple-200',
  'Student Supplies & Welfare': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Sports & Culturals': 'bg-amber-100 text-amber-800 border-amber-200',
  'Books & Stationery': 'bg-blue-100 text-blue-800 border-blue-200',
  'Lab & Equipment': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Refreshments & Food': 'bg-orange-100 text-orange-800 border-orange-200',
  'Maintenance & Operations': 'bg-slate-100 text-slate-800 border-slate-200',
  'Miscellaneous': 'bg-pink-100 text-pink-800 border-pink-200'
};

export default function ExpenseManagement({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('All');
  const [toastMessage, setToastMessage] = useState(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingExpense, setViewingExpense] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const initialFormState = {
    title: '',
    category: 'Events & Functions',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    spentBy: user?.name || (user?.role === 'Accountant' ? 'Accountant' : 'Office Staff'),
    department: user?.department || 'General',
    recordedBy: user?.name || 'Staff User',
    recordedByRole: user?.role || 'Staff',
    paymentMode: 'Cash',
    receiptNo: `REC-${Date.now().toString().slice(-5)}`,
    vendor: '',
    description: '',
    status: 'Paid',
    academicYear: '2025–2026'
  };

  const [formData, setFormData] = useState(initialFormState);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch expenses from database
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/expenses`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setExpenses(json.data);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(item => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || (
        (item.title && item.title.toLowerCase().includes(term)) ||
        (item.spentBy && item.spentBy.toLowerCase().includes(term)) ||
        (item.vendor && item.vendor.toLowerCase().includes(term)) ||
        (item.receiptNo && item.receiptNo.toLowerCase().includes(term)) ||
        (item.department && item.department.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term))
      );
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesYear = selectedAcademicYear === 'All' || item.academicYear === selectedAcademicYear;
      return matchesSearch && matchesCat && matchesYear;
    });
  }, [expenses, searchTerm, selectedCategory, selectedAcademicYear]);

  // Aggregate Metrics
  const totalExpenditure = useMemo(() => {
    return expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [expenses]);

  const eventsSpending = useMemo(() => {
    return expenses
      .filter(item => item.category === 'Events & Functions' || item.category === 'Sports & Culturals')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [expenses]);

  const studentSuppliesSpending = useMemo(() => {
    return expenses
      .filter(item => item.category === 'Student Supplies & Welfare' || item.category === 'Books & Stationery')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [expenses]);

  const thisMonthSpending = useMemo(() => {
    const now = new Date();
    const currM = now.getMonth();
    const currY = now.getFullYear();
    return expenses
      .filter(item => {
        const d = new Date(item.date);
        return d.getMonth() === currM && d.getFullYear() === currY;
      })
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [expenses]);

  const openAddModal = () => {
    setEditingExpense(null);
    setFormData({
      ...initialFormState,
      receiptNo: `EXP-${Date.now().toString().slice(-5)}`,
      spentBy: user?.name || (user?.role === 'Accountant' ? 'Accountant' : 'Office Staff'),
      recordedBy: user?.name || 'Staff Member',
      recordedByRole: user?.role || 'Staff'
    });
    setShowAddModal(true);
  };

  const openEditModal = (item) => {
    setEditingExpense(item);
    setFormData({
      title: item.title || '',
      category: item.category || 'Events & Functions',
      amount: String(item.amount || ''),
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
      spentBy: item.spentBy || '',
      department: item.department || '',
      recordedBy: item.recordedBy || '',
      recordedByRole: item.recordedByRole || '',
      paymentMode: item.paymentMode || 'Cash',
      receiptNo: item.receiptNo || '',
      vendor: item.vendor || '',
      description: item.description || '',
      status: item.status || 'Paid',
      academicYear: item.academicYear || '2025–2026'
    });
    setShowAddModal(true);
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount) || 0
    };

    try {
      if (editingExpense) {
        const res = await fetch(`${API_BASE}/expenses/${editingExpense._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          showToast('Expense updated successfully!');
          fetchExpenses();
          setShowAddModal(false);
        }
      } else {
        const res = await fetch(`${API_BASE}/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          showToast('Expense recorded successfully!');
          fetchExpenses();
          setShowAddModal(false);
        }
      }
    } catch (err) {
      console.error('Error saving expense:', err);
      showToast('Error saving expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/expenses/${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        showToast('Expense entry deleted');
        fetchExpenses();
        setDeletingId(null);
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans animate-fadeIn">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Expense &amp; Spending Module
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 border border-indigo-200">
              {user?.role || 'Staff'} View
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Record and oversee campus expenditures for student supplies, college events, cultural functions, sports, and department purchases.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Expense</span>
          </button>
        </div>
      </div>

      {/* 4 SUMMARY STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* 1. Total Expenditure */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
              TOTAL EXPENDITURE
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">
              ₹{totalExpenditure.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">
              Across all categories
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Events & Culturals */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
              EVENTS &amp; FUNCTIONS
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-purple-600 leading-none">
              ₹{eventsSpending.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-purple-600/80 mt-2 font-medium flex items-center gap-1">
              <PartyPopper className="w-3.5 h-3.5" />
              <span>Campus fest &amp; sports</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <PartyPopper className="w-5 h-5" />
          </div>
        </div>

        {/* 3. Student Welfare & Supplies */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
              STUDENT SUPPLIES &amp; WELFARE
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 leading-none">
              ₹{studentSuppliesSpending.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-emerald-600/80 mt-2 font-medium flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Uniforms, books &amp; kits</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* 4. This Month Spending */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
              THIS MONTH'S OUTFLOW
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 leading-none">
              ₹{thisMonthSpending.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">
              Current billing cycle
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search expense, vendor, receipt, person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all shadow-2xs"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 py-1.5 px-3 focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Academic Year Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Year:</span>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 py-1.5 px-3 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Years</option>
              <option value="2025–2026">2025–2026</option>
              <option value="2024–2025">2024–2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* EXPENSE TABLE & LIST */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Recorded Institutional Expenditures</span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                {filteredExpenses.length} Records
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of spending for students, events, sports, and supplies.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium">Loading expenditures...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-500" />
            <p className="text-xs font-bold text-slate-700">No expenses found</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Click &quot;Record New Expense&quot; above to add spending for events or student items.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Title &amp; Purpose</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Spent By / Dept</th>
                  <th className="py-3 px-3">Vendor / Store</th>
                  <th className="py-3 px-3">Payment &amp; Ref</th>
                  <th className="py-3 px-3 text-right">Amount (₹)</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredExpenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Date */}
                    <td className="py-3 px-3 font-semibold text-slate-600 whitespace-nowrap">
                      {exp.date ? new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>

                    {/* Title */}
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-bold text-slate-900 leading-snug">{exp.title}</div>
                      {exp.description && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {exp.description}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${CATEGORY_COLORS[exp.category] || 'bg-slate-100 text-slate-800'}`}>
                        {exp.category}
                      </span>
                    </td>

                    {/* Spent By */}
                    <td className="py-3 px-3 text-slate-700">
                      <div className="font-semibold">{exp.spentBy || 'Office Staff'}</div>
                      <div className="text-[10px] text-slate-400">{exp.department || 'General'}</div>
                    </td>

                    {/* Vendor */}
                    <td className="py-3 px-3 text-slate-600">
                      {exp.vendor || '—'}
                    </td>

                    {/* Payment Mode & Ref */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Receipt className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exp.paymentMode}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{exp.receiptNo || '—'}</div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 text-right font-black text-sm text-slate-900 whitespace-nowrap">
                      ₹{Number(exp.amount).toLocaleString('en-IN')}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingExpense(exp)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(exp)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Expense"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(exp._id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECORD / EDIT EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-xl z-10 border border-slate-200 animate-scaleUp overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingExpense ? 'Edit Expenditure Record' : 'Record New Expenditure'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter details for event expenses, student items, or departmental purchases.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-4 text-xs">
              
              {/* Title */}
              <div>
                <label className="block text-slate-800 font-bold mb-1.5">
                  Expense Title / Purpose <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Sports Day Refreshments, Uniforms for Students, Lab Kits..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-indigo-500 focus:outline-none shadow-2xs"
                />
              </div>

              {/* Category & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:outline-none shadow-2xs cursor-pointer"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="number"
                    required
                    min="1"
                    placeholder="15000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full p-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-emerald-950 font-black text-sm focus:border-emerald-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Date & Spent By */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">
                    Date of Expense <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-indigo-500 focus:outline-none shadow-2xs cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">
                    Spent By / Purchaser <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Ramesh (Accountant) / Office Staff"
                    value={formData.spentBy}
                    onChange={(e) => setFormData({ ...formData, spentBy: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Department & Vendor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">
                    Department / Wing
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Student Affairs, Sports, CS Dept..."
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">
                    Vendor / Shop Name
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Standard Uniform Emporium, ABC Stationary"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Payment Mode & Bill/Receipt No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">
                    Payment Mode
                  </label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-indigo-500 focus:outline-none shadow-2xs cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">
                    Receipt / Voucher No.
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. RCP-2026-901"
                    value={formData.receiptNo}
                    onChange={(e) => setFormData({ ...formData, receiptNo: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-medium focus:bg-white focus:border-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Detailed Description / Notes */}
              <div>
                <label className="block text-slate-800 font-bold mb-1.5">
                  Description / Purpose Details
                </label>
                <textarea 
                  rows={2}
                  placeholder="Provide context on what was bought, for how many students, or event specifications..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-indigo-500 focus:outline-none shadow-2xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  {editingExpense ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* VIEW EXPENSE DETAILS MODAL */}
      {viewingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setViewingExpense(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md z-10 border border-slate-200 animate-scaleUp space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  ₹
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">Expenditure Voucher</h3>
              </div>
              <button 
                onClick={() => setViewingExpense(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Title / Purpose</span>
                <p className="font-extrabold text-slate-900 text-base">{viewingExpense.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Amount Paid</span>
                  <p className="font-black text-emerald-600 text-lg">₹{Number(viewingExpense.amount).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Category</span>
                  <p className="font-bold text-slate-800">{viewingExpense.category}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-bold">{new Date(viewingExpense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-400">Spent By:</span>
                  <span className="font-bold">{viewingExpense.spentBy} ({viewingExpense.department || 'General'})</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-400">Vendor / Shop:</span>
                  <span className="font-bold">{viewingExpense.vendor || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-400">Payment Mode:</span>
                  <span className="font-bold">{viewingExpense.paymentMode}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-400">Receipt Ref:</span>
                  <span className="font-mono font-bold text-indigo-700">{viewingExpense.receiptNo || '—'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-400">Recorded By:</span>
                  <span className="font-medium text-slate-600">{viewingExpense.recordedBy} ({viewingExpense.recordedByRole})</span>
                </div>
              </div>

              {viewingExpense.description && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-900">
                  <span className="font-bold block mb-0.5">Notes:</span>
                  {viewingExpense.description}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setViewingExpense(null)}
                className="w-full py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setDeletingId(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center z-10 border border-slate-200 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Delete Expense Record?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              This action cannot be undone. Are you sure you want to remove this record?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteExpense(deletingId)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
