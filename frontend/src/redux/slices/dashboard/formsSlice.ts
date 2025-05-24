// import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// import { formsService } from '@/services/forms';
// import { labelsService } from '@/services/labels';
// import type { RootState } from '../../store';

// // Define interface for forms
// export interface Form {
//   id: string;
//   name: string;
//   description?: string;
//   submissions: number;
//   createdAt: string;
//   lastEdited: string;
//   lastSubmission: string;
//   unread: boolean;
//   isFavorite: boolean;
//   isArchived: boolean;
//   isTrashed: boolean;
//   labels: string[];
//   daysRemaining?: number;
// }

// export interface Label {
//   id: string;
//   name: string;
//   color: string;
//   createdAt: number;
// }

// interface FormsState {
//   forms: Form[];
//   labels: Label[];
//   isLoading: boolean;
//   labelsLoading: boolean;
//   error: string | null;
//   labelsError: string | null;
//   pagination: {
//     current: number;
//     pages: number;
//     total: number;
//     limit: number;
//   } | null;
//   currentFilters: {
//     search: string;
//     status: string;
//     sortBy: string;
//     sortOrder: 'asc' | 'desc';
//     labels: string[];
//   };
// }

// // Async thunks
// export const fetchForms = createAsyncThunk(
//   'forms/fetchForms',
//   async (
//     filters: {
//       search?: string;
//       labels?: string[];
//       status?:
//         | 'published'
//         | 'draft'
//         | 'archived'
//         | 'trashed'
//         | 'favorites'
//         | 'all';
//       sortBy?: string;
//       sortOrder?: 'asc' | 'desc';
//       page?: number;
//       limit?: number;
//     } = {}
//   ) => {
//     const response = await formsService.getForms(filters);
//     return response;
//   }
// );

// export const toggleFormFavorite = createAsyncThunk(
//   'forms/toggleFavorite',
//   async (formId: string) => {
//     const response = await formsService.toggleFavorite(formId);
//     return { formId, ...response.data };
//   }
// );

// export const archiveFormAsync = createAsyncThunk(
//   'forms/archiveForm',
//   async (formId: string) => {
//     await formsService.archiveForm(formId);
//     return formId;
//   }
// );

// export const trashFormAsync = createAsyncThunk(
//   'forms/trashForm',
//   async (formId: string) => {
//     await formsService.trashForm(formId);
//     return formId;
//   }
// );

// export const restoreFormAsync = createAsyncThunk(
//   'forms/restoreForm',
//   async (formId: string) => {
//     await formsService.restoreForm(formId);
//     return formId;
//   }
// );

// export const deleteFormAsync = createAsyncThunk(
//   'forms/deleteForm',
//   async (formId: string) => {
//     await formsService.deleteForm(formId);
//     return formId;
//   }
// );

// export const bulkTrashFormsAsync = createAsyncThunk(
//   'forms/bulkTrashForms',
//   async (formIds: string[]) => {
//     await formsService.bulkAction(formIds, 'trash');
//     return formIds;
//   }
// );

// export const bulkArchiveFormsAsync = createAsyncThunk(
//   'forms/bulkArchiveForms',
//   async (formIds: string[]) => {
//     await formsService.bulkAction(formIds, 'archive');
//     return formIds;
//   }
// );

// export const bulkAddLabelToFormsAsync = createAsyncThunk(
//   'forms/bulkAddLabelToForms',
//   async ({ formIds, labelId }: { formIds: string[]; labelId: string }) => {
//     await formsService.bulkAddLabel(formIds, labelId);
//     return { formIds, labelId };
//   }
// );

// export const bulkRemoveLabelFromFormsAsync = createAsyncThunk(
//   'forms/bulkRemoveLabelFromForms',
//   async ({ formIds, labelId }: { formIds: string[]; labelId: string }) => {
//     await formsService.bulkRemoveLabel(formIds, labelId);
//     return { formIds, labelId };
//   }
// );

// export const createFormAsync = createAsyncThunk(
//   'forms/createForm',
//   async (
//     data: { name?: string; description?: string },
//     { rejectWithValue }
//   ) => {
//     try {
//       const response = await formsService.createForm({
//         name: data.name || 'Form',
//         description: data.description,
//       });
//       return response.data;
//     } catch (error: any) {
//       return rejectWithValue(
//         error.response?.data?.message || 'Failed to create form'
//       );
//     }
//   }
// );

