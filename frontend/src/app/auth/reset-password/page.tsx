// src/app/auth/reset-password/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  resetPasswordSchema,
  type ResetPasswordRequest,
} from '@/dependencies/zod';
import { apiConfig } from '@/config/api';
import axios from 'axios';

interface TokenVerificationState {
  isValid: boolean;
  isLoading: boolean;
  email: string;
  name: string;
  error: string | null;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenState, setTokenState] = useState<TokenVerificationState>({
    isValid: false,
    isLoading: true,
    email: '',
    name: '',
    error: null,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordRequest>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('new_password');

  // Password strength validation
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: '', color: '' };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const strengthLevels = [
      { score: 0, label: 'Very Weak', color: 'bg-red-500' },
      { score: 1, label: 'Weak', color: 'bg-red-400' },
      { score: 2, label: 'Fair', color: 'bg-yellow-500' },
      { score: 3, label: 'Good', color: 'bg-yellow-400' },
      { score: 4, label: 'Strong', color: 'bg-green-500' },
      { score: 5, label: 'Very Strong', color: 'bg-green-600' },
    ];

    return strengthLevels[score] || strengthLevels[0];
  };

  const passwordStrength = getPasswordStrength(password || '');

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !email) {
        setTokenState({
          isValid: false,
          isLoading: false,
          email: '',
          name: '',
          error: 'Invalid reset link. Missing token or email.',
        });
        return;
      }

      try {
        const response = await axios.get(
          `${
            apiConfig.url
          }/auth/verify-reset-token?token=${token}&email=${encodeURIComponent(
            email
          )}`
        );

        if (response.data.success) {
          setTokenState({
            isValid: true,
            isLoading: false,
            email: response.data.data.email,
            name: response.data.data.name,
            error: null,
          });
        } else {
          throw new Error(response.data.message || 'Invalid reset link');
        }
      } catch (error: any) {
        setTokenState({
          isValid: false,
          isLoading: false,
          email: '',
          name: '',
          error:
            error.response?.data?.message || 'Invalid or expired reset link',
        });
      }
    };

    verifyToken();
  }, [token, email]);

  const onSubmit = async (data: ResetPasswordRequest) => {
    if (!token || !email) {
      toast.error('Invalid reset link');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${apiConfig.url}/auth/reset-password`,
        {
          token,
          email,
          new_password: data.new_password,
          confirm_password: data.confirm_password,
        }
      );

      if (response.data.success) {
        toast.success('Password reset successfully! Redirecting to login...');

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/auth/login?message=password-reset-success');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to reset password');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (tokenState.isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4'>
        <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-8'>
          <div className='flex items-center justify-center mb-6'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          </div>
          <p className='text-center text-gray-600'>Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenState.isValid) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4'>
        <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-8'>
          <div className='flex items-center justify-center mb-6'>
            <AlertCircle className='h-16 w-16 text-red-500' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 text-center mb-4'>
            Invalid Reset Link
          </h1>
          <p className='text-gray-600 text-center mb-6'>{tokenState.error}</p>
          <div className='space-y-4'>
            <button
              onClick={() => router.push('/auth/forgot-password')}
              className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors'
            >
              Request New Reset Link
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className='w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors'
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4'>
      <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-8'>
        <div className='flex items-center justify-center mb-6'>
          <div className='bg-blue-100 p-3 rounded-full'>
            <Lock className='h-8 w-8 text-blue-600' />
          </div>
        </div>

        <h1 className='text-2xl font-bold text-gray-900 text-center mb-2'>
          Reset Your Password
        </h1>
        <p className='text-gray-600 text-center mb-6'>
          Hello <strong>{tokenState.name}</strong>! Enter your new password
          below.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* New Password */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              New Password
            </label>
            <div className='relative'>
              <input
                {...register('new_password')}
                type={showPassword ? 'text' : 'password'}
                className='w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Enter your new password'
                disabled={isSubmitting}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600'
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className='h-5 w-5' />
                ) : (
                  <Eye className='h-5 w-5' />
                )}
              </button>
            </div>
            {errors.new_password && (
              <p className='text-red-500 text-sm mt-1'>
                {errors.new_password.message}
              </p>
            )}

            {/* Password Strength Indicator */}
            {password && (
              <div className='mt-2'>
                <div className='flex items-center justify-between mb-1'>
                  <span className='text-xs text-gray-500'>
                    Password Strength
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength.score >= 4
                        ? 'text-green-600'
                        : passwordStrength.score >= 2
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Confirm New Password
            </label>
            <div className='relative'>
              <input
                {...register('confirm_password')}
                type={showConfirmPassword ? 'text' : 'password'}
                className='w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Confirm your new password'
                disabled={isSubmitting}
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600'
                disabled={isSubmitting}
              >
                {showConfirmPassword ? (
                  <EyeOff className='h-5 w-5' />
                ) : (
                  <Eye className='h-5 w-5' />
                )}
              </button>
            </div>
            {errors.confirm_password && (
              <p className='text-red-500 text-sm mt-1'>
                {errors.confirm_password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
          >
            {isSubmitting ? (
              <>
                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
                Resetting Password...
              </>
            ) : (
              <>
                <CheckCircle className='h-5 w-5 mr-2' />
                Reset Password
              </>
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className='mt-6 text-center'>
          <button
            onClick={() => router.push('/auth/login')}
            className='text-blue-600 hover:text-blue-800 text-sm font-medium'
            disabled={isSubmitting}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
