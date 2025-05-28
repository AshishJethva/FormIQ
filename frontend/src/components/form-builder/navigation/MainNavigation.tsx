// src/components/form-builder/navigation/MainNavigation.tsx
'use client';

import { useRouter, usePathname, useParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { publishFormAsync } from '@/redux/slices/formBuilderSlice';
import { toast } from 'sonner';
import { useState } from 'react';

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

  const tabs = ['BUILD', 'SETTINGS', 'PUBLISH'];

  // Determine active tab based on current pathname
  const getActiveTab = () => {
    if (pathname.includes('/settings')) return 'SETTINGS';
    if (pathname.includes('/publish')) return 'PUBLISH';
    if (pathname.includes('#preview')) return 'BUILD';
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
    if (!canPublishForm()) return;

    setIsPublishing(true);

    try {
      console.log('🚀 Publishing form:', {
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

      console.log('✅ Form published successfully');
      toast.success(
        'Form published successfully! Your form is now live and ready to receive submissions.'
      );

      // Navigate to publish page to show the shareable link
      router.push(`/build/${formId}/publish`);
    } catch (error: any) {
      console.error('❌ Failed to publish form:', error);
      toast.error(error.message || 'Failed to publish form. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleTabChange = async (tab: string) => {
    switch (tab) {
      case 'BUILD':
        router.push(`/build/${formId}`);
        break;
      case 'SETTINGS':
        router.push(`/build/${formId}/settings`);
        break;
      case 'PUBLISH':
        // ✅ ADDED: Auto-publish when user clicks PUBLISH tab
        if (!form?.isPublished) {
          await handlePublishForm();
        } else {
          // If already published, just navigate to publish page
          router.push(`/build/${formId}/publish`);
        }
        break;
    }
  };

  const handlePreviewToggle = () => {
    if (onPreviewToggle) {
      onPreviewToggle(!isPreviewEnabled);
    }

    // Navigate to preview URL
    if (!isPreviewEnabled) {
      router.push(`/build/${formId}#preview`);
    } else {
      router.push(`/build/${formId}`);
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
            className={`px-8 py-2 text-lg font-medium transition-colors ${
              activeTab === tab
                ? 'bg-[#F9B568] text-white'
                : 'opacity-60 hover:opacity-100 text-white hover:text-[#FFFFFF] hover:bg-[#F9B568]'
            } ${
              tab === 'PUBLISH' && isPublishing
                ? 'cursor-not-allowed opacity-50'
                : ''
            }`}
            onClick={() => handleTabChange(tab)}
            disabled={tab === 'PUBLISH' && isPublishing}
          >
            {tab === 'PUBLISH' && isPublishing ? 'PUBLISHING...' : tab}

            {/* ✅ ADDED: Published indicator */}
            {tab === 'PUBLISH' && form?.isPublished && !isPublishing && (
              <span className='absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white'></span>
            )}
          </button>
        ))}
      </div>

      {/* Right Section - Preview Toggle */}
      <div className='flex items-center justify-end flex-1 pr-4 h-full'>
        <span className='mr-2 text-sm font-medium text-white'>
          Preview Form
        </span>
        <div
          className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
            isPreviewEnabled ? 'bg-[#A8EB38]' : 'bg-[#E2E3E9]'
          }`}
          onClick={handlePreviewToggle}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
              isPreviewEnabled ? 'transform translate-x-6' : ''
            }`}
          />
        </div>
      </div>
    </nav>
  );
}
