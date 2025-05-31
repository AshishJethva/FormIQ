// src/services/formSubmission.ts

import axios from 'axios';
import { apiConfig } from '@/config/api';

export interface SubmitFormData {
  [fieldId: string]: any;
}

export interface FileData {
  [fieldId: string]: any; // Can be single file object or array of file objects
}

export interface SubmissionResponse {
  success: boolean;
  data: {
    submissionId: string;
    message: string;
    submittedAt: string;
    fileCount?: number;
  };
  message: string;
}

/**
 * Clean and validate form data
 */
function cleanFormData(formData: SubmitFormData): SubmitFormData {
  if (!formData || typeof formData !== 'object') {
    return {};
  }

  const cleaned: SubmitFormData = {};

  for (const [fieldId, value] of Object.entries(formData)) {
    // Skip null, undefined, or empty string values
    if (value === null || value === undefined) {
      continue;
    }

    // Clean string values
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        cleaned[fieldId] = trimmed;
      }
    }
    // Handle arrays
    else if (Array.isArray(value)) {
      const cleanedArray = value.filter(
        item => item !== null && item !== undefined && item !== ''
      );
      if (cleanedArray.length > 0) {
        cleaned[fieldId] = cleanedArray;
      }
    }
    // Handle objects (like fullName, address, etc.)
    else if (typeof value === 'object') {
      const cleanedObject: any = {};
      let hasValidValue = false;

      for (const [key, objValue] of Object.entries(value)) {
        if (objValue !== null && objValue !== undefined && objValue !== '') {
          cleanedObject[key] =
            typeof objValue === 'string' ? objValue.trim() : objValue;
          hasValidValue = true;
        }
      }

      if (hasValidValue) {
        cleaned[fieldId] = cleanedObject;
      }
    }
    // Handle numbers and booleans
    else {
      cleaned[fieldId] = value;
    }
  }

  console.log('🧹 Form data cleaning:', {
    originalFields: Object.keys(formData).length,
    cleanedFields: Object.keys(cleaned).length,
    removedFields: Object.keys(formData).filter(key => !(key in cleaned)),
  });

  return cleaned;
}

/**
 * Clean and validate file data
 */
function cleanFileData(fileData?: FileData): FileData {
  if (!fileData || typeof fileData !== 'object') {
    return {};
  }

  const cleaned: FileData = {};

  for (const [fieldId, files] of Object.entries(fileData)) {
    if (!files) continue;

    if (Array.isArray(files)) {
      const validFiles = files.filter(
        file => file && typeof file === 'object' && file.url && file.publicId
      );
      if (validFiles.length > 0) {
        cleaned[fieldId] = validFiles;
      }
    } else if (typeof files === 'object' && files.url && files.publicId) {
      cleaned[fieldId] = files;
    }
  }

  console.log('🧹 File data cleaning:', {
    originalFields: Object.keys(fileData).length,
    cleanedFields: Object.keys(cleaned).length,
  });

  return cleaned;
}

/**
 * Validate submission payload
 */
