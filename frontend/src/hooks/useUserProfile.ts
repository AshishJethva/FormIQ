// src/hooks/useUserProfile.ts

import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useCallback } from 'react';
import {
  selectUserProfile,
  selectIsLoading,
  selectError,
  fetchUserProfile,
} from '@/redux/slices/userProfile/userProfileSlice';
import type { StoreDispatch } from '@/redux/store';

export const useUserProfile = () => {
  const dispatch = useDispatch<StoreDispatch>();
  const userProfile = useSelector(selectUserProfile);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  // Auto-fetch user profile if not loaded
  useEffect(() => {
    if (!userProfile && !isLoading) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, userProfile, isLoading]);

  // Computed values for easier access with real-time updates
  const canCreateForms = userProfile?.profile.plan.canCreateForms ?? true;
  const formsUsed = userProfile?.profile.plan.formsUsed ?? 0;
  const formsLimit = userProfile?.profile.plan.formsLimit ?? 5;
  const planType = userProfile?.profile.plan.type ?? 'STARTER';
  const remainingForms = formsLimit - formsUsed;

  // Force refresh function for real-time updates
  const forceRefresh = useCallback(async () => {
    await dispatch(fetchUserProfile());
  }, [dispatch]);

  // Helper functions
  const isApproachingLimit = () => remainingForms <= 2 && remainingForms > 0;
  const hasReachedLimit = () => !canCreateForms;
  const isStarterPlan = () => planType === 'STARTER';

  const getPlanBadgeColor = () => {
    switch (planType) {
      case 'STARTER':
        return 'bg-gray-500 text-white';
      case 'BRONZE':
        return 'bg-orange-500 text-white';
      case 'SILVER':
        return 'bg-blue-500 text-white';
      case 'GOLD':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getUsagePercentage = () => (formsUsed / formsLimit) * 100;

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'from-red-500 to-red-400';
    if (percentage >= 70) return 'from-yellow-500 to-yellow-400';
    return 'from-orange-500 to-orange-400';
  };

  // Get real-time status messages
  const getStatusMessage = () => {
    if (!canCreateForms) {
      return {
        type: 'error' as const,
        message: 'Form limit reached',
        description: `You've used all ${formsLimit} forms in your ${planType} plan.`,
      };
    }

    if (remainingForms === 1) {
      return {
        type: 'warning' as const,
        message: 'Last form available',
        description: `This will be your last form in the ${planType} plan.`,
      };
    }

    if (remainingForms <= 2) {
      return {
        type: 'info' as const,
        message: 'Almost at limit',
        description: `Only ${remainingForms} forms left in your ${planType} plan.`,
      };
    }

    return {
      type: 'success' as const,
      message: `${remainingForms} forms remaining`,
      description: `You can create ${remainingForms} more forms.`,
    };
  };

  return {
    userProfile,
    isLoading,
    error,

    // Plan information with real-time updates
    canCreateForms,
    formsUsed,
    formsLimit,
    planType,
    remainingForms,

    // Helper functions
    isApproachingLimit,
    hasReachedLimit,
    isStarterPlan,
    getPlanBadgeColor,
    getUsagePercentage,
    getUsageColor,
    getStatusMessage,

    // Actions
    refetch: () => dispatch(fetchUserProfile()),
    forceRefresh,
  };
};
