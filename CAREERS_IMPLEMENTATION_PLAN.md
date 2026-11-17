# Careers Page Implementation Plan

## Overview
Replace Google Form with a professional, self-hosted careers page on InvertisPrep. Users can browse open roles, view requirements, and submit multi-step applications. Admins can review/manage applications from a dedicated dashboard.

## Tech Stack Alignment
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: Express 5, MongoDB/Mongoose, JWT auth with Redis caching
- **Design**: Clean, modern, professional — no AI-looking gradients, minimal color, strong typography, generous whitespace, responsive

---

## Database Model

### `server/src/models/CareerApplication.js`
```javascript
const careerApplicationSchema = new Schema({
  // Section 1: Personal Information
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 150 },
  whatsappNumber: { type: String, required: true, trim: true, maxlength: 20 },
  departmentBranch: { type: String, required: true, trim: true, maxlength: 100 },
  currentSemester: { type: String, required: true, enum: ['1st','2nd','3rd','4th','5th','6th','7th','8th'] },
  currentLocation: { type: String, required: true, enum: ['Bareilly','Rampur','Shahjahanpur','Other'] },
  customLocation: { type: String, trim: true, maxlength: 100 },

  // Section 2: Domain Selection
  appliedDomain: { type: String, required: true, enum: [
    'Canva designer',
    'Video Editor',
    'Support and Resource Team (SRT)',
    'Developers',
    'Content writer',
    'Technical support',
    'Social media manager',
    'Marketing'
  ]},
  hybridComfortable: { type: Boolean, required: true },
  interestReason: { type: String, required: true, maxlength: 2000 },

  // Section 3: Skills & Proficiency
  skills: { type: String, required: true, maxlength: 2000 },
  proficiencyLevel: { type: String, required: true, enum: ['Beginner (Learning the basics)','Intermediate (Have some hands-on experience)','Advanced (Confident and have done projects)'] },
  hasProjects: { type: Boolean, required: true },
  projectDescription: { type: String, maxlength: 3000 },

  // Section 4: Resume & Portfolio
  resumeLink: { type: String, required: true, trim: true, maxlength: 500 },
  portfolioLink: { type: String, trim: true, maxlength: 500 },

  // Section 5: Final Questions
  heardFrom: { type: String, required: true, enum: [
    'Friend / Classmate',
    'Social Media (Instagram / WhatsApp)',
    'Invertis Confession',
    'InvertisPrep Website',
    'Other'
  ]},
  customHeardFrom: { type: String, trim: true, maxlength: 100 },
  availability: { type: String, required: true, enum: ['Yes, fully available','Available with minor scheduling constraints','Not sure yet'] },
  additionalNotes: { type: String, maxlength: 3000 },

  // Metadata
  status: { type: String, enum: ['pending','under_review','shortlisted','rejected','hired'], default: 'pending' },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // optional if logged in
  ipAddress: { type: String },
  userAgent: { type: String },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  reviewNotes: { type: String, maxlength: 2000 },
}, { timestamps: true });

// Indexes
careerApplicationSchema.index({ status: 1, createdAt: -1 });
careerApplicationSchema.index({ appliedDomain: 1, status: 1 });
careerApplicationSchema.index({ email: 1 });
```

---

## Server Implementation

### 1. Permission Keys (add to `server/src/shared/permissions.js`)
```javascript
// Add to GRANTABLE_PERMISSION_KEYS
'careers.view',      // View applications list
'careers.manage',    // Update status, add notes, delete
```

### 2. Controller (`server/src/controllers/careerController.js`)
```javascript
// POST /api/careers/apply - Public submit (optional auth)
export const submitApplication = async (req, res) => { ... }

// GET /api/careers/applications - Staff list with filters/pagination
export const getApplications = async (req, res) => { ... }

// GET /api/careers/applications/:id - Staff detail view
export const getApplication = async (req, res) => { ... }

// PATCH /api/careers/applications/:id - Staff update status/notes
export const updateApplication = async (req, res) => { ... }

// DELETE /api/careers/applications/:id - Staff delete
export const deleteApplication = async (req, res) => { ... }

// GET /api/careers/stats - Dashboard stats
export const getStats = async (req, res) => { ... }
```

