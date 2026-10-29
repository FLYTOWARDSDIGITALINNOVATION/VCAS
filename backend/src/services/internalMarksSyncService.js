const Assignment = require("../models/Assignment");
const InternalMarks = require("../models/InternalMarks");
const Class = require("../models/Class");

/**
 * Calculates consolidated marks for a student based on current/given config.
 * Follows the standard VCAS assessment weighting:
 * - CIA 1 & CIA 2 scaled to 10 marks
 * - Model exam scaled to 5 marks
 * - Assignment scaled to 5 marks
 * - Attendance scaled to 5 marks
 * Total maximum = 25 marks (or config.consolidated)
 */
function calculateConsolidatedScore(student, maxConfig = {}) {
  const c1  = student.cia1  === "A" || student.cia1  == null ? 0 : Number(student.cia1);
  const c2  = student.cia2  === "A" || student.cia2  == null ? 0 : Number(student.cia2);
  const mod = student.model === "A" || student.model == null ? 0 : Number(student.model);
  const asg = student.assignment != null ? Number(student.assignment) : 0;
  const att = student.attendance != null ? Number(student.attendance) : 0;

  const c1Max   = Number(maxConfig.cia1) || 50;
  const c2Max   = Number(maxConfig.cia2) || 50;
  const modMax  = Number(maxConfig.model) || 75;
  const asgMax  = Number(maxConfig.assignment) || 20;
  const attMax  = Number(maxConfig.attendance) || 5;
  const consMax = Number(maxConfig.consolidated) || 25;

  const ciaScaled   = ((c1 + c2) / ((c1Max + c2Max) || 100)) * 10;
  const modelScaled = modMax > 0 ? (mod / modMax) * 5 : 0;
  const asgScaled   = asgMax > 0 ? (asg / asgMax) * 5 : 0;
  const attScaled   = attMax > 0 ? (att / attMax) * 5 : 0;

  const total = Math.round(ciaScaled + modelScaled + asgScaled + attScaled);
  return Math.min(consMax, total);
}

/**
 * Syncs assignment marks for a given staff and subject to the InternalMarks model.
 * 
 * If multiple assignments exist for this subject, it calculates the average
 * percentage of marks awarded across all assignments and scales to the configured
 * InternalMarks assignment max marks (default 20).
 * 
 * @param {string} staffId
 * @param {string} subjectCode
 * @returns {Promise<Object|null>} The updated InternalMarks record
 */
