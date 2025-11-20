# InvertisPrep PYQ System - Complete Step-by-Step Guide

## 📖 Table of Contents
1. [System Overview](#system-overview)
2. [User Flow](#user-flow)
3. [Admin Flow](#admin-flow)
4. [Technical Implementation](#technical-implementation)
5. [Day-by-Day Execution](#day-by-day-execution)

---

## 🎯 System Overview

### What We're Building

A **Previous Year Question (PYQ) Papers Management System** with:

1. **Public User Interface**:
   - Browse departments → Select branch/session/semester → View papers
   - Download PDFs
   - Clean, responsive UI using shadcn/ui components
   - Uses existing Navbar and landing pages from old folder

2. **Admin Panel** (`/admin`):
   - Secure login (Google OAuth)
   - Upload PYQ papers with metadata
   - **Create new** departments, branches, sessions on-the-fly
   - Manage existing papers (edit/delete)
   - View analytics dashboard

3. **Backend API**:
   - Node.js + Express + MongoDB
   - Cloudinary for PDF storage
   - JWT authentication
   - RESTful API endpoints

---

## 👤 User Flow (Public)

### Flow Diagram
```
┌─────────────────────────────────────────────────────────┐
│  1. LANDING PAGE (/)                                    │
│  - Hero Section                                         │
│  - Features                                             │
│  - Navigation Bar                                       │
│  - "Browse PYQ Papers" Button                          │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  2. PYQ HOME PAGE (/pyq)                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  🎓       │  │  💻      │  │  📊      │             │
│  │  B.Tech  │  │  BCA     │  │  B.Com   │             │
│  │  Engg.   │  │  Computer│  │  Commerce│             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  [Click any department card]                           │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  3. SELECTION PAGE (/pyq/btech)                        │
│                                                         │
│  ← Back to Departments          [BTech Papers]         │
│                                                         │
│  Select Criteria to Find Papers:                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📚 Branch          [Select Branch ▾]            │  │
│  │  - Computer Science & Engineering                │  │
│  │  - Electronics & Communication                   │  │
│  │  - Mechanical Engineering                        │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📅 Session         [Select Session ▾]           │  │
│  │  - 2024-25 (Current)                             │  │
│  │  - 2023-24                                       │  │
│  │  - 2022-23                                       │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📖 Semester        [Select Semester ▾]          │  │
│  │  - Semester 1                                    │  │
│  │  - Semester 2                                    │  │
│  │  - Semester 3                                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  [🔍 Search Papers]                                    │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  4. RESULTS DISPLAY (Same page, below form)            │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 📄 Data Structures & Algorithms                  │  │
│  │ CS301 • Mid Term • Semester 5                    │  │
│  │ Session: 2023-24 • 456 KB • 4 pages              │  │
│  │ ────────────────────────────────────────────     │  │
│  │ 👁 1,234 views  📥 567 downloads                 │  │
│  │ [View PDF] [Download]                            │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 📄 Mathematics I                                 │  │
│  │ MATH101 • End Term • Semester 5                  │  │
│  │ Session: 2023-24 • 1.2 MB • 8 pages              │  │
│  │ ────────────────────────────────────────────     │  │
│  │ 👁 890 views  📥 345 downloads                   │  │
│  │ [View PDF] [Download]                            │  │
│  └──────────────────────────────────────────────────┘  │
│  ... more papers ...                                   │
└─────────────────────────────────────────────────────────┘
```

### User Journey Step-by-Step

1. **User lands on homepage** (`/`)
   - Sees attractive landing page with hero section
   - Clicks "Browse PYQ Papers" or "PYQ" in navbar

2. **Department Selection** (`/pyq`)
   - Sees cards for all departments (B.Tech, BCA, B.Com, MBA, etc.)
   - Cards show: Icon, Name, Description
   - Clicks on desired department (e.g., "B.Tech")

3. **Filter Selection** (`/pyq/btech`)
   - **Branch Dropdown**: Shows branches for selected department
     - If B.Tech: CSE, ECE, ME, CE, EE, AI/ML
     - If BCA: General (no branches)
   - **Session Dropdown**: Shows available academic years
     - 2024-25, 2023-24, 2022-23, etc.
   - **Semester Dropdown**: Shows semesters for selected branch
     - B.Tech: 1-8, BCA: 1-6, etc.
   - User selects all three criteria
   - Clicks "Search Papers" button

4. **View Results** (Same page, scrolls down)
   - Grid/List of paper cards matching criteria
   - Each card shows:
     - Subject name
     - Subject code (if available)
     - Exam type (Mid Term/End Term/Sessional)
     - File size, page count
     - Views and downloads count
     - View PDF button (opens in new tab)
     - Download button (downloads file)

5. **Download Paper**
   - Click "Download" button
   - Backend tracks download (if user is logged in)
   - Increments download counter
   - File downloads from Cloudinary CDN

---

## 👨‍💼 Admin Flow

### Admin Access Levels

**3 Role Types:**
1. **Student**: Can only view/download papers
2. **Admin**: Can upload papers, view analytics
3. **Super Admin**: Can create departments/branches/sessions, manage admins

### Admin Login Flow
```
┌─────────────────────────────────────────────────────────┐
│  ADMIN LOGIN (/admin)                                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │            InvertisPrep Admin                     │  │
│  │                                                   │  │
│  │  [🔐 Sign in with Google]                        │  │
│  │                                                   │  │
│  │  Only authorized admins can access this panel    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼ (If role = 'admin' or 'super-admin')
┌─────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD (/admin/dashboard)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📊 Statistics                                    │  │
│  │  - Total Papers: 1,234                           │  │
│  │  - Total Downloads: 45,678                       │  │
│  │  - Total Users: 5,432                            │  │
│  │  - Most Downloaded: [Top 10 list]               │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Quick Actions:                                         │
│  [📤 Upload Paper] [🏢 Manage Departments]              │
│  [📚 Manage Papers] [👥 Manage Users] (super-admin)     │
└─────────────────────────────────────────────────────────┘
```

### Admin Upload Flow (Detailed)

```
┌─────────────────────────────────────────────────────────┐
│  UPLOAD PYQ PAPER (/admin/upload)                       │
│                                                         │
│  Step 1: Select Department                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📚 Department *                                  │  │
│  │  [Select Department ▾]                            │  │
│  │  - B.Tech                                         │  │
│  │  - BCA                                            │  │
│  │  - B.Com                                          │  │
│  │  ─────────────────────────────────                │  │
│  │  [+ Create New Department] (super-admin only)    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Step 2: Select or Create Branch                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  🎓 Branch *                                      │  │
│  │  [Select Branch ▾] (filtered by department)      │  │
│  │  - Computer Science & Engineering                │  │
│  │  - Electronics & Communication                   │  │
│  │  ─────────────────────────────────                │  │
│  │  [+ Create New Branch]                           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Step 3: Select or Create Session                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📅 Session *                                     │  │
│  │  [Select Session ▾]                               │  │
│  │  - 2024-25 (Current)                             │  │
│  │  - 2023-24                                       │  │
│  │  ─────────────────────────────────                │  │
│  │  [+ Create New Session]                          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Step 4: Select Semester                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📖 Semester *                                    │  │
│  │  [Select Semester ▾] (range based on branch)     │  │
│  │  - 1  - 2  - 3  - 4  - 5  - 6  - 7  - 8          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Step 5: Subject Details                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Subject Name *                                   │  │
│  │  [Data Structures & Algorithms]                  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Subject Code (Optional)                          │  │
│  │  [CS301]                                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Step 6: Exam Type                                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Exam Type *                                      │  │
│  │  ⚪ Mid Term  ⚪ End Term  ⚪ Sessional            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Step 7: Upload File                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📄 PDF File *                                    │  │
│  │  [Drag & Drop or Click to Browse]                │  │
│  │  Max size: 10MB • Format: PDF only               │  │
│  │                                                   │  │
│  │  ┌────────────────────────────────────────┐      │  │
│  │  │ 📄 data-structures-midterm.pdf         │      │  │
│  │  │ 2.4 MB                          [✕]    │      │  │
│  │  └────────────────────────────────────────┘      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Step 8: Additional Info (Optional)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Tags (comma separated)                           │  │
│  │  [algorithms, tree, graph, sorting]              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [Cancel]  [Upload Paper →] (with loading state) │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Upload Progress:                                       │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░ 65%                             │
│  Uploading to cloud storage...                          │
└─────────────────────────────────────────────────────────┘
```

### Creating New Department (Modal/Dialog)

```
┌─────────────────────────────────────────────────────────┐
│  CREATE NEW DEPARTMENT                           [✕]    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Department ID *                                  │  │
│  │  [mtech]                                         │  │
│  │  (lowercase, no spaces - used in URLs)           │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Short Name *                                     │  │
│  │  [M.Tech]                                        │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Full Name *                                      │  │
│  │  [Master of Technology]                          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Description *                                    │  │
│  │  [Advanced engineering programs...]              │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Icon (emoji or URL)                              │  │
│  │  [🔬]                                            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  [Cancel]  [Create Department]                         │
└─────────────────────────────────────────────────────────┘
```

### Creating New Branch (Modal/Dialog)

```
┌─────────────────────────────────────────────────────────┐
│  CREATE NEW BRANCH                               [✕]    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Department                                       │  │
│  │  [B.Tech] (pre-selected)                         │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Branch ID *                                      │  │
│  │  [ai-ml]                                         │  │
│  │  (lowercase, use hyphens)                        │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Branch Name *                                    │  │
│  │  [Artificial Intelligence & Machine Learning]    │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Number of Semesters *                            │  │
│  │  [8] (1-10)                                      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  [Cancel]  [Create Branch]                             │
└─────────────────────────────────────────────────────────┘
```

### Creating New Session (Modal/Dialog)

```
┌─────────────────────────────────────────────────────────┐
│  CREATE NEW SESSION                              [✕]    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Start Year *                                     │  │
│  │  [2025]                                          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  End Year * (auto-filled as startYear + 1)       │  │
│  │  [2026]                                          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Preview: 2025-26                                       │
│                                                         │
│  ☑ Mark as active session                              │
│                                                         │
│  [Cancel]  [Create Session]                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Technology Stack

#### Frontend (Next.js App)
```
client/
├── Framework: Next.js 14 (App Router)
├── Styling: Tailwind CSS + shadcn/ui
├── Auth: NextAuth.js (Google OAuth)
├── State: React Context + Zustand (optional)
├── HTTP: Axios
└── Components: shadcn/ui (Button, Card, Dialog, Form, etc.)
```

#### Backend (Node.js API)
```
server/
├── Runtime: Node.js
├── Framework: Express.js
├── Database: MongoDB (Mongoose ODM)
├── Storage: Cloudinary
├── Auth: JWT + Google OAuth
└── Upload: Multer
```

### Database Collections

**1. departments**
```javascript
{
  _id: ObjectId,
  id: "btech",              // URL-friendly ID
  name: "B.Tech",           // Short name
  displayName: "Bachelor of Technology",
  icon: "🎓",               // Emoji or Cloudinary URL
  description: "Engineering courses...",
  isActive: true,
  createdAt: Date,
  updatedAt: Date,
}
```

**2. branches**
```javascript
{
  _id: ObjectId,
  id: "cse",
  name: "Computer Science & Engineering",
  departmentId: "btech",    // Foreign key
  semesters: [1,2,3,4,5,6,7,8],
  isActive: true,
  createdAt: Date,
  updatedAt: Date,
}
```

**3. sessions**
```javascript
{
  _id: ObjectId,
  id: "2024-25",
  name: "Academic Year 2024-25",
  startYear: 2024,
  endYear: 2025,
  isActive: true,           // Current active session
  createdAt: Date,
  updatedAt: Date,
}
```

**4. users**
```javascript
{
  _id: ObjectId,
  googleId: "google_oauth_id",
  email: "admin@invertis.edu.in",
  name: "Admin Name",
  picture: "profile_pic_url",
  role: "student" | "admin" | "super-admin",
  lastLogin: Date,
  isActive: true,
  createdAt: Date,
  updatedAt: Date,
}
```

**5. pyq_papers**
```javascript
{
  _id: ObjectId,
  title: "Data Structures Mid Term",
  subjectCode: "CS301",
  subjectName: "Data Structures & Algorithms",
  
  // Hierarchy (indexed)
  departmentId: "btech",
  branchId: "cse",
  semester: 5,
  sessionId: "2023-24",
  examType: "mid-term",
  
  // Cloudinary storage
  cloudinaryUrl: "https://res.cloudinary.com/.../CS301_mid-term.pdf",
  cloudinaryPublicId: "invertis/pyq/btech/cse/2023-24/sem5/CS301_mid-term",
  fileSize: 2457600,        // bytes
  pageCount: 4,
  
  // Metadata
  uploadedBy: ObjectId("admin_id"),
  views: 1234,
  downloads: 567,
  tags: ["algorithms", "important"],
  searchText: "cs301 data structures...",
  isActive: true,
  
  createdAt: Date,
  updatedAt: Date,
}
```

### API Endpoints Overview

#### Public Routes
```
GET  /api/departments              - Get all departments
GET  /api/departments/:id          - Get single department
GET  /api/departments/:id/branches - Get branches by department
GET  /api/sessions                 - Get all sessions
GET  /api/pyq/search              - Search papers (with filters)
GET  /api/pyq/:id                 - Get single paper details
POST /api/pyq/:id/download        - Track download & get URL
```

#### Auth Routes
```
POST /api/auth/google             - Google OAuth callback
GET  /api/auth/me                 - Get current user
POST /api/auth/logout             - Logout
```

#### Admin Routes (Protected)
```
# Papers
POST   /api/admin/pyq/upload      - Upload new paper
PUT    /api/admin/pyq/:id         - Update paper metadata
DELETE /api/admin/pyq/:id         - Delete paper
GET    /api/admin/papers          - Get all papers (paginated)

# Departments (Super Admin)
POST   /api/admin/departments     - Create department
PUT    /api/admin/departments/:id - Update department
DELETE /api/admin/departments/:id - Delete department

# Branches (Super Admin)
POST   /api/admin/branches        - Create branch
PUT    /api/admin/branches/:id    - Update branch
DELETE /api/admin/branches/:id    - Delete branch

# Sessions (Super Admin)
POST   /api/admin/sessions        - Create session
PUT    /api/admin/sessions/:id    - Update session
DELETE /api/admin/sessions/:id    - Delete session

# Analytics
GET    /api/admin/statistics      - Dashboard stats
GET    /api/admin/analytics       - Detailed analytics

# Users (Super Admin)
GET    /api/admin/users           - Get all users
PUT    /api/admin/users/:id/role  - Update user role
```

---

## 📅 Day-by-Day Execution Plan

### **PHASE 1: BACKEND (Days 1-4)**

---

## **DAY 1: Backend Setup & Core Models**

### Morning (3-4 hours): Project Setup

#### 1. Initialize Backend
```bash
cd server
npm init -y
npm install express mongoose cors dotenv helmet morgan cookie-parser
npm install cloudinary multer jsonwebtoken bcryptjs
npm install --save-dev nodemon
```

#### 2. Create Folder Structure
```bash
mkdir -p src/{config,models,routes,controllers,middleware,services,utils}
touch src/server.js
```

#### 3. Environment Setup
Create `server/.env`:
```env
PORT=5000
NODE_ENV=development

# MongoDB (local or Atlas)
MONGODB_URI=mongodb://localhost:27017/invertisprep

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend
CLIENT_URL=http://localhost:3000
```

#### 4. Update package.json
```json
{
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "seed": "node src/utils/seedDatabase.js"
  }
}
```

### Afternoon (4 hours): Database Models

#### 5. Database Connection
**File**: `server/src/config/database.js`
```javascript
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
```

#### 6. Create All Models
Create these files in `server/src/models/`:

**Department.js**
```javascript
import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  icon: { type: String, default: '🎓' },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

departmentSchema.index({ id: 1, isActive: 1 });

export default mongoose.model('Department', departmentSchema);
```

**Branch.js**
```javascript
import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  id: { type: String, required: true, lowercase: true },
  name: { type: String, required: true },
  departmentId: { type: String, required: true, ref: 'Department' },
  semesters: { type: [Number], required: true, default: [1,2,3,4,5,6,7,8] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

branchSchema.index({ departmentId: 1, id: 1 }, { unique: true });
branchSchema.index({ departmentId: 1, isActive: 1 });

export default mongoose.model('Branch', branchSchema);
```

**Session.js**
```javascript
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  startYear: { type: Number, required: true },
  endYear: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

sessionSchema.index({ startYear: -1 });

export default mongoose.model('Session', sessionSchema);
```

**User.js**
```javascript
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  picture: { type: String },
  role: { 
    type: String, 
    enum: ['student', 'admin', 'super-admin'], 
    default: 'student' 
  },
  lastLogin: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.index({ googleId: 1 });
userSchema.index({ email: 1 });

export default mongoose.model('User', userSchema);
```

**PYQPaper.js**
```javascript
import mongoose from 'mongoose';

const pyqPaperSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subjectCode: { type: String, uppercase: true },
  subjectName: { type: String, required: true },
  
  departmentId: { type: String, required: true },
  branchId: { type: String, required: true },
  semester: { type: Number, required: true, min: 1, max: 10 },
  sessionId: { type: String, required: true },
  examType: { 
    type: String, 
    enum: ['mid-term', 'end-term', 'sessional'], 
    required: true 
  },
  
  cloudinaryUrl: { type: String, required: true },
  cloudinaryPublicId: { type: String, required: true },
  fileSize: { type: Number },
  pageCount: { type: Number },
  
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  tags: { type: [String], default: [] },
  searchText: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Indexes for fast queries
pyqPaperSchema.index({ departmentId: 1, branchId: 1, semester: 1, sessionId: 1 });
pyqPaperSchema.index({ searchText: 'text' });

// Generate search text before saving
pyqPaperSchema.pre('save', function(next) {
  this.searchText = [
    this.title, this.subjectName, this.subjectCode,
    this.departmentId, this.branchId, this.examType,
    ...this.tags
  ].filter(Boolean).join(' ').toLowerCase();
  next();
});

export default mongoose.model('PYQPaper', pyqPaperSchema);
```

**index.js** (Export all models)
```javascript
export { default as Department } from './Department.js';
export { default as Branch } from './Branch.js';
export { default as Session } from './Session.js';
export { default as User } from './User.js';
export { default as PYQPaper } from './PYQPaper.js';
```

#### 7. Database Seeding Script
**File**: `server/src/utils/seedDatabase.js`
```javascript
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import { Department, Branch, Session, User } from '../models/index.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seed...');
    
    // Clear existing data
    await Promise.all([
      Department.deleteMany({}),
      Branch.deleteMany({}),
      Session.deleteMany({}),
    ]);
    
    // Seed Departments
    const departments = [
      {
        id: 'btech',
        name: 'B.Tech',
        displayName: 'Bachelor of Technology',
        icon: '🎓',
        description: 'Engineering courses covering various technical disciplines',
      },
      {
        id: 'bca',
        name: 'BCA',
        displayName: 'Bachelor of Computer Applications',
        icon: '💻',
        description: 'Comprehensive computer science and applications program',
      },
      {
        id: 'bcom',
        name: 'B.Com',
        displayName: 'Bachelor of Commerce',
        icon: '📊',
        description: 'Commerce, accounting, and business studies',
      },
      {
        id: 'bba',
        name: 'BBA',
        displayName: 'Bachelor of Business Administration',
        icon: '💼',
        description: 'Business management and administration',
      },
      {
        id: 'mtech',
        name: 'M.Tech',
        displayName: 'Master of Technology',
        icon: '🔬',
        description: 'Advanced engineering and technology programs',
      },
      {
        id: 'mba',
        name: 'MBA',
        displayName: 'Master of Business Administration',
        icon: '📈',
        description: 'Advanced business management and leadership',
      },
    ];
    
    await Department.insertMany(departments);
    console.log('✅ Departments seeded');
    
    // Seed Branches
    const branches = [
      // B.Tech branches
      { id: 'cse', name: 'Computer Science & Engineering', departmentId: 'btech', semesters: [1,2,3,4,5,6,7,8] },
      { id: 'ece', name: 'Electronics & Communication Engineering', departmentId: 'btech', semesters: [1,2,3,4,5,6,7,8] },
      { id: 'me', name: 'Mechanical Engineering', departmentId: 'btech', semesters: [1,2,3,4,5,6,7,8] },
      { id: 'ce', name: 'Civil Engineering', departmentId: 'btech', semesters: [1,2,3,4,5,6,7,8] },
      { id: 'ee', name: 'Electrical Engineering', departmentId: 'btech', semesters: [1,2,3,4,5,6,7,8] },
      { id: 'ai', name: 'Artificial Intelligence & Machine Learning', departmentId: 'btech', semesters: [1,2,3,4,5,6,7,8] },
      
      // Other programs (general)
      { id: 'general', name: 'General', departmentId: 'bca', semesters: [1,2,3,4,5,6] },
      { id: 'general', name: 'General', departmentId: 'bcom', semesters: [1,2,3,4,5,6] },
      { id: 'general', name: 'General', departmentId: 'bba', semesters: [1,2,3,4,5,6] },
      { id: 'general', name: 'General', departmentId: 'mba', semesters: [1,2,3,4] },
      
      // M.Tech branches
      { id: 'cse', name: 'Computer Science & Engineering', departmentId: 'mtech', semesters: [1,2,3,4] },
      { id: 'vlsi', name: 'VLSI Design', departmentId: 'mtech', semesters: [1,2,3,4] },
    ];
    
    await Branch.insertMany(branches);
    console.log('✅ Branches seeded');
    
    // Seed Sessions (last 5 years)
    const currentYear = new Date().getFullYear();
    const sessions = [];
    for (let i = 0; i < 5; i++) {
      const startYear = currentYear - i;
      const endYear = startYear + 1;
      sessions.push({
        id: `${startYear}-${endYear.toString().slice(2)}`,
        name: `Academic Year ${startYear}-${endYear}`,
        startYear,
        endYear,
        isActive: i === 0,
      });
    }
    
    await Session.insertMany(sessions);
    console.log('✅ Sessions seeded');
    
    // Create a super admin user (optional)
    const adminExists = await User.findOne({ email: 'admin@invertis.edu.in' });
    if (!adminExists) {
      await User.create({
        googleId: 'super-admin-temp-id',
        email: 'admin@invertis.edu.in',
        name: 'Super Admin',
        role: 'super-admin',
      });
      console.log('✅ Super admin created');
    }
    
    console.log('🎉 Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
```

### Evening: Run Seed & Test

```bash
# Run seed script
npm run seed

# Verify data in MongoDB
mongosh
use invertisprep
db.departments.find()
db.branches.find()
db.sessions.find()
```

---

## **DAY 2: Authentication & Public API Routes**

### Morning: JWT & Auth Middleware

#### 1. JWT Utilities
**File**: `server/src/utils/jwt.js`
```javascript
import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};
```

#### 2. Auth Middleware
**File**: `server/src/middleware/auth.js`
```javascript
import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/index.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super-admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const isSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};
```

#### 3. Error Handler
**File**: `server/src/middleware/errorHandler.js`
```javascript
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate entry' });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
};

export const notFound = (req, res) => {
  res.status(404).json({ error: 'Route not found' });
};
```

### Afternoon: Public API Controllers & Routes

#### 4. Department Controller
**File**: `server/src/controllers/departmentController.js`
```javascript
import { Department, Branch } from '../models/index.js';

export const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true })
      .select('-__v')
      .sort({ name: 1 });
    
    res.json({ departments });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findOne({ id, isActive: true });
    
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json({ department });
  } catch (error) {
    next(error);
  }
};

