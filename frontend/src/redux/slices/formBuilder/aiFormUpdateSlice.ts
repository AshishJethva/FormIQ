// src/redux/slices/formBuilder/aiFormUpdateSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { apiConfig } from '@/config/api';
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
}

const initialState: AIFormUpdateState = {
  isUpdating: false,
  error: null,
  lastUpdateSummary: null,
  updateHistory: [],
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

export const {
  clearError,
  clearUpdateSummary,
  addToUpdateHistory,
  setUpdateHistory,
  clearUpdateHistory,
} = aiFormUpdateSlice.actions;

export default aiFormUpdateSlice.reducer;
