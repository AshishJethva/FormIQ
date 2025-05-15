'use client';
import React, { useState } from 'react';

import { FilterBar, Navbar, FormsList } from '@/components/dashboard';
import Sidebar from '@/components/dashboard/Sidebar'; // Your new sidebar
import type { SortOption } from '@/components/dashboard/FilterBar';
import {
  AlertCircle,
  FileText,
  Star,
  Archive,
  Trash2,
  Circle,
  PlusSquare,
} from 'lucide-react';

// Import any other components you need
import { Button } from '@/components/ui/button';

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

const trashedForms = [
  {
    id: 101,
    name: 'Form',
    submissions: 0,
    createdAt: 'May 11, 2025',
    lastEdited: 'May 12, 2025',
    lastSubmission: '',
    unread: false,
    daysRemaining: 29,
  },
  {
    id: 102,
    name: 'Old Survey',
    submissions: 5,
    createdAt: 'May 9, 2025',
    lastEdited: 'May 9, 2025',
    lastSubmission: '',
    unread: false,
    daysRemaining: 28,
  },
];

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('title-az');
  const [activeSection, setActiveSection] = useState('All');
  const [activeSectionData, setActiveSectionData] = useState<any>(null);

  // Handle section change from sidebar
  const handleSectionChange = (section: string, data?: any) => {
    setActiveSection(section);
    setActiveSectionData(data);
  };

  // Render different content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'All':
        return (
          <>
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
          </>
        );

      case 'Favorites':
        return (
          <>
            <div className='bg-white border-b border-gray-200 px-6 py-4'>
              <div className='flex items-center'>
                <Star className='h-5 w-5 text-amber-400 mr-2' />
                <h1 className='text-xl font-semibold'>Favorites</h1>
              </div>
            </div>
            <main className='flex-1 overflow-y-auto p-6'>
              <div className='text-center py-12 text-gray-500'>
                <Star className='h-12 w-12 mx-auto mb-4 text-gray-300' />
                <p className='text-lg mb-2'>No Favorite Forms</p>
                <p>Star forms to add them to your favorites</p>
              </div>
            </main>
          </>
        );

      case 'Drafts':
        return (
          <>
            <div className='bg-white border-b border-gray-200 px-6 py-4'>
              <div className='flex items-center'>
                <FileText className='h-5 w-5 text-blue-500 mr-2' />
                <h1 className='text-xl font-semibold'>Draft Forms</h1>
              </div>
            </div>
            <main className='flex-1 overflow-y-auto p-6'>
              <div className='text-center py-12 text-gray-500'>
                <FileText className='h-12 w-12 mx-auto mb-4 text-gray-300' />
                <p className='text-lg mb-2'>No Draft Forms</p>
                <p>Forms you haven&apos;t published yet will appear here</p>
              </div>
            </main>
          </>
        );

      case 'Archive':
        return (
          <>
            <div className='bg-white border-b border-gray-200 px-6 py-4'>
              <div className='flex items-center'>
                <Archive className='h-5 w-5 text-purple-500 mr-2' />
                <h1 className='text-xl font-semibold'>Archive</h1>
              </div>
            </div>
            <main className='flex-1 overflow-y-auto p-6'>
              <div className='text-center py-12 text-gray-500'>
                <Archive className='h-12 w-12 mx-auto mb-4 text-gray-300' />
                <p className='text-lg mb-2'>No Archived Forms</p>
                <p>Forms you archive will appear here</p>
              </div>
            </main>
          </>
        );

      case 'Trash':
        return (
          <>
            <div className='bg-white border-b border-gray-200 px-6 py-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <Trash2 className='h-5 w-5 text-red-500 mr-2' />
                  <h1 className='text-xl font-semibold'>Trash</h1>
                </div>
                <div className='text-sm text-gray-500'>
                  Forms are permanently deleted after 30 days
                </div>
              </div>
            </div>
            <main className='flex-1 overflow-y-auto p-6'>
              <div className='bg-amber-50 border border-amber-200 rounded-md mb-4 p-4 flex items-center text-amber-800'>
                <AlertCircle className='h-5 w-5 mr-2 flex-shrink-0' />
                <p>Deleted forms will be permanently removed after 30 days.</p>
              </div>

              {trashedForms.length > 0 ? (
                <div className='space-y-4'>
                  {trashedForms.map(form => (
                    <div
                      key={form.id}
                      className='border border-gray-200 rounded-md p-4 bg-white flex justify-between items-center'
                    >
                      <div>
                        <div className='font-medium'>{form.name}</div>
                        <div className='text-sm text-gray-500'>
                          Created on {form.createdAt}
                        </div>
                      </div>
                      <div className='text-sm bg-green-100 text-green-700 py-1 px-2 rounded'>
                        {form.daysRemaining} days remaining
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-12 text-gray-500'>
                  <Trash2 className='h-12 w-12 mx-auto mb-4 text-gray-300' />
                  <p className='text-lg mb-2'>Trash is Empty</p>
                  <p>Deleted forms will appear here</p>
                </div>
              )}
            </main>
          </>
        );

      case 'CreateForm':
        return (
          <>
            <div className='bg-white border-b border-gray-200 px-6 py-4'>
              <div className='flex items-center'>
                <PlusSquare className='h-5 w-5 text-green-500 mr-2' />
                <h1 className='text-xl font-semibold'>Create New Form</h1>
              </div>
            </div>
            <main className='flex-1 overflow-y-auto p-6'>
              <div className='bg-white border border-gray-200 rounded-md p-6 max-w-3xl mx-auto'>
                <h2 className='text-lg font-semibold mb-4'>Form Details</h2>

                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Form Name
                    </label>
                    <input
                      type='text'
                      className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='Enter form name'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Description (optional)
                    </label>
                    <textarea
                      className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      rows={3}
                      placeholder='Describe your form'
                    ></textarea>
                  </div>

                  <div className='pt-4 flex justify-end'>
                    <Button className='bg-[#ff6100] hover:bg-[#E65700] text-white'>
                      Create Form
                    </Button>
                  </div>
                </div>
              </div>
            </main>
          </>
        );

      default:
        // Handle label view cases that start with "label-"
        if (activeSection.startsWith('label-') && activeSectionData) {
          return (
            <>
              <div className='bg-white border-b border-gray-200 px-6 py-4'>
                <div className='flex items-center'>
                  <Circle
                    className='h-5 w-5 mr-2'
                    fill={activeSectionData.color}
                    color={activeSectionData.color}
                  />
                  <h1 className='text-xl font-semibold'>
                    {activeSectionData.name}
                  </h1>
                </div>
              </div>
              <main className='flex-1 overflow-y-auto p-6'>
                <div className='text-center py-12 text-gray-500'>
                  <div
                    className='h-12 w-12 mx-auto mb-4 rounded-full'
                    style={{ backgroundColor: activeSectionData.color }}
                  ></div>
                  <p className='text-lg mb-2'>
                    No Forms with &quot;{activeSectionData.name}&quot; Label
                  </p>
                  <p>Forms tagged with this label will appear here</p>
                </div>
              </main>
            </>
          );
        }

        // Default fallback
        return (
          <>
            <div className='bg-white border-b border-gray-200 px-6 py-4'>
              <div className='flex items-center justify-between'>
                <h1 className='text-xl font-semibold'>Dashboard</h1>
              </div>
            </div>
            <main className='flex-1 overflow-y-auto p-6'>
              <div className='text-center py-12 text-gray-500'>
                <p className='text-lg mb-2'>
                  Select a section from the sidebar
                </p>
              </div>
            </main>
          </>
        );
    }
  };

  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      <Navbar />

      <div className='flex flex-1 overflow-hidden'>
        <Sidebar onSectionChange={handleSectionChange} />

        <div className='flex-1 flex flex-col overflow-hidden'>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
