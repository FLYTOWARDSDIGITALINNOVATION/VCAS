import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Eye, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  X, 
  Tag, 
  Award, 
  DollarSign, 
  Share2, 
  LayoutGrid, 
  List, 
  CalendarDays,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Check,
  Palette,
  Layers,
  ArrowRight,
  Ticket,
  QrCode,
  Printer,
  Building2,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck
} from 'lucide-react';
import ModalPortal from './ModalPortal';

export const BANNER_THEMES = [
  { 
    id: 'purple-pink', 
    label: 'Purple / Pink Neon', 
    gradient: 'from-purple-600 via-fuchsia-600 to-pink-600',
    cssClass: 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600'
  },
  { 
    id: 'blue-indigo', 
    label: 'Blue / Indigo Cyan', 
    gradient: 'from-blue-600 via-indigo-600 to-cyan-500',
    cssClass: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500'
  },
  { 
    id: 'emerald-teal', 
    label: 'Emerald / Teal Sky', 
    gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    cssClass: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600'
  },
  { 
    id: 'amber-orange', 
    label: 'Amber / Orange Fire', 
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    cssClass: 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500'
  },
  { 
    id: 'royal-violet', 
    label: 'Royal Violet Dark', 
    gradient: 'from-violet-800 via-purple-900 to-indigo-950',
    cssClass: 'bg-gradient-to-r from-violet-800 via-purple-900 to-indigo-950'
  },
  { 
    id: 'forest-green', 
    label: 'Deep Forest Green', 
    gradient: 'from-teal-800 via-emerald-900 to-slate-900',
    cssClass: 'bg-gradient-to-r from-teal-800 via-emerald-900 to-slate-900'
  }
];

export const DEFAULT_COLLEGES = [
  'Vidyapeeth College of Arts and Science (Autonomous)',
  'PSG College of Technology, Coimbatore',
  'Loyola College, Chennai',
  'Madras Christian College (MCC), Chennai',
  'Anna University (CEG Campus), Chennai',
  'National Institute of Technology (NIT), Trichy',
  'Coimbatore Institute of Technology (CIT)',
  'Sri Krishna College of Engineering & Technology',
  'Amrita Vishwa Vidyapeetham, Coimbatore',
  'Kumaraguru College of Technology (KCT)'
];

export const AUDIENCES = [
  'Open to All',
  'Students Only',
  'Faculty & Staff',
  'Department Only',
  'External Delegates'
];

const INITIAL_EVENTS = [
  {
    id: 1,
    title: 'Tarang 2026 – Annual Inter-College Cultural Fest',
    category: 'Cultural Fest',
    department: 'Student Affairs & Cultural Council',
    audience: 'Open to All',
    startDate: '2026-05-22',
    startTime: '10:00 AM',
    endDate: '2026-05-23',
    endTime: '08:30 PM',
    venue: 'Main Open Air Theatre (OAT) & Campus Ground',
    speaker: 'Shri Vijay Prakash (Renowned Playback Singer & Music Composer)',
    organizer: 'Vidyapeeth Fine Arts & Cultural Club',
    coordinatorContact: '+91 97901 88990',
    maxCapacity: 1500,
    registeredCount: 1240,
    registrationFee: 'Free Admission',
    status: 'Upcoming',
    bannerGradient: 'from-purple-600 via-fuchsia-600 to-pink-600',
    description: 'The 32nd edition of Vidyapeeth flagship cultural extravaganza featuring 25+ events across Music, Dance, Dramatics, Fine Arts, Literary, and Fashion Show. Grand Celebrity Star Night on final day.',
    agenda: [
      { time: '10:00 AM', title: 'Opening Drum Ensemble & Classical Fusion Dance' },
      { time: '01:30 PM', title: 'Choreo Night & Western Group Dance Face-off' },
      { time: '05:30 PM', title: 'Battle of the Rock Bands & Stand-up Comedy' },
      { time: '07:30 PM', title: 'Celebrity Musical Concert with Live Band' }
    ]
  },
  {
    id: 2,
    title: 'INNOVEX 2026 – National Technical Symposium & Hackathon',
    category: 'Technical Symposium',
    department: 'Computer Science & Engineering',
    audience: 'Open to All',
    startDate: '2026-05-15',
    startTime: '09:00 AM',
    endDate: '2026-05-16',
    endTime: '05:00 PM',
    venue: 'APJ Abdul Kalam Auditorium & Labs 1-4',
    speaker: 'Dr. Anand Ramanujam (Director of AI, Google Cloud India)',
    organizer: 'CSE Department & Coding Club',
    coordinatorContact: '+91 98401 23456',
    maxCapacity: 400,
    registeredCount: 345,
    registrationFee: '₹150 / Team',
    status: 'Upcoming',
    bannerGradient: 'from-blue-600 via-indigo-600 to-cyan-500',
    description: 'Premier annual national symposium featuring a 24-hour hackathon, AI Paper Presentation, Web3 Quest, Circuit Debugging, and Reverse Coding challenges with total cash prizes worth ₹1.5 Lakhs.',
    agenda: [
      { time: '09:00 AM - 10:30 AM', title: 'Inaugural Ceremony & Keynote by Dr. Anand' },
      { time: '11:00 AM - 04:00 PM', title: '24-Hour National Hackathon Kickoff & Mentorship' },
      { time: '02:00 PM - 05:00 PM', title: 'Technical Paper Presentation & Project Expo' },
      { time: 'Next Day 03:00 PM', title: 'Grand Finale & Award Felicitation' }
    ]
  },
  {
    id: 3,
    title: 'Hands-on Workshop: VLSI Physical Design & Chip Fabrication',
    category: 'Workshop & Seminar',
    department: 'Electronics & Communication',
    audience: 'Students Only',
    startDate: '2026-05-10',
    startTime: '09:30 AM',
    endDate: '2026-05-10',
    endTime: '04:30 PM',
    venue: 'DSP & VLSI Microelectronics Lab',
    speaker: 'Mr. Vigneshwar Sundaram (Principal Engineer, Qualcomm)',
    organizer: 'ECE Association & IEEE Student Branch',
    coordinatorContact: '+91 98840 55443',
    maxCapacity: 75,
    registeredCount: 68,
    registrationFee: '₹200',
    status: 'Upcoming',
    bannerGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    description: 'Intensive practical workshop covering Cadence Virtuoso tools, RTL-to-GDSII flow, static timing analysis (STA), clock tree synthesis, and modern 5nm node challenges.',
    agenda: [
      { time: '09:30 AM - 11:30 AM', title: 'RTL synthesis and standard cell placement' },
      { time: '11:45 AM - 01:15 PM', title: 'Hands-on lab session with Cadence EDA tools' },
      { time: '02:00 PM - 04:30 PM', title: 'Routing, DRC/LVS checks, and tape-out readiness' }
    ]
  },
  {
    id: 4,
    title: 'Annual Inter-Departmental Sports Meet "KHEL UTSAV 2026"',
    category: 'Sports & Games',
    department: 'Physical Education Department',
    audience: 'Open to All',
    startDate: '2026-05-02',
    startTime: '07:00 AM',
    endDate: '2026-05-04',
    endTime: '06:00 PM',
    venue: 'University Main Sports Complex & Synthetic Track',
    speaker: 'Ms. Shiny Wilson (Olympian & Arjuna Awardee)',
    organizer: 'Dept of Physical Education',
    coordinatorContact: '+91 94440 11223',
    maxCapacity: 600,
    registeredCount: 520,
    registrationFee: 'Free',
    status: 'Ongoing',
    bannerGradient: 'from-amber-500 via-orange-500 to-red-500',
    description: 'Annual championship featuring Athletics (100m, 400m, 4x100m relay, long jump), Cricket, Football, Basketball, Badminton, Volleyball, and Chess with Rolling Trophy for Best Department.',
    agenda: [
      { time: '07:00 AM', title: 'Torch Relay, March Past & Inauguration' },
      { time: '09:00 AM', title: 'Athletics Track & Field Prelims' },
      { time: '02:00 PM', title: 'Team Sports Knockout Tournaments' },
      { time: 'Day 3 04:00 PM', title: 'Finals, Tug of War & Trophy Ceremony' }
    ]
  },
  {
    id: 5,
    title: 'Global Career Summit & Placement Masterclass with Alumni Leaders',
    category: 'Placement Drive',
    department: 'Training & Placement Cell',
    audience: 'Students Only',
    startDate: '2026-05-08',
    startTime: '02:00 PM',
    endDate: '2026-05-08',
    endTime: '06:00 PM',
    venue: 'Silver Jubilee Hall & Virtual Zoom Stream',
    speaker: 'Panel of 6 VCAS Alumni working at Microsoft, Amazon, Morgan Stanley, ISRO',
    organizer: 'Alumni Relations & Career Guidance Cell',
    coordinatorContact: '+91 99620 99887',
    maxCapacity: 350,
    registeredCount: 310,
    registrationFee: 'Free',
    status: 'Upcoming',
    bannerGradient: 'from-violet-800 via-purple-900 to-indigo-950',
    description: 'Interactive career guidance session on overseas MS applications, cracking FAANG software interviews, GRE/GMAT prep, product management, and high-impact resume crafting.',
    agenda: [
      { time: '02:00 PM - 03:15 PM', title: 'Tech Career Pathways in 2026 & Beyond' },
      { time: '03:30 PM - 04:45 PM', title: 'Higher Studies & Scholarships in USA/Europe' },
      { time: '05:00 PM - 06:00 PM', title: '1-on-1 Q&A and Resume Review Circles' }
    ]
  },
  {
    id: 6,
    title: 'Guest Lecture: Electric Vehicle Architecture & Battery Management Systems',
    category: 'Guest Lecture',
    department: 'Mechanical & Automobile Engineering',
    audience: 'Faculty & Staff',
    startDate: '2026-04-18',
    startTime: '10:30 AM',
    endDate: '2026-04-18',
    endTime: '01:00 PM',
    venue: 'Seminar Hall 2',
    speaker: 'Dr. R. Balachander (Chief Engineer – EV Power, Tata Motors)',
    organizer: 'Mechanical Engineering Association',
    coordinatorContact: '+91 98410 77665',
    maxCapacity: 180,
    registeredCount: 165,
    registrationFee: 'Free',
    status: 'Completed',
    bannerGradient: 'from-teal-800 via-emerald-900 to-slate-900',
    description: 'Special lecture on thermal runaway protection in Li-ion cells, regenerative braking algorithms, powertrain integration, and charging infrastructure standards.',
    agenda: [
      { time: '10:30 AM - 12:00 PM', title: 'Thermal Management & Cell Chemistry in Modern EVs' },
      { time: '12:15 PM - 01:00 PM', title: 'Interactive Case Studies & Industry Trends' }
    ]
  }
];

