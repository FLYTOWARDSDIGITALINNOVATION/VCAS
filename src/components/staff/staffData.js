// ============================================================
//  VCAS – Staff Portal Static Data
//  All mock data for the Staff Portal lives here.
// ============================================================

// ── Staff Registry (login credentials + profile) ─────────────
export const STAFF_REGISTRY = [
  {
    staffId: 'EMP001',
    email: 'sunita.rao@vcas.edu',
    password: 'vcas@2026',
    name: 'Dr. Sunita Rao',
    designation: 'Professor & HOD',
    department: 'Computer Science',
    qualification: 'Ph.D. in Computer Science (IIT Madras), M.Tech in AI',
    experience: '12 Years',
    bloodGroup: 'O+',
    dob: '1982-04-12',
    phone: '9811223344',
    altPhone: '9900112233',
    address: 'Flat 4B, Silver Oak Residency, Tech Park Road, Chennai - 600096',
    emergencyContact: 'Mr. Arvind Rao (Spouse) – +91 98112 99887',
    joiningDate: '2018-06-01',
    avatarInitials: 'SR',
    avatarColor: 'from-violet-600 to-purple-700',
    subjects: ['CS401', 'CS402'],
    classTeacherOf: 'CS – III Year (Sem 5), Section A',
  },
  {
    staffId: 'EMP002',
    email: 'ramesh.k@vcas.edu',
    password: 'vcas@2026',
    name: 'Prof. Ramesh Kumar',
    designation: 'Associate Professor',
    department: 'Electronics',
    qualification: 'Ph.D. in VLSI Systems, M.E. in Electronics',
    experience: '9 Years',
    bloodGroup: 'A+',
    dob: '1985-09-20',
    phone: '9811223345',
    altPhone: '',
    address: '18, Temple View Enclave, Gandhi Road, Chennai - 600042',
    emergencyContact: 'Mrs. Geetha Kumar (Spouse) – +91 98112 44556',
    joiningDate: '2020-07-15',
    avatarInitials: 'RK',
    avatarColor: 'from-blue-600 to-cyan-700',
    subjects: ['EC401', 'EC402'],
    classTeacherOf: 'EC – II Year (Sem 4), Section A',
  },
  {
    staffId: 'EMP003',
    email: 'anita.d@vcas.edu',
    password: 'vcas@2026',
    name: 'Dr. Anita Desai',
    designation: 'HOD & Associate Professor',
    department: 'MBA',
    qualification: 'Ph.D. in Management, MBA (Finance)',
    experience: '15 Years',
    bloodGroup: 'B+',
    dob: '1978-11-05',
    phone: '9811223346',
    altPhone: '9944332211',
    address: '22, Garden View Apartments, Anna Nagar, Chennai - 600040',
    emergencyContact: 'Mr. Vikram Desai (Spouse) – +91 98003 77651',
    joiningDate: '2015-07-01',
    avatarInitials: 'AD',
    avatarColor: 'from-rose-600 to-pink-700',
    subjects: ['MB401', 'MB402'],
    classTeacherOf: 'MBA – I Year (Sem 2), Section A',
  },
];

// ── Subject Definitions ───────────────────────────────────────
export const SUBJECTS = {
  CS401: { code: 'CS401', name: 'Database Management Systems', semester: 5, year: 3, section: 'A', dept: 'Computer Science', credits: 4, totalStudents: 58 },
  CS402: { code: 'CS402', name: 'Operating Systems', semester: 5, year: 3, section: 'A', dept: 'Computer Science', credits: 4, totalStudents: 58 },
  EC401: { code: 'EC401', name: 'VLSI Design', semester: 4, year: 2, section: 'A', dept: 'Electronics', credits: 4, totalStudents: 45 },
  EC402: { code: 'EC402', name: 'Digital Signal Processing', semester: 4, year: 2, section: 'A', dept: 'Electronics', credits: 3, totalStudents: 45 },
  MB401: { code: 'MB401', name: 'Financial Management', semester: 2, year: 1, section: 'A', dept: 'MBA', credits: 4, totalStudents: 38 },
  MB402: { code: 'MB402', name: 'Marketing Management', semester: 2, year: 1, section: 'A', dept: 'MBA', credits: 3, totalStudents: 38 },
};

