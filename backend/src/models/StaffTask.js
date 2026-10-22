const mongoose = require('mongoose');

const staffTaskSchema = new mongoose.Schema({
  taskId: { 
    type: String, 
    unique: true,
    default: () => `TSK-${Date.now().toString().slice(-6)}` 
  },
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    default: '', 
    trim: true 
  },
  department: { 
    type: String, 
    required: true, 
    trim: true, 
    index: true 
  },
  allocatedBy: {
    staffId: { type: String, required: true },
    name: { type: String, default: '' },
    role: { type: String, default: 'HOD' },
    email: { type: String, default: '' }
  },
  assignedTo: {
    staffId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    designation: { type: String, default: 'Assistant Professor' },
    department: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Urgent'], 
    default: 'Medium' 
  },
  category: { 
    type: String, 
    enum: [
      'Academic', 
      'Exam Duty', 
      'Syllabus / Curriculum', 
      'Event / Function', 
      'Accreditation / NAAC', 
      'Student Mentoring', 
      'Lab / Asset Maintenance', 
      'General'
    ], 
    default: 'Academic' 
  },
  dueDate: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Completed', 'Under Review', 'Cancelled'], 
    default: 'Pending',
    index: true
  },
  completionNotes: { 
    type: String, 
    default: '' 
  },
  completedAt: { 
    type: Date 
  },
  attachmentName: { 
    type: String, 
    default: '' 
  },
  attachmentData: { 
    type: String, 
    default: '' 
  }
}, {
  timestamps: true,
  collection: 'StaffTasks'
});

module.exports = mongoose.model('StaffTask', staffTaskSchema, 'StaffTasks');
