// src/components/form-builder/canvas/PageSeparator.tsx
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
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
    <div
      className='relative mt-8 mb-6'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className='flex items-center justify-center'>
        <div className='flex-1 h-px bg-gray-300'></div>
        <motion.button
          className='mx-4 px-4 py-2 text-sm text-gray-500 border border-dashed border-gray-300 rounded hover:border-blue-400 hover:text-blue-500 transition-colors'
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddPage}
        >
          + ADD NEW PAGE HERE
        </motion.button>
        <div className='flex-1 h-px bg-gray-300'></div>
      </div>

      {/* Remove Page Button - appears on hover */}
      <AnimatePresence>
        {isHovered && canRemove && onRemovePage && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className='absolute top-0 right-0 p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-md text-xs flex items-center transition-colors'
            onClick={onRemovePage}
          >
            <X className='w-3 h-3 mr-1' />
            Remove Page {pageNumber}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PageSeparator;
