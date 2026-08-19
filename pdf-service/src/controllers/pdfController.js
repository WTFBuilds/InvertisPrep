import mongoose from 'mongoose';
import { PDFDocument } from '../models/PDFDocument.js';
import { buildWatermarkedPdf, buildDownloadFilename } from '../services/pdfProcessor.js';
import { buildContentDisposition } from '../utils/filename.js';

// Invalid id formats (e.g. old UUID links) can't match any document —
// return 404 instead of letting mongoose's CastError bubble up as a 500.
const findPaperOr404 = async (id, res) => {
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ success: false, message: 'File not found' });
    return null;
  }
  const paper = await PDFDocument.findById(id);
  if (!paper) {
    res.status(404).json({ success: false, message: 'File not found' });
    return null;
  }
  return paper;
};

export const viewPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    const paper = await findPaperOr404(id, res);
    if (!paper) return;

    const pdfBytes = await buildWatermarkedPdf(paper);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="paper.pdf"');
    res.setHeader('Cache-Control', 'private, max-age=300'); // Allow browser caching
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('PDF view error:', err);
    res.status(500).json({ success: false, message: 'Error processing PDF' });
  }
};

export const downloadPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    const paper = await findPaperOr404(id, res);
    if (!paper) return;

    const pdfBytes = await buildWatermarkedPdf(paper);

    const fileName = buildDownloadFilename(paper);
    const contentDisposition = buildContentDisposition(fileName, 'attachment');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('PDF download error:', err);
    res.status(500).json({ success: false, message: 'Error processing PDF' });
  }
};