// // Async thunks for labels
// export const fetchLabels = createAsyncThunk(
//   'forms/fetchLabels',
//   async (searchTerm: string | undefined, { rejectWithValue }) => {
//     try {
//       console.log(
//         'Redux: Fetching labels...',
//         searchTerm ? `search: "${searchTerm}"` : 'all'
//       );
//       const response = await labelsService.getLabels(searchTerm);
//       console.log('Redux: Labels fetched successfully:', response);
//       return response;
//     } catch (error: any) {
//       console.error('Redux: Error fetching labels:', error);
//       const errorMessage = error.message || 'Failed to fetch labels';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// export const createLabelAsync = createAsyncThunk(
//   'forms/createLabel',
//   async (data: { name: string; color: string }, { rejectWithValue }) => {
//     try {
//       console.log('Redux: Creating label...', data);
//       const response = await labelsService.createLabel(data);
//       console.log('Redux: Label created successfully:', response);
//       return response.data;
//     } catch (error: any) {
//       console.error('Redux: Error creating label:', error);
//       const errorMessage = error.message || 'Failed to create label';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// export const updateLabelAsync = createAsyncThunk(
//   'forms/updateLabel',
//   async (
//     { id, data }: { id: string; data: { name?: string; color?: string } },
//     { rejectWithValue }
//   ) => {
//     try {
//       console.log('Redux: Updating label...', id, data);
//       const response = await labelsService.updateLabel(id, data);
//       console.log('Redux: Label updated successfully:', response);
//       return response.data;
//     } catch (error: any) {
//       console.error('Redux: Error updating label:', error);
//       const errorMessage = error.message || 'Failed to update label';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// export const deleteLabelAsync = createAsyncThunk(
//   'forms/deleteLabel',
//   async (id: string, { rejectWithValue }) => {
//     try {
//       console.log('Redux: Deleting label...', id);
//       await labelsService.deleteLabel(id);
//       console.log('Redux: Label deleted successfully');
//       return id;
//     } catch (error: any) {
//       console.error('Redux: Error deleting label:', error);
//       const errorMessage = error.message || 'Failed to delete label';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// const initialState: FormsState = {
//   forms: [],
//   labels: [],
//   isLoading: false,
//   labelsLoading: false,
//   error: null,
//   labelsError: null,
//   pagination: null,
//   currentFilters: {
//     search: '',
//     status: 'all',
//     sortBy: 'createdAt',
//     sortOrder: 'desc',
//     labels: [],
//   },
// };

// // Create the slice
// export const formsSlice = createSlice({
//   name: 'forms',
//   initialState,
//   reducers: {
//     // Update all forms
//     updateForms: (state, action: PayloadAction<Form[]>) => {
//       state.forms = action.payload;
//     },

//     // Update all labels
//     updateLabels: (state, action: PayloadAction<Label[]>) => {
//       state.labels = action.payload;
//     },

//     // Toggle favorite status for a form
//     toggleFavorite: (state, action: PayloadAction<string>) => {
//       const form = state.forms.find(form => form.id === action.payload);
//       if (form) {
//         form.isFavorite = !form.isFavorite;
//       }
//     },

//     // Archive a form
//     archiveForm: (state, action: PayloadAction<string>) => {
//       const form = state.forms.find(form => form.id === action.payload);
//       if (form) {
//         form.isArchived = true;
//       }
//     },

//     // Move a form to trash
//     trashForm: (state, action: PayloadAction<string>) => {
//       const form = state.forms.find(form => form.id === action.payload);
//       if (form) {
//         form.isTrashed = true;
//         // Add 30 days remaining for trashed forms
//         form.daysRemaining = 30;
//       }
//     },

//     // Restore a form from archive or trash
//     restoreForm: (state, action: PayloadAction<string>) => {
//       const form = state.forms.find(form => form.id === action.payload);
//       if (form) {
//         form.isArchived = false;
//         form.isTrashed = false;
//         form.daysRemaining = undefined;
//       }
//     },

//     // Permanently delete a form
//     deleteForm: (state, action: PayloadAction<string>) => {
//       state.forms = state.forms.filter(form => form.id !== action.payload);
//     },

//     // Bulk actions - move multiple forms to trash
//     bulkTrashForms: (state, action: PayloadAction<string[]>) => {
//       state.forms = state.forms.map(form =>
//         action.payload.includes(form.id)
//           ? { ...form, isTrashed: true, daysRemaining: 30 }
//           : form
//       );
//     },

//     // Bulk actions - archive multiple forms
//     bulkArchiveForms: (state, action: PayloadAction<string[]>) => {
//       state.forms = state.forms.map(form =>
//         action.payload.includes(form.id) ? { ...form, isArchived: true } : form
//       );
//     },

//     // Add label to a form
//     addLabelToForm: (
//       state,
//       action: PayloadAction<{ formId: string; labelId: string }>
//     ) => {
//       const form = state.forms.find(form => form.id === action.payload.formId);
//       if (form) {
//         if (!form.labels) {
//           form.labels = [];
//         }
//         if (!form.labels.includes(action.payload.labelId)) {
//           form.labels.push(action.payload.labelId);
//         }
//       }
//     },

//     // Remove label from a form
//     removeLabelFromForm: (
//       state,
//       action: PayloadAction<{ formId: string; labelId: string }>
//     ) => {
//       const form = state.forms.find(form => form.id === action.payload.formId);
//       if (form && form.labels) {
//         form.labels = form.labels.filter(id => id !== action.payload.labelId);
//       }
//     },

