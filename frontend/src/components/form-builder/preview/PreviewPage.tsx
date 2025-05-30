/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/form-builder/preview/PreviewPage.tsx
'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import PreviewHeader from './PreviewHeader';
import PreviewForm from './PreviewForm';
import { submitForm } from '@/services/formSubmission';

interface PreviewPageProps {
  formId: string;
}

type DeviceType = 'phone' | 'tablet' | 'desktop';

export default function PreviewPage({ formId }: PreviewPageProps) {
  const form = useSelector((state: RootState) => state.formBuilder.form);

  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('desktop');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!form) {
    return (
      <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading form preview...</p>
        </div>
      </div>
    );
  }

  const shareableLink = `${window.location.origin}/form/${formId}`;

  // Generate comprehensive dummy data for all field types
  const generateDummyData = () => {
    const dummyData: Record<string, any> = {};

    form.pages.forEach(page => {
      page.fields?.forEach(field => {
        // Skip heading fields as they don't collect data
        if (field.type === 'heading') return;

        switch (field.type) {
          case 'fullName':
            dummyData[field.id] = {
              firstName: 'John',
              lastName: 'Doe',
            };
            break;
          case 'email':
            dummyData[field.id] = 'john.doe@example.com';
            break;
          case 'phone':
            dummyData[field.id] = '9876543210';
            break;
          case 'address':
            dummyData[field.id] = {
              street: '123 Main Street',
              city: 'Mumbai',
              state: 'Maharashtra',
              zipCode: '400001',
            };
            break;
          case 'datePicker':
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
            dummyData[field.id] = futureDate.toISOString().split('T')[0];
            break;
          case 'appointment':
            const appointmentDate = new Date();
            appointmentDate.setDate(appointmentDate.getDate() + 7); // 7 days from now
            dummyData[field.id] = {
              date: appointmentDate.toISOString().split('T')[0],
              time: '14:00',
            };
            break;
          case 'signature':
            dummyData[field.id] = 'John Doe Digital Signature';
            break;
          case 'fillBlank':
            dummyData[field.id] = 'terms and conditions';
            break;
          default:
            // For any other field types
            dummyData[field.id] = `Sample ${field.label}`;
        }
      });
    });

    return dummyData;
  };

  const handleFillForm = () => {
    const dummyData = generateDummyData();
    setFormData(dummyData);
    setErrors({}); // Clear any existing errors
    toast.success('Form filled with sample data', {
      description: `Filled ${
        Object.keys(dummyData).length
      } fields with realistic data`,
    });
  };

  // Basic validation function (simplified for preview)
  const validateField = (field: any, value: any): string => {
    if (field.type === 'heading') return '';

    // Required field validation
    if (field.required) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return `${field.label} is required`;
      }

      // Complex field validations
      if (field.type === 'fullName' && typeof value === 'object') {
        if (!value.firstName || !value.lastName) {
          return 'Both first and last name are required';
        }
      }

      if (field.type === 'address' && typeof value === 'object') {
        if (!value.street || !value.city || !value.state) {
          return 'Street address, city, and state are required';
        }
      }

      if (field.type === 'appointment' && typeof value === 'object') {
        if (!value.date || !value.time) {
          return 'Both date and time are required';
        }
      }
    }

    if (!value) return '';

    // Type-specific validation
    switch (field.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
        break;

      case 'phone':
        // Indian phone number validation
        const cleanPhone = value.replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
          return 'Please enter a valid 10-digit Indian phone number';
        }
        break;
    }

    return '';
  };

  const validateCurrentPage = (): boolean => {
    const currentPage = form.pages[currentPageIndex];
    if (!currentPage?.fields) return true;

    const newErrors: Record<string, string> = {};
    let isValid = true;

    currentPage.fields.forEach(field => {
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

  const handleSubmit = async () => {
    // Validate all pages before submission
    let isValid = true;
    const allErrors: Record<string, string> = {};

    form.pages.forEach(page => {
      page.fields?.forEach(field => {
        const value = formData[field.id];
        const error = validateField(field, value);
        if (error) {
          allErrors[field.id] = error;
          isValid = false;
        }
      });
    });

    setErrors(allErrors);

    if (!isValid) {
      toast.error('Please check all pages for required fields and validation errors');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🚀 Submitting form data from preview:', {
        formId,
        dataKeys: Object.keys(formData),
        totalFields: Object.keys(formData).length,
      });

      const result = await submitForm(formId, formData);

      console.log('✅ Form submission successful from preview:', result);

      setIsSubmitted(true);
      setSubmissionId(result.data.submissionId);

      toast.success('Form submitted successfully!', {
        description: result.data.message || 'Your response has been recorded',
      });

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({});
        setCurrentPageIndex(0);
        setErrors({});
      }, 100);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit form', {
        description: 'Please try again in a moment',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeviceChange = (device: DeviceType) => {
    setSelectedDevice(device);
  };

  const getDeviceStyles = () => {
    switch (selectedDevice) {
      case 'phone':
        return {
          width: '375px',
          height: '667px',
          className:
            'mx-auto border-8 border-gray-800 rounded-[2.5rem] bg-white shadow-2xl overflow-hidden',
        };
      case 'tablet':
        return {
          width: '768px',
          height: '1024px',
          className:
            'mx-auto border-4 border-gray-600 rounded-2xl bg-white shadow-2xl overflow-hidden',
        };
      case 'desktop':
      default:
        return {
          width: '100%',
          height: '100%',
          className:
            'w-full h-full bg-white shadow-lg rounded-lg overflow-hidden',
        };
    }
  };

  const deviceStyles = getDeviceStyles();

  // Success state with enhanced animations
  if (isSubmitted) {
    return (
      <div className='min-h-screen bg-gray-100 flex flex-col'>
        <PreviewHeader
          shareableLink={shareableLink}
          onFillForm={handleFillForm}
          selectedDevice={selectedDevice}
          onDeviceChange={handleDeviceChange}
          formId={formId}
        />

        <div className='flex-1 flex items-center justify-center p-8'>
          <div
            className={deviceStyles.className}
            style={{
              width: deviceStyles.width,
              height:
                selectedDevice !== 'desktop' ? deviceStyles.height : 'auto',
              maxHeight:
                selectedDevice !== 'desktop' ? deviceStyles.height : 'none',
            }}
          >
            <div className='p-8 flex items-center justify-center h-full'>
              <motion.div
                className='text-center max-w-md mx-auto'
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className='w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <svg
                    className='w-12 h-12 text-green-500'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </motion.div>

                <motion.h1
                  className='text-3xl font-bold text-gray-900 mb-4'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Thank You!
                </motion.h1>

                <motion.p
                  className='text-gray-600 mb-6'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {form.settings?.thankyouMessage ||
                    'Your submission has been received successfully.'}
                </motion.p>

                {submissionId && (
                  <motion.div
                    className='bg-gray-50 rounded-lg p-4 mb-6'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <p className='text-sm text-gray-600'>Submission ID:</p>
                    <p className='font-mono text-sm text-gray-800'>
                      {submissionId}
                    </p>
                  </motion.div>
                )}

                <motion.div
                  className='space-y-3'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setSubmissionId('');
                      setFormData({});
                      setCurrentPageIndex(0);
                      setErrors({});
                    }}
                    className='w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md transition-colors font-medium'
                  >
                    Submit Another Response
                  </button>

                  <button
                    onClick={() => window.open(shareableLink, '_blank')}
                    className='w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-md transition-colors font-medium'
                  >
                    Open Form in New Tab
                  </button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#F3F3FE] flex flex-col'>
      <PreviewHeader
        shareableLink={shareableLink}
        onFillForm={handleFillForm}
        selectedDevice={selectedDevice}
        onDeviceChange={handleDeviceChange}
        formId={formId}
      />

      <div className='flex-1 flex items-center justify-center p-8'>
        <div
          className={deviceStyles.className}
          style={{
            width: deviceStyles.width,
            height: selectedDevice !== 'desktop' ? deviceStyles.height : 'auto',
            maxHeight:
              selectedDevice !== 'desktop' ? deviceStyles.height : 'none',
          }}
        >
          <div className='h-full overflow-y-auto'>
            <PreviewForm
              form={form}
              formData={formData}
              setFormData={setFormData}
              currentPageIndex={currentPageIndex}
              setCurrentPageIndex={setCurrentPageIndex}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
