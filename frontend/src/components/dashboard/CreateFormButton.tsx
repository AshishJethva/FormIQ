// frontend/src/components/dashboard/CreateFormButton.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Plus } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { createFormAsync } from '@/redux/slices/dashboard/formsSlice';
import { incrementFormsUsed } from '@/redux/slices/userProfile/userProfileSlice';
import { toast } from 'sonner';
import type { StoreDispatch } from '@/redux/store';

interface CreateFormButtonProps {
  className?: string;
}

const CreateFormButton: React.FC<CreateFormButtonProps> = ({
  className = '',
}) => {
  const router = useRouter();
  const dispatch = useDispatch<StoreDispatch>();
  const { userProfile, isLoading } = useUserProfile();

  const handleCreateForm = async () => {
    try {
      // Check if user can create more forms
      if (!userProfile?.profile.plan.canCreateForms) {
        toast.error(
          `Form limit reached! You can create up to ${userProfile?.profile.plan.formsLimit} forms with your ${userProfile?.profile.plan.type} plan.`,
          {
            action: {
              label: 'Upgrade',
              onClick: () => router.push('/myaccount/upgrade'),
            },
            duration: 2000,
          }
        );
        return;
      }

      // Create the form
      const result = await dispatch(
        createFormAsync({
          name: 'Untitled Form',
          description: '',
        })
      ).unwrap();

      dispatch(incrementFormsUsed());

      // Navigate to form builder
      router.push(`/dashboard/forms/${result.id}/build`);

      toast.success('Form created successfully!');
    } catch (error: any) {
      console.error('Failed to create form:', error);

      if (error.includes('Form limit reached')) {
        toast.error(error, {
          action: {
            label: 'Upgrade Plan',
            onClick: () => router.push('/myaccount/upgrade'),
          },
          duration: 2000,
        });
      } else {
        toast.error('Failed to create form. Please try again.');
      }
    }
  };

  const canCreateForms = userProfile?.profile.plan.canCreateForms ?? true;
  const formsUsed = userProfile?.profile.plan.formsUsed ?? 0;
  const formsLimit = userProfile?.profile.plan.formsLimit ?? 5;

  return (
    <button
      onClick={handleCreateForm}
      disabled={isLoading || !canCreateForms}
      className={`
        flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
        text-white rounded-lg transition-colors font-medium
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={
        !canCreateForms
          ? `Form limit reached (${formsUsed}/${formsLimit}). Upgrade to create more forms.`
          : 'Create a new form'
      }
    >
      <Plus className='h-4 w-4' />
      {isLoading ? 'Creating...' : 'Create Form'}
      {!canCreateForms && (
        <span className='text-xs bg-red-500 px-2 py-1 rounded'>
          Limit Reached
        </span>
      )}
    </button>
  );
};

export default CreateFormButton;
