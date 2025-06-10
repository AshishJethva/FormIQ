// frontend/src/components/common/PlanLimitModal.tsx - Modal for plan limits
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, Crown, ArrowRight } from 'lucide-react';

interface PlanLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  formsUsed: number;
  formsLimit: number;
}

const PlanLimitModal: React.FC<PlanLimitModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  formsUsed,
  formsLimit,
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    router.push('/myaccount/upgrade');
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
        <div className='flex justify-between items-center mb-4'>
          <div className='flex items-center gap-2'>
            <Crown className='h-6 w-6 text-yellow-500' />
            <h2 className='text-xl font-semibold'>Upgrade Required</h2>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='mb-6'>
          <p className='text-gray-600 mb-4'>
            You&apos;ve reached your form limit with the {currentPlan} plan.
          </p>

          <div className='bg-gray-50 rounded-lg p-4 mb-4'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Forms Used</span>
              <span className='font-semibold'>
                {formsUsed}/{formsLimit}
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
              <div
                className='bg-red-500 h-2 rounded-full'
                style={{ width: '100%' }}
              ></div>
            </div>
          </div>

          <p className='text-sm text-gray-600'>
            Upgrade your plan to create more forms and unlock additional
            features.
          </p>
        </div>

        <div className='flex gap-3'>
          <button
            onClick={onClose}
            className='flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleUpgrade}
            className='flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2'
          >
            Upgrade Plan
            <ArrowRight className='h-4 w-4' />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanLimitModal;
