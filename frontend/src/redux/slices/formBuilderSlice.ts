// src/redux/slices/formBuilderSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import {
  Form,
  Field,
  FieldType,
  FormSettings,
  LogoState,
  FormPage,
} from '@/types/form';

interface FormBuilderState {
  form: Form | null;
  isPreviewMode: boolean;
  isSaving: boolean;
}

const createDefaultPage = (): FormPage => {
  return {
    id: uuidv4(),
    fields: [],
  };
};

const initialState: FormBuilderState = {
  form: {
    id: uuidv4(),
    title: 'My Form',
    pages: [createDefaultPage()],
    logo: null,
    selectedFieldId: null,
    selectedPageId: null,
    currentPageIndex: 0,
    propertiesPanelOpen: false,
    settings: {
      submitButtonText: 'Submit',
      showLogo: true,
      defaultLabelAlignment: 'TOP',
      thankyouMessage: 'Thank you for your submission!',
      defaultRequiredField: false,
    },
    lastSaved: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  },
  isPreviewMode: false,
  isSaving: false,
};

const formBuilderSlice = createSlice({
  name: 'formBuilder',
  initialState,
  reducers: {
    initializeForm: state => {
      const pageId = uuidv4();
      state.form = {
        id: uuidv4(),
        title: 'Untitled Form',
        description: '',
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
          defaultLabelAlignment: 'TOP',
          thankyouMessage: 'Thank you for your submission!',
          defaultRequiredField: false,
        },
        lastSaved: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    },
    setFormTitle: (state, action: PayloadAction<string>) => {
      if (state.form) {
        state.form.title = action.payload;
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },
    addField: (
      state,
      action: PayloadAction<{ type: FieldType; pageId?: string }>
    ) => {
      if (!state.form || !state.form.pages) return;

      // Create new field with default values
      const newField: Field = {
        id: uuidv4(),
        type: action.payload.type,
        label: getLabelForType(action.payload.type),
        required: state.form.settings?.defaultRequiredField || false,
        labelAlignment: state.form.settings?.defaultLabelAlignment || 'TOP',
      };

      // Add default helpText for email fields
      if (action.payload.type === FieldType.EMAIL) {
        newField.helpText = 'example@example.com';
        newField.placeholder = 'example@example.com';
      }

      // Determine which page to add the field to
      const pageId = action.payload.pageId || state.form.selectedPageId;
      if (!pageId) {
        // If no page is selected, add to the first page
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

      // Try to find the page containing the field
      const targetPageId = pageId || state.form.selectedPageId;
      if (!targetPageId) {
        // If no page ID is provided, search all pages
        for (const page of state.form.pages) {
          if (!page || !page.fields) continue;

          const fieldIndex = page.fields.findIndex(field => field.id === id);
          if (fieldIndex !== -1) {
            page.fields[fieldIndex] = {
              ...page.fields[fieldIndex],
              ...updates,
            };
            state.form.lastSaved = new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            return;
          }
        }
        return;
      }

      // If pageId is provided, find that specific page
      const pageIndex = state.form.pages.findIndex(
        page => page.id === targetPageId
      );
      if (pageIndex !== -1) {
        const page = state.form.pages[pageIndex];
        if (!page || !page.fields) return;

        const fieldIndex = page.fields.findIndex(field => field.id === id);
        if (fieldIndex !== -1) {
          page.fields[fieldIndex] = {
            ...page.fields[fieldIndex],
            ...updates,
          };
          state.form.lastSaved = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      }
    },
    removeField: (
      state,
      action: PayloadAction<{ fieldId: string; pageId?: string }>
    ) => {
      if (!state.form || !state.form.pages) return;

      const { fieldId, pageId } = action.payload;

      // If pageId is provided, only look in that page
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
          state.form.lastSaved = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
        return;
      }

      // If no pageId, search all pages
      for (const page of state.form.pages) {
        if (!page || !page.fields) continue;

        const fieldIndex = page.fields.findIndex(field => field.id === fieldId);
        if (fieldIndex !== -1) {
          page.fields = page.fields.filter(field => field.id !== fieldId);
          if (state.form.selectedFieldId === fieldId) {
            state.form.selectedFieldId = null;
          }
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
    updateFormSettings: (
      state,
      action: PayloadAction<Partial<FormSettings>>
    ) => {
      if (!state.form) return;

      state.form.settings = {
        ...state.form.settings,
        ...action.payload,
      };
      state.form.lastSaved = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    },
    setPreviewMode: (state, action: PayloadAction<boolean>) => {
      state.isPreviewMode = action.payload;

      // When entering preview mode, clear selection
      if (state.isPreviewMode && state.form) {
        state.form.selectedFieldId = null;
        state.form.propertiesPanelOpen = false;
      }
    },
    duplicateField: (state, action: PayloadAction<string>) => {
      if (!state.form || !state.form.pages) return;

      const fieldId = action.payload;

      // Find the field in all pages
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

          // Find the index of the original field
          const fieldIndex = page.fields.findIndex(
            field => field.id === fieldId
          );

          // Insert the duplicated field right after the original
          page.fields.splice(fieldIndex + 1, 0, duplicatedField);
          state.form.selectedFieldId = duplicatedField.id;
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

      // If pageId is provided, only move within that page
      if (pageId) {
        const pageIndex = state.form.pages.findIndex(
          page => page.id === pageId
        );
        if (pageIndex !== -1) {
          const page = state.form.pages[pageIndex];
          if (!page || !page.fields || !Array.isArray(page.fields)) return;

          const draggedField = page.fields[dragIndex];
          if (!draggedField) return;

          // Remove the dragged item
          page.fields.splice(dragIndex, 1);
          // Insert it at the new position
          page.fields.splice(hoverIndex, 0, draggedField);
        }
        return;
      }

      // If no pageId provided, assume we're moving within the current active page
      if (
        state.form.currentPageIndex !== undefined &&
        state.form.currentPageIndex >= 0 &&
        state.form.currentPageIndex < state.form.pages.length
      ) {
        const page = state.form.pages[state.form.currentPageIndex];
        if (!page || !page.fields || !Array.isArray(page.fields)) return;

        const draggedField = page.fields[dragIndex];
        if (!draggedField) return;

        // Remove the dragged item
        page.fields.splice(dragIndex, 1);
        // Insert it at the new position
        page.fields.splice(hoverIndex, 0, draggedField);
      }
    },
    addFieldAtIndex: (
      state,
      action: PayloadAction<{
        type: FieldType;
        index: number;
        pageId?: string;
      }>
    ) => {
      if (!state.form || !state.form.pages) return;

      const { type, index, pageId } = action.payload;

      // Determine target page
      let targetPageIndex = state.form.currentPageIndex || 0;

      if (pageId) {
        const foundIndex = state.form.pages.findIndex(
          page => page.id === pageId
        );
        if (foundIndex !== -1) {
          targetPageIndex = foundIndex;
        }
      }

      if (targetPageIndex < 0 || targetPageIndex >= state.form.pages.length)
        return;

      const page = state.form.pages[targetPageIndex];
      if (!page) return;

      // Initialize fields array if it doesn't exist
      if (!page.fields) {
        page.fields = [];
      }

      // Generate new field
      const newId = uuidv4();
      const newField: Field = {
        id: newId,
        type,
        label: getDefaultLabelForType(type),
        required: state.form.settings?.defaultRequiredField || false,
        helpText: '',
        labelAlignment: state.form.settings?.defaultLabelAlignment || 'TOP',
      };

      // Add default helpText for email fields
      if (type === FieldType.EMAIL) {
        newField.helpText = 'example@example.com';
        newField.placeholder = 'example@example.com';
      }

      // Insert at specified index
      page.fields.splice(index, 0, newField);

      // Select the new field
      state.form.selectedFieldId = newId;
    },
    togglePreviewMode: state => {
      state.isPreviewMode = !state.isPreviewMode;

      // When entering preview mode, clear selection
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
        // Ensure size value is properly handled as a number
        const sizeValue =
          typeof action.payload.size === 'number' ? action.payload.size : 50; // Default to 50% if not provided

        // Store the logo state with properly processed size
        state.form.logo = {
          ...action.payload,
          size: sizeValue,
          alignment: action.payload.alignment || 'CENTER',
        };

        // Update last saved timestamp
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

        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },
    removeLogo: state => {
      if (state.form) {
        state.form.logo = null;
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },
    addPage: state => {
      if (!state.form) return;

      // Initialize pages array if it doesn't exist
      if (!state.form.pages) {
        state.form.pages = [];
      }

      const newPageId = uuidv4();
      state.form.pages.push({
        id: newPageId,
        fields: [],
      });

      // Update last saved timestamp
      state.form.lastSaved = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Automatically navigate to the new page
      state.form.currentPageIndex = state.form.pages.length - 1;
      state.form.selectedPageId = newPageId;
    },
    removePage: (state, action: PayloadAction<string>) => {
      if (!state.form || !state.form.pages) return;

      const pageId = action.payload;
      const pageIndex = state.form.pages.findIndex(page => page.id === pageId);

      if (pageIndex !== -1) {
        // Don't allow removing the last page
        if (state.form.pages.length <= 1) {
          return;
        }

        // Remove the page
        state.form.pages.splice(pageIndex, 1);

        // Adjust current page index if needed
        if (
          state.form.currentPageIndex !== undefined &&
          state.form.currentPageIndex >= state.form.pages.length
        ) {
          state.form.currentPageIndex = state.form.pages.length - 1;
        }

        // Update selected page ID
        if (
          state.form.currentPageIndex !== undefined &&
          state.form.pages[state.form.currentPageIndex]
        ) {
          state.form.selectedPageId =
            state.form.pages[state.form.currentPageIndex].id;
        } else {
          state.form.selectedPageId = null;
        }

        // Update last saved timestamp
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      if (!state.form || !state.form.pages) return;

      const index = action.payload;

      // Ensure index is within bounds
      if (index >= 0 && index <= state.form.pages.length) {
        state.form.currentPageIndex = index;

        // Update selectedPageId if not on the thank you page
        if (index < state.form.pages.length && state.form.pages[index]) {
          state.form.selectedPageId = state.form.pages[index].id;
        }
      }
    },
  },
});

function getDefaultLabelForType(type: FieldType): string {
  switch (type) {
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
      return 'Signature';
    case FieldType.FILL_BLANK:
      return 'Complete the Sentence';
    case FieldType.PRODUCT_LIST:
      return 'Products';
    default:
      return 'New Field';
  }
}

function getLabelForType(type: FieldType): string {
  switch (type) {
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
  setCurrentPage,
} = formBuilderSlice.actions;

export default formBuilderSlice.reducer;
