'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Plus, Sparkles, Zap, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateForm = async () => {
    try {
      setIsCreating(true);

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
    } finally {
      setIsCreating(false);
    }
  };

  const canCreateForms = userProfile?.profile.plan.canCreateForms ?? true;
  const formsUsed = userProfile?.profile.plan.formsUsed ?? 0;
  const formsLimit = userProfile?.profile.plan.formsLimit ?? 5;
  const isDisabled = isLoading || !canCreateForms || isCreating;

  // Calculate progress for visual feedback
  const progressPercentage =
    formsLimit > 0 ? (formsUsed / formsLimit) * 100 : 0;

  return (
    <div className='relative'>
      <motion.button
        onClick={handleCreateForm}
        disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        className={`
          group relative overflow-hidden
          flex items-center justify-center gap-2 sm:gap-3
          w-full sm:w-auto
          px-4 sm:px-6 py-3 sm:py-3.5
          bg-gradient-to-r from-blue-600 via-blue-600 to-purple-600
          hover:from-blue-700 hover:via-blue-700 hover:to-purple-700
          text-white rounded-xl sm:rounded-2xl
          font-semibold text-sm sm:text-base
          shadow-lg shadow-blue-500/25
          transition-all duration-300 ease-out
          disabled:opacity-60 disabled:cursor-not-allowed
          disabled:hover:scale-100
          border border-blue-500/20
          ${
            !canCreateForms
              ? 'from-red-500 via-red-500 to-red-600 hover:from-red-600 hover:via-red-600 hover:to-red-700 shadow-red-500/25'
              : ''
          }
          ${className}
        `}
        title={
          !canCreateForms
            ? `Form limit reached (${formsUsed}/${formsLimit}). Upgrade to create more forms.`
            : 'Create a new form'
        }
      >
        {/* Animated background gradient */}
        <motion.div
          className='absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0'
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'linear',
          }}
        />

        {/* Main content */}
        <div className='relative z-10 flex items-center gap-2 sm:gap-3'>
          <AnimatePresence mode='wait'>
            {isCreating ? (
              <motion.div
                key='loading'
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className='flex items-center gap-2'
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className='w-4 h-4 sm:w-5 sm:h-5' />
                </motion.div>
                <span className='hidden sm:inline'>Creating...</span>
                <span className='sm:hidden'>Creating...</span>
              </motion.div>
            ) : (
              <motion.div
                key='default'
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className='flex items-center gap-2 sm:gap-3'
              >
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Plus className='w-4 h-4 sm:w-5 sm:h-5' />
                </motion.div>
                <span className='whitespace-nowrap'>
                  <span className='hidden sm:inline'>Create Form</span>
                  <span className='sm:hidden'>Create</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Limit reached indicator */}
          <AnimatePresence>
            {!canCreateForms && (
              <motion.div
                initial={{ opacity: 0, scale: 0, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0, x: 10 }}
                className='flex items-center gap-1 bg-red-400/20 backdrop-blur-sm px-2 py-1 rounded-full border border-red-300/30'
              >
                <Crown className='w-3 h-3' />
                <span className='text-xs font-medium hidden sm:inline'>
                  Limit Reached
                </span>
                <span className='text-xs font-medium sm:hidden'>Max</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isDisabled && (
          <motion.div
            className='absolute inset-0 rounded-xl sm:rounded-2xl bg-white/5'
            animate={{
              opacity: [0, 0.1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.button>

      <AnimatePresence>
        {canCreateForms && formsLimit > 0 && formsUsed > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className='absolute -bottom-8 left-0 right-0 sm:left-auto sm:right-0 sm:w-48'
          >
            <div className='bg-white/10 backdrop-blur-sm rounded-full p-1'>
              <div className='flex items-center justify-between text-xs text-gray-600 mb-1 px-2'>
                <span>Forms Used</span>
                <span className='font-medium'>
                  {formsUsed}/{formsLimit}
                </span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-1.5 overflow-hidden'>
                <motion.div
                  className='h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full'
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile-specific upgrade prompt */}
      <AnimatePresence>
        {!canCreateForms && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className='absolute -bottom-12 sm:-bottom-10 left-0 right-0 sm:left-auto sm:right-0 sm:w-64'
          >
            <motion.button
              onClick={() => router.push('/myaccount/upgrade')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className='w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-medium rounded-lg shadow-lg transition-all duration-200'
            >
              <Zap className='w-3 h-3' />
              <span>Upgrade Plan</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateFormButton;