// ── Enrolled Students per Subject ────────────────────────────
export const STUDENTS = {
  CS401: [
    { rollNo: 'CS21001', name: 'Aditya Kapoor', phone: '9900000001', present: true },
    { rollNo: 'CS21002', name: 'Priya Mehta', phone: '9900000002', present: true },
    { rollNo: 'CS21003', name: 'Rajan Iyer', phone: '9900000003', present: false },
    { rollNo: 'CS21004', name: 'Sneha Pillai', phone: '9900000004', present: true },
    { rollNo: 'CS21005', name: 'Vikram Singh', phone: '9900000005', present: true },
    { rollNo: 'CS21006', name: 'Ananya Bose', phone: '9900000006', present: true },
    { rollNo: 'CS21007', name: 'Deepak Nair', phone: '9900000007', present: false },
    { rollNo: 'CS21008', name: 'Kavitha Reddy', phone: '9900000008', present: true },
    { rollNo: 'CS21009', name: 'Mohan Krishnan', phone: '9900000009', present: true },
    { rollNo: 'CS21010', name: 'Pooja Sharma', phone: '9900000010', present: true },
    { rollNo: 'CS21011', name: 'Suresh Babu', phone: '9900000011', present: true },
    { rollNo: 'CS21012', name: 'Nithya Sundaram', phone: '9900000012', present: false },
    { rollNo: 'CS21013', name: 'Arjun Patel', phone: '9900000013', present: true },
    { rollNo: 'CS21014', name: 'Lakshmi Venkat', phone: '9900000014', present: true },
    { rollNo: 'CS21015', name: 'Rahul Das', phone: '9900000015', present: true },
    { rollNo: 'CS21016', name: 'Swathi Chandran', phone: '9900000016', present: true },
    { rollNo: 'CS21017', name: 'Balaji M', phone: '9900000017', present: false },
    { rollNo: 'CS21018', name: 'Divya Rajan', phone: '9900000018', present: true },
    { rollNo: 'CS21019', name: 'Karthik Sundar', phone: '9900000019', present: true },
    { rollNo: 'CS21020', name: 'Meena Pandian', phone: '9900000020', present: true },
  ],
  CS402: [
    { rollNo: 'CS21001', name: 'Aditya Kapoor', phone: '9900000001', present: true },
    { rollNo: 'CS21002', name: 'Priya Mehta', phone: '9900000002', present: false },
    { rollNo: 'CS21003', name: 'Rajan Iyer', phone: '9900000003', present: true },
    { rollNo: 'CS21004', name: 'Sneha Pillai', phone: '9900000004', present: true },
    { rollNo: 'CS21005', name: 'Vikram Singh', phone: '9900000005', present: true },
    { rollNo: 'CS21006', name: 'Ananya Bose', phone: '9900000006', present: false },
    { rollNo: 'CS21007', name: 'Deepak Nair', phone: '9900000007', present: true },
    { rollNo: 'CS21008', name: 'Kavitha Reddy', phone: '9900000008', present: true },
    { rollNo: 'CS21009', name: 'Mohan Krishnan', phone: '9900000009', present: true },
    { rollNo: 'CS21010', name: 'Pooja Sharma', phone: '9900000010', present: true },
    { rollNo: 'CS21011', name: 'Suresh Babu', phone: '9900000011', present: false },
    { rollNo: 'CS21012', name: 'Nithya Sundaram', phone: '9900000012', present: true },
    { rollNo: 'CS21013', name: 'Arjun Patel', phone: '9900000013', present: true },
    { rollNo: 'CS21014', name: 'Lakshmi Venkat', phone: '9900000014', present: true },
    { rollNo: 'CS21015', name: 'Rahul Das', phone: '9900000015', present: true },
    { rollNo: 'CS21016', name: 'Swathi Chandran', phone: '9900000016', present: true },
    { rollNo: 'CS21017', name: 'Balaji M', phone: '9900000017', present: true },
    { rollNo: 'CS21018', name: 'Divya Rajan', phone: '9900000018', present: false },
    { rollNo: 'CS21019', name: 'Karthik Sundar', phone: '9900000019', present: true },
    { rollNo: 'CS21020', name: 'Meena Pandian', phone: '9900000020', present: true },
  ],
  EC401: [
    { rollNo: 'EC22001', name: 'Arunkumar R', phone: '9900100001', present: true },
    { rollNo: 'EC22002', name: 'Brindha S', phone: '9900100002', present: true },
    { rollNo: 'EC22003', name: 'Chandru V', phone: '9900100003', present: false },
    { rollNo: 'EC22004', name: 'Dharini P', phone: '9900100004', present: true },
    { rollNo: 'EC22005', name: 'Ezhilarasan K', phone: '9900100005', present: true },
    { rollNo: 'EC22006', name: 'Fathima N', phone: '9900100006', present: true },
    { rollNo: 'EC22007', name: 'Gowtham A', phone: '9900100007', present: false },
    { rollNo: 'EC22008', name: 'Harini M', phone: '9900100008', present: true },
    { rollNo: 'EC22009', name: 'Ilayaraja T', phone: '9900100009', present: true },
    { rollNo: 'EC22010', name: 'Janani V', phone: '9900100010', present: true },
    { rollNo: 'EC22011', name: 'Kalpana S', phone: '9900100011', present: true },
    { rollNo: 'EC22012', name: 'Logesh M', phone: '9900100012', present: true },
    { rollNo: 'EC22013', name: 'Malar D', phone: '9900100013', present: false },
    { rollNo: 'EC22014', name: 'Naveen P', phone: '9900100014', present: true },
    { rollNo: 'EC22015', name: 'Oviya R', phone: '9900100015', present: true },
  ],
  EC402: [
    { rollNo: 'EC22001', name: 'Arunkumar R', phone: '9900100001', present: true },
    { rollNo: 'EC22002', name: 'Brindha S', phone: '9900100002', present: true },
    { rollNo: 'EC22003', name: 'Chandru V', phone: '9900100003', present: true },
    { rollNo: 'EC22004', name: 'Dharini P', phone: '9900100004', present: false },
    { rollNo: 'EC22005', name: 'Ezhilarasan K', phone: '9900100005', present: true },
    { rollNo: 'EC22006', name: 'Fathima N', phone: '9900100006', present: true },
    { rollNo: 'EC22007', name: 'Gowtham A', phone: '9900100007', present: true },
    { rollNo: 'EC22008', name: 'Harini M', phone: '9900100008', present: false },
    { rollNo: 'EC22009', name: 'Ilayaraja T', phone: '9900100009', present: true },
    { rollNo: 'EC22010', name: 'Janani V', phone: '9900100010', present: true },
    { rollNo: 'EC22011', name: 'Kalpana S', phone: '9900100011', present: true },
    { rollNo: 'EC22012', name: 'Logesh M', phone: '9900100012', present: true },
    { rollNo: 'EC22013', name: 'Malar D', phone: '9900100013', present: true },
    { rollNo: 'EC22014', name: 'Naveen P', phone: '9900100014', present: false },
    { rollNo: 'EC22015', name: 'Oviya R', phone: '9900100015', present: true },
  ],
  MB401: [
    { rollNo: 'MB23001', name: 'Abinaya K', phone: '9900200001', present: true },
    { rollNo: 'MB23002', name: 'Balamurugan S', phone: '9900200002', present: false },
    { rollNo: 'MB23003', name: 'Chithra R', phone: '9900200003', present: true },
    { rollNo: 'MB23004', name: 'Dhinesh P', phone: '9900200004', present: true },
    { rollNo: 'MB23005', name: 'Eswari M', phone: '9900200005', present: true },
    { rollNo: 'MB23006', name: 'Farida B', phone: '9900200006', present: true },
    { rollNo: 'MB23007', name: 'Ganesh K', phone: '9900200007', present: false },
    { rollNo: 'MB23008', name: 'Hema S', phone: '9900200008', present: true },
    { rollNo: 'MB23009', name: 'Ilango V', phone: '9900200009', present: true },
    { rollNo: 'MB23010', name: 'Jayanthi R', phone: '9900200010', present: true },
    { rollNo: 'MB23011', name: 'Kiran M', phone: '9900200011', present: true },
    { rollNo: 'MB23012', name: 'Lavanya P', phone: '9900200012', present: true },
  ],
  MB402: [
    { rollNo: 'MB23001', name: 'Abinaya K', phone: '9900200001', present: true },
    { rollNo: 'MB23002', name: 'Balamurugan S', phone: '9900200002', present: true },
    { rollNo: 'MB23003', name: 'Chithra R', phone: '9900200003', present: false },
    { rollNo: 'MB23004', name: 'Dhinesh P', phone: '9900200004', present: true },
    { rollNo: 'MB23005', name: 'Eswari M', phone: '9900200005', present: true },
    { rollNo: 'MB23006', name: 'Farida B', phone: '9900200006', present: true },
    { rollNo: 'MB23007', name: 'Ganesh K', phone: '9900200007', present: true },
    { rollNo: 'MB23008', name: 'Hema S', phone: '9900200008', present: false },
    { rollNo: 'MB23009', name: 'Ilango V', phone: '9900200009', present: true },
    { rollNo: 'MB23010', name: 'Jayanthi R', phone: '9900200010', present: true },
    { rollNo: 'MB23011', name: 'Kiran M', phone: '9900200011', present: true },
    { rollNo: 'MB23012', name: 'Lavanya P', phone: '9900200012', present: true },
  ],
};