export const getBranchesByDepartment = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    
    const branches = await Branch.find({ departmentId, isActive: true })
      .select('-__v')
      .sort({ name: 1 });
    
    res.json({ branches });
  } catch (error) {
    next(error);
  }
};
```

**File**: `server/src/routes/departments.js`
```javascript
import express from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  getBranchesByDepartment,
} from '../controllers/departmentController.js';

const router = express.Router();

router.get('/', getAllDepartments);
router.get('/:id', getDepartmentById);
router.get('/:departmentId/branches', getBranchesByDepartment);

export default router;
```

#### 5. Session Controller
**File**: `server/src/controllers/sessionController.js`
```javascript
import { Session } from '../models/index.js';

export const getAllSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ isActive: true })
      .select('-__v')
      .sort({ startYear: -1 });
    
    res.json({ sessions });
  } catch (error) {
    next(error);
  }
};
```

**File**: `server/src/routes/sessions.js`
```javascript
import express from 'express';
import { getAllSessions } from '../controllers/sessionController.js';

const router = express.Router();

router.get('/', getAllSessions);

export default router;
```

#### 6. PYQ Controller (Public)
**File**: `server/src/controllers/pyqController.js`
```javascript
import { PYQPaper } from '../models/index.js';

export const searchPapers = async (req, res, next) => {
  try {
    const { departmentId, branchId, semester, sessionId, search, page = 1, limit = 20 } = req.query;
    
    const query = { isActive: true };
    
    if (departmentId) query.departmentId = departmentId;
    if (branchId) query.branchId = branchId;
    if (semester) query.semester = parseInt(semester);
    if (sessionId) query.sessionId = sessionId;
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const skip = (page - 1) * limit;
    
    const papers = await PYQPaper.find(query)
      .select('-searchText -__v')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await PYQPaper.countDocuments(query);
    
    res.json({
      papers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPaperById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const paper = await PYQPaper.findById(id)
      .populate('uploadedBy', 'name');
    
    if (!paper || !paper.isActive) {
      return res.status(404).json({ error: 'Paper not found' });
    }
    
    paper.views += 1;
    await paper.save();
    
    res.json({ paper });
  } catch (error) {
    next(error);
  }
};

export const trackDownload = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const paper = await PYQPaper.findById(id);
    
    if (!paper || !paper.isActive) {
      return res.status(404).json({ error: 'Paper not found' });
    }
    
    paper.downloads += 1;
    await paper.save();
    
    res.json({
      downloadUrl: paper.cloudinaryUrl,
      fileName: `${paper.subjectName}_${paper.examType}_${paper.sessionId}.pdf`,
    });
  } catch (error) {
    next(error);
  }
};
```

**File**: `server/src/routes/pyq.js`
```javascript
import express from 'express';
import {
  searchPapers,
  getPaperById,
  trackDownload,
} from '../controllers/pyqController.js';

