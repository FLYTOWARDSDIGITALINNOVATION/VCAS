import React, { useState } from 'react';
import { BookOpen, Users, ChevronDown, ChevronUp, GraduationCap, Hash, Clock, Layers } from 'lucide-react';
import { SUBJECTS, STUDENTS } from './staffData';

export default function StaffMyClasses({ staffUser }) {
  const [expandedSubject, setExpandedSubject] = useState(null);
  const mySubjects = staffUser.subjects.map(s => SUBJECTS[s]).filter(Boolean);

  const colorPill = {
    'Computer Science': 'bg-blue-50 text-blue-700 border border-blue-100',
    'Electronics':      'bg-amber-50 text-amber-700 border border-amber-100',
    'MBA':              'bg-rose-50 text-rose-700 border border-rose-100',
  };

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">My Classes</h2>
        <p className="text-sm text-slate-500 mt-0.5">Subjects you handle this semester, with enrolled students</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Subjects', value: mySubjects.length, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Students', value: mySubjects.reduce((s, sub) => s + (STUDENTS[sub.code]?.length || 0), 0), icon: Users, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Credits', value: mySubjects.reduce((s, sub) => s + sub.credits, 0), icon: Layers, color: 'text-purple-600 bg-purple-50' },
        ].map(stat => (
          <div key={stat.label} className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Subject Cards */}
      <div className="space-y-4">
        {mySubjects.map((sub) => {
          const students = STUDENTS[sub.code] || [];
          const isExpanded = expandedSubject === sub.code;
          return (
            <div key={sub.code} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                onClick={() => setExpandedSubject(isExpanded ? null : sub.code)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">{sub.code}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${colorPill[sub.dept] || 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                      {sub.dept}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{sub.name}</h3>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> Year {sub.year} · Sem {sub.semester} · Sec {sub.section}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {students.length} students</span>
                    <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> {sub.credits} credits</span>
                  </div>
                </div>
                <div className="shrink-0">
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </div>

              {/* Expanded student table */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-600">Enrolled Students ({students.length})</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider w-8">#</th>
                          <th className="text-left px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Roll No.</th>
                          <th className="text-left px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                          <th className="text-left px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {students.map((stu, idx) => (
                          <tr key={stu.rollNo} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-2.5 text-slate-400 font-medium">{idx + 1}</td>
                            <td className="px-5 py-2.5 font-bold text-slate-700">{stu.rollNo}</td>
                            <td className="px-5 py-2.5 font-semibold text-slate-900">{stu.name}</td>
                            <td className="px-5 py-2.5 text-slate-500 hidden sm:table-cell">{stu.phone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
