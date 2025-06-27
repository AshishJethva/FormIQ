// src/redux/slices/formBuilder/aiFormUpdateSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { apiConfig } from '@/config/api';
import AIFormHistoryService from '@/services/aiFormHistoryService';
import { Form } from '@/types/form';

interface AIFormUpdateState {
  isUpdating: boolean;
  error: string | null;
  lastUpdateSummary: string | null;
  updateHistory: Array<{
    id: string;
    prompt: string;
    summary: string;
    timestamp: string;
  }>;
  isLoadingHistory: boolean;
}

const initialState: AIFormUpdateState = {
  isUpdating: false,
  error: null,
  lastUpdateSummary: null,
  updateHistory: [],
  isLoadingHistory: false,
};

// Async thunk to update form using AI
export const updateFormWithAI = createAsyncThunk(
  'aiFormUpdate/updateForm',
  async (
    {
      formId,
      updatePrompt,
      currentForm,
    }: {
      formId: string;
      updatePrompt: string;
      currentForm: Form;
    },
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Validate input parameters
      if (!formId || !updatePrompt || !currentForm) {
        throw new Error(
          'Form ID, update prompt, and current form data are required'
        );
      }

      if (typeof updatePrompt !== 'string' || updatePrompt.trim().length < 3) {
        throw new Error('Update prompt must be at least 3 characters long');
      }

      // Validate currentForm structure
      if (!currentForm.pages || !Array.isArray(currentForm.pages)) {
        throw new Error('Current form must have valid pages array');
      }

      console.log('🔄 Making API request to update form:', {
        endpoint: `${apiConfig.url}/ai/update-form`,
        formId,
        promptLength: updatePrompt.length,
        formTitle: currentForm.title,
        pagesCount: currentForm.pages.length,
      });

      const response = await axios.post(
        `${apiConfig.url}/ai/update-form`,
        {
          formId,
          updatePrompt: updatePrompt.trim(),
          currentForm,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (!response.data) {
        throw new Error('No response data received from server');
      }

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update form');
      }

      console.log('✅ API response received:', {
        success: response.data.success,
        hasData: !!response.data.data,
        hasSummary: !!response.data.data?.updateSummary,
      });

      return response.data.data;
    } catch (error: any) {
      console.error('❌ updateFormWithAI error:', error);

      let errorMessage = 'Failed to update form';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk to undo last AI update
export const undoAIUpdate = createAsyncThunk(
  'aiFormUpdate/undo',
  async (
    { formId, targetIndex }: { formId: string; targetIndex?: number },
    { rejectWithValue, dispatch }
  ) => {
    try {
      console.log('🔄 Starting undo operation:', { formId, targetIndex });

      const undoResult = await AIFormHistoryService.undo(formId, targetIndex);

      if (!undoResult.success) {
        throw new Error(undoResult.error || 'Failed to undo changes');
      }

      console.log('✅ Undo completed successfully');

      // Update undo/redo state
      dispatch(updateHistoryState(formId));

      return {
        formData: undoResult.data!.formData,
        undoDetails: undoResult.data!.undoDetails,
      };
    } catch (error: any) {
      console.error('❌ Undo failed:', error);
      return rejectWithValue(error.message || 'Failed to undo changes');
    }
  }
);

// Async thunk to redo last undone update
export const redoAIUpdate = createAsyncThunk(
  'aiFormUpdate/redo',
  async (
    { formId, targetIndex }: { formId: string; targetIndex?: number },
    { rejectWithValue, dispatch }
  ) => {
    try {
      console.log('🔄 Starting redo operation:', { formId, targetIndex });

      const redoResult = await AIFormHistoryService.redo(formId, targetIndex);

      if (!redoResult.success) {
        throw new Error(redoResult.error || 'Failed to redo changes');
      }

      console.log('✅ Redo completed successfully');

      // Update undo/redo state
      dispatch(updateHistoryState(formId));

      return {
        formData: redoResult.data!.formData,
        redoDetails: redoResult.data!.redoDetails,
      };
    } catch (error: any) {
      console.error('❌ Redo failed:', error);
      return rejectWithValue(error.message || 'Failed to redo changes');
    }
  }
);

// Async thunk to restore to specific snapshot
export const restoreToSnapshot = createAsyncThunk(
  'aiFormUpdate/restore',
  async (
    { formId, snapshotId }: { formId: string; snapshotId: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      console.log('🔄 Starting restore operation:', { formId, snapshotId });

      const restoreResult = await AIFormHistoryService.restoreToSnapshot(
        formId,
        snapshotId
      );

      if (!restoreResult.success) {
        throw new Error(restoreResult.error || 'Failed to restore snapshot');
      }

      console.log('✅ Restore completed successfully');

      // Update undo/redo state
      dispatch(updateHistoryState(formId));

      return {
        formData: restoreResult.data!.formData,
        restoredSnapshot: restoreResult.data!.restoredSnapshot,
      };
    } catch (error: any) {
      console.error('❌ Restore failed:', error);
      return rejectWithValue(error.message || 'Failed to restore snapshot');
    }
  }
);

// Async thunk to load form history
export const loadFormHistory = createAsyncThunk(
  'aiFormUpdate/loadHistory',
  async (
    { formId, limit }: { formId: string; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const historyResult = await AIFormHistoryService.getFormHistory(
        formId,
        limit
      );

      if (!historyResult.success) {
        throw new Error(historyResult.error || 'Failed to load history');
      }

      return historyResult.data!;
    } catch (error: any) {
      console.error('❌ Load history failed:', error);
      return rejectWithValue(error.message || 'Failed to load history');
    }
  }
);

// Async thunk to validate update prompt
export const validateUpdatePrompt = createAsyncThunk(
  'aiFormUpdate/validatePrompt',
  async (prompt: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(
        `${apiConfig.url}/ai/validate-update-prompt`,
        { prompt },
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
          'Failed to validate prompt'
      );
    }
  }
);

const aiFormUpdateSlice = createSlice({
  name: 'aiFormUpdate',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    clearUpdateSummary: state => {
      state.lastUpdateSummary = null;
    },
    addToUpdateHistory: (
      state,
      action: PayloadAction<{
        prompt: string;
        summary: string;
      }>
    ) => {
      const newEntry = {
        id: Date.now().toString(),
        prompt: action.payload.prompt,
        summary: action.payload.summary,
        timestamp: new Date().toISOString(),
      };

      state.updateHistory.unshift(newEntry);

      // Keep only last 10 updates
      if (state.updateHistory.length > 10) {
        state.updateHistory = state.updateHistory.slice(0, 10);
      }
    },
    clearUpdateHistory: state => {
      state.updateHistory = [];
    },
    setUpdateHistory: (state, action: PayloadAction<any[]>) => {
      state.updateHistory = action.payload;
    },
    setHistoryStats: (
      state,
      action: PayloadAction<{
        totalSnapshots: number;
        currentIndex: number;
        canUndo: boolean;
        canRedo: boolean;
      }>
    ) => {
      state.totalSnapshots = action.payload.totalSnapshots;
      state.currentHistoryIndex = action.payload.currentIndex;
      state.canUndo = action.payload.canUndo;
      state.canRedo = action.payload.canRedo;
    },
    initializeHistory: state => {
      // Initialize with default stats, real stats will be loaded async
      state.totalSnapshots = 1;
      state.currentHistoryIndex = 0;
      state.canUndo = false;
      state.canRedo = false;
    },
    clearFormHistory: state => {
      // Reset history state when clearing
      state.canUndo = false;
      state.canRedo = false;
      state.currentHistoryIndex = 0;
      state.totalSnapshots = 0;
      state.updateHistory = [];
    },
  },
  extraReducers: builder => {
    builder
      // Update form cases
      .addCase(updateFormWithAI.pending, state => {
        console.log('🔄 Update form pending...');
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateFormWithAI.fulfilled, (state, action) => {
        console.log('✅ Update form fulfilled:', action.payload);
        state.isUpdating = false;
        state.error = null;
        state.lastUpdateSummary = action.payload.updateSummary;

        // Add to history if we have the prompt
        if (action.meta.arg.updatePrompt && action.payload.updateSummary) {
          const newEntry = {
            id: Date.now().toString(),
            prompt: action.meta.arg.updatePrompt,
            summary: action.payload.updateSummary,
            timestamp: new Date().toISOString(),
          };

          state.updateHistory.unshift(newEntry);

          // Keep only last 10 updates
          if (state.updateHistory.length > 10) {
            state.updateHistory = state.updateHistory.slice(0, 10);
          }
        }
      })
      .addCase(updateFormWithAI.rejected, (state, action) => {
        console.error('❌ Update form rejected:', action.payload);
        state.isUpdating = false;
        state.error = action.payload as string;
      })

      // Undo cases
      .addCase(undoAIUpdate.pending, state => {
        state.isUndoing = true;
        state.error = null;
      })
      .addCase(undoAIUpdate.fulfilled, state => {
        state.isUndoing = false;
        state.error = null;
        state.lastUpdateSummary = 'Changes undone successfully';
      })
      .addCase(undoAIUpdate.rejected, (state, action) => {
        state.isUndoing = false;
        state.error = action.payload as string;
      })

      // Redo cases
      .addCase(redoAIUpdate.pending, state => {
        state.isRedoing = true;
        state.error = null;
      })
      .addCase(redoAIUpdate.fulfilled, state => {
        state.isRedoing = false;
        state.error = null;
        state.lastUpdateSummary = 'Changes redone successfully';
      })
      .addCase(redoAIUpdate.rejected, (state, action) => {
        state.isRedoing = false;
        state.error = action.payload as string;
      })

      // Restore cases
      .addCase(restoreToSnapshot.pending, state => {
        state.isUndoing = true; // Use undo loading state for restore
        state.error = null;
      })
      .addCase(restoreToSnapshot.fulfilled, state => {
        state.isUndoing = false;
        state.error = null;
        state.lastUpdateSummary = 'Restored to snapshot successfully';
      })
      .addCase(restoreToSnapshot.rejected, (state, action) => {
        state.isUndoing = false;
        state.error = action.payload as string;
      })

      // Load history cases
      .addCase(loadFormHistory.pending, state => {
        state.isLoadingHistory = true;
        state.error = null;
      })
      .addCase(loadFormHistory.fulfilled, (state, action) => {
        state.isLoadingHistory = false;
        state.error = null;

        // Update history stats
        const stats = action.payload.stats;
        state.totalSnapshots = stats.totalSnapshots;
        state.currentHistoryIndex = stats.currentIndex;
        state.canUndo = stats.canUndo;
        state.canRedo = stats.canRedo;

        // Update local history list
        const recentSnapshots = action.payload.snapshots
          .slice(0, 10)
          .map((snapshot: any) => ({
            id: snapshot.id,
            prompt: snapshot.updatePrompt || '',
            summary: snapshot.updateSummary || 'Form updated',
            timestamp: snapshot.timestamp,
          }));

        state.updateHistory = recentSnapshots;
      })
      .addCase(loadFormHistory.rejected, (state, action) => {
        state.isLoadingHistory = false;
        state.error = action.payload as string;
      })

      // Validate prompt cases
      .addCase(validateUpdatePrompt.pending, state => {
        state.error = null;
      })
      .addCase(validateUpdatePrompt.fulfilled, state => {
        state.error = null;
      })
      .addCase(validateUpdatePrompt.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// Async thunk to update history state (loads stats from API)
export const updateHistoryState = createAsyncThunk(
  'aiFormUpdate/updateHistoryState',
  async (formId: string, { dispatch }) => {
    try {
      const statsResult = await AIFormHistoryService.getHistoryStats(formId);

      if (statsResult.success && statsResult.data) {
        dispatch(
          setHistoryStats({
            totalSnapshots: statsResult.data.totalSnapshots,
            currentIndex: statsResult.data.currentIndex,
            canUndo: statsResult.data.canUndo,
            canRedo: statsResult.data.canRedo,
          })
        );
      }
    } catch (error) {
      console.warn('Failed to update history state:', error);
    }
  }
);

export const {
  clearError,
  clearUpdateSummary,
  addToUpdateHistory,
  setUpdateHistory,
  clearUpdateHistory,
  setHistoryStats,
  initializeHistory,
  clearFormHistory,
} = aiFormUpdateSlice.actions;

export default aiFormUpdateSlice.reducer;
