import mongoose, { Schema } from 'mongoose';
import { IUser, UserRole } from '../types/index.js';

const userSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    picture: {
      type: String,
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'super-admin'] as UserRole[],
      default: 'student',
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ role: 1, isActive: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
