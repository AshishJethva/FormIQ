// src/components/form-builder/FileManager.tsx - Comprehensive File Management Component
'use client';

import React, { useState, useCallback } from 'react';
import {
  Download,
  Trash2,
  Eye,
  ExternalLink,
  ZoomIn,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Calendar,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Image from 'next/image';
import { formatFileSize } from '@/services/fileUploadService';

// ===== INTERFACES =====
export interface FileData {
  originalName: string;
  fileName: string;
  url: string;
  publicId: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  dimensions?: { width: number; height: number };
}

export interface FileManagerProps {
  files: FileData | FileData[];
  fieldLabel?: string;
  fieldId?: string;
  submissionId?: string;
  showActions?: boolean;
  onFileDelete?: (file: FileData) => Promise<void>;
  onFileDownload?: (file: FileData) => Promise<void>;
  onFileView?: (file: FileData) => void;
  readOnly?: boolean;
  compact?: boolean;
  maxPreviewSize?: number;
}

export interface FilePreviewProps {
  file: FileData;
  onClose: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  showActions?: boolean;
}

export interface FileCardProps {
  file: FileData;
  onView?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  compact?: boolean;
  readOnly?: boolean;
}

// ===== UTILITY FUNCTIONS =====
const getFileIcon = (mimeType: string, size: 'sm' | 'md' | 'lg' = 'md') => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const iconClass = sizeClasses[size];

  if (mimeType.startsWith('image/')) {
    return <ImageIcon className={`${iconClass} text-blue-500`} />;
  } else if (mimeType.startsWith('video/')) {
    return <Video className={`${iconClass} text-purple-500`} />;
  } else if (mimeType.startsWith('audio/')) {
    return <Music className={`${iconClass} text-green-500`} />;
  } else if (mimeType.includes('pdf')) {
    return <FileText className={`${iconClass} text-red-500`} />;
  } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
    return <Archive className={`${iconClass} text-orange-500`} />;
  } else {
    return <FileText className={`${iconClass} text-gray-500`} />;
  }
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown date';
  }
};

