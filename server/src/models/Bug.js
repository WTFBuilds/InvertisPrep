import mongoose, { Schema } from 'mongoose';

const bugSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    browser: {
      type: String,
      trim: true,
    },
    device: {
      type: String,
      trim: true,
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

export const Bug = mongoose.model('Bug', bugSchema);
