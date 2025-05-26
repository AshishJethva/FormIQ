// // src/components/form-builder/FormBuilder.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { RootState } from '@/redux/store';
// import {
//   setPreviewMode,
//   clearSelectedField,
//   initializeForm,
// } from '@/redux/slices/formBuilderSlice';
// import FormBuilderHeader from './navigation/FormBuilderHeader';
// import MainNavigation from './navigation/MainNavigation';
// import ElementsPanel from './elements-panel/ElementsPanel';
// import FormCanvas from './canvas/FormCanvas';
// import PropertiesPanel from './properties-panel/PropertiesPanel';
// import { AnimatePresence } from 'framer-motion';
// import DragProvider from '@/providers/DragProvider';

// export default function FormBuilder({ lastSaved }: { lastSaved?: string }) {
//   const dispatch = useDispatch();
//   const formState = useSelector((state: RootState) => state.formBuilder);
//   const [activeTab, setActiveTab] = useState<string>('BUILD');
//   const [isPreviewEnabled, setIsPreviewEnabled] = useState<boolean>(
//     formState.isPreviewMode
//   );
//   const [elementsVisible, setElementsVisible] = useState<boolean>(true);

//   // Sync preview mode with Redux state
//   useEffect(() => {
//     setIsPreviewEnabled(formState.isPreviewMode);
//   }, [formState.isPreviewMode]);

//   // Initialize the form when the component mounts
//   useEffect(() => {
//     dispatch(initializeForm());
//   }, [dispatch]);

//   const handleTabChange = (tab: string) => {
//     setActiveTab(tab);

//     // Hide elements panel if not on BUILD tab
//     if (tab !== 'BUILD') {
//       setElementsVisible(false);
//       // Clear any selected field when changing tabs
//       dispatch(clearSelectedField());
//     } else {
//       setElementsVisible(true);
//     }
//   };

//   const handlePreviewToggle = (enabled: boolean) => {
//     setIsPreviewEnabled(enabled);
//     dispatch(setPreviewMode(enabled));

//     // Hide panels in preview mode
//     if (enabled) {
//       setElementsVisible(false);
//       // Clear any selected field when entering preview mode
//       dispatch(clearSelectedField());
//     } else if (activeTab === 'BUILD') {
//       setElementsVisible(true);
//     }
//   };

//   // Console log to debug panel state
//   useEffect(() => {
//     console.log(
//       'FormBuilderLayout - Selected Field:',
//       formState.form?.selectedFieldId
//     );
//     console.log(
//       'FormBuilderLayout - PropertiesPanel Open:',
//       formState.form?.propertiesPanelOpen
//     );
//   }, [formState.form?.selectedFieldId, formState.form?.propertiesPanelOpen]);

//   if (!formState.form) return null;

//   return (
//     <DragProvider>
//       <div className='flex flex-col h-screen bg-gray-100 overflow-hidden'>
//         {/* Header */}
//         <FormBuilderHeader
//           title={formState.form.title || 'My Form'}
//           lastSaved={lastSaved ||  '00:00 UTC'}
//         />

//         {/* Navigation */}
//         <MainNavigation
//           activeTab={activeTab}
//           onTabChange={handleTabChange}
//           isPreviewEnabled={isPreviewEnabled}
//           onPreviewToggle={handlePreviewToggle}
//         />

//         {/* Main Content Area */}
//         <div className='flex flex-1 relative overflow-hidden'>
//           {/* Elements Panel - Only shown on BUILD tab when not in preview mode */}
//           <AnimatePresence>
//             {activeTab === 'BUILD' && elementsVisible && !isPreviewEnabled && (
//               <ElementsPanel />
//             )}
//           </AnimatePresence>

//           {/* Form Canvas */}
//           <FormCanvas />

//           {/* Properties Panel - Only shown when a field is selected and not in preview mode */}
//           {formState.form.selectedFieldId &&
//             formState.form.propertiesPanelOpen &&
//             !isPreviewEnabled && <PropertiesPanel />}
//         </div>
//       </div>
//     </DragProvider>
//   );
// }

