# 🎓 VCAS - Vivekananda College of Arts and Science, Vellalankulam
## Campus Automation & Management System

VCAS (Vellalankulam Campus Automation System) is a modern, responsive, and full-featured web portal built for managing academic, financial, student, staff, examination, and administrative operations of **Vivekananda College of Arts and Science, Vellalankulam**.

---

## 🌟 Key Features

### 🔐 1. Authentication & Session Persistence
- **Secure VCAS Portal Login**: Clean, centered login card with role selection (`Admin` and `Staff`).
- **Session & Page State Persistence**: Utilizes `sessionStorage` to keep users logged in across page refreshes (F5) and preserve their active navigation tab.
- **Clean `/login` & `/dashboard` URL Routing**.

### 💼 2. Finance & Fee Management (`/FINANCE`)
Modular fee management architecture split into dedicated components:
- **Exam Fees (`ExamFeesManagement.jsx`)**: Record and track student examination fee entries with due date and fine tracking.
- **Tuition Fees (`TuitionFeesManagement.jsx`)**: Dedicated tuition fee form with right-side **Field Explanation** guidance panel.
- **Transport Fees (`TransportFeesManagement.jsx`)**: Bus fee collection form with manual route/stop entry, vehicle selection, and notice banner.
- **Dynamic Fee Filtering & In-Place Table Updates**: Live filtering by fee category (`All`, `Exam Fees`, `Tuition Fees`, `Transport Fees`).
- **Payment Receipts & Print Feature**: Instant modal popup for fee receipt generation and direct browser printing.

### 📚 3. Academic & Institutional Modules (`/ACADEMIC`)
- **Students Management (`StudentsPage.jsx` & `AddStudentWizard.jsx`)**: Full student profile directory, search, filter, and step-by-step wizard for new student admissions.
- **Staff & Faculty Directory (`StaffManagement.jsx` & `StaffDetailView.jsx`)**: Complete staff directory and individual profile management.
- **Departments & Courses (`DepartmentManagement.jsx` & `CourseSubjectManagement.jsx`)**: Departmental organization and course/subject curriculum mapping.
- **Attendance & Examinations (`AttendanceManagement.jsx` & `ExaminationManagement.jsx`)**: Daily attendance tracking and exam timetable/results portal.
- **Timetable & Assignments (`TimetableManagement.jsx` & `AssignmentManagement.jsx`)**: Class schedules and student assignment submissions.

---

## 🏗️ Project Architecture & Component Structure

```
VCAS/
├── public/
├── src/
│   ├── components/
│   │   ├── AddStudentWizard.jsx        # Admission Wizard Modal
│   │   ├── AssignmentManagement.jsx    # Assignments Portal
│   │   ├── AttendanceManagement.jsx    # Daily Attendance Module
│   │   ├── CourseSubjectManagement.jsx # Course & Curriculum Mapping
│   │   ├── Dashboard.jsx               # Main Dashboard Container & Left Sidebar
│   │   ├── DepartmentManagement.jsx    # Departmental Records
│   │   ├── ExamFeesManagement.jsx      # Standalone Exam Fees Form Module
│   │   ├── ExaminationManagement.jsx  # Exam Schedules & Results
│   │   ├── FeeManagement.jsx           # Parent Fee Manager & Table Directory
│   │   ├── LoginCard.jsx               # Centered VCAS Login Portal
│   │   ├── StaffDetailView.jsx         # Staff Profile Modal
│   │   ├── StaffManagement.jsx         # Staff Directory
│   │   ├── StudentProfileView.jsx      # Student Profile Drawer
│   │   ├── StudentsPage.jsx            # Student Records & Actions
│   │   ├── TimetableManagement.jsx     # Class & Lab Timetables
│   │   ├── TransportFeesManagement.jsx # Standalone Transport Fees Module
│   │   └── TuitionFeesManagement.jsx   # Standalone Tuition Fees Module
│   ├── App.jsx                         # Main Application Entry & Routing
│   ├── index.css                       # Global Tailwind CSS Styles
│   └── main.jsx                        # React DOM Root Mounting
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md                           # Project Documentation
```

---

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS
- **Icon Library**: Lucide React
- **Build Tool**: Vite 6

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 2. Installation
```bash
# Clone or navigate to project directory
cd VCAS

# Install dependencies
npm install
```

### 3. Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173/login`.

### 4. Production Build
```bash
# Compile and bundle for production
npm run build

# Preview production build
npm run preview
```

---

## 📄 License & Copyright

© 2026 **Vivekananda College of Arts and Science, Vellalankulam**. All rights reserved.
