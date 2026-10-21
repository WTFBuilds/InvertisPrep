import mongoose from 'mongoose';
import { Club } from '../models/Club.js';
import { ClubRegistration } from '../models/ClubRegistration.js';
import { uploadImage } from '../services/cloudinaryService.js';
import { SEED_CLUBS } from '../shared/clubSeed.js';

// ── Helpers ──────────────────────────────────────────────────────────────

/** Normalise a payload that may arrive as a JSON string (multipart forms). */
const parseMaybeJSON = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

/** Ensure a string is an array of non-empty strings. */
const toStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v).trim()).filter(Boolean);
};

/**
 * Fields an admin may edit on a club. Everything the public page renders
 * is editable, so this list mirrors the schema rather than a subset.
 */
const EDITABLE_FIELDS = [
  'name',
  'tagline',
  'shortDescription',
  'longDescription',
  'mission',
  'vision',
  'coordinator',
  'coordinatorRole',
  'coordinatorNote',
  'img',
  'color',
  'colorLight',
  'colorDark',
  'gradient',
  'icon',
  'highlights',
  'stats',
  'activities',
  'wings',
  'team',
  'achievements',
  'testimonials',
  'faqs',
  'logistics',
  'joinProcess',
  'events',
  'displayOrder',
  'isActive',
  'adminNote',
];

/** Build the update document from a request body, ignoring unknown keys. */
const buildUpdate = (body) => {
  const update = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) update[field] = body[field];
  }
  return update;
};

// ── Seeding ──────────────────────────────────────────────────────────────

const checkAndSeedClubs = async () => {
  try {
    const count = await Club.countDocuments();
    if (count === 0) {
      console.log('Pre-seeding clubs database...');
      await Club.insertMany(SEED_CLUBS);
      console.log(`Clubs pre-seeded successfully (${SEED_CLUBS.length}).`);
    }
  } catch (error) {
    console.error('Failed to pre-seed clubs:', error);
  }
};

// ── Public reads ─────────────────────────────────────────────────────────

/** All active clubs, ordered for the public grid. */
export const getClubs = async (req, res) => {
  try {
    await checkAndSeedClubs();
    const includeInactive = req.query.includeInactive === 'true';
    const filter = includeInactive ? {} : { isActive: true };
    const clubs = await Club.find(filter).sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, count: clubs.length, data: clubs });
  } catch (error) {
    console.error('Get clubs error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving clubs' });
  }
};

/** A single club by its slug. */
export const getClubById = async (req, res) => {
  try {
    await checkAndSeedClubs();
    const { id } = req.params;
    const club = await Club.findOne({ id: String(id).toLowerCase() });
    if (!club) {
      res.status(404).json({ success: false, message: 'Club not found' });
      return;
    }
    res.json({ success: true, data: club });
  } catch (error) {
    console.error('Get club by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving club details' });
  }
};

// ── Admin CRUD ───────────────────────────────────────────────────────────

/** Create a new club. */
export const createClub = async (req, res) => {
  try {
    const body = { ...req.body };

    // Multipart form fields arrive as strings.
    for (const key of [
      'highlights',
      'stats',
      'activities',
      'wings',
      'team',
      'achievements',
      'testimonials',
      'faqs',
      'logistics',
      'joinProcess',
      'events',
    ]) {
      body[key] = parseMaybeJSON(body[key], body[key]);
    }
    if (typeof body.isActive === 'string') body.isActive = body.isActive === 'true';
    if (typeof body.displayOrder === 'string') body.displayOrder = Number(body.displayOrder) || 0;

    const id = String(body.id || '').trim().toLowerCase();
    if (!id) {
      res.status(400).json({ success: false, message: 'A club slug (id) is required.' });
      return;
    }
    if (!body.name || !body.tagline) {
      res.status(400).json({ success: false, message: 'Name and tagline are required.' });
      return;
    }

    const exists = await Club.findOne({ id });
    if (exists) {
      res.status(400).json({ success: false, message: `A club with the slug "${id}" already exists.` });
      return;
    }

    const club = await Club.create({ ...body, id });
    res.status(201).json({ success: true, data: club });
  } catch (error) {
    console.error('Create club error:', error);
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'That club slug is already taken.' });
      return;
    }
    res.status(500).json({ success: false, message: 'Server error creating club' });
  }
};

