// // src/hooks/useAutoSave.ts
// import { apiConfig } from '@/config/api';
// import axios from 'axios';
// import { useEffect, useRef, useState } from 'react';
// import { toast } from 'sonner';

// // Auto-save hook
// const useAutoSave = (
//   formData: any,
//   formId: string,
//   isEnabled: boolean = true
// ) => {
//   const [isSaving, setIsSaving] = useState(false);
//   const [lastSaved, setLastSaved] = useState<Date | null>(null);
//   const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const lastDataRef = useRef<string>('');

//   useEffect(() => {
//     if (!isEnabled || !formData || !formId) return;

//     const currentDataString = JSON.stringify(formData);

//     // Only save if data has actually changed
//     if (currentDataString === lastDataRef.current) return;

//     lastDataRef.current = currentDataString;

//     // Clear existing timeout
//     if (saveTimeoutRef.current) {
//       clearTimeout(saveTimeoutRef.current);
//     }

//     // Set new timeout for auto-save (2 seconds after last change)
//     saveTimeoutRef.current = setTimeout(async () => {
//       try {
//         setIsSaving(true);

//         const token = localStorage.getItem('token');
//         await axios.put(
//           `${apiConfig.url}/forms/${formId}`,
//           {
//             title: formData.title,
//             description: formData.description,
//             pages: formData.pages,
//             selectedFieldId: formData.selectedFieldId,
//             selectedPageId: formData.selectedPageId,
//             currentPageIndex: formData.currentPageIndex,
//             propertiesPanelOpen: formData.propertiesPanelOpen,
//             logo: formData.logo,
//             settings: formData.settings,
//           },
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               'Content-Type': 'application/json',
//             },
//           }
//         );

//         setLastSaved(new Date());
//         console.log('Form auto-saved successfully');
//       } catch (error) {
//         console.error('Auto-save failed:', error);
//         toast.error('Failed to auto-save form changes');
//       } finally {
//         setIsSaving(false);
//       }
//     }, 1000);

//     return () => {
//       if (saveTimeoutRef.current) {
//         clearTimeout(saveTimeoutRef.current);
//       }
//     };
//   }, [formData, formId, isEnabled]);

//   return { isSaving, lastSaved };
// };

// export default useAutoSave;

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
}

interface AutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  forceSave: () => Promise<void>;
  retryCount: number;
}

// Enhanced Auto-save hook
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
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>('');
  const saveInProgressRef = useRef(false);

  const performSave = useCallback(
    async (attempt = 1): Promise<void> => {
      if (!formData || !formId || saveInProgressRef.current) return;

      try {
        saveInProgressRef.current = true;
        setIsSaving(true);
        setSaveError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Prepare the data to save
        const saveData = {
          title: formData.title,
          description: formData.description,
          pages: formData.pages,
          selectedFieldId: formData.selectedFieldId,
          selectedPageId: formData.selectedPageId,
          currentPageIndex: formData.currentPageIndex,
          propertiesPanelOpen: formData.propertiesPanelOpen,
          logo: formData.logo,
          settings: formData.settings,
        };

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

        // Success
        setLastSaved(new Date());
        setRetryCount(0);

        if (enableToast) {
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

        // Retry logic
        if (attempt < retryAttempts) {
          console.log(`Retrying auto-save in ${attempt * 2} seconds...`);
          setTimeout(() => {
            performSave(attempt + 1);
          }, attempt * 2000); // Exponential backoff
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
    [formData, formId, enableToast, retryAttempts, onSaveSuccess, onSaveError]
  );

  // Force save function
  const forceSave = useCallback(async (): Promise<void> => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await performSave();
  }, [performSave]);

  useEffect(() => {
    if (!isEnabled || !formData || !formId) return;

    const currentDataString = JSON.stringify(formData);

    // Only save if data has actually changed
    if (currentDataString === lastDataRef.current) return;

    lastDataRef.current = currentDataString;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, delay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, formId, isEnabled, delay, performSave]);

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
    forceSave,
    retryCount,
  };
};

export default useAutoSave;
