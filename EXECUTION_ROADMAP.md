# InvertisPrep PYQ System - Execution Roadmap

## 🗓️ 10-Day Implementation Schedule

This document provides day-by-day execution steps with exact code implementations.

---

## 📅 DAY 1: Backend Foundation & Database Setup

### Morning (3-4 hours): Project Initialization

#### 1.1 Setup Backend Structure
```bash
cd server
npm init -y
npm install express mongoose cors dotenv helmet morgan cookie-parser
npm install cloudinary multer jsonwebtoken
npm install --save-dev nodemon
```

#### 1.2 Update package.json
```json
{
  "name": "invertisprep-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "cloudinary": "^1.41.0",
    "multer": "^1.4.5-lts.1",
    "jsonwebtoken": "^9.0.2",
    "cookie-parser": "^1.4.6"
  }
}
```

#### 1.3 Create Environment File
```env
# server/.env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/invertisprep

# JWT
JWT_SECRET=your-super-secret-change-this-in-production
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google OAuth (we'll add later)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Frontend URL
CLIENT_URL=http://localhost:3000
```

#### 1.4 Create Folder Structure
```bash
mkdir -p src/{config,models,routes,controllers,middleware,services,utils}
```

### Afternoon (3-4 hours): Database Configuration & Models

#### 1.5 Database Connection
**File**: `server/src/config/database.js`
```javascript
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes after connection
    await createIndexes();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    // We'll add index creation here after models are created
    console.log('✅ Database indexes created');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
};

export default connectDB;
```

#### 1.6 Create Mongoose Models

**File**: `server/src/models/Department.js`
```javascript
import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  icon: {
    type: String, // Cloudinary URL or emoji
    default: '🎓',
  },
  description: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for faster queries
departmentSchema.index({ id: 1, isActive: 1 });

export default mongoose.model('Department', departmentSchema);
```

**File**: `server/src/models/Branch.js`
```javascript
import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  departmentId: {
    type: String,
    required: true,
    ref: 'Department',
  },
  semesters: {
    type: [Number],
    required: true,
    default: [1, 2, 3, 4, 5, 6, 7, 8],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Compound index for department queries
branchSchema.index({ departmentId: 1, id: 1 }, { unique: true });
branchSchema.index({ departmentId: 1, isActive: 1 });

export default mongoose.model('Branch', branchSchema);
```

**File**: `server/src/models/Session.js`
```javascript
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  startYear: {
    type: Number,
    required: true,
  },
  endYear: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

sessionSchema.index({ id: 1, isActive: 1 });
sessionSchema.index({ startYear: -1 }); // Sort by year descending

export default mongoose.model('Session', sessionSchema);
```

**File**: `server/src/models/User.js`
```javascript
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  picture: {
    type: String,
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'super-admin'],
    default: 'student',
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

userSchema.index({ googleId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

export default mongoose.model('User', userSchema);
```

**File**: `server/src/models/PYQPaper.js`
```javascript
import mongoose from 'mongoose';

const pyqPaperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subjectCode: {
    type: String,
    trim: true,
    uppercase: true,
  },
  subjectName: {
    type: String,
    required: true,
    trim: true,
  },
  
  // Hierarchy
  departmentId: {
    type: String,
    required: true,
    ref: 'Department',
  },
  branchId: {
    type: String,
    required: true,
    ref: 'Branch',
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  sessionId: {
    type: String,
    required: true,
    ref: 'Session',
  },
  
  // Exam details
  examType: {
    type: String,
    enum: ['mid-term', 'end-term', 'sessional', 'assignment'],
    required: true,
  },
  
  // File info
  cloudinaryUrl: {
    type: String,
    required: true,
  },
  cloudinaryPublicId: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number, // in bytes
  },
  pageCount: {
    type: Number,
  },
  
  // Metadata
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  downloads: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Search optimization
  tags: {
    type: [String],
    default: [],
  },
  searchText: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes for fast queries
pyqPaperSchema.index({ departmentId: 1, branchId: 1, semester: 1, sessionId: 1 });
pyqPaperSchema.index({ departmentId: 1, isActive: 1 });
pyqPaperSchema.index({ searchText: 'text' }); // Full-text search
pyqPaperSchema.index({ createdAt: -1 }); // Recent uploads
pyqPaperSchema.index({ downloads: -1 }); // Popular papers

// Pre-save hook to create searchText
pyqPaperSchema.pre('save', function(next) {
  this.searchText = [
    this.title,
    this.subjectName,
    this.subjectCode,
    this.departmentId,
    this.branchId,
    this.examType,
    ...this.tags,
  ].filter(Boolean).join(' ').toLowerCase();
  
  next();
});

export default mongoose.model('PYQPaper', pyqPaperSchema);
```

