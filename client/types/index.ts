// User types
// 'staff' = holder of a custom role (see Role / RoleMeta below)
export type UserRole = 'student' | 'srt' | 'staff' | 'admin' | 'super-admin';

// Display metadata for a custom role, resolved from the server
export interface RoleMeta {
  id: string;
  name: string;
  label: string;
  color: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roleId?: string | null;
  roleMeta?: RoleMeta | null;
  /** Permission keys for custom-role ('staff') users; drives admin UI gating */
  permissions?: string[];
  picture?: string;
  studentId?: string;
  phoneNumber?: string;
  course?: string;
  followers?: string[];
  following?: string[];
  qcoins: number;
  freeDownloadsLeft: number;
  downloadPasses?: number;
}

// Admin role management types
export interface AdminRole {
  id: string;
  name: string;
  label: string;
  description: string;
  color: string;
  permissions: string[];
  isSystem: boolean;
  memberCount: number;
  createdAt?: string;
  updatedAt?: string;
}

// Wallet types
export type TransactionType = 'credit' | 'debit';
export type TransactionCategory = 'topup' | 'resume_download' | 'bonus' | 'refund';

export interface WalletTransaction {
  _id: string;
  userId: string;
  type: TransactionType;
  category: TransactionCategory;
  coins: number;
  rupees?: number | null;
  description: string;
  resumeId?: string | null;
  balanceAfter: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletBalance {
  qcoins: number;
  freeDownloadsLeft: number;
  downloadPasses?: number;
}

export type TopUpPackId = 'starter' | 'plus' | 'pro';

export interface TopUpPack {
  coins: number;
  rupees: number;
  label: string;
}

export type TopUpPacks = Record<TopUpPackId, TopUpPack>;

// Server response for POST /wallet/orders — everything Razorpay Checkout
// needs to open, plus the pack snapshot for the success toast.
export interface WalletTopupOrder {
  orderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
  pack: { id: TopUpPackId; coins: number; rupees: number; label: string };
}

// Fields Razorpay Checkout's handler returns on success
export interface RazorpayCheckoutSuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason?: string;
  metadata?: { order_id: string; payment_id?: string };
}

export interface RazorpayFailureResponse {
  error: RazorpayCheckoutError;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayCheckoutSuccess) => void;
  modal?: { ondismiss?: () => void; confirm_close?: boolean };
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (resp: RazorpayFailureResponse) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export interface TransactionMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface UserResponse {
  success: boolean;
  message?: string;
  user?: User;
}

export interface PublicUserProfile {
  user: {
    id: string;
    name: string;
    email: string;
    picture?: string;
    role: string;
    course: string;
    followersCount: number;
    followingCount: number;
  };
  isFollowing: boolean;
  lastPapers: PYQPaper[];
}

