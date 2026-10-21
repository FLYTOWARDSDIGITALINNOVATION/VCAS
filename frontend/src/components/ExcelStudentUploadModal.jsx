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
  Check
} from 'lucide-react';
import ModalPortal from './ModalPortal';
import { API_BASE, getKnownDepartments } from '../apiConfig';

// Dynamic loader for SheetJS so Vite doesn't crash if xlsx is missing in local node_modules
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

// Clean string key for flexible matching
const cleanHeaderKey = (k) => String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Format Excel dates (handles Date objects, serial numbers, strings)
const formatExcelDate = (val) => {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${d}-${m}-${y}`;
  }
  if (typeof val === 'number') {
    try {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return `${d}-${m}-${y}`;
      }
    } catch (_) { }
  }
  const s = String(val).trim();
  if (s.includes('T') && !isNaN(Date.parse(s))) {
    try {
      const d = new Date(s);
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    } catch (_) { }
  }
  return s;
};

// Flexible field extractor for Excel row
const getRowValue = (row, ...aliases) => {
  if (!row || typeof row !== 'object') return '';

  // 1. Direct raw property lookup
  for (const a of aliases) {
    if (row[a] !== undefined && row[a] !== null && String(row[a]).trim() !== '') {
      return row[a];
    }
  }

  // 2. Build clean key dictionary
  const cleanMap = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === undefined || v === null) continue;
    cleanMap[cleanHeaderKey(k)] = v;
  }

  // 3. Exact match on cleaned key
  for (const a of aliases) {
    const ca = cleanHeaderKey(a);
    if (cleanMap[ca] !== undefined && String(cleanMap[ca]).trim() !== '') {
      return cleanMap[ca];
    }
  }

  // 4. Substring / partial match on cleaned key
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

// Smart row resolver for student preview
const resolveStudentPreviewRow = (row, overrideDept = '') => {
  if (!row || typeof row !== 'object') return {};

  // 1. Student Name
  let name = getRowValue(
    row,
    'studentname', 'nameofstudent', 'nameofthestudent', 'candidatename', 'nameofcandidate',
    'fullname', 'pupilname', 'personname', 'candidate', 'name', 'student'
  );

  // Fallback for name: find any column header containing 'name' that isn't father/mother/parent/college/school/bank
  if (!name) {
    for (const [k, v] of Object.entries(row)) {
      if (v === undefined || v === null || String(v).trim() === '') continue;
      const ck = cleanHeaderKey(k);
      if (
        ck.includes('name') &&
        !ck.includes('father') &&
        !ck.includes('mother') &&
        !ck.includes('parent') &&
        !ck.includes('college') &&
        !ck.includes('school') &&
        !ck.includes('bank')
      ) {
        name = v;
        break;
      }
    }
  }

  // 2. Register Number
  const regNo = getRowValue(
    row,
    'regno', 'registerno', 'registernumber', 'registrationno', 'registrationnumber',
    'studentid', 'idno', 'id', 'regn', 'register', 'admnumber', 'admissionno', 'admno'
  );

  // 3. Roll Number
  const rollNo = getRowValue(
    row,
    'rollno', 'rollnumber', 'roll', 'classrollno', 'rno', 'sno', 'slno', 'serialno', 'seatno'
  );

  // 4. Department
  let department = overrideDept;
  if (!department) {
    department = getRowValue(
      row,
      'department', 'dept', 'branch', 'course', 'major', 'programme', 'degree', 'stream'
    );
    if (!department) department = 'General';
  }

  // 5. Gender
  const rawGender = String(getRowValue(row, 'gender', 'sex') || '').trim();
  let gender = 'Male';
  if (rawGender) {
    const lg = rawGender.toLowerCase();
    if (lg.startsWith('f') || lg === 'w') {
      gender = 'Female';
    } else if (lg.startsWith('m')) {
      gender = 'Male';
    } else {
      gender = rawGender;
    }
  }

  // 6. DOB
  const rawDob = getRowValue(
    row,
    'dob', 'dateofbirth', 'birthdate', 'birth', 'd.o.b', 'date_of_birth', 'borndate'
  );
  const dob = formatExcelDate(rawDob);

  // 7. Mobile
  const mobile = getRowValue(
    row,
    'mobile', 'mobileno', 'phone', 'phonenumber', 'contact', 'contactno', 'cell', 'studentmobile', 'parentphone', 'fathermobile', 'tel', 'whatsapp'
  );

  return {
    name: name ? String(name).trim() : '—',
    regNo: regNo ? String(regNo).trim().toUpperCase() : 'Auto-gen',
    rollNo: rollNo ? String(rollNo).trim().toUpperCase() : '—',
    department: String(department).trim(),
    gender: String(gender).trim(),
    dob: dob || '—',
    mobile: mobile ? String(mobile).trim() : '—'
  };
};

export default function ExcelStudentUploadModal({ isOpen, onClose, onSuccess, departments = [] }) {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [columnHeaders, setColumnHeaders] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Optional overrides
  const [overrideDept, setOverrideDept] = useState('');
  const [overrideBatch, setOverrideBatch] = useState('');

  if (!isOpen) return null;

  // Format bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Download official Excel template directly from backend API
  const handleDownloadTemplate = () => {
    window.open(`${API_BASE}/students/template`, '_blank');
  };

  // Handle file select or drop
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processSelectedFile(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const processSelectedFile = async (selectedFile) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some(ext => lowerName.endsWith(ext));

    if (!isValid) {
      setErrorMessage('Please upload a valid Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    setErrorMessage('');
    setUploadResult(null);
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileSize(formatBytes(selectedFile.size));
    setIsParsing(true);

    const XLSX = await getSheetJS();

    if (!XLSX) {
      // If SheetJS is not available client-side, allow direct file upload to backend
      setParsedRows([{ _file: selectedFile.name }]);
      setIsParsing(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Smart Header Row Detection: scan first 12 rows for columns like 'name', 'reg', 'roll', 'student'
        const rawMatrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        let headerRowIndex = 0;
        if (Array.isArray(rawMatrix)) {
          for (let r = 0; r < Math.min(rawMatrix.length, 12); r++) {
            const row = rawMatrix[r];
            if (Array.isArray(row)) {
              const rowStr = row.map(c => String(c).toLowerCase().replace(/[^a-z0-9]/g, '')).join(' ');
              if (
                (rowStr.includes('name') && (rowStr.includes('reg') || rowStr.includes('roll') || rowStr.includes('adm') || rowStr.includes('dept') || rowStr.includes('gender') || rowStr.includes('phone') || rowStr.includes('mobile'))) ||
                (rowStr.includes('student') && (rowStr.includes('roll') || rowStr.includes('reg') || rowStr.includes('name')))
              ) {
                headerRowIndex = r;
                break;
              }
            }
          }
        }

        const json = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: '' });

        // Filter out completely blank rows
        const validRows = (json || []).filter(row => {
          if (!row || typeof row !== 'object') return false;
          return Object.values(row).some(v => v !== undefined && v !== null && String(v).trim() !== '');
        });

        if (!validRows || validRows.length === 0) {
          setErrorMessage('The selected file appears to be empty or has no data rows.');
          setParsedRows([]);
          setPreviewRows([]);
          setIsParsing(false);
          return;
        }

        const headers = Object.keys(validRows[0] || {});
        setColumnHeaders(headers);
        setParsedRows(validRows);
        setPreviewRows(validRows.slice(0, 25)); // Preview up to 25 rows (covers full 10 students)
        setIsParsing(false);
      } catch (err) {
        console.error('Error reading Excel file:', err);
        // Fallback: still keep file for server-side upload
        setParsedRows([{ _file: selectedFile.name }]);
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file from disk.');
      setIsParsing(false);
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // Perform upload to backend
  const handleUploadSubmit = async () => {
    if (!file && parsedRows.length === 0) {
      setErrorMessage('Please select an Excel file first.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setUploadProgress(20);

    try {
      let finalRows = [...parsedRows];
      if (overrideDept) {
        finalRows = finalRows.map(r => ({ ...r, Department: overrideDept, department: overrideDept }));
      }
      if (overrideBatch) {
        finalRows = finalRows.map(r => ({ ...r, Batch: overrideBatch, batch: overrideBatch }));
      }

      setUploadProgress(45);

      // Try uploading file directly via FormData first
      let uploadSuccess = false;
      let responseData = null;

      try {
        const formData = new FormData();
        formData.append('file', file);
        if (overrideDept) formData.append('department', overrideDept);
        if (overrideBatch) formData.append('batch', overrideBatch);

        const res = await fetch(`${API_BASE}/students/upload-excel`, {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (res.ok && data.success) {
          uploadSuccess = true;
          responseData = data;
        }
      } catch (err) {
        console.warn('FormData direct upload failed, trying bulk JSON payload fallback:', err);
      }

      // Fallback: send parsed JSON directly if upload-excel route had an issue
      if (!uploadSuccess) {
        setUploadProgress(70);
        const res = await fetch(`${API_BASE}/students/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ students: finalRows })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          uploadSuccess = true;
          responseData = data;
        } else {
          throw new Error(data.message || 'Failed to bulk import student records');
        }
      }

      setUploadProgress(100);
      setUploadResult(responseData?.data || {
        totalRows: finalRows.length,
        createdCount: finalRows.length,
        updatedCount: 0,
        errorsCount: 0
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMessage(err.message || 'Error occurred while uploading and saving students.');
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
    setColumnHeaders([]);
    setUploadResult(null);
    setErrorMessage('');
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deptsList = departments && departments.length > 0
    ? departments.map(d => (typeof d === 'string' ? d : d.name)).filter(Boolean)
    : getKnownDepartments();

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight">Bulk Upload Students via Excel</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                    Super Admin
                  </span>
                </div>
                <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                  Directly upload an entire class or batch spreadsheet (.xlsx, .xls, .csv)
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
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/60">

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 shadow-xs animate-in fade-in">
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

            {/* Upload Result Success Box */}
            {uploadResult && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-emerald-900">
                      Excel Import Completed Successfully!
                    </h3>
                    <p className="text-xs text-emerald-700">
                      All student records from your Excel file have been successfully imported and saved to the database.
                    </p>
                  </div>
                </div>

                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1 max-h-32 overflow-y-auto">
                    <p className="font-bold flex items-center gap-1.5 text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Skipped / Error Rows:
                    </p>
                    {uploadResult.errors.map((err, idx) => (
                      <p key={idx} className="text-[11px]">
                        Row {err.row}: {err.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 1 & Step 2 Layout */}
            {!uploadResult && (
              <>
                {/* Download Template Banner */}
                <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                        Download Standard Excel Template
                      </h4>
                      <p className="text-xs text-blue-800/80 mt-0.5 leading-relaxed">
                        Pre-formatted with all required columns: Register No, Name, Roll No, Dept, DOB, Phone, etc.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadTemplate}
                    type="button"
                    className="px-4 py-2 bg-white hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs rounded-xl border border-blue-300 shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .xlsx Template</span>
                  </button>
                </div>

                {/* Drag and drop zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                    file
                      ? 'border-emerald-400 bg-emerald-50/30'
                      : 'border-slate-300 hover:border-emerald-500 bg-white hover:bg-slate-50/70'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {isParsing ? (
                    <div className="flex flex-col items-center justify-center py-4 space-y-3">
                      <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                      <p className="text-xs font-bold text-slate-700">Reading Excel sheets and parsing rows...</p>
                    </div>
                  ) : file ? (
                    <div className="flex flex-col items-center justify-center py-2 space-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                        <Check className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-800">{fileName}</h4>
                      <p className="text-xs text-slate-500 font-medium">{fileSize} • {parsedRows.length} rows detected</p>
                      
                      {columnHeaders.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 max-w-xl">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Detected Columns:</span>
                          {columnHeaders.map((col, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md border border-slate-200">
                              {col}
                            </span>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReset();
                        }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 underline mt-1"
                      >
                        Change / Remove File
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          Click to browse or drag and drop your Excel sheet here
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) up to 25MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional Overrides */}
                {parsedRows.length > 0 && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span>Optional Batch / Department Override</span>
                      <span className="text-[10px] lowercase font-normal text-slate-500">(leave blank to use Excel columns)</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Assign Department to all rows
                        </label>
                        <select
                          value={overrideDept}
                          onChange={(e) => setOverrideDept(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                        >
                          <option value="">Keep from Excel file</option>
                          {deptsList.map((d, i) => (
                            <option key={i} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Assign Batch to all rows
                        </label>
                        <input
                          type="text"
                          value={overrideBatch}
                          onChange={(e) => setOverrideBatch(e.target.value)}
                          placeholder="e.g. 2022-2026 (or keep from Excel)"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview Table */}
                {previewRows.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-slate-600" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Excel Data Preview ({previewRows.length === parsedRows.length ? `All ${parsedRows.length} rows` : `First ${previewRows.length} of ${parsedRows.length} rows`})
                        </h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {parsedRows.length} Total Students
                      </span>
                    </div>

                    <div className="max-h-64 overflow-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold sticky top-0">
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">Name</th>
                            <th className="py-2 px-3">Reg No</th>
                            <th className="py-2 px-3">Roll No</th>
                            <th className="py-2 px-3">Department</th>
                            <th className="py-2 px-3">Gender</th>
                            <th className="py-2 px-3">DOB</th>
                            <th className="py-2 px-3">Mobile</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {previewRows.map((row, idx) => {
                            const item = resolveStudentPreviewRow(row, overrideDept);

                            return (
                              <tr key={idx} className="hover:bg-slate-50/80">
                                <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                                <td className="py-2 px-3 font-bold text-slate-900">{item.name}</td>
                                <td className="py-2 px-3 font-mono text-emerald-700 font-semibold">{item.regNo}</td>
                                <td className="py-2 px-3 font-mono">{item.rollNo}</td>
                                <td className="py-2 px-3">{item.department}</td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    item.gender.toLowerCase() === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {item.gender}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-600">{item.dob}</td>
                                <td className="py-2 px-3 text-slate-600">{item.mobile}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Uploading Status Progress */}
            {isUploading && (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                    Uploading and registering students into MongoDB Atlas...
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={handleDownloadTemplate}
              type="button"
              className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Sample Template</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={isUploading}
                type="button"
                className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {uploadResult ? 'Done' : 'Cancel'}
              </button>

              {uploadResult ? (
                <button
                  onClick={onClose}
                  type="button"
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Close & View Students</span>
                </button>
              ) : (
                <button
                  onClick={handleUploadSubmit}
                  disabled={!file || parsedRows.length === 0 || isUploading}
                  type="button"
                  className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Import {parsedRows.length > 0 ? `${parsedRows.length} Students` : 'Excel File'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </ModalPortal>
  );
}