/** Update a club. */
export const updateClub = async (req, res) => {
  try {
    const { id } = req.params;
    const body = { ...req.body };

    for (const key of [
      'highlights',
      'stats',
      'activities',
      'wings',
      'team',
      'achievements',
      'testimonials',
      'faqs',
      'logistics',
      'joinProcess',
      'events',
    ]) {
      body[key] = parseMaybeJSON(body[key], body[key]);
    }
    if (typeof body.isActive === 'string') body.isActive = body.isActive === 'true';
    if (typeof body.displayOrder === 'string') body.displayOrder = Number(body.displayOrder) || 0;

    // A slug is immutable — renaming it would break every link to the
    // club page. Admins change the display name, not the slug.
    body.id = undefined;

    const update = buildUpdate(body);
    const club = await Club.findOneAndUpdate(
      { id: String(id).toLowerCase() },
      update,
      { new: true, runValidators: true }
    );

    if (!club) {
      res.status(404).json({ success: false, message: 'Club not found' });
      return;
    }

    res.json({ success: true, data: club });
  } catch (error) {
    console.error('Update club error:', error);
    res.status(500).json({ success: false, message: 'Server error updating club' });
  }
};

/** Delete a club and every registration attached to it. */
export const deleteClub = async (req, res) => {
  try {
    const { id } = req.params;
    const club = await Club.findOneAndDelete({ id: String(id).toLowerCase() });
    if (!club) {
      res.status(404).json({ success: false, message: 'Club not found' });
      return;
    }
    await ClubRegistration.deleteMany({ clubId: club.id });
    res.json({ success: true, message: 'Club deleted successfully' });
  } catch (error) {
    console.error('Delete club error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting club' });
  }
};

/** Upload a club logo or banner image. */
export const uploadClubImage = async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded.' });
      return;
    }
    const result = await uploadImage(req.file.path);
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully!',
      data: { url: result.cloudinaryUrl },
    });
  } catch (error) {
    console.error('Upload club image error:', error);
    res.status(500).json({ success: false, message: 'Server error uploading club image.' });
  }
};

/**
 * Add, update or remove a single event on a club.
 *
 * Events live as subdocuments, so they need their own endpoints rather
 * than being rewritten wholesale — otherwise a single edit to one event
 * would force the admin to resend the whole club.
 */
export const upsertClubEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { eventId } = req.body;
    const eventData = { ...req.body };
    // The event id travels as a sibling of the event data, not as part of
    // it, so it is stripped from the payload.
    eventData.eventId = undefined;

    if (typeof eventData.isPublished === 'string') {
      eventData.isPublished = eventData.isPublished === 'true';
    }
    if (typeof eventData.registrationOpen === 'string') {
      eventData.registrationOpen = eventData.registrationOpen === 'true';
    }
    if (typeof eventData.seats === 'string') eventData.seats = Number(eventData.seats) || 0;
    if (typeof eventData.seatsLeft === 'string') eventData.seatsLeft = Number(eventData.seatsLeft) || 0;
    eventData.agenda = toStringArray(eventData.agenda);
    eventData.perks = toStringArray(eventData.perks);

    const club = await Club.findOne({ id: String(id).toLowerCase() });
    if (!club) {
      res.status(404).json({ success: false, message: 'Club not found' });
      return;
    }

    if (eventId) {
      const sub = club.events.id(eventId);
      if (!sub) {
        res.status(404).json({ success: false, message: 'Event not found on this club' });
        return;
      }
      sub.set(eventData);
      await club.save();
      res.json({ success: true, data: club });
      return;
    }

    club.events.push(eventData);
    await club.save();
    res.status(201).json({ success: true, data: club });
  } catch (error) {
    console.error('Upsert club event error:', error);
    res.status(500).json({ success: false, message: 'Server error saving club event' });
  }
};

/** Remove one event from a club. */
export const deleteClubEvent = async (req, res) => {
  try {
    const { id, eventId } = req.params;
    const club = await Club.findOne({ id: String(id).toLowerCase() });
    if (!club) {
      res.status(404).json({ success: false, message: 'Club not found' });
      return;
    }
    const sub = club.events.id(eventId);
    if (!sub) {
      res.status(404).json({ success: false, message: 'Event not found on this club' });
      return;
    }
    sub.deleteOne();
    await club.save();
    res.json({ success: true, data: club });
  } catch (error) {
    console.error('Delete club event error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting club event' });
  }
};

// ── Registrations (RSVPs) ────────────────────────────────────────────────

/**
 * Public RSVP submission.
 *
 * Duplicate registrations are reported back rather than silently
 * swallowed, so the student learns the truth.
 */
