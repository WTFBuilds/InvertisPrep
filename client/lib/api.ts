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
  APIResponse,
  UserResponse,
  PublicUserProfile,
  Report,
  Resume,
  ResumeDraft,
  WalletTransaction,
  WalletBalance,
  TopUpPack,
  TopUpPackId,
  TopUpPacks,
  TransactionMeta,
  TransactionType,
  InvertisEvent,
  UserRole,
  AdminUser,
  AdminUserListMeta,
  UserStats,
  AdminUserDetail,
  Sponsor,
  CreateSponsorDTO,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect if we're already on a view or login page to avoid loops
      const isViewing = window.location.pathname.includes('/view/');
      const isLogin = window.location.pathname.includes('/login');

      if (!isViewing && !isLogin) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect based on current path
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
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
    await apiClient.post('/auth/logout');
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

// PYQ API
export const pyqApi = {
  upload: async (formData: FormData): Promise<APIResponse<PYQPaper>> => {
    const { data } = await apiClient.post<APIResponse<PYQPaper>>('/pyq/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  uploadPublic: async (formData: FormData): Promise<APIResponse<PYQPaper>> => {
    const { data } = await apiClient.post<APIResponse<PYQPaper>>('/pyq/upload-public', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  getDailyUploadCount: async (): Promise<APIResponse<{ count: number; limit: number; isExempt: boolean }>> => {
    const { data } = await apiClient.get<APIResponse<{ count: number; limit: number; isExempt: boolean }>>('/pyq/upload-count');
    return data;
  },

  getFiltered: async (filters: PYQFilterQuery): Promise<APIResponse<PYQPaper[]>> => {
    const { data } = await apiClient.get<APIResponse<PYQPaper[]>>('/pyq', { params: filters });
    return data;
  },

  getAll: async (params?: Record<string, any>): Promise<APIResponse<PYQPaper[]>> => {
    const { data } = await apiClient.get<APIResponse<PYQPaper[]>>('/pyq/all', { params });
    return data;
  },

  trackDownload: async (id: string): Promise<void> => {
    await apiClient.post(`/pyq/${id}/download`);
  },

  trackView: async (id: string): Promise<void> => {
    await apiClient.post(`/pyq/${id}/view`);
  },

  verify: async (id: string): Promise<APIResponse<PYQPaper>> => {
    const { data } = await apiClient.patch<APIResponse<PYQPaper>>(`/pyq/${id}/verify`);
    return data;
  },

  update: async (id: string, updates: Partial<PYQPaper>): Promise<APIResponse<PYQPaper>> => {
    const { data } = await apiClient.put<APIResponse<PYQPaper>>(`/pyq/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<APIResponse> => {
    const { data } = await apiClient.delete<APIResponse>(`/pyq/${id}`);
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

  updateRole: async (id: string, role: UserRole): Promise<APIResponse> => {
    const { data } = await apiClient.patch<APIResponse>(`/admin/users/${id}/role`, { role });
    return data;
  },

  updateStatus: async (id: string, isActive: boolean): Promise<APIResponse> => {
    const { data } = await apiClient.patch<APIResponse>(`/admin/users/${id}/status`, { isActive });
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

  updateStatus: async (id: string, status: 'resolved' | 'dismissed'): Promise<APIResponse<Report>> => {
    const { data } = await apiClient.patch<APIResponse<Report>>(`/reports/${id}`, { status });
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
};

// PDF API
export const pdfApi = {
  view: async (id: string, type: 'pyq' | 'syllabus' = 'pyq'): Promise<Blob> => {
    const { data } = await apiClient.get(`/pdf/view/${id}`, {
      params: { type },
      responseType: 'blob',
    });
    return data;
  },

  download: async (id: string, type: 'pyq' | 'syllabus' = 'pyq'): Promise<{ blob: Blob; filename: string }> => {
    const res = await apiClient.get(`/pdf/download/${id}`, {
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

  topup: async (packId: TopUpPackId): Promise<APIResponse<WalletBalance & { transaction: WalletTransaction }>> => {
    const { data } = await apiClient.post<APIResponse<WalletBalance & { transaction: WalletTransaction }>>(
      '/wallet/topup',
      { packId }
    );
    return data;
  },

  spendDownload: async (
    resumeId: string,
    method: 'coins' | 'free'
  ): Promise<APIResponse<WalletBalance>> => {
    const { data } = await apiClient.post<APIResponse<WalletBalance>>(
      '/wallet/spend-download',
      { resumeId, method }
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

export default apiClient;
