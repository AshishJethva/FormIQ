// src/components/form-builder/preview/PreviewPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';
import {
  Link,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import PreviewHeader from './PreviewHeader';
import PreviewForm from './PreviewForm';
import ThankYouPage from '../canvas/ThankYouPage';

interface PreviewPageProps {
  formId: string;
}

type DeviceType = 'phone' | 'tablet' | 'desktop';

export default function PreviewPage({ formId }: PreviewPageProps) {
  const router = useRouter();
  const form = useSelector((state: RootState) => state.formBuilder.form);

  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('desktop');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!form) {
    return <div>Loading...</div>;
  }

  const shareableLink = `${window.location.origin}/form/${formId}`;

  const handleFillForm = () => {
    // Fill form with dummy data
    const dummyData: Record<string, any> = {};

    form.pages.forEach(page => {
      page.fields?.forEach(field => {
        switch (field.type) {
          case 'fullName':
            dummyData[field.id] = 'John Doe';
            break;
          case 'email':
            dummyData[field.id] = 'john.doe@example.com';
            break;
          case 'phone':
            dummyData[field.id] = '+1 (555) 123-4567';
            break;
          case 'address':
            dummyData[field.id] = '123 Main Street, City, State 12345';
            break;
          case 'datePicker':
            dummyData[field.id] = new Date().toISOString().split('T')[0];
            break;
          case 'appointment':
            dummyData[field.id] = {
              date: new Date().toISOString().split('T')[0],
              time: '14:00',
            };
            break;
          default:
            dummyData[field.id] = `Sample ${field.label}`;
        }
      });
    });

    setFormData(dummyData);
    toast.success('Form filled with sample data');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsSubmitted(true);
      toast.success('Form submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit form');
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
            'mx-auto border-8 border-gray-800 rounded-[2.5rem] bg-white shadow-xl',
        };
      case 'tablet':
        return {
          width: '768px',
          height: '1024px',
          className:
            'mx-auto border-4 border-gray-600 rounded-2xl bg-white shadow-xl',
        };
      case 'desktop':
      default:
        return {
          width: '100%',
          height: '100%',
          className: 'w-full h-full bg-white',
        };
    }
  };

  const deviceStyles = getDeviceStyles();

  if (isSubmitted) {
    return (
      <div className='min-h-screen bg-gray-100 flex flex-col'>
        <PreviewHeader
          shareableLink={shareableLink}
          onFillForm={handleFillForm}
          selectedDevice={selectedDevice}
          onDeviceChange={handleDeviceChange}
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
              <div className='text-center'>
                <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                  <svg
                    className='w-10 h-10 text-green-500'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <h1 className='text-3xl font-bold text-gray-900 mb-4'>
                  Thank You!
                </h1>
                <p className='text-gray-600 mb-8'>
                  {form.settings?.thankyouMessage ||
                    'Your submission has been received.'}
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors'
                >
                  Submit Another Response
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-100 flex flex-col'>
      <PreviewHeader
        shareableLink={shareableLink}
        onFillForm={handleFillForm}
        selectedDevice={selectedDevice}
        onDeviceChange={handleDeviceChange}
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
