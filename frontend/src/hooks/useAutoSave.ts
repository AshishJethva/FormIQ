// // src/hooks/useAutoSave.ts
// import { apiConfig } from '@/config/api';
// import axios from 'axios';
// import { useEffect, useRef, useState, useCallback } from 'react';
// import { toast } from 'sonner';

// interface AutoSaveOptions {
//   delay?: number; // Delay in milliseconds before saving
//   enableToast?: boolean; // Show success/error toasts
//   retryAttempts?: number; // Number of retry attempts on failure
//   onSaveSuccess?: (data: any) => void;
//   onSaveError?: (error: any) => void;
//   forceUpdatePublished?: boolean;
// }

// interface AutoSaveReturn {
//   isSaving: boolean;
//   lastSaved: Date | null;
//   saveError: string | null;
//   forceSave: () => Promise<void>;
//   retryCount: number;
// }

// // Enhanced Auto-save hook with better persistence
// const useAutoSave = (
//   formData: any,
//   formId: string,
//   isEnabled: boolean = true,
//   options: AutoSaveOptions = {}
// ): AutoSaveReturn => {
//   const {
//     delay = 1000,
//     enableToast = false,
//     retryAttempts = 3,
//     onSaveSuccess,
//     onSaveError,
//     forceUpdatePublished = false,
//   } = options;

//   const [isSaving, setIsSaving] = useState(false);
//   const [lastSaved, setLastSaved] = useState<Date | null>(null);
//   const [saveError, setSaveError] = useState<string | null>(null);
//   const [retryCount, setRetryCount] = useState(0);

//   const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const lastDataRef = useRef<string>('');
//   const saveInProgressRef = useRef(false);
//   const hasInitialDataRef = useRef(false);

//   const performSave = useCallback(
//     async (attempt = 1): Promise<void> => {
//       if (!formData || !formId || saveInProgressRef.current) return;

//       // Don't save if this is the initial load (form just loaded from backend)
//       if (!hasInitialDataRef.current) {
//         hasInitialDataRef.current = true;
//         return;
//       }

//       try {
//         saveInProgressRef.current = true;
//         setIsSaving(true);
//         setSaveError(null);

//         const token = localStorage.getItem('token');
//         if (!token) {
//           throw new Error('Authentication token not found');
//         }

//         // Prepare the data to save - only include fields that should be persisted
//         const saveData = {
//           title: formData.title,
//           description: formData.description,
//           pages: formData.pages || [],
//           selectedFieldId: null,
//           selectedPageId: formData.selectedPageId,
//           currentPageIndex: formData.currentPageIndex || 0,
//           propertiesPanelOpen: false,
//           logo: formData.logo,
//           settings: formData.settings || {
//             submitButtonText: 'Submit',
//             defaultLabelAlignment: 'LEFT',
//             thankyouMessage: 'Thank you for your submission!',
//             defaultRequiredField: false,
//             showLogo: false,
//           },
//         };

//         console.log('Auto-saving form data:', {
//           formId,
//           pageCount: saveData.pages.length,
//           currentPageIndex: saveData.currentPageIndex,
//         });

//         const response = await axios.put(
//           `${apiConfig.url}/forms/${formId}`,
//           saveData,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               'Content-Type': 'application/json',
//             },
//             timeout: 30000, // 30 second timeout
//           }
//         );

//         // If this is a published form, invalidate any cached versions
//         if (formData.isPublished || forceUpdatePublished) {
//           console.log(
//             '🔄 Form is published - changes will be immediately visible'
//           );
//         }

//         // Success
//         setLastSaved(new Date());
//         setRetryCount(0);

//         if (enableToast && formData.isPublished) {
//           toast.success('Changes saved - published form updated!');
//         } else if (enableToast) {
//           toast.success('Changes saved automatically');
//         }

//         if (onSaveSuccess) {
//           onSaveSuccess(response.data);
//         }

//         console.log('Form auto-saved successfully');
//       } catch (error: any) {
//         const errorMessage =
//           error.response?.data?.message ||
//           error.message ||
//           'Failed to save changes';
//         setSaveError(errorMessage);
//         setRetryCount(attempt);

//         console.error(`Auto-save failed (attempt ${attempt}):`, error);

