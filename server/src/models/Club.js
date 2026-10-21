import mongoose, { Schema } from 'mongoose';

/**
 * A club within Abhiruchi.
 *
 * The document holds the ENTIRE public club page — every section the
 * frontend renders is a field here, so admins can edit any part of a
 * club page from the console without a code deploy.
 */

const clubStatsSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const clubActivitySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    cadence: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const clubWingSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

const clubMemberSchema = new Schema(
  {
    role: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    branch: { type: String, default: '', trim: true },
    note: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const clubAchievementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    detail: { type: String, default: '' },
    year: { type: String, default: '', trim: true },
    kind: {
      type: String,
      enum: ['Award', 'Milestone', 'Record', 'Recognition'],
      default: 'Award',
    },
  },
  { _id: false }
);

const clubTestimonialSchema = new Schema(
  {
    quote: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    detail: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const clubFaqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const clubLogisticsSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const clubStepSchema = new Schema(
  {
    step: { type: String, default: '', trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

const clubEventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    month: { type: String, required: true, trim: true },
    day: { type: String, required: true, trim: true },
    time: { type: String, default: '', trim: true },
    venue: { type: String, default: '', trim: true },
    category: { type: String, default: 'Event', trim: true },
    agenda: { type: [String], default: [] },
    seats: { type: Number, default: 100, min: 0 },
    seatsLeft: { type: Number, default: 100, min: 0 },
    audience: { type: String, default: '' },
    rsvpDeadline: { type: String, default: '' },
    perks: { type: [String], default: [] },
    registrationOpen: { type: Boolean, default: true },
    /** Set when an admin archives an event; hidden from the public page. */
    isPublished: { type: Boolean, default: true },
  },
  { _id: true }
);

const clubSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, required: true, trim: true },
    shortDescription: { type: String, default: '', trim: true },
    longDescription: { type: String, default: '' },
    mission: { type: String, default: '' },
    vision: { type: String, default: '' },
    coordinator: { type: String, default: '', trim: true },
    coordinatorRole: { type: String, default: 'Faculty Coordinator', trim: true },
    coordinatorNote: { type: String, default: '' },
    img: { type: String, default: '', trim: true },
    color: { type: String, default: '#3B82F6', trim: true },
    colorLight: { type: String, default: '#EFF6FF', trim: true },
    colorDark: { type: String, default: '#1D4ED8', trim: true },
    gradient: { type: String, default: 'from-blue-500 via-indigo-600 to-cyan-500', trim: true },
    icon: { type: String, default: 'Users', trim: true },
    highlights: { type: [String], default: [] },
    stats: { type: [clubStatsSchema], default: [] },
    activities: { type: [clubActivitySchema], default: [] },
    wings: { type: [clubWingSchema], default: [] },
    team: { type: [clubMemberSchema], default: [] },
    achievements: { type: [clubAchievementSchema], default: [] },
    testimonials: { type: [clubTestimonialSchema], default: [] },
    faqs: { type: [clubFaqSchema], default: [] },
    logistics: { type: [clubLogisticsSchema], default: [] },
    joinProcess: { type: [clubStepSchema], default: [] },
    events: { type: [clubEventSchema], default: [] },
    /** Ordering on the public clubs grid. */
    displayOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    /** Free-text note visible only in the admin console. */
    adminNote: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// The `id` field already declares `index: true` above, so only the
// compound index is added here.
clubSchema.index({ isActive: 1, displayOrder: 1 });

export const Club = mongoose.model('Club', clubSchema);
