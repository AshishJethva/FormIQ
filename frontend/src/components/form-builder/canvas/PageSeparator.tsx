// src/components/form-builder/canvas/PageSeparator.tsx
'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageSeparatorProps {
  pageNumber: number;
  onAddPage: () => void;
  onRemovePage?: () => void;
  canRemove?: boolean;
}

const PageSeparator: React.FC<PageSeparatorProps> = ({
  pageNumber,
  onAddPage,
  onRemovePage,
  canRemove = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className='relative mt-8 mb-6 px-2 sm:px-4'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className='flex items-center justify-center'>
        <div className='flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent'></div>
        <motion.button
          className='mx-4 px-4 py-3 sm:px-6 sm:py-2 text-sm font-medium text-gray-500 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer backdrop-blur-sm'
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddPage}
        >
          <div className='flex items-center'>
            <Plus className='w-4 h-4 mr-2' />
            <span className='hidden sm:inline'>ADD NEW PAGE HERE</span>
            <span className='sm:hidden'>ADD PAGE</span>
          </div>
        </motion.button>
        <div className='flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent'></div>
      </div>

      {/* Remove Page Button - appears on hover */}
      <AnimatePresence>
        {isHovered && canRemove && onRemovePage && (
          <motion.button
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className='absolute top-0 right-2 sm:right-4 p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs flex items-center transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg border border-red-200'
            onClick={onRemovePage}
          >
            <X className='w-3 h-3 mr-1' />
            <span className='hidden sm:inline'>Remove Page {pageNumber}</span>
            <span className='sm:hidden'>Remove</span>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PageSeparator;
