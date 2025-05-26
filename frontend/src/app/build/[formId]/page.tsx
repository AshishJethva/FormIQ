// src/app/buid/[formId]/page.tsx
'use client';

import { Provider } from 'react-redux';
import { AppDispatch, store } from '@/redux/store';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { toast } from 'sonner';
import FormBuilder from '@/components/form-builder/FormBuilder';
import {
  initializeForm,
  loadFormAsync,
  setFormTitle,
} from '@/redux/slices/formBuilderSlice';
import axios from 'axios';
import { apiConfig } from '@/config/api';
import useAutoSave from '@/hooks/useAutoSave';

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [formExists, setFormExists] = useState(false);

  const form = useSelector((state: RootState) => state.formBuilder.form);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (formId) {
      dispatch(loadFormAsync(formId));
    }
  }, [dispatch, formId]);

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
