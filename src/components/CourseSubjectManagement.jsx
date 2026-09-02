import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Eye, 
  Pencil, 
  Trash2, 
  Search, 
  X, 
  Check, 
  GraduationCap, 
  Building2, 
  Layers, 
  Calendar, 
  Clock, 
  Award, 
  FileText, 
  Download, 
  Filter, 
  Users, 
  ChevronRight, 
  AlertTriangle,
  Sparkles,
  BookMarked,
  LayoutGrid,
  List,
  Printer,
  CheckCircle2,
  Share2,
  BarChart2,
  SlidersHorizontal,
  RotateCcw,
  ArrowRight,
  BookCopy,
  Save
} from 'lucide-react';
import ModalPortal from './ModalPortal';

const INITIAL_PROGRAMS = [
  {
    id: 1,
    code: 'BTECH-CSE',
    name: 'B.Tech in Computer Science & Engineering',
    degreeLevel: 'Undergraduate (UG)',
    department: 'Computer Science',
    regulation: 'Regulation 2024 (R24)',
    durationYears: 4,
    totalSemesters: 8,
    totalCredits: 160,
    enrolledStudents: 340,
    totalSubjects: 42,
    coordinator: 'Dr. Sunita Rao',
    coordinatorEmail: 'sunita.rao@vcas.edu',
    establishedYear: '2008',
    description: 'Comprehensive 4-year engineering program covering Software Systems, AI/ML, Algorithms, Cloud Computing, and Cyber Security.'
  },
  {
    id: 2,
    code: 'BTECH-ECE',
    name: 'B.Tech in Electronics & Communication',
    degreeLevel: 'Undergraduate (UG)',
    department: 'Electronics',
    regulation: 'Regulation 2024 (R24)',
    durationYears: 4,
    totalSemesters: 8,
    totalCredits: 160,
    enrolledStudents: 280,
    totalSubjects: 40,
    coordinator: 'Prof. Ramesh Kumar',
    coordinatorEmail: 'ramesh.kumar@vcas.edu',
    establishedYear: '2010',
    description: 'Specialized 4-year program in VLSI Chip Design, Digital Signal Processing, Embedded IoT Systems, and Telecommunications.'
  },
  {
    id: 3,
    code: 'MBA-MGMT',
    name: 'Master of Business Administration (MBA)',
    degreeLevel: 'Postgraduate (PG)',
    department: 'MBA',
    regulation: 'Regulation 2023 (R23)',
    durationYears: 2,
    totalSemesters: 4,
    totalCredits: 90,
    enrolledStudents: 210,
    totalSubjects: 24,
    coordinator: 'Dr. Anita Desai',
    coordinatorEmail: 'anita.desai@vcas.edu',
    establishedYear: '2012',
    description: 'Industry-driven 2-year leadership program specializing in Financial Management, Marketing Analytics, and HR Operations.'
  },
  {
    id: 4,
    code: 'BTECH-ME',
    name: 'B.Tech in Mechanical Engineering',
    degreeLevel: 'Undergraduate (UG)',
    department: 'Mechanical',
    regulation: 'Regulation 2024 (R24)',
    durationYears: 4,
    totalSemesters: 8,
    totalCredits: 160,
    enrolledStudents: 220,
    totalSubjects: 40,
    coordinator: 'Dr. Pradeep Joshi',
    coordinatorEmail: 'pradeep.joshi@vcas.edu',
    establishedYear: '2009',
    description: 'Core 4-year program in Thermal Engineering, CAD/CAM Modeling, Robotics, and Automobile Manufacturing.'
  },
  {
    id: 5,
    code: 'BTECH-CE',
    name: 'B.Tech in Civil Engineering',
    degreeLevel: 'Undergraduate (UG)',
    department: 'Civil',
    regulation: 'Regulation 2024 (R24)',
    durationYears: 4,
    totalSemesters: 8,
    totalCredits: 160,
    enrolledStudents: 180,
    totalSubjects: 38,
    coordinator: 'Dr. Kavitha Singh',
    coordinatorEmail: 'kavitha.singh@vcas.edu',
    establishedYear: '2011',
    description: 'Infrastructure and smart city design curriculum covering Structural Analysis, Geo-technics, and Environmental Engineering.'
  },
  {
    id: 6,
    code: 'BCA-APP',
    name: 'Bachelor of Computer Applications (BCA)',
    degreeLevel: 'Undergraduate (UG)',
    department: 'BCA',
    regulation: 'Regulation 2024 (R24)',
    durationYears: 3,
    totalSemesters: 6,
    totalCredits: 120,
    enrolledStudents: 150,
    totalSubjects: 32,
    coordinator: 'Prof. Meena Iyer',
    coordinatorEmail: 'meena.iyer@vcas.edu',
    establishedYear: '2015',
    description: '3-year applied computer science program in Web Development, Database Architecture, Mobile Apps, and Cloud Computing.'
  },
  {
    id: 7,
    code: 'BTECH-AIDS',
    name: 'B.Tech in AI & Data Science',
    degreeLevel: 'Undergraduate (UG)',
    department: 'Computer Science',
    regulation: 'Regulation 2024 (R24)',
    durationYears: 4,
    totalSemesters: 8,
    totalCredits: 160,
    enrolledStudents: 120,
    totalSubjects: 42,
    coordinator: 'Dr. Neeraj Gupta',
    coordinatorEmail: 'neeraj.gupta@vcas.edu',
    establishedYear: '2022',
    description: 'Cutting-edge specialization in Deep Learning, Large Language Models, Big Data Pipelines, and Computer Vision.'
  }
];