function validatePayload(payload: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check basic structure
  if (!payload || typeof payload !== 'object') {
    errors.push('Invalid payload structure');
    return { isValid: false, errors };
  }

  // Validate data field
  if (payload.data && typeof payload.data !== 'object') {
    errors.push('Invalid data field type');
  }

  // Validate files field
  if (payload.files && typeof payload.files !== 'object') {
    errors.push('Invalid files field type');
  }

  // Validate file structure
  if (payload.files) {
    for (const [fieldId, files] of Object.entries(payload.files)) {
      if (Array.isArray(files)) {
        for (const file of files) {
          if (!isValidFileObject(file)) {
            errors.push(`Invalid file object in field ${fieldId}`);
          }
        }
      } else if (!isValidFileObject(files)) {
        errors.push(`Invalid file object in field ${fieldId}`);
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Check if file object is valid
 */
function isValidFileObject(file: any): boolean {
  return (
    file &&
    typeof file === 'object' &&
    typeof file.url === 'string' &&
    typeof file.publicId === 'string' &&
    typeof file.originalName === 'string' &&
    typeof file.size === 'number'
  );
}

/**
 * Get public form data with enhanced error handling
 */
export const getPublicForm = async (formId: string) => {
  try {
    console.log('📋 Fetching public form:', formId);

    const response = await axios.get(
      `${apiConfig.url}/public/forms/${formId}`,
      {
        headers: {
          'Cache-Control': 'no-cache',
          Accept: 'application/json',
        },
        timeout: 15000,
        validateStatus: status => status < 600,
      }
    );

    if (response.status >= 400) {
      throw new Error(response.data?.message || `HTTP ${response.status}`);
    }

    console.log('✅ Public form loaded:', {
      title: response.data.data?.title,
      pages: response.data.data?.pages?.length || 0,
      lastUpdated: response.data.data?.updatedAt,
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to load form:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      switch (status) {
        case 404:
          throw new Error('Form not found or no longer available');
        case 403:
          throw new Error(message || 'Form is not available');
        default:
          throw new Error(message || 'Failed to load form. Please try again.');
      }
    }

    throw new Error('Failed to load form. Please check your connection.');
  }
};

/**
 * Enhanced client-side form validation
 */
export const validateFormBeforeSubmission = (
  formData: SubmitFormData,
  formStructure: any,
  fileData?: FileData
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!formStructure?.pages || !Array.isArray(formStructure.pages)) {
    return { isValid: true, errors: [] };
  }

  console.log('🔍 Client-side validation started:', {
    formDataKeys: Object.keys(formData || {}),
    fileDataKeys: Object.keys(fileData || {}),
    pagesCount: formStructure.pages.length,
  });

  formStructure.pages.forEach((page: any) => {
    if (!page.fields || !Array.isArray(page.fields)) return;

    page.fields.forEach((field: any) => {
      if (!field || field.type === 'heading') return;

      const fieldValue = formData[field.id];
      const fieldFiles = fileData?.[field.id];

      // Required field validation
      if (field.required) {
        if (field.type === 'fileUpload' || field.type === 'image') {
          const hasFiles =
            fieldFiles &&
            (Array.isArray(fieldFiles) ? fieldFiles.length > 0 : !!fieldFiles);
          if (!hasFiles) {
            errors.push(`${field.label || field.id} is required`);
          }
        } else {
          const isEmpty =
            !fieldValue ||
            (typeof fieldValue === 'string' && fieldValue.trim() === '') ||
            (Array.isArray(fieldValue) && fieldValue.length === 0);

          if (isEmpty) {
            errors.push(`${field.label || field.id} is required`);
          }
        }
      }

      // Type-specific validation
      if (fieldValue) {
        switch (field.type) {
          case 'email':
            if (typeof fieldValue === 'string' && fieldValue.includes('@')) {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(fieldValue.trim())) {
                errors.push(
                  `Please enter a valid email address for ${field.label}`
                );
              }
            }
            break;

          case 'phone':
            if (typeof fieldValue === 'string') {
              const cleanPhone = fieldValue.replace(/\D/g, '');
              if (cleanPhone.length < 10) {
                errors.push(
                  `Please enter a valid phone number for ${field.label}`
                );
              }
            }
            break;

          case 'number':
            const numValue = Number(fieldValue);
            if (isNaN(numValue)) {
              errors.push(`Please enter a valid number for ${field.label}`);
            }
            break;
        }
      }
    });
  });

  console.log('✅ Client-side validation completed:', {
    isValid: errors.length === 0,
    errorCount: errors.length,
    errors: errors.slice(0, 3),
  });

  return { isValid: errors.length === 0, errors };
};

/**
 * Submit form with data and files
 * @param formId - Form ID
 * @param formData - Form field data
 * @param fileData - File upload data (optional)
 * @returns Promise with submission response
 */
export const submitForm = async (
  formId: string,
  formData: SubmitFormData,
  fileData?: FileData
): Promise<SubmissionResponse> => {
  try {
    console.log('🚀 ENHANCED FORM SUBMISSION DEBUG:', {
      formId,
      dataKeys: Object.keys(formData || {}),
      fileKeys: Object.keys(fileData || {}),
      hasFiles: !!fileData && Object.keys(fileData).length > 0,
      formDataSample: Object.fromEntries(
        Object.entries(formData || {})
          .slice(0, 3)
          .map(([key, value]) => [
            key,
            typeof value === 'string' && value.length > 50
              ? `${value.substring(0, 50)}...`
              : value,
          ])
      ),
      fileSummary: fileData
        ? Object.fromEntries(
            Object.entries(fileData).map(([key, value]) => [
              key,
              Array.isArray(value)
                ? `${value.length} files`
                : value
                ? '1 file'
                : 'no file',
            ])
          )
        : {},
    });

    // Data validation and cleaning
    const cleanedFormData = cleanFormData(formData);
    const cleanedFileData = cleanFileData(fileData);

    console.log('🧹 Data cleaning results:', {
      originalDataKeys: Object.keys(formData || {}),
      cleanedDataKeys: Object.keys(cleanedFormData),
      originalFileKeys: Object.keys(fileData || {}),
      cleanedFileKeys: Object.keys(cleanedFileData),
    });

    // Prepare submission payload
    const payload = {
      data: cleanedFormData,
      files: cleanedFileData,
    };

    console.log('📤 Final submission payload:', {
      payloadSize: JSON.stringify(payload).length,
      dataFieldCount: Object.keys(payload.data).length,
      fileFieldCount: Object.keys(payload.files).length,
      payloadStructure: {
        data: Object.keys(payload.data),
        files: Object.keys(payload.files),
      },
    });

    // Validate payload structure
    const validationResult = validatePayload(payload);
    if (!validationResult.isValid) {
      console.error('❌ Payload validation failed:', validationResult.errors);
      throw new Error(
        `Payload validation failed: ${validationResult.errors.join(', ')}`
      );
    }

    console.log('✅ Payload validation passed');

    // Make the API request with enhanced configuration
    const response = await axios.post(
      `${apiConfig.url}/submissions/${formId}/submit`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 60000, // 60 second timeout
        validateStatus: status => {
          // Don't throw for 4xx/5xx status codes, let us handle them
          return status < 600;
        },
      }
    );

    console.log('📡 API Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      dataKeys: Object.keys(response.data || {}),
    });

    if (response.status >= 400) {
      throw new Error(
        response.data?.message ||
          `HTTP ${response.status}: ${response.statusText}`
      );
    }

    console.log('✅ Form submission successful:', {
      submissionId: response.data.data?.submissionId,
      fileCount: response.data.data?.fileCount || 0,
      message: response.data.message,
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ DETAILED FORM SUBMISSION ERROR:', {
      errorType: error.constructor.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
      formId,
      formDataKeys: Object.keys(formData || {}),
      fileDataKeys: Object.keys(fileData || {}),
    });

    // Enhanced error handling
    if (axios.isAxiosError(error)) {
      console.error('🔍 Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestConfig: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
        code: error.code,
      });

      const status = error.response?.status;
      const responseMessage = error.response?.data?.message || error.message;

      switch (status) {
        case 400:
          if (responseMessage.includes('Validation failed')) {
            throw new Error(
              `Form validation failed:\n${responseMessage.replace(
                'Validation failed: ',
                ''
              )}`
            );
          } else if (responseMessage.includes('Invalid request format')) {
            throw new Error(
              'The form data format is invalid. Please try refreshing the page and submitting again.'
            );
          } else {
            throw new Error(responseMessage);
          }

        case 403:
          throw new Error('This form is not currently accepting submissions.');

        case 404:
          throw new Error('Form not found. Please check the form link.');

        case 413:
          throw new Error(
            'Uploaded files are too large. Please reduce file sizes and try again.'
          );

        case 429:
          throw new Error(
            'You have already submitted this form recently. Please try again later.'
          );

        case 500:
          throw new Error('Server error. Please try again in a few moments.');

        default:
          throw new Error(
            responseMessage || `Server error (${status}). Please try again.`
          );
      }
    } else if (error.request) {
      // Network error - no response received
      throw new Error(
        'Network error. Please check your internet connection and try again.'
      );
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      throw new Error('Request timeout. Please try again.');
    } else {
      // Other errors
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }
};

/**
 * Prepare file data for submission
 * @param files - Object containing field IDs and their uploaded files
 * @returns Formatted file data for submission
 */
export const prepareFileDataForSubmission = (
  files: Record<string, any>
): FileData => {
  const fileData: FileData = {};

  Object.entries(files).forEach(([fieldId, fieldFiles]) => {
    if (fieldFiles) {
      if (Array.isArray(fieldFiles)) {
        // Multiple files for one field
        fileData[fieldId] = fieldFiles.map(file => ({
          originalName: file.originalName,
          fileName: file.fileName,
          url: file.url,
          publicId: file.publicId,
          size: file.size,
          mimeType: file.mimeType,
          uploadedAt: file.uploadedAt,
        }));
      } else {
        // Single file for one field
        fileData[fieldId] = {
          originalName: fieldFiles.originalName,
          fileName: fieldFiles.fileName,
          url: fieldFiles.url,
          publicId: fieldFiles.publicId,
          size: fieldFiles.size,
          mimeType: fieldFiles.mimeType,
          uploadedAt: fieldFiles.uploadedAt,
        };
      }
    }
  });

  return fileData;
};

/**
 * Validate form data before submission
 * @param formData - Form data to validate
 * @param formStructure - Form structure for validation
 * @param fileData - File data to validate
 * @returns Validation result
 */
export const validateFormSubmission = (
  formData: SubmitFormData,
  formStructure: any,
  fileData?: FileData
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!formStructure?.pages || !Array.isArray(formStructure.pages)) {
    return { isValid: true, errors: [] };
  }

  formStructure.pages.forEach((page: any) => {
    if (page.fields && Array.isArray(page.fields)) {
      page.fields.forEach((field: any) => {
        if (field.type === 'heading') return; // Skip headings

        const fieldValue = formData[field.id];
        const fieldFiles = fileData?.[field.id];

        // Check required fields
        if (field.required) {
          // For file/image fields, check if files were uploaded
          if (field.type === 'fileUpload' || field.type === 'image') {
            const hasFiles =
              fieldFiles &&
              (Array.isArray(fieldFiles)
                ? fieldFiles.length > 0
                : !!fieldFiles);
            if (!hasFiles) {
              errors.push(`${field.label || field.id} is required`);
            }
          } else {
            // For other fields, check regular value
            if (
              !fieldValue ||
              (typeof fieldValue === 'string' && fieldValue.trim() === '')
            ) {
              errors.push(`${field.label || field.id} is required`);
            }
          }
        }

        // Validate file constraints
        if (
          (field.type === 'fileUpload' || field.type === 'image') &&
          fieldFiles
        ) {
          const files = Array.isArray(fieldFiles) ? fieldFiles : [fieldFiles];

          // Check multiple files constraint
          if (!field.multiple && files.length > 1) {
            errors.push(`${field.label || field.id} only allows one file`);
          }

          // Check file types for image fields
          if (field.type === 'image') {
            files.forEach((file: any) => {
              if (!file.mimeType?.startsWith('image/')) {
                errors.push(
                  `${field.label || field.id} only accepts image files`
                );
              }
            });
          }

          // Check accept attribute
          if (field.accept && field.accept !== '*/*') {
            const allowedTypes = field.accept
              .split(',')
              .map((type: string) => type.trim());
            files.forEach((file: any) => {
              const isTypeAllowed = allowedTypes.some((type: string) => {
                if (type.startsWith('.')) {
                  return file.originalName
                    ?.toLowerCase()
                    .endsWith(type.toLowerCase());
                } else if (type.endsWith('/*')) {
                  const baseType = type.slice(0, -2);
                  return file.mimeType?.startsWith(baseType);
                } else {
                  return file.mimeType === type;
                }
              });

              if (!isTypeAllowed) {
                errors.push(
                  `File "${
                    file.originalName
                  }" is not an allowed file type for ${field.label || field.id}`
                );
              }
            });
          }
        }
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateFormSubmissionWithFiles = (
  formData: SubmitFormData,
  fileData: FileData,
  formStructure: any
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!formStructure?.pages || !Array.isArray(formStructure.pages)) {
    return { isValid: true, errors: [] };
  }

  formStructure.pages.forEach((page: any) => {
    if (page.fields && Array.isArray(page.fields)) {
      page.fields.forEach((field: any) => {
        if (field.type === 'heading') return; // Skip headings

        const fieldValue = formData[field.id];
        const fieldFiles = fileData[field.id];

        // Check required fields
        if (field.required) {
          // For file/image fields, check if files were uploaded
          if (field.type === 'fileUpload' || field.type === 'image') {
            const hasFiles =
              fieldFiles &&
              (Array.isArray(fieldFiles)
                ? fieldFiles.length > 0
                : !!fieldFiles);
            if (!hasFiles) {
              errors.push(`${field.label || field.id} is required`);
            }
          } else {
            // For other fields, check regular value
            if (
              !fieldValue ||
              (typeof fieldValue === 'string' && fieldValue.trim() === '')
            ) {
              errors.push(`${field.label || field.id} is required`);
            }

            // Complex field validations
            if (field.type === 'fullName' && typeof fieldValue === 'object') {
              if (!fieldValue.firstName || !fieldValue.lastName) {
                errors.push('Both first and last name are required');
              }
            }

            if (field.type === 'address' && typeof fieldValue === 'object') {
              if (!fieldValue.street || !fieldValue.city || !fieldValue.state) {
                errors.push('Street address, city, and state are required');
              }
            }

            if (
              field.type === 'appointment' &&
              typeof fieldValue === 'object'
            ) {
              if (!fieldValue.date || !fieldValue.time) {
                errors.push('Both date and time are required');
              }
            }
          }
        }

        // Validate file constraints
        if (
          (field.type === 'fileUpload' || field.type === 'image') &&
          fieldFiles
        ) {
          const files = Array.isArray(fieldFiles) ? fieldFiles : [fieldFiles];

          // Check multiple files constraint
          if (!field.multiple && files.length > 1) {
            errors.push(`${field.label || field.id} only allows one file`);
          }

          // Check file types for image fields
          if (field.type === 'image') {
            files.forEach((file: any) => {
              if (!file.mimeType?.startsWith('image/')) {
                errors.push(
                  `${field.label || field.id} only accepts image files`
                );
              }
            });
          }

          // Check file size limits
          files.forEach((file: any) => {
            const maxSize =
              field.type === 'image' ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
            if (file.size > maxSize) {
              errors.push(
                `File "${file.originalName}" exceeds the ${
                  field.type === 'image' ? '10MB' : '25MB'
                } size limit`
              );
            }
          });

          // Check accept attribute
          if (field.accept && field.accept !== '*/*') {
            const allowedTypes = field.accept
              .split(',')
              .map((type: string) => type.trim());
            files.forEach((file: any) => {
              const isTypeAllowed = allowedTypes.some((type: string) => {
                if (type.startsWith('.')) {
                  return file.originalName
                    ?.toLowerCase()
                    .endsWith(type.toLowerCase());
                } else if (type.endsWith('/*')) {
                  const baseType = type.slice(0, -2);
                  return file.mimeType?.startsWith(baseType);
                } else {
                  return file.mimeType === type;
                }
              });

              if (!isTypeAllowed) {
                errors.push(
                  `File "${
                    file.originalName
                  }" is not an allowed file type for ${field.label || field.id}`
                );
              }
            });
          }
        }

        // Email validation
        if (field.type === 'email' && fieldValue) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(fieldValue)) {
            errors.push(
              `Please enter a valid email address for ${field.label}`
            );
          }
        }

        // Phone validation
        if (field.type === 'phone' && fieldValue) {
          const cleanPhone = fieldValue.replace(/\D/g, '');
          if (cleanPhone.length !== 10) {
            errors.push(
              `Please enter a valid 10-digit phone number for ${field.label}`
            );
          }
        }
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const formSubmissionService = {
  submitForm,
  getPublicForm,
  prepareFileDataForSubmission,
  validateFormSubmission,
  validateFormBeforeSubmission,
  cleanFormData,
  cleanFileData,
};

export default formSubmissionService;
