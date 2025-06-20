// src/services/fileUploadService.ts - Frontend
import axios from 'axios';
import { apiConfig } from '@/config/api';

export interface FileUploadResult {
  originalName: string;
  fileName: string;
  url: string;
  publicId: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface FileDeleteResult {
  success: boolean;
  publicId: string;
  error?: string;
}

export interface BulkDeleteProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentFile?: string;
}

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: apiConfig.url,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth tokens (for deletion operations)
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

/**
 * Upload a single file for form submission
 * @param file - File to upload
 * @param fieldId - Form field ID
 * @param formId - Form ID
 * @returns Promise with upload result
 */
export const uploadFormFile = async (
  file: File,
  fieldId: string,
  formId: string
): Promise<FileUploadResult> => {
  try {
    // Validate file size (25MB max)
    if (file.size > 25 * 1024 * 1024) {
      throw new Error('File size must be less than 25MB.');
    }

    const formData = new FormData();
    formData.append('file', file);

    // Use different endpoint for preview mode
    const endpoint =
      formId === 'preview'
        ? `${apiConfig.url}/upload/preview/field/${fieldId}`
        : `${apiConfig.url}/upload/form/${formId}/field/${fieldId}`;

    const response = await axios.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 second timeout for large files
    });

    return response.data.data;
  } catch (error: any) {
    console.error('❌ File upload failed:', error);

    if (error.response?.status === 413) {
      throw new Error('File is too large. Maximum size is 25MB.');
    } else if (error.response?.status === 400) {
      throw new Error(
        error.response.data?.message || 'Invalid file type or format.'
      );
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Upload timeout. Please try with a smaller file.');
    }

    throw new Error(
      error.response?.data?.message ||
        'Failed to upload file. Please try again.'
    );
  }
};

/**
 * Upload an image file with specific validation
 * @param file - Image file to upload
 * @param fieldId - Form field ID
 * @param formId - Form ID
 * @returns Promise with upload result
 */
export const uploadFormImage = async (
  file: File,
  fieldId: string,
  formId: string
): Promise<FileUploadResult> => {
  try {
    // Validate image type on frontend
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file.');
    }

    // Validate image size (10MB max for images)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Image size must be less than 10MB.');
    }

    const formData = new FormData();
    formData.append('image', file);

    // Use different endpoint for preview mode
    const endpoint =
      formId === 'preview'
        ? `${apiConfig.url}/upload/preview/field/${fieldId}/image`
        : `${apiConfig.url}/upload/form/${formId}/field/${fieldId}/image`;

    const response = await axios.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });

    return response.data.data;
  } catch (error: any) {
    console.error('❌ Image upload failed:', error);

    if (error.response?.status === 413) {
      throw new Error('Image is too large. Maximum size is 10MB.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Invalid image format.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Upload timeout. Please try with a smaller image.');
    }

    throw new Error(
      error.response?.data?.message ||
        'Failed to upload image. Please try again.'
    );
  }
};

/**
 * Upload multiple files
 * @param files - Array of files to upload
 * @param fieldId - Form field ID
 * @param formId - Form ID
 * @returns Promise with array of upload results
 */
export const uploadMultipleFiles = async (
  files: File[],
  fieldId: string,
  formId: string
): Promise<FileUploadResult[]> => {
  try {
    if (files.length === 0) {
      throw new Error('No files selected for upload.');
    }

    if (files.length > 10) {
      throw new Error('Maximum 10 files allowed per upload.');
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await axios.post(
      `${apiConfig.url}/upload/form/${formId}/field/${fieldId}/multiple`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes for multiple files
      }
    );

    return response.data.data;
  } catch (error: any) {
    console.error('❌ Multiple files upload failed:', error);

    if (error.response?.status === 413) {
      throw new Error(
        'Files are too large. Maximum total size is 25MB per file.'
      );
    } else if (error.response?.status === 400) {
      throw new Error(
        error.response.data?.message || 'One or more files have invalid format.'
      );
    } else if (error.code === 'ECONNABORTED') {
      throw new Error(
        'Upload timeout. Please try with fewer or smaller files.'
      );
    }

    throw new Error(
      error.response?.data?.message ||
        'Failed to upload files. Please try again.'
    );
  }
};

/**
 * Delete a single file
 */
