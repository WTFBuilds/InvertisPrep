import mongoose, { Schema } from 'mongoose';

// Minimal mirror of the main server's Branch model — registered so
// .populate('branchId', 'name') resolves against the shared `branches` collection.
const branchSchema = new Schema(
  {
    id: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    departmentId: { type: String, required: true, ref: 'Department', index: true },
    semesters: { type: [Number], default: [1, 2, 3, 4, 5, 6, 7, 8] },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Branch = mongoose.model('Branch', branchSchema);
