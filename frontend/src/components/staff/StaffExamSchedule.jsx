import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE, BACKEND_URL, getKnownDepartments } from '../../apiConfig';
import {
  Calendar,
  Clock,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Plus,
  Trash2,
  Edit2,
  Save,
  RefreshCw,
  Printer,
  Check,
  ShieldCheck,
  IndianRupee,
  Layers,
  Sparkles,
  Ticket,
  ChevronRight,
  Filter,
  UserCheck,
  X,
  Sliders,
  DollarSign,
  BookOpen
} from 'lucide-react';
import ModalPortal from '../ModalPortal';

// API_BASE imported from apiConfig

const DEFAULT_DEPTS = getKnownDepartments();

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

export default function StaffExamSchedule({ staffUser, onNavigate }) {
  // Main Tab Navigation: 'seating' (Hall Allocation & Seating Setup) | 'eligibility' (No Due & Attendance)
  const [activeTab, setActiveTab] = useState('seating');

  // Real database departments
  const [availableDepts, setAvailableDepts] = useState(() => getKnownDepartments());

  // Common Selection Filters
  const [selectedDept, setSelectedDept] = useState(staffUser?.department || '');
  const [selectedSem, setSelectedSem] = useState(1);
  const [examTypeFilter, setExamTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch real departments on mount
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        let depts = [];
        try {
          const deptRes = await fetch(`${API_BASE}/departments`);
          const deptData = await deptRes.json();
          if (deptData.success && Array.isArray(deptData.data)) {
            const list = deptData.data.map(d => d.name?.trim()).filter(Boolean);
            depts.push(...list);
          }
        } catch (_) {}

        try {
          const metaRes = await fetch(`${API_BASE}/hall-tickets/meta`);
          const metaData = await metaRes.json();
          if (metaData.success && metaData.departments?.length > 0) {
            depts.push(...metaData.departments);
          }
        } catch (_) {}

        const uniqueDepts = Array.from(new Set(depts.filter(Boolean)));
        const finalDepts = uniqueDepts.length > 0 ? uniqueDepts : DEFAULT_DEPTS;
        setAvailableDepts(finalDepts);

        if (!selectedDept || !finalDepts.includes(selectedDept)) {
          const match = finalDepts.find(d => staffUser?.department && d.toLowerCase().includes(staffUser.department.toLowerCase()));
          setSelectedDept(match || finalDepts[0]);
        }
      } catch (err) {
        setAvailableDepts(DEFAULT_DEPTS);
      }
    };
    fetchDepts();
  }, [staffUser?.department]);

  // 2. Exam Eligibility State (Editable Rules & Overrides)
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [minAttendancePercent, setMinAttendancePercent] = useState(75); // Editable threshold %
  const [requireNoDue, setRequireNoDue] = useState(true); // Default to true: fees clearance required unless exempted
  const [studentEligibilityOverrides, setStudentEligibilityOverrides] = useState({}); // rollNo -> { eligible: bool, remarks: str }
  const [editingRemarkRoll, setEditingRemarkRoll] = useState(null);
  const [tempRemarkText, setTempRemarkText] = useState('');

  // 3. Hall Seating State (Editable Halls & Capacity - Custom added by Staff)
  const [halls, setHalls] = useState(() => {
    try {
      const saved = localStorage.getItem('vcas_custom_exam_halls');
      if (saved) {
        const parsed = JSON.parse(saved);
        const isDefaultDemo = Array.isArray(parsed) && parsed.length === 4 && parsed.some(h => h.id === 'h1' || h.hallName?.includes('Exam Hall 101'));
        if (isDefaultDemo) {
          localStorage.removeItem('vcas_custom_exam_halls');
          return [];
        }
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (_) { }
    return [];
  });
  const [newHallName, setNewHallName] = useState('');
  const [newHallCapacity, setNewHallCapacity] = useState(30);

  useEffect(() => {
    try {
      localStorage.setItem('vcas_custom_exam_halls', JSON.stringify(halls));
    } catch (_) { }
  }, [halls]);

  // Load existing exam halls from backend database
  useEffect(() => {
    const fetchHallsFromBackend = async () => {
      try {
        const res = await fetch(`${API_BASE}/exams/halls`);
        const data = await res.json();
        if (data.success && Array.isArray(data.halls)) {
          setHalls(prev => {
            const hallMap = new Map();
            prev.forEach(h => {
              if (h.hallName) hallMap.set(h.hallName.trim().toLowerCase(), h);
            });
            data.halls.forEach(dh => {
              const k = (dh.hallName || '').trim().toLowerCase();
              if (k) {
                if (!hallMap.has(k)) {
                  hallMap.set(k, {
                    id: dh._id || dh.id || `h-${Date.now()}-${Math.random()}`,
                    _id: dh._id,
                    hallName: dh.hallName,
                    capacity: dh.capacity || 30,
                    active: true
                  });
                } else {
                  const existing = hallMap.get(k);
                  existing._id = dh._id;
                  if (dh.capacity) existing.capacity = dh.capacity;
                }
              }
            });
            return Array.from(hallMap.values());
          });
        }
      } catch (e) {
        console.warn('Failed to fetch halls:', e);
      }
    };
    fetchHallsFromBackend();
  }, []);
  const [seatingAllocations, setSeatingAllocations] = useState({}); // rollNo -> { hallNo: str, seatNo: str }
  const [isAllocatingSeating, setIsAllocatingSeating] = useState(false);
  const [savingSeating, setSavingSeating] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // 4. Examination Subjects, Dates & Timings State
  const [examSubjects, setExamSubjects] = useState([]);
  const [availableCatalogSubjects, setAvailableCatalogSubjects] = useState([]);
  const [newSubCode, setNewSubCode] = useState('');
  const [customSubCode, setCustomSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubDate, setNewSubDate] = useState('');
  const [newSubSession, setNewSubSession] = useState('Forenoon (FN)');
  const [newSubTime, setNewSubTime] = useState('09:30 AM - 12:30 PM');

  const handleAddExamSubject = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const effectiveCode = (newSubCode === 'CUSTOM' ? customSubCode : newSubCode).trim().toUpperCase();
    if (!effectiveCode || !newSubName.trim()) {
      alert('Please select or enter both Subject Code and Subject Name.');
      return;
    }
    const cleanCode = effectiveCode;
    const cleanName = newSubName.trim();
    const cleanDate = newSubDate || new Date().toISOString().split('T')[0];
    const cleanSession = newSubSession || 'Forenoon (FN)';
    const cleanTime = newSubTime.trim() || '09:30 AM - 12:30 PM';

    saveCustomTiming(cleanCode, {
      code: cleanCode,
      name: cleanName,
      date: cleanDate,
      session: cleanSession,
      time: cleanTime
    });

    setExamSubjects(prev => {
      const idx = prev.findIndex(s => s.code.toUpperCase() === cleanCode);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { code: cleanCode, name: cleanName, date: cleanDate, session: cleanSession, time: cleanTime };
        return copy;
      }
      return [...prev, { code: cleanCode, name: cleanName, date: cleanDate, session: cleanSession, time: cleanTime }];
    });

    fetch(`${API_BASE}/hall-tickets/update-subject-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: cleanCode,
        name: cleanName,
        date: cleanDate,
        session: cleanSession,
        time: cleanTime,
        department: selectedDept,
        semester: Number(selectedSem) || 1
      })
    }).catch(e => console.warn('Could not sync added subject:', e));
    setNewSubCode('');
    setCustomSubCode('');
    setNewSubName('');
    setNewSubDate('');
  };

  const handleRemoveExamSubject = (code) => {
    setExamSubjects(prev => prev.filter(s => s.code.toUpperCase() !== code.toUpperCase()));
  };

  // Fetch Students & Calculate Attendance / Fee Status
  const fetchStudentsForEligibility = async () => {
    setLoadingStudents(true);
    try {
      const res = await fetch(`${API_BASE}/hall-tickets/eligible-students?department=${encodeURIComponent(selectedDept)}&semester=${selectedSem}`);
      const data = await res.json();
      let studentList = (data.success && Array.isArray(data.students)) ? data.students : [];

      if (studentList.length === 0) {
        try {
          const sRes = await fetch(`${API_BASE}/students`);
          const sData = await sRes.json();
          if (sData.success && Array.isArray(sData.data)) {
            studentList = sData.data.map(st => ({
              rollNo: st.rollNo || st.regNo || '',
              regNo: st.regNo || st.rollNo || '',
              name: st.name || st.fullName || 'Student',
              dept: st.department || selectedDept,
              semester: st.sem ? parseInt(st.sem) || selectedSem : selectedSem,
              section: st.section || 'A',
              feeStatus: st.feeStatus || 'Pending',
              attendance: st.attendance !== undefined ? st.attendance : 85,
              subjects: []
            }));
          }
        } catch (_) {}
      }

      setStudents(studentList);

      if (data.success && Array.isArray(data.subjects)) {
        setAvailableCatalogSubjects(data.subjects);
      }
    } catch (err) {
      console.error('Failed to load students for eligibility:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStudentsForEligibility();
  }, [selectedDept, selectedSem]);

  // Load any existing seating allocation from database
  useEffect(() => {
    const fetchExistingAllocation = async () => {
      try {
        const res = await fetch(`${API_BASE}/hall-tickets?department=${encodeURIComponent(selectedDept)}&semester=${selectedSem}`);
        const data = await res.json();
        if (data.success && data.data?.length > 0) {
          const alloc = data.data[0];
          const newMap = {};
          (alloc.students || []).forEach(st => {
            const roll = (st.rollNo || '').toUpperCase();
            if (roll && st.hallNo) {
              newMap[roll] = { hallNo: st.hallNo, seatNo: st.seatNo || '' };
            }
          });
          if (Object.keys(newMap).length > 0) {
            setSeatingAllocations(prev => ({ ...prev, ...newMap }));
          }
          if (Array.isArray(alloc.commonSubjects) && alloc.commonSubjects.length > 0) {
            const cachedTimings = getSavedCustomTimings();
            const enriched = alloc.commonSubjects.map(s => {
              const custom = cachedTimings[s.code.toUpperCase()];
              return {
                ...s,
                date: custom?.date || s.date,
                session: custom?.session || s.session,
                time: (custom?.time !== undefined && custom?.time !== null) ? custom.time : s.time
              };
            });
            setExamSubjects(enriched);
          }
          if (Array.isArray(alloc.halls) && alloc.halls.length > 0) {
            setHalls(prev => {
              const merged = [...prev];
              alloc.halls.forEach(ah => {
                const existing = merged.find(m => m.hallName.toLowerCase() === ah.hallNo.toLowerCase() || m.hallName.toLowerCase().includes(ah.hallNo.toLowerCase()));
                if (existing) {
                  existing.capacity = Number(ah.capacity) || existing.capacity;
                } else if (ah.hallNo) {
                  merged.push({ id: `h-${Date.now()}-${Math.random()}`, hallName: ah.hallNo, capacity: Number(ah.capacity) || 30, active: true });
                }
              });
              return merged;
            });
          }
        }
      } catch (err) {
        console.error('Failed to load existing allocation:', err);
      }
    };
    fetchExistingAllocation();
  }, [selectedDept, selectedSem]);



  // Eligibility Evaluation Logic
  const evaluatedStudents = useMemo(() => {
    return students.map(st => {
      const roll = (st.rollNo || '').toUpperCase();
      const attendance = Number(st.attendance) || 85;
      const feeStatus = (st.feeStatus || 'Paid').trim();
      const hasNoDue = feeStatus.toLowerCase() === 'paid';
      const meetsAttendance = attendance >= minAttendancePercent;

      // Base calculated eligibility
      const baseEligible = (!requireNoDue || hasNoDue) && meetsAttendance;

      // Check if faculty has manually overridden this student
      const override = studentEligibilityOverrides[roll];
      const isEligible = override !== undefined && override.eligible !== undefined ? override.eligible : baseEligible;

      let reason = 'Cleared All Criteria';
      if (!isEligible) {
        const issues = [];
        if (requireNoDue && !hasNoDue) issues.push(`Fee Due (${feeStatus})`);
        if (!meetsAttendance) issues.push(`Attendance ${attendance}% (<${minAttendancePercent}%)`);
        reason = issues.length > 0 ? issues.join(' & ') : 'Manually Ineligible';
      } else if (override && override.eligible && !baseEligible) {
        reason = 'Special Exemption (Overridden)';
      }

      const remarks = override?.remarks !== undefined ? override.remarks : (isEligible ? 'Eligible for Examination' : reason);

      const assignedSeating = seatingAllocations[roll] || { hallNo: 'Unassigned', seatNo: '—' };

      return {
        ...st,
        roll,
        attendance,
        feeStatus,
        hasNoDue,
        meetsAttendance,
        isEligible,
        reason,
        remarks,
        assignedHall: assignedSeating.hallNo,
        assignedSeat: assignedSeating.seatNo
      };
    });
  }, [students, minAttendancePercent, requireNoDue, studentEligibilityOverrides, seatingAllocations]);

  // Filtered Students for Display
  const filteredStudents = useMemo(() => {
    return evaluatedStudents.filter(st => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        st.name?.toLowerCase().includes(q) ||
        st.roll?.toLowerCase().includes(q) ||
        st.regNo?.toLowerCase().includes(q) ||
        st.assignedHall?.toLowerCase().includes(q)
      );
    });
  }, [evaluatedStudents, searchQuery]);

  // Seating Capacity Metrics
  const totalHallCapacity = useMemo(() => {
    return halls.reduce((sum, h) => sum + (Number(h.capacity) || 0), 0);
  }, [halls]);

  const totalAssignedSeats = useMemo(() => {
    return evaluatedStudents.filter(s => seatingAllocations[s.roll]?.hallNo && seatingAllocations[s.roll].hallNo !== 'Unassigned').length;
  }, [evaluatedStudents, seatingAllocations]);

  const eligibleStudentsCount = useMemo(() => {
    return evaluatedStudents.filter(s => s.isEligible).length;
  }, [evaluatedStudents]);

  const availableVacantSeats = Math.max(0, totalHallCapacity - totalAssignedSeats);

  // Toggle Single Student Eligibility Override
  const toggleStudentEligibility = (roll) => {
    const current = evaluatedStudents.find(s => s.roll === roll);
    if (!current) return;
    const newStatus = !current.isEligible;
    setStudentEligibilityOverrides(prev => ({
      ...prev,
      [roll]: {
        eligible: newStatus,
        remarks: newStatus ? 'Special Faculty Approval' : 'Barred from Examination'
      }
    }));
  };

  // Save Remarks
  const handleSaveRemark = (roll) => {
    setStudentEligibilityOverrides(prev => ({
      ...prev,
      [roll]: {
        ...(prev[roll] || {}),
        remarks: tempRemarkText
      }
    }));
    setEditingRemarkRoll(null);
  };

  // 3. Hall Seating: Capacity Edit & Auto-Allocation
  const handleUpdateHallCapacity = async (hallId, newCap) => {
    const val = Math.max(1, Number(newCap) || 1);
    setHalls(prev => prev.map(h => (h.id === hallId || h._id === hallId) ? { ...h, capacity: val } : h));
    const target = halls.find(h => h.id === hallId || h._id === hallId);
    if (target?._id) {
      try {
        await fetch(`${API_BASE}/exams/halls/${target._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ capacity: val })
        });
      } catch (_) {}
    }
  };

  const handleUpdateHallName = async (hallId, newName) => {
    setHalls(prev => prev.map(h => (h.id === hallId || h._id === hallId) ? { ...h, hallName: newName } : h));
    const target = halls.find(h => h.id === hallId || h._id === hallId);
    if (target?._id) {
      try {
        await fetch(`${API_BASE}/exams/halls/${target._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hallName: newName })
        });
      } catch (_) {}
    }
  };

  const handleAddHall = async (e) => {
    e.preventDefault();
    if (!newHallName.trim()) return;
    const cleanName = newHallName.trim();
    const cleanCap = Number(newHallCapacity) || 30;
    const tempId = `hall-${Date.now()}`;

    setHalls(prev => [
      ...prev,
      {
        id: tempId,
        hallName: cleanName,
        capacity: cleanCap,
        active: true
      }
    ]);
    setNewHallName('');
    setNewHallCapacity(30);

    try {
      const res = await fetch(`${API_BASE}/exams/halls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hallName: cleanName,
          capacity: cleanCap,
          status: 'Available',
          departments: `${selectedDept} (Sem ${selectedSem})`,
          invigilator: staffUser?.name || 'Staff In-Charge'
        })
      });
      const data = await res.json();
      if (data.success && data.hall?._id) {
        setHalls(prev => prev.map(h => h.id === tempId ? { ...h, id: data.hall._id, _id: data.hall._id } : h));
      }
    } catch (err) {
      console.warn('Could not persist hall to server immediately:', err);
    }
  };

  const handleDeleteHall = async (hallId) => {
    const target = halls.find(h => h.id === hallId || h._id === hallId);
    setHalls(prev => prev.filter(h => h.id !== hallId && h._id !== hallId));
    const backendId = target?._id || hallId;
    if (backendId && !String(backendId).startsWith('hall-') && !String(backendId).startsWith('h-')) {
      try {
        await fetch(`${API_BASE}/exams/halls/${backendId}`, { method: 'DELETE' });
      } catch (_) {}
    }
  };

  // Auto-Allocate Seating Algorithm based on Editable Hall Capacities
  const handleAutoAllocateSeating = () => {
    setIsAllocatingSeating(true);
    let eligibleStudents = evaluatedStudents.filter(s => s.isEligible);
    if (eligibleStudents.length === 0) {
      const confirmAllocateAll = window.confirm(
        'No students currently have fee clearance (No Due = Paid). Would you like to allocate seating for all enrolled candidates anyway?'
      );
      if (confirmAllocateAll) {
        eligibleStudents = evaluatedStudents;
      } else {
        setIsAllocatingSeating(false);
        return;
      }
    }

    const activeHalls = halls.filter(h => h.active && h.capacity > 0);
    if (activeHalls.length === 0) {
      alert('Please add at least one examination hall with capacity before auto-allocating seating.');
      setIsAllocatingSeating(false);
      return;
    }

    const newSeating = {};
    let studentIndex = 0;

    activeHalls.forEach(hall => {
      const cap = hall.capacity;
      const hallCode = hall.hallName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'H';
      for (let seat = 1; seat <= cap && studentIndex < eligibleStudents.length; seat++) {
        const st = eligibleStudents[studentIndex];
        const seatNo = `${hallCode}-${String(seat).padStart(2, '0')}`;
        newSeating[st.roll] = {
          hallNo: hall.hallName,
          seatNo
        };
        studentIndex++;
      }
    });

    // Mark remaining ineligible or overflow as Unassigned
    evaluatedStudents.forEach(st => {
      if (!newSeating[st.roll]) {
        newSeating[st.roll] = {
          hallNo: 'Unassigned',
          seatNo: '—'
        };
      }
    });

    setSeatingAllocations(newSeating);
    setIsAllocatingSeating(false);
    setSaveSuccessMsg(`Successfully allocated seating for ${studentIndex} eligible students across ${activeHalls.length} halls.`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Inline edit individual student's assigned hall or seat number
  const handleUpdateStudentSeating = (roll, field, value) => {
    setSeatingAllocations(prev => ({
      ...prev,
      [roll]: {
        ...(prev[roll] || { hallNo: 'Unassigned', seatNo: '—' }),
        [field]: value
      }
    }));
  };

  // Save Seating to Backend Database
  const handleSaveSeatingToDatabase = async () => {
    setSavingSeating(true);
    try {
      const studentsPayload = evaluatedStudents.map(st => {
        const seat = seatingAllocations[st.roll] || { hallNo: 'Unassigned', seatNo: '—' };
        return {
          rollNo: st.roll,
          name: st.name,
          dept: selectedDept,
          semester: Number(selectedSem),
          section: st.section || 'A',
          hallNo: seat.hallNo,
          seatNo: seat.seatNo,
          eligible: st.isEligible,
          remarks: st.remarks,
          subjects: examSubjects
        };
      });

      const payload = {
        examName: `University Examinations - ${selectedDept} (Sem ${selectedSem})`,
        examType: 'Semester End Examination',
        academicYear: '2025-2026',
        department: selectedDept,
        semester: Number(selectedSem),
        section: 'All',
        halls: halls.map(h => ({ hallNo: h.hallName, capacity: h.capacity })),
        allocatedByStaffId: staffUser?.staffId || 'STAFF',
        allocatedByStaffName: staffUser?.name || 'Faculty In-Charge',
        commonSubjects: examSubjects,
        students: studentsPayload
      };

      const res = await fetch(`${API_BASE}/hall-tickets/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Also sync each configured subject into /api/exams so Admin timetable immediately displays the staff-assigned halls & timing
        try {
          const assignedHallNames = halls.map(h => h.hallName).join(', ') || 'Hall 101';
          for (const sub of examSubjects) {
            const subCode = (sub.code || '').trim().toUpperCase();
            if (!subCode) continue;
            await fetch(`${API_BASE}/exams`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: subCode,
                name: sub.name,
                department: selectedDept,
                year: Math.ceil(Number(selectedSem) / 2) || 1,
                sem: `Sem ${selectedSem}`,
                date: sub.date || '2026-05-15',
                session: sub.session || 'Forenoon (FN)',
                hall: assignedHallNames,
                qpCode: `QP-${subCode}-2026`,
                invigilator: staffUser?.name || 'Assigned Faculty',
                type: 'End Semester Theory',
                status: 'Scheduled'
              })
            });
          }
        } catch (syncErr) {
          console.warn('Could not sync exams timetable directly:', syncErr);
        }

        setSaveSuccessMsg('Seating allocations, halls, and exam timings verified & saved to database!');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      } else {
        alert(data.message || 'Failed to save seating allocations.');
      }
    } catch (err) {
      alert('Network error while saving seating allocations.');
    } finally {
      setSavingSeating(false);
    }
  };

  // Print Desk Slips / Seating Chart
  const handlePrintSeatingChart = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) return alert('Please allow popups to print Seating Chart.');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Examination Seating Chart - ${selectedDept} (Sem ${selectedSem})</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; padding: 20px; font-size: 11px; }
          .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 15px; }
          h2 { margin: 0; font-size: 18px; color: #1e3a8a; text-transform: uppercase; }
          p { margin: 4px 0; color: #475569; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px; font-size: 10px; text-transform: uppercase; text-align: left; }
          td { border: 1px solid #cbd5e1; padding: 6px; font-size: 10.5px; }
          .status { font-weight: bold; }
          .eligible { color: #047857; }
          .ineligible { color: #b91c1c; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Vivekanandha College of Arts and Sciences</h2>
          <p>Affiliated with Manonmaniam Sundaranar University • Department of ${selectedDept} • Semester ${selectedSem}</p>
          ${examSubjects && examSubjects.length > 0 ? `
            <div style="margin: 8px 0; font-size: 11px; color: #1e3a8a; font-weight: 600;">
              <strong>Scheduled Examinations:</strong> ${examSubjects.map(s => `${s.code} - ${s.name} (${s.date || 'TBA'} ${s.session || ''} ${s.time || ''})`).join(' | ')}
            </div>
          ` : ''}
          <p style="font-size:10px;color:#64748b;">Eligibility Criteria: Attendance &ge; ${minAttendancePercent}% | No Due (Fees): ${requireNoDue ? 'Required' : 'Waived'}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Roll No / Reg No</th>
              <th>Student Name</th>
              <th>Attendance</th>
              <th>Fee Status</th>
              <th>Eligibility</th>
              <th>Allotted Hall</th>
              <th>Seat No</th>
            </tr>
          </thead>
          <tbody>
            ${evaluatedStudents.map((st, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${st.roll}</strong></td>
                <td>${st.name}</td>
                <td>${st.attendance}%</td>
                <td>${st.feeStatus}</td>
                <td class="status ${st.isEligible ? 'eligible' : 'ineligible'}">${st.isEligible ? 'Eligible' : 'Not Eligible'}</td>
                <td><strong>${st.assignedHall}</strong></td>
                <td><strong>${st.assignedSeat}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top:30px;display:flex;justify-content:space-between;font-weight:bold;">
          <div>Hall Invigilator Signature</div>
          <div>Chief Superintendent</div>
          <div>Controller of Examinations</div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto font-sans animate-fadeIn">

      {/* 1. Header Bar Matching Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hall Allocation Setup
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Configure examination halls, set seating capacities, and allocate eligible students.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrintSeatingChart}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Seating Chart</span>
          </button>
        </div>
      </div>

      {/* 2. Soft Pastel Banner with Quick Filters Matching Admin */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
            🏢
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-blue-950">
              Department &amp; Semester Selection
            </h3>
            <p className="text-[11px] text-blue-800 font-medium mt-0.5">
              Configuring hall allocations &amp; seating capacities for {selectedDept}
            </p>
          </div>
        </div>

        {/* Department & Semester Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
          >
            {availableDepts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={selectedSem}
            onChange={(e) => setSelectedSem(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
          >
            {[1, 2, 3, 4, 5, 6].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 3. Sub-Tab Navigation Pills Matching Admin */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'seating', label: '1. Hall Allocation Setup & Seating Capacities', icon: Building2, count: halls.length },
          { id: 'eligibility', label: '2. Exam Eligibility (No Due & Attendance)', icon: ShieldCheck, count: evaluatedStudents.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 2: EXAM ELIGIBILITY (NO DUE & ATTENDANCE)                 */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'eligibility' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Rules Configuration Bar (Set it editable) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  Exam Eligibility Criteria Settings (Editable Rules)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated checks based on Fee Clearance (No Due) and Attendance rates. Overrideable per student.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                {evaluatedStudents.filter(s => s.isEligible).length} Eligible / {evaluatedStudents.length} Total
              </span>
            </div>

            {/* Editable Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              {/* 1. No Due (Fees) Toggle */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-900 block">No Due (Fees Clearance)</span>
                  <span className="text-[10.5px] text-slate-500">Require zero outstanding fee</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireNoDue}
                    onChange={(e) => setRequireNoDue(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* 2. Minimum Attendance Threshold (Editable Number) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-900 block">Min Attendance Threshold</span>
                  <span className="text-[10.5px] text-slate-500">Eligible threshold %</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={minAttendancePercent}
                    onChange={(e) => setMinAttendancePercent(Number(e.target.value) || 0)}
                    className="w-14 bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-bold text-xs text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="font-extrabold text-slate-600">%</span>
                </div>
              </div>

              {/* 3. Search Filter */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search students by roll, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Eligibility Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-4">Student Roll / Reg</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Attendance Rate</th>
                    <th className="py-3 px-4">Fee Clearance</th>
                    <th className="py-3 px-4 text-center">Eligibility Status</th>
                    <th className="py-3 px-4">Remarks / Condonation</th>
                    <th className="py-3 px-4 text-right">Editable Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((st) => (
                      <tr key={st.roll} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {st.roll}
                          <span className="block text-[10px] text-blue-600 font-sans">{st.regNo}</span>
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-900">{st.name}</td>
                        <td className="py-3 px-4 font-bold">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${st.meetsAttendance ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {st.attendance}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${st.hasNoDue ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                            {st.hasNoDue ? 'No Due Cleared' : `Due: ${st.feeStatus}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${st.isEligible ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                            {st.isEligible ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            {st.isEligible ? 'Eligible' : 'Not Eligible'}
                          </span>
                          <span className="block text-[9.5px] text-slate-400 mt-0.5 truncate max-w-xs mx-auto">
                            {st.reason}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          {editingRemarkRoll === st.roll ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={tempRemarkText}
                                onChange={(e) => setTempRemarkText(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs"
                              />
                              <button
                                onClick={() => handleSaveRemark(st.roll)}
                                className="p-1 bg-emerald-600 text-white rounded-lg cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingRemarkRoll(st.roll);
                                setTempRemarkText(st.remarks);
                              }}
                              className="cursor-pointer hover:text-blue-600 text-slate-600 text-[11px] truncate"
                              title="Click to edit remark"
                            >
                              {st.remarks} ✎
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => toggleStudentEligibility(st.roll)}
                            className={`px-3 py-1 rounded-xl text-[10.5px] font-bold shadow-2xs transition-all cursor-pointer ${st.isEligible
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                          >
                            {st.isEligible ? 'Revoke Permit' : 'Grant Special Exemption'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-slate-400 font-medium">
                        No students found for {selectedDept} (Sem {selectedSem}).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB: HALL SEATING & CAPACITY SETUP                           */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'seating' && (
        <div className="space-y-6 animate-fadeIn">

          {/* 1. Live Seating Capacity & Allocation Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Seating Capacity</p>
                <p className="text-2xl font-black text-blue-700 mt-1">{totalHallCapacity} <span className="text-xs font-bold text-slate-400">Seats</span></p>
                <p className="text-[11px] text-slate-400 font-medium">Across {halls.length} configured hall(s)</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Eligible Students to Seat</p>
                <p className="text-2xl font-black text-indigo-700 mt-1">{eligibleStudentsCount} <span className="text-xs font-bold text-slate-400">Students</span></p>
                <p className="text-[11px] text-slate-400 font-medium">Out of {evaluatedStudents.length} total enrolled</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Seats Assigned</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">{totalAssignedSeats} <span className="text-xs font-bold text-slate-400">Seats</span></p>
                <p className="text-[11px] text-slate-400 font-medium">{totalAssignedSeats} / {totalHallCapacity} seats occupied</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Available Vacant Seats</p>
                <p className={`text-2xl font-black mt-1 ${availableVacantSeats < (eligibleStudentsCount - totalAssignedSeats) ? 'text-amber-600' : 'text-purple-700'}`}>
                  {availableVacantSeats} <span className="text-xs font-bold text-slate-400">Seats</span>
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  {totalHallCapacity >= eligibleStudentsCount ? 'Capacity sufficient for all' : 'More hall capacity needed'}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Hall Capacities & Settings Cards */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Examination Halls &amp; Seating Capacity Setup
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set number of seats per hall anytime. Auto-allocator allocates seats according to these capacities.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoAllocateSeating}
                  disabled={isAllocatingSeating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Allocate Eligible Students</span>
                </button>
                <button
                  onClick={handleSaveSeatingToDatabase}
                  disabled={savingSeating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingSeating ? 'Saving...' : 'Save & Publish Seating'}</span>
                </button>
              </div>
            </div>

            {/* List of Halls with Editable Capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {halls.length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3 p-5 bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center space-y-1.5">
                  <Building2 className="w-7 h-7 text-slate-400" />
                  <p className="text-xs font-bold text-slate-700">No examination halls added yet</p>
                  <p className="text-[11px] text-slate-500">Staff can add the required halls and set capacities using the form on the right.</p>
                </div>
              )}

              {halls.map((hall) => {
                const assignedCount = evaluatedStudents.filter(s => seatingAllocations[s.roll]?.hallNo === hall.hallName).length;
                return (
                  <div key={hall.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 relative group">
                    <div className="flex items-center gap-1.5 justify-between">
                      <div className="flex-1">
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                          Hall Name / Room
                        </label>
                        <input
                          type="text"
                          value={hall.hallName}
                          onChange={(e) => handleUpdateHallName(hall.id, e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteHall(hall.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg cursor-pointer transition-colors mt-4"
                        title="Remove Hall"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Editable Capacity Input */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                        No. of Seating in Hall (Capacity)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={hall.capacity}
                          onChange={(e) => handleUpdateHallCapacity(hall.id, e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-blue-700 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-500 font-bold">Seats</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 text-slate-600">
                      <span>Seats Assigned:</span>
                      <strong className={`font-bold ${assignedCount > hall.capacity ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {assignedCount} / {hall.capacity}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] text-slate-500">
                      <span>Remaining Seats:</span>
                      <span className="font-bold text-blue-700">
                        {Math.max(0, hall.capacity - assignedCount)} Seats
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Add New Hall Card */}
              <form onSubmit={handleAddHall} className="p-4 bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-2xl flex flex-col justify-between space-y-3">
                <span className="text-xs font-extrabold text-blue-900">Add New Exam Hall</span>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Hall Name / Room
                    </label>
                    <input
                      type="text"
                      required
                      value={newHallName}
                      onChange={(e) => setNewHallName(e.target.value)}
                      className="w-full bg-white border border-blue-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      No. of Seating (Capacity)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        required
                        value={newHallCapacity}
                        onChange={(e) => setNewHallCapacity(Number(e.target.value) || 30)}
                        className="w-20 bg-white border border-blue-200 rounded-xl px-2 py-1.5 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                      >
                        + Add Hall
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Examination Subjects, Date & Time Setup Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Examination Subjects, Date &amp; Time Setup
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add the examination subject, date, and timing. These will be automatically set for all students during hall allocation.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                {examSubjects.length} Subject(s) Configured
              </span>
            </div>

            {/* Add Subject Row */}
            <form onSubmit={handleAddExamSubject} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div className={newSubCode === 'CUSTOM' ? 'md:col-span-2' : 'md:col-span-3'}>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Select Subject (Dropdown)</label>
                <select
                  value={newSubCode}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewSubCode(val);
                    if (val && val !== 'CUSTOM') {
                      const match = availableCatalogSubjects.find(s => (s.code || '').toUpperCase() === val.toUpperCase());
                      if (match) {
                        setNewSubName(match.name || '');
                        if (match.date && match.date !== 'TBA') setNewSubDate(match.date);
                        if (match.session) setNewSubSession(match.session);
                        if (match.time) setNewSubTime(match.time);
                      }
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Subject from Catalog --</option>
                  {availableCatalogSubjects.map(cs => (
                    <option key={cs.code} value={cs.code}>
                      {cs.code} - {cs.name}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Type Custom Subject Code</option>
                </select>
              </div>

              {newSubCode === 'CUSTOM' && (
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Custom Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CS2001"
                    value={customSubCode}
                    onChange={(e) => setCustomSubCode(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className={newSubCode === 'CUSTOM' ? 'md:col-span-2' : 'md:col-span-2'}>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cloud Computing"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Exam Date</label>
                <input
                  type="date"
                  value={newSubDate}
                  onChange={(e) => setNewSubDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Session</label>
                <select
                  value={newSubSession?.includes('AN') || newSubSession?.toLowerCase().includes('afternoon') ? 'Afternoon (AN)' : 'Forenoon (FN)'}
                  onChange={(e) => {
                    const sess = e.target.value;
                    setNewSubSession(sess);
                    if (sess.includes('AN')) {
                      setNewSubTime('01:30 PM - 04:30 PM');
                    } else {
                      setNewSubTime('09:30 AM - 12:30 PM');
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Forenoon (FN)">Forenoon (FN)</option>
                  <option value="Afternoon (AN)">Afternoon (AN)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Session Timing</label>
                <input
                  type="text"
                  placeholder="09:30 AM - 12:30 PM"
                  value={newSubTime}
                  onChange={(e) => setNewSubTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-1 flex flex-col justify-end">
                <button
                  type="submit"
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Add
                </button>
              </div>
            </form>

            {/* Configured Subjects Table */}
            {examSubjects.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase">
                    <tr>
                      <th className="px-3.5 py-2">Code</th>
                      <th className="px-3.5 py-2">Subject Name</th>
                      <th className="px-3.5 py-2">Date</th>
                      <th className="px-3.5 py-2">Session</th>
                      <th className="px-3.5 py-2">Time</th>
                      <th className="px-3.5 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {examSubjects.map((s) => (
                      <tr key={s.code} className="hover:bg-slate-50/80">
                        <td className="px-3.5 py-2 font-mono font-bold text-blue-700">{s.code}</td>
                        <td className="px-3.5 py-2 font-bold text-slate-800">{s.name}</td>
                        <td className="px-3.5 py-2 text-slate-700">{s.date}</td>
                        <td className="px-3.5 py-2 text-slate-700">{s.session}</td>
                        <td className="px-3.5 py-2 text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <span>{s.time || '—'}</span>
                            {s.time && (
                              <button
                                type="button"
                                onClick={() => {
                                  saveCustomTiming(s.code, { time: '' });
                                  setExamSubjects(prev => prev.map(sub => sub.code === s.code ? { ...sub, time: '' } : sub));
                                  fetch(`${API_BASE}/hall-tickets/update-subject-schedule`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      code: s.code,
                                      time: '',
                                      department: selectedDept,
                                      semester: Number(selectedSem) || 1
                                    })
                                  }).catch(() => {});
                                }}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                                title="Delete / Clear Exam Time"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-3.5 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveExamSubject(s.code)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded"
                            title="Remove Subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-xs text-slate-400">
                No subjects added yet. Add your examination subjects above to attach them to students.
              </div>
            )}
          </div>

          {/* Student Seating Allocation Table (Editable Hall & Seat No per student) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Allocated Student Seating Matrix
                </h4>
                <p className="text-[11px] text-slate-500">
                  You can edit individual student hall rooms and seat numbers directly in the table below.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
                {evaluatedStudents.filter(s => seatingAllocations[s.roll]?.hallNo && seatingAllocations[s.roll].hallNo !== 'Unassigned').length} Allocated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-4">Exam Subject & Schedule</th>
                    <th className="py-3 px-4 text-center">Eligibility</th>
                    <th className="py-3 px-4">Assigned Hall (Editable)</th>
                    <th className="py-3 px-4">Seat Number (Editable)</th>
                    <th className="py-3 px-4 text-right">Desk Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evaluatedStudents.map((st) => {
                    const currentAlloc = seatingAllocations[st.roll] || { hallNo: 'Unassigned', seatNo: '—' };
                    return (
                      <tr key={st.roll} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{st.roll}</td>
                        <td className="py-3 px-4 font-extrabold text-slate-900">{st.name}</td>
                        <td className="py-3 px-4">
                          {examSubjects && examSubjects.length > 0 ? (
                            <div className="flex flex-col gap-1 max-w-xs">
                              {examSubjects.map(sub => (
                                <span key={sub.code} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-semibold border border-blue-100">
                                  <span className="font-bold font-mono">{sub.code}:</span>
                                  <span>{sub.name}</span>
                                  <span className="text-slate-500 font-mono">({sub.date || 'TBA'} • {sub.time || sub.session})</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[10.5px]">No subjects added yet</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${st.isEligible ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                            {st.isEligible ? 'Eligible' : 'Ineligible'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={currentAlloc.hallNo}
                            onChange={(e) => handleUpdateStudentSeating(st.roll, 'hallNo', e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Unassigned">Unassigned</option>
                            {halls.map(h => (
                              <option key={h.id} value={h.hallName}>{h.hallName}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={currentAlloc.seatNo}
                            onChange={(e) => handleUpdateStudentSeating(st.roll, 'seatNo', e.target.value)}
                            className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {currentAlloc.hallNo !== 'Unassigned' ? 'Ready' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
