// src/components/form-builder/canvas/FormCanvas.tsx
'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  selectField,
  clearSelectedField,
  removeField,
  duplicateField,
} from '@/redux/slices/formBuilderSlice';
import { FieldType, Field } from '@/types/form';
import { Input } from '@/components/ui/input';
import { Settings, Trash2, GripVertical, PlusCircle, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function FormCanvas() {
  const dispatch = useDispatch();
  const form = useSelector((state: RootState) => state.formBuilder.form);
  const isPreviewMode = useSelector(
    (state: RootState) => state.formBuilder.isPreviewMode
  );
  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null);

  if (!form) return null;

  const handleFieldClick = (fieldId: string) => {
    if (isPreviewMode) return;

    // If already selected, deselect it
    if (form.selectedFieldId === fieldId) {
      dispatch(clearSelectedField());
    } else {
      dispatch(selectField(fieldId));
    }
  };

  const handleSettingsClick = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation(); // Prevent the field click handler from firing
    dispatch(selectField(fieldId));
  };

  const handleDeleteField = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation(); // Prevent the field click handler from firing
    dispatch(removeField(fieldId));
  };

  const handleDuplicateField = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation(); // Prevent the field click handler from firing
    dispatch(duplicateField(fieldId));
  };

  return (
    <div className='flex-1 p-8 overflow-y-auto ml-0 md:ml-72'>
      <div className='max-w-3xl mx-auto'>
        {/* Logo Area */}
        <div className='text-center py-6 border-dashed border-2 border-gray-300 rounded mb-4 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors cursor-pointer'>
          + ADD YOUR LOGO
        </div>

        {/* Form Content */}
        <div className='bg-white rounded-md shadow-sm'>
          {/* Form Title */}
          <div className='p-6 border-b'>
            <h2 className='text-2xl font-medium text-gray-800'>Form</h2>
          </div>

          {/* Form Fields */}
          {form.fields.length === 0 ? (
            <div className='p-10 text-center text-gray-500'>
              Drag and drop elements from the left panel to add to your form.
            </div>
          ) : (
            form.fields.map(field => (
              <div
                key={field.id}
                className={`p-6 border-b relative transition-colors ${
                  form.selectedFieldId === field.id && !isPreviewMode
                    ? 'outline outline-2 outline-blue-500 bg-blue-50 z-10'
                    : hoveredFieldId === field.id && !isPreviewMode
                    ? 'bg-gray-50'
                    : ''
                }`}
                onClick={() => handleFieldClick(field.id)}
                onMouseEnter={() =>
                  !isPreviewMode && setHoveredFieldId(field.id)
                }
                onMouseLeave={() => !isPreviewMode && setHoveredFieldId(null)}
              >
                {renderField(field)}

                {/* Inline field actions - only shown on hover or when selected */}
                <AnimatePresence>
                  {!isPreviewMode &&
                    (hoveredFieldId === field.id ||
                      form.selectedFieldId === field.id) && (
                      <motion.div
                        className='absolute right-2 top-2 flex space-x-1'
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <button
                          className='w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-500 hover:bg-gray-100 transition-colors'
                          onClick={e => e.stopPropagation()}
                          title='Move field'
                        >
                          <GripVertical size={16} />
                        </button>
                        <button
                          className='w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-500 hover:bg-gray-100 transition-colors'
                          onClick={e => handleDuplicateField(e, field.id)}
                          title='Duplicate field'
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                            form.selectedFieldId === field.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'
                          }`}
                          onClick={e => handleSettingsClick(e, field.id)}
                          title='Field settings'
                        >
                          <Settings size={16} />
                        </button>
                        <button
                          className='w-8 h-8 flex items-center justify-center bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors'
                          onClick={e => handleDeleteField(e, field.id)}
                          title='Delete field'
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    )}
                </AnimatePresence>

                {/* Field selection highlighting - blue outline with focus state */}
                {form.selectedFieldId === field.id && !isPreviewMode && (
                  <div className='absolute inset-0 border-2 border-blue-500 pointer-events-none rounded'></div>
                )}
              </div>
            ))
          )}

          {/* Submit Button */}
          <div className='p-6 flex justify-center'>
            <button className='px-10 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md transition-colors'>
              {form.settings?.submitButtonText || 'Submit'}
            </button>
          </div>
        </div>

        {/* Add New Page */}
        <div className='text-center py-6 border-dashed border-2 border-gray-300 rounded mt-4 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors cursor-pointer'>
          + ADD NEW PAGE HERE
        </div>

        {/* Notice about branding */}
        <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-center text-yellow-700 text-sm'>
          <span className='inline-block bg-yellow-500 text-white rounded-full w-4 h-4 text-xs mr-1 flex items-center justify-center'>
            i
          </span>
          If you want to remove Jotform Branding, please upgrade your account
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

// Helper function to render different field types
function renderField(field: Field) {
  switch (field.type) {
    case FieldType.HEADING:
      return (
        <h3 className='text-lg font-medium text-gray-700'>{field.label}</h3>
      );

    case FieldType.EMAIL:
      return (
        <div>
          <label
            className={`block mb-2 text-gray-700 ${
              field.labelAlignment === 'LEFT'
                ? 'text-left'
                : field.labelAlignment === 'RIGHT'
                ? 'text-right'
                : ''
            }`}
          >
            {field.label}
            {field.required && <span className='text-red-500 ml-1'>*</span>}
          </label>
          <Input
            type='email'
            placeholder={field.placeholder || 'example@example.com'}
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
          <label
            className={`block mb-2 text-gray-700 ${
              field.labelAlignment === 'LEFT'
                ? 'text-left'
                : field.labelAlignment === 'RIGHT'
                ? 'text-right'
                : ''
            }`}
          >
            {field.label}
            {field.required && <span className='text-red-500 ml-1'>*</span>}
          </label>
          <Input
            placeholder='Full Name'
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
          <label
            className={`block mb-2 text-gray-700 ${
              field.labelAlignment === 'LEFT'
                ? 'text-left'
                : field.labelAlignment === 'RIGHT'
                ? 'text-right'
                : ''
            }`}
          >
            {field.label}
            {field.required && <span className='text-red-500 ml-1'>*</span>}
          </label>
          <Input
            type='tel'
            placeholder='(000) 000-0000'
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
          <label
            className={`block mb-2 text-gray-700 ${
              field.labelAlignment === 'LEFT'
                ? 'text-left'
                : field.labelAlignment === 'RIGHT'
                ? 'text-right'
                : ''
            }`}
          >
            {field.label}
            {field.required && <span className='text-red-500 ml-1'>*</span>}
          </label>
          <Input
            placeholder='Street Address'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2'
          />
          <div className='grid grid-cols-2 gap-2'>
            <Input
              placeholder='City'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
            <Input
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
          <label
            className={`block mb-2 text-gray-700 ${
              field.labelAlignment === 'LEFT'
                ? 'text-left'
                : field.labelAlignment === 'RIGHT'
                ? 'text-right'
                : ''
            }`}
          >
            {field.label}
            {field.required && <span className='text-red-500 ml-1'>*</span>}
          </label>
          <Input
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
          <label
            className={`block mb-2 text-gray-700 ${
              field.labelAlignment === 'LEFT'
                ? 'text-left'
                : field.labelAlignment === 'RIGHT'
                ? 'text-right'
                : ''
            }`}
          >
            {field.label}
            {field.required && <span className='text-red-500 ml-1'>*</span>}
          </label>
          <div className='grid grid-cols-2 gap-2'>
            <Input
              type='date'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
            <Input
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
          <label
            className={`block mb-2 text-gray-700 ${
              field.labelAlignment === 'LEFT'
                ? 'text-left'
                : field.labelAlignment === 'RIGHT'
                ? 'text-right'
                : ''
            }`}
          >
            {field.label}
            {field.required && <span className='text-red-500 ml-1'>*</span>}
          </label>
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
          <label
            className={`block mb-2 text-gray-700 ${
              field.labelAlignment === 'LEFT'
                ? 'text-left'
                : field.labelAlignment === 'RIGHT'
                ? 'text-right'
                : ''
            }`}
          >
            {field.label}
            {field.required && <span className='text-red-500 ml-1'>*</span>}
          </label>
          <div className='flex items-center'>
            <span className='text-gray-700 mr-2'>I agree to the</span>
            <Input
              className='w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mx-2'
              placeholder='terms'
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
          <label
            className={`block mb-2 text-gray-700 ${
              field.labelAlignment === 'LEFT'
                ? 'text-left'
                : field.labelAlignment === 'RIGHT'
                ? 'text-right'
                : ''
            }`}
          >
            {field.label}
            {field.required && <span className='text-red-500 ml-1'>*</span>}
          </label>
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
          <label
            className={`block mb-2 text-gray-700 ${
              field.labelAlignment === 'LEFT'
                ? 'text-left'
                : field.labelAlignment === 'RIGHT'
                ? 'text-right'
                : ''
            }`}
          >
            {field.label}
            {field.required && <span className='text-red-500 ml-1'>*</span>}
          </label>
          <Input className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500' />
          {field.helpText && (
            <div className='text-sm text-gray-500 mt-1'>{field.helpText}</div>
          )}
        </div>
      );
  }
}
