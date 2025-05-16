// components/CreateFormModal.tsx
'use client';

import { useRouter } from 'next/navigation';
import { X, ArrowLeft, Plus } from 'lucide-react';
import { generateUniqueId } from '@/lib/utils';

export default function CreateFormModal() {
  const router = useRouter();

  const handleStartFromScratch = () => {
    const uniqueId = generateUniqueId();
    router.push(`/build/${uniqueId}`);
  };

  const handleUseTemplate = () => {
    router.push('/templates');
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <div className='fixed inset-0 bg-gray-50 z-50 overflow-y-auto'>
      <div className='min-h-screen px-4 py-8'>
        {/* Header with navigation buttons */}
        <div className='max-w-6xl mx-auto mb-10 flex justify-between'>
          <button
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-white/80 hover:bg-white rounded-full px-4 py-2 text-sm font-medium shadow-sm'
            onClick={handleClose}
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </button>

          <button
            className='text-gray-600 hover:text-gray-900 bg-white/80 hover:bg-white rounded-full p-2 shadow-sm'
            onClick={handleClose}
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Main content */}
        <div className='max-w-4xl mx-auto'>
          <div className='text-center mb-12'>
            <h1 className='text-3xl font-bold text-gray-900 mb-4'>
              Create a Form
            </h1>
            <p className='text-gray-600 max-w-2xl mx-auto'>
              Start collecting data with powerful forms that use conditional
              logic, accept payments, generate reports, and automate workflows.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {/* Start from scratch */}
            <div
              className='bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer'
              onClick={handleStartFromScratch}
            >
              <div className='bg-indigo-100 p-10 flex items-center justify-center h-48'>
                <Plus className='h-16 w-16 text-indigo-500' />
              </div>
              <div className='p-6 text-center'>
                <h2 className='text-lg font-medium text-gray-900 mb-2'>
                  Start from scratch
                </h2>
                <p className='text-gray-600 text-sm'>
                  A blank slate is all you need
                </p>
              </div>
            </div>

            {/* Use template */}
            <div
              className='bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer'
              onClick={handleUseTemplate}
            >
              <div className='bg-orange-500 p-10 flex items-center justify-center h-48'>
                <div className='w-3/4 bg-white rounded-lg p-4 shadow'>
                  <div className='w-full h-4 bg-gray-200 rounded mb-3'></div>
                  <div className='w-3/4 h-4 bg-gray-200 rounded mb-3'></div>
                  <div className='w-full h-4 bg-gray-200 rounded mb-3'></div>
                  <div className='w-2/3 h-4 bg-gray-200 rounded'></div>
                </div>
              </div>
              <div className='p-6 text-center'>
                <h2 className='text-lg font-medium text-gray-900 mb-2'>
                  Use template
                </h2>
                <p className='text-gray-600 text-sm'>
                  Choose from 10,000+ premade forms
                </p>
              </div>
            </div>

            {/* Smart PDF Form */}
            <div className='bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer'>
              <div className='bg-blue-600 p-10 flex items-center justify-center h-48'>
                <div className='relative'>
                  <div className='absolute -right-4 -top-4 bg-red-600 text-white text-xs font-bold py-1 px-2 rounded'>
                    PDF
                  </div>
                  <div className='w-28 h-36 bg-white rounded-lg shadow-lg flex items-center justify-center'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='h-12 w-12 text-blue-500'
                    >
                      <path d='M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' />
                      <polyline points='14 2 14 8 20 8' />
                    </svg>
                  </div>
                </div>
              </div>
              <div className='p-6 text-center'>
                <h2 className='text-lg font-medium text-gray-900 mb-2'>
                  Smart PDF Form
                </h2>
                <p className='text-gray-600 text-sm'>
                  Convert your PDF form to an online form
                </p>
              </div>
            </div>

            {/* E-sign forms */}
            <div className='bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer'>
              <div className='bg-green-500 p-10 flex items-center justify-center h-48'>
                <div className='w-3/4 bg-white rounded-lg p-4 shadow'>
                  <div className='w-full h-4 bg-gray-200 rounded mb-6'></div>
                  <div className='w-full h-4 bg-gray-200 rounded mb-6'></div>
                  <div className='w-3/4 h-12 bg-blue-100 rounded flex items-center justify-center'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='h-8 w-8 text-blue-500'
                    >
                      <path d='M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' />
                      <polyline points='14 2 14 8 20 8' />
                      <path d='M8 13h2' />
                      <path d='M8 17h2' />
                      <path d='M14 3v7h7' />
                    </svg>
                  </div>
                </div>
              </div>
              <div className='p-6 text-center'>
                <h2 className='text-lg font-medium text-gray-900 mb-2'>
                  E-sign forms
                </h2>
                <p className='text-gray-600 text-sm'>
                  Collect e-signatures with your forms
                </p>
              </div>
            </div>

            {/* Import form */}
            <div className='bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer'>
              <div className='bg-blue-400 p-10 flex items-center justify-center h-48'>
                <div className='w-3/4 bg-white rounded-lg p-4 shadow'>
                  <div className='w-full h-4 bg-gray-200 rounded mb-3'></div>
                  <div className='w-3/4 h-4 bg-gray-200 rounded mb-3'></div>
                  <div className='w-full h-4 bg-gray-200 rounded mb-3'></div>
                  <div className='flex justify-center mt-2'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='h-8 w-8 text-blue-500'
                    >
                      <path d='M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5' />
                    </svg>
                  </div>
                </div>
              </div>
              <div className='p-6 text-center'>
                <h2 className='text-lg font-medium text-gray-900 mb-2'>
                  Import form
                </h2>
                <p className='text-gray-600 text-sm'>
                  Convert an existing form in seconds
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
