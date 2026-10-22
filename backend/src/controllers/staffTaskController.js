const StaffTask = require('../models/StaffTask');
const Staff = require('../models/Staff');

// @route  GET /api/staff-tasks
// @desc   Get all tasks with optional filters
exports.getAllTasks = async (req, res) => {
  try {
    const { department, status, priority, staffId, hodId, search } = req.query;
    const filter = {};

    if (department && department !== 'All' && department !== 'All Departments') {
      filter.department = department;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (priority && priority !== 'All') {
      filter.priority = priority;
    }
    if (staffId) {
      filter['assignedTo.staffId'] = staffId;
    }
    if (hodId) {
      filter['allocatedBy.staffId'] = hodId;
    }
    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { taskId: { $regex: term, $options: 'i' } },
        { 'assignedTo.name': { $regex: term, $options: 'i' } },
        { 'assignedTo.staffId': { $regex: term, $options: 'i' } },
        { 'allocatedBy.name': { $regex: term, $options: 'i' } }
      ];
    }

    const tasks = await StaffTask.find(filter).sort({ createdAt: -1 });

    const totalCount = tasks.length;
    const pendingCount = tasks.filter(t => t.status === 'Pending').length;
    const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
    const completedCount = tasks.filter(t => t.status === 'Completed').length;

    res.status(200).json({
      success: true,
      count: totalCount,
      summary: {
        totalCount,
        pendingCount,
        inProgressCount,
        completedCount
      },
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching staff tasks:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/staff-tasks/staff/:staffId
// @desc   Get tasks allocated to a specific staff member
exports.getTasksForStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const tasks = await StaffTask.find({ 'assignedTo.staffId': staffId }).sort({ createdAt: -1 });

    const totalCount = tasks.length;
    const pendingCount = tasks.filter(t => t.status === 'Pending').length;
    const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
    const completedCount = tasks.filter(t => t.status === 'Completed').length;

    res.status(200).json({
      success: true,
      count: totalCount,
      summary: {
        totalCount,
        pendingCount,
        inProgressCount,
        completedCount
      },
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching staff tasks:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/staff-tasks/hod/:hodStaffId
// @desc   Get tasks allocated by an HOD
exports.getTasksByHod = async (req, res) => {
  try {
    const { hodStaffId } = req.params;
    const tasks = await StaffTask.find({ 'allocatedBy.staffId': hodStaffId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks by HOD:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  POST /api/staff-tasks
// @desc   HOD allocates task to individual staff member
exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      department,
      allocatedBy,
      assignedTo,
      priority,
      category,
      dueDate,
      attachmentName,
      attachmentData
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }
    if (!assignedTo || !assignedTo.staffId || !assignedTo.name) {
      return res.status(400).json({ success: false, message: 'Please select an individual staff member to assign the task.' });
    }
    if (!dueDate) {
      return res.status(400).json({ success: false, message: 'Due date is required.' });
    }

    const task = await StaffTask.create({
      title: title.trim(),
      description: (description || '').trim(),
      department: department || assignedTo.department || 'General',
      allocatedBy: {
        staffId: allocatedBy?.staffId || 'HOD',
        name: allocatedBy?.name || 'Head of Department',
        role: allocatedBy?.role || 'HOD',
        email: allocatedBy?.email || ''
      },
      assignedTo: {
        staffId: assignedTo.staffId,
        name: assignedTo.name,
        designation: assignedTo.designation || 'Staff',
        department: assignedTo.department || department || '',
        email: assignedTo.email || ''
      },
      priority: priority || 'Medium',
      category: category || 'Academic',
      dueDate,
      status: 'Pending',
      attachmentName: attachmentName || '',
      attachmentData: attachmentData || ''
    });

    res.status(201).json({
      success: true,
      message: `Task successfully allocated to ${assignedTo.name}!`,
      data: task
    });
  } catch (error) {
    console.error('Error creating staff task:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  PATCH /api/staff-tasks/:id/status
// @desc   Staff updates task status (Pending -> In Progress -> Completed)
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completionNotes } = req.body;

    const task = await StaffTask.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (status) {
      task.status = status;
      if (status === 'Completed') {
        task.completedAt = new Date();
      } else {
        task.completedAt = null;
      }
    }

    if (completionNotes !== undefined) {
      task.completionNotes = completionNotes;
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: `Task status updated to ${task.status}.`,
      data: task
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  PUT /api/staff-tasks/:id
// @desc   HOD/Admin updates entire task details
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await StaffTask.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const {
      title,
      description,
      priority,
      category,
      dueDate,
      status,
      assignedTo,
      completionNotes
    } = req.body;

    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority) task.priority = priority;
    if (category) task.category = category;
    if (dueDate) task.dueDate = dueDate;
    if (status) {
      task.status = status;
      if (status === 'Completed' && !task.completedAt) {
        task.completedAt = new Date();
      }
    }
    if (assignedTo && assignedTo.staffId) {
      task.assignedTo = {
        staffId: assignedTo.staffId,
        name: assignedTo.name,
        designation: assignedTo.designation || task.assignedTo.designation,
        department: assignedTo.department || task.department,
        email: assignedTo.email || task.assignedTo.email
      };
    }
    if (completionNotes !== undefined) task.completionNotes = completionNotes;

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: task
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  DELETE /api/staff-tasks/:id
// @desc   Delete task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await StaffTask.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
