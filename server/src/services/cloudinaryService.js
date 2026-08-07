import cloudinary from '../config/cloudinary.js';
import fs from 'fs/promises';

export const uploadPDF = async (filePath, _metadata) => {
  try {
    // Simple upload without folder and public_id to avoid signature issues
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'raw',
    });

    // Delete local file after upload
    await fs.unlink(filePath);

    return {
      cloudinaryUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      fileSize: result.bytes,
    };
  } catch (error) {
    // Cleanup local file on error
    try {
      await fs.unlink(filePath);
    } catch {}
    throw error;
  }
};

export const uploadImage = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'image',
    });

    // Delete local file after upload
    await fs.unlink(filePath);

    return {
      cloudinaryUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      fileSize: result.bytes,
    };
  } catch (error) {
    // Cleanup local file on error
    try {
      await fs.unlink(filePath);
    } catch {}
    throw error;
  }
};

export const deletePDF = async (publicId) => {
  try {
    if (!publicId) {
      console.warn('No public ID provided for deletion');
      return;
    }
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    console.log('Cloudinary deletion result:', result);
  } catch (error) {
    console.error('Error deleting PDF from Cloudinary:', error);
    // Don't throw - log the error but continue with database deletion
    // This allows the database record to be soft-deleted even if Cloudinary deletion fails
  }
};
