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
} from '@/redux/slices/formBuilderSlice';
import { FieldType, Field } from '@/types/form';
import { Input } from '@/components/ui/input';
import { PlusCircle, Upload } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import FormLogo from '../logo/FormLogo';
import FormPage from './FormPage';
import ThankYouPage from './ThankYouPage';
import AddNewPageButton from './AddNewPageButton';
import FormPagination from './FormPagination';
import LogoPropertiesPanel from '../properties-panel/LogoPropertiesPanel';

export default function FormCanvas() {
  const dispatch = useDispatch();
  const form = useSelector((state: RootState) => state.formBuilder.form);
  const isPreviewMode = useSelector(
    (state: RootState) => state.formBuilder.isPreviewMode
  );

  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState<string>('');
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isLogoPropertiesOpen, setIsLogoPropertiesOpen] = useState(false);

  const formCanvasRef = useRef<HTMLDivElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

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
  if (!form.pages || !Array.isArray(form.pages)) {
    // If pages is not defined or not an array, initialize it
    console.error('Form pages is not properly initialized');
    return null;
  }

  const handleFieldClick = (fieldId: string) => {
    if (isPreviewMode) return;

    // Just select the field but don't open properties panel
    if (form.selectedFieldId !== fieldId) {
      dispatch(selectField(fieldId));
    }
  };

  // const handleSettingsClick = (e: React.MouseEvent, fieldId: string) => {
  //   e.stopPropagation(); // Prevent the field click handler from firing

  //   // If the field is already selected, toggle properties panel
  //   if (form.selectedFieldId === fieldId) {
  //     dispatch(togglePropertiesPanel());
  //   } else {
  //     // Select field and open properties panel
  //     dispatch(selectField(fieldId));
  //     dispatch(togglePropertiesPanel(true)); // Force open
  //   }
  // };

  const handleSettingsClick = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation(); // Prevent the field click handler from firing

    // First, find which page contains this field
    let pageId = '';
    let fieldExists = false;

    // Check each page to find the field
    for (const page of form.pages) {
      if (!page || !page.fields) continue;

      const foundField = page.fields.find(f => f && f.id === fieldId);
      if (foundField) {
        pageId = page.id;
        fieldExists = true;
        break;
      }
    }

    // Only proceed if the field was found
    if (fieldExists) {
      // If the field is already selected, toggle properties panel
      if (form.selectedFieldId === fieldId) {
        dispatch(togglePropertiesPanel());
      } else {
        // Select field and open properties panel
        dispatch(selectField(fieldId));
        dispatch(togglePropertiesPanel(true)); // Force open
      }
    } else {
      console.error(`Field with ID ${fieldId} not found in any page`);
      toast.error("Couldn't open field settings");
    }
  };

  const handleDeleteField = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation(); // Prevent the field click handler from firing

    // Find the page that contains this field
    let pageId = '';
    let field: Field | undefined;

    for (const page of form.pages) {
      if (!page || !page.fields) continue; // Skip if page or fields is undefined
      const foundField = page.fields.find(f => f.id === fieldId);
      if (foundField) {
        pageId = page.id;
        field = foundField;
        break;
      }
    }

    if (pageId && fieldId) {
      dispatch(removeField({ fieldId, pageId }));

      // Show toast notification
      if (field) {
        toast.info(`${field.label} field removed`);
      }
    }
  };

  const handleDuplicateField = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation(); // Prevent the field click handler from firing

    // For now, we'll use the existing duplicateField action
    // which doesn't support pages yet
    dispatch(duplicateField(fieldId));

    // Show toast notification
    let field: Field | undefined;

    for (const page of form.pages) {
      if (!page || !page.fields) continue; // Skip if page or fields is undefined
      field = page.fields.find(f => f.id === fieldId);
      if (field) break;
    }

    if (field) {
      toast.success(`${field.label} field duplicated`);
    }
  };

  const handleLabelClick = (
    e: React.MouseEvent,
    fieldId: string,
    label: string
  ) => {
    e.stopPropagation(); // Prevent the field click handler from firing

    if (isPreviewMode) return;

    // Start editing the label
    setEditingLabelId(fieldId);
    setEditingLabelValue(label);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingLabelValue(e.target.value);
  };

  const handleLabelBlur = () => {
    if (editingLabelId && editingLabelValue.trim()) {
      // Find the page that contains this field
      let pageId = '';

      for (const page of form.pages) {
        if (!page || !page.fields) continue; // Skip if page or fields is undefined
        const foundField = page.fields.find(f => f.id === editingLabelId);
        if (foundField) {
          pageId = page.id;
          break;
        }
      }

      if (pageId) {
        dispatch(
          updateField({
            id: editingLabelId,
            updates: { label: editingLabelValue.trim() },
            pageId,
          })
        );
      }
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
    // For now, we'll use the old moveField action which doesn't support pages
    // You'll need to update this
    dispatch(moveField({ dragIndex, hoverIndex }));
  };

  // Render a field based on its type and state
  const renderField = (fieldId: string, pageIndex: number) => {
    // Find the field in the correct page
    if (pageIndex < 0 || pageIndex >= form.pages.length) return null;

    const page = form.pages[pageIndex];
    if (!page || !page.fields) return null;

    const field = page.fields.find(f => f.id === fieldId);
    if (!field) return null;

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
              onClick={e => handleLabelClick(e, field.id, field.label)}
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
                onClick={e => handleLabelClick(e, field.id, field.label)}
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
  };

  // Special case for Thank You page
  const currentPageIndex =
    form.currentPageIndex !== undefined ? form.currentPageIndex : 0;
  const isThankYouPage = currentPageIndex === form.pages.length;

  if (isThankYouPage) {
    return (
      <div className='w-full h-full p-8 overflow-y-auto'>
        <div className='max-w-3xl mx-auto' ref={formCanvasRef}>
          {/* Logo */}
          <motion.div
            className='text-center pt-4'
            style={{
              minHeight:
                form.logo?.size && form.logo.size > 70
                  ? '220px'
                  : form.logo?.size && form.logo.size > 50
                  ? '160px'
                  : '60px',
              transition: 'min-height 0.3s ease',
            }}
          >
            {form.logo && <FormLogo />}
          </motion.div>

          {/* Thank You Page Content */}
          <ThankYouPage />

          {/* Pagination */}
          <FormPagination />
        </div>

        {/* Logo Properties Panel */}
        <LogoPropertiesPanel
          isOpen={isLogoPropertiesOpen}
          onClose={() => setIsLogoPropertiesOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className='w-full h-full p-8 overflow-y-auto'>
      <div className='max-w-3xl mx-auto' ref={formCanvasRef}>
        {/* Logo Area */}
        <motion.div
          className={`text-center pt-4 border-dashed border-2 rounded transition-colors cursor-pointer overflow-visible ${
            form.logo
              ? 'border-transparent'
              : isLogoHovered
              ? 'border-blue-400 text-blue-500 bg-blue-50/30'
              : 'border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-500'
          }`}
          style={{
            minHeight:
              form.logo?.size && form.logo.size > 70
                ? '220px'
                : form.logo?.size && form.logo.size > 50
                ? '160px'
                : '60px',
            transition:
              'min-height 0.3s ease, border-color 0.3s ease, background-color 0.3s ease',
          }}
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
            // When logo is uploaded, show the logo with appropriate sizing
            <FormLogo />
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

        {/* Form Pages */}
        {form.pages.map(
          (page, index) =>
            page && (
              <FormPage
                key={page.id || `page-${index}`}
                page={page}
                pageIndex={index}
                isLastPage={index === form.pages.length - 1}
                isActive={index === currentPageIndex}
                onSettingsClick={handleSettingsClick}
                onDeleteField={handleDeleteField}
                onDuplicateField={handleDuplicateField}
                onFieldClick={handleFieldClick}
                handleLabelClick={handleLabelClick}
                renderField={renderField}
                moveField={handleMoveField}
              />
            )
        )}

        {/* Add New Page Button (Inline) */}
        {!isPreviewMode && <AddNewPageButton isInline className='mt-4' />}

        {/* Pagination */}
        <FormPagination />

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
              whileHover={{
                scale: 1.1,
                boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              }}
              whileTap={{ scale: 0.9 }}
            >
              <PlusCircle className='w-6 h-6' />
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Logo Properties Panel */}
      <LogoPropertiesPanel
        isOpen={isLogoPropertiesOpen}
        onClose={() => setIsLogoPropertiesOpen(false)}
      />
    </div>
  );
}
