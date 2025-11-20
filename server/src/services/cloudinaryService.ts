import { cloudinary } from '../config/cloudinary.js';
import { UploadApiResponse } from 'cloudinary';
import fs from 'fs';
import { cleanupFile } from '../middleware/upload.js';

interface UploadMetadata {
  departmentId: string;
  branchId: string;
  semester: number;
  sessionId: string;
  subjectCode?: string;
  examType: string;
}

interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  fileSize: number;
  format: string;
  pages?: number;
}

/**
 * Generate Cloudinary path based on metadata
 * Structure: invertis/pyq/{dept_id}/{branch_id}/{session_id}/sem{X}
 * Example: invertis/pyq/btech/cse/2023-24-odd/sem1
 */
export const generateCloudinaryPath = (metadata: UploadMetadata) => {
  const { departmentId, branchId, sessionId, semester } = metadata;

  // Folder: invertis/pyq/{department}/{branch}/{session}/sem{X}
  const folder = `invertis/pyq/${departmentId}/${branchId}/${sessionId}/sem${semester}`;

  return { folder };
};

/**
 * Generate public ID for the file
 * Format: {CODE}_{TYPE}_{SUBJECT-SLUG}
 * Example: CS101_mid-term_mathematics-1
 */
export const generatePublicId = (metadata: UploadMetadata, subjectName: string): string => {
  const { subjectCode, examType } = metadata;

  // Create subject slug (URL-safe)
  const subjectSlug = subjectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Format: {CODE}_{TYPE}_{SUBJECT-SLUG}
  const parts = [
    subjectCode || 'PAPER',
    examType,
    subjectSlug,
  ].filter(Boolean);

  return parts.join('_').replace(/\s+/g, '-');
};

/**
 * Upload PDF to Cloudinary
 */
export const uploadPDF = async (
  filePath: string,
  metadata: UploadMetadata,
  subjectName: string
): Promise<CloudinaryUploadResult> => {
  try {
    const { folder } = generateCloudinaryPath(metadata);
    const publicId = generatePublicId(metadata, subjectName);

    // Upload to Cloudinary
    const result: UploadApiResponse = await cloudinary.uploader.upload(filePath, {
      folder,
      public_id: publicId,
      resource_type: 'raw', // For PDF files
      use_filename: false,
      unique_filename: false,
      overwrite: false,
      tags: [
        metadata.departmentId,
        metadata.branchId,
        `sem${metadata.semester}`,
        metadata.sessionId,
        metadata.examType,
      ],
      context: {
        subject: subjectName,
        code: metadata.subjectCode || '',
        semester: metadata.semester.toString(),
      },
    });

    // Clean up local file
    cleanupFile(filePath);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      fileSize: result.bytes,
      format: result.format,
      pages: result.pages,
    };
  } catch (error) {
    // Clean up local file on error
    cleanupFile(filePath);
    throw error;
  }
};

/**
 * Delete PDF from Cloudinary
 */
export const deletePDF = async (publicId: string): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
    });

    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

/**
 * Get file info from Cloudinary
 */
export const getFileInfo = async (publicId: string) => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'raw',
    });

    return {
      url: result.secure_url,
      fileSize: result.bytes,
      format: result.format,
      createdAt: result.created_at,
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    throw error;
  }
};
