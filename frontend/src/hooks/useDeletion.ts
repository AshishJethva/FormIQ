// src/hooks/useDeletion.ts - Custom Hook for Deletion Operations
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  DeletionProgress,
  DeletionResult,
  showDeletionResults,
  createDeletionConfirmation,
} from '@/lib/deletionHelpers';

export interface UseDeletionOptions {
  type: 'form' | 'submission' | 'file';
  onSuccess?: (result: DeletionResult) => void;
  onError?: (error: Error) => void;
  requireConfirmation?: boolean;
}

export const useDeletion = (options: UseDeletionOptions) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState<DeletionProgress | null>(null);

  const confirmDeletion = useCallback(
    (
      items: Array<{
        id: string;
        name?: string;
        submissions?: number;
        files?: number;
      }>
    ) => {
      if (!options.requireConfirmation) return true;

      const confirmationMessage = createDeletionConfirmation(
        options.type,
        items
      );
      return window.confirm(confirmationMessage);
    },
    [options.type, options.requireConfirmation]
  );

  const deleteItems = useCallback(
    async (
      items: Array<{ id: string; name?: string }>,
      deleteFunction: (id: string) => Promise<any>
    ) => {
      if (isDeleting) return;

      try {
        setIsDeleting(true);
        setProgress({ total: items.length, completed: 0, failed: 0 });

        const result: DeletionResult = {
          success: false,
          details: {
            itemsProcessed: items.length,
            itemsDeleted: 0,
            itemsFailed: 0,
            filesDeleted: 0,
            filesFailed: 0,
            errors: [],
          },
        };

        // Process deletions
        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          // Update progress
          const currentProgress = {
            total: items.length,
            completed: i,
            failed: result.details.itemsFailed,
            current: item.name || item.id,
          };
          setProgress(currentProgress);

          try {
            const deleteResult = await deleteFunction(item.id);

            result.details.itemsDeleted++;
            if (deleteResult.details?.filesDeleted) {
              result.details.filesDeleted += deleteResult.details.filesDeleted;
            }
            if (deleteResult.details?.filesFailed) {
              result.details.filesFailed += deleteResult.details.filesFailed;
            }
          } catch (error: any) {
            result.details.itemsFailed++;
            result.details.errors.push(
              `${item.name || item.id}: ${error.message}`
            );
          }
        }

        // Determine overall success
        result.success = result.details.itemsDeleted > 0;

        // Show results
        showDeletionResults(result, options.type);

        // Call callbacks
        if (result.success && options.onSuccess) {
          options.onSuccess(result);
        } else if (!result.success && options.onError) {
          options.onError(new Error('Deletion failed'));
        }

        return result;
      } catch (error: any) {
        console.error('❌ Deletion process failed:', error);
        toast.error('Deletion Process Failed', {
          description: error.message || 'An unexpected error occurred',
          duration: 10000,
        });

        if (options.onError) {
          options.onError(error);
        }

        throw error;
      } finally {
        setIsDeleting(false);
        setProgress(null);
      }
    },
    [isDeleting, options]
  );

  return {
    isDeleting,
    progress,
    confirmDeletion,
    deleteItems,
  };
};

export default useDeletion;
