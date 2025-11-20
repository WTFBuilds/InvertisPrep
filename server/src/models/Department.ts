import mongoose, { Schema } from 'mongoose';
import { IDepartment } from '../types/index.js';

const departmentSchema = new Schema<IDepartment>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: '🎓',
    },
    description: {
      type: String,
      required: true,
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
departmentSchema.index({ id: 1, isActive: 1 });

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);
