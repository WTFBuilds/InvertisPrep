# InvertisPrep Backend API

TypeScript-based Express.js backend for the InvertisPrep PYQ (Previous Year Question Papers) management system.

## 🚀 Tech Stack

- **Runtime**: Node.js 20.x
- **Framework**: Express.js 4.18.2
- **Language**: TypeScript 5.3.3
- **Database**: MongoDB Atlas with Mongoose ODM
- **Storage**: Cloudinary for PDF files
- **Authentication**: JWT + Google OAuth 2.0
- **File Upload**: Multer (10MB PDF limit)

## 📁 Project Structure

```
server/
├── src/
│   ├── config/          # Database & Cloudinary configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, error handling, file upload
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── services/        # Cloudinary service layer
│   ├── types/           # TypeScript interfaces
│   ├── utils/           # JWT, database seeding
│   └── server.ts        # Application entry point
├── uploads/temp/        # Temporary file storage
├── .env                 # Environment variables
├── package.json
└── tsconfig.json
```

## 🔧 Environment Variables

Create a `.env` file in the server directory:

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/invertis-prep?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 📦 Installation

```bash
# Install dependencies
npm install

# Seed the database (creates departments, branches, sessions, super admin)
npm run seed

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔐 Database Seeding

The seed script creates:
- **6 Departments**: B.Tech, BCA, B.Com, BBA, M.Tech, MBA
- **12 Branches**: CSE, ECE, ME, CE, EE, AI (B.Tech), etc.
- **5 Sessions**: 2025-26, 2024-25, 2023-24, 2022-23, 2021-22
- **1 Super Admin**: admin@invertis.edu.in (role: super-admin)

```bash
npm run seed
```

## 🌐 API Endpoints

### Public Endpoints

#### Departments
- `GET /api/departments` - Get all active departments
- `GET /api/departments/:id` - Get single department
- `GET /api/departments/:departmentId/branches` - Get branches by department

#### Sessions
- `GET /api/sessions` - Get all sessions (sorted by year desc)
- `GET /api/sessions/:id` - Get single session

#### PYQ Papers
- `GET /api/pyq/search` - Search papers with filters
  - Query params: `departmentId`, `branchId`, `semester`, `sessionId`, `search`, `page`, `limit`
- `GET /api/pyq/:id` - Get paper by ID (increments views)
- `POST /api/pyq/:id/download` - Track download (increments downloads)

### Authentication Endpoints

#### Google OAuth
- `POST /api/auth/google` - Google OAuth callback
  - Body: `{ googleId, email, name, picture }`
  - Returns: `{ token, user }`

- `GET /api/auth/me` - Get current user (Protected)
  - Headers: `Authorization: Bearer <token>`
  
- `POST /api/auth/logout` - Logout (Protected)
  - Headers: `Authorization: Bearer <token>`

### Admin Endpoints (Requires Admin Role)

All admin routes require `Authorization: Bearer <token>` header.

#### Paper Management
- `POST /api/admin/pyq/upload` - Upload new paper
  - Content-Type: `multipart/form-data`
  - Fields: `file` (PDF), `title`, `subjectCode`, `subjectName`, `departmentId`, `branchId`, `semester`, `sessionId`, `examType`, `tags`
  
- `PUT /api/admin/pyq/:id` - Update paper metadata
  - Body: `{ title?, subjectCode?, subjectName?, examType?, tags?, isActive? }`
  
- `DELETE /api/admin/pyq/:id` - Delete paper (soft delete)

- `GET /api/admin/papers` - Get all papers (paginated)
  - Query params: `page`, `limit`, `search`, `departmentId`

#### Statistics
- `GET /api/admin/statistics` - Get admin dashboard statistics
  - Returns: totalPapers, totalDownloads, totalUsers, popularPapers, recentUploads

### Super Admin Endpoints (Requires Super Admin Role)

All super admin routes require `Authorization: Bearer <token>` header with super-admin role.

#### Department Management
- `POST /api/super-admin/departments` - Create department
  - Body: `{ id, name, displayName, icon?, description }`
  
- `PUT /api/super-admin/departments/:id` - Update department
  - Body: `{ name?, displayName?, icon?, description?, isActive? }`
  
- `DELETE /api/super-admin/departments/:id` - Deactivate department

#### Branch Management
- `POST /api/super-admin/branches` - Create branch
  - Body: `{ id, name, displayName?, departmentId, semesters, description? }`
  
- `PUT /api/super-admin/branches/:id` - Update branch
  - Query: `departmentId`
  - Body: `{ name?, displayName?, semesters?, description?, isActive? }`
  
- `DELETE /api/super-admin/branches/:id` - Deactivate branch
  - Query: `departmentId`

#### Session Management
- `POST /api/super-admin/sessions` - Create session
  - Body: `{ id, startYear, endYear, description? }`
  
- `PUT /api/super-admin/sessions/:id` - Update session
  - Body: `{ startYear?, endYear?, description?, isActive? }`
  
- `DELETE /api/super-admin/sessions/:id` - Deactivate session

## 🗂️ Cloudinary Folder Structure

PDFs are organized in Cloudinary with the following path structure:

```
invertis/pyq/{department}/{branch}/{session}/sem{X}/{CODE}_{TYPE}_{SUBJECT-SLUG}.pdf
```

Example:
```
invertis/pyq/btech/cse/2023-24/sem1/CS301_mid-term_data-structures.pdf
```

## 🔒 User Roles

1. **Student** (default)
   - View departments, branches, sessions
   - Search and download PYQ papers
   - Track downloads

2. **Admin**
   - All student permissions
   - Upload new papers
   - Update/delete papers
   - View statistics

3. **Super Admin**
   - All admin permissions
   - Create/update/delete departments
   - Create/update/delete branches
   - Create/update/delete sessions

## 🛡️ Middleware

- **authenticate**: Verifies JWT token, attaches user to req.user
- **isAdmin**: Checks if user has admin or super-admin role
- **isSuperAdmin**: Checks if user has super-admin role
- **optionalAuth**: Non-blocking auth (for public endpoints with optional tracking)
- **errorHandler**: Centralized error handling with proper status codes
- **upload**: Multer configuration for PDF uploads (10MB limit)

## 🧪 Testing Endpoints

Use Postman, Thunder Client, or curl to test:

```bash
# Health check
curl http://localhost:5000/health

