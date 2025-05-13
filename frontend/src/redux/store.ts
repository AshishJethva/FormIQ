import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slice/userSlice';
import appReducer from '@/redux/slice/appSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type StoreDispatch = typeof store.dispatch;
