// // src/components/form-builder/canvas/DraggableField.tsx
// 'use client';

// import { useRef } from 'react';
// import { useDrag, useDrop } from 'react-dnd';
// import { motion, AnimatePresence } from 'framer-motion';
// import { MoreHorizontal, Trash2, Copy, Settings } from 'lucide-react';
// import { ItemTypes } from '@/types/dragTypes';
// import { Field } from '@/types/form';

// interface DraggableFieldProps {
//   field: Field;
//   index: number;
//   pageIndex: number;
//   isSelected: boolean;
//   isHovered: boolean;
//   isPreviewMode: boolean;
//   children: React.ReactNode;
//   moveField: (dragIndex: number, hoverIndex: number) => void;
//   onSettingsClick: (e: React.MouseEvent) => void;
//   onDeleteField: (e: React.MouseEvent) => void;
//   onDuplicateField: (e: React.MouseEvent) => void;
//   onFieldClick: () => void;
//   onHover: (id: string | null) => void;
// }

// export default function DraggableField({
//   field,
//   index,
//   pageIndex,
//   isSelected,
//   isHovered,
//   isPreviewMode,
//   children,
//   moveField,
//   onSettingsClick,
//   onDeleteField,
//   onDuplicateField,
//   onFieldClick,
//   onHover,
// }: DraggableFieldProps) {
//   const ref = useRef<HTMLDivElement>(null);

//   // Configure drag
//   const [{ isDragging }, drag] = useDrag({
//     type: ItemTypes.FORM_FIELD,
//     item: () => {
//       return { id: field.id, index, pageIndex, type: ItemTypes.FORM_FIELD };
//     },
//     collect: monitor => ({
//       isDragging: monitor.isDragging(),
//     }),
//   });

//   // Configure drop
//   const [{ handlerId }, drop] = useDrop({
//     accept: ItemTypes.FORM_FIELD,
//     collect(monitor) {
//       return {
//         handlerId: monitor.getHandlerId(),
//       };
//     },
//     hover(item: any, monitor) {
//       if (!ref.current) {
//         return;
//       }

//       // Only handle items from the same page
//       if (item.pageIndex !== pageIndex) {
//         return;
//       }

//       const dragIndex = item.index;
//       const hoverIndex = index;

//       // Don't replace items with themselves
//       if (dragIndex === hoverIndex) {
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
//       const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

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
//       moveField(dragIndex, hoverIndex);

//       // Note: we're mutating the monitor item here!
//       // Generally it's better to avoid mutations,
//       // but it's good here for the sake of performance
//       // to avoid expensive index searches.
//       item.index = hoverIndex;
//     },
//   });

//   // Connect drag and drop refs
//   drag(drop(ref));

//   // Styles for dragging
//   const opacity = isDragging ? 0.4 : 1;

//   return (
//     <motion.div
//       ref={ref}
//       style={{ opacity }}
//       data-handler-id={handlerId}
//       className={`relative group cursor-move py-4 px-4 rounded-md border ${
//         isSelected
//           ? 'border-blue-500'
//           : 'border-transparent hover:border-gray-300'
//       } ${isDragging ? 'shadow-md' : ''}`}
//       onClick={onFieldClick}
//       onMouseEnter={() => onHover(field.id)}
//       onMouseLeave={() => onHover(null)}
//       initial={false}
//       animate={{
//         boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none',
//       }}
//       transition={{ duration: 0.2 }}
//     >
//       {!isPreviewMode && (
//         <AnimatePresence>
//           {(isHovered || isSelected) && (
//             <motion.div
//               initial={{ opacity: 0, y: -10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -10 }}
//               transition={{ duration: 0.15 }}
//               className='absolute right-2 top-2 flex space-x-1'
//             >
//               <motion.button
//                 className='w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600'
//                 onClick={onSettingsClick}
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 <Settings className='w-4 h-4' />
//               </motion.button>
//               <motion.button
//                 className='w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600'
//                 onClick={onDuplicateField}
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 <Copy className='w-4 h-4' />
//               </motion.button>
//               <motion.button
//                 className='w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-red-100 rounded-full text-gray-600 hover:text-red-600'
//                 onClick={onDeleteField}
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 <Trash2 className='w-4 h-4' />
//               </motion.button>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       )}

