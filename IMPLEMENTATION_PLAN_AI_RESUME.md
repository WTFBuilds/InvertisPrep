# AI Resume Builder — Implementation Plan

## Overview

Two parallel features to build on top of the existing ATS Resume Builder:

1. **AI Section Enhancer** — per-section "Enhance with AI" buttons that rewrite content using a LLM
2. **Templates** — a "Templates" button in the toolbar that opens a popup showing 3 selectable resume starter templates

---

## Part 1 — AI Ideas for Each Section

Before diving into tasks, here are the AI enhancement ideas per section:

| Section | AI Action | What it does |
|---|---|---|
| **Summary** | ✨ Enhance | Rewrites the summary to be punchy, ATS-keyword-rich, and tailored to the headline/role |
| **Work Experience → description** | ✨ Enhance | Rewrites the company description to a concise, impactful 1-liner |
| **Work Experience → achievements** | ✨ Enhance bullets | Rewrites each bullet using the STAR/XYZ metric format ("Increased X by Y% by doing Z") |
| **Work Experience** | ✨ Generate bullets | Given just company + role, generates 3–5 achievement bullets from scratch |
| **Projects → description** | ✨ Enhance | Rewrites the project description to highlight tech stack and impact |
| **Projects → achievements** | ✨ Enhance bullets | Improves bullet points with action verbs and measurable outcomes |
| **Skills** | ✨ Suggest skills | Given the role/headline, suggests relevant technical/soft skills to add |
| **Achievements** | ✨ Improve | Rewrites each achievement line to be more compelling and specific |
| **Certifications** | ✨ Format | Normalises certification names to official format |
| **Headline** | ✨ Suggest titles | Given current role and skills, suggests 3 alternative professional title variants |

---

## Part 2 — Templates Feature

Three resume starter templates to show in the popup:

### Template 1 — "Software Engineer"
Full-stack developer profile. Includes technical skills section, GitHub/LinkedIn links, 2 work experiences, 2 projects.

### Template 2 — "Business / MBA"
Management/consulting profile. Emphasises leadership bullets, MBA education, internships, soft skills.

### Template 3 — "Fresher / Student"
College student with no work experience. Academic achievements, college projects, skills only — safe for first-time users.

---

## Implementation Tasks

### Task 1 — AI Backend Route (Next.js API Route)

**File:** `client/app/api/resume/enhance/route.ts`

- Create a POST route that accepts `{ section, content, context }` where:
  - `section` = `"summary" | "experience_description" | "experience_achievements" | "project_description" | "project_achievements" | "skills" | "achievement" | "headline"`
  - `content` = the current text/array to enhance
  - `context` = `{ role, name, skills[] }` for personalisation
- Uses **Google Gemini 2.0 Flash** (`@google/generative-ai`) — already on the platform (no extra cost, generous free tier)
- Returns `{ enhanced: string | string[] }`
- Rate-limited to 10 requests per minute per session (simple in-memory counter) to prevent abuse
- Falls back gracefully with the original content if the API call fails

**Env var to add:**
```
GEMINI_API_KEY=your-gemini-api-key
```

**Why Gemini?** It has a free tier, fast response for short text rewrites, and the `@google/generative-ai` package is already common in Next.js projects. Swap to OpenAI later by just changing the route.

---

### Task 2 — AI Client Hook

**File:** `client/hooks/useAIEnhance.ts`

- `useAIEnhance()` hook returns `{ enhance, loading, error }`
- `enhance(section, content, context)` calls `/api/resume/enhance`
- Manages loading state per-call (not global) so multiple sections can independently show spinners
- Returns the enhanced value; the component decides whether to apply it

---

### Task 3 — Enhance Button Component

**File:** `client/components/resume-builder/AIEnhanceButton.tsx`

```tsx
<AIEnhanceButton
  section="summary"
  content={resume.summary}
  context={{ role: resume.personal.headline, name: resume.personal.name, skills: flatSkills }}
  onEnhanced={(value) => update('summary', value)}
/>
```

- Renders a small `✨ Enhance` button (ghost variant, indigo accent)
- Shows a `Loader2` spinner while loading
- On success: shows a diff-preview inline → user clicks "Apply" or "Discard"
- On error: `toast.error('AI enhancement failed. Try again.')`
- The diff-preview shows old vs new side-by-side in a small popover so the user can decide

---

### Task 4 — Wire Enhance Buttons into ResumeBuilder

