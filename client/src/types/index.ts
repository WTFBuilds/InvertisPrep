// User types
export type UserRole = 'student' | 'admin' | 'super-admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  picture?: string;
  googleId: string;
  isActive: boolean;
}

// Auth types
export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

// Department types
export interface Department {
  _id: string;
  id: string;
  name: string;
  displayName: string;
  icon?: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Branch types
export interface Branch {
  _id: string;
  id: string;
  name: string;
  displayName?: string;
  departmentId: string;
  semesters: number[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Session types
export interface Session {
  _id: string;
  id: string;
  startYear: number;
  endYear: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// PYQ Paper types
export type ExamType = 'mid-term' | 'end-term' | 'quiz' | 'assignment' | 'other';

export interface PYQPaper {
  _id: string;
  title: string;
  subjectCode?: string;
  subjectName: string;
  departmentId: string;
  branchId: string;
  semester: number;
  sessionId: string;
  examType: ExamType;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  fileSize?: number;
  pageCount?: number;
  uploadedBy: string | User;
  views: number;
  downloads: number;
  tags: string[];
  searchText: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Search types
export interface SearchFilters {
  departmentId?: string;
  branchId?: string;
  semester?: number;
  sessionId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface SearchPapersResponse {
  success: boolean;
  papers: PYQPaper[];
  pagination: PaginationMeta;
}

// Upload types
export interface UploadPaperData {
  file: File;
  title?: string;
  subjectCode?: string;
  subjectName: string;
  departmentId: string;
  branchId: string;
  semester: number;
  sessionId: string;
  examType: ExamType;
  tags?: string;
}

// Statistics types
export interface AdminStatistics {
  totalPapers: number;
  totalDownloads: number;
  totalUsers: number;
  totalDepartments: number;
  totalBranches: number;
  popularPapers: Array<{
    _id: string;
    title: string;
    subjectName: string;
    downloads: number;
    views: number;
  }>;
  recentUploads: Array<{
    _id: string;
    title: string;
    subjectName: string;
    createdAt: string;
    uploadedBy: {
      name: string;
    };
  }>;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
