// src/components/form-builder/canvas/DraggableField.tsx
'use client';

import { useRef, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { ItemTypes } from '@/types/dragTypes';
import { Field } from '@/types/form';
import { Settings, Trash2, GripVertical, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DraggableFieldProps {
  field: Field;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  isPreviewMode: boolean;
  children: React.ReactNode;
  onSettingsClick: (e: React.MouseEvent, fieldId: string) => void;
  onDeleteField: (e: React.MouseEvent, fieldId: string) => void;
  onDuplicateField: (e: React.MouseEvent, fieldId: string) => void;
  onFieldClick: (fieldId: string) => void;
  onHover: (fieldId: string | null) => void;
  moveField: (dragIndex: number, hoverIndex: number) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export default function DraggableField({
  field,
  index,
  isSelected,
  isHovered,
  isPreviewMode,
  children,
  onSettingsClick,
  onDeleteField,
  onDuplicateField,
  onFieldClick,
  onHover,
  moveField,
}: DraggableFieldProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Set up drag source with preview
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemTypes.FORM_FIELD,
    item: () => ({ id: field.id, index, type: ItemTypes.FORM_FIELD }),
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isPreviewMode,
  });

  // Use empty image as drag preview to eliminate the default browser preview
  useEffect(() => {
    dragPreview(getEmptyImage());
  }, [dragPreview]);

  // Set up drop target
  const [{ handlerId, isOver }, drop] = useDrop({
    accept: [ItemTypes.FORM_FIELD, ItemTypes.FORM_ELEMENT],
    collect: monitor => ({
      handlerId: monitor.getHandlerId(),
      isOver: monitor.isOver(),
    }),
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }

      // Handle moving existing fields
      if (item.type === ItemTypes.FORM_FIELD) {
        const dragIndex = item.index;
        const hoverIndex = index;

        // Don't replace items with themselves
        if (dragIndex === hoverIndex) {
          return;
        }

        // Determine rectangle on screen
        const hoverBoundingRect = ref.current?.getBoundingClientRect();

        // Get vertical middle
        const hoverMiddleY =
          (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

        // Determine mouse position
        const clientOffset = monitor.getClientOffset();

        // Get pixels to the top
        const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

        // Only perform the move when the mouse has crossed half of the item's height
        // When dragging downwards, only move when the cursor is below 50%
        // When dragging upwards, only move when the cursor is above 50%
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
          return;
        }

        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
          return;
        }

        // Time to actually perform the action
        moveField(dragIndex, hoverIndex);

        // Note: we're mutating the monitor item here!
        // Generally it's better to avoid mutations,
        // but it's good here for performance reasons
        item.index = hoverIndex;
      }
    },
  });

  // Connect the drag and drop refs
  drop(ref);

  // Apply transparency style when dragging
  const opacity = isDragging ? 0.4 : 1;

  // Highlight drop zone when hovering with a different element
  const borderStyle = isOver ? 'border-dashed border-2 border-blue-500' : '';

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`py-4 px-3 relative transition-colors bg-white rounded-md ${
        isSelected && !isPreviewMode
          ? 'outline-2 outline-blue-500 z-10 shadow-md'
          : isHovered && !isPreviewMode
          ? 'shadow-sm'
          : ''
      } ${borderStyle}`}
      onClick={() => onFieldClick(field.id)}
      onMouseEnter={() => !isPreviewMode && onHover(field.id)}
      onMouseLeave={() => !isPreviewMode && onHover(null)}
      data-handler-id={handlerId}
      layout
    >
      {children}

      {/* Inline field actions - only shown on hover or when selected */}
      <AnimatePresence>
        {!isPreviewMode && (isHovered || isSelected) && (
          <motion.div
            className='absolute right-2 top-2 flex space-x-1'
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{
              duration: 0.2,
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
          >
            <motion.button
              className='w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-500 hover:bg-gray-100 transition-colors cursor-grab shadow-sm'
              onClick={e => e.stopPropagation()}
              title='Move field'
              ref={drag}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <GripVertical size={16} />
            </motion.button>
            <motion.button
              className='w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-500 hover:bg-gray-100 transition-colors shadow-sm'
              onClick={e => onDuplicateField(e, field.id)}
              title='Duplicate field'
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Copy size={16} />
            </motion.button>
            <motion.button
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors shadow-sm ${
                isSelected && field.propertiesPanelOpen
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'
              }`}
              onClick={e => {
                e.stopPropagation();
                onSettingsClick(e, field.id);
                // Debug log
                console.log('Settings clicked for field', field.id);
              }}
              title='Field settings'
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings size={16} />
            </motion.button>
            <motion.button
              className='w-8 h-8 flex items-center justify-center bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors shadow-sm'
              onClick={e => onDeleteField(e, field.id)}
              title='Delete field'
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 size={16} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
