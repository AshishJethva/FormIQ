'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';

const Sidebar = () => {
  const [activeTab, setActiveTab] = useState('All');

  return (
    <div className='w-64 bg-[#F6F8FA] border-r border-gray-200 overflow-y-auto'>
      {/* Create button */}
      <div className='p-4'>
        <Button className='w-full bg-[#ff6100] hover:bg-[#E65700] text-white'>
          <Plus className='mr-0 h-4 w-4' /> CREATE
        </Button>
      </div>

      {/* My Workspace section */}
      <div className='px-4 py-2'>
        <div className='flex justify-between items-center mb-2'>
          <p className='text-sm text-gray-600'>My Workspace</p>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='text-gray-400'
          >
            <circle cx='12' cy='12' r='1' />
            <circle cx='12' cy='5' r='1' />
            <circle cx='12' cy='19' r='1' />
          </svg>
        </div>

        <div
          className={`flex items-center p-3 rounded-md cursor-pointer ${
            activeTab === 'All' ? 'bg-blue-100' : 'hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('All')}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-3'
          >
            <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
            <rect x='7' y='7' width='3' height='3' />
            <rect x='14' y='7' width='3' height='3' />
            <rect x='7' y='14' width='3' height='3' />
            <rect x='14' y='14' width='3' height='3' />
          </svg>
          <span className='text-sm'>All</span>
        </div>

        <div
          className='flex items-center p-3 rounded-md cursor-pointer hover:bg-gray-100'
          onClick={() => {}}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-3 text-gray-500'
          >
            <line x1='12' y1='5' x2='12' y2='19' />
            <line x1='5' y1='12' x2='19' y2='12' />
          </svg>
          <span className='text-sm text-gray-600'>Create label</span>
        </div>
      </div>

      <div className='border-t border-gray-200 my-2'></div>

      {/* Essential options that replace collaboration features */}
      <div className='px-4 py-2'>
        <div
          className={`flex items-center p-3 rounded-md cursor-pointer ${
            activeTab === 'Favorites' ? 'bg-blue-100' : 'hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('Favorites')}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-3'
          >
            <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' />
          </svg>
          <span className='text-sm'>Favorites</span>
        </div>

        <div
          className={`flex items-center p-3 rounded-md cursor-pointer ${
            activeTab === 'Sent' ? 'bg-blue-100' : 'hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('Sent')}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-3'
          >
            <polyline points='22 12 16 12 14 15 10 15 8 12 2 12' />
            <path d='M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z' />
          </svg>
          <span className='text-sm'>Sent</span>
        </div>

        <div
          className={`flex items-center p-3 rounded-md cursor-pointer ${
            activeTab === 'Drafts' ? 'bg-blue-100' : 'hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('Drafts')}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-3'
          >
            <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
            <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
          </svg>
          <span className='text-sm'>Drafts</span>
        </div>

        <div
          className={`flex items-center p-3 rounded-md cursor-pointer ${
            activeTab === 'Archive' ? 'bg-blue-100' : 'hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('Archive')}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-3'
          >
            <polyline points='21 8 21 21 3 21 3 8' />
            <rect x='1' y='3' width='22' height='5' />
            <line x1='10' y1='12' x2='14' y2='12' />
          </svg>
          <span className='text-sm'>Archive</span>
        </div>

        <div
          className={`flex items-center p-3 rounded-md cursor-pointer ${
            activeTab === 'Trash' ? 'bg-blue-100' : 'hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('Trash')}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-3'
          >
            <polyline points='3 6 5 6 21 6' />
            <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
          </svg>
          <span className='text-sm'>Trash</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
