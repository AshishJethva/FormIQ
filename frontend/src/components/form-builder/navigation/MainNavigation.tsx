// src/components/form-builder/navigation/MainNavigation.tsx
'use client';

import { useRouter, usePathname, useParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import {
  publishFormAsync,
  setPreviewMode,
} from '@/redux/slices/formBuilderSlice';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

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

  const tabs = ['BUILD', 'SETTINGS', 'PUBLISH', 'SUBMISSIONS'];

  // Determine active tab based on current pathname and preview mode
  const getActiveTab = () => {
    if (isPreviewEnabled) return 'BUILD'; // Stay on BUILD tab during preview
    if (pathname.includes('/settings')) return 'SETTINGS';
    if (pathname.includes('/publish')) return 'PUBLISH';
    if (pathname.includes('/submissions')) return 'SUBMISSIONS';
    return 'BUILD';
  };

  const activeTab = getActiveTab();

  // Check if form can be published
  const canPublishForm = () => {
    if (!form) return false;

    // Check if form has at least one field
    const hasFields = form.pages?.some(
      page => page.fields && page.fields.length > 0
    );

    if (!hasFields) {
      toast.error(
        'Cannot publish form without fields. Please add at least one field to your form.'
      );
      return false;
    }

    // Check if form title exists
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
      console.log('🚀 Publishing form for preview:', {
        formId,
        currentStatus: form?.isPublished,
      });

      // Publish the form (set to true)
      await dispatch(
        publishFormAsync({
          formId,
          isPublished: true,
        })
      ).unwrap();

      console.log(' Form published successfully for preview');
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
      toast.info('Exit preview mode to access other tabs');
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
        // Auto-publish when user clicks PUBLISH tab
        if (!form?.isPublished) {
          const success = await handlePublishForm();
          if (success) {
            router.push(`/build/${formId}/publish`);
          }
        } else {
          // If already published, just navigate to publish page
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
      // Enabling preview mode - need to publish first
      setIsPreviewLoading(true);

      try {
        // Check if form is already published
        if (!form?.isPublished) {
          console.log('📝 Form not published, auto-publishing for preview...');
          const publishSuccess = await handlePublishForm();

          if (!publishSuccess) {
            setIsPreviewLoading(false);
            return; // Exit if publishing failed
          }
        }

        // Update Redux state
        dispatch(setPreviewMode(true));

        // Call parent handler
        if (onPreviewToggle) {
          onPreviewToggle(true);
        }

        // Update URL hash for preview state
        window.location.hash = '#preview';

        console.log(' Preview mode enabled successfully');
      } catch (error) {
        console.error('❌ Error enabling preview mode:', error);
        toast.error('Failed to enable preview mode');
      } finally {
        setIsPreviewLoading(false);
      }
    } else {
      // Disabling preview mode
      dispatch(setPreviewMode(false));

      if (onPreviewToggle) {
        onPreviewToggle(false);
      }

      // Clear URL hash
      window.location.hash = '';

      console.log('📴 Preview mode disabled');
    }
  };

  return (
    <nav className='flex items-center justify-between bg-[#F8A030] border-b border-orange-100 h-12'>
      {/* Left Section (empty in this design) */}
      <div className='flex-1'></div>

      {/* Center Section - Tabs */}
      <div className='flex items-center justify-center flex-1 h-fit'>
        {tabs.map(tab => (
          <button
            key={tab}
            className={`px-8 py-2 text-lg font-medium transition-colors relative ${
              activeTab === tab
                ? 'bg-[#F9B568] text-white'
                : 'opacity-60 hover:opacity-100 text-white hover:text-[#FFFFFF] hover:bg-[#F9B568]'
            } ${
              (tab === 'PUBLISH' && isPublishing) || isPreviewLoading
                ? 'cursor-not-allowed opacity-50'
                : ''
            } ${
              isPreviewEnabled && tab !== 'BUILD'
                ? 'opacity-30 cursor-not-allowed'
                : ''
            }`}
            onClick={() => handleTabChange(tab)}
            disabled={(tab === 'PUBLISH' && isPublishing) || isPreviewLoading}
          >
            {tab === 'PUBLISH' && isPublishing ? 'PUBLISHING...' : tab}

            {/* Preview mode indicator */}
            {tab === 'BUILD' && isPreviewEnabled && (
              <span className='absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-white animate-pulse'></span>
            )}
          </button>
        ))}
      </div>

      {/* Right Section - Preview Toggle */}
      <div className='flex items-center justify-end flex-1 pr-4 h-full'>
        <span className='mr-2 text-sm font-medium text-white'>
          Preview Form
        </span>

        {/* Enhanced Toggle with Loader */}
        <div
          className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
            isPreviewLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : isPreviewEnabled
              ? 'bg-[#A8EB38]'
              : 'bg-[#E2E3E9]'
          }`}
          onClick={!isPreviewLoading ? handlePreviewToggle : undefined}
        >
          {isPreviewLoading ? (
            // Loader state
            <div className='absolute inset-0 flex items-center justify-center'>
              <Loader2 className='w-3 h-3 text-white animate-spin' />
            </div>
          ) : (
            // Normal toggle
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform flex items-center justify-center ${
                isPreviewEnabled ? 'transform translate-x-6' : ''
              }`}
            >
              {isPreviewEnabled && (
                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              )}
            </span>
          )}
        </div>

        {/* Status text */}
        {isPreviewLoading && (
          <span className='ml-2 text-xs text-white opacity-75'>
            Publishing...
          </span>
        )}
      </div>
    </nav>
  );
}
