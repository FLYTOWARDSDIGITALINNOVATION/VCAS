import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Building2, 
  BookOpen, 
  ChevronRight,
  Info,
  CalendarDays
} from 'lucide-react';
import { TIMETABLE, SLOT_TIMES } from './staffData';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StaffTimetable({ staffUser }) {
  const currentDayName = DAYS[new Date().getDay() - 1] || 'Monday';
  const [selectedDay, setSelectedDay] = useState(currentDayName);

  const staffSchedule = TIMETABLE[staffUser.staffId] || {};

  const colorPillMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200/60',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/60',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/60',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/60',
  };

  const badgeColorMap = {
    blue: 'bg-blue-600',
    indigo: 'bg-indigo-600',
    purple: 'bg-purple-600',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-600',
    rose: 'bg-rose-600',
  };

  // Compute total weekly lecture and lab counts
  let weeklyLectures = 0;
  let weeklyLabs = 0;
  DAYS.forEach(d => {
    const dayObj = staffSchedule[d] || {};
    Object.values(dayObj).forEach(val => {
      if (val) {
        if (val.type === 'lab') weeklyLabs++;
        else weeklyLectures++;
      }
    });
  });

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Personal Faculty Timetable</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Weekly academic schedule and room allocations for {staffUser.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{weeklyLectures} Theory Sessions/wk</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{weeklyLabs} Lab Hours/wk</span>
          </div>
        </div>
      </div>

      {/* Day Selector Pills for Mobile / Fast Switching */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-200/60 rounded-2xl">
        {DAYS.map(day => {
          const isSelected = selectedDay === day;
          const isToday = currentDayName === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center gap-0.5 ${
                isSelected
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <span>{day}</span>
              {isToday && (
                <span className="text-[9px] text-blue-500 font-extrabold uppercase tracking-wide">
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid: Selected Day Detail View + Full Week Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selected Day Timeline */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">
                {selectedDay}'s Classes
              </h3>
            </div>
            {selectedDay === currentDayName && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-600 rounded-full">
                Active Day
              </span>
            )}
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
            {SLOT_TIMES.map((slotItem, idx) => {
              if (slotItem.isBreak) {
                return (
                  <div key={idx} className="flex items-center gap-3 py-1 px-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 text-xs font-medium">
                    <span className="text-[10px] font-bold uppercase">{slotItem.label}</span>
                    <span className="text-[10px]">({slotItem.time})</span>
                  </div>
                );
              }

              const cls = staffSchedule[selectedDay]?.[slotItem.slot];

              if (!cls) {
                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    <span className="font-semibold text-slate-500">Period {slotItem.slot}</span>
                    <span className="text-[11px]">{slotItem.time}</span>
                    <span className="text-[11px] italic">Free / Research</span>
                  </div>
                );
              }

              return (
                <div 
                  key={idx} 
                  className={`p-3.5 rounded-xl border transition-all ${colorPillMap[cls.color] || 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${badgeColorMap[cls.color] || 'bg-blue-600'}`} />
                      <span className="font-extrabold text-xs tracking-tight">{cls.code} – {cls.name}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/80 border border-slate-200/50">
                      {cls.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 text-[11px] font-medium">
                    <span className="flex items-center gap-1 opacity-80">
                      <Clock className="w-3 h-3" />
                      {slotItem.time}
                    </span>
                    <span className="flex items-center gap-1 font-bold">
                      <Building2 className="w-3 h-3" />
                      {cls.room}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Full Week Matrix Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm">Weekly Timetable Matrix</h3>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="p-3 text-left w-24">Day</th>
                  {[1, 2, 3, 4, 5, 6].map(slot => (
                    <th key={slot} className="p-3 text-center min-w-[100px]">
                      P{slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DAYS.map(day => {
                  const isCurrent = day === currentDayName;
                  return (
                    <tr 
                      key={day} 
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isCurrent ? 'bg-blue-50/30 font-semibold' : ''
                      }`}
                    >
                      <td className="p-3 font-bold text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                          <span>{day.substring(0, 3)}</span>
                        </div>
                      </td>
                      {[1, 2, 3, 4, 5, 6].map(slot => {
                        const cell = staffSchedule[day]?.[slot];
                        if (!cell) {
                          return (
                            <td key={slot} className="p-2 text-center text-slate-300">
                              -
                            </td>
                          );
                        }
                        return (
                          <td key={slot} className="p-2 text-center">
                            <div className={`p-1.5 rounded-lg border text-[11px] font-bold truncate ${colorPillMap[cell.color] || 'bg-slate-50'}`}>
                              <div>{cell.code}</div>
                              <div className="text-[9px] opacity-75 font-normal truncate">{cell.room}</div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
