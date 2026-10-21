import mongoose, { Schema } from 'mongoose';

/**
 * An RSVP for one of a club's events.
 *
 * One document per student per event. The unique compound index is what
 * stops the same person registering twice for the same event, while
 * still allowing them to register for several different events.
 */
const clubRegistrationSchema = new Schema(
  {
    clubId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    /** Denormalised for easy admin listing without a club lookup. */
    eventTitle: { type: String, default: '', trim: true },
    eventDate: { type: String, default: '', trim: true },
    eventTime: { type: String, default: '', trim: true },
    eventVenue: { type: String, default: '', trim: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    branch: { type: String, default: '', trim: true },
    year: { type: String, default: '', trim: true },
    /** How the student wants to take part. */
    interests: { type: [String], default: [] },
    /**
     * Where the registration came from. 'student' is the public RSVP
     * form; 'admin' is a manual entry made from the console.
     */
    source: { type: String, enum: ['student', 'admin'], default: 'student' },
    /**
     * The BOOKING state — whether this student holds a seat.
     *
     * Attendance is deliberately NOT a status. A club usually has nobody
     * scanning names at the door, so an "attended" status would sit empty
     * for most events — and marking someone as attended would overwrite
     * the fact that they were ever confirmed, so "how many people
     * booked?" becomes unanswerable. Attendance is a separate optional
     * flag below that can be toggled without touching the booking.
     */
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'waitlist', 'cancelled'],
      default: 'pending',
      index: true,
    },
    /**
     * Whether the student actually showed up. Optional — a club that
     * does check people in at the door can tick this; one that does not
     * simply leaves it alone.
     */
    attended: { type: Boolean, default: false, index: true },
    /** When they were marked as having shown up. */
    attendedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
    /** Set when an admin records the student's arrival at the event. */
    checkedInAt: { type: Date, default: null },
    /**
     * A free-text note the student left with their registration — "I
     * have a clash with exams" and so on. Keeping it on the record means
     * the club can see the context without chasing the student by email.
     */
    studentNote: { type: String, default: '' },
    /**
     * When the seat was confirmed. Distinct from createdAt so a
     * manually-approved registration is distinguishable from a direct
     * one.
     */
    confirmedAt: { type: Date, default: null },
    /** When the registration was cancelled, if it was. */
    cancelledAt: { type: Date, default: null },
    /**
     * Who cancelled it — the student, or the club. This matters: a
     * club-side cancellation frees the seat for the waitlist, whereas a
     * student-side one usually does not.
     */
    cancelledBy: { type: String, enum: ['student', 'admin', ''], default: '' },
    /**
     * How the seat was obtained — 'online' for the public form,
     * 'manual' for one entered by an admin.
     */
    bookingMethod: {
      type: String,
      enum: ['online', 'manual'],
      default: 'online',
    },
    /**
     * How many seats this booking takes. Almost always 1, but a group
     * booking (a dance team, a project group) may take more.
     */
    seats: { type: Number, default: 1, min: 1 },
  },
  {
    timestamps: true,
  }
);

// One registration per email per event. The partial filter keeps the
// index sparse so a student may hold many registrations across events.
clubRegistrationSchema.index(
  { eventId: 1, email: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'cancelled' } } }
);
clubRegistrationSchema.index({ clubId: 1, createdAt: -1 });
clubRegistrationSchema.index({ status: 1, createdAt: -1 });
clubRegistrationSchema.index({ clubId: 1, eventId: 1, status: 1 });

export const ClubRegistration = mongoose.model('ClubRegistration', clubRegistrationSchema);
