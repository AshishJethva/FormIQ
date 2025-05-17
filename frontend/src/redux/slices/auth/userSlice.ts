'use client';

import { User } from '@/types/redux';
import type { LoginRequest, RegistrationRequest } from '@/types/auth/actions';
import type { StoreDispatch } from '@/redux/store';

import { createSlice } from '@reduxjs/toolkit';
import { toast } from 'sonner';
import { setCookie, deleteCookie } from 'cookies-next';

import { validateToken as ValidateToken } from '@/lib/auth/actions';
import { login, register, verifyOtp, logout } from '@/lib/auth/actions';
import { setAuthLoading } from '@/redux/slices/appSlice';

const initialState: User = {
  token: null,
  user: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState: initialState,
  reducers: {
    toggleToken: (state, action) => {
      state.token = action.payload;
    },
    toggleUser: (state, action) => {
      state.user = action.payload;
    },
  },
});

const { toggleToken, toggleUser } = userSlice.actions;

const validateToken = (token: string) => async (dispatch: StoreDispatch) => {
  try {
    const new_token = await ValidateToken(token);

    if (new_token === token) {
      return;
    }

    dispatch(toggleToken(new_token));
  } catch (error) {
    return error;
  }
};

const logInUser =
  (formData: LoginRequest) =>
  async (
    dispatch: StoreDispatch
  ): Promise<{
    success: boolean;
    requiresVerification?: boolean;
    notRegistered?: boolean;
    error?: string;
  }> => {
    dispatch(setAuthLoading(true));
    try {
      const userObj = await login(formData);

      // Check if user needs verification
      if (userObj.requiresVerification) {
        toast.info('Your account needs verification');

        // Store user ID for verification
        localStorage.setItem('user_id', userObj.user_id);

        // Set cookie for middleware to redirect
        setCookie('otp_verification_pending', true, {
          maxAge: 60 * 60 * 24 * 7,
          secure: true,
          httpOnly: false,
          sameSite: 'strict',
          path: '/',
        });

        dispatch(setAuthLoading(false));
        return { success: false, requiresVerification: true };
      }

      // Add the check for unregistered email here
      if (userObj.notRegistered) {
        toast.error(
          userObj.error || 'Email not registered. Please sign up first.'
        );
        dispatch(setAuthLoading(false));
        return { success: false, error: userObj.error, notRegistered: true };
      }

      if (userObj.error) {
        toast.error(userObj.error);
        dispatch(setAuthLoading(false));
        return { success: false, error: userObj.error };
      }

      setCookie('token', userObj.token, {
        maxAge: 60 * 60 * 24 * 7,
        secure: true,
        httpOnly: false,
        sameSite: 'strict',
        path: '/',
      });

      localStorage.setItem('token', userObj.token);

      if (typeof userObj !== 'boolean') {
        dispatch(toggleToken(userObj.token));
        dispatch(toggleUser(userObj.data.user));
        toast.success('Logged in successfully.');
        dispatch(setAuthLoading(false));
        return { success: true };
      }

      dispatch(setAuthLoading(false));
      return { success: false };
    } catch (error: any) {
      toast.error(error.message || 'Login failed.');
      dispatch(setAuthLoading(false));
      return { success: false, error: error.message || 'Login failed' };
    }
  };

// Relevant part from userSlice.ts
const logoutUser = () => async (dispatch: StoreDispatch) => {
  const token: string | null = localStorage.getItem('token');

  try {
    // First, attempt to call the logout API
    if (token) {
      await logout(token);
    }
  } catch (error) {
    console.error('Logout API error:', error);
    // Continue with local logout regardless of API errors
  } finally {
    // Always perform local logout actions even if API call fails
    localStorage.removeItem('token');
    deleteCookie('token');

    // Clear any other auth-related items from localStorage
    localStorage.removeItem('user_id');
    deleteCookie('otp_verification_pending');

    // Clear user state in Redux
    dispatch(toggleToken(null));
    dispatch(toggleUser(null));
    dispatch(setAuthLoading(false));
  }
};

const registerUser =
  (formData: RegistrationRequest) =>
  async (dispatch: StoreDispatch): Promise<{ error?: string }> => {
    dispatch(setAuthLoading(true));
    try {
      const userObj = await register(formData);

      if (userObj.error) {
        toast.error(userObj.error);
        // Set loading state to false before returning error
        dispatch(setAuthLoading(false));
        return { error: userObj.error };
      }

      setCookie('otp_verification_pending', true, {
        maxAge: 60 * 60 * 24 * 7,
        secure: true,
        httpOnly: false,
        sameSite: 'strict',
        path: '/',
      });

      localStorage.setItem('user_id', userObj.user_id);

      // Set loading state to false before returning success
      dispatch(setAuthLoading(false));
      return {};
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');

      // Set loading state to false before returning error
      dispatch(setAuthLoading(false));
      return { error: error.message || 'Registration failed' };
    }
  };

const verifyOTP = (otp: string) => async (dispatch: StoreDispatch) => {
  try {
    dispatch(setAuthLoading(true));

    const userId = localStorage.getItem('user_id') as string;
    if (!userId) {
      toast.error('User ID not found');
      dispatch(setAuthLoading(false));
      return { success: false, error: 'User ID not found' };
    }

    const response = await verifyOtp(userId, otp);

    if (response && typeof response !== 'boolean') {
      const userObj = response;

      setCookie('token', userObj.token, {
        maxAge: 60 * 60 * 24 * 7,
        secure: true,
        httpOnly: false,
        sameSite: 'strict',
      });
      deleteCookie('otp_verification_pending');
      localStorage.removeItem('user_id');
      localStorage.setItem('token', userObj.token);

      dispatch(toggleToken(userObj.token));
      dispatch(toggleUser(userObj.user));

      toast.success('Account verified successfully');
      dispatch(setAuthLoading(false));
      return { success: true };
    } else {
      // Handle invalid OTP case
      toast.error('Invalid OTP. Please try again.');
      dispatch(setAuthLoading(false));
      return { success: false, error: 'Invalid OTP' };
    }
  } catch (error: any) {
    // Capture specific error message if available
    const errorMessage = error.response?.data?.message || 'Error verifying OTP';
    toast.error(errorMessage);
    dispatch(setAuthLoading(false));
    return { success: false, error: errorMessage };
  }
};

export {
  logInUser,
  logoutUser,
  validateToken,
  registerUser,
  toggleToken,
  toggleUser,
  verifyOTP,
};
export default userSlice.reducer;
