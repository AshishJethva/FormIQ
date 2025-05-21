// src/components/form-builder/canvas/DraggableFormField.tsx
'use client';

import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ItemTypes } from '@/types/dragTypes';
import { Field } from '@/types/form';
import { Settings, Copy, Trash } from 'lucide-react';

interface DraggableFormFieldProps {
  field: Field;
  index: number;
  pageId: string;
  isSelected: boolean;
  isPreviewMode: boolean;
  onMove: (dragIndex: number, hoverIndex: number, pageId: string) => void;
  onClick: () => void;
  onSettingsClick: (e: React.MouseEvent) => void;
  onDeleteClick: (e: React.MouseEvent) => void;
  onDuplicateClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}

interface DragItem {
  index: number;
  id: string;
  pageId: string;
  type: string;
}

const DraggableFormField: React.FC<DraggableFormFieldProps> = ({
  field,
  index,
  pageId,
  isSelected,
  isPreviewMode,
  onMove,
  onClick,
  onSettingsClick,
  onDeleteClick,
  onDuplicateClick,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Set up drag source
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.FORM_FIELD,
    item: { type: ItemTypes.FORM_FIELD, id: field.id, index, pageId },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isPreviewMode,
  });

  // Set up drop target
  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.FORM_FIELD,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Only handle items from the same page
      if (item.pageId !== pageId) {
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

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      onMove(dragIndex, hoverIndex, pageId);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
    canDrop: () => true,
  });

  // Initialize drag and drop refs
  drag(drop(ref));

  const opacity = isDragging ? 0.5 : 1;

  return (
    <div
      ref={ref}
      className={`px-4 py-3 mb-1 ${
        isPreviewMode ? '' : 'cursor-move'
      } transition-all ${
        isSelected
          ? 'bg-blue-50 border-l-4 border-blue-500'
          : 'hover:bg-gray-50 border-l-4 border-transparent'
      }`}
      style={{ opacity }}
      onClick={onClick}
      data-handler-id={handlerId}
    >
      <div className='relative'>
        {children}

        {/* Field Controls - Only visible when not in preview mode */}
        {!isPreviewMode && (
          <div className='absolute -right-1 top-0 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 hover:opacity-100'>
            <button
              className='bg-gray-100 hover:bg-gray-200 p-1.5 rounded text-gray-600 hover:text-gray-800'
              onClick={onSettingsClick}
              title='Settings'
            >
              <Settings size={14} />
            </button>
            <button
              className='bg-gray-100 hover:bg-gray-200 p-1.5 rounded text-gray-600 hover:text-gray-800'
              onClick={onDuplicateClick}
              title='Duplicate'
            >
              <Copy size={14} />
            </button>
            <button
              className='bg-gray-100 hover:bg-red-100 p-1.5 rounded text-gray-600 hover:text-red-500'
              onClick={onDeleteClick}
              title='Delete'
            >
              <Trash size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggableFormField;

// // src/components/form-builder/canvas/DraggableFormField.tsx
// import { useRef } from 'react';
// import { useDrag, useDrop } from 'react-dnd';
// import { Field } from '@/types/form';
// import { ItemTypes } from '@/types/dragTypes';
// import { Grip, Settings, Trash2, Copy } from 'lucide-react';
// import { motion } from 'framer-motion';

// interface DraggableFormFieldProps {
//   field: Field;
//   index: number;
//   pageId: string;
//   isSelected: boolean;
//   isPreviewMode: boolean;
//   children: React.ReactNode;
//   onMove: (dragIndex: number, hoverIndex: number, pageId: string) => void;
//   onClick: () => void;
//   onSettingsClick: (e: React.MouseEvent) => void;
//   onDeleteClick: (e: React.MouseEvent) => void;
//   onDuplicateClick: (e: React.MouseEvent) => void;
// }

// interface DragItem {
//   id: string;
//   index: number;
//   pageId: string;
//   type: string;
// }

// export default function DraggableFormField({
//   field,
//   index,
//   pageId,
//   isSelected,
//   isPreviewMode,
//   children,
//   onMove,
//   onClick,
//   onSettingsClick,
//   onDeleteClick,
//   onDuplicateClick,
// }: DraggableFormFieldProps) {
//   const ref = useRef<HTMLDivElement>(null);

//   // Set up the drag source
//   const [{ isDragging }, drag, preview] = useDrag(() => ({
//     type: ItemTypes.FORM_FIELD,
//     item: { id: field.id, index, pageId, type: ItemTypes.FORM_FIELD },
//     canDrag: !isPreviewMode,
//     collect: monitor => ({
//       isDragging: !!monitor.isDragging(),
//     }),
//   }));

//   // Set up the drop target
//   const [{ isOver, canDrop }, drop] = useDrop(() => ({
//     accept: ItemTypes.FORM_FIELD,
//     canDrop: () => true, // Explicitly define canDrop function
//     hover(item: DragItem, monitor) {
//       if (!ref.current) {
//         return;
//       }

//       const dragIndex = item.index;
//       const hoverIndex = index;

//       // Don't replace items with themselves
//       if (dragIndex === hoverIndex) {
//         return;
//       }

//       // Only handle items from the same page
//       if (item.pageId !== pageId) {
//         return;
//       }

//       // Determine rectangle on screen
//       const hoverBoundingRect = ref.current?.getBoundingClientRect();

//       // Get vertical middle
//       const hoverMiddleY =
//         (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

//       // Determine mouse position
//       const clientOffset = monitor.getClientOffset();

//       // Get pixels to the top
//       const hoverClientY = clientOffset
//         ? clientOffset.y - hoverBoundingRect.top
//         : 0;

//       // Only perform the move when the mouse has crossed half of the items height
//       // When dragging downwards, only move when the cursor is below 50%
//       // When dragging upwards, only move when the cursor is above 50%

//       // Dragging downwards
//       if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
//         return;
//       }

//       // Dragging upwards
//       if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
//         return;
//       }

//       // Time to actually perform the action
//       onMove(dragIndex, hoverIndex, pageId);

//       // Note: we're mutating the monitor item here!
//       // Generally it's better to avoid mutations,
//       // but it's good here for the sake of performance
//       // to avoid expensive index searches.
//       item.index = hoverIndex;
//     },
//     collect: monitor => ({
//       isOver: !!monitor.isOver(),
//       canDrop: !!monitor.canDrop(),
//     }),
//   }));

//   // Connect the drag and drop refs
//   drag(drop(ref));

//   // Apply opacity if dragging
//   const opacity = isDragging ? 0.4 : 1;
//   const cursor = isPreviewMode ? 'default' : 'move';

//   // Style for the hover state
//   const hoverStyle = isOver && canDrop ? 'bg-blue-50' : '';

//   return (
//     <div
//       ref={preview}
//       className={`relative my-2 select-none ${opacity} ${cursor}`}
//       onClick={onClick}
//       style={{ opacity }}
//     >
//       <motion.div
//         initial={{ x: 0 }}
//         animate={{
//           x: 0,
//           boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
//         }}
//         transition={{ duration: 0.2 }}
//         className={`px-4 py-3 rounded-md border ${
//           isSelected ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'
//         } ${hoverStyle}`}
//       >
//         {!isPreviewMode && (
//           <div
//             ref={ref}
//             className='absolute left-0 top-0 bottom-0 flex items-center justify-center px-1 cursor-grab'
//           >
//             <Grip className='h-4 w-4 text-gray-500' />
//           </div>
//         )}

//         <div className='ml-4'>{children}</div>

//         {/* Field Actions */}
//         {!isPreviewMode && (
//           <div className='absolute right-2 top-2 flex space-x-1'>
//             <button
//               className='p-1 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors'
//               onClick={onSettingsClick}
//               title='Settings'
//             >
//               <Settings className='h-4 w-4' />
//             </button>
//             <button
//               className='p-1 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors'
//               onClick={onDuplicateClick}
//               title='Duplicate'
//             >
//               <Copy className='h-4 w-4' />
//             </button>
//             <button
//               className='p-1 rounded-md hover:bg-gray-200 text-gray-500 hover:text-red-500 transition-colors'
//               onClick={onDeleteClick}
//               title='Delete'
//             >
//               <Trash2 className='h-4 w-4' />
//             </button>
//           </div>
//         )}
//       </motion.div>
//     </div>
//   );
// }
