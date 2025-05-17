import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

// Define interface for forms
export interface Form {
  id: number;
  name: string;
  submissions: number;
  createdAt: string;
  lastEdited?: string;
  lastSubmission?: string;
  unread?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
  labels?: string[];
  daysRemaining?: number;
}

// Define interface for labels
export interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

// Define interface for the forms state
interface FormsState {
  forms: Form[];
  labels: Label[];
  isLoading: boolean;
  error: string | null;
}

// Sample initial data
const initialForms: Form[] = [
  {
    id: 1,
    name: 'Form',
    submissions: 0,
    createdAt: '2025-05-11',
    lastEdited: '2025-05-12',
    lastSubmission: '',
    unread: false,
    isFavorite: false,
    isArchived: false,
    isTrashed: false,
  },
  {
    id: 2,
    name: 'React Developer Job Application',
    submissions: 3,
    createdAt: '2025-05-08',
    lastEdited: '2025-05-10',
    lastSubmission: '2025-05-14',
    unread: true,
    isFavorite: false,
    isArchived: false,
    isTrashed: false,
  },
  {
    id: 3,
    name: 'Customer Feedback Survey',
    submissions: 12,
    createdAt: '2025-05-05',
    lastEdited: '2025-05-07',
    lastSubmission: '2025-05-13',
    unread: true,
    isFavorite: true,
    isArchived: false,
    isTrashed: false,
  },
  {
    id: 4,
    name: 'Event Registration',
    submissions: 8,
    createdAt: '2025-05-09',
    lastEdited: '2025-05-09',
    lastSubmission: '2025-05-14',
    unread: false,
    isFavorite: false,
    isArchived: false,
    isTrashed: false,
  },
  {
    id: 101,
    name: 'Old Form',
    submissions: 0,
    createdAt: '2025-05-11',
    lastEdited: '2025-05-12',
    lastSubmission: '',
    unread: false,
    isFavorite: false,
    isArchived: false,
    isTrashed: true,
    daysRemaining: 29,
  },
  {
    id: 102,
    name: 'Old Survey',
    submissions: 5,
    createdAt: '2025-05-09',
    lastEdited: '2025-05-09',
    lastSubmission: '',
    unread: false,
    isFavorite: false,
    isArchived: false,
    isTrashed: true,
    daysRemaining: 28,
  },
];

// Initial sample labels
const initialLabels: Label[] = [
  {
    id: 'label-1',
    name: 'Important',
    color: '#EF4444', // Red
    createdAt: Date.now() - 3000000,
  },
  {
    id: 'label-2',
    name: 'Work',
    color: '#3B82F6', // Blue
    createdAt: Date.now() - 2000000,
  },
  {
    id: 'label-3',
    name: 'Personal',
    color: '#10B981', // Green
    createdAt: Date.now() - 1000000,
  },
];

// Initial state
const initialState: FormsState = {
  forms: initialForms,
  labels: initialLabels,
  isLoading: false,
  error: null,
};