**File**: `server/src/models/Download.js`
```javascript
import mongoose from 'mongoose';

const downloadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  paperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PYQPaper',
    required: true,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes for analytics
downloadSchema.index({ paperId: 1, createdAt: -1 });
downloadSchema.index({ userId: 1, createdAt: -1 });
downloadSchema.index({ createdAt: -1 }); // Recent downloads

export default mongoose.model('Download', downloadSchema);
```

#### 1.7 Create Index File for Models
**File**: `server/src/models/index.js`
```javascript
export { default as Department } from './Department.js';
export { default as Branch } from './Branch.js';
export { default as Session } from './Session.js';
export { default as User } from './User.js';
export { default as PYQPaper } from './PYQPaper.js';
export { default as Download } from './Download.js';
```

### Evening (2 hours): Database Seeding

#### 1.8 Create Seed Script
**File**: `server/src/utils/seedDatabase.js`
```javascript
import connectDB from '../config/database.js';
import { Department, Branch, Session } from '../models/index.js';

const seedData = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Seeding database...');
    
    // Clear existing data
    await Department.deleteMany({});
    await Branch.deleteMany({});
    await Session.deleteMany({});
    
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
      
      // BCA (no branches, just semesters)
      { id: 'general', name: 'General', departmentId: 'bca', semesters: [1,2,3,4,5,6] },
      
      // B.Com
      { id: 'general', name: 'General', departmentId: 'bcom', semesters: [1,2,3,4,5,6] },
      
      // BBA
      { id: 'general', name: 'General', departmentId: 'bba', semesters: [1,2,3,4,5,6] },
      
      // M.Tech branches
      { id: 'cse', name: 'Computer Science & Engineering', departmentId: 'mtech', semesters: [1,2,3,4] },
      { id: 'vlsi', name: 'VLSI Design', departmentId: 'mtech', semesters: [1,2,3,4] },
      
      // MBA
      { id: 'general', name: 'General', departmentId: 'mba', semesters: [1,2,3,4] },
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
        isActive: i === 0, // Only current year is active
      });
    }
    
    await Session.insertMany(sessions);
    console.log('✅ Sessions seeded');
    
    console.log('🎉 Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
```

Add script to package.json:
```json
{
  "scripts": {
    "seed": "node src/utils/seedDatabase.js"
  }
}
```

---

## 📅 DAY 2: Core Backend Routes & Controllers

### Morning: Authentication & Middleware

#### 2.1 JWT Utilities
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
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
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

#### 2.2 Authentication Middleware
**File**: `server/src/middleware/auth.js`
```javascript
import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/index.js';

export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Get user from database
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};
```

#### 2.3 Error Handler Middleware
**File**: `server/src/middleware/errorHandler.js`
```javascript
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate entry' });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
};

export const notFound = (req, res) => {
  res.status(404).json({ error: 'Route not found' });
};
```

### Afternoon: Public API Routes

#### 2.4 Department Routes & Controller
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
    
    const department = await Department.findOne({ id, isActive: true })
      .select('-__v');
    
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
    
    // Verify department exists
    const department = await Department.findOne({ id: departmentId, isActive: true });
    
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
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

