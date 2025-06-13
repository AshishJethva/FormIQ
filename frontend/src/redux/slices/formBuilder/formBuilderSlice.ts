// src/redux/slices/formBuilder/formBuilderSlice.ts

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { Form, Field, FieldType, FormSettings, LogoState } from '@/types/form';
import axios from 'axios';
import { apiConfig } from '@/config/api';

const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== typeof obj2) return false;

  if (typeof obj1 !== 'object') return obj1 === obj2;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
};

interface FormBuilderState {
  form: Form | null;
  isPreviewMode: boolean;
  isSaving: boolean;
  isLoading: boolean;
  showGridLines: boolean;
  error: string | null;
  lastSaveTime: string | null;
  hasUnsavedChanges: boolean;
}

const initialState: FormBuilderState = {
  form: null,
  isPreviewMode: false,
  isSaving: false,
  isLoading: false,
  showGridLines: false,
  error: null,
  lastSaveTime: null,
  hasUnsavedChanges: false,
};

// Helper function to serialize dates to strings
const serializeForm = (formData: any): Form => {
  return {
    ...formData,
    createdAt: formData.createdAt
      ? formData.createdAt instanceof Date
        ? formData.createdAt.toISOString()
        : formData.createdAt
      : undefined,
    updatedAt: formData.updatedAt
      ? formData.updatedAt instanceof Date
        ? formData.updatedAt.toISOString()
        : formData.updatedAt
      : undefined,
  };
};

// Async thunk to load form from backend
export const loadFormAsync = createAsyncThunk(
  'formBuilder/loadForm',
  async (formId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${apiConfig.url}/forms/${formId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to load form:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to load form'
      );
    }
  }
);

// Async thunk to save form to backend
export const saveFormAsync = createAsyncThunk(
  'formBuilder/saveForm',
  async (formId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { formBuilder: FormBuilderState };
      const form = state.formBuilder.form;

      if (!form) {
        throw new Error('No form data to save');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const saveData = {
        title: form.title,
        description: form.description,
        pages: form.pages || [],
        selectedFieldId: null,
        selectedPageId: form.selectedPageId,
        currentPageIndex: form.currentPageIndex || 0,
        propertiesPanelOpen: false,
        logo: form.logo,
        settings: form.settings || {
          submitButtonText: 'Submit',
          defaultLabelAlignment: 'LEFT',
          thankyouMessage: 'Thank you for your submission!',
          defaultRequiredField: false,
          showLogo: false,
          isEnabled: true,
        },
      };

      const response = await axios.put(
        `${apiConfig.url}/forms/${formId}`,
        saveData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to save form'
      );
    }
  }
);

// Async thunk to publish/unpublish form
export const publishFormAsync = createAsyncThunk(
  'formBuilder/publishForm',
  async (
    { formId, isPublished }: { formId: string; isPublished: boolean },
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.patch(
        `${apiConfig.url}/forms/${formId}/publish`,
        { isPublished },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Failed to update form status'
      );
    }
  }
);

