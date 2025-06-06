// src/services/api.ts
import axios from 'axios';

import { apiConfig } from '@/config/api';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: apiConfig.url,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth tokens
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

// Upload API endpoints
export const uploadAPI = {
  // Upload logo to Cloudinary
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);

    return api.post('/upload/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

const apiService = {
  uploadAPI,
};

export const submitForm = async (formId: string, formData: any) => {
  try {
    console.log('🚀 Submitting form:', {
      formId,
      dataKeys: Object.keys(formData || {}),
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

    console.log(' Form submission successful:', response.data);
    return response.data;
  } catch (error: any) {
    // Enhanced error handling
    if (error.response) {
      // Server responded with error status
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
      // Network error
      throw new Error(
        'Network error. Please check your connection and try again.'
      );
    } else {
      // Other error
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }
};

export default apiService;
