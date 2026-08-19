import mongoose, { Schema } from 'mongoose';

// Minimal mirror of the main server's Session model — registered so
// .populate('sessionId', 'name startYear endYear') resolves against the
// shared `sessions` collection (academic sessions, not auth sessions).
const sessionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    startYear: { type: Number, required: true, index: true },
    endYear: { type: Number, required: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Session = mongoose.model('Session', sessionSchema);
