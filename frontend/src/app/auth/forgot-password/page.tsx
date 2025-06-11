// src/app/auth/forgot-password/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, CheckCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { emailSchema, type EmailRequest } from '@/dependencies/zod';
import { apiConfig } from '@/config/api';
import axios from 'axios';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  // Override any auth-based redirects for this specific page
  useEffect(() => {
    // This page should be accessible regardless of authentication status
    // The usePasswordResetAccess hook handles the technical implementation
    console.log('Forgot password page loaded - auth redirects disabled');
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmailRequest>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: EmailRequest) => {
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${apiConfig.url}/auth/forgot-password`,
        {
          email: data.email,
        }
      );

      if (response.data.success) {
        setSubmittedEmail(data.email);
        setEmailSent(true);
        toast.success('Password reset link sent to your email!');
        reset();
      } else {
        throw new Error(response.data.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to send reset email'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (!submittedEmail) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${apiConfig.url}/auth/forgot-password`,
        {
          email: submittedEmail,
        }
      );

      if (response.data.success) {
        toast.success('Password reset link has been resent!');
      } else {
        throw new Error(response.data.message || 'Failed to resend email');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToForm = () => {
    setEmailSent(false);
    setSubmittedEmail('');
  };

  if (emailSent) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4'>
        <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-8'>
          <div className='flex items-center justify-center mb-6'>
            <div className='bg-green-100 p-3 rounded-full'>
              <CheckCircle className='h-12 w-12 text-green-600' />
            </div>
          </div>

          <h1 className='text-2xl font-bold text-gray-900 text-center mb-4'>
            Check Your Email
          </h1>

          <div className='text-center mb-6'>
            <p className='text-gray-600 mb-2'>
              We&apos;ve sent a password reset link to:
            </p>
            <p className='font-semibold text-gray-900 bg-gray-50 py-2 px-4 rounded-lg'>
              {submittedEmail}
            </p>
          </div>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
            <h3 className='font-medium text-blue-900 mb-2'>
              What&apos;s next?
            </h3>
            <ul className='text-sm text-blue-800 space-y-1'>
              <li>• Check your email inbox (and spam folder)</li>
              <li>• Click the reset link in the email</li>
              <li>• Create your new password</li>
              <li>• The link will expire in 1 hour</li>
            </ul>
          </div>

          <div className='space-y-4'>
            <button
              onClick={handleResendEmail}
              disabled={isSubmitting}
              className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
            >
              {isSubmitting ? (
                <>
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className='h-5 w-5 mr-2' />
                  Resend Email
                </>
              )}
            </button>

            <button
              onClick={handleBackToForm}
              className='w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center'
              disabled={isSubmitting}
            >
              <ArrowLeft className='h-5 w-5 mr-2' />
              Try Different Email
            </button>

            <button
              onClick={() => router.push('/auth/login')}
              className='w-full text-blue-600 hover:text-blue-800 font-medium py-2 transition-colors'
              disabled={isSubmitting}
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
            <Mail className='h-8 w-8 text-blue-600' />
          </div>
        </div>

        <h1 className='text-2xl font-bold text-gray-900 text-center mb-2'>
          Forgot Password?
        </h1>
        <p className='text-gray-600 text-center mb-8'>
          No worries! Enter your email address and we&apos;ll send you a link to
          reset your password.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Email Address
            </label>
            <div className='relative'>
              <input
                {...register('email')}
                type='email'
                className='w-full px-3 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Enter your email address'
                disabled={isSubmitting}
              />
              <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
            </div>
            {errors.email && (
              <p className='text-red-500 text-sm mt-1'>
                {errors.email.message}
              </p>
            )}
          </div>

          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
          >
            {isSubmitting ? (
              <>
                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
                Sending Reset Link...
              </>
            ) : (
              <>
                <Send className='h-5 w-5 mr-2' />
                Send Reset Link
              </>
            )}
          </button>
        </form>

        <div className='mt-6 text-center'>
          <button
            onClick={() => router.push('/auth/login')}
            className='text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center mx-auto'
            disabled={isSubmitting}
          >
            <ArrowLeft className='h-4 w-4 mr-1' />
            Back to Login
          </button>
        </div>

        {/* Additional Help */}
        <div className='mt-8 p-4 bg-gray-50 rounded-lg'>
          <h3 className='font-medium text-gray-900 mb-2 text-sm'>Need help?</h3>
          <ul className='text-xs text-gray-600 space-y-1'>
            <li>
              • Make sure you&apos;re using the email address associated with
              your account
            </li>
            <li>
              • Check your spam/junk folder if you don&apos;t see the email
            </li>
            <li>• The reset link will expire after 1 hour for security</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
