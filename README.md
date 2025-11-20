# 📚 InvertisPrep - PYQ Management System

A comprehensive Previous Year Question Papers (PYQ) management platform for Invertis University, built with modern TypeScript stack.

## 🎯 Project Overview

InvertisPrep provides students with easy access to previous year question papers across all departments, branches, and semesters. The admin portal enables staff to upload and manage papers efficiently with a well-organized system.

### Key Features

✅ **For Students:**
- Browse papers by department, branch, semester, and session
- Search papers by subject name or code
- Download papers with analytics tracking
- Responsive design for mobile and desktop

✅ **For Admins:**
- Upload new PYQ papers with metadata
- Update/delete existing papers
- View download statistics and analytics
- Manage paper categorization

✅ **For Super Admins:**
- Create and manage departments
- Create and manage branches
- Create and manage academic sessions
- Full system administration

## 🏗️ Architecture

```
InvertisPrep/
├── server/              # TypeScript Express backend
│   ├── src/
│   │   ├── config/      # Database & Cloudinary
│   │   ├── controllers/ # Business logic
│   │   ├── middleware/  # Auth, errors, upload
│   │   ├── models/      # MongoDB schemas
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Cloudinary service
│   │   ├── types/       # TypeScript types
│   │   └── utils/       # JWT, seeding
│   └── README.md
├── client/              # Next.js frontend (shadcn/ui)
│   └── src/
│       ├── app/         # Next.js 14 pages
│       ├── components/  # React components
│       └── lib/         # Utilities
└── SETUP_GUIDE.md       # Quick start guide
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20.x
- **Framework**: Express.js 4.18.2
- **Language**: TypeScript 5.3.3
- **Database**: MongoDB Atlas with Mongoose
- **Storage**: Cloudinary for PDFs
- **Authentication**: JWT + Google OAuth 2.0
- **File Upload**: Multer (10MB limit)

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State**: React Context API
- **HTTP Client**: Axios/Fetch

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- MongoDB Atlas account
- Cloudinary account
- Google Cloud project (for OAuth)

### Backend Setup

```bash
# Navigate to server folder
cd server

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Seed database
npm run seed

# Start development server
npm run dev
```

Server will run on http://localhost:5000

### Frontend Setup

```bash
# Navigate to client folder
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

Client will run on http://localhost:3000

## 🔐 Environment Configuration

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/invertis-prep

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

## 📊 Database Schema

### Collections
1. **users** - Authentication and user management
2. **departments** - B.Tech, BCA, B.Com, etc.
3. **branches** - CSE, ECE, ME, etc.
4. **sessions** - 2023-24, 2024-25, etc.
5. **pyqpapers** - Question paper metadata and references

### Pre-seeded Data
- 6 departments
- 12 branches
- 5 sessions (2025-26 through 2021-22)
- 1 super admin (admin@invertis.edu.in)

## 🔒 User Roles & Permissions

### Student (Default)
- View departments, branches, sessions
- Search and download papers
- Track personal downloads

### Admin
- All student permissions
- Upload new papers
- Update/delete papers
- View analytics and statistics

### Super Admin
- All admin permissions
- Create/update/delete departments
- Create/update/delete branches
- Create/update/delete sessions
- Full system administration

## 🗂️ Cloudinary Organization

PDFs are stored with organized path structure:

```
invertis/pyq/
└── {department}/           # btech, bca, bcom, etc.
    └── {branch}/           # cse, ece, me, etc.
        └── {session}/      # 2023-24, 2024-25, etc.
            └── sem{X}/     # sem1, sem2, etc.
                └── {CODE}_{TYPE}_{SUBJECT}.pdf
```

Example:
```
invertis/pyq/btech/cse/2023-24/sem1/CS301_mid-term_data-structures.pdf
```

## 🌐 API Endpoints

### Public APIs
- `GET /api/departments` - List all departments
- `GET /api/sessions` - List all sessions
- `GET /api/pyq/search` - Search papers with filters
- `GET /api/pyq/:id` - Get paper details
- `POST /api/pyq/:id/download` - Track download

