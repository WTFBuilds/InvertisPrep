import mongoose from 'mongoose';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { PYQPaper } from '../models/PYQPaper.js';
import { Syllabus } from '../models/Syllabus.js';
import { pdfCache, getCache, setCache } from '../utils/cache.js';
import { cloudinaryAxios } from '../services/cloudinaryService.js';
import { logActivity, hasRecentEvent } from '../services/activityService.js';

const hexToRgb = (hex) => {
  const v = hex.replace('#', '');
  return rgb(
    parseInt(v.slice(0, 2), 16) / 255,
    parseInt(v.slice(2, 4), 16) / 255,
    parseInt(v.slice(4, 6), 16) / 255
  );
};

// ── One big diagonal gradient watermark ─────────────────────────────────────
// A single large "INVERTISPREP" stamp per page, centred and rotated -35°.
// pdf-lib has no gradient fills, so we simulate the horizontal gradient
// (indigo-500 → purple-500 → pink-500) by interpolating the colour per char.
const BIG_WATERMARK_TEXT = 'INVERTISPREP';
const BIG_FONT_SIZE = 68;
const BIG_LETTER_SPACING = BIG_FONT_SIZE * 0.12; // 0.12em ≈ 8.2 pt
const BIG_ROTATION = -35;
const BIG_OPACITY = 0.12;

// Gradient stops: indigo-500 (#6366f1) → purple-500 (#a855f7) → pink-500 (#ec4899)
const GRADIENT_STOPS = [
  [0x63 / 255, 0x66 / 255, 0xf1 / 255],
  [0xa8 / 255, 0x55 / 255, 0xf7 / 255],
  [0xec / 255, 0x48 / 255, 0x99 / 255],
];

const lerp = (a, b, t) => a + (b - a) * t;

// Horizontal gradient → colour for the character at position i of total
const gradientColorForChar = (i, total) => {
  const t = total === 1 ? 0 : i / (total - 1);
  const seg = t < 0.5 ? 0 : 1;
  const local = seg === 0 ? t / 0.5 : (t - 0.5) / 0.5;
  const from = GRADIENT_STOPS[seg];
  const to = GRADIENT_STOPS[seg + 1];
  return rgb(
    lerp(from[0], to[0], local),
    lerp(from[1], to[1], local),
    lerp(from[2], to[2], local)
  );
};

// ── Footer colours ──────────────────────────────────────────────────────────
const FOOTER_COLOR = hexToRgb('#94a3b8');    // slate-400
const FOOTER2_COLOR = hexToRgb('#a5b4fc');   // indigo-300

const FOOTER_LINE1 = 'PYQs available for free on www.invertisprep.in';

const getUserEmail = (user) => user?.email || 'InvertisPrep User';

