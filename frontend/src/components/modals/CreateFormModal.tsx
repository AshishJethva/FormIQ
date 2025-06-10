// src/modals/CreateFormModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { createFormAsync } from '@/redux/slices/dashboard/formsSlice';
import { StoreDispatch } from '@/redux/store';
import { fetchUserProfile } from '@/redux/slices/userProfileSlice';

export default function CreateFormModal() {
  const router = useRouter();
  const dispatch: StoreDispatch = useDispatch();

  const [isCreating, setIsCreating] = useState(false);

  // Handle back/close actions
  const handleClose = () => {
    router.push('/dashboard');
  };

  // Generate unique form name with timestamp
  const generateUniqueFormName = () => {
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `Form - ${timestamp}`;
  };

  // Handle form creation and redirect to form builder
  const handleStartFromScratch = async () => {
    setIsCreating(true);

    try {
      // Generate a unique form name with timestamp
      const uniqueName = generateUniqueFormName();

      // Create form via Redux action
      const result = await dispatch(
        createFormAsync({
          name: uniqueName,
          description: '',
        })
      ).unwrap();
      await dispatch(fetchUserProfile());

      // Get the form ID from the result
      const formId = result.id;

      toast.success('Form created successfully');

      // Redirect to form builder with the new form ID
      router.push(`/build/${formId}`);
    } catch (error: any) {
      console.error('Failed to create form:', error);
      toast.error('Failed to create form', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Navigate to AI form builder
  const handleAIFormGenerator = () => {
    router.push('/ai/form-builder/');
  };

  // Navigate to templates page
  const handleUseTemplate = () => {
    router.push('/templates/form');
  };

  return (
    <div className='fixed inset-0 bg-[#F3F3FE] overflow-auto z-50'>
      <div className='min-h-screen flex flex-col'>
        {/* Header with back and close buttons */}
        <div className='p-4 flex items-center'>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className='flex items-center cursor-pointer text-black font-medium hover:text-gray-900 transition-colors ml-6 mt-6 px-2.5 py-2 rounded-full bg-[#DADEF3] shadow-sm'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='20'
              height='20'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='mr-2'
            >
              <path d='M19 12H5M12 19l-7-7 7-7' />
            </svg>
            Back
          </button>

          <div className='flex-grow'></div>

          <button
            onClick={handleClose}
            disabled={isCreating}
            className='p-2 mr-6 mt-6 rounded-full bg-[#6C73A8] transition-colors cursor-pointer'
            aria-label='Close'
          >
            <X size={24} className='text-white' />
          </button>
        </div>

        {/* Main content */}
        <div className='flex-grow flex flex-col items-center justify-center px-4 pb-55 pt-6'>
          <div className='text-center mb-11'>
            <h1 className='text-3xl font-semibold text-[#102035] mb-4'>
              Create a Form
            </h1>
            <p className='text-gray-700 max-w-2xl mx-auto text-lg'>
              Start collecting data with powerful forms that use conditional
              logic, <br />
              accept payments, generate reports, and automate workflows.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-3xl'>
            {/* Start from scratch card */}
            <div onClick={isCreating ? undefined : handleStartFromScratch}>
              <div
                className={`bg-white rounded-lg shadow-md hover:shadow-xl hover:border-blue-500 transition-shadow border border-gray-200 overflow-hidden flex flex-col h-full ${
                  isCreating
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                <div className='bg-[#E6EAFF] p-12 flex items-center justify-center'>
                  {isCreating ? (
                    <Loader2 className='w-12 h-12 text-[#4F6AF5] animate-spin' />
                  ) : (
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='48'
                      height='48'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='#4F6AF5'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <path d='M12 5v14M5 12h14' />
                    </svg>
                  )}
                </div>
                <div className='p-5 flex flex-col flex-grow'>
                  <h2 className='text-xl font-semibold text-center text-[#102035] mb-2'>
                    {isCreating ? 'Creating...' : 'Start from scratch'}
                  </h2>
                  <p className='text-sm text-gray-700 text-center'>
                    {isCreating
                      ? 'Please wait while we create your form'
                      : 'A blank slate is all you need'}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Form Generator card */}
            <div onClick={isCreating ? undefined : handleAIFormGenerator}>
              <div
                className={`bg-white rounded-lg shadow-md hover:shadow-xl hover:border-purple-500 transition-all duration-300 border border-gray-200 overflow-hidden flex flex-col h-full relative ${
                  isCreating
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:scale-[1.02]'
                }`}
              >
                {/* Professional Hot Badge */}
                <div className='absolute -top-1 -right-1 z-10'>
                  <div className='bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-medium px-2 py-0.5 rounded-full shadow-sm border border-purple-500'>
                    NEW
                  </div>
                </div>

                <div className='bg-gradient-to-br from-[#FAFAFF] via-[#F8FAFF] to-[#F3F4FF] p-12 flex items-center justify-center relative'>
                  {/* Subtle background pattern */}
                  <div className='absolute inset-0 opacity-5'>
                    <div className='absolute top-4 left-4 w-8 h-8 border border-purple-200 rounded transform rotate-45'></div>
                    <div className='absolute bottom-4 right-4 w-6 h-6 border border-purple-200 rounded-full'></div>
                    <div className='absolute top-1/2 right-6 w-4 h-4 border border-purple-200 rounded transform rotate-12'></div>
                  </div>

                  {/* Professional AI Icon */}
                  <div className='relative'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='48'
                      height='48'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='#7C3AED'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='drop-shadow-sm'
                    >
                      <path d='M16 18a4 4 0 0 0-8 0' />
                      <circle cx='12' cy='11' r='1' />
                      <path d='M12 2v2' />
                      <path d='M12 20v2' />
                      <path d='m4.93 4.93 1.41 1.41' />
                      <path d='m17.66 17.66 1.41 1.41' />
                      <path d='M2 12h2' />
                      <path d='M20 12h2' />
                      <path d='m6.34 17.66-1.41 1.41' />
                      <path d='m19.07 4.93-1.41 1.41' />
                      <path d='M9 12h6' />
                      <path d='M12 9v6' />
                    </svg>
                  </div>
                </div>
                <div className='p-5 flex flex-col flex-grow'>
                  <h2 className='text-xl font-semibold text-center text-[#102035] mb-2'>
                    AI Form Generator
                  </h2>
                  <p className='text-sm text-gray-700 text-center'>
                    Let AI create your form from description
                  </p>
                </div>
              </div>
            </div>

            {/* Use template card */}
            <div onClick={isCreating ? undefined : handleUseTemplate}>
              <div
                className={`bg-white rounded-lg shadow-md hover:shadow-xl hover:border-orange-500 transition-all duration-300 border border-gray-200 overflow-hidden flex flex-col h-full relative ${
                  isCreating
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:scale-[1.02]'
                }`}
              >
                {/* Popular Badge */}
                <div className='absolute -top-1 -right-1 z-10'>
                  <div className='bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-medium px-2 py-0.5 rounded-full shadow-sm border border-orange-400'>
                    POPULAR
                  </div>
                </div>

                <div className='bg-gradient-to-br from-[#FFF8F0] via-[#FFFBF5] to-[#FFF4E6] p-12 flex items-center justify-center relative'>
                  {/* Subtle background pattern */}
                  <div className='absolute inset-0 opacity-10'>
                    <div className='absolute top-3 left-3 w-6 h-6 border-2 border-orange-300 rounded'></div>
                    <div className='absolute bottom-3 right-3 w-4 h-4 bg-orange-200 rounded-full'></div>
                    <div className='absolute top-1/2 left-6 w-3 h-3 border border-orange-300 rounded transform rotate-45'></div>
                    <div className='absolute top-6 right-1/2 w-2 h-2 bg-orange-300 rounded'></div>
                  </div>

                  {/* Template Icon */}
                  <div className='relative'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='48'
                      height='48'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='#EA580C'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='drop-shadow-sm'
                    >
                      <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
                      <line x1='3' y1='9' x2='21' y2='9' />
                      <line x1='9' y1='21' x2='9' y2='9' />
                      <rect
                        x='12'
                        y='12'
                        width='6'
                        height='3'
                        rx='1'
                        fill='#EA580C'
                      />
                      <rect
                        x='12'
                        y='16'
                        width='4'
                        height='2'
                        rx='0.5'
                        fill='#FB923C'
                      />
                    </svg>
                  </div>
                </div>
                <div className='p-5 flex flex-col flex-grow'>
                  <h2 className='text-xl font-semibold text-center text-[#102035] mb-2'>
                    Use template
                  </h2>
                  <p className='text-sm text-gray-700 text-center'>
                    Choose from premade forms
                  </p>
                  <div className='mt-3 flex justify-center'>
                    <div className='flex items-center space-x-1'>
                      <div className='w-2 h-2 bg-orange-400 rounded-full'></div>
                      <div className='w-2 h-2 bg-orange-300 rounded-full'></div>
                      <div className='w-2 h-2 bg-orange-200 rounded-full'></div>
                      <span className='text-xs text-orange-600 ml-2 font-medium'>
                        Beautiful Templates
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info Section */}
          <div className='mt-12 text-center'>
            <p className='text-sm text-gray-500 mb-4'>
              All forms include advanced features like conditional logic, file
              uploads, and analytics
            </p>
            <div className='flex items-center justify-center space-x-6 text-xs text-gray-400'>
              <div className='flex items-center'>
                <div className='w-2 h-2 bg-green-400 rounded-full mr-2'></div>
                Unlimited fields
              </div>
              <div className='flex items-center'>
                <div className='w-2 h-2 bg-blue-400 rounded-full mr-2'></div>
                Real-time responses
              </div>
              <div className='flex items-center'>
                <div className='w-2 h-2 bg-purple-400 rounded-full mr-2'></div>
                Custom branding
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
