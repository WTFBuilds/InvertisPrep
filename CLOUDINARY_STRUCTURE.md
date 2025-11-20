# PYQ Upload System - Cloudinary Folder Structure

## 📁 Nested Folder Organization

The system uses a hierarchical folder structure in Cloudinary to organize PYQ papers efficiently.

### Folder Structure Pattern

```
invertis/pyq/{department}/{branch}/{session}/sem{semester}/{filename}
```

### Example Folder Paths

```
invertis/pyq/
├── CS/                                    # Computer Science Department
│   ├── CSE/                              # Computer Science & Engineering Branch
│   │   ├── ODD-2024-25/                  # Odd Semester 2024-25 Session
│   │   │   ├── sem1/
│   │   │   │   ├── CS101_mid-term_programming-fundamentals.pdf
│   │   │   │   └── CS102_end-term_data-structures.pdf
│   │   │   ├── sem3/
│   │   │   │   ├── CS301_mid-term_database-systems.pdf
│   │   │   │   └── CS302_end-term_operating-systems.pdf
│   │   │   └── sem5/
│   │   └── EVEN-2024-25/                 # Even Semester 2024-25 Session
│   │       ├── sem2/
│   │       └── sem4/
│   └── IT/                               # Information Technology Branch
│       ├── ODD-2024-25/
│       │   ├── sem1/
│       │   └── sem3/
│       └── EVEN-2024-25/
├── MGMT/                                  # Management Department
│   ├── MBA/
│   │   ├── ODD-2024-25/
│   │   │   ├── sem1/
│   │   │   └── sem3/
│   │   └── EVEN-2024-25/
│   └── BBA/
└── PHARMACY/                              # Pharmacy Department
    ├── B-PHARM/
    └── M-PHARM/
```

## 🏗️ How It Works

### 1. Upload Request
When an admin uploads a PYQ paper, they provide:
- **Department ID**: e.g., `CS` (Computer Science)
- **Branch ID**: e.g., `CSE` (Computer Science & Engineering)
- **Session ID**: e.g., `ODD-2024-25` (Odd Semester 2024-25)
- **Semester**: e.g., `3` (Third semester)
- **Subject Name**: e.g., `Database Management Systems`
- **Subject Code**: e.g., `CS301`
- **Exam Type**: e.g., `mid-term`, `end-term`, or `sessional`

### 2. Cloudinary Path Generation
The system automatically generates the folder path:
```typescript
const folder = `invertis/pyq/${departmentId}/${branchId}/${sessionId}/sem${semester}`;
// Result: invertis/pyq/CS/CSE/ODD-2024-25/sem3
```

### 3. File Naming Convention
Files are named using a standardized format:
```typescript
const filename = `${subjectCode}_${examType}_${subject-slug}`;
// Result: CS301_mid-term_database-management-systems.pdf
```

### 4. MongoDB Metadata Storage
After upload, the following metadata is stored in MongoDB:

```json
{
  "_id": "paper_id_here",
  "title": "Database Management Systems Mid-Term",
  "subjectCode": "CS301",
  "subjectName": "Database Management Systems",
  "departmentId": "CS",
  "branchId": "CSE",
  "semester": 3,
  "sessionId": "ODD-2024-25",
  "examType": "mid-term",
  "cloudinaryUrl": "https://res.cloudinary.com/ditrri7em/raw/upload/v1234567890/invertis/pyq/CS/CSE/ODD-2024-25/sem3/CS301_mid-term_database-management-systems.pdf",
  "cloudinaryPublicId": "invertis/pyq/CS/CSE/ODD-2024-25/sem3/CS301_mid-term_database-management-systems",
  "fileSize": 2458624,
  "pageCount": 8,
  "uploadedBy": "admin_user_id",
  "downloads": 0,
  "views": 0,
  "tags": ["database", "sql", "dbms"],
  "isActive": true,
  "createdAt": "2024-11-20T10:30:00.000Z",
  "updatedAt": "2024-11-20T10:30:00.000Z"
}
```

## 🔍 Search & Filter Benefits

### 1. Efficient Queries
The hierarchical structure enables efficient MongoDB queries:

```javascript
// Find all papers for CSE branch, semester 3
db.pyqpapers.find({
  branchId: 'CSE',
  semester: 3,
  isActive: true
})

// Find papers for specific session
db.pyqpapers.find({
  sessionId: 'ODD-2024-25',
  departmentId: 'CS',
  semester: { $in: [1, 3, 5] } // Odd semesters
})

// Find papers by subject code
db.pyqpapers.find({
  subjectCode: 'CS301'
})
```

### 2. Cloudinary Tags
Each uploaded file gets tagged automatically:
```javascript
tags: [
  'CS',           // Department
  'CSE',          // Branch
  'sem3',         // Semester
  'ODD-2024-25',  // Session
  'mid-term'      // Exam type
]
```

This allows for:
- Batch operations (delete all papers from a session)
- Analytics (most popular papers by department)
- Cloudinary admin panel filtering

### 3. Compound Indexes
MongoDB indexes optimize common queries:
```javascript
// Fast lookup for specific paper
{ departmentId: 1, branchId: 1, semester: 1, sessionId: 1 }

// Popular papers
{ downloads: -1 }

// Recent uploads
{ createdAt: -1 }

// Text search
{ searchText: 'text' }
```

## 📤 Upload Flow

