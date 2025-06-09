// src/components/form-builder/canvas/FileUploadField.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
    console.log('🔍 Validating file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      accept,
      fieldType,
    });

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

    console.log(' File validation passed');
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

    console.log('📁 Files selected:', files.length);

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
      for (const file of Array.from(files)) {
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
        console.log(`📤 Uploading: ${file.name}`);
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
                  : accept && accept !== '*/*' && accept !== '*'
                  ? `Accepted: ${accept}`
                  : 'Any file type up to 25MB'}
              </p>
            </>
          )}
        </div>
      )}

      {/* Hidden File Input - : Better accept handling */}
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
            downloadingFileId={downloadingFileId}
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
