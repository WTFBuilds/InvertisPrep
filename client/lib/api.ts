import axios, { AxiosInstance } from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  User,
  Department,
  CreateDepartmentDTO,
  Branch,
  CreateBranchDTO,
  Session,
  CreateSessionDTO,
  PYQPaper,
  PYQFilterQuery,
  PaperRequest,
  CreatePaperRequestDTO,
  PaperExistsResponse,
  APIResponse,
  UserResponse,
  PublicUserProfile,
  Report,
  Resume,
  ResumeDraft,
  ResumeExperience,
  ResumeProject,
  ResumeSkillGroup,
  WalletTransaction,
  WalletBalance,
  TopUpPack,
  TopUpPackId,
  TopUpPacks,
  WalletTopupOrder,
  RazorpayCheckoutSuccess,
  TransactionMeta,
  TransactionType,
  InvertisEvent,
  Club,
  ClubEvent,
  ClubRegistration,
  ClubRegistrationStats,
  ClubRegistrationSummaryRow,
  ClubRsvpPayload,
  UserRole,
  AdminUser,
  AdminUserListMeta,
  UserStats,
  AdminUserDetail,
  AdminRole,
  Sponsor,
  CreateSponsorDTO,
  MailLogEntry,
  InboundMailEntry,
  MailTemplateSection,
  MailSettings,
  MailTemplate,
  MailRecipientUser,
  UnifiedMailLog,
  NotifySettings,
  ActivityEvent,
  ActivityUserRow,
  SeriesPoint,
  StatRange,
  ActivityOverview,
  ActivityUserSummary,
  PresenceInfo,
  MarketingLead,
  MarketingOverview,
  MarketingLeadDetail,
  BackupStats,
  BackupJob,
  ImportPreviewSummary,
  PublicSettings,
  PlatformSettings,
} from '@/types';

// Same-origin proxy paths — next.config.ts rewrites forward these to the
// backend services (main server + PDF microservice) using SERVER-ONLY env
// vars. No NEXT_PUBLIC_* URLs are exposed in the browser bundle, and cookies
// (refresh token) work naturally as first-party.
const API_URL = '/backend';
const PDF_SERVICE_URL = '/pdfapi';

