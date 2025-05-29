// src/components/form-builder/settings/FormSettingsPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import {
  updateFormSettings,
  setFormTitle,
  loadFormAsync,
} from '@/redux/slices/formBuilderSlice';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Settings,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Eye,
  Mail,
  Users,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import useAutoSave from '@/hooks/useAutoSave';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { apiConfig } from '@/config/api';
import { FormSettings } from '@/types/form';

export default function FormSettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();
  const formId = params.formId as string;

  const form = useSelector((state: RootState) => state.formBuilder.form);

  const [title, setTitle] = useState('');
  const [submitButtonText, setSubmitButtonText] = useState('Submit');
  const [thankyouMessage, setThankyouMessage] = useState(
    'Thank you for your submission!'
  );
  const [isFormEnabled, setIsFormEnabled] = useState(true);
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] =
    useState(true);
  const [allowMultipleEmailSubmissions, setAllowMultipleEmailSubmissions] =
    useState(true);

  // Loading states
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isInitialized, setIsInitialized] = useState(false);

  // Auto-save hook for settings (excluding title and status which have separate handlers)
  const { isSaving } = useAutoSave(form, formId, !!form, {
    delay: 1000,
    enableToast: false,
  });

  useEffect(() => {
    if (form && form.settings) {
      console.log('📄 Form data updated:', {
        title: form.title,
        isEnabled: form.settings?.isEnabled,
        settings: form.settings,
      });

      setTitle(form.title || '');
      setSubmitButtonText(form.settings?.submitButtonText || 'Submit');
      setThankyouMessage(
        form.settings?.thankyouMessage || 'Thank you for your submission!'
      );
      setIsFormEnabled(
        form.settings?.isEnabled !== undefined ? form.settings.isEnabled : true
      );
      setAllowMultipleSubmissions(
        form.settings?.allowMultipleSubmissions !== undefined
          ? form.settings.allowMultipleSubmissions
          : true
      );
      setAllowMultipleEmailSubmissions(
        form.settings?.allowMultipleEmailSubmissions !== undefined
          ? form.settings.allowMultipleEmailSubmissions
          : true
      );

      const enabledStatus =
        form.settings?.isEnabled !== undefined ? form.settings.isEnabled : true;

      console.log('🔄 Setting form enabled status:', enabledStatus);
      setIsFormEnabled(enabledStatus);
      setIsInitialized(true);
    }
  }, [form, form?.settings?.isEnabled, form?.settings]); // Add dependency on isEnabled

  const handleMultipleSubmissionsToggle = () => {
    const newValue = !allowMultipleSubmissions;

    console.log('🔄 Toggling multiple submissions:', {
      from: allowMultipleSubmissions,
      to: newValue,
      currentEmailSetting: allowMultipleEmailSubmissions,
    });

    setAllowMultipleSubmissions(newValue);

    // Update Redux immediately
    const settingsUpdate: Partial<FormSettings> = {
      allowMultipleSubmissions: newValue,
    };

    // If disabling multiple submissions, also disable multiple email submissions
    if (!newValue && allowMultipleEmailSubmissions) {
      setAllowMultipleEmailSubmissions(false);
      settingsUpdate.allowMultipleEmailSubmissions = false;
    }

    dispatch(updateFormSettings(settingsUpdate));

    console.log('✅ Multiple submissions setting updated:', settingsUpdate);
  };

  const handleMultipleEmailSubmissionsToggle = () => {
    if (!allowMultipleSubmissions) {
      console.log(
        '⚠️ Cannot toggle email submissions when multiple submissions is disabled'
      );
      return;
    }

    const newValue = !allowMultipleEmailSubmissions;

    console.log('🔄 Toggling multiple email submissions:', {
      from: allowMultipleEmailSubmissions,
      to: newValue,
    });

    setAllowMultipleEmailSubmissions(newValue);

    dispatch(
      updateFormSettings({
        allowMultipleEmailSubmissions: newValue,
      })
    );

    console.log('✅ Multiple email submissions setting updated:', newValue);
  };

  // Manual save function for title
  const saveTitleToBackend = async (newTitle: string) => {
    if (!newTitle.trim() || !formId) return;

    setIsSavingTitle(true);
    setTitleError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

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

      // Reload form data to ensure consistency
      await dispatch(loadFormAsync(formId));

      toast.success('Form title updated successfully');
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

      // Reset title to original value on error
      setTitle(form?.title || '');
    } finally {
      setIsSavingTitle(false);
    }
  };

  // Manual save function for form status
  const saveFormStatusToBackend = async (enabled: boolean) => {
    if (!formId) return;

    setIsSavingStatus(true);
    setStatusError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // ✅ FIXED: Properly merge settings
      const updatedSettings = {
        ...form?.settings,
        isEnabled: enabled,
      };

      // Update form status in backend
      await axios.put(
        `${apiConfig.url}/forms/${formId}`,
        {
          settings: updatedSettings,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update Redux state
      dispatch(updateFormSettings({ isEnabled: enabled }));

      // Reload form data to ensure consistency
      await dispatch(loadFormAsync(formId));

      toast.success(`Form ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to update form status';
      setStatusError(errorMessage);
      toast.error(errorMessage);
      console.error('Failed to update form status:', error);

      // Revert the UI state on error
      setIsFormEnabled(!enabled);
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setTitleError(null);
  };

  const handleTitleBlur = () => {
    if (title.trim() && title.trim() !== form?.title) {
      saveTitleToBackend(title.trim());
    } else if (!title.trim()) {
      setTitle(form?.title || '');
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    }
  };

  const handleSubmitButtonTextChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newText = e.target.value;
    setSubmitButtonText(newText);
    dispatch(
      updateFormSettings({
        submitButtonText: newText,
      })
    );
  };

  const handleThankyouMessageChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newMessage = e.target.value;
    setThankyouMessage(newMessage);
    dispatch(
      updateFormSettings({
        thankyouMessage: newMessage,
      })
    );
  };

  const handleFormStatusToggle = async () => {
    const newStatus = !isFormEnabled;
    setIsFormEnabled(newStatus);
    await saveFormStatusToBackend(newStatus);
  };

  if (!form) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4 text-gray-500' />
          <div className='text-gray-500'>Loading form settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-[#F3F3FE] min-h-screen'>
      <div className='max-w-4xl mx-auto p-8 bg-[#F3F3FE] min-h-screen'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center mb-4'>
            <div className='w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4'>
              <Settings className='w-6 h-6 text-white' />
            </div>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                FORM SETTINGS
              </h1>
              <p className='text-gray-600'>
                Customize form status and properties
              </p>
            </div>
          </div>
        </div>

        <div className='space-y-8'>
          {/* Form Title */}
          <motion.div
            className='bg-white rounded-lg p-6'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className='mb-4'>
              <Label
                htmlFor='form-title'
                className='text-lg font-medium text-gray-900'
              >
                Title
              </Label>
              <p className='text-sm text-gray-600 mt-1'>
                Enter a name for your form (press Enter to save)
              </p>
            </div>
            <div className='relative'>
              <Input
                id='form-title'
                value={title}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                placeholder='Enter form title'
                className={`text-lg pr-10 ${
                  titleError ? 'border-red-500' : ''
                }`}
                disabled={isSavingTitle}
              />
              {isSavingTitle && (
                <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                  <Loader2 className='w-4 h-4 animate-spin text-blue-500' />
                </div>
              )}
            </div>
            {titleError && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className='text-red-600 text-sm mt-2 flex items-center'
              >
                <AlertCircle className='w-4 h-4 mr-1' />
                {titleError}
              </motion.p>
            )}
          </motion.div>

          {/* Form Status */}
          <motion.div
            className='bg-white rounded-lg p-6'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className='mb-4'>
              <Label className='text-lg font-medium text-gray-900'>
                Form Status
              </Label>
              <p className='text-sm text-gray-600 mt-1'>
                Enable or disable form submissions
              </p>
            </div>

            <div
              className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSavingStatus
                  ? 'border-blue-200 bg-blue-50 cursor-not-allowed'
                  : isFormEnabled
                  ? 'border-green-200 bg-green-50 hover:border-green-300'
                  : 'border-red-200 bg-red-50 hover:border-red-300'
              }`}
              onClick={!isSavingStatus ? handleFormStatusToggle : undefined}
            >
              <div className='flex items-center'>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                    isSavingStatus
                      ? 'bg-blue-500'
                      : isFormEnabled
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                >
                  {isSavingStatus ? (
                    <Loader2 className='w-5 h-5 text-white animate-spin' />
                  ) : isFormEnabled ? (
                    <CheckCircle className='w-5 h-5 text-white' />
                  ) : (
                    <XCircle className='w-5 h-5 text-white' />
                  )}
                </div>
                <div>
                  <h3
                    className={`font-medium ${
                      isSavingStatus
                        ? 'text-blue-800'
                        : isFormEnabled
                        ? 'text-green-800'
                        : 'text-red-800'
                    }`}
                  >
                    {isSavingStatus
                      ? 'UPDATING...'
                      : isFormEnabled
                      ? 'ENABLED'
                      : 'DISABLED'}
                  </h3>
                  <p
                    className={`text-sm ${
                      isSavingStatus
                        ? 'text-blue-600'
                        : isFormEnabled
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {isSavingStatus
                      ? 'Updating form status...'
                      : isFormEnabled
                      ? 'Your form is currently visible and able to receive submissions'
                      : 'Your form is currently disabled and cannot receive submissions'}
                  </p>
                </div>
              </div>
              {!isSavingStatus && (
                <div className='text-gray-400'>
                  <svg
                    className='w-5 h-5'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
              )}
            </div>

            {statusError && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className='text-red-600 text-sm mt-2 flex items-center'
              >
                <AlertCircle className='w-4 h-4 mr-1' />
                {statusError}
              </motion.p>
            )}
          </motion.div>

          {/* ✅ NEW: Submission Controls */}
          <motion.div
            className='bg-white rounded-lg p-6'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className='mb-6'>
              <Label className='text-lg font-medium text-gray-900 flex items-center'>
                <Shield className='w-5 h-5 mr-2' />
                Submission Controls
              </Label>
              <p className='text-sm text-gray-600 mt-1'>
                Control how users can submit your form
              </p>
            </div>

            <div className='space-y-4'>
              {/* Allow Multiple Submissions (IP-based) */}
              <div
                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  allowMultipleSubmissions
                    ? 'border-green-200 bg-green-50 hover:border-green-300'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
                onClick={handleMultipleSubmissionsToggle}
              >
                <div className='flex items-center'>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                      allowMultipleSubmissions ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  >
                    {allowMultipleSubmissions ? (
                      <CheckCircle className='w-4 h-4 text-white' />
                    ) : (
                      <XCircle className='w-4 h-4 text-white' />
                    )}
                  </div>
                  <div>
                    <h4 className='font-medium text-gray-900 flex items-center'>
                      <Users className='w-4 h-4 mr-2' />
                      Allow Multiple Submissions
                    </h4>
                    <p className='text-sm text-gray-600'>
                      {allowMultipleSubmissions
                        ? 'Users can submit multiple times from the same device/IP'
                        : 'Users can only submit once per device/IP (24 hours)'}
                    </p>
                  </div>
                </div>
                <div className='text-sm font-mono text-gray-500'>
                  {allowMultipleSubmissions ? 'ON' : 'OFF'}
                </div>
              </div>

              {/* Allow Multiple Email Submissions */}
              <div
                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  !allowMultipleSubmissions
                    ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-100'
                    : allowMultipleEmailSubmissions
                    ? 'border-blue-200 bg-blue-50 hover:border-blue-300'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
                onClick={
                  allowMultipleSubmissions
                    ? handleMultipleEmailSubmissionsToggle
                    : undefined
                }
              >
                <div className='flex items-center'>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                      !allowMultipleSubmissions
                        ? 'bg-gray-300'
                        : allowMultipleEmailSubmissions
                        ? 'bg-blue-500'
                        : 'bg-gray-400'
                    }`}
                  >
                    {allowMultipleEmailSubmissions &&
                    allowMultipleSubmissions ? (
                      <CheckCircle className='w-4 h-4 text-white' />
                    ) : (
                      <XCircle className='w-4 h-4 text-white' />
                    )}
                  </div>
                  <div>
                    <h4 className='font-medium text-gray-900 flex items-center'>
                      <Mail className='w-4 h-4 mr-2' />
                      Allow Multiple Submissions from Same Email
                    </h4>
                    <p className='text-sm text-gray-600'>
                      {!allowMultipleSubmissions
                        ? 'Enable multiple submissions first to use this option'
                        : allowMultipleEmailSubmissions
                        ? 'Same email address can submit multiple times'
                        : 'Each email address can only submit once (24 hours)'}
                    </p>
                  </div>
                </div>
                <div className='text-sm font-mono text-gray-500'>
                  {!allowMultipleSubmissions
                    ? 'DISABLED'
                    : allowMultipleEmailSubmissions
                    ? 'ON'
                    : 'OFF'}
                </div>
              </div>

              {/* Status Info */}
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <div className='flex items-start'>
                  <Eye className='w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0' />
                  <div className='text-sm text-blue-800'>
                    <p className='font-medium mb-1'>Current Configuration:</p>
                    <ul className='space-y-1'>
                      <li>
                        <strong>Multiple Submissions:</strong>{' '}
                        {allowMultipleSubmissions ? 'Enabled' : 'Disabled'}
                      </li>
                      <li>
                        <strong>Same Email:</strong>{' '}
                        {allowMultipleEmailSubmissions &&
                        allowMultipleSubmissions
                          ? 'Enabled'
                          : 'Disabled'}
                      </li>
                      <li>
                        <strong>Result:</strong>{' '}
                        {!allowMultipleSubmissions
                          ? 'One submission per device/IP'
                          : !allowMultipleEmailSubmissions
                          ? 'Multiple submissions allowed, but each email only once'
                          : 'Unlimited submissions allowed'}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Submit Button Text */}
          <motion.div
            className='bg-white rounded-lg p-6'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className='mb-4'>
              <Label
                htmlFor='submit-button-text'
                className='text-lg font-medium text-gray-900'
              >
                Submit Button Text
              </Label>
              <p className='text-sm text-gray-600 mt-1'>
                Customize the text on your submit button
              </p>
            </div>
            <Input
              id='submit-button-text'
              value={submitButtonText}
              onChange={handleSubmitButtonTextChange}
              placeholder='Submit'
            />
          </motion.div>

          {/* Thank You Message */}
          <motion.div
            className='bg-white rounded-lg p-6'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className='mb-4'>
              <Label
                htmlFor='thankyou-message'
                className='text-lg font-medium text-gray-900'
              >
                Thank You Message
              </Label>
              <p className='text-sm text-gray-600 mt-1'>
                Message shown after form submission
              </p>
            </div>
            <Textarea
              id='thankyou-message'
              value={thankyouMessage}
              onChange={handleThankyouMessageChange}
              placeholder='Thank you for your submission!'
              rows={3}
            />
          </motion.div>

          {/* Save Status */}
          <div className='text-center'>
            <p className='text-sm text-green-600 flex items-center justify-center'>
              <CheckCircle className='w-4 h-4 mr-2' />
              Settings are automatically saved
              {isSaving && <span className='ml-2'>• Saving...</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
