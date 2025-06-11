// src/services/passwordResetService.ts
import axios from 'axios';
import { apiConfig } from '@/config/api';

// Create axios instance
const api = axios.create({
  baseURL: apiConfig.url,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  email: string;
  new_password: string;
  confirm_password: string;
}

export interface VerifyTokenRequest {
  token: string;
  email: string;
}

export const passwordResetService = {
  // Request password reset
  async requestPasswordReset(data: ForgotPasswordRequest) {
    try {
      const response = await api.post('/auth/forgot-password', data);
      return response.data;
    } catch (error: any) {
      console.error('Password reset request error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to send password reset email'
      );
    }
  },

  // Verify reset token
  async verifyResetToken(data: VerifyTokenRequest) {
    try {
      const response = await api.get('/auth/verify-reset-token', {
        params: data,
      });
      return response.data;
    } catch (error: any) {
      console.error('Token verification error:', error);
      throw new Error(
        error.response?.data?.message || 'Invalid or expired reset token'
      );
    }
  },

  // Reset password
  async resetPassword(data: ResetPasswordRequest) {
    try {
      const response = await api.post('/auth/reset-password', data);
      return response.data;
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to reset password'
      );
    }
  },
};

export default passwordResetService;
