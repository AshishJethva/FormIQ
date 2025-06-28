'use client';

import { useDrop } from 'react-dnd';
import { ItemTypes } from '@/types/dragTypes';
import { FieldType } from '@/types/form';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DropZoneProps {
  index: number;
  pageId: string;
  onDrop: (type: FieldType, index: number, pageId: string) => void;
}

export default function DropZone({ index, pageId, onDrop }: DropZoneProps) {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ItemTypes.FORM_ELEMENT,
      canDrop: () => !!pageId,
      drop: (item: { fieldType: FieldType }, monitor) => {
        if (!monitor.didDrop()) {
          onDrop(item.fieldType, index, pageId);
        }
        return undefined;
      },
      collect: monitor => ({
        isOver: !!monitor.isOver({ shallow: true }),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [index, pageId, onDrop]
  );

  return (
    <div
      ref={drop as unknown as React.RefObject<HTMLDivElement>}
      className={`relative transition-all duration-300 ease-in-out ${
        isOver && canDrop
          ? 'h-16 sm:h-12 opacity-100'
          : 'h-3 sm:h-2 opacity-0 hover:opacity-100 hover:h-10 sm:hover:h-8'
      }`}
    >
      <AnimatePresence>
        {(isOver && canDrop) || (!isOver && canDrop) ? (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{
              opacity: isOver && canDrop ? 1 : 0.3,
              scaleY: 1,
            }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`absolute inset-0 mx-2 sm:mx-4 rounded-lg border-2 border-dashed flex items-center justify-center transition-all duration-200 ${
              isOver && canDrop
                ? 'border-blue-400 bg-blue-50/70 shadow-sm'
                : 'border-gray-300 bg-gray-50/50 hover:border-blue-300 hover:bg-blue-50/40'
            }`}
          >
            <motion.div
              className='flex items-center text-xs sm:text-sm text-gray-500 font-medium'
              animate={isOver && canDrop ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Plus className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
              <span>Drop here</span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
