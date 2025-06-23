// src/components/dashboard/DashboardSkeleton.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  Star,
  FileEdit,
  Archive,
  Trash2,
  Plus,
  ChevronDown,
  Search,
  ArrowUpDown,
  MoreHorizontal,
} from 'lucide-react';

// Shimmer animation component
const Shimmer = ({ className = '' }: { className?: string }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] ${className}`}
  >
    <motion.div
      className='w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent'
      animate={{
        x: ['-100%', '100%'],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  </div>
);

// Navbar Skeleton
const NavbarSkeleton = () => (
  <motion.header
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
    className='bg-[#102035] text-[#FFFFFF] px-4 sm:px-6 py-3 border-b border-navy-800'
  >
    <div className='flex items-center justify-between h-10'>
      {/* Left section - Logo and workspace */}
      <div className='flex items-center space-x-3 sm:space-x-6'>
        <div className='flex items-center'>
          <Shimmer className='h-8 sm:h-[54px] w-12 sm:w-16 rounded' />
          <Shimmer className='h-6 w-20 ml-2 rounded' />
        </div>
        <div className='hidden sm:block'>
          <Shimmer className='h-4 w-24 rounded' />
        </div>
      </div>

      {/* Right section */}
      <div className='flex items-center space-x-3 sm:space-x-7'>
        <div className='hidden sm:flex space-x-6'>
          <Shimmer className='h-4 w-16 rounded' />
          <Shimmer className='h-4 w-14 rounded' />
        </div>
        <Shimmer className='h-4 w-12 rounded' />
        <Shimmer className='h-8 w-8 sm:h-10 sm:w-10 rounded-full' />
      </div>
    </div>
  </motion.header>
);

// Sidebar Skeleton
const SidebarSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
    className='w-70 bg-[#F3F3FE] border-r border-gray-200 overflow-y-auto h-full'
  >
    {/* Create button */}
    <div className='p-4 bg-white'>
      <Shimmer className='w-full h-10 rounded-md' />
    </div>

    <div className='border-t border-gray-200'></div>

    {/* My Workspace section */}
    <div className='px-4 py-2'>
      <div className='mb-2'>
        <Shimmer className='h-4 w-20 rounded mb-2' />
      </div>

      {/* All section */}
      <div className='flex items-center p-3 rounded-md bg-[#C8CEED] mb-1'>
        <LayoutGrid className='mr-3 h-4 w-4 text-gray-400' />
        <span className='text-sm text-gray-600'>All</span>
      </div>

      <div className='border-t border-gray-200 mt-6'></div>

      {/* Labels section */}
      <div className='mt-4'>
        <div className='flex items-center justify-between mb-1 px-1'>
          <div className='flex items-center'>
            <ChevronDown className='h-4 w-4 text-gray-500 mr-1' />
            <span className='text-sm text-gray-600'>Labels</span>
          </div>
          <div className='h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center'>
            <Plus className='h-3.5 w-3.5 text-gray-400' />
          </div>
        </div>

        {/* Search input skeleton */}
        <div className='mb-2 px-2'>
          <div className='relative'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-gray-300' />
            <Shimmer className='h-8 w-full rounded-md' />
          </div>
        </div>

        {/* Label items skeleton */}
        <div className='space-y-1'>
          {[1, 2, 3].map(index => (
            <div
              key={index}
              className='flex items-center p-3 rounded-md hover:bg-[#DADEF3]'
            >
              <Shimmer className='h-4 w-4 rounded-full mr-3' />
              <Shimmer className='h-4 flex-1 rounded' />
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className='border-t border-gray-200 my-2 mx-4'></div>

    {/* Essential options */}
    <div className='px-4 py-2 space-y-1'>
      {[
        { icon: Star, label: 'Favorites' },
        { icon: FileEdit, label: 'Drafts' },
        { icon: Archive, label: 'Archive' },
        { icon: Trash2, label: 'Trash' },
      ].map((item, index) => (
        <div
          key={index}
          className='flex items-center p-3 rounded-md hover:bg-[#DADEF3]'
        >
          <item.icon className='mr-3 h-4 w-4 text-gray-400' />
          <span className='text-sm text-gray-600'>{item.label}</span>
        </div>
      ))}
    </div>
  </motion.div>
);

// Filter Bar Skeleton
const FilterBarSkeleton = () => (
  <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto'>
    {/* Sort Dropdown Skeleton */}
    <div className='relative'>
      <div className='flex items-center justify-between bg-white border border-gray-200 rounded-md px-3 py-2 w-full sm:w-auto min-w-[160px]'>
        <div className='flex items-center'>
          <ArrowUpDown className='h-4 w-4 mr-2 text-gray-300' />
          <Shimmer className='h-4 w-20 rounded' />
        </div>
        <ChevronDown className='h-4 w-4 ml-2 text-gray-300' />
      </div>
    </div>

    {/* Search input skeleton */}
    <div className='relative group flex-1 sm:flex-initial'>
      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none' />
      <Shimmer className='h-10 w-full sm:w-64 rounded-md' />
    </div>
  </div>
);

// Form Item Skeleton
const FormItemSkeleton = ({ index }: { index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
    className='flex items-center p-3 border border-gray-200 rounded-md'
  >
    <div className='flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1'>
      {/* Checkbox skeleton */}
      <Shimmer className='h-4 w-4 rounded ml-1' />

      {/* Star skeleton */}
      <Star className='h-4 w-4 sm:h-5 sm:w-5 text-gray-200' />

      {/* Form icon skeleton */}
      <Shimmer className='h-8 w-8 sm:h-10 sm:w-10 rounded' />

      {/* Form details */}
      <div className='min-w-0 flex-1'>
        <Shimmer className='h-5 w-3/4 rounded mb-1' />
        <div className='flex flex-col sm:flex-row sm:items-center gap-1'>
          <Shimmer className='h-3 w-20 rounded' />
          <span className='hidden sm:inline text-gray-300'>•</span>
          <Shimmer className='h-3 w-24 rounded' />
        </div>
      </div>
    </div>

    <div className='ml-auto flex items-center space-x-2'>
      {/* Labels skeleton */}
      <div className='hidden sm:flex mr-2 space-x-1'>
        <Shimmer className='h-6 w-12 rounded-full' />
        <Shimmer className='h-6 w-16 rounded-full' />
      </div>

      {/* More menu skeleton */}
      <div className='h-8 w-8 bg-gray-100 rounded flex items-center justify-center'>
        <MoreHorizontal className='h-4 w-4 text-gray-300' />
      </div>
    </div>
  </motion.div>
);

// Main Dashboard Skeleton
const DashboardSkeleton = () => {
  console.log('Dashboard loading skeleton triggered - 2');

  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      <NavbarSkeleton />

      <div className='flex flex-1 overflow-hidden'>
        {/* Desktop Sidebar */}
        <div className='hidden lg:block'>
          <SidebarSkeleton />
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className='flex-1 flex flex-col overflow-hidden'
        >
          {/* Header */}
          <div className='bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <div className='flex items-center'>
                <div className='lg:hidden mr-2'>
                  <Shimmer className='h-8 w-8 rounded' />
                </div>
                <LayoutGrid className='h-5 w-5 text-gray-300 mr-2' />
                <Shimmer className='h-6 w-20 rounded' />
              </div>
              <FilterBarSkeleton />
            </div>
          </div>

          {/* Forms List */}
          <main className='flex-1 overflow-y-auto p-4 sm:p-6'>
            <div className='space-y-2'>
              {/* Selection bar skeleton */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className='flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md mb-2'
              >
                <div className='flex items-center'>
                  <Shimmer className='h-4 w-4 rounded ml-1 mr-3' />
                  <Shimmer className='h-4 w-16 rounded' />
                </div>
                <div className='flex space-x-2'>
                  <Shimmer className='h-8 w-16 rounded' />
                  <Shimmer className='h-8 w-16 rounded' />
                  <Shimmer className='h-8 w-12 rounded' />
                </div>
              </motion.div>

              {/* Form items skeleton */}
              {[...Array(8)].map((_, index) => (
                <FormItemSkeleton key={index} index={index} />
              ))}
            </div>
          </main>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
