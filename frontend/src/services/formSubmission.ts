// src/services/formSubmission.ts
import axios from 'axios';
import { apiConfig } from '@/config/api';

export interface SubmitFormData {
  [fieldId: string]: any;
}

export interface FileData {
  [fieldId: string]: any;
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
 * Enhanced error messages for better user experience
 */
export const getSubmissionErrorMessage = (
  status: number,
  responseMessage: string,
  formTitle?: string
) => {
  switch (status) {
    case 429:
      // Check if it's a duplicate submission or rate limiting
      if (
        responseMessage.toLowerCase().includes('already submitted') ||
        responseMessage.toLowerCase().includes('duplicate submission')
      ) {
        return {
          title: 'Form Already Submitted',
          description: formTitle
            ? `You have already submitted "${formTitle}". If you need to make changes, please contact the form owner.`
            : 'You have already submitted this form. If you need to make changes, please contact the form owner.',
          type: 'warning' as const,
        };
      } else {
        return {
          title: 'Too Many Attempts',
          description: 'Please wait a moment before submitting again.',
          type: 'warning' as const,
        };
      }

    case 400:
      if (responseMessage.includes('Validation failed')) {
        return {
          title: 'Form Validation Error',
          description: responseMessage.replace('Validation failed: ', ''),
          type: 'error' as const,
        };
      } else if (responseMessage.includes('Invalid request format')) {
        return {
          title: 'Form Error',
          description:
            'The form data format is invalid. Please refresh the page and try again.',
          type: 'error' as const,
        };
      } else {
        return {
          title: 'Submission Error',
          description: responseMessage,
          type: 'error' as const,
        };
      }

    case 403:
      const message = responseMessage.toLowerCase();

      if (message.includes('disabled') || message.includes('deactivated')) {
        return {
          title: 'Form Disabled',
          description:
            'This form has been disabled by its owner and is no longer accepting submissions.',
          type: 'warning' as const,
          duration: 7000,
          style: {
            background: '#FEF3C7',
            borderColor: '#F59E0B',
            color: '#92400E',
          },
        };
      } else if (
        message.includes('deadline') ||
        message.includes('expired') ||
        message.includes('closed')
      ) {
        return {
          title: 'Submission Period Ended',
          description: 'The submission deadline for this form has passed.',
          type: 'warning' as const,
          duration: 7000,
          style: {
            background: '#FEF3C7',
            borderColor: '#F59E0B',
            color: '#92400E',
          },
        };
      } else if (
        message.includes('capacity') ||
        message.includes('limit') ||
        message.includes('maximum')
      ) {
        return {
          title: 'Form at Capacity',
          description:
            'This form has reached its maximum number of submissions.',
          type: 'warning' as const,
          duration: 6000,
          style: {
            background: '#FEF3C7',
            borderColor: '#F59E0B',
            color: '#92400E',
          },
        };
      } else {
        // Default 403 message
        return {
          title: 'Form Temporarily Unavailable',
          description:
            'This form is not currently accepting new submissions. Please try again later.',
          type: 'warning' as const,
          duration: 6000,
          style: {
            background: '#FEF3C7',
            borderColor: '#F59E0B',
            color: '#92400E',
          },
        };
      }

    case 404:
      return {
        title: 'Form Not Found',
        description:
          'The form you are trying to submit could not be found. Please check the form link.',
        type: 'error' as const,
      };

    case 413:
      return {
        title: 'Files Too Large',
        description:
          'Your uploaded files are too large. Please reduce file sizes and try again.',
        type: 'warning' as const,
      };

    case 500:
      return {
        title: 'Server Error',
        description:
          'We encountered a server error. Please try again in a few moments.',
        type: 'error' as const,
      };

    default:
      return {
        title: 'Submission Failed',
        description:
          responseMessage || `An error occurred (${status}). Please try again.`,
        type: 'error' as const,
      };
  }
};

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
      // ✅ Create structured error object, NO toasts here
      const errorInfo = getSubmissionErrorMessage(
        response.status,
        response.data?.message || response.statusText
      );

      const error = new Error(errorInfo.description) as any;
      error.title = errorInfo.title;
      error.type = errorInfo.type;
      error.status = response.status;
      error.style = errorInfo.style;
      error.duration = errorInfo.duration;

