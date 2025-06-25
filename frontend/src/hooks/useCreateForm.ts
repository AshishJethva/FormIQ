import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { StoreDispatch } from '@/redux/store';
import { createFormAsync } from '@/redux/slices/dashboard/formsSlice';
import {
  selectUserProfile,
  fetchUserProfile,
  incrementFormsUsed,
} from '@/redux/slices/userProfile/userProfileSlice';

interface CreateFormOptions {
  name?: string;
  description?: string;
  redirectTo?: 'build' | 'settings' | 'publish' | null;
  showToast?: boolean;
  onSuccess?: (formId: string) => void;
  onError?: (error: string) => void;
}

export const useCreateForm = () => {
  const dispatch = useDispatch<StoreDispatch>();
  const router = useRouter();
  const userProfile = useSelector(selectUserProfile);

  const [isCreating, setIsCreating] = useState(false);

  const canCreateForms = userProfile?.profile.plan.canCreateForms ?? true;
  const formsUsed = userProfile?.profile.plan.formsUsed ?? 0;
  const formsLimit = userProfile?.profile.plan.formsLimit ?? 5;
  const planType = userProfile?.profile.plan.type ?? 'STARTER';
  const remainingForms = formsLimit - formsUsed;

  const generateUniqueFormName = useCallback(() => {
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `Form - ${timestamp}`;
  }, []);

  const createForm = useCallback(
    async (options: CreateFormOptions = {}) => {
      const {
        name = generateUniqueFormName(),
        description = '',
        redirectTo = 'build',
        showToast = true,
        onSuccess,
        onError,
      } = options;

      // Refresh user profile to get latest data
      await dispatch(fetchUserProfile());

      // Check limits with fresh data
      if (!canCreateForms) {
        const errorMessage = `Form limit reached! You've used ${formsUsed} of ${formsLimit} forms available in your ${planType} plan.`;

        if (showToast) {
          const upgradeAction = {
            label: planType === 'STARTER' ? 'Upgrade Now' : 'Manage Plan',
            onClick: () => router.push('/myaccount/upgrade'),
          };

          toast.error('Form Limit Reached!', {
            description: errorMessage,
            action: upgradeAction,
            duration: 2000,
          });
        }

        onError?.(errorMessage);
        return null;
      }

      setIsCreating(true);

      try {
        // Create the form
        const result = await dispatch(
          createFormAsync({
            name,
            description,
          })
        ).unwrap();

        const formId = result.id;

        if (showToast) {
          toast.success('Form Created Successfully!', {
            description: `"${name}" is ready to go!`,
            duration: 2000,
          });
        }

        // Handle redirection FIRST before state updates
        if (redirectTo) {
          const routes = {
            build: `/build/${formId}`,
            settings: `/build/${formId}/settings`,
            publish: `/build/${formId}/publish`,
          };

          // CRITICAL FIX: Navigate immediately, then update state after navigation starts
          router.push(routes[redirectTo]);

          // Update state AFTER navigation is initiated
          setTimeout(() => {
            dispatch(incrementFormsUsed());
            dispatch(fetchUserProfile());
          }, 100);
        } else {
          // If no redirect, update state immediately
          dispatch(incrementFormsUsed());
          setTimeout(() => {
            dispatch(fetchUserProfile());
          }, 500);
        }

        onSuccess?.(formId);
        return { id: formId, ...result };
      } catch (error: any) {
        const errorMessage = error.includes?.('Form limit reached')
          ? error
          : error.message || 'Failed to create form';

        if (showToast) {
          if (error.includes?.('Form limit reached')) {
            toast.error('Cannot Create Form!', {
              description: errorMessage,
              action: {
                label: 'Upgrade Plan',
                onClick: () => router.push('/myaccount/upgrade'),
              },
              duration: 2000,
            });
          } else {
            toast.error('Failed to Create Form', {
              description: errorMessage,
              duration: 2000,
            });
          }
        }

        onError?.(errorMessage);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [
      dispatch,
      router,
      canCreateForms,
      formsUsed,
      formsLimit,
      planType,
      remainingForms,
      generateUniqueFormName,
    ]
  );

  const checkCanCreate = useCallback(async () => {
    await dispatch(fetchUserProfile());
    return canCreateForms;
  }, [dispatch, canCreateForms]);

  return {
    createForm,
    checkCanCreate,
    isCreating,
    canCreateForms,
    formsUsed,
    formsLimit,
    planType,
    remainingForms,
    isApproachingLimit: remainingForms <= 2 && remainingForms > 0,
    isLastForm: remainingForms === 1,
  };
};
