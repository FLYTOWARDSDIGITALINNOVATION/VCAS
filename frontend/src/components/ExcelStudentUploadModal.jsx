import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
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

  // Generate and download sample Excel template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Register Number': '22UCS001',
        'Name': 'ARUN KUMAR S',
        'Roll Number': '22CS01',
        'Admission Number': 'ADM2022001',
        'Department': 'Computer Science',
        'Course': 'B.Sc Computer Science',
        'Semester': '1st Sem',
        'Year': '1st Year',
        'Batch': '2022-2026',
        'Academic Year': '2025-2026',
        'Section': 'A',
        'Gender': 'Male',
        'Date of Birth': '2004-05-14',
        'Blood Group': 'O+',
        'Mobile': '9876543210',
        'Email': 'arun.kumar@gmail.com',
        'Father Name': 'SUNDARAM M',
        'Mother Name': 'LAKSHMI S',
        'Parent Mobile': '9876501234',
        'Father Occupation': 'Business',
        'Address': '12/4 North Car Street',
        'City': 'Tirunelveli',
        'State': 'Tamil Nadu',
        'Pincode': '627001',
        'Community': 'BC',
        'Religion': 'Hindu',
        'Nationality': 'Indian',
        '10th Marks': '450/500',
        '10th %': '90%',
        '12th Marks': '540/600',
        '12th %': '90%',
        'Aadhaar Number': '1234 5678 9012',
        'Fee Status': 'Paid'
      },
      {
        'Register Number': '22UCS002',
        'Name': 'PRIYA DHARSHINI R',
        'Roll Number': '22CS02',
        'Admission Number': 'ADM2022002',
        'Department': 'Computer Science',
        'Course': 'B.Sc Computer Science',
        'Semester': '1st Sem',
        'Year': '1st Year',
        'Batch': '2022-2026',
        'Academic Year': '2025-2026',
        'Section': 'A',
        'Gender': 'Female',
        'Date of Birth': '2004-08-22',
        'Blood Group': 'B+',
        'Mobile': '9876543211',
        'Email': 'priya.r@gmail.com',
        'Father Name': 'RAMESH K',
        'Mother Name': 'KAVITHA R',
        'Parent Mobile': '9876501235',
        'Father Occupation': 'Agriculture',
        'Address': '45 South Bazaar Street',
        'City': 'Vellalankulam',
        'State': 'Tamil Nadu',
        'Pincode': '627002',
        'Community': 'MBC',
        'Religion': 'Hindu',
        'Nationality': 'Indian',
        '10th Marks': '465/500',
        '10th %': '93%',
        '12th Marks': '555/600',
        '12th %': '92.5%',
        'Aadhaar Number': '9876 5432 1098',
        'Fee Status': 'Pending'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Auto-fit column widths
    const colWidths = Object.keys(templateData[0]).map(key => ({
      wch: Math.max(key.length + 3, 16)
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students_Template');
    XLSX.writeFile(workbook, 'VCAS_Student_Bulk_Upload_Template.xlsx');
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

  const processSelectedFile = (selectedFile) => {
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

        if (!json || json.length === 0) {
          setErrorMessage('The selected file appears to be empty or has no data rows.');
          setParsedRows([]);
          setPreviewRows([]);
          setIsParsing(false);
          return;
        }

        const headers = Object.keys(json[0] || {});
        setColumnHeaders(headers);
        setParsedRows(json);
        setPreviewRows(json.slice(0, 8)); // preview first 8 rows
        setIsParsing(false);
      } catch (err) {
        console.error('Error reading Excel file:', err);
        setErrorMessage('Failed to parse Excel file: ' + err.message);
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
                      The database has been updated with the student records from your Excel file.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Total Rows</p>
                    <p className="text-xl font-black text-slate-800 mt-1">{uploadResult.totalRows || 0}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center">
                    <p className="text-[11px] font-bold text-emerald-600 uppercase">Newly Added</p>
                    <p className="text-xl font-black text-emerald-600 mt-1">{uploadResult.createdCount || 0}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-blue-200 text-center">
                    <p className="text-[11px] font-bold text-blue-600 uppercase">Updated</p>
                    <p className="text-xl font-black text-blue-600 mt-1">{uploadResult.updatedCount || 0}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-amber-200 text-center">
                    <p className="text-[11px] font-bold text-amber-600 uppercase">Errors / Skipped</p>
                    <p className="text-xl font-black text-amber-600 mt-1">{(uploadResult.errorsCount || 0) + (uploadResult.skippedCount || 0)}</p>
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
                          Excel Data Preview (First {previewRows.length} of {parsedRows.length} rows)
                        </h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {parsedRows.length} Total Students
                      </span>
                    </div>

                    <div className="max-h-56 overflow-auto">
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
                            const name = row.Name || row['Student Name'] || row.name || row.fullName || '—';
                            const reg = row['Register Number'] || row.RegNo || row.regNo || row['Reg No'] || 'Auto-gen';
                            const roll = row['Roll Number'] || row.RollNo || row.rollNo || row['Roll No'] || '—';
                            const dept = overrideDept || row.Department || row.department || row.Dept || 'General';
                            const gender = row.Gender || row.gender || 'Male';
                            const dob = row['Date of Birth'] || row.DOB || row.dob || '—';
                            const mobile = row.Mobile || row.Phone || row.phone || row.mobile || '—';

                            return (
                              <tr key={idx} className="hover:bg-slate-50/80">
                                <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                                <td className="py-2 px-3 font-bold text-slate-900">{String(name)}</td>
                                <td className="py-2 px-3 font-mono text-emerald-700">{String(reg)}</td>
                                <td className="py-2 px-3">{String(roll)}</td>
                                <td className="py-2 px-3">{String(dept)}</td>
                                <td className="py-2 px-3">{String(gender)}</td>
                                <td className="py-2 px-3">{String(dob)}</td>
                                <td className="py-2 px-3">{String(mobile)}</td>
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
