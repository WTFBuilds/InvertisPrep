# 🧪 API Testing Guide - InvertisPrep Backend

Complete guide to test all backend endpoints using Postman, Thunder Client, or curl.

## 📋 Prerequisites

- Backend server running on `http://localhost:5000`
- MongoDB seeded with departments, branches, sessions
- Google OAuth configured (for auth testing)
- Cloudinary configured (for upload testing)

## 🔗 Base URL

```
http://localhost:5000
```

---

## 1️⃣ Health Check

### GET /health

**Description**: Verify server is running

```bash
curl http://localhost:5000/health
```

**Expected Response (200)**:
```json
{
  "success": true,
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456
}
```

---

## 2️⃣ Public Endpoints (No Auth Required)

### GET /api/departments

**Description**: Get all active departments

```bash
curl http://localhost:5000/api/departments
```

**Expected Response (200)**:
```json
{
  "success": true,
  "departments": [
    {
      "_id": "...",
      "id": "btech",
      "name": "B.Tech",
      "displayName": "Bachelor of Technology",
      "icon": "🎓",
      "description": "4-year undergraduate engineering program",
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### GET /api/departments/:id

**Description**: Get single department by ID

```bash
curl http://localhost:5000/api/departments/btech
```

### GET /api/departments/:departmentId/branches

**Description**: Get branches for a department

```bash
curl http://localhost:5000/api/departments/btech/branches
```

**Expected Response (200)**:
```json
{
  "success": true,
  "branches": [
    {
      "_id": "...",
      "id": "cse",
      "name": "CSE",
      "displayName": "Computer Science and Engineering",
      "departmentId": "btech",
      "semesters": [1, 2, 3, 4, 5, 6, 7, 8],
      "isActive": true
    }
  ]
}
```

### GET /api/sessions

**Description**: Get all sessions (sorted by year desc)

```bash
curl http://localhost:5000/api/sessions
```

**Expected Response (200)**:
```json
{
  "success": true,
  "sessions": [
    {
      "_id": "...",
      "id": "2025-26",
      "startYear": 2025,
      "endYear": 2026,
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### GET /api/pyq/search

**Description**: Search papers with filters

**Query Parameters**:
- `departmentId` (optional)
- `branchId` (optional)
- `semester` (optional)
- `sessionId` (optional)
- `search` (optional) - Text search
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

```bash
# Search all papers
curl "http://localhost:5000/api/pyq/search"

# Filter by department and branch
curl "http://localhost:5000/api/pyq/search?departmentId=btech&branchId=cse"

# Filter by semester and session
curl "http://localhost:5000/api/pyq/search?semester=1&sessionId=2023-24"

# Text search
curl "http://localhost:5000/api/pyq/search?search=data%20structures"

# Pagination
curl "http://localhost:5000/api/pyq/search?page=2&limit=10"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "papers": [
    {
      "_id": "...",
      "title": "Data Structures Mid-Term",
      "subjectCode": "CS301",
      "subjectName": "Data Structures",
      "departmentId": "btech",
      "branchId": "cse",
      "semester": 1,
      "sessionId": "2023-24",
      "examType": "mid-term",
      "cloudinaryUrl": "https://res.cloudinary.com/...",
      "views": 10,
      "downloads": 5,
      "tags": ["algorithms", "trees", "graphs"],
      "createdAt": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### GET /api/pyq/:id

**Description**: Get paper by ID (increments view count)

```bash
curl http://localhost:5000/api/pyq/PAPER_ID_HERE
```

### POST /api/pyq/:id/download

**Description**: Track download (increments download count)

```bash
curl -X POST http://localhost:5000/api/pyq/PAPER_ID_HERE/download
```

---

## 3️⃣ Authentication Endpoints

### POST /api/auth/google

**Description**: Google OAuth login/signup

**Body** (JSON):
```json
{
  "googleId": "1234567890",
  "email": "admin@invertis.edu.in",
  "name": "Admin User",
  "picture": "https://lh3.googleusercontent.com/..."
}
```

```bash
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "googleId": "1234567890",
    "email": "admin@invertis.edu.in",
    "name": "Admin User",
    "picture": "https://example.com/photo.jpg"
  }'
```

**Expected Response (200)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@invertis.edu.in",
    "name": "Admin User",
    "role": "super-admin",
    "picture": "https://example.com/photo.jpg"
  }
}
```

**⚠️ IMPORTANT**: Save the JWT token for subsequent authenticated requests!

### GET /api/auth/me

**Description**: Get current logged-in user

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "admin@invertis.edu.in",
    "name": "Admin User",
    "role": "super-admin",
    "picture": "https://example.com/photo.jpg",
    "isActive": true
  }
}
```

### POST /api/auth/logout

**Description**: Logout (client-side token removal)

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 4️⃣ Admin Endpoints (Requires Admin/Super-Admin Role)

### POST /api/admin/pyq/upload

**Description**: Upload new PYQ paper

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body** (multipart/form-data):
- `file` (PDF file, required)
- `title` (string, optional)
- `subjectCode` (string, optional)
- `subjectName` (string, required)
- `departmentId` (string, required)
- `branchId` (string, required)
- `semester` (number, required)
- `sessionId` (string, required)
- `examType` (string, required: 'mid-term', 'end-term', 'quiz', 'assignment', 'other')
- `tags` (string, optional - comma-separated)

```bash
curl -X POST http://localhost:5000/api/admin/pyq/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/paper.pdf" \
  -F "title=Data Structures Mid-Term" \
  -F "subjectCode=CS301" \
  -F "subjectName=Data Structures" \
  -F "departmentId=btech" \
  -F "branchId=cse" \
  -F "semester=1" \
  -F "sessionId=2023-24" \
  -F "examType=mid-term" \
  -F "tags=algorithms,trees,graphs"
