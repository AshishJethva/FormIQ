// src/components/form-builder/FormBuilder.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import {
  setPreviewMode,
  clearSelectedField,
  initializeForm,
  loadFormAsync,
  clearError,
} from '@/redux/slices/formBuilder/formBuilderSlice';
import FormBuilderHeader from './navigation/FormBuilderHeader';
import MainNavigation from './navigation/MainNavigation';
import ElementsPanel from './elements-panel/ElementsPanel';
import FormCanvas from './canvas/FormCanvas';
import PropertiesPanel from './properties-panel/PropertiesPanel';
import FormSettingsPage from './settings/FormSettingsPage';
import FormPublishPage from './publish/FormPublishPage';
import PreviewPage from './preview/PreviewPage';
import { AnimatePresence } from 'framer-motion';
import DragProvider from '@/providers/DragProvider';
import { AppDispatch } from '@/redux/store';
import useAutoSave from '@/hooks/useAutoSave';
import FormSubmissionsPage from './submissions/FormSubmissionsPage';

export default function FormBuilder() {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  const formState = useSelector((state: RootState) => state.formBuilder);
  const formId = params.formId as string;

  const isPublishedForm = formState.form?.isPublished;

  const isPreviewEnabled = useSelector(
    (state: RootState) => state.formBuilder.isPreviewMode
  );
  const [elementsVisible, setElementsVisible] = useState<boolean>(true);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [forceOpenPanel, setForceOpenPanel] = useState(false);

  // Determine current page based on pathname and preview state
  const getCurrentPage = () => {
    if (isPreviewEnabled) return 'PREVIEW';
    if (pathname.includes('/settings')) return 'SETTINGS';
    if (pathname.includes('/publish')) return 'PUBLISH';
    if (pathname.includes('/submissions')) return 'SUBMISSIONS';
    return 'BUILD';
  };

  const currentPage = getCurrentPage();

  // Auto-save hook with enhanced features
  const { isSaving, lastSaved, saveError } = useAutoSave(
    formState.form,
    formId,
    !!formState.form && !formState.isPreviewMode && !formState.isLoading,
    {
      delay: isPublishedForm ? 500 : 1000,
      enableToast: false,
      retryAttempts: 3,
      forceUpdatePublished: isPublishedForm,
      onSaveSuccess: () => {
        if (isPublishedForm) {
          console.log('Published form updated - changes are live!');
        }
      },
      onSaveError: error => {
        console.error('❌ Auto-save error:', error);
      },
    }
  );

  // Handle panel toggle callback
  const handlePanelToggle = (isExpanded: boolean) => {
    setIsPanelExpanded(isExpanded);
  };

  const handleCanvasPanelToggle = (shouldOpen: boolean) => {
    if (shouldOpen && currentPage === 'BUILD' && !isPreviewEnabled) {
      setElementsVisible(true);
      setIsPanelExpanded(true);
      setForceOpenPanel(true);

      // Reset forceOpen after a short delay
      setTimeout(() => {
        setForceOpenPanel(false);
      }, 100);
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const isPreviewFromHash = window.location.hash === '#preview';

      if (isPreviewFromHash !== isPreviewEnabled) {
        dispatch(setPreviewMode(isPreviewFromHash));
      }
    };

    // Initial check
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [dispatch, isPreviewEnabled]);

  useEffect(() => {
    // If we're navigating to a different section (settings/publish) and preview is enabled, disable it
    if (
      isPreviewEnabled &&
      (pathname.includes('/settings') ||
        pathname.includes('/publish') ||
        pathname.includes('/submissions'))
    ) {
      dispatch(setPreviewMode(false));
      window.location.hash = '';
    }
  }, [pathname, isPreviewEnabled, dispatch]);

  useEffect(() => {
    const loadForm = async () => {
      if (formId) {
        try {
          dispatch(clearError());

          const result = await dispatch(loadFormAsync(formId));

          if (loadFormAsync.fulfilled.match(result)) {
            console.log('Form loaded successfully');
          } else if (loadFormAsync.rejected.match(result)) {
            console.error('❌ Form loading failed:', result.payload);
            dispatch(initializeForm());
          }
        } catch (error) {
          console.error('❌ Form loading error:', error);

          dispatch(initializeForm());
        }
      } else {
        dispatch(initializeForm());
      }
    };

    if (!formState.form || (formId && formState.form.id !== formId)) {
      loadForm();
    }
  }, [dispatch, formId, formState.form]);

  // Handle visibility of elements panel
  useEffect(() => {
    if (currentPage !== 'BUILD') {
      setElementsVisible(false);
      setIsPanelExpanded(false); // Close panel when leaving BUILD page
      dispatch(clearSelectedField());
    } else if (!isPreviewEnabled) {
      setElementsVisible(true);
    }
  }, [currentPage, isPreviewEnabled, dispatch]);

  const handlePreviewToggle = (enabled: boolean) => {
    dispatch(setPreviewMode(enabled));

    if (enabled) {
      setElementsVisible(false);
      setIsPanelExpanded(false); // Close panel in preview mode
      dispatch(clearSelectedField());
      window.location.hash = '#preview';

      // Ensure we're on the build page
      if (!pathname.endsWith(`/build/${formId}`)) {
        router.push(`/build/${formId}#preview`);
      }
    } else {
      if (currentPage === 'BUILD') {
        setElementsVisible(true);
      }
      window.location.hash = '';

      // Navigate to build page if we're not already there
      if (!pathname.endsWith(`/build/${formId}`)) {
        router.push(`/build/${formId}`);
      }
    }
  };

  // Show loading state while form is being loaded
  if (formState.isLoading) {
    return (
      <div className='flex items-center justify-center h-screen bg-gray-100'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading form...</p>
          <p className='text-gray-400 text-sm mt-2'>Form ID: {formId}</p>
        </div>
      </div>
    );
  }

  // Show error state if form failed to load
  if (formState.error) {
    return (
      <div className='flex items-center justify-center h-screen bg-gray-100'>
        <div className='text-center max-w-md'>
          <div className='text-red-500 text-6xl mb-4'>⚠️</div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Error Loading Form
          </h1>
          <p className='text-gray-600 mb-4'>{formState.error}</p>
          <p className='text-gray-400 text-sm mb-4'>Form ID: {formId}</p>
          <button
            onClick={() => {
              dispatch(clearError());
              window.location.reload();
            }}
            className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2 cursor-pointer'
          >
            Try Again
          </button>
          <button
            onClick={() => {
              dispatch(clearError());
              dispatch(initializeForm());
            }}
            className='bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 cursor-pointer'
          >
            Create New Form
          </button>
        </div>
      </div>
    );
  }

  if (!formState.form) {
    return (
      <div className='flex items-center justify-center h-screen bg-gray-100'>
        <div className='text-center'>
          <div className='text-gray-500 text-6xl mb-4'>📝</div>
          <p className='text-gray-600 mb-4'>No form data available</p>
          <button
            onClick={() => dispatch(initializeForm())}
            className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer'
          >
            Initialize Form
          </button>
        </div>
      </div>
    );
  }

  // Calculate last saved time
  const getLastSavedDisplay = () => {
    if (isSaving) return 'Saving...';
    if (saveError) return 'Save failed';
    if (lastSaved) {
      return lastSaved.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return formState.form?.lastSaved || '00:00';
  };

  if (currentPage === 'PREVIEW' && isPreviewEnabled) {
    return <PreviewPage formId={formId} />;
  }

  // Render settings page
  if (currentPage === 'SETTINGS') {
    return (
      <div className='flex flex-col h-screen bg-gray-100 overflow-hidden'>
        <FormBuilderHeader
          title={formState.form.title || 'My Form'}
          lastSaved={getLastSavedDisplay()}
          isSaving={isSaving}
          saveError={saveError}
        />
        <MainNavigation
          isPreviewEnabled={isPreviewEnabled}
          onPreviewToggle={handlePreviewToggle}
        />
        <div className='flex-1 overflow-y-auto'>
          <FormSettingsPage />
        </div>
      </div>
    );
  }

  // Render publish page
  if (currentPage === 'PUBLISH') {
    return (
      <div className='flex flex-col h-screen bg-gray-100 overflow-hidden'>
        <FormBuilderHeader
          title={formState.form.title || 'My Form'}
          lastSaved={getLastSavedDisplay()}
          isSaving={isSaving}
          saveError={saveError}
        />
        <MainNavigation
          isPreviewEnabled={isPreviewEnabled}
          onPreviewToggle={handlePreviewToggle}
        />
        <div className='flex-1 overflow-y-auto'>
          <FormPublishPage formId={formId} />
        </div>
      </div>
    );
  }

  // Render submissions page
  if (currentPage === 'SUBMISSIONS') {
    return (
      <div className='flex flex-col h-screen bg-gray-100 overflow-hidden'>
        <FormBuilderHeader
          title={formState.form.title || 'My Form'}
          lastSaved={getLastSavedDisplay()}
          isSaving={isSaving}
          saveError={saveError}
        />
        <MainNavigation
          isPreviewEnabled={isPreviewEnabled}
          onPreviewToggle={handlePreviewToggle}
        />
        <div className='flex-1 overflow-y-auto'>
          <FormSubmissionsPage />
        </div>
      </div>
    );
  }

  // Render build page (default)
  return (
    <DragProvider>
      <div className='flex flex-col h-screen bg-[#F3F3FE] overflow-hidden'>
        {/* Header */}
        <FormBuilderHeader
          title={formState.form.title || 'My Form'}
          lastSaved={getLastSavedDisplay()}
          isSaving={isSaving}
          saveError={saveError}
        />

        {/* Navigation */}
        <MainNavigation
          isPreviewEnabled={isPreviewEnabled}
          onPreviewToggle={handlePreviewToggle}
        />

        {/* Main Content Area */}
        <div className='flex flex-1 relative overflow-hidden'>
          {/* Elements Panel - Only shown on BUILD tab when not in preview mode */}
          <AnimatePresence>
            {currentPage === 'BUILD' &&
              elementsVisible &&
              !isPreviewEnabled && (
                <ElementsPanel
                  onPanelToggle={handlePanelToggle}
                  forceOpen={forceOpenPanel}
                />
              )}
          </AnimatePresence>

          {/* Form Canvas - Pass panel state */}
          <FormCanvas
            isPanelExpanded={isPanelExpanded}
            onPanelToggle={handleCanvasPanelToggle}
          />

          {/* Properties Panel - Only shown when a field is selected and not in preview mode */}
          {formState.form.selectedFieldId &&
            formState.form.propertiesPanelOpen &&
            !isPreviewEnabled && <PropertiesPanel />}
        </div>
      </div>
    </DragProvider>
  );
}
