import mongoose, { Schema } from 'mongoose';
import { IPYQPaper, ExamType } from '../types/index.js';

const pyqPaperSchema = new Schema<IPYQPaper>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subjectCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Hierarchy
    departmentId: {
      type: String,
      required: true,
      ref: 'Department',
      index: true,
    },
    branchId: {
      type: String,
      required: true,
      ref: 'Branch',
      index: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      ref: 'Session',
      index: true,
    },
    examType: {
      type: String,
      enum: ['mid-term', 'end-term', 'sessional'] as ExamType[],
      required: true,
    },
    
    // File info
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    cloudinaryFolder: {
      type: String,
      index: true,
    },
    fileSize: {
      type: Number,
    },
    pageCount: {
      type: Number,
    },
    
    // Metadata
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    searchText: {
      type: String,
      index: 'text',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast queries
pyqPaperSchema.index({ 
  departmentId: 1, 
  branchId: 1, 
  semester: 1, 
  sessionId: 1 
});

pyqPaperSchema.index({ createdAt: -1 }); // Recent uploads
pyqPaperSchema.index({ downloads: -1 }); // Popular papers
pyqPaperSchema.index({ isActive: 1, departmentId: 1 });

// Pre-save hook to generate searchText
pyqPaperSchema.pre('save', function(next) {
  this.searchText = [
    this.title,
    this.subjectName,
    this.subjectCode,
    this.departmentId,
    this.branchId,
    this.examType,
    ...this.tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  
  next();
});

export const PYQPaper = mongoose.model<IPYQPaper>('PYQPaper', pyqPaperSchema);
