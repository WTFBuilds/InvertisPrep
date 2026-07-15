# Implementation Plan - Admin Security & Protected PDF Viewer

This plan addresses two critical security and feature requests:
1.  **Admin Password Management**: Enhance `seedSuperAdmin.js` to allow updating the admin password without deleting the user.
2.  **Protected PDF Viewer**: Implement an authenticated PDF proxy with watermarking and a custom `pdf.js`-based viewer to prevent direct Cloudinary URL leaks and unauthorized downloads.

## User Review Required

> [!IMPORTANT]
> The protected PDF viewer will prevent direct "Save As" in the browser, but tech-savvy users could still extract PDF bytes from the network tab unless we use more advanced techniques (like page-to-image rendering). We are starting with **Authenticated Proxy + Watermarking + Client-side Viewer** as requested.

> [!WARNING]
> Adding a watermark to every PDF on-the-fly will increase server CPU usage and response time for viewing papers.

## Proposed Changes

### 1. Admin Security Enhancement

#### [MODIFY] [seedSuperAdmin.js](file:///Users/ahqafcoder/Desktop/InvertisPrep/server/src/utils/seedSuperAdmin.js)
- Update the script to check if a super admin already exists.
- If it exists, update the password instead of deleting and recreating.
- Support password input via command-line arguments (e.g., `npm run seed -- --password=newpass`).

### 2. Protected PDF Viewer (Backend)

#### [NEW] [pdfController.js](file:///Users/ahqafcoder/Desktop/InvertisPrep/server/src/controllers/pdfController.js)
- Implement `viewPDF` controller.
- Fetch PDF from Cloudinary using `axios` (authenticated).
- Use `pdf-lib` to add a watermark (User's Name + Email + Timestamp) to each page.
- Stream the watermarked PDF back to the client.

#### [NEW] [pdf.js](file:///Users/ahqafcoder/Desktop/InvertisPrep/server/src/routes/pdf.js)
- Define `GET /view/:id` route (authenticated).
- Define `GET /syllabus/:id` route (authenticated) if needed.

#### [MODIFY] [server.js](file:///Users/ahqafcoder/Desktop/InvertisPrep/server/src/server.js)
- Register the new PDF routes.

### 3. Protected PDF Viewer (Frontend)

#### [NEW] [PDFViewer.tsx](file:///Users/ahqafcoder/Desktop/InvertisPrep/client/components/PDFViewer.tsx)
- Use `react-pdf` to render the PDF.
- Disable right-click and common print shortcuts.
- Add a custom UI for navigation.

#### [NEW] [view/[id]/page.tsx](file:///Users/ahqafcoder/Desktop/InvertisPrep/client/app/view/%5Bid%5D/page.tsx)
- The page that hosts the `PDFViewer`.
- Fetches the PDF blob from the server.

#### [MODIFY] [api.ts](file:///Users/ahqafcoder/Desktop/InvertisPrep/client/lib/api.ts)
- Add `pdfApi` for fetching the PDF blob.

#### [MODIFY] [pyqController.js](file:///Users/ahqafcoder/Desktop/InvertisPrep/server/src/controllers/pyqController.js)
- Redact `cloudinaryUrl` from public API responses (optional but recommended for security).

## Verification Plan

### Automated Tests
- I will verify the password update script by running it and checking the DB.
- I will verify the PDF proxy by calling the endpoint with/without authentication.

### Manual Verification
- Login as a student and view a paper. Check if the watermark (Email/Name) is visible.
- Verify that the direct Cloudinary URL is no longer leaked in the "Network" tab for the paper list API call.
- Check if the "Download" button is replaced by the Viewer or if the viewer prevents easy downloads.
