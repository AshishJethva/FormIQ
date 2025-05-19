// src/components/form-builder/properties/LogoPropertiesPanel.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Link, Image, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
// You'll need to create this action in your formBuilderSlice
// import { updateLogo, removeLogo } from '@/redux/slices/formBuilderSlice';

interface LogoPropertiesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TabProps {
  children: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  label: string;
}

// Tab component for the panel
const Tab: React.FC<TabProps> = ({ children, isSelected, onClick, label }) => (
  <button
    className={`py-2 text-sm font-medium leading-5 transition-colors ${
      isSelected
        ? 'text-orange-500 border-b-2 border-orange-500'
        : 'text-gray-400 hover:text-gray-300'
    }`}
    onClick={onClick}
  >
    {label}
  </button>
);

export default function LogoPropertiesPanel({
  isOpen,
  onClose,
}: LogoPropertiesPanelProps) {
  const dispatch = useDispatch();
  // If you're storing logo in Redux
  // const logo = useSelector((state: RootState) => state.formBuilder.form?.logo);

  const [selectedTab, setSelectedTab] = useState(0);
  const [logoUrl, setLogoUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [logo, setLogo] = useState<string | null>(
    'https://placekitten.com/200/100'
  ); // Demo logo
  const [logoSize, setLogoSize] = useState(50); // Size in percentage
  const [logoAlignment, setLogoAlignment] = useState('CENTER');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read the file and create a data URL
    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      // Update local state
      setLogo(result);

      // Update Redux state
      // dispatch(updateLogo({ src: result, type: 'uploaded' }));
    };
    reader.readAsDataURL(file);
  };

  // Handle URL input
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoUrl) return;

    // Update local state
    setLogo(logoUrl);

    // Update Redux state
    // dispatch(updateLogo({ src: logoUrl, type: 'url' }));
    setLogoUrl('');
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.match('image.*')) {
      alert('Please upload an image file');
      return;
    }

    // Read the file and create a data URL
    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      // Update local state
      setLogo(result);

      // Update Redux state
      // dispatch(updateLogo({ src: result, type: 'uploaded' }));
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle logo removal
  const handleRemoveLogo = () => {
    setLogo(null);
    // Update Redux
    // dispatch(removeLogo());
  };

  // Handle alignment changes
  const handleAlignmentChange = (alignment: string) => {
    setLogoAlignment(alignment);
    // Update Redux
    // dispatch(updateLogo({ ...logo, alignment }));
  };

  // Panel animation variants
  const panelVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        duration: 0.3,
      },
    },
    exit: {
      x: '100%',
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className='fixed top-0 right-0 h-[90%] mt-29 w-[335px] bg-[#2C2F4A] text-white shadow-lg z-50'
          initial='hidden'
          animate='visible'
          exit='exit'
          variants={panelVariants}
        >
          {/* Header */}
          <div className='flex justify-between items-center p-4 border-b border-gray-700 bg-[#272A40]'>
            <h3 className='font-medium flex items-center'>Logo Properties</h3>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700'
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          {/* Logo section */}
          <div className='p-4 border-b border-gray-700'>
            <h4 className='text-lg font-medium mb-3'>Logo</h4>

            {logo ? (
              <div className='relative'>
                <div className='bg-gray-800 p-4 rounded-md'>
                  <div className='p-2 flex justify-center items-center'>
                    <img
                      src={logo}
                      alt='Logo'
                      className='max-h-24 max-w-full object-contain'
                    />
                  </div>
                </div>
                <div className='flex justify-between mt-2'>
                  <div className='text-sm text-gray-400'>
                    1.location.682b3f6c1f0d40.8947...
                  </div>
                  <button
                    onClick={handleRemoveLogo}
                    className='text-orange-500 text-sm hover:text-orange-400'
                  >
                    Remove Logo
                  </button>
                </div>
                <div className='mt-4 text-sm text-gray-300'>
                  This logo is set as your organizational logo. You can change
                  it any time from{' '}
                  <a href='#' className='text-blue-400 hover:underline'>
                    Account Settings
                  </a>
                  .
                </div>
              </div>
            ) : (
              <div>
                <div className='flex border-b border-gray-700'>
                  <Tab
                    isSelected={selectedTab === 0}
                    onClick={() => setSelectedTab(0)}
                    label='UPLOAD'
                  />
                  <Tab
                    isSelected={selectedTab === 1}
                    onClick={() => setSelectedTab(1)}
                    label='MY IMAGES'
                  />
                  <Tab
                    isSelected={selectedTab === 2}
                    onClick={() => setSelectedTab(2)}
                    label='ENTER URL'
                  />
                </div>

                <div className='mt-4'>
                  {selectedTab === 0 && (
                    <div
                      className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragging
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-600'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <input
                        type='file'
                        ref={fileInputRef}
                        className='hidden'
                        accept='image/*'
                        onChange={handleFileChange}
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className='mx-auto mb-3 flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white'
                        onClick={handleUploadClick}
                      >
                        <Upload className='w-6 h-6' />
                      </motion.button>
                      <p className='text-sm text-gray-300 mb-1'>Upload File</p>
                      <p className='text-xs text-gray-400'>
                        OR DRAG AND DROP HERE
                      </p>
                    </div>
                  )}

                  {selectedTab === 1 && (
                    <div className='mt-2 border border-gray-700 rounded-lg p-4 text-center'>
                      <p className='text-gray-400'>No saved images found.</p>
                    </div>
                  )}

                  {selectedTab === 2 && (
                    <form onSubmit={handleUrlSubmit} className='mt-2'>
                      <div className='mb-4'>
                        <label
                          htmlFor='logo-url'
                          className='block text-sm text-gray-300 mb-1'
                        >
                          Image URL
                        </label>
                        <div className='flex'>
                          <input
                            type='url'
                            id='logo-url'
                            value={logoUrl}
                            onChange={e => setLogoUrl(e.target.value)}
                            className='flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500'
                            placeholder='https://example.com/logo.png'
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type='submit'
                            className='px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors'
                          >
                            <Link className='w-4 h-4' />
                          </motion.button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logo Size slider */}
          {logo && (
            <>
              <div className='p-4 border-b border-gray-700'>
                <h4 className='text-lg font-medium mb-3'>Logo Size</h4>
                <input
                  type='range'
                  min='20'
                  max='100'
                  value={logoSize}
                  onChange={e => setLogoSize(parseInt(e.target.value))}
                  className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
                />
              </div>

              {/* Alignment options */}
              <div className='p-4'>
                <h4 className='text-lg font-medium mb-3'>Alignment</h4>
                <div className='flex space-x-2'>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md ${
                      logoAlignment === 'LEFT'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => handleAlignmentChange('LEFT')}
                  >
                    LEFT
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md ${
                      logoAlignment === 'CENTER'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => handleAlignmentChange('CENTER')}
                  >
                    CENTER
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md ${
                      logoAlignment === 'RIGHT'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => handleAlignmentChange('RIGHT')}
                  >
                    RIGHT
                  </button>
                </div>
                <p className='text-sm text-gray-400 mt-2'>
                  Select how the image is aligned in the form.
                </p>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
