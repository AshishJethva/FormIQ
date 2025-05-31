// src/components/form-builder/canvas/FileUploadField.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { downloadFileEnhanced, uploadFormFile, uploadFormImage } from '@/services/fileUploadService';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize uploadedFiles from value prop
  useEffect(() => {
    if (value) {
      const files = Array.isArray(value) ? value : [value];
      setUploadedFiles(files);
    } else {
      setUploadedFiles([]);
    }
  }, [value]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate file count
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
      const uploadPromises = Array.from(files).map(file => {
        // Validate file size
        const maxSize =
          fieldType === 'image' ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error(
            `File "${file.name}" is too large. Maximum size is ${
              fieldType === 'image' ? '10MB' : '25MB'
            }`
          );
        }

        // Validate file type for images
        if (fieldType === 'image' && !file.type.startsWith('image/')) {
          throw new Error(`File "${file.name}" is not a valid image`);
        }

        // Validate against accept attribute
        if (accept && accept !== '*/*') {
          const allowedTypes = accept.split(',').map(type => type.trim());
          const isAllowed = allowedTypes.some(type => {
            if (type.startsWith('.')) {
              return file.name.toLowerCase().endsWith(type.toLowerCase());
            } else if (type.endsWith('/*')) {
              const baseType = type.slice(0, -2);
              return file.type.startsWith(baseType);
            } else {
              return file.type === type;
            }
          });

          if (!isAllowed) {
            throw new Error(`File "${file.name}" is not an allowed file type`);
          }
        }

        // Upload the file
        return fieldType === 'image'
          ? uploadFormImage(file, fieldId, formId)
          : uploadFormFile(file, fieldId, formId);
      });

      const results = await Promise.all(uploadPromises);

      // Update uploaded files
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
      console.error('File upload error:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    } catch (error: any) {
      toast.error('Failed to remove file');
      throw error; // Re-throw for FileManager error handling
    }
  };

  const handleDownloadFile = async (file: UploadedFile) => {
    try {
      await downloadFileEnhanced(file, {
        addAuthHeaders: true, // Add if your files require authentication
        useProxy: false, // Set to true if you have a proxy endpoint
      });
      toast.success('File downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download file');
    }
  };

  return (
    <div className='mb-6'>
      <label className='block text-gray-700 mb-2 font-medium'>
        {label}
        {required && <span className='text-red-500 ml-1'>*</span>}
      </label>

      {/* Upload Area - Only show if not read-only */}
      {!readOnly && (
        <div
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors mb-4 ${
            error
              ? 'border-red-500 bg-red-50'
              : uploading
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className='flex items-center justify-center'>
              <Loader2 className='w-8 h-8 animate-spin text-blue-500 mr-2' />
              <span className='text-blue-600'>Uploading...</span>
            </div>
          ) : (
            <>
              <Upload className='w-12 h-12 mx-auto text-gray-400 mb-2' />
              <p className='text-gray-500 text-sm mb-1'>
                Click to upload {fieldType === 'image' ? 'images' : 'files'}
                {multiple && ' (multiple files allowed)'}
              </p>
              <p className='text-gray-400 text-xs'>
                {fieldType === 'image'
                  ? 'PNG, JPG, GIF up to 10MB'
                  : accept
                  ? `Accepted: ${accept}`
                  : 'Any file type up to 25MB'}
              </p>
            </>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type='file'
        multiple={multiple}
        accept={accept}
        onChange={handleFileSelect}
        className='hidden'
        disabled={uploading || readOnly}
      />

      {/* File Manager for displaying uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className='mt-4'>
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
          />
        </div>
      )}

      {/* Help Text */}
      {helpText && <div className='text-sm text-gray-500 mt-2'>{helpText}</div>}

      {/* Error Message */}
      {error && (
        <div className='text-sm text-red-600 mt-2 flex items-center'>
          <span className='w-4 h-4 mr-1'>⚠️</span>
          {error}
        </div>
      )}

      {/* Upload Instructions */}
      {uploadedFiles.length === 0 && !readOnly && (
        <div className='text-xs text-gray-400 mt-2 text-center'>
          {fieldType === 'image'
            ? 'Upload images to see preview, download, and manage options'
            : 'Upload files to see preview, download, and manage options'}
        </div>
      )}
    </div>
  );
}
