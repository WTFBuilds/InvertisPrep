import mongoose, { Schema } from 'mongoose';
import { ISession } from '../types/index.js';

const sessionSchema = new Schema<ISession>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startYear: {
      type: Number,
      required: true,
      index: true,
    },
    endYear: {
      type: Number,
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
sessionSchema.index({ startYear: -1 }); // Sort by year descending
sessionSchema.index({ isActive: 1 });

export const Session = mongoose.model<ISession>('Session', sessionSchema);
