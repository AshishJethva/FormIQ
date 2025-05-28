// src/app/form/[formId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Form, Field, FieldType } from '@/types/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { getPublicForm, submitForm } from '@/services/formSubmission';

export default function PublicFormPage() {
  const params = useParams();
  const formId = params.formId as string;

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
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
      console.error('❌ Error loading form:', error);
      setSubmitError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: Field, value: any): string => {
    if (field.type === FieldType.HEADING) {
      return '';
    }

    if (field.required) {
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
      const error = validateField(field, value);

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
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await submitForm(formId, formData);

      setIsSubmitted(true);
      toast.success(result.data.message || 'Form submitted successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Reset retry count on success
      setRetryCount(0);
    } catch (error: any) {
      console.error('❌ Submission error:', error);
      setSubmitError(error.message);

      // Show user-friendly error message
      if (error.message.includes('Please check your form inputs:')) {
        toast.error('Please fix the form errors and try again');
      } else {
        toast.error(error.message);
      }

      // Scroll to top to show error message
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
      loadForm(); // Reload form if network error
    } else {
      setSubmitError('');
    }
  };

  const renderField = (field: Field) => {
    const value = formData[field.id] || '';
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
                  placeholder='First Name'
                  value={value.firstName || ''}
                  onChange={e =>
                    handleInputChange(field.id, {
                      ...value,
                      firstName: e.target.value,
                    })
                  }
                  className={`w-full ${
                    error
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                <span className='text-sm text-gray-500 mt-1'>First Name</span>
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
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                <span className='text-sm text-gray-500 mt-1'>Last Name</span>
              </div>
            </div>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
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
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'focus:border-blue-500 focus:ring-blue-500'
              }`}
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
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
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
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'focus:border-blue-500 focus:ring-blue-500'
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
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'focus:border-blue-500 focus:ring-blue-500'
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
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'focus:border-blue-500 focus:ring-blue-500'
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
                className='w-full focus:border-blue-500 focus:ring-blue-500'
              />
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
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
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
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'focus:border-blue-500 focus:ring-blue-500'
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
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'focus:border-blue-500 focus:ring-blue-500'
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

      case FieldType.SIGNATURE:
        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <div
              className={`h-32 border-2 border-dashed rounded-md bg-gray-50 flex items-center justify-center text-gray-500 cursor-pointer hover:border-gray-400 transition-colors ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              onClick={() => handleInputChange(field.id, 'Signature added')}
            >
              {value ? (
                <span className='text-gray-700 font-medium'>
                  ✓ Signature added
                </span>
              ) : (
                <span>Click to add signature</span>
              )}
            </div>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      case FieldType.FILL_BLANK:
        return fieldWrapper(
          <div>
            <div className='flex items-center flex-wrap gap-2 text-gray-700'>
              <span>I agree to the</span>
              <Input
                className={`w-32 inline-block ${
                  error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder='terms'
                value={value}
                onChange={e => handleInputChange(field.id, e.target.value)}
              />
              <span>and conditions.</span>
            </div>
            {field.helpText && (
              <div className='text-sm text-gray-500 mt-2'>{field.helpText}</div>
            )}
          </div>
        );

      default:
        return fieldWrapper(
          <div>
            <label className='block text-gray-700 mb-2 font-medium'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            <Input
              placeholder={field.label}
              value={value}
              onChange={e => handleInputChange(field.id, e.target.value)}
              className={`w-full ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'focus:border-blue-500 focus:ring-blue-500'
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
      <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
        <div className='text-center max-w-md'>
          <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Form Unavailable
          </h1>

          <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
            <p className='text-red-800 text-sm'>
              {submitError ||
                'This form may have been deleted or is no longer available.'}
            </p>
          </div>

          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <Button
              onClick={handleRetry}
              className='bg-blue-500 hover:bg-blue-600 flex items-center'
            >
              <RefreshCw className='w-4 h-4 mr-2' />
              Try Again
            </Button>

            {retryCount >= 2 && (
              <Button
                onClick={() => window.location.reload()}
                variant='outline'
              >
                Refresh Page
              </Button>
            )}
          </div>

          {retryCount > 0 && (
            <p className='text-gray-500 text-sm mt-4'>
              Retry attempt: {retryCount}
            </p>
          )}
        </div>
      </div>
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
              className='bg-green-500 hover:bg-green-600 text-white w-full'
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
              setErrors({});
              setSubmitError('');
            }}
            className='w-full'
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
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        {/* Logo */}
        {form.logo && form.logo.src && (
          <motion.div
            className={`text-center mb-8 ${
              form.logo.alignment === 'LEFT'
                ? 'text-left'
                : form.logo.alignment === 'RIGHT'
                ? 'text-right'
                : 'text-center'
            }`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={form.logo.src}
              alt='Form Logo'
              className='object-contain'
              style={{
                maxHeight: '120px',
                width: `${form.logo.size || 50}%`,
                maxWidth: '400px',
                margin:
                  form.logo.alignment === 'CENTER'
                    ? '0 auto'
                    : form.logo.alignment === 'RIGHT'
                    ? '0 0 0 auto'
                    : '0 auto 0 0',
              }}
            />
          </motion.div>
        )}

        {/* Form Container */}
        <motion.div
          className='bg-white rounded-xl shadow-lg overflow-hidden'
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
                    className='px-6 py-2'
                  >
                    ← Back
                  </Button>
                )}
              </div>

              <div className='flex items-center gap-4'>
                {!isLastPage ? (
                  <Button
                    onClick={handleNext}
                    className='px-8 py-2 bg-blue-500 hover:bg-blue-600 text-white'
                    size='lg'
                  >
                    Next →
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className='px-8 py-2 bg-green-500 hover:bg-green-600 text-white'
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
              className='bg-green-500 hover:bg-green-600 text-white text-xs'
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
