import mongoose, { Schema } from 'mongoose';

// Mirror of server/src/models/ActivityLog.js — both services share one MongoDB,
// so this resolves to the very same `activitylogs` collection the main server
// writes. The pdf-service only WRITES here (paper views, downloads, searches);
// all reads happen through the main server's admin endpoints. Keep the two
// schemas in sync — type keys are stable strings, never rename one side.
export const ACTIVITY_TYPES = [
  'page_view',
  'paper_view',
  'paper_download',
  'search',
  'login',
  'logout',
  'signup',
  'request_create',
  'report_create',
  'bug_report',
  'resume_create',
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
    title: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    path: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
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
    referrerDomain: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
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
      type: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ type: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, type: 1, entityId: 1, createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
