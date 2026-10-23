const Assignment = require("../models/Assignment");
const Class = require("../models/Class");
const Student = require("../models/Student");
const { syncSubjectAssignmentMarksToInternal } = require("../services/internalMarksSyncService");

// Helper to ensure an assignment has student submissions initialized from its class
const ensureSubmissionsForAssignment = async (assignment) => {
  try {
    if (assignment.studentSubmissions && assignment.studentSubmissions.length > 0) {
      // Update overdue status for pending students if due date has passed
      const isPastDue = assignment.dueDate ? new Date(assignment.dueDate + 'T23:59:59') < new Date() : false;
      let modified = false;
      if (isPastDue) {
        assignment.studentSubmissions.forEach(sub => {
          if (sub.status === 'Pending Submission' || sub.status === 'Not Submitted' || sub.status === 'Pending') {
            sub.status = 'Not Submitted (Overdue)';
            modified = true;
          }
        });
        if (modified) await assignment.save();
      }
      return assignment;
    }

    // Lookup matching class by code
    const classDoc = await Class.findOne({ code: new RegExp('^' + assignment.subjectCode + '$', 'i') });
    if (classDoc && Array.isArray(classDoc.students) && classDoc.students.length > 0) {
      const isPastDue = assignment.dueDate ? new Date(assignment.dueDate + 'T23:59:59') < new Date() : false;
      assignment.studentSubmissions = classDoc.students.map(std => ({
        rollNo: std.rollNo,
        studentName: std.name,
        regNo: std.rollNo,
        department: assignment.department || classDoc.dept || '',
        submittedAt: '--',
        fileName: '--',
        fileSize: '--',
        status: isPastDue ? 'Not Submitted (Overdue)' : 'Pending Submission',
        marksAwarded: null,
        feedback: ''
      }));
      await assignment.save();
    }
  } catch (err) {
    console.warn("Could not ensure submissions for assignment:", err.message);
  }
  return assignment;
};

