import mongoose, { Schema } from 'mongoose';

// Key/value settings store (runtime feature flags read by services). One doc
// per key; upsert keeps the collection tiny. Used today for the welcome-email
// toggle (key 'welcomeEmailEnabled'), extensible to future switches without
// redeploys or env churn.
const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const Setting = mongoose.model('Setting', settingSchema);