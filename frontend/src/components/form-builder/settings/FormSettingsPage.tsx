'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import {
  updateFormSettings,
  setFormTitle,
  loadFormAsync,
} from '@/redux/slices/formBuilder/formBuilderSlice';
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
  ChevronRight,
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

  // DEFAULT TO TRUE - Multiple Submissions Controls
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
      },
    },
  };

  // Initialize with proper defaults and ensure both settings are ON by default
  useEffect(() => {
    if (form && form.settings) {
      setTitle(form.title || '');
      setSubmitButtonText(form.settings?.submitButtonText || 'Submit');
      setThankyouMessage(
        form.settings?.thankyouMessage || 'Thank you for your submission!'
      );
      setIsFormEnabled(
        form.settings?.isEnabled !== undefined ? form.settings.isEnabled : true
      );

      // Default to TRUE if not explicitly set
      const multipleSubmissions =
        form.settings?.allowMultipleSubmissions !== undefined
          ? form.settings.allowMultipleSubmissions
          : true; // Default to true

      const multipleEmailSubmissions =
        form.settings?.allowMultipleEmailSubmissions !== undefined
          ? form.settings.allowMultipleEmailSubmissions
          : true; // Default to true

      setAllowMultipleSubmissions(multipleSubmissions);
      setAllowMultipleEmailSubmissions(multipleEmailSubmissions);

      // If these settings are undefined in the backend, update them to true
      if (
        form.settings?.allowMultipleSubmissions === undefined ||
        form.settings?.allowMultipleEmailSubmissions === undefined
      ) {
        const settingsUpdate: Partial<FormSettings> = {};

        if (form.settings?.allowMultipleSubmissions === undefined) {
          settingsUpdate.allowMultipleSubmissions = true;
        }
        if (form.settings?.allowMultipleEmailSubmissions === undefined) {
          settingsUpdate.allowMultipleEmailSubmissions = true;
        }

        if (Object.keys(settingsUpdate).length > 0) {
          dispatch(updateFormSettings(settingsUpdate));
        }
      }

      setIsInitialized(true);
    }
  }, [form, form?.settings?.isEnabled, form?.settings, dispatch]);

  const handleMultipleSubmissionsToggle = () => {
    const newValue = !allowMultipleSubmissions;

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
  };

  const handleMultipleEmailSubmissionsToggle = () => {
    if (!allowMultipleSubmissions) {
      return;
    }

    const newValue = !allowMultipleEmailSubmissions;

    setAllowMultipleEmailSubmissions(newValue);

    dispatch(
      updateFormSettings({
        allowMultipleEmailSubmissions: newValue,
      })
    );
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

      // Properly merge settings and ensure defaults
      const updatedSettings = {
        ...form?.settings,
        isEnabled: enabled,
        // Ensure these are preserved as true if not explicitly set
        allowMultipleSubmissions:
          form?.settings?.allowMultipleSubmissions !== undefined
            ? form.settings.allowMultipleSubmissions
            : true,
        allowMultipleEmailSubmissions:
          form?.settings?.allowMultipleEmailSubmissions !== undefined
            ? form.settings.allowMultipleEmailSubmissions
            : true,
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
      <div className='bg-[#F3F3FE] min-h-screen'>
        <div className='flex items-center justify-center h-screen px-4'>
          <motion.div
            className='text-center'
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className='w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3'>
              <Loader2 className='w-6 h-6 animate-spin text-orange-500' />
            </div>
            <div className='text-gray-600 font-medium'>
              Loading form settings...
            </div>
            <div className='text-gray-400 text-sm mt-1'>
              Please wait while we fetch your data
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-gradient-to-br from-[#F3F3FE] via-[#F8F8FF] to-[#F0F0FD] min-h-screen'>
      <motion.div
        className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {/* Header */}
        <motion.div className='my-4 sm:mb-6' variants={cardVariants}>
          <div className='flex items-center mb-3'>
            <motion.div
              className='w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-3 shadow-md'
              whileHover={{ scale: 1.05, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
            </motion.div>
            <div>
              <h1 className='text-xl sm:text-2xl font-bold text-gray-900 tracking-tight'>
                Form Settings
              </h1>
              <p className='text-gray-600 text-sm'>
                Customize form status and properties
              </p>
            </div>
          </div>
        </motion.div>

        <div className='space-y-4 mt-8 sm:space-y-5'>
          {/* Form Title */}
          <motion.div
            className='bg-white/70 backdrop-blur-sm rounded-lg p-4 sm:p-5 shadow-sm border border-gray-100/50 hover:shadow-md transition-all duration-300'
            variants={cardVariants}
            whileHover={{ y: -1 }}
          >
            <div className='mb-3'>
              <Label
                htmlFor='form-title'
                className='text-sm font-semibold text-gray-900 block mb-1'
              >
                Form Title
              </Label>
              <p className='text-xs text-gray-600'>
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
                className={`h-9 text-sm pr-10 transition-all duration-300 border border-gray-300 bg-white  shadow-md hover:shadow-md focus:shadow-md focus:ring-0 focus-visible:ring-0 focus:outline-none rounded-lg ${
                  titleError ? 'border-red-400 bg-red-50/30' : ''
                }`}
                disabled={isSavingTitle}
              />
              {isSavingTitle && (
                <motion.div
                  className='absolute right-3 top-1/2 transform -translate-y-1/2'
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Loader2 className='w-4 h-4 animate-spin text-orange-500' />
                </motion.div>
              )}
            </div>
            {titleError && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                className='text-red-600 text-xs mt-2 flex items-start bg-red-50 p-2 rounded border border-red-200'
              >
                <AlertCircle className='w-3 h-3 mr-1 mt-0.5 flex-shrink-0' />
                <span>{titleError}</span>
              </motion.div>
            )}
          </motion.div>

          {/* Form Status */}
          <motion.div
            className='bg-white/70 backdrop-blur-sm rounded-lg p-4 sm:p-5 shadow-sm border border-gray-100/50 hover:shadow-md transition-all duration-300'
            variants={cardVariants}
            whileHover={{ y: -1 }}
          >
            <div className='mb-3'>
              <Label className='text-sm font-semibold text-gray-900 block mb-1'>
                Form Status
              </Label>
              <p className='text-xs text-gray-600'>
                Enable or disable form submissions
              </p>
            </div>

            <motion.div
              className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                isSavingStatus
                  ? 'border-blue-300 bg-blue-50 cursor-not-allowed'
                  : isFormEnabled
                  ? 'border-green-300 bg-green-50 hover:border-green-400 hover:bg-green-100'
                  : 'border-red-300 bg-red-50 hover:border-red-400 hover:bg-red-100'
              }`}
              onClick={!isSavingStatus ? handleFormStatusToggle : undefined}
              whileHover={!isSavingStatus ? { scale: 1.01 } : {}}
              whileTap={!isSavingStatus ? { scale: 0.99 } : {}}
            >
              <div className='flex items-center'>
                <motion.div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-sm ${
                    isSavingStatus
                      ? 'bg-blue-500'
                      : isFormEnabled
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                  animate={isSavingStatus ? { rotate: 360 } : {}}
                  transition={
                    isSavingStatus
                      ? { duration: 1, repeat: Infinity, ease: 'linear' }
                      : {}
                  }
                >
                  {isSavingStatus ? (
                    <Loader2 className='w-4 h-4 text-white animate-spin' />
                  ) : isFormEnabled ? (
                    <CheckCircle className='w-4 h-4 text-white' />
                  ) : (
                    <XCircle className='w-4 h-4 text-white' />
                  )}
                </motion.div>
                <div>
                  <h3
                    className={`font-semibold text-sm ${
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
                    className={`text-xs mt-0.5 ${
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
                      ? 'Form is visible and accepting submissions'
                      : 'Form is disabled and cannot receive submissions'}
                  </p>
                </div>
              </div>
              {!isSavingStatus && (
                <motion.div className='text-gray-400' whileHover={{ x: 2 }}>
                  <ChevronRight className='w-4 h-4' />
                </motion.div>
              )}
            </motion.div>

            {statusError && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                className='text-red-600 text-xs mt-2 flex items-start bg-red-50 p-2 rounded border border-red-200'
              >
                <AlertCircle className='w-3 h-3 mr-1 mt-0.5 flex-shrink-0' />
                <span>{statusError}</span>
              </motion.div>
            )}
          </motion.div>

          {/* Submission Controls */}
          <motion.div
            className='bg-white/70 backdrop-blur-sm rounded-lg p-4 sm:p-5 shadow-sm border border-gray-100/50 hover:shadow-md transition-all duration-300'
            variants={cardVariants}
            whileHover={{ y: -1 }}
          >
            <div className='mb-4'>
              <Label className='text-sm font-semibold text-gray-900 flex items-center mb-1'>
                <Shield className='w-4 h-4 mr-2 text-orange-500' />
                Submission Controls
              </Label>
              <p className='text-xs text-gray-600'>
                Control how users can submit your form
              </p>
            </div>

            <div className='space-y-3'>
              {/* Allow Multiple Submissions */}
              <motion.div
                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                  allowMultipleSubmissions
                    ? 'border-green-300 bg-green-50 hover:border-green-400'
                    : 'border-orange-300 bg-orange-50 hover:border-orange-400'
                }`}
                onClick={handleMultipleSubmissionsToggle}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
              >
                <div className='flex items-center flex-1'>
                  <motion.div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center mr-3 shadow-sm ${
                      allowMultipleSubmissions
                        ? 'bg-green-500'
                        : 'bg-orange-500'
                    }`}
                    whileHover={{ scale: 1.1 }}
                  >
                    {allowMultipleSubmissions ? (
                      <CheckCircle className='w-3.5 h-3.5 text-white' />
                    ) : (
                      <XCircle className='w-3.5 h-3.5 text-white' />
                    )}
                  </motion.div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='font-medium text-sm text-gray-900 flex items-center gap-2 mb-0.5'>
                      <Users className='w-3.5 h-3.5' />
                      <span>Allow Multiple Submissions</span>
                      <span className='px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded font-medium'>
                        RECOMMENDED
                      </span>
                    </h4>
                    <p className='text-xs text-gray-600 leading-relaxed'>
                      {allowMultipleSubmissions
                        ? 'Users can submit multiple times - maximum flexibility'
                        : 'One submission per device/IP (24h) - may reduce submissions'}
                    </p>
                  </div>
                </div>
                <div
                  className={`text-xs font-mono px-2 py-1 rounded ${
                    allowMultipleSubmissions
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {allowMultipleSubmissions ? 'ON' : 'OFF'}
                </div>
              </motion.div>

              {/* Allow Multiple Email Submissions */}
              <motion.div
                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                  !allowMultipleSubmissions
                    ? 'opacity-50 cursor-not-allowed border-gray-300 bg-gray-100'
                    : allowMultipleEmailSubmissions
                    ? 'border-blue-300 bg-blue-50 hover:border-blue-400'
                    : 'border-orange-300 bg-orange-50 hover:border-orange-400'
                }`}
                onClick={
                  allowMultipleSubmissions
                    ? handleMultipleEmailSubmissionsToggle
                    : undefined
                }
                whileHover={allowMultipleSubmissions ? { scale: 1.005 } : {}}
                whileTap={allowMultipleSubmissions ? { scale: 0.995 } : {}}
              >
                <div className='flex items-center flex-1'>
                  <motion.div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center mr-3 shadow-sm ${
                      !allowMultipleSubmissions
                        ? 'bg-gray-300'
                        : allowMultipleEmailSubmissions
                        ? 'bg-blue-500'
                        : 'bg-orange-500'
                    }`}
                    whileHover={allowMultipleSubmissions ? { scale: 1.1 } : {}}
                  >
                    {allowMultipleEmailSubmissions &&
                    allowMultipleSubmissions ? (
                      <CheckCircle className='w-3.5 h-3.5 text-white' />
                    ) : (
                      <XCircle className='w-3.5 h-3.5 text-white' />
                    )}
                  </motion.div>
                  <div className='flex-1 min-w-0'>
                    <h4 className='font-medium text-sm text-gray-900 flex items-center gap-2 mb-0.5'>
                      <Mail className='w-3.5 h-3.5' />
                      <span className='truncate'>
                        Multiple Submissions per Email
                      </span>
                      {allowMultipleSubmissions && (
                        <span className='px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded font-medium'>
                          FLEXIBLE
                        </span>
                      )}
                    </h4>
                    <p className='text-xs text-gray-600 leading-relaxed'>
                      {!allowMultipleSubmissions
                        ? 'Enable multiple submissions first'
                        : allowMultipleEmailSubmissions
                        ? 'Same email can submit multiple times'
                        : 'Each email limited to one submission (24h)'}
                    </p>
                  </div>
                </div>
                <div
                  className={`text-xs font-mono px-2 py-1 rounded ${
                    !allowMultipleSubmissions
                      ? 'bg-gray-100 text-gray-500'
                      : allowMultipleEmailSubmissions
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {!allowMultipleSubmissions
                    ? 'DISABLED'
                    : allowMultipleEmailSubmissions
                    ? 'ON'
                    : 'OFF'}
                </div>
              </motion.div>

              {/* Status Info */}
              <motion.div
                className={`border rounded-lg p-3 ${
                  allowMultipleSubmissions && allowMultipleEmailSubmissions
                    ? 'bg-green-50 border-green-200'
                    : allowMultipleSubmissions
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-orange-50 border-orange-200'
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className='flex items-start'>
                  <Eye
                    className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${
                      allowMultipleSubmissions && allowMultipleEmailSubmissions
                        ? 'text-green-600'
                        : allowMultipleSubmissions
                        ? 'text-blue-600'
                        : 'text-orange-600'
                    }`}
                  />
                  <div
                    className={`text-xs ${
                      allowMultipleSubmissions && allowMultipleEmailSubmissions
                        ? 'text-green-800'
                        : allowMultipleSubmissions
                        ? 'text-blue-800'
                        : 'text-orange-800'
                    }`}
                  >
                    <p className='font-medium mb-2'>Current Status:</p>
                    <div className='space-y-1.5'>
                      <div className='flex items-center'>
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            allowMultipleSubmissions
                              ? 'bg-green-500'
                              : 'bg-orange-500'
                          }`}
                        ></div>
                        <span className='font-medium'>
                          Multiple Submissions:
                        </span>
                        <span className='ml-1'>
                          {allowMultipleSubmissions ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className='flex items-center'>
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            allowMultipleEmailSubmissions &&
                            allowMultipleSubmissions
                              ? 'bg-green-500'
                              : allowMultipleSubmissions
                              ? 'bg-orange-500'
                              : 'bg-gray-400'
                          }`}
                        ></div>
                        <span className='font-medium'>
                          Same Email Multiple:
                        </span>
                        <span className='ml-1'>
                          {allowMultipleEmailSubmissions &&
                          allowMultipleSubmissions
                            ? 'Enabled'
                            : allowMultipleSubmissions
                            ? 'Disabled'
                            : 'Disabled'}
                        </span>
                      </div>
                      <div className='mt-2 p-2 bg-white bg-opacity-60 rounded border-l-2 border-current'>
                        <p className='font-medium text-xs mb-1'>
                          {!allowMultipleSubmissions
                            ? '🔒 Strict: One per device/IP (24h)'
                            : !allowMultipleEmailSubmissions
                            ? 'Flexible: Multiple submissions, one per email (24h)'
                            : 'Maximum: Unlimited submissions allowed'}
                        </p>
                        <p className='text-xs opacity-75'>
                          {allowMultipleSubmissions &&
                          allowMultipleEmailSubmissions
                            ? 'Best for: General forms, feedback, surveys'
                            : allowMultipleSubmissions
                            ? 'Best for: Registration, newsletter signups'
                            : 'Best for: Voting, contests, limited entries'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Submit Button Text */}
          <motion.div
            className='bg-white/70 backdrop-blur-sm rounded-lg p-4 sm:p-5 shadow-sm border border-gray-100/50 hover:shadow-md transition-all duration-300'
            variants={cardVariants}
            whileHover={{ y: -1 }}
          >
            <div className='mb-3'>
              <Label
                htmlFor='submit-button-text'
                className='text-sm font-semibold text-gray-900 block mb-1'
              >
                Submit Button Text
              </Label>
              <p className='text-xs text-gray-600'>
                Customize the text on your submit button
              </p>
            </div>
            <Input
              id='submit-button-text'
              value={submitButtonText}
              onChange={handleSubmitButtonTextChange}
              placeholder='Submit'
              className='h-9 text-sm border border-gray-300 shadow-md hover:shadow-md focus:shadow-lg focus:ring-0 focus-visible:ring-0 focus:outline-none rounded-lg transition-all duration-300 resize-none bg-white'
            />
          </motion.div>

          {/* Thank You Message */}
          <motion.div
            className='bg-white/70 backdrop-blur-sm rounded-lg p-4 sm:p-5 shadow-sm border border-gray-100/50 hover:shadow-md transition-all duration-300'
            variants={cardVariants}
            whileHover={{ y: -1 }}
          >
            <div className='mb-3'>
              <Label
                htmlFor='thankyou-message'
                className='text-sm font-semibold text-gray-900 block mb-1'
              >
                Thank You Message
              </Label>
              <p className='text-xs text-gray-600'>
                Message shown after form submission
              </p>
            </div>
            <Textarea
              id='thankyou-message'
              value={thankyouMessage}
              onChange={handleThankyouMessageChange}
              placeholder='Thank you for your submission!'
              rows={2}
              className='text-sm border border-gray-300 bg-white shadow-md hover:shadow-md focus:shadow-lg focus:ring-0 focus-visible:ring-0 focus:outline-none rounded-lg transition-all duration-300 resize-none'
            />
          </motion.div>

          {/* Save Status */}
          <motion.div className='text-center py-3' variants={cardVariants}>
            <motion.div
              className='inline-flex items-center px-3 py-1.5 bg-green-50 border border-green-200 rounded-full'
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <CheckCircle className='w-3.5 h-3.5 mr-1.5 text-green-600' />
              <p className='text-xs text-green-700 font-medium'>
                Settings auto-saved
                {isSaving && (
                  <motion.span
                    className='ml-1.5 flex items-center'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    •
                    <Loader2 className='w-3 h-3 animate-spin ml-1' />
                  </motion.span>
                )}
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Spacing */}
        <div className='h-4 sm:h-6'></div>
      </motion.div>
    </div>
  );
}
