// src/components/form-builder/canvas/EnhancedFormCanvas.tsx
'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  selectField,
  clearSelectedField,
  removeField,
  duplicateField,
  updateField,
  togglePropertiesPanel,
  moveField,
  addFieldAtIndex,
} from '@/redux/slices/formBuilderSlice';
import { FieldType, Field } from '@/types/form';
import { PlusCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '@/types/dragTypes';
import DraggableField from './DraggableField';
import FieldPlaceholder from './FieldPlaceholder';
import { toast } from 'sonner';

export default function EnhancedFormCanvas() {
  const dispatch = useDispatch();
  const form = useSelector((state: RootState) => state.formBuilder.form);
  const isPreviewMode = useSelector(
    (state: RootState) => state.formBuilder.isPreviewMode
  );
  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState<string>('');
  const formCanvasRef = useRef<HTMLDivElement>(null);
  const formContentRef = useRef<HTMLDivElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

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
        return;
      }

      // If we're dropping a new element from the panel
      if (item.type === ItemTypes.FORM_ELEMENT && item.fieldType) {
        // Add at the end of the list
        const index = form?.fields.length || 0;
        dispatch(addFieldAtIndex({ type: item.fieldType, index }));

        // Show toast notification
        toast.success(`${getFieldTypeName(item.fieldType)} field added`);
      }
    },
  });

  // Helper function to get readable field type name
  const getFieldTypeName = (type: FieldType): string => {
    return type
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Apply the drop ref to the form content area
  drop(formContentRef);

  // Handle clicks outside the form fields to deselect
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        formCanvasRef.current &&
        !formCanvasRef.current.contains(event.target as Node) &&
        form?.selectedFieldId &&
        // Make sure we're not clicking in the properties panel
        !(event.target as Element).closest('.properties-panel')
      ) {
        dispatch(clearSelectedField());
      }
    }

    // Attach the event listener
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      // Clean up the event listener
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dispatch, form?.selectedFieldId]);

  // Focus the input when editing label starts
  useEffect(() => {
    if (editingLabelId && labelInputRef.current) {
      labelInputRef.current.focus();
    }
  }, [editingLabelId]);

  if (!form) return null;

  const handleFieldClick = (fieldId: string) => {
    if (isPreviewMode) return;

    // Just select the field but don't open properties panel
    if (form.selectedFieldId !== fieldId) {
      dispatch(selectField(fieldId));
    }
  };

  const handleSettingsClick = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation(); // Prevent the field click handler from firing

    // If the field is already selected, toggle properties panel
    if (form.selectedFieldId === fieldId) {
      dispatch(togglePropertiesPanel());
    } else {
      // Select field and open properties panel
      dispatch(selectField(fieldId));
      dispatch(togglePropertiesPanel(true)); // Force open
    }
  };

  const handleDeleteField = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation(); // Prevent the field click handler from firing

    // Find field to get its name for the toast message
    const field = form.fields.find(f => f.id === fieldId);

    dispatch(removeField(fieldId));

    // Show toast notification
    if (field) {
      toast.info(`${field.label} field removed`);
    }
  };

  const handleDuplicateField = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation(); // Prevent the field click handler from firing
    dispatch(duplicateField(fieldId));

    // Show toast notification
    const field = form.fields.find(f => f.id === fieldId);
    if (field) {
      toast.success(`${field.label} field duplicated`);
    }
  };

  const handleLabelClick = (e: React.MouseEvent, field: Field) => {
    e.stopPropagation(); // Prevent the field click handler from firing

    if (isPreviewMode) return;

    // Start editing the label
    setEditingLabelId(field.id);
    setEditingLabelValue(field.label);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingLabelValue(e.target.value);
  };

  const handleLabelBlur = () => {
    if (editingLabelId && editingLabelValue.trim()) {
      dispatch(
        updateField({
          id: editingLabelId,
          updates: { label: editingLabelValue.trim() },
        })
      );
    }
    setEditingLabelId(null);
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLabelBlur();
    } else if (e.key === 'Escape') {
      setEditingLabelId(null);
    }
  };

  const handleMoveField = (dragIndex: number, hoverIndex: number) => {
    dispatch(moveField({ dragIndex, hoverIndex }));
  };

  const handleDropAtIndex = (fieldType: FieldType, index: number) => {
    dispatch(addFieldAtIndex({ type: fieldType, index }));

    // Show toast notification
    toast.success(`${getFieldTypeName(fieldType)} field added`);
  };

  // Determine if we should show the empty state or drop indicator
  const isFormEmpty = form.fields.length === 0;
  const showDropIndicator = isOver && canDrop && !isPreviewMode;

  return (
    <div className='w-screen h-screen p-8 overflow-y-auto md:ml-72'>
      <div className='max-w-3xl mx-0 ml-24' ref={formCanvasRef}>
        {/* Logo Area */}
        <div className='text-center py-6 border-dashed border-2 border-gray-300 rounded mb-4 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors cursor-pointer'>
          + ADD YOUR LOGO
        </div>

        {/* Form Content */}
        <div
          ref={formContentRef}
          className={`bg-white rounded-md shadow-sm mb-2 min-h-[12rem] transition-all ${
            showDropIndicator
              ? 'outline outline-2 outline-blue-500 outline-dashed'
              : ''
          }`}
        >
          <div className='px-8'>
            {/* Initial placeholder for empty form */}
            {isFormEmpty && (
              <div
                className={`py-12 text-center text-gray-500 ${
                  showDropIndicator ? 'bg-blue-50' : ''
                }`}
              >
                {showDropIndicator
                  ? 'Drop element here to add to your form'
                  : 'Drag and drop elements from the left panel to add to your form.'}
              </div>
            )}

            {/* If we have fields, render them with placeholders in between */}
            {!isFormEmpty && (
              <>
                {/* First placeholder */}
                <FieldPlaceholder index={0} onDrop={handleDropAtIndex} />

                {form.fields.map((field, index) => (
                  <div key={field.id} className='form-field-container'>
                    <DraggableField
                      field={field}
                      index={index}
                      isSelected={form.selectedFieldId === field.id}
                      isHovered={hoveredFieldId === field.id}
                      isPreviewMode={isPreviewMode}
                      renderField={() =>
                        renderField(
                          field,
                          editingLabelId,
                          editingLabelValue,
                          handleLabelClick,
                          handleLabelChange,
                          handleLabelBlur,
                          handleLabelKeyDown,
                          labelInputRef
                        )
                      }
                      onSettingsClick={handleSettingsClick}
                      onDeleteField={handleDeleteField}
                      onDuplicateField={handleDuplicateField}
                      onFieldClick={handleFieldClick}
                      onHover={setHoveredFieldId}
                      moveField={handleMoveField}
                    />

                    {/* Placeholder after each field */}
                    <FieldPlaceholder
                      index={index + 1}
                      onDrop={handleDropAtIndex}
                    />
                  </div>
                ))}
              </>
            )}

            {/* Submit Button */}
            <div className='p-6 flex justify-center'>
              <button className='px-10 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md transition-colors'>
                {form.settings?.submitButtonText || 'Submit'}
              </button>
            </div>
          </div>
        </div>

        {/* Add New Page */}
        <div className='text-center py-6 border-dashed border-2 border-gray-300 rounded mt-4 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors cursor-pointer'>
          + ADD NEW PAGE HERE
        </div>
      </div>

      {/* Floating Action Button */}
      {!isPreviewMode && (
        <div className='fixed bottom-8 right-8'>
          <button className='flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors'>
            <PlusCircle className='w-6 h-6' />
          </button>
        </div>
      )}
    </div>
  );
}
