import React, { useState, useEffect } from 'react';
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
  Save
} from 'lucide-react';

export default function StaffNotices({ staffUser = {} }) {
  const [notices, setNotices] = useState([]);
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Edit mode state
  const [editingId, setEditingId] = useState(null); // null = create, string = edit

  // Form state (shared for create + edit)
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newTag, setNewTag] = useState('Academic');
  const [isUrgent, setIsUrgent] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const tags = ['ALL', 'Academic', 'Exam', 'Development', 'Event', 'Research'];

  // Fetch notices from backend
  const fetchNotices = async () => {
    try {
      setLoading(true);
      const url = selectedTag && selectedTag !== 'ALL'
        ? `http://localhost:5000/api/notices?tag=${encodeURIComponent(selectedTag)}`
        : 'http://localhost:5000/api/notices';

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

  // Open create modal
  const openCreateModal = () => {
    setEditingId(null);
    setNewTitle(''); setNewBody(''); setNewTag('Academic'); setIsUrgent(false);
    setErrorMsg('');
    setShowModal(true);
  };

  // Open edit modal pre-filled
  const openEditModal = (notice) => {
    setEditingId(notice._id || notice.id);
    setNewTitle(notice.title || '');
    setNewBody(notice.body || notice.content || '');
    setNewTag(notice.tag || 'Academic');
    setIsUrgent(Boolean(notice.urgent));
    setErrorMsg('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setNewTitle(''); setNewBody(''); setNewTag('Academic'); setIsUrgent(false);
    setErrorMsg('');
  };

  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          body: newBody.trim(),
          tag: newTag,
          urgent: isUrgent,
          postedBy: staffUser?.name ? `${staffUser.name} (${staffUser.department || 'Faculty'})` : 'Faculty Member',
          postedByStaffId: staffUser?.staffId || '',
          department: staffUser?.department || 'All'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        closeModal();
        setSuccessMsg(data.message || 'Notice published successfully!');
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
      const res = await fetch(`http://localhost:5000/api/notices/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          body: newBody.trim(),
          tag: newTag,
          urgent: isUrgent,
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
      const res = await fetch(`http://localhost:5000/api/notices/${noticeId}`, {
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
    <div className="p-5 sm:p-7 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Notices & Circulars</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            College administration alerts, department announcements, and post new notices
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Post New Notice
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tags Filter */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
        {tags.map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedTag === tag
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tag === 'ALL' ? 'All Notices' : tag}
          </button>
        ))}
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs font-medium">Loading notices from database...</p>
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">No notices found in this category</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click "Post New Notice" above to publish a circular.</p>
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice._id || notice.id}
              className={`bg-white rounded-2xl border p-5 transition-all shadow-sm ${
                notice.urgent ? 'border-red-200/80' : 'border-slate-100'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                    {notice.tag}
                  </span>
                  {notice.pinned && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                      <Pin className="w-3 h-3 text-purple-600" /> Pinned
                    </span>
                  )}
                  {notice.urgent && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-100">
                      <AlertCircle className="w-3 h-3" /> Urgent
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{notice.date}</span>
                  </div>
                  <button
                    onClick={() => openEditModal(notice)}
                    title="Edit Notice"
                    className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteNotice(notice._id || notice.id)}
                    title="Delete Notice"
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                {notice.title}
              </h3>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                {notice.body || notice.content}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Posted by: {notice.postedBy || notice.author}
                </span>
                {notice.department && notice.department !== 'All' && (
                  <span className="text-slate-400 text-[10px]">
                    Dept: {notice.department}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Post / Edit Notice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => !submitting && closeModal()} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${editingId ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                  {editingId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingId ? 'Edit Notice' : 'Post Department Notice'}
                </h3>
              </div>
              <button 
                onClick={closeModal} 
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-2.5 mb-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={editingId ? handleUpdateNotice : handlePostNotice} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category / Tag</label>
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Academic">Academic</option>
                  <option value="Exam">Exam</option>
                  <option value="Development">Development</option>
                  <option value="Event">Event</option>
                  <option value="Research">Research</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Submission of Assignment 2 Extended"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Content</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Detailed announcement text for your department students..."
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="urgentCheck"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                />
                <label htmlFor="urgentCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Mark as High Priority / Urgent Notice
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 ${editingId ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'}`}
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {submitting ? (editingId ? 'Saving...' : 'Publishing...') : (editingId ? 'Save Changes' : 'Publish Notice')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
