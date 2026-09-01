import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  RotateCcw, 
  ChevronRight, 
  Check, 
  User, 
  GraduationCap, 
  Users, 
  FileText,
  CheckCircle2
} from 'lucide-react';

export default function AddStudentWizard({ onBack, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    studentId: 'STU008 (Auto-generated)',
    admissionNo: 'ADM2024008',
    fullName: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    email: '',
    mobile: '',
    address: '',

    // Step 2: Academic Info
    department: 'Computer Science',
    course: 'B.Tech',
    semester: '1st Sem',
    academicYear: '2026-2027',
    rollNo: '24CS008',

    // Step 3: Parent Info
    fatherName: '',
    motherName: '',
    parentMobile: '',
    parentOccupation: '',
    emergencyContact: '',

    // Step 4: Documents
    doc10th: null,
    doc12th: null,
    docTc: null,
    docAadhaar: null
  });

  const steps = [
    { number: 1, label: 'Personal Info', icon: User },
    { number: 2, label: 'Academic Info', icon: GraduationCap },
    { number: 3, label: 'Parent Info', icon: Users },
    { number: 4, label: 'Documents', icon: FileText }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete registration
      if (onComplete) {
        onComplete(formData);
      } else {
        alert("Student registered successfully!");
        onBack();
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Back Link */}
      <button 
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add New Student</h1>
        <p className="text-xs text-slate-500 mt-1">Complete all steps to register a student</p>
      </div>

      {/* STEPPER PROGRESS BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between relative">
          
          {/* Progress Line */}
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0"></div>
          <div 
            className="absolute left-8 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 transition-all duration-300 -z-0"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          ></div>

          {steps.map((step) => {
            const isCompleted = currentStep > step.number;
            const isActive = currentStep === step.number;
            const Icon = step.icon;

            return (
              <div key={step.number} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                    isCompleted 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : isActive 
                        ? 'bg-white text-blue-600 border-2 border-blue-600 shadow-md' 
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.number}
                </div>
                <span className={`text-xs font-bold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}

        </div>
      </div>

      {/* STEP CONTENT CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
        
        {/* STEP 1: PERSONAL INFORMATION */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Personal Information
            </h2>

            {/* Photo Upload Circle */}
            <div className="flex justify-center my-4">
              <label className="w-32 h-32 rounded-full border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 flex items-center justify-center mb-1 transition-all">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-600">Photo</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              
              {/* Student ID */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Student ID</label>
                <input 
                  type="text" 
                  disabled
                  value={formData.studentId}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-semibold cursor-not-allowed"
                />
              </div>

              {/* Admission No. */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Admission No.</label>
                <input 
                  type="text"
                  value={formData.admissionNo}
                  onChange={(e) => handleInputChange('admissionNo', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Full Name</label>
                <input 
                  type="text"
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Date of Birth</label>
                <input 
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Gender</label>
                <select 
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Blood Group */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Blood Group</label>
                <select 
                  value={formData.bloodGroup}
                  onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              {/* Email */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Email</label>
                <input 
                  type="email"
                  placeholder="student@college.edu"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Mobile Number</label>
                <input 
                  type="text"
                  placeholder="+91"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Address (Full width) */}
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1.5">Address</label>
                <textarea 
                  rows="3"
                  placeholder="Full address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
                ></textarea>
              </div>

            </div>
          </div>
        )}

        {/* STEP 2: ACADEMIC INFORMATION */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Academic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Department</label>
                <select 
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electronics">Electronics</option>
                  <option value="MBA">MBA</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Course</label>
                <select 
                  value={formData.course}
                  onChange={(e) => handleInputChange('course', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                >
                  <option value="B.Tech">B.Tech</option>
                  <option value="MBA">MBA</option>
                  <option value="MCA">MCA</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Semester</label>
                <select 
                  value={formData.semester}
                  onChange={(e) => handleInputChange('semester', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                >
                  <option value="1st Sem">1st Sem</option>
                  <option value="2nd Sem">2nd Sem</option>
                  <option value="3rd Sem">3rd Sem</option>
                  <option value="4th Sem">4th Sem</option>
                  <option value="5th Sem">5th Sem</option>
                  <option value="6th Sem">6th Sem</option>
                  <option value="7th Sem">7th Sem</option>
                  <option value="8th Sem">8th Sem</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Academic Year</label>
                <input 
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) => handleInputChange('academicYear', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Roll Number</label>
                <input 
                  type="text"
                  value={formData.rollNo}
                  onChange={(e) => handleInputChange('rollNo', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PARENT INFORMATION */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Parent Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Father's Name</label>
                <input 
                  type="text"
                  placeholder="Father's full name"
                  value={formData.fatherName}
                  onChange={(e) => handleInputChange('fatherName', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Mother's Name</label>
                <input 
                  type="text"
                  placeholder="Mother's full name"
                  value={formData.motherName}
                  onChange={(e) => handleInputChange('motherName', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Parent Mobile Number</label>
                <input 
                  type="text"
                  placeholder="+91"
                  value={formData.parentMobile}
                  onChange={(e) => handleInputChange('parentMobile', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Emergency Contact</label>
                <input 
                  type="text"
                  placeholder="+91"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: DOCUMENTS */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Upload Documents
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {['10th Marksheet', '12th / Diploma Certificate', 'Transfer Certificate (TC)', 'Identity Proof (Aadhaar/Passport)'].map((doc, idx) => (
                <div key={idx} className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-center space-y-2 hover:border-blue-500 transition-all cursor-pointer">
                  <Upload className="w-6 h-6 text-slate-400" />
                  <p className="font-bold text-slate-800">{doc}</p>
                  <p className="text-[11px] text-slate-400">PDF, JPG or PNG (Max 5MB)</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM ACTION BAR */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          
          {/* Save Draft */}
          <button 
            type="button"
            onClick={() => alert("Draft saved successfully!")}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-900 text-xs font-bold transition-all"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            Save Draft
          </button>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button 
                type="button"
                onClick={handlePrev}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                Previous Step
              </button>
            )}

            <button 
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
            >
              {currentStep === 4 ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Register Student
                </>
              ) : (
                <>
                  Next Step <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
