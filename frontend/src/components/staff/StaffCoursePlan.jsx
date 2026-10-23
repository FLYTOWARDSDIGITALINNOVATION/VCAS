import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../../apiConfig';
import {
  Calendar,
  BookOpen,
  Plus,
  Trash2,
  Save,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers,
  ChevronDown,
  CheckSquare,
  BarChart3,
  TrendingUp,
  CircleDot
} from 'lucide-react';

const API_BASE = BACKEND_URL;

export default function StaffCoursePlan({ staffUser }) {
  const staffId = staffUser?.staffId || staffUser?._id || 'STF001';
  const staffName = staffUser?.name || 'Faculty Member';
  const department = staffUser?.department || 'Computer Science';

  const [activeTab, setActiveTab] = useState('course_plan'); // 'course_plan' | 'portion_completion'
  const [coursePlans, setCoursePlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('NEW');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Clean empty plan state - boxes start completely empty for staff to add
  const createEmptyPlan = () => ({
    academicYear: '2026-2027',
    yearSemester: 'I / I',
    subjectName: '',
    subjectCode: '',
    department: department,
    topics: [
      {
        sNo: 1,
        plannedDate: '',
        noOfHours: '',
        topic: '',
        executionDate: '',
        executionHours: '',
        deviation: '',
        sign: 'Pending'
      }
    ]
  });

  const [planForm, setPlanForm] = useState(createEmptyPlan());

  // Fetch all plans for this faculty
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/course-plans/${staffId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCoursePlans(data.data);
        if (data.data.length > 0 && selectedPlanId === 'NEW') {
          loadPlanIntoState(data.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load course plans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [staffId]);

  const loadPlanIntoState = (plan) => {
    setSelectedPlanId(plan._id);
    setPlanForm({
      academicYear: plan.academicYear || '2026-2027',
      yearSemester: plan.yearSemester || 'I / I',
      subjectName: plan.subjectName || '',
      subjectCode: plan.subjectCode || '',
      department: plan.department || department,
      topics: (plan.topics && plan.topics.length > 0)
        ? plan.topics
        : [{ sNo: 1, plannedDate: '', noOfHours: '', topic: '', executionDate: '', executionHours: '', deviation: '', sign: 'Pending' }]
    });
  };

  const handleStartNewPlan = () => {
    setSelectedPlanId('NEW');
    setPlanForm(createEmptyPlan());
    setSuccessMsg('');
    setErrorMsg('');
  };

  // Add Row
  const handleAddRow = () => {
    setPlanForm(prev => {
      const nextSNo = prev.topics.length + 1;
      return {
        ...prev,
        topics: [
          ...prev.topics,
          {
            sNo: nextSNo,
            plannedDate: '',
            noOfHours: '',
            topic: '',
            executionDate: '',
            executionHours: '',
            deviation: '',
            sign: 'Pending'
          }
        ]
      };
    });
  };

  // Remove Row
  const handleRemoveRow = (index) => {
    setPlanForm(prev => {
      const updated = prev.topics.filter((_, i) => i !== index).map((t, idx) => ({
        ...t,
        sNo: idx + 1
      }));
      return { ...prev, topics: updated.length > 0 ? updated : [
        { sNo: 1, plannedDate: '', noOfHours: '', topic: '', executionDate: '', executionHours: '', deviation: '', sign: 'Pending' }
      ]};
    });
  };

  // Update Topic Field
  const handleTopicChange = (index, field, value) => {
    setPlanForm(prev => {
      const updated = [...prev.topics];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, topics: updated };
    });
  };

  // Quick Portion Completion Status Update
  const handleUpdatePortionStatus = (index, newStatus) => {
    setPlanForm(prev => {
      const updated = [...prev.topics];
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yy = String(today.getFullYear()).slice(-2);
      const todayStr = `${dd}.${mm}.${yy}`;

      updated[index] = {
        ...updated[index],
        sign: newStatus,
        executionDate: newStatus === 'Completed' && !updated[index].executionDate ? todayStr : updated[index].executionDate,
        executionHours: newStatus === 'Completed' && (!updated[index].executionHours || updated[index].executionHours === 0) ? (updated[index].noOfHours || 1) : updated[index].executionHours
      };
      return { ...prev, topics: updated };
    });
  };

  // Save / Update Plan
  const handleSavePlan = async () => {
    if (!planForm.subjectName.trim()) {
      setErrorMsg('Please enter the Subject Name for this Course Plan.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');
      setSuccessMsg('');

      const payload = {
        staffId,
        staffName,
        department: planForm.department || department,
        subjectName: planForm.subjectName.trim(),
        subjectCode: planForm.subjectCode.trim(),
        academicYear: planForm.academicYear,
        yearSemester: planForm.yearSemester,
        topics: planForm.topics
      };

      const isNew = selectedPlanId === 'NEW';
      const endpoint = isNew ? `${API_BASE}/api/course-plans` : `${API_BASE}/api/course-plans/${selectedPlanId}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg(isNew ? 'Course Plan created and saved!' : 'Course Plan updated successfully!');
        if (isNew && data.data?._id) {
          setSelectedPlanId(data.data._id);
        }
        await fetchPlans();
      } else {
        setErrorMsg(data.message || 'Failed to save Course Plan');
      }
    } catch (err) {
      setErrorMsg('Server connection error. Please ensure the backend server is active.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Plan
  const handleDeletePlan = async () => {
    if (selectedPlanId === 'NEW') return;
    if (!window.confirm(`Are you sure you want to delete the Course Plan for "${planForm.subjectName}"?`)) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/course-plans/${selectedPlanId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Course Plan removed.');
        handleStartNewPlan();
        await fetchPlans();
      }
    } catch (err) {
      setErrorMsg('Could not delete course plan.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totalPlannedHrs = planForm.topics.reduce((sum, t) => sum + (Number(t.noOfHours) || 0), 0);
  const totalExecutionHrs = planForm.topics.reduce((sum, t) => sum + (Number(t.executionHours) || 0), 0);
  
  // Portion Completion Metrics
  const totalTopics = planForm.topics.filter(t => t.topic.trim()).length || planForm.topics.length;
  const completedTopics = planForm.topics.filter(t => t.sign === 'Completed' || t.sign === 'Signed').length;
  const inProgressTopics = planForm.topics.filter(t => t.sign === 'In Progress').length;
  const pendingTopics = Math.max(0, totalTopics - completedTopics - inProgressTopics);
  const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200">
              ACADEMIC ACTION PLAN
            </span>
            <span className="text-xs text-slate-400 font-bold">•</span>
            <span className="text-xs font-semibold text-slate-500">Date, Topic, Hours</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Course Plan & Portion Completion
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage semester syllabus action plans and track real-time topic portion completion status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Plan Selector */}
          <div className="relative min-w-[200px]">
            <select
              value={selectedPlanId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'NEW') {
                  handleStartNewPlan();
                } else {
                  const found = coursePlans.find(p => p._id === val);
                  if (found) loadPlanIntoState(found);
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold py-2.5 px-3 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="NEW">+ Create New Course Plan</option>
              {coursePlans.map(plan => (
                <option key={plan._id} value={plan._id}>
                  {plan.subjectName} ({plan.yearSemester})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleStartNewPlan}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Print Plan
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleSavePlan}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Plan'}
          </button>
        </div>
      </div>

      {/* Tabs: Course Plan Register vs Portion Completion Tracker */}
      <div className="flex gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 print:hidden w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('course_plan')}
          className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'course_plan'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Course Plan (Action Plan)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('portion_completion')}
          className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'portion_completion'
              ? 'bg-[#0f1e3c] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Portion Completion Status ({completionPercentage}%)</span>
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-semibold flex items-center gap-2 print:hidden animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-2 print:hidden animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* VIEW 1: OFFICIAL ACTION PLAN / COURSE PLAN (DATE, TOPIC, HRS)   */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {activeTab === 'course_plan' && (
        <div className="bg-white rounded-3xl border border-slate-300 p-6 sm:p-10 shadow-lg text-slate-900 print:border-none print:shadow-none print:p-0">
          
          {/* Header Block matching the Physical Register */}
          <div className="text-center border-b-2 border-slate-900 pb-5 mb-5 space-y-1">
            <h2 className="text-base sm:text-xl font-black uppercase tracking-wider text-slate-900">
              VIVEKANANDA COLLEGE OF ARTS AND SCIENCE
            </h2>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-800">
              VELLALANKULAM – 627856
            </p>
            <p className="text-xs sm:text-sm font-black uppercase tracking-wide text-blue-900">
              DEPARTMENT OF {planForm.department || department}
            </p>
            <div className="pt-2">
              <span className="inline-block px-4 py-1 border-2 border-slate-900 rounded-lg text-sm sm:text-base font-extrabold tracking-widest uppercase bg-slate-50">
                ACTION PLAN
              </span>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-xs sm:text-sm font-semibold border-2 border-slate-900 rounded-xl p-4 mb-6 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 min-w-[140px]">Name of the Faculty:</span>
              <span className="font-bold text-blue-950 uppercase">{staffName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 min-w-[130px]">Academic Year:</span>
              <input
                type="text"
                value={planForm.academicYear}
                onChange={(e) => setPlanForm({ ...planForm, academicYear: e.target.value })}
                placeholder="2026-2027"
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold w-36 focus:outline-none focus:border-blue-600 print:border-none print:p-0"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 min-w-[140px]">Subject Name:</span>
              <input
                type="text"
                required
                value={planForm.subjectName}
                onChange={(e) => setPlanForm({ ...planForm, subjectName: e.target.value })}
                placeholder="Enter Subject Name..."
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold flex-1 focus:outline-none focus:border-blue-600 print:border-none print:p-0"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 min-w-[130px]">Year / Semester:</span>
              <input
                type="text"
                value={planForm.yearSemester}
                onChange={(e) => setPlanForm({ ...planForm, yearSemester: e.target.value })}
                placeholder="I / I"
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold w-28 focus:outline-none focus:border-blue-600 print:border-none print:p-0"
              />
            </div>
          </div>

          {/* ── COURSE PLAN TABLE (DATE, TOPIC, HRS) ───────────────── */}
          <div className="overflow-x-auto rounded-xl border-2 border-slate-900 mb-6">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-extrabold border-b-2 border-slate-900 uppercase tracking-tight text-[11px] text-center">
                  <th className="py-2.5 px-2 border-r border-slate-400 w-12">S.No</th>
                  <th className="py-2.5 px-3 border-r border-slate-400 w-28">Planned Date</th>
                  <th className="py-2.5 px-2 border-r border-slate-400 w-20">No. Of Hours</th>
                  <th className="py-2.5 px-4 border-r border-slate-400 text-left">TOPIC</th>
                  <th className="py-2.5 px-3 border-r border-slate-400 w-28">Execution Date</th>
                  <th className="py-2.5 px-2 border-r border-slate-400 w-20">No. Of Hours</th>
                  <th className="py-2.5 px-3 border-r border-slate-400 w-36">DEVIATION</th>
                  <th className="py-2.5 px-3 border-r border-slate-400 w-28">Sign / Status</th>
                  <th className="py-2.5 px-2 w-12 print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-medium">
                {planForm.topics.map((t, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                    {/* S.No */}
                    <td className="py-2 px-2 text-center font-bold border-r border-slate-300 bg-slate-50/50">
                      {t.sNo || idx + 1}
                    </td>

                    {/* Planned Date */}
                    <td className="py-1 px-2 border-r border-slate-300">
                      <input
                        type="text"
                        value={t.plannedDate}
                        onChange={(e) => handleTopicChange(idx, 'plannedDate', e.target.value)}
                        placeholder=""
                        className="w-full p-1 bg-transparent border-0 font-bold text-center text-xs focus:ring-1 focus:ring-blue-500 rounded"
                      />
                    </td>

                    {/* Planned No. Of Hours */}
                    <td className="py-1 px-2 border-r border-slate-300 text-center">
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={t.noOfHours}
                        onChange={(e) => handleTopicChange(idx, 'noOfHours', e.target.value)}
                        placeholder=""
                        className="w-full p-1 bg-transparent border-0 font-bold text-center text-xs focus:ring-1 focus:ring-blue-500 rounded"
                      />
                    </td>

                    {/* TOPIC */}
                    <td className="py-1 px-3 border-r border-slate-300">
                      <textarea
                        rows={2}
                        value={t.topic}
                        onChange={(e) => handleTopicChange(idx, 'topic', e.target.value)}
                        placeholder=""
                        className="w-full p-1.5 bg-transparent border-0 font-semibold text-xs leading-relaxed focus:ring-1 focus:ring-blue-500 rounded resize-y"
                      />
                    </td>

                    {/* Execution Date */}
                    <td className="py-1 px-2 border-r border-slate-300">
                      <input
                        type="text"
                        value={t.executionDate}
                        onChange={(e) => handleTopicChange(idx, 'executionDate', e.target.value)}
                        placeholder=""
                        className="w-full p-1 bg-transparent border-0 font-semibold text-center text-xs focus:ring-1 focus:ring-blue-500 rounded"
                      />
                    </td>

                    {/* Execution Hours */}
                    <td className="py-1 px-2 border-r border-slate-300 text-center">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={t.executionHours}
                        onChange={(e) => handleTopicChange(idx, 'executionHours', e.target.value)}
                        placeholder=""
                        className="w-full p-1 bg-transparent border-0 font-semibold text-center text-xs focus:ring-1 focus:ring-blue-500 rounded"
                      />
                    </td>

                    {/* DEVIATION */}
                    <td className="py-1 px-2 border-r border-slate-300">
                      <input
                        type="text"
                        value={t.deviation}
                        onChange={(e) => handleTopicChange(idx, 'deviation', e.target.value)}
                        placeholder=""
                        className="w-full p-1 bg-transparent border-0 text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 rounded"
                      />
                    </td>

                    {/* Sign / Status */}
                    <td className="py-1 px-2 border-r border-slate-300 text-center">
                      <select
                        value={t.sign}
                        onChange={(e) => handleTopicChange(idx, 'sign', e.target.value)}
                        className="bg-transparent border-0 text-[11px] font-bold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Signed">✓ Signed</option>
                        <option value="Rescheduled">Rescheduled</option>
                      </select>
                    </td>

                    {/* Delete Row Button */}
                    <td className="py-1 px-2 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Total Summary Row */}
                <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-900 text-slate-900">
                  <td colSpan={2} className="py-2.5 px-3 text-right uppercase tracking-wider border-r border-slate-400">
                    Total Planned Hours:
                  </td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-400 text-blue-900 font-black">
                    {totalPlannedHrs > 0 ? `${totalPlannedHrs} Hrs` : '--'}
                  </td>
                  <td className="py-2.5 px-3 text-right uppercase tracking-wider border-r border-slate-400">
                    Total Executed Hours:
                  </td>
                  <td className="border-r border-slate-400"></td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-400 text-emerald-900 font-black">
                    {totalExecutionHrs > 0 ? `${totalExecutionHrs} Hrs` : '--'}
                  </td>
                  <td colSpan={3} className="py-2.5 px-3 text-xs text-slate-500 italic">
                    {totalExecutionHrs >= totalPlannedHrs && totalPlannedHrs > 0 ? '✓ Syllabus fully executed on schedule' : totalPlannedHrs > 0 ? `Pending execution: ${Math.max(0, totalPlannedHrs - totalExecutionHrs)} hrs` : ''}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Add Row Button */}
          <div className="flex items-center justify-between print:hidden mb-6">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border border-slate-200"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              Add Topic Entry
            </button>

            {selectedPlanId !== 'NEW' && (
              <button
                type="button"
                onClick={handleDeletePlan}
                className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete This Plan
              </button>
            )}
          </div>

          {/* Signature Footer matching Register */}
          <div className="grid grid-cols-3 gap-6 pt-12 text-center text-xs sm:text-sm font-extrabold text-slate-900 uppercase">
            <div className="border-t border-slate-900 pt-2">
              Signature of Faculty
            </div>
            <div className="border-t border-slate-900 pt-2">
              Head of Department (HOD)
            </div>
            <div className="border-t border-slate-900 pt-2">
              Principal
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* VIEW 2: PORTION COMPLETION TRACKER & STATUS UPDATE              */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {activeTab === 'portion_completion' && (
        <div className="space-y-6">
          {/* Progress Overview Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Syllabus Portion Completion Overview
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Subject: <span className="font-bold text-slate-800">{planForm.subjectName || 'Current Plan'}</span> • Year/Sem: <span className="font-bold text-slate-800">{planForm.yearSemester}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-indigo-600">{completionPercentage}%</span>
                <span className="text-xs font-bold text-slate-400">Completed</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden mb-4 p-0.5 border border-slate-200">
              <div
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
              />
            </div>

            {/* Metrics Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Total Topics</span>
                <span className="text-base font-black text-slate-800">{totalTopics}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                <span className="text-emerald-700 font-bold block text-[10px] uppercase">Completed</span>
                <span className="text-base font-black text-emerald-800">{completedTopics}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                <span className="text-amber-700 font-bold block text-[10px] uppercase">In Progress</span>
                <span className="text-base font-black text-amber-800">{inProgressTopics}</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-center">
                <span className="text-rose-700 font-bold block text-[10px] uppercase">Pending</span>
                <span className="text-base font-black text-rose-800">{pendingTopics}</span>
              </div>
            </div>
          </div>

          {/* Interactive Portion Status Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Topic-wise Portion Completion Status</h4>
                <p className="text-xs text-slate-400">Update status directly using the quick action buttons</p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={handleSavePlan}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Portion Status'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">S.No</th>
                    <th className="py-3 px-4">Topic / Syllabus Module</th>
                    <th className="py-3 px-3 text-center w-24">Planned Hrs</th>
                    <th className="py-3 px-3 text-center w-28">Planned Date</th>
                    <th className="py-3 px-3 text-center w-28">Execution Date</th>
                    <th className="py-3 px-3 text-center w-32">Status</th>
                    <th className="py-3 px-4 text-center w-52">Quick Status Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {planForm.topics.map((t, idx) => {
                    const isCompleted = t.sign === 'Completed' || t.sign === 'Signed';
                    const isInProgress = t.sign === 'In Progress';
                    const isPending = !isCompleted && !isInProgress;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-slate-500">{t.sNo || idx + 1}</td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{t.topic || <span className="text-slate-400 italic font-normal">Topic not specified</span>}</p>
                          {t.deviation && (
                            <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Deviation: {t.deviation}</p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">{t.noOfHours ? `${t.noOfHours}h` : '--'}</td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-600">{t.plannedDate || '--'}</td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-600">
                          <input
                            type="text"
                            value={t.executionDate}
                            onChange={(e) => handleTopicChange(idx, 'executionDate', e.target.value)}
                            placeholder="DD.MM.YY"
                            className="w-24 text-center p-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:bg-white focus:outline-none"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isInProgress
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {t.sign || 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdatePortionStatus(idx, 'Completed')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${
                                isCompleted
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              ✓ Done
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdatePortionStatus(idx, 'In Progress')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${
                                isInProgress
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                              }`}
                            >
                              ⏳ In Progress
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdatePortionStatus(idx, 'Pending')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${
                                isPending
                                  ? 'bg-slate-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              Pending
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
