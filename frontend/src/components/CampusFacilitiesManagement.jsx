import React, { useState } from 'react';
import { 
  Library, 
  Home, 
  Bus, 
  Search, 
  Plus, 
  BookOpen, 
  Users, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Calendar,
  AlertTriangle,
  FileText
} from 'lucide-react';

export default function CampusFacilitiesManagement({ initialTab = 'library' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState('');

  // Books List
  const books = [
    { isbn: '978-0134685991', title: 'Effective Java (3rd Edition)', author: 'Joshua Bloch', copies: '12 / 15 Available', category: 'CS & IT', rack: 'Rack B-4' },
    { isbn: '978-0262033848', title: 'Introduction to Algorithms (CLRS)', author: 'Thomas H. Cormen', copies: '8 / 10 Available', category: 'CS & IT', rack: 'Rack A-2' },
    { isbn: '978-0131873254', title: 'Digital Design & Computer Architecture', author: 'David Harris', copies: '14 / 20 Available', category: 'ECE', rack: 'Rack C-1' },
    { isbn: '978-0073398204', title: 'Thermodynamics: An Engineering Approach', author: 'Yunus A. Cengel', copies: '5 / 8 Available', category: 'Mechanical', rack: 'Rack D-3' }
  ];

  // Hostel Rooms
  const hostelBlocks = [
    { block: 'Ganga Block (Boys)', rooms: 120, capacity: 240, occupied: 218, warden: 'Mr. S. Murugan', contact: '98401 12345' },
    { block: 'Cauvery Block (Boys)', rooms: 100, capacity: 200, occupied: 185, warden: 'Mr. V. Chandran', contact: '98401 12346' },
    { block: 'Yamuna Block (Girls)', rooms: 140, capacity: 280, occupied: 264, warden: 'Dr. Revathi K', contact: '98401 12347' }
  ];

  // Transport Routes
  const busRoutes = [
    { routeNo: 'Route 12', from: 'Tambaram East', via: 'Chromepet, Pallavaram, Guindy', busNo: 'TN-09-CB-4412', driver: 'M. Selvam (98402 11001)', capacity: '52 / 55 Seats' },
    { routeNo: 'Route 18', from: 'Anna Nagar West', via: 'Koyambedu, Vadapalani, Ashok Nagar', busNo: 'TN-09-CB-4418', driver: 'K. Balan (98402 11002)', capacity: '48 / 55 Seats' },
    { routeNo: 'Route 24', from: 'Velachery Bypass', via: 'Medavakkam, Kovilambakkam', busNo: 'TN-09-CB-4424', driver: 'P. Mani (98402 11003)', capacity: '50 / 55 Seats' }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
            {activeTab === 'library' ? <Library className="w-5 h-5" /> : activeTab === 'hostel' ? <Home className="w-5 h-5" /> : <Bus className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Campus Facilities & Infrastructure</h1>
            <p className="text-xs text-slate-500 font-medium">Central Library catalog, student hostel blocks, and college bus fleet tracking</p>
          </div>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'library' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Library className="w-4 h-4" />
            <span>Library</span>
          </button>
          <button
            onClick={() => setActiveTab('hostel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'hostel' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Hostel</span>
          </button>
          <button
            onClick={() => setActiveTab('transport')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'transport' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bus className="w-4 h-4" />
            <span>Transport</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LIBRARY */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Total Volumes</p>
              <p className="text-2xl font-black text-slate-900 mt-1">42,850</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Issued Books</p>
              <p className="text-2xl font-black text-blue-600 mt-1">3,420</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase">E-Journals Access</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">IEEE & Springer</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Overdue Returns</p>
              <p className="text-2xl font-black text-rose-600 mt-1">18</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">Digital Library Catalog & Book Search</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">ISBN</th>
                    <th className="py-3 px-4">Book Title & Author</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Rack Location</th>
                    <th className="py-3 px-4">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {books.map((b, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono text-slate-500">{b.isbn}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{b.title}</p>
                        <p className="text-[10px] text-slate-400">By {b.author}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{b.category}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{b.rack}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{b.copies}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOSTEL */}
      {activeTab === 'hostel' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hostelBlocks.map((h, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{h.block}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{h.rooms} Rooms • Warden: {h.warden}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md font-bold text-[10px]">
                    {h.occupied} / {h.capacity} Occupied
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-600 rounded-full" style={{ width: `${(h.occupied / h.capacity) * 100}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-medium">
                  <span>Helpline: {h.contact}</span>
                  <span className="text-emerald-600 font-bold">Mess Menu: Standard A</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TRANSPORT */}
      {activeTab === 'transport' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {busRoutes.map((r, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      {r.routeNo}
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-900 mt-1.5">{r.from}</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-700">{r.capacity}</span>
                </div>
                <p className="text-[11px] text-slate-500"><strong className="text-slate-700">Via:</strong> {r.via}</p>
                <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>Bus: <strong className="font-mono text-slate-800">{r.busNo}</strong></span>
                  <span>Driver: {r.driver}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
