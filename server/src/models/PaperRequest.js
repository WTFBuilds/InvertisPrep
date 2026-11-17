import mongoose, { Schema } from 'mongoose';

const paperRequestSchema = new Schema(
  {
    // Paper the student is looking for
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
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    subjectCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    examType: {
      type: String,
      enum: ['any', 'mid-term', 'end-term'],
      default: 'any',
    },
    year: {
      type: Number,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Workflow
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'fulfilled', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    // Support-ticket thread: staff replies and student follow-ups, with the
    // sender's role stored so the UI can render them on the correct side.
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

paperRequestSchema.index({ status: 1, createdAt: -1 });

export const PaperRequest = mongoose.model('PaperRequest', paperRequestSchema);
