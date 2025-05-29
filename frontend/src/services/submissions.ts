// src/services/submissions.ts
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

export interface Submission {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: string;
  status: 'pending' | 'processed' | 'failed';
  isRead: boolean;
  tags: string[];
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  metadata?: Record<string, any>;
}

export interface SubmissionStats {
  total: number;
  unread: number;
  pending: number;
  processed: number;
  failed: number;
}

export interface PaginationInfo {
  current: number;
  pages: number;
  total: number;
  limit: number;
}

export interface SubmissionsResponse {
  success: boolean;
  data: {
    submissions: Submission[];
    stats: SubmissionStats;
    pagination: PaginationInfo;
  };
}

export interface SubmissionFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  isRead?: string;
}

export const submissionsService = {
  // Get all submissions for a form
  async getSubmissions(
    formId: string,
    filters: SubmissionFilters = {}
  ): Promise<SubmissionsResponse> {
    try {
      const params = new URLSearchParams();

      // Add filters to params
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.search) params.append('search', filters.search);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.status) params.append('status', filters.status);
      if (filters.isRead) params.append('isRead', filters.isRead);

      const url = `/submissions/form/${formId}${
        params.toString() ? `?${params.toString()}` : ''
      }`;
      console.log('📡 Fetching submissions from:', url);

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching submissions:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch submissions'
      );
    }
  },

  // Get single submission
  async getSubmission(
    submissionId: string
  ): Promise<{ success: boolean; data: Submission }> {
    try {
      const response = await api.get(`/submissions/${submissionId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching submission:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch submission'
      );
    }
  },

  // Mark submission as read/unread
  async updateReadStatus(
    submissionId: string,
    isRead: boolean
  ): Promise<{ success: boolean; data: { isRead: boolean } }> {
    try {
      const response = await api.patch(`/submissions/${submissionId}/read`, {
        isRead,
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error updating read status:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to update read status'
      );
    }
  },

  // Update submission status
  async updateStatus(
    submissionId: string,
    status: string
  ): Promise<{ success: boolean; data: { status: string } }> {
    try {
      const response = await api.patch(`/submissions/${submissionId}/status`, {
        status,
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error updating status:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to update status'
      );
    }
  },

  // Add tag to submission
  async addTag(
    submissionId: string,
    tag: string
  ): Promise<{ success: boolean; data: { tags: string[] } }> {
    try {
      const response = await api.post(`/submissions/${submissionId}/tags`, {
        tag,
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error adding tag:', error);
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to add tag'
      );
    }
  },

  // Remove tag from submission
  async removeTag(
    submissionId: string,
    tag: string
  ): Promise<{ success: boolean; data: { tags: string[] } }> {
    try {
      const response = await api.delete(
        `/submissions/${submissionId}/tags/${encodeURIComponent(tag)}`
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Error removing tag:', error);
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to remove tag'
      );
    }
  },

  // Delete submission
  async deleteSubmission(
    submissionId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/submissions/${submissionId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error deleting submission:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to delete submission'
      );
    }
  },

  // Bulk operations
  async bulkUpdate(
    submissionIds: string[],
    action: string,
    value?: string
  ): Promise<{ success: boolean; message: string; modified: number }> {
    try {
      const response = await api.patch('/submissions/bulk', {
        submissionIds,
        action,
        value,
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error performing bulk update:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to perform bulk update'
      );
    }
  },

  // Export submissions as CSV
  async exportCSV(
    formId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      params.append('format', 'csv');
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await api.get(
        `/submissions/form/${formId}/export?${params.toString()}`,
        {
          responseType: 'blob',
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Error exporting CSV:', error);
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to export CSV'
      );
    }
  },

  // Export submissions as JSON
  async exportJSON(
    formId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      params.append('format', 'json');
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await api.get(
        `/submissions/form/${formId}/export?${params.toString()}`,
        {
          responseType: 'blob',
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Error exporting JSON:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to export JSON'
      );
    }
  },
};
