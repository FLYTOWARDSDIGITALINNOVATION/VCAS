import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE, BACKEND_URL } from '../../apiConfig';
import { 
  Bell, 
  Plus, 
  Tag, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Send,
  Building2,
  Megaphone,
  Pin,
  Trash2,
  Loader2,
  Edit,
  Save,
  Upload,
  Paperclip,
  Download,
  FileText,
  Search,
  Filter,
  User,
  Users
} from 'lucide-react';
import ModalPortal from '../ModalPortal';

export default function StaffNotices({ staffUser = {} }) {
  const [notices, setNotices] = useState([]);
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Edit mode state
  const [editingId, setEditingId] = useState(null); // null = create, string = edit

  // Form state (shared for create + edit)
  const [newTitle, setNewTitle] = useState('');
  const [newReason, setNewReason] = useState('');
  const [targetAudience, setTargetAudience] = useState('All');
  const [newBody, setNewBody] = useState('');
  const [newTag, setNewTag] = useState('Academic');
  const [isUrgent, setIsUrgent] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const tags = ['ALL', 'Academic', 'Exam', 'Development', 'Event', 'Research'];
  const audienceOptions = [
    { id: 'All', label: '📢 Everyone (All Staff & Students)' },
    { id: 'Students', label: '🎓 All Students' },
    { id: 'Staff', label: '👨‍🏫 All Faculty & Staff' },
    { id: 'HODs', label: '🏛️ Heads of Department (HODs)' },
    { id: 'Administration', label: '🏢 Administration & Office' }
  ];

  // Fetch notices from backend
  const fetchNotices = async () => {
    try {
      setLoading(true);
      const url = selectedTag && selectedTag !== 'ALL'
        ? `${API_BASE}/notices?tag=${encodeURIComponent(selectedTag)}`
        : `${API_BASE}/notices`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setNotices(data.notices || []);
      }
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [selectedTag]);

  // Filtered notices based on tag & search
  const filteredNotices = useMemo(() => {
    return notices.filter(n => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const matchTitle = (n.title || '').toLowerCase().includes(q);
      const matchBody = (n.body || n.content || '').toLowerCase().includes(q);
      const matchAuthor = (n.postedBy || n.author || '').toLowerCase().includes(q);
      const matchReason = (n.reason || '').toLowerCase().includes(q);
      const matchDept = (n.department || '').toLowerCase().includes(q);
      return matchTitle || matchBody || matchAuthor || matchReason || matchDept;
    });
  }, [notices, searchQuery]);

  // Tag color mapping
  const getTagBadgeStyle = (tag) => {
    switch ((tag || '').toLowerCase()) {
      case 'exam':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'event':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'research':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'development':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'academic':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const sizeFormatted = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;
        
        const newAttachment = {
          name: file.name,
          size: sizeFormatted,
          type: file.type || 'application/octet-stream',
          dataUrl: uploadEvent.target.result,
          url: uploadEvent.target.result
        };

        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveAttachment = (idxToRemove) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleDownloadAttachment = (att) => {
    if (att.dataUrl || att.url) {
      const link = document.createElement('a');
      link.href = att.dataUrl || att.url;
      link.download = att.name || 'Notice_Document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`Downloading ${att.name}...`);
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingId(null);
    setNewTitle('');
    setNewReason('');
    setTargetAudience('All');
    setNewBody('');
    setNewTag('Academic');
    setIsUrgent(false);
    setAttachments([]);
    setErrorMsg('');
    setShowModal(true);
  };

  // Open edit modal pre-filled
  const openEditModal = (notice) => {
    setEditingId(notice._id || notice.id);
    setNewTitle(notice.title || '');
    setNewReason(notice.reason || '');
    setTargetAudience(notice.targetAudience || 'All');
    setNewBody(notice.body || notice.content || '');
    setNewTag(notice.tag || 'Academic');
    setIsUrgent(Boolean(notice.urgent));
    setAttachments(notice.attachments || []);
    setErrorMsg('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setNewTitle('');
    setNewReason('');
    setTargetAudience('All');
    setNewBody('');
    setNewTag('Academic');
    setIsUrgent(false);
    setAttachments([]);
    setErrorMsg('');
  };

  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          reason: newReason.trim(),
          targetAudience,
          body: newBody.trim(),
          tag: newTag,
          urgent: isUrgent,
          postedBy: staffUser?.name ? `${staffUser.name} (${staffUser.department || 'Faculty'})` : 'Faculty Member',
          postedByStaffId: staffUser?.staffId || '',
          department: staffUser?.department || 'All',
          attachments: attachments || []
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        closeModal();
        setSuccessMsg(data.message || 'Notice broadcasted successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchNotices();
      } else {
        setErrorMsg(data.message || 'Failed to post notice.');
      }
    } catch (err) {
      setErrorMsg('Unable to connect to the backend server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNotice = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/notices/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          reason: newReason.trim(),
          targetAudience,
          body: newBody.trim(),
          tag: newTag,
          urgent: isUrgent,
          attachments: attachments || []
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        closeModal();
        setSuccessMsg('Notice updated successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchNotices();
      } else {
        setErrorMsg(data.message || 'Failed to update notice.');
      }
    } catch (err) {
      setErrorMsg('Unable to connect to the backend server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;

    try {
      const res = await fetch(`${API_BASE}/notices/${noticeId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Notice deleted successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchNotices();
      } else {
        alert(data.message || 'Failed to delete notice.');
      }
    } catch (err) {
      alert('Unable to connect to server.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Notices & Circulars</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                Staff Portal
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Broadcast circulars to students & staff, view administrative announcements, and attach documents.
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Post New Notice
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-bold shadow-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {tags.map(tag => {
            const count = tag === 'ALL' 
              ? notices.length 
              : notices.filter(n => (n.tag || '').toLowerCase() === tag.toLowerCase()).length;
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tag === 'ALL' ? 'All Notices' : tag}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, details, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Notices Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-16 flex flex-col items-center justify-center text-slate-400 gap-3 shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-bold text-slate-600">Loading notices and circulars...</p>
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-7 h-7 text-slate-300" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-700">No notices found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery ? `No circulars matched "${searchQuery}". Clear your search query.` : 'There are no active notices under this category.'}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Post a Circular Now
            </button>
          </div>
        ) : (
          filteredNotices.map((notice) => {
            const isNoticeUrgent = Boolean(notice.urgent);
            return (
              <div
                key={notice._id || notice.id}
                className={`bg-white rounded-2xl border transition-all duration-200 p-5 sm:p-6 shadow-xs hover:shadow-md ${
                  isNoticeUrgent 
                    ? 'border-l-4 border-l-red-500 border-red-200/70 bg-gradient-to-r from-red-50/20 to-white' 
                    : 'border-slate-200/80 hover:border-blue-200'
                }`}
              >
                {/* Notice Top Meta Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border ${getTagBadgeStyle(notice.tag)}`}>
                      {notice.tag || 'Notice'}
                    </span>
                    {notice.pinned && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                        <Pin className="w-3 h-3 text-purple-600" /> Pinned
                      </span>
                    )}
                    {isNoticeUrgent && (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-red-100 text-red-700 border border-red-200 animate-pulse">
                        <AlertCircle className="w-3 h-3" /> URGENT
                      </span>
                    )}
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{notice.date || 'Today'}</span>
                    </div>

                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5">
                      <button
                        onClick={() => openEditModal(notice)}
                        title="Edit Notice"
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-white rounded-lg transition-all cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNotice(notice._id || notice.id)}
                        title="Delete Notice"
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-white rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notice Content */}
                <div className="pt-3.5 space-y-2">
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug">
                    {notice.title}
                  </h3>

                  {notice.reason && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800">
                      <span>📝 Reason:</span>
                      <span className="font-semibold">{notice.reason}</span>
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line pt-1">
                    {notice.body || notice.content}
                  </p>
                </div>

                {/* Attachments Section */}
                {notice.attachments && notice.attachments.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                      Attachments ({notice.attachments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {notice.attachments.map((att, attIdx) => (
                        <button
                          key={attIdx}
                          type="button"
                          onClick={() => handleDownloadAttachment(att)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/70 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold border border-blue-200 transition-all cursor-pointer group shadow-2xs"
                          title="Click to Download File"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                          <span className="truncate max-w-[200px]">{att.name}</span>
                          {att.size && <span className="text-[10px] text-blue-500 font-normal">({att.size})</span>}
                          <Download className="w-3.5 h-3.5 text-blue-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card Footer: Author & Audience */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-slate-700">
                      {notice.postedBy || notice.author || 'College Staff'}
                    </span>
                    {notice.department && notice.department !== 'All' && (
                      <span className="text-slate-400 text-[11px]">
                        • {notice.department}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {notice.targetAudience && notice.targetAudience !== 'All' ? (
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-full border border-indigo-100">
                        To: {notice.targetAudience}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-100">
                        📢 Broadcast: Everyone
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Post / Edit Notice Modal using ModalPortal */}
      {showModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
              
              {/* Modal Header */}
              <div className={`px-6 py-4.5 text-white flex items-center justify-between shadow-xs ${
                editingId ? 'bg-gradient-to-r from-amber-600 to-amber-700' : 'bg-gradient-to-r from-blue-600 to-indigo-700'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                    {editingId ? <Edit className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tight">
                      {editingId ? 'Edit Circular / Notice' : 'Post New Department Circular'}
                    </h2>
                    <p className="text-xs text-white/80 font-medium">
                      Publish announcements to students, faculty, or department groups
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeModal}
                  disabled={submitting}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4.5 flex-1 bg-slate-50/50">
                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form id="notice-form" onSubmit={editingId ? handleUpdateNotice : handlePostNotice} className="space-y-4">
                  {/* Broadcast & Category Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                        📢 Broadcast To
                      </label>
                      <select
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                      >
                        {audienceOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                        🏷️ Category Tag
                      </label>
                      <select
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                      >
                        <option value="Academic">Academic</option>
                        <option value="Exam">Exam</option>
                        <option value="Development">Development</option>
                        <option value="Event">Event</option>
                        <option value="Research">Research</option>
                      </select>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Notice Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Internal Exam 1 Schedule & Hall Allocation Announced"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Reason / Context <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Scheduled as per University Circular ref #42"
                      value={newReason}
                      onChange={(e) => setNewReason(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                    />
                  </div>

                  {/* Details textarea */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Notice Content & Details <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows="4"
                      required
                      placeholder="Provide full announcement details, instructions for students/faculty, and deadlines..."
                      value={newBody}
                      onChange={(e) => setNewBody(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs leading-relaxed"
                    ></textarea>
                  </div>

                  {/* Upload Document Attachments */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      📎 Attach Documents & Circulars
                    </label>
                    <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white rounded-2xl p-4 text-center transition-colors shadow-2xs">
                      <input
                        type="file"
                        id="staff-notice-file-upload"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label htmlFor="staff-notice-file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-1.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-blue-600 hover:underline">Click to browse or drop documents</span>
                        <span className="text-[10px] text-slate-400">PDF, Excel, Word, or Image files (multiple files supported)</span>
                      </label>
                    </div>

                    {attachments && attachments.length > 0 && (
                      <div className="mt-2.5 space-y-1.5">
                        {attachments.map((att, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs shadow-2xs">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Paperclip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="truncate font-bold text-slate-800">{att.name}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">({att.size})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Urgent Toggle */}
                  <div className="flex items-center gap-2.5 p-3 bg-red-50/50 border border-red-200 rounded-xl">
                    <input
                      type="checkbox"
                      id="urgentCheck"
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded border-red-300 focus:ring-red-500 cursor-pointer"
                    />
                    <label htmlFor="urgentCheck" className="text-xs font-bold text-red-900 cursor-pointer">
                      Flag as Urgent / High Priority Notice
                    </label>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={closeModal}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="notice-form"
                  disabled={submitting}
                  className={`px-6 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                    editingId 
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' 
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  }`}
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {submitting ? (editingId ? 'Updating...' : 'Publishing...') : (editingId ? 'Save Changes' : 'Publish Notice')}
                </button>
              </div>

            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