async function syncSubjectAssignmentMarksToInternal(staffId, subjectCode) {
  try {
    if (!subjectCode) return null;
    const cleanSub = subjectCode.trim();
    const cleanNoSpaces = cleanSub.replace(/\s+/g, "");
    const subRegex = new RegExp('^(?:' + cleanSub + '|' + cleanNoSpaces + ')$', 'i');
    const nameRegex = new RegExp(cleanSub, 'i');

    // 1. Fetch all assignments for this subject (and staffId if provided)
    const subjectOrCondition = [
      { subjectCode: subRegex },
      { subjectName: nameRegex }
    ];
    let query = { $or: subjectOrCondition };
    if (staffId && staffId !== "undefined" && staffId !== "null") {
      query.staffId = staffId.trim();
    }
    let assignments = await Assignment.find(query);
    if ((!assignments || assignments.length === 0) && query.staffId) {
      // Fallback: search across all staff assignments for this subject
      assignments = await Assignment.find({ $or: subjectOrCondition });
    }
    if (!assignments || assignments.length === 0) {
      return null;
    }

    // Canonical subject code from the assignment
    const canonicalSubjectCode = (assignments[0].subjectCode || cleanSub).toUpperCase();
    const effectiveStaffId = (staffId && staffId !== "undefined" && staffId !== "null") ? staffId.trim() : (assignments[0].staffId || "EMP001");

    // 2. Find or create the InternalMarks document
    const canonicalRegex = new RegExp('^' + canonicalSubjectCode + '$', 'i');
    let markDoc = await InternalMarks.findOne({
      $or: [
        { staffId: effectiveStaffId, subjectCode: canonicalRegex },
        { subjectCode: canonicalRegex },
        { subjectName: nameRegex }
      ]
    });

    if (!markDoc) {
      // Find class details to get metadata if possible
      const classDoc = await Class.findOne({
        $or: [
          { code: canonicalRegex },
          { name: nameRegex }
        ]
      });
      markDoc = new InternalMarks({
        staffId: effectiveStaffId,
        staffName: assignments[0].staffName || (classDoc ? classDoc.staffName : ""),
        subjectCode: canonicalSubjectCode,
        subjectName: assignments[0].subjectName || (classDoc ? classDoc.name : canonicalSubjectCode),
        department: assignments[0].department || (classDoc ? classDoc.dept : ""),
        semester: assignments[0].semester || (classDoc ? classDoc.semester : 1),
        academicYear: assignments[0].academicYear || (classDoc ? classDoc.academicYear : "2025-2026"),
        students: [],
        maxMarks: { cia1: 50, cia2: 50, model: 75, assignment: 20, attendance: 5, grade: 100, consolidated: 25 },
        passMarks: { cia1: 20, cia2: 20, model: 30, assignment: 8, attendance: 2, grade: 40, consolidated: 10 }
      });
    }

    if (!markDoc.maxMarks) {
      markDoc.maxMarks = { cia1: 50, cia2: 50, model: 75, assignment: 20, attendance: 5, grade: 100, consolidated: 25 };
    }
    if (!markDoc.passMarks) {
      markDoc.passMarks = { cia1: 20, cia2: 20, model: 30, assignment: 8, attendance: 2, grade: 40, consolidated: 10 };
    }

    const internalAsgMax = Number(markDoc.maxMarks.assignment) || 20;

    // 3. Aggregate marks for each student from all assignments
    // studentRoll -> { rollNo, name, scores: [{ marksAwarded, totalMarks }] }
    const studentScoresMap = new Map();

    assignments.forEach(asgt => {
      const asgtTotal = Number(asgt.totalMarks) > 0 ? Number(asgt.totalMarks) : 20;
      (asgt.studentSubmissions || []).forEach(sub => {
        if (!sub.rollNo) return;
        const rNo = sub.rollNo.trim().toUpperCase();
        if (!studentScoresMap.has(rNo)) {
          studentScoresMap.set(rNo, {
            rollNo: rNo,
            name: sub.studentName ? sub.studentName.trim() : rNo,
            scores: []
          });
        }
        if (sub.marksAwarded !== null && sub.marksAwarded !== undefined && !isNaN(Number(sub.marksAwarded))) {
          studentScoresMap.get(rNo).scores.push({
            marksAwarded: Number(sub.marksAwarded),
            totalMarks: asgtTotal
          });
        }
      });
    });

    // 4. Compute final assignment mark for each student
    const studentFinalAssignmentMarks = new Map();
    studentScoresMap.forEach((data, rNo) => {
      if (data.scores.length > 0) {
        const avgRawMarks = data.scores.reduce((sum, s) => sum + s.marksAwarded, 0) / data.scores.length;
        const avgPct = data.scores.reduce((sum, s) => sum + (s.marksAwarded / s.totalMarks), 0) / data.scores.length;

        // If the raw marks awarded fit within internal marks max (e.g. 20 <= 20 or 20 <= 25),
        // keep the exact mark entered by the teacher! Otherwise scale proportionally (e.g. 80/100 -> 16/20).
        let finalMark;
        if (avgRawMarks <= internalAsgMax) {
          finalMark = Math.round(avgRawMarks);
        } else {
          finalMark = Math.min(internalAsgMax, Math.round(avgPct * internalAsgMax));
        }

        studentFinalAssignmentMarks.set(rNo, Math.max(0, finalMark));
      }
    });

    // 5. Update existing students in markDoc.students
    if (!Array.isArray(markDoc.students)) {
      markDoc.students = [];
    }

    const existingRolls = new Set();
    markDoc.students.forEach(s => {
      const rNo = s.rollNo.trim().toUpperCase();
      existingRolls.add(rNo);
      if (studentFinalAssignmentMarks.has(rNo)) {
        s.assignment = studentFinalAssignmentMarks.get(rNo);
      }
      // Recalculate consolidated if any components exist
      s.consolidated = calculateConsolidatedScore(s, markDoc.maxMarks);
    });

    // 6. If any students exist in assignments but not in markDoc.students, add them
    studentScoresMap.forEach((data, rNo) => {
      if (!existingRolls.has(rNo)) {
        const asgScore = studentFinalAssignmentMarks.has(rNo) ? studentFinalAssignmentMarks.get(rNo) : null;
        const newStudent = {
          rollNo: rNo,
          name: data.name,
          cia1: null,
          cia2: null,
          model: null,
          assignment: asgScore,
          attendance: null,
          consolidated: null
        };
        if (asgScore !== null) {
          newStudent.consolidated = calculateConsolidatedScore(newStudent, markDoc.maxMarks);
        }
        markDoc.students.push(newStudent);
        existingRolls.add(rNo);
      }
    });

    await markDoc.save();
    return markDoc;
  } catch (err) {
    console.error("Error in syncSubjectAssignmentMarksToInternal:", err);
    return null;
  }
}

module.exports = {
  calculateConsolidatedScore,
  syncSubjectAssignmentMarksToInternal
};