### Auth APIs
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Admin APIs (Protected)
- `POST /api/admin/pyq/upload` - Upload paper
- `PUT /api/admin/pyq/:id` - Update paper
- `DELETE /api/admin/pyq/:id` - Delete paper
- `GET /api/admin/papers` - List all papers
- `GET /api/admin/statistics` - Get analytics

### Super Admin APIs (Protected)
- `POST /api/super-admin/departments` - Create department
- `PUT /api/super-admin/departments/:id` - Update department
- `POST /api/super-admin/branches` - Create branch
- `POST /api/super-admin/sessions` - Create session

Full API documentation: [server/README.md](server/README.md)

## 🧪 Testing

### Backend Testing
```bash
# Use Postman, Thunder Client, or curl

# Health check
curl http://localhost:5000/health

# Get departments
curl http://localhost:5000/api/departments

# Search papers
curl "http://localhost:5000/api/pyq/search?departmentId=btech&branchId=cse"

# Upload paper (requires JWT)
curl -X POST http://localhost:5000/api/admin/pyq/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@paper.pdf" \
  -F "departmentId=btech" \
  -F "branchId=cse" \
  -F "semester=1" \
  -F "sessionId=2023-24" \
  -F "subjectName=Data Structures" \
  -F "examType=mid-term"
```

## 📱 Frontend Features

### Public Pages
- **Home** - Department selection and search
- **Browse** - Filter by department, branch, semester, session
- **Search Results** - Paginated paper listing
- **Paper Details** - Download and view metadata

### Admin Panel (/admin)
- **Login** - Google OAuth authentication
- **Dashboard** - Statistics and recent uploads
- **Upload Paper** - Form with file upload and metadata
- **Manage Papers** - Edit/delete existing papers
- **Create Categories** - Add departments/branches/sessions (super admin)

## 🎨 UI Components

Built with shadcn/ui:
- Button, Card, Dialog, Form
- Input, Select, Textarea
- Table, Tabs, Toast
- DropdownMenu, Command
- Responsive navigation
- Loading states
- Error boundaries

## 📈 Analytics & Tracking

- Paper view counts
- Download tracking
- Popular papers ranking
- User activity monitoring
- Admin dashboard statistics

## 🔄 Development Workflow

1. **Backend Development**
   - Create/update models
   - Implement controllers
   - Add routes
   - Test with Postman
   - Update TypeScript types

2. **Frontend Development**
   - Design UI components
   - Implement API calls
   - Add state management
   - Style with Tailwind
   - Test responsiveness

3. **Integration**
   - Connect frontend to backend
   - Test authentication flow
   - Verify file uploads
   - Test search and filters
   - Validate permissions

## 🚀 Deployment

### Backend (Railway/Render/Vercel)
```bash
npm run build
npm start
```

### Frontend (Vercel)
```bash
npm run build
# Auto-deploys from GitHub
```

### Environment Variables
- Set all .env variables in hosting platform
- Update CLIENT_URL and API URLs for production
- Configure CORS for production domain

## 📝 Documentation

- [Backend README](server/README.md) - Complete API documentation
- [Setup Guide](SETUP_GUIDE.md) - Quick start and configuration
- [TypeScript Types](server/src/types/index.ts) - Type definitions

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

Built for Invertis University students and staff.

## 🆘 Support

For issues and questions:
1. Check [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. Review [server/README.md](server/README.md)
3. Check server logs for errors
4. Verify environment variables
5. Test endpoints individually

## ⚠️ Important Notes

### Before First Run
- Configure Google Cloud OAuth
- Set up Cloudinary account
- Create MongoDB Atlas cluster
- Update all environment variables

### Security
- Never commit .env files
- Use strong JWT_SECRET
- Whitelist specific IPs in production
- Enable CORS only for trusted domains
- Validate all user inputs
- Sanitize file uploads

### Performance
- MongoDB indexes on frequently queried fields
- Cloudinary CDN for fast PDF delivery
- Pagination for large result sets
- Caching for static data
- Image optimization in frontend

---

**Ready to get started? Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for step-by-step instructions! 🚀**
