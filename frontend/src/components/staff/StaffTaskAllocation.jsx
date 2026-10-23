import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../../apiConfig';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Clock3,
  Calendar,
  User,
  Users,
  Building2,
  Tag,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  X,
  Save,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Flame,
  ArrowUpRight
} from 'lucide-react';

const PRIORITY_THEMES = {
  Urgent: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  High:   { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  Medium: { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  Low:    { bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400' }
};

const STATUS_THEMES = {
  Completed:   { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  'In Progress': { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Clock3 },
  Pending:     { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  'Under Review': { bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: AlertCircle },
  Cancelled:   { bg: 'bg-slate-100 text-slate-500 border-slate-200', icon: X }
};

export default function StaffTaskAllocation({ staffUser }) {
  // Check if current user is HOD or Admin
  const isHod = staffUser?.designation?.toUpperCase()?.includes('HOD') || 
                staffUser?.role?.toUpperCase()?.includes('HOD') || 
                staffUser?.role?.toUpperCase()?.includes('ADMIN') || 
                staffUser?.isHod === true ||
                staffUser?.canAllocateTasks === true;

  const currentStaffId = staffUser?.staffId || staffUser?.employeeId || '';
  const currentStaffName = staffUser?.name || staffUser?.staffName || 'Faculty Member';
  const currentDept = staffUser?.department || '';

  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStaff, setFilterStaff] = useState('All');
  const [activeTab, setActiveTab] = useState(isHod ? 'allocated' : 'my_tasks'); // 'allocated', 'my_tasks'

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [statusUpdateVal, setStatusUpdateVal] = useState('In Progress');
  const [statusNotesVal, setStatusNotesVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // New task form state
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    assignedStaffId: '',
    department: currentDept || 'Computer Science',
    category: 'Academic',
    priority: 'Medium',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch all tasks
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/staff-tasks`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTasks(json.data);
      }
    } catch (err) {
      console.warn('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff list for assignment dropdown
  const fetchStaffList = async () => {
    try {
      const res = await fetch(`${API_BASE}/staff`);
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : (Array.isArray(json.staff) ? json.staff : []);
      if (list.length > 0) {
        setStaffList(list);
        if (!newTaskForm.assignedStaffId) {
          setNewTaskForm(prev => ({ ...prev, assignedStaffId: list[0].staffId || list[0]._id }));
        }
      }
    } catch (err) {
      console.warn('Error fetching staff list:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchStaffList();
  }, []);

  // Filter tasks based on view mode (Allocated by HOD vs My Tasks) and UI filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Tab filter
      if (activeTab === 'my_tasks') {
        if (t.assignedTo?.staffId !== currentStaffId) return false;
      } else if (activeTab === 'allocated') {
        // If user is HOD, show all tasks for their department or allocated by them
        if (!isHod && t.assignedTo?.staffId !== currentStaffId) return false;
      }

      // Status filter
      if (filterStatus !== 'All' && t.status !== filterStatus) return false;

      // Priority filter
      if (filterPriority !== 'All' && t.priority !== filterPriority) return false;

      // Staff filter
      if (filterStaff !== 'All' && t.assignedTo?.staffId !== filterStaff) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = (t.title || '').toLowerCase().includes(term);
        const matchesDesc = (t.description || '').toLowerCase().includes(term);
        const matchesStaff = (t.assignedTo?.name || '').toLowerCase().includes(term);
        const matchesCat = (t.category || '').toLowerCase().includes(term);
        return matchesTitle || matchesDesc || matchesStaff || matchesCat;
      }

      return true;
    });
  }, [tasks, activeTab, filterStatus, filterPriority, filterStaff, searchTerm, currentStaffId, isHod]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const relevant = activeTab === 'my_tasks' 
      ? tasks.filter(t => t.assignedTo?.staffId === currentStaffId)
      : tasks;
    return {
      total: relevant.length,
      pending: relevant.filter(t => t.status === 'Pending').length,
      inProgress: relevant.filter(t => t.status === 'In Progress').length,
      completed: relevant.filter(t => t.status === 'Completed').length
    };
  }, [tasks, activeTab, currentStaffId]);

  // Handle HOD Task Creation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskForm.title.trim()) {
      alert('Please enter a task title.');
      return;
    }
    const assignedStaffObj = staffList.find(s => (s.staffId || s._id) === newTaskForm.assignedStaffId) || staffList[0];
    if (!assignedStaffObj) {
      alert('Please select a staff member to assign the task to.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: newTaskForm.title,
        description: newTaskForm.description,
        department: newTaskForm.department || assignedStaffObj.department || currentDept || 'General',
        allocatedBy: {
          staffId: currentStaffId || 'HOD-01',
          name: currentStaffName || 'Head of Department',
          role: 'HOD',
          email: staffUser?.email || ''
        },
        assignedTo: {
          staffId: assignedStaffObj.staffId || assignedStaffObj._id,
          name: assignedStaffObj.name,
          designation: assignedStaffObj.designation || 'Faculty Member',
          department: assignedStaffObj.department || newTaskForm.department,
          email: assignedStaffObj.email || ''
        },
        priority: newTaskForm.priority,
        category: newTaskForm.category,
        dueDate: newTaskForm.dueDate
      };

      const res = await fetch(`${API_BASE}/staff-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Task successfully allocated to ${assignedStaffObj.name}!`);
        setShowCreateModal(false);
        setNewTaskForm({
          title: '',
          description: '',
          assignedStaffId: staffList[0]?.staffId || '',
          department: currentDept || 'Computer Science',
          category: 'Academic',
          priority: 'Medium',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
        fetchTasks();
      } else {
        alert(data.message || 'Failed to allocate task');
      }
    } catch (err) {
      alert('Network error allocating task: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle Staff Status Update (Start task, mark complete)
  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/staff-tasks/${selectedTask._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusUpdateVal,
          completionNotes: statusNotesVal
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Task status updated to ${statusUpdateVal}!`);
        setShowStatusModal(false);
        setSelectedTask(null);
        fetchTasks();
      } else {
        alert(data.message || 'Failed to update task status');
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (id, title) => {
    if (!window.confirm(`Delete task "${title}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/staff-tasks/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Task removed.');
        fetchTasks();
      }
    } catch (err) {
      alert('Error deleting task: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold border border-white/10 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>HOD Faculty Task Allocation & Oversight</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
            Staff Task Allocation & Work Tracking
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Head of Department allocates individual responsibilities to staff members. Staff track and update progress from pending to completion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10 shrink-0">
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-xs transition cursor-pointer border border-white/10"
            title="Refresh tasks"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {isHod && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Allocate Task</span>
            </button>
          )}
        </div>

        {/* Decorative blur */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: metrics.total, color: 'text-slate-900', bg: 'bg-slate-50', icon: ClipboardList },
          { label: 'Pending Action', value: metrics.pending, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
          { label: 'In Progress', value: metrics.inProgress, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Clock3 },
          { label: 'Completed', value: metrics.completed, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 }
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center gap-4">
              <div className={`w-11 h-11 rounded-2xl ${m.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{m.label}</p>
                <p className={`text-2xl font-black ${m.color} mt-0.5`}>{m.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* MAIN CONTENT CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
        
        {/* TABS & SEARCH / FILTER TOOLBAR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          {/* View Mode Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl self-start">
            {isHod && (
              <button
                type="button"
                onClick={() => setActiveTab('allocated')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'allocated' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>All Allocated Tasks ({tasks.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('my_tasks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'my_tasks' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>My Tasks ({tasks.filter(t => t.assignedTo?.staffId === currentStaffId).length})</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks or staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Under Review">Under Review</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Staff Filter (if HOD view) */}
            {isHod && activeTab === 'allocated' && (
              <select
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="All">All Staff Members</option>
                {staffList.map(s => (
                  <option key={s.staffId || s._id} value={s.staffId || s._id}>
                    {s.name} ({s.staffId})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* TASKS TABLE / LIST */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-7 h-7 mx-auto animate-spin text-blue-500" />
            <p className="text-xs font-bold text-slate-600">Loading task allocations...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl space-y-3">
            <ClipboardList className="w-10 h-10 mx-auto opacity-30 text-blue-600" />
            <p className="text-sm font-bold text-slate-700">No tasks found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {isHod 
                ? 'Click "Allocate Task" above to assign an individual responsibility to a staff member.' 
                : 'You have no tasks assigned at this moment.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 rounded-l-xl">Task Title & Details</th>
                  <th className="py-3.5 px-4">Assigned Staff</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTasks.map((task) => {
                  const prioTheme = PRIORITY_THEMES[task.priority] || PRIORITY_THEMES.Medium;
                  const statTheme = STATUS_THEMES[task.status] || STATUS_THEMES.Pending;
                  const StatIcon = statTheme.icon;
                  const isAssignedToMe = task.assignedTo?.staffId === currentStaffId;

                  return (
                    <tr key={task._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Title & Desc */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-indigo-600 font-mono block">
                            {task.taskId}
                          </span>
                          <span className="font-extrabold text-slate-900 text-xs block leading-snug">
                            {task.title}
                          </span>
                          {task.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
                            <span>Allocated by:</span>
                            <span className="font-bold text-slate-600">{task.allocatedBy?.name || 'HOD'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Staff */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                            {(task.assignedTo?.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {task.assignedTo?.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {task.assignedTo?.staffId} • {task.assignedTo?.designation || 'Staff'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                          {task.category || 'Academic'}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${prioTheme.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${prioTheme.dot}`}></span>
                          <span>{task.priority}</span>
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{task.dueDate}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${statTheme.bg}`}>
                          <StatIcon className="w-3 h-3 shrink-0" />
                          <span>{task.status}</span>
                        </span>
                        {task.completionNotes && (
                          <p className="text-[10px] text-slate-500 mt-1 italic line-clamp-1">
                            "{task.completionNotes}"
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Staff Update Status Button */}
                          {(isAssignedToMe || isHod) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTask(task);
                                setStatusUpdateVal(task.status === 'Pending' ? 'In Progress' : (task.status === 'In Progress' ? 'Completed' : task.status));
                                setStatusNotesVal(task.completionNotes || '');
                                setShowStatusModal(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition cursor-pointer border border-blue-200"
                              title="Update Progress / Notes"
                            >
                              Update Status
                            </button>
                          )}

                          {/* HOD Delete Task */}
                          {isHod && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task._id, task.title)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* MODAL 1: HOD ALLOCATE NEW TASK */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-scaleUp border border-slate-100 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  <span>Allocate Task to Individual Staff</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  HOD direct work assignment with priority and deadline
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              
              {/* Select Individual Staff */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Assign to Individual Staff <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newTaskForm.assignedStaffId}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, assignedStaffId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">Select individual staff member...</option>
                  {staffList.map((s) => (
                    <option key={s.staffId || s._id} value={s.staffId || s._id}>
                      {s.name} ({s.staffId || s.employeeId}) — {s.department || 'Staff'} • {s.designation || 'Faculty'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Title */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Prepare Internal Exam Question Paper for CS301"
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Instructions / Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Specific instructions, syllabus units to cover, guidelines..."
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Category, Priority, Due Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Category</label>
                  <select
                    value={newTaskForm.category}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Exam Duty">Exam Duty</option>
                    <option value="Syllabus / Curriculum">Syllabus / Curriculum</option>
                    <option value="Event / Function">Event / Function</option>
                    <option value="Accreditation / NAAC">Accreditation / NAAC</option>
                    <option value="Student Mentoring">Student Mentoring</option>
                    <option value="Lab / Asset Maintenance">Lab / Asset Maintenance</option>
                    <option value="General">General</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Priority</label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Urgent">Urgent 🔥</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newTaskForm.dueDate}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-semibold focus:border-blue-500 focus:outline-none cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Department</label>
                <input
                  type="text"
                  value={newTaskForm.department}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, department: e.target.value })}
                  placeholder="Department Name"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Allocating...' : 'Allocate Task'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE TASK STATUS & COMPLETION REMARKS */}
      {showStatusModal && selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Update Task Progress</h3>
                <p className="text-[11px] text-slate-500 truncate max-w-xs">{selectedTask.title}</p>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Task Status</label>
                <select
                  value={statusUpdateVal}
                  onChange={(e) => setStatusUpdateVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress (Work Started)</option>
                  <option value="Completed">Completed (Work Finished)</option>
                  <option value="Under Review">Under Review (Awaiting HOD Check)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Completion Remarks / Staff Notes
                </label>
                <textarea
                  rows={3}
                  value={statusNotesVal}
                  onChange={(e) => setStatusNotesVal(e.target.value)}
                  placeholder="Notes on work completed, links, or updates for HOD..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Update Status'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