//     // Create a new form
//     createForm: (
//       state,
//       action: PayloadAction<{ name: string; description?: string }>
//     ) => {
//       const newId = Math.max(...state.forms.map(form => parseInt(form.id))) + 1;
//       const newForm: Form = {
//         id: newId.toString(),
//         name: action.payload.name,
//         submissions: 0,
//         createdAt: new Date().toISOString().split('T')[0],
//         lastEdited: new Date().toISOString().split('T')[0],
//         unread: false,
//         isFavorite: false,
//         isArchived: false,
//         isTrashed: false,
//         labels: [],
//         lastSubmission: '',
//       };
//       state.forms.push(newForm);
//     },

//     // Create a new label
//     createLabel: (
//       state,
//       action: PayloadAction<{ name: string; color: string }>
//     ) => {
//       const newId = `label-${Date.now()}`;
//       const newLabel: Label = {
//         id: newId,
//         name: action.payload.name,
//         color: action.payload.color,
//         createdAt: Date.now(),
//       };
//       state.labels.push(newLabel);
//     },

//     // Update a label
//     updateLabel: (
//       state,
//       action: PayloadAction<{ id: string; name: string; color: string }>
//     ) => {
//       const index = state.labels.findIndex(
//         label => label.id === action.payload.id
//       );
//       if (index !== -1) {
//         state.labels[index] = {
//           ...state.labels[index],
//           name: action.payload.name,
//           color: action.payload.color,
//         };
//       }
//     },

//     // Delete a label
//     deleteLabel: (state, action: PayloadAction<string>) => {
//       state.labels = state.labels.filter(label => label.id !== action.payload);

//       // Remove this label from all forms
//       state.forms.forEach(form => {
//         if (form.labels) {
//           form.labels = form.labels.filter(id => id !== action.payload);
//         }
//       });
//     },

//     // Add label to forms
//     bulkAddLabelToForms: (
//       state,
//       action: PayloadAction<{
//         formIds: string[];
//         labelId: string;
//       }>
//     ) => {
//       const { formIds, labelId } = action.payload;

//       formIds.forEach(formId => {
//         const form = state.forms.find(f => f.id === formId);
//         if (form) {
//           if (!form.labels) {
//             form.labels = [labelId];
//           } else if (!form.labels.includes(labelId)) {
//             form.labels.push(labelId);
//           }
//         }
//       });
//     },

//     // Remove label from forms
//     bulkRemoveLabelFromForms: (
//       state,
//       action: PayloadAction<{
//         formIds: string[];
//         labelId: string;
//       }>
//     ) => {
//       const { formIds, labelId } = action.payload;

//       formIds.forEach(formId => {
//         const form = state.forms.find(f => f.id === formId);
//         if (form && form.labels) {
//           form.labels = form.labels.filter(id => id !== labelId);
//         }
//       });
//     },

//     setFilters: (
//       state,
//       action: PayloadAction<Partial<typeof initialState.currentFilters>>
//     ) => {
//       state.currentFilters = { ...state.currentFilters, ...action.payload };
//     },

//     clearError: state => {
//       state.error = null;
//     },
//     clearLabelsError: state => {
//       state.labelsError = null;
//     },

//     toggleFavoriteOptimistic: (state, action: PayloadAction<string>) => {
//       const form = state.forms.find(form => form.id === action.payload);
//       if (form) {
//         form.isFavorite = !form.isFavorite;
//       }
//     },
//   },
//   extraReducers: builder => {
//     builder
//       .addCase(fetchForms.pending, state => {
//         state.isLoading = true;
//         state.error = null;
//       })
//       .addCase(fetchForms.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.forms = action.payload.data;
//         state.pagination = action.payload.pagination;
//       })
//       .addCase(fetchForms.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.error.message || 'Failed to fetch forms';
//       })
//       .addCase(createFormAsync.fulfilled, (state, action) => {
//         state.forms.unshift(action.payload);
//       })
//       .addCase(toggleFormFavorite.fulfilled, (state, action) => {
//         const form = state.forms.find(
//           form => form.id === action.payload.formId
//         );
//         if (form) {
//           form.isFavorite = action.payload.isFavorite;
//         }
//       })
//       .addCase(archiveFormAsync.fulfilled, (state, action) => {
//         const form = state.forms.find(form => form.id === action.payload);
//         if (form) {
//           form.isArchived = true;
//         }
//       })
//       .addCase(trashFormAsync.fulfilled, (state, action) => {
//         const form = state.forms.find(form => form.id === action.payload);
//         if (form) {
//           form.isTrashed = true;
//           form.daysRemaining = 30;
//         }
//       })
//       .addCase(restoreFormAsync.fulfilled, (state, action) => {
//         const form = state.forms.find(form => form.id === action.payload);
//         if (form) {
//           form.isArchived = false;
//           form.isTrashed = false;
//           form.daysRemaining = undefined;
//         }
//       })
//       .addCase(deleteFormAsync.fulfilled, (state, action) => {
//         state.forms = state.forms.filter(form => form.id !== action.payload);
//       })
//       .addCase(bulkTrashFormsAsync.fulfilled, (state, action) => {
//         state.forms = state.forms.map(form =>
//           action.payload.includes(form.id)
//             ? { ...form, isTrashed: true, daysRemaining: 30 }
//             : form
//         );
//       })
//       .addCase(bulkArchiveFormsAsync.fulfilled, (state, action) => {
//         state.forms = state.forms.map(form =>
//           action.payload.includes(form.id)
//             ? { ...form, isArchived: true }
//             : form
//         );
//       })
//       .addCase(bulkAddLabelToFormsAsync.fulfilled, (state, action) => {
//         const { formIds, labelId } = action.payload;
//         state.forms = state.forms.map(form => {
//           if (formIds.includes(form.id)) {
//             const labels = form.labels || [];
//             if (!labels.includes(labelId)) {
//               return { ...form, labels: [...labels, labelId] };
//             }
//           }
//           return form;
//         });
//       })
//       .addCase(bulkRemoveLabelFromFormsAsync.fulfilled, (state, action) => {
//         const { formIds, labelId } = action.payload;
//         state.forms = state.forms.map(form => {
//           if (formIds.includes(form.id) && form.labels) {
//             return {
//               ...form,
//               labels: form.labels.filter(id => id !== labelId),
//             };
//           }
//           return form;
//         });
//       })

