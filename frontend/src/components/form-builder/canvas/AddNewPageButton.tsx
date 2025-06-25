'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addPage,
  setCurrentPageIndex,
} from '@/redux/slices/formBuilder/formBuilderSlice';
import { toast } from 'sonner';
import { RootState } from '@/redux/store';

interface AddNewPageButtonProps {
  isInline?: boolean;
  className?: string;
}

export default function AddNewPageButton({
  isInline = false,
  className = '',
}: AddNewPageButtonProps) {
  const dispatch = useDispatch();
  const form = useSelector((state: RootState) => state.formBuilder.form);

  const handleAddPage = () => {
    if (!form) return;

    // Add the new page
    dispatch(addPage());

    // Navigate to the new page (will be at the end)
    const newPageIndex = form.pages.length; // Index of the new page
    dispatch(setCurrentPageIndex(newPageIndex));

    toast.success(`Page ${newPageIndex + 1} added successfully`);
  };

  if (isInline) {
    return (
      <motion.div
        className={`text-center py-4 sm:py-3 px-2 sm:px-4 border-dashed border-2 border-gray-300 rounded-lg text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all duration-200 cursor-pointer text-sm sm:text-base font-medium ${className}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleAddPage}
      >
        <Plus className='w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 sm:mb-0 sm:inline sm:mr-2' />
        <span className='block sm:inline'>ADD NEW PAGE</span>
      </motion.div>
    );
  }

  return (
    <motion.button
      className={`flex items-center justify-center space-x-2 w-full sm:w-auto mb-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base font-medium ${className}`}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleAddPage}
    >
      <Plus className='w-4 h-4 sm:w-5 sm:h-5' />
      <span>ADD NEW PAGE</span>
    </motion.button>
  );
}
