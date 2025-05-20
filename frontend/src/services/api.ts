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

// Form API endpoints
export const formAPI = {
  // Get all forms for current user
  getForms: () => api.get('/forms'),

  // Get a specific form
  getForm: (formId: string) => api.get(`/forms/${formId}`),

  // Create a new form
  createForm: (formData: any) => api.post('/forms', formData),

  // Update an existing form
  updateForm: (formId: string, formData: any) =>
    api.put(`/forms/${formId}`, formData),

  // Delete a form
  deleteForm: (formId: string) => api.delete(`/forms/${formId}`),

  // Update form logo
  updateLogo: (formId: string, logoData: any) =>
    api.put(`/forms/${formId}/logo`, logoData),

  // Remove form logo
  removeLogo: (formId: string) => api.delete(`/forms/${formId}/logo`),
};

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
  formAPI,
  uploadAPI,
};

export default apiService;
