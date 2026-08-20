import { PDFDocument } from '../models/PDFDocument.js';
import { uploadPDF } from '../services/cloudinaryService.js';
import fs from 'fs/promises';
import mongoose from 'mongoose';

export const uploadPDFDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'PDF file is required' });
    }

    const {
      departmentId,
      branchId,
      sessionId,
      semester,
      subjectName,
      subjectCode,
      examType,
      year,
    } = req.body;

    // Validate required fields
    if (!departmentId || !branchId || !sessionId || !semester || !subjectName || !examType || !year) {
      try {
        await fs.unlink(req.file.path);
      } catch {}
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Upload to Cloudinary
    const { cloudinaryUrl, cloudinaryPublicId, fileSize } = await uploadPDF(req.file.path, {
      subjectCode,
      examType,
    });

    const title = `${subjectName} ${examType} ${year}`;

    const pdf = await PDFDocument.create({
      title,
      subjectName,
      subjectCode: subjectCode || undefined,
      departmentId,
      branchId,
      sessionId,
      semester: parseInt(semester.toString()),
      examType,
      year: parseInt(year.toString()),
      cloudinaryUrl,
      cloudinaryPublicId,
      fileName: req.file.originalname,
      fileSize,
      uploadedBy: req.user.id,
      verified: false,
      isActive: true,
    });

    res.status(201).json({ success: true, data: pdf });
  } catch (error) {
    console.error('Upload PDF error:', error);
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch {}
    }
    res.status(500).json({ success: false, message: 'Server error during upload' });
  }
};