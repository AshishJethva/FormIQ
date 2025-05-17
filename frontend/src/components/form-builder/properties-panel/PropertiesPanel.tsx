// src/components/form-builder/properties-panel/PropertiesPanel.tsx
'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  updateField,
  removeField,
  clearSelectedField,
  duplicateField,
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
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'GENERAL' | 'OPTIONS' | 'ADVANCED';
type LabelAlignmentType = 'LEFT' | 'RIGHT' | 'TOP';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

interface OptionButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'destructive';
  onClick?: () => void;
}

export default function PropertiesPanel() {
  const dispatch = useDispatch();
  const form = useSelector((state: RootState) => state.formBuilder.form);
  const [activeTab, setActiveTab] = useState<TabType>('GENERAL');
  const [showPanel, setShowPanel] = useState<boolean>(false);

  // Initialize state from selected field when it changes
  const field = form?.selectedFieldId
    ? form.fields.find(f => f.id === form.selectedFieldId)
    : null;
  const [labelAlignment, setLabelAlignment] = useState<LabelAlignmentType>(
    (field?.labelAlignment as LabelAlignmentType) || 'TOP'
  );
  const [isRequired, setIsRequired] = useState(field?.required || false);
  const [helpText, setHelpText] = useState(
    field?.helpText || 'example@example.'
  );

  // Update local state when selected field changes
  useEffect(() => {
    if (field) {
      setLabelAlignment((field.labelAlignment as LabelAlignmentType) || 'TOP');
      setIsRequired(field.required || false);
      setHelpText(field.helpText || 'example@example.');
      setShowPanel(true);
    } else {
      setShowPanel(false);
    }
  }, [field]);

  if (!form || !field) return null;

  const handleClosePanel = () => {
    dispatch(clearSelectedField());
    setShowPanel(false);
  };

  const handleRequiredToggle = (required: boolean) => {
    setIsRequired(required);
    dispatch(
      updateField({
        id: field.id,
        updates: { required },
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

  const handleHelpTextChange = (text: string) => {
    setHelpText(text);
    dispatch(
      updateField({
        id: field.id,
        updates: { helpText: text },
      })
    );
  };

  const handleDeleteField = () => {
    dispatch(removeField(field.id));
    setShowPanel(false);
  };

  const handleDuplicateField = () => {
    dispatch(duplicateField(field.id));
  };

  const handleMoveField = () => {
    // Implement field movement logic
    // This would open a modal to select where to move the field
  };

  const fieldTitle =
    field.type.charAt(0).toUpperCase() +
    field.type
      .slice(1)
      .replace(/([A-Z])/g, ' $1')
      .trim();

  const panelVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: { x: '100%', opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <AnimatePresence>
      {showPanel && (
        <motion.div
          className='w-72 h-full fixed right-0 top-0 bg-gray-800 text-white overflow-y-auto shadow-lg z-20 border-l border-gray-700'
          initial='hidden'
          animate='visible'
          exit='exit'
          variants={panelVariants}
        >
          {/* Header */}
          <div className='flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900'>
            <h3 className='font-medium flex items-center'>
              <span className='w-5 h-5 mr-2 flex items-center justify-center bg-blue-500 rounded-md'>
                {field.type === 'email' ? (
                  <Mail />
                ) : field.type === 'heading' ? (
                  <Heading />
                ) : (
                  <SettingsIcon className='w-3 h-3' />
                )}
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
            <TabButton
              active={activeTab === 'GENERAL'}
              onClick={() => setActiveTab('GENERAL')}
            >
              GENERAL
            </TabButton>
            <TabButton
              active={activeTab === 'OPTIONS'}
              onClick={() => setActiveTab('OPTIONS')}
            >
              OPTIONS
            </TabButton>
            <TabButton
              active={activeTab === 'ADVANCED'}
              onClick={() => setActiveTab('ADVANCED')}
            >
              ADVANCED
            </TabButton>
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
                    onChange={e =>
                      dispatch(
                        updateField({
                          id: field.id,
                          updates: { label: e.target.value },
                        })
                      )
                    }
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
                      <OptionButton
                        active={labelAlignment === 'LEFT'}
                        onClick={() => handleLabelAlignmentChange('LEFT')}
                      >
                        LEFT
                      </OptionButton>
                      <OptionButton
                        active={labelAlignment === 'RIGHT'}
                        onClick={() => handleLabelAlignmentChange('RIGHT')}
                      >
                        RIGHT
                      </OptionButton>
                      <OptionButton
                        active={labelAlignment === 'TOP'}
                        onClick={() => handleLabelAlignmentChange('TOP')}
                      >
                        TOP
                      </OptionButton>
                    </div>
                    <div className='mt-2 flex items-center space-x-2'>
                      <label className='flex items-center space-x-2 cursor-pointer'>
                        <input
                          type='checkbox'
                          className='h-4 w-4 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500'
                          checked={true}
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
                      <button
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          isRequired ? 'bg-blue-500' : 'bg-gray-600'
                        }`}
                        onClick={() => handleRequiredToggle(!isRequired)}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            isRequired ? 'right-1' : 'left-1'
                          }`}
                        />
                      </button>
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
                      onChange={e => handleHelpTextChange(e.target.value)}
                      className='bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 transition-all'
                    />
                    <p className='text-xs text-gray-400 mt-1'>
                      Add a short description below the field
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className=' flex flex-wrap gap-2 border-t border-gray-700 mt-6 pt-6'>
                  <ActionButton
                    icon={<Copy size={14} />}
                    label='Duplicate'
                    onClick={handleDuplicateField}
                  />
                  <ActionButton
                    icon={<Move size={14} />}
                    label='Move'
                    onClick={handleMoveField}
                  />
                  <ActionButton icon={<Eye size={14} />} label='Preview' />
                  <ActionButton
                    icon={<Trash size={14} />}
                    label='Delete'
                    variant='destructive'
                    onClick={handleDeleteField}
                  />
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
      )}
    </AnimatePresence>
  );
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      className={`text-sm px-4 py-2 transition-colors ${
        active
          ? 'bg-orange-500 text-white font-medium'
          : 'text-gray-300 hover:bg-gray-700'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function OptionButton({ active, onClick, children }: OptionButtonProps) {
  return (
    <button
      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
        active
          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ActionButton({
  icon,
  label,
  variant = 'default',
  onClick,
}: ActionButtonProps) {
  return (
    <button
      className={`
        flex items-center px-3 py-2 rounded-md text-xs font-medium transition-colors
        ${
          variant === 'destructive'
            ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }
      `}
      onClick={onClick}
    >
      <span className='mr-1.5'>{icon}</span>
      {label}
    </button>
  );
}

// Small helper icon components
function Mail() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <rect width='20' height='16' x='2' y='4' rx='2' />
      <path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
    </svg>
  );
}

function Heading() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M6 12h12' />
      <path d='M6 20h12' />
      <path d='M6 4h12' />
    </svg>
  );
}
