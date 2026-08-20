import mongoose, { Schema } from 'mongoose';

// Minimal User model for local fallback validation
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'super-admin', 'srt'],
      default: 'student',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    picture: {
      type: String,
    },
    // Sync metadata
    lastSyncedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });

export const User = mongoose.model('User', userSchema);