//       // Fetch labels
//       .addCase(fetchLabels.pending, state => {
//         state.labelsLoading = true;
//         state.labelsError = null;
//       })
//       .addCase(fetchLabels.fulfilled, (state, action) => {
//         console.log('Redux: fetchLabels.fulfilled', action.payload);
//         state.labelsLoading = false;
//         state.labels = action.payload.data || [];
//         state.labelsError = null;
//       })
//       .addCase(fetchLabels.rejected, (state, action) => {
//         console.log('Redux: fetchLabels.rejected', action.payload);
//         state.labelsLoading = false;
//         state.labelsError =
//           (action.payload as string) || 'Failed to fetch labels';
//       })
//       .addCase(createLabelAsync.pending, () => {
//         console.log('Redux: createLabelAsync.pending');
//         // Don't set loading state for individual operations
//       })

//       // Create label
//       .addCase(createLabelAsync.fulfilled, (state, action) => {
//         console.log('Redux: createLabelAsync.fulfilled', action.payload);
//         state.labels.unshift(action.payload);
//         state.labelsError = null;
//       })
//       .addCase(createLabelAsync.rejected, (state, action) => {
//         console.log('Redux: createLabelAsync.rejected', action.payload);
//         state.labelsError =
//           (action.payload as string) || 'Failed to create label';
//       })

//       // Update label
//       .addCase(updateLabelAsync.fulfilled, (state, action) => {
//         console.log('Redux: updateLabelAsync.fulfilled', action.payload);
//         const index = state.labels.findIndex(
//           label => label.id === action.payload.id
//         );
//         if (index !== -1) {
//           state.labels[index] = action.payload;
//         }
//         state.labelsError = null;
//       })
//       .addCase(updateLabelAsync.rejected, (state, action) => {
//         console.log('Redux: updateLabelAsync.rejected', action.payload);
//         state.labelsError =
//           (action.payload as string) || 'Failed to update label';
//       })

//       // Delete label
//       .addCase(deleteLabelAsync.fulfilled, (state, action) => {
//         console.log('Redux: deleteLabelAsync.fulfilled', action.payload);
//         state.labels = state.labels.filter(
//           label => label.id !== action.payload
//         );
//         // Remove label from all forms
//         state.forms = state.forms.map(form => ({
//           ...form,
//           labels:
//             form.labels?.filter(labelId => labelId !== action.payload) || [],
//         }));
//         state.labelsError = null;
//       })

//       .addCase(deleteLabelAsync.rejected, (state, action) => {
//         console.log('Redux: deleteLabelAsync.rejected', action.payload);
//         state.labelsError =
//           (action.payload as string) || 'Failed to delete label';
//       });
//   },
// });

// // Export actions
// export const {
//   updateForms,
//   updateLabels,
//   toggleFavorite,
//   archiveForm,
//   trashForm,
//   restoreForm,
//   deleteForm,
//   bulkTrashForms,
//   bulkArchiveForms,
//   addLabelToForm,
//   removeLabelFromForm,
//   createForm,
//   createLabel,
//   updateLabel,
//   deleteLabel,
//   bulkAddLabelToForms,
//   bulkRemoveLabelFromForms,
//   setFilters,
//   clearError,
//   toggleFavoriteOptimistic,
//   clearLabelsError,
// } = formsSlice.actions;

// // Export selectors
// export const selectForms = (state: RootState) => state.forms.forms;
// export const selectLabels = (state: RootState) => state.forms.labels;
// export const selectFormById = (id: string) => (state: RootState) =>
//   state.forms.forms.find(form => form.id === id);
// export const selectLabelById = (id: string) => (state: RootState) =>
//   state.forms.labels.find(label => label.id === id);
// export const selectFormsLoading = (state: RootState) => state.forms.isLoading;
// export const selectLabelsLoading = (state: RootState) =>
//   state.forms.labelsLoading;
// export const selectLabelsError = (state: RootState) => state.forms.labelsError;
// export const selectFormsError = (state: RootState) => state.forms.error;
// export const selectFormsPagination = (state: RootState) =>
//   state.forms.pagination;
// export const selectCurrentFilters = (state: RootState) =>
//   state.forms.currentFilters;

