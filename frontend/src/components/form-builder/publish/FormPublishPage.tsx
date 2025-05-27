// src/components/form-builder/publish/FormPublishPage.tsx
'use client';

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { publishFormAsync } from '@/redux/slices/formBuilderSlice';
import {
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Settings,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import useAutoSave from '@/hooks/useAutoSave';

interface FormPublishPageProps {
  formId: string;
}

export default function FormPublishPage({ formId }: FormPublishPageProps) {
  const form = useSelector((state: RootState) => state.formBuilder.form);
  const dispatch = useDispatch<AppDispatch>();
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Auto-save hook
  const { isSaving } = useAutoSave(form, formId, !!form, {
    delay: 2000,
    enableToast: false,
  });

  if (!form) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-gray-500'>Loading form...</div>
      </div>
    );
  }

  const shareableLink = `${window.location.origin}/form/${formId}`;

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
    window.open(shareableLink, '_blank');
  };

  const handlePublishToggle = async () => {
    if (isPublishing) return;

    setIsPublishing(true);
    try {
      // You would need to track the publish state in your form
      const newPublishState = true; // Default to publishing the form

      await dispatch(
        publishFormAsync({
          formId,
          isPublished: newPublishState,
        })
      );

      toast.success(
        `Form ${newPublishState ? 'published' : 'unpublished'} successfully`
      );
    } catch {
      toast.error('Failed to update form status');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className='max-w-4xl mx-auto p-8 bg-white min-h-screen'>
      {/* Auto-save indicator */}
      {isSaving && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
        >
          Saving changes...
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        className='mb-8'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className='flex items-center mb-4'>
          <div className='w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4'>
            <LinkIcon className='w-6 h-6 text-white' />
          </div>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>
              DIRECT LINK OF YOUR FORM
            </h1>
            <p className='text-gray-600'>
              Your form is securely published and ready to use at this address
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Publish Section */}
      <motion.div
        className='bg-gray-50 rounded-lg p-8 mb-8'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center'>
            <h2 className='text-xl font-semibold text-gray-900 mr-4'>
              SHARE WITH LINK
            </h2>
            <div className='bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center'>
              <Eye className='w-4 h-4 mr-1' />
              Public Form
            </div>
          </div>
          <button
            className='flex items-center text-blue-600 hover:text-blue-700 transition-colors'
            onClick={handlePublishToggle}
            disabled={isPublishing}
          >
            <Settings className='w-4 h-4 mr-1' />
            {isPublishing ? 'Updating...' : 'Settings'}
          </button>
        </div>

        {/* Link Display */}
        <div className='flex items-center bg-white border border-gray-200 rounded-lg p-4 mb-6'>
          <LinkIcon className='w-5 h-5 text-gray-400 mr-3' />
          <span className='flex-1 text-gray-700 font-mono text-sm break-all'>
            {shareableLink}
          </span>
          <button className='ml-3 p-2 text-gray-400 hover:text-gray-600 transition-colors'>
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z' />
            </svg>
          </button>
        </div>

        {/* Action Buttons */}
        <div className='flex space-x-4'>
          <motion.button
            onClick={handleCopyLink}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Copy className='w-4 h-4 mr-2' />
            {copied ? 'COPIED!' : 'COPY LINK'}
          </motion.button>

          <motion.button
            onClick={handleOpenInNewTab}
            className='flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all'
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ExternalLink className='w-4 h-4 mr-2' />
            OPEN IN NEW TAB
          </motion.button>
        </div>
      </motion.div>

      {/* Form Preview Card */}
      <motion.div
        className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          Form Preview
        </h3>

        <div className='bg-gray-50 rounded-lg p-6'>
          <div className='mb-4'>
            <h4 className='text-xl font-bold text-gray-900'>{form.title}</h4>
            {form.description && (
              <p className='text-gray-600 mt-2'>{form.description}</p>
            )}
          </div>

          <div className='space-y-4'>
            {form.pages[0]?.fields?.slice(0, 3).map(field => (
              <div
                key={field.id}
                className='flex items-center text-sm text-gray-600'
              >
                <div className='w-2 h-2 bg-blue-500 rounded-full mr-3'></div>
                <span>{field.label}</span>
                {field.required && <span className='text-red-500 ml-1'>*</span>}
              </div>
            ))}

            {(form.pages[0]?.fields?.length || 0) > 3 && (
              <div className='flex items-center text-sm text-gray-500'>
                <div className='w-2 h-2 bg-gray-300 rounded-full mr-3'></div>
                <span>
                  + {(form.pages[0]?.fields?.length || 0) - 3} more fields
                </span>
              </div>
            )}
          </div>

          <div className='mt-6 pt-4 border-t border-gray-200'>
            <div className='flex justify-between items-center text-sm text-gray-500'>
              <span>
                {form.pages.length} page{form.pages.length > 1 ? 's' : ''}
              </span>
              <span>Public form</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Additional Options */}
      <motion.div
        className='mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className='text-lg font-semibold text-blue-900 mb-2'>
          Share Your Form
        </h3>
        <p className='text-blue-700 mb-4'>
          Your form is ready to collect responses. Share the link above with
          your audience, embed it on your website, or use it in your marketing
          campaigns.
        </p>

        <div className='flex items-center text-sm text-blue-600'>
          <LinkIcon className='w-4 h-4 mr-2' />
          <span>
            Form responses will be collected and available in your dashboard
          </span>
        </div>
      </motion.div>
    </div>
  );
}
