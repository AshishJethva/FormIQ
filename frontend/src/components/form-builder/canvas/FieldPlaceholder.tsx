'use client';

import { useState } from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '@/types/dragTypes';
import { FieldType } from '@/types/form';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface FieldPlaceholderProps {
  index: number;
  pageId: string;
  onDrop: (type: FieldType, index: number) => void;
}

export default function FieldPlaceholder({
  index,
  onDrop,
}: FieldPlaceholderProps) {
  const [isHovered, setIsHovered] = useState(false);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.FORM_ELEMENT, ItemTypes.FORM_FIELD],
    canDrop: () => true,
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    drop: (item: any) => {
      if (item && item.type === ItemTypes.FORM_ELEMENT && item.fieldType) {
        onDrop(item.fieldType, index);
        return { dropped: true };
      }

      if (item && item.type === ItemTypes.FORM_FIELD) {
        return undefined;
      }

      return undefined;
    },
  });

  const showPlaceholder = isHovered || (isOver && canDrop);

  if (!showPlaceholder) {
    return (
      <div
        ref={drop as any}
        className='h-6 sm:h-4 w-full transition-all duration-200'
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    );
  }

  return (
    <motion.div
      ref={drop as any}
      className={`h-12 sm:h-10 w-full mx-2 sm:mx-4 rounded-lg border-2 border-dashed flex items-center justify-center transition-all duration-200 ${
        isOver && canDrop
          ? 'border-blue-400 bg-blue-50/70'
          : 'border-gray-300 bg-gray-50/50 hover:border-blue-300'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      exit={{ opacity: 0, scaleY: 0 }}
    >
      <div className='flex items-center text-xs sm:text-sm text-gray-500 font-medium'>
        <Plus className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
        <span>Drop field here</span>
      </div>
    </motion.div>
  );
}
