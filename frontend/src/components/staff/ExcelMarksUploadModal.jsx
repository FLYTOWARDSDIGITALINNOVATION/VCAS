import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Loader2,
  Users,
  Building2,
  Calendar,
  AlertCircle,
  Eye,
  Check,
  Award,
  BookOpen
} from 'lucide-react';
import ModalPortal from '../ModalPortal';
import { API_BASE, getKnownDepartments } from '../../apiConfig';

// Dynamic loader for SheetJS
const getSheetJS = () => {
  if (typeof window !== 'undefined' && window.XLSX) {
    return Promise.resolve(window.XLSX);
  }
  return new Promise((resolve) => {
    try {
      const script = document.createElement('script');
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
      script.async = true;
      script.onload = () => resolve(window.XLSX || null);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    } catch (_) {
      resolve(null);
    }
  });
};

const cleanHeaderKey = (k) => String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const getRowValue = (row, ...aliases) => {
  if (!row || typeof row !== 'object') return '';
  for (const a of aliases) {
    if (row[a] !== undefined && row[a] !== null && String(row[a]).trim() !== '') {
      return row[a];
    }
  }
  const cleanMap = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === undefined || v === null) continue;
    cleanMap[cleanHeaderKey(k)] = v;
  }
  for (const a of aliases) {
    const ca = cleanHeaderKey(a);
    if (cleanMap[ca] !== undefined && String(cleanMap[ca]).trim() !== '') {
      return cleanMap[ca];
    }
  }
  for (const a of aliases) {
    const ca = cleanHeaderKey(a);
    for (const [k, v] of Object.entries(cleanMap)) {
      if ((k.includes(ca) || ca.includes(k)) && String(v).trim() !== '') {
        return v;
      }
    }
  }
  return '';
};

