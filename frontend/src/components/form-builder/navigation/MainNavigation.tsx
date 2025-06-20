// src/components/form-builder/navigation/MainNavigation.tsx
'use client';

import { useRouter, usePathname, useParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import {
  publishFormAsync,
  setPreviewMode,
} from '@/redux/slices/formBuilder/formBuilderSlice';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MainNavigationProps {
  isPreviewEnabled?: boolean;
  onPreviewToggle?: (enabled: boolean) => void;
}

export default function MainNavigation({
  isPreviewEnabled = false,
  onPreviewToggle,
}: MainNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const formId = params.formId as string;
  const dispatch = useDispatch<AppDispatch>();

  const form = useSelector((state: RootState) => state.formBuilder.form);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const tabs = [
    { key: 'BUILD', label: 'Build', mobileLabel: 'Build' },
    { key: 'SETTINGS', label: 'Settings', mobileLabel: 'Settings' },
    { key: 'PUBLISH', label: 'Publish', mobileLabel: 'Publish' },
    { key: 'SUBMISSIONS', label: 'Submissions', mobileLabel: 'Results' },
  ];

  // Determine active tab based on current pathname and preview mode
  const getActiveTab = () => {
    if (isPreviewEnabled) return 'BUILD';
    if (pathname.includes('/settings')) return 'SETTINGS';
    if (pathname.includes('/publish')) return 'PUBLISH';
    if (pathname.includes('/submissions')) return 'SUBMISSIONS';
    return 'BUILD';
  };

  const activeTab = getActiveTab();

  // Check if form can be published
  const canPublishForm = () => {
    if (!form) return false;

    const hasFields = form.pages?.some(
      page => page.fields && page.fields.length > 0
    );

    if (!hasFields) {
      toast.error(
        'Cannot publish form without fields. Please add at least one field to your form.'
      );
      return false;
    }

    if (
      !form.title ||
      form.title.trim() === '' ||
      form.title === 'Untitled Form'
    ) {
      toast.error('Please add a title to your form before publishing.');
      return false;
    }

    return true;
  };

  // Handle form publishing
  const handlePublishForm = async () => {
    if (!canPublishForm()) return false;

    setIsPublishing(true);

    try {
      await dispatch(
        publishFormAsync({
          formId,
          isPublished: true,
        })
      ).unwrap();

      toast.success('Form published and preview enabled!');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to publish form for preview:', error);
      toast.error(error.message || 'Failed to publish form for preview.');
      return false;
    } finally {
      setIsPublishing(false);
    }
  };

  const handleTabChange = async (tab: string) => {
    // Don't allow tab changes during preview mode
    if (isPreviewEnabled && tab !== 'BUILD') {
      return;
    }

    switch (tab) {
      case 'BUILD':
        router.push(`/build/${formId}`);
        break;
      case 'SETTINGS':
        router.push(`/build/${formId}/settings`);
        break;
      case 'PUBLISH':
        if (!form?.isPublished) {
          const success = await handlePublishForm();
          if (success) {
            router.push(`/build/${formId}/publish`);
          }
        } else {
          router.push(`/build/${formId}/publish`);
        }
        break;
      case 'SUBMISSIONS':
        router.push(`/build/${formId}/submissions`);
        break;
    }
  };

  const handlePreviewToggle = async () => {
    const newPreviewState = !isPreviewEnabled;

    if (newPreviewState) {
      setIsPreviewLoading(true);

      try {
        if (!form?.isPublished) {
          const publishSuccess = await handlePublishForm();
          if (!publishSuccess) {
            setIsPreviewLoading(false);
            return;
          }
        }

        dispatch(setPreviewMode(true));

        if (onPreviewToggle) {
          onPreviewToggle(true);
        }

        window.location.hash = '#preview';
      } catch (error) {
        console.error('❌ Error enabling preview mode:', error);
        toast.error('Failed to enable preview mode');
      } finally {
        setIsPreviewLoading(false);
      }
    } else {
      dispatch(setPreviewMode(false));

      if (onPreviewToggle) {
        onPreviewToggle(false);
      }

      window.location.hash = '';
    }
  };

  return (
    <motion.nav
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
      className='relative bg-gradient-to-r from-[#F8A030] via-[#F8A030] to-[#F9B054] border-b border-orange-200 shadow-lg overflow-hidden'
    >
      {/* Background Pattern */}
      <div className='absolute inset-0 bg-gradient-to-r from-orange-400/10 via-transparent to-yellow-400/10' />
      <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width="20" height="20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="10" cy="10" r="1"/%3E%3C/g%3E%3C/svg%3E")]' />

      {/* Mobile Layout */}
      <div className='block sm:hidden relative z-10'>
        {/* Navigation Tabs Row */}
        <div className='flex w-full'>
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex-1 px-1 py-3 text-xs font-semibold transition-all duration-300 relative overflow-hidden ${
                activeTab === tab.key
                  ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              } ${
                (tab.key === 'PUBLISH' && isPublishing) || isPreviewLoading
                  ? 'cursor-not-allowed opacity-50'
                  : ''
              } ${
                isPreviewEnabled && tab.key !== 'BUILD'
                  ? 'opacity-40 cursor-not-allowed'
                  : ''
              }`}
              onClick={() => handleTabChange(tab.key)}
              disabled={
                (tab.key === 'PUBLISH' && isPublishing) || isPreviewLoading
              }
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Active tab indicator */}
              {activeTab === tab.key && (
                <motion.div
                  className='absolute inset-0 bg-gradient-to-r from-white/20 to-white/30 border-b-2 border-white'
                  layoutId='mobileActiveTab'
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <div className='relative z-10 flex flex-col items-center space-y-1'>
                <span className='text-center leading-tight text-[10px] min-[400px]:text-xs'>
                  {tab.key === 'PUBLISH' && isPublishing
                    ? 'Publishing...'
                    : tab.mobileLabel}
                </span>

                {/* Preview mode indicator for BUILD tab */}
                {tab.key === 'BUILD' && isPreviewEnabled && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className='w-2 h-2 bg-blue-400 rounded-full border border-white animate-pulse'
                  />
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Preview Toggle Row - Hidden on very small screens */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='hidden min-[400px]:flex items-center justify-center py-2.5 bg-gradient-to-r from-orange-400/80 to-orange-600/80 backdrop-blur-sm border-t border-orange-300/30'
        >
          <div className='flex items-center space-x-3'>
            <span className='text-xs font-medium text-white/90 flex items-center space-x-1'>
              <Eye className='w-3 h-3' />
              <span>Preview</span>
            </span>

            {/* Mobile Toggle */}
            <motion.div
              className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer shadow-inner ${
                isPreviewLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isPreviewEnabled
                  ? 'bg-green-500 shadow-green-500/30'
                  : 'bg-white/30 shadow-black/20'
              }`}
              onClick={!isPreviewLoading ? handlePreviewToggle : undefined}
              whileTap={{ scale: 0.95 }}
            >
              {isPreviewLoading ? (
                <div className='absolute inset-0 flex items-center justify-center'>
                  <Loader2 className='w-3 h-3 text-white animate-spin' />
                </div>
              ) : (
                <motion.div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
                    isPreviewEnabled ? 'transform translate-x-6' : ''
                  }`}
                  layout
                >
                  {isPreviewEnabled ? (
                    <Eye className='w-2.5 h-2.5 text-green-500' />
                  ) : (
                    <EyeOff className='w-2.5 h-2.5 text-gray-400' />
                  )}
                </motion.div>
              )}
            </motion.div>

            {isPreviewLoading && (
              <span className='text-xs text-white/75'>Publishing...</span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Desktop Layout */}
      <div className='hidden sm:flex w-full h-12 relative z-10 bg-gradient-to-r from-orange-300/80 to-orange-600/80'>
        {/* Left Section */}
        <div className='flex-1' />

        {/* Center Section - Tabs */}
        <div className='flex items-center justify-center flex-1'>
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative px-6 lg:px-8 py-2 text-sm lg:text-lg font-semibold transition-all duration-300 overflow-hidden ${
                activeTab === tab.key
                  ? 'bg-[#F9B568] text-white shadow-lg scale-105'
                  : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-102'
              } ${
                (tab.key === 'PUBLISH' && isPublishing) || isPreviewLoading
                  ? 'cursor-not-allowed opacity-50'
                  : ''
              } ${
                isPreviewEnabled && tab.key !== 'BUILD'
                  ? 'opacity-40 cursor-not-allowed'
                  : ''
              }`}
              onClick={() => handleTabChange(tab.key)}
              disabled={
                (tab.key === 'PUBLISH' && isPublishing) || isPreviewLoading
              }
              whileHover={{ scale: activeTab === tab.key ? 1.05 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Active tab background with gradient */}
              {activeTab === tab.key && (
                <motion.div
                  className='absolute inset-0 bg-gradient-to-r from-[#F9B568] via-[#F9B568] to-[#FCC77A] shadow-lg'
                  layoutId='activeTabDesktop'
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* Tab content */}
              <div className='relative z-10 flex items-center space-x-2'>
                <span>
                  {tab.key === 'PUBLISH' && isPublishing
                    ? 'PUBLISHING...'
                    : tab.label.toUpperCase()}
                </span>

                {/* Preview mode indicator for BUILD tab */}
                {tab.key === 'BUILD' && isPreviewEnabled && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className='w-2.5 h-2.5 bg-blue-400 rounded-full border border-white animate-pulse shadow-lg'
                  />
                )}
              </div>

              {/* Hover effect overlay */}
              <motion.div
                className='absolute inset-0 bg-white/10 opacity-0'
                whileHover={{ opacity: activeTab === tab.key ? 0 : 1 }}
                transition={{ duration: 0.2 }}
              />
            </motion.button>
          ))}
        </div>

        {/* Right Section - Preview Toggle */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className='flex items-center justify-end flex-1 pr-4 lg:pr-6 space-x-3'
        >
          {/* Preview Label with Icon */}
          <div className='flex items-center space-x-2'>
            <span className='text-sm lg:text-base font-medium text-white/90'>
              Preview Form
            </span>
          </div>

          {/* Enhanced Toggle with 3D Effect */}
          <motion.div
            className={`relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer shadow-lg ${
              isPreviewLoading
                ? 'bg-gray-400 cursor-not-allowed shadow-gray-400/30'
                : isPreviewEnabled
                ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-green-500/40'
                : 'bg-gradient-to-r from-white/20 to-white/30 shadow-black/20'
            }`}
            onClick={!isPreviewLoading ? handlePreviewToggle : undefined}
            whileHover={{ scale: isPreviewLoading ? 1 : 1.05 }}
            whileTap={{ scale: isPreviewLoading ? 1 : 0.95 }}
          >
            {isPreviewLoading ? (
              <div className='absolute inset-0 flex items-center justify-center'>
                <Loader2 className='w-4 h-4 text-white animate-spin' />
              </div>
            ) : (
              <motion.div
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
                  isPreviewEnabled ? 'transform translate-x-7' : ''
                }`}
                layout
                whileHover={{ scale: 1.1 }}
              >
                <AnimatePresence mode='wait'>
                  {isPreviewEnabled ? (
                    <motion.div
                      key='enabled'
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Eye className='w-3 h-3 text-green-500' />
                    </motion.div>
                  ) : (
                    <motion.div
                      key='disabled'
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <EyeOff className='w-3 h-3 text-gray-400' />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Toggle track glow effect */}
            {isPreviewEnabled && !isPreviewLoading && (
              <motion.div
                className='absolute inset-0 rounded-full bg-green-400/30 blur-sm'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.div>

          {/* Status text */}
          <AnimatePresence>
            {isPreviewLoading && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className='text-xs lg:text-sm text-white/75 font-medium'
              >
                Publishing...
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Animated underline for active state */}
      <motion.div
        className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent'
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      />
    </motion.nav>
  );
}
