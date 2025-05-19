// src/components/form-builder/elements-panel/ElementsPanel.tsx
'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { motion } from 'framer-motion';
import DraggableElement from './DraggableElement';

export default function ElementsPanel() {
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);

  // Toggle panel expanded/collapsed state
  const togglePanel = () => {
    setIsPanelExpanded(!isPanelExpanded);
  };

  return (
    <motion.div
      className='left-0 top-0 h-full fixed z-20'
      initial={{ width: '18rem' }}
      animate={{ width: isPanelExpanded ? '18rem' : '3rem' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {!isPanelExpanded ? (
        <div className='fixed left-0 top-[25%] -translate-y-1/2 z-50'>
          <button
            className='flex items-center bg-[#2C2F4A] text-white pr-4 pl-4 py-3.5 rounded-r-full shadow-lg hover:bg-[#1f2237] transition-all'
            onClick={togglePanel}
          >
            <span className='mr-6 font-medium'>Add Element</span>
            <Plus className='w-7 h-7' />
          </button>
        </div>
      ) : (
        // Expanded state - full panel
        <div className='w-80 h-[90%] mt-29 bg-[#33384A] text-white shadow-lg flex flex-col'>
          {/* Header */}
          <div className='flex justify-between items-center p-4 border-b border-gray-700'>
            <h2 className='font-semibold text-lg'>Form Elements</h2>
            <button
              className='text-white hover:text-white transition-colors'
              onClick={togglePanel}
            >
              <X className='h-5 w-5 text-white' />
            </button>
          </div>

          {/* Elements List */}
          <div className='flex-1 overflow-y-auto bg-[#434A60] w-[96%]'>
            <>
              <DraggableElement
                icon={<Type size={20} />}
                label='Heading'
                type={FieldType.HEADING}
              />
              <DraggableElement
                icon={<User size={20} />}
                label='Full Name'
                type={FieldType.FULL_NAME}
              />
              <DraggableElement
                icon={<Mail size={20} />}
                label='Email'
                type={FieldType.EMAIL}
              />
              <DraggableElement
                icon={<MapPin size={20} />}
                label='Address'
                type={FieldType.ADDRESS}
              />
              <DraggableElement
                icon={<Phone size={20} />}
                label='Phone'
                type={FieldType.PHONE}
              />
              <DraggableElement
                icon={<Calendar size={20} />}
                label='Date Picker'
                type={FieldType.DATE_PICKER}
              />
              <DraggableElement
                icon={<Clock size={20} />}
                label='Appointment'
                type={FieldType.APPOINTMENT}
              />
              <DraggableElement
                icon={<PenTool size={20} />}
                label='Signature'
                type={FieldType.SIGNATURE}
              />
              <DraggableElement
                icon={<AlignLeft size={20} />}
                label='Fill in the Blank'
                type={FieldType.FILL_BLANK}
              />
              <DraggableElement
                icon={<ShoppingCart size={20} />}
                label='Product List'
                type={FieldType.PRODUCT_LIST}
              />
            </>
          </div>
        </div>
      )}
    </motion.div>
  );
}
