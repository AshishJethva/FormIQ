// src/components/form-builder/canvas/FileUploadField.tsx

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFormFile, uploadFormImage } from '@/services/fileUploadService';
import FileManager from '@/components/form-builder/FileManager';

interface FileUploadFieldProps {
  fieldId: string;
  formId: string;
  label: string;
  required?: boolean;
  helpText?: string;
  accept?: string;
  multiple?: boolean;
  fieldType: 'image' | 'fileUpload';
  value?: any;
  onChange: (value: any) => void;
  error?: string;
  readOnly?: boolean;
}

interface UploadedFile {
  originalName: string;
  fileName: string;
  url: string;
  publicId: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export default function FileUploadField({
  fieldId,
  formId,
  label,
  required,
  helpText,
  accept,
  multiple,
  fieldType,
  value,
  onChange,
  error,
  readOnly = false,
}: FileUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(
    null
  );
  const downloadInProgress = useRef<Set<string>>(new Set());

  // Initialize uploadedFiles from value prop
  useEffect(() => {
    if (value) {
      const files = Array.isArray(value) ? value : [value];
      setUploadedFiles(files);
    } else {
      setUploadedFiles([]);
    }
  }, [value]);

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Check file size first
    const maxSize = fieldType === 'image' ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = fieldType === 'image' ? '10MB' : '25MB';
      return {
        isValid: false,
        error: `File "${file.name}" exceeds ${maxSizeMB} limit`,
      };
    }

    // If it's an image field, enforce image type
    if (fieldType === 'image' && !file.type.startsWith('image/')) {
      return {
        isValid: false,
        error: `Only image files are allowed`,
      };
    }

    // Handle accept attribute
    if (accept && accept !== '*/*' && accept !== '*' && accept.trim() !== '') {
      const isValid = validateAcceptAttribute(file, accept);
      if (!isValid) {
        return {
          isValid: false,
          error: `File type not accepted. Allowed: ${accept}`,
        };
      }
    }

    // Check for dangerous file types
    const dangerousExtensions = [
      '.exe',
      '.bat',
      '.cmd',
      '.scr',
      '.com',
      '.vbs',
    ];
    const hasDangerousExtension = dangerousExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (hasDangerousExtension) {
      return {
        isValid: false,
        error: 'File type not allowed for security reasons',
      };
    }

