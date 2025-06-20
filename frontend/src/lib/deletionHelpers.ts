// src/utils/deletionHelpers.ts - Utility Functions for Deletion Operations
import { toast } from 'sonner';

export interface DeletionProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
}

export interface DeletionResult {
  success: boolean;
  details: {
    itemsProcessed: number;
    itemsDeleted: number;
    itemsFailed: number;
    filesDeleted: number;
    filesFailed: number;
    errors: string[];
  };
}

/**
 * Create enhanced confirmation dialog for deletions
 */
export const createDeletionConfirmation = (
  type: 'form' | 'submission' | 'file',
  items: Array<{
    id: string;
    name?: string;
    submissions?: number;
    files?: number;
  }>
): string => {
  const count = items.length;
  const isPlural = count > 1;

  if (type === 'form') {
    const totalSubmissions = items.reduce(
      (sum, item) => sum + (item.submissions || 0),
      0
    );
    const totalFiles = items.reduce((sum, item) => sum + (item.files || 0), 0);

    const itemList =
      count <= 3
        ? items.map(item => `• "${item.name}"`).join('\n')
        : `• "${items[0].name}"\n• "${items[1].name}"\n• and ${
            count - 2
          } more...`;

    return ` PERMANENT DELETION WARNING \n\nThis will permanently delete:\n\n${itemList}\n\n📊 Impact:\n• ${count} form${
      isPlural ? 's' : ''
    }\n• ${totalSubmissions} submission${
      totalSubmissions === 1 ? '' : 's'
    }\n• ${totalFiles} file${
      totalFiles === 1 ? '' : 's'
    } from cloud storage\n• All form logos and assets\n\nTHIS ACTION CANNOT BE UNDONE\nAll data will be permanently removed from our servers.\n`;
  }

  if (type === 'submission') {
    const totalFiles = items.reduce((sum, item) => sum + (item.files || 0), 0);

    return ` PERMANENT DELETION WARNING \n\nThis will permanently delete:\n• ${count} submission${
      isPlural ? 's' : ''
    }\n• ${totalFiles} associated file${
      totalFiles === 1 ? '' : 's'
    } from storage\n• All submission data\n\nTHIS ACTION CANNOT BE UNDONE\nAll files will be permanently removed from cloud storage.\n\nAre you sure you want to continue?`;
  }

  if (type === 'file') {
    const fileList =
      count <= 5
        ? items.map(item => `• ${item.name}`).join('\n')
        : `• ${items[0].name}\n• ${items[1].name}\n• and ${
            count - 2
          } more files...`;

    return ` FILE DELETION WARNING \n\nThis will permanently delete:\n\n${fileList}\n\nTHIS ACTION CANNOT BE UNDONE\nFile${
      isPlural ? 's' : ''
    } will be permanently removed from cloud storage.\n\nAre you sure you want to continue?`;
  }

  return 'Are you sure you want to delete this item?';
};

/**
 * Show progress toast for long-running deletion operations
 */
export const showDeletionProgress = (
  progress: DeletionProgress,
  type: 'form' | 'submission' | 'file'
): string => {
  const remainingCount = progress.total - progress.completed - progress.failed;

  const title = `Deleting ${type}${progress.total > 1 ? 's' : ''}... (${
    progress.completed + progress.failed
  }/${progress.total})`;
  const description = [
    `${progress.completed} completed`,
    progress.failed > 0 ? `${progress.failed} failed` : '',
    remainingCount > 0 ? `${remainingCount} remaining` : '',
    progress.current ? `Current: ${progress.current}` : '',
  ]
    .filter(Boolean)
    .join(' • ');

  return String(
    toast.loading(title, {
      description,
      duration: 0, // Don't auto-dismiss
    })
  );
};

/**
 * Show final deletion results
 */
export const showDeletionResults = (
  result: DeletionResult,
  type: 'form' | 'submission' | 'file'
): void => {
  const { details } = result;
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  if (
    details.itemsDeleted === details.itemsProcessed &&
    details.filesFailed === 0
  ) {
    // Complete success
    toast.success(
      `${typeLabel}${details.itemsDeleted > 1 ? 's' : ''} Successfully Deleted`,
      {
        description: [
          `${details.itemsDeleted} ${type}${
            details.itemsDeleted > 1 ? 's' : ''
          } removed`,
          details.filesDeleted > 0
            ? `${details.filesDeleted} files deleted from storage`
            : '',
          'All data permanently removed',
        ]
          .filter(Boolean)
          .join(' • '),
        duration: 1000,
      }
    );
  } else {
    // Complete failure
    toast.error('Deletion Failed', {
      description: [
        `Failed to delete any ${type}s`,
        details.errors.length > 0 ? `Error: ${details.errors[0]}` : '',
        'Please try again or contact support',
      ]
        .filter(Boolean)
        .join(' • '),
      duration: 12000,
    });
  }
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate deletion permissions
 */
export const validateDeletionPermissions = (
  user: any,
  items: Array<{ userId?: string; ownerId?: string }>
): { canDelete: boolean; unauthorizedCount: number } => {
  if (!user?.id) {
    return { canDelete: false, unauthorizedCount: items.length };
  }

  const unauthorizedItems = items.filter(
    item => item.userId !== user.id && item.ownerId !== user.id
  );

  return {
    canDelete: unauthorizedItems.length === 0,
    unauthorizedCount: unauthorizedItems.length,
  };
};

/**
 * Estimate deletion time based on item count and file sizes
 */
export const estimateDeletionTime = (
  itemCount: number,
  fileCount: number,
  totalFileSize: number
): string => {
  // Base time per item (database operations)
  const baseTimePerItem = 0.5; // seconds

  // Time per file (Cloudinary API calls)
  const timePerFile = 0.3; // seconds

  // Additional time for large files
  const largeSizeBonus = totalFileSize > 100 * 1024 * 1024 ? 5 : 0; // 5 seconds for >100MB

  const estimatedSeconds =
    itemCount * baseTimePerItem + fileCount * timePerFile + largeSizeBonus;

  if (estimatedSeconds < 5) return 'Less than 5 seconds';
  if (estimatedSeconds < 30) return 'Less than 30 seconds';
  if (estimatedSeconds < 60) return 'About 1 minute';
  if (estimatedSeconds < 120) return 'About 2 minutes';

  const minutes = Math.ceil(estimatedSeconds / 60);
  return `About ${minutes} minutes`;
};
