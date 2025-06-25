'use client';

import {
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setPreviewMode } from '@/redux/slices/formBuilder/formBuilderSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openInNewTab = () => {
    window.open(shareableLink, '_blank');
  };

  const handleExitPreview = () => {
    dispatch(setPreviewMode(false));
    window.location.hash = '';
    router.replace(`/build/${formId}`);
    setMobileMenuOpen(false);
  };

  const deviceOptions = [
    { id: 'phone', icon: Smartphone, label: 'Phone' },
    { id: 'tablet', icon: Tablet, label: 'Tablet' },
    { id: 'desktop', icon: Monitor, label: 'Desktop' },
  ] as const;

  return (
    <>
      <motion.header
        className='bg-gradient-to-r from-orange-300/80 to-orange-600/80 backdrop-blur-md shadow-sm sticky top-0 z-50'
        initial={{ y: 50, opacity: 0 }} // Start from below (down)
        animate={{ y: 0, opacity: 1 }} // Move to normal position (up)
        exit={{ y: -50, opacity: 0 }} // Exit upward
        transition={{
          duration: 0.6,
          ease: 'easeOut',
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        <div className='px-4 sm:px-6 py-3'>
          {/* Desktop Layout */}
          <div className='hidden lg:flex items-center justify-between'>
            {/* Left Side - URL and Fill Form */}
            <motion.div
              className='flex items-center space-x-4'
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {/* URL Display */}
              <div className='flex items-center bg-white rounded-lg px-4 py-2 shadow-sm min-w-0'>
                <span className='text-sm text-gray-700 font-medium truncate mr-3'>
                  {shareableLink}
                </span>
                <motion.button
                  onClick={openInNewTab}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='p-1 text-gray-600 hover:text-gray-800 transition-colors flex-shrink-0'
                  title='Open in new tab'
                >
                  <ExternalLink className='w-4 h-4' />
                </motion.button>
              </div>

              {/* Fill Form Button */}
              <motion.button
                onClick={onFillForm}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className='bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm'
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                Fill Form
              </motion.button>
            </motion.div>

            {/* Right Side - Device Icons and Toggle */}
            <motion.div
              className='flex items-center space-x-6'
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {/* Device Icons */}
              <div className='flex items-center space-x-2'>
                {deviceOptions.map(({ id, icon: Icon, label }, index) => (
                  <motion.button
                    key={id}
                    onClick={() => onDeviceChange(id as typeof selectedDevice)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      selectedDevice === id
                        ? 'bg-white text-orange-600 shadow-md'
                        : 'text-white hover:bg-white/20'
                    }`}
                    title={label}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                  >
                    <Icon className='w-5 h-5' />
                  </motion.button>
                ))}
              </div>

              {/* Preview Form Toggle */}
              <motion.div
                className='flex items-center space-x-3'
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <span className='text-white font-medium'>Preview Form</span>
                <motion.div
                  className='relative w-12 h-6 rounded-full cursor-pointer bg-green-500 shadow-sm'
                  onClick={handleExitPreview}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title='Click to exit preview'
                >
                  <motion.div
                    className='absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow-sm'
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* Tablet Layout */}
          <div className='hidden sm:flex lg:hidden items-center justify-between'>
            {/* Left - URL (truncated) */}
            <motion.div
              className='flex items-center bg-white rounded-lg px-3 py-2 shadow-sm min-w-0 max-w-xs'
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <span className='text-sm text-gray-700 font-medium truncate mr-2'>
                {shareableLink.replace(/^https?:\/\//, '').split('/')[0]}
              </span>
              <motion.button
                onClick={openInNewTab}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='p-1 text-gray-600 hover:text-gray-800 transition-colors'
              >
                <ExternalLink className='w-4 h-4' />
              </motion.button>
            </motion.div>

            {/* Center - Device Icons */}
            <motion.div
              className='flex items-center space-x-1'
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {deviceOptions.map(({ id, icon: Icon, label }, index) => (
                <motion.button
                  key={id}
                  onClick={() => onDeviceChange(id as typeof selectedDevice)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    selectedDevice === id
                      ? 'bg-white text-orange-600 shadow-md'
                      : 'text-white hover:bg-white/20'
                  }`}
                  title={label}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.05, duration: 0.2 }}
                >
                  <Icon className='w-4 h-4' />
                </motion.button>
              ))}
            </motion.div>

            {/* Right - Menu */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className='p-2.5 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors'
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {mobileMenuOpen ? (
                <X className='w-5 h-5' />
              ) : (
                <Menu className='w-5 h-5' />
              )}
            </motion.button>
          </div>

          {/* Mobile Layout */}
          <div className='sm:hidden flex items-center justify-between'>
            {/* Left - Domain only */}
            <motion.div
              className='flex items-center bg-white rounded-lg px-3 py-2 shadow-sm min-w-0 max-w-[50%]'
              initial={{ x: -15, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <span className='text-xs text-gray-700 font-medium truncate'>
                {shareableLink.replace(/^https?:\/\//, '').split('/')[0]}
              </span>
            </motion.div>

            {/* Center - Device Icons */}
            <motion.div
              className='flex items-center space-x-1'
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              {deviceOptions.map(({ id, icon: Icon }, index) => (
                <motion.button
                  key={id}
                  onClick={() => onDeviceChange(id as typeof selectedDevice)}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    selectedDevice === id
                      ? 'bg-white text-orange-600 shadow-md'
                      : 'text-white hover:bg-white/20'
                  }`}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.2 }}
                >
                  <Icon className='w-4 h-4' />
                </motion.button>
              ))}
            </motion.div>

            {/* Right - Menu */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className='p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white'
              initial={{ x: 15, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              {mobileMenuOpen ? (
                <X className='w-4 h-4' />
              ) : (
                <Menu className='w-4 h-4' />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className='lg:hidden border-t border-white/20 bg-black/10 backdrop-blur-md'
            >
              <motion.div
                className='p-4 space-y-4'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {/* Full URL */}
                <motion.div
                  className='space-y-2'
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <label className='text-sm font-medium text-white'>
                    Share URL:
                  </label>
                  <div className='flex items-center space-x-2'>
                    <div className='flex-1 bg-white rounded-lg p-3'>
                      <span className='text-sm text-gray-700 font-medium break-all'>
                        {shareableLink}
                      </span>
                    </div>
                    <motion.button
                      onClick={openInNewTab}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className='p-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors'
                    >
                      <ExternalLink className='w-4 h-4' />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  className='grid grid-cols-2 gap-3'
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <motion.button
                    onClick={() => {
                      onFillForm();
                      setMobileMenuOpen(false);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className='p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium'
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.2 }}
                  >
                    Fill Form
                  </motion.button>

                  <motion.button
                    onClick={handleExitPreview}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className='p-3 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors font-medium'
                    initial={{ x: 10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.2 }}
                  >
                    Exit Preview
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
