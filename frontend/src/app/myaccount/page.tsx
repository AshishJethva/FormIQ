// src/app/myaccount/page.tsx
'use client';

import React from 'react';
import Image from 'next/image';

// Mock user data - in a real app, this would come from an API or context
const mockUserData = {
  accountType: 'Free',
  username: 'procoder1501',
  name: 'Ashish Coder',
  avatar: null, // Path to the parrot avatar image
  phoneNumber: null,
  website: null,
  email: 'procoder1501@gmail.com',
};

export default function AccountPage() {
  const handleEditField = (field: string) => {
    console.log(`Edit ${field} clicked`);
  };

  const handleResetPassword = () => {
    console.log('Reset password clicked');
  };

  const handleAddPhone = () => {
    console.log('Add phone number clicked');
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
          Update <span className='text-green-600'>Account</span> and General
          Information
        </h1>
      </div>

      <div className='px-10'>
        {renderField(
          'Account Type',
          <div className='flex items-center'>
            <span>{mockUserData.accountType}</span>
            <button className='ml-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors'>
              Upgrade Account
            </button>
          </div>
        )}

        {renderField('Username', mockUserData.username, () =>
          handleEditField('username')
        )}

        {renderField(
          'Password',
          <button
            onClick={handleResetPassword}
            className='text-blue-600 hover:text-blue-800 text-sm font-medium'
          >
            Reset Password
          </button>
        )}

        {renderField('Name', mockUserData.name, () => handleEditField('name'))}

        {renderField(
          'Avatar',
          <div className='bg-gray-100 rounded p-2 inline-block'>
            <Image
              src='/parrot-avatar.png'
              alt='Avatar'
              width={48}
              height={48}
              className='rounded'
            />
          </div>,
          () => handleEditField('avatar')
        )}

        {renderField(
          'Phone Number',
          <button
            className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors'
            onClick={handleAddPhone}
          >
            Add Phone Number
          </button>
        )}

        {renderField('Website', '-', () => handleEditField('website'))}

        {renderField(
          'Email',
          <div className='flex items-center'>
            <span>{mockUserData.email}</span>
            <Image
              src='https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg'
              alt='Google'
              width={20}
              height={20}
              className='ml-2'
            />
          </div>,
          () => handleEditField('email')
        )}

        {/* Backup Email field would go here */}
      </div>
    </div>
  );
}
