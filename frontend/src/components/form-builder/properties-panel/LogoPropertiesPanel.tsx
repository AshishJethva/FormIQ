// src/components/form-builder/properties-panel/LogoPropertiesPanel.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Link, Trash2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { updateLogo, removeLogo } from '@/redux/slices/formBuilderSlice';
import axios from 'axios';
import { toast } from 'sonner';
import { apiConfig } from '@/config/api';

interface LogoPropertiesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TabProps {
  isSelected: boolean;
  onClick: () => void;
  label: string;
}

// Tab component for the panel
const Tab: React.FC<TabProps> = ({ isSelected, onClick, label }) => (
  <button
    className={`py-2 text-sm font-medium leading-5 cursor-pointer transition-colors ${
      isSelected
        ? 'text-orange-500 border-b-2 border-orange-500'
        : 'text-gray-400 hover:text-gray-300'
    }`}
    onClick={onClick}
  >
    {label}
  </button>
);

// Saved Image component for My Images tab with selection indicator
interface SavedImageProps {
  src: string;
  onSelect: () => void;
  onDelete: () => void;
  isSelected: boolean;
}

const SavedImage: React.FC<SavedImageProps> = ({
  src,
  onSelect,
  onDelete,
  isSelected,
}) => (
  <div className='relative group'>
    <div
      className={`bg-gray-800 p-2 rounded-md overflow-hidden border-2 ${
        isSelected ? 'border-blue-500' : 'border-transparent'
      }`}
    >
      <img
        src={src}
        alt='Saved logo'
        className='w-full h-20 object-contain cursor-pointer'
        onClick={onSelect}
      />

      {isSelected && (
        <div className='absolute top-2 right-2 bg-blue-500 rounded-full p-1'>
          <CheckCircle className='w-3 h-3 text-white' />
        </div>
      )}

      <div className='absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
        <button
          className='p-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors cursor-pointer'
          onClick={onSelect}
        >
          <CheckCircle className='w-4 h-4 text-white' />
        </button>
        <button
          className='p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors cursor-pointer'
          onClick={onDelete}
        >
          <Trash2 className='w-4 h-4 text-white' />
        </button>
      </div>
    </div>
  </div>
);

