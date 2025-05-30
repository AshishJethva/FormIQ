// src/components/form-builder/canvas/AddNewPageButton.tsx
'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addPage, setCurrentPageIndex } from '@/redux/slices/formBuilderSlice';
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

    console.log('🆕 Adding new page. Current pages:', form.pages.length);

    // Add the new page
    dispatch(addPage());

    // Navigate to the new page (will be at the end)
    const newPageIndex = form.pages.length; // Index of the new page
    dispatch(setCurrentPageIndex(newPageIndex));

    console.log('✅ New page added and navigated to index:', newPageIndex);
    toast.success(`Page ${newPageIndex + 1} added successfully`);
  };

  if (isInline) {
    return (
      <motion.div
        className={`text-center py-3 border-dashed border-2 border-gray-300 rounded text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors cursor-pointer ${className}`}
        whileTap={{ scale: 0.99 }}
        onClick={handleAddPage}
      >
        + ADD NEW PAGE
      </motion.div>
    );
  }

  return (
    <motion.button
      className={`flex items-center space-x-2 mb-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors ${className}`}
      // whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleAddPage}
    >
      <Plus className='w-5 h-5' />
      <span>ADD NEW PAGE</span>
    </motion.button>
  );
}
