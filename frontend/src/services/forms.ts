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
    // Log the incoming filters
    console.log(' formsService.getForms called with filters:', filters);

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
      console.log('📋 Fetching form structure for ID:', id);
      const response = await api.get(`/forms/${id}`);
      console.log(' Form structure fetched successfully');
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
      console.log('🗑️ Starting comprehensive form deletion:', id);

      const response = await api.delete(`/forms/${id}`, {
        timeout: 120000, // 2 minute timeout for large deletions
      });

      // Show detailed success message
      const details = response.data.details;

      console.log(' Form deletion completed:', details);
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
      console.log('Bulk adding label:', labelId, 'to forms:', formIds);
      const response = await api.patch('/forms/bulk/add-label', {
        formIds,
        labelId,
      });
      console.log('Bulk add label response:', response.data);
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
      console.log('Bulk removing label:', labelId, 'from forms:', formIds);
      const response = await api.patch('/forms/bulk/remove-label', {
        formIds,
        labelId,
      });
      console.log('Bulk remove label response:', response.data);
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