# Get all departments
curl http://localhost:5000/api/departments

# Search papers
curl "http://localhost:5000/api/pyq/search?departmentId=btech&branchId=cse&semester=1"

# Upload paper (admin)
curl -X POST http://localhost:5000/api/admin/pyq/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@paper.pdf" \
  -F "departmentId=btech" \
  -F "branchId=cse" \
  -F "semester=1" \
  -F "sessionId=2023-24" \
  -F "subjectName=Data Structures" \
  -F "subjectCode=CS301" \
  -F "examType=mid-term"
```

## 🐛 Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message here",
  "stack": "Stack trace (development only)"
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## 📝 TypeScript Types

All interfaces are defined in `src/types/index.ts`:
- IUser, IDepartment, IBranch, ISession, IPYQPaper
- CreateDTO, UpdateDTO for all entities
- SearchPapersQuery, PaginationMeta, AuthResponse
- UserRole, ExamType enums

## 🚨 Important Notes

1. **Google OAuth Setup Required**: 
   - Create project in Google Cloud Console
   - Enable Google+ API and OAuth2 API
   - Configure OAuth consent screen
   - Create OAuth 2.0 credentials
   - Add authorized origins and redirect URIs
   - Update .env with credentials

2. **Cloudinary Setup Required**:
   - Sign up at cloudinary.com
   - Get cloud name, API key, and API secret
   - Update .env with credentials

3. **MongoDB Atlas Setup**:
   - Create cluster at mongodb.com
   - Whitelist IP address (0.0.0.0/0 for development)
   - Create database user
   - Update .env with connection string

4. **File Upload**:
   - Only PDF files accepted
   - Max file size: 10MB
   - Files temporarily stored in uploads/temp
   - Automatically uploaded to Cloudinary and local file deleted

## 🔄 Development Workflow

1. Start MongoDB Atlas connection
2. Configure environment variables
3. Run database seeding
4. Start development server
5. Test endpoints with REST client
6. Check MongoDB Atlas for data persistence
7. Verify Cloudinary uploads (after configuration)

## 📧 Super Admin Login

Default super admin credentials (after seeding):
- Email: admin@invertis.edu.in
- Google OAuth required for login
- Role: super-admin

## 🏗️ Next Steps

- [ ] Configure Google Cloud OAuth credentials
- [ ] Add Cloudinary credentials to .env
- [ ] Test all endpoints with Postman/Thunder Client
- [ ] Build Next.js frontend
- [ ] Deploy backend to production
