import React, { useState, useEffect, useMemo } from 'react';
import {
  Ticket, Building2, Users, Calendar, Clock, Download, Printer,
  Search, Filter, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw,
  Eye, BookOpen, Sparkles, X, UserPlus, Save, Pencil, Check, Award
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const DEFAULT_INSTRUCTIONS = [
  'Candidates must bring this Hall Ticket along with their official College Identity Card to every examination session.',
  'Candidates should occupy their allotted seats at least 15 minutes prior to the commencement of the examination.',
  'Possession of mobile phones, smartwatches, programmable calculators, or unauthorized study materials inside the hall is strictly prohibited.',
  'No candidate will be allowed to enter the exam hall 30 minutes after the commencement of the exam or leave 30 minutes before closing.',
  'Students must sign in the attendance sheet and on the hall ticket in the presence of the Hall Superintendent.'
];

const ALL_SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const DEFAULT_DEPTS = [
  'Computer Science',
  'Information Technology',
  'Commerce',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Business Administration',
  'English'
];

export default function StaffHallTicket({ staffUser, onNavigate }) {
  // Navigation tabs: 'tickets' | 'allocate'
  const [activeTab, setActiveTab] = useState('tickets');
  
  // Data states
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAllocationId, setSelectedAllocationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hallFilter, setHallFilter] = useState('All');

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
  
  // Available departments & semesters (all 8 semesters always selectable)
  const [availableDepts, setAvailableDepts] = useState(DEFAULT_DEPTS);
  const [availableSemesters, setAvailableSemesters] = useState(ALL_SEMESTERS);
  const [availableSections, setAvailableSections] = useState(['All', 'A', 'B', 'C']);

  // Examination plan selection & typing mode states
  const [planFilterDept, setPlanFilterDept] = useState(staffUser?.department || 'Computer Science');
  const [planFilterSem, setPlanFilterSem] = useState(3);
  const [planTypingExamName, setPlanTypingExamName] = useState('Semester End Theory Examinations - 2026');

  // Candidate instructions state (fully editable)
  const [instructionsList, setInstructionsList] = useState(DEFAULT_INSTRUCTIONS);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [newInstructionText, setNewInstructionText] = useState('');
  const [editingInstructionIdx, setEditingInstructionIdx] = useState(null);
  const [editingInstructionText, setEditingInstructionText] = useState('');

  // Subject selection for allocation matrix (staff must select subject first)
  const [selectedAllocationSubject, setSelectedAllocationSubject] = useState('');

  // Allocation Form State
  const [formExamName, setFormExamName] = useState('Semester End Theory Examinations - 2026');
  const [formExamType, setFormExamType] = useState('Semester End Examination');
  const [formAcademicYear, setFormAcademicYear] = useState('2025-2026');
  const [formDept, setFormDept] = useState(staffUser?.department || 'Computer Science');
  const [formSemester, setFormSemester] = useState(3);
  const [formSection, setFormSection] = useState('All');
  
  // Rooms/Halls configuration for allocation - persisted in localStorage so refresh never loses added halls
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
    } catch {}
    return [{ hallNo: 'D2', capacity: 30 }];
  });
  const [newHallName, setNewHallName] = useState('');
  const [newHallCap, setNewHallCap] = useState(30);

  // Subjects schedule for this exam
  const [subjectsSchedule, setSubjectsSchedule] = useState([]);
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubDate, setNewSubDate] = useState('');
  const [newSubSession, setNewSubSession] = useState('Forenoon (FN)');
  const [newSubTime, setNewSubTime] = useState('');

  // Set of subject codes explicitly removed by staff so they never re-appear
  const [deletedSubjectCodes, setDeletedSubjectCodes] = useState(() => {
    try {
      const saved = localStorage.getItem('vcas_deleted_subject_codes');
      return saved ? new Set(JSON.parse(saved)) : new Set(['SF76']);
    } catch {
      return new Set(['SF76']);
    }
  });

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

  // Fetch metadata on mount (ensuring all 8 semesters are always selectable)
  useEffect(() => {
    fetch(`${API_BASE}/hall-tickets/meta`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.departments?.length > 0) {
            const combined = Array.from(new Set([...DEFAULT_DEPTS, ...data.departments]));
            setAvailableDepts(combined);
            const match = combined.find(d => staffUser?.department && d.toLowerCase().includes(staffUser.department.toLowerCase()));
            const targetDept = match || combined[0];
            setFormDept(targetDept);
            loadAvailableSubjects(targetDept, formSemester, formSection);
          } else {
            setAvailableDepts(DEFAULT_DEPTS);
            loadAvailableSubjects(formDept, formSemester, formSection);
          }
          // Always ensure all 8 semesters are selectable
          setAvailableSemesters(ALL_SEMESTERS);
          if (data.sections?.length > 0) setAvailableSections(data.sections);
        }
      })
      .catch(err => {
        console.error('Error loading meta:', err);
        setAvailableDepts(DEFAULT_DEPTS);
        setAvailableSemesters(ALL_SEMESTERS);
        loadAvailableSubjects(formDept, formSemester, formSection);
      });
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
        setSubjectsSchedule(currentAllocation.commonSubjects.filter(s => !deletedSubjectCodes.has(s.code.toUpperCase())));
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
          } catch {}
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
      if (data.success && Array.isArray(data.subjects) && data.subjects.length > 0) {
        setSubjectsSchedule(prev => {
          const prevMap = new Map(prev.map(s => [s.code.toUpperCase(), s]));
          const merged = [];

          // Filter out subjects that staff explicitly removed
          const validSubs = data.subjects.filter(s => !deletedSubjectCodes.has(s.code.toUpperCase()));

          validSubs.forEach((dbSub, idx) => {
            const code = dbSub.code.toUpperCase();
            const baseDay = 15 + (idx * 3);
            const defaultDate = `2026-04-${baseDay < 10 ? '0' + baseDay : baseDay}`;

            if (prevMap.has(code)) {
              const existing = prevMap.get(code);
              merged.push({
                ...existing,
                name: dbSub.name || existing.name,
                date: (existing.date && existing.date !== 'TBA') ? existing.date : (dbSub.date || defaultDate),
                session: existing.session || dbSub.session || 'Forenoon (FN)',
                time: existing.time || dbSub.time || ''
              });
              prevMap.delete(code);
            } else {
              merged.push({
                code: dbSub.code,
                name: dbSub.name,
                date: dbSub.date || defaultDate,
                session: dbSub.session || 'Forenoon (FN)',
                time: dbSub.time || ''
              });
            }
          });

          // Keep user-added custom subjects that are not in DB (as long as not deleted)
          prevMap.forEach(customSub => {
            if (!deletedSubjectCodes.has(customSub.code.toUpperCase())) {
              merged.push(customSub);
            }
          });
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
          setSubjectsSchedule(prev => {
            const prevMap = new Map(prev.map(s => [s.code.toUpperCase(), s]));
            const merged = [];

            const validSubs = data.subjects.filter(s => !deletedSubjectCodes.has(s.code.toUpperCase()));

            validSubs.forEach((dbSub, idx) => {
              const code = dbSub.code.toUpperCase();
              const baseDay = 15 + (idx * 3);
              const defaultDate = `2026-04-${baseDay < 10 ? '0' + baseDay : baseDay}`;

              if (prevMap.has(code)) {
                const existing = prevMap.get(code);
                merged.push({
                  ...existing,
                  name: dbSub.name || existing.name,
                  date: (existing.date && existing.date !== 'TBA') ? existing.date : (dbSub.date || defaultDate),
                  session: existing.session || dbSub.session || 'Forenoon (FN)',
                  time: existing.time || dbSub.time || ''
                });
                prevMap.delete(code);
              } else {
                merged.push({
                  code: dbSub.code,
                  name: dbSub.name,
                  date: dbSub.date || defaultDate,
                  session: dbSub.session || 'Forenoon (FN)',
                  time: dbSub.time || ''
                });
              }
            });

            prevMap.forEach(customSub => {
              if (!deletedSubjectCodes.has(customSub.code.toUpperCase())) {
                merged.push(customSub);
              }
            });
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
          const formatted = data.students.map(st => {
            const existingInState = studentsToAllocate.find(s => s.rollNo.toUpperCase() === st.rollNo.toUpperCase());
            const assignedHall = existingInState?.hallNo || '';
            const assignedSeat = existingInState?.seatNo || '';

            return {
              rollNo: st.rollNo,
              name: st.name,
              dept: st.dept || activeDept,
              semester: st.semester || activeSem,
              section: st.section || 'A',
              hallNo: assignedHall,
              seatNo: assignedSeat,
              eligible: true,
              remarks: 'Eligible for Examination',
              // Student is strictly assigned ONLY the subject staff selected
              subjects: [chosenSub]
            };
          });
          setStudentsToAllocate(formatted);
          setStatusMessage({ type: 'success', text: `Loaded ${formatted.length} student(s) studying ${chosenSub.code} (${chosenSub.name}).` });
        } else {
          setStudentsToAllocate([]);
          setStatusMessage({ type: 'info', text: `No students found enrolled in subject ${activeSub}.` });
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
    }
  }, [activeTab, formDept, formSemester, formSection]);

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
    } catch {}
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
      } catch {}
      return updated;
    });
  };

  // Students filtered by selected allocation subject
  const displayedStudents = useMemo(() => {
    if (!selectedAllocationSubject) return [];
    return studentsToAllocate.filter(st => {
      if (!st.subjects || st.subjects.length === 0) return true;
      return st.subjects.some(s => s.code.toUpperCase() === selectedAllocationSubject.toUpperCase());
    });
  }, [studentsToAllocate, selectedAllocationSubject]);

  // Assign a hall to all displayed students in the matrix
  const handleAssignHallToAll = (hallName) => {
    if (!hallName) return;
    const targetRolls = new Set(displayedStudents.map(s => s.rollNo.toUpperCase()));
    setStudentsToAllocate(prev => prev.map(st => {
      if (targetRolls.has(st.rollNo.toUpperCase())) {
        return {
          ...st,
          hallNo: hallName
        };
      }
      return st;
    }));
    setStatusMessage({ type: 'success', text: `Assigned "${hallName}" to ${displayedStudents.length} student(s)!` });
    setTimeout(() => setStatusMessage(null), 3500);
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
    if (!newSubCode.trim() || !newSubName.trim()) {
      alert('Please enter both Course Code and Subject Name.');
      return;
    }
    const cleanCode = newSubCode.trim().toUpperCase();
    const cleanName = newSubName.trim();
    const cleanDate = newSubDate || '2026-04-20';
    const cleanSession = newSubSession || 'Forenoon (FN)';
    const cleanTime = newSubTime.trim() || '';

    // If previously deleted, un-delete it
    setDeletedSubjectCodes(prev => {
      const next = new Set(prev);
      next.delete(cleanCode);
      try {
        localStorage.setItem('vcas_deleted_subject_codes', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

    setSubjectsSchedule(prev => {
      const idx = prev.findIndex(s => s.code.toUpperCase() === cleanCode);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          code: cleanCode,
          name: cleanName,
          date: cleanDate,
          session: cleanSession,
          time: cleanTime
        };
        return copy;
      }
      return [
        ...prev,
        {
          code: cleanCode,
          name: cleanName,
          date: cleanDate,
          session: cleanSession,
          time: cleanTime
        }
      ];
    });

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

    setNewSubCode('');
    setNewSubName('');
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
      } catch {}
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

  const handleSaveEditSubject = (originalCode) => {
    if (!editSubForm.code.trim() || !editSubForm.name.trim()) {
      alert('Subject Code and Title cannot be empty.');
      return;
    }
    const cleanCode = editSubForm.code.trim().toUpperCase();
    const cleanName = editSubForm.name.trim();
    const cleanDate = editSubForm.date || '2026-04-20';
    const cleanSession = editSubForm.session || 'Forenoon (FN)';
    const cleanTime = editSubForm.time.trim() || '';

    setSubjectsSchedule(prev => prev.map(s => {
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
    }));

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

    setEditingSubCode(null);
    setStatusMessage({ type: 'success', text: `Saved updates for subject ${cleanCode} (${cleanName}).` });
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
    if (window.confirm('Reset all instructions to default examination rules?')) {
      setInstructionsList(DEFAULT_INSTRUCTIONS);
    }
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

      return {
        ...st,
        hallNo,
        seatNo,
        subjects: st.subjects
      };
    });

    setStudentsToAllocate(allocated);
    setStatusMessage({ type: 'success', text: `Auto-allocated ${allocated.length} student(s) across halls successfully!` });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Toggle a specific subject for an individual student
  const toggleStudentSubject = (rollNo, subObj) => {
    setStudentsToAllocate(prev => prev.map(st => {
      if (st.rollNo.toUpperCase() === rollNo.toUpperCase()) {
        const curSubs = st.subjects || [];
        const exists = curSubs.some(s => s.code.toUpperCase() === subObj.code.toUpperCase());
        let updatedSubs;
        if (exists) {
          updatedSubs = curSubs.filter(s => s.code.toUpperCase() !== subObj.code.toUpperCase());
        } else {
          updatedSubs = [...curSubs, {
            code: subObj.code.toUpperCase(),
            name: subObj.name,
            date: subObj.date || 'TBA',
            session: subObj.session || 'Forenoon (FN)',
            time: subObj.time || '09:30 AM - 12:30 PM'
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
          date: targetSub.date || 'TBA',
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
    setStudentsToAllocate(prev => prev.map(st => {
      if (st.rollNo.toUpperCase() === rollNo.toUpperCase()) {
        return { ...st, [field]: value };
      }
      return st;
    }));
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
    const cleanCommonSubjects = subjectsSchedule.map(s => ({
      ...s,
      date: (s.date && s.date.trim()) ? s.date.trim() : '2026-04-20',
      session: s.session || 'Forenoon (FN)',
      time: s.time || '09:30 AM - 12:30 PM'
    }));

    const preparedStudents = studentsToAllocate.map((st, i) => {
      const fallbackHall = st.hallNo || hallsList[0]?.hallNo || 'TBA';
      const fallbackSeat = st.seatNo || `SEAT-${i + 1 < 10 ? '0' + (i + 1) : i + 1}`;
      // Use strictly the subjects explicitly selected/assigned to this student
      const rawSubs = (st.subjects && st.subjects.length > 0)
        ? st.subjects
        : (selectedAllocationSubject !== 'All' 
            ? cleanCommonSubjects.filter(s => s.code.toUpperCase() === selectedAllocationSubject.toUpperCase())
            : []);

      const cleanSubs = rawSubs.map(sub => {
        const matched = cleanCommonSubjects.find(s => s.code.toUpperCase() === sub.code.toUpperCase());
        const finalDate = (sub.date && sub.date.trim()) || (matched?.date && matched.date.trim()) || '2026-04-20';
        return {
          code: sub.code.toUpperCase(),
          name: sub.name || matched?.name || sub.code,
          date: finalDate,
          session: sub.session || matched?.session || 'Forenoon (FN)',
          time: sub.time || matched?.time || '09:30 AM - 12:30 PM'
        };
      });

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
  const handleDeleteAllocation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hall allocation? This will remove all associated hall tickets.')) return;
    try {
      const res = await fetch(`${API_BASE}/hall-tickets/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Allocation deleted successfully.' });
        loadAllocations();
      }
    } catch (err) {
      console.error('Failed to delete allocation:', err);
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

    const examTitle = examData?.examName || 'SEMESTER END EXAMINATIONS';
    const academicYear = examData?.academicYear || '2025-2026';
    const examType = examData?.examType || 'Regular Examination';
    const instructions = (examData?.instructions && examData.instructions.length > 0)
      ? examData.instructions
      : (instructionsList && instructionsList.length > 0 ? instructionsList : DEFAULT_INSTRUCTIONS);

    const ticketsHtml = studentsList.map((st, index) => {
      const subjects = (st.subjects && st.subjects.length > 0) ? st.subjects : (examData?.commonSubjects || subjectsSchedule);
      
      const rows = subjects.map((sub, sIdx) => `
        <tr>
          <td style="text-align: center; font-weight: 600;">${sIdx + 1}</td>
          <td style="font-weight: 700; color: #1e293b;">${sub.code}</td>
          <td>${sub.name}</td>
          <td style="text-align: center; font-weight: 600;">${sub.date || 'TBA'}</td>
          <td style="text-align: center;">${sub.session || 'FN'}<br/><span style="font-size: 10px; color: #64748b;">${sub.time || '09:30 AM'}</span></td>
          <td style="text-align: center; height: 38px;"></td>
          <td style="text-align: center; height: 38px;"></td>
        </tr>
      `).join('');

      return `
        <div class="hall-ticket-page ${index < studentsList.length - 1 ? 'page-break' : ''}">
          <!-- College Header -->
          <div class="header-table">
            <div class="logo-box">
              <div class="logo-circle">🏛️</div>
            </div>
            <div class="header-text">
              <div class="college-title">VIVEKANANDA COLLEGE OF ARTS AND SCIENCES</div>
              <div class="college-loc">Tiruchengode, Namakkal District, Tamil Nadu - 637 205</div>
              <div class="admit-badge">EXAMINATION HALL TICKET</div>
            </div>
            <div class="photo-box">
              <div class="photo-placeholder">
                <span>AFFIX RECENT<br/>PASSPORT SIZE<br/>PHOTOGRAPH</span>
              </div>
            </div>
          </div>

          <!-- Exam Header Banner -->
          <div class="exam-banner">
            <div><strong>EXAMINATION:</strong> ${examTitle.toUpperCase()}</div>
            <div><strong>ACADEMIC YEAR:</strong> ${academicYear} &nbsp;|&nbsp; <strong>SESSION:</strong> ${examType.toUpperCase()}</div>
          </div>

          <!-- Candidate & Seat Allocation Info -->
          <table class="info-table">
            <tr>
              <td class="info-label">Register / Roll No:</td>
              <td class="info-val font-bold highlight">${st.rollNo}</td>
              <td class="info-label">Student Name:</td>
              <td class="info-val font-bold">${st.name.toUpperCase()}</td>
            </tr>
            <tr>
              <td class="info-label">Degree & Branch:</td>
              <td class="info-val">${st.dept || examData?.department || 'Computer Science'}</td>
              <td class="info-label">Semester / Section:</td>
              <td class="info-val">Semester ${st.semester || examData?.semester || 'VI'} - Sec ${st.section || 'A'}</td>
            </tr>
            <tr>
              <td class="info-label">Allocated Hall / Room:</td>
              <td class="info-val font-bold highlight">${st.hallNo || 'Room TBA'}</td>
              <td class="info-label">Allocated Seat No:</td>
              <td class="info-val font-bold highlight" style="font-size: 14px; color: #1e3a8a;">${st.seatNo || 'TBA'}</td>
            </tr>
          </table>

          <!-- Subjects Timetable to be Written -->
          <div class="section-title">SCHEDULE OF COURSES / SUBJECTS TO APPEAR</div>
          <table class="subjects-table">
            <thead>
              <tr>
                <th style="width: 5%;">S.No</th>
                <th style="width: 14%;">Course Code</th>
                <th style="width: 35%;">Course / Subject Title</th>
                <th style="width: 13%;">Exam Date</th>
                <th style="width: 15%;">Session & Time</th>
                <th style="width: 9%;">Student Sign</th>
                <th style="width: 9%;">Invigilator Sign</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <!-- Rules and Instructions -->
          <div class="rules-box">
            <div class="rules-title">IMPORTANT INSTRUCTIONS TO THE CANDIDATE:</div>
            <ol class="rules-list">
              ${instructions.map(rule => `<li>${rule}</li>`).join('')}
            </ol>
          </div>

          <!-- Official Signatures -->
          <div class="signatures-row">
            <div class="sign-block">
              <div class="sign-line"></div>
              <div class="sign-label">Signature of Candidate</div>
              <div class="sign-sub">(To be signed before exam)</div>
            </div>
            <div class="sign-block">
              <div class="stamp-seal">OFFICIAL<br/>SEAL</div>
              <div class="sign-label">College Examination Cell</div>
            </div>
            <div class="sign-block">
              <div style="height: 28px;"></div>
              <div class="sign-line"></div>
              <div class="sign-label">Controller of Examinations (COE)</div>
              <div class="sign-sub">Vivekananda College</div>
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
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
          body { background: #525659; padding: 20px; }
          .hall-ticket-page {
            width: 210mm;
            min-height: 297mm;
            padding: 14mm 14mm 12mm 14mm;
            margin: 0 auto 20px auto;
            background: #ffffff;
            border: 2px solid #0f1e3c;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            position: relative;
          }
          @media print {
            body { background: white; padding: 0; }
            .no-print { display: none !important; }
            .hall-ticket-page {
              width: 100%;
              min-height: 100vh;
              margin: 0;
              padding: 10mm 12mm;
              border: 2px solid #0f1e3c;
              box-shadow: none;
            }
            .page-break {
              page-break-after: always;
              break-after: page;
            }
          }

          .header-table {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0f1e3c;
            padding-bottom: 8px;
            margin-bottom: 8px;
            gap: 10px;
          }
          .logo-box { width: 65px; text-align: center; }
          .logo-circle { width: 55px; height: 55px; font-size: 32px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border-radius: 50%; border: 1.5px solid #0f1e3c; }
          .header-text { flex: 1; text-align: center; }
          .college-title { font-size: 15px; font-weight: 900; color: #0f1e3c; letter-spacing: 0.5px; }
          .college-sub { font-size: 9.5px; font-weight: 600; color: #475569; margin-top: 1px; }
          .college-loc { font-size: 9px; color: #64748b; }
          .admit-badge {
            display: inline-block;
            background: #0f1e3c;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            padding: 3px 14px;
            border-radius: 4px;
            margin-top: 5px;
            letter-spacing: 1px;
          }
          .photo-box { width: 85px; height: 105px; text-align: center; }
          .photo-placeholder {
            width: 100%;
            height: 100%;
            border: 1px dashed #64748b;
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            color: #64748b;
            font-weight: 600;
            line-height: 1.3;
          }

          .exam-banner {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 5px 10px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #1e293b;
            margin-bottom: 8px;
          }

          .info-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-bottom: 10px;
            border: 1px solid #cbd5e1;
          }
          .info-table td {
            padding: 5px 8px;
            border: 1px solid #e2e8f0;
          }
          .info-label {
            background: #f1f5f9;
            font-weight: 700;
            color: #334155;
            width: 18%;
          }
          .info-val {
            color: #0f172a;
            width: 32%;
          }
          .font-bold { font-weight: 700; }
          .highlight { color: #1e3a8a; }

          .section-title {
            font-size: 10.5px;
            font-weight: 800;
            color: #0f1e3c;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            border-left: 3px solid #2563eb;
            padding-left: 6px;
          }

          .subjects-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            margin-bottom: 10px;
            border: 1px solid #94a3b8;
          }
          .subjects-table th {
            background: #e2e8f0;
            color: #0f1e3c;
            font-weight: 800;
            padding: 5px;
            border: 1px solid #94a3b8;
            text-align: center;
          }
          .subjects-table td {
            padding: 5px 6px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
          }

          .rules-box {
            background: #fafaf9;
            border: 1px solid #e7e5e4;
            padding: 6px 10px;
            margin-bottom: 15px;
            border-radius: 4px;
          }
          .rules-title { font-size: 9px; font-weight: 800; color: #44403c; margin-bottom: 3px; }
          .rules-list { font-size: 8.5px; color: #57534e; padding-left: 14px; line-height: 1.4; }

          .signatures-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 15px;
            padding: 0 10px;
          }
          .sign-block {
            text-align: center;
            width: 28%;
          }
          .sign-line {
            height: 1px;
            background: #0f1e3c;
            margin-bottom: 4px;
          }
          .sign-label { font-size: 10px; font-weight: 800; color: #0f1e3c; }
          .sign-sub { font-size: 8.5px; color: #64748b; }
          .stamp-seal {
            width: 50px;
            height: 50px;
            border: 1.5px dashed #94a3b8;
            border-radius: 50%;
            margin: 0 auto 4px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 7.5px;
            color: #94a3b8;
            font-weight: 700;
          }
          .coe-signature {
            font-family: 'Brush Script MT', cursive, sans-serif;
            font-size: 15px;
            color: #1e3a8a;
            margin-bottom: 2px;
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
              <h1 className="text-xl font-extrabold text-slate-900 leading-tight">Hall Ticket & Exam Allocation</h1>
              <p className="text-xs text-slate-500 font-medium">Allocate exam halls, manage seat matrix, and generate official student hall tickets</p>
            </div>
          </div>

          {/* Action Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tickets'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Ticket className="w-4 h-4" />
              Hall Tickets & Print
            </button>
            <button
              onClick={() => setActiveTab('allocate')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'allocate'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Hall Allocation Setup
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className={`mt-3 p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
            statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {statusMessage.text}
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

                    {/* Semester Dropdown (Selectable: Sem 1 to 8 all available) */}
                    <div className="lg:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Semester
                      </label>
                      <select
                        value={planFilterSem}
                        onChange={(e) => handleDeptOrSemChange(planFilterDept, Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {availableSemesters.map(s => (
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
                    <option value="Semester End Examination">Semester End Examination</option>
                    <option value="Internal Assessment">Internal Assessment (CIA / Model)</option>
                    <option value="Model Examination">Model Examination</option>
                    <option value="Special Supplementary">Special Supplementary</option>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <input
                    type="text"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    placeholder="Code (e.g. CS2001)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 uppercase"
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="Subject Name (e.g. Cloud Computing)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    value={newSubDate}
                    onChange={(e) => setNewSubDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <select
                    value={newSubSession}
                    onChange={(e) => setNewSubSession(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-800"
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
                    placeholder="Time (e.g. 10:00 AM - 01:00 PM)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <button
                    onClick={handleAddSubject}
                    className="w-full h-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1"
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
                                  value={editSubForm.session}
                                  onChange={(e) => setEditSubForm(prev => ({ ...prev, session: e.target.value }))}
                                  className="w-full bg-white border border-blue-300 rounded px-1.5 py-1 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="Forenoon (FN)">Forenoon (FN)</option>
                                  <option value="Afternoon (AN)">Afternoon (AN)</option>
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={editSubForm.time}
                                  onChange={(e) => setEditSubForm(prev => ({ ...prev, time: e.target.value }))}
                                  placeholder="Time (e.g. 10:00 AM - 01:00 PM)"
                                  className="w-full bg-white border border-blue-300 rounded px-2 py-1 text-xs font-medium text-slate-700 focus:ring-1 focus:ring-blue-500"
                                />
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
                              <td className="px-4 py-2 text-slate-500">{sub.time}</td>
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
                        if (subCode) {
                          loadEligibleStudents(formDept, formSemester, formSection, subCode);
                        } else {
                          setStudentsToAllocate([]);
                        }
                      }}
                      className="bg-white border-2 border-blue-500 rounded-xl px-4 py-2 text-xs font-black text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm min-w-[280px]"
                    >
                      <option value="">-- Please Select Subject to Allocate --</option>
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
                    {hallsList.length > 0 && displayedStudents.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-600">Quick Assign Hall:</span>
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
                            <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                              {subjectsSchedule.map(sub => {
                                const isEnrolled = (st.subjects || []).some(s => s.code.toUpperCase() === sub.code.toUpperCase());
                                return (
                                  <button
                                    key={sub.code}
                                    type="button"
                                    onClick={() => toggleStudentSubject(st.rollNo, sub)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all flex items-center gap-1 ${
                                      isEnrolled
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
                              {(!st.subjects || st.subjects.length === 0) && (
                                <span className="text-[10px] text-amber-600 font-semibold italic">No subject selected</span>
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
                            {st.hallNo && st.seatNo && st.subjects?.length > 0 ? (
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
            <div className="p-6 overflow-y-auto space-y-4 bg-slate-50 text-slate-800 text-xs">
              <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm space-y-4">
                {/* College Header */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-800">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-2xl">🏛️</div>
                  <div className="text-center flex-1">
                    <p className="font-extrabold text-sm text-slate-900 tracking-wide">VIVEKANANDA COLLEGE OF ARTS AND SCIENCES</p>
                    <span className="inline-block mt-1 px-3 py-0.5 bg-slate-900 text-white rounded text-[10px] font-bold">
                      EXAMINATION HALL TICKET
                    </span>
                  </div>
                  <div className="w-16 h-20 border border-dashed border-slate-400 bg-slate-50 flex items-center justify-center text-center text-[8px] text-slate-400 font-semibold p-1">
                    AFFIX PHOTO
                  </div>
                </div>

                {/* Candidate Info Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-500">Register / Roll No:</span>
                    <span className="ml-2 font-bold text-blue-700">{previewStudent.rollNo}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Student Name:</span>
                    <span className="ml-2 font-bold text-slate-900">{previewStudent.name}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Department:</span>
                    <span className="ml-2 text-slate-800">{previewStudent.dept || previewExam?.department}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Semester:</span>
                    <span className="ml-2 text-slate-800">Semester {previewStudent.semester || previewExam?.semester}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Allocated Hall / Room:</span>
                    <span className="ml-2 font-extrabold text-indigo-700">{previewStudent.hallNo || 'TBA'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Seat / Desk No:</span>
                    <span className="ml-2 font-mono font-bold text-indigo-700">{previewStudent.seatNo || 'TBA'}</span>
                  </div>
                </div>

                {/* Subjects Table */}
                <div>
                  <p className="font-extrabold text-[11px] text-slate-700 uppercase tracking-wide mb-1.5">Subjects to Appear:</p>
                  <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="border border-slate-300 px-2 py-1.5">S.No</th>
                        <th className="border border-slate-300 px-2 py-1.5">Code</th>
                        <th className="border border-slate-300 px-2 py-1.5">Subject Title</th>
                        <th className="border border-slate-300 px-2 py-1.5">Date</th>
                        <th className="border border-slate-300 px-2 py-1.5">Session</th>
                        <th className="border border-slate-300 px-2 py-1.5 text-center">Invigilator Sign</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((previewStudent.subjects?.length > 0 ? previewStudent.subjects : previewExam?.commonSubjects) || subjectsSchedule).map((sub, idx) => (
                        <tr key={sub.code}>
                          <td className="border border-slate-300 px-2 py-1 text-center font-semibold">{idx + 1}</td>
                          <td className="border border-slate-300 px-2 py-1 font-bold text-blue-700">{sub.code}</td>
                          <td className="border border-slate-300 px-2 py-1 font-medium">{sub.name}</td>
                          <td className="border border-slate-300 px-2 py-1">{sub.date || 'TBA'}</td>
                          <td className="border border-slate-300 px-2 py-1">{sub.session || 'FN'}</td>
                          <td className="border border-slate-300 px-2 py-1 text-center h-8"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Instructions */}
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[10px] text-slate-500 leading-relaxed">
                  <p className="font-bold text-slate-700 uppercase">Instructions:</p>
                  <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                    {(previewExam?.instructions?.length > 0 ? previewExam.instructions : instructionsList).slice(0, 4).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                {/* Signatures */}
                <div className="pt-6 flex items-center justify-between text-center text-[10px]">
                  <div>
                    <div className="w-28 border-b border-slate-800 mb-1"></div>
                    <p className="font-bold text-slate-800">Student Signature</p>
                  </div>
                  <div>
                    <div className="w-16 h-16 rounded-full border border-dashed border-slate-400 mx-auto flex items-center justify-center text-[8px] text-slate-400">SEAL</div>
                  </div>
                  <div>
                    <div className="h-5"></div>
                    <div className="w-36 border-b border-slate-800 mb-1"></div>
                    <p className="font-bold text-slate-800">Controller of Examinations</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
