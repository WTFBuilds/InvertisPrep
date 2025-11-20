# InvertisPrep PYQ System - Complete Implementation Plan

## 🎯 Project Overview

Rebuilding InvertisPrep's PYQ (Previous Year Question Papers) system with:
- **Frontend**: Next.js (already initialized in `/client`)
- **Backend**: Node.js + Express + MongoDB
- **Storage**: Cloudinary for PDF files
- **Authentication**: Google OAuth 2.0 (Google Cloud)
- **Admin Portal**: Secure upload interface with metadata management

---

## 📋 System Architecture

### Data Flow
```
User → Next.js Frontend → Express API → MongoDB (metadata)
                                     → Cloudinary (PDF files)
Admin → Admin Portal → Upload API → Cloudinary + MongoDB
```

### Database Schema (MongoDB)

#### Collections Structure

**1. departments**
```javascript
{
  _id: ObjectId,
  id: "btech",
  name: "B.Tech",
  displayName: "Bachelor of Technology",
  icon: "cloudinary_url",
  description: "Engineering courses",
  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

**2. branches**
```javascript
{
  _id: ObjectId,
  id: "cse",
  name: "Computer Science & Engineering",
  departmentId: "btech",
  semesters: [1, 2, 3, 4, 5, 6, 7, 8],
  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

**3. sessions**
```javascript
{
  _id: ObjectId,
  id: "2023-24",
  name: "Academic Year 2023-24",
  startYear: 2023,
  endYear: 2024,
  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

**4. pyq_papers**
```javascript
{
  _id: ObjectId,
  title: "Data Structures Mid Term",
  subjectCode: "CS301",
  subjectName: "Data Structures & Algorithms",
  
  // Hierarchy
  departmentId: "btech",
  branchId: "cse",
  semester: 5,
  sessionId: "2023-24",
  
  // Exam details
  examType: "mid-term" | "end-term" | "sessional",
  
  // File info
  cloudinaryUrl: "https://res.cloudinary.com/...",
  cloudinaryPublicId: "invertis/pyq/btech/cse/sem5/...",
  fileSize: 1024576, // in bytes
  pageCount: 4,
  
  // Metadata
  uploadedBy: "admin_user_id",
  uploadedAt: Date,
  views: 0,
  downloads: 0,
  isActive: true,
  
  // Search optimization
  tags: ["data-structures", "mid-term", "2023"],
  searchText: "data structures algorithms mid term cse btech",
  
  createdAt: Date,
  updatedAt: Date
}
```

**5. users**
```javascript
{
  _id: ObjectId,
  googleId: "google_oauth_id",
  email: "student@invertis.edu.in",
  name: "Student Name",
  picture: "google_profile_pic_url",
  
  // Role management
  role: "student" | "admin" | "super-admin",
  
  // Activity tracking
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**6. downloads** (Analytics)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  paperId: ObjectId,
  downloadedAt: Date,
  ipAddress: "x.x.x.x"
}
```

---

## 🗂️ Project Structure

```
InvertisPrep/
├── client/                          # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Home page
│   │   │   ├── pyq/
│   │   │   │   ├── page.tsx        # PYQ Department Selection
│   │   │   │   └── [dept]/
│   │   │   │       └── page.tsx    # Branch/Session/Semester Selection
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx        # Admin Dashboard
│   │   │   │   └── upload/
│   │   │   │       └── page.tsx    # Upload PYQ Form
│   │   │   └── api/
│   │   │       └── auth/
│   │   │           └── [...nextauth]/
│   │   │               └── route.ts # NextAuth.js config
│   │   ├── components/
│   │   │   ├── pyq/
│   │   │   │   ├── DepartmentCards.tsx
│   │   │   │   ├── SelectionForm.tsx
│   │   │   │   ├── PaperCard.tsx
│   │   │   │   └── PaperList.tsx
│   │   │   ├── admin/
│   │   │   │   ├── UploadForm.tsx
│   │   │   │   ├── PaperManager.tsx
│   │   │   │   └── Statistics.tsx
│   │   │   └── auth/
│   │   │       ├── LoginButton.tsx
│   │   │       └── ProtectedRoute.tsx
│   │   ├── lib/
│   │   │   ├── api.ts              # API client
│   │   │   ├── auth.ts             # NextAuth config
│   │   │   └── cloudinary.ts       # Cloudinary helpers
│   │   └── types/
│   │       └── index.ts            # TypeScript types
│   └── package.json
│
└── server/                          # Express Backend
    ├── src/
    │   ├── config/
    │   │   ├── database.js         # MongoDB connection
    │   │   ├── cloudinary.js       # Cloudinary config
    │   │   └── oauth.js            # Google OAuth config
    │   ├── models/
    │   │   ├── Department.js
    │   │   ├── Branch.js
    │   │   ├── Session.js
    │   │   ├── PYQPaper.js
    │   │   ├── User.js
    │   │   └── Download.js
    │   ├── routes/
    │   │   ├── auth.js             # Authentication routes
    │   │   ├── departments.js       # Department CRUD
    │   │   ├── pyq.js              # PYQ routes (public)
    │   │   └── admin.js            # Admin routes (protected)
    │   ├── middleware/
    │   │   ├── auth.js             # JWT verification
    │   │   ├── admin.js            # Admin role check
    │   │   ├── upload.js           # Multer config
    │   │   └── errorHandler.js
    │   ├── controllers/
    │   │   ├── authController.js
    │   │   ├── pyqController.js
    │   │   └── adminController.js
    │   ├── services/
    │   │   ├── cloudinaryService.js
    │   │   └── analyticsService.js
    │   └── utils/
    │       ├── validators.js
    │       └── helpers.js
    ├── server.js                    # Entry point
    └── package.json
```

---

## 🔐 Authentication Flow (Google OAuth)

### Setup Required

#### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "InvertisPrep"
3. Enable APIs:
   - Google+ API
   - Google OAuth2 API
4. Create OAuth 2.0 Credentials:
   - Application Type: Web Application
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://invertisprep.com`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://invertisprep.com/api/auth/callback/google`
5. Save:
   - Client ID
   - Client Secret

#### 2. NextAuth.js Implementation (Client)
```typescript
// client/src/lib/auth.ts
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Send user data to your backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: user.id,
          email: user.email,
          name: user.name,
          picture: user.image,
        }),
      });
      
      const data = await response.json();
      user.role = data.role; // Attach role from backend
      user.token = data.token; // JWT token
      
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.accessToken = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}

export default NextAuth(authOptions)
```

---

## 📤 Cloudinary Setup & Integration

### Setup Steps

1. **Create Cloudinary Account**: [cloudinary.com](https://cloudinary.com)
2. **Get Credentials**:
   - Cloud Name
   - API Key
   - API Secret
3. **Configure Upload Presets**:
   - Create preset: `invertis_pyq`
   - Folder: `invertis/pyq`
   - Format: PDF
   - Access Mode: Public

### Backend Integration
```javascript
// server/src/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadPDF = async (file, metadata) => {
  const folderPath = `invertis/pyq/${metadata.department}/${metadata.branch}/sem${metadata.semester}`;
  
  return cloudinary.uploader.upload(file.path, {
    folder: folderPath,
    resource_type: 'raw', // For PDFs
    public_id: `${metadata.subjectCode}_${metadata.examType}_${metadata.session}`,
    tags: [metadata.department, metadata.branch, `sem${metadata.semester}`],
  });
};
```

---

## 🎨 Frontend User Flow

### 1. Department Selection Page
**Route**: `/pyq`

**UI Components**:
- **Hero Section**: Title + description
- **Department Cards Grid**: 
  - Card displays: Icon, Name, Description
  - Hover effect with animation
  - Click navigates to: `/pyq/[departmentId]`

**Example Departments**:
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   🎓 B.Tech  │  │   💻 BCA     │  │  📊 B.Com   │
│   Engineering│  │   Computer   │  │  Commerce   │
└─────────────┘  └─────────────┘  └─────────────┘
```

### 2. Branch/Session/Semester Selection
**Route**: `/pyq/[departmentId]`

**UI Layout** (As shown in your image):
```
┌────────────────────────────────────────────┐
│  Back to Programs                          │
│                                            │
│  BTech Papers                              │
│  Bachelor of Technology Previous Year      │
│  Question Papers                           │
│                                            │
│  [Find Papers] [Results]                   │
│                                            │
│  Find Question Papers                      │
│  Select branch, semester, and session...   │
│                                            │
│  📚 Branch         📅 Session    📖 Semester│
│  [Select Branch▾] [Select Session▾] [Select Semester▾]│
│                                            │
│  [🔍 Search Papers]                        │
└────────────────────────────────────────────┘
```

**Functionality**:
1. Load branches dynamically based on department
2. Load available sessions from backend
3. Semester dropdown (1-8 for B.Tech, 1-6 for BCA, etc.)
4. **Search Button**: Fetches matching papers

### 3. Results Display
**Same page, below form**

**Paper Cards**:
```
┌──────────────────────────────────────┐
│ 📄 Data Structures & Algorithms      │
│ CS301 • Mid Term • Semester 5        │
│ Session: 2023-24                     │
│ ────────────────────────────────     │
│ 👁 123 views  📥 45 downloads        │
│ [View PDF] [Download]                │
└──────────────────────────────────────┘
```

---

## 🔧 Admin Portal

### Access Control
- **Protected Route**: Only users with `role: "admin"` or `role: "super-admin"`
- **Route**: `/admin/upload`

### Upload Form Fields

```
┌─────────────────────────────────────────┐
│  Upload PYQ Paper                       │
│                                         │
│  Department *                           │
│  [Select Department ▾]                  │
│                                         │
│  Branch *                               │
│  [Select Branch ▾]                      │
│                                         │
│  Session *                              │
│  [Select Session ▾]                     │
│                                         │
│  Semester *                             │
│  [Select Semester ▾]                    │
│                                         │
│  Subject Name *                         │
│  [Enter Subject Name]                   │
│                                         │
│  Subject Code                           │
│  [Enter Subject Code (Optional)]        │
│                                         │
│  Exam Type *                            │
│  ○ Mid Term  ○ End Term  ○ Sessional   │
│                                         │
│  Upload PDF *                           │
│  [Choose File] No file chosen           │
│                                         │
│  Tags (comma separated)                 │
│  [e.g., algorithms, theory, important]  │
│                                         │
│  [Cancel] [Upload Paper]                │
└─────────────────────────────────────────┘
```

### Admin Dashboard
- View all uploaded papers
- Edit metadata
- Delete papers
- View statistics (total papers, downloads, popular papers)

---

## 📡 API Endpoints

### Public Routes

#### 1. Get All Departments
```
GET /api/departments
Response: [{ id, name, displayName, icon, description }]
```

#### 2. Get Branches by Department
```
GET /api/departments/:deptId/branches
Response: [{ id, name, semesters }]
```

#### 3. Get All Sessions
```
GET /api/sessions
Response: [{ id, name, startYear, endYear, isActive }]
```

#### 4. Search PYQ Papers
```
GET /api/pyq/search?department=btech&branch=cse&semester=5&session=2023-24
Response: {
  papers: [{
    _id, title, subjectName, subjectCode,
    departmentId, branchId, semester, sessionId,
    examType, cloudinaryUrl, views, downloads
  }],
  total: 25
}
```

#### 5. Get Paper Details
```
GET /api/pyq/:paperId
Response: { paper details + download URL }
```

#### 6. Track Download
```
POST /api/pyq/:paperId/download
Headers: Authorization: Bearer <token>
Response: { downloadUrl, expiresIn }
```

### Protected Routes (Admin)

#### 7. Upload PYQ Paper
```
POST /api/admin/pyq/upload
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data

Body: {
  file: <PDF file>,
  departmentId: "btech",
  branchId: "cse",
  semester: 5,
  sessionId: "2023-24",
  subjectName: "Data Structures",
  subjectCode: "CS301",
  examType: "mid-term",
  tags: ["algorithms", "theory"]
}

Response: {
  success: true,
  paper: { _id, cloudinaryUrl, ... }
}
```

#### 8. Update Paper Metadata
```
PUT /api/admin/pyq/:paperId
Headers: Authorization: Bearer <token>
Body: { title, subjectName, tags, ... }
```

#### 9. Delete Paper
```
DELETE /api/admin/pyq/:paperId
Headers: Authorization: Bearer <token>
```

#### 10. Get Statistics
```
GET /api/admin/statistics
Headers: Authorization: Bearer <token>
Response: {
  totalPapers, totalDownloads, totalUsers,
  popularPapers: [], recentUploads: []
}
```

### Authentication Routes

#### 11. Google OAuth Callback
```
POST /api/auth/google
Body: { googleId, email, name, picture }
Response: { token, user: { id, email, name, role } }
```

---

## ✅ IMPLEMENTATION CHECKLIST

### 📦 PHASE 1: BACKEND FOUNDATION
- [ ] **Day 1: Project Setup & Models**
  - [ ] Initialize backend project with npm
  - [ ] Install all dependencies (express, mongoose, etc.)
  - [ ] Setup folder structure (models, routes, controllers, etc.)
  - [ ] Create .env file with all variables
  - [ ] Create database connection (config/database.js)
  - [ ] Create all 5 Mongoose models (Department, Branch, Session, User, PYQPaper)
  - [ ] Create model index file for exports
  - [ ] Create database seeding script
  - [ ] Test: Run seed script and verify data in MongoDB

- [ ] **Day 2: Authentication & Public APIs**
  - [ ] Create JWT utilities (generate/verify tokens)
  - [ ] Create authentication middleware
  - [ ] Create role-check middleware (isAdmin, isSuperAdmin)
  - [ ] Create error handler middleware
  - [ ] Create Department controller & routes
  - [ ] Create Session controller & routes
  - [ ] Create PYQ public controller & routes
  - [ ] Setup main server file with all routes
  - [ ] Test: Verify all public endpoints work

- [ ] **Day 3: Cloudinary & Admin APIs**
  - [ ] Setup Cloudinary config
  - [ ] Create Cloudinary service (upload/delete functions)
  - [ ] Create Multer upload middleware
  - [ ] Create Admin controller (upload/update/delete papers)
  - [ ] Create Admin routes for paper management
  - [ ] Create Admin routes for creating departments/branches/sessions
  - [ ] Create statistics/analytics endpoint
  - [ ] Test: Upload PDF to Cloudinary via API

- [ ] **Day 4: Google OAuth & Authorization**
  - [ ] Create Google OAuth controller
  - [ ] Create auth routes (login, logout, me)
  - [ ] Test Google OAuth flow
  - [ ] Verify JWT token generation
  - [ ] Test protected routes with token
  - [ ] Test role-based access control

### 🎨 PHASE 2: FRONTEND FOUNDATION
- [ ] **Day 5: Next.js Setup & Reuse Old Components**
  - [ ] Setup Next.js app structure
  - [ ] Install shadcn/ui components
  - [ ] Copy Navbar from old folder
  - [ ] Copy landing page components (Hero, Features, Footer)
  - [ ] Create layout with Navbar
  - [ ] Setup Tailwind config
  - [ ] Create API client utility
  - [ ] Create TypeScript types

- [ ] **Day 6: Public PYQ Pages**
  - [ ] Create /pyq page (Department cards)
  - [ ] Create DepartmentCards component
  - [ ] Create /pyq/[dept] page (Selection form)
  - [ ] Create SelectionForm component with dropdowns
  - [ ] Create PaperCard component
  - [ ] Create PaperList component
  - [ ] Implement search functionality
  - [ ] Test: Complete user flow from department to paper download

- [ ] **Day 7: Admin Authentication UI**
  - [ ] Install NextAuth.js
  - [ ] Setup Google OAuth provider
  - [ ] Create /admin login page
  - [ ] Create ProtectedRoute component
  - [ ] Create admin layout with sidebar
  - [ ] Test: Google login flow

- [ ] **Day 8: Admin Panel - Upload & Management**
  - [ ] Create /admin/dashboard page
  - [ ] Create Statistics dashboard component
  - [ ] Create /admin/upload page
  - [ ] Create UploadForm with all fields
  - [ ] Create modal for creating new department
  - [ ] Create modal for creating new branch
  - [ ] Create modal for creating new session
  - [ ] Implement drag-and-drop file upload
  - [ ] Add upload progress indicator
  - [ ] Create /admin/papers page (manage papers)
  - [ ] Test: Complete admin upload flow

### 🧪 PHASE 3: TESTING & POLISH
- [ ] **Day 9: Integration Testing**
  - [ ] Test all API endpoints
  - [ ] Test authentication flow
  - [ ] Test file upload and download
  - [ ] Test role-based access
  - [ ] Fix bugs and edge cases
  - [ ] Add loading states
  - [ ] Add error handling

- [ ] **Day 10: Deployment & Documentation**
  - [ ] Deploy backend to Railway/Render
  - [ ] Deploy frontend to Vercel
  - [ ] Setup MongoDB Atlas
  - [ ] Configure environment variables
  - [ ] Test production deployment
  - [ ] Write API documentation
  - [ ] Create user guide

---

## 🔨 Implementation Steps

### Phase 1: Backend Setup (Days 1-3)

#### Step 1.1: Initialize Backend
```bash
cd server
npm init -y
npm install express mongoose cors dotenv helmet morgan
npm install cloudinary multer jsonwebtoken bcrypt
npm install --save-dev nodemon
```

#### Step 1.2: Environment Variables
```env
# .env file
PORT=5000
MONGODB_URI=mongodb://localhost:27017/invertisprep
# OR MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/invertisprep

JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

NODE_ENV=development
```

#### Step 1.3: Database Connection
Create `src/config/database.js`

#### Step 1.4: Models
Create all Mongoose models (Department, Branch, Session, PYQPaper, User, Download)

#### Step 1.5: Routes & Controllers
Implement all API endpoints

#### Step 1.6: Middleware
- Authentication middleware (JWT verification)
- Admin role check
- Error handling
- File upload (Multer)

### Phase 2: Frontend Setup (Days 4-6)

#### Step 2.1: NextAuth Setup
```bash
cd client
npm install next-auth
```

#### Step 2.2: Create Components
- DepartmentCards
- SelectionForm (with dropdowns)
- PaperCard & PaperList
- Admin Upload Form

#### Step 2.3: API Integration
Create API client with axios/fetch

#### Step 2.4: Pages
- `/pyq` - Department selection
- `/pyq/[dept]` - Selection form & results
- `/admin/upload` - Admin upload form

### Phase 3: Integration & Testing (Days 7-8)

#### Step 3.1: Test Authentication Flow
- Google login
- Token generation
- Protected routes

#### Step 3.2: Test Upload Flow
- Admin uploads PDF
- Cloudinary storage
- MongoDB metadata save

#### Step 3.3: Test Search & Display
- Department → Branch → Semester flow
- Paper display
- Download tracking

### Phase 4: Seeding & Deployment (Days 9-10)

#### Step 4.1: Seed Database
Create script to populate departments, branches, sessions

#### Step 4.2: Deploy Backend
- Vercel/Railway/Render
- Environment variables

#### Step 4.3: Deploy Frontend
- Vercel (auto-deploy from Git)

---

## 🎯 Key Features Implementation Details

### 1. Cascading Dropdowns
```typescript
// When department changes, fetch branches
useEffect(() => {
  if (selectedDepartment) {
    fetchBranches(selectedDepartment);
  }
}, [selectedDepartment]);

// Sessions are static, loaded once
// Semesters are determined by branch selection
```

### 2. Search Optimization
- Backend creates `searchText` field combining all searchable fields
- MongoDB text index on `searchText`
- Frontend debounces search input

### 3. File Upload with Progress
```typescript
const handleUpload = async (file, metadata) => {
  const formData = new FormData();
  formData.append('file', file);
  Object.keys(metadata).forEach(key => {
    formData.append(key, metadata[key]);
  });

  const response = await axios.post('/api/admin/pyq/upload', formData, {
    headers: { 'Authorization': `Bearer ${token}` },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      setUploadProgress(percentCompleted);
    },
  });
};
```

### 4. Download Tracking
```javascript
// Backend generates temporary signed URL
router.post('/pyq/:id/download', authenticate, async (req, res) => {
  const paper = await PYQPaper.findById(req.params.id);
  
  // Track download
  await Download.create({
    userId: req.user._id,
    paperId: paper._id,
    downloadedAt: new Date(),
  });
  
  // Increment counter
  paper.downloads += 1;
  await paper.save();
  
  // Return Cloudinary URL (it's public)
  res.json({ downloadUrl: paper.cloudinaryUrl });
});
```

### 5. Role-Based Access Control
```typescript
// Middleware
export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// Usage
router.post('/admin/pyq/upload', authenticate, isAdmin, uploadController);
```

---

## 🧪 Testing Checklist

### Backend API Tests
- [ ] User can login with Google
- [ ] JWT token is generated and valid
- [ ] Departments API returns all departments
- [ ] Branches API filters by department
- [ ] Search API filters correctly
- [ ] Admin can upload PDF
- [ ] PDF is stored in Cloudinary
- [ ] Metadata is saved in MongoDB
- [ ] Non-admin cannot access upload endpoint
- [ ] Download tracking works

### Frontend Tests
- [ ] Department cards display correctly
- [ ] Clicking department navigates to selection page
- [ ] Branch dropdown populates based on department
- [ ] Search button triggers API call
- [ ] Papers display in grid/list
- [ ] Download button works
- [ ] Admin portal is protected
- [ ] Upload form validates inputs
- [ ] Upload progress shows

---

## 📦 Deliverables

1. **Backend API** (Node.js + Express + MongoDB)
   - All endpoints functional
   - Authentication working
   - Cloudinary integration complete

2. **Frontend Application** (Next.js)
   - Department selection page
   - Search & filter page
   - Admin upload portal
   - Google login integration

3. **Database Seeding Scripts**
   - Departments, branches, sessions
   - Sample admin user

4. **Documentation**
   - API documentation
   - Deployment guide
   - User manual

---

## 🚀 Quick Start Commands

### Backend
```bash
cd server
npm install
npm run dev  # Starts on port 5000
```

### Frontend
```bash
cd client
npm install
npm run dev  # Starts on port 3000
```

### MongoDB (Local)
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod --dbpath /path/to/data
```

---

## 📝 Notes & Best Practices

1. **Security**:
   - Never commit `.env` files
   - Use HTTPS in production
   - Sanitize all inputs
   - Rate limit upload endpoint

2. **Performance**:
   - Index MongoDB collections (departmentId, branchId, semester)
   - Cache frequently accessed data
   - Use CDN for Cloudinary

3. **UX**:
   - Show loading states
   - Display error messages clearly
   - Add skeleton loaders
   - Mobile responsive design

4. **Scalability**:
   - Cloudinary handles file storage (no server disk usage)
   - MongoDB Atlas for production (auto-scaling)
   - Separate media and API servers if needed

---

## 🎨 UI/UX Enhancements

1. **Animations**: Framer Motion for page transitions
2. **Icons**: Lucide React for consistent iconography
3. **Toasts**: Sonner for notifications
4. **Forms**: React Hook Form + Zod validation
5. **Styling**: Tailwind CSS + shadcn/ui components

---

## 📚 Technology Stack Summary

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: NextAuth.js
- **State**: React Context / Zustand
- **Forms**: React Hook Form
- **HTTP**: Axios / Fetch API

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Storage**: Cloudinary
- **Auth**: JWT + Google OAuth
- **Validation**: Joi / Express Validator

### DevOps
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Railway / Render
- **Database**: MongoDB Atlas
- **CDN**: Cloudinary CDN

---

## 🎯 Success Metrics

- Admin can upload 100+ PDFs efficiently
- Users can find papers in < 3 clicks
- Search returns results in < 500ms
- 99.9% uptime for API
- Mobile responsive on all screen sizes

---

## 📞 Support & Maintenance

- Monitor Cloudinary usage (free tier limits)
- Regular database backups
- Log rotation and monitoring
- Security updates for dependencies

---

**Created by**: AhqafCoder  
**Date**: November 20, 2025  
**Project**: InvertisPrep PYQ System v2.0
