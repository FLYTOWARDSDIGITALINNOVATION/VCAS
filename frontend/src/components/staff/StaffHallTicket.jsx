import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE, BACKEND_URL, getKnownDepartments } from '../../apiConfig';
import {
  Ticket, Building2, Users, Calendar, Clock, Download, Printer,
  Search, Filter, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw,
  Eye, BookOpen, Sparkles, X, UserPlus, Save, Pencil, Check, Award,
  RotateCcw
} from 'lucide-react';
import ModalPortal from '../ModalPortal';

// API_BASE imported from apiConfig

const DEFAULT_INSTRUCTIONS = [
  'Candidates must bring this Hall Ticket along with their official College Identity Card to every examination session.',
  'Candidates should occupy their allotted seats at least 15 minutes prior to the commencement of the examination.',
  'Possession of mobile phones, smartwatches, programmable calculators, or unauthorized study materials inside the hall is strictly prohibited.',
  'No candidate will be allowed to enter the exam hall 30 minutes after the commencement of the exam or leave 30 minutes before closing.',
  'Students must sign in the attendance sheet and on the hall ticket in the presence of the Hall Superintendent.'
];

const ALL_SEMESTERS = [1, 2, 3, 4, 5, 6];
const DEFAULT_DEPTS = getKnownDepartments();

