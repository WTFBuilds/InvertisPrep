import mongoose, { Schema } from 'mongoose';
import { IUser, UserRole } from '../types/index.js';

const userSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
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
      index: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
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

// Indexes
userSchema.index({ googleId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
