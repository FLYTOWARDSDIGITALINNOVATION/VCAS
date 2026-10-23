const Expense = require('../models/Expense');

// Initial seed expenses if empty
const defaultSeedExpenses = [
  {
    title: 'College Sports Day Refreshments & Energy Drinks',
    category: 'Sports & Culturals',
    amount: 14500,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    spentBy: 'Physical Education Dept',
    department: 'Sports',
    recordedBy: 'Mr. Ramesh (Accountant)',
    recordedByRole: 'Accountant',
    paymentMode: 'UPI',
    receiptNo: 'RCP-2026-081',
    vendor: 'Sri Murugan Snacks & Drinks',
    description: 'Glucose, fruit juices, biscuits and water drums for 450 participating students.',
    status: 'Paid',
    academicYear: '2025–2026'
  },
  {
    title: 'Uniform Sets & ID Badges for 1st Year Needy Students',
    category: 'Student Supplies & Welfare',
    amount: 28000,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    spentBy: 'Office Staff Welfare Desk',
    department: 'Student Affairs',
    recordedBy: 'Mrs. Priya (Office Staff)',
    recordedByRole: 'Office Staff',
    paymentMode: 'Bank Transfer',
    receiptNo: 'TEX-INV-5541',
    vendor: 'Standard Textile Emporium',
    description: 'Purchased 20 full sets of blazer uniforms and student handbook diaries for freshers.',
    status: 'Paid',
    academicYear: '2025–2026'
  },
  {
    title: 'Annual Science Exhibition & Tech Fest Audio/Stage Setup',
    category: 'Events & Functions',
    amount: 35000,
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    spentBy: 'Computer Science & AI Dept',
    department: 'Computer Science',
    recordedBy: 'Mr. Ramesh (Accountant)',
    recordedByRole: 'Accountant',
    paymentMode: 'Bank Transfer',
    receiptNo: 'EVT-STAGE-902',
    vendor: 'Star Sound & Lighting Services',
    description: 'Auditorium sound system, projector rentals, banners and mementos for guest speakers.',
    status: 'Paid',
    academicYear: '2025–2026'
  },
  {
    title: 'Semester Textbooks & Lab Record Notebooks for Students',
    category: 'Books & Stationery',
    amount: 19500,
    date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    spentBy: 'Academic Stores',
    department: 'Library',
    recordedBy: 'Mrs. Priya (Office Staff)',
    recordedByRole: 'Office Staff',
    paymentMode: 'Cheque',
    receiptNo: 'BK-STORE-114',
    vendor: 'Higginbothams Educational Supplies',
    description: 'Core semester reference books and 300 observation notebooks issued to departments.',
    status: 'Paid',
    academicYear: '2025–2026'
  }
];

exports.getAllExpenses = async (req, res) => {
  try {
    const { category, search, academicYear, startDate, endDate } = req.query;
    
    // Seed default if empty
    const count = await Expense.countDocuments();
    if (count === 0) {
      await Expense.insertMany(defaultSeedExpenses);
    }

    const query = {};
    if (category && category !== 'All') {
      query.category = category;
    }
    if (academicYear && academicYear !== 'All') {
      query.academicYear = academicYear;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        query.date.$lte = e;
      }
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { title: regex },
        { spentBy: regex },
        { vendor: regex },
        { receiptNo: regex },
        { description: regex },
        { department: regex }
      ];
    }

    const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    console.error('Error in getAllExpenses:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving expenses', error: error.message });
  }
};

exports.getExpenseSummary = async (req, res) => {
  try {
    const expenses = await Expense.find();
    const totalAmount = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    
    // Category totals
    const categoryTotals = {};
    expenses.forEach(item => {
      const cat = item.category || 'Miscellaneous';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(item.amount) || 0);
    });

    // This month total
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thisMonthAmount = expenses.filter(item => {
      const d = new Date(item.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // Event & Student supplies specific metrics
    const eventsAmount = (categoryTotals['Events & Functions'] || 0) + (categoryTotals['Sports & Culturals'] || 0);
    const studentSuppliesAmount = (categoryTotals['Student Supplies & Welfare'] || 0) + (categoryTotals['Books & Stationery'] || 0);

    res.status(200).json({
      success: true,
      data: {
        totalAmount,
        totalCount: expenses.length,
        thisMonthAmount,
        eventsAmount,
        studentSuppliesAmount,
        categoryTotals
      }
    });
  } catch (error) {
    console.error('Error in getExpenseSummary:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving expense summary', error: error.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const {
      title,
      category,
      amount,
      date,
      spentBy,
      department,
      recordedBy,
      recordedByRole,
      paymentMode,
      receiptNo,
      vendor,
      description,
      status,
      academicYear
    } = req.body;

    if (!title || amount === undefined || amount === null) {
      return res.status(400).json({ success: false, message: 'Title and amount are required' });
    }

    const newExpense = new Expense({
      title: title.trim(),
      category: category || 'Events & Functions',
      amount: Number(amount) || 0,
      date: date ? new Date(date) : new Date(),
      spentBy: (spentBy || 'Office Staff').trim(),
      department: (department || 'General').trim(),
      recordedBy: (recordedBy || 'Office Staff').trim(),
      recordedByRole: (recordedByRole || 'Staff').trim(),
      paymentMode: paymentMode || 'Cash',
      receiptNo: (receiptNo || `EXP-${Date.now().toString().slice(-6)}`).trim(),
      vendor: (vendor || '').trim(),
      description: (description || '').trim(),
      status: status || 'Paid',
      academicYear: academicYear || '2025–2026'
    });

    const saved = await newExpense.save();
    res.status(201).json({ success: true, message: 'Expense recorded successfully', data: saved });
  } catch (error) {
    console.error('Error in createExpense:', error);
    res.status(500).json({ success: false, message: 'Server error creating expense', error: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Expense.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.status(200).json({ success: true, message: 'Expense updated successfully', data: updated });
  } catch (error) {
    console.error('Error in updateExpense:', error);
    res.status(500).json({ success: false, message: 'Server error updating expense', error: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Expense.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.status(200).json({ success: true, message: 'Expense deleted successfully', data: deleted });
  } catch (error) {
    console.error('Error in deleteExpense:', error);
    res.status(500).json({ success: false, message: 'Server error deleting expense', error: error.message });
  }
};
