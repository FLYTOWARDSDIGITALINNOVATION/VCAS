import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Save, 
  Lock, 
  Unlock, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  Award, 
  TrendingUp, 
  Users, 
  Percent, 
  Filter,
  Check,
  X,
  FileCheck2
} from 'lucide-react';
import { SUBJECTS, STUDENTS, ASSESSMENT_COMPONENTS, INITIAL_INTERNAL_MARKS } from './staffData';

export default function StaffInternalMarks({ staffUser }) {
  const mySubjects = useMemo(() => {
    return (staffUser.subjects || []).map(code => SUBJECTS[code]).filter(Boolean);
  }, [staffUser.subjects]);

  const [selectedSubjectCode, setSelectedSubjectCode] = useState(mySubjects[0]?.code || '');
  const [selectedComponentId, setSelectedComponentId] = useState('cia1');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Lock status per subject: { CS401: false, CS402: false }
  const [lockedSubjects, setLockedSubjects] = useState({
    CS401: false,
    CS402: false,
    EC401: false,
    EC402: false,
    MB401: false,
    MB402: false,
  });

  // Marks state: subjectCode -> rollNo -> { cia1, cia2, model, assignment, attendance, consolidated, remarks }
  const [marksData, setMarksData] = useState(() => INITIAL_INTERNAL_MARKS);

  const activeSubject = SUBJECTS[selectedSubjectCode] || mySubjects[0];
  const activeComponent = ASSESSMENT_COMPONENTS.find(c => c.id === selectedComponentId) || ASSESSMENT_COMPONENTS[0];
  const isLocked = !!lockedSubjects[selectedSubjectCode];

  // Students for the active subject
  const studentList = STUDENTS[selectedSubjectCode] || [];

  // Filtered students by search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentList;
    const q = searchQuery.toLowerCase();
    return studentList.filter(s => 
      s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)
    );
  }, [studentList, searchQuery]);

  // Handle Mark Change
  const handleMarkChange = (rollNo, val) => {
    if (isLocked) return;
    setErrorMessage('');

    // If input is empty
    if (val === '') {
      updateStudentMark(rollNo, '');
      return;
    }

    // If marked absent 'A' or 'a'
    if (val.toUpperCase() === 'A') {
      updateStudentMark(rollNo, 'A');
      return;
    }

    const numVal = Number(val);
    if (isNaN(numVal)) {
      setErrorMessage('Please enter a valid number or "A" for absent.');
      return;
    }

    if (numVal < 0 || numVal > activeComponent.maxMarks) {
      setErrorMessage(`Marks for ${activeComponent.name} must be between 0 and ${activeComponent.maxMarks}.`);
      return;
    }

    updateStudentMark(rollNo, numVal);
  };

  const updateStudentMark = (rollNo, value) => {
    setMarksData(prev => {
      const subjectMarks = { ...(prev[selectedSubjectCode] || {}) };
      const studentRecord = { ...(subjectMarks[rollNo] || {}) };
      studentRecord[selectedComponentId] = value;

      // Recalculate consolidated if numerical
      const c1 = studentRecord.cia1 === 'A' || studentRecord.cia1 === '' ? 0 : Number(studentRecord.cia1 || 0);
      const c2 = studentRecord.cia2 === 'A' || studentRecord.cia2 === '' ? 0 : Number(studentRecord.cia2 || 0);
      const mod = studentRecord.model === 'A' || studentRecord.model === '' ? 0 : Number(studentRecord.model || 0);
      const asg = Number(studentRecord.assignment || 8);
      const att = Number(studentRecord.attendance || 4);
      const calc = Math.round(((c1 + c2) / 100) * 10 + (mod / 75) * 5 + (asg / 2) + att);
      studentRecord.consolidated = Math.min(25, calc);

      subjectMarks[rollNo] = studentRecord;
      return {
        ...prev,
        [selectedSubjectCode]: subjectMarks
      };
    });
  };

  // Toggle Lock
  const handleToggleLock = () => {
    if (!isLocked) {
      const confirmLock = window.confirm(
        `Are you sure you want to freeze and submit internal marks for ${selectedSubjectCode}? Once locked, modifications are restricted.`
      );
      if (!confirmLock) return;
    }
    setLockedSubjects(prev => ({
      ...prev,
      [selectedSubjectCode]: !prev[selectedSubjectCode]
    }));
    setToastMessage(
      isLocked 
        ? `Marks for ${selectedSubjectCode} unlocked for editing.` 
        : `Marks for ${selectedSubjectCode} locked and submitted to CoE!`
    );
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Save Draft
  const handleSaveMarks = (e) => {
    e.preventDefault();
    setToastMessage(`Internal marks draft for ${selectedSubjectCode} saved successfully!`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const subjectMarks = marksData[selectedSubjectCode] || {};
    let csv = `Roll No,Student Name,CIA-1 (50),CIA-2 (50),Model Exam (75),Assignment (10),Attendance (5),Consolidated Total (25),Status\n`;

    studentList.forEach(s => {
      const m = subjectMarks[s.rollNo] || {};
      const status = m.consolidated >= 13 ? 'PASS' : 'FAIL';
      csv += `"${s.rollNo}","${s.name}",${m.cia1 ?? '-'},${m.cia2 ?? '-'},${m.model ?? '-'},${m.assignment ?? '-'},${m.attendance ?? '-'},${m.consolidated ?? '-'},${status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Internal_Marks_${selectedSubjectCode}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Statistics Computations
  const stats = useMemo(() => {
    const subjectMarks = marksData[selectedSubjectCode] || {};
    let totalScore = 0;
    let count = 0;
    let absentCount = 0;
    let passCount = 0;
    let highest = -1;
    let lowest = 999;

    studentList.forEach(s => {
      const m = subjectMarks[s.rollNo]?.[selectedComponentId];
      if (m === 'A') {
        absentCount++;
      } else if (typeof m === 'number' && !isNaN(m)) {
        totalScore += m;
        count++;
        if (m >= activeComponent.passingMarks) passCount++;
        if (m > highest) highest = m;
        if (m < lowest) lowest = m;
      }
    });

    const avg = count > 0 ? (totalScore / count).toFixed(1) : 0;
    const passPct = count > 0 ? Math.round((passCount / count) * 100) : 0;

    return {
      total: studentList.length,
      appeared: count,
      absent: absentCount,
      passCount,
      passPct,
      average: avg,
      highest: highest === -1 ? '-' : highest,
      lowest: lowest === 999 ? '-' : lowest
    };
  }, [marksData, selectedSubjectCode, selectedComponentId, studentList, activeComponent]);

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-slate-900">Internal Marks & Assessment</h2>
            {isLocked ? (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Lock className="w-3 h-3 text-emerald-600" /> Locked & Submitted to CoE
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <Unlock className="w-3 h-3 text-amber-600" /> Draft (Editable)
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage Continuous Internal Assessment (CIA) marks, evaluate students, and submit to the Examination Controller
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-xs transition-all"
            title="Download CSV Marksheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleToggleLock}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isLocked
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
            }`}
          >
            {isLocked ? (
              <>
                <Unlock className="w-3.5 h-3.5" /> Unlock Marks
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" /> Freeze & Submit to CoE
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {toastMessage && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold shadow-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Subject & Component Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Subject</label>
            <select
              value={selectedSubjectCode}
              onChange={(e) => setSelectedSubjectCode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              {mySubjects.map(sub => (
                <option key={sub.code} value={sub.code}>
                  {sub.code} – {sub.name} (Year {sub.year}, Sem {sub.semester})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Search Student</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Assessment Component Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider text-[10px]">
            Assessment Component
          </label>
          <div className="flex overflow-x-auto gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70">
            {ASSESSMENT_COMPONENTS.map(comp => {
              const isActive = selectedComponentId === comp.id;
              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => setSelectedComponentId(comp.id)}
                  className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {comp.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Class Analytics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Enrolled</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-slate-900">{stats.total}</span>
            <span className="text-[10px] text-slate-400">{stats.absent} Absent</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Class Average</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-blue-600">{stats.average}</span>
            <span className="text-[10px] text-slate-400">/ {activeComponent.maxMarks}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Pass Percentage</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-extrabold ${stats.passPct >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {stats.passPct}%
            </span>
            <span className="text-[10px] text-slate-400">({stats.passCount} passed)</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Highest Score</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-emerald-600">{stats.highest}</span>
            <span className="text-[10px] text-slate-400">/ {activeComponent.maxMarks}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Passing Mark</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-extrabold text-slate-700">{activeComponent.passingMarks}</span>
            <span className="text-[10px] text-slate-400">Min to pass</span>
          </div>
        </div>
      </div>

      {/* Marksheet Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">
              Student Marksheet: {activeComponent.name}
            </h3>
            <p className="text-[11px] text-slate-500">
              Maximum Marks: <span className="font-bold text-slate-700">{activeComponent.maxMarks}</span> | Passing: <span className="font-bold text-slate-700">{activeComponent.passingMarks}</span> | Enter <b>A</b> for Absent
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isLocked && (
              <button
                type="button"
                onClick={handleSaveMarks}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Save Marks Draft
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {selectedComponentId === 'consolidated' ? (
            /* Consolidated View of All Components */
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="text-left px-4 py-3 w-10">#</th>
                  <th className="text-left px-4 py-3">Roll No.</th>
                  <th className="text-left px-4 py-3">Student Name</th>
                  <th className="text-center px-3 py-3">CIA-1 (50)</th>
                  <th className="text-center px-3 py-3">CIA-2 (50)</th>
                  <th className="text-center px-3 py-3">Model (75)</th>
                  <th className="text-center px-3 py-3">Asgt (10)</th>
                  <th className="text-center px-3 py-3">Attd (5)</th>
                  <th className="text-center px-4 py-3 bg-blue-50/60 text-blue-800">Final (25)</th>
                  <th className="text-center px-4 py-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.map((stu, idx) => {
                  const m = marksData[selectedSubjectCode]?.[stu.rollNo] || {};
                  const isPassed = Number(m.consolidated || 0) >= 13;
                  return (
                    <tr key={stu.rollNo} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{stu.rollNo}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{stu.name}</td>
                      <td className="px-3 py-3 text-center text-slate-700 font-medium">{m.cia1 ?? '-'}</td>
                      <td className="px-3 py-3 text-center text-slate-700 font-medium">{m.cia2 ?? '-'}</td>
                      <td className="px-3 py-3 text-center text-slate-700 font-medium">{m.model ?? '-'}</td>
                      <td className="px-3 py-3 text-center text-slate-700 font-medium">{m.assignment ?? '-'}</td>
                      <td className="px-3 py-3 text-center text-slate-700 font-medium">{m.attendance ?? '-'}</td>
                      <td className="px-4 py-3 text-center font-extrabold text-blue-700 bg-blue-50/30 text-sm">
                        {m.consolidated ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPassed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {isPassed ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            /* Single Component Entry Table */
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="text-left px-5 py-3 w-12">#</th>
                  <th className="text-left px-5 py-3">Roll Number</th>
                  <th className="text-left px-5 py-3">Student Name</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Contact</th>
                  <th className="text-center px-5 py-3 w-44">
                    Marks ({activeComponent.maxMarks})
                  </th>
                  <th className="text-center px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Evaluation Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.map((stu, idx) => {
                  const m = marksData[selectedSubjectCode]?.[stu.rollNo] || {};
                  const currentMark = m[selectedComponentId];
                  const isAbsent = currentMark === 'A';
                  const isNumber = typeof currentMark === 'number';
                  const isPassed = isNumber && currentMark >= activeComponent.passingMarks;

                  return (
                    <tr key={stu.rollNo} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-5 py-3 font-bold text-slate-700">{stu.rollNo}</td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{stu.name}</td>
                      <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">{stu.phone}</td>
                      
                      {/* Mark Input Field */}
                      <td className="px-5 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            type="text"
                            disabled={isLocked}
                            value={currentMark !== undefined ? currentMark : ''}
                            onChange={(e) => handleMarkChange(stu.rollNo, e.target.value)}
                            className={`w-16 text-center py-1 px-2 rounded-xl text-xs font-extrabold border transition-all ${
                              isLocked
                                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                                : isAbsent
                                ? 'bg-amber-50 text-amber-700 border-amber-300 font-bold'
                                : isNumber && !isPassed
                                ? 'bg-rose-50 text-rose-700 border-rose-300'
                                : 'bg-slate-50 text-slate-900 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                            }`}
                            placeholder="0"
                          />
                          {!isLocked && (
                            <button
                              type="button"
                              onClick={() => handleMarkChange(stu.rollNo, isAbsent ? 0 : 'A')}
                              className={`p-1 rounded-lg text-[10px] font-bold border transition-all ${
                                isAbsent 
                                  ? 'bg-amber-100 text-amber-800 border-amber-300' 
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-transparent'
                              }`}
                              title={isAbsent ? 'Unmark Absent' : 'Mark Absent'}
                            >
                              ABS
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-3 text-center">
                        {isAbsent ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                            ABSENT
                          </span>
                        ) : isNumber ? (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isPassed 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {isPassed ? 'PASS' : 'FAIL'}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[10px]">-</span>
                        )}
                      </td>

                      {/* Remarks */}
                      <td className="px-5 py-3 text-slate-500 hidden md:table-cell text-[11px]">
                        {isAbsent ? (
                          <span className="text-amber-600 font-medium">Absent for examination</span>
                        ) : isNumber && currentMark >= activeComponent.maxMarks * 0.85 ? (
                          <span className="text-emerald-600 font-medium">Exemplary Performance</span>
                        ) : isNumber && !isPassed ? (
                          <span className="text-rose-600 font-medium">Requires Remedial Coaching</span>
                        ) : (
                          <span className="text-slate-400">Normal Progress</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Showing {filteredStudents.length} students enrolled in {activeSubject.name} ({activeSubject.code})
          </span>
          {!isLocked && (
            <button
              type="button"
              onClick={handleSaveMarks}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              Save All Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
