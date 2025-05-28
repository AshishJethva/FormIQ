// src/hooks/useAutoSave.ts
import { apiConfig } from '@/config/api';
import axios from 'axios';
import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface AutoSaveOptions {
  delay?: number; // Delay in milliseconds before saving
  enableToast?: boolean; // Show success/error toasts
  retryAttempts?: number; // Number of retry attempts on failure
  onSaveSuccess?: (data: any) => void;
  onSaveError?: (error: any) => void;
  forceUpdatePublished?: boolean;
}

interface AutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  forceSave: () => Promise<void>;
  retryCount: number;
}

// Enhanced Auto-save hook with better persistence
const useAutoSave = (
  formData: any,
  formId: string,
  isEnabled: boolean = true,
  options: AutoSaveOptions = {}
): AutoSaveReturn => {
  const {
    delay = 1000,
    enableToast = false,
    retryAttempts = 3,
    onSaveSuccess,
    onSaveError,
    forceUpdatePublished = false,
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>('');
  const saveInProgressRef = useRef(false);
  const hasInitialDataRef = useRef(false);

  const performSave = useCallback(
    async (attempt = 1): Promise<void> => {
      if (!formData || !formId || saveInProgressRef.current) return;

      // Don't save if this is the initial load (form just loaded from backend)
      if (!hasInitialDataRef.current) {
        hasInitialDataRef.current = true;
        return;
      }

      try {
        saveInProgressRef.current = true;
        setIsSaving(true);
        setSaveError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Prepare the data to save - only include fields that should be persisted
        const saveData = {
          title: formData.title,
          description: formData.description,
          pages: formData.pages || [],
          selectedFieldId: null,
          selectedPageId: formData.selectedPageId,
          currentPageIndex: formData.currentPageIndex || 0,
          propertiesPanelOpen: false,
          logo: formData.logo,
          settings: formData.settings || {
            submitButtonText: 'Submit',
            defaultLabelAlignment: 'LEFT',
            thankyouMessage: 'Thank you for your submission!',
            defaultRequiredField: false,
            showLogo: false,
          },
        };

        console.log('Auto-saving form data:', {
          formId,
          pageCount: saveData.pages.length,
          currentPageIndex: saveData.currentPageIndex,
        });

        const response = await axios.put(
          `${apiConfig.url}/forms/${formId}`,
          saveData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 second timeout
          }
        );

        // If this is a published form, invalidate any cached versions
        if (formData.isPublished || forceUpdatePublished) {
          console.log(
            '🔄 Form is published - changes will be immediately visible'
          );
        }

        // Success
        setLastSaved(new Date());
        setRetryCount(0);

        if (enableToast && formData.isPublished) {
          toast.success('Changes saved - published form updated!');
        } else if (enableToast) {
          toast.success('Changes saved automatically');
        }

        if (onSaveSuccess) {
          onSaveSuccess(response.data);
        }

        console.log('Form auto-saved successfully');
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          'Failed to save changes';
        setSaveError(errorMessage);
        setRetryCount(attempt);

        console.error(`Auto-save failed (attempt ${attempt}):`, error);

        // Retry logic with exponential backoff
        if (attempt < retryAttempts) {
          console.log(`Retrying auto-save in ${attempt * 2} seconds...`);
          setTimeout(() => {
            performSave(attempt + 1);
          }, attempt * 1000);
        } else {
          if (enableToast) {
            toast.error(`Failed to save changes: ${errorMessage}`);
          }

          if (onSaveError) {
            onSaveError(error);
          }
        }
      } finally {
        setIsSaving(false);
        saveInProgressRef.current = false;
      }
    },
    [
      formData,
      formId,
      enableToast,
      retryAttempts,
      onSaveSuccess,
      onSaveError,
      forceUpdatePublished,
    ]
  );

  // Auto-save effect
  useEffect(() => {
    if (!isEnabled || !formData || !formId) return;

    // Create a stable string representation of the form data for comparison
    const currentDataString = JSON.stringify({
      title: formData.title,
      description: formData.description,
      pages: formData.pages,
      currentPageIndex: formData.currentPageIndex,
      logo: formData.logo,
      settings: formData.settings,
    });

    // Only save if data has actually changed
    if (currentDataString === lastDataRef.current) return;

    lastDataRef.current = currentDataString;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      if (hasInitialDataRef.current) {
        performSave();
      }
    }, delay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, formId, isEnabled, delay, performSave]);

  // Mark as ready for auto-save after initial load
  useEffect(() => {
    if (formData && formId && !hasInitialDataRef.current) {
      // Wait a bit before marking as ready to avoid saving on initial load
      const timer = setTimeout(() => {
        hasInitialDataRef.current = true;
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [formData, formId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    lastSaved,
    saveError,
    forceSave: performSave,
    retryCount,
  };
};

export default useAutoSave;
