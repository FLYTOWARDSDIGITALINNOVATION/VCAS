import React, { useState, useEffect } from 'react';
import {
  Award,
  ShieldCheck,
  FileCheck,
  Upload,
  Download,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Maximize2
} from 'lucide-react';

const NET_SET_STATUS_OPTIONS = [
  'Qualified UGC-NET',
  'Qualified CSIR-NET',
  'Qualified SET / SLET',
  'Qualified NET & SET',
  'Qualified NET with JRF',
  'Appeared / Awaiting Results',
  'Not Applicable'
];

export default function StaffNetCertificateView({ staffUser = {} }) {
  const [netSetExamStatus, setNetSetExamStatus] = useState(staffUser?.netSetExamStatus || 'Not Applicable');
  const [netSetExamCertificate, setNetSetExamCertificate] = useState(staffUser?.netSetExamCertificate || '');
  const [netSetCertificateName, setNetSetCertificateName] = useState(staffUser?.netSetCertificateName || '');
  const [isUploading, setIsUploading] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'success' | 'error', text: '' }
  const [showFullPreview, setShowFullPreview] = useState(false);

  useEffect(() => {
    if (staffUser) {
      if (staffUser.netSetExamStatus) setNetSetExamStatus(staffUser.netSetExamStatus);
      if (staffUser.netSetExamCertificate) setNetSetExamCertificate(staffUser.netSetExamCertificate);
      if (staffUser.netSetCertificateName) setNetSetCertificateName(staffUser.netSetCertificateName);
    }
  }, [staffUser]);

  const showNotification = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleCertificateUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png|webp)$/i)) {
      showNotification('error', 'Please upload a valid document or image (PDF, PNG, JPG, or WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showNotification('error', 'Certificate file size exceeds 10MB limit. Please upload a smaller file.');
      return;
    }

    const fileName = file.name;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result;
      if (base64) {
        setNetSetExamCertificate(base64);
        setNetSetCertificateName(fileName);
        const autoStatus = netSetExamStatus === 'Not Applicable' ? 'Qualified UGC-NET' : netSetExamStatus;
        if (netSetExamStatus === 'Not Applicable') setNetSetExamStatus('Qualified UGC-NET');

        if (staffUser?.staffId) {
          setIsUploading(true);
          try {
            const res = await fetch(`http://localhost:5000/api/auth/staff/${staffUser.staffId}/profile`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                netSetExamCertificate: base64,
                netSetCertificateName: fileName,
                netSetExamStatus: autoStatus
              })
            });
            const data = await res.json();
            if (res.ok && data.success) {
              const stored = JSON.parse(sessionStorage.getItem('vcas_user') || '{}');
              sessionStorage.setItem('vcas_user', JSON.stringify({
                ...stored,
                netSetExamCertificate: base64,
                netSetCertificateName: fileName,
                netSetExamStatus: autoStatus
              }));
              showNotification('success', 'NET / SET exam certificate uploaded and saved to your profile successfully!');
            } else {
              showNotification('error', data.message || 'Failed to save certificate to server.');
            }
          } catch (err) {
            console.error('Error saving certificate:', err);
            showNotification('error', 'Unable to connect to server.');
          } finally {
            setIsUploading(false);
          }
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStatusChange = async (newStatus) => {
    setNetSetExamStatus(newStatus);
    if (staffUser?.staffId) {
      try {
        await fetch(`http://localhost:5000/api/auth/staff/${staffUser.staffId}/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ netSetExamStatus: newStatus })
        });
        const stored = JSON.parse(sessionStorage.getItem('vcas_user') || '{}');
        sessionStorage.setItem('vcas_user', JSON.stringify({ ...stored, netSetExamStatus: newStatus }));
        showNotification('success', `Status updated to "${newStatus}".`);
      } catch (err) {
        console.error('Error updating status:', err);
      }
    }
  };

  const handleRemoveCertificate = async () => {
    if (!window.confirm('Are you sure you want to remove your uploaded NET/SET exam certificate?')) return;
    setNetSetExamCertificate('');
    setNetSetCertificateName('');
    if (staffUser?.staffId) {
      setIsUploading(true);
      try {
        await fetch(`http://localhost:5000/api/auth/staff/${staffUser.staffId}/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            netSetExamCertificate: '',
            netSetCertificateName: ''
          })
        });
        const stored = JSON.parse(sessionStorage.getItem('vcas_user') || '{}');
        sessionStorage.setItem('vcas_user', JSON.stringify({
          ...stored,
          netSetExamCertificate: '',
          netSetCertificateName: ''
        }));
        showNotification('success', 'Certificate removed successfully.');
      } catch (err) {
        console.error('Error removing certificate:', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDownload = () => {
    if (!netSetExamCertificate) return;
    const a = document.createElement('a');
    a.href = netSetExamCertificate;
    a.download = netSetCertificateName || 'NET_SET_Exam_Certificate';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isPdf = netSetExamCertificate?.startsWith('data:application/pdf');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full font-sans animate-fadeIn">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0f1e3c] via-[#1a2e5a] to-[#253d74] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  NET / SET Exam Certificate
                </h1>
                <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {netSetExamStatus}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-200 mt-1">
                Faculty National &amp; State Eligibility Test Qualification Verification &amp; Document Management
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 backdrop-blur-sm self-start sm:self-auto">
            <span className="text-[10px] text-blue-300 font-bold block uppercase tracking-wider">Faculty Member</span>
            <span className="text-sm font-extrabold text-white">{staffUser?.name || 'Faculty Member'}</span>
            <span className="text-xs text-blue-200 block font-mono">{staffUser?.staffId || 'EMP---'} · {staffUser?.department || 'Department'}</span>
          </div>
        </div>
      </div>

      {/* 2. Notification Message */}
      {msg && (
        <div className={`flex items-center gap-2.5 p-4 rounded-2xl text-xs font-bold border transition-all ${
          msg.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* 3. Status Configuration & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h3>Qualification Status</h3>
          </div>
          <p className="text-xs text-slate-500">
            Select your eligibility exam qualification status as accredited by UGC, CSIR, or State SET Agency.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Exam Status</label>
            <select
              value={netSetExamStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs cursor-pointer"
            >
              {NET_SET_STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <p><strong>Note:</strong> Having qualified UGC-NET / CSIR-NET / SET is recognized for assistant professor eligibility under UGC regulations.</p>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                Certificate Document Status
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {netSetExamCertificate
                  ? 'Official certificate uploaded and saved in database'
                  : 'No certificate uploaded yet. Please upload your document below.'}
              </p>
            </div>

            {netSetExamCertificate && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowFullPreview(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Full Screen
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={handleRemoveCertificate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Upload trigger button or active info */}
          <div className="flex items-center gap-4 flex-wrap">
            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 cursor-pointer transition-all">
              <Upload className="w-4 h-4" />
              <span>{netSetExamCertificate ? 'Replace Certificate File' : 'Upload NET / SET Certificate'}</span>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={handleCertificateUpload}
                className="hidden"
              />
            </label>
            <span className="text-[11px] text-slate-400">
              Accepted: PDF, PNG, JPG, WEBP (Max 10MB)
            </span>
            {isUploading && (
              <span className="text-xs font-bold text-indigo-600 animate-pulse flex items-center gap-1.5 ml-auto">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Saving to database...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Interactive Live Document Preview Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Certificate Document Live Preview</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {netSetCertificateName || (netSetExamCertificate ? 'Official NET/SET Qualification Certificate' : 'No document selected')}
              </p>
            </div>
          </div>

          {netSetExamCertificate && (
            <span className="text-[11px] font-extrabold px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
              {isPdf ? 'PDF Document' : 'Image File'}
            </span>
          )}
        </div>

        <div className="p-6">
          {netSetExamCertificate ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-900/5 p-4 flex flex-col items-center justify-center min-h-[500px]">
              {isPdf ? (
                <iframe
                  src={netSetExamCertificate}
                  title="NET/SET Certificate Preview"
                  className="w-full h-[650px] rounded-xl border border-slate-200 bg-white shadow-md"
                />
              ) : (
                <div className="max-w-3xl w-full flex justify-center py-4">
                  <img
                    src={netSetExamCertificate}
                    alt={netSetCertificateName || 'NET SET Certificate'}
                    className="max-h-[600px] w-auto max-w-full rounded-xl shadow-lg border border-slate-200 object-contain bg-white"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20 rounded-2xl p-12 text-center transition-all">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <Award className="w-8 h-8" />
              </div>
              <h4 className="text-base font-extrabold text-slate-800">No Certificate Uploaded Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                Upload your official UGC / CSIR NET or State SET qualification certificate to complete your faculty verification and academic credentials profile.
              </p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 cursor-pointer transition-all">
                <Upload className="w-4 h-4" />
                <span>Upload Certificate Document</span>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={handleCertificateUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* 5. Full Screen Preview Modal */}
      {showFullPreview && netSetExamCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scaleUp">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-amber-400" />
                <span className="font-extrabold text-sm">{netSetCertificateName || 'NET / SET Certificate'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowFullPreview(false)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-950 p-4 flex items-center justify-center overflow-auto">
              {isPdf ? (
                <iframe
                  src={netSetExamCertificate}
                  title="NET/SET Certificate Full Preview"
                  className="w-full h-full rounded-xl bg-white border-0"
                />
              ) : (
                <img
                  src={netSetExamCertificate}
                  alt={netSetCertificateName || 'NET SET Certificate'}
                  className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
