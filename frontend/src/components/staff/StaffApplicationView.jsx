import React, { useRef, useState } from 'react';
import { 
  Printer, 
  Download, 
  FileText, 
  ExternalLink, 
  Award, 
  Briefcase, 
  GraduationCap, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Building2, 
  FileCheck,
  Eye,
  X
} from 'lucide-react';
import vcasLogo from '../../assets/vcas-logo.png';

export default function StaffApplicationView({ staff = {}, onClose = null, showCloseButton = false }) {
  const printAreaRef = useRef(null);
  const [activeDocPreview, setActiveDocPreview] = useState(null); // { title, url }

  // Fallbacks & normalized data
  const name = staff.name || staff.fullName || '—';
  const postAppliedFor = staff.postAppliedFor || staff.designation || 'Assistant Professor';
  const department = staff.department || '—';
  const empId = staff.empId || staff.staffId || '—';
  const dob = staff.dob || '—';
  const age = staff.age || '—';
  const gender = staff.gender || 'Female';
  const maritalStatus = staff.maritalStatus || '—';
  const fatherOrSpouseName = staff.fatherOrSpouseName || '—';
  const nationality = staff.nationality || 'Indian';
  const religion = staff.religion || '—';
  const community = staff.community || '—';
  const caste = staff.caste || '—';
  const permanentAddress = staff.permanentAddress || staff.address || '—';
  const communicationAddress = staff.communicationAddress || staff.address || '—';
  const phone = staff.phone || '—';
  const whatsapp = staff.whatsapp || staff.phone || '—';
  const email = staff.email || '—';
  const profileImage = staff.profileImage || '';

  // Qualifications
  const qualifications = Array.isArray(staff.academicQualifications) && staff.academicQualifications.length > 0
    ? staff.academicQualifications
    : [
        { degree: 'NET / SET', specialization: staff.netSetExamStatus || '—', institution: '—', mode: 'Regular', percentageOrCgpa: '—', yearOfPassing: '—' },
        { degree: 'Ph.D', specialization: '—', institution: '—', mode: 'Regular', percentageOrCgpa: '—', yearOfPassing: '—' },
        { degree: 'M.Phil', specialization: '—', institution: '—', mode: 'Regular', percentageOrCgpa: '—', yearOfPassing: '—' },
        { degree: 'PG', specialization: staff.qualification || '—', institution: '—', mode: 'Regular', percentageOrCgpa: '—', yearOfPassing: '—' },
        { degree: 'UG', specialization: '—', institution: '—', mode: 'Regular', percentageOrCgpa: '—', yearOfPassing: '—' },
        { degree: 'HSC', specialization: 'General', institution: '—', mode: 'Regular', percentageOrCgpa: '—', yearOfPassing: '—' },
        { degree: 'SSLC', specialization: 'General', institution: '—', mode: 'Regular', percentageOrCgpa: '—', yearOfPassing: '—' }
      ];

  // Experiences
  const experiences = Array.isArray(staff.experienceDetails) && staff.experienceDetails.length > 0
    ? staff.experienceDetails
    : [
        {
          institutionOrIndustry: staff.department ? `Vivekanandha College of Arts and Sciences - Dept of ${staff.department}` : '—',
          position: staff.designation || 'Faculty',
          from: staff.joiningDate || '—',
          to: 'Present',
          duration: staff.experience || '—'
        }
      ];

  // Publications
  const pubs = staff.publications || {
    nationalConferences: 0,
    nationalJournals: 0,
    internationalConferences: 0,
    internationalJournals: 0,
    patentsFiled: 0,
    patentsGranted: 0
  };

  // Programmes
  const progs = staff.programmes || {
    conferencesOrganized: 0,
    conferencesAttended: 0,
    workshopsOrganized: 0,
    workshopsAttended: 0,
    fdpOrganized: 0,
    fdpAttended: 0
  };

  // Project Funds
  const projectFunds = Array.isArray(staff.projectFunds) ? staff.projectFunds : [];

  // References
  const references = Array.isArray(staff.references) && staff.references.length > 0
    ? staff.references
    : [
        { name: '—', designation: '—', institution: '—', contactNo: '—', email: '—' },
        { name: '—', designation: '—', institution: '—', contactNo: '—', email: '—' }
      ];

  const payExpected = staff.payExpected || '—';
  const payLastObtained = staff.payLastObtained || '—';
  const place = staff.place || 'Elayampalayam';
  const applicationDate = staff.applicationDate || staff.joiningDate || new Date().toISOString().split('T')[0];
  const otherInformation = staff.otherInformation || 'None';

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action / Toolbar Header (Hidden during print) */}
      <div className="print:hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              Official Faculty Application Form
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                2-Page College Format
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Vivekanandha College of Arts and Sciences for Women (Autonomous) official teaching post application
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Application Form (2-Page A4)</span>
          </button>
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Embedded Print CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #vcas-official-printable-application, #vcas-official-printable-application * {
            visibility: visible;
          }
          #vcas-official-printable-application {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            font-size: 11px !important;
            color: #000000 !important;
          }
          .print-page-break {
            page-break-after: always;
            break-after: page;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 14mm;
          }
        }
      `}} />

      {/* ========================================================================= */}
      {/* 2-PAGE OFFICIAL APPLICATION CONTAINER */}
      {/* ========================================================================= */}
      <div 
        id="vcas-official-printable-application" 
        ref={printAreaRef}
        className="bg-white rounded-3xl border border-slate-300 shadow-lg p-6 sm:p-10 font-sans text-slate-900 max-w-4xl mx-auto space-y-8 print:border-none print:shadow-none print:p-0 print:space-y-0"
      >
        
        {/* ======================================================================= */}
        {/* PAGE 1: PERSONAL DETAILS, QUALIFICATIONS & EXPERIENCE                   */}
        {/* ======================================================================= */}
        <div className="print-page-break space-y-5 pb-6">
          
          {/* Official Institution Header */}
          <div className="border-b-2 border-slate-900 pb-3 text-center relative">
            <div className="flex items-center justify-center gap-3 mb-1">
              <img src={vcasLogo} alt="VCAS Logo" className="w-14 h-14 object-contain" />
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-wide text-slate-900 uppercase font-serif">
                  Vivekanandha College of Arts and Sciences for Women
                </h1>
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  (Autonomous)
                </p>
                <p className="text-[10px] text-slate-600 font-medium">
                  Affiliated to Periyar University, Re-accredited with 'A+' Grade by NAAC
                </p>
                <p className="text-[10px] text-slate-600 font-medium">
                  Elayampalayam - 637 205, Tiruchengode, Namakkal Dt., Tamil Nadu.
                </p>
              </div>
            </div>

            <div className="inline-block mt-2 px-6 py-1 bg-slate-900 text-white rounded-md">
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                Application for Teaching Post
              </h2>
            </div>

            {/* Post & Department Row */}
            <div className="mt-3 grid grid-cols-2 text-left text-xs font-bold border border-slate-800 p-2 bg-slate-50">
              <div>
                <span className="text-slate-600">Post Applied for: </span>
                <span className="text-slate-900 font-black uppercase">{postAppliedFor}</span>
              </div>
              <div>
                <span className="text-slate-600">Department: </span>
                <span className="text-slate-900 font-black uppercase">{department}</span>
              </div>
            </div>
          </div>

          {/* Section 1: Personal Details */}
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              
              {/* Left Column Details */}
              <div className="flex-1 space-y-2 text-xs">
                
                {/* 1. Name */}
                <div className="grid grid-cols-12 gap-2 py-1 border-b border-slate-200">
                  <span className="col-span-5 font-bold text-slate-700">1. Name of the Applicant:</span>
                  <span className="col-span-7 font-black text-slate-900 uppercase tracking-wide">{name}</span>
                </div>

                {/* 2. DOB & Age */}
                <div className="grid grid-cols-12 gap-2 py-1 border-b border-slate-200">
                  <span className="col-span-5 font-bold text-slate-700">2. Date of Birth &amp; Age:</span>
                  <span className="col-span-7 font-semibold text-slate-900">
                    {dob} &nbsp; ({age ? `${age} Years` : '—'})
                  </span>
                </div>

                {/* 3. Gender */}
                <div className="grid grid-cols-12 gap-2 py-1 border-b border-slate-200">
                  <span className="col-span-5 font-bold text-slate-700">3. Gender:</span>
                  <span className="col-span-7 font-semibold text-slate-900">{gender}</span>
                </div>

                {/* 4. Marital Status */}
                <div className="grid grid-cols-12 gap-2 py-1 border-b border-slate-200">
                  <span className="col-span-5 font-bold text-slate-700">4. Marital Status:</span>
                  <span className="col-span-7 font-semibold text-slate-900">{maritalStatus}</span>
                </div>

                {/* 5. Father / Spouse */}
                <div className="grid grid-cols-12 gap-2 py-1 border-b border-slate-200">
                  <span className="col-span-5 font-bold text-slate-700">5. Father's / Husband's Name:</span>
                  <span className="col-span-7 font-semibold text-slate-900">{fatherOrSpouseName}</span>
                </div>

                {/* 6. Nationality & Religion */}
                <div className="grid grid-cols-12 gap-2 py-1 border-b border-slate-200">
                  <span className="col-span-5 font-bold text-slate-700">6. Nationality &amp; Religion:</span>
                  <span className="col-span-7 font-semibold text-slate-900">{nationality} / {religion}</span>
                </div>

                {/* 7. Community & Caste */}
                <div className="grid grid-cols-12 gap-2 py-1 border-b border-slate-200">
                  <span className="col-span-5 font-bold text-slate-700">7. Community &amp; Caste:</span>
                  <span className="col-span-7 font-bold text-slate-900">
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-black mr-2">
                      {community}
                    </span>
                    Caste: {caste}
                  </span>
                </div>

              </div>

              {/* Top-Right Passport Photo Box */}
              <div className="w-28 h-36 border-2 border-slate-800 rounded flex flex-col items-center justify-center p-1 shrink-0 bg-slate-50 text-center">
                {profileImage ? (
                  <img src={profileImage} alt={name} className="w-full h-full object-cover rounded" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 p-2">
                    <User className="w-8 h-8 mb-1 stroke-1" />
                    <span className="text-[9px] font-bold uppercase leading-tight">Affix Recent Passport Photo</span>
                  </div>
                )}
              </div>

            </div>

            {/* 8. Addresses & Contact */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs border border-slate-300 p-2.5 rounded bg-slate-50/50">
              <div>
                <p className="font-bold text-slate-800 mb-1 border-b border-slate-200 pb-0.5">
                  8. (a) Address for Communication:
                </p>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed min-h-[44px]">
                  {communicationAddress}
                </p>
                <div className="mt-2 text-[11px] space-y-0.5 text-slate-800 font-medium">
                  <p><span className="font-bold">Mobile:</span> {phone}</p>
                  <p><span className="font-bold">WhatsApp:</span> {whatsapp}</p>
                  <p><span className="font-bold">Email:</span> {email}</p>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-800 mb-1 border-b border-slate-200 pb-0.5">
                  8. (b) Permanent Address:
                </p>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed min-h-[44px]">
                  {permanentAddress}
                </p>
                <div className="mt-2 text-[11px] space-y-0.5 text-slate-800 font-medium">
                  <p><span className="font-bold">Staff ID:</span> <span className="font-mono">{empId}</span></p>
                  <p><span className="font-bold">Aadhaar:</span> <span className="font-mono">{staff.aadhaar || '—'}</span></p>
                  <p><span className="font-bold">PAN:</span> <span className="font-mono">{staff.pan || '—'}</span></p>
                </div>
              </div>
            </div>

          </div>

          {/* Section 2: Educational Qualifications Table */}
          <div className="space-y-1.5 pt-2">
            <h3 className="text-xs font-black uppercase text-slate-900">
              9. Educational Qualifications (Starting from Highest):
            </h3>

            <div className="overflow-x-auto border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-800">
                    <th className="p-1.5 border-r border-slate-800 w-8 text-center">S.No</th>
                    <th className="p-1.5 border-r border-slate-800 w-24">Exam Passed</th>
                    <th className="p-1.5 border-r border-slate-800">Degree &amp; Specialization</th>
                    <th className="p-1.5 border-r border-slate-800">School / College / University</th>
                    <th className="p-1.5 border-r border-slate-800 w-20 text-center">Mode</th>
                    <th className="p-1.5 border-r border-slate-800 w-16 text-center">% / CGPA</th>
                    <th className="p-1.5 w-16 text-center">Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-[11px]">
                  {qualifications.map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-1.5 border-r border-slate-800 text-center font-bold">{idx + 1}</td>
                      <td className="p-1.5 border-r border-slate-800 font-bold">{q.degree}</td>
                      <td className="p-1.5 border-r border-slate-800">{q.specialization || '—'}</td>
                      <td className="p-1.5 border-r border-slate-800">{q.institution || '—'}</td>
                      <td className="p-1.5 border-r border-slate-800 text-center">{q.mode || 'Regular'}</td>
                      <td className="p-1.5 border-r border-slate-800 text-center font-semibold">{q.percentageOrCgpa || '—'}</td>
                      <td className="p-1.5 text-center font-mono">{q.yearOfPassing || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Experience Details Table */}
          <div className="space-y-1.5 pt-2">
            <h3 className="text-xs font-black uppercase text-slate-900">
              10. Experience Details (Teaching / Research / Industry):
            </h3>

            <div className="overflow-x-auto border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-800">
                    <th className="p-1.5 border-r border-slate-800 w-8 text-center">S.No</th>
                    <th className="p-1.5 border-r border-slate-800">Name of Institution / Industry</th>
                    <th className="p-1.5 border-r border-slate-800">Position / Designation</th>
                    <th className="p-1.5 border-r border-slate-800 w-24 text-center">From</th>
                    <th className="p-1.5 border-r border-slate-800 w-24 text-center">To</th>
                    <th className="p-1.5 w-24 text-center">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-[11px]">
                  {experiences.map((exp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-1.5 border-r border-slate-800 text-center font-bold">{idx + 1}</td>
                      <td className="p-1.5 border-r border-slate-800 font-medium">{exp.institutionOrIndustry || '—'}</td>
                      <td className="p-1.5 border-r border-slate-800 font-bold">{exp.position || '—'}</td>
                      <td className="p-1.5 border-r border-slate-800 text-center font-mono">{exp.from || '—'}</td>
                      <td className="p-1.5 border-r border-slate-800 text-center font-mono">{exp.to || '—'}</td>
                      <td className="p-1.5 text-center font-semibold">{exp.duration || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-right text-[10px] font-bold text-slate-400 pt-3">
            Page 1 of 2
          </div>

        </div>


        {/* ======================================================================= */}
        {/* PAGE 2: RESEARCH, PROGRAMMES, PROJECT FUNDS, REFERENCES & DECLARATION    */}
        {/* ======================================================================= */}
        <div className="space-y-4 pt-4 print:pt-0">
          
          {/* Header on Page 2 for continuity */}
          <div className="border-b border-slate-800 pb-2 flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase text-slate-800">
              Vivekanandha College of Arts and Sciences for Women (Autonomous)
            </span>
            <span className="font-bold text-slate-500">
              Applicant: <span className="text-slate-900 uppercase font-black">{name}</span> ({empId})
            </span>
          </div>

          {/* Section 4 & 5: Publications and Programmes (Side by side on Page 2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 11. Publications (Numbers Only) */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-black uppercase text-slate-900">
                11. Publication Details (Numbers Only):
              </h3>
              <div className="border border-slate-800">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-800 text-[10px] font-black uppercase text-slate-800">
                      <th className="p-1.5 border-r border-slate-800 text-left">Category</th>
                      <th className="p-1.5 w-16 text-center">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-[11px]">
                    <tr>
                      <td className="p-1.5 border-r border-slate-800">National Conferences</td>
                      <td className="p-1.5 text-center font-bold">{pubs.nationalConferences ?? 0}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border-r border-slate-800">International Conferences</td>
                      <td className="p-1.5 text-center font-bold">{pubs.internationalConferences ?? 0}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border-r border-slate-800">National Journals</td>
                      <td className="p-1.5 text-center font-bold">{pubs.nationalJournals ?? 0}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border-r border-slate-800">International Journals</td>
                      <td className="p-1.5 text-center font-bold">{pubs.internationalJournals ?? 0}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border-r border-slate-800">Patents Filed</td>
                      <td className="p-1.5 text-center font-bold">{pubs.patentsFiled ?? 0}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border-r border-slate-800">Patents Granted</td>
                      <td className="p-1.5 text-center font-bold">{pubs.patentsGranted ?? 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 12. Programmes Organized / Attended (Numbers Only) */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-black uppercase text-slate-900">
                12. Programmes Organized / Attended:
              </h3>
              <div className="border border-slate-800">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-800 text-[10px] font-black uppercase text-slate-800">
                      <th className="p-1.5 border-r border-slate-800 text-left">Category</th>
                      <th className="p-1.5 border-r border-slate-800 w-16 text-center">Organized</th>
                      <th className="p-1.5 w-16 text-center">Attended</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-[11px]">
                    <tr>
                      <td className="p-1.5 border-r border-slate-800">Conferences</td>
                      <td className="p-1.5 border-r border-slate-800 text-center font-bold">{progs.conferencesOrganized ?? 0}</td>
                      <td className="p-1.5 text-center font-bold">{progs.conferencesAttended ?? 0}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border-r border-slate-800">Workshops</td>
                      <td className="p-1.5 border-r border-slate-800 text-center font-bold">{progs.workshopsOrganized ?? 0}</td>
                      <td className="p-1.5 text-center font-bold">{progs.workshopsAttended ?? 0}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border-r border-slate-800">FDP / SDP / STTP</td>
                      <td className="p-1.5 border-r border-slate-800 text-center font-bold">{progs.fdpOrganized ?? 0}</td>
                      <td className="p-1.5 text-center font-bold">{progs.fdpAttended ?? 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Section 6: Project Funds Received from External Agencies */}
          <div className="space-y-1.5 pt-1">
            <h3 className="text-xs font-black uppercase text-slate-900">
              13. Project Funds Received from External Agencies:
            </h3>

            <div className="overflow-x-auto border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-800 text-[10px] font-black uppercase text-slate-800">
                    <th className="p-1.5 border-r border-slate-800 w-8 text-center">S.No</th>
                    <th className="p-1.5 border-r border-slate-800">Agency Name</th>
                    <th className="p-1.5 border-r border-slate-800 w-24 text-center">Amount (Lakhs)</th>
                    <th className="p-1.5 border-r border-slate-800">Scheme Name</th>
                    <th className="p-1.5 border-r border-slate-800">Title of the Project</th>
                    <th className="p-1.5 w-28 text-center">Duration &amp; Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-[11px]">
                  {projectFunds.length > 0 ? (
                    projectFunds.map((pf, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-1.5 border-r border-slate-800 text-center font-bold">{idx + 1}</td>
                        <td className="p-1.5 border-r border-slate-800 font-bold">{pf.agencyName || '—'}</td>
                        <td className="p-1.5 border-r border-slate-800 text-center font-semibold">₹ {pf.amountInLakhs || 0} L</td>
                        <td className="p-1.5 border-r border-slate-800">{pf.schemeName || '—'}</td>
                        <td className="p-1.5 border-r border-slate-800">{pf.projectTitle || '—'}</td>
                        <td className="p-1.5 text-center font-mono">{pf.durationAndPeriod || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-2 text-center text-slate-400 italic font-medium">
                        Nil / No external sponsored projects recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 7: Any Other Information */}
          <div className="space-y-1 pt-1">
            <h3 className="text-xs font-black uppercase text-slate-900">
              14. Any Other Relevant Information:
            </h3>
            <div className="p-2 border border-slate-800 rounded bg-slate-50/50 min-h-[38px] text-xs text-slate-700 leading-relaxed">
              {otherInformation}
            </div>
          </div>

          {/* Section 8: References */}
          <div className="space-y-1.5 pt-1">
            <h3 className="text-xs font-black uppercase text-slate-900">
              15. Reference Person Details:
            </h3>

            <div className="max-w-xl text-xs">
              {references.slice(0, 1).map((ref, idx) => (
                <div key={idx} className="border border-slate-800 p-2.5 rounded bg-slate-50 space-y-1">
                  <p className="font-black text-slate-900 border-b border-slate-300 pb-0.5">
                    Reference: {ref.name || '—'}
                  </p>
                  <p className="text-slate-700 font-semibold">{ref.designation || '—'}</p>
                  <p className="text-slate-600 text-[11px]">{ref.institution || '—'}</p>
                  <div className="pt-1 text-[11px] text-slate-800 flex flex-wrap gap-x-4">
                    <span><span className="font-bold">Contact:</span> {ref.contactNo || '—'}</span>
                    <span><span className="font-bold">Email:</span> {ref.email || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 9: Pay & Declaration */}
          <div className="space-y-3 pt-2">
            {/* Pay Details */}
            <div className="grid grid-cols-2 gap-4 text-xs font-bold border border-slate-800 p-2 bg-slate-100">
              <div>
                <span className="text-slate-600">Pay Expected (Rs.): </span>
                <span className="text-slate-900 font-black">₹ {payExpected} / Month</span>
              </div>
              <div>
                <span className="text-slate-600">Pay Last Drawn (Rs.): </span>
                <span className="text-slate-900 font-black">₹ {payLastObtained} / Month</span>
              </div>
            </div>

            {/* Declaration Box */}
            <div className="border border-slate-800 p-3 bg-white space-y-3">
              <p className="text-[11px] font-serif leading-relaxed text-slate-800 text-justify">
                <strong>Declaration:</strong> I hereby declare that the particulars given in this application are true, 
                complete and correct to the best of my knowledge and belief. In the event of any information being found 
                false or incorrect at any stage, my candidature / appointment shall be liable to be rejected / terminated.
              </p>

              <div className="flex items-end justify-between pt-4 text-xs font-bold text-slate-900">
                <div className="space-y-1">
                  <p>Place: <span className="font-semibold underline decoration-dotted">{place}</span></p>
                  <p>Date: <span className="font-semibold underline decoration-dotted">{applicationDate}</span></p>
                </div>
                <div className="text-right space-y-1">
                  <div className="h-8 flex items-end justify-end">
                    <span className="font-serif italic font-bold text-slate-700 text-sm">
                      {name}
                    </span>
                  </div>
                  <p className="border-t border-slate-800 pt-1 text-[10px] uppercase font-black tracking-wider">
                    Signature of the Applicant
                  </p>
                </div>
              </div>
            </div>

          </div>

          <div className="text-right text-[10px] font-bold text-slate-400 pt-2">
            Page 2 of 2
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* ATTACHED DOCUMENTS & CERTIFICATES VIEWER (SCREEN ONLY)                    */}
      {/* ========================================================================= */}
      <div className="print:hidden bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Attached Application Enclosures &amp; Verification Documents
              </h3>
              <p className="text-xs text-slate-500">
                Click any uploaded document to inspect or download the original file
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* 1. Educational Qualifications */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Enclosure 1</span>
              <h4 className="text-xs font-bold text-slate-800">Educational Certificates</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                {staff.educationalCertificatesDoc ? 'Uploaded & Available' : 'Not Uploaded'}
              </p>
            </div>
            {staff.educationalCertificatesDoc ? (
              <button
                onClick={() => setActiveDocPreview({ title: 'Educational Qualifications Certificates', url: staff.educationalCertificatesDoc })}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Document</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 italic">No document file</span>
            )}
          </div>

          {/* 2. Proof of Experience */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Enclosure 2</span>
              <h4 className="text-xs font-bold text-slate-800">Experience Proof / Relieving Order</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                {staff.experienceCertificatesDoc ? 'Uploaded & Available' : 'Not Uploaded'}
              </p>
            </div>
            {staff.experienceCertificatesDoc ? (
              <button
                onClick={() => setActiveDocPreview({ title: 'Experience Proof Certificate', url: staff.experienceCertificatesDoc })}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Document</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 italic">No document file</span>
            )}
          </div>

          {/* Optional: NET / SET Certificate (if available) */}
          {staff.netSetExamCertificate && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Enclosure (Additional)</span>
                <h4 className="text-xs font-bold text-slate-800">NET / SET Exam Certificate</h4>
                <p className="text-[11px] text-slate-500 mt-1">{staff.netSetExamStatus || 'Qualified'}</p>
              </div>
              <button
                onClick={() => setActiveDocPreview({ title: 'NET / SET Exam Certificate', url: staff.netSetExamCertificate })}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Document</span>
              </button>
            </div>
          )}

          {/* Optional: Last Pay Certificate (if available) */}
          {staff.lastPayCertificate && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Enclosure (Additional)</span>
                <h4 className="text-xs font-bold text-slate-800">Last Pay Certificate (LPC)</h4>
                <p className="text-[11px] text-slate-500 mt-1">Uploaded &amp; Available</p>
              </div>
              <button
                onClick={() => setActiveDocPreview({ title: 'Last Pay Certificate (LPC)', url: staff.lastPayCertificate })}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Document</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Document Preview Modal */}
      {activeDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-indigo-400" />
                <span className="font-extrabold text-sm">{activeDocPreview.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeDocPreview.url}
                  download={activeDocPreview.title}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setActiveDocPreview(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-950 p-4 flex items-center justify-center overflow-auto">
              {activeDocPreview.url.startsWith('data:application/pdf') ? (
                <iframe
                  src={activeDocPreview.url}
                  title={activeDocPreview.title}
                  className="w-full h-full rounded-xl bg-white border-0"
                />
              ) : (
                <img
                  src={activeDocPreview.url}
                  alt={activeDocPreview.title}
                  className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