// src/components/form-builder/FormBuilder.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { usePathname, useParams } from 'next/navigation';
import { RootState } from '@/redux/store';
import {
  setPreviewMode,
  clearSelectedField,
  initializeForm,
  saveFormAsync,
} from '@/redux/slices/formBuilderSlice';
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

export default function FormBuilder() {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  const params = useParams();

  const formState = useSelector((state: RootState) => state.formBuilder);
  const formId = params.formId as string;

  const [isPreviewEnabled, setIsPreviewEnabled] = useState<boolean>(false);
  const [elementsVisible, setElementsVisible] = useState<boolean>(true);

  // Determine current page based on pathname
  const getCurrentPage = () => {
    if (pathname.includes('/settings')) return 'SETTINGS';
    if (pathname.includes('/publish')) return 'PUBLISH';
    if (pathname.includes('#preview') || isPreviewEnabled) return 'PREVIEW';
    return 'BUILD';
  };

  const currentPage = getCurrentPage();

  // Auto-save hook with enhanced features
  const { isSaving, lastSaved, saveError } = useAutoSave(
    formState.form,
    formId,
    !!formState.form && !formState.isPreviewMode, // Only auto-save when not in preview
    {
      delay: 2000, // 2 second delay
      enableToast: false, // Don't show toast for auto-save (only manual saves)
      retryAttempts: 3,
      onSaveSuccess: data => {
        console.log('Form saved successfully:', data);
      },
      onSaveError: error => {
        console.error('Auto-save error:', error);
      },
    }
  );

  // Manual save function
  const handleManualSave = async () => {
    if (formState.form && formId) {
      try {
        await dispatch(saveFormAsync(formId));
      } catch (error) {
        console.error('Manual save failed:', error);
      }
    }
  };

  // Sync preview mode with URL hash
  useEffect(() => {
    const isPreview = window.location.hash === '#preview';
    setIsPreviewEnabled(isPreview);
    dispatch(setPreviewMode(isPreview));
  }, [dispatch, pathname]);

  // Initialize the form when the component mounts
  useEffect(() => {
    dispatch(initializeForm());
  }, [dispatch]);

  // Handle visibility of elements panel
  useEffect(() => {
    if (currentPage !== 'BUILD') {
      setElementsVisible(false);
      dispatch(clearSelectedField());
    } else if (!isPreviewEnabled) {
      setElementsVisible(true);
    }
  }, [currentPage, isPreviewEnabled, dispatch]);

  const handlePreviewToggle = (enabled: boolean) => {
    setIsPreviewEnabled(enabled);
    dispatch(setPreviewMode(enabled));

    if (enabled) {
      setElementsVisible(false);
      dispatch(clearSelectedField());
      window.location.hash = '#preview';
    } else {
      if (currentPage === 'BUILD') {
        setElementsVisible(true);
      }
      window.location.hash = '';
    }
  };

  // Show loading state while form is being loaded
  if (formState.isLoading) {
    return (
      <div className='flex items-center justify-center h-screen bg-gray-100'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading form...</p>
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
          <button
            onClick={() => window.location.reload()}
            className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!formState.form) return null;

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

  // Render preview page
  if (currentPage === 'PREVIEW' || isPreviewEnabled) {
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
          onManualSave={handleManualSave}
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
          onManualSave={handleManualSave}
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

  // Render build page (default)
  return (
    <DragProvider>
      <div className='flex flex-col h-screen bg-gray-100 overflow-hidden'>
        {/* Header */}
        <FormBuilderHeader
          title={formState.form.title || 'My Form'}
          lastSaved={getLastSavedDisplay()}
          isSaving={isSaving}
          saveError={saveError}
          onManualSave={handleManualSave}
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
              !isPreviewEnabled && <ElementsPanel />}
          </AnimatePresence>

          {/* Form Canvas */}
          <FormCanvas />

          {/* Properties Panel - Only shown when a field is selected and not in preview mode */}
          {formState.form.selectedFieldId &&
            formState.form.propertiesPanelOpen &&
            !isPreviewEnabled && <PropertiesPanel />}
        </div>
      </div>
    </DragProvider>
  );
}
