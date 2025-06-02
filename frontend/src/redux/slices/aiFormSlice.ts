// Frontend: src/redux/slices/aiFormSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { apiConfig } from '@/config/api';

interface AIFormState {
  isGenerating: boolean;
  error: string | null;
  lastGeneratedFormId: string | null;
}

const initialState: AIFormState = {
  isGenerating: false,
  error: null,
  lastGeneratedFormId: null,
};

// Async thunk to generate form using AI
export const generateFormWithAI = createAsyncThunk(
  'aiForm/generateForm',
  async (prompt: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🤖 Generating form with AI prompt:', prompt);

      const response = await axios.post(
        `${apiConfig.url}/ai/generate-form`,
        { prompt },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ AI form generation successful:', response.data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Failed to generate form'
      );
    }
  }
);

const aiFormSlice = createSlice({
  name: 'aiForm',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    clearLastGeneratedFormId: state => {
      state.lastGeneratedFormId = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(generateFormWithAI.pending, state => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateFormWithAI.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.error = null;
        state.lastGeneratedFormId = action.payload.id;
      })
      .addCase(generateFormWithAI.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearLastGeneratedFormId } = aiFormSlice.actions;
export default aiFormSlice.reducer;
