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
  time: string;
  venue: string;
  organizer: string;
  description: string;
  longDescription: string;
  image: string;
  featured?: boolean;
  registrationOpen: boolean;
  timeline: string[];
  rules: string[];
  createdAt?: string;
  updatedAt?: string;
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
  sender: string | { _id?: string; id?: string; name: string; email?: string; picture?: string | null; role?: UserRole };
  senderRole: UserRole | 'srt';
  body: string;
  createdAt: string;
}
