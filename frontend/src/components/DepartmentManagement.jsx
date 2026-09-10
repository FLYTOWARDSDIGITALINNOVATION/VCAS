import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Eye, 
  Pencil, 
  Trash2, 
  Search, 
  X, 
  Check, 
  Users, 
  GraduationCap, 
  BookOpen, 
  AlertTriangle,
  User,
  Layers,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Calendar, 
  Filter,
  Save
} from 'lucide-react';
import ModalPortal from './ModalPortal';

function formatHodEmail(name) {
  if (!name) return 'hod@college.edu';
  const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim().toLowerCase();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]}.${parts[parts.length - 1][0]}@college.edu`;
  }
  return `${clean}@college.edu`;
}

const INITIAL_DEPARTMENTS = [
  {
    id: 1,
    code: 'CS',
    name: 'Computer Science & Engineering',
    hod: 'Dr. Sunita Rao',
    hodEmail: 'sunita.rao@college.edu',
    hodPhone: '9811223344',
    totalYears: 4,
    totalSemesters: 8,
    facultyCount: 24,
    studentCount: 340,
    courseCount: 12,
    establishedYear: '2008',
    description: 'Premier department focusing on Artificial Intelligence, Software Engineering, Systems, and Data Science.',
    labs: ['AI & Robotics Lab', 'Cloud Computing Lab', 'Advanced Algorithms Lab', 'IoT & Networks Lab'],
    yearBreakdown: [
      { year: 1, label: '1st Year', students: 90, semesters: ['Sem 1', 'Sem 2'] },
      { year: 2, label: '2nd Year', students: 88, semesters: ['Sem 3', 'Sem 4'] },
      { year: 3, label: '3rd Year', students: 82, semesters: ['Sem 5', 'Sem 6'] },
      { year: 4, label: '4th Year', students: 80, semesters: ['Sem 7', 'Sem 8'] }
    ],
    coursesList: [
      { code: 'CS101', name: 'Python Programming', credits: 4, year: 1, sem: 'Sem 1' },
      { code: 'MA101', name: 'Engineering Mathematics I', credits: 4, year: 1, sem: 'Sem 1' },
      { code: 'CS102', name: 'C Programming & Data Structures', credits: 4, year: 1, sem: 'Sem 2' },
      { code: 'CS103', name: 'Digital Logic & Microprocessors', credits: 3, year: 1, sem: 'Sem 2' },
      { code: 'CS201', name: 'Object Oriented Java', credits: 4, year: 2, sem: 'Sem 3' },
      { code: 'CS202', name: 'Computer Architecture & Org', credits: 3, year: 2, sem: 'Sem 3' },
      { code: 'CS301', name: 'Data Structures & Algorithms', credits: 4, year: 2, sem: 'Sem 4' },
      { code: 'CS302', name: 'Operating Systems & Linux', credits: 4, year: 2, sem: 'Sem 4' },
      { code: 'CS401', name: 'Database Management Systems', credits: 4, year: 3, sem: 'Sem 5' },
      { code: 'CS502', name: 'Artificial Intelligence & ML', credits: 3, year: 3, sem: 'Sem 6' },
      { code: 'CS601', name: 'Cyber Security & Cryptography', credits: 3, year: 4, sem: 'Sem 7' },
      { code: 'CS701', name: 'Final Year Capstone Project', credits: 6, year: 4, sem: 'Sem 8' }
    ]
  },
  {
    id: 2,
    code: 'ECE',
    name: 'Electronics & Communication',
    hod: 'Prof. Ramesh Kumar',
    hodEmail: 'ramesh.k@college.edu',
    hodPhone: '9811223345',
    totalYears: 4,
    totalSemesters: 8,
    facultyCount: 18,
    studentCount: 280,
    courseCount: 8,
    establishedYear: '2010',
    description: 'Specializing in VLSI design, Digital Signal Processing, Embedded Systems, and Wireless Communication.',
    labs: ['VLSI & Microelectronics Lab', 'DSP Lab', 'IoT & Embedded Lab'],
    yearBreakdown: [
      { year: 1, label: '1st Year', students: 75, semesters: ['Sem 1', 'Sem 2'] },
      { year: 2, label: '2nd Year', students: 72, semesters: ['Sem 3', 'Sem 4'] },
      { year: 3, label: '3rd Year', students: 68, semesters: ['Sem 5', 'Sem 6'] },
      { year: 4, label: '4th Year', students: 65, semesters: ['Sem 7', 'Sem 8'] }
    ],
    coursesList: [
      { code: 'EC101', name: 'Basic Circuit Analysis', credits: 4, year: 1, sem: 'Sem 1' },
      { code: 'EC102', name: 'Semiconductor Devices', credits: 4, year: 1, sem: 'Sem 2' },
      { code: 'EC201', name: 'Electronic Circuits & Design', credits: 4, year: 2, sem: 'Sem 3' },
      { code: 'EC301', name: 'Digital Electronics & Logic', credits: 4, year: 2, sem: 'Sem 4' },
      { code: 'EC401', name: 'Digital Signal Processing', credits: 4, year: 3, sem: 'Sem 5' },
      { code: 'EC501', name: 'Wireless & Cellular Communication', credits: 3, year: 3, sem: 'Sem 6' },
      { code: 'EC601', name: 'VLSI Chip Architecture', credits: 3, year: 4, sem: 'Sem 7' },
      { code: 'EC701', name: 'Embedded Systems Capstone', credits: 6, year: 4, sem: 'Sem 8' }
    ]
  },
  {
    id: 3,
    code: 'MBA',
    name: 'Business Administration',
    hod: 'Dr. Anita Desai',
    hodEmail: 'anita.d@college.edu',
    hodPhone: '9811223346',
    totalYears: 2,
    totalSemesters: 4,
    facultyCount: 14,
    studentCount: 210,
    courseCount: 6,
    establishedYear: '2012',
    description: 'Fostering future leaders in Finance, Marketing, Human Resources, and Business Analytics.',
    labs: ['Business Analytics Lab', 'Finance Simulation Center'],
    yearBreakdown: [
      { year: 1, label: '1st Year', students: 110, semesters: ['Sem 1', 'Sem 2'] },
      { year: 2, label: '2nd Year', students: 100, semesters: ['Sem 3', 'Sem 4'] }
    ],
    coursesList: [
      { code: 'MB101', name: 'Principles of Management', credits: 3, year: 1, sem: 'Sem 1' },
      { code: 'MB102', name: 'Organizational Behavior', credits: 3, year: 1, sem: 'Sem 1' },
      { code: 'MB201', name: 'Financial Management & Markets', credits: 4, year: 1, sem: 'Sem 2' },
      { code: 'MB301', name: 'Marketing Management & CRM', credits: 4, year: 2, sem: 'Sem 3' },
      { code: 'MB304', name: 'Strategic Decision Making', credits: 3, year: 2, sem: 'Sem 3' },
      { code: 'MB401', name: 'Corporate Project & Thesis', credits: 6, year: 2, sem: 'Sem 4' }
    ]
  },
  {
    id: 4,
    code: 'MECH',
    name: 'Mechanical Engineering',
    hod: 'Dr. Pradeep Joshi',
    hodEmail: 'pradeep.j@college.edu',
    hodPhone: '9811223349',
    totalYears: 4,
    totalSemesters: 8,
    facultyCount: 16,
    studentCount: 220,
    courseCount: 8,
    establishedYear: '2009',
    description: 'Excellence in Thermodynamics, CAD/CAM Modeling, Robotics, and Materials Engineering.',
    labs: ['Thermal Engineering Lab', 'CAD/CAM Simulation Lab', 'Manufacturing Workshop'],
    yearBreakdown: [
      { year: 1, label: '1st Year', students: 60, semesters: ['Sem 1', 'Sem 2'] },
      { year: 2, label: '2nd Year', students: 58, semesters: ['Sem 3', 'Sem 4'] },
      { year: 3, label: '3rd Year', students: 52, semesters: ['Sem 5', 'Sem 6'] },
      { year: 4, label: '4th Year', students: 50, semesters: ['Sem 7', 'Sem 8'] }
    ],
    coursesList: [
      { code: 'ME101', name: 'Engineering Mechanics', credits: 4, year: 1, sem: 'Sem 1' },
      { code: 'ME102', name: 'Materials Science & Metallurgy', credits: 4, year: 1, sem: 'Sem 2' },
      { code: 'ME201', name: 'Thermodynamics & Heat Transfer', credits: 4, year: 2, sem: 'Sem 3' },
      { code: 'ME301', name: 'Fluid Mechanics & Machinery', credits: 4, year: 2, sem: 'Sem 4' },
      { code: 'ME401', name: 'CAD/CAM & Automation Systems', credits: 3, year: 3, sem: 'Sem 5' },
      { code: 'ME501', name: 'Design of Machine Elements', credits: 4, year: 3, sem: 'Sem 6' },
      { code: 'ME601', name: 'Automobile Engineering & EV', credits: 3, year: 4, sem: 'Sem 7' },
      { code: 'ME701', name: 'Major Industrial Fabrication Project', credits: 6, year: 4, sem: 'Sem 8' }
    ]
  },
  {
    id: 5,
    code: 'CIVIL',
    name: 'Civil Engineering',
    hod: 'Dr. Kavitha Singh',
    hodEmail: 'kavitha.s@college.edu',
    hodPhone: '9811223350',
    totalYears: 4,
    totalSemesters: 8,
    facultyCount: 12,
    studentCount: 180,
    courseCount: 6,
    establishedYear: '2011',
    description: 'Focusing on Structural Analysis, Environmental Engineering, Geo-technics, and Smart Urban Design.',
    labs: ['Structural Testing Lab', 'Soil Mechanics Lab', 'Surveying Lab'],
    yearBreakdown: [
      { year: 1, label: '1st Year', students: 50, semesters: ['Sem 1', 'Sem 2'] },
      { year: 2, label: '2nd Year', students: 48, semesters: ['Sem 3', 'Sem 4'] },
      { year: 3, label: '3rd Year', students: 42, semesters: ['Sem 5', 'Sem 6'] },
      { year: 4, label: '4th Year', students: 40, semesters: ['Sem 7', 'Sem 8'] }
    ],
    coursesList: [
      { code: 'CE101', name: 'Surveying & Geomatics', credits: 4, year: 1, sem: 'Sem 1' },
      { code: 'CE201', name: 'Building Materials & Construction', credits: 4, year: 1, sem: 'Sem 2' },
      { code: 'CE301', name: 'Structural Analysis & Design', credits: 4, year: 2, sem: 'Sem 3' },
      { code: 'CE401', name: 'Environmental & Sanitary Engg', credits: 3, year: 2, sem: 'Sem 4' },
      { code: 'CE501', name: 'Soil Mechanics & Foundations', credits: 4, year: 3, sem: 'Sem 5' },
      { code: 'CE701', name: 'Structural Design Capstone', credits: 6, year: 4, sem: 'Sem 8' }
    ]
  },
  {
    id: 6,
    code: 'BCA',
    name: 'Bachelor of Computer Applications',
    hod: 'Prof. Meena Iyer',
    hodEmail: 'meena.i@college.edu',
    hodPhone: '9811223351',
    totalYears: 3,
    totalSemesters: 6,
    facultyCount: 10,
    studentCount: 150,
    courseCount: 6,
    establishedYear: '2015',
    description: 'Undergraduate applications development program focusing on Web, Mobile, and Cloud Technologies.',
    labs: ['Web & App Development Lab', 'Open Source Software Lab'],
    yearBreakdown: [
      { year: 1, label: '1st Year', students: 55, semesters: ['Sem 1', 'Sem 2'] },
      { year: 2, label: '2nd Year', students: 50, semesters: ['Sem 3', 'Sem 4'] },
      { year: 3, label: '3rd Year', students: 45, semesters: ['Sem 5', 'Sem 6'] }
    ],
    coursesList: [
      { code: 'BC101', name: 'Introduction to Web Technologies', credits: 4, year: 1, sem: 'Sem 1' },
      { code: 'BC102', name: 'Programming in C & C++', credits: 4, year: 1, sem: 'Sem 2' },
      { code: 'BC201', name: 'Database & SQL Programming', credits: 4, year: 2, sem: 'Sem 3' },
      { code: 'BC202', name: 'Java & Android App Dev', credits: 4, year: 2, sem: 'Sem 4' },
      { code: 'BC301', name: 'Cloud Computing Fundamentals', credits: 3, year: 3, sem: 'Sem 5' },
      { code: 'BC302', name: 'Full-Stack Web Development Project', credits: 6, year: 3, sem: 'Sem 6' }
    ]
  }
];

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected department for viewing modal (View Modal - Image 1)
  const [viewingDept, setViewingDept] = useState(null);

  // Selected department for editing modal (Edit Modal - triggered by Edit on Card - Image 2)
  const [editingDept, setEditingDept] = useState(null);

  // View modal: Active Year filter tab & Active Semester filter pill
  const [viewActiveYear, setViewActiveYear] = useState('ALL'); // 'ALL' or 1, 2, 3, 4
  const [viewActiveSem, setViewActiveSem] = useState('ALL'); // 'ALL' or 'Sem 1', 'Sem 2', etc.

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingDept, setDeletingDept] = useState(null);

  // Lock background scroll when any modal is open
  React.useEffect(() => {
    const isAnyModalOpen = Boolean(viewingDept || editingDept || isAddModalOpen || deletingDept);
    const scrollContainer = document.getElementById('main-content-scroll-container');
    if (isAnyModalOpen) {
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
  }, [viewingDept, editingDept, isAddModalOpen, deletingDept]);

  // Form state for basic fields
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    hod: '',
    totalYears: 4,
    totalSemesters: 8,
    facultyCount: 10,
    studentCount: 100,
    description: ''
  });

  // State for editing Courses & Labs directly inside Edit Modal
  const [editCoursesList, setEditCoursesList] = useState([]);
  const [editLabsList, setEditLabsList] = useState([]);
  const [newLabInput, setNewLabInput] = useState('');

  // Filter in Edit Modal for easier curriculum management
  const [editFilterYear, setEditFilterYear] = useState('ALL');

  const [formErrors, setFormErrors] = useState({});

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      hod: '',
      totalYears: 4,
      totalSemesters: 8,
      facultyCount: 12,
      studentCount: 150,
      description: ''
    });
    setFormErrors({});
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  // Open the View modal (matching First Image with Year/Sem tabs)
  const handleOpenViewModal = (dept) => {
    setViewingDept(dept);
    setViewActiveYear('ALL');
    setViewActiveSem('ALL');
  };

  // Open the Edit modal from the Card
  const handleOpenEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      hod: dept.hod,
      totalYears: dept.totalYears || 4,
      totalSemesters: dept.totalSemesters || 8,
      facultyCount: dept.facultyCount,
      studentCount: dept.studentCount,
      description: dept.description || ''
    });
    setEditCoursesList(dept.coursesList ? JSON.parse(JSON.stringify(dept.coursesList)) : []);
    setEditLabsList(dept.labs ? [...dept.labs] : []);
    setNewLabInput('');
    setEditFilterYear('ALL');
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Department name is required';
    if (!formData.code.trim()) errors.code = 'Department code (e.g. CS) is required';
    if (!formData.hod.trim()) errors.hod = 'HOD name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler to update an individual course in editCoursesList
  const handleUpdateCourseField = (index, field, value) => {
    setEditCoursesList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Handler to add a new course module with Year & Sem
  const handleAddCourse = (targetYear = 1, targetSem = 'Sem 1') => {
    const currentCode = formData.code.trim().toUpperCase() || 'MOD';
    const nextIndex = editCoursesList.length + 1;
    const newCourse = {
      code: `${currentCode}${targetYear}0${nextIndex}`,
      name: `New Subject Module ${nextIndex}`,
      credits: 4,
      year: Number(targetYear) || 1,
      sem: targetSem || `Sem ${targetYear * 2 - 1}`
    };
    setEditCoursesList(prev => [...prev, newCourse]);
  };

  // Handler to remove a course
  const handleRemoveCourse = (index) => {
    setEditCoursesList(prev => prev.filter((_, i) => i !== index));
  };

  // Handler to add a lab
  const handleAddLab = () => {
    if (!newLabInput.trim()) return;
    if (!editLabsList.includes(newLabInput.trim())) {
      setEditLabsList(prev => [...prev, newLabInput.trim()]);
    }
    setNewLabInput('');
  };

  // Handler to remove a lab
  const handleRemoveLab = (labToRemove) => {
    setEditLabsList(prev => prev.filter(l => l !== labToRemove));
  };

  // Save new department
  const handleSaveAdd = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newCode = formData.code.trim().toUpperCase();
    const newHod = formData.hod.trim();
    const years = Number(formData.totalYears) || 4;
    const sems = years * 2;

    const generatedCourses = [];
    for (let y = 1; y <= years; y++) {
      generatedCourses.push({
        code: `${newCode}${y}01`,
        name: `Core Subject Year ${y} (Odd Sem)`,
        credits: 4,
        year: y,
        sem: `Sem ${y * 2 - 1}`
      });
      generatedCourses.push({
        code: `${newCode}${y}02`,
        name: `Core Subject Year ${y} (Even Sem)`,
        credits: 4,
        year: y,
        sem: `Sem ${y * 2}`
      });
    }

    const newDept = {
      id: Date.now(),
      name: formData.name.trim(),
      code: newCode,
      hod: newHod,
      hodEmail: formatHodEmail(newHod),
      totalYears: years,
      totalSemesters: sems,
      facultyCount: Number(formData.facultyCount) || 0,
      studentCount: Number(formData.studentCount) || 0,
      courseCount: generatedCourses.length,
      description: formData.description.trim() || 'Academic department at Vidyapeeth.',
      establishedYear: new Date().getFullYear().toString(),
      labs: ['Computing & Research Lab', 'Department Seminar Center'],
      coursesList: generatedCourses
    };

    setDepartments(prev => [...prev, newDept]);
    setIsAddModalOpen(false);
  };

  // Save edited department
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!editingDept) return;

    const newFacultyCount = Number(formData.facultyCount) || 0;
    const newStudentCount = Number(formData.studentCount) || 0;
    const newCode = formData.code.trim().toUpperCase();
    const newHod = formData.hod.trim();
    const newHodEmail = formatHodEmail(newHod);
    const years = Number(formData.totalYears) || editingDept.totalYears || 4;

    const updatedDept = {
      ...editingDept,
      name: formData.name.trim(),
      code: newCode,
      hod: newHod,
      hodEmail: newHodEmail,
      totalYears: years,
      totalSemesters: years * 2,
      facultyCount: newFacultyCount,
      studentCount: newStudentCount,
      courseCount: editCoursesList.length,
      description: formData.description.trim(),
      coursesList: editCoursesList,
      labs: editLabsList
    };

    setDepartments(prev => prev.map(item => item.id === editingDept.id ? updatedDept : item));

    if (viewingDept && viewingDept.id === editingDept.id) {
      setViewingDept(updatedDept);
    }

    setEditingDept(null);
  };

  const handleConfirmDelete = () => {
    if (deletingDept) {
      setDepartments(prev => prev.filter(item => item.id !== deletingDept.id));
      if (viewingDept && viewingDept.id === deletingDept.id) {
        setViewingDept(null);
      }
      setDeletingDept(null);
    }
  };

  // Filtered department list
  const filteredDepartments = useMemo(() => {
    return departments.filter(d => {
      const q = searchQuery.toLowerCase().trim();
      return !q || (
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.hod.toLowerCase().includes(q)
      );
    });
  }, [departments, searchQuery]);

  // Filtered courses in View Modal by selected Year & Semester
  const filteredViewCourses = useMemo(() => {
    if (!viewingDept || !viewingDept.coursesList) return [];
    return viewingDept.coursesList.filter(course => {
      const matchesYear = viewActiveYear === 'ALL' || course.year === Number(viewActiveYear);
      const matchesSem = viewActiveSem === 'ALL' || course.sem === viewActiveSem;
      return matchesYear && matchesSem;
    });
  }, [viewingDept, viewActiveYear, viewActiveSem]);

  // Available semesters in viewingDept
  const availableSemesters = useMemo(() => {
    if (!viewingDept) return [];
    const totalSems = viewingDept.totalSemesters || (viewingDept.totalYears ? viewingDept.totalYears * 2 : 8);
    const list = [];
    for (let i = 1; i <= totalSems; i++) {
      list.push(`Sem ${i}`);
    }
    return list;
  }, [viewingDept]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans animate-fadeIn">
      
      {/* 1. TOP HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Departments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Manage academic departments, year-wise curriculum, and semester syllabus
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-xs sm:text-sm rounded-xl border border-blue-200 hover:border-blue-600 transition-all duration-150 shadow-xs self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Department</span>
        </button>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search departments by name, code, or HOD..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. DEPARTMENT CARDS GRID (Exact match to screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((dept) => (
          <div
            key={dept.id}
            className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
          >
            {/* Card Top: Icon & Code Badge & Year badge */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 font-semibold text-[11px] rounded-lg">
                    {dept.totalYears || 4} Yrs • {dept.totalSemesters || 8} Sems
                  </span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl border border-blue-100/80">
                    {dept.code}
                  </span>
                </div>
              </div>

              {/* Department Name & HOD */}
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {dept.name}
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                HOD: <span className="text-slate-700">{dept.hod}</span>
              </p>
            </div>

            {/* Middle: 3 Stat Boxes (Faculty, Students, Courses) */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 text-center">
              <div>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 block leading-tight">
                  {dept.facultyCount}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  Faculty
                </span>
              </div>
              <div className="border-x border-slate-200/80">
                <span className="text-base sm:text-lg font-extrabold text-slate-900 block leading-tight">
                  {dept.studentCount}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  Students
                </span>
              </div>
              <div>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 block leading-tight">
                  {dept.courseCount || dept.coursesList?.length || 0}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  Courses
                </span>
              </div>
            </div>

            {/* Bottom Actions Row: View, Edit, Delete */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleOpenViewModal(dept)}
                className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/80 transition-all flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View</span>
              </button>

              <button
                onClick={() => handleOpenEditModal(dept)}
                className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/80 transition-all flex items-center justify-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => setDeletingDept(dept)}
                className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl border border-rose-100 transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: ADD DEPARTMENT */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <ModalPortal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">Add New Department</h3>
                  <p className="text-[11px] text-slate-500">Register an academic department branch and configure head of department</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Artificial Intelligence & Data Science"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none transition-all ${
                    formErrors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-purple-500'
                  }`}
                />
                {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. AI-DS"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold font-mono text-slate-800 focus:bg-white focus:outline-none uppercase transition-all ${
                      formErrors.code ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-purple-500'
                    }`}
                  />
                  {formErrors.code && <p className="text-[11px] text-rose-500 mt-1">{formErrors.code}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Head of Department (HOD) *
                  </label>
                  <input
                    type="text"
                    value={formData.hod}
                    onChange={(e) => setFormData({ ...formData, hod: e.target.value })}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none transition-all ${
                      formErrors.hod ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-purple-500'
                    }`}
                  />
                  {formErrors.hod && <p className="text-[11px] text-rose-500 mt-1">{formErrors.hod}</p>}
                </div>
              </div>

              {/* Program Duration (Years & Semesters) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
                  <select
                    value={formData.totalYears}
                    onChange={(e) => setFormData({ ...formData, totalYears: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value={2}>2 Years (4 Sems - MBA/PG)</option>
                    <option value={3}>3 Years (6 Sems - BCA/B.Sc)</option>
                    <option value={4}>4 Years (8 Sems - B.Tech/BE)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Faculty Count</label>
                  <input
                    type="number"
                    value={formData.facultyCount}
                    onChange={(e) => setFormData({ ...formData, facultyCount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Students Enrolled</label>
                  <input
                    type="number"
                    value={formData.studentCount}
                    onChange={(e) => setFormData({ ...formData, studentCount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Department</span>
                </button>
              </div>

            </form>

          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: EDIT DEPARTMENT WITH YEAR & SEMESTER CURRICULUM EDITOR          */}
      {/* ========================================================================= */}
      {editingDept && (
        <ModalPortal isOpen={Boolean(editingDept)} onClose={() => setEditingDept(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Title */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                    Edit Department & Curriculum Details
                  </h3>
                  <p className="text-[11px] text-slate-500">Update {editingDept.name} curriculum, labs, and faculty allocation</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingDept(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6">
              
              {/* SECTION A: Department General Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" /> General Information
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none transition-all ${
                        formErrors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-purple-500'
                      }`}
                    />
                    {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department Code *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold font-mono text-slate-800 focus:bg-white focus:outline-none uppercase transition-all ${
                        formErrors.code ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-purple-500'
                      }`}
                    />
                    {formErrors.code && <p className="text-[11px] text-rose-500 mt-1">{formErrors.code}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Head of Department (HOD) *
                    </label>
                    <input
                      type="text"
                      value={formData.hod}
                      onChange={(e) => setFormData({ ...formData, hod: e.target.value })}
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none transition-all ${
                        formErrors.hod ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-purple-500'
                      }`}
                    />
                    {formErrors.hod && <p className="text-[11px] text-rose-500 mt-1">{formErrors.hod}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Faculty Count</label>
                    <input
                      type="number"
                      value={formData.facultyCount}
                      onChange={(e) => setFormData({ ...formData, facultyCount: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Students Enrolled</label>
                    <input
                      type="number"
                      value={formData.studentCount}
                      onChange={(e) => setFormData({ ...formData, studentCount: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: CURRICULUM, SUBJECTS & LABS BY YEAR AND SEMESTER */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" /> Curriculum & Labs by Year / Sem
                  </h4>
                  
                  {/* Select Year to Edit */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Select Year:</span>
                    <select
                      value={activeEditYear}
                      onChange={(e) => setActiveEditYear(Number(e.target.value))}
                      className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-700 focus:outline-none cursor-pointer"
                    >
                      {Array.from({ length: Number(formData.totalYears) || 4 }, (_, i) => i + 1).map(yr => (
                        <option key={yr} value={yr}>Year {yr} (Sem {yr * 2 - 1} & Sem {yr * 2})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sub-Editor for the Active Year */}
                {(() => {
                  const yrData = editCurriculum.find(c => c.year === activeEditYear) || {
                    year: activeEditYear,
                    sem1Name: `Sem ${activeEditYear * 2 - 1}`,
                    sem2Name: `Sem ${activeEditYear * 2}`,
                    sem1Subjects: [],
                    sem2Subjects: [],
                    sem1Labs: [],
                    sem2Labs: []
                  };

                  return (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-purple-900 uppercase tracking-wider">
                          Year {activeEditYear} Courses & Labs
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {yrData.sem1Name} and {yrData.sem2Name}
                        </span>
                      </div>

                      {/* Semester 1 Box */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{yrData.sem1Name} Subjects:</span>
                          <button
                            type="button"
                            onClick={() => handleAddSubjectToEditCurriculum(activeEditYear, 1)}
                            className="px-2.5 py-1 text-[11px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg flex items-center gap-1 transition-all"
                          >
                            <Plus className="w-3 h-3" /> Add Course
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          {yrData.sem1Subjects.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No courses added for this semester.</p>
                          ) : (
                            yrData.sem1Subjects.map((sub, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={sub}
                                  onChange={(e) => handleUpdateSubjectInEditCurriculum(activeEditYear, 1, idx, e.target.value)}
                                  placeholder="e.g. Data Structures & Algorithms (4 Credits)"
                                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:border-purple-500 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubjectFromEditCurriculum(activeEditYear, 1, idx)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Remove course"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Labs for Sem 1 */}
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700">{yrData.sem1Name} Practical Labs:</span>
                            <button
                              type="button"
                              onClick={() => handleAddLabToEditCurriculum(activeEditYear, 1)}
                              className="px-2 py-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md flex items-center gap-1 transition-all"
                            >
                              <Plus className="w-3 h-3" /> Add Lab
                            </button>
                          </div>
                          {yrData.sem1Labs && yrData.sem1Labs.map((lab, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={lab}
                                onChange={(e) => handleUpdateLabInEditCurriculum(activeEditYear, 1, idx, e.target.value)}
                                placeholder="e.g. Data Structures Lab (2 Credits)"
                                className="flex-1 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveLabFromEditCurriculum(activeEditYear, 1, idx)}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Semester 2 Box */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{yrData.sem2Name} Subjects:</span>
                          <button
                            type="button"
                            onClick={() => handleAddSubjectToEditCurriculum(activeEditYear, 2)}
                            className="px-2.5 py-1 text-[11px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg flex items-center gap-1 transition-all"
                          >
                            <Plus className="w-3 h-3" /> Add Course
                          </button>
                        </div>

                        <div className="space-y-2">
                          {yrData.sem2Subjects.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No courses added for this semester.</p>
                          ) : (
                            yrData.sem2Subjects.map((sub, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={sub}
                                  onChange={(e) => handleUpdateSubjectInEditCurriculum(activeEditYear, 2, idx, e.target.value)}
                                  placeholder="e.g. Database Management Systems (4 Credits)"
                                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:border-purple-500 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubjectFromEditCurriculum(activeEditYear, 2, idx)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Remove course"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Labs for Sem 2 */}
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700">{yrData.sem2Name} Practical Labs:</span>
                            <button
                              type="button"
                              onClick={() => handleAddLabToEditCurriculum(activeEditYear, 2)}
                              className="px-2 py-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md flex items-center gap-1 transition-all"
                            >
                              <Plus className="w-3 h-3" /> Add Lab
                            </button>
                          </div>
                          {yrData.sem2Labs && yrData.sem2Labs.map((lab, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={lab}
                                onChange={(e) => handleUpdateLabInEditCurriculum(activeEditYear, 2, idx, e.target.value)}
                                placeholder="e.g. Database Management Lab (2 Credits)"
                                className="flex-1 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveLabFromEditCurriculum(activeEditYear, 2, idx)}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  );
                })()}

              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Department & Curriculum</span>
                </button>
              </div>

            </form>

          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: VIEW DEPARTMENT DETAILS WITH YEAR & SEMESTER FILTERING           */}
      {/* ========================================================================= */}
      {viewingDept && (
        <ModalPortal isOpen={Boolean(viewingDept)} onClose={() => setViewingDept(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Header: Badge + Department Name + Subtitle on Left, Close X on Right (NO Edit button) */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 gap-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl border border-blue-100/90 shadow-2xs">
                  {viewingDept.code}
                </span>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                    {viewingDept.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {viewingDept.totalYears || 4} Years Curriculum • {viewingDept.facultyCount} Faculty • {viewingDept.studentCount} Students
                  </p>
                </div>
              </div>

              {/* Top Right: Only Close X Button */}
              <button 
                onClick={() => setViewingDept(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100/80 hover:bg-slate-200 rounded-xl transition-all"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Department Head (HOD) Banner */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                  {viewingDept.hod.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    DEPARTMENT LEADERSHIP
                  </span>
                  <p className="text-sm font-bold text-slate-900">{viewingDept.hod}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-white text-slate-600 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs hidden sm:inline-block">
                {formatHodEmail(viewingDept.hod)}
              </span>
            </div>

            {/* YEAR & SEMESTER CURRICULUM SECTION */}
            <div className="space-y-4">
              
              {/* Title and Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" /> OFFERED COURSES & MODULES ({filteredViewCourses.length} Subjects)
                </h4>
                <span className="text-xs text-slate-500 font-semibold">
                  Total Credits: {filteredViewCourses.reduce((acc, c) => acc + (c.credits || 0), 0)}
                </span>
              </div>

              {/* Year Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 overflow-x-auto text-xs">
                <button
                  onClick={() => {
                    setViewActiveYear('ALL');
                    setViewActiveSem('ALL');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                    viewActiveYear === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  All Years ({viewingDept.coursesList?.length || 0})
                </button>

                {[...Array(viewingDept.totalYears || 4)].map((_, i) => {
                  const y = i + 1;
                  const countInYear = (viewingDept.coursesList || []).filter(c => c.year === y).length;
                  const isActive = viewActiveYear === y;
                  return (
                    <button
                      key={y}
                      onClick={() => {
                        setViewActiveYear(y);
                        setViewActiveSem('ALL');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      {y === 1 ? '1st Year' : y === 2 ? '2nd Year' : y === 3 ? '3rd Year' : `${y}th Year`} ({countInYear})
                    </button>
                  );
                })}
              </div>

              {/* Semester Sub-Filter Pills (if a Year is selected or for quick access) */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Semester:</span>
                <button
                  onClick={() => setViewActiveSem('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                    viewActiveSem === 'ALL'
                      ? 'bg-slate-800 text-white border-slate-800 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All Sems
                </button>
                {availableSemesters
                  .filter(sem => {
                    if (viewActiveYear === 'ALL') return true;
                    const yr = Number(viewActiveYear);
                    const semNum = Number(sem.replace('Sem ', ''));
                    return semNum === yr * 2 - 1 || semNum === yr * 2;
                  })
                  .map((sem) => (
                    <button
                      key={sem}
                      onClick={() => setViewActiveSem(sem)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                        viewActiveSem === sem
                          ? 'bg-blue-600 text-white border-blue-600 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sem}
                    </button>
                  ))}
              </div>

              {/* Course Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {filteredViewCourses.length > 0 ? (
                  filteredViewCourses.map((course, idx) => (
                    <div 
                      key={idx} 
                      className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between text-xs hover:bg-white hover:border-blue-200 transition-all shadow-2xs"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 block leading-tight">{course.name}</span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                          <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {course.code}
                          </span>
                          <span>•</span>
                          <span>Year {course.year || 1} ({course.sem || 'Sem 1'})</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-blue-600 shrink-0 ml-2 bg-white px-2.5 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
                        {course.credits} Credits
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No subjects registered under this Year / Semester selection.
                  </div>
                )}
              </div>
            </div>

            {/* DEPARTMENT LABORATORIES & FACILITIES */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" /> DEPARTMENT LABORATORIES & FACILITIES
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {viewingDept.labs && viewingDept.labs.length > 0 ? (
                  viewingDept.labs.map((lab, idx) => (
                    <span key={idx} className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5">
                      <span>🔬</span> {lab}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Standard Department Laboratory</span>
                )}
              </div>
            </div>

            {/* Modal Bottom: Close Button */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingDept(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      {deletingDept && (
        <ModalPortal isOpen={Boolean(deletingDept)} onClose={() => setDeletingDept(null)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">Delete Department</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to remove <strong className="text-slate-800">{deletingDept.name}</strong> ({deletingDept.code})?
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-700 font-medium">
              This will remove this department from active academic listings.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDept(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
