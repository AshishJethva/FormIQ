// frontend/src/hooks/useUserProfile.ts

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUserProfile,
  selectUserProfile,
  selectIsLoading,
  selectError,
} from '@/redux/slices/userProfileSlice';
import type { StoreDispatch } from '@/redux/store';

export const useUserProfile = () => {
  const dispatch = useDispatch<StoreDispatch>();
  const userProfile = useSelector(selectUserProfile);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  useEffect(() => {
    if (!userProfile && !isLoading) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, userProfile, isLoading]);

  const refreshProfile = () => {
    dispatch(fetchUserProfile());
  };

  return {
    userProfile,
    isLoading,
    error,
    refreshProfile,
  };
};
