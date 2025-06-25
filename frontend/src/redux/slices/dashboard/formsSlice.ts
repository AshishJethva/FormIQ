import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { formsService, CreateFormData } from '@/services/forms';
import { labelsService } from '@/services/labels';
import {
  incrementFormsUsed,
  decrementFormsUsed,
} from '@/redux/slices/userProfile/userProfileSlice';
import type { RootState } from '../../store';

interface EnhancedCreateFormData extends CreateFormData {
  template?: {
    title: string;
    description?: string;
    pages: any[];
    settings: any;
  };
}

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
  trashedAt?: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  userId: string;
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
  selectedForms: string[];
}

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
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await formsService.getForms(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch forms'
      );
    }
  }
);

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
  async (formId: string, { dispatch }) => {
    await formsService.restoreForm(formId);
    dispatch(incrementFormsUsed());
    return formId;
  }
);

export const deleteFormAsync = createAsyncThunk(
  'forms/deleteFormCompletely',
  async (formId: string, { rejectWithValue, dispatch, getState }) => {
    try {
      const state = getState() as RootState;
      const form = state.forms.forms.find(f => f.id === formId);

      const result = await formsService.deleteForm(formId);

      // Only decrement if the form was not already trashed (permanent deletion)
      if (form && !form.isTrashed) {
        dispatch(decrementFormsUsed());
      }

      return {
        formId,
        details: result.details,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('❌ Redux: Form deletion failed:', error);
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Failed to delete form and associated data'
      );
    }
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
  async (formData: EnhancedCreateFormData, { rejectWithValue, getState }) => {
    try {
      // Check form limits before creating
      const state = getState() as RootState;
      const userProfile = state.userProfile.profile;

      if (userProfile && !userProfile.profile.plan.canCreateForms) {
        const planType = userProfile.profile.plan.type;
        const formsUsed = userProfile.profile.plan.formsUsed;
        const formsLimit = userProfile.profile.plan.formsLimit;

        return rejectWithValue(
          `Form limit reached! You've used ${formsUsed} of ${formsLimit} forms available in your ${planType} plan. Upgrade to create more forms.`
        );
      }

      if (formData.template) {
        const basicFormData = {
          name: formData.name,
          description: formData.description || formData.template.description,
        };

        const response = await formsService.createForm(basicFormData);
        const createdForm = response.data;

        const updateData = {
          title: formData.template.title,
          description: formData.template.description,
          pages: formData.template.pages,
          settings: formData.template.settings,
        };

        await formsService.updateForm(createdForm.id, updateData);

        // Return the form with template structure applied
        return {
          ...createdForm,
          ...updateData,
        };
      } else {
        // Regular form creation
        const response = await formsService.createForm(formData);

        return response.data;
      }
    } catch (error: any) {
      console.error('Create form error:', error);
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Failed to create form'
      );
    }
  }
);