### 3. Routes (`server/src/routes/careers.js`)
```javascript
router.post('/apply', optionalAuthenticateJWT, submitApplication);
router.get('/applications', authenticateJWT, requirePermission('careers.view'), getApplications);
router.get('/applications/stats', authenticateJWT, requirePermission('careers.view'), getStats);
router.get('/applications/:id', authenticateJWT, requirePermission('careers.view'), getApplication);
router.patch('/applications/:id', authenticateJWT, requirePermission('careers.manage'), updateApplication);
router.delete('/applications/:id', authenticateJWT, requirePermission('careers.manage'), deleteApplication);
```

### 4. Register in `server/src/server.js`
```javascript
import careerRoutes from './routes/careers.js';
app.use('/api/careers', careerRoutes);
```

---

## Client Implementation

### 1. API Client (`client/lib/api.ts` - add `careerApi`)
```typescript
export const careerApi = {
  submit: (data: CareerApplicationInput) => api.post('/careers/apply', data),
  list: (params: ApplicationListParams) => api.get('/careers/applications', { params }),
  get: (id: string) => api.get(`/careers/applications/${id}`),
  update: (id: string, data: Partial<ApplicationUpdate>) => api.patch(`/careers/applications/${id}`, data),
  delete: (id: string) => api.delete(`/careers/applications/${id}`),
  stats: () => api.get('/careers/applications/stats'),
};
```

