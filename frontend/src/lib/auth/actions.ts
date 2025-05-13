'use server';

import type {
  LoginRequest,
  LoginResponse,
  RegistrationRequest,
} from '@/types/auth/actions';

import axios from 'axios';

import { apiConfig } from '@/config/api';

export const register = async (
  formData: RegistrationRequest
): Promise<LoginResponse | any> => {
  try {
    const response = await axios.post<LoginResponse>(
      `${apiConfig.url}/auth/signup/`,
      formData
    );

    return response.data;
  } catch (error: any) {
    return { error: error.response?.data?.message || 'Registration failed' };
  }
};

export const login = async (
  credentials: LoginRequest
): Promise<LoginResponse | any> => {
  try {
    const response = await axios.post<LoginResponse>(
      `${apiConfig.url}/auth/login/`,
      credentials
    );

    if (response.status === 200) {
      return response.data;
    }

    return { error: 'Invalid credentials' };
  } catch (error: any) {
    // Check if this is a verification required error
    if (
      error.response?.status === 401 &&
      error.response?.data?.requiresVerification
    ) {
      return {
        requiresVerification: true,
        user_id: error.response.data.user_id,
        error: error.response.data.message,
      };
    }

    // Check for the specific "user not found" error
    if (
      error.response?.status === 404 ||
      error.response?.data?.message === 'User not found with this email'
    ) {
      return {
        notRegistered: true,
        error: 'This email is not registered. Please sign up first.',
      };
    }

    // Handle other errors
    return { error: error.response?.data?.message || 'Login failed' };
  }
};

export const verifyOtp = async (
  user_id: string,
  otp: string
): Promise<LoginResponse | boolean> => {
  try {
    const response = await axios.post(`${apiConfig.url}/auth/verify_account/`, {
      otp: otp,
      user_id: user_id,
    });

    console.log('Response: function', response);

    if (response.status === 200) {
      return response.data;
    }

    return false;
  } catch {
    return false;
  }
};

export const validateToken = async (token: string): Promise<string | any> => {
  try {
    const response = await axios.post(`${apiConfig.url}/auth/refresh/`, {
      token: token,
    });

    if (response.status === 200) {
      return response.data.token as string;
    }

    return null;
  } catch {
    return null;
  }
};

export const logout = async (token: string): Promise<void> => {
  try {
    await axios.post(`${apiConfig.url}/auth/logout/`, {
      token: token,
    });
  } catch {
    return;
  }
};
