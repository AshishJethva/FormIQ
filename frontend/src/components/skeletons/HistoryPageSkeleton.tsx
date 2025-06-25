'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Globe, Activity, Calendar } from 'lucide-react';

interface HistoryPageSkeletonProps {
  variant?: 'initial-loading' | 'filtering' | 'paginating' | 'date-picker-open';
  showActivityLogs?: boolean;
  logsCount?: number;
  showDatePicker?: boolean;
  hasExistingData?: boolean;
}

const HistoryPageSkeleton = ({
  variant = 'initial-loading',
  showActivityLogs = true,
  logsCount = 8,
  showDatePicker = false,
  hasExistingData = false,
}: HistoryPageSkeletonProps) => {
  // Enhanced animation variants for different states
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: getStaggerDelay(),
      },
    },
  };

  function getStaggerDelay() {
    switch (variant) {
      case 'filtering':
        return 0.03;
      case 'paginating':
        return 0.05;
      case 'date-picker-open':
        return 0.04;
      default:
        return 0.1;
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const slideVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4 },
    },
  };

  const shimmerVariants = {
    initial: { x: '-100%' },
    animate: {
      x: '100%',
      transition: {
        repeat: Infinity,
        duration: variant === 'filtering' ? 1 : 1.5,
        ease: 'linear',
      },
    },
  };

  const filteringPulseVariants = {
    initial: { scale: 1, opacity: 0.7 },
    animate: {
      scale: [1, 1.02, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: 'easeInOut',
      },
    },
  };

  const paginatingVariants = {
    initial: { backgroundColor: '#f3f4f6' },
    animate: {
      backgroundColor: ['#f3f4f6', '#e5e7eb', '#f3f4f6'],
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: 'easeInOut',
      },
    },
  };

  // Enhanced Activity Log Row with more realistic loading
  const ActivityLogRowSkeleton = ({
    index,
    isExisting = false,
  }: {
    index: number;
    isExisting?: boolean;
  }) => (
    <motion.div
      className={`grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-0 py-4 px-4 sm:px-6 transition-colors ${
        isExisting ? 'bg-gray-50' : 'hover:bg-gray-100'
      }`}
      initial={{ opacity: isExisting ? 1 : 0, x: isExisting ? 0 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div className='text-gray-700'>
        <div className='sm:hidden mb-1'>
          <div className='flex items-center'>
            <Clock className='h-3 w-3 mr-1 text-gray-400' />
            <Skeleton className='h-3 w-16' />
          </div>
        </div>
        <div className='flex items-center'>
          <Skeleton className='h-3 w-20' />
          <span className='mx-2 text-gray-400'>-</span>
          <Skeleton className='h-3 w-16' />
        </div>
      </div>

      <div>
        <div className='sm:hidden mb-1'>
          <Skeleton className='h-3 w-20' />
        </div>
        <div className='flex flex-wrap items-center gap-1'>
          <span className='text-gray-600 text-xs sm:text-sm'>You</span>
          <Skeleton className='h-3 w-16' />
          <Skeleton className='h-3 w-24' />
          <div className='flex items-center'>
            <span className='text-gray-600 text-xs sm:text-sm mr-1'>from</span>
            <Skeleton className='h-3 w-20' />
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Enhanced Date Picker Skeleton
  const DatePickerSkeleton = () => (
    <motion.div
      className='absolute mt-2 z-10 rounded-md shadow-lg bg-[#2B3245] text-white left-0 sm:right-0 sm:left-auto top-full w-full sm:w-auto'
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className='flex flex-col sm:flex-row'>
        {/* Calendar Section */}
        <div className='p-4 border-b sm:border-b-0 sm:border-r border-gray-600'>
          {/* Calendar Header */}
          <div className='flex justify-between items-center mb-4'>
            <Skeleton className='h-4 w-4 rounded' />
            <Skeleton className='h-4 w-24 rounded' />
            <Skeleton className='h-4 w-4 rounded' />
          </div>

          {/* Calendar Grid */}
          <div className='grid grid-cols-7 text-center text-xs mb-2'>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={index} className='text-gray-400 py-1'>
                {day}
              </div>
            ))}
          </div>

          <div className='grid grid-cols-7 gap-1 text-center'>
            {[...Array(35)].map((_, index) => (
              <Skeleton
                key={index}
                className='w-6 h-6 sm:w-8 sm:h-8 rounded-full'
              />
            ))}
          </div>
        </div>

        {/* Date Range Options */}
        <div className='p-4 min-w-[160px]'>
          {[...Array(9)].map((_, index) => (
            <motion.div
              key={index}
              className='py-2 px-3 mb-1'
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Skeleton className='h-4 w-full rounded' />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  // Enhanced Account Card with more realistic content
  const AccountCardSkeleton = ({
    icon,
    delay = 0,
    isSpecial = false,
  }: {
    title: string;
    icon: React.ReactNode;
    delay?: number;
    isSpecial?: boolean;
  }) => (
    <motion.div
      className='bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow'
      variants={slideVariants}
      initial='hidden'
      animate='visible'
      transition={{ delay }}
      whileHover={{ y: -2 }}
    >
      <div className='px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 relative overflow-hidden'>
        <div className='flex items-center'>
          <div className='text-green-600 mr-2'>{icon}</div>
          <Skeleton className='h-4 w-24' />
        </div>
        <motion.div
          className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent'
          variants={shimmerVariants}
          initial='initial'
          animate='animate'
        />
      </div>
      <div className='p-4 sm:p-5'>
        {isSpecial ? (
          // Special layout for IP Address card
          <div className='flex items-center justify-center h-12 sm:h-16'>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.3 }}
            >
              <Skeleton className='h-6 sm:h-8 w-24 sm:w-32 rounded-lg' />
            </motion.div>
          </div>
        ) : (
          // Regular layout for other cards
          <div className='space-y-3'>
            {[...Array(3)].map((_, index) => (
              <motion.div
                key={index}
                className='flex flex-col sm:flex-row sm:items-center'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: delay + 0.1 + index * 0.1 }}
              >
                <Skeleton className='h-3 w-24 mb-1 sm:mb-0 sm:mr-2' />
                <Skeleton className='h-3 w-20' />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <motion.div
      className='bg-gray-50 min-h-screen w-full py-4 sm:py-6 lg:py-10 px-2 sm:px-4'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      <div className='max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden'>
        {/* Header */}
        <motion.div
          className='py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-10 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50'
          variants={itemVariants}
        >
          <div className='flex items-center gap-2 relative overflow-hidden'>
            <Activity className='h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-green-600 flex-shrink-0' />
            <Skeleton className='h-6 sm:h-7 lg:h-8 w-48 sm:w-64 lg:w-80' />
            <motion.div
              className='absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent'
              variants={shimmerVariants}
              initial='initial'
              animate='animate'
            />
          </div>
        </motion.div>

        <div className='p-4 sm:p-6 lg:p-10'>
          {/* Date Filter with Enhanced States */}
          <motion.div
            className='flex justify-center sm:justify-end mb-6 relative'
            variants={itemVariants}
          >
            <motion.div
              className={`flex items-center justify-between w-full sm:w-[200px] px-4 py-2 bg-white border rounded-md shadow-sm relative overflow-hidden ${
                variant === 'date-picker-open'
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-300'
              }`}
              animate={
                variant === 'filtering'
                  ? {
                      borderColor: ['#d1d5db', '#3b82f6', '#d1d5db'],
                    }
                  : {}
              }
              transition={{
                repeat: variant === 'filtering' ? Infinity : 0,
                duration: 2,
              }}
            >
              <Skeleton className='h-4 w-20' />
              <Calendar className='h-5 w-5 text-green-600 flex-shrink-0' />
              <motion.div
                className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent'
                variants={shimmerVariants}
                initial='initial'
                animate='animate'
              />
            </motion.div>

            {/* Enhanced Date Picker */}
            <AnimatePresence>
              {showDatePicker && <DatePickerSkeleton />}
            </AnimatePresence>
          </motion.div>

          {/* Activity Log Table with Different States */}
          <motion.div
            className='bg-gray-50 rounded-lg overflow-hidden shadow mb-8'
            variants={itemVariants}
          >
            {/* Table Header */}
            <div className='hidden sm:grid sm:grid-cols-2 bg-gray-100 py-3 px-6'>
              <div className='flex items-center'>
                <Clock className='h-4 w-4 text-gray-500 mr-2' />
                <span className='font-medium text-gray-700'>Date</span>
              </div>
              <div className='font-medium text-gray-700'>Description</div>
            </div>

            {/* Dynamic Table Content Based on Variant */}
            {variant === 'filtering' ? (
              <motion.div
                className='py-12 flex flex-col justify-center items-center gap-4'
                variants={filteringPulseVariants}
                initial='initial'
                animate='animate'
              >
                <div className='flex items-center gap-3'>
                  <motion.div
                    className='w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full'
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: 'linear',
                    }}
                  />
                  <span className='text-gray-600 text-sm'>
                    Applying date filters...
                  </span>
                </div>
                {hasExistingData && (
                  <motion.div
                    className='text-xs text-gray-500'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Previous results will be updated shortly
                  </motion.div>
                )}
              </motion.div>
            ) : variant === 'paginating' ? (
              <div className='divide-y divide-gray-200'>
                {[...Array(Math.min(logsCount, 5))].map((_, index) => (
                  <motion.div
                    key={index}
                    className='grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-0 py-4 px-4 sm:px-6'
                    variants={paginatingVariants}
                    initial='initial'
                    animate='animate'
                    transition={{ delay: index * 0.1 }}
                  >
                    <ActivityLogRowSkeleton index={index} isExisting={true} />
                  </motion.div>
                ))}
                <motion.div
                  className='py-8 flex justify-center items-center'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className='flex items-center gap-3'>
                    <motion.div
                      className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full'
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: 'linear',
                      }}
                    />
                    <span className='text-gray-500 text-sm'>
                      Loading more results...
                    </span>
                  </div>
                </motion.div>
              </div>
            ) : showActivityLogs ? (
              <div className='divide-y divide-gray-200'>
                {[...Array(logsCount)].map((_, index) => (
                  <ActivityLogRowSkeleton key={index} index={index} />
                ))}
              </div>
            ) : (
              <motion.div
                className='py-12 text-center'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  className='flex flex-col items-center gap-3'
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Activity className='h-12 w-12 text-gray-300' />
                  <Skeleton className='h-4 w-64' />
                </motion.div>
              </motion.div>
            )}
          </motion.div>

          {/* Enhanced Pagination */}
          {showActivityLogs && variant !== 'filtering' && (
            <motion.div
              className='flex flex-wrap justify-center items-center gap-2 mb-8'
              variants={itemVariants}
            >
              <Skeleton className='h-8 w-16 rounded' />
              <div className='flex gap-1'>
                {[...Array(5)].map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Skeleton className='h-8 w-8 rounded' />
                  </motion.div>
                ))}
              </div>
              <Skeleton className='h-8 w-12 rounded' />
            </motion.div>
          )}

          {/* Load More Button */}
          {showActivityLogs && variant !== 'filtering' && (
            <motion.div className='text-center mb-8' variants={itemVariants}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Skeleton className='h-8 w-32 mx-auto rounded' />
              </motion.div>
            </motion.div>
          )}

          {/* Enhanced Account Details Section */}
          <motion.div variants={itemVariants}>
            {/* Section Header */}
            <div className='mb-6 border-b border-gray-200 pb-2'>
              <div className='flex items-center relative overflow-hidden'>
                <Globe className='h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600' />
                <span className='text-xl sm:text-2xl font-semibold text-green-600'>
                  Account Details
                </span>
                <motion.div
                  className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent'
                  variants={shimmerVariants}
                  initial='initial'
                  animate='animate'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Time Details Card */}
              <AccountCardSkeleton
                title='Time Details'
                icon={<Clock className='h-3 w-3 sm:h-4 sm:w-4' />}
                delay={0.1}
              />

              {/* IP Address Card */}
              <AccountCardSkeleton
                title='Last IP Address'
                icon={<Globe className='h-3 w-3 sm:h-4 sm:w-4' />}
                delay={0.2}
                isSpecial={true}
              />
            </div>

            {/* Activity Summary Card */}
            <motion.div
              className='mt-6 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow'
              variants={slideVariants}
              initial='hidden'
              animate='visible'
              transition={{ delay: 0.3 }}
              whileHover={{ y: -2 }}
            >
              <div className='px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 relative overflow-hidden'>
                <div className='flex items-center'>
                  <Activity className='h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-2' />
                  <span className='font-semibold text-navy-900'>
                    Activity Summary
                  </span>
                </div>
                <motion.div
                  className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent'
                  variants={shimmerVariants}
                  initial='initial'
                  animate='animate'
                />
              </div>
              <div className='p-4 sm:p-5'>
                <motion.div
                  className='grid grid-cols-2 lg:grid-cols-4 gap-4 text-center'
                  initial='hidden'
                  animate='visible'
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.1,
                      },
                    },
                  }}
                >
                  {[
                    { label: 'Total Activities', color: 'text-green-600' },
                    { label: 'Current Page', color: 'text-blue-600' },
                    { label: 'Total Pages', color: 'text-purple-600' },
                    { label: 'Showing', color: 'text-orange-600' },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      variants={slideVariants}
                      className='space-y-2'
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 200,
                          delay: 0.4 + index * 0.1,
                        }}
                      >
                        <Skeleton
                          className={`h-6 sm:h-8 w-8 sm:w-12 mx-auto`}
                        />
                      </motion.div>
                      <div className='text-xs sm:text-sm text-gray-600'>
                        {item.label}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default HistoryPageSkeleton;
