'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { usePathname, useRouter } from 'next/navigation';
import { useFormId } from '@/hooks/useFormId';
import { RootState, AppDispatch } from '@/redux/store';
import {
  setPreviewMode,
  clearSelectedField,
  initializeForm,
  loadFormAsync,
  clearError,
  setForm,
} from '@/redux/slices/formBuilder/formBuilderSlice';
import AIFixedChatInput from '@/components/form-builder/AIFixedChatInput';
import UpdateHistoryPanel from '@/components/form-builder/canvas/UpdateHistoryPanel';
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
import useAutoSave from '@/hooks/useAutoSave';
import FormSubmissionsPage from './submissions/FormSubmissionsPage';

interface FormBuilderWithAIProps {
  formId: string;
}

export default function FormBuilder({ formId }: FormBuilderWithAIProps) {
  const dispatch = useDispatch<AppDispatch>();
  const aiUpdateState = useSelector((state: RootState) => state.aiFormUpdate);

  // Fallback to extract formId from URL if not provided via props
  const urlFormId = useFormId();
  const resolvedFormId = formId || urlFormId;

  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  const isUpdating = aiUpdateState?.isUpdating || false;
  const pathname = usePathname();
  const router = useRouter();

  // Handle successful AI updates by refreshing the form data
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout;

    if (aiUpdateState?.lastUpdateSummary && !isUpdating) {
      refreshTimeout = setTimeout(() => {
        refreshFormData();
      }, 500);
    }

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [aiUpdateState?.lastUpdateSummary, isUpdating, resolvedFormId]);

  const refreshFormData = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No auth token found');
        return;
      }

      if (!resolvedFormId) {
        console.error('No formId available for refresh');
        return;
      }

      const response = await fetch(`/api/forms/${resolvedFormId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const formData = await response.json();

        if (formData.success && formData.data) {
          dispatch(setForm(formData.data));
        } else {
          console.error('Invalid form data response:', formData);
          // Don't show error toast for this case - the AI update was successful
          console.warn(
            'Form update succeeded but refresh failed - continuing...'
          );
        }
      } else {
        // Check if this is a 404 or other expected error
        if (response.status === 404) {
          console.warn(
            'Form not found during refresh - this may be expected for new forms'
          );
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch form data:', {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText.substring(0, 200),
          });

          // Don't show error toast - the AI update was successful even if refresh failed
          console.warn(
            'Form update succeeded but refresh failed - continuing...'
          );
        }
      }
    } catch (error) {
      console.error('Failed to refresh form data:', error);

      // Don't show error toast - the AI update was successful even if refresh failed
      console.warn(
        'Form update succeeded but refresh failed due to network error - continuing...'
      );
    }
  };

  const formState = useSelector((state: RootState) => state.formBuilder);
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

  const { isSaving, lastSaved, saveError } = useAutoSave(
    formState.form,
    resolvedFormId || '',
    !!formState.form &&
      !formState.isPreviewMode &&
      !formState.isLoading &&
      !!resolvedFormId,
    {
      delay: isPublishedForm ? 500 : 1000,
      enableToast: false,
      retryAttempts: 3,
      forceUpdatePublished: isPublishedForm,
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

  // Load form when component mounts or formId changes
  useEffect(() => {
    const loadForm = async () => {
      if (resolvedFormId) {
        try {
          dispatch(clearError());

          const result = await dispatch(loadFormAsync(resolvedFormId));

          if (loadFormAsync.rejected.match(result)) {
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

    if (
      !formState.form ||
      (resolvedFormId && formState.form.id !== resolvedFormId)
    ) {
      loadForm();
    }
  }, [dispatch, resolvedFormId, formState.form]);

  // Handle visibility of elements panel
  useEffect(() => {
    if (currentPage !== 'BUILD') {
      setElementsVisible(false);
      setIsPanelExpanded(false);
      dispatch(clearSelectedField());
    } else if (!isPreviewEnabled) {
      setElementsVisible(true);
    }
  }, [currentPage, isPreviewEnabled, dispatch]);

  const handlePreviewToggle = (enabled: boolean) => {
    dispatch(setPreviewMode(enabled));

    if (enabled) {
      setElementsVisible(false);
      setIsPanelExpanded(false);
      dispatch(clearSelectedField());
      window.location.hash = '#preview';

      // Ensure we're on the build page
      if (!pathname.endsWith(`/build/${resolvedFormId}`)) {
        router.push(`/build/${resolvedFormId}#preview`);
      }
    } else {
      if (currentPage === 'BUILD') {
        setElementsVisible(true);
      }
      window.location.hash = '';

      // Navigate to build page if we're not already there
      if (!pathname.endsWith(`/build/${resolvedFormId}`)) {
        router.push(`/build/${resolvedFormId}`);
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
          <p className='text-gray-400 text-sm mt-2'>
            Form ID: {resolvedFormId}
          </p>
        </div>
      </div>
    );
  }

  // Show error state if form failed to load
  if (formState.error) {
    return (
      <div className='flex items-center justify-center h-screen bg-gray-100'>
        <div className='text-center max-w-md'>
          <div className='text-red-500 text-6xl mb-4'>❌</div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Error Loading Form
          </h1>
          <p className='text-gray-600 mb-4'>{formState.error}</p>
          <p className='text-gray-400 text-sm mb-4'>
            Form ID: {resolvedFormId}
          </p>
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

  // Get the actual formId - prioritize resolved formId, then form.id, then form._id
  const actualFormId =
    resolvedFormId || formState.form?.id || formState.form?._id;

  if (currentPage === 'PREVIEW' && isPreviewEnabled) {
    return <PreviewPage formId={actualFormId} />;
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
          <FormPublishPage formId={actualFormId} />
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

  // Render build page (default) with Fixed AI Chat Input
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
          {/* Elements Panel */}
          <AnimatePresence>
            {currentPage === 'BUILD' &&
              elementsVisible &&
              !isPreviewEnabled && (
                <ElementsPanel
                  onPanelToggle={handlePanelToggle}
                  forceOpen={forceOpenPanel}
                  showAIButton={false} // Hide AI button from elements panel since we have fixed chat
                />
              )}
          </AnimatePresence>

          {/* Form Canvas */}
          <FormCanvas
            isPanelExpanded={isPanelExpanded}
            onPanelToggle={handleCanvasPanelToggle}
          />

          {/* Properties Panel */}
          {formState.form.selectedFieldId &&
            formState.form.propertiesPanelOpen &&
            !isPreviewEnabled && <PropertiesPanel />}
        </div>

        {/* Fixed AI Chat Input - Always visible in BUILD mode with proper formId */}
        {actualFormId && (
          <AIFixedChatInput
            formId={actualFormId}
            isVisible={currentPage === 'BUILD' && !isPreviewEnabled}
          />
        )}

        {/* Debug info for formId (remove in production) */}
        {(!actualFormId || !resolvedFormId) && (
          <div className='fixed top-20 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-xs z-50'>
            Debug: FormId issue - Props: {formId}, URL: {urlFormId}, Resolved:{' '}
            {resolvedFormId}, Actual: {actualFormId}
          </div>
        )}

        {/* Update History Panel */}
        {actualFormId && (
          <UpdateHistoryPanel
            isOpen={showHistoryPanel}
            onClose={() => {
              setShowHistoryPanel(false);
            }}
            formId={actualFormId}
          />
        )}

        {/* AI Update Loading Overlay */}
        {isUpdating && (
          <div className='fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center'>
            <div className='bg-white rounded-xl shadow-2xl p-6 flex items-center gap-4 max-w-md'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600'></div>
              <div>
                <h3 className='font-semibold text-gray-900'>Updating Form</h3>
                <p className='text-sm text-gray-600'>
                  AI is processing your request...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DragProvider>
  );
}
