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
  fileName: string;
  fileSize?: number;
  year: number;
  
  // Metadata
  uploadedBy: Types.ObjectId;
  views: number;
  downloads: number;
  verified: boolean;
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// ===== Request/Response Types =====

// Auth
export interface LoginDTO {
  email: string;
  password: string;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    picture?: string;
  };
}

// PYQ Upload
export interface UploadPYQDTO {
  departmentId: string;
  branchId: string;
  sessionId: string;
  semester: number;
  subjectName: string;
  subjectCode?: string;
  examType: ExamType;
  year: number;
}

// PYQ Filter
export interface PYQFilterQuery {
  departmentId?: string;
  branchId?: string;
  sessionId?: string;
  semester?: string;
  examType?: ExamType;
  subjectCode?: string;
}

// API Response
export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