```
1. Admin selects PDF file
   ↓
2. Admin fills form:
   - Department (dropdown)
   - Branch (dropdown - filtered by department)
   - Session (dropdown)
   - Semester (1-8)
   - Subject Name (text)
   - Subject Code (text)
   - Exam Type (dropdown)
   - Tags (optional, comma-separated)
   ↓
3. Frontend validates inputs
   ↓
4. POST /api/admin/pyq/upload
   ↓
5. Backend validates:
   - File exists (PDF only)
   - Department exists
   - Branch exists in department
   - Session exists
   - All required fields present
   ↓
6. Generate Cloudinary path:
   invertis/pyq/{dept}/{branch}/{session}/sem{X}
   ↓
7. Generate filename:
   {CODE}_{TYPE}_{SUBJECT-SLUG}
   ↓
8. Upload to Cloudinary with:
   - Folder path
   - Public ID (filename)
   - Tags
   - Context metadata
   ↓
9. Save to MongoDB:
   - All metadata
   - Cloudinary URL
   - Cloudinary Public ID
   - File info (size, pages)
   ↓
10. Return success response
    ↓
11. Clean up temporary local file
```

## 🗑️ Delete Flow

```
1. Admin clicks delete on a paper
   ↓
2. Confirm deletion dialog
   ↓
3. DELETE /api/admin/pyq/:id
   ↓
4. Fetch paper from MongoDB
   ↓
5. Delete from Cloudinary using publicId
   ↓
6. Delete from MongoDB
   ↓
7. Return success response
```

## 📊 Data Integrity

### References & Validation
- **Department ID**: Must exist in departments collection
- **Branch ID**: Must exist in branches collection AND belong to the department
- **Session ID**: Must exist in sessions collection
- **Semester**: Must be between 1-10
- **Exam Type**: Must be one of: `mid-term`, `end-term`, `sessional`

### Cascading Operations
When a department/branch/session is deleted:
1. Papers can be marked as inactive (soft delete)
2. Or removed entirely (with Cloudinary cleanup)

## 🔐 Security Features

### Upload Restrictions
- **File Type**: Only PDF files allowed
- **File Size**: Maximum 10MB (configurable)
- **Authentication**: JWT token required
- **Authorization**: Admin or Super Admin role only
- **Path Traversal**: Prevented by controlled folder generation

### Access Control
- **Public Read**: Anyone can view/download papers
- **Admin Write**: Only admins can upload
- **Admin Edit**: Admins can edit their own papers
- **Super Admin**: Can edit/delete any paper

## 🎯 Search Implementation

### Frontend Search Flow
```
User enters search on /pyq/CS page
   ↓
Filter by:
- Branch (CSE, IT, etc.)
- Semester (1-8)
- Session (ODD-2024-25, etc.)
- Search text (subject name/code)
   ↓
GET /api/public/pyq/search?
  departmentId=CS&
  branchId=CSE&
  semester=3&
  sessionId=ODD-2024-25&
  search=database
   ↓
Backend performs MongoDB query:
{
  departmentId: 'CS',
  branchId: 'CSE',
  semester: 3,
  sessionId: 'ODD-2024-25',
  $text: { $search: 'database' },
  isActive: true
}
   ↓
Returns paginated results with:
- Paper details
- Download count
- File info
```

## 📈 Analytics Potential

With this structure, you can easily track:
- **Most Downloaded Papers**: By semester/branch
- **Popular Subjects**: Across departments
- **Upload Trends**: Papers uploaded per session
- **Department Activity**: Which departments upload most
- **Storage Usage**: Per department/branch/session

## 🔧 Maintenance

### Cleanup Orphaned Files
Run periodic cleanup to remove Cloudinary files without MongoDB entries:
```javascript
// Get all Cloudinary files in folder
const cloudinaryFiles = await cloudinary.api.resources({
  type: 'upload',
  prefix: 'invertis/pyq/',
  resource_type: 'raw'
});

// Check against MongoDB
for (const file of cloudinaryFiles.resources) {
  const exists = await PYQPaper.findOne({ 
    cloudinaryPublicId: file.public_id 
  });
  
  if (!exists) {
    await cloudinary.uploader.destroy(file.public_id, {
      resource_type: 'raw'
    });
  }
}
```

### Bulk Operations
Move papers to new session:
```javascript
// Update all papers from OLD session to NEW session
await PYQPaper.updateMany(
  { sessionId: 'ODD-2023-24' },
  { sessionId: 'ODD-2024-25' }
);
```

## 🚀 Future Enhancements

1. **Automatic OCR**: Extract text from PDFs for better search
2. **PDF Preview**: Generate thumbnail images
3. **Compression**: Optimize PDFs before upload
4. **Versioning**: Keep multiple versions of same paper
5. **Batch Upload**: Upload multiple papers at once
6. **CSV Import**: Bulk import paper metadata
7. **Export**: Download papers as ZIP by semester/branch

## 📝 Example API Calls

### Upload Paper
```bash
POST /api/admin/pyq/upload
Headers: Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- file: [PDF file]
- departmentId: CS
- branchId: CSE
- sessionId: ODD-2024-25
- semester: 3
- subjectName: Database Management Systems
- subjectCode: CS301
- examType: mid-term
- tags: database,sql,dbms
```

### Search Papers
```bash
GET /api/public/pyq/search?
  departmentId=CS&
  branchId=CSE&
  semester=3&
  sessionId=ODD-2024-25&
  search=database&
  page=1&
  limit=10
```

### Get Paper Details
```bash
GET /api/public/pyq/{paperId}
```

### Download Paper
```bash
POST /api/public/pyq/{paperId}/download
```

This structure ensures:
✅ Organized file storage
✅ Fast search and retrieval
✅ Easy maintenance
✅ Scalable architecture
✅ Data integrity