// Create the slice
export const formsSlice = createSlice({
  name: 'forms',
  initialState,
  reducers: {
    // Update all forms
    updateForms: (state, action: PayloadAction<Form[]>) => {
      state.forms = action.payload;
    },

    // Update all labels
    updateLabels: (state, action: PayloadAction<Label[]>) => {
      state.labels = action.payload;
    },

    // Toggle favorite status for a form
    toggleFavorite: (state, action: PayloadAction<number>) => {
      const form = state.forms.find(form => form.id === action.payload);
      if (form) {
        form.isFavorite = !form.isFavorite;
      }
    },

    // Archive a form
    archiveForm: (state, action: PayloadAction<number>) => {
      const form = state.forms.find(form => form.id === action.payload);
      if (form) {
        form.isArchived = true;
      }
    },

    // Move a form to trash
    trashForm: (state, action: PayloadAction<number>) => {
      const form = state.forms.find(form => form.id === action.payload);
      if (form) {
        form.isTrashed = true;
        // Add 30 days remaining for trashed forms
        form.daysRemaining = 30;
      }
    },

    // Restore a form from archive or trash
    restoreForm: (state, action: PayloadAction<number>) => {
      const form = state.forms.find(form => form.id === action.payload);
      if (form) {
        form.isArchived = false;
        form.isTrashed = false;
        form.daysRemaining = undefined;
      }
    },

    // Permanently delete a form
    deleteForm: (state, action: PayloadAction<number>) => {
      state.forms = state.forms.filter(form => form.id !== action.payload);
    },

    // Bulk actions - move multiple forms to trash
    bulkTrashForms: (state, action: PayloadAction<number[]>) => {
      state.forms = state.forms.map(form =>
        action.payload.includes(form.id)
          ? { ...form, isTrashed: true, daysRemaining: 30 }
          : form
      );
    },

    // Bulk actions - archive multiple forms
    bulkArchiveForms: (state, action: PayloadAction<number[]>) => {
      state.forms = state.forms.map(form =>
        action.payload.includes(form.id) ? { ...form, isArchived: true } : form
      );
    },

    // Add label to a form
    addLabelToForm: (
      state,
      action: PayloadAction<{ formId: number; labelId: string }>
    ) => {
      const form = state.forms.find(form => form.id === action.payload.formId);
      if (form) {
        if (!form.labels) {
          form.labels = [];
        }
        if (!form.labels.includes(action.payload.labelId)) {
          form.labels.push(action.payload.labelId);
        }
      }
    },

    // Remove label from a form
    removeLabelFromForm: (
      state,
      action: PayloadAction<{ formId: number; labelId: string }>
    ) => {
      const form = state.forms.find(form => form.id === action.payload.formId);
      if (form && form.labels) {
        form.labels = form.labels.filter(id => id !== action.payload.labelId);
      }
    },

    // Create a new form
    createForm: (
      state,
      action: PayloadAction<{ name: string; description?: string }>
    ) => {
      const newId = Math.max(...state.forms.map(form => form.id)) + 1;
      const newForm: Form = {
        id: newId,
        name: action.payload.name,
        submissions: 0,
        createdAt: new Date().toISOString().split('T')[0],
        lastEdited: new Date().toISOString().split('T')[0],
        unread: false,
        isFavorite: false,
        isArchived: false,
        isTrashed: false,
      };
      state.forms.push(newForm);
    },

    // Create a new label
    createLabel: (
      state,
      action: PayloadAction<{ name: string; color: string }>
    ) => {
      const newId = `label-${Date.now()}`;
      const newLabel: Label = {
        id: newId,
        name: action.payload.name,
        color: action.payload.color,
        createdAt: Date.now(),
      };
      state.labels.push(newLabel);
    },

    // Update a label
    updateLabel: (
      state,
      action: PayloadAction<{ id: string; name: string; color: string }>
    ) => {
      const index = state.labels.findIndex(
        label => label.id === action.payload.id
      );
      if (index !== -1) {
        state.labels[index] = {
          ...state.labels[index],
          name: action.payload.name,
          color: action.payload.color,
        };
      }
    },

    // Delete a label
    deleteLabel: (state, action: PayloadAction<string>) => {
      state.labels = state.labels.filter(label => label.id !== action.payload);

      // Remove this label from all forms
      state.forms.forEach(form => {
        if (form.labels) {
          form.labels = form.labels.filter(id => id !== action.payload);
        }
      });
    },

    // Add label to forms
    bulkAddLabelToForms: (
      state,
      action: PayloadAction<{
        formIds: number[];
        labelId: string;
      }>
    ) => {
      const { formIds, labelId } = action.payload;

      formIds.forEach(formId => {
        const form = state.forms.find(f => f.id === formId);
        if (form) {
          if (!form.labels) {
            form.labels = [labelId];
          } else if (!form.labels.includes(labelId)) {
            form.labels.push(labelId);
          }
        }
      });
    },

    // Remove label from forms
    bulkRemoveLabelFromForms: (
      state,
      action: PayloadAction<{
        formIds: number[];
        labelId: string;
      }>
    ) => {
      const { formIds, labelId } = action.payload;

      formIds.forEach(formId => {
        const form = state.forms.find(f => f.id === formId);
        if (form && form.labels) {
          form.labels = form.labels.filter(id => id !== labelId);
        }
      });
    },
  },
});

// Export actions
export const {
  updateForms,
  updateLabels,
  toggleFavorite,
  archiveForm,
  trashForm,
  restoreForm,
  deleteForm,
  bulkTrashForms,
  bulkArchiveForms,
  addLabelToForm,
  removeLabelFromForm,
  createForm,
  createLabel,
  updateLabel,
  deleteLabel,
  bulkAddLabelToForms,
  bulkRemoveLabelFromForms,
} = formsSlice.actions;

// Export selectors
export const selectForms = (state: RootState) => state.forms.forms;
export const selectLabels = (state: RootState) => state.forms.labels;
export const selectFormById = (id: number) => (state: RootState) =>
  state.forms.forms.find(form => form.id === id);
export const selectLabelById = (id: string) => (state: RootState) =>
  state.forms.labels.find(label => label.id === id);

// Export reducer
export default formsSlice.reducer;