// Create axios instance for main API
// withCredentials: the refresh cookie is set by the backend on a different
// origin (Vercel → Render), so the browser must be allowed to store/send it
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Create axios instance for PDF service
const pdfServiceClient: AxiosInstance = axios.create({
  baseURL: PDF_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token (for both clients)
const addAuthToken = (config: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

apiClient.interceptors.request.use(addAuthToken);
pdfServiceClient.interceptors.request.use(addAuthToken);

// ── Token refresh ──────────────────────────────────────────────────────────
// Access tokens live 15 minutes; the refresh token is an httpOnly cookie valid
// for 7/30 days. On a 401 we try ONE shared /auth/refresh call, store the new
// access token, and retry the original request. Only when the refresh itself
// fails do we clear state and redirect to login.
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    // The refresh cookie rides along automatically (same-origin credentials)
    const { data } = await apiClient.post<{ success: boolean; token: string }>(
      '/auth/refresh'
    );
    if (data?.success && data?.token) {
      localStorage.setItem('token', data.token);
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
};

const getRefreshedToken = (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

const forceLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // Don't auto-redirect if we're already on a view or login page to avoid loops
  const isViewing = window.location.pathname.includes('/view/');
  const isLogin = window.location.pathname.includes('/login');

  if (!isViewing && !isLogin) {
    // Carry the current location so the login page can return here after
    // re-authentication (in-app relative paths only — never an open redirect).
    const returnTo = `${window.location.pathname}${window.location.search}`;
    const isSafeReturn =
      returnTo.startsWith('/') && !returnTo.startsWith('//') && !returnTo.startsWith('/\\');

    if (window.location.pathname.startsWith('/admin')) {
      window.location.href = '/admin/login';
    } else if (isSafeReturn) {
      window.location.href = `/login?returnUrl=${encodeURIComponent(returnTo)}`;
    } else {
      window.location.href = '/login';
    }
  }
};

const makeResponseInterceptor = (client: AxiosInstance) => async (error: any) => {
  const original = error?.config;
  const status = error?.response?.status;
  const isRefreshCall = original?.url?.includes('/auth/refresh');

  // A 401 with a stored token means the access token expired — attempt one
  // refresh + retry (guarded by _retried so a second 401 falls through).
  if (
    status === 401 &&
    original &&
    !original._retried &&
    !isRefreshCall &&
    typeof window !== 'undefined' &&
    localStorage.getItem('token')
  ) {
    original._retried = true;
    const newToken = await getRefreshedToken();
    if (newToken) {
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newToken}`;
      return client.request(original); // retry on the same instance
    }
    forceLogout();
  } else if (status === 401) {
    forceLogout();
  }
  return Promise.reject(error);
};

apiClient.interceptors.response.use((response) => response, makeResponseInterceptor(apiClient));
pdfServiceClient.interceptors.response.use((response) => response, makeResponseInterceptor(pdfServiceClient));

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  googleLogin: async (token: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/google-login', { token });
    return data;
  },

  refresh: async (): Promise<{ success: boolean; token: string }> => {
    const { data } = await apiClient.post<{ success: boolean; token: string }>('/auth/refresh');
    return data;
  },

  getCurrentUser: async (): Promise<UserResponse> => {
    const { data } = await apiClient.get<UserResponse>('/auth/me');
    return data;
  },

  updateProfile: async (profileData: { name: string; studentId: string; phoneNumber: string; course: string }): Promise<UserResponse> => {
    const { data } = await apiClient.put<UserResponse>('/auth/profile', profileData);
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Continue with client-side logout even if server call fails
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Department API
export const departmentApi = {
  getAll: async (): Promise<APIResponse<Department[]>> => {
    const { data } = await apiClient.get<APIResponse<Department[]>>('/departments');
    return data;
  },

  getById: async (id: string): Promise<APIResponse<Department>> => {
    const { data } = await apiClient.get<APIResponse<Department>>(`/departments/${id}`);
    return data;
  },

  create: async (department: CreateDepartmentDTO): Promise<APIResponse<Department>> => {
    const { data } = await apiClient.post<APIResponse<Department>>('/departments', department);
    return data;
  },

  update: async (id: string, updates: Partial<Department>): Promise<APIResponse<Department>> => {
    const { data } = await apiClient.put<APIResponse<Department>>(`/departments/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<APIResponse> => {
    const { data } = await apiClient.delete<APIResponse>(`/departments/${id}`);
    return data;
  },

  getBranches: async (departmentId: string): Promise<APIResponse<Branch[]>> => {
    const { data } = await apiClient.get<APIResponse<Branch[]>>(`/departments/${departmentId}/branches`);
    return data;
  },
};

// Branch API
export const branchApi = {
  getAll: async (): Promise<APIResponse<Branch[]>> => {
    const { data } = await apiClient.get<APIResponse<Branch[]>>('/branches');
    return data;
  },

  create: async (branch: CreateBranchDTO): Promise<APIResponse<Branch>> => {
    const { data } = await apiClient.post<APIResponse<Branch>>('/branches', branch);
    return data;
  },

  update: async (id: string, updates: Partial<Branch>): Promise<APIResponse<Branch>> => {
    const { data } = await apiClient.put<APIResponse<Branch>>(`/branches/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<APIResponse> => {
    const { data } = await apiClient.delete<APIResponse>(`/branches/${id}`);
    return data;
  },
};

// Sponsor API
export const sponsorApi = {
  getAll: async (): Promise<APIResponse<Sponsor[]>> => {
    const { data } = await apiClient.get<APIResponse<Sponsor[]>>('/sponsors');
    return data;
  },

  getAllAdmin: async (): Promise<APIResponse<Sponsor[]>> => {
    const { data } = await apiClient.get<APIResponse<Sponsor[]>>('/sponsors/all');
    return data;
  },

  create: async (sponsor: CreateSponsorDTO): Promise<APIResponse<Sponsor>> => {
    const { data } = await apiClient.post<APIResponse<Sponsor>>('/sponsors', sponsor);
    return data;
  },

  update: async (id: string, updates: Partial<Sponsor>): Promise<APIResponse<Sponsor>> => {
    const { data } = await apiClient.put<APIResponse<Sponsor>>(`/sponsors/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<APIResponse> => {
    const { data } = await apiClient.delete<APIResponse>(`/sponsors/${id}`);
    return data;
  },
};

// Session API
export const sessionApi = {  getAll: async (): Promise<APIResponse<Session[]>> => {
    const { data } = await apiClient.get<APIResponse<Session[]>>('/sessions');
    return data;
  },

  create: async (session: CreateSessionDTO): Promise<APIResponse<Session>> => {
    const { data } = await apiClient.post<APIResponse<Session>>('/sessions', session);
    return data;
  },

  update: async (id: string, updates: Partial<Session>): Promise<APIResponse<Session>> => {
    const { data } = await apiClient.put<APIResponse<Session>>(`/sessions/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<APIResponse> => {
    const { data } = await apiClient.delete<APIResponse>(`/sessions/${id}`);
    return data;
  },
};

// PYQ API - calls PDF service directly
export const pyqApi = {
  upload: async (formData: FormData): Promise<APIResponse<PYQPaper>> => {
    const { data } = await pdfServiceClient.post<APIResponse<PYQPaper>>('/pyq/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  uploadPublic: async (formData: FormData): Promise<APIResponse<PYQPaper>> => {
    const { data } = await pdfServiceClient.post<APIResponse<PYQPaper>>('/pyq/upload-public', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  getDailyUploadCount: async (): Promise<APIResponse<{ count: number; limit: number; isExempt: boolean }>> => {
    const { data } = await pdfServiceClient.get<APIResponse<{ count: number; limit: number; isExempt: boolean }>>('/pyq/upload-count');
    return data;
  },

  getFiltered: async (filters: PYQFilterQuery): Promise<APIResponse<PYQPaper[]>> => {
    const { data } = await pdfServiceClient.get<APIResponse<PYQPaper[]>>('/pyq', { params: filters });
    return data;
  },

  getAll: async (params?: Record<string, any>): Promise<APIResponse<PYQPaper[]>> => {
    const { data } = await pdfServiceClient.get<APIResponse<PYQPaper[]>>('/pyq/all', { params });
    return data;
  },

  trackDownload: async (id: string): Promise<void> => {
    await pdfServiceClient.post(`/pyq/${id}/download`);
  },

  trackView: async (id: string): Promise<void> => {
    await pdfServiceClient.post(`/pyq/${id}/view`);
  },

  verify: async (id: string): Promise<APIResponse<PYQPaper>> => {
    const { data } = await pdfServiceClient.patch<APIResponse<PYQPaper>>(`/pyq/${id}/verify`);
    return data;
  },

  update: async (id: string, updates: Partial<PYQPaper>): Promise<APIResponse<PYQPaper>> => {
    const { data } = await pdfServiceClient.put<APIResponse<PYQPaper>>(`/pyq/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<APIResponse> => {
    const { data } = await pdfServiceClient.delete<APIResponse>(`/pyq/${id}`);
    return data;
  },
};

export const syllabusApi = {
  upload: async (formData: FormData): Promise<APIResponse<any>> => {
    const { data } = await apiClient.post<APIResponse<any>>('/syllabus/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  getAll: async (): Promise<APIResponse<any[]>> => {
    const { data } = await apiClient.get<APIResponse<any[]>>('/syllabus/all');
    return data;
  },

  getFiltered: async (filters?: Record<string, any>): Promise<APIResponse<any[]>> => {
    const { data } = await apiClient.get<APIResponse<any[]>>('/syllabus', { params: filters });
    return data;
  },

  delete: async (id: string): Promise<APIResponse> => {
    const { data } = await apiClient.delete<APIResponse>(`/syllabus/${id}`);
    return data;
  },
};

// User API
export const userApi = {
  getProfile: async (id: string): Promise<APIResponse<PublicUserProfile>> => {
    const { data } = await apiClient.get<APIResponse<PublicUserProfile>>(`/users/${id}`);
    return data;
  },
  follow: async (id: string): Promise<APIResponse<void>> => {
    const { data } = await apiClient.post<APIResponse<void>>(`/users/${id}/follow`);
    return data;
  },
  unfollow: async (id: string): Promise<APIResponse<void>> => {
    const { data } = await apiClient.post<APIResponse<void>>(`/users/${id}/unfollow`);
    return data;
  },
};

// Admin User Management API
export const adminUserApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole | 'all';
    status?: 'active' | 'banned' | 'all';
    sort?: 'newest' | 'oldest' | 'name' | 'points' | 'lastLogin';
  }): Promise<APIResponse<AdminUser[]> & { meta?: AdminUserListMeta }> => {
    const query: Record<string, unknown> = {};
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    if (params?.search) query.search = params.search;
    if (params?.role && params.role !== 'all') query.role = params.role;
    if (params?.status && params.status !== 'all') query.status = params.status;
    if (params?.sort && params.sort !== 'newest') query.sort = params.sort;
    const { data } = await apiClient.get<APIResponse<AdminUser[]> & { meta?: AdminUserListMeta }>(
      '/admin/users',
      { params: query }
    );
    return data;
  },

  stats: async (): Promise<APIResponse<UserStats>> => {
    const { data } = await apiClient.get<APIResponse<UserStats>>('/admin/users/stats');
    return data;
  },

  get: async (id: string): Promise<APIResponse<AdminUserDetail>> => {
    const { data } = await apiClient.get<APIResponse<AdminUserDetail>>(`/admin/users/${id}`);
    return data;
  },

  updateRole: async (id: string, role: UserRole, roleId?: string | null): Promise<APIResponse> => {
    const { data } = await apiClient.patch<APIResponse>(`/admin/users/${id}/role`, {
      role,
      roleId: roleId ?? undefined,
    });
    return data;
  },

  updateStatus: async (id: string, isActive: boolean): Promise<APIResponse> => {
    const { data } = await apiClient.patch<APIResponse>(`/admin/users/${id}/status`, { isActive });
    return data;
  },

  remove: async (id: string): Promise<APIResponse> => {
    const { data } = await apiClient.delete<APIResponse>(`/admin/users/${id}`);
    return data;
  },

  // Create a new account from the admin console (super-admin only)
  create: async (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    roleId?: string | null;
    studentId?: string;
    phoneNumber?: string;
    course?: string;
  }): Promise<APIResponse<{ id: string; email: string; role: UserRole }>> => {
    const { data } = await apiClient.post<APIResponse<{ id: string; email: string; role: UserRole }>>(
      '/admin/users',
      payload
    );
    return data;
  },
};

// Admin role & permission management API
export const rolesApi = {
  list: async (): Promise<APIResponse<AdminRole[]>> => {
    const { data } = await apiClient.get<APIResponse<AdminRole[]>>('/admin/roles');
    return data;
  },

  create: async (payload: {
    name?: string;
    label: string;
    description?: string;
    color?: string;
    permissions: string[];
  }): Promise<APIResponse<AdminRole>> => {
    const { data } = await apiClient.post<APIResponse<AdminRole>>('/admin/roles', payload);
    return data;
  },

  update: async (
    id: string,
    payload: { label?: string; description?: string; color?: string; permissions?: string[] }
  ): Promise<APIResponse<AdminRole>> => {
    const { data } = await apiClient.patch<APIResponse<AdminRole>>(`/admin/roles/${id}`, payload);
    return data;
  },

  remove: async (id: string): Promise<APIResponse> => {
    const { data } = await apiClient.delete<APIResponse>(`/admin/roles/${id}`);
    return data;
  },
};

// Admin Mail Center API — automail, mailbox, compose, logs, notifications
export const adminMailApi = {
  // Automail
  automail: async (params?: { page?: number; limit?: number; search?: string }) => {
    const query: Record<string, unknown> = {};
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    if (params?.search) query.search = params.search;
    const { data } = await apiClient.get<APIResponse<MailLogEntry[]> & { meta?: TransactionMeta }>(
      '/admin/mail/automail',
      { params: query }
    );
    return data;
  },

  // Mailbox
  inbox: async (params?: { page?: number; limit?: number }) => {
    const query: Record<string, unknown> = {};
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    const { data } = await apiClient.get<APIResponse<InboundMailEntry[]> & { meta?: TransactionMeta; imapConfigured?: boolean }>(
      '/admin/mail/mailbox',
      { params: query }
    );
    return data;
  },
  sync: async () => {
    const { data } = await apiClient.post<APIResponse & { synced?: number; total?: number }>(
      '/admin/mail/mailbox/sync'
    );
    return data;
  },
  getInbound: async (id: string) => {
    const { data } = await apiClient.get<APIResponse<InboundMailEntry & { html?: string; text?: string }>>(
      `/admin/mail/mailbox/${id}`
    );
    return data;
  },
  // Full detail for a SENT mail (from the logs) — includes the rendered body.
  getSent: async (id: string) => {
    const { data } = await apiClient.get<
      APIResponse<{
        id: string;
        to: string;
        from: string;
        subject: string;
        kind: string;
        status: string;
        error?: string;
        preview?: string;
        html?: string;
        createdAt: string;
        user?: { id: string; name?: string; email?: string; picture?: string | null } | null;
      }>
    >(`/admin/mail/logs/${id}`);
    return data;
  },

  // Compose
  recipients: async (): Promise<APIResponse<{ recipientCount: number }>> => {
    const { data } = await apiClient.get<APIResponse<{ recipientCount: number }>>(
      '/admin/mail/compose/recipients'
    );
    return data;
  },
  // Searchable user list for the "select users" recipient picker (paginated).
  composeUsers: async (params?: { search?: string; page?: number; limit?: number }) => {
    const query: Record<string, unknown> = {};
    if (params?.search) query.search = params.search;
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    const { data } = await apiClient.get<APIResponse<MailRecipientUser[]> & { meta?: TransactionMeta }>(
      '/admin/mail/compose/users',
      { params: query }
    );
    return data;
  },
  sendCampaign: async (payload: {
    subject: string;
    bannerUrl?: string;
    heading?: string;
    intro?: string;
    sections?: MailTemplateSection[];
    footer?: string;
    rawHtml?: string;
    recipients?: 'all' | 'selected' | 'manual';
    userIds?: string[];
    emails?: string[];
  }): Promise<APIResponse<{ recipientCount: number }>> => {
    const { data } = await apiClient.post<APIResponse<{ recipientCount: number }>>(
      '/admin/mail/compose/send',
      payload
    );
    return data;
  },
  uploadBanner: async (file: File): Promise<APIResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await apiClient.post<APIResponse<{ url: string }>>(
      '/admin/mail/compose/upload-banner',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  // Settings (welcome toggle + templates)
  settings: async (): Promise<APIResponse<MailSettings>> => {
    const { data } = await apiClient.get<APIResponse<MailSettings>>('/admin/mail/settings');
    return data;
  },
  updateSettings: async (payload: {
    welcomeEmailEnabled?: boolean;
    welcomeTemplate?: MailTemplate;
  }): Promise<APIResponse<{ welcomeEmailEnabled: boolean }>> => {
    const { data } = await apiClient.put<APIResponse<{ welcomeEmailEnabled: boolean }>>(
      '/admin/mail/settings',
      payload
    );
    return data;
  },

  // Logs
  logs: async (params?: { page?: number; limit?: number; search?: string; direction?: 'sent' | 'received' | 'all' }) => {
    const query: Record<string, unknown> = {};
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    if (params?.search) query.search = params.search;
    if (params?.direction && params.direction !== 'all') query.direction = params.direction;
    const { data } = await apiClient.get<APIResponse<UnifiedMailLog[]> & { meta?: TransactionMeta }>(
      '/admin/mail/logs',
      { params: query }
    );
    return data;
  },

  // Notifications (paper-request ack + fulfillment toggles)
  notifications: async (): Promise<APIResponse<NotifySettings>> => {
    const { data } = await apiClient.get<APIResponse<NotifySettings>>('/admin/mail/notifications');
    return data;
  },
  updateNotifications: async (payload: Partial<NotifySettings>): Promise<APIResponse<NotifySettings>> => {
    const { data } = await apiClient.put<APIResponse<NotifySettings>>('/admin/mail/notifications', payload);
    return data;
  },
};

export const leaderboardApi = {
  getRankings: async (type: 'all_time' | 'weekly', department?: string): Promise<APIResponse<any>> => {
    const params: Record<string, string> = { type };
    if (department) params.department = department;
    const { data } = await apiClient.get<APIResponse<any>>('/leaderboard', { params });
    return data;
  },
  getMyStats: async (): Promise<APIResponse<any>> => {
    const { data } = await apiClient.get<APIResponse<any>>('/leaderboard/me');
    return data;
  },
};

export const resumeApi = {
  list: async (): Promise<APIResponse<Resume[]>> => {
    const { data } = await apiClient.get<APIResponse<Resume[]>>('/resumes');
    return data;
  },
  create: async (resume: Partial<ResumeDraft>): Promise<APIResponse<Resume>> => {
    const { data } = await apiClient.post<APIResponse<Resume>>('/resumes', resume);
    return data;
  },
  get: async (id: string): Promise<APIResponse<Resume>> => {
    const { data } = await apiClient.get<APIResponse<Resume>>(`/resumes/${id}`);
    return data;
  },
  update: async (id: string, resume: Partial<ResumeDraft>): Promise<APIResponse<Resume>> => {
    const { data } = await apiClient.put<APIResponse<Resume>>(`/resumes/${id}`, resume);
    return data;
  },
  delete: async (id: string): Promise<APIResponse> => {
    const { data } = await apiClient.delete<APIResponse>(`/resumes/${id}`);
    return data;
  },
};

// Report API
export const reportApi = {
  create: async (reportData: { paperId: string; reason: string; description?: string }): Promise<APIResponse<Report>> => {
    const { data } = await apiClient.post<APIResponse<Report>>('/reports', reportData);
    return data;
  },

  getAll: async (status?: string): Promise<APIResponse<Report[]>> => {
    const { data } = await apiClient.get<APIResponse<Report[]>>('/reports', { params: { status } });
    return data;
  },

  // The reporter's own reports (support tickets)
  mine: async (): Promise<APIResponse<Report[]>> => {
    const { data } = await apiClient.get<APIResponse<Report[]>>('/reports/mine');
    return data;
  },

  // Continue a report ticket thread — own report (reporter) or any (staff)
  reply: async (id: string, body: string): Promise<APIResponse<Report>> => {
    const { data } = await apiClient.post<APIResponse<Report>>(`/reports/${id}/reply`, { body });
    return data;
  },

  updateStatus: async (id: string, status: 'resolved' | 'dismissed'): Promise<APIResponse<Report>> => {
    const { data } = await apiClient.patch<APIResponse<Report>>(`/reports/${id}`, { status });
    return data;
  },
};

// Paper request API — students request missing papers, staff triage them
export const paperRequestApi = {
  create: async (requestData: CreatePaperRequestDTO): Promise<APIResponse<PaperRequest>> => {
    const { data } = await apiClient.post<APIResponse<PaperRequest>>('/paper-requests', requestData);
    return data;
  },

  // Returns exists:true (and the paper) when an exact paper with this subject
  // code + year (+ exam type) is already on the platform.
  check: async (params: {
    subjectCode: string;
    year: number;
    examType?: string;
    departmentId?: string;
  }): Promise<PaperExistsResponse> => {
    const { data } = await apiClient.get<PaperExistsResponse>('/paper-requests/check', { params });
    return data;
  },

  list: async (params?: { status?: string; search?: string }): Promise<APIResponse<PaperRequest[]>> => {
    const { data } = await apiClient.get<APIResponse<PaperRequest[]>>('/paper-requests', { params });
    return data;
  },

  // The requesting student's own paper requests (support tickets)
  mine: async (): Promise<APIResponse<PaperRequest[]>> => {
    const { data } = await apiClient.get<APIResponse<PaperRequest[]>>('/paper-requests/mine');
    return data;
  },

  // Continue a ticket thread — own request (student) or any request (staff)
  reply: async (id: string, body: string): Promise<APIResponse<PaperRequest>> => {
    const { data } = await apiClient.post<APIResponse<PaperRequest>>(`/paper-requests/${id}/reply`, { body });
    return data;
  },

  updateStatus: async (id: string, status: 'pending' | 'fulfilled' | 'rejected'): Promise<APIResponse<PaperRequest>> => {
    const { data } = await apiClient.patch<APIResponse<PaperRequest>>(`/paper-requests/${id}/status`, { status });
    return data;
  },

  remove: async (id: string): Promise<APIResponse> => {
    const { data } = await apiClient.delete<APIResponse>(`/paper-requests/${id}`);
    return data;
  },
};

// Bug API
export const bugApi = {
  create: async (bugData: { title: string; description: string; severity: string; email: string; browser?: string; device?: string }): Promise<APIResponse<any>> => {
    const { data } = await apiClient.post<APIResponse<any>>('/bugs', bugData);
    return data;
  },

  getAll: async (status?: string, severity?: string): Promise<APIResponse<any[]>> => {
    const { data } = await apiClient.get<APIResponse<any[]>>('/bugs', { params: { status, severity } });
    return data;
  },

  updateStatus: async (id: string, status: 'pending' | 'active' | 'resolved' | 'dismissed'): Promise<APIResponse<any>> => {
    const { data } = await apiClient.patch<APIResponse<any>>(`/bugs/${id}`, { status });
    return data;
  },

  delete: async (id: string): Promise<APIResponse<any>> => {
    const { data } = await apiClient.delete<APIResponse<any>>(`/bugs/${id}`);
    return data;
  },

  // The reporter's own bug reports (support tickets)
  mine: async (): Promise<APIResponse<any[]>> => {
    const { data } = await apiClient.get<APIResponse<any[]>>('/bugs/mine');
    return data;
  },

  // Continue a bug ticket thread — own report (reporter) or any (staff)
  reply: async (id: string, body: string): Promise<APIResponse<any>> => {
    const { data } = await apiClient.post<APIResponse<any>>(`/bugs/${id}/reply`, { body });
    return data;
  },
};

// Unread staff replies across the signed-in student's tickets (paper requests
// + bug reports combined) — powers the dot on the profile dropdown.
export const supportApi = {
  unreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<APIResponse<{ unread: number }>>('/paper-requests/unread-count');
    return data?.data?.unread ?? 0;
  },
};

// PDF API - routes PYQ to PDF service, syllabus to main server
export const pdfApi = {
  view: async (id: string, type: 'pyq' | 'syllabus' = 'pyq'): Promise<Blob> => {
    // PYQ → dedicated PDF service; Syllabus → main server (has Syllabus model)
    const client = type === 'syllabus' ? apiClient : pdfServiceClient;
    const { data } = await client.get(`/pdf/view/${id}`, {
      params: { type },
      responseType: 'blob',
    });
    return data;
  },

  download: async (id: string, type: 'pyq' | 'syllabus' = 'pyq'): Promise<{ blob: Blob; filename: string }> => {
    const client = type === 'syllabus' ? apiClient : pdfServiceClient;
    const res = await client.get(`/pdf/download/${id}`, {
      params: { type },
      responseType: 'blob',
    });

    // Extract filename from Content-Disposition:
    //   attachment; filename="fallback.pdf"; filename*=UTF-8''%20encoded%20name.pdf
    let filename = 'paper.pdf';
    const header = res.headers['content-disposition'] as string | undefined;
    if (header) {
      const starMatch = /filename\*=UTF-8''([^;]+)/i.exec(header);
      const plainMatch = /filename="?([^";]+)"?/i.exec(header);
      const raw = starMatch?.[1] ?? plainMatch?.[1];
      if (raw) {
        try {
          filename = decodeURIComponent(raw);
        } catch {
          filename = raw;
        }
      }
    }

    return { blob: res.data, filename };
  },
};

// Wallet API
export const walletApi = {
  getBalance: async (): Promise<APIResponse<WalletBalance>> => {
    const { data } = await apiClient.get<APIResponse<WalletBalance>>('/wallet/balance');
    return data;
  },

  getTransactions: async (
    page = 1,
    limit = 20,
    type?: TransactionType | 'all'
  ): Promise<APIResponse<WalletTransaction[]> & { meta?: TransactionMeta }> => {
    const params: Record<string, unknown> = { page, limit };
    if (type && type !== 'all') params.type = type;
    const { data } = await apiClient.get<APIResponse<WalletTransaction[]> & { meta?: TransactionMeta }>(
      '/wallet/transactions',
      { params }
    );
    return data;
  },

  getPacks: async (): Promise<APIResponse<TopUpPacks>> => {
    const { data } = await apiClient.get<APIResponse<TopUpPacks>>('/wallet/packs');
    return data;
  },

  createTopupOrder: async (packId: TopUpPackId): Promise<APIResponse<WalletTopupOrder>> => {
    const { data } = await apiClient.post<APIResponse<WalletTopupOrder>>(
      '/wallet/orders',
      { packId }
    );
    return data;
  },

  createResumePassOrder: async (): Promise<APIResponse<WalletTopupOrder>> => {
    const { data } = await apiClient.post<APIResponse<WalletTopupOrder>>(
      '/wallet/resume-pass-order'
    );
    return data;
  },

  verifyTopup: async (
    payload: RazorpayCheckoutSuccess
  ): Promise<APIResponse<WalletBalance & { alreadyProcessed?: boolean }>> => {
    const { data } = await apiClient.post<APIResponse<WalletBalance & { alreadyProcessed?: boolean }>>(
      '/wallet/verify',
      payload
    );
    return data;
  },

  spendDownload: async (
    resumeId: string,
    method: 'coins' | 'free' | 'pass'
  ): Promise<APIResponse<WalletBalance>> => {
    const { data } = await apiClient.post<APIResponse<WalletBalance>>(
      '/wallet/spend-download',
      { resumeId, method }
    );
    return data;
  },
};

// AI Resume Builder API
export interface AIFillResult {
  summary: string;
  experience: ResumeExperience[];
  projects: ResumeProject[];
  skillGroups: ResumeSkillGroup[];
}

export const aiApi = {
  fillFromJD: async (
    jobDescription: string,
    currentResume?: Partial<ResumeDraft>
  ): Promise<APIResponse<AIFillResult>> => {
    const { data } = await apiClient.post<APIResponse<AIFillResult>>(
      '/ai/resume/fill-from-jd',
      { jobDescription, currentResume }
    );
    return data;
  },

  rephrase: async (
    text: string,
    field: string
  ): Promise<APIResponse<{ text: string }>> => {
    const { data } = await apiClient.post<APIResponse<{ text: string }>>(
      '/ai/resume/rephrase',
      { text, field }
    );
    return data;
  },

  enhanceSection: async (
    section: 'experience' | 'projects',
    content: string,
    context?: string
  ): Promise<APIResponse<{ entries: (ResumeExperience | ResumeProject)[] }>> => {
    const { data } = await apiClient.post<APIResponse<{ entries: (ResumeExperience | ResumeProject)[] }>>(
      '/ai/resume/enhance-section',
      { section, content, context }
    );
    return data;
  },
};

// Event API
export const eventApi = {
  getAll: async (): Promise<APIResponse<InvertisEvent[]>> => {
    const { data } = await apiClient.get<APIResponse<InvertisEvent[]>>('/events');
    return data;
  },

  getById: async (id: string): Promise<APIResponse<InvertisEvent>> => {
    const { data } = await apiClient.get<APIResponse<InvertisEvent>>(`/events/${id}`);
    return data;
  },

  create: async (eventData: Partial<InvertisEvent>): Promise<APIResponse<InvertisEvent>> => {
    const { data } = await apiClient.post<APIResponse<InvertisEvent>>('/events', eventData);
    return data;
  },

  update: async (id: string, eventData: Partial<InvertisEvent>): Promise<APIResponse<InvertisEvent>> => {
    const { data } = await apiClient.put<APIResponse<InvertisEvent>>(`/events/${id}`, eventData);
    return data;
  },

  delete: async (id: string): Promise<APIResponse<any>> => {
    const { data } = await apiClient.delete<APIResponse<any>>(`/events/${id}`);
    return data;
  },

  uploadImage: async (file: File): Promise<APIResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await apiClient.post<APIResponse<{ url: string }>>('/events/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};

// ── Clubs (Abhiruchi) ──────────────────────────────────────────────────────
// The public club pages read from the server so admins can edit every
// section without a code deploy. The write endpoints are permission
// gated on the server (clubs.manage / clubs.delete).
export const clubApi = {
  /** Active clubs for the public grid, in display order. */
  getAll: async (): Promise<APIResponse<Club[]>> => {
    const { data } = await apiClient.get<APIResponse<Club[]>>('/clubs');
    return data;
  },

  /** Every club including inactive ones — admin only. */
  getAllForAdmin: async (): Promise<APIResponse<Club[]>> => {
    const { data } = await apiClient.get<APIResponse<Club[]>>('/clubs?includeInactive=true');
    return data;
  },

  getById: async (id: string): Promise<APIResponse<Club>> => {
    const { data } = await apiClient.get<APIResponse<Club>>(`/clubs/${id}`);
    return data;
  },

  create: async (clubData: Partial<Club>): Promise<APIResponse<Club>> => {
    const { data } = await apiClient.post<APIResponse<Club>>('/clubs', clubData);
    return data;
  },

  update: async (id: string, clubData: Partial<Club>): Promise<APIResponse<Club>> => {
    const { data } = await apiClient.put<APIResponse<Club>>(`/clubs/${id}`, clubData);
    return data;
  },

  remove: async (id: string): Promise<APIResponse<unknown>> => {
    const { data } = await apiClient.delete<APIResponse<unknown>>(`/clubs/${id}`);
    return data;
  },

  /** Add or update a single event on a club. */
  saveEvent: async (
    clubId: string,
    event: Partial<ClubEvent> & { eventId?: string }
  ): Promise<APIResponse<Club>> => {
    const { data } = await apiClient.put<APIResponse<Club>>(`/clubs/${clubId}/events`, event);
    return data;
  },

  deleteEvent: async (clubId: string, eventId: string): Promise<APIResponse<Club>> => {
    const { data } = await apiClient.delete<APIResponse<Club>>(`/clubs/${clubId}/events/${eventId}`);
    return data;
  },

  uploadImage: async (file: File): Promise<APIResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await apiClient.post<APIResponse<{ url: string }>>('/clubs/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  // ── Registrations (RSVPs) ──────────────────────────────────────────────

  /**
   * Public RSVP submission. When the event is full the server
   * waitlists the student instead of rejecting them, and sets
   * `waitlisted` on the response.
   */
  register: async (
    clubId: string,
    payload: ClubRsvpPayload
  ): Promise<APIResponse<ClubRegistration> & { waitlisted?: boolean }> => {
    const { data } = await apiClient.post<
      APIResponse<ClubRegistration> & { waitlisted?: boolean }
    >(`/clubs/${clubId}/register`, payload);
    return data;
  },

  /** Admin listing of registrations. */
  getRegistrations: async (params?: {
    clubId?: string;
    eventId?: string;
    status?: string;
  }): Promise<APIResponse<ClubRegistration[]>> => {
    const { data } = await apiClient.get<APIResponse<ClubRegistration[]>>(
      '/clubs/admin/registrations',
      { params }
    );
    return data;
  },

  getRegistrationStats: async (clubId?: string): Promise<APIResponse<ClubRegistrationStats>> => {
    const { data } = await apiClient.get<APIResponse<ClubRegistrationStats>>(
      '/clubs/admin/registrations/stats',
      { params: clubId ? { clubId } : undefined }
    );
    return data;
  },

  getRegistrationSummary: async (): Promise<APIResponse<ClubRegistrationSummaryRow[]>> => {
    const { data } = await apiClient.get<APIResponse<ClubRegistrationSummaryRow[]>>(
      '/clubs/admin/registrations/summary'
    );
    return data;
  },

  createRegistration: async (payload: {
    clubId: string;
    eventId: string;
    name: string;
    email: string;
    branch?: string;
    year?: string;
    interests?: string[];
    status?: string;
  }): Promise<APIResponse<ClubRegistration>> => {
    const { data } = await apiClient.post<APIResponse<ClubRegistration>>(
      '/clubs/admin/registrations',
      payload
    );
    return data;
  },

  updateRegistration: async (
    registrationId: string,
    payload: {
      status?: string;
      notes?: string;
      studentNote?: string;
      attended?: boolean;
      checkedInAt?: string | null;
    }
  ): Promise<APIResponse<ClubRegistration>> => {
    const { data } = await apiClient.put<APIResponse<ClubRegistration>>(
      `/clubs/admin/registrations/${registrationId}`,
      payload
    );
    return data;
  },

  deleteRegistration: async (registrationId: string): Promise<APIResponse<unknown>> => {
    const { data } = await apiClient.delete<APIResponse<unknown>>(
      `/clubs/admin/registrations/${registrationId}`
    );
    return data;
  },
};

// ── Activity tracking (client → server) ─────────────────────────────────────
// Fire-and-forget event reporting. Failures are swallowed on purpose — the
// product must never break because tracking did.
export const activityApi = {
  track: async (payload: {
    type: 'page_view' | 'search' | 'profile_update';
    title?: string;
    path?: string;
    entityType?: string;
    entityId?: string;
    sessionKey?: string;
    referrer?: string;
    meta?: Record<string, unknown>;
  }): Promise<void> => {
    try {
      await apiClient.post('/activity', payload);
    } catch {
      // ignore — tracking is best-effort
    }
  },

  presence: async (payload: {
    path?: string;
    title?: string;
    sessionKey?: string;
    visible?: boolean;
  }): Promise<void> => {
    try {
      await apiClient.post('/activity/presence', payload);
    } catch {
      // ignore
    }
  },
};

// ── Admin activity monitor ──────────────────────────────────────────────────
export interface PagedResponse<T> extends APIResponse<T[]> {
  meta?: { page: number; limit: number; total: number };
}

export const adminActivityApi = {
  overview: async (): Promise<APIResponse<ActivityOverview>> => {
    const { data } = await apiClient.get<APIResponse<ActivityOverview>>('/admin/activity/overview');
    return data;
  },

  // Range-picker graph data — hourly buckets for 24h, daily otherwise.
  series: async (
    metric: 'signups' | 'active',
    range: StatRange
  ): Promise<APIResponse<{ metric: string; range: StatRange; total?: number; prevTotal?: number; series: SeriesPoint[] }>> => {
    const { data } = await apiClient.get<
      APIResponse<{ metric: string; range: StatRange; total?: number; prevTotal?: number; series: SeriesPoint[] }>
    >('/admin/activity/series', { params: { metric, range } });
    return data;
  },

  online: async (): Promise<APIResponse<PresenceInfo[]>> => {
    const { data } = await apiClient.get<APIResponse<PresenceInfo[]>>('/admin/activity/online');
    return data;
  },

  feed: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    userId?: string;
    search?: string;
    from?: string;
    to?: string;
  }): Promise<PagedResponse<ActivityEvent>> => {
    const { data } = await apiClient.get<PagedResponse<ActivityEvent>>('/admin/activity/feed', { params });
    return data;
  },

  userSummary: async (userId: string): Promise<APIResponse<ActivityUserSummary>> => {
    const { data } = await apiClient.get<APIResponse<ActivityUserSummary>>(
      `/admin/activity/users/${userId}/summary`
    );
    return data;
  },

  userLogs: async (userId: string, params?: { page?: number; limit?: number; type?: string }): Promise<PagedResponse<ActivityEvent>> => {
    const { data } = await apiClient.get<PagedResponse<ActivityEvent>>(
      `/admin/activity/users/${userId}/logs`,
      { params }
    );
    return data;
  },

  userPapers: async (userId: string): Promise<APIResponse<
    { entityId: string; title: string; subjectName?: string; departmentName?: string; branchName?: string; views: number; downloads: number; lastAt: string }[]
  >> => {
    const { data } = await apiClient.get<APIResponse<
      { entityId: string; title: string; subjectName?: string; departmentName?: string; branchName?: string; views: number; downloads: number; lastAt: string }[]
    >>(`/admin/activity/users/${userId}/papers`);
    return data;
  },

  // Chart drill-downs — [from, to) ISO bounds; the client computes IST day /
  // ISO-week boundaries so the server stays timezone-agnostic.
  signupsInRange: async (from: string, to: string): Promise<APIResponse<{ count: number; users: ActivityUserRow[] }>> => {
    const { data } = await apiClient.get<APIResponse<{ count: number; users: ActivityUserRow[] }>>(
      '/admin/activity/signups',
      { params: { from, to } }
    );
    return data;
  },

  activeUsersInRange: async (from: string, to: string): Promise<APIResponse<{ count: number; users: ActivityUserRow[] }>> => {
    const { data } = await apiClient.get<APIResponse<{ count: number; users: ActivityUserRow[] }>>(
      '/admin/activity/active-users',
      { params: { from, to } }
    );
    return data;
  },
};

// ── Marketing console ───────────────────────────────────────────────────────
export const marketingApi = {
  overview: async (): Promise<APIResponse<MarketingOverview>> => {
    const { data } = await apiClient.get<APIResponse<MarketingOverview>>('/admin/marketing/overview');
    return data;
  },

  leads: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sort?: string;
  }): Promise<PagedResponse<MarketingLead> & { meta?: { page: number; limit: number; total: number; counts?: Record<string, number> } }> => {
    const { data } = await apiClient.get<
      PagedResponse<MarketingLead> & { meta?: { page: number; limit: number; total: number; counts?: Record<string, number> } }
    >('/admin/marketing/leads', { params });
    return data;
  },

  lead: async (id: string): Promise<APIResponse<MarketingLeadDetail>> => {
    const { data } = await apiClient.get<APIResponse<MarketingLeadDetail>>(`/admin/marketing/leads/${id}`);
    return data;
  },

  // Raw href for direct navigation (the Next rewrite maps /backend/* to the
  // API). Never pass this to apiClient — its baseURL is already '/backend',
  // so that would request /backend/backend/… and 404.
  exportUrl: (params?: { search?: string; status?: string; sort?: string }): string => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.sort && params.sort !== 'engaged') query.set('sort', params.sort);
    const qs = query.toString();
    return `/backend/admin/marketing/leads/export${qs ? `?${qs}` : ''}`;
  },

  // Authenticated CSV download: raw <a> navigation can't carry the JWT, so the
  // file is fetched with the axios client (axios-relative path, no /backend
  // prefix — the baseURL adds it) and saved as a blob.
  exportCsv: async (params?: { search?: string; status?: string; sort?: string }): Promise<void> => {
    const query: Record<string, string> = {};
    if (params?.search) query.search = params.search;
    if (params?.status && params.status !== 'all') query.status = params.status;
    if (params?.sort && params.sort !== 'engaged') query.sort = params.sort;

    const { data } = await apiClient.get<Blob>('/admin/marketing/leads/export', {
      params: query,
      responseType: 'blob',
    });

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invertisprep-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

// DB Backup & Restore API — super-admin only
export const backupApi = {
  stats: async (): Promise<APIResponse<BackupStats>> => {
    const { data } = await apiClient.get<APIResponse<BackupStats>>('/admin/backup/stats');
    return data;
  },

  // Copy the whole live DB into another MongoDB URI — returns a job id to poll
  startToUri: async (payload: {
    uri: string;
    dbName?: string;
    dropTarget?: boolean;
  }): Promise<APIResponse<{ jobId: string; target: { database: string; uri: string } }>> => {
    const { data } = await apiClient.post<
      APIResponse<{ jobId: string; target: { database: string; uri: string } }>
    >('/admin/backup/to-uri', payload);
    return data;
  },

  // Download a gzipped EJSON snapshot of the whole DB
  downloadExport: async (): Promise<{ blob: Blob; filename: string }> => {
    const res = await apiClient.get('/admin/backup/export', { responseType: 'blob' });
    let filename = 'invertisprep-backup.json.gz';
    const header = res.headers['content-disposition'] as string | undefined;
    if (header) {
      const starMatch = /filename\*=UTF-8''([^;]+)/i.exec(header);
      const plainMatch = /filename="?([^";]+)"?/i.exec(header);
      const raw = starMatch?.[1] ?? plainMatch?.[1];
      if (raw) {
        try {
          filename = decodeURIComponent(raw);
        } catch {
          filename = raw;
        }
      }
    }
    return { blob: res.data as Blob, filename };
  },

  getJob: async (jobId: string): Promise<APIResponse<BackupJob>> => {
    const { data } = await apiClient.get<APIResponse<BackupJob>>(`/admin/backup/jobs/${jobId}`);
    return data;
  },

  // Import: upload the backup file in small chunks (proxies cap request body
  // size), then parse it for a preview, then confirm the restore.
  uploadFile: async (
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<APIResponse<{ uploadId: string }>> => {
    const chunkSize = 3 * 1024 * 1024;
    const uploadId = crypto.randomUUID();
    const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
    for (let i = 0; i < totalChunks; i++) {
      const blob = file.slice(i * chunkSize, Math.min(file.size, (i + 1) * chunkSize));
      const formData = new FormData();
      formData.append('chunk', blob);
      formData.append('uploadId', uploadId);
      formData.append('index', String(i));
      await apiClient.post('/admin/backup/import/chunk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onProgress?.(Math.round(((i + 1) / totalChunks) * 100));
    }
    return { success: true, data: { uploadId } };
  },

  parse: async (uploadId: string): Promise<APIResponse<{ uploadId: string; summary: ImportPreviewSummary }>> => {
    const { data } = await apiClient.post<
      APIResponse<{ uploadId: string; summary: ImportPreviewSummary }>
    >('/admin/backup/import/parse', { uploadId });
    return data;
  },

  confirm: async (
    uploadId: string,
    mode: 'replace' | 'merge'
  ): Promise<APIResponse<{ jobId: string; mode: 'replace' | 'merge' }>> => {
    const { data } = await apiClient.post<APIResponse<{ jobId: string; mode: 'replace' | 'merge' }>>(
      '/admin/backup/import/confirm',
      { uploadId, mode }
    );
    return data;
  },
};

// Platform settings & feature flags API
export const settingsApi = {
  getPublic: async (): Promise<APIResponse<PublicSettings>> => {
    const { data } = await apiClient.get<APIResponse<PublicSettings>>('/settings/public');
    return data;
  },

  getAdmin: async (): Promise<APIResponse<PlatformSettings>> => {
    const { data } = await apiClient.get<APIResponse<PlatformSettings>>('/admin/settings');
    return data;
  },

  updateInstagramPopup: async (
    enabled: boolean
  ): Promise<APIResponse<PlatformSettings>> => {
    const { data } = await apiClient.put<APIResponse<PlatformSettings>>(
      '/admin/settings/instagram-popup',
      { enabled }
    );
    return data;
  },
};

export default apiClient;
