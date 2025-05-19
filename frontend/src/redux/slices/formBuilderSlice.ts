// src/redux/slices/formBuilderSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { Form, Field, FieldType, FormSettings, Logo } from '@/types/form';

// Define the state interface
interface FormBuilderState {
  form: Form | null;
  isPreviewMode: boolean;
  isSaving: boolean;
  // lastSaved: Date | null;
}

const initialState: FormBuilderState = {
  form: {
    id: uuidv4(),
    title: 'My Form',
    fields: [
      {
        id: uuidv4(),
        type: FieldType.HEADING,
        label: 'Heading',
        required: false,
      },
      {
        id: uuidv4(),
        type: FieldType.EMAIL,
        label: 'Email',
        required: true,
        placeholder: 'example@example.com',
        helpText: 'example@example.',
        labelAlignment: 'TOP',
      },
    ],
    settings: {
      submitButtonText: 'Submit',
      // showProgressBar: true,
      defaultLabelAlignment: 'TOP',
      thankyouMessage: 'Thank you for your submission!',
      defaultRequiredField: false,
    },
    selectedFieldId: null,
    propertiesPanelOpen: false,
    lastSaved: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  },
  isPreviewMode: false,
  isSaving: false,
  // lastSaved: null,
};
// Helper function to generate a unique field ID
const generateFieldId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
};

const formBuilderSlice = createSlice({
  name: 'formBuilder',
  initialState,
  reducers: {
    initializeForm: state => {
      state.form = {
        id: generateFieldId(),
        title: 'Untitled Form',
        description: '',
        fields: [],
        selectedFieldId: null,
        propertiesPanelOpen: false,
        settings: {
          submitButtonText: 'Submit',
          // showProgressBar: true,
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
    addField: (state, action: PayloadAction<{ type: FieldType }>) => {
      if (state.form) {
        const newField: Field = {
          id: uuidv4(),
          type: action.payload.type,
          label: getLabelForType(action.payload.type),
          required: state.form.settings.defaultRequiredField,
          labelAlignment: state.form.settings.defaultLabelAlignment,
        };

        // Add default helpText for email fields
        if (action.payload.type === FieldType.EMAIL) {
          newField.helpText = 'example@example.';
          newField.placeholder = 'example@example.com';
        }

        state.form.fields.push(newField);
        state.form.selectedFieldId = newField.id;
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },
    updateField: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Field> }>
    ) => {
      if (state.form) {
        const { id, updates } = action.payload;
        const fieldIndex = state.form.fields.findIndex(
          field => field.id === id
        );
        if (fieldIndex !== -1) {
          state.form.fields[fieldIndex] = {
            ...state.form.fields[fieldIndex],
            ...updates,
          };
          state.form.lastSaved = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      }
    },
    removeField: (state, action: PayloadAction<string>) => {
      if (state.form) {
        state.form.fields = state.form.fields.filter(
          field => field.id !== action.payload
        );
        state.form.selectedFieldId = null;
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
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
    // Add a new action to toggle properties panel
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
      if (state.form) {
        state.form.settings = {
          ...state.form.settings,
          ...action.payload,
        };
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },
    setPreviewMode: (state, action: PayloadAction<boolean>) => {
      state.isPreviewMode = action.payload;
    },
    duplicateField: (state, action: PayloadAction<string>) => {
      if (state.form) {
        const fieldToDuplicate = state.form.fields.find(
          field => field.id === action.payload
        );

        if (fieldToDuplicate) {
          const duplicatedField = {
            ...fieldToDuplicate,
            id: uuidv4(),
            label: `${fieldToDuplicate.label} (Copy)`,
          };

          // Find the index of the original field
          const fieldIndex = state.form.fields.findIndex(
            field => field.id === action.payload
          );

          // Insert the duplicated field right after the original
          state.form.fields.splice(fieldIndex + 1, 0, duplicatedField);
          state.form.selectedFieldId = duplicatedField.id;
          state.form.lastSaved = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      }
    },
    moveField: (
      state,
      action: PayloadAction<{ dragIndex: number; hoverIndex: number }>
    ) => {
      if (!state.form) return;

      const { dragIndex, hoverIndex } = action.payload;
      const draggedField = state.form.fields[dragIndex];

      // Remove the dragged item
      state.form.fields.splice(dragIndex, 1);
      // Insert it at the new position
      state.form.fields.splice(hoverIndex, 0, draggedField);
    },
    addFieldAtIndex: (
      state,
      action: PayloadAction<{ type: FieldType; index: number }>
    ) => {
      if (!state.form) return;

      const { type, index } = action.payload;

      // Generate unique ID
      const id = Date.now().toString();

      // Create new field
      const newField = {
        id,
        type,
        label: getDefaultLabelForType(type),
        required: false,
        helpText: '',
        labelAlignment: state.form.settings?.defaultLabelAlignment || 'TOP',
        // Add other default properties as needed
      };

      // Insert at specified index
      state.form.fields.splice(index, 0, newField);

      // Select the new field
      state.form.selectedFieldId = id;
    },
    // Toggle preview mode
    togglePreviewMode: state => {
      state.isPreviewMode = !state.isPreviewMode;

      // When entering preview mode, clear selection
      if (state.isPreviewMode && state.form) {
        state.form.selectedFieldId = null;
        state.form.propertiesPanelOpen = false;
      }
    },
    // Set saving state
    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },
    updateLogo: (state, action: PayloadAction<Logo>) => {
      if (state.form) {
        state.form.logo = action.payload;
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },
    removeLogo: state => {
      if (state.form && state.form.logo) {
        delete state.form.logo;
        state.form.lastSaved = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },
  },
});

// Helper function to get default label for a field type
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

// Helper function to get label based on field type
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
  removeLogo,
} = formBuilderSlice.actions;

export default formBuilderSlice.reducer;