Add `AIEnhanceButton` next to these fields in `ResumeBuilder.tsx`:

1. Summary textarea — button beside the section heading
2. Each Work Experience: beside "Description" textarea + beside "Achievements" list header
3. Each Project: beside "Description" textarea + beside "Achievements" list header  
4. Each Skill Group: "✨ Suggest skills" button beside the group title
5. Personal → Headline: "✨ Suggest titles" as a dropdown of 3 suggestions

No changes to the `Resume` type or API — AI only operates on the draft in client state. The user still manually hits Save to persist.

---

### Task 5 — Templates Data File

**File:** `client/components/resume-builder/templates.ts`

Define and export 3 `ResumeDraft` objects:

```ts
export const RESUME_TEMPLATES: {
  id: string;
  name: string;
  tag: string;           // "Software Engineer" | "Business / MBA" | "Fresher"
  color: string;         // accent colour for card
  preview: string;       // short description shown on card
  draft: ResumeDraft;
}[] = [ ... ]
```

Each template is a fully-filled `ResumeDraft` with realistic dummy data matching the role.

---

### Task 6 — TemplatesModal Component

**File:** `client/components/resume-builder/TemplatesModal.tsx`

- `Dialog` (uses existing Radix/shadcn Dialog already in the project)
- Title: "Choose a Template"
- Body: 3 cards in a responsive grid (1-col on mobile, 3-col on md+)
- Each card shows:
  - Role icon (Lucide: `Code2` / `Briefcase` / `GraduationCap`)
  - Template name + tag badge
  - 3-line summary preview of the content
  - "Use this template" button
- On "Use this template":
  - If resume has existing user data → show confirmation: "This will replace your current resume. Continue?"
  - On confirm → call `setResume(safeResume({ ...blankResume, ...template.draft }))` + `setIsDirty(true)`
  - Close modal
- A "View full preview" expandable panel per card shows a read-only mini `ResumePreview` (scaled 0.45x via CSS transform) so users can see exactly what it looks like

---

### Task 7 — Templates Button in Toolbar

In `ResumeBuilder.tsx`, add the Templates button to the toolbar (between "My resumes" and "Import"):

```tsx
<button className="resume-tool" onClick={() => setShowTemplatesModal(true)}>
  <LayoutTemplate size={16}/> Templates
</button>
```

State: `const [showTemplatesModal, setShowTemplatesModal] = useState(false);`

Render `<TemplatesModal open={showTemplatesModal} onClose={...} onApply={...} resume={resume} setResume={setResume} setIsDirty={setIsDirty} />`

---

### Task 8 — Install Gemini SDK

```bash
cd client && npm install @google/generative-ai
```

Add to `.env` and `.env.example`:
```
GEMINI_API_KEY=your-gemini-api-key
```

---

## File Summary

| File | Status | Purpose |
|---|---|---|
| `client/app/api/resume/enhance/route.ts` | **NEW** | Server-side Gemini call |
| `client/hooks/useAIEnhance.ts` | **NEW** | Client hook for AI calls |
| `client/components/resume-builder/AIEnhanceButton.tsx` | **NEW** | Reusable enhance button + diff preview |
| `client/components/resume-builder/templates.ts` | **NEW** | 3 template data objects |
| `client/components/resume-builder/TemplatesModal.tsx` | **NEW** | Templates popup |
| `client/components/resume-builder/ResumeBuilder.tsx` | **MODIFY** | Wire up AI buttons + Templates button |
| `client/.env` / `.env.example` | **MODIFY** | Add `GEMINI_API_KEY` |

---

## Execution Order

```
Task 8 (install SDK)
  → Task 1 (API route)
  → Task 2 (hook)
  → Task 3 (button component)
  → Task 4 (wire into ResumeBuilder)
  → Task 5 (template data)
  → Task 6 (templates modal)
  → Task 7 (toolbar button)
```

Tasks 1–4 (AI) and Tasks 5–7 (Templates) are independent streams and can be built in parallel.

---

## UI/UX Notes

- AI buttons use a **ghost/subtle style** — they should feel like a "helper" not a primary action, so they don't distract from the actual editing
- The diff-preview popover is the key UX safeguard — users see what changed before committing
- Templates should **not** silently overwrite — always confirm if the resume has content beyond the defaults
- Keep AI calls lightweight: send only the specific field + minimal context (role + headline), not the entire resume JSON, to stay within token limits and keep latency low (~1–2s per call)
