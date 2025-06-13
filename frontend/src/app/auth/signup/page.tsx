// src/app/auth/signup/page.tsx

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import type { RegistrationRequest } from '@/types/auth/actions';
import { useDispatch, useSelector } from 'react-redux';
import type { StoreDispatch, RootState } from '@/redux/store';
import { registerUser } from '@/redux/slices/auth/userSlice';
import { Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signupSchema } from '@/dependencies/zod';

export default function SignupPage() {
  const dispatch = useDispatch<StoreDispatch>();
  const router = useRouter();
  const isLoading = useSelector((state: RootState) => state.app.auth.isLoading);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const form = useForm<RegistrationRequest>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (formData: RegistrationRequest) => {
    if (!termsAccepted) {
      // Show error for terms
      return;
    }

    try {
      const result = await dispatch(registerUser(formData));

      if (!result || !('error' in result) || !result.error) {
        router.push('/auth/verify');
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
            <h2 className='text-2xl font-semibold'>Create your account</h2>
            <p className='text-indigo-100 mt-1 text-base leading-relaxed'>
              Sign up to access all features and functionalities.
            </p>
          </div>

          {/* Form content with refined spacing */}
          <div className='p-8'>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              {/* Name field with icon */}
              <div className='space-y-2'>
                <label
                  htmlFor='name'
                  className='block text-base font-medium text-gray-700 tracking-tight'
                >
                  Full Name
                </label>
                <div className='relative rounded-md shadow-sm'>
                  <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                    <User className='h-5 w-5 text-indigo-500' />
                  </div>
                  <input
                    id='name'
                    type='text'
                    placeholder='John Doe'
                    className={`block w-full pl-12 py-2 border ${
                      form.formState.errors.name
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 text-red-900 placeholder-red-300'
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors text-base bg-white`}
                    {...form.register('name')}
                  />
                </div>
                {form.formState.errors.name && (
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
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Email Field with icon */}
              <div className='space-y-2'>
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
              <div className='space-y-2'>
                <label
                  htmlFor='password'
                  className='block text-base font-medium text-gray-700 tracking-tight'
                >
                  Password
                </label>
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

              {/* Confirm Password Field with eye toggle icon */}
              <div className='space-y-2'>
                <label
                  htmlFor='passwordConfirm'
                  className='block text-base font-medium text-gray-700 tracking-tight'
                >
                  Confirm Password
                </label>
                <div className='relative rounded-md shadow-sm'>
                  <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                    <Lock className='h-5 w-5 text-indigo-500' />
                  </div>
                  <input
                    id='passwordConfirm'
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder='••••••••'
                    className={`block w-full pl-12 pr-12 py-2 border ${
                      form.formState.errors.passwordConfirm
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 text-red-900 placeholder-red-300'
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors text-base bg-white`}
                    {...form.register('passwordConfirm')}
                  />
                  {/* Password visibility toggle button */}
                  <div className='absolute inset-y-0 right-0 pr-3.5 flex items-center'>
                    <button
                      type='button'
                      className='text-indigo-500 hover:text-indigo-600 focus:outline-none transition-colors p-1.5 rounded-full hover:bg-indigo-50 cursor-pointer'
                      onClick={toggleConfirmPasswordVisibility}
                      aria-label={
                        showConfirmPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className='h-5 w-5' />
                      ) : (
                        <Eye className='h-5 w-5' />
                      )}
                    </button>
                  </div>
                </div>
                {form.formState.errors.passwordConfirm && (
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
                    {form.formState.errors.passwordConfirm.message}
                  </p>
                )}
              </div>

              {/* Terms and Conditions checkbox */}
              <div className='flex pt-2'>
                <div
                  className={`h-5 w-5 flex items-center justify-center rounded border ${
                    termsAccepted
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'border-gray-300 bg-white'
                  } cursor-pointer`}
                  onClick={() => setTermsAccepted(!termsAccepted)}
                >
                  {termsAccepted && (
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
                  className='ml-2.5 block text-sm text-gray-700 cursor-pointer'
                  onClick={() => setTermsAccepted(!termsAccepted)}
                >
                  I agree to the{' '}
                  <Link
                    href='/terms'
                    className='text-indigo-600 hover:text-indigo-500 hover:underline underline-offset-2 font-medium'
                    onClick={e => e.stopPropagation()}
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    href='/privacy'
                    className='text-indigo-600 hover:text-indigo-500 hover:underline underline-offset-2 font-medium'
                    onClick={e => e.stopPropagation()}
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit Button with beautiful gradient */}
              <button
                type='submit'
                disabled={isLoading || !termsAccepted}
                className={`w-full py-2 px-5 flex justify-center items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg cursor-pointer shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-base mt-4 ${
                  isLoading || !termsAccepted
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:from-indigo-700 hover:to-purple-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className='h-5 w-5 mr-2 animate-spin' />
                    <span>Creating account...</span>
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>
          </div>

          {/* Card Footer with login link */}
          <div className='px-8 py-2 bg-gray-50 border-t border-gray-100 text-center'>
            <p className='text-gray-600 text-base'>
              Already have an account?{' '}
              <Link
                href='/auth/login'
                className='font-medium text-indigo-600 hover:text-indigo-500 transition-colors hover:underline underline-offset-2'
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer copyright text */}
        <div className='text-center mt-4'>
          <p className='text-sm text-gray-500'>
            © {new Date().getFullYear()} FormIQ. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
