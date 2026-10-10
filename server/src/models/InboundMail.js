import mongoose, { Schema } from 'mongoose';

// Inbound mail synced from the Hostinger IMAP mailbox (IMAP_* env vars).
// Synced on demand from the admin mailbox page. Mail arriving at alias
// addresses (no-reply@ → support@, etc.) all lands in this one mailbox and is
// captured here.
const inboundMailSchema = new Schema(
  {
    // IMAP UID within the mailbox. Unique so re-syncs upsert instead of
    // duplicating. If the mailbox UIDVALIDITY ever changes the sync service
    // resets its watermark and re-fetches from the recent window.
    uid: { type: Number, required: true, unique: true },
    from: { type: String, trim: true, default: '' },
    to: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, default: '' },
    // Plain-text body (previews and fallbacks); capped so the collection stays lean
    text: { type: String, default: '', maxlength: 16384 },
    // Original HTML body; capped to keep a few large marketing mails from
    // bloating the DB. Rendered in the admin viewer inside a sandboxed iframe.
    html: { type: String, default: '', maxlength: 524288 },
    messageId: { type: String, trim: true, default: '' },
    // 'plain' (normal mail) or 'bounce' (undeliverable notification). Detected
    // from the envelope Return-Path / X-Failed-Recipients headers.
    mailType: { type: String, enum: ['plain', 'bounce'], default: 'plain', index: true },
    receivedAt: { type: Date, default: null },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

inboundMailSchema.index({ receivedAt: -1 });

export const InboundMail = mongoose.model('InboundMail', inboundMailSchema);