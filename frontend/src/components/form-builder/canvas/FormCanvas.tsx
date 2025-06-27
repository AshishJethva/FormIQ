// src/components/form-builder/canvas/FormCanvas.tsx

'use client';

import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'next/navigation';
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
  loadFormAsync,
  setSelectedPageId,
} from '@/redux/slices/formBuilder/formBuilderSlice';
import { FieldType, Field } from '@/types/form';
import { Input } from '@/components/ui/input';
import { Image, Upload } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
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
import { AppDispatch } from '@/redux/store';

// Interface for panel state
interface FormCanvasProps {
  isPanelExpanded?: boolean;
  onPanelToggle?: (isOpen: boolean) => void;
}

export default function FormCanvas({
  isPanelExpanded = false,
  onPanelToggle,
}: FormCanvasProps) {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();
  const formId = params.formId as string;

  const form = useSelector((state: RootState) => state.formBuilder.form);
  const isPreviewMode = useSelector(
    (state: RootState) => state.formBuilder.isPreviewMode
  );
  const isLoading = useSelector(
    (state: RootState) => state.formBuilder.isLoading
  );

  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState<string>('');
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isLogoPropertiesOpen, setIsLogoPropertiesOpen] = useState(false);
  const [isPageLabelHovered, setIsPageLabelHovered] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  const formCanvasRef = useRef<HTMLDivElement>(null);
  const logoAreaRef = useRef<HTMLDivElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Check screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1500);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Helper function to determine if content should shift
  const shouldShiftContent = () => {
    return isPanelExpanded && !isLargeScreen;
  };

  useEffect(() => {
    if (formId && !form && !isLoading) {
      dispatch(loadFormAsync(formId));
    }
  }, [dispatch, formId, form, isLoading]);

  // Sync selectedPageId when currentPageIndex changes
  useEffect(() => {
    if (form && form.pages && form.pages.length > 0) {
      const currentPageIndex = form.currentPageIndex || 0;
      const currentPage = form.pages[currentPageIndex];

      if (currentPage && form.selectedPageId !== currentPage.id) {
        dispatch(setSelectedPageId(currentPage.id));
      }
    }
  }, [form, dispatch]);

  // Handle clicks outside the form fields to deselect
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        formCanvasRef.current &&
        !formCanvasRef.current.contains(event.target as Node) &&
        form?.selectedFieldId &&
        !(event.target as Element).closest('.properties-panel')
      ) {
        dispatch(clearSelectedField());
      }
    }

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

  // Form Builder Warnings Component
  const FormBuilderWarnings = ({ form }: { form: any }) => {
    const hasRequiredFields = form?.pages?.some((page: any) =>
      page.fields?.some((field: any) => field.required === true)
    );

    const hasAnyFields = form?.pages?.some(
      (page: any) => page.fields && page.fields.length > 0
    );

    if (!hasAnyFields) {
      return (
        <div className='w-full max-w-3xl mx-auto my-4 p-4 bg-orange-50 border border-orange-200 rounded-lg'>
          <div className='flex items-start'>
            <div className='text-orange-600 mr-3 mt-0.5 flex-shrink-0'></div>
            <div className='flex-1 min-w-0'>
              {' '}
              <h3 className='font-medium text-orange-900 mb-1'>
                No Fields Added
              </h3>
              <p className='text-orange-700 text-sm leading-relaxed'>
                Your form has no fields. Add some fields from the left panel to
                collect user data.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (!hasRequiredFields && form?.isPublished) {
      return (
        <div className='w-full max-w-3xl mx-auto my-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <div className='flex items-start'>
            <div className='text-yellow-600 mr-3 mt-0.5 flex-shrink-0'>💡</div>
            <div className='flex-1 min-w-0'>
              {' '}
              <h3 className='font-medium text-yellow-900 mb-1'>
                No Required Fields
              </h3>
              <p className='text-yellow-700 text-sm leading-relaxed'>
                Your published form has no required fields. Users can submit
                empty forms. Consider making some fields required.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Handle logo click to open properties panel
  const handleLogoClick = () => {
    setIsLogoPropertiesOpen(true);
  };

  // Handle page navigation
  const navigateToPage = (pageIndex: number) => {
    if (!form) return;

    if (pageIndex >= 0 && pageIndex <= form.pages.length) {
      dispatch(setCurrentPageIndex(pageIndex));

      if (pageIndex < form.pages.length && form.pages[pageIndex]) {
        const targetPage = form.pages[pageIndex];
        dispatch(setSelectedPageId(targetPage.id));
      }
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

  // Get current page safely
  const getCurrentPage = () => {
    if (!form || !form.pages || form.pages.length === 0) return null;

    const currentPageIndex = form.currentPageIndex || 0;
    return form.pages[currentPageIndex] || null;
  };

  // Set up drop target for the current page canvas
  const currentPage = getCurrentPage();

  // Main drop target for the entire form canvas
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: ItemTypes.FORM_ELEMENT,
      canDrop: () => {
        return !!currentPage;
      },
      drop: (item: { fieldType: FieldType }) => {
        if (currentPage) {
          dispatch(
            addFieldAtIndex({
              type: item.fieldType,
              index: currentPage.fields?.length || 0,
              pageId: currentPage.id,
            })
          );

          toast.success(
            `${item.fieldType
              .replace(/_/g, ' ')
              .toLowerCase()} field added to page ${
              (form?.currentPageIndex || 0) + 1
            }`
          );
        }
        return undefined;
      },
      collect: monitor => ({
        isOver: !!monitor.isOver({ shallow: true }),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [currentPage, form?.currentPageIndex]
  );

  const [{ isOver: isEmptyOver, canDrop: canEmptyDrop }, emptyDropRef] =
    useDrop(
      () => ({
        accept: ItemTypes.FORM_ELEMENT,
        canDrop: () => !!currentPage && currentPage.fields?.length === 0,
        drop: (item: { fieldType: FieldType }) => {
          if (currentPage) {
            dispatch(
              addFieldAtIndex({
                type: item.fieldType,
                index: 0,
                pageId: currentPage.id,
              })
            );

            toast.success(
              `${item.fieldType.replace(/_/g, ' ').toLowerCase()} field added!`
            );
          }
          return undefined;
        },
        collect: monitor => ({
          isOver: !!monitor.isOver({ shallow: true }),
          canDrop: !!monitor.canDrop(),
        }),
      }),
      [currentPage]
    );

  // Field event handlers
  const handleFieldClick = (fieldId: string) => {
    if (isPreviewMode || !form) return;

    if (form.selectedFieldId === fieldId) {
      dispatch(togglePropertiesPanel());
    } else {
      dispatch(selectField(fieldId));
    }
  };

  const combinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      emptyDropRef(node);
      if (formCanvasRef.current !== node) {
        formCanvasRef.current = node;
      }
    },
    [emptyDropRef]
  );

  const handleSettingsClick = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation();
    if (!form) return;

    if (form.selectedFieldId === fieldId) {
      dispatch(togglePropertiesPanel());
    } else {
      dispatch(selectField(fieldId));
      dispatch(togglePropertiesPanel(true));
    }
  };

  const handleDeleteField = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation();
    if (!form || !form.pages) return;

    let pageId = '';

    for (const page of form.pages) {
      if (!page || !page.fields) continue;
      const foundField = page.fields.find(f => f.id === fieldId);
      if (foundField) {
        pageId = page.id;

        break;
      }
    }

    if (pageId && fieldId) {
      dispatch(removeField({ fieldId, pageId }));
    }
  };

  const handleDuplicateField = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation();
    if (!form || !form.pages) return;

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
    e.stopPropagation();
    if (isPreviewMode) return;

    setEditingLabelId(fieldId);
    setEditingLabelValue(label);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingLabelValue(e.target.value);
  };

  const handleLabelBlur = () => {
    if (editingLabelId && editingLabelValue.trim() && form && form.pages) {
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
            fieldId: '',
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
    dispatch(
      moveField({
        dragIndex,
        hoverIndex,
        pageId,
        fieldId: '',
        fromPageId: '',
        toPageId: '',
        toIndex: 0,
      })
    );
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
  const handleEmptyStateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onPanelToggle) {
      onPanelToggle(true);
    }
  };

  const renderField = (field: Field, index: number, pageId: string) => {
    if (!form) return null;

    const isSelected = form.selectedFieldId === field.id;

    const renderEditableLabel = () => {
      const isEditing = editingLabelId === field.id;

      return (
        <div
          className={`mb-2 ${
            field.labelAlignment === 'LEFT' ? 'text-left' : 'text-right'
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

    const renderFieldContent = () => {
      switch (field.type) {
        case FieldType.SHORT_TEXT:
          return (
            <div>
              {renderEditableLabel()}
              <Input
                placeholder='Enter your answer'
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

        case FieldType.LONG_TEXT:
          return (
            <div>
              {renderEditableLabel()}
              <textarea
                placeholder='Enter your detailed response...'
                disabled
                rows={3}
                className='w-full my-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
              />
              {field.helpText && (
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
              )}
            </div>
          );

        case FieldType.PARAGRAPH:
          return (
            <div>
              {renderEditableLabel()}
              <textarea
                placeholder='Share your thoughts, feedback, or detailed information...'
                disabled
                rows={5}
                className='w-full my-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
              />
              {field.helpText && (
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
              )}
            </div>
          );

        case FieldType.DROPDOWN:
          return (
            <div>
              {renderEditableLabel()}
              <select
                disabled
                className='w-full my-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
              >
                <option value=''>Select an option...</option>
                {field.options && field.options.length > 0 ? (
                  field.options.map((option, index) => (
                    <option key={index} value={option.value}>
                      {option.label}
                    </option>
                  ))
                ) : (
                  <>
                    <option value='option1'>Option 1</option>
                    <option value='option2'>Option 2</option>
                    <option value='option3'>Option 3</option>
                  </>
                )}
              </select>
              {field.helpText && (
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
              )}
            </div>
          );

        case FieldType.SINGLE_CHOICE:
          return (
            <div>
              {renderEditableLabel()}
              <div className='space-y-2 my-2'>
                {field.options && field.options.length > 0 ? (
                  field.options.map((option, index) => (
                    <label
                      key={index}
                      className='flex items-center space-x-2 cursor-pointer'
                    >
                      <input
                        type='radio'
                        name={field.id}
                        value={option.value}
                        disabled
                        className='text-blue-500'
                      />
                      <span>{option.label}</span>
                    </label>
                  ))
                ) : (
                  <>
                    <label className='flex items-center space-x-2 cursor-pointer'>
                      <input
                        type='radio'
                        name={field.id}
                        value='option1'
                        disabled
                        className='text-blue-500'
                      />
                      <span>Option 1</span>
                    </label>
                    <label className='flex items-center space-x-2 cursor-pointer'>
                      <input
                        type='radio'
                        name={field.id}
                        value='option2'
                        disabled
                        className='text-blue-500'
                      />
                      <span>Option 2</span>
                    </label>
                    <label className='flex items-center space-x-2 cursor-pointer'>
                      <input
                        type='radio'
                        name={field.id}
                        value='option3'
                        disabled
                        className='text-blue-500'
                      />
                      <span>Option 3</span>
                    </label>
                  </>
                )}
              </div>
              {field.helpText && (
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
              )}
            </div>
          );

        case FieldType.MULTIPLE_CHOICE:
          return (
            <div>
              {renderEditableLabel()}
              <div className='space-y-2 my-2'>
                {field.options && field.options.length > 0 ? (
                  field.options.map((option, index) => (
                    <label
                      key={index}
                      className='flex items-center space-x-2 cursor-pointer'
                    >
                      <input
                        type='checkbox'
                        value={option.value}
                        disabled
                        className='text-blue-500'
                      />
                      <span>{option.label}</span>
                    </label>
                  ))
                ) : (
                  <>
                    <label className='flex items-center space-x-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        value='option1'
                        disabled
                        className='text-blue-500'
                      />
                      <span>Option 1</span>
                    </label>
                    <label className='flex items-center space-x-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        value='option2'
                        disabled
                        className='text-blue-500'
                      />
                      <span>Option 2</span>
                    </label>
                    <label className='flex items-center space-x-2 cursor-pointer'>
                      <input
                        type='checkbox'
                        value='option3'
                        disabled
                        className='text-blue-500'
                      />
                      <span>Option 3</span>
                    </label>
                  </>
                )}
              </div>
              {field.helpText && (
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
              )}
            </div>
          );

        case FieldType.NUMBER:
          return (
            <div>
              {renderEditableLabel()}
              <Input
                type='number'
                placeholder='Enter a number'
                disabled
                className='w-full my-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                min={field.min}
                max={field.max}
                step={field.step}
              />
              {field.helpText && (
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
              )}
            </div>
          );

        case FieldType.EMAIL:
          return (
            <div>
              {renderEditableLabel()}
              <Input
                type='email'
                placeholder='Email address'
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
                type='number'
                placeholder='99999 00000'
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

        case FieldType.TIME:
          return (
            <div>
              {renderEditableLabel()}
              <Input
                type='time'
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

        case FieldType.IMAGE:
          return (
            <div>
              {renderEditableLabel()}
              <div className='border-2 border-dashed border-gray-300 rounded-md p-6 text-center bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer'>
                <Image className=' w-12 h-12 mx-auto text-gray-400 mb-2' />
                <p className='text-gray-500 text-sm'>
                  Click to upload an image
                </p>
                <p className='text-gray-400 text-xs mt-1'>
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
              {field.helpText && (
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
              )}
            </div>
          );

        case FieldType.FILE_UPLOAD:
          return (
            <div>
              {renderEditableLabel()}
              <div className='border-2 border-dashed border-gray-300 rounded-md p-6 text-center bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer'>
                <Upload className='w-12 h-12 mx-auto text-gray-400 mb-2' />
                <p className='text-gray-500 text-sm'>Click to upload files</p>
                <p className='text-gray-400 text-xs mt-1'>
                  {field.accept
                    ? `Accepted: ${field.accept}`
                    : 'Any file type up to 25MB'}
                </p>
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
              <div className='border-2 border-dashed border-gray-300 rounded-md p-6 bg-gray-50'>
                <div className='text-center'>
                  <div className='w-full h-24 bg-white border border-gray-200 rounded mb-3 flex items-center justify-center'>
                    <span className='text-gray-400 text-sm'>
                      Interactive signature canvas will be here
                    </span>
                  </div>
                  <p className='text-gray-500 text-sm'>
                    Users will be able to draw their signature here
                  </p>
                </div>
              </div>
              {field.helpText && (
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
              )}
            </div>
          );

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
                  className={`bg-transparent w-full text-3xl font-semibold my-5 py-2 pb-5 text-gray-700 outline-none border-none focus:outline-none focus:ring-0 focus:border-none ${
                    field.labelAlignment === 'LEFT' ? 'text-left' : 'text-right'
                  }`}
                  style={{
                    textAlign:
                      field.labelAlignment === 'LEFT' ? 'left' : 'right',
                  }}
                  autoFocus
                />
              ) : (
                <h3
                  className={`text-3xl my-5 py-2 pb-5 border-b font-semibold border-gray-200  text-gray-700 cursor-pointer ${
                    field.labelAlignment === 'LEFT' ? 'text-left' : 'text-right'
                  }`}
                  style={{
                    textAlign:
                      field.labelAlignment === 'LEFT' ? 'left' : 'right',
                  }}
                  onClick={e => handleLabelClick(e, field.id, field.label)}
                >
                  {field.label}
                </h3>
              )}
            </div>
          );

        case FieldType.FILL_BLANK: {
          const beforeText =
            field.fillBlankTemplate?.beforeText || 'I agree to the';
          const blankPlaceholder =
            field.fillBlankTemplate?.blankPlaceholder || 'terms';
          const afterText =
            field.fillBlankTemplate?.afterText || 'and conditions.';

          const handleFillBlankUpdate = (updateType: string, value: string) => {
            if (pageId) {
              const newTemplate = {
                beforeText: updateType === 'beforeText' ? value : beforeText,
                blankPlaceholder:
                  updateType === 'blankPlaceholder' ? value : blankPlaceholder,
                afterText: updateType === 'afterText' ? value : afterText,
              };

              dispatch(
                updateField({
                  id: field.id,
                  updates: {
                    fillBlankTemplate: newTemplate,
                  },
                  pageId,
                  fieldId: '',
                })
              );
            }
          };

          return (
            <div>
              {renderEditableLabel()}
              <div className='space-y-3 p-4 border border-gray-200 rounded-md bg-gray-50'>
                <div>
                  <label className='block text-sm font-medium text-gray-600 mb-1'>
                    Text before blank
                  </label>
                  <Input
                    value={beforeText}
                    onChange={e =>
                      handleFillBlankUpdate('beforeText', e.target.value)
                    }
                    onClick={e => e.stopPropagation()}
                    onFocus={e => e.stopPropagation()}
                    placeholder='Enter text before the blank'
                    className='text-sm'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-600 mb-1'>
                    Blank placeholder
                  </label>
                  <Input
                    value={blankPlaceholder}
                    onChange={e =>
                      handleFillBlankUpdate('blankPlaceholder', e.target.value)
                    }
                    onClick={e => e.stopPropagation()}
                    onFocus={e => e.stopPropagation()}
                    placeholder='Enter placeholder text for the blank'
                    className='text-sm'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-600 mb-1'>
                    Text after blank
                  </label>
                  <Input
                    value={afterText}
                    onChange={e =>
                      handleFillBlankUpdate('afterText', e.target.value)
                    }
                    onClick={e => e.stopPropagation()}
                    onFocus={e => e.stopPropagation()}
                    placeholder='Enter text after the blank'
                    className='text-sm'
                  />
                </div>

                <div className='pt-2 border-t border-gray-300'>
                  <label className='block text-sm font-medium text-gray-600 mb-2'>
                    Preview:
                  </label>
                  <div className='flex items-center flex-wrap gap-2 text-gray-700 bg-white p-3 rounded border'>
                    <span>{beforeText}</span>
                    <div className='px-3 py-1 border-b-2 border-blue-500 bg-blue-50 text-blue-700 min-w-[80px] text-center'>
                      {blankPlaceholder}
                    </div>
                    <span>{afterText}</span>
                  </div>
                </div>
              </div>
              {field.helpText && (
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
              )}
            </div>
          );
        }

        case FieldType.PRODUCT_LIST: {
          const products = field.productListConfig?.products || [
            { id: '1', name: 'Sample Product', price: 19.99, quantity: 1 },
          ];

          const handleAddProduct = (e: React.MouseEvent) => {
            e.stopPropagation();
            const newProduct = {
              id: Date.now().toString(),
              name: `Product ${products.length + 1}`,
              price: 0,
              quantity: 1,
            };

            const updatedProducts = [...products, newProduct];

            if (pageId) {
              dispatch(
                updateField({
                  id: field.id,
                  updates: {
                    productListConfig: { products: updatedProducts },
                  },
                  pageId,
                  fieldId: '',
                })
              );
            }
          };

          const handleRemoveProduct = (
            e: React.MouseEvent,
            productId: string
          ) => {
            e.stopPropagation();
            const updatedProducts = products.filter(p => p.id !== productId);

            if (pageId) {
              dispatch(
                updateField({
                  id: field.id,
                  updates: {
                    productListConfig: { products: updatedProducts },
                  },
                  pageId,
                  fieldId: '',
                })
              );
            }
          };

          const handleUpdateProduct = (
            productId: string,
            fieldName: string,
            value: any
          ) => {
            const updatedProducts = products.map(product =>
              product.id === productId
                ? {
                    ...product,
                    [fieldName]:
                      fieldName === 'price'
                        ? parseFloat(value) || 0
                        : fieldName === 'quantity'
                        ? parseInt(value) || 0
                        : value,
                  }
                : product
            );

            if (pageId) {
              dispatch(
                updateField({
                  id: field.id,
                  updates: {
                    productListConfig: { products: updatedProducts },
                  },
                  pageId,
                  fieldId: '',
                })
              );
            }
          };

          return (
            <div>
              {renderEditableLabel()}
              <div className='border border-gray-300 rounded-md overflow-hidden bg-white'>
                <div className='bg-gray-100 p-3 border-b border-gray-300 flex justify-between items-center'>
                  <span className='font-medium text-gray-700'>
                    Configure Products
                  </span>
                  <button
                    type='button'
                    onClick={handleAddProduct}
                    className='px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors cursor-pointer'
                  >
                    + Add Product
                  </button>
                </div>

                <div className='space-y-0'>
                  {products.map(product => (
                    <div
                      key={product.id}
                      className='p-3 border-b border-gray-200 last:border-b-0'
                    >
                      <div className='grid grid-cols-12 gap-2 items-center'>
                        <div className='col-span-5'>
                          <label className='block text-xs text-gray-500 mb-1'>
                            Product Name
                          </label>
                          <Input
                            value={product.name}
                            onChange={e =>
                              handleUpdateProduct(
                                product.id,
                                'name',
                                e.target.value
                              )
                            }
                            onClick={e => e.stopPropagation()}
                            onFocus={e => e.stopPropagation()}
                            placeholder='Product name'
                            className='text-sm'
                          />
                        </div>

                        <div className='col-span-3'>
                          <label className='block text-xs text-gray-500 mb-1'>
                            Price ($)
                          </label>
                          <Input
                            type='number'
                            step='0.01'
                            min='0'
                            value={product.price}
                            onChange={e =>
                              handleUpdateProduct(
                                product.id,
                                'price',
                                e.target.value
                              )
                            }
                            onClick={e => e.stopPropagation()}
                            onFocus={e => e.stopPropagation()}
                            placeholder='0.00'
                            className='text-sm'
                          />
                        </div>

                        <div className='col-span-3'>
                          <label className='block text-xs text-gray-500 mb-1'>
                            Default Qty
                          </label>
                          <Input
                            type='number'
                            min='0'
                            value={product.quantity}
                            onChange={e =>
                              handleUpdateProduct(
                                product.id,
                                'quantity',
                                e.target.value
                              )
                            }
                            onClick={e => e.stopPropagation()}
                            onFocus={e => e.stopPropagation()}
                            placeholder='1'
                            className='text-sm'
                          />
                        </div>

                        <div className='col-span-1 flex justify-end'>
                          {products.length > 1 && (
                            <button
                              type='button'
                              onClick={e => handleRemoveProduct(e, product.id)}
                              className='w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer'
                              title='Remove product'
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className='bg-gray-50 p-3'>
                  <div className='text-sm text-gray-600'>
                    Preview: Users will be able to select quantities for each
                    product
                  </div>
                </div>
              </div>
              {field.helpText && (
                <div className='text-sm text-gray-500 mt-1'>
                  {field.helpText}
                </div>
              )}
            </div>
          );
        }

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

  // Logo area component
  const renderLogoArea = () => {
    if (!form) return null;

    return (
      <div
        className='flex justify-center w-full bg-[#F3F3FE]'
        style={{
          paddingLeft: shouldShiftContent() ? '320px' : '0px',
          transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <motion.div
          ref={logoAreaRef}
          className={`max-w-3xl w-full mx-auto transition-colors cursor-pointer overflow-visible mt-2 mb-2 sm:mt-8 sm:mb-8 md:mt-11 md:mb-8 ${
            form.logo
              ? 'border-transparent'
              : isLogoHovered
              ? 'border-blue-400 text-blue-500 bg-blue-50/30 border-dashed border-2 rounded pt-1 text-center'
              : 'border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-500 border-dashed border-2 rounded pt-1 text-center'
          }`}
          style={{
            minHeight:
              form.logo?.size && form.logo.size > 70
                ? 'clamp(80px, 15vw, 180px)'
                : form.logo?.size && form.logo.size > 50
                ? 'clamp(60px, 12vw, 120px)'
                : 'clamp(50px, 10vw, 60px)',
            transition:
              'min-height 0.3s ease, border-color 0.3s ease, background-color 0.3s ease, margin 0.3s ease',
          }}
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
          onClick={handleLogoClick}
        >
          {form.logo ? (
            <FormLogo />
          ) : (
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
        </motion.div>
      </div>
    );
  };

  // Show loading state while form is loading
  if (isLoading) {
    return (
      <div className='w-full h-full flex items-center justify-center bg-[#F3F3FE]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading form...</p>
        </div>
      </div>
    );
  }

  if (!form) return null;
  if (!form.pages || !Array.isArray(form.pages)) {
    console.error('Form pages is not properly initialized');
    return null;
  }

  // Special case for Thank You page
  const currentPageIndex =
    form.currentPageIndex !== undefined ? form.currentPageIndex : 0;
  const isThankYouPage = currentPageIndex === form.pages.length;

  if (isThankYouPage) {
    return (
      <div className='w-full h-full overflow-y-auto mt-10 bg-[#F3F3FE]'>
        {renderLogoArea()}
        <div
          className='flex justify-center'
          style={{
            paddingLeft: shouldShiftContent() ? '320px' : '0px',
            transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div
            className='max-w-3xl w-full mx-auto bg-white p-8 shadow-sm'
            ref={formCanvasRef}
          >
            <ThankYouPage />
            <FormPagination />
          </div>
        </div>
        <LogoPropertiesPanel
          isOpen={isLogoPropertiesOpen}
          onClose={() => setIsLogoPropertiesOpen(false)}
        />
      </div>
    );
  }

  // Ensure we have a valid current page
  if (!currentPage) {
    return (
      <div className='w-full h-full flex items-center justify-center bg-[#F3F3FE]'>
        <div className='text-center'>
          <p className='text-gray-600'>No page available</p>
        </div>
      </div>
    );
  }

  const fields = currentPage.fields || [];
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === form.pages.length - 1;

  return (
    <div className='w-full h-full overflow-y-auto bg-[#F3F3FE]'>
      {/* Logo Area */}
      {renderLogoArea()}
      {/* Warnings */}
      <div
        className='flex justify-center'
        style={{
          paddingLeft: shouldShiftContent() ? '320px' : '0px',
          transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <FormBuilderWarnings form={form} />
      </div>

      {/* Page Label with Remove Page option */}
      {!isFirstPage && (
        <div
          className='flex justify-center'
          style={{
            paddingLeft: shouldShiftContent() ? '320px' : '0px',
            transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div className='max-w-3xl w-full mx-auto mb-2 flex justify-end'>
            <div
              className='relative'
              onMouseEnter={() => setIsPageLabelHovered(true)}
              onMouseLeave={() => setIsPageLabelHovered(false)}
            >
              <span className='text-gray-500 text-sm'>
                Page {currentPageIndex + 1}
              </span>

              <AnimatePresence>
                {isPageLabelHovered && !isPreviewMode && (
                  <motion.button
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className='ml-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded-md text-xs cursor-pointer'
                    onClick={() => handleRemovePage(currentPage.id)}
                  >
                    Remove Page
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
      {/* Form Container */}
      <div
        className='flex justify-center'
        style={{
          paddingLeft: shouldShiftContent() ? '320px' : '0px',
          transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <motion.div
          className={`max-w-3xl w-full mx-auto bg-white shadow-sm my-4 ${
            isOver && canDrop ? 'ring-2 ring-blue-400 ring-opacity-70' : ''
          }`}
          ref={node => {
            dropRef(node);
            if (formCanvasRef.current !== node) {
              formCanvasRef.current = node;
            }
          }}
        >
          <div className='min-h-[130px]'>
            {fields.length === 0 && !isPreviewMode ? (
              <div
                ref={combinedRef}
                onClick={handleEmptyStateClick}
                onMouseDown={e => e.preventDefault()} // Prevent drag start
                className={`
      flex flex-col items-center justify-center min-h-[130px] mx-4 my-8 
      border-2 border-dashed rounded-lg transition-all duration-300 ease-in-out cursor-pointer
      ${
        isEmptyOver && canEmptyDrop
          ? 'border-blue-400 bg-blue-50 text-blue-600 scale-105'
          : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600'
      }
    `}
              >
                <div className='text-center px-4 pointer-events-none'>
                  {' '}
                  {/* Add pointer-events-none */}
                  <div
                    className={`text-lg font-medium mb-2 transition-colors duration-300 ${
                      isEmptyOver && canEmptyDrop
                        ? 'text-blue-700'
                        : 'text-gray-600'
                    }`}
                  >
                    {isEmptyOver && canEmptyDrop
                      ? 'Drop your field here!'
                      : 'Drag your first question here from the left'}
                  </div>
                  <div
                    className={`text-sm transition-colors duration-300 ${
                      isEmptyOver && canEmptyDrop
                        ? 'text-blue-500'
                        : 'text-gray-400'
                    }`}
                  >
                    {isEmptyOver && canEmptyDrop
                      ? 'Release to add the field'
                      : 'Or click here to open elements panel'}
                  </div>
                </div>

                {/* Animated drop indicator */}
                {isEmptyOver && canEmptyDrop && (
                  <div className='mt-4 flex space-x-1 pointer-events-none'>
                    <div
                      className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'
                      style={{ animationDelay: '0ms' }}
                    ></div>
                    <div
                      className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'
                      style={{ animationDelay: '150ms' }}
                    ></div>
                    <div
                      className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'
                      style={{ animationDelay: '300ms' }}
                    ></div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Drop zone before any fields - only when fields exist */}
                {!isPreviewMode && (
                  <DropZone
                    index={0}
                    pageId={currentPage.id}
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
              </>
            )}
            {/* Dynamic Buttons - Next, Back, Submit */}
            <div className='px-4 mt-2 mb-8 pt-3 pb-6 flex justify-center'>
              {/* Show Back button on pages after the first */}
              {!isFirstPage && (
                <button
                  className='bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-8 rounded transition-colors mr-4 cursor-pointer'
                  onClick={() => navigateToPage(currentPageIndex - 1)}
                >
                  Back
                </button>
              )}

              {/* Show Next button on all pages except last */}
              {!isLastPage ? (
                <button
                  className='bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-8 rounded transition-colors cursor-pointer'
                  onClick={() => navigateToPage(currentPageIndex + 1)}
                >
                  Next
                </button>
              ) : (
                /* Show Submit button on last page */
                <button
                  className='bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-8 rounded transition-colors cursor-pointer'
                  disabled={isPreviewMode}
                >
                  {form?.settings?.submitButtonText || 'Submit'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      {/* Add New Page Button - only appear on last page */}
      {!isPreviewMode && isLastPage && (
        <div
          className='flex justify-center'
          style={{
            paddingLeft: shouldShiftContent() ? '320px' : '0px',
            transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div className='border-t border-gray-200 text-center max-w-3xl w-full mx-auto'>
            <AddNewPageButton isInline />
          </div>
        </div>
      )}
      {/* Pagination */}
      <div
        className='flex justify-center'
        style={{
          paddingLeft: shouldShiftContent() ? '320px' : '0px',
          transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
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