export const deleteFormFile = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw'
): Promise<FileDeleteResult> => {
  try {
    const response = await api.delete(
      `/upload/file/${encodeURIComponent(publicId)}`,
      {
        params: { resourceType },
        timeout: 30000,
      }
    );

    if (response.data.success) {
      return { success: true, publicId };
    } else {
      throw new Error('Backend deletion failed');
    }
  } catch (error: any) {
    console.error('❌ File deletion failed:', error);
    return {
      success: false,
      publicId,
      error:
        error.response?.data?.message || error.message || 'Deletion failed',
    };
  }
};

/**
 * Delete file from submission data (database only)
 * @param submissionId - Submission ID
 * @param fieldId - Field ID containing the file
 * @param filePublicId - Public ID of the file to remove
 * @returns Promise with update result
 */
export const deleteFileFromSubmission = async (
  submissionId: string,
  fieldId: string,
  filePublicId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!submissionId || !fieldId || !filePublicId) {
      throw new Error('Missing required parameters for file deletion');
    }

    const response = await api.delete(
      `/submissions/${submissionId}/files/${fieldId}/${encodeURIComponent(
        filePublicId
      )}`,
      {
        timeout: 30000,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to remove file from submission data:', error);

    if (error.response?.status === 404) {
      throw new Error('Submission or file not found.');
    } else if (error.response?.status === 403) {
      throw new Error(
        'Access denied. You do not have permission to modify this submission.'
      );
    }

    throw new Error(
      error.response?.data?.message || 'Failed to remove file from submission.'
    );
  }
};

/**
 * Delete file completely (from both cloud storage and database)
 * @param submissionId - Submission ID
 * @param fieldId - Field ID containing the file
 * @param file - File object with publicId and other metadata
 * @returns Promise with complete deletion result
 */
export const deleteFileCompletely = async (
  submissionId: string,
  fieldId: string,
  file: { publicId: string; mimeType?: string; originalName?: string }
): Promise<{ success: boolean; message: string }> => {
  try {
    // Step 1: Delete from cloud storage
    const resourceType = file.mimeType?.startsWith('image/') ? 'image' : 'raw';

    try {
      await deleteFormFile(file.publicId, resourceType);
    } catch (cloudError: any) {
      console.warn(
        ' Cloud storage deletion failed, continuing with database cleanup:',
        cloudError.message
      );
    }

    // Step 2: Remove from submission data
    try {
      await deleteFileFromSubmission(submissionId, fieldId, file.publicId);
    } catch (dbError: any) {
      console.error('❌ Database cleanup failed:', dbError);
      throw new Error(
        `File deleted from cloud but database cleanup failed: ${dbError.message}`
      );
    }

    return {
      success: true,
      message: `File "${file.originalName || 'unknown'}" deleted successfully`,
    };
  } catch (error: any) {
    console.error('❌ Complete file deletion failed:', error);
    throw error;
  }
};

/**
 * Enhanced bulk delete
 */
export const bulkDeleteFilesWithProgress = async (
  files: Array<{ publicId: string; mimeType?: string; name?: string }>,
  onProgress?: (progress: BulkDeleteProgress) => void,
  batchSize: number = 10 // Smaller batches for API calls
): Promise<{
  successful: string[];
  failed: Array<{ publicId: string; error: string }>;
  total: number;
}> => {
  const result = {
    successful: [] as string[],
    failed: [] as Array<{ publicId: string; error: string }>,
    total: files.length,
  };

  if (files.length === 0) return result;

  let processed = 0;

  // Process in smaller batches to avoid overwhelming the backend
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);

    // Process batch in parallel with limited concurrency
    const batchPromises = batch.map(async file => {
      try {
        const resourceType = file.mimeType?.startsWith('image/')
          ? 'image'
          : 'raw';
        const deleteResult = await deleteFormFile(file.publicId, resourceType);

        if (deleteResult.success) {
          result.successful.push(file.publicId);
        } else {
          result.failed.push({
            publicId: file.publicId,
            error: deleteResult.error || 'Unknown error',
          });
        }
      } catch (error: any) {
        result.failed.push({
          publicId: file.publicId,
          error: error.message || 'Deletion failed',
        });
      }

      processed++;
      onProgress?.({
        total: files.length,
        processed,
        successful: result.successful.length,
        failed: result.failed.length,
        currentFile: file.name,
      });
    });

    // Wait for current batch to complete
    await Promise.all(batchPromises);

    // Rate limiting delay between batches
    if (i + batchSize < files.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return result;
};