### 2. Types (`client/types/index.ts`)
```typescript
export interface CareerApplication {
  _id: string;
  fullName: string;
  email: string;
  whatsappNumber: string;
  departmentBranch: string;
  currentSemester: string;
  currentLocation: string;
  customLocation?: string;
  appliedDomain: string;
  hybridComfortable: boolean;
  interestReason: string;
  skills: string;
  proficiencyLevel: string;
  hasProjects: boolean;
  projectDescription?: string;
  resumeLink: string;
  portfolioLink?: string;
  heardFrom: string;
  customHeardFrom?: string;
  availability: string;
  additionalNotes?: string;
  status: 'pending' | 'under_review' | 'shortlisted' | 'rejected' | 'hired';
  submittedBy?: UserRef;
  reviewedBy?: UserRef;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3. Permissions (`client/lib/permissions.ts` - add keys)
```typescript
export const PERMISSIONS = {
  // ... existing
  CAREERS_VIEW: 'careers.view',
  CAREERS_MANAGE: 'careers.manage',
} as const;
```

### 4. Public Careers Page (`client/app/careers/page.tsx`)
**Structure:**
- Hero section: headline, subtext, CTA
- Role cards grid: each domain with description, requirements, skills needed
- "View Details" → scrolls to form or opens dialog with role-specific info
- Sticky/floating "Apply Now" CTA

**Role Data (static config in component):**
```typescript
const ROLES = [
  {
    id: 'canva-designer',
    title: 'Canva Designer',
    description: 'Create engaging visual content for social media, presentations, and marketing materials.',
    requirements: ['Proficiency in Canva', 'Understanding of design principles', 'Creative portfolio'],
    skills: ['Canva', 'Typography', 'Color Theory', 'Layout Design'],
    type: 'creative'
  },
  // ... 7 more roles
];
```

### 5. Multi-Step Application Form (`client/app/careers/apply/page.tsx` or dialog)
**5 Steps matching Google Form:**

| Step | Fields | Validation |
|------|--------|------------|
| 1. Personal | fullName, email, whatsappNumber, departmentBranch, currentSemester, currentLocation, customLocation | Required, email format, phone format |
| 2. Domain | appliedDomain, hybridComfortable, interestReason | Required, min 50 chars for reason |
| 3. Skills | skills, proficiencyLevel, hasProjects, projectDescription | Required, conditional projectDescription |
| 4. Resume | resumeLink, portfolioLink | Required URL, valid format |
| 5. Final | heardFrom, customHeardFrom, availability, additionalNotes | Required, conditional customHeardFrom |

**UX Patterns:**
- Progress indicator (step 1 of 5)
- Back/Next navigation
- LocalStorage draft persistence (survive refresh)
- Submit → toast success → redirect to `/careers?applied=true`
- Loading states, error handling

### 6. Admin Dashboard (`client/app/admin/careers/applications/page.tsx`)
**Features:**
- Stats cards: Total, Pending, Under Review, Shortlisted, Hired, Rejected
- Filterable table: Search (name/email/domain), Status filter, Domain filter, Date range
- Pagination (20 per page)
- Row actions: View detail (dialog), Update status (dropdown), Delete
- Detail dialog: Full application read-only, status selector, review notes textarea
- Export CSV (bonus)

**Layout:** Follows `admin/events/page.tsx` pattern with `AdminLayout`, sidebar, breadcrumbs.

---

## Design Specifications

### Visual Style (Clean, Professional, Modern)
- **Colors**: Neutral grayscale palette only
  - Background: `white` / `gray-50`
  - Text: `gray-900` (primary), `gray-600` (secondary), `gray-400` (muted)
  - Borders: `gray-200` / `gray-300`
  - Accent: `black` for primary actions, `gray-100` for secondary
  - Status badges: Semantic colors only (green=hired, yellow=pending, blue=review, red=rejected)
- **Typography**: System font stack, clear hierarchy
  - H1: `text-4xl md:text-5xl font-medium tracking-tight`
  - H2: `text-2xl md:text-3xl font-medium`
  - Body: `text-base leading-relaxed`
  - Small: `text-sm text-gray-600`
- **Spacing**: Generous — `space-y-8 md:space-y-12`, `p-6 md:p-8`, `gap-6 md:gap-8`
- **Components**: shadcn/ui defaults (rounded-md, border, subtle shadows)
- **No**: Gradients, glows, animated backgrounds, excessive shadows, bright colors

### Responsive Breakpoints
- Mobile: `< 640px` — single column, stacked cards, full-width buttons
- Tablet: `640px - 1024px` — 2-column role grid, adjusted spacing
- Desktop: `> 1024px` — 3-4 column role grid, side-by-side form sections where appropriate

### Accessibility
- Semantic HTML (`<main>`, `<section>`, `<form>`, `<fieldset>`, `<legend>`)
- Labels for all inputs
- Focus visible outlines
- ARIA labels for icon buttons
- Keyboard navigable stepper

---

## Implementation Order

1. **Server foundation** (model, controller, routes, permissions)
2. **API client + types**
3. **Public careers page** (hero + role cards)
4. **Multi-step application form** (with validation + draft save)
5. **Admin applications list** (table + filters + pagination)
6. **Admin application detail dialog** (view + status update + notes)
7. **Polish**: loading states, empty states, error toasts, responsive tweaks

---

## File Checklist

### Server (New Files)
- [ ] `server/src/models/CareerApplication.js`
- [ ] `server/src/controllers/careerController.js`
- [ ] `server/src/routes/careers.js`

### Server (Modified)
- [ ] `server/src/shared/permissions.js` (add keys)
- [ ] `server/src/server.js` (register routes)

### Client (New Files)
- [ ] `client/app/careers/page.tsx` (public listing)
- [ ] `client/app/careers/apply/page.tsx` (multi-step form)
- [ ] `client/app/admin/careers/applications/page.tsx` (admin dashboard)

### Client (Modified)
- [ ] `client/lib/api.ts` (add careerApi)
- [ ] `client/types/index.ts` (add types)
- [ ] `client/lib/permissions.ts` (add keys)
- [ ] `client/components/app-sidebar.tsx` (add careers nav item)

---

## Acceptance Criteria

- [ ] Public can view all 8 roles with descriptions/requirements
- [ ] Application form works end-to-end (5 steps, validation, submit)
- [ ] Draft persists in localStorage across refresh/close
- [ ] Submitted applications appear in admin dashboard
- [ ] Admin can filter, search, paginate applications
- [ ] Admin can view full application detail
- [ ] Admin can update status (pending→under_review→shortlisted→hired/rejected)
- [ ] Admin can add review notes
- [ ] RBAC enforced on server + client
- [ ] Responsive on mobile/tablet/desktop
- [ ] Clean, professional visual design (no "AI look")
- [ ] Accessible (keyboard, screen reader friendly)