// src/components/form-builder/canvas/ThankYouPage.tsx
'use client';

import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

export default function ThankYouPage() {
  const form = useSelector((state: RootState) => state.formBuilder.form);

  if (!form) return null;

  return (
    <motion.div
      className='bg-white rounded-md shadow-sm mb-6 min-h-[12rem] py-10'
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className='text-center px-8'>
        <h1 className='text-2xl font-medium text-gray-800 mb-4'>
          {form.settings?.thankyouMessage || 'Thank you for your submission!'}
        </h1>
        <p className='text-gray-600 mb-8'>
          Your form has been submitted successfully.
        </p>
      </div>
    </motion.div>
  );
}
