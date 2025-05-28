// src/services/formSubmission.ts

import axios from 'axios';
import { apiConfig } from '@/config/api';

export interface SubmitFormData {
  [fieldId: string]: any;
}

export interface SubmissionResponse {
  success: boolean;
  data: {
    submissionId: string;
    message: string;
    submittedAt: string;
  };
  message: string;
}

export const submitForm = async (
  formId: string,
  formData: SubmitFormData
): Promise<SubmissionResponse> => {
  try {
    console.log('🚀 Submitting form:', {
      formId,
      dataKeys: Object.keys(formData || {}),
      hasData: Object.keys(formData || {}).length > 0,
    });

    const response = await axios.post(
      `${apiConfig.url}/submissions/${formId}/submit`,
      { data: formData },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    console.log('✅ Form submission successful:', response.data);
    return response.data;
  } catch (error: any) {
    // Enhanced error handling based on response
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      switch (status) {
        case 400:
          if (message.includes('Validation failed')) {
            const validationErrors = message.replace('Validation failed: ', '');
            throw new Error(
              `Please check your form inputs:\n${validationErrors}`
            );
          } else if (message.includes('Form is not published')) {
            throw new Error(
              'This form is no longer available for submissions.'
            );
          } else if (message.includes('Form has no fields')) {
            throw new Error('This form is not properly configured.');
          } else if (message.includes('Invalid form ID')) {
            throw new Error('Invalid form. Please check the form link.');
          }
          throw new Error(message);

        case 403:
          if (message.includes('disabled')) {
            throw new Error(
              'This form is currently disabled and not accepting submissions.'
            );
          } else if (message.includes('not available')) {
            throw new Error('This form is not available for submissions.');
          }
          throw new Error('Access denied. This form may be restricted.');

        case 404:
          throw new Error('Form not found. Please check the form link.');

        case 429:
          throw new Error(
            'You have already submitted this form recently. Please try again later.'
          );

        case 500:
          throw new Error('Server error. Please try again in a few moments.');

        default:
          throw new Error(
            message || `Server error (${status}). Please try again.`
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

export const getPublicForm = async (formId: string) => {
  try {
    console.log('📋 Fetching public form:', formId);

    const response = await axios.get(
      `${apiConfig.url}/public/forms/${formId}`,
      {
        headers: {
          'Cache-Control': 'no-cache',
        },
        timeout: 15000, // 15 second timeout for loading
      }
    );

    console.log('✅ Public form loaded:', {
      title: response.data.data?.title,
      pages: response.data.data?.pages?.length || 0,
      lastUpdated: response.data.data?.updatedAt,
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching public form:', error);

    if (error.response?.status === 404) {
      throw new Error('Form not found or no longer available');
    } else if (error.response?.status === 403) {
      throw new Error(error.response.data?.message || 'Form is not available');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    }

    throw new Error('Failed to load form. Please try again.');
  }
};
