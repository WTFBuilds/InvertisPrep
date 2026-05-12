import mongoose, { Schema } from 'mongoose';

const branchSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    departmentId: {
      type: String,
      required: true,
      ref: 'Department',
      index: true,
    },
    semesters: {
      type: [Number],
      required: true,
      default: [1, 2, 3, 4, 5, 6, 7, 8],
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

// Compound indexes
branchSchema.index({ departmentId: 1, id: 1 }, { unique: true });
branchSchema.index({ departmentId: 1, isActive: 1 });

export const Branch = mongoose.model('Branch', branchSchema);
