'use client';
import React, { useState } from 'react';

import { FilterBar, Navbar, Sidebar, FormsList } from '@/components/dashboard';
import type { SortOption } from '@/components/dashboard/FilterBar';

const mockForms = [
  {
    id: 1,
    name: 'Form',
    submissions: 0,
    createdAt: 'May 11, 2025',
    lastEdited: 'May 12, 2025',
    lastSubmission: '',
    unread: false,
  },
  {
    id: 2,
    name: 'React Developer Job Application',
    submissions: 3,
    createdAt: 'May 8, 2025',
    lastEdited: 'May 10, 2025',
    lastSubmission: 'May 14, 2025',
    unread: true,
  },
  {
    id: 3,
    name: 'Customer Feedback Survey',
    submissions: 12,
    createdAt: 'May 5, 2025',
    lastEdited: 'May 7, 2025',
    lastSubmission: 'May 13, 2025',
    unread: true,
  },
  {
    id: 4,
    name: 'Event Registration',
    submissions: 8,
    createdAt: 'May 9, 2025',
    lastEdited: 'May 9, 2025',
    lastSubmission: 'May 14, 2025',
    unread: false,
  },
];

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('title-az');

  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      <Navbar />

      <div className='flex flex-1 overflow-hidden'>
        <Sidebar />

        <div className='flex-1 flex flex-col overflow-hidden'>
          <div className='bg-white border-b border-gray-200 px-6 py-4'>
            <div className='flex items-center justify-between'>
              <h1 className='text-xl font-semibold'>My Forms</h1>
              <FilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            </div>
          </div>

          <main className='flex-1 overflow-y-auto p-6'>
            <FormsList
              forms={mockForms}
              searchTerm={searchTerm}
              sortBy={sortBy}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
