// server/services/cloudinaryService.ts
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer to Cloudinary
 * @param buffer - The file buffer to upload
 * @param folder - The folder to upload to
 * @returns Promise with the upload result
 */
export const uploadBuffer = (
  buffer: Buffer,
  folder = 'form-logos'
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        transformation: [{ width: 1000, crop: 'limit' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Promise with the deletion result
 */
export const deleteImage = (publicId: string): Promise<any> => {
  return cloudinary.uploader.destroy(publicId);
};

/**
 * Get Cloudinary image URL with transformation
 * @param publicId - The public ID of the image
 * @param options - Transformation options
 * @returns The transformed image URL
 */
export const getImageUrl = (
  publicId: string,
  options: { width?: number; height?: number; crop?: string } = {}
): string => {
  const { width, height, crop = 'fill' } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop: crop as any,
    secure: true,
  });
};

export default {
  uploadBuffer,
  deleteImage,
  getImageUrl,
};
