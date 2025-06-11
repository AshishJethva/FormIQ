// src/redux/slices/userProfile/userProfileSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import userProfileService, {
  UserProfile,
  UserSettings,
  ActivityLog,
  ActivityFilters,
} from '@/services/userProfile';
import type { RootState } from '../../store';

interface UserProfileState {
  profile: UserProfile | null;
  settings: UserSettings | null;
  activityLogs: ActivityLog[];
  isLoading: boolean;
  isSettingsLoading: boolean;
  isActivityLoading: boolean;
  error: string | null;
  settingsError: string | null;
  activityError: string | null;
  activityPagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  } | null;
}

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'userProfile/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const profile = await userProfileService.getUserProfile();
      return profile;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateBasicInfo = createAsyncThunk(
  'userProfile/updateBasicInfo',
  async (data: { name?: string; email?: string }, { rejectWithValue }) => {
    try {
      const updatedUser = await userProfileService.updateBasicInfo(data);
      return updatedUser;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProfileDetails = createAsyncThunk(
  'userProfile/updateProfileDetails',
  async (
    data: { username?: string; phoneNumber?: string; website?: string },
    { rejectWithValue }
  ) => {
    try {
      const updatedProfile = await userProfileService.updateProfileDetails(
        data
      );
      return updatedProfile;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  'userProfile/uploadAvatar',
  async (file: File, { rejectWithValue }) => {
    try {
      const result = await userProfileService.uploadAvatar(file);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteAvatar = createAsyncThunk(
  'userProfile/deleteAvatar',
  async (_, { rejectWithValue }) => {
    try {
      const result = await userProfileService.deleteAvatar();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserSettings = createAsyncThunk(
  'userProfile/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const settings = await userProfileService.getUserSettings();
      return settings;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserSettings = createAsyncThunk(
  'userProfile/updateSettings',
  async (settings: Partial<UserSettings>, { rejectWithValue }) => {
    try {
      const updatedSettings = await userProfileService.updateSettings(settings);
      return updatedSettings;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchActivityLogs = createAsyncThunk(
  'userProfile/fetchActivityLogs',
  async (filters: ActivityFilters, { rejectWithValue }) => {
    try {
      const response = await userProfileService.getActivityLogs(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const requestPasswordReset = createAsyncThunk(
  'userProfile/requestPasswordReset',
  async (email: string, { rejectWithValue }) => {
    try {
      const result = await userProfileService.requestPasswordReset(email);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState: UserProfileState = {
  profile: null,
  settings: null,
  activityLogs: [],
  isLoading: false,
  isSettingsLoading: false,
  isActivityLoading: false,
  error: null,
  settingsError: null,
  activityError: null,
  activityPagination: null,
};

const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    clearSettingsError: state => {
      state.settingsError = null;
    },
    clearActivityError: state => {
      state.activityError = null;
    },
    updateFormsUsed: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.profile.plan.formsUsed = action.payload;
        state.profile.profile.plan.canCreateForms =
          action.payload < state.profile.profile.plan.formsLimit;
        state.profile.profile.plan.remainingForms = Math.max(
          0,
          state.profile.profile.plan.formsLimit - action.payload
        );
      }
    },
    incrementFormsUsed: state => {
      if (state.profile && state.profile.profile.plan.canCreateForms) {
        state.profile.profile.plan.formsUsed += 1;
        state.profile.profile.plan.canCreateForms =
          state.profile.profile.plan.formsUsed <
          state.profile.profile.plan.formsLimit;
        state.profile.profile.plan.remainingForms = Math.max(
          0,
          state.profile.profile.plan.formsLimit -
            state.profile.profile.plan.formsUsed
        );
      }
    },
    decrementFormsUsed: state => {
      if (state.profile && state.profile.profile.plan.formsUsed > 0) {
        state.profile.profile.plan.formsUsed -= 1;
        state.profile.profile.plan.canCreateForms =
          state.profile.profile.plan.formsUsed <
          state.profile.profile.plan.formsLimit;
        state.profile.profile.plan.remainingForms = Math.max(
          0,
          state.profile.profile.plan.formsLimit -
            state.profile.profile.plan.formsUsed
        );
      }
    },
  },
  extraReducers: builder => {
    builder
      // Fetch user profile
      .addCase(fetchUserProfile.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.settings = action.payload.settings;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Delete avatar
      .addCase(deleteAvatar.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAvatar.fulfilled, state => {
        state.isLoading = false;
        if (state.profile) {
          state.profile.profile.avatar = undefined;
        }
      })
      .addCase(deleteAvatar.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update basic info
      .addCase(updateBasicInfo.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBasicInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.profile) {
          state.profile.user = { ...state.profile.user, ...action.payload };
        }
      })
      .addCase(updateBasicInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update profile details
      .addCase(updateProfileDetails.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfileDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.profile) {
          state.profile.profile = {
            ...state.profile.profile,
            ...action.payload,
          };
        }
      })
      .addCase(updateProfileDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Upload avatar
      .addCase(uploadAvatar.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.profile) {
          state.profile.profile.avatar = action.payload.avatar;
        }
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch settings
      .addCase(fetchUserSettings.pending, state => {
        state.isSettingsLoading = true;
        state.settingsError = null;
      })
      .addCase(fetchUserSettings.fulfilled, (state, action) => {
        state.isSettingsLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchUserSettings.rejected, (state, action) => {
        state.isSettingsLoading = false;
        state.settingsError = action.payload as string;
      })

      // Update settings
      .addCase(updateUserSettings.pending, state => {
        state.isSettingsLoading = true;
        state.settingsError = null;
      })
      .addCase(updateUserSettings.fulfilled, (state, action) => {
        state.isSettingsLoading = false;
        state.settings = action.payload;
      })
      .addCase(updateUserSettings.rejected, (state, action) => {
        state.isSettingsLoading = false;
        state.settingsError = action.payload as string;
      })

      // Fetch activity logs
      .addCase(fetchActivityLogs.pending, state => {
        state.isActivityLoading = true;
        state.activityError = null;
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.isActivityLoading = false;
        state.activityLogs = action.payload.data;
        state.activityPagination = action.payload.pagination;
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.isActivityLoading = false;
        state.activityError = action.payload as string;
      })

      // Password reset request
      .addCase(requestPasswordReset.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, state => {
        state.isLoading = false;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearSettingsError,
  clearActivityError,
  updateFormsUsed,
  incrementFormsUsed,
  decrementFormsUsed,
} = userProfileSlice.actions;

// Selectors
export const selectUserProfile = (state: RootState) =>
  state.userProfile.profile;
export const selectUserSettings = (state: RootState) =>
  state.userProfile.settings;
export const selectActivityLogs = (state: RootState) =>
  state.userProfile.activityLogs;
export const selectActivityPagination = (state: RootState) =>
  state.userProfile.activityPagination;
export const selectIsLoading = (state: RootState) =>
  state.userProfile.isLoading;
export const selectIsSettingsLoading = (state: RootState) =>
  state.userProfile.isSettingsLoading;
export const selectIsActivityLoading = (state: RootState) =>
  state.userProfile.isActivityLoading;
export const selectError = (state: RootState) => state.userProfile.error;
export const selectSettingsError = (state: RootState) =>
  state.userProfile.settingsError;
export const selectActivityError = (state: RootState) =>
  state.userProfile.activityError;

export default userProfileSlice.reducer;
