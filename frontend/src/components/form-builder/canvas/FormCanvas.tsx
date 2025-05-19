// src/components/form-builder/canvas/FormCanvas.tsx
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
import { Input } from '@/components/ui/input';
import { PlusCircle, Upload } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '@/types/dragTypes';
import DraggableField from './DraggableField';
import FieldPlaceholder from './FieldPlaceholder';
import LogoPropertiesPanel from '../properties-panel/LogoPropertiesPanel';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function FormCanvas() {
  const dispatch = useDispatch();
  const form = useSelector((state: RootState) => state.formBuilder.form);
  const isPreviewMode = useSelector(
    (state: RootState) => state.formBuilder.isPreviewMode
  );
  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState<string>('');
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isLogoPropertiesOpen, setIsLogoPropertiesOpen] = useState(false);
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
        return undefined;
      }

      // If we're dropping a new element from the panel
      if (item.type === ItemTypes.FORM_ELEMENT && item.fieldType) {
        // Add at the end of the list
        const index = form?.fields.length || 0;
        dispatch(addFieldAtIndex({ type: item.fieldType, index }));

        // Show toast notification
        toast.success(`${getFieldTypeName(item.fieldType)} field added`);
        return { dropped: true };
      }
      return undefined;
    },
  });

  // Helper function to get readable field type name
  const getFieldTypeName = (type: FieldType): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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

  // Handle logo click to open properties panel
  const handleLogoClick = () => {
    setIsLogoPropertiesOpen(true);
  };

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
    console.log('Settings clicked in FormCanvas for field', fieldId);

    // If the field is already selected, toggle properties panel
    if (form.selectedFieldId === fieldId) {
      dispatch(togglePropertiesPanel());
    } else {
      // Select field and open properties panel
      dispatch(selectField(fieldId));
      dispatch(togglePropertiesPanel(true)); // Force open
    }

    // Debug current state
    console.log('After dispatch - selectedFieldId:', fieldId);
    console.log(
      'After dispatch - propertiesPanelOpen:',
      !form.propertiesPanelOpen
    );
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
    <div className='w-full h-full p-8 overflow-y-auto'>
      <div className='max-w-3xl mx-auto' ref={formCanvasRef}>
        {/* Logo Area */}
        <motion.div
          className={`text-center py-6 border-dashed border-2 rounded mb-4 transition-colors cursor-pointer overflow-hidden ${
            form.logo
              ? 'border-transparent'
              : isLogoHovered
              ? 'border-blue-400 text-blue-500 bg-blue-50/30'
              : 'border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-500'
          }`}
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
          onClick={handleLogoClick}
          whileHover={{
            boxShadow: form.logo ? 'none' : '0 4px 12px rgba(0,0,0,0.05)',
            scale: form.logo ? 1 : 1.01,
          }}
          whileTap={{ scale: form.logo ? 1 : 0.99 }}
        >
          {form.logo ? (
            // When logo is uploaded, show the logo
            <div
              className={`flex justify-${
                form.logo.alignment?.toLowerCase() || 'center'
              }`}
              style={{ padding: '8px' }}
            >
              <img
                src={form.logo.src}
                alt='Form Logo'
                style={{ maxWidth: `${form.logo.size || 50}%` }}
                className='max-h-24 object-contain'
              />
            </div>
          ) : (
            // When no logo, show "ADD YOUR LOGO"
            <AnimatePresence>
              {isLogoHovered ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className='flex items-center justify-center'
                >
                  <Upload className='mr-2 w-5 h-5' />
                  <span className='font-medium'>ADD YOUR LOGO</span>
                </motion.div>
              ) : (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  + ADD YOUR LOGO
                </motion.span>
              )}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Form Content */}
        <motion.div
          ref={formContentRef}
          className={`bg-white rounded-md shadow-sm mb-2 min-h-[12rem] transition-all overflow-hidden ${
            showDropIndicator
              ? 'outline outline-2 outline-blue-500 outline-dashed'
              : ''
          }`}
          layout
          animate={showDropIndicator ? { scale: 1.01 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className='px-8'>
            {/* Initial placeholder for empty form */}
            {isFormEmpty && (
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
                  'Drag and drop elements from the left panel to add to your form.'
                )}
              </motion.div>
            )}

            {/* If we have fields, render them with placeholders in between */}
            {!isFormEmpty && (
              <motion.div layout>
                {/* First placeholder */}
                <FieldPlaceholder index={0} onDrop={handleDropAtIndex} />

                {form.fields.map((field, index) => (
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
                      isSelected={form.selectedFieldId === field.id}
                      isHovered={hoveredFieldId === field.id}
                      isPreviewMode={isPreviewMode}
                      moveField={handleMoveField}
                      onSettingsClick={handleSettingsClick}
                      onDeleteField={handleDeleteField}
                      onDuplicateField={handleDuplicateField}
                      onFieldClick={handleFieldClick}
                      onHover={setHoveredFieldId}
                    >
                      {renderField(
                        field,
                        editingLabelId,
                        editingLabelValue,
                        handleLabelClick,
                        handleLabelChange,
                        handleLabelBlur,
                        handleLabelKeyDown,
                        labelInputRef
                      )}
                    </DraggableField>

                    {/* Placeholder after each field */}
                    <FieldPlaceholder
                      index={index + 1}
                      onDrop={handleDropAtIndex}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.div className='p-6 flex justify-center' layout>
              <motion.button
                className='px-10 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md transition-colors shadow-md'
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                whileTap={{ scale: 0.98 }}
              >
                {form.settings?.submitButtonText || 'Submit'}
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* Add New Page */}
        <motion.div
          className='text-center py-6 border-dashed border-2 border-gray-300 rounded mt-4 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors cursor-pointer'
          whileHover={{
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            scale: 1.01,
          }}
          whileTap={{ scale: 0.99 }}
        >
          + ADD NEW PAGE HERE
        </motion.div>
      </div>

      {/* Floating Action Button */}
      {!isPreviewMode && (
        <motion.div
          className='fixed bottom-8 right-8'
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
            delay: 0.2,
          }}
        >
          <motion.button
            className='flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors'
            whileHover={{ scale: 1.1, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}
            whileTap={{ scale: 0.9 }}
          >
            <PlusCircle className='w-6 h-6' />
          </motion.button>
        </motion.div>
      )}

      {/* Logo Properties Panel */}
      <LogoPropertiesPanel
        isOpen={isLogoPropertiesOpen}
        onClose={() => setIsLogoPropertiesOpen(false)}
      />

      {/* We don't render the PropertiesPanel here - it should be rendered in the FormBuilderLayout */}
    </div>
  );
}

// Helper function to render different field types
function renderField(
  field: Field,
  editingLabelId: string | null,
  editingLabelValue: string,
  handleLabelClick: (e: React.MouseEvent, field: Field) => void,
  handleLabelChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  handleLabelBlur: () => void,
  handleLabelKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void,
  labelInputRef: React.RefObject<HTMLInputElement>
) {
  // Create editable label component
  const renderEditableLabel = () => {
    const isEditing = editingLabelId === field.id;

    return (
      <div
        className={`mb-2 ${
          field.labelAlignment === 'LEFT'
            ? 'text-left'
            : field.labelAlignment === 'RIGHT'
            ? 'text-right'
            : ''
        }`}
      >
        {isEditing ? (
          <input
            ref={labelInputRef}
            value={editingLabelValue}
            onChange={handleLabelChange}
            onBlur={handleLabelBlur}
            onKeyDown={handleLabelKeyDown}
            className='bg-transparent w-full text-gray-700 font-normal outline-none'
            autoFocus
          />
        ) : (
          <div
            className='text-gray-700 cursor-pointer inline-flex items-center'
            onClick={e => handleLabelClick(e, field)}
          >
            <span>{field.label}</span>
            {field.required && <span className='text-red-500 ml-1'>*</span>}
          </div>
        )}
      </div>
    );
  };

  switch (field.type) {
    case FieldType.HEADING:
      return (
        <div>
          {editingLabelId === field.id ? (
            <input
              ref={labelInputRef}
              value={editingLabelValue}
              onChange={handleLabelChange}
              onBlur={handleLabelBlur}
              onKeyDown={handleLabelKeyDown}
              className='bg-transparent w-full text-xl font-medium text-gray-700 border-none outline-none py-3 pb-5'
              autoFocus
            />
          ) : (
            <h3
              className='text-xl py-3 pb-5 border-b border-gray-200 font-medium text-gray-700 cursor-pointer'
              onClick={e => handleLabelClick(e, field)}
            >
              {field.label}
            </h3>
          )}
        </div>
      );

    case FieldType.EMAIL:
      return (
        <div>
          {renderEditableLabel()}
          <Input
            type='email'
            placeholder={field.placeholder || 'Email address'}
            disabled
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {field.helpText && (
            <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
          )}
        </div>
      );

    case FieldType.FULL_NAME:
      return (
        <div>
          {renderEditableLabel()}
          <Input
            placeholder='Full Name'
            disabled
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {field.helpText && (
            <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
          )}
        </div>
      );

    case FieldType.PHONE:
      return (
        <div>
          {renderEditableLabel()}
          <Input
            type='tel'
            placeholder='(000) 000-0000'
            disabled
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {field.helpText && (
            <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
          )}
        </div>
      );

    case FieldType.ADDRESS:
      return (
        <div>
          {renderEditableLabel()}
          <Input
            disabled
            placeholder='Street Address'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2'
          />
          <div className='grid grid-cols-2 gap-2'>
            <Input
              disabled
              placeholder='City'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
            <Input
              disabled
              placeholder='State/Province'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          {field.helpText && (
            <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
          )}
        </div>
      );

    case FieldType.DATE_PICKER:
      return (
        <div>
          {renderEditableLabel()}
          <Input
            disabled
            type='date'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {field.helpText && (
            <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
          )}
        </div>
      );

    case FieldType.APPOINTMENT:
      return (
        <div>
          {renderEditableLabel()}
          <div className='grid grid-cols-2 gap-2'>
            <Input
              disabled
              type='date'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
            <Input
              disabled
              type='time'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          {field.helpText && (
            <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
          )}
        </div>
      );

    case FieldType.SIGNATURE:
      return (
        <div>
          {renderEditableLabel()}
          <div className='h-24 border border-gray-300 rounded-md bg-gray-50 flex items-center justify-center text-gray-400'>
            Click to sign
          </div>
          {field.helpText && (
            <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
          )}
        </div>
      );

    case FieldType.FILL_BLANK:
      return (
        <div>
          {renderEditableLabel()}
          <div className='flex items-center'>
            <span className='text-gray-700 mr-2'>I agree to the</span>
            <Input
              className='w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mx-2'
              placeholder='terms'
              disabled
            />
            <span className='text-gray-700'>and conditions.</span>
          </div>
          {field.helpText && (
            <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
          )}
        </div>
      );

    case FieldType.PRODUCT_LIST:
      return (
        <div>
          {renderEditableLabel()}
          <div className='border border-gray-300 rounded-md overflow-hidden'>
            <div className='flex bg-gray-100 p-3 border-b border-gray-300'>
              <div className='flex-1 font-medium text-gray-700'>Product</div>
              <div className='w-24 font-medium text-gray-700 text-center'>
                Price
              </div>
              <div className='w-24 font-medium text-gray-700 text-center'>
                Qty
              </div>
            </div>
            <div className='p-3 flex items-center border-b border-gray-200'>
              <div className='flex-1 text-gray-700'>Sample Product</div>
              <div className='w-24 text-center'>$19.99</div>
              <div className='w-24 text-center'>
                <Input
                  type='number'
                  min='0'
                  defaultValue='1'
                  disabled
                  className='w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            </div>
            <div className='p-3 flex justify-between bg-gray-50'>
              <span className='font-medium text-gray-700'>Total:</span>
              <span className='font-medium text-gray-700'>$19.99</span>
            </div>
          </div>
          {field.helpText && (
            <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
          )}
        </div>
      );

    default:
      return (
        <div>
          {renderEditableLabel()}
          <Input
            disabled
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          {field.helpText && (
            <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
          )}
        </div>
      );
  }
}
