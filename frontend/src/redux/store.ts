import userReducer from './features/userSlice';
import appReducer from '@/redux/features/appSlice';
import formReducer from '@/redux/features/formsSlice';
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

// Configure persistence for each reducer
const formsPersistConfig = {
  key: 'forms',
  storage,
  whitelist: ['forms', 'labels'], // Only persist forms and labels
};

const userPersistConfig = {
  key: 'user',
  storage,
  whitelist: ['token', 'user'], // Persist both token and user data
};

// Combine reducers
const rootReducer = combineReducers({
  forms: persistReducer(formsPersistConfig, formReducer),
  app: appReducer,
  user: persistReducer(userPersistConfig, userReducer),
});

// Create the store
export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type StoreDispatch = typeof store.dispatch;
