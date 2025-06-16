// src/components/form-builder/publish/FormPublishPage.tsx
'use client';

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { publishFormAsync } from '@/redux/slices/formBuilder/formBuilderSlice';
import {
  Link as LinkIcon,
  Copy,
  ExternalLink,
  EyeOff,
  Globe,
  Lock,
  CheckCircle,
  AlertTriangle,
  Settings,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import useAutoSave from '@/hooks/useAutoSave';
import { useRouter } from 'next/navigation';

interface FormPublishPageProps {
  formId: string;
}

export default function FormPublishPage({ formId }: FormPublishPageProps) {
  const form = useSelector((state: RootState) => state.formBuilder.form);
  const dispatch = useDispatch<AppDispatch>();
  const [copied, setCopied] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const router = useRouter();

  // Auto-save hook
  const { isSaving } = useAutoSave(form, formId, !!form, {
    delay: 1000,
    enableToast: false,
  });

  if (!form) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <div className='text-gray-500 text-sm'>Loading form...</div>
      </div>
    );
  }

  const shareableLink = `${window.location.origin}/form/${formId}`;
  const isPublished = form.isPublished;
  const isEnabled = form.settings?.isEnabled !== false;
  const isAccessible = isPublished && isEnabled;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleOpenInNewTab = () => {
    if (!isAccessible) {
      toast.error('Form must be published and enabled to be viewed publicly');
      return;
    }
    window.open(shareableLink, '_blank');
  };

  const handleTogglePublish = async () => {
    setIsToggling(true);

    try {
      const newStatus = !isPublished;

      if (newStatus) {
        // Validate before publishing
        const hasFields = form.pages?.some(
          page => page.fields && page.fields.length > 0
        );

        if (!hasFields) {
          toast.error(
            'Cannot publish form without fields. Please add at least one field to your form.'
          );
          return;
        }

        if (
          !form.title ||
          form.title.trim() === '' ||
          form.title === 'Untitled Form'
        ) {
          toast.error('Please add a title to your form before publishing.');
          return;
        }
      }

      await dispatch(
        publishFormAsync({
          formId,
          isPublished: newStatus,
        })
      ).unwrap();

      toast.success(
        newStatus
          ? 'Form published successfully! Your form is now live.'
          : 'Form unpublished. It is no longer publicly accessible.'
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to update form status');
    } finally {
      setIsToggling(false);
    }
  };

  // Get form status info
  const getStatusInfo = () => {
    if (!isPublished) {
      return {
        status: 'DRAFT',
        color: 'gray',
        icon: EyeOff,
        message: 'Form is not published yet',
        description: 'Your form is private and not accessible to the public',
      };
    }

    if (!isEnabled) {
      return {
        status: 'PUBLISHED BUT DISABLED',
        color: 'orange',
        icon: Lock,
        message: 'Form is published but disabled',
        description:
          'Form is published but submissions are disabled in settings',
      };
    }

    return {
      status: 'LIVE',
      color: 'green',
      icon: Globe,
      message: 'Form is live and collecting responses',
      description:
        'Your form is publicly accessible and ready to receive submissions',
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className='bg-[#F3F3FE] min-h-screen'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 bg-[#F3F3FE] min-h-screen'>
        {/* Auto-save indicator */}
        <AnimatePresence>
          {isSaving && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className='fixed top-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg z-50 text-xs sm:text-sm'
            >
              Saving changes...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          className='mb-4 sm:mb-6'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className='flex flex-col sm:flex-row sm:items-center my-3 sm:mb-4'>
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-3 sm:mb-0 sm:mr-3 ${
                statusInfo.color === 'green'
                  ? 'bg-green-500'
                  : statusInfo.color === 'orange'
                  ? 'bg-orange-500'
                  : 'bg-gray-500'
              }`}
            >
              <StatusIcon className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
            </div>
            <div>
              <h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900'>
                PUBLISH YOUR FORM
              </h1>
              <p className='text-xs sm:text-sm text-gray-600 mt-0'>
                {statusInfo.description}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form Status Card */}
        <motion.div
          className={`rounded-lg p-4 sm:p-5 mb-4 sm:mb-6 border-2 ${
            statusInfo.color === 'green'
              ? 'bg-green-50 border-green-200'
              : statusInfo.color === 'orange'
              ? 'bg-orange-50 border-orange-200'
              : 'bg-gray-50 border-gray-200'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4'>
            <div className='flex items-center mb-3 sm:mb-0'>
              <StatusIcon
                className={`w-6 h-6 sm:w-7 sm:h-7 mr-3 ${
                  statusInfo.color === 'green'
                    ? 'text-green-600'
                    : statusInfo.color === 'orange'
                    ? 'text-orange-600'
                    : 'text-gray-600'
                }`}
              />
              <div>
                <h2
                  className={`text-sm sm:text-base lg:text-lg font-semibold ${
                    statusInfo.color === 'green'
                      ? 'text-green-900'
                      : statusInfo.color === 'orange'
                      ? 'text-orange-900'
                      : 'text-gray-900'
                  }`}
                >
                  {statusInfo.status}
                </h2>
                <p
                  className={`text-xs sm:text-sm ${
                    statusInfo.color === 'green'
                      ? 'text-green-700'
                      : statusInfo.color === 'orange'
                      ? 'text-orange-700'
                      : 'text-gray-700'
                  }`}
                >
                  {statusInfo.message}
                </p>
              </div>
            </div>

            <motion.button
              onClick={handleTogglePublish}
              disabled={isToggling}
              className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all cursor-pointer text-sm sm:text-base ${
                isPublished
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={{ scale: isToggling ? 1 : 1.02 }}
              whileTap={{ scale: isToggling ? 1 : 0.98 }}
            >
              {isToggling
                ? 'UPDATING...'
                : isPublished
                ? 'UNPUBLISH FORM'
                : 'PUBLISH FORM'}
            </motion.button>
          </div>

          {/* Status Alerts */}
          {!isEnabled && isPublished && (
            <div className='flex items-start p-3 bg-orange-100 rounded-lg border border-orange-200'>
              <AlertTriangle className='w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0' />
              <span className='text-orange-800 text-xs sm:text-sm'>
                Form is published but disabled. Enable it in{' '}
                <button
                  className='underline font-medium hover:text-orange-900 hover:cursor-pointer cursor-pointer'
                  onClick={() => router.push(`/build/${formId}/settings`)}
                >
                  Settings
                </button>{' '}
                to accept submissions.
              </span>
            </div>
          )}
        </motion.div>

        {/* Link Sharing Section */}
        {isPublished && (
          <motion.div
            className='bg-white rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6'>
              <div className='flex flex-col sm:flex-row sm:items-center mb-3 sm:mb-0'>
                <h2 className='text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2 sm:mb-0 sm:mr-4'>
                  SHARE WITH LINK
                </h2>
                <div
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center w-fit ${
                    isAccessible
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {isAccessible ? (
                    <>
                      <Globe className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
                      Live Form
                    </>
                  ) : (
                    <>
                      <Lock className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
                      Form Disabled
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Link Display */}
            <div className='flex items-center bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6'>
              <LinkIcon className='w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0' />
              <span className='flex-1 text-gray-700 font-mono text-xs sm:text-sm break-all overflow-hidden'>
                {shareableLink}
              </span>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
              <motion.button
                onClick={handleCopyLink}
                className={`flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all cursor-pointer text-sm sm:text-base ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Copy className='w-3 h-3 sm:w-4 sm:h-4 mr-2' />
                {copied ? 'COPIED!' : 'COPY LINK'}
              </motion.button>

              <motion.button
                onClick={handleOpenInNewTab}
                disabled={!isAccessible}
                className={`flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all cursor-pointer text-sm sm:text-base ${
                  isAccessible
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                whileHover={{ scale: isAccessible ? 1.02 : 1 }}
                whileTap={{ scale: isAccessible ? 0.98 : 1 }}
              >
                <ExternalLink className='w-3 h-3 sm:w-4 sm:h-4 mr-2' />
                OPEN FORM
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Form Preview Card */}
        <motion.div
          className='bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm mb-4 sm:mb-6'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4'>
            Form Preview
          </h3>

          <div className='bg-gray-50 rounded-lg p-4 sm:p-6'>
            <div className='mb-3 sm:mb-4'>
              <h4 className='text-lg sm:text-xl font-bold text-gray-900 line-clamp-2'>
                {form.title}
              </h4>
              {form.description && (
                <p className='text-gray-600 mt-2 text-sm sm:text-base line-clamp-3'>
                  {form.description}
                </p>
              )}
            </div>

            <div className='space-y-2 sm:space-y-3'>
              {form.pages[0]?.fields?.slice(0, 3).map(field => (
                <div
                  key={field.id}
                  className='flex items-center text-xs sm:text-sm text-gray-600'
                >
                  <div className='w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mr-2 sm:mr-3 flex-shrink-0'></div>
                  <span className='truncate'>{field.label}</span>
                  {field.required && (
                    <span className='text-red-500 ml-1 flex-shrink-0'>*</span>
                  )}
                </div>
              ))}

              {(form.pages[0]?.fields?.length || 0) > 3 && (
                <div className='flex items-center text-xs sm:text-sm text-gray-500'>
                  <div className='w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-300 rounded-full mr-2 sm:mr-3 flex-shrink-0'></div>
                  <span>
                    + {(form.pages[0]?.fields?.length || 0) - 3} more fields
                  </span>
                </div>
              )}
            </div>

            <div className='mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200'>
              <div className='flex justify-between items-center text-xs sm:text-sm text-gray-500'>
                <span>
                  {form.pages.length} page{form.pages.length > 1 ? 's' : ''}
                </span>
                <span className='flex items-center'>
                  <Users className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
                  {form.submissions || 0} submissions
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Tips */}
        <motion.div
          className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className='p-4 sm:p-6 bg-blue-50 rounded-lg border border-blue-200'>
            <div className='flex items-center mb-2 sm:mb-3'>
              <CheckCircle className='w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mr-2 flex-shrink-0' />
              <h3 className='text-base sm:text-lg font-semibold text-blue-900'>
                Form Published
              </h3>
            </div>
            <p className='text-blue-700 text-xs sm:text-sm leading-relaxed'>
              Your form is ready to collect responses. Share the link above with
              your audience or embed it on your website.
            </p>
          </div>

          <div className='p-4 sm:p-6 bg-purple-50 rounded-lg border border-purple-200'>
            <div className='flex items-center mb-2 sm:mb-3'>
              <Settings className='w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mr-2 flex-shrink-0' />
              <h3 className='text-base sm:text-lg font-semibold text-purple-900'>
                Manage Settings
              </h3>
            </div>
            <p className='text-purple-700 text-xs sm:text-sm leading-relaxed'>
              Control form access, customize messages, and manage other settings
              from the Settings tab.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