export default function LogoPropertiesPanel({
  isOpen,
  onClose,
}: LogoPropertiesPanelProps) {
  const dispatch = useDispatch();

  const logo = useSelector((state: RootState) => state.formBuilder.form?.logo);

  const [selectedTab, setSelectedTab] = useState(0);
  const [logoUrl, setLogoUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoSize, setLogoSize] = useState(logo?.size || 50); // Size in percentage
  const [logoAlignment, setLogoAlignment] = useState<
    'LEFT' | 'CENTER' | 'RIGHT'
  >(logo?.alignment || 'CENTER');

  const [savedImages, setSavedImages] = useState<
    { src: string; type: string; publicId?: string }[]
  >([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);

  // Update local state when Redux state changes
  useEffect(() => {
    if (logo) {
      setLogoSize(logo.size || 50);
      setLogoAlignment(logo.alignment || 'CENTER');
    }
  }, [logo]);

  // When opened, check if we should switch to My Images tab if logo is already set
  useEffect(() => {
    if (isOpen) {
      loadSavedImages();
      if (logo?.src) {
        setSelectedTab(1);
      }
    }
  }, [isOpen, logo?.src]);

  // Load saved images from localStorage
  const loadSavedImages = () => {
    try {
      const savedImagesData = localStorage.getItem('savedLogos');
      if (savedImagesData) {
        setSavedImages(JSON.parse(savedImagesData));
      }
    } catch (error) {
      console.error('Error loading saved images:', error);
    }
  };

  // Save image to localStorage
  const saveImageToStorage = (src: string, type: string, publicId?: string) => {
    try {
      // Check if image already exists
      const exists = savedImages.some(img => img.src === src);
      if (exists) return;

      const newSavedImages = [...savedImages, { src, type, publicId }];
      setSavedImages(newSavedImages);
      localStorage.setItem('savedLogos', JSON.stringify(newSavedImages));
    } catch (error) {
      console.error('Error saving image to storage:', error);
    }
  };

  // Remove image from localStorage
  const removeImageFromStorage = (src: string) => {
    try {
      const newSavedImages = savedImages.filter(img => img.src !== src);
      setSavedImages(newSavedImages);
      localStorage.setItem('savedLogos', JSON.stringify(newSavedImages));

      // If the current logo is being removed, clear it from Redux
      if (logo?.src === src) {
        dispatch(removeLogo());
      }
    } catch (error) {
      console.error('Error removing image from storage:', error);
    }
  };

  // Validate file before upload
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'Please select an image file' };
    }

    // Check file size (5MB limit for logos)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Image size must be less than 5MB',
      };
    }

    // Check for supported formats
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];

    if (!supportedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Supported formats: JPG, PNG, GIF, WebP, SVG',
      };
    }

    return { isValid: true };
  };

  // Handle file upload to Cloudinary via our backend
  const uploadToCloudinary = async (file: File) => {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      // Get auth token
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data',
      };

      // Add auth header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.post(
        `${apiConfig.url}/upload/logo`,
        formData,
        {
          headers,
          timeout: 60000, // 60 second timeout
          onUploadProgress: progressEvent => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              console.log(`Upload progress: ${percentCompleted}%`);
            }
          },
        }
      );

      const { url, publicId } = response.data;

      // Save to localStorage
      saveImageToStorage(url, 'uploaded', publicId);

      // Update Redux state
      dispatch(
        updateLogo({
          src: url,
          type: 'uploaded',
          alignment: logoAlignment,
          size: logoSize,
          publicId: publicId,
        })
      );

      toast.success('Logo uploaded successfully');

      // Switch to My Images tab
      setSelectedTab(1);
    } catch (error: any) {
      console.error('❌ Logo upload failed:', error);

      let errorMessage = 'Failed to upload logo';

      if (error.response?.status === 400) {
        errorMessage =
          error.response.data?.message || 'Invalid file or request';
      } else if (error.response?.status === 413) {
        errorMessage = 'File is too large. Maximum size is 5MB';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Check your permissions';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. Please try with a smaller file';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadToCloudinary(file);

    // Reset input
    e.target.value = '';
  };

  // Handle URL input
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoUrl.trim()) {
      toast.error('Please enter a valid image URL');
      return;
    }

    try {
      // Verify if image URL is valid by trying to load it
      const img = new Image();
      img.onload = () => {
        // Save to localStorage
        saveImageToStorage(logoUrl, 'url');

        // Update Redux state
        dispatch(
          updateLogo({
            src: logoUrl,
            type: 'url',
            alignment: logoAlignment,
            size: logoSize,
          })
        );

        setLogoUrl('');
        toast.success('Logo URL set successfully');

        // Switch to My Images tab
        setSelectedTab(1);
      };

      img.onerror = () => {
        toast.error(
          'Unable to load image from this URL. Please check the URL and try again.'
        );
      };

      // Start loading the image
      img.src = logoUrl;
    } catch {
      toast.error('Error loading image URL');
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    const file = files?.[0];
    if (!file) return;

    uploadToCloudinary(file);
  };

  // Trigger file input click
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle logo removal
  const handleRemoveLogo = () => {
    dispatch(removeLogo());
    toast.success('Logo removed');
  };

  // Handle selecting a saved image
  const handleSelectSavedImage = (
    src: string,
    type: string,
    publicId?: string
  ) => {
    dispatch(
      updateLogo({
        src,
        type: type as 'uploaded' | 'url',
        alignment: logoAlignment,
        size: logoSize,
        publicId,
      })
    );
    toast.success('Logo selected');
  };

  // Handle deleting a saved image
  const handleDeleteSavedImage = (src: string) => {
    removeImageFromStorage(src);
    toast.success('Image removed from saved images');
  };

  // Handle alignment changes
  const handleAlignmentChange = (alignment: 'LEFT' | 'CENTER' | 'RIGHT') => {
    setLogoAlignment(alignment);

    // Update Redux if logo exists
    if (logo) {
      dispatch(
        updateLogo({
          ...logo,
          alignment,
        })
      );
    }
  };

  // Handle slider drag to prevent lag during sliding
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    // Initial update based on click position
    updateSizeFromMousePosition(e.clientX);

    const handleSliderMove = (e: MouseEvent) => {
      e.preventDefault();
      updateSizeFromMousePosition(e.clientX);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleSliderMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // When slider movement is done, ensure Redux state is fully updated
      if (logo && sliderRef.current) {
        const finalSize = parseInt(sliderRef.current.value, 10);

        // Force a full Redux update with the final size
        dispatch(
          updateLogo({
            ...logo,
            size: finalSize,
          })
        );

        console.log('Final logo size updated:', finalSize);
      }
    };

    document.addEventListener('mousemove', handleSliderMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Update size based on mouse position
  const updateSizeFromMousePosition = (clientX: number) => {
    if (!sliderTrackRef.current) return;

    const rect = sliderTrackRef.current.getBoundingClientRect();
    const sliderWidth = rect.width;
    let position = clientX - rect.left;

    // Clamp position to slider width
    position = Math.max(0, Math.min(sliderWidth, position));

    // Calculate percentage (0-100)
    const newSize = Math.round((position / sliderWidth) * 100);

    // Update local state
    setLogoSize(newSize);

    // Update both the input element value and the Redux state
    if (sliderRef.current) {
      sliderRef.current.value = newSize.toString();
    }

    // Update Redux if logo exists
    if (logo) {
      // Use direct dispatch to update logo size
      dispatch(
        updateLogo({
          ...logo,
          size: newSize,
        })
      );
    }
  };

  // Fix for the size slider to ensure it works across the full range
  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Parse the value as a number (the range is now 0-100)
    const newSize = parseInt(e.target.value, 10);
    setLogoSize(newSize);

    // Immediately update Redux to ensure the change is applied
    if (logo) {
      // Use the direct value from the input to ensure accuracy
      dispatch(
        updateLogo({
          ...logo,
          size: newSize,
        })
      );
    }
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
          className='fixed top-0 right-0 h-[90%] mt-29 w-[335px] bg-[#2C2F4A] text-white shadow-lg z-50 overflow-y-auto'
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
              className='text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700 cursor-pointer'
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          {/* Logo section */}
          <div className='p-4 border-b border-gray-700'>
            <h4 className='text-lg font-medium mb-3'>Logo</h4>

            {logo?.src ? (
              <div className='relative'>
                <div className='bg-gray-800 p-4 rounded-md'>
                  <div
                    className={`flex w-full ${
                      logoAlignment === 'LEFT'
                        ? 'justify-start'
                        : logoAlignment === 'RIGHT'
                        ? 'justify-end'
                        : 'justify-center'
                    }`}
                    style={{ minHeight: '60px' }}
                  >
                    <div
                      style={{
                        width:
                          logoSize >= 100
                            ? '100%'
                            : `${Math.max(5, logoSize)}%`,
                        minHeight: '40px',
                      }}
                    >
                      <img
                        src={logo.src}
                        alt='Logo'
                        className='w-full object-contain'
                        style={{
                          maxHeight: '100px',
                          width: 'auto',
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className='flex justify-between mt-2'>
                  <div className='text-sm text-gray-400'>
                    {logo.type === 'uploaded' ? 'Uploaded Image' : 'Image URL'}
                  </div>
                  <button
                    onClick={handleRemoveLogo}
                    className='text-orange-500 text-sm hover:text-orange-400 cursor-pointer'
                  >
                    Remove Logo
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className='flex border-b border-gray-700 space-x-8'>
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
                        disabled={isUploading}
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className='mx-auto mb-3 flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white cursor-pointer'
                        onClick={handleUploadClick}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <div className='w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                        ) : (
                          <Upload className='w-6 h-6' />
                        )}
                      </motion.button>
                      <p className='text-sm text-gray-300 mb-1'>
                        {isUploading ? 'Uploading...' : 'Upload File'}
                      </p>
                      <p className='text-xs text-gray-400'>
                        OR DRAG AND DROP HERE
                      </p>
                      <p className='text-xs text-gray-500 mt-2'>
                        Supported: JPG, PNG, GIF, WebP, SVG (Max 5MB)
                      </p>
                    </div>
                  )}

                  {selectedTab === 1 && (
                    <div className='mt-2 border border-gray-700 rounded-lg p-4'>
                      {savedImages.length > 0 ? (
                        <div className='grid grid-cols-2 gap-2'>
                          {savedImages.map((image, index) => (
                            <SavedImage
                              key={index}
                              src={image.src}
                              onSelect={() =>
                                handleSelectSavedImage(
                                  image.src,
                                  image.type,
                                  image.publicId
                                )
                              }
                              onDelete={() => handleDeleteSavedImage(image.src)}
                              isSelected={logo?.src === image.src}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className='text-gray-400 text-center'>
                          No saved images found.
                        </p>
                      )}
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
                            required
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type='submit'
                            className='px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors cursor-pointer'
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
          {logo?.src && (
            <>
              <div className='p-4 border-b border-gray-700'>
                <h4 className='text-lg font-medium mb-3'>
                  Logo Size{' '}
                  <span className='text-sm text-gray-400 ml-2'>
                    {logoSize}%
                  </span>
                </h4>

                <div
                  className='relative my-6 mx-2 h-2 bg-gray-700 rounded-full cursor-pointer'
                  ref={sliderTrackRef}
                  onMouseDown={handleSliderMouseDown}
                >
                  {/* Blue part of the track - the active part */}
                  <div
                    className='absolute h-2 bg-blue-500 rounded-full'
                    style={{ width: `${logoSize}%` }}
                  ></div>

                  {/* Thumb */}
                  <div
                    className='absolute w-6 h-6 bg-white rounded-full shadow-md cursor-pointer'
                    style={{
                      left: `calc(${logoSize}% - 12px)`,
                      top: '-8px',
                    }}
                    onMouseDown={handleSliderMouseDown}
                  ></div>

                  {/* Actual input slider - invisible but functional */}
                  <input
                    ref={sliderRef}
                    type='range'
                    min='0'
                    max='100'
                    value={logoSize}
                    onChange={handleSizeChange}
                    className='absolute w-full h-6 opacity-0 cursor-pointer z-10'
                    style={{ marginTop: '-8px' }}
                  />
                </div>

                {/* Size presets */}
                <div className='flex justify-between mt-4'>
                  <button
                    className='px-3 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600 cursor-pointer'
                    onClick={() => {
                      setLogoSize(25);
                      if (logo) {
                        dispatch(updateLogo({ ...logo, size: 25 }));
                      }
                    }}
                  >
                    Small
                  </button>
                  <button
                    className='px-3 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600 cursor-pointer'
                    onClick={() => {
                      setLogoSize(50);
                      if (logo) {
                        dispatch(updateLogo({ ...logo, size: 50 }));
                      }
                    }}
                  >
                    Medium
                  </button>
                  <button
                    className='px-3 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600 cursor-pointer'
                    onClick={() => {
                      setLogoSize(75);
                      if (logo) {
                        dispatch(updateLogo({ ...logo, size: 75 }));
                      }
                    }}
                  >
                    Large
                  </button>
                  <button
                    className='px-3 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600 cursor-pointer'
                    onClick={() => {
                      setLogoSize(100);
                      if (logo) {
                        dispatch(updateLogo({ ...logo, size: 100 }));
                      }
                    }}
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Alignment options */}
              <div className='p-4'>
                <h4 className='text-lg font-medium mb-3'>Alignment</h4>
                <div className='flex space-x-2'>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md cursor-pointer ${
                      logoAlignment === 'LEFT'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => handleAlignmentChange('LEFT')}
                  >
                    LEFT
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md cursor-pointer ${
                      logoAlignment === 'CENTER'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => handleAlignmentChange('CENTER')}
                  >
                    CENTER
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md cursor-pointer ${
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
