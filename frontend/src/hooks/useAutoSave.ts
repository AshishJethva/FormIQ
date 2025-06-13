// src/hooks/useAutoSave.ts
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

  // Enhanced field serialization with support for new field types
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

          // Fill in the blank template
          if (field.fillBlankTemplate) {
            cleanField.fillBlankTemplate = {
              beforeText: String(field.fillBlankTemplate.beforeText || ''),
              blankPlaceholder: String(
                field.fillBlankTemplate.blankPlaceholder || ''
              ),
              afterText: String(field.fillBlankTemplate.afterText || ''),
            };
          }

          // Product list configuration
          if (field.productListConfig && field.productListConfig.products) {
            cleanField.productListConfig = {
              products: field.productListConfig.products.map(
                (product: any) => ({
                  id: String(product.id || ''),
                  name: String(product.name || ''),
                  price: Number(product.price || 0),
                  quantity: Number(product.quantity || 1),
                })
              ),
            };
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
            page.fields?.map((field: any) => {
              const baseFieldData = {
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
              };

              // Add field-specific configurations
              if (field.fillBlankTemplate) {
                (baseFieldData as any).fillBlankTemplate = {
                  beforeText: field.fillBlankTemplate.beforeText,
                  blankPlaceholder: field.fillBlankTemplate.blankPlaceholder,
                  afterText: field.fillBlankTemplate.afterText,
                };
              }

              if (field.productListConfig) {
                (baseFieldData as any).productListConfig = {
                  products: field.productListConfig.products?.map(
                    (product: any) => ({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      quantity: product.quantity,
                    })
                  ),
                };
              }

              return baseFieldData;
            }) || [],
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
