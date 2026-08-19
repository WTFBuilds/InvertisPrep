import mongoose, { Schema } from 'mongoose';

const watermarkJobSchema = new Schema(
  {
    paperId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['view', 'download'],
      default: 'view',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    // BullMQ job ID for tracking
    bullJobId: {
      type: String,
      index: true,
    },
    // Result data when completed
    result: {
      watermarkedUrl: String, // Cloudinary URL of watermarked PDF (if stored)
      fileName: String,
      expiresAt: Date, // For temporary signed URLs
    },
    error: {
      message: String,
      stack: String,
    },
    // Timing
    startedAt: Date,
    completedAt: Date,
    // Retry count
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for deduping
watermarkJobSchema.index({ paperId: 1, userId: 1, type: 1, status: 1 });

// TTL index - auto-delete completed/failed jobs after 24 hours
watermarkJobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export const WatermarkJob = mongoose.model('WatermarkJob', watermarkJobSchema);