// src/components/form-builder/navigation/FormBuilderHeader.tsx
'use client';

import { useEffect, useState } from 'react';
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
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import axios from 'axios';
import { apiConfig } from '@/config/api';

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
  const params = useParams();
  const formId = params.formId as string;

  const [titleValue, setTitleValue] = useState(title);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);

  const { user } = useSelector((state: RootState) => state.user as UserState);

  //  FIXED: Update titleValue when title prop changes
  useEffect(() => {
    setTitleValue(title);
    setTitleError(null); // Clear any previous errors when title changes
  }, [title]);

  //  ADDED: Manual save function for title with duplicate validation
  const saveTitleToBackend = async (newTitle: string) => {
    if (!newTitle.trim() || !formId || newTitle.trim() === title) return;

    setIsSavingTitle(true);
    setTitleError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('💾 Saving title from header:', {
        formId,
        oldTitle: title,
        newTitle: newTitle.trim(),
      });

      // Update title in backend
      await axios.put(
        `${apiConfig.url}/forms/${formId}`,
        { title: newTitle.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update Redux state
      dispatch(setFormTitle(newTitle.trim()));

      toast.success('Form title updated successfully');
      console.log(' Title updated successfully from header');
    } catch (error: any) {
      let errorMessage = 'Failed to update title';

      //  FIXED: Handle specific error cases
      if (error.response?.status === 400) {
        errorMessage =
          error.response.data?.message ||
          'A form with this title already exists. Please choose a different title.';
      } else {
        errorMessage =
          error.response?.data?.message ||
          error.message ||
          'Failed to update title';
      }

      setTitleError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Failed to update title from header:', error);

      // Reset title to original value on error
      setTitleValue(title);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value);
    setTitleError(null); // Clear error when user starts typing
  };

  const handleTitleBlur = () => {
    if (titleValue.trim() && titleValue.trim() !== title) {
      saveTitleToBackend(titleValue.trim());
    } else if (!titleValue.trim()) {
      setTitleValue(title); // Reset to original if empty
      setTitleError(null);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    }
  };

  // Get save status display
  const getSaveStatusDisplay = () => {
    //  ADDED: Show title saving status first
    if (isSavingTitle) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex items-center text-blue-600'
        >
          <Loader2 className='w-4 h-4 mr-1 animate-spin' />
          <span className='text-sm font-medium'>Saving title...</span>
        </motion.div>
      );
    }

    //  ADDED: Show title error if exists
    if (titleError) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex items-center text-red-600'
        >
          <AlertCircle className='w-4 h-4 mr-1' />
          <span className='text-sm font-medium'>Title save failed</span>
        </motion.div>
      );
    }

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
        <div className='flex flex-col items-center -my-2'>
          <Input
            autoFocus
            value={titleValue}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className={`text-4xl font-semibold w-full max-w-xl text-center border-none bg-transparent shadow-none focus-visible:ring-0 focus:outline-none pr-8 ${
              titleError ? 'text-red-600' : ''
            }`}
            style={{ fontSize: '20px' }}
            placeholder='Form Title'
            disabled={isSavingTitle}
          />

          {/*  ADDED: Loading indicator for title */}
          {isSavingTitle && (
            <div className='absolute right-2 top-1/2 transform -translate-y-1/2'>
              <Loader2 className='w-4 h-4 animate-spin text-blue-500' />
            </div>
          )}

          {/* Save Status */}
          <div className='mt-[-2] mb-0.5 min-h-[24px] flex items-center justify-center'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={
                  isSavingTitle
                    ? 'saving-title'
                    : titleError
                    ? 'title-error'
                    : isSaving
                    ? 'saving'
                    : saveError
                    ? 'error'
                    : 'saved'
                }
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {getSaveStatusDisplay()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/*  ADDED: Title error display */}
          {titleError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className='text-xs text-red-600 mt-1 text-center max-w-xs'
            >
              {titleError}
            </motion.div>
          )}
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
