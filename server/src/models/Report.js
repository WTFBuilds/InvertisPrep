import mongoose, { Schema } from 'mongoose';

const reportSchema = new Schema(
  {
    paperId: {
      type: Schema.Types.ObjectId,
      ref: 'PYQPaper',
      required: true,
      index: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      enum: ['wrong_file', 'poor_quality', 'wrong_metadata', 'other'],
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate reports by the same user on the same paper
reportSchema.index({ paperId: 1, reportedBy: 1 }, { unique: true });

export const Report = mongoose.model('Report', reportSchema);