// Async thunks for labels
export const fetchLabels = createAsyncThunk(
  'forms/fetchLabels',
  async (searchTerm: string | undefined, { rejectWithValue }) => {
    try {
      const response = await labelsService.getLabels(searchTerm);
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
      const response = await labelsService.createLabel(data);
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
      const response = await labelsService.updateLabel(id, data);

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
      await labelsService.deleteLabel(id);

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
  selectedForms: [],
};

// Create the slice
export const formsSlice = createSlice({
  name: 'forms',
  initialState,
  reducers: {
    updateForms: (state, action: PayloadAction<Form[]>) => {
      state.forms = action.payload;
    },

    // Update all labels
    updateLabels: (state, action: PayloadAction<Label[]>) => {
      state.labels = action.payload;
    },

    renameFormOptimistic: (
      state,
      action: PayloadAction<{ formId: string; newName: string }>
    ) => {
      const form = state.forms.find(form => form.id === action.payload.formId);
      if (form) {
        form.name = action.payload.newName;
      }
    },

    toggleFavorite: (state, action: PayloadAction<string>) => {
      const form = state.forms.find(form => form.id === action.payload);
      if (form) {
        form.isFavorite = !form.isFavorite;
      }
    },

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

    deleteFormCompletely: (
      state,
      action: PayloadAction<{
        formId: string;
        details: {
          submissionsDeleted: number;
          filesDeleted: number;
          filesFailed: number;
          logoDeleted: boolean;
        };
      }>
    ) => {
      const { formId } = action.payload;

      // Remove form from state
      state.forms = state.forms.filter(form => form.id !== formId);
    },

    bulkDeleteFormsCompletely: (
      state,
      action: PayloadAction<{
        formIds: string[];
        results: Array<{
          formId: string;
          success: boolean;
          details?: any;
          error?: string;
        }>;
      }>
    ) => {
      const { results } = action.payload;

      // Remove successfully deleted forms
      const successfulDeletions = results
        .filter(result => result.success)
        .map(result => result.formId);

      state.forms = state.forms.filter(
        form => !successfulDeletions.includes(form.id)
      );
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
        userId: '',
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

    clearFilters: state => {
      state.currentFilters = initialState.currentFilters;
    },

    setSelectedForms: (state, action: PayloadAction<string[]>) => {
      state.selectedForms = action.payload;
    },

    toggleFormSelection: (state, action: PayloadAction<string>) => {
      const formId = action.payload;
      if (state.selectedForms.includes(formId)) {
        state.selectedForms = state.selectedForms.filter(id => id !== formId);
      } else {
        state.selectedForms.push(formId);
      }
    },

    selectAllForms: state => {
      state.selectedForms = state.forms.map(form => form.id);
    },
    clearSelection: state => {
      state.selectedForms = [];
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
      .addCase(createFormAsync.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createFormAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.forms.unshift(action.payload);
      })
      .addCase(createFormAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(toggleFormFavorite.fulfilled, (state, action) => {
        const form = state.forms.find(
          form => form.id === action.payload.formId
        );
        if (form) {
          form.isFavorite = action.payload.isFavorite;
        }
      })

      //  Handle rename form async actions
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
        state.forms = state.forms.filter(
          form => form.id !== action.payload.formId
        );
        state.selectedForms = state.selectedForms.filter(
          id => id !== action.payload.formId
        );

        state.error = null;
      })
      .addCase(deleteFormAsync.rejected, (state, action) => {
        state.error = action.payload as string;
        console.error('Redux: Form deletion failed:', action.payload);
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

      // Fetch labels
      .addCase(fetchLabels.pending, state => {
        state.labelsLoading = true;
        state.labelsError = null;
      })
      .addCase(fetchLabels.fulfilled, (state, action) => {
        state.labelsLoading = false;
        state.labels = action.payload.data || [];
        state.labelsError = null;
      })
      .addCase(fetchLabels.rejected, (state, action) => {
        state.labelsLoading = false;
        state.labelsError =
          (action.payload as string) || 'Failed to fetch labels';
      })

      // Create label
      .addCase(createLabelAsync.fulfilled, (state, action) => {
        state.labels.unshift(action.payload);
        state.labelsError = null;
      })
      .addCase(createLabelAsync.rejected, (state, action) => {
        state.labelsError =
          (action.payload as string) || 'Failed to create label';
      })

      // Update label
      .addCase(updateLabelAsync.fulfilled, (state, action) => {
        const index = state.labels.findIndex(
          label => label.id === action.payload.id
        );
        if (index !== -1) {
          state.labels[index] = action.payload;
        }
        state.labelsError = null;
      })
      .addCase(updateLabelAsync.rejected, (state, action) => {
        state.labelsError =
          (action.payload as string) || 'Failed to update label';
      })

      // Delete label
      .addCase(deleteLabelAsync.fulfilled, (state, action) => {
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
        state.labelsError =
          (action.payload as string) || 'Failed to delete label';
      });
  },
});

// Export actions
export const {
  updateForms,
  updateLabels,
  renameFormOptimistic,
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
  deleteFormCompletely,
  bulkDeleteFormsCompletely,
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