//       {/* Draggable Handle */}
//       {!isPreviewMode && (
//         <div className='absolute left-2 inset-y-0 flex items-center cursor-grab'>
//           <div className='w-6 h-10 flex flex-col justify-center items-center opacity-40 group-hover:opacity-100'>
//             <MoreHorizontal className='w-4 h-4' />
//           </div>
//         </div>
//       )}

//       {/* Content with left padding for the handle */}
//       <div className={`ml-6 ${isPreviewMode ? 'ml-0' : ''}`}>{children}</div>
//     </motion.div>
//   );
// }

// src/components/form-builder/canvas/DraggableField.tsx
'use client';

import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Trash2, Copy, Settings } from 'lucide-react';
import { ItemTypes } from '@/types/dragTypes';
import { Field } from '@/types/form';

interface DraggableFieldProps {
  field: Field;
  index: number;
  pageId: string;
  isSelected: boolean;
  isHovered: boolean;
  isPreviewMode: boolean;
  children: React.ReactNode;
  moveField: (dragIndex: number, hoverIndex: number) => void;
  onSettingsClick: (e: React.MouseEvent) => void;
  onDeleteField: (e: React.MouseEvent) => void;
  onDuplicateField: (e: React.MouseEvent) => void;
  onFieldClick: () => void;
  onHover: (id: string | null) => void;
}

export default function DraggableField({
  field,
  index,
  pageId,
  isSelected,
  isHovered,
  isPreviewMode,
  children,
  moveField,
  onSettingsClick,
  onDeleteField,
  onDuplicateField,
  onFieldClick,
  onHover,
}: DraggableFieldProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Configure drag
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.FORM_FIELD,
    item: () => {
      return { id: field.id, index, pageId, type: ItemTypes.FORM_FIELD };
    },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Configure drop
  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.FORM_FIELD,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: any, monitor) {
      if (!ref.current) {
        return;
      }

      // Only handle items from the same page
      if (item.pageId !== pageId) {
        return;
      }

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
      moveField(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  // Connect drag and drop refs
  drag(drop(ref));

  // Styles for dragging
  const opacity = isDragging ? 0.4 : 1;

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      data-handler-id={handlerId}
      className={`relative group cursor-move py-4 px-4 rounded-md border ${
        isSelected
          ? 'border-blue-500'
          : 'border-transparent hover:border-gray-300'
      } ${isDragging ? 'shadow-md' : ''}`}
      onClick={onFieldClick}
      onMouseEnter={() => onHover(field.id)}
      onMouseLeave={() => onHover(null)}
      initial={false}
      animate={{
        boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none',
      }}
      transition={{ duration: 0.2 }}
    >
      {!isPreviewMode && (
        <AnimatePresence>
          {(isHovered || isSelected) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className='absolute right-2 top-2 flex space-x-1'
            >
              <motion.button
                className='w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600'
                onClick={onSettingsClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className='w-4 h-4' />
              </motion.button>
              <motion.button
                className='w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600'
                onClick={onDuplicateField}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Copy className='w-4 h-4' />
              </motion.button>
              <motion.button
                className='w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-red-100 rounded-full text-gray-600 hover:text-red-600'
                onClick={onDeleteField}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Trash2 className='w-4 h-4' />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Draggable Handle */}
      {!isPreviewMode && (
        <div className='absolute left-2 inset-y-0 flex items-center cursor-grab'>
          <div className='w-6 h-10 flex flex-col justify-center items-center opacity-40 group-hover:opacity-100'>
            <MoreHorizontal className='w-4 h-4' />
          </div>
        </div>
      )}

      {/* Content with left padding for the handle */}
      <div className={`ml-6 ${isPreviewMode ? 'ml-0' : ''}`}>{children}</div>
    </motion.div>
  );
}
