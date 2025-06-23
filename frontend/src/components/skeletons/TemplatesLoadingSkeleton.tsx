// src/components/skeletons/TemplatesLoadingSkeleton.tsx
'use client';

import React from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const TemplatesLoadingSkeleton: React.FC = () => {
  // Simulate popular templates count (3)
  const popularTemplatesCount = 3;

  // Simulate category structure
  const categories = [
    { name: 'Business', count: 4 },
    { name: 'Survey', count: 3 },
    { name: 'Registration', count: 3 },
    { name: 'E-commerce', count: 3 },
    { name: 'Education', count: 3 },
    { name: 'Events', count: 3 },
    { name: 'HR', count: 3 },
    { name: 'Marketing', count: 3 },
    { name: 'Hospitality', count: 3 },
  ];

  return (
    <div className='fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-auto z-50'>
      <div className='min-h-screen flex flex-col'>
        {/* Enhanced Header Skeleton */}
        <div className='relative overflow-hidden'>
          {/* Background Pattern */}
          <div className='absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-90'></div>
          <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-30'></div>

          <div className='relative p-6 flex items-center border-b border-white/20 backdrop-blur-xl'>
            {/* Back Button Skeleton */}
            <div className='flex items-center text-white/90 ml-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm'>
              <ArrowLeft size={20} className='mr-2' />
              <Skeleton className='w-12 h-4 bg-white/20' />
            </div>

            <div className='flex-grow'></div>

            {/* Close Button Skeleton */}
            <div className='p-3 mr-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20'>
              <X size={24} className='text-white' />
            </div>
          </div>

          {/* Hero Section Skeleton */}
          <div className='relative px-6 py-16 text-center text-white'>
            {/* Badge Skeleton */}
            <div className='inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-6'>
              <Skeleton className='w-4 h-4 bg-white/20' />
              <Skeleton className='w-32 h-4 bg-white/20' />
            </div>

            {/* Title Skeleton */}
            <div className='mb-6 flex flex-col items-center gap-4'>
              <Skeleton className='w-96 h-12 bg-white/20' />
              <Skeleton className='w-80 h-12 bg-white/20' />
            </div>

            {/* Description Skeleton */}
            <div className='max-w-4xl mx-auto mb-10 flex flex-col items-center gap-3'>
              <Skeleton className='w-full max-w-2xl h-6 bg-white/20' />
              <Skeleton className='w-full max-w-xl h-6 bg-white/20' />
              <Skeleton className='w-full max-w-lg h-6 bg-white/20' />
            </div>

            {/* Feature Badges Skeleton */}
            <div className='flex flex-wrap justify-center gap-6'>
              {[1, 2, 3].map(item => (
                <div
                  key={item}
                  className='flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20'
                >
                  <Skeleton className='w-4 h-4 bg-white/20' />
                  <Skeleton className='w-24 h-4 bg-white/20' />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className='flex-grow px-6 py-12'>
          <div className='flex flex-col items-center w-full'>
            <div className='max-w-7xl mx-auto w-full'>
              {/* Popular Templates Section Skeleton */}
              <div className='mb-16'>
                {/* Popular Templates Header Skeleton */}
                <div className='flex items-center gap-3 mb-8 justify-center'>
                  <Skeleton className='w-12 h-12 rounded-xl' />
                  <div>
                    <Skeleton className='w-48 h-8 mb-2' />
                    <Skeleton className='w-36 h-5' />
                  </div>
                </div>

                {/* Popular Templates Grid Skeleton */}
                <div className='flex flex-wrap justify-center gap-8 w-full'>
                  {Array.from({ length: popularTemplatesCount }, (_, index) => (
                    <TemplateCardSkeleton key={`popular-${index}`} featured />
                  ))}
                </div>
              </div>

              {/* Category Templates Skeleton */}
              {categories.map(category => (
                <div key={category.name} className='mb-16'>
                  {/* Category Header Skeleton */}
                  <div className='flex items-center gap-3 mb-8 justify-center'>
                    <Skeleton className='w-12 h-12 rounded-xl' />
                    <div className='flex items-center gap-3'>
                      <Skeleton className='w-32 h-8' />
                      <Skeleton className='w-20 h-6 rounded-full' />
                    </div>
                  </div>

                  {/* Category Templates Grid Skeleton */}
                  <div className='flex flex-wrap justify-center gap-8 w-full'>
                    {Array.from({ length: category.count }, (_, index) => (
                      <TemplateCardSkeleton key={`${category.name}-${index}`} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Footer CTA Skeleton */}
              <div className='text-center mt-20 py-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl border border-blue-100'>
                <div className='max-w-2xl mx-auto'>
                  <Skeleton className='w-16 h-16 rounded-2xl mb-6 mx-auto' />
                  <Skeleton className='w-80 h-8 mb-4 mx-auto' />
                  <Skeleton className='w-96 h-6 mb-8 mx-auto' />

                  <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                    <Skeleton className='w-40 h-12 rounded-xl' />
                    <Skeleton className='w-48 h-12 rounded-xl' />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Template Card Skeleton Component
interface TemplateCardSkeletonProps {
  featured?: boolean;
}

const TemplateCardSkeleton: React.FC<TemplateCardSkeletonProps> = ({
  featured = false,
}) => {
  return (
    <div
      style={{
        width: '320px',
        maxWidth: '320px',
        minWidth: '320px',
        height: '520px',
        flexShrink: 0,
        flexGrow: 0,
        margin: '0',
        position: 'relative',
        background: 'white',
        borderRadius: '1.5rem',
        boxShadow:
          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: featured ? '2px solid #fef3c7' : '1px solid #f3f4f6',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Template Preview Section Skeleton */}
      <div
        className='relative bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center overflow-hidden'
        style={{ height: '200px', flexShrink: 0 }}
      >
        {/* Animated Background Pattern */}
        <div className='absolute inset-0 opacity-30'>
          <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%239CA3AF" fill-opacity="0.1" fill-rule="evenodd"%3E%3Cpath d="m0 40v-40h40v40z"/%3E%3C/g%3E%3C/svg%3E")]'></div>
        </div>

        {/* Form Preview Mockup Skeleton */}
        <div className='relative w-36 h-44 bg-white rounded-lg shadow-xl'>
          <div className='p-4 h-full flex flex-col'>
            {/* Form Header Skeleton */}
            <Skeleton className='h-3 mb-3' />

            {/* Form Fields Simulation Skeleton */}
            <div className='space-y-2 flex-grow'>
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton
                  key={i}
                  className={`h-2 ${
                    i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-3/4' : 'w-5/6'
                  }`}
                />
              ))}
            </div>

            {/* Form Button Skeleton */}
            <Skeleton className='mt-3 h-2.5' />
          </div>
        </div>

        {/* Badges Skeleton */}
        <div className='absolute top-3 right-3 flex flex-col gap-2'>
          {featured && <Skeleton className='w-16 h-5 rounded-full' />}
          <Skeleton className='w-12 h-5 rounded-full' />
        </div>

        {/* Category Badge Skeleton */}
        <div className='absolute top-3 left-3'>
          <Skeleton className='w-20 h-6 rounded-full' />
        </div>
      </div>

      {/* Template Information Skeleton */}
      <div
        style={{
          padding: '24px',
          height: '320px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Title and Fields Count Skeleton */}
        <div
          style={{
            height: '60px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ flex: 1, marginRight: '8px' }}>
            <Skeleton className='w-full h-6 mb-2' />
            <Skeleton className='w-3/4 h-6' />
          </div>
          <Skeleton className='w-16 h-6' />
        </div>

        {/* Description Skeleton */}
        <div style={{ height: '50px', marginBottom: '16px' }}>
          <Skeleton className='w-full h-4 mb-2' />
          <Skeleton className='w-5/6 h-4' />
        </div>

        {/* Preview Text Skeleton */}
        <div style={{ height: '50px', marginBottom: '24px' }}>
          <Skeleton className='w-full h-3 mb-2' />
          <Skeleton className='w-4/5 h-3' />
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }}></div>

        {/* Action Button Skeleton */}
        <div style={{ height: '48px' }}>
          <Skeleton className='w-full h-full rounded-xl' />
        </div>
      </div>
    </div>
  );
};

export default TemplatesLoadingSkeleton;
