import React, { useState } from 'react';
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
  Megaphone
} from 'lucide-react';
import { NOTICES_DATA } from './staffData';

export default function StaffNotices({ staffUser }) {
  const [notices, setNotices] = useState(() => NOTICES_DATA);
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  // New notice form state
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newTag, setNewTag] = useState('Academic');
  const [isUrgent, setIsUrgent] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const tags = ['ALL', 'Academic', 'Exam', 'Development', 'Event', 'Research'];

  const filteredNotices = notices.filter(n => {
    if (selectedTag !== 'ALL' && n.tag !== selectedTag) return false;
    return true;
  });

  const handlePostNotice = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const newEntry = {
      id: `N-${Date.now()}`,
      title: newTitle.trim(),
      body: newBody.trim(),
      postedBy: `${staffUser.name} (${staffUser.department})`,
      date: todayStr,
      tag: newTag,
      urgent: isUrgent
    };

    setNotices(prev => [newEntry, ...prev]);
    setShowModal(false);
    setNewTitle('');
    setNewBody('');
    setIsUrgent(false);
    setSuccessMsg('Notice posted to department and students successfully!');
    setTimeout(() => setSuccessMsg(''), 4000);
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
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Post New Notice
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successMsg}
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
        {filteredNotices.map((notice) => (
          <div
            key={notice.id}
            className={`bg-white rounded-2xl border p-5 transition-all shadow-sm ${
              notice.urgent ? 'border-red-200/80' : 'border-slate-100'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                  {notice.tag}
                </span>
                {notice.urgent && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-100">
                    <AlertCircle className="w-3 h-3" /> Urgent
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>{notice.date}</span>
              </div>
            </div>

            <h3 className="font-extrabold text-slate-900 text-base leading-snug">
              {notice.title}
            </h3>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {notice.body}
            </p>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Posted by: {notice.postedBy}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Post Notice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-slate-900 text-base">Post Department Notice</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostNotice} className="space-y-3.5">
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
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white shadow-md shadow-blue-500/20"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
