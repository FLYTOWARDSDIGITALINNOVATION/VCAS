import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare, Calendar as CalendarIcon, Clock, Users,
  CheckCircle2, XCircle, History, Save, AlertCircle,
  Search, BookOpen, ChevronRight, Plus
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function StaffAttendance({ staffUser }) {
  const [activeTab, setActiveTab] = useState('mark'); // 'mark' | 'history'

  // Classes & Student Roster
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedClassCode, setSelectedClassCode] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sessionSlot, setSessionSlot] = useState('8:30 AM');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Attendance state: rollNo -> 'Present' | 'Absent' | 'Late'
  const [attendanceState, setAttendanceState] = useState({});

  // Real Attendance History from database
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch classes from backend API
  const fetchClasses = async () => {
    if (!staffUser?.staffId) return;
    try {
      setLoadingClasses(true);
      const res = await fetch(`${API_BASE}/classes/staff/${staffUser.staffId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.classes)) {
        setClasses(data.classes);
        if (data.classes.length > 0 && !selectedClassCode) {
          setSelectedClassCode(data.classes[0].code);
        }
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoadingClasses(false);
    }
  };

  // Fetch real attendance history from database
  const fetchHistory = async () => {
    if (!staffUser?.staffId) return;
    try {
      setLoadingHistory(true);
      const res = await fetch(`${API_BASE}/attendance/staff/${staffUser.staffId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.sessions)) {
        setHistoryList(data.sessions);
      }
    } catch (err) {
      console.error('Error fetching attendance history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchHistory();
  }, [staffUser?.staffId]);

  // Current active class object
  const currentClass = useMemo(() => {
    return classes.find(c => c.code === selectedClassCode) || classes[0] || null;
  }, [classes, selectedClassCode]);

  // Current enrolled students for selected class
  const classStudents = useMemo(() => {
    if (!currentClass) return [];
    return currentClass.students || currentClass.enrolledStudents || [];
  }, [currentClass]);

  // Reset attendance state when selected class changes
  useEffect(() => {
    const initialMap = {};
    classStudents.forEach(s => {
      initialMap[s.rollNo] = 'Present';
    });
    setAttendanceState(initialMap);
    setSavedSuccessMsg('');
    setSubmitError('');
  }, [selectedClassCode, classStudents]);

  // Filter students based on search query
  const displayedStudents = useMemo(() => {
    if (!searchQuery.trim()) return classStudents;
    const q = searchQuery.toLowerCase();
    return classStudents.filter(s =>
      s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)
    );
  }, [classStudents, searchQuery]);

  // Quick tally counts
  const totalCount = classStudents.length;
  const presentCount = useMemo(() => {
    return classStudents.filter(s => attendanceState[s.rollNo] === 'Present').length;
  }, [classStudents, attendanceState]);

  const absentCount = useMemo(() => {
    return classStudents.filter(s => attendanceState[s.rollNo] === 'Absent').length;
  }, [classStudents, attendanceState]);

  const lateCount = useMemo(() => {
    return classStudents.filter(s => attendanceState[s.rollNo] === 'Late').length;
  }, [classStudents, attendanceState]);

  const handleMarkAll = (status) => {
    const updated = { ...attendanceState };
    classStudents.forEach(s => {
      updated[s.rollNo] = status;
    });
    setAttendanceState(updated);
  };

  const toggleStudentStatus = (rollNo, status) => {
    setAttendanceState(prev => ({
      ...prev,
      [rollNo]: status
    }));
  };

  // Submit session attendance to MongoDB Atlas
  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSavedSuccessMsg('');

    if (!currentClass) {
      setSubmitError('Please select a valid subject.');
      return;
    }

    if (classStudents.length === 0) {
      setSubmitError('No students enrolled in this class. Please enroll students in "My Classes" first.');
      return;
    }

    try {
      setIsSubmitting(true);
      const records = classStudents.map(s => ({
        rollNo: s.rollNo,
        name: s.name,
        status: attendanceState[s.rollNo] || 'Present'
      }));

      const payload = {
        staffId: staffUser.staffId,
        staffName: staffUser.name,
        classCode: currentClass.code,
        className: currentClass.name,
        date: selectedDate,
        slot: sessionSlot,
        records
      };

      const res = await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitError(data.message || 'Failed to save attendance.');
        return;
      }

      setSavedSuccessMsg(`Attendance for ${currentClass.code} on ${selectedDate} (${sessionSlot}) saved directly to MongoDB Atlas!`);
      fetchHistory();
      setTimeout(() => setSavedSuccessMsg(''), 6000);
    } catch (err) {
      setSubmitError('Network error connecting to backend: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-6xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Attendance Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Mark daily class attendance or view past submitted logs from database
          </p>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('mark')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'mark'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Mark Attendance
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              fetchHistory();
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            Attendance History ({historyList.length})
          </button>
        </div>
      </div>

      {/* Notifications */}
      {savedSuccessMsg && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {submitError && (
        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold shadow-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {activeTab === 'mark' ? (
        loadingClasses ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-400 font-bold">Loading your classes from database...</p>
          </div>
        ) : classes.length === 0 ? (
          /* Empty classes banner */
          <div className="p-10 text-center bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">No Subjects Added Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Before marking attendance, you need to add your subjects and enroll students in the <strong>My Classes</strong> section.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Controls Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Subject Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Subject</label>
                  <select
                    value={selectedClassCode}
                    onChange={(e) => setSelectedClassCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    {classes.map(cls => (
                      <option key={cls.code} value={cls.code}>
                        {cls.code} – {cls.name} (Year {cls.year}, Sem {cls.semester})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Session Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                {/* Time Slot Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Session Slot</label>
                  <select
                    value={sessionSlot}
                    onChange={(e) => setSessionSlot(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="8:30 AM">Period 1 (8:30 AM – 9:20 AM)</option>
                    <option value="9:20 AM">Period 2 (9:20 AM – 10:10 AM)</option>
                    <option value="10:10 AM">Period 3 (10:10 AM – 11:00 AM)</option>
                    <option value="11:15 AM">Period 4 (11:15 AM – 12:05 PM)</option>
                    <option value="12:05 PM">Period 5 (12:05 PM – 12:55 PM)</option>
                    <option value="1:45 PM">Period 6 (1:45 PM – 2:35 PM)</option>
                    <option value="2:35 PM">Period 7 (2:35 PM – 3:25 PM)</option>
                    <option value="3:25 PM">Period 8 (3:25 PM – 4:15 PM)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Metrics & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 mr-1">Roster Stats:</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                  Total: {totalCount}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                  Present: {presentCount}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">
                  Absent: {absentCount}
                </span>
                {lateCount > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold">
                    Late: {lateCount}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleMarkAll('Present')}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('Absent')}
                  className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all"
                >
                  Mark All Absent
                </button>
              </div>
            </div>

            {/* Student Roster Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {classStudents.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <p className="text-xs font-semibold text-slate-500">
                    No students have been enrolled in <strong>{currentClass.name}</strong> yet.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Go to <strong>My Classes</strong> tab to add students to this class.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100">
                          <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider w-12">#</th>
                          <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Roll No.</th>
                          <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                          <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                          <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {displayedStudents.map((student, idx) => {
                          const status = attendanceState[student.rollNo] || 'Present';
                          return (
                            <tr key={student.rollNo} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-5 py-3 text-slate-400 font-medium">{idx + 1}</td>
                              <td className="px-5 py-3 font-bold text-slate-700">{student.rollNo}</td>
                              <td className="px-5 py-3 font-semibold text-slate-900">{student.name}</td>
                              <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">{student.phone || '—'}</td>
                              <td className="px-5 py-3 text-center">
                                <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                                  <button
                                    type="button"
                                    onClick={() => toggleStudentStatus(student.rollNo, 'Present')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                      status === 'Present'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    Present
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleStudentStatus(student.rollNo, 'Absent')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                      status === 'Absent'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    Absent
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleStudentStatus(student.rollNo, 'Late')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                      status === 'Late'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    Late
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Submit Bar */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      {presentCount + lateCount} of {totalCount} students marked present or late
                    </span>
                    <button
                      type="button"
                      disabled={isSubmitting || classStudents.length === 0}
                      onClick={handleSaveAttendance}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      {isSubmitting ? 'Saving to Atlas...' : 'Submit Session Attendance'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      ) : (
        /* Attendance History View */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">Past Submitted Attendance Sessions</h3>
            <button
              onClick={fetchHistory}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Refresh Logs
            </button>
          </div>

          {loadingHistory ? (
            <div className="p-10 text-center">
              <p className="text-xs text-slate-400 font-bold">Loading history from database...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-xs font-bold text-slate-700">No attendance sessions recorded yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Once you mark and submit attendance for a class, your logs will appear here directly from MongoDB Atlas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Slot / Time</th>
                    <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                    <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Total</th>
                    <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Present</th>
                    <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Absent</th>
                    <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {historyList.map(record => {
                    const total = record.totalStudents || (record.records ? record.records.length : 0);
                    const present = record.presentCount || 0;
                    const late = record.lateCount || 0;
                    const absent = record.absentCount || 0;
                    const pct = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

                    return (
                      <tr key={record._id || record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-800">{record.date}</td>
                        <td className="px-5 py-3 text-slate-600">{record.slot || '—'}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900">
                          <span className="font-extrabold text-blue-600 mr-1.5">[{record.classCode}]</span>
                          {record.className}
                        </td>
                        <td className="px-5 py-3 text-center text-slate-700 font-bold">{total}</td>
                        <td className="px-5 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">
                            {present}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold">
                            {absent}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md font-extrabold ${
                            pct >= 85 ? 'bg-emerald-50 text-emerald-700' : pct >= 75 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
