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
    <div className='flex flex-col sm:flex-row items-center justify-between mt-6 border-t border-gray-200 pt-4 space-y-4 sm:space-y-0 px-2 sm:px-0'>
      {/* Page Buttons */}
      <div className='flex flex-wrap items-center justify-center sm:justify-start gap-2 order-2 sm:order-1'>
        {Array.from({ length: totalPages }).map((_, index) => (
          <motion.button
            key={index}
            className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 ${
              index === currentPage
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
            }`}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPageChange(index)}
          >
            PAGE {index + 1}
          </motion.button>
        ))}
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className='px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white text-sm font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center cursor-pointer shadow-md'
          onClick={onAddPage}
        >
          <Plus className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
          <span className='hidden sm:inline'>ADD NEW PAGE</span>
          <span className='sm:hidden'>ADD</span>
        </motion.button>
      </div>

      {/* Navigation Controls */}
      <div className='flex items-center space-x-4 order-1 sm:order-2'>
        <motion.button
          className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ${
            isFirstPage
              ? 'text-gray-400 cursor-not-allowed bg-gray-50'
              : 'text-gray-700 hover:bg-gray-100 bg-white shadow-sm hover:shadow-md'
          }`}
          whileHover={!isFirstPage ? { scale: 1.05 } : {}}
          whileTap={!isFirstPage ? { scale: 0.95 } : {}}
          onClick={() => !isFirstPage && onPageChange(currentPage - 1)}
          disabled={isFirstPage}
        >
          <ChevronLeft className='w-5 h-5' />
        </motion.button>

        <div className='text-sm text-gray-600 font-medium px-2'>
          <span className='hidden sm:inline'>Page </span>
          {currentPage + 1} of {totalPages}
        </div>

        <motion.button
          className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ${
            isLastPage
              ? 'text-gray-400 cursor-not-allowed bg-gray-50'
              : 'text-gray-700 hover:bg-gray-100 bg-white shadow-sm hover:shadow-md'
          }`}
          whileHover={!isLastPage ? { scale: 1.05 } : {}}
          whileTap={!isLastPage ? { scale: 0.95 } : {}}
          onClick={() => !isLastPage && onPageChange(currentPage + 1)}
          disabled={isLastPage}
        >
          <ChevronRight className='w-5 h-5' />
        </motion.button>
      </div>
    </div>
  );
};

export default PageNavigation;
