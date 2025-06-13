// src/components/form-builder/canvas/DropZone.tsx
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
      canDrop: () => !!pageId, // Only allow drop if we have a valid pageId
      drop: (item: { fieldType: FieldType }, monitor) => {
        // Only handle the drop if no child component handled it
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
  ); // Re-create drop handler when dependencies change

  return (
    <div
      ref={drop}
      className={`relative transition-all duration-200 ${
        isOver && canDrop
          ? 'h-12 opacity-100'
          : 'h-2 opacity-0 hover:opacity-100 hover:h-8'
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
            className={`absolute inset-0 mx-4 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${
              isOver && canDrop
                ? 'border-blue-400 bg-blue-50/50'
                : 'border-gray-300 bg-gray-50/30 hover:border-blue-300 hover:bg-blue-50/30'
            }`}
          >
            <div className='flex items-center text-xs text-gray-500'>
              <Plus className='w-3 h-3 mr-1' />
              <span>Drop here</span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
