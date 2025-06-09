// src/components/form-builder/canvas/FormPagination.tsx
'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { motion } from 'framer-motion';
import { setCurrentPage } from '@/redux/slices/formBuilderSlice';
import AddNewPageButton from './AddNewPageButton';
import ThankYouPage from './ThankYouPage';

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

  return (
    <div className='flex items-center border-t border-gray-200 my-4 pt-2 w-[768px] mx-auto'>
      <div className='flex-1 flex items-center overflow-x-auto pb-2'>
        {form.pages.map((page, index) => {
          if (!page) return null;

          const isActive = index === currentPageIndex;

          return (
            <motion.button
              key={page.id || `page-${index}`}
              className={`px-4 py-2 mx-1 rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageClick(index)}
            >
              PAGE {index + 1}
            </motion.button>
          );
        })}

        {form.pages.length > 0 && (
          <motion.button
            key='thank-you'
            className={`px-4 py-2 mx-1 rounded-md transition-colors ${
              currentPageIndex === form.pages.length
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePageClick(form.pages.length)}
          >
            THANK YOU PAGE
          </motion.button>
        )}
      </div>

      {!isPreviewMode && !ThankYouPage && <AddNewPageButton className='ml-2 cursor-pointer' />}
    </div>
  );
}
