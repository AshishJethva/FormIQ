// import userReducer from './slices/auth/userSlice';
// import appReducer from '@/redux/slices/appSlice';
// import formReducer from '@/redux/slices/dashboard/formsSlice';
// import formBuilderReducer from './slices/formBuilderSlice';
// import { configureStore } from '@reduxjs/toolkit';
// import { persistStore, persistReducer } from 'redux-persist';
// import storage from 'redux-persist/lib/storage';
// import { combineReducers } from 'redux';
// import {
//   FLUSH,
//   REHYDRATE,
//   PAUSE,
//   PERSIST,
//   PURGE,
//   REGISTER,
// } from 'redux-persist';

// // Combine reducers without individual persistence
// const rootReducer = combineReducers({
//   forms: formReducer,
//   app: appReducer,
//   user: userReducer,
//   formBuilder: formBuilderReducer,
// });

// // Configure persistence for the entire store
// const persistConfig = {
//   key: 'root',
//   storage,
//   whitelist: ['forms', 'user', 'formBuilder'], // List reducers to persist (exclude 'app' if not needed)
// };

// // Create a persisted reducer for the entire store
// const persistedReducer = persistReducer(persistConfig, rootReducer);

// // Create the store
// export const store = configureStore({
//   reducer: persistedReducer,
//   middleware: getDefaultMiddleware =>
//     getDefaultMiddleware({
//       serializableCheck: {
//         ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
//       },
//     }),
// });

// export const persistor = persistStore(store);
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
// export type StoreDispatch = typeof store.dispatch;

// src/redux/store.ts - Fixed Configuration
import userReducer from './slices/auth/userSlice';
import appReducer from '@/redux/slices/appSlice';
import formReducer from '@/redux/slices/dashboard/formsSlice';
import formBuilderReducer from './slices/formBuilderSlice';
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

// Configure persistence only for specific slices that need it
const userPersistConfig = {
  key: 'user',
  storage,
  // Only persist essential user data
  whitelist: ['user', 'token', 'isAuthenticated'],
};

const formsPersistConfig = {
  key: 'forms',
  storage,
  // Only persist forms list data, not individual form details
  whitelist: ['forms', 'labels', 'filters'],
};

// DO NOT persist formBuilder - let it load fresh from backend
// This prevents conflicts between localStorage and backend data
const rootReducer = combineReducers({
  forms: persistReducer(formsPersistConfig, formReducer),
  app: appReducer, // Don't persist app state
  user: persistReducer(userPersistConfig, userReducer),
  formBuilder: formBuilderReducer, // Don't persist form builder state
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
