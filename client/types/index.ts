// User types
export type UserRole = 'student' | 'admin' | 'super-admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  picture?: string;
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
export type ExamType = 'mid-term' | 'end-term' | 'sessional';

export interface PYQPaper {
  _id: string;
  title: string;
  subjectName: string;
  subjectCode?: string;
  departmentId: string | Department;
  branchId: string | Branch;
  sessionId: string | Session;
  semester: number;
  examType: ExamType;
  year: number;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
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
}

// API Response types
export interface APIResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  error?: string;
}
