## Goal
On the PDF viewer header, add **Download** and **Share** buttons, and upgrade the watermark on all served PDFs to the resume-builder style (diagonal gradient "INVERTISPREP" tiles + "Made with www.invertisprep.in" footer), plus a small bottom-left user trace line.

## Server changes

### 1. `server/src/controllers/pdfController.js`
- Extract a shared `applyWatermark(pdfDoc, user, action)` helper (currently the watermark logic is inline in `viewPDF`):
  - **Brand tiles (resume-builder style):** embed `HelveticaBold`, draw repeated "INVERTISPREP" tiles in a staggered grid across each page, rotated `degrees(-35)`, letter-spacing simulated by advancing each character along the rotated baseline (~1.5pt). Alternate tile colors to mimic the CSS gradient: indigo `#6366f1`, fuchsia `#a855f7`, pink `#ec4899` at opacity ~0.12.
  - **Footer:** "Made with www.invertisprep.in" bottom-right, slate `#94a3b8`, ~9pt, opacity ~0.55 (matches `.resume-watermark`).
  - **User trace (kept):** small bottom-left line `{action} by {user email} • InvertisPrep`, ~7-8pt, slate, opacity ~0.45 (replaces the old gray diagonal text).
- `viewPDF`: use the shared helper, keep `Content-Disposition: inline`.
- New `downloadPDF` handler: same model lookup + Cloudinary fetch + watermark, then send with `Content-Disposition: attachment; filename="<sanitized fileName>"` (sanitize to `[a-zA-Z0-9._-]`, fallback `document.pdf`).

### 2. `server/src/routes/pdf.js`
- Add `router.get('/download/:id', authenticateJWT, downloadPDF);`

## Client changes

### 3. `client/lib/api.ts`
- Add `pdfApi.download(id, type)` → GET `/pdf/download/:id` (`responseType: 'blob'`), parse filename from the `Content-Disposition` header, return `{ blob, filename }`.

### 4. `client/components/PDFViewer.tsx`
- Extend props with optional `id?: string`, `type?: 'pyq' | 'syllabus'`, `title?: string`.
- In the sticky toolbar (after the Reset button): add a divider + **Download** and **Share** ghost buttons (icon + label on sm+, icon-only on mobile, white/10 hover like existing buttons).
  - **Download:** disable + busy state while fetching; if `type === 'pyq'`, fire-and-forget `pyqApi.trackDownload(id)` (matches existing download tracking); call `pdfApi.download` → object URL → programmatic `<a download={filename}>` click → revoke; on error `alert(...)` (matches the pattern already used on the PYQ list page).
  - **Share:** use `navigator.share({ title, url })` when available (secure context), otherwise `navigator.clipboard.writeText(url)` with transient "Copied" feedback (icon swap → revert after 2s, same pattern as `app/events/[id]/page.tsx`). URL = current viewer URL (includes `?type=`).

### 5. `client/app/view/[id]/page.tsx`
- Pass `id` and `type` through: `<PDFViewer file={pdfBlob} id={id} type={type} />`.

## Notes
- No new dependencies: server already uses `pdf-lib`; client uses existing `axios`, `lucide-react` icons (`Download`, `Share`, `Check`).
- Syllabus downloads skip download-count tracking (no endpoint exists for syllabus).
- Works for both `pyq` and `syllabus` types since both flows hit the same PDF routes.