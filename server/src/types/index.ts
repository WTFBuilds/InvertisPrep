import { Document, Types } from 'mongoose';

// ===== User Types =====
export type UserRole = 'student' | 'admin' | 'super-admin';

export interface IUser extends Document {
  _id: Types.ObjectId;
  googleId?: string;
  email: string;
  password?: string;
  name: string;
  picture?: string;
  role: UserRole;
  lastLogin: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Department Types =====
export interface IDepartment extends Document {
  _id: Types.ObjectId;
  id: string;
  name: string;
  displayName: string;
  icon: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Branch Types =====
export interface IBranch extends Document {
  _id: Types.ObjectId;
  id: string;
  name: string;
  departmentId: string;
  semesters: number[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Session Types =====
export interface ISession extends Document {
  _id: Types.ObjectId;
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== PYQ Paper Types =====
export type ExamType = 'mid-term' | 'end-term' | 'sessional';

export interface IPYQPaper extends Document {
  _id: Types.ObjectId;
  title: string;
  subjectCode?: string;
  subjectName: string;
  
  // Hierarchy
  departmentId: string;
  branchId: string;
  semester: number;
  sessionId: string;
  examType: ExamType;
  
  // File info
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  fileSize?: number;
  pageCount?: number;
  
  // Metadata
  uploadedBy: Types.ObjectId;
  views: number;
  downloads: number;
  tags: string[];
  searchText: string;
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// ===== Request/Response Types =====

// Auth
export interface GoogleAuthPayload {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    picture?: string;
  };
}

// Department
export interface CreateDepartmentDTO {
  id: string;
  name: string;
  displayName: string;
  icon?: string;
  description: string;
}

export interface UpdateDepartmentDTO {
  name?: string;
  displayName?: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
}

// Branch
export interface CreateBranchDTO {
  id: string;
  name: string;
  displayName?: string;
  departmentId: string;
  semesters: number[];
  description?: string;
}

export interface UpdateBranchDTO {
  name?: string;
  displayName?: string;
  semesters?: number[];
  description?: string;
  isActive?: boolean;
}

// Session
export interface CreateSessionDTO {
  id: string;
  startYear: number;
  endYear: number;
  description?: string;
}

export interface UpdateSessionDTO {
  startYear?: number;
  endYear?: number;
  description?: string;
  isActive?: boolean;
}

// PYQ Paper
export interface UploadPaperDTO {
  title?: string;
  subjectCode?: string;
  subjectName: string;
  departmentId: string;
  branchId: string;
  semester: number;
  sessionId: string;
  examType: ExamType;
  tags?: string[];
}

export interface UpdatePaperDTO {
  title?: string;
  subjectCode?: string;
  subjectName?: string;
  examType?: ExamType;
  tags?: string[];
  isActive?: boolean;
}

export interface SearchPapersQuery {
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
  papers: IPYQPaper[];
  pagination: PaginationMeta;
}

// Statistics
export interface AdminStatistics {
  totalPapers: number;
  totalDownloads: number;
  totalUsers: number;
  totalDepartments: number;
  totalBranches: number;
  popularPapers: Array<{
    _id: Types.ObjectId;
    title: string;
    subjectName: string;
    downloads: number;
    views: number;
  }>;
  recentUploads: Array<{
    _id: Types.ObjectId;
    title: string;
    subjectName: string;
    createdAt: Date;
    uploadedBy: {
      name: string;
    };
  }>;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: string[];
}

// Express Request with user
export interface AuthRequest extends Express.Request {
  user?: IUser;
}