const INITIAL_SUBJECTS = [
  // Computer Science - Sem 1 to 8
  {
    id: 101,
    code: 'CS101',
    name: 'Python Programming & Problem Solving',
    department: 'Computer Science',
    year: 1,
    sem: 'Sem 1',
    credits: 4,
    type: 'Core Theory',
    faculty: 'Dr. Sunita Rao',
    ltp: '3-1-0',
    hours: '4 hrs/wk (3L + 1T)',
    studentsEnrolled: 120,
    prerequisite: 'None',
    units: [
      { unit: 'Unit 1', title: 'Python Fundamentals & Control Flow', hours: 9 },
      { unit: 'Unit 2', title: 'Data Structures: Lists, Tuples, Dictionaries', hours: 9 },
      { unit: 'Unit 3', title: 'Functions, Modules & File Handling', hours: 9 },
      { unit: 'Unit 4', title: 'Object Oriented Programming in Python', hours: 9 },
      { unit: 'Unit 5', title: 'NumPy, Pandas & Exception Handling', hours: 9 }
    ],
    textbooks: 'Think Python by Allen B. Downey, Python Crash Course by Eric Matthes',
    evaluation: { internal: 40, external: 60 }
  },
  {
    id: 102,
    code: 'CS102',
    name: 'Python Programming Laboratory',
    department: 'Computer Science',
    year: 1,
    sem: 'Sem 1',
    credits: 2,
    type: 'Practical / Lab',
    faculty: 'Dr. Sunita Rao',
    ltp: '0-0-3',
    hours: '3 hrs/wk Lab',
    studentsEnrolled: 120,
    prerequisite: 'CS101 (Co-requisite)',
    units: [
      { unit: 'Lab 1-4', title: 'Basic Syntax, Conditional Branching & Loops', hours: 12 },
      { unit: 'Lab 5-8', title: 'Collections processing, Matrix operations with NumPy', hours: 12 },
      { unit: 'Lab 9-12', title: 'File manipulation, Data visualization & Mini-Project', hours: 12 }
    ],
    textbooks: 'Lab Manual for Python Programming - Vidyapeeth Press',
    evaluation: { internal: 50, external: 50 }
  },
  {
    id: 103,
    code: 'CS201',
    name: 'Object Oriented Programming with Java',
    department: 'Computer Science',
    year: 2,
    sem: 'Sem 3',
    credits: 4,
    type: 'Core Theory',
    faculty: 'Dr. Sunita Rao',
    ltp: '3-1-0',
    hours: '4 hrs/wk (3L + 1T)',
    studentsEnrolled: 115,
    prerequisite: 'CS101',
    units: [
      { unit: 'Unit 1', title: 'OOP Principles, Classes, Objects & JVM Architecture', hours: 9 },
      { unit: 'Unit 2', title: 'Inheritance, Polymorphism & Interfaces', hours: 9 },
      { unit: 'Unit 3', title: 'Exception Handling & Multithreading', hours: 9 },
      { unit: 'Unit 4', title: 'Java Collections Framework & Generics', hours: 9 },
      { unit: 'Unit 5', title: 'Java Streams, Lambda Expressions & JDBC Connection', hours: 9 }
    ],
    textbooks: 'Java: The Complete Reference by Herbert Schildt',
    evaluation: { internal: 40, external: 60 }
  },
  {
    id: 104,
    code: 'CS301',
    name: 'Data Structures & Algorithms',
    department: 'Computer Science',
    year: 2,
    sem: 'Sem 4',
    credits: 4,
    type: 'Core Theory',
    faculty: 'Dr. Sunita Rao',
    ltp: '3-1-0',
    hours: '4 hrs/wk (3L + 1T)',
    studentsEnrolled: 115,
    prerequisite: 'CS201',
    units: [
      { unit: 'Unit 1', title: 'Linear Data Structures: Stacks, Queues, Deques', hours: 9 },
      { unit: 'Unit 2', title: 'Linked Lists & Advanced Trees (AVL, Red-Black, B-Trees)', hours: 10 },
      { unit: 'Unit 3', title: 'Graph Algorithms: BFS, DFS, Dijkstra, Kruskal & Prim', hours: 9 },
      { unit: 'Unit 4', title: 'Algorithm Design: Divide & Conquer, Dynamic Programming', hours: 9 },
      { unit: 'Unit 5', title: 'Greedy Algorithms, NP-Completeness & Approximation', hours: 8 }
    ],
    textbooks: 'Introduction to Algorithms by Cormen, Leiserson, Rivest, Stein (CLRS)',
    evaluation: { internal: 40, external: 60 }
  },
  {
    id: 105,
    code: 'CS401',
    name: 'Database Management Systems',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 5',
    credits: 4,
    type: 'Core Theory',
    faculty: 'Dr. Neeraj Gupta',
    ltp: '3-1-0',
    hours: '4 hrs/wk (3L + 1T)',
    studentsEnrolled: 110,
    prerequisite: 'CS301',
    units: [
      { unit: 'Unit 1', title: 'ER Modeling, Relational Model & Relational Algebra', hours: 9 },
      { unit: 'Unit 2', title: 'Advanced SQL Queries, Subqueries, Triggers & Views', hours: 9 },
      { unit: 'Unit 3', title: 'Functional Dependencies & Normalization (1NF to BCNF)', hours: 9 },
      { unit: 'Unit 4', title: 'Transaction Processing, ACID Properties & Concurrency', hours: 9 },
      { unit: 'Unit 5', title: 'NoSQL Databases (MongoDB) & Query Optimization', hours: 9 }
    ],
    textbooks: 'Database System Concepts by Silberschatz, Korth, Sudarshan',
    evaluation: { internal: 40, external: 60 }
  },
  {
    id: 106,
    code: 'CS502',
    name: 'Artificial Intelligence & Machine Learning',
    department: 'Computer Science',
    year: 3,
    sem: 'Sem 6',
    credits: 4,
    type: 'Professional Elective',
    faculty: 'Dr. Sunita Rao',
    ltp: '3-1-0',
    hours: '4 hrs/wk',
    studentsEnrolled: 98,
    prerequisite: 'CS301, Linear Algebra',
    units: [
      { unit: 'Unit 1', title: 'AI Problem Formulation & Heuristic Search Algorithms', hours: 9 },
      { unit: 'Unit 2', title: 'Supervised Learning: Regression, SVM, Decision Trees', hours: 10 },
      { unit: 'Unit 3', title: 'Unsupervised Learning: K-Means, PCA & Clustering', hours: 9 },
      { unit: 'Unit 4', title: 'Deep Neural Networks, CNNs & Backpropagation', hours: 9 },
      { unit: 'Unit 5', title: 'Reinforcement Learning & Generative AI Overview', hours: 8 }
    ],
    textbooks: 'Pattern Recognition and Machine Learning by Christopher Bishop',
    evaluation: { internal: 40, external: 60 }
  },
  {
    id: 107,
    code: 'CS601',
    name: 'Cyber Security & Cryptography',
    department: 'Computer Science',
    year: 4,
    sem: 'Sem 7',
    credits: 3,
    type: 'Core Theory',
    faculty: 'Dr. Neeraj Gupta',
    ltp: '3-0-0',
    hours: '3 hrs/wk',
    studentsEnrolled: 95,
    prerequisite: 'Computer Networks',
    units: [
      { unit: 'Unit 1', title: 'Symmetric Cryptography: AES, DES, Cipher Modes', hours: 8 },
      { unit: 'Unit 2', title: 'Public Key Cryptography, RSA, Diffie-Hellman & ECC', hours: 8 },
      { unit: 'Unit 3', title: 'Network Security Protocols: TLS/SSL, IPsec, Firewalls', hours: 8 },
      { unit: 'Unit 4', title: 'Web App Security & OWASP Top 10 Vulnerabilities', hours: 8 },
      { unit: 'Unit 5', title: 'Ethical Hacking, Digital Forensics & Zero-Trust', hours: 8 }
    ],
    textbooks: 'Cryptography and Network Security by William Stallings',
    evaluation: { internal: 40, external: 60 }
  },
  {
    id: 108,
    code: 'CS701',
    name: 'Final Year Capstone Project',
    department: 'Computer Science',
    year: 4,
    sem: 'Sem 8',
    credits: 6,
    type: 'Capstone / Project',
    faculty: 'Dr. Sunita Rao',
    ltp: '0-0-12',
    hours: '12 hrs/wk Project Lab',
    studentsEnrolled: 95,
    prerequisite: 'All Core Courses (Sem 1 to 7)',
    units: [
      { unit: 'Phase 1', title: 'Problem Formulation, Literature Survey & Feasibility', hours: 24 },
      { unit: 'Phase 2', title: 'Architecture Design, Prototyping & Mid-term Review', hours: 36 },
      { unit: 'Phase 3', title: 'Implementation, Benchmarking, IEEE Paper & Viva Voce', hours: 48 }
    ],
    textbooks: 'Project Guidelines & IEEE Research Papers',
    evaluation: { internal: 60, external: 40 }
  },

  // Electronics & Communication
  {
    id: 201,
    code: 'EC201',
    name: 'Electronic Circuits & Analog Design',
    department: 'Electronics',
    year: 2,
    sem: 'Sem 3',
    credits: 4,
    type: 'Core Theory',
    faculty: 'Prof. Ramesh Kumar',
    ltp: '3-1-0',
    hours: '4 hrs/wk',
    studentsEnrolled: 90,
    prerequisite: 'Basic Electrical Engg',
    units: [
      { unit: 'Unit 1', title: 'BJT & MOSFET Small Signal Amplifiers', hours: 9 },
      { unit: 'Unit 2', title: 'Feedback Amplifiers & Oscillator Circuits', hours: 9 },
      { unit: 'Unit 3', title: 'Operational Amplifiers & Linear Integrated Circuits', hours: 9 },
      { unit: 'Unit 4', title: 'Active Filter Design & Waveform Generators', hours: 9 },
      { unit: 'Unit 5', title: 'Power Amplifiers, Regulators & Thermal Design', hours: 9 }
    ],
    textbooks: 'Microelectronic Circuits by Sedra and Smith',
    evaluation: { internal: 40, external: 60 }
  },
  {
    id: 202,
    code: 'EC401',
    name: 'Digital Signal Processing',
    department: 'Electronics',
    year: 3,
    sem: 'Sem 5',
    credits: 4,
    type: 'Core Theory',
    faculty: 'Prof. Ramesh Kumar',
    ltp: '3-1-0',
    hours: '4 hrs/wk',
    studentsEnrolled: 85,
    prerequisite: 'Signals and Systems',
    units: [
      { unit: 'Unit 1', title: 'Discrete-Time Signals & Z-Transform Analysis', hours: 9 },
      { unit: 'Unit 2', title: 'Discrete Fourier Transform (DFT) & FFT Algorithms', hours: 9 },
      { unit: 'Unit 3', title: 'IIR Digital Filter Design (Butterworth, Chebyshev)', hours: 9 },
      { unit: 'Unit 4', title: 'FIR Digital Filter Design & Windowing Techniques', hours: 9 },
      { unit: 'Unit 5', title: 'Multirate DSP & Architecture of TMS320 Processors', hours: 9 }
    ],
    textbooks: 'Digital Signal Processing by Proakis and Manolakis',
    evaluation: { internal: 40, external: 60 }
  },
  {
    id: 203,
    code: 'EC601',
    name: 'Embedded IoT Systems & Wireless Sensors',
    department: 'Electronics',
    year: 4,
    sem: 'Sem 7',
    credits: 3,
    type: 'Core Theory',
    faculty: 'Prof. Ramesh Kumar',
    ltp: '3-0-0',
    hours: '3 hrs/wk',
    studentsEnrolled: 80,
    prerequisite: 'Microprocessors & Microcontrollers',
    units: [
      { unit: 'Unit 1', title: 'ARM Cortex-M Architecture & Peripherals', hours: 8 },
      { unit: 'Unit 2', title: 'IoT Protocols: MQTT, CoAP, BLE, LoRaWAN', hours: 8 },
      { unit: 'Unit 3', title: 'Sensor Interfacing & ADC Calibration', hours: 8 },
      { unit: 'Unit 4', title: 'FreeRTOS Task Scheduling & Inter-process Comm.', hours: 8 },
      { unit: 'Unit 5', title: 'Edge AI on Microcontrollers (TinyML)', hours: 8 }
    ],
    textbooks: 'Embedded Systems: Real-Time Interfacing by Jonathan Valvano',
    evaluation: { internal: 40, external: 60 }
  },

  // Mechanical Engineering
  {
    id: 401,
    code: 'ME201',
    name: 'Thermodynamics & Thermal Power',
    department: 'Mechanical',
    year: 2,
    sem: 'Sem 3',
    credits: 4,
    type: 'Core Theory',
    faculty: 'Dr. Pradeep Joshi',
    ltp: '3-1-0',
    hours: '4 hrs/wk',
    studentsEnrolled: 75,
    prerequisite: 'Engineering Physics',
    units: [
      { unit: 'Unit 1', title: 'First and Second Laws of Thermodynamics', hours: 9 },
      { unit: 'Unit 2', title: 'Properties of Pure Substances & Steam Tables', hours: 9 },
      { unit: 'Unit 3', title: 'Gas Power Cycles: Otto, Diesel, Dual & Brayton', hours: 9 },
      { unit: 'Unit 4', title: 'Rankine Cycle, Reheat & Regenerative Cycles', hours: 9 },
      { unit: 'Unit 5', title: 'Refrigeration Cycles & Psychrometrics', hours: 9 }
    ],
    textbooks: 'Engineering Thermodynamics by P.K. Nag',
    evaluation: { internal: 40, external: 60 }
  },
  {
    id: 402,
    code: 'ME401',
    name: 'CAD / CAM Modeling & Industrial Robotics',
    department: 'Mechanical',
    year: 3,
    sem: 'Sem 5',
    credits: 4,
    type: 'Core Theory',
    faculty: 'Dr. Pradeep Joshi',
    ltp: '3-1-0',
    hours: '4 hrs/wk',
    studentsEnrolled: 70,
    prerequisite: 'ME201',
    units: [
      { unit: 'Unit 1', title: 'Geometric Modeling: Wireframe, Surface & Solid', hours: 9 },
      { unit: 'Unit 2', title: 'CNC Programming: G-Codes, M-Codes & Tool Path Gen', hours: 9 },
      { unit: 'Unit 3', title: 'Finite Element Analysis (FEA) Formulations', hours: 9 },
      { unit: 'Unit 4', title: 'Robotics Kinematics: DH Parameters & Trajectory', hours: 9 },
      { unit: 'Unit 5', title: 'Flexible Manufacturing Systems (FMS) & Additive 3D', hours: 9 }
    ],
    textbooks: 'CAD/CAM: Principles and Applications by P.N. Rao',
    evaluation: { internal: 40, external: 60 }
  },

  // Civil Engineering
  {
    id: 501,
    code: 'CE201',
    name: 'Structural Analysis & Mechanics of Solids',
    department: 'Civil',
    year: 2,
    sem: 'Sem 3',
    credits: 4,
    type: 'Core Theory',
    faculty: 'Dr. Kavitha Singh',
    ltp: '3-1-0',
    hours: '4 hrs/wk',
    studentsEnrolled: 60,
    prerequisite: 'Engineering Mechanics',
    units: [
      { unit: 'Unit 1', title: 'Shear Force & Bending Moment Diagrams in Beams', hours: 9 },
      { unit: 'Unit 2', title: 'Deflection of Beams: Double Integration & Conjugate', hours: 9 },
      { unit: 'Unit 3', title: 'Analysis of Determinate and Indeterminate Trusses', hours: 9 },
      { unit: 'Unit 4', title: 'Moment Distribution Method & Slope Deflection Method', hours: 9 },
      { unit: 'Unit 5', title: 'Matrix Stiffness Method for Frame Structures', hours: 9 }
    ],
    textbooks: 'Theory of Structures by S. Ramamrutham',
    evaluation: { internal: 40, external: 60 }
  },
  {
    id: 502,
    code: 'CE401',
    name: 'Transportation & Smart Highway Design',
    department: 'Civil',
    year: 3,
    sem: 'Sem 5',
    credits: 3,
    type: 'Core Theory',
    faculty: 'Dr. Kavitha Singh',
    ltp: '3-0-0',
    hours: '3 hrs/wk',
    studentsEnrolled: 58,
    prerequisite: 'CE201',
    units: [
      { unit: 'Unit 1', title: 'Highway Alignment, Sight Distance & Geometric Design', hours: 8 },
      { unit: 'Unit 2', title: 'Pavement Design: Flexible (CBR) and Rigid (IRC)', hours: 8 },
      { unit: 'Unit 3', title: 'Traffic Engineering, Flow Studies & Signal Design', hours: 8 },
      { unit: 'Unit 4', title: 'Highway Materials: Bitumen, Aggregates & Quality', hours: 8 },
      { unit: 'Unit 5', title: 'Intelligent Transportation Systems (ITS) & Smart Tolls', hours: 8 }
    ],
    textbooks: 'Highway Engineering by S.K. Khanna and C.E.G. Justo',
    evaluation: { internal: 40, external: 60 }
  },

  // MBA
  {
    id: 301,
    code: 'MB101',
    name: 'Principles of Management & Leadership',
    department: 'MBA',
    year: 1,
    sem: 'Sem 1',
    credits: 3,
    type: 'Core Theory',
    faculty: 'Dr. Anita Desai',
    ltp: '3-0-0',
    hours: '3 hrs/wk',
    studentsEnrolled: 110,
    prerequisite: 'None',
    units: [
      { unit: 'Unit 1', title: 'Evolution of Management Thought & Systems View', hours: 8 },
      { unit: 'Unit 2', title: 'Planning, Strategic Decision Making & Goal Setting', hours: 8 },
      { unit: 'Unit 3', title: 'Organizational Structuring & Delegation of Authority', hours: 8 },
      { unit: 'Unit 4', title: 'Motivation Theories, Transformational Leadership', hours: 8 },
      { unit: 'Unit 5', title: 'Managerial Control Systems & Business Ethics', hours: 8 }
    ],
    textbooks: 'Management by Stephen P. Robbins and Mary Coulter',
    evaluation: { internal: 50, external: 50 }
  },
  {
    id: 302,
    code: 'MB304',
    name: 'Strategic Decision Making & Governance',
    department: 'MBA',
    year: 2,
    sem: 'Sem 3',
    credits: 3,
    type: 'Core Theory',
    faculty: 'Dr. Anita Desai',
    ltp: '3-0-0',
    hours: '3 hrs/wk',
    studentsEnrolled: 100,
    prerequisite: 'MB101',
    units: [
      { unit: 'Unit 1', title: 'Industry Environment & Five Forces Analysis', hours: 8 },
      { unit: 'Unit 2', title: 'Competitive Strategies & Blue Ocean Value Innovation', hours: 8 },
      { unit: 'Unit 3', title: 'Corporate M&A, Diversification & Strategic Alliances', hours: 8 },
      { unit: 'Unit 4', title: 'Strategy Execution, Balance Scorecard & KPIs', hours: 8 },
      { unit: 'Unit 5', title: 'Corporate Governance, ESG & Board Accountability', hours: 8 }
    ],
    textbooks: 'Strategic Management by Fred R. David',
    evaluation: { internal: 50, external: 50 }
  },

  // BCA
  {
    id: 601,
    code: 'BCA101',
    name: 'Fundamentals of Computing & C Programming',
    department: 'BCA',
    year: 1,
    sem: 'Sem 1',
    credits: 4,
    type: 'Core Theory',
    faculty: 'Prof. Meena Iyer',
    ltp: '3-1-0',
    hours: '4 hrs/wk',
    studentsEnrolled: 80,
    prerequisite: 'None',
    units: [
      { unit: 'Unit 1', title: 'Computer Architecture & Flowcharts', hours: 9 },
      { unit: 'Unit 2', title: 'C Data Types, Operators & Conditional Flow', hours: 9 },
      { unit: 'Unit 3', title: 'Arrays, Strings & Pointers in C', hours: 9 },
      { unit: 'Unit 4', title: 'Structures, Unions & Dynamic Memory Allocation', hours: 9 },
      { unit: 'Unit 5', title: 'File I/O & Preprocessor Directives', hours: 9 }
    ],
    textbooks: 'Programming in ANSI C by E. Balagurusamy',
    evaluation: { internal: 40, external: 60 }
  },
  {
    id: 602,
    code: 'BCA201',
    name: 'Web Technologies & Full-Stack Development',
    department: 'BCA',
    year: 2,
    sem: 'Sem 3',
    credits: 4,
    type: 'Core Theory',
    faculty: 'Prof. Meena Iyer',
    ltp: '3-1-0',
    hours: '4 hrs/wk',
    studentsEnrolled: 75,
    prerequisite: 'BCA101',
    units: [
      { unit: 'Unit 1', title: 'Semantic HTML5, CSS3 Grid/Flexbox & Responsive UI', hours: 9 },
      { unit: 'Unit 2', title: 'Modern JavaScript (ES6+), DOM & Async Fetch', hours: 9 },
      { unit: 'Unit 3', title: 'React.js Components, State, Hooks & Router', hours: 9 },
      { unit: 'Unit 4', title: 'Node.js, Express.js REST API & Middleware', hours: 9 },
      { unit: 'Unit 5', title: 'MongoDB Atlas Integration, JWT Auth & Deployment', hours: 9 }
    ],
    textbooks: 'Full Stack React Projects by Anthony Accomazzo',
    evaluation: { internal: 40, external: 60 }
  }
];