// export default formsSlice.reducer;

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { formsService } from '@/services/forms';
import { labelsService } from '@/services/labels';
import type { RootState } from '../../store';

// Define interface for forms
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
  isPublished?: boolean;
  labels: string[];
  daysRemaining?: number;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

// Enhanced cache interfaces
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
  expiry?: number;
}

interface RequestState {
  pending: boolean;
  timestamp: number;
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
  // Enhanced caching system
  cache: {
    forms: Record<string, CacheEntry<{ data: Form[]; pagination: any }>>;
    labels: Record<string, CacheEntry<Label[]>>;
  };
  requestStates: {
    forms: Record<string, RequestState>;
    labels: Record<string, RequestState>;
  };
  lastFetch: {
    forms: Record<string, number>;
    labels: number;
  };
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STALE_TIME = 2 * 60 * 1000; // 2 minutes - show cached data but fetch in background
const DEBOUNCE_TIME = 1000; // 1 second to prevent duplicate requests

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
  cache: {
    forms: {},
    labels: {},
  },
  requestStates: {
    forms: {},
    labels: {},
  },
  lastFetch: {
    forms: {},
    labels: 0,
  },
};

// Helper function to generate cache keys
const getCacheKey = (filters: any): string => {
  const {
    search = '',
    status = 'all',
    labels = [],
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;
  return JSON.stringify({
    search,
    status,
    labels: labels.sort(),
    sortBy,
    sortOrder,
  });
};

// Enhanced async thunks with smart caching
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
      forceRefresh?: boolean;
    } = {},
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const cacheKey = getCacheKey(filters);
      const cached = state.forms.cache.forms[cacheKey];
      const now = Date.now();

      // Check if we have valid cached data and don't need to force refresh
      if (!filters.forceRefresh && cached) {
        const isExpired = now - cached.timestamp > CACHE_DURATION;
        const isStale = now - cached.timestamp > STALE_TIME;

        if (!isExpired) {
          // Return cached data immediately
          console.log('⚡ Using fresh cached forms:', cacheKey);
          return {
            ...cached.data,
            fromCache: true,
            cacheKey,
            isFresh: !isStale,
          };
        } else if (isStale) {
          // Return cached data but mark as stale for background refresh
          console.log('📦 Using stale cached forms:', cacheKey);
          return {
            ...cached.data,
            fromCache: true,
            stale: true,
            cacheKey,
          };
        }
      }

      // Prevent duplicate requests
      const requestState = state.forms.requestStates.forms[cacheKey];
      if (
        requestState?.pending &&
        now - requestState.timestamp < DEBOUNCE_TIME
      ) {
        // If request is already pending and recent, return cached data if available
        if (cached) {
          console.log('⏳ Request pending, using cached forms:', cacheKey);
          return {
            ...cached.data,
            fromCache: true,
            cacheKey,
            duplicate: true,
          };
        }
        throw new Error('Request already in progress');
      }

      console.log('🚀 Fetching forms from API:', { cacheKey, filters });
      const response = await formsService.getForms(filters);

      return {
        data: response.data || [],
        pagination: response.pagination,
        fromCache: false,
        cacheKey,
        timestamp: now,
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch forms:', error);
      return rejectWithValue(error.message || 'Failed to fetch forms');
    }
  }
);

export const fetchLabels = createAsyncThunk(
  'forms/fetchLabels',
  async (searchTerm: string | undefined, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const cacheKey = searchTerm || 'all';
      const cached = state.forms.cache.labels[cacheKey];
      const now = Date.now();

      // Check cache validity
      if (cached && now - cached.timestamp < CACHE_DURATION) {
        console.log('⚡ Using cached labels:', cacheKey);
        return {
          data: cached.data,
          fromCache: true,
          cacheKey,
        };
      }

      // Prevent duplicate requests
      const requestState = state.forms.requestStates.labels[cacheKey];
      if (
        requestState?.pending &&
        now - requestState.timestamp < DEBOUNCE_TIME
      ) {
        if (cached) {
          console.log('⏳ Labels request pending, using cached:', cacheKey);
          return {
            data: cached.data,
            fromCache: true,
            cacheKey,
            duplicate: true,
          };
        }
        throw new Error('Request already in progress');
      }

      console.log('🚀 Fetching labels from API:', cacheKey);
      const response = await labelsService.getLabels(searchTerm);

      return {
        data: response.data || [],
        fromCache: false,
        cacheKey,
        timestamp: now,
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch labels:', error);
      return rejectWithValue(error.message || 'Failed to fetch labels');
    }
  }
);

// Keep all your existing async thunks with cache clearing
export const toggleFormFavorite = createAsyncThunk(
  'forms/toggleFavorite',
  async (formId: string, { dispatch }) => {
    const response = await formsService.toggleFavorite(formId);
    // Clear forms cache after mutation
    dispatch(clearFormsCache());
    return { formId, ...response.data };
  }
);

export const archiveFormAsync = createAsyncThunk(
  'forms/archiveForm',
  async (formId: string, { dispatch }) => {
    await formsService.archiveForm(formId);
    dispatch(clearFormsCache());
    return formId;
  }
);

