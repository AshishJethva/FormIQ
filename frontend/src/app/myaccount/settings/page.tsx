// src/app/myaccount/settings/page.tsx
'use client';

import React from 'react';

// Mock settings data
const mockSettings = {
  timezone: 'EST',
  timeFormat: 'ISO 8601 - YMD',
  language: 'English',
  subscriptions: {
    monthlyNewsletters: false,
    educationalEmails: false,
    promotions: false,
    inspirationalArticles: false,
    allEmails: true,
  },
};

export default function SettingsPage() {
  const handleEdit = (setting: string) => {
    console.log(`Edit ${setting} clicked`);
  };

  const handleAddSenderEmail = () => {
    console.log('Add sender email clicked');
  };

  const handleClearCache = () => {
    console.log('Clear cache clicked');
  };

  const renderField = (
    label: string,
    value: React.ReactNode,
    onEdit?: () => void
  ) => (
    <div className='border-b border-gray-200'>
      <div className='flex py-6'>
        <div className='w-1/3'>
          <h3 className='text-[15px] font-medium text-gray-800'>{label}</h3>
        </div>
        <div className='w-2/3 flex justify-between items-center'>
          <div className='text-[15px] text-gray-800'>{value}</div>
          {onEdit && (
            <button
              onClick={onEdit}
              className='text-blue-600 hover:text-blue-800 text-sm font-medium'
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className='py-8 px-10'>
        <h1 className='text-2xl font-semibold text-navy-900'>
          Update Your <span className='text-green-600'>Settings</span>
        </h1>
      </div>

      <div className='px-10'>
        {renderField('Timezone', mockSettings.timezone, () =>
          handleEdit('timezone')
        )}

        {renderField('Time Format', mockSettings.timeFormat, () =>
          handleEdit('timeFormat')
        )}

        {renderField('Language', mockSettings.language, () =>
          handleEdit('language')
        )}

        <div className='border-b border-gray-200'>
          <div className='flex py-6'>
            <div className='w-1/3'>
              <h3 className='text-[15px] font-medium text-gray-800'>
                Subscriptions
              </h3>
            </div>
            <div className='w-2/3'>
              <div className='space-y-4'>
                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={mockSettings.subscriptions.monthlyNewsletters}
                    onChange={() => {}}
                    className='h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500'
                  />
                  <span className='ml-2 text-[15px] text-gray-800'>
                    Monthly Newsletters
                  </span>
                </label>

                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={mockSettings.subscriptions.educationalEmails}
                    onChange={() => {}}
                    className='h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500'
                  />
                  <span className='ml-2 text-[15px] text-gray-800'>
                    Educational Emails
                  </span>
                </label>

                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={mockSettings.subscriptions.promotions}
                    onChange={() => {}}
                    className='h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500'
                  />
                  <span className='ml-2 text-[15px] text-gray-800'>
                    FormIQ Promotions
                  </span>
                </label>

                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={mockSettings.subscriptions.inspirationalArticles}
                    onChange={() => {}}
                    className='h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500'
                  />
                  <span className='ml-2 text-[15px] text-gray-800'>
                    Inspirational Articles
                  </span>
                </label>

                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={mockSettings.subscriptions.allEmails}
                    onChange={() => {}}
                    className='h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500'
                  />
                  <span className='ml-2 text-[15px] text-gray-800'>
                    Turn off all FormIQ emails
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {renderField(
          'Sender Emails',
          <button
            className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors'
            onClick={handleAddSenderEmail}
          >
            Add Sender Email
          </button>
        )}

        {renderField(
          'Form Caches',
          <button
            className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors'
            onClick={handleClearCache}
          >
            Clear Cache
          </button>
        )}
      </div>
    </div>
  );
}
