// src/modals/CreateFormModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { createFormAsync } from '@/redux/slices/dashboard/formsSlice';
import { StoreDispatch } from '@/redux/store';

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
            className='flex items-center  cursor-pointer text-black font-medium hover:text-gray-900 transition-colors ml-6 mt-6 px-2.5 py-2 rounded-full bg-[#DADEF3] shadow-sm'
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

          <div className='grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-lg'>
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

            {/* Use template card */}
            <div onClick={isCreating ? undefined : handleUseTemplate}>
              <div
                className={`bg-white rounded-lg shadow-md hover:shadow-xl hover:border-blue-500 transition-shadow border border-gray-200 overflow-hidden flex flex-col h-full ${
                  isCreating
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                <div className='bg-[#FFEBDD] p-12 flex items-center justify-center'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='48'
                    height='48'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='#FF6100'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
                    <line x1='3' y1='9' x2='21' y2='9' />
                    <line x1='9' y1='21' x2='9' y2='9' />
                  </svg>
                </div>
                <div className='p-5 flex flex-col flex-grow'>
                  <h2 className='text-xl font-semibold text-center text-[#102035] mb-2'>
                    Use template
                  </h2>
                  <p className='text-sm text-gray-700 text-center'>
                    Choose from premade forms
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
