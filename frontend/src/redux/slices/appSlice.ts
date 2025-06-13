'use client';

import type { StoreDispatch } from '@/redux/store';

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  auth: {
    isLoading: false,
  },
};

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
