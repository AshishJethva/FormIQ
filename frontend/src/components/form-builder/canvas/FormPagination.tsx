// src/components/form-builder/canvas/FormPagination.tsx
'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { motion } from 'framer-motion';
import { setCurrentPage } from '@/redux/slices/formBuilder/formBuilderSlice';
import AddNewPageButton from './AddNewPageButton';
import ThankYouPage from './ThankYouPage';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function FormPagination() {
  const dispatch = useDispatch();
  const form = useSelector((state: RootState) => state.formBuilder.form);
  const isPreviewMode = useSelector(
    (state: RootState) => state.formBuilder.isPreviewMode
  );

  if (!form) return null;
  if (!form.pages || !Array.isArray(form.pages)) {
    console.error('Form pages is not properly initialized');
    return null;
  }

  const currentPageIndex =
    form.currentPageIndex !== undefined ? form.currentPageIndex : 0;

  const handlePageClick = (pageIndex: number) => {
    dispatch(setCurrentPage(pageIndex));
  };

  const totalPages = form.pages.length + 1; // +1 for thank you page
  const canScrollLeft = currentPageIndex > 0;
  const canScrollRight = currentPageIndex < totalPages - 1;

  return (
    <div className='flex flex-col border-t border-gray-200 my-4 pt-4 w-full max-w-3xl mx-auto px-2 sm:px-4'>
      {/* Mobile Navigation Controls */}
      <div className='flex items-center justify-between mb-4 sm:hidden'>
        <motion.button
          className={`flex items-center px-3 py-2 rounded-lg transition-all ${
            canScrollLeft
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
          whileTap={canScrollLeft ? { scale: 0.95 } : {}}
          onClick={() => canScrollLeft && handlePageClick(currentPageIndex - 1)}
          disabled={!canScrollLeft}
        >
          <ChevronLeft className='w-4 h-4 mr-1' />
          <span className='text-sm font-medium'>Previous</span>
        </motion.button>

        <div className='text-sm text-gray-600 font-medium'>
          {currentPageIndex < form.pages.length
            ? `Page ${currentPageIndex + 1} of ${form.pages.length}`
            : 'Thank You Page'}
        </div>

        <motion.button
          className={`flex items-center px-3 py-2 rounded-lg transition-all ${
            canScrollRight
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
          whileTap={canScrollRight ? { scale: 0.95 } : {}}
          onClick={() =>
            canScrollRight && handlePageClick(currentPageIndex + 1)
          }
          disabled={!canScrollRight}
        >
          <span className='text-sm font-medium'>Next</span>
          <ChevronRight className='w-4 h-4 ml-1' />
        </motion.button>
      </div>

      {/* Desktop and Tablet Pagination */}
      <div className='hidden sm:flex items-center justify-between'>
        <div className='flex-1 flex items-center overflow-x-auto scrollbar-hide pb-2'>
          <div className='flex items-center space-x-2 m-1'>
            {form.pages.map((page, index) => {
              if (!page) return null;

              const isActive = index === currentPageIndex;

              return (
                <motion.button
                  key={page.id || `page-${index}`}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap text-sm font-medium ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-sm'
                  }`}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePageClick(index)}
                >
                  PAGE {index + 1}
                </motion.button>
              );
            })}

            {form.pages.length > 0 && (
              <motion.button
                key='thank-you'
                className={`px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap text-sm font-medium ${
                  currentPageIndex === form.pages.length
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-sm'
                }`}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePageClick(form.pages.length)}
              >
                THANK YOU PAGE
              </motion.button>
            )}
          </div>
        </div>

        {!isPreviewMode && !ThankYouPage && (
          <div className='ml-4'>
            <AddNewPageButton className='cursor-pointer' />
          </div>
        )}
      </div>

      {/* Mobile Add Page Button */}
      {!isPreviewMode && !ThankYouPage && (
        <div className='sm:hidden mt-2'>
          <AddNewPageButton className='cursor-pointer' />
        </div>
      )}
    </div>
  );
}
