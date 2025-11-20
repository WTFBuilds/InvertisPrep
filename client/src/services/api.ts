import apiClient from '../lib/api-client';
import {
  Department,
  Branch,
  Session,
  PYQPaper,
  SearchFilters,
  SearchPapersResponse,
  AuthResponse,
  User,
  UploadPaperData,
  AdminStatistics,
} from '../types';

// ===== Public APIs =====

export const departmentApi = {
  // Get all departments
  getAll: async () => {
    const { data } = await apiClient.get<{ success: boolean; departments: Department[] }>(
      '/api/departments'
    );
    return data.departments;
  },

  // Get department by ID
  getById: async (id: string) => {
    const { data } = await apiClient.get<{ success: boolean; department: Department }>(
      `/api/departments/${id}`
    );
    return data.department;
  },

  // Get branches by department
  getBranches: async (departmentId: string) => {
    const { data } = await apiClient.get<{ success: boolean; branches: Branch[] }>(
      `/api/departments/${departmentId}/branches`
    );
    return data.branches;
  },
};

export const sessionApi = {
  // Get all sessions
  getAll: async () => {
    const { data } = await apiClient.get<{ success: boolean; sessions: Session[] }>(
      '/api/public/sessions'
    );
    return data.sessions;
  },

  // Get session by ID
  getById: async (id: string) => {
    const { data } = await apiClient.get<{ success: boolean; session: Session }>(
      `/api/public/sessions/${id}`
    );
    return data.session;
  },
};

export const pyqApi = {
  // Search papers
  search: async (filters: SearchFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const { data } = await apiClient.get<SearchPapersResponse>(
      `/api/pyq/search?${params.toString()}`
    );
    return data;
  },

  // Get paper by ID
  getById: async (id: string) => {
    const { data } = await apiClient.get<{ success: boolean; paper: PYQPaper }>(
      `/api/pyq/${id}`
    );
    return data.paper;
  },

  // Track download
  trackDownload: async (id: string) => {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      `/api/pyq/${id}/download`
    );
    return data;
  },
};

// ===== Auth APIs =====

export const authApi = {
  // Google OAuth login
  googleAuth: async (googleData: {
    googleId: string;
    email: string;
    name: string;
    picture?: string;
  }) => {
    const { data } = await apiClient.post<AuthResponse>('/api/auth/google', googleData);
    return data;
  },

  // Get current user
  getCurrentUser: async () => {
    const { data } = await apiClient.get<{ success: boolean; user: User }>(
      '/api/auth/me'
    );
    return data.user;
  },

  // Logout
  logout: async () => {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      '/api/auth/logout'
    );
    return data;
  },
};

// ===== Admin APIs =====

export const adminApi = {
  // Upload paper
  uploadPaper: async (paperData: UploadPaperData) => {
    const formData = new FormData();
    formData.append('file', paperData.file);
    
    if (paperData.title) formData.append('title', paperData.title);
    if (paperData.subjectCode) formData.append('subjectCode', paperData.subjectCode);
    formData.append('subjectName', paperData.subjectName);
    formData.append('departmentId', paperData.departmentId);
    formData.append('branchId', paperData.branchId);
    formData.append('semester', paperData.semester.toString());
    formData.append('sessionId', paperData.sessionId);
    formData.append('examType', paperData.examType);
    if (paperData.tags) formData.append('tags', paperData.tags);

    const { data } = await apiClient.post<{
      success: boolean;
      message: string;
      paper: Partial<PYQPaper>;
    }>('/api/admin/pyq/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  // Update paper
  updatePaper: async (
    id: string,
    updates: {
      title?: string;
      subjectCode?: string;
      subjectName?: string;
      examType?: string;
      tags?: string[];
      isActive?: boolean;
    }
  ) => {
    const { data } = await apiClient.put<{
      success: boolean;
      message: string;
      paper: PYQPaper;
    }>(`/api/admin/pyq/${id}`, updates);
    return data;
  },

  // Delete paper
  deletePaper: async (id: string) => {
    const { data } = await apiClient.delete<{ success: boolean; message: string }>(
      `/api/admin/pyq/${id}`
    );
    return data;
  },

  // Get all papers (paginated)
  getAllPapers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const { data } = await apiClient.get<{
      success: boolean;
      papers: PYQPaper[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/api/admin/papers?${queryParams.toString()}`);
    return data;
  },

  // Get statistics
  getStatistics: async () => {
    const { data } = await apiClient.get<{
      success: boolean;
      statistics: AdminStatistics;
    }>('/api/admin/statistics');
    return data.statistics;
  },
};

// ===== Super Admin APIs =====

export const superAdminApi = {
  // Department management
  createDepartment: async (dept: {
    id: string;
    name: string;
    displayName: string;
    icon?: string;
    description: string;
  }) => {
    const { data } = await apiClient.post<{
      success: boolean;
      message: string;
      department: Department;
    }>('/api/super-admin/departments', dept);
    return data;
  },

  updateDepartment: async (
    id: string,
    updates: {
      name?: string;
      displayName?: string;
      icon?: string;
      description?: string;
      isActive?: boolean;
    }
  ) => {
    const { data } = await apiClient.put<{
      success: boolean;
      message: string;
      department: Department;
    }>(`/api/super-admin/departments/${id}`, updates);
    return data;
  },

  deleteDepartment: async (id: string) => {
    const { data } = await apiClient.delete<{ success: boolean; message: string }>(
      `/api/super-admin/departments/${id}`
    );
    return data;
  },

  // Branch management
  createBranch: async (branch: {
    id: string;
    name: string;
    displayName?: string;
    departmentId: string;
    semesters: number[];
    description?: string;
  }) => {
    const { data } = await apiClient.post<{
      success: boolean;
      message: string;
      branch: Branch;
    }>('/api/super-admin/branches', branch);
    return data;
  },

  updateBranch: async (
    id: string,
    departmentId: string,
    updates: {
      name?: string;
      displayName?: string;
      semesters?: number[];
      description?: string;
      isActive?: boolean;
    }
  ) => {
    const { data } = await apiClient.put<{
      success: boolean;
      message: string;
      branch: Branch;
    }>(`/api/super-admin/branches/${id}?departmentId=${departmentId}`, updates);
    return data;
  },

  deleteBranch: async (id: string, departmentId: string) => {
    const { data } = await apiClient.delete<{ success: boolean; message: string }>(
      `/api/super-admin/branches/${id}?departmentId=${departmentId}`
    );
    return data;
  },

  // Session management
  createSession: async (session: {
    id: string;
    startYear: number;
    endYear: number;
    description?: string;
  }) => {
    const { data } = await apiClient.post<{
      success: boolean;
      message: string;
      session: Session;
    }>('/api/super-admin/sessions', session);
    return data;
  },

  updateSession: async (
    id: string,
    updates: {
      startYear?: number;
      endYear?: number;
      description?: string;
      isActive?: boolean;
    }
  ) => {
    const { data } = await apiClient.put<{
      success: boolean;
      message: string;
      session: Session;
    }>(`/api/super-admin/sessions/${id}`, updates);
    return data;
  },

  deleteSession: async (id: string) => {
    const { data } = await apiClient.delete<{ success: boolean; message: string }>(
      `/api/super-admin/sessions/${id}`
    );
    return data;
  },
};