//         // Retry logic with exponential backoff
//         if (attempt < retryAttempts) {
//           console.log(`Retrying auto-save in ${attempt * 2} seconds...`);
//           setTimeout(() => {
//             performSave(attempt + 1);
//           }, attempt * 1000);
//         } else {
//           if (enableToast) {
//             toast.error(`Failed to save changes: ${errorMessage}`);
//           }

//           if (onSaveError) {
//             onSaveError(error);
//           }
//         }
//       } finally {
//         setIsSaving(false);
//         saveInProgressRef.current = false;
//       }
//     },
//     [
//       formData,
//       formId,
//       enableToast,
//       retryAttempts,
//       onSaveSuccess,
//       onSaveError,
//       forceUpdatePublished,
//     ]
//   );

//   // Auto-save effect
//   useEffect(() => {
//     if (!isEnabled || !formData || !formId) return;

//     // Create a stable string representation of the form data for comparison
//     const currentDataString = JSON.stringify({
//       title: formData.title,
//       description: formData.description,
//       pages: formData.pages,
//       currentPageIndex: formData.currentPageIndex,
//       logo: formData.logo,
//       settings: formData.settings,
//     });

//     // Only save if data has actually changed
//     if (currentDataString === lastDataRef.current) return;

//     lastDataRef.current = currentDataString;

//     // Clear existing timeout
//     if (saveTimeoutRef.current) {
//       clearTimeout(saveTimeoutRef.current);
//     }

//     // Set new timeout for auto-save
//     saveTimeoutRef.current = setTimeout(() => {
//       if (hasInitialDataRef.current) {
//         performSave();
//       }
//     }, delay);

//     return () => {
//       if (saveTimeoutRef.current) {
//         clearTimeout(saveTimeoutRef.current);
//       }
//     };
//   }, [formData, formId, isEnabled, delay, performSave]);

//   // Mark as ready for auto-save after initial load
//   useEffect(() => {
//     if (formData && formId && !hasInitialDataRef.current) {
//       // Wait a bit before marking as ready to avoid saving on initial load
//       const timer = setTimeout(() => {
//         hasInitialDataRef.current = true;
//       }, 1000);

//       return () => clearTimeout(timer);
//     }
//   }, [formData, formId]);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       if (saveTimeoutRef.current) {
//         clearTimeout(saveTimeoutRef.current);
//       }
//     };
//   }, []);

//   return {
//     isSaving,
//     lastSaved,
//     saveError,
//     forceSave: performSave,
//     retryCount,
//   };
// };

// export default useAutoSave;

