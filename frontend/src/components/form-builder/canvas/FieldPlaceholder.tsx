// src/components/form-builder/canvas/FieldPlaceholder.tsx
'use client';

import { useState } from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '@/types/dragTypes';
import { FieldType } from '@/types/form';

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

  // Set up drop target
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.FORM_ELEMENT, ItemTypes.FORM_FIELD],
    canDrop: () => true, // Add this line
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    drop: (item: any) => {
      // If it's a new element from the sidebar
      if (item && item.type === ItemTypes.FORM_ELEMENT && item.fieldType) {
        onDrop(item.fieldType, index);
        return { dropped: true };
      }

      // If it's a dragged field within the form
      if (item && item.type === ItemTypes.FORM_FIELD) {
        // Handle in DraggableField component
        return undefined;
      }

      return undefined;
    },
  });

  // Only show placeholder when hovering or when something is being dragged over
  const showPlaceholder = isHovered || (isOver && canDrop);

  if (!showPlaceholder) {
    return (
      <div
        ref={drop as any}
        className='h-4 w-full'
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    );
  }
}
