import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle, 
  History, 
  Save, 
  Filter, 
  AlertCircle,
  Search,
  Check,
  X
} from 'lucide-react';
import { SUBJECTS, STUDENTS, ATTENDANCE_HISTORY } from './staffData';

export default function StaffAttendance({ staffUser }) {
  const mySubjects = useMemo(() => {
    return (staffUser.subjects || []).map(code => SUBJECTS[code]).filter(Boolean);
  }, [staffUser.subjects]);

  const [activeTab, setActiveTab] = useState('mark'); // 'mark' | 'history'
  const [selectedSubjectCode, setSelectedSubjectCode] = useState(mySubjects[0]?.code || '');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sessionSlot, setSessionSlot] = useState('8:30 AM');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');

  // Attendance roster state: map of rollNo -> status ('Present' | 'Absent' | 'Late')
  const [attendanceState, setAttendanceState] = useState(() => {
    const initialList = STUDENTS[mySubjects[0]?.code] || [];
    const stateMap = {};
    initialList.forEach(s => {
      stateMap[s.rollNo] = s.present ? 'Present' : 'Absent';
    });
    return stateMap;
  });

  // Attendance history state initialized from mock data
  const [historyList, setHistoryList] = useState(() => {
    return ATTENDANCE_HISTORY[staffUser.staffId] || [];
  });

  // When subject changes, reinitialize student attendance
  const handleSubjectChange = (code) => {
    setSelectedSubjectCode(code);
    const list = STUDENTS[code] || [];
    const stateMap = {};
    list.forEach(s => {
      stateMap[s.rollNo] = s.present ? 'Present' : 'Absent';
    });
    setAttendanceState(stateMap);
    setSavedSuccessMsg('');
  };

  const currentStudents = useMemo(() => {
    const list = STUDENTS[selectedSubjectCode] || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(s => 
      s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)
    );
  }, [selectedSubjectCode, searchQuery]);

  // Counts
  const totalCount = currentStudents.length;
  const presentCount = useMemo(() => {
    return currentStudents.filter(s => attendanceState[s.rollNo] === 'Present').length;
  }, [currentStudents, attendanceState]);
  const absentCount = useMemo(() => {
    return currentStudents.filter(s => attendanceState[s.rollNo] === 'Absent').length;
  }, [currentStudents, attendanceState]);
  const lateCount = useMemo(() => {
    return currentStudents.filter(s => attendanceState[s.rollNo] === 'Late').length;
  }, [currentStudents, attendanceState]);

  const handleMarkAll = (status) => {
    const updated = { ...attendanceState };
    currentStudents.forEach(s => {
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

  const handleSaveAttendance = (e) => {
    e.preventDefault();
    const currentSub = SUBJECTS[selectedSubjectCode];
    const newRecord = {
      id: `ATT-${Date.now()}`,
      date: selectedDate,
      subjectCode: selectedSubjectCode,
      subjectName: currentSub ? currentSub.name : selectedSubjectCode,
      sessionSlot: sessionSlot,
      presentCount: presentCount + lateCount,
      absentCount: absentCount,
      totalCount: totalCount
    };

    setHistoryList(prev => [newRecord, ...prev]);
    setSavedSuccessMsg(`Attendance for ${selectedSubjectCode} on ${selectedDate} (${sessionSlot}) submitted successfully!`);
    setTimeout(() => setSavedSuccessMsg(''), 5000);
  };

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-6xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Attendance Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Mark daily class attendance or view past submitted logs
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
            onClick={() => setActiveTab('history')}
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

      {savedSuccessMsg && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {activeTab === 'mark' ? (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Subject Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Subject</label>
                <select
                  value={selectedSubjectCode}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  {mySubjects.map(sub => (
                    <option key={sub.code} value={sub.code}>
                      {sub.code} – {sub.name} (Year {sub.year}, Sem {sub.semester})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Session Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
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
                  {currentStudents.map((student, idx) => {
                    const status = attendanceState[student.rollNo] || 'Present';
                    return (
                      <tr key={student.rollNo} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3 text-slate-400 font-medium">{idx + 1}</td>
                        <td className="px-5 py-3 font-bold text-slate-700">{student.rollNo}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900">{student.name}</td>
                        <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">{student.phone}</td>
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
                onClick={handleSaveAttendance}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                <Save className="w-4 h-4" />
                Submit Session Attendance
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Attendance History View */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm">Past Submitted Attendance Sessions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Slot / Time</th>
                  <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                  <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Present</th>
                  <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Absent</th>
                  <th className="text-center px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {historyList.map(record => {
                  const pct = Math.round((record.presentCount / record.totalCount) * 100);
                  return (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-bold text-slate-800">{record.date}</td>
                      <td className="px-5 py-3 text-slate-600">{record.sessionSlot}</td>
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        <span className="font-extrabold text-blue-600 mr-1.5">[{record.subjectCode}]</span>
                        {record.subjectName}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">
                          {record.presentCount}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold">
                          {record.absentCount}
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
        </div>
      )}
    </div>
  );
}