// src/hooks/useAutoSave.ts - Clean Auto-save with proper data serialization
import { apiConfig } from '@/config/api';
import axios from 'axios';
import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface AutoSaveOptions {
  delay?: number;
  enableToast?: boolean;
  retryAttempts?: number;
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

  // Clean field serialization
  const serializeFormData = useCallback((data: any) => {
    if (!data) return {};

    const cleanPages = (data.pages || []).map((page: any) => ({
      id: page.id,
      fields: (page.fields || []).map((field: any) => {
        const baseField = {
          id: field.id,
          type: field.type,
          label: field.label,
          labelAlignment: field.labelAlignment || 'LEFT',
        };

        // Only add properties for non-heading fields
        if (field.type !== 'heading') {
          const cleanField: any = {
            ...baseField,
            required: Boolean(field.required),
            helpText: field.helpText || '',
          };

          // Add optional properties only if they exist
          if (field.placeholder) {
            cleanField.placeholder = String(field.placeholder);
          }

          if (field.options && Array.isArray(field.options)) {
            cleanField.options = field.options.map((option: any) => ({
              label: String(option.label || ''),
              value: String(option.value || ''),
              ...(option.type && { type: String(option.type) }),
            }));
          }

          if (field.defaultValue !== undefined) {
            cleanField.defaultValue = field.defaultValue;
          }

          // Text field properties
          if (field.minLength !== undefined) {
            cleanField.minLength = Number(field.minLength);
          }
          if (field.maxLength !== undefined) {
            cleanField.maxLength = Number(field.maxLength);
          }

          // Number field properties
          if (field.min !== undefined) {
            cleanField.min = Number(field.min);
          }
          if (field.max !== undefined) {
            cleanField.max = Number(field.max);
          }
          if (field.step !== undefined) {
            cleanField.step = Number(field.step);
          }

          // Textarea properties
          if (field.rows !== undefined) {
            cleanField.rows = Number(field.rows);
          }

          // File upload properties
          if (field.multiple !== undefined) {
            cleanField.multiple = Boolean(field.multiple);
          }
          if (field.accept !== undefined) {
            cleanField.accept = String(field.accept);
          }

          return cleanField;
        }

        // For heading fields, only return base properties
        return baseField;
      }),
    }));

    return {
      title: data.title,
      description: data.description,
      pages: cleanPages,
      selectedFieldId: null,
      selectedPageId: data.selectedPageId,
      currentPageIndex: data.currentPageIndex || 0,
      propertiesPanelOpen: false,
      logo: data.logo,
      settings: {
        submitButtonText: data.settings?.submitButtonText || 'Submit',
        defaultLabelAlignment: data.settings?.defaultLabelAlignment || 'LEFT',
        thankyouMessage:
          data.settings?.thankyouMessage || 'Thank you for your submission!',
        defaultRequiredField: Boolean(data.settings?.defaultRequiredField),
        showLogo: Boolean(data.settings?.showLogo),
        isEnabled:
          data.settings?.isEnabled !== undefined
            ? Boolean(data.settings.isEnabled)
            : true,
        allowMultipleSubmissions:
          data.settings?.allowMultipleSubmissions !== undefined
            ? Boolean(data.settings.allowMultipleSubmissions)
            : true,
        allowMultipleEmailSubmissions:
          data.settings?.allowMultipleEmailSubmissions !== undefined
            ? Boolean(data.settings.allowMultipleEmailSubmissions)
            : true,
        collectIpAddress:
          data.settings?.collectIpAddress !== undefined
            ? Boolean(data.settings.collectIpAddress)
            : true,
        enableCaptcha: Boolean(data.settings?.enableCaptcha),
      },
    };
  }, []);

  const performSave = useCallback(
    async (attempt = 1): Promise<void> => {
      if (!formData || !formId || saveInProgressRef.current) return;

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

        const saveData = serializeFormData(formData);

        const response = await axios.put(
          `${apiConfig.url}/forms/${formId}`,
          saveData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );

        setLastSaved(new Date());
        setRetryCount(0);

        if (formData.isPublished || forceUpdatePublished) {
          if (enableToast) {
            toast.success('Changes saved - published form updated!');
          }
        } else if (enableToast) {
          toast.success('Changes saved automatically');
        }

        if (onSaveSuccess) {
          onSaveSuccess(response.data);
        }

        console.log('✅ Form auto-saved successfully');
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          'Failed to save changes';
        setSaveError(errorMessage);
        setRetryCount(attempt);

        if (attempt < retryAttempts) {
          setTimeout(() => {
            performSave(attempt + 1);
          }, attempt * 2000);
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
      serializeFormData,
    ]
  );

  useEffect(() => {
    if (!isEnabled || !formData || !formId) return;

    const currentDataString = JSON.stringify({
      title: formData.title,
      description: formData.description,
      pages:
        formData.pages?.map((page: any) => ({
          id: page.id,
          fields:
            page.fields?.map((field: any) => ({
              id: field.id,
              type: field.type,
              label: field.label,
              required: field.required,
              helpText: field.helpText,
              labelAlignment: field.labelAlignment,
              options: Array.isArray(field.options)
                ? field.options.map((opt: any) => ({
                    label: opt.label,
                    value: opt.value,
                    type: opt.type,
                  }))
                : undefined,
              defaultValue: field.defaultValue,
              placeholder: field.placeholder,
              minLength: field.minLength,
              maxLength: field.maxLength,
              min: field.min,
              max: field.max,
              step: field.step,
              rows: field.rows,
              multiple: field.multiple,
              accept: field.accept,
            })) || [],
        })) || [],
      currentPageIndex: formData.currentPageIndex,
      selectedPageId: formData.selectedPageId,
      logo: formData.logo,
      settings: formData.settings,
    });

    if (currentDataString === lastDataRef.current) return;

    lastDataRef.current = currentDataString;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

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

  useEffect(() => {
    if (formData && formId && !hasInitialDataRef.current) {
      const timer = setTimeout(() => {
        hasInitialDataRef.current = true;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData, formId]);

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
