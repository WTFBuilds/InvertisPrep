import mongoose, { Schema } from 'mongoose';

// Every tracked user action. Written by the main server (page views, auth
// events, syllabus PDFs, requests/reports/bugs/resumes) AND by the pdf-service
// (paper views, downloads, searches) — both services share the same database,
// so the collection is one and the same. Never add a TTL here: activity
// history is the product.
export const ACTIVITY_TYPES = [
  'page_view', // client router navigation
  'paper_view', // PYQ/syllabus document opened
  'paper_download', // document downloaded
  'search', // paper search query
  'login',
  'logout',
  'signup',
  'request_create', // paper request submitted
  'report_create', // paper reported
  'bug_report', // bug submitted
  'resume_create', // resume created/updated
  'profile_update',
];

const activityLogSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ACTIVITY_TYPES,
    },
    // Human-readable summary, e.g. "Operations Research · 2022" or "/admin/users"
    title: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    // App route the event happened on
    path: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    // 'paper' | 'syllabus' | 'page' | '' — lets queries group entity kinds
    entityType: {
      type: String,
      trim: true,
      maxlength: 40,
      default: '',
    },
    entityId: {
      type: String,
      trim: true,
      maxlength: 64,
      default: '',
    },
    // Client-generated per-tab id (sessionStorage UUID) — groups a browsing
    // session so the monitor can reconstruct "sessions" with start/end.
    sessionKey: {
      type: String,
      trim: true,
      maxlength: 64,
      default: '',
    },
    referrer: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    // Hostname only, parsed at write time — marketing acquisition report
    referrerDomain: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    // Denormalized paper context — populated at write time so marketing
    // interest reports never need a join against the pdf-service collections.
    subjectName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    departmentName: {
      type: String,
      trim: true,
      maxlength: 150,
      default: '',
    },
    branchName: {
      type: String,
      trim: true,
      maxlength: 150,
      default: '',
    },
    // Small event-specific extras (e.g. search query) — keep it tiny
    meta: {
      type: Schema.Types.Mixed,
      default: {},
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
      type: { type: String, default: '' }, // desktop | mobile | tablet
    },
  },
  {
    timestamps: true,
    // createdAt is the event time; do not let re-saves bump anything
    immutable: false,
  }
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ type: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, type: 1, entityId: 1, createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
