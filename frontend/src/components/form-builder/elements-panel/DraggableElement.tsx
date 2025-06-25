'use client';

import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { ItemTypes } from '@/types/dragTypes';
import { FieldType } from '@/types/form';
import { ChevronsRight, Sparkles } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addField } from '@/redux/slices/formBuilder/formBuilderSlice';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface DraggableElementProps {
  icon: React.ReactNode;
  label: string;
  type: FieldType;
  isActive?: boolean;
}

export default function DraggableElement({
  icon,
  label,
  type,
  isActive = false,
}: DraggableElementProps) {
  const dispatch = useDispatch();
  const [isPressed, setIsPressed] = useState(false);

  // Handle simple click on element to add at the end
  const handleClick = () => {
    dispatch(addField({ type }));
    toast.success(`${label} field added`, {
      icon: <Sparkles className='w-4 h-4' />,
      duration: 2000,
    });
  };

  // Setup drag functionality
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: ItemTypes.FORM_ELEMENT,
    item: { type: ItemTypes.FORM_ELEMENT, fieldType: type },
    end: (item, monitor) => {
      // If the drop was not successful, add at the end
      const didDrop = monitor.didDrop();
      if (!didDrop) {
        // Only add the field when clicking, not when dropping elsewhere
      }
    },
    collect: monitor => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Use empty image as preview
  useEffect(() => {
    preview(getEmptyImage());
  }, [preview]);

  // Handle touch events for mobile feedback
  const handleTouchStart = () => setIsPressed(true);
  const handleTouchEnd = () => setIsPressed(false);

  return (
    <motion.div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      className={`
        group relative flex items-center px-3 py-2.5 sm:px-4 sm:py-3 cursor-pointer 
        rounded-lg mx-1 sm:mx-2 transition-all duration-200 select-none
        ${
          isActive
            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
            : 'hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 hover:text-white hover:shadow-lg'
        }
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
        ${isPressed ? 'scale-95' : 'scale-100'}
        backdrop-blur-sm border border-transparent hover:border-white/20
      `}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      whileHover={{
        scale: 1.02,
        x: 4,
      }}
      whileTap={{
        scale: 0.98,
        x: 2,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
    >
      {/* Glow effect on hover */}
      <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-orange-500/0 to-red-500/0 group-hover:from-orange-500/20 group-hover:to-red-500/20 transition-all duration-300 -z-10 blur-sm' />

      {/* Icon container */}
      <motion.div
        className='w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center mr-3 rounded-lg bg-white/10 group-hover:bg-white/20 transition-all duration-200'
        whileHover={{ rotate: 5 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        <div className='text-gray-300 group-hover:text-white transition-colors duration-200'>
          {icon}
        </div>
      </motion.div>

      {/* Label */}
      <span className='flex-1 font-medium text-sm sm:text-base text-gray-200 group-hover:text-white transition-colors duration-200'>
        {label}
      </span>

      {/* Arrow indicator */}
      <motion.div
        className='opacity-0 group-hover:opacity-100 transition-all duration-200'
        whileHover={{ x: 2 }}
      >
        <ChevronsRight
          size={16}
          className='text-gray-400 group-hover:text-white/80 transition-colors duration-200'
        />
      </motion.div>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className='absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-lg'
        />
      )}

      {/* Drag indicator for larger screens */}
      <div className='hidden lg:block absolute left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-transparent via-white/30 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200' />

      {/* Touch feedback ripple for mobile */}
      {isPressed && (
        <motion.div
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className='absolute inset-0 rounded-lg bg-white/20 pointer-events-none lg:hidden'
        />
      )}
    </motion.div>
  );
}
