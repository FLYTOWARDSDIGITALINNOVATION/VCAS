import React, { useState, useEffect } from 'react';
import { API_BASE, BACKEND_URL } from '../apiConfig';
import { 
  Building, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export default function SettingsManagement() {
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State - strictly Institutional Identity & General Profile
  const [settings, setSettings] = useState({
    collegeName: '',
    collegeCode: '',
    accreditation: '',
    affiliation: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    officialEmail: '',
    helpdeskPhone: '',
    websiteUrl: '',
    currentAcademicYear: '',
    currentSemesterCycle: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/settings`);
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(prev => ({
          ...prev,
          collegeName: data.settings.collegeName || '',
          collegeCode: data.settings.collegeCode || '',
          accreditation: data.settings.accreditation || '',
          affiliation: data.settings.affiliation || '',
          address: data.settings.address || '',
          city: data.settings.city || '',
          state: data.settings.state || '',
          pincode: data.settings.pincode || '',
          officialEmail: data.settings.officialEmail || '',
          helpdeskPhone: data.settings.helpdeskPhone || '',
          websiteUrl: data.settings.websiteUrl || '',
          currentAcademicYear: data.settings.currentAcademicYear || '',
          currentSemesterCycle: data.settings.currentSemesterCycle || ''
        }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        if (data.settings) {
          setSettings(prev => ({
            ...prev,
            collegeName: data.settings.collegeName || '',
            collegeCode: data.settings.collegeCode || '',
            accreditation: data.settings.accreditation || '',
            affiliation: data.settings.affiliation || '',
            address: data.settings.address || '',
            city: data.settings.city || '',
            state: data.settings.state || '',
            pincode: data.settings.pincode || '',
            officialEmail: data.settings.officialEmail || '',
            helpdeskPhone: data.settings.helpdeskPhone || '',
            websiteUrl: data.settings.websiteUrl || '',
            currentAcademicYear: data.settings.currentAcademicYear || '',
            currentSemesterCycle: data.settings.currentSemesterCycle || ''
          }));
        }
        showToast(data.message || 'Institutional configuration saved successfully!');
      } else {
        showToast('Error saving settings: ' + (data.message || 'Server error'));
      }
    } catch (err) {
      console.error('Save error:', err);
      showToast('Network error while saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building className="w-6 h-6 text-blue-600" />
            Institutional Settings
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Configure official institutional identity, affiliation, and academic calendar metadata.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* INSTITUTIONAL PROFILE FORM */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Institutional Identity &amp; General Profile</h3>
          <p className="text-xs text-slate-400">Basic details displayed on official transcripts, receipts, and headers</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Institution Name</label>
            <input
              type="text"
              placeholder="e.g. Vivekanandha College of Arts and Sciences"
              value={settings.collegeName}
              onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Institution Code</label>
            <input
              type="text"
              placeholder="e.g. VCAS-2008"
              value={settings.collegeCode}
              onChange={(e) => setSettings({ ...settings, collegeCode: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Accreditation &amp; Grading</label>
            <input
              type="text"
              placeholder="e.g. NAAC A++ Grade (CGPA 3.82) | Affiliated with Manonmaniam Sundaranar University"
              value={settings.accreditation}
              onChange={(e) => setSettings({ ...settings, accreditation: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Affiliated University</label>
            <input
              type="text"
              placeholder="e.g. Manonmaniam Sundaranar University"
              value={settings.affiliation}
              onChange={(e) => setSettings({ ...settings, affiliation: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Campus Physical Address</label>
          <input
            type="text"
            placeholder="e.g. Main Campus, High Road"
            value={settings.address}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
            <input
              type="text"
              placeholder="e.g. Tirunelveli"
              value={settings.city}
              onChange={(e) => setSettings({ ...settings, city: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
            <input
              type="text"
              placeholder="e.g. Tamil Nadu"
              value={settings.state}
              onChange={(e) => setSettings({ ...settings, state: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
            <input
              type="text"
              placeholder="e.g. 627012"
              value={settings.pincode}
              onChange={(e) => setSettings({ ...settings, pincode: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Official Registry Email</label>
            <input
              type="email"
              placeholder="e.g. info@vcas.edu.in"
              value={settings.officialEmail}
              onChange={(e) => setSettings({ ...settings, officialEmail: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Central Helpdesk Phone</label>
            <input
              type="text"
              placeholder="e.g. +91 462 2500000"
              value={settings.helpdeskPhone}
              onChange={(e) => setSettings({ ...settings, helpdeskPhone: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Official Portal URL</label>
            <input
              type="text"
              placeholder="e.g. https://vcas.edu.in"
              value={settings.websiteUrl}
              onChange={(e) => setSettings({ ...settings, websiteUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Active Academic Year</label>
            <select
              value={settings.currentAcademicYear}
              onChange={(e) => setSettings({ ...settings, currentAcademicYear: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Select Academic Year --</option>
              <option value="2026-2027">2026-2027</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Active Semester Term</label>
            <select
              value={settings.currentSemesterCycle}
              onChange={(e) => setSettings({ ...settings, currentSemesterCycle: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Select Semester Term --</option>
              <option value="Odd Semester (Sem 1, 3, 5)">Odd Semester (Sem 1, 3, 5)</option>
              <option value="Even Semester (Sem 2, 4, 6)">Even Semester (Sem 2, 4, 6)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>

    </div>
  );
}