export default function ExcelMarksUploadModal({
  isOpen,
  onClose,
  staffUser = {},
  currentSubjectCode = '',
  currentSubjectName = '',
  currentDepartment = '',
  currentSemester = 1,
  enrolledStudents = [],
  onSuccess
}) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Configuration
  const [targetSubjectCode, setTargetSubjectCode] = useState(() => currentSubjectCode || '');
  const [targetSubjectName, setTargetSubjectName] = useState(() => currentSubjectName || '');
  const [targetDepartment, setTargetDepartment] = useState(() => currentDepartment || staffUser?.department || 'Computer Science');
  const [targetSemester, setTargetSemester] = useState(() => currentSemester || 1);

  // Parsed data
  const [parsedRows, setParsedRows] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Generate and download Sample Excel Template
  const handleDownloadSample = async () => {
    try {
      const XLSX = await getSheetJS();
      if (!XLSX) {
        alert('SheetJS failed to load. Please check your internet connection.');
        return;
      }

      // Sample data rows
      let sampleData = [];
      if (enrolledStudents && enrolledStudents.length > 0) {
        sampleData = enrolledStudents.slice(0, 15).map((st, i) => ({
          'Roll No': st.rollNo || st.regNo || `22CS0${i + 1}`,
          'Student Name': st.name || `Student ${i + 1}`,
          'Internal 1': 22,
          'Internal 2': 23,
          'Model': 68,
          'Semester': 82,
          'Seminar': 9,
          'Project': 18,
          'ST 1': 18,
          'ST 2': 19,
          'ST 3': 17,
          'ST 4': 19,
          'Assignment 1': 5,
          'Assignment 2': 4,
          'Assignment 3': 5,
          'Assignment 4': 5,
          'Final CIA': 23
        }));
      } else {
        sampleData = [
          { 'Roll No': '22CS001', 'Student Name': 'AARAV SHARMA', 'Internal 1': 22, 'Internal 2': 23, 'Model': 68, 'Semester': 84, 'Seminar': 9, 'Project': 18, 'ST 1': 18, 'ST 2': 17, 'ST 3': 19, 'ST 4': 18, 'Assignment 1': 5, 'Assignment 2': 4, 'Assignment 3': 5, 'Assignment 4': 5, 'Final CIA': 23 },
          { 'Roll No': '22CS002', 'Student Name': 'ANANYA IYER', 'Internal 1': 24, 'Internal 2': 24, 'Model': 72, 'Semester': 90, 'Seminar': 10, 'Project': 19, 'ST 1': 20, 'ST 2': 19, 'ST 3': 20, 'ST 4': 19, 'Assignment 1': 5, 'Assignment 2': 5, 'Assignment 3': 5, 'Assignment 4': 5, 'Final CIA': 25 },
          { 'Roll No': '22CS003', 'Student Name': 'BHAVESH PATEL', 'Internal 1': 18, 'Internal 2': 20, 'Model': 55, 'Semester': 64, 'Seminar': 8, 'Project': 16, 'ST 1': 14, 'ST 2': 15, 'ST 3': 16, 'ST 4': 15, 'Assignment 1': 4, 'Assignment 2': 4, 'Assignment 3': 4, 'Assignment 4': 4, 'Final CIA': 19 },
          { 'Roll No': '22CS004', 'Student Name': 'DIVYA NAIR', 'Internal 1': 'AB', 'Internal 2': 21, 'Model': 60, 'Semester': 70, 'Seminar': 8, 'Project': 17, 'ST 1': 16, 'ST 2': 17, 'ST 3': 18, 'ST 4': 17, 'Assignment 1': 5, 'Assignment 2': 5, 'Assignment 3': 4, 'Assignment 4': 5, 'Final CIA': 20 }
        ];
      }

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Marks');

      // Set column widths
      ws['!cols'] = [
        { wch: 14 }, // Roll No
        { wch: 24 }, // Student Name
        { wch: 12 }, // IT 1
        { wch: 12 }, // IT 2
        { wch: 10 }, // Model
        { wch: 12 }, // Semester
        { wch: 10 }, // Seminar
        { wch: 10 }, // Project
        { wch: 8 },  // ST 1
        { wch: 8 },  // ST 2
        { wch: 8 },  // ST 3
        { wch: 8 },  // ST 4
        { wch: 14 }, // Assignment 1
        { wch: 14 }, // Assignment 2
        { wch: 14 }, // Assignment 3
        { wch: 14 }, // Assignment 4
        { wch: 12 }  // Final CIA
      ];

      XLSX.writeFile(wb, `Internal_Marks_Sample_Template_${targetSubjectCode || 'Subject'}.xlsx`);
    } catch (err) {
      console.error('Error generating template:', err);
      alert('Failed to generate template: ' + err.message);
    }
  };

  // Process File Selection
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setErrorMessage('');
    setUploadResult(null);

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some(ext => lowerName.endsWith(ext));
    if (!isValid) {
      setErrorMessage('Please upload a valid Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileSize((selectedFile.size / 1024).toFixed(1) + ' KB');
    setIsParsing(true);

    try {
      const XLSX = await getSheetJS();
      if (!XLSX) {
        throw new Error('Excel parser library failed to initialize.');
      }

      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rawRows || rawRows.length === 0) {
        throw new Error('The uploaded spreadsheet contains no data rows.');
      }

      // Parse and normalize rows
      const parsed = rawRows.map((row, idx) => {
        const rollNo = getRowValue(row, 'rollno', 'regno', 'registerno', 'studentid', 'roll', 'reg', 'id');
        const name = getRowValue(row, 'studentname', 'name', 'candidatename', 'fullname', 'student');

        const it1 = getRowValue(row, 'internal1', 'it1', 'cia1', 'internal 1', 'test 1');
        const it2 = getRowValue(row, 'internal2', 'it2', 'cia2', 'internal 2', 'test 2');
        const model = getRowValue(row, 'model', 'modelexam', 'model exam');
        const semester = getRowValue(row, 'semester', 'sem', 'semexam', 'semester exam');
        const seminar = getRowValue(row, 'seminar');
        const project = getRowValue(row, 'project');

        const st1 = getRowValue(row, 'st1', 'st 1', 'snap1', 'snap test 1');
        const st2 = getRowValue(row, 'st2', 'st 2', 'snap2', 'snap test 2');
        const st3 = getRowValue(row, 'st3', 'st 3', 'snap3', 'snap test 3');
        const st4 = getRowValue(row, 'st4', 'st 4', 'snap4', 'snap test 4');

        const assignment1 = getRowValue(row, 'assignment1', 'ass1', 'a1', 'assignment 1');
        const assignment2 = getRowValue(row, 'assignment2', 'ass2', 'a2', 'assignment 2');
        const assignment3 = getRowValue(row, 'assignment3', 'ass3', 'a3', 'assignment 3');
        const assignment4 = getRowValue(row, 'assignment4', 'ass4', 'a4', 'assignment 4');

        const consolidated = getRowValue(row, 'consolidated', 'finalcia', 'final', 'total', 'final cia');

        const cleanMark = (val) => {
          if (val === undefined || val === null || val === '') return null;
          const s = String(val).trim().toUpperCase();
          if (s === 'AB' || s === 'A' || s === 'ABSENT') return 'AB';
          const n = Number(val);
          return isNaN(n) ? null : n;
        };

        return {
          id: idx + 1,
          rollNo: String(rollNo).trim().toUpperCase(),
          name: String(name).trim(),
          it1: cleanMark(it1),
          it2: cleanMark(it2),
          cia1: cleanMark(it1),
          cia2: cleanMark(it2),
          model: cleanMark(model),
          semester: cleanMark(semester),
          seminar: cleanMark(seminar),
          project: cleanMark(project),
          st1: cleanMark(st1),
          st2: cleanMark(st2),
          st3: cleanMark(st3),
          st4: cleanMark(st4),
          assignment1: cleanMark(assignment1),
          assignment2: cleanMark(assignment2),
          assignment3: cleanMark(assignment3),
          assignment4: cleanMark(assignment4),
          consolidated: cleanMark(consolidated),
          isValid: Boolean(rollNo)
        };
      }).filter(r => r.rollNo || r.name);

      if (parsed.length === 0) {
        throw new Error('No valid student marks rows with Roll No or Name detected in file.');
      }

      setParsedRows(parsed);
      setPreviewRows(parsed);
    } catch (err) {
      console.error('Parsing error:', err);
      setErrorMessage(err.message || 'Error occurred while reading spreadsheet.');
      setFile(null);
      setParsedRows([]);
      setPreviewRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  // Submit and save marks to database
  const handleUploadMarks = async () => {
    if (!parsedRows.length) {
      setErrorMessage('No student marks to upload.');
      return;
    }
    if (!targetSubjectCode.trim()) {
      setErrorMessage('Subject Code is required to save marks.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setErrorMessage('');

    try {
      const validStudents = parsedRows.filter(r => r.isValid && r.rollNo);
      setUploadProgress(50);

      const res = await fetch(`${API_BASE}/internal-marks/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: staffUser?.staffId || staffUser?.employeeId || 'EMP001',
          staffName: staffUser?.name || 'Faculty Member',
          subjectCode: targetSubjectCode.trim().toUpperCase(),
          subjectName: targetSubjectName.trim() || targetSubjectCode.trim(),
          department: targetDepartment,
          semester: Number(targetSemester) || 1,
          academicYear: '2025-2026',
          students: validStudents
        })
      });

      const data = await res.json();
      setUploadProgress(100);

      if (res.ok && data.success) {
        setUploadResult({
          importedCount: validStudents.length,
          subjectCode: targetSubjectCode,
          message: data.message || `Successfully imported marks for ${validStudents.length} students!`
        });
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data.message || 'Failed to save internal marks.');
      }
    } catch (err) {
      console.error('Upload marks error:', err);
      setErrorMessage(err.message || 'Network error occurred while uploading marks.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileName('');
    setFileSize('');
    setParsedRows([]);
    setPreviewRows([]);
    setUploadResult(null);
    setErrorMessage('');
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const departmentsList = getKnownDepartments();

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-indigo-700 via-blue-700 to-slate-900 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight">Bulk Upload Student Marks via Excel</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-indigo-400/25 text-indigo-200 border border-indigo-400/30">
                    Staff Portal
                  </span>
                </div>
                <p className="text-xs text-indigo-100/90 font-medium mt-0.5">
                  Directly upload class marks spreadsheet for IT1, IT2, Model, Semester, and ST1-4
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isUploading}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/60">
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 shadow-xs">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Upload Warning</p>
                  <p className="mt-0.5 text-rose-700">{errorMessage}</p>
                </div>
                <button onClick={() => setErrorMessage('')} className="text-rose-500 hover:text-rose-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {uploadResult && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-extrabold text-sm text-emerald-900">
                    Marks Imported Successfully!
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {uploadResult.message} Subject: {uploadResult.subjectCode}.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-3.5 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Upload Another File
                </button>
              </div>
            )}

            {/* Step 1: Target Subject & Class Setup */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Target Subject & Class Setup</h3>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer border border-indigo-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Sample Template (.xlsx)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 mb-1">Subject Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., CS2001"
                    value={targetSubjectCode}
                    onChange={(e) => setTargetSubjectCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 mb-1">Subject Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Data Structures"
                    value={targetSubjectName}
                    onChange={(e) => setTargetSubjectName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 mb-1">Department</label>
                  <select
                    value={targetDepartment}
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {departmentsList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 mb-1">Semester</label>
                  <select
                    value={targetSemester}
                    onChange={(e) => setTargetSemester(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {[1, 2, 3, 4, 5, 6].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Upload Dropzone */}
            {!file ? (
              <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-white rounded-3xl p-8 text-center transition-all cursor-pointer group shadow-2xs">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-marks-file-input"
                />
                <label htmlFor="excel-marks-file-input" className="cursor-pointer flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner mb-3">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800">
                    Choose Excel / CSV File or Drag & Drop Here
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Supports Microsoft Excel (.xlsx, .xls) and CSV files. Standard columns like Roll No, Student Name, IT 1, IT 2, Model, Semester, and ST 1-4 are auto-detected.
                  </p>
                  <span className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20">
                    Browse File on Computer
                  </span>
                </label>
              </div>
            ) : (
              <div className="p-4 bg-white rounded-2xl border border-indigo-200 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{fileName}</h4>
                    <p className="text-[11px] text-slate-400">{fileSize} • {parsedRows.length} students detected</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Preview Table */}
            {previewRows.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Parsed Preview ({previewRows.length} Students)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Ready for Import
                    </span>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 text-[10px] font-extrabold uppercase sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Roll No</th>
                        <th className="py-2 px-3">Student Name</th>
                        <th className="py-2 px-3 text-center">IT 1</th>
                        <th className="py-2 px-3 text-center">IT 2</th>
                        <th className="py-2 px-3 text-center">Model</th>
                        <th className="py-2 px-3 text-center">Sem</th>
                        <th className="py-2 px-3 text-center">ST 1</th>
                        <th className="py-2 px-3 text-center">ST 2</th>
                        <th className="py-2 px-3 text-center">Assgn</th>
                        <th className="py-2 px-3 text-center">CIA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {previewRows.slice(0, 50).map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">{i + 1}</td>
                          <td className="py-2 px-3 font-extrabold text-slate-900 font-mono">{r.rollNo}</td>
                          <td className="py-2 px-3 font-bold text-slate-800">{r.name}</td>
                          <td className="py-2 px-3 text-center font-bold text-indigo-700">{r.it1 ?? '-'}</td>
                          <td className="py-2 px-3 text-center font-bold text-indigo-700">{r.it2 ?? '-'}</td>
                          <td className="py-2 px-3 text-center font-bold text-blue-700">{r.model ?? '-'}</td>
                          <td className="py-2 px-3 text-center font-bold text-purple-700">{r.semester ?? '-'}</td>
                          <td className="py-2 px-3 text-center">{r.st1 ?? '-'}</td>
                          <td className="py-2 px-3 text-center">{r.st2 ?? '-'}</td>
                          <td className="py-2 px-3 text-center">{r.assignment1 ?? '-'}</td>
                          <td className="py-2 px-3 text-center font-extrabold text-emerald-700">{r.consolidated ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-extrabold text-indigo-900">
                  <span>Uploading & Saving Marks...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-blue-600 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleUploadMarks}
              disabled={!file || !parsedRows.length || isUploading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-black shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Marks...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm & Import Marks ({parsedRows.length})
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
}
