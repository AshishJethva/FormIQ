// src/components/form-builder/elements-panel/ElementsPanel.tsx
'use client';

import { useDispatch } from 'react-redux';
import { addField } from '@/redux/slices/formBuilderSlice';
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
  CreditCard,
  ChevronsRight,
  Layers,
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface ElementItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export default function ElementsPanel() {
  const dispatch = useDispatch();
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('BASIC');

  const handleFieldAdd = (type: FieldType) => {
    dispatch(addField({ type }));
  };

  // Toggle panel expanded/collapsed state
  const togglePanel = () => {
    setIsPanelExpanded(!isPanelExpanded);
  };

  const tabs = ['BASIC', 'PAYMENTS', 'WIDGETS'];

  return (
    <motion.div
      className='left-0 top-0 h-full fixed z-20'
      initial={{ width: '18rem' }}
      animate={{ width: isPanelExpanded ? '18rem' : '3rem' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {!isPanelExpanded ? (
        // Collapsed state - just a button to expand
        // <button
        //   className='flex items-center justify-center w-12 h-12 bg-gray-800 text-white'
        //   onClick={togglePanel}
        // >
        //   <Plus className='w-5 h-5' />
        // </button>

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
        <div className='w-full h-[85%] mt-32 bg-gray-800 text-white shadow-lg flex flex-col'>
          {/* Header */}
          <div className='flex justify-between items-center p-4 border-b border-gray-700'>
            <h2 className='font-medium'>Form Elements</h2>
            <button
              className='text-gray-400 hover:text-white transition-colors'
              onClick={togglePanel}
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          {/* Tabs */}
          <div className='flex border-b border-gray-700'>
            {tabs.map(tab => (
              <button
                key={tab}
                className={`text-sm px-4 py-2 transition-colors ${
                  activeTab === tab
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Elements List */}
          <div className='flex-1 overflow-y-auto'>
            {activeTab === 'BASIC' && (
              <>
                <ElementItem
                  icon={<Type size={18} />}
                  label='Heading'
                  onClick={() => handleFieldAdd(FieldType.HEADING)}
                />
                <ElementItem
                  icon={<User size={18} />}
                  label='Full Name'
                  onClick={() => handleFieldAdd(FieldType.FULL_NAME)}
                />
                <ElementItem
                  icon={<Mail size={18} />}
                  label='Email'
                  onClick={() => handleFieldAdd(FieldType.EMAIL)}
                />
                <ElementItem
                  icon={<MapPin size={18} />}
                  label='Address'
                  onClick={() => handleFieldAdd(FieldType.ADDRESS)}
                />
                <ElementItem
                  icon={<Phone size={18} />}
                  label='Phone'
                  onClick={() => handleFieldAdd(FieldType.PHONE)}
                />
                <ElementItem
                  icon={<Calendar size={18} />}
                  label='Date Picker'
                  onClick={() => handleFieldAdd(FieldType.DATE_PICKER)}
                />
                <ElementItem
                  icon={<Clock size={18} />}
                  label='Appointment'
                  onClick={() => handleFieldAdd(FieldType.APPOINTMENT)}
                />
                <ElementItem
                  icon={<PenTool size={18} />}
                  label='Signature'
                  onClick={() => handleFieldAdd(FieldType.SIGNATURE)}
                />
                <ElementItem
                  icon={<AlignLeft size={18} />}
                  label='Fill in the Blank'
                  onClick={() => handleFieldAdd(FieldType.FILL_BLANK)}
                />
                <ElementItem
                  icon={<ShoppingCart size={18} />}
                  label='Product List'
                  onClick={() => handleFieldAdd(FieldType.PRODUCT_LIST)}
                />
              </>
            )}

            {activeTab === 'PAYMENTS' && (
              <div className='p-4 text-gray-400'>
                <div className='flex items-center justify-center flex-col p-6 text-center'>
                  <CreditCard size={36} className='mb-3 text-gray-500' />
                  <p>Payment fields will be added soon</p>
                </div>
              </div>
            )}

            {activeTab === 'WIDGETS' && (
              <div className='p-4 text-gray-400'>
                <div className='flex items-center justify-center flex-col p-6 text-center'>
                  <Layers size={36} className='mb-3 text-gray-500' />
                  <p>Widget fields will be added soon</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ElementItem({
  icon,
  label,
  isActive = false,
  onClick,
}: ElementItemProps) {
  return (
    <div
      className={`
        flex items-center px-4 py-3 cursor-pointer hover:bg-gray-700 transition-colors
        ${isActive ? 'bg-orange-500' : 'bg-transparent'}
      `}
      onClick={onClick}
    >
      <div className='w-6 h-6 flex items-center justify-center mr-3 text-gray-400'>
        {icon}
      </div>
      <span className='flex-1'>{label}</span>
      <ChevronsRight size={14} className='text-gray-500' />
    </div>
  );
}
