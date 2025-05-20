// src/components/form-builder/canvas/FormPage.tsx
'use client';

import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, X } from 'lucide-react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '@/types/dragTypes';
import { FieldType, FormPage as FormPageType } from '@/types/form';
import {
  addFieldAtIndex,
  removePage,
  setCurrentPage,
} from '@/redux/slices/formBuilderSlice';
import DraggableField from './DraggableField';
import FieldPlaceholder from './FieldPlaceholder';
import { toast } from 'sonner';

interface FormPageProps {
  page: FormPageType;
  pageIndex: number;
  isLastPage: boolean;
  isActive: boolean;
  onSettingsClick: (e: React.MouseEvent, fieldId: string) => void;
  onDeleteField: (e: React.MouseEvent, fieldId: string) => void;
  onDuplicateField: (e: React.MouseEvent, fieldId: string) => void;
  onFieldClick: (fieldId: string) => void;
  handleLabelClick: (
    e: React.MouseEvent,
    fieldId: string,
    label: string
  ) => void;
  renderField: (fieldId: string, pageIndex: number) => React.ReactNode;
  moveField: (dragIndex: number, hoverIndex: number, pageIndex: number) => void;
}

export default function FormPage({
  page,
  pageIndex,
  isLastPage,
  isActive,
  onSettingsClick,
  onDeleteField,
  onDuplicateField,
  onFieldClick,
  handleLabelClick,
  renderField,
  moveField,
}: FormPageProps) {
  const dispatch = useDispatch();
  const isPreviewMode = useSelector(
    (state: RootState) => state.formBuilder.isPreviewMode
  );
  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const formPageRef = useRef<HTMLDivElement>(null);

  // Add safety check for the page object
  if (!page || !page.fields) {
    console.error('Page or fields is undefined for pageIndex', pageIndex);
    return null;
  }

  // Helper function to get readable field type name
  const getFieldTypeName = (type: FieldType): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Set up drop target for the entire form content area
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.FORM_ELEMENT, ItemTypes.FORM_FIELD],
    collect: monitor => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
    drop: (item: any, monitor) => {
      // If the drop didn't happen on a field, but in the form content area
      if (monitor.didDrop()) {
        return undefined;
      }

      // If we're dropping a new element from the panel
      if (item.type === ItemTypes.FORM_ELEMENT && item.fieldType) {
        // Add at the end of the list
        const index = page.fields.length || 0;
        dispatch(
          addFieldAtIndex({
            type: item.fieldType,
            index,
            pageId: page.id,
          })
        );

        // Show toast notification
        toast.success(`${getFieldTypeName(item.fieldType)} field added`);
        return { dropped: true };
      }
      return undefined;
    },
  });

  const handleDropAtIndex = (fieldType: FieldType, index: number) => {
    dispatch(
      addFieldAtIndex({
        type: fieldType,
        index,
        pageId: page.id,
      })
    );

    // Show toast notification
    toast.success(`${getFieldTypeName(fieldType)} field added`);
  };

  const handleRemovePage = () => {
    dispatch(removePage(page.id));
    toast.info(`Page ${pageIndex + 1} removed`);
  };

  // Apply the drop ref to the form content area
  drop(formPageRef);

  // Only show this page if it's the active page or in preview mode
  if (!isActive && !isPreviewMode) {
    return null;
  }

  // Determine if we should show the empty state or drop indicator
  const isPageEmpty = page.fields.length === 0;
  const showDropIndicator = isOver && canDrop && !isPreviewMode;

  return (
    <div
      ref={formPageRef}
      className='w-full'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Page indicator with remove button */}
      {!isPreviewMode && pageIndex > 0 && (
        <div className='relative flex justify-end mb-2'>
          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className='px-3 py-1 bg-red-100 text-red-600 text-sm rounded-md hover:bg-red-200 transition-colors flex items-center'
                onClick={handleRemovePage}
              >
                <X className='w-4 h-4 mr-1' />
                Remove Page
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Form Content */}
      <motion.div
        className={`bg-white rounded-md shadow-sm mb-6 min-h-[12rem] transition-all overflow-hidden ${
          showDropIndicator ? 'outline-2 outline-blue-500 outline-dashed' : ''
        }`}
        layout
        animate={showDropIndicator ? { scale: 1.01 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className='px-8'>
          {/* Initial placeholder for empty form */}
          {isPageEmpty && (
            <motion.div
              className={`py-12 text-center text-gray-500 ${
                showDropIndicator ? 'bg-blue-50' : ''
              }`}
              animate={
                showDropIndicator
                  ? {
                      backgroundColor: 'rgba(239, 246, 255, 0.6)',
                      scale: 1.01,
                    }
                  : {}
              }
              transition={{ duration: 0.2 }}
            >
              {showDropIndicator ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='flex flex-col items-center'
                >
                  <div className='w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2'>
                    <PlusCircle className='w-6 h-6 text-blue-500' />
                  </div>
                  <span className='font-medium text-blue-600'>
                    Drop element here to add to your form
                  </span>
                </motion.div>
              ) : (
                <div className='flex items-center justify-center'>
                  <span className='mr-2'>
                    Drag your question to{' '}
                    {pageIndex === 0 ? 'this' : `page ${pageIndex + 1}`} from
                    the left panel.
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* If we have fields, render them with placeholders in between */}
          {!isPageEmpty && (
            <motion.div layout>
              {/* First placeholder */}
              <FieldPlaceholder
                index={0}
                pageId={page.id}
                onDrop={handleDropAtIndex}
              />

              {page.fields.map((field, index) => {
                if (!field || !field.id) {
                  console.error(
                    'Found invalid field in page',
                    pageIndex,
                    'at index',
                    index
                  );
                  return null;
                }

                return (
                  <motion.div
                    key={field.id}
                    className='form-field-container'
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                      delay: index * 0.05,
                    }}
                  >
                    <DraggableField
                      field={field}
                      index={index}
                      pageId={page.id}
                      isSelected={false}
                      isHovered={hoveredFieldId === field.id}
                      isPreviewMode={isPreviewMode}
                      moveField={(dragIndex, hoverIndex) =>
                        moveField(dragIndex, hoverIndex, pageIndex)
                      }
                      onSettingsClick={e => onSettingsClick(e, field.id)}
                      onDeleteField={e => onDeleteField(e, field.id)}
                      onDuplicateField={e => onDuplicateField(e, field.id)}
                      onFieldClick={() => onFieldClick(field.id)}
                      onHover={setHoveredFieldId}
                    >
                      {renderField(field.id, pageIndex)}
                    </DraggableField>

                    {/* Placeholder after each field */}
                    <FieldPlaceholder
                      index={index + 1}
                      pageId={page.id}
                      onDrop={handleDropAtIndex}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Page Navigation Buttons */}
          <motion.div className='p-6 flex justify-between' layout>
            {pageIndex > 0 && (
              <motion.button
                type='button'
                className='px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition-colors'
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => dispatch(setCurrentPage(pageIndex - 1))}
              >
                Back
              </motion.button>
            )}

            <div className={pageIndex > 0 ? 'ml-auto' : ''}>
              {isLastPage ? (
                <motion.button
                  type='button'
                  className='px-10 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md transition-colors shadow-md'
                  whileHover={{
                    scale: 1.02,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Submit
                </motion.button>
              ) : (
                <motion.button
                  type='button'
                  className='px-10 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors shadow-md'
                  whileHover={{
                    scale: 1.02,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => dispatch(setCurrentPage(pageIndex + 1))}
                >
                  Next
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