export const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { eventId, name, email, branch, year, interests } = req.body;

    if (!name || !email) {
      res.status(400).json({ success: false, message: 'Name and email are required.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
      return;
    }
    if (!eventId || !mongoose.isValidObjectId(eventId)) {
      res.status(400).json({ success: false, message: 'A valid event is required.' });
      return;
    }

    const club = await Club.findOne({ id: String(id).toLowerCase() });
    if (!club) {
      res.status(404).json({ success: false, message: 'Club not found' });
      return;
    }

    const event = club.events.id(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    if (!event.registrationOpen) {
      res.status(400).json({ success: false, message: 'Registration for this event is closed.' });
      return;
    }
    // When the event is full the student is waitlisted rather than
    // turned away. A waitlisted booking still shows in the club's list
    // and can be promoted the moment somebody cancels.
    const isFull = event.seatsLeft <= 0;

    const normalisedEmail = String(email).trim().toLowerCase();
    const existing = await ClubRegistration.findOne({ eventId, email: normalisedEmail });
    if (existing && existing.status !== 'cancelled') {
      res.status(409).json({
        success: false,
        code: 'ALREADY_REGISTERED',
        message: 'You are already registered for this event.',
        existingRegistration: existing,
      });
      return;
    }

    const seats = Math.max(1, Number(req.body.seats) || 1);
    const now = new Date();

    const registration = await ClubRegistration.create({
      clubId: club.id,
      eventId,
      eventTitle: event.title,
      eventDate: `${event.month} ${event.day}`,
      eventTime: event.time || '',
      eventVenue: event.venue || '',
      name: String(name).trim(),
      email: normalisedEmail,
      branch: branch || '',
      year: year || '',
      interests: toStringArray(interests),
      studentNote: String(req.body.studentNote || '').trim(),
      source: 'student',
      bookingMethod: 'online',
      status: isFull ? 'waitlist' : 'confirmed',
      confirmedAt: isFull ? null : now,
      seats,
    });

    // Only a confirmed seat consumes capacity; a waitlisted booking does
    // not, because the seat is not theirs yet.
    if (!isFull) {
      event.seatsLeft = Math.max(0, event.seatsLeft - seats);
      await club.save();
    }

    res.status(201).json({
      success: true,
      message: isFull
        ? 'This event is full, so you have been added to the waitlist.'
        : 'Your seat is confirmed.',
      waitlisted: isFull,
      data: registration,
    });
  } catch (error) {
    console.error('Register for event error:', error);
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        code: 'ALREADY_REGISTERED',
        message: 'You are already registered for this event.',
      });
      return;
    }
    res.status(500).json({ success: false, message: 'Server error saving your registration.' });
  }
};

/** List registrations, filtered by club, event or status. */
export const getRegistrations = async (req, res) => {
  try {
    const { clubId, eventId, status } = req.query;
    const filter = {};
    if (clubId) filter.clubId = String(clubId).toLowerCase();
    if (eventId && mongoose.isValidObjectId(eventId)) filter.eventId = eventId;
    if (status && status !== 'all') filter.status = status;

    const registrations = await ClubRegistration.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: registrations.length, data: registrations });
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving registrations' });
  }
};

/** Counts per status, for the admin summary strip. */
export const getRegistrationStats = async (req, res) => {
  try {
    const clubId = req.query.clubId ? String(req.query.clubId).toLowerCase() : null;
    const match = clubId ? { clubId } : {};

    const [total, pending, confirmed, waitlist, cancelled, attended] = await Promise.all([
      ClubRegistration.countDocuments(match),
      ClubRegistration.countDocuments({ ...match, status: 'pending' }),
      ClubRegistration.countDocuments({ ...match, status: 'confirmed' }),
      ClubRegistration.countDocuments({ ...match, status: 'waitlist' }),
      ClubRegistration.countDocuments({ ...match, status: 'cancelled' }),
      // Attendance is tracked separately from the booking state, so it
      // is counted independently of status.
      ClubRegistration.countDocuments({ ...match, attended: true }),
    ]);

    res.json({
      success: true,
      data: { total, pending, confirmed, waitlist, cancelled, attended },
    });
  } catch (error) {
    console.error('Get registration stats error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving registration stats' });
  }
};

