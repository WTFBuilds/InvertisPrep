import mongoose, { Schema } from 'mongoose';

// Email notifications for paper requests. Kept as a standalone config collection
// so the admin UI can flip each notification independently (request
// acknowledgement, fulfillment notice).
const emailNotifySchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const EmailNotify = mongoose.model('EmailNotify', emailNotifySchema);