// src/components/form-builder/canvas/AddNewPageButton.tsx
'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addPage } from '@/redux/slices/formBuilderSlice';
import { toast } from 'sonner';

interface AddNewPageButtonProps {
  isInline?: boolean;
  className?: string;
}

export default function AddNewPageButton({
  isInline = false,
  className = '',
}: AddNewPageButtonProps) {
  const dispatch = useDispatch();

  const handleAddPage = () => {
    dispatch(addPage());
    toast.success('New page added');
  };

  if (isInline) {
    return (
      <motion.div
        className={`text-center py-6 border-dashed border-2 border-gray-300 rounded text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors cursor-pointer ${className}`}
        whileHover={{
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          scale: 1.01,
        }}
        whileTap={{ scale: 0.99 }}
        onClick={handleAddPage}
      >
        + ADD NEW PAGE HERE
      </motion.div>
    );
  }

  return (
    <motion.button
      className={`flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleAddPage}
    >
      <Plus className='w-5 h-5' />
      <span>ADD NEW PAGE</span>
    </motion.button>
  );
}