/** Update a registration's status, notes or check-in state. */
export const updateRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    if (!mongoose.isValidObjectId(registrationId)) {
      res.status(400).json({ success: false, message: 'Invalid registration id' });
      return;
    }

    // The existing record is needed before the update is applied — the
    // seat-release logic below has to know whether the student was
    // holding a confirmed seat.
    const existing = await ClubRegistration.findById(registrationId).lean();
    if (!existing) {
      res.status(404).json({ success: false, message: 'Registration not found' });
      return;
    }

    const update = {};
    if (req.body.status) {
      const wasHoldingSeat = existing.status === 'confirmed';

      update.status = req.body.status;
      // Stamp the moment each milestone was reached, so the console can
      // show when a seat was confirmed, cancelled or checked in.
      if (req.body.status === 'confirmed') update.confirmedAt = new Date();
      if (req.body.status === 'cancelled') {
        update.cancelledAt = new Date();
        update.cancelledBy = 'admin';
      }

      // Cancelling a held seat returns it to the pool, and promotes the
      // next person on the waitlist.
      if (req.body.status === 'cancelled' && wasHoldingSeat) {
        const club = await Club.findOne({ id: existing.clubId });
        if (club) {
          const event = club.events.id(existing.eventId);
          if (event) {
            event.seatsLeft = Math.min(event.seats, event.seatsLeft + (existing.seats || 1));

            // Promote the longest-waiting person onto the freed seat.
            const nextInLine = await ClubRegistration.findOne({
              eventId: existing.eventId,
              status: 'waitlist',
            }).sort({ createdAt: 1 });

            if (nextInLine) {
              nextInLine.status = 'confirmed';
              nextInLine.confirmedAt = new Date();
              await nextInLine.save();
              event.seatsLeft = Math.max(0, event.seatsLeft - (nextInLine.seats || 1));
            }
            await club.save();
          }
        }
      }
    }
    if (req.body.notes !== undefined) update.notes = req.body.notes;
    if (req.body.studentNote !== undefined) update.studentNote = req.body.studentNote;
    if (req.body.attended !== undefined) {
      update.attended = !!req.body.attended;
      update.attendedAt = req.body.attended ? new Date() : null;
    }

    const registration = await ClubRegistration.findByIdAndUpdate(
      registrationId,
      update,
      { new: true, runValidators: true }
    );
    if (!registration) {
      res.status(404).json({ success: false, message: 'Registration not found' });
      return;
    }
    res.json({ success: true, data: registration });
  } catch (error) {
    console.error('Update registration error:', error);
    res.status(500).json({ success: false, message: 'Server error updating registration' });
  }
};

/** Delete a registration, restoring the seat it consumed. */
export const deleteRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    if (!mongoose.isValidObjectId(registrationId)) {
      res.status(400).json({ success: false, message: 'Invalid registration id' });
      return;
    }

    const registration = await ClubRegistration.findByIdAndDelete(registrationId);
    if (!registration) {
      res.status(404).json({ success: false, message: 'Registration not found' });
      return;
    }

    // Give the seat back if the club and event still exist.
    const club = await Club.findOne({ id: registration.clubId });
    if (club) {
      const event = club.events.id(registration.eventId);
      if (event && event.seatsLeft < event.seats) {
        event.seatsLeft = Math.min(event.seats, event.seatsLeft + (registration.seats || 1));
        await club.save();
      }
    }

    res.json({ success: true, message: 'Registration deleted' });
  } catch (error) {
    console.error('Delete registration error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting registration' });
  }
};

/** Manual registration made from the admin console. */
export const createRegistration = async (req, res) => {
  try {
    const { clubId, eventId, name, email, branch, year, interests, status } = req.body;

    if (!clubId || !eventId || !name || !email) {
      res.status(400).json({ success: false, message: 'Club, event, name and email are required.' });
      return;
    }

    const club = await Club.findOne({ id: String(clubId).toLowerCase() });
    if (!club) {
      res.status(404).json({ success: false, message: 'Club not found' });
      return;
    }
    const event = club.events.id(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    const normalisedEmail = String(email).trim().toLowerCase();
    const existing = await ClubRegistration.findOne({ eventId, email: normalisedEmail });
    if (existing) {
      res.status(409).json({
        success: false,
        code: 'ALREADY_REGISTERED',
        message: 'That email is already registered for this event.',
      });
      return;
    }

    const seats = Math.max(1, Number(req.body.seats) || 1);
    const now = new Date();

    const registration = await ClubRegistration.create({
      clubId: club.id,
      eventId,
      eventTitle: event.title,
      eventDate: `${event.month} ${event.day}`,
      eventTime: event.time || '',
      eventVenue: event.venue || '',
      name: String(name).trim(),
      email: normalisedEmail,
      branch: branch || '',
      year: year || '',
      interests: toStringArray(interests),
      studentNote: String(req.body.studentNote || '').trim(),
      notes: String(req.body.notes || '').trim(),
      source: 'admin',
      bookingMethod: 'manual',
      status: status || 'confirmed',
      confirmedAt: (status || 'confirmed') === 'confirmed' ? now : null,
      seats,
    });

    if (event.seatsLeft > 0) {
      event.seatsLeft = Math.max(0, event.seatsLeft - seats);
      await club.save();
    }

    res.status(201).json({ success: true, data: registration });
  } catch (error) {
    console.error('Create registration error:', error);
    res.status(500).json({ success: false, message: 'Server error creating registration' });
  }
};

/** Per-club registration breakdown, for the admin overview table. */
export const getClubRegistrationSummary = async (req, res) => {
  try {
    const clubs = await Club.find({}).sort({ displayOrder: 1 });
    const rows = await ClubRegistration.aggregate([
      { $group: { _id: '$clubId', total: { $sum: 1 } } },
    ]);
    const byClub = new Map(rows.map((r) => [r._id, r.total]));

    const data = clubs.map((club) => ({
      clubId: club.id,
      name: club.name,
      isActive: club.isActive,
      events: club.events.length,
      registrations: byClub.get(club.id) || 0,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get club registration summary error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving club summary' });
  }
};
