// src/components/form-builder/FormBuilderLayout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  setPreviewMode,
  clearSelectedField,
  initializeForm,
} from '@/redux/slices/formBuilderSlice';
import FormBuilderHeader from './navigation/FormBuilderHeader';
import MainNavigation from './navigation/MainNavigation';
import ElementsPanel from './elements-panel/ElementsPanel';
import FormCanvas from './canvas/FormCanvas';
import PropertiesPanel from './properties-panel/PropertiesPanel';
import { AnimatePresence } from 'framer-motion';
import DragProvider from '@/providers/DragProvider';
import { Toaster } from 'sonner';

export default function FormBuilderLayout() {
  const dispatch = useDispatch();
  const formState = useSelector((state: RootState) => state.formBuilder);
  const [activeTab, setActiveTab] = useState<string>('BUILD');
  const [isPreviewEnabled, setIsPreviewEnabled] = useState<boolean>(
    formState.isPreviewMode
  );
  const [elementsVisible, setElementsVisible] = useState<boolean>(true);

  // Sync preview mode with Redux state
  useEffect(() => {
    setIsPreviewEnabled(formState.isPreviewMode);
  }, [formState.isPreviewMode]);

  // Initialize the form when the component mounts
  useEffect(() => {
    dispatch(initializeForm());
  }, [dispatch]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    // Hide elements panel if not on BUILD tab
    if (tab !== 'BUILD') {
      setElementsVisible(false);
      // Clear any selected field when changing tabs
      dispatch(clearSelectedField());
    } else {
      setElementsVisible(true);
    }
  };

  const handlePreviewToggle = (enabled: boolean) => {
    setIsPreviewEnabled(enabled);
    dispatch(setPreviewMode(enabled));

    // Hide panels in preview mode
    if (enabled) {
      setElementsVisible(false);
      // Clear any selected field when entering preview mode
      dispatch(clearSelectedField());
    } else if (activeTab === 'BUILD') {
      setElementsVisible(true);
    }
  };

  // Console log to debug panel state
  useEffect(() => {
    console.log(
      'FormBuilderLayout - Selected Field:',
      formState.form?.selectedFieldId
    );
    console.log(
      'FormBuilderLayout - PropertiesPanel Open:',
      formState.form?.propertiesPanelOpen
    );
  }, [formState.form?.selectedFieldId, formState.form?.propertiesPanelOpen]);

  if (!formState.form) return null;

  return (
    <DragProvider>
      <div className='flex flex-col h-screen bg-gray-100 overflow-hidden'>
        {/* Header */}
        <FormBuilderHeader
          title={formState.form.title || 'My Form'}
          lastSaved={formState.form.lastSaved || '5:08 PM'}
        />

        {/* Navigation */}
        <MainNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isPreviewEnabled={isPreviewEnabled}
          onPreviewToggle={handlePreviewToggle}
        />

        {/* Main Content Area */}
        <div className='flex flex-1 relative overflow-hidden'>
          {/* Elements Panel - Only shown on BUILD tab when not in preview mode */}
          <AnimatePresence>
            {activeTab === 'BUILD' && elementsVisible && !isPreviewEnabled && (
              <ElementsPanel />
            )}
          </AnimatePresence>

          {/* Form Canvas */}
          <FormCanvas />

          {/* Properties Panel - Only shown when a field is selected and not in preview mode */}
          {formState.form.selectedFieldId &&
            formState.form.propertiesPanelOpen &&
            !isPreviewEnabled && <PropertiesPanel />}
        </div>
      </div>
      <Toaster position='top-right' />
    </DragProvider>
  );
}
