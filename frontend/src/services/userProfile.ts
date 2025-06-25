import axios from 'axios';
import { apiConfig } from '@/config/api';

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

export interface UserProfile {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
  profile: {
    username: string;
    phoneNumber?: string;
    website?: string;
    avatar?: {
      src: string;
      publicId: string;
      uploadedAt: string;
    };
    plan: {
      type: 'STARTER' | 'BRONZE' | 'SILVER' | 'GOLD';
      formsLimit: number;
      formsUsed: number;
      canCreateForms: boolean;
      remainingForms: number;
    };
  };
  settings: {
    timezone: string;
    language: string;
    darkMode: boolean;
    notifications: {
      email: boolean;
      browser: boolean;
      mobile: boolean;
    };
    emailPreferences: {
      updates: boolean;
      marketing: boolean;
      newsletter: boolean;
    };
  };
  // Add account details with real IP
  accountDetails?: {
    lastIpAddress: string;
    lastSeenDate: string;
    creationDate: string;
    updateDate: string;
  };
}

export interface UserSettings {
  timezone: string;
  language: string;
  darkMode: boolean;
  notifications: {
    email: boolean;
    browser: boolean;
    mobile: boolean;
  };
  emailPreferences: {
    updates: boolean;
    marketing: boolean;
    newsletter: boolean;
  };
}

export interface ActivityLog {
  id: string;
  date: string;
  time: string;
  action: string;
  target: string;
  ipAddress?: string;
  timestamp: number;
}

export interface ActivityFilters {
  page?: number;
  limit?: number;
  targetType?: 'form' | 'submission' | 'account' | 'settings';
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const userProfileService = {
  upgradePlan: async (data: { plan: string; billing: string }) => {
    try {
      const response = await api.post('/payment/upgrade-plan', data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to upgrade plan'
      );
    }
  },

  // Get full user profile
  async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await api.get('/user/profile');
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch profile'
      );
    }
  },

  // Update basic user info (name, email)
  async updateBasicInfo(data: { name?: string; email?: string }) {
    try {
      const response = await api.put('/user/profile/basic', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update basic info:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to update profile'
      );
    }
  },

  // Update profile details
  async updateProfileDetails(data: {
    username?: string;
    phoneNumber?: string;
    website?: string;
  }) {
    try {
      const response = await api.put('/user/profile/details', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update profile details:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to update profile'
      );
    }
  },

  // Upload avatar
  async uploadAvatar(file: File) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/user/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to upload avatar:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to upload avatar'
      );
    }
  },

  // Delete avatar
  async deleteAvatar() {
    try {
      const response = await api.delete('/user/profile/avatar');
      return response.data;
    } catch (error: any) {
      console.error('Failed to delete avatar:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to delete avatar'
      );
    }
  },

  // Get user settings
  async getUserSettings(): Promise<UserSettings> {
    try {
      const response = await api.get('/user/settings');
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch settings'
      );
    }
  },

  // Update user settings
  async updateSettings(settings: Partial<UserSettings>) {
    try {
      const response = await api.put('/user/settings', settings);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update settings:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to update settings'
      );
    }
  },

  // Get activity logs with filtering
  async getActivityLogs(filters: ActivityFilters = {}) {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/user/activity?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch activity logs:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch activity logs'
      );
    }
  },

  // Get account stats
  async getAccountStats() {
    try {
      const response = await api.get('/user/stats');
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch account stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch stats');
    }
  },

  // Password reset request
  async requestPasswordReset(email: string) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      console.error('Failed to request password reset:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to send reset email'
      );
    }
  },

  // Verify password reset token
  async verifyPasswordResetToken(token: string, email: string) {
    try {
      const response = await api.get('/auth/verify-reset-token', {
        params: { token, email },
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to verify reset token:', error);
      throw new Error(
        error.response?.data?.message || 'Invalid or expired reset token'
      );
    }
  },

  // Reset password with token
  async resetPasswordWithToken(data: {
    token: string;
    email: string;
    new_password: string;
    confirm_password: string;
  }) {
    try {
      const response = await api.post('/auth/reset-password', data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to reset password:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to reset password'
      );
    }
  },
};

export default userProfileService;
