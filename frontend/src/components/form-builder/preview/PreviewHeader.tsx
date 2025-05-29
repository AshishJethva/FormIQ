// src/components/form-builder/preview/PreviewHeader.tsx
'use client';

import { Link, Monitor, Smartphone, Tablet, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setPreviewMode } from '@/redux/slices/formBuilderSlice';

interface PreviewHeaderProps {
  shareableLink: string;
  onFillForm: () => void;
  selectedDevice: 'phone' | 'tablet' | 'desktop';
  onDeviceChange: (device: 'phone' | 'tablet' | 'desktop') => void;
  formId: string;
}

export default function PreviewHeader({
  shareableLink,
  onFillForm,
  selectedDevice,
  onDeviceChange,
  formId,
}: PreviewHeaderProps) {
  const router = useRouter();
  const dispatch = useDispatch();

  const openInNewTab = () => {
    window.open(shareableLink, '_blank');
  };

  const handleExitPreview = () => {
    // Update Redux state
    dispatch(setPreviewMode(false));

    // Clear URL hash
    window.location.hash = '';

    // Navigate back to build page
    router.replace(`/build/${formId}`);
  };

  return (
    <header className='bg-[#F8A030] border-b border-orange-200 px-6 py-4 shadow-sm'>
      <div className='flex items-center justify-between'>
        {/* Left Side - Shareable Link and Actions */}
        <div className='flex items-center space-x-4'>
          <div className='flex items-center bg-white rounded-lg px-4 py-2 shadow-sm max-w-md'>
            <Link className='w-4 h-4 text-gray-600 mr-2 flex-shrink-0' />
            <span
              className='text-xs text-gray-700 mr-4 truncate font-mono'
              title={shareableLink}
            >
              {shareableLink}
            </span>
            <div className='flex space-x-2 flex-shrink-0'>
              <button
                onClick={openInNewTab}
                className='flex items-center px-3 py-1 bg-[#ff5e00] text-white text-sm rounded hover:bg-[#e51001] transition-colors shadow-sm'
                title='Open form in new tab'
              >
                <ExternalLink className='w-3 h-3' />
              </button>
            </div>
          </div>

          <button
            onClick={onFillForm}
            className='bg-[#F76101] hover:bg-[#E55301] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm'
            title='Fill form with sample data'
          >
            Fill Form
          </button>
        </div>

        {/* Right Side - Device Selector and Exit Button */}
        <div className='flex items-center space-x-4'>
          <div className='flex items-center space-x-2'>
            <div className='flex bg-white rounded-lg p-1 shadow-sm'>
              <button
                onClick={() => onDeviceChange('phone')}
                className={`p-2 rounded transition-colors ${
                  selectedDevice === 'phone'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title='Phone View (375px)'
              >
                <Smartphone className='w-5 h-5' />
              </button>

              <button
                onClick={() => onDeviceChange('tablet')}
                className={`p-2 rounded transition-colors ${
                  selectedDevice === 'tablet'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title='Tablet View (768px)'
              >
                <Tablet className='w-5 h-5' />
              </button>

              <button
                onClick={() => onDeviceChange('desktop')}
                className={`p-2 rounded transition-colors ${
                  selectedDevice === 'desktop'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title='Desktop View'
              >
                <Monitor className='w-5 h-5' />
              </button>
            </div>
          </div>

          {/* Preview Toggle - Exit Preview */}
          <div className='flex items-center space-x-2'>
            <span className='text-white text-sm font-medium'>Preview Form</span>
            <div
              className='relative w-12 h-6 rounded-full transition-colors cursor-pointer bg-[#A8EB38] shadow-sm'
              onClick={handleExitPreview}
              title='Exit preview mode'
            >
              <span className='absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform flex items-center justify-center transform translate-x-6'>
                <div className='w-2 h-2 bg-[#A8EB38] rounded-full'></div>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
