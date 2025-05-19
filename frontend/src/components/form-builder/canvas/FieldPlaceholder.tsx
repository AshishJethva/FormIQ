// src/components/form-builder/canvas/FieldPlaceholder.tsx
'use client';

import { useDrop } from 'react-dnd';
import { ItemTypes } from '@/types/dragTypes';
import { FieldType } from '@/types/form';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle } from 'lucide-react';

interface FieldPlaceholderProps {
  index: number;
  onDrop: (fieldType: FieldType, index: number) => void;
}

export default function FieldPlaceholder({
  index,
  onDrop,
}: FieldPlaceholderProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: [ItemTypes.FORM_ELEMENT, ItemTypes.FORM_FIELD],
    drop: (item: any) => {
      if (item.type === ItemTypes.FORM_ELEMENT && item.fieldType) {
        onDrop(item.fieldType, index);
        return { dropped: true };
      }
      return undefined;
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  const isActive = isOver && canDrop;

  // Animation variants
  const containerVariants = {
    inactive: { height: 4 },
    active: {
      height: 40,
      transition: { type: 'spring', stiffness: 500, damping: 30 },
    },
  };

  const indicatorVariants = {
    inactive: { opacity: 0, scale: 0 },
    active: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 25,
        delay: 0.05,
      },
    },
  };

  const plusVariants = {
    inactive: { scale: 0, opacity: 0 },
    active: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 25,
        delay: 0.1,
      },
    },
  };

  return (
    <motion.div
      ref={drop}
      className='w-full transition-all flex items-center justify-center overflow-hidden'
      variants={containerVariants}
      initial='inactive'
      animate={isActive ? 'active' : 'inactive'}
      layout
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            className='flex items-center space-x-2'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className='w-full h-1 bg-blue-400 rounded-full'
              variants={indicatorVariants}
              style={{ width: '100px' }}
            />
            <motion.div
              className='flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full text-white'
              variants={plusVariants}
            >
              <PlusCircle size={14} />
            </motion.div>
            <motion.div
              className='w-full h-1 bg-blue-400 rounded-full'
              variants={indicatorVariants}
              style={{ width: '100px' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