const formatDateTime = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}  ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Watermark  (single-colour diagonal tile grid — clean & sparse)
//
// Layout:
//   ┌──────────────────────────────────────────┐
//   │     ╲  INVERTISPREP    ╲  INVERTISPREP   │
//   │       ╲  INVERTISPREP    ╲  INVERTISPREP │   sparse grid, -35°
//   │  ╲  INVERTISPREP    ╲  INVERTISPREP      │
//   │    ╲  INVERTISPREP    ╲  INVERTISPREP    │
//   │                                          │
//   │    PYQs available for free on ...        │
//   │    email  •  2026-08-09  15:00:00        │
//   └──────────────────────────────────────────┘
// ─────────────────────────────────────────────────────────────────────────────
const applyWatermark = async (pdfDoc, user) => {
  const pages = pdfDoc.getPages();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const userEmail = getUserEmail(user);
  const dateTime = formatDateTime();
  const footerLine2 = `${userEmail}  •  ${dateTime}`;

  // ── Rotation helpers ──────────────────────────────────────────────────────
  const rotRad = (BIG_ROTATION * Math.PI) / 180;
  const cosA = Math.cos(rotRad);
  const sinA = Math.sin(rotRad);
  const rot = degrees(BIG_ROTATION);

  // Pre-compute per-character unrotated widths for the big word
  const charWidths = [...BIG_WATERMARK_TEXT].map((ch) =>
    boldFont.widthOfTextAtSize(ch, BIG_FONT_SIZE)
  );
  const wordWidth =
    charWidths.reduce((s, w) => s + w, 0) +
    BIG_LETTER_SPACING * (BIG_WATERMARK_TEXT.length - 1);

  pages.forEach((page) => {
    const { width, height } = page.getSize();

    // ── One big centred gradient word, rotated -35° ─────────────────────────
    // Walk along the rotated baseline so the word's midpoint sits at the page
    // centre (lifted a touch so the text's visual centre lands on it).
    const midX = width / 2;
    const midY = height / 2 - BIG_FONT_SIZE * 0.37;
    let x = midX - (wordWidth / 2) * cosA;
    let y = midY - (wordWidth / 2) * sinA;

    for (let ci = 0; ci < BIG_WATERMARK_TEXT.length; ci++) {
      page.drawText(BIG_WATERMARK_TEXT[ci], {
        x,
        y,
        size: BIG_FONT_SIZE,
        font: boldFont,
        color: gradientColorForChar(ci, BIG_WATERMARK_TEXT.length),
        opacity: BIG_OPACITY,
        rotate: rot,
      });
      const adv = charWidths[ci] + BIG_LETTER_SPACING;
      x += adv * cosA;
      y += adv * sinA;
    }

    // ── Footer line 1 — centred ─────────────────────────────────────────────
    const fs1 = 9;
    const fw1 = regularFont.widthOfTextAtSize(FOOTER_LINE1, fs1);
    page.drawText(FOOTER_LINE1, {
      x: (width - fw1) / 2,
      y: 28,
      size: fs1,
      font: regularFont,
      color: FOOTER_COLOR,
      opacity: 0.55,
    });

    // ── Footer line 2 — email + datetime, centred ───────────────────────────
    const fs2 = 7;
    const fw2 = regularFont.widthOfTextAtSize(footerLine2, fs2);
    page.drawText(footerLine2, {
      x: (width - fw2) / 2,
      y: 15,
      size: fs2,
      font: regularFont,
      color: FOOTER2_COLOR,
      opacity: 0.48,
    });
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const loadPaper = async (id, type) => {
  // Invalid id formats (e.g. old UUID links) can't match any document —
  // return null (→ 404) instead of letting mongoose's CastError bubble up as a 500.
  if (!mongoose.isValidObjectId(id)) return { paper: null };
  if (type === 'syllabus') return { paper: await Syllabus.findById(id) };
  return {
    paper: await PYQPaper.findById(id)
      .populate('departmentId', 'name displayName')
      .populate('branchId', 'name')
      .populate('sessionId', 'name'),
  };
};

const EXAM_TYPE_LABEL = {
  'mid-term': 'Mid-Term',
  'end-term': 'End-Term',
};

// Meaningful download filename, e.g.
// "Database Management Systems CSE Computer Science Semester 3 2024-25 Mid-Term [www.invertisprep.in].pdf"
const buildDownloadFilename = (paper, isSyllabus) => {
  const brand = 'www.invertisprep.in';

  if (isSyllabus) {
    const syllabusName = (paper.name || 'Document').trim();
    return `${syllabusName} [${brand}].pdf`;
  }

  const dept =
    typeof paper.departmentId === 'object' && paper.departmentId
      ? paper.departmentId.displayName || paper.departmentId.name || ''
      : '';
  const branch =
    typeof paper.branchId === 'object' && paper.branchId ? paper.branchId.name || '' : '';
  const session =
    typeof paper.sessionId === 'object' && paper.sessionId ? paper.sessionId.name || '' : '';

  const parts = [
    paper.subjectName,
    dept,
    branch,
    paper.semester ? `Semester ${paper.semester}` : '',
    session,
    EXAM_TYPE_LABEL[paper.examType] || '',
  ].filter(Boolean);

  const base = parts.join(' ') || 'Document';
  // Remove characters that are invalid in filenames, keep spaces
  const safe = base
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);

  return `${safe} [${brand}].pdf`;
};

const buildWatermarkedPdf = async (paper, user) => {
  // Create a cache key based on paper ID, user ID, and type (view/download)
  // Since watermarks include user-specific info (email, timestamp), we need a unique key per user+paper
  const cacheKey = `watermarked:${paper._id}:${user.id}:${Date.now() / (60 * 1000) | 0}`; // Cache for 1 minute per user
  
  // Try to get from cache first
  const cached = getCache(cacheKey);
  if (cached) {
    console.log(`[PDF Cache] HIT for ${cacheKey}`);
    return cached;
  }
  
  console.log(`[PDF Cache] MISS for ${cacheKey}`);
  const { data: pdfBytes } = await cloudinaryAxios.get(paper.cloudinaryUrl, {
    responseType: 'arraybuffer',
  });
  const pdfDoc = await PDFDocument.load(pdfBytes);
  await applyWatermark(pdfDoc, user);
  const watermarkedBytes = await pdfDoc.save();
  
  // Cache the watermarked PDF for 1 minute (TTL = 60000ms)
  setCache(cacheKey, watermarkedBytes, 60000);
  
  return watermarkedBytes;
};

// ─────────────────────────────────────────────────────────────────────────────
// Route handlers
// ─────────────────────────────────────────────────────────────────────────────

/** GET /pdf/view/:id?type=pyq|syllabus  →  inline PDF */
export const viewPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const { paper } = await loadPaper(id, type);
    if (!paper) return res.status(404).json({ success: false, message: 'File not found' });

    // Syllabus views are tracked here; PYQ paper views are tracked by the
    // pdf-service (its trackView endpoint is the single point PYQ opens hit).
    // Deduped so PDF range re-requests don't inflate the trail.
    if (type === 'syllabus') {
      const seen = await hasRecentEvent({ userId: req.user._id, type: 'paper_view', entityId: id, withinMs: 30 * 60 * 1000 });
      if (!seen) {
        logActivity(
          {
            user: req.user._id,
            type: 'paper_view',
            entityType: 'syllabus',
            entityId: id,
            title: paper.name || 'Syllabus',
            departmentName: paper.department || '',
            path: `/view/${id}?type=syllabus`,
          },
          req
        );
      }
    }

    const pdfBytes = await buildWatermarkedPdf(paper, req.user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="paper.pdf"');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('PDF view error:', err);
    res.status(500).json({ success: false, message: 'Error processing PDF' });
  }
};

/** GET /pdf/download/:id?type=pyq|syllabus  →  attachment PDF */
export const downloadPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const { paper } = await loadPaper(id, type);
    if (!paper) return res.status(404).json({ success: false, message: 'File not found' });

    // Mirrors viewPDF: syllabus downloads tracked here, PYQ by the pdf-service.
    if (type === 'syllabus') {
      const seen = await hasRecentEvent({ userId: req.user._id, type: 'paper_download', entityId: id, withinMs: 10 * 60 * 1000 });
      if (!seen) {
        logActivity(
          {
            user: req.user._id,
            type: 'paper_download',
            entityType: 'syllabus',
            entityId: id,
            title: paper.name || 'Syllabus',
            departmentName: paper.department || '',
            path: `/view/${id}?type=syllabus`,
          },
          req
        );
      }
    }

    const pdfBytes = await buildWatermarkedPdf(paper, req.user);

    const isSyllabus = type === 'syllabus';
    const filename = buildDownloadFilename(paper, isSyllabus);

    // Node throws for non-Latin1 chars in header values, and the browser must be
    // able to parse the name — send an ASCII fallback + RFC 5987 filename* for UTF-8.
    const asciiFallback = filename
      .replace(/[^\x20-\x7E]/g, '_')
      .replace(/"/g, "'")
      .slice(0, 120);
    const encodedFilename = encodeURIComponent(filename);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedFilename}`
    );
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('PDF download error:', err);
    res.status(500).json({ success: false, message: 'Error processing PDF' });
  }
};