const DEPARTMENTS = [
  'All Departments',
  'Computer Science',
  'Electronics',
  'MBA',
  'Mechanical',
  'Civil',
  'BCA'
];

export const DEPARTMENT_HEADS = {
  'Computer Science': 'Dr. Sunita Rao',
  'Electronics': 'Prof. Ramesh Kumar',
  'MBA': 'Dr. Anita Desai',
  'Mechanical': 'Dr. Pradeep Joshi',
  'Civil': 'Dr. Kavitha Singh',
  'BCA': 'Prof. Meena Iyer'
};

export const DEPARTMENT_FACULTY_MEMBERS = {
  'Computer Science': [
    { name: 'Dr. Sunita Rao', isHod: true, role: 'HOD / Professor' },
    { name: 'Dr. Neeraj Gupta', isHod: false, role: 'Associate Professor' },
    { name: 'Prof. Arvind Menon', isHod: false, role: 'Assistant Professor' },
    { name: 'Dr. Priya Sharma', isHod: false, role: 'Assistant Professor' }
  ],
  'Electronics': [
    { name: 'Prof. Ramesh Kumar', isHod: true, role: 'HOD / Associate Professor' },
    { name: 'Dr. Sneha Patel', isHod: false, role: 'Associate Professor' },
    { name: 'Prof. Vikram Sethi', isHod: false, role: 'Assistant Professor' }
  ],
  'MBA': [
    { name: 'Dr. Anita Desai', isHod: true, role: 'HOD / Professor' },
    { name: 'Prof. Rajesh Khanna', isHod: false, role: 'Associate Professor' },
    { name: 'Dr. Sandeep Roy', isHod: false, role: 'Assistant Professor' }
  ],
  'Mechanical': [
    { name: 'Dr. Pradeep Joshi', isHod: true, role: 'HOD / Professor' },
    { name: 'Prof. Amit Verma', isHod: false, role: 'Associate Professor' },
    { name: 'Dr. Suresh Nair', isHod: false, role: 'Assistant Professor' }
  ],
  'Civil': [
    { name: 'Dr. Kavitha Singh', isHod: true, role: 'HOD / Professor' },
    { name: 'Prof. Harish Chandra', isHod: false, role: 'Associate Professor' },
    { name: 'Dr. Deepa Reddy', isHod: false, role: 'Assistant Professor' }
  ],
  'BCA': [
    { name: 'Prof. Meena Iyer', isHod: true, role: 'HOD / Associate Professor' },
    { name: 'Dr. Sunita Rao', isHod: false, role: 'Visiting Professor' },
    { name: 'Prof. Akash Gupta', isHod: false, role: 'Assistant Professor' }
  ]
};

