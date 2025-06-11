'use client';

import type { StoreDispatch } from '@/redux/store';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { WebSocketService } from '@/services/webSocket';

const initialState = {
  auth: {
    isLoading: false,
  },
};

export const connectWebSocket = createAsyncThunk(
  'notifications/connect',
  async (
    { token, url }: { token: string; url: string },
    { rejectWithValue }
  ) => {
    try {
      const wsService = WebSocketService.getInstance();

      await wsService.connect(token, url);

      return true;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to connect'
      );
    }
  }
);

export const disconnectWebSocket = createAsyncThunk(
  'notifications/disconnect',
  async (_, { rejectWithValue }) => {
    try {
      const wsService = WebSocketService.getInstance();

      wsService.disconnect();

      return true;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to disconnect'
      );
    }
  }
);

const appSlice = createSlice({
  name: 'app',
  initialState: initialState,
  reducers: {
    toggleAuthLoading: (state, action) => {
      state.auth.isLoading = action.payload;
    },
  },
});

export const { toggleAuthLoading } = appSlice.actions;

const setAuthLoading = (isLoading: boolean) => (dispatch: StoreDispatch) => {
  dispatch(toggleAuthLoading(isLoading));
};

export { setAuthLoading };
export default appSlice.reducer;
