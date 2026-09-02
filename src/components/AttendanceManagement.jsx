import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Search, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  UserCheck, 
  AlertTriangle, 
  FileSpreadsheet, 
  Download, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Eye, 
  Filter, 
  RotateCcw, 
  Send, 
  X, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  ChevronLeft,
  Building2, 
  GraduationCap, 
  BookOpen, 
  SlidersHorizontal,
  Mail,
  Phone,
  FileText,
  Sparkles,
  Layers,
  ArrowRight,
  CalendarCheck2,
  CalendarX2,
  UserX,
  ShieldCheck,
  Zap
} from 'lucide-react';
import ModalPortal from './ModalPortal';

const DEPARTMENTS = [
  'All Departments',
  'Computer Science',
  'Electronics',
  'MBA',
  'Mechanical',
  'Civil',
  'BCA'
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const INITIAL_STUDENTS = [
  // Computer Science - 3rd Year (Sem 5)
  {
    id: 1,
    rollNo: '22CS001',
    regNo: '710022104001',
    name: 'Aadhavan Kumar',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    section: 'A',
    totalClasses: 120,
    attendedClasses: 112,
    attendancePercent: 93.3,
    parentName: 'M. Kumar',
    parentPhone: '9840112233',
    parentEmail: 'kumar.m@gmail.com',
    status: 'Present',
    inTime: '08:42 AM',
    periodsAttended: 6,
    totalPeriodsToday: 6,
    subjectWise: [
      { code: 'CS401', name: 'Database Management Systems', total: 30, attended: 29, percent: 96.6 },
      { code: 'CS402', name: 'DBMS & SQL Laboratory', total: 20, attended: 20, percent: 100.0 },
      { code: 'CS501', name: 'Operating Systems', total: 35, attended: 32, percent: 91.4 },
      { code: 'CS502', name: 'AI & Machine Learning', total: 35, attended: 31, percent: 88.5 }
    ]
  },
  {
    id: 2,
    rollNo: '22CS002',
    regNo: '710022104002',
    name: 'Abinaya Sundaram',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    section: 'A',
    totalClasses: 120,
    attendedClasses: 108,
    attendancePercent: 90.0,
    parentName: 'S. Sundaram',
    parentPhone: '9840112234',
    parentEmail: 'sundaram.s@gmail.com',
    status: 'Present',
    inTime: '08:45 AM',
    periodsAttended: 6,
    totalPeriodsToday: 6,
    subjectWise: [
      { code: 'CS401', name: 'Database Management Systems', total: 30, attended: 28, percent: 93.3 },
      { code: 'CS402', name: 'DBMS & SQL Laboratory', total: 20, attended: 19, percent: 95.0 },
      { code: 'CS501', name: 'Operating Systems', total: 35, attended: 31, percent: 88.5 },
      { code: 'CS502', name: 'AI & Machine Learning', total: 35, attended: 30, percent: 85.7 }
    ]
  },
  {
    id: 3,
    rollNo: '22CS003',
    regNo: '710022104003',
    name: 'Balaji Venkatesh',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    section: 'A',
    totalClasses: 120,
    attendedClasses: 84,
    attendancePercent: 70.0, // SHORTAGE ALERT
    parentName: 'V. Venkatesh',
    parentPhone: '9840112235',
    parentEmail: 'venkatesh.v@gmail.com',
    status: 'Absent',
    inTime: '--',
    periodsAttended: 0,
    totalPeriodsToday: 6,
    subjectWise: [
      { code: 'CS401', name: 'Database Management Systems', total: 30, attended: 20, percent: 66.6 },
      { code: 'CS402', name: 'DBMS & SQL Laboratory', total: 20, attended: 15, percent: 75.0 },
      { code: 'CS501', name: 'Operating Systems', total: 35, attended: 24, percent: 68.5 },
      { code: 'CS502', name: 'AI & Machine Learning', total: 35, attended: 25, percent: 71.4 }
    ]
  },
  {
    id: 4,
    rollNo: '22CS004',
    regNo: '710022104004',
    name: 'Deepika Ramanathan',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    section: 'A',
    totalClasses: 120,
    attendedClasses: 118,
    attendancePercent: 98.3,
    parentName: 'K. Ramanathan',
    parentPhone: '9840112236',
    parentEmail: 'ramanathan.k@gmail.com',
    status: 'Present',
    inTime: '08:35 AM',
    periodsAttended: 6,
    totalPeriodsToday: 6,
    subjectWise: [
      { code: 'CS401', name: 'Database Management Systems', total: 30, attended: 30, percent: 100.0 },
      { code: 'CS402', name: 'DBMS & SQL Laboratory', total: 20, attended: 20, percent: 100.0 },
      { code: 'CS501', name: 'Operating Systems', total: 35, attended: 34, percent: 97.1 },
      { code: 'CS502', name: 'AI & Machine Learning', total: 35, attended: 34, percent: 97.1 }
    ]
  },
  {
    id: 5,
    rollNo: '22CS005',
    regNo: '710022104005',
    name: 'Dinesh Karthik',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    section: 'A',
    totalClasses: 120,
    attendedClasses: 72,
    attendancePercent: 60.0, // CRITICAL SHORTAGE
    parentName: 'R. Karthik',
    parentPhone: '9840112237',
    parentEmail: 'karthik.r@gmail.com',
    status: 'Absent',
    inTime: '--',
    periodsAttended: 0,
    totalPeriodsToday: 6,
    subjectWise: [
      { code: 'CS401', name: 'Database Management Systems', total: 30, attended: 18, percent: 60.0 },
      { code: 'CS402', name: 'DBMS & SQL Laboratory', total: 20, attended: 12, percent: 60.0 },
      { code: 'CS501', name: 'Operating Systems', total: 35, attended: 21, percent: 60.0 },
      { code: 'CS502', name: 'AI & Machine Learning', total: 35, attended: 21, percent: 60.0 }
    ]
  },
  {
    id: 6,
    rollNo: '22CS006',
    regNo: '710022104006',
    name: 'Harini Jayaraman',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    section: 'A',
    totalClasses: 120,
    attendedClasses: 110,
    attendancePercent: 91.6,
    parentName: 'P. Jayaraman',
    parentPhone: '9840112238',
    parentEmail: 'jayaraman.p@gmail.com',
    status: 'Present',
    inTime: '08:48 AM',
    periodsAttended: 6,
    totalPeriodsToday: 6,
    subjectWise: [
      { code: 'CS401', name: 'Database Management Systems', total: 30, attended: 28, percent: 93.3 },
      { code: 'CS402', name: 'DBMS & SQL Laboratory', total: 20, attended: 19, percent: 95.0 },
      { code: 'CS501', name: 'Operating Systems', total: 35, attended: 31, percent: 88.5 },
      { code: 'CS502', name: 'AI & Machine Learning', total: 35, attended: 32, percent: 91.4 }
    ]
  },
  {
    id: 7,
    rollNo: '22CS007',
    regNo: '710022104007',
    name: 'Kavitha Natarajan',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    section: 'A',
    totalClasses: 120,
    attendedClasses: 104,
    attendancePercent: 86.6,
    parentName: 'N. Natarajan',
    parentPhone: '9840112239',
    parentEmail: 'natarajan.n@gmail.com',
    status: 'Late',
    inTime: '09:12 AM',
    periodsAttended: 5,
    totalPeriodsToday: 6,
    subjectWise: [
      { code: 'CS401', name: 'Database Management Systems', total: 30, attended: 26, percent: 86.6 },
      { code: 'CS402', name: 'DBMS & SQL Laboratory', total: 20, attended: 18, percent: 90.0 },
      { code: 'CS501', name: 'Operating Systems', total: 35, attended: 30, percent: 85.7 },
      { code: 'CS502', name: 'AI & Machine Learning', total: 35, attended: 30, percent: 85.7 }
    ]
  },
  {
    id: 8,
    rollNo: '22CS008',
    regNo: '710022104008',
    name: 'Manoj Prabhakar',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    section: 'A',
    totalClasses: 120,
    attendedClasses: 98,
    attendancePercent: 81.6,
    parentName: 'G. Prabhakar',
    parentPhone: '9840112240',
    parentEmail: 'prabhakar.g@gmail.com',
    status: 'On Duty',
    inTime: '08:50 AM',
    periodsAttended: 6,
    totalPeriodsToday: 6,
    subjectWise: [
      { code: 'CS401', name: 'Database Management Systems', total: 30, attended: 24, percent: 80.0 },
      { code: 'CS402', name: 'DBMS & SQL Laboratory', total: 20, attended: 17, percent: 85.0 },
      { code: 'CS501', name: 'Operating Systems', total: 35, attended: 28, percent: 80.0 },
      { code: 'CS502', name: 'AI & Machine Learning', total: 35, attended: 29, percent: 82.8 }
    ]
  },

  // Electronics - 2nd Year
  {
    id: 9,
    rollNo: '23EC012',
    regNo: '710023106012',
    name: 'Naveen Chandran',
    department: 'Electronics',
    year: 2,
    sem: 'Sem 3',
    section: 'A',
    totalClasses: 110,
    attendedClasses: 102,
    attendancePercent: 92.7,
    parentName: 'T. Chandran',
    parentPhone: '9840112241',
    parentEmail: 'chandran.t@gmail.com',
    status: 'Present',
    inTime: '08:40 AM',
    periodsAttended: 6,
    totalPeriodsToday: 6,
    subjectWise: [
      { code: 'EC201', name: 'Electronic Circuits & Design', total: 35, attended: 33, percent: 94.2 },
      { code: 'EC202', name: 'Analog Circuits Lab', total: 20, attended: 19, percent: 95.0 },
      { code: 'EC301', name: 'Digital Logic & Microprocessors', total: 35, attended: 32, percent: 91.4 },
      { code: 'MA201', name: 'Transforms & Partial Equations', total: 20, attended: 18, percent: 90.0 }
    ]
  },
  {
    id: 10,
    rollNo: '23EC015',
    regNo: '710023106015',
    name: 'Pooja Subramaniam',
    department: 'Electronics',
    year: 2,
    sem: 'Sem 3',
    section: 'A',
    totalClasses: 110,
    attendedClasses: 76,
    attendancePercent: 69.0, // SHORTAGE ALERT
    parentName: 'M. Subramaniam',
    parentPhone: '9840112242',
    parentEmail: 'subramaniam.m@gmail.com',
    status: 'Absent',
    inTime: '--',
    periodsAttended: 0,
    totalPeriodsToday: 6,
    subjectWise: [
      { code: 'EC201', name: 'Electronic Circuits & Design', total: 35, attended: 24, percent: 68.5 },
      { code: 'EC202', name: 'Analog Circuits Lab', total: 20, attended: 14, percent: 70.0 },
      { code: 'EC301', name: 'Digital Logic & Microprocessors', total: 35, attended: 23, percent: 65.7 },
      { code: 'MA201', name: 'Transforms & Partial Equations', total: 20, attended: 15, percent: 75.0 }
    ]
  },

  // MBA - 1st Year
  {
    id: 11,
    rollNo: '24MB005',
    regNo: '710024631005',
    name: 'Rahul Mukund',
    department: 'MBA',
    year: 1,
    sem: 'Sem 1',
    section: 'A',
    totalClasses: 90,
    attendedClasses: 85,
    attendancePercent: 94.4,
    parentName: 'S. Mukund',
    parentPhone: '9840112243',
    parentEmail: 'mukund.s@gmail.com',
    status: 'Present',
    inTime: '08:30 AM',
    periodsAttended: 6,
    totalPeriodsToday: 6,
    subjectWise: [
      { code: 'MB101', name: 'Principles of Management', total: 30, attended: 29, percent: 96.6 },
      { code: 'MB102', name: 'Managerial Economics', total: 30, attended: 28, percent: 93.3 },
      { code: 'MB103', name: 'Financial Accounting', total: 30, attended: 28, percent: 93.3 }
    ]
  },

  // Mechanical - 3rd Year
  {
    id: 12,
    rollNo: '22ME009',
    regNo: '710022114009',
    name: 'Saravanan Muthu',
    department: 'Mechanical',
    year: 3,
    sem: 'Sem 5',
    section: 'A',
    totalClasses: 115,
    attendedClasses: 106,
    attendancePercent: 92.1,
    parentName: 'A. Muthu',
    parentPhone: '9840112244',
    parentEmail: 'muthu.a@gmail.com',
    status: 'Present',
    inTime: '08:45 AM',
    periodsAttended: 6,
    totalPeriodsToday: 6,
    subjectWise: [
      { code: 'ME401', name: 'CAD/CAM Modeling & Robotics', total: 35, attended: 33, percent: 94.2 },
      { code: 'ME402', name: 'Thermal Engineering Lab', total: 20, attended: 19, percent: 95.0 },
      { code: 'ME403', name: 'Fluid Machinery & Dynamics', total: 35, attended: 31, percent: 88.5 },
      { code: 'ME404', name: 'Design of Machine Elements', total: 25, attended: 23, percent: 92.0 }
    ]
  }
];

const INITIAL_STAFF_ATTENDANCE = [
  {
    id: 1,
    empId: 'EMP001',
    name: 'Dr. Sunita Rao',
    department: 'Computer Science',
    designation: 'Professor & HOD',
    inTime: '08:48 AM',
    outTime: '05:15 PM',
    status: 'Present',
    workHours: '8h 27m',
    mode: 'Biometric Face ID'
  },
  {
    id: 2,
    empId: 'EMP002',
    name: 'Prof. Ramesh Kumar',
    department: 'Electronics',
    designation: 'Assoc. Professor & HOD',
    inTime: '08:55 AM',
    outTime: '05:02 PM',
    status: 'Present',
    workHours: '8h 07m',
    mode: 'RFID Card'
  },
  {
    id: 3,
    empId: 'EMP003',
    name: 'Dr. Anita Desai',
    department: 'MBA',
    designation: 'Professor & HOD',
    inTime: '08:50 AM',
    outTime: '05:10 PM',
    status: 'Present',
    workHours: '8h 20m',
    mode: 'Biometric Fingerprint'
  },
  {
    id: 4,
    empId: 'EMP004',
    name: 'Dr. Pradeep Joshi',
    department: 'Mechanical',
    designation: 'Professor & HOD',
    inTime: '09:12 AM',
    outTime: '05:00 PM',
    status: 'Late',
    workHours: '7h 48m',
    mode: 'RFID Card'
  },
  {
    id: 5,
    empId: 'EMP005',
    name: 'Dr. Kavitha Singh',
    department: 'Civil',
    designation: 'Professor & HOD',
    inTime: '08:45 AM',
    outTime: '05:30 PM',
    status: 'Present',
    workHours: '8h 45m',
    mode: 'Biometric Face ID'
  },
  {
    id: 6,
    empId: 'EMP006',
    name: 'Prof. Meena Iyer',
    department: 'BCA',
    designation: 'Assoc. Professor & HOD',
    inTime: '--',
    outTime: '--',
    status: 'On Leave',
    workHours: '0h 00m',
    mode: 'Approved Leave'
  },
  {
    id: 7,
    empId: 'EMP007',
    name: 'Dr. Neeraj Gupta',
    department: 'Computer Science',
    designation: 'Associate Professor',
    inTime: '08:52 AM',
    outTime: '05:05 PM',
    status: 'Present',
    workHours: '8h 13m',
    mode: 'Biometric Fingerprint'
  }
];

const INITIAL_LEAVE_REQUESTS = [
  {
    id: 1,
    applicantName: 'Prof. Meena Iyer',
    role: 'Faculty',
    department: 'BCA',
    type: 'Casual Leave (CL)',
    from: '2026-08-31',
    to: '2026-09-01',
    days: 2,
    reason: 'Attending National Academic Conference on Cloud Computing',
    status: 'Approved',
    appliedOn: '2026-08-28'
  },
  {
    id: 2,
    applicantName: 'Dinesh Karthik (22CS005)',
    role: 'Student',
    department: 'Computer Science',
    type: 'Medical Leave',
    from: '2026-08-29',
    to: '2026-08-31',
    days: 3,
    reason: 'Viral Fever and Medical Treatment under Physician care',
    status: 'Pending',
    appliedOn: '2026-08-29'
  },
  {
    id: 3,
    applicantName: 'Balaji Venkatesh (22CS003)',
    role: 'Student',
    department: 'Computer Science',
    type: 'On Duty (OD)',
    from: '2026-09-02',
    to: '2026-09-03',
    days: 2,
    reason: 'Representing Vidyapeeth at IIT Madras Inter-College Robotics Hackathon',
    status: 'Pending',
    appliedOn: '2026-08-30'
  },
  {
    id: 4,
    applicantName: 'Prof. Ramesh Kumar',
    role: 'Faculty',
    department: 'Electronics',
    type: 'Duty Leave (DL)',
    from: '2026-09-05',
    to: '2026-09-05',
    days: 1,
    reason: 'External Examiner duty for Anna University Central Valuation',
    status: 'Approved',
    appliedOn: '2026-08-27'
  }
];

// Helper to determine student attendance status for any arbitrary date
function getStudentAttendanceForDate(student, dateStr) {
  const parts = dateStr.split('-');
  const day = parseInt(parts[2] || '31', 10);
  const dateObj = new Date(dateStr);
  const dayOfWeek = dateObj.getDay();

  if (dayOfWeek === 0) {
    return { status: 'Holiday (Sunday)', inTime: '--', periods: 0, isPresent: false };
  }

  // Consistent pseudo-random deterministic status based on student ID and date
  const hash = (student.id * 17 + day * 37) % 100;
  
  if (student.attendancePercent < 70) {
    // Shortage student
    if (hash < 40) return { status: 'Absent', inTime: '--', periods: 0, isPresent: false };
    if (hash < 55) return { status: 'Late', inTime: '09:18 AM', periods: 4, isPresent: true };
    return { status: 'Present', inTime: '08:45 AM', periods: 6, isPresent: true };
  } else if (student.attendancePercent < 85) {
    if (hash < 18) return { status: 'Absent', inTime: '--', periods: 0, isPresent: false };
    if (hash < 28) return { status: 'Late', inTime: '09:08 AM', periods: 5, isPresent: true };
    if (hash < 33) return { status: 'On Duty', inTime: '08:50 AM', periods: 6, isPresent: true };
    return { status: 'Present', inTime: '08:40 AM', periods: 6, isPresent: true };
  } else {
    // Good attendance student
    if (hash < 4) return { status: 'Absent', inTime: '--', periods: 0, isPresent: false };
    if (hash < 8) return { status: 'Late', inTime: '09:02 AM', periods: 5, isPresent: true };
    if (hash < 12) return { status: 'On Duty', inTime: '08:45 AM', periods: 6, isPresent: true };
    return { status: 'Present', inTime: '08:35 AM', periods: 6, isPresent: true };
  }
}

export default function AttendanceManagement() {
  // Navigation Tabs: 'daily-log', 'roll-call', 'student-register', 'staff-attendance', 'leaves'
  const [activeTab, setActiveTab] = useState('daily-log');

  // Calendar State
  const [selectedDate, setSelectedDate] = useState('2026-08-31');
  const [currentMonth, setCurrentMonth] = useState(7); // 7 = August (0-indexed)
  const [currentYear, setCurrentYear] = useState(2026);

  // Filter for Date-specific Attendance: 'ALL', 'Present', 'Absent', 'Late', 'On Duty'
  const [dateStatusFilter, setDateStatusFilter] = useState('ALL');

  // Students & Staff Data State
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [staffAttendance, setStaffAttendance] = useState(INITIAL_STAFF_ATTENDANCE);
  const [leaveRequests, setLeaveRequests] = useState(INITIAL_LEAVE_REQUESTS);

  // Roll Call Selection States
  const [rollDept, setRollDept] = useState('Computer Science');
  const [rollYear, setRollYear] = useState(3);
  const [rollSem, setRollSem] = useState('Sem 5');
  const [rollSubject, setRollSubject] = useState('CS401 - Database Management Systems');
  const [rollPeriod, setRollPeriod] = useState('Period 1 (09:00 AM - 10:00 AM)');
  const [classTopic, setClassTopic] = useState('Normalization up to BCNF & Lossless Join Decomposition');

  // Student Register Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('All Departments');
  const [filterYear, setFilterYear] = useState('ALL');
  const [filterAttendanceRange, setFilterAttendanceRange] = useState('ALL');

  // Modals state
  const [viewingStudentProfile, setViewingStudentProfile] = useState(null);
  const [warningModalStudent, setWarningModalStudent] = useState(null);
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Lock background scroll when any modal is open
  React.useEffect(() => {
    const isAnyModalOpen = Boolean(viewingStudentProfile || warningModalStudent || isApplyLeaveOpen);
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
  }, [viewingStudentProfile, warningModalStudent, isApplyLeaveOpen]);

  // Leave Form state
  const [leaveForm, setLeaveForm] = useState({
    applicantName: '',
    role: 'Student',
    department: 'Computer Science',
    type: 'Casual Leave (CL)',
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------
  // Calendar Grid Calculations
  // -------------------------------------------------------------
  const calendarDays = useMemo(() => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon...
    
    const daysArray = [];
    
    // Empty cells before first day
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push({ day: null });
    }
    
    // Days of the month
    for (let d = 1; d <= totalDays; d++) {
      const formattedMonth = String(currentMonth + 1).padStart(2, '0');
      const formattedDay = String(d).padStart(2, '0');
      const dateString = `${currentYear}-${formattedMonth}-${formattedDay}`;
      
      const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
      const isSunday = dayOfWeek === 0;
      
      daysArray.push({
        day: d,
        dateString,
        isSunday,
        isToday: dateString === '2026-08-31',
        isSelected: dateString === selectedDate
      });
    }
    
    return daysArray;
  }, [currentYear, currentMonth, selectedDate]);

  // Calendar Month Navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Select Date Handler from Calendar
  const handleSelectCalendarDate = (dateStr) => {
    if (!dateStr) return;
    setSelectedDate(dateStr);
    showToast(`Showing attendance for ${formatReadableDate(dateStr)}`);
  };

  // Human Readable Formatted Date
  const formatReadableDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // -------------------------------------------------------------
  // Filtered Daily Attendees List for the Selected Date
  // -------------------------------------------------------------
  const dailyDateAttendees = useMemo(() => {
    return students.map(student => {
      const dayInfo = getStudentAttendanceForDate(student, selectedDate);
      return {
        ...student,
        dayStatus: dayInfo.status,
        dayInTime: dayInfo.inTime,
        dayPeriods: dayInfo.periods,
        isPresentOnDate: dayInfo.isPresent
      };
    }).filter(s => {
      // Apply department search & status filters
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        s.name.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        s.regNo.includes(q) ||
        s.department.toLowerCase().includes(q)
      );

      const matchesDept = filterDept === 'All Departments' || s.department === filterDept;

      let matchesStatus = true;
      if (dateStatusFilter === 'Present') {
        matchesStatus = s.dayStatus === 'Present';
      } else if (dateStatusFilter === 'Absent') {
        matchesStatus = s.dayStatus === 'Absent';
      } else if (dateStatusFilter === 'Late') {
        matchesStatus = s.dayStatus === 'Late';
      } else if (dateStatusFilter === 'On Duty') {
        matchesStatus = s.dayStatus === 'On Duty';
      }

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [students, selectedDate, searchQuery, filterDept, dateStatusFilter]);

  // Daily Date Tally Summary
  const dateTally = useMemo(() => {
    const all = students.map(s => getStudentAttendanceForDate(s, selectedDate));
    const total = all.length;
    const present = all.filter(a => a.status === 'Present').length;
    const absent = all.filter(a => a.status === 'Absent').length;
    const late = all.filter(a => a.status === 'Late').length;
    const od = all.filter(a => a.status === 'On Duty').length;
    const percent = total > 0 ? (((present + late + od) / total) * 100).toFixed(1) : '0.0';
    return { total, present, absent, late, od, percent };
  }, [students, selectedDate]);

  // -------------------------------------------------------------
  // Handlers for Roll Call & Actions
  // -------------------------------------------------------------
  const rollCallStudents = useMemo(() => {
    return students.filter(s => s.department === rollDept && s.year === Number(rollYear));
  }, [students, rollDept, rollYear]);

  const rollTally = useMemo(() => {
    const total = rollCallStudents.length;
    const present = rollCallStudents.filter(s => s.status === 'Present').length;
    const absent = rollCallStudents.filter(s => s.status === 'Absent').length;
    const late = rollCallStudents.filter(s => s.status === 'Late').length;
    const od = rollCallStudents.filter(s => s.status === 'On Duty').length;
    const percent = total > 0 ? ((present + late + od) / total * 100).toFixed(1) : '0.0';
    return { total, present, absent, late, od, percent };
  }, [rollCallStudents]);

  const filteredRegisterStudents = useMemo(() => {
    return students.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        s.name.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        s.regNo.includes(q) ||
        s.department.toLowerCase().includes(q)
      );

      const matchesDept = filterDept === 'All Departments' || s.department === filterDept;
      const matchesYear = filterYear === 'ALL' || s.year === Number(filterYear);

      let matchesRange = true;
      if (filterAttendanceRange === 'good') matchesRange = s.attendancePercent >= 85;
      else if (filterAttendanceRange === 'moderate') matchesRange = s.attendancePercent >= 75 && s.attendancePercent < 85;
      else if (filterAttendanceRange === 'shortage') matchesRange = s.attendancePercent < 75;

      return matchesSearch && matchesDept && matchesYear && matchesRange;
    });
  }, [students, searchQuery, filterDept, filterYear, filterAttendanceRange]);

  const shortageCount = useMemo(() => {
    return students.filter(s => s.attendancePercent < 75).length;
  }, [students]);

  const handleToggleRollStatus = (id, newStatus) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const handleMarkAll = (status) => {
    setStudents(prev => prev.map(s => {
      if (s.department === rollDept && s.year === Number(rollYear)) {
        return { ...s, status };
      }
      return s;
    }));
    showToast(`Marked all students as ${status} for this session.`);
  };

  const handleSubmitRollCall = () => {
    showToast(`Attendance for ${rollSubject} (${rollPeriod}) submitted successfully.`);
  };

  const handleUpdateLeaveStatus = (id, newStatus) => {
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    showToast(`Leave request ${newStatus.toLowerCase()} successfully.`);
  };

  const handleSaveLeave = (e) => {
    e.preventDefault();
    if (!leaveForm.applicantName.trim() || !leaveForm.reason.trim()) {
      alert('Please enter Applicant Name and Reason');
      return;
    }
    const fromDate = new Date(leaveForm.from);
    const toDate = new Date(leaveForm.to);
    const diffDays = Math.max(1, Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1);

    const newReq = {
      id: Date.now(),
      ...leaveForm,
      days: diffDays,
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0]
    };
    setLeaveRequests(prev => [newReq, ...prev]);
    setIsApplyLeaveOpen(false);
    showToast('Leave application submitted.');
  };

  const handleExportAttendanceCSV = () => {
    const headers = ['Roll No', 'Register No', 'Student Name', 'Department', 'Date', 'Day Status', 'In-Time', 'Overall Attendance %'];
    const rows = dailyDateAttendees.map(s => [
      `"${s.rollNo}"`,
      `"${s.regNo}"`,
      `"${s.name}"`,
      `"${s.department}"`,
      `"${selectedDate}"`,
      `"${s.dayStatus}"`,
      `"${s.dayInTime}"`,
      `${s.attendancePercent}%`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vidyapeeth_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Attendance report exported as CSV!');
  };

  const handleSendWarning = () => {
    if (warningModalStudent) {
      showToast(`Warning SMS & Email sent to ${warningModalStudent.parentName} (${warningModalStudent.parentPhone}) for ${warningModalStudent.name}.`);
      setWarningModalStudent(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans animate-fadeIn">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. TOP HEADER & QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
              Academic Attendance Tracker
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-semibold">Real-time Calendar & Roll Call</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Attendance Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Select any date from the interactive calendar to view attendees, roll call, and biometric logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportAttendanceCSV}
            title="Download CSV Attendance Sheet"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 2. STATS SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Date Attendance</span>
            <p className="text-2xl font-black text-emerald-600">{dateTally.percent}%</p>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">{dateTally.present} Present ({selectedDate})</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Staff on Duty</span>
            <p className="text-2xl font-black text-blue-600">95.2%</p>
            <p className="text-[11px] text-blue-600 font-bold mt-1">80 / 84 Faculty</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Shortage (&lt;75%)</span>
            <p className="text-2xl font-black text-rose-600">{shortageCount} Students</p>
            <p className="text-[11px] text-rose-600 font-bold mt-1">Condonation Risk</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pending Leaves</span>
            <p className="text-2xl font-black text-amber-600">
              {leaveRequests.filter(l => l.status === 'Pending').length} Requests
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Awaiting Approval</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Selected Date</span>
            <p className="text-xl font-black text-indigo-600 truncate">{selectedDate.split('-').slice(1).join('/')}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">{formatReadableDate(selectedDate)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. MAIN TWO-COLUMN LAYOUT (LEFT: SIDE CALENDAR FILTER, RIGHT: ATTENDANCE CONTENT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: INTERACTIVE SIDE CALENDAR WIDGET & DATE FILTERS              */}
        {/* ========================================================================= */}
        <aside className="lg:col-span-4 xl:col-span-4 space-y-5">
          
          {/* Calendar Box */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4 sticky top-20">
            
            {/* Calendar Header with Prev/Next Month */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Attendance Calendar</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Day Header Names */}
            <div className="grid grid-cols-7 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100/60">
              <span className="text-rose-500">Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Calendar Days 7x5 Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
              {calendarDays.map((cell, idx) => {
                if (!cell.day) {
                  return <div key={`empty-${idx}`} className="h-9"></div>;
                }

                const isSelected = cell.isSelected;
                const isSunday = cell.isSunday;
                const isToday = cell.isToday;

                return (
                  <button
                    key={cell.dateString}
                    onClick={() => handleSelectCalendarDate(cell.dateString)}
                    className={`h-9 w-full rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-500/30 scale-105 z-10'
                        : isToday
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                        : isSunday
                        ? 'text-rose-400 hover:bg-rose-50'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-xs leading-none">{cell.day}</span>
                    
                    {/* Status Dot */}
                    {!isSelected && (
                      <span className={`w-1 h-1 rounded-full mt-0.5 ${
                        isSunday ? 'bg-rose-300' : isToday ? 'bg-blue-600' : 'bg-emerald-400'
                      }`}></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Date Shortcuts */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Quick Date Filter</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleSelectCalendarDate('2026-08-31')}
                  className={`py-1.5 px-2.5 rounded-xl font-bold transition-all text-left flex items-center justify-between border ${
                    selectedDate === '2026-08-31'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  <span>📌 Today (31 Aug)</span>
                </button>
                <button
                  onClick={() => handleSelectCalendarDate('2026-08-28')}
                  className={`py-1.5 px-2.5 rounded-xl font-bold transition-all text-left flex items-center justify-between border ${
                    selectedDate === '2026-08-28'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  <span>📅 Friday (28 Aug)</span>
                </button>
              </div>
            </div>

            {/* Selected Date Summary & "Who Came" Filter Pills */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Selected Date Tally</span>
                  <p className="font-extrabold text-xs text-slate-900">{formatReadableDate(selectedDate)}</p>
                </div>
                <span className="text-xs font-black text-emerald-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                  {dateTally.percent}% Attendance
                </span>
              </div>

              {/* Status Filter Buttons (Who all came / Present, Absent, etc.) */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter by Attendance Status:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setDateStatusFilter('ALL');
                      setActiveTab('daily-log');
                    }}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                      dateStatusFilter === 'ALL'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>All Students</span>
                    <span className="text-[10px] opacity-80">{dateTally.total}</span>
                  </button>

                  <button
                    onClick={() => {
                      setDateStatusFilter('Present');
                      setActiveTab('daily-log');
                    }}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                      dateStatusFilter === 'Present'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <span>✓ Present (Came)</span>
                    <span className="text-[10px] font-black">{dateTally.present}</span>
                  </button>

                  <button
                    onClick={() => {
                      setDateStatusFilter('Absent');
                      setActiveTab('daily-log');
                    }}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                      dateStatusFilter === 'Absent'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <span>✕ Absent</span>
                    <span className="text-[10px] font-black">{dateTally.absent}</span>
                  </button>

                  <button
                    onClick={() => {
                      setDateStatusFilter('Late');
                      setActiveTab('daily-log');
                    }}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                      dateStatusFilter === 'Late'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <span>⏰ Late / OD</span>
                    <span className="text-[10px] font-black">{dateTally.late + dateTally.od}</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </aside>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: ATTENDANCE RECORDS & TABS                                   */}
        {/* ========================================================================= */}
        <main className="lg:col-span-8 xl:col-span-8 space-y-5">
          
          {/* Active Date Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-blue-500/30 text-blue-200 font-bold text-[10px] rounded-md uppercase">
                  📅 Selected Date View
                </span>
                <span className="text-xs text-blue-200">•</span>
                <span className="text-xs text-blue-200 font-medium">{dateTally.total} Students Recorded</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold">
                {formatReadableDate(selectedDate)}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Viewing {dateStatusFilter === 'ALL' ? 'all student records' : `${dateStatusFilter} students`} for this date.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 p-2.5 rounded-2xl border border-white/10 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-blue-200 font-bold uppercase block">Day Attendance</span>
                <span className="text-xl font-black text-emerald-400">{dateTally.percent}%</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-extrabold text-sm border border-emerald-400/30">
                {dateTally.present}P
              </div>
            </div>
          </div>

          {/* Navigation Tabs for Right Column */}
          <div className="flex items-center border-b border-slate-200 text-xs sm:text-sm overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab('daily-log')}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'daily-log'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
              }`}
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Daily Attendees List ({dailyDateAttendees.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('roll-call')}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'roll-call'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Mark Roll Call</span>
            </button>

            <button
              onClick={() => setActiveTab('student-register')}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'student-register'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Shortage Monitor (&lt;75%)</span>
            </button>

            <button
              onClick={() => setActiveTab('staff-attendance')}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'staff-attendance'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Faculty Biometric</span>
            </button>

            <button
              onClick={() => setActiveTab('leaves')}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'leaves'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Leaves & OD</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: DAILY ATTENDEES LIST (WHO ALL CAME ON THIS SELECTED DATE)           */}
          {/* ========================================================================= */}
          {activeTab === 'daily-log' && (
            <div className="space-y-4">
              
              {/* Filter Row */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search who came by student name, roll no, or register number..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="w-full sm:w-44 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Attendance Table on Selected Date */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-5">STUDENT NAME & ROLL NO</th>
                        <th className="py-3.5 px-4">DEPARTMENT</th>
                        <th className="py-3.5 px-4">IN-TIME</th>
                        <th className="py-3.5 px-4">PERIODS</th>
                        <th className="py-3.5 px-4">STATUS ON {selectedDate.split('-').slice(1).join('/')}</th>
                        <th className="py-3.5 px-5 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                      {dailyDateAttendees.length > 0 ? (
                        dailyDateAttendees.map((s) => (
                          <tr 
                            key={s.id} 
                            onClick={() => setViewingStudentProfile(s)}
                            className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                          >
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  s.dayStatus === 'Present'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : s.dayStatus === 'Absent'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {s.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                                    {s.name}
                                  </p>
                                  <span className="font-mono text-[11px] text-blue-600 font-semibold">{s.rollNo}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-semibold text-slate-700 text-xs">
                              {s.department} (Yr {s.year})
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-800">
                              {s.dayInTime}
                            </td>

                            <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                              {s.dayPeriods} / {s.totalPeriodsToday || 6} Hrs
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                s.dayStatus === 'Present'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : s.dayStatus === 'Absent'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : s.dayStatus === 'Late'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}>
                                {s.dayStatus === 'Present' && '✓ Present (Came)'}
                                {s.dayStatus === 'Absent' && '✕ Absent'}
                                {s.dayStatus === 'Late' && '⏰ Late'}
                                {s.dayStatus === 'On Duty' && '🛡️ On Duty'}
                                {s.dayStatus.includes('Holiday') && s.dayStatus}
                              </span>
                            </td>

                            <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingStudentProfile(s);
                                }}
                                title="View Attendance Profile"
                                className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all text-slate-400"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-400">
                            <div className="max-w-xs mx-auto space-y-1.5">
                              <UserX className="w-7 h-7 mx-auto text-slate-300" />
                              <p className="text-xs font-bold text-slate-700">No students matched this date filter</p>
                              <p className="text-[11px] text-slate-400">Try changing status filter or search query</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CLASS ROLL CALL (SESSION RECORDING)                                */}
          {/* ========================================================================= */}
          {activeTab === 'roll-call' && (
            <div className="space-y-5">
              {/* Class Session Selector Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                    <select
                      value={rollDept}
                      onChange={(e) => setRollDept(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      {DEPARTMENTS.filter(d => d !== 'All Departments').map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Year & Semester</label>
                    <select
                      value={rollYear}
                      onChange={(e) => {
                        const y = Number(e.target.value);
                        setRollYear(y);
                        setRollSem(`Sem ${y * 2 - 1}`);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value={1}>1st Year (Sem 1)</option>
                      <option value={2}>2nd Year (Sem 3)</option>
                      <option value={3}>3rd Year (Sem 5)</option>
                      <option value={4}>4th Year (Sem 7)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Period Hour</label>
                    <select
                      value={rollPeriod}
                      onChange={(e) => setRollPeriod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Period 1 (09:00 AM - 10:00 AM)">Period 1 (09:00 AM - 10:00 AM)</option>
                      <option value="Period 2 (10:00 AM - 11:00 AM)">Period 2 (10:00 AM - 11:00 AM)</option>
                      <option value="Period 3 (11:15 AM - 12:15 PM)">Period 3 (11:15 AM - 12:15 PM)</option>
                      <option value="Period 4 (01:15 PM - 02:15 PM)">Period 4 (01:15 PM - 02:15 PM)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject / Course</label>
                  <select
                    value={rollSubject}
                    onChange={(e) => setRollSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="CS401 - Database Management Systems">CS401 - Database Management Systems</option>
                    <option value="CS402 - DBMS & SQL Laboratory">CS402 - DBMS & SQL Laboratory</option>
                    <option value="CS501 - Operating Systems">CS501 - Operating Systems</option>
                    <option value="CS502 - AI & Machine Learning">CS502 - AI & Machine Learning</option>
                  </select>
                </div>
              </div>

              {/* Tally Bar & Bulk Actions */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <span className="font-extrabold text-slate-900">Total: {rollTally.total}</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Present: {rollTally.present}</span>
                  <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md">Absent: {rollTally.absent}</span>
                  <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">Late: {rollTally.late}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkAll('Present')}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition-all border border-emerald-200"
                  >
                    ✓ All Present
                  </button>
                  <button
                    onClick={() => handleMarkAll('Absent')}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-all border border-rose-200"
                  >
                    ✕ All Absent
                  </button>
                  <button
                    onClick={handleSubmitRollCall}
                    className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Roll Call</span>
                  </button>
                </div>
              </div>

              {/* Student Roll Call Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-5">ROLL & STUDENT NAME</th>
                        <th className="py-3 px-4">OVERALL %</th>
                        <th className="py-3 px-5 text-center">SESSION STATUS (TOGGLE)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {rollCallStudents.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-5">
                            <span className="font-bold text-slate-900 mr-2">{s.name}</span>
                            <span className="font-mono text-[11px] text-blue-600">{s.rollNo}</span>
                          </td>
                          <td className="py-3 px-4 font-black text-xs">
                            <span className={s.attendancePercent >= 85 ? 'text-emerald-600' : 'text-rose-600'}>
                              {s.attendancePercent}%
                            </span>
                          </td>
                          <td className="py-3 px-5 text-center">
                            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200/80">
                              <button
                                onClick={() => handleToggleRollStatus(s.id, 'Present')}
                                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all ${
                                  s.status === 'Present' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleToggleRollStatus(s.id, 'Absent')}
                                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all ${
                                  s.status === 'Absent' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => handleToggleRollStatus(s.id, 'Late')}
                                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all ${
                                  s.status === 'Late' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600'
                                }`}
                              >
                                Late
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SHORTAGE MONITOR (<75% CONDONATION RISK)                           */}
          {/* ========================================================================= */}
          {activeTab === 'student-register' && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-rose-900">Attendance Shortage Monitor (&lt;75%)</h4>
                    <p className="text-xs text-rose-700 mt-0.5">Students below 75% attendance require condonation or parent intimation</p>
                  </div>
                </div>
                <span className="text-xs font-black text-rose-700 bg-white px-3 py-1.5 rounded-xl border border-rose-200 shadow-xs">
                  {shortageCount} Critical Students
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-5">STUDENT</th>
                      <th className="py-3.5 px-4">DEPT & YEAR</th>
                      <th className="py-3.5 px-4">ATTENDANCE %</th>
                      <th className="py-3.5 px-4">PARENT CONTACT</th>
                      <th className="py-3.5 px-5 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {filteredRegisterStudents.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-5">
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <span className="font-mono text-[11px] text-blue-600">{s.rollNo}</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700 text-xs">
                          {s.department} (Yr {s.year})
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`font-black text-xs ${
                            s.attendancePercent < 75 ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200' : 'text-emerald-600'
                          }`}>
                            {s.attendancePercent}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {s.parentName} ({s.parentPhone})
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => setWarningModalStudent(s)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-all inline-flex items-center gap-1 border border-rose-200"
                          >
                            <Send className="w-3 h-3" />
                            <span>Notify Parent</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: FACULTY BIOMETRIC LOG                                              */}
          {/* ========================================================================= */}
          {activeTab === 'staff-attendance' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-5">STAFF MEMBER</th>
                    <th className="py-3.5 px-4">DEPARTMENT</th>
                    <th className="py-3.5 px-4">PUNCH IN</th>
                    <th className="py-3.5 px-4">WORK HOURS</th>
                    <th className="py-3.5 px-5 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {staffAttendance.map(st => (
                    <tr key={st.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-slate-900">{st.name}</p>
                        <span className="text-[11px] text-slate-400">{st.empId} • {st.designation}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 text-xs">{st.department}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{st.inTime}</td>
                      <td className="py-3.5 px-4 font-bold text-blue-600">{st.workHours}</td>
                      <td className="py-3.5 px-5 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                          st.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {st.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: LEAVES & OD                                                        */}
          {/* ========================================================================= */}
          {activeTab === 'leaves' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leaveRequests.map(req => (
                  <div key={req.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-lg border border-blue-100">
                        {req.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                        req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{req.applicantName}</h4>
                      <p className="text-xs text-slate-500">{req.role} • {req.department}</p>
                      <p className="text-xs text-slate-700 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <strong>Reason:</strong> {req.reason}
                      </p>
                    </div>

                    {req.status === 'Pending' && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleUpdateLeaveStatus(req.id, 'Approved')}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleUpdateLeaveStatus(req.id, 'Rejected')}
                          className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: VIEW STUDENT ATTENDANCE PROFILE                                    */}
      {/* ========================================================================= */}
      {viewingStudentProfile && (
        <ModalPortal isOpen={Boolean(viewingStudentProfile)} onClose={() => setViewingStudentProfile(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                    {viewingStudentProfile.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Roll: <strong className="text-slate-800">{viewingStudentProfile.rollNo}</strong> • {viewingStudentProfile.department}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewingStudentProfile(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">Semester Overall Attendance</span>
                <p className="text-2xl font-black text-emerald-400">{viewingStudentProfile.attendancePercent}%</p>
                <p className="text-xs text-slate-300 mt-0.5">{viewingStudentProfile.attendedClasses} / {viewingStudentProfile.totalClasses} Lectures Attended</p>
              </div>

              <span className={`px-3 py-1.5 text-xs font-bold rounded-xl ${
                viewingStudentProfile.attendancePercent < 75 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {viewingStudentProfile.attendancePercent < 75 ? '⚠️ Shortage Risk' : '✓ Eligible for Exams'}
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Subject-wise Attendance Breakdown</h4>
              <div className="space-y-2">
                {viewingStudentProfile.subjectWise?.map((sub, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-purple-600 mr-2">{sub.code}:</span>
                      <span className="font-bold text-slate-900">{sub.name}</span>
                    </div>
                    <span className={`font-black text-xs ${
                      sub.percent >= 85 ? 'text-emerald-600' : sub.percent >= 75 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {sub.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Guardian / Parent Contact</span>
              <p className="font-bold text-slate-800">{viewingStudentProfile.parentName} • 📞 {viewingStudentProfile.parentPhone}</p>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewingStudentProfile(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                Close Profile
              </button>
            </div>

          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SEND SHORTAGE NOTICE                                               */}
      {/* ========================================================================= */}
      {warningModalStudent && (
        <ModalPortal isOpen={Boolean(warningModalStudent)} onClose={() => setWarningModalStudent(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">Send Shortage Notice</h3>
                  <p className="text-[11px] text-slate-500">Official SMS & Email alert to parent</p>
                </div>
              </div>
              <button onClick={() => setWarningModalStudent(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100 text-xs space-y-1 text-rose-900">
              <p><strong>Student:</strong> {warningModalStudent.name} ({warningModalStudent.rollNo})</p>
              <p><strong>Attendance:</strong> <span className="font-extrabold text-rose-600">{warningModalStudent.attendancePercent}%</span> (Minimum 75% required)</p>
              <p><strong>Parent:</strong> {warningModalStudent.parentName} ({warningModalStudent.parentPhone})</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWarningModalStudent(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendWarning}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Dispatch Notice</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
