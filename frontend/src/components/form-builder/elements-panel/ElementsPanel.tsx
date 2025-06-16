// src/components/form-builder/elements-panel/ElementsPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { FieldType } from '@/types/form';
import {
  X,
  Plus,
  Type,
  User,
  Mail,
  MapPin,
  Phone,
  Calendar,
  Clock,
  PenTool,
  AlignLeft,
  ShoppingCart,
  FileText,
  AlignJustify,
  MessageSquare,
  ChevronDown,
  Circle,
  CheckSquare,
  Hash,
  Upload,
  Clock3,
  Image,
  Menu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DraggableElement from './DraggableElement';

interface ElementsPanelProps {
  onPanelToggle?: (isExpanded: boolean) => void;
  forceOpen?: boolean;
}

export default function ElementsPanel({
  onPanelToggle,
  forceOpen = false,
}: ElementsPanelProps) {
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

  // Toggle panel expanded/collapsed state
  const togglePanel = () => {
    const newState = !isPanelExpanded;
    console.log('🔄 ElementsPanel togglePanel:', {
      oldState: isPanelExpanded,
      newState,
      onPanelToggle: !!onPanelToggle,
    });

    setIsPanelExpanded(newState);

    if (onPanelToggle) {
      onPanelToggle(newState);
    }
  };

  // Handle external force open
  useEffect(() => {
    console.log('🎯 ElementsPanel forceOpen effect:', {
      forceOpen,
      isPanelExpanded,
      shouldOpen: forceOpen && !isPanelExpanded,
    });

    if (forceOpen && !isPanelExpanded) {
      console.log('🚀 Force opening ElementsPanel...');
      setIsPanelExpanded(true);
      if (onPanelToggle) {
        onPanelToggle(true);
      }
    }
  }, [forceOpen, isPanelExpanded, onPanelToggle]);

  // Debug the panel state
  useEffect(() => {
    console.log('📊 ElementsPanel state changed:', {
      isPanelExpanded,
      forceOpen,
    });
  }, [isPanelExpanded, forceOpen]);

  // Mount effect with debugging
  useEffect(() => {
    console.log('🏗️ ElementsPanel mounted:', {
      isPanelExpanded,
      onPanelToggle: !!onPanelToggle,
    });

    if (onPanelToggle) {
      onPanelToggle(isPanelExpanded);
    }
  }, []);

  console.log('🔍 ElementsPanel render:', {
    isPanelExpanded,
    forceOpen,
    shouldShowPanel: isPanelExpanded,
  });

  // Animation variants for the panel
  const panelVariants = {
    collapsed: {
      x: '-100%',
      opacity: 0,
    },
    expanded: {
      x: 0,
      opacity: 1,
    },
  };

  // Animation variants for the trigger button
  const buttonVariants = {
    collapsed: {
      x: 0,
      scale: 1,
    },
    expanded: {
      x: 20,
      scale: 0.95,
    },
  };

  return (
    <>
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isPanelExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='fixed inset-0 bg-black/50 z-30 lg:hidden'
            onClick={togglePanel}
          />
        )}
      </AnimatePresence>

      {/* Floating Add Element Button */}
      <AnimatePresence>
        {!isPanelExpanded && (
          <motion.div
            variants={buttonVariants}
            initial='collapsed'
            animate={isPanelExpanded ? 'expanded' : 'collapsed'}
            exit='collapsed'
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className='fixed left-0 top-20 z-40 sm:left-4 sm:top-24'
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className='group flex items-center bg-gradient-to-r from-[#2C2F4A] to-[#3a4058] text-white px-3 py-2.5 sm:px-4 sm:py-3 rounded-r-full shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/10 relative top-18 left-[-17]'
              onClick={togglePanel}
            >
              <div className='hidden sm:flex items-center'>
                <Menu className='w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-300' />
                <span className='font-medium text-sm mr-2'>Add Element</span>
                <Plus className='w-6 h-6 ml-2 group-hover:rotate-90 transition-transform duration-300' />
              </div>
              <div className='sm:hidden flex items-center'>
                <Plus className='w-5 h-5 group-hover:rotate-90 transition-transform duration-300' />
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Panel */}
      <AnimatePresence>
        {isPanelExpanded && (
          <motion.div
            variants={panelVariants}
            initial='collapsed'
            animate='expanded'
            exit='collapsed'
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className='fixed left-0 top-30.5 h-[calc(100vh-4rem)] w-full sm:w-80 lg:w-72 xl:w-80 z-40 lg:z-20'
            style={{ width: '320px' }} // Fixed width for consistent sliding
          >
            <div className='h-full bg-gradient-to-b from-[#33384A] via-[#2a2f42] to-[#1f2237] text-white shadow-2xl flex flex-col border-r border-white/10'>
              {/* Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className='flex justify-between items-center p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-[#3a4058] to-[#33384A]'
              >
                <div className='flex items-center space-x-3'>
                  <div className='w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg'>
                    <Plus className='w-4 h-4 text-white' />
                  </div>
                  <h2 className='font-bold text-lg sm:text-xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent'>
                    Form Elements
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className='p-2 rounded-full hover:bg-white/10 transition-all duration-200 group'
                  onClick={togglePanel}
                >
                  <X className='h-5 w-5 text-gray-300 group-hover:text-white transition-colors' />
                </motion.button>
              </motion.div>

              {/* Elements List */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className='flex-1 overflow-y-auto p-4'
              >
                {/* Basic Elements Section */}
                <div className='mb-6'>
                  <h3 className='text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3 px-2'>
                    Basic Elements
                  </h3>
                  <div className='space-y-1'>
                    <DraggableElement
                      icon={<Type size={18} />}
                      label='Heading'
                      type={FieldType.HEADING}
                    />
                    <DraggableElement
                      icon={<FileText size={18} />}
                      label='Short Text'
                      type={FieldType.SHORT_TEXT}
                    />
                    <DraggableElement
                      icon={<AlignJustify size={18} />}
                      label='Long Text'
                      type={FieldType.LONG_TEXT}
                    />
                    <DraggableElement
                      icon={<MessageSquare size={18} />}
                      label='Paragraph'
                      type={FieldType.PARAGRAPH}
                    />
                    <DraggableElement
                      icon={<Hash size={18} />}
                      label='Number'
                      type={FieldType.NUMBER}
                    />
                  </div>
                </div>

                {/* Contact Elements Section */}
                <div className='mb-6'>
                  <h3 className='text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3 px-2'>
                    Contact Info
                  </h3>
                  <div className='space-y-1'>
                    <DraggableElement
                      icon={<User size={18} />}
                      label='Full Name'
                      type={FieldType.FULL_NAME}
                    />
                    <DraggableElement
                      icon={<Mail size={18} />}
                      label='Email'
                      type={FieldType.EMAIL}
                    />
                    <DraggableElement
                      icon={<Phone size={18} />}
                      label='Phone'
                      type={FieldType.PHONE}
                    />
                    <DraggableElement
                      icon={<MapPin size={18} />}
                      label='Address'
                      type={FieldType.ADDRESS}
                    />
                  </div>
                </div>

                {/* Choice Fields Section */}
                <div className='mb-6'>
                  <h3 className='text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3 px-2'>
                    Choice Fields
                  </h3>
                  <div className='space-y-1'>
                    <DraggableElement
                      icon={<ChevronDown size={18} />}
                      label='Dropdown'
                      type={FieldType.DROPDOWN}
                    />
                    <DraggableElement
                      icon={<Circle size={18} />}
                      label='Single Choice'
                      type={FieldType.SINGLE_CHOICE}
                    />
                    <DraggableElement
                      icon={<CheckSquare size={18} />}
                      label='Multiple Choice'
                      type={FieldType.MULTIPLE_CHOICE}
                    />
                  </div>
                </div>

                {/* Date & Time Section */}
                <div className='mb-6'>
                  <h3 className='text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3 px-2'>
                    Date & Time
                  </h3>
                  <div className='space-y-1'>
                    <DraggableElement
                      icon={<Calendar size={18} />}
                      label='Date Picker'
                      type={FieldType.DATE_PICKER}
                    />
                    <DraggableElement
                      icon={<Clock3 size={18} />}
                      label='Time'
                      type={FieldType.TIME}
                    />
                    <DraggableElement
                      icon={<Clock size={18} />}
                      label='Appointment'
                      type={FieldType.APPOINTMENT}
                    />
                  </div>
                </div>

                {/* Media & Files Section */}
                <div className='mb-6'>
                  <h3 className='text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3 px-2'>
                    Media & Files
                  </h3>
                  <div className='space-y-1'>
                    <DraggableElement
                      // eslint-disable-next-line jsx-a11y/alt-text
                      icon={<Image size={18} />}
                      label='Image'
                      type={FieldType.IMAGE}
                    />
                    <DraggableElement
                      icon={<Upload size={18} />}
                      label='File Upload'
                      type={FieldType.FILE_UPLOAD}
                    />
                  </div>
                </div>

                {/* Advanced Elements Section */}
                <div className='mb-8'>
                  <h3 className='text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3 px-2'>
                    Advanced
                  </h3>
                  <div className='space-y-1'>
                    <DraggableElement
                      icon={<PenTool size={18} />}
                      label='Signature'
                      type={FieldType.SIGNATURE}
                    />
                    <DraggableElement
                      icon={<AlignLeft size={18} />}
                      label='Fill in the Blank'
                      type={FieldType.FILL_BLANK}
                    />
                    <DraggableElement
                      icon={<ShoppingCart size={18} />}
                      label='Product List'
                      type={FieldType.PRODUCT_LIST}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className='p-4 border-t border-white/10 bg-gradient-to-r from-[#2a2f42] to-[#1f2237]'
              >
                <div className='text-xs text-gray-400 text-center'>
                  Drag elements to form or click to add
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