// GET /api/assignments - list all assignments across all staff (for admin)
const getAllAssignments = async (req, res) => {
  try {
    const { department, status, search, staffId } = req.query;
    const query = {};
    if (staffId) {
      query.staffId = staffId;
    }
    if (department && department !== 'All Departments') {
      query.department = department;
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { subjectCode: regex },
        { subjectName: regex },
        { staffName: regex },
        { staffId: regex }
      ];
    }
    const records = await Assignment.find(query).sort({ createdAt: -1 });
    await Promise.all(records.map(r => ensureSubmissionsForAssignment(r)));
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/assignments/:staffId  - list all assignments for a staff
const listAssignments = async (req, res) => {
  try {
    const { staffId } = req.params;
    const records = await Assignment.find({ staffId }).sort({ createdAt: -1 });
    await Promise.all(records.map(r => ensureSubmissionsForAssignment(r)));
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/assignments or /api/assignments/:staffId  - create a new assignment
const createAssignment = async (req, res) => {
  try {
    const staffId = req.params.staffId || req.body.staffId || "ADMIN";
    const { staffName, subjectCode, subjectName, department, semester, academicYear,
            title, description, dueDate, totalMarks, dueTime, weightage, type, category, projectPhase,
            attachmentName, attachmentData, attachmentSize, attachmentType } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ success: false, message: "title and dueDate are required." });
    }

    const assignment = await Assignment.create({
      staffId,
      staffName: staffName || "Admin / Faculty",
      subjectCode: (subjectCode || "").trim().toUpperCase(),
      subjectName: subjectName || "",
      department: department || "",
      semester: semester ? Number(semester) : 1,
      academicYear: academicYear || "",
      title: title.trim(),
      description: description || "",
      dueDate,
      totalMarks: Number(totalMarks) || 20,
      category: category === "Project" ? "Project" : "Regular",
      projectPhase: projectPhase || "",
      status: "Active",
      submissions: 0,
      attachmentName: attachmentName || "",
      attachmentData: attachmentData || "",
      attachmentSize: attachmentSize || "",
      attachmentType: attachmentType || "",
    });
    res.status(201).json({ success: true, data: assignment, message: "Assignment created." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/assignments/:id/status or /api/assignments/:staffId/:id/status  - toggle Active/Closed
const toggleStatus = async (req, res) => {
  try {
    const { staffId, id } = req.params;
    const targetId = id || staffId;
    const query = { _id: targetId };
    if (staffId && id) query.staffId = staffId;

    const assignment = await Assignment.findOne(query);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });

    assignment.status = assignment.status === "Active" ? "Closed" : "Active";
    await assignment.save();
    res.json({ success: true, data: assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/assignments/:id or /api/assignments/:staffId/:id  - update assignment fields
const updateAssignment = async (req, res) => {
  try {
    const { staffId, id } = req.params;
    const targetId = id || staffId;
    const query = { _id: targetId };
    if (staffId && id) query.staffId = staffId;

    const { subjectCode, subjectName, title, description, dueDate, totalMarks, status, department, semester, academicYear, staffName, category, projectPhase,
            attachmentName, attachmentData, attachmentSize, attachmentType } = req.body;
    const assignment = await Assignment.findOne(query);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });

    if (subjectCode !== undefined) assignment.subjectCode  = subjectCode.trim().toUpperCase();
    if (subjectName !== undefined) assignment.subjectName  = subjectName;
    if (title)                     assignment.title        = title.trim();
    if (description !== undefined) assignment.description  = description;
    if (dueDate)                   assignment.dueDate      = dueDate;
    if (totalMarks)                assignment.totalMarks   = Number(totalMarks);
    if (category)                  assignment.category     = category;
    if (projectPhase !== undefined) assignment.projectPhase = projectPhase;
    if (status)                    assignment.status       = status;
    if (department)                assignment.department   = department;
    if (semester)                  assignment.semester     = Number(semester);
    if (academicYear)              assignment.academicYear = academicYear;
    if (staffName)                 assignment.staffName    = staffName;

    if (attachmentName !== undefined) assignment.attachmentName = attachmentName;
    if (attachmentData !== undefined) assignment.attachmentData = attachmentData;
    if (attachmentSize !== undefined) assignment.attachmentSize = attachmentSize;
    if (attachmentType !== undefined) assignment.attachmentType = attachmentType;

    await assignment.save();
    res.json({ success: true, data: assignment, message: "Assignment updated." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/assignments/:id or /api/assignments/:staffId/:id  - delete an assignment
const deleteAssignment = async (req, res) => {
  try {
    const { staffId, id } = req.params;
    const targetId = id || staffId;
    const query = { _id: targetId };
    if (staffId && id) query.staffId = staffId;

    const result = await Assignment.findOneAndDelete(query);
    if (!result) return res.status(404).json({ success: false, message: "Assignment not found." });
    res.json({ success: true, message: "Assignment deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/assignments/:id/grade - grade a student submission
const gradeSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionId, rollNo, marksAwarded, feedback, studentName, regNo } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });

    if (!assignment.studentSubmissions) {
      assignment.studentSubmissions = [];
    }

    let sub = null;
    if (submissionId) {
      sub = assignment.studentSubmissions.id(submissionId);
    }
    if (!sub && rollNo) {
      sub = assignment.studentSubmissions.find(s => s.rollNo === rollNo);
    }

    if (!sub && rollNo) {
      assignment.studentSubmissions.push({
        rollNo,
        studentName: studentName || rollNo,
        regNo: regNo || rollNo,
        department: assignment.department || "",
        submittedAt: new Date().toLocaleString(),
        fileName: `${assignment.subjectCode}_${rollNo}_Submission.pdf`,
        fileSize: "1.2 MB",
        status: "Graded",
        marksAwarded: Number(marksAwarded),
        feedback: feedback || ""
      });
    } else if (sub) {
      sub.marksAwarded = Number(marksAwarded);
      sub.feedback = feedback || "";
      sub.status = "Graded";
      if (!sub.submittedAt || sub.submittedAt === "--") {
        sub.submittedAt = new Date().toLocaleString();
      }
      if (!sub.fileName || sub.fileName === "--") {
        sub.fileName = `${assignment.subjectCode}_${sub.rollNo}_Submission.pdf`;
        sub.fileSize = "1.2 MB";
      }
    }

    assignment.submissions = assignment.studentSubmissions.filter(s => s.status === "Graded" || s.status === "Submitted").length;
    await assignment.save();

    // Automatically sync updated assignment marks to InternalMarks
    await syncSubjectAssignmentMarksToInternal(assignment.staffId, assignment.subjectCode);

    res.json({ success: true, data: assignment, message: "Grade saved successfully and synced to Internal Marks." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/assignments/:id/students - add a new student to assignment roster
const addStudentToAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { rollNo, studentName, regNo, department, status, marksAwarded, feedback } = req.body;
    if (!rollNo || !studentName) {
      return res.status(400).json({ success: false, message: "Roll No and Student Name are required." });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });

    if (!Array.isArray(assignment.studentSubmissions)) assignment.studentSubmissions = [];

    const existing = assignment.studentSubmissions.find(
      s => s.rollNo.toUpperCase() === rollNo.trim().toUpperCase()
    );
    if (existing) {
      return res.status(400).json({ success: false, message: `Student ${rollNo} is already in this assignment.` });
    }

    const parsedMarks = (marksAwarded !== undefined && marksAwarded !== null && marksAwarded !== "")
      ? Math.max(0, Number(marksAwarded))
      : null;
    const isSubmitted = status === "Submitted" || status === "Graded" || parsedMarks !== null;
    const finalStatus = parsedMarks !== null ? "Graded" : (isSubmitted ? "Submitted" : "Not Submitted");

    assignment.studentSubmissions.push({
      rollNo: rollNo.trim().toUpperCase(),
      studentName: studentName.trim(),
      regNo: regNo ? regNo.trim() : rollNo.trim().toUpperCase(),
      department: department || assignment.department || "",
      submittedAt: isSubmitted ? new Date().toLocaleDateString() : "--",
      fileName: isSubmitted ? `${assignment.subjectCode}_${rollNo.trim().toUpperCase()}_Submission.pdf` : "--",
      fileSize: isSubmitted ? "1.2 MB" : "--",
      status: finalStatus,
      marksAwarded: parsedMarks,
      feedback: feedback || ""
    });

    assignment.submissions = assignment.studentSubmissions.filter(
      s => s.status === "Submitted" || s.status === "Graded"
    ).length;
    await assignment.save();

    // Automatically sync updated assignment marks to InternalMarks
    await syncSubjectAssignmentMarksToInternal(assignment.staffId, assignment.subjectCode);

    res.status(201).json({ 
      success: true, 
      data: assignment, 
      message: `Student ${studentName} (${rollNo}) added to assignment${parsedMarks !== null ? ` with ${parsedMarks} marks (synced to Internal Marks)` : ""}.` 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/assignments/:id/students/:studentId/status - toggle or set submission status for student
const updateStudentSubmissionStatus = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const { status, marksAwarded, feedback } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });

    if (!Array.isArray(assignment.studentSubmissions)) assignment.studentSubmissions = [];

    let sub = assignment.studentSubmissions.id(studentId);
    if (!sub) {
      sub = assignment.studentSubmissions.find(s => s.rollNo === studentId || String(s._id) === studentId);
    }
    if (!sub) return res.status(404).json({ success: false, message: "Student record not found in assignment." });

    if (status) {
      sub.status = status;
      if (status === "Submitted" || status === "Graded") {
        if (!sub.submittedAt || sub.submittedAt === "--") {
          sub.submittedAt = new Date().toLocaleDateString();
        }
        if (!sub.fileName || sub.fileName === "--") {
          sub.fileName = `${assignment.subjectCode}_${sub.rollNo}_Submission.pdf`;
          sub.fileSize = "1.2 MB";
        }
      } else if (status === "Not Submitted") {
        sub.submittedAt = "--";
        sub.fileName = "--";
        sub.fileSize = "--";
        sub.marksAwarded = null;
      }
    }

    if (marksAwarded !== undefined) {
      sub.marksAwarded = marksAwarded === null || marksAwarded === "" ? null : Math.max(0, Number(marksAwarded));
      if (sub.marksAwarded !== null) {
        sub.status = "Graded";
        if (!sub.submittedAt || sub.submittedAt === "--") {
          sub.submittedAt = new Date().toLocaleDateString();
        }
        if (!sub.fileName || sub.fileName === "--") {
          sub.fileName = `${assignment.subjectCode}_${sub.rollNo}_Submission.pdf`;
          sub.fileSize = "1.2 MB";
        }
      }
    }
    if (feedback !== undefined) sub.feedback = feedback;

    assignment.submissions = assignment.studentSubmissions.filter(
      s => s.status === "Submitted" || s.status === "Graded"
    ).length;
    await assignment.save();

    // Automatically sync updated assignment marks to InternalMarks
    await syncSubjectAssignmentMarksToInternal(assignment.staffId, assignment.subjectCode);

    res.json({ 
      success: true, 
      data: assignment, 
      message: `Submission status for ${sub.studentName} updated to "${sub.status}"${sub.marksAwarded !== null ? ` with ${sub.marksAwarded} marks` : ""}.` 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/assignments/:id/submissions/quick-set - set how many students submitted or mark all
const quickSetSubmissionsCount = async (req, res) => {
  try {
    const { id } = req.params;
    const { count, allSubmitted } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });

    if (!Array.isArray(assignment.studentSubmissions)) assignment.studentSubmissions = [];

    const total = assignment.studentSubmissions.length;
    if (total === 0) {
      return res.status(400).json({ success: false, message: "No students enrolled in this assignment yet. Add students first." });
    }

    let targetCount = Number(count);
    if (allSubmitted === true) targetCount = total;
    if (allSubmitted === false) targetCount = 0;
    targetCount = Math.max(0, Math.min(targetCount, total));

    assignment.studentSubmissions.forEach((sub, idx) => {
      if (idx < targetCount) {
        if (sub.status !== "Graded") {
          sub.status = "Submitted";
          if (!sub.submittedAt || sub.submittedAt === "--") sub.submittedAt = new Date().toLocaleDateString();
          if (!sub.fileName || sub.fileName === "--") {
            sub.fileName = `${assignment.subjectCode}_${sub.rollNo}_Submission.pdf`;
            sub.fileSize = "1.2 MB";
          }
        }
      } else {
        if (sub.status !== "Graded") {
          sub.status = "Not Submitted";
          sub.submittedAt = "--";
          sub.fileName = "--";
          sub.fileSize = "--";
          sub.marksAwarded = null;
        }
      }
    });

    assignment.submissions = assignment.studentSubmissions.filter(
      s => s.status === "Submitted" || s.status === "Graded"
    ).length;
    await assignment.save();

    await syncSubjectAssignmentMarksToInternal(assignment.staffId, assignment.subjectCode);

    res.json({ 
      success: true, 
      data: assignment, 
      message: `Submissions set: ${assignment.submissions} of ${total} students marked as submitted.` 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/assignments/:id/students/:studentId - remove a student from assignment roster
const removeStudentFromAssignment = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });

    assignment.studentSubmissions = (assignment.studentSubmissions || []).filter(
      s => String(s._id) !== studentId && s.rollNo !== studentId
    );
    assignment.submissions = assignment.studentSubmissions.filter(
      s => s.status === "Submitted" || s.status === "Graded"
    ).length;
    await assignment.save();

    await syncSubjectAssignmentMarksToInternal(assignment.staffId, assignment.subjectCode);

    res.json({ success: true, data: assignment, message: "Student removed from assignment." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/assignments/:id/students/import-class - import registered class students into assignment
const importStudentsFromClass = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });

    const classDoc = await Class.findOne({ code: new RegExp('^' + assignment.subjectCode + '$', 'i') });
    if (!classDoc || !Array.isArray(classDoc.students) || classDoc.students.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: `No class roster found matching subject code "${assignment.subjectCode}". You can add students manually.` 
      });
    }

    if (!Array.isArray(assignment.studentSubmissions)) assignment.studentSubmissions = [];
    const existingRolls = new Set(assignment.studentSubmissions.map(s => s.rollNo.toUpperCase()));

    let addedCount = 0;
    classDoc.students.forEach(std => {
      if (!existingRolls.has(std.rollNo.toUpperCase())) {
        assignment.studentSubmissions.push({
          rollNo: std.rollNo.toUpperCase(),
          studentName: std.name,
          regNo: std.rollNo.toUpperCase(),
          department: assignment.department || classDoc.dept || "",
          submittedAt: "--",
          fileName: "--",
          fileSize: "--",
          status: "Not Submitted",
          marksAwarded: null,
          feedback: ""
        });
        addedCount++;
      }
    });

    assignment.submissions = assignment.studentSubmissions.filter(
      s => s.status === "Submitted" || s.status === "Graded"
    ).length;
    await assignment.save();

    res.json({ 
      success: true, 
      data: assignment, 
      message: addedCount > 0 
        ? `Imported ${addedCount} student(s) from class "${classDoc.name}". Total: ${assignment.studentSubmissions.length}.` 
        : `All ${classDoc.students.length} students from class roster are already in this assignment.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/assignments/student/:identifier - Get all assignments for a student
const getStudentAssignments = async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({ success: false, message: "Student identifier required" });
    }
    const idClean = identifier.trim();
    const idRegex = new RegExp('^' + idClean + '$', 'i');

    const student = await Student.findOne({
      $or: [
        { rollNo: idRegex },
        { regNo: idRegex },
        { studentId: idRegex },
        { loginId: idRegex },
        { admNo: idRegex }
      ]
    });

    const rollNo = student ? (student.rollNo || idClean) : idClean;
    const regNo = student ? (student.regNo || idClean) : idClean;
    const dept = student ? (student.department || student.course || '') : '';

    // Find enrolled classes if any
    const enrolledClasses = await Class.find({
      $or: [
        { 'students.rollNo': new RegExp('^' + rollNo + '$', 'i') },
        { 'students.rollNo': new RegExp('^' + regNo + '$', 'i') }
      ]
    });
    const classCodes = enrolledClasses.map(c => c.code.toUpperCase());

    // Find assignments where student is in studentSubmissions OR matching enrolled classes OR matching dept
    const query = {
      $or: [
        { 'studentSubmissions.rollNo': new RegExp('^' + rollNo + '$', 'i') },
        { 'studentSubmissions.regNo': new RegExp('^' + regNo + '$', 'i') },
        { 'studentSubmissions.rollNo': idRegex },
        { 'studentSubmissions.regNo': idRegex }
      ]
    };
    if (classCodes.length > 0) {
      query.$or.push({ subjectCode: { $in: classCodes } });
    }
    if (dept) {
      query.$or.push({ department: new RegExp(dept, 'i') });
    }

    const assignments = await Assignment.find(query).sort({ dueDate: 1, createdAt: -1 });

    const formatted = assignments.map(a => {
      let sub = (a.studentSubmissions || []).find(s => {
        const r = (s.rollNo || '').toLowerCase();
        const rg = (s.regNo || '').toLowerCase();
        return r === rollNo.toLowerCase() || r === regNo.toLowerCase() || r === idClean.toLowerCase() ||
               rg === rollNo.toLowerCase() || rg === regNo.toLowerCase() || rg === idClean.toLowerCase();
      });

      const isPastDue = a.dueDate ? new Date(a.dueDate + 'T23:59:59') < new Date() : false;
      const status = sub ? sub.status : (isPastDue ? 'Not Submitted (Overdue)' : 'Pending Submission');

      return {
        _id: a._id,
        id: a._id.toString(),
        staffId: a.staffId,
        staffName: a.staffName,
        subjectCode: a.subjectCode,
        subjectName: a.subjectName,
        department: a.department,
        semester: a.semester,
        academicYear: a.academicYear,
        title: a.title,
        description: a.description,
        dueDate: a.dueDate,
        totalMarks: a.totalMarks,
        assignmentStatus: a.status,
        attachmentName: a.attachmentName || '',
        attachmentData: a.attachmentData || '',
        attachmentSize: a.attachmentSize || '',
        attachmentType: a.attachmentType || '',
        submissionStatus: status,
        submittedAt: sub ? sub.submittedAt : '--',
        fileName: sub ? sub.fileName : '--',
        fileSize: sub ? sub.fileSize : '--',
        fileData: sub ? (sub.fileData || '') : '',
        fileType: sub ? (sub.fileType || '') : '',
        marksAwarded: sub ? sub.marksAwarded : null,
        feedback: sub ? sub.feedback : '',
        isOverdue: isPastDue && (!sub || (sub.status !== 'Submitted' && sub.status !== 'Graded'))
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      assignments: formatted
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/assignments/:id/student/:identifier/submit - Submit assignment solution
const submitStudentAssignment = async (req, res) => {
  try {
    const { id, identifier } = req.params;
    const { fileName, fileSize, comment, studentName, fileData, fileType } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }

    const idClean = identifier.trim();
    const idLower = idClean.toLowerCase();

    let subIndex = (assignment.studentSubmissions || []).findIndex(s => {
      const r = (s.rollNo || '').toLowerCase();
      const rg = (s.regNo || '').toLowerCase();
      return r === idLower || rg === idLower;
    });

    const nowStr = new Date().toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    if (subIndex >= 0) {
      assignment.studentSubmissions[subIndex].status = 'Submitted';
      assignment.studentSubmissions[subIndex].submittedAt = nowStr;
      if (fileName) assignment.studentSubmissions[subIndex].fileName = fileName;
      if (fileSize) assignment.studentSubmissions[subIndex].fileSize = fileSize;
      if (fileData) assignment.studentSubmissions[subIndex].fileData = fileData;
      if (fileType) assignment.studentSubmissions[subIndex].fileType = fileType;
      if (comment) assignment.studentSubmissions[subIndex].feedback = comment;
    } else {
      assignment.studentSubmissions.push({
        rollNo: idClean.toUpperCase(),
        regNo: idClean.toUpperCase(),
        studentName: studentName || idClean,
        department: assignment.department || '',
        submittedAt: nowStr,
        fileName: fileName || 'submission_file.pdf',
        fileSize: fileSize || '1.5 MB',
        fileData: fileData || '',
        fileType: fileType || '',
        status: 'Submitted',
        marksAwarded: null,
        feedback: comment || ''
      });
    }

    assignment.submissions = assignment.studentSubmissions.filter(
      s => s.status === 'Submitted' || s.status === 'Graded'
    ).length;

    await assignment.save();

    res.json({
      success: true,
      message: "Assignment submitted successfully!",
      assignment
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { 
  getAllAssignments, 
  listAssignments, 
  createAssignment, 
  toggleStatus, 
  updateAssignment, 
  deleteAssignment, 
  gradeSubmission,
  addStudentToAssignment,
  updateStudentSubmissionStatus,
  quickSetSubmissionsCount,
  removeStudentFromAssignment,
  importStudentsFromClass,
  getStudentAssignments,
  submitStudentAssignment
};