#### 2.5 Session Routes & Controller
**File**: `server/src/controllers/sessionController.js`
```javascript
import { Session } from '../models/index.js';

export const getAllSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ isActive: true })
      .select('-__v')
      .sort({ startYear: -1 }); // Newest first
    
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

#### 2.6 PYQ Public Routes & Controller
**File**: `server/src/controllers/pyqController.js`
```javascript
import { PYQPaper, Download } from '../models/index.js';

export const searchPapers = async (req, res, next) => {
  try {
    const { departmentId, branchId, semester, sessionId, search, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = { isActive: true };
    
    if (departmentId) query.departmentId = departmentId;
    if (branchId) query.branchId = branchId;
    if (semester) query.semester = parseInt(semester);
    if (sessionId) query.sessionId = sessionId;
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Execute query
    const papers = await PYQPaper.find(query)
      .select('-searchText -__v')
      .populate('uploadedBy', 'name')
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
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
      .select('-searchText -__v')
      .populate('uploadedBy', 'name');
    
    if (!paper || !paper.isActive) {
      return res.status(404).json({ error: 'Paper not found' });
    }
    
    // Increment views
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
    
    // Track download (if user is authenticated)
    if (req.user) {
      await Download.create({
        userId: req.user._id,
        paperId: paper._id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }
    
    // Increment download counter
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
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/search', searchPapers);
router.get('/:id', getPaperById);
router.post('/:id/download', authenticate, trackDownload);

export default router;
```

### Evening: Server Setup

#### 2.7 Main Server File
**File**: `server/src/server.js`
```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import departmentRoutes from './routes/departments.js';
import sessionRoutes from './routes/sessions.js';
import pyqRoutes from './routes/pyq.js';
// import authRoutes from './routes/auth.js'; // We'll create tomorrow
// import adminRoutes from './routes/admin.js'; // We'll create tomorrow

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/departments', departmentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/pyq', pyqRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/admin', adminRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});
```

---

## 📅 DAY 3: Cloudinary Integration & Admin Routes

### Morning: Cloudinary Setup

#### 3.1 Cloudinary Configuration
**File**: `server/src/config/cloudinary.js`
```javascript
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

#### 3.2 Cloudinary Service
**File**: `server/src/services/cloudinaryService.js`
```javascript
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

export const uploadPDF = async (filePath, metadata) => {
  try {
    // Create folder path: invertis/pyq/{department}/{branch}/sem{semester}
    const folder = `invertis/pyq/${metadata.departmentId}/${metadata.branchId}/sem${metadata.semester}`;
    
    // Create public_id: {subjectCode}_{examType}_{session}
    const publicId = `${metadata.subjectCode || 'PAPER'}_${metadata.examType}_${metadata.sessionId}`.replace(/\s+/g, '_');
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      public_id: publicId,
      resource_type: 'raw', // For PDF files
      tags: [
        metadata.departmentId,
        metadata.branchId,
        `sem${metadata.semester}`,
        metadata.examType,
      ],
    });
    
    // Delete local file after upload
    fs.unlinkSync(filePath);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      fileSize: result.bytes,
    };
  } catch (error) {
    // Clean up local file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

export const deletePDF = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
    });
    return result;
  } catch (error) {
    throw error;
  }
};
```

#### 3.3 Multer Configuration
**File**: `server/src/middleware/upload.js`
```javascript
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads/temp';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pdf-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter - only PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

export default upload;
```

### Afternoon: Admin Routes & Controllers

#### 3.4 Admin Controller
**File**: `server/src/controllers/adminController.js`
```javascript
import { PYQPaper, Department, Branch, Session } from '../models/index.js';
import { uploadPDF, deletePDF } from '../services/cloudinaryService.js';

export const uploadPaper = async (req, res, next) => {
  try {
    // Validate file exists
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }
    
    // Extract metadata from request body
    const {
      title,
      subjectCode,
      subjectName,
      departmentId,
      branchId,
      semester,
      sessionId,
      examType,
      tags,
    } = req.body;
    
    // Validate required fields
    if (!departmentId || !branchId || !semester || !sessionId || !subjectName || !examType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Verify department, branch, and session exist
    const department = await Department.findOne({ id: departmentId });
    const branch = await Branch.findOne({ id: branchId, departmentId });
    const session = await Session.findOne({ id: sessionId });
    
    if (!department || !branch || !session) {
      return res.status(400).json({ error: 'Invalid department, branch, or session' });
    }
    
    // Upload to Cloudinary
    const cloudinaryResult = await uploadPDF(req.file.path, {
      departmentId,
      branchId,
      semester,
      sessionId,
      subjectCode,
      examType,
    });
    
    // Create paper document
    const paper = await PYQPaper.create({
      title: title || `${subjectName} ${examType}`,
      subjectCode,
      subjectName,
      departmentId,
      branchId,
      semester: parseInt(semester),
      sessionId,
      examType,
      cloudinaryUrl: cloudinaryResult.url,
      cloudinaryPublicId: cloudinaryResult.publicId,
      fileSize: cloudinaryResult.fileSize,
      uploadedBy: req.user._id,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
    });
    
    res.status(201).json({
      success: true,
      message: 'Paper uploaded successfully',
      paper,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePaper = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Don't allow updating certain fields
    delete updates.cloudinaryUrl;
    delete updates.cloudinaryPublicId;
    delete updates.uploadedBy;
    delete updates._id;
    
    const paper = await PYQPaper.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }
    
    res.json({
      success: true,
      message: 'Paper updated successfully',
      paper,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePaper = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const paper = await PYQPaper.findById(id);
    
    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }
    
    // Delete from Cloudinary
    await deletePDF(paper.cloudinaryPublicId);
    
    // Delete from database (soft delete)
    paper.isActive = false;
    await paper.save();
    
    // Or hard delete:
    // await paper.deleteOne();
    
    res.json({
      success: true,
      message: 'Paper deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getStatistics = async (req, res, next) => {
  try {
    const totalPapers = await PYQPaper.countDocuments({ isActive: true });
    const totalDownloads = await PYQPaper.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$downloads' } } },
    ]);
    
    const popularPapers = await PYQPaper.find({ isActive: true })
      .sort({ downloads: -1 })
      .limit(10)
      .select('title subjectName downloads views');
    
    const recentUploads = await PYQPaper.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('uploadedBy', 'name')
      .select('title subjectName createdAt uploadedBy');
    
    res.json({
      statistics: {
        totalPapers,
        totalDownloads: totalDownloads[0]?.total || 0,
        popularPapers,
        recentUploads,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPapers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const query = {};
    if (search) {
      query.$text = { $search: search };
    }
    
    const skip = (page - 1) * limit;
    
    const papers = await PYQPaper.find(query)
      .populate('uploadedBy', 'name email')
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
```

#### 3.5 Admin Routes
**File**: `server/src/routes/admin.js`
```javascript
import express from 'express';
import {
  uploadPaper,
  updatePaper,
  deletePaper,
  getStatistics,
  getAllPapers,
} from '../controllers/adminController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

router.post('/pyq/upload', upload.single('file'), uploadPaper);
router.put('/pyq/:id', updatePaper);
router.delete('/pyq/:id', deletePaper);
router.get('/statistics', getStatistics);
router.get('/papers', getAllPapers);

export default router;
```

#### 3.6 Update Server to Include Admin Routes
Add to `server/src/server.js`:
```javascript
import adminRoutes from './routes/admin.js';

// ... existing code ...

app.use('/api/admin', adminRoutes);
```

---

*Continue with Days 4-10 in next message for brevity...*

Would you like me to:
1. Continue with the remaining days (4-10) covering frontend implementation?
2. Start implementing the backend code files right now?
3. Create additional helper documents (environment setup guide, API documentation, etc.)?