// ── Timetable (per staffId) ──────────────────────────────────
// Slots: 1-6 theory, lunch after slot 3, 7-9 for labs
const SLOT_TIMES = [
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
export { SLOT_TIMES };

export const TIMETABLE = {
  EMP001: {
    Monday:    { 1: { code: 'CS401', name: 'DBMS', room: 'LH-201', type: 'theory', color: 'blue' }, 2: { code: 'CS401', name: 'DBMS', room: 'LH-201', type: 'theory', color: 'blue' }, 4: { code: 'CS402', name: 'OS', room: 'LH-201', type: 'theory', color: 'indigo' }, 6: null, 7: null, 8: null },
    Tuesday:   { 1: { code: 'CS402', name: 'OS', room: 'LH-201', type: 'theory', color: 'indigo' }, 2: null, 3: { code: 'CS401', name: 'DBMS', room: 'LH-201', type: 'theory', color: 'blue' }, 4: null, 5: { code: 'CS402', name: 'OS Lab', room: 'Lab-3', type: 'lab', color: 'emerald' }, 6: { code: 'CS402', name: 'OS Lab', room: 'Lab-3', type: 'lab', color: 'emerald' }, 7: null, 8: null },
    Wednesday: { 1: null, 2: { code: 'CS401', name: 'DBMS', room: 'LH-201', type: 'theory', color: 'blue' }, 3: null, 4: { code: 'CS402', name: 'OS', room: 'LH-201', type: 'theory', color: 'indigo' }, 5: null, 6: null, 7: null, 8: null },
    Thursday:  { 1: { code: 'CS401', name: 'DBMS Lab', room: 'Lab-3', type: 'lab', color: 'emerald' }, 2: { code: 'CS401', name: 'DBMS Lab', room: 'Lab-3', type: 'lab', color: 'emerald' }, 3: { code: 'CS401', name: 'DBMS Lab', room: 'Lab-3', type: 'lab', color: 'emerald' }, 4: null, 5: { code: 'CS402', name: 'OS', room: 'LH-201', type: 'theory', color: 'indigo' }, 6: null, 7: null, 8: null },
    Friday:    { 1: { code: 'CS401', name: 'DBMS', room: 'LH-201', type: 'theory', color: 'blue' }, 2: null, 3: { code: 'CS402', name: 'OS', room: 'LH-201', type: 'theory', color: 'indigo' }, 4: null, 5: null, 6: null, 7: null, 8: null },
    Saturday:  { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null },
  },
  EMP002: {
    Monday:    { 1: { code: 'EC401', name: 'VLSI Design', room: 'LH-101', type: 'theory', color: 'blue' }, 2: null, 3: { code: 'EC402', name: 'DSP', room: 'LH-101', type: 'theory', color: 'amber' }, 4: null, 5: null, 6: null, 7: null, 8: null },
    Tuesday:   { 1: { code: 'EC401', name: 'VLSI Design', room: 'LH-101', type: 'theory', color: 'blue' }, 2: { code: 'EC402', name: 'DSP', room: 'LH-101', type: 'theory', color: 'amber' }, 3: null, 4: { code: 'EC401', name: 'VLSI Lab', room: 'EC Lab-2', type: 'lab', color: 'emerald' }, 5: { code: 'EC401', name: 'VLSI Lab', room: 'EC Lab-2', type: 'lab', color: 'emerald' }, 6: { code: 'EC401', name: 'VLSI Lab', room: 'EC Lab-2', type: 'lab', color: 'emerald' }, 7: null, 8: null },
    Wednesday: { 1: null, 2: { code: 'EC402', name: 'DSP', room: 'LH-101', type: 'theory', color: 'amber' }, 3: { code: 'EC401', name: 'VLSI Design', room: 'LH-101', type: 'theory', color: 'blue' }, 4: null, 5: null, 6: null, 7: null, 8: null },
    Thursday:  { 1: { code: 'EC402', name: 'DSP Lab', room: 'EC Lab-3', type: 'lab', color: 'emerald' }, 2: { code: 'EC402', name: 'DSP Lab', room: 'EC Lab-3', type: 'lab', color: 'emerald' }, 3: { code: 'EC402', name: 'DSP Lab', room: 'EC Lab-3', type: 'lab', color: 'emerald' }, 4: { code: 'EC401', name: 'VLSI Design', room: 'LH-101', type: 'theory', color: 'blue' }, 5: null, 6: null, 7: null, 8: null },
    Friday:    { 1: { code: 'EC402', name: 'DSP', room: 'LH-101', type: 'theory', color: 'amber' }, 2: null, 3: null, 4: { code: 'EC401', name: 'VLSI Design', room: 'LH-101', type: 'theory', color: 'blue' }, 5: null, 6: null, 7: null, 8: null },
    Saturday:  { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null },
  },
  EMP003: {
    Monday:    { 1: { code: 'MB401', name: 'Financial Mgmt', room: 'MBA-Hall', type: 'theory', color: 'rose' }, 2: { code: 'MB402', name: 'Marketing Mgmt', room: 'MBA-Hall', type: 'theory', color: 'purple' }, 3: null, 4: { code: 'MB401', name: 'Financial Mgmt', room: 'MBA-Hall', type: 'theory', color: 'rose' }, 5: null, 6: null, 7: null, 8: null },
    Tuesday:   { 1: null, 2: { code: 'MB402', name: 'Marketing Mgmt', room: 'MBA-Hall', type: 'theory', color: 'purple' }, 3: { code: 'MB401', name: 'Financial Mgmt', room: 'MBA-Hall', type: 'theory', color: 'rose' }, 4: null, 5: { code: 'MB402', name: 'Marketing Mgmt', room: 'MBA-Hall', type: 'theory', color: 'purple' }, 6: null, 7: null, 8: null },
    Wednesday: { 1: { code: 'MB401', name: 'Financial Mgmt', room: 'MBA-Hall', type: 'theory', color: 'rose' }, 2: null, 3: { code: 'MB402', name: 'Marketing Mgmt', room: 'MBA-Hall', type: 'theory', color: 'purple' }, 4: { code: 'MB401', name: 'Financial Mgmt', room: 'MBA-Hall', type: 'theory', color: 'rose' }, 5: null, 6: null, 7: null, 8: null },
    Thursday:  { 1: null, 2: { code: 'MB402', name: 'Marketing Mgmt', room: 'MBA-Hall', type: 'theory', color: 'purple' }, 3: null, 4: { code: 'MB401', name: 'Financial Mgmt', room: 'MBA-Hall', type: 'theory', color: 'rose' }, 5: { code: 'MB402', name: 'Marketing Mgmt', room: 'MBA-Hall', type: 'theory', color: 'purple' }, 6: null, 7: null, 8: null },
    Friday:    { 1: { code: 'MB401', name: 'Financial Mgmt', room: 'MBA-Hall', type: 'theory', color: 'rose' }, 2: { code: 'MB402', name: 'Marketing Mgmt', room: 'MBA-Hall', type: 'theory', color: 'purple' }, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null },
    Saturday:  { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null },
  },
};

// ── Attendance History (per staffId) ─────────────────────────
export const ATTENDANCE_HISTORY = {
  EMP001: [
    { id: 'ATT001', date: '2026-09-03', subjectCode: 'CS401', subjectName: 'Database Management Systems', sessionSlot: '8:30 AM', presentCount: 18, absentCount: 2, totalCount: 20 },
    { id: 'ATT002', date: '2026-09-03', subjectCode: 'CS402', subjectName: 'Operating Systems', sessionSlot: '11:15 AM', presentCount: 17, absentCount: 3, totalCount: 20 },
    { id: 'ATT003', date: '2026-09-02', subjectCode: 'CS401', subjectName: 'Database Management Systems', sessionSlot: '9:20 AM', presentCount: 19, absentCount: 1, totalCount: 20 },
    { id: 'ATT004', date: '2026-09-02', subjectCode: 'CS402', subjectName: 'Operating Systems', sessionSlot: '2:35 PM', presentCount: 16, absentCount: 4, totalCount: 20 },
    { id: 'ATT005', date: '2026-09-01', subjectCode: 'CS401', subjectName: 'Database Management Systems', sessionSlot: '8:30 AM', presentCount: 20, absentCount: 0, totalCount: 20 },
  ],
  EMP002: [
    { id: 'ATT010', date: '2026-09-03', subjectCode: 'EC401', subjectName: 'VLSI Design', sessionSlot: '8:30 AM', presentCount: 13, absentCount: 2, totalCount: 15 },
    { id: 'ATT011', date: '2026-09-02', subjectCode: 'EC402', subjectName: 'Digital Signal Processing', sessionSlot: '9:20 AM', presentCount: 14, absentCount: 1, totalCount: 15 },
    { id: 'ATT012', date: '2026-09-01', subjectCode: 'EC401', subjectName: 'VLSI Design', sessionSlot: '11:15 AM', presentCount: 12, absentCount: 3, totalCount: 15 },
  ],
  EMP003: [
    { id: 'ATT020', date: '2026-09-03', subjectCode: 'MB401', subjectName: 'Financial Management', sessionSlot: '8:30 AM', presentCount: 11, absentCount: 1, totalCount: 12 },
    { id: 'ATT021', date: '2026-09-02', subjectCode: 'MB402', subjectName: 'Marketing Management', sessionSlot: '9:20 AM', presentCount: 10, absentCount: 2, totalCount: 12 },
  ],
};

// ── Assignments (per staffId) ─────────────────────────────────
export const ASSIGNMENTS_DATA = {
  EMP001: [
    { id: 'ASGT001', subjectCode: 'CS401', subjectName: 'Database Management Systems', title: 'ER Diagram Design', description: 'Design an ER diagram for a hospital management system with at least 8 entities and appropriate relationships.', dueDate: '2026-09-10', totalMarks: 20, status: 'Active', submissions: 14 },
    { id: 'ASGT002', subjectCode: 'CS402', subjectName: 'Operating Systems', title: 'Process Scheduling Algorithms', description: 'Implement FCFS, SJF, and Round Robin scheduling algorithms and compare their performance.', dueDate: '2026-09-08', totalMarks: 30, status: 'Active', submissions: 9 },
    { id: 'ASGT003', subjectCode: 'CS401', subjectName: 'Database Management Systems', title: 'SQL Queries Assignment', description: 'Write SQL queries for the given schema covering all types of joins, subqueries, and aggregate functions.', dueDate: '2026-08-25', totalMarks: 25, status: 'Closed', submissions: 20 },
  ],
  EMP002: [
    { id: 'ASGT010', subjectCode: 'EC401', subjectName: 'VLSI Design', title: 'CMOS Inverter Design', description: 'Design a CMOS inverter using Cadence Virtuoso and analyze its VTC characteristics.', dueDate: '2026-09-12', totalMarks: 25, status: 'Active', submissions: 8 },
    { id: 'ASGT011', subjectCode: 'EC402', subjectName: 'Digital Signal Processing', title: 'FIR Filter Design', description: 'Design and implement an FIR lowpass filter using the windowing method (Hamming Window).', dueDate: '2026-09-05', totalMarks: 20, status: 'Active', submissions: 5 },
  ],
  EMP003: [
    { id: 'ASGT020', subjectCode: 'MB401', subjectName: 'Financial Management', title: 'NPV & IRR Analysis', description: 'Perform NPV and IRR analysis on the given case study of a capital investment decision.', dueDate: '2026-09-11', totalMarks: 30, status: 'Active', submissions: 7 },
    { id: 'ASGT021', subjectCode: 'MB402', subjectName: 'Marketing Management', title: 'Marketing Mix Strategy', description: 'Develop a 4P marketing mix strategy for a new FMCG product launch in rural India.', dueDate: '2026-08-30', totalMarks: 20, status: 'Closed', submissions: 12 },
  ],
};

// ── Notices (shared) ─────────────────────────────────────────
export const NOTICES_DATA = [
  { id: 'N001', title: 'Semester End Examination Schedule Released', body: 'The schedule for the Semester End Examinations (Nov–Dec 2026) has been released. Students are advised to check the examination portal. Hall tickets will be issued one week before the exam commencement date.', postedBy: 'Examination Controller', date: '2026-09-01', tag: 'Exam', urgent: true },
  { id: 'N002', title: 'Internal Assessment Marks Submission Deadline', body: 'All faculty members are requested to submit Internal Assessment marks for CIA-2 by September 10, 2026. Late submissions will not be accepted. Please use the online marks entry portal.', postedBy: 'Academic Section', date: '2026-09-02', tag: 'Academic', urgent: true },
  { id: 'N003', title: 'Staff Development Programme – Data Science', body: 'A two-day Staff Development Programme on "Data Science & AI Applications" will be conducted on September 20-21, 2026 in Seminar Hall A. Faculty members are encouraged to register.', postedBy: 'IQAC Cell', date: '2026-08-28', tag: 'Development', urgent: false },
  { id: 'N004', title: 'Annual Day Celebration – Volunteer Coordination', body: 'Annual Day celebrations are scheduled for October 5, 2026. Faculty coordinators are requested to submit the list of student volunteers and event coordinators by September 15, 2026.', postedBy: 'Cultural Committee', date: '2026-08-25', tag: 'Event', urgent: false },
  { id: 'N005', title: 'Research Grant Application – Last Date Extended', body: 'The last date for submission of research grant applications under the VCAS Research Fund has been extended to September 30, 2026. Interested faculty may contact the Research Cell for application forms.', postedBy: 'Research Cell', date: '2026-08-20', tag: 'Research', urgent: false },
];

// ── Leave Records (per staffId) ──────────────────────────────
export const LEAVE_DATA = {
  EMP001: [
    { id: 'LV001', type: 'Medical Leave', from: '2026-07-10', to: '2026-07-11', days: 2, reason: 'Fever and throat infection', status: 'Approved', approvedBy: 'Principal' },
    { id: 'LV002', type: 'Casual Leave', from: '2026-08-15', to: '2026-08-15', days: 1, reason: 'Family function', status: 'Approved', approvedBy: 'HoD' },
    { id: 'LV003', type: 'On Duty', from: '2026-09-05', to: '2026-09-05', days: 1, reason: 'Attending NAAC workshop at Anna University', status: 'Pending', approvedBy: '-' },
  ],
  EMP002: [
    { id: 'LV010', type: 'Casual Leave', from: '2026-08-20', to: '2026-08-20', days: 1, reason: 'Personal work', status: 'Approved', approvedBy: 'HoD' },
    { id: 'LV011', type: 'Medical Leave', from: '2026-09-02', to: '2026-09-03', days: 2, reason: 'Hospitalisation', status: 'Pending', approvedBy: '-' },
  ],
  EMP003: [
    { id: 'LV020', type: 'On Duty', from: '2026-08-18', to: '2026-08-19', days: 2, reason: 'International conference presentation at IIM Bangalore', status: 'Approved', approvedBy: 'Principal' },
    { id: 'LV021', type: 'Casual Leave', from: '2026-09-06', to: '2026-09-06', days: 1, reason: 'Daughter\'s school function', status: 'Pending', approvedBy: '-' },
  ],
};