    return { isValid: true };
  };

  const validateAcceptAttribute = (file: File, acceptAttr: string): boolean => {
    const allowedTypes = acceptAttr
      .split(',')
      .map(type => type.trim().toLowerCase());

    for (const type of allowedTypes) {
      // Handle wildcards like "image/*"
      if (type.endsWith('/*')) {
        const baseType = type.slice(0, -2);
        if (file.type.toLowerCase().startsWith(baseType + '/')) {
          return true;
        }
      }
      // Handle extensions like ".pdf"
      else if (type.startsWith('.')) {
        if (file.name.toLowerCase().endsWith(type)) {
          return true;
        }
      }
      // Handle exact MIME types like "application/pdf"
      else if (file.type.toLowerCase() === type) {
        return true;
      }
    }

    return false;
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    await processFiles(Array.from(files));
  };

  const processFiles = async (files: File[]) => {
    // Check file count limits
    if (!multiple && files.length > 1) {
      toast.error('Only one file is allowed');
      return;
    }

    if (multiple && uploadedFiles.length + files.length > 10) {
      toast.error('Maximum 10 files allowed');
      return;
    }

    setUploading(true);

    try {
      const validFiles: File[] = [];

      // Validate each file
      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.isValid) {
          toast.error(validation.error);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) {
        setUploading(false);
        return;
      }

      // Upload valid files
      const uploadPromises = validFiles.map(file => {
        return fieldType === 'image'
          ? uploadFormImage(file, fieldId, formId)
          : uploadFormFile(file, fieldId, formId);
      });

      const results = await Promise.all(uploadPromises);

      // Update state
      const newFiles = [...uploadedFiles, ...results];
      setUploadedFiles(newFiles);

      // Update form value
      if (multiple) {
        onChange(newFiles);
      } else {
        onChange(newFiles[newFiles.length - 1]);
      }

      toast.success(
        `${results.length} ${
          results.length === 1 ? 'file' : 'files'
        } uploaded successfully`
      );
    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!readOnly && !uploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (readOnly || uploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  const handleRemoveFile = async (fileToRemove: UploadedFile) => {
    try {
      const newFiles = uploadedFiles.filter(
        file => file.publicId !== fileToRemove.publicId
      );
      setUploadedFiles(newFiles);

      // Update form value
      if (multiple) {
        onChange(newFiles.length > 0 ? newFiles : null);
      } else {
        onChange(null);
      }

      toast.success('File removed');
    } catch {
      toast.error('Failed to remove file');
    }
  };

  const handleDownloadFile = async (file: UploadedFile) => {
    if (downloadInProgress.current.has(file.publicId)) return;

    try {
      downloadInProgress.current.add(file.publicId);
      setDownloadingFileId(file.publicId);

      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.originalName || 'download';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      toast.error(`Download failed: ${file.originalName}`);
    } finally {
      downloadInProgress.current.delete(file.publicId);
      setDownloadingFileId(null);
    }
  };

  const getUploadAreaClasses = () => {
    const baseClasses =
      'relative border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out';

    if (error) {
      return `${baseClasses} border-red-400 bg-red-50/50 shadow-sm`;
    }

    if (uploading) {
      return `${baseClasses} border-blue-400 bg-blue-50/50 shadow-md`;
    }

    if (isDragOver) {
      return `${baseClasses} border-green-400 bg-green-50/50 shadow-lg scale-[1.02]`;
    }

    return `${baseClasses} border-gray-300 bg-gray-50/30 hover:border-gray-400 hover:bg-gray-50/50 hover:shadow-sm`;
  };

  return (
    <motion.div
      className='mb-6 w-full'
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Label */}
      <motion.label
        className='block text-gray-800 mb-3 font-semibold text-sm sm:text-base'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {label}
        {required && (
          <motion.span
            className='text-red-500 ml-1'
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            *
          </motion.span>
        )}
      </motion.label>

      {/* Upload Area - Only show if not read-only */}
      {!readOnly && (
        <motion.div
          className={`${getUploadAreaClasses()} p-4 sm:p-6 lg:p-8 text-center cursor-pointer overflow-hidden`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ scale: readOnly || uploading ? 1 : 1.01 }}
          whileTap={{ scale: readOnly || uploading ? 1 : 0.99 }}
          layout
        >
          {/* Animated Background Gradient */}
          <motion.div
            className='absolute inset-0 bg-gradient-to-br from-blue-50/20 to-purple-50/20 opacity-0'
            animate={{ opacity: isDragOver ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          <AnimatePresence mode='wait'>
            {uploading ? (
              <motion.div
                key='uploading'
                className='flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3 relative z-10'
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className='w-6 h-6 sm:w-8 sm:h-8 text-blue-500' />
                </motion.div>
                <span className='text-blue-600 font-medium text-sm sm:text-base'>
                  Uploading...
                </span>
              </motion.div>
            ) : (
              <motion.div
                key='upload-prompt'
                className='relative z-10'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className='flex justify-center mb-3 sm:mb-4'
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className='p-3 sm:p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full'>
                    <Upload className='w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-blue-600' />
                  </div>
                </motion.div>

                <div className='space-y-1 sm:space-y-2'>
                  <p className='text-gray-700 font-medium text-sm sm:text-base'>
                    <span className='hidden sm:inline'>
                      Click to upload or drag & drop
                    </span>
                    <span className='sm:hidden'>Tap to upload</span>
                  </p>
                  <p className='text-gray-600 text-xs sm:text-sm'>
                    {fieldType === 'image' ? 'Images' : 'Files'}
                    {multiple && (
                      <span className='block sm:inline'>
                        <span className='hidden sm:inline'> • </span>
                        Multiple files allowed
                      </span>
                    )}
                  </p>
                  <p className='text-gray-500 text-xs'>
                    {fieldType === 'image'
                      ? 'PNG, JPG, GIF up to 10MB'
                      : accept && accept !== '*/*' && accept !== '*'
                      ? `Accepted: ${
                          accept.length > 20
                            ? accept.substring(0, 20) + '...'
                            : accept
                        }`
                      : 'Any file type up to 25MB'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type='file'
        multiple={multiple}
        accept={accept === 'undefined' || !accept ? undefined : accept}
        onChange={handleFileSelect}
        className='hidden'
        disabled={uploading || readOnly}
      />

      {/* File Manager for displaying uploaded files */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            className='mt-4'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <motion.div className='bg-white overflow-hidden' layout>
              <FileManager
                files={uploadedFiles}
                fieldLabel={`Uploaded ${
                  fieldType === 'image' ? 'Images' : 'Files'
                }`}
                fieldId={fieldId}
                onFileDelete={readOnly ? undefined : handleRemoveFile}
                onFileDownload={handleDownloadFile}
                showActions={true}
                compact={true}
                readOnly={readOnly}
                downloadingFileId={downloadingFileId}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Text */}
      <AnimatePresence>
        {helpText && (
          <motion.div
            className='text-xs sm:text-sm text-gray-600 mt-3 px-1'
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {helpText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className='text-xs sm:text-sm text-red-600 mt-3 flex items-start space-x-2 p-3 bg-red-50 rounded-lg border border-red-200'
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, type: 'spring' }}
          >
            <AlertCircle className='w-4 h-4 flex-shrink-0 mt-0.5 text-red-500' />
            <span className='flex-1'>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Instructions - Only show when empty and not read-only */}
      <AnimatePresence>
        {uploadedFiles.length === 0 && !readOnly && (
          <motion.div
            className='text-xs text-gray-500 mt-3 text-center px-2'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-center space-y-1 sm:space-y-0 sm:space-x-2'>
              <span>
                {fieldType === 'image'
                  ? 'Upload images to see preview & manage options'
                  : 'Upload files to see preview & manage options'}
              </span>
              <span className='hidden sm:inline text-gray-400'>•</span>
              <span className='text-gray-400'>
                <span className='sm:hidden'>Supports </span>
                <span className='hidden sm:inline'>Drag & drop supported</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
