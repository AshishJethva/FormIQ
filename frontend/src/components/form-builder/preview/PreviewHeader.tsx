// src/components/form-builder/preview/PreviewHeader.tsx
'use client';

import {
  Link,
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

interface PreviewHeaderProps {
  shareableLink: string;
  onFillForm: () => void;
  selectedDevice: 'phone' | 'tablet' | 'desktop';
  onDeviceChange: (device: 'phone' | 'tablet' | 'desktop') => void;
}

export default function PreviewHeader({
  shareableLink,
  onFillForm,
  selectedDevice,
  onDeviceChange,
}: PreviewHeaderProps) {
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const openInNewTab = () => {
    window.open(shareableLink, '_blank');
  };

  return (
    <header className='bg-[#F8A030] border-b border-orange-200 px-6 py-4'>
      <div className='flex items-center justify-between'>
        {/* Left Side - Shareable Link */}
        <div className='flex items-center space-x-4'>
          <div className='flex items-center bg-white rounded-lg px-4 py-2'>
            <Link className='w-4 h-4 text-gray-600 mr-2' />
            <span className='text-sm text-gray-700 mr-4'>{shareableLink}</span>
            <div className='flex space-x-2'>
              <button
                onClick={handleCopyLink}
                className='flex items-center px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors'
              >
                <Copy className='w-3 h-3 mr-1' />
                Copy
              </button>
              <button
                onClick={openInNewTab}
                className='flex items-center px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors'
              >
                <ExternalLink className='w-3 h-3 mr-1' />
                Open
              </button>
            </div>
          </div>

          <button
            onClick={onFillForm}
            className='bg-[#A8EB38] hover:bg-[#96D32A] text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors'
          >
            Fill Form
          </button>
        </div>

        {/* Right Side - Device Selector */}
        <div className='flex items-center space-x-2'>
          <span className='text-white font-medium mr-2'>ORIENTATION</span>

          <div className='flex bg-white rounded-lg p-1'>
            <button
              onClick={() => onDeviceChange('phone')}
              className={`p-2 rounded ${
                selectedDevice === 'phone'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } transition-colors`}
              title='Phone'
            >
              <Smartphone className='w-5 h-5' />
            </button>

            <button
              onClick={() => onDeviceChange('tablet')}
              className={`p-2 rounded ${
                selectedDevice === 'tablet'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } transition-colors`}
              title='Tablet'
            >
              <Tablet className='w-5 h-5' />
            </button>

            <button
              onClick={() => onDeviceChange('desktop')}
              className={`p-2 rounded ${
                selectedDevice === 'desktop'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } transition-colors`}
              title='Desktop'
            >
              <Monitor className='w-5 h-5' />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