// Department types
export interface Department {
  _id: string;
  id: string;
  name: string;
  displayName: string;
  icon: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentDTO {
  id: string;
  name: string;
  displayName: string;
  icon?: string;
  description: string;
}

// Branch types
export interface Branch {
  _id: string;
  id: string;
  name: string;
  departmentId: string | Department;
  semesters: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchDTO {
  id: string;
  name: string;
  departmentId: string;
  semesters: number[];
}

// Session types
export interface Session {
  _id: string;
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionDTO {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
}

// PYQ types
export type ExamType = 'mid-term' | 'end-term';

export interface PYQPaper {
  _id: string;
  title: string;
  subjectName: string;
  subjectCode?: string;
  departmentId: string | Department;
  branchId: string | Branch;
  // Extra branches the paper also applies to (multi-branch uploads). Raw ids
  // from the public API; the admin listing populates them as Branch docs.
  additionalBranchIds?: Array<string | Branch>;
  sessionId: string | Session;
  semester: number;
  examType: ExamType;
  year: number;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  fileName: string;
  fileSize?: number;
  uploadedBy: string | User;
  views: number;
  downloads: number;
  viewCount: number;
  downloadCount: number;
  verified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadPYQDTO {
  departmentId: string;
  branchId: string;
  additionalBranchIds?: string[];
  sessionId: string;
  semester: number;
  subjectName: string;
  subjectCode?: string;
  examType: ExamType;
  year: number;
  pdf: File;
}

export interface PYQFilterQuery {
  departmentId?: string;
  branchId?: string;
  sessionId?: string;
  semester?: number;
  examType?: ExamType;
  subjectCode?: string;
  search?: string;
}

// Paper requests — students ask for papers they couldn't find
export interface PaperRequest {
  _id: string;
  departmentId: string | Department;
  branchId: string | Branch;
  subjectName: string;
  subjectCode?: string;
  examType: 'any' | ExamType;
  year?: number;
  note?: string;
  requestedBy: string | Pick<User, 'id' | 'name' | 'email' | 'picture'>;
  status: 'pending' | 'fulfilled' | 'rejected';
  reviewedBy?: string | Pick<User, 'id' | 'name' | 'email'>;
  messages?: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaperRequestDTO {
  departmentId: string;
  branchId: string;
  subjectName: string;
  subjectCode: string;
  examType: 'any' | ExamType;
  year: number;
  note?: string;
}

// Result of checking whether an exact paper already exists before requesting.
export interface PaperExistsResponse extends APIResponse<PYQPaper | null> {
  exists?: boolean;
  code?: string;
  paperId?: string;
  alreadyRequested?: boolean;
  existingRequest?: PaperRequest | null;
  /** Exam terms already uploaded for this code + year (e.g. ['mid-term']). */
  existingExamTypes?: ExamType[];
}

// API Response types
export interface APIResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  error?: string;
}

// ── Admin Mail Center types ─────────────────────────────────────────────────
export interface MailLogEntry {
  id: string;
  to: string;
  from: string;
  subject: string;
  kind: 'welcome' | 'campaign' | 'administrative' | 'other';
  status: 'sent' | 'failed';
  error?: string;
  preview?: string;
  user?: { id: string; name?: string; email?: string; picture?: string | null } | null;
  createdAt: string;
}

export interface InboundMailEntry {
  id: string;
  uid: number;
  from: string;
  to: string;
  subject: string;
  preview: string;
  mailType: 'plain' | 'bounce';
  receivedAt: string;
}

export interface UnifiedMailLog {
  id: string;
  ts: string;
  direction: 'sent' | 'received';
  from?: string;
  to?: string;
  subject: string;
  kind: string;
  status: 'sent' | 'failed' | 'synced' | 'bounced';
  error?: string;
  preview?: string;
}

export interface MailSettings {
  welcomeEmailEnabled: boolean;
  welcomeTemplate: MailTemplate | null;
  mailSetupDone: boolean;
  imapConfigured: boolean;
}

/** Compact user row for the compose recipient picker. */
export interface MailRecipientUser {
  id: string;
  name: string;
  email: string;
  picture?: string | null;
}

export interface MailTemplateSection {
  type: 'heading' | 'paragraph' | 'image' | 'button' | 'divider';
  text?: string;
  url?: string;
  imageUrl?: string;
  align?: 'left' | 'center' | 'right';
  fontSize?: number;
  color?: string;
  /** Button background color (buttons only) */
  bgColor?: string;
}

export interface MailTemplate {
  bannerUrl: string;
  heading: string;
  intro: string;
  sections: MailTemplateSection[];
  footer: string;
  email: string;
  /** When set, this raw HTML is sent verbatim (with {{placeholders}} substituted). */
  rawHtml?: string;
}

export interface NotifySettings {
  requestAck: boolean;
  requestFulfilled: boolean;
  requestAckTemplate?: MailTemplate;
  requestFulfilledTemplate?: MailTemplate;
}

// Report types
export interface Report {
  _id: string;
  paperId: PYQPaper;
  reportedBy: User;
  reason: 'wrong_file' | 'poor_quality' | 'wrong_metadata' | 'other';
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  messages?: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

// Resume builder types
export interface ResumeLink { _id?: string; label: string; url: string; }
export interface ResumeEducation { _id?: string; institution: string; degree: string; startDate: string; endDate: string; }
export interface ResumeExperience { _id?: string; company: string; role: string; description: string; achievements: string[]; startDate: string; endDate: string; }
export interface ResumeProject { _id?: string; name: string; url: string; description: string; achievements: string[]; startDate: string; endDate: string; }
export interface ResumeSkillGroup { _id?: string; title: string; items: string[]; }
export interface ResumePersonal { name: string; headline: string; email: string; phone: string; location: string; links: ResumeLink[]; }
export interface Resume {
  _id: string;
  title: string;
  personal: ResumePersonal;
  summary: string;
  education: ResumeEducation[];
  experience: ResumeExperience[];
  projects: ResumeProject[];
  skillGroups: ResumeSkillGroup[];
  achievements: string[];
  languages: string[];
  certifications: string[];
  createdAt: string;
  updatedAt: string;
}
export type ResumeDraft = Omit<Resume, '_id' | 'createdAt' | 'updatedAt'>;

// Event types
export interface InvertisEvent {
  _id?: string;
  id: string;
  title: string;
  category: string;
  date: string;
  /** Real sortable first-day date (ISO string). Optional for legacy rows. */
  startDate?: string;
  time: string;
  venue: string;
  organizer: string;
  description: string;
  longDescription: string;
  /** Rich HTML body from the admin editor; falls back to longDescription. */
  content?: string;
  image: string;
  featured?: boolean;
  /** 'draft' events are hidden from the public site (admin-only). */
  status?: 'draft' | 'published';
  registrationOpen: boolean;
  /** External registration link (Google Form, club page, ...). */
  registrationUrl?: string;
  timeline: string[];
  rules: string[];
  createdAt?: string;
  updatedAt?: string;
}

// ── Clubs (Abhiruchi) ────────────────────────────────────────────────────
// Mirrors the Club model in server/src/models/Club.js. Every section of
// the public club page is a field here, so the whole page is editable
// from the admin console.

export interface ClubStat {
  label: string;
  value: string;
}

export interface ClubActivity {
  title: string;
  description: string;
  cadence?: string;
}

export interface ClubWing {
  name: string;
  description: string;
}

export interface ClubMember {
  role: string;
  name: string;
  branch?: string;
  note?: string;
}

export type ClubAchievementKind = 'Award' | 'Milestone' | 'Record' | 'Recognition';

export interface ClubAchievement {
  title: string;
  detail?: string;
  year?: string;
  kind?: ClubAchievementKind;
}

export interface ClubTestimonial {
  quote: string;
  name: string;
  detail?: string;
}

export interface ClubFaq {
  question: string;
  answer: string;
}

export interface ClubLogistic {
  label: string;
  value: string;
}

export interface ClubJoinStep {
  step?: string;
  title: string;
  description: string;
}

export interface ClubEvent {
  _id?: string;
  title: string;
  description?: string;
  month: string;
  day: string;
  time?: string;
  venue?: string;
  category?: string;
  agenda?: string[];
  seats?: number;
  seatsLeft?: number;
  audience?: string;
  rsvpDeadline?: string;
  perks?: string[];
  registrationOpen?: boolean;
  isPublished?: boolean;
}

export interface Club {
  _id?: string;
  id: string;
  name: string;
  tagline: string;
  shortDescription?: string;
  longDescription?: string;
  mission?: string;
  vision?: string;
  coordinator?: string;
  coordinatorRole?: string;
  coordinatorNote?: string;
  img?: string;
  color?: string;
  colorLight?: string;
  colorDark?: string;
  gradient?: string;
  icon?: string;
  highlights?: string[];
  stats?: ClubStat[];
  activities?: ClubActivity[];
  wings?: ClubWing[];
  team?: ClubMember[];
  achievements?: ClubAchievement[];
  testimonials?: ClubTestimonial[];
  faqs?: ClubFaq[];
  logistics?: ClubLogistic[];
  joinProcess?: ClubJoinStep[];
  events?: ClubEvent[];
  displayOrder?: number;
  isActive?: boolean;
  adminNote?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * The booking state. Attendance is deliberately separate — see the
 * `attended` flag on ClubRegistration.
 */
export type ClubRegistrationStatus =
  | 'pending'
  | 'confirmed'
  | 'waitlist'
  | 'cancelled';

export interface ClubRegistration {
  _id: string;
  clubId: string;
  eventId: string;
  eventTitle?: string;
  eventDate?: string;
  eventTime?: string;
  eventVenue?: string;
  name: string;
  email: string;
  branch?: string;
  year?: string;
  interests?: string[];
  /** A note the student left with their booking. */
  studentNote?: string;
  /** An admin's note about this registration. */
  notes?: string;
  source?: 'student' | 'admin';
  bookingMethod?: 'online' | 'manual';
  /** How many seats this booking takes (a group booking may take more). */
  seats?: number;
  status: ClubRegistrationStatus;
  /** Whether the student actually showed up — tracked independently. */
  attended?: boolean;
  attendedAt?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  /** Who cancelled: 'student' or 'admin'. */
  cancelledBy?: string;
  checkedInAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClubRegistrationStats {
  total: number;
  pending: number;
  confirmed: number;
  waitlist: number;
  cancelled: number;
  attended: number;
}

export interface ClubRegistrationSummaryRow {
  clubId: string;
  name: string;
  isActive: boolean;
  events: number;
  registrations: number;
}

export interface ClubRsvpPayload {
  eventId: string;
  name: string;
  email: string;
  branch?: string;
  year?: string;
  interests?: string[];
  studentNote?: string;
  seats?: number;
}

// Admin user management types
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  picture: string | null;
  role: UserRole;
  roleId?: string | null;
  roleLabel?: string | null;
  roleColor?: string | null;
  isActive: boolean;
  studentId: string;
  course: string;
  points: number;
  qcoins: number;
  lastLogin: string;
  joinedAt: string;
}

export interface AdminUserListMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface UserStats {
  total: number;
  active: number;
  admins: number;
  srt: number;
  staff: number;
  superAdmins: number;
  banned: number;
}

export interface AdminUserDetail {
  user: AdminUser & {
    phoneNumber: string;
    freeDownloadsLeft: number;
    followers: number;
    following: number;
    rank: number;
  };
  stats: {
    verifiedUploads: number;
    totalUploads: number;
    syllabusUploads: number;
    reportsFiled: number;
    reportsPending: number;
    bugsFiled: number;
  };
  badges: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    requirement: string;
    current: number;
    target: number;
    completed: boolean;
  }[];
  transactions: {
    id: string;
    type: string;
    category: string;
    coins: number;
    rupees?: number | null;
    description: string;
    balanceAfter: number;
    createdAt: string;
  }[];
  activity: {
    id: string;
    type: string;
    points: number;
    description: string;
    createdAt: string;
  }[];
}

export type SponsorTier = 'supporter' | 'benefactor' | 'patron';

export interface Sponsor {
  _id: string;
  name: string;
  batch: string;
  email: string;
  message: string;
  tier: SponsorTier;
  amount: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSponsorDTO {
  name: string;
  batch?: string;
  email?: string;
  message?: string;
  tier: SponsorTier;
  amount?: number;
  isFeatured?: boolean;
  isActive?: boolean;
}

// ── Activity monitoring & marketing analytics ───────────────────────────────
export type ActivityType =
  | 'page_view'
  | 'paper_view'
  | 'paper_download'
  | 'search'
  | 'login'
  | 'logout'
  | 'signup'
  | 'request_create'
  | 'report_create'
  | 'bug_report'
  | 'resume_create'
  | 'profile_update';

export interface DeviceInfo {
  browser: string;
  os: string;
  type: string;
}

export interface ActivityEvent {
  _id: string;
  user:
    | string
    | {
        id?: string;
        _id?: string;
        name: string;
        email: string;
        picture?: string | null;
        role?: UserRole;
      };
  type: ActivityType;
  title: string;
  path: string;
  entityType: string;
  entityId: string;
  sessionKey: string;
  referrer: string;
  referrerDomain?: string;
  subjectName?: string;
  departmentName?: string;
  branchName?: string;
  meta?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
  device?: DeviceInfo;
  createdAt: string;
}

export interface PresenceInfo {
  user?: { id?: string; _id?: string; name: string; email: string; picture?: string | null; role?: UserRole; lastLogin?: string };
  lastSeenAt: string;
  currentPath: string;
  currentTitle: string;
  isTabVisible?: boolean;
  device?: DeviceInfo;
  ip?: string | null;
}

export interface SeriesPoint {
  date: string;
  count: number;
  events?: number;
}

export interface TopItem {
  path?: string;
  title?: string;
  query?: string;
  entityId?: string;
  name?: string;
  domain?: string;
  subjectName?: string;
  departmentName?: string;
  count: number;
  users: number;
}

export interface ActivityOverview {
  onlineNow: number;
  activeToday: number;
  activeWeek: number;
  activeMonth: number;
  eventsToday: number;
  viewsToday: number;
  downloadsToday: number;
  newToday: number;
  new24h: number;
  newWeek: number;
  new30d: number;
  totalUsers: number;
  topPages: TopItem[];
  topPapers: TopItem[];
  topSearches: TopItem[];
}

export interface ActivityUserSummary {
  user: {
    id: string;
    name: string;
    email: string;
    picture: string | null;
    role: UserRole;
    roleLabel?: string | null;
    roleColor?: string | null;
    course?: string;
    studentId?: string;
    phoneNumber?: string;
    isActive: boolean;
    lastLogin?: string;
    joinedAt?: string;
    createdAt?: string;
  };
  presence: PresenceInfo | null;
  stats: {
    totalEvents: number;
    paperViews: number;
    downloads: number;
    searches: number;
    logins: number;
    activeDays30: number;
    firstEventAt: string | null;
    lastSeenAt: string | null;
  };
  sessions: {
    sessionKey: string;
    firstAt: string;
    lastAt: string;
    events: number;
    device?: DeviceInfo;
  }[];
}

export type LeadStatus = 'hot' | 'warm' | 'cold' | 'new';

export interface MarketingLead {
  id: string;
  _id?: string;
  name: string;
  email: string;
  picture: string | null;
  role: UserRole;
  course?: string;
  studentId?: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  lastSeenAt: string | null;
  currentPath?: string;
  device?: DeviceInfo | null;
  online: boolean;
  events30: number;
  paperViews30: number;
  downloads30: number;
  status: LeadStatus;
}

export interface MarketingOverview {
  totalStudents: number;
  totalUsers?: number;
  staffCount?: number;
  newToday: number;
  new24h: number;
  newWeek: number;
  newMonth: number;
  onlineNow: number;
  activeToday: number;
  activeWeek: number;
  activeMonth: number;
  dormant: number;
  activated: number;
  activationRate: number;
  topReferrers: TopItem[];
  topDepartments: TopItem[];
  topBranches: TopItem[];
  topPapers: TopItem[];
  topSearches: TopItem[];
}

export interface MarketingLeadDetail {
  user: {
    id: string;
    name: string;
    email: string;
    picture: string | null;
    role: UserRole;
    course?: string;
    studentId?: string;
    phoneNumber?: string;
    isActive: boolean;
    createdAt: string;
    lastLogin?: string;
    points?: number;
    qcoins?: number;
  };
  presence: { lastSeenAt: string; currentPath: string; currentTitle: string; device?: DeviceInfo } | null;
  online: boolean;
  lastSeenAt: string | null;
  status: LeadStatus;
  stats: {
    totalEvents: number;
    events30: number;
    paperViews30: number;
    downloads30: number;
    searches30: number;
    logins30: number;
    activeDays30: number;
  };
  topPapers: { entityId: string; title: string; subjectName?: string; departmentName?: string; views: number; downloads: number; lastAt: string }[];
  topDepartments: { name: string; count: number }[];
  recent: { _id: string; type: ActivityType; title: string; path: string; createdAt: string; subjectName?: string }[];
}

// ── DB Backup & Restore (super-admin) ───────────────────────────────────────

export interface BackupCollectionStat {
  name: string;
  count: number;
  size: number;
}

export interface BackupStats {
  database: string;
  host: string;
  collections: BackupCollectionStat[];
  totalDocuments: number;
  totalSize: number;
}

export type BackupJobKind = 'to-uri' | 'import';
export type BackupJobStatus = 'running' | 'done' | 'error';

export interface BackupJobProgress {
  phase: string;
  collection: string | null;
  docsDone: number;
  docsTotal: number;
  collectionsDone: number;
  collectionsTotal: number;
}

export interface BackupCollectionResult {
  name: string;
  source: number;
  written: number;
  targetCount?: number;
}

export interface BackupJob {
  id: string;
  kind: BackupJobKind;
  status: BackupJobStatus;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
  progress: BackupJobProgress;
  result: {
    target?: { database: string; uri: string };
    mode?: 'replace' | 'merge';
    database?: string;
    dropTarget?: boolean;
    collections?: BackupCollectionResult[];
    totalDocuments?: number;
    durationMs?: number;
  } | null;
}

export interface ImportPreviewSummary {
  exportedAt: string | null;
  database: string | null;
  totalDocuments: number;
  collections: { name: string; count: number }[];
}

// Analytics time range for the chart pickers (Vercel-style)
export type StatRange = '24h' | '7d' | '30d' | '90d';

// One row in a chart drill-down (who joined / who was active in a range)
export interface ActivityUserRow {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  picture?: string | null;
  role?: UserRole;
  course?: string;
  studentId?: string;
  phoneNumber?: string;
  createdAt?: string;
  lastLogin?: string;
  eventCount?: number;
}

// ── Support ticket thread ────────────────────────────────────────────────────
export interface SupportMessage {
  _id?: string;
  sender: string | { _id?: string; id?: string; name: string; email?: string; picture?: string | null; role?: UserRole };
  senderRole: UserRole | 'srt';
  body: string;
  createdAt: string;
}

// ── Platform Settings & Feature Toggles ──────────────────────────────────────
export interface PublicSettings {
  instagramPopupEnabled: boolean;
  welcomeEmailEnabled: boolean;
  paperRequestAckEnabled: boolean;
  paperRequestFulfilledEnabled: boolean;
  careerApplicationAckEnabled: boolean;
}

export interface PlatformSettings {
  instagramPopupEnabled: boolean;
  // Email feature toggles
  welcomeEmailEnabled: boolean;
  paperRequestAckEnabled: boolean;
  paperRequestFulfilledEnabled: boolean;
  careerApplicationAckEnabled: boolean;
}

// ── Career Applications ────────────────────────────────────────────────────────
export type CareerApplicationStatus = 'pending' | 'under_review' | 'shortlisted' | 'rejected' | 'hired';

export type CareerDomain = 
  | 'Canva designer'
  | 'Video Editor'
  | 'Support and Resource Team (SRT)'
  | 'Developers'
  | 'Content writer'
  | 'Technical support'
  | 'Social media manager'
  | 'Marketing';

export type CareerSemester = '1st' | '2nd' | '3rd' | '4th' | '5th' | '6th' | '7th' | '8th';

export type CareerLocation = 'Bareilly' | 'Rampur' | 'Shahjahanpur' | 'Other';

export type CareerProficiency = 
  | 'Beginner (Learning the basics)'
  | 'Intermediate (Have some hands-on experience)'
  | 'Advanced (Confident and have done projects)';

export type CareerHeardFrom = 
  | 'Friend / Classmate'
  | 'Social Media (Instagram / WhatsApp)'
  | 'Invertis Confession'
  | 'InvertisPrep Website'
  | 'Other';

export type CareerAvailability = 
  | 'Yes, fully available'
  | 'Available with minor scheduling constraints'
  | 'Not sure yet';

export interface CareerApplication {
  _id: string;
  fullName: string;
  email: string;
  whatsappNumber: string;
  departmentBranch: string;
  currentSemester: CareerSemester;
  currentLocation: CareerLocation;
  customLocation?: string;
  appliedDomain: CareerDomain;
  hybridComfortable: boolean;
  interestReason: string;
  skills: string;
  proficiencyLevel: CareerProficiency;
  hasProjects: boolean;
  projectDescription?: string;
  resumeLink: string;
  portfolioLink?: string;
  heardFrom: CareerHeardFrom;
  customHeardFrom?: string;
  availability: CareerAvailability;
  additionalNotes?: string;
  status: CareerApplicationStatus;
  submittedBy?: {
    id: string;
    name: string;
    email: string;
    picture?: string | null;
    studentId?: string;
  };
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
  };
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CareerApplicationInput {
  // Section 1
  fullName: string;
  email: string;
  whatsappNumber: string;
  departmentBranch: string;
  currentSemester: CareerSemester;
  currentLocation: CareerLocation;
  customLocation?: string;
  // Section 2
  appliedDomain: CareerDomain;
  hybridComfortable: boolean;
  interestReason: string;
  // Section 3
  skills: string;
  proficiencyLevel: CareerProficiency;
  hasProjects: boolean;
  projectDescription?: string;
  // Section 4
  resumeLink: string;
  portfolioLink?: string;
  // Section 5
  heardFrom: CareerHeardFrom;
  customHeardFrom?: string;
  availability: CareerAvailability;
  additionalNotes?: string;
}

export interface CareerApplicationListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CareerApplicationStatus;
  domain?: CareerDomain;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

export interface CareerApplicationUpdate {
  status?: CareerApplicationStatus;
  reviewNotes?: string;
}

export interface CareerApplicationStats {
  byStatus: Record<CareerApplicationStatus, number>;
  byDomain: Record<string, number>;
  recentWeek: number;
  total: number;
}

/** Light shape of the signed-in user's own submissions (GET /careers/applications/me) */
export interface CareerApplicationStatusSummary {
  _id: string;
  status: CareerApplicationStatus;
  appliedDomain: CareerDomain;
  createdAt: string;
  reviewedAt?: string;
}

