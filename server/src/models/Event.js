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
    // Real sortable date (first day of the event). Optional so legacy
    // free-text `date` strings keep working; used for Upcoming/Past split.
    startDate: {
      type: Date,
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
      default: '',
    },
    // Rich HTML body written in the admin editor. Rendered on the public
    // detail page when present; longDescription remains the plain fallback.
    content: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      required: true,
    },
    // 'draft' events are hidden from every public endpoint and only
    // visible in the admin console (events.view).
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
      index: true,
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
    // External registration link (Google Form, club page, ...). Optional.
    registrationUrl: {
      type: String,
      default: '',
      trim: true,
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
eventSchema.index({ status: 1, featured: -1, startDate: -1 });

export const Event = mongoose.model('Event', eventSchema);
