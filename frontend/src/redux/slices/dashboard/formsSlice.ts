// src/redux/slices/dashboard/formsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { formsService } from '@/services/forms';
import { labelsService } from '@/services/labels';
import type { RootState } from '../../store';

// Define interface for forms (same as before)
export interface Form {
  id: string;
  name: string;
  description?: string;
  submissions: number;
  createdAt: string;
  lastEdited: string;
  lastSubmission: string;
  unread: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  labels: string[];
  daysRemaining?: number;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

interface FormsState {
  forms: Form[];
  labels: Label[];
  isLoading: boolean;
  labelsLoading: boolean;
  error: string | null;
  labelsError: string | null;
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  } | null;
  currentFilters: {
    search: string;
    status: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    labels: string[];
  };
}

// Async thunks (existing ones plus new rename functionality)
export const fetchForms = createAsyncThunk(
  'forms/fetchForms',
  async (
    filters: {
      search?: string;
      labels?: string[];
      status?:
        | 'published'
        | 'draft'
        | 'archived'
        | 'trashed'
        | 'favorites'
        | 'all';
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    } = {}
  ) => {
    // DEBUG: Log what the thunk receives
    console.log('🎯 Redux fetchForms thunk called with:', filters);

    if (filters.labels) {
      console.log('🏷️ Labels in Redux thunk:', {
        labels: filters.labels,
        type: typeof filters.labels,
        isArray: Array.isArray(filters.labels),
        length: filters.labels.length,
        values: filters.labels,
      });
    } else {
      console.log('❌ No labels in Redux thunk filters');
    }
    const response = await formsService.getForms(filters);
    return response;
  }
);

// NEW: Add rename form async thunk
export const renameFormAsync = createAsyncThunk(
  'forms/renameForm',
  async (
    { formId, newName }: { formId: string; newName: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await formsService.renameForm(formId, newName);
      return { formId, newName, ...response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to rename form'
      );
    }
  }
);

export const toggleFormFavorite = createAsyncThunk(
  'forms/toggleFavorite',
  async (formId: string) => {
    const response = await formsService.toggleFavorite(formId);
    return { formId, ...response.data };
  }
);

export const archiveFormAsync = createAsyncThunk(
  'forms/archiveForm',
  async (formId: string) => {
    await formsService.archiveForm(formId);
    return formId;
  }
);

export const trashFormAsync = createAsyncThunk(
  'forms/trashForm',
  async (formId: string) => {
    await formsService.trashForm(formId);
    return formId;
  }
);

export const restoreFormAsync = createAsyncThunk(
  'forms/restoreForm',
  async (formId: string) => {
    await formsService.restoreForm(formId);
    return formId;
  }
);

export const deleteFormAsync = createAsyncThunk(
  'forms/deleteForm',
  async (formId: string) => {
    await formsService.deleteForm(formId);
    return formId;
  }
);

export const bulkTrashFormsAsync = createAsyncThunk(
  'forms/bulkTrashForms',
  async (formIds: string[]) => {
    await formsService.bulkAction(formIds, 'trash');
    return formIds;
  }
);

export const bulkArchiveFormsAsync = createAsyncThunk(
  'forms/bulkArchiveForms',
  async (formIds: string[]) => {
    await formsService.bulkAction(formIds, 'archive');
    return formIds;
  }
);

export const bulkAddLabelToFormsAsync = createAsyncThunk(
  'forms/bulkAddLabelToForms',
  async ({ formIds, labelId }: { formIds: string[]; labelId: string }) => {
    await formsService.bulkAddLabel(formIds, labelId);
    return { formIds, labelId };
  }
);

export const bulkRemoveLabelFromFormsAsync = createAsyncThunk(
  'forms/bulkRemoveLabelFromForms',
  async ({ formIds, labelId }: { formIds: string[]; labelId: string }) => {
    await formsService.bulkRemoveLabel(formIds, labelId);
    return { formIds, labelId };
  }
);

