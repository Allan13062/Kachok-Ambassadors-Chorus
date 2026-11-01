import { db } from '../db';
import { churchUploads } from '../db/schema';
import { v2 as cloudinary } from 'cloudinary';

// Connects your website to your Cloudinary account using environment keys
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file to Cloudinary and saves its link to your PostgreSQL database.
 */
export const uploadAndSaveFile = async (fileBase64: string, fileMetadata: { name: string; type: string }) => {
  try {
    // 1. Upload the file to Cloudinary storage
    const uploadResult = await cloudinary.uploader.upload(fileBase64, {
      folder: 'church_uploads',
      resource_type: 'auto', // Detects if it is an image, video, or audio file automatically
    });

    // 2. Save the filename and Cloudinary internet link into your PostgreSQL database
    const [databaseRecord] = await db.insert(churchUploads).values({
      fileName: fileMetadata.name,
      fileType: fileMetadata.type,
      storageUrl: uploadResult.secure_url, // The web link from Cloudinary
    }).returning();

    return databaseRecord;
  } catch (error) {
    console.error("Upload and database save failed:", error);
    throw error;
  }
};
