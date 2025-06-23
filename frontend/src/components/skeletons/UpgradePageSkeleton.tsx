// src/components/skeletons/UpgradePageSkeleton.tsx (Enhanced Version)

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface UpgradePageSkeletonProps {
  showCurrentPlan?: boolean;
  variant?: 'loading' | 'payment-processing' | 'plan-switching';
}

const UpgradePageSkeleton = ({
  showCurrentPlan = true,
  variant = 'loading',
}: UpgradePageSkeletonProps) => {
  // Animation variants for different states
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: variant === 'payment-processing' ? 0.05 : 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  const processingVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.02, 1],
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: 'easeInOut',
      },
    },
  };

  const shimmerVariants = {
    initial: { x: '-100%' },
    animate: {
      x: '100%',
      transition: {
        repeat: Infinity,
        duration: variant === 'payment-processing' ? 1 : 1.5,
        ease: 'linear',
      },
    },
  };

  // Enhanced Pricing Card Skeleton with processing state
  const PricingCardSkeleton = ({
    index,
    isProcessing = false,
  }: {
    index: number;
    isProcessing?: boolean;
  }) => (
    <motion.div
      className={`bg-white border rounded-lg overflow-hidden shadow-sm flex flex-col ${
        isProcessing ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      }`}
      variants={isProcessing ? processingVariants : itemVariants}
      initial={isProcessing ? 'initial' : 'hidden'}
      animate={isProcessing ? 'animate' : 'visible'}
    >
      {/* Header Section */}
      <div
        className={`p-4 sm:p-6 text-center relative overflow-hidden ${
          isProcessing ? 'bg-blue-200' : 'bg-gray-200'
        }`}
      >
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent ${
            isProcessing ? 'opacity-60' : ''
          }`}
          variants={shimmerVariants}
          initial='initial'
          animate='animate'
        />
        <Skeleton className='h-5 sm:h-6 w-20 mx-auto mb-2 sm:mb-4' />
        <div className='flex items-center justify-center'>
          <Skeleton className='h-8 sm:h-10 w-24 sm:w-32' />
          <Skeleton className='h-3 w-8 ml-1' />
        </div>
        <Skeleton className='h-3 sm:h-4 w-32 sm:w-40 mx-auto mt-2' />
      </div>

      {/* Content Section */}
      <div className='p-3 sm:p-4 bg-gray-800 flex-grow flex flex-col'>
        <div className='flex-grow space-y-4 sm:space-y-6'>
          {[...Array(4)].map((_, featureIndex) => (
            <motion.div
              key={featureIndex}
              className='text-center'
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.3,
                delay: index * 0.1 + featureIndex * 0.05,
              }}
            >
              <Skeleton className='h-4 sm:h-5 w-16 sm:w-20 mx-auto mb-1' />
              <Skeleton className='h-3 w-20 sm:w-24 mx-auto' />
            </motion.div>
          ))}
        </div>

        {/* Button with processing state */}
        <motion.div
          className='mt-4 sm:mt-6'
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
        >
          {isProcessing ? (
            <motion.div
              className='w-full h-8 sm:h-10 bg-blue-400 rounded flex items-center justify-center'
              animate={{
                backgroundColor: ['#60a5fa', '#3b82f6', '#60a5fa'],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
              }}
            >
              <motion.div
                className='w-4 h-4 border-2 border-white border-t-transparent rounded-full'
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Infinity,
                  duration: 1,
                  ease: 'linear',
                }}
              />
            </motion.div>
          ) : (
            <Skeleton className='w-full h-8 sm:h-10 rounded' />
          )}
        </motion.div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      className='bg-gray-50 min-h-screen w-full py-4 sm:py-6 lg:py-10 px-2 sm:px-4'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className='max-w-4xl mx-auto bg-white rounded-lg shadow-sm'
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Header Section */}
        <motion.div
          className='py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-10 border-b border-gray-200'
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
            <div className='relative overflow-hidden'>
              <Skeleton className='h-6 sm:h-8 w-48 sm:w-64' />
              <motion.div
                className='absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent'
                variants={shimmerVariants}
                initial='initial'
                animate='animate'
              />
            </div>
            <div className='flex items-center gap-2 sm:gap-3'>
              <Skeleton className='h-4 w-4 sm:h-5 sm:w-5 rounded' />
              <Skeleton className='h-4 w-32 sm:w-40' />
            </div>
          </div>
        </motion.div>

        <motion.div
          className='p-4 sm:p-6 lg:p-10'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {/* Current Plan Info - Conditional rendering */}
          {showCurrentPlan && (
            <motion.div
              className='mb-6 sm:mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg'
              variants={itemVariants}
            >
              <div className='flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4'>
                <div className='flex-grow'>
                  <Skeleton className='h-5 sm:h-6 w-40 sm:w-48 mb-2' />
                  <Skeleton className='h-3 sm:h-4 w-64 sm:w-80' />
                </div>
                <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto'>
                  <Skeleton className='h-8 sm:h-10 w-32 sm:w-36 rounded' />
                  <Skeleton className='h-8 sm:h-10 w-32 sm:w-36 rounded' />
                </div>
              </div>
            </motion.div>
          )}

          {/* Processing Message for payment-processing variant */}
          {variant === 'payment-processing' && (
            <motion.div
              className='mb-6 sm:mb-8 p-4 bg-blue-100 border border-blue-300 rounded-lg'
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className='flex items-center justify-center gap-3'>
                <motion.div
                  className='w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full'
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                />
                <Skeleton className='h-4 w-48' />
              </div>
            </motion.div>
          )}

          {/* Billing Toggle */}
          <motion.div
            className='mb-6 sm:mb-8 flex flex-col sm:flex-row justify-center items-center gap-4'
            variants={itemVariants}
          >
            <div className='bg-gray-100 rounded-full p-1 flex items-center relative overflow-hidden'>
              <motion.div
                className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full'
                variants={shimmerVariants}
                initial='initial'
                animate='animate'
              />
              <Skeleton className='h-8 sm:h-10 w-20 sm:w-24 rounded-full mr-1' />
              <Skeleton className='h-8 sm:h-10 w-20 sm:w-24 rounded-full' />
            </div>
            <div className='flex items-center'>
              <Skeleton className='h-3 w-3 sm:h-4 sm:w-4 mr-1 rounded' />
              <Skeleton className='h-3 sm:h-4 w-16 sm:w-20' />
            </div>
          </motion.div>

          {/* Pricing Cards Grid */}
          <motion.div
            className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5'
            variants={itemVariants}
          >
            {[...Array(4)].map((_, index) => (
              <PricingCardSkeleton
                key={index}
                index={index}
                isProcessing={variant === 'payment-processing' && index === 2} // Silver plan processing
              />
            ))}
          </motion.div>

          {/* Rest of the component remains the same */}
          {/* Features Comparison Section */}
          <motion.div
            className='mt-8 sm:mt-12 bg-gray-50 rounded-lg p-4 sm:p-6'
            variants={itemVariants}
          >
            <div className='text-center mb-4'>
              <Skeleton className='h-5 sm:h-6 w-32 sm:w-40 mx-auto' />
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
              {[...Array(6)].map((_, index) => (
                <motion.div
                  key={index}
                  className='flex items-center'
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                >
                  <Skeleton className='h-3 w-3 sm:h-4 sm:w-4 rounded mr-2 flex-shrink-0' />
                  <Skeleton className='h-3 sm:h-4 w-32 sm:w-40' />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Payment Security Section */}
          <motion.div
            className='mt-6 sm:mt-8 text-center'
            variants={itemVariants}
          >
            <div className='flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4'>
              {[...Array(3)].map((_, index) => (
                <motion.div
                  key={index}
                  className='flex items-center'
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                >
                  <Skeleton className='h-3 w-3 sm:h-4 sm:w-4 rounded mr-1' />
                  <Skeleton className='h-3 sm:h-4 w-16 sm:w-20' />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Disclaimer Section */}
          <motion.div
            className='mt-6 sm:mt-8 text-center px-2'
            variants={itemVariants}
          >
            <div className='space-y-2'>
              <Skeleton className='h-3 w-full max-w-4xl mx-auto' />
              <Skeleton className='h-3 w-3/4 mx-auto' />
              <Skeleton className='h-3 w-5/6 mx-auto' />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default UpgradePageSkeleton;
