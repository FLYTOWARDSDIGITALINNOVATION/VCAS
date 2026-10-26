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
  CheckSquare,
  Clock
} from 'lucide-react';
import ModalPortal from '../ModalPortal';
import { API_BASE } from '../../apiConfig';

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

export default function ExcelAttendanceUploadModal({
  isOpen,
  onClose,
  staffUser = {},
  classes = [],
  currentClassCode = '',
  currentClassName = '',
  currentRoster = [],
  onSuccess
}) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Configuration settings
  const [targetClassCode, setTargetClassCode] = useState(() => currentClassCode || (classes[0]?.code || ''));
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [targetSlot, setTargetSlot] = useState('8:30 AM');
  const [targetTopic, setTargetTopic] = useState('');

  // Parsed rows & preview
  const [parsedRows, setParsedRows] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Generate Sample Attendance Template
  const handleDownloadSample = async () => {
    try {
      const XLSX = await getSheetJS();
      if (!XLSX) {
        alert('SheetJS failed to load. Please check internet connection.');
        return;
      }

      let sampleData = [];
      const todayStr = new Date().toISOString().split('T')[0];

      if (currentRoster && currentRoster.length > 0) {
        sampleData = currentRoster.map((st) => ({
          'Roll No': st.rollNo || st.regNo || '',
          'Student Name': st.name || '',
          'Date': todayStr,
          'Status': 'Present',
          'Slot': targetSlot || '8:30 AM',
          'Remarks': ''
        }));
      } else {
        sampleData = [
          { 'Roll No': '22CS001', 'Student Name': 'AARAV SHARMA', 'Date': todayStr, 'Status': 'Present', 'Slot': '8:30 AM', 'Remarks': 'Attended' },
          { 'Roll No': '22CS002', 'Student Name': 'ANANYA IYER', 'Date': todayStr, 'Status': 'Present', 'Slot': '8:30 AM', 'Remarks': 'Attended' },
          { 'Roll No': '22CS003', 'Student Name': 'BHAVESH PATEL', 'Date': todayStr, 'Status': 'Absent', 'Slot': '8:30 AM', 'Remarks': 'Medical Leave' },
          { 'Roll No': '22CS004', 'Student Name': 'DIVYA NAIR', 'Date': todayStr, 'Status': 'Late', 'Slot': '8:30 AM', 'Remarks': 'Joined at 8:45' }
        ];
      }

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

      ws['!cols'] = [
        { wch: 15 }, // Roll No
        { wch: 25 }, // Student Name
        { wch: 14 }, // Date
        { wch: 12 }, // Status
        { wch: 12 }, // Slot
        { wch: 20 }  // Remarks
      ];

      XLSX.writeFile(wb, `Attendance_Sample_Template_${targetClassCode || 'Class'}.xlsx`);
    } catch (err) {
      console.error('Error generating attendance template:', err);
      alert('Failed to generate template: ' + err.message);
    }
  };

  // Handle file selection and parsing
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
        throw new Error('The uploaded spreadsheet contains no records.');
      }

      const parsed = rawRows.map((row, idx) => {
        const rollNo = getRowValue(row, 'rollno', 'regno', 'registerno', 'studentid', 'roll', 'reg', 'id');
        const name = getRowValue(row, 'studentname', 'name', 'candidatename', 'fullname', 'student');
        const rawStatus = getRowValue(row, 'status', 'attendance', 'att', 'presence', 'mark');
        const rawDate = getRowValue(row, 'date', 'sessiondate', 'attdate');
        const rawSlot = getRowValue(row, 'slot', 'time', 'period', 'session');
        const remarks = getRowValue(row, 'remarks', 'remark', 'note', 'reason');

        // Status normalization
        let status = 'Present';
        const sNorm = String(rawStatus || '').toLowerCase().trim();
        if (sNorm === 'absent' || sNorm === 'a' || sNorm === 'abs') {
          status = 'Absent';
        } else if (sNorm === 'late' || sNorm === 'l') {
          status = 'Late';
        } else if (sNorm === 'present' || sNorm === 'p' || sNorm === 'od' || sNorm === 'on duty' || sNorm === '1') {
          status = 'Present';
        }

        return {
          id: idx + 1,
          rollNo: String(rollNo).trim().toUpperCase(),
          name: String(name).trim() || 'Student',
          status,
          date: String(rawDate).trim() || targetDate,
          slot: String(rawSlot).trim() || targetSlot,
          remarks: String(remarks).trim(),
          isValid: Boolean(rollNo)
        };
      }).filter(r => r.rollNo || r.name);

      if (parsed.length === 0) {
        throw new Error('No valid attendance student records found in this file.');
      }

      setParsedRows(parsed);
    } catch (err) {
      console.error('Attendance parse error:', err);
      setErrorMessage(err.message || 'Error occurred while reading attendance spreadsheet.');
      setFile(null);
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  // Upload and Save Attendance
  const handleUploadAttendance = async () => {
    if (!parsedRows.length) {
      setErrorMessage('No attendance records to upload.');
      return;
    }
    if (!targetClassCode) {
      setErrorMessage('Please select a Target Class Code.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(30);
    setErrorMessage('');

    try {
      const validRows = parsedRows.filter(r => r.isValid && r.rollNo);
      setUploadProgress(60);

      const res = await fetch(`${API_BASE}/attendance/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultClassCode: targetClassCode.trim().toUpperCase(),
          defaultStaffId: staffUser?.staffId || 'EMP001',
          defaultStaffName: staffUser?.name || 'Faculty Member',
          defaultDate: targetDate,
          defaultSlot: targetSlot,
          rows: validRows.map(r => ({
            rollNo: r.rollNo,
            name: r.name,
            status: r.status,
            date: r.date || targetDate,
            slot: r.slot || targetSlot,
            remarks: r.remarks,
            classCode: targetClassCode
          }))
        })
      });

      const data = await res.json();
      setUploadProgress(100);

      if (res.ok && data.success) {
        setUploadResult({
          importedCount: validRows.length,
          savedSessions: data.savedSessions || 1,
          message: data.message || `Successfully imported attendance for ${validRows.length} students!`
        });
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data.message || 'Failed to save bulk attendance.');
      }
    } catch (err) {
      console.error('Attendance upload error:', err);
      setErrorMessage(err.message || 'Network error occurred while uploading attendance.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileName('');
    setFileSize('');
    setParsedRows([]);
    setUploadResult(null);
    setErrorMessage('');
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const presentCount = parsedRows.filter(r => r.status === 'Present').length;
  const absentCount = parsedRows.filter(r => r.status === 'Absent').length;
  const lateCount = parsedRows.filter(r => r.status === 'Late').length;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-teal-700 via-emerald-700 to-slate-900 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight">Bulk Upload Student Attendance via Excel</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-400/25 text-emerald-200 border border-emerald-400/30">
                    Staff Portal
                  </span>
                </div>
                <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                  Directly upload class attendance spreadsheet (.xlsx, .xls, .csv) with Present, Absent, and Late status
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
                  <p className="font-bold">Import Warning</p>
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
                    Attendance Uploaded Successfully!
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {uploadResult.message} Saved {uploadResult.importedCount} student attendance marks across {uploadResult.savedSessions} session(s).
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

            {/* Target Class & Date Setup */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Session & Class Target Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-colors cursor-pointer border border-teal-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Sample Template (.xlsx)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 mb-1">Target Class *</label>
                  <select
                    value={targetClassCode}
                    onChange={(e) => setTargetClassCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    {classes && classes.length > 0 ? (
                      classes.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.code} - {c.name}
                        </option>
                      ))
                    ) : (
                      <option value={currentClassCode || 'CS301'}>
                        {currentClassCode || 'CS301'} - {currentClassName || 'Class'}
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 mb-1">Session Date *</label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 mb-1">Session Slot</label>
                  <select
                    value={targetSlot}
                    onChange={(e) => setTargetSlot(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="8:30 AM">8:30 AM (Period 1)</option>
                    <option value="9:30 AM">9:30 AM (Period 2)</option>
                    <option value="10:30 AM">10:30 AM (Period 3)</option>
                    <option value="11:30 AM">11:30 AM (Period 4)</option>
                    <option value="1:30 PM">1:30 PM (Period 5)</option>
                    <option value="2:30 PM">2:30 PM (Period 6)</option>
                    <option value="3:30 PM">3:30 PM (Period 7)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dropzone */}
            {!file ? (
              <div className="border-2 border-dashed border-teal-200 hover:border-teal-500 bg-white rounded-3xl p-8 text-center transition-all cursor-pointer group shadow-2xs">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-attendance-file-input"
                />
                <label htmlFor="excel-attendance-file-input" className="cursor-pointer flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner mb-3">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800">
                    Upload Attendance Spreadsheet (.xlsx, .xls, .csv)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Columns like Roll No, Student Name, and Status (Present, Absent, Late) are automatically identified.
                  </p>
                  <span className="mt-3 px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-500/20">
                    Browse File on Device
                  </span>
                </label>
              </div>
            ) : (
              <div className="p-4 bg-white rounded-2xl border border-teal-200 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{fileName}</h4>
                    <p className="text-[11px] text-slate-400">{fileSize} • {parsedRows.length} attendance records found</p>
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

            {/* Attendance Stat Pills */}
            {parsedRows.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total</span>
                  <span className="text-base font-black text-slate-900">{parsedRows.length}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-600 block">Present</span>
                  <span className="text-base font-black text-emerald-700">{presentCount}</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-rose-600 block">Absent</span>
                  <span className="text-base font-black text-rose-700">{absentCount}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-amber-600 block">Late</span>
                  <span className="text-base font-black text-amber-700">{lateCount}</span>
                </div>
              </div>
            )}

            {/* Attendance Preview Table */}
            {parsedRows.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-teal-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Roster Preview ({parsedRows.length} Records)
                    </h4>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 text-[10px] font-extrabold uppercase sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Roll No</th>
                        <th className="py-2 px-3">Student Name</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Slot</th>
                        <th className="py-2 px-3 text-center">Status</th>
                        <th className="py-2 px-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {parsedRows.slice(0, 50).map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">{i + 1}</td>
                          <td className="py-2 px-3 font-extrabold text-slate-900 font-mono">{r.rollNo}</td>
                          <td className="py-2 px-3 font-bold text-slate-800">{r.name}</td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">{r.date}</td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">{r.slot}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              r.status === 'Present'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : r.status === 'Absent'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500 text-[11px] italic">{r.remarks || '-'}</td>
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
                <div className="flex justify-between text-xs font-extrabold text-teal-900">
                  <span>Saving Attendance Records...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-600 to-emerald-600 transition-all duration-300 rounded-full"
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
              onClick={handleUploadAttendance}
              disabled={!file || !parsedRows.length || isUploading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-black shadow-lg shadow-teal-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Attendance...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm & Save Attendance ({parsedRows.length})
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
}
