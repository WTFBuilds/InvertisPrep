# 🚀 InvertisPrep Quick Setup Guide

## Backend Setup Complete! ✅

Your TypeScript Express backend is fully built with all features implemented.

## What's Been Built

### ✅ Completed Features
1. **TypeScript Backend** - Full Express.js API with strict typing
2. **MongoDB Models** - User, Department, Branch, Session, PYQPaper with indexes
3. **Authentication System** - JWT + Google OAuth 2.0 with role-based access
4. **Public APIs** - Department/branch/session listing, PYQ search with filters
5. **Admin APIs** - Upload, update, delete papers, view statistics
6. **Super Admin APIs** - Manage departments, branches, sessions
7. **Cloudinary Integration** - PDF storage with organized folder structure
8. **Error Handling** - Centralized error handling with proper status codes
9. **File Upload** - Multer configuration with 10MB PDF limit
10. **Database Seeding** - Pre-populated with departments, branches, sessions

### 📊 Database Status
- **Departments**: 6 (B.Tech, BCA, B.Com, BBA, M.Tech, MBA)
- **Branches**: 12 (CSE, ECE, ME, CE, EE, AI, etc.)
- **Sessions**: 5 (2025-26 through 2021-22)
- **Super Admin**: admin@invertis.edu.in

### 🔧 Server Status
- **Port**: 5000
- **MongoDB**: Connected to Atlas
- **Health**: http://localhost:5000/health

## Next Steps

### 1. Configure Google Cloud OAuth (REQUIRED for login)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project "InvertisPrep"
3. Enable APIs:
   - Google+ API
   - Google OAuth2 API
4. Configure OAuth consent screen:
   - User Type: External
   - App name: InvertisPrep
   - Support email: Your email
   - Authorized domains: localhost, your-domain.com
5. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `http://localhost:5000`
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret
7. Update `.env`:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### 2. Configure Cloudinary (REQUIRED for PDF upload)

1. Sign up at [Cloudinary](https://cloudinary.com)
2. Get credentials from Dashboard
3. Update `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

### 3. Test Backend APIs

Use Postman, Thunder Client, or curl:

```bash
# Test health check
curl http://localhost:5000/health

# Get departments
curl http://localhost:5000/api/departments

# Get sessions
curl http://localhost:5000/api/sessions

# Search papers (will be empty until upload)
curl "http://localhost:5000/api/pyq/search?departmentId=btech&branchId=cse"
```

### 4. Test Google OAuth (After Configuration)

```bash
# Test Google OAuth
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "googleId": "test-google-id",
    "email": "admin@invertis.edu.in",
    "name": "Admin User",
    "picture": "https://example.com/photo.jpg"
  }'

# Response will include JWT token
```

### 5. Test Admin Upload (After OAuth)

```bash
# Upload paper (replace YOUR_JWT_TOKEN)
curl -X POST http://localhost:5000/api/admin/pyq/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@sample.pdf" \
  -F "departmentId=btech" \
  -F "branchId=cse" \
  -F "semester=1" \
  -F "sessionId=2023-24" \
  -F "subjectName=Data Structures" \
  -F "subjectCode=CS301" \
  -F "examType=mid-term" \
  -F "tags=algorithms,trees,graphs"
```

### 6. Build Frontend (Next.js)

```bash
# Navigate to client folder
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend should connect to backend at `http://localhost:5000`

## Important Notes

### Current Configuration

✅ **Working:**
- MongoDB Atlas connection
- All API routes registered
- Database seeded with test data
- Server running on port 5000

⚠️ **Requires Configuration:**
- Google OAuth credentials (for login)
- Cloudinary credentials (for PDF upload)

### User Roles

1. **Student** - Default role for new Google OAuth users
   - View and download papers
   
2. **Admin** - Manually set in database
   - Upload, update, delete papers
   - View statistics
   
3. **Super Admin** - admin@invertis.edu.in (pre-seeded)
   - All admin permissions
   - Manage departments, branches, sessions

### To Make a User Admin

Use MongoDB Compass or mongosh:

```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

### API Documentation

Full API documentation is in `server/README.md`:
- All endpoints with examples
- Request/response formats
- Authentication requirements
- Error handling

## Testing Checklist

- [ ] Google OAuth configured and tested
- [ ] Cloudinary configured and tested
- [ ] Can get list of departments
- [ ] Can get list of sessions
- [ ] Can login with Google and get JWT token
- [ ] Can upload paper as admin
- [ ] Can search uploaded papers
- [ ] Can download paper (track analytics)
- [ ] Super admin can create department/branch/session
- [ ] Frontend can connect to backend

## Troubleshooting

### MongoDB Connection Issues
- Verify connection string in `.env`
- Whitelist IP in MongoDB Atlas (0.0.0.0/0 for testing)
- Check network connectivity

### Upload Fails
- Verify Cloudinary credentials
- Check file is PDF and under 10MB
- Ensure JWT token is valid
- Verify user has admin role

### Authentication Issues
- Verify Google OAuth credentials
- Check JWT_SECRET in `.env`
- Ensure token is sent in Authorization header
- Verify user exists in database

## File Structure

```
server/
├── src/
│   ├── config/          # DB & Cloudinary setup
│   ├── controllers/     # Business logic
│   │   ├── authController.ts
│   │   ├── departmentController.ts
│   │   ├── sessionController.ts
│   │   ├── pyqController.ts
│   │   ├── adminController.ts
│   │   └── superAdminController.ts
│   ├── middleware/      # Auth, errors, upload
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API endpoints
│   ├── services/        # Cloudinary service
│   ├── types/           # TypeScript types
│   ├── utils/           # JWT, seeding
│   └── server.ts        # App entry
├── uploads/temp/        # Temp file storage
├── .env                 # Environment variables
├── package.json
├── tsconfig.json
└── README.md           # Full documentation
```

## Resources

- **MongoDB Atlas**: https://cloud.mongodb.com
- **Cloudinary**: https://cloudinary.com
- **Google Cloud Console**: https://console.cloud.google.com
- **Postman**: https://postman.com
- **Thunder Client**: VS Code extension

## Support

If you encounter issues:
1. Check server logs in terminal
2. Verify all environment variables are set
3. Test endpoints individually
4. Check MongoDB Atlas for data
5. Review README.md for detailed documentation

---

**Backend is ready! Configure OAuth & Cloudinary, then start building the frontend! 🎉**
