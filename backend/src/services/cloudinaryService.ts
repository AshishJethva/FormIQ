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

export interface CloudinaryDeleteResult {
  success: boolean;
  publicId: string;
  result?: string;
  error?: string;
}

export interface BulkDeleteResult {
  successful: string[];
  failed: Array<{ publicId: string; error: string }>;
  total: number;
  successCount: number;
  failureCount: number;
}

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
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      throw new Error(`Failed to delete image: ${result.result}`);
    }

    console.log(`Successfully deleted image with publicId: ${publicId}`);
  } catch (error: any) {
    console.error('Error deleting image from Cloudinary:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
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
            reject(error);
          } else {
            console.log(' Cloudinary upload successful:', {
              public_id: result?.public_id,
              secure_url: result?.secure_url,
              bytes: result?.bytes,
            });
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

/**
 * Upload logo specifically with proper validation
 * @param buffer - File buffer
 * @param originalName - Original filename
 * @param mimeType - File MIME type
 * @returns Promise with upload result
 */
export const uploadLogo = async (
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<FileUploadResult> => {
  try {
    // Validate it's an image
    if (!mimeType.startsWith('image/')) {
      throw new Error('Logo must be an image file');
    }

    // Create a unique filename for the logo
    const timestamp = Date.now();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `logo_${timestamp}_${sanitizedName}`;

    console.log('📤 Uploading logo to Cloudinary:', {
      fileName: uniqueFileName,
      mimeType,
      size: buffer.length,
    });

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'form-logos',
          resource_type: 'image',
          public_id: uniqueFileName,
          transformation: [
            { width: 1000, height: 1000, crop: 'limit', quality: 'auto' },
          ],
          max_file_size: 5 * 1024 * 1024, // 5MB max for logos
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary logo upload error:', error);
            reject(error);
          } else {
            console.log(' Logo upload successful:', {
              public_id: result?.public_id,
              secure_url: result?.secure_url,
              bytes: result?.bytes,
            });
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
    console.error('Logo upload error:', error);
    throw new Error(
      `Failed to upload logo: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Delete a single file from Cloudinary
 */
export const deleteFormFile = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw'
): Promise<CloudinaryDeleteResult> => {
  try {
    console.log(`🗑️ Deleting ${resourceType} from Cloudinary:`, publicId);

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true, // Invalidate CDN cache
    });

    console.log('Cloudinary delete result:', result);

    const success = result.result === 'ok' || result.result === 'not found';

    return {
      success,
      publicId,
      result: result.result,
      error: success ? undefined : `Unexpected result: ${result.result}`,
    };
  } catch (error: any) {
    console.error(`❌ Failed to delete ${resourceType} ${publicId}:`, error);
    return {
      success: false,
      publicId,
      error: error.message || 'Unknown error occurred',
    };
  }
};

/**
 * Delete multiple files from Cloudinary in batches
 */
export const bulkDeleteFiles = async (
  publicIds: string[],
  resourceType: 'image' | 'raw' = 'raw',
  batchSize: number = 100
): Promise<BulkDeleteResult> => {
  const result: BulkDeleteResult = {
    successful: [],
    failed: [],
    total: publicIds.length,
    successCount: 0,
    failureCount: 0,
  };

  if (publicIds.length === 0) {
    return result;
  }

  console.log(
    `🗑️ Bulk deleting ${publicIds.length} ${resourceType} files from Cloudinary`
  );

  // Process in batches to avoid API limits
  for (let i = 0; i < publicIds.length; i += batchSize) {
    const batch = publicIds.slice(i, i + batchSize);

    try {
      // Use admin API for bulk deletion
      const batchResult = await cloudinary.api.delete_resources(batch, {
        resource_type: resourceType,
        invalidate: true,
      });

      // Process batch results
      Object.entries(batchResult.deleted || {}).forEach(
        ([publicId, status]) => {
          if (status === 'deleted' || status === 'not_found') {
            result.successful.push(publicId);
            result.successCount++;
          } else {
            result.failed.push({
              publicId,
              error: `Unexpected status: ${status}`,
            });
            result.failureCount++;
          }
        }
      );

      // Handle partial failures
      Object.entries(batchResult.partial || {}).forEach(([publicId, error]) => {
        result.failed.push({
          publicId,
          error: typeof error === 'string' ? error : 'Partial failure',
        });
        result.failureCount++;
      });
    } catch (error: any) {
      console.error(
        `❌ Batch deletion failed for batch starting at ${i}:`,
        error
      );

      // Mark all files in this batch as failed
      batch.forEach(publicId => {
        result.failed.push({
          publicId,
          error: error.message || 'Batch deletion failed',
        });
        result.failureCount++;
      });
    }

    // Add delay between batches to respect rate limits
    if (i + batchSize < publicIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(
    ` Bulk deletion completed: ${result.successCount} successful, ${result.failureCount} failed`
  );
  return result;
};

/**
 * Delete all files associated with a form submission
 */
export const deleteSubmissionFiles = async (
  files: any[]
): Promise<BulkDeleteResult> => {
  if (!files || files.length === 0) {
    return {
      successful: [],
      failed: [],
      total: 0,
      successCount: 0,
      failureCount: 0,
    };
  }

  console.log(`🗑️ Deleting ${files.length} files for submission`);

  // Group files by resource type
  const imageFiles: string[] = [];
  const rawFiles: string[] = [];

  files.forEach(file => {
    if (file.publicId) {
      if (file.mimeType?.startsWith('image/')) {
        imageFiles.push(file.publicId);
      } else {
        rawFiles.push(file.publicId);
      }
    }
  });

  // Delete both types in parallel
  const [imageResults, rawResults] = await Promise.all([
    imageFiles.length > 0
      ? bulkDeleteFiles(imageFiles, 'image')
      : Promise.resolve({
          successful: [],
          failed: [],
          total: 0,
          successCount: 0,
          failureCount: 0,
        }),
    rawFiles.length > 0
      ? bulkDeleteFiles(rawFiles, 'raw')
      : Promise.resolve({
          successful: [],
          failed: [],
          total: 0,
          successCount: 0,
          failureCount: 0,
        }),
  ]);

  // Combine results
  return {
    successful: [...imageResults.successful, ...rawResults.successful],
    failed: [...imageResults.failed, ...rawResults.failed],
    total: imageResults.total + rawResults.total,
    successCount: imageResults.successCount + rawResults.successCount,
    failureCount: imageResults.failureCount + rawResults.failureCount,
  };
};

/**
 * Delete all files associated with a form (including submissions and form logo)
 */
export const deleteFormFiles = async (
  formData: any,
  submissions: any[]
): Promise<{
  submissionFiles: BulkDeleteResult;
  logoResult?: CloudinaryDeleteResult;
  totalFilesProcessed: number;
}> => {
  console.log(
    `🗑️ Starting comprehensive file deletion for form: ${formData.title}`
  );

  // Collect all file public IDs from submissions
  const allFiles: any[] = [];

  submissions.forEach(submission => {
    // Files from submission.files array
    if (submission.files && Array.isArray(submission.files)) {
      allFiles.push(...submission.files);
    }

    // Files from submission.data (legacy format)
    if (submission.data && typeof submission.data === 'object') {
      Object.values(submission.data).forEach(value => {
        if (value && typeof value === 'object') {
          // Single file object
          if (
            value &&
            typeof value === 'object' &&
            'publicId' in value &&
            'url' in value
          ) {
            allFiles.push(value);
          }
          // Array of file objects
          if (Array.isArray(value)) {
            value.forEach(item => {
              if (
                item &&
                typeof item === 'object' &&
                'publicId' in item &&
                'url' in item
              ) {
                allFiles.push(item);
              }
            });
          }
        }
      });
    }
  });

  console.log(
    `📊 Found ${allFiles.length} files across ${submissions.length} submissions`
  );

  // Delete submission files
  const submissionFilesResult = await deleteSubmissionFiles(allFiles);

  // Delete form logo if exists
  let logoResult: CloudinaryDeleteResult | undefined;
  if (formData.logo && formData.logo.publicId) {
    console.log(`🖼️ Deleting form logo: ${formData.logo.publicId}`);
    logoResult = await deleteFormFile(
      formData.logo.publicId,
      formData.logo.type === 'uploaded' ? 'image' : 'raw'
    );
  }

  const totalFilesProcessed = allFiles.length + (logoResult ? 1 : 0);

  console.log(` Form file deletion completed:`, {
    submissionFiles: submissionFilesResult.successCount,
    submissionFilesFailed: submissionFilesResult.failureCount,
    logoDeleted: logoResult?.success || false,
    totalProcessed: totalFilesProcessed,
  });

  return {
    submissionFiles: submissionFilesResult,
    logoResult,
    totalFilesProcessed,
  };
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
  uploadLogo,
};
