// src/components/form-builder/canvas/PageNavigation.tsx
'use client';

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageIndex: number) => void;
  onAddPage: () => void;
}

const PageNavigation: React.FC<PageNavigationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onAddPage,
}) => {
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;

  return (
    <div className='flex items-center justify-between mt-6 border-t border-gray-200 pt-4'>
      <div className='flex items-center space-x-2'>
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              index === currentPage
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => onPageChange(index)}
          >
            PAGE {index + 1}
          </button>
        ))}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className='px-3 py-1 bg-orange-500 rounded-md text-white text-sm font-medium hover:bg-orange-600 transition-colors flex items-center'
          onClick={onAddPage}
        >
          <Plus className='w-3 h-3 mr-1' />
          ADD NEW PAGE
        </motion.button>
      </div>

      <div className='flex items-center space-x-2'>
        <button
          className={`p-1 rounded-md ${
            isFirstPage
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => !isFirstPage && onPageChange(currentPage - 1)}
          disabled={isFirstPage}
        >
          <ChevronLeft className='w-5 h-5' />
        </button>
        <span className='text-sm text-gray-600'>
          Page {currentPage + 1} of {totalPages}
        </span>
        <button
          className={`p-1 rounded-md ${
            isLastPage
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => !isLastPage && onPageChange(currentPage + 1)}
          disabled={isLastPage}
        >
          <ChevronRight className='w-5 h-5' />
        </button>
      </div>
    </div>
  );
};

export default PageNavigation;
