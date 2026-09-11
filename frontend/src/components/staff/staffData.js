export const STAFF_REGISTRY = [];
export const SUBJECTS = {};
export const STUDENTS = {};
export const SLOT_TIMES = [
  { slot: 1, time: '8:30 – 9:20 AM' },
  { slot: 2, time: '9:20 – 10:10 AM' },
  { slot: 3, time: '10:10 – 11:00 AM' },
  { slot: 'B', time: '11:00 – 11:15 AM', isBreak: true, label: 'Break' },
  { slot: 4, time: '11:15 AM – 12:05 PM' },
  { slot: 5, time: '12:05 – 12:55 PM' },
  { slot: 'L', time: '12:55 – 1:45 PM', isBreak: true, label: 'Lunch' },
  { slot: 6, time: '1:45 – 2:35 PM' },
  { slot: 7, time: '2:35 – 3:25 PM' },
  { slot: 8, time: '3:25 – 4:15 PM' },
];

export const TIMETABLE = {};

// ── Attendance History (Empty - loads from MongoDB Atlas) ────
export const ATTENDANCE_HISTORY = {};

// ── Assignments (Empty - loads from MongoDB Atlas) ───────────
export const ASSIGNMENTS_DATA = {};

// ── Notices ──────────────────────────────────────────────────
export const NOTICES_DATA = [
  {
    id: 'NOT001',
    title: 'Semester End Examination Schedule Released',
    date: '2026-09-02',
    author: 'Controller of Examinations',
    type: 'Exam',
    pinned: true,
    content: 'The end semester theory examinations will commence from November 15, 2026. Faculty members are requested to complete syllabus and internal assessment compilation by October 25, 2026.'
  },
  {
    id: 'NOT002',
    title: 'Department Faculty Meeting – Curriculum Revision',
    date: '2026-09-01',
    author: 'Dean Academics',
    type: 'Meeting',
    pinned: false,
    content: 'All faculty members are requested to attend the curriculum review meeting on Friday at 3:30 PM in the Conference Hall.'
  }
];

// ── Leave Data ───────────────────────────────────────────────
export const LEAVE_DATA = {};

// ── Assessment Configuration for Internal Marks ──────────────
export const ASSESSMENT_COMPONENTS = [
  { id: 'cia1',         label: 'CIA Test 1',         maxMarks: 50, weightage: '10%' },
  { id: 'cia2',         label: 'CIA Test 2',         maxMarks: 50, weightage: '10%' },
  { id: 'model',        label: 'Model Exam',         maxMarks: 75, weightage: '5%'  },
  { id: 'assignment',   label: 'Assignment / Seminar', maxMarks: 20, weightage: '4%'  },
  { id: 'attendance',   label: 'Attendance Score',   maxMarks: 5,  weightage: '5%'  },
  { id: 'consolidated', label: 'Consolidated View',  maxMarks: 25, weightage: '25%' },
];

export const INITIAL_INTERNAL_MARKS = {};
