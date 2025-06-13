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
export interface FormSubmissionResult {
  success: boolean;
  data: {
    submissionId: string;
    message: string;
    fileCount?: number;
  };
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

  return cleaned;
}

/**
 * Get public form data with enhanced error handling
 */
export const getPublicForm = async (formId: string) => {
  try {
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
      //  Create structured error object, NO toasts here
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

    //  Re-throw enhanced errors
    if (error.title && error.type) {
      throw error;
    }

    //  Generic network error
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

  return { isValid: errors.length === 0, errors };
};

/**
 * Submit form with both regular data and file data
 */
export const submitForm = async (
  formId: string,
  formData: Record<string, any>,
  fileData?: Record<string, any>
): Promise<FormSubmissionResult> => {
  try {
    // Prepare submission payload
    const submissionPayload: any = {
      data: formData || {},
    };

    // Add file data if present
    if (fileData && Object.keys(fileData).length > 0) {
      submissionPayload.files = fileData;
    }

    const response = await axios.post(
      `${apiConfig.url}/submissions/${formId}/submit`,
      submissionPayload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    return {
      success: true,
      data: {
        submissionId: response.data.data?.id || response.data.submissionId,
        message: response.data.message || 'Form submitted successfully',
        fileCount: fileData
          ? Object.values(fileData).reduce((total: number, files: any) => {
              if (Array.isArray(files)) return total + files.length;
              return total + (files ? 1 : 0);
            }, 0)
          : undefined,
      },
    };
  } catch (error: any) {
    // Enhanced error handling
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      switch (status) {
        case 400:
          if (message.includes('Validation failed')) {
            throw new Error(
              `Please check your form inputs: ${message.replace(
                'Validation failed: ',
                ''
              )}`
            );
          } else if (message.includes('Form is not published')) {
            throw new Error(
              'This form is no longer available for submissions.'
            );
          } else if (message.includes('Form has no fields')) {
            throw new Error('This form is not properly configured.');
          }
          throw new Error(message);

        case 403:
          if (message.includes('disabled')) {
            throw new Error(
              'This form is currently disabled and not accepting submissions.'
            );
          }
          throw new Error('This form is not available for submissions.');

        case 404:
          throw new Error('Form not found. Please check the form link.');

        case 413:
          throw new Error(
            'File(s) too large. Please reduce file sizes and try again.'
          );

        case 429:
          throw new Error(
            'You have already submitted this form recently. Please try again later.'
          );

        case 500:
          throw new Error('Server error. Please try again later.');

        default:
          throw new Error(
            message || 'An error occurred while submitting the form.'
          );
      }
    } else if (error.request) {
      throw new Error(
        'Network error. Please check your connection and try again.'
      );
    } else {
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }
};

/**
 * Prepare file data for submission by converting it to the correct format
 */
export const prepareFileDataForSubmission = (
  fileData: Record<string, any>
): Record<string, any> => {
  const preparedData: Record<string, any> = {};

  Object.entries(fileData).forEach(([fieldId, files]) => {
    if (!files) return;

    if (Array.isArray(files)) {
      // Multiple files - keep as array
      preparedData[fieldId] = files.map(file => ({
        originalName: file.originalName,
        fileName: file.fileName,
        url: file.url,
        publicId: file.publicId,
        size: file.size,
        mimeType: file.mimeType,
        uploadedAt: file.uploadedAt,
      }));
    } else {
      // Single file - convert to object
      preparedData[fieldId] = {
        originalName: files.originalName,
        fileName: files.fileName,
        url: files.url,
        publicId: files.publicId,
        size: files.size,
        mimeType: files.mimeType,
        uploadedAt: files.uploadedAt,
      };
    }
  });

  return preparedData;
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