export const trashFormAsync = createAsyncThunk(
  'forms/trashForm',
  async (formId: string, { dispatch }) => {
    await formsService.trashForm(formId);
    dispatch(clearFormsCache());
    return formId;
  }
);

export const restoreFormAsync = createAsyncThunk(
  'forms/restoreForm',
  async (formId: string, { dispatch }) => {
    await formsService.restoreForm(formId);
    dispatch(clearFormsCache());
    return formId;
  }
);

export const deleteFormAsync = createAsyncThunk(
  'forms/deleteForm',
  async (formId: string, { dispatch }) => {
    await formsService.deleteForm(formId);
    dispatch(clearFormsCache());
    return formId;
  }
);

export const bulkTrashFormsAsync = createAsyncThunk(
  'forms/bulkTrashForms',
  async (formIds: string[], { dispatch }) => {
    await formsService.bulkAction(formIds, 'trash');
    dispatch(clearFormsCache());
    return formIds;
  }
);

export const bulkArchiveFormsAsync = createAsyncThunk(
  'forms/bulkArchiveForms',
  async (formIds: string[], { dispatch }) => {
    await formsService.bulkAction(formIds, 'archive');
    dispatch(clearFormsCache());
    return formIds;
  }
);

export const bulkAddLabelToFormsAsync = createAsyncThunk(
  'forms/bulkAddLabelToForms',
  async (
    { formIds, labelId }: { formIds: string[]; labelId: string },
    { dispatch }
  ) => {
    await formsService.bulkAddLabel(formIds, labelId);
    dispatch(clearFormsCache());
    return { formIds, labelId };
  }
);

export const bulkRemoveLabelFromFormsAsync = createAsyncThunk(
  'forms/bulkRemoveLabelFromForms',
  async (
    { formIds, labelId }: { formIds: string[]; labelId: string },
    { dispatch }
  ) => {
    await formsService.bulkRemoveLabel(formIds, labelId);
    dispatch(clearFormsCache());
    return { formIds, labelId };
  }
);

export const createFormAsync = createAsyncThunk(
  'forms/createForm',
  async (
    data: { name?: string; description?: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await formsService.createForm({
        name: data.name || 'Form',
        description: data.description,
      });
      dispatch(clearFormsCache());
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create form'
      );
    }
  }
);

// Enhanced label async thunks with cache clearing
export const createLabelAsync = createAsyncThunk(
  'forms/createLabel',
  async (
    data: { name: string; color: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      console.log('Redux: Creating label...', data);
      const response = await labelsService.createLabel(data);
      console.log('Redux: Label created successfully:', response);
      dispatch(clearLabelsCache());
      return response.data;
    } catch (error: any) {
      console.error('Redux: Error creating label:', error);
      return rejectWithValue(error.message || 'Failed to create label');
    }
  }
);

export const updateLabelAsync = createAsyncThunk(
  'forms/updateLabel',
  async (
    { id, data }: { id: string; data: { name?: string; color?: string } },
    { rejectWithValue, dispatch }
  ) => {
    try {
      console.log('Redux: Updating label...', id, data);
      const response = await labelsService.updateLabel(id, data);
      console.log('Redux: Label updated successfully:', response);
      dispatch(clearLabelsCache());
      return response.data;
    } catch (error: any) {
      console.error('Redux: Error updating label:', error);
      return rejectWithValue(error.message || 'Failed to update label');
    }
  }
);

export const deleteLabelAsync = createAsyncThunk(
  'forms/deleteLabel',
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      console.log('Redux: Deleting label...', id);
      await labelsService.deleteLabel(id);
      console.log('Redux: Label deleted successfully');
      dispatch(clearLabelsCache());
      dispatch(clearFormsCache()); // Also clear forms cache as they reference labels
      return id;
    } catch (error: any) {
      console.error('Redux: Error deleting label:', error);
      return rejectWithValue(error.message || 'Failed to delete label');
    }
  }
);