const CATEGORIES = [
  'All', 
  'Technical Symposium', 
  'Cultural Fest', 
  'Workshop & Seminar', 
  'Sports & Games', 
  'Placement Drive', 
  'Guest Lecture'
];

const DEPARTMENTS = [
  'All', 
  'Computer Science & Engineering', 
  'Electronics & Communication', 
  'Mechanical & Automobile Engineering', 
  'Student Affairs & Cultural Council', 
  'Physical Education Department', 
  'Training & Placement Cell'
];

const STATUSES = ['All', 'Upcoming', 'Ongoing', 'Completed'];

export default function EventsManagement() {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'calendar'
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(null);
  const [viewDetailTab, setViewDetailTab] = useState('overview'); // 'overview' | 'registrations'
  const [showEditModal, setShowEditModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [registeringEvent, setRegisteringEvent] = useState(null);
  const [registrationSuccessPass, setRegistrationSuccessPass] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Colleges List (Maintained with previous & new entries)
  const [collegesList, setCollegesList] = useState(DEFAULT_COLLEGES);
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);

  // Pre-loaded sample registrations for events
  const [eventRegistrations, setEventRegistrations] = useState({
    1: [
      {
        id: 'REG-101',
        passNo: 'PASS-TARANG-2026-8841',
        studentName: 'Aditya Kapoor',
        rollNo: 'VCAS23CS042',
        collegeName: 'Vidyapeeth College of Arts and Science (Autonomous)',
        department: 'Computer Science & Engineering',
        year: '3rd Year (Semester 5/6)',
        email: 'aditya.k@vcas.edu',
        phone: '+91 98401 11223',
        participationType: 'Team Leader',
        teamName: 'Cosmic Beats',
        teamSize: 6,
        notes: 'Bringing acoustic guitar & keyboard',
        registeredAt: '28 Apr 2026',
        eventTitle: 'Tarang 2026 – Annual Inter-College Cultural Fest',
        eventDate: '2026-05-22',
        eventTime: '10:00 AM - 08:30 PM',
        eventVenue: 'Main Open Air Theatre (OAT) & Campus Ground',
        eventCategory: 'Cultural Fest',
        eventGradient: 'from-purple-600 via-fuchsia-600 to-pink-600'
      },
      {
        id: 'REG-102',
        passNo: 'PASS-TARANG-2026-8842',
        studentName: 'Priya Sharma',
        rollNo: 'VCAS23EC014',
        collegeName: 'Loyola College, Chennai',
        department: 'Electronics & Communication',
        year: '3rd Year (Semester 5/6)',
        email: 'priya.s@loyola.edu',
        phone: '+91 98841 22334',
        participationType: 'Individual Contestant',
        teamName: '',
        teamSize: 1,
        notes: 'Classical Solo Singing competition track',
        registeredAt: '29 Apr 2026',
        eventTitle: 'Tarang 2026 – Annual Inter-College Cultural Fest',
        eventDate: '2026-05-22',
        eventTime: '10:00 AM - 08:30 PM',
        eventVenue: 'Main Open Air Theatre (OAT) & Campus Ground',
        eventCategory: 'Cultural Fest',
        eventGradient: 'from-purple-600 via-fuchsia-600 to-pink-600'
      },
      {
        id: 'REG-103',
        passNo: 'PASS-TARANG-2026-8843',
        studentName: 'Vikramaditya Rao',
        rollNo: 'VCAS24ME008',
        collegeName: 'PSG College of Technology, Coimbatore',
        department: 'Mechanical & Automobile Engineering',
        year: '2nd Year (Semester 3/4)',
        email: 'vikram.rao@psgtech.edu',
        phone: '+91 97901 33445',
        participationType: 'Audience / Attendee',
        teamName: '',
        teamSize: 1,
        notes: 'Star Night concert pass',
        registeredAt: '30 Apr 2026',
        eventTitle: 'Tarang 2026 – Annual Inter-College Cultural Fest',
        eventDate: '2026-05-22',
        eventTime: '10:00 AM - 08:30 PM',
        eventVenue: 'Main Open Air Theatre (OAT) & Campus Ground',
        eventCategory: 'Cultural Fest',
        eventGradient: 'from-purple-600 via-fuchsia-600 to-pink-600'
      }
    ],
    2: [
      {
        id: 'REG-201',
        passNo: 'PASS-INNOVEX-2026-7721',
        studentName: 'Siddharth Menon',
        rollNo: 'VCAS23CS089',
        collegeName: 'National Institute of Technology (NIT), Trichy',
        department: 'Computer Science & Engineering',
        year: '3rd Year (Semester 5/6)',
        email: 'siddharth.m@nitt.edu',
        phone: '+91 99620 55441',
        participationType: 'Team Leader',
        teamName: 'ByteBenders',
        teamSize: 4,
        notes: '24-hour AI Track hackathon',
        registeredAt: '01 May 2026',
        eventTitle: 'INNOVEX 2026 – National Technical Symposium & Hackathon',
        eventDate: '2026-05-15',
        eventTime: '09:00 AM - 05:00 PM',
        eventVenue: 'APJ Abdul Kalam Auditorium & Labs 1-4',
        eventCategory: 'Technical Symposium',
        eventGradient: 'from-blue-600 via-indigo-600 to-cyan-500'
      }
    ]
  });

  const [regSearchTerm, setRegSearchTerm] = useState('');

  // Student registration form state
  const [regStudentForm, setRegStudentForm] = useState({
    studentName: '',
    rollNo: '',
    collegeName: 'Vidyapeeth College of Arts and Science (Autonomous)',
    department: 'Computer Science & Engineering',
    year: '3rd Year (Semester 5/6)',
    email: '',
    phone: '',
    participationType: 'Individual Contestant',
    teamName: '',
    teamSize: 1,
    notes: ''
  });

  // Lock background scroll when any modal is open
  React.useEffect(() => {
    const isAnyModalOpen = Boolean(showCreateModal || showViewModal || showEditModal || showDeleteModal || registeringEvent || registrationSuccessPass);
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
  }, [showCreateModal, showViewModal, showEditModal, showDeleteModal, registeringEvent, registrationSuccessPass]);

  // Form State
  const [modalTab, setModalTab] = useState('basic'); // 'basic', 'time', 'team', 'agenda'
  const [newAgendaTime, setNewAgendaTime] = useState('');
  const [newAgendaTitle, setNewAgendaTitle] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: 'Cultural Fest',
    department: 'Student Affairs & Cultural Council',
    audience: 'Open to All',
    startDate: '',
    startTime: '09:30 AM',
    endDate: '',
    endTime: '04:30 PM',
    venue: '',
    speaker: '',
    organizer: '',
    coordinatorContact: '',
    maxCapacity: 500,
    registeredCount: 0,
    registrationFee: 'Free',
    status: 'Upcoming',
    bannerGradient: 'from-purple-600 via-fuchsia-600 to-pink-600',
    description: '',
    agenda: []
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Agenda handlers
  const handleAddAgendaItem = () => {
    if (!newAgendaTitle.trim()) return;
    setFormData(prev => ({
      ...prev,
      agenda: [
        ...(prev.agenda || []),
        { time: newAgendaTime.trim() || 'TBD', title: newAgendaTitle.trim() }
      ]
    }));
    setNewAgendaTime('');
    setNewAgendaTitle('');
  };

  const handleRemoveAgendaItem = (idxToRemove) => {
    setFormData(prev => ({
      ...prev,
      agenda: (prev.agenda || []).filter((_, idx) => idx !== idxToRemove)
    }));
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      const matchSearch = 
        ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.organizer.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCat = selectedCategory === 'All' || ev.category === selectedCategory;
      const matchDept = selectedDept === 'All' || ev.department === selectedDept;
      const matchStatus = selectedStatus === 'All' || ev.status === selectedStatus;

      return matchSearch && matchCat && matchDept && matchStatus;
    });
  }, [events, searchTerm, selectedCategory, selectedDept, selectedStatus]);

  // Handlers
  const handleOpenCreate = () => {
    setModalTab('basic');
    setFormData({
      title: '',
      category: 'Cultural Fest',
      department: 'Student Affairs & Cultural Council',
      audience: 'Open to All',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startTime: '10:00 AM',
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endTime: '08:00 PM',
      venue: 'Main Open Air Theatre (OAT)',
      speaker: '',
      organizer: 'Vidyapeeth Student Council',
      coordinatorContact: '+91 98401 23456',
      maxCapacity: 1000,
      registeredCount: 0,
      registrationFee: 'Free Admission',
      status: 'Upcoming',
      bannerGradient: 'from-purple-600 via-fuchsia-600 to-pink-600',
      description: '',
      agenda: [
        { time: '10:00 AM - 11:30 AM', title: 'Inaugural Ceremony & Welcome Address' },
        { time: '02:00 PM - 05:00 PM', title: 'Main Stage Competitions & Live Performances' },
        { time: '06:30 PM - 08:30 PM', title: 'Celebrity Night & Award Felicitation' }
      ]
    });
    setShowCreateModal(true);
  };

  const handleSaveCreate = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.venue.trim()) {
      alert('Please provide event title and venue.');
      return;
    }

    const newEv = {
      ...formData,
      id: Date.now(),
      registeredCount: Number(formData.registeredCount) || 0,
      maxCapacity: Number(formData.maxCapacity) || 100,
      bannerGradient: formData.bannerGradient || 'from-purple-600 via-fuchsia-600 to-pink-600',
      audience: formData.audience || 'Open to All'
    };

    setEvents([newEv, ...events]);
    setShowCreateModal(false);
    showToast('Campus Event scheduled & published successfully!');
  };

  const handleOpenEdit = (ev, e) => {
    if (e) e.stopPropagation();
    setModalTab('basic');
    setShowEditModal(ev);
    setFormData({
      ...ev,
      audience: ev.audience || 'Open to All',
      bannerGradient: ev.bannerGradient || 'from-purple-600 via-fuchsia-600 to-pink-600',
      agenda: ev.agenda || []
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setEvents(prev => prev.map(item => item.id === showEditModal.id ? { 
      ...formData, 
      id: showEditModal.id,
      bannerGradient: formData.bannerGradient || 'from-purple-600 via-fuchsia-600 to-pink-600',
      audience: formData.audience || 'Open to All'
    } : item));
    setShowEditModal(null);
    showToast('Event details & banner theme updated successfully!');
  };

  const handleDeleteEvent = (id) => {
    setEvents(prev => prev.filter(item => item.id !== id));
    setShowDeleteModal(null);
    if (showViewModal?.id === id) setShowViewModal(null);
    showToast('Event removed successfully.');
  };

  // Student Registration Handlers
  const handleOpenRegister = (ev) => {
    setRegisteringEvent(ev);
    setShowCollegeDropdown(false);
    setRegStudentForm({
      studentName: '',
      rollNo: '',
      collegeName: 'Vidyapeeth College of Arts and Science (Autonomous)',
      department: (ev && ev.department !== 'All' && DEPARTMENTS.includes(ev.department)) ? ev.department : 'Computer Science & Engineering',
      year: '3rd Year (Semester 5/6)',
      email: '',
      phone: '',
      participationType: 'Individual Contestant',
      teamName: '',
      teamSize: 1,
      notes: ''
    });
  };

  const SAMPLE_STUDENTS = [
    { name: 'Aditya Kapoor', roll: 'VCAS23CS042', college: 'Vidyapeeth College of Arts and Science (Autonomous)', dept: 'Computer Science & Engineering', email: 'aditya.k@vcas.edu', phone: '+91 98401 11223', year: '3rd Year (Semester 5/6)', type: 'Team Leader', team: 'Cosmic Beats' },
    { name: 'Priya Sharma', roll: 'LOY23EC014', college: 'Loyola College, Chennai', dept: 'Electronics & Communication', email: 'priya.s@loyola.edu', phone: '+91 98841 22334', year: '3rd Year (Semester 5/6)', type: 'Individual Contestant', team: '' },
    { name: 'Vikramaditya Rao', roll: 'PSG24ME008', college: 'PSG College of Technology, Coimbatore', dept: 'Mechanical & Automobile Engineering', email: 'vikram.rao@psgtech.edu', phone: '+91 97901 33445', year: '2nd Year (Semester 3/4)', type: 'Audience / Attendee', team: '' },
    { name: 'Kavitha Ramaswamy', roll: 'NIT23CS098', college: 'National Institute of Technology (NIT), Trichy', dept: 'Computer Science & Engineering', email: 'kavitha.r@nitt.edu', phone: '+91 98410 66778', year: '3rd Year (Semester 5/6)', type: 'Team Member', team: 'ByteBenders' }
  ];

  const handleQuickFillStudent = () => {
    const randomStudent = SAMPLE_STUDENTS[Math.floor(Math.random() * SAMPLE_STUDENTS.length)];
    setRegStudentForm({
      studentName: randomStudent.name,
      rollNo: randomStudent.roll,
      collegeName: randomStudent.college,
      department: randomStudent.dept,
      year: randomStudent.year,
      email: randomStudent.email,
      phone: randomStudent.phone,
      participationType: randomStudent.type,
      teamName: randomStudent.team,
      teamSize: randomStudent.type.includes('Team') ? 4 : 1,
      notes: 'Registered via VCAS Inter-Collegiate Portal'
    });
    setShowCollegeDropdown(false);
  };

  const handleSubmitStudentRegistration = (e) => {
    e.preventDefault();
    if (!registeringEvent) return;

    if (!regStudentForm.studentName.trim() || !regStudentForm.rollNo.trim() || !regStudentForm.collegeName.trim() || !regStudentForm.email.trim() || !regStudentForm.phone.trim()) {
      alert('Please fill all required student credentials (*)');
      return;
    }

    if (registeringEvent.registeredCount >= registeringEvent.maxCapacity) {
      alert('Sorry, this event has already reached full seating capacity!');
      return;
    }

    const trimmedCollege = regStudentForm.collegeName.trim();
    // Add college to known colleges if not already present
    if (trimmedCollege && !collegesList.includes(trimmedCollege)) {
      setCollegesList(prev => [trimmedCollege, ...prev]);
    }

    const passPrefix = (registeringEvent.title.split(' ')[0] || 'EVT').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const passNo = `PASS-${passPrefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRegistration = {
      id: `REG-${Date.now()}`,
      passNo,
      studentName: regStudentForm.studentName.trim(),
      rollNo: regStudentForm.rollNo.trim().toUpperCase(),
      collegeName: trimmedCollege,
      department: regStudentForm.department,
      year: regStudentForm.year,
      email: regStudentForm.email.trim(),
      phone: regStudentForm.phone.trim(),
      participationType: regStudentForm.participationType,
      teamName: regStudentForm.teamName.trim(),
      teamSize: regStudentForm.teamSize,
      notes: regStudentForm.notes,
      registeredAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      eventTitle: registeringEvent.title,
      eventDate: registeringEvent.startDate,
      eventTime: `${registeringEvent.startTime} - ${registeringEvent.endTime}`,
      eventVenue: registeringEvent.venue,
      eventCategory: registeringEvent.category,
      eventGradient: registeringEvent.bannerGradient
    };

    // Update events registered count
    setEvents(prev => prev.map(item => {
      if (item.id === registeringEvent.id) {
        return { ...item, registeredCount: item.registeredCount + 1 };
      }
      return item;
    }));

    // Update showViewModal if active
    if (showViewModal && showViewModal.id === registeringEvent.id) {
      setShowViewModal(prev => ({ ...prev, registeredCount: prev.registeredCount + 1 }));
    }

    // Update event registrations map
    setEventRegistrations(prev => ({
      ...prev,
      [registeringEvent.id]: [newRegistration, ...(prev[registeringEvent.id] || [])]
    }));

    setRegisteringEvent(null);
    setShowCollegeDropdown(false);
    setRegistrationSuccessPass(newRegistration);
    showToast(`✓ Registration confirmed for ${newRegistration.studentName} (${trimmedCollege})! Official E-Pass generated.`);
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
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Campus Events & Activities</h1>
            <p className="text-xs text-slate-500 font-medium">
              Plan, organize, and monitor institutional symposiums, cultural fests, workshops, and sports
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              title="Table List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Events</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{events.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Upcoming</p>
            <p className="text-2xl font-black text-blue-600 mt-1">
              {events.filter(e => e.status === 'Upcoming').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Registrations</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {events.reduce((acc, e) => acc + (e.registeredCount || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ongoing Now</p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {events.filter(e => e.status === 'Ongoing').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search event, speaker, venue..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
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
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:border-purple-500"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>Status: {s}</option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:border-purple-500 max-w-[200px] truncate"
            >
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
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
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW: GRID OF CARDS */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No events found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No events match your current filter settings. Try clearing your filters or creating a new event.
              </p>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const capacityPercent = Math.min(100, Math.round((ev.registeredCount / ev.maxCapacity) * 100));
              const isOngoing = ev.status === 'Ongoing';
              const isCompleted = ev.status === 'Completed';

              return (
                <div
                  key={ev.id}
                  onClick={() => setShowViewModal(ev)}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer group"
                >
                  <div>
                    {/* Event Banner Top Strip */}
                    <div className={`h-24 bg-gradient-to-r ${ev.bannerGradient || 'from-blue-600 to-indigo-700'} p-4 flex flex-col justify-between text-white relative`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                          {ev.category}
                        </span>

                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-xs ${
                          isOngoing
                            ? 'bg-amber-400 text-amber-950 font-black animate-pulse'
                            : isCompleted
                            ? 'bg-slate-200 text-slate-800'
                            : 'bg-emerald-400 text-emerald-950'
                        }`}>
                          {ev.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-1.5 text-white/90">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{ev.startDate}</span>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-black/30 rounded-lg">
                          {ev.registrationFee}
                        </span>
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-5 space-y-3">
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{ev.department}</p>
                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-2 mt-0.5">
                          {ev.title}
                        </h3>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </div>

                        {ev.speaker && (
                          <div className="flex items-center gap-2">
                            <Award className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span className="truncate">{ev.speaker}</span>
                          </div>
                        )}
                      </div>

                      {/* Registration Progress Bar */}
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-500">Seats Filled</span>
                          <span className="text-slate-800">{ev.registeredCount} / {ev.maxCapacity} ({capacityPercent}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              capacityPercent >= 90 ? 'bg-rose-500' : 'bg-purple-600'
                            }`}
                            style={{ width: `${capacityPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-purple-600">
                      <span>View Details →</span>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleOpenEdit(ev, e)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit event"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteModal(ev);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW: TABLE LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Event Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Venue</th>
                  <th className="py-3.5 px-4">Registrations</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredEvents.map((ev) => (
                  <tr 
                    key={ev.id} 
                    onClick={() => setShowViewModal(ev)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="font-extrabold text-slate-900 text-xs">{ev.title}</p>
                      <p className="text-[10px] text-slate-400">{ev.department}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 font-bold text-[10px] rounded-md text-slate-700">
                        {ev.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div>{ev.startDate}</div>
                      <div className="text-[10px] text-slate-400">{ev.startTime}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">{ev.venue}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {ev.registeredCount} / {ev.maxCapacity}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        ev.status === 'Ongoing' ? 'bg-amber-100 text-amber-800' :
                        ev.status === 'Completed' ? 'bg-slate-100 text-slate-600' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleOpenEdit(ev, e)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteModal(ev);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: VIEW EVENT DETAILS */}
      {showViewModal && (
        <ModalPortal isOpen={Boolean(showViewModal)} onClose={() => { setShowViewModal(null); setViewDetailTab('overview'); }}>
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {showViewModal.category}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    {showViewModal.status}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {showViewModal.audience || 'Open to All'}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                  {showViewModal.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Organized by {showViewModal.organizer}</p>
              </div>
              <button
                onClick={() => { setShowViewModal(null); setViewDetailTab('overview'); }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* View Detail Tabs (Overview vs Registered Students) */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setViewDetailTab('overview')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewDetailTab === 'overview'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Event Details & Agenda
              </button>
              <button
                type="button"
                onClick={() => setViewDetailTab('registrations')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewDetailTab === 'registrations'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Registered Students ({(eventRegistrations[showViewModal.id] || []).length})</span>
              </button>
            </div>

            {/* TAB: OVERVIEW */}
            {viewDetailTab === 'overview' && (
              <div className="space-y-5 animate-fadeIn">
                {/* Event Top Visual Banner */}
                <div className={`h-24 rounded-2xl bg-gradient-to-r ${showViewModal.bannerGradient || 'from-purple-600 via-fuchsia-600 to-pink-600'} p-4 flex flex-col justify-between text-white shadow-md`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                      {showViewModal.category}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/30 backdrop-blur-md text-white font-black">
                      {showViewModal.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold opacity-80 block tracking-wider">Target Audience: {showViewModal.audience || 'Open to All'}</span>
                    <p className="text-xs font-semibold opacity-90">{showViewModal.department}</p>
                  </div>
                </div>

                {/* Quick Grid Info */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl text-xs border border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Date & Time</p>
                    <p className="font-bold text-slate-800 mt-0.5">{showViewModal.startDate}</p>
                    <p className="text-[11px] text-slate-500">{showViewModal.startTime} - {showViewModal.endTime}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Venue</p>
                    <p className="font-bold text-slate-800 mt-0.5">{showViewModal.venue}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Fee & Seats</p>
                    <p className="font-bold text-slate-800 mt-0.5">{showViewModal.registrationFee}</p>
                    <p className="text-[11px] text-slate-500">{showViewModal.registeredCount} / {showViewModal.maxCapacity} Registered</p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Event Overview</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-2xl border border-slate-100">
                    {showViewModal.description}
                  </p>
                </div>

                {/* Speaker / Chief Guest */}
                {showViewModal.speaker && (
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-purple-700 uppercase">Chief Guest / Key Speaker</p>
                      <p className="text-xs font-extrabold text-slate-900 mt-0.5">{showViewModal.speaker}</p>
                    </div>
                  </div>
                )}

                {/* Agenda Timeline */}
                {showViewModal.agenda?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Event Agenda</h4>
                    <div className="space-y-2">
                      {showViewModal.agenda.map((ag, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-xs border border-slate-100">
                          <span className="font-mono font-bold text-purple-700 w-36 shrink-0">{ag.time}</span>
                          <span className="text-slate-800 font-semibold">{ag.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: REGISTERED STUDENTS LIST */}
            {viewDetailTab === 'registrations' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regSearchTerm}
                      onChange={(e) => setRegSearchTerm(e.target.value)}
                      placeholder="Search registered student or roll no..."
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <button
                    onClick={() => handleOpenRegister(showViewModal)}
                    className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register New Student</span>
                  </button>
                </div>

                {(!eventRegistrations[showViewModal.id] || eventRegistrations[showViewModal.id].length === 0) ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <Users className="w-8 h-8 text-slate-400 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-700">No student registrations recorded yet</h4>
                    <p className="text-[11px] text-slate-400">Click below to register the first student for this event.</p>
                    <button
                      onClick={() => handleOpenRegister(showViewModal)}
                      className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl mt-2"
                    >
                      Register Student Now
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Student</th>
                          <th className="py-2.5 px-3">College / Institution</th>
                          <th className="py-2.5 px-3">Dept & Year</th>
                          <th className="py-2.5 px-3">Participation</th>
                          <th className="py-2.5 px-3">E-Pass ID</th>
                          <th className="py-2.5 px-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {eventRegistrations[showViewModal.id]
                          .filter(r => !regSearchTerm || r.studentName.toLowerCase().includes(regSearchTerm.toLowerCase()) || r.rollNo.toLowerCase().includes(regSearchTerm.toLowerCase()) || (r.collegeName && r.collegeName.toLowerCase().includes(regSearchTerm.toLowerCase())))
                          .map((reg) => (
                            <tr key={reg.id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3">
                                <p className="font-extrabold text-slate-900">{reg.studentName}</p>
                                <p className="text-[10px] font-mono text-purple-700 font-bold">{reg.rollNo}</p>
                              </td>
                              <td className="py-2.5 px-3 max-w-[180px]">
                                <p className="font-semibold text-slate-800 truncate" title={reg.collegeName}>{reg.collegeName || 'Vidyapeeth College'}</p>
                              </td>
                              <td className="py-2.5 px-3">
                                <p className="font-semibold text-slate-800">{reg.department}</p>
                                <p className="text-[10px] text-slate-400">{reg.year}</p>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px]">
                                  {reg.participationType}
                                </span>
                                {reg.teamName && (
                                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Team: {reg.teamName}</p>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-amber-700">
                                {reg.passNo}
                              </td>
                              <td className="py-2.5 px-3">
                                <button
                                  onClick={() => setRegistrationSuccessPass(reg)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 font-bold text-[10px] rounded-lg transition-all"
                                >
                                  View E-Pass
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Coordinator: <strong className="text-slate-700">{showViewModal.coordinatorContact}</strong>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setShowViewModal(null); setViewDetailTab('overview'); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => handleOpenRegister(showViewModal)}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Register Student Now</span>
                </button>
              </div>
            </div>

          </div>
        </ModalPortal>
      )}

      {/* MODAL: REGISTER STUDENT FOR EVENT */}
      {registeringEvent && (
        <ModalPortal isOpen={Boolean(registeringEvent)} onClose={() => { setRegisteringEvent(null); setShowCollegeDropdown(false); }}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <Ticket className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                    Event Student Registration
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Submit student & college credentials to register and generate official event entry E-Pass
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setRegisteringEvent(null); setShowCollegeDropdown(false); }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Mini Summary Banner */}
            <div className={`p-4 rounded-2xl bg-gradient-to-r ${registeringEvent.bannerGradient || 'from-purple-600 via-fuchsia-600 to-pink-600'} text-white shadow-md space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                  {registeringEvent.category}
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/30 backdrop-blur-md text-white font-bold">
                  Fee: {registeringEvent.registrationFee || 'Free Admission'}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold truncate drop-shadow-xs">
                {registeringEvent.title}
              </h3>
              <div className="flex items-center gap-4 text-xs opacity-90 flex-wrap">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{registeringEvent.startDate} ({registeringEvent.startTime})</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{registeringEvent.venue}</span>
                </div>
                <div className="flex items-center gap-1 font-bold">
                  <Users className="w-3.5 h-3.5" />
                  <span>{registeringEvent.registeredCount} / {registeringEvent.maxCapacity} Seats Filled</span>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmitStudentRegistration} className="space-y-4">
              
              {/* Student Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regStudentForm.studentName}
                    onChange={(e) => setRegStudentForm({ ...regStudentForm, studentName: e.target.value })}
                    placeholder="e.g. Aditya Kapoor"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Roll / Register Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={regStudentForm.rollNo}
                    onChange={(e) => setRegStudentForm({ ...regStudentForm, rollNo: e.target.value })}
                    placeholder="e.g. VCAS23CS042"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-purple-500 focus:outline-none uppercase font-mono transition-all"
                  />
                </div>
              </div>

              {/* College / Institution with Autocomplete Dropdown */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>College / Institution Name *</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-normal">Type or pick from previously used list</span>
                </div>

                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={regStudentForm.collegeName}
                    onChange={(e) => {
                      setRegStudentForm({ ...regStudentForm, collegeName: e.target.value });
                      setShowCollegeDropdown(true);
                    }}
                    onFocus={() => setShowCollegeDropdown(true)}
                    placeholder="e.g. Vidyapeeth College of Arts and Science or enter your institution..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Autocomplete Dropdown List */}
                {showCollegeDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-20" 
                      onClick={() => setShowCollegeDropdown(false)}
                    />
                    <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-52 overflow-y-auto p-1.5 space-y-1 animate-fadeIn">
                      <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                        <span>Known & Previously Used Institutions</span>
                        <span className="text-[9px] font-mono text-purple-600">{collegesList.length} Options</span>
                      </div>
                      {collegesList
                        .filter(c => !regStudentForm.collegeName || c.toLowerCase().includes(regStudentForm.collegeName.toLowerCase()))
                        .map((col, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setRegStudentForm({ ...regStudentForm, collegeName: col });
                              setShowCollegeDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                              regStudentForm.collegeName.toLowerCase() === col.toLowerCase()
                                ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200'
                                : 'text-slate-800 hover:bg-slate-50 hover:text-purple-600'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Building2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                              <span className="truncate">{col}</span>
                            </div>
                            {regStudentForm.collegeName.toLowerCase() === col.toLowerCase() && (
                              <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            )}
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>

              {/* Academic Info (Department & Year) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={regStudentForm.department}
                    onChange={(e) => setRegStudentForm({ ...regStudentForm, department: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    {DEPARTMENTS.filter(d => d !== 'All').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Academic Year *
                  </label>
                  <select
                    value={regStudentForm.year}
                    onChange={(e) => setRegStudentForm({ ...regStudentForm, year: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value="1st Year (Semester 1/2)">1st Year</option>
                    <option value="2nd Year (Semester 3/4)">2nd Year</option>
                    <option value="3rd Year (Semester 5/6)">3rd Year</option>
                    <option value="Final Year (Semester 7/8)">Final Year</option>
                    <option value="PG / Post-Graduate">PG / Masters</option>
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Student Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={regStudentForm.email}
                    onChange={(e) => setRegStudentForm({ ...regStudentForm, email: e.target.value })}
                    placeholder="student.name@vcas.edu"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (SMS/WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={regStudentForm.phone}
                    onChange={(e) => setRegStudentForm({ ...regStudentForm, phone: e.target.value })}
                    placeholder="+91 98401 23456"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Participation Type & Team */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Participation Role *
                  </label>
                  <select
                    value={regStudentForm.participationType}
                    onChange={(e) => setRegStudentForm({ ...regStudentForm, participationType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Individual Contestant">Individual Contestant</option>
                    <option value="Team Leader">Team Leader</option>
                    <option value="Team Member">Team Member</option>
                    <option value="Audience / Attendee">Audience / Attendee Pass</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Team Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={regStudentForm.teamName}
                    onChange={(e) => setRegStudentForm({ ...regStudentForm, teamName: e.target.value })}
                    placeholder="e.g. Cosmic Beats"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Team Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={regStudentForm.teamSize}
                    onChange={(e) => setRegStudentForm({ ...regStudentForm, teamSize: Number(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Special Notes / Requirements (Optional)
                </label>
                <input
                  type="text"
                  value={regStudentForm.notes}
                  onChange={(e) => setRegStudentForm({ ...regStudentForm, notes: e.target.value })}
                  placeholder="e.g. Bringing personal laptop / Musical instrument / Stage prop"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleQuickFillStudent}
                    className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-all"
                    title="Auto fill sample student data"
                  >
                    ⚡ Auto-Fill Sample Student
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setRegisteringEvent(null); setShowCollegeDropdown(false); }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Confirm & Generate E-Pass</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: REGISTRATION SUCCESS E-PASS TICKET */}
      {registrationSuccessPass && (
        <ModalPortal isOpen={Boolean(registrationSuccessPass)} onClose={() => setRegistrationSuccessPass(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Success Badge Top */}
            <div className="text-center space-y-1">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Registration Confirmed!</h3>
              <p className="text-xs text-slate-500 font-medium">
                Official Event Entry E-Pass has been generated and seat is reserved.
              </p>
            </div>

            {/* The Official E-Pass Card */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl text-white p-5 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
              
              {/* Pass Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    VIDYAPEETH OFFICIAL EVENT PASS
                  </span>
                </div>
                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  CONFIRMED
                </span>
              </div>

              {/* Event Details Strip */}
              <div className={`p-3.5 rounded-xl bg-gradient-to-r ${registrationSuccessPass.eventGradient || 'from-purple-600 via-fuchsia-600 to-pink-600'} text-white shadow-md`}>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-black/20 text-white border border-white/20">
                  {registrationSuccessPass.eventCategory}
                </span>
                <h4 className="text-sm font-extrabold mt-1 truncate">
                  {registrationSuccessPass.eventTitle}
                </h4>
                <div className="text-[11px] opacity-90 mt-1 flex items-center gap-3">
                  <span>📅 {registrationSuccessPass.eventDate}</span>
                  <span>⏰ {registrationSuccessPass.eventTime}</span>
                </div>
                <div className="text-[11px] opacity-90 truncate mt-0.5">
                  📍 {registrationSuccessPass.eventVenue}
                </div>
              </div>

              {/* Student Credentials */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Attendee Name</span>
                  <span className="font-extrabold text-white">{registrationSuccessPass.studentName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Roll / Register No</span>
                  <span className="font-mono font-bold text-amber-300">{registrationSuccessPass.rollNo}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-400 font-bold text-[10px] uppercase shrink-0">College / Institution</span>
                  <span className="font-semibold text-purple-200 text-right">{registrationSuccessPass.collegeName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Department & Year</span>
                  <span className="font-semibold text-slate-200">{registrationSuccessPass.department} • {registrationSuccessPass.year}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Participation Role</span>
                  <span className="font-semibold text-emerald-300">
                    {registrationSuccessPass.participationType} {registrationSuccessPass.teamName ? `(${registrationSuccessPass.teamName})` : ''}
                  </span>
                </div>
                {registrationSuccessPass.notes && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-700/60 text-[11px]">
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Remarks</span>
                    <span className="text-slate-300 italic">{registrationSuccessPass.notes}</span>
                  </div>
                )}
              </div>

              {/* Pass Number & Simulated Barcode */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div>
                  <span className="text-[9px] font-mono uppercase text-slate-500 block">E-Pass ID</span>
                  <span className="font-mono font-black text-xs text-purple-400 tracking-wider">
                    {registrationSuccessPass.passNo}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex gap-1 h-6 items-end">
                    <span className="w-1 h-6 bg-slate-400"></span>
                    <span className="w-0.5 h-6 bg-slate-500"></span>
                    <span className="w-1.5 h-6 bg-slate-300"></span>
                    <span className="w-0.5 h-6 bg-slate-500"></span>
                    <span className="w-2 h-6 bg-slate-400"></span>
                    <span className="w-1 h-6 bg-slate-300"></span>
                    <span className="w-0.5 h-6 bg-slate-400"></span>
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 mt-0.5">SCAN AT ENTRY GATE</span>
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  showToast('Printing Event Entry E-Pass...');
                  window.print();
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Pass</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    showToast(`E-Pass ${registrationSuccessPass.passNo} downloaded successfully!`);
                  }}
                  className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-blue-200 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => setRegistrationSuccessPass(null)}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-500/20 transition-all"
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </ModalPortal>
      )}

      {/* MODAL: CREATE / EDIT EVENT */}
      {(showCreateModal || showEditModal) && (
        <ModalPortal isOpen={Boolean(showCreateModal || showEditModal)} onClose={() => { setShowCreateModal(false); setShowEditModal(null); }}>
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
                  showCreateModal ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {showCreateModal ? <Plus className="w-6 h-6" /> : <Pencil className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                    {showEditModal ? `Edit Event: ${formData.title || 'Untitled Event'}` : 'Schedule New Campus Event'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {showEditModal ? 'Update event details, timing, venue, organizers, and agenda' : 'Configure event details, timing, venue, organizers, and banner theme'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB NAVIGATION BAR */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto scrollbar-none">
              {[
                { id: 'basic', label: '1. Basic & Theme' },
                { id: 'time', label: '2. Time & Venue' },
                { id: 'team', label: '3. Team & Guest' },
                { id: 'agenda', label: '4. Program Agenda' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModalTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    modalTab === tab.id
                      ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={showCreateModal ? handleSaveCreate : handleSaveEdit} className="space-y-5">
              
              {/* ============================================================= */}
              {/* TAB 1: BASIC & THEME                                          */}
              {/* ============================================================= */}
              {modalTab === 'basic' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Event Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Tarang 2026 – Annual Inter-College Cultural Fest"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Category, Status, Audience */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                      >
                        {CATEGORIES.filter(c => c !== 'All').map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                      >
                        {STATUSES.filter(s => s !== 'All').map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Audience
                      </label>
                      <select
                        value={formData.audience}
                        onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                      >
                        {AUDIENCES.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Event Banner Color Theme Selector */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-purple-600" />
                        <span>Event Banner Color Theme</span>
                      </label>
                      <span className="text-[11px] text-slate-500 font-medium">Click a theme to preview</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {BANNER_THEMES.map(theme => {
                        const isSelected = formData.bannerGradient === theme.gradient;
                        return (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, bannerGradient: theme.gradient })}
                            className={`h-12 px-4 rounded-xl text-xs font-bold text-white shadow-xs flex items-center justify-between transition-all duration-200 ${theme.cssClass} ${
                              isSelected
                                ? 'ring-2 ring-slate-900 ring-offset-2 ring-offset-white shadow-md scale-[1.02]'
                                : 'opacity-90 hover:opacity-100 hover:scale-[1.01]'
                            }`}
                          >
                            <span className="truncate drop-shadow-xs">{theme.label}</span>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/50">
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Live Banner Preview Box */}
                    <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          Live Banner Preview
                        </span>
                        <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          Active Gradient Selected
                        </span>
                      </div>

                      <div className={`h-24 rounded-xl p-3.5 bg-gradient-to-r ${formData.bannerGradient || 'from-purple-600 via-fuchsia-600 to-pink-600'} text-white shadow-md flex flex-col justify-between transition-all duration-300`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                            {formData.category || 'Event'}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/30 backdrop-blur-md text-white font-black">
                            {formData.status || 'Upcoming'}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black truncate drop-shadow-xs">
                            {formData.title || 'Enter event title to see banner preview...'}
                          </h4>
                          <p className="text-[11px] opacity-90 truncate">
                            {formData.department} • Audience: {formData.audience || 'Open to All'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Overview & Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Event Overview & Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="The 32nd edition of Vidyapeeth flagship cultural extravaganza featuring 25+ events across Music, Dance, Dramatics, Fine Arts, Literary, and Fashion Show. Grand Celebrity Star Night on final day."
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 2: TIME & VENUE                                           */}
              {/* ============================================================= */}
              {modalTab === 'time' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Start Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                      <input
                        type="text"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        placeholder="09:00 AM"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                      <input
                        type="text"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        placeholder="05:00 PM"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Venue / Location *</label>
                      <input
                        type="text"
                        required
                        value={formData.venue}
                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                        placeholder="e.g. Main Auditorium & Open Ground"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Max Capacity (Seats)</label>
                      <input
                        type="number"
                        value={formData.maxCapacity}
                        onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Registration Fee</label>
                      <input
                        type="text"
                        value={formData.registrationFee}
                        onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                        placeholder="Free or ₹150"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 3: TEAM & GUEST                                           */}
              {/* ============================================================= */}
              {modalTab === 'team' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Organizing Department *
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                      >
                        {DEPARTMENTS.filter(d => d !== 'All').map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Organizer Team / Club Name
                      </label>
                      <input
                        type="text"
                        value={formData.organizer}
                        onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                        placeholder="e.g. Vidyapeeth Fine Arts & Cultural Club"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Key Speaker / Chief Guest
                      </label>
                      <input
                        type="text"
                        value={formData.speaker}
                        onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                        placeholder="e.g. Shri Vijay Prakash (Playback Singer)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Coordinator Contact (Phone / Email)
                      </label>
                      <input
                        type="text"
                        value={formData.coordinatorContact}
                        onChange={(e) => setFormData({ ...formData, coordinatorContact: e.target.value })}
                        placeholder="+91 97901 88990 / cultural@vcas.edu"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 4: PROGRAM AGENDA                                         */}
              {/* ============================================================= */}
              {modalTab === 'agenda' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Add New Agenda Slot Form */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add Agenda Timeline Slot</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <input
                          type="text"
                          value={newAgendaTime}
                          onChange={(e) => setNewAgendaTime(e.target.value)}
                          placeholder="e.g. 10:00 AM - 11:30 AM"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="sm:col-span-2 flex gap-2">
                        <input
                          type="text"
                          value={newAgendaTitle}
                          onChange={(e) => setNewAgendaTitle(e.target.value)}
                          placeholder="e.g. Inaugural Ceremony & Keynote"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddAgendaItem}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shrink-0 shadow-xs flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* List of current agenda items */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Scheduled Timeline</h4>
                    {(!formData.agenda || formData.agenda.length === 0) ? (
                      <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                        No agenda items added yet. Use the box above to add schedule slots.
                      </p>
                    ) : (
                      formData.agenda.map((ag, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-purple-700 bg-purple-100/70 px-2 py-1 rounded-lg shrink-0">
                              {ag.time}
                            </span>
                            <span className="font-bold text-slate-800">{ag.title}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAgendaItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Remove slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* MODAL FOOTER BUTTONS                                          */}
              {/* ============================================================= */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(null);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  {modalTab === 'basic' && (
                    <button
                      type="button"
                      onClick={() => setModalTab('time')}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <span>Next: Time & Venue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {modalTab === 'time' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setModalTab('basic')}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalTab('team')}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                      >
                        <span>Next: Team</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {modalTab === 'team' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setModalTab('time')}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalTab('agenda')}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                      >
                        <span>Next: Agenda</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {modalTab === 'agenda' && (
                    <button
                      type="button"
                      onClick={() => setModalTab('team')}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                    >
                      ← Back
                    </button>
                  )}

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{showCreateModal ? 'Publish Event' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: DELETE EVENT CONFIRMATION */}
      {showDeleteModal && (
        <ModalPortal isOpen={Boolean(showDeleteModal)} onClose={() => setShowDeleteModal(null)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Event</h3>
                <p className="text-xs text-slate-500 mt-0.5">Are you sure you want to cancel and remove this event?</p>
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
                onClick={() => handleDeleteEvent(showDeleteModal.id)}
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
