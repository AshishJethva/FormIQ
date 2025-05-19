// src/components/form-builder/properties-panel/PropertiesPanel.tsx
'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  updateField,
  removeField,
  duplicateField,
  togglePropertiesPanel,
  updateFormSettings,
} from '@/redux/slices/formBuilderSlice';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  X,
  Trash,
  Copy,
  Move,
  Settings as SettingsIcon,
  ChevronDown,
  Eye,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'GENERAL' | 'OPTIONS' | 'ADVANCED';
type LabelAlignmentType = 'LEFT' | 'RIGHT' | 'TOP';

export default function PropertiesPanel() {
  const dispatch = useDispatch();
  const form = useSelector((state: RootState) => state.formBuilder.form);
  const [activeTab, setActiveTab] = useState<TabType>('GENERAL');
  const panelRef = useRef<HTMLDivElement>(null);

  // Initialize state from selected field when it changes
  const field = form?.selectedFieldId
    ? form.fields.find(f => f.id === form.selectedFieldId)
    : null;

  const [labelAlignment, setLabelAlignment] = useState<LabelAlignmentType>(
    (field?.labelAlignment as LabelAlignmentType) || 'TOP'
  );
  const [isRequired, setIsRequired] = useState(field?.required || false);
  const [helpText, setHelpText] = useState(field?.helpText || '');
  const [useAsDefault, setUseAsDefault] = useState(false);

  // Update local state when selected field changes
  useEffect(() => {
    if (field) {
      setLabelAlignment((field.labelAlignment as LabelAlignmentType) || 'TOP');
      setIsRequired(field.required || false);
      setHelpText(field.helpText || '');
    }
  }, [field]);

  // Console log to debug
  useEffect(() => {
    console.log(
      'PropertiesPanel render - selected field:',
      form?.selectedFieldId
    );
    console.log('PropertiesPanel open:', form?.propertiesPanelOpen);
  }, [form?.selectedFieldId, form?.propertiesPanelOpen]);

  // Prevent panel from closing when clicking inside it
  useEffect(() => {
    const handleClickInside = (e: MouseEvent) => {
      if (panelRef.current && panelRef.current.contains(e.target as Node)) {
        e.stopPropagation();
      }
    };

    document.addEventListener('mousedown', handleClickInside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickInside, true);
    };
  }, []);

  if (!form || !field || !form.propertiesPanelOpen) return null;

  const handleClosePanel = () => {
    dispatch(togglePropertiesPanel(false));
  };

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(
      updateField({
        id: field.id,
        updates: { label: e.target.value },
      })
    );
  };

  const handleLabelAlignmentChange = (alignment: LabelAlignmentType) => {
    setLabelAlignment(alignment);
    dispatch(
      updateField({
        id: field.id,
        updates: { labelAlignment: alignment },
      })
    );
  };

  const handleRequiredToggle = () => {
    const newValue = !isRequired;
    setIsRequired(newValue);
    dispatch(
      updateField({
        id: field.id,
        updates: { required: newValue },
      })
    );
  };

  const handleHelpTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setHelpText(text);
    dispatch(
      updateField({
        id: field.id,
        updates: { helpText: text },
      })
    );
  };

  const handleSetAsDefault = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setUseAsDefault(checked);
    if (checked) {
      dispatch(
        updateFormSettings({
          defaultLabelAlignment: labelAlignment,
        })
      );
    }
  };

  const handleDuplicateField = () => {
    dispatch(duplicateField(field.id));
  };

  const handleMoveField = () => {
    alert('Move field functionality will be available soon.');
  };

  const handlePreviewField = () => {
    alert('Preview functionality will be available soon.');
  };

  const handleDeleteField = () => {
    dispatch(removeField(field.id));
  };

  const fieldTitle =
    field.type.charAt(0).toUpperCase() +
    field.type
      .slice(1)
      .replace(/([A-Z])/g, ' $1')
      .trim();

  // Panel animation variants
  const panelVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        duration: 0.3,
      },
    },
    exit: {
      x: '100%',
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.div
      ref={panelRef}
      className='properties-panel w-[335px] h-[90%] mt-29 fixed right-0 top-0 bg-gray-800 text-white overflow-y-auto shadow-lg z-30 border-l border-gray-700'
      initial='hidden'
      animate='visible'
      exit='exit'
      variants={panelVariants}
    >
      {/* Header */}
      <div className='flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900'>
        <h3 className='font-medium flex items-center'>
          <span className='w-5 h-5 mr-2 flex items-center justify-center bg-blue-500 rounded-md'>
            <SettingsIcon className='w-3 h-3' />
          </span>
          {fieldTitle} Properties
        </h3>
        <button
          onClick={handleClosePanel}
          className='text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700'
        >
          <X className='h-5 w-5' />
        </button>
      </div>

      {/* Tabs */}
      <div className='flex border-b border-gray-700 bg-gray-900/50'>
        <button
          className={`text-sm px-4 py-2 transition-colors ${
            activeTab === 'GENERAL'
              ? 'bg-orange-500 text-white font-medium'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
          onClick={() => handleTabClick('GENERAL')}
        >
          GENERAL
        </button>
        <button
          className={`text-sm px-4 py-2 transition-colors ${
            activeTab === 'OPTIONS'
              ? 'bg-orange-500 text-white font-medium'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
          onClick={() => handleTabClick('OPTIONS')}
        >
          OPTIONS
        </button>
        <button
          className={`text-sm px-4 py-2 transition-colors ${
            activeTab === 'ADVANCED'
              ? 'bg-orange-500 text-white font-medium'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
          onClick={() => handleTabClick('ADVANCED')}
        >
          ADVANCED
        </button>
      </div>

      {/* Content */}
      <div className='p-4 space-y-6'>
        {activeTab === 'GENERAL' && (
          <>
            {/* Field Label */}
            <div className='group'>
              <Label
                htmlFor='field-label'
                className='text-sm text-gray-300 mb-1 block group-hover:text-white transition-colors'
              >
                Field Label
              </Label>
              <Input
                id='field-label'
                value={field.label}
                onChange={handleLabelChange}
                className='bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 transition-all'
              />
            </div>

            {/* Label Alignment */}
            {field.type !== 'heading' && (
              <div className='group pt-2'>
                <Label className='text-sm text-gray-300 mb-2 block group-hover:text-white transition-colors'>
                  Label Alignment
                </Label>
                <div className='flex space-x-2'>
                  <button
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      labelAlignment === 'LEFT'
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => handleLabelAlignmentChange('LEFT')}
                  >
                    LEFT
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      labelAlignment === 'RIGHT'
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => handleLabelAlignmentChange('RIGHT')}
                  >
                    RIGHT
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      labelAlignment === 'TOP'
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => handleLabelAlignmentChange('TOP')}
                  >
                    TOP
                  </button>
                </div>
                <div className='mt-2 flex items-center space-x-2'>
                  <label className='flex items-center space-x-2 cursor-pointer'>
                    <input
                      type='checkbox'
                      className='h-4 w-4 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500'
                      checked={useAsDefault}
                      onChange={handleSetAsDefault}
                    />
                    <span className='text-sm text-gray-300'>
                      Set as form default
                    </span>
                  </label>
                </div>
                <p className='text-xs text-gray-400 mt-1'>
                  Select how the label text is aligned horizontally
                </p>
              </div>
            )}

            {/* Required Field */}
            {field.type !== 'heading' && (
              <div className='group border-t border-gray-700 mt-6 pt-6'>
                <div className='flex justify-between items-center mb-1'>
                  <Label
                    htmlFor='field-required'
                    className='text-sm text-gray-300 group-hover:text-white transition-colors'
                  >
                    Required
                  </Label>
                  <div
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                      isRequired ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                    onClick={handleRequiredToggle}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        isRequired ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </div>
                <p className='text-xs text-gray-400'>
                  Prevent submission if this field is empty
                </p>
              </div>
            )}

            {/* Sublabel */}
            {field.type === 'email' && (
              <div className='group pt-6 border-t border-gray-700 mt-6'>
                <Label
                  htmlFor='field-sublabel'
                  className='text-sm text-gray-300 mb-1 block group-hover:text-white transition-colors'
                >
                  Sublabel
                </Label>
                <Input
                  id='field-sublabel'
                  value={helpText}
                  onChange={handleHelpTextChange}
                  className='bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 transition-all'
                />
                <p className='text-xs text-gray-400 mt-1'>
                  Add a short description below the field
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className='flex flex-wrap gap-2 border-t border-gray-700 mt-6 pt-6'>
              <button
                className='flex items-center px-3 py-2 rounded-md text-xs font-medium transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600'
                onClick={handleDuplicateField}
              >
                <span className='mr-1.5'>
                  <Copy size={14} />
                </span>
                Duplicate
              </button>

              <button
                className='flex items-center px-3 py-2 rounded-md text-xs font-medium transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600'
                onClick={handleMoveField}
              >
                <span className='mr-1.5'>
                  <Move size={14} />
                </span>
                Move
              </button>

              <button
                className='flex items-center px-3 py-2 rounded-md text-xs font-medium transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600'
                onClick={handlePreviewField}
              >
                <span className='mr-1.5'>
                  <Eye size={14} />
                </span>
                Preview
              </button>

              <button
                className='flex items-center px-3 py-2 rounded-md text-xs font-medium transition-colors bg-red-900/40 text-red-400 hover:bg-red-900/60'
                onClick={handleDeleteField}
              >
                <span className='mr-1.5'>
                  <Trash size={14} />
                </span>
                Delete
              </button>
            </div>
          </>
        )}

        {activeTab === 'OPTIONS' && (
          <div className='flex flex-col items-center justify-center h-40 text-gray-400 p-4'>
            <SettingsIcon className='w-10 h-10 mb-4 text-gray-600' />
            <p className='text-center'>
              Additional options for this field type will be available soon
            </p>
          </div>
        )}

        {activeTab === 'ADVANCED' && (
          <div className='flex flex-col items-center justify-center h-40 text-gray-400 p-4'>
            <ChevronDown className='w-10 h-10 mb-4 text-gray-600' />
            <p className='text-center'>
              Advanced settings for this field type will be available soon
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
