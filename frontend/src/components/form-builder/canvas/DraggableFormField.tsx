'use client';

import React, { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ItemTypes } from '@/types/dragTypes';
import { Field } from '@/types/form';
import {
  Settings,
  Copy,
  Trash,
  GripVertical,
  MoreVertical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isHovered, setIsHovered] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
  const [{ handlerId, isOver }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: string | symbol | null; isOver: boolean }
  >({
    accept: ItemTypes.FORM_FIELD,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
        isOver: monitor.isOver(),
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

      item.index = hoverIndex;
    },
    canDrop: () => true,
  });

  // Initialize drag and drop refs
  drag(drop(ref));

  const handleMobileMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMobileMenu(!showMobileMenu);
  };

  const handleActionClick =
    (action: (e: React.MouseEvent) => void) => (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowMobileMenu(false);
      action(e);
    };

  return (
    <motion.div
      ref={ref}
      className={`relative group mx-2 sm:mx-4 mb-2 sm:mb-1 rounded-lg transition-all duration-200 ${
        isPreviewMode ? '' : 'cursor-move'
      } ${
        isSelected
          ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-300 shadow-md'
          : isOver || isHovered
          ? 'bg-gradient-to-r from-gray-50 to-gray-100/30 border-2 border-gray-200 shadow-sm'
          : 'bg-white border-2 border-transparent hover:border-gray-200 hover:shadow-sm'
      }`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-handler-id={handlerId}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      whileHover={!isPreviewMode ? { scale: 1.002 } : {}}
    >
      {/* Drag Handle - Desktop */}
      {!isPreviewMode && (
        <motion.div
          className='hidden sm:flex absolute left-0 top-0 bottom-0 w-6 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200'
          initial={{ x: -10 }}
          animate={{ x: isHovered || isSelected ? 0 : -10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <GripVertical className='w-4 h-4 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing' />
        </motion.div>
      )}

      {/* Main Content */}
      <div
        className={`px-3 sm:px-4 py-3 sm:py-3 ${
          !isPreviewMode ? 'sm:pl-10' : ''
        }`}
      >
        {children}
      </div>

      {/* Field Controls */}
      {!isPreviewMode && (
        <>
          {/* Desktop Controls */}
          <AnimatePresence>
            {(isHovered || isSelected) && (
              <motion.div
                key={`desktop-controls-${field.id}`}
                className='hidden sm:flex absolute -right-2 top-2 flex-col space-y-1'
                initial={{ opacity: 0, x: 10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <motion.button
                  className='bg-white hover:bg-blue-50 p-2 rounded-lg text-gray-600 hover:text-blue-600 cursor-pointer shadow-md hover:shadow-lg border border-gray-200 hover:border-blue-300 transition-all duration-200'
                  onClick={handleActionClick(onSettingsClick)}
                  title='Settings'
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Settings size={14} />
                </motion.button>
                <motion.button
                  className='bg-white hover:bg-green-50 p-2 rounded-lg text-gray-600 hover:text-green-600 cursor-pointer shadow-md hover:shadow-lg border border-gray-200 hover:border-green-300 transition-all duration-200'
                  onClick={handleActionClick(onDuplicateClick)}
                  title='Duplicate'
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Copy size={14} />
                </motion.button>
                <motion.button
                  className='bg-white hover:bg-red-50 p-2 rounded-lg text-gray-600 hover:text-red-600 cursor-pointer shadow-md hover:shadow-lg border border-gray-200 hover:border-red-300 transition-all duration-200'
                  onClick={handleActionClick(onDeleteClick)}
                  title='Delete'
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash size={14} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Controls */}
          <div className='sm:hidden absolute top-2 right-2'>
            <motion.button
              className='bg-white/90 backdrop-blur-sm hover:bg-gray-50 p-2 rounded-lg text-gray-600 hover:text-gray-800 cursor-pointer shadow-md border border-gray-200 transition-all duration-200'
              onClick={handleMobileMenuToggle}
              title='More options'
              whileTap={{ scale: 0.9 }}
            >
              <MoreVertical size={16} />
            </motion.button>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
              {showMobileMenu && (
                <React.Fragment key={`mobile-menu-${field.id}`}>
                  {/* Backdrop */}
                  <motion.div
                    key={`backdrop-${field.id}`}
                    className='fixed inset-0 z-40'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowMobileMenu(false)}
                  />

                  {/* Menu */}
                  <motion.div
                    key={`menu-${field.id}`}
                    className='absolute right-0 top-12 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 min-w-[160px] backdrop-blur-lg'
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <motion.button
                      className='w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150'
                      onClick={handleActionClick(onSettingsClick)}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Settings size={16} className='mr-3' />
                      <span className='font-medium'>Settings</span>
                    </motion.button>
                    <motion.button
                      className='w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-150'
                      onClick={handleActionClick(onDuplicateClick)}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Copy size={16} className='mr-3' />
                      <span className='font-medium'>Duplicate</span>
                    </motion.button>
                    <motion.button
                      className='w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-150'
                      onClick={handleActionClick(onDeleteClick)}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Trash size={16} className='mr-3' />
                      <span className='font-medium'>Delete</span>
                    </motion.button>
                  </motion.div>
                </React.Fragment>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Selection Indicator */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            key={`selection-indicator-${field.id}`}
            className='absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-l-lg'
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          />
        )}
      </AnimatePresence>

      {/* Drag Indicator */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            key={`drag-indicator-${field.id}`}
            className='absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-50/30 rounded-lg pointer-events-none'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* Drop Indicator */}
      <AnimatePresence>
        {isOver && !isDragging && (
          <motion.div
            key={`drop-indicator-${field.id}`}
            className='absolute inset-0 border-2 border-dashed border-green-400 bg-green-50/30 rounded-lg pointer-events-none'
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DraggableFormField;
