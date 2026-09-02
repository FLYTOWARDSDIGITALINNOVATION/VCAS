import React, { useState } from 'react';
import { 
  Settings, 
  Building, 
  Bell, 
  Lock, 
  Palette, 
  Database, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Upload, 
  Shield, 
  Smartphone, 
  Mail, 
  Globe, 
  Key, 
  Layers, 
  CreditCard,
  Sliders,
  Check
} from 'lucide-react';

const SETTINGS_TABS = [
  { id: 'general', label: 'Institutional Profile', icon: Building },
  { id: 'notifications', label: 'Alerts & Notifications', icon: Bell },
  { id: 'security', label: 'Security & Access Policy', icon: Lock },
  { id: 'appearance', label: 'Branding & Theme', icon: Palette },
  { id: 'backup', label: 'Backup & Maintenance', icon: Database },
  { id: 'finance', label: 'Fee & Payment Gateway', icon: CreditCard }
];

export default function SettingsManagement() {
  const [activeTab, setActiveTab] = useState('general');
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Form State
  const [settings, setSettings] = useState({
    // General
    collegeName: 'Vidyapeeth College of Arts and Sciences',
    collegeCode: 'VCAS-2008',
    accreditation: 'NAAC A++ Grade (CGPA 3.82) | Autonomous',
    affiliation: 'State Technical & Arts University',
    address: '42, Vidyapeeth Knowledge Corridor, Chennai Highway',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600044',
    officialEmail: 'registrar@vcas.edu',
    helpdeskPhone: '+91 44 2855 1200',
    websiteUrl: 'https://vcas.edu.in',
    currentAcademicYear: '2024-2025',
    currentSemesterCycle: 'Even Semester (Sem 2, 4, 6, 8)',
    timezone: 'Asia/Kolkata (IST +5:30)',

    // Notifications
    enableSmsAlerts: true,
    enableEmailDigest: true,
    enableParentAttendanceAlerts: true,
    attendanceThreshold: 75,
    enableFeeReminders: true,
    feeReminderDaysBefore: 7,
    enableExamAlerts: true,
    smsGatewayProvider: 'AWS SNS / Twilio Gateway',

    // Security
    enforce2FAAdmins: true,
    enforce2FAFaculty: true,
    sessionTimeoutMinutes: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    passwordRequireSpecialChar: true,
    enableIpWhitelisting: false,

    // Appearance
    themeColor: 'blue', // 'blue', 'indigo', 'purple', 'emerald', 'amber'
    headerBrandTitle: 'Vidyapeeth Management System',
    enableDarkMode: false,

    // Finance Gateway
    paymentGateway: 'Razorpay PG',
    lateFeePerDay: 50,
    currencySymbol: 'INR (₹)'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast('Portal configuration saved and applied successfully!');
    }, 800);
  };

  const handleTriggerManualBackup = () => {
    setIsBackingUp(true);
    showToast('Compiling institutional database backup archive...');
    setTimeout(() => {
      setIsBackingUp(false);
      showToast('Snapshot backup completed! (vcas_backup_20250501.sql • 44.2 MB)');
    }, 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      
      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Settings & Configuration</h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage institution metadata, SMS/Email communication triggers, security rules, and database backups
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* SETTINGS TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SETTINGS_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: INSTITUTIONAL PROFILE */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Institutional Identity & General Profile</h3>
            <p className="text-xs text-slate-400">Basic details displayed on official transcripts, receipts, and headers</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Institution Name</label>
              <input
                type="text"
                value={settings.collegeName}
                onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Institution Code</label>
              <input
                type="text"
                value={settings.collegeCode}
                onChange={(e) => setSettings({ ...settings, collegeCode: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Accreditation & Grading</label>
              <input
                type="text"
                value={settings.accreditation}
                onChange={(e) => setSettings({ ...settings, accreditation: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Affiliated University</label>
              <input
                type="text"
                value={settings.affiliation}
                onChange={(e) => setSettings({ ...settings, affiliation: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Campus Physical Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City, State & Pincode</label>
              <input
                type="text"
                value={`${settings.city}, ${settings.state} - ${settings.pincode}`}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Registry Email</label>
              <input
                type="email"
                value={settings.officialEmail}
                onChange={(e) => setSettings({ ...settings, officialEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Central Helpdesk Phone</label>
              <input
                type="text"
                value={settings.helpdeskPhone}
                onChange={(e) => setSettings({ ...settings, helpdeskPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Portal URL</label>
              <input
                type="text"
                value={settings.websiteUrl}
                onChange={(e) => setSettings({ ...settings, websiteUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
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
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025 (Current)</option>
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
                <option value="Even Semester (Sem 2, 4, 6, 8)">Even Semester (Sem 2, 4, 6, 8)</option>
                <option value="Odd Semester (Sem 1, 3, 5, 7)">Odd Semester (Sem 1, 3, 5, 7)</option>
              </select>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: NOTIFICATIONS & ALERTS */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Automated Messaging & Notification Triggers</h3>
            <p className="text-xs text-slate-400">Configure automated parent alerts, fee collection reminders, and push digests</p>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="py-4 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-slate-900 text-xs">Attendance Shortage Parent Alert (SMS / WhatsApp)</p>
                <p className="text-[11px] text-slate-500">Automatically dispatches SMS to parents when student attendance falls below {settings.attendanceThreshold}%</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableParentAttendanceAlerts}
                onChange={(e) => setSettings({ ...settings, enableParentAttendanceAlerts: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer"
              />
            </div>

            <div className="py-4 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-slate-900 text-xs">Fee Payment Due Reminders</p>
                <p className="text-[11px] text-slate-500">Send reminder notifications 7 days prior to semester fee payment deadlines</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableFeeReminders}
                onChange={(e) => setSettings({ ...settings, enableFeeReminders: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer"
              />
            </div>

            <div className="py-4 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-slate-900 text-xs">Examination Schedule & Hall Ticket Broadcast</p>
                <p className="text-[11px] text-slate-500">Instant notification when semester exam timetables and hall tickets are released</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableExamAlerts}
                onChange={(e) => setSettings({ ...settings, enableExamAlerts: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer"
              />
            </div>

            <div className="py-4 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-slate-900 text-xs">Daily Administrative Email Digest</p>
                <p className="text-[11px] text-slate-500">Sends morning summary report of staff attendance and student enrollments to Principal and HODs</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableEmailDigest}
                onChange={(e) => setSettings({ ...settings, enableEmailDigest: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & ACCESS */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Security Policies & Authentication Rules</h3>
            <p className="text-xs text-slate-400">Multi-Factor Authentication, Session Management, and Lockout Parameters</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <p className="font-extrabold text-slate-900 text-xs">Enforce Two-Factor Authentication (2FA)</p>
              <p className="text-[11px] text-slate-500">Requires OTP via Google Authenticator or SMS for Administrative Roles</p>
              <label className="flex items-center gap-2 pt-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enforce2FAAdmins}
                  onChange={(e) => setSettings({ ...settings, enforce2FAAdmins: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Enforce for Super Admins and HODs</span>
              </label>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <p className="font-extrabold text-slate-900 text-xs">Idle Session Inactivity Timeout</p>
              <p className="text-[11px] text-slate-500">Automatically logs out inactive browser sessions to prevent unauthorized access</p>
              <select
                value={settings.sessionTimeoutMinutes}
                onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes (Recommended)</option>
                <option value={60}>60 Minutes</option>
                <option value={120}>2 Hours</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BRANDING & APPEARANCE */}
      {activeTab === 'appearance' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Custom Branding & Theme Customization</h3>
            <p className="text-xs text-slate-400">Personalize portal theme colors, logos, and header appearance</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Portal Primary Accent Color</label>
              <div className="flex items-center gap-3">
                {[
                  { name: 'blue', bg: 'bg-blue-600', ring: 'ring-blue-400' },
                  { name: 'indigo', bg: 'bg-indigo-600', ring: 'ring-indigo-400' },
                  { name: 'purple', bg: 'bg-purple-600', ring: 'ring-purple-400' },
                  { name: 'emerald', bg: 'bg-emerald-600', ring: 'ring-emerald-400' },
                  { name: 'cyan', bg: 'bg-cyan-600', ring: 'ring-cyan-400' }
                ].map(c => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setSettings({ ...settings, themeColor: c.name });
                      showToast(`Primary theme switched to ${c.name.toUpperCase()}!`);
                    }}
                    className={`w-9 h-9 rounded-2xl ${c.bg} transition-all flex items-center justify-center text-white ${
                      settings.themeColor === c.name ? 'ring-4 ring-offset-2 ring-slate-400 shadow-md' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {settings.themeColor === c.name && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Header Portal Title</label>
              <input
                type="text"
                value={settings.headerBrandTitle}
                onChange={(e) => setSettings({ ...settings, headerBrandTitle: e.target.value })}
                className="w-full max-w-md px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BACKUP & MAINTENANCE */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Database Backup & Disaster Recovery</h3>
            <p className="text-xs text-slate-400">Automated nightly backups, manual database snapshots, and data export</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Automated Nightly Backup: Active</span>
              </div>
              <p className="text-xs text-slate-600">Last automated snapshot captured today at <strong>03:00 AM IST</strong> (44.2 MB compressed SQL dump).</p>
              <p className="text-[11px] text-slate-400">Encrypted with AES-256 and replicated across redundant cloud storage.</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between gap-3">
              <div>
                <p className="font-extrabold text-slate-900 text-xs">Instant Manual Snapshot</p>
                <p className="text-xs text-slate-500 mt-1">Generate a fresh point-in-time full database export right now.</p>
              </div>
              <button
                type="button"
                onClick={handleTriggerManualBackup}
                disabled={isBackingUp}
                className="self-start px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isBackingUp ? 'Generating Backup...' : 'Trigger Backup Snapshot'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: FINANCE & PAYMENT GATEWAY */}
      {activeTab === 'finance' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Tuition Fee & Payment Gateway Configurations</h3>
            <p className="text-xs text-slate-400">Online student fee collections, UPI integrations, and late fee fine calculations</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Primary Payment Gateway</label>
              <select
                value={settings.paymentGateway}
                onChange={(e) => setSettings({ ...settings, paymentGateway: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="Razorpay PG">Razorpay (Cards, NetBanking, UPI)</option>
                <option value="Stripe Gateway">Stripe India</option>
                <option value="CCAvenue">CCAvenue Institutional</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Late Fee Penalty (Per Day after Due Date)</label>
              <input
                type="number"
                value={settings.lateFeePerDay}
                onChange={(e) => setSettings({ ...settings, lateFeePerDay: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