// Local storage helpers for persisting custom subject timing and dates across reloads
const getSavedCustomTimings = () => {
  try {
    const raw = localStorage.getItem('vcas_staff_custom_subjects_timing');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveCustomTiming = (code, timingObj) => {
  if (!code) return;
  try {
    const current = getSavedCustomTimings();
    const cleanKey = code.toUpperCase().trim();
    current[cleanKey] = {
      ...(current[cleanKey] || {}),
      ...timingObj
    };
    localStorage.setItem('vcas_staff_custom_subjects_timing', JSON.stringify(current));
  } catch (e) {
    console.error('Error caching custom timing:', e);
  }
};

export default function StaffHallTicket({ staffUser, onNavigate, initialTab }) {
  // Navigation tabs: 'allocate' (Hall Allocation Setup) | 'tickets' (Hall Tickets & Print)
  const [activeTab, setActiveTab] = useState(initialTab || 'allocate');

  // Data states
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAllocationId, setSelectedAllocationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hallFilter, setHallFilter] = useState('All');
  const [allocationToDelete, setAllocationToDelete] = useState(null);
  const [isDeletingAllocation, setIsDeletingAllocation] = useState(false);
  const [showResetInstructionsModal, setShowResetInstructionsModal] = useState(false);

  // Currently viewed allocation (placed early to prevent ReferenceError TDZ)
  const currentAllocation = useMemo(() => {
    if (!selectedAllocationId) return allocations[0] || null;
    return allocations.find(a => a._id === selectedAllocationId) || allocations[0] || null;
  }, [allocations, selectedAllocationId]);

  // Unique halls in current allocation for dropdown filter and in-use calculation
  const currentAllocationHalls = useMemo(() => {
    if (!currentAllocation?.students) return [];
    const set = new Set();
    currentAllocation.students.forEach(s => {
      const h = (s.hallNo || '').trim();
      if (h && h !== 'TBA' && h !== 'Unassigned') {
        set.add(h);
      }
    });
    return Array.from(set);
  }, [currentAllocation]);

  // Actual count of students who have an assigned hall
  const allocatedStudentsCount = useMemo(() => {
    if (!currentAllocation?.students) return 0;
    return currentAllocation.students.filter(s => {
      const h = (s.hallNo || '').trim();
      return h && h !== 'TBA' && h !== 'Unassigned';
    }).length;
  }, [currentAllocation]);

  // Filtered students for current allocation
  const filteredStudents = useMemo(() => {
    if (!currentAllocation || !currentAllocation.students) return [];
    return currentAllocation.students.filter(st => {
      const matchesSearch =
        st.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.rollNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.seatNo?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesHall = hallFilter === 'All' || st.hallNo === hallFilter;
      return matchesSearch && matchesHall;
    });
  }, [currentAllocation, searchQuery, hallFilter]);

  // Single preview modal
  const [previewStudent, setPreviewStudent] = useState(null);
  const [previewExam, setPreviewExam] = useState(null);

  // Available departments & semesters (dynamically fetched from database)
  const [availableDepts, setAvailableDepts] = useState(() => getKnownDepartments());
  const [availableSemesters, setAvailableSemesters] = useState(ALL_SEMESTERS);
  const [availableSections, setAvailableSections] = useState(['All', 'A', 'B', 'C']);

  // Examination plan selection & typing mode states
  const [planFilterDept, setPlanFilterDept] = useState(staffUser?.department || '');
  const [planFilterSem, setPlanFilterSem] = useState(3);
  const [semesterParity, setSemesterParity] = useState('Odd'); // 'Odd' | 'Even'
  const [planTypingExamName, setPlanTypingExamName] = useState('Semester End Theory Examinations - 2026');

  // Candidate instructions state (fully editable)
  const [instructionsList, setInstructionsList] = useState(DEFAULT_INSTRUCTIONS);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [newInstructionText, setNewInstructionText] = useState('');
  const [editingInstructionIdx, setEditingInstructionIdx] = useState(null);
  const [editingInstructionText, setEditingInstructionText] = useState('');

  // Subject selection for allocation matrix (defaults to ALL so all candidates are visible)
  const [selectedAllocationSubject, setSelectedAllocationSubject] = useState('ALL');

  // Allocation Form State
  const [formExamName, setFormExamName] = useState('Semester End Theory Examinations - 2026');
  const [formExamType, setFormExamType] = useState('internal1');
  const [formAcademicYear, setFormAcademicYear] = useState('2025-2026');
  const [formDept, setFormDept] = useState(staffUser?.department || '');
  const [formSemester, setFormSemester] = useState(3);
  const [formSemesterParity, setFormSemesterParity] = useState('Odd'); // 'Odd' | 'Even'
  const [formSection, setFormSection] = useState('All');

  // Hall Grid State: 6 rows × 3 cols (manual entry)
  const [hallGridRows, setHallGridRows] = useState(6);
  const [hallGridCols, setHallGridCols] = useState(3);
  const [hallGrid, setHallGrid] = useState(() =>
    Array.from({ length: 6 }, () => Array(3).fill(''))
  );
  const [showHallGridModal, setShowHallGridModal] = useState(false);

  // Arrear Section state
  const [activeHallTab, setActiveHallTab] = useState('regular'); // 'regular' | 'arrear'
  const [arrearStudents, setArrearStudents] = useState([]);
  const [arrearOptionStudents, setArrearOptionStudents] = useState([]);
  const [loadingArrear, setLoadingArrear] = useState(false);
  const [arrearDept, setArrearDept] = useState(staffUser?.department || '');
  const [arrearYear, setArrearYear] = useState('All Years');
  const [arrearSemester, setArrearSemester] = useState('All Semesters');
  const [arrearBatch, setArrearBatch] = useState('All Batches');
  const [arrearSubject, setArrearSubject] = useState('All Subjects');
  const [arrearSearch, setArrearSearch] = useState('');
  const [selectedArrearStudent, setSelectedArrearStudent] = useState(null);

  const [hallsList, setHallsList] = useState(() => {
    try {
      const saved = localStorage.getItem('vcas_staff_halls_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter(h => h.hallNo && !h.hallNo.includes('Exam Hall 101') && !h.hallNo.includes('Exam Hall 102'));
          if (clean.length > 0) return clean;
        }
      }
      const customHalls = localStorage.getItem('vcas_custom_exam_halls');
      if (customHalls) {
        const parsedCustom = JSON.parse(customHalls);
        if (Array.isArray(parsedCustom) && parsedCustom.length > 0) {
          return parsedCustom.map(h => ({ hallNo: h.hallName || h.hallNo, capacity: h.capacity || 30 }));
        }
      }
    } catch { }
    return [];
  });
  const [newHallName, setNewHallName] = useState('');
  const [newHallCap, setNewHallCap] = useState(30);

  // Subjects schedule for this exam (restores cached subjects across reloads)
  const [subjectsSchedule, setSubjectsSchedule] = useState(() => {
    try {
      const raw = localStorage.getItem('vcas_staff_subjects_schedule');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [catalogSubjects, setCatalogSubjects] = useState([]);

  const getStudentArrearList = (student) => {
    if (!student) return [];
    const rawSubjects = Array.isArray(student.arrearSubjects) ? student.arrearSubjects : [];
    if (rawSubjects.length > 0) {
      return rawSubjects
        .map(item => ({
          code: String(item.code || item.subjectCode || item.subject || '').trim(),
          name: String(item.name || item.subjectName || 'Arrear Subject').trim() || 'Arrear Subject'
        }))
        .filter(item => item.code || item.name);
    }

    const total = Number(student.arrearsYetToBeCleared || student.totalArrearsTillLastSem || student.totalArrears || 0) || 0;
    if (!total) return [];

    const subjectPool = (catalogSubjects || []).filter(subject => {
      const subjectDept = String(subject.department || '').trim();
      const studentDept = String(student.department || '').trim();
      const deptMatch = !subjectDept || !studentDept || subjectDept.toLowerCase() === studentDept.toLowerCase();
      const subjectYear = String(subject.year || '').trim();
      const studentYear = String(student.year || '').trim();
      const yearMatch = !subjectYear || !studentYear || subjectYear.toLowerCase() === studentYear.toLowerCase() || String(subjectYear).replace(/\D/g, '') === String(studentYear).replace(/\D/g, '');
      return deptMatch && yearMatch;
    });

    const fallback = subjectPool.length > 0 ? subjectPool : [{ code: 'AR01', name: 'Arrear Subject 1' }];

    return Array.from({ length: Math.max(1, total) }, (_, idx) => {
      const source = fallback[idx % fallback.length] || fallback[0];
      return {
        code: source.code || `AR${String(idx + 1).padStart(2, '0')}`,
        name: source.name || `Arrear Subject ${idx + 1}`
      };
    }).slice(0, total);
  };

  const arrearYearOptions = useMemo(() => {
    const values = new Set(['All Years']);
    [...arrearStudents, ...arrearOptionStudents].forEach(student => {
      const year = String(student.year || student.currentYear || '').trim();
      if (year) values.add(year);
    });
    return Array.from(values);
  }, [arrearStudents, arrearOptionStudents]);

  const arrearBatchOptions = useMemo(() => {
    const values = new Set(['All Batches']);
    [...arrearStudents, ...arrearOptionStudents].forEach(student => {
      const batch = String(student.batch || '').trim();
      if (batch) values.add(batch);
    });
    return Array.from(values);
  }, [arrearStudents, arrearOptionStudents]);

  const arrearSubjectOptions = useMemo(() => {
    const subjectMap = new Map();
    [...arrearStudents, ...arrearOptionStudents].forEach(student => {
      getStudentArrearList(student).forEach(item => {
        const code = String(item.code || '').trim();
        if (!code) return;
        const name = String(item.name || '').trim();
        const key = code.toUpperCase();
        if (!subjectMap.has(key)) {
          subjectMap.set(key, { value: key, label: name ? `${code} - ${name}` : code });
        }
      });
    });

    (catalogSubjects || []).forEach(subject => {
      const code = String(subject.code || '').trim();
      if (!code) return;
      const name = String(subject.name || '').trim();
      const key = code.toUpperCase();
      if (!subjectMap.has(key)) {
        subjectMap.set(key, { value: key, label: name ? `${code} - ${name}` : code });
      }
    });

    const items = Array.from(subjectMap.values()).sort((a, b) => a.label.localeCompare(b.label));
    return [{ value: 'All Subjects', label: 'All Subjects' }, ...items];
  }, [arrearStudents, arrearOptionStudents, catalogSubjects]);

  const filteredArrearStudents = useMemo(() => {
    const query = arrearSearch.trim().toLowerCase();
    return arrearStudents.filter(student => {
      const deptOk = !arrearDept || !student.department || student.department.toLowerCase() === arrearDept.toLowerCase();
      const yearOk = arrearYear === 'All Years' || String(student.year || '').trim().toLowerCase() === arrearYear.toLowerCase();
      const semesterText = String(student.semester || student.sem || '').trim();
      const semOk = arrearSemester === 'All Semesters' || String(arrearSemester).replace(/\D/g, '') === String(semesterText).replace(/\D/g, '');
      const batchOk = arrearBatch === 'All Batches' || String(student.batch || '').trim() === arrearBatch;
      const subjectList = getStudentArrearList(student);
      const subjectOk = arrearSubject === 'All Subjects' || subjectList.some(item => {
        const code = String(item.code || '').trim().toUpperCase();
        const name = String(item.name || '').trim().toLowerCase();
        const selected = String(arrearSubject || '').trim().toUpperCase();
        return code === selected || name.includes(selected.toLowerCase());
      });
      const matchesSearch = !query || [
        student.name,
        student.regNo,
        student.rollNo,
        student.department,
        student.batch,
        student.year,
        ...subjectList.map(item => `${item.code} ${item.name}`)
      ].join(' ').toLowerCase().includes(query);

      return deptOk && yearOk && semOk && batchOk && subjectOk && matchesSearch;
    });
  }, [arrearStudents, arrearDept, arrearYear, arrearSemester, arrearBatch, arrearSubject, arrearSearch]);

  useEffect(() => {
    if (!filteredArrearStudents.length) {
      setSelectedArrearStudent(null);
      return;
    }

    if (!selectedArrearStudent || !filteredArrearStudents.some(student => (student._id || student.regNo || student.rollNo) === (selectedArrearStudent._id || selectedArrearStudent.regNo || selectedArrearStudent.rollNo))) {
      setSelectedArrearStudent(filteredArrearStudents[0]);
    }
  }, [filteredArrearStudents, selectedArrearStudent]);
  const [newSubCode, setNewSubCode] = useState('');
  const [customSubCode, setCustomSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubDate, setNewSubDate] = useState('');
  const [newSubSession, setNewSubSession] = useState('Forenoon (FN)');
  const [newSubTime, setNewSubTime] = useState('');

  // Set of subject codes explicitly removed by staff so they never re-appear
  const [deletedSubjectCodes, setDeletedSubjectCodes] = useState(() => {
    try {
      const saved = localStorage.getItem('vcas_deleted_subject_codes');
      const base = new Set(['SF76', 'CS2003', 'CS2006']);
      if (saved) {
        JSON.parse(saved).forEach(c => base.add(c));
      }
      return base;
    } catch {
      return new Set(['SF76', 'CS2003', 'CS2006']);
    }
  });

  // Listen for subject removals across the entire system
  useEffect(() => {
    const handleSubjectRemoved = (e) => {
      const code = e?.detail?.code;
      if (code) {
        const clean = code.toUpperCase();
        setDeletedSubjectCodes(prev => {
          const next = new Set(prev);
          next.add(clean);
          try { localStorage.setItem('vcas_deleted_subject_codes', JSON.stringify(Array.from(next))); } catch {}
          return next;
        });
        setCatalogSubjects(prev => prev.filter(s => (s.code || '').toUpperCase() !== clean));
        setSubjectsSchedule(prev => prev.filter(s => (s.code || '').toUpperCase() !== clean));
      }
    };
    window.addEventListener('vcas_subject_removed', handleSubjectRemoved);
    return () => window.removeEventListener('vcas_subject_removed', handleSubjectRemoved);
  }, []);

  // Enrolled students loaded for allocation
  const [studentsToAllocate, setStudentsToAllocate] = useState([]);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [savingAllocation, setSavingAllocation] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Manual Add Student form state
  const [manualRollNo, setManualRollNo] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualSection, setManualSection] = useState('A');
  const [manualHall, setManualHall] = useState('');
  const [manualSeat, setManualSeat] = useState('');

  // Fetch real departments and metadata on mount
  useEffect(() => {
    const fetchMetaAndDepartments = async () => {
      try {
        let depts = [];

        // 1. Fetch real departments from /api/departments
        try {
          const deptRes = await fetch(`${API_BASE}/departments`);
          const deptData = await deptRes.json();
          if (deptData.success && Array.isArray(deptData.data)) {
            const list = deptData.data.map(d => d.name?.trim()).filter(Boolean);
            depts.push(...list);
          }
        } catch (e) {
          console.warn('Error fetching departments:', e);
        }

        // 2. Fetch metadata from /api/hall-tickets/meta
        try {
          const metaRes = await fetch(`${API_BASE}/hall-tickets/meta`);
          const metaData = await metaRes.json();
          if (metaData.success) {
            if (metaData.departments?.length > 0) {
              depts.push(...metaData.departments);
            }
            if (metaData.sections?.length > 0) {
              setAvailableSections(metaData.sections);
            }
          }
        } catch (e) {
          console.warn('Error fetching hall-tickets meta:', e);
        }

        // Deduplicate departments
        const uniqueDepts = Array.from(new Set(depts.filter(Boolean)));
        const finalDepts = uniqueDepts.length > 0 ? uniqueDepts : DEFAULT_DEPTS;

        setAvailableDepts(finalDepts);
        setAvailableSemesters(ALL_SEMESTERS);

        // Pick matching department or first
        const match = finalDepts.find(d => staffUser?.department && d.toLowerCase().includes(staffUser.department.toLowerCase()));
        const targetDept = match || finalDepts[0] || 'Computer Science';
        setFormDept(targetDept);
        setPlanFilterDept(targetDept);
        loadAvailableSubjects(targetDept, formSemester, formSection);
      } catch (err) {
        console.error('Error in fetchMetaAndDepartments:', err);
        setAvailableDepts(DEFAULT_DEPTS);
        setAvailableSemesters(ALL_SEMESTERS);
        loadAvailableSubjects(formDept, formSemester, formSection);
      }
    };

    fetchMetaAndDepartments();
  }, [staffUser?.department]);

  // Sync plan filter, editable instructions, and subjects schedule when currentAllocation changes
  useEffect(() => {
    if (currentAllocation) {
      if (currentAllocation.department) setPlanFilterDept(currentAllocation.department);
      if (currentAllocation.semester) setPlanFilterSem(Number(currentAllocation.semester));
      if (currentAllocation.examName) setPlanTypingExamName(currentAllocation.examName);
      if (Array.isArray(currentAllocation.instructions) && currentAllocation.instructions.length > 0) {
        setInstructionsList(currentAllocation.instructions);
      }
      if (Array.isArray(currentAllocation.commonSubjects) && currentAllocation.commonSubjects.length > 0) {
        const cachedTimings = getSavedCustomTimings();
        const enriched = currentAllocation.commonSubjects
          .filter(s => !deletedSubjectCodes.has(s.code.toUpperCase()))
          .map(s => {
            const custom = cachedTimings[s.code.toUpperCase()];
            return {
              ...s,
              name: custom?.name || s.name,
              date: custom?.date || s.date,
              session: custom?.session || s.session,
              time: (custom?.time !== undefined && custom?.time !== null) ? custom.time : s.time
            };
          });
        setSubjectsSchedule(enriched);
        try {
          localStorage.setItem('vcas_staff_subjects_schedule', JSON.stringify(enriched));
        } catch {}
      }
    }
  }, [currentAllocation?._id]);

  // Fetch all saved allocations on load
  const loadAllocations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/hall-tickets`);
      const data = await res.json();
      if (data.success) {
        setAllocations(data.data || []);
        if (data.data?.length > 0) {
          setSelectedAllocationId(prev => prev || data.data[0]._id);
        } else {
          setSelectedAllocationId(null);
        }
      }
    } catch (err) {
      console.error('Failed to load hall tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllocations();
  }, []);

  // Sync halls from currently selected allocation into hallsList so they stay available
  useEffect(() => {
    if (currentAllocation && Array.isArray(currentAllocation.halls) && currentAllocation.halls.length > 0) {
      const validHalls = currentAllocation.halls.filter(h =>
        h.hallNo &&
        !h.hallNo.includes('Exam Hall 101') &&
        !h.hallNo.includes('Exam Hall 102')
      );
      if (validHalls.length > 0) {
        setHallsList(prev => {
          const seen = new Set(prev.map(h => (h.hallNo || '').toLowerCase()));
          const fresh = validHalls.filter(h => h.hallNo && !seen.has(h.hallNo.toLowerCase()));
          const updated = fresh.length > 0 ? [...prev, ...fresh] : prev;
          try {
            localStorage.setItem('vcas_staff_halls_list', JSON.stringify(updated));
          } catch { }
          return updated;
        });
      }
    }
  }, [currentAllocation]);

  // Fetch available subjects for the chosen department & semester
  const loadAvailableSubjects = async (dept, sem, sec) => {
    try {
      const activeDept = dept || formDept;
      const params = new URLSearchParams();
      if (activeDept && activeDept !== 'All') params.append('department', activeDept);

      const res = await fetch(`${API_BASE}/hall-tickets/eligible-students?${params.toString()}`);
      const data = await res.json();

      let fetchedStudents = (data.success && Array.isArray(data.students)) ? data.students : [];

      // Fallback: If no students returned, fetch all active registered students from /students
      if (fetchedStudents.length === 0) {
        try {
          const sRes = await fetch(`${API_BASE}/students`);
          const sData = await sRes.json();
          if (sData.success && Array.isArray(sData.data)) {
            fetchedStudents = sData.data;
          }
        } catch (sErr) {
          console.warn('Error fetching fallback students:', sErr);
        }
      }

      if (fetchedStudents.length > 0) {
        setStudentsToAllocate(prev => {
          const cleanSubs = (data.subjects || []).filter(s => !deletedSubjectCodes.has(s.code.toUpperCase()));
          const existingMap = new Map(prev.map(s => [(s.rollNo || '').toUpperCase(), s]));

          fetchedStudents.forEach(st => {
            const roll = (st.rollNo || st.regNo || st.studentId || '').toUpperCase();
            if (!roll) return;
            if (existingMap.has(roll)) {
              const cur = existingMap.get(roll);
              existingMap.set(roll, {
                ...cur,
                name: st.name || st.fullName || cur.name,
                dept: st.dept || st.department || cur.dept || activeDept,
                semester: st.semester || (st.sem ? parseInt(st.sem) || cur.semester : cur.semester) || 1,
                section: st.section || cur.section || 'A',
                subjects: (cur.subjects && cur.subjects.length > 0) ? cur.subjects : cleanSubs
              });
            } else {
              existingMap.set(roll, {
                rollNo: st.rollNo || st.regNo || roll,
                name: st.name || st.fullName || 'Student',
                dept: st.dept || st.department || activeDept,
                semester: st.semester || (st.sem ? parseInt(st.sem) || 1 : 1),
                section: st.section || 'A',
                hallNo: '',
                seatNo: '',
                eligible: true,
                remarks: 'Eligible for Examination',
                subjects: cleanSubs
              });
            }
          });

          return Array.from(existingMap.values());
        });
      }

      if (data.success && Array.isArray(data.subjects) && data.subjects.length > 0) {
        const cleanCatalog = data.subjects.filter(s => !deletedSubjectCodes.has((s.code || '').toUpperCase()));
        setCatalogSubjects(cleanCatalog);
        const cachedTimings = getSavedCustomTimings();

        setSubjectsSchedule(prev => {
          const prevMap = new Map(prev.map(s => [s.code.toUpperCase(), s]));
          const merged = [];

          // Filter out subjects that staff explicitly removed
          const validSubs = cleanCatalog;

          validSubs.forEach((dbSub, idx) => {
            const code = dbSub.code.toUpperCase();
            const baseDay = 15 + (idx * 3);
            const defaultDate = `2026-04-${baseDay < 10 ? '0' + baseDay : baseDay}`;
            const custom = cachedTimings[code];

            const resolvedDate = custom?.date || (dbSub.date && dbSub.date !== 'TBA' ? dbSub.date : defaultDate);
            const resolvedSession = custom?.session || dbSub.session || 'Forenoon (FN)';
            const resolvedTime = (custom?.time !== undefined && custom?.time !== null)
              ? custom.time
              : (dbSub.time !== undefined && dbSub.time !== null ? dbSub.time : '09:30 AM - 12:30 PM');
            const resolvedName = custom?.name || dbSub.name;

            if (prevMap.has(code)) {
              const existing = prevMap.get(code);
              merged.push({
                ...existing,
                name: resolvedName || existing.name,
                date: (existing.date && existing.date !== 'TBA') ? existing.date : resolvedDate,
                session: existing.session || resolvedSession,
                time: (existing.time !== undefined && existing.time !== null && existing.time !== '')
                  ? existing.time
                  : resolvedTime
              });
              prevMap.delete(code);
            } else {
              merged.push({
                code: dbSub.code,
                name: resolvedName,
                date: resolvedDate,
                session: resolvedSession,
                time: resolvedTime
              });
            }
          });

          // Keep user-added custom subjects that are not in DB (as long as not deleted)
          prevMap.forEach(customSub => {
            if (!deletedSubjectCodes.has(customSub.code.toUpperCase())) {
              const custom = cachedTimings[customSub.code.toUpperCase()];
              merged.push({
                ...customSub,
                name: custom?.name || customSub.name,
                date: custom?.date || customSub.date,
                session: custom?.session || customSub.session,
                time: (custom?.time !== undefined && custom?.time !== null) ? custom.time : customSub.time
              });
            }
          });
          try {
            localStorage.setItem('vcas_staff_subjects_schedule', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    } catch (err) {
      console.error('Error loading subjects:', err);
    }
  };

  // Fetch eligible students from database classes for the staff-selected subject
  const loadEligibleStudents = async (dept, sem, sec, subCode) => {
    const activeSub = subCode !== undefined ? subCode : selectedAllocationSubject;
    if (!activeSub) {
      setStudentsToAllocate([]);
      return;
    }

    setFetchingStudents(true);
    try {
      const activeDept = dept || formDept;
      const activeSem = sem || formSemester;
      const activeSec = sec || formSection;

      const params = new URLSearchParams({
        department: activeDept,
        subjectCode: activeSub
      });
      if (activeSem && activeSem !== 'All') params.append('semester', activeSem);
      if (activeSec && activeSec !== 'All') params.append('section', activeSec);

      const res = await fetch(`${API_BASE}/hall-tickets/eligible-students?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        if (data.subjects && data.subjects.length > 0) {
          const cachedTimings = getSavedCustomTimings();

          setSubjectsSchedule(prev => {
            const prevMap = new Map(prev.map(s => [s.code.toUpperCase(), s]));
            const merged = [];

            const validSubs = data.subjects.filter(s => !deletedSubjectCodes.has(s.code.toUpperCase()));

            validSubs.forEach((dbSub, idx) => {
              const code = dbSub.code.toUpperCase();
              const baseDay = 15 + (idx * 3);
              const defaultDate = `2026-04-${baseDay < 10 ? '0' + baseDay : baseDay}`;
              const custom = cachedTimings[code];

              const resolvedDate = custom?.date || (dbSub.date && dbSub.date !== 'TBA' ? dbSub.date : defaultDate);
              const resolvedSession = custom?.session || dbSub.session || 'Forenoon (FN)';
              const resolvedTime = (custom?.time !== undefined && custom?.time !== null)
                ? custom.time
                : (dbSub.time !== undefined && dbSub.time !== null ? dbSub.time : '09:30 AM - 12:30 PM');
              const resolvedName = custom?.name || dbSub.name;

              if (prevMap.has(code)) {
                const existing = prevMap.get(code);
                merged.push({
                  ...existing,
                  name: resolvedName || existing.name,
                  date: (existing.date && existing.date !== 'TBA') ? existing.date : resolvedDate,
                  session: existing.session || resolvedSession,
                  time: (existing.time !== undefined && existing.time !== null && existing.time !== '')
                    ? existing.time
                    : resolvedTime
                });
                prevMap.delete(code);
              } else {
                merged.push({
                  code: dbSub.code,
                  name: resolvedName,
                  date: resolvedDate,
                  session: resolvedSession,
                  time: resolvedTime
                });
              }
            });

            prevMap.forEach(customSub => {
              if (!deletedSubjectCodes.has(customSub.code.toUpperCase())) {
                const custom = cachedTimings[customSub.code.toUpperCase()];
                merged.push({
                  ...customSub,
                  name: custom?.name || customSub.name,
                  date: custom?.date || customSub.date,
                  session: custom?.session || customSub.session,
                  time: (custom?.time !== undefined && custom?.time !== null) ? custom.time : customSub.time
                });
              }
            });
            try {
              localStorage.setItem('vcas_staff_subjects_schedule', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }

        // Find the selected subject's full details (name, date, session, time)
        const matchingScheduleSub = subjectsSchedule.find(s => s.code.toUpperCase() === activeSub.toUpperCase());
        const chosenSub = {
          code: activeSub.toUpperCase(),
          name: matchingScheduleSub?.name || (data.subjects?.find(s => s.code.toUpperCase() === activeSub.toUpperCase())?.name) || activeSub,
          date: matchingScheduleSub?.date || '2026-04-18',
          session: matchingScheduleSub?.session || 'Forenoon (FN)',
          time: matchingScheduleSub?.time || '09:30 AM - 12:30 PM'
        };

        if (data.students && data.students.length > 0) {
          setStudentsToAllocate(prev => {
            const studentMap = new Map();
            // Preserve all previously allocated students across all subjects
            prev.forEach(s => {
              if (s && s.rollNo) {
                studentMap.set(s.rollNo.toUpperCase(), {
                  ...s,
                  subjects: Array.isArray(s.subjects) ? [...s.subjects] : []
                });
              }
            });

            // Merge newly loaded students for this subject
            data.students.forEach(st => {
              const roll = (st.rollNo || '').toUpperCase();
              if (!roll) return;

              if (studentMap.has(roll)) {
                const existing = studentMap.get(roll);
                const curSubs = existing.subjects || [];
                if (!curSubs.some(s => s.code.toUpperCase() === chosenSub.code.toUpperCase())) {
                  existing.subjects.push(chosenSub);
                }
                studentMap.set(roll, existing);
              } else {
                studentMap.set(roll, {
                  rollNo: st.rollNo,
                  name: st.name,
                  dept: st.dept || activeDept,
                  semester: st.semester || activeSem,
                  section: st.section || 'A',
                  hallNo: '',
                  seatNo: '',
                  eligible: true,
                  remarks: 'Eligible for Examination',
                  subjects: [chosenSub]
                });
              }
            });

            return Array.from(studentMap.values());
          });
          setStatusMessage({ type: 'success', text: `Loaded student(s) for ${chosenSub.code} (${chosenSub.name}). All existing allocated students preserved.` });
        } else {
          setStatusMessage({ type: 'info', text: `No new students found enrolled in subject ${activeSub}. Existing allocated students remain intact.` });
        }
      }
    } catch (err) {
      console.error('Error fetching eligible students:', err);
    } finally {
      setFetchingStudents(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Fetch subjects for chosen dept & semester when entering Allocate tab or when dept/sem changes
  useEffect(() => {
    if (activeTab === 'allocate') {
      loadAvailableSubjects(formDept, formSemester, formSection);
      if (currentAllocation?.students?.length > 0) {
        setStudentsToAllocate(prev => {
          const map = new Map();
          currentAllocation.students.forEach(s => {
            if (s && s.rollNo) {
              map.set(s.rollNo.toUpperCase(), {
                ...s,
                subjects: Array.isArray(s.subjects) ? [...s.subjects] : []
              });
            }
          });
          prev.forEach(s => {
            if (s && s.rollNo) {
              const roll = s.rollNo.toUpperCase();
              if (map.has(roll)) {
                const existing = map.get(roll);
                const mergedSubs = [...existing.subjects];
                (s.subjects || []).forEach(sub => {
                  if (!mergedSubs.some(x => x.code.toUpperCase() === sub.code.toUpperCase())) {
                    mergedSubs.push(sub);
                  }
                });
                map.set(roll, {
                  ...existing,
                  ...s,
                  hallNo: s.hallNo || existing.hallNo,
                  seatNo: s.seatNo || existing.seatNo,
                  subjects: mergedSubs
                });
              } else {
                map.set(roll, s);
              }
            }
          });
          return Array.from(map.values());
        });
      }
    }
  }, [activeTab, formDept, formSemester, formSection, currentAllocation?._id]);

  // Add Hall to hallsList
  const handleAddHall = () => {
    if (!newHallName.trim()) {
      alert('Please enter a Hall Name or Room Number (e.g. D2 or Room 204).');
      return;
    }
    const cleanName = newHallName.trim();
    if (hallsList.some(h => h.hallNo.toLowerCase() === cleanName.toLowerCase())) {
      alert(`Hall "${cleanName}" is already in the halls list.`);
      return;
    }
    const cap = Number(newHallCap) > 0 ? Number(newHallCap) : 30;
    const updated = [...hallsList, { hallNo: cleanName, capacity: cap }];
    setHallsList(updated);
    try {
      localStorage.setItem('vcas_staff_halls_list', JSON.stringify(updated));
    } catch { }

    try {
      fetch(`${API_BASE}/exams/halls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hallName: cleanName.toLowerCase().startsWith('hall') ? cleanName : `Hall ${cleanName}`,
          capacity: cap,
          status: 'Available',
          departments: `${formDept} (Sem ${formSemester})`,
          invigilator: staffUser?.name || 'Staff In-Charge'
        })
      });
    } catch (_) {}

    setNewHallName('');
    setNewHallCap(30);
    setStatusMessage({ type: 'success', text: `Added Hall: ${cleanName} (Capacity: ${cap})` });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleRemoveHall = (index) => {
    setHallsList(prev => {
      const updated = prev.filter((_, i) => i !== index);
      try {
        localStorage.setItem('vcas_staff_halls_list', JSON.stringify(updated));
      } catch { }
      return updated;
    });
  };

  // Students displayed in allocation matrix:
  // All students who are already allocated with a hall are ALWAYS displayed.
  // When a subject is chosen, unallocated students for that subject are also shown.
  // If 'ALL' or empty, all students in the allocation matrix are displayed.
  const displayedStudents = useMemo(() => {
    if (!selectedAllocationSubject || selectedAllocationSubject === 'ALL') {
      return studentsToAllocate;
    }
    const cleanTargetCode = selectedAllocationSubject.toUpperCase();
    return studentsToAllocate.filter(st => {
      // Always display students who already have a hall allocated!
      const hasHall = st.hallNo && st.hallNo !== 'TBA' && st.hallNo !== 'Unassigned';
      if (hasHall) return true;
      if (!st.subjects || st.subjects.length === 0) return true;
      return st.subjects.some(s => s.code && s.code.toUpperCase() === cleanTargetCode);
    });
  }, [studentsToAllocate, selectedAllocationSubject]);

  // Assign a hall to all displayed students in the matrix
  const handleAssignHallToAll = async (hallName) => {
    if (!hallName) return;
    const targetRolls = new Set(displayedStudents.map(s => s.rollNo.toUpperCase()));
    const updatedStudents = studentsToAllocate.map(st => {
      if (targetRolls.has(st.rollNo.toUpperCase())) {
        const subs = (st.subjects && st.subjects.length > 0) ? st.subjects.map(sub => {
          const matched = subjectsSchedule.find(s => s.code.toUpperCase() === (sub.code || '').toUpperCase());
          return {
            code: sub.code.toUpperCase(),
            name: sub.name || matched?.name || sub.code,
            date: (matched?.date && matched.date !== 'TBA') ? matched.date : (sub.date || ''),
            session: matched?.session || sub.session || 'Forenoon (FN)',
            time: matched?.time || sub.time || '09:30 AM - 12:30 PM'
          };
        }) : subjectsSchedule.map(s => ({
          code: s.code.toUpperCase(),
          name: s.name,
          date: (s.date && s.date !== 'TBA') ? s.date : '',
          session: s.session || 'Forenoon (FN)',
          time: s.time || '09:30 AM - 12:30 PM'
        }));
        return {
          ...st,
          hallNo: hallName,
          subjects: subs
        };
      }
      return st;
    });

    setStudentsToAllocate(updatedStudents);
    setStatusMessage({ type: 'success', text: `Assigned "${hallName}" and exam schedule to ${displayedStudents.length} candidate(s)!` });
    setTimeout(() => setStatusMessage(null), 3500);

    // Auto-persist immediately to MongoDB
    try {
      const payload = {
        examName: (formExamName || currentAllocation?.examName || 'Semester End Examination 2026').trim(),
        examType: formExamType || 'internal1',
        academicYear: (formAcademicYear || '2025-2026').trim(),
        department: formDept || currentAllocation?.department || 'Computer Science',
        semester: Number(formSemester || currentAllocation?.semester || 1),
        section: formSection || 'All',
        halls: hallsList.length > 0 ? hallsList : [{ hallNo: hallName, capacity: 30 }],
        allocatedByStaffId: staffUser?.staffId || 'STAFF',
        allocatedByStaffName: staffUser?.name || 'Faculty In-Charge',
        commonSubjects: subjectsSchedule,
        students: updatedStudents.map((st, i) => ({
          rollNo: st.rollNo,
          name: st.name,
          dept: st.dept || formDept,
          semester: Number(st.semester || formSemester || 1),
          section: st.section || 'A',
          hallNo: st.hallNo || hallName,
          seatNo: st.seatNo || `SEAT-${i + 1}`,
          eligible: true,
          remarks: 'Eligible for Examination',
          subjects: st.subjects && st.subjects.length > 0 ? st.subjects : subjectsSchedule
        }))
      };

      await fetch(`${API_BASE}/hall-tickets/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchAllocations();
    } catch (e) {
      console.warn('Auto-save hall allocation to backend failed:', e);
    }
  };

  // All selectable halls (never removes any hall once assigned to a student)
  const allSelectableHalls = useMemo(() => {
    const map = new Map();
    const isExcluded = (name) => {
      if (!name) return true;
      const lower = name.toLowerCase();
      return lower.includes('exam hall 101') || lower.includes('exam hall 102');
    };

    hallsList.forEach(h => {
      const name = (h.hallNo || '').trim();
      if (name && !isExcluded(name)) map.set(name.toLowerCase(), { hallNo: name, capacity: h.capacity || 30 });
    });
    studentsToAllocate.forEach(s => {
      const name = (s.hallNo || '').trim();
      if (name && name !== 'TBA' && name !== 'Unassigned' && !isExcluded(name) && !map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), { hallNo: name, capacity: 30 });
      }
    });
    if (currentAllocation?.halls) {
      currentAllocation.halls.forEach(h => {
        const name = (h.hallNo || '').trim();
        if (name && !isExcluded(name) && !map.has(name.toLowerCase())) {
          map.set(name.toLowerCase(), { hallNo: name, capacity: h.capacity || 30 });
        }
      });
    }
    if (currentAllocation?.students) {
      currentAllocation.students.forEach(s => {
        const name = (s.hallNo || '').trim();
        if (name && name !== 'TBA' && name !== 'Unassigned' && !isExcluded(name) && !map.has(name.toLowerCase())) {
          map.set(name.toLowerCase(), { hallNo: name, capacity: 30 });
        }
      });
    }
    return Array.from(map.values());
  }, [hallsList, studentsToAllocate, currentAllocation]);

  // Add Subject to subjects schedule
  const handleAddSubject = () => {
    const effectiveCode = (newSubCode === 'CUSTOM' ? customSubCode : newSubCode).trim().toUpperCase();
    if (!effectiveCode || !newSubName.trim()) {
      alert('Please select or enter both Course Code and Subject Name.');
      return;
    }
    const cleanCode = effectiveCode;
    const cleanName = newSubName.trim();
    const cleanDate = newSubDate || '';
    const cleanSession = newSubSession || 'Forenoon (FN)';
    const cleanTime = newSubTime.trim() || '';

    // If previously deleted, un-delete it
    setDeletedSubjectCodes(prev => {
      const next = new Set(prev);
      next.delete(cleanCode);
      try {
        localStorage.setItem('vcas_deleted_subject_codes', JSON.stringify(Array.from(next)));
      } catch { }
      return next;
    });

    // Cache custom timing
    saveCustomTiming(cleanCode, {
      code: cleanCode,
      name: cleanName,
      date: cleanDate,
      session: cleanSession,
      time: cleanTime
    });

    setSubjectsSchedule(prev => {
      const idx = prev.findIndex(s => s.code.toUpperCase() === cleanCode);
      let next;
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          code: cleanCode,
          name: cleanName,
          date: cleanDate,
          session: cleanSession,
          time: cleanTime
        };
        next = copy;
      } else {
        next = [
          ...prev,
          {
            code: cleanCode,
            name: cleanName,
            date: cleanDate,
            session: cleanSession,
            time: cleanTime
          }
        ];
      }
      try {
        localStorage.setItem('vcas_staff_subjects_schedule', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Background sync to backend
    fetch(`${API_BASE}/hall-tickets/update-subject-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: cleanCode,
        name: cleanName,
        date: cleanDate,
        session: cleanSession,
        time: cleanTime,
        department: formDept,
        semester: Number(formSemester) || 1,
        allocationId: currentAllocation?._id
      })
    }).catch(e => console.warn('Could not sync added subject:', e));

    if (currentAllocation?._id) {
      setAllocations(prev => prev.map(a => {
        if (a._id === currentAllocation._id) {
          const subs = a.commonSubjects || [];
          const idx = subs.findIndex(s => s.code.toUpperCase() === cleanCode);
          let updatedSubs;
          if (idx >= 0) {
            updatedSubs = [...subs];
            updatedSubs[idx] = { code: cleanCode, name: cleanName, date: cleanDate, session: cleanSession, time: cleanTime };
          } else {
            updatedSubs = [...subs, { code: cleanCode, name: cleanName, date: cleanDate, session: cleanSession, time: cleanTime }];
          }
          return { ...a, commonSubjects: updatedSubs };
        }
        return a;
      }));
    }

    setStudentsToAllocate(prev => prev.map(st => {
      const existingSubs = st.subjects || [];
      const idx = existingSubs.findIndex(s => (s.code || '').toUpperCase() === cleanCode);
      let updatedSubs;
      if (idx >= 0) {
        updatedSubs = [...existingSubs];
        updatedSubs[idx] = { code: cleanCode, name: cleanName, date: cleanDate, session: cleanSession, time: cleanTime };
      } else {
        updatedSubs = [...existingSubs, { code: cleanCode, name: cleanName, date: cleanDate, session: cleanSession, time: cleanTime }];
      }
      return { ...st, subjects: updatedSubs };
    }));

    setNewSubCode('');
    setCustomSubCode('');
    setNewSubName('');
    setNewSubDate('');
    setNewSubTime('');
    setStatusMessage({ type: 'success', text: `Subject ${cleanCode} (${cleanName}) added to schedule.` });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleRemoveSubject = (code) => {
    const cleanCode = code.toUpperCase();

    // Remember in deletedSubjectCodes persistently so it is never re-fetched
    setDeletedSubjectCodes(prev => {
      const next = new Set(prev);
      next.add(cleanCode);
      try {
        localStorage.setItem('vcas_deleted_subject_codes', JSON.stringify(Array.from(next)));
      } catch { }
      return next;
    });

    setSubjectsSchedule(prev => prev.filter(s => s.code.toUpperCase() !== cleanCode));

    if (selectedAllocationSubject && selectedAllocationSubject.toUpperCase() === cleanCode) {
      setSelectedAllocationSubject('');
    }

    if (currentAllocation?._id) {
      setAllocations(prev => prev.map(a => {
        if (a._id === currentAllocation._id) {
          return {
            ...a,
            commonSubjects: (a.commonSubjects || []).filter(s => s.code.toUpperCase() !== cleanCode)
          };
        }
        return a;
      }));
    }

    setStatusMessage({ type: 'info', text: `Removed subject ${code} from schedule.` });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Clear / delete exam time from a scheduled subject
  const handleClearSubjectTime = async (code) => {
    const cleanCode = code.toUpperCase();
    saveCustomTiming(cleanCode, { time: '' });

    setSubjectsSchedule(prev => {
      const next = prev.map(s => {
        if (s.code.toUpperCase() === cleanCode) {
          return { ...s, time: '' };
        }
        return s;
      });
      try {
        localStorage.setItem('vcas_staff_subjects_schedule', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (currentAllocation?._id) {
      setAllocations(prev => prev.map(a => {
        if (a._id === currentAllocation._id) {
          return {
            ...a,
            commonSubjects: (a.commonSubjects || []).map(s => s.code.toUpperCase() === cleanCode ? { ...s, time: '' } : s),
            students: (a.students || []).map(st => ({
              ...st,
              subjects: (st.subjects || []).map(s => s.code.toUpperCase() === cleanCode ? { ...s, time: '' } : s)
            }))
          };
        }
        return a;
      }));
    }

    setStudentsToAllocate(prev => prev.map(st => ({
      ...st,
      subjects: (st.subjects || []).map(s => s.code.toUpperCase() === cleanCode ? { ...s, time: '' } : s)
    })));

    setStatusMessage({ type: 'info', text: `Exam time cleared for ${cleanCode}. Saving...` });

    try {
      await fetch(`${API_BASE}/hall-tickets/update-subject-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          time: '',
          department: formDept,
          semester: Number(formSemester) || 1,
          allocationId: currentAllocation?._id
        })
      });
      setStatusMessage({ type: 'info', text: `Exam time deleted for ${cleanCode}.` });
    } catch (e) {
      console.warn('Could not sync clear time to server:', e);
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Editing state for subjects
  const [editingSubCode, setEditingSubCode] = useState(null);
  const [editSubForm, setEditSubForm] = useState({
    code: '',
    name: '',
    date: '',
    session: 'Forenoon (FN)',
    time: ''
  });

  const handleStartEditSubject = (sub) => {
    setEditingSubCode(sub.code);
    let cleanDate = '';
    if (sub.date && /^\d{4}-\d{2}-\d{2}$/.test(sub.date.trim())) {
      cleanDate = sub.date.trim();
    } else if (sub.date && /^\d{2}-\d{2}-\d{4}$/.test(sub.date.trim())) {
      const parts = sub.date.trim().split('-');
      cleanDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else {
      cleanDate = '2026-04-20';
    }

    setEditSubForm({
      code: sub.code,
      name: sub.name,
      date: cleanDate,
      session: sub.session || 'Forenoon (FN)',
      time: sub.time || ''
    });
  };

  const handleSaveEditSubject = async (originalCode) => {
    if (!editSubForm.code.trim() || !editSubForm.name.trim()) {
      alert('Subject Code and Title cannot be empty.');
      return;
    }
    const cleanCode = editSubForm.code.trim().toUpperCase();
    const cleanName = editSubForm.name.trim();
    const cleanDate = editSubForm.date || '2026-04-20';
    const cleanSession = editSubForm.session || 'Forenoon (FN)';
    const cleanTime = editSubForm.time.trim();

    // 1. Immediately cache in local storage to prevent any overwrite on reload
    saveCustomTiming(cleanCode, {
      code: cleanCode,
      name: cleanName,
      date: cleanDate,
      session: cleanSession,
      time: cleanTime
    });
    if (originalCode && originalCode.toUpperCase() !== cleanCode) {
      saveCustomTiming(originalCode.toUpperCase(), {
        code: cleanCode,
        name: cleanName,
        date: cleanDate,
        session: cleanSession,
        time: cleanTime
      });
    }

    // 2. Update React subjectsSchedule state
    setSubjectsSchedule(prev => {
      const next = prev.map(s => {
        if (s.code.toUpperCase() === originalCode.toUpperCase()) {
          return {
            ...s,
            code: cleanCode,
            name: cleanName,
            date: cleanDate,
            session: cleanSession,
            time: cleanTime
          };
        }
        return s;
      });
      try {
        localStorage.setItem('vcas_staff_subjects_schedule', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Keep active selectedAllocationSubject in sync
    if (selectedAllocationSubject && selectedAllocationSubject.toUpperCase() === originalCode.toUpperCase()) {
      setSelectedAllocationSubject(cleanCode);
    }

    // Update corresponding subjects across student allocation records
    setStudentsToAllocate(prev => prev.map(st => {
      if (st.subjects && st.subjects.length > 0) {
        return {
          ...st,
          subjects: st.subjects.map(sub => {
            if (sub.code.toUpperCase() === originalCode.toUpperCase()) {
              return {
                ...sub,
                code: cleanCode,
                name: cleanName,
                date: cleanDate,
                session: cleanSession,
                time: cleanTime
              };
            }
            return sub;
          })
        };
      }
      return st;
    }));

    // If currentAllocation is active, update both its commonSubjects and students in allocations state
    if (currentAllocation?._id) {
      setAllocations(prev => prev.map(a => {
        if (a._id === currentAllocation._id) {
          const updatedSubs = (a.commonSubjects || []).map(sub => {
            if (sub.code.toUpperCase() === originalCode.toUpperCase()) {
              return {
                ...sub,
                code: cleanCode,
                name: cleanName,
                date: cleanDate,
                session: cleanSession,
                time: cleanTime
              };
            }
            return sub;
          });

          const updatedStudents = (a.students || []).map(st => {
            if (st.subjects && st.subjects.length > 0) {
              return {
                ...st,
                subjects: st.subjects.map(sub => {
                  if (sub.code.toUpperCase() === originalCode.toUpperCase()) {
                    return {
                      ...sub,
                      code: cleanCode,
                      name: cleanName,
                      date: cleanDate,
                      session: cleanSession,
                      time: cleanTime
                    };
                  }
                  return sub;
                })
              };
            }
            return st;
          });

          return {
            ...a,
            commonSubjects: updatedSubs,
            students: updatedStudents
          };
        }
        return a;
      }));
    }

    setStudentsToAllocate(prev => prev.map(st => {
      const existingSubs = st.subjects || [];
      const updatedSubs = existingSubs.map(s => {
        if ((s.code || '').toUpperCase() === originalCode.toUpperCase()) {
          return { code: cleanCode, name: cleanName, date: cleanDate, session: cleanSession, time: cleanTime };
        }
        return s;
      });
      return { ...st, subjects: updatedSubs };
    }));

    setEditingSubCode(null);
    setStatusMessage({ type: 'success', text: `Saved updates for subject ${cleanCode} (${cleanName}). Saving to database...` });

    // 3. Immediately persist to database via dedicated timetable sync API
    try {
      const res = await fetch(`${API_BASE}/hall-tickets/update-subject-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalCode,
          code: cleanCode,
          name: cleanName,
          date: cleanDate,
          session: cleanSession,
          time: cleanTime,
          department: formDept,
          semester: Number(formSemester) || 1,
          allocationId: currentAllocation?._id
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Timetable & timing for ${cleanCode} saved to database successfully!` });
      }
    } catch (apiErr) {
      console.warn('Could not sync subject edit to backend API immediately:', apiErr);
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleCancelEditSubject = () => {
    setEditingSubCode(null);
  };

  // Switch Examination Plan via selectable Department & Semester
  const handleDeptOrSemChange = (newDept, newSem) => {
    setPlanFilterDept(newDept);
    setPlanFilterSem(newSem);

    // Check if an allocation already exists for this dept & sem
    const match = allocations.find(a =>
      (a.department || '').toLowerCase().trim() === newDept.toLowerCase().trim() &&
      Number(a.semester) === Number(newSem)
    );
    if (match) {
      setSelectedAllocationId(match._id);
      setPlanTypingExamName(match.examName || '');
      if (Array.isArray(match.instructions) && match.instructions.length > 0) {
        setInstructionsList(match.instructions);
      }
    } else {
      // Sync to allocation setup form
      setFormDept(newDept);
      setFormSemester(newSem);
    }
  };

  // Quick update Examination Title and Year in database
  const handleQuickUpdateExamTitle = async () => {
    if (!currentAllocation) return;
    if (!planTypingExamName.trim()) {
      alert('Examination Title cannot be empty.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/hall-tickets/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentAllocation,
          examName: planTypingExamName.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Examination Title updated to "${planTypingExamName.trim()}" successfully!` });
        await loadAllocations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Instruction management handlers (fully editable)
  const handleStartEditInstruction = (index, currentText) => {
    setEditingInstructionIdx(index);
    setEditingInstructionText(currentText);
  };

  const handleSaveInstructionEdit = (index) => {
    if (!editingInstructionText.trim()) {
      alert('Instruction text cannot be empty.');
      return;
    }
    setInstructionsList(prev => {
      const copy = [...prev];
      copy[index] = editingInstructionText.trim();
      return copy;
    });
    setEditingInstructionIdx(null);
    setEditingInstructionText('');
  };

  const handleDeleteInstruction = (index) => {
    setInstructionsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddInstruction = () => {
    if (!newInstructionText.trim()) {
      alert('Please enter an instruction rule.');
      return;
    }
    setInstructionsList(prev => [...prev, newInstructionText.trim()]);
    setNewInstructionText('');
  };

  const handleResetInstructions = () => {
    setShowResetInstructionsModal(true);
  };

  const executeResetInstructions = () => {
    setInstructionsList(DEFAULT_INSTRUCTIONS);
    setShowResetInstructionsModal(false);
    setStatusMessage({ type: 'info', text: 'Reset instructions to default examination rules.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveInstructionsToAllocation = async () => {
    if (!currentAllocation) {
      setShowInstructionsModal(false);
      setStatusMessage({ type: 'success', text: 'Instructions updated for upcoming allocations.' });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/hall-tickets/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentAllocation,
          instructions: instructionsList
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Hall ticket instructions updated and saved to hall tickets!' });
        setShowInstructionsModal(false);
        await loadAllocations();
      }
    } catch (err) {
      console.error('Error saving instructions:', err);
    }
  };

  // Manually Add a Student to the Allocation Matrix
  const handleAddManualStudent = () => {
    if (!manualRollNo.trim() || !manualName.trim()) {
      alert('Please enter both Student Register/Roll Number and Student Name.');
      return;
    }

    if (!selectedAllocationSubject) {
      alert('Please select an Examination Subject first in Step 1 before adding students.');
      return;
    }

    const cleanRoll = manualRollNo.trim().toUpperCase();
    if (studentsToAllocate.some(s => s.rollNo.toUpperCase() === cleanRoll)) {
      alert(`Student with Roll No ${cleanRoll} is already in the allocation list!`);
      return;
    }

    const activeScheduleSub = subjectsSchedule.find(s => s.code.toUpperCase() === selectedAllocationSubject.toUpperCase());
    const assignedSub = {
      code: selectedAllocationSubject.toUpperCase(),
      name: activeScheduleSub?.name || selectedAllocationSubject,
      date: activeScheduleSub?.date || '2026-04-18',
      session: activeScheduleSub?.session || 'Forenoon (FN)',
      time: activeScheduleSub?.time || '09:30 AM - 12:30 PM'
    };

    const newStudent = {
      rollNo: cleanRoll,
      name: manualName.trim(),
      dept: formDept,
      semester: Number(formSemester),
      section: manualSection || 'A',
      hallNo: manualHall || (hallsList[0]?.hallNo || ''),
      seatNo: manualSeat || '',
      eligible: true,
      remarks: 'Eligible for Examination',
      isManual: true,
      subjects: [assignedSub]
    };

    setStudentsToAllocate(prev => [...prev, newStudent]);
    setManualRollNo('');
    setManualName('');
    setManualSeat('');
    setStatusMessage({ type: 'success', text: `Added student ${newStudent.name} (${newStudent.rollNo}) for ${selectedAllocationSubject} successfully!` });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Remove a student from the matrix
  const handleRemoveStudent = (rollNo) => {
    setStudentsToAllocate(prev => prev.filter(s => s.rollNo !== rollNo));
  };

  // Auto Allocate Seats algorithm (preserves selected subjects)
  const handleAutoAllocate = () => {
    if (hallsList.length === 0) {
      alert('Please add at least one examination hall.');
      return;
    }
    if (studentsToAllocate.length === 0) {
      alert('Please select a subject to load students before allocating seats.');
      return;
    }

    let hallIdx = 0;
    let seatCountInCurrentHall = 1;

    const allocated = studentsToAllocate.map(st => {
      const currentHall = hallsList[hallIdx];
      const shortHallCode = currentHall.hallNo.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
      const seatNumFormatted = seatCountInCurrentHall < 10 ? `0${seatCountInCurrentHall}` : `${seatCountInCurrentHall}`;
      const seatNo = `${shortHallCode}-${seatNumFormatted}`;
      const hallNo = currentHall.hallNo;

      seatCountInCurrentHall++;
      if (seatCountInCurrentHall > currentHall.capacity) {
        if (hallIdx < hallsList.length - 1) {
          hallIdx++;
          seatCountInCurrentHall = 1;
        }
      }

      // Automatically attach all scheduled examination subjects with dates & timings
      const curSubs = (st.subjects && st.subjects.length > 0) ? st.subjects : subjectsSchedule;
      const cleanSubs = curSubs.map(sub => {
        const matched = subjectsSchedule.find(s => s.code.toUpperCase() === (sub.code || '').toUpperCase());
        return {
          code: sub.code.toUpperCase(),
          name: sub.name || matched?.name || sub.code,
          date: (sub.date && sub.date !== 'TBA') ? sub.date : (matched?.date || (sub.code === 'CS2001' ? '2026-04-15' : '2026-04-18')),
          session: sub.session || matched?.session || 'Forenoon (FN)',
          time: (sub.time !== undefined && sub.time !== null && sub.time !== '') ? sub.time : (matched?.time !== undefined && matched?.time !== null ? matched.time : (sub.time || ''))
        };
      }).filter(s => !['CS2003', 'CS2006', 'SF76'].includes(s.code));

      return {
        ...st,
        hallNo,
        seatNo,
        subjects: cleanSubs
      };
    });

    setStudentsToAllocate(allocated);
    setStatusMessage({ type: 'success', text: `Auto-allocated ${allocated.length} student(s) across halls with full exam schedules!` });
    setTimeout(() => setStatusMessage(null), 4000);

    // Auto-persist to MongoDB
    try {
      const payload = {
        examName: (formExamName || currentAllocation?.examName || 'Semester End Examination 2026').trim(),
        examType: formExamType || 'Semester End Examination',
        academicYear: (formAcademicYear || '2025-2026').trim(),
        department: formDept || currentAllocation?.department || 'Computer Science',
        semester: Number(formSemester || currentAllocation?.semester || 1),
        section: formSection || 'All',
        halls: hallsList,
        allocatedByStaffId: staffUser?.staffId || 'STAFF',
        allocatedByStaffName: staffUser?.name || 'Faculty In-Charge',
        commonSubjects: subjectsSchedule,
        students: allocated.map((st, i) => ({
          rollNo: st.rollNo,
          name: st.name,
          dept: st.dept || formDept,
          semester: Number(st.semester || formSemester || 1),
          section: st.section || 'A',
          hallNo: st.hallNo,
          seatNo: st.seatNo || `SEAT-${i + 1}`,
          eligible: true,
          remarks: 'Eligible for Examination',
          subjects: st.subjects && st.subjects.length > 0 ? st.subjects : subjectsSchedule
        }))
      };

      fetch(`${API_BASE}/hall-tickets/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(() => fetchAllocations()).catch(() => {});
    } catch (_) {}
  };

  // Toggle a specific subject for an individual student
  const toggleStudentSubject = (rollNo, subObj) => {
    const latest = subjectsSchedule.find(s => s.code.toUpperCase() === subObj.code.toUpperCase()) || subObj;
    setStudentsToAllocate(prev => prev.map(st => {
      if (st.rollNo.toUpperCase() === rollNo.toUpperCase()) {
        const curSubs = st.subjects || [];
        const exists = curSubs.some(s => s.code.toUpperCase() === latest.code.toUpperCase());
        let updatedSubs;
        if (exists) {
          updatedSubs = curSubs.filter(s => s.code.toUpperCase() !== latest.code.toUpperCase());
        } else {
          updatedSubs = [...curSubs, {
            code: latest.code.toUpperCase(),
            name: latest.name,
            date: (latest.date && latest.date !== 'TBA') ? latest.date : (latest.code === 'CS2001' ? '2026-04-15' : '2026-04-18'),
            session: latest.session || 'Forenoon (FN)',
            time: latest.time || '09:30 AM - 12:30 PM'
          }];
        }
        return { ...st, subjects: updatedSubs };
      }
      return st;
    }));
  };

  // Assign a specific subject to all currently displayed students
  const handleAssignSubjectToAllDisplayed = (subCode) => {
    if (!subCode || subCode === 'All') return;
    const targetSub = subjectsSchedule.find(s => s.code.toUpperCase() === subCode.toUpperCase());
    if (!targetSub) return;

    setStudentsToAllocate(prev => prev.map(st => {
      const curSubs = st.subjects || [];
      const exists = curSubs.some(s => s.code.toUpperCase() === targetSub.code.toUpperCase());
      if (exists) return st;
      return {
        ...st,
        subjects: [...curSubs, {
          code: targetSub.code.toUpperCase(),
          name: targetSub.name,
          date: targetSub.date || (targetSub.code === 'CS2001' ? '2026-04-15' : '2026-04-18'),
          session: targetSub.session || 'Forenoon (FN)',
          time: targetSub.time || '09:30 AM - 12:30 PM'
        }]
      };
    }));
    setStatusMessage({ type: 'success', text: `Selected subject ${targetSub.code} for all displayed candidates!` });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Update single student field inline by matching roll number
  const handleStudentFieldChange = (rollNo, field, value) => {
    let updatedStudentList = [];
    setStudentsToAllocate(prev => {
      updatedStudentList = prev.map((st, i) => {
        if (st.rollNo.toUpperCase() === rollNo.toUpperCase()) {
          const updated = { ...st, [field]: value };
          // If allocating hall and seat is empty, auto-assign seat number
          if (field === 'hallNo' && value && value !== 'TBA' && value !== 'Unassigned') {
            if (!updated.seatNo || updated.seatNo === '—') {
              updated.seatNo = `SEAT-${i + 1 < 10 ? '0' + (i + 1) : i + 1}`;
            }
          }
          // If allocating hall or seat and student has no subjects yet, automatically attach all scheduled subjects!
          if ((field === 'hallNo' || field === 'seatNo') && value && value !== 'TBA') {
            if (!updated.subjects || updated.subjects.length === 0) {
              updated.subjects = subjectsSchedule.map(s => ({
                code: s.code.toUpperCase(),
                name: s.name,
                date: (s.date && s.date !== 'TBA') ? s.date : '',
                session: s.session || 'Forenoon (FN)',
                time: s.time || '09:30 AM - 12:30 PM'
              })).filter(s => !['CS2003', 'CS2006', 'SF76'].includes(s.code));
            } else {
              updated.subjects = updated.subjects.map(sub => {
                const matched = subjectsSchedule.find(s => s.code.toUpperCase() === (sub.code || '').toUpperCase());
                return {
                  code: sub.code.toUpperCase(),
                  name: sub.name || matched?.name || sub.code,
                  date: (matched?.date && matched.date !== 'TBA') ? matched.date : (sub.date && sub.date !== 'TBA' ? sub.date : ''),
                  session: matched?.session || sub.session || 'Forenoon (FN)',
                  time: matched?.time || sub.time || '09:30 AM - 12:30 PM'
                };
              }).filter(s => !['CS2003', 'CS2006', 'SF76'].includes(s.code));
            }
          }
          return updated;
        }
        return st;
      });
      return updatedStudentList;
    });

    // Auto-persist immediately to MongoDB when hall or seat changes
    if (field === 'hallNo' || field === 'seatNo') {
      try {
        const payload = {
          examName: (formExamName || currentAllocation?.examName || 'Semester End Examination 2026').trim(),
          examType: formExamType || 'Semester End Examination',
          academicYear: (formAcademicYear || '2025-2026').trim(),
          department: formDept || currentAllocation?.department || 'Computer Science',
          semester: Number(formSemester || currentAllocation?.semester || 1),
          section: formSection || 'All',
          halls: hallsList.length > 0 ? hallsList : [{ hallNo: value, capacity: 30 }],
          allocatedByStaffId: staffUser?.staffId || 'STAFF',
          allocatedByStaffName: staffUser?.name || 'Faculty In-Charge',
          commonSubjects: subjectsSchedule,
          students: updatedStudentList.map((st, i) => ({
            rollNo: st.rollNo,
            name: st.name,
            dept: st.dept || formDept,
            semester: Number(st.semester || formSemester || 1),
            section: st.section || 'A',
            hallNo: st.hallNo || (st.rollNo.toUpperCase() === rollNo.toUpperCase() && field === 'hallNo' ? value : ''),
            seatNo: st.seatNo || (st.rollNo.toUpperCase() === rollNo.toUpperCase() && field === 'seatNo' ? value : `SEAT-${i + 1 < 10 ? '0' + (i + 1) : i + 1}`),
            eligible: true,
            remarks: 'Eligible for Examination',
            subjects: st.subjects && st.subjects.length > 0 ? st.subjects : subjectsSchedule
          }))
        };

        fetch(`${API_BASE}/hall-tickets/allocate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});
      } catch (_) {}
    }
  };

  // Save the complete Allocation to backend
  const handleSaveAllocation = async () => {
    if (!formExamName.trim()) {
      alert('Please enter an Examination Title.');
      return;
    }

    if (studentsToAllocate.length === 0) {
      alert('Please add at least one student to the allocation matrix before saving. You can use the "Add Student Manually" form below or select a department/semester with registered classes.');
      return;
    }

    // Auto-fill hall, seat and guarantee valid date for all subjects
    const cleanCommonSubjects = subjectsSchedule
      .filter(s => !['CS2003', 'CS2006', 'SF76'].includes((s.code || '').toUpperCase()))
      .map(s => ({
        ...s,
        date: (s.date && s.date.trim() && s.date !== 'TBA') ? s.date.trim() : (s.date || ''),
        session: s.session || 'Forenoon (FN)',
        time: (s.time !== undefined && s.time !== null) ? s.time : (s.session?.includes('AN') ? '01:30 PM - 04:30 PM' : '09:30 AM - 12:30 PM')
      }));

    const preparedStudents = studentsToAllocate.map((st, i) => {
      const fallbackHall = st.hallNo || hallsList[0]?.hallNo || 'TBA';
      const fallbackSeat = st.seatNo || `SEAT-${i + 1 < 10 ? '0' + (i + 1) : i + 1}`;

      // If student has no subjects, automatically inherit cleanCommonSubjects
      const rawSubs = (st.subjects && st.subjects.length > 0)
        ? st.subjects
        : cleanCommonSubjects;

      const cleanSubs = rawSubs.map(sub => {
        const matched = cleanCommonSubjects.find(s => s.code.toUpperCase() === sub.code.toUpperCase());
        const finalDate = (sub.date && sub.date.trim() && sub.date !== 'TBA')
          ? sub.date.trim()
          : (matched?.date && matched.date.trim() && matched.date !== 'TBA' ? matched.date.trim() : (sub.date || ''));
        return {
          code: sub.code.toUpperCase(),
          name: sub.name || matched?.name || sub.code,
          date: finalDate,
          session: sub.session || matched?.session || 'Forenoon (FN)',
          time: (sub.time !== undefined && sub.time !== null && sub.time !== '') ? sub.time : (matched?.time !== undefined && matched?.time !== null ? matched.time : (sub.time || ''))
        };
      }).filter(s => !['CS2003', 'CS2006', 'SF76'].includes(s.code));

      return {
        ...st,
        hallNo: fallbackHall,
        seatNo: fallbackSeat,
        subjects: cleanSubs
      };
    });

    const unselectedStudent = preparedStudents.find(s => !s.subjects || s.subjects.length === 0);
    if (unselectedStudent) {
      alert(`Candidate ${unselectedStudent.name} (${unselectedStudent.rollNo}) has no examination subjects selected. Please select which subject(s) this student will write before saving.`);
      return;
    }

    setSavingAllocation(true);
    try {
      const payload = {
        examName: formExamName.trim(),
        examType: formExamType,
        academicYear: formAcademicYear.trim(),
        department: formDept,
        semester: Number(formSemester),
        section: formSection,
        halls: hallsList,
        allocatedByStaffId: staffUser?.staffId || 'STF-01',
        allocatedByStaffName: staffUser?.name || 'Staff In-Charge',
        commonSubjects: cleanCommonSubjects,
        students: preparedStudents,
        instructions: instructionsList && instructionsList.length > 0 ? instructionsList : DEFAULT_INSTRUCTIONS
      };

      const res = await fetch(`${API_BASE}/hall-tickets/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Hall allocation saved successfully! Hall tickets are now available.' });
        await loadAllocations();
        if (data.data?._id) setSelectedAllocationId(data.data._id);
        setActiveTab('tickets');
      } else {
        alert(data.message || 'Failed to save hall allocation.');
      }
    } catch (err) {
      console.error('Error saving allocation:', err);
      alert('Failed to save allocation: ' + err.message);
    } finally {
      setSavingAllocation(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Delete Allocation
  const handleDeleteAllocation = (id) => {
    setAllocationToDelete(id);
  };

  const executeDeleteAllocation = async () => {
    if (!allocationToDelete) return;
    setIsDeletingAllocation(true);
    try {
      const res = await fetch(`${API_BASE}/hall-tickets/${allocationToDelete}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Hall allocation deleted successfully.' });
        setAllocationToDelete(null);
        await loadAllocations();
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Failed to delete allocation.' });
      }
    } catch (err) {
      console.error('Failed to delete allocation:', err);
      setStatusMessage({ type: 'error', text: 'Failed to delete allocation.' });
    } finally {
      setIsDeletingAllocation(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Cleanup all duplicate exams and students
  const handleCleanupDuplicates = async () => {
    try {
      const res = await fetch(`${API_BASE}/hall-tickets/cleanup-duplicates`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message || 'Duplicate data cleaned successfully!' });
        await loadAllocations();
      } else {
        alert(data.message || 'Failed to cleanup duplicates');
      }
    } catch (err) {
      console.error('Error during cleanup:', err);
      alert('Error cleaning duplicates: ' + err.message);
    }
  };



  // Print Window Helper: Generates beautiful multi-page or single hall ticket printable HTML
  const printHallTickets = (studentsList, examData) => {
    if (!studentsList || studentsList.length === 0) {
      alert('No students selected for hall ticket generation.');
      return;
    }

    const printWin = window.open('', '_blank', 'width=950,height=950');
    if (!printWin) {
      alert('Please allow popups in your browser to print / download hall tickets.');
      return;
    }

    const examTitle = examData?.examName || 'MODEL SEMESTER EXAMINATION - NOVEMBER 2026';

    const toRoman = (num) => {
      const map = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII' };
      return map[Number(num)] || (num ? String(num).toUpperCase() : 'I');
    };
    const getYearRoman = (sem) => {
      const s = Number(sem) || 1;
      return toRoman(Math.ceil(s / 2));
    };
    const formatDateShort = (dateStr) => {
      if (!dateStr || dateStr === 'TBA') return '';
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const yr = String(d.getFullYear()).slice(-2);
          return `${day}.${month}.${yr}`;
        }
      } catch (e) {}
      return dateStr;
    };
    const formatSessionShort = (session) => {
      if (!session) return 'FN';
      const upper = String(session).toUpperCase();
      if (upper.includes('AN') || upper.includes('AFTERNOON')) return 'AN';
      return 'FN';
    };

    const ticketsHtml = studentsList.map((st, index) => {
      const subjects = (st.subjects && st.subjects.length > 0) ? st.subjects : (examData?.commonSubjects || subjectsSchedule);
      const studentDept = st.dept || examData?.department || 'CFS';
      const semNum = st.semester || examData?.semester || 1;
      const yearRoman = getYearRoman(semNum);
      const semRoman = toRoman(semNum);

      const rows = subjects.map((sub, sIdx) => `
        <tr>
          <td style="text-align: center; font-weight: 700; border: 1px solid #000; padding: 6px 4px;">${sIdx + 1}</td>
          <td style="text-align: center; font-weight: 700; border: 1px solid #000; padding: 6px 4px;">${formatDateShort(sub.date) || '21.10.26'}</td>
          <td style="text-align: center; font-weight: 700; border: 1px solid #000; padding: 6px 4px;">${formatSessionShort(sub.session)}</td>
          <td style="text-align: left; font-weight: 700; border: 1px solid #000; padding: 6px 8px; text-transform: uppercase;">${sub.name}</td>
          <td style="text-align: center; font-weight: 700; border: 1px solid #000; padding: 6px 4px;">${sub.code || ''}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 6px 4px; height: 32px;"></td>
        </tr>
      `).join('');

      return `
        <div class="hall-ticket-container ${index < studentsList.length - 1 ? 'page-break' : ''}">
          <div class="hall-ticket-border">
            <!-- Header Section -->
            <div class="header-wrap">
              <div class="logo-wrap">
                <img src="/vcas-logo.png" class="college-logo" alt="Crest Logo" />
              </div>
              <div class="title-wrap">
                <div class="college-name">VIVEKANANDA COLLEGE OF ARTS AND SCIENCE</div>
                <div class="college-loc">Vellalankulam, Tenkasi Dist</div>
                <div class="college-contact">PHONE: 04636298128, 7094462393, 7094462394 &nbsp;&nbsp; EMAIL: vivekanandacas@gmail.com</div>
                <div class="exam-title">${examTitle.toUpperCase()}</div>
                <div class="ticket-badge">HALL TICKET</div>
              </div>
            </div>

            <!-- Dept / Year / Semester Meta Row -->
            <div class="meta-row">
              <div><strong>DEPARTMENT:</strong> ${studentDept.toUpperCase()}</div>
              <div><strong>YEAR:</strong> ${yearRoman}</div>
              <div><strong>SEMESTER:</strong> ${semRoman}</div>
            </div>

            <!-- Student Particulars Table -->
            <table class="student-table">
              <tr>
                <td class="st-lbl">Student Name:</td>
                <td class="st-val">${(st.name || '').toUpperCase()}</td>
              </tr>
              <tr>
                <td class="st-lbl">Register No :</td>
                <td class="st-val font-bold">${st.rollNo || st.regNo || ''}</td>
              </tr>
            </table>

            <!-- Time Table Title -->
            <div class="tt-heading">TIME TABLE</div>

            <!-- Time Table Schedule -->
            <table class="schedule-table">
              <thead>
                <tr>
                  <th style="width: 5%;">NO</th>
                  <th style="width: 17%;">DATE</th>
                  <th style="width: 10%;">FN<br/>AN</th>
                  <th style="width: 44%;">SUBJECT</th>
                  <th style="width: 14%;">Sub. Code</th>
                  <th style="width: 10%;">Sign</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <!-- Signatures Row -->
            <div class="signatures-row">
              <div class="sig-col">Office</div>
              <div class="sig-col">HOD</div>
              <div class="sig-col">Principal</div>
              <div class="sig-col">MD</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Hall Tickets - ${examTitle}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: "Times New Roman", Times, Georgia, serif; }
          body { background: #f8fafc; padding: 20px; color: #000; }
          .hall-ticket-container {
            width: 195mm;
            margin: 0 auto 30px auto;
            background: #ffffff;
            padding: 8px;
          }
          .hall-ticket-border {
            border: 1.5px solid #000000;
            padding: 12px 16px 24px 16px;
          }
          @media print {
            body { background: white; padding: 0; margin: 0; }
            .no-print { display: none !important; }
            .hall-ticket-container {
              width: 100%;
              max-width: 190mm;
              margin: 0 auto;
              padding: 6mm 4mm;
              box-shadow: none;
            }
            .page-break {
              page-break-after: always;
              break-after: page;
            }
          }

          .header-wrap {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            position: relative;
          }
          .logo-wrap {
            width: 65px;
            text-align: left;
            flex-shrink: 0;
          }
          .college-logo {
            width: 58px;
            height: 58px;
            object-fit: contain;
          }
          .title-wrap {
            flex: 1;
            text-align: center;
            padding-right: 65px; /* balance logo on left */
          }
          .college-name {
            font-size: 16px;
            font-weight: 900;
            color: #000;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            line-height: 1.2;
          }
          .college-loc {
            font-size: 11.5px;
            font-weight: 600;
            color: #111;
            margin-top: 1px;
          }
          .college-contact {
            font-size: 9px;
            font-weight: 700;
            color: #222;
            margin-top: 2px;
          }
          .exam-title {
            font-size: 12px;
            font-weight: 900;
            color: #000;
            text-transform: uppercase;
            margin-top: 6px;
            letter-spacing: 0.3px;
          }
          .ticket-badge {
            font-size: 13px;
            font-weight: 900;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-top: 3px;
            text-decoration: underline;
          }

          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #000;
            margin: 10px 0 6px 0;
            padding: 0 4px;
          }

          .student-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            margin-bottom: 8px;
          }
          .student-table td {
            padding: 5px 8px;
            font-size: 11.5px;
            border: 1px solid #000;
          }
          .st-lbl {
            width: 22%;
            font-weight: 700;
            color: #000;
            white-space: nowrap;
          }
          .st-val {
            width: 78%;
            font-weight: 700;
            color: #000;
          }

          .tt-heading {
            text-align: center;
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-decoration: underline;
            margin: 6px 0 4px 0;
          }

          .schedule-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            margin-bottom: 30px;
          }
          .schedule-table th {
            border: 1px solid #000;
            padding: 4px 4px;
            font-size: 10.5px;
            font-weight: 900;
            text-align: center;
            color: #000;
            background: #fafafa;
          }
          .schedule-table td {
            border: 1px solid #000;
            padding: 6px 6px;
            font-size: 10.5px;
            color: #000;
            height: 28px;
          }

          .signatures-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 0 16px;
            margin-top: 45px;
          }
          .sig-col {
            text-align: center;
            font-size: 11.5px;
            font-weight: 800;
            color: #000;
            min-width: 70px;
          }

          .print-bar {
            position: fixed;
            top: 12px;
            right: 12px;
            background: #0f1e3c;
            padding: 8px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            z-index: 9999;
            display: flex;
            gap: 10px;
          }
          .print-btn {
            background: #2563eb;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
          }
          .print-btn:hover { background: #1d4ed8; }
        </style>
      </head>
      <body>
        <div class="print-bar no-print">
          <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF (${studentsList.length} Hall Tickets)</button>
        </div>
        ${ticketsHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          }
        </script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(fullHtml);
    printWin.document.close();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50">
      {/* Top Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 leading-tight">Hall Allocation &amp; Hall Tickets Setup</h1>
              <p className="text-xs text-slate-500 font-medium">Allocate exam halls, configure timetable, and generate official student hall tickets all within one unified setup</p>
            </div>
          </div>

          {/* Action Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('allocate')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'allocate'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <Building2 className="w-4 h-4" />
              1. Hall Allocation Setup
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'tickets'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <Ticket className="w-4 h-4" />
              2. Hall Tickets &amp; Print
            </button>
            <button
              onClick={() => setActiveTab('arrear')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'arrear'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <Award className="w-4 h-4" />
              3. Arrear Students
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none p-4 animate-in fade-in zoom-in-95">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold border pointer-events-auto ${statusMessage.type === 'error'
                ? 'bg-rose-950/95 border-rose-700 text-rose-100 shadow-rose-900/40'
                : 'bg-slate-900/95 border-slate-700 text-white shadow-slate-900/40'
              }`}>
              {statusMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="ml-3 text-slate-400 hover:text-white text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">

        {/* ------------------- TAB 1: HALL TICKETS & DOWNLOAD ------------------- */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            {/* Header summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active Exams</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{allocations.length}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Configured exam sessions</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Allocated Students</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {allocatedStudentsCount}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{currentAllocation?.students?.length || 0} enrolled candidates</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Halls In-Use</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {currentAllocationHalls.length}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Active halls assigned</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Courses</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {currentAllocation?.commonSubjects?.length || 0}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Subjects per student</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Selection and Filter Toolbar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Select Examination Plan: Selectable Department, Selectable Semester (1-8), and Typing Mode Exam with Year */}
                <div className="flex-1 w-full space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Ticket className="w-4 h-4 text-blue-600" />
                      Select Examination Plan:
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowInstructionsModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit Candidate Instructions ({instructionsList.length})
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    {/* Department Dropdown (Selectable) */}
                    <div className="lg:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Department
                      </label>
                      <select
                        value={planFilterDept}
                        onChange={(e) => handleDeptOrSemChange(e.target.value, planFilterSem)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {availableDepts.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    {/* Semester Dropdown (Selectable: Sem 1 to 6) */}
                    <div className="lg:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Semester
                      </label>
                      <select
                        value={planFilterSem}
                        onChange={(e) => handleDeptOrSemChange(planFilterDept, Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {availableSemesters.filter(s => Number(s) <= 6).map(s => (
                          <option key={s} value={s}>Sem {s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Examination with Year (Typing Mode) */}
                    <div className="lg:col-span-6">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Examination Title & Year (Typing Mode)
                        </label>
                        {currentAllocation && planTypingExamName !== currentAllocation.examName && (
                          <button
                            type="button"
                            onClick={handleQuickUpdateExamTitle}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" /> Save Title
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={planTypingExamName}
                          onChange={(e) => {
                            setPlanTypingExamName(e.target.value);
                            setFormExamName(e.target.value);
                          }}
                          placeholder="e.g. Semester End Theory Examinations - 2026"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                        />
                        <Pencil className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bulk Print and Delete buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => printHallTickets(filteredStudents, currentAllocation)}
                    disabled={!currentAllocation || filteredStudents.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Download / Print All Hall Tickets ({filteredStudents.length})</span>
                  </button>
                  {currentAllocation && (
                    <button
                      onClick={() => handleDeleteAllocation(currentAllocation._id)}
                      className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 border border-rose-200 transition-all"
                      title="Delete this exam allocation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-filters: Search, Room filter */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student name, roll number, or seat..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Hall:</span>
                  <select
                    value={hallFilter}
                    onChange={(e) => setHallFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All Halls</option>
                    {currentAllocationHalls.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div className="text-xs font-bold text-slate-500 ml-auto">
                  Showing <span className="text-blue-600">{filteredStudents.length}</span> candidates
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Roll No</th>
                      <th className="px-5 py-3.5">Student Name</th>
                      <th className="px-5 py-3.5">Branch / Sem</th>
                      <th className="px-5 py-3.5">Allotted Hall / Room</th>
                      <th className="px-5 py-3.5">Seat No</th>
                      <th className="px-5 py-3.5">Subjects to Write</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((st) => (
                        <tr key={st.rollNo} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-blue-600">{st.rollNo}</td>
                          <td className="px-5 py-3.5 font-semibold text-slate-900">{st.name}</td>
                          <td className="px-5 py-3.5 text-slate-500">
                            {st.dept || currentAllocation?.department} · Sem {st.semester || currentAllocation?.semester}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-800">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                              <Building2 className="w-3 h-3" />
                              {st.hallNo || 'Unassigned'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono">
                              {st.seatNo || '-'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-slate-600 font-medium">
                              {(st.subjects?.length || currentAllocation?.commonSubjects?.length || 0)} Subjects
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Eligible
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setPreviewStudent(st);
                                  setPreviewExam(currentAllocation);
                                }}
                                className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 font-semibold text-xs transition-colors flex items-center gap-1"
                                title="Preview Hall Ticket"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Preview
                              </button>
                              <button
                                onClick={() => printHallTickets([st], currentAllocation)}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                                title="Download / Print this Student's Hall Ticket"
                              >
                                <Printer className="w-3 h-3" />
                                Print
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                          <Ticket className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-sm text-slate-600">No Hall Tickets recorded</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                            Switch to the "Hall Allocation Setup" tab to configure your halls, add students or select enrolled classes, and click "Save & Publish".
                          </p>
                          <button
                            onClick={() => setActiveTab('allocate')}
                            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all inline-flex items-center gap-1.5"
                          >
                            <Building2 className="w-4 h-4" />
                            Go to Hall Allocation Setup
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------- TAB 2: HALL ALLOCATION SETUP ------------------- */}
        {activeTab === 'allocate' && (
          <div className="space-y-6">
            {/* Step 1: Examination Profile Details */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">1</div>
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Examination & Class Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Examination Title / Session Name *</label>
                  <input
                    type="text"
                    value={formExamName}
                    onChange={(e) => setFormExamName(e.target.value)}
                    placeholder="e.g. End Semester Theory Examinations - 2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Exam Type</label>
                  <select
                    value={formExamType}
                    onChange={(e) => setFormExamType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="internal1">Internal 1</option>
                    <option value="internal 2">Internal 2</option>
                    <option value="model">Model</option>
                    <option value="semester">Semester</option>
                    <option value="seminar">Seminar</option>
                    <option value="project">Project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={formAcademicYear}
                    onChange={(e) => setFormAcademicYear(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Department</label>
                  <select
                    value={formDept}
                    onChange={(e) => {
                      const newD = e.target.value;
                      setFormDept(newD);
                      setSelectedAllocationSubject('');
                      setStudentsToAllocate([]);
                      loadAvailableSubjects(newD, formSemester, formSection);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableDepts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Semester</label>
                    <select
                      value={formSemester}
                      onChange={(e) => {
                        const sem = Number(e.target.value);
                        setFormSemester(sem);
                        setFormSemesterParity(sem % 2 === 0 ? 'Even' : 'Odd');
                        setSelectedAllocationSubject('');
                        setStudentsToAllocate([]);
                        loadAvailableSubjects(formDept, sem, formSection);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {availableSemesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Odd / Even Semester</label>
                    <div className="flex gap-1.5">
                      {['Odd', 'Even'].map(parity => (
                        <button
                          key={parity}
                          type="button"
                          onClick={() => setFormSemesterParity(parity)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            formSemesterParity === parity
                              ? parity === 'Odd' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {parity === 'Odd' ? '☀️ Odd' : '🌙 Even'}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Sem {formSemester} is automatically {formSemester % 2 === 0 ? 'Even' : 'Odd'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Section</label>
                  <select
                    value={formSection}
                    onChange={(e) => {
                      const sec = e.target.value;
                      setFormSection(sec);
                      setSelectedAllocationSubject('');
                      setStudentsToAllocate([]);
                      loadAvailableSubjects(formDept, formSemester, sec);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableSections.map(sc => <option key={sc} value={sc}>{sc === 'All' ? 'All Sections' : `Section ${sc}`}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Exam Halls & Capacity Configuration */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">2</div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Exam Halls / Rooms Allocation Setup</h3>
                    <p className="text-xs text-slate-500">Configure examination halls available for this session</p>
                  </div>
                </div>
              </div>

              {/* Add Hall Input */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={newHallName}
                  onChange={(e) => setNewHallName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddHall();
                    }
                  }}
                  placeholder="e.g. Exam Hall 103 (Block A) or Room 204"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Capacity:</span>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={newHallCap}
                    onChange={(e) => setNewHallCap(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddHall();
                      }
                    }}
                    className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 text-center"
                  />
                  <button
                    type="button"
                    onClick={handleAddHall}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center gap-1 shrink-0 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Hall
                  </button>
                </div>
              </div>

              {/* Current Halls Chips */}
              {hallsList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {hallsList.map((hall, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          {hall.hallNo}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Capacity: {hall.capacity} candidates</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAssignHallToAll(hall.hallNo)}
                          className="px-2 py-1 rounded text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all"
                          title="Assign this hall to all students"
                        >
                          Assign to All
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveHall(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove hall"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-xs text-slate-400">
                  <Building2 className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                  <p className="font-medium text-slate-500">No examination halls added yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Use the input above to add the halls/rooms needed for this exam session.</p>
                </div>
              )}
            </div>

            {/* Hall Seating Grid (6 Rows × 3 Cols, manual entry) */}
            <div className="bg-white p-6 rounded-2xl border border-violet-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-violet-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs">⊞</div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Hall Seating Layout Grid</h3>
                    <p className="text-xs text-slate-500">Manual seat entry — {hallGridRows} Rows × {hallGridCols} Cols. Enter roll nos in each seat cell.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-slate-500">Rows:</label>
                  <input type="number" min={1} max={20} value={hallGridRows} onChange={e => { const r=Math.max(1,Math.min(20,Number(e.target.value))); setHallGridRows(r); setHallGrid(Array.from({length:r},(_,ri)=>Array.from({length:hallGridCols},(__,ci)=>(hallGrid[ri]&&hallGrid[ri][ci])||''))); }} className="w-12 border border-slate-200 rounded-lg px-1 py-1 text-xs text-center font-bold focus:outline-none" />
                  <label className="text-[11px] font-bold text-slate-500">Cols:</label>
                  <input type="number" min={1} max={10} value={hallGridCols} onChange={e => { const c=Math.max(1,Math.min(10,Number(e.target.value))); setHallGridCols(c); setHallGrid(Array.from({length:hallGridRows},(_,ri)=>Array.from({length:c},(__,ci)=>(hallGrid[ri]&&hallGrid[ri][ci])||''))); }} className="w-12 border border-slate-200 rounded-lg px-1 py-1 text-xs text-center font-bold focus:outline-none" />
                  <button type="button" onClick={()=>setHallGrid(Array.from({length:hallGridRows},()=>Array(hallGridCols).fill('')))} className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200 hover:bg-rose-100">Clear</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="border-collapse border border-slate-300 rounded-xl overflow-hidden text-xs">
                  <thead>
                    <tr>
                      <th className="bg-slate-100 text-slate-500 font-black px-2 py-1.5 border border-slate-300 text-[10px]">Row</th>
                      {Array.from({length:hallGridCols},(_,ci)=>(
                        <th key={ci} className="bg-blue-50 text-blue-700 font-black px-2 py-1.5 border border-slate-300 min-w-[100px] text-[10px]">Col {ci+1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({length:hallGridRows},(_,ri)=>(
                      <tr key={ri} className={ri%2===0?'bg-white':'bg-slate-50/60'}>
                        <td className="text-center text-[10px] font-black text-slate-500 border border-slate-200 px-2 py-1">R{ri+1}</td>
                        {Array.from({length:hallGridCols},(__,ci)=>(
                          <td key={ci} className="border border-slate-200 p-0.5">
                            <input
                              type="text"
                              value={hallGrid[ri]?.[ci]||''}
                              onChange={e=>{const val=e.target.value.toUpperCase();setHallGrid(prev=>{const next=prev.map(r=>[...r]);if(!next[ri])next[ri]=Array(hallGridCols).fill('');next[ri][ci]=val;return next;});}}
                              placeholder={`R${ri+1}C${ci+1}`}
                              className="w-full text-[10px] font-mono font-bold text-slate-800 text-center bg-transparent px-1 py-1.5 focus:outline-none focus:bg-blue-50 rounded transition-colors placeholder-slate-300"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[10px] text-slate-400 mt-2">Enter roll numbers in each cell. Default: 6×3 layout. Adjust Rows/Cols as needed.</p>
              </div>
            </div>

            {/* Step 3: Subjects & Timetable Schedule to Appear */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">3</div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Course Subjects to be Written</h3>
                    <p className="text-xs text-slate-500">These subject codes and exam dates will be printed on each student's hall ticket</p>
                  </div>
                </div>
              </div>

              {/* Add Subject Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className={newSubCode === 'CUSTOM' ? '' : 'md:col-span-2'}>
                  <select
                    value={newSubCode}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewSubCode(val);
                      if (val && val !== 'CUSTOM') {
                        const match = catalogSubjects.find(s => (s.code || '').toUpperCase() === val.toUpperCase());
                        if (match) {
                          setNewSubName(match.name || '');
                          if (match.date && match.date !== 'TBA') setNewSubDate(match.date);
                          if (match.session) setNewSubSession(match.session);
                          if (match.time) setNewSubTime(match.time);
                        }
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Subject from Catalog --</option>
                    {catalogSubjects.map(cs => (
                      <option key={cs.code} value={cs.code}>
                        {cs.code} - {cs.name}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Type Custom Code</option>
                  </select>
                </div>

                {newSubCode === 'CUSTOM' && (
                  <div>
                    <input
                      type="text"
                      value={customSubCode}
                      onChange={(e) => setCustomSubCode(e.target.value)}
                      placeholder="Code (e.g. CS2001)"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className={newSubCode === 'CUSTOM' ? '' : 'md:col-span-1'}>
                  <input
                    type="text"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="Subject Name"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <input
                    type="date"
                    value={newSubDate}
                    onChange={(e) => setNewSubDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <select
                    value={newSubSession?.includes('AN') || newSubSession?.toLowerCase().includes('afternoon') ? 'Afternoon (AN)' : 'Forenoon (FN)'}
                    onChange={(e) => {
                      const sess = e.target.value;
                      setNewSubSession(sess);
                      setNewSubTime(sess.includes('AN') ? '01:30 PM - 04:30 PM' : '09:30 AM - 12:30 PM');
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Forenoon (FN)">Forenoon (FN)</option>
                    <option value="Afternoon (AN)">Afternoon (AN)</option>
                  </select>
                </div>

                <div>
                  <input
                    type="text"
                    value={newSubTime}
                    onChange={(e) => setNewSubTime(e.target.value)}
                    placeholder="Time (09:30 AM - 12:30 PM)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <button
                    onClick={handleAddSubject}
                    className="w-full h-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Subject
                  </button>
                </div>
              </div>

              {/* Subjects Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-2.5">Subject Code</th>
                      <th className="px-4 py-2.5">Subject Title</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Session</th>
                      <th className="px-4 py-2.5">Time</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjectsSchedule.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-6 text-center text-slate-400 font-medium">
                          No subjects scheduled yet. Add a course subject above to print it on hall tickets.
                        </td>
                      </tr>
                    ) : subjectsSchedule.map((sub) => {
                      const isEditing = editingSubCode === sub.code;
                      return (
                        <tr key={sub.code} className="hover:bg-slate-50 transition-colors">
                          {isEditing ? (
                            <>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={editSubForm.code}
                                  onChange={(e) => setEditSubForm(prev => ({ ...prev, code: e.target.value }))}
                                  className="w-full bg-white border border-blue-300 rounded px-2 py-1 text-xs font-bold text-blue-700 uppercase focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={editSubForm.name}
                                  onChange={(e) => setEditSubForm(prev => ({ ...prev, name: e.target.value }))}
                                  className="w-full bg-white border border-blue-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="date"
                                  value={editSubForm.date}
                                  onChange={(e) => setEditSubForm(prev => ({ ...prev, date: e.target.value }))}
                                  className="w-full bg-white border border-blue-300 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={editSubForm.session?.includes('AN') || editSubForm.session?.toLowerCase().includes('afternoon') ? 'Afternoon (AN)' : 'Forenoon (FN)'}
                                  onChange={(e) => {
                                    const newSess = e.target.value;
                                    setEditSubForm(prev => ({
                                      ...prev,
                                      session: newSess,
                                      time: (!prev.time || prev.time === '09:30 AM - 12:30 PM' || prev.time === '01:30 PM - 04:30 PM')
                                        ? (newSess.includes('AN') ? '01:30 PM - 04:30 PM' : '09:30 AM - 12:30 PM')
                                        : prev.time
                                    }));
                                  }}
                                  className="w-full bg-white border border-blue-300 rounded px-1.5 py-1 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                >
                                  <option value="Forenoon (FN)">Forenoon (FN)</option>
                                  <option value="Afternoon (AN)">Afternoon (AN)</option>
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={editSubForm.time}
                                    onChange={(e) => setEditSubForm(prev => ({ ...prev, time: e.target.value }))}
                                    placeholder="Time (e.g. 10:00 AM - 01:00 PM)"
                                    className="w-full bg-white border border-blue-300 rounded px-2 py-1 text-xs font-medium text-slate-700 focus:ring-1 focus:ring-blue-500"
                                  />
                                  {editSubForm.time && (
                                    <button
                                      type="button"
                                      onClick={() => setEditSubForm(prev => ({ ...prev, time: '' }))}
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                                      title="Delete / Clear Exam Time"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleSaveEditSubject(sub.code)}
                                    className="p-1.5 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                    title="Save Subject Changes"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={handleCancelEditSubject}
                                    className="p-1.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-2 font-bold text-blue-600">{sub.code}</td>
                              <td className="px-4 py-2 font-semibold text-slate-800">{sub.name}</td>
                              <td className="px-4 py-2">{sub.date || 'TBA'}</td>
                              <td className="px-4 py-2">
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                                  {sub.session}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-slate-500">
                                <div className="flex items-center gap-1.5">
                                  <span>{sub.time || '—'}</span>
                                  {sub.time && (
                                    <button
                                      type="button"
                                      onClick={() => handleClearSubjectTime(sub.code)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                                      title="Delete / Clear Exam Time"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleStartEditSubject(sub)}
                                    className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                    title="Edit subject details"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveSubject(sub.code)}
                                    className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Delete subject"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step 3.5: Hall Ticket Instructions to Candidates (Editable) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">ℹ️</div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                      Hall Ticket Instructions to Candidates (Editable)
                    </h3>
                    <p className="text-xs text-slate-500">Edit, add, or remove rules that will be printed on student hall tickets</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetInstructions}
                  className="text-xs text-slate-500 hover:text-blue-600 font-semibold"
                >
                  Reset Defaults
                </button>
              </div>

              {/* Add New Instruction Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newInstructionText}
                  onChange={(e) => setNewInstructionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInstruction();
                    }
                  }}
                  placeholder="Type new instruction for candidates..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddInstruction}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Rule
                </button>
              </div>

              {/* List of Instructions */}
              <div className="space-y-2">
                {instructionsList.map((inst, idx) => {
                  const isEditingThis = editingInstructionIdx === idx;
                  return (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      {isEditingThis ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editingInstructionText}
                            onChange={(e) => setEditingInstructionText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInstructionEdit(idx);
                            }}
                            className="flex-1 bg-white border border-blue-400 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveInstructionEdit(idx)}
                            className="p-1.5 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingInstructionIdx(null);
                              setEditingInstructionText('');
                            }}
                            className="p-1.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-start justify-between gap-2">
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">{inst}</p>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditInstruction(idx, inst)}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit instruction"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteInstruction(idx)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete instruction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Students Matrix */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">4</div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                      Student Hall & Seat Allocation Matrix ({displayedStudents.length} Candidates Displayed)
                    </h3>
                    <p className="text-xs text-slate-500">First choose the subject below, review enrolled candidates, and assign their hall & seat</p>
                  </div>
                </div>
              </div>

              {/* Subject Selector for Allocation */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50/70 to-blue-50 border-2 border-blue-300 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-black text-blue-950 uppercase tracking-wide">
                      Select Subject to Allocate:
                    </label>
                    <p className="text-[11px] text-blue-800 font-medium">
                      Select an examination subject first. Enrolled students studying this subject will be displayed below for hall & seat allocation.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedAllocationSubject}
                      onChange={(e) => {
                        const subCode = e.target.value;
                        setSelectedAllocationSubject(subCode);
                        if (subCode && subCode !== 'ALL') {
                          loadEligibleStudents(formDept, formSemester, formSection, subCode);
                        }
                      }}
                      className="bg-white border-2 border-blue-500 rounded-xl px-4 py-2 text-xs font-black text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm min-w-[280px]"
                    >
                      <option value="ALL">📋 All Subjects & All Allocated Candidates ({studentsToAllocate.length})</option>
                      {subjectsSchedule.map(s => (
                        <option key={s.code} value={s.code}>
                          {s.code} — {s.name} ({s.date || 'TBA'} · {s.session})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedAllocationSubject ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-blue-200 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-blue-950">Selected Subject:</span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white font-black text-xs">
                        {selectedAllocationSubject}
                      </span>
                      <span className="text-blue-900 font-bold">
                        {subjectsSchedule.find(s => s.code.toUpperCase() === selectedAllocationSubject.toUpperCase())?.name || ''}
                      </span>
                      <span className="text-blue-700 font-medium">
                        ({displayedStudents.length} candidate(s) studying this subject)
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (subjectsSchedule.length === 0) {
                            alert('No subjects scheduled yet in Step 1.');
                            return;
                          }
                          setStudentsToAllocate(prev => prev.map(st => {
                            const allSubs = subjectsSchedule.map(s => ({
                              code: s.code.toUpperCase(),
                              name: s.name,
                              date: (s.date && s.date !== 'TBA') ? s.date : (s.code === 'CS2001' ? '2026-04-15' : '2026-04-18'),
                              session: s.session || 'Forenoon (FN)',
                              time: s.time || '09:30 AM - 12:30 PM'
                            }));
                            return { ...st, subjects: allSubs };
                          }));
                          setStatusMessage({ type: 'success', text: `Assigned all scheduled subjects with timings to all ${studentsToAllocate.length} candidates!` });
                          setTimeout(() => setStatusMessage(null), 3500);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] shadow-xs transition-all flex items-center gap-1"
                      >
                        ⚡ Assign All Subjects &amp; Timing to All
                      </button>

                      {hallsList.length > 0 && displayedStudents.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-600">Quick Hall:</span>
                          {hallsList.map(h => (
                            <button
                              key={h.hallNo}
                              type="button"
                              onClick={() => handleAssignHallToAll(h.hallNo)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 transition-all"
                            >
                              Assign {h.hallNo} to All
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2 text-xs text-amber-800 font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Please choose a subject from the dropdown above. The students enrolled in that subject will appear below for hall allocation.</span>
                  </div>
                )}
              </div>

              {/* Add Student Manually Form */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                  Add Student Manually to this Examination
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2">
                  <div>
                    <input
                      type="text"
                      value={manualRollNo}
                      onChange={(e) => setManualRollNo(e.target.value)}
                      placeholder="Roll No (e.g. 22UCS041)"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 uppercase"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Student Full Name"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <select
                      value={manualHall}
                      onChange={(e) => setManualHall(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-800"
                    >
                      <option value="">-- Hall --</option>
                      {allSelectableHalls.map(h => <option key={h.hallNo} value={h.hallNo}>{h.hallNo}</option>)}
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={manualSeat}
                      onChange={(e) => setManualSeat(e.target.value)}
                      placeholder="Seat (e.g. H101-01)"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleAddManualStudent}
                      className="w-full h-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Student
                    </button>
                  </div>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[480px] overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider z-10">
                    <tr>
                      <th className="px-4 py-3">Roll No</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Subjects to Write</th>
                      <th className="px-4 py-3">Allocated Hall / Room</th>
                      <th className="px-4 py-3">Allocated Seat No</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedStudents.length > 0 ? (
                      displayedStudents.map((st) => (
                        <tr key={st.rollNo} className="hover:bg-slate-50/70">
                          <td className="px-4 py-2.5 font-bold text-blue-600">{st.rollNo}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-900">{st.name}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-col gap-1 max-w-sm">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {subjectsSchedule.map(sub => {
                                  const isEnrolled = (st.subjects || []).some(s => s.code.toUpperCase() === sub.code.toUpperCase());
                                  return (
                                    <button
                                      key={sub.code}
                                      type="button"
                                      onClick={() => toggleStudentSubject(st.rollNo, sub)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all flex items-center gap-1 ${isEnrolled
                                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                          : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                        }`}
                                      title={`${isEnrolled ? 'Remove' : 'Select'} ${sub.code} (${sub.name})`}
                                    >
                                      <span>{sub.code}</span>
                                      <span>{isEnrolled ? '✓' : '+'}</span>
                                    </button>
                                  );
                                })}
                              </div>
                              {st.subjects && st.subjects.length > 0 ? (
                                <div className="text-[10px] text-slate-600 font-medium leading-tight">
                                  {st.subjects.map(s => `${s.code}: ${s.date || 'TBA'} (${s.session?.includes('AN') ? 'AN' : 'FN'})`).join(' • ')}
                                </div>
                              ) : (
                                <span className="text-[10px] text-amber-600 font-semibold italic">No subject selected (Click + above)</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5">
                              <select
                                value={st.hallNo || ''}
                                onChange={(e) => handleStudentFieldChange(st.rollNo, 'hallNo', e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 min-w-[130px]"
                              >
                                <option value="">-- Select Hall --</option>
                                {allSelectableHalls.map(h => (
                                  <option key={h.hallNo} value={h.hallNo}>{h.hallNo}</option>
                                ))}
                              </select>
                              {st.hallNo && st.hallNo !== 'TBA' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-100 shrink-0">
                                  <Building2 className="w-2.5 h-2.5" />
                                  {st.hallNo}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              value={st.seatNo || ''}
                              onChange={(e) => handleStudentFieldChange(st.rollNo, 'seatNo', e.target.value)}
                              placeholder="e.g. H101-01"
                              className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            {st.hallNo && st.hallNo !== 'TBA' && st.hallNo !== 'Unassigned' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Allocated
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              onClick={() => handleRemoveStudent(st.rollNo)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600"
                              title="Remove student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : !selectedAllocationSubject ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
                          <BookOpen className="w-10 h-10 mx-auto mb-2 text-blue-500" />
                          <p className="font-bold text-sm text-slate-800">Please Select an Examination Subject First</p>
                          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                            Choose the subject from the dropdown above. The students studying that subject will appear here so you can allocate their examination hall & seat.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                          <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-xs text-slate-600">No students enrolled in subject {selectedAllocationSubject} found</p>
                          <p className="text-xs text-slate-400 mt-1">You can add students manually using the form above.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Save Allocation Button */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => setActiveTab('tickets')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAllocation}
                  disabled={savingAllocation}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingAllocation ? 'Saving Allocations...' : 'Save & Publish Hall Tickets'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------- TAB 3: ARREAR STUDENTS ------------------- */}
        {activeTab === 'arrear' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-rose-900 via-rose-800 to-red-950 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-rose-500/10 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/30 text-rose-200 border border-rose-400/30 uppercase tracking-wider">Arrear Management</span>
                </div>
                <h2 className="text-lg font-black text-white">Student Arrear Papers</h2>
                <p className="text-xs text-rose-200 mt-0.5">View students with arrear subjects — S.No, Reg No, Sub Code, Sub Name, Semester, Department, Overall Count</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
                <div className="relative xl:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, reg no, subject..."
                    value={arrearSearch}
                    onChange={e => setArrearSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <select
                  value={arrearDept}
                  onChange={e => setArrearDept(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none"
                >
                  <option value="">All Departments</option>
                  {availableDepts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <select
                  value={arrearYear}
                  onChange={e => setArrearYear(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none"
                >
                  {arrearYearOptions.map(value => (
                    <option key={value} value={value}>{value === 'All Years' ? 'All Years' : value}</option>
                  ))}
                </select>

                <select
                  value={arrearSemester}
                  onChange={e => setArrearSemester(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none"
                >
                  <option value="All Semesters">All Semesters</option>
                  {ALL_SEMESTERS.map(sem => <option key={sem} value={String(sem)}>{sem}</option>)}
                </select>

                <select
                  value={arrearBatch}
                  onChange={e => setArrearBatch(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none"
                >
                  {arrearBatchOptions.map(value => (
                    <option key={value} value={value}>{value === 'All Batches' ? 'All Batches' : value}</option>
                  ))}
                </select>

                <select
                  value={arrearSubject}
                  onChange={e => setArrearSubject(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none"
                >
                  {arrearSubjectOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {filteredArrearStudents.length} student(s) matched
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setArrearDept('');
                      setArrearYear('All Years');
                      setArrearSemester('All Semesters');
                      setArrearBatch('All Batches');
                      setArrearSubject('All Subjects');
                      setArrearSearch('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                  <button
                    onClick={async () => {
                      setLoadingArrear(true);
                      try {
                        const url = arrearDept
                          ? `${API_BASE}/students?department=${encodeURIComponent(arrearDept)}`
                          : `${API_BASE}/students`;
                        const res = await fetch(url);
                        const data = await res.json();
                        const list = data.success ? (data.students || data.data || []) : [];
                        setArrearOptionStudents(list);
                        const withArrears = list.filter(s =>
                          (Number(s.arrearsYetToBeCleared || 0) > 0) ||
                          (Number(s.totalArrearsTillLastSem || 0) > 0) ||
                          (Number(s.totalArrears || 0) > 0)
                        );
                        setArrearStudents(withArrears);
                        setSelectedArrearStudent(null);
                      } catch (e) {
                        alert('Failed to fetch students: ' + e.message);
                      } finally {
                        setLoadingArrear(false);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/20 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingArrear ? 'animate-spin' : ''}`} />
                    Load Arrear List
                  </button>
                </div>
              </div>
            </div>

            {selectedArrearStudent && (
              <div className="bg-gradient-to-r from-rose-50 via-white to-amber-50 border border-rose-200 rounded-2xl p-4 shadow-sm">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-600">Selected Student</p>
                    <h3 className="text-lg font-black text-slate-900">{selectedArrearStudent.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Reg No: <span className="font-bold text-slate-700">{selectedArrearStudent.regNo || selectedArrearStudent.rollNo || '—'}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                    <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700">Dept: {selectedArrearStudent.department || '—'}</span>
                    <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700">Year: {selectedArrearStudent.year || '—'}</span>
                    <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700">Sem: {selectedArrearStudent.semester || selectedArrearStudent.sem || '—'}</span>
                    <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700">Batch: {selectedArrearStudent.batch || '—'}</span>
                  </div>
                </div>

                <div className="mt-4 grid md:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Arrears</div>
                    <div className="mt-1 text-xl font-black text-rose-600">{Number(selectedArrearStudent.totalArrearsTillLastSem || selectedArrearStudent.totalArrears || 0)}</div>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cleared</div>
                    <div className="mt-1 text-xl font-black text-emerald-600">{Number(selectedArrearStudent.arrearsClearedThisSem || 0)}</div>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pending</div>
                    <div className="mt-1 text-xl font-black text-amber-600">{Number(selectedArrearStudent.arrearsYetToBeCleared || Math.max(0, (Number(selectedArrearStudent.totalArrearsTillLastSem || selectedArrearStudent.totalArrears || 0) - Number(selectedArrearStudent.arrearsClearedThisSem || 0))))}</div>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Arrear Subjects</div>
                    <div className="mt-1 text-xl font-black text-indigo-600">{getStudentArrearList(selectedArrearStudent).length}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Subject Breakdown</p>
                  <div className="flex flex-wrap gap-2">
                    {getStudentArrearList(selectedArrearStudent).length > 0 ? getStudentArrearList(selectedArrearStudent).map((subject, idx) => (
                      <div key={`${subject.code}-${idx}`} className="rounded-xl bg-white border border-rose-200 px-3 py-2 min-w-[170px]">
                        <div className="text-[10px] font-black uppercase tracking-wider text-rose-600">{subject.code || `AR${idx + 1}`}</div>
                        <div className="mt-1 text-xs font-bold text-slate-800">{subject.name || 'Arrear Subject'}</div>
                      </div>
                    )) : (
                      <div className="text-xs font-semibold text-slate-500">No subject details available for this student.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Arrear Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Arrear Students — All Subjects</p>
                <span className="text-[11px] font-semibold text-slate-400">{filteredArrearStudents.length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">S.No</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Reg No</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Student Name</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Department</th>
                      <th className="px-3 py-2.5 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider">Year</th>
                      <th className="px-3 py-2.5 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider">Sem</th>
                      <th className="px-3 py-2.5 text-center text-[10px] font-black text-rose-600 uppercase tracking-wider">Total Arrears</th>
                      <th className="px-3 py-2.5 text-center text-[10px] font-black text-amber-600 uppercase tracking-wider">Yet to Clear</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Arrear Subjects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArrearStudents.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                          {loadingArrear ? (
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
                              <span className="text-sm font-semibold">Loading arrear data...</span>
                            </div>
                          ) : (
                            <>
                              <Award className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                              <p className="font-semibold text-slate-500">No arrear students found</p>
                              <p className="text-[11px] mt-1">Try changing the filters or click "Load Arrear List" again.</p>
                            </>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredArrearStudents.map((s, idx) => {
                        const totalArrears = Number(s.totalArrearsTillLastSem || s.totalArrears || 0);
                        const cleared = Number(s.arrearsClearedThisSem || 0);
                        const yetToClear = Number(s.arrearsYetToBeCleared || Math.max(0, totalArrears - cleared));
                        const subjectList = getStudentArrearList(s);
                        const isSelected = (selectedArrearStudent && (selectedArrearStudent._id || selectedArrearStudent.regNo || selectedArrearStudent.rollNo) === (s._id || s.regNo || s.rollNo));
                        return (
                          <tr
                            key={s._id || idx}
                            onClick={() => setSelectedArrearStudent(s)}
                            className={`border-b border-slate-100 transition-colors cursor-pointer ${isSelected ? 'bg-rose-50/70' : 'hover:bg-rose-50/30'}`}
                          >
                            <td className="px-3 py-2.5 font-bold text-slate-500">{idx + 1}</td>
                            <td className="px-3 py-2.5 font-mono font-bold text-blue-700">{s.regNo || s.rollNo || '—'}</td>
                            <td className="px-3 py-2.5 font-bold text-slate-900">{s.name}</td>
                            <td className="px-3 py-2.5 text-slate-600 font-medium">{s.department || '—'}</td>
                            <td className="px-3 py-2.5 text-center text-slate-600 font-semibold">{s.year || '—'}</td>
                            <td className="px-3 py-2.5 text-center text-slate-600 font-semibold">{s.semester || s.sem || '—'}</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-black rounded-full text-[10px]">{totalArrears}</span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`px-2 py-0.5 font-black rounded-full text-[10px] ${yetToClear > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{yetToClear}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              {subjectList.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {subjectList.slice(0, 4).map((sub, si) => (
                                    <span key={`${sub.code || 'x'}-${si}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-semibold">
                                      <span className="font-mono font-black">{sub.code || `AR${si + 1}`}</span>
                                      {sub.name && <span className="text-rose-500">— {sub.name}</span>}
                                    </span>
                                  ))}
                                  {subjectList.length > 4 && <span className="text-[10px] font-bold text-slate-500">+{subjectList.length - 4} more</span>}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[10px] italic">No subject details</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ------------------- MODAL: EDIT CANDIDATE INSTRUCTIONS ------------------- */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">ℹ️</div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Edit Hall Ticket Candidate Instructions</h3>
                  <p className="text-xs text-slate-500">Changes will be printed on all student hall tickets for this examination</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Rule Input */}
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={newInstructionText}
                onChange={(e) => setNewInstructionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInstruction();
                  }
                }}
                placeholder="Type new instruction for candidates..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800"
              />
              <button
                type="button"
                onClick={handleAddInstruction}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Add Rule
              </button>
            </div>

            {/* Instruction List */}
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {instructionsList.map((inst, idx) => {
                const isEditingThis = editingInstructionIdx === idx;
                return (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    {isEditingThis ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingInstructionText}
                          onChange={(e) => setEditingInstructionText(e.target.value)}
                          className="flex-1 bg-white border border-blue-400 rounded-lg px-2.5 py-1 text-xs"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveInstructionEdit(idx)}
                          className="p-1.5 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingInstructionIdx(null);
                            setEditingInstructionText('');
                          }}
                          className="p-1.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-start justify-between gap-2">
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{inst}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditInstruction(idx, inst)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteInstruction(idx)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleResetInstructions}
                className="text-xs text-slate-500 hover:text-blue-600 font-semibold"
              >
                Reset Defaults
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowInstructionsModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveInstructionsToAllocation}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
                >
                  Save & Apply Instructions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- MODAL: SINGLE STUDENT HALL TICKET PREVIEW ------------------- */}
      {previewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0f1e3c] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Hall Ticket Preview — {previewStudent.name} ({previewStudent.rollNo})</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printHallTickets([previewStudent], previewExam)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Download
                </button>
                <button
                  onClick={() => setPreviewStudent(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Hall Ticket Body */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex justify-center">
              <div className="bg-white p-5 sm:p-6 border-2 border-black max-w-xl w-full text-black shadow-lg font-serif">
                {/* College Header */}
                <div className="flex items-center gap-3 pb-2">
                  <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                    <img src="/vcas-logo.png" alt="Crest Logo" className="w-14 h-14 object-contain" />
                  </div>
                  <div className="text-center flex-1 pr-14">
                    <h3 className="font-black text-sm uppercase tracking-wide leading-tight text-black">
                      VIVEKANANDA COLLEGE OF ARTS AND SCIENCE
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-900 mt-0.5">Vellalankulam, Tenkasi Dist</p>
                    <p className="text-[9px] font-bold text-slate-800 mt-0.5">
                      PHONE: 04636298128, 7094462393, 7094462394 &nbsp;&nbsp; EMAIL: vivekanandacas@gmail.com
                    </p>
                    <p className="font-extrabold text-[11px] uppercase tracking-wide mt-1.5 text-black">
                      {(previewExam?.examName || 'MODEL SEMESTER EXAMINATION - NOVEMBER 2026').toUpperCase()}
                    </p>
                    <p className="font-black text-xs uppercase tracking-widest underline mt-1 text-black">
                      HALL TICKET
                    </p>
                  </div>
                </div>

                {/* Dept / Year / Sem Meta Row */}
                <div className="flex items-center justify-between text-[11px] font-bold py-2 px-1 text-black">
                  <div><span>DEPARTMENT:</span> {(previewStudent.dept || previewExam?.department || 'CFS').toUpperCase()}</div>
                  <div><span>YEAR:</span> {(() => {
                    const s = Number(previewStudent.semester || previewExam?.semester) || 1;
                    const map = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
                    return map[Math.ceil(s / 2)] || 'I';
                  })()}</div>
                  <div><span>SEMESTER:</span> {(() => {
                    const s = Number(previewStudent.semester || previewExam?.semester) || 1;
                    const map = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII' };
                    return map[s] || 'I';
                  })()}</div>
                </div>

                {/* Candidate Info 2-Row Box */}
                <table className="w-full border-collapse border border-black text-xs mb-2">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="w-28 font-bold p-1.5 border-r border-black bg-slate-50">Student Name:</td>
                      <td className="font-bold p-1.5 uppercase text-black">{previewStudent.name}</td>
                    </tr>
                    <tr>
                      <td className="w-28 font-bold p-1.5 border-r border-black bg-slate-50">Register No :</td>
                      <td className="font-bold p-1.5 font-mono text-black">{previewStudent.rollNo || previewStudent.regNo}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Time Table Heading */}
                <div className="text-center font-black text-xs uppercase tracking-wider underline my-1.5 text-black">
                  TIME TABLE
                </div>

                {/* Schedule Table */}
                <table className="w-full border-collapse border border-black text-[10.5px] text-left">
                  <thead>
                    <tr className="border-b border-black bg-slate-50 text-center font-bold">
                      <th className="border border-black px-1.5 py-1 w-8">NO</th>
                      <th className="border border-black px-1.5 py-1 w-24">DATE</th>
                      <th className="border border-black px-1 py-1 w-12">FN<br/>AN</th>
                      <th className="border border-black px-2 py-1">SUBJECT</th>
                      <th className="border border-black px-1.5 py-1 w-20">Sub. Code</th>
                      <th className="border border-black px-1.5 py-1 w-12">Sign</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((previewStudent.subjects?.length > 0 ? previewStudent.subjects : previewExam?.commonSubjects) || subjectsSchedule).map((sub, idx) => (
                      <tr key={sub.code || idx} className="border-b border-black">
                        <td className="border border-black px-1.5 py-1.5 text-center font-bold">{idx + 1}</td>
                        <td className="border border-black px-1.5 py-1.5 text-center font-bold">{sub.date || '21.10.26'}</td>
                        <td className="border border-black px-1 py-1.5 text-center font-bold">
                          {String(sub.session || 'FN').toUpperCase().includes('AN') ? 'AN' : 'FN'}
                        </td>
                        <td className="border border-black px-2 py-1.5 font-bold uppercase">{sub.name}</td>
                        <td className="border border-black px-1.5 py-1.5 text-center font-bold">{sub.code || ''}</td>
                        <td className="border border-black px-1 py-1.5 text-center h-7"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Signatures */}
                <div className="pt-8 pb-2 flex items-center justify-between text-center text-xs font-bold px-2">
                  <div>Office</div>
                  <div>HOD</div>
                  <div>Principal</div>
                  <div>MD</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Allocation Centered Modal */}
      {allocationToDelete && (
        <ModalPortal isOpen={Boolean(allocationToDelete)} onClose={() => !isDeletingAllocation && setAllocationToDelete(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-7 max-w-md w-full animate-in fade-in zoom-in-95 text-left my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200/70 flex items-center justify-center text-rose-600 shadow-xs">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Delete Hall Allocation</h3>
                  <p className="text-xs text-slate-500 font-medium">Remove examination allocation & tickets</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isDeletingAllocation && setAllocationToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-5 space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Plan</div>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {(allocations.find(a => a._id === allocationToDelete) || currentAllocation)?.examName || 'Examination Allocation'}
                </div>
                <div className="text-xs text-slate-600 font-medium mt-1">
                  {(allocations.find(a => a._id === allocationToDelete) || currentAllocation)?.department} · Semester {(allocations.find(a => a._id === allocationToDelete) || currentAllocation)?.semester} · {(allocations.find(a => a._id === allocationToDelete) || currentAllocation)?.students?.length || 0} candidates
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200/80 text-xs text-rose-900 font-medium leading-relaxed">
                <span className="font-bold">Warning:</span> Are you sure you want to delete this hall allocation? This will permanently remove all associated student hall tickets and seating arrangements.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingAllocation}
                onClick={() => setAllocationToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingAllocation}
                onClick={executeDeleteAllocation}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeletingAllocation ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Allocation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Reset Instructions Centered Modal */}
      {showResetInstructionsModal && (
        <ModalPortal isOpen={showResetInstructionsModal} onClose={() => setShowResetInstructionsModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-7 max-w-md w-full animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-600 shadow-xs">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Reset Instructions</h3>
                  <p className="text-xs text-slate-500 font-medium">Revert candidate rules to defaults</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetInstructionsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Are you sure you want to reset all candidate hall ticket instructions to the default standard examination guidelines?
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] text-slate-500">
                This will replace any custom instructions entered for this examination plan with the 5 standard VCAS rules.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetInstructionsModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeResetInstructions}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
