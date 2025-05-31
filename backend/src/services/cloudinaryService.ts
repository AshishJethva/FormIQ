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

export interface FileUploadResult {
  originalName: string;
  fileName: string;
  url: string;
  publicId: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

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

export const uploadFormFile = async (
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  fieldId: string,
  formId: string
): Promise<FileUploadResult> => {
  try {
    // Determine resource type based on MIME type
    let resourceType: 'image' | 'video' | 'raw' = 'raw';
    let folder = 'form-submissions/files';

    if (mimeType.startsWith('image/')) {
      resourceType = 'image';
      folder = 'form-submissions/images';
    } else if (mimeType.startsWith('video/')) {
      resourceType = 'video';
      folder = 'form-submissions/videos';
    }

    // Create a unique filename
    const timestamp = Date.now();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${formId}_${fieldId}_${timestamp}_${sanitizedName}`;

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          public_id: uniqueFileName,
          // Transformations for images only
          ...(resourceType === 'image' && {
            transformation: [
              { width: 2000, height: 2000, crop: 'limit', quality: 'auto' },
            ],
          }),
          // File size validation (25MB max)
          max_file_size: 25 * 1024 * 1024,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });

    return {
      originalName,
      fileName: uploadResult.original_filename || uniqueFileName,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      size: uploadResult.bytes,
      mimeType,
      uploadedAt: new Date(),
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error(
      `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Upload multiple files
 * @param files - Array of file data
 * @param fieldId - Form field ID
 * @param formId - Form ID
 * @returns Promise with array of upload results
 */
export const uploadMultipleFiles = async (
  files: Array<{
    buffer: Buffer;
    originalName: string;
    mimeType: string;
  }>,
  fieldId: string,
  formId: string
): Promise<FileUploadResult[]> => {
  const uploadPromises = files.map(file =>
    uploadFormFile(
      file.buffer,
      file.originalName,
      file.mimeType,
      fieldId,
      formId
    )
  );

  return Promise.all(uploadPromises);
};

/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 * @param resourceType - Type of resource (image, video, raw)
 * @returns Promise with the deletion result
 */
export const deleteFormFile = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw'
): Promise<any> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    console.log('File deleted from Cloudinary:', result);
    return result;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

/**
 * Get optimized file URL with transformations
 * @param publicId - The public ID of the file
 * @param options - Transformation options
 * @returns The transformed file URL
 */
export const getOptimizedFileUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {}
): string => {
  const { width, height, crop = 'limit', quality = 'auto', format } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop: crop as any,
    quality,
    format,
    secure: true,
  });
};

/**
 * Validate file before upload
 * @param file - File data
 * @param allowedTypes - Allowed MIME types
 * @param maxSize - Maximum file size in bytes
 * @returns Validation result
 */
export const validateFile = (
  file: { size: number; mimeType: string; originalName: string },
  allowedTypes: string[] = [],
  maxSize: number = 25 * 1024 * 1024 // 25MB default
): { isValid: boolean; error?: string } => {
  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`,
    };
  }

  // Check MIME type if allowedTypes is specified
  if (allowedTypes.length > 0) {
    const isTypeAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        // Handle wildcard types like 'image/*'
        const baseType = type.slice(0, -2);
        return file.mimeType.startsWith(baseType);
      }
      return file.mimeType === type;
    });

    if (!isTypeAllowed) {
      return {
        isValid: false,
        error: `File type ${file.mimeType} is not allowed`,
      };
    }
  }

  // Check for potentially dangerous file types
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
  const hasUnsafeExtension = dangerousExtensions.some(ext =>
    file.originalName.toLowerCase().endsWith(ext)
  );

  if (hasUnsafeExtension) {
    return {
      isValid: false,
      error: 'File type not allowed for security reasons',
    };
  }

  return { isValid: true };
};

export default {
  uploadFormFile,
  uploadMultipleFiles,
  deleteFormFile,
  getOptimizedFileUrl,
  validateFile,
  uploadBuffer,
  deleteImage,
  getImageUrl,
};
