// src/app/form/[formId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Form, Field, FieldType } from '@/types/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import SignatureField from '@/components/form-builder/canvas/SignatureField';
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  getPublicForm,
  submitForm,
  prepareFileDataForSubmission,
} from '@/services/formSubmission';
import FileUploadField from '@/components/form-builder/canvas/FileUploadField';

// Beautiful Error Screen Component
const BeautifulErrorScreen = ({
  submitError,
  retryCount,
  onRetry,
  onRefresh,
}: {
  submitError: string;
  retryCount: number;
  onRetry: () => void;
  onRefresh: () => void;
}) => {
  const getErrorConfig = (error: string) => {
    if (error.includes('not found') || error.includes('Not Found')) {
      return {
        icon: '🔍',
        title: 'Form Not Found',
        description:
          'The form you are looking for could not be found or has been removed.',
        color: 'red',
        bgGradient: 'from-red-50 to-pink-50',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        buttonColor: 'bg-red-500 hover:bg-red-600',
      };
    } else if (error.includes('disabled') || error.includes('Disabled')) {
      return {
        icon: '🚫',
        title: 'Form Disabled',
        description:
          'This form has been disabled by its owner and is no longer accepting submissions.',
        color: 'amber',
        bgGradient: 'from-amber-50 to-orange-50',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        buttonColor: 'bg-amber-500 hover:bg-amber-600',
      };
    } else if (
      error.includes('not accepting') ||
      error.includes('Unavailable')
    ) {
      return {
        icon: '⏳',
        title: 'Form Temporarily Unavailable',
        description:
          'This form is temporarily not accepting new submissions. Please try again later.',
        color: 'blue',
        bgGradient: 'from-blue-50 to-indigo-50',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        buttonColor: 'bg-blue-500 hover:bg-blue-600',
      };
    } else if (error.includes('connection') || error.includes('network')) {
      return {
        icon: '📡',
        title: 'Connection Error',
        description:
          'Unable to connect to the server. Please check your internet connection.',
        color: 'purple',
        bgGradient: 'from-purple-50 to-violet-50',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        buttonColor: 'bg-purple-500 hover:bg-purple-600',
      };
    } else {
      return {
        icon: '⚠️',
        title: 'Something Went Wrong',
        description: 'An unexpected error occurred while loading the form.',
        color: 'gray',
        bgGradient: 'from-gray-50 to-slate-50',
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-600',
        buttonColor: 'bg-gray-500 hover:bg-gray-600',
      };
    }
  };

  const config = getErrorConfig(submitError);

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${config.bgGradient} flex items-center justify-center p-4`}
    >
      <motion.div
        className='max-w-md w-full'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className='bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center'>
          {/* Icon */}
          <motion.div
            className={`w-20 h-20 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <span className='text-4xl'>{config.icon}</span>
          </motion.div>

          {/* Title */}
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            {config.title}
          </h1>

          {/* Description */}
          <p className='text-gray-600 mb-8 leading-relaxed'>
            {config.description}
          </p>

          {/* ✅ Error Details (Instant Display - No Animation Delay) */}
          <details className='mb-6 text-left' open>
            <summary className='text-sm text-gray-500 cursor-pointer hover:text-gray-700 mb-2 flex items-center'>
              <span className='mr-2'>📋</span>
              Error Details
            </summary>
            <div className='bg-gray-50 rounded-lg p-3 text-sm text-gray-700 font-mono border border-gray-200 mt-2'>
              {submitError}
            </div>
          </details>

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <Button
              onClick={onRetry}
              className={`${config.buttonColor} text-white flex items-center justify-center px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105 cursor-pointer`}
            >
              <RefreshCw className='w-4 h-4 mr-2' />
              Try Again
            </Button>

            {retryCount >= 2 && (
              <Button
                onClick={onRefresh}
                variant='outline'
                className='px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105 cursor-pointer'
              >
                Refresh Page
              </Button>
            )}
          </div>

          {/* Retry Counter */}
          {retryCount > 0 && (
            <motion.p
              className='text-gray-500 text-sm mt-4'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Retry attempt: {retryCount}
            </motion.p>
          )}
        </div>

        {/* Decorative Elements */}
        <div className='flex justify-center mt-6 space-x-2'>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 ${config.iconBg} rounded-full`}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// Form submission handler with beautiful toast messages
const handleFormSubmissionWithToasts = async (
  formId: string,
  formData: any,
  fileData: any,
  formTitle?: string
) => {
  try {
    const result = await submitForm(formId, formData, fileData, formTitle);

    // Beautiful success toast
    toast.success('Submission Successful! 🎉', {
      description: formTitle
        ? `Thank you for submitting "${formTitle}". We'll be in touch soon.`
        : 'Your submission has been received successfully. Thank you!',
      duration: 5000,
      style: {
        background: '#D1FAE5',
        borderColor: '#10B981',
        color: '#047857',
      },
    });

    return result;
  } catch (error: any) {
    console.error('Form submission error:', error);

    if (error.type === 'warning') {
      // This will show the "already submitted" warning
      toast.warning(error.title || 'Warning', {
        description: error.message,
        duration: error.duration || 6000,
        style: error.style || {
          background: '#FEF3C7',
          borderColor: '#F59E0B',
          color: '#92400E',
        },
        action: error.action
          ? {
              label: error.action.label,
              onClick: error.action.onClick,
            }
          : undefined,
      });
    } else {
      toast.error(error.title || 'Submission Failed', {
        description: error.message,
        duration: error.duration || 5000,
        action: error.action
          ? {
              label: error.action.label,
              onClick: error.action.onClick,
            }
          : undefined,
      });
    }

    throw error;
  }
};

