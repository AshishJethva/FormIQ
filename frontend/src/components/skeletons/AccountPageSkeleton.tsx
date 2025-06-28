'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

const AccountPageSkeleton = () => {
  // Animation variants for staggered loading effect
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  const shimmerVariants: Variants = {
    initial: { x: '-100%' },
    animate: {
      x: '100%',
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear',
      },
    },
  };

  return (
    <motion.div
      className='bg-gray-50 min-h-screen w-full py-4 sm:py-10 px-4'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className='max-w-4xl mx-auto bg-white shadow-sm rounded-lg overflow-hidden'
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Header Section */}
        <motion.div
          className='py-4 sm:py-8 px-4 sm:px-10 border-b border-gray-200'
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className='relative overflow-hidden'>
            <Skeleton className='h-6 sm:h-8 w-3/4 sm:w-1/2 mb-1' />
            <motion.div
              className='absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent'
              variants={shimmerVariants}
              initial='initial'
              animate='animate'
            />
          </div>
        </motion.div>

        {/* Content Section */}
        <motion.div
          className='divide-y divide-gray-200'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {/* Account Type Row */}
          <motion.div
            className='px-4 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0'
            variants={itemVariants}
          >
            <div className='sm:w-1/3'>
              <Skeleton className='h-4 w-24' />
            </div>
            <div className='sm:w-2/3 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0'>
              <div className='flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-8 w-28 rounded' />
              </div>
            </div>
          </motion.div>

          {/* Username Row */}
          <motion.div
            className='px-4 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0'
            variants={itemVariants}
          >
            <div className='sm:w-1/3'>
              <Skeleton className='h-4 w-20' />
            </div>
            <div className='sm:w-2/3 flex justify-between items-center'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-8' />
            </div>
          </motion.div>

          {/* Email Row */}
          <motion.div
            className='px-4 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0'
            variants={itemVariants}
          >
            <div className='sm:w-1/3'>
              <Skeleton className='h-4 w-12' />
            </div>
            <div className='sm:w-2/3 flex justify-between items-center'>
              <Skeleton className='h-4 w-48' />
              <Skeleton className='h-4 w-8' />
            </div>
          </motion.div>

          {/* Password Row */}
          <motion.div
            className='px-4 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0'
            variants={itemVariants}
          >
            <div className='sm:w-1/3'>
              <Skeleton className='h-4 w-16' />
            </div>
            <div className='sm:w-2/3'>
              <Skeleton className='h-4 w-24' />
            </div>
          </motion.div>

          {/* Name Row */}
          <motion.div
            className='px-4 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0'
            variants={itemVariants}
          >
            <div className='sm:w-1/3'>
              <Skeleton className='h-4 w-10' />
            </div>
            <div className='sm:w-2/3 flex justify-between items-center'>
              <Skeleton className='h-4 w-36' />
              <Skeleton className='h-4 w-8' />
            </div>
          </motion.div>

          {/* Avatar Row */}
          <motion.div
            className='px-4 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0'
            variants={itemVariants}
          >
            <div className='sm:w-1/3'>
              <Skeleton className='h-4 w-12' />
            </div>
            <div className='sm:w-2/3 flex flex-col space-y-4'>
              <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0'>
                <div className='flex items-center space-x-4'>
                  {/* Avatar Circle with shimmer effect */}
                  <div className='relative overflow-hidden'>
                    <Skeleton className='w-16 h-16 rounded-full' />
                    <motion.div
                      className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full'
                      variants={shimmerVariants}
                      initial='initial'
                      animate='animate'
                    />
                  </div>
                  <Skeleton className='h-4 w-12' />
                </div>
                <Skeleton className='h-4 w-14' />
              </div>
            </div>
          </motion.div>

          {/* Phone Number Row */}
          <motion.div
            className='px-4 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0'
            variants={itemVariants}
          >
            <div className='sm:w-1/3'>
              <Skeleton className='h-4 w-24' />
            </div>
            <div className='sm:w-2/3 flex justify-between items-center'>
              <Skeleton className='h-4 w-8' />
              <Skeleton className='h-4 w-8' />
            </div>
          </motion.div>

          {/* Website Row */}
          <motion.div
            className='px-4 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0'
            variants={itemVariants}
          >
            <div className='sm:w-1/3'>
              <Skeleton className='h-4 w-16' />
            </div>
            <div className='sm:w-2/3 flex justify-between items-center'>
              <Skeleton className='h-4 w-8' />
              <Skeleton className='h-4 w-8' />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default AccountPageSkeleton;
