import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Edit, 
  CheckCircle2, 
  BookOpen, 
  Award, 
  FileText, 
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  GraduationCap
} from 'lucide-react';

export default function StudentProfileView({ student, onBack }) {
  const [activeTab, setActiveTab] = useState('Overview');

  // Fallback defaults matching Figma mockup for Arjun Sharma
  const studentData = {
    name: student?.name || 'Arjun Sharma',
    id: student?.id || 'STU001',
    admNo: student?.admNo || 'ADM2024001',
    course: student?.course || 'B.Tech',
    department: student?.department || 'Computer Science',
    sem: student?.sem || '4th Semester',
    status: student?.status || 'Active',
    attendance: student?.attendance || 88,
    feeStatus: student?.feeStatus || 'Paid',
    cgpa: '8.4',
    rank: '#12',

    // Personal Info
    dob: '15 March 2004',
    gender: 'Male',
    bloodGroup: 'O+',
    email: student?.email || 'arjun.sharma@student.edu',
    mobile: student?.phone || '9876543210',

    // Academic Info
    section: 'A',
    batch: '2022–2026',

    // Parent Info
    fatherName: 'Rakesh Sharma',
    motherName: 'Suman Sharma',
    fatherMobile: '9811001122',
    motherMobile: '9811002233',
    parentOccupation: 'Business',
    parentEmail: 'rakesh.sharma@gmail.com',

    // Address
    address: '14, MG Road, Sector 5',
    city: 'Pune, Maharashtra',
    pinCode: '411001',
    state: 'Maharashtra',
    country: 'India'
  };

  const tabs = ['Overview', 'Attendance', 'Fees', 'Examination', 'Assignments', 'Documents'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Back Navigation Link */}
      <button 
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </button>

      {/* HERO PROFILE HEADER CARD */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Avatar & Student Name Header */}
          <div className="flex items-start md:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-600 font-extrabold text-3xl flex items-center justify-center border border-blue-200 shadow-sm shrink-0">
              {studentData.name.charAt(0)}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900">{studentData.name}</h1>
                <span className="text-xs text-slate-400 font-semibold font-mono">
                  {studentData.id} • {studentData.admNo}
                </span>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  {studentData.course}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
                  {studentData.department}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                  {studentData.sem}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                  {studentData.status}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => alert(`Downloading profile for ${studentData.name}...`)}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 shadow-sm flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Download Profile
            </button>
            <button 
              onClick={() => alert(`Edit profile for ${studentData.name}`)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs flex items-center gap-2 transition-all"
            >
              <Edit className="w-4 h-4 text-slate-400" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Key Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-100 text-center md:text-left">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Attendance</span>
            <span className="text-xl font-extrabold text-emerald-600">{studentData.attendance}%</span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fee Status</span>
            <span className="text-xl font-extrabold text-amber-600">{studentData.feeStatus}</span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">CGPA</span>
            <span className="text-xl font-extrabold text-slate-900">{studentData.cgpa}</span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Rank</span>
            <span className="text-xl font-extrabold text-slate-900">{studentData.rank}</span>
          </div>
        </div>
      </div>

      {/* SUB TABS NAVIGATION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm inline-flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab 
                ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200/60' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB CONTENT */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Personal Information */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <span className="text-slate-400 font-medium">Full Name</span>
              <span className="font-bold text-slate-800">{studentData.name}</span>

              <span className="text-slate-400 font-medium">Date of Birth</span>
              <span className="font-bold text-slate-800">{studentData.dob}</span>

              <span className="text-slate-400 font-medium">Gender</span>
              <span className="font-bold text-slate-800">{studentData.gender}</span>

              <span className="text-slate-400 font-medium">Blood Group</span>
              <span className="font-bold text-slate-800">{studentData.bloodGroup}</span>

              <span className="text-slate-400 font-medium">Email</span>
              <span className="font-bold text-blue-600 font-mono">{studentData.email}</span>

              <span className="text-slate-400 font-medium">Mobile</span>
              <span className="font-bold text-slate-800 font-mono">{studentData.mobile}</span>
            </div>
          </div>

          {/* Academic Information */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Academic Information
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <span className="text-slate-400 font-medium">Student ID</span>
              <span className="font-bold text-slate-800 font-mono">{studentData.id}</span>

              <span className="text-slate-400 font-medium">Admission No.</span>
              <span className="font-bold text-slate-800 font-mono">{studentData.admNo}</span>

              <span className="text-slate-400 font-medium">Course</span>
              <span className="font-bold text-slate-800">{studentData.course}</span>

              <span className="text-slate-400 font-medium">Department</span>
              <span className="font-bold text-slate-800">{studentData.department}</span>

              <span className="text-slate-400 font-medium">Semester</span>
              <span className="font-bold text-slate-800">{studentData.sem}</span>

              <span className="text-slate-400 font-medium">Section</span>
              <span className="font-bold text-slate-800">{studentData.section}</span>

              <span className="text-slate-400 font-medium">Batch</span>
              <span className="font-bold text-slate-800">{studentData.batch}</span>
            </div>
          </div>

          {/* Parent Information */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Parent Information
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <span className="text-slate-400 font-medium">Father Name</span>
              <span className="font-bold text-slate-800">{studentData.fatherName}</span>

              <span className="text-slate-400 font-medium">Mother Name</span>
              <span className="font-bold text-slate-800">{studentData.motherName}</span>

              <span className="text-slate-400 font-medium">Father Mobile</span>
              <span className="font-bold text-slate-800 font-mono">{studentData.fatherMobile}</span>

              <span className="text-slate-400 font-medium">Mother Mobile</span>
              <span className="font-bold text-slate-800 font-mono">{studentData.motherMobile}</span>

              <span className="text-slate-400 font-medium">Occupation</span>
              <span className="font-bold text-slate-800">{studentData.parentOccupation}</span>

              <span className="text-slate-400 font-medium">Email</span>
              <span className="font-bold text-blue-600 font-mono">{studentData.parentEmail}</span>
            </div>
          </div>

          {/* Contact / Address */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Contact / Address
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <span className="text-slate-400 font-medium">Address</span>
              <span className="font-bold text-slate-800">{studentData.address}</span>

              <span className="text-slate-400 font-medium">City</span>
              <span className="font-bold text-slate-800">{studentData.city}</span>

              <span className="text-slate-400 font-medium">Pin Code</span>
              <span className="font-bold text-slate-800 font-mono">{studentData.pinCode}</span>

              <span className="text-slate-400 font-medium">State</span>
              <span className="font-bold text-slate-800">{studentData.state}</span>

              <span className="text-slate-400 font-medium">Country</span>
              <span className="font-bold text-slate-800">{studentData.country}</span>
            </div>
          </div>

        </div>
      )}

      {/* OTHER TABS PLACEHOLDERS */}
      {activeTab !== 'Overview' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <p className="font-bold text-slate-700 text-sm">{activeTab} Details</p>
          <p className="text-xs">Showing {activeTab.toLowerCase()} records for {studentData.name}.</p>
        </div>
      )}

    </div>
  );
}
