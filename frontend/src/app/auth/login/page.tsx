// src/app/auth/login/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import type { LoginRequest } from '@/types/auth/actions';
import { useDispatch, useSelector } from 'react-redux';
import type { StoreDispatch, RootState } from '@/redux/store';
import { logInUser } from '@/redux/slices/auth/userSlice';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { loginSchema } from '@/dependencies/zod';

export default function LoginPage() {
  const dispatch = useDispatch<StoreDispatch>();
  const isLoading = useSelector((state: RootState) => state.app.auth.isLoading);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Clear the OTP verification pending cookie
  useEffect(() => {
    document.cookie =
      'otp_verification_pending=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }, []);

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (formData: LoginRequest) => {
    // Include remember me value with the form data
    const loginData = {
      ...formData,
      rememberMe: rememberMe,
    };

    try {
      const result = await dispatch(logInUser(loginData));

      if (result.success) {
        router.push('/dashboard');
      } else if (result.requiresVerification) {
        router.push('/auth/verify');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 sm:p-6 md:p-10'>
      {/* Beautiful contained form */}
      <div className='w-full max-w-md mx-auto'>
        {/* Brand logo and name */}
        <div className='text-center mb-4'>
          <h1 className='text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text'>
            FormIQ
          </h1>
          <p className='text-gray-600 mt-0 text-lg font-medium'>
            Intelligent form management platform
          </p>
        </div>

        {/* Main card with subtle shadow and border */}
        <div className='bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100'>
          {/* Card header with beautiful gradient */}
          <div className='px-8 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white'>
            <h2 className='text-2xl font-semibold'>Welcome back</h2>
            <p className='text-indigo-100 mt-2 text-base leading-relaxed'>
              Sign in to your account to continue.
            </p>
          </div>

          {/* Form content with refined spacing */}
          <div className='p-8'>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              {/* Email Field with icon */}
              <div className='space-y-2.5'>
                <label
                  htmlFor='email'
                  className='block text-base font-medium text-gray-700 tracking-tight'
                >
                  Email address
                </label>
                <div className='relative rounded-md shadow-sm'>
                  <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                    <Mail className='h-5 w-5 text-indigo-500' />
                  </div>
                  <input
                    id='email'
                    type='email'
                    placeholder='you@example.com'
                    className={`block w-full pl-12 py-2 border ${
                      form.formState.errors.email
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 text-red-900 placeholder-red-300'
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors text-base bg-white`}
                    {...form.register('email')}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className='text-sm text-red-600 mt-2 font-medium flex items-center'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-4 w-4 mr-1.5'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                        clipRule='evenodd'
                      />
                    </svg>
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field with eye toggle icon */}
              <div className='space-y-2.5'>
                <div className='flex items-center justify-between'>
                  <label
                    htmlFor='password'
                    className='block text-base font-medium text-gray-700 tracking-tight'
                  >
                    Password
                  </label>
                  <Link
                    href='/auth/forgot-password'
                    className='text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors hover:underline'
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className='relative rounded-md shadow-sm'>
                  <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                    <Lock className='h-5 w-5 text-indigo-500' />
                  </div>
                  <input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='••••••••'
                    className={`block w-full pl-12 pr-12 py-2 border ${
                      form.formState.errors.password
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 text-red-900 placeholder-red-300'
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors text-base bg-white`}
                    {...form.register('password')}
                  />
                  {/* Password visibility toggle button */}
                  <div className='absolute inset-y-0 right-0 pr-3.5 flex items-center'>
                    <button
                      type='button'
                      className='text-indigo-500 hover:text-indigo-600 focus:outline-none transition-colors p-1.5 rounded-full hover:bg-indigo-50 cursor-pointer'
                      onClick={togglePasswordVisibility}
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className='h-5 w-5' />
                      ) : (
                        <Eye className='h-5 w-5' />
                      )}
                    </button>
                  </div>
                </div>
                {form.formState.errors.password && (
                  <p className='text-sm text-red-600 mt-2 font-medium flex items-center'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-4 w-4 mr-1.5'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                        clipRule='evenodd'
                      />
                    </svg>
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember me checkbox */}
              <div className='flex items-center pt-2'>
                <div
                  className={`h-5 w-5 flex items-center justify-center rounded border ${
                    rememberMe
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'border-gray-300 bg-white'
                  } cursor-pointer`}
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  {rememberMe && (
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-3.5 w-3.5 text-white'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                  )}
                </div>
                <label
                  className='ml-2.5 block text-sm text-gray-700 font-medium cursor-pointer'
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  Remember me for 30 days
                </label>
              </div>

              {/* Submit Button with beautiful gradient */}
              <button
                type='submit'
                disabled={isLoading}
                className={`w-full py-2 px-5 flex justify-center items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer focus:ring-indigo-500 text-base mt-6 ${
                  isLoading
                    ? 'opacity-90 cursor-not-allowed'
                    : 'hover:from-indigo-700 hover:to-purple-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className='h-5 w-5 mr-2 animate-spin' />
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Login to account'
                )}
              </button>
            </form>
          </div>

          {/* Card Footer with sign-up link */}
          <div className='px-4 py-4 bg-gray-50 border-t border-gray-100 text-center'>
            <p className='text-gray-600 text-base'>
              Don&apos;t have an account?{' '}
              <Link
                href='/auth/signup'
                className='font-medium text-indigo-600 hover:text-indigo-500 transition-colors hover:underline underline-offset-2'
              >
                Create a free account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer copyright text */}
        <div className='text-center mt-5'>
          <p className='text-sm text-gray-500'>
            © {new Date().getFullYear()} FormIQ. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
