import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Plus, 
  Search, 
  Filter, 
  Pin, 
  Calendar, 
  Users, 
  FileText, 
  Download, 
  Eye, 
  Pencil, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Share2, 
  Sparkles, 
  Tag, 
  Clock, 
  Send,
  Building,
  GraduationCap,
  Paperclip,
  Check
} from 'lucide-react';
import ModalPortal from './ModalPortal';

const INITIAL_NOTICES = [
  {
    id: 1,
    refNo: 'CIR/2025/EXAM-089',
    title: 'End-Semester University Practical Examination Schedule – May 2025',
    category: 'Examinations',
    priority: 'Urgent',
    targetAudience: 'All Students',
    targetDept: 'All Departments',
    publishDate: '2025-04-28',
    expiryDate: '2025-05-30',
    isPinned: true,
    author: 'Dr. K. Senthil Kumar',
    designation: 'Controller of Examinations',
    viewsCount: 1420,
    content: 'All undergraduate and postgraduate students are hereby informed that the End-Semester University Practical Examinations for the Academic Year 2024-2025 will commence from May 12, 2025. Detailed lab-wise timetable and batch allocation have been published on the department notice boards and student portals. Students must bring their validated lab observation record books and identity cards without fail.',
    attachments: [
      { name: 'Practical_Exam_Schedule_May2025.pdf', size: '2.4 MB' },
      { name: 'Lab_Batch_Allocation_List.pdf', size: '1.1 MB' }
    ]
  },
  {
    id: 2,
    refNo: 'CIR/2025/ACAD-114',
    title: 'Submission of Final Year Capstone Project Reports & Demonstration',
    category: 'Academic',
    priority: 'High',
    targetAudience: 'Students',
    targetDept: 'Engineering (CS, ECE, Mech, Civil)',
    publishDate: '2025-04-25',
    expiryDate: '2025-05-15',
    isPinned: true,
    author: 'Dr. Sunita Rao',
    designation: 'Dean – Academics & Research',
    viewsCount: 890,
    content: 'All 8th Semester B.E/B.Tech students must submit three hard copies of their Final Capstone Project Report along with plagiarism clearance certificates (< 10% similarity on Turnitin) to their respective departmental project coordinators on or before May 10, 2025. Final viva-voce examinations with external examiners will be held between May 18 and May 22, 2025.',
    attachments: [
      { name: 'Project_Report_Formatting_Guidelines_2025.pdf', size: '850 KB' },
      { name: 'Plagiarism_Declaration_Form.docx', size: '120 KB' }
    ]
  },
  {
    id: 3,
    refNo: 'CIR/2025/ADMIN-056',
    title: 'Institutional Holiday on Account of Buddha Purnima',
    category: 'Holidays',
    priority: 'Normal',
    targetAudience: 'All',
    targetDept: 'All Departments',
    publishDate: '2025-04-26',
    expiryDate: '2025-05-05',
    isPinned: false,
    author: 'Prof. V. Ramanathan',
    designation: 'Registrar & Head of Administration',
    viewsCount: 2150,
    content: 'The institution will remain closed on Monday, May 05, 2025 on account of Buddha Purnima. All regular classes, laboratory sessions, and administrative offices will not function. Hostels, campus security, and essential emergency services will operate as customary.',
    attachments: []
  },
  {
    id: 4,
    refNo: 'CIR/2025/PLACE-034',
    title: 'Campus Placement Drive: Tata Consultancy Services (TCS Digital / Ninja)',
    category: 'Placements',
    priority: 'High',
    targetAudience: 'Students',
    targetDept: 'CS, ECE, BCA, MBA',
    publishDate: '2025-04-22',
    expiryDate: '2025-05-08',
    isPinned: true,
    author: 'Mr. Rajesh Verma',
    designation: 'Head – Training & Placement Cell',
    viewsCount: 1780,
    content: 'TCS will be conducting an On-Campus recruitment drive for 2025 passing out batch students. Eligible registered candidates with CGPA >= 7.0 and no active backlogs must report to the APJ Abdul Kalam Auditorium at 08:30 AM on May 06, 2025 in formal attire with 2 updated resumes and valid ID proofs. Pre-placement talk begins at 09:00 AM followed by the technical aptitude test.',
    attachments: [
      { name: 'TCS_Campus_Drive_Job_Description.pdf', size: '1.8 MB' },
      { name: 'Shortlisted_Eligible_Candidates_RollNos.xlsx', size: '420 KB' }
    ]
  },
  {
    id: 5,
    refNo: 'CIR/2025/FAC-077',
    title: 'Faculty Development Programme (FDP) on Generative AI & Deep Learning',
    category: 'Events',
    priority: 'Normal',
    targetAudience: 'Faculty',
    targetDept: 'Computer Science, ECE & Data Science',
    publishDate: '2025-04-20',
    expiryDate: '2025-05-20',
    isPinned: false,
    author: 'Dr. Anand Swaminathan',
    designation: 'HOD – CSE Dept',
    viewsCount: 410,
    content: 'A 5-day AICTE sponsored national level Faculty Development Programme on "Generative AI Foundations, Large Language Models and Edge Computing" will be organized from May 20 to May 24, 2025 in Computing Lab 4. Faculty members across all disciplines are encouraged to participate. Certificates of completion will be awarded to all registered attendees.',
    attachments: [
      { name: 'FDP_GenAI_Brochure_Schedule.pdf', size: '3.2 MB' }
    ]
  },
  {
    id: 6,
    refNo: 'CIR/2025/FEE-029',
    title: 'Reminder: Clearance of Outstanding Tuition & Examination Fees',
    category: 'Administrative',
    priority: 'Urgent',
    targetAudience: 'Students',
    targetDept: 'All Departments',
    publishDate: '2025-04-18',
    expiryDate: '2025-05-10',
    isPinned: false,
    author: 'Mr. K. Narayanan',
    designation: 'Chief Accounts Officer',
    viewsCount: 1620,
    content: 'Students who have not cleared their pending semester tuition fees, transport fees, or hostel dues are strictly instructed to pay the remaining dues before May 10, 2025 through the student online portal or at the finance counter. Hall tickets for the upcoming university exams will be issued only upon full clearance of dues.',
    attachments: []
  }
];

