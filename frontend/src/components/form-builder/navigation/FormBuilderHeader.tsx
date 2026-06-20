'use client';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setFormTitle } from '@/redux/slices/formBuilder/formBuilderSlice';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import LOGO from '@/../public/Logo.png';
import Link from 'next/link';
import ProfileDropdown from '@/components/dashboard/ProfileDropdown';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Menu,
  ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
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

export default function FormBuilderHeader({
  title,
  lastSaved,
  isSaving = false,
  saveError = null,
}: FormBuilderHeaderProps) {
  const dispatch = useDispatch();
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;

  const [titleValue, setTitleValue] = useState(title);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle back navigation
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  // Update titleValue when title prop changes
  useEffect(() => {
    setTitleValue(title);
    setTitleError(null);
  }, [title]);

  // Manual save function for title with duplicate validation
  const saveTitleToBackend = async (newTitle: string) => {
    if (!newTitle.trim() || !formId || newTitle.trim() === title) return;

    setIsSavingTitle(true);
    setTitleError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      await axios.put(
        `${apiConfig.url}/forms/${formId}`,
        { title: newTitle.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      dispatch(setFormTitle(newTitle.trim()));
    } catch (error: any) {
      let errorMessage = 'Failed to update title';

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
      console.error('Failed to update title from header:', error);
      setTitleValue(title);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value);
    setTitleError(null);
  };

  const handleTitleBlur = () => {
    if (titleValue.trim() && titleValue.trim() !== title) {
      saveTitleToBackend(titleValue.trim());
    } else if (!titleValue.trim()) {
      setTitleValue(title);
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
    if (isSavingTitle) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='flex items-center text-blue-600'
        >
          <Loader2 className='w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin' />
          <span className='text-xs sm:text-sm font-medium'>
            Saving title...
          </span>
        </motion.div>
      );
    }

    if (titleError) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='flex items-center text-red-600'
        >
          <AlertCircle className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
          <span className='text-xs sm:text-sm font-medium'>
            Title save failed
          </span>
        </motion.div>
      );
    }

    if (!lastSaved) return 'Not saved yet';

    const formattedTime = formatTime(lastSaved);
    const saveDate = new Date(lastSaved);
    const now = new Date();
    const diffMs = now.getTime() - saveDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='flex items-center text-blue-600'
        >
          <Loader2 className='w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin' />
          <span className='text-xs sm:text-sm font-medium'>Saving...</span>
        </motion.div>
      );
    }

    if (saveError) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='flex items-center text-red-600'
        >
          <AlertCircle className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
          <span className='text-xs sm:text-sm font-medium'>Save failed</span>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className='flex items-center text-green-600 relative bottom-1'
      >
        <CheckCircle className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
        <span className='text-xs sm:text-sm font-medium'>
          <span className='hidden sm:inline'>All changes saved </span>
          <span className='sm:hidden'>Saved </span>
          {timeText}
        </span>
      </motion.div>
    );
  };

  return (
    <>
      {/* Main Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className='relative flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-white via-white to-gray-50 border-b border-gray-200 shadow-sm z-30 min-h-[64px] sm:min-h-[72px]'
      >
        {/* Left Side - Navigation & Branding */}
        <div className='flex items-center space-x-2 sm:space-x-4 min-w-0 flex-shrink-0 relative z-20'>
          {/* Mobile Back Button */}
          <button
            onClick={handleBackClick}
            className='flex sm:hidden items-center justify-center w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-200 shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer'
          >
            <ArrowLeft className='w-4 h-4 text-gray-700' />
          </button>

          {/* Desktop Logo & Brand - Hidden on smaller screens */}
          <Link
            href='/dashboard'
            className='hidden md:flex items-center cursor-pointer group'
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className='relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-1 shadow-sm'
            >
              <Image
                src={LOGO}
                alt='LOGO'
                width={33}
                height={33}
                priority
                className='rounded-md'
              />
              <div className='absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity' />
            </motion.div>
            <span className='ml-3 text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent whitespace-nowrap'>
              FormIQ
            </span>
          </Link>

          <div className='hidden lg:block'>
            <div className='hidden md:block border-l border-gray-300 h-6' />
          </div>

          {/* Form Builder Label - Only on large screens */}
          <div className='hidden lg:block'>
            <span className='text-gray-600 text-base font-medium bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap'>
              Form Builder
            </span>
          </div>
        </div>

        {/* Center - Form Title and Save Status */}
        <div className='absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-16 sm:px-4'>
          <motion.div
            className='w-full flex flex-col items-center space-y-1 pointer-events-none'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Form Title Input */}
            <div className='relative w-full max-w-xl'>
              <Input
                autoFocus
                value={titleValue}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className={`focus-visible:ring-0 border-none outline-none focus:outline-none focus:ring-0 focus:border-transparent shadow-none text-lg sm:text-xl lg:text-2xl font-semibold w-full text-center bg-transparent focus-visible:ring-offset-0 transition-all duration-200 px-2 py-0 pointer-events-auto ${
                  titleError
                    ? 'text-red-600'
                    : 'text-gray-900 hover:bg-gray-50/50'
                }`}
                placeholder='Form Title'
                disabled={isSavingTitle}
              />
            </div>

            {/* Save Status - Centered below title */}
            <div className='min-h-[20px] flex items-center justify-center pointer-events-none'>
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
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  {getSaveStatusDisplay()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Title error display - positioned below */}
          <AnimatePresence>
            {titleError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className='absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-xs sm:text-sm text-red-600 text-center max-w-md bg-red-50 px-3 py-2 rounded-lg border border-red-200 shadow-lg z-50'
              >
                {titleError}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side - Profile & Mobile Menu */}
        <div className='flex items-center space-x-2 flex-shrink-0 relative z-20'>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='flex sm:hidden items-center justify-center w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-200 shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer'
          >
            <Menu className='w-4 h-4 text-gray-700' />
          </button>

          {/* Desktop Profile */}
          <div className='hidden sm:block'>
            <ProfileDropdown />
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='sm:hidden bg-white border-b border-gray-200 shadow-lg overflow-hidden z-20'
          >
            <div className='px-4 py-4 space-y-4'>
              <div className='text-center'>
                <span className='text-gray-600 text-sm font-medium bg-gray-100 px-3 py-1 rounded-full'>
                  Form Builder
                </span>
              </div>

              <div className='pt-2 border-t border-gray-200'>
                <ProfileDropdown />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
