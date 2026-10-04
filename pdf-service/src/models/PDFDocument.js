import mongoose, { Schema } from 'mongoose';

const pdfDocumentSchema = new Schema(
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
    // Extra branches the paper also applies to (e.g. a common first-year
    // subject shared by CSE and ME). Papers match a branch filter when the
    // branch is branchId OR appears here. Optional — legacy papers have
    // branchId only and behave exactly as before.
    additionalBranchIds: {
      type: [String],
      ref: 'Branch',
      default: [],
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
      enum: ['mid-term', 'end-term'],
      required: true,
    },

    // File info (Cloudinary)
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
    },
    year: {
      type: Number,
      required: true,
      index: true,
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
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
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

// Compound indexes for common queries
pdfDocumentSchema.index({ departmentId: 1, branchId: 1, semester: 1, verified: 1 });
pdfDocumentSchema.index({ verified: 1, isActive: 1 });
pdfDocumentSchema.index({ year: -1, downloads: -1 });
pdfDocumentSchema.index({ departmentId: 1, verified: 1, isActive: 1, year: -1, downloads: -1 });

// Use the existing `pyqpapers` collection (838 legacy papers) instead of a
// fresh `pdfdocuments` collection — avoids a data migration. Both the main
// server's PYQPaper model and this model point at the same collection.
export const PDFDocument = mongoose.model('PDFDocument', pdfDocumentSchema, 'pyqpapers');