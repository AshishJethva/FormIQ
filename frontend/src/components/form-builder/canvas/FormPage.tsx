// src/components/canvas/FormPage.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { FormPage as FormPageType } from '@/types/form';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '@/types/dragTypes';

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

  // Set up drop target for empty pages with proper canDrop function
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.FORM_ELEMENT,
    drop: () => {
      // Your drop handling logic here
      return undefined;
    },
    canDrop: () => {
      // Add your logic to determine if dropping is allowed
      // For example, you might only allow dropping certain item types
      return true; // Allow all drops by default
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  // Don't render if page is not active
  if (!isActive) return null;

  return (
    <div className='mt-4 mb-8'>
      {/* Page Fields */}
      <div
        className={`space-y-1 ${
          isOver && canDrop && !page.fields?.length
            ? 'py-4 border-2 border-dashed border-blue-300 bg-blue-50/30 rounded'
            : ''
        }`}
        ref={drop}
      >
        {page.fields && page.fields.length > 0
          ? page.fields.map((field, index) => (
              <React.Fragment key={field.id}>
                {renderField(field, index, page.id)}
              </React.Fragment>
            ))
          : // Empty state
            !isPreviewMode && (
              <div className='py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 mx-4'>
                <div className='text-gray-500 mb-2'>No fields added yet</div>
                <div className='text-gray-400 text-sm'>
                  Drag elements from the left panel or click the &apos;+&apos;
                  button to add a field
                </div>
              </div>
            )}
      </div>
    </div>
  );
};

export default FormPage;
