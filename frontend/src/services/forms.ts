// services/forms.ts - Updated with backend filtering
import axios from 'axios';
import { apiConfig } from '@/config/api';
import type { SortOption } from '@/components/dashboard/FilterBar';

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
      return { sortBy: 'updatedAt', sortOrder: 'desc' }; // Backend doesn't have lastSubmission field
    case 'submission-count':
      return { sortBy: 'submissions', sortOrder: 'desc' };
    case 'unread':
      return { sortBy: 'updatedAt', sortOrder: 'desc' }; // Backend doesn't track unread
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

    const params = {
      search: filters.search,
      labels: filters.labels,
      status: filters.status,
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

    const response = await api.get('/forms', { params });
    return response.data;
  },

  // ... other methods remain the same
  async getForm(id: string) {
    const response = await api.get(`/forms/${id}`);
    return response.data;
  },

  async createForm(data: CreateFormData) {
    const response = await api.post('/forms', data);
    return response.data;
  },

  async updateForm(id: string, data: any) {
    const response = await api.put(`/forms/${id}`, data);
    return response.data;
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
    const response = await api.delete(`/forms/${id}`);
    return response.data;
  },

  async bulkAction(formIds: string[], action: string) {
    const response = await api.patch('/forms/bulk', { formIds, action });
    return response.data;
  },

  async bulkAddLabel(formIds: string[], labelId: string) {
    const response = await api.patch('/forms/bulk/add-label', {
      formIds,
      labelId,
    });
    return response.data;
  },

  async bulkRemoveLabel(formIds: string[], labelId: string) {
    const response = await api.patch('/forms/bulk/remove-label', {
      formIds,
      labelId,
    });
    return response.data;
  },
};
