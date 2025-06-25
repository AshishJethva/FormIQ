import axios from 'axios';
import { apiConfig } from '@/config/api';

const api = axios.create({
  baseURL: apiConfig.url,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth tokens
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token') || getCookieValue('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Handle unauthorized - maybe redirect to login
      console.warn('Unauthorized request - token may be expired');
    }

    return Promise.reject(error);
  }
);

// Helper function to get cookie value
function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export interface CreateLabelRequest {
  name: string;
  color: string;
}

export interface UpdateLabelRequest {
  name?: string;
  color?: string;
}

export interface LabelResponse {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  userId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface LabelFilters {
  search?: string;
}

export const labelsService = {
  async getLabels(search?: string) {
    try {
      const url = search
        ? `/labels?search=${encodeURIComponent(search)}`
        : '/labels';

      const response = await api.get<ApiResponse<LabelResponse[]>>(url);

      if (!response.data || !response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch labels');
      }

      if (!Array.isArray(response.data.data)) {
        throw new Error('Expected array of labels from server');
      }

      return response.data;
    } catch (error: any) {
      console.error('Error fetching labels:', error);

      let errorMessage = 'Failed to fetch labels';

      if (error.code === 'ERR_NETWORK') {
        errorMessage =
          'Cannot connect to server. Please check if the backend is running.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  // Get single label
  async getLabel(id: string) {
    try {
      const response = await api.get<ApiResponse<LabelResponse>>(
        `/labels/${id}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching label:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch label'
      );
    }
  },

  // Create new label
  async createLabel(data: CreateLabelRequest) {
    try {
      const response = await api.post<ApiResponse<LabelResponse>>(
        '/labels',
        data
      );

      return response.data;
    } catch (error: any) {
      console.error('Error creating label:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to create label'
      );
    }
  },

  // Update label
  async updateLabel(id: string, data: UpdateLabelRequest) {
    try {
      const response = await api.put<ApiResponse<LabelResponse>>(
        `/labels/${id}`,
        data
      );

      return response.data;
    } catch (error: any) {
      console.error('Error updating label:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to update label'
      );
    }
  },

  // Delete label
  async deleteLabel(id: string) {
    try {
      const response = await api.delete<ApiResponse<null>>(`/labels/${id}`);

      return response.data;
    } catch (error: any) {
      console.error('Error deleting label:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to delete label'
      );
    }
  },
};
