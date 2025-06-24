// src/services/forms.ts
import axios from 'axios';
import { apiConfig } from '@/config/api';
import type { SortOption } from '@/components/dashboard/FilterBar';
import { toast } from 'sonner';

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

export interface FormFilters {
  search?: string;
  labels?: string[];
  status?: 'published' | 'draft' | 'archived' | 'trashed' | 'favorites' | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateFormData {
  name: string;
  description?: string;
  status?: 'published' | 'draft';
  labels?: string[];
}

// Map frontend sort options to backend fields
const mapSortOptionToBackend = (
  sortOption: SortOption
): { sortBy: string; sortOrder: 'asc' | 'desc' } => {
  switch (sortOption) {
    case 'title-az':
      return { sortBy: 'title', sortOrder: 'asc' };
    case 'title-za':
      return { sortBy: 'title', sortOrder: 'desc' };
    case 'creation-date':
      return { sortBy: 'createdAt', sortOrder: 'desc' };
    case 'last-edit':
      return { sortBy: 'updatedAt', sortOrder: 'desc' };
    case 'last-submission':
      return { sortBy: 'updatedAt', sortOrder: 'desc' };
    case 'submission-count':
      return { sortBy: 'submissions', sortOrder: 'desc' };
    default:
      return { sortBy: 'createdAt', sortOrder: 'desc' };
  }
};

export const formsService = {
  async getForms(filters: FormFilters = {}) {
    // Map frontend sort option to backend format
    let sortBy = filters.sortBy;
    let sortOrder = filters.sortOrder;

    if (
      filters.sortBy &&
      Object.values([
        'title-az',
        'title-za',
        'creation-date',
        'last-edit',
        'last-submission',
        'submission-count',
        'unread',
      ]).includes(filters.sortBy)
    ) {
      const mapped = mapSortOptionToBackend(filters.sortBy as SortOption);
      sortBy = mapped.sortBy;
      sortOrder = mapped.sortOrder;
    }

    // Map status to proper backend filter
    let status = filters.status;
    if (status === 'all') {
      status = undefined; // Let backend handle 'all' by not filtering
    }

    const params = {
      search: filters.search,
      labels: filters.labels,
      status: status,
      sortBy,
      sortOrder,
      page: filters.page || 1,
      limit: filters.limit || 50,
    };

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] === undefined) {
        delete params[key as keyof typeof params];
      }
    });

    const response = await api.get('/forms', {
      params,
      paramsSerializer: {
        serialize: params => {
          const searchParams = new URLSearchParams();

          Object.entries(params).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach(item => {
                if (item !== undefined && item !== null) {
                  searchParams.append(key, String(item));
                }
              });
            } else if (value !== undefined && value !== null) {
              searchParams.append(key, String(value));
            }
          });

          return searchParams.toString();
        },
      },
    });

    return response.data;
  },

  async getForm(id: string) {
    try {
      const response = await api.get(`/forms/${id}`);

      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching form structure:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch form structure'
      );
    }
  },

  async checkFormNameExists(name: string): Promise<boolean> {
    try {
      const response = await api.get('/forms', {
        params: {
          search: name,
          limit: 100, // Check more forms to be thorough
        },
      });

      // Check if any form has the exact same name (case-insensitive)
      const exactMatch = response.data.data?.some(
        (form: any) =>
          form.name?.toLowerCase().trim() === name.toLowerCase().trim()
      );

      return !!exactMatch;
    } catch (error) {
      console.warn('Error checking form name:', error);
      return false; // Assume it doesn't exist if check fails
    }
  },

  async createFormWithUniqueTitle(data: CreateFormData) {
    try {
      // First attempt with original name
      const response = await this.createForm(data);
      return response;
    } catch (error: any) {
      // If it's a duplicate name error, let backend handle the retry
      if (
        error.response?.data?.message?.includes('title already exists') ||
        error.response?.data?.message?.includes('duplicate') ||
        error.response?.status === 400
      ) {
        console.log('🔄 Form name conflict detected, trying with suffix...');

        // Simple retry with timestamp
        const timestamp = Date.now().toString().slice(-6); // Last 6 digits
        const retryData = {
          ...data,
          name: `${data.name} ${timestamp}`,
        };

        const response = await this.createForm(retryData);

        // Return with name change indication
        return {
          ...response,
          data: {
            ...response.data,
            nameChanged: true,
            originalName: data.name,
            finalName: retryData.name,
          },
        };
      }

      // Re-throw if it's a different error
      throw error;
    }
  },

  async createForm(data: CreateFormData) {
    const response = await api.post('/forms', data);
    return response.data;
  },

  async updateForm(id: string, data: any) {
    const response = await api.put(`/forms/${id}`, data);
    return response.data;
  },

  renameForm: async (formId: string, newName: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.patch(
      `${apiConfig.url}/forms/${formId}/rename`,
      { name: newName },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response;
  },

  async toggleFavorite(id: string) {
    const response = await api.patch(`/forms/${id}/favorite`);
    return response.data;
  },

  async archiveForm(id: string) {
    const response = await api.patch(`/forms/${id}/archive`);
    return response.data;
  },

  async trashForm(id: string) {
    const response = await api.patch(`/forms/${id}/trash`);
    return response.data;
  },

  async restoreForm(id: string) {
    const response = await api.patch(`/forms/${id}/restore`);
    return response.data;
  },

  async deleteForm(id: string) {
    try {
      const response = await api.delete(`/forms/${id}`, {
        timeout: 120000, // 2 minute timeout for large deletions
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Form deletion failed:', error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to delete form and associated data';

      toast.error('Deletion Failed', {
        description: errorMessage,
        duration: 10000,
      });

      throw error;
    }
  },

  async bulkAction(formIds: string[], action: string) {
    const response = await api.patch('/forms/bulk', { formIds, action });
    return response.data;
  },

  async bulkAddLabel(formIds: string[], labelId: string) {
    try {
      const response = await api.patch('/forms/bulk/add-label', {
        formIds,
        labelId,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error bulk adding label:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to add label to forms'
      );
    }
  },

  async bulkRemoveLabel(formIds: string[], labelId: string) {
    try {
      const response = await api.patch('/forms/bulk/remove-label', {
        formIds,
        labelId,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error bulk removing label:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to remove label from forms'
      );
    }
  },
};
