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

export default apiService;