// Enhanced slice with caching
export const formsSlice = createSlice({
  name: 'forms',
  initialState,
  reducers: {
    // Cache management actions
    clearFormsCache: (state, action?: PayloadAction<string>) => {
      if (action?.payload) {
        // Clear specific cache entry
        delete state.cache.forms[action.payload];
        delete state.requestStates.forms[action.payload];
        delete state.lastFetch.forms[action.payload];
      } else {
        // Clear all forms cache
        state.cache.forms = {};
        state.requestStates.forms = {};
        state.lastFetch.forms = {};
      }
      console.log('🗑️ Forms cache cleared:', action?.payload || 'all');
    },

    clearLabelsCache: state => {
      state.cache.labels = {};
      state.requestStates.labels = {};
      state.lastFetch.labels = 0;
      console.log('🗑️ Labels cache cleared');
    },

    clearAllCache: state => {
      state.cache = { forms: {}, labels: {} };
      state.requestStates = { forms: {}, labels: {} };
      state.lastFetch = { forms: {}, labels: 0 };
      console.log('🗑️ All cache cleared');
    },

    // Set request pending state
    setRequestPending: (
      state,
      action: PayloadAction<{ type: 'forms' | 'labels'; key: string }>
    ) => {
      const { type, key } = action.payload;
      state.requestStates[type][key] = {
        pending: true,
        timestamp: Date.now(),
      };
    },

    // Clear request pending state
    clearRequestPending: (
      state,
      action: PayloadAction<{ type: 'forms' | 'labels'; key: string }>
    ) => {
      const { type, key } = action.payload;
      if (state.requestStates[type][key]) {
        state.requestStates[type][key].pending = false;
      }
    },

    // Keep all your existing reducers
    updateForms: (state, action: PayloadAction<Form[]>) => {
      state.forms = action.payload;
    },

    updateLabels: (state, action: PayloadAction<Label[]>) => {
      state.labels = action.payload;
    },

    toggleFavorite: (state, action: PayloadAction<string>) => {
      const form = state.forms.find(form => form.id === action.payload);
      if (form) {
        form.isFavorite = !form.isFavorite;
      }
    },

    toggleFavoriteOptimistic: (state, action: PayloadAction<string>) => {
      const form = state.forms.find(form => form.id === action.payload);
      if (form) {
        form.isFavorite = !form.isFavorite;
      }
      // Also update cached data
      Object.values(state.cache.forms).forEach(cache => {
        const cachedForm = cache.data.data.find(f => f.id === action.payload);
        if (cachedForm) {
          cachedForm.isFavorite = !cachedForm.isFavorite;
        }
      });
    },

    // Keep all other existing reducers...
    archiveForm: (state, action: PayloadAction<string>) => {
      const form = state.forms.find(form => form.id === action.payload);
      if (form) {
        form.isArchived = true;
      }
    },

    trashForm: (state, action: PayloadAction<string>) => {
      const form = state.forms.find(form => form.id === action.payload);
      if (form) {
        form.isTrashed = true;
        form.daysRemaining = 30;
      }
    },

    restoreForm: (state, action: PayloadAction<string>) => {
      const form = state.forms.find(form => form.id === action.payload);
      if (form) {
        form.isArchived = false;
        form.isTrashed = false;
        form.daysRemaining = undefined;
      }
    },

    deleteForm: (state, action: PayloadAction<string>) => {
      state.forms = state.forms.filter(form => form.id !== action.payload);
    },

    bulkTrashForms: (state, action: PayloadAction<string[]>) => {
      state.forms = state.forms.map(form =>
        action.payload.includes(form.id)
          ? { ...form, isTrashed: true, daysRemaining: 30 }
          : form
      );
    },

    bulkArchiveForms: (state, action: PayloadAction<string[]>) => {
      state.forms = state.forms.map(form =>
        action.payload.includes(form.id) ? { ...form, isArchived: true } : form
      );
    },

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

    removeLabelFromForm: (
      state,
      action: PayloadAction<{ formId: string; labelId: string }>
    ) => {
      const form = state.forms.find(form => form.id === action.payload.formId);
      if (form && form.labels) {
        form.labels = form.labels.filter(id => id !== action.payload.labelId);
      }
    },

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

    deleteLabel: (state, action: PayloadAction<string>) => {
      state.labels = state.labels.filter(label => label.id !== action.payload);
      state.forms.forEach(form => {
        if (form.labels) {
          form.labels = form.labels.filter(id => id !== action.payload);
        }
      });
    },

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
  },
  extraReducers: builder => {
    builder
      // Enhanced fetchForms with caching
      .addCase(fetchForms.pending, (state, action) => {
        const cacheKey = getCacheKey(action.meta.arg);

        // Only show loading if we don't have cached data
        const cached = state.cache.forms[cacheKey];
        if (!cached) {
          state.isLoading = true;
        }

        state.error = null;

        // Set request pending
        state.requestStates.forms[cacheKey] = {
          pending: true,
          timestamp: Date.now(),
        };
      })
      .addCase(fetchForms.fulfilled, (state, action) => {
        const { data, pagination, fromCache, cacheKey, timestamp, stale } =
          action.payload;

        state.isLoading = false;

        if (!fromCache || stale) {
          // Update main state with fresh data
          state.forms = data;
          state.pagination = pagination;

          // Update cache
          state.cache.forms[cacheKey] = {
            data: { data, pagination },
            timestamp: timestamp || Date.now(),
            key: cacheKey,
          };

          // Update last fetch time
          state.lastFetch.forms[cacheKey] = Date.now();

          console.log('💾 Forms cached:', cacheKey);
        } else {
          // Using cached data
          state.forms = data;
          state.pagination = pagination;
        }

        // Clear request pending
        if (state.requestStates.forms[cacheKey]) {
          state.requestStates.forms[cacheKey].pending = false;
        }
      })
      .addCase(fetchForms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to fetch forms';

        // Clear all pending requests on error
        Object.keys(state.requestStates.forms).forEach(key => {
          state.requestStates.forms[key].pending = false;
        });
      })

      // Enhanced fetchLabels with caching
      .addCase(fetchLabels.pending, (state, action) => {
        const cacheKey = action.meta.arg || 'all';

        // Only show loading if we don't have cached data
        const cached = state.cache.labels[cacheKey];
        if (!cached) {
          state.labelsLoading = true;
        }

        state.labelsError = null;

        // Set request pending
        state.requestStates.labels[cacheKey] = {
          pending: true,
          timestamp: Date.now(),
        };
      })
      .addCase(fetchLabels.fulfilled, (state, action) => {
        const { data, fromCache, cacheKey, timestamp } = action.payload;

        state.labelsLoading = false;

        if (!fromCache) {
          // Update main state and cache with fresh data
          state.labels = data;

          // Update cache
          state.cache.labels[cacheKey] = {
            data,
            timestamp: timestamp || Date.now(),
            key: cacheKey,
          };

          state.lastFetch.labels = Date.now();
          console.log('💾 Labels cached:', cacheKey);
        } else {
          // Using cached data
          state.labels = data;
        }

        state.labelsError = null;

        // Clear request pending
        if (state.requestStates.labels[cacheKey]) {
          state.requestStates.labels[cacheKey].pending = false;
        }
      })
      .addCase(fetchLabels.rejected, (state, action) => {
        state.labelsLoading = false;
        state.labelsError =
          (action.payload as string) || 'Failed to fetch labels';

        // Clear all pending requests on error
        Object.keys(state.requestStates.labels).forEach(key => {
          state.requestStates.labels[key].pending = false;
        });
      })

      // Keep all your existing extra reducers
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

      // Label operations
      .addCase(createLabelAsync.pending, () => {
        console.log('Redux: createLabelAsync.pending');
      })
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
  // New cache management actions
  clearFormsCache,
  clearLabelsCache,
  clearAllCache,
  setRequestPending,
  clearRequestPending,
} = formsSlice.actions;

// Enhanced selectors with better error handling
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

// FIXED: Use consistent selector name
export const selectCurrentFilters = (state: RootState) =>
  state.forms.currentFilters;
export const selectFilters = (state: RootState) => state.forms.currentFilters;

// New cache-aware selectors
export const selectFormsCache = (state: RootState) => state.forms.cache.forms;
export const selectLabelsCache = (state: RootState) => state.forms.cache.labels;
export const selectRequestStates = (state: RootState) =>
  state.forms.requestStates;

// Advanced selectors for filtered data
export const selectFormsByLabel = (labelId: string) => (state: RootState) =>
  state.forms.forms.filter(form => form.labels?.includes(labelId));

export const selectFavoritesForms = (state: RootState) =>
  state.forms.forms.filter(
    form => form.isFavorite && !form.isArchived && !form.isTrashed
  );

export const selectArchivedForms = (state: RootState) =>
  state.forms.forms.filter(form => form.isArchived && !form.isTrashed);

export const selectTrashedForms = (state: RootState) =>
  state.forms.forms.filter(form => form.isTrashed);

export const selectDraftForms = (state: RootState) =>
  state.forms.forms.filter(
    form => !form.isPublished && !form.isArchived && !form.isTrashed
  );

export const selectActiveForms = (state: RootState) =>
  state.forms.forms.filter(form => !form.isArchived && !form.isTrashed);

// Cache status selectors
export const selectCacheStatus = (cacheKey: string) => (state: RootState) => {
  const cached = state.forms.cache.forms[cacheKey];
  if (!cached) return { exists: false, isStale: false, isExpired: true };

  const now = Date.now();
  const isStale = now - cached.timestamp > STALE_TIME;
  const isExpired = now - cached.timestamp > CACHE_DURATION;

  return {
    exists: true,
    isStale,
    isExpired,
    age: now - cached.timestamp,
    data: cached.data,
  };
};

export const selectLabelsCacheStatus =
  (cacheKey: string) => (state: RootState) => {
    const cached = state.forms.cache.labels[cacheKey];
    if (!cached) return { exists: false, isStale: false, isExpired: true };

    const now = Date.now();
    const isStale = now - cached.timestamp > STALE_TIME;
    const isExpired = now - cached.timestamp > CACHE_DURATION;

    return {
      exists: true,
      isStale,
      isExpired,
      age: now - cached.timestamp,
      data: cached.data,
    };
  };

// Request status selectors
export const selectIsRequestPending =
  (type: 'forms' | 'labels', key: string) => (state: RootState) => {
    const requestState = state.forms.requestStates[type][key];
    if (!requestState) return false;

    const now = Date.now();
    const isRecent = now - requestState.timestamp < DEBOUNCE_TIME;

    return requestState.pending && isRecent;
  };

// Performance selector - memoized form counts
export const selectFormCounts = (state: RootState) => {
  const forms = state.forms.forms;

  return {
    total: forms.length,
    active: forms.filter(f => !f.isArchived && !f.isTrashed).length,
    favorites: forms.filter(f => f.isFavorite && !f.isArchived && !f.isTrashed)
      .length,
    drafts: forms.filter(f => !f.isPublished && !f.isArchived && !f.isTrashed)
      .length,
    archived: forms.filter(f => f.isArchived && !f.isTrashed).length,
    trashed: forms.filter(f => f.isTrashed).length,
  };
};

// Export reducer
export default formsSlice.reducer;
