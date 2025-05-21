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
  setCurrentPageIndex,
} from '@/redux/slices/formBuilderSlice';
import { FieldType, Field } from '@/types/form';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrop } from 'react-dnd';
import { toast } from 'sonner';
import { ItemTypes } from '@/types/dragTypes';
import FormLogo from '../logo/FormLogo';
import DropZone from './DropZone';
import DraggableFormField from './DraggableFormField';
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
  const [isPageLabelHovered, setIsPageLabelHovered] = useState(false);

  const formCanvasRef = useRef<HTMLDivElement>(null);
  const logoAreaRef = useRef<HTMLDivElement>(null);
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

  // Handle page navigation
  const navigateToPage = (pageIndex: number) => {
    if (!form) return;

    // Ensure page index is within valid range
    if (pageIndex >= 0 && pageIndex <= form.pages.length) {
      // Update form's currentPageIndex
      dispatch(setCurrentPageIndex(pageIndex));
    }
  };

  // Handle page removal
  const handleRemovePage = (pageId: string) => {
    if (!form) return;

    dispatch({
      type: 'formBuilder/removePage',
      payload: pageId,
    });
    toast.success('Page removed successfully');
  };

  // Set up drop target for the empty canvas
  const [{ isOver, canDrop }, dropRef] = useDrop(() => ({
    accept: ItemTypes.FORM_ELEMENT,
    canDrop: () => true, // Add this line to specify when dropping is allowed
    drop: (item: { fieldType: FieldType }, monitor) => {
      if (!monitor.didDrop() && form) {
        // Only handle the drop if no child component handled it
        const currentPage = form.pages[form.currentPageIndex || 0];
        if (currentPage) {
          dispatch(
            addFieldAtIndex({
              type: item.fieldType,
              index: currentPage.fields?.length || 0,
              pageId: currentPage.id,
            })
          );
          toast.success(`${item.fieldType} field added to form`);
        }
      }
      return undefined;
    },
    collect: monitor => ({
      isOver: !!monitor.isOver({ shallow: true }),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  if (!form) return null;
  if (!form.pages || !Array.isArray(form.pages)) {
    console.error('Form pages is not properly initialized');
    return null;
  }

  const handleFieldClick = (fieldId: string) => {
    if (isPreviewMode) return;

    // Select the field
    if (form.selectedFieldId === fieldId) {
      // If already selected, toggle properties panel
      dispatch(togglePropertiesPanel());
    } else {
      // Otherwise, just select it
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

    // Find the page that contains this field
    let pageId = '';
    let field: Field | undefined;

    for (const page of form.pages) {
      if (!page || !page.fields) continue;
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

    // Find the field
    let field: Field | undefined;
    let pageId: string | undefined;

    for (const page of form.pages) {
      if (!page || !page.fields) continue;
      field = page.fields.find(f => f.id === fieldId);
      if (field) {
        pageId = page.id;
        break;
      }
    }

    if (field && pageId) {
      dispatch(duplicateField(fieldId));
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
        if (!page || !page.fields) continue;
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

  const handleMoveField = (
    dragIndex: number,
    hoverIndex: number,
    pageId: string
  ) => {
    if (isPreviewMode) return;
    dispatch(moveField({ dragIndex, hoverIndex, pageId }));
  };

  const handleAddFieldAtIndex = (
    type: FieldType,
    index: number,
    pageId: string
  ) => {
    dispatch(
      addFieldAtIndex({
        type,
        index,
        pageId,
      })
    );
    toast.success(`Added new ${type.replace(/_/g, ' ').toLowerCase()} field`);
  };

  // Render a field based on its type and state
  const renderField = (field: Field, index: number, pageId: string) => {
    const isSelected = form.selectedFieldId === field.id;

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
              className='bg-transparent w-full font-normal outline-none border-none focus:outline-none focus:ring-0 focus:border-none p-0 m-0 text-inherit'
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

    // Field content based on its type
    const renderFieldContent = () => {
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
                  className='bg-transparent w-full text-3xl font-semibold my-5 py-2 pb-5 text-gray-700 outline-none border-none focus:outline-none focus:ring-0 focus:border-none '
                  autoFocus
                />
              ) : (
                <h3
                  className='text-3xl my-5 py-2 pb-5 border-b font-semibold border-gray-200  text-gray-700 cursor-pointer'
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
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
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
                className='w-full px-3 my-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              {field.helpText && (
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
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
                className='w-full my-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              {field.helpText && (
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
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
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
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
                className='w-full my-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              {field.helpText && (
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
              )}
            </div>
          );

        case FieldType.APPOINTMENT:
          return (
            <div>
              {renderEditableLabel()}
              <div className='grid grid-cols-2 gap-2 my-2'>
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
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
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
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
              )}
            </div>
          );

        case FieldType.FILL_BLANK:
          return (
            <div>
              {renderEditableLabel()}
              <div className='flex items-center my-2'>
                <span className='text-gray-700 mr-2'>I agree to the</span>
                <Input
                  className='w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mx-2'
                  placeholder='terms'
                  disabled
                />
                <span className='text-gray-700'>and conditions.</span>
              </div>
              {field.helpText && (
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
              )}
            </div>
          );

        case FieldType.PRODUCT_LIST:
          return (
            <div>
              {renderEditableLabel()}
              <div className='border border-gray-300 rounded-md overflow-hidden'>
                <div className='flex bg-gray-100 p-3 border-b border-gray-300'>
                  <div className='flex-1 font-medium text-gray-700'>
                    Product
                  </div>
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
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
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
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
              )}
            </div>
          );
      }
    };

    return (
      <DraggableFormField
        key={field.id}
        field={field}
        index={index}
        pageId={pageId}
        isSelected={isSelected}
        isPreviewMode={isPreviewMode}
        onMove={handleMoveField}
        onClick={() => handleFieldClick(field.id)}
        onSettingsClick={e => handleSettingsClick(e, field.id)}
        onDeleteClick={e => handleDeleteField(e, field.id)}
        onDuplicateClick={e => handleDuplicateField(e, field.id)}
      >
        {renderFieldContent()}
      </DraggableFormField>
    );
  };

  // Special case for Thank You page
  const currentPageIndex =
    form.currentPageIndex !== undefined ? form.currentPageIndex : 0;
  const isThankYouPage = currentPageIndex === form.pages.length;

  // Render the logo area (now outside the form container)
  const renderLogoArea = () => {
    return (
      <div
        ref={logoAreaRef}
        className={`max-w-3xl mx-auto mt-4 text-center pt-1 border-dashed border-2 rounded transition-colors cursor-pointer overflow-visible ${
          form.logo
            ? 'border-transparent '
            : isLogoHovered
            ? 'border-blue-400 text-blue-500 bg-blue-50/30'
            : 'border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-500'
        }`}
        style={{
          minHeight:
            form.logo?.size && form.logo.size > 70
              ? '180px'
              : form.logo?.size && form.logo.size > 50
              ? '120px'
              : '60px',
          transition:
            'min-height 0.3s ease, border-color 0.3s ease, background-color 0.3s ease',
        }}
        onMouseEnter={() => setIsLogoHovered(true)}
        onMouseLeave={() => setIsLogoHovered(false)}
        onClick={handleLogoClick}
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
                className='flex items-center justify-center py-3'
              >
                <Upload className='mr-2 w-5 h-5' />
                <span className='font-medium'>ADD YOUR LOGO</span>
              </motion.div>
            ) : (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='py-3 block'
              >
                + ADD YOUR LOGO
              </motion.span>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  };

  if (isThankYouPage) {
    return (
      <div className='w-full h-full overflow-y-auto mt-10'>
        {/* Logo Area - Outside the form */}
        {/* {renderLogoArea()} */}

        <div
          className='max-w-3xl mx-auto bg-white p-8 shadow-sm'
          ref={formCanvasRef}
        >
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

  const currentPage = form.pages[currentPageIndex];
  const fields = currentPage?.fields || [];
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === form.pages.length - 1;

  return (
    <div className='w-full h-full overflow-y-auto bg-gray-100'>
      {/* Logo Area - Outside the form */}
      {renderLogoArea()}

      {/* Page Label with Remove Page option */}
      {!isFirstPage && (
        <div className='max-w-3xl mx-auto mb-2 flex justify-end'>
          <div
            className='relative'
            onMouseEnter={() => setIsPageLabelHovered(true)}
            onMouseLeave={() => setIsPageLabelHovered(false)}
          >
            <span className='text-gray-500 text-sm'>
              Page {currentPageIndex + 1}
            </span>

            {/* Remove Page Button - Shows on hover */}
            <AnimatePresence>
              {isPageLabelHovered && !isPreviewMode && (
                <motion.button
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className='ml-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded-md text-xs'
                  onClick={() => handleRemovePage(currentPage.id)}
                >
                  Remove Page
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Form Container */}
      <div
        className={`max-w-3xl mx-auto bg-white shadow-sm my-4 ${
          isOver && canDrop ? 'ring-2 ring-blue-400 ring-opacity-70' : ''
        }`}
        ref={dropRef}
      >
        <div ref={formCanvasRef}>
          {/* Drop zone before any fields */}
          {!isPreviewMode && (
            <DropZone
              index={0}
              pageId={currentPage?.id || ''}
              onDrop={handleAddFieldAtIndex}
            />
          )}

          {/* Fields with drop zones between them */}
          {fields.map((field, index) => (
            <div key={field.id}>
              {renderField(field, index, currentPage.id)}

              {/* Drop zone after each field */}
              {!isPreviewMode && (
                <DropZone
                  index={index + 1}
                  pageId={currentPage.id}
                  onDrop={handleAddFieldAtIndex}
                />
              )}
            </div>
          ))}

          {/* Empty Form State */}
          {fields.length === 0 && !isPreviewMode && (
            <div className='flex flex-col mt-4 items-center justify-center h-30 border-2 border-dashed border-gray-300 rounded-lg mx-4 mb-4 pt-4'>
              <div className='text-gray-500 mb-4'>
                Drag your first question here from the left.
              </div>
            </div>
          )}

          {/* Dynamic Buttons - Next, Back, Submit */}
          <div className='px-4 mt-2 mb-8 pt-3 pb-6 flex justify-center'>
            {/* Show Back button on pages after the first */}
            {!isFirstPage && (
              <button
                className='bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-8 rounded transition-colors mr-4'
                onClick={() => navigateToPage(currentPageIndex - 1)}
              >
                Back
              </button>
            )}

            {/* Show Next button on all pages except last */}
            {!isLastPage ? (
              <button
                className='bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-8 rounded transition-colors'
                onClick={() => navigateToPage(currentPageIndex + 1)}
              >
                Next
              </button>
            ) : (
              /* Show Submit button on last page */
              <button
                className='bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-8 rounded transition-colors'
                disabled={isPreviewMode}
              >
                {form.settings?.submitButtonText || 'Submit'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add New Page Button - only appear on last page */}
      {!isPreviewMode && isLastPage && (
        <div className='border-t border-gray-200 text-center w-[764px] mx-auto'>
          <AddNewPageButton isInline />
        </div>
      )}

      {/* Pagination */}
      <FormPagination />

      {/* Logo Properties Panel */}
      <LogoPropertiesPanel
        isOpen={isLogoPropertiesOpen}
        onClose={() => setIsLogoPropertiesOpen(false)}
      />
    </div>
  );
}
