import mongoose, { Schema } from 'mongoose';

// Minimal mirror of the main server's Department model — the PDF service only
// needs it registered so .populate('departmentId', 'name displayName icon')
// can resolve against the shared `departments` collection.
const departmentSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    icon: { type: String, default: '🎓' },
    description: { type: String },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Department = mongoose.model('Department', departmentSchema);
