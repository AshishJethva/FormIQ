// src/components/form-builder/elements-panel/DraggableElement.tsx
'use client';

import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { ItemTypes } from '@/types/dragTypes';
import { FieldType } from '@/types/form';
import { ChevronsRight } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addField } from '@/redux/slices/formBuilderSlice';
import { useEffect } from 'react';
import { toast } from 'sonner';

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

  // Handle simple click on element to add at the end
  const handleClick = () => {
    dispatch(addField({ type }));
    toast.success(`${label} field added`);
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

  return (
    <div
      ref={drag}
      className={`
        flex items-center px-4 py-3 cursor-pointer hover:bg-[#F76101] hover:text-white transition-colors
        ${isActive ? 'bg-orange-500' : 'bg-transparent'}
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
      onClick={handleClick}
    >
      <div className='w-6 h-6 flex items-center justify-center mr-3 text-gray-400'>
        {icon}
      </div>
      <span className='flex-1'>{label}</span>
      <ChevronsRight size={14} className='text-gray-500' />
    </div>
  );
}
