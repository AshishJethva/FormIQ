import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { FormPage as FormPageType } from '@/types/form';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '@/types/dragTypes';
import { motion } from 'framer-motion';
import { FileText, MousePointer2 } from 'lucide-react';

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
  renderField: (field: any, index: number, pageId: string) => React.ReactNode;
  moveField: (dragIndex: number, hoverIndex: number, pageId: string) => void;
}

const FormPage: React.FC<FormPageProps> = ({ page, isActive, renderField }) => {
  const isPreviewMode = useSelector(
    (state: RootState) => state.formBuilder.isPreviewMode
  );

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.FORM_ELEMENT,
    drop: () => {
      return undefined;
    },
    canDrop: () => {
      return true; // Allow all drops by default
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  if (!isActive) return null;

  return (
    <motion.div
      className='mt-4 mb-8 px-2 sm:px-0'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Page Fields */}
      <div
        className={`space-y-2 sm:space-y-1 transition-all duration-300 ${
          isOver && canDrop && !page.fields?.length
            ? 'py-6 sm:py-4 border-2 border-dashed border-blue-300 bg-blue-50/30 rounded-lg'
            : ''
        }`}
        ref={drop as unknown as React.Ref<HTMLDivElement>}
      >
        {page.fields && page.fields.length > 0
          ? page.fields.map((field, index) => (
              <React.Fragment key={field.id}>
                {renderField(field, index, page.id)}
              </React.Fragment>
            ))
          : !isPreviewMode && (
              <motion.div
                className='py-16 sm:py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100/50 mx-2 sm:mx-4'
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  <FileText className='w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-4' />
                </motion.div>
                <div className='text-gray-600 mb-2 text-lg sm:text-xl font-medium text-center'>
                  No fields added yet
                </div>
                <div className='text-gray-500 text-sm sm:text-base text-center max-w-xs sm:max-w-sm px-4'>
                  Drag elements from the left panel or click the &apos;+&apos;
                  button to add a field
                </div>
                <motion.div
                  className='mt-4 flex items-center text-gray-400 text-xs sm:text-sm'
                  animate={{ x: [0, 10, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                >
                  <MousePointer2 className='w-4 h-4 mr-1' />
                  <span>Start building your form</span>
                </motion.div>
              </motion.div>
            )}
      </div>
    </motion.div>
  );
};

export default FormPage;
