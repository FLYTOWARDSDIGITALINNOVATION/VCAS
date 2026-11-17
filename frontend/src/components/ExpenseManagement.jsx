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

  // Custom Category State (for "Other" option)
  const [customCategory, setCustomCategory] = useState('');

  // Calendar Date Range filters for main view
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Download / Export Modal state with Calendar date range
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadStartDate, setDownloadStartDate] = useState('');
  const [downloadEndDate, setDownloadEndDate] = useState('');
  const [downloadCategory, setDownloadCategory] = useState('All');

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

  // Compute all available categories (standard + custom from database)
  const allAvailableCategories = useMemo(() => {
    const list = [...CATEGORIES];
    expenses.forEach(e => {
      if (e.category && e.category.trim() && !list.includes(e.category.trim())) {
        list.push(e.category.trim());
      }
    });
    return list;
  }, [expenses]);

  // Filtered expenses for table view
  const filteredExpenses = useMemo(() => {
    return expenses.filter(item => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || (
        (item.title && item.title.toLowerCase().includes(term)) ||
        (item.spentBy && item.spentBy.toLowerCase().includes(term)) ||
        (item.vendor && item.vendor.toLowerCase().includes(term)) ||
        (item.receiptNo && item.receiptNo.toLowerCase().includes(term)) ||
        (item.department && item.department.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.category && item.category.toLowerCase().includes(term))
      );
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesYear = selectedAcademicYear === 'All' || item.academicYear === selectedAcademicYear;

      const itemDate = item.date ? new Date(item.date).toISOString().split('T')[0] : '';
      const matchesStart = !startDateFilter || (itemDate && itemDate >= startDateFilter);
      const matchesEnd = !endDateFilter || (itemDate && itemDate <= endDateFilter);

      return matchesSearch && matchesCat && matchesYear && matchesStart && matchesEnd;
    });
  }, [expenses, searchTerm, selectedCategory, selectedAcademicYear, startDateFilter, endDateFilter]);

  // Filtered expenses specifically for the Download Modal
  const downloadFilteredRecords = useMemo(() => {
    return expenses.filter(item => {
      const itemDate = item.date ? new Date(item.date).toISOString().split('T')[0] : '';
      const matchesStart = !downloadStartDate || (itemDate && itemDate >= downloadStartDate);
      const matchesEnd = !downloadEndDate || (itemDate && itemDate <= downloadEndDate);
      const matchesCat = downloadCategory === 'All' || item.category === downloadCategory;
      return matchesStart && matchesEnd && matchesCat;
    });
  }, [expenses, downloadStartDate, downloadEndDate, downloadCategory]);

  const downloadTotalAmount = useMemo(() => {
    return downloadFilteredRecords.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [downloadFilteredRecords]);

  // Quick preset dates for download modal
  const applyDownloadPreset = (preset) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (preset === 'all') {
      setDownloadStartDate('');
      setDownloadEndDate('');
    } else if (preset === 'today') {
      setDownloadStartDate(todayStr);
      setDownloadEndDate(todayStr);
    } else if (preset === 'this_month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      setDownloadStartDate(startOfMonth);
      setDownloadEndDate(todayStr);
    } else if (preset === 'last_30_days') {
      const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setDownloadStartDate(past30);
      setDownloadEndDate(todayStr);
    } else if (preset === 'academic_year') {
      setDownloadStartDate('2025-06-01');
      setDownloadEndDate('2026-05-31');
    }
  };

  // CSV Export Function
  const handleExportCSV = (recordsToExport, fromDate, toDate, filterCat = 'All') => {
    if (!recordsToExport || recordsToExport.length === 0) {
      showToast('No records found to download');
      return;
    }
    const headers = [
      'S.No',
      'Date',
      'Title / Purpose',
      'Category',
      'Amount (INR)',
      'Spent By',
      'Department',
      'Vendor / Shop',
      'Payment Mode',
      'Receipt / Voucher No',
      'Description / Notes',
      'Academic Year'
    ];
    const rows = recordsToExport.map((r, idx) => [
      idx + 1,
      r.date ? new Date(r.date).toLocaleDateString('en-IN') : '',
      `"${(r.title || '').replace(/"/g, '""')}"`,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      Number(r.amount || 0),
      `"${(r.spentBy || '').replace(/"/g, '""')}"`,
      `"${(r.department || '').replace(/"/g, '""')}"`,
      `"${(r.vendor || '').replace(/"/g, '""')}"`,
      `"${(r.paymentMode || '').replace(/"/g, '""')}"`,
      `"${(r.receiptNo || '').replace(/"/g, '""')}"`,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      `"${(r.academicYear || '').replace(/"/g, '""')}"`
    ]);

    const totalAmt = recordsToExport.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    rows.push([]);
    rows.push(['', '', 'TOTAL EXPENDITURE', `Filter: ${filterCat}`, totalAmt, '', '', '', '', '', '', '']);

    const csvString = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateRangeLabel = fromDate && toDate ? `${fromDate}_to_${toDate}` : (fromDate ? `from_${fromDate}` : (toDate ? `upto_${toDate}` : 'All_Dates'));
    link.download = `VCAS_Expenses_${dateRangeLabel}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Expenses report downloaded successfully!');
  };

  // Print Statement Function
  const handlePrintStatement = (recordsToPrint, fromDate, toDate, filterCat = 'All') => {
    if (!recordsToPrint || recordsToPrint.length === 0) {
      showToast('No records found to print');
      return;
    }
    const totalAmt = recordsToPrint.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const printWin = window.open('', '_blank', 'width=950,height=700');
    if (!printWin) {
      showToast('Please allow popups to print report');
      return;
    }
    const dateRangeText = (fromDate || toDate)
      ? `${fromDate ? new Date(fromDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Beginning'} to ${toDate ? new Date(toDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Current'}`
      : 'All Recorded Dates';

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Institutional Expenditure Report</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 25px; color: #1e293b; font-size: 11px; }
            .header { text-align: center; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-bottom: 16px; }
            .college-name { font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
            .sub { font-size: 11px; color: #64748b; margin-top: 2px; }
            .title-bar { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 8px; margin-bottom: 14px; }
            .title-bar h2 { margin: 0; font-size: 13px; font-weight: 800; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th { background: #f1f5f9; color: #334155; font-weight: 700; text-transform: uppercase; font-size: 9px; padding: 7px 6px; border: 1px solid #cbd5e1; text-align: left; }
            td { padding: 6px; border: 1px solid #e2e8f0; font-size: 10.5px; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 700; }
            .total-row { background: #f8fafc; font-weight: 800; border-top: 2px solid #334155; }
            .footer { margin-top: 24px; display: flex; justify-content: space-between; padding-top: 16px; font-size: 10px; color: #64748b; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="college-name">Vivekananda College of Arts & Sciences</div>
            <div class="sub">Finance & Accounts Office • Institutional Expenditure Statement</div>
          </div>
          <div class="title-bar">
            <div>
              <h2>Expenditure Statement Report</h2>
              <div class="sub">Filtered Date Range: <strong>${dateRangeText}</strong> | Category: <strong>${filterCat}</strong></div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 10px; color: #64748b;">Generated On: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              <div style="font-weight: 800; color: #047857; font-size: 13px;">Total: ₹${totalAmt.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px;">#</th>
                <th style="width: 70px;">Date</th>
                <th>Title / Purpose</th>
                <th style="width: 95px;">Category</th>
                <th style="width: 80px;">Spent By</th>
                <th style="width: 80px;">Vendor</th>
                <th style="width: 65px;">Mode</th>
                <th style="width: 70px;">Receipt No</th>
                <th style="width: 75px;" class="text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${recordsToPrint.map((r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                  <td><strong>${r.title}</strong>${r.description ? `<br><span style="color: #64748b; font-size: 9.5px;">${r.description}</span>` : ''}</td>
                  <td>${r.category}</td>
                  <td>${r.spentBy || '—'}<br><span style="color: #64748b; font-size: 9px;">${r.department || ''}</span></td>
                  <td>${r.vendor || '—'}</td>
                  <td>${r.paymentMode}</td>
                  <td style="font-family: monospace;">${r.receiptNo || '—'}</td>
                  <td class="text-right font-bold">₹${Number(r.amount).toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="8" class="text-right font-bold" style="padding: 8px;">TOTAL EXPENDITURE (${recordsToPrint.length} Records)</td>
                <td class="text-right font-bold" style="padding: 8px; color: #047857; font-size: 12px;">₹${totalAmt.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <div>Prepared By: ___________________ (Finance Desk)</div>
            <div>Verified By: ___________________ (Accountant)</div>
            <div>Approved By: ___________________ (Principal / Secretary)</div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

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
    setCustomCategory('');
    setFormData({
      ...initialFormState,
      category: 'Events & Functions',
      receiptNo: `EXP-${Date.now().toString().slice(-5)}`,
      spentBy: user?.name || (user?.role === 'Accountant' ? 'Accountant' : 'Office Staff'),
      recordedBy: user?.name || 'Staff Member',
      recordedByRole: user?.role || 'Staff'
    });
    setShowAddModal(true);
  };

  const openEditModal = (item) => {
    setEditingExpense(item);
    const isStandardCat = CATEGORIES.includes(item.category);
    setCustomCategory(isStandardCat ? '' : (item.category || ''));
    setFormData({
      title: item.title || '',
      category: isStandardCat ? (item.category || 'Events & Functions') : 'Other',
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
    const finalCategory = (formData.category === 'Other')
      ? (customCategory.trim() || 'Other')
      : formData.category;

    const payload = {
      ...formData,
      category: finalCategory,
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

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowDownloadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-indigo-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Download Expenses</span>
          </button>

          <button
            onClick={() => handlePrintStatement(filteredExpenses, startDateFilter, endDateFilter, selectedCategory)}
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
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search expense, vendor, receipt, person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all shadow-2xs"
          />
        </div>

        {/* Filters: Category, Academic Year, Calendar Date Range, and Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Calendar Date Range Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-[11px] text-slate-500 font-bold">From:</span>
            <input 
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              title="Filter from date"
            />
            <span className="text-[11px] text-slate-500 font-bold ml-1">To:</span>
            <input 
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              title="Filter to date"
            />
            {(startDateFilter || endDateFilter) && (
              <button
                type="button"
                onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }}
                className="text-slate-400 hover:text-rose-500 text-xs font-black px-1 cursor-pointer"
                title="Clear date range filter"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 py-1.5 px-3 focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer max-w-[150px] truncate"
            >
              <option value="All">All Categories</option>
              {allAvailableCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Academic Year Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 py-1.5 px-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Years</option>
              <option value="2025–2026">2025–2026</option>
              <option value="2024–2025">2024–2025</option>
            </select>
          </div>

          {/* Quick Export Button */}
          <button
            type="button"
            onClick={() => handleExportCSV(filteredExpenses, startDateFilter, endDateFilter, selectedCategory)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
            title="Download currently filtered records as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
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
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, category: val });
                      if (val !== 'Other') setCustomCategory('');
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:outline-none shadow-2xs cursor-pointer"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="Other">Other (Type custom category...)</option>
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

              {/* Custom Category Input if "Other" is selected */}
              {formData.category === 'Other' && (
                <div className="bg-indigo-50/60 border border-indigo-200 p-3.5 rounded-2xl animate-fadeIn">
                  <label className="block text-indigo-950 font-extrabold mb-1.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Enter Custom Category Name <span className="text-rose-500">*</span></span>
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Type category (e.g. Electrical Works, Campus Fest, Printing, Guest Honorarium...)"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full p-2.5 bg-white border border-indigo-300 rounded-xl text-slate-900 font-bold focus:border-indigo-600 focus:outline-none shadow-2xs text-xs"
                    autoFocus
                  />
                  <p className="text-[11px] text-indigo-600/80 mt-1 font-medium">
                    This custom category will be recorded and displayed for this expenditure.
                  </p>
                </div>
              )}

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

      {/* EXPENSE DOWNLOAD WITH CALENDAR FILTER MODAL */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowDownloadModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-lg z-10 border border-slate-200 animate-scaleUp space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Download Expenditures Report
                  </h3>
                  <p className="text-xs text-slate-500">
                    Filter expenses between any two dates using the calendar and export.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowDownloadModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Date Presets
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyDownloadPreset('all')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer transition-colors"
                >
                  All Dates
                </button>
                <button
                  type="button"
                  onClick={() => applyDownloadPreset('today')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => applyDownloadPreset('this_month')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer transition-colors"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => applyDownloadPreset('last_30_days')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer transition-colors"
                >
                  Past 30 Days
                </button>
                <button
                  type="button"
                  onClick={() => applyDownloadPreset('academic_year')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer transition-colors"
                >
                  Academic Year (2025–26)
                </button>
              </div>
            </div>

            {/* Calendar Date Pickers (From Date to To Date) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <label className="block text-slate-800 font-bold mb-1.5 text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>From Date (Calendar)</span>
                </label>
                <input 
                  type="date"
                  value={downloadStartDate}
                  onChange={(e) => setDownloadStartDate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs focus:border-indigo-600 focus:outline-none shadow-2xs cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1.5 text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>To Date (Calendar)</span>
                </label>
                <input 
                  type="date"
                  value={downloadEndDate}
                  onChange={(e) => setDownloadEndDate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs focus:border-indigo-600 focus:outline-none shadow-2xs cursor-pointer"
                />
              </div>
            </div>

            {/* Category Filter for Download */}
            <div>
              <label className="block text-slate-800 font-bold mb-1.5 text-xs flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filter by Category (Optional)</span>
              </label>
              <select
                value={downloadCategory}
                onChange={(e) => setDownloadCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-xs focus:bg-white focus:border-indigo-500 focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="All">All Categories ({expenses.length} Records)</option>
                {allAvailableCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Live Filter Summary Card */}
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Matching Expenditures
                </p>
                <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {downloadFilteredRecords.length} <span className="text-xs font-semibold text-slate-500">records found</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Total Spending
                </p>
                <p className="text-xl font-black text-emerald-600 mt-0.5">
                  ₹{downloadTotalAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleExportCSV(downloadFilteredRecords, downloadStartDate, downloadEndDate, downloadCategory)}
                disabled={downloadFilteredRecords.length === 0}
                className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download CSV / Excel</span>
              </button>

              <button
                type="button"
                onClick={() => handlePrintStatement(downloadFilteredRecords, downloadStartDate, downloadEndDate, downloadCategory)}
                disabled={downloadFilteredRecords.length === 0}
                className="w-full sm:flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / PDF Report</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
