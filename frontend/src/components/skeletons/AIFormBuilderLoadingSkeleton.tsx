'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

const AIFormBuilderLoadingSkeleton: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-[#FAFAFF] via-[#F8FAFF] to-[#F3F4FF]'>
      {/* Header Skeleton */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-8xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            {/* Back Button Skeleton */}
            <div className='flex items-center ml-4'>
              <div className='flex items-center text-gray-600 px-3 py-2 rounded-md'>
                <ArrowLeft size={20} className='mr-2' />
                <Skeleton className='w-32 h-5 bg-gray-300' />
              </div>
            </div>

            {/* Logo Skeleton */}
            <div className='flex items-center mr-30'>
              <div className='flex items-center space-x-2'>
                <Skeleton className='w-10 h-10 rounded-md bg-gradient-to-br from-blue-200 to-purple-200' />
                <Skeleton className='w-24 h-8 ml-2 bg-gradient-to-r from-blue-200 to-purple-200' />
              </div>
            </div>

            {/* Spacer */}
            <div className='w-32'></div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Logo and Title Section Skeleton */}
        <div className='text-center mb-12'>
          {/* Decorative Elements Skeleton */}
          <div className='flex justify-center mb-6'>
            <div className='relative'>
              <Skeleton className='w-3 h-3 transform rotate-45 absolute -top-2 -left-2 bg-blue-200' />
              <Skeleton className='w-4 h-4 transform rotate-45 bg-orange-200' />
              <Skeleton className='w-2 h-2 transform rotate-45 absolute -bottom-1 -right-1 bg-yellow-200' />
            </div>
          </div>

          {/* Main Title Skeleton */}
          <div className='mb-6 flex justify-center'>
            <Skeleton className='w-96 h-14 bg-gradient-to-r from-purple-200 via-pink-200 to-orange-200' />
          </div>

          {/* Description Skeleton */}
          <div className='max-w-3xl mx-auto space-y-3'>
            <Skeleton className='w-full h-6 bg-gray-200' />
            <Skeleton className='w-5/6 h-6 mx-auto bg-gray-200' />
            <Skeleton className='w-4/5 h-6 mx-auto bg-gray-200' />
          </div>
        </div>

        {/* Form Input Section Skeleton */}
        <div className='bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8'>
          <div className='flex flex-col lg:flex-row gap-4'>
            {/* Textarea Skeleton */}
            <div className='flex-1'>
              <Skeleton className='w-full h-32 lg:h-20 rounded-xl bg-gray-200' />

              {/* Helper Text Skeleton */}
              <div className='flex justify-between items-center mt-2'>
                <Skeleton className='w-64 h-4 bg-gray-200' />
                <Skeleton className='w-16 h-4 bg-gray-200' />
              </div>
            </div>

            {/* Create Button Skeleton */}
            <div className='lg:self-start'>
              <Skeleton className='w-full lg:w-40 h-12 rounded-xl bg-gradient-to-r from-purple-200 to-purple-300' />
            </div>
          </div>
        </div>

        {/* Quick Templates Section Skeleton */}
        <div className='text-center'>
          {/* Template Section Title Skeleton */}
          <Skeleton className='w-72 h-6 mx-auto mb-6 bg-gray-200' />

          {/* Template Buttons Skeleton */}
          <div className='flex flex-wrap justify-center gap-3'>
            {Array.from({ length: 4 }, (_, index) => (
              <TemplateButtonSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section Skeleton */}
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12'>
        <div className='text-center'>
          <Skeleton className='w-80 h-4 mx-auto bg-gray-200' />
        </div>
      </div>
    </div>
  );
};

// Template Button Skeleton Component
const TemplateButtonSkeleton: React.FC = () => {
  // Random widths for more realistic appearance
  const widths = ['w-32', 'w-40', 'w-36', 'w-28'];
  const randomWidth = widths[Math.floor(Math.random() * widths.length)];

  return (
    <Skeleton
      className={`${randomWidth} h-12 rounded-full bg-white border border-gray-300`}
    />
  );
};

export default AIFormBuilderLoadingSkeleton;