```

**Expected Response (201)**:
```json
{
  "success": true,
  "message": "Paper uploaded successfully",
  "paper": {
    "id": "...",
    "title": "Data Structures Mid-Term",
    "subjectName": "Data Structures",
    "cloudinaryUrl": "https://res.cloudinary.com/...",
    "createdAt": "..."
  }
}
```

### PUT /api/admin/pyq/:id

**Description**: Update paper metadata

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body** (JSON):
```json
{
  "title": "Updated Title",
  "subjectCode": "CS301",
  "subjectName": "Updated Subject",
  "examType": "end-term",
  "tags": ["updated", "tags"],
  "isActive": true
}
```

```bash
curl -X PUT http://localhost:5000/api/admin/pyq/PAPER_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "examType": "end-term"
  }'
```

### DELETE /api/admin/pyq/:id

**Description**: Delete paper (soft delete)

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

```bash
curl -X DELETE http://localhost:5000/api/admin/pyq/PAPER_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "message": "Paper deleted successfully"
}
```

### GET /api/admin/papers

**Description**: Get all papers with pagination

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters**:
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `search` (optional)
- `departmentId` (optional)

```bash
curl "http://localhost:5000/api/admin/papers?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### GET /api/admin/statistics

**Description**: Get admin dashboard statistics

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

```bash
curl http://localhost:5000/api/admin/statistics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "statistics": {
    "totalPapers": 100,
    "totalDownloads": 1500,
    "totalUsers": 250,
    "totalDepartments": 6,
    "totalBranches": 12,
    "popularPapers": [
      {
        "title": "...",
        "downloads": 50,
        "views": 100
      }
    ],
    "recentUploads": [
      {
        "title": "...",
        "createdAt": "...",
        "uploadedBy": {
          "name": "Admin User"
        }
      }
    ]
  }
}
```

---

## 5️⃣ Super Admin Endpoints (Requires Super-Admin Role)

### POST /api/super-admin/departments

**Description**: Create new department

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body** (JSON):
```json
{
  "id": "barch",
  "name": "B.Arch",
  "displayName": "Bachelor of Architecture",
  "icon": "🏛️",
  "description": "5-year architecture program"
}
```

```bash
curl -X POST http://localhost:5000/api/super-admin/departments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "barch",
    "name": "B.Arch",
    "displayName": "Bachelor of Architecture",
    "icon": "🏛️",
    "description": "5-year architecture program"
  }'
```

### PUT /api/super-admin/departments/:id

**Description**: Update department

```bash
curl -X PUT http://localhost:5000/api/super-admin/departments/barch \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Updated Display Name",
    "description": "Updated description"
  }'
```

### DELETE /api/super-admin/departments/:id

**Description**: Deactivate department (soft delete)

```bash
curl -X DELETE http://localhost:5000/api/super-admin/departments/barch \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### POST /api/super-admin/branches

**Description**: Create new branch

**Body** (JSON):
```json
{
  "id": "ai-ml",
  "name": "AI-ML",
  "displayName": "Artificial Intelligence and Machine Learning",
  "departmentId": "btech",
  "semesters": [1, 2, 3, 4, 5, 6, 7, 8],
  "description": "AI and ML specialization"
}
```

```bash
curl -X POST http://localhost:5000/api/super-admin/branches \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ai-ml",
    "name": "AI-ML",
    "displayName": "AI and ML",
    "departmentId": "btech",
    "semesters": [1, 2, 3, 4, 5, 6, 7, 8]
  }'
```

### PUT /api/super-admin/branches/:id

**Description**: Update branch

**Query**: `departmentId` (required)

```bash
curl -X PUT "http://localhost:5000/api/super-admin/branches/ai-ml?departmentId=btech" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Updated Name",
    "semesters": [1, 2, 3, 4, 5, 6, 7, 8]
  }'
