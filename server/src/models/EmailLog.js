import mongoose, { Schema } from 'mongoose';

// Every outbound email the platform sends — welcome mails, admin-broadcast
// campaigns and future sends — is recorded here so staff can audit who was
// emailed when, and whether the send succeeded. Written fire-and-forget by
// mailService so a logging failure never breaks a send.
const emailLogSchema = new Schema(
  {
    to: { type: String, required: true, lowercase: true, trim: true, index: true },
    // The user this mail was sent to, when it maps to a platform account
    // (welcome mails, campaigns). Sparse so ad-hoc sends can omit it.
    userId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true, index: true },
    from: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, default: '' },
    // What generated this send — welcome | campaign | administrative | other
    kind: { type: String, enum: ['welcome', 'campaign', 'administrative', 'other'], default: 'other', index: true },
    // Which HTML template was used (welcome.html, or a custom campaign template)
    template: { type: String, trim: true, default: '' },
    messageId: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['sent', 'failed'], default: 'sent', index: true },
    error: { type: String, trim: true, default: '' },
    // A short plain-text preview for list rows (cheap to send in list payloads).
    preview: { type: String, default: '', maxlength: 600 },
    // The rendered HTML actually sent, so Sent logs can be opened and read in
    // full. Capped so a large campaign can't bloat a single document.
    html: { type: String, default: '', maxlength: 102400 },
  },
  { timestamps: true }
);

emailLogSchema.index({ createdAt: -1 });

export const EmailLog = mongoose.model('EmailLog', emailLogSchema);