export default function PublicFormPage() {
  const params = useParams();
  const formId = params.formId as string;

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [fileData, setFileData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadForm();
  }, [formId]);

  const loadForm = async () => {
    try {
      setLoading(true);
      setSubmitError('');
      const response = await getPublicForm(formId);
      setForm(response.data);
    } catch (error: any) {
      setSubmitError(error.message);

      const shouldShowToast =
        error.status === 429 &&
        (error.message?.toLowerCase().includes('already submitted') ||
          error.message?.toLowerCase().includes('duplicate submission'));

      if (shouldShowToast && error.type === 'warning') {
        toast.warning(error.title || 'Warning', {
          description: error.message,
          duration: error.duration || 6000,
          style: error.style || {
            background: '#FEF3C7',
            borderColor: '#F59E0B',
            color: '#92400E',
          },
        });
      }

      console.log('Form loading error:', error.title, error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: Field, value: any, files?: any): string => {
    if (field.type === FieldType.HEADING) {
      return '';
    }

    if (field.required) {
      // For file/image fields, check if files were uploaded
      if (
        field.type === FieldType.FILE_UPLOAD ||
        field.type === FieldType.IMAGE
      ) {
        const hasFiles =
          files && (Array.isArray(files) ? files.length > 0 : !!files);
        if (!hasFiles) {
          return `${field.label} is required`;
        }
      } else {
        // For other fields, check regular value
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return `${field.label} is required`;
        }

        if (field.type === FieldType.FULL_NAME) {
          if (typeof value === 'object') {
            if (!value.firstName || !value.lastName) {
              return 'Both first and last name are required';
            }
          } else if (typeof value === 'string' && value.trim().length < 2) {
            return 'Full name must be at least 2 characters';
          }
        }

        if (field.type === FieldType.ADDRESS) {
          if (typeof value === 'object') {
            if (!value.street || !value.city || !value.state) {
              return 'Street address, city, and state are required';
            }
          }
        }

        if (field.type === FieldType.APPOINTMENT) {
          if (typeof value === 'object') {
            if (!value.date || !value.time) {
              return 'Both date and time are required';
            }
          }
        }
      }
    }

    if (value && field.type === FieldType.EMAIL) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    if (value && field.type === FieldType.PHONE) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(value.replace(/\s/g, ''))) {
        return 'Please enter a valid phone number';
      }
    }

    // File validation
    if (
      (field.type === FieldType.FILE_UPLOAD ||
        field.type === FieldType.IMAGE) &&
      files
    ) {
      const fileArray = Array.isArray(files) ? files : [files];

      // Check multiple files constraint
      if (!field.multiple && fileArray.length > 1) {
        return `${field.label} only allows one file`;
      }

      // Check file types for image fields
      if (field.type === FieldType.IMAGE) {
        for (const file of fileArray) {
          if (!file.mimeType?.startsWith('image/')) {
            return `${field.label} only accepts image files`;
          }
          if (file.size > 10 * 1024 * 1024) {
            // 10MB
            return `Image files must be smaller than 10MB`;
          }
        }
      }

      // Check accept attribute
      if (field.accept && field.accept !== '*/*') {
        const allowedTypes = field.accept
          .split(',')
          .map((type: string) => type.trim());
        for (const file of fileArray) {
          const isTypeAllowed = allowedTypes.some((type: string) => {
            if (type.startsWith('.')) {
              return file.originalName
                ?.toLowerCase()
                .endsWith(type.toLowerCase());
            } else if (type.endsWith('/*')) {
              const baseType = type.slice(0, -2);
              return file.mimeType?.startsWith(baseType);
            } else {
              return file.mimeType === type;
            }
          });

          if (!isTypeAllowed) {
            return `File "${file.originalName}" is not an allowed file type`;
          }
        }
      }

      // Check file size for general files
      if (field.type === FieldType.FILE_UPLOAD) {
        for (const file of fileArray) {
          if (file.size > 25 * 1024 * 1024) {
            // 25MB
            return `Files must be smaller than 25MB`;
          }
        }
      }
    }

    return '';
  };

  const validateCurrentPage = (): boolean => {
    if (!form) return false;

    const currentPage = form.pages[currentPageIndex];
    if (!currentPage?.fields) return true;

    const newErrors: Record<string, string> = {};
    let isValid = true;

    currentPage.fields?.forEach(field => {
      const value = formData[field.id];
      const files = fileData[field.id];
      const error = validateField(field, value, files);

      if (error) {
        newErrors[field.id] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value,
    }));

    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: '',
      }));
    }
  };

  // Handle file upload changes
  const handleFileChange = (fieldId: string, value: any) => {
    setFileData(prev => ({
      ...prev,
      [fieldId]: value,
    }));

    // Clear error when user uploads file
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: '',
      }));
    }
  };

  const handleNext = () => {
    if (validateCurrentPage()) {
      setCurrentPageIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Scroll to first error
      const firstErrorField = document.querySelector('.border-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      toast.error('Please fix the errors above', {
        description: 'Some required fields are missing or invalid.',
        duration: 4000,
      });
    }
  };

  const handleBack = () => {
    setCurrentPageIndex(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateCurrentPage()) {
      const firstErrorField = document.querySelector('.border-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      toast.error('Please fix the errors above', {
        description: 'Some required fields are missing or invalid.',
        duration: 4000,
        style: {
          background: '#FEE2E2',
          borderColor: '#EF4444',
          color: '#991B1B',
        },
      });
      return;
    }

    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Prepare file data for submission
      const preparedFileData = prepareFileDataForSubmission(fileData);

      console.log('🚀 Public form submitting with files:', {
        formData,
        fileData: preparedFileData,
        totalFiles: Object.values(preparedFileData).reduce(
          (total: number, files: any) => {
            if (Array.isArray(files)) return total + files.length;
            return total + (files ? 1 : 0);
          },
          0
        ),
      });

      // Submit form with both regular data and file data
      await handleFormSubmissionWithToasts(
        formId,
        formData,
        preparedFileData,
        form?.title
      );

      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setRetryCount(0);
    } catch (error: any) {
      setSubmitError(error.message);

      if (error.status === 403) {
        console.log('Form access denied - user notified via toast');
      } else if (error.status === 429) {
        console.log('Duplicate submission - user notified via toast');
      } else if (error.message?.includes('Network error')) {
        setRetryCount(prev => prev + 1);
      }

      // Scroll to top to show any additional error messages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    if (
      submitError.includes('Network error') ||
      submitError.includes('timeout')
    ) {
      loadForm();
    } else {
      setSubmitError('');
    }
  };

  const renderField = (field: Field) => {
    const value = formData[field.id] || '';
    const files = fileData[field.id];
    const error = errors[field.id];

    const fieldWrapper = (content: React.ReactNode) => (
      <motion.div
        key={field.id}
        className='mb-6'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {content}
        {error && (
          <motion.div
            className='flex items-center mt-2 text-red-600 text-sm'
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle className='w-4 h-4 mr-1' />
            {error}
          </motion.div>
        )}
      </motion.div>
    );

    switch (field.type) {
      case FieldType.HEADING:
        return fieldWrapper(
          <div className='py-2'>
            <h2 className='text-2xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3'>
              {field.label}
            </h2>
          </div>
        );

      case FieldType.SHORT_TEXT:
        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              placeholder={field.placeholder || 'Enter your answer'}
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full transition-all duration-200 ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500 focus:ring-2 bg-red-50'
                  : 'focus:border-blue-500 focus:ring-blue-500 focus:ring-2 hover:border-gray-400'
              }`}
              maxLength={field.maxLength}
            />
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
            {field.maxLength && (
              <div className='text-xs text-gray-400 mt-1'>
                {value.length}/{field.maxLength} characters
              </div>
            )}
          </div>
        );

      case FieldType.LONG_TEXT:
        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <textarea
              placeholder={
                field.placeholder || 'Enter your detailed response...'
              }
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              rows={field.rows || 3}
              maxLength={field.maxLength}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 resize-none ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
              }`}
            />
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
            {field.maxLength && (
              <div className='text-xs text-gray-400 mt-1'>
                {value.length}/{field.maxLength} characters
              </div>
            )}
          </div>
        );

      case FieldType.PARAGRAPH:
        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <textarea
              placeholder={
                field.placeholder ||
                'Share your thoughts, feedback, or detailed information...'
              }
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              rows={field.rows || 5}
              maxLength={field.maxLength}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 resize-none ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
              }`}
            />
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
            {field.maxLength && (
              <div className='text-xs text-gray-400 mt-1'>
                {value.length}/{field.maxLength} characters
              </div>
            )}
          </div>
        );

      case FieldType.NUMBER:
        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              type='number'
              placeholder={field.placeholder || 'Enter a number'}
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              min={field.min}
              max={field.max}
              step={field.step || 1}
              className={`w-full ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                  : 'focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
              }`}
            />
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
            {(field.min !== undefined || field.max !== undefined) && (
              <div className='text-xs text-gray-400 mt-1'>
                {field.min !== undefined && field.max !== undefined
                  ? `Range: ${field.min} - ${field.max}`
                  : field.min !== undefined
                  ? `Minimum: ${field.min}`
                  : `Maximum: ${field.max}`}
              </div>
            )}
          </div>
        );

      case FieldType.EMAIL:
        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              type='email'
              placeholder={field.placeholder || 'your.email@example.com'}
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full transition-all duration-200 ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500 focus:ring-2 bg-red-50'
                  : 'focus:border-blue-500 focus:ring-blue-500 focus:ring-2 hover:border-gray-400'
              }`}
              autoComplete='email'
            />
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.PHONE:
        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              type='tel'
              placeholder={field.placeholder || '9876543210'}
              value={value}
              onChange={e => {
                const input = e.target.value;
                const digitsOnly = input.replace(/\D/g, '');
                const limitedDigits = digitsOnly.slice(0, 10);
                handleInputChange(field.id, limitedDigits);
              }}
              maxLength={10}
              className={`w-full ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                  : 'focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
              }`}
            />
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.TIME:
        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              type='time'
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                  : 'focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
              }`}
            />
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.DROPDOWN:
        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <select
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-white ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
              }`}
            >
              <option value=''>Select an option...</option>
              {(field.options || []).map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.SINGLE_CHOICE:
        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='space-y-2'>
              {(field.options || []).map((option, index) => (
                <label
                  key={index}
                  className='flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded'
                >
                  <input
                    type='radio'
                    name={field.id}
                    value={option.value}
                    checked={value === option.value}
                    onChange={e => handleInputChange(field.id, e.target.value)}
                    className='text-blue-500 focus:ring-blue-500'
                  />
                  <span className='text-gray-700'>{option.label}</span>
                </label>
              ))}
            </div>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.MULTIPLE_CHOICE:
        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='space-y-2'>
              {(field.options || []).map((option, index) => (
                <label
                  key={index}
                  className='flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded'
                >
                  <input
                    type='checkbox'
                    value={option.value}
                    checked={
                      Array.isArray(value) && value.includes(option.value)
                    }
                    onChange={e => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        handleInputChange(field.id, [
                          ...currentValues,
                          option.value,
                        ]);
                      } else {
                        handleInputChange(
                          field.id,
                          currentValues.filter(v => v !== option.value)
                        );
                      }
                    }}
                    className='text-blue-500 focus:ring-blue-500'
                  />
                  <span className='text-gray-700'>{option.label}</span>
                </label>
              ))}
            </div>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.DATE_PICKER:
        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              type='date'
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                  : 'focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
              }`}
            />
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.FULL_NAME:
        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-3 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Input
                  // placeholder='First Name'
                  value={value.firstName || ''}
                  onChange={e =>
                    handleInputChange(field.id, {
                      ...value,
                      firstName: e.target.value,
                    })
                  }
                  className={`w-full ${
                    error
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                      : 'focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                />
              </div>
              <div>
                <Input
                  placeholder='Last Name'
                  value={value.lastName || ''}
                  onChange={e =>
                    handleInputChange(field.id, {
                      ...value,
                      lastName: e.target.value,
                    })
                  }
                  className={`w-full ${
                    error
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                      : 'focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                />
              </div>
            </div>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.ADDRESS:
        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='space-y-3'>
              <Input
                placeholder='Street Address'
                value={value.street || ''}
                onChange={e =>
                  handleInputChange(field.id, {
                    ...value,
                    street: e.target.value,
                  })
                }
                className={`w-full ${
                  error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                    : 'focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
                }`}
              />
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <Input
                  placeholder='City'
                  value={value.city || ''}
                  onChange={e =>
                    handleInputChange(field.id, {
                      ...value,
                      city: e.target.value,
                    })
                  }
                  className={`w-full ${
                    error
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                      : 'focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                />
                <Input
                  placeholder='State/Province'
                  value={value.state || ''}
                  onChange={e =>
                    handleInputChange(field.id, {
                      ...value,
                      state: e.target.value,
                    })
                  }
                  className={`w-full ${
                    error
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                      : 'focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                />
              </div>
              <Input
                placeholder='ZIP/Postal Code (Optional)'
                value={value.zipCode || ''}
                onChange={e =>
                  handleInputChange(field.id, {
                    ...value,
                    zipCode: e.target.value,
                  })
                }
                className='w-full focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
              />
            </div>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.APPOINTMENT:
        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <div>
                <Input
                  type='date'
                  value={value.date || ''}
                  onChange={e =>
                    handleInputChange(field.id, {
                      ...value,
                      date: e.target.value,
                    })
                  }
                  className={`w-full ${
                    error
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                      : 'focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                />
                <span className='text-sm text-gray-500 mt-1'>Date</span>
              </div>
              <div>
                <Input
                  type='time'
                  value={value.time || ''}
                  onChange={e =>
                    handleInputChange(field.id, {
                      ...value,
                      time: e.target.value,
                    })
                  }
                  className={`w-full ${
                    error
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                      : 'focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
                  }`}
                />
                <span className='text-sm text-gray-500 mt-1'>Time</span>
              </div>
            </div>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div className='border rounded-md p-4 bg-gray-50'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {[
                  'Product A - $19.99',
                  'Product B - $29.99',
                  'Product C - $39.99',
                ].map((product, index) => (
                  <label
                    key={index}
                    className='flex items-center space-x-2 cursor-pointer bg-white p-3 rounded border hover:bg-gray-50'
                  >
                    <input
                      type='checkbox'
                      value={product}
                      checked={Array.isArray(value) && value.includes(product)}
                      onChange={e => {
                        const currentValues = Array.isArray(value) ? value : [];
                        if (e.target.checked) {
                          handleInputChange(field.id, [
                            ...currentValues,
                            product,
                          ]);
                        } else {
                          handleInputChange(
                            field.id,
                            currentValues.filter(v => v !== product)
                          );
                        }
                      }}
                      className='text-blue-500 focus:ring-blue-500'
                    />
                    <span className='text-sm'>{product}</span>
                  </label>
                ))}
              </div>
            </div>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.SIGNATURE:
        return fieldWrapper(
          <SignatureField
            fieldId={field.id}
            label={field.label}
            required={field.required}
            helpText={field.helpText}
            value={value}
            onChange={value => handleInputChange(field.id, value)}
            error={error}
            readOnly={false}
          />
        );

      case FieldType.FILL_BLANK: {
        // ✅ USE ACTUAL FIELD CONFIGURATION from builder
        const beforeText =
          field.fillBlankTemplate?.beforeText || 'I agree to the';
        const blankPlaceholder =
          field.fillBlankTemplate?.blankPlaceholder || 'terms';
        const afterText =
          field.fillBlankTemplate?.afterText || 'and conditions.';

        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>

            {/* ✅ PUBLIC FORM: Show the configured template with interactive blank */}
            <div className='border border-gray-300 rounded-lg p-4 bg-gray-50'>
              <div className='flex flex-wrap items-center gap-2 text-gray-700 mb-3'>
                <span className='text-base'>{beforeText}</span>
                <input
                  type='text'
                  placeholder={blankPlaceholder}
                  value={value || ''}
                  onChange={e => handleInputChange(field.id, e.target.value)}
                  className={`px-3 py-2 border-b-2 border-blue-500 bg-blue-50 text-blue-700 min-w-[120px] focus:outline-none focus:bg-white focus:border-blue-600 text-center transition-all duration-200 ${
                    error ? 'border-red-500 bg-red-50 focus:border-red-500' : ''
                  }`}
                />
                <span className='text-base'>{afterText}</span>
              </div>

              {/* ✅ Show what user typed */}
              {value && (
                <div className='text-sm text-green-600 mt-2'>
                  ✓ Your answer: &quot;{value}&quot;
                </div>
              )}
            </div>

            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );
      }

      case FieldType.PRODUCT_LIST: {
        // ✅ USE ACTUAL PRODUCT CONFIGURATION from builder
        const products = field.productListConfig?.products || [
          { id: '1', name: 'Sample Product', price: 19.99, quantity: 1 },
        ];

        // Initialize value as object if not already
        const currentSelections = value || {};

        const handleProductQuantityChange = (
          productId: string,
          quantity: number
        ) => {
          const updatedSelections = { ...currentSelections };
          if (quantity > 0) {
            updatedSelections[productId] = quantity;
          } else {
            delete updatedSelections[productId];
          }
          handleInputChange(field.id, updatedSelections);
        };

        // Calculate total
        const calculateTotal = () => {
          return products.reduce((total, product) => {
            const quantity = currentSelections[product.id] || 0;
            return total + product.price * quantity;
          }, 0);
        };

        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>

            {/* ✅ PUBLIC FORM: Show configured products with quantity selectors */}
            <div className='border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm'>
              {/* Header */}
              <div className='bg-gray-100 p-3 border-b border-gray-300'>
                <div className='grid grid-cols-12 gap-2 font-medium text-gray-700 text-sm'>
                  <div className='col-span-6'>Product</div>
                  <div className='col-span-3 text-center'>Price</div>
                  <div className='col-span-3 text-center'>Quantity</div>
                </div>
              </div>

              {/* ✅ Product List from Builder Configuration */}
              <div className='divide-y divide-gray-200'>
                {products.map(product => (
                  <div
                    key={product.id}
                    className='p-3 hover:bg-gray-50 transition-colors'
                  >
                    <div className='grid grid-cols-12 gap-2 items-center'>
                      <div className='col-span-6'>
                        <div className='text-gray-900 font-medium'>
                          {product.name}
                        </div>
                      </div>
                      <div className='col-span-3 text-center text-gray-700 font-semibold'>
                        ${product.price.toFixed(2)}
                      </div>
                      <div className='col-span-3 text-center'>
                        <input
                          type='number'
                          min='0'
                          max='99'
                          value={currentSelections[product.id] || 0}
                          onChange={e =>
                            handleProductQuantityChange(
                              product.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className={`w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 transition-all duration-200 ${
                            error
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                              : 'focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ✅ Total Section */}
              <div className='bg-gray-50 p-3 border-t border-gray-300'>
                <div className='flex justify-between items-center'>
                  <span className='font-medium text-gray-700'>Total:</span>
                  <span className='font-bold text-xl text-green-600'>
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>

                {/* ✅ Show selected items summary */}
                {Object.keys(currentSelections).length > 0 && (
                  <div className='mt-3 p-3 bg-white rounded border border-gray-200'>
                    <div className='text-sm font-medium text-gray-600 mb-2'>
                      Selected Items:
                    </div>
                    <div className='space-y-1'>
                      {Object.keys(currentSelections).map(productId => {
                        const product = products.find(p => p.id === productId);
                        const quantity = currentSelections[productId];
                        return quantity > 0 && product ? (
                          <div
                            key={productId}
                            className='flex justify-between text-sm'
                          >
                            <span className='text-gray-700'>
                              {product.name}{' '}
                              <span className='text-gray-500'>
                                (×{quantity})
                              </span>
                            </span>
                            <span className='font-medium text-gray-900'>
                              ${(product.price * quantity).toFixed(2)}
                            </span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* ✅ Show empty state */}
                {Object.keys(currentSelections).length === 0 && (
                  <div className='text-sm text-gray-500 mt-2'>
                    Select quantities above to see your order total
                  </div>
                )}
              </div>
            </div>

            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );
      }

      case FieldType.IMAGE:
        return fieldWrapper(
          <FileUploadField
            fieldId={field.id}
            formId={formId}
            label={field.label}
            required={field.required}
            helpText={field.helpText}
            accept={field.accept || 'image/*'}
            multiple={field.multiple || false}
            fieldType='image'
            value={files}
            onChange={value => handleFileChange(field.id, value)}
            error={error}
          />
        );

      case FieldType.FILE_UPLOAD:
        return fieldWrapper(
          <FileUploadField
            fieldId={field.id}
            formId={formId}
            label={field.label}
            required={field.required}
            helpText={field.helpText}
            accept={field.accept || '*/*'}
            multiple={field.multiple || false}
            fieldType='fileUpload'
            value={files}
            onChange={value => handleFileChange(field.id, value)}
            error={error}
          />
        );

      default:
        console.warn(`⚠️ Unknown field type: ${field.type}`);
        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              placeholder={field.placeholder || field.label}
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                  : 'focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400'
              }`}
            />
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4 text-blue-500' />
          <p className='text-gray-600'>Loading form...</p>
          {retryCount > 0 && (
            <p className='text-gray-500 text-sm mt-2'>
              Attempt {retryCount + 1}...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (!form || submitError) {
    return (
      <BeautifulErrorScreen
        submitError={
          submitError ||
          'This form may have been deleted or is no longer available.'
        }
        retryCount={retryCount}
        onRetry={handleRetry}
        onRefresh={() => window.location.reload()}
      />
    );
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <motion.div
          className='max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center'
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <CheckCircle className='w-10 h-10 text-green-500' />
          </motion.div>

          <h1 className='text-3xl font-bold text-gray-900 mb-4'>Thank You!</h1>
          <p className='text-gray-600 mb-8'>
            {form.settings?.thankyouMessage ||
              'Your submission has been received successfully.'}
          </p>

          <div className='bg-gray-50 rounded-lg p-4 mb-6'>
            <p className='text-sm text-gray-600 mb-3'>
              Create your own forms like this one - It&apos;s free!
            </p>
            <Button
              className='bg-green-500 hover:bg-green-600 text-white w-full cursor-pointer'
              onClick={() => window.open('/', '_blank')}
            >
              <ExternalLink className='w-4 h-4 mr-2' />
              Try FormIQ
            </Button>
          </div>

          <Button
            variant='outline'
            onClick={() => {
              setIsSubmitted(false);
              setCurrentPageIndex(0);
              setFormData({});
              setFileData({});
              setErrors({});
              setSubmitError('');
            }}
            className='w-full cursor-pointer'
          >
            Submit Another Response
          </Button>
        </motion.div>
      </div>
    );
  }

  const currentPage = form.pages[currentPageIndex];
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === form.pages.length - 1;
  const totalPages = form.pages.length;

  return (
    <div className='min-h-screen bg-[#F3F3FE]'>
      <div className='max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        {/* Logo */}

        {form.logo && form.logo.src && (
          <motion.div
            className='mb-8 w-full'
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className={`flex w-full ${
                form.logo.alignment === 'LEFT'
                  ? 'justify-start'
                  : form.logo.alignment === 'RIGHT'
                  ? 'justify-end'
                  : 'justify-center'
              }`}
              style={{
                minHeight: '80px',
                padding: '8px 0',
              }}
            >
              <div
                style={{
                  width:
                    form.logo.size >= 100
                      ? '100%'
                      : `${Math.max(5, form.logo.size || 50)}%`,
                  minHeight: '60px',
                }}
              >
                <img
                  src={form.logo.src}
                  alt='Form Logo'
                  width='auto'
                  height='auto'
                  style={{
                    maxWidth: '100%',
                    maxHeight:
                      form.logo.size >= 100
                        ? '300px'
                        : form.logo.size > 90
                        ? '220px'
                        : form.logo.size > 70
                        ? '180px'
                        : form.logo.size > 50
                        ? '150px'
                        : '120px',
                    objectFit: 'contain',
                    transition: 'all 0.3s ease',
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Form Container */}
        <motion.div
          className='bg-white rounded-sm shadow-lg overflow-hidden'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Progress Bar */}
          {totalPages > 1 && (
            <div className='bg-gray-200 h-2'>
              <motion.div
                className='bg-blue-500 h-2 transition-all duration-300'
                initial={{ width: 0 }}
                animate={{
                  width: `${((currentPageIndex + 1) / totalPages) * 100}%`,
                }}
              />
            </div>
          )}

          <div className='p-6 sm:p-8 lg:p-12'>
            {/* Form Header */}
            <div className='mb-8'>
              <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-4'>
                {form.title}
              </h1>
              {form.description && (
                <p className='text-gray-600 text-lg leading-relaxed'>
                  {form.description}
                </p>
              )}

              {/* Page indicator */}
              {totalPages > 1 && (
                <div className='mt-4 text-sm text-gray-500'>
                  Page {currentPageIndex + 1} of {totalPages}
                </div>
              )}
            </div>

            {/* Form Fields */}
            <AnimatePresence mode='wait'>
              <motion.div
                key={currentPageIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className='space-y-6 mb-8'>
                  {currentPage?.fields?.map(field => renderField(field))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className='flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200'>
              <div className='flex items-center'>
                {!isFirstPage && (
                  <Button
                    onClick={handleBack}
                    variant='outline'
                    className='px-6 py-2 cursor-pointer'
                  >
                    ← Back
                  </Button>
                )}
              </div>

              <div className='flex items-center gap-4'>
                {!isLastPage ? (
                  <Button
                    onClick={handleNext}
                    className='px-8 py-2 bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                    size='lg'
                  >
                    Next →
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className='px-8 py-2 bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                    size='lg'
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Submitting...
                      </>
                    ) : (
                      form.settings?.submitButtonText || 'Submit'
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Page Dots Indicator */}
            {totalPages > 1 && (
              <div className='flex justify-center items-center mt-8 space-x-2'>
                {form.pages.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentPageIndex
                        ? 'bg-blue-500 scale-125'
                        : index < currentPageIndex
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                    initial={{ scale: 0.8 }}
                    animate={{
                      scale: index === currentPageIndex ? 1.25 : 1,
                      backgroundColor:
                        index === currentPageIndex
                          ? '#3B82F6'
                          : index < currentPageIndex
                          ? '#10B981'
                          : '#D1D5DB',
                    }}
                    transition={{ duration: 0.2 }}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className='text-center mt-8'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className='inline-flex items-center bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg'>
            <span className='text-sm font-medium mr-3'>
              ⚡ Powered by FormIQ
            </span>
            <Button
              size='sm'
              className='bg-green-500 hover:bg-green-600 text-white text-xs cursor-pointer'
              onClick={() => window.open('/', '_blank')}
            >
              Create your own
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