const SUBJECT_TYPES = [
  'All Types',
  'Core Theory',
  'Practical / Lab',
  'Professional Elective',
  'Open Elective',
  'Capstone / Project'
];

const SEMESTERS = [
  'All Semesters',
  'Sem 1',
  'Sem 2',
  'Sem 3',
  'Sem 4',
  'Sem 5',
  'Sem 6',
  'Sem 7',
  'Sem 8'
];

export default function CourseSubjectManagement() {
  // Tabs: 'subjects', 'programs', 'matrix', 'allocation'
  const [activeTab, setActiveTab] = useState('subjects');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  const [programsList, setProgramsList] = useState(INITIAL_PROGRAMS);
  const [subjectsList, setSubjectsList] = useState(INITIAL_SUBJECTS);

  // Selected Program for Curriculum Matrix View
  const [matrixSelectedProgramCode, setMatrixSelectedProgramCode] = useState('BTECH-CSE');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedSem, setSelectedSem] = useState('All Semesters');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedCredits, setSelectedCredits] = useState('ALL');

  // Modals state
  const [viewingSubject, setViewingSubject] = useState(null);
  const [viewingProgram, setViewingProgram] = useState(null);

  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false);

  const [editingSubject, setEditingSubject] = useState(null);
  const [editingProgram, setEditingProgram] = useState(null);

  const [deletingSubject, setDeletingSubject] = useState(null);
  const [deletingProgram, setDeletingProgram] = useState(null);

  // Lock background scroll when any modal is open
  React.useEffect(() => {
    const isAnyModalOpen = Boolean(
      viewingSubject || viewingProgram || isAddSubjectOpen || isAddProgramOpen ||
      editingSubject || editingProgram || deletingSubject || deletingProgram
    );
    const scrollContainer = document.getElementById('main-content-scroll-container');
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      if (scrollContainer) scrollContainer.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      if (scrollContainer) scrollContainer.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'unset';
      if (scrollContainer) scrollContainer.style.overflow = 'auto';
    };
  }, [
    viewingSubject, viewingProgram, isAddSubjectOpen, isAddProgramOpen,
    editingSubject, editingProgram, deletingSubject, deletingProgram
  ]);

  // Reallocate Faculty Modal
  const [reallocatingSubject, setReallocatingSubject] = useState(null);
  const [newFacultyName, setNewFacultyName] = useState('');

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Form State for Subject Add / Edit
  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name: '',
    department: 'Computer Science',
    year: 1,
    sem: 'Sem 1',
    credits: 4,
    type: 'Core Theory',
    faculty: 'Dr. Sunita Rao',
    ltp: '3-1-0',
    hours: '4 hrs/wk (3L + 1T)',
    prerequisite: 'None',
    textbooks: ''
  });

  // Form State for Program Add / Edit
  const [programForm, setProgramForm] = useState({
    code: '',
    name: '',
    degreeLevel: 'Undergraduate (UG)',
    department: 'Computer Science',
    regulation: 'Regulation 2024 (R24)',
    durationYears: 4,
    totalCredits: 160,
    coordinator: 'Dr. Sunita Rao',
    coordinatorEmail: 'sunita.rao@vcas.edu',
    description: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // -------------------------------------------------------------
  // Filtered lists
  // -------------------------------------------------------------
  const filteredSubjects = useMemo(() => {
    return subjectsList.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.faculty.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        (s.textbooks && s.textbooks.toLowerCase().includes(q))
      );

      const matchesDept = selectedDept === 'All Departments' || s.department === selectedDept;
      const matchesYear = selectedYear === 'ALL' || s.year === Number(selectedYear);
      const matchesSem = selectedSem === 'All Semesters' || s.sem === selectedSem;
      const matchesType = selectedType === 'All Types' || s.type === selectedType;
      
      let matchesCredits = true;
      if (selectedCredits === '1-2') matchesCredits = s.credits <= 2;
      else if (selectedCredits === '3') matchesCredits = s.credits === 3;
      else if (selectedCredits === '4') matchesCredits = s.credits === 4;
      else if (selectedCredits === '5+') matchesCredits = s.credits >= 5;

      return matchesSearch && matchesDept && matchesYear && matchesSem && matchesType && matchesCredits;
    });
  }, [subjectsList, searchQuery, selectedDept, selectedYear, selectedSem, selectedType, selectedCredits]);

  const filteredPrograms = useMemo(() => {
    return programsList.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.coordinator.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.regulation.toLowerCase().includes(q)
      );

      const matchesDept = selectedDept === 'All Departments' || p.department === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [programsList, searchQuery, selectedDept]);

  // Distinct Faculty Teaching Workload
  const facultyWorkload = useMemo(() => {
    const map = {};
    subjectsList.forEach(sub => {
      const fac = sub.faculty || 'Unassigned';
      if (!map[fac]) {
        map[fac] = {
          name: fac,
          department: sub.department,
          subjects: [],
          totalCredits: 0,
          totalStudents: 0
        };
      }
      map[fac].subjects.push(sub);
      map[fac].totalCredits += sub.credits;
      map[fac].totalStudents += (sub.studentsEnrolled || 60);
    });
    return Object.values(map);
  }, [subjectsList]);

  // Selected Program for Matrix
  const activeMatrixProgram = useMemo(() => {
    return programsList.find(p => p.code === matrixSelectedProgramCode) || programsList[0];
  }, [programsList, matrixSelectedProgramCode]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDept('All Departments');
    setSelectedYear('ALL');
    setSelectedSem('All Semesters');
    setSelectedType('All Types');
    setSelectedCredits('ALL');
  };

  // -------------------------------------------------------------
  // CSV Export Handler
  // -------------------------------------------------------------
  const handleExportCSV = () => {
    const headers = ['Subject Code', 'Subject Name', 'Department', 'Year', 'Semester', 'Credits', 'Type', 'Faculty In-Charge', 'L-T-P', 'Prerequisites'];
    const rows = filteredSubjects.map(s => [
      `"${s.code}"`,
      `"${s.name}"`,
      `"${s.department}"`,
      `"Year ${s.year}"`,
      `"${s.sem}"`,
      s.credits,
      `"${s.type}"`,
      `"${s.faculty}"`,
      `"${s.ltp || '3-1-0'}"`,
      `"${s.prerequisite || 'None'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vidyapeeth_Curriculum_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Curriculum catalog exported as CSV successfully!');
  };

  // -------------------------------------------------------------
  // Subject Handlers
  // -------------------------------------------------------------
  const handleOpenAddSubject = (defaultSem) => {
    const initialDept = selectedDept !== 'All Departments' ? selectedDept : 'Computer Science';
    const initialHod = DEPARTMENT_HEADS[initialDept] || 'Dr. Sunita Rao';
    const deptPrefixes = {
      'Computer Science': 'CS',
      'Electronics': 'EC',
      'MBA': 'MB',
      'Mechanical': 'ME',
      'Civil': 'CE',
      'BCA': 'BCA'
    };
    const prefix = deptPrefixes[initialDept] || 'CS';
    const initialYear = selectedYear !== 'ALL' ? Number(selectedYear) : 1;

    setSubjectForm({
      code: `${prefix}${initialYear}01`,
      name: '',
      department: initialDept,
      year: initialYear,
      sem: defaultSem || (selectedSem !== 'All Semesters' ? selectedSem : `Sem ${initialYear * 2 - 1}`),
      credits: 4,
      type: 'Core Theory',
      faculty: initialHod,
      ltp: '3-1-0',
      hours: '4 hrs/wk (3L + 1T)',
      prerequisite: 'None',
      textbooks: ''
    });
    setFormErrors({});
    setIsAddSubjectOpen(true);
  };

  const handleSubjectDeptChange = (newDept) => {
    const defaultHod = DEPARTMENT_HEADS[newDept] || 'Dr. Sunita Rao';
    
    // Auto-update subject code prefix if creating a new subject
    let newCode = subjectForm.code;
    if (!editingSubject) {
      const deptPrefixes = {
        'Computer Science': 'CS',
        'Electronics': 'EC',
        'MBA': 'MB',
        'Mechanical': 'ME',
        'Civil': 'CE',
        'BCA': 'BCA'
      };
      const prefix = deptPrefixes[newDept] || 'CS';
      const year = subjectForm.year || 1;
      newCode = `${prefix}${year}01`;
    }

    setSubjectForm(prev => ({
      ...prev,
      department: newDept,
      faculty: defaultHod, // Auto-sets the HOD / Department Head
      code: newCode
    }));
  };

  const handleSubjectYearChange = (newYear) => {
    const yearNum = Number(newYear);
    const deptPrefixes = {
      'Computer Science': 'CS',
      'Electronics': 'EC',
      'MBA': 'MB',
      'Mechanical': 'ME',
      'Civil': 'CE',
      'BCA': 'BCA'
    };
    const prefix = deptPrefixes[subjectForm.department] || 'CS';
    
    setSubjectForm(prev => ({
      ...prev,
      year: yearNum,
      sem: `Sem ${yearNum * 2 - 1}`,
      code: editingSubject ? prev.code : `${prefix}${yearNum}01`
    }));
  };

  const handleOpenEditSubject = (subj) => {
    setEditingSubject(subj);
    setSubjectForm({
      code: subj.code,
      name: subj.name,
      department: subj.department,
      year: subj.year,
      sem: subj.sem,
      credits: subj.credits,
      type: subj.type,
      faculty: subj.faculty,
      ltp: subj.ltp || '3-1-0',
      hours: subj.hours || '4 hrs/wk',
      prerequisite: subj.prerequisite || 'None',
      textbooks: subj.textbooks || ''
    });
    setFormErrors({});
  };

  const handleSaveSubject = (e) => {
    e.preventDefault();
    const errors = {};
    if (!subjectForm.name.trim()) errors.name = 'Subject name is required';
    if (!subjectForm.code.trim()) errors.code = 'Subject code is required';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingSubject) {
      // Update
      const updated = {
        ...editingSubject,
        ...subjectForm,
        code: subjectForm.code.trim().toUpperCase()
      };
      setSubjectsList(prev => prev.map(s => s.id === editingSubject.id ? updated : s));
      if (viewingSubject && viewingSubject.id === editingSubject.id) {
        setViewingSubject(updated);
      }
      setEditingSubject(null);
      showToast(`Subject ${updated.code} updated successfully.`);
    } else {
      // Create new
      const newSubj = {
        id: Date.now(),
        ...subjectForm,
        code: subjectForm.code.trim().toUpperCase(),
        studentsEnrolled: 80,
        units: [
          { unit: 'Unit 1', title: 'Foundational Principles & Core Concepts', hours: 9 },
          { unit: 'Unit 2', title: 'Theoretical Framework & Analytical Methods', hours: 9 },
          { unit: 'Unit 3', title: 'Applied Methodology & System Implementation', hours: 9 },
          { unit: 'Unit 4', title: 'Real-world Architecture & Case Studies', hours: 9 },
          { unit: 'Unit 5', title: 'Emerging Paradigms & Industry Standards', hours: 9 }
        ],
        evaluation: { internal: 40, external: 60 }
      };
      setSubjectsList(prev => [newSubj, ...prev]);
      setIsAddSubjectOpen(false);
      showToast(`New subject ${newSubj.code} added to catalog.`);
    }
  };

  const handleConfirmDeleteSubject = () => {
    if (deletingSubject) {
      setSubjectsList(prev => prev.filter(s => s.id !== deletingSubject.id));
      if (viewingSubject && viewingSubject.id === deletingSubject.id) {
        setViewingSubject(null);
      }
      showToast(`Subject ${deletingSubject.code} removed.`);
      setDeletingSubject(null);
    }
  };

  // -------------------------------------------------------------
  // Program Handlers
  // -------------------------------------------------------------
  const handleOpenAddProgram = () => {
    setProgramForm({
      code: 'BTECH-AI',
      name: '',
      degreeLevel: 'Undergraduate (UG)',
      department: 'Computer Science',
      regulation: 'Regulation 2024 (R24)',
      durationYears: 4,
      totalCredits: 160,
      coordinator: 'Dr. Sunita Rao',
      coordinatorEmail: 'sunita.rao@vcas.edu',
      description: ''
    });
    setFormErrors({});
    setIsAddProgramOpen(true);
  };

  const handleOpenEditProgram = (prog) => {
    setEditingProgram(prog);
    setProgramForm({
      code: prog.code,
      name: prog.name,
      degreeLevel: prog.degreeLevel,
      department: prog.department,
      regulation: prog.regulation || 'Regulation 2024 (R24)',
      durationYears: prog.durationYears,
      totalCredits: prog.totalCredits,
      coordinator: prog.coordinator,
      coordinatorEmail: prog.coordinatorEmail || `${prog.coordinator.toLowerCase().replace(/[^a-z]/g, '')}@vcas.edu`,
      description: prog.description || ''
    });
    setFormErrors({});
  };

  const handleSaveProgram = (e) => {
    e.preventDefault();
    const errors = {};
    if (!programForm.name.trim()) errors.name = 'Program name is required';
    if (!programForm.code.trim()) errors.code = 'Program code is required';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingProgram) {
      const updated = {
        ...editingProgram,
        ...programForm,
        code: programForm.code.trim().toUpperCase(),
        totalSemesters: programForm.durationYears * 2
      };
      setProgramsList(prev => prev.map(p => p.id === editingProgram.id ? updated : p));
      if (viewingProgram && viewingProgram.id === editingProgram.id) {
        setViewingProgram(updated);
      }
      setEditingProgram(null);
      showToast(`Degree Program ${updated.code} updated.`);
    } else {
      const newProg = {
        id: Date.now(),
        ...programForm,
        code: programForm.code.trim().toUpperCase(),
        totalSemesters: programForm.durationYears * 2,
        enrolledStudents: 60,
        totalSubjects: programForm.durationYears * 10,
        establishedYear: new Date().getFullYear().toString()
      };
      setProgramsList(prev => [...prev, newProg]);
      setIsAddProgramOpen(false);
      showToast(`New Degree Program ${newProg.code} registered.`);
    }
  };

  const handleConfirmDeleteProgram = () => {
    if (deletingProgram) {
      setProgramsList(prev => prev.filter(p => p.id !== deletingProgram.id));
      if (viewingProgram && viewingProgram.id === deletingProgram.id) {
        setViewingProgram(null);
      }
      showToast(`Degree Program ${deletingProgram.code} removed.`);
      setDeletingProgram(null);
    }
  };

  // Reallocate Faculty
  const handleSaveReallocation = () => {
    if (reallocatingSubject && newFacultyName.trim()) {
      setSubjectsList(prev => prev.map(s => s.id === reallocatingSubject.id ? { ...s, faculty: newFacultyName.trim() } : s));
      showToast(`Reallocated ${reallocatingSubject.code} to ${newFacultyName.trim()}`);
      setReallocatingSubject(null);
      setNewFacultyName('');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans animate-fadeIn">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. TOP HEADER & ACTION BUTTONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
              Academic ERP
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-semibold">NEP 2020 Aligned</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Courses & Subjects</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Configure degree programs, semester curriculum matrix, syllabus units, prerequisites, and faculty allocations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            title="Download CSV Catalog"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={handleOpenAddProgram}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all border border-slate-200"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span>Add Program</span>
          </button>

          <button
            onClick={() => handleOpenAddSubject()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* 2. STATS SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Programs</span>
            <p className="text-2xl font-black text-slate-900">{programsList.length}</p>
            <p className="text-[11px] text-blue-600 font-bold mt-1">UG & PG Degrees</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Active Subjects</span>
            <p className="text-2xl font-black text-indigo-600">{subjectsList.length}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Across 8 Semesters</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Enrolled</span>
            <p className="text-2xl font-black text-emerald-600">1,248</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Active Batches</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Grad Credits</span>
            <p className="text-2xl font-black text-purple-600">160</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">4-Year Degree Avg</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Faculty Leads</span>
            <p className="text-2xl font-black text-amber-600">{facultyWorkload.length}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Assigned Teachers</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex items-center justify-between border-b border-slate-200 text-xs sm:text-sm overflow-x-auto gap-2">
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'subjects'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Subjects Catalog ({filteredSubjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('programs')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'programs'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Degree Programs ({filteredPrograms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Curriculum Matrix (Roadmap)</span>
          </button>

          <button
            onClick={() => setActiveTab('allocation')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'allocation'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Faculty Teaching Load</span>
          </button>
        </div>

        {/* View mode toggle (Table / Grid) for Subjects Tab */}
        {activeTab === 'subjects' && (
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 mb-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 4. SEARCH & MULTI-FILTER BAR (Visible on Subjects & Programs Tab) */}
      {(activeTab === 'subjects' || activeTab === 'programs') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
          
          {/* Search row */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'subjects' ? "Search subjects by name, code CS101, faculty, or topic..." : "Search degree programs by name, code, or coordinator..."}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {(searchQuery || selectedDept !== 'All Departments' || selectedYear !== 'ALL' || selectedSem !== 'All Semesters' || selectedType !== 'All Types' || selectedCredits !== 'ALL') && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition-all shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Dropdowns (Department, Year, Semester, Type, Credits) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
            {/* Department Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            {activeTab === 'subjects' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Academic Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Academic Years</option>
                  <option value="1">1st Year (Fresher)</option>
                  <option value="2">2nd Year (Sophomore)</option>
                  <option value="3">3rd Year (Junior)</option>
                  <option value="4">4th Year (Senior)</option>
                </select>
              </div>
            )}

            {/* Semester Filter */}
            {activeTab === 'subjects' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Semester</label>
                <select
                  value={selectedSem}
                  onChange={(e) => setSelectedSem(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  {SEMESTERS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Subject Type Filter */}
            {activeTab === 'subjects' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  {SUBJECT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Credits Filter */}
            {activeTab === 'subjects' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Credits</label>
                <select
                  value={selectedCredits}
                  onChange={(e) => setSelectedCredits(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Credits</option>
                  <option value="1-2">1 - 2 Credits (Labs)</option>
                  <option value="3">3 Credits</option>
                  <option value="4">4 Credits (Core)</option>
                  <option value="5+">5+ Credits (Projects)</option>
                </select>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 1: SUBJECTS CATALOG (TABLE & GRID)                                */}
      {/* ========================================================================= */}
      {activeTab === 'subjects' && (
        viewMode === 'table' ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">SUBJECT CODE & NAME</th>
                    <th className="py-4 px-4">DEPARTMENT</th>
                    <th className="py-4 px-4">YEAR & SEM</th>
                    <th className="py-4 px-4">TYPE</th>
                    <th className="py-4 px-4">CREDITS & LOAD</th>
                    <th className="py-4 px-4">FACULTY IN CHARGE</th>
                    <th className="py-4 px-4">PREREQUISITE</th>
                    <th className="py-4 px-6 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map((subj) => (
                      <tr 
                        key={subj.id}
                        onClick={() => setViewingSubject(subj)}
                        className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      >
                        {/* Code & Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono font-extrabold text-xs border border-blue-100 shrink-0">
                              {subj.code}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                                {subj.name}
                              </p>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {subj.hours || '4 hrs/week'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-4 px-4 font-semibold text-slate-700 text-xs">
                          {subj.department}
                        </td>

                        {/* Year & Semester */}
                        <td className="py-4 px-4 text-xs font-semibold text-slate-600">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                            Year {subj.year} • {subj.sem}
                          </span>
                        </td>

                        {/* Type Badge */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            subj.type === 'Core Theory'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : subj.type === 'Practical / Lab'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : subj.type === 'Professional Elective' || subj.type === 'Elective'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : subj.type === 'Open Elective'
                              ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {subj.type}
                          </span>
                        </td>

                        {/* Credits & LTP */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-blue-600 text-xs">
                              {subj.credits} Credits
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              L-T-P: {subj.ltp || '3-1-0'}
                            </span>
                          </div>
                        </td>

                        {/* Faculty */}
                        <td className="py-4 px-4 text-xs font-medium text-slate-700">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                              {subj.faculty.charAt(subj.faculty.indexOf('.') > -1 ? subj.faculty.indexOf('.') + 2 : 0) || 'F'}
                            </div>
                            <span>{subj.faculty}</span>
                          </div>
                        </td>

                        {/* Prerequisite */}
                        <td className="py-4 px-4 text-xs text-slate-500">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono">
                            {subj.prerequisite || 'None'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5 text-slate-400">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingSubject(subj);
                              }}
                              title="View Syllabus & Units"
                              className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditSubject(subj);
                              }}
                              title="Edit Subject"
                              className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingSubject(subj);
                              }}
                              title="Delete Subject"
                              className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="max-w-xs mx-auto space-y-2">
                          <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                          <p className="text-sm font-semibold text-slate-600">No subjects found</p>
                          <p className="text-xs text-slate-400">Try changing your search terms or filter selections</p>
                          <button
                            onClick={handleResetFilters}
                            className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                          >
                            Clear all filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* GRID CARD VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSubjects.map(subj => (
              <div 
                key={subj.id}
                onClick={() => setViewingSubject(subj)}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono font-extrabold text-xs border border-blue-100">
                      {subj.code}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                      subj.type === 'Core Theory' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {subj.type}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {subj.name}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                    <span className="font-semibold text-slate-700">{subj.department}</span>
                    <span>•</span>
                    <span>Year {subj.year} ({subj.sem})</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-sm font-extrabold text-blue-600 block">{subj.credits}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Credits</span>
                  </div>
                  <div className="border-x border-slate-200">
                    <span className="text-sm font-extrabold text-slate-800 block">{subj.units?.length || 5}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Units</span>
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-emerald-600 block">{subj.studentsEnrolled || 90}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Enrolled</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-600 font-medium truncate max-w-[160px]">
                    👨‍🏫 {subj.faculty}
                  </span>

                  <div className="flex items-center gap-1 text-slate-400" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEditSubject(subj)}
                      className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingSubject(subj)}
                      className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 2: DEGREE PROGRAMS & REGULATIONS                                    */}
      {/* ========================================================================= */}
      {activeTab === 'programs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((prog) => (
            <div
              key={prog.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-100">
                    {prog.code}
                  </span>
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-lg">
                    {prog.degreeLevel}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  {prog.name}
                </h3>
                
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-semibold text-[10px] rounded-md border border-indigo-100">
                    {prog.regulation}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Est. {prog.establishedYear}</span>
                </div>

                <p className="text-xs text-slate-500 font-semibold mt-2.5">
                  Lead Coordinator: <span className="text-slate-800">{prog.coordinator}</span>
                </p>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {prog.description}
                </p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center text-xs">
                <div>
                  <span className="text-base font-extrabold text-slate-900 block leading-tight">
                    {prog.durationYears} Yrs
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{prog.totalSemesters} Sems</span>
                </div>
                <div className="border-x border-slate-200">
                  <span className="text-base font-extrabold text-blue-600 block leading-tight">
                    {prog.totalCredits}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Credits</span>
                </div>
                <div>
                  <span className="text-base font-extrabold text-purple-600 block leading-tight">
                    {prog.enrolledStudents}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Students</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setMatrixSelectedProgramCode(prog.code);
                    setActiveTab('matrix');
                  }}
                  className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-blue-200/80"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Semester Matrix</span>
                </button>

                <button
                  onClick={() => handleOpenEditProgram(prog)}
                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-all"
                  title="Edit Program"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setDeletingProgram(prog)}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 transition-all"
                  title="Delete Program"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 3: CURRICULUM MATRIX & SEMESTER ROADMAP                            */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Program Switcher Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block mb-1">
                Curriculum Structure & Semester Progression
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold leading-tight">
                {activeMatrixProgram.name}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {activeMatrixProgram.regulation} • {activeMatrixProgram.durationYears} Years ({activeMatrixProgram.totalSemesters} Semesters) • Total {activeMatrixProgram.totalCredits} Credits
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-300">Select Degree:</label>
              <select
                value={matrixSelectedProgramCode}
                onChange={(e) => setMatrixSelectedProgramCode(e.target.value)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:bg-slate-900 cursor-pointer transition-all"
              >
                {programsList.map(p => (
                  <option key={p.id} value={p.code} className="text-slate-900 bg-white">{p.code} - {p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Semesters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: activeMatrixProgram.totalSemesters }).map((_, idx) => {
              const semNumber = idx + 1;
              const semLabel = `Sem ${semNumber}`;
              const semSubjects = subjectsList.filter(s => 
                s.department === activeMatrixProgram.department && s.sem === semLabel
              );
              const totalSemCredits = semSubjects.reduce((acc, curr) => acc + curr.credits, 0);

              return (
                <div key={semLabel} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
                        S{semNumber}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">Semester {semNumber}</h4>
                        <p className="text-[11px] text-slate-400 font-medium">Year {Math.ceil(semNumber / 2)} Curriculum</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        {totalSemCredits} Credits
                      </span>
                    </div>
                  </div>

                  {/* Subjects list in semester */}
                  <div className="space-y-2">
                    {semSubjects.length > 0 ? (
                      semSubjects.map(sub => (
                        <div 
                          key={sub.id} 
                          onClick={() => setViewingSubject(sub)}
                          className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-100 text-xs flex items-center justify-between cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono font-bold text-[11px] text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                              {sub.code}
                            </span>
                            <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                              {sub.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              sub.type === 'Practical / Lab' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {sub.credits}C
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-xs font-semibold text-slate-500">Core courses defined in master syllabus</p>
                        <button
                          onClick={() => handleOpenAddSubject(semLabel)}
                          className="mt-2 text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Subject to Sem {semNumber}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. TAB 4: FACULTY TEACHING ALLOCATION                                     */}
      {/* ========================================================================= */}
      {activeTab === 'allocation' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Faculty Course Load & Teaching Allocations</h3>
                <p className="text-xs text-slate-500 mt-0.5">Summary of subjects, weekly lecture credits, and student intake per teacher</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {facultyWorkload.map((fac, idx) => (
                <div key={idx} className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                          {fac.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{fac.name}</h4>
                          <span className="text-[11px] font-semibold text-slate-500">{fac.department}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-200/70 text-center text-xs my-3">
                      <div>
                        <span className="font-black text-blue-600 text-base leading-none block">{fac.totalCredits}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Teaching Credits</span>
                      </div>
                      <div>
                        <span className="font-black text-emerald-600 text-base leading-none block">{fac.totalStudents}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Enrolled</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Subjects:</span>
                      {fac.subjects.map(s => (
                        <div key={s.id} className="text-xs p-2 bg-white rounded-lg border border-slate-100 flex items-center justify-between">
                          <span className="font-bold text-slate-800 truncate mr-2">{s.code} - {s.name}</span>
                          <button
                            onClick={() => {
                              setReallocatingSubject(s);
                              setNewFacultyName(s.faculty);
                            }}
                            title="Reallocate Faculty"
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline shrink-0"
                          >
                            Reassign
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL: VIEW SUBJECT SYLLABUS & UNITS                                   */}
      {/* ========================================================================= */}
      {viewingSubject && (
        <ModalPortal isOpen={Boolean(viewingSubject)} onClose={() => setViewingSubject(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 gap-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 font-mono font-extrabold text-xs rounded-xl border border-blue-100">
                  {viewingSubject.code}
                </span>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                    {viewingSubject.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {viewingSubject.department} • Year {viewingSubject.year} ({viewingSubject.sem}) • {viewingSubject.credits} Credits
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setViewingSubject(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100/80 hover:bg-slate-200 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subject Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Course Type</span>
                <span className="font-extrabold text-slate-800">{viewingSubject.type}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Credits & LTP</span>
                <span className="font-extrabold text-blue-600">{viewingSubject.credits} Credits ({viewingSubject.ltp || '3-1-0'})</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Faculty Lead</span>
                <span className="font-extrabold text-slate-800">{viewingSubject.faculty}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Prerequisite</span>
                <span className="font-semibold text-slate-700">{viewingSubject.prerequisite || 'None'}</span>
              </div>
            </div>

            {/* Units & Syllabus Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" /> Syllabus Modules & Units
              </h4>
              <div className="space-y-2.5">
                {viewingSubject.units && viewingSubject.units.map((unit, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-600 mr-2">{unit.unit}:</span>
                      <span className="font-bold text-slate-900">{unit.title}</span>
                    </div>
                    {unit.hours && (
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0 ml-2">{unit.hours} Hours</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Assessment & Evaluation Scheme */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
              <span className="font-bold text-slate-800 block text-[11px] uppercase">Assessment & Evaluation Scheme:</span>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 font-semibold block">Continuous Internal Assessment (CIA)</span>
                  <span className="text-sm font-extrabold text-blue-600">40%</span>
                </div>
                <div className="flex-1 bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 font-semibold block">End-Semester Examination (ESE)</span>
                  <span className="text-sm font-extrabold text-indigo-600">60%</span>
                </div>
              </div>
            </div>

            {/* Textbooks & References */}
            {viewingSubject.textbooks && (
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs space-y-1">
                <span className="font-bold text-blue-700 block text-[11px] uppercase">Recommended Textbooks & References:</span>
                <p className="text-slate-700 font-medium">{viewingSubject.textbooks}</p>
              </div>
            )}

            {/* Modal Bottom Close & Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Syllabus</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const cur = viewingSubject;
                    setViewingSubject(null);
                    handleOpenEditSubject(cur);
                  }}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-all"
                >
                  Edit Subject
                </button>
                <button
                  type="button"
                  onClick={() => setViewingSubject(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 10. MODAL: ADD / EDIT SUBJECT                                             */}
      {/* ========================================================================= */}
      {(isAddSubjectOpen || editingSubject) && (
        <ModalPortal 
          isOpen={Boolean(isAddSubjectOpen || editingSubject)} 
          onClose={() => {
            setIsAddSubjectOpen(false);
            setEditingSubject(null);
          }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  {editingSubject ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                    {editingSubject ? 'Edit Subject Details' : 'Register New Curriculum Subject'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingSubject ? `Update curriculum syllabus and faculty for ${editingSubject.code}` : 'Add course details, syllabus modules, credits, and instructor'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsAddSubjectOpen(false);
                  setEditingSubject(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              
              {/* Subject Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="e.g. Artificial Intelligence & Machine Learning"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none transition-all ${
                    formErrors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-purple-500'
                  }`}
                />
                {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
              </div>

              {/* Code & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    placeholder="CS502"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm font-mono font-bold focus:bg-white focus:outline-none uppercase transition-all ${
                      formErrors.code ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-purple-500'
                    }`}
                  />
                  {formErrors.code && <p className="text-[11px] text-rose-500 mt-1">{formErrors.code}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={subjectForm.department}
                    onChange={(e) => handleSubjectDeptChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    {DEPARTMENTS.filter(d => d !== 'All Departments').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Year, Semester & Credits */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Year</label>
                  <select
                    value={subjectForm.year}
                    onChange={(e) => handleSubjectYearChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                  <select
                    value={subjectForm.sem}
                    onChange={(e) => setSubjectForm({ ...subjectForm, sem: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    {SEMESTERS.filter(s => s !== 'All Semesters').map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Credits</label>
                  <select
                    value={subjectForm.credits}
                    onChange={(e) => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-purple-600 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value={1}>1 Credit</option>
                    <option value={2}>2 Credits</option>
                    <option value={3}>3 Credits</option>
                    <option value={4}>4 Credits</option>
                    <option value={5}>5 Credits</option>
                    <option value={6}>6 Credits</option>
                  </select>
                </div>
              </div>

              {/* Type, LTP & Faculty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Type</label>
                  <select
                    value={subjectForm.type}
                    onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Core Theory">Core Theory</option>
                    <option value="Practical / Lab">Practical / Lab</option>
                    <option value="Professional Elective">Professional Elective</option>
                    <option value="Open Elective">Open Elective</option>
                    <option value="Capstone / Project">Capstone / Project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">L-T-P Structure</label>
                  <input
                    type="text"
                    value={subjectForm.ltp}
                    onChange={(e) => setSubjectForm({ ...subjectForm, ltp: e.target.value })}
                    placeholder="e.g. 3-1-0"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Faculty & Prerequisite */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Faculty In-Charge *
                    </label>
                    <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-bold">
                      HOD: {DEPARTMENT_HEADS[subjectForm.department] || 'Dr. Sunita Rao'}
                    </span>
                  </div>
                  <select
                    value={subjectForm.faculty}
                    onChange={(e) => setSubjectForm({ ...subjectForm, faculty: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    {DEPARTMENT_FACULTY_MEMBERS[subjectForm.department]?.map((fac) => (
                      <option key={fac.name} value={fac.name}>
                        {fac.name} {fac.isHod ? '⭐ (HOD - Head of Department)' : `(${fac.role})`}
                      </option>
                    )) || (
                      <option value={DEPARTMENT_HEADS[subjectForm.department] || 'Dr. Sunita Rao'}>
                        {DEPARTMENT_HEADS[subjectForm.department] || 'Dr. Sunita Rao'} (HOD)
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prerequisite Course</label>
                  <input
                    type="text"
                    value={subjectForm.prerequisite}
                    onChange={(e) => setSubjectForm({ ...subjectForm, prerequisite: e.target.value })}
                    placeholder="e.g. CS101 or None"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Textbooks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recommended Textbooks & References</label>
                <input
                  type="text"
                  value={subjectForm.textbooks}
                  onChange={(e) => setSubjectForm({ ...subjectForm, textbooks: e.target.value })}
                  placeholder="e.g. AI: A Modern Approach by Russell & Norvig"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddSubjectOpen(false);
                    setEditingSubject(null);
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingSubject ? 'Update Subject' : 'Save Subject'}</span>
                </button>
              </div>

            </form>

          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 11. MODAL: ADD / EDIT DEGREE PROGRAM                                      */}
      {/* ========================================================================= */}
      {(isAddProgramOpen || editingProgram) && (
        <ModalPortal 
          isOpen={Boolean(isAddProgramOpen || editingProgram)} 
          onClose={() => {
            setIsAddProgramOpen(false);
            setEditingProgram(null);
          }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  {editingProgram ? <Pencil className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                    {editingProgram ? 'Edit Degree Program' : 'Add New Degree Program'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure academic curriculum degree structure, duration, and credit rules
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsAddProgramOpen(false);
                  setEditingProgram(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-4">
              {/* Program Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Program Name *</label>
                <input
                  type="text"
                  required
                  value={programFormData.name}
                  onChange={(e) => setProgramFormData({ ...programFormData, name: e.target.value })}
                  placeholder="e.g. B.Tech Computer Science & Engineering"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>

              {/* Code + Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Program Code *</label>
                  <input
                    type="text"
                    required
                    value={programFormData.code}
                    onChange={(e) => setProgramFormData({ ...programFormData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. BTECH-CSE"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold font-mono focus:bg-white focus:border-purple-500 focus:outline-none uppercase transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                  <select
                    value={programFormData.department}
                    onChange={(e) => setProgramFormData({ ...programFormData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    {DEPARTMENTS.filter(d => d !== 'All Departments').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Degree Level + Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Degree Level</label>
                  <select
                    value={programFormData.level}
                    onChange={(e) => setProgramFormData({ ...programFormData, level: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Undergraduate (UG)">Undergraduate (UG)</option>
                    <option value="Postgraduate (PG)">Postgraduate (PG)</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Duration</label>
                  <select
                    value={programFormData.durationYears}
                    onChange={(e) => {
                      const years = parseInt(e.target.value);
                      setProgramFormData({ 
                        ...programFormData, 
                        durationYears: years,
                        totalSemesters: years * 2
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value={2}>2 Years (4 Semesters - MBA/MCA)</option>
                    <option value={3}>3 Years (6 Semesters - BCA/B.Sc)</option>
                    <option value={4}>4 Years (8 Semesters - B.Tech/B.E)</option>
                  </select>
                </div>
              </div>

              {/* Total Credits Required */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Credits for Degree Award *</label>
                <input
                  type="number"
                  min="60"
                  max="240"
                  value={programFormData.totalCredits}
                  onChange={(e) => setProgramFormData({ ...programFormData, totalCredits: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddProgramOpen(false);
                    setEditingProgram(null);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingProgram ? 'Update Program' : 'Save Degree Program'}</span>
                </button>
              </div>
            </form>

          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 12. MODAL: REALLOCATE FACULTY                                             */}
      {/* ========================================================================= */}
      {reallocatingSubject && (
        <ModalPortal 
          isOpen={Boolean(reallocatingSubject)} 
          onClose={() => setReallocatingSubject(null)}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">Reassign Course Faculty</h3>
                  <p className="text-[11px] text-slate-500">Update instructor assignment for this course</p>
                </div>
              </div>
              <button onClick={() => setReallocatingSubject(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-100 text-xs">
              <p className="font-extrabold text-purple-950">{reallocatingSubject.code}: {reallocatingSubject.name}</p>
              <p className="text-purple-700 mt-0.5 font-medium">Department: {reallocatingSubject.department} • {reallocatingSubject.credits} Credits</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select New Faculty In-Charge *</label>
              <input
                type="text"
                value={newFacultyName}
                onChange={(e) => setNewFacultyName(e.target.value)}
                placeholder="e.g. Prof. Ramesh Kumar"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReallocatingSubject(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReallocation}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Allocation</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* 13. MODAL: DELETE CONFIRMATION                                            */}
      {/* ========================================================================= */}
      {(deletingSubject || deletingProgram) && (
        <ModalPortal 
          isOpen={Boolean(deletingSubject || deletingProgram)} 
          onClose={() => {
            setDeletingSubject(null);
            setDeletingProgram(null);
          }}
        >
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  Delete {deletingSubject ? 'Subject' : 'Degree Program'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to remove <strong className="text-slate-800">{deletingSubject?.name || deletingProgram?.name}</strong>?
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-700 font-medium">
              This will permanently remove this item from the curriculum syllabus catalog.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeletingSubject(null);
                  setDeletingProgram(null);
                }}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deletingSubject ? handleConfirmDeleteSubject : handleConfirmDeleteProgram}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