/**
 * : File validation with better MIME type and extension handling
 * @param file - File to validate
 * @param allowedTypes - Allowed MIME types or file extensions
 * @param maxSize - Maximum file size in bytes
 * @returns Validation result
 */
export const validateFile = (
  file: File,
  allowedTypes: string[] = [],
  maxSize: number = 25 * 1024 * 1024 // 25MB default
): { isValid: boolean; error?: string } => {
  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // If no allowedTypes specified, allow all files (but check for dangerous extensions)
  if (allowedTypes.length === 0) {
    const dangerousExtensions = [
      '.exe',
      '.bat',
      '.cmd',
      '.scr',
      '.pif',
      '.com',
      '.vbs',
      '.js',
    ];
    const hasUnsafeExtension = dangerousExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (hasUnsafeExtension) {
      return {
        isValid: false,
        error: 'File type not allowed for security reasons',
      };
    }

    return { isValid: true };
  }

  // Check allowed file types with enhanced logic
  const isTypeAllowed = allowedTypes.some(type => {
    const normalizedType = type.trim().toLowerCase();

    // Handle wildcard MIME types like 'image/*', 'video/*'
    if (normalizedType.endsWith('/*')) {
      const baseType = normalizedType.slice(0, -2);
      const result = file.type.toLowerCase().startsWith(baseType);

      return result;
    }

    // Handle file extensions like '.pdf', '.doc', '.jpg'
    if (normalizedType.startsWith('.')) {
      const result = file.name.toLowerCase().endsWith(normalizedType);

      return result;
    }

    // Handle exact MIME types like 'application/pdf', 'image/jpeg'
    if (file.type.toLowerCase() === normalizedType) {
      return true;
    }

    // Handle common aliases
    if (normalizedType === 'pdf' && file.type === 'application/pdf') {
      return true;
    }

    if (
      normalizedType === 'doc' &&
      (file.type === 'application/msword' ||
        file.type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    ) {
      return true;
    }

    if (
      normalizedType === 'excel' &&
      (file.type === 'application/vnd.ms-excel' ||
        file.type ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    ) {
      return true;
    }

    return false;
  });

  if (!isTypeAllowed) {
    return {
      isValid: false,
      error: `File type "${
        file.type
      }" is not allowed. Accepted types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check for potentially dangerous file extensions
  const dangerousExtensions = [
    '.exe',
    '.bat',
    '.cmd',
    '.scr',
    '.pif',
    '.com',
    '.vbs',
    '.js',
  ];
  const hasUnsafeExtension = dangerousExtensions.some(ext =>
    file.name.toLowerCase().endsWith(ext)
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
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 * @param filename - File name
 * @returns File extension
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

/**
 * Check if file is an image based on MIME type
 * @param mimeType - File MIME type
 * @returns Boolean indicating if file is an image
 */
export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

/**
 * Get appropriate icon for file type
 * @param mimeType - File MIME type
 * @returns Icon component name or emoji
 */
export const getFileTypeIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
    return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
    return '📈';
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('archive')
  )
    return '📦';
  return '📄'; // Default file icon
};

/**
 *   Get file download URL with authentication
 * @param fileUrl - Original file URL
 * @param fileName - Suggested filename for download
 * @returns Promise with secure download URL or blob
 */
export const getSecureFileDownload = async (
  fileUrl: string,
  fileName?: string
): Promise<{ url: string; filename: string }> => {
  try {
    // For now, return the original URL (can be enhanced with signed URLs later)
    return {
      url: fileUrl,
      filename: fileName || 'download',
    };
  } catch (error: any) {
    console.error('❌ Failed to prepare secure download:', error);
    throw new Error('Failed to prepare file download');
  }
};

/**
 * Enhanced file download with multiple fallback methods
 * @param file - File data object
 * @param options - Download options
 * @returns Promise with download result
 */
export const downloadFileEnhanced = async (
  file: { url: string; originalName: string; mimeType: string },
  options: {
    useProxy?: boolean;
    addAuthHeaders?: boolean;
    forceDirectDownload?: boolean;
  } = {}
): Promise<{ success: boolean; method: string }> => {
  const {
    useProxy = false,
    addAuthHeaders = false,
    forceDirectDownload = false,
  } = options;

  // Method 1: Try authenticated fetch with proper headers
  if (!forceDirectDownload) {
    try {
      const headers: Record<string, string> = {
        Accept: '*/*',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      };

      // Add auth headers if needed
      if (addAuthHeaders) {
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      // Use proxy endpoint if specified
      const downloadUrl = useProxy
        ? `${apiConfig.url}/proxy/download?url=${encodeURIComponent(file.url)}`
        : file.url;

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers,
        credentials: addAuthHeaders ? 'include' : 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Verify blob content
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      // Create download URL
      const downloadBlobUrl = window.URL.createObjectURL(blob);

      // Create and trigger download
      const a = document.createElement('a');
      a.href = downloadBlobUrl;
      a.download = file.originalName || 'download';
      a.style.display = 'none';

      // Add to DOM, click, and remove
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up blob URL after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadBlobUrl);
      }, 100);

      return { success: true, method: 'authenticated-fetch' };
    } catch (fetchError) {
      console.warn(' Authenticated fetch failed:', fetchError);
    }
  }

  // Method 2: Try direct download with target="_blank" fallback
  try {
    // For PDFs and other documents, try opening in new tab first
    if (file.mimeType.includes('pdf') || file.mimeType.includes('document')) {
      const newWindow = window.open(file.url, '_blank', 'noopener,noreferrer');
      if (newWindow) {
        return { success: true, method: 'new-tab' };
      }
    }

    // Standard download link method
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.originalName || 'download';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    return { success: true, method: 'direct-link' };
  } catch (directError) {
    console.error('❌ Direct download failed:', directError);
  }

  // Method 3: Last resort - copy URL to clipboard
  try {
    await navigator.clipboard.writeText(file.url);

    return { success: true, method: 'clipboard' };
  } catch (clipboardError) {
    console.error('❌ Clipboard fallback failed:', clipboardError);
  }

  throw new Error(
    'All download methods failed. Please try accessing the file directly.'
  );
};

/**
 * Get secure file URL with authentication tokens
 * @param originalUrl - Original file URL
 * @param options - URL preparation options
 * @returns Enhanced URL with auth and cache parameters
 */
export const getSecureFileUrl = (
  originalUrl: string,
  options: {
    addTimestamp?: boolean;
    addAuth?: boolean;
    viewMode?: 'inline' | 'attachment' | 'auto';
  } = {}
): string => {
  const { addTimestamp = true, addAuth = false, viewMode = 'auto' } = options;

  try {
    const url = new URL(originalUrl);

    // Add cache busting timestamp
    if (addTimestamp) {
      url.searchParams.set('_t', Date.now().toString());
    }

    // Add view mode for PDFs
    if (viewMode !== 'auto') {
      url.searchParams.set('disposition', viewMode);
    }

    // Add auth token if needed
    if (addAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        url.searchParams.set('auth', token);
      }
    }

    return url.toString();
  } catch {
    // If URL parsing fails, return original with basic cache buster
    const separator = originalUrl.includes('?') ? '&' : '?';
    return `${originalUrl}${separator}_t=${Date.now()}`;
  }
};

/**
 * Check if file URL is accessible
 * @param url - File URL to check
 * @returns Promise with accessibility result
 */
export const checkFileAccessibility = async (
  url: string
): Promise<{ accessible: boolean; error?: string; redirectUrl?: string }> => {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors',
      cache: 'no-cache',
    });

    if (response.ok) {
      return {
        accessible: true,
        redirectUrl: response.url !== url ? response.url : undefined,
      };
    } else {
      return {
        accessible: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

const fileUploadService = {
  uploadFormFile,
  uploadFormImage,
  uploadMultipleFiles,
  deleteFormFile,
  validateFile,
  formatFileSize,
  getFileExtension,
  isImageFile,
  getFileTypeIcon,
  deleteFileFromSubmission,
  deleteFileCompletely,
  getSecureFileDownload,
  downloadFileEnhanced,
  getSecureFileUrl,
  checkFileAccessibility,
};

export default fileUploadService;
