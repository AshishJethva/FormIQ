// src/components/form-builder/navigation/FormBuilderHeader.tsx
'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFormTitle } from '@/redux/slices/formBuilderSlice';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import LOGO from '@/../public/Logo.png';
import Link from 'next/link';
import ProfileDropdown from '@/components/dashboard/ProfileDropdown';
import { RootState } from '@/redux/store';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime } from '@/lib/utils';

interface FormBuilderHeaderProps {
  title: string;
  lastSaved: string;
  isSaving?: boolean;
  saveError?: string | null;
  onManualSave?: () => void;
}

interface User {
  name?: string;
  profileImage?: string | null;
  subscription?: {
    plan?: string;
  };
  formsUsed?: number;
  formsTotal?: number;
}

interface UserState {
  user: User | null;
  token: string | null;
}

export default function FormBuilderHeader({
  title,
  lastSaved,
  isSaving = false,
  saveError = null,
}: FormBuilderHeaderProps) {
  const dispatch = useDispatch();
  const [titleValue, setTitleValue] = useState(title);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value);
  };

  const handleTitleBlur = () => {
    if (titleValue.trim()) {
      dispatch(setFormTitle(titleValue.trim()));
    } else {
      setTitleValue(title); // Reset to original if empty
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    }
  };

  const { user } = useSelector((state: RootState) => state.user as UserState);

  // Get save status display
  const getSaveStatusDisplay = () => {
    if (!lastSaved) return 'Not saved yet';

    // Use formatTime to format the lastSaved time
    const formattedTime = formatTime(lastSaved);

    // Calculate time difference for relative time display
    const saveDate = new Date(lastSaved);
    const now = new Date();
    const diffMs = now.getTime() - saveDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    // Prepare the relative time text
    let timeText = '';
    if (diffMins < 1) {
      timeText = `just now at ${formattedTime}`;
    } else if (diffMins === 1) {
      timeText = `1 minute ago at ${formattedTime}`;
    } else if (diffMins < 60) {
      timeText = `${diffMins} minutes ago at ${formattedTime}`;
    } else {
      timeText = `at ${formattedTime}`;
    }

    if (isSaving) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex items-center text-blue-600'
        >
          <Loader2 className='w-4 h-4 mr-1 animate-spin' />
          <span className='text-sm font-medium'>Saving...</span>
        </motion.div>
      );
    }

    if (saveError) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex items-center text-red-600'
        >
          <AlertCircle className='w-4 h-4 mr-1' />
          <span className='text-sm font-medium'>Save failed</span>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className='flex items-center text-green-600'
      >
        <CheckCircle className='w-4 h-4 mr-1' />
        <span className='text-sm font-medium'>
          All changes saved {timeText}
        </span>
      </motion.div>
    );
  };

  return (
    <header className='flex justify-between items-center px-6 py-3 bg-white border-b border-gray-200 z-30'>
      {/* Left Side - Logo and Form Builder Text */}
      <div className='flex items-center space-x-4'>
        <Link href='/dashboard' className='flex items-center cursor-pointer'>
          <Image src={LOGO} alt='LOGO' width={33} height={33} />
          <span className='ml-4 text-3xl font-bold text-gray-900 '>FormIQ</span>
        </Link>

        <div className='border border-[#e3e5f5] h-5'></div>
        <div className='relative '>
          <span className='text-gray-700 text-md font-medium mr-2 '>
            Form Builder
          </span>
        </div>
      </div>

      {/* Center - Form Title and Save Status */}
      <div className='flex-1 text-center max-w-xl mr-65'>
        <div className='flex flex-col items-center -my-2 '>
          <Input
            autoFocus
            value={titleValue}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className='text-4xl font-semibold w-full max-w-xs text-center border-none bg-transparent shadow-none focus-visible:ring-0 focus:outline-none'
            style={{ fontSize: '20px' }}
            placeholder='Form Title'
          />

          {/* Save Status */}
          <div className='mt-[-2] mb-0.5 min-h-[24px] flex items-center justify-center'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={isSaving ? 'saving' : saveError ? 'error' : 'saved'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {getSaveStatusDisplay()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right Side - Action Buttons */}
      <div className='flex items-center space-x-2'>
        <ProfileDropdown
          userName={user?.name || 'User'}
          userImage={user?.profileImage || null}
          planType={user?.subscription?.plan || 'STARTER'}
          formsUsed={user?.formsUsed || 0}
          formsTotal={user?.formsTotal || 5}
        />
      </div>
    </header>
  );
}