const CATEGORIES = ['All', 'Examinations', 'Academic', 'Placements', 'Holidays', 'Administrative', 'Events'];
const PRIORITIES = ['All', 'Urgent', 'High', 'Normal', 'Low'];
const AUDIENCES = ['All', 'All Students', 'Students', 'Faculty', 'Staff'];

export default function NoticesManagement() {
  const [notices, setNotices] = useState(INITIAL_NOTICES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedAudience, setSelectedAudience] = useState('All');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Lock background scroll when any modal is open
  React.useEffect(() => {
    const isAnyModalOpen = Boolean(showCreateModal || showViewModal || showEditModal || showDeleteModal);
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
  }, [showCreateModal, showViewModal, showEditModal, showDeleteModal]);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    title: '',
    refNo: '',
    category: 'Academic',
    priority: 'Normal',
    targetAudience: 'All Students',
    targetDept: 'All Departments',
    publishDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    isPinned: false,
    author: 'Admin Office',
    designation: 'Institutional Coordinator',
    content: '',
    attachments: []
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Filtered Notices
  const filteredNotices = useMemo(() => {
    return notices.filter(item => {
      const matchSearch = 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.refNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchPriority = selectedPriority === 'All' || item.priority === selectedPriority;
      const matchAudience = selectedAudience === 'All' || item.targetAudience === selectedAudience || (selectedAudience === 'Students' && item.targetAudience.includes('Students'));

      return matchSearch && matchCategory && matchPriority && matchAudience;
    });
  }, [notices, searchTerm, selectedCategory, selectedPriority, selectedAudience]);

  // Pinned Notices
  const pinnedNotices = useMemo(() => {
    return notices.filter(n => n.isPinned);
  }, [notices]);

  // Handlers
  const handleTogglePin = (id, e) => {
    if (e) e.stopPropagation();
    setNotices(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    showToast('Notice pin status updated');
  };

  const handleOpenCreate = () => {
    const randomRef = `CIR/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;
    setFormData({
      title: '',
      refNo: randomRef,
      category: 'Academic',
      priority: 'Normal',
      targetAudience: 'All Students',
      targetDept: 'All Departments',
      publishDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isPinned: false,
      author: 'Admin Office',
      designation: 'Dean / Registrar',
      content: '',
      attachments: []
    });
    setShowCreateModal(true);
  };

  const handleSaveCreate = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill out the circular title and detailed content.');
      return;
    }

    const newNotice = {
      ...formData,
      id: Date.now(),
      viewsCount: 0
    };

    setNotices([newNotice, ...notices]);
    setShowCreateModal(false);
    showToast('Notice published and broadcasted successfully!');
  };

  const handleOpenEdit = (notice, e) => {
    if (e) e.stopPropagation();
    setShowEditModal(notice);
    setFormData({ ...notice });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setNotices(prev => prev.map(n => n.id === showEditModal.id ? { ...formData, id: showEditModal.id } : n));
    setShowEditModal(null);
    showToast('Notice updated successfully!');
  };

  const handleDeleteNotice = (id) => {
    setNotices(prev => prev.filter(n => n.id !== id));
    setShowDeleteModal(null);
    if (showViewModal?.id === id) setShowViewModal(null);
    showToast('Notice removed successfully.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      
      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notices & Circulars</h1>
              <p className="text-xs text-slate-500 font-medium">
                Broadcast official circulars, exam notifications, and campus announcements
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Notice</span>
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Notices</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{notices.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pinned Bulletins</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{pinnedNotices.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Pin className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Urgent Alerts</p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {notices.filter(n => n.priority === 'Urgent').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Reads</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {notices.reduce((acc, n) => acc + (n.viewsCount || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* TOP PINNED NOTICES BANNER */}
      {pinnedNotices.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
            <Pin className="w-4 h-4 fill-amber-600 text-amber-600" />
            <span>Priority Pinned Announcements</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pinnedNotices.map((pin) => (
              <div 
                key={pin.id}
                onClick={() => setShowViewModal(pin)}
                className="bg-white p-4 rounded-2xl border border-amber-200/70 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                      {pin.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{pin.refNo}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {pin.title}
                  </h4>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-slate-400" /> {pin.publishDate}
                  </span>
                  <span className="font-bold text-blue-600 flex items-center gap-1">
                    Read Notice →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search circulars, ref numbers, content..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500"
            >
              {PRIORITIES.map(p => (
                <option key={p} value={p}>Priority: {p}</option>
              ))}
            </select>

            {/* Audience Filter */}
            <select
              value={selectedAudience}
              onChange={(e) => setSelectedAudience(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500"
            >
              {AUDIENCES.map(a => (
                <option key={a} value={a}>Audience: {a}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* NOTICES LIST */}
      <div className="space-y-3">
        {filteredNotices.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No circulars or notices found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search terms, category, or priority filters to find what you're looking for.
            </p>
          </div>
        ) : (
          filteredNotices.map((notice) => {
            const isUrgent = notice.priority === 'Urgent';
            const isHigh = notice.priority === 'High';

            return (
              <div
                key={notice.id}
                onClick={() => setShowViewModal(notice)}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-4 group"
              >
                {/* Notice Top Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Priority Badge */}
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      isUrgent 
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : isHigh 
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>}
                      {notice.priority}
                    </span>

                    {/* Category */}
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {notice.category}
                    </span>

                    {/* Target Audience */}
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60">
                      <Users className="w-3 h-3 text-slate-400" />
                      {notice.targetAudience} • {notice.targetDept}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-xs font-mono font-bold text-slate-400">{notice.refNo}</span>
                    
                    {/* Pin button */}
                    <button
                      onClick={(e) => handleTogglePin(notice.id, e)}
                      title={notice.isPinned ? "Unpin notice" : "Pin notice"}
                      className={`p-1.5 rounded-lg transition-all ${
                        notice.isPinned
                          ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                      }`}
                    >
                      <Pin className={`w-4 h-4 ${notice.isPinned ? 'fill-amber-600' : ''}`} />
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={(e) => handleOpenEdit(notice, e)}
                      title="Edit notice"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteModal(notice);
                      }}
                      title="Delete notice"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title & Excerpt */}
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {notice.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {notice.content}
                  </p>
                </div>

                {/* Attachments & Author Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    {notice.attachments?.map((att, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
                        <Paperclip className="w-3 h-3 text-blue-500" />
                        <span>{att.name}</span>
                        <span className="text-slate-400 font-normal">({att.size})</span>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 font-medium shrink-0">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{notice.publishDate}</span>
                    </div>
                    <div>
                      <span>By </span>
                      <strong className="text-slate-700">{notice.author}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: VIEW NOTICE IN DETAIL */}
      {showViewModal && (
        <ModalPortal isOpen={Boolean(showViewModal)} onClose={() => setShowViewModal(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 my-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {showViewModal.category}
                  </span>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    showViewModal.priority === 'Urgent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {showViewModal.priority} Priority
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {showViewModal.refNo}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                  {showViewModal.title}
                </h2>
              </div>
              <button
                onClick={() => setShowViewModal(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Circular Info Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl text-xs border border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Target Audience</p>
                <p className="font-bold text-slate-800 mt-0.5">{showViewModal.targetAudience}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Publish Date</p>
                <p className="font-bold text-slate-800 mt-0.5">{showViewModal.publishDate}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Valid Until</p>
                <p className="font-bold text-slate-800 mt-0.5">{showViewModal.expiryDate || 'Indefinite'}</p>
              </div>
            </div>

            {/* Circular Body Content */}
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-white p-4 rounded-2xl border border-slate-100">
              {showViewModal.content}
            </div>

            {/* Attachments Section */}
            {showViewModal.attachments?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Attached Documents</p>
                <div className="space-y-2">
                  {showViewModal.attachments.map((att, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{att.name}</p>
                          <p className="text-[10px] text-slate-400">{att.size}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => showToast(`Downloading ${att.name}...`)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Author Footer */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Issued By</p>
                <p className="font-bold text-slate-900">{showViewModal.author}</p>
                <p className="text-[11px] text-slate-500">{showViewModal.designation}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Reads</p>
                <p className="font-bold text-emerald-600 text-sm">{showViewModal.viewsCount || 1} views</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowViewModal(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: CREATE / EDIT NOTICE */}
      {(showCreateModal || showEditModal) && (
        <ModalPortal isOpen={Boolean(showCreateModal || showEditModal)} onClose={() => { setShowCreateModal(false); setShowEditModal(null); }}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  {showCreateModal ? <Plus className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {showCreateModal ? 'Create New Notice / Circular' : 'Edit Notice Details'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Fill in the details below to publish an official bulletin
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={showCreateModal ? handleSaveCreate : handleSaveEdit} className="space-y-4">
              {/* Notice Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Circular Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. University End-Semester Practical Exam Schedule"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Ref No & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={formData.refNo}
                    onChange={(e) => setFormData({ ...formData, refNo: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority & Target Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    {PRIORITIES.filter(p => p !== 'All').map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Audience *
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="All Students">All Students</option>
                    <option value="Faculty">Faculty Members</option>
                    <option value="Staff">Administrative Staff</option>
                    <option value="All">Everyone (Campus Wide)</option>
                  </select>
                </div>
              </div>

              {/* Target Dept & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Department
                  </label>
                  <input
                    type="text"
                    value={formData.targetDept}
                    onChange={(e) => setFormData({ ...formData, targetDept: e.target.value })}
                    placeholder="All Departments or CS, ECE..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Publish Date
                  </label>
                  <input
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Author & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Author / Issuer Name
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Full Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Circular Body Content *
                </label>
                <textarea
                  rows={5}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter the complete detailed notice text here..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Pin to top checkbox */}
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Pin this notice to the top priority announcements banner</span>
              </label>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(null);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20"
                >
                  {showCreateModal ? 'Publish Circular' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: DELETE NOTICE CONFIRMATION */}
      {showDeleteModal && (
        <ModalPortal isOpen={Boolean(showDeleteModal)} onClose={() => setShowDeleteModal(null)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Notice</h3>
                <p className="text-xs text-slate-500 mt-0.5">Are you sure you want to permanently remove this notice?</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-slate-800">
              "{showDeleteModal.title}"
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteNotice(showDeleteModal.id)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