const formBuilderSlice = createSlice({
  name: 'formBuilder',
  initialState,
  reducers: {
    initializeForm: state => {
      if (!state.form) {
        const pageId = uuidv4();
        const currentTime = new Date().toISOString();

        state.form = {
          id: uuidv4(),
          title: 'Untitled Form',
          pages: [
            {
              id: pageId,
              fields: [],
            },
          ],
          selectedFieldId: null,
          selectedPageId: pageId,
          currentPageIndex: 0,
          propertiesPanelOpen: false,
          settings: {
            submitButtonText: 'Submit',
            defaultLabelAlignment: 'LEFT',
            thankyouMessage: 'Thank you for your submission!',
            defaultRequiredField: false,
            isEnabled: true,
            allowMultipleSubmissions: true,
            allowMultipleEmailSubmissions: true,
            collectIpAddress: true,
            enableCaptcha: false,
            showLogo: false,
          },
          isPublished: false,
          submissions: 0,
          createdAt: currentTime,
          updatedAt: currentTime,
          lastSaved: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        state.hasUnsavedChanges = false;
      }
    },

    markChangesSaved: state => {
      state.hasUnsavedChanges = false;
      if (state.form) {
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        state.form.updatedAt = new Date().toISOString();
      }
    },

    setFormTitle: (state, action: PayloadAction<string>) => {
      if (state.form) {
        state.form.title = action.payload;
        state.hasUnsavedChanges = true;
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        state.form.updatedAt = new Date().toISOString();
      }
    },

    setSelectedPageId: (state, action: PayloadAction<string>) => {
      if (state.form) {
        state.form.selectedPageId = action.payload;
      }
    },

    updateFormSettings: (
      state,
      action: PayloadAction<Partial<FormSettings>>
    ) => {
      if (!state.form) return;

      if (!state.form.settings) {
        state.form.settings = {
          submitButtonText: 'Submit',
          defaultLabelAlignment: 'LEFT',
          thankyouMessage: 'Thank you for your submission!',
          defaultRequiredField: false,
          isEnabled: true,
          allowMultipleSubmissions: true,
          allowMultipleEmailSubmissions: true,
          collectIpAddress: true,
          enableCaptcha: false,
          showLogo: false,
        };
      }

      state.form.settings = {
        ...state.form.settings,
        ...action.payload,
      } as FormSettings;

      const newSettings = action.payload;

      if (newSettings.allowMultipleSubmissions === false) {
        state.form.settings.allowMultipleEmailSubmissions = false;
      }

      state.hasUnsavedChanges = true;
      state.form.lastSaved = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      state.form.updatedAt = new Date().toISOString();
    },

    setFormPublished: (state, action: PayloadAction<boolean>) => {
      if (state.form) {
        state.form.isPublished = action.payload;
        state.hasUnsavedChanges = true;
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        state.form.updatedAt = new Date().toISOString();
      }
    },

    addField: (
      state,
      action: PayloadAction<{ type: FieldType; pageId?: string }>
    ) => {
      if (!state.form || !state.form.pages) return;

      //  ENHANCED: Create field with proper structure for all types
      const baseField = {
        id: uuidv4(),
        type: action.payload.type,
        label: getLabelForType(action.payload.type),
        labelAlignment: state.form.settings?.defaultLabelAlignment || 'LEFT',
      };

      // Only add required and helpText for NON-heading fields
      let newField: Field;
      if (action.payload.type === FieldType.HEADING) {
        newField = baseField as Field;
      } else {
        newField = {
          ...baseField,
          required: state.form.settings?.defaultRequiredField || false,
          helpText: '',
        } as Field;

        //  ENHANCED: Add field-specific properties with proper typing
        switch (action.payload.type) {
          case FieldType.LONG_TEXT:
            (newField as any).rows = 3;
            break;
          case FieldType.PARAGRAPH:
            (newField as any).rows = 5;
            break;
          case FieldType.NUMBER:
            (newField as any).min = undefined;
            (newField as any).max = undefined;
            (newField as any).step = 1;
            break;
          case FieldType.DROPDOWN:
          case FieldType.SINGLE_CHOICE:
          case FieldType.MULTIPLE_CHOICE:
            (newField as any).options = [
              { label: 'Option 1', value: 'option1' },
              { label: 'Option 2', value: 'option2' },
              { label: 'Option 3', value: 'option3' },
            ];
            break;
          case FieldType.FILE_UPLOAD:
            (newField as any).accept = '*/*';
            (newField as any).multiple = false;
            break;
          case FieldType.IMAGE:
            (newField as any).accept = 'image/*';
            (newField as any).multiple = false;
            break;
          case FieldType.EMAIL:
            newField.helpText = 'example@example.com';
            break;
          case FieldType.SIGNATURE:
            newField.helpText = 'Please sign in the box above';
            break;

          case FieldType.FILL_BLANK:
            newField.helpText = 'Complete the sentence by filling in the blank';
            (newField as any).fillBlankTemplate = {
              beforeText: 'I agree to the',
              blankPlaceholder: 'terms',
              afterText: 'and conditions.',
            };
            break;

          case FieldType.PRODUCT_LIST:
            newField.helpText = 'Select products and specify quantities';
            (newField as any).productListConfig = {
              products: [
                { id: '1', name: 'Sample Product', price: 19.99, quantity: 1 },
              ],
            };
            break;
        }
      }

      // Determine which page to add the field to
      const pageId = action.payload.pageId || state.form.selectedPageId;
      if (!pageId) {
        if (state.form.pages.length > 0) {
          state.form.pages[0].fields.push(newField);
          state.form.selectedFieldId = newField.id;
        }
        return;
      }

      const pageIndex = state.form.pages.findIndex(page => page.id === pageId);
      if (pageIndex !== -1) {
        if (!state.form.pages[pageIndex].fields) {
          state.form.pages[pageIndex].fields = [];
        }
        state.form.pages[pageIndex].fields.push(newField);
        state.form.selectedFieldId = newField.id;
        state.hasUnsavedChanges = true;
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },

    updateField: (
      state,
      action: PayloadAction<{
        id: string;
        updates: Partial<Field>;
        pageId?: string;
      }>
    ) => {
      if (!state.form || !state.form.pages) return;

      const { id, updates, pageId } = action.payload;

      const targetPageId = pageId || state.form.selectedPageId;
      if (!targetPageId) {
        for (const page of state.form.pages) {
          if (!page || !page.fields) continue;

          const fieldIndex = page.fields.findIndex(field => field.id === id);
          if (fieldIndex !== -1) {
            const currentField = page.fields[fieldIndex];
            const newField = { ...currentField, ...updates };

            // Only update if there's an actual change
            if (!deepEqual(currentField, newField)) {
              page.fields[fieldIndex] = newField;
              state.hasUnsavedChanges = true;
              state.form.lastSaved = new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
            }
            return;
          }
        }
        return;
      }

      const pageIndex = state.form.pages.findIndex(
        page => page.id === targetPageId
      );
      if (pageIndex !== -1) {
        const page = state.form.pages[pageIndex];
        if (!page || !page.fields) return;

        const fieldIndex = page.fields.findIndex(field => field.id === id);
        if (fieldIndex !== -1) {
          const currentField = page.fields[fieldIndex];
          const newField = { ...currentField, ...updates };

          // Only update if there's an actual change
          if (!deepEqual(currentField, newField)) {
            page.fields[fieldIndex] = newField;
            state.hasUnsavedChanges = true;
            state.form.lastSaved = new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
          }
        }
      }
    },

    removeField: (
      state,
      action: PayloadAction<{ fieldId: string; pageId?: string }>
    ) => {
      if (!state.form || !state.form.pages) return;

      const { fieldId, pageId } = action.payload;

      if (pageId) {
        const pageIndex = state.form.pages.findIndex(
          page => page.id === pageId
        );
        if (pageIndex !== -1) {
          const page = state.form.pages[pageIndex];
          if (!page || !page.fields) return;

          page.fields = page.fields.filter(field => field.id !== fieldId);
          if (state.form.selectedFieldId === fieldId) {
            state.form.selectedFieldId = null;
          }
          state.hasUnsavedChanges = true;
          state.form.lastSaved = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
        return;
      }

      for (const page of state.form.pages) {
        if (!page || !page.fields) continue;

        const fieldIndex = page.fields.findIndex(field => field.id === fieldId);
        if (fieldIndex !== -1) {
          page.fields = page.fields.filter(field => field.id !== fieldId);
          if (state.form.selectedFieldId === fieldId) {
            state.form.selectedFieldId = null;
          }
          state.hasUnsavedChanges = true;
          state.form.lastSaved = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          return;
        }
      }
    },

    selectField: (state, action: PayloadAction<string>) => {
      if (state.form) {
        state.form.selectedFieldId = action.payload;
      }
    },

    clearSelectedField: state => {
      if (state.form) {
        state.form.selectedFieldId = null;
      }
    },

    togglePropertiesPanel: (
      state,
      action: PayloadAction<boolean | undefined>
    ) => {
      if (state.form) {
        if (action.payload !== undefined) {
          state.form.propertiesPanelOpen = action.payload;
        } else {
          state.form.propertiesPanelOpen = !state.form.propertiesPanelOpen;
        }
      }
    },

    setPreviewMode: (state, action: PayloadAction<boolean>) => {
      state.isPreviewMode = action.payload;

      if (state.isPreviewMode && state.form) {
        state.form.selectedFieldId = null;
        state.form.propertiesPanelOpen = false;
      }
    },

    duplicateField: (state, action: PayloadAction<string>) => {
      if (!state.form || !state.form.pages) return;

      const fieldId = action.payload;

      for (const page of state.form.pages) {
        if (!page || !page.fields) continue;

        const fieldToDuplicate = page.fields.find(
          field => field.id === fieldId
        );
        if (fieldToDuplicate) {
          const duplicatedField = {
            ...fieldToDuplicate,
            id: uuidv4(),
            label: `${fieldToDuplicate.label} (Copy)`,
          };

          const fieldIndex = page.fields.findIndex(
            field => field.id === fieldId
          );

          page.fields.splice(fieldIndex + 1, 0, duplicatedField);
          state.form.selectedFieldId = duplicatedField.id;
          state.hasUnsavedChanges = true;
          state.form.lastSaved = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          return;
        }
      }
    },

    moveField: (
      state,
      action: PayloadAction<{
        dragIndex: number;
        hoverIndex: number;
        pageId?: string;
      }>
    ) => {
      if (!state.form || !state.form.pages) return;

      const { dragIndex, hoverIndex, pageId } = action.payload;

      if (pageId) {
        const pageIndex = state.form.pages.findIndex(
          page => page.id === pageId
        );
        if (pageIndex !== -1) {
          const page = state.form.pages[pageIndex];
          if (!page || !page.fields || !Array.isArray(page.fields)) return;

          const draggedField = page.fields[dragIndex];
          if (!draggedField) return;

          page.fields.splice(dragIndex, 1);
          page.fields.splice(hoverIndex, 0, draggedField);
          state.hasUnsavedChanges = true;
        }
        return;
      }

      if (
        state.form.currentPageIndex !== undefined &&
        state.form.currentPageIndex >= 0 &&
        state.form.currentPageIndex < state.form.pages.length
      ) {
        const page = state.form.pages[state.form.currentPageIndex];
        if (!page || !page.fields || !Array.isArray(page.fields)) return;

        const draggedField = page.fields[dragIndex];
        if (!draggedField) return;

        page.fields.splice(dragIndex, 1);
        page.fields.splice(hoverIndex, 0, draggedField);
        state.hasUnsavedChanges = true;
      }
    },

    addFieldAtIndex: (
      state,
      action: PayloadAction<{
        type: FieldType;
        index: number;
        pageId: string;
      }>
    ) => {
      if (!state.form || !state.form.pages) return;

      const { type, index, pageId } = action.payload;

      const targetPageIndex = state.form.pages.findIndex(
        page => page.id === pageId
      );

      if (targetPageIndex === -1) {
        console.error('❌ Page not found:', pageId);
        return;
      }

      const page = state.form.pages[targetPageIndex];
      if (!page) {
        console.error('❌ Invalid page at index:', targetPageIndex);
        return;
      }

      if (!page.fields) {
        page.fields = [];
      }

      // Create field with all properties
      const newId = uuidv4();
      const baseField = {
        id: newId,
        type,
        label: getDefaultLabelForType(type),
        labelAlignment: state.form.settings?.defaultLabelAlignment || 'LEFT',
      };

      let newField: Field;
      if (type === FieldType.HEADING) {
        newField = baseField as Field;
      } else {
        newField = {
          ...baseField,
          required: state.form.settings?.defaultRequiredField || false,
          helpText: '',
        } as Field;

        // Add field-specific properties for all new types
        switch (type) {
          case FieldType.LONG_TEXT:
            (newField as any).rows = 3;
            break;
          case FieldType.PARAGRAPH:
            (newField as any).rows = 5;
            break;
          case FieldType.NUMBER:
            (newField as any).min = undefined;
            (newField as any).max = undefined;
            (newField as any).step = 1;
            break;
          case FieldType.DROPDOWN:
          case FieldType.SINGLE_CHOICE:
          case FieldType.MULTIPLE_CHOICE:
            (newField as any).options = [
              { label: 'Option 1', value: 'option1' },
              { label: 'Option 2', value: 'option2' },
              { label: 'Option 3', value: 'option3' },
            ];
            break;
          case FieldType.FILE_UPLOAD:
            (newField as any).accept = '*/*';
            (newField as any).multiple = false;
            break;
          case FieldType.IMAGE:
            (newField as any).accept = 'image/*';
            (newField as any).multiple = false;
            break;
          case FieldType.EMAIL:
            newField.helpText = 'example@example.com';
            break;
          case FieldType.SIGNATURE:
            newField.helpText = 'Please sign in the box above';
            break;

          case FieldType.FILL_BLANK:
            newField.helpText = 'Complete the sentence by filling in the blank';
            (newField as any).fillBlankTemplate = {
              beforeText: 'I agree to the',
              blankPlaceholder: 'terms',
              afterText: 'and conditions.',
            };
            break;

          case FieldType.PRODUCT_LIST:
            newField.helpText = 'Select products and specify quantities';
            (newField as any).productListConfig = {
              products: [
                {
                  id: '1',
                  name: 'Sample Product',
                  price: 19.99,
                  quantity: 1,
                },
              ],
            };
            break;
        }
      }

      const insertIndex = Math.min(index, page.fields.length);
      page.fields.splice(insertIndex, 0, newField);

      state.form.selectedFieldId = newId;
      state.hasUnsavedChanges = true;

      state.form.lastSaved = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    },

    togglePreviewMode: state => {
      state.isPreviewMode = !state.isPreviewMode;

      if (state.isPreviewMode && state.form) {
        state.form.selectedFieldId = null;
        state.form.propertiesPanelOpen = false;
      }
    },

    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },

    updateLogo: (state, action: PayloadAction<LogoState>) => {
      if (state.form) {
        const sizeValue =
          typeof action.payload.size === 'number' ? action.payload.size : 50;

        state.form.logo = {
          ...action.payload,
          size: sizeValue,
          alignment: action.payload.alignment || 'CENTER',
        };

        state.hasUnsavedChanges = true;
        if (state.form.lastSaved !== undefined) {
          state.form.lastSaved = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      }
    },

    updateLogoSize: (state, action: PayloadAction<number>) => {
      if (state.form && state.form.logo) {
        // Ensure size is a valid number
        const newSize = Math.max(0, Math.min(100, action.payload));

        state.form.logo = {
          ...state.form.logo,
          size: newSize,
        };

        state.hasUnsavedChanges = true;
        // Update last saved timestamp
        if (state.form.lastSaved !== undefined) {
          state.form.lastSaved = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      }
    },

    updateLogoAlignment: (
      state,
      action: PayloadAction<'LEFT' | 'CENTER' | 'RIGHT'>
    ) => {
      if (state.form && state.form.logo) {
        state.form.logo = {
          ...state.form.logo,
          alignment: action.payload,
        };

        state.hasUnsavedChanges = true;
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },

    updateFieldConfig: (
      state,
      action: PayloadAction<{
        id: string;
        config: any;
        pageId?: string;
      }>
    ) => {
      if (!state.form || !state.form.pages) return;

      const { id, config, pageId } = action.payload;

      const targetPageId = pageId || state.form.selectedPageId;
      if (!targetPageId) return;

      const pageIndex = state.form.pages.findIndex(
        page => page.id === targetPageId
      );

      if (pageIndex !== -1) {
        const page = state.form.pages[pageIndex];
        if (!page || !page.fields) return;

        const fieldIndex = page.fields.findIndex(field => field.id === id);
        if (fieldIndex !== -1) {
          // Merge the configuration with existing field
          page.fields[fieldIndex] = {
            ...page.fields[fieldIndex],
            ...config,
          };
          state.hasUnsavedChanges = true;
          state.form.lastSaved = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      }
    },

    removeLogo: state => {
      if (state.form) {
        state.form.logo = null;
        state.hasUnsavedChanges = true;
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },

    addPage: state => {
      if (!state.form) return;

      if (!state.form.pages) {
        state.form.pages = [];
      }

      const newPageId = uuidv4();
      state.form.pages.push({
        id: newPageId,
        fields: [],
      });

      state.hasUnsavedChanges = true;
      state.form.lastSaved = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      state.form.currentPageIndex = state.form.pages.length - 1;
      state.form.selectedPageId = newPageId;
    },

    removePage: (state, action: PayloadAction<string>) => {
      if (!state.form) return;

      const pageId = action.payload;
      const pageIndex = state.form.pages.findIndex(page => page.id === pageId);

      if (pageIndex === -1) return;

      state.form.pages = state.form.pages.filter(page => page.id !== pageId);

      if (
        state.form.currentPageIndex &&
        state.form.currentPageIndex >= pageIndex
      ) {
        state.form.currentPageIndex = Math.max(
          0,
          state.form.currentPageIndex - 1
        );
      }

      state.hasUnsavedChanges = true;
    },

    setCurrentPage: (state, action: PayloadAction<number>) => {
      if (!state.form || !state.form.pages) return;

      const index = action.payload;

      if (index >= 0 && index <= state.form.pages.length) {
        state.form.currentPageIndex = index;

        if (index < state.form.pages.length && state.form.pages[index]) {
          state.form.selectedPageId = state.form.pages[index].id;
        }
      }
    },

    setCurrentPageIndex: (state, action: PayloadAction<number>) => {
      if (!state.form) return;

      const newIndex = action.payload;
      if (newIndex >= 0 && newIndex <= state.form.pages.length) {
        state.form.currentPageIndex = newIndex;
      }
    },

    clearError: state => {
      state.error = null;
    },
  },

  extraReducers: builder => {
    builder
      // Load form cases
      .addCase(loadFormAsync.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadFormAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;

        const formData = action.payload;

        const pages =
          formData.pages && Array.isArray(formData.pages)
            ? formData.pages
            : [{ id: uuidv4(), fields: [] }];

        const settings = {
          submitButtonText: formData.settings?.submitButtonText || 'Submit',
          defaultLabelAlignment:
            formData.settings?.defaultLabelAlignment || 'LEFT',
          thankyouMessage:
            formData.settings?.thankyouMessage ||
            'Thank you for your submission!',
          defaultRequiredField:
            formData.settings?.defaultRequiredField || false,
          showLogo: formData.settings?.showLogo || false,
          isEnabled:
            formData.settings?.isEnabled !== undefined
              ? formData.settings.isEnabled
              : true,

          allowMultipleSubmissions:
            formData.settings?.allowMultipleSubmissions !== undefined
              ? formData.settings.allowMultipleSubmissions
              : true,
          allowMultipleEmailSubmissions:
            formData.settings?.allowMultipleEmailSubmissions !== undefined
              ? formData.settings.allowMultipleEmailSubmissions
              : true,
          collectIpAddress:
            formData.settings?.collectIpAddress !== undefined
              ? formData.settings.collectIpAddress
              : true,
          enableCaptcha: formData.settings?.enableCaptcha || false,
        };

        state.form = serializeForm({
          id: formData.id || formData._id,
          title: formData.title || 'Untitled Form',
          description: formData.description,
          pages: pages,
          selectedFieldId: null,
          selectedPageId: formData.selectedPageId || pages[0]?.id,
          currentPageIndex: formData.currentPageIndex || 0,
          propertiesPanelOpen: false,
          logo: formData.logo || null,
          settings: settings,
          isPublished: formData.isPublished || false,
          submissions: formData.submissions || 0,
          userId: formData.userId,
          createdAt: formData.createdAt,
          updatedAt: formData.updatedAt,
          labels: formData.labels || [],
          isFavorite: formData.isFavorite || false,
          isArchived: formData.isArchived || false,
          isTrashed: formData.isTrashed || false,
          lastSaved: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        });

        state.hasUnsavedChanges = false;
      })
      .addCase(loadFormAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Save form cases
      .addCase(saveFormAsync.pending, state => {
        state.isSaving = true;
      })
      .addCase(saveFormAsync.fulfilled, state => {
        state.isSaving = false;
        state.hasUnsavedChanges = false;
        state.lastSaveTime = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        if (state.form) {
          state.form.lastSaved = state.lastSaveTime;
          state.form.updatedAt = new Date().toISOString();
        }
      })
      .addCase(saveFormAsync.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      })

      // Publish form cases
      .addCase(publishFormAsync.pending, state => {
        state.isSaving = true;
      })
      .addCase(publishFormAsync.fulfilled, (state, action) => {
        state.isSaving = false;
        if (state.form) {
          const updatedData = action.payload;
          if (updatedData && updatedData.isPublished !== undefined) {
            state.form.isPublished = updatedData.isPublished;

            if (updatedData.publishedAt) {
              state.form.updatedAt =
                typeof updatedData.publishedAt === 'string'
                  ? updatedData.publishedAt
                  : new Date(updatedData.publishedAt).toISOString();
            } else {
              state.form.updatedAt = new Date().toISOString();
            }

            state.form.lastSaved = new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
          }
        }
      })
      .addCase(publishFormAsync.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });
  },
});

// Complete label functions for all field types
function getDefaultLabelForType(type: FieldType): string {
  switch (type) {
    case FieldType.SHORT_TEXT:
      return 'Short Answer';
    case FieldType.LONG_TEXT:
      return 'Long Answer';
    case FieldType.PARAGRAPH:
      return 'Paragraph Text';
    case FieldType.DROPDOWN:
      return 'Select Option';
    case FieldType.SINGLE_CHOICE:
      return 'Choose One';
    case FieldType.MULTIPLE_CHOICE:
      return 'Choose Multiple';
    case FieldType.NUMBER:
      return 'Number';
    case FieldType.IMAGE:
      return 'Image Upload';
    case FieldType.FILE_UPLOAD:
      return 'File Upload';
    case FieldType.TIME:
      return 'Time';
    case FieldType.HEADING:
      return 'Section Heading';
    case FieldType.FULL_NAME:
      return 'Full Name';
    case FieldType.EMAIL:
      return 'Email Address';
    case FieldType.PHONE:
      return 'Phone Number';
    case FieldType.ADDRESS:
      return 'Address';
    case FieldType.DATE_PICKER:
      return 'Select Date';
    case FieldType.APPOINTMENT:
      return 'Schedule Appointment';
    case FieldType.SIGNATURE:
      return 'Digital Signature';
    case FieldType.FILL_BLANK:
      return 'Complete the Sentence';
    case FieldType.PRODUCT_LIST:
      return 'Product Selection';
    default:
      return 'New Field';
  }
}

function getLabelForType(type: FieldType): string {
  switch (type) {
    case FieldType.SHORT_TEXT:
      return 'Short Answer';
    case FieldType.LONG_TEXT:
      return 'Long Answer';
    case FieldType.PARAGRAPH:
      return 'Paragraph Text';
    case FieldType.DROPDOWN:
      return 'Select Option';
    case FieldType.SINGLE_CHOICE:
      return 'Choose One';
    case FieldType.MULTIPLE_CHOICE:
      return 'Choose Multiple';
    case FieldType.NUMBER:
      return 'Number';
    case FieldType.IMAGE:
      return 'Image Upload';
    case FieldType.FILE_UPLOAD:
      return 'File Upload';
    case FieldType.TIME:
      return 'Time';
    case FieldType.HEADING:
      return 'Heading';
    case FieldType.FULL_NAME:
      return 'Full Name';
    case FieldType.EMAIL:
      return 'Email';
    case FieldType.PHONE:
      return 'Phone';
    case FieldType.ADDRESS:
      return 'Address';
    case FieldType.DATE_PICKER:
      return 'Date';
    case FieldType.APPOINTMENT:
      return 'Appointment';
    case FieldType.SIGNATURE:
      return 'Signature';
    case FieldType.FILL_BLANK:
      return 'Fill in the Blank';
    case FieldType.PRODUCT_LIST:
      return 'Product List';
    default:
      return 'New Field';
  }
}

export const {
  initializeForm,
  markChangesSaved,
  setFormTitle,
  addField,
  updateField,
  removeField,
  selectField,
  clearSelectedField,
  togglePropertiesPanel,
  togglePreviewMode,
  updateFormSettings,
  setSaving,
  setPreviewMode,
  duplicateField,
  moveField,
  addFieldAtIndex,
  updateLogo,
  updateLogoSize,
  updateLogoAlignment,
  removeLogo,
  addPage,
  removePage,
  setCurrentPageIndex,
  setCurrentPage,
  setSelectedPageId,
  setFormPublished,
  clearError,
} = formBuilderSlice.actions;

export default formBuilderSlice.reducer;
