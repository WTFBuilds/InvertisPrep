import { PDFDocument as PDFLibDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { pdfRedisCache } from '../utils/redisCache.js';
import { cloudinaryAxios } from './cloudinaryService.js';

const hexToRgb = (hex) => {
  const v = hex.replace('#', '');
  return rgb(
    parseInt(v.slice(0, 2), 16) / 255,
    parseInt(v.slice(2, 4), 16) / 255,
    parseInt(v.slice(4, 6), 16) / 255
  );
};

// Big diagonal gradient watermark - GENERIC ONLY
const BIG_WATERMARK_TEXT = 'INVERTISPREP';
const BIG_FONT_SIZE = 68;
const BIG_LETTER_SPACING = BIG_FONT_SIZE * 0.12;
const BIG_ROTATION = -35;
const BIG_OPACITY = 0.12;

// ── Footer ─────────────────────────────────────────────────────────────────
// Branded line only — NO user email/date, so the watermarked PDF stays
// identical for every user and the Redis cache (keyed by paper._id) is valid.
const FOOTER_COLOR = hexToRgb('#94a3b8'); // slate-400
const FOOTER_LINE = 'PYQs available for free on www.invertisprep.in';
const FOOTER_FONT_SIZE = 9;
const FOOTER_Y = 28;
const FOOTER_OPACITY = 0.55;

const GRADIENT_STOPS = [
  [0x63 / 255, 0x66 / 255, 0xf1 / 255], // indigo-500
  [0xa8 / 255, 0x55 / 255, 0xf7 / 255], // purple-500
  [0xec / 255, 0x48 / 255, 0x99 / 255], // pink-500
];

const lerp = (a, b, t) => a + (b - a) * t;

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

const applyGenericWatermark = async (pdfDoc) => {
  const pages = pdfDoc.getPages();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const rotRad = (BIG_ROTATION * Math.PI) / 180;
  const cosA = Math.cos(rotRad);
  const sinA = Math.sin(rotRad);
  const rot = degrees(BIG_ROTATION);

  const charWidths = [...BIG_WATERMARK_TEXT].map((ch) =>
    boldFont.widthOfTextAtSize(ch, BIG_FONT_SIZE)
  );
  const wordWidth =
    charWidths.reduce((s, w) => s + w, 0) +
    BIG_LETTER_SPACING * (BIG_WATERMARK_TEXT.length - 1);

  pages.forEach((page) => {
    const { width, height } = page.getSize();

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

    // ── Footer — centred brand line ────────────────────────────────────────
    const footerWidth = regularFont.widthOfTextAtSize(FOOTER_LINE, FOOTER_FONT_SIZE);
    page.drawText(FOOTER_LINE, {
      x: (width - footerWidth) / 2,
      y: FOOTER_Y,
      size: FOOTER_FONT_SIZE,
      font: regularFont,
      color: FOOTER_COLOR,
      opacity: FOOTER_OPACITY,
    });
  });
};

const buildDownloadFilename = (paper) => {
  const brand = 'www.invertisprep.in';
  const parts = [
    paper.subjectName,
    paper.departmentId?.displayName || paper.departmentId?.name || '',
    paper.branchId?.name || '',
    paper.semester ? `Semester ${paper.semester}` : '',
    paper.sessionId?.name || '',
    paper.examType === 'mid-term' ? 'Mid-Term' : 'End-Term',
  ].filter(Boolean);

  const base = parts.join(' ') || 'Document';
  const safe = base
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);

  return `${safe} [${brand}].pdf`;
};

export const buildWatermarkedPdf = async (paper) => {
  const cacheKey = paper._id.toString();

  // Try Redis cache first
  const cached = await pdfRedisCache.get(cacheKey);
  if (cached) {
    console.log(`[PDF Cache] REDIS HIT for ${cacheKey}`);
    return cached;
  }

  console.log(`[PDF Cache] REDIS MISS for ${cacheKey}`);

  const { data: pdfBytes } = await cloudinaryAxios.get(paper.cloudinaryUrl, {
    responseType: 'arraybuffer',
  });

  const pdfDoc = await PDFLibDocument.load(pdfBytes);
  await applyGenericWatermark(pdfDoc);
  const watermarkedBytes = await pdfDoc.save();

  // Store in Redis cache
  await pdfRedisCache.set(cacheKey, watermarkedBytes);

  return watermarkedBytes;
};

export { buildDownloadFilename };