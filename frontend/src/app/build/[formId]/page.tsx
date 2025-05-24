// src/app/form-builder/page.tsx
'use client';

import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { toast } from 'sonner';
import FormBuilder from '@/components/form-builder/FormBuilder';
import { initializeForm, setFormTitle } from '@/redux/slices/formBuilderSlice';
import axios from 'axios';
import { apiConfig } from '@/config/api';

// Auto-save hook
const useAutoSave = (
  formData: any,
  formId: string,
  isEnabled: boolean = true
) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>('');

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

    // Set new timeout for auto-save (2 seconds after last change)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);

        const token = localStorage.getItem('token');
        await axios.put(
          `${apiConfig.url}/forms/${formId}`,
          {
            title: formData.title,
            description: formData.description,
            pages: formData.pages,
            selectedFieldId: formData.selectedFieldId,
            selectedPageId: formData.selectedPageId,
            currentPageIndex: formData.currentPageIndex,
            propertiesPanelOpen: formData.propertiesPanelOpen,
            logo: formData.logo,
            settings: formData.settings,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        setLastSaved(new Date());
        console.log('Form auto-saved successfully');
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast.error('Failed to auto-save form changes');
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, formId, isEnabled]);

  return { isSaving, lastSaved };
};

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const formId = params.formId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [formExists, setFormExists] = useState(false);

  const form = useSelector((state: RootState) => state.formBuilder.form);

  // Enable auto-save after form is loaded
  const { lastSaved } = useAutoSave(form, formId, formExists);

  // Load form data from backend
  useEffect(() => {
    const loadForm = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        // Try to fetch existing form
        try {
          const response = await axios.get(`${apiConfig.url}/forms/${formId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const formData = response.data.data;
          console.log('Loaded form data:', formData);

          // Initialize form builder with loaded data
          dispatch(initializeForm());
          dispatch(setFormTitle(formData.title));

          // Update form state with loaded data
          // You might need to create additional actions to fully load the form state
          setFormExists(true);
        } catch (fetchError: any) {
          console.log(
            'Form not found, might be a new form:',
            fetchError.response?.status
          );

          if (fetchError.response?.status === 404) {
            // Form doesn't exist yet - initialize with empty form
            dispatch(initializeForm());
            setFormExists(true);
          } else {
            throw fetchError;
          }
        }
      } catch (error) {
        console.error('Failed to load form:', error);
        setHasError(true);
        toast.error('Failed to load form');
      } finally {
        setIsLoading(false);
      }
    };

    if (formId) {
      loadForm();
    }
  }, [formId, dispatch, router]);

  // Handle user actions that trigger immediate saves
  const handleFieldAction = async (action: string) => {
    if (!formExists) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${apiConfig.url}/forms/${formId}`,
        {
          title: form?.title,
          description: form?.description,
          pages: form?.pages,
          selectedFieldId: form?.selectedFieldId,
          selectedPageId: form?.selectedPageId,
          currentPageIndex: form?.currentPageIndex,
          propertiesPanelOpen: form?.propertiesPanelOpen,
          logo: form?.logo,
          settings: form?.settings,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`Form saved after ${action}`);
    } catch (error) {
      console.error(`Failed to save form after ${action}:`, error);
      toast.error(`Failed to save ${action}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-100'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading form builder...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-100'>
        <div className='text-center'>
          <div className='text-red-500 text-6xl mb-4'>⚠️</div>
          <h1 className='text-2xl font-bold text-gray-800 mb-2'>
            Failed to Load Form
          </h1>
          <p className='text-gray-600 mb-4'>
            There was an error loading the form builder.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors'
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <Provider store={store}>
      <div className='relative'>
        <FormBuilder lastSaved={lastSaved?.toISOString()} />
      </div>
    </Provider>
  );
}