export const createFormAsync = createAsyncThunk(
  'forms/createForm',
  async (
    data: { name?: string; description?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await formsService.createForm({
        name: data.name || 'Form',
        description: data.description,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create form'
      );
    }
  }
);

// Async thunks for labels (same as before)
export const fetchLabels = createAsyncThunk(
  'forms/fetchLabels',
  async (searchTerm: string | undefined, { rejectWithValue }) => {
    try {
      console.log(
        'Redux: Fetching labels...',
        searchTerm ? `search: "${searchTerm}"` : 'all'
      );
      const response = await labelsService.getLabels(searchTerm);
      console.log('Redux: Labels fetched successfully:', response);
      return response;
    } catch (error: any) {
      console.error('Redux: Error fetching labels:', error);
      const errorMessage = error.message || 'Failed to fetch labels';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createLabelAsync = createAsyncThunk(
  'forms/createLabel',
  async (data: { name: string; color: string }, { rejectWithValue }) => {
    try {
      console.log('Redux: Creating label...', data);
      const response = await labelsService.createLabel(data);
      console.log('Redux: Label created successfully:', response);
      return response.data;
    } catch (error: any) {
      console.error('Redux: Error creating label:', error);
      const errorMessage = error.message || 'Failed to create label';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateLabelAsync = createAsyncThunk(
  'forms/updateLabel',
  async (
    { id, data }: { id: string; data: { name?: string; color?: string } },
    { rejectWithValue }
  ) => {
    try {
      console.log('Redux: Updating label...', id, data);
      const response = await labelsService.updateLabel(id, data);
      console.log('Redux: Label updated successfully:', response);
      return response.data;
    } catch (error: any) {
      console.error('Redux: Error updating label:', error);
      const errorMessage = error.message || 'Failed to update label';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteLabelAsync = createAsyncThunk(
  'forms/deleteLabel',
  async (id: string, { rejectWithValue }) => {
    try {
      console.log('Redux: Deleting label...', id);
      await labelsService.deleteLabel(id);
      console.log('Redux: Label deleted successfully');
      return id;
    } catch (error: any) {
      console.error('Redux: Error deleting label:', error);
      const errorMessage = error.message || 'Failed to delete label';
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState: FormsState = {
  forms: [],
  labels: [],
  isLoading: false,
  labelsLoading: false,
  error: null,
  labelsError: null,
  pagination: null,
  currentFilters: {
    search: '',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    labels: [],
  },
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

    // NEW: Rename form optimistically
    renameFormOptimistic: (
      state,
      action: PayloadAction<{ formId: string; newName: string }>
    ) => {
      const form = state.forms.find(form => form.id === action.payload.formId);
      if (form) {
        form.name = action.payload.newName;
      }
    },

    // Toggle favorite status for a form
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const form = state.forms.find(form => form.id === action.payload);
      if (form) {
        form.isFavorite = !form.isFavorite;
      }
    },

    // Archive a form
    archiveForm: (state, action: PayloadAction<string>) => {
      const form = state.forms.find(form => form.id === action.payload);
      if (form) {
        form.isArchived = true;
      }
    },

    // Move a form to trash
    trashForm: (state, action: PayloadAction<string>) => {
      const form = state.forms.find(form => form.id === action.payload);
      if (form) {
        form.isTrashed = true;
        // Add 30 days remaining for trashed forms
        form.daysRemaining = 30;
      }
    },

    // Restore a form from archive or trash
    restoreForm: (state, action: PayloadAction<string>) => {
      const form = state.forms.find(form => form.id === action.payload);
      if (form) {
        form.isArchived = false;
        form.isTrashed = false;
        form.daysRemaining = undefined;
      }
    },

    // Permanently delete a form
    deleteForm: (state, action: PayloadAction<string>) => {
      state.forms = state.forms.filter(form => form.id !== action.payload);
    },

    // Bulk actions - move multiple forms to trash
    bulkTrashForms: (state, action: PayloadAction<string[]>) => {
      state.forms = state.forms.map(form =>
        action.payload.includes(form.id)
          ? { ...form, isTrashed: true, daysRemaining: 30 }
          : form
      );
    },

    // Bulk actions - archive multiple forms
    bulkArchiveForms: (state, action: PayloadAction<string[]>) => {
      state.forms = state.forms.map(form =>
        action.payload.includes(form.id) ? { ...form, isArchived: true } : form
      );
    },

    // Add label to a form
    addLabelToForm: (
      state,
      action: PayloadAction<{ formId: string; labelId: string }>
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
      action: PayloadAction<{ formId: string; labelId: string }>
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
      const newId = Math.max(...state.forms.map(form => parseInt(form.id))) + 1;
      const newForm: Form = {
        id: newId.toString(),
        name: action.payload.name,
        submissions: 0,
        createdAt: new Date().toISOString().split('T')[0],
        lastEdited: new Date().toISOString().split('T')[0],
        unread: false,
        isFavorite: false,
        isArchived: false,
        isTrashed: false,
        labels: [],
        lastSubmission: '',
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
        formIds: string[];
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
        formIds: string[];
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

    setFilters: (
      state,
      action: PayloadAction<Partial<typeof initialState.currentFilters>>
    ) => {
      state.currentFilters = { ...state.currentFilters, ...action.payload };
    },

    clearError: state => {
      state.error = null;
    },
    clearLabelsError: state => {
      state.labelsError = null;
    },

    toggleFavoriteOptimistic: (state, action: PayloadAction<string>) => {
      const form = state.forms.find(form => form.id === action.payload);
      if (form) {
        form.isFavorite = !form.isFavorite;
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchForms.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchForms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.forms = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchForms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch forms';
      })
      .addCase(createFormAsync.fulfilled, (state, action) => {
        state.forms.unshift(action.payload);
      })
      .addCase(toggleFormFavorite.fulfilled, (state, action) => {
        const form = state.forms.find(
          form => form.id === action.payload.formId
        );
        if (form) {
          form.isFavorite = action.payload.isFavorite;
        }
      })

      // NEW: Handle rename form async actions
      .addCase(renameFormAsync.fulfilled, (state, action) => {
        const form = state.forms.find(
          form => form.id === action.payload.formId
        );
        if (form) {
          form.name = action.payload.newName;
        }
      })
      .addCase(renameFormAsync.rejected, (state, action) => {
        state.error = action.payload as string;
        // Optionally revert optimistic update here if you implement it
      })

      .addCase(archiveFormAsync.fulfilled, (state, action) => {
        const form = state.forms.find(form => form.id === action.payload);
        if (form) {
          form.isArchived = true;
        }
      })
      .addCase(trashFormAsync.fulfilled, (state, action) => {
        const form = state.forms.find(form => form.id === action.payload);
        if (form) {
          form.isTrashed = true;
          form.daysRemaining = 30;
        }
      })
      .addCase(restoreFormAsync.fulfilled, (state, action) => {
        const form = state.forms.find(form => form.id === action.payload);
        if (form) {
          form.isArchived = false;
          form.isTrashed = false;
          form.daysRemaining = undefined;
        }
      })
      .addCase(deleteFormAsync.fulfilled, (state, action) => {
        state.forms = state.forms.filter(form => form.id !== action.payload);
      })
      .addCase(bulkTrashFormsAsync.fulfilled, (state, action) => {
        state.forms = state.forms.map(form =>
          action.payload.includes(form.id)
            ? { ...form, isTrashed: true, daysRemaining: 30 }
            : form
        );
      })
      .addCase(bulkArchiveFormsAsync.fulfilled, (state, action) => {
        state.forms = state.forms.map(form =>
          action.payload.includes(form.id)
            ? { ...form, isArchived: true }
            : form
        );
      })
      .addCase(bulkAddLabelToFormsAsync.fulfilled, (state, action) => {
        const { formIds, labelId } = action.payload;
        state.forms = state.forms.map(form => {
          if (formIds.includes(form.id)) {
            const labels = form.labels || [];
            if (!labels.includes(labelId)) {
              return { ...form, labels: [...labels, labelId] };
            }
          }
          return form;
        });
      })
      .addCase(bulkRemoveLabelFromFormsAsync.fulfilled, (state, action) => {
        const { formIds, labelId } = action.payload;
        state.forms = state.forms.map(form => {
          if (formIds.includes(form.id) && form.labels) {
            return {
              ...form,
              labels: form.labels.filter(id => id !== labelId),
            };
          }
          return form;
        });
      })

      // Fetch labels (same as before)
      .addCase(fetchLabels.pending, state => {
        state.labelsLoading = true;
        state.labelsError = null;
      })
      .addCase(fetchLabels.fulfilled, (state, action) => {
        console.log('Redux: fetchLabels.fulfilled', action.payload);
        state.labelsLoading = false;
        state.labels = action.payload.data || [];
        state.labelsError = null;
      })
      .addCase(fetchLabels.rejected, (state, action) => {
        console.log('Redux: fetchLabels.rejected', action.payload);
        state.labelsLoading = false;
        state.labelsError =
          (action.payload as string) || 'Failed to fetch labels';
      })
      .addCase(createLabelAsync.pending, () => {
        console.log('Redux: createLabelAsync.pending');
      })

      // Create label
      .addCase(createLabelAsync.fulfilled, (state, action) => {
        console.log('Redux: createLabelAsync.fulfilled', action.payload);
        state.labels.unshift(action.payload);
        state.labelsError = null;
      })
      .addCase(createLabelAsync.rejected, (state, action) => {
        console.log('Redux: createLabelAsync.rejected', action.payload);
        state.labelsError =
          (action.payload as string) || 'Failed to create label';
      })

      // Update label
      .addCase(updateLabelAsync.fulfilled, (state, action) => {
        console.log('Redux: updateLabelAsync.fulfilled', action.payload);
        const index = state.labels.findIndex(
          label => label.id === action.payload.id
        );
        if (index !== -1) {
          state.labels[index] = action.payload;
        }
        state.labelsError = null;
      })
      .addCase(updateLabelAsync.rejected, (state, action) => {
        console.log('Redux: updateLabelAsync.rejected', action.payload);
        state.labelsError =
          (action.payload as string) || 'Failed to update label';
      })

      // Delete label
      .addCase(deleteLabelAsync.fulfilled, (state, action) => {
        console.log('Redux: deleteLabelAsync.fulfilled', action.payload);
        state.labels = state.labels.filter(
          label => label.id !== action.payload
        );
        // Remove label from all forms
        state.forms = state.forms.map(form => ({
          ...form,
          labels:
            form.labels?.filter(labelId => labelId !== action.payload) || [],
        }));
        state.labelsError = null;
      })

      .addCase(deleteLabelAsync.rejected, (state, action) => {
        console.log('Redux: deleteLabelAsync.rejected', action.payload);
        state.labelsError =
          (action.payload as string) || 'Failed to delete label';
      });
  },
});

// Export actions
export const {
  updateForms,
  updateLabels,
  renameFormOptimistic, // NEW: Export the new action
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
  setFilters,
  clearError,
  toggleFavoriteOptimistic,
  clearLabelsError,
} = formsSlice.actions;

// Export selectors
export const selectForms = (state: RootState) => state.forms.forms;
export const selectLabels = (state: RootState) => state.forms.labels;
export const selectFormById = (id: string) => (state: RootState) =>
  state.forms.forms.find(form => form.id === id);
export const selectLabelById = (id: string) => (state: RootState) =>
  state.forms.labels.find(label => label.id === id);
export const selectFormsLoading = (state: RootState) => state.forms.isLoading;
export const selectLabelsLoading = (state: RootState) =>
  state.forms.labelsLoading;
export const selectLabelsError = (state: RootState) => state.forms.labelsError;
export const selectFormsError = (state: RootState) => state.forms.error;
export const selectFormsPagination = (state: RootState) =>
  state.forms.pagination;
export const selectCurrentFilters = (state: RootState) =>
  state.forms.currentFilters;

export default formsSlice.reducer;
