'use client';

import { User } from '@/types/redux';
import type { LoginRequest } from '@/types/auth/actions';
import type { StoreDispatch } from '@/redux/store';

import { createSlice } from '@reduxjs/toolkit';
import { toast } from 'sonner';
import { setCookie, deleteCookie } from 'cookies-next';

import { validateToken as ValidateToken } from '@/lib/auth/actions';
import { login, register, verifyOtp, logout } from '@/lib/auth/actions';
import { setAuthLoading } from '@/redux/slice/appSlice';

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
  async (dispatch: StoreDispatch): Promise<boolean> => {
    dispatch(setAuthLoading(true));
    try {
      const userObj = await login(formData);

      if (!userObj) {
        return false;
      }

      setCookie('token', userObj.token, {
        maxAge: 60 * 60 * 24 * 7,
        secure: true,
        httpOnly: false,
        sameSite: 'strict',
        path: '/',
      });

      localStorage.setItem('token', userObj.token);

      if (userObj.token) {
        toast.error(userObj.message);
        dispatch(toggleToken(userObj.token));
        dispatch(toggleUser(userObj.data.user));
        return true;
      }
    } catch (error) {
      toast.error('Error logging in');

      return false;
    } finally {
      dispatch(setAuthLoading(false));
    }
    return false;
  };

const logoutUser = () => async (dispatch: StoreDispatch) => {
  const token: string | null = localStorage.getItem('token');

  localStorage.removeItem('token');
  deleteCookie('token');

  dispatch(toggleToken(null));
  dispatch(toggleUser(null));
  dispatch(setAuthLoading(false));

  if (token) {
    await logout(token);
  }
};

const registerUser = formData => async (): Promise<LoginRequest | unknown> => {
  try {
    const userObj = await register(formData);

    if (!userObj) {
      return;
    }

    setCookie('opt_verification_pending', true, {
      maxAge: 60 * 60 * 24 * 7,
      secure: true,
      httpOnly: false,
      sameSite: 'strict',
      path: '/',
    });

    localStorage.setItem('user_id', userObj.user_id);
  } catch (error) {
    toast.error('Error registering');

    return error;
  }
};

const verifyOTP =
  (otp: string) => async (dispatch: StoreDispatch, getState) => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        toast.error('User ID not found');
        return;
      }

      const response = await verifyOtp(userId, otp);

      console.log('Response from verify OTP:', response);

      if (response) {
        const userObj = response as any;

        if (userObj?.token) {
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
        }

        return;
      }
    } catch (error) {
      toast.error('Error verifying OTP');

      return error;
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