      throw error;
    }

    console.log('✅ Public form loaded:', {
      title: response.data.data?.title,
      pages: response.data.data?.pages?.length || 0,
      lastUpdated: response.data.data?.updatedAt,
    });

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      const errorInfo = getSubmissionErrorMessage(status || 0, message);

      const enhancedError = new Error(errorInfo.description) as any;
      enhancedError.title = errorInfo.title;
      enhancedError.type = errorInfo.type;
      enhancedError.status = status;
      enhancedError.style = errorInfo.style;
      enhancedError.duration = errorInfo.duration;

      throw enhancedError;
    }

    // ✅ Re-throw enhanced errors
    if (error.title && error.type) {
      throw error;
    }

    // ✅ Generic network error
    const networkError = new Error(
      'Unable to connect to the server. Please check your internet connection.'
    ) as any;
    networkError.title = 'Connection Error';
    networkError.type = 'error';
    throw networkError;
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
 * Submit form with data and files - Enhanced with better error handling
 * @param formId - Form ID
 * @param formData - Form field data
 * @param fileData - File upload data (optional)
 * @param formTitle - Form title for better error messages (optional)
 * @returns Promise with submission response
 */
export const submitForm = async (
  formId: string,
  formData: SubmitFormData,
  fileData?: FileData,
  formTitle?: string
): Promise<SubmissionResponse> => {
  try {
    console.log('🚀 ENHANCED FORM SUBMISSION DEBUG:', {
      formId,
      formTitle,
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
      // console.error('❌ Payload validation failed:', validationResult.errors);
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
      // Create enhanced error with structured message for better toast handling
      const errorInfo = getSubmissionErrorMessage(
        response.status,
        response.data?.message || response.statusText,
        formTitle
      );

      const error = new Error(errorInfo.description) as any;
      error.title = errorInfo.title;
      error.type = errorInfo.type;
      error.status = response.status;

      throw error;
    }

    console.log('✅ Form submission successful:', {
      submissionId: response.data.data?.submissionId,
      fileCount: response.data.data?.fileCount || 0,
      message: response.data.message,
    });

    return response.data;
  } catch (error: any) {
    console.log('❌ DETAILED FORM SUBMISSION ERROR:', {
      errorType: error.constructor.name,
      message: error.message,
      title: error.title,
      type: error.type,
      status: error.status,
      stack: error.stack?.split('\n').slice(0, 5),
      formId,
      formTitle,
      formDataKeys: Object.keys(formData || {}),
      fileDataKeys: Object.keys(fileData || {}),
    });

    // Enhanced error handling with structured error info
    if (axios.isAxiosError(error)) {
      console.log('🔍 Axios error details:', {
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

      const status = error.response?.status || 0;
      const responseMessage = error.response?.data?.message || error.message;

      const errorInfo = getSubmissionErrorMessage(
        status,
        responseMessage,
        formTitle
      );

      const enhancedError = new Error(errorInfo.description) as any;
      enhancedError.title = errorInfo.title;
      enhancedError.type = errorInfo.type;
      enhancedError.status = status;

      throw enhancedError;
    } else if (error.request) {
      // Network error - no response received
      const networkError = new Error(
        'Please check your internet connection and try again.'
      ) as any;
      networkError.title = 'Network Error';
      networkError.type = 'error';
      throw networkError;
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      const timeoutError = new Error(
        'The request took too long. Please try again.'
      ) as any;
      timeoutError.title = 'Request Timeout';
      timeoutError.type = 'warning';
      throw timeoutError;
    } else {
      // Re-throw enhanced errors or create new one
      if (error.title && error.type) {
        throw error;
      }

      const genericError = new Error(
        'An unexpected error occurred. Please try again.'
      ) as any;
      genericError.title = 'Unexpected Error';
      genericError.type = 'error';
      throw genericError;
    }
  }
};

// Rest of your existing functions remain the same...
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

const formSubmissionService = {
  submitForm,
  getPublicForm,
  prepareFileDataForSubmission,
  validateFormBeforeSubmission,
  getSubmissionErrorMessage,
  cleanFormData,
  cleanFileData,
};

export default formSubmissionService;
