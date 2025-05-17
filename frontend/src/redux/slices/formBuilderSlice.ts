// // src/store/slices/formBuilderSlice.ts
// import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { Field, FieldType, Form } from '@/types/form';
// import { v4 as uuidv4 } from 'uuid';

// interface FormBuilderState {
//   form: Form | null;
//   selectedFieldId: string | null;
//   activeTab: 'build' | 'settings' | 'publish';
//   isDragging: boolean;
// }

// const initialState: FormBuilderState = {
//   form: {
//     id: uuidv4(),
//     title: 'My Form',
//     description: '',
//     fields: [],
//     settings: {
//       submitButtonText: 'Submit',
//       thankyouMessage: 'Thank you for your submission!',
//       defaultLabelAlignment: 'LEFT',
//       defaultRequiredField: false,
//     },
//     createdAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString(),
//   },
//   selectedFieldId: null,
//   activeTab: 'build',
//   isDragging: false,
// };

// export const formBuilderSlice = createSlice({
//   name: 'formBuilder',
//   initialState,
//   reducers: {
//     setFormTitle: (state, action: PayloadAction<string>) => {
//       if (state.form) {
//         state.form.title = action.payload;
//         state.form.updatedAt = new Date().toISOString();
//       }
//     },
//     addField: (
//       state,
//       action: PayloadAction<{ type: FieldType; order?: number }>
//     ) => {
//       if (!state.form) return;

//       const { type } = action.payload;
//       const newField: Field = {
//         id: uuidv4(),
//         type,
//         label: getDefaultLabelForType(type),
//         required: false,
//       };

//       state.form.fields.push(newField);
//       state.selectedFieldId = newField.id;
//       state.form.updatedAt = new Date().toISOString();
//     },
//     updateField: (
//       state,
//       action: PayloadAction<{ id: string; updates: Partial<Field> }>
//     ) => {
//       if (!state.form) return;

//       const { id, updates } = action.payload;
//       const fieldIndex = state.form.fields.findIndex(field => field.id === id);

//       if (fieldIndex !== -1) {
//         state.form.fields[fieldIndex] = {
//           ...state.form.fields[fieldIndex],
//           ...updates,
//         };
//         state.form.updatedAt = new Date().toISOString();
//       }
//     },
//     removeField: (state, action: PayloadAction<string>) => {
//       if (!state.form) return;

//       state.form.fields = state.form.fields.filter(
//         field => field.id !== action.payload
//       );

//       if (state.selectedFieldId === action.payload) {
//         state.selectedFieldId = null;
//       }

//       state.form.updatedAt = new Date().toISOString();
//     },
//     selectField: (state, action: PayloadAction<string | null>) => {
//       state.selectedFieldId = action.payload;
//     },
//     setActiveTab: (
//       state,
//       action: PayloadAction<'build' | 'settings' | 'publish'>
//     ) => {
//       state.activeTab = action.payload;
//     },
//     setIsDragging: (state, action: PayloadAction<boolean>) => {
//       state.isDragging = action.payload;
//     },
//   },
// });

// // Helper function to get default label for each field type
// function getDefaultLabelForType(type: FieldType): string {
//   switch (type) {
//     case FieldType.HEADING:
//       return 'Heading';
//     case FieldType.FULL_NAME:
//       return 'Full Name';
//     case FieldType.EMAIL:
//       return 'Email';
//     case FieldType.ADDRESS:
//       return 'Address';
//     case FieldType.PHONE:
//       return 'Phone';
//     case FieldType.DATE_PICKER:
//       return 'Date';
//     case FieldType.APPOINTMENT:
//       return 'Appointment';
//     case FieldType.SIGNATURE:
//       return 'Signature';
//     case FieldType.FILL_BLANK:
//       return 'Fill in the Blank';
//     case FieldType.PRODUCT_LIST:
//       return 'Product List';
//     default:
//       return 'New Field';
//   }
// }

// export const {
//   setFormTitle,
//   addField,
//   updateField,
//   removeField,
//   selectField,
//   setActiveTab,
//   setIsDragging,
// } = formBuilderSlice.actions;

// export default formBuilderSlice.reducer;

// src/redux/slices/formBuilderSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { Form, Field, FieldType, FormSettings } from '@/types/form';

interface FormBuilderState {
  form: Form | null;
  isPreviewMode: boolean;
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
      thankyouMessage: 'Thank you for your submission!',
      defaultLabelAlignment: 'TOP',
      defaultRequiredField: false,
    },
    selectedFieldId: null,
    lastSaved: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  },
  isPreviewMode: false,
};

const formBuilderSlice = createSlice({
  name: 'formBuilder',
  initialState,
  reducers: {
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
  },
});

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
  setFormTitle,
  addField,
  updateField,
  removeField,
  selectField,
  clearSelectedField,
  updateFormSettings,
  setPreviewMode,
  duplicateField,
} = formBuilderSlice.actions;

export default formBuilderSlice.reducer;
