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

    // Support-ticket thread: staff replies and reporter follow-ups.
    messages: [
      {
        sender: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        senderRole: {
          type: String,
          enum: ['student', 'srt', 'staff', 'admin', 'super-admin'],
          required: true,
        },
        body: {
          type: String,
          required: true,
          trim: true,
          maxlength: 2000,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate reports by the same user on the same paper
reportSchema.index({ paperId: 1, reportedBy: 1 }, { unique: true });

export const Report = mongoose.model('Report', reportSchema);