```

### DELETE /api/super-admin/branches/:id

**Description**: Deactivate branch

**Query**: `departmentId` (required)

```bash
curl -X DELETE "http://localhost:5000/api/super-admin/branches/ai-ml?departmentId=btech" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### POST /api/super-admin/sessions

**Description**: Create new session

**Body** (JSON):
```json
{
  "id": "2026-27",
  "startYear": 2026,
  "endYear": 2027,
  "description": "Academic year 2026-27"
}
```

```bash
curl -X POST http://localhost:5000/api/super-admin/sessions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "2026-27",
    "startYear": 2026,
    "endYear": 2027
  }'
```

### PUT /api/super-admin/sessions/:id

**Description**: Update session

```bash
curl -X PUT http://localhost:5000/api/super-admin/sessions/2026-27 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description"
  }'
```

### DELETE /api/super-admin/sessions/:id

**Description**: Deactivate session

```bash
curl -X DELETE http://localhost:5000/api/super-admin/sessions/2026-27 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔐 Authentication Flow

1. **Login with Google OAuth**
   ```bash
   POST /api/auth/google
   ```
   - Returns JWT token
   - Save token for subsequent requests

2. **Use Token in Headers**
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

3. **Verify Authentication**
   ```bash
   GET /api/auth/me
   ```

4. **Logout**
   ```bash
   POST /api/auth/logout
   ```
   - Remove token from client storage

---

## 📋 Common Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields",
  "required": ["departmentId", "branchId", "semester"]
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. Admin role required"
}
```

### 404 Not Found
```json
{
  "error": "Paper not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Something went wrong",
  "stack": "Error stack trace (dev only)"
}
```

---

## 🧪 Testing Checklist

- [ ] Health check returns 200
- [ ] Get all departments
- [ ] Get all sessions
- [ ] Get branches for department
- [ ] Search papers with filters
- [ ] Google OAuth login
- [ ] Get current user (authenticated)
- [ ] Upload paper (admin)
- [ ] Update paper (admin)
- [ ] Delete paper (admin)
- [ ] Get all papers (admin)
- [ ] Get statistics (admin)
- [ ] Create department (super admin)
- [ ] Create branch (super admin)
- [ ] Create session (super admin)
- [ ] Track paper view
- [ ] Track paper download
- [ ] Logout

---

## 💡 Testing Tips

1. **Save JWT Token**: After login, save the token for authenticated requests
2. **Use Variables**: In Postman, create environment variables for `baseURL` and `token`
3. **Check Logs**: Monitor server terminal for error details
4. **MongoDB Compass**: Verify data changes in database
5. **Cloudinary Dashboard**: Check uploaded PDFs
6. **Test Sequentially**: Follow the order above for logical flow
7. **Role Testing**: Test with different user roles (student, admin, super-admin)

---

## 🚀 Postman Collection

Import this JSON into Postman for quick testing:

```json
{
  "info": {
    "name": "InvertisPrep API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Public",
      "item": [
        {
          "name": "Health Check",
          "request": {
            "method": "GET",
            "url": "{{baseURL}}/health"
          }
        },
        {
          "name": "Get Departments",
          "request": {
            "method": "GET",
            "url": "{{baseURL}}/api/departments"
          }
        },
        {
          "name": "Search Papers",
          "request": {
            "method": "GET",
            "url": "{{baseURL}}/api/pyq/search?departmentId=btech&branchId=cse"
          }
        }
      ]
    },
    {
      "name": "Auth",
      "item": [
        {
          "name": "Google Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"googleId\": \"1234567890\",\n  \"email\": \"admin@invertis.edu.in\",\n  \"name\": \"Admin User\"\n}"
            },
            "url": "{{baseURL}}/api/auth/google"
          }
        },
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": "{{baseURL}}/api/auth/me"
          }
        }
      ]
    },
    {
      "name": "Admin",
      "item": [
        {
          "name": "Upload Paper",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "body": {
              "mode": "formdata",
              "formdata": [
                {
                  "key": "file",
                  "type": "file",
                  "src": "/path/to/paper.pdf"
                },
                {
                  "key": "departmentId",
                  "value": "btech"
                },
                {
                  "key": "branchId",
                  "value": "cse"
                },
                {
                  "key": "semester",
                  "value": "1"
                },
                {
                  "key": "sessionId",
                  "value": "2023-24"
                },
                {
                  "key": "subjectName",
                  "value": "Data Structures"
                },
                {
                  "key": "examType",
                  "value": "mid-term"
                }
              ]
            },
            "url": "{{baseURL}}/api/admin/pyq/upload"
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseURL",
      "value": "http://localhost:5000"
    },
    {
      "key": "token",
      "value": "YOUR_JWT_TOKEN"
    }
  ]
}
```

---

**Happy Testing! 🎉**