const router = express.Router();

router.get('/search', searchPapers);
router.get('/:id', getPaperById);
router.post('/:id/download', trackDownload);

export default router;
```

#### 7. Basic Server Setup
**File**: `server/src/server.js`
```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Routes
import departmentRoutes from './routes/departments.js';
import sessionRoutes from './routes/sessions.js';
import pyqRoutes from './routes/pyq.js';

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/departments', departmentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/pyq', pyqRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### Evening: Test APIs

```bash
# Start server
npm run dev

# Test endpoints
curl http://localhost:5000/health
curl http://localhost:5000/api/departments
curl http://localhost:5000/api/sessions
curl http://localhost:5000/api/departments/btech/branches
```

---

*[Continues with Days 3-10 covering Cloudinary integration, Admin routes, Frontend implementation with Next.js, shadcn/ui components, etc.]*

---

## Quick Summary

**What You'll Build:**

1. ✅ **Public Interface**: Beautiful, responsive UI for browsing PYQs
2. ✅ **Admin Panel**: Secure portal for uploading papers and managing data
3. ✅ **Dynamic Creation**: Admins can create departments/branches/sessions on-the-fly
4. ✅ **Smart Search**: Fast filtering by department → branch → session → semester
5. ✅ **Cloudinary Storage**: Organized PDF storage with CDN delivery
6. ✅ **MongoDB Metadata**: Rich searchable metadata for instant results
7. ✅ **Google OAuth**: Secure authentication for admin access
8. ✅ **Analytics**: Track views, downloads, popular papers

**Key Features:**
- 📱 Mobile responsive (Tailwind + shadcn/ui)
- 🔐 Role-based access control (student/admin/super-admin)
- 📤 Drag-and-drop file upload with progress
- 🎨 Professional UI using shadcn/ui components
- ⚡ Fast search with MongoDB indexes
- 📊 Admin dashboard with statistics
- 🔄 Easy migration from existing GitHub structure

---

Would you like me to:
1. **Continue with Days 3-10** (Cloudinary integration, Auth routes, Frontend implementation)?
2. **Start implementing the backend code** right now in your server folder?
3. **Create the frontend structure** with Next.js, shadcn/ui, and reusing components from the old folder?

Let me know and I'll proceed! 🚀
