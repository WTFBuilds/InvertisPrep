import mongoose, { Schema } from 'mongoose';

const eventSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    organizer: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    longDescription: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    registrationOpen: {
      type: Boolean,
      default: true,
    },
    timeline: {
      type: [String],
      default: [],
    },
    rules: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ id: 1 });

export const Event = mongoose.model('Event', eventSchema);
