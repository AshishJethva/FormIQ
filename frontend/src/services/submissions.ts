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
  files?: Record<string, any>;
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
  filesCount?: number;
  totalFileSize?: number;
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
  hasFiles?: boolean;
}

export interface FileOperationResult {
  success: boolean;
  message: string;
  fileCount?: number;
}

export interface BulkFileOperation {
  submissionIds: string[];
  action: 'delete' | 'download' | 'archive';
  fieldIds?: string[];
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
      if (filters.hasFiles !== undefined)
        params.append('hasFiles', filters.hasFiles.toString());

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
    submissionId: string,
    includeFiles = true
  ): Promise<{ success: boolean; data: Submission }> {
    try {
      const params = includeFiles ? '?includeFiles=true' : '';
      const response = await api.get(`/submissions/${submissionId}${params}`);
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
    submissionId: string,
    deleteFiles = true
  ): Promise<{ success: boolean; message: string }> {
    try {
      const params = deleteFiles ? '?deleteFiles=true' : '';
      const response = await api.delete(
        `/submissions/${submissionId}${params}`
      );
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

  // Delete specific file from submission
  async deleteFileFromSubmission(
    submissionId: string,
    fieldId: string,
    filePublicId: string
  ): Promise<FileOperationResult> {
    try {
      console.log('🗑️ Deleting file from submission:', {
        submissionId,
        fieldId,
        filePublicId,
      });

      const response = await api.delete(
        `/submissions/${submissionId}/files/${fieldId}/${encodeURIComponent(
          filePublicId
        )}`
      );

      console.log('✅ File deleted from submission successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error deleting file from submission:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to delete file from submission'
      );
    }
  },

  // Get files from submission
  async getSubmissionFiles(submissionId: string): Promise<{
    success: boolean;
    data: {
      files: Record<string, any>;
      totalFiles: number;
      totalSize: number;
    };
  }> {
    try {
      console.log('📁 Getting files from submission:', submissionId);

      const response = await api.get(`/submissions/${submissionId}/files`);

      console.log('✅ Submission files retrieved successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error getting submission files:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to get submission files'
      );
    }
  },

  // Download all files from submission as ZIP
  async downloadSubmissionFiles(
    submissionId: string,
    fieldIds?: string[]
  ): Promise<Blob> {
    try {
      console.log('📥 Downloading submission files as ZIP:', {
        submissionId,
        fieldIds,
      });

      const params = new URLSearchParams();
      if (fieldIds && fieldIds.length > 0) {
        fieldIds.forEach(fieldId => params.append('fieldIds', fieldId));
      }

      const response = await api.get(
        `/submissions/${submissionId}/files/download${
          params.toString() ? `?${params.toString()}` : ''
        }`,
        {
          responseType: 'blob',
        }
      );

      console.log('✅ Submission files ZIP downloaded successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error downloading submission files:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to download submission files'
      );
    }
  },

  // Bulk file operations
  async bulkFileOperation(operation: BulkFileOperation): Promise<{
    success: boolean;
    message: string;
    results: Array<{
      submissionId: string;
      success: boolean;
      error?: string;
      fileCount?: number;
    }>;
  }> {
    try {
      console.log('🔄 Performing bulk file operation:', operation);

      const response = await api.post('/submissions/files/bulk', operation);

      console.log('✅ Bulk file operation completed successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error performing bulk file operation:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to perform bulk file operation'
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
    dateTo?: string,
    includeFiles = true,
    additionalFilters?: {
      status?: string;
      isRead?: string;
      search?: string;
    }
  ): Promise<Blob> {
    try {
      console.log('📊 Starting CSV export request:', {
        formId,
        dateFrom,
        dateTo,
        includeFiles,
        additionalFilters,
      });

      const params = new URLSearchParams();
      params.append('format', 'csv');

      // Date filters
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      // File inclusion
      if (includeFiles) params.append('includeFiles', 'true');

      // Additional filters
      if (additionalFilters?.status && additionalFilters.status !== 'all') {
        params.append('status', additionalFilters.status);
      }
      if (additionalFilters?.isRead && additionalFilters.isRead !== 'all') {
        params.append('isRead', additionalFilters.isRead);
      }
      if (additionalFilters?.search) {
        params.append('search', additionalFilters.search);
      }

      const exportUrl = `/submissions/form/${formId}/export?${params.toString()}`;
      console.log('📡 Making CSV export request to:', exportUrl);

      const response = await api.get(exportUrl, {
        responseType: 'blob',
        timeout: 60000, // 60 second timeout for large exports
        headers: {
          Accept: 'text/csv',
        },
      });

      console.log('✅ CSV export response received:', {
        size: response.data.size,
        type: response.data.type,
        headers: response.headers,
      });

      // Validate response
      if (!response.data || response.data.size === 0) {
        throw new Error('Empty CSV file received');
      }

      // Check if it's actually a CSV file
      if (
        response.data.type &&
        !response.data.type.includes('csv') &&
        !response.data.type.includes('text')
      ) {
        console.warn('⚠️ Unexpected content type:', response.data.type);
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ Error exporting CSV:', error);

      // Enhanced error handling
      if (error.response?.status === 404) {
        throw new Error('Form not found or you do not have access to it');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to export this form');
      } else if (error.response?.status === 429) {
        throw new Error(
          'Too many export requests. Please try again in a few minutes'
        );
      } else if (error.response?.status === 413) {
        throw new Error(
          'Export file too large. Try filtering your data or contact support'
        );
      } else if (error.response?.status === 500) {
        throw new Error(
          'Server error occurred while generating export. Please try again'
        );
      } else if (
        error.code === 'ECONNABORTED' ||
        error.message.includes('timeout')
      ) {
        throw new Error(
          'Export timeout. The file might be too large - try filtering your data'
        );
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(`Export failed: ${error.message}`);
      } else {
        throw new Error('Failed to export CSV. Please try again');
      }
    }
  },

  // Enhanced export with custom filters
  async exportCSVWithFilters(
    formId: string,
    filters: {
      dateFrom?: string;
      dateTo?: string;
      status?: string;
      isRead?: string;
      search?: string;
      includeFiles?: boolean;
    } = {}
  ): Promise<Blob> {
    return this.exportCSV(
      formId,
      filters.dateFrom,
      filters.dateTo,
      filters.includeFiles !== false, // Default to true
      {
        status: filters.status,
        isRead: filters.isRead,
        search: filters.search,
      }
    );
  },

  // Get export preview (first few rows)
  async getExportPreview(
    formId: string,
    limit: number = 5
  ): Promise<{
    success: boolean;
    data: {
      headers: string[];
      rows: string[][];
      totalSubmissions: number;
      previewCount: number;
    };
  }> {
    try {
      console.log('👀 Getting export preview for form:', formId);

      const response = await api.get(
        `/submissions/form/${formId}/export-preview`,
        {
          params: { limit },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Error getting export preview:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to get export preview'
      );
    }
  },

  // Get export statistics
  async getExportStats(formId: string): Promise<{
    success: boolean;
    data: {
      totalSubmissions: number;
      totalFiles: number;
      totalFileSize: number;
      estimatedCsvSize: string;
      fieldCount: number;
      fieldLabels: Record<string, string>;
    };
  }> {
    try {
      console.log('📊 Getting export statistics for form:', formId);

      const response = await api.get(
        `/submissions/form/${formId}/export-stats`
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Error getting export stats:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to get export statistics'
      );
    }
  },

  // Validate export parameters before actual export
  async validateExportRequest(
    formId: string,
    filters: Record<string, any> = {}
  ): Promise<{
    success: boolean;
    data: {
      isValid: boolean;
      estimatedRows: number;
      estimatedSize: string;
      warnings: string[];
      errors: string[];
    };
  }> {
    try {
      console.log('✅ Validating export request for form:', formId);

      const response = await api.post(
        `/submissions/form/${formId}/validate-export`,
        {
          filters,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Error validating export request:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to validate export request'
      );
    }
  },

  // Get submission analytics including file statistics
  async getSubmissionAnalytics(
    formId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<{
    success: boolean;
    data: {
      totalSubmissions: number;
      submissionsWithFiles: number;
      totalFiles: number;
      totalFileSize: number;
      averageFilesPerSubmission: number;
      fileTypeBreakdown: Record<string, number>;
      submissionsTrend: Array<{
        date: string;
        count: number;
        filesCount: number;
      }>;
    };
  }> {
    try {
      console.log('📊 Getting submission analytics for form:', formId);

      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await api.get(
        `/submissions/form/${formId}/analytics${
          params.toString() ? `?${params.toString()}` : ''
        }`
      );

      console.log('✅ Submission analytics retrieved successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error getting submission analytics:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to get submission analytics'
      );
    }
  },

  // Search submissions by file content (if supported)
  async searchFileContent(
    formId: string,
    searchQuery: string,
    fileTypes?: string[]
  ): Promise<{
    success: boolean;
    data: {
      submissions: Submission[];
      totalMatches: number;
      searchQuery: string;
    };
  }> {
    try {
      console.log('🔍 Searching file content:', {
        formId,
        searchQuery,
        fileTypes,
      });

      const params = new URLSearchParams();
      params.append('q', searchQuery);
      if (fileTypes && fileTypes.length > 0) {
        fileTypes.forEach(type => params.append('fileTypes', type));
      }

      const response = await api.get(
        `/submissions/form/${formId}/search/files?${params.toString()}`
      );

      console.log('✅ File content search completed successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error searching file content:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to search file content'
      );
    }
  },

  // Generate file access logs
  async getFileAccessLogs(
    submissionId: string,
    filePublicId?: string
  ): Promise<{
    success: boolean;
    data: {
      logs: Array<{
        timestamp: string;
        action: 'view' | 'download' | 'delete';
        userId?: string;
        userEmail?: string;
        ipAddress?: string;
        filePublicId?: string;
        fileName?: string;
      }>;
      totalAccess: number;
    };
  }> {
    try {
      console.log('📋 Getting file access logs:', {
        submissionId,
        filePublicId,
      });

      const params = new URLSearchParams();
      if (filePublicId) params.append('filePublicId', filePublicId);

      const response = await api.get(
        `/submissions/${submissionId}/files/logs${
          params.toString() ? `?${params.toString()}` : ''
        }`
      );

      console.log('✅ File access logs retrieved successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error getting file access logs:', error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to get file access logs'
      );
    }
  },
};
