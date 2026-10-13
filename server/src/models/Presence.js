import mongoose, { Schema } from 'mongoose';

// One lightweight doc per user: where they are right now and when we last
// heard from their tab. "Online" = lastSeenAt within ONLINE_WINDOW_MS (see
// activityService). The heartbeat client updates this every 45s while the tab
// is open; docs for users who never return simply go stale and stop appearing
// in the live view — no cleanup job needed.
const presenceSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    currentPath: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    currentTitle: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    sessionKey: {
      type: String,
      trim: true,
      maxlength: 64,
      default: '',
    },
    isTabVisible: {
      type: Boolean,
      default: true,
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 400,
      default: '',
    },
    device: {
      browser: { type: String, default: '' },
      os: { type: String, default: '' },
      type: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

// A doc expires shortly after the user's last heartbeat: "online" is defined
// by lastSeenAt within ONLINE_WINDOW_MS (90s), so a TTL a bit beyond that
// removes the doc once a user goes idle. Keeps the collection bounded to
// genuinely-active users — it never accumulates a row per account that signed
// in over the platform's lifetime.
presenceSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 130 });

presenceSchema.index({ lastSeenAt: -1 });

export const Presence = mongoose.model('Presence', presenceSchema);
