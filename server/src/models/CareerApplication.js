import mongoose from 'mongoose';

const careerApplicationSchema = new mongoose.Schema({
  // Section 1: Personal Information
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 150 },
  whatsappNumber: { type: String, required: true, trim: true, maxlength: 20 },
  departmentBranch: { type: String, required: true, trim: true, maxlength: 100 },
  currentSemester: { 
    type: String, 
    required: true, 
    enum: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'] 
  },
  currentLocation: { 
    type: String, 
    required: true, 
    enum: ['Bareilly', 'Rampur', 'Shahjahanpur', 'Other'] 
  },
  customLocation: { type: String, trim: true, maxlength: 100 },

  // Section 2: Domain Selection
  appliedDomain: { 
    type: String, 
    required: true, 
    enum: [
      'Canva designer',
      'Video Editor',
      'Support and Resource Team (SRT)',
      'Developers',
      'Content writer',
      'Technical support',
      'Social media manager',
      'Marketing'
    ] 
  },
  hybridComfortable: { type: Boolean, required: true },
  interestReason: { type: String, required: true, maxlength: 2000 },

  // Section 3: Skills & Proficiency
  skills: { type: String, required: true, maxlength: 2000 },
  proficiencyLevel: { 
    type: String, 
    required: true, 
    enum: [
      'Beginner (Learning the basics)',
      'Intermediate (Have some hands-on experience)',
      'Advanced (Confident and have done projects)'
    ] 
  },
  hasProjects: { type: Boolean, required: true },
  projectDescription: { type: String, maxlength: 3000 },

  // Section 4: Resume & Portfolio
  resumeLink: { type: String, required: true, trim: true, maxlength: 500 },
  portfolioLink: { type: String, trim: true, maxlength: 500 },

  // Section 5: Final Questions
  heardFrom: { 
    type: String, 
    required: true, 
    enum: [
      'Friend / Classmate',
      'Social Media (Instagram / WhatsApp)',
      'Invertis Confession',
      'InvertisPrep Website',
      'Other'
    ] 
  },
  customHeardFrom: { type: String, trim: true, maxlength: 100 },
  availability: { 
    type: String, 
    required: true, 
    enum: [
      'Yes, fully available',
      'Available with minor scheduling constraints',
      'Not sure yet'
    ] 
  },
  additionalNotes: { type: String, maxlength: 3000 },

  // Metadata
  status: { 
    type: String, 
    enum: ['pending', 'under_review', 'shortlisted', 'rejected', 'hired'], 
    default: 'pending' 
  },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ipAddress: { type: String },
  userAgent: { type: String },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  reviewNotes: { type: String, maxlength: 2000 },
}, { 
  timestamps: true 
});

// Indexes for common queries
careerApplicationSchema.index({ status: 1, createdAt: -1 });
careerApplicationSchema.index({ appliedDomain: 1, status: 1 });
careerApplicationSchema.index({ email: 1 });
careerApplicationSchema.index({ submittedBy: 1 });

export default mongoose.model('CareerApplication', careerApplicationSchema);