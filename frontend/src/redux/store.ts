import userReducer from './slices/auth/userSlice';
import appReducer from '@/redux/slices/appSlice';
import formReducer from '@/redux/slices/dashboard/formsSlice';
import formBuilderReducer from './slices/formBuilder/formBuilderSlice';
import aiFormReducer from './slices/ai/aiFormSlice';
import userProfileReducer from './slices/userProfile/userProfileSlice';
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import aiFormUpdateReducer from './slices/formBuilder/aiFormUpdateSlice';
import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

// Configure persistence only for specific slices that need it
const userPersistConfig = {
  key: 'user',
  storage,
  // Only persist essential user data
  whitelist: ['user', 'token', 'isAuthenticated'],
};

const rootReducer = combineReducers({
  forms: formReducer,
  app: appReducer,
  user: persistReducer(userPersistConfig, userReducer),
  formBuilder: formBuilderReducer,
  aiFormUpdate: aiFormUpdateReducer,
  aiForm: aiFormReducer,
  userProfile: userProfileReducer,
});

// Create the store without persisting formBuilder
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
export type AppDispatch = typeof store.dispatch;
export type StoreDispatch = typeof store.dispatch;