const downloadFile = async (file: FileData): Promise<void> => {
  try {
    console.log('📥 Starting file download:', {
      name: file.originalName,
      url: file.url,
      mimeType: file.mimeType,
    });

    // Method 1: Try direct download with fetch
    try {
      const response = await fetch(file.url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = file.originalName || 'download';
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up the blob URL
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 100);

      console.log('✅ File downloaded successfully via fetch');
      return;
    } catch (fetchError) {
      console.warn('⚠️ Fetch download failed, trying direct link:', fetchError);

      // Method 2: Fallback to direct link download
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.originalName || 'download';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      console.log('✅ File download initiated via direct link');
    }
  } catch (error) {
    console.error('❌ Download error:', error);
    throw new Error(
      `Failed to download file: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};

// Enhanced PDF URL preparation
const preparePdfUrl = (url: string): string => {
  try {
    // Add cache busting and PDF viewing parameters
    const urlObj = new URL(url);
    urlObj.searchParams.set('_t', Date.now().toString());
    urlObj.searchParams.set('view', 'FitH'); // PDF viewing parameter
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return original with cache buster
    return `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
  }
};

const PDFViewer: React.FC<{ url: string; fileName: string }> = ({
  url,
  fileName,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const preparedUrl = preparePdfUrl(url);

  const handleLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleError = () => {
    setLoading(false);
    setError('Failed to load PDF document');
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setRetryCount(prev => prev + 1);
  };

  const openInNewTab = () => {
    window.open(preparedUrl, '_blank', 'noopener,noreferrer');
  };

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center bg-gray-100 rounded-lg p-8 min-h-[400px]'>
        <AlertTriangle className='w-16 h-16 text-orange-500 mb-4' />
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          PDF Preview Unavailable
        </h3>
        <p className='text-gray-600 mb-4 text-center'>
          Unable to display PDF preview. This might be due to browser
          restrictions or file permissions.
        </p>
        <div className='flex space-x-3'>
          <Button onClick={handleRetry} variant='outline'>
            <RefreshCw className='w-4 h-4 mr-2' />
            Retry Preview
          </Button>
          <Button
            onClick={openInNewTab}
            className='bg-red-500 hover:bg-red-600'
          >
            <ExternalLink className='w-4 h-4 mr-2' />
            Open PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='relative bg-gray-100 rounded-lg overflow-hidden min-h-[400px]'>
      {loading && (
        <div className='absolute inset-0 flex items-center justify-center bg-gray-100 z-10'>
          <div className='text-center'>
            <Loader2 className='w-8 h-8 animate-spin text-blue-500 mx-auto mb-2' />
            <p className='text-gray-600'>Loading PDF...</p>
          </div>
        </div>
      )}

      <iframe
        key={`pdf-${retryCount}`} // Force re-render on retry
        src={`${preparedUrl}#view=FitH&toolbar=1&navpanes=1&scrollbar=1`}
        className='w-full h-[70vh] border-0'
        title={`PDF Viewer - ${fileName}`}
        onLoad={handleLoad}
        onError={handleError}
        sandbox='allow-scripts allow-same-origin allow-presentation'
      />

      {!loading && (
        <div className='absolute top-4 right-4'>
          <Button
            onClick={openInNewTab}
            size='sm'
            className='bg-red-500 hover:bg-red-600 text-white shadow-lg'
          >
            <ExternalLink className='w-4 h-4 mr-1' />
            Open
          </Button>
        </div>
      )}
    </div>
  );
};

const FilePreviewModal: React.FC<FilePreviewProps> = ({
  file,
  onClose,
  onDelete,
  onDownload,
  showActions = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');
  const isAudio = file.mimeType.startsWith('audio/');
  const isPdf = file.mimeType.includes('pdf');

  const handleDownload = async () => {
    setLoading(true);
    try {
      if (onDownload) {
        await onDownload();
      } else {
        await downloadFile(file);
      }
      toast.success('File downloaded successfully');
    } catch (error: any) {
      console.error('Download failed:', error);
      toast.error(error.message || 'Failed to download file');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      setLoading(true);
      try {
        await onDelete();
        onClose();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete file');
      } finally {
        setLoading(false);
      }
    }
  };

  const renderPreview = () => {
    if (isImage && !imageError) {
      return (
        <div className='flex items-center justify-center rounded-lg p-4 bg-white'>
          <Image
            src={file.url}
            alt={file.originalName}
            width={800}
            height={600}
            className='max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg'
            onError={() => setImageError(true)}
            priority
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className='flex items-center justify-center bg-gray-100 rounded-lg p-4'>
          <video
            controls
            className='max-w-full max-h-[60vh] rounded-lg shadow-lg'
            preload='metadata'
          >
            <source src={file.url} type={file.mimeType} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className='flex items-center justify-center bg-gray-100 rounded-lg p-8'>
          <div className='text-center'>
            <Music className='w-16 h-16 text-green-500 mx-auto mb-4' />
            <audio controls className='w-full max-w-md'>
              <source src={file.url} type={file.mimeType} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        </div>
      );
    }

    if (isPdf) {
      return <PDFViewer url={file.url} fileName={file.originalName} />;
    }

    // Default preview for other file types
    return (
      <div className='flex items-center justify-center bg-gray-100 rounded-lg p-8'>
        <div className='text-center'>
          {getFileIcon(file.mimeType, 'lg')}
          <p className='text-gray-600 mt-4 mb-4'>
            Preview not available for this file type
          </p>
          <Button
            onClick={() => window.open(file.url, '_blank')}
            variant='outline'
          >
            <ExternalLink className='w-4 h-4 mr-2' />
            Open File
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className='max-w-6xl max-h-[95vh] p-0 overflow-hidden bg-white'>
        <DialogHeader className='px-6 py-4 border-b'>
          <DialogTitle className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              {getFileIcon(file.mimeType)}
              <div>
                <p className='font-semibold'>{file.originalName}</p>
                <p className='text-sm text-gray-500'>
                  {formatFileSize(file.size)} • {file.mimeType}
                </p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className='px-6 py-4 overflow-y-auto'>{renderPreview()}</div>

        {showActions && (
          <DialogFooter className='px-6 py-4 border-t bg-gray-50'>
            <div className='flex items-center justify-between w-full'>
              <div className='text-sm text-gray-500'>
                Uploaded: {formatDate(file.uploadedAt)}
              </div>
              <div className='flex space-x-2'>
                <Button
                  variant='outline'
                  onClick={handleDownload}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  ) : (
                    <Download className='w-4 h-4 mr-2' />
                  )}
                  Download
                </Button>
                {onDelete && (
                  <Button
                    variant='destructive'
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    ) : (
                      <Trash2 className='w-4 h-4 mr-2' />
                    )}
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ===== FILE CARD COMPONENT =====
const FileCard: React.FC<FileCardProps> = ({
  file,
  onView,
  onDownload,
  onDelete,
  showActions = true,
  compact = false,
  readOnly = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isImage = file.mimeType.startsWith('image/');

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      if (onDownload) {
        await onDownload();
      } else {
        await downloadFile(file);
      }
      toast.success('File downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download file');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      setLoading(true);
      try {
        await onDelete();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete file');
      } finally {
        setLoading(false);
      }
    }
  };

  if (compact) {
    return (
      <div className='flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3'>
        <div className='flex items-center space-x-3 flex-1 min-w-0'>
          <div className='flex-shrink-0'>
            {isImage && !imageError ? (
              <Image
                src={file.url}
                alt={file.originalName}
                width={32}
                height={32}
                className='w-8 h-8 object-cover rounded cursor-pointer'
                onClick={onView}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className='w-8 h-8 bg-gray-100 rounded flex items-center justify-center border'>
                {getFileIcon(file.mimeType, 'sm')}
              </div>
            )}
          </div>
          <div className='flex-1 min-w-0'>
            <p
              className='text-sm font-medium text-gray-900 truncate cursor-pointer'
              onClick={onView}
              title={file.originalName}
            >
              {file.originalName}
            </p>
            <p className='text-xs text-gray-500'>{formatFileSize(file.size)}</p>
          </div>
        </div>

        {showActions && !readOnly && (
          <div className='flex items-center space-x-1 flex-shrink-0'>
            <Button variant='ghost' size='sm' onClick={onView} className='p-1'>
              <Eye className='w-4 h-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleDownload}
              className='p-1'
              disabled={loading}
            >
              {loading ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <Download className='w-4 h-4' />
              )}
            </Button>
            {onDelete && (
              <Button
                variant='ghost'
                size='sm'
                onClick={handleDelete}
                className='p-1 text-red-600 hover:text-red-700 hover:bg-red-50'
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : (
                  <Trash2 className='w-4 h-4' />
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className='overflow-hidden hover:shadow-md transition-shadow'>
      <CardContent className='p-0'>
        {/* Preview Section */}
        <div className='relative'>
          {isImage && !imageError ? (
            <div className='aspect-video bg-gray-100 relative overflow-hidden'>
              <Image
                src={file.url}
                alt={file.originalName}
                fill
                className='object-cover cursor-pointer hover:scale-105 transition-transform'
                onClick={onView}
                onError={() => setImageError(true)}
              />
              <div className='absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all cursor-pointer flex items-center justify-center'>
                <ZoomIn className='w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity' />
              </div>
            </div>
          ) : (
            <div
              className='aspect-video bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors'
              onClick={onView}
            >
              {getFileIcon(file.mimeType, 'lg')}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className='p-4'>
          <div className='flex items-start justify-between'>
            <div className='flex-1 min-w-0'>
              <h3
                className='text-sm font-medium text-gray-900 truncate cursor-pointer'
                onClick={onView}
                title={file.originalName}
              >
                {file.originalName}
              </h3>
              <div className='flex items-center space-x-2 mt-1'>
                <Badge variant='secondary' className='text-xs'>
                  {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                </Badge>
                <span className='text-xs text-gray-500'>
                  {formatFileSize(file.size)}
                </span>
              </div>
              <div className='flex items-center space-x-1 mt-2 text-xs text-gray-500'>
                <Calendar className='w-3 h-3' />
                <span>{formatDate(file.uploadedAt)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && !readOnly && (
            <div className='flex items-center justify-between mt-4 pt-3 border-t border-gray-100'>
              <Button variant='outline' size='sm' onClick={onView}>
                <Eye className='w-4 h-4 mr-1' />
                View
              </Button>
              <div className='flex space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleDownload}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    <Download className='w-4 h-4' />
                  )}
                </Button>
                {onDelete && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleDelete}
                    disabled={loading}
                    className='text-red-600 hover:text-red-700 hover:bg-red-50'
                  >
                    {loading ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : (
                      <Trash2 className='w-4 h-4' />
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ===== MAIN FILE MANAGER COMPONENT =====
const FileManager: React.FC<FileManagerProps> = ({
  files,
  fieldLabel,
  showActions = true,
  onFileDelete,
  onFileDownload,
  onFileView,
  readOnly = false,
  compact = false,
  maxPreviewSize = 4,
}) => {
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileData | null>(null);
  const [deletingFile, setDeletingFile] = useState(false);

  const fileArray = Array.isArray(files) ? files : files ? [files] : [];

  const handleFileView = useCallback(
    (file: FileData) => {
      if (onFileView) {
        onFileView(file);
      } else {
        setPreviewFile(file);
      }
    },
    [onFileView]
  );

  const handleFileDownload = useCallback(
    async (file: FileData) => {
      try {
        if (onFileDownload) {
          await onFileDownload(file);
        } else {
          await downloadFile(file);
        }
      } catch (error: any) {
        console.error('Download failed:', error);
        throw error; // Re-throw to be handled by the calling component
      }
    },
    [onFileDownload]
  );

  const confirmDelete = useCallback((file: FileData) => {
    setFileToDelete(file);
    setShowDeleteDialog(true);
  }, []);

  const handleFileDelete = useCallback(async () => {
    if (!fileToDelete || !onFileDelete) return;

    setDeletingFile(true);
    try {
      await onFileDelete(fileToDelete);
      setShowDeleteDialog(false);
      setFileToDelete(null);
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Delete failed:', error);
    } finally {
      setDeletingFile(false);
    }
  }, [fileToDelete, onFileDelete]);

  if (fileArray.length === 0) {
    return (
      <div className='text-center py-8 text-gray-500'>
        <FileText className='w-12 h-12 mx-auto mb-2 text-gray-300' />
        <p>No files attached</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {fieldLabel && (
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-medium text-gray-900'>
            {fieldLabel}
            {fileArray.length > 1 && (
              <Badge variant='secondary' className='ml-2'>
                {fileArray.length} files
              </Badge>
            )}
          </h3>
          {!readOnly && showActions && fileArray.length > 0 && (
            <div className='text-sm text-gray-500'>
              Total size:{' '}
              {formatFileSize(
                fileArray.reduce((sum, file) => sum + file.size, 0)
              )}
            </div>
          )}
        </div>
      )}

      {compact ? (
        <div className='space-y-2'>
          {fileArray.slice(0, maxPreviewSize).map((file, index) => (
            <FileCard
              key={file.publicId || index}
              file={file}
              onView={() => handleFileView(file)}
              onDownload={() => handleFileDownload(file)}
              onDelete={onFileDelete ? () => confirmDelete(file) : undefined}
              showActions={showActions}
              compact={true}
              readOnly={readOnly}
            />
          ))}
          {fileArray.length > maxPreviewSize && (
            <div className='text-center py-2'>
              <Button variant='outline' size='sm'>
                Show {fileArray.length - maxPreviewSize} more files
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {fileArray.map((file, index) => (
            <FileCard
              key={file.publicId || index}
              file={file}
              onView={() => handleFileView(file)}
              onDownload={() => handleFileDownload(file)}
              onDelete={onFileDelete ? () => confirmDelete(file) : undefined}
              showActions={showActions}
              compact={false}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={() => handleFileDownload(previewFile)}
          onDelete={onFileDelete ? () => confirmDelete(previewFile) : undefined}
          showActions={showActions && !readOnly}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className='bg-white'>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{fileToDelete?.originalName}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingFile}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFileDelete}
              disabled={deletingFile}
              className='bg-red-600 hover:bg-red-700'
            >
              {deletingFile ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className='w-4 h-4 mr-2' />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FileManager;
export { FileCard, FilePreviewModal, PDFViewer };

// Form submission with files failed: Error: Request failed with status